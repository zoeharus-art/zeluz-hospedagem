'use strict';

// A Prevenção pelo lançamento do dia (Adriana, 29/out/2026: «Quando lanço aqui, já era para estar linkado com a prevenção e
// colocar a data no sistema, atualizando automaticamente […] E colocar que foi atualizado na ficha do peludinho.»; adendo: «se
// o peludinho não veio hoje ou não é dia dele, o sistema tem que entender e pedir para conferir se ele foi mesmo»; e «Tem a
// troca de escova de dentes também»). Prova, com o app inteiro num sandbox sem rede e sem banco real:
//   1. dashPrevFichaPatch: a conta é a da Prevenção — vermífugo (dose única, 2ª dose da série, série vencida), carrapaticida
//      (o produto da linha ou o da ficha; sem produto, não grava), coleira (a que não veio não grava), escova (90 dias) — e a
//      marca {item}_lanc vai junto;
//   2. dashPrevFichaAplicar: reserva por transação, grava pela porta da Prevenção, guarda o antes; a segunda vez não grava;
//   3. dashPrevFichaDesfazer: o «tirar» devolve o antes; ficha mexida depois não é tocada;
//   4. o estado na linha (verde, cinza, atenção depois das 12h) e a linha da ficha;
//   5. os ganchos estão nos lugares (linha, conferir ao desenhar, aviso ao lançar, tirar, ficha) e a linha do vencimento fica de fora.
// Tudo inventado: nenhum dado de cliente.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const APP = path.join(__dirname, '..', 'auaulandia', 'index.html');
const html = fs.readFileSync(APP, 'utf8');

// ------------------------------------------------------------------------- o app inteiro num sandbox, sem rede e sem banco
// (o mesmo motor de tests/alergia-destaque164.test.js)
function universal(name) {
  const fn = function () { return fn; };
  return new Proxy(fn, {
    get(t, p) { if (p === Symbol.toPrimitive) return () => ''; if (p === 'then') return undefined; if (p in t) return t[p]; return universal(name + '.' + String(p)); },
    set() { return true; }, apply() { return universal(name + '()'); }, construct() { return universal('new ' + name); },
  });
}
function elemento(id) {
  return { id, innerHTML: '', style: { setProperty() {} }, dataset: {}, className: '', value: '', textContent: '', open: false, offsetParent: {}, offsetHeight: 0,
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    querySelector() { return null; }, querySelectorAll() { return []; }, addEventListener() {}, setAttribute() {}, getAttribute() { return null; },
    appendChild() {}, scrollIntoView() {}, click() {}, closest() { return null; }, focus() {} };
}
function scriptsDoApp(texto) {
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi; let m; const todos = [];
  while ((m = re.exec(texto)) !== null) todos.push(m[1]);
  let principal = '', k = -1;
  todos.forEach((t, i) => { if (t.length > principal.length) { principal = t; k = i; } });
  return todos.slice(0, k).join('\n;\n') + '\n;\n' + principal;
}
function abrirApp() {
  const els = {};
  const getEl = (id) => (els[id] = els[id] || elemento(id));
  const corpo = { dataset: { role: 'gestao' }, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, appendChild() {}, style: {}, addEventListener() {}, setAttribute() {}, getAttribute() { return null; } };
  const doc = { body: corpo, head: { appendChild() {} }, documentElement: universal('documentElement'), getElementById: getEl, querySelector() { return null; }, querySelectorAll() { return []; }, createElement() { return universal('el'); },
    addEventListener() {}, activeElement: null, cookie: '', readyState: 'complete' };
  const nunca = new Promise(() => {});
  const sandbox = { console, Date, Math, JSON, Object, Array, String, Number, Boolean, parseInt, parseFloat, isNaN, isFinite, RegExp, Promise, Map, Set, Symbol, encodeURIComponent, decodeURIComponent,
    setTimeout() {}, clearTimeout() {}, setInterval() {}, clearInterval() {}, requestAnimationFrame() {}, performance: { now() { return 0; } }, document: doc,
    firebase: { initializeApp() { return {}; }, auth() { return { signInAnonymously() { return nunca; }, onAuthStateChanged() {} }; }, database() { return { ref() { return universal('ref'); } }; } },
    localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} }, navigator: { userAgent: 'prova', onLine: true }, location: { href: 'https://prova.local/', reload() {}, hostname: 'prova.local' },
    Blob: class Blob {}, alert() {}, confirm() { return true; }, prompt() { return ''; }, scrollTo() {}, addEventListener() {}, getComputedStyle() { return {}; } };
  sandbox.window = sandbox; sandbox.globalThis = sandbox; sandbox.self = sandbox;
  const ctx = vm.createContext(sandbox);
  const re = /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>|<script[^>]*\bsrc="([^"?]+)[^"]*"[^>]*><\/script>/gi; let m; const principal = scriptsDoApp(html);
  while ((m = re.exec(html))) {
    if (m[3]) {
      if (/^https?:/.test(m[3])) continue;
      const arq = path.join(__dirname, '..', 'auaulandia', m[3]);
      if (!fs.existsSync(arq)) continue;
      try { vm.runInContext(fs.readFileSync(arq, 'utf8'), ctx, { filename: m[3], timeout: 30000 }); } catch (e) { /* módulo que a tela não precisa neste sandbox */ }
    } else if (m[2] && m[2].length > 0) {
      if (principal.indexOf(m[2]) >= 0 && m[2].length > 100000) vm.runInContext(m[2], ctx, { filename: 'index.html#script', timeout: 30000 });
      else { try { vm.runInContext(m[2], ctx, { filename: 'index.html#inline', timeout: 30000 }); } catch (e) { /* inline pequeno que a tela não precisa */ } }
    }
  }
  const run = (c) => vm.runInContext(c, ctx);
  return { ctx, run };
}

