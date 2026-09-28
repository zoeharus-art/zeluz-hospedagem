'use strict';
/*
 * PROVA da Fase 0 do "ciclo fechado" (PRD-006, 25/set/2026) — sem rede e sem banco.
 *
 * Este arquivo NÃO lê o retrato da VPS nem o Firebase: todo dado aqui é INVENTADO, com
 * nomes de brincadeira. É o que deixa a prova rodar em qualquer máquina (inclusive na
 * nuvem, onde o retrato não existe) sem tocar em dado de cliente.
 *
 * O app é carregado inteiro num sandbox (o mesmo truque do tests/harness.js: um proxy que
 * absorve qualquer acesso a tela) e as funções PURAS da Fase 0 são chamadas direto:
 *
 *   F0.1  remédio lançado na recepção vira dose esperada (medDosesDosLancamentos)
 *   F0.2  feriado: a lista do app e a da ponte do Telegram são a MESMA
 *   F0.3  Vencimentos: o painel abre onde foi o toque; "Nunca fez" lança; o "Sim, a ficha
 *         foi atualizada" só fecha com a ficha em dia (vencFichaAindaDeve)
 *   F0.4  vermífugo: dose única × duas doses, a 2ª dose recalcula a próxima, exame de fezes
 *   F0.5  pernoite de dias anteriores sem check-in continua aparecendo
 *   F0.6  Banhos recorrentes: só quem tem banho fixo, com busca para incluir
 *
 * Uso:  node tests/fase0-ciclo-fechado.test.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const APP = path.join(__dirname, '..', 'auaulandia', 'index.html');
const PONTE = path.join(__dirname, '..', 'integracao-telegram', 'Codigo.gs');

// ------------------------------------------------ o sandbox (cópia enxuta do harness.js)
function universal(name) {
  const fn = function () { return fn; };
  return new Proxy(fn, {
    get(t, p) {
      if (p === Symbol.toPrimitive) return () => '';
      if (p === 'then') return undefined;
      if (p in t) return t[p];
      return universal(name + '.' + String(p));
    },
    set() { return true; },
    apply() { return universal(name + '()'); },
    construct() { return universal('new ' + name); },
  });
}
function makeSandbox() {
  const roleHolder = { role: 'gestao' };
  const bodyEl = {
    dataset: roleHolder,
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    appendChild() {}, style: {}, addEventListener() {},
    setAttribute() {}, getAttribute() { return null; },
  };
  const documentStub = {
    body: bodyEl, head: { appendChild() {} },
    documentElement: universal('documentElement'),
    getElementById() { return universal('el'); },
    querySelector() { return null; }, querySelectorAll() { return []; },
    createElement() { return universal('el'); },
    addEventListener() {}, getElementsByClassName() { return []; }, getElementsByTagName() { return []; },
    cookie: '',
  };
  const neverResolves = new Promise(() => {});
  const sandbox = {
    console, Date, Math, JSON, Object, Array, String, Number, Boolean,
    parseInt, parseFloat, isNaN, isFinite, RegExp, Promise, Map, Set, Symbol,
    encodeURIComponent, decodeURIComponent, setTimeout() {}, clearTimeout() {},
    setInterval() {}, clearInterval() {}, requestAnimationFrame() {},
    performance: { now() { return 0; } },
    document: documentStub,
    firebase: {
      initializeApp() { return {}; },
      auth() { return { signInAnonymously() { return neverResolves; }, onAuthStateChanged() {} }; },
      database() { return { ref() { return universal('ref'); } }; },
    },
    localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
    navigator: { userAgent: 'fase0', onLine: true },
    location: { href: 'https://fase0.local/', reload() {}, hostname: 'fase0.local' },
    Blob: class Blob { constructor(parts, opts) { this.parts = parts || []; this.type = (opts && opts.type) || ''; } },
    alert() {}, confirm() { return true; }, prompt() { return ''; },
    scrollTo() {}, addEventListener() {},
  };
  sandbox.window = sandbox; sandbox.globalThis = sandbox; sandbox.self = sandbox;
  return sandbox;
}
function extractMainScript(html) {
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  let m, last = null;
  while ((m = re.exec(html)) !== null) {
    if (m[1] && m[1].length > (last ? last.length : 0)) last = m[1];
  }
  if (!last) throw new Error('Não achei o <script> inline principal');
  return last;
}

// ------------------------------------------------ a rodada
let ok = 0, falhas = [];
function prova(nome, fn) {
  try { fn(); ok++; console.log('  ✓ ' + nome); }
  catch (e) { falhas.push(nome + ' — ' + e.message); console.log('  ✗ ' + nome + '\n      ' + e.message); }
}

const ctx = vm.createContext(makeSandbox());
try {
  vm.runInContext(extractMainScript(fs.readFileSync(APP, 'utf8')), ctx, { filename: 'index.html#script', timeout: 15000 });
} catch (e) {
  console.error('FALHA ao carregar o script do app no sandbox:', e.message);
  process.exit(1);
}
console.log('Script do app carregou no sandbox (sintaxe em dia).\n');
const run = (codigo) => vm.runInContext(codigo, ctx);
// Os objetos criados dentro do sandbox têm OUTRO Object.prototype: compara-se pelo JSON.
const igual = (a, b, msg) => assert.deepStrictEqual(JSON.parse(JSON.stringify(a)), b, msg);

// ================================================================== F0.1 — remédio da recepção
console.log('F0.1 — remédio lançado na recepção entra no alarme e no vigia');
prova('medHoraHHMM normaliza a hora ("8:05" → "08:05"; texto sem hora → vazio)', () => {
  assert.strictEqual(run("medHoraHHMM('8:05')"), '08:05');
  assert.strictEqual(run("medHoraHHMM(' 14:30 ')"), '14:30');
  assert.strictEqual(run("medHoraHHMM('depois do almoço')"), '');
});
prova('lançamento com ficha e hora vira dose esperada, com o nome do remédio', () => {
  ctx.__L = { a1: { chave: 'tico__joana', hora: '9:00', valor: 'Tico (Joana)', det: { qual: 'Apoquel 5,4 mg', onde: 'NA BOLSA' } } };
  const r = run('medDosesDosLancamentos(__L, {})');
  assert.strictEqual(r.length, 1);
  assert.strictEqual(r[0].key, 'dc__tico__joana');
  assert.strictEqual(r[0].itemId, 'lanc_a1');
  assert.strictEqual(r[0].horario, '09:00');
  assert.strictEqual(r[0].nome, 'Apoquel 5,4 mg');
  assert.strictEqual(r[0].hospNome, 'Tico');
  assert.ok(/na bolsa/.test(r[0].obs), 'a origem do produto aparece na observação');
});
prova('sem ficha casada ou sem hora não vira dose (não há de quem nem quando)', () => {
  ctx.__L = { a1: { chave: '', hora: '9:00', valor: 'X' }, a2: { chave: 'tico__joana', hora: '', valor: 'Tico' } };
  assert.strictEqual(run('medDosesDosLancamentos(__L, {})').length, 0);
});
prova('QA A2 — quem está "faltou" na chamada não gera alarme nem cobrança', () => {
  ctx.__L = { a1: { chave: 'tico__joana', hora: '09:00', valor: 'Tico', det: { qual: 'Apoquel' } } };
  assert.strictEqual(run("medDosesDosLancamentos(__L, {tico__joana:'faltou'})").length, 0);
  assert.strictEqual(run("medDosesDosLancamentos(__L, {tico__joana:'veio'})").length, 1);
});
// As doses do check-in de pertences (daycare/med-dia) e as da recepção, juntas.
const DC = (hr, nome) => ({ tico__joana: { nome: 'Tico', itens: { medicacao_0: { nome: nome || 'Apoquel', dose: '1 comp', horarios: [hr] } } } });
const LANC = (hr, qual) => ({ a1: { chave: 'tico__joana', hora: hr, valor: 'Tico (Joana)', det: { qual: qual || 'Apoquel 5,4 mg' } } });
const juntar = (medDia, lancs, log) => {
  ctx.__M = medDia; ctx.__L = lancs; ctx.__G = log || {};
  return run('medJuntarDoDia(medDosesDoCheckinDia(__M), medDosesDosLancamentos(__L, {}), __G)')
    .map((d) => d.itemId + '@' + d.horario);
};
prova('mesmo FILHOt, mesmo horário: UMA dose (a do check-in de pertences, a de sempre)', () => {
  igual(juntar(DC('09:00'), LANC('9:00')), ['medicacao_0@09:00']);
});
prova('QA A1 — a recepção lançou, a Zelosa deu, DEPOIS veio o check-in: fica a dose já registrada', () => {
  const log = { dc__tico__joana: { 'lanc_a1_08-00': { quem: 'Zelosa', ts: 1 } } };
  igual(juntar(DC('08:00'), LANC('08:00'), log), ['lanc_a1@08:00'], 'o alarme não toca de novo');
});
prova('QA A1 — mesmo remédio com 30 min de diferença (08:00 × 08:30): UMA dose, não duas', () => {
  igual(juntar(DC('08:30'), LANC('08:00')), ['medicacao_0@08:30']);
});
prova('remédios diferentes, ou o mesmo com mais de 1 h de diferença: duas doses de verdade', () => {
  assert.strictEqual(juntar(DC('08:30', 'Ômega 3'), LANC('08:00', 'Apoquel')).length, 2);
  assert.strictEqual(juntar(DC('14:00'), LANC('08:00')).length, 2, '8h e 14h são duas tomadas');
});
prova('"Ômega" e "Omega 3" são o mesmo remédio; "Apoquel" e "Apoquel 5,4 mg" também', () => {
  assert.ok(run("medMesmoRemedio('Ômega', 'Omega 3 cápsula')"));
  assert.ok(run("medMesmoRemedio('Apoquel', 'apoquel 5,4 mg')"));
  assert.ok(!run("medMesmoRemedio('Vita', 'Vitamina C')"), 'palavras diferentes não se juntam');
});

// ================================================================== F0.2 — feriado
console.log('\nF0.2 — falta automática e vigia respeitam feriado');
prova('a lista de feriados da ponte do Telegram é a MESMA do app (datas iguais)', () => {
  const gs = fs.readFileSync(PONTE, 'utf8');
  const m = /var FERIADOS_PADRAO = (\{[\s\S]*?\});/.exec(gs);
  assert.ok(m, 'FERIADOS_PADRAO existe na ponte');
  const daPonte = Object.keys(vm.runInNewContext('(' + m[1] + ')')).sort();
  const doApp = JSON.parse(run('JSON.stringify(Object.keys(ORC_FERIADOS_PADRAO).sort())'));
  igual(daPonte, doApp);
});
prova('a ponte pula o feriado no aviso de falta das 12h', () => {
  const gs = fs.readFileSync(PONTE, 'utf8');
  const i = gs.indexOf('function vigiaFalta12h');
  assert.ok(i >= 0, 'vigiaFalta12h existe');
  const corpo = gs.slice(i, i + 4000);
  assert.ok(/_ehFeriado\(dia, token\)/.test(corpo), 'vigiaFalta12h consulta _ehFeriado');
});
prova('7 de setembro é feriado; 8 de setembro não', () => {
  assert.ok(run("orcEhFeriado('2026-09-07')"));
  assert.ok(!run("orcEhFeriado('2026-09-08')"));
});

// ================================================================== F0.3 — Vencimentos
console.log('\nF0.3 — Vencimentos: toque, "Nunca fez" e ficha em dia');
prova('"Nunca fez — fazer aqui" LANÇA (bolsa e loja) e avisa a veterinária no dia dele', () => {
  const bolsa = run("vencRespDef('ab_bolsa')"), loja = run("vencRespDef('ab_loja')");
  assert.strictEqual(bolsa.lanca, 'NA BOLSA');
  assert.strictEqual(loja.lanca, 'LOJA');
  assert.ok(bolsa.vetDia && loja.vetDia);
  assert.ok(run("vencRespFecha('ab_bolsa')"));
});
prova('a resposta antiga "ab_fazer" continua legível no histórico', () => {
  assert.strictEqual(run("vencRespRotulo('ab_fazer')"), 'Nunca fez — quer fazer aqui');
});
prova('o painel abre SÓ onde foi o toque (resumo do topo × cartão)', () => {
  run("PREV_CORRIGE_ABERTO=prevCorrigeAlvo('simba__ana','verm_p'); PREV_CORRIGE_ORIGEM='resumo';");
  assert.strictEqual(run("prevCorrigeAbertoAqui('simba__ana','resumo')"), true);
  assert.strictEqual(run("prevCorrigeAbertoAqui('simba__ana','')"), false, 'o cartão não desenha um segundo painel');
  assert.strictEqual(run("prevCorrigeAbertoAqui('lana__ana','resumo')"), false, 'outro FILHOt não abre');
  run("PREV_CORRIGE_ABERTO=''; PREV_CORRIGE_ORIGEM='';");
});
prova('dois FILHOts com o mesmo nome (tutores diferentes) aparecem os dois no resumo', () => {
  ctx.__L = [
    { chave: 'thor__bia', nome: 'Thor', itens: [{ k: 'verm_p', atrasado: true, vence: '2026-09-01' }] },
    { chave: 'thor__caio', nome: 'Thor', itens: [{ k: 'verm_p', atrasado: true, vence: '2026-09-02' }] },
  ];
  const G = run('vencResumoGrupos(__L)');
  const antip = G.filter((g) => g.alvos.some((a) => a.k === 'verm_p'))[0];
  assert.ok(antip, 'o grupo do vermífugo existe');
  assert.strictEqual(antip.alvos.length, 2);
});
prova('"Sim, ficha atualizada" NÃO fecha com vacina vencida ou vermífugo nunca registrado', () => {
  ctx.__o = { chave: 'simba__ana', nome: 'Simba', itens: [
    { k: 'vac_mult_p', atrasado: true, vence: '2026-09-10' },
    { k: 'verm_p', sem_registro: true, vence: '' },
    { k: 'col_p', atrasado: true, vence: '2026-09-01' },        // coleira: opcional
    { k: 'escova_p', atrasado: true, vence: '2026-09-01' },     // escova: opcional
    { k: 'ecto_p', atrasado: false, vence: '2026-09-30' },      // vencendo, ainda não venceu
  ] };
  ctx.__r = { respostas: { vacina: { v: 'vet_tutor' }, aberto: { v: 'ab_data' } } };
  const deve = run('vencFichaAindaDeve(__o, __r)').map((x) => x.k).sort();
  igual(deve, ['vac_mult_p', 'verm_p']);
});
prova('com a ficha em dia (sem vencido, sem em aberto), o "Sim" fecha', () => {
  ctx.__o = { chave: 'simba__ana', nome: 'Simba', itens: [{ k: 'ecto_p', atrasado: false, vence: '2026-09-30' }] };
  assert.strictEqual(run('vencFichaAindaDeve(__o, {})').length, 0);
});
prova('"Não quer agora" deixa a ficha como está — aquele assunto não trava o "Sim"', () => {
  ctx.__o = { chave: 'simba__ana', nome: 'Simba', itens: [
    { k: 'vac_mult_p', atrasado: true, vence: '2026-09-10' },
    { k: 'verm_p', atrasado: true, vence: '2026-09-10' },
  ] };
  ctx.__r = { respostas: { vacina: { v: 'vet_tutor' }, antip: { v: 'nao' } } };
  igual(run('vencFichaAindaDeve(__o, __r)').map((x) => x.k), ['vac_mult_p']);
  // "Vai mandar na bolsa" lança — mas a ficha só fica em dia depois da dose: trava.
  ctx.__r = { respostas: { vacina: { v: 'vet_tutor' }, antip: { v: 'bolsa' } } };
  assert.strictEqual(run('vencFichaAindaDeve(__o, __r)').length, 2);
});

prova('QA M1 — "Sim" antigo com a ficha devendo: o assunto NÃO conta como respondido', () => {
  ctx.__o = { chave: 'simba__ana', nome: 'Simba', itens: [{ k: 'vac_mult_p', atrasado: true, vence: '2026-09-10' }] };
  const DEPOIS = Date.UTC(2026, 8, 25, 12, 0, 0);
  ctx.__r = { ficha_atualizada: { quem: 'X', ts: DEPOIS }, enviadas: { vacina: { ts: DEPOIS, quem: 'X' } } };
  assert.strictEqual(run("vencEstadoTipo(__r, 'vacina', " + (DEPOIS + 1) + ")"), 'fechado', 'sem saber da ficha, vale como sempre');
  assert.notStrictEqual(run("vencEstadoTipo(__r, 'vacina', " + (DEPOIS + 1) + ", vencFichaAindaDeve(__o, __r))"), 'fechado');
  assert.strictEqual(run('vencAbertosDe(__o, __r, ' + (DEPOIS + 1) + ').length'), 1, 'o cartão, o selo e o quadro contam o assunto aberto');
});
prova('QA C3 — "Sim" gravado ANTES de 25/set continua fechando em todas as telas (sem leva de COBRAR antigo)', () => {
  ctx.__o = { chave: 'simba__ana', nome: 'Simba', itens: [{ k: 'vac_mult_p', atrasado: true, vence: '2026-09-10' }] };
  ctx.__r = { ficha_atualizada: { quem: 'X', ts: Date.UTC(2026, 8, 20) }, enviadas: { vacina: { ts: 1, quem: 'X' } } };
  assert.strictEqual(run('vencAbertosDe(__o, __r, Date.now()).length'), 0);
  assert.strictEqual(run('vencDeveDe(__o, __r)'), null);
});
prova('QA B3 — a resposta antiga "Nunca fez — quer fazer aqui" não passa como "Não quer agora"', () => {
  ctx.__o = { chave: 'simba__ana', nome: 'Simba', itens: [{ k: 'verm_p', sem_registro: true }] };
  ctx.__r = { respostas: { aberto: { v: 'ab_fazer' } } };
  assert.strictEqual(run('vencFichaAindaDeve(__o, __r).length'), 1);
});
prova('QA M2 — campo vazio (undefined) no rastro não apaga quem fez', () => {
  run(`__bkpSes=_sessao; __bkpDB=DB; __audGrav=[];
       _sessao=function(){ return {nome:'Amanda', role:'consultora'}; };
       DB={ ref:function(){ return { push:function(rec){ __audGrav.push(rec); return Promise.resolve(); } }; } };`);
  try {
    run("audit('checkin', 'fez o check-in', {quem: undefined, pet: undefined, alvo: 'thor__bia'})");
    const rec = run('__audGrav[0]');
    assert.strictEqual(rec.quem, 'Amanda');
    assert.ok(!('pet' in rec), 'o campo vazio não vai ao banco');
    assert.strictEqual(rec.alvo, 'thor__bia');
  } finally { run('_sessao=__bkpSes; DB=__bkpDB;'); }
});

// ================================================================== F0.4 — vermífugo e exame
console.log('\nF0.4 — vermífugo: dose única × 2 doses, 2ª dose e exame de fezes');
prova('"vermífugo OU exame": vale o MAIS RECENTE dos dois', () => {
  assert.strictEqual(run("vermOuFezes({})"), '');
  assert.strictEqual(run("vermOuFezes({verm_t:'2026-08-01'})"), 'verm');
  assert.strictEqual(run("vermOuFezes({fezes_t:'2026-08-01'})"), 'fezes');
  assert.strictEqual(run("vermOuFezes({verm_t:'2026-08-01', fezes_t:'2025-02-01'})"), 'verm', 'exame antigo não dispensa vermífugo novo');
  assert.strictEqual(run("vermOuFezes({verm_t:'2025-02-01', fezes_t:'2026-08-01'})"), 'fezes');
  assert.strictEqual(run("vermOuFezes({verm_t:'2026-07-01', verm_dose2_t:'2026-07-22', fezes_t:'2026-07-10'})"), 'verm', 'a 2ª dose conta como a última');
});
prova('o FURO antigo está fechado: exame velho + vermífugo novo vencido → o vermífugo aparece', () => {
  ctx.__ex = { verm_t: '2025-12-01', verm_p: '2026-04-01', fezes_t: '2025-03-01', fezes_p: '2025-07-01' };
  const itens = run("vencItensDe(__ex, '2026-09-28', 3, '2026-09-25', {})").map((x) => x.k);
  assert.ok(itens.indexOf('verm_p') >= 0, 'vermífugo vencido aparece');
  assert.ok(itens.indexOf('fezes_p') < 0, 'o exame antigo não é cobrado');
});
prova('exame de fezes em dia dispensa o vermífugo; exame vencido é cobrado', () => {
  ctx.__ex = { verm_t: '2025-01-01', verm_p: '2025-05-01', fezes_t: '2026-08-01', fezes_p: '2026-11-29' };
  let itens = run("vencItensDe(__ex, '2026-09-28', 3, '2026-09-25', {})").map((x) => x.k);
  assert.strictEqual(itens.length, 0, 'nada antiparasitário a cobrar');
  ctx.__ex = { fezes_t: '2026-01-01', fezes_p: '2026-05-01' };
  itens = run("vencItensDe(__ex, '2026-09-28', 3, '2026-09-25', {})").map((x) => x.k);
  igual(itens, ['fezes_p']);
});

// O painel rápido grava na ficha por setPelExtra: aqui ele é trocado por um gravador de
// mentira, e a tela, por um document que devolve os campos que o teste preencheu.
function comFicha(ex, campos, fn) {
  ctx.__ex = ex; ctx.__patch = null; ctx.__campos = campos || {};
  run(`
    __bkp = {pd: prevCorrigePetDe, pe: pelExtra, sp: setPelExtra, pp: prevCorrigePode, rg: prevCorrigeRegistrar,
             ge: document.getElementById, hj: hojeISO, za: (typeof zAlertao==='function'?zAlertao:null)};
    __alertas = [];
    prevCorrigePetDe = function(){ return {n:'Simba', tutor:'Ana'}; };
    pelExtra = function(){ return __ex; };
    setPelExtra = function(p, patch){ __patch = patch; };
    prevCorrigePode = function(){ return true; };
    prevCorrigeRegistrar = function(){ __reg = Array.prototype.slice.call(arguments, 4); };
    hojeISO = function(){ return '2026-09-25'; };
    zAlertao = function(t){ __alertas.push(t); };
    document.getElementById = function(id){ return Object.prototype.hasOwnProperty.call(__campos, id) ? __campos[id] : null; };
  `);
  try { fn(); } finally {
    run(`prevCorrigePetDe=__bkp.pd; pelExtra=__bkp.pe; setPelExtra=__bkp.sp; prevCorrigePode=__bkp.pp;
         prevCorrigeRegistrar=__bkp.rg; document.getElementById=__bkp.ge; hojeISO=__bkp.hj; if(__bkp.za) zAlertao=__bkp.za;`);
  }
}
prova('vermífugo em 2 doses pelo painel: 2ª prevista em 21 dias e próximo 4 meses depois dela', () => {
  comFicha({}, { 'prevCorrE2_simba__ana_verm_p': { checked: true } }, () => {
    run("prevCorrigeGravarFeito('simba__ana','verm_p','2026-09-01','venc')");
    const pt = ctx.__patch;
    assert.strictEqual(pt.verm_doses, '2 doses');
    assert.strictEqual(pt.verm_t, '2026-09-01');
    assert.strictEqual(pt.verm_2a, '2026-09-22');
    assert.strictEqual(pt.verm_p, '2027-01-20');   // 22/09 + 120 dias
  });
});
prova('dose única pelo painel: próximo em 4 meses e a 2ª dose de antes sai', () => {
  comFicha({ verm_doses: '2 doses', verm_dose2_t: '2026-05-22' }, { 'prevCorrE1_simba__ana_verm_p': { checked: true } }, () => {
    run("prevCorrigeGravarFeito('simba__ana','verm_p','2026-09-01','venc')");
    const pt = ctx.__patch;
    assert.strictEqual(pt.verm_doses, 'Dose única');
    assert.strictEqual(pt.verm_dose2_t, '');
    assert.strictEqual(pt.verm_p, '2026-12-30');   // 01/09 + 120 dias
  });
});
prova('a 2ª dose gravada no painel RECALCULA o próximo vermífugo a partir dela', () => {
  comFicha({ verm_doses: '2 doses', verm_t: '2026-09-01', verm_2a: '2026-09-22', verm_p: '2027-01-20' }, {}, () => {
    run("prevCorrigeGravarFeito('simba__ana','verm_dose2_p','2026-09-25','venc')");
    const pt = ctx.__patch;
    assert.strictEqual(pt.verm_dose2_t, '2026-09-25');
    assert.strictEqual(pt.verm_p, '2027-01-23');   // 25/09 + 120 dias (3 dias depois do previsto)
    assert.ok(!('verm_dose2_p' in pt), 'não cria campo que a conta não lê');
  });
});
prova('2ª dose antes da 1ª é recusada (nada é gravado)', () => {
  comFicha({ verm_doses: '2 doses', verm_t: '2026-09-10' }, {}, () => {
    run("prevCorrigeGravarFeito('simba__ana','verm_dose2_p','2026-09-05','venc')");
    assert.strictEqual(ctx.__patch, null);
    assert.strictEqual(run('__alertas.length'), 1);
  });
});
prova('"Não vai ter 2ª dose": vira dose única e o próximo conta da 1ª dose', () => {
  comFicha({ verm_doses: '2 doses', verm_t: '2026-09-01', verm_2a: '2026-09-22', verm_p: '2027-01-20' }, {}, () => {
    run("prevCorrigeDoseUnica('simba__ana','venc')");
    const pt = ctx.__patch;
    assert.strictEqual(pt.verm_doses, 'Dose única');
    assert.strictEqual(pt.verm_p, '2026-12-30');
  });
});
prova('exame de fezes pelo painel do vermífugo: data, próxima em 4 meses e resultado', () => {
  comFicha({}, { 'prevCorrF_simba__ana_verm_p': { value: '2026-09-20' },
                 'prevCorrR_simba__ana_verm_p': { value: 'negativo para giárdia' } }, () => {
    run("prevCorrigeExameFezes('simba__ana','venc')");
    const pt = ctx.__patch;
    assert.strictEqual(pt.fezes_t, '2026-09-20');
    assert.strictEqual(pt.fezes_p, '2027-01-18');
    assert.strictEqual(pt.fezes_res, 'negativo para giárdia');
  });
});
prova('o resultado do exame vai junto quando a data é gravada no próprio item do exame', () => {
  comFicha({}, { 'prevCorrR_simba__ana_fezes_p': { value: 'positivo para giárdia' } }, () => {
    run("prevCorrigeGravarFeito('simba__ana','fezes_p','2026-09-20','venc')");
    assert.strictEqual(ctx.__patch.fezes_res, 'positivo para giárdia');
    assert.strictEqual(ctx.__patch.fezes_p, '2027-01-18');
  });
});

// ================================================================== F0.5 — pernoite e check-in
console.log('\nF0.5 — pernoite de ontem e hóspede recorrente sem check-in');
prova('pernoite de ontem ainda "aguardando" continua na lista; feita e cancelada, não', () => {
  ctx.__R = {
    '2026-09-24': { thor__bia: { nome: 'Thor', status: 'aguardando', ts: 2 },
                    lua__caio: { nome: 'Lua', status: 'checkin_feito', ts: 1 } },
    '2026-09-23': { nina__ana: { nome: 'Nina', ts: 5 },                      // sem status = aguardando
                    bob__rui: { nome: 'Bob', status: 'cancelado', ts: 3 } },
    '2026-09-25': { hoje__x: { nome: 'Hoje', status: 'aguardando' } },       // hoje não entra aqui
  };
  const L = run("pernAtrasadasDeDias(__R, '2026-09-25')").map((r) => r._dia + ' ' + r.nome);
  igual(L, ['2026-09-23 Nina', '2026-09-24 Thor']);
});
prova('a noite de ontem é dita em português ("ontem (24/09)")', () => {
  run("__bkpHoje=pernHoje; pernHoje=function(){ return '2026-09-25'; };");
  try {
    assert.strictEqual(run("pernNoiteTexto('2026-09-24')"), 'ontem (24/09)');
    assert.strictEqual(run("pernNoiteTexto('2026-09-22')"), 'terça (22/09)');
  } finally { run('pernHoje=__bkpHoje;'); }
});
prova('estadia de AGOSTO não conta como check-in de setembro (o furo do recorrente)', () => {
  assert.strictEqual(run("estadiaCobreDia({entrada:'2026-08-10', saida:'2026-08-15'}, '2026-09-25')"), false);
  assert.strictEqual(run("estadiaCobreDia({entrada:'2026-09-24', saida:'2026-09-27'}, '2026-09-25')"), true);
  assert.strictEqual(run("estadiaCobreDia({entrada:'2026-09-23', saida:'2026-09-25'}, '2026-09-25')"), true, 'sai hoje: dormiu com ficha');
  assert.strictEqual(run("estadiaCobreDia({entrada:'2026-09-24', saida:'2026-09-27', status:'cancelada'}, '2026-09-25')"), false);
  assert.strictEqual(run("estadiaCobreDia({}, '2026-09-25')"), true, 'estadia antiga sem data: vale como antes');
});
prova('a mais recente é de outra vinda, mas existe a desta noite: não acusa falta', () => {
  run(`__bkpCF=CF_ESTADIAS; __bkpET=EST_TODAS;
       CF_ESTADIAS={thor__bia:{id:'e2', e:{refKey:'thor__bia', entrada:'2026-10-10', saida:'2026-10-12'}}};
       EST_TODAS={e1:{refKey:'thor__bia', entrada:'2026-09-24', saida:'2026-09-26'},
                  e2:{refKey:'thor__bia', entrada:'2026-10-10', saida:'2026-10-12'}};`);
  try {
    assert.strictEqual(run("hospTemEstadiaNoDia('thor__bia','2026-09-25')"), true);
    assert.strictEqual(run("hospTemEstadiaNoDia('thor__bia','2026-09-30')"), false);
  } finally { run('CF_ESTADIAS=__bkpCF; EST_TODAS=__bkpET;'); }
});

prova('QA A3 — "cobrir a noite" é entrar até ela e sair DEPOIS dela', () => {
  assert.strictEqual(run("estadiaCobreNoite({entrada:'2026-09-24', saida:'2026-09-25'}, '2026-09-24')"), true, 'a pernoite daquela noite');
  assert.strictEqual(run("estadiaCobreNoite({entrada:'2026-09-20', saida:'2026-09-24'}, '2026-09-24')"), false, 'saiu naquela manhã: não dormiu lá');
  assert.strictEqual(run("estadiaCobreNoite({entrada:'2026-09-24', saida:'2026-09-25', status:'cancelada'}, '2026-09-24')"), false);
});
prova('QA A3 — a noite que já tem estadia (check-in feito pela busca) sai da lista: não convida a um 2º check-in', () => {
  run(`__bkpP=PELUDINHOS; __bkpET=EST_TODAS; __bkpPA=PERN_ATRAS;
       PELUDINHOS=[{n:'Thor', tutor:'Bia'}, {n:'Lua', tutor:'Caio'}];
       EST_TODAS={e9:{refKey:pelKey(PELUDINHOS[0]), entrada:'2026-09-24', saida:'2026-09-25'}};
       PERN_ATRAS=[{_dia:'2026-09-24', _chave:dcKey('Thor','Bia'), chave:dcKey('Thor','Bia'), nome:'Thor'},
                   {_dia:'2026-09-24', _chave:dcKey('Lua','Caio'), chave:dcKey('Lua','Caio'), nome:'Lua'}];`);
  try {
    igual(JSON.parse(run('JSON.stringify(pernAnterioresVisiveis().map(function(r){ return r.nome; }))')), ['Lua']);
  } finally { run('PELUDINHOS=__bkpP; EST_TODAS=__bkpET; PERN_ATRAS=__bkpPA;'); }
});

// ================================================================== F0.6 — banhos recorrentes
console.log('\nF0.6 — Banhos recorrentes: só quem tem banho fixo');
prova('sem busca: só quem tem banho fixo (gravado ou ligado no rascunho); a busca procura em todos', () => {
  run(`__bkpP=PELUDINHOS; __bkpB=banhoRecDe; __bkpI=pelInativo; __bkpR=BANHO_RASC; __bkpRL=BANHO_RASC_LIDO; __bkpQ=BANHO_BUSCA;
       PELUDINHOS=[{n:'Amora',tutor:'Ana'},{n:'Bento',tutor:'Rui'},{n:'Caju',tutor:'Bia'},{n:'Dora',tutor:'Lia',inativo:true}];
       banhoRecDe=function(p){ return p.n==='Amora'?{ativo:true}:null; };
       pelInativo=function(p){ return !!p.inativo; };
       BANHO_RASC={}; BANHO_RASC[dcKey('Caju','Bia')]={ativo:true}; BANHO_RASC_LIDO=true;
       BANHO_BUSCA=''; BANHO_MOSTRAR_TODOS=false;`);
  try {
    const nomes = () => JSON.parse(run('JSON.stringify(banhosLista().map(function(p){ return p.n; }))'));
    igual(nomes(), ['Amora', 'Caju'], 'Bento não tem banho fixo; Dora está inativa');
    run("BANHO_BUSCA='bent'");
    igual(nomes(), ['Bento'], 'a busca encontra quem ainda não tem');
    run("BANHO_BUSCA=''; BANHO_MOSTRAR_TODOS=true");
    igual(nomes(), ['Amora', 'Bento', 'Caju'], 'o botão mostra a casa inteira (sem os inativos)');
  } finally {
    run(`PELUDINHOS=__bkpP; banhoRecDe=__bkpB; pelInativo=__bkpI; BANHO_RASC=__bkpR; BANHO_RASC_LIDO=__bkpRL;
         BANHO_BUSCA=__bkpQ; BANHO_MOSTRAR_TODOS=false;`);
  }
});

// ================================================================== Foto do Thor (25/set)
console.log('\nRelatórios — a foto do xará não é oferecida ao FILHOt novo');
prova('Thor novo (Juliana) sem foto + Thor antigo (Andrea) com foto: NÃO pergunta; foto órfã, sim', () => {
  run(`__bkpP=PELUDINHOS; __bkpF=FOTOS; __bkpI=pelInativo;
       pelInativo=function(){ return false; };
       PELUDINHOS=[{n:'Thor', tutor:'Andrea'}, {n:'Thor', tutor:'Juliana'}, {n:'Lua', tutor:'Rui'}];
       FOTOS={}; FOTOS[pelKey(PELUDINHOS[0])]='data:foto-thor-andrea';
       FOTOS['lua__rui antigo']='data:foto-orfa-da-lua';`);
  try {
    const d = run('semFotoDados()');
    const soltas = JSON.parse(JSON.stringify(d.soltas)).map((o) => o.nome);
    const sem = JSON.parse(JSON.stringify(d.sem)).map((o) => o.nome);
    assert.ok(sem.indexOf('Thor') >= 0, 'o Thor da Juliana vai para "precisa fotografar"');
    assert.ok(soltas.indexOf('Thor') < 0, 'a foto do Thor da Andrea não é oferecida');
    assert.ok(soltas.indexOf('Lua') >= 0, 'a foto órfã (chave sem ficha) continua sendo perguntada');
  } finally { run('PELUDINHOS=__bkpP; FOTOS=__bkpF; pelInativo=__bkpI;'); }
});

prova('a foto copiada por engano aparece: duas fichas com a MESMA foto', () => {
  run(`__bkpP=PELUDINHOS; __bkpF=FOTOS; __bkpI=pelInativo;
       pelInativo=function(){ return false; };
       PELUDINHOS=[{n:'Thor', tutor:'Andrea'}, {n:'Thor', tutor:'Juliana'}, {n:'Lua', tutor:'Rui'}];
       FOTOS={}; FOTOS[pelKey(PELUDINHOS[0])]='data:x'; FOTOS[pelKey(PELUDINHOS[1])]='data:x'; FOTOS[pelKey(PELUDINHOS[2])]='data:y';`);
  try {
    const G = JSON.parse(run('JSON.stringify(fotosRepetidasDados())'));
    assert.strictEqual(G.length, 1);
    igual(G[0].fichas.map((f) => f.tutor).sort(), ['Andrea', 'Juliana']);
    assert.ok(/MESMA foto/.test(run('fotosRepetidasHTML()')));
  } finally { run('PELUDINHOS=__bkpP; FOTOS=__bkpF; pelInativo=__bkpI;'); }
});

// ================================================================== re-QA de 25/set
console.log('\nRe-QA — a junção é pelo NOME do remédio; o cancelar confere o banco');
const DC2 = { tico__joana: { nome: 'Tico', itens: {
  m0: { nome: 'Apoquel', dose: '1 comp', horarios: ['08:00'] },
  m1: { nome: 'Colírio Maxitrol', dose: '1 gota', horarios: ['08:00'] } } } };
prova('R1 — Colírio da recepção já dado + pertences com Apoquel e Colírio às 8h: o Apoquel NÃO some e o colírio não toca de novo', () => {
  const log = { dc__tico__joana: { 'lanc_a1_08-00': { quem: 'Zelosa' } } };
  const r = juntar(DC2, LANC('08:00', 'Colírio Maxitrol, 1 gota em cada olho'), log).sort();
  igual(r, ['lanc_a1@08:00', 'm0@08:00']);
});
prova('R2 — Apoquel dos pertences + Colírio lançado na recepção no mesmo horário: DUAS doses', () => {
  igual(juntar(DC('08:00', 'Apoquel'), LANC('08:00', 'Colírio')).sort(), ['lanc_a1@08:00', 'medicacao_0@08:00']);
});
prova('QA C2 — nome genérico não serve de começo ("Comprimido", "Remédio", "1", "Probiótico…")', () => {
  assert.ok(!run("medMesmoRemedio('Comprimido', 'Comprimido de Apoquel')"));
  assert.ok(!run("medMesmoRemedio('Remédio', 'Remédio do fígado')"));
  assert.ok(!run("medMesmoRemedio('1', '1 comprimido de Apoquel')"));
  assert.ok(!run("medMesmoRemedio('Probiótico Vetnil', 'Probiótico Organnact')"));
  assert.ok(run("medMesmoRemedio('Otomax', 'Otomax — gotas no ouvido, 2x ao dia')"), 'o exemplo novo do campo junta');
});
prova('R3 — palavra de forma não junta remédios diferentes ("Pomada…", "Gotas…")', () => {
  assert.ok(!run("medMesmoRemedio('Pomada Nebacetin', 'Pomada oftálmica Epitezan')"));
  assert.ok(!run("medMesmoRemedio('Gotas Otomax no ouvido', 'Gotas de colírio')"));
  assert.ok(run("medMesmoRemedio('Apoquel 5,4 mg meio comprimido', 'Apoquel 5,4mg')"), 'mesmo remédio escrito diferente');
});

// O banco de mentira da transação: a 1ª volta vem com `null` (o nó não está em memória),
// como no SDK de verdade; devolver algo que não seja `undefined` faz o "servidor" responder.
function bancoFalso(servidor) {
  const gravado = { v: servidor, tx: 0 };
  return {
    gravado,
    ref() {
      return {
        once() { return Promise.resolve({ val: () => gravado.v }); },
        update(x) { gravado.v = Object.assign({}, gravado.v || {}, x); return Promise.resolve(); },
        transaction(fn) {
          gravado.tx++;
          const local = fn(null);
          if (local === undefined) return Promise.resolve({ committed: false, snapshot: { val: () => null } });
          const r = fn(gravado.v == null ? null : JSON.parse(JSON.stringify(gravado.v)));
          if (r === undefined) return Promise.resolve({ committed: false, snapshot: { val: () => gravado.v } });
          gravado.v = r;
          return Promise.resolve({ committed: true, snapshot: { val: () => r } });
        },
      };
    },
  };
}
// Uma de cada vez: as provas trocam o banco e as janelas do app, e duas ao mesmo tempo
// pisariam uma na outra.
let fila = Promise.resolve();
function provaAsync(nome, fn) {
  fila = fila.then(() => fn().then(() => { ok++; console.log('  ✓ ' + nome); },
    (e) => { falhas.push(nome + ' — ' + e.message); console.log('  ✗ ' + nome + '\n      ' + e.message); }));
}
provaAsync('R-CANCEL — "Tutor buscou, cancelar" de noite anterior GRAVA (a transação pergunta ao banco)', async () => {
  const B = bancoFalso({ nome: 'Thor', status: 'aguardando', chave: 'thor__bia' });
  ctx.__B = B;
  run(`__bkpDB=DB; __bkpZT=zTexto; __bkpZA=zAlertao; __bkpPH=pernHoje; __bkpPA=PERN_ATRAS; __alertas=[];
       DB=__B; zTexto=function(){ return Promise.resolve('a tutora buscou às 18h40'); };
       zAlertao=function(t){ __alertas.push(t); }; pernHoje=function(){ return '2026-09-25'; };
       PERN_ATRAS=[{_dia:'2026-09-24', _chave:'thor__bia', chave:'thor__bia', nome:'Thor'}];`);
  try {
    run("pernCancelar('thor__bia','2026-09-24')");
    await new Promise((r) => setImmediate(r)); await new Promise((r) => setTimeout(r, 20));
    assert.strictEqual(B.gravado.v.status, 'cancelado', 'a noite ficou cancelada no banco');
    assert.strictEqual(B.gravado.v.cancel_motivo, 'a tutora buscou às 18h40');
    assert.strictEqual(run('__alertas.length'), 0, 'nenhum aviso falso de "já foi resolvida"');
  } finally { run('DB=__bkpDB; zTexto=__bkpZT; zAlertao=__bkpZA; pernHoje=__bkpPH; PERN_ATRAS=__bkpPA;'); }
});
provaAsync('R-CANCEL — se outro aparelho já fez o check-in, o cancelar desiste e diz a verdade', async () => {
  const B = bancoFalso({ nome: 'Thor', status: 'aguardando', chave: 'thor__bia' });
  ctx.__B = B;
  run(`__bkpDB=DB; __bkpZT=zTexto; __bkpZA=zAlertao; __bkpPH=pernHoje; __bkpPA=PERN_ATRAS; __alertas=[];
       DB=__B; zAlertao=function(t){ __alertas.push(t); }; pernHoje=function(){ return '2026-09-25'; };
       // enquanto a Zelosa escreve o motivo, outro aparelho faz o check-in
       zTexto=function(){ __B.gravado.v.status='checkin_feito'; return Promise.resolve('a tutora buscou'); };
       PERN_ATRAS=[{_dia:'2026-09-24', _chave:'thor__bia', chave:'thor__bia', nome:'Thor'}];`);
  try {
    run("pernCancelar('thor__bia','2026-09-24')");
    await new Promise((r) => setTimeout(r, 20));
    assert.strictEqual(B.gravado.v.status, 'checkin_feito', 'o check-in não foi apagado');
    assert.ok(run('__alertas.join(" ")').indexOf('JÁ FOI RESOLVIDA') >= 0);
  } finally { run('DB=__bkpDB; zTexto=__bkpZT; zAlertao=__bkpZA; pernHoje=__bkpPH; PERN_ATRAS=__bkpPA;'); }
});

// ================================================================== Reposição (25/set)
console.log('\nReposição — marcar e desmarcar já saem com a mensagem para o tutor');
prova('"segunda-feira, 28/09": o dia como a consultora fala', () => {
  assert.strictEqual(run("repDiaSemanaComData('2026-09-28')"), 'segunda-feira, 28/09');
});
prova('marcar: a mensagem diz o dia e quantas ficam sem dia (1, várias, nenhuma)', () => {
  ctx.__p = { n: 'Luna', tutor: 'Ana Souza' };
  run(`__bkpPE=pelExtra; pelExtra=function(){ return {sexo:'Fêmea'}; };`);
  try {
    const m1 = run("repMensagem(__p, 'agendada', {volta:'2026-09-28', livres:1})");
    assert.ok(/Oi, Ana, como está\?/.test(m1));
    assert.ok(/a reposição da Luna ficou marcada para segunda-feira, 28\/09/.test(m1), m1);
    assert.ok(/fica 1 reposição ainda sem dia/.test(m1));
    assert.ok(/ficam 2 reposições ainda sem dia/.test(run("repMensagem(__p, 'agendada', {volta:'2026-09-28', livres:2})")));
    assert.ok(/não fica nenhuma reposição sem dia/.test(run("repMensagem(__p, 'agendada', {volta:'2026-09-28', livres:0})")));
    const d = run("repMensagem(__p, 'desmarcada', {volta:'2026-09-28', livres:2})");
    assert.ok(/estava marcada para segunda-feira, 28\/09, foi desmarcada/.test(d), d);
    assert.ok(!/ficam 0/.test(run("repMensagem(__p, 'desmarcada', {volta:'2026-09-28', livres:0})")), 'nunca "ficam 0 reposições"');
    assert.ok(/ficam 2 reposições para marcar/.test(d));
  } finally { run('pelExtra=__bkpPE;'); }
});
prova('a conta das que ficam sem dia desconta a marcação que acabou de ser gravada', () => {
  run(`__bkpS=repSaldo; __bkpA=repAgendaDe; __bkpD=repDisponivel; repDisponivel=function(){ return 2; }; repSaldo=function(){ return 2; }; repAgendaDe=function(){ return []; };`);
  try {
    assert.strictEqual(run('repLivresSemDia({}, +1)'), 1, '2 reposições, 1 marcada agora → fica 1');
    run("repAgendaDe=function(){ return ['2026-09-28']; };");
    assert.strictEqual(run('repLivresSemDia({}, -1)'), 2, 'desmarcou a única → voltam as 2');
    run("repAgendaDe=function(){ return ['2026-09-28','2026-10-02','2026-10-05']; };");
    assert.strictEqual(run('repLivresSemDia({}, 0)'), 0, 'nunca negativo');
    run("repAgendaDe=function(){ return []; }; repDisponivel=function(){ return 1; };");
    assert.strictEqual(run('repLivresSemDia({}, +1)'), 0, 'dia reservado em hospedagem não é oferecido de novo (QA)');
  } finally { run('repSaldo=__bkpS; repAgendaDe=__bkpA; repDisponivel=__bkpD;'); }
});
prova('"na segunda-feira, 28/09" e "no sábado, 03/10"', () => {
  assert.strictEqual(run("repNoDia('2026-09-28')"), 'na segunda-feira, 28/09');
  assert.strictEqual(run("repNoDia('2026-10-03')"), 'no sábado, 03/10');
});
provaAsync('desmarcar: a data sai do crédito (fica guardada), e a mensagem sai pronta', async () => {
  const B = bancoFalso({});
  ctx.__B = B;
  run(`__bkpDB=DB; __bkpP=PELUDINHOS; __bkpL=repLancamentos; __bkpPL=repPodeLancar; __bkpZP=zPergunta; __bkpMM=repMsgModal; __bkpRR=renderReposicao; __bkpS=repSaldo;
       __msg=null; DB=__B; PELUDINHOS=[{n:'Luna', tutor:'Ana'}];
       repLancamentos=function(){ return [{_id:'c1', tipo:'credito', data:'2026-09-22', volta:'2026-09-28'}]; };
       repSaldo=function(){ return 1; }; __bkpD2=repDisponivel; repDisponivel=function(){ return 1; };
       repPodeLancar=function(){ return true; }; zPergunta=function(){ return Promise.resolve(true); };
       repMsgModal=function(t, l, texto){ __msg={t:t, texto:texto}; }; renderReposicao=function(){};`);
  try {
    await run("repDesmarcar(0, '2026-09-28')");
    await new Promise((r) => setTimeout(r, 20));
    assert.strictEqual(B.gravado.v.volta, '', 'a data saiu');
    assert.strictEqual(B.gravado.v.volta_desmarcada.dia, '2026-09-28', 'o dia desmarcado fica guardado');
    const msg = run('__msg');
    assert.ok(msg && /desmarcada/.test(msg.t));
    assert.ok(/fica 1 reposição para marcar/.test(msg.texto), msg && msg.texto);
  } finally {
    run('DB=__bkpDB; PELUDINHOS=__bkpP; repLancamentos=__bkpL; repPodeLancar=__bkpPL; zPergunta=__bkpZP; repMsgModal=__bkpMM; renderReposicao=__bkpRR; repSaldo=__bkpS; repDisponivel=__bkpD2;');
  }
});

// ================================================================== Reposição — tirar, devolver e remarcar (Safira, 25/set)
console.log('\nReposição — a tutora cancelou: tirar, devolver ao saldo e remarcar, com o dia guardado');
prova('pura: o uso que o lançamento abateu — pela ligação; nos antigos, pelo dia e pelo texto', () => {
  const L = [
    { _id: 'u1', tipo: 'uso', data: '2026-09-23', obs: 'Reposição lançada nos Lançamentos do dia', lanc: { dia: '2026-09-23', id: 'L1' } },
    { _id: 'u2', tipo: 'uso', data: '2026-09-23', obs: 'Reposição lançada nos Lançamentos do dia' },
    { _id: 'u3', tipo: 'uso', data: '2026-09-23', obs: '' },
  ];
  assert.strictEqual(run('repUsoDoLancamento(' + JSON.stringify(L) + ",'2026-09-23','L1')._id"), 'u1', 'pela ligação');
  assert.strictEqual(run('repUsoDoLancamento(' + JSON.stringify(L) + ",'2026-09-23','L9')._id"), 'u2', 'antigo: pelo dia e pelo texto do abatimento');
  assert.strictEqual(run('repUsoDoLancamento(' + JSON.stringify(L.concat([{ _id: 'e1', tipo: 'estorno', estornaId: 'u2' }])) + ",'2026-09-23','L9')"), null, 'já devolvido não volta duas vezes');
  assert.strictEqual(run('repUsoDoLancamento(' + JSON.stringify(L) + ",'2026-09-24','L9')"), null, 'outro dia: não é dele');
});
prova('pura: o uso da hospedagem (orc-…) não se devolve por fora; o devolvido também não', () => {
  assert.strictEqual(run("repUsoDevolvivel({_id:'u1', tipo:'uso'}, {})"), true);
  assert.strictEqual(run("repUsoDevolvivel({_id:'orc-abc-1', tipo:'uso'}, {})"), false, 'quem desfaz é o orçamento');
  assert.strictEqual(run("repUsoDevolvivel({_id:'u1', tipo:'uso'}, {u1:true})"), false);
  assert.strictEqual(run("repUsoDevolvivel({_id:'c1', tipo:'credito'}, {})"), false);
});
prova('pura: a reposição marcada para um dia que JÁ PASSOU, sem uso naquele dia, aparece (a da Safira)', () => {
  const V = (L) => JSON.parse(JSON.stringify(run('repVoltasVencidas(' + JSON.stringify(L) + ",'2026-09-25')"))).map((l) => l._id);
  assert.deepStrictEqual(V([{ _id: 'c1', tipo: 'credito', data: '2026-09-10', volta: '2026-09-23' }]), ['c1'], 'marcada para quarta, não veio');
  assert.deepStrictEqual(V([{ _id: 'c1', tipo: 'credito', volta: '2026-09-23' }, { _id: 'u1', tipo: 'uso', data: '2026-09-23' }]), [], 'repôs naquele dia');
  assert.deepStrictEqual(V([{ _id: 'c1', tipo: 'credito', data: '2026-09-01', volta: '2026-09-23' }, { _id: 'c2', tipo: 'credito', data: '2026-09-02', volta: '2026-09-23' }, { _id: 'u1', tipo: 'uso', data: '2026-09-23' }]), ['c2'], 'duas marcadas, um uso: uma pendurada');
  assert.deepStrictEqual(V([{ _id: 'c1', tipo: 'credito', volta: '2026-09-23' }, { _id: 'u1', tipo: 'uso', data: '2026-09-23' }, { _id: 'e1', tipo: 'estorno', estornaId: 'u1' }]), ['c1'], 'uso devolvido: a marcada volta a aparecer');
  assert.deepStrictEqual(V([{ _id: 'c1', tipo: 'credito', volta: '2026-09-30' }]), [], 'dia que ainda vem: é "Vem repor em"');
  assert.deepStrictEqual(V([{ _id: 'c1', tipo: 'credito', volta: '2026-09-23' }, { _id: 'e1', tipo: 'estorno', estornaId: 'c1' }]), [], 'crédito estornado não conta');
});
prova('remarcar: sem crédito livre, «Marcar reposição» usa a marcada que já passou', () => {
  run(`__bkR1={l:repLancamentos, h:repHojeISO}; repHojeISO=function(){ return '2026-09-25'; };`);
  try {
    run(`repLancamentos=function(){ return [{_id:'c1', tipo:'credito', data:'2026-09-10', volta:'2026-09-23'}]; };`);
    assert.strictEqual(run('repCreditoLivre({})._id'), 'c1', 'antes: "Não achei um crédito sem dia marcado"');
    run(`repLancamentos=function(){ return [{_id:'c1', tipo:'credito', data:'2026-09-10', volta:'2026-09-23'}, {_id:'c2', tipo:'credito', data:'2026-09-12'}]; };`);
    assert.strictEqual(run('repCreditoLivre({})._id'), 'c2', 'havendo crédito sem dia, ele vem primeiro');
    run(`repLancamentos=function(){ return [{_id:'c1', tipo:'credito', data:'2026-09-10', volta:'2026-09-30'}]; };`);
    assert.strictEqual(run('repCreditoLivre({})'), null, 'a marcada para um dia que ainda vem não é roubada');
  } finally { run('repLancamentos=__bkR1.l; repHojeISO=__bkR1.h;'); }
});
provaAsync('remarcar guarda o dia que estava marcado (com quem e para quando)', async () => {
  const B = bancoFalso({});
  ctx.__B = B;
  run(`__bkR2={db:DB, l:repLancamentos, au:audit}; DB=__B; audit=function(){};
       repLancamentos=function(){ return [{_id:'c1', tipo:'credito', data:'2026-09-10', volta:'2026-09-23'}]; };`);
  try {
    await run("repAgendarVolta({n:'Safira', tutor:'Bia'}, 'c1', '2026-09-30', null)");
    assert.strictEqual(B.gravado.v.volta, '2026-09-30');
    assert.strictEqual(B.gravado.v.volta_desmarcada.dia, '2026-09-23', 'o dia antigo fica no crédito');
    assert.ok(/remarcada para 30\/09\/2026/.test(B.gravado.v.volta_desmarcada.motivo), B.gravado.v.volta_desmarcada.motivo);
    assert.strictEqual(run("repExtratoDesmarcada({dia:'2026-09-23', motivo:'remarcada para 30/09/2026', quem:'Ana'})"),
      ' · estava marcada para 23/09/2026 e foi remarcada para 30/09/2026 (por Ana)');
    assert.strictEqual(run("repExtratoDesmarcada({dia:'2026-09-23', quem:'Ana'})"), ' · desmarcada de 23/09/2026 (por Ana)');
  } finally { run('DB=__bkR2.db; repLancamentos=__bkR2.l; audit=__bkR2.au;'); }
});
provaAsync('tirar a Reposição dos Lançamentos do dia devolve o dia ao saldo (e a mensagem sai pronta)', async () => {
  run(`__bkR3={db:DB, dd:DASH_DADOS, di:dashDia, it:dashItem, zp:zPergunta, rd:renderDash, au:audit, esp:dashEspelhar, mm:repMsgModal,
         l:repLancamentos, s:repSaldo, lsd:repLivresSemDia, pc:prevCorrigePetDe, h:repHojeISO, pe:pelExtra};
    __rm3=[]; __push3=[]; __msg3=null; __perg3=null;
    DB={ref:function(p){ return {
      remove:function(){ __rm3.push(p); return Promise.resolve(); },
      update:function(v){ __upd3.push({p:p, v:JSON.parse(JSON.stringify(v))}); return Promise.resolve(); },
      set:function(v){ __push3.push({p:p, v:JSON.parse(JSON.stringify(v))}); return Promise.resolve(); } }; }};
    __upd3=[];
    DASH_DADOS={reposicao:{L1:{valor:'Safira/Spitz', chave:'safira__bia'}}};
    dashDia=function(){ return '2026-09-30'; }; repHojeISO=function(){ return '2026-09-25'; };
    dashItem=function(){ return {t:'Reposição'}; };
    zPergunta=function(t, linhas){ __perg3=linhas; return Promise.resolve(true); };
    renderDash=function(){}; audit=function(){}; dashEspelhar=function(){};
    repMsgModal=function(t, l, texto){ __msg3={t:t, l:l, texto:texto}; };
    pelExtra=function(){ return {sexo:'Fêmea'}; };
    prevCorrigePetDe=function(ch){ return ch==='safira__bia' ? {n:'Safira', tutor:'Bia'} : null; };
    repLancamentos=function(){ return [{_id:'c1', tipo:'credito', data:'2026-09-10'},
      {_id:'u1', tipo:'uso', data:'2026-09-30', obs:'Reposição lançada nos Lançamentos do dia', lanc:{dia:'2026-09-30', id:'L1'}}]; };
    repSaldo=function(){ return 0; }; repLivresSemDia=function(){ return 0; };`);
  try {
    await run("dashRemover('reposicao','L1')");
    for (let i = 0; i < 20; i++) await Promise.resolve();
    const perg = JSON.parse(JSON.stringify(run('__perg3')));
    assert.ok(perg.some((t) => /volta para o saldo de Safira: era 0, fica 1/.test(t)), JSON.stringify(perg));
    assert.deepStrictEqual(JSON.parse(JSON.stringify(run('__rm3'))).length, 1, 'saiu dos Lançamentos do dia');
    const push = JSON.parse(JSON.stringify(run('__push3')));
    assert.strictEqual(push.length, 1, 'uma devolução');
    assert.ok(/daycare\/reposicao\/.+\/lancamentos\/dev-u1$/.test(push[0].p), 'chave fixa: dois toques gravam o mesmo nó');
    assert.strictEqual(push[0].v.tipo, 'estorno');
    assert.strictEqual(push[0].v.estornaId, 'u1', 'aponta para o uso do lançamento');
    assert.strictEqual(push[0].v.dia_devolvido, '2026-09-30', 'com o dia');
    const msg = run('__msg3');
    assert.ok(msg && /devolvida/.test(msg.t), msg && msg.t);
    assert.ok(/a reposição da Safira que estava marcada para quarta-feira, 30\/09, foi desmarcada/.test(msg.texto), msg && msg.texto);
    assert.ok(/fica 1 reposição para marcar/.test(msg.texto), msg.texto);
    // sem abatimento (lançado "sem abater"): tira da lista e NÃO mexe no saldo
    run(`__push3=[]; __rm3=[]; DASH_DADOS={reposicao:{L2:{valor:'Safira/Spitz', chave:'safira__bia'}}};
      repLancamentos=function(){ return [{_id:'c1', tipo:'credito', data:'2026-09-10'}]; };`);
    await run("dashRemover('reposicao','L2')");
    for (let i = 0; i < 20; i++) await Promise.resolve();
    assert.strictEqual(run('__rm3.length'), 1);
    assert.strictEqual(run('__push3.length'), 0, 'nada a devolver');
    assert.ok(JSON.parse(JSON.stringify(run('__perg3'))).some((t) => /Não achei o abatimento/.test(t)));
  } finally { run('DB=__bkR3.db; DASH_DADOS=__bkR3.dd; dashDia=__bkR3.di; dashItem=__bkR3.it; zPergunta=__bkR3.zp; renderDash=__bkR3.rd; audit=__bkR3.au; dashEspelhar=__bkR3.esp; repMsgModal=__bkR3.mm; repLancamentos=__bkR3.l; repSaldo=__bkR3.s; repLivresSemDia=__bkR3.lsd; prevCorrigePetDe=__bkR3.pc; repHojeISO=__bkR3.h; pelExtra=__bkR3.pe;'); }
});
prova('QA14 A1 — a marcada que já passou só "continua valendo" até o que ainda está livre no saldo', () => {
  run(`__bkQ1={l:repLancamentos, h:repHojeISO, lsd:repLivresSemDia}; repHojeISO=function(){ return '2026-09-25'; };
    repLancamentos=function(){ return [{_id:'c1', tipo:'credito', data:'2026-09-10', volta:'2026-09-23'},
      {_id:'c2', tipo:'credito', data:'2026-09-11', volta:'2026-09-30'}, {_id:'u1', tipo:'uso', data:'2026-09-24'}]; };`);
  try {
    run('repLivresSemDia=function(){ return 0; };');   // saldo 1, e ele já está na marcada de 30/09
    assert.deepStrictEqual(JSON.parse(JSON.stringify(run("repVoltasVencidasValendo({}, null, '2026-09-25')"))), [], 'nada livre: a vencida não "vale"');
    assert.strictEqual(run('repCreditoLivre({})'), null, 'e não se remarca: mais dias marcados que saldo era barrado antes');
    run('repLivresSemDia=function(){ return 1; };');   // o caso B da Safira: saldo 1, nada marcado adiante
    assert.strictEqual(run("repVoltasVencidasValendo({}, null, '2026-09-25')[0]._id"), 'c1');
    assert.strictEqual(run('repCreditoLivre({})._id'), 'c1');
  } finally { run('repLancamentos=__bkQ1.l; repHojeISO=__bkQ1.h; repLivresSemDia=__bkQ1.lsd;'); }
});
provaAsync('QA14 M1 — desmarcar um dia que já passou não inventa reposição na mensagem', async () => {
  const B = bancoFalso({});
  ctx.__B = B;
  run(`__bkQ2={db:DB, p:PELUDINHOS, l:repLancamentos, pl:repPodeLancar, zp:zPergunta, mm:repMsgModal, rr:renderReposicao, s:repSaldo, d:repDisponivel, h:repHojeISO, au:audit};
       __msgQ2=null; DB=__B; PELUDINHOS=[{n:'Safira', tutor:'Bia'}]; audit=function(){};
       repHojeISO=function(){ return '2026-09-25'; };
       repLancamentos=function(){ return [{_id:'c1', tipo:'credito', data:'2026-09-10', volta:'2026-09-23'}]; };
       repSaldo=function(){ return 1; }; repDisponivel=function(){ return 1; };
       repPodeLancar=function(){ return true; }; zPergunta=function(){ return Promise.resolve(true); };
       repMsgModal=function(t, l, texto){ __msgQ2={t:t, l:l, texto:texto}; }; renderReposicao=function(){};`);
  try {
    await run("repDesmarcar(0, '2026-09-23')");
    for (let i = 0; i < 10; i++) await Promise.resolve();
    const m = run('__msgQ2');
    assert.ok(/fica 1 reposição para marcar/.test(m.texto), m.texto);
    assert.ok(/não repôs na quarta-feira, 23\/09: a data saiu/.test(JSON.stringify(m.l)), JSON.stringify(m.l));
  } finally { run('DB=__bkQ2.db; PELUDINHOS=__bkQ2.p; repLancamentos=__bkQ2.l; repPodeLancar=__bkQ2.pl; zPergunta=__bkQ2.zp; repMsgModal=__bkQ2.mm; renderReposicao=__bkQ2.rr; repSaldo=__bkQ2.s; repDisponivel=__bkQ2.d; repHojeISO=__bkQ2.h; audit=__bkQ2.au;'); }
});
provaAsync('QA14 M2 — tirar um dia que também está marcado: a recepção escolhe tirar e desmarcar, ou só o lançamento', async () => {
  run(`__bkQ3={db:DB, dd:DASH_DADOS, di:dashDia, it:dashItem, ze:zEscolha, zp:zPergunta, rd:renderDash, au:audit, esp:dashEspelhar, mm:repMsgModal,
         l:repLancamentos, s:repSaldo, lsd:repLivresSemDia, pc:prevCorrigePetDe, h:repHojeISO, pe:pelExtra};
    __upd=[]; __set=[]; __rm=[]; __esc=null; __resp='ambos';
    DB={ref:function(p){ return {
      remove:function(){ __rm.push(p); return Promise.resolve(); },
      update:function(v){ __upd.push({p:p, v:JSON.parse(JSON.stringify(v))}); return Promise.resolve(); },
      set:function(v){ __set.push({p:p, v:JSON.parse(JSON.stringify(v))}); return Promise.resolve(); } }; }};
    dashDia=function(){ return '2026-09-30'; }; repHojeISO=function(){ return '2026-09-25'; };
    dashItem=function(){ return {t:'Reposição'}; };
    zEscolha=function(t, linhas, bts){ __esc={t:t, linhas:linhas, bts:bts.map(function(b){ return b.t; })};
      var i=(__resp==='ambos')?0:((__resp==='so')?1:2); bts[i].fn(); };
    zPergunta=function(){ throw new Error('com marcação no dia, a pergunta é a de três saídas'); };
    renderDash=function(){}; audit=function(){}; dashEspelhar=function(){}; repMsgModal=function(){};
    pelExtra=function(){ return {sexo:'Fêmea'}; };
    prevCorrigePetDe=function(){ return {n:'Safira', tutor:'Bia'}; };
    repLancamentos=function(){ return [{_id:'c1', tipo:'credito', data:'2026-09-10', volta:'2026-09-30'},
      {_id:'u1', tipo:'uso', data:'2026-09-30', obs:'Reposição lançada nos Lançamentos do dia', lanc:{dia:'2026-09-30', id:'L1'}}]; };
    repSaldo=function(){ return 0; }; repLivresSemDia=function(){ return 0; };`);
  try {
    run("DASH_DADOS={reposicao:{L1:{valor:'Safira/Spitz', chave:'safira__bia'}}};");
    await run("dashRemover('reposicao','L1')");
    for (let i = 0; i < 20; i++) await Promise.resolve();
    const e = JSON.parse(JSON.stringify(run('__esc')));
    assert.ok(/Tirar e desmarcar 30\/09/.test(e.bts[0]) && /Tirar só o lançamento/.test(e.bts[1]) && e.bts[2] === 'Manter', JSON.stringify(e.bts));
    let upd = JSON.parse(JSON.stringify(run('__upd')));
    assert.strictEqual(upd.length, 1, 'desmarcou');
    assert.ok(/lancamentos\/c1$/.test(upd[0].p) && upd[0].v.volta === '' && upd[0].v.volta_desmarcada.dia === '2026-09-30');
    assert.strictEqual(run('__set.length'), 1, 'e devolveu o uso');
    // só o lançamento: a marcação continua
    run("__upd=[]; __set=[]; __rm=[]; __resp='so'; DASH_DADOS={reposicao:{L1:{valor:'Safira/Spitz', chave:'safira__bia'}}};");
    await run("dashRemover('reposicao','L1')");
    for (let i = 0; i < 20; i++) await Promise.resolve();
    assert.strictEqual(run('__upd.length'), 0, 'a marcação continua');
    assert.strictEqual(run('__set.length'), 1, 'o uso volta do mesmo jeito');
    // manter: nada acontece
    run("__upd=[]; __set=[]; __rm=[]; __resp='manter'; DASH_DADOS={reposicao:{L1:{valor:'Safira/Spitz', chave:'safira__bia'}}};");
    await run("dashRemover('reposicao','L1')");
    for (let i = 0; i < 20; i++) await Promise.resolve();
    assert.strictEqual(run('__rm.length + __upd.length + __set.length'), 0);
  } finally { run('DB=__bkQ3.db; DASH_DADOS=__bkQ3.dd; dashDia=__bkQ3.di; dashItem=__bkQ3.it; zEscolha=__bkQ3.ze; zPergunta=__bkQ3.zp; renderDash=__bkQ3.rd; audit=__bkQ3.au; dashEspelhar=__bkQ3.esp; repMsgModal=__bkQ3.mm; repLancamentos=__bkQ3.l; repSaldo=__bkQ3.s; repLivresSemDia=__bkQ3.lsd; prevCorrigePetDe=__bkQ3.pc; repHojeISO=__bkQ3.h; pelExtra=__bkQ3.pe;'); }
});
provaAsync('«Devolver» no Extrato: o uso cancelado volta para o saldo, com o motivo e o dia', async () => {
  run(`__bkR4={db:DB, p:PELUDINHOS, l:repLancamentos, s:repSaldo, pl:repPodeLancar, zt:zTexto, mm:repMsgModal, rr:renderReposicao, ae:repAbrirExtrato, au:audit, lsd:repLivresSemDia, h:repHojeISO, pe:pelExtra};
    __push4=[]; __msg4=null;
    DB={ref:function(p){ return { set:function(v){ __push4.push({p:p, v:JSON.parse(JSON.stringify(v))}); return Promise.resolve(); } }; }};
    PELUDINHOS=[{n:'Safira', tutor:'Bia'}]; repHojeISO=function(){ return '2026-09-25'; }; pelExtra=function(){ return {sexo:'Fêmea'}; };
    repLancamentos=function(){ return [{_id:'c1', tipo:'credito', data:'2026-09-10'}, {_id:'u1', tipo:'uso', data:'2026-09-23', obs:''},
      {_id:'orc-x-1', tipo:'uso', data:'2026-09-20'}]; };
    repSaldo=function(){ return 0; }; repPodeLancar=function(){ return true; }; repLivresSemDia=function(){ return 0; };
    zTexto=function(){ return Promise.resolve('a tutora cancelou'); };
    repMsgModal=function(t, l, texto){ __msg4={t:t, l:l, texto:texto}; }; renderReposicao=function(){}; repAbrirExtrato=function(){}; audit=function(){};`);
  try {
    await run("repDevolverUso(0,'u1')");
    for (let i = 0; i < 20; i++) await Promise.resolve();
    const push = JSON.parse(JSON.stringify(run('__push4')));
    assert.strictEqual(push.length, 1);
    assert.strictEqual(push[0].v.estornaId, 'u1');
    assert.strictEqual(push[0].v.obs, 'a tutora cancelou');
    assert.strictEqual(push[0].v.dia_devolvido, '2026-09-23');
    assert.ok(/\/dev-u1$/.test(push[0].p));
    assert.ok(/Saldo agora: 1/.test(JSON.stringify(run('__msg4').l)));
    run('__push4=[];');
    await run("repDevolverUso(0,'orc-x-1')");
    for (let i = 0; i < 10; i++) await Promise.resolve();
    assert.strictEqual(run('__push4.length'), 0, 'o da hospedagem não se devolve por aqui');
  } finally { run('DB=__bkR4.db; PELUDINHOS=__bkR4.p; repLancamentos=__bkR4.l; repSaldo=__bkR4.s; repPodeLancar=__bkR4.pl; zTexto=__bkR4.zt; repMsgModal=__bkR4.mm; renderReposicao=__bkR4.rr; repAbrirExtrato=__bkR4.ae; audit=__bkR4.au; repLivresSemDia=__bkR4.lsd; repHojeISO=__bkR4.h; pelExtra=__bkR4.pe;'); }
});
provaAsync('o lançamento de Reposição guarda de qual lançamento veio o uso', async () => {
  run(`__bkR5={g:repGravar, di:dashDia, mm:repMsgModal, au:audit}; __u5=null;
    repGravar=function(p, reg){ __u5=JSON.parse(JSON.stringify(reg)); return Promise.resolve(); };
    dashDia=function(){ return '2026-09-30'; }; repMsgModal=function(){}; audit=function(){};`);
  try {
    await run("dashRepAbater({n:'Safira', tutor:'Bia'}, 2, 'L7')");
    const u = JSON.parse(JSON.stringify(run('__u5')));
    assert.deepStrictEqual(u.lanc, { dia: '2026-09-30', id: 'L7' });
    assert.strictEqual(u.obs, 'Reposição lançada nos Lançamentos do dia', 'o texto de sempre (o harness v-06 e os antigos dependem dele)');
  } finally { run('repGravar=__bkR5.g; dashDia=__bkR5.di; repMsgModal=__bkR5.mm; audit=__bkR5.au;'); }
});

// ================================================================== Troca de dia (Coco Chanel e Billy Paul, 25/set)
console.log('\nTroca de dia — falta avisada no dia dele, Reposição no novo, sem gastar as reposições');
const TROCA_STUBS = `__bkT={pd:pelDias, rl:repLancamentos, vd:vagasDoDia, dm:dcMatriculado, rs:repSaldo, rdi:repDisponivel, hz:zHojeISO, pe:pelExtra};
  pelDias=function(){ return ['ter']; }; dcMatriculado=function(){ return true; }; repSaldo=function(){ return 2; }; repDisponivel=function(){ return 2; };
  zHojeISO=function(){ return '2026-09-25'; }; pelExtra=function(){ return {sexo:'Fêmea'}; };
  vagasDoDia=function(){ return {reposicao:__VR||[], avulso:[], troca:[], cheio:false, lido:true, livres:3, usadas:2, limite:5}; };
  __VR=[]; __LT=[]; repLancamentos=function(){ return __LT; };`;
const TROCA_VOLTA = 'pelDias=__bkT.pd; repLancamentos=__bkT.rl; vagasDoDia=__bkT.vd; dcMatriculado=__bkT.dm; repSaldo=__bkT.rs; repDisponivel=__bkT.rdi; zHojeISO=__bkT.hz; pelExtra=__bkT.pe;';
prova('o veredito da troca: não pede reposição, valida os dois dias e converte a reposição já marcada', () => {
  run(TROCA_STUBS);
  try {
    const V = (de, para) => JSON.parse(JSON.stringify(run("dxVeredito({n:'Coco Chanel', tutor:'Juliana'}, '" + para + "', {de:'" + de + "'})")));
    let v = V('2026-09-29', '2026-09-30');
    assert.strictEqual(v.ok, true, v.motivo);
    assert.strictEqual(v.tipo, 'troca', 'é troca, não reposição nem avulso');
    assert.strictEqual(v.de, '2026-09-29');
    assert.ok(!v.converte);
    run('repSaldo=function(){ return 0; }; repDisponivel=function(){ return 0; };');
    assert.strictEqual(V('2026-09-29', '2026-09-30').tipo, 'troca', 'sem reposição nenhuma, a troca continua sendo troca (não vira avulso)');
    assert.ok(/NÃO vem/.test(V('', '2026-09-30').motivo), 'pede o dia em que ela não vem');
    assert.ok(/não vem na quarta/.test(V('2026-09-30', '2026-10-01').motivo), 'o dia que sai tem de ser dia dela');
    run("pelDias=function(){ return ['ter','qua']; };");
    assert.ok(/já vem na quarta/.test(V('2026-09-29', '2026-09-30').motivo), 'o dia novo não pode ser dia dela');
    run("pelDias=function(){ return ['ter']; };");
    assert.ok(/já passou/.test(V('2026-09-22', '2026-09-30').motivo));
    // a recepção já tinha marcado a reposição para quarta (usando uma reposição dela): converte
    run("__VR=['Coco Chanel/Spitz']; __LT=[{_id:'c1', tipo:'credito', data:'2026-09-10', volta:'2026-09-30'}];");
    v = V('2026-09-29', '2026-09-30');
    assert.strictEqual(v.ok, true, v.motivo);
    assert.strictEqual(v.converte, 'c1');
    // já feita
    run("__LT=[{_id:'c2', tipo:'credito', data:'2026-09-29', volta:'2026-09-30', troca:{de:'2026-09-29', para:'2026-09-30'}}];");
    assert.ok(/já está feita/.test(V('2026-09-29', '2026-09-30').motivo));
    // ocupada por outra coisa (avulso/troca antiga): não converte sozinha
    run("__LT=[];");
    assert.ok(/Desfaça lá primeiro/.test(V('2026-09-29', '2026-09-30').motivo));
    // sem troca, o veredito de sempre (o harness v-33 depende dele)
    run("__VR=[]; repSaldo=function(){ return 2; }; repDisponivel=function(){ return 2; };");
    assert.strictEqual(JSON.parse(JSON.stringify(run("dxVeredito({n:'Coco Chanel', tutor:'Juliana'}, '2026-09-30')"))).tipo, 'reposicao');
  } finally { run(TROCA_VOLTA); }
});
provaAsync('gravar a troca: crédito próprio (falta no dia dela, volta no novo); a reposição marcada volta a ficar sem dia', async () => {
  run(TROCA_STUBS + `__bkT2={db:DB, au:audit}; audit=function(){}; __up=null; __upP='';
    DB={ref:function(p){ return { push:function(){ return {key:'NOVO'}; }, update:function(v){ __upP=p; __up=JSON.parse(JSON.stringify(v)); return Promise.resolve(); } }; }};`);
  try {
    run("__LT=[{_id:'c1', tipo:'credito', data:'2026-09-10', volta:'2026-09-30'}];");
    let r = await run("repTrocaGravar({n:'Coco Chanel', tutor:'Juliana'}, '2026-09-29', '2026-09-30', null)");
    let up = JSON.parse(JSON.stringify(run('__up')));
    assert.ok(/daycare\/reposicao\/.+\/lancamentos$/.test(run('__upP')));
    assert.strictEqual(up.NOVO.tipo, 'credito');
    assert.strictEqual(up.NOVO.data, '2026-09-29', 'falta avisada na terça');
    assert.strictEqual(up.NOVO.volta, '2026-09-30', 'Reposição na quarta');
    assert.strictEqual(up.NOVO.motivo, 'troca');
    assert.deepStrictEqual([up.NOVO.troca.de, up.NOVO.troca.para], ['2026-09-29', '2026-09-30']);
    assert.strictEqual(up['c1/volta'], '', 'a reposição que estava marcada volta a ficar sem dia');
    assert.ok(/virou troca/.test(up['c1/volta_desmarcada'].motivo) && up['c1/volta_desmarcada'].dia === '2026-09-30');
    assert.strictEqual(JSON.parse(JSON.stringify(r)).convertida, true);
    // o tutor já tinha avisado a falta da terça: a troca usa aquela falta
    run("__LT=[{_id:'f1', tipo:'credito', data:'2026-09-29', motivo:'viagem'}];");
    r = await run("repTrocaGravar({n:'Coco Chanel', tutor:'Juliana'}, '2026-09-29', '2026-09-30', {quem:'Márcia', ts:1})");
    up = JSON.parse(JSON.stringify(run('__up')));
    assert.ok(!up.NOVO, 'nenhum crédito novo');
    assert.strictEqual(up['f1/volta'], '2026-09-30');
    assert.strictEqual(up['f1/troca'].de, '2026-09-29');
    assert.strictEqual(up['f1/autorizacao'].quem, 'Márcia');
  } finally { run(TROCA_VOLTA + ' DB=__bkT2.db; audit=__bkT2.au;'); }
});
prova('a mensagem da troca fala em troca — não em reposição', () => {
  run(`__bkT3={pe:pelExtra}; pelExtra=function(){ return {sexo:'Fêmea'}; };`);
  try {
    const m = run("repMensagem({n:'Coco Chanel', tutor:'Juliana Prado'}, 'troca', {de:'2026-09-29', para:'2026-09-30'})");
    assert.ok(/^Oi, Juliana, como está\?/.test(m), m);
    // Texto da Adriana, 28/set/2026 (antes: "a troca pedida do dia 29/09 (terça-feira) para o dia 30/09 (quarta-feira) foi feita").
    assert.ok(/Conforme pedido, estamos fazendo a troca da Coco Chanel do dia 29\/09 para quarta-feira, dia 30\/09\./.test(m), m);
    assert.ok(!/reposi/i.test(m), 'nenhuma palavra sobre reposição');
  } finally { run('pelExtra=__bkT3.pe;'); }
});
prova('Bis (28/set/2026): falta de um dia com o dia de repor já combinado sai como TROCA na mensagem ao tutor', () => {
  igual(run("repLancEhTroca({qtd:1, data:'2026-10-02', volta:'2026-10-01'})"), true);
  igual(run("repLancEhTroca({qtd:1, data:'2026-10-02', volta:''})"), false, 'sem dia de repor: reposição');
  igual(run("repLancEhTroca({qtd:5, data:'2026-10-05', volta:'2026-10-20', de:'2026-10-05', ate:'2026-10-09'})"), false, 'período (férias): reposição');
  run(`__bkT7=zHojeISO; zHojeISO=function(){ return '2026-09-28'; };`);
  try {
    igual(run("repLancEhTroca({qtd:1, data:'2026-09-25', volta:'2026-09-29'})"), false, 'falta de dia que já passou: reposição');
    igual(run("repLancEhTroca({qtd:1, data:'2026-09-28', volta:'2026-09-29'})"), true, 'falta de hoje com dia combinado: troca');
    igual(run("repLancEhTroca({qtd:1, data:'2026-10-07', volta:'2026-10-20', periodo:true})"), false, 'período que rende um dia: reposição');
    igual(run("repLancEhTroca({qtd:1, data:'2026-10-01', volta:'2026-10-01'})"), false);
  } finally { run('zHojeISO=__bkT7;'); }
  run(`__bkT5={pe:pelExtra}; pelExtra=function(){ return {sexo:'Macho'}; };`);
  try {
    const m = run("repMensagem({n:'Bis Leon', tutor:'Bruno Souza'}, 'troca', {de:'2026-10-02', para:'2026-10-01'})");
    assert.ok(/^Oi, Bruno, como está\?/.test(m), m);
    assert.ok(/Conforme pedido, estamos fazendo a troca do Bis Leon do dia 02\/10 para quinta-feira, dia 01\/10\./.test(m), m);
    assert.ok(!/reposi/i.test(m) && !/de hoje/.test(m), m);
  } finally { run('pelExtra=__bkT5.pe;'); }
});
provaAsync('Bis (QA26): o lançamento com dia de repor grava a marca de troca; lotado, falta que já passou e período continuam reposição', async () => {
  run(`__bkR={ge:document.getElementById, mm:repMsgModal, rg:repGravar, au:audit, ad:repAuditDiaDele, rf:repFechar, rr:renderReposicao,
      vp:vagasPedir, tl:repTelDe, hz:zHojeISO, rs:repSaldo, vd:vagasDoDia, ve:vagasPodeEncaixar, pt:pessoaDoTurno, pe:pelExtra, dq:repDiasQueViria,
      ps:repPelSel, mo:repModoAtual, mt:repMotivoAtual, pd:pelDias};
    __diasDele=['sex']; pelDias=function(){ return __diasDele; };   // o Bis vem às sextas
    __elsR={}; document.getElementById=function(id){ return __elsR[id]||(__elsR[id]={value:'', textContent:'', innerHTML:'', style:{}, disabled:false}); };
    __capR=[]; repMsgModal=function(t,l,x){ __capR.push({t:t, l:l, x:x}); };
    __gravR=[]; repGravar=function(p,r){ __gravR.push(JSON.parse(JSON.stringify(r))); return Promise.resolve({key:'k'+__gravR.length}); };
    audit=function(){}; repAuditDiaDele=function(){}; repFechar=function(){}; renderReposicao=function(){};
    vagasPedir=function(){ return Promise.resolve(); }; repTelDe=function(){ return ''; };
    zHojeISO=function(){ return '2026-09-28'; }; repSaldo=function(){ return 0; };
    __cheioR=false; __podeR=false; vagasDoDia=function(){ return {lido:true, cheio:__cheioR}; }; vagasPodeEncaixar=function(){ return __podeR; };
    pessoaDoTurno=function(){ return 'Márcia'; }; pelExtra=function(){ return {sexo:'Macho'}; };
    __diasR=[]; repDiasQueViria=function(){ return __diasR; };`);
  const caso = async (cfg) => {
    run(`__elsR={}; __capR=[]; __gravR=[]; __cheioR=${!!cfg.cheio}; __podeR=false; __diasR=${JSON.stringify(cfg.dias || [])}; __diasDele=${JSON.stringify(cfg.diasDele || ['sex'])};
      document.getElementById('repData').value=${JSON.stringify(cfg.data || '')}; document.getElementById('repVolta').value=${JSON.stringify(cfg.volta || '')};
      document.getElementById('repDe').value=${JSON.stringify(cfg.de || '')}; document.getElementById('repAte').value=${JSON.stringify(cfg.ate || '')};
      repPelSel={n:'Bis Leon', tutor:'Bruno Souza'}; repModoAtual=${JSON.stringify(cfg.modo || 'dia')}; repMotivoAtual='outro';
      repConfirmar({});`);
    for (let i = 0; i < 20; i++) await Promise.resolve();
    return { g: JSON.parse(JSON.stringify(run('__gravR'))), c: JSON.parse(JSON.stringify(run('__capR'))) };
  };
  try {
    let r = await caso({ data: '2026-10-02', volta: '2026-10-01' });
    assert.ok(r.g.length === 1 && r.g[0].troca && r.g[0].troca.de === '2026-10-02' && r.g[0].troca.para === '2026-10-01', 'Bis: grava a marca de troca ' + JSON.stringify(r.g));
    assert.strictEqual(run('repTrocaViva(' + JSON.stringify(r.g[0]) + ')'), true, 'no dia 01/10 o app reconhece a troca ("troca cumprida")');
    assert.ok(/Conforme pedido, estamos fazendo a troca do Bis Leon do dia 02\/10 para quinta-feira, dia 01\/10\./.test(r.c[0].x), r.c[0].x);
    assert.ok(/TROCA de dia/.test(r.c[0].l[0]) && /troca cumprida/.test(r.c[0].l[1]) && r.c[0].t === '✅ Reposição lançada', JSON.stringify(r.c[0].l));
    assert.strictEqual(r.g[0].nasceu_troca, true, 'a marca de nascimento fica no crédito');
    igual(run('repTrocaComoDesfaz(' + JSON.stringify(r.g[0]) + ", '2026-09-28').estorna"), true, 'desfazer antes do dia estorna a falta, igual à "Marcar troca"');
    r = await caso({ data: '2026-10-02', volta: '2026-10-01', diasDele: ['qui', 'sex'] });
    assert.ok(!r.g[0].troca && !/troca/i.test(r.c[0].x), 'o dia novo já é dia dele: reposição');
    r = await caso({ data: '2026-10-02', volta: '2026-10-03' });
    assert.ok(!r.g[0].troca && !/troca/i.test(r.c[0].x), 'dia novo no sábado: reposição');
    r = await caso({ data: '2026-09-30', volta: '2026-10-01' });
    assert.ok(!r.g[0].troca && !/troca/i.test(r.c[0].x), 'a falta não é num dia dele: reposição');
    r = await caso({ data: '2026-10-02', volta: '2026-10-01', cheio: true });
    assert.ok(!r.g[0].troca && /contando a do dia 02\/10\/2026/.test(r.c[0].x), 'dia de repor lotado, sem agendar: reposição ' + r.c[0].x);
    r = await caso({ data: '2026-09-25', volta: '2026-09-29' });
    assert.ok(!r.g[0].troca && !/troca/i.test(r.c[0].x), 'falta de dia que já passou: reposição ' + r.c[0].x);
    r = await caso({ data: '2026-10-01', volta: '2026-10-01' });
    assert.ok(!r.g[0].troca && !/troca/i.test(r.c[0].x), 'dia de repor igual ao da falta: reposição');
    r = await caso({ modo: 'periodo', de: '2026-10-05', ate: '2026-10-11', dias: ['2026-10-07'], volta: '2026-10-20' });
    assert.ok(r.g.length === 1 && !r.g[0].troca && !/troca/i.test(r.c[0].x), 'período que rende um dia só: reposição ' + r.c[0].x);
    r = await caso({ modo: 'periodo', de: '2026-09-28', ate: '2026-10-02', dias: ['2026-09-28', '2026-09-30'] });
    assert.ok(/com as de hoje, referentes ao período de 28\/09\/2026 a 02\/10\/2026/.test(r.c[0].x), r.c[0].x);
  } finally {
    run(`document.getElementById=__bkR.ge; repMsgModal=__bkR.mm; repGravar=__bkR.rg; audit=__bkR.au; repAuditDiaDele=__bkR.ad; repFechar=__bkR.rf;
      renderReposicao=__bkR.rr; vagasPedir=__bkR.vp; repTelDe=__bkR.tl; zHojeISO=__bkR.hz; repSaldo=__bkR.rs; vagasDoDia=__bkR.vd;
      vagasPodeEncaixar=__bkR.ve; pessoaDoTurno=__bkR.pt; pelExtra=__bkR.pe; repDiasQueViria=__bkR.dq; repPelSel=__bkR.ps; repModoAtual=__bkR.mo; repMotivoAtual=__bkR.mt; pelDias=__bkR.pd;`);
  }
});
prova('reposição: "com a de hoje" só quando a falta é de hoje', () => {
  run(`__bkT6={pe:pelExtra, rh:repHojeISO}; pelExtra=function(){ return {sexo:'Macho'}; }; repHojeISO=function(){ return '2026-09-28'; };`);
  try {
    const hoje = run("repMensagem({n:'Bis Leon', tutor:'Bruno'}, 'credito', {qtd:1, data:'2026-09-28', saldo:2})");
    assert.ok(/está com 2 reposições, com a de hoje, referente ao dia 28\/09\/2026\./.test(hoje), hoje);
    const outro = run("repMensagem({n:'Bis Leon', tutor:'Bruno'}, 'credito', {qtd:1, data:'2026-10-02', saldo:1})");
    assert.ok(/está com 1 reposição, contando a do dia 02\/10\/2026\./.test(outro) && !/de hoje/.test(outro), outro);
    const per = run("repMensagem({n:'Bis Leon', tutor:'Bruno'}, 'credito', {qtd:5, de:'2026-10-05', ate:'2026-10-09', saldo:5})");
    assert.ok(/contando as do período de 05\/10\/2026 a 09\/10\/2026\./.test(per), per);
  } finally { run('pelExtra=__bkT6.pe; repHojeISO=__bkT6.rh;'); }
});
prova('turma: na terça "trocou para 30/09"; na quarta vem "troca (no lugar de 29/09)"; a planilha recebe falta e Reposição', () => {
  run(`__bkT4={pd:pelDias, rl:repLancamentos, ra:repAgendaDe, pe:pelExtra, te:poTelDoTutor, rs:repSaldo, pi:pelInativo, mz:ehMoradorZeluz, P:PELUDINHOS, hz:zHojeISO};
       pelDias=function(p){ return p.dias||[]; }; pelInativo=function(){ return false; }; ehMoradorZeluz=function(){ return false; };
       repLancamentos=function(p){ return p.lanc||[]; }; repAgendaDe=function(p){ return (p.lanc||[]).filter(function(l){ return l.volta; }).map(function(l){ return l.volta; }); };
       pelExtra=function(){ return {}; }; poTelDoTutor=function(){ return ''; }; repSaldo=function(){ return 3; }; zHojeISO=function(){ return '2026-09-25'; };
       __P=[{n:'Coco Chanel', raca:'Spitz', tutor:'Juliana', dias:['ter'], lanc:[{_id:'t1', tipo:'credito', data:'2026-09-29', motivo:'troca', volta:'2026-09-30', troca:{de:'2026-09-29', para:'2026-09-30'}}]}];
       PELUDINHOS=__P;`);
  try {
    const ter = JSON.parse(JSON.stringify(run("turmaListaDoDia('2026-09-29', {pets:__P, trocas:{}, avulsos:{}, chamada:{}, pend:[], margem:3, hoje:'2026-09-25'})")));
    assert.deepStrictEqual(ter.vem.map((o) => o.nome), [], 'sai da turma de terça');
    assert.strictEqual(ter.naoVem[0].motivo, 'trocou para 30/09');
    const qua = JSON.parse(JSON.stringify(run("turmaListaDoDia('2026-09-30', {pets:__P, trocas:{}, avulsos:{}, chamada:{}, pend:[], margem:3, hoje:'2026-09-25'})")));
    assert.strictEqual(qua.vem[0].porque, 'troca (no lugar de 29/09)');
    const pTer = JSON.parse(JSON.stringify(run("dashAutoCalcular('2026-09-29')")));
    const pQua = JSON.parse(JSON.stringify(run("dashAutoCalcular('2026-09-30')")));
    assert.ok(pTer.faltas.some((n) => /Coco Chanel/.test(n)), 'terça: Faltas Avisadas');
    assert.ok(pQua.reposicao.some((n) => /Coco Chanel/.test(n)), 'quarta: Reposição');
  } finally { run('pelDias=__bkT4.pd; repLancamentos=__bkT4.rl; repAgendaDe=__bkT4.ra; pelExtra=__bkT4.pe; poTelDoTutor=__bkT4.te; repSaldo=__bkT4.rs; pelInativo=__bkT4.pi; ehMoradorZeluz=__bkT4.mz; PELUDINHOS=__bkT4.P; zHojeISO=__bkT4.hz;'); }
});
provaAsync('dia lotado: a Márcia autoriza e o app faz a troca inteira', async () => {
  run(TROCA_STUBS);
  run(`__bkT5={pp:vagasPodeEncaixar, pd:vagasPedidoDe, pc:repPelaChave, vd:vagasDoDia, zp:zPergunta, tg:repTrocaGravar, fm:repTrocaFeitaModal, db:DB, au:audit};
    __tg=null; __fm=0;
    vagasPodeEncaixar=function(){ return true; };
    vagasPedidoDe=function(){ return {pet:'Coco Chanel', tipo:'reposicao', payload:{volta:'2026-09-30', troca:{de:'2026-09-29', para:'2026-09-30'}}}; };
    repPelaChave=function(){ return {n:'Coco Chanel', tutor:'Juliana'}; };
    vagasDoDia=function(){ return {reposicao:[], avulso:[], troca:[], usadas:5, limite:5, cheio:true, lido:true}; };
    zPergunta=function(){ return Promise.resolve(true); };
    repTrocaGravar=function(p, de, para, aut){ __tg={de:de, para:para, aut:!!aut}; return Promise.resolve({convertida:false}); };
    repTrocaFeitaModal=function(){ __fm++; }; audit=function(){};
    DB={ref:function(){ return { update:function(){ return Promise.resolve(); } }; }};`);
  try {
    await run("vagasAutorizar('2026-09-30', 'coco')");
    for (let i = 0; i < 20; i++) await Promise.resolve();
    assert.deepStrictEqual(JSON.parse(JSON.stringify(run('__tg'))), { de: '2026-09-29', para: '2026-09-30', aut: true });
    assert.strictEqual(run('__fm'), 1, 'a mensagem da troca sai pronta');
  } finally { run('vagasPodeEncaixar=__bkT5.pp; vagasPedidoDe=__bkT5.pd; repPelaChave=__bkT5.pc; vagasDoDia=__bkT5.vd; zPergunta=__bkT5.zp; repTrocaGravar=__bkT5.tg; repTrocaFeitaModal=__bkT5.fm; DB=__bkT5.db; audit=__bkT5.au;' + TROCA_VOLTA); }
});

console.log('\nTroca de dia — QA15: desfazer, o dia da troca, a planilha e o × da Lista de troca');
prova('QA15 — a troca é "viva" só enquanto o dia marcado é o dela; desfazer segue a régua do dia de origem', () => {
  const T = { _id: 't1', tipo: 'credito', data: '2026-09-29', motivo: 'troca', volta: '2026-09-30', troca: { de: '2026-09-29', para: '2026-09-30' } };
  assert.strictEqual(run('repTrocaViva(' + JSON.stringify(T) + ')'), true);
  assert.strictEqual(run('repTrocaViva(' + JSON.stringify(Object.assign({}, T, { volta: '2026-10-07' })) + ')'), false, 'remarcada: vira reposição comum');
  assert.strictEqual(run('repTrocaViva(' + JSON.stringify(Object.assign({}, T, { volta: '' })) + ')'), false);
  assert.strictEqual(run('REP_MOTIVOS.troca'), 'Troca de dia');
  const D = (c, h) => JSON.parse(JSON.stringify(run('repTrocaComoDesfaz(' + JSON.stringify(c) + ",'" + h + "')")));
  assert.strictEqual(D(T, '2026-09-25').estorna, true, 'a terça ainda vem: a falta avisada sai');
  assert.ok(/Volta a vir na terça-feira, 29\/09/.test(D(T, '2026-09-25').texto));
  assert.strictEqual(D(T, '2026-09-30').estorna, false, 'a terça já passou: a falta fica');
  assert.ok(/vira reposição sem dia/.test(D(T, '2026-09-30').texto));
  assert.strictEqual(D(Object.assign({}, T, { motivo: 'viagem' }), '2026-09-25').estorna, false, 'a falta já tinha sido avisada: fica');
});
provaAsync('QA15 — desmarcar a troca: estorna a falta que nasceu dela (a terça volta)', async () => {
  run(`__bkQ5={db:DB, p:PELUDINHOS, l:repLancamentos, pl:repPodeLancar, zp:zPergunta, za:zAlertao, rr:renderReposicao, h:repHojeISO, au:audit, g:repGravar, vc:vagasCarregarDia, mm:repMsgModal};
    __g5=[]; __u5=[]; __z5=null; __m5=null; audit=function(){}; vagasCarregarDia=function(){ return Promise.resolve(); };
    repMsgModal=function(t, l, texto){ __m5={t:t, l:l, texto:texto}; };
    DB={ref:function(p){ return { update:function(v){ __u5.push({p:p, v:v}); return Promise.resolve(); } }; }};
    repGravar=function(p, reg){ __g5.push(JSON.parse(JSON.stringify(reg))); return Promise.resolve(); };
    PELUDINHOS=[{n:'Coco Chanel', tutor:'Juliana'}]; repHojeISO=function(){ return '2026-09-25'; };
    repLancamentos=function(){ return [{_id:'t1', tipo:'credito', data:'2026-09-29', motivo:'troca', volta:'2026-09-30', troca:{de:'2026-09-29', para:'2026-09-30'}}]; };
    repPodeLancar=function(){ return true; }; zPergunta=function(){ return Promise.resolve(true); };
    zAlertao=function(t, l){ __z5={t:t, l:l}; }; renderReposicao=function(){};`);
  try {
    await run("repDesmarcar(0, '2026-09-30')");
    for (let i = 0; i < 10; i++) await Promise.resolve();
    const g = JSON.parse(JSON.stringify(run('__g5')));
    assert.strictEqual(g.length, 1);
    assert.strictEqual(g[0].tipo, 'estorno');
    assert.strictEqual(g[0].estornaId, 't1', 'o crédito da troca sai inteiro: a terça volta');
    assert.strictEqual(run('__u5.length'), 0);
    const m5 = JSON.parse(JSON.stringify(run('__m5')));
    assert.strictEqual(m5.t, '✅ Troca desfeita');
    assert.ok(/a troca do dia 29\/09 \(terça-feira\) para o dia 30\/09 \(quarta-feira\) foi desfeita/.test(m5.texto), m5.texto);
    assert.ok(/vem na terça-feira, 29\/09, como sempre/.test(m5.texto) && !/reposi/i.test(m5.texto), 'QA16: a troca desfeita avisa o tutor sem falar em reposição');
  } finally { run('DB=__bkQ5.db; PELUDINHOS=__bkQ5.p; repLancamentos=__bkQ5.l; repPodeLancar=__bkQ5.pl; zPergunta=__bkQ5.zp; zAlertao=__bkQ5.za; renderReposicao=__bkQ5.rr; repHojeISO=__bkQ5.h; audit=__bkQ5.au; repGravar=__bkQ5.g; vagasCarregarDia=__bkQ5.vc; repMsgModal=__bkQ5.mm;'); }
});
provaAsync('QA15 — no dia da troca, "Veio repor hoje" e o lançamento do dia não falam em reposição ao tutor', async () => {
  run(`__bkQ6={p:PELUDINHOS, l:repLancamentos, s:repSaldo, pl:repPodeLancar, zp:zPergunta, zt:zTexto, za:zAlertao, mm:repMsgModal, rr:renderReposicao, h:repHojeISO, au:audit, g:repGravar, rsv:repReservado, di:dashDia};
    __g6=[]; __z6=[]; __m6=0; audit=function(){};
    repGravar=function(p, reg){ __g6.push(JSON.parse(JSON.stringify(reg))); return Promise.resolve(); };
    PELUDINHOS=[{n:'Coco Chanel', tutor:'Juliana'}]; repHojeISO=function(){ return '2026-09-30'; }; dashDia=function(){ return '2026-09-30'; };
    repLancamentos=function(){ return [{_id:'c0', tipo:'credito', data:'2026-09-01'}, {_id:'t1', tipo:'credito', data:'2026-09-29', motivo:'troca', volta:'2026-09-30', troca:{de:'2026-09-29', para:'2026-09-30'}}]; };
    repSaldo=function(){ return 2; }; repReservado=function(){ return 0; }; repPodeLancar=function(){ return true; };
    zPergunta=function(){ return Promise.resolve(true); }; zTexto=function(){ return Promise.resolve(''); };
    zAlertao=function(t, l){ __z6.push({t:t, l:l}); }; repMsgModal=function(){ __m6++; }; renderReposicao=function(){};`);
  try {
    await run('repUsar(0)');
    for (let i = 0; i < 10; i++) await Promise.resolve();
    let g = JSON.parse(JSON.stringify(run('__g6')));
    assert.strictEqual(g.length, 1);
    assert.strictEqual(g[0].tipo, 'uso');
    assert.strictEqual(g[0].motivo, 'troca');
    assert.strictEqual(run('__m6'), 0, 'nenhuma mensagem de reposição ao tutor');
    assert.ok(run('__z6')[0].t === 'TROCA CUMPRIDA' && /continuam 1/.test(JSON.stringify(run('__z6')[0].l)), JSON.stringify(run('__z6')));
    run('__g6=[]; __z6=[]; __m6=0;');
    await run("dashRepAbater(PELUDINHOS[0], 2, 'L9')");
    g = JSON.parse(JSON.stringify(run('__g6')));
    assert.strictEqual(g[0].motivo, 'troca');
    assert.strictEqual(run('__m6'), 0);
    assert.strictEqual(run('__z6')[0].t, 'TROCA CUMPRIDA');
  } finally { run('PELUDINHOS=__bkQ6.p; repLancamentos=__bkQ6.l; repSaldo=__bkQ6.s; repPodeLancar=__bkQ6.pl; zPergunta=__bkQ6.zp; zTexto=__bkQ6.zt; zAlertao=__bkQ6.za; repMsgModal=__bkQ6.mm; renderReposicao=__bkQ6.rr; repHojeISO=__bkQ6.h; audit=__bkQ6.au; repGravar=__bkQ6.g; repReservado=__bkQ6.rsv; dashDia=__bkQ6.di;'); }
});
prova('QA15 — a troca estornada sai da planilha (Faltas Avisadas) e o × da Lista de troca não aparece na troca nova', () => {
  run(`__bkQ7={pd:pelDias, rl:repLancamentos, ra:repAgendaDe, pe:pelExtra, pi:pelInativo, P:PELUDINHOS, hz:zHojeISO, rpc:REP_PLAN_CACHE, td:trocaDoDia};
    pelDias=function(p){ return p.dias||[]; }; pelInativo=function(){ return false; }; pelExtra=function(){ return {}; }; zHojeISO=function(){ return '2026-09-25'; };
    repLancamentos=function(p){ return p.lanc||[]; }; repAgendaDe=function(p){ return (p.lanc||[]).filter(function(l){ return l.volta; }).map(function(l){ return l.volta; }); };
    trocaDoDia=function(){ return []; }; REP_PLAN_CACHE={};
    PELUDINHOS=[{n:'Coco Chanel', raca:'Spitz', tutor:'Juliana', dias:['ter'], lanc:[{_id:'t1', tipo:'credito', data:'2026-09-29', motivo:'troca', volta:'2026-09-30', troca:{de:'2026-09-29', para:'2026-09-30'}}]}];`);
  try {
    const oc = JSON.parse(JSON.stringify(run("ocupantesDoDia('2026-09-30')")));
    assert.strictEqual(oc[0].tipo, 'troca');
    assert.strictEqual(oc[0].id, '', 'sem id: o × (que só cancela troca antiga) não aparece');
    run("PELUDINHOS[0].lanc.push({_id:'e1', tipo:'estorno', estornaId:'t1'});");
    assert.ok(!JSON.parse(JSON.stringify(run("dashAutoCalcular('2026-09-29')"))).faltas.some((n) => /Coco/.test(n)), 'estornada: a terça não tem mais falta avisada');
  } finally { run('pelDias=__bkQ7.pd; repLancamentos=__bkQ7.rl; repAgendaDe=__bkQ7.ra; pelExtra=__bkQ7.pe; pelInativo=__bkQ7.pi; PELUDINHOS=__bkQ7.P; zHojeISO=__bkQ7.hz; REP_PLAN_CACHE=__bkQ7.rpc; trocaDoDia=__bkQ7.td;'); }
});
provaAsync('QA15 — a Márcia autoriza tarde: a troca que não vale mais (o dia de origem passou) não é gravada', async () => {
  run(TROCA_STUBS);
  run(`__bkQ8={pp:vagasPodeEncaixar, pd:vagasPedidoDe, pc:repPelaChave, zp:zPergunta, tg:repTrocaGravar, db:DB, au:audit, al:alert};
    __tg8=null; __al8='';
    vagasPodeEncaixar=function(){ return true; }; alert=function(t){ __al8=t; };
    vagasPedidoDe=function(){ return {pet:'Coco Chanel', tipo:'reposicao', payload:{volta:'2026-10-01', troca:{de:'2026-09-22', para:'2026-10-01'}}}; };
    repPelaChave=function(){ return {n:'Coco Chanel', tutor:'Juliana'}; };
    zPergunta=function(){ return Promise.resolve(true); };
    repTrocaGravar=function(p, de, para){ __tg8={de:de, para:para}; return Promise.resolve({}); }; audit=function(){};
    DB={ref:function(){ return { update:function(){ return Promise.resolve(); } }; }};`);
  try {
    await run("vagasAutorizar('2026-10-01', 'coco')");
    for (let i = 0; i < 10; i++) await Promise.resolve();
    assert.strictEqual(run('__tg8'), null, 'nada gravado');
    assert.ok(/não vale mais/.test(run('__al8')), run('__al8'));
  } finally { run('vagasPodeEncaixar=__bkQ8.pp; vagasPedidoDe=__bkQ8.pd; repPelaChave=__bkQ8.pc; zPergunta=__bkQ8.zp; repTrocaGravar=__bkQ8.tg; DB=__bkQ8.db; audit=__bkQ8.au; alert=__bkQ8.al;' + TROCA_VOLTA); }
});

console.log('\nQA16 — os textos e os números do Tirar, do Devolver e da troca desfeita');
prova('QA16 — a mensagem da troca desfeita: sem reposição quando a terça volta; com a falta quando ela fica', () => {
  run(`__bkR1={pe:pelExtra}; pelExtra=function(){ return {sexo:'Fêmea'}; };`);
  try {
    const m1 = run("repMensagem({n:'Coco Chanel', tutor:'Juliana'}, 'troca-desfeita', {de:'2026-09-29', para:'2026-09-30', estorna:true, livres:1})");
    assert.ok(/a troca do dia 29\/09 \(terça-feira\) para o dia 30\/09 \(quarta-feira\) foi desfeita\. A Coco Chanel vem na terça-feira, 29\/09, como sempre\./.test(m1), m1);
    assert.ok(!/reposi/i.test(m1));
    const m2 = run("repMensagem({n:'Coco Chanel', tutor:'Juliana'}, 'troca-desfeita', {de:'2026-09-29', para:'2026-09-30', estorna:false, livres:1})");
    assert.ok(/A falta do dia 29\/09 continua valendo: fica 1 reposição para marcar/.test(m2), m2);
  } finally { run('pelExtra=__bkR1.pe;'); }
});
provaAsync('QA16 — Tirar e desfazer a troca: "era 1, ficou 1" (o crédito da troca sai junto); Tirar só o lançamento não fala com o tutor', async () => {
  run(`__bkR2={db:DB, dd:DASH_DADOS, di:dashDia, it:dashItem, ze:zEscolha, zp:zPergunta, za:zAlertao, rd:renderDash, au:audit, esp:dashEspelhar, mm:repMsgModal,
         l:repLancamentos, s:repSaldo, lsd:repLivresSemDia, pc:prevCorrigePetDe, h:repHojeISO, pe:pelExtra, g:repGravar};
    __mm=null; __za=null; __resp='ambos'; __g=[];
    DB={ref:function(p){ return { remove:function(){ return Promise.resolve(); }, update:function(){ return Promise.resolve(); }, set:function(){ return Promise.resolve(); } }; }};
    repGravar=function(p, r){ __g.push(JSON.parse(JSON.stringify(r))); return Promise.resolve(); };
    dashDia=function(){ return '2026-09-30'; }; repHojeISO=function(){ return '2026-09-25'; }; dashItem=function(){ return {t:'Reposição', col:'Reposição'}; };
    zEscolha=function(t, linhas, bts){ var i=(__resp==='ambos')?0:1; bts[i].fn(); };
    zPergunta=function(){ return Promise.resolve(true); };
    zAlertao=function(t, l){ __za={t:t, l:l}; };
    renderDash=function(){}; audit=function(){}; dashEspelhar=function(){};
    repMsgModal=function(t, l, texto){ __mm={t:t, l:l, texto:texto}; };
    pelExtra=function(){ return {sexo:'Fêmea'}; };
    prevCorrigePetDe=function(){ return {n:'Coco Chanel', tutor:'Juliana'}; };
    repLancamentos=function(){ return [{_id:'c0', tipo:'credito', data:'2026-09-01'},
      {_id:'t1', tipo:'credito', data:'2026-10-06', motivo:'troca', volta:'2026-09-30', troca:{de:'2026-10-06', para:'2026-09-30'}},
      {_id:'u1', tipo:'uso', data:'2026-09-30', obs:'Reposição lançada nos Lançamentos do dia', motivo:'troca', lanc:{dia:'2026-09-30', id:'L1'}}]; };
    repSaldo=function(){ return 1; }; repLivresSemDia=function(){ return 1; };`);
  try {
    run("DASH_DADOS={reposicao:{L1:{valor:'Coco Chanel/Spitz', chave:'coco'}}};");
    await run("dashRemover('reposicao','L1')");
    for (let i = 0; i < 30; i++) await Promise.resolve();
    const mm = JSON.parse(JSON.stringify(run('__mm')));
    assert.ok(/Troca desfeita/.test(mm.t), mm.t);
    assert.ok(/era 1, ficou 1/.test(JSON.stringify(mm.l)), JSON.stringify(mm.l));
    assert.ok(/foi desfeita/.test(mm.texto) && !/reposi/i.test(mm.texto), mm.texto);
    run("__mm=null; __za=null; __resp='so'; DASH_DADOS={reposicao:{L1:{valor:'Coco Chanel/Spitz', chave:'coco'}}};");
    await run("dashRemover('reposicao','L1')");
    for (let i = 0; i < 30; i++) await Promise.resolve();
    assert.strictEqual(run('__mm'), null, '«só o lançamento»: nenhuma mensagem ao tutor');
    assert.ok(/LANÇAMENTO TIRADO/.test(run('__za').t) && /A troca de 30\/09\/2026 continua/.test(JSON.stringify(run('__za').l)), JSON.stringify(run('__za')));
  } finally { run('DB=__bkR2.db; DASH_DADOS=__bkR2.dd; dashDia=__bkR2.di; dashItem=__bkR2.it; zEscolha=__bkR2.ze; zPergunta=__bkR2.zp; zAlertao=__bkR2.za; renderDash=__bkR2.rd; audit=__bkR2.au; dashEspelhar=__bkR2.esp; repMsgModal=__bkR2.mm; repLancamentos=__bkR2.l; repSaldo=__bkR2.s; repLivresSemDia=__bkR2.lsd; prevCorrigePetDe=__bkR2.pc; repHojeISO=__bkR2.h; pelExtra=__bkR2.pe; repGravar=__bkR2.g;'); }
});
prova('QA16 — o crédito da troca não é reposição: nem no dia extra, nem no orçamento da hospedagem', () => {
  run(`__bkR3={l:repLancamentos, h:repHojeISO, d:repDisponivel, s:repSaldo, dm:dcMatriculado, vd:vagasDoDia, hz:zHojeISO, da:diariaAvulsaCent, P:PELUDINHOS};
    repHojeISO=function(){ return '2026-09-25'; }; zHojeISO=function(){ return '2026-09-25'; };
    repLancamentos=function(){ return [{_id:'t1', tipo:'credito', data:'2026-09-29', motivo:'troca', volta:'2026-09-30', troca:{de:'2026-09-29', para:'2026-09-30'}}]; };
    repSaldo=function(){ return 1; }; repDisponivel=function(){ return 1; }; dcMatriculado=function(){ return true; }; diariaAvulsaCent=function(){ return 9700; };
    vagasDoDia=function(){ return {reposicao:[], avulso:[], troca:[], cheio:false, lido:true}; };
    PELUDINHOS=[{n:'Billy Paul', tutor:'Juliana'}];`);
  try {
    assert.strictEqual(run('repTrocasPendentes(PELUDINHOS[0])'), 1);
    const v = JSON.parse(JSON.stringify(run("dxVeredito(PELUDINHOS[0], '2026-10-01')")));
    assert.strictEqual(v.tipo, 'avulso', 'sem reposição livre de verdade: é avulso (a lei de 21/set)');
    assert.strictEqual(run("orcSaldoRep({key:pelKey(PELUDINHOS[0])})"), 0, 'a troca não vira desconto de diária');
    run("repLancamentos=function(){ return [{_id:'t1', tipo:'credito', data:'2026-09-29', motivo:'troca', volta:'2026-09-30', troca:{de:'2026-09-29', para:'2026-09-30'}}, {_id:'u1', tipo:'uso', data:'2026-09-30'}]; };");
    assert.strictEqual(run('repTrocasPendentes(PELUDINHOS[0])'), 0, 'cumprida: sai da conta');
  } finally { run('repLancamentos=__bkR3.l; repHojeISO=__bkR3.h; repDisponivel=__bkR3.d; repSaldo=__bkR3.s; dcMatriculado=__bkR3.dm; vagasDoDia=__bkR3.vd; zHojeISO=__bkR3.hz; diariaAvulsaCent=__bkR3.da; PELUDINHOS=__bkR3.P;'); }
});

// ================================================================== Banho fixo: o shampoo vai junto (25/set)
console.log('\nBanho fixo — qual shampoo, o nome e onde está vão para a planilha, a TV e a Hoje na Zêluz');
prova('o detalhe da planilha leva qual é, o nome e onde está — no MESMO formato do lançamento à mão', () => {
  const D = (br) => run('banhoRecDetalhe(' + JSON.stringify(br) + ')');
  assert.strictEqual(D({ sham: 'SHAMPOO', onde: 'NA RECEPÇÃO' }), ' (SHAMPOO · NA RECEPÇÃO)', 'sem qual/nome: igual ao de antes (harness v-48)');
  assert.strictEqual(D({ sham: 'SHAMPOO', tipo: 'MEDICAMENTOSO', nome: ' cloresten ', onde: 'NA BOLSA' }), ' (SHAMPOO · MEDICAMENTOSO · CLORESTEN · NA BOLSA)');
  assert.strictEqual(D({ sham: 'LOJA', tipo: 'HIPOALERGÊNICO', onde: 'NA LOJA' }), ' (LOJA · HIPOALERGÊNICO · NA LOJA)');
  assert.strictEqual(D({ sham: 'SEM SHAMPOO', tipo: 'MEDICAMENTOSO', nome: 'x', onde: 'NA BOLSA' }), ' (SEM SHAMPOO)', 'sem shampoo próprio, nada de qual/onde');
  run(`__bkS1={dd:DASH_DET}; DASH_DET={banho:{sham:'SHAMPOO', tipo:'MEDICAMENTOSO', nome:'cloresten', onde:'NA BOLSA'}};`);
  try {
    assert.strictEqual(run("dashDetTexto('banho')"), ' (SHAMPOO · MEDICAMENTOSO · CLORESTEN · NA BOLSA)', 'o lançamento à mão sai igual ao fixo');
    run(`DASH_DET={banho:{sham:'SHAMPOO', onde:'NA RECEPÇÃO'}};`);
    assert.strictEqual(run("dashDetTexto('banho')"), ' (SHAMPOO · NA RECEPÇÃO)', 'qual e nome são opcionais');
    assert.ok(run("DASH_SHAM_ONDE.some(function(o){ return o.v==='NA LOJA'; })"), '"aqui na loja" é um lugar');
  } finally { run('DASH_DET=__bkS1.dd;'); }
});
prova('a frase para quem desce com ele: "shampoo próprio medicamentoso Cloresten — está na bolsa"', () => {
  const F = (br) => run('banhoRecShampooFrase(' + JSON.stringify(br) + ')');
  assert.strictEqual(F({ sham: 'SHAMPOO', tipo: 'MEDICAMENTOSO', nome: 'Cloresten', onde: 'NA BOLSA' }), ' · shampoo próprio medicamentoso Cloresten — está na bolsa');
  assert.strictEqual(F({ sham: 'LOJA', onde: 'NA LOJA' }), ' · shampoo da loja — está aqui na loja');
  assert.strictEqual(F({ sham: 'SEM SHAMPOO' }), '', 'o da casa não precisa de aviso');
  assert.strictEqual(F(null), '');
});
prova('lançar o banho do dia: o shampoo gravado no banho fixo já vem marcado', () => {
  run(`__bkS2={dd:DASH_DET, si:DASH_SEL_I, P:PELUDINHOS, pe:pelExtra};
    PELUDINHOS=[{n:'Lana', tutor:'Bia'}]; DASH_SEL_I={banho:0}; DASH_DET={banho:{}};
    pelExtra=function(){ return {banho_rec:{ativo:true, freq:'semanal', dia:'qui', hora:'10:00', desde:'2026-10-01', sham:'SHAMPOO', tipo:'HIPOALERGÊNICO', nome:'Episoothe', onde:'NA BOLSA'}}; };`);
  try {
    run("banhoPreMarcarLanc('banho')");
    assert.deepStrictEqual(JSON.parse(JSON.stringify(run('DASH_DET.banho'))), { sham: 'SHAMPOO', tipo: 'HIPOALERGÊNICO', nome: 'Episoothe', onde: 'NA BOLSA' });
    run("DASH_DET={banho:{}}; pelExtra=function(){ return {}; }; banhoPreMarcarLanc('banho');");
    assert.deepStrictEqual(JSON.parse(JSON.stringify(run('DASH_DET.banho'))), {}, 'sem banho fixo, nada vem marcado');
  } finally { run('DASH_DET=__bkS2.dd; DASH_SEL_I=__bkS2.si; PELUDINHOS=__bkS2.P; pelExtra=__bkS2.pe;'); }
});
provaAsync('Banhos recorrentes: salvar grava qual e o nome (e "sem shampoo" apaga os dois)', async () => {
  run(`__bkS3={pd:banhosPelDe, pe:banhosPodeEditar, rl:banhosRenderLinha, sp:setPelExtra, au:audit, pc:banhoAutoPedirConferencia, rp:renderPel, ex:pelExtra};
    __sp=null; banhosPelDe=function(){ return {n:'Lana', tutor:'Bia'}; }; banhosPodeEditar=function(){ return true; };
    banhosRenderLinha=function(){}; audit=function(){}; banhoAutoPedirConferencia=function(){}; renderPel=function(){};
    pelExtra=function(){ return {}; };
    setPelExtra=function(p, patch){ __sp=JSON.parse(JSON.stringify(patch)); return Promise.resolve({ok:true}); };
    banhoRascCarregar();   /* o rascunho do aparelho é lido UMA vez — depois, o que a prova põe vale */
    BANHO_RASC['lana__bia']={ativo:true, freq:'semanal', dia:'qui', hora:'10:00', desde:'2026-10-01', sham:'SHAMPOO', onde:'NA LOJA', tipo:'', nome:'', obs:''};`);
  try {
    run("banhosSet('lana__bia','tipo','MEDICAMENTOSO'); banhosSet('lana__bia','nome','  Cloresten   2% ');");
    run("banhosSalvar('lana__bia')");
    for (let i = 0; i < 10; i++) await Promise.resolve();
    const br = JSON.parse(JSON.stringify(run('__sp'))).banho_rec;
    assert.strictEqual(br.tipo, 'MEDICAMENTOSO');
    assert.strictEqual(br.nome, 'Cloresten 2%');
    assert.strictEqual(br.onde, 'NA LOJA');
    run("BANHO_RASC['lana__bia']={ativo:true, freq:'semanal', dia:'qui', hora:'10:00', desde:'2026-10-01', sham:'SHAMPOO', onde:'NA BOLSA', tipo:'MEDICAMENTOSO', nome:'X', obs:''}; banhosSet('lana__bia','tipo','MEDICAMENTOSO');");
    assert.strictEqual(run("BANHO_RASC['lana__bia'].tipo"), '', 'tocar de novo no mesmo desmarca');
    run("banhosSet('lana__bia','sham','SEM SHAMPOO')");
    assert.deepStrictEqual([run("BANHO_RASC['lana__bia'].onde"), run("BANHO_RASC['lana__bia'].nome")], ['', '']);
  } finally { run("delete BANHO_RASC['lana__bia']; banhosPelDe=__bkS3.pd; banhosPodeEditar=__bkS3.pe; banhosRenderLinha=__bkS3.rl; setPelExtra=__bkS3.sp; audit=__bkS3.au; banhoAutoPedirConferencia=__bkS3.pc; renderPel=__bkS3.rp; pelExtra=__bkS3.ex;"); }
});

console.log('\nQA17 — o shampoo mudado chega à planilha dos dias já escritos; parêntese no nome; rascunho antigo');
provaAsync('QA17 F1 — mudou o shampoo: o automático troca a célula que ELE escreveu (e não toca na da pessoa)', async () => {
  run(`__bkF1={db:DB, pc:dashPonteChamar, ac:dashAutoCalcular, hz:zHojeISO, au:audit};
    __ch=[]; __planilha=['Lana/Spitz (SHAMPOO · NA RECEPÇÃO)']; __jaAuto={banho:['Lana/Spitz (SHAMPOO · NA RECEPÇÃO)']};
    zHojeISO=function(){ return '2026-09-25'; }; audit=function(){};
    DB={ref:function(p){ return { once:function(){ return Promise.resolve({val:function(){ return JSON.parse(JSON.stringify(__jaAuto)); }}); },
      set:function(){ return Promise.resolve(); }, update:function(){ return Promise.resolve(); } }; }};
    dashPonteChamar=function(d){ __ch.push(JSON.parse(JSON.stringify(d)));
      if(d.acao==='lerDia') return Promise.resolve({ok:true, conteudo:{Banho:__planilha.slice()}}); return Promise.resolve({ok:true}); };
    dashAutoCalcular=function(){ var o={}; Object.keys(DASH_AUTO_COLS).forEach(function(k){ o[k]=[]; });
      o.banho=['Lana/Spitz (SHAMPOO · MEDICAMENTOSO · CLORESTEN · NA BOLSA)']; o._horas={banho:{}};
      o._horas.banho[dashAutoNomeChave(o.banho[0])]='10:00'; return o; };`);
  try {
    await run("dashAutoSincronizar('2026-10-01')");
    for (let i = 0; i < 40; i++) await Promise.resolve();
    let ch = JSON.parse(JSON.stringify(run('__ch'))).filter((c) => c.acao !== 'lerDia');
    assert.deepStrictEqual(ch.map((c) => c.acao + ':' + c.valor), [
      'remover:Lana/Spitz (SHAMPOO · NA RECEPÇÃO)',
      'lancar:Lana/Spitz (SHAMPOO · MEDICAMENTOSO · CLORESTEN · NA BOLSA)'], JSON.stringify(ch));
    assert.strictEqual(ch[1].hora, '10:00');
    // a célula que uma PESSOA escreveu não é do automático: fica como está
    run("__ch=[]; __planilha=['Lana - Spitz']; __jaAuto={banho:[]};");
    await run("dashAutoSincronizar('2026-10-01')");
    for (let i = 0; i < 40; i++) await Promise.resolve();
    ch = JSON.parse(JSON.stringify(run('__ch'))).filter((c) => c.acao !== 'lerDia');
    assert.deepStrictEqual(ch, [], 'nada removido, nada duplicado');
  } finally { run('DB=__bkF1.db; dashPonteChamar=__bkF1.pc; dashAutoCalcular=__bkF1.ac; zHojeISO=__bkF1.hz; audit=__bkF1.au;'); }
});
provaAsync('QA18 — a planilha não deixou tirar a célula velha: ela continua no registro e a próxima conferência tenta de novo', async () => {
  run(`__bkG1={db:DB, pc:dashPonteChamar, ac:dashAutoCalcular, hz:zHojeISO, au:audit};
    __ch=[]; __reg=null; __falhaRem=true; __planilha=['Lana/Spitz (SHAMPOO · NA RECEPÇÃO)']; __jaAuto={banho:['Lana/Spitz (SHAMPOO · NA RECEPÇÃO)']};
    zHojeISO=function(){ return '2026-09-25'; }; audit=function(){};
    DB={ref:function(p){ return { once:function(){ return Promise.resolve({val:function(){ return JSON.parse(JSON.stringify(__jaAuto)); }}); },
      set:function(v){ __reg=JSON.parse(JSON.stringify(v)); return Promise.resolve(); }, update:function(){ return Promise.resolve(); } }; }};
    dashPonteChamar=function(d){ __ch.push(JSON.parse(JSON.stringify(d)));
      if(d.acao==='lerDia') return Promise.resolve({ok:true, conteudo:{Banho:__planilha.slice()}});
      if(d.acao==='remover' && __falhaRem) return Promise.resolve({ok:false, erro:'a ponte não respondeu'});
      return Promise.resolve({ok:true}); };
    dashAutoCalcular=function(){ var o={}; Object.keys(DASH_AUTO_COLS).forEach(function(k){ o[k]=[]; });
      o.banho=['Lana/Spitz (SHAMPOO · MEDICAMENTOSO · NA BOLSA)']; o._horas={banho:{}};
      o._horas.banho[dashAutoNomeChave(o.banho[0])]='10:00'; return o; };`);
  try {
    await run("dashAutoSincronizar('2026-10-01')");
    for (let i = 0; i < 40; i++) await Promise.resolve();
    const reg = JSON.parse(JSON.stringify(run('__reg')));
    assert.ok((reg.banho || []).indexOf('Lana/Spitz (SHAMPOO · NA RECEPÇÃO)') >= 0, 'o texto velho continua sendo dele: ' + JSON.stringify(reg.banho));
    assert.ok(!JSON.parse(JSON.stringify(run('__ch'))).some((c) => c.acao === 'lancar'), 'sem tirar a velha, não põe a nova (nada de duas células)');
    // a próxima conferência: agora a ponte deixa
    run("__ch=[]; __falhaRem=false; __jaAuto=__reg;");
    await run("dashAutoSincronizar('2026-10-01')");
    for (let i = 0; i < 40; i++) await Promise.resolve();
    const ch = JSON.parse(JSON.stringify(run('__ch'))).filter((c) => c.acao !== 'lerDia').map((c) => c.acao);
    assert.deepStrictEqual(ch, ['remover', 'lancar'], 'tentou de novo e acertou');
  } finally { run('DB=__bkG1.db; dashPonteChamar=__bkG1.pc; dashAutoCalcular=__bkG1.ac; zHojeISO=__bkG1.hz; audit=__bkG1.au;'); }
});
prova('QA18 — a baixa da hospedagem no dia da troca não "cumpre" a troca', () => {
  run(`__bkG2={l:repLancamentos, h:repHojeISO}; repHojeISO=function(){ return '2026-09-25'; };
    repLancamentos=function(){ return [{_id:'t1', tipo:'credito', data:'2026-09-29', motivo:'troca', volta:'2026-09-30', troca:{de:'2026-09-29', para:'2026-09-30'}},
      {_id:'orc-x-1', tipo:'uso', data:'2026-09-30', orcId:'x', motivo:'hospedagem'}]; };`);
  try {
    assert.strictEqual(run("repTrocasPendentes({n:'Billy Paul', tutor:'Juliana'})"), 1);
  } finally { run('repLancamentos=__bkG2.l; repHojeISO=__bkG2.h;'); }
});
prova('QA17 F2/F3 — parêntese no nome do shampoo vira espaço; rascunho de antes (sem qual/nome) não acusa alteração', () => {
  assert.strictEqual(run("banhoRecDetalhe({sham:'SHAMPOO', nome:'Episoothe (Virbac)', onde:'NA BOLSA'})"), ' (SHAMPOO · EPISOOTHE VIRBAC · NA BOLSA)');
  assert.strictEqual(run("dashDetTextoLimpo('Otomax (2x ao dia)')"), 'OTOMAX 2X AO DIA');
  run(`__bkF3={pe:pelExtra, P:PELUDINHOS}; PELUDINHOS=[{n:'Nick', tutor:'Cláudia'}];
    pelExtra=function(){ return {banho_rec:{ativo:true, freq:'semanal', dia:'qui', hora:'10:00', desde:'2026-10-01', sham:'SEM SHAMPOO', onde:'', obs:''}}; };
    banhoRascCarregar();
    BANHO_RASC[banhosChave(PELUDINHOS[0])]={ativo:true, freq:'semanal', dia:'qui', hora:'10:00', desde:'2026-10-01', sham:'SEM SHAMPOO', onde:'', obs:'', excecoes:{}};`);
  try {
    assert.ok(!/ainda não foi gravada/.test(run('banhosLinhaHTML(PELUDINHOS[0])')), 'o rascunho guardado antes da versão nova é o mesmo combinado');
  } finally { run('delete BANHO_RASC[banhosChave(PELUDINHOS[0])]; pelExtra=__bkF3.pe; PELUDINHOS=__bkF3.P;'); }
});

// ================================================================== Orçamento → Check-in (25/set)
console.log('\nOrçamentos de hospedagem — o cliente novo é reconhecido e quem chega aparece no Check-in');
prova('cliente novo (avulso) com check-in feito SAI de "Estadias fechadas" (o caso do Pingo)', () => {
  ctx.__o = { status: 'fechado', entrada: '2026-09-20', saida: '2026-09-27', tutor: 'Maria Luísa',
    pets: [{ key: 'avulso__pingo__maria luisa', nome: 'Pingo', tutor: 'Maria Luísa' }] };
  ctx.__E = { e1: { refKey: 'pingo__maria luísa', nome: 'Pingo', tutor: 'Maria Luísa', entrada: '2026-09-20', saida: '2026-09-25', status: 'finalizada' } };
  assert.strictEqual(run('orcCheckinFeitoNoOrcamento(__o, __E)'), true);
  assert.strictEqual(run("orcGrupoDe(__o, '2026-09-25', orcCheckinFeitoNoOrcamento(__o, __E))"), 3, 'desce para "Já hospedados / passadas"');
});
prova('xará de outro tutor NÃO conta como o mesmo FILHOt', () => {
  assert.strictEqual(run("orcMesmoPetEm({key:'avulso__pingo__maria luisa'}, {}, {key:'pingo__carla'}, {})"), false);
});
prova('QA M1 — o começo do nome do tutor vale só até o fim da palavra ("Maria" não é "Mariana")', () => {
  assert.strictEqual(run("orcMesmoPetEm({key:'avulso__thor__maria'}, {}, {key:'thor__mariana'}, {})"), false);
  assert.strictEqual(run("orcMesmoPetEm({key:'avulso__camus__ana'}, {}, {key:'camus__anabela'}, {})"), false);
  assert.strictEqual(run("orcMesmoPetEm({key:'pipoca__joao'}, {}, {key:'pipoca__joao francisco silva'}, {})"), true);
  assert.strictEqual(run("orcMesmoPetEm({key:'avulso__pingo__luciana'}, {}, {key:'pingo__luciana couto renno'}, {})"), true);
});
prova('QA B3 — tutor com ponto ou barra ("Ana C. Souza", "Ana/Pedro") continua sendo reconhecido', () => {
  assert.strictEqual(run("orcMesmoPetEm({key:'avulso__mel__ana c. souza'}, {}, {key:'mel__ana c- souza'}, {})"), true);
  assert.strictEqual(run("orcMesmoPetEm({key:'avulso__mel__ana/pedro'}, {}, {key:'mel__ana-pedro'}, {})"), true);
});
prova('Check-in mostra quem chega hoje pelos orçamentos fechados — e não quem já entrou, nem quem chega depois', () => {
  ctx.__L = {
    camus:   { status: 'fechado', entrada: '2026-09-25', saida: '2026-09-28', pets: [{ key: 'avulso__camus__ana', nome: 'Camus', tutor: 'Ana' }] },
    eliz:    { status: 'fechado', entrada: '2026-09-24', saida: '2026-09-30', pets: [{ key: 'elizabeth__rui', nome: 'Elizabeth', tutor: 'Rui' }] },
    pipoca:  { status: 'fechado', entrada: '2026-09-25', saida: '2026-09-26', pets: [{ key: 'pipoca__joao', nome: 'Pipoca', tutor: 'João' }] },
    depois:  { status: 'fechado', entrada: '2026-10-02', saida: '2026-10-05', pets: [{ key: 'luna__bia', nome: 'Luna', tutor: 'Bia' }] },
    aguard:  { status: 'aguardando', entrada: '2026-09-25', saida: '2026-09-27', pets: [{ key: 'bob__ze', nome: 'Bob', tutor: 'Zé' }] },
    acabou:  { status: 'fechado', entrada: '2026-09-20', saida: '2026-09-25', pets: [{ key: 'rex__lia', nome: 'Rex', tutor: 'Lia' }] },
  };
  ctx.__E = { e1: { refKey: 'pipoca__joao', nome: 'Pipoca', tutor: 'João', entrada: '2026-09-25', saida: '2026-09-26' } };
  const L = JSON.parse(JSON.stringify(run("orcChegamHoje(__L, __E, '2026-09-25')")));
  igual(L.map((x) => x.pet.nome), ['Elizabeth', 'Camus']);
  assert.strictEqual(L[0].atrasado, true, 'a Elizabeth devia ter entrado ontem: aparece com o aviso');
});

// ================================================================== Turma do dia (25/set)
console.log('\nTurma do dia — quem vem, quem avisou que não vem e o que cobrar');
prova('o Boris trocou a sexta pela quarta: na sexta ele está em "avisaram que não vêm"; na quarta, em "vêm"', () => {
  run(`__bkp={pd:pelDias, rl:repLancamentos, ra:repAgendaDe, pe:pelExtra, te:poTelDoTutor, rs:repSaldo, pi:pelInativo, mz:ehMoradorZeluz};
       pelDias=function(p){ return p.dias||[]; }; pelInativo=function(){ return false; }; ehMoradorZeluz=function(p){ return !!p.morador; };
       repLancamentos=function(p){ return p.lanc||[]; }; repAgendaDe=function(p){ return p.agenda||[]; };
       pelExtra=function(){ return {}; }; poTelDoTutor=function(){ return '+5531999990000'; }; repSaldo=function(p){ return p.saldo||0; };
       __P=[{n:'Boris', tutor:'Laura', dias:['sex']},
            {n:'Amora', tutor:'Rui', dias:['sex']},
            {n:'Lana',  tutor:'Bia', dias:['qua'], agenda:['2026-09-25'], saldo:1},
            {n:'Nick',  tutor:'Cláudia', dias:['seg']},
            {n:'Repolho', tutor:'Zêluz', dias:['sex'], morador:true}];
       __T={'2026-09-23':{}}; __T['2026-09-23'][pelKey(__P[0])]={de:'2026-09-25', para:'2026-09-23', status:'confirmada'};`);
  try {
    const sexta = JSON.parse(JSON.stringify(run("turmaListaDoDia('2026-09-25', {pets:__P, trocas:__T, avulsos:{}, chamada:{}, pend:[], margem:3, hoje:'2026-09-25'})")));
    assert.deepStrictEqual(sexta.vem.map((o) => o.nome), ['Amora', 'Lana'], 'Repolho mora aqui: não é turma');
    assert.strictEqual(sexta.vem[1].porque, 'reposição');
    assert.deepStrictEqual(sexta.naoVem.map((o) => o.nome), ['Boris']);
    assert.ok(/trocou para 23\/09/.test(sexta.naoVem[0].motivo), sexta.naoVem[0].motivo);
    const quarta = JSON.parse(JSON.stringify(run("turmaListaDoDia('2026-09-23', {pets:__P, trocas:__T, avulsos:{}, chamada:{}, pend:[], margem:3, hoje:'2026-09-23'})")));
    const b = quarta.vem.filter((o) => o.nome === 'Boris')[0];
    assert.ok(b && /troca/.test(b.porque), 'o Boris vem na quarta, por troca');
  } finally { run('pelDias=__bkp.pd; repLancamentos=__bkp.rl; repAgendaDe=__bkp.ra; pelExtra=__bkp.pe; poTelDoTutor=__bkp.te; repSaldo=__bkp.rs; pelInativo=__bkp.pi; ehMoradorZeluz=__bkp.mz;'); }
});
prova('falta avisada tira da turma e diz o motivo; o que ficou pendente de outro dia aparece para cobrar', () => {
  run(`__bkp={pd:pelDias, rl:repLancamentos, ra:repAgendaDe, pe:pelExtra, te:poTelDoTutor, rs:repSaldo, pi:pelInativo, mz:ehMoradorZeluz};
       pelDias=function(p){ return p.dias||[]; }; pelInativo=function(){ return false; }; ehMoradorZeluz=function(){ return false; };
       repLancamentos=function(p){ return p.lanc||[]; }; repAgendaDe=function(){ return []; };
       pelExtra=function(){ return {}; }; poTelDoTutor=function(){ return ''; }; repSaldo=function(){ return 0; };
       __P=[{n:'Tico', tutor:'Joana', dias:['sex'], lanc:[{_id:'c1', tipo:'credito', data:'2026-09-25', motivo:'viagem', volta:'2026-09-29'}]},
            {n:'Mel', tutor:'Ana', dias:['sex']}];
       __PEND=[{chave:dcKey('Mel','Ana'), item:'vermifugo', valor:'Vermífugo', dia:'2026-09-22'}];`);
  try {
    const r = JSON.parse(JSON.stringify(run("turmaListaDoDia('2026-09-25', {pets:__P, trocas:{}, avulsos:{}, chamada:{}, pend:__PEND, margem:3, hoje:'2026-09-25'})")));
    assert.deepStrictEqual(r.naoVem.map((o) => o.nome), ['Tico']);
    assert.ok(/falta avisada — Tutor viajou · repõe em 29\/09/.test(r.naoVem[0].motivo), r.naoVem[0].motivo);
    assert.deepStrictEqual(r.vem[0].pendentes, ['Vermífugo (de 22/09)']);
  } finally { run('pelDias=__bkp.pd; repLancamentos=__bkp.rl; repAgendaDe=__bkp.ra; pelExtra=__bkp.pe; poTelDoTutor=__bkp.te; repSaldo=__bkp.rs; pelInativo=__bkp.pi; ehMoradorZeluz=__bkp.mz;'); }
});
prova('a próxima ocorrência do dia: numa sexta, "Sexta" é hoje e "Segunda" é a que vem', () => {
  assert.strictEqual(run("turmaIsoDoDia('sex', '2026-09-25')"), '2026-09-25');
  assert.strictEqual(run("turmaIsoDoDia('seg', '2026-09-25')"), '2026-09-28');
});

// ================================================================== WhatsApp em um toque (25/set)
console.log('\nWhatsApp em um toque — abre a conversa do tutor e já marca "Mandei"');
prova('o link leva o número do tutor (com o 55) e a mensagem', () => {
  assert.strictEqual(run("zWhatsLink('+55 (31) 99999-0000', 'Oi, Ana')"), 'https://wa.me/5531999990000?text=Oi%2C%20Ana');
  assert.strictEqual(run("zWhatsLink('31999990000', 'x')"), 'https://wa.me/5531999990000?text=x', 'sem o país: o 55 entra');
  assert.strictEqual(run("zWhatsLink('', 'x')"), 'https://wa.me/?text=x', 'sem telefone: o WhatsApp abre para escolher o contato');
});
prova('"Mandar no WhatsApp" dos Vencimentos abre a conversa com o texto da caixa e marca "Mandei"', () => {
  run(`__bkp={ge:document.getElementById, va:vencAchar, vm:vencMandei, wo:window.open};
       __abriu=null; __marcou=null;
       document.getElementById=function(id){ return id==='vencMsg_thor__bia__vacina'?{value:'Oi, Bia! A vacina…'}:null; };
       vencAchar=function(){ return {tel:'+5531988887777', nome:'Thor'}; };
       vencMandei=function(c,t){ __marcou=c+'|'+t; };
       window.open=function(u){ __abriu=u; return {}; };`);
  try {
    run("vencWhats('thor__bia','vacina')");
    assert.ok(/^https:\/\/wa\.me\/5531988887777\?text=Oi%2C%20Bia/.test(run('__abriu')), run('__abriu'));
    assert.strictEqual(run('__marcou'), 'thor__bia|vacina');
  } finally { run('document.getElementById=__bkp.ge; vencAchar=__bkp.va; vencMandei=__bkp.vm; window.open=__bkp.wo;'); }
});

// ================================================================== Está aqui hoje e está atrasado (25/set)
console.log('\nEstá aqui hoje e está atrasado — "podemos fazer hoje?"');
const ATRAS_BKP = "__bkp={pv:proximaVindaDe, cfg:VENC_CFG}; proximaVindaDe=function(){ return '2026-09-29'; }; VENC_CFG={};";
const ATRAS_VOLTA = 'proximaVindaDe=__bkp.pv; VENC_CFG=__bkp.cfg;';
const ksAnt = (expr) => JSON.parse(JSON.stringify(run(expr))).itens.map((x) => x.k).sort().join(',');
prova('o carrapaticida que JÁ venceu, com ela na casa, vira a pergunta "fazer hoje"', () => {
  run(ATRAS_BKP);
  try {
    assert.strictEqual(ksAnt("hojeAntecipar({ecto_p:'2026-09-01'}, {n:'Mel', tutor:'Ana'}, '2026-09-24')"), 'ecto_p');
    assert.strictEqual(ksAnt("hojeAntecipar({verm_p:'2026-09-24'}, {n:'Mel', tutor:'Ana'}, '2026-09-24')"), 'verm_p', 'vence hoje também');
  } finally { run(ATRAS_VOLTA); }
});
prova('a mensagem da véspera já saiu (ou foi respondida) para hoje: não pergunta de novo', () => {
  run(ATRAS_BKP);
  try {
    assert.strictEqual(ksAnt("hojeAntecipar({ecto_p:'2026-09-01'}, {n:'Mel'}, '2026-09-24', {enviadas:{antip:{quem:'x', ts:1}}})"), '');
    assert.strictEqual(ksAnt("hojeAntecipar({ecto_p:'2026-09-01'}, {n:'Mel'}, '2026-09-24', {respostas:{antip:{v:'nao', quem:'x', ts:1}}})"), '');
    assert.strictEqual(ksAnt("hojeAntecipar({ecto_p:'2026-09-01'}, {n:'Mel'}, '2026-09-24', {enviadas:{vacina:{quem:'x', ts:1}}})"), 'ecto_p',
      'a véspera falou de OUTRO assunto: este continua sendo perguntado');
  } finally { run(ATRAS_VOLTA); }
});
prova('vacina vencida só vira pergunta em dia de Veterinária (quinta não; sexta sim)', () => {
  run(ATRAS_BKP);
  try {
    assert.strictEqual(ksAnt("hojeAntecipar({vac_raiva_p:'2026-09-01'}, {n:'Mel'}, '2026-09-24')"), '', 'quinta');
    assert.strictEqual(ksAnt("hojeAntecipar({vac_raiva_p:'2026-09-01'}, {n:'Mel'}, '2026-09-25')"), 'vac_raiva_p', 'sexta');
  } finally { run(ATRAS_VOLTA); }
});
prova('a mensagem do atrasado diz cada item com a data dele e pede para fazer hoje', () => {
  run(ATRAS_BKP);
  try {
    const o = "{nome:'Mel', tutor:'Ana Souza', sexo:'Fêmea', itens:[{k:'ecto_p', nome:'Carrapaticida', vence:'2026-09-01', atrasado:true},{k:'col_p', nome:'Coleira', marca:'Seresto', vence:'2026-09-27', atrasado:false}]}";
    const m = run('hojeMsgAntecipar(' + o + ", 'antip', '2026-09-24')");
    assert.ok(/^Olá, Ana, tudo bem\?/.test(m), m);
    assert.ok(m.indexOf('Aproveitando que a Mel está conosco hoje: o carrapaticida venceu em 01/09 e a coleira') > 0, m);
    assert.ok(/vence em 27\/09\./.test(m), 'o item que ainda não venceu não finge estar atrasado: ' + m);
    assert.ok(/O ideal é aproveitar e fazer hoje mesmo\. Podemos\?/.test(m), m);
    assert.ok(!/O prazo já chegou/.test(m), 'mensagem mista não generaliza o prazo (QA)');
    const f = run('hojeFraseAntecipar(' + o + ", {itens:" + o + ".itens}, '2026-09-24')");
    assert.ok(/— ela está aqui hoje: fazer hoje\?$/.test(f), f);
    // o que só vence DEPOIS continua com a pergunta de antes (antecipar)
    const m2 = run("hojeMsgAntecipar({nome:'Mel', tutor:'Ana', sexo:'F', itens:[{k:'ecto_p', nome:'Carrapaticida', vence:'2026-09-26', atrasado:false}]}, 'antip', '2026-09-24')");
    assert.ok(/Podemos fazer hoje de uma vez\?/.test(m2) && !/O ideal é aproveitar/.test(m2), m2);
  } finally { run(ATRAS_VOLTA); }
});
prova('"Mandar no WhatsApp" direto (sem abrir a dobra) abre a conversa e marca que saiu', () => {
  run(`__bkp2={oa:hojeObjAnt, hm:hojeMandei, wo:window.open, cfg:VENC_CFG}; VENC_CFG={};
       __abriu=null; __marcou=null;
       hojeObjAnt=function(){ return {chave:'mel__ana', nome:'Mel', tutor:'Ana', sexo:'F', tel:'31977776666',
         itens:[{k:'verm_p', nome:'Vermífugo', vence:'2026-09-20', atrasado:true}]}; };
       hojeMandei=function(c,t){ __marcou=c+'|'+t; };
       window.open=function(u){ __abriu=u; return {}; };`);
  try {
    run("hojeWhatsDireto('mel__ana','antip')");
    assert.ok(/^https:\/\/wa\.me\/5531977776666\?text=Ol%C3%A1%2C%20Ana/.test(run('__abriu')), run('__abriu'));
    assert.ok(/venceu%20em/.test(run('__abriu')));
    assert.strictEqual(run('__marcou'), 'mel__ana|antip');
  } finally { run('hojeObjAnt=__bkp2.oa; hojeMandei=__bkp2.hm; window.open=__bkp2.wo; VENC_CFG=__bkp2.cfg;'); }
});

// ================================================================== Quem chamar hoje (25/set)
console.log('\nQuem chamar hoje — uma lista só, um toque por linha');
const CT_BKP = `__bk={hl:hojeLista, vl:vencLista, pd:proximoDiaDayCare, vp:VENC_PEND, vr:VENC_REG, vrd:VENC_REG_DIA, hz:zHojeISO, pl:PELUDINHOS, cfg:VENC_CFG};
  zHojeISO=function(){ return '2026-09-24'; };
  proximoDiaDayCare=function(){ return '2026-09-25'; };
  PELUDINHOS=[{n:'x'}]; VENC_REG=null; VENC_REG_DIA=''; VENC_CFG={};
  __MEL={chave:'mel__ana', nome:'Mel', tutor:'Ana', tel:'31999990000', sexo:'F', antReg:{},
    antGrupos:[{tipo:'antip', itens:[{k:'ecto_p', nome:'Carrapaticida', vence:'2026-09-01', atrasado:true}]}],
    antec:[{k:'ecto_p', nome:'Carrapaticida', vence:'2026-09-01', atrasado:true}]};
  hojeLista=function(){ return [__MEL]; };
  vencLista=function(){ return [
    {chave:'mel__ana', nome:'Mel', tutor:'Ana', tel:'31999990000', sexo:'F', itens:[{k:'ecto_p', nome:'Carrapaticida', vence:'2026-09-01', atrasado:true}]},
    {chave:'thor__bia', nome:'Thor', tutor:'Bia', tel:'', sexo:'M', itens:[{k:'verm_p', nome:'Vermífugo', vence:'2026-09-26', atrasado:false}]}]; };`;
const CT_VOLTA = 'hojeLista=__bk.hl; vencLista=__bk.vl; proximoDiaDayCare=__bk.pd; VENC_PEND=__bk.vp; VENC_REG=__bk.vr; VENC_REG_DIA=__bk.vrd; zHojeISO=__bk.hz; PELUDINHOS=__bk.pl; VENC_CFG=__bk.cfg;';
const AGORA = Date.UTC(2026, 8, 24, 18, 0, 0);
prova('na casa com atrasado entra em "aqui"; o MESMO assunto não se repete na mensagem do próximo dia', () => {
  run(CT_BKP + "VENC_PEND={'2026-09-24':{}, '2026-09-25':{}};");
  try {
    const d = JSON.parse(JSON.stringify(run('contatosDados(' + AGORA + ')')));
    assert.deepStrictEqual(d.aqui.map((x) => x.chave + '|' + x.tipo), ['mel__ana|antip']);
    assert.ok(d.aqui[0].atrasado && /está aqui hoje: fazer hoje\?$/.test(d.aqui[0].frase), d.aqui[0].frase);
    assert.deepStrictEqual(d.amanha.map((x) => x.chave + '|' + x.tipo), ['thor__bia|antip'], 'a Mel não recebe duas vezes o mesmo pedido');
    assert.strictEqual(d.dia, '2026-09-25');
  } finally { run(CT_VOLTA); }
});
prova('a pergunta de hoje já saiu: a Mel sai de "aqui" e continua fora do próximo dia', () => {
  run(CT_BKP + `VENC_PEND={'2026-09-24':{'mel__ana':{enviadas:{ant_antip:{quem:'x', ts:${AGORA - 3600000}}}}}, '2026-09-25':{}};
    __MEL.antReg=VENC_PEND['2026-09-24']['mel__ana'];`);
  try {
    const d = JSON.parse(JSON.stringify(run('contatosDados(' + AGORA + ')')));
    assert.strictEqual(d.aqui.length, 0);
    assert.deepStrictEqual(d.amanha.map((x) => x.chave), ['thor__bia']);
    assert.strictEqual(d.aguardando, 1, 'a pergunta de hoje espera resposta dentro do prazo');
  } finally { run(CT_VOLTA); }
});
prova('mensagem do próximo dia já mandada sai da lista; a que passou do prazo vai para "cobrar"', () => {
  run(CT_BKP + `VENC_PEND={'2026-09-22':{'lua__rita':{pet:'Lua', tutor:'Rita', enviadas:{vacina:{quem:'x', ts:${AGORA - 3 * 86400000}}}}},
                 '2026-09-25':{'thor__bia':{enviadas:{antip:{quem:'x', ts:${AGORA - 600000}}}}}};`);
  try {
    const d = JSON.parse(JSON.stringify(run('contatosDados(' + AGORA + ')')));
    assert.deepStrictEqual(d.amanha.map((x) => x.chave), [], 'o Thor já recebeu a mensagem do próximo dia');
    assert.deepStrictEqual(d.cobrar.map((x) => x.nome + '|' + x.tipo + '|' + x.dia), ['Lua|vacina|2026-09-22']);
  } finally { run(CT_VOLTA); }
});
prova('o cartão do próximo dia avisa que HOJE o assunto já foi perguntado (e o "msg_enviada" antigo não conta)', () => {
  run(CT_BKP + `VENC_PEND={'2026-09-24':{'mel__ana':{respostas:{ant_antip:{v:'nao', quem:'x', ts:1}}}, 'thor__bia':{msg_enviada:{quem:'x', ts:1}}}};`);
  try {
    assert.ok(/já foi perguntado ao tutor/.test(run("vencJaPerguntadoHojeHTML('mel__ana','antip','2026-09-25','2026-09-24')")));
    assert.strictEqual(run("vencJaPerguntadoHoje('thor__bia','antip','2026-09-25','2026-09-24')"), null);
    assert.ok(run("vencJaPerguntadoHoje('mel__ana','antip','2026-09-24','2026-09-24')"), 'QA M1 — o cartão do PRÓPRIO dia também avisa');
  } finally { run(CT_VOLTA); }
});
prova('"Mandar no WhatsApp" do próximo dia grava no PRÓXIMO DIA — não no dia que a tela de Vencimentos tem aberto', () => {
  run(CT_BKP + `VENC_PEND={}; __bk2={vg:vencGravar, wo:window.open, sel:VENC_DIA_SEL};
    VENC_DIA_SEL='2026-09-29';
    __grav=null; __abriu=null;
    vencGravar=function(chave, patch, txt, o, dia){ __grav={chave:chave, dia:dia, tipo:patch.msg_enviada.tipo, env:Object.keys(patch.enviadas)}; return Promise.resolve(true); };
    window.open=function(u){ __abriu=u; return {}; };`);
  try {
    run("vencWhatsNoDia('thor__bia','antip','2026-09-25')");
    const g = JSON.parse(JSON.stringify(run('__grav')));
    assert.deepStrictEqual(g, { chave: 'thor__bia', dia: '2026-09-25', tipo: 'antip', env: ['antip'] });
    assert.ok(/^https:\/\/wa\.me\/\?text=/.test(run('__abriu')), 'sem telefone: abre para escolher o contato');
  } finally { run(CT_VOLTA + 'vencGravar=__bk2.vg; window.open=__bk2.wo; VENC_DIA_SEL=__bk2.sel;'); }
});

// ================================================================== Check-in da hospedagem no celular (25/set)
console.log('\nCheck-in da hospedagem — pertences sem digitar');
prova('a cor num toque concorda com o item (coleira vermelha, peitoral vermelho)', () => {
  assert.strictEqual(run("ciPertFem('Coleira')"), true);
  assert.strictEqual(run("ciPertFem('Bolsa / mala')"), true);
  assert.strictEqual(run("ciPertFem('Peitoral')"), false);
  assert.strictEqual(run("ciPertFem('Pote')"), false);
  const fem = run("ciPertCorHTML({uid:'a', k:'coleira', nome:'Coleira', spec:''})");
  assert.ok(/>vermelha</.test(fem) && !/>vermelho</.test(fem), 'coleira: feminino');
  const masc = run("ciPertCorHTML({uid:'b', k:'peitoral', nome:'Peitoral', spec:''})");
  assert.ok(/>vermelho</.test(masc) && !/>vermelha</.test(masc), 'peitoral: masculino');
  assert.strictEqual(run("ciPertCorHTML({uid:'c', k:'racao', nome:'Ração', spec:''})"), '', 'ração: a marca importa, não a cor');
});
prova('trocar a cor mexe só na cor: o resto do que foi escrito fica', () => {
  assert.strictEqual(run("ciPertComCor('', 'vermelha')"), 'vermelha');
  assert.strictEqual(run("ciPertComCor('Zeedog', 'vermelha')"), 'vermelha Zeedog');
  assert.strictEqual(run("ciPertComCor('vermelha Zeedog', 'azul')"), 'azul Zeedog', 'cor + marca: o formato do próprio seletor');
  assert.strictEqual(run("ciPertComCor('Azul-Marinho Zeedog', 'preto')"), 'preto Zeedog', 'cor composta sai inteira');
  assert.strictEqual(run("ciPertComCor('vermelha Zeedog', '')"), 'Zeedog', 'tirar a cor');
  assert.ok(/value="azul" selected/.test(run("ciPertCorHTML({uid:'a', k:'coleira', nome:'Coleira', spec:'azul Zeedog'})")), 'a cor escrita aparece marcada');
});
prova('QA M4 — o que a Consultora escreveu à mão nunca é apagado nem estragado pela cor', () => {
  [['rosa choque', 'azul', 'azul rosa choque'], ['preto e branco', 'azul', 'azul preto e branco'],
   ['Verde água', 'azul', 'azul Verde água'], ['laranja de pelúcia', 'azul', 'azul laranja de pelúcia'],
   ['xadrez vermelho', 'azul', 'azul xadrez vermelho'], ['rosa choque', '', 'rosa choque']]
    .forEach(([spec, cor, esperado]) => assert.strictEqual(run('ciPertComCor(' + JSON.stringify(spec) + ',' + JSON.stringify(cor) + ')'), esperado, spec));
  // acento decomposto (NFD) não corta no meio da letra
  assert.strictEqual(run('ciPertComCor(' + JSON.stringify('Ro\u0301sa Zeedog') + ", 'azul')"), 'azul Zeedog');
  // o seletor põe, depois troca: só a cor que ELE pôs é trocada
  run("__pc={uid:'z', k:'coleira', nome:'Coleira', spec:'rosa choque'};");
  assert.strictEqual(run('ciPertCorAtual(__pc)'), '', 'texto à mão: o seletor começa em "cor…"');
  run("__pc.spec=ciPertComCor(__pc.spec, 'azul', ciPertCorAtual(__pc)); __pc.corSel='azul';");
  run("__pc.spec=ciPertComCor(__pc.spec, 'preta', ciPertCorAtual(__pc)); __pc.corSel='preta';");
  assert.strictEqual(run('__pc.spec'), 'preta rosa choque');
});
prova('QA B1 — gênero e plural dos itens novos do banco', () => {
  const html = (nome) => run("ciPertCorHTML({uid:'a', k:'x', nome:" + JSON.stringify(nome) + ", spec:''})");
  assert.ok(/>vermelho</.test(html('Pijama')) && !/>vermelha</.test(html('Pijama')), 'pijama: masculino');
  assert.ok(/>vermelha</.test(html('Rede')), 'rede: feminino');
  assert.ok(/>vermelhas</.test(html('Meias')) && />vermelhas</.test(html('Botinhas')), 'meias, botinhas: feminino plural');
  assert.ok(/>vermelho</.test(html('Pijaminha')) && !/>vermelha</.test(html('Pijaminha')), 'pijaminha: masculino');
  assert.ok(/>azuis</.test(html('Brinquedos')) && />vermelhos</.test(html('Brinquedos')), 'brinquedos: masculino plural');
});
provaAsync('QA A1 — a aba Com o tutor NÃO entra em laço quando a primeira leitura ainda está em curso', async () => {
  run(`__bk7={vp:VENC_PEND, vpl:VENC_PEND_LENDO, pa:PEND_ABERTAS, db:DB, ge:document.getElementById, pc:pendCarregar, st:setTimeout};
    __renders=0; __root={innerHTML:''}; __sec={classList:{contains:function(){ return true; }}};
    VENC_PEND=null; VENC_PEND_LENDO=true; PEND_ABERTAS=null;
    DB={ref:function(){ return {}; }};
    pendCarregar=function(){ return Promise.resolve(null); };
    setTimeout=function(){ return 0; };   // as novas tentativas espaçadas não correm aqui
    document.getElementById=function(id){ if(id==='fichaTutorRoot'){ __renders++; return __root; } if(id==='ps-tutor') return __sec; return null; };
    pelAtual={n:'Mel', tutor:'Ana'};`);
  try {
    run('fichaTutorRender(true)');
    for (let i = 0; i < 50; i++) await Promise.resolve();
    const n = run('__renders');
    assert.ok(n <= 6, 'redesenhos: ' + n);
  } finally { run('VENC_PEND=__bk7.vp; VENC_PEND_LENDO=__bk7.vpl; PEND_ABERTAS=__bk7.pa; DB=__bk7.db; document.getElementById=__bk7.ge; pendCarregar=__bk7.pc; setTimeout=__bk7.st; pelAtual=null;'); }
});

// ================================================================== Ficha única: Com o tutor (25/set)
console.log('\nFicha única — "Com o tutor": nada se perde');
prova('a ficha única junta ficha, pendências e cada conversa (quem mandou, o que respondeu, cobranças)', () => {
  run(`__bk3={vp:VENC_PEND, pa:PEND_ABERTAS, hz:zHojeISO, pe:pelExtra, te:poTelDoTutor};
    zHojeISO=function(){ return '2026-09-24'; };
    pelExtra=function(){ return {ecto_p:'2026-09-01', verm_p:'2026-12-01'}; };
    poTelDoTutor=function(){ return '31999990000'; };
    __K=dcKey('Mel','Ana');
    VENC_PEND={}; VENC_PEND['2026-09-20']={}; VENC_PEND['2026-09-20'][__K]={pet:'Mel', tutor:'Ana',
      enviadas:{antip:{quem:'Bia', ts:${Date.UTC(2026, 8, 19, 17)}}},
      respostas:{antip:{v:'nao', quem:'Bia', ts:${Date.UTC(2026, 8, 19, 20)}}}};
    VENC_PEND['2026-09-24']={}; VENC_PEND['2026-09-24'][__K]={pet:'Mel', tutor:'Ana',
      enviadas:{ant_antip:{quem:'Caio', ts:${Date.UTC(2026, 8, 22, 12)}}}, cobrancas:{ant_antip:[{quem:'Caio', ts:1}]}};
    PEND_ABERTAS={}; PEND_ABERTAS[__K]={vermifugo:{status:'aberta', dia:'2026-09-22'}};`);
  try {
    const d = JSON.parse(JSON.stringify(run("fichaUnicaDados({n:'Mel', tutor:'Ana', sexo:'F'}, " + Date.UTC(2026, 8, 24, 18) + ')')));
    assert.strictEqual(d.filhot.tel, '31999990000');
    assert.deepStrictEqual(d.ficha.filter((x) => !x.sem_registro).map((x) => x.k + (x.atrasado ? '!' : '')), ['ecto_p!'], 'com data, só o que venceu (o vermífugo de dezembro não)');
    assert.ok(d.ficha.some((x) => x.sem_registro && x.k === 'vac_raiva_p'), 'o que nunca foi registrado também é da ficha única');
    assert.deepStrictEqual(d.pendencias.map((x) => x.item + '@' + x.dia), ['vermifugo@2026-09-22']);
    assert.deepStrictEqual(d.conversas.map((x) => x.dia + '|' + x.tipo), ['2026-09-24|ant_antip', '2026-09-20|antip'], 'da mais nova para a mais antiga');
    assert.strictEqual(d.conversas[0].antecipado, true);
    assert.strictEqual(d.conversas[0].cobrancas, 1);
    assert.strictEqual(d.conversas[1].resposta.quem, 'Bia');
    assert.strictEqual(d.conversas[1].resposta.rotulo, run("vencRespRotulo('nao')"), 'a resposta sai com o rótulo da tela');
    assert.ok(d.conversas[1].resposta.rotulo !== 'nao', 'o rótulo, não o valor cru (QA B7)');
    assert.deepStrictEqual(d.esperando.map((x) => x.tipo), ['ant_antip'], 'a de hoje espera resposta; a de 20/09 foi respondida');
    assert.ok(/1 item vencido · 1 conversa sem resposta · 1 pendência de outro dia/.test(run("fichaTutorLinhaHTML({n:'Mel', tutor:'Ana'})")));
  } finally { run('VENC_PEND=__bk3.vp; PEND_ABERTAS=__bk3.pa; zHojeISO=__bk3.hz; pelExtra=__bk3.pe; poTelDoTutor=__bk3.te;'); }
});
prova('sem as leituras em mão, a ficha única diz "não li" — nunca "nada"', () => {
  run(`__bk3={vp:VENC_PEND, pa:PEND_ABERTAS}; VENC_PEND=null; PEND_ABERTAS=null;`);
  try {
    const d = JSON.parse(JSON.stringify(run("fichaUnicaDados({n:'Mel', tutor:'Ana'})")));
    assert.deepStrictEqual(d.lido, { conversas: false, pendencias: false });
    assert.strictEqual(d.conversas.length + d.pendencias.length, 0);
  } finally { run('VENC_PEND=__bk3.vp; PEND_ABERTAS=__bk3.pa;'); }
});

// ================================================================== QA da 5ª rodada (25/set)
console.log('\nQA da 5ª rodada — Quem chamar hoje, WhatsApp e Turma');
prova('QA A2 — gravar relê o mapa do banco: o "Mandei" da vacina feito em outro aparelho não some', () => {
  // O banco já tem a vacina (outro aparelho); a memória deste aparelho não sabe.
  const r = JSON.parse(JSON.stringify(run(`vencMesclarMapa({vacina:{quem:'A', ts:10}}, {}, {antip:{quem:'B', ts:20}})`)));
  assert.deepStrictEqual(Object.keys(r).sort(), ['antip', 'vacina']);
  // desfazer (o assunto sai do mapa novo) continua tirando só ele
  const d = JSON.parse(JSON.stringify(run(`vencMesclarMapa({vacina:{v:'sim'}, antip:{v:'nao'}}, {vacina:{v:'sim'}, antip:{v:'nao'}}, {vacina:{v:'sim'}})`)));
  assert.deepStrictEqual(Object.keys(d), ['vacina']);
  // o que este aparelho não mexeu fica como o banco diz (mesmo que a memória esteja velha)
  const v = JSON.parse(JSON.stringify(run(`vencMesclarMapa({vacina:{v:'sim', ts:9}}, {vacina:{v:'nao', ts:1}}, {vacina:{v:'nao', ts:1}, antip:{v:'x'}})`)));
  assert.strictEqual(v.vacina.v, 'sim');
});
provaAsync('QA A2 — vencGravar grava o mapa relido do banco somado ao assunto deste toque', async () => {
  run(`__bk5={db:DB, vr:VENC_REG, vrd:VENC_REG_DIA, vp:VENC_PEND, au:audit, vre:vencRender, vrq:vencRedesenharQuadros};
    __loja={'daycare/vencimentos/2026-09-28/thor__bia/enviadas':{vacina:{quem:'A', ts:10}}};
    __upd=null;
    DB={ref:function(p){ return {
      once:function(){ return Promise.resolve({val:function(){ return __loja[p]===undefined?null:__loja[p]; }}); },
      update:function(v){ __upd={p:p, v:v}; return Promise.resolve(); } }; }};
    VENC_REG={}; VENC_REG_DIA='2026-09-28'; VENC_PEND=null;
    audit=function(){}; vencRender=function(){}; vencRedesenharQuadros=function(){};`);
  try {
    const ok = await run(`vencGravar('thor__bia', {enviadas:{antip:{quem:'B', ts:20}}}, 'teste', {nome:'Thor', tutor:'Bia', itens:[]}, '2026-09-28')`);
    assert.strictEqual(ok, true);
    const u = JSON.parse(JSON.stringify(run('__upd')));
    assert.strictEqual(u.p, 'daycare/vencimentos/2026-09-28/thor__bia');
    assert.deepStrictEqual(Object.keys(u.v.enviadas).sort(), ['antip', 'vacina'], 'a vacina do outro aparelho continua lá');
    assert.deepStrictEqual(Object.keys(JSON.parse(JSON.stringify(run("VENC_REG['thor__bia'].enviadas")))).sort(), ['antip', 'vacina'], 'e a memória aprende');
  } finally { run('DB=__bk5.db; VENC_REG=__bk5.vr; VENC_REG_DIA=__bk5.vrd; VENC_PEND=__bk5.vp; audit=__bk5.au; vencRender=__bk5.vre; vencRedesenharQuadros=__bk5.vrq;'); }
});
prova('QA M1 — a pergunta de hoje já saiu: a mensagem do dia mandada depois não a faz sumir', () => {
  assert.strictEqual(run("hojeVesperaTratou({enviadas:{ant_antip:{ts:1}, antip:{ts:2}}}, 'antip')"), false);
  assert.strictEqual(run("hojeVesperaTratou({enviadas:{antip:{ts:2}}}, 'antip')"), true, 'sem a pergunta de hoje, a véspera manda');
});
prova('QA M2 — a cobrança da conversa velha sai quando o mesmo assunto está numa pergunta nova', () => {
  run(CT_BKP + `VENC_PEND={'2026-09-23':{'mel__ana':{pet:'Mel', tutor:'Ana', enviadas:{ant_antip:{quem:'x', ts:${AGORA - 30 * 3600000}}}}},
                 '2026-09-24':{}, '2026-09-25':{}};`);
  try {
    const d = JSON.parse(JSON.stringify(run('contatosDados(' + AGORA + ')')));
    assert.deepStrictEqual(d.aqui.map((x) => x.chave), ['mel__ana']);
    assert.deepStrictEqual(d.cobrar.map((x) => x.chave), [], 'a Mel não recebe a cobrança de ontem e a pergunta de hoje');
  } finally { run(CT_VOLTA); }
});
prova('QA M5 — janela do WhatsApp bloqueada: nada é marcado como mandado', () => {
  run(`__bk6={wo:window.open, al:alert, hm:hojeMandei, ge:document.getElementById};
    __marcou=null; __avisou=null;
    window.open=function(){ return null; }; alert=function(t){ __avisou=t; };
    hojeMandei=function(c,t){ __marcou=c; };
    document.getElementById=function(){ return {value:'Oi'}; };`);
  try {
    assert.strictEqual(run("zWhatsAbrir('31999990000','Oi')"), false);
    run("hojeWhats('mel__ana','antip','31999990000')");
    assert.strictEqual(run('__marcou'), null);
    assert.ok(/bloqueada/.test(run('__avisou')));
  } finally { run('window.open=__bk6.wo; alert=__bk6.al; hojeMandei=__bk6.hm; document.getElementById=__bk6.ge;'); }
});
prova('Turma do dia — troca ainda PEDIDA (sem o sim da Gestora) não muda a turma', () => {
  run(`__bkt={pd:pelDias, rl:repLancamentos, ra:repAgendaDe, pe:pelExtra, pi:pelInativo, mz:ehMoradorZeluz};
       pelDias=function(p){ return p.dias||[]; }; pelInativo=function(){ return false; }; ehMoradorZeluz=function(){ return false; };
       repLancamentos=function(){ return []; }; repAgendaDe=function(){ return []; }; pelExtra=function(){ return {}; };`);
  try {
    const f = "{pets:[{n:'Boris', tutor:'Laura', dias:['sex']}], trocas:{'2026-09-23':{'boris__laura':{de:'2026-09-25', para:'2026-09-23', status:'pedido'}}}, avulsos:{}, chamada:{}, pend:[], margem:3, hoje:'2026-09-21'}";
    const sex = JSON.parse(JSON.stringify(run("turmaListaDoDia('2026-09-25', " + f + ')')));
    assert.deepStrictEqual(sex.vem.map((o) => o.nome), ['Boris'], 'pedida: continua vindo na sexta');
    const qua = JSON.parse(JSON.stringify(run("turmaListaDoDia('2026-09-23', " + f + ')')));
    assert.deepStrictEqual(qua.vem.map((o) => o.nome), [], 'pedida: ainda não vem na quarta');
  } finally { run('pelDias=__bkt.pd; repLancamentos=__bkt.rl; repAgendaDe=__bkt.ra; pelExtra=__bkt.pe; pelInativo=__bkt.pi; ehMoradorZeluz=__bkt.mz;'); }
});

// ================================================================== Re-QA da 5ª rodada (25/set)
console.log('\nRe-QA da 5ª rodada — nada repetido, nada apagado');
prova('QA N2 — mandada a pergunta nova, a cobrança da velha NÃO volta para a lista', () => {
  run(CT_BKP + `VENC_PEND={'2026-09-23':{'mel__ana':{pet:'Mel', tutor:'Ana', enviadas:{ant_antip:{quem:'x', ts:${AGORA - 30 * 3600000}}}}},
                 '2026-09-24':{'mel__ana':{pet:'Mel', tutor:'Ana', enviadas:{ant_antip:{quem:'y', ts:${AGORA - 60000}}}}}, '2026-09-25':{}};
    __MEL.antReg=VENC_PEND['2026-09-24']['mel__ana'];`);
  try {
    const d = JSON.parse(JSON.stringify(run('contatosDados(' + AGORA + ')')));
    assert.deepStrictEqual(d.aqui.map((x) => x.chave), [], 'a pergunta de hoje já saiu');
    assert.deepStrictEqual(d.cobrar.map((x) => x.chave), [], 'e a cobrança de ontem não volta');
  } finally { run(CT_VOLTA); }
});
prova('QA N4 — a conversa do dia respondida fecha o "fazer hoje?"; a pergunta de hoje respondida mostra a resposta', () => {
  assert.strictEqual(run("hojeVesperaTratou({enviadas:{ant_antip:{ts:1}, antip:{ts:2}}, respostas:{antip:{v:'casa'}}}, 'antip')"), true);
  assert.strictEqual(run("hojeVesperaTratou({enviadas:{ant_antip:{ts:1}}, respostas:{ant_antip:{v:'nao'}, antip:{v:'casa'}}}, 'antip')"), false);
});
prova('QA N5 — cobranças do mesmo assunto em dois aparelhos: ficam as duas', () => {
  const r = JSON.parse(JSON.stringify(run(`vencMesclarMapa({antip:[{quem:'Ana', ts:1}]}, {}, {antip:[{quem:'Bia', ts:2}]})`)));
  assert.deepStrictEqual(r.antip.map((x) => x.quem), ['Ana', 'Bia']);
  const r2 = JSON.parse(JSON.stringify(run(`vencMesclarMapa({antip:[{quem:'Ana', ts:1}]}, {antip:[{quem:'Ana', ts:1}]}, {antip:[{quem:'Ana', ts:1},{quem:'Ana', ts:5}]})`)));
  assert.deepStrictEqual(r2.antip.map((x) => x.ts), [1, 5], 'sem repetir');
});
provaAsync('QA N5 — dois "Mandei" rápidos no mesmo aparelho: o segundo espera o primeiro e nenhum some', async () => {
  run(`__bk8={db:DB, vr:VENC_REG, vrd:VENC_REG_DIA, vp:VENC_PEND, au:audit, vre:vencRender, vrq:vencRedesenharQuadros};
    __loja8={};
    DB={ref:function(p){ return {
      once:function(){ return new Promise(function(ok){ Promise.resolve().then(function(){ return null; }).then(function(){ var v=__loja8[p]; ok({val:function(){ return v===undefined?null:JSON.parse(JSON.stringify(v)); }}); }); }); },
      update:function(v){ return new Promise(function(ok){ Promise.resolve().then(function(){ return null; }).then(function(){ Object.keys(v).forEach(function(k){ __loja8[p+'/'+k]=JSON.parse(JSON.stringify(v[k])); }); ok(); }); }); } }; }};
    VENC_REG={}; VENC_REG_DIA='2026-09-28'; VENC_PEND=null;
    audit=function(){}; vencRender=function(){}; vencRedesenharQuadros=function(){};`);
  try {
    const o = "{nome:'Thor', tutor:'Bia', itens:[]}";
    const p1 = run(`vencGravar('thor__bia', {enviadas:{vacina:{quem:'A', ts:1}}}, 't1', ${o}, '2026-09-28')`);
    const p2 = run(`vencGravar('thor__bia', {enviadas:{antip:{quem:'A', ts:2}}}, 't2', ${o}, '2026-09-28')`);
    await p1; await p2;
    const env = JSON.parse(JSON.stringify(run("__loja8['daycare/vencimentos/2026-09-28/thor__bia/enviadas']")));
    assert.deepStrictEqual(Object.keys(env).sort(), ['antip', 'vacina']);
  } finally { run('DB=__bk8.db; VENC_REG=__bk8.vr; VENC_REG_DIA=__bk8.vrd; VENC_PEND=__bk8.vp; audit=__bk8.au; vencRender=__bk8.vre; vencRedesenharQuadros=__bk8.vrq;'); }
});

// ================================================================== Re-QA da 6ª rodada (25/set)
console.log('\nRe-QA da 6ª rodada — ficha e check-in');
prova('QA B-N2 — "Rosa Choque", "Verde Água", "Azul Marinho" escritos com maiúscula não são trocados', () => {
  [['Rosa Choque', 'azul', 'azul Rosa Choque'], ['Verde Água', 'azul', 'azul Verde Água'], ['Azul Marinho', 'preta', 'preta Azul Marinho'],
   ['Rosa Choque', '', 'Rosa Choque'], ['vermelha Zeedog', 'azul', 'azul Zeedog']]
    .forEach(([spec, cor, esperado]) => assert.strictEqual(run('ciPertComCor(' + JSON.stringify(spec) + ',' + JSON.stringify(cor) + ')'), esperado, spec));
});
prova('QA B-N6 — o estado de cada conversa não contradiz a lista: "legado" e "substituída"', () => {
  run(`__bk9={vp:VENC_PEND, pa:PEND_ABERTAS, hz:zHojeISO, pe:pelExtra};
    zHojeISO=function(){ return '2026-09-24'; }; pelExtra=function(){ return {}; };
    __K9=dcKey('Lua','Rita');
    VENC_PEND={}; PEND_ABERTAS={};
    VENC_PEND['2026-09-10']={}; VENC_PEND['2026-09-10'][__K9]={msg_enviada:{quem:'x', ts:${Date.UTC(2026, 8, 9, 12)}}};
    VENC_PEND['2026-09-22']={}; VENC_PEND['2026-09-22'][__K9]={enviadas:{antip:{quem:'a', ts:${Date.UTC(2026, 8, 21, 12)}}}};
    VENC_PEND['2026-09-24']={}; VENC_PEND['2026-09-24'][__K9]={enviadas:{ant_antip:{quem:'b', ts:${Date.UTC(2026, 8, 24, 12)}}}};`);
  try {
    const d = JSON.parse(JSON.stringify(run("fichaUnicaDados({n:'Lua', tutor:'Rita'}, " + Date.UTC(2026, 8, 24, 18) + ')')));
    const est = {}; d.conversas.forEach((c) => { est[c.dia + '|' + c.tipo] = c.estado; });
    assert.strictEqual(est['2026-09-10|'], 'legado', 'registro antigo fora da régua das listas');
    assert.strictEqual(est['2026-09-22|antip'], 'substituida', 'a de 22/09 tem uma mais nova do mesmo assunto');
    assert.deepStrictEqual(d.esperando.map((c) => c.dia + '|' + c.tipo), ['2026-09-24|ant_antip']);
  } finally { run('VENC_PEND=__bk9.vp; PEND_ABERTAS=__bk9.pa; zHojeISO=__bk9.hz; pelExtra=__bk9.pe;'); }
});

// ================================================================== Re-QA final (25/set)
console.log('\nRe-QA final — a conversa irmã respondida e o rastro');
prova('QA NOVO-1 — respondida a conversa do dia, a pergunta "fazer hoje?" do mesmo assunto não é cobrada (e vice-versa)', () => {
  const agora = Date.UTC(2026, 8, 24, 18);
  const regs = { '2026-09-24': { mel__ana: { pet: 'Mel', enviadas: { ant_antip: { quem: 'a', ts: agora - 10 * 3600000 } },
    respostas: { antip: { v: 'casa', quem: 'b', ts: agora - 3600000 } } } } };
  assert.deepStrictEqual(JSON.parse(JSON.stringify(run('vencPendLista(' + JSON.stringify(regs) + ", '2026-09-24', " + agora + ')'))), []);
  const regs2 = { '2026-09-24': { mel__ana: { pet: 'Mel', enviadas: { antip: { quem: 'a', ts: agora - 10 * 3600000 } },
    respostas: { ant_antip: { v: 'nao', quem: 'b', ts: agora - 3600000 } } } } };
  assert.deepStrictEqual(JSON.parse(JSON.stringify(run('vencPendLista(' + JSON.stringify(regs2) + ", '2026-09-24', " + agora + ')'))), []);
  const regs3 = { '2026-09-24': { mel__ana: { pet: 'Mel', enviadas: { antip: { quem: 'a', ts: agora - 10 * 3600000 } },
    respostas: { vacina: { v: 'x', quem: 'b', ts: agora - 3600000 } } } } };
  assert.strictEqual(JSON.parse(JSON.stringify(run('vencPendLista(' + JSON.stringify(regs3) + ", '2026-09-24', " + agora + ')'))).length, 1,
    'resposta de OUTRO assunto não fecha este');
});
provaAsync('QA NOVO-4 — o rastro conta a cobrança pelo que foi gravado (a do outro aparelho entra na conta)', async () => {
  run(`__bk10={db:DB, vr:VENC_REG, vrd:VENC_REG_DIA, vp:VENC_PEND, au:audit, vre:vencRender, vrq:vencRedesenharQuadros, qs:quemSou, vo:vencObjDe};
    __loja10={'daycare/vencimentos/2026-09-28/thor__bia/cobrancas':{antip:[{quem:'Ana', ts:5}]}}; __rastro=null;
    DB={ref:function(p){ return {
      once:function(){ return Promise.resolve({val:function(){ var v=__loja10[p]; return v===undefined?null:JSON.parse(JSON.stringify(v)); }}); },
      update:function(){ return Promise.resolve(); } }; }};
    VENC_REG={'thor__bia':{}}; VENC_REG_DIA='2026-09-28'; VENC_PEND=null;
    audit=function(a, t){ __rastro=t; }; vencRender=function(){}; vencRedesenharQuadros=function(){};
    quemSou=function(){ return 'Bia'; }; vencObjDe=function(){ return {nome:'Thor', tutor:'Bia', itens:[]}; };`);
  try {
    await run("vencCobrei('thor__bia','antip','2026-09-28')");
    assert.ok(/\(2ª cobrança, dia 2026-09-28\)/.test(run('__rastro')), run('__rastro'));
  } finally { run('DB=__bk10.db; VENC_REG=__bk10.vr; VENC_REG_DIA=__bk10.vrd; VENC_PEND=__bk10.vp; audit=__bk10.au; vencRender=__bk10.vre; vencRedesenharQuadros=__bk10.vrq; quemSou=__bk10.qs; vencObjDe=__bk10.vo;'); }
});

provaAsync('a ficha ficou em dia pelo quadro: fecha só quando nada conversado ficou no cartão (fluxo real: cadastro velho, cópia local nova)', async () => {
  run(`__bk11={db:DB, vr:VENC_REG, vrd:VENC_REG_DIA, vp:VENC_PEND, au:audit, vre:vencRender, vrq:vencRedesenharQuadros, qs:quemSou, hz:zHojeISO, vda:vencDiaAlvo, pcc:pelCadCache, ls:localStorage};
    __grav11=[]; __local11={};
    DB={ref:function(p){ return { once:function(){ return Promise.resolve({val:function(){ return null; }}); },
      update:function(v){ __grav11.push({p:p, v:v}); return Promise.resolve(); } }; }};
    zHojeISO=function(){ return '2026-09-21'; }; vencDiaAlvo=function(){ return '2026-09-22'; };
    __P11={n:'Otávio', tutor:'Marcela'};
    localStorage={getItem:function(k){ return __local11[k]||null; }, setItem:function(k,v){ __local11[k]=v; }};
    __K11=dcKey('Otávio','Marcela');
    audit=function(){}; vencRender=function(){}; vencRedesenharQuadros=function(){}; quemSou=function(){ return 'Bia'; };
    VENC_REG_DIA='2026-09-22'; VENC_PEND=null;`);
  const cenario = (cadastro, local, reg) => run(`__grav11=[]; pelCadCache={}; pelCadCache[pelKey(__P11)]=${JSON.stringify(cadastro)};
    __local11={}; __local11['zeluz_pel_'+pelKey(__P11)]=${JSON.stringify(JSON.stringify(local))};
    VENC_REG={}; VENC_REG[__K11]=${JSON.stringify(reg)}; prevCorrigeFecharConversa(__P11, pelKey(__P11));`);
  const emDia = { vac_mult_p: '2027-05-10', vac_gripe_p: '2027-05-10', vac_raiva_p: '2027-05-10', verm_p: '2027-05-10', escova_p: '2027-05-10' };
  const esperar = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); return JSON.parse(JSON.stringify(run('__grav11'))); };
  try {
    // A — o carrapaticida era o único vencido; a data nova ainda NÃO voltou para o cadastro
    cenario(Object.assign({}, emDia, { ecto_p: '2026-09-10' }), { ecto_p: '2026-12-10' }, { enviadas: { antip: { quem: 'x', ts: 1 } } });
    let g = await esperar();
    assert.strictEqual(g.length, 1, 'A: fecha (lê a cópia local nova)');
    assert.strictEqual(g[0].v.ficha_atualizada.via, 'quadro');
    assert.ok(/daycare\/vencimentos\/2026-09-22\//.test(g[0].p) && g[0].p.indexOf(run('__K11')) > 0, 'na chave dos Vencimentos');
    // B — conversa de vermífugo e de vacina; a raiva continua no cartão: NÃO fecha
    cenario(Object.assign({}, emDia, { ecto_p: '2026-12-10', vac_raiva_p: '2026-09-24', verm_p: '2026-09-23' }), { verm_p: '2027-01-20' },
      { enviadas: { antip: { quem: 'x', ts: 1 }, vacina: { quem: 'x', ts: 1 } }, respostas: { antip: { v: 'casa', quem: 'y', ts: 2 } } });
    assert.strictEqual((await esperar()).length, 0, 'B: a vacina conversada continua no cartão');
    // F — a vacina autorizada para a veterinária continua: NÃO fecha
    cenario(Object.assign({}, emDia, { ecto_p: '2026-12-10', vac_raiva_p: '2026-09-24' }), { verm_p: '2027-01-20' },
      { enviadas: { vacina: { quem: 'x', ts: 1 } }, respostas: { vacina: { v: 'vet_dia', quem: 'y', ts: 2 } } });
    assert.strictEqual((await esperar()).length, 0, 'F: o recado da veterinária não some');
    // G — o assunto que o tutor recusou não segura o fechamento
    cenario(Object.assign({}, emDia, { ecto_p: '2026-09-10', escova_p: '2026-09-01' }), { ecto_p: '2026-12-10' },
      { enviadas: { antip: { quem: 'x', ts: 1 }, escova: { quem: 'x', ts: 1 } }, respostas: { escova: { v: 'nao', quem: 'y', ts: 2 } } });
    assert.strictEqual((await esperar()).length, 1, 'G: a escova recusada não segura');
    // I — vermífugo e raiva vencendo na semana, só a mensagem do vermífugo saiu: a vacina ainda
    // NEM FOI MANDADA e continua no cartão — NÃO fecha (QA da re-revisão)
    cenario(Object.assign({}, emDia, { ecto_p: '2026-12-10', verm_p: '2026-09-24', vac_raiva_p: '2026-09-25' }), { verm_p: '2027-01-20' },
      { enviadas: { antip: { quem: 'x', ts: 1 } } });
    assert.strictEqual((await esperar()).length, 0, 'I: a vacina a mandar segura');
    // H — a escova conversada é gravada, mas o vermífugo vencido (nunca conversado) continua: NÃO fecha
    cenario(Object.assign({}, emDia, { ecto_p: '2026-12-10', verm_p: '2026-09-10', escova_p: '2026-09-01' }), { escova_p: '2026-12-01' },
      { enviadas: { escova: { quem: 'x', ts: 1 } } });
    assert.strictEqual((await esperar()).length, 0, 'H: com a ficha ainda devendo, não fecha');
    // J — QA8: a pergunta "fazer hoje?" do carrapaticida (que vence 02/10, fora do cartão do
    // dia 22) espera resposta e ele só volta em 05/10 (feriado no meio). Gravar a escova esvazia
    // o cartão do dia, mas a janela da pergunta ainda tem o carrapaticida: NÃO fecha.
    run("__pv11=proximaVindaDe; proximaVindaDe=function(){ return '2026-10-05'; };");
    try {
      cenario(Object.assign({}, emDia, { ecto_p: '2026-10-02', escova_p: '2026-09-01' }), { escova_p: '2026-12-01' },
        { enviadas: { ant_antip: { quem: 'x', ts: 1 }, escova: { quem: 'x', ts: 1 } } });
      assert.strictEqual((await esperar()).length, 0, 'J: a janela do "fazer hoje?" segura');
      // e quando a próxima vinda é antes do vencimento, a pergunta não tem mais o que segurar
      run("proximaVindaDe=function(){ return '2026-09-29'; };");
      cenario(Object.assign({}, emDia, { ecto_p: '2026-10-02', escova_p: '2026-09-01' }), { escova_p: '2026-12-01' },
        { enviadas: { ant_antip: { quem: 'x', ts: 1 }, escova: { quem: 'x', ts: 1 } } });
      assert.strictEqual((await esperar()).length, 1, 'J2: fora da janela, o cartão vazio fecha');
    } finally { run('proximaVindaDe=__pv11;'); }
    // L — QA10 MÉDIO-1: HOJE ele está aqui e só volta em 05/10. Hoje na Zêluz ofereceu duas
    // perguntas (carrapaticida 01/10 e raiva 02/10); só a do carrapaticida saiu, e o
    // carrapaticida é gravado pelo quadro. A pergunta da vacina, nunca mandada, não pode
    // virar "respondido": o cartão inteiro NÃO fecha.
    run("__pv11=proximaVindaDe; __dv11=vencEhDiaVet; proximaVindaDe=function(){ return '2026-10-05'; }; vencEhDiaVet=function(){ return true; }; VENC_REG_DIA='2026-09-21';");
    try {
      cenario(Object.assign({}, emDia, { ecto_p: '2026-10-01', vac_raiva_p: '2026-10-02' }), { ecto_p: '2026-12-10' },
        { enviadas: { ant_antip: { quem: 'x', ts: 1 } } });
      assert.strictEqual((await esperar()).length, 0, 'L: a pergunta da vacina ainda por mandar segura');
      // L2 — nenhuma pergunta saiu (só a mensagem da escova); gravar a escova não esconde as perguntas de hoje
      cenario(Object.assign({}, emDia, { ecto_p: '2026-10-01', escova_p: '2026-09-01' }), { escova_p: '2026-12-01' },
        { enviadas: { escova: { quem: 'x', ts: 1 } } });
      assert.strictEqual((await esperar()).length, 0, 'L2: as perguntas de hoje seguram o cartão de hoje');
      // L3 — nada mais a perguntar até a próxima vinda: o cartão vazio fecha
      cenario(Object.assign({}, emDia, { ecto_p: '2026-12-10', escova_p: '2026-09-01' }), { escova_p: '2026-12-01' },
        { enviadas: { escova: { quem: 'x', ts: 1 } } });
      assert.strictEqual((await esperar()).length, 1, 'L3: sem nada na janela, fecha');
    } finally { run("proximaVindaDe=__pv11; vencEhDiaVet=__dv11; VENC_REG_DIA='2026-09-22';"); }
    // M — QA12 MÉDIO-2: na VÉSPERA (hoje 21), o vermífugo é gravado pelo quadro no cartão de
    // amanhã (22). Ele só volta em 05/10 e o carrapaticida vence 01/10: amanhã, com ele na casa,
    // a pergunta "fazer hoje?" do carrapaticida vai existir — o cartão de amanhã NÃO fecha.
    run("__pv11=proximaVindaDe; __dv11=vencEhDiaVet; proximaVindaDe=function(){ return '2026-10-05'; }; vencEhDiaVet=function(){ return true; };");
    try {
      cenario(Object.assign({}, emDia, { ecto_p: '2026-10-01', verm_p: '2026-09-10' }), { verm_p: '2027-01-20' },
        { enviadas: { antip: { quem: 'x', ts: 1 } } });
      assert.strictEqual((await esperar()).length, 0, 'M: a pergunta de amanhã segura o cartão de amanhã');
    } finally { run('proximaVindaDe=__pv11; vencEhDiaVet=__dv11;'); }
    // K — QA9 BAIXO-4: o fechamento automático que falha não diz "tente de novo" a quem
    // salvou a ficha (a data foi salva; o cartão continua para o "Sim")
    run("__db11=DB; __za11=zAlertao; __al11=0; zAlertao=function(){ __al11++; }; DB={ref:function(){ return { once:function(){ return Promise.resolve({val:function(){ return null; }}); }, update:function(){ return Promise.reject(new Error('sem rede')); } }; }};");
    try {
      cenario(Object.assign({}, emDia, { ecto_p: '2026-09-10' }), { ecto_p: '2026-12-10' }, { enviadas: { antip: { quem: 'x', ts: 1 } } });
      await esperar();
      assert.strictEqual(run('__al11'), 0, 'K: falha automática vai só para o log');
    } finally { run('DB=__db11; zAlertao=__za11;'); }
    // D — sem conversa nenhuma: não grava
    cenario(Object.assign({}, emDia, { ecto_p: '2026-09-10' }), { ecto_p: '2026-12-10' }, {});
    assert.strictEqual((await esperar()).length, 0, 'D: sem conversa, nada a fechar');
  } finally { run('DB=__bk11.db; VENC_REG=__bk11.vr; VENC_REG_DIA=__bk11.vrd; VENC_PEND=__bk11.vp; audit=__bk11.au; vencRender=__bk11.vre; vencRedesenharQuadros=__bk11.vrq; quemSou=__bk11.qs; zHojeISO=__bk11.hz; vencDiaAlvo=__bk11.vda; pelCadCache=__bk11.pcc; localStorage=__bk11.ls;'); }
});
prova('QA NOVO-1/B2 — a conversa irmã respondida fecha o assunto em TODAS as telas (o estado, não só a lista)', () => {
  assert.strictEqual(run("vencEstadoTipo({enviadas:{ant_antip:{ts:1}}, respostas:{antip:{v:'casa'}}}, 'ant_antip', Date.now())"), 'fechado');
  assert.strictEqual(run("vencEstadoTipo({enviadas:{antip:{ts:1}}, respostas:{ant_antip:{v:'nao'}}}, 'antip', Date.now())"), 'fechado');
  assert.notStrictEqual(run("vencEstadoTipo({enviadas:{antip:{ts:1}}, respostas:{vacina:{v:'x'}}}, 'antip', Date.now())"), 'fechado');
  assert.notStrictEqual(run("vencEstadoTipo({enviadas:{antip:{ts:1}}, respostas:{ant_antip:{v:'sem'}}}, 'antip', Date.now())"), 'fechado',
    '"Não respondeu" gravado na irmã (dado antigo) não fecha');
});

// ================================================================== Fechamento por assunto (25/set)
console.log('\nFechamento por assunto — a ficha resolve o assunto, a conversa dele fecha');
const FA_EM_DIA = { vac_mult_p: '2027-05-10', vac_gripe_p: '2027-05-10', vac_raiva_p: '2027-05-10', verm_p: '2027-05-10', ecto_p: '2027-05-10', escova_p: '2027-05-10' };
prova('pura: resolvido é o assunto conversado que não tem mais item no cartão do dia', () => {
  run("__bk12={hz:zHojeISO}; zHojeISO=function(){ return '2026-09-21'; };");
  try {
    const r = { enviadas: { antip: { ts: 1 }, vacina: { ts: 1 } }, respostas: { antip: { v: 'casa' } } };
    const ficha = Object.assign({}, FA_EM_DIA, { verm_p: '2027-01-20', vac_raiva_p: '2026-09-24' });
    const res = JSON.parse(JSON.stringify(run('vencAssuntosResolvidos(' + JSON.stringify(ficha) + ',' + JSON.stringify(r) + ",'2026-09-22','2026-09-21')")));
    assert.deepStrictEqual(res, ['antip'], 'o vermífugo resolvido fecha; a raiva continua');
    const ja = Object.assign({}, r, { fechados: { antip: { ts: 1 } } });
    assert.deepStrictEqual(JSON.parse(JSON.stringify(run('vencAssuntosResolvidos(' + JSON.stringify(ficha) + ',' + JSON.stringify(ja) + ",'2026-09-22','2026-09-21')"))), [], 'o que já fechou não fecha de novo');
    // a pergunta "fazer hoje?" (ant_antip) é do mesmo assunto
    const r2 = { enviadas: { ant_antip: { ts: 1 } } };
    assert.deepStrictEqual(JSON.parse(JSON.stringify(run('vencAssuntosResolvidos(' + JSON.stringify(FA_EM_DIA) + ',' + JSON.stringify(r2) + ",'2026-09-21','2026-09-21')"))), ['antip']);
    // assunto que só nasceu (nunca conversado) não é "fechado": ele nem existia
    assert.deepStrictEqual(JSON.parse(JSON.stringify(run('vencAssuntosResolvidos(' + JSON.stringify(FA_EM_DIA) + ",{},'2026-09-22','2026-09-21')"))), []);
  } finally { run('zHojeISO=__bk12.hz;'); }
});
prova('o assunto fechado pela ficha sai de todas as telas: estado, Respostas pendentes e recado da veterinária', () => {
  assert.strictEqual(run("vencEstadoTipo({enviadas:{antip:{ts:1}}, fechados:{antip:{ts:2}}}, 'antip', Date.now())"), 'fechado');
  assert.strictEqual(run("vencEstadoTipo({enviadas:{ant_antip:{ts:1}}, fechados:{antip:{ts:2}}}, 'ant_antip', Date.now())"), 'fechado', 'a pergunta "fazer hoje?" do mesmo assunto também');
  assert.notStrictEqual(run("vencEstadoTipo({enviadas:{vacina:{ts:1}}, fechados:{antip:{ts:2}}}, 'vacina', Date.now())"), 'fechado', 'outro assunto segue aberto');
  const agora = Date.UTC(2026, 8, 24, 18);
  const regs = { '2026-09-22': { thor__bia: { pet: 'Thor', enviadas: { antip: { ts: agora - 50 * 3600000 }, vacina: { ts: agora - 50 * 3600000 } }, fechados: { antip: { ts: agora - 3600000 } } } } };
  const L = JSON.parse(JSON.stringify(run('vencPendLista(' + JSON.stringify(regs) + ", '2026-09-24', " + agora + ')')));
  assert.deepStrictEqual(L.map((x) => x.tipo), ['vacina'], 'só a vacina continua sendo cobrada');
});
provaAsync('gravar a data de prevenção na ficha fecha os assuntos resolvidos, em cada dia de conversa (e não os outros)', async () => {
  run(`__bk13={db:DB, vr:VENC_REG, vrd:VENC_REG_DIA, vp:VENC_PEND, au:audit, vre:vencRender, vrq:vencRedesenharQuadros, qs:quemSou, hz:zHojeISO, pe:pelExtra};
    __grav13=[];
    DB={ref:function(p){ return { once:function(){ return Promise.resolve({val:function(){ return null; }}); },
      update:function(v){ __grav13.push({p:p, v:JSON.parse(JSON.stringify(v))}); return Promise.resolve(); } }; }};
    zHojeISO=function(){ return '2026-09-21'; };
    __P13={n:'Thor', tutor:'Bia'}; __K13=dcKey('Thor','Bia');
    pelExtra=function(){ return ${JSON.stringify(Object.assign({}, FA_EM_DIA, { verm_p: '2026-09-10', vac_raiva_p: '2026-09-24' }))}; };
    VENC_REG=null; VENC_REG_DIA='';
    VENC_PEND={'2026-09-15':{}, '2026-09-22':{}, '2026-09-23':{}};
    VENC_PEND['2026-09-15'][__K13]={enviadas:{antip:{ts:1}}};
    VENC_PEND['2026-09-22'][__K13]={enviadas:{antip:{ts:1}, vacina:{ts:1}}};
    audit=function(){}; vencRender=function(){}; vencRedesenharQuadros=function(){}; quemSou=function(){ return 'Ana'; };`);
  try {
    run("vencFecharAssuntosPelaFicha(__P13, {verm_p:'2027-01-20', verm_t:'2026-09-21'})");
    for (let i = 0; i < 30; i++) await Promise.resolve();
    const g = JSON.parse(JSON.stringify(run('__grav13')));
    assert.deepStrictEqual(g.map((x) => x.p.split('/')[2]).sort(), ['2026-09-15', '2026-09-22'], 'os dois dias com conversa do vermífugo');
    g.forEach((x) => {
      assert.deepStrictEqual(Object.keys(x.v.fechados), ['antip'], 'só o vermífugo fecha; a vacina segue');
      assert.strictEqual(x.v.fechados.antip.quem, 'Ana');
      assert.strictEqual(x.v.fechados.antip.via, 'ficha');
    });
  } finally { run('DB=__bk13.db; VENC_REG=__bk13.vr; VENC_REG_DIA=__bk13.vrd; VENC_PEND=__bk13.vp; audit=__bk13.au; vencRender=__bk13.vre; vencRedesenharQuadros=__bk13.vrq; quemSou=__bk13.qs; zHojeISO=__bk13.hz; pelExtra=__bk13.pe;'); }
});

prova('recado da veterinária: sai com a vacina resolvida; fica quando só o "em aberto" fechou e a vacina ainda deve', () => {
  run(`__bk14={vr:VENC_REG, vrd:VENC_REG_DIA, vda:vencDiaAlvo, fd:vencFichaDeveAgora};
    vencDiaAlvo=function(){ return '2026-09-22'; }; VENC_REG_DIA='2026-09-22';
    __vet={pet:'Thor', vacinas:'Raiva', dia:'2026-09-22', periodo:'no dia dele'};`);
  try {
    run("VENC_REG={thor__bia:{vet:__vet, fechados:{vacina:{ts:1}}}}; vencFichaDeveAgora=function(){ return []; };");
    assert.strictEqual(run('vencVetAvisos().length'), 0, 'vacina resolvida: sem recado');
    run("VENC_REG={thor__bia:{vet:__vet, fechados:{aberto:{ts:1}}}}; vencFichaDeveAgora=function(){ return [{k:'vac_raiva_p', vacina:true, atrasado:true}]; };");
    assert.strictEqual(run('vencVetAvisos().length'), 1, 'data velha da carteirinha: a vacina continua a aplicar');
    run("vencFichaDeveAgora=function(){ return []; };");
    assert.strictEqual(run('vencVetAvisos().length'), 0, '"em aberto" fechado e nenhuma vacina devendo: sem recado');
    // QA11: o recado combinado DEPOIS do fechamento (a pergunta "fazer hoje?" mandada depois) é outro — fica
    run("VENC_REG={thor__bia:{vet:Object.assign({ts:9}, __vet), fechados:{vacina:{ts:5}}}};");
    assert.strictEqual(run('vencVetAvisos().length'), 1, 'recado novo, depois do fechamento: fica');
    run("VENC_REG={thor__bia:{vet:Object.assign({ts:3}, __vet), fechados:{vacina:{ts:5}}}};");
    assert.strictEqual(run('vencVetAvisos().length'), 0, 'recado de antes do fechamento: sai');
  } finally { run('VENC_REG=__bk14.vr; VENC_REG_DIA=__bk14.vrd; vencDiaAlvo=__bk14.vda; vencFichaDeveAgora=__bk14.fd;'); }
});
provaAsync('gravar prevenção na ficha dispara o fechamento por assunto — só depois de gravar, e só com campo de prevenção', async () => {
  run(`__bk15={db:DB, vf:vencFecharAssuntosPelaFicha, pb:pelCamposBarrados, ge:document.getElementById};
    __chamou15=[];
    vencFecharAssuntosPelaFicha=function(p, patch){ __chamou15.push(Object.keys(patch).join(',')); };
    pelCamposBarrados=function(){ return []; };
    document.getElementById=function(){ return null; };
    __ok15=true;
    DB={ref:function(){ return { update:function(){ return __ok15?Promise.resolve():Promise.reject(new Error('negado')); } }; }};`);
  try {
    run("setPelExtra({n:'Thor', tutor:'Bia'}, {verm_p:'2027-01-20'})");
    run("setPelExtra({n:'Thor', tutor:'Bia'}, {obs:'come devagar'})");
    for (let i = 0; i < 10; i++) await Promise.resolve();
    assert.deepStrictEqual(JSON.parse(JSON.stringify(run('__chamou15'))), ['verm_p'], 'só a gravação de prevenção dispara');
    run("__chamou15=[]; __ok15=false; setPelExtra({n:'Thor', tutor:'Bia'}, {ecto_p:'2027-01-20'})");
    for (let i = 0; i < 10; i++) await Promise.resolve();
    assert.deepStrictEqual(JSON.parse(JSON.stringify(run('__chamou15'))), [], 'gravação que falhou não fecha nada');
  } finally { run('DB=__bk15.db; vencFecharAssuntosPelaFicha=__bk15.vf; pelCamposBarrados=__bk15.pb; document.getElementById=__bk15.ge;'); }
});

// ================================================================== QA8 — o fechamento por assunto
console.log('\nQA8 — fechamento por assunto: janela do "fazer hoje?", reabrir, varredura e data apagada');
prova('ALTO-1 — a pergunta "fazer hoje?" não fecha enquanto o item ainda está na janela dela (semana de feriado)', () => {
  run(`__bk16={hz:zHojeISO, vm:vencMargem, pv:proximaVindaDe};
    zHojeISO=function(){ return '2026-10-05'; }; vencMargem=function(){ return 3; };
    proximaVindaDe=function(){ return '2026-10-19'; };`);
  try {
    // hoje 05/10, ele só volta 19/10 (12/10 é feriado); o carrapaticida vence 15/10 e a pergunta
    // "fazer hoje?" dele espera resposta; a recepção grava a ESCOVA
    const ficha = Object.assign({}, FA_EM_DIA, { ecto_p: '2026-10-15', escova_p: '2027-01-05' });
    const r = { enviadas: { ant_antip: { ts: 1 }, escova: { ts: 1 } } };
    const P = "{n:'Thor', tutor:'Bia'}";
    const res = JSON.parse(JSON.stringify(run('vencAssuntosResolvidos(' + JSON.stringify(ficha) + ',' + JSON.stringify(r) + ",'2026-10-05','2026-10-05'," + P + ')')));
    assert.deepStrictEqual(res, ['escova'], 'fecha só a escova; o carrapaticida segue na janela da pergunta');
    // variante vacina: "Pode aplicar hoje" respondido, a raiva vence 16/10 — gravar a escova não tira o recado
    const fv = Object.assign({}, FA_EM_DIA, { vac_raiva_p: '2026-10-16', escova_p: '2027-01-05' });
    const rv = { enviadas: { ant_vacina: { ts: 1 }, escova: { ts: 1 } }, respostas: { ant_vacina: { v: 'manhã', ts: 2 } } };
    assert.deepStrictEqual(JSON.parse(JSON.stringify(run('vencAssuntosResolvidos(' + JSON.stringify(fv) + ',' + JSON.stringify(rv) + ",'2026-10-05','2026-10-05'," + P + ')'))), ['escova']);
    // o carrapaticida gravado: aí sim a pergunta fecha
    const ok = Object.assign({}, ficha, { ecto_p: '2027-01-05' });
    assert.deepStrictEqual(JSON.parse(JSON.stringify(run('vencAssuntosResolvidos(' + JSON.stringify(ok) + ',' + JSON.stringify(r) + ",'2026-10-05','2026-10-05'," + P + ')'))).sort(), ['antip', 'escova']);
  } finally { run('zHojeISO=__bk16.hz; vencMargem=__bk16.vm; proximaVindaDe=__bk16.pv;'); }
});
prova('MÉDIO-2 — a data corrigida para trás reabre o que a FICHA fechou (e só o que a ficha fechou)', () => {
  run("__bk17={hz:zHojeISO}; zHojeISO=function(){ return '2026-09-21'; };");
  try {
    const ficha = Object.assign({}, FA_EM_DIA, { verm_p: '2026-09-10' });
    const r = { enviadas: { antip: { ts: 1 } }, fechados: { antip: { quem: 'Ana', ts: 2, via: 'ficha' } } };
    assert.deepStrictEqual(JSON.parse(JSON.stringify(run('vencAssuntosReabertos(' + JSON.stringify(ficha) + ',' + JSON.stringify(r) + ",'2026-09-22','2026-09-21')"))), ['antip']);
    const outro = { enviadas: { antip: { ts: 1 } }, fechados: { antip: { quem: 'Ana', ts: 2, via: 'outro' } } };
    assert.deepStrictEqual(JSON.parse(JSON.stringify(run('vencAssuntosReabertos(' + JSON.stringify(ficha) + ',' + JSON.stringify(outro) + ",'2026-09-22','2026-09-21')"))), [], 'o que não foi a ficha que fechou, a ficha não reabre');
    assert.deepStrictEqual(JSON.parse(JSON.stringify(run('vencAssuntosReabertos(' + JSON.stringify(FA_EM_DIA) + ',' + JSON.stringify(r) + ",'2026-09-22','2026-09-21')"))), [], 'ficha em dia: continua fechado');
  } finally { run('zHojeISO=__bk17.hz;'); }
});
prova('BAIXO — data APAGADA não é "resolvido": o item que virou "em aberto" segura o assunto conversado', () => {
  run("__bk18={hz:zHojeISO}; zHojeISO=function(){ return '2026-09-21'; };");
  try {
    const semVerm = Object.assign({}, FA_EM_DIA); delete semVerm.verm_p;
    const r = { enviadas: { antip: { ts: 1 } }, itens: [{ k: 'verm_p', v: '2026-09-10' }] };
    assert.deepStrictEqual(JSON.parse(JSON.stringify(run('vencAssuntosResolvidos(' + JSON.stringify(semVerm) + ',' + JSON.stringify(r) + ",'2026-09-22','2026-09-21')"))), []);
  } finally { run('zHojeISO=__bk18.hz;'); }
});
provaAsync('MÉDIO-3 — aparelho sem varredura: lê os dias do banco antes de fechar; e a data corrigida reabre gravando', async () => {
  run(`__bk19={db:DB, vr:VENC_REG, vrd:VENC_REG_DIA, vp:VENC_PEND, vpq:VENC_PEND_QUANDO, au:audit, vre:vencRender, vrq:vencRedesenharQuadros, qs:quemSou, hz:zHojeISO, pe:pelExtra, vab:vencAtualizarBadge};
    __grav19=[]; __K19=dcKey('Thor','Bia'); __P19={n:'Thor', tutor:'Bia'};
    __faixa19={'2026-09-22':{}}; __faixa19['2026-09-22'][__K19]={enviadas:{antip:{ts:1}, vacina:{ts:1}}};
    __falha19=false;
    DB={ref:function(p){ return {
      orderByKey:function(){ return { startAt:function(){ return { endAt:function(){ return { once:function(){ return Promise.resolve({val:function(){ return __faixa19; }}); } }; } }; } }; },
      once:function(){ return Promise.resolve({val:function(){ return null; }}); },
      update:function(v){ if(__falha19) return Promise.reject(new Error('sem rede')); __grav19.push({p:p, v:JSON.parse(JSON.stringify(v))}); return Promise.resolve(); } }; }};
    zHojeISO=function(){ return '2026-09-21'; };
    pelExtra=function(){ return ${JSON.stringify(Object.assign({}, FA_EM_DIA, { verm_p: '2026-09-10', vac_raiva_p: '2026-09-24' }))}; };
    VENC_REG=null; VENC_REG_DIA=''; VENC_PEND=null; VENC_PEND_QUANDO=0;
    audit=function(){}; vencRender=function(){}; vencRedesenharQuadros=function(){}; vencAtualizarBadge=function(){}; quemSou=function(){ return 'Ana'; };`);
  const esperar = async () => { for (let i = 0; i < 40; i++) await Promise.resolve(); return JSON.parse(JSON.stringify(run('__grav19'))); };
  try {
    run("vencFecharAssuntosPelaFicha(__P19, {verm_p:'2027-01-20'})");
    let g = await esperar();
    assert.strictEqual(g.length, 1, 'leu a faixa do banco e fechou');
    assert.deepStrictEqual(Object.keys(g[0].v.fechados), ['antip']);
    assert.ok(g[0].p.indexOf('2026-09-22') > 0);
    // a recepção errou de FILHOt e volta o "Vence em" para 10/09: reabre (o fechados some)
    run("__grav19=[]; VENC_PEND['2026-09-22'][__K19].fechados={antip:{quem:'Ana', ts:2, via:'ficha'}};");
    run("vencFecharAssuntosPelaFicha(__P19, {verm_p:'2026-09-10'})");
    g = await esperar();
    assert.strictEqual(g.length, 1, 'gravou a reabertura');
    assert.deepStrictEqual(g[0].v.fechados, {}, 'o assunto voltou a ser cobrado');
    // falha do fechamento automático: sem alerta de "tente de novo" para quem salvou a ficha
    run("__grav19=[]; __alertas19=0; __za19=zAlertao; zAlertao=function(){ __alertas19++; }; __falha19=true; VENC_PEND['2026-09-22'][__K19].fechados={};");
    try {
      run("vencFecharAssuntosPelaFicha(__P19, {verm_p:'2027-01-20'})");
      await esperar();
      assert.strictEqual(run('__alertas19'), 0, 'falha automática não assusta quem salvou a ficha');
    } finally { run('zAlertao=__za19;'); }
  } finally { run('DB=__bk19.db; VENC_REG=__bk19.vr; VENC_REG_DIA=__bk19.vrd; VENC_PEND=__bk19.vp; VENC_PEND_QUANDO=__bk19.vpq; audit=__bk19.au; vencRender=__bk19.vre; vencRedesenharQuadros=__bk19.vrq; quemSou=__bk19.qs; zHojeISO=__bk19.hz; pelExtra=__bk19.pe; vencAtualizarBadge=__bk19.vab;'); }
});

// ================================================================== QA9 — re-revisão
console.log('\nQA9 — a pergunta "fazer hoje?" segura só o que ela pergunta; tela aberta; leitura em curso; duas gravações');
prova('MÉDIO-2 (QA9) — a janela do "fazer hoje?" segura só os assuntos perguntados e só o que a pergunta cobre', () => {
  run(`__bk20={hz:zHojeISO, vm:vencMargem, pv:proximaVindaDe};
    zHojeISO=function(){ return '2026-10-05'; }; vencMargem=function(){ return 3; };
    proximaVindaDe=function(){ return '2026-10-19'; };`);
  try {
    const P = "{n:'Thor', tutor:'Bia'}";
    const R = (f, r) => JSON.parse(JSON.stringify(run('vencAssuntosResolvidos(' + JSON.stringify(f) + ',' + JSON.stringify(r) + ",'2026-10-05','2026-10-05'," + P + ')'))).sort();
    // A — a mensagem do vermífugo e a pergunta "fazer hoje?" da VACINA; o carrapaticida (15/10)
    // nunca foi conversado. Gravado o vermífugo, o assunto dele fecha; a vacina segue
    const fa = Object.assign({}, FA_EM_DIA, { verm_p: '2027-01-20', vac_raiva_p: '2026-10-14', ecto_p: '2026-10-15' });
    assert.deepStrictEqual(R(fa, { enviadas: { antip: { ts: 1 }, ant_vacina: { ts: 1 } } }), ['antip']);
    // B — a pergunta foi só do carrapaticida; o check-up (16/10) não é o que ela pergunta
    const fb = Object.assign({}, FA_EM_DIA, { ecto_p: '2027-01-20', checkup_p: '2026-10-16' });
    assert.deepStrictEqual(R(fb, { enviadas: { ant_antip: { ts: 1 } } }), ['antip']);
  } finally { run('zHojeISO=__bk20.hz; vencMargem=__bk20.vm; proximaVindaDe=__bk20.pv;'); }
});
provaAsync('MÉDIO-1 / BAIXO-1 / BAIXO-2 (QA9) — tela aberta com registro velho, leitura em curso e duas gravações seguidas', async () => {
  run(`__bk21={db:DB, vr:VENC_REG, vrd:VENC_REG_DIA, vrq:VENC_REG_QUANDO, vp:VENC_PEND, vpq:VENC_PEND_QUANDO, vpl:VENC_PEND_LENDO, au:audit, vre:vencRender, vrq2:vencRedesenharQuadros, qs:quemSou, hz:zHojeISO, pe:pelExtra, vab:vencAtualizarBadge, st:setTimeout};
    __grav21=[]; __K21=dcKey('Thor','Bia'); __P21={n:'Thor', tutor:'Bia'}; __tq21=[];
    __faixa21={'2026-09-22':{}}; __faixa21['2026-09-22'][__K21]={enviadas:{antip:{ts:1}, vacina:{ts:1}}};
    DB={ref:function(p){ return {
      orderByKey:function(){ return { startAt:function(){ return { endAt:function(){ return { once:function(){ return Promise.resolve({val:function(){ return JSON.parse(JSON.stringify(__faixa21)); }}); } }; } }; } }; },
      once:function(){ return Promise.resolve({val:function(){ return null; }}); },
      update:function(v){ __grav21.push({p:p, v:JSON.parse(JSON.stringify(v))}); return Promise.resolve(); } }; }};
    zHojeISO=function(){ return '2026-09-21'; };
    pelExtra=function(){ return ${JSON.stringify(Object.assign({}, FA_EM_DIA, { verm_p: '2026-09-10', vac_raiva_p: '2026-09-24' }))}; };
    setTimeout=function(fn){ __tq21.push(fn); return 0; };
    audit=function(){}; vencRender=function(){}; vencRedesenharQuadros=function(){}; vencAtualizarBadge=function(){}; quemSou=function(){ return 'Ana'; };`);
  const esperar = async () => { for (let i = 0; i < 40; i++) await Promise.resolve(); return JSON.parse(JSON.stringify(run('__grav21'))); };
  try {
    // MÉDIO-1 — Vencimentos aberto no dia 22 desde cedo, lido ANTES da conversa (outro aparelho mandou depois)
    run("VENC_REG={}; VENC_REG[__K21]={pet:'Thor'}; VENC_REG_DIA='2026-09-22'; VENC_REG_QUANDO=1; VENC_PEND=null; VENC_PEND_QUANDO=0; VENC_PEND_LENDO=false;");
    run("vencFecharAssuntosPelaFicha(__P21, {verm_p:'2027-01-20'})");
    let g = await esperar();
    assert.strictEqual(g.length, 1, 'MÉDIO-1: o dia da tela vê a leitura nova e fecha');
    assert.deepStrictEqual(Object.keys(g[0].v.fechados), ['antip']);
    // BAIXO-1 — a Mesa já pediu a varredura (leitura em curso): espera ela chegar
    run("__grav21=[]; __tq21=[]; VENC_REG=null; VENC_REG_DIA=''; VENC_PEND=null; VENC_PEND_QUANDO=0; VENC_PEND_LENDO=true;");
    run("vencFecharAssuntosPelaFicha(__P21, {verm_p:'2027-01-20'})");
    g = await esperar();
    assert.strictEqual(g.length, 0, 'ainda esperando a leitura');
    run("VENC_PEND=JSON.parse(JSON.stringify(__faixa21)); VENC_PEND_QUANDO=Date.now(); VENC_PEND_LENDO=false; __tq21.splice(0).forEach(function(f){ f(); });");
    g = await esperar();
    assert.strictEqual(g.length, 1, 'BAIXO-1: fechou depois que a leitura chegou');
    // BAIXO-2 — grava o vermífugo e, logo depois, corrige para 10/09: vale a data mais nova
    run("__grav21=[]; __tq21=[]; VENC_PEND=null; VENC_PEND_QUANDO=0; VENC_PEND_LENDO=false;");
    run("vencFecharAssuntosPelaFicha(__P21, {verm_p:'2027-01-20'}); vencFecharAssuntosPelaFicha(__P21, {verm_p:'2026-09-10'});");
    g = await esperar();
    for (let i = 0; i < 5 && run('__tq21.length'); i++) { run('__tq21.splice(0).forEach(function(f){ f(); })'); g = await esperar(); }
    assert.strictEqual(g.length, 0, 'BAIXO-2: a correção vence a data velha — nada fecha');
  } finally { run('DB=__bk21.db; VENC_REG=__bk21.vr; VENC_REG_DIA=__bk21.vrd; VENC_REG_QUANDO=__bk21.vrq; VENC_PEND=__bk21.vp; VENC_PEND_QUANDO=__bk21.vpq; VENC_PEND_LENDO=__bk21.vpl; audit=__bk21.au; vencRender=__bk21.vre; vencRedesenharQuadros=__bk21.vrq2; quemSou=__bk21.qs; zHojeISO=__bk21.hz; pelExtra=__bk21.pe; vencAtualizarBadge=__bk21.vab; setTimeout=__bk21.st;'); }
});

// ================================================================== QA10 — 3ª rodada
console.log('\nQA10 — reabrir desfaz também o cartão fechado pelo quadro; a gravação anterior em curso');
provaAsync('MÉDIO-2 / BAIXO-1 (QA10) — reabrir apaga o fechamento do quadro; e espera a gravação anterior do mesmo FILHOt', async () => {
  run(`__bk22={db:DB, vr:VENC_REG, vrd:VENC_REG_DIA, vp:VENC_PEND, vpq:VENC_PEND_QUANDO, vpl:VENC_PEND_LENDO, au:audit, vre:vencRender, vrq2:vencRedesenharQuadros, qs:quemSou, hz:zHojeISO, pe:pelExtra, vab:vencAtualizarBadge, fg:VENC_FILA_GRAV};
    __grav22=[]; __K22=dcKey('Thor','Bia'); __P22={n:'Thor', tutor:'Bia'};
    DB={ref:function(p){ return {
      once:function(){ return Promise.resolve({val:function(){ return null; }}); },
      update:function(v){ __grav22.push({p:p, v:JSON.parse(JSON.stringify(v))}); return Promise.resolve(); } }; }};
    zHojeISO=function(){ return '2026-09-21'; };
    pelExtra=function(){ return ${JSON.stringify(Object.assign({}, FA_EM_DIA, { vac_raiva_p: '2026-09-24' }))}; };
    VENC_REG=null; VENC_REG_DIA=''; VENC_PEND_LENDO=false; VENC_FILA_GRAV={};
    audit=function(){}; vencRender=function(){}; vencRedesenharQuadros=function(){}; vencAtualizarBadge=function(){}; quemSou=function(){ return 'Ana'; };`);
  const esperar = async () => { for (let i = 0; i < 40; i++) await Promise.resolve(); return JSON.parse(JSON.stringify(run('__grav22'))); };
  try {
    // MÉDIO-2 — a raiva gravada fechou o assunto (ficha) e o cartão inteiro (quadro); foi o FILHOt
    // errado e a data volta para 24/09: reabre o assunto E o cartão (o recado da veterinária volta)
    run(`VENC_PEND={'2026-09-22':{}}; VENC_PEND_QUANDO=Date.now();
      VENC_PEND['2026-09-22'][__K22]={enviadas:{ant_vacina:{ts:1}}, respostas:{ant_vacina:{v:'manhã', ts:2}},
        fechados:{vacina:{quem:'Ana', ts:3, via:'ficha'}}, ficha_atualizada:{quem:'Ana', ts:3, via:'quadro'}};`);
    run("vencFecharAssuntosPelaFicha(__P22, {vac_raiva_p:'2026-09-24'})");
    let g = await esperar();
    assert.strictEqual(g.length, 1, 'gravou a reabertura');
    assert.deepStrictEqual(g[0].v.fechados, {}, 'o assunto voltou');
    assert.ok('ficha_atualizada' in g[0].v && g[0].v.ficha_atualizada === null, 'o cartão fechado pelo quadro também reabre');
    // o "Sim" da pessoa (ficha_atualizada sem via quadro) a ficha não desfaz
    run(`__grav22=[]; VENC_PEND['2026-09-22'][__K22]={enviadas:{vacina:{ts:1}}, fechados:{vacina:{quem:'Ana', ts:3, via:'ficha'}}, ficha_atualizada:{quem:'Bia', ts:4}};`);
    run("vencFecharAssuntosPelaFicha(__P22, {vac_raiva_p:'2026-09-24'})");
    g = await esperar();
    assert.strictEqual(g.length, 1);
    assert.ok(!('ficha_atualizada' in g[0].v), 'o "Sim" continua');
    // BAIXO-1 — a gravação ANTERIOR deste FILHOt (o fechamento) ainda está a caminho do banco
    // quando a data é corrigida: a conta espera ela chegar à memória e então reabre
    run(`__grav22=[]; VENC_PEND['2026-09-22'][__K22]={enviadas:{vacina:{ts:1}}};
      VENC_FILA_GRAV['2026-09-22|'+__K22]=new Promise(function(ok){ __solta22=ok; });`);
    run("vencFecharAssuntosPelaFicha(__P22, {vac_raiva_p:'2026-09-24'})");
    g = await esperar();
    assert.strictEqual(g.length, 0, 'ainda esperando a gravação anterior');
    run("VENC_PEND['2026-09-22'][__K22].fechados={vacina:{quem:'Ana', ts:5, via:'ficha'}}; __solta22();");
    g = await esperar();
    assert.strictEqual(g.length, 1, 'depois que a anterior chegou, a conta viu o que reabrir');
    assert.deepStrictEqual(g[0].v.fechados, {});
  } finally { run('DB=__bk22.db; VENC_REG=__bk22.vr; VENC_REG_DIA=__bk22.vrd; VENC_PEND=__bk22.vp; VENC_PEND_QUANDO=__bk22.vpq; VENC_PEND_LENDO=__bk22.vpl; audit=__bk22.au; vencRender=__bk22.vre; vencRedesenharQuadros=__bk22.vrq2; quemSou=__bk22.qs; zHojeISO=__bk22.hz; pelExtra=__bk22.pe; vencAtualizarBadge=__bk22.vab; VENC_FILA_GRAV=__bk22.fg;'); }
});

// ================================================================== QA11 — 4ª rodada (sugestão do revisor)
console.log('\nQA11 — o cartão do quadro reabre pela própria régua; a pergunta que nunca saiu não é conversa');
provaAsync('QA11 — reabrir o cartão do quadro sem assunto fechado pela ficha (item nunca conversado; conta fundida)', async () => {
  run(`__bk23={db:DB, vr:VENC_REG, vrd:VENC_REG_DIA, vp:VENC_PEND, vpq:VENC_PEND_QUANDO, vpl:VENC_PEND_LENDO, au:audit, vre:vencRender, vrq2:vencRedesenharQuadros, qs:quemSou, hz:zHojeISO, pe:pelExtra, vab:vencAtualizarBadge, fg:VENC_FILA_GRAV};
    __grav23=[]; __K23=dcKey('Thor','Bia'); __P23={n:'Thor', tutor:'Bia'};
    DB={ref:function(p){ return {
      once:function(){ return Promise.resolve({val:function(){ return null; }}); },
      update:function(v){ __grav23.push({p:p, v:JSON.parse(JSON.stringify(v))}); return Promise.resolve(); } }; }};
    zHojeISO=function(){ return '2026-09-21'; };
    VENC_REG=null; VENC_REG_DIA=''; VENC_PEND_LENDO=false; VENC_FILA_GRAV={};
    audit=function(){}; vencRender=function(){}; vencRedesenharQuadros=function(){}; vencAtualizarBadge=function(){}; quemSou=function(){ return 'Ana'; };`);
  const esperar = async () => { for (let i = 0; i < 40; i++) await Promise.resolve(); return JSON.parse(JSON.stringify(run('__grav23'))); };
  try {
    // S2 — a escova (nunca conversada) foi gravada pelo quadro e fechou o cartão; era de outro
    // FILHOt e volta para 25/09, dentro do cartão de 22/09: o cartão reabre, o antip fica fechado
    run(`pelExtra=function(){ return ${JSON.stringify(Object.assign({}, FA_EM_DIA, { escova_p: '2026-09-25' }))}; };
      VENC_PEND={'2026-09-22':{}}; VENC_PEND_QUANDO=Date.now();
      VENC_PEND['2026-09-22'][__K23]={enviadas:{antip:{ts:1}}, fechados:{antip:{quem:'Ana', ts:3, via:'ficha'}}, ficha_atualizada:{quem:'Ana', ts:4, via:'quadro'}};`);
    run("vencFecharAssuntosPelaFicha(__P23, {escova_p:'2026-09-25'})");
    let g = await esperar();
    assert.strictEqual(g.length, 1, 'S2: gravou a reabertura do cartão');
    assert.ok('ficha_atualizada' in g[0].v && g[0].v.ficha_atualizada === null, 'S2: o cartão fechado pelo quadro reabre');
    assert.ok(!('fechados' in g[0].v), 'S2: o assunto do vermífugo continua fechado (nada a mexer)');
    // S3 — "gravar e logo corrigir" fundidos numa conta só: nenhum fechados foi gravado, mas o
    // quadro fechou na hora. A vacina volta a dever (24/09): o cartão reabre (o recado volta)
    run(`__grav23=[]; pelExtra=function(){ return ${JSON.stringify(Object.assign({}, FA_EM_DIA, { vac_raiva_p: '2026-09-24' }))}; };
      VENC_PEND['2026-09-22'][__K23]={enviadas:{vacina:{ts:1}}, respostas:{vacina:{v:'zeluz', ts:2}}, vet:{pet:'Thor', vacinas:'Antirrábica'}, ficha_atualizada:{quem:'Ana', ts:4, via:'quadro'}};`);
    run("vencFecharAssuntosPelaFicha(__P23, {vac_raiva_p:'2026-09-24'})");
    g = await esperar();
    assert.strictEqual(g.length, 1, 'S3: gravou');
    assert.ok(g[0].v.ficha_atualizada === null, 'S3: o cartão do quadro reabre mesmo sem assunto fechado pela ficha');
    // e o "Sim" da pessoa continua intocado
    run(`__grav23=[]; VENC_PEND['2026-09-22'][__K23]={enviadas:{vacina:{ts:1}}, ficha_atualizada:{quem:'Bia', ts:4}};`);
    run("vencFecharAssuntosPelaFicha(__P23, {vac_raiva_p:'2026-09-24'})");
    g = await esperar();
    assert.strictEqual(g.length, 0, 'S3: o "Sim" da pessoa não é desfeito');
  } finally { run('DB=__bk23.db; VENC_REG=__bk23.vr; VENC_REG_DIA=__bk23.vrd; VENC_PEND=__bk23.vp; VENC_PEND_QUANDO=__bk23.vpq; VENC_PEND_LENDO=__bk23.vpl; audit=__bk23.au; vencRender=__bk23.vre; vencRedesenharQuadros=__bk23.vrq2; quemSou=__bk23.qs; zHojeISO=__bk23.hz; pelExtra=__bk23.pe; vencAtualizarBadge=__bk23.vab; VENC_FILA_GRAV=__bk23.fg;'); }
});
prova('QA11 — S5: o fechamento pela ficha não esconde a pergunta "fazer hoje?" que nunca saiu (nem a que saiu depois)', () => {
  const est = (r, t) => run('vencEstadoTipo(' + JSON.stringify(r) + ",'" + t + "', 1000)");
  const base = { enviadas: { antip: { ts: 1 } }, fechados: { antip: { quem: 'Ana', ts: 5, via: 'ficha' } } };
  assert.strictEqual(est(base, 'antip'), 'fechado', 'a mensagem do dia fecha, como sempre');
  assert.strictEqual(est(base, 'ant_antip'), 'amandar', 'a pergunta que nunca saiu continua "a mandar"');
  assert.strictEqual(est(Object.assign({}, base, { enviadas: { antip: { ts: 1 }, ant_antip: { ts: 3 } } }), 'ant_antip'), 'fechado', 'a pergunta que já tinha saído fecha junto (AC3)');
  assert.notStrictEqual(est(Object.assign({}, base, { enviadas: { antip: { ts: 1 }, ant_antip: { ts: 9 } } }), 'ant_antip'), 'fechado', 'a pergunta mandada DEPOIS espera a resposta');
  // e, resolvida na ficha, a pergunta mandada depois fecha de novo
  run("__bk24={hz:zHojeISO}; zHojeISO=function(){ return '2026-09-21'; };");
  try {
    const r = Object.assign({}, base, { enviadas: { antip: { ts: 1 }, ant_antip: { ts: 9 } } });
    const res = JSON.parse(JSON.stringify(run('vencAssuntosResolvidos(' + JSON.stringify(FA_EM_DIA) + ',' + JSON.stringify(r) + ",'2026-09-22','2026-09-21')")));
    assert.deepStrictEqual(res, ['antip'], 'conversa depois do fechamento: fecha de novo quando a ficha resolve');
    const res2 = JSON.parse(JSON.stringify(run('vencAssuntosResolvidos(' + JSON.stringify(FA_EM_DIA) + ',' + JSON.stringify(base) + ",'2026-09-22','2026-09-21')")));
    assert.deepStrictEqual(res2, [], 'sem conversa nova, não grava de novo');
  } finally { run('zHojeISO=__bk24.hz;'); }
});

// ================================================================== QA12 — 5ª rodada (sugestão do revisor)
console.log('\nQA12 — o recado do "em aberto", o cartão de amanhã e o relógio adiantado');
prova('QA12-A — o recado da vacina NUNCA registrada não some porque o assunto vacina fechou', () => {
  run(`__bk25={vr:VENC_REG, vrd:VENC_REG_DIA, vda:vencDiaAlvo, fd:vencFichaDeveAgora};
    vencDiaAlvo=function(){ return '2026-10-05'; }; VENC_REG_DIA='2026-10-05';
    __vet25={pet:'Thor', vacinas:'Gripe', dia:'2026-10-05', periodo:'no dia dele', ts:3};`);
  try {
    // a antirrábica do cartão foi gravada (fechados.vacina em 5); o recado (em 3) é da Gripe, nunca registrada
    run("VENC_REG={thor__bia:{vet:__vet25, fechados:{vacina:{ts:5}}}}; vencFichaDeveAgora=function(){ return [{k:'vac_gripe_p', vacina:true, sem_registro:true}]; };");
    assert.strictEqual(run('vencVetAvisos().length'), 1, 'a Gripe continua a aplicar: o recado fica');
    run("vencFichaDeveAgora=function(){ return [{k:'vac_mult_p', vacina:true, sem_registro:true}]; };");
    assert.strictEqual(run('vencVetAvisos().length'), 0, 'o que ainda deve não é a vacina do recado: sai');
    run("vencFichaDeveAgora=function(){ return []; };");
    assert.strictEqual(run('vencVetAvisos().length'), 0, 'nenhuma vacina devendo: sai');
    // QA13: o tutor mudou a Gripe para "Não quer agora" — a recusa conta (a ficha é lida com o registro)
    run("vencFichaDeveAgora=function(ch, r){ return (((r||{}).respostas||{}).vacina||{}).v==='nao' ? [] : [{k:'vac_gripe_p', vacina:true, sem_registro:true}]; };");
    run("VENC_REG={thor__bia:{vet:__vet25, fechados:{vacina:{ts:5}}, respostas:{vacina:{v:'nao', ts:6}}}};");
    assert.strictEqual(run('vencVetAvisos().length'), 0, 'recusada pelo tutor: o recado sai');
  } finally { run('VENC_REG=__bk25.vr; VENC_REG_DIA=__bk25.vrd; vencDiaAlvo=__bk25.vda; vencFichaDeveAgora=__bk25.fd;'); }
});
prova('QA12-B — o quadro não fecha na véspera o cartão de amanhã enquanto a pergunta "fazer hoje?" dele tiver item', () => {
  run(`__bk26={ha:hojeAntecipar, vi:vencItensDe};
    vencItensDe=function(){ return []; };
    hojeAntecipar=function(ex, p, dia){ return {itens:(dia==='2026-10-05')?[{k:'ecto_p', nome:'Carrapaticida', vence:'2026-10-15', atrasado:false}]:[]}; };`);
  try {
    const r = JSON.stringify({ enviadas: { antip: { ts: 1 } } });
    assert.strictEqual(run("vencQuadroSegura({}, {n:'Thor', tutor:'Bia'}, '2026-10-05', " + r + ", '2026-10-02')"), true, 'cartão de amanhã: a pergunta dele segura');
    assert.strictEqual(run("vencQuadroSegura({}, {n:'Thor', tutor:'Bia'}, '2026-10-05', " + r + ", '2026-10-05')"), true, 'no próprio dia: segura (como antes)');
    assert.strictEqual(run("vencQuadroSegura({}, {n:'Thor', tutor:'Bia'}, '2026-10-05', " + r + ", '2026-10-06')"), false, 'dia que já passou, sem pergunta: não segura (como antes)');
  } finally { run('hojeAntecipar=__bk26.ha; vencItensDe=__bk26.vi;'); }
});
provaAsync('QA12-C — relógio adiantado no aparelho da pergunta: o fechamento não é regravado a cada gravação', async () => {
  run(`__bk27={db:DB, vr:VENC_REG, vrd:VENC_REG_DIA, vp:VENC_PEND, vpq:VENC_PEND_QUANDO, vpl:VENC_PEND_LENDO, au:audit, vre:vencRender, vrq2:vencRedesenharQuadros, qs:quemSou, hz:zHojeISO, pe:pelExtra, vab:vencAtualizarBadge, fg:VENC_FILA_GRAV};
    __grav27=[]; __K27=dcKey('Thor','Bia'); __P27={n:'Thor', tutor:'Bia'}; __fut27=Date.now()+600000;
    DB={ref:function(p){ return {
      once:function(){ return Promise.resolve({val:function(){ return null; }}); },
      update:function(v){ __grav27.push({p:p, v:JSON.parse(JSON.stringify(v))}); return Promise.resolve(); } }; }};
    zHojeISO=function(){ return '2026-09-21'; };
    VENC_REG=null; VENC_REG_DIA=''; VENC_PEND_LENDO=false; VENC_FILA_GRAV={};
    audit=function(){}; vencRender=function(){}; vencRedesenharQuadros=function(){}; vencAtualizarBadge=function(){}; quemSou=function(){ return 'Ana'; };
    pelExtra=function(){ return ${JSON.stringify(FA_EM_DIA)}; };
    VENC_PEND={'2026-09-22':{}}; VENC_PEND_QUANDO=Date.now();
    VENC_PEND['2026-09-22'][__K27]={enviadas:{antip:{ts:1}, ant_antip:{ts:__fut27}}};`);
  const esperar = async () => { for (let i = 0; i < 40; i++) await Promise.resolve(); return JSON.parse(JSON.stringify(run('__grav27'))); };
  try {
    run("vencFecharAssuntosPelaFicha(__P27, {verm_p:'2027-05-10'})");
    let g = await esperar();
    assert.strictEqual(g.length, 1, 'fechou');
    run("VENC_PEND['2026-09-22'][__K27].fechados=" + JSON.stringify(g[0].v.fechados) + "; __grav27=[];");
    run("vencFecharAssuntosPelaFicha(__P27, {escova_p:'2027-05-10'})");
    g = await esperar();
    assert.strictEqual(g.length, 0, 'a gravação seguinte não regrava o mesmo fechamento');
  } finally { run('DB=__bk27.db; VENC_REG=__bk27.vr; VENC_REG_DIA=__bk27.vrd; VENC_PEND=__bk27.vp; VENC_PEND_QUANDO=__bk27.vpq; VENC_PEND_LENDO=__bk27.vpl; audit=__bk27.au; vencRender=__bk27.vre; vencRedesenharQuadros=__bk27.vrq2; quemSou=__bk27.qs; zHojeISO=__bk27.hz; pelExtra=__bk27.pe; vencAtualizarBadge=__bk27.vab; VENC_FILA_GRAV=__bk27.fg;'); }
});

// ================================================================== decisões de 27/set/2026
console.log('\nDecisões da Adriana, 27/set/2026 — exame de fezes e "venceu em"');
const MSG_O = (ex, alvo, dias) => `({chave:'cookie__ana', p:{n:'Cookie', tutor:'Ana Paula', dias:${JSON.stringify(dias || [])}},
  nome:'Cookie', tutor:'Ana Paula', sexo:'F', itens:vencItensDe(${JSON.stringify(ex)}, '${alvo}', 7, '2026-09-24')})`;
const msg = (ex, tipo, alvo, dias) => run(`vencMensagemDe(${MSG_O(ex, alvo, dias)}, '${tipo}', null, '${alvo}', '2026-09-24')`);
prova('B2 — exame de fezes depois da 1ª dose dispensa a 2ª; o exame renova em 4 meses (decisão: "sim, tem que refazer depois de 4 meses")', () => {
  const ex = { verm_t: '2026-09-01', verm_doses: '2 doses', fezes_t: '2026-09-10' };
  const it = run("PREV_ITENS.filter(function(x){ return x.k==='verm_dose2_p'; })[0]");
  ctx.__ex = ex; ctx.__it = it;
  assert.strictEqual(run('prevDispensadoPorExame(__ex, __it)'), true, 'a 2ª dose não é cobrada');
  assert.strictEqual(run("vermOuFezes(__ex)"), 'fezes');
  assert.strictEqual(run("addDiasISO('2026-09-10', FEZES_PROX)"), '2027-01-08', 'o exame volta a ser cobrado 120 dias depois');
  ctx.__ex2 = { verm_t: '2026-09-01', verm_doses: '2 doses', fezes_t: '2026-08-20' };
  assert.strictEqual(run('prevDispensadoPorExame(__ex2, __it)'), false, 'exame ANTES da 1ª dose não dispensa a 2ª');
});
prova('"venceu em" — tudo vencido: a data é a do vencimento, não o dia dele aqui', () => {
  const vac = msg({ vac_raiva_p: '2026-09-10' }, 'vacina', '2026-09-24');
  assert.ok(vac.indexOf('a vacina de Raiva da Cookie venceu em 10/09.') > 0, vac);
  const agd = msg({ vac_raiva_p: '2026-09-10' }, 'vacina', '2026-09-24', ['qui', 'sex']);
  assert.ok(agd.indexOf('A vacina de Raiva da Cookie venceu em 10/09.') > 0, agd);
  assert.ok(agd.indexOf('venceu hoje') < 0, 'nunca "venceu hoje" para o que venceu em 10/09');
  const ant = msg({ verm_p: '2026-09-15', verm_t: '2026-05-18' }, 'antip', '2026-09-25');
  assert.ok(ant.indexOf('Passando para lembrar que venceu em 15/09 o vermífugo da Cookie.') > 0, ant);
  assert.ok(ant.indexOf('Podemos fazer amanhã?') > 0, 'o {quando} do fecho continua sendo o dia dela aqui');
  const dois = msg({ verm_p: '2026-09-15', verm_t: '2026-05-18', ecto_p: '2026-09-12' }, 'antip', '2026-09-25');
  // datas diferentes (QA19 M2): cada item diz a sua; mesma data: uma frase só, no plural
  assert.ok(dois.indexOf('o carrapaticida da Cookie venceu em 12/09 e o vermífugo venceu em 15/09.') > 0, dois);
  const mesma = msg({ verm_p: '2026-09-12', verm_t: '2026-05-15', ecto_p: '2026-09-12' }, 'antip', '2026-09-25');
  assert.ok(mesma.indexOf('venceram em 12/09 o carrapaticida e o vermífugo da Cookie') > 0, mesma);
});
prova('"venceu em" — "nesse dia" continua com um dia escrito antes (texto da creche)', () => {
  const t = msg({ vac_raiva_p: '2026-09-10' }, 'vacina', '2026-09-25');
  assert.ok(t.indexOf('venceu em 10/09. Como ela estará conosco amanhã, sexta-feira (25/09),') > 0, t);
  assert.ok(t.indexOf('nesse dia') < 0, t);
});
prova('"venceu em" — misturado: cada item diz a sua data, sem fingir que o vencido vence amanhã', () => {
  const ant = msg({ verm_p: '2026-09-15', verm_t: '2026-05-18', ecto_p: '2026-09-28' }, 'antip', '2026-09-25');
  assert.ok(ant.indexOf('o vermífugo da Cookie venceu em 15/09 e o carrapaticida vence em 28/09.') > 0, ant);
  assert.ok(ant.indexOf('amanhã vencem') < 0, ant);
  const vac = msg({ vac_gripe_p: '2026-09-10', vac_raiva_p: '2026-09-28' }, 'vacina', '2026-09-25');
  assert.ok(vac.indexOf('a vacina de Gripe da Cookie venceu em 10/09 e a de Raiva vence em 28/09. Como ela estará conosco amanhã, sexta-feira (25/09),') > 0, vac);
  const agd = msg({ vac_gripe_p: '2026-09-10', vac_raiva_p: '2026-09-28' }, 'vacina', '2026-09-24', ['qui', 'sex']);
  assert.ok(agd.indexOf('A vacina de Gripe da Cookie venceu em 10/09 e a de Raiva vence em 28/09.') > 0, agd);
});
prova('"venceu em" — o que ainda vai vencer continua exatamente como antes', () => {
  const ant = msg({ ecto_p: '2026-09-28' }, 'antip', '2026-09-25');
  assert.ok(ant.indexOf('Passando para lembrar que amanhã vence o carrapaticida da Cookie.') > 0, ant);
  const agd = msg({ vac_raiva_p: '2026-09-26' }, 'vacina', '2026-09-24', ['qui', 'sex']);
  assert.ok(agd.indexOf('A vacina de Raiva da Cookie vence hoje, quinta-feira (24/09)') > 0, agd);
});

// ================================================================== pertences da hospedagem
console.log('\nPertences da hospedagem — os cinco que ela ditou, e descrever (27/set/2026)');
prova('a grade tem só Comida, Remédios, Mochila, Cama, Guia e Outro — na ordem dela, sem banco e sem caixa de cores', () => {
  igual(run('CI_PERT_DEFAULT.map(function(o){ return o.k; })'), ['comida', 'remedios', 'mochila', 'cama', 'guia', 'outro']);
  ctx.__els = { ciPertGrid: { innerHTML: '' }, ciPertSel: { innerHTML: '' } };
  run(`__bkPert={ge:document.getElementById, pb:ciPertBanco, ps:ciPertSel};
    document.getElementById=function(id){ return __els[id]||null; };
    carregarPertBanco();
    ciPertBanco.push({k:'cobertor-xadrez', nome:'Cobertor xadrez', spec:'x'});   // item criado pela equipe no banco antigo
    ciPertSel=[{uid:'u1',k:'roupa',nome:'Roupa',spec:'casaco vermelho'},{uid:'u2',k:'mochila',nome:'Mochila',spec:''},{uid:'u3',k:'comida',nome:'Comida',spec:'ração 2 kg'}];
    ciDrawPert();`);
  try {
    const grid = ctx.__els.ciPertGrid.innerHTML;
    const chips = (grid.match(/<button type="button" class="pert-chip[^"]*"[^>]*>([^<]+)/g) || []).map((c) => c.replace(/^.*>/, '').trim());
    igual(chips, ['Comida', 'Remédios', 'Mochila', 'Cama', 'Guia', 'Outro']);
    assert.ok(grid.indexOf('Cobertor') < 0 && grid.indexOf('Peitoral') < 0, 'o banco antigo não volta para a grade');
    const lista = ctx.__els.ciPertSel.innerHTML;
    assert.ok(lista.indexOf('pert-row-cor') < 0, 'sem a caixa de 17 cores');
    assert.ok(lista.indexOf('Comida') < lista.indexOf('Mochila') && lista.indexOf('Mochila') < lista.indexOf('Roupa'),
      'a lista segue a ordem dela; o item antigo (Roupa) vem depois, com o nome que tinha');
    assert.ok(lista.indexOf('placeholder="Ex.: mochila azul com patinhas"') > 0, 'o campo pede para descrever, com exemplo');
    assert.ok(lista.indexOf('value="casaco vermelho"') > 0, 'o que estava escrito na estadia antiga continua');
  } finally { run('document.getElementById=__bkPert.ge; ciPertBanco=__bkPert.pb; ciPertSel=__bkPert.ps;'); }
});
prova('na Conferência, Comida é item crítico (como a ração e a comida natural antigas); Remédios não vira trava nova (QA19 B5)', () => {
  run(`__bkCf=cfEstadia; cfEstadia={pertences:[{uid:'a',k:'comida',nome:'Comida',spec:'ração'},{uid:'b',k:'remedios',nome:'Remédios',spec:'Apoquel'},
    {uid:'c',k:'mochila',nome:'Mochila',spec:''},{uid:'d',k:'racao',nome:'Ração',spec:'Royal'}], medicacao:[], ficha:{}};`);
  try {
    const it = JSON.parse(JSON.stringify(run('cfListaItens()'))).filter((x) => x.tipo === 'pertence');
    igual(it.map((x) => [x.label, x.critico]), [['Comida — ração', true], ['Remédios — Apoquel', false], ['Mochila', false], ['Ração — Royal', true]]);
  } finally { run('cfEstadia=__bkCf;'); }
});

prova('QA19 M3 — "Outro" sem descrição não deixa salvar o check-in; com descrição, deixa', () => {
  run(`__bkO={ps:ciPertSel};`);
  try {
    run(`ciPertSel=[{uid:'o1',k:'outro',nome:'Outro',spec:'  '}];`);
    assert.ok(run('ciFaltando()').some((f) => f.f === 'ciCardPert' && /Outro/.test(f.t)), 'pede para escrever o que é');
    run(`ciPertSel=[{uid:'o1',k:'outro',nome:'Outro',spec:'cobertor azul'}];`);
    assert.ok(!run('ciFaltando()').some((f) => f.f === 'ciCardPert'), 'descrito, não pede mais nada nos pertences');
  } finally { run('ciPertSel=__bkO.ps;'); }
});
prova('QA19 B4 — no pré-preenchimento, a Ração e a Comida natural da última estadia viram Comida (com o que estava escrito)', () => {
  const e = JSON.parse(JSON.stringify(run(`ciPertAntigoParaComida({pertences:[{uid:'a',k:'racao',nome:'Ração',spec:'Royal Canin'},
    {uid:'b',k:'natural',nome:'Comida natural',spec:''},{uid:'c',k:'mochila',nome:'Mochila',spec:'azul'}]})`)));
  igual(e.pertences.map((p) => [p.k, p.nome, p.spec]), [['comida', 'Comida', 'Ração Royal Canin'], ['comida', 'Comida', 'Comida natural'], ['mochila', 'Mochila', 'azul']]);
  assert.strictEqual(e.pertences[0].uid, 'a', 'o uid fica (a Conferência guarda o V verde por uid)');
});
prova('QA19 B7 — sem o banco carregado, o nome do item continua certo ("Remédios", nunca "remedios")', () => {
  run('__bkB=ciPertBanco; ciPertBanco=[];');
  try { assert.strictEqual(run("ciPertNome('remedios')"), 'Remédios'); assert.strictEqual(run("ciPertNome('racao')"), 'Ração'); }
  finally { run('ciPertBanco=__bkB;'); }
});
prova('QA19 M4 — véspera respondida: o "fazer hoje?" não pergunta de novo nem o que ainda vai vencer (decisão de 27/set)', () => {
  const ex = JSON.stringify({ ecto_p: '2026-10-01' });
  const p = JSON.stringify({ n: 'Cookie', tutor: 'Ana', dias: ['ter', 'sex'] });
  const sem = JSON.parse(JSON.stringify(run(`hojeAntecipar(${ex}, ${p}, '2026-09-29', null)`)));
  assert.deepStrictEqual(sem.itens.map((x) => x.k), ['ecto_p'], 'sem véspera, pergunta (como antes)');
  const resp = JSON.stringify({ respostas: { antip: { v: 'sim', ts: 1 } } });
  const com = JSON.parse(JSON.stringify(run(`hojeAntecipar(${ex}, ${p}, '2026-09-29', ${resp})`)));
  assert.deepStrictEqual(com.itens.map((x) => x.k), [], 'véspera respondida: não pergunta de novo');
  const hojeResp = JSON.stringify({ respostas: { antip: { v: 'sim', ts: 1 }, ant_antip: { v: 'sim', ts: 2 } } });
  const ja = JSON.parse(JSON.stringify(run(`hojeAntecipar(${ex}, ${p}, '2026-09-29', ${hojeResp})`)));
  assert.deepStrictEqual(ja.itens.map((x) => x.k), ['ecto_p'], 'a pergunta de hoje já respondida continua (o bloco mostra a resposta)');
});
prova('QA20 L1 — a véspera só segura o item que ela LEVOU: o que nunca foi dito ao tutor continua sendo perguntado', () => {
  const ex = JSON.stringify({ ecto_p: '2026-10-01', verm_p: '2026-09-20' });
  const p = JSON.stringify({ n: 'Cookie', tutor: 'Ana', dias: ['ter', 'sex'] });
  const soVerm = JSON.stringify({ respostas: { antip: { v: 'bolsa', ts: 1 } }, itens: [{ k: 'verm_p', vence: '2026-09-20', atrasado: true }] });
  const r = JSON.parse(JSON.stringify(run(`hojeAntecipar(${ex}, ${p}, '2026-09-29', ${soVerm})`)));
  assert.deepStrictEqual(r.itens.map((x) => x.k), ['ecto_p'], 'o vermífugo (levado e respondido) sai; o carrapaticida (nunca dito) fica');
});
prova('QA20 L2 — texto à mão com um segundo "vence {quando}": ele também vira "venceu em"', () => {
  run(`__bkCfg=VENC_CFG; VENC_CFG={antip:'Passando para lembrar que {quando} vence {item} {dofilhot}. Se o vermífugo vence {quando}, podemos fazer?'};`);
  try {
    const t = msg({ verm_p: '2026-09-15', verm_t: '2026-05-18', ecto_p: '2026-09-12' }, 'antip', '2026-09-25');
    assert.ok(t.indexOf('o carrapaticida da Cookie venceu em 12/09 e o vermífugo venceu em 15/09.') > 0, t);
    assert.ok(t.indexOf('vence amanhã') < 0 && t.indexOf('vencem amanhã') < 0, t);
  } finally { run('VENC_CFG=__bkCfg;'); }
});

// ================================================================== o Plantão não apaga a ficha
console.log('\nPlantão — "Editar cadastro" grava só o que mudou, na ficha-mestre (auditoria de dados, 27/set/2026)');
prova('cadDiferenca: só o campo mudado, e nunca vazio por cima de valor', () => {
  igual(run("cadDiferenca({sexo:'Macho', chip:'', nasc:'2020-05-01'}, {sexo:'Macho', chip:'963', nasc:''})"), { chip: '963' });
  igual(run("cadDiferenca({raca:'Shih Tzu'}, {raca:'Lhasa Apso'})"), { raca: 'Lhasa Apso' });
  igual(run("cadDiferenca({}, {sexo:'', castrado:''})"), {});
});
const PLANTAO_STUBS = `__bkPl={ge:document.getElementById, sv:segVal, ss:setSeg, ah:atualizarHeader, rh:renderHosp, fd:fotoDe, db:DB, ch:currentHosp,
    pc:pelCadCache, cc:cadCache, kf:__cadKeyFixa, ca:(typeof __cadAberto!=='undefined'?__cadAberto:null), au:audit};
  __els={}; __seg={}; __grav=[]; __aud=[]; __dbVals={};
  document.getElementById=function(id){ return __els[id]||(__els[id]={value:'', style:{}, textContent:'', innerHTML:''}); };
  segVal=function(id){ return __seg[id]||''; }; setSeg=function(id,v){ __seg[id]=v||''; };
  atualizarHeader=function(){}; renderHosp=function(){}; fotoDe=function(){ return ''; };
  audit=function(a,b,c){ __aud.push({a:a,b:b,c:c}); };
  DB={ref:function(p){ return {
    update:function(v){ __grav.push({p:p, v:JSON.parse(JSON.stringify(v))}); return Promise.resolve(); },
    once:function(){ return Promise.resolve({val:function(){ return __dbVals[p]||null; }}); } }; }};`;
const PLANTAO_VOLTA = `document.getElementById=__bkPl.ge; segVal=__bkPl.sv; setSeg=__bkPl.ss; atualizarHeader=__bkPl.ah; renderHosp=__bkPl.rh;
  fotoDe=__bkPl.fd; DB=__bkPl.db; currentHosp=__bkPl.ch; pelCadCache=__bkPl.pc; cadCache=__bkPl.cc; __cadKeyFixa=__bkPl.kf; __cadAberto=__bkPl.ca; audit=__bkPl.au;`;
provaAsync('E1 — digitar o microchip no Plantão grava SÓ o microchip (a ficha mantém dias, sexo, castração e nascimento)', async () => {
  run(PLANTAO_STUBS);
  try {
    run(`currentHosp={nome:'Tico', tutor:'Joana'}; __cadKeyFixa='tico__joana'; cadCache={};
      pelCadCache={tico__joana:{nome:'Tico', tutor:'Joana', sexo:'Macho', castrado:'Sim', nasc:'2020-05-01', dias:['seg','qua'], raca:'Shih Tzu'}};
      __dbVals['daycare/cadastro/tico__joana']=pelCadCache.tico__joana;
      carregarCadastro();`);
    assert.strictEqual(run("__seg['hf-sexo']"), 'Macho', 'o formulário abre com a ficha-mestre, não com o espelho vazio');
    assert.strictEqual(run("__els['hf-nasc'].value"), '01/05/2020');
    run("__els['hf-chip'].value='963000111222333'; onCadGravar();");
    for (let i = 0; i < 20; i++) await Promise.resolve();
    const g = JSON.parse(JSON.stringify(run('__grav')));
    assert.deepStrictEqual(g.map((x) => x.p).sort(), ['auaulandia/cadastro/tico__joana', 'daycare/cadastro/tico__joana']);
    // O número vai também para `microchip`, onde o "sem microchip" mora (QA21 B1).
    g.forEach((x) => assert.deepStrictEqual(x.v, { chip: '963000111222333', microchip: '963000111222333' }, 'só o campo mudado; nada de dias, sexo ou nascimento vazios'));
    assert.strictEqual(run("__els['hf-chip'].value"), '963000111222333', 'a leitura atrasada do banco não atropela o que foi digitado');
    run('__grav=[]; onCadGravar();');
    assert.strictEqual(run('__grav.length'), 0, 'salvar de novo sem mudança não grava nada');
  } finally { run(PLANTAO_VOLTA); }
});
prova('nome apagado no Plantão não apaga o nome da ficha', () => {
  run(PLANTAO_STUBS);
  try {
    run(`currentHosp={nome:'Tico', tutor:'Joana'}; __cadKeyFixa='tico__joana'; __els['hf-nome-edit']={value:'  '}; onCadNome();`);
    assert.strictEqual(run('__grav.length'), 0);
  } finally { run(PLANTAO_VOLTA); }
});
prova('alergia de hóspede sem ficha ligada: a tela avisa em vermelho e o rastro chega à Gestão', () => {
  run(PLANTAO_STUBS);
  try {
    run(`currentHosp={nome:'Pipa', tutor:'Fulana'}; setHospAlergia('alergia','frango');`);
    assert.strictEqual(run('__grav.length'), 0, 'sem chave, não grava em ficha nenhuma (xará herdaria)');
    assert.ok(/SÓ NESTE aparelho/.test(run("__els['hf-alergia-st'].textContent")), 'avisa onde registrar');
    const a = JSON.parse(JSON.stringify(run('__aud')));
    assert.ok(a.some((x) => x.a === 'alergia-sem-ficha' && /Pipa \(Fulana\) — alergia: frango/.test(x.b)), JSON.stringify(a));
  } finally { run(PLANTAO_VOLTA); }
});

// QA21 (27/set/2026): o que a 1ª revisão do Plantão achou
console.log('\nPlantão — correções do QA21');
prova('QA21 M1 — trocar de hóspede limpa o aviso da alergia do anterior; apagar a alergia apaga o aviso', () => {
  run(PLANTAO_STUBS);
  try {
    run(`currentHosp={nome:'Pipa', tutor:'Fulana'}; setHospAlergia('alergia','frango');`);
    assert.ok(/SÓ NESTE aparelho/.test(run("__els['hf-alergia-st'].textContent")));
    run(`setHospAlergia('alergia','');`);
    assert.strictEqual(run("__els['hf-alergia-st'].textContent"), '', 'apagou a alergia: o aviso some');
    run(`setHospAlergia('alergia','frango'); __bkHs=hospedes; hospedes=[{nome:'Bolt', tutor:'Ana'}];
      try{ abrirPlantao(0); }catch(e){} hospedes=__bkHs;`);
    assert.strictEqual(run("__els['hf-alergia-st'].textContent"), '', 'o aviso da Pipa não fica na tela do Bolt');
  } finally { run(PLANTAO_VOLTA); }
});
prova('QA21 M2 — quem não edita fichas recebe a instrução certa (avisar a Gestão)', () => {
  run(PLANTAO_STUBS);
  try {
    run(`__bkCe=canEditPel; canEditPel=function(){ return false; };
      currentHosp={nome:'Pipa', tutor:'Fulana'}; setHospAlergia('alergia','frango');`);
    const t = run("__els['hf-alergia-st'].textContent");
    assert.ok(/Avise a Gestão ou a Supervisão/.test(t) && !/Cadastro de Peludinhos/.test(t), t);
    run(`canEditPel=function(){ return true; }; setHospAlergia('restricao','sem frango');`);
    assert.ok(/Cadastro de Peludinhos e registre a restrição/.test(run("__els['hf-alergia-st'].textContent")));
  } finally { run('canEditPel=__bkCe;'); run(PLANTAO_VOLTA); }
});
prova('QA21 M3 — nascimento incompleto ou impossível não vai para a ficha', () => {
  run(PLANTAO_STUBS);
  try {
    run(`currentHosp={nome:'Tico', tutor:'Joana'}; __cadKeyFixa='tico__joana'; __cadAberto={nasc:'2020-05-01'};
      document.getElementById('hf-nasc').value='01/05/2'; onCadGravar();`);
    assert.strictEqual(run('__grav.length'), 0, 'data pela metade não grava');
    run(`document.getElementById('hf-nasc').value='01/05/2099'; onCadGravar();`);
    assert.strictEqual(run('__grav.length'), 0, 'data no futuro não grava');
    run(`document.getElementById('hf-nasc').value='03/06/2021'; onCadGravar();`);
    const g = JSON.parse(JSON.stringify(run('__grav')));
    assert.ok(g.length === 2 && g.every((x) => x.v.nasc === '2021-06-03'), JSON.stringify(g));
  } finally { run(PLANTAO_VOLTA); }
});
prova('QA21 M4 — FILHOt da base fixa abre com raça, tutor e nascimento; vazio gravado não encobre valor', () => {
  run(PLANTAO_STUBS);
  try {
    const p = run('JSON.parse(JSON.stringify(PELUDINHOS[0]))');
    const k = run('pelKey(PELUDINHOS[0])');
    run(`pelCadCache={}; pelCadCache[${JSON.stringify(k)}]={raca:'', sexo:'Fêmea'};`);
    const m = JSON.parse(JSON.stringify(run(`cadMestreDe(${JSON.stringify(k)})`)));
    assert.strictEqual(m.raca, p.raca, 'raça da base fixa, apesar do "" gravado');
    assert.strictEqual(m.tutor, p.tutor);
    assert.strictEqual(m.nasc, p.nasc);
    assert.strictEqual(m.sexo, 'Fêmea', 'o que foi gravado vale por cima da base');
  } finally { run(PLANTAO_VOLTA); }
});
prova('QA21 B1 — "sem microchip" não aparece como número no campo', () => {
  run(PLANTAO_STUBS);
  try {
    run(`aplicarCadastro({microchip:Z_NAO_TEM});`);
    assert.strictEqual(run("__els['hf-chip'].value"), '');
    run(`aplicarCadastro({microchip:'98100'});`);
    assert.strictEqual(run("__els['hf-chip'].value"), '98100');
  } finally { run(PLANTAO_VOLTA); }
});
prova('QA21 B3 — trocar de hóspede antes dos 0,9 s grava o que foi digitado no anterior', () => {
  run(PLANTAO_STUBS);
  try {
    run(`__stB3=setTimeout; setTimeout=function(){ return 7; };   // o relógio de 0,9 s fica pendente
      currentHosp={nome:'Tico', tutor:'Joana'}; __cadKeyFixa='tico__joana'; __cadAberto={raca:'Shih Tzu'};
      document.getElementById('hfRaca').value='Lhasa Apso'; onCad();
      __bkHs=hospedes; hospedes=[{nome:'Bolt', tutor:'Ana'}]; try{ abrirPlantao(0); }catch(e){} hospedes=__bkHs;`);
    const g = JSON.parse(JSON.stringify(run('__grav')));
    assert.ok(g.some((x) => x.p === 'daycare/cadastro/tico__joana' && x.v.raca === 'Lhasa Apso'), JSON.stringify(g));
    assert.strictEqual(run('__cadTimer'), null, 'o relógio pendente foi desligado');
  } finally { run('setTimeout=__stB3; __cadTimer=null;'); run(PLANTAO_VOLTA); }
});
provaAsync('QA21 B5 — a leitura atrasada não atropela o que está sendo digitado (sem salvar) nem cai no hóspede seguinte', async () => {
  run(PLANTAO_STUBS);
  try {
    run(`currentHosp={nome:'Tico', tutor:'Joana'}; __cadKeyFixa='tico__joana'; cadCache={}; pelCadCache={};
      __dbVals['daycare/cadastro/tico__joana']={raca:'Shih Tzu', sexo:'Macho'};
      carregarCadastro(); document.getElementById('hfRaca').value='Lhas';`);
    for (let i = 0; i < 20; i++) await Promise.resolve();
    assert.strictEqual(run("__els['hfRaca'].value"), 'Lhas', 'o que está sendo digitado continua na tela');
    run(`currentHosp={nome:'Tico', tutor:'Joana'}; __cadKeyFixa='tico__joana'; cadCache={}; pelCadCache={};
      carregarCadastro(); currentHosp={nome:'Bolt', tutor:'Ana'}; __cadKeyFixa='bolt__ana'; document.getElementById('hfRaca').value='Poodle';`);
    for (let i = 0; i < 20; i++) await Promise.resolve();
    assert.strictEqual(run("__els['hfRaca'].value"), 'Poodle', 'a ficha do Tico não cai na tela do Bolt');
  } finally { run('try{ if(__cadTimer){ clearTimeout(__cadTimer); __cadTimer=null; } }catch(e){}'); run(PLANTAO_VOLTA); }
});

// QA22 (27/set/2026): a verificação das correções do QA21
console.log('\nPlantão — correções do QA22');
prova('QA22 — o toque abre o FILHOt tocado, mesmo quando a gravação pendente reordena a lista', () => {
  run(PLANTAO_STUBS);
  try {
    run(`__stQ1=setTimeout; setTimeout=function(){ return 7; }; __bkHsQ1=hospedes;
      __olga={nome:'Olga', tutor:'Rita'}; __zeca={nome:'Zeca', tutor:'Rui'};
      hospedes=[{nome:'Nelson', tutor:'Ana'}, {nome:'Nelson Silva', tutor:'Ana'}, __olga, __zeca];
      renderHosp=function(){ hospedes=[hospedes[0], __olga, __zeca]; };   // a gravação junta os dois Nelson
      currentHosp=hospedes[0]; __cadKeyFixa='nelson__ana'; __cadAberto={};
      document.getElementById('hf-chip').value='555'; onCad();
      try{ abrirPlantao(2); }catch(e){}`);
    assert.strictEqual(run('currentHosp===__olga'), true, 'tocou na Olga: abre a Olga');
  } finally { run('setTimeout=__stQ1; __cadTimer=null; hospedes=__bkHsQ1;'); run(PLANTAO_VOLTA); }
});
prova('QA22 — alergia e restrição sem ficha: apagar uma não esconde o aviso da outra', () => {
  run(PLANTAO_STUBS);
  try {
    run(`__lsQ3=localStorage; __locQ3={}; localStorage={getItem:function(k){ return __locQ3[k]||null; }, setItem:function(k,v){ __locQ3[k]=v; }, removeItem:function(){}};
      currentHosp={nome:'Pipa', tutor:'Fulana'};
      setHospAlergia('alergia','frango'); setHospAlergia('restricao','sem grãos'); setHospAlergia('restricao','');`);
    const t = run("__els['hf-alergia-st'].textContent");
    assert.ok(/SÓ NESTE aparelho/.test(t) && /a alergia/.test(t), 'a alergia continua só neste aparelho: ' + t);
    run(`setHospAlergia('alergia','');`);
    assert.strictEqual(run("__els['hf-alergia-st'].textContent"), '', 'as duas vazias: o aviso some');
  } finally { run('localStorage=__lsQ3;'); run(PLANTAO_VOLTA); }
});
provaAsync('QA22 — a resposta atrasada da gravação da alergia não pinta a tela de outro hóspede', async () => {
  run(PLANTAO_STUBS);
  try {
    run(`__rejQ4=null; DB={ref:function(){ return {update:function(){ return new Promise(function(ok,no){ __rejQ4=no; }); }}; }};
      currentHosp={nome:'Tico', tutor:'Joana', refKey:'tico__joana'}; setHospAlergia('alergia','frango');
      currentHosp={nome:'Bolt', tutor:'Ana'}; document.getElementById('hf-alergia-st').textContent='';
      __rejQ4(new Error('sem rede'));`);
    for (let i = 0; i < 20; i++) await Promise.resolve();
    assert.strictEqual(run("__els['hf-alergia-st'].textContent"), '', 'a tela do Bolt não recebe o "NÃO salvou" do Tico');
  } finally { run(PLANTAO_VOLTA); }
});
prova('QA22 — trocar o dia com a ficha aberta grava o que estava esperando os 0,9 s', () => {
  run(PLANTAO_STUBS);
  try {
    run(`__stQ5=setTimeout; setTimeout=function(){ return 7; }; cadCache={}; pelCadCache={};
      currentHosp={nome:'Tico', tutor:'Joana'}; __cadKeyFixa='tico__joana'; __cadAberto={raca:'Shih Tzu'};
      document.getElementById('hfRaca').value='Lhasa Apso'; onCad(); carregarCadastro();`);
    const g = JSON.parse(JSON.stringify(run('__grav')));
    assert.ok(g.some((x) => x.p === 'daycare/cadastro/tico__joana' && x.v.raca === 'Lhasa Apso'), JSON.stringify(g));
  } finally { run('setTimeout=__stQ5; __cadTimer=null;'); run(PLANTAO_VOLTA); }
});
prova('QA22 — ano com 2 dígitos no meio da digitação não grava; ao sair do campo, a data completa grava', () => {
  run(PLANTAO_STUBS);
  try {
    run(`__stQ6=setTimeout; __tQ6=[]; setTimeout=function(fn){ __tQ6.push(fn); return 7; };
      currentHosp={nome:'Tico', tutor:'Joana'}; __cadKeyFixa='tico__joana'; __cadAberto={};
      document.getElementById('hf-nasc').value='15/03/19';`);
    const r = JSON.parse(JSON.stringify(run('cadGravarAgora()')));
    assert.strictEqual(run('__grav.length'), 0, '"15/03/19" não vira 2019 na ficha');
    assert.deepStrictEqual(r.recusados, ['nasc']);
    assert.ok(/Data de nascimento incompleta/.test(run('cadTextoSalvar(' + JSON.stringify(r) + ')')));
    run(`normalizarNasc(); __tQ6.forEach(function(f){ f(); });`);
    assert.strictEqual(run("__els['hf-nasc'].value"), '15/03/2019');
    const g = JSON.parse(JSON.stringify(run('__grav')));
    assert.ok(g.length === 2 && g.every((x) => x.v.nasc === '2019-03-15'), JSON.stringify(g));
    assert.strictEqual(run('__cadTimer'), null, 'o relógio que disparou fica zerado');
  } finally { run('setTimeout=__stQ6; __cadTimer=null;'); run(PLANTAO_VOLTA); }
});
prova('QA22 — sem banco, o Salvar diz que não salvou, e a próxima tentativa grava', () => {
  run(PLANTAO_STUBS);
  try {
    run(`__dbQ7=DB; DB=null; currentHosp={nome:'Tico', tutor:'Joana'}; __cadKeyFixa='tico__joana'; __cadAberto={raca:'Shih Tzu'};
      document.getElementById('hfRaca').value='Lhasa Apso'; __rQ7=cadGravarAgora();`);
    assert.strictEqual(run('__rQ7.semBanco'), true);
    assert.ok(/não salvou/.test(run('cadTextoSalvar(__rQ7)')));
    run('DB=__dbQ7; __rQ7=cadGravarAgora();');
    assert.strictEqual(run('__rQ7.gravou'), true, 'a mudança não se perdeu: grava na volta do banco');
    assert.ok(JSON.parse(JSON.stringify(run('__grav'))).some((x) => x.v.raca === 'Lhasa Apso'));
  } finally { run(PLANTAO_VOLTA); }
});
prova('QA22 — o botão Salvar diz o que gravou e o que não gravou', () => {
  const t = (r) => run('cadTextoSalvar(' + JSON.stringify(r) + ')');
  assert.strictEqual(t({ gravou: true }), '✅ Salvo');
  assert.strictEqual(t({ gravou: false }), '✅ Cadastro salvo');
  assert.strictEqual(t({ gravou: false, recusados: ['nasc'] }), '⚠ Data de nascimento incompleta: não gravou a data. Confira', 'nada gravou: não diz "salvo"');
  assert.strictEqual(t({ gravou: true, recusados: ['nasc'] }), '✅ Salvo. Data de nascimento incompleta: não gravou a data. Confira');
  assert.ok(/^✅ Salvo\. Para apagar, use o Cadastro de Peludinhos$/.test(t({ gravou: true, apagados: 1 })), t({ gravou: true, apagados: 1 }));
});
prova('QA22 — fechar o card grava o que estava esperando', () => {
  run(PLANTAO_STUBS);
  try {
    run(`__stQ9=setTimeout; setTimeout=function(){ return 7; };
      currentHosp={nome:'Tico', tutor:'Joana'}; __cadKeyFixa='tico__joana'; __cadAberto={raca:'Shih Tzu'};
      document.getElementById('card-cadastro').style.display='block';
      document.getElementById('hfRaca').value='Lhasa Apso'; onCad(); toggleCadastro();`);
    assert.ok(JSON.parse(JSON.stringify(run('__grav'))).some((x) => x.v.raca === 'Lhasa Apso'));
    assert.strictEqual(run("__els['card-cadastro'].style.display"), 'none');
  } finally { run('setTimeout=__stQ9; __cadTimer=null;'); run(PLANTAO_VOLTA); }
});
prova('QA22–QA24 — microchip: toda edição humana grava chip e microchip juntos', () => {
  igual(run("zChipPatch('98100')"), { microchip: '98100', chip: '98100' });
  igual(run("zChipPatch(Z_NAO_TEM)"), { microchip: 'nao-tem', chip: '' });
  igual(run("zChipPatch('')"), { microchip: '', chip: '' });
  run(`__bkQ10={sp:setPelExtra, pa:pelAtual, rf:renderPelFicha, au:audit};
    __pQ10=[]; setPelExtra=function(p,patch){ __pQ10.push(JSON.parse(JSON.stringify(patch))); return Promise.resolve({ok:true}); };
    renderPelFicha=function(){}; audit=function(){}; pelAtual={n:'Tico', tutor:'Joana'};`);
  try {
    run('pelChipNaoTemGravar(); pelChipNaoTemLimpar();');
    const ps = JSON.parse(JSON.stringify(run('__pQ10')));
    assert.strictEqual(ps[0].microchip, 'nao-tem'); assert.strictEqual(ps[0].chip, '');
    assert.strictEqual(ps[1].microchip, ''); assert.strictEqual(ps[1].chip, '');
    assert.strictEqual(run("zChipNumero(Object.assign({chip:'111'}, " + JSON.stringify(ps[0]) + '))'), '', 'o "não tem" vale sobre o número antigo');
    assert.ok(/onchange="setPelExtra\(pelAtual,zChipPatch\(this\.value\)\)"/.test(fs.readFileSync(APP, 'utf8')), 'o campo do Cadastro grava os dois');
  } finally { run('setPelExtra=__bkQ10.sp; pelAtual=__bkQ10.pa; renderPelFicha=__bkQ10.rf; audit=__bkQ10.au;'); }
});
prova('QA25 — check-in: "cadastro faltando", "sem microchip" e FILHOt novo gravam chip e microchip juntos', () => {
  run(`__bkQ14={sp:setPelExtra, cp:ciPelAtual, cf:cadastroFaltando, ge:document.getElementById, db:DB, au:audit, gc:gateCadastro, ce:ciEscolher, ss:setSeg, pl:PELUDINHOS.slice()};
    __pQ14=[]; setPelExtra=function(p,patch){ __pQ14.push(JSON.parse(JSON.stringify(patch))); return new Promise(function(){}); };
    __elsQ14={}; document.getElementById=function(id){ return __elsQ14[id]||(__elsQ14[id]={value:'', style:{}, textContent:'', innerHTML:''}); };
    __rcQ14=[]; DB={ref:function(p){ return {update:function(v){ __rcQ14.push({p:p, v:JSON.parse(JSON.stringify(v))}); return new Promise(function(){}); }}; }};
    audit=function(){}; gateCadastro=function(){ return true; }; ciEscolher=function(){}; setSeg=function(){};
    ciPelAtual={n:'Tico', tutor:'Joana'}; cadastroFaltando=function(){ return [{c:'chip'}]; };`);
  try {
    run(`document.getElementById('ciCadF_chip').value='98100'; try{ ciSalvarCadastroFalta(); }catch(e){}
      try{ ciMarcarSemMicrochip(null); }catch(e){}`);
    const ps = JSON.parse(JSON.stringify(run('__pQ14')));
    assert.ok(ps[0] && ps[0].chip === '98100' && ps[0].microchip === '98100', '"cadastro faltando": ' + JSON.stringify(ps[0]));
    assert.ok(ps[1] && ps[1].microchip === 'nao-tem' && ps[1].chip === '', '"sem microchip": ' + JSON.stringify(ps[1]));
    run(`document.getElementById('ciNovoNome').value='Zuzu'; document.getElementById('ciNovoTutor').value='Lia';
      document.getElementById('ciNovoRaca').value='SRD'; document.getElementById('ciNovoChip').value='77001'; __rcQ14=[];
      ciCriarNovoHospede(null);`);
    const rc = JSON.parse(JSON.stringify(run("__rcQ14.filter(function(x){ return /^daycare\\/cadastro\\//.test(x.p); })")));
    assert.ok(rc.length === 1 && rc[0].v.chip === '77001' && rc[0].v.microchip === '77001', 'FILHOt novo: ' + JSON.stringify(rc));
  } finally { run(`setPelExtra=__bkQ14.sp; ciPelAtual=__bkQ14.cp; cadastroFaltando=__bkQ14.cf; document.getElementById=__bkQ14.ge; DB=__bkQ14.db;
    audit=__bkQ14.au; gateCadastro=__bkQ14.gc; ciEscolher=__bkQ14.ce; setSeg=__bkQ14.ss; PELUDINHOS.length=0; __bkQ14.pl.forEach(function(p){ PELUDINHOS.push(p); });`); }
});
prova('QA24 — texto da IA ou da resposta do tutor em "Microchip" nunca troca nem apaga o número verdadeiro', () => {
  run(`__bkQ11={db:DB, ce:canEditPel}; __gQ11=[];
    DB={ref:function(p){ return {update:function(v){ __gQ11.push(JSON.parse(JSON.stringify(v))); return Promise.resolve(); }}; }};
    canEditPel=function(){ return true; };`);
  try {
    run(`setPelExtra({n:'Tico', tutor:'Joana'}, {microchip:'Tem microchip sim, no pescoço'});
      setPelExtra({n:'Tico', tutor:'Joana'}, {microchip:null});`);
    const g = JSON.parse(JSON.stringify(run('__gQ11')));
    assert.ok(g.length === 2 && g.every((x) => !Object.prototype.hasOwnProperty.call(x, 'chip')), JSON.stringify(g));
    assert.strictEqual(run("zChipNumero({chip:'963000111222333', microchip:'Tem microchip sim, no pescoço'})"), '963000111222333');
  } finally { run('DB=__bkQ11.db; canEditPel=__bkQ11.ce;'); }
});
prova('QA23 — o Plantão mostra o microchip da ficha-mestre, mesmo apagado ou "não tem"', () => {
  run(PLANTAO_STUBS);
  try {
    run(`currentHosp={nome:'Tico', tutor:'Joana'}; __cadKeyFixa='tico__joana';
      cadCache={}; cadCache[cadKey(currentHosp)]={chip:'963000111222333'};
      pelCadCache={tico__joana:{chip:'', microchip:Z_NAO_TEM}}; DB=null; carregarCadastro();`);
    assert.strictEqual(run("__els['hf-chip'].value"), '', '"não tem" na ficha: o número antigo da cópia não aparece');
    run(`pelCadCache={tico__joana:{chip:'', microchip:''}}; carregarCadastro();`);
    assert.strictEqual(run("__els['hf-chip'].value"), '', 'número apagado na ficha: não volta');
    run(`pelCadCache={tico__joana:{chip:'555', microchip:'555'}}; carregarCadastro();`);
    assert.strictEqual(run("__els['hf-chip'].value"), '555', 'número trocado na ficha: aparece o novo');
  } finally { run(PLANTAO_VOLTA); }
});
provaAsync('QA24 — a leitura do banco também respeita o microchip da ficha-mestre', async () => {
  run(PLANTAO_STUBS);
  try {
    run(`currentHosp={nome:'Tico', tutor:'Joana'}; __cadKeyFixa='tico__joana'; cadCache={}; pelCadCache={};
      __dbVals['auaulandia/cadastro/'+cadKey(currentHosp)]={chip:'963000111222333'};
      __dbVals['daycare/cadastro/tico__joana']={chip:'', microchip:Z_NAO_TEM};
      carregarCadastro();`);
    for (let i = 0; i < 20; i++) await Promise.resolve();
    assert.strictEqual(run("__els['hf-chip'].value"), '', 'a cópia do Plantão não traz de volta o número');
  } finally { run(PLANTAO_VOLTA); }
});
prova('QA23 — o microchip anotado neste aparelho não encobre a ficha-mestre nos cards', () => {
  run(`__bkQ12={ls:localStorage, pc:pelCadCache}; __locQ12={};
    localStorage={getItem:function(k){ return __locQ12[k]||null; }, setItem:function(k,v){ __locQ12[k]=v; }, removeItem:function(){}};`);
  try {
    run(`__hQ12={nome:'Tico', tutor:'Joana'}; setInfo(__hQ12, {chip:'963000111222333'});
      pelCadCache={tico__joana:{chip:'', microchip:Z_NAO_TEM}};`);
    assert.strictEqual(run('chipDe(__hQ12)'), '');
    assert.strictEqual(run('zChipNaoTem(extraDoHosp(__hQ12))'), true);
    run(`pelCadCache={};`);
    assert.strictEqual(run('chipDe(__hQ12)'), '963000111222333', 'sem ficha-mestre, vale o que foi anotado aqui');
  } finally { run('localStorage=__bkQ12.ls; pelCadCache=__bkQ12.pc;'); }
});
prova('QA23 — FILHOt novo no check-in com o mesmo nome e tutor de outro (raça diferente) não grava por cima', () => {
  run(`__bkQ13={pl:PELUDINHOS.slice(), db:DB, ge:document.getElementById, gc:gateCadastro, ce:ciEscolher, au:audit, ss:setSeg};
    setSeg=function(){};
    __elsQ13={ciNovoNome:{value:'Mel'}, ciNovoTutor:{value:'Ana'}, ciNovoRaca:{value:'Poodle'}, ciNovoWarn:{textContent:'', innerHTML:''}};
    document.getElementById=function(id){ return __elsQ13[id]||(__elsQ13[id]={value:'', style:{}, textContent:'', innerHTML:''}); };
    gateCadastro=function(){ return true; }; ciEscolher=function(){}; audit=function(){}; __gQ13=[];
    DB={ref:function(p){ return {update:function(v){ __gQ13.push(p); return Promise.resolve(); }}; }};
    PELUDINHOS.push({n:'Mel', tutor:'Ana', raca:'Shih Tzu', dias:['seg']});`);
  try {
    const n0 = run('PELUDINHOS.length');
    run('ciCriarNovoHospede(null);');
    assert.strictEqual(run('__gQ13.length'), 0, 'nada vai para a ficha da Mel que já existe');
    assert.strictEqual(run('PELUDINHOS.length'), n0, 'não duplica a Mel na lista');
    assert.ok(/Já existe "Mel"/.test(run('__elsQ13.ciNovoWarn.innerHTML')), run('__elsQ13.ciNovoWarn.innerHTML'));
    run(`__elsQ13.ciNovoNome.value='Nina'; __elsQ13.ciNovoTutor.value='Bia'; __elsQ13.ciNovoRaca.value='SRD'; __gQ13=[];
      __rcQ13=[]; DB={ref:function(p){ return {update:function(v){ __rcQ13.push(JSON.parse(JSON.stringify(v))); return Promise.resolve(); }}; }};
      ciCriarNovoHospede(null);`);
    const rc = JSON.parse(JSON.stringify(run('__rcQ13')));
    assert.ok(rc.length === 1 && !('chip' in rc[0]) && !('microchip' in rc[0]), 'sem número, não grava chip nem microchip: ' + JSON.stringify(rc));
  } finally { run('PELUDINHOS.length=0; __bkQ13.pl.forEach(function(p){ PELUDINHOS.push(p); }); DB=__bkQ13.db; document.getElementById=__bkQ13.ge; gateCadastro=__bkQ13.gc; ciEscolher=__bkQ13.ce; audit=__bkQ13.au; setSeg=__bkQ13.ss;'); }
});

// ================================================================== banho de quem faltou
console.log('\nBanho de quem faltou — liberar o horário e avisar (Adriana, 28/set/2026, caso da Jasmine; QA28)');
const BF_STUBS = `__bkBF={P:PELUDINHOS, pe:pelExtra, rl:repLancamentos, db:DB, de:dashEspelhar, sp:setPelExtra, ac:banhoAutoPedirConferencia,
    za:zAlertao, ze:zEscolha, rp:repPodeLancar, au:audit, hr:hojeRedesenhar, rd:renderDash, pt:pessoaDoTurno, dc:dcChamada, st:setTimeout,
    ge:document.getElementById, bf:BANHO_FALTA, bd:BANHO_FALTA_DEC, bdia:BANHO_FALTA_DIA, bv:BANHO_FALTA_VISTO, bt:BANHO_FALTA_TRAVA, bc:BANHO_FALTA_CHEGOU};
  __jas={n:'Jasmine', tutor:'Ana', dias:['seg']}; __bol={n:'Bolt', tutor:'Rui', dias:['seg']}; __mel={n:'Mel', tutor:'Lia', dias:['seg']};
  PELUDINHOS=[__jas, __bol, __mel];
  __extra={}; pelExtra=function(p){ return (p&&__extra[p.n])||{}; };
  __lancR={}; repLancamentos=function(p){ return __lancR[p.n]||[]; };
  __esp=[]; __espResp={ok:true, removidos:1}; dashEspelhar=function(k,id,reg,acao,dia){ __esp.push({k:k,id:id,valor:reg.valor,hora:reg.hora,acao:acao,dia:dia}); return Promise.resolve(__espResp); };
  __pel=[]; setPelExtra=function(p,patch){ __pel.push({n:p.n, patch:JSON.parse(JSON.stringify(patch))}); return Promise.resolve({ok:true}); };
  banhoAutoPedirConferencia=function(){}; __alertas=[]; zAlertao=function(t,l,op){ __alertas.push({t:t, l:l}); if(op&&op.aoFechar) __aoFechar=op.aoFechar; };
  __esc=[]; zEscolha=function(t,l,b){ __esc.push({t:t, l:l, b:b.map(function(x){ return x.t; }), fn:b.map(function(x){ return x.fn; })}); };
  __pode=true; repPodeLancar=function(){ return __pode; }; audit=function(){}; hojeRedesenhar=function(){}; renderDash=function(){};
  pessoaDoTurno=function(){ return 'Márcia'; }; setTimeout=function(){ return 0; };
  __cartaz=false; document.getElementById=function(id){ if(id==='zAlertaoBox'||id==='repMsgBox') return __cartaz?{}:null; return {style:{}, value:'', textContent:'', innerHTML:''}; };
  __banco={}; __gravBF=[]; __rmBF=[]; DB={ref:function(p){ return {
    set:function(v){ __banco[p]=JSON.parse(JSON.stringify(v)); __gravBF.push({p:p, v:__banco[p]}); return Promise.resolve(); },
    remove:function(){ __rmBF.push(p); return Promise.resolve(); },
    transaction:function(fn){ var r=fn(__banco[p]===undefined?null:__banco[p]);
      if(r===undefined) return Promise.resolve({committed:false, snapshot:{val:function(){ return __banco[p]; }}});
      __banco[p]=JSON.parse(JSON.stringify(r)); return Promise.resolve({committed:true, snapshot:{val:function(){ return __banco[p]; }}}); },
    once:function(){ return Promise.resolve({val:function(){ return null; }}); } }; }};
  BANHO_FALTA=[]; BANHO_FALTA_DEC={}; BANHO_FALTA_DIA=''; BANHO_FALTA_VISTO={}; BANHO_FALTA_TRAVA={}; BANHO_FALTA_CHEGOU=[];`;
const BF_VOLTA = `PELUDINHOS=__bkBF.P; pelExtra=__bkBF.pe; repLancamentos=__bkBF.rl; DB=__bkBF.db; dashEspelhar=__bkBF.de; setPelExtra=__bkBF.sp;
  banhoAutoPedirConferencia=__bkBF.ac; zAlertao=__bkBF.za; zEscolha=__bkBF.ze; repPodeLancar=__bkBF.rp; audit=__bkBF.au; hojeRedesenhar=__bkBF.hr;
  renderDash=__bkBF.rd; pessoaDoTurno=__bkBF.pt; dcChamada=__bkBF.dc; setTimeout=__bkBF.st; document.getElementById=__bkBF.ge; BANHO_FALTA=__bkBF.bf; BANHO_FALTA_DEC=__bkBF.bd;
  BANHO_FALTA_DIA=__bkBF.bdia; BANHO_FALTA_VISTO=__bkBF.bv; BANHO_FALTA_TRAVA=__bkBF.bt; BANHO_FALTA_CHEGOU=__bkBF.bc;`;
const tick = async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); };
prova('quem faltou e tinha banho: lançamento (todos os do dia), planilha, banho fixo, falta avisada no app e na coluna da planilha', () => {
  run(BF_STUBS);
  try {
    const dia = '2026-09-28';   // segunda
    run(`__extra.Mel={banho_rec:{ativo:true, freq:'semanal', dia:'seg', hora:'14:00', desde:'2026-09-01'}};
      __lancR.Bolt=[{_id:'c1', tipo:'credito', data:'${dia}', motivo:'viagem'}];`);
    const kJ = run("dcKey('Jasmine','Ana')");
    const chamada = { [kJ]: 'faltou', [run("dcKey('Mel','Lia')")]: 'faltou' };
    const lancs = { L1: { chave: kJ, valor: 'JASMINE', hora: '10:00' }, L2: { chave: kJ, valor: 'JASMINE (hidratação)', hora: '15:00' } };
    const plan = [{ p: { n: 'Bolt', tutor: 'Rui' }, hora: '11:30', txt: 'BOLT' }, { p: { n: 'Jasmine', tutor: 'Ana' }, hora: '10:00', txt: 'JASMINE' }];
    const L = JSON.parse(JSON.stringify(run(`banhoFaltaLista('${dia}', ${JSON.stringify(chamada)}, ${JSON.stringify(lancs)}, ${JSON.stringify(plan)}, [])`)));
    igual(L.map((o) => [o.nome, o.hora, o.origem, o.porque, !!o.fixo, o.lancs.length, o.txts.length]), [
      ['Jasmine', '10:00 e 15:00', 'lancamento', 'faltou', false, 2, 0],
      ['Bolt', '11:30', 'planilha', 'avisada', false, 0, 1],
      ['Mel', '14:00', 'fixo', 'faltou', true, 0, 0]]);
    // a coluna "Faltas Avisadas" da planilha também conta (QA28)
    run('__lancR={};');
    const L2 = JSON.parse(JSON.stringify(run(`banhoFaltaLista('${dia}', {}, {}, ${JSON.stringify(plan.slice(0, 1))}, [{p:{n:'Bolt', tutor:'Rui'}, txt:'BOLT'}])`)));
    igual(L2.map((o) => [o.nome, o.porque]), [['Bolt', 'avisada']]);
    igual(JSON.parse(JSON.stringify(run(`banhoFaltaLista('${dia}', {}, ${JSON.stringify(lancs)}, [], [])`))), [], 'ninguém faltou: nada a liberar');
  } finally { run(BF_VOLTA); }
});
provaAsync('liberar: tira os banhos do dia pelo caminho de cada um, e só diz "liberado" quando a planilha confirmou', async () => {
  run(BF_STUBS);
  try {
    const dia = '2026-09-28';
    const kJ = run("dcKey('Jasmine','Ana')");
    run(`__extra.Mel={banho_rec:{ativo:true, freq:'semanal', dia:'seg', hora:'14:00', desde:'2026-09-01'}};`);
    await run(`banhoFaltaExecutar({chave:'${kJ}', nome:'Jasmine', hora:'10:00 e 15:00', origem:'lancamento', lancs:[{id:'L1', reg:{valor:'JASMINE', hora:'10:00'}}, {id:'L2', reg:{valor:'JASMINE (hidratação)', hora:'15:00'}}], txts:[], fixo:false}, '${dia}')`);
    await tick();
    igual(JSON.parse(JSON.stringify(run('__rmBF'))).sort(), ['daycare/dashboard/' + dia + '/banho/L1', 'daycare/dashboard/' + dia + '/banho/L2']);
    assert.strictEqual(run(`__banco['daycare/banho-falta/${dia}/${kJ}'].decisao`), 'liberado');
    assert.strictEqual(run(`__banco['daycare/banho-falta/${dia}/${kJ}'].quem`), 'Márcia');
    assert.ok(/HORÁRIO LIBERADO/.test(run('__alertas[0].t')));
    // banho fixo: o "pular" do dia, pela porta dos Banhos recorrentes
    await run(`banhoFaltaExecutar({chave:dcKey('Mel','Lia'), nome:'Mel', hora:'14:00', origem:'fixo', lancs:[], txts:[], fixo:true}, '${dia}')`);
    await tick();
    const pel = JSON.parse(JSON.stringify(run('__pel')));
    assert.ok(pel.length === 1 && pel[0].patch.banho_rec.excecoes[dia].pular === true && pel[0].patch.banho_rec.excecoes[dia].motivo === 'faltou', JSON.stringify(pel));
    // escrito direto na planilha, com a ponte fora do ar: NÃO grava "liberado"; o botão continua
    run(`__esp=[]; __alertas=[]; __espResp={ok:false, erro:'a ponte não respondeu'};`);
    await run(`banhoFaltaExecutar({chave:dcKey('Bolt','Rui'), nome:'Bolt', hora:'11:30', origem:'planilha', lancs:[], txts:[{txt:'BOLT', hora:'11:30'}], fixo:false}, '${dia}')`);
    await tick();
    const e = JSON.parse(JSON.stringify(run('__esp')));
    assert.ok(e.length === 1 && e[0].acao === 'remover' && e[0].valor === 'BOLT', JSON.stringify(e));
    assert.strictEqual(run(`__banco['daycare/banho-falta/${dia}/'+dcKey('Bolt','Rui')].decisao`), 'falhou');
    assert.ok(/NÃO LIBEREI/.test(run('__alertas[0].t')), JSON.stringify(run('__alertas')));
    // a ponte respondeu, mas não achou a linha (texto mudado à mão): também não é "liberado"
    run(`__alertas=[]; __espResp={ok:true, removidos:0};`);
    await run(`banhoFaltaExecutar({chave:dcKey('Bolt','Rui'), nome:'Bolt', hora:'11:30', origem:'planilha', lancs:[], txts:[{txt:'BOLT', hora:'11:30'}], fixo:false}, '${dia}')`);
    await tick();
    assert.strictEqual(run(`__banco['daycare/banho-falta/${dia}/'+dcKey('Bolt','Rui')].decisao`), 'falhou');
    // lançamento que saiu do app, mas a planilha não confirmou: "liberado", com o aviso de tirar à mão
    run(`__alertas=[]; __espResp={ok:false, erro:'sem rede'}; delete __banco['daycare/banho-falta/${dia}/${kJ}'];`);
    await run(`banhoFaltaExecutar({chave:'${kJ}', nome:'Jasmine', hora:'10:00', origem:'lancamento', lancs:[{id:'L9', reg:{valor:'JASMINE', hora:'10:00'}}], txts:[], fixo:false}, '${dia}')`);
    await tick();
    assert.strictEqual(run(`__banco['daycare/banho-falta/${dia}/${kJ}'].planilha_ok`), false);
    assert.ok(/NÃO DA PLANILHA/.test(run('__alertas[0].t')));
  } finally { run(BF_VOLTA); }
});
provaAsync('dois aparelhos: quem decide primeiro vale; o segundo vê quem decidiu e não tira de novo', async () => {
  run(BF_STUBS);
  try {
    const dia = '2026-09-28';
    run(`__banco['daycare/banho-falta/${dia}/jas']={decisao:'liberado', quem:'Carla', ts:Date.now()};`);
    await run(`banhoFaltaManter({chave:'jas', nome:'Jasmine', hora:'10:00', origem:'lancamento', lancs:[], txts:[], fixo:false}, '${dia}')`);
    await tick();
    assert.strictEqual(run(`__banco['daycare/banho-falta/${dia}/jas'].decisao`), 'liberado', '"ainda vem" não desfaz o que outro aparelho liberou');
    assert.ok(/JÁ FOI DECIDIDO/.test(run('__alertas[0].t')) && /Carla já liberou/.test(run('__alertas[0].l[0]')), JSON.stringify(run('__alertas')));
    run('__alertas=[]; __rmBF=[];');
    await run(`banhoFaltaExecutar({chave:'jas', nome:'Jasmine', hora:'10:00', origem:'lancamento', lancs:[{id:'L1', reg:{valor:'JASMINE'}}], txts:[], fixo:false}, '${dia}')`);
    await tick();
    assert.strictEqual(run('__rmBF.length'), 0, 'liberar de novo não tira nada');
    // "ainda vem" sobre nada: grava; e depois "liberar" ainda pode (o botão continua no cartão)
    await run(`banhoFaltaManter({chave:'mel', nome:'Mel', hora:'14:00', origem:'fixo', lancs:[], txts:[], fixo:true}, '${dia}')`);
    await tick();
    assert.strictEqual(run(`__banco['daycare/banho-falta/${dia}/mel'].decisao`), 'mantido');
  } finally { run(BF_VOLTA); }
});
prova('banho fixo com "ainda vem": o automático deixa o banho na planilha mesmo com a falta', () => {
  run(`__bkBM={pe:pelExtra, dc:dcChamada, rl:repLancamentos, hz:zHojeISO};
    zHojeISO=function(){ return '2026-09-28'; }; repLancamentos=function(){ return []; };
    __exBM={banho_rec:{ativo:true, freq:'semanal', dia:'seg', hora:'14:00', desde:'2026-09-01'}}; pelExtra=function(){ return __exBM; };
    dcChamada={}; dcChamada[dcKey('Mel','Lia')]='faltou';`);
  try {
    igual(run("banhoAutoPodeNoDia({n:'Mel', tutor:'Lia'}, '2026-09-28', true)"), false, 'faltou: o fixo sai');
    run(`__exBM.banho_rec.excecoes={'2026-09-28':{manter:true, motivo:'ainda vem'}};`);
    igual(run("banhoAutoPodeNoDia({n:'Mel', tutor:'Lia'}, '2026-09-28', true)"), true, '"ainda vem": o fixo fica');
  } finally { run('pelExtra=__bkBM.pe; dcChamada=__bkBM.dc; repLancamentos=__bkBM.rl; zHojeISO=__bkBM.hz;'); }
});
prova('o aviso não atropela outro cartaz, aparece só para quem cuida dos lançamentos, e não volta depois de decidido', () => {
  run(BF_STUBS);
  try {
    const dia = run('dcDataKey()');
    run(`BANHO_FALTA=[{chave:'jas', nome:'Jasmine', hora:'10:00', origem:'lancamento', lancs:[], txts:[], porque:'faltou'}]; BANHO_FALTA_DIA='${dia}';
      __cartaz=true; banhoFaltaPerguntar('${dia}');`);
    assert.strictEqual(run('__esc.length'), 0, 'outro cartaz aberto: o aviso espera');
    run(`__cartaz=false; __pode=false; banhoFaltaPerguntar('${dia}');`);
    assert.strictEqual(run('__esc.length'), 0, 'monitora não recebe o aviso');
    run(`__pode=true; banhoFaltaPerguntar('${dia}');`);
    const esc = JSON.parse(JSON.stringify(run('__esc.map(function(x){ return {t:x.t, b:x.b, l:x.l}; })')));
    assert.ok(esc.length === 1 && /JASMINE NÃO VEIO — TINHA BANHO ÀS 10:00/.test(esc[0].t), JSON.stringify(esc));
    igual(esc[0].b, ['Liberar o horário', 'Ainda vem', 'Decidir depois'], 'sem o sexo na ficha: texto neutro');
    assert.ok(esc[0].l.some((x) => /Se ainda vier \(chegar mais tarde\)/.test(x)), JSON.stringify(esc[0].l));
    run('__esc[0].fn[2]();');   // Decidir depois
    run(`banhoFaltaPerguntar('${dia}');`);
    assert.strictEqual(run('__esc.length'), 1, 'decidir depois: não repete no aparelho');
    run(`BANHO_FALTA_VISTO={}; BANHO_FALTA_DEC={jas:{decisao:'mantido', quem:'Márcia'}}; banhoFaltaPerguntar('${dia}');`);
    assert.strictEqual(run('__esc.length'), 1, 'alguém já decidiu: não pergunta de novo');
  } finally { run(BF_VOLTA); }
});
prova('Hoje na Zêluz: o cartão mostra o botão, o que foi decidido, e quem chegou depois de liberado', () => {
  run(BF_STUBS);
  try {
    const dia = run('dcDataKey()');
    run(`BANHO_FALTA=[{chave:'jas', nome:'Jasmine', hora:'10:00', origem:'lancamento', porque:'faltou'},
        {chave:'mel', nome:'Mel', hora:'14:00', origem:'fixo', fixo:true, porque:'avisada'},
        {chave:'bol', nome:'Bolt', hora:'11:30', origem:'planilha', porque:'faltou'}];
      BANHO_FALTA_DIA='${dia}'; BANHO_FALTA_DEC={mel:{decisao:'liberado', quem:'Márcia'}, bol:{decisao:'mantido', quem:'Carla'}};
      BANHO_FALTA_CHEGOU=[{chave:'tob', nome:'Toby', hora:'09:00'}];`);
    const h = run('banhoFaltaCardHTML()');
    assert.ok(/Banho de quem faltou/.test(h) && /Jasmine/.test(h) && /banho às 10:00/.test(h), h);
    assert.ok(/horário liberado por Márcia/.test(h) && /\(fixo\)/.test(h) && /falta avisada/.test(h), h);
    assert.ok(/Carla disse que ainda vem/.test(h) && (h.match(/Liberar o horário/g) || []).length === 2, '"ainda vem" continua com o botão de liberar');
    assert.ok(/Toby/.test(h) && /chegou depois de o horário das 09:00 ser liberado/.test(h), h);
    run(`BANHO_FALTA_DIA='2026-01-01';`);
    assert.strictEqual(run('banhoFaltaCardHTML()'), '', 'lista de outro dia não aparece');
  } finally { run(BF_VOLTA); }
});
prova('o despertador do banho não chama quem faltou nem quem avisou a falta', () => {
  run(`__bkDB={pr:papelRecebeAlarme, eh:ehHoje, pd:planDia, db:despBaixa, md:mostrarDespertador, dc:dcChamada, dn:despNaTela, rl:repLancamentos};
    papelRecebeAlarme=function(){ return true; }; ehHoje=function(){ return true; }; despBaixa={}; despNaTela=null; __desp=[];
    repLancamentos=function(){ return []; };
    mostrarDespertador=function(it){ __desp.push(it.p.n); };
    var _d=new Date(Date.now()+2*60000), _h=String(_d.getHours()).padStart(2,'0')+':'+String(_d.getMinutes()).padStart(2,'0');
    planDia={lida:true, banho:[{p:{n:'Jasmine', tutor:'Ana'}, hora:_h}], faltas:[]};`);
  try {
    run(`dcChamada={}; dcChamada[dcKey('Jasmine','Ana')]='faltou'; checarDespertadorBanho();`);
    assert.strictEqual(run('__desp.length'), 0, 'faltou: não toca');
    run(`dcChamada={}; planDia.faltas=[{p:{n:'Jasmine', tutor:'Ana'}}]; checarDespertadorBanho();`);
    assert.strictEqual(run('__desp.length'), 0, 'falta avisada na planilha: não toca');
    run(`planDia.faltas=[]; checarDespertadorBanho();`);
    assert.strictEqual(run('__desp.length'), 1, 'veio: toca como sempre');
  } finally { run('papelRecebeAlarme=__bkDB.pr; ehHoje=__bkDB.eh; planDia=__bkDB.pd; despBaixa=__bkDB.db; mostrarDespertador=__bkDB.md; dcChamada=__bkDB.dc; despNaTela=__bkDB.dn; repLancamentos=__bkDB.rl;'); }
});
prova('ligações: a chamada viva e o Hoje na Zêluz chamam o banho de quem faltou', () => {
  run(`__bkLG={zv:zMapaVivo, ag:banhoFaltaAgendar, hl:hojeLista, ge:document.getElementById, bf:BANHO_FALTA, bd:BANHO_FALTA_DIA, bdc:BANHO_FALTA_DEC, cv:_chamadaVivaDia, rd:renderDaycare, rp:repPodeLancar, db:DB};
    DB={ref:function(){ return {}; }};
    __cbLG=null; zMapaVivo=function(p, n, cb){ __cbLG=cb; return null; }; __agLG=0; banhoFaltaAgendar=function(){ __agLG++; };
    renderDaycare=function(){}; repPodeLancar=function(){ return true; };`);
  try {
    run(`_chamadaVivaDia=null; chamadaVivaLigar(); if(__cbLG) __cbLG({x:'faltou'});`);
    assert.strictEqual(run('__agLG'), 1, 'a mudança da chamada agenda a conferência do banho');
    run(`__rootLG={innerHTML:''}; document.getElementById=function(id){ return id==='hojeRoot'?__rootLG:null; }; hojeLista=function(){ return []; };
      BANHO_FALTA=[{chave:'jas', nome:'Jasmine', hora:'10:00', origem:'lancamento', porque:'faltou'}]; BANHO_FALTA_DIA=dcDataKey(); BANHO_FALTA_DEC={};
      try{ hojeRender(); }catch(e){ __errLG=String(e); }`);
    assert.ok(/Banho de quem faltou/.test(run('__rootLG.innerHTML')), 'o cartão entra no Hoje na Zêluz ' + run("typeof __errLG!=='undefined'?__errLG:''"));
    const src = fs.readFileSync(APP, 'utf8');
    assert.ok(/planDia=out;[\s\S]{0,400}banhoFaltaAgendar\(\)/.test(src), 'a leitura da planilha agenda a conferência');
    assert.ok(/regs\.some\(function\(r\)\{ return r\.data===dcDataKey\(\); \}\) && typeof banhoFaltaAgendar==='function'\) banhoFaltaAgendar\(\)/.test(src), 'a falta avisada de hoje agenda a conferência');
  } finally { run(`zMapaVivo=__bkLG.zv; banhoFaltaAgendar=__bkLG.ag; hojeLista=__bkLG.hl; document.getElementById=__bkLG.ge; BANHO_FALTA=__bkLG.bf; BANHO_FALTA_DIA=__bkLG.bd; BANHO_FALTA_DEC=__bkLG.bdc; _chamadaVivaDia=__bkLG.cv; renderDaycare=__bkLG.rd; repPodeLancar=__bkLG.rp; DB=__bkLG.db;`); }
});
// ------------------------------------------------ o fim
fila.then(() => {
  console.log('\n' + ok + ' provas passaram' + (falhas.length ? (', ' + falhas.length + ' falharam:') : '.'));
  falhas.forEach((f) => console.log('  - ' + f));
  process.exit(falhas.length ? 1 : 0);
});
