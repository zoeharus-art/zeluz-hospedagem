'use strict';
/*
 * PROVA: turno do plantão e as refeições de cada turno (Adriana, 15/nov/2026, maquete aprovada).
 *
 * «As plantonistas dão o almoço durante o dia que elas estão e o café: nos feriados, domingos, e em
 *  dias como 24 e 31 de dezembro, que não são feriado mas a Zêluz não trabalha. O plantão noturno —
 *  19h às 7h — continua somente com o jantar; o diurno, de 7h às 19h, precisa estar com o café e o
 *  almoço. O desenho não pode confundir.»
 *
 * Três partes: a regra pura (plantao-turno.js), a leitura da refeição do check-in (cafe-operacional.js
 * com almoço e jantar) e o app inteiro num sandbox (recesso, cartão do turno, lista do almoço).
 * Sem rede e sem banco. Todo dado é inventado («Teste 01», «Tutora Teste»).
 *
 * Uso:  node tests/plantao-turno184.test.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const RAIZ = path.join(__dirname, '..', 'auaulandia');
const APP = path.join(RAIZ, 'index.html');
const Turno = require(path.join(RAIZ, 'plantao-turno.js'));
const Alim = require(path.join(RAIZ, 'alimentacao-hospede.js'));
global.ZeluzAlimentacaoHospede = Alim;
delete require.cache[require.resolve(path.join(RAIZ, 'cafe-operacional.js'))];
const Cafe = require(path.join(RAIZ, 'cafe-operacional.js'));

let ok = 0; const falhas = []; let fila = Promise.resolve();
function prova(nome, fn) {
  fila = fila.then(async () => {
    try { await fn(); ok++; console.log('  ✓ ' + nome); }
    catch (e) { falhas.push(nome + ' — ' + e.message); console.log('  ✗ ' + nome + '\n      ' + e.message); }
  });
}
const igual = (a, b, msg) => assert.deepStrictEqual(JSON.parse(JSON.stringify(a)), b, msg);

// ------------------------------------------------------------------ 1. a regra pura
console.log('Regra do turno');
// 22/nov/2026: todo dia, das 7h às 18h piscam café e almoço; das 18h às 7h, o jantar (nada some da tela).
prova('dia útil: das 7h às 18h é o diurno; das 18h às 7h é o noturno', () => {
  igual(['06:45', '07:00', '07:30', '12:00', '17:59', '18:00', '23:59', '00:00', '02:00'].map((h) => Turno.turno(false, h)),
    ['noturno', 'diurno', 'diurno', 'diurno', 'diurno', 'noturno', 'noturno', 'noturno', 'noturno']);
});
prova('domingo, feriado e recesso: a mesma regra (das 18h em diante é o jantar)', () => {
  igual(['06:59', '07:00', '12:00', '17:59', '18:00', '02:00'].map((h) => Turno.turno(true, h)),
    ['noturno', 'diurno', 'diurno', 'diurno', 'noturno', 'noturno']);
});
prova('o diurno tem café e almoço; o noturno, só o jantar; o turno dos monitores, nada', () => {
  igual([Turno.refeicoes('diurno'), Turno.refeicoes('noturno'), Turno.refeicoes('fora')], [['cafe', 'almoco'], ['jantar'], []]);
});
prova('o jantar da madrugada é do dia em que o plantão começou', () => {
  igual(Turno.diaDoJantar('2026-11-22', '2026-11-21', '02:00'), '2026-11-21');
  igual(Turno.diaDoJantar('2026-11-22', '2026-11-21', '06:59'), '2026-11-21');
  igual(Turno.diaDoJantar('2026-11-22', '2026-11-21', '19:10'), '2026-11-22');
});

// ------------------------------------------------------------------ 2. a refeição do check-in
const est = (extra) => Object.assign({ status: 'ativa', refKey: 'teste 01__tutora teste', nome: 'Teste 01', tutor: 'Tutora Teste',
  entrada: '2026-11-20', saida: '2026-11-25',
  ficha: { alim: { unidade: 'gramas', marca: 'Ração do Teste', refs: { fixas: {
    cafe: { on: true, racao: '40' }, almoco: { on: true, racao: '80' }, jantar: { on: true, racao: '90', extra: 'sachê' } } } } } }, extra || {});
const ler = (refeicao, estadias, dia) => Cafe.criar({ refeicao, pronto: true, estadias, hospedes: () => [], hoje: () => dia }).ler();
console.log('Refeição do check-in (café, almoço e jantar)');
prova('sem refeição informada continua sendo o café, como antes', () => {
  const r = ler(undefined, { e1: est() }, '2026-11-22');
  igual(r.participantes.map((p) => p.porcao.texto), ['40 g de ração']);
});
prova('o almoço e o jantar leem a refeição deles na ficha', () => {
  igual(ler('almoco', { e1: est() }, '2026-11-22').participantes.map((p) => p.porcao.texto), ['80 g de ração']);
  const j = ler('jantar', { e1: est() }, '2026-11-22').participantes[0];
  igual([j.porcao.texto, j.porcao.extra], ['90 g de ração', 'sachê']);
});
prova('refeição desligada no check-in não entra; refeição sem registro pede conferência', () => {
  const e = est(); e.ficha.alim.refs.fixas.almoco = { on: false };
  igual(ler('almoco', { e1: e }, '2026-11-22').participantes.length, 0);
  delete e.ficha.alim.refs.fixas.jantar;
  const r = ler('jantar', { e1: e }, '2026-11-22');
  igual([r.participantes.length, r.conferencias[0].estado], [0, 'conferir-refeicao']);
});
prova('dia de entrada: vale o que o check-in marcou para AQUELA refeição', () => {
  const e = est({ entrada: '2026-11-22' }); e.ficha.alim.entrada = { cafe: false, almoco: true, jantar: true };
  igual(ler('cafe', { e1: e }, '2026-11-22').participantes.length, 0, 'chegou depois do café');
  igual(ler('almoco', { e1: e }, '2026-11-22').participantes.length, 1, 'almoça no dia que chega');
});

// ------------------------------------------------------------------ 3. o app inteiro, num sandbox
function universal(name) {
  const fn = function () { return fn; };
  return new Proxy(fn, {
    get(t, p) { if (p === Symbol.toPrimitive) return () => ''; if (p === 'then') return undefined; if (p in t) return t[p]; return universal(name + '.' + String(p)); },
    set() { return true; }, apply() { return universal(name + '()'); }, construct() { return universal('new ' + name); },
  });
}
const els = {};
const body = { dataset: { role: 'plantonista' }, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
  appendChild() {}, style: {}, addEventListener() {}, setAttribute() {}, getAttribute() { return null; } };
const sandbox = {
  console: { log() {}, warn() {}, error() {}, info() {} }, Date, Math, JSON, Object, Array, String, Number, Boolean, Intl,
  parseInt, parseFloat, isNaN, isFinite, RegExp, Promise, Map, Set, Symbol, encodeURIComponent, decodeURIComponent,
  setTimeout() {}, clearTimeout() {}, setInterval() {}, clearInterval() {}, requestAnimationFrame() {}, performance: { now() { return 0; } },
  document: { body, head: { appendChild() {} }, documentElement: universal('documentElement'),
    getElementById(id) { return (id in els) ? els[id] : universal('el'); }, querySelector() { return null; }, querySelectorAll() { return []; },
    createElement() { return universal('el'); }, addEventListener() {}, getElementsByClassName() { return []; }, getElementsByTagName() { return []; }, cookie: '' },
  firebase: { initializeApp() { return {}; }, auth() { return { signInAnonymously() { return new Promise(() => {}); }, onAuthStateChanged() {} }; },
    database() { return { ref() { return universal('ref'); } }; } },
  localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
  navigator: { userAgent: 'plantao', onLine: true }, location: { href: 'https://plantao.local/', reload() {}, hostname: 'plantao.local' },
  alert() {}, confirm() { return true; }, prompt() { return ''; }, scrollTo() {}, addEventListener() {},
};
sandbox.window = sandbox; sandbox.globalThis = sandbox; sandbox.self = sandbox;
const ctx = vm.createContext(sandbox);
const html = fs.readFileSync(APP, 'utf8');
// Todos os <script> da página, na ordem: os módulos locais (src="x.js") e os inline. Só o principal (o
// maior) precisa rodar inteiro; módulo de tela que depende do navegador de verdade pode falhar à vontade.
(function () {
  const re = /<script([^>]*)>([\s\S]*?)<\/script>/gi; const todos = []; let m, maior = '';
  while ((m = re.exec(html)) !== null) { todos.push(m); if (!/\bsrc=/.test(m[1]) && m[2].length > maior.length) maior = m[2]; }
  for (const s of todos) {
    const src = (/\bsrc="([^"?:]+\.js)(?:\?[^"]*)?"/.exec(s[1]) || [])[1];
    if (src) { const f = path.join(RAIZ, src); if (!fs.existsSync(f)) continue;
      try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: src }); } catch (e) { /* não é desta prova */ } continue; }
    if (/\bsrc=/.test(s[1]) || /type="(?!text\/javascript)/.test(s[1])) continue;
    if (s[2] === maior) { vm.runInContext(maior, ctx, { filename: 'index.html#script', timeout: 20000 }); continue; }
    try { vm.runInContext(s[2], ctx, { filename: 'index.html#inline' }); } catch (e) { /* não é desta prova */ }
  }
})();
const run = (c) => vm.runInContext(c, ctx);
const J = (c) => JSON.parse(JSON.stringify(run(c)));
const as = (dia, hora) => run(`cafePartesSP=function(){ return {year:'${dia.slice(0, 4)}',month:'${dia.slice(5, 7)}',day:'${dia.slice(8, 10)}',hour:'${hora.slice(0, 2)}',minute:'${hora.slice(3, 5)}'}; }; orcFeriadosCfg=null; PL_FER_PEDIDO=true;`);

