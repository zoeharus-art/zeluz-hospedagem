'use strict';
const { spawnSync } = require('node:child_process');
const path = require('node:path');

// Provas sintéticas: sem navegador, rede, banco real ou envio.
for (const arquivo of ['snoopy-visual149.test.js', 'snoopy-identidade149.test.js', 'cache-zelozinha149.test.js', 'cache-zelozinha149-critico.test.js']) {
  const resultado = spawnSync(process.execPath, [path.resolve(__dirname, '../../tests', arquivo)], { stdio: 'inherit' });
  if (resultado.status !== 0) process.exit(resultado.status || 1);
}
