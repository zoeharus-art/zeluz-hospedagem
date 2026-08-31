'use strict';
/*
 * Teste unitário do PIN de gestao.html — auditoria 28/ago/2026, item 11
 * (docs/auditoria-28ago2026/06-pontes-e-pin.md).
 *
 * NÃO abre navegador nem toca no Firebase: o script inline de gestao.html é carregado de
 * verdade (o HTML publicado é ESTE arquivo) numa sandbox `vm` do Node, com duplos mínimos de
 * `document`/`window`/`sessionStorage`. O que se prova:
 *
 *   1. sha256Hex() bate com o SHA-256 nativo do Node para o mesmo texto.
 *   2. sessaoDoAppJaAutenticada() só devolve true para papel 'gestao' ou 'diretoria' salvo
 *      pelo APP (zeluz_login) nesta mesma aba — qualquer outro papel, JSON quebrado ou
 *      ausência de sessão devolve false.
 *   3. validarPin(): sem PIN configurado no banco (pinRemoto null), só o PIN_PROVISORIO
 *      libera — e ele NÃO é mais '1007' (o antigo valor, idêntico ao PIN padrão do Monitor 3
 *      do app da equipe).
 *   4. validarPin(): com PIN configurado no banco (pinRemoto = {hash, sal}), o PIN certo
 *      libera pelo HASH — e o PIN_PROVISORIO sozinho deixa de valer.
 *   5. validarPin(): PIN errado, nos dois modos, nunca libera.
 *
 * Uso:  node tests/gestao-pin.test.js
 */

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const CAMINHO_HTML = path.join(__dirname, '..', 'gestao.html');

// ------------------------------------------------------------------ duplos mínimos de DOM
function elementoFalso() {
  const el = {
    _classes: new Set(),
    textContent: '',
    innerHTML: '',
    value: '',
    style: {},
    dataset: {},
    classList: {
      add(c) { el._classes.add(c); },
      remove(c) { el._classes.delete(c); },
      toggle(c, v) { if (v) el._classes.add(c); else el._classes.delete(c); },
      contains(c) { return el._classes.has(c); }
    }
  };
  return el;
}

function montarSandbox(sessionStorageValor) {
  const elementos = {};
  const getEl = (id) => (elementos[id] = elementos[id] || elementoFalso());
  const chamadas = { initDashboard: 0 };

  const sessionStorageFake = {
    _v: sessionStorageValor,
    getItem(k) { return k === 'zeluz_login' ? this._v : null; },
    setItem() {}, removeItem() {}
  };

  const sandbox = {
    document: {
      getElementById: getEl,
      addEventListener() {},
      head: { appendChild() {} },
      createElement() { return { }; }
    },
    window: {
      addEventListener() {},
      location: { search: '' }
    },
    sessionStorage: sessionStorageFake,
    localStorage: { getItem() { return null; }, setItem() {} },
    crypto: globalThis.crypto,   // Web Crypto real do Node — sha256Hex usa crypto.subtle
    TextEncoder,
    firebase: {
      initializeApp() { return {}; },
      auth() { return { signInAnonymously() { return Promise.reject(new Error('sem rede no teste')); } }; },
      appCheck: undefined
    },
    fetch() { return Promise.reject(new Error('sem rede no teste')); },
    console,
    URLSearchParams,
    Intl,
    Date,
    Number,
    Math,
    setInterval() { return 0; },
    setTimeout,
    _elementos: elementos,
    _chamadas: chamadas
  };
  vm.createContext(sandbox);
  return sandbox;
}

