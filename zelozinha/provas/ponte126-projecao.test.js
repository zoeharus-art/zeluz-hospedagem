'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '../../auaulandia/index.html'), 'utf8');

function loadRecibos43() {
  const start = html.indexOf('/* recibos43/index.js */');
  const end = html.indexOf('/* recibos43/repositorio-rtdb43.js */', start);
  assert.ok(start >= 0 && end > start, 'módulo real Recibos43 delimitado no app');
  const mod = { exports: {} };
  new Function('module', 'exports', html.slice(start, end))(mod, mod.exports);
  return mod.exports;
}
function loadHubValidator(Recibos43) {
  const match = html.match(/<script data-operacao116-hub>([\s\S]*?)<\/script>/);
  assert.ok(match, 'validador do hub está no app');
  const window = { Recibos43 };
  const document = { querySelector: () => null };
  new Function('window', 'document', match[1])(window, document);
  return window.ZelozinhaOperacao116UI;
}
function loadSourceNormalizer({ Recibos43, UI }) {
  const start = html.indexOf('function zPainel104ValidarCuidados(');
  const end = html.indexOf('function zPainel44Projecao80Atual()', start);
  assert.ok(start >= 0 && end > start, 'normalizador literal e validadores adjacentes delimitados');
  const source = html.slice(start, end);
  const window = { Recibos43, ZelozinhaOperacao116UI: UI };
  const dia = '2026-10-24';
  const fn = new Function('window', 'zPainel44Dia', source + '; return zPainel44ValidarFonte80;')(window, () => dia);
  return value => fn(value, dia);
}
function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }
  return value;
}
function fixture(operation116) {
  const Recibos43 = loadRecibos43();
  const state = Recibos43.novoEstado43();
  const value = {
    versao: 81,
    dia: '2026-10-24',
    atualizadoEm: '2026-10-24T12:00:00-03:00',
    autoria: { id: 'zelozinha-zeluz', nome: 'Zelozinha', tipo: 'servico' },
    detalhesEnvioVersao: 104,
    assinaturaConteudo: 'fixture-ficticia',
    estadoRecibos43: { versao: 43, stateJson: JSON.stringify(state) },
    identidadesPets: {},
    grupos: {},
    cuidadosDia: { versao: 104, itens: {} }
  };
  if (operation116 !== undefined) value.operation116 = operation116;
  return deepFreeze(value);
}
function validOperation() {
  return {
    version: 116,
    control: { status: 'running', revision: 7, pause: null },
    channel: { status: 'operational', code: 'ready' },
    quarantines: { total: 0, items: [] }
  };
}
const Recibos43 = loadRecibos43();
const UI = loadHubValidator(Recibos43);
const normalize = loadSourceNormalizer({ Recibos43, UI });

test('operação 116 atravessa o normalizador real e passa pelo validador existente do hub', () => {
  const raw = fixture(validOperation());
  const normalized = normalize(raw);
  assert.ok(normalized, 'envelope104 fictício passa na validação da fonte');
  assert.equal(normalized.operation116, raw.operation116, 'operação é preservada sem reescrever a projeção');
  assert.equal(UI.validarProjecao(normalized), true, 'o hub consome a saída normalizada, não o input direto');
});
test('sem operation116 a fonte antiga continua normalizada e o hub mantém controle indisponível', () => {
  const normalized = normalize(fixture());
  assert.ok(normalized, 'fonte compatível antiga continua disponível para os outros consumidores');
  assert.equal(Object.hasOwn(normalized, 'operation116'), false);
  assert.equal(UI.validarProjecao(normalized), false);
});
test('operação malformada ou com campo privado é recusada pelo normalizador e não habilita o controle', () => {
  const malformed = validOperation(); malformed.control.revision = -1;
  const malformedNormalized = normalize(fixture(malformed));
  assert.equal(malformedNormalized, null);
  assert.equal(UI.validarProjecao(malformedNormalized), false);
  const privateValue = validOperation(); privateValue.internal = { credential: 'fixture-only' };
  const privateNormalized = normalize(fixture(privateValue));
  assert.equal(privateNormalized, null);
  assert.equal(UI.validarProjecao(privateNormalized), false);
});