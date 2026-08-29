'use strict';
/*
 * Teste unitário do carimbo de versão e da troca de token do App Check.
 *
 * NÃO toca no banco nem na internet: o `fetch` global é substituído por um duplo
 * que registra o que foi pedido e devolve resposta de mentira. O que se prova aqui:
 *
 *   1. sem FIREBASE_APPCHECK_DEBUG_TOKEN, obterTokenAppCheck() devolve null e
 *      NENHUMA chamada de rede acontece — comportamento idêntico ao de antes;
 *   2. com a variável, a troca vai para a URL oficial, pelo método POST, com o
 *      corpo { debug_token: ... };
 *   3. o token que volta entra no cabeçalho X-Firebase-AppCheck da chamada ao banco;
 *   4. sem token, esse cabeçalho não existe;
 *   5. o carimbo completo grava a versão certa, com a prova junto;
 *   6. instalarNoHttps() põe o cabeçalho só nas chamadas ao firebaseio.com.
 *
 * Uso:  node tests/carimbar-versao.test.js
 */

const assert = require('assert');
const path = require('path');

const appcheck = require('./lib/appcheck');
const carimbo = require(path.join('..', 'tools', 'carimbar-versao'));

const fetchOriginal = globalThis.fetch;
let chamadas = [];

/** Duplo do fetch: registra o pedido e responde conforme a URL. */
function instalarFetchFalso() {
  chamadas = [];
  globalThis.fetch = async (url, opcoes) => {
    chamadas.push({ url: String(url), opcoes: opcoes || {} });
    if (String(url).indexOf('exchangeDebugToken') !== -1) {
      return respostaFalsa(200, { token: 'TOKEN-APPCHECK-DE-MENTIRA', ttl: '3600s' });
    }
    if (String(url).indexOf('identitytoolkit') !== -1) {
      return respostaFalsa(200, { idToken: 'TOKEN-ANONIMO-DE-MENTIRA' });
    }
    if (String(url).indexOf('firebaseio.com') !== -1) {
      return respostaFalsa(200, '2026-08-28-01');
    }
    throw new Error('URL inesperada no teste: ' + url);
  };
}
function respostaFalsa(status, corpo) {
  const texto = JSON.stringify(corpo);
  return { ok: status < 300, status, json: async () => JSON.parse(texto), text: async () => texto };
}
function restaurarFetch() { globalThis.fetch = fetchOriginal; }

// ------------------------------------------------------------------ os testes
const testes = [];
function teste(nome, fn) { testes.push({ nome, fn }); }

teste('sem a variável de ambiente: devolve null e não chama a rede', async () => {
  instalarFetchFalso();
  const t = await appcheck.obterTokenAppCheck({});
  assert.strictEqual(t, null, 'sem segredo o token tem de ser null');
  assert.strictEqual(chamadas.length, 0, 'não pode haver chamada de rede nenhuma');
});

teste('com a variável: troca pela API oficial, POST, corpo debug_token', async () => {
  instalarFetchFalso();
  const t = await appcheck.obterTokenAppCheck({ FIREBASE_APPCHECK_DEBUG_TOKEN: 'segredo-de-mentira' });
  assert.strictEqual(t, 'TOKEN-APPCHECK-DE-MENTIRA');
  assert.strictEqual(chamadas.length, 1);
  const c = chamadas[0];
  assert.ok(c.url.startsWith('https://firebaseappcheck.googleapis.com/v1/projects/hospedagem-zeluz/apps/'),
    'a URL tem de ser a oficial do App Check: ' + c.url);
  assert.ok(c.url.indexOf(':exchangeDebugToken?key=') !== -1, 'falta o método exchangeDebugToken: ' + c.url);
  assert.strictEqual(c.opcoes.method, 'POST');
  assert.deepStrictEqual(JSON.parse(c.opcoes.body), { debug_token: 'segredo-de-mentira' });
});

teste('cabecalhosFirebase: com token põe o cabeçalho, sem token não põe nada', () => {
  assert.deepStrictEqual(appcheck.cabecalhosFirebase('abc'), { 'X-Firebase-AppCheck': 'abc' });
  assert.deepStrictEqual(appcheck.cabecalhosFirebase(null), {});
  assert.deepStrictEqual(appcheck.cabecalhosFirebase(undefined), {});
});