const A = abrirApp();
const { run } = A;
const lista = (v) => JSON.parse(JSON.stringify(v));
const DIA = '2026-10-29';
const fila = [];
function prova(nome, fn) { fila.push([nome, fn]); }

// ------------------------------------------------------------------------- um banco de mentira, em memória
run(`
  var __BANCO={};
  function __partes(p){ return String(p).split('/').filter(Boolean); }
  function __ler(p){ var o=__BANCO; var a=__partes(p); for(var i=0;i<a.length;i++){ if(!o||typeof o!=='object') return null; o=o[a[i]]; } return (o===undefined)?null:JSON.parse(JSON.stringify(o)); }
  function __por(p, v){ var a=__partes(p), o=__BANCO; for(var i=0;i<a.length-1;i++){ if(!o[a[i]]||typeof o[a[i]]!=='object') o[a[i]]={}; o=o[a[i]]; }
    if(v===null||v===undefined) delete o[a[a.length-1]]; else o[a[a.length-1]]=JSON.parse(JSON.stringify(v)); }
  DB={ ref:function(p){ return {
    once:function(){ var v=__ler(p); return Promise.resolve({val:function(){ return v; }}); },
    transaction:function(fn){ var atual=__ler(p), novo=fn(atual); if(novo===undefined) return Promise.resolve({committed:false}); __por(p, novo); return Promise.resolve({committed:true}); },
    update:function(o){ Object.keys(o).forEach(function(c){ __por(p+'/'+c, o[c]); }); return Promise.resolve(); },
    remove:function(){ __por(p, null); return Promise.resolve(); },
    set:function(v){ __por(p, v); return Promise.resolve(); } }; } };
  var __FICHAS={}, __GRAVOU=[], __ALERTAS=[];
  pelExtra=function(p){ return __FICHAS[pelKey(p)]||{}; };
  prevGravar=function(p, patch){ __GRAVOU.push({k:pelKey(p), patch:JSON.parse(JSON.stringify(patch))});
    __FICHAS[pelKey(p)]=Object.assign({}, __FICHAS[pelKey(p)]||{}, JSON.parse(JSON.stringify(patch))); return Promise.resolve({ok:true}); };
  zAlertao=function(t, l){ __ALERTAS.push({t:t, l:l}); };
  audit=function(){};
  canEditPel=function(){ return true; };
  dashDia=function(){ return ${JSON.stringify(DIA)}; };
  zHojeISO=function(){ return ${JSON.stringify(DIA)}; };
  PELUDINHOS=[{n:'Biscoito', tutor:'Tutor Exemplo', raca:'Beagle'}, {n:'Pipoca', tutor:'Tutora Exemplo', raca:'Poodle'}];
  repEhFemea=function(p){ return p && p.n==='Pipoca'; };
`);
const CH_B = run("dcKey('Biscoito','Tutor Exemplo')");
const PK_B = run('pelKey(PELUDINHOS[0])');
function zerar(ficha) { A.ctx.__f = ficha || {}; run('__BANCO={}; __FICHAS={}; __FICHAS[pelKey(PELUDINHOS[0])]=__f; __GRAVOU=[]; __ALERTAS=[]; DASH_PREV_FICHA={dia:"", marcas:null, pres:{}, lendo:false, quando:0};'); }
function patch(k, ex, det) { A.ctx.__ex = ex || {}; A.ctx.__det = det || {}; return lista(run('dashPrevFichaPatch(' + JSON.stringify(k) + ', __ex, ' + JSON.stringify(DIA) + ', "Colaboradora Teste", __det)')); }

