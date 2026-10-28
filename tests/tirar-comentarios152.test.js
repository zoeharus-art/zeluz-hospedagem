'use strict';

// Tirar os comentários só no que vai para o ar (varredura 360, ganho 1 — Adriana, 27/out/2026:
// «faca os dois na ordem que sugeriu»). O módulo nunca pode mudar o código: cada caso abaixo é uma
// armadilha clássica (// dentro de texto, endereço, regex, crase; «;» automático na quebra de linha).

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const t = require('../tools/tirar-comentarios.js');

let n = 0;
function prova(nome, fn) { fn(); n += 1; void nome; }

// Roda o trecho num contexto isolado e devolve o resultado da última expressão.
function rodar(codigo) { return JSON.stringify(vm.runInNewContext(codigo, {})); }

prova('comentário sai; texto, endereço, regex e crase com «//» e «/*» ficam iguais', () => {
  const src = [
    '// cabeçalho',
    'var url = "https://exemplo.test/a//b"; // endereço',
    "var s = 'não é /* comentário */ aqui';",
    'var r = /\\/\\/[a-z]*\\/\\*/g; /* regex com barras */',
    'var c = `linha 1',
    '// isto é TEXTO dentro da crase',
    '${ /* comentário dentro do ${} */ 1 + 1 } fim`;',
    'var d = 10 / 2 / 5; // divisão, não regex',
    '[url, s, r.source, c, d]',
  ].join('\n');
  const r = t.tirarDeJS(src);
  assert.ok(r.ok, r.motivo);
  assert.ok(r.tirou > 0);
  assert.ok(r.texto.indexOf('cabeçalho') === -1 && r.texto.indexOf('endereço') === -1 && r.texto.indexOf('regex com barras') === -1);
  assert.ok(r.texto.indexOf('// isto é TEXTO dentro da crase') !== -1, 'texto dentro da crase fica');
  assert.strictEqual(rodar(r.texto), rodar(src));
});

prova('a quebra de linha que decide o «;» automático continua lá', () => {
  const src = 'function f(){ return /* aviso\n */ 42; }\nfunction g(){ return 7 // fim\n}\n[f(), g()]';
  const r = t.tirarDeJS(src);
  assert.ok(r.ok, r.motivo);
  assert.strictEqual(rodar(r.texto), '[null,7]', 'return seguido de quebra continua devolvendo undefined');
  assert.strictEqual(rodar(r.texto), rodar(src));
});

prova('linha só de comentário sai inteira; licença, /*! e sourceURL ficam', () => {
  const src = '/*! licença do autor */\n/* @license MIT */\n  // só comentário\nvar a = 1;\n//# sourceURL=app.js\n';
  const r = t.tirarDeJS(src);
  assert.ok(r.ok, r.motivo);
  assert.strictEqual(r.texto, '/*! licença do autor */\n/* @license MIT */\nvar a = 1;\n//# sourceURL=app.js\n');
});

prova('JavaScript que o acorn não lê vai como estava', () => {
  const src = 'var = ; // quebrado';
  const r = t.tirarDeJS(src);
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.texto, src);
});

prova('página: só <script> de JavaScript muda; JSON, src e o par «<!--» + «<script» ficam', () => {
  const html = [
    '<p>// isto é texto da página</p>',
    '<script>var a = 1; // tira</script>',
    '<script type="application/json">{"x":"// fica"}</script>',
    '<script src="x.js">// fica (o navegador ignora)</script>',
    '<script>var h = "<!-- <script>"; // fica: o par muda como o navegador acha o fim</script>',
    '<script type="module">export const b = 2; /* tira */</script>',
  ].join('\n');
  const r = t.tirarDeHTML(html);
  assert.ok(r.texto.indexOf('<p>// isto é texto da página</p>') !== -1);
  assert.ok(r.texto.indexOf('<script>var a = 1;</script>') !== -1);
  assert.ok(r.texto.indexOf('{"x":"// fica"}') !== -1);
  assert.ok(r.texto.indexOf('// fica (o navegador ignora)') !== -1);
  assert.ok(r.texto.indexOf('// fica: o par muda') !== -1);
  assert.strictEqual(r.recusados.length, 1);
  assert.ok(r.texto.indexOf('export const b = 2;</script>') !== -1);
});

prova('o app de verdade: tira mais de 1 MB, nenhum script recusado, e todo script continua com a mesma sintaxe', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'auaulandia', 'index.html'), 'utf8');
  const r = t.tirarDeHTML(src);
  assert.deepStrictEqual(r.recusados, []);
  assert.ok(r.tirou > 1000000, 'tirou só ' + r.tirou);
  // A prova peça por peça já está dentro do módulo; aqui, a segunda opinião é o próprio V8.
  const re = /<script\b([^<>]*)>([\s\S]*?)<\/script/gi;
  let m;
  let k = 0;
  while ((m = re.exec(r.texto)) !== null) {
    if (!m[2].trim() || /\bsrc\s*=|\btype\s*=/i.test(m[1])) continue;
    assert.doesNotThrow(() => new vm.Script(m[2]), 'script ' + k + ' deixou de compilar');
    k += 1;
  }
  assert.ok(k > 5, 'só ' + k + ' scripts conferidos');
});

prova('o montador do site usa o módulo na cópia', () => {
  const m = fs.readFileSync(path.join(__dirname, '..', 'tools', 'montar-site.js'), 'utf8');
  assert.ok(/require\('\.\/tirar-comentarios\.js'\)/.test(m));
  assert.ok(/semComentarios\(path\.join\(raiz, c\), c, comentarios\)/.test(m));
  assert.ok(fs.existsSync(path.join(__dirname, '..', 'tools', 'vendor', 'acorn-8.15.0', 'LICENSE')));
});

console.log('tirar-comentarios152: OK (' + n + ' provas)');
