'use strict';
/*
 * PROVA da conta do servidor da senha (servidor-senha/logica.js) — Rota A, Fase 0 do PRD-006.
 * Sem rede, sem banco e sem senha de verdade: todos os PINs daqui são inventados.
 *
 * Uso:  node tests/servidor-senha.test.js
 */
const assert = require('assert');
const path = require('path');
const L = require(path.join(__dirname, '..', 'servidor-senha', 'logica.js'));

let ok = 0; const falhas = [];
async function prova(nome, fn) {
  try { await fn(); ok++; console.log('  ✓ ' + nome); }
  catch (e) { falhas.push(nome + ' — ' + e.message); console.log('  ✗ ' + nome + '\n      ' + e.message); }
}

const FIXAS = {
  '1111': { role: 'gestao', nome: 'Adriana · Gestão Total', souAdriana: true },
  '2222': { role: 'gestao', nome: 'Márcia · Gestora' },
  '3333': { role: 'plantonista', nome: 'Plantonista' },
};
const EQUIPE = [
  { id: 'm1', nome: 'Letícia', senha: '4444', role: 'monitor' },
  { id: 'm2', nome: 'Sem Papel', senha: '5555' },                 // sem role: vale 'monitor'
  { id: 'm3', nome: 'Tenta Roubar', senha: '1111', role: 'monitor' }, // igual a uma fixa: não sobrescreve
  { id: 'm4', nome: 'Senha Torta', senha: '12a4', role: 'vet' },   // fora do formato: fica de fora
];
const APARELHO_OK = 'aparelho-liberado-001';
const APARELHO_NOVO = 'aparelho-desconhecido-999';

function deps(relogio) {
  const t = { v: relogio || 1000000 };
  return {
    t,
    agora: () => t.v,
    tabela: async () => L.montarTabela(FIXAS, EQUIPE),
    aparelhoLiberado: async (id) => id === APARELHO_OK,
    porIp: L.criarLimitador({ max: 5, janelaMs: 600000, bloqueioMs: 900000 }),
    geral: L.criarLimitador({ max: 60, janelaMs: 600000, bloqueioMs: 600000 }),
  };
}

