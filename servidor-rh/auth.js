'use strict';

const crypto = require('node:crypto');
const { promisify } = require('node:util');
const scryptAsync = promisify(crypto.scrypt);

const VERSAO = 151;
const PRINCIPAIS = Object.freeze(['adriana', 'marcia']);
const SCRYPT = Object.freeze({ N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024, saltBytes: 32, hashBytes: 64 });
const TTL_MAX_MS = 12 * 60 * 60 * 1000;
const TOKEN_BYTES = 32;

function texto(v) { return typeof v === 'string' ? v.trim() : ''; }
function erro(codigo) { const e = new Error(codigo); e.code = codigo; return e; }
function hex(v, bytes) { return typeof v === 'string' && new RegExp('^[0-9a-f]{' + (bytes * 2) + '}$').test(v); }
function chaveToken(token) { return crypto.createHash('sha256').update(String(token || ''), 'utf8').digest('hex'); }
function segredoValido(v) { return typeof v === 'string' && v.length >= 12 && v.length <= 128; }

async function derivar(segredo, saltHex) {
  return scryptAsync(String(segredo), Buffer.from(saltHex, 'hex'), SCRYPT.hashBytes, {
    N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p, maxmem: SCRYPT.maxmem
  });
}

async function gerarPrincipais(op) {
  op = op || {};
  const segredos = op.segredos || {};
  if (!segredoValido(segredos.adriana) || !segredoValido(segredos.marcia)) throw erro('SEGREDO_INVALIDO');
  if (segredos.adriana === segredos.marcia) throw erro('SEGREDOS_IGUAIS');
  const nomes = op.nomes || {};
  const randomBytes = op.randomBytes || crypto.randomBytes;
  const saida = {};
  for (const id of PRINCIPAIS) {
    const salt = randomBytes(SCRYPT.saltBytes);
    if (!Buffer.isBuffer(salt) || salt.length !== SCRYPT.saltBytes) throw erro('ALEATORIEDADE_INVALIDA');
    const hash = await derivar(segredos[id], salt.toString('hex'));
    saida[id] = { id, nome: texto(nomes[id]) || (id === 'adriana' ? 'Adriana' : 'Márcia'), saltHex: salt.toString('hex'), hashHex: hash.toString('hex'), ativo: true };
  }
  return saida;
}

function validarPrincipais(config) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) throw erro('CONFIG_PRINCIPAIS_OBRIGATORIA');
  const ks = Object.keys(config).sort();
  if (ks.join(',') !== PRINCIPAIS.slice().sort().join(',')) throw erro('CONFIG_PRINCIPAIS_INVALIDA');
  const out = {};
  for (const id of PRINCIPAIS) {
    const p = config[id];
    if (!p || p.id !== id || !texto(p.nome) || !hex(p.saltHex, SCRYPT.saltBytes) || !hex(p.hashHex, SCRYPT.hashBytes) || p.ativo !== true) throw erro('CONFIG_PRINCIPAL_INVALIDA');
    out[id] = Object.freeze({ id, nome: texto(p.nome), saltHex: p.saltHex, hashHex: p.hashHex, ativo: true });
  }
  return Object.freeze(out);
}

