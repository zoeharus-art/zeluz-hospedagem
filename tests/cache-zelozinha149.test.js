'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.resolve(__dirname, '../auaulandia/index.html'), 'utf8');
function script(id) {
  const m = html.match(new RegExp(`<script[^>]*id="${id}"[^>]*>([\\s\\S]*?)<\\/script>`));
  assert.ok(m, `script ausente: ${id}`);
  return m[1];
}
const clone = x => x == null ? x : JSON.parse(JSON.stringify(x));
const dia1 = '2026-10-26', dia2 = '2026-10-27';

function elemento() {
  return {
    innerHTML: '', textContent: '', hidden: false, attrs: {}, isConnected: true,
    classList: { add() {}, remove() {}, contains: () => ativo },
    addEventListener() {}, querySelector() { return null; },
    setAttribute(k, v) { this.attrs[k] = String(v); },
    removeAttribute(k) { delete this.attrs[k]; },
    getAttribute(k) { return Object.prototype.hasOwnProperty.call(this.attrs, k) ? this.attrs[k] : null; }
  };
}

let ativo = false;
async function executar() {
  let agora = Date.parse('2026-10-26T10:00:00-03:00');
  class DataFalsa extends Date {
    constructor(v) { super(v === undefined ? agora : v); }
    static now() { return agora; }
  }
  const moduloCtx = { module: { exports: {} }, exports: {}, Date: DataFalsa, TextEncoder };
  vm.createContext(moduloCtx);
  vm.runInContext(script('zelozinha-dados-painel116'), moduloCtx);
  const Dados116 = moduloCtx.module.exports;

  const consultas = [], eventos = [], render104 = [], snoopy = { consultas: 0, desconhecido: false };
  let usuario = { id: 'pessoa-fixture-a', nome: 'Pessoa Fictícia', role: 'gestao' };
  let hoje = dia1;
  let assinaturaFonte = `assinatura-${dia1}`;
  const painel = d => ({
    dia: d, detalhesEnvioVersao: 104, assinaturaConteudo: d === dia1 ? assinaturaFonte : `assinatura-${d}`, atualizadoEm: `${d}T12:00:00.000Z`,
    identidadesPets: { pet1: { dcKeyAtual: 'peludo-ficticio__familia-ficticia', pelKeyAtual: 'peludo-ficticio', petId: 'pet1', tutorRefId: 'tutor1', nomePeludo: 'Peludo Fictício', nomeTutor: 'Família Fictícia' } },
    cuidadosDia: { versao: 104, itens: { h1: { petId: 'pet1', cycleKey: '["pet1","tutor1","vacina","2026-11-01","vac"]', care: 'vacina', itemK: 'vac', dueDate: '2026-11-01', statusPainel: 'pendente', motivo: 'fixture' } } },
    grupos: []
  });
  const db = { ref(p) { return { once: async () => { consultas.push(p); const d = p.slice(-10); if (p.startsWith('piloto59/')) return { val: () => painel(d) }; if (p.startsWith('daycare/checkin-corpo/')) return { val: () => ({ 'peludo-ficticio__familia-ficticia': { tipo: 'entrada', fim: agora } }) }; return { val: () => ({}) }; } }; } };

  const host = elemento(), rotulo = elemento(), contador = elemento(), cuidados = elemento(), andamento = elemento(), listaSnoopy = elemento(), badge = elemento();
  const tabs = ['resolve', 'progress', 'snoopy'].map(nome => { const e = elemento(); e.attrs['data-zt694-tab'] = nome; return e; });
  const panes = tabs.map(tab => { const e = elemento(); e.attrs['data-zt694-pane'] = tab.attrs['data-zt694-tab']; return e; });
  const listeners = {};
  const hub = {
    querySelector(sel) { return ({
      '[data-zt694-date-host]': host, '[data-zt694-day-label]': rotulo, '[data-zt694-count]': contador,
      '[data-zt694-resolver-list]': cuidados, '[data-zt694-andamento-list]': andamento,
      '[data-zt694-snoopy-list]': listaSnoopy, '[data-zt694-snoopy-count]': badge,
      '[data-zt694-tab="snoopy"]': tabs[2]
    })[sel] || null; },
    querySelectorAll(sel) { return sel === '[data-zt694-tab]' ? tabs : sel === '[data-zt694-pane]' ? panes : []; },
    addEventListener(nome, fn) { listeners[nome] = fn; },
    closest() { return { classList: { contains: () => ativo } }; }
  };
  const doc = { querySelector: () => hub, dispatchEvent(e) { eventos.push({ nome: e.type, detalhe: clone(e.detail) }); } };
  class Evento { constructor(type, op) { this.type = type; this.detail = op && op.detail; } }
  const snoopyApi = op => ({
    async ler(d) { snoopy.consultas++; const r = snoopy.desconhecido
      ? { dia: d, estado: 'desconhecido', total: null, itens: null }
      : { dia: d, estado: 'pronto', total: 1, itens: [{ item: 'medicacao', id: 'linha-ficticia', valor: 'Peludo Fictício', confirmado: false, html: '' }] };
      op.aoAtualizar(clone(r)); return r;
    },
    invalidar() {}, cancelar() {},
    confirmarDireto: async () => ({ estado: 'confirmacao-vigente' }), desfazerDireto: async () => ({ estado: 'desfeito' })
  });
  const w = {
    DB: db, zPainel44Dia: () => hoje, usuarioAtual: () => clone(usuario),
    zPainel44ValidarFonte80: v => v,
    ZelozinhaDadosPainel116: {
      criar: op => Dados116.criar({ ...op, assinar: async s => `sha-${s.length}` }),
      criarSnoopy: snoopyApi
    },
    ZeluzSnoopyConfirmacao: {}, ZeluzSnoopy31AdaptadorDB: {}, ZeluzSnoopy33Interface: {}, dashEditarAtor() {},
    z89Render104(forcar) { render104.push(forcar); cuidados.innerHTML = '<article>cartões confirmados</article>'; andamento.innerHTML = '<article>andamento confirmado</article>'; },
    Z44_DISPATCH80: { dados: { dia: dia1, assinaturaConteudo: assinaturaFonte } }, hojeAbrir() { return true; },
    zelozinha45AtorMudou(u) { usuario = clone(u); return true; },
    zelozinha45Logout() { usuario = null; return true; }
  };
  vm.runInNewContext(script('zelozinha-painel116-controller'), { window: w, document: doc, DB: db, CustomEvent: Evento, setTimeout, clearTimeout, Date: DataFalsa, Intl });

  ativo = true;
  await w.zelozinha116Ativar();
  assert.equal(consultas.length, 4, 'primeira leitura usa as quatro fontes116 reais');
  assert.equal(snoopy.consultas, 1);
  assert.deepEqual(render104, [false], 'a publicação116 não deve forçar o histórico89');
  assert.match(cuidados.innerHTML, /cartões confirmados/);

  const antesAba = { dados: consultas.length, snoopy: snoopy.consultas, render: render104.length };
  w.zelozinha116AbrirFila('snoopy');
  w.zelozinha116AbrirFila('resolve');
  assert.deepEqual({ dados: consultas.length, snoopy: snoopy.consultas, render: render104.length }, antesAba,
    'troca simples de aba só alterna o painel: não lê fonte nem repinta o histórico');

  agora += 2 * 60 * 60 * 1000;
  const segunda = w.zelozinha116Ativar();
  assert.doesNotMatch(cuidados.innerHTML, /Conferindo/, 'cache confirmado não some durante a reabertura');
  await segunda;
  assert.equal(consultas.length, 4, 'segundo clique no mesmo dia não consulta novamente após o TTL antigo');
  assert.equal(snoopy.consultas, 2, 'após 60s, a reabertura relê só o financeiro em segundo plano');
  assert.equal(render104.length, 2); assert.equal(render104[1], false);

  assinaturaFonte = 'assinatura-material-nova';
  w.Z44_DISPATCH80.dados.assinaturaConteudo = assinaturaFonte;
  const mudou = w.zelozinha116Ativar();
  assert.doesNotMatch(cuidados.innerHTML, /Conferindo/, 'invalidação material atualiza em segundo plano sem apagar a tela');
  await mudou;
  assert.equal(consultas.length, 8, 'assinatura nativa nova relê as quatro fontes exatamente uma vez');

  const consultasAntesAck = consultas.length, snoopyAntesAck = snoopy.consultas, htmlAntesAck = cuidados.innerHTML;
  await w.zelozinha116SnoopyAtualizar();
  assert.equal(consultas.length, consultasAntesAck, 'ACK financeiro não relê presença/projeção/cuidados');
  assert.equal(snoopy.consultas, snoopyAntesAck + 1, 'ACK financeiro relê apenas Snoopy');
  assert.equal(cuidados.innerHTML, htmlAntesAck, 'ACK financeiro não esvazia cartões confirmados');

  snoopy.desconhecido = true;
  w.zelozinha116SnoopyInvalidar(dia1);
  w.zelozinha116AbrirFila('snoopy');
  await new Promise(setImmediate);
  assert.equal(badge.textContent, '—', 'fonte desconhecida nunca vira zero');

  usuario = { id: 'pessoa-fixture-b', nome: 'Outra Pessoa Fictícia', role: 'gestao' };
  snoopy.desconhecido = false;
  await w.zelozinha116Ativar();
  assert.equal(consultas.length, 12, 'outra identidade não reutiliza o cache anterior');

  await w.zelozinha116SelecionarDia(dia2, false);
  assert.equal(consultas.length, 16, 'outra data lê o próprio conjunto de fontes');
  await w.zelozinha116SelecionarDia(dia1, false);
  assert.equal(consultas.length, 16, 'voltar à data confirmada da sessão usa o cache por dia');

  hoje = dia2;
  w.hojeAbrir();
  await new Promise(setImmediate);
  assert.match(rotulo.textContent, /27/, 'virada/abrir Hoje seleciona o novo dia, sem presença do dia anterior');

  w.zelozinha45Logout();
  usuario = { id: 'pessoa-fixture-a', nome: 'Pessoa Fictícia', role: 'gestao' };
  w.zelozinha45AtorMudou(usuario);
  await w.zelozinha116Ativar();
  assert.equal(consultas.length, 20, 'logout limpa os dados confirmados em memória');
  assert.ok(eventos.some(e => e.nome === 'zt694:data-ready' && e.detalhe.estado === 'pronto'));
  assert.ok(eventos.some(e => e.nome === 'zt694:snoopy-ready' && e.detalhe.estado === 'desconhecido'));
}

executar().then(() => {
  console.log('cache149: cache por dia/sessão, refresh Snoopy seletivo, unknown, auth e virada conferidos.');
}).catch(e => { console.error(e); process.exitCode = 1; });
