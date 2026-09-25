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

// ------------------------------------------------ o fim
fila.then(() => {
  console.log('\n' + ok + ' provas passaram' + (falhas.length ? (', ' + falhas.length + ' falharam:') : '.'));
  falhas.forEach((f) => console.log('  - ' + f));
  process.exit(falhas.length ? 1 : 0);
});
