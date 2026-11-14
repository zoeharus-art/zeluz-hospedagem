'use strict';

const httpNativo = require('node:http');
const net = require('node:net');

const SOCKET_BACKEND = '/run/zeluz-rh151/api.sock';
const PREFIXO = '/rh151';
const PORTA_INTERNA = 8080;
const LIMITE_CORPO = 64 * 1024;
const TIMEOUT_CORPO_MS = 30_000;
const TIMEOUT_BACKEND_MS = 35_000;

function enviar(res, status, erro) {
  if (res.writableEnded) return;
  if (res.headersSent) {
    if (typeof res.destroy === 'function') res.destroy();
    return;
  }
  const corpo = JSON.stringify({ ok: false, versao: 151, erro });
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(corpo);
}

function rotaInterna(raw) {
  raw = String(raw || '');
  if (!raw.startsWith(PREFIXO + '/') || raw.includes('\\') || /%2f|%5c|[\u0000-\u001f\u007f]/i.test(raw)) return null;
  let u;
  try { u = new URL(raw, 'http://proxy-rh151.invalid'); } catch (_) { return null; }
  if (!u.pathname.startsWith(PREFIXO + '/')) return null;
  const caminho = u.pathname.slice(PREFIXO.length);
  if (!caminho.startsWith('/') || caminho.startsWith('//') || caminho.includes('/../') || caminho.endsWith('/..')) return null;
  return caminho + u.search;
}

function ipDoPar(req) {
  const valor = req && req.socket && req.socket.remoteAddress;
  if (typeof valor !== 'string') return '';
  const limpo = valor.startsWith('::ffff:') ? valor.slice(7) : valor;
  return net.isIP(limpo) ? limpo : '';
}

function cabecalhos(req, ip) {
  const origem = req.headers && req.headers.origin;
  const autorizacao = req.headers && req.headers.authorization;
  const tipo = req.headers && req.headers['content-type'];
  const tamanho = req.headers && req.headers['content-length'];
  const out = { 'x-rh-client-ip': ip };
  if (typeof origem === 'string') out.origin = origem;
  if (typeof autorizacao === 'string') out.authorization = autorizacao;
  if (typeof tipo === 'string') out['content-type'] = tipo;
  if (typeof tamanho === 'string' && /^\d{1,8}$/.test(tamanho)) out['content-length'] = tamanho;
  return out;
}

function copiarResposta(up, res) {
  const permitidos = ['content-type', 'cache-control', 'x-content-type-options', 'referrer-policy',
    'access-control-allow-origin', 'access-control-allow-headers', 'access-control-allow-methods', 'vary'];
  res.statusCode = Number(up.statusCode) || 502;
  for (const nome of permitidos) {
    const valor = up.headers && up.headers[nome];
    if (typeof valor === 'string') res.setHeader(nome, valor);
  }
}

function criarHandler(op) {
  op = op || {};
  const http = op.http || httpNativo;
  const socketPath = op.socketPath || SOCKET_BACKEND;
  const limite = op.limiteCorpo || LIMITE_CORPO;
  const timeoutCorpo = op.timeoutCorpoMs || TIMEOUT_CORPO_MS;
  const timeoutBackend = op.timeoutBackendMs || TIMEOUT_BACKEND_MS;
  if (socketPath !== SOCKET_BACKEND || limite !== LIMITE_CORPO || timeoutCorpo !== TIMEOUT_CORPO_MS || timeoutBackend !== TIMEOUT_BACKEND_MS) {
    throw new Error('CONFIG_PROXY_NAO_APROVADA');
  }
  if (!http || typeof http.request !== 'function') throw new Error('HTTP_OBRIGATORIO');

  return function handler(req, res) {
    const rota = rotaInterna(req.url);
    if (!rota) return enviar(res, 404, 'rota');
    const ip = ipDoPar(req);
    if (!ip) return enviar(res, 503, 'indisponivel');
    const declarado = Number(req.headers && req.headers['content-length']);
    if (Number.isFinite(declarado) && declarado > limite) return enviar(res, 413, 'pedido_invalido');

    let total = 0, terminou = false;
    const upstream = http.request({ socketPath, path: rota, method: req.method, headers: cabecalhos(req, ip) }, up => {
      if (terminou) { up.destroy(); return; }
      copiarResposta(up, res);
      up.on('error', () => { terminou = true; if (!res.writableEnded) res.destroy(); });
      up.on('aborted', () => { terminou = true; if (!res.writableEnded) res.destroy(); });
      up.on('end', () => { terminou = true; });
      up.pipe(res);
    });
    upstream.setTimeout(timeoutBackend, () => upstream.destroy(Object.assign(new Error('timeout'), { code: 'ETIMEDOUT' })));
    upstream.on('error', e => {
      if (terminou) return;
      terminou = true;
      enviar(res, e && e.code === 'ETIMEDOUT' ? 504 : 503, 'indisponivel');
    });
    req.setTimeout(timeoutCorpo, () => {
      if (terminou) return;
      terminou = true;
      upstream.destroy();
      enviar(res, 408, 'pedido_invalido');
    });
    req.on('data', chunk => {
      if (terminou) return;
      const b = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
      total += b.length;
      if (total > limite) {
        terminou = true;
        upstream.destroy();
        enviar(res, 413, 'pedido_invalido');
        return;
      }
      upstream.write(b);
    });
    req.on('end', () => { if (!terminou) { req.setTimeout(0); upstream.end(); } });
    req.on('aborted', () => { terminou = true; upstream.destroy(); });
    req.on('error', () => { terminou = true; upstream.destroy(); });
  };
}

function criarServidor(op) {
  op = op || {};
  const http = op.http || httpNativo;
  if (!http || typeof http.createServer !== 'function') throw new Error('HTTP_OBRIGATORIO');
  return http.createServer(criarHandler(op));
}

function iniciar(op) {
  const servidor = criarServidor(op);
  servidor.listen(PORTA_INTERNA, '0.0.0.0');
  return servidor;
}

if (require.main === module) {
  try { iniciar(); }
  catch (_) { process.stderr.write('RH151_PROXY_FALHA_INICIALIZACAO\n'); process.exitCode = 1; }
}

module.exports = { SOCKET_BACKEND, PREFIXO, PORTA_INTERNA, LIMITE_CORPO, TIMEOUT_CORPO_MS, TIMEOUT_BACKEND_MS, rotaInterna, ipDoPar, criarHandler, criarServidor, iniciar };