console.log('Recesso de fim de ano');
prova('24/12 e 31/12 fecham sozinhos, todo ano; 23/12 continua dia útil', () => {
  run('orcFeriadosCfg=null;');
  igual(J(`[orcFechado('2026-12-24'),orcFechado('2026-12-31'),orcFechado('2027-12-24'),orcFechado('2026-12-23'),orcFechado('2026-12-25')]`),
    ['Recesso de Natal', 'Recesso de Ano-Novo', 'Recesso de Natal', '', 'Natal']);
});
prova('a Gestão tira o 24/12 de um ano: só aquela data volta a ser dia útil', () => {
  run(`orcFeriadosCfg={'2026-12-24':false};`);
  igual(J(`[orcFechado('2026-12-24'),orcFechado('2026-12-31'),orcFechado('2027-12-24'),orcFechado('2026-12-25')]`),
    ['', 'Recesso de Ano-Novo', 'Recesso de Natal', 'Natal']);
  run('orcFeriadosCfg=null;');
});
prova('tirar o recesso grava false; tirar data própria da Gestão apaga; feriado nacional não sai', () => {
  run(`DB=null; orcRenderConfig=function(){}; orcCalcular=function(){}; alert=function(m){ __alerta=m; };
    orcFeriadosCfg={'2026-12-30':'recesso extra'}; orcDelFeriado('2026-12-24'); orcDelFeriado('2026-12-30'); __alerta=''; orcDelFeriado('2026-12-25');`);
  igual(J('orcFeriadosCfg'), { '2026-12-24': false });
  assert.ok(/Natal/.test(run('__alerta')), 'o 25/12 explica por que não sai');
  run('orcFeriadosCfg=null;');
});
prova('a conta do mês do Day Care pula o recesso (e não pula o que a Gestão tirou)', () => {
  const F = J(`mmFeriadosDoMes('2026-12-01')`);
  igual([F['2026-12-24'], F['2026-12-31'], F['2026-12-25']], ['Recesso de Natal', 'Recesso de Ano-Novo', 'Natal']);
  run(`orcFeriadosCfg={'2026-12-31':false};`);
  igual(J(`'2026-12-31' in mmFeriadosDoMes('2026-12-01')`), false);
  run('orcFeriadosCfg=null;');
});

