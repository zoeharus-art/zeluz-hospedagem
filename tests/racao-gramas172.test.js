'use strict';
// «Quando colocarem 40 com certeza é g. Qualquer número na frente de ração.» (Adriana, 02/nov/2026)
// Número na ração com a Medida em branco vale gramas; texto ou fração continua a conferir. Dados inventados, sem rede e sem banco.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const caminho = path.resolve(__dirname, '../auaulandia/alimentacao-hospede.js');
const Alim = require(caminho);
const Cafe = require(path.resolve(__dirname, '../auaulandia/cafe-operacional.js'));
const html = fs.readFileSync(path.resolve(__dirname, '../auaulandia/index.html'), 'utf8');

let falhas = 0, total = 0;
function prova(nome, fn) { total++; try { fn(); console.log('  ok  ' + nome); } catch (e) { falhas++; console.log('  FALHOU  ' + nome + '\n    ' + (e && e.stack || e)); } }
function estadia(racao, unidade) {
  return { nome: 'Pipoca', refKey: 'pipoca-teste', entrada: '2030-01-01', saida: '2030-01-09', status: 'ativa',
    ficha: { alim: { unidade, marca: 'Ração Teste', refs: { fixas: { cafe: { on: true, racao, natural: '', extra: '' }, almoco: { on: true, racao, natural: '', extra: '' } } } } } };
}

prova('«40» com a Medida em branco: oferecer em gramas no café e no almoço', () => {
  for (const tipo of ['cafe', 'almoco']) {
    const p = Alim.refeicaoDaEstadia(estadia('40', ''), tipo);
    assert.equal(p.estado, 'oferecer', tipo); assert.equal(p.unidade, 'gramas', tipo);
  }
  assert.equal(Alim.almocoParaCard(Alim.refeicaoDaEstadia(estadia('40', ''), 'almoco'), null).quant, '40 gramas de ração');
});

prova('números com vírgula, ponto e o «0» também valem gramas', () => {
  for (const v of ['0', '35', '42,5', '42.5']) assert.equal(Alim.refeicaoDaEstadia(estadia(v, ''), 'cafe').unidade, 'gramas', v);
});

prova('Medida escolhida no check-in continua valendo (medidor, lata, sachê)', () => {
  for (const u of ['medidor', 'lata', 'sachê', 'gramas']) {
    const p = Alim.refeicaoDaEstadia(estadia('2', u), 'cafe');
    assert.equal(p.estado, 'oferecer'); assert.equal(p.unidade, u);
  }
});

prova('texto ou fração sem Medida continua «a conferir» (não supõe gramas)', () => {
  for (const v of ['1/2', 'meia xícara', '40g?']) assert.equal(Alim.refeicaoDaEstadia(estadia(v, ''), 'cafe').estado, 'conferir-unidade-racao', v);
});

prova('o café do dia mostra «40 g de ração» e não deixa a Pipoca em «Café a conferir»', () => {
  const e = estadia('40', '');
  const r = Cafe.criar({ pronto: true, estadias: { id1: e }, hospedes: [], hoje: '2030-01-05' }).ler();
  assert.equal(r.conferencias.length, 0, JSON.stringify(r.conferencias));
  assert.equal(r.participantes.length, 1);
  assert.match(JSON.stringify(r.participantes[0]), /40 g de ração/);
});

prova('a página carrega o módulo novo e está na versão 2026-11-09-02', () => {
  assert.match(html, /<script src="alimentacao-hospede\.js\?v=2026-11-09-02"><\/script>/);
  assert.match(html, /const APP_VERSAO='2026-11-09-02';/);
});

console.log(`racao-gramas172: ${total - falhas} de ${total} provas passaram`);
if (falhas) process.exit(1);