// ------------------------------------------------------------------------- 1. a conta
prova('vermífugo de dose única: a 1ª dose é o dia, o próximo pela conta da Prevenção, e a marca vai junto', () => {
  const r = patch('vermifugo', { verm_doses: 'Dose única' });
  assert.strictEqual(r.itemK, 'verm_p');
  assert.strictEqual(r.patch.verm_t, DIA);
  assert.strictEqual(r.patch.verm_p, run("prevVermLanceConta({verm_doses:'Dose única'}, 'verm_p', '" + DIA + "')"));
  assert.strictEqual(r.patch.verm_por, 'Colaboradora Teste');
  assert.strictEqual(r.patch.verm_p_lanc.dia, DIA);
  assert.strictEqual(r.patch.verm_p_lanc.quem, 'Colaboradora Teste');
  assert.strictEqual(r.prox, r.patch.verm_p);
});
prova('vermífugo de 2 doses com a 2ª pendente: o lançamento é a 2ª dose e o próximo conta 4 meses dela', () => {
  const ex = { verm_doses: '2 doses', verm_t: '2026-10-08', verm_p: '2027-03-01' };
  A.ctx.__ex2 = ex;
  assert.ok(run('vermDose2Prevista(__ex2)'), 'a ficha de teste tem a 2ª dose pendente');
  const r = patch('vermifugo', ex);
  assert.strictEqual(r.itemK, 'verm_dose2_p');
  assert.strictEqual(r.patch.verm_dose2_t, DIA);
  assert.strictEqual(r.patch.verm_2a, DIA);
  assert.strictEqual(r.patch.verm_p, run("addDiasISO('" + DIA + "', VERMIF_PROX)"));
  assert.strictEqual(r.patch.verm_dose2_por, 'Colaboradora Teste');
  assert.ok(r.patch.verm_dose2_p_lanc && !r.patch.verm_p_lanc);
  assert.ok(!('verm_t' in r.patch), 'a 1ª dose não muda');
});
prova('vermífugo com a série vencida: a dose entra como 1ª da série nova (a mesma conta da Prevenção)', () => {
  const ex = { verm_doses: '2 doses', verm_t: '2026-05-01', verm_p: '2026-09-21' };
  A.ctx.__ex3 = ex;
  assert.strictEqual(run("vermSerieVenceu(__ex3, '" + DIA + "')"), true);
  const r = patch('vermifugo', ex);
  const esperado = lista(run("vermSerieNovaPatch(__ex3, '" + DIA + "')"));
  Object.keys(esperado).forEach((c) => assert.deepStrictEqual(r.patch[c], esperado[c], c));
  assert.strictEqual(r.itemK, 'verm_p');
});
prova('carrapaticida: o produto da linha dá a duração e entra na ficha; sem produto em lugar nenhum, a ficha não muda', () => {
  const prod = run("ectoProdutosLista().filter(function(p){ return parseInt(ECTO_DUR[p],10)>0; })[0]");
  assert.ok(prod, 'há um produto com duração no app');
  const dias = run('parseInt(ECTO_DUR[' + JSON.stringify(prod) + '],10)');
  const rot = run('ectoRotulo(' + JSON.stringify(prod) + ').toUpperCase()');
  const r = patch('carrapaticida', {}, { prod: rot });
  assert.strictEqual(r.patch.ecto_t, DIA);
  assert.strictEqual(r.patch.ecto_p, run("addDiasISO('" + DIA + "', " + dias + ')'));
  assert.strictEqual(r.patch.ecto_prod, prod);
  assert.deepStrictEqual(patch('carrapaticida', {}, {}), { erro: 'produto' });
  const daFicha = patch('carrapaticida', { ecto_prod: prod }, {});
  assert.strictEqual(daFicha.patch.ecto_p, r.patch.ecto_p);
  assert.ok(!('ecto_prod' in daFicha.patch), 'o produto da ficha não é regravado');
});
prova('coleira: a que não veio não grava; a trocada conta pela validade da marca', () => {
  assert.deepStrictEqual(patch('coleira', {}, { veio: 'NÃO VEIO' }), { erro: 'nao-veio' });
  const r = patch('coleira', {}, { veio: 'LOJA' });
  assert.strictEqual(r.patch.col_t, DIA);
  assert.strictEqual(r.patch.col_p, run("addDiasISO('" + DIA + "', prevDiasDoItem({coleira:true}, {}))"));
});
prova('escova: troca no dia e a próxima em 90 dias', () => {
  const r = patch('escova', {}, { onde: 'NA BOLSA' });
  assert.strictEqual(r.patch.escova_t, DIA);
  assert.strictEqual(r.patch.escova_p, run("addDiasISO('" + DIA + "', 90)"));
  assert.ok(r.patch.escova_p_lanc);
});
prova('fora daqui: item sem prevenção, linha sem ficha e linha do vencimento («Conferir cuidado»)', () => {
  assert.strictEqual(run("dashPrevFichaElegivel('banho', {chave:'x'})"), false);
  assert.strictEqual(run("dashPrevFichaElegivel('vermifugo', {valor:'Sem ficha'})"), false);
  assert.strictEqual(run("dashPrevFichaElegivel('vermifugo', {chave:'x', origemVencimento:{tipo:'verm'}})"), false);
  assert.strictEqual(run("dashPrevFichaElegivel('vermifugo', {chave:'x', det:{cuidado57_estado:'conferir-orientacao'}})"), false);
  assert.strictEqual(run("dashPrevFichaElegivel('vermifugo', {chave:'x'})"), true);
});

