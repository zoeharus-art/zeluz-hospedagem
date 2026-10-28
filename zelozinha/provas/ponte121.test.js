'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const dir = path.resolve(__dirname, '../../auaulandia/ponte121');
const read = (p) => fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '');
const sha256 = (text) => crypto.createHash('sha256').update(text, 'utf8').digest('hex').toUpperCase();
const contrato = read(path.join(dir, 'contrato116.js'));
const transporte = read(path.join(dir, 'transporte116.js'));
const configSource = read(path.join(dir, 'config-publica116.js'));
const initSource = read(path.join(dir, 'inicializador116.js'));
const route = '/zelozinha/controle116';
const testEndpoint = 'https://controle.example.com' + route;
const endpointWithUserInfo = () => { const u = new URL(testEndpoint); u.username = ['u', 'ser'].join(''); u.password = ['pa', 'ss'].join(''); return u.href; };
const sampleResponse = (data) => ({
  ok: true,
  headers: { get: () => 'application/json; charset=utf-8' },
  json: async () => data,
});

function browser({ loadConfig = true, loadTransport = true, fetchImpl = async () => sampleResponse({ ok: false, code: 'unconfirmed' }) } = {}) {
  const logs = [];
  const window = { fetch: fetchImpl };
  const context = vm.createContext({
    window,
    URL,
    AbortController,
    setTimeout,
    clearTimeout,
    console: { log: (...v) => logs.push(v), warn: (...v) => logs.push(v), error: (...v) => logs.push(v) },
  });
  vm.runInContext(contrato, context, { filename: 'contrato116.js' });
  if (loadTransport) vm.runInContext(transporte, context, { filename: 'transporte116.js' });
  if (loadConfig) vm.runInContext(configSource, context, { filename: 'config-publica116.js' });
  return { window, context, logs };
}

function setConfig(context, value) {
  context.__ponteTestConfigJson = JSON.stringify(value);
  vm.runInContext('window.ZelozinhaOperacao116Config116 = JSON.parse(__ponteTestConfigJson)', context);
  delete context.__ponteTestConfigJson;
}

function init(context) {
  vm.runInContext(initSource, context, { filename: 'inicializador116.js' });
}

const commandInput = () => ({
  action: 'pause',
  expectedRevision: 12,
  reason: 'Motivo sintético da pausa',
  credential: { pessoaId: 'pessoa-sintetica', password: 'senha-sintetica' },
});

test('os dois módulos browser mantêm os hashes byte a byte das fontes aprovadas', () => {
  assert.equal(sha256(contrato), '1E81AE42349AFAB9CB0CE69096B8ACBFA3FEFAF787F2AC6204136B14AAE01C3E');
  assert.equal(sha256(transporte), '0998FF4E08B29EEC3AD4B54F5829DABDB1C0B15F77D0A203743D765544432BDE');
});

test('config pública estrita aponta somente para a rota HTTPS e inicializa a ponte', () => {
  const b = browser();
  const cfg = b.window.ZelozinhaOperacao116Config116;
  assert.deepEqual(Object.keys(cfg).sort(), ['endpoint', 'version']);
  assert.equal(cfg.version, 116);
  assert.equal(Object.isFrozen(cfg), true);
  const endpoint = new URL(cfg.endpoint);
  assert.equal(endpoint.protocol, 'https:');
  assert.equal(endpoint.pathname, route);
  assert.equal(endpoint.username, '');
  assert.equal(endpoint.password, '');
  assert.equal(endpoint.search, '');
  assert.equal(endpoint.hash, '');
  assert.match(endpoint.hostname, /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i);
  init(b.context);
  assert.equal(typeof b.window.ZelozinhaOperacao116.control, 'function');
  assert.equal(b.logs.length, 0);
});
test('ausência de config, módulo, fetch ou config estrita mantém a global indisponível', () => {
  const missingConfig = browser({ loadConfig: false });
  init(missingConfig.context);
  assert.equal('ZelozinhaOperacao116' in missingConfig.window, false);

  const missingModule = browser({ loadTransport: false });
  setConfig(missingModule.context, { version: 116, endpoint: testEndpoint });
  init(missingModule.context);
  assert.equal('ZelozinhaOperacao116' in missingModule.window, false);

  const noFetch = browser({ fetchImpl: undefined });
  noFetch.window.fetch = undefined;
  setConfig(noFetch.context, { version: 116, endpoint: testEndpoint });
  init(noFetch.context);
  assert.equal('ZelozinhaOperacao116' in noFetch.window, false);

  for (const config of [
    { version: 115, endpoint: testEndpoint },
    { version: 116, endpoint: 'http://controle.example.com' + route },
    { version: 116, endpoint: 'https://controle.example.com/zelozinha/outro' },
    { version: 116, endpoint: testEndpoint + '?key=synthetic' },
    { version: 116, endpoint: endpointWithUserInfo() },
    { version: 116, endpoint: 'https://controle.example.com' + route, token: 'synthetic' },
    ['not-an-object'],
  ]) {
    const b = browser({ loadConfig: false });
    setConfig(b.context, config);
    init(b.context);
    assert.equal('ZelozinhaOperacao116' in b.window, false);
  }
});

