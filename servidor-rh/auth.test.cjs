'use strict';
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const A = require('./auth.js');

const segredos = { adriana: 'Ficticia-Adriana-DDD00-1!', marcia: 'Ficticia-Marcia-DDD00-2!' };
const limite = { janelaMs: 60_000, bloqueioMs: 120_000, maxFalhas: 2, maxConcorrentes: 2, maxConcorrentesPorIp: 1, maxSessoes: 4, maxEntradasFalha: 20 };

async function run() {
  assert.deepEqual(A.SCRYPT, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024, saltBytes: 32, hashBytes: 64 });
  await assert.rejects(A.gerarPrincipais({ segredos: { adriana: segredos.adriana, marcia: segredos.adriana } }), /SEGREDOS_IGUAIS/);
  await assert.rejects(A.gerarPrincipais({ segredos: { adriana: 'curta', marcia: segredos.marcia } }), /SEGREDO_INVALIDO/);
  const principais = await A.gerarPrincipais({ segredos, nomes: { adriana: 'Adriana', marcia: 'Márcia' } });
  assert.deepEqual(Object.keys(principais).sort(), ['adriana', 'marcia']);
  assert.equal(principais.adriana.saltHex.length, 64);
  assert.equal(principais.adriana.hashHex.length, 128);
  assert.equal(Object.values(principais).some(x => JSON.stringify(x).includes(segredos.adriana)), false);

  let agora = 1_800_000_000_000;
  const auth = A.criarAutenticacao({ principais, ttlMs: 60_000, limite, agora: () => agora, randomBytes: crypto.randomBytes });
  const login = await auth.entrar({ principal: 'adriana', segredo: segredos.adriana }, 'ip-confiavel-A');
  assert.equal(login.principal, 'adriana');
  assert.equal(login.token.length, 43);
  assert.equal(login.expiraEm, agora + 60_000);
  assert.deepEqual(auth.validar(login.token), { principal: 'adriana', nome: 'Adriana', expiraEm: agora + 60_000 });
  assert.equal(auth.diagnostico().chavesSaoHashes, true, 'RAM guarda somente chave hash do bearer');
  assert.throws(() => auth.validar('A'.repeat(43)), /NAO_AUTENTICADO/);
  assert.deepEqual(auth.sair(login.token), { ok: true, versao: 151 });
  assert.throws(() => auth.validar(login.token), /NAO_AUTENTICADO/);

  const expira = await auth.entrar({ principal: 'marcia', segredo: segredos.marcia }, 'ip-confiavel-B');
  agora += 60_001;
  assert.throws(() => auth.validar(expira.token), /NAO_AUTENTICADO/);

  const limitado = A.criarAutenticacao({ principais, ttlMs: 60_000, limite, agora: () => agora });
  await assert.rejects(limitado.entrar({ principal: 'gestao', segredo: segredos.adriana }, 'ip-C'), /CREDENCIAL_INVALIDA/);
  await assert.rejects(limitado.entrar({ principal: 'recepcao', segredo: segredos.marcia }, 'ip-C'), /CREDENCIAL_INVALIDA/);
  await assert.rejects(limitado.entrar({ principal: 'adriana', segredo: segredos.adriana }, 'ip-C'), /LIMITE_EXCEDIDO/, 'IP global não é contornado trocando principal');

  const concorrente = A.criarAutenticacao({ principais, ttlMs: 60_000, limite: { ...limite, maxConcorrentes: 1, maxConcorrentesPorIp: 1, maxFalhas: 5 }, agora: () => agora });
  const custo1 = concorrente.entrar({ principal: 'adriana', segredo: 'Senha errada fictícia' }, 'ip-custo');
  await assert.rejects(concorrente.entrar({ principal: 'marcia', segredo: 'Outra errada fictícia' }, 'ip-custo'), /LIMITE_EXCEDIDO/);
  await assert.rejects(custo1, /CREDENCIAL_INVALIDA/);
  assert.equal(concorrente.diagnostico().concorrentes, 0);

  const sessaoCap = A.criarAutenticacao({ principais, ttlMs: 60_000, limite: { ...limite, maxSessoes: 2 }, agora: () => agora });
  await sessaoCap.entrar({ principal: 'adriana', segredo: segredos.adriana }, 'ip-s1');
  await sessaoCap.entrar({ principal: 'marcia', segredo: segredos.marcia }, 'ip-s2');
  await assert.rejects(sessaoCap.entrar({ principal: 'adriana', segredo: segredos.adriana }, 'ip-s3'), /LIMITE_EXCEDIDO/);
  assert.equal(sessaoCap.diagnostico().sessoes, 2);

  const mapaCap = A.criarAutenticacao({ principais, ttlMs: 60_000, limite: { ...limite, maxFalhas: 5, maxEntradasFalha: 4 }, agora: () => agora });
  await assert.rejects(mapaCap.entrar({ principal: 'adriana', segredo: 'Errada fictícia 1' }, 'ip-m1'), /CREDENCIAL_INVALIDA/);
  await assert.rejects(mapaCap.entrar({ principal: 'marcia', segredo: 'Errada fictícia 2' }, 'ip-m2'), /CREDENCIAL_INVALIDA/);
  await assert.rejects(mapaCap.entrar({ principal: 'adriana', segredo: 'Errada fictícia 3' }, 'ip-m3'), /CREDENCIAL_INVALIDA/);
  assert.ok(mapaCap.diagnostico().falhas <= 4, 'mapa de falhas permanece limitado');
  await assert.rejects(mapaCap.entrar({ principal: 'adriana', segredo: segredos.adriana }, 'ip-m4'), /LIMITE_EXCEDIDO/, 'saturação falha fechada');

  assert.throws(() => A.criarAutenticacao({ principais, ttlMs: A.TTL_MAX_MS + 1, limite }), /TTL_INVALIDO/);
  console.log('auth151: OK');
}

module.exports = run;
if (require.main === module) run().catch(e => { console.error(e); process.exitCode = 1; });