(async () => {
  console.log('Servidor da senha — a conta');

  await prova('a tabela junta fixas e equipe; a equipe nunca sobrescreve uma senha fixa', () => {
    const T = L.montarTabela(FIXAS, EQUIPE);
    assert.strictEqual(T['1111'].nome, 'Adriana · Gestão Total');
    assert.strictEqual(T['4444'].role, 'monitor');
    assert.strictEqual(T['5555'].role, 'monitor', 'sem papel vale monitor, como na tela');
    assert.ok(!T['12a4'], 'senha fora do formato fica de fora');
  });

  await prova('senha certa em aparelho liberado: entra, e a senha NÃO volta no perfil', async () => {
    const r = await L.decidir({ pin: '4444', aparelho: APARELHO_OK, ip: '10.0.0.1' }, deps());
    assert.strictEqual(r.status, 200);
    assert.strictEqual(r.corpo.perfil.nome, 'Letícia');
    assert.ok(!('senha' in r.corpo.perfil) && !('fonte' in r.corpo.perfil));
    assert.strictEqual(r.corpo.aparelhoNovo, false);
  });

  await prova('senha errada: 401, e não diz de quem seria', async () => {
    const r = await L.decidir({ pin: '9999', aparelho: APARELHO_OK, ip: '10.0.0.1' }, deps());
    assert.strictEqual(r.status, 401);
    assert.deepStrictEqual(Object.keys(r.corpo).sort(), ['erro', 'ok']);
  });

  await prova('equipe em aparelho NÃO liberado: 403 (a trava de aparelho de 05/ago vale no servidor)', async () => {
    const r = await L.decidir({ pin: '4444', aparelho: APARELHO_NOVO, ip: '10.0.0.1' }, deps());
    assert.strictEqual(r.status, 403);
    assert.strictEqual(r.corpo.erro, 'aparelho');
  });

  await prova('Gestão em aparelho novo: entra, marcada como aparelho novo (para poder liberá-lo)', async () => {
    const r = await L.decidir({ pin: '2222', aparelho: APARELHO_NOVO, ip: '10.0.0.1' }, deps());
    assert.strictEqual(r.status, 200);
    assert.strictEqual(r.corpo.aparelhoNovo, true);
  });

  await prova('pedido torto (senha com letra, aparelho sem id): 400, sem gastar tentativa', async () => {
    const d = deps();
    assert.strictEqual((await L.decidir({ pin: '12a4', aparelho: APARELHO_OK, ip: 'x' }, d)).status, 400);
    assert.strictEqual((await L.decidir({ pin: '4444', aparelho: '', ip: 'x' }, d)).status, 400);
    assert.strictEqual(d.porIp.tamanho(), 0);
  });

  await prova('5 erros do mesmo endereço em 10 min: o 6º pedido espera — até com a senha certa', async () => {
    const d = deps();
    for (let i = 0; i < 5; i++) await L.decidir({ pin: '900' + i, aparelho: APARELHO_OK, ip: '10.9.9.9' }, d);
    const r = await L.decidir({ pin: '4444', aparelho: APARELHO_OK, ip: '10.9.9.9' }, d);
    assert.strictEqual(r.status, 429);
    assert.ok(r.corpo.esperaSeg > 0);
    // outro endereço segue entrando
    assert.strictEqual((await L.decidir({ pin: '4444', aparelho: APARELHO_OK, ip: '10.1.1.1' }, d)).status, 200);
    // passados 15 minutos, o endereço volta
    d.t.v += 15 * 60 * 1000 + 1;
    assert.strictEqual((await L.decidir({ pin: '4444', aparelho: APARELHO_OK, ip: '10.9.9.9' }, d)).status, 200);
  });

  await prova('ataque espalhado (60 erros de endereços diferentes): o freio geral segura todo mundo', async () => {
    const d = deps();
    for (let i = 0; i < 60; i++) await L.decidir({ pin: String(7000 + i), aparelho: APARELHO_OK, ip: 'ip-' + i }, d);
    const r = await L.decidir({ pin: '4444', aparelho: APARELHO_OK, ip: 'ip-novo' }, d);
    assert.strictEqual(r.status, 429);
  });

  await prova('acertar a senha zera os erros daquele endereço', async () => {
    const d = deps();
    for (let i = 0; i < 4; i++) await L.decidir({ pin: '900' + i, aparelho: APARELHO_OK, ip: 'ip-a' }, d);
    assert.strictEqual((await L.decidir({ pin: '4444', aparelho: APARELHO_OK, ip: 'ip-a' }, d)).status, 200);
    assert.strictEqual((await L.decidir({ pin: '9005', aparelho: APARELHO_OK, ip: 'ip-a' }, d)).status, 401, 'o 1º erro depois do acerto não bloqueia');
  });

  await prova('o token leva só papel, nome, id e a marca da Diretoria; o uid é estável por pessoa', () => {
    const T = L.montarTabela(FIXAS, EQUIPE);
    const c = L.claimsDoPerfil(T['1111']);
    assert.deepStrictEqual(Object.keys(c).sort(), ['diretoria', 'monId', 'nome', 'role']);
    assert.strictEqual(c.diretoria, true);
    assert.strictEqual(L.uidDoPerfil(T['4444']), 'zeluz-monitor-m1');
    assert.strictEqual(L.uidDoPerfil(T['2222']), 'zeluz-gestao-marcia-gestora');
    assert.ok(Buffer.byteLength(JSON.stringify(c)) < 1000, 'cabe no limite do Firebase');
  });

  console.log('\n' + ok + ' provas passaram' + (falhas.length ? (', ' + falhas.length + ' falharam:') : '.'));
  falhas.forEach((f) => console.log('  - ' + f));
  process.exit(falhas.length ? 1 : 0);
})();
