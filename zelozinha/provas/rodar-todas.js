#!/usr/bin/env node
'use strict';
/*
 * Roda todas as provas do projeto da Zelozinha (Story 6.112, Fase 2A): cada arquivo `*.test.js` desta pasta,
 * um por vez, e sai com 1 se qualquer uma falhar. Sem rede, sem banco, sem WhatsApp e sem nenhum dado de verdade.
 *
 * Uso:  node zelozinha/provas/rodar-todas.js
 *
 * É o ponto de entrada para quem muda o projeto (AGENTS.md, parte 3) e o comando que o arquivo de provas do
 * GitHub (`zelozinha-provas.yml`, a cargo do @devops) chama primeiro. Quando o código da Codex entrar, o
 * `zelozinha/testes/rodar.js` (task 12) roda os testes dela; os dois passam a ser chamados juntos.
 */

const cp = require('child_process');
const fs = require('fs');
const path = require('path');

const arquivos = fs.readdirSync(__dirname).filter((n) => n.endsWith('.test.js')).sort();
const falhas = [];

arquivos.forEach((nome) => {
  console.log('\n=== ' + nome + ' ===');
  const r = cp.spawnSync(process.execPath, [path.join(__dirname, nome)], { stdio: 'inherit' });
  if (r.status !== 0) falhas.push(nome);
});

console.log('\n' + (arquivos.length - falhas.length) + ' de ' + arquivos.length + ' arquivos de prova passaram.');
if (falhas.length) {
  console.log('VERMELHO: falharam ' + falhas.join(', ') + '.');
  process.exit(1);
}
console.log('VERDE: todas as provas do projeto passaram.');