// gestao.html declara PIN_PROVISORIO, pinRemoto, pinBuffer, pinDesbloq etc. com `let`/`const`
// no topo do script. No `vm` do Node, `let`/`const` de topo de arquivo NÃO viram propriedades
// do objeto de contexto (só `var` e `function` viram) — por isso o teste não pode ler/escrever
// `sandbox.pinRemoto` diretamente. A ponte abaixo é colada NA MESMA string executada, então
// compartilha o mesmo escopo léxico, e exporta um `var __EXPORTS__` (esse sim vira propriedade
// do sandbox) com getters/setters para o que o teste precisa mexer.
const PONTE_EXPORTS = `
;var __EXPORTS__ = {
  get pinRemoto(){ return pinRemoto; }, set pinRemoto(v){ pinRemoto = v; },
  get pinBuffer(){ return pinBuffer; }, set pinBuffer(v){ pinBuffer = v; },
  get pinDesbloq(){ return pinDesbloq; },
  get PIN_PROVISORIO(){ return PIN_PROVISORIO; },
  validarPin: validarPin,
  sha256Hex: sha256Hex,
  sessaoDoAppJaAutenticada: sessaoDoAppJaAutenticada,
  init: init
};
`;

function carregarScript(sandbox) {
  const html = fs.readFileSync(CAMINHO_HTML, 'utf8');
  const m = html.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/);
  assert.ok(m, 'não achei o <script> principal de gestao.html');
  vm.runInContext(m[1] + PONTE_EXPORTS, sandbox, { filename: 'gestao.html#script' });
  // Substitui initDashboard por um espião — não queremos carregar a planilha de verdade.
  // (initDashboard É `function`, essa sim já é propriedade legítima do sandbox.)
  sandbox.initDashboard = () => { sandbox._chamadas.initDashboard++; };
  const api = sandbox.__EXPORTS__;
  api._chamadas = sandbox._chamadas;
  api._elementos = sandbox._elementos;
  return api;
}

// ------------------------------------------------------------------ os testes
const testes = [];
function teste(nome, fn) { testes.push({ nome, fn }); }

teste('PIN_PROVISORIO não é mais "1007" (o antigo valor, igual ao PIN padrão do Monitor 3)', () => {
  const sandbox = carregarScript(montarSandbox(null));
  assert.notStrictEqual(sandbox.PIN_PROVISORIO, '1007');
  assert.match(sandbox.PIN_PROVISORIO, /^\d{4}$/, 'continua um PIN de 4 dígitos, para não mudar a experiência de digitar');
});

teste('sha256Hex() bate com o SHA-256 nativo do Node', async () => {
  const sandbox = carregarScript(montarSandbox(null));
  const esperado = crypto.createHash('sha256').update('5829sal-de-teste').digest('hex');
  const calculado = await sandbox.sha256Hex('5829sal-de-teste');
  assert.strictEqual(calculado, esperado);
});

[
  { nome: 'role gestao', valor: JSON.stringify({ role: 'gestao', nome: 'Adriana' }), esperado: true },
  { nome: 'role diretoria', valor: JSON.stringify({ role: 'diretoria', nome: 'X' }), esperado: true },
  { nome: 'role plantonista', valor: JSON.stringify({ role: 'plantonista', nome: 'X' }), esperado: false },
  { nome: 'sem sessão nenhuma', valor: null, esperado: false },
  { nome: 'JSON quebrado', valor: '{isso nao e json', esperado: false },
  { nome: 'sessão sem role', valor: JSON.stringify({ nome: 'X' }), esperado: false }
].forEach(({ nome, valor, esperado }) => {
  teste(`sessaoDoAppJaAutenticada() — ${nome} → ${esperado}`, () => {
    const sandbox = carregarScript(montarSandbox(valor));
    assert.strictEqual(sandbox.sessaoDoAppJaAutenticada(), esperado);
  });
});

teste('validarPin() — sem PIN no banco: o PIN_PROVISORIO libera', async () => {
  const sandbox = carregarScript(montarSandbox(null));
  sandbox.pinRemoto = null;
  sandbox.pinBuffer = sandbox.PIN_PROVISORIO;
  await sandbox.validarPin();
  assert.strictEqual(sandbox.pinDesbloq, true);
  assert.strictEqual(sandbox._chamadas.initDashboard, 1);
});

