'use strict';

// Adaptador de produção import-safe. Nada é inicializado ou escutado no import.
const fsNativo = require('node:fs');
const httpNativo = require('node:http');
const pathNativo = require('node:path');
const netNativo = require('node:net');

const NODE_MODULES_CONFIRMADO = '/opt/zeluz-piloto/releases/piloto70-24ca48a1/node_modules';
const SOCKET_CONFIRMADO = '/run/zeluz-rh151/api.sock';
const APP_ADMIN = 'zeluz-rh151';
const VERSAO_FIREBASE_ADMIN = '14.5.0';
const VERSAO_GOOGLE_AUTH = '11.3.1';

function erro(codigo) { const e = new Error(codigo); e.code = codigo; return e; }
function objeto(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }
function chavesExatas(v, permitidas) {
  return objeto(v) && Object.keys(v).every(k => permitidas.includes(k));
}

function validarConfig(config) {
  if (!chavesExatas(config, ['modelo', 'nodeModulesRoot', 'versoes', 'admin', 'socket', 'backend']) || config.modelo !== false) {
    throw erro('CONFIG_REAL_OBRIGATORIA');
  }
  if (config.nodeModulesRoot !== NODE_MODULES_CONFIRMADO) throw erro('NODE_MODULES_NAO_APROVADO');
  if (!chavesExatas(config.versoes, ['firebaseAdmin', 'googleAuth']) ||
      config.versoes.firebaseAdmin !== VERSAO_FIREBASE_ADMIN ||
      config.versoes.googleAuth !== VERSAO_GOOGLE_AUTH) throw erro('VERSAO_DEPENDENCIA_NAO_APROVADA');
  if (!chavesExatas(config.admin, ['aprovado', 'appName', 'credentialMode', 'databaseURL']) ||
      config.admin.aprovado !== true || config.admin.appName !== APP_ADMIN ||
      config.admin.credentialMode !== 'applicationDefault') throw erro('ADMIN_NAO_APROVADO');
  let db;
  try { db = new URL(config.admin.databaseURL); } catch (_) { throw erro('DATABASE_URL_INVALIDA'); }
  const hostFirebase = (db.hostname.endsWith('.firebaseio.com') && db.hostname.length > '.firebaseio.com'.length) ||
    (db.hostname.endsWith('.firebasedatabase.app') && db.hostname.length > '.firebasedatabase.app'.length);
  if (db.protocol !== 'https:' || !hostFirebase || db.port || db.origin + '/' !== db.href ||
      config.admin.databaseURL !== db.href || db.username || db.password) throw erro('DATABASE_URL_INVALIDA');
  if (!chavesExatas(config.socket, ['path', 'mode']) || config.socket.path !== SOCKET_CONFIRMADO ||
      !['0600', '0660'].includes(config.socket.mode)) throw erro('SOCKET_NAO_APROVADO');
  if (!objeto(config.backend) || config.backend.modelo !== false) throw erro('BACKEND_REAL_OBRIGATORIO');
  const ids = Object.keys(config.backend.principais || {}).sort();
  if (ids.join(',') !== 'adriana,marcia') throw erro('PRINCIPAIS_NAO_APROVADOS');
  for (const id of ids) {
    const p = config.backend.principais[id];
    if (!objeto(p) || p.id !== id || p.ativo !== true || !/^[0-9a-f]{64}$/.test(String(p.saltHex || '')) ||
        !/^[0-9a-f]{128}$/.test(String(p.hashHex || ''))) throw erro('PRINCIPAL_INVALIDA');
  }
  return config;
}

