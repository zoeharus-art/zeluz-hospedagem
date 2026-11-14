'use strict';

const crypto = require('node:crypto');

const ROOT = 'rh-entrevistas-v1/entrevistas';
const ACOES = Object.freeze(['criar', 'editar', 'cancelar', 'reativar']);
const PRINCIPAIS = Object.freeze(['adriana', 'marcia']);
const COMANDO_KEYS = Object.freeze(['acao', 'dia', 'id', 'requestId', 'expectedRevision', 'expectedFingerprint', 'avaliacao', 'motivo']);
const AVALIACAO_KEYS = Object.freeze(['tipo', 'nome', 'vaga', 'telefone', 'hora']);

function txt(v) { return typeof v === 'string' ? v.trim() : ''; }
function clone(v) { return v == null ? v : JSON.parse(JSON.stringify(v)); }
function erro(codigo) { const e = new Error(codigo); e.code = codigo; return e; }
function chavesPermitidas(obj, permitidas) { return !!obj && typeof obj === 'object' && !Array.isArray(obj) && Object.keys(obj).every(k => permitidas.includes(k)); }
function idOk(v) { return typeof v === 'string' && !!v && !/[.#$\[\]\/]/.test(v) && v.length <= 160; }
function diaOk(v) { if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false; const d = new Date(v + 'T12:00:00Z'); return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v; }
function mesOk(v) { return /^\d{4}-(0[1-9]|1[0-2])$/.test(v); }
function tel(v) { const n = txt(v).replace(/\D/g, ''); return (n.length === 12 || n.length === 13) && n.slice(0, 2) === '55' ? '+' + n : n.length === 10 || n.length === 11 ? '+55' + n : ''; }
function hash(v) { return crypto.createHash('sha256').update(String(v), 'utf8').digest('hex'); }
function caminho(dia, id) { return ROOT + '/' + dia + (id ? '/' + id : ''); }
function idCriacao(token) { if (!token || token.length > 32) return ''; let h = 'e'; for (let i = 0; i < token.length; i++) h += token.charCodeAt(i).toString(16).padStart(4, '0'); return h; }
function fingerprint(v) { return 'entrevista150-' + hash(JSON.stringify([v.nome, v.vaga, v.telefone, v.hora, v.revisao, v.cancelamento || null])).slice(0, 24); }

function normalizarCampos(v) {
  v = v || {};
  const o = { nome: txt(v.nome), vaga: txt(v.vaga), telefone: tel(v.telefone), hora: txt(v.hora) };
  if (!o.nome || o.nome.length > 60 || !o.vaga || o.vaga.length > 140 || !o.telefone || !/^([01]\d|2[0-3]):[0-5]\d$/.test(o.hora)) throw erro('CAMPOS_INVALIDOS');
  return o;
}
function campos(v) {
  if (!chavesPermitidas(v, AVALIACAO_KEYS) || (v.tipo != null && v.tipo !== 'entrevista')) throw erro('CAMPOS_INVALIDOS');
  return normalizarCampos(v);
}

function autorValido(a) { return !!a && PRINCIPAIS.includes(a.id) && !!txt(a.nome) && txt(a.nome).length <= 80; }
function historicoValido(h) {
  return Array.isArray(h) && h.length >= 1 && h.length <= 20 && h.every(x => chavesPermitidas(x, ['acao', 'revisao', 'autorId', 'autorNome', 'ts']) && ACOES.includes(x.acao) && Number.isInteger(x.revisao) && x.revisao > 0 && PRINCIPAIS.includes(x.autorId) && !!txt(x.autorNome) && Number.isFinite(x.ts) && x.ts > 0);
}
function cancelamentoValido(c) {
  if (c == null) return true;
  if (!chavesPermitidas(c, ['ativo', 'motivo', 'autorId', 'autorNome', 'ts', 'quando', 'historico']) || typeof c.ativo !== 'boolean' || !PRINCIPAIS.includes(c.autorId) || !txt(c.autorNome) || !Number.isFinite(c.ts) || c.ts <= 0 || !txt(c.quando) || !Array.isArray(c.historico) || c.historico.length < 1 || c.historico.length > 20) return false;
  if (txt(c.motivo).length > 300) return false;
  return c.historico.every(x => chavesPermitidas(x, ['ativo', 'motivo', 'autorId', 'autorNome', 'ts', 'quando']) && typeof x.ativo === 'boolean' && txt(x.motivo).length <= 300 && PRINCIPAIS.includes(x.autorId) && !!txt(x.autorNome) && Number.isFinite(x.ts) && x.ts > 0 && !!txt(x.quando));
}
function registroValido(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
  const permitidas = ['nome', 'vaga', 'telefone', 'hora', 'revisao', 'autorId', 'autorNome', 'ts', 'quando', 'historico', 'criacaoToken', 'criacaoConteudo', 'cancelamento'];
  if (!Object.keys(v).every(k => permitidas.includes(k))) return false;
  let c; try { c = normalizarCampos(v); } catch (_) { return false; }
  return c.nome === v.nome && c.vaga === v.vaga && c.telefone === v.telefone && c.hora === v.hora && Number.isInteger(v.revisao) && v.revisao > 0 && PRINCIPAIS.includes(v.autorId) && !!txt(v.autorNome) && Number.isFinite(v.ts) && v.ts > 0 && !!txt(v.quando) && !!txt(v.criacaoToken) && v.criacaoToken.length <= 32 && /^[0-9a-f]{64}$/.test(txt(v.criacaoConteudo)) && historicoValido(v.historico) && cancelamentoValido(v.cancelamento);
}
function registros(v) {
  if (v == null) return {};
  if (!v || typeof v !== 'object' || Array.isArray(v)) throw erro('FONTE_INVALIDA');
  for (const k of Object.keys(v)) if (!idOk(k) || !registroValido(v[k])) throw erro('FONTE_INVALIDA');
  return v;
}
function item(dia, id, v) {
  const cancelada = !!(v.cancelamento && v.cancelamento.ativo === true);
  return { id, dia, tipo: 'entrevista', nome: v.nome, vaga: v.vaga, telefone: v.telefone, hora: v.hora, revisao: v.revisao, fingerprint: fingerprint(v), quem: v.autorNome, quando: v.quando, estado: cancelada ? 'cancelada' : 'pendente', cancelada, confirmada: false, cancelamento: cancelada ? { motivo: txt(v.cancelamento.motivo), quem: txt(v.cancelamento.autorNome), quando: txt(v.cancelamento.quando) } : null, espelhoOk: null };
}

function dataHora(agora) {
  const n = Number(agora()), d = new Date(n);
  if (!Number.isFinite(n) || Number.isNaN(d.getTime())) throw erro('HORA_INDISPONIVEL');
  return { ts: n, quando: new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(d) };
}

function lerUmaVez(ref, op) {
  return new Promise((resolve, reject) => {
    let terminou = false, timer;
    function limpar() { if (timer) op.clearTimeout(timer); try { ref.off('value', ok); } catch (_) {} }
    function fim(fn, valor) { if (terminou) return; terminou = true; limpar(); fn(valor); }
    function ok(snapshot) { fim(resolve, snapshot); }
    function falha() { fim(reject, erro('BANCO_INDISPONIVEL')); }
    timer = op.setTimeout(() => fim(reject, erro('BANCO_TIMEOUT')), op.timeoutMs);
    try { ref.on('value', ok, falha); } catch (_) { fim(reject, erro('BANCO_INDISPONIVEL')); }
  });
}

function criarDados(op) {
  op = op || {};
  if (!op.banco || typeof op.banco.ref !== 'function') throw erro('BANCO_ADMIN_OBRIGATORIO');
  const agora = typeof op.agora === 'function' ? op.agora : Date.now;
  const timeoutMs = Number(op.timeoutMs);
  if (!Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 30_000) throw erro('TIMEOUT_INVALIDO');
  const leitura = { timeoutMs, setTimeout: op.setTimeout || setTimeout, clearTimeout: op.clearTimeout || clearTimeout };

  async function listarDia(dia) {
    if (!diaOk(dia)) throw erro('DIA_INVALIDO');
    const snap = await lerUmaVez(op.banco.ref(caminho(dia)), leitura);
    const mapa = registros(snap && typeof snap.val === 'function' ? snap.val() : undefined);
    return { dia, estado: 'pronto', itens: Object.keys(mapa).map(id => item(dia, id, mapa[id])) };
  }

  async function listarMes(mes) {
    if (!mesOk(mes)) throw erro('MES_INVALIDO');
    const p = mes.split('-').map(Number), ultimo = new Date(Date.UTC(p[0], p[1], 0, 12)).getUTCDate(), max = mes + '-' + String(ultimo).padStart(2, '0');
    let q;
    try { q = op.banco.ref(ROOT).orderByKey().startAt(mes + '-01').endAt(max).limitToFirst(31); } catch (_) { throw erro('BANCO_INDISPONIVEL'); }
    const snap = await lerUmaVez(q, leitura), raw = snap && typeof snap.val === 'function' ? snap.val() : undefined;
    if (raw == null) return { mes, estado: 'pronto', dias: {} };
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw erro('FONTE_INVALIDA');
    const dias = {};
    for (const dia of Object.keys(raw)) {
      if (!diaOk(dia) || dia.slice(0, 7) !== mes) throw erro('FONTE_INVALIDA');
      const mapa = registros(raw[dia]); if (Object.keys(mapa).length) dias[dia] = true;
    }
    return { mes, estado: 'pronto', dias };
  }

  async function salvar(cmd, autor, guardaSessao) {
    if (!chavesPermitidas(cmd, COMANDO_KEYS) || !autorValido(autor)) throw erro('COMANDO_INVALIDO');
    if (typeof guardaSessao !== 'function') throw erro('GUARDA_SESSAO_OBRIGATORIA');
    const acao = txt(cmd.acao), dia = txt(cmd.dia), motivo = txt(cmd.motivo), requestId = txt(cmd.requestId), informado = txt(cmd.id);
    if (!ACOES.includes(acao) || !diaOk(dia) || motivo.length > 300) throw erro('COMANDO_INVALIDO');
    let c = null, id = informado;
    if (acao === 'criar' || acao === 'editar') c = campos(cmd.avaliacao);
    if (acao === 'criar') {
      if (id || !requestId || requestId.length > 32) throw erro('REQUEST_ID_INVALIDO');
      id = idCriacao(requestId);
    }
    if (!idOk(id)) throw erro('ID_INVALIDO');
    if (acao !== 'criar' && (!Number.isInteger(cmd.expectedRevision) || !txt(cmd.expectedFingerprint))) throw erro('BASE_OBRIGATORIA');
    const stamp = dataHora(agora), conteudo = c ? hash(JSON.stringify(c)) : '', ref = op.banco.ref(caminho(dia, id));
    let motivoErro = '';
    let promessa;
    try {
      guardaSessao();
      promessa = ref.transaction(old => {
        guardaSessao(); // Firebase pode repetir este callback; cada tentativa revalida a sessão privada.
        const atual = old && typeof old === 'object' && !Array.isArray(old) ? old : null;
        if (acao === 'criar' && atual) {
          if (registroValido(atual) && atual.criacaoToken === requestId && atual.criacaoConteudo === conteudo && atual.nome === c.nome && atual.vaga === c.vaga && atual.telefone === c.telefone && atual.hora === c.hora) return atual;
          motivoErro = 'CRIACAO_CONFLITANTE'; return undefined;
        }
        if (acao !== 'criar' && (!registroValido(atual) || atual.revisao !== cmd.expectedRevision || fingerprint(atual) !== cmd.expectedFingerprint)) { motivoErro = 'AGENDAMENTO_DESATUALIZADO'; return undefined; }
        if (acao === 'cancelar' && atual.cancelamento && atual.cancelamento.ativo) { motivoErro = 'JA_CANCELADO'; return undefined; }
        if (acao === 'reativar' && !(atual.cancelamento && atual.cancelamento.ativo)) { motivoErro = 'NAO_CANCELADO'; return undefined; }
        const novo = atual ? clone(atual) : { criacaoToken: requestId, criacaoConteudo: conteudo, historico: [] };
        if (c) Object.assign(novo, c);
        novo.revisao = (atual ? atual.revisao : 0) + 1;
        novo.autorId = autor.id; novo.autorNome = txt(autor.nome); novo.ts = stamp.ts; novo.quando = stamp.quando;
        novo.historico = (Array.isArray(novo.historico) ? novo.historico : []).slice(-19);
        novo.historico.push({ acao, revisao: novo.revisao, autorId: autor.id, autorNome: txt(autor.nome), ts: stamp.ts });
        if (acao === 'cancelar' || acao === 'reativar') {
          const h = novo.cancelamento && Array.isArray(novo.cancelamento.historico) ? novo.cancelamento.historico.slice(-19) : [];
          h.push({ ativo: acao === 'cancelar', motivo: acao === 'cancelar' ? motivo : '', autorId: autor.id, autorNome: txt(autor.nome), ts: stamp.ts, quando: stamp.quando });
          novo.cancelamento = { ativo: acao === 'cancelar', motivo: acao === 'cancelar' ? motivo : '', autorId: autor.id, autorNome: txt(autor.nome), ts: stamp.ts, quando: stamp.quando, historico: h };
        }
        return novo;
      });
    } catch (e) { if (e && e.code === 'NAO_AUTENTICADO') throw e; throw erro('BANCO_INDISPONIVEL'); }
    let res; try { res = await promessa; } catch (e) { if (e && e.code === 'NAO_AUTENTICADO') throw e; throw erro('BANCO_INDISPONIVEL'); }
    if (!res || res.committed !== true) throw erro(motivoErro || 'NAO_CONFIRMADO');
    const gravado = res.snapshot && typeof res.snapshot.val === 'function' ? res.snapshot.val() : null;
    if (!registroValido(gravado)) throw erro('CONFIRMACAO_INVALIDA');
    const x = item(dia, id, gravado);
    if (acao !== 'criar' && (x.revisao !== cmd.expectedRevision + 1 || x.fingerprint === cmd.expectedFingerprint)) throw erro('CONFIRMACAO_INVALIDA');
    if ((acao === 'criar' || acao === 'editar') && (x.nome !== c.nome || x.vaga !== c.vaga || x.telefone !== c.telefone || x.hora !== c.hora)) throw erro('CONFIRMACAO_INVALIDA');
    if (acao === 'cancelar' && (!x.cancelada || !x.cancelamento || x.cancelamento.motivo !== motivo || gravado.cancelamento.autorId !== autor.id)) throw erro('CONFIRMACAO_INVALIDA');
    if (acao === 'reativar' && (x.cancelada || !gravado.cancelamento || gravado.cancelamento.ativo !== false || gravado.cancelamento.autorId !== autor.id)) throw erro('CONFIRMACAO_INVALIDA');
    if (gravado.autorId !== autor.id || gravado.autorNome !== txt(autor.nome)) throw erro('CONFIRMACAO_INVALIDA');
    guardaSessao(); // não devolve ACK de uma sessão expirada/revogada durante o commit.
    return { ok: true, acao, dia, id, revisao: x.revisao, quem: x.quem, quando: x.quando, item: x, espelhoOk: null };
  }

  return { listarDia, listarMes, salvar, root: ROOT };
}

module.exports = { ROOT, criarDados };