teste('validarPin() — sem PIN no banco: PIN errado não libera', async () => {
  const sandbox = carregarScript(montarSandbox(null));
  sandbox.pinRemoto = null;
  sandbox.pinBuffer = '0000';
  assert.notStrictEqual('0000', sandbox.PIN_PROVISORIO, 'a premissa do teste furou: escolha outro valor errado');
  await sandbox.validarPin();
  assert.strictEqual(sandbox.pinDesbloq, false);
  assert.strictEqual(sandbox._chamadas.initDashboard, 0);
  assert.strictEqual(sandbox._elementos['pin-error'].textContent, 'PIN incorreto. Tente novamente.');
});

teste('validarPin() — PIN configurado no banco: o hash certo libera, e o PIN_PROVISORIO sozinho deixa de valer', async () => {
  const sandbox = carregarScript(montarSandbox(null));
  const sal = 'um-sal-de-mentira';
  const pinReal = '7734';
  const hash = crypto.createHash('sha256').update(pinReal + sal).digest('hex');
  sandbox.pinRemoto = { hash, sal };

  // o PIN certo (do banco) libera
  sandbox.pinBuffer = pinReal;
  await sandbox.validarPin();
  assert.strictEqual(sandbox.pinDesbloq, true);

  // reseta e tenta o PIN_PROVISORIO — com o banco configurado, ele NÃO deve mais valer
  const sandbox2 = carregarScript(montarSandbox(null));
  sandbox2.pinRemoto = { hash, sal };
  sandbox2.pinBuffer = sandbox2.PIN_PROVISORIO;
  await sandbox2.validarPin();
  assert.strictEqual(sandbox2.pinDesbloq, false, 'com o PIN do banco configurado, o provisório não pode mais abrir a porta');
});

teste('validarPin() — PIN configurado no banco: PIN errado não libera', async () => {
  const sandbox = carregarScript(montarSandbox(null));
  const sal = 'outro-sal';
  const hash = crypto.createHash('sha256').update('7734' + sal).digest('hex');
  sandbox.pinRemoto = { hash, sal };
  sandbox.pinBuffer = '1234';
  await sandbox.validarPin();
  assert.strictEqual(sandbox.pinDesbloq, false);
});

teste('init() — sessão do app já autenticada (Gestão/Diretoria): pula a tela de PIN', () => {
  const sandbox = carregarScript(montarSandbox(JSON.stringify({ role: 'gestao', nome: 'Adriana' })));
  // syncInternetTime/updateClock chamam fetch/Intl — deixamos rodar; fetch falha e é
  // engolido pelo próprio código (try/catch já existente), sem afetar o que testamos aqui.
  sandbox.init();
  assert.strictEqual(sandbox.pinDesbloq, true);
  assert.strictEqual(sandbox._chamadas.initDashboard, 1);
  assert.ok(sandbox._elementos['pin-screen'].classList.contains('hidden'));
});

teste('init() — sem sessão do app: a tela de PIN continua visível', () => {
  const sandbox = carregarScript(montarSandbox(null));
  sandbox.init();
  assert.strictEqual(sandbox.pinDesbloq, false);
  assert.strictEqual(sandbox._chamadas.initDashboard, 0);
  // Sem sessão, init() nunca chega a mexer no elemento — provar que ele não foi escondido
  // é provar que continua exatamente como o HTML entrega: visível.
  const tela = sandbox._elementos['pin-screen'];
  assert.ok(!tela || !tela.classList.contains('hidden'), 'a tela de PIN não pode ter sido escondida');
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
      console.log('  FALHA ' + t.nome + '\n         ' + (e.stack || e.message));
      falhou++;
    }
  }
  console.log(`\n${passou} passaram, ${falhou} falharam.`);
  process.exit(falhou ? 1 : 0);
})();