function criarAutenticacao(op) {
  op = op || {};
  const principais = validarPrincipais(op.principais);
  const agora = typeof op.agora === 'function' ? op.agora : Date.now;
  const randomBytes = op.randomBytes || crypto.randomBytes;
  const ttlMs = Number(op.ttlMs);
  if (!Number.isInteger(ttlMs) || ttlMs < 60_000 || ttlMs > TTL_MAX_MS) throw erro('TTL_INVALIDO');
  const limite = op.limite || {};
  const janelaMs = Number(limite.janelaMs), bloqueioMs = Number(limite.bloqueioMs), maxFalhas = Number(limite.maxFalhas);
  const maxConcorrentes = Number(limite.maxConcorrentes), maxConcorrentesPorIp = Number(limite.maxConcorrentesPorIp), maxSessoes = Number(limite.maxSessoes), maxEntradasFalha = Number(limite.maxEntradasFalha);
  if (!Number.isInteger(janelaMs) || janelaMs < 1_000 || !Number.isInteger(bloqueioMs) || bloqueioMs < 1_000 || !Number.isInteger(maxFalhas) || maxFalhas < 1 || maxFalhas > 50 || !Number.isInteger(maxConcorrentes) || maxConcorrentes < 1 || maxConcorrentes > 32 || !Number.isInteger(maxConcorrentesPorIp) || maxConcorrentesPorIp < 1 || maxConcorrentesPorIp > maxConcorrentes || !Number.isInteger(maxSessoes) || maxSessoes < 2 || maxSessoes > 10_000 || !Number.isInteger(maxEntradasFalha) || maxEntradasFalha < 4 || maxEntradasFalha > 100_000) throw erro('LIMITE_INVALIDO');

  const sessoes = new Map(), falhas = new Map(), pendentesPorChave = new Map(), concorrentesPorIp = new Map();
  let concorrentes = 0, saturadoAte = 0;
  const dummySalt = '00'.repeat(SCRYPT.saltBytes), dummyHash = Buffer.alloc(SCRYPT.hashBytes);

  function tempo() { const n = Number(agora()); if (!Number.isFinite(n) || n < 0) throw erro('RELOGIO_INVALIDO'); return n; }
  function limparFalhas(n) {
    for (const [k, v] of falhas) if (n - v.inicio >= janelaMs && (!v.bloqueadoAte || n >= v.bloqueadoAte)) falhas.delete(k);
  }
  function estadoFalha(key, n) {
    let v = falhas.get(key);
    if (!v || n - v.inicio >= janelaMs) { v = { inicio: n, total: 0, bloqueadoAte: 0 }; falhas.set(key, v); }
    return v;
  }
  function bloqueado(ip, principal, n) {
    limparFalhas(n);
    if (saturadoAte > n) return true;
    const ks = [ip + '|*', ip + '|' + principal];
    return ks.some(k => { const v = falhas.get(k), p = pendentesPorChave.get(k) || 0; return !!((v && v.bloqueadoAte > n) || ((v && v.total) || 0) + p >= maxFalhas); });
  }
  function falhou(ip, principal, n) {
    for (const k of [ip + '|*', ip + '|' + principal]) {
      if (!falhas.has(k) && falhas.size >= maxEntradasFalha) { saturadoAte = Math.max(saturadoAte, n + bloqueioMs); continue; }
      const v = estadoFalha(k, n); v.total += 1; if (v.total >= maxFalhas) v.bloqueadoAte = n + bloqueioMs;
    }
  }
  function reservarCusto(ip, principal, n) {
    if (bloqueado(ip, principal, n) || concorrentes >= maxConcorrentes || (concorrentesPorIp.get(ip) || 0) >= maxConcorrentesPorIp) throw erro('LIMITE_EXCEDIDO');
    const ks = [ip + '|*', ip + '|' + principal];
    concorrentes += 1; concorrentesPorIp.set(ip, (concorrentesPorIp.get(ip) || 0) + 1);
    ks.forEach(k => pendentesPorChave.set(k, (pendentesPorChave.get(k) || 0) + 1));
    return function liberar() {
      concorrentes -= 1;
      const pi = (concorrentesPorIp.get(ip) || 1) - 1; if (pi > 0) concorrentesPorIp.set(ip, pi); else concorrentesPorIp.delete(ip);
      ks.forEach(k => { const v = (pendentesPorChave.get(k) || 1) - 1; if (v > 0) pendentesPorChave.set(k, v); else pendentesPorChave.delete(k); });
    };
  }
  function limparSessoes(n) {
    for (const [k, s] of sessoes) if (s.expiraEm <= n || s.revogada) sessoes.delete(k);
  }

  async function entrar(pedido, ipConfiavel) {
    const n = tempo(), recebido = texto(pedido && pedido.principal).toLowerCase(), principal = recebido.length <= 64 ? recebido : '-', segredo = pedido && pedido.segredo;
    const ip = texto(ipConfiavel);
    if (!ip || ip.length > 128) throw erro('IP_CONFIAVEL_OBRIGATORIO');
    const liberar = reservarCusto(ip, principal || '-', n);
    const perfil = principais[principal];
    const formatoOk = segredoValido(segredo);
    const entrada = formatoOk ? segredo : String(segredo == null ? '' : segredo).slice(0, 128).padEnd(12, '\0');
    let obtido;
    try { obtido = await derivar(entrada, perfil ? perfil.saltHex : dummySalt); } finally { liberar(); }
    const esperado = perfil ? Buffer.from(perfil.hashHex, 'hex') : dummyHash;
    const confere = formatoOk && !!perfil && perfil.ativo === true && obtido.length === esperado.length && crypto.timingSafeEqual(obtido, esperado);
    if (!confere) { falhou(ip, principal || '-', n); throw erro('CREDENCIAL_INVALIDA'); }
    falhas.delete(ip + '|' + principal);
    limparSessoes(n);
    if (sessoes.size >= maxSessoes) throw erro('LIMITE_EXCEDIDO');
    const bruto = randomBytes(TOKEN_BYTES);
    if (!Buffer.isBuffer(bruto) || bruto.length !== TOKEN_BYTES) throw erro('ALEATORIEDADE_INVALIDA');
    const token = bruto.toString('base64url'), key = chaveToken(token), expiraEm = n + ttlMs;
    sessoes.set(key, Object.freeze({ principal: perfil.id, nome: perfil.nome, criadaEm: n, expiraEm, revogada: false }));
    return { ok: true, versao: VERSAO, principal: perfil.id, token, expiraEm };
  }

  function validar(token) {
    const n = tempo(); limparSessoes(n);
    if (typeof token !== 'string' || token.length < 40 || token.length > 80) throw erro('NAO_AUTENTICADO');
    const s = sessoes.get(chaveToken(token));
    if (!s || s.expiraEm <= n || s.revogada) throw erro('NAO_AUTENTICADO');
    return { principal: s.principal, nome: s.nome, expiraEm: s.expiraEm };
  }
  function sair(token) {
    if (typeof token === 'string') sessoes.delete(chaveToken(token));
    return { ok: true, versao: VERSAO };
  }
  function revogarPrincipal(principal) {
    for (const [k, s] of sessoes) if (s.principal === principal) sessoes.delete(k);
  }
  function diagnostico() { return { sessoes: sessoes.size, falhas: falhas.size, concorrentes, ipsEmCurso: concorrentesPorIp.size, pendencias: pendentesPorChave.size, chavesSaoHashes: Array.from(sessoes.keys()).every(k => /^[0-9a-f]{64}$/.test(k)) }; }

  return { entrar, validar, sair, revogarPrincipal, diagnostico };
}

module.exports = { VERSAO, PRINCIPAIS, SCRYPT, TTL_MAX_MS, TOKEN_BYTES, gerarPrincipais, criarAutenticacao };
