'use strict';

const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { Writable, PassThrough } = require('node:stream');
const fs = require('node:fs');
const path = require('node:path');
const P = require('./proxy-node151.js');

class Req extends EventEmitter {
  constructor(op) {
    super(); this.url = op.url; this.method = op.method || 'GET'; this.headers = op.headers || {};
    this.socket = { remoteAddress: op.ip === undefined ? '::ffff:192.0.2.10' : op.ip };
  }
  setTimeout(ms, fn) { this.timeoutMs = ms; this.timeoutFn = fn; }
}
class Res extends Writable {
  constructor() { super(); this.headers = {}; this.statusCode = 0; this.body = ''; this.headersSent = false; }
  _write(chunk, _enc, cb) { this.headersSent = true; this.body += chunk.toString(); cb(); }
  _final(cb) { this.headersSent = true; cb(); }
  setHeader(k, v) { this.headers[String(k).toLowerCase()] = String(v); }
}
class Upstream extends Writable {
  constructor() { super(); this.body = ''; }
  _write(chunk, _enc, cb) { this.body += chunk.toString(); cb(); }
  setTimeout(ms, fn) { this.timeoutMs = ms; this.timeoutFn = fn; }
}
function ambiente() {
  const chamadas = [];
  const http = {
    request(op, cb) { const up = new Upstream(); up.responder = (status, body, headers) => { const r = new PassThrough(); r.statusCode = status; r.headers = headers || {}; cb(r); r.end(body); return r; }; up.responderParcial = (status, body, headers) => { const r = new PassThrough(); r.statusCode = status; r.headers = headers || {}; cb(r); r.write(body); return r; }; chamadas.push({ op, up }); return up; },
    createServer(fn) { return { fn, listen() { throw new Error('teste não abre porta'); } }; }
  };
  return { chamadas, http, handler: P.criarHandler({ http }) };
}
function tick() { return new Promise(resolve => setImmediate(resolve)); }

