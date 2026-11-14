'use strict';

const fs = require('node:fs');
const { iniciarUnix } = require('./startup-producao151.js');

const CONFIG = '/etc/zeluz-rh151/config.json';

function erro(codigo) { const e = new Error(codigo); e.code = codigo; return e; }

function lerConfig(caminho, op) {
  op = op || {};
  const sistema = op.fs || fs;
  if (caminho !== CONFIG) throw erro('CAMINHO_CONFIG_NAO_APROVADO');
  const lst = sistema.lstatSync(caminho);
  if (!lst.isFile() || lst.isSymbolicLink()) throw erro('CONFIG_NAO_REGULAR');
  const modo = lst.mode & 0o777;
  if ((modo & 0o007) !== 0 || (modo & 0o022) !== 0) throw erro('PERMISSAO_CONFIG_INSEGURA');
  const uid = typeof process.getuid === 'function' ? process.getuid() : null;
  if (uid != null && lst.uid !== 0 && lst.uid !== uid) throw erro('DONO_CONFIG_INVALIDO');
  const bruto = sistema.readFileSync(caminho, 'utf8');
  if (Buffer.byteLength(bruto, 'utf8') > 64 * 1024) throw erro('CONFIG_GRANDE');
  try { return JSON.parse(bruto); } catch (_) { throw erro('CONFIG_INVALIDA'); }
}

function executar(op) {
  op = op || {};
  const config = op.config || lerConfig(CONFIG, op);
  const servidor = iniciarUnix(Object.assign({}, op, { config }));
  function encerrar() {
    servidor.close(() => process.exit(0));
    const timer = setTimeout(() => process.exit(1), 5000);
    if (timer && typeof timer.unref === 'function') timer.unref();
  }
  process.once('SIGTERM', encerrar);
  process.once('SIGINT', encerrar);
  return servidor;
}

if (require.main === module) {
  try { executar(); }
  catch (_) { process.stderr.write('RH151_FALHA_INICIALIZACAO\n'); process.exitCode = 1; }
}

module.exports = { CONFIG, lerConfig, executar };
