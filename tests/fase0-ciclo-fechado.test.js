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

provaAsync('a ficha ficou em dia pelo quadro: o assunto com o tutor fecha sozinho, com quem e quando', async () => {
  run(`__bk11={db:DB, vr:VENC_REG, vrd:VENC_REG_DIA, vp:VENC_PEND, au:audit, vre:vencRender, vrq:vencRedesenharQuadros, qs:quemSou, hz:zHojeISO, vda:vencDiaAlvo, pe:pelExtra, pp:prevCorrigePetDe};
    __grav11=[];
    DB={ref:function(p){ return { once:function(){ return Promise.resolve({val:function(){ return null; }}); },
      update:function(v){ __grav11.push({p:p, v:v}); return Promise.resolve(); } }; }};
    zHojeISO=function(){ return '2026-09-24'; }; vencDiaAlvo=function(){ return '2026-09-25'; };
    __P11={n:'Mel', tutor:'Ana'};
    pelExtra=function(){ return {verm_p:'2027-01-10', ecto_p:'2026-12-01', vac_mult_p:'2027-05-10', vac_gripe_p:'2027-05-10', vac_raiva_p:'2027-05-10', escova_p:'2027-01-01'}; };
    prevCorrigePetDe=function(){ return __P11; };
    VENC_REG={}; VENC_REG[dcKey('Mel','Ana')]={enviadas:{antip:{quem:'x', ts:1}}}; VENC_REG_DIA='2026-09-25'; VENC_PEND=null;
    audit=function(){}; vencRender=function(){}; vencRedesenharQuadros=function(){}; quemSou=function(){ return 'Bia'; };`);
  try {
    run("prevCorrigeFecharConversa(__P11, dcKey('Mel','Ana'))");
    for (let i = 0; i < 20; i++) await Promise.resolve();
    const g = JSON.parse(JSON.stringify(run('__grav11')));
    assert.strictEqual(g.length, 1, JSON.stringify(g));
    assert.ok(/daycare\/vencimentos\/2026-09-25\//.test(g[0].p));
    assert.strictEqual(g[0].v.ficha_atualizada.quem, 'Bia');
    assert.strictEqual(g[0].v.ficha_atualizada.via, 'quadro');
    // ficha AINDA devendo: não fecha
    run("__grav11=[]; pelExtra=function(){ return {verm_p:'2026-09-01'}; };");
    run("prevCorrigeFecharConversa(__P11, dcKey('Mel','Ana'))");
    for (let i = 0; i < 20; i++) await Promise.resolve();
    assert.strictEqual(JSON.parse(JSON.stringify(run('__grav11'))).length, 0, 'com a ficha devendo, continua aberto');
  } finally { run('DB=__bk11.db; VENC_REG=__bk11.vr; VENC_REG_DIA=__bk11.vrd; VENC_PEND=__bk11.vp; audit=__bk11.au; vencRender=__bk11.vre; vencRedesenharQuadros=__bk11.vrq; quemSou=__bk11.qs; zHojeISO=__bk11.hz; vencDiaAlvo=__bk11.vda; pelExtra=__bk11.pe; prevCorrigePetDe=__bk11.pp;'); }
});

// ------------------------------------------------ o fim
fila.then(() => {
  console.log('\n' + ok + ' provas passaram' + (falhas.length ? (', ' + falhas.length + ' falharam:') : '.'));
  falhas.forEach((f) => console.log('  - ' + f));
  process.exit(falhas.length ? 1 : 0);
});
