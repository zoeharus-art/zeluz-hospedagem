'use strict';
const assert = require('node:assert/strict');
const A = require('./auth.js'), S = require('./startup.modelo.js');

async function run() {
  assert.throws(() => S.preparar({}), /CONFIG_REAL_OBRIGATORIA/);
  assert.throws(() => S.preparar({ config: {} }), /CONFIG_REAL_OBRIGATORIA/);
  assert.throws(() => S.preparar({ config: { modelo: true } }), /CONFIG_REAL_OBRIGATORIA/);
  const principais = await A.gerarPrincipais({ segredos: { adriana: 'Ficticia-Adriana-DDD00-1!', marcia: 'Ficticia-Marcia-DDD00-2!' } });
  const config = { modelo: false, origens: ['https://app.exemplo.invalid'], ttlMs: 60_000, limiteCorpo: 16_384, corpoTimeoutMs: 1000, bancoTimeoutMs: 1000, limite: { janelaMs: 60_000, bloqueioMs: 60_000, maxFalhas: 5, maxConcorrentes: 2, maxConcorrentesPorIp: 1, maxSessoes: 10, maxEntradasFalha: 40 }, principais };
  assert.throws(() => S.preparar({ config }), /BANCO_ADMIN_REAL_OBRIGATORIO/);
  assert.throws(() => S.preparar({ config, bancoAdmin: { ref() {} } }), /IP_CONFIAVEL_REAL_OBRIGATORIO/);
  const bancoAdmin = { ref() { return { on() {}, off() {}, transaction() { return Promise.reject(new Error('fake')); }, orderByKey() { return this; }, startAt() { return this; }, endAt() { return this; }, limitToFirst() { return this; } }; } };
  const app = S.preparar({ config, bancoAdmin, ipConfiavel: () => 'ip-confiavel' });
  assert.equal(typeof app.handler, 'function');
  let recebeu = null; const server = app.criarServidor({ createServer(fn) { recebeu = fn; return { fake: true }; } });
  assert.equal(server.fake, true); assert.equal(typeof recebeu, 'function');
  console.log('startup151: OK');
}

module.exports = run;
if (require.main === module) run().catch(e => { console.error(e); process.exitCode = 1; });