async function main() {
  const compose = fs.readFileSync(path.join(__dirname, 'compose-proxy-node151.modelo.yml'), 'utf8');
  assert.match(compose, /entrypoint: \["node"\]/);
  assert.match(compose, /pull_policy: never/);
  assert.match(compose, /proxy-node151\.js:\/app\/proxy-node151\.js:ro/);
  assert.match(compose, /\/run\/zeluz-rh151:\/run\/zeluz-rh151:ro/);
  assert.match(compose, /PathPrefix\(`\/rh151`\)/);
  assert.match(compose, /expose:\s*\n\s*- "8080"/);
  assert.doesNotMatch(compose, /\n\s*ports:|\n\s*environment:|\n\s*secrets:/);
  assert.doesNotMatch(compose, /https?:\/\/[A-Za-z0-9]/);

  assert.equal(P.rotaInterna('/rh151/sessao'), '/sessao');
  assert.equal(P.rotaInterna('/rh151/entrevistas?dia=2026-10-30'), '/entrevistas?dia=2026-10-30');
  for (const x of ['/rh151', '/outro/sessao', '/rh151/../sessao', '/rh151/%2e%2e/sessao', '/rh151/%2fsessao', '/rh151\\sessao', '/rh151//sessao']) assert.equal(P.rotaInterna(x), null, x);

  const a = ambiente(), req = new Req({ url: '/rh151/entrevistas?mes=2026-10', method: 'POST', headers: { origin: 'https://app-ficticio.invalid', authorization: 'Bearer ficticio', cookie: 'nao-passar', 'x-forwarded-for': '203.0.113.99' } }), res = new Res();
  a.handler(req, res);
  assert.equal(a.chamadas.length, 1);
  assert.equal(a.chamadas[0].op.socketPath, P.SOCKET_BACKEND);
  assert.equal(a.chamadas[0].op.path, '/entrevistas?mes=2026-10');
  assert.equal(a.chamadas[0].op.method, 'POST');
  assert.equal(a.chamadas[0].op.headers['x-rh-client-ip'], '192.0.2.10');
  assert.equal(a.chamadas[0].op.headers.cookie, undefined);
  assert.equal(a.chamadas[0].op.headers['x-forwarded-for'], undefined);
  req.emit('data', Buffer.from('{}')); req.emit('end');
  assert.equal(a.chamadas[0].up.body, '{}');
  a.chamadas[0].up.responder(200, '{"ok":true}', { 'content-type': 'application/json', 'set-cookie': 'nunca', 'access-control-allow-origin': 'https://app-ficticio.invalid' });
  await tick();
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers['set-cookie'], undefined);
  assert.equal(res.headers['access-control-allow-origin'], 'https://app-ficticio.invalid');

  const b = ambiente(), rGrande = new Req({ url: '/rh151/sessao', method: 'POST', headers: { 'content-length': String(P.LIMITE_CORPO + 1) } }), sGrande = new Res();
  b.handler(rGrande, sGrande);
  assert.equal(sGrande.statusCode, 413); assert.equal(b.chamadas.length, 0);

  const c = ambiente(), rFluxo = new Req({ url: '/rh151/sessao', method: 'POST' }), sFluxo = new Res();
  c.handler(rFluxo, sFluxo); rFluxo.emit('data', Buffer.alloc(P.LIMITE_CORPO + 1));
  assert.equal(sFluxo.statusCode, 413); assert.equal(c.chamadas[0].up.destroyed, true);

  const d = ambiente(), rLento = new Req({ url: '/rh151/sessao', method: 'POST' }), sLento = new Res();
  d.handler(rLento, sLento); assert.equal(rLento.timeoutMs, P.TIMEOUT_CORPO_MS); rLento.timeoutFn();
  assert.equal(sLento.statusCode, 408); assert.equal(d.chamadas[0].up.destroyed, true);

  const e = ambiente(), rBack = new Req({ url: '/rh151/entrevistas?dia=2026-10-30' }), sBack = new Res();
  e.handler(rBack, sBack); assert.equal(e.chamadas[0].up.timeoutMs, P.TIMEOUT_BACKEND_MS); e.chamadas[0].up.timeoutFn(); await tick();
  assert.equal(sBack.statusCode, 504);

  const f = ambiente(), rErro = new Req({ url: '/rh151/entrevistas?dia=2026-10-30' }), sErro = new Res();
  f.handler(rErro, sErro); f.chamadas[0].up.destroy(Object.assign(new Error('fake'), { code: 'ECONNREFUSED' })); await tick();
  assert.equal(sErro.statusCode, 503);

  const parcial = ambiente(), rParcial = new Req({ url: '/rh151/entrevistas?dia=2026-10-30' }), sParcial = new Res();
  parcial.handler(rParcial, sParcial); const fluxoParcial = parcial.chamadas[0].up.responderParcial(200, '{"parcial":', { 'content-type': 'application/json' }); await tick();
  assert.equal(sParcial.headersSent, true); fluxoParcial.destroy(new Error('quebra fake após headers')); await tick();
  assert.equal(sParcial.destroyed, true, 'erro depois dos headers encerra a resposta, não a deixa pendurada');

  const g = ambiente(), rIp = new Req({ url: '/rh151/sessao', ip: 'nao-ip' }), sIp = new Res();
  g.handler(rIp, sIp); assert.equal(sIp.statusCode, 503); assert.equal(g.chamadas.length, 0);

  for (const metodo of ['GET', 'OPTIONS', 'PUT']) {
    const h = ambiente(), rq = new Req({ url: '/rh151/sessao', method: metodo }), rs = new Res(); h.handler(rq, rs);
    assert.equal(h.chamadas[0].op.method, metodo, 'API recebe o método e decide autorização/CORS');
  }

  assert.equal(P.criarServidor({ http: a.http }).fn instanceof Function, true);
  console.log('proxy-node151: roteamento, query, método, limites, timeouts, socket, falhas e compose passaram com fakes.');
}

main().catch(e => { console.error(e); process.exitCode = 1; });