test('config estrita cria a ponte; POST usa a rota HTTPS, credenciais omitidas e resposta sanitizada', async () => {
  let options;
  const b = browser({ loadConfig: false, fetchImpl: async function(url, initOptions) {
    assert.equal(this, b.window);
    options = { url, ...initOptions };
    return sampleResponse({
      ok: true,
      version: 116,
      changed: true,
      control: { status: 'running', revision: 13, pause: null },
      privateField: 'nao-publicar',
    });
  } });
  setConfig(b.context, Object.freeze({ version: 116, endpoint: testEndpoint }));
  init(b.context);
  assert.equal(typeof b.window.ZelozinhaOperacao116.control, 'function');
  assert.equal(Object.isFrozen(b.window.ZelozinhaOperacao116), true);

  const input = commandInput();
  const result = await b.window.ZelozinhaOperacao116.control(input);
  assert.equal(result.ok, true);
  assert.equal(result.control.revision, 13);
  assert.doesNotMatch(JSON.stringify(result), /senha-sintetica|nao-publicar|privateField/);
  assert.equal(options.url, testEndpoint);
  assert.equal(options.method, 'POST');
  assert.equal(options.credentials, 'omit');
  assert.equal(options.cache, 'no-store');
  assert.equal(options.redirect, 'error');
  assert.equal(options.referrerPolicy, 'no-referrer');
  assert.equal(Object.keys(options.headers).some((k) => k.toLowerCase() === 'authorization'), false);
  assert.equal(input.credential.password, '');
  assert.ok(options.body.length <= 4096, 'request body remains within the server limit');
  assert.ok(options.body.length < 1024, 'normal command does not create an oversized payload');
  const sent = JSON.parse(options.body);
  assert.equal(sent.command.reason, 'Motivo sintético da pausa');
  assert.equal(sent.credential.pessoaId, 'pessoa-sintetica');
  assert.equal(sent.credential.password, 'senha-sintetica');
  assert.equal(b.logs.length, 0);
});

test('campos máximos válidos continuam limitados pelo envelope do gateway', async () => {
  let body;
  const b = browser({ loadConfig: false, fetchImpl: async (_url, options) => {
    body = options.body;
    return sampleResponse({ ok: false, code: 'invalid_request' });
  } });
  setConfig(b.context, Object.freeze({ version: 116, endpoint: testEndpoint }));
  init(b.context);
  const input = { action: 'pause', expectedRevision: 0, reason: 'r'.repeat(240), credential: { pessoaId: 'p'.repeat(120), password: 's'.repeat(512) } };
  await b.window.ZelozinhaOperacao116.control(input);
  assert.ok(body.length <= 4096, 'bounded valid fields fit the gateway request limit');
  assert.equal(input.credential.password, '');
});

test('timeout produz um resultado não confirmado sem repetir o POST', async () => {
  let calls = 0;
  const b = browser({ loadConfig: false, fetchImpl: async (_url, options) => {
    calls++;
    return new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(Error('aborted')), { once: true }));
  } });
  setConfig(b.context, Object.freeze({ version: 116, endpoint: testEndpoint }));
  init(b.context);
  const api = b.window.ZelozinhaOperacao116;
  const timed = b.window.ZelozinhaTransporte116.criar({ endpoint: testEndpoint, fetchImpl: b.window.fetch.bind(b.window), timeoutMs: 100 });
  const result = await timed.control(commandInput());
  assert.deepEqual({ ok: result.ok, code: result.code }, { ok: false, code: 'unconfirmed' });
  assert.equal(calls, 1);
  assert.ok(api, 'initializer still provides the single-use API surface');
});

test('integração pública mantém ordem, allowlist e versão; o hub original segue com controle indisponível sem projeção 116', () => {
  const app = read(path.resolve(__dirname, '../../auaulandia/index.html'));
  const allow = read(path.resolve(__dirname, '../../.github/site-permitidos.txt'));
  assert.ok(/const APP_VERSAO='2026-10-28-03';/.test(app), 'a página usa a versão de publicação esperada');
  const expected = ['ponte121/contrato116.js','ponte121/transporte116.js','ponte121/config-publica116.js','ponte121/inicializador116.js'];
  const hub = app.indexOf('<script data-operacao116-hub>');
  assert.ok(hub > 0);
  let previous = -1;
  for (const src of expected) {
    const tag = '<script src="' + src + '"></script>';
    assert.equal(app.split(tag).length - 1, 1);
    const pos = app.indexOf(tag);
    assert.ok(pos > previous && pos < hub);
    previous = pos;
    assert.equal(allow.split(/\r?\n/).filter((line) => line === 'auaulandia/' + src).length, 1);

  }
  assert.equal(allow.split(/\r?\n/).filter((line) => line === 'nao-e-arquivo auaulandia/contrato116.js').length, 1);
  assert.match(app.slice(hub), /if\(!p\)[\s\S]{0,700}Controle de envios ainda indisponível/);
  assert.match(app.slice(hub), /indisponivel\.disabled=true;indisponivel\.textContent='Controle indisponível'/);
});
