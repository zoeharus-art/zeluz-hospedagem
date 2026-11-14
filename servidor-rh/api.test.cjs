'use strict';
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const A = require('./auth.js');
const API = require('./api.js');

const ORIGIN = 'https://app.exemplo.invalid';
const segredos = { adriana: 'Ficticia-Adriana-DDD00-1!', marcia: 'Ficticia-Marcia-DDD00-2!' };
const limite = maxFalhas => ({ janelaMs: 60_000, bloqueioMs: 120_000, maxFalhas, maxConcorrentes: 2, maxConcorrentesPorIp: 1, maxSessoes: 10, maxEntradasFalha: 40 });

class Req extends EventEmitter {
  constructor(op) { super(); this.method = op.method; this.url = op.url; this.headers = Object.assign({}, op.headers); this.trustedIp = op.trustedIp || 'ip-real'; this.body = op.body; }
  removeListener(name, fn) { return super.removeListener(name, fn); }
}
class Res {
  constructor() { this.headers = {}; this.statusCode = 0; this.body = ''; }
  setHeader(k, v) { this.headers[String(k).toLowerCase()] = String(v); }
  end(v) { this.body = String(v || ''); }
  json() { return this.body ? JSON.parse(this.body) : null; }
}
async function chamar(handler, op) {
  const req = new Req({ method: op.method || 'GET', url: op.url || '/', headers: Object.assign({ origin: ORIGIN }, op.headers || {}), trustedIp: op.trustedIp, body: op.body });
  const res = new Res(), p = handler(req, res);
  if (req.method === 'POST') queueMicrotask(() => { if (op.body !== undefined) req.emit('data', Buffer.from(typeof op.body === 'string' ? op.body : JSON.stringify(op.body))); req.emit('end'); });
  await p; return res;
}

