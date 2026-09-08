'use strict';
/*
 * CONSUMO DE BYTES — a prova da economia de 07/set/2026 (68 MB/h na loja).
 *
 * O QUE ESTE TESTE FAZ
 * Carrega o <script> REAL do index.html num sandbox (como o harness) e liga nele um
 * BANCO FALSO que serve o retrato diário do disco e CONTA CADA BYTE que "desce" —
 * imitando o fio do Realtime Database: once() baixa o nó inteiro; um ouvinte (on)
 * baixa o nó UMA vez e depois recebe só a mudança; nó já sincronizado por um ouvinte
 * não desce de novo num once().
 *
 * AS TRÊS PROVAS
 *  1. Painel da Operação: 10 voltas do relógio de 30 s. A auditoria (30 dias, ~2 MB)
 *     desce UMA vez; as voltas seguintes custam só os nós miúdos do dia. Antes do
 *     conserto, cada volta relia os 2 MB — era a causa dominante dos 68 MB/h.
 *  2. Placar de doses (dosesMedDoDia, relógios de 30/60 s): o log do dia desce uma
 *     vez; reler é consulta de memória.
 *  3. A hipótese do carimbo (zCarimbar/zMapaVivo): aparelho aberto + gravações de
 *     terceiros. Com a cópia local válida, NADA desce; quando o carimbo muda, a
 *     coleção desce UMA vez; daí em diante cada gravação de terceiro desce só o
 *     registro mudado — nunca a coleção inteira de novo.
 *
 * Uso:  node tests/consumo-bytes.test.js [--app caminho/para/index.html]
 * (o --app serve para medir uma versão antiga e comparar antes × depois)
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const retratoLib = require('./lib/retrato');

const argApp = (() => {
  const i = process.argv.indexOf('--app');
  return i !== -1 ? process.argv[i + 1] : null;
})();
const APP = path.resolve(argApp || path.join(__dirname, '..', 'auaulandia', 'index.html'));

function bytesDe(v) { return Buffer.byteLength(JSON.stringify(v === undefined ? null : v)); }
function kb(n) { return (n / 1024).toFixed(1) + ' KB'; }
function chaveDia(d) { const p = (x) => String(x).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); }

// ------------------------------------------------------------------ banco falso
// Serve `dados` (objeto raiz {daycare:…, auaulandia:…}) e conta o que desce.
function BancoFalso(dados) {
  const escutas = {};        // caminho → {child:[cb…], value:[cb…]}
  const sincronizados = {};  // caminho com ouvinte ativo: o subárvore já está no aparelho
  const porNo = {};          // bytes baixados por raiz de nó (2 segmentos)
  const eu = { dados, porNo, total: 0 };

  function lerCaminho(p) {
    let no = dados;
    for (const parte of String(p).split('/').filter(Boolean)) {
      if (no == null || typeof no !== 'object') return null;
      no = no[parte];
    }
    return no === undefined ? null : no;
  }
  function escreverCaminho(p, v) {
    const partes = String(p).split('/').filter(Boolean);
    let no = dados;
    for (let i = 0; i < partes.length - 1; i++) {
      if (no[partes[i]] == null || typeof no[partes[i]] !== 'object') no[partes[i]] = {};
      no = no[partes[i]];
    }
    const ult = partes[partes.length - 1];
    if (v === null || v === undefined) delete no[ult]; else no[ult] = v;
  }
  function raizDe(p) { return String(p).split('/').filter(Boolean).slice(0, 2).join('/'); }
  function conta(p, n) { eu.total += n; porNo[raizDe(p)] = (porNo[raizDe(p)] || 0) + n; }
  function coberto(p) {   // algum ouvinte ativo cobre este caminho? (o SDK já tem o dado)
    const alvo = String(p).split('/').filter(Boolean).join('/');
    return Object.keys(sincronizados).some((s) => alvo === s || alvo.indexOf(s + '/') === 0);
  }
  function snap(chave, v) { return { key: chave, val: function () { return v; } }; }

  function fazRef(p) {
    p = String(p).split('/').filter(Boolean).join('/');
    const r = {
      once: function (evt) {
        const v = lerCaminho(p);
        if (!coberto(p)) conta(p, bytesDe(v));
        return Promise.resolve(snap(p.split('/').pop(), v));
      },
      on: function (evt, cb) {
        escutas[p] = escutas[p] || { child_added: [], child_changed: [], child_removed: [], value: [] };
        if (!escutas[p][evt]) escutas[p][evt] = [];
        escutas[p][evt].push(cb);
        const v = lerCaminho(p);
        const jaTinha = coberto(p);
        if (evt === 'child_added') {
          if (v && typeof v === 'object') Object.keys(v).forEach(function (k) {
            if (!jaTinha) conta(p, bytesDe(v[k]));
            cb(snap(k, v[k]));
          });
          sincronizados[p] = true;
        } else if (evt === 'value') {
          if (!jaTinha) conta(p, bytesDe(v));
          sincronizados[p] = true;
          cb(snap(p.split('/').pop(), v));
        }
        return cb;
      },
      off: function () { delete escutas[p]; delete sincronizados[p]; },
      set: function (v) { escreverCaminho(p, v); return Promise.resolve(); },
      update: function (o) { Object.keys(o || {}).forEach(function (k) { escreverCaminho(p + '/' + k, o[k]); }); return Promise.resolve(); },
      remove: function () { escreverCaminho(p, null); return Promise.resolve(); },
      push: function (v) { const k = 'f' + Math.random().toString(36).slice(2); if (v !== undefined) escreverCaminho(p + '/' + k, v); const filho = fazRef(p + '/' + k); filho.key = k; return filho; },
      transaction: function (fn, cb) {
        const atual = lerCaminho(p);
        const novo = fn(atual);
        if (novo === undefined) { const res = { committed: false, snapshot: snap(null, atual) }; if (cb) cb(null, false, res.snapshot); return Promise.resolve(res); }
        escreverCaminho(p, novo);
        const res = { committed: true, snapshot: snap(null, novo) };
        if (cb) cb(null, true, res.snapshot);
        return Promise.resolve(res);
      },
      limitToFirst: function () { return r; },
      limitToLast: function () { return r; },
      orderByChild: function () { return r; },
    };
    return r;
  }

  // Gravação vinda de OUTRO aparelho: muda o dado e entrega aos ouvintes daqui,
  // contando só o delta (é o que o servidor manda pelo fio).
  eu.escreverExterno = function (p, v) {
    p = String(p).split('/').filter(Boolean).join('/');
    const eraNovo = lerCaminho(p) === null;
    escreverCaminho(p, v);
    let contou = false;
    Object.keys(escutas).forEach(function (L) {
      if (!(p === L || p.indexOf(L + '/') === 0)) return;
      if (!contou) { conta(L, bytesDe(v)); contou = true; }   // o fio manda o delta uma vez
      const e = escutas[L];
      if (p === L) { (e.value || []).forEach(function (cb) { cb(snap(L.split('/').pop(), lerCaminho(L))); }); return; }
      const filho = p.slice(L.length + 1).split('/')[0];
      const vFilho = lerCaminho(L + '/' + filho);
      const lista = eraNovo && p === L + '/' + filho ? e.child_added : (e.child_changed.length ? e.child_changed : e.child_added);
      (lista || []).forEach(function (cb) { cb(snap(filho, vFilho)); });
      (e.value || []).forEach(function (cb) { cb(snap(L.split('/').pop(), lerCaminho(L))); });
    });
  };
  eu.ref = fazRef;
  eu.zerar = function () { eu.total = 0; Object.keys(porNo).forEach(function (k) { delete porNo[k]; }); };
  return eu;
}

// ------------------------------------------------------------------ sandbox
function universal(name) {
  const fn = function () { return fn; };
  fn.__name = name;
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
function fazSandbox(guardados) {
  const roleHolder = { role: 'gestao' };
  const armazem = {};   // localStorage de verdade (o teste do carimbo pré-carrega a cópia)
  Object.assign(armazem, guardados || {});
  const bodyEl = {
    dataset: roleHolder,
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    appendChild() {}, style: {}, addEventListener() {},
    setAttribute() {}, getAttribute() { return null; },
  };
  const documentStub = {
    body: bodyEl,
    head: { appendChild() {} },
    documentElement: universal('documentElement'),
    getElementById() { return universal('el'); },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    createElement() { return universal('el'); },
    addEventListener() {},
    getElementsByClassName() { return []; },
    getElementsByTagName() { return []; },
    cookie: '',
  };
  const neverResolves = new Promise(() => {});
  const firebaseStub = {
    initializeApp() { return {}; },
    auth() { return { signInAnonymously() { return neverResolves; }, onAuthStateChanged() {} }; },
    database() { return { ref() { return universal('ref'); } }; },
    appCheck: undefined,
  };
  const sandbox = {
    console, Date, Math, JSON, Object, Array, String, Number, Boolean,
    parseInt, parseFloat, isNaN, isFinite, RegExp, Promise, Map, Set, Symbol,
    encodeURIComponent, decodeURIComponent, setTimeout() {}, clearTimeout() {},
    setInterval() {}, clearInterval() {}, requestAnimationFrame() {},
    performance: { now() { return 0; } },
    document: documentStub,
    firebase: firebaseStub,
    localStorage: {
      getItem(k) { return Object.prototype.hasOwnProperty.call(armazem, k) ? armazem[k] : null; },
      setItem(k, v) { armazem[k] = String(v); },
      removeItem(k) { delete armazem[k]; },
    },
    navigator: { userAgent: 'consumo-teste', onLine: true },
    location: { href: 'https://harness.local/', reload() {}, hostname: 'harness.local' },
    alert() {}, confirm() { return true; }, prompt() { return ''; },
    addEventListener() {},
    __ROLE__: roleHolder,
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.self = sandbox;
  return sandbox;
}
function extrairScript(html) {
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  let m, maior = null;
  while ((m = re.exec(html)) !== null) if (m[1] && m[1].length > (maior ? maior.length : 0)) maior = m[1];
  if (!maior) throw new Error('Não achei o <script> inline principal');
  return maior;
}
function novoContexto(banco, guardadosLocal) {
  const html = fs.readFileSync(APP, 'utf8');
  const script = extrairScript(html);
  const sandbox = fazSandbox(guardadosLocal);
  const ctx = vm.createContext(sandbox);
  vm.runInContext(script, ctx, { filename: path.basename(APP) + '#script', timeout: 20000 });
  ctx.__BANCO__ = banco;
  vm.runInContext('DB=__BANCO__;', ctx);
  // As telas não interessam aqui — só o que desce do banco. Pinturas viram nada.
  vm.runInContext(
    "['renderPainelDia','renderEquipe','renderPlantao','renderMedAtrasadaGestora','carregarEquipeExtra']" +
    ".forEach(function(n){ try{ if(typeof this[n]==='function'||typeof this[n]==='undefined') this[n]=function(){}; }catch(e){} }, this);",
    ctx);
  return ctx;
}
const respirar = () => new Promise((r) => setImmediate(r));
async function assentar(n) { for (let i = 0; i < (n || 12); i++) await respirar(); }

// ------------------------------------------------------------------ runner
let ok = 0, falha = 0;
const falhas = [];
function prova(nome, cond, detalhe) {
  if (cond) { ok++; console.log('  ✓ ' + nome); }
  else { falha++; falhas.push(nome + (detalhe ? ' — ' + detalhe : '')); console.log('  ✗ ' + nome + (detalhe ? ' — ' + detalhe : '')); }
}

async function main() {
  console.log('== Consumo de bytes — banco falso que conta o que desce ==');
  console.log('App: ' + APP + '\n');
  const RET = retratoLib.carregar();
  console.log('Retrato: ' + RET.dia + '\n');

  // O retrato termina ontem; o app vive em HOJE. Enxerta em "hoje" um dia realista:
  // a auditoria mais pesada do retrato e um log de doses de verdade.
  function montarDados() {
    const dados = { daycare: JSON.parse(JSON.stringify(RET.daycare)), auaulandia: JSON.parse(JSON.stringify(RET.auaulandia)) };
    const hoje = chaveDia(new Date());
    const aud = dados.daycare.auditoria || {};
    const diaGordo = Object.keys(aud).sort(function (a, b) { return bytesDe(aud[b]) - bytesDe(aud[a]); })[0];
    dados.daycare.auditoria[hoje] = JSON.parse(JSON.stringify(aud[diaGordo] || {}));
    const dias = Object.keys(aud).sort();
    const ontem = dias[dias.length - 2] || diaGordo;
    ['chamada', 'almoco', 'almoco-turno', 'atividade'].forEach(function (n) {
      const no = dados.daycare[n] || {};
      if (no[ontem]) { dados.daycare[n] = dados.daycare[n] || {}; dados.daycare[n][hoje] = JSON.parse(JSON.stringify(no[ontem])); }
    });
    const ml = dados.auaulandia['medicacao-log'] || {};
    const mlDias = Object.keys(ml).sort();
    if (mlDias.length) dados.auaulandia['medicacao-log'][hoje] = JSON.parse(JSON.stringify(ml[mlDias[mlDias.length - 1]]));
    return { dados, hoje };
  }

  // ---------- PROVA 1: Painel da Operação — 10 voltas do relógio de 30 s ----------
  console.log('Prova 1 — Painel da Operação (10 voltas do relógio de 30 s):');
  {
    const { dados, hoje } = montarDados();
    const banco = BancoFalso(dados);
    const ctx = novoContexto(banco);
    const tamAudHoje = bytesDe(dados.daycare.auditoria[hoje]);

    vm.runInContext('carregarPainel()', ctx);
    await assentar(30);
    const aposPrimeira = banco.total;
    const audAposPrimeira = banco.porNo['daycare/auditoria'] || 0;
    for (let i = 0; i < 9; i++) { vm.runInContext('carregarPainel()', ctx); await assentar(20); }
    const aposDez = banco.total;
    const audAposDez = banco.porNo['daycare/auditoria'] || 0;
    const custoVoltas = aposDez - aposPrimeira;

    console.log('    1ª volta (sessão abre): ' + kb(aposPrimeira) + ' — auditoria: ' + kb(audAposPrimeira));
    console.log('    voltas 2 a 10 (9 voltas): ' + kb(custoVoltas) + ' (' + kb(custoVoltas / 9) + ' por volta)');
    prova('a auditoria de hoje (' + kb(tamAudHoje) + ') desceu na primeira volta', audAposPrimeira >= tamAudHoje, kb(audAposPrimeira));
    prova('depois da primeira volta, NENHUM byte de auditoria desce de novo', audAposDez === audAposPrimeira,
      kb(audAposDez - audAposPrimeira) + ' a mais');
    prova('9 voltas seguintes custam menos de 200 KB no total (antes: ~2 MB CADA volta)', custoVoltas < 200 * 1024, kb(custoVoltas));

    // "Aparelho aberto + 5 gravações de terceiros" na auditoria: desce só o registro.
    banco.zerar();
    for (let i = 0; i < 5; i++) banco.escreverExterno('daycare/auditoria/' + hoje + '/novo' + i,
      { acao: 'teste', quem: 'outro aparelho', hora: '10:0' + i, texto: 'gravação de terceiro nº ' + i });
    await assentar(5);
    const deltaAud = banco.porNo['daycare/auditoria'] || 0;
    console.log('    5 gravações de terceiros na auditoria: desceram ' + kb(deltaAud));
    prova('5 gravações de terceiros descem só o delta (< 3 KB), não o dia inteiro', deltaAud > 0 && deltaAud < 3 * 1024, kb(deltaAud));
  }

  // ---------- PROVA 2: placar de doses — reler é consulta de memória ----------
  console.log('\nProva 2 — Placar de doses do dia (relógios de 30/60 s):');
  {
    const { dados, hoje } = montarDados();
    const banco = BancoFalso(dados);
    const ctx = novoContexto(banco);
    const tamLog = bytesDe(dados.auaulandia['medicacao-log'][hoje] || {});
    vm.runInContext("MED_AGENDA_TODOS=[{hospNome:'Prova',key:'prova',itemId:'i1',nome:'Optivet',q:1,u:'ml',horario:'08:00'}];", ctx);
    vm.runInContext('dosesMedDoDia()', ctx); await assentar(15);
    const aposPrimeira = banco.porNo['auaulandia/medicacao-log'] || 0;
    for (let i = 0; i < 9; i++) { vm.runInContext('dosesMedDoDia()', ctx); await assentar(8); }
    const aposDez = banco.porNo['auaulandia/medicacao-log'] || 0;
    console.log('    log do dia: ' + kb(tamLog) + ' — 1ª leitura: ' + kb(aposPrimeira) + ' — 10 leituras: ' + kb(aposDez));
    prova('o log do dia desce uma vez', aposPrimeira >= tamLog * 0.85 && aposPrimeira <= tamLog * 1.1 + 64, kb(aposPrimeira));
    prova('reler 9 vezes não baixa NADA de novo (antes: o dia inteiro a cada volta)', aposDez === aposPrimeira,
      kb(aposDez - aposPrimeira) + ' a mais');
  }

  // ---------- PROVA 3: a hipótese do carimbo — aparelho aberto + gravações ----------
  console.log('\nProva 3 — Carimbo de coleção (zCarimbar/zMapaVivo), cadastro e estadias:');
  {
    const { dados } = montarDados();
    dados.daycare.versoes = { cadastro: 7 };
    const tamCad = bytesDe(dados.daycare.cadastro);
    const tamEst = bytesDe(dados.auaulandia.estadias);
    // A cópia local válida (carimbo igual ao do banco): abertura não baixa a coleção.
    const copia = JSON.stringify({ v: 7, mapa: dados.daycare.cadastro });
    const banco = BancoFalso(dados);
    const ctx = novoContexto(banco, { zeluz_copia_v1_daycare_cadastro: copia });

    vm.runInContext("zMapaVivo('daycare/cadastro','_prova',function(){})", ctx);
    await assentar(10);
    const cadAbertura = banco.porNo['daycare/cadastro'] || 0;
    console.log('    abertura com cópia local válida: cadastro desceu ' + kb(cadAbertura) + ' (coleção tem ' + kb(tamCad) + ')');
    prova('com a cópia local válida, a coleção NÃO desce na abertura', cadAbertura === 0, kb(cadAbertura));

    // Um terceiro grava e o carimbo sobe: a coleção desce UMA vez (religa o vivo)…
    const umaChave = Object.keys(dados.daycare.cadastro)[0];
    banco.escreverExterno('daycare/cadastro/' + umaChave + '/peso', '7,4 kg');
    banco.escreverExterno('daycare/versoes/cadastro', 8);
    await assentar(10);
    const cadAposBump = banco.porNo['daycare/cadastro'] || 0;
    console.log('    1º carimbo que muda: cadastro desceu ' + kb(cadAposBump));
    prova('quando o carimbo muda, a coleção desce UMA vez (preço de uma abertura)',
      cadAposBump >= tamCad * 0.9 && cadAposBump <= tamCad * 1.15, kb(cadAposBump) + ' vs ' + kb(tamCad));

    // …e daí em diante CADA gravação de terceiro desce só o registro mudado.
    const chaves = Object.keys(dados.daycare.cadastro).slice(0, 5);
    const antes5 = banco.porNo['daycare/cadastro'] || 0;
    chaves.forEach(function (k, i) {
      banco.escreverExterno('daycare/cadastro/' + k + '/peso', (5 + i) + ',0 kg');
      banco.escreverExterno('daycare/versoes/cadastro', 9 + i);
    });
    await assentar(10);
    const delta5 = (banco.porNo['daycare/cadastro'] || 0) - antes5;
    console.log('    5 gravações de terceiros depois do vivo: desceram ' + kb(delta5));
    prova('aparelho JÁ no vivo: 5 gravações descem só os registros (< 25 KB), nunca a coleção de novo',
      delta5 > 0 && delta5 < 25 * 1024, kb(delta5) + ' (coleção inteira seria ' + kb(tamCad * 5) + ')');

    // Estadias, sem cópia local: desce inteira UMA vez na abertura; depois, só a mudança.
    vm.runInContext("zMapaVivo('auaulandia/estadias','_prova2',function(){})", ctx);
    await assentar(10);
    const estAbertura = banco.porNo['auaulandia/estadias'] || 0;
    prova('estadias sem cópia: desce inteira uma vez na abertura', estAbertura >= tamEst * 0.9 && estAbertura <= tamEst * 1.15,
      kb(estAbertura) + ' vs ' + kb(tamEst));
    const chEst = Object.keys(dados.auaulandia.estadias).slice(0, 5);
    chEst.forEach(function (k) { banco.escreverExterno('auaulandia/estadias/' + k + '/obsProva', 'gravação de terceiro'); });
    await assentar(10);
    const estDelta = (banco.porNo['auaulandia/estadias'] || 0) - estAbertura;
    console.log('    estadias: abertura ' + kb(estAbertura) + ' · 5 gravações de terceiros: ' + kb(estDelta));
    prova('estadias no vivo: 5 gravações de terceiros descem só as estadias mudadas (< 60 KB)',
      estDelta > 0 && estDelta < 60 * 1024, kb(estDelta));
  }

  // ---------- PROVA 4: os relógios no código-fonte ----------
  console.log('\nProva 4 — os relógios no código-fonte:');
  {
    const html = fs.readFileSync(APP, 'utf8');
    prova('o risco de não comer roda de 5 em 5 minutos (não mais a cada 60 s)',
      /carregarRiscoNaoComer==='function'\) carregarRiscoNaoComer\(\); \}, 300000\)/.test(html));
    prova('o relógio do painel não roda com a aba escondida (document.hidden)',
      /setInterval\(function\(\)\{ try\{ if\(document\.hidden\) return; const v=document\.getElementById\('v-painel'\)/.test(html));
    prova('o relógio do risco de não comer não roda com a aba escondida',
      /if\(document\.hidden\) return; if\(typeof carregarRiscoNaoComer/.test(html));
  }

  console.log('\n== Resultado: ' + ok + ' ok, ' + falha + ' falha(s) ==');
  if (falha) { falhas.forEach(function (f) { console.log('  ✗ ' + f); }); process.exit(1); }
}

main().catch(function (e) { console.error('ERRO:', e && e.stack || e); process.exit(1); });