// ------------------------------------------------------------------------- 2 e 3. aplicar e desfazer
const LINHA = { valor: 'Biscoito/Beagle (1 COMPRIMIDO · NA BOLSA)', chave: '', quem: 'Colaboradora Teste', det: { qtd: '1 COMPRIMIDO', onde: 'NA BOLSA' } };
async function aplicar() {
  A.ctx.__o = Object.assign({}, LINHA, { chave: CH_B });
  return run("dashPrevFichaAplicar('" + DIA + "', 'vermifugo', 'L1', __o, PELUDINHOS[0])");
}
prova('aplicar: grava a ficha uma vez só, com o antes guardado, e a segunda passada não grava de novo', async () => {
  zerar({ verm_doses: 'Dose única', verm_t: '2026-06-01', verm_p: '2026-10-01', verm_por: 'Pessoa Antiga' });
  assert.strictEqual(await aplicar(), true);
  assert.strictEqual(run('__GRAVOU.length'), 1);
  const m = lista(run("__ler('daycare/prev-ficha/" + DIA + "/vermifugo/L1')"));
  assert.strictEqual(m.estado, 'aplicado');
  assert.strictEqual(m.antes.verm_t, '2026-06-01');
  assert.strictEqual(m.antes.verm_por, 'Pessoa Antiga');
  assert.ok(!('verm_p_lanc' in m.antes), 'o que não existia não vai para o antes');
  assert.strictEqual(m.depois.verm_t, DIA);
  assert.strictEqual(m.pelKey, PK_B);
  assert.strictEqual(await aplicar(), false);
  assert.strictEqual(run('__GRAVOU.length'), 1, 'a reserva impede a segunda gravação');
});
prova('tirar: a ficha volta ao que era (o que não existia volta vazio) e a marca fica «desfeito»', async () => {
  zerar({ verm_doses: 'Dose única', verm_t: '2026-06-01', verm_p: '2026-10-01' });
  await aplicar();
  run('__GRAVOU=[];');
  assert.strictEqual(await run("dashPrevFichaDesfazer('" + DIA + "', 'vermifugo', 'L1')"), true);
  const g = lista(run('__GRAVOU'));
  assert.strictEqual(g.length, 1);
  assert.strictEqual(g[0].patch.verm_t, '2026-06-01');
  assert.strictEqual(g[0].patch.verm_p, '2026-10-01');
  assert.strictEqual(g[0].patch.verm_p_lanc, '');
  assert.strictEqual(g[0].patch.verm_por, '');
  assert.strictEqual(lista(run("__ler('daycare/prev-ficha/" + DIA + "/vermifugo/L1')")).estado, 'desfeito');
});
prova('tirar: ficha mexida depois do lançamento não é tocada — o cartaz diz para conferir', async () => {
  zerar({ verm_doses: 'Dose única', verm_t: '2026-06-01', verm_p: '2026-10-01' });
  await aplicar();
  run("__FICHAS[pelKey(PELUDINHOS[0])].verm_p='2027-05-05'; __GRAVOU=[];");
  assert.strictEqual(await run("dashPrevFichaDesfazer('" + DIA + "', 'vermifugo', 'L1')"), false);
  assert.strictEqual(run('__GRAVOU.length'), 0);
  assert.strictEqual(run('__ALERTAS[0].t'), 'A FICHA NÃO VOLTOU SOZINHA');
});
prova('sem produto do carrapaticida: a marca diz o porquê e a ficha não é gravada', async () => {
  zerar({});
  A.ctx.__o = { valor: 'Biscoito/Beagle (PIPETA)', chave: CH_B, quem: 'Colaboradora Teste', det: {} };
  assert.strictEqual(await run("dashPrevFichaAplicar('" + DIA + "', 'carrapaticida', 'L2', __o, PELUDINHOS[0])"), true);
  assert.strictEqual(run('__GRAVOU.length'), 0);
  const m = lista(run("__ler('daycare/prev-ficha/" + DIA + "/carrapaticida/L2')"));
  assert.strictEqual(m.estado, 'nao-aplicado');
  assert.strictEqual(m.motivo, 'produto');
});

