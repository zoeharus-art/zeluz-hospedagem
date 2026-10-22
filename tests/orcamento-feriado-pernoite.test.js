'use strict';
/*
 * PROVA: feriado nacional ou municipal não tem Day Care (Adriana, 22/out/2026).
 *
 * «Esse erro não pode ocorrer em hipótese alguma. Todo feriado nacional ou municipal não tem
 *  creche.» Caso do Rock: 02/11/2026 (Finados) é segunda, dia dele no Day Care, e o orçamento
 *  contou a noite como PERNOITE. Feriado não tem Day Care: a noite é DIÁRIA de hotel.
 *
 * Sem rede e sem banco: o app é carregado inteiro num sandbox (o mesmo de
 * tests/fase0-ciclo-fechado.test.js) e todo dado aqui é inventado.
 *
 * Uso:  node tests/orcamento-feriado-pernoite.test.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const APP = path.join(__dirname, '..', 'auaulandia', 'index.html');

// ------------------------------------------------ o sandbox (cópia do de fase0-ciclo-fechado.test.js)
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
    navigator: { userAgent: 'feriado', onLine: true },
    location: { href: 'https://feriado.local/', reload() {}, hostname: 'feriado.local' },
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

let ok = 0; const falhas = []; let fila = Promise.resolve();
function prova(nome, fn) {
  fila = fila.then(async () => {
    try { await fn(); ok++; console.log('  ✓ ' + nome); }
    catch (e) { falhas.push(nome + ' — ' + e.message); console.log('  ✗ ' + nome + '\n      ' + e.message); }
  });
}
const ctx = vm.createContext(makeSandbox());
vm.runInContext(extractMainScript(fs.readFileSync(APP, 'utf8')), ctx, { filename: 'index.html#script', timeout: 15000 });
const run = (c) => vm.runInContext(c, ctx);
const J = (c) => JSON.parse(JSON.stringify(run(c)));
const igual = (a, b, msg) => assert.deepStrictEqual(JSON.parse(JSON.stringify(a)), b, msg);

// A tela do orçamento de mentira: só os campos que a conta lê e escreve.
const els = {};
function telaDoOrcamento(ent, sai) {
  Object.assign(els, { orcEntrada: { value: ent }, orcSaida: { value: sai }, orcCardResultado: { style: {} }, orcCardMsg: { style: {} },
    orcAvisoData: { innerHTML: '' }, orcTemporada: { innerHTML: '' }, orcTemporadaNota: { innerHTML: '' }, orcResultado: { innerHTML: '' },
    orcMsg: { value: '' }, orcSalvoStatus: { style: {}, textContent: '' } });
}
const geOrig = ctx.document.getElementById;
ctx.document.getElementById = function (id) { return (id in els) ? els[id] : geOrig.call(this, id); };
run(`orcRenderMsg=function(){}; orcRenderSel=function(){}; orcNovoComecou=function(){};
  hojeISO=function(){ return '2026-10-22'; };
  orcPrecosCfg={pernoite:{baixa:9000,alta:11000,fim:13000}, diaria:{baixa:15000,alta:18000,fim:21000}, fim_de:'12-20', fim_ate:'01-06'};
  ORC_REP={}; ORC_AULUNO=true; ORC_TEMP='baixa'; ORC_TEMP_MANUAL=true; ORC_TEMP_AUTO=false;`);
// O Rock (inventado): auluno de segunda, plano sem desconto na AuAulândia.
const ROCK = (extra) => JSON.stringify(Object.assign({ key: 'rock__tutora', nome: 'Rock', tutor: 'Tutora do Rock', raca: 'Spitz',
  dias: ['seg'], trocas: {}, planoKey: 'Gold', rotulo: 'Gold', compromisso: 'mensal', hospOff: 0 }, extra || {}));
function orcar(ent, sai, sel, feriadosDaGestao) {
  telaDoOrcamento(ent, sai);
  run('orcFeriadosCfg=' + JSON.stringify(feriadosDaGestao || null) + '; ORC_SEL=[' + (sel || ROCK()) + ']; orcCalcular();');
  return J('ORC_CALC');
}
const noites = (C) => C.pets[0].noites.map((n) => n.iso.slice(8) + '/' + n.iso.slice(5, 7) + ' ' + n.dw + ' ' + (n.pernoite ? 'P' : 'D'));

console.log('Feriado não tem Day Care: a noite que começa nele é diária');
prova('Rock (segunda): de 30/10 a 04/11, a noite de 02/11 (Finados) é DIÁRIA, não pernoite', () => {
  const C = orcar('2026-10-30', '2026-11-04');
  igual(noites(C), ['30/10 sex D', '31/10 sab D', '01/11 dom D', '02/11 seg D', '03/11 ter D']);
  igual([C.pets[0].nPer, C.pets[0].nDia], [0, 5], 'cinco diárias, nenhuma pernoite');
  igual(C.pets[0].noites[3].feriado, 'Finados', 'a noite guarda o porquê');
  igual(C.total, 5 * 15000, 'R$ 750,00: cinco diárias de R$ 150,00');
});
prova('a segunda seguinte, 09/11, sem feriado, continua PERNOITE', () => {
  const C = orcar('2026-10-30', '2026-11-11');
  const N = noites(C);
  assert.ok(N.indexOf('02/11 seg D') >= 0, N.join(', '));
  assert.ok(N.indexOf('09/11 seg P') >= 0, N.join(', '));
  igual([C.pets[0].nPer, C.pets[0].nDia], [1, 11]);
  igual(C.total, 11 * 15000 + 9000);
});
prova('a lista da Gestão salva SEM 02/11 (só com o recesso dela) não faz o feriado voltar a ser dia comum', () => {
  const C = orcar('2026-10-30', '2026-11-04', null, { '2026-12-24': 'recesso da Zêluz' });
  igual(C.pets[0].noites[3].pernoite, false, noites(C).join(', '));
  igual(C.pets[0].noites[3].feriado, 'Finados');
});
prova('o recesso que a Gestão acrescenta também tira a pernoite (quinta 24/12 de quem vem às quintas)', () => {
  const C = orcar('2026-12-23', '2026-12-26', ROCK({ dias: ['qui'] }), { '2026-12-24': 'recesso da Zêluz' });
  igual(noites(C), ['23/12 qua D', '24/12 qui D', '25/12 sex D']);
  igual(C.pets[0].noites[1].feriado, 'recesso da Zêluz');
});
prova('feriado que não é dia dele: diária como sempre, sem aviso de feriado na noite', () => {
  const C = orcar('2026-10-31', '2026-11-04', ROCK({ dias: ['qua'] }));
  igual(noites(C), ['31/10 sab D', '01/11 dom D', '02/11 seg D', '03/11 ter D']);
  igual(C.pets[0].noites.map((n) => n.feriado), ['', '', '', '']);
});
prova('a troca de dia pedida pela tutora (segunda → terça) continua valendo: 03/11 vira pernoite, 02/11 segue diária', () => {
  const C = orcar('2026-10-30', '2026-11-04', ROCK({ trocas: { seg: 'ter' } }));
  igual(noites(C), ['30/10 sex D', '31/10 sab D', '01/11 dom D', '02/11 seg D', '03/11 ter P']);
});
prova('a tela diz por que a noite do dia dele virou diária', () => {
  orcar('2026-10-30', '2026-11-04');
  run('orcRenderResultado()');
  const h = els.orcResultado.innerHTML;
  assert.ok(h.indexOf('02/11 é Finados: feriado não tem Day Care, então a noite conta como diária de hotel.') >= 0, 'a frase do feriado');
  assert.ok(h.indexOf('title="diária de hotel — Finados, feriado sem Day Care"') >= 0, 'o toque na noite explica');
  assert.ok(h.indexOf('5 diárias de hotel') >= 0 && h.indexOf('pernoite × ') < 0, 'sem linha de pernoite');
});
prova('sem feriado na estadia, a tela não ganha frase nova', () => {
  orcar('2026-11-06', '2026-11-11');
  run('orcRenderResultado()');
  assert.ok(els.orcResultado.innerHTML.indexOf('feriado não tem Day Care') < 0);
});

console.log('\nOs feriados valem em qualquer ano');
prova('o calendário calculado é IGUAL à lista de fábrica de 2026 e 2027 (datas e nomes)', () => {
  const fab = J('ORC_FERIADOS_PADRAO');
  const calc = J("Object.assign({}, orcFeriadosDoAno(2026), orcFeriadosDoAno(2027))");
  igual(Object.keys(calc).sort(), Object.keys(fab).sort());
  Object.keys(fab).forEach((d) => igual(calc[d], fab[d], d));
});
prova('2028 (ano bissexto) e 2030 têm os feriados móveis certos', () => {
  igual(J("[orcEhFeriado('2028-02-28'), orcEhFeriado('2028-02-29'), orcEhFeriado('2028-04-14'), orcEhFeriado('2028-06-15'), orcEhFeriado('2028-11-02')]"),
    ['Carnaval', 'Carnaval', 'Sexta-feira Santa', 'Corpus Christi', 'Finados']);
  igual(J("[orcPascoa(2028), orcPascoa(2030), orcEhFeriado('2030-03-04'), orcEhFeriado('2030-04-19'), orcEhFeriado('2030-06-20')]"),
    ['2028-04-16', '2030-04-21', 'Carnaval', 'Sexta-feira Santa', 'Corpus Christi']);
  igual(J("[orcEhFeriado('2028-11-03'), orcEhFeriado(''), orcEhFeriado('lixo')]"), ['', '', '']);
});

console.log('\nA reserva já salva do Rock pode ser corrigida em «Mudar as datas»');
async function salvarEdicao(totalAntes) {
  orcar('2026-10-30', '2026-11-04');
  run(`__pergs=[]; __alertas=[];
    planosProntos=function(){ return true; }; DB={ref:function(){ return {}; }};
    alert=function(t){ __alertas.push(String(t)); };
    zPergunta=function(t, linhas){ __pergs.push([t].concat(linhas||[])); return Promise.resolve(false); };
    ORC_EDITANDO='orc-rock'; ORC_EDIT_ANTES={entrada:'2026-10-30', saida:'2026-11-04', total_cent:${totalAntes}, status:'aguardando', pets:[{nome:'Rock'}]};
    ORC_LISTA_CACHE['orc-rock']={entrada:'2026-10-30', saida:'2026-11-04', total_cent:${totalAntes}, status:'aguardando', tutor:'Tutora do Rock', pets:[{key:'rock__tutora', nome:'Rock'}]};`);
  await run('orcSalvarEdicao()');
  return J('[__alertas, __pergs]');
}
prova('mesmas datas, valor novo (o feriado virou diária): a gravação segue para a confirmação com o DE e o PARA', async () => {
  const [alertas, pergs] = await salvarEdicao(4 * 15000 + 9000);
  igual(alertas, []);
  igual(pergs.length, 1);
  const t = pergs[0].join(' | ');
  assert.ok(/DE: 30\/10\/2026 a 04\/11\/2026 · R\$\s?690,00/.test(t), t);
  assert.ok(/PARA: 30\/10\/2026 a 04\/11\/2026 · R\$\s?750,00/.test(t), t);
  assert.ok(/São R\$\s?60,00 A MAIS\./.test(t), t);
});
prova('mesmas datas e mesmo valor: continua avisando que nada mudou, sem gravar', async () => {
  const [alertas, pergs] = await salvarEdicao(5 * 15000);
  igual(pergs, []);
  igual(alertas.length, 1);
  assert.ok(/As datas e o valor continuam os mesmos/.test(alertas[0]), alertas[0]);
});

fila.then(() => {
  console.log('\n' + ok + ' provas passaram' + (falhas.length ? (', ' + falhas.length + ' falharam:') : '.'));
  falhas.forEach((f) => console.log('  - ' + f));
  process.exit(falhas.length ? 1 : 0);
});