console.log('Cartão do turno');
const card = () => { els.plantaoTurnoCard = { innerHTML: '' }; const r = J('plantaoTurnoAplicar()'); return { r, h: els.plantaoTurnoCard.innerHTML, b: body.dataset.plantaoTurno }; };
prova('domingo 22/11, 12h: destaque no café e no almoço', () => {
  as('2026-11-22', '12:00'); const c = card();
  igual([c.r.turno, c.b, body.dataset.plantaoFechado], ['diurno', 'diurno', '1']);
  assert.ok(/Agora: café da manhã e almoço/.test(c.h) && /Jantar/.test(c.h), c.h);
  assert.ok(/var\(--z-gold\)/.test(c.h), 'barrinha dourada');
});
prova('terça 17/11, 12h: também café e almoço (todo dia)', () => {
  as('2026-11-17', '12:00'); const c = card();
  igual([c.r.turno, body.dataset.plantaoFechado], ['diurno', '0']); assert.ok(/Agora: café da manhã e almoço/.test(c.h), c.h);
});
prova('18h10 de qualquer dia: destaque no jantar e no relatório', () => {
  as('2026-11-17', '18:10'); let c = card(); igual(c.r.turno, 'noturno'); assert.ok(/Agora: jantar e Relatório do Jantar/.test(c.h), c.h);
  as('2026-11-22', '19:10'); c = card(); igual(c.r.turno, 'noturno');
});
prova('às 18h a tela troca sozinha: o turno avisa que mudou', () => {
  as('2026-11-22', '17:59'); card(); as('2026-11-22', '18:00');
  igual(J('plantaoTurnoAplicar()'), { turno: 'noturno', mudou: true });
});
prova('o jantar das 02h grava no dia anterior; o almoço, no dia de hoje', () => {
  as('2026-11-22', '02:00'); igual(J(`[plRefDia('jantar'),plRefDia('almoco')]`), ['2026-11-21', '2026-11-22']);
});