// ------------------------------------------------------------------------- 4. a linha e a ficha
function linha(estado) {
  A.ctx.__S = estado;
  A.ctx.__o = { valor: 'Biscoito/Beagle', chave: CH_B };
  run('DASH_PREV_FICHA=__S;');
  return run("dashPrevFichaLinhaHTML('vermifugo', 'L1', __o)");
}
prova('a linha: verde com o próximo, cinza esperando o check-in, atenção depois das 12h, e o motivo de não ter mudado', () => {
  const verde = linha({ dia: DIA, marcas: { vermifugo: { L1: { estado: 'aplicado', prox: '2027-02-26' } } }, pres: {}, lendo: false, quando: 0 });
  assert.strictEqual(verde, ' <span style="font-size:11.5px;font-weight:800;color:var(--crm-ok)">Ficha atualizada · próximo em 26/02</span>');
  const RealDate = A.ctx.Date;
  const fixar = (h) => { A.ctx.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(2026, 9, 29, h, 0, 0); } static now() { return new RealDate(2026, 9, 29, h, 0, 0).getTime(); } }; };
  try {
    fixar(10);
    assert.match(linha({ dia: DIA, marcas: {}, pres: { 'vermifugo|L1': false }, lendo: false, quando: 0 }), /color:var\(--muted\)">Ficha: espera o check-in</);
    fixar(13);
    assert.match(linha({ dia: DIA, marcas: {}, pres: { 'vermifugo|L1': false }, lendo: false, quando: 0 }), /color:var\(--crm-atencao-text\)">Sem check-in até as 12h: confira se ele veio</);
  } finally { A.ctx.Date = RealDate; }
  assert.match(linha({ dia: DIA, marcas: { vermifugo: { L1: { estado: 'nao-aplicado', motivo: 'produto' } } }, pres: {}, lendo: false, quando: 0 }), /Ficha não mudou: falta o produto do carrapaticida/);
  assert.strictEqual(linha({ dia: DIA, marcas: { vermifugo: { L1: { estado: 'desfeito' } } }, pres: {}, lendo: false, quando: 0 }), '');
  assert.strictEqual(linha({ dia: DIA, marcas: null, pres: {}, lendo: false, quando: 0 }), '', 'antes de ler as marcas, nada');
});
prova('a ficha (Prevenção): «Atualizado pelos Lançamentos do dia» só enquanto a data for a do lançamento', () => {
  A.ctx.__it = { k: 'verm_p', base: 'verm_t' };
  A.ctx.__ex = { verm_t: DIA, verm_p_lanc: { dia: DIA, quem: 'Colaboradora Teste' } };
  assert.strictEqual(run('dashPrevFichaHintHTML(__it, __ex)'), '<div class="hint" style="margin:0 0 6px">Atualizado pelos Lançamentos do dia em 29/10, por Colaboradora Teste.</div>');
  A.ctx.__ex = { verm_t: '2026-11-15', verm_p_lanc: { dia: DIA, quem: 'Colaboradora Teste' } };
  assert.strictEqual(run('dashPrevFichaHintHTML(__it, __ex)'), '');
});

