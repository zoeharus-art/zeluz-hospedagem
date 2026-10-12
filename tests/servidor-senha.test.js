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
    porAparelho: L.criarLimitador({ max: 5, janelaMs: 600000, bloqueioMs: 900000 }),
    porIp: L.criarLimitador({ max: 20, janelaMs: 600000, bloqueioMs: 900000 }),
    geral: L.criarLimitador({ max: 150, janelaMs: 600000, bloqueioMs: 300000 }),
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

  await prova('equipe em aparelho NÃO liberado: 403, SEM o nome de quem é a senha', async () => {
    const r = await L.decidir({ pin: '4444', aparelho: APARELHO_NOVO, ip: '10.0.0.1' }, deps());
    assert.strictEqual(r.status, 403);
    assert.strictEqual(r.corpo.erro, 'aparelho');
    assert.ok(!('nome' in r.corpo));
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
    assert.strictEqual(d.porIp.tamanho() + d.porAparelho.tamanho(), 0);
  });

  await prova('5 erros do MESMO aparelho: ele espera 15 min — até com a senha certa; o celular ao lado segue', async () => {
    const d = deps();
    for (let i = 0; i < 5; i++) await L.decidir({ pin: '900' + i, aparelho: APARELHO_OK, ip: 'loja' }, d);
    const r = await L.decidir({ pin: '4444', aparelho: APARELHO_OK, ip: 'loja' }, d);
    assert.strictEqual(r.status, 429);
    assert.ok(r.corpo.esperaSeg > 0);
    // a loja inteira sai por UM endereço: o outro celular da recepção continua entrando
    assert.strictEqual((await L.decidir({ pin: '2222', aparelho: 'outro-celular-da-loja', ip: 'loja' }, d)).status, 200);
    d.t.v += 15 * 60 * 1000 + 1;
    assert.strictEqual((await L.decidir({ pin: '4444', aparelho: APARELHO_OK, ip: 'loja' }, d)).status, 200);
  });

  await prova('trocar o id do aparelho não adianta: 20 erros do mesmo endereço param o endereço', async () => {
    const d = deps();
    for (let i = 0; i < 20; i++) await L.decidir({ pin: String(7000 + i), aparelho: 'falso-' + i + '-xxxxx', ip: 'robo' }, d);
    assert.strictEqual((await L.decidir({ pin: '4444', aparelho: APARELHO_OK, ip: 'robo' }, d)).status, 429);
  });

  await prova('ataque espalhado (150 erros de endereços diferentes): o freio geral segura', async () => {
    const d = deps();
    for (let i = 0; i < 150; i++) await L.decidir({ pin: String(7000 + i), aparelho: APARELHO_OK, ip: 'ip-' + i }, d);
    assert.strictEqual((await L.decidir({ pin: '4444', aparelho: APARELHO_OK, ip: 'ip-novo' }, d)).status, 429);
  });

  await prova('acertar NÃO zera os erros: quem tem um PIN não alterna erros e acertos para testar os outros', async () => {
    const d = deps();
    for (let i = 0; i < 4; i++) await L.decidir({ pin: '900' + i, aparelho: APARELHO_OK, ip: 'ip-a' }, d);
    assert.strictEqual((await L.decidir({ pin: '4444', aparelho: APARELHO_OK, ip: 'ip-a' }, d)).status, 200);
    assert.strictEqual((await L.decidir({ pin: '9005', aparelho: APARELHO_OK, ip: 'ip-a' }, d)).status, 401);
    assert.strictEqual((await L.decidir({ pin: '4444', aparelho: APARELHO_OK, ip: 'ip-a' }, d)).status, 429, 'o 5º erro trava, com acerto no meio');
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

  // ---- Story 6.76 (AC5.8, AC6.4): a senha fixa trocada no app e a régua única do celular ---------------------------
  // O arquivo de senhas fixas ganha o `id` de cada entrada; o app guarda a senha trocada em daycare/config/senhas-fixas/{id}
  // como {hash, sal} (SHA-256(pin + sal), o formato do PIN de gestao.html). Tudo inventado.
  const crypto = require('crypto');
  const FIXAS676 = {
    '1111': { id: 'adriana', role: 'gestao', nome: 'Adriana · Gestão Total', souAdriana: true },
    '2222': { id: 'marcia', role: 'gestao', nome: 'Márcia · Gestora' },
    '3333': { id: 'plantonista', role: 'plantonista', nome: 'Plantonista' },
  };
  const guardada676 = (pin, sal) => ({ hash: crypto.createHash('sha256').update(pin + sal).digest('hex'), sal, alg: 'sha256', trocadaEm: 1, trocadaPor: 'Teste' });
  const TROCADAS676 = { adriana: guardada676('8642', 'a1b2c3d4e5f60718293a4b5c6d7e8f90') };
  const deps676 = (trocadas) => Object.assign(deps(), { tabela: async (pin) => L.montarTabela(FIXAS676, EQUIPE, trocadas, pin) });

  await prova('6.76 S1 — com a senha guardada da Adriana, o PIN do arquivo dela é recusado (401) e o novo entra com o mesmo perfil', async () => {
    const d = deps676(TROCADAS676);
    const velho = await L.decidir({ pin: '1111', aparelho: APARELHO_OK, ip: '10.0.0.7' }, d);
    assert.strictEqual(velho.status, 401);
    const novo = await L.decidir({ pin: '8642', aparelho: APARELHO_NOVO, ip: '10.0.0.7' }, d);
    assert.strictEqual(novo.status, 200);
    assert.deepStrictEqual(novo.corpo.perfil, { id: 'adriana', role: 'gestao', nome: 'Adriana · Gestão Total', souAdriana: true });
    assert.strictEqual(novo.corpo.aparelhoNovo, true, 'a Gestão continua entrando em aparelho novo para liberá-lo');
    assert.strictEqual(L.claimsDoPerfil(novo.perfil).diretoria, true);
    // a outra identidade, que não trocou, continua com o PIN do arquivo; e o PIN novo de uma não abre a outra
    assert.strictEqual((await L.decidir({ pin: '2222', aparelho: APARELHO_OK, ip: '10.0.0.8' }, d)).status, 200);
    assert.strictEqual(L.trocadaConfere('8642', TROCADAS676.adriana), true);
    assert.strictEqual(L.trocadaConfere('8643', TROCADAS676.adriana), false);
    assert.strictEqual(L.trocadaConfere('8642', { hash: 'x' }), false, 'sem o sal, nada confere');
  });

  await prova('6.76 S2 — sem senha guardada, a conta é a de sempre (a tabela é a mesma com e sem o terceiro e o quarto parâmetro)', async () => {
    assert.deepStrictEqual(L.montarTabela(FIXAS, EQUIPE, {}, '1111'), L.montarTabela(FIXAS, EQUIPE));
    assert.deepStrictEqual(L.montarTabela(FIXAS676, EQUIPE, null, '9999'), L.montarTabela(FIXAS676, EQUIPE));
    const d = deps676({});
    assert.strictEqual((await L.decidir({ pin: '1111', aparelho: APARELHO_OK, ip: '10.0.0.9' }, d)).status, 200);
    assert.strictEqual((await L.decidir({ pin: '4444', aparelho: APARELHO_OK, ip: '10.0.0.9' }, d)).status, 200);
    assert.strictEqual((await L.decidir({ pin: '9999', aparelho: APARELHO_OK, ip: '10.0.0.9' }, d)).status, 401);
  });

  await prova('6.76 S3 — a senha guardada (o hash e o sal) nunca volta no perfil nem no que vai para o rastro; a equipe não toma a senha nova', async () => {
    const T = L.montarTabela(FIXAS676, EQUIPE.concat([{ id: 'm9', nome: 'Copia Teste', senha: '8642', role: 'monitor' }]), TROCADAS676, '8642');
    assert.strictEqual(T['8642'].nome, 'Adriana · Gestão Total', 'a equipe nunca sobrescreve a senha fixa trocada');
    const r = await L.decidir({ pin: '8642', aparelho: APARELHO_OK, ip: '10.0.0.10' }, deps676(TROCADAS676));
    const tudo = JSON.stringify(r.corpo) + JSON.stringify(L.claimsDoPerfil(r.perfil)) + L.uidDoPerfil(r.perfil);
    [TROCADAS676.adriana.hash, TROCADAS676.adriana.sal, '8642', 'hash', 'sal'].forEach((x) => assert.ok(tudo.indexOf(x) < 0, x + ' vazou: ' + tudo));
  });

  await prova('6.76 S4 — aparelhoLiberado: com nome (ou a hora da autorização), liberado; com revogado, não; só com o batimento (visto), não', () => {
    assert.strictEqual(L.aparelhoLiberado({ nome: 'iPhone Daycare 1', por: 'Adriana', ts: 1 }), true);
    assert.strictEqual(L.aparelhoLiberado({ ts: 1 }), true);
    assert.strictEqual(L.aparelhoLiberado({ nome: 'iPhone Daycare 1', ts: 1, revogado: { motivo: 'perdido', registro: {} } }), false);
    assert.strictEqual(L.aparelhoLiberado({ visto: { ts: 9, quem: 'Ana' } }), false);
    assert.strictEqual(L.aparelhoLiberado(null), false);
    assert.strictEqual(L.aparelhoLiberado('sim'), false);
  });

  await prova('6.76 S5 — a pessoa desativada no Time (ativo:false) não entra pelo servidor, como no app', async () => {
    const eq = [{ id: 'm1', nome: 'Letícia', senha: '4444', role: 'monitor', ativo: false }, { id: 'm2', nome: 'Sem Papel', senha: '5555' }];
    const T = L.montarTabela(FIXAS, eq);
    assert.ok(!T['4444'] && T['5555'], JSON.stringify(Object.keys(T)));
  });

  // ---- 6.76, 2ª rodada (gate do QA): as 5 provas do QA (Quinn) na conta do servidor, trazidas para a suíte -------------------
  const fsQ = require('fs'), vmQ = require('vm');
  const appQ = fsQ.readFileSync(path.join(__dirname, '..', 'auaulandia', 'index.html'), 'utf8');
  const fnQ = (nome) => { const m = new RegExp('\\n  function ' + nome + '\\([^\\n]*\\n').exec(appQ); if (!m) throw new Error('sem ' + nome + ' no app'); return m[0]; };
  // a régua do celular e a conferência do hash, do JEITO QUE O APP ESCREVEU (o texto da função do app)
  const ctxQ = vmQ.createContext({});
  vmQ.runInContext(fnQ('aparelhoLiberado'), ctxQ);
  const appLiberado = (no) => { ctxQ.__no = no; return vmQ.runInContext('aparelhoLiberado(__no)', ctxQ); };
  const shaQ = (s) => crypto.createHash('sha256').update(s).digest('hex');

  await prova('6.76 QA676-S01 (AC6.4) — a régua do celular do servidor é a do app em 2.000 registros sorteados (nome, ts, revogado, visto, vazios, falsos e tipos errados)', () => {
    const val = [undefined, null, '', 'x', 0, 1, 1791579600000, false, true, {}, { motivo: 'm' }, [], 'revogado'];
    let dif = 0; const ex = [];
    for (let i = 0; i < 2000; i++) {
      const pega = () => val[Math.floor(Math.random() * val.length)];
      const no = (i % 50 === 0) ? pega() : {};
      if (no && typeof no === 'object' && !Array.isArray(no)) { ['nome', 'ts', 'revogado', 'visto', 'por'].forEach((k) => { const v = pega(); if (v !== undefined) no[k] = v; }); }
      const a = !!appLiberado(no), b = !!L.aparelhoLiberado(no);
      if (a !== b) { dif++; if (ex.length < 3) ex.push(JSON.stringify(no)); }
    }
    assert.deepStrictEqual([dif, ex], [0, []]);
  });

  await prova('6.76 QA676-S02 (AC5.8) — a conferência do hash do servidor é a do app nos PINs de verdade (4 a 6 dígitos, com espaço em volta) e recusa hash em maiúscula, outro sal, sal vazio e o PIN colado no sal', () => {
    const ctxH = vmQ.createContext({});
    vmQ.runInContext(appQ.slice(appQ.indexOf('  var Z_SHA256_K=['), appQ.indexOf('  // 16 bytes aleatórios em hexadecimal (o sal)')), ctxH);
    const corpo = appQ.slice(appQ.indexOf('\n  function senhaGuardadaConfere('), appQ.indexOf('\n  // A cópia do aparelho: só {hash, sal'));
    vmQ.runInContext(corpo, ctxH);
    let dif = 0;
    for (let i = 0; i < 1500; i++) {
      const n = 4 + (i % 3), pin = String(Math.floor(Math.random() * 10 ** n)).padStart(n, '0'), sal = crypto.randomBytes(16).toString('hex');
      const g = { hash: shaQ(pin + sal), sal };
      const casos = [pin, ' ' + pin + ' ', String((Number(pin) + 1) % 10 ** n).padStart(n, '0')];
      casos.forEach((c) => { ctxH.__c = c; ctxH.__g = g; if (!!vmQ.runInContext('senhaGuardadaConfere(__c, __g)', ctxH) !== L.trocadaConfere(c, g)) dif++; });
    }
    const sal = 'ab'.repeat(16), g = { hash: shaQ('8642' + sal), sal };
    assert.deepStrictEqual([dif, L.trocadaConfere('8642', g), L.trocadaConfere(' 8642 ', g), L.trocadaConfere('8642', { hash: g.hash.toUpperCase(), sal }), L.trocadaConfere('8642', { hash: g.hash, sal: 'cd' + sal.slice(2) }),
      L.trocadaConfere('8642', { hash: g.hash, sal: '' }), L.trocadaConfere('8642' + sal, { hash: g.hash, sal: '' }), L.trocadaConfere('86a2', g)], [0, true, true, false, false, false, false, false]);
  });

  await prova('6.76 QA676-S03 (AC5.5, AC5.8) — o posto trocado: a 3333 para de abrir, a nova entra como plantonista (nunca como Gestão), a 3333 fica reservada (a equipe não a toma); a senha nova de uma identidade não abre outra', async () => {
    const T = { plantonista: guardada676('7531', 'f'.repeat(32)), marcia: guardada676('2468', 'e'.repeat(32)) };
    const eq = EQUIPE.concat([{ id: 'm8', nome: 'Pega Posto Teste', senha: '3333', role: 'monitor' }]);
    const d = Object.assign(deps(), { tabela: async (pin) => L.montarTabela(FIXAS676, eq, T, pin) });
    const r1 = await L.decidir({ pin: '3333', aparelho: APARELHO_OK, ip: '10.1.0.1' }, d);
    const r2 = await L.decidir({ pin: '7531', aparelho: APARELHO_OK, ip: '10.1.0.2' }, d);
    const r3 = await L.decidir({ pin: '2468', aparelho: APARELHO_OK, ip: '10.1.0.3' }, d);
    const r4 = await L.decidir({ pin: '1111', aparelho: APARELHO_OK, ip: '10.1.0.4' }, d);
    assert.deepStrictEqual([r1.status, r2.status, r2.corpo.perfil.role, r2.corpo.perfil.id, r3.corpo.perfil.nome, r4.corpo.perfil.nome, L.ehGestao(r2.perfil)],
      [401, 200, 'plantonista', 'plantonista', 'Márcia · Gestora', 'Adriana · Gestão Total', false]);
    // a tabela montada para um PIN qualquer não lista nenhuma senha trocada (ela só entra quando é ela que foi digitada)
    assert.deepStrictEqual(Object.keys(L.montarTabela(FIXAS676, EQUIPE, T, '9999')).sort(), ['1111', '4444', '5555']);
  });

  // 2ª rodada (SEC-006): o registro fora do formato que o app grava não conta como troca, no app e no servidor — a prova do QA
  // documentava o contrário (o lixo trancava a dona fora) e passa a afirmar a escolha da 2ª rodada.
  await prova('6.76 QA676-S04 (SEC-006) — o registro trocado com lixo (hash que não é de PIN nenhum) não conta como troca: o PIN do arquivo continua abrindo — quem grava lixo no nó não tranca a dona fora (como no app)', async () => {
    const lixo = { adriana: { hash: 'zz', sal: 'qualquer' } };
    const d = Object.assign(deps(), { tabela: async (pin) => L.montarTabela(FIXAS676, EQUIPE, lixo, pin) });
    assert.strictEqual((await L.decidir({ pin: '1111', aparelho: APARELHO_OK, ip: '10.2.0.1' }, d)).status, 200);
    // só hash OU só sal não conta como troca: o PIN do arquivo continua
    const meio = { adriana: { hash: 'zz' } };
    const d2 = Object.assign(deps(), { tabela: async (pin) => L.montarTabela(FIXAS676, EQUIPE, meio, pin) });
    assert.strictEqual((await L.decidir({ pin: '1111', aparelho: APARELHO_OK, ip: '10.2.0.2' }, d2)).status, 200);
  });

  await prova('6.76 QA676-S05 (AC5.8, AC6.4) — o servidor.js lê daycare/config/senhas-fixas com o cache de 60 s, passa o PIN pedido para a tabela e usa a régua da conta (nunca !!s.val())', () => {
    const sv = fsQ.readFileSync(path.join(__dirname, '..', 'servidor-senha', 'servidor.js'), 'utf8');
    assert.ok(/db\.ref\('daycare\/config\/senhas-fixas'\)\.once\('value'\)/.test(sv), 'lê o nó');
    assert.ok(/cacheTrocadas\.v && Date\.now\(\) - cacheTrocadas\.ts < 60 \* 1000/.test(sv), 'o mesmo minuto de cache da equipe');
    assert.ok(/tabela: async \(pin\) => L\.montarTabela\(fixas\(\), await equipe\(\), await trocadas\(\), pin\)/.test(sv), 'o PIN pedido vai para a tabela');
    assert.ok(/return L\.aparelhoLiberado\(s\.val\(\)\)/.test(sv) && !/return !!s\.val\(\)/.test(sv), 'a régua da conta');
  });

  await prova('6.76 S6 (SEC-006, SEC-007, 2ª rodada) — trocadaValida: só o formato que o app grava (hash 64 e sal 32 hexadecimais, minúsculas) conta como troca; a comparação do hash é em tempo constante (timingSafeEqual)', () => {
    const g = guardada676('8642', 'a1b2c3d4e5f60718293a4b5c6d7e8f90');
    assert.deepStrictEqual([L.trocadaValida(g), L.trocadaValida({ hash: g.hash.toUpperCase(), sal: g.sal }), L.trocadaValida({ hash: g.hash, sal: 'ab' }), L.trocadaValida({ hash: 'zz', sal: g.sal }), L.trocadaValida(null), L.trocadaValida('x')], [true, false, false, false, false, false]);
    const src = String(L.trocadaConfere);
    assert.ok(/crypto\.timingSafeEqual\(/.test(src) && !/digest\('hex'\) === String/.test(src), src);
    assert.deepStrictEqual([L.trocadaConfere('8642', g), L.trocadaConfere('8643', g), L.trocadaConfere('8642', { hash: g.hash.slice(0, 63), sal: g.sal })], [true, false, false]);
  });

  console.log('\n' + ok + ' provas passaram' + (falhas.length ? (', ' + falhas.length + ' falharam:') : '.'));
  falhas.forEach((f) => console.log('  - ' + f));
  process.exit(falhas.length ? 1 : 0);
})();
