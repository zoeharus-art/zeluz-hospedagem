'use strict';

const readline = require('node:readline');
const { Writable } = require('node:stream');

function erro(codigo) { const e = new Error(codigo); e.code = codigo; return e; }

async function gerarCom(segredos, gerarPrincipais) {
  if (!segredos || typeof segredos.adriana !== 'string' || typeof segredos.marcia !== 'string') throw erro('SEGREDOS_OBRIGATORIOS');
  if (segredos.adriana.length < 12 || segredos.adriana.length > 128 ||
      segredos.marcia.length < 12 || segredos.marcia.length > 128) throw erro('SEGREDO_INVALIDO');
  if (segredos.adriana === segredos.marcia) throw erro('SEGREDOS_IGUAIS');
  if (typeof gerarPrincipais !== 'function') throw erro('GERADOR_OBRIGATORIO');
  return gerarPrincipais({ segredos, nomes: { adriana: 'Adriana', marcia: 'Márcia' } });
}

async function coletarDoTty(op) {
  op = op || {};
  const entrada = op.entrada || process.stdin;
  const destino = op.destino || process.stderr;
  if (!entrada.isTTY || !destino.isTTY) throw erro('TTY_SEGURO_OBRIGATORIO');
  let mudo = false;
  const saida = new Writable({
    write(chunk, encoding, callback) {
      if (!mudo) destino.write(chunk, encoding);
      callback();
    }
  });
  const rl = readline.createInterface({ input: entrada, output: saida, terminal: true });
  async function segredo(rotulo) {
    destino.write(rotulo);
    mudo = true;
    try { return await new Promise(resolve => rl.question('', resolve)); }
    finally { mudo = false; destino.write('\n'); }
  }
  try {
    const adriana = await segredo('Senha nova exclusiva de Adriana: ');
    const marcia = await segredo('Senha nova exclusiva de Márcia: ');
    return { adriana, marcia };
  } finally {
    rl.close();
  }
}

async function main(op) {
  op = op || {};
  const segredos = await coletarDoTty(op);
  const gerarPrincipais = op.gerarPrincipais || require('./auth.js').gerarPrincipais;
  const verificadores = await gerarCom(segredos, gerarPrincipais);
  // Somente salts/hashes são emitidos. Senhas nunca entram em argv, env ou arquivo.
  (op.stdout || process.stdout).write(JSON.stringify(verificadores, null, 2) + '\n');
}

if (require.main === module) {
  main().catch(() => { process.stderr.write('RH151_FALHA_GERACAO\n'); process.exitCode = 1; });
}

module.exports = { gerarCom, coletarDoTty, main };