// ------------------------------------------------------------------------- 5. os ganchos
prova('os ganchos: a linha, o conferir ao desenhar, o aviso depois do cartaz da pendência, o tirar e a ficha', () => {
  assert.ok(html.includes('           +dashCuidado36LinhaHTML(it.k,id,o)\n           +dashPrevFichaLinhaHTML(it.k,id,o)\n'));
  assert.ok(html.includes("try{ dashPrevFichaConciliar(); }catch(e){ _logFalhaGrav('prevenção pelo lançamento (conferir o dia)', e); }"));
  assert.ok(html.includes("if(typeof dashPrevFichaAvisarAoLancar==='function') return dashPrevFichaAvisarAoLancar(k, reg, __diaLanc, abriu);"));
  assert.ok(html.includes("try{ dashPrevFichaDesfazer(__diaTirar, k, id); }"));
  assert.ok(html.includes("'A data da Prevenção na ficha volta a ser a anterior.'"));
  assert.ok(html.includes('+dashPrevFichaHintHTML(it, ex, o.p)'));
  ['dashPrevFichaPatch', 'dashPrevFichaAplicar', 'dashPrevFichaConciliar', 'dashPrevFichaLinhaHTML', 'dashPrevFichaAvisarAoLancar', 'dashPrevFichaDesfazer', 'dashPrevFichaHintHTML']
    .forEach((n) => assert.strictEqual(html.split('function ' + n + '(').length - 1, 1, 'nome repetido ou ausente: ' + n));
});
prova('o aviso ao lançar: sem check-in pede para conferir; com o cartaz da pendência, não repete', async () => {
  zerar({});
  run("dashCuidado36Presenca=function(){ return Promise.resolve(null); }; repEhDiaDele=function(){ return true; };");
  A.ctx.__r = { valor: 'Biscoito/Beagle', chave: CH_B };
  assert.strictEqual(await run("dashPrevFichaAvisarAoLancar('vermifugo', __r, '" + DIA + "', false)"), true);
  assert.strictEqual(run('__ALERTAS[0].t'), 'ELE AINDA NÃO FEZ CHECK-IN HOJE');
  assert.strictEqual(run('__ALERTAS[0].l[0]'), 'Confira se ele veio. A ficha só é atualizada quando o check-in dele for feito.');
  run("__ALERTAS=[]; repEhDiaDele=function(){ return false; };");
  await run("dashPrevFichaAvisarAoLancar('vermifugo', __r, '" + DIA + "', false)");
  assert.strictEqual(run('__ALERTAS[0].t'), 'HOJE NÃO É DIA DELE');
  run('__ALERTAS=[];');
  assert.strictEqual(await run("dashPrevFichaAvisarAoLancar('vermifugo', __r, '" + DIA + "', true)"), false);
  assert.strictEqual(run('__ALERTAS.length'), 0, 'o cartaz da pendência já falou');
});

