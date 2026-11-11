'use strict';

const httpNativo = require('node:http');

const VERSAO = 151;
const ROTAS = Object.freeze(['/sessao', '/sessao/sair', '/entrevistas']);

function erro(codigo) { const e = new Error(codigo); e.code = codigo; return e; }
function texto(v) { return typeof v === 'string' ? v.trim() : ''; }
function objetoExato(v, keys) { return !!v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).every(k => keys.includes(k)); }
function header(req, nome) { const h = req && req.headers || {}; return h[String(nome).toLowerCase()] == null ? '' : String(h[String(nome).toLowerCase()]); }

function lerJson(req, limite, timeoutMs, timers) {
  return new Promise((resolve, reject) => {
    let total = 0, partes = [], terminou = false, timer;
    function limpar() { if (timer) timers.clearTimeout(timer); req.removeListener('data', dados); req.removeListener('end', fim); req.removeListener('error', falha); req.removeListener('aborted', abortou); }
    function fechar(fn, valor) { if (terminou) return; terminou = true; limpar(); fn(valor); }
    function dados(chunk) { const b = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)); total += b.length; if (total > limite) { fechar(reject, erro('CORPO_GRANDE')); return; } partes.push(b); }
    function fim() { if (terminou) return; try { const s = Buffer.concat(partes).toString('utf8'); fechar(resolve, s ? JSON.parse(s) : {}); } catch (_) { fechar(reject, erro('JSON_INVALIDO')); } }
    function falha() { fechar(reject, erro('CORPO_INDISPONIVEL')); }
    function abortou() { fechar(reject, erro('CORPO_INDISPONIVEL')); }
    req.on('data', dados); req.on('end', fim); req.on('error', falha); req.on('aborted', abortou);
    timer = timers.setTimeout(() => fechar(reject, erro('CORPO_TIMEOUT')), timeoutMs);
  });
}