teste('montarPedido: o token do App Check vai no cabeçalho X-Firebase-AppCheck', () => {
  const p = carimbo.montarPedido('PUT', 'daycare/config/versao-app', 'AUTH', 'APPCHECK', '2026-08-28-01');
  assert.strictEqual(p.opcoes.headers['X-Firebase-AppCheck'], 'APPCHECK');
  assert.strictEqual(p.opcoes.method, 'PUT');
  assert.strictEqual(p.opcoes.body, JSON.stringify('2026-08-28-01'));
  assert.ok(p.url.indexOf('daycare/config/versao-app.json?auth=AUTH') !== -1, p.url);
});

teste('montarPedido: sem token do App Check o cabeçalho não existe', () => {
  const p = carimbo.montarPedido('GET', 'daycare/config/versao-app', 'AUTH', null);
  assert.ok(!('X-Firebase-AppCheck' in p.opcoes.headers), 'não pode haver cabeçalho de App Check');
  assert.strictEqual(p.opcoes.body, undefined);
});

teste('carimbar(): grava a versão e manda a prova em TODA chamada ao banco', async () => {
  instalarFetchFalso();
  process.env.FIREBASE_APPCHECK_DEBUG_TOKEN = 'segredo-de-mentira';
  let r;
  try { r = await carimbo.carimbar('2026-08-28-01'); }
  finally { delete process.env.FIREBASE_APPCHECK_DEBUG_TOKEN; }

  assert.strictEqual(r.comAppCheck, true);
  assert.strictEqual(r.gravado, '2026-08-28-01');

  const aoBanco = chamadas.filter((c) => c.url.indexOf('firebaseio.com') !== -1);
  assert.strictEqual(aoBanco.length, 2, 'uma gravação e uma conferência');
  aoBanco.forEach((c) => {
    assert.strictEqual(c.opcoes.headers['X-Firebase-AppCheck'], 'TOKEN-APPCHECK-DE-MENTIRA',
      'toda chamada ao banco tem de levar a prova');
  });
  assert.strictEqual(aoBanco[0].opcoes.method, 'PUT');
  assert.strictEqual(aoBanco[0].opcoes.body, JSON.stringify('2026-08-28-01'));
});

teste('carimbar() sem a variável: nenhuma chamada ao banco leva cabeçalho de App Check', async () => {
  instalarFetchFalso();
  delete process.env.FIREBASE_APPCHECK_DEBUG_TOKEN;
  const r = await carimbo.carimbar('2026-08-28-01');
  assert.strictEqual(r.comAppCheck, false);
  const aoBanco = chamadas.filter((c) => c.url.indexOf('firebaseio.com') !== -1);
  assert.ok(aoBanco.length > 0);
  aoBanco.forEach((c) => {
    assert.ok(!('X-Firebase-AppCheck' in c.opcoes.headers), 'sem variável, nada muda');
  });
  assert.strictEqual(chamadas.filter((c) => c.url.indexOf('exchangeDebugToken') !== -1).length, 0);
});

teste('instalarNoHttps: põe a prova só no firebaseio.com', () => {
  const pedidos = [];
  const httpsFalso = { request: (o) => { pedidos.push(o); return { on() {}, write() {}, end() {} }; } };
  const t = appcheck.instalarNoHttps(httpsFalso, { token: 'TOKEN-X' });
  assert.strictEqual(t, 'TOKEN-X');

  httpsFalso.request({ hostname: 'hospedagem-zeluz-default-rtdb.firebaseio.com', path: '/x.json' });
  httpsFalso.request({ hostname: 'identitytoolkit.googleapis.com', path: '/v1/x' });

  assert.strictEqual(pedidos[0].headers['X-Firebase-AppCheck'], 'TOKEN-X');
  assert.ok(!pedidos[1].headers || !pedidos[1].headers['X-Firebase-AppCheck'],
    'o login anônimo não leva prova de App Check');
});

teste('instalarNoHttps sem a variável de ambiente: não mexe em nada', () => {
  delete process.env.FIREBASE_APPCHECK_DEBUG_TOKEN;
  const original = () => {};
  const httpsFalso = { request: original };
  const t = appcheck.instalarNoHttps(httpsFalso);
  assert.strictEqual(t, null);
  assert.strictEqual(httpsFalso.request, original, 'o https.request tem de ficar intocado');
});

// ------------------------------------------------------------------ execução
(async () => {
  let passou = 0, falhou = 0;
  for (const t of testes) {
    try {
      await t.fn();
      console.log('  ok   ' + t.nome);
      passou++;
    } catch (e) {
      console.log('  FALHA ' + t.nome + '\n         ' + e.message);
      falhou++;
    }
  }
  restaurarFetch();
  console.log(`\n${passou} passaram, ${falhou} falharam.`);
  process.exit(falhou ? 1 : 0);
})();