async function run() {
  const principais = await A.gerarPrincipais({ segredos });
  let agora = 1_800_000_000_000, chamadas = [], expirarNaLeitura = false;
  const auth = A.criarAutenticacao({ principais, ttlMs: 60_000, limite: limite(5), agora: () => agora });
  const dados = {
    async listarDia(dia) { chamadas.push(['dia', dia]); if (expirarNaLeitura) agora += 60_001; return { dia, estado: 'pronto', itens: [{ id: 'ficticio' }] }; },
    async listarMes(mes) { chamadas.push(['mes', mes]); return { mes, estado: 'pronto', dias: {} }; },
    async salvar(cmd, autor, guarda) { assert.equal(typeof guarda, 'function'); guarda(); chamadas.push(['salvar', cmd, autor]); return { ok: true, acao: cmd.acao, dia: cmd.dia, id: 'ficticio', revisao: 1, quem: autor.nome, quando: 'data fictícia', item: { id: 'ficticio' }, espelhoOk: null }; }
  };
  const handler = API.criarApi({ auth, dados, origens: [ORIGIN], corpoTimeoutMs: 1000, ipConfiavel: req => req.trustedIp });

  let r = await chamar(handler, { method: 'GET', url: '/entrevistas?dia=2026-10-30', headers: { origin: 'https://outra.invalid' } });
  assert.equal(r.statusCode, 403); assert.equal(r.headers['access-control-allow-origin'], undefined);
  r = await chamar(handler, { method: 'OPTIONS', url: '/entrevistas' });
  assert.equal(r.statusCode, 204);
  r = await chamar(handler, { method: 'GET', url: '/entrevistas?dia=2026-10-30' });
  assert.equal(r.statusCode, 401, 'CORS permitido não autentica');

  r = await chamar(handler, { method: 'POST', url: '/sessao', body: { principal: 'gestao', segredo: segredos.adriana } });
  assert.equal(r.statusCode, 401);
  r = await chamar(handler, { method: 'POST', url: '/sessao', body: { principal: 'adriana', segredo: segredos.adriana, role: 'gestao' } });
  assert.equal(r.statusCode, 400, 'role no corpo não autoriza');
  r = await chamar(handler, { method: 'POST', url: '/sessao', body: { principal: 'adriana', segredo: segredos.adriana }, trustedIp: 'ip-servidor' });
  assert.equal(r.statusCode, 200);
  const login = r.json(); assert.equal(login.versao, 151); assert.equal(login.token.length, 43); assert.equal(typeof login.expiraEm, 'number');
  assert.equal(r.headers['set-cookie'], undefined); assert.equal(r.headers['cache-control'], 'no-store');

  r = await chamar(handler, { method: 'GET', url: '/entrevistas?dia=2026-10-30', headers: { authorization: 'Bearer ' + 'A'.repeat(43) } });
  assert.equal(r.statusCode, 401);
  r = await chamar(handler, { method: 'GET', url: '/entrevistas?dia=2026-10-30', headers: { authorization: 'Bearer ' + login.token } });
  assert.equal(r.statusCode, 200); assert.equal(r.json().versao, 151); assert.equal(r.json().itens[0].id, 'ficticio');
  r = await chamar(handler, { method: 'GET', url: '/entrevistas?mes=2026-10&dia=2026-10-30', headers: { authorization: 'Bearer ' + login.token } });
  assert.equal(r.statusCode, 400);
  r = await chamar(handler, { method: 'GET', url: 'https://host-injetado.invalid/entrevistas?dia=2026-10-30', headers: { authorization: 'Bearer ' + login.token } });
  assert.equal(r.statusCode, 404, 'URL absoluta não é aceita');

  const comando = { acao: 'criar', dia: '2026-10-30', requestId: 'api151', avaliacao: { tipo: 'entrevista', nome: 'Pessoa fictícia', vaga: 'Vaga', telefone: '(00) 90000-0000', hora: '09:30' } };
  r = await chamar(handler, { method: 'POST', url: '/entrevistas', headers: { authorization: 'Bearer ' + login.token }, body: { ...comando, autor: { id: 'marcia' }, role: 'gestao', path: 'daycare' } });
  assert.equal(r.statusCode, 400);
  r = await chamar(handler, { method: 'POST', url: '/entrevistas', headers: { authorization: 'Bearer ' + login.token }, body: comando });
  assert.equal(r.statusCode, 200); assert.equal(r.json().versao, 151);
  const salvou = chamadas.find(x => x[0] === 'salvar'); assert.deepEqual(salvou[2], { id: 'adriana', nome: 'Adriana' }, 'autoria vem da sessão');

  expirarNaLeitura = true;
  r = await chamar(handler, { method: 'GET', url: '/entrevistas?dia=2026-10-30', headers: { authorization: 'Bearer ' + login.token } });
  assert.equal(r.statusCode, 401, 'sessão é revalidada antes de devolver leitura');
  assert.equal(r.body.includes('ficticio'), false);

  agora += 1;
  const auth2 = A.criarAutenticacao({ principais, ttlMs: 60_000, limite: limite(2), agora: () => agora });
  const h2 = API.criarApi({ auth: auth2, dados, origens: [ORIGIN], corpoTimeoutMs: 1000, ipConfiavel: req => req.trustedIp });
  for (const xff of ['203.0.113.9', '203.0.113.10']) {
    r = await chamar(h2, { method: 'POST', url: '/sessao', trustedIp: 'proxy-verificado', headers: { 'x-forwarded-for': xff }, body: { principal: 'adriana', segredo: 'Senha errada fictícia' } });
    assert.equal(r.statusCode, 401);
  }
  r = await chamar(h2, { method: 'POST', url: '/sessao', trustedIp: 'proxy-verificado', headers: { 'x-forwarded-for': '203.0.113.9' }, body: { principal: 'adriana', segredo: segredos.adriana } });
  assert.equal(r.statusCode, 429, 'X-Forwarded-For não contorna IP confiável injetado');

  const auth3 = A.criarAutenticacao({ principais, ttlMs: 60_000, limite: limite(5), agora: () => agora });
  const h3 = API.criarApi({ auth: auth3, dados, origens: [ORIGIN], corpoTimeoutMs: 1000, ipConfiavel: req => req.trustedIp });
  r = await chamar(h3, { method: 'POST', url: '/sessao', body: { principal: 'marcia', segredo: segredos.marcia } }); const tokenM = r.json().token;
  r = await chamar(h3, { method: 'POST', url: '/sessao/sair', headers: { authorization: 'Bearer ' + tokenM }, body: {} }); assert.equal(r.statusCode, 200);
  r = await chamar(h3, { method: 'GET', url: '/entrevistas?mes=2026-10', headers: { authorization: 'Bearer ' + tokenM } }); assert.equal(r.statusCode, 401);

  let recebeuHandler = null;
  const servidor = API.criarServidor({ auth: auth3, dados, origens: [ORIGIN], corpoTimeoutMs: 1000, ipConfiavel: req => req.trustedIp, http: { createServer(fn) { recebeuHandler = fn; return { tipo: 'fake', listen() { throw new Error('não deve ouvir'); } }; } } });
  assert.equal(servidor.tipo, 'fake'); assert.equal(typeof recebeuHandler, 'function');

  const hLento = API.criarApi({ auth: auth3, dados, origens: [ORIGIN], corpoTimeoutMs: 100, ipConfiavel: req => req.trustedIp, setTimeout: fn => { queueMicrotask(fn); return 1; }, clearTimeout() {} });
  const reqLento = new Req({ method: 'POST', url: '/sessao', headers: { origin: ORIGIN }, trustedIp: 'ip-lento' });
  const resLento = new Res(); await hLento(reqLento, resLento);
  assert.equal(resLento.statusCode, 408);
  for (const evento of ['data', 'end', 'error', 'aborted']) assert.equal(reqLento.listenerCount(evento), 0, 'slow body limpa listener ' + evento);
  console.log('api151: OK');
}

module.exports = run;
if (require.main === module) run().catch(e => { console.error(e); process.exitCode = 1; });
