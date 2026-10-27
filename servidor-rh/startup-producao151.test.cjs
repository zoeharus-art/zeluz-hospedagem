'use strict';

const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const fs = require('node:fs');
const path = require('node:path');
const startup = require('./startup-producao151.js');
const executor = require('./executar-producao151.js');
const gerador = require('./gerar-verificadores151.js');

function configValida() {
  return {
    modelo: false,
    nodeModulesRoot: startup.NODE_MODULES_CONFIRMADO,
    versoes: { firebaseAdmin: '14.5.0', googleAuth: '11.3.1' },
    admin: { aprovado: true, appName: 'zeluz-rh151', credentialMode: 'applicationDefault', databaseURL: 'https://banco-ficticio.firebaseio.com/' },
    socket: { path: startup.SOCKET_CONFIRMADO, mode: '0660' },
    backend: {
      modelo: false,
      origens: ['https://app-ficticio.invalid'], ttlMs: 1000, limiteCorpo: 16384,
      corpoTimeoutMs: 1000, bancoTimeoutMs: 1000, limite: {},
      principais: {
        adriana: { id: 'adriana', nome: 'Adriana', saltHex: 'a'.repeat(64), hashHex: 'b'.repeat(128), ativo: true },
        marcia: { id: 'marcia', nome: 'Márcia', saltHex: 'c'.repeat(64), hashHex: 'd'.repeat(128), ativo: true }
      }
    }
  };
}

function fakeAdmin(contagem) {
  return {
    apps: [],
    credential: { applicationDefault() { contagem.credencial++; return { tipo: 'adc-fake' }; } },
    initializeApp(op, nome) { contagem.init++; contagem.nome = nome; contagem.url = op.databaseURL; return { name: nome }; },
    database(app) { contagem.database++; assert.equal(app.name, 'zeluz-rh151'); return { ref() {} }; }
  };
}

function fakePreparar(contagem) {
  return op => {
    contagem.preparar++;
    assert.equal(typeof op.bancoAdmin.ref, 'function');
    assert.equal(op.ipConfiavel({}), '');
    return { handler(req, res) { contagem.ip = op.ipConfiavel(req); res.end(); } };
  };
}

