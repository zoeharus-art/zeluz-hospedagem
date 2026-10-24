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
function bootHub(active, suppliedWindow) {
  const match = html.match(/<script data-operacao116-hub>([\s\S]*?)<\/script>/);
  const element = () => ({ textContent: '', dataset: {}, style: {}, children: [], replaceChildren() { this.children = []; }, appendChild(child) { this.children.push(child); }, querySelector: () => null });
  const fields = new Map([
    ['[data-operacao116-control]', element()], ['[data-operacao116-channel]', element()],
    ['[data-operacao116-updated]', element()], ['[data-operacao116-message]', element()],
    ['[data-operacao116-actions]', element()], ['[data-operacao116-quarantines]', element()]
  ]);
  const hub = { querySelector: selector => fields.get(selector) || null, addEventListener() {} };
  let connects = 0;
  const window = suppliedWindow || { Recibos43: loadRecibos43(), ZelozinhaOperacao116: { control() {} }, zPainel44Despacho80Conectar() { connects++; window.Z44_DISPATCH80 = { dados: { operation116: validOperation(), atualizadoEm: '2026-10-24T12:00:00-03:00' } }; } };
  const document = {
    querySelector: selector => selector === '[data-zelozinha-hub116]' ? hub : null,
    getElementById: id => id === 'v-hoje' ? { classList: { contains: value => value === 'active' && active } } : null,
    createElement: () => element(), createTextNode: value => ({ textContent: value }), addEventListener() {}
  };
  let tick = null;
  new Function('window', 'document', 'setTimeout', 'setInterval', 'MutationObserver', match[1])(
    window, document, fn => { fn(); return 1; }, fn => { tick = fn; return 1; }, undefined
  );
  return { connects, fields, tick };
}
function loadLiteralConnector({ window, DB, normalize, getDay, onUpdate }) {
  const start = html.indexOf('function zPainel44Despacho80PararLeitura()');
  const end = html.indexOf('function zPainel104ValidarCuidados(', start);
  assert.ok(start >= 0 && end > start, 'conector literal delimitado no app');
  const source = 'var Z44_DISPATCH80={auth:null,authListener:null,db:null,ref:null,listener:null,uid:"",dia:"",dados:null,erro:"",carregando:false,importados:{},importando:{}};\n' + html.slice(start, end) + '\nreturn {state:Z44_DISPATCH80,connect:zPainel44Despacho80Conectar};';
  return new Function('window', 'DB', 'zPrev27Permite', 'zPainel44Dia', 'zPainel44ValidarFonte80', 'zPainel44Atualizar', 'zPainel44Despacho80Limpar', source)(window, DB, () => true, getDay, normalize, onUpdate, () => {});
}
function rtdbRoundTrip(value) {
  if (value === null || value === undefined) return undefined;
  if (Array.isArray(value)) {
    if (!value.length) return undefined;
    return value.map(rtdbRoundTrip);
  }
  if (typeof value !== 'object') return value;
  const out = {};
  for (const [key, item] of Object.entries(value)) {
    const kept = rtdbRoundTrip(item);
    if (kept !== undefined && (!(kept && typeof kept === 'object') || Object.keys(kept).length)) out[key] = kept;
  }
  return Object.keys(out).length ? out : undefined;
}
function loadSourceNormalizer({ Recibos43, UI, getDay = () => '2026-10-24' }) {
  const start = html.indexOf('function zPainel104ValidarCuidados(');
  const end = html.indexOf('function zPainel44Projecao80Atual()', start);
  assert.ok(start >= 0 && end > start, 'normalizador literal e validadores adjacentes delimitados');
  const source = html.slice(start, end);
  const window = { Recibos43, ZelozinhaOperacao116UI: UI };
  const fn = new Function('window', 'zPainel44Dia', source + '; return zPainel44ValidarFonte80;')(window, getDay);
  return value => fn(value, getDay());
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
test('operação malformada ou com campo privado é isolada sem apagar os cuidados válidos', () => {
  const malformed = validOperation(); malformed.control.revision = -1;
  const malformedNormalized = normalize(fixture(malformed));
  assert.ok(malformedNormalized);
  assert.equal(Object.hasOwn(malformedNormalized, 'operation116'), false);
  assert.equal(malformedNormalized.cuidadosDia.versao, 104);
  assert.equal(UI.validarProjecao(malformedNormalized), false);
  const privateValue = validOperation(); privateValue.internal = { credential: 'fixture-only' };
  const privateNormalized = normalize(fixture(privateValue));
  assert.ok(privateNormalized);
  assert.equal(Object.hasOwn(privateNormalized, 'operation116'), false);
  assert.equal(privateNormalized.cuidadosDia.versao, 104);
  assert.equal(UI.validarProjecao(privateNormalized), false);
});
test('lista vazia omitida pelo RTDB é reconstruída somente quando total é zero', () => {
  const roundTrip = validOperation(); delete roundTrip.quarantines.items;
  const normalized = normalize(fixture(roundTrip));
  assert.ok(normalized);
  assert.equal(UI.validarProjecao(normalized), true);
});
test('itens ausentes não são inferidos quando há quarentenas declaradas', () => {
  const inconsistent = validOperation(); inconsistent.quarantines.total = 1; delete inconsistent.quarantines.items;
  const normalized = normalize(fixture(inconsistent));
  assert.ok(normalized);
  assert.equal(Object.hasOwn(normalized, 'operation116'), false);
  assert.equal(normalized.cuidadosDia.versao, 104);
  assert.equal(UI.validarProjecao(fixture(inconsistent)), false);
});
test('o HUB inicia a fonte ao renderizar Hoje ativo, sem depender do contêiner antigo', () => {
  const active = bootHub(true);
  assert.equal(active.connects, 1);
  const button = active.fields.get('[data-operacao116-actions]').children[0];
  assert.equal(button.textContent, 'Pausar');
  assert.equal(button.disabled, false);
  assert.equal(bootHub(false).connects, 0);
});
test('conector, normalizador e HUB literais percorrem RTDB, atualizam e descartam callback de dia antigo', () => {
  let day = '2026-10-24', updates = 0, onCount = 0, offCount = 0;
  const refs = new Map();
  const DB = { ref(path) { const ref = { path, listener: null, on(event, listener) { assert.equal(event, 'value'); onCount++; this.listener = listener; }, off(event, listener) { assert.equal(event, 'value'); assert.equal(listener, this.listener); offCount++; } }; refs.set(path, ref); return ref; } };
  const auth = { currentUser: { uid: 'fixture-user' }, onAuthStateChanged(listener) { this.authListener = listener; return () => {}; } };
  const window = { Recibos43, ZelozinhaOperacao116UI: UI, ZelozinhaOperacao116: { control() {} }, firebase: { auth: () => auth } };
  const dynamicNormalize = loadSourceNormalizer({ Recibos43, UI, getDay: () => day });
  const connector = loadLiteralConnector({ window, DB, normalize: dynamicNormalize, getDay: () => day, onUpdate: () => { updates++; } });
  window.Z44_DISPATCH80 = connector.state;
  window.zPainel44Despacho80Conectar = connector.connect;
  const hub = bootHub(true, window);
  assert.equal(onCount, 1, 'Hoje ativo registra um único listener real');
  connector.connect();
  assert.equal(onCount, 1, 'reconexão idempotente não duplica listener');
  const path24 = 'piloto59/interno-20261019/painel81/2026-10-24';
  const oldListener = refs.get(path24).listener;
  const raw24 = rtdbRoundTrip(fixture(validOperation()));
  assert.equal(Object.hasOwn(raw24.operation116.quarantines, 'items'), false);
  assert.equal(Object.hasOwn(raw24.operation116.control, 'pause'), false);
  oldListener({ val: () => raw24 });
  assert.equal(connector.state.dados.operation116.control.revision, 7);
  hub.tick();
  const button = hub.fields.get('[data-operacao116-actions]').children[0];
  assert.equal(button.textContent, 'Pausar');
  assert.equal(button.disabled, false);
  const newer = validOperation(); newer.control.revision = 8;
  oldListener({ val: () => rtdbRoundTrip(fixture(newer)) });
  assert.equal(connector.state.dados.operation116.control.revision, 8, 'callback novo atualiza o estado normalizado');
  day = '2026-10-25'; connector.connect();
  assert.equal(offCount, 1); assert.equal(onCount, 2, 'mudança de dia troca por exatamente um listener novo');
  oldListener({ val: () => raw24 });
  assert.equal(connector.state.dados, null, 'callback do dia anterior é ignorado');
  const next = validOperation(); next.control.revision = 9;
  const raw25 = rtdbRoundTrip({ ...fixture(next), dia: '2026-10-25' });
  refs.get('piloto59/interno-20261019/painel81/2026-10-25').listener({ val: () => raw25 });
  assert.equal(connector.state.dados.operation116.control.revision, 9);
  assert.equal(updates >= 3, true);
});