console.log('Lista do almoço na tela Plantão');
prova('cada hóspede com a porção do almoço, a contagem e os botões Comeu / Metade / Não comeu', () => {
  as('2026-11-22', '12:00');
  for (const k of ['plAlmocoGrid', 'plAlmocoBarra', 'plAlmocoResumo']) els[k] = { innerHTML: '' };
  const e2 = est({ refKey: 'teste 02__tutora teste', nome: 'Teste <b>02</b>' });
  run(`CF_ESTADIAS_LIDO=true; hospedes=[]; quemSou=function(){ return 'Plantonista Teste'; }; DB={ref:function(){ return {}; }};
    EST_TODAS=${JSON.stringify({ e1: est(), e2 })};
    PL_REF.almoco.leitura={dia:'2026-11-22',ger:1,estado:'ok',promessa:null,em:Date.now()};
    PL_REF.almoco.marcas={'teste 01__tutora teste':{estado:'tudo',quem:'Plantonista Teste',hora:'12:05'}}; PL_REF.almoco.pend={};
    plRefRender('almoco');`);
  const g = els.plAlmocoGrid.innerHTML, rz = els.plAlmocoResumo.innerHTML, b = els.plAlmocoBarra.innerHTML;
  assert.ok(/Teste 01/.test(g) && /80 g de ração/.test(g), 'nome e porção');
  assert.ok(g.indexOf('<b>02</b>') < 0 && /Teste &lt;b/.test(g), 'nome escapado: ' + (g.match(/class="nm">[^]{0,60}/g) || []).join(' | '));
  assert.ok(/>Comeu</.test(g) && />Metade</.test(g) && />Não comeu</.test(g) && /Não chegou ainda/.test(g), 'botões');
  assert.ok(/marcarRefeicaoHosp\('almoco'/.test(g), 'grava no almoço');
  assert.ok(/<b>1<\/b>servidos/.test(rz) && /<b>1<\/b>faltam/.test(rz), rz);
  assert.ok(/Iniciar/.test(b) && /Encerrar/.test(b) && /iniciarRefeicaoHosp\('almoco'\)/.test(b) && b.indexOf('disabled') < 0, b);
});
prova('pernoite do Day Care sem check-in de hotel aparece avisado, não some', () => {
  run(`hospedes=[{nome:'Teste 03',tutor:'Tutora Teste',pernoite:true}]; plRefRender('almoco');`);
  assert.ok(/Pernoite do Day Care:<\/strong> Teste 03/.test(els.plAlmocoGrid.innerHTML));
});
prova('leitura que falhou não deixa marcar nada', () => {
  run(`PL_REF.almoco.leitura.estado='falha'; plRefRender('almoco');`);
  assert.ok(/Não foi possível confirmar os registros do almoço/.test(els.plAlmocoGrid.innerHTML));
  assert.ok(/disabled/.test(els.plAlmocoBarra.innerHTML));
});

console.log('Tela e estilo');
prova('o app carrega o módulo do turno e tem os blocos novos', () => {
  assert.ok(/<script src="plantao-turno\.js\?v=2026-11-22-02"><\/script>/.test(html));
  assert.ok(/<script src="cafe-operacional\.js\?v=2026-11-22-02"><\/script>/.test(html));
  for (const id of ['plantaoTurnoCard', 'cardFecharTurno', 'prevSec_plantao-almoco', 'prevSec_plantao-jantar', 'plAlmocoGrid', 'plJantarGrid'])
    assert.ok(html.indexOf('id="' + id + '"') >= 0, id);
});
prova('o CSS não esconde nada da plantonista: café, almoço, jantar e relatório piscam pela hora', () => {
  for (const s of ['body[data-role="plantonista"]:not([data-plantao-turno="diurno"]) #prevSec_plantao-cafe',
    'body:not([data-plantao-turno="diurno"]) #prevSec_plantao-almoco,', 'body:not([data-plantao-turno="noturno"]) #prevSec_plantao-jantar,',
    'body[data-role="plantonista"]:not([data-plantao-turno="noturno"]) #card-inicio'])
    assert.ok(html.indexOf(s) < 0, 'ainda esconde: ' + s);
  for (const s of ['body[data-role="plantonista"][data-plantao-turno="diurno"] #prevSec_plantao-cafe>summary',
    'body[data-role="plantonista"][data-plantao-turno="noturno"] #prevSec_plantao-jantar>summary',
    'body[data-role="plantonista"][data-plantao-turno="noturno"] #card-inicio>.rel-head{animation:plPiscaAgora'])
    assert.ok(html.indexOf(s) >= 0, 'sem pisca: ' + s);
  assert.ok(/body:not\(\[data-role="plantonista"\]\) #plantaoTurnoCard\{display:none !important\}/.test(html), 'só a plantonista vê o cartão do turno');
});

fila.then(() => {
  console.log('\nplantao-turno184: ' + ok + ' de ' + (ok + falhas.length) + ' provas passaram');
  if (falhas.length) { falhas.forEach((f) => console.log('  FALHOU: ' + f)); process.exitCode = 1; }
});
