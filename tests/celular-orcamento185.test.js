'use strict';
// «Importante colocar o celular sim!» (Adriana, 17/nov/2026)
// O orçamento de quem nunca hospedou passa a guardar o celular do tutor, para o CRM acompanhar pelo WhatsApp.
// Dados inventados, sem rede e sem banco.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const html = fs.readFileSync(path.resolve(__dirname, '../auaulandia/index.html'), 'utf8');
let falhas = 0, total = 0;
function prova(nome, fn) { total++; try { fn(); console.log('  ok  ' + nome); } catch (e) { falhas++; console.log('  FALHOU  ' + nome + '\n    ' + (e && e.stack || e)); } }
const a = html.indexOf('function orcTelDigitos'), b = html.indexOf('function orcTelMascara');
const T = new Function(html.slice(a, b) + '; return {orcTelDigitos, orcTelValido, orcTelBonito};')();
const vale = (v) => { const d = T.orcTelDigitos(v); return T.orcTelValido(d) ? T.orcTelBonito(d) : null; };

prova('o campo aparece no bloco de quem nunca hospedou', () => {
  assert.match(html, /id="orcAvTel" type="tel"/);
  assert.ok(html.indexOf('id="orcAvTel"') > html.indexOf('id="orcAvulsoBox"'));
});
prova('celular com 11 dígitos passa como está', () => { assert.equal(vale('31987654321'), '(31) 98765-4321'); });
prova('celular antigo de 10 dígitos ganha o 9', () => { assert.equal(vale('(31) 9876-5432'), '(31) 99876-5432'); assert.equal(vale('37 8888-7777'), '(37) 98888-7777'); });
prova('com 55 na frente também vale', () => { assert.equal(vale('5531987654321'), '(31) 98765-4321'); assert.equal(vale('553198765432'), '(31) 99876-5432'); });
prova('fixo e número incompleto não passam', () => { assert.equal(vale('3133334444'), null); assert.equal(vale('319876'), null); });
prova('o celular é gravado no orçamento novo, em cada FILHOt e volta na edição', () => {
  assert.match(html, /tel:\(C\.pets\.map\(function\(p\)\{ return p\.sel\.tel\|\|''; \}\)/);
  assert.equal((html.match(/sem_cadastro:!!p\.sel\.semCadastro, tel:p\.sel\.tel\|\|'',/g) || []).length, 2);
  assert.match(html, /semCadastro:!!sp\.sem_cadastro, tel:sp\.tel\|\|''\}/);
});
prova('o campo é recomendado, não obrigatório: vazio não bloqueia', () => {
  assert.match(html, /if\(tel===null\)\{ alert\('Confira o celular do tutor/);
});
console.log('\n' + (total - falhas) + '/' + total + ' provas passaram');
if (falhas) process.exit(1);