function carregarAdminCompartilhado(config, op) {
  op = op || {};
  const fs = op.fs || fsNativo;
  const carregar = op.require || require;
  function pacote(nome, versao) {
    const raiz = pathNativo.join(config.nodeModulesRoot, nome);
    const manifesto = pathNativo.join(raiz, 'package.json');
    const meta = JSON.parse(fs.readFileSync(manifesto, 'utf8'));
    if (!meta || meta.name !== nome || meta.version !== versao) throw erro('VERSAO_DEPENDENCIA_NAO_APROVADA');
    return raiz;
  }
  const adminPath = pacote('firebase-admin', config.versoes.firebaseAdmin);
  // Confere a dependência de autenticação compartilhada sem inicializá-la separadamente.
  pacote('google-auth-library', config.versoes.googleAuth);
  return carregar(adminPath);
}

function inicializarBancoAdmin(adminSdk, config) {
  if (!adminSdk || typeof adminSdk.initializeApp !== 'function' || !adminSdk.credential ||
      typeof adminSdk.credential.applicationDefault !== 'function' || typeof adminSdk.database !== 'function') {
    throw erro('ADMIN_SDK_INVALIDO');
  }
  const apps = Array.isArray(adminSdk.apps) ? adminSdk.apps : [];
  if (apps.some(a => a && a.name === APP_ADMIN)) throw erro('ADMIN_APP_JA_EXISTE');
  const app = adminSdk.initializeApp({
    credential: adminSdk.credential.applicationDefault(),
    databaseURL: config.admin.databaseURL
  }, APP_ADMIN);
  const banco = adminSdk.database(app);
  if (!banco || typeof banco.ref !== 'function') throw erro('BANCO_ADMIN_INVALIDO');
  return { app, banco };
}

function montar(op) {
  op = op || {};
  const config = validarConfig(op.config);
  const adminSdk = op.adminSdk || carregarAdminCompartilhado(config, op.modulos);
  const admin = inicializarBancoAdmin(adminSdk, config);
  const preparar = op.preparar || require('./startup.modelo.js').preparar;
  if (typeof preparar !== 'function') throw erro('STARTUP_BACKEND_INVALIDO');
  const marcaUnix = Symbol('rh151-unix');
  function ipDoProxy(req) {
    if (!req || req[marcaUnix] !== true) return '';
    const valor = req.headers && req.headers['x-rh-client-ip'];
    if (typeof valor !== 'string' || valor.length > 64 || valor.includes(',')) return '';
    const ip = valor.trim();
    return netNativo.isIP(ip) ? ip : '';
  }
  const composto = preparar({
    config: config.backend,
    bancoAdmin: admin.banco,
    // O cabeçalho só é aceito depois da marca privada aplicada pelo servidor Unix.
    // O nginx novo sempre o sobrescreve; nenhum header vindo do navegador é confiado.
    ipConfiavel: ipDoProxy,
    agora: op.agora,
    randomBytes: op.randomBytes,
    setTimeout: op.setTimeout,
    clearTimeout: op.clearTimeout
  });
  if (!composto || typeof composto.handler !== 'function') throw erro('BACKEND_INVALIDO');
  return { config, admin, marcaUnix, ipDoProxy, handler: composto.handler };
}

function iniciarUnix(op) {
  op = op || {};
  const fs = op.fs || fsNativo;
  const http = op.http || httpNativo;
  const config = validarConfig(op.config);
  const caminho = config.socket.path;
  if (fs.existsSync(caminho)) throw erro('SOCKET_EXISTENTE');
  const montado = montar(Object.assign({}, op, { config }));
  const server = http.createServer((req, res) => {
    Object.defineProperty(req, montado.marcaUnix, { value: true, enumerable: false });
    return montado.handler(req, res);
  });
  server.once('listening', () => fs.chmodSync(caminho, parseInt(montado.config.socket.mode, 8)));
  server.listen(caminho);
  return server;
}

module.exports = {
  NODE_MODULES_CONFIRMADO,
  SOCKET_CONFIRMADO,
  APP_ADMIN,
  validarConfig,
  carregarAdminCompartilhado,
  inicializarBancoAdmin,
  montar,
  iniciarUnix
};
