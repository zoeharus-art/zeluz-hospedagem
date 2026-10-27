'use strict';
const { spawnSync } = require('node:child_process');
const path = require('node:path');

// Somente banco e DOM simulados; os módulos do app integrado são as fontes testadas.
for (const arquivo of ['agenda-entrevistas150.test.js', 'agenda-composta150.test.js', 'agenda-regressoes150.test.js', 'agenda-entrevistas-ui150.test.js', 'entrevistas-gestao150.test.js', 'agenda-bootstrap150.test.js', 'entrevistas-permissao155.test.js', 'entrevistas-regressoes155.test.cjs']) {
  const resultado = spawnSync(process.execPath, [path.resolve(__dirname, '../../tests', arquivo)], { stdio: 'inherit' });
  if (resultado.status !== 0) process.exit(resultado.status || 1);
}