async function main() {
  const unit = fs.readFileSync(path.join(__dirname, 'zeluz-rh151.service.modelo'), 'utf8');
  assert.doesNotMatch(unit, /MemoryDenyWriteExecute=true/, 'V8 mantém JIT normal; --jitless não foi imposto sem prova operacional');
  assert.match(unit, /ExecStart=\/usr\/bin\/node /);
  assert.doesNotMatch(unit, /--jitless/);
  // Importar os módulos não lê configuração, não carrega Admin e não abre socket.
  assert.equal(typeof startup.iniciarUnix, 'function');
  assert.equal(typeof executor.executar, 'function');

  assert.throws(() => startup.validarConfig(Object.assign(configValida(), { modelo: true })), /CONFIG_REAL_OBRIGATORIA/);
  const extra = configValida(); extra.backend.principais.amanda = extra.backend.principais.adriana;
  assert.throws(() => startup.validarConfig(extra), /PRINCIPAIS_NAO_APROVADOS/);
  const url = configValida(); url.admin.databaseURL = 'http://banco-ficticio.invalid/';
  assert.throws(() => startup.validarConfig(url), /DATABASE_URL_INVALIDA/);
  const externo = configValida(); externo.admin.databaseURL = 'https://destino-externo.invalid/';
  assert.throws(() => startup.validarConfig(externo), /DATABASE_URL_INVALIDA/);
  const caminhoDb = configValida(); caminhoDb.admin.databaseURL = 'https://banco-ficticio.firebaseio.com/outra-raiz';
  assert.throws(() => startup.validarConfig(caminhoDb), /DATABASE_URL_INVALIDA/);
  const tcp = configValida(); tcp.socket.path = '/tmp/outro.sock';
  assert.throws(() => startup.validarConfig(tcp), /SOCKET_NAO_APROVADO/);

  const carregados = [];
  const adminFake = { marcador: true };
  const carregar = p => {
    carregados.push(p);
    if (/[\\\/]firebase-admin$/.test(p)) return adminFake;
    throw new Error('inesperado');
  };
  const manifestos = {
    'firebase-admin': { name: 'firebase-admin', version: '14.5.0' },
    'google-auth-library': { name: 'google-auth-library', version: '11.3.1' }
  };
  const fsPacotes = { readFileSync(p) { const nome = p.includes('firebase-admin') ? 'firebase-admin' : 'google-auth-library'; return JSON.stringify(manifestos[nome]); } };
  assert.equal(startup.carregarAdminCompartilhado(configValida(), { fs: fsPacotes, require: carregar }), adminFake);
  assert.equal(carregados.length, 1);

  const contagem = { credencial: 0, init: 0, database: 0, preparar: 0 };
  const servidor = new EventEmitter();
  servidor.listen = caminho => { servidor.caminho = caminho; servidor.emit('listening'); };
  servidor.close = cb => cb && cb();
  const chmod = [];
  const fsFake = { existsSync: () => false, chmodSync: (p, m) => chmod.push([p, m]) };
  const httpFake = { createServer(handler) { servidor.handler = handler; return servidor; } };
  startup.iniciarUnix({ config: configValida(), adminSdk: fakeAdmin(contagem), preparar: fakePreparar(contagem), fs: fsFake, http: httpFake });
  assert.equal(servidor.caminho, startup.SOCKET_CONFIRMADO);
  assert.deepEqual(chmod, [[startup.SOCKET_CONFIRMADO, 0o660]]);
  const req = { headers: { 'x-rh-client-ip': '192.0.2.10' } };
  servidor.handler(req, { end() {} });
  assert.equal(contagem.ip, '192.0.2.10');
  assert.deepEqual(contagem, { credencial: 1, init: 1, database: 1, preparar: 1, nome: 'zeluz-rh151', url: 'https://banco-ficticio.firebaseio.com/', ip: '192.0.2.10' });

  const antesSocket = { credencial: 0, init: 0, database: 0, preparar: 0 };
  assert.throws(() => startup.iniciarUnix({ config: configValida(), adminSdk: fakeAdmin(antesSocket), preparar: fakePreparar(antesSocket), fs: { existsSync: () => true }, http: httpFake }), /SOCKET_EXISTENTE/);
  assert.deepEqual(antesSocket, { credencial: 0, init: 0, database: 0, preparar: 0 }, 'socket existente falha antes de inicializar Admin');

  const statBom = { isFile: () => true, isSymbolicLink: () => false, mode: 0o100640, uid: typeof process.getuid === 'function' ? process.getuid() : 0 };
  const cfgLida = executor.lerConfig(executor.CONFIG, { fs: { lstatSync: () => statBom, readFileSync: () => JSON.stringify(configValida()) } });
  assert.equal(cfgLida.modelo, false);
  const statRuim = Object.assign({}, statBom, { mode: 0o100646 });
  assert.throws(() => executor.lerConfig(executor.CONFIG, { fs: { lstatSync: () => statRuim, readFileSync() { throw new Error('não deve ler'); } } }), /PERMISSAO_CONFIG_INSEGURA/);

  let recebido;
  const verificadores = await gerador.gerarCom({ adriana: 'senha-ficticia-A1', marcia: 'senha-ficticia-M2' }, async op => { recebido = op; return { ok: true }; });
  assert.deepEqual(verificadores, { ok: true });
  assert.equal(recebido.segredos.adriana, 'senha-ficticia-A1');
  await assert.rejects(gerador.gerarCom({ adriana: 'mesma-senha-123', marcia: 'mesma-senha-123' }, async () => ({})), /SEGREDOS_IGUAIS/);

  // Composição real usa os arquivos restaurados do pacote cdc32dd no próprio WT.
  const prepararReal = require('./startup.modelo.js').preparar;
  const real = configValida();
  real.backend.ttlMs = 60_000;
  real.backend.limite = { janelaMs: 60_000, bloqueioMs: 60_000, maxFalhas: 5, maxConcorrentes: 2, maxConcorrentesPorIp: 1, maxSessoes: 10, maxEntradasFalha: 40 };
  const bancoRealFake = { ref() { return { on() {}, off() {}, transaction() { return Promise.reject(new Error('fake')); }, orderByKey() { return this; }, startAt() { return this; }, endAt() { return this; }, limitToFirst() { return this; } }; } };
  const adminRealFake = { apps: [], credential: { applicationDefault() { return { fake: true }; } }, initializeApp(_op, name) { return { name }; }, database() { return bancoRealFake; } };
  const compostoReal = startup.montar({ config: real, adminSdk: adminRealFake, preparar: prepararReal });
  assert.equal(typeof compostoReal.handler, 'function');
  assert.equal(typeof compostoReal.admin.banco.ref, 'function');

  console.log('startup-producao151: adaptador e composição real passaram com Admin/banco fakes; zero socket real/rede.');
}

main().catch(e => { console.error(e); process.exitCode = 1; });
