'use strict';

const { spawnSync } = require('node:child_process');
const path = require('node:path');

const provas = [
  ['abertura-agil158.test.js', 'abertura-agil158: OK'],
  ['cache-zelozinha149.test.js', 'cache149: cache por dia/sessão'],
  ['cache-zelozinha149-critico.test.js', 'PASSOU: ACK enfileira leitura posterior'],
  ['zelozinha-escolhas142.test.js', 'escolhas142:'],
  ['zelozinha-quantidade156.test.js', 'quantidade156: OK']
];

for (const [arquivo, recibo] of provas) {
  const r = spawnSync(process.execPath, [path.resolve(__dirname, '../../tests', arquivo)], { encoding: 'utf8', timeout: 15000 });
  if (r.status !== 0 || !r.stdout.includes(recibo)) {
    process.stderr.write(`${arquivo} falhou ou não terminou\n${r.stdout || ''}${r.stderr || ''}`);
    process.exit(1);
  }
  process.stdout.write(r.stdout);
}
