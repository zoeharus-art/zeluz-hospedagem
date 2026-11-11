'use strict';

const { criarAutenticacao } = require('./auth.js');
const { criarDados } = require('./dados.js');
const { criarApi, criarServidor } = require('./api.js');

function erro(codigo) { const e = new Error(codigo); e.code = codigo; return e; }

function preparar(op) {
  op = op || {};
  const config = op.config;
  if (!config || config.modelo !== false) throw erro('CONFIG_REAL_OBRIGATORIA');
  if (!op.bancoAdmin || typeof op.bancoAdmin.ref !== 'function') throw erro('BANCO_ADMIN_REAL_OBRIGATORIO');
  if (typeof op.ipConfiavel !== 'function') throw erro('IP_CONFIAVEL_REAL_OBRIGATORIO');
  const auth = criarAutenticacao({
    principais: config.principais,
    ttlMs: config.ttlMs,
    limite: config.limite,
    agora: op.agora,
    randomBytes: op.randomBytes
  });
  const dados = criarDados({
    banco: op.bancoAdmin,
    timeoutMs: config.bancoTimeoutMs,
    agora: op.agora,
    setTimeout: op.setTimeout,
    clearTimeout: op.clearTimeout
  });
  const base = { auth, dados, origens: config.origens, limiteCorpo: config.limiteCorpo, corpoTimeoutMs: config.corpoTimeoutMs, ipConfiavel: op.ipConfiavel, setTimeout: op.setTimeout, clearTimeout: op.clearTimeout };
  return {
    handler: criarApi(base),
    criarServidor: http => criarServidor(Object.assign({}, base, { http })),
    auth,
    dados
  };
}

module.exports = { preparar };