function criarApi(op) {
  op = op || {};
  if (!op.auth || typeof op.auth.entrar !== 'function' || typeof op.auth.validar !== 'function' || typeof op.auth.sair !== 'function') throw erro('AUTH_OBRIGATORIA');
  if (!op.dados || typeof op.dados.listarDia !== 'function' || typeof op.dados.listarMes !== 'function' || typeof op.dados.salvar !== 'function') throw erro('DADOS_OBRIGATORIOS');
  if (typeof op.ipConfiavel !== 'function') throw erro('IP_CONFIAVEL_OBRIGATORIO');
  if (!Array.isArray(op.origens) || !op.origens.length) throw erro('ORIGENS_OBRIGATORIAS');
  const origens = new Set(op.origens.map(x => {
    let u; try { u = new URL(String(x)); } catch (_) { throw erro('ORIGEM_INVALIDA'); }
    if (u.protocol !== 'https:' || u.origin !== String(x) || u.username || u.password || u.pathname !== '/') throw erro('ORIGEM_INVALIDA');
    return u.origin;
  }));
  const limiteCorpo = Number(op.limiteCorpo || 16 * 1024);
  if (!Number.isInteger(limiteCorpo) || limiteCorpo < 1024 || limiteCorpo > 64 * 1024) throw erro('LIMITE_CORPO_INVALIDO');
  const corpoTimeoutMs = Number(op.corpoTimeoutMs);
  if (!Number.isInteger(corpoTimeoutMs) || corpoTimeoutMs < 100 || corpoTimeoutMs > 30_000) throw erro('TIMEOUT_CORPO_INVALIDO');
  const timers = { setTimeout: op.setTimeout || setTimeout, clearTimeout: op.clearTimeout || clearTimeout };

  function cabecalhos(res, origin) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    if (origin && origens.has(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    }
  }
  function responder(res, status, corpo, origin) { cabecalhos(res, origin); res.statusCode = status; res.end(status === 204 ? '' : JSON.stringify(corpo)); }
  function falhar(res, e, origin) {
    const c = e && e.code;
    if (c === 'NAO_AUTENTICADO' || c === 'CREDENCIAL_INVALIDA') return responder(res, 401, { ok: false, versao: VERSAO, erro: 'nao_autenticado' }, origin);
    if (c === 'LIMITE_EXCEDIDO') return responder(res, 429, { ok: false, versao: VERSAO, erro: 'tente_mais_tarde' }, origin);
    if (c === 'CORPO_TIMEOUT') return responder(res, 408, { ok: false, versao: VERSAO, erro: 'pedido_invalido' }, origin);
    if (['JSON_INVALIDO', 'CORPO_GRANDE', 'COMANDO_INVALIDO', 'CAMPOS_INVALIDOS', 'DIA_INVALIDO', 'MES_INVALIDO', 'ID_INVALIDO', 'REQUEST_ID_INVALIDO', 'BASE_OBRIGATORIA', 'MOTIVO_INVALIDO'].includes(c)) return responder(res, 400, { ok: false, versao: VERSAO, erro: 'pedido_invalido' }, origin);
    if (['CRIACAO_CONFLITANTE', 'AGENDAMENTO_DESATUALIZADO', 'JA_CANCELADO', 'NAO_CANCELADO', 'OPERACAO_EM_ANDAMENTO'].includes(c)) return responder(res, 409, { ok: false, versao: VERSAO, erro: 'conflito' }, origin);
    if (c === 'CONFIRMACAO_INVALIDA' || c === 'NAO_CONFIRMADO') return responder(res, 502, { ok: false, versao: VERSAO, erro: 'confirmacao_invalida' }, origin);
    return responder(res, 503, { ok: false, versao: VERSAO, erro: 'indisponivel' }, origin);
  }
  function tokenDe(req) { const m = /^Bearer ([A-Za-z0-9_-]{43})$/.exec(header(req, 'authorization')); if (!m) throw erro('NAO_AUTENTICADO'); return m[1]; }
  function rota(req) {
    const raw = String(req.url || '');
    if (!raw.startsWith('/') || raw.includes('://') || raw.includes('\\') || /%2f|%5c/i.test(raw)) throw erro('ROTA_INVALIDA');
    let u; try { u = new URL(raw, 'https://proxy-rh.invalid'); } catch (_) { throw erro('ROTA_INVALIDA'); }
    if (!ROTAS.includes(u.pathname)) throw erro('ROTA_INVALIDA');
    return u;
  }

  return async function handler(req, res) {
    const origin = header(req, 'origin');
    if (!origens.has(origin)) return responder(res, 403, { ok: false, versao: VERSAO, erro: 'origem_negada' }, '');
    if (req.method === 'OPTIONS') return responder(res, 204, null, origin);
    let u; try { u = rota(req); } catch (_) { return responder(res, 404, { ok: false, versao: VERSAO, erro: 'rota' }, origin); }
    try {
      if (req.method === 'POST' && u.pathname === '/sessao') {
        if (u.search) throw erro('COMANDO_INVALIDO');
        const body = await lerJson(req, limiteCorpo, corpoTimeoutMs, timers);
        if (!objetoExato(body, ['principal', 'segredo'])) throw erro('COMANDO_INVALIDO');
        const ip = texto(op.ipConfiavel(req)); if (!ip) throw erro('IP_CONFIAVEL_OBRIGATORIO');
        return responder(res, 200, await op.auth.entrar(body, ip), origin);
      }
      if (req.method === 'POST' && u.pathname === '/sessao/sair') {
        if (u.search) throw erro('COMANDO_INVALIDO');
        const token = tokenDe(req); op.auth.validar(token);
        const body = await lerJson(req, limiteCorpo, corpoTimeoutMs, timers); if (!objetoExato(body, [])) throw erro('COMANDO_INVALIDO');
        return responder(res, 200, op.auth.sair(token), origin);
      }
      if (req.method === 'GET' && u.pathname === '/entrevistas') {
        const token = tokenDe(req); op.auth.validar(token);
        const entradas = Array.from(u.searchParams.keys());
        if (entradas.length !== 1 || !['dia', 'mes'].includes(entradas[0]) || u.searchParams.getAll(entradas[0]).length !== 1) throw erro('COMANDO_INVALIDO');
        const resposta = entradas[0] === 'dia' ? await op.dados.listarDia(u.searchParams.get('dia')) : await op.dados.listarMes(u.searchParams.get('mes'));
        op.auth.validar(token);
        return responder(res, 200, Object.assign({ versao: VERSAO }, resposta), origin);
      }
      if (req.method === 'POST' && u.pathname === '/entrevistas') {
        if (u.search) throw erro('COMANDO_INVALIDO');
        const token = tokenDe(req), sessao = op.auth.validar(token), body = await lerJson(req, limiteCorpo, corpoTimeoutMs, timers);
        if (!objetoExato(body, ['acao', 'dia', 'id', 'requestId', 'expectedRevision', 'expectedFingerprint', 'avaliacao', 'motivo'])) throw erro('COMANDO_INVALIDO');
        const guarda = () => op.auth.validar(token);
        guarda(); // revalidação imediatamente antes da escrita Admin
        const resposta = await op.dados.salvar(body, { id: sessao.principal, nome: sessao.nome }, guarda);
        return responder(res, 200, Object.assign({ versao: VERSAO }, resposta), origin);
      }
      return responder(res, 405, { ok: false, versao: VERSAO, erro: 'metodo' }, origin);
    } catch (e) { return falhar(res, e, origin); }
  };
}

function criarServidor(op) {
  const http = op && op.http || httpNativo;
  if (!http || typeof http.createServer !== 'function') throw erro('HTTP_OBRIGATORIO');
  return http.createServer(criarApi(op));
}

module.exports = { VERSAO, criarApi, criarServidor };
