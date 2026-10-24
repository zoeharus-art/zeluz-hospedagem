'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

// Compilar não executa o app: não abre SDK, navegador, Firebase ou transporte.
const arquivo = path.join(__dirname, '../../auaulandia/index.html');
const html = fs.readFileSync(arquivo, 'utf8');
const scripts = Array.from(html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi));

test('todos os scripts inline da página inteira compilam, sem executar', () => {
  const inline = scripts.filter(m => !/\bsrc\s*=|\btype\s*=\s*["'](?:application\/ld\+json|application\/json)/i.test(m[1]));
  assert.ok(inline.length > 30, 'a prova precisa conferir a página completa');
  for (const m of inline) {
    const linha = html.slice(0, m.index).split('\n').length;
    assert.doesNotThrow(() => new vm.Script(m[2], { filename: `pagina-inline-linha-${linha}.js` }), `script na linha ${linha}`);
  }
});

test('módulo datado fica em tag própria, e funções nativas continuam dentro de script', () => {
  const modulo = scripts.filter(m => /\bid=["']zelozinha-dados-painel116["']/.test(m[1]));
  assert.equal(modulo.length, 1, 'módulo não pode ficar aninhado dentro do script principal');
  assert.ok(scripts.some(m => /function\s+dashCartaoHTML\s*\(/.test(m[2])), 'renderer do Lançamento do dia precisa continuar dentro de um script');
  assert.ok(!/<script\b/i.test(modulo[0][2]), 'módulo não pode conter outra abertura de script');
});