// ------------------------------------------------------------------------- 6. não veio: sai do dia e vira pendência
// 29/out/2026 (o Flock): a chamada «faltou» ou a falta avisada tiram do dia o que a Prevenção tinha lançado; a pendência
// guarda o lançamento, a data da ficha volta, e a consultora vê na tela de Pendências e na ficha.
run(`
  var __ESP=[];
  dashEspelhar=function(k, id, reg, acao, dia){ __ESP.push([k, id, acao, dia]); return Promise.resolve({ok:true}); };
  dashPontePronta=function(){ return Promise.resolve({url:'x'}); };
  renderDash=function(){};
  dcDataKey=function(){ return ${JSON.stringify(DIA)}; };
  ehHoje=function(){ return false; };
  var __REP={};
  repLancamentos=function(p){ return __REP[pelKey(p)]||[]; };
`);
const CH_P = run("dcKey('Pipoca','Tutora Exemplo')");
const espera = () => new Promise((r) => setTimeout(r, 0));
function dia(itens) { A.ctx.__d = itens; run("__por('daycare/dashboard/" + DIA + "', __d); __ESP=[]; PEND_ABERTAS={};"); }
const noDia = (item, id) => lista(run("__ler('daycare/dashboard/" + DIA + "/" + item + "/" + id + "')"));
const pend = (ch, item) => lista(run("__ler('daycare/pendencias/" + ch + "/" + item + "')"));
prova('a chamada «faltou»: carrapaticida vira pendência e sai do dia e da planilha; medicação vira pendência e fica; quem veio fica', async () => {
  zerar({});
  dia({ carrapaticida: { L5: { valor: 'Biscoito/Beagle (PIPETA)', chave: CH_B } },
    medicacao: { M1: { valor: 'Biscoito/Beagle (1 GOTA)', chave: CH_B } },
    vermifugo: { L6: { valor: 'Pipoca/Poodle', chave: CH_P } } });
  assert.strictEqual(await run("pendVarrerDia('" + DIA + "', [" + JSON.stringify(CH_B) + '])'), 2);
  await espera();
  assert.strictEqual(noDia('carrapaticida', 'L5'), null, 'o carrapaticida saiu do dia');
  assert.ok(noDia('medicacao', 'M1'), 'a medicação tem regra própria: fica');
  assert.ok(noDia('vermifugo', 'L6'), 'quem veio não é tocado');
  const pc = pend(CH_B, 'carrapaticida');
  assert.strictEqual(pc.status, 'aberta');
  assert.strictEqual(pc.porque, 'faltou');
  assert.strictEqual(pc.valor, 'Biscoito/Beagle (PIPETA)', 'a pendência guarda o lançamento');
  assert.strictEqual(pc.saiu.L5.dia, DIA);
  assert.strictEqual(pend(CH_B, 'medicacao').status, 'aberta');
  assert.deepStrictEqual(lista(run('__ESP')), [['carrapaticida', 'L5', 'remover', DIA]], 'sai da planilha uma vez, no dia certo');
  run('__ESP=[];');
  await run("pendVarrerDia('" + DIA + "', [" + JSON.stringify(CH_B) + '])');
  await espera();
  assert.strictEqual(run('__ESP.length'), 0, 'varrer de novo não manda tirar da planilha outra vez');
});
prova('não veio depois do check-in ter gravado a ficha: a data da Prevenção volta à anterior', async () => {
  zerar({ verm_doses: 'Dose única', verm_t: '2026-06-01', verm_p: '2026-10-01' });
  await aplicar();
  dia({ vermifugo: { L1: Object.assign({}, LINHA, { chave: CH_B }) } });
  run('__GRAVOU=[];');
  await run("pendVarrerDia('" + DIA + "', [" + JSON.stringify(CH_B) + '])');
  await espera(); await espera();
  assert.strictEqual(noDia('vermifugo', 'L1'), null);
  assert.strictEqual(run('__GRAVOU.length'), 1);
  assert.strictEqual(run('__GRAVOU[0].patch.verm_t'), '2026-06-01');
  assert.strictEqual(lista(run("__ler('daycare/prev-ficha/" + DIA + "/vermifugo/L1')")).estado, 'desfeito');
});
prova('lançar para quem o tutor avisou da falta: a linha sai do dia na hora e o cartaz diz por quê; com a chamada «veio», fica', async () => {
  zerar({});
  run("__REP[pelKey(PELUDINHOS[0])]=[{_id:'fa-" + DIA + "', tipo:'credito', data:'" + DIA + "'}];");
  A.ctx.__r = { valor: 'Biscoito/Beagle (1 COMPRIMIDO)', chave: CH_B };
  dia({ vermifugo: { L7: A.ctx.__r } });
  assert.strictEqual(await run("pendAvaliarLancamento('vermifugo', __r, '" + DIA + "', 'L7')"), true);
  await espera();
  assert.strictEqual(noDia('vermifugo', 'L7'), null);
  assert.strictEqual(pend(CH_B, 'vermifugo').porque, 'avisada');
  const l = run('__ALERTAS[0].l[0]');
  assert.ok(l.indexOf('saiu dos Lançamentos do dia (e da planilha e da TV) e ficou guardado como PENDÊNCIA — o tutor avisou da falta.') > 0, l);
  zerar({});
  dia({ vermifugo: { L8: A.ctx.__r } });
  run("__por('daycare/chamada/" + DIA + "/" + CH_B + "', 'veio');");
  assert.strictEqual(await run("pendAvaliarLancamento('vermifugo', __r, '" + DIA + "', 'L8')"), false, 'avisou e veio mesmo assim (QA30)');
  assert.ok(noDia('vermifugo', 'L8'));
  run("__REP={};");
});
prova('a linha com alteração de hora pendente não é tirada: a pendência abre e a linha fica', async () => {
  zerar({});
  dia({ escova: { E1: { valor: 'Biscoito/Beagle', chave: CH_B, edicao_pendente: true } } });
  await run("pendVarrerDia('" + DIA + "', [" + JSON.stringify(CH_B) + '])');
  await espera();
  assert.ok(noDia('escova', 'E1'));
  assert.strictEqual(pend(CH_B, 'escova').status, 'aberta');
  assert.strictEqual(run('__ESP.length'), 0);
});
prova('a falta avisada lançada nas Reposições varre os dias dela (menos o dia em que a chamada diz «veio»)', async () => {
  zerar({});
  dia({ coleira: { C1: { valor: 'Biscoito/Beagle (A COLEIRA VEIO)', chave: CH_B } } });
  run("__por('daycare/chamada/" + DIA + "/" + CH_B + "', 'veio');");
  assert.strictEqual(await run("pendFaltaAvisadaVarrer(" + JSON.stringify(CH_B) + ", ['" + DIA + "'])"), 0);
  assert.ok(noDia('coleira', 'C1'));
  run("__por('daycare/chamada/" + DIA + "/" + CH_B + "', null);");
  assert.strictEqual(await run("pendFaltaAvisadaVarrer(" + JSON.stringify(CH_B) + ", ['" + DIA + "', '" + DIA + "'])"), 1, 'o mesmo dia duas vezes conta uma');
  await espera();
  assert.strictEqual(noDia('coleira', 'C1'), null);
  assert.strictEqual(pend(CH_B, 'coleira').porque, 'avisada');
});
prova('a consultora vê: a tela de Pendências diz o porquê e que saiu do dia; a ficha mostra «Pendente» no item', () => {
  A.ctx.__pa = {};
  A.ctx.__pa[CH_B] = { carrapaticida: { status: 'aberta', dia: DIA, dias: [DIA], item: 'carrapaticida', valor: 'Biscoito/Beagle (PIPETA)', nome: 'Biscoito', porque: 'avisada', saiu: { L5: { dia: DIA } } } };
  A.ctx.__pa[CH_P] = { escova: { status: 'aberta', dia: DIA, item: 'escova', valor: 'Pipoca/Poodle', nome: 'Pipoca', porque: 'faltou' } };
  run('PEND_ABERTAS=__pa;');
  const L = lista(run('pendLista()'));
  assert.deepStrictEqual(L.map((r) => [r.item, r.porque, r.saiu]), [['carrapaticida', 'avisada', true], ['escova', 'faltou', false]]);
  run("pendRender();");
  const tela = String(run("document.getElementById('pendRoot').innerHTML") || '');
  assert.ok(tela.indexOf('Não veio em <strong>29/10/2026</strong> · o tutor avisou da falta') >= 0, tela.slice(0, 600));
  assert.ok(tela.indexOf(' · saiu dos Lançamentos do dia</div>') >= 0);
  A.ctx.__it = { k: 'ecto_p', base: 'ecto_t' };
  assert.strictEqual(run('dashPrevFichaHintHTML(__it, {}, PELUDINHOS[0])'),
    '<div class="hint" style="margin:0 0 6px;color:var(--crm-atencao-text);font-weight:700">Pendente: lançado para 29/10 e ele não veio (o tutor avisou da falta). A recepção resolve em Pendências de prevenção quando ele vier.</div>');
  A.ctx.__it = { k: 'escova_p', base: 'escova_t' };
  assert.match(run('dashPrevFichaHintHTML(__it, {}, PELUDINHOS[1])'), /e ela não veio \(a chamada diz que faltou\)\. A recepção resolve em Pendências de prevenção quando ela vier\./);
  A.ctx.__it = { k: 'col_p', base: 'col_t' };
  assert.strictEqual(run('dashPrevFichaHintHTML(__it, {}, PELUDINHOS[0])'), '', 'sem pendência no item, nada');
  run('PEND_ABERTAS={};');
});
prova('os ganchos da falta: o lançamento passa o id, a falta avisada varre, o dia das 12h varre as avisadas; as varreduras de antes continuam', () => {
  assert.ok(html.includes('Promise.resolve(pendAvaliarLancamento(k, reg, dashDia(), ref.key)).then('));
  assert.ok(html.includes("pendFaltaAvisadaVarrer(dcKey(p.n,p.tutor), regs.map(function(r){ return r.data; }));"));
  assert.ok(html.includes("if(typeof faltouHoje==='function' && faltouHoje(o)){ avisadasPlan.push(k); return; }"));
  assert.ok(html.includes("pendVarrerDia(hoje, avisadasPlan, 'avisada');"));
  assert.ok(/pendVarrerDia\(hoje, marcados\.map\(function\(m\)\{ return m\.k; \}\)\)/.test(html));
  assert.ok(/if\(next==='faltou' && typeof pendVarrerDia==='function'\) pendVarrerDia\(dcDataKey\(\), \[k\]\);/.test(html));
  ['pendTirarDoDia', 'pendFaltaAvisadaVarrer', 'pendAvisadaNoDia', 'dashPrevFichaPendHTML']
    .forEach((n) => assert.strictEqual(html.split('function ' + n + '(').length - 1, 1, 'nome repetido ou ausente: ' + n));
});

(async () => {
  let ok = 0;
  for (const [nome, fn] of fila) {
    try { await fn(); ok++; } catch (e) { console.error('FALHOU: ' + nome + '\n  ' + (e && e.message)); process.exitCode = 1; }
  }
  console.log('prevencao-lancamento165: ' + ok + ' de ' + fila.length + ' provas passaram.');
})();
