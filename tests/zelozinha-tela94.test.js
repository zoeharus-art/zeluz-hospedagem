'use strict';
/*
 * PROVAS da Story 6.94 — «Contatos e respostas de hoje» em um toque (Zelozinha).
 * Dado 100% inventado: FILHOts «Teste …», tutores «Tutor Teste …», telefones fictícios (31 9999-000x). Nenhum dado de produção, nenhum Firebase,
 * nenhum pedido de rede (todo http(s) é abortado). O banco é um banco de mentira ESPIÃO (árvore em memória: o que lê e o que grava fica registrado).
 *
 * Dois ambientes:
 *   L  — Node (vm): o app inteiro carregado como no navegador (todos os <script> inline, na ordem), para as funções puras, o texto ao tutor, o núcleo
 *        e as impressões digitais da área protegida;
 *   C  — Chromium a 375 px (Playwright): o APP REAL (file://), com o banco de mentira trocado por baixo. Aí rodam os toques de verdade: o `registrar` real,
 *        o Snoopy real, o cartaz «Anular» real e as medidas de página. Sem o Playwright/Chromium as provas C dizem PULADO (e não contam como passadas).
 *
 * Uso:  node tests/zelozinha-tela94.test.js            (roda tudo)
 *       TZ=America/Sao_Paulo node tests/zelozinha-tela94.test.js
 *       PROVAS=P1,P7 node tests/zelozinha-tela94.test.js   (só estas)
 *       APP94=/caminho/index.html   (outra cópia do app, para os defeitos plantados)
 *       APP94_BASE=/caminho/index.html   (o app da base b044ecd, só para comparar as leituras por toque da P25)
 *       LATENCIA94=15 node tests/zelozinha-tela94.test.js   (cada leitura e gravação do banco de mentira demora 15 ms: nenhuma prova pode depender de tempo fixo; as esperas são por CONDIÇÃO)
 *       CACHEFRIO94=1 node tests/zelozinha-tela94.test.js   (o banco de mentira faz a transação como o Firebase de verdade em TODAS as provas do navegador: 1ª rodada com null quando o nó não está no aparelho, 6.113)
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const assert = require('assert');

const APP = process.env.APP94 || path.join(__dirname, '..', 'auaulandia', 'index.html');
const APP_BASE = process.env.APP94_BASE || '';
const SO = (process.env.PROVAS || '').split(',').map((x) => x.trim().toUpperCase()).filter(Boolean);
const DIA = '2026-10-20';
const FUSO_NAVEGADOR = process.env.TZ === 'America/Sao_Paulo' ? 'America/Sao_Paulo' : 'UTC';
const HTML = fs.readFileSync(APP, 'utf8');

let ok = 0, puladas = 0; const falhas = [];
const fila = [];
function quer(id) { return SO.length === 0 || SO.indexOf(id) >= 0; }
/* prova('P1', 'título', async () => {...}) — o id agrupa as provas de uma mesma P e deixa filtrar com PROVAS=P1,P7 */
function prova(id, nome, fn, ambiente) { fila.push({ id: id, nome: '6.94 ' + id + ' — ' + nome, fn: fn, ambiente: ambiente || 'L' }); }

// ---------------------------------------------------------------- o banco de mentira (serializado também para dentro da página)
/* opcoes: {latencia, cacheFrio}
   `cacheFrio` (6.113): a transação como a do Firebase 10 de verdade. A 1ª rodada roda com o que o APARELHO tem guardado: o valor do servidor só quando há um ouvinte (`on`)
   ligado no nó ou acima dele que já recebeu o 1º valor; senão, null. Se a 1ª rodada desiste (`undefined`), o Firebase desiste ali mesmo, sem consultar o servidor, e devolve o
   que o aparelho tinha (null); se ela propõe sobre um retrato diferente do servidor, o servidor recusa e a função roda de novo com o valor dele. É o `bancoFiel` do harness
   (L11755). Com a opção, o 1º valor de um ouvinte novo só chega depois de uma volta pelo relógio (a latência, ou zero ms: é a ida ao servidor, nunca no mesmo instante),
   e um ouvinte desligado antes dele não recebe nada.
   Sem a opção, a 1ª rodada já recebe o valor do servidor (o banco de antes, que escondia o defeito do Boris). */
function criarBancoFalso(seed, opcoes) {
  opcoes = opcoes || {};
  var arv = seed ? JSON.parse(JSON.stringify(seed)) : {};
  var log = { leituras: [], gravacoes: [], transacoes: [] };
  var ouvintes = [];
  var falhas = [], falhasEscrita = [], calados = [];
  var pend = 0;   /* operações do banco ainda em andamento (só existem com latência): as provas só dão o toque por terminado com zero delas */
  var SV = { '.sv': 'timestamp' };
  function clone(x) { return x === undefined ? undefined : JSON.parse(JSON.stringify(x)); }
  function partes(p) { return String(p || '').split('/').filter(function (x) { return x !== ''; }); }
  function pegar(p) {
    var c = arv, ps = partes(p);
    for (var i = 0; i < ps.length; i++) { if (c === null || typeof c !== 'object' || !(ps[i] in c)) return undefined; c = c[ps[i]]; }
    return c;
  }
  function resolverSV(v) {
    if (v && typeof v === 'object') {
      if (v['.sv'] === 'timestamp') return Date.now();
      Object.keys(v).forEach(function (k) { v[k] = resolverSV(v[k]); });
    }
    return v;
  }
  function podar(ps) {
    for (var n = ps.length; n > 0; n--) {
      var pai = arv, ok = true;
      for (var i = 0; i < n - 1; i++) { pai = pai[ps[i]]; if (!pai || typeof pai !== 'object') { ok = false; break; } }
      if (!ok) return;
      var filho = pai[ps[n - 1]];
      if (filho && typeof filho === 'object' && Object.keys(filho).length === 0) delete pai[ps[n - 1]]; else return;
    }
  }
  /* O Realtime Database de verdade descarta o filho nulo ao gravar (set, update e transaction): o banco de mentira faz o mesmo, senão uma gravação com `origem: null` volta igual e o defeito não aparece (6.97, AC1) */
  function semNulos(x) {
    if (Array.isArray(x)) return x.map(semNulos);
    if (x && typeof x === 'object') { var o = {}; Object.keys(x).forEach(function (k) { if (x[k] !== null && x[k] !== undefined) o[k] = semNulos(x[k]); }); return o; }
    return x;
  }
  function por(p, v) {
    var ps = partes(p);
    if (!ps.length) { arv = (v === null || v === undefined) ? {} : semNulos(clone(v)); return; }
    var c = arv;
    for (var i = 0; i < ps.length - 1; i++) { if (c[ps[i]] === null || typeof c[ps[i]] !== 'object') c[ps[i]] = {}; c = c[ps[i]]; }
    if (v === null || v === undefined) { delete c[ps[ps.length - 1]]; podar(ps); } else c[ps[ps.length - 1]] = semNulos(clone(v));
  }
  function snap(v, key) {
    var val = clone(v);
    return {
      key: key, val: function () { return val === undefined ? null : clone(val); }, exists: function () { return val !== undefined && val !== null; },
      forEach: function (fn) { if (val && typeof val === 'object') { Object.keys(val).some(function (k) { return fn(snap(val[k], k)) === true; }); } },
      child: function (c) { var r = val; partes(c).forEach(function (k) { r = (r && typeof r === 'object') ? r[k] : undefined; }); return snap(r, partes(c).pop()); }
    };
  }
  function avisar(p) { ouvintes.slice().forEach(function (o) { if (p === o.path || p.indexOf(o.path + '/') === 0 || o.path.indexOf(p + '/') === 0) { Promise.resolve().then(function () { if (opcoes.cacheFrio && (ouvintes.indexOf(o) < 0 || !o.recebeu)) return; o.fn(snap(pegar(o.path), partes(o.path).pop())); }); } }); }
  /* o aparelho tem o nó guardado: um ouvinte ligado nele ou acima dele já recebeu o 1º valor (6.113) */
  function quente(p) { return ouvintes.some(function (o) { return o.recebeu && (o.path === '' || p === o.path || p.indexOf(o.path + '/') === 0); }); }
  function esperar(v) { if (!opcoes.latencia) return Promise.resolve(v); pend++; return new Promise(function (r) { setTimeout(function () { pend--; r(v); }, typeof opcoes.latencia === 'function' ? opcoes.latencia() : opcoes.latencia); }); }
  /* a ida ao servidor do 1º valor de um ouvinte novo (`cacheFrio`): nunca no mesmo instante, nem com latência zero (no Firebase de verdade é uma volta pela rede);
     senão, quem roda a transação sem esperar o ouvinte passaria por sorte da ordem das promessas */
  function idaAoServidor() { pend++; return new Promise(function (r) { setTimeout(function () { pend--; r(); }, opcoes.latencia ? (typeof opcoes.latencia === 'function' ? opcoes.latencia() : opcoes.latencia) : 0); }); }
  function ref(path) {
    path = partes(path).join('/');
    var r = {
      key: partes(path).pop() || null, path: path,
      child: function (c) { return ref(path + '/' + c); },
      once: function () { log.leituras.push({ op: 'once', path: path }); if (falhas.some(function (f) { return path.indexOf(f) === 0; })) return Promise.reject(new Error('falha de teste em ' + path)); return esperar(snap(pegar(path), r.key)); },
      on: function (ev, fn, cancelar) {
        log.leituras.push({ op: 'on', path: path }); var o = { path: path, fn: fn, recebeu: !opcoes.cacheFrio }; ouvintes.push(o);
        if (!opcoes.cacheFrio) { Promise.resolve().then(function () { fn(snap(pegar(path), r.key)); }); return fn; }
        /* o 1º valor vem do servidor: chega depois da latência, com o que o servidor tem NAQUELA hora (null vale); quem desligou antes não recebe; um nó «calado» não responde nunca;
           num nó com `falhar`, o servidor recusa o ouvinte (o Firebase o tira e chama o cancelamento) */
        if (calados.some(function (c) { return path.indexOf(c) === 0; })) return fn;
        if (falhas.some(function (f) { return path.indexOf(f) === 0; })) { idaAoServidor().then(function () { var i = ouvintes.indexOf(o); if (i < 0) return; ouvintes.splice(i, 1); if (typeof cancelar === 'function') cancelar(new Error('falha de teste em ' + path)); }); return fn; }
        idaAoServidor().then(function () { if (ouvintes.indexOf(o) < 0) return; o.recebeu = true; fn(snap(pegar(path), r.key)); });
        return fn;
      },
      off: function (ev, fn) { ouvintes = ouvintes.filter(function (o) { return !(o.path === path && (!fn || o.fn === fn)); }); },
      set: function (v) { v = resolverSV(clone(v)); log.gravacoes.push({ op: 'set', path: path, valor: clone(v) }); por(path, v); avisar(path); return esperar(); },
      update: function (obj) {
        log.gravacoes.push({ op: 'update', path: path, valor: clone(obj) });
        Object.keys(obj || {}).forEach(function (k) { por(path ? (path + '/' + k) : k, resolverSV(clone(obj[k]))); });
        avisar(path); return esperar();
      },
      remove: function () { log.gravacoes.push({ op: 'remove', path: path }); por(path, null); avisar(path); return esperar(); },
      push: function (v) {
        var k = '-N' + (++contador) + 'x'; var filho = ref(path + '/' + k);
        var pr = (v === undefined) ? Promise.resolve() : filho.set(v); pr.key = k; return pr;
      },
      transaction: function (fn, aoTerminar, aplicarLocal) {
        log.leituras.push({ op: 'transaction', path: path });
        var frio = !!opcoes.cacheFrio && !quente(path), t = { path: path, nArgs: arguments.length, aplicarLocal: aplicarLocal, frio: frio, rodadas: [] };
        log.transacoes.push(t);
        if (falhasEscrita.some(function (f) { return path.indexOf(f) === 0; })) return esperar({ committed: false, snapshot: snap(pegar(path), r.key) });
        var atual = pegar(path), servidor = atual === undefined ? null : clone(atual), local = frio ? null : servidor;
        t.rodadas.push(local === null ? 'null' : 'valor');
        var r2 = fn(clone(local));
        if (r2 === undefined) { t.desistiu = true; return esperar({ committed: false, snapshot: snap(frio ? undefined : atual, r.key) }); }
        if (JSON.stringify(local) !== JSON.stringify(servidor)) {   /* o servidor recusa o palpite feito sobre o retrato velho do aparelho e a função roda de novo com o valor dele */
          t.rodadas.push('valor'); r2 = fn(clone(servidor));
          if (r2 === undefined) { t.desistiu = true; return esperar({ committed: false, snapshot: snap(atual, r.key) }); }
        }
        var novo = resolverSV(clone(r2));
        log.gravacoes.push({ op: 'transaction', path: path, valor: clone(novo) });
        por(path, novo); avisar(path);
        return esperar({ committed: true, snapshot: snap(pegar(path), r.key) });
      },
      orderByKey: function () { return consulta(path, { por: 'key' }); },
      orderByChild: function (c) { return consulta(path, { por: 'child', c: c }); },
      limitToLast: function (n) { return consulta(path, { por: 'key', ultimos: n }); },
      limitToFirst: function (n) { return consulta(path, { por: 'key', primeiros: n }); },
      onDisconnect: function () { return { set: function () { return Promise.resolve(); }, remove: function () { return Promise.resolve(); }, cancel: function () { return Promise.resolve(); } }; }
    };
    return r;
  }
  function consulta(path, q) {
    var c = {
      startAt: function (v) { q.ini = v; return c; }, endAt: function (v) { q.fim = v; return c; }, equalTo: function (v) { q.ini = v; q.fim = v; return c; },
      limitToLast: function (n) { q.ultimos = n; return c; }, limitToFirst: function (n) { q.primeiros = n; return c; },
      orderByKey: function () { q.por = 'key'; return c; }, orderByChild: function (x) { q.por = 'child'; q.c = x; return c; },
      once: function () {
        log.leituras.push({ op: 'once', path: path, consulta: JSON.stringify(q) });
        var base = pegar(path), saida = {};
        if (base && typeof base === 'object') {
          var chaves = Object.keys(base).filter(function (k) {
            var v = q.por === 'child' ? (base[k] && base[k][q.c]) : k;
            if (q.ini !== undefined && !(v >= q.ini)) return false;
            if (q.fim !== undefined && !(v <= q.fim)) return false;
            return true;
          }).sort();
          if (q.ultimos) chaves = chaves.slice(-q.ultimos);
          if (q.primeiros) chaves = chaves.slice(0, q.primeiros);
          chaves.forEach(function (k) { saida[k] = base[k]; });
        }
        return esperar(snap(Object.keys(saida).length ? saida : undefined, partes(path).pop()));
      },
      on: function (ev, fn) { c.once().then(fn); return fn; }, off: function () {}
    };
    return c;
  }
  var contador = 0;
  return { pendentes: function () { return pend; }, falhar: function (prefixos) { falhas = prefixos || []; }, falharEscrita: function (prefixos) { falhasEscrita = prefixos || []; },
    calar: function (prefixos) { calados = prefixos || []; }, ouvintesEm: function (prefixo) { return ouvintes.filter(function (o) { return o.path.indexOf(prefixo) === 0; }).length; }, ref: ref, log: log, arvore: function () { return arv; }, ler: function (p) { return clone(pegar(p)); }, poe: function (p, v) { por(p, v); }, SV: SV };
}
const BANCO_SRC = criarBancoFalso.toString();

// ---------------------------------------------------------------- Node (vm): o app inteiro, como o navegador o carrega
function universal(name) {
  const fn = function () { return fn; };
  return new Proxy(fn, {
    get(t, p) { if (p === Symbol.toPrimitive) return () => ''; if (p === 'then') return undefined; if (p in t) return t[p]; return universal(name + '.' + String(p)); },
    set() { return true; }, apply() { return universal(name + '()'); }, construct() { return universal('new ' + name); },
  });
}
function dateFixa(iso) {
  const T = new Date(iso).getTime();
  class D extends Date { constructor(...a) { if (a.length === 0) super(T); else super(...a); } static now() { return T; } }
  return D;
}
function carregarNode(relogioISO, soPrincipal, htmlAlt) {
  const bodyEl = { dataset: { role: 'supervisor' }, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, appendChild() {}, style: {}, addEventListener() {}, setAttribute() {}, getAttribute() { return null; } };
  const documentStub = { body: bodyEl, head: { appendChild() {} }, documentElement: universal('documentElement'), getElementById() { return universal('el'); }, querySelector() { return null; }, querySelectorAll() { return []; }, createElement() { return universal('el'); }, addEventListener() {}, getElementsByClassName() { return []; }, getElementsByTagName() { return []; }, cookie: '', readyState: 'complete' };
  const nunca = new Promise(() => {});
  const sb = {
    console, Date: dateFixa(relogioISO || '2026-10-20T10:00:00-03:00'), Math, JSON, Object, Array, String, Number, Boolean, parseInt, parseFloat, isNaN, isFinite, RegExp, Promise, Map, Set, Symbol, Intl, Error, TypeError,
    encodeURIComponent, decodeURIComponent, escape, unescape, TextEncoder, btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
    setTimeout() {}, clearTimeout() {}, setInterval() {}, clearInterval() {}, requestAnimationFrame() {}, performance: { now() { return 0; } }, document: documentStub,
    firebase: { initializeApp() { return {}; }, auth() { return { signInAnonymously() { return nunca; }, onAuthStateChanged() {} }; }, database() { return { ref() { return universal('ref'); } }; } },
    localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} }, sessionStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
    navigator: { userAgent: 't94', onLine: true }, location: { href: 'https://t94.local/', reload() {}, hostname: 't94.local' }, Blob: class Blob {}, alert() {}, confirm() { return true; }, prompt() { return ''; }, scrollTo() {}, addEventListener() {}, crypto: crypto.webcrypto,
  };
  sb.window = sb; sb.globalThis = sb; sb.self = sb;
  const ctx = vm.createContext(sb);
  const re = /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi; let m; const todos = [];
  while ((m = re.exec(htmlAlt || HTML))) todos.push({ attr: m[1], src: m[2] });
  const principal = todos.reduce((a, b) => (b.src.length > a.src.length ? b : a));
  const lista = soPrincipal ? [principal] : todos;
  for (const s of lista) vm.runInContext(s.src, ctx, { filename: 'inline:' + ((s.attr.match(/(?:id|data-[a-z0-9]+)="([^"]+)"/) || [])[1] || (s === principal ? 'principal' : 'anonimo')), timeout: 30000 });
  return { ctx, run: (c) => vm.runInContext(c, ctx), J: (c) => { const r = vm.runInContext('JSON.stringify(' + c + ')', ctx); return r === undefined ? null : JSON.parse(r); } };
}
/* o app inteiro carregado uma vez só por combinação (relógio, só o script principal) */
const _memo = {};
function noTodo(soPrincipal) { const k = soPrincipal ? 'p' : 't'; return _memo[k] || (_memo[k] = carregarNode('2026-10-20T10:00:00-03:00', !!soPrincipal)); }
const h16 = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);
const igual = (a, b, msg) => assert.deepStrictEqual(JSON.parse(JSON.stringify(a)), b, msg);

// ---------------------------------------------------------------- o mundo de teste, montado DENTRO da página (o app real, sem Firebase)
/* Roda no navegador. S = {filhots:[{n,tutor,tel,modo:'enviada'|'humano',cuidados:[itemK],peso,status,semHora,statusPorCuidado,vence}], respostas:[{pet,k,valor,nome,tarefa,linha}],
   semIdentidade:[i], semProjecao:[{pet,k}], vetConfirmada, detalhes, latencia, usuario} */
async function montarMundo94(S) {
  /* a faxina de fotos antigas (o app a agenda 4 s depois de abrir o Início, grava `daycare/limpeza-fotos/` e uma linha de auditoria) é um relógio do PRÓPRIO app, não da tela: no mundo de teste ela não roda, para não cair no meio de uma prova de «nada gravado» (N1 do QA). O `m.log()` ainda tira da conta o que ela deixar. */
  window.ckLimparFotosEnviadas = function () { return Promise.resolve(0); };
  var dia = zPainel44Dia();
  var banco = criarBancoFalso({}, { latencia: S.latencia || 0, cacheFrio: !!S.cacheFrio });
  window.__banco = banco; DB = banco;
  window.firebase = { auth: function () { return { currentUser: { uid: 'uid-teste' }, onAuthStateChanged: function () { return function () {}; } }; }, database: { ServerValue: { TIMESTAMP: banco.SV } } };
  aplicarLogin(S.usuario || { monId: 'amanda', pessoa: 'Amanda', nome: 'Amanda', role: 'supervisor' });
  async function sha256(s) { var b = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))), h = ''; for (var i = 0; i < b.length; i++) h += b[i].toString(16).padStart(2, '0'); return h; }
  var agoraIso = new Date().toISOString(), identidades = {}, itensDia = {}, grupos = {}, linhas = [], info = [], nCuid = 0;
  var alvo = (function (d) { var x = new Date(d + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() + 1); return x.toISOString().slice(0, 10); })(dia);
  PELUDINHOS.length = 0; CARTEIRA_CARREGADA = true;
  for (var i = 0; i < S.filhots.length; i++) {
    var f = S.filhots[i], p = { n: f.n, tutor: f.tutor, raca: 'SRD' };
    PELUDINHOS.push(p);
    var pk = pelKey(p), dk = dcKey(p.n, p.tutor), petId = 'pet' + (i + 1), tutorId = 'tut' + (i + 1);
    var cad = { n: f.n, tutor: f.tutor };
    if (f.tel !== undefined && f.tel !== null) cad.tel = f.tel;
    (f.cuidados || ['verm_p']).forEach(function (k) { cad[k] = (f.vence && f.vence[k]) || dia; if (k === 'col_p') cad.col_nome = 'Marca Teste'; });
    if (f.peso) cad.pesos = [{ kg: Number(f.peso), data: dia }];
    if (f.modo === 'humano') cad.comunicacaoZelozinha = { versao: 1, modo: 'humano', atualizadoEm: agoraIso, atualizadoPor: 'Adriana' };
    banco.poe('daycare/cadastro/' + pk, cad); pelCadCache[pk] = cad;
    banco.poe('daycare/checkin-corpo/' + dia + '/' + dk, { tipo: 'entrada', quem: 'Zeloso Teste', fim: Date.now() - 3600000 });
    if (!(S.semIdentidade || []).some(function (x) { return x === i; })) { identidades[petId] = { petId: petId, tutorRefId: tutorId, pelKeyAtual: pk, dcKeyAtual: dk, aliases: {} }; identidades[petId].aliases[pk] = true; }
    var itens = vencItensDe(Object.assign({}, pelExtra(p), cad), alvo, 0, dia, {}).filter(function (x) { return x && !x.sem_registro && x.vence <= alvo; });
    var ciclos = itens.map(function (x) { var care = window.ZeluzPrevencaoFontes.tipoCuidado(x); return { cycleKey: JSON.stringify([petId, tutorId, care, x.vence, x.k]), itemK: x.k, care: care, vence: x.vence }; }).filter(function (c) { return !!c.care; });
    var enviados = [];
    ciclos.forEach(function (c) {
      var humano = f.modo === 'humano' || (f.statusPorCuidado && f.statusPorCuidado[c.itemK] === 'humano');
      if (!humano) enviados.push(c);
      if ((S.semProjecao || []).some(function (x) { return x.pet === i && x.k === c.itemK; })) return;
      itensDia['h' + (nCuid++)] = { cycleKey: c.cycleKey, petId: petId, tutorId: tutorId, care: c.care, itemK: c.itemK, dueDate: c.vence, statusPainel: humano ? 'acompanhamento_humano' : (f.status === 'entrega_pendente' ? 'envio_registrado_entrega_pendente' : 'entrega_confirmada'), motivo: humano ? 'Contato humano conforme configuração da ficha.' : 'Entrega confirmada.' };
    });
    var gk = JSON.stringify([petId, tutorId, dia]);
    if (enviados.length) {
      var texto = MensagemUnica41.gerarMensagem({ nomeTutor: f.tutor, nomePeludo: f.n, sexo: undefined, dia: dia, presencaConfirmada: true, cuidados: enviados.map(function (c) { return { itemK: c.itemK, vence: c.vence }; }), veterinariaConfirmada: enviados.some(function (c) { return /^vac_/.test(c.itemK); }) });
      var g = { groupKey: gk, petId: petId, tutorId: tutorId, statusPainel: f.status || 'enviado_confirmado', textoDisponivel: true, textoEnviado: texto.texto, textoSha: await sha256(texto.texto), messageId: 'm' + (i + 1), nomePeludo: f.n, nomeTutor: f.tutor, sexoMensagem: '', cycleKeys: enviados.map(function (c) { return c.cycleKey; }), itemKs: enviados.map(function (c) { return c.itemK; }), respostaHumana: 'pendente', acompanhamentoHumanoPendente: true, retornoHumanoPrevisto: '13:30', autoria: { id: 'zelozinha-zeluz', nome: 'Zelozinha', tipo: 'servico' }, canalReciboId: 'rc' + (i + 1), tentativaEm: agoraIso };
      if (g.statusPainel === 'enviado_confirmado' && f.semHora !== true) g.verificadoEm = f.verificadoEm || '2026-10-20T10:42:00-03:00';
      grupos['h' + (i + 1).toString(16).padStart(31, '0')] = g;
    }
    linhas.push({ chave: dk, p: p });
    info.push({ i: i, n: f.n, dcKey: dk, pelKey: pk, petId: petId, tutorId: tutorId, groupKey: enviados.length ? gk : JSON.stringify(['contato_humano89', petId, tutorId, dia]), ciclos: ciclos });
  }
  // respostas já gravadas (e, quando pedido, a tarefa e a linha do Day Care que a resposta real criaria)
  var porDc = {};
  (S.respostas || []).forEach(function (r, n) {
    var inf = info[r.pet], cy = inf.ciclos.filter(function (c) { return c.itemK === r.k; })[0]; if (!cy) return;
    var ck = ZeluzResposta88.codificarChave(cy.cycleKey), reg = porDc[inf.dcKey] = porDc[inf.dcKey] || { respostasEscopo49: { porCiclo: {}, tarefas57: {}, porResposta: {} }, historicoRespostas49: [] };
    var dec = r.valor === 'aguardar' ? ['aguardar', null] : r.valor === 'autorizar_loja' ? ['autorizar', 'loja'] : r.valor === 'autorizar_bolsa' ? ['autorizar', 'bolsa'] : ['autorizar', 'externo'], rid = 'r88_semente' + n;
    reg.respostasEscopo49.porCiclo[ck] = { cycleKey: cy.cycleKey, itemK: cy.itemK, groupKey: inf.groupKey, respostaId: rid, decisao: dec[0], origem: dec[1], onde: '', humanoId: 'amanda', humanoNome: r.nome || 'Zeloso Teste', ts: Date.now() - 600000, revisao: 0, estado: 'decidido', baseOperacional88: {} };
    if (r.tarefa) {
      var lid = ZeluzCuidado57SolCore.linhaId({ cycleKey: cy.cycleKey, itemK: cy.itemK }), item = (VENC_LANC[cy.itemK] || { item: 'vet' }).item, ehLoja = dec[1] === 'loja';
      reg.respostasEscopo49.tarefas57[ck] = { linhaId: lid, cycleKey: cy.cycleKey, itemK: cy.itemK, criadoEm: agoraIso, estado: r.tarefa, versao: { respostaId: rid, revisao: 0 }, linha: { dia: dia, item: item, id: lid }, operacaoId: 'semente' };
      if (r.linha !== false) {
        var det = { cuidado57_estado: r.tarefa === 'realizado' ? 'realizado-conferido' : 'conferir-orientacao' }; if (r.det) Object.assign(det, r.det);
        banco.poe('daycare/dashboard/' + dia + '/' + item + '/' + lid, { valor: dashNomePlanilha(PELUDINHOS[r.pet]) + ' (CONFERIR ORIENTAÇÃO)', hora: '', quem: 'Amanda', ts: Date.now() - 600000, chave: inf.dcKey, det: det, planilha_ok: true,
          origemVencimento: { diaOrigem: dia, chave: inf.dcKey, tipo: vencTipoDoItemObj({ k: cy.itemK }), protocolo: 'cuidado57', linhaId: lid, groupKey: inf.groupKey, cycleKey: cy.cycleKey, itemK: cy.itemK, respostaId: rid, revisao: 0, origemResposta: dec[1] || '' } });
      }
    }
  });
  Object.keys(porDc).forEach(function (dk) { banco.poe('daycare/vencimentos/' + dia + '/' + dk, porDc[dk]); });
  var ledger = { groups: {} };
  Object.keys(grupos).forEach(function (h) { ledger.groups[grupos[h].groupKey] = { nomeTutor: grupos[h].nomeTutor, nomePeludo: grupos[h].nomePeludo }; });
  var proj = { versao: 81, dia: dia, atualizadoEm: agoraIso, autoria: { id: 'zelozinha-zeluz', nome: 'Zelozinha', tipo: 'servico' }, detalhesEnvioVersao: S.detalhes || 104, assinaturaConteudo: await sha256('assinatura-1'), estadoRecibos43: { versao: 43, stateJson: JSON.stringify(ledger) }, identidadesPets: identidades, grupos: grupos, cuidadosDia: { versao: 104, itens: itensDia } };
  banco.poe('piloto59/interno-20261019/painel81/' + dia, proj);
  window.__linhasHoje = linhas;
  hojeLista = function () { return window.__linhasHoje; };
  zPainel44ValidarFonte80 = function (v) {
    if (!v || v.versao !== 81 || v.dia !== zPainel44Dia()) return null;
    var gs = Object.keys(v.grupos || {}).map(function (k) { return v.grupos[k]; }).sort(function (a, b) { return a.groupKey.localeCompare(b.groupKey); });
    return { versao: 81, dia: v.dia, atualizadoEm: v.atualizadoEm, autoria: v.autoria, detalhesEnvioVersao: Number(v.detalhesEnvioVersao), grupos: gs, estadoRecibos43: (function () { try { return JSON.parse(v.estadoRecibos43.stateJson); } catch (_) { return { groups: {} }; } })(), identidadesPets: v.identidadesPets || {}, cuidadosDia: v.cuidadosDia || { versao: 104, itens: {} } };
  };
  zPainel44Projecao80Atual = function () { var st = Z44_DISPATCH80, pr = st && st.dados; return pr && pr.dia === zPainel44Dia() ? pr : null; };
  zPainel44Despacho80Conectar = function () {};
  Z44_DISPATCH80.dados = zPainel44ValidarFonte80(proj); Z44_DISPATCH80.erro = ''; Z44_DISPATCH80.carregando = false;
  window.zelozinha47Veterinaria = { ler: function () { return Promise.resolve({ ok: true, dia: zPainel44Dia(), confirmada: !!S.vetConfirmada, tipo: S.vetConfirmada ? 'confirmada' : 'pendente' }); } };
  window.__ab = { zWhats: [], senha: '1234', janelas: [], ordem: [], bloquearJanela: false };
  window.zWhatsAbrir = function (tel, texto) { window.__ab.zWhats.push({ tel: tel, texto: texto }); return true; };
  /* o `window.open` do mundo de teste: o «Abrir no WhatsApp» do texto das 13h30 abre a janela NO TOQUE (em branco) e só depois a leva ao link, ou a fecha; cada janela fica guardada com o link para onde foi e se foi fechada, e `ordem` conta o que aconteceu primeiro (N3) */
  window.open = function (url, alvo) {
    var j = { url: url, alvo: alvo, href: url ? String(url) : '', fechada: false };   /* aberta com um endereço, a janela já está nele; aberta em branco, só vai ao link depois */
    window.__ab.ordem.push('janela-aberta'); window.__ab.janelas.push(j);
    if (window.__ab.bloquearJanela) return null;
    return { location: { set href(v) { j.href = String(v); window.__ab.ordem.push('janela-no-link'); }, get href() { return j.href; } }, close: function () { j.fechada = true; window.__ab.ordem.push('janela-fechada'); }, get closed() { return j.fechada; } };
  };
  window.senhaQuem = function (s) { return s === window.__ab.senha ? { nome: 'Amanda', role: 'supervisor' } : null; };
  window.senhaProvisoriaAinda = function () { return false; }; window.senhaCodigoSemConferir = function () { return false; };
  window.__mundo = info;
  /* a carga dos registros do dia termina depois, quando o banco demora: espera pela CONDIÇÃO (cada registro semeado já está na memória do app) e carrega de novo se uma carga anterior, em andamento, não os trouxe */
  var semeados = Object.keys(porDc);
  for (var tent = 0; tent < 120; tent++) {
    VENC_PEND = null; await vencPendCarregar(true);
    if (!semeados.length || (VENC_PEND && VENC_PEND[dia] && semeados.every(function (dk) { return !!VENC_PEND[dia][dk]; }))) break;
    await new Promise(function (r) { setTimeout(r, 25); });
  }
  return info;
}

// ---------------------------------------------------------------- o navegador (Chromium a 375 px) com o app real
let chromium = null, navegador = null, semNavegador = '';
try { ({ chromium } = require('playwright')); } catch (e) { try { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); } catch (e2) { semNavegador = 'o Playwright não está instalado nesta máquina'; } }
function caminhoChromium() { return ['/opt/pw-browsers/chromium'].filter((p) => fs.existsSync(p))[0] || undefined; }
async function garantirNavegador() {
  if (navegador) return navegador;
  if (!chromium) throw new Error(semNavegador);
  navegador = await chromium.launch({ executablePath: caminhoChromium(), args: ['--no-sandbox'] });
  return navegador;
}
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const ENC = encodeURIComponent;
const LATENCIA_PADRAO = Number(process.env.LATENCIA94 || 0);   /* atraso de cada operação do banco de mentira (ms); 0 = sem atraso */
const CACHE_FRIO_PADRAO = process.env.CACHEFRIO94 === '1';   /* CACHEFRIO94=1: todas as provas do navegador com a transação do Firebase de verdade (1ª rodada com null fora do cache, 6.113) */
/* espera, em passos de 80 ms, até `fn()` devolver algo verdadeiro (ou até o prazo); devolve o último valor. As provas esperam pela CONDIÇÃO, não por um tempo fixo: o app refaz o painel sozinho de tempos em tempos e a máquina pode estar ocupada */
const ate = async (fn, ms) => { const fim = Date.now() + (ms || 8000); let v; for (;;) { v = await fn(); if (v || Date.now() >= fim) return v; await esperar(80); } };
/* abre o app REAL, com o relógio fixado, e monta o dia de teste. opcoes: {app, relogio, usuario, latencia, abrir:false, largura} */
/* todo contexto aberto fica aqui até ser fechado: o executor fecha as sobras depois de cada prova (inclusive quando a prova falha antes de chegar ao `finally`), para nenhum navegador ficar aberto */
const ABERTOS = new Set();
async function fecharSobras() { for (const c of [...ABERTOS]) { ABERTOS.delete(c); try { await c.close(); } catch (_) { /* silencioso de propósito: o contexto já tinha fechado */ } } }
async function mundo(S, opcoes) {
  opcoes = opcoes || {};
  const b = await garantirNavegador();
  const ctx = await b.newContext({ viewport: { width: opcoes.largura || 375, height: 812 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, timezoneId: FUSO_NAVEGADOR, permissions: ['clipboard-read', 'clipboard-write'] });
  ABERTOS.add(ctx);
  try {
  const page = await ctx.newPage();
  const m = { ctx, page, erros: [], S: S };
  page.on('pageerror', (e) => m.erros.push(String(e && e.message || e).slice(0, 300)));
  await page.route(/^https?:/, (r) => r.abort());
  await page.addInitScript(BANCO_SRC + '\nwindow.criarBancoFalso=criarBancoFalso;');
  await page.addInitScript(montarMundo94.toString() + '\nwindow.montarMundo94=montarMundo94;');
  await page.clock.setFixedTime(opcoes.relogio || '2026-10-20T10:00:00-03:00');
  await page.goto('file://' + (opcoes.app || APP));
  /* o app pronto = os scripts rodaram e as portas que o mundo de teste troca existem (nada de tempo fixo) */
  await page.waitForFunction(() => document.readyState === 'complete' && typeof montarMundo94 === 'function' && typeof aplicarLogin === 'function' && typeof zPainel44Dia === 'function' && typeof vencPendCarregar === 'function' && typeof ZeluzRespostaApp88 === 'object' && !!window.__zelozinhaContatos89Instalado, null, { timeout: 20000 });
  S = Object.assign({ latencia: opcoes.latencia || LATENCIA_PADRAO, usuario: opcoes.usuario, cacheFrio: opcoes.cacheFrio !== undefined ? !!opcoes.cacheFrio : CACHE_FRIO_PADRAO }, S);
  m.info = await page.evaluate((s) => montarMundo94(s), S);
  m.ev = (fn, arg) => page.evaluate(fn, arg);
  m.sel = (n) => '[data-zt694-pet="' + ENC(m.dcDe(n)) + '"]';
  m.dcDe = (n) => { const x = m.info.filter((i) => i.n === n)[0]; if (!x) throw new Error('FILHOt de teste desconhecido: ' + n); return x.dcKey; };
  m.cuidadoSel = (n, k) => m.sel(n) + ' [data-zt694-care][data-z104-care="' + ENC(m.cicloDe(n, k)) + '"]';
  m.cicloDe = (n, k) => { const x = m.info.filter((i) => i.n === n)[0]; const c = x.ciclos.filter((y) => y.itemK === k)[0]; if (!c) throw new Error('cuidado ' + k + ' não existe em ' + n); return c.cycleKey; };
  m.botao = (n, k, valor) => m.cuidadoSel(n, k) + ' [data-zt694-acao="resp"][data-zt694-valor="' + valor + '"]';
  m.todos = (n, valor) => m.sel(n) + ' [data-zt694-acao="todos"][data-zt694-valor="' + valor + '"]';
  /* o registro do banco de mentira; as gravações dos relógios do PRÓPRIO app (limpeza de fotos antigas, aviso de aniversário) caem no meio das provas quando o banco demora e não são da tela: ficam fora da conta */
  m.log = async () => { const l = await page.evaluate(() => ({ leituras: window.__banco.log.leituras.slice(), gravacoes: window.__banco.log.gravacoes.slice() })); l.gravacoes = l.gravacoes.filter((g) => !/^daycare\/(fotos-corpo|limpeza-fotos|aniversario-enviado)\//.test(g.path) && !(/^daycare\/auditoria\//.test(g.path) && g.valor && g.valor.acao === 'limpeza-fotos')); return l; };  /* a faxina de fotos (4 s depois de abrir) também deixa uma linha de auditoria com acao 'limpeza-fotos': é do relógio do app, não da tela (N1 do QA) */
  m.zerarLog = () => page.evaluate(() => { window.__banco.log.leituras.length = 0; window.__banco.log.gravacoes.length = 0; });
  m.ler = (p) => page.evaluate((p) => window.__banco.ler(p), p);
  m.texto = (n) => page.evaluate((s) => { const e = document.querySelector(s); return e ? e.innerText : null; }, m.sel(n));
  m.telaTexto = () => page.evaluate(() => { const e = document.querySelector('[data-z89-contatos]'); return e ? e.innerText : ''; });
  /* espera o toque terminar: nenhum «Salvando…», nenhuma operação do banco em andamento e o banco sem leitura nem gravação nova por 3 conferências seguidas.
     Quem precisa de um resultado específico (o texto do Snoopy, uma linha criada) espera por ELE com `ate`; o `quieto` só garante que nada ficou pela metade. */
  m.quieto = async (extra) => {
    let ultimo = -1, estavel = 0;
    for (let i = 0; i < 160; i++) {
      const t = await page.evaluate(() => ({ n: window.__banco.log.leituras.length + window.__banco.log.gravacoes.length, pend: window.__banco.pendentes(), salvando: [...document.querySelectorAll('[data-zt694-status]')].some((e) => /Salvando/.test(e.textContent)) || !!document.querySelector('[aria-busy="true"]') }));
      if (t.n === ultimo && !t.salvando && t.pend === 0) estavel++; else estavel = 0;
      ultimo = t.n; if (estavel >= 3) break; await esperar(120);
    }
    await esperar(extra || 60);
  };
  /* espera a página assentar: nenhuma operação do banco em andamento e dois quadros de desenho seguidos sem mudar o número de operações (serve para provar que algo NÃO aparece) */
  m.assentou = async () => {
    let ultimo = -1, estavel = 0;
    for (let i = 0; i < 100 && estavel < 4; i++) {
      const t = await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r({ n: window.__banco.log.leituras.length + window.__banco.log.gravacoes.length, pend: window.__banco.pendentes() })))));
      if (t.n === ultimo && t.pend === 0) estavel++; else estavel = 0;
      ultimo = t.n;
    }
  };
  m.tocar = async (n, k, valor) => { await page.click(m.botao(n, k, valor)); await m.quieto(); };
  m.abrirTela = async (rota) => {
    await page.evaluate((r) => { abrirItemDoMenu(r || 'painel-amanda'); }, rota || opcoes.rota);
    await page.waitForSelector(opcoes.seletorTela || '[data-zt694]', { timeout: 15000 });
    await m.quieto(200);
  };
  m.recarregar = async () => { await page.evaluate(() => { window.__banco.log.leituras.length = 0; return window.z89Render104(true); }); await m.quieto(200); };
  m.fechar = async () => { ABERTOS.delete(ctx); await ctx.close(); };
  /* os cartazes do app (zPergunta/zEscolha/zCampo): o botão pelo texto */
  m.modal = async (texto) => { const b = page.locator('#zAlertaoBox button', { hasText: texto }).first(); await b.waitFor({ timeout: 8000 }); await b.click(); await m.quieto(150); };
  if (opcoes.abrir !== false) await m.abrirTela();
  return m;
  } catch (e) { ABERTOS.delete(ctx); try { await ctx.close(); } catch (_) { /* silencioso de propósito: o erro que importa é o de cima */ } throw e; }
}

// ================================================================= P1 — a linha: o que a Zelozinha mandou, para quem e quando (AC1.1 a 1.3)
const SEM_MENSAGEM_SEM_NUMERO = (html, ...numeros) => numeros.forEach((n) => assert.ok(html.indexOf(n) < 0, 'o número inteiro apareceu na tela: ' + n));
prova('P1', 'funções puras: telefone mascarado, hora de São Paulo e o rótulo da entrega (AC1.1 a 1.3)', async () => {
  const T = noTodo().ctx.ZelozinhaTela94;
  assert.strictEqual(T.mascara('+5531999990001'), '(31) *****-0001');
  assert.strictEqual(T.mascara('+553133334444'), '(31) *****-4444', 'fixo de 10 dígitos');
  assert.strictEqual(T.mascara(''), ''); assert.strictEqual(T.mascara('12345'), ''); assert.strictEqual(T.mascara(null), '');
  assert.ok(!/99999/.test(T.mascara('+5531999990001')), 'só o DDD e os 4 últimos');
  assert.strictEqual(T.hora('2026-10-20T10:42:00-03:00'), '10:42');
  assert.strictEqual(T.hora('2026-10-20T13:42:00Z'), '10:42', 'a mesma hora em UTC e em São Paulo');
  assert.strictEqual(T.hora(Date.parse('2026-10-21T00:05:00Z')), '21:05');
  assert.strictEqual(T.hora(''), ''); assert.strictEqual(T.hora('lixo'), '');
  assert.strictEqual(T.quandoEnviado({ statusPainel: 'enviado_confirmado', verificadoEm: '2026-10-20T10:42:00-03:00' }), 'entrega confirmada às 10:42');
  assert.strictEqual(T.quandoEnviado({ statusPainel: 'enviado_confirmado' }), 'hora não registrada');
  assert.strictEqual(T.quandoEnviado({ statusPainel: 'enviado_confirmado', verificadoEm: 'nada' }), 'hora não registrada');
  assert.strictEqual(T.quandoEnviado({ statusPainel: 'entrega_pendente' }), 'envio registrado, entrega ainda sem confirmação');
});
prova('P1', 'a linha mostra FILHOt, tutor, telefone mascarado, cuidados e a hora, sem tocar em nada; o número inteiro não está em lugar nenhum (AC1.1 a 1.3)', async () => {
  const m = await mundo({ filhots: [
    { n: 'Teste Um', tutor: 'Tutor Teste Um', tel: '(31) 99999-0001', cuidados: ['verm_p', 'ecto_p'] },
    { n: 'Teste Dois', tutor: 'Tutor Teste Dois', tel: '(31) 99999-0002', cuidados: ['verm_p'], status: 'entrega_pendente' },
    { n: 'Teste Tres', tutor: 'Tutor Teste Tres', tel: '(31) 99999-0003', cuidados: ['verm_p'], semHora: true },
    { n: 'Teste Quatro', tutor: 'Tutor Teste Quatro', tel: '', cuidados: ['verm_p'] },
    { n: 'Teste Cinco', tutor: 'Tutor Teste Cinco', tel: '12345', cuidados: ['verm_p'] },
  ] });
  try {
    const um = await m.texto('Teste Um');
    for (const t of ['Teste Um', 'Tutor Teste Um', '(31) *****-0001', 'Vermífugo · 20/10/2026', 'Carrapaticida · 20/10/2026', 'entrega confirmada às 10:42']) assert.ok(um.indexOf(t) >= 0, 'faltou «' + t + '» na linha: ' + um);
    assert.ok(/envio registrado, entrega ainda sem confirmação/.test(await m.texto('Teste Dois')));
    const tres = await m.texto('Teste Tres');
    assert.ok(/hora não registrada/.test(tres) && !/10:00|13:00/.test(tres), 'sem hora na projeção: nunca a do aparelho: ' + tres);
    assert.ok(/sem telefone na ficha/.test(await m.texto('Teste Quatro')));
    assert.ok(/sem telefone na ficha/.test(await m.texto('Teste Cinco')), 'telefone fora do padrão');
    const html = await m.ev(() => document.querySelector('[data-z89-contatos]').outerHTML);
    SEM_MENSAGEM_SEM_NUMERO(html, '99999-0001', '999990001', '31999990001', '(31) 99999');
    // a mensagem inteira, a 1 toque, sem corte e sem rolagem dentro da caixa
    await m.page.click(m.sel('Teste Um') + ' .zt694-msg > summary');
    const med = await m.ev((s) => { const t = document.querySelector(s + ' .zt694-msg-texto'); const cs = getComputedStyle(t); return { sh: t.scrollHeight, ch: t.clientHeight, ov: cs.overflowY, maxh: cs.maxHeight, len: t.textContent.length }; }, m.sel('Teste Um'));
    assert.ok(med.len > 40 && med.sh <= med.ch + 1 && med.ov !== 'auto' && med.ov !== 'scroll' && med.maxh === 'none', 'a mensagem tem de aparecer inteira: ' + JSON.stringify(med));
    assert.strictEqual(m.erros.length, 0, m.erros.join(' | '));
  } finally { await m.fechar(); }
}, 'C');

// ================================================================= P2 — sem mensagem da Zelozinha (AC1.5, AC11.1)
/* 6.113: com a transação do Firebase de verdade (`cacheFrio`: a 1ª rodada recebe null quando o nó não está no aparelho). Antes, o banco de mentira entregava o valor do servidor
   já na 1ª rodada, e esta prova passava enquanto a resposta não salvava na produção (o Boris): agora ela confere também a RESPOSTA gravada, não só o contato humano. */
prova('P2', 'ficha «só contato humano»: nada de mensagem pronta, WhatsApp sem texto, as quatro respostas gravam o contato humano em nome de quem tocou, e a resposta também (AC1.5, AC11.1; 6.113)', async () => {
  const m = await mundo({ filhots: [{ n: 'Nina Teste', tutor: 'Tutor Nina', tel: '(31) 99999-0003', modo: 'humano', cuidados: ['verm_p'] }, { n: 'Buh Teste', tutor: 'Tutor Buh', tel: '(31) 99999-0004', modo: 'humano', cuidados: ['ecto_p'] }] }, { cacheFrio: true });
  try {
    const t = await m.texto('Nina Teste');
    assert.ok(/A Zelozinha não mandou: Contato humano conforme configuração da ficha\./.test(t), t);
    assert.ok(!/Ver mensagem|ENVIADA|entrega confirmada/.test(t), 'não pode haver mensagem «enviada»: ' + t);
    assert.ok(/Mandou na bolsa[\s\S]*Autorizou pegar na loja[\s\S]*Vai fazer em casa[\s\S]*Não respondeu/.test(t));
    await m.page.click(m.sel('Nina Teste') + ' [data-zt694-acao="whats-vazio"]');
    const w = await m.ev(() => window.__ab.zWhats);
    assert.deepStrictEqual(w, [{ tel: '+5531999990003', texto: '' }], 'o WhatsApp abre a conversa vazia, sem texto');
    await m.tocar('Nina Teste', 'verm_p', 'aguardar');
    const reg = await m.ler('daycare/vencimentos/' + DIA + '/' + m.dcDe('Nina Teste'));
    const ch = Object.keys(reg.contatosHumanos89).map((k) => reg.contatosHumanos89[k])[0];
    assert.ok(ch.tipo === 'retorno_humano' && ch.status === 'retorno_pendente' && ch.humano.nome === 'Amanda', JSON.stringify(ch));
    await m.tocar('Buh Teste', 'ecto_p', 'autorizar_externo');
    const reg2 = await m.ler('daycare/vencimentos/' + DIA + '/' + m.dcDe('Buh Teste'));
    const ch2 = Object.keys(reg2.contatosHumanos89).map((k) => reg2.contatosHumanos89[k])[0];
    assert.ok(ch2.tipo === 'contato_humano' && ch2.status === 'feito' && ch2.humano.nome === 'Amanda', 'a resposta grava o contato humano feito, em nome de quem tocou');
    // a RESPOSTA também ficou gravada, em nome de quem tocou (era aqui que o Boris falhava: «prova humana89 exata não confirmada»)
    const r1 = Object.values((reg.respostasEscopo49 || {}).porCiclo || {}), r2 = Object.values(((await m.ler('daycare/vencimentos/' + DIA + '/' + m.dcDe('Buh Teste'))).respostasEscopo49 || {}).porCiclo || {});
    assert.deepStrictEqual(r1.map((x) => [x.decisao, x.origem || null, x.humanoNome]), [['aguardar', null, 'Amanda']], '«Não respondeu» gravou a resposta: ' + JSON.stringify(reg.respostasEscopo49 || null));
    assert.deepStrictEqual(r2.map((x) => [x.decisao, x.origem, x.humanoNome]), [['autorizar', 'externo', 'Amanda']], '«Vai fazer em casa» gravou a resposta');
    for (const n of ['Nina Teste', 'Buh Teste']) assert.ok(!/Não foi possível salvar|prova humana|não confirmad/.test(await m.texto(n)), 'nenhuma frase de erro na linha: ' + await m.texto(n));
    const aut = await m.log();
    assert.ok(!aut.gravacoes.some((g) => /^piloto59\/|zelozinha-operacao/.test(g.path)), 'nada no nó do serviço');
    assert.strictEqual(m.erros.length, 0, m.erros.join(' | '));
  } finally { await m.fechar(); }
}, 'C');

// ================================================================= P3 — topo, grupos e ordem (AC2.1 a 2.3)
const nomeTeste = (i) => 'Teste ' + String(i + 1).padStart(2, '0');
function mundoDoze(extra) {
  const filhots = []; for (let i = 0; i < 12; i++) filhots.push({ n: nomeTeste(i), tutor: 'Tutor ' + nomeTeste(i), tel: '(31) 99999-' + String(1000 + i), cuidados: [3, 4, 6, 7, 11].indexOf(i) >= 0 ? ['verm_p', 'ecto_p'] : ['verm_p'] });
  return Object.assign({ filhots,
    respostas: [{ pet: 3, k: 'verm_p', valor: 'autorizar_externo' }, { pet: 4, k: 'verm_p', valor: 'autorizar_externo' }, { pet: 4, k: 'ecto_p', valor: 'autorizar_externo' },
      { pet: 5, k: 'verm_p', valor: 'aguardar' }, { pet: 6, k: 'verm_p', valor: 'aguardar' }, { pet: 6, k: 'ecto_p', valor: 'autorizar_externo' }, { pet: 7, k: 'verm_p', valor: 'aguardar' },
      { pet: 8, k: 'verm_p', valor: 'autorizar_bolsa', tarefa: 'criada' }, { pet: 9, k: 'verm_p', valor: 'autorizar_loja', tarefa: 'criada' }],
    semIdentidade: [10], semProjecao: [{ pet: 11, k: 'ecto_p' }] }, extra || {});
}
/* a contagem independente (sem usar as funções da tela): olha só o que o teste semeou */
function contagemDoze() {
  const falta = [], retorno = [], respondidos = [], conferir = [];
  // pet 0,1,2: 1 cuidado sem resposta; 3: 1 de 2; 4: 2 de 2; 5: aguardar; 6: aguardar + externo; 7: aguardar + sem resposta; 8,9: bolsa/loja; 10: sem vínculo; 11: 1 liberado sem resposta + 1 sem projeção
  [0, 1, 2].forEach((i) => falta.push([i, 1])); falta.push([3, 1]); retorno.push(5); retorno.push(6); falta.push([7, 1]); respondidos.push(4, 8, 9); conferir.push(10); falta.push([11, 1]);
  return { cuidadosFalta: falta.reduce((a, x) => a + x[1], 0), petsFalta: falta.length, retorno: retorno.length, conferir: 2, nomesFalta: falta.map((x) => nomeTeste(x[0])).sort(), nomesRetorno: retorno.map(nomeTeste).sort(), nomesResp: respondidos.map(nomeTeste).sort() };
}
prova('P3', 'topo, grupos e ordem: os números batem com a contagem independente; falta → retorno → respondidos, por nome; sem vínculo fica de fora de «Falta responder» (AC2.1 a 2.3)', async () => {
  const m = await mundo(mundoDoze());
  try {
    const c = contagemDoze();
    const topo = await m.ev(() => document.querySelector('[data-zt694-topo]').textContent);
    assert.strictEqual(topo, 'Falta responder: ' + c.cuidadosFalta + ' cuidados em ' + c.petsFalta + ' FILHOts · Retorno às 13h30: ' + c.retorno + ' · Para conferir: ' + c.conferir + ' (atualize envios)');
    const ordem = await m.ev(() => [...document.querySelectorAll('[data-zt694] [data-zt694-grupo], [data-zt694] [data-zt694-pet]')].map((e) => e.hasAttribute('data-zt694-grupo') ? 'G:' + e.getAttribute('data-zt694-grupo') : e.querySelector('.zt694-nome').textContent));
    const pos = (g) => ordem.indexOf('G:' + g);
    assert.deepStrictEqual(['falta', 'retorno', 'respondidos', 'conferir'].map(pos), [0, 1, 2, 3].map((_, i) => ['falta', 'retorno', 'respondidos', 'conferir'].map(pos)[i]), 'os quatro grupos existem');
    assert.ok(pos('falta') < pos('retorno') && pos('retorno') < pos('respondidos') && pos('respondidos') < pos('conferir'), JSON.stringify(ordem));
    const entre = (a, b) => ordem.slice(pos(a) + 1, b ? pos(b) : undefined).filter((x) => x.indexOf('G:') !== 0);
    assert.deepStrictEqual(entre('falta', 'retorno'), c.nomesFalta, 'falta responder, por nome');
    assert.deepStrictEqual(entre('retorno', 'respondidos'), c.nomesRetorno);
    assert.deepStrictEqual(entre('respondidos', 'conferir'), c.nomesResp);
    assert.deepStrictEqual(entre('conferir'), [nomeTeste(10)]);
    // o FILHOt com parte respondida (03) está em «falta»; quem tem um «Não respondeu» e os outros respondidos (07) está em «retorno»
    assert.ok(entre('falta', 'retorno').indexOf(nomeTeste(3)) >= 0 && entre('retorno', 'respondidos').indexOf(nomeTeste(6)) >= 0);
    // o estado de cada cuidado, à vista: «sem resposta» ou «{resposta} · {nome} · hh:mm»
    const t4 = await m.texto(nomeTeste(3));
    assert.ok(/Vermífugo · 20\/10\/2026[\s\S]*Vai fazer em casa · Zeloso Teste · \d\d:\d\d/.test(t4) && /Carrapaticida · 20\/10\/2026[\s\S]*sem resposta/.test(t4), t4);
    const t11 = await m.texto(nomeTeste(10)); assert.ok(/AINDA NÃO ENVIADA · Não foi possível confirmar o vínculo desta ficha/.test(t11), t11);
    assert.ok(/Atualize para confirmar o vínculo deste cuidado antes de registrar/.test(await m.texto(nomeTeste(11))));
    assert.strictEqual(m.erros.length, 0, m.erros.join(' | '));
  } finally { await m.fechar(); }
}, 'C');
prova('P3', 'tudo respondido: o topo diz «Todos respondidos» e o que não pode receber resposta fica à parte (AC2.1)', async () => {
  const m = await mundo({ filhots: [{ n: 'Teste 01', tutor: 'Tutor 1', tel: '(31) 99999-1', cuidados: ['verm_p'] }, { n: 'Teste 02', tutor: 'Tutor 2', tel: '(31) 99999-2', cuidados: ['verm_p'] }, { n: 'Teste 03', tutor: 'Tutor 3', tel: '(31) 99999-3', cuidados: ['verm_p'] }],
    respostas: [{ pet: 0, k: 'verm_p', valor: 'autorizar_externo' }, { pet: 1, k: 'verm_p', valor: 'autorizar_externo' }], semIdentidade: [2] });
  try {
    const topo = await m.ev(() => document.querySelector('[data-zt694-topo]').textContent);
    assert.strictEqual(topo, 'Todos respondidos · Para conferir: 1 (atualize envios)');
    await m.tocar('Teste 01', 'verm_p', 'aguardar');
    assert.strictEqual(await m.ev(() => document.querySelector('[data-zt694-topo]').textContent), 'Todos respondidos · Retorno às 13h30: 1 · Para conferir: 1 (atualize envios)', 'os números recalculam a cada resposta');
  } finally { await m.fechar(); }
}, 'C');

// ================================================================= P4 — a linha não pula (AC2.4)
prova('P4', 'depois do toque a linha fica no lugar (±2 px) e só muda de grupo em «Atualizar envios» (AC2.4)', async () => {
  const m = await mundo({ filhots: [1, 2, 3, 4, 5].map((i) => ({ n: nomeTeste(i - 1), tutor: 'Tutor ' + i, tel: '(31) 99999-000' + i, cuidados: ['verm_p'] })) });
  try {
    const topoLinha = () => m.ev((s) => { const e = document.querySelector(s); return e.getBoundingClientRect().top + window.pageYOffset; }, m.sel(nomeTeste(2)));
    const antes = await topoLinha();
    await m.tocar(nomeTeste(2), 'verm_p', 'autorizar_externo');
    const depois = await topoLinha();
    assert.ok(Math.abs(depois - antes) <= 2, 'a linha pulou: ' + antes + ' → ' + depois);
    assert.ok(/respondido agora/.test(await m.texto(nomeTeste(2))));
    const grupoDe = (n) => m.ev((s) => { let e = document.querySelector(s).previousElementSibling; while (e && !e.hasAttribute('data-zt694-grupo')) e = e.previousElementSibling; return e && e.getAttribute('data-zt694-grupo'); }, m.sel(n));
    assert.strictEqual(await grupoDe(nomeTeste(2)), 'falta', 'continua em «Falta responder» até atualizar');
    await m.page.click('[data-z44-reler]'); await m.quieto(400);
    assert.strictEqual(await grupoDe(nomeTeste(2)), 'respondidos', 'depois de «Atualizar envios» muda de grupo');
  } finally { await m.fechar(); }
}, 'C');

// ================================================================= P5 — quatro botões à vista (AC3.1, AC3.6)
prova('P5', 'os quatro botões estão à vista, com os rótulos publicados, 44 px, em uma fileira; bloqueado fica desligado com a frase (AC3.1, AC3.6, AC12.2)', async () => {
  const m = await mundo({ filhots: [{ n: 'Teste Um', tutor: 'Tutor Teste Um', tel: '(31) 99999-0001', cuidados: ['verm_p', 'ecto_p'] }, { n: 'Teste Dois', tutor: 'Tutor Teste Dois', tel: '(31) 99999-0002', cuidados: ['verm_p'] }], semProjecao: [{ pet: 0, k: 'ecto_p' }] });
  try {
    const r = await m.ev((s) => {
      const care = document.querySelector(s); const bs = [...care.querySelectorAll('[data-zt694-acao="resp"]')];
      return { rotulos: bs.map((b) => b.textContent), alturas: bs.map((b) => Math.round(b.getBoundingClientRect().height)), tops: [...new Set(bs.map((b) => Math.round(b.getBoundingClientRect().top)))].length, pressed: bs.map((b) => b.getAttribute('aria-pressed')), desl: bs.map((b) => b.disabled), aria: bs.map((b) => b.getAttribute('aria-label')),
        corta: bs.map((b) => b.scrollWidth > b.clientWidth + 1), larg: document.documentElement.scrollWidth };
    }, m.cuidadoSel('Teste Dois', 'verm_p'));
    assert.deepStrictEqual(r.rotulos, ['Mandou na bolsa', 'Autorizou pegar na loja', 'Vai fazer em casa', 'Não respondeu']);
    assert.ok(r.alturas.every((h) => h >= 44), 'altura de 44 px: ' + r.alturas); assert.ok(r.tops <= 2, 'em no máximo 2 fileiras: ' + r.tops);
    assert.ok(r.pressed.every((p) => p === 'false') && r.desl.every((d) => !d), 'à vista e ligados, nenhum marcado');
    assert.ok(r.aria.every((a, i) => a === r.rotulos[i] + ' para Vermífugo · 20/10/2026'), r.aria.join(' | '));
    assert.ok(r.corta.every((c) => !c), 'nenhum texto cortado'); assert.ok(r.larg <= 375, 'sem rolagem lateral: ' + r.larg);
    const b = await m.ev((s) => { const care = document.querySelector(s); return { desl: [...care.querySelectorAll('[data-zt694-acao="resp"]')].map((x) => x.disabled), texto: care.innerText }; }, m.cuidadoSel('Teste Um', 'verm_p'));
    assert.ok(b.desl.every((d) => d === false), 'o cuidado liberado do mesmo FILHOt segue ligado');
    // o cuidado sem vínculo (sem a projeção) fica desligado, com a frase de hoje
    const semProj = await m.ev(() => [...document.querySelectorAll('[data-zt694-care]')].filter((c) => c.querySelector('[data-zt694-acao="resp"]').disabled).map((c) => c.innerText));
    assert.strictEqual(semProj.length, 1); assert.ok(/Atualize para confirmar o vínculo deste cuidado antes de registrar/.test(semProj[0]));
  } finally { await m.fechar(); }
}, 'C');

// ================================================================= P6 — «Todos» (AC3.3, AC3.4)
prova('P6', '«Todos»: dois cuidados sem resposta, uma chamada, cada um com a sua revisão; com 1 cuidado ou algum bloqueado não aparece (AC3.3)', async () => {
  const m = await mundo({ filhots: [{ n: 'Teste Dois C', tutor: 'Tutor Dois C', tel: '(31) 99999-0001', cuidados: ['verm_p', 'ecto_p'] }, { n: 'Teste Um C', tutor: 'Tutor Um C', tel: '(31) 99999-0002', cuidados: ['verm_p'] }, { n: 'Teste Bloq', tutor: 'Tutor Bloq', tel: '(31) 99999-0003', cuidados: ['verm_p', 'ecto_p'] }], semProjecao: [{ pet: 2, k: 'ecto_p' }] });
  try {
    await m.ev(() => { window.__reg = []; const o = ZeluzRespostaApp88.registrar; ZeluzRespostaApp88.registrar = function (gk, itens, op) { window.__reg.push({ gk: gk, itens: JSON.parse(JSON.stringify(itens)) }); return o.apply(this, arguments); }; });
    assert.strictEqual(await m.ev(() => document.querySelectorAll('[data-zt694-todos]').length), 1, 'só o FILHOt com 2 cuidados livres tem «Todos»');
    assert.ok(!(await m.ev((s) => !!document.querySelector(s + ' [data-zt694-todos]'), m.sel('Teste Um C'))), 'com 1 cuidado não aparece');
    assert.ok(!(await m.ev((s) => !!document.querySelector(s + ' [data-zt694-todos]'), m.sel('Teste Bloq'))), 'com um cuidado bloqueado não aparece');
    await m.page.click(m.todos('Teste Dois C', 'autorizar_externo')); await m.quieto();
    const reg = await m.ler('daycare/vencimentos/' + DIA + '/' + m.dcDe('Teste Dois C'));
    const pc = Object.keys(reg.respostasEscopo49.porCiclo).map((k) => reg.respostasEscopo49.porCiclo[k]);
    assert.strictEqual(pc.length, 2); assert.ok(pc.every((x) => x.decisao === 'autorizar' && x.origem === 'externo' && x.revisao === 0), 'cada um com o seu registro e a sua revisão');
    const regs = await m.ev(() => window.__reg);
    assert.strictEqual(regs.length, 1, 'uma chamada por grupo de envio'); assert.strictEqual(regs[0].itens.length, 2);
    assert.ok(/Vai fazer em casa/.test(await m.texto('Teste Dois C')) && !(await m.ev((s) => !!document.querySelector(s + ' [data-zt694-todos]'), m.sel('Teste Dois C'))), 'depois de responder, o «Todos» some');
    // o texto publicado não cita o cuidado: dois cuidados com o mesmo texto, uma caixa só
    const caixas = await m.ev((s) => [...document.querySelectorAll(s + ' [data-zt694-texto]')].map((e) => e.textContent), m.sel('Teste Dois C'));
    assert.strictEqual(caixas.length, 1); assert.ok(/^Combinado, Tutor Dois C! \u{1F49B} Depois desse cuidado, você nos informa a data e o produto usado\?/u.test(caixas[0]), caixas[0]);
    assert.strictEqual(m.erros.length, 0, m.erros.join(' | '));
  } finally { await m.fechar(); }
}, 'C');
prova('P6', '«Todos» com falha parcial: a linha diz quais salvaram e quais não, e os botões do que falhou continuam ativos (AC3.4)', async () => {
  const m = await mundo({ filhots: [{ n: 'Teste Misto', tutor: 'Tutor Misto', tel: '(31) 99999-0001', cuidados: ['verm_p', 'ecto_p'], statusPorCuidado: { ecto_p: 'humano' } }] });
  try {
    await m.page.click(m.todos('Teste Misto', 'autorizar_externo')); await m.quieto();
    const t = await m.texto('Teste Misto');
    assert.ok(/Vermífugo salvou\. Não foi possível salvar: Carrapaticida/.test(t), t);
    const est = await m.ev((s) => [...document.querySelectorAll(s + ' [data-zt694-care]')].map((c) => ({ nome: c.querySelector('.zt694-leg span').textContent.split(' ·')[0], pressed: [...c.querySelectorAll('[data-zt694-acao="resp"]')].some((b) => b.getAttribute('aria-pressed') === 'true'), desl: [...c.querySelectorAll('[data-zt694-acao="resp"]')].some((b) => b.disabled) })), m.sel('Teste Misto'));
    assert.deepStrictEqual(est.sort((a, b) => a.nome.localeCompare(b.nome)), [{ nome: 'Carrapaticida', pressed: false, desl: false }, { nome: 'Vermífugo', pressed: true, desl: false }], 'o que falhou segue com os botões ativos');
  } finally { await m.fechar(); }
}, 'C');

// ================================================================= P7 — toques desde o Início (AC3.5)
prova('P7', 'do Início ao registro: 2 toques com 1 cuidado e 2 toques com 2 cuidados e a mesma resposta (AC3.5)', async () => {
  const m = await mundo({ filhots: [{ n: 'Teste Um', tutor: 'Tutor Um', tel: '(31) 99999-0001', cuidados: ['verm_p'] }, { n: 'Teste Dois', tutor: 'Tutor Dois', tel: '(31) 99999-0002', cuidados: ['verm_p', 'ecto_p'] }], abrir: false });
  try {
    let toques = 0;
    const clicar = async (sel) => { await m.page.click(sel); toques++; };
    await m.ev(() => { irParaView('inicio'); }); await esperar(200);
    await clicar('#inicioPortaConteudo .btn-primary'); await m.page.waitForSelector('[data-zt694]'); await m.quieto(200);
    await clicar(m.botao('Teste Um', 'verm_p', 'autorizar_externo')); await m.quieto();
    assert.strictEqual(toques, 2, '1 cuidado: Abrir Supervisão + a resposta');
    assert.ok(/Vai fazer em casa · Amanda/.test(await m.texto('Teste Um')));
    toques = 0;
    await m.ev(() => { irParaView('inicio'); }); await esperar(200);
    await clicar('#inicioPortaConteudo .btn-primary'); await m.page.waitForSelector('[data-zt694]'); await m.quieto(200);
    await clicar(m.todos('Teste Dois', 'autorizar_externo')); await m.quieto();
    assert.strictEqual(toques, 2, '2 cuidados com a mesma resposta: Abrir Supervisão + «Todos»');
    const reg = await m.ler('daycare/vencimentos/' + DIA + '/' + m.dcDe('Teste Dois'));
    assert.strictEqual(Object.keys(reg.respostasEscopo49.porCiclo).length, 2);
  } finally { await m.fechar(); }
}, 'C');

// ================================================================= P8 — produto e lugar por toque (AC4)
const linhaDo = (m, nome, k) => m.ev(([dc, ck, dia]) => { const reg = window.__banco.ler('daycare/vencimentos/' + dia + '/' + dc); const t = reg && reg.respostasEscopo49 && reg.respostasEscopo49.tarefas57 && reg.respostasEscopo49.tarefas57[ZeluzResposta88.codificarChave(ck)]; return t && t.linha ? window.__banco.ler('daycare/dashboard/' + dia + '/' + t.linha.item + '/' + t.linha.id) : null; }, [m.dcDe(nome), m.cicloDe(nome, k), DIA]);
const chip = (m, nome, k, campo, valor) => m.cuidadoSel(nome, k) + ' [data-zt694-acao="esc"][data-zt694-campo="' + campo + '"][data-zt694-valor="' + valor + '"]';
const pressionado = (m, nome, k, campo, valor) => m.ev((s) => { const e = document.querySelector(s); return e ? e.getAttribute('aria-pressed') : null; }, chip(m, nome, k, campo, valor));
prova('P8', 'vermífugo com dose do peso: 1 toque; a dose e o «onde» já vêm marcados; a linha só ganha o `det` (valor, estado e origem intactos) (AC4.1, AC4.4, AC4.9)', async () => {
  const m = await mundo({ filhots: [{ n: 'Teste Dose', tutor: 'Tutor Dose', tel: '(31) 99999-0001', cuidados: ['verm_p'], peso: 12 }] });
  try {
    const dose = await m.ev(() => vermAvaliarFicha(PELUDINHOS[0])); assert.ok(dose && !dose.pesar && dose.dose.rot, 'a ficha de teste tem dose pré-marcada: ' + JSON.stringify(dose));
    await m.tocar('Teste Dose', 'verm_p', 'autorizar_bolsa');
    const l = await linhaDo(m, 'Teste Dose', 'verm_p');
    assert.ok(l && l.origemVencimento.protocolo === 'cuidado57' && l.origemVencimento.origemResposta === 'bolsa');
    assert.strictEqual(l.valor, 'Teste Dose/SRD (CONFERIR ORIENTAÇÃO)', 'a célula (o que o Encãotador, a TV e a planilha leem) não muda');
    assert.deepStrictEqual(l.det, { cuidado57_estado: 'conferir-orientacao', qtd: dose.dose.rot }, 'só o `det` ganha a dose do peso; `onde` não é gravado: vale o que a resposta diz');
    assert.strictEqual(await pressionado(m, 'Teste Dose', 'verm_p', 'qtd', dose.dose.rot), 'true', 'a dose do peso já está marcada');
    assert.strictEqual(await pressionado(m, 'Teste Dose', 'verm_p', 'onde', 'NA BOLSA'), 'true', '«onde» já marcado pela resposta (bolsa)');
    const resumo = await m.ev((s) => document.querySelector(s + ' .zt694-esc > summary').textContent, m.sel('Teste Dose'));
    assert.ok(/Vermífugo: .*Está na bolsa dele/.test(resumo) && !/falta escolher/.test(resumo), resumo);
    assert.strictEqual(await m.ev((s) => document.querySelectorAll(s + ' input, ' + s + ' textarea').length, m.sel('Teste Dose')), 0, 'nenhum campo de texto');
    assert.strictEqual(m.erros.length, 0, m.erros.join(' | '));
  } finally { await m.fechar(); }
}, 'C');
prova('P8', 'sem dose pré-marcada são 2 toques; trocar o «onde» não tira a pendência do Snoopy da loja; escolher o que a resposta já diz tira a marca (AC4.1, AC4.3, AC4.4, AC4.9)', async () => {
  const m = await mundo({ filhots: [{ n: 'Teste Loja', tutor: 'Tutor Loja', tel: '(31) 99999-0001', cuidados: ['verm_p'] }] });
  try {
    await m.tocar('Teste Loja', 'verm_p', 'autorizar_loja');
    assert.ok(/falta escolher: quanto/.test(await m.ev((s) => document.querySelector(s + ' .zt694-esc > summary').textContent, m.sel('Teste Loja'))), 'a resposta grava antes; a linha diz o que falta');
    assert.strictEqual((await linhaDo(m, 'Teste Loja', 'verm_p')).valor, 'Teste Loja/SRD (CONFERIR ORIENTAÇÃO)', 'segue «conferir orientação» enquanto falta escolher');
    assert.strictEqual(await pressionado(m, 'Teste Loja', 'verm_p', 'onde', 'LOJA'), 'true', 'loja → «Comprado aqui na loja» marcado');
    await m.page.click(chip(m, 'Teste Loja', 'verm_p', 'qtd', '1 COMPRIMIDO')); await m.quieto();
    let l = await linhaDo(m, 'Teste Loja', 'verm_p'); assert.strictEqual(l.det.qtd, '1 COMPRIMIDO');
    const cobravel = (linha) => m.ev((x) => ZeluzSnoopyConfirmacao.cobravelNaFonte({ item: 'vermifugo' }, x), linha);
    for (const onde of ['BANHO', 'NA BOLSA', '']) {
      await m.page.click(chip(m, 'Teste Loja', 'verm_p', 'onde', onde)); await m.quieto();
      l = await linhaDo(m, 'Teste Loja', 'verm_p');
      assert.strictEqual(l.det.onde, onde); assert.strictEqual(l.det.cuidado57_estado, 'conferir-orientacao'); assert.strictEqual(await cobravel(l), true, 'a pendência do Snoopy da loja fica, qualquer que seja o «onde»: ' + JSON.stringify(l.det));
      assert.strictEqual(l.origemVencimento.origemResposta, 'loja'); assert.strictEqual(l.valor, 'Teste Loja/SRD (CONFERIR ORIENTAÇÃO)');
    }
    await m.page.click(chip(m, 'Teste Loja', 'verm_p', 'onde', 'LOJA')); await m.quieto();
    l = await linhaDo(m, 'Teste Loja', 'verm_p'); assert.ok(!('onde' in l.det), 'tocar no que a resposta já diz tira a marca');
    assert.ok(!/falta escolher/.test(await m.ev((s) => document.querySelector(s + ' .zt694-esc > summary').textContent, m.sel('Teste Loja'))));
    assert.strictEqual(m.erros.length, 0, m.erros.join(' | '));
  } finally { await m.fechar(); }
}, 'C');
prova('P8', 'carrapaticida: a lista de produtos é a viva da Gestão; produto + quanto, no máximo 3 toques; coleira e vacina não têm escolhas (AC4.2, AC4.5, AC4.9)', async () => {
  const m = await mundo({ filhots: [{ n: 'Teste Ecto', tutor: 'Tutor Ecto', tel: '(31) 99999-0001', cuidados: ['ecto_p'] }, { n: 'Teste Col', tutor: 'Tutor Col', tel: '(31) 99999-0002', cuidados: ['col_p'] }, { n: 'Teste Vac', tutor: 'Tutor Vac', tel: '(31) 99999-0003', cuidados: ['vac_raiva_p'] }] });
  try {
    let toques = 0; const clicar = async (sel) => { await m.page.click(sel); toques++; await m.quieto(); };
    await clicar(m.botao('Teste Ecto', 'ecto_p', 'autorizar_bolsa'));
    const lista = () => m.ev((s) => [...document.querySelectorAll(s + ' [data-zt694-campo="prod"]')].map((b) => b.getAttribute('data-zt694-valor')), m.sel('Teste Ecto'));
    const viva = await m.ev(() => DASH_ECTO_PROD.map((o) => o.v)); assert.deepStrictEqual(await lista(), viva, 'os botões são a lista viva');
    await m.ev(() => { ectoCfgAplicar({ Pipeta: { dias: 30 }, Bravecto: { dias: 90 }, ProdutoNovoTeste: { dias: 20 } }); });
    await m.recarregar();
    assert.ok((await lista()).indexOf('PRODUTONOVOTESTE · 20 DIAS') >= 0, 'se a lista muda, os botões mudam: ' + (await lista()).join(', '));
    await clicar(chip(m, 'Teste Ecto', 'ecto_p', 'prod', 'PRODUTONOVOTESTE · 20 DIAS'));
    await clicar(chip(m, 'Teste Ecto', 'ecto_p', 'qtd', 'PIPETA'));
    assert.ok(toques <= 3, 'no máximo 3 toques (resposta, produto, quanto): ' + toques);
    const l = await linhaDo(m, 'Teste Ecto', 'ecto_p');
    assert.deepStrictEqual(l.det, { cuidado57_estado: 'conferir-orientacao', prod: 'PRODUTONOVOTESTE · 20 DIAS', qtd: 'PIPETA' }); assert.strictEqual(l.valor, 'Teste Ecto/SRD (CONFERIR ORIENTAÇÃO)');
    assert.ok(!/falta escolher/.test(await m.ev((s) => document.querySelector(s + ' .zt694-esc > summary').textContent, m.sel('Teste Ecto'))));
    await m.tocar('Teste Col', 'col_p', 'autorizar_bolsa'); await m.tocar('Teste Vac', 'vac_raiva_p', 'autorizar_loja');
    assert.strictEqual(await m.ev(() => document.querySelectorAll('[data-zt694-pet="' + encodeURIComponent('teste-col__tutor-col') + '"] [data-zt694-esc], [data-zt694-pet="' + encodeURIComponent('teste-vac__tutor-vac') + '"] [data-zt694-esc]').length), 0, 'coleira e vacina não têm escolhas extras');
    assert.strictEqual(await m.ev(() => document.querySelectorAll('[data-zt694] input, [data-zt694] textarea').length), 0, 'nenhum campo de texto');
    assert.strictEqual(m.erros.length, 0, m.erros.join(' | '));
  } finally { await m.fechar(); }
}, 'C');
prova('P8', 'sem estado global dos Lançamentos: dez FILHOts com escolhas abertas ao mesmo tempo, cada um com a sua (AC4.6)', async () => {
  const filhots = []; for (let i = 0; i < 10; i++) filhots.push({ n: nomeTeste(i), tutor: 'Tutor ' + nomeTeste(i), tel: '(31) 99999-' + (2000 + i), cuidados: ['verm_p'] });
  const m = await mundo({ filhots });
  try {
    /* o `dashDet(k)` do app cria um objeto vazio quando alguém só lê; o que não pode existir é conteúdo */
    const estadoGlobal = () => m.ev(() => JSON.stringify([DASH_SEL, DASH_SEL_I, Object.keys(DASH_DET).filter((k) => Object.keys(DASH_DET[k] || {}).length > 0).map((k) => [k, DASH_DET[k]])]));
    const antes = await estadoGlobal();
    for (let i = 0; i < 10; i++) await m.page.click(m.botao(nomeTeste(i), 'verm_p', 'autorizar_bolsa')), await m.quieto(80);
    assert.strictEqual(await m.ev(() => document.querySelectorAll('[data-zt694-esc]').length), 10);
    await m.ev(() => document.querySelectorAll('[data-zt694-esc]').forEach((d) => { d.open = true; }));
    const valores = ['MEIO COMPRIMIDO', '1 COMPRIMIDO', '1 COMPRIMIDO E MEIO', '2 COMPRIMIDOS', '2 COMPRIMIDOS E MEIO', '3 COMPRIMIDOS', '3 COMPRIMIDOS E MEIO', '4 COMPRIMIDOS', '4 COMPRIMIDOS E MEIO', 'MEIO COMPRIMIDO'];
    for (let i = 0; i < 10; i++) await m.page.click(chip(m, nomeTeste(i), 'verm_p', 'qtd', valores[i])), await m.quieto(80);
    for (let i = 0; i < 10; i++) assert.strictEqual((await linhaDo(m, nomeTeste(i), 'verm_p')).det.qtd, valores[i], 'cada linha com a sua escolha (' + nomeTeste(i) + ')');
    assert.strictEqual(await estadoGlobal(), antes, 'DASH_SEL, DASH_SEL_I e DASH_DET ficam como estavam');
    assert.strictEqual(m.erros.length, 0, m.erros.join(' | '));
  } finally { await m.fechar(); }
}, 'C');
prova('P8', 'a escolha só grava na linha da MESMA resposta e revisão (função pura) e nunca toca a célula (AC4.4)', async () => {
  const T = noTodo().ctx.ZelozinhaTela94;
  const linha = { valor: 'Teste/SRD (CONFERIR ORIENTAÇÃO)', chave: 'k', det: { cuidado57_estado: 'conferir-orientacao' }, origemVencimento: { protocolo: 'cuidado57', linhaId: 'r57_a', respostaId: 'r88_x', revisao: 2, origemResposta: 'loja' } };
  const esp = { linhaId: 'r57_a', respostaId: 'r88_x', revisao: 2 };
  const ok1 = T.mesclarEscolha(linha, esp, { campo: 'qtd', valor: '1 COMPRIMIDO' });
  assert.ok(ok1.ok && ok1.mudou && ok1.linha.det.qtd === '1 COMPRIMIDO' && ok1.linha.valor === linha.valor && ok1.linha.det.cuidado57_estado === 'conferir-orientacao' && JSON.stringify(ok1.linha.origemVencimento) === JSON.stringify(linha.origemVencimento));
  assert.strictEqual(linha.det.qtd, undefined, 'não altera o objeto recebido');
  assert.strictEqual(T.mesclarEscolha(linha, Object.assign({}, esp, { revisao: 3 }), { campo: 'qtd', valor: '1 COMPRIMIDO' }).motivo, 'linha-de-outra-resposta');
  assert.strictEqual(T.mesclarEscolha(linha, Object.assign({}, esp, { respostaId: 'r88_y' }), { campo: 'qtd', valor: 'X' }).motivo, 'linha-de-outra-resposta');
  assert.strictEqual(T.mesclarEscolha(linha, Object.assign({}, esp, { linhaId: 'r57_b' }), { campo: 'qtd', valor: 'X' }).motivo, 'linha-de-outra-resposta');
  assert.strictEqual(T.mesclarEscolha(Object.assign({}, linha, { det: { cuidado57_estado: 'realizado-conferido' } }), esp, { campo: 'qtd', valor: 'X' }).motivo, 'ja-aplicado');
  const igualJa = T.mesclarEscolha(ok1.linha, esp, { campo: 'qtd', valor: '1 COMPRIMIDO' }); assert.ok(igualJa.ok && igualJa.mudou === false, 'escolha igual à gravada: nada a escrever');
  assert.strictEqual(T.mesclarEscolha(null, esp, { campo: 'qtd', valor: 'X' }).motivo, 'linha-ausente');
  assert.strictEqual(T.mesclarEscolha(linha, esp, { campo: 'valor', valor: 'X' }).motivo, 'escolha-invalida', 'só qtd, prod e onde');
  igual(T.camposDoCuidado('verm_p'), ['qtd', 'onde']); igual(T.camposDoCuidado('ecto_p'), ['prod', 'qtd', 'onde']);
  ['col_p', 'escova_p', 'vac_raiva_p', 'vac_mult_p', 'vac_gripe_p'].forEach((k) => igual(T.camposDoCuidado(k), [], k));
});

// ================================================================= P9 — Mandou na bolsa → lista do Day Care (AC5.1, AC5.4)
const linhasDoDia = (m, item) => m.ev(([dia, it]) => window.__banco.ler('daycare/dashboard/' + dia + '/' + it) || {}, [DIA, item]);
prova('P9', 'uma linha, id fixo, no cuidado certo; toque duplo e dois aparelhos não criam uma segunda (AC5.1)', async () => {
  const m = await mundo({ filhots: [{ n: 'Teste Bolsa', tutor: 'Tutor Bolsa', tel: '(31) 99999-0001', cuidados: ['verm_p', 'ecto_p', 'col_p', 'vac_raiva_p'] }] });
  try {
    await m.ev(() => { window.__reg = []; const o = ZeluzRespostaApp88.registrar; ZeluzRespostaApp88.registrar = function (gk, itens, op) { window.__reg.push(1); return o.apply(this, arguments); }; });
    // toque duplo (dois cliques seguidos, antes da primeira resposta voltar)
    await m.ev((s) => { const b = document.querySelector(s); b.click(); b.click(); }, m.botao('Teste Bolsa', 'verm_p', 'autorizar_bolsa')); await m.quieto();
    assert.strictEqual(await m.ev(() => window.__reg.length), 1, 'o toque duplo grava uma vez só');
    let ls = await linhasDoDia(m, 'vermifugo'); assert.strictEqual(Object.keys(ls).length, 1, 'uma linha: ' + Object.keys(ls));
    const lid = await m.ev((ck) => ZeluzCuidado57SolCore.linhaId({ cycleKey: ck, itemK: 'verm_p' }), m.cicloDe('Teste Bolsa', 'verm_p'));
    assert.deepStrictEqual(Object.keys(ls), [lid], 'o id é o fixo do ciclo (r57_…)'); assert.ok(/^r57_/.test(lid));
    // dois aparelhos: a mesma resposta chega de novo pela porta, por outro caminho
    await m.ev(async (ck) => { const g = window.__mundo[0].groupKey; const item = { cycleKey: ck, itemK: 'verm_p', decisao: 'autorizar', origem: 'bolsa', onde: '', baseRevision: -1 };
      await Promise.all([ZeluzRespostaApp88.registrar(g, [item], { petId: 'pet1' }), ZeluzRespostaApp88.registrar(g, [item], { petId: 'pet1' })]); }, m.cicloDe('Teste Bolsa', 'verm_p'));
    ls = await linhasDoDia(m, 'vermifugo'); assert.strictEqual(Object.keys(ls).length, 1, 'dois aparelhos, uma linha só');
    // o item certo por cuidado: vermífugo, carrapaticida, coleira e, para a vacina, «Veterinário» (vet)
    for (const [k, item] of [['ecto_p', 'carrapaticida'], ['col_p', 'coleira'], ['vac_raiva_p', 'vet']]) {
      await m.tocar('Teste Bolsa', k, 'autorizar_bolsa'); const l = await linhasDoDia(m, item);
      assert.strictEqual(Object.keys(l).length, 1, 'uma linha em «' + item + '» para ' + k + ': ' + JSON.stringify(Object.keys(l)));
      const x = l[Object.keys(l)[0]]; assert.ok(x.origemVencimento.protocolo === 'cuidado57' && x.origemVencimento.itemK === k && x.origemVencimento.origemResposta === 'bolsa' && x.chave === m.dcDe('Teste Bolsa'), JSON.stringify(x));
    }
    assert.strictEqual(m.erros.length, 0, m.erros.join(' | '));
  } finally { await m.fechar(); }
}, 'C');
prova('P9', 'falha ao criar a linha: a resposta fica salva, a tela diz que a tarefa não foi criada e «Tentar de novo» refaz sem duplicar (AC5.4)', async () => {
  const m = await mundo({ filhots: [{ n: 'Teste Falha', tutor: 'Tutor Falha', tel: '(31) 99999-0001', cuidados: ['verm_p'] }] });
  try {
    await m.ev(() => { window.__dashLancarOrig = dashLancar; window.dashLancar = function () { return Promise.resolve(false); }; });
    await m.tocar('Teste Falha', 'verm_p', 'autorizar_bolsa');
    let t = await m.texto('Teste Falha'); assert.ok(/Resposta salva, mas a tarefa do Day Care ainda não foi criada\./.test(t) && /Tentar de novo/.test(t), t);
    assert.strictEqual(Object.keys(await linhasDoDia(m, 'vermifugo')).length, 0);
    await m.ev(() => { window.dashLancar = window.__dashLancarOrig; });
    await m.page.click(m.sel('Teste Falha') + ' [data-zt694-acao="tarefa-tentar"]'); await m.quieto();
    assert.strictEqual(Object.keys(await linhasDoDia(m, 'vermifugo')).length, 1);
    t = await m.texto('Teste Falha'); assert.ok(/Foi para a lista do Day Care: Vermífugo — falta aplicar e conferir\./.test(t) && !/ainda não foi criada/.test(t), t);
    await m.page.evaluate(() => { document.querySelector('[data-zt694-acao="resp"][aria-pressed="true"]').click(); }); await m.quieto();
    assert.strictEqual(Object.keys(await linhasDoDia(m, 'vermifugo')).length, 1, 'tocar de novo na mesma resposta é idempotente');
  } finally { await m.fechar(); }
}, 'C');

// ================================================================= P10 — as três telas recebem a mesma linha (AC5.3)
prova('P10', 'a linha que a resposta cria é a de sempre: a que os Lançamentos do dia, o monitor e a TV leem (AC5.3)', async () => {
  const m = await mundo({ filhots: [{ n: 'Teste Tres', tutor: 'Tutor Tres', tel: '(31) 99999-0001', cuidados: ['verm_p'] }] });
  try {
    await m.tocar('Teste Tres', 'verm_p', 'autorizar_bolsa');
    const l = Object.values(await linhasDoDia(m, 'vermifugo'))[0];
    assert.ok(l && l.valor === 'Teste Tres/SRD (CONFERIR ORIENTAÇÃO)' && l.chave === m.dcDe('Teste Tres') && l.det.cuidado57_estado === 'conferir-orientacao' && l.origemVencimento.protocolo === 'cuidado57' && l.quem === 'Amanda', JSON.stringify(l));
    const aud = await m.ev((dia) => Object.values(window.__banco.ler('daycare/auditoria/' + dia) || {}).map((x) => x.detalhe), DIA);
    assert.ok(aud.some((x) => /^NÃO enviou \(Teste Tres\/SRD \(CONFERIR ORIENTAÇÃO\)\): ponte não configurada/.test(x)), 'o caminho da TV/planilha foi acionado como sempre: ' + aud.join(' | '));
    const carregada = await m.ev(async () => { await dashCarregar(); const x = DASH_DADOS.vermifugo || {}; return Object.keys(x).length; }); assert.strictEqual(carregada, 1, 'os Lançamentos do dia (o carregador do próprio app) leem a mesma linha');
  } finally { await m.fechar(); }
}, 'C');

// ================================================================= P11 — o estado do Day Care na linha (AC5.2)
prova('P11', '«Foi para a lista do Day Care» sobrevive ao redesenho e acompanha a tarefa: falta aplicar → sendo aplicado → aplicado e conferido (AC5.2)', async () => {
  const m = await mundo({ filhots: [{ n: 'Teste Estado', tutor: 'Tutor Estado', tel: '(31) 99999-0001', cuidados: ['verm_p'] }] });
  try {
    await m.tocar('Teste Estado', 'verm_p', 'autorizar_bolsa');
    const frase = (e) => new RegExp('Foi para a lista do Day Care: Vermífugo — ' + e + '\\.');
    assert.ok(frase('falta aplicar e conferir').test(await m.texto('Teste Estado')));
    await m.recarregar(); assert.ok(frase('falta aplicar e conferir').test(await m.texto('Teste Estado')), 'sobrevive ao redesenho');
    for (const [estado, texto] of [['emexecucao', 'sendo aplicado'], ['realizado', 'aplicado e conferido']]) {
      await m.ev(([dia, dc, ck, est]) => { const p = 'daycare/vencimentos/' + dia + '/' + dc; const reg = window.__banco.ler(p); reg.respostasEscopo49.tarefas57[ZeluzResposta88.codificarChave(ck)].estado = est; window.__banco.poe(p, reg); }, [DIA, m.dcDe('Teste Estado'), m.cicloDe('Teste Estado', 'verm_p'), estado]);
      await m.ev(() => { VENC_PEND = null; return vencPendCarregar(true); }); await m.page.click('[data-z44-reler]'); await m.quieto(300);
      assert.ok(frase(texto).test(await m.texto('Teste Estado')), estado + ' → ' + texto + ': ' + await m.texto('Teste Estado'));
      assert.ok(!/falta aplicar e conferir/.test(await m.texto('Teste Estado')));
      assert.ok(!/(aplicado por|quem aplicou)/i.test(await m.texto('Teste Estado')), 'o nome de quem aplicou não aparece (seria uma leitura a mais)');
    }
    assert.strictEqual(m.erros.length, 0, m.erros.join(' | '));
  } finally { await m.fechar(); }
}, 'C');

// ================================================================= P12 — Autorizou pegar na loja → Day Care + Snoopy (AC6.1 a 6.6)
const snoopyTexto = (m, nome) => m.ev((s) => { const e = document.querySelector(s + ' [data-zt694-snoopy]'); return e ? e.innerText : null; }, m.sel(nome));
/* espera pela CONDIÇÃO (não por tempo): o texto do Snoopy daquele FILHOt casa com `re`; devolve o texto (ou o último que viu, se o prazo acabar, para a prova dizer o que apareceu) */
const esperaSnoopy = async (m, nome, re) => { const t = await ate(async () => { const x = await snoopyTexto(m, nome); return x && re.test(x) ? x : ''; }, 15000); return t || await snoopyTexto(m, nome); };
const PENDENTE_NO_SNOOPY = /Falta lançar no Snoopy e receber do tutor/, LANCADO_NO_SNOOPY = /Snoopy: lançado por Amanda em \d\d\/\d\d às \d\d:\d\d/;
/* quantas vezes o app LEU do banco os Lançamentos do dia e o Snoopy do dia (as leituras de verdade, não as chamadas) */
const leiturasDoDia = async (m) => { const l = (await m.log()).leituras; return { dia: l.filter((x) => x.path === 'daycare/dashboard/' + DIA).length, sn: l.filter((x) => x.path === 'daycare/snoopy/' + DIA).length }; };
const espiarDia = (m) => m.zerarLog();
prova('P12', 'loja: a pendência e o botão «Já lancei no Snoopy» na própria linha; confirmar e desfazer atualizam a linha da tela, sem erro de página (AC6.1, AC6.2, AC6.5, AC6.6)', async () => {
  const m = await mundo({ filhots: [{ n: 'Teste Snoopy', tutor: 'Tutor Snoopy', tel: '(31) 99999-0001', cuidados: ['verm_p'] }] });
  try {
    await m.tocar('Teste Snoopy', 'verm_p', 'autorizar_loja');
    let t = await esperaSnoopy(m, 'Teste Snoopy', /Já lancei no Snoopy/); assert.ok(t && /Falta lançar no Snoopy e receber do tutor/.test(t) && /Snoopy: pendente de confirmação humana/.test(t) && /Já lancei no Snoopy/.test(t), t);
    await m.page.click(m.sel('Teste Snoopy') + ' button[data-snoopy-item]');
    await m.modal('Já lancei no Snoopy');
    t = await esperaSnoopy(m, 'Teste Snoopy', LANCADO_NO_SNOOPY); assert.ok(LANCADO_NO_SNOOPY.test(t) && /desfazer/.test(t), 'quem e quando, na própria linha: ' + t);
    const ev = await m.ev((dia) => { const d = window.__banco.ler('daycare/snoopy/' + dia); const it = d && d.vermifugo; const id = it && Object.keys(it)[0]; return id ? Object.values(it[id].eventos) : []; }, DIA);
    assert.ok(ev.length === 1 && ev[0].declaracao === 'lancei-no-snoopy' && ev[0].quem === 'Amanda', JSON.stringify(ev));
    await m.page.click(m.sel('Teste Snoopy') + ' button[data-snoopy-item]');
    await m.page.fill('#zCampoTexto', 'engano ao tocar na linha'); await m.modal('Desfazer confirmação');
    t = await esperaSnoopy(m, 'Teste Snoopy', PENDENTE_NO_SNOOPY); assert.ok(/Falta lançar no Snoopy e receber do tutor/.test(t) && /Já lancei no Snoopy/.test(t), 'depois de desfazer volta a pendente: ' + t);
    assert.strictEqual(m.erros.length, 0, m.erros.join(' | '));
  } finally { await m.fechar(); }
}, 'C');
prova('P12', 'consultora, supervisão, gestão e diretoria veem o botão do Snoopy (AC6.2)', async () => {
  for (const [role, rota] of [['consultora', 'consultoras'], ['supervisor', 'painel-amanda'], ['gestao', 'painel-amanda'], ['diretoria', 'painel-amanda']]) {
    const m = await mundo({ filhots: [{ n: 'Teste Papel', tutor: 'Tutor Papel', tel: '(31) 99999-0001', cuidados: ['verm_p'] }], usuario: { monId: 'p1', pessoa: 'Pessoa ' + role, nome: 'Pessoa ' + role, role: role } }, { abrir: false });
    try {
      await m.abrirTela(rota); await m.tocar('Teste Papel', 'verm_p', 'autorizar_loja');
      const t = await esperaSnoopy(m, 'Teste Papel', /Já lancei no Snoopy/); assert.ok(t && /Já lancei no Snoopy/.test(t), role + ': ' + t);
      assert.strictEqual(await m.ev(() => dashEditarAtor().valido), true, role + ' pode confirmar o Snoopy');
    } finally { await m.fechar(); }
  }
  // os outros papéis não confirmam o Snoopy: quem assina é só consultora, supervisão, gestão e diretoria
  for (const role of ['monitor', 'vet', 'plantonista', 'aprendiz']) {
    const m = await mundo({ filhots: [{ n: 'Teste Papel', tutor: 'Tutor Papel', tel: '(31) 99999-0001', cuidados: ['verm_p'] }], usuario: { monId: 'p1', pessoa: 'Pessoa ' + role, nome: 'Pessoa ' + role, role: role } }, { abrir: false });
    try { assert.strictEqual(await m.ev(() => dashEditarAtor().valido), false, role + ' não pode confirmar o Snoopy'); } finally { await m.fechar(); }
  }
}, 'C');
prova('P12', 'vacina na loja: «só depois da vacina aplicada», sem botão antes (AC6.3)', async () => {
  const m = await mundo({ filhots: [{ n: 'Teste Vacina', tutor: 'Tutor Vacina', tel: '(31) 99999-0001', cuidados: ['vac_raiva_p'] }] });
  try {
    await m.tocar('Teste Vacina', 'vac_raiva_p', 'autorizar_loja');
    const t = await esperaSnoopy(m, 'Teste Vacina', /Snoopy: só depois da vacina aplicada/); assert.ok(/Snoopy: só depois da vacina aplicada/.test(t) && !/Já lancei no Snoopy/.test(t), t);
  } finally { await m.fechar(); }
}, 'C');
prova('P12', 'o dia carrega sozinho uma vez por abertura, só com resposta «loja» na tela (com «bolsa» lê só o nó da linha), sem trocar o dia dos Lançamentos; se não for hoje, «não consegui conferir» (AC6.4, AC13.3)', async () => {
  const semente = (valor, tarefa) => ({ filhots: [{ n: 'Teste Dia', tutor: 'Tutor Dia', tel: '(31) 99999-0001', cuidados: ['verm_p'] }], respostas: [{ pet: 0, k: 'verm_p', valor: valor, tarefa: tarefa }] });
  // sem resposta que crie linha: nada é lido
  let m = await mundo(semente('autorizar_externo'), { abrir: false });
  try { await espiarDia(m); await m.abrirTela(); await m.quieto(300); assert.deepStrictEqual(await leiturasDoDia(m), { dia: 0, sn: 0 }, 'sem linha do Day Care na tela, não lê os Lançamentos'); } finally { await m.fechar(); }
  // com resposta bolsa e nenhuma loja: o dia inteiro não é lido; a tela lê só o nó da linha de cada cuidado e mostra as escolhas
  m = await mundo(semente('autorizar_bolsa', 'criada'), { abrir: false });
  try {
    await espiarDia(m); await m.abrirTela(); await ate(async () => (await m.log()).leituras.some((x) => /^daycare\/dashboard\/[\d-]+\/vermifugo\/[^/]+$/.test(x.path))); await m.quieto(400);
    assert.deepStrictEqual(await leiturasDoDia(m), { dia: 0, sn: 0 }, 'com «bolsa» e sem «loja» não lê o dia inteiro nem o Snoopy');
    const lidos = (await m.log()).leituras.filter((x) => /^daycare\/dashboard\/[\d-]+\/vermifugo\/[^/]+$/.test(x.path)).length; assert.strictEqual(lidos, 1, 'lê o nó da linha do cuidado, uma vez');
    assert.ok(await m.ev((s) => !!document.querySelector(s + ' [data-zt694-esc] [data-zt694-campo="qtd"]'), m.sel('Teste Dia')), 'as escolhas de quanto e de onde estão na linha');
  } finally { await m.fechar(); }
  // com resposta loja: uma vez por abertura (e outra por «Atualizar envios»)
  m = await mundo(semente('autorizar_loja', 'criada'), { abrir: false });
  try {
    await espiarDia(m); const antes = await m.ev(() => DASH_DIA_SEL); await m.abrirTela(); await ate(async () => /Falta lançar no Snoopy/.test(await snoopyTexto(m, 'Teste Dia') || '')); await m.quieto(400);
    assert.deepStrictEqual(await leiturasDoDia(m), { dia: 1, sn: 1 }, 'uma leitura do dia e uma do Snoopy por abertura');
    assert.ok(/Falta lançar no Snoopy/.test(await snoopyTexto(m, 'Teste Dia')));
    await m.page.click('[data-z44-reler]'); await ate(async () => (await leiturasDoDia(m)).sn >= 2); await m.quieto(500);
    assert.deepStrictEqual(await leiturasDoDia(m), { dia: 2, sn: 2 }, '«Atualizar envios» lê de novo');
    assert.strictEqual(await m.ev(() => DASH_DIA_SEL), antes, 'o dia escolhido nos Lançamentos não é trocado');
  } finally { await m.fechar(); }
  // o dia dos Lançamentos NÃO é hoje: a tela não o troca e diz que não conseguiu conferir
  m = await mundo(semente('autorizar_loja', 'criada'), { abrir: false });
  try {
    await m.ev(() => { DASH_DIA_SEL = '2026-10-19'; }); await espiarDia(m); await m.abrirTela(); await ate(async () => /não consegui conferir o Snoopy/.test(await snoopyTexto(m, 'Teste Dia') || '')); await m.quieto(400);
    assert.deepStrictEqual(await leiturasDoDia(m), { dia: 0, sn: 0 }); assert.strictEqual(await m.ev(() => DASH_DIA_SEL), '2026-10-19', 'nunca troca o dia que a pessoa escolheu');
    assert.ok(/não consegui conferir o Snoopy/.test(await snoopyTexto(m, 'Teste Dia')));
  } finally { await m.fechar(); }
  // a leitura do Snoopy falha: a frase e «Tentar de novo» (nada de «conferindo…» para sempre)
  m = await mundo(semente('autorizar_loja', 'criada'), { abrir: false });
  try {
    await m.ev(() => { window.__banco.falhar(['daycare/snoopy/']); });
    await m.abrirTela(); await ate(async () => /não consegui conferir o Snoopy/.test(await snoopyTexto(m, 'Teste Dia') || '')); await m.quieto(500);
    let t = await snoopyTexto(m, 'Teste Dia'); assert.ok(/não consegui conferir o Snoopy/.test(t) && /Tentar de novo/.test(t) && !/conferindo o Snoopy/.test(t), t);
    await m.ev(() => { window.__banco.falhar([]); });
    await m.page.click(m.sel('Teste Dia') + ' [data-zt694-acao="snoopy-tentar"]');
    t = await ate(async () => { const x = await snoopyTexto(m, 'Teste Dia'); return /Falta lançar no Snoopy/.test(x || '') ? x : ''; }) || await snoopyTexto(m, 'Teste Dia'); assert.ok(/Falta lançar no Snoopy/.test(t), t);
  } finally { await m.fechar(); }
}, 'C');

// ================================================================= P13 — o texto «Vai fazer em casa» (AC7.1 a 7.3)
/* Decisão da Adriana em 20/out/2026 (H94-1: «emojis são bem-vindos. Já autorizei os textos»): vale o texto que JÁ estava publicado na b044ecd, letra por letra, com o coração.
   Duas variantes: vacina (foto do cartão) e as demais (data e produto). */
const CORACAO = '\u{1F49B}';
const TEXTOS = (t) => ({
  geral: 'Combinado, ' + t + '! ' + CORACAO + ' Depois desse cuidado, você nos informa a data e o produto usado? Assim, mantemos a ficha atualizada e cuidamos, juntos, da segurança e do bem-estar de todos os nossos Aulunos.',
  vac: 'Combinado, ' + t + '! ' + CORACAO + ' Depois da vacinação, você nos envia uma foto do cartão com a data, a assinatura e o carimbo do veterinário? Assim, mantemos a ficha atualizada e cuidamos, juntos, da segurança e do bem-estar de todos os nossos Aulunos.',
});
prova('P13', 'o texto é o publicado, letra por letra: vacina com a foto do cartão e os demais cuidados com a data e o produto; nome do tutor; sem tutor, sem texto (AC7.1 a 7.3)', async () => {
  const f = noTodo().ctx.ZeluzRespostaApp88.textoEmCasa, T = TEXTOS('Tutor Teste 01'), i = { tutor: 'Tutor Teste 01', filhot: 'Teste 01' };
  ['verm_p', 'verm_dose2_p', 'ecto_p', 'col_p', 'escova_p'].forEach((k) => assert.strictEqual(f(i, k), T.geral, k));
  ['vac_raiva_p', 'vac_mult_p', 'vac_gripe_p'].forEach((k) => assert.strictEqual(f(i, k), T.vac, k));
  assert.strictEqual(f({ tutor: '', filhot: 'Teste 01' }, 'verm_p'), '', 'sem nome do tutor na ficha não há texto (como já era)'); assert.strictEqual(f({ filhot: 'Teste 01' }, 'vac_raiva_p'), '');
  assert.strictEqual(f(i, ''), '', 'sem cuidado, sem texto');
  [T.geral, T.vac].forEach((x) => {
    assert.ok(/Tutor Teste 01/.test(x) && (x.match(/\u{1F49B}/gu) || []).length === 1, 'cita o tutor e leva o coração do texto publicado');
    assert.ok(!/\b(cão|cães|cachorro|cachorros|animal|animais|bicho|bichos|dono|donos|proprietário|funcionário|funcionários)\b/i.test(x), 'palavra proibida: ' + x); assert.ok(!/Zeluz|Zéluz|ZELUZ/.test(x), '«Zêluz» só com circunflexo');
  });
  assert.ok(/foto do cartão com a data, a assinatura e o carimbo do veterinário/.test(T.vac) && /a data e o produto usado/.test(T.geral) && !/foto do cartão/.test(T.geral));
});
prova('P13', 'na tela, o texto vem da função única: dois cuidados com o mesmo texto dão uma caixa só; vacina e outro cuidado dão duas caixas (uma por variante) (AC7.1, AC7.2)', async () => {
  const m = await mundo({ filhots: [{ n: 'Teste Dois', tutor: 'Tutor Dois', tel: '(31) 99999-0001', cuidados: ['verm_p', 'ecto_p'] }, { n: 'Teste Vac', tutor: 'Tutor Vac', tel: '(31) 99999-0002', cuidados: ['verm_p', 'vac_raiva_p'] }] });
  try {
    const caixas = (n) => m.ev((s) => [...document.querySelectorAll(s + ' [data-zt694-copia]')].map((e) => ({ tit: e.querySelector('.zt694-copia-tit').textContent, txt: e.querySelector('[data-zt694-texto]').textContent })), m.sel(n));
    await m.tocar('Teste Dois', 'verm_p', 'autorizar_externo');
    let c = await caixas('Teste Dois'); assert.strictEqual(c.length, 1); assert.strictEqual(c[0].txt, TEXTOS('Tutor Dois').geral); assert.strictEqual(c[0].tit, 'Mensagem para o tutor, pronta para enviar');
    await m.tocar('Teste Dois', 'ecto_p', 'autorizar_externo');
    c = await caixas('Teste Dois'); assert.strictEqual(c.length, 1, 'o texto não cita o cuidado: dois cuidados, uma caixa'); assert.strictEqual(c[0].txt, TEXTOS('Tutor Dois').geral);
    await m.tocar('Teste Dois', 'verm_p', 'aguardar');
    c = await caixas('Teste Dois'); assert.strictEqual(c.length, 1, 'e continua uma caixa com o outro cuidado em casa'); await m.tocar('Teste Dois', 'ecto_p', 'aguardar'); assert.strictEqual((await caixas('Teste Dois')).length, 0, 'sem cuidado em casa, sem caixa');
    await m.tocar('Teste Vac', 'verm_p', 'autorizar_externo'); await m.tocar('Teste Vac', 'vac_raiva_p', 'autorizar_externo');
    c = await caixas('Teste Vac'); assert.strictEqual(c.length, 2, 'vacina e demais cuidados: uma caixa por texto');
    assert.deepStrictEqual(c.map((x) => x.txt).sort(), [TEXTOS('Tutor Vac').geral, TEXTOS('Tutor Vac').vac].sort());
    assert.deepStrictEqual(c.map((x) => x.tit).sort(), ['Mensagem para o tutor, pronta para enviar: demais cuidados', 'Mensagem para o tutor, pronta para enviar: vacina']);
    assert.strictEqual(m.erros.length, 0, m.erros.join(' | '));
  } finally { await m.fechar(); }
}, 'C');

// ================================================================= P14 — um lugar só (AC7.5)
prova('P14', 'o texto «em casa» existe uma vez só no código (uma por variante); a janela «Abrir resposta» e a tela nova usam a mesma função; o texto publicado não mudou uma letra (AC7.5)', async () => {
  const conta = (trecho, h) => (h || HTML).split(trecho).length - 1;
  const VAC = "'Combinado, '+tutor+'! \u{1F49B} Depois da vacinação, você nos envia uma foto do cartão com a data, a assinatura e o carimbo do veterinário? Assim, mantemos a ficha atualizada e cuidamos, juntos, da segurança e do bem-estar de todos os nossos Aulunos.'";
  const GER = "'Combinado, '+tutor+'! \u{1F49B} Depois desse cuidado, você nos informa a data e o produto usado? Assim, mantemos a ficha atualizada e cuidamos, juntos, da segurança e do bem-estar de todos os nossos Aulunos.'";
  assert.strictEqual(conta(VAC), 1, 'a variante da vacina aparece uma vez, igual à publicada'); assert.strictEqual(conta(GER), 1, 'a variante dos demais cuidados aparece uma vez, igual à publicada');
  assert.strictEqual(conta('Combinado, '), 2, 'duas variantes, nenhuma outra cópia'); assert.strictEqual(conta('Depois da vacinação, você nos envia'), 1); assert.strictEqual(conta('Depois desse cuidado, você nos informa'), 1);
  assert.strictEqual(conta('function textoEmCasa('), 1, 'uma função só');
  assert.strictEqual(conta('return textoEmCasa({tutor:tutor},ciclo.itemK);'), 1, 'a janela «Abrir resposta» chama a função única');
  assert.strictEqual(conta('b.textoEmCasa({tutor:tutor},v.cy.itemK)'), 1, 'a tela nova chama a mesma função');
  if (APP_BASE) { const base = fs.readFileSync(APP_BASE, 'utf8'); assert.strictEqual(conta(VAC, base), 2, 'na base o texto estava duplicado (98154 e 99303): a vacina'); assert.strictEqual(conta(GER, base), 2, 'e os demais cuidados'); }
  const trechoUi = HTML.slice(HTML.indexOf('<script id="zelozinha-tela94-puro">'));
  assert.ok(!/Combinado|\p{Extended_Pictographic}/u.test(trechoUi), 'a tela nova não tem texto ao tutor próprio: o texto vem da função');
});

// ================================================================= P15 — caixa, Copiar e WhatsApp (AC7.4)
prova('P15', 'caixa inteira sem rolagem; «Copiar mensagem» copia e diz; se a cópia falha, seleciona o texto; «Abrir no WhatsApp» com o número da ficha e o texto; sem telefone, desligado (AC7.4)', async () => {
  const m = await mundo({ filhots: [{ n: 'Teste Copia', tutor: 'Tutor Copia', tel: '(31) 99999-0001', cuidados: ['verm_p', 'ecto_p'] }, { n: 'Teste Sem Tel', tutor: 'Tutor Sem Tel', tel: '', cuidados: ['verm_p'] }] });
  try {
    await m.page.click(m.todos('Teste Copia', 'autorizar_externo')); await m.quieto(); await esperar(1900); await m.quieto();   // o app refaz o painel ~1,5 s depois de uma gravação; a seleção do texto só vale depois disso
    const texto = TEXTOS('Tutor Copia').geral;
    const med = await m.ev((s) => { const t = document.querySelector(s + ' [data-zt694-texto]'); const cs = getComputedStyle(t); return { txt: t.textContent, sh: t.scrollHeight, ch: t.clientHeight, ov: cs.overflowY }; }, m.sel('Teste Copia'));
    assert.ok(med.sh <= med.ch + 1 && med.ov !== 'auto' && med.ov !== 'scroll', 'o texto inteiro, sem rolagem interna: ' + JSON.stringify(med)); assert.strictEqual(med.txt, texto);
    await m.page.click(m.sel('Teste Copia') + ' [data-zt694-acao="copiar"]'); await esperar(150);
    assert.strictEqual(await m.ev(() => navigator.clipboard.readText()), texto, 'copiou o texto inteiro');
    assert.ok(/Mensagem copiada\./.test(await m.texto('Teste Copia')));
    await m.ev(() => { navigator.clipboard.writeText = () => Promise.reject(new Error('sem permissão')); document.execCommand = () => false; });
    await m.page.click(m.sel('Teste Copia') + ' [data-zt694-acao="copiar"]'); await esperar(200);
    assert.ok(/Selecione o texto para copiar\./.test(await m.texto('Teste Copia')), await m.texto('Teste Copia'));
    assert.strictEqual(await m.ev(() => String(getSelection())), texto, 'a cópia falhou: o texto fica selecionado');
    await m.page.click(m.sel('Teste Copia') + ' [data-zt694-acao="whats-texto"]');
    assert.deepStrictEqual((await m.ev(() => window.__ab.zWhats)).pop(), { tel: '+5531999990001', texto: texto }, 'abre a conversa do tutor com o texto pronto (número da ficha)');
    await m.tocar('Teste Sem Tel', 'verm_p', 'autorizar_externo');
    const sem = await m.ev((s) => ({ desl: document.querySelector(s + ' [data-zt694-acao="whats-texto"]').disabled, t: document.querySelector(s).innerText }), m.sel('Teste Sem Tel'));
    assert.ok(sem.desl && /Sem telefone na ficha: use Copiar\./.test(sem.t), 'sem telefone: botão desligado e a frase — ' + sem.t);
    assert.strictEqual(m.erros.length, 0, m.erros.join(' | '));
  } finally { await m.fechar(); }
}, 'C');

// ================================================================= P16 — «em casa» não cria nada (AC7.6)
prova('P16', 'em casa só registra a resposta: nenhuma linha, tarefa ou cobrança, e o aviso diz isso (AC7.6)', async () => {
  const m = await mundo({ filhots: [{ n: 'Teste Casa', tutor: 'Tutor Casa', tel: '(31) 99999-0001', cuidados: ['verm_p'] }] });
  try {
    await m.zerarLog(); await m.tocar('Teste Casa', 'verm_p', 'autorizar_externo');
    const g = (await m.log()).gravacoes;
    assert.ok(g.length > 0 && g.every((x) => /^daycare\/vencimentos\//.test(x.path)), 'só a resposta: ' + g.map((x) => x.path).join(', '));
    const reg = await m.ler('daycare/vencimentos/' + DIA + '/' + m.dcDe('Teste Casa')); assert.ok(!reg.respostasEscopo49.tarefas57 || Object.keys(reg.respostasEscopo49.tarefas57).length === 0, 'nenhuma tarefa');
    assert.deepStrictEqual(await m.ev((dia) => window.__banco.ler('daycare/dashboard/' + dia) || {}, DIA), {}, 'nenhuma linha no Day Care');
    assert.ok(/Nenhuma aplicação ou cobrança foi criada\./.test(await m.texto('Teste Casa')));
  } finally { await m.fechar(); }
}, 'C');

// ================================================================= P17 — 13h30 (AC8.1, AC8.2)
prova('P17', 'às 13h29min59s ainda é «Retorno às 13h30»; às 13h30min00s é «Hora de retomar o contato»; igual em UTC e em São Paulo (AC8.1, AC8.2)', async () => {
  const T = noTodo().ctx.ZelozinhaTela94, ms = (iso) => Date.parse(iso);
  assert.strictEqual(T.retornoDepois(ms('2026-10-20T13:29:59-03:00'), DIA), false); assert.strictEqual(T.retornoDepois(ms('2026-10-20T13:30:00-03:00'), DIA), true);
  assert.strictEqual(T.retornoDepois(ms('2026-10-20T16:29:59Z'), DIA), false); assert.strictEqual(T.retornoDepois(ms('2026-10-20T16:30:00Z'), DIA), true, '13h30 de Brasília = 16h30 UTC');
  assert.strictEqual(T.retornoDepois(ms('2026-10-20T14:00:00-03:00'), DIA), true, 'abrir às 14h já é depois');
  assert.strictEqual(T.retornoDepois(ms('2026-10-21T00:30:00Z'), DIA), true, '21h30 de Brasília do mesmo dia (já é dia 21 em UTC)');
  assert.strictEqual(T.retornoDepois(ms('2026-10-21T00:30:00Z'), '2026-10-21'), false, 'o dia seguinte começa de novo');
  assert.strictEqual(T.retornoDepois(ms('2026-10-21T09:00:00-03:00'), DIA), true, 'dia que já passou');
  assert.strictEqual(T.retornoDepois(ms('2026-10-20T03:00:00Z'), DIA), false, '00h00 de Brasília');
  assert.strictEqual(T.msAte1330(ms('2026-10-20T13:29:59-03:00'), DIA), 1000);
  const rot = (id, dep) => T.rotuloGrupo(id, dep); assert.strictEqual(rot('retorno', false), 'Retorno às 13h30'); assert.strictEqual(rot('retorno', true), 'Hora de retomar o contato');
  const pets = [{ nome: 'B', grupo: 'falta' }, { nome: 'A', grupo: 'retorno' }, { nome: 'C', grupo: 'respondidos' }];
  assert.deepStrictEqual(JSON.parse(JSON.stringify(T.ordenar(pets, false).map((g) => g.id))), ['falta', 'retorno', 'respondidos']);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(T.ordenar(pets, true).map((g) => g.id))), ['retorno', 'falta', 'respondidos'], 'depois das 13h30 o retorno é o primeiro grupo');
});
prova('P17', 'na tela: antes das 13h30 o grupo diz «Retorno às 13h30»; abrir às 14h já o encontra no topo como «Hora de retomar o contato» (AC8.2)', async () => {
  const spec = { filhots: [{ n: 'Teste A', tutor: 'Tutor A', tel: '(31) 99999-0001', cuidados: ['verm_p'] }, { n: 'Teste B', tutor: 'Tutor B', tel: '(31) 99999-0002', cuidados: ['verm_p'] }], respostas: [{ pet: 1, k: 'verm_p', valor: 'aguardar' }] };
  const grupos = (m) => m.ev(() => [...document.querySelectorAll('[data-zt694-grupo]')].map((e) => e.textContent));
  let m = await mundo(spec, { relogio: '2026-10-20T13:29:00-03:00' });
  try { assert.deepStrictEqual(await grupos(m), ['Falta responder', 'Retorno às 13h30']); assert.ok(/Retorno às 13h30: 1/.test(await m.ev(() => document.querySelector('[data-zt694-topo]').textContent))); } finally { await m.fechar(); }
  m = await mundo(spec, { relogio: '2026-10-20T14:00:00-03:00' });
  try {
    assert.deepStrictEqual(await grupos(m), ['Hora de retomar o contato', 'Falta responder']); assert.ok(/Retomar o contato: 1/.test(await m.ev(() => document.querySelector('[data-zt694-topo]').textContent)));
    const ordem = await m.ev(() => [...document.querySelectorAll('[data-zt694] [data-zt694-grupo], [data-zt694] [data-zt694-pet]')].map((e) => e.hasAttribute('data-zt694-grupo') ? 'G' : e.querySelector('.zt694-nome').textContent));
    assert.deepStrictEqual(ordem, ['G', 'Teste B', 'G', 'Teste A']);
    // depois das 13h e das 13h30 a tela lista, aceita respostas e retornos (AC11.3)
    await m.tocar('Teste A', 'verm_p', 'autorizar_externo'); assert.ok(/Vai fazer em casa · Amanda/.test(await m.texto('Teste A')));
    await m.tocar('Teste B', 'verm_p', 'autorizar_externo'); assert.ok(/Vai fazer em casa · Amanda/.test(await m.texto('Teste B')), 'trocar o retorno depois das 13h30 funciona');
  } finally { await m.fechar(); }
}, 'C');

// ================================================================= P18 — o texto do retorno das 13h30 (H94-3: a Adriana escolheu, em 20/out/2026, o texto que já estava publicado)
/* A AC8.3 dizia «sem texto no retorno»; a Adriana respondeu a H94-3: vale o texto publicado (o ramo das 13h30 da `mensagemAprovada`, com `cuidadoNaFrase`), com o coração. A tela chama a função que já existe, não copia o texto. */
const RETORNO = (tutor, cuidado, pet) => 'Olá, ' + tutor + '! Podemos fazer ' + cuidado + ' de ' + pet + ' hoje, enquanto está com a gente? Assim, vocês já resolvem esse cuidado sem precisar organizar outra visita e, juntos, cuidamos da segurança e do bem-estar de todos os nossos Aulunos. \u{1F49B}';
const FRASE_VERM = 'a aplicação do vermífugo', FRASE_ECTO = 'a aplicação da proteção contra pulgas e carrapatos';
prova('P18', 'o texto do retorno é o publicado, letra por letra, e vem da função que já existia: só depois das 13h30, só com o peludinho na casa (sem check-out), com o nome do tutor e do peludinho; o texto existe uma vez no código (H94-3)', async () => {
  const antigo = "Olá, '+tutor+'! Podemos fazer '+cuidadoNaFrase(ciclo.itemK)+' de '+pet+' hoje, enquanto está com a gente? Assim, vocês já resolvem esse cuidado sem precisar organizar outra visita e, juntos, cuidamos da segurança e do bem-estar de todos os nossos Aulunos. \u{1F49B}";
  assert.strictEqual(HTML.split(antigo).length - 1, 1, 'o texto continua uma vez só no código, igual ao publicado'); if (APP_BASE) assert.strictEqual(fs.readFileSync(APP_BASE, 'utf8').split(antigo).length - 1, 1, 'e é o mesmo da base');
  assert.ok(HTML.split("b.mensagemAprovada({nomeTutor:tutor,nomePeludo:pet},{itemK:v.cy.itemK},v.atual,{presencaCorporal:true,checkout:false,dia:c.dia})").length - 1 === 1, 'a tela chama a função que já existe');
  assert.ok(!/Podemos fazer|enquanto está com a gente/.test(HTML.slice(HTML.indexOf('<script id="zelozinha-tela94-puro">'))), 'a tela não tem o texto: ele vem da função');
  const info = { nomeTutor: 'Tutor Teste', nomePeludo: 'Teste 01' }, aguardar = { decisao: 'aguardar' }, naCasa = { presencaCorporal: true, checkout: false, dia: '2026-10-20' };
  const fnEm = (iso) => carregarNode(iso).ctx.ZeluzRespostaApp88.mensagemAprovada;
  const f14 = fnEm('2026-10-20T14:00:00-03:00');
  assert.strictEqual(f14(info, { itemK: 'verm_p' }, aguardar, naCasa), RETORNO('Tutor Teste', FRASE_VERM, 'Teste 01'), 'o texto publicado, com o coração');
  assert.strictEqual(f14(info, { itemK: 'ecto_p' }, aguardar, naCasa), RETORNO('Tutor Teste', FRASE_ECTO, 'Teste 01'), 'o texto muda com o cuidado');
  assert.strictEqual(f14(info, { itemK: 'vac_raiva_p' }, aguardar, naCasa), RETORNO('Tutor Teste', 'a vacinação antirrábica', 'Teste 01'));
  assert.strictEqual(f14(info, { itemK: 'verm_p' }, aguardar, Object.assign({}, naCasa, { checkout: true })), '', 'com check-out não há texto');
  assert.strictEqual(f14(info, { itemK: 'verm_p' }, aguardar, Object.assign({}, naCasa, { presencaCorporal: false })), '', 'sem a presença do corpo não há texto');
  assert.strictEqual(f14({ nomeTutor: '', nomePeludo: 'Teste 01' }, { itemK: 'verm_p' }, aguardar, naCasa), '', 'sem o nome do tutor não há texto'); assert.strictEqual(f14({ nomeTutor: 'Tutor Teste', nomePeludo: '' }, { itemK: 'verm_p' }, aguardar, naCasa), '', 'sem o nome do peludinho não há texto');
  assert.strictEqual(fnEm('2026-10-20T13:29:59-03:00')(info, { itemK: 'verm_p' }, aguardar, naCasa), '', 'às 13h29min59s ainda não há texto');
  assert.strictEqual(fnEm('2026-10-20T13:30:00-03:00')(info, { itemK: 'verm_p' }, aguardar, naCasa), RETORNO('Tutor Teste', FRASE_VERM, 'Teste 01'), 'às 13h30min00s há');
  assert.strictEqual(fnEm('2026-10-20T21:30:00-03:00')(info, { itemK: 'verm_p' }, aguardar, naCasa), RETORNO('Tutor Teste', FRASE_VERM, 'Teste 01'), 'às 21h30 de Brasília há, em UTC e em São Paulo');
});
prova('P18', 'na tela: depois das 13h30, «Não respondeu» mostra a caixa de copiar com o texto publicado (uma caixa por texto: dois cuidados, dois textos), o «Abrir no WhatsApp» abre com o texto; antes das 13h30 não há caixa e o «Abrir WhatsApp» abre vazio; quem já saiu (check-out) não aparece (H94-3)', async () => {
  const pegarCaixas = (m, n) => m.ev((s) => [...document.querySelectorAll(s + ' [data-zt694-copia]')].map((e) => ({ tit: e.querySelector('.zt694-copia-tit').textContent, txt: e.querySelector('[data-zt694-texto]').textContent })), m.sel(n));
  let m = await mundo({ filhots: [{ n: 'Teste Ret', tutor: 'Tutor Ret', tel: '(31) 99999-0001', cuidados: ['verm_p', 'ecto_p'] }, { n: 'Teste Um', tutor: 'Tutor Um', tel: '(31) 99999-0002', cuidados: ['verm_p'] }, { n: 'Teste Saiu', tutor: 'Tutor Saiu', tel: '(31) 99999-0003', cuidados: ['verm_p'] }] }, { relogio: '2026-10-20T14:00:00-03:00', abrir: false });
  try {
    await m.ev(() => { const dia = zPainel44Dia(), dk = window.__linhasHoje[2].chave; window.__banco.poe('daycare/checkout-corpo/' + dia + '/' + dk, { tipo: 'saida', quem: 'Zeloso Teste', fim: Date.now() - 600000 }); });
    await m.abrirTela();
    assert.strictEqual(await m.ev(() => document.querySelectorAll('[data-zt694-pet]').length), 2, 'quem já fez check-out não está na tela');
    await m.page.click(m.todos('Teste Ret', 'aguardar')); await m.quieto();
    let c = await pegarCaixas(m, 'Teste Ret'); assert.strictEqual(c.length, 2, 'dois cuidados, dois textos');
    assert.deepStrictEqual(c.map((x) => x.txt).sort(), [RETORNO('Tutor Ret', FRASE_VERM, 'Teste Ret'), RETORNO('Tutor Ret', FRASE_ECTO, 'Teste Ret')].sort(), 'o texto publicado, letra por letra, com o coração');
    assert.deepStrictEqual(c.map((x) => x.tit).sort(), ['Retomar o contato, mensagem pronta para enviar: Carrapaticida', 'Retomar o contato, mensagem pronta para enviar: Vermífugo']);
    assert.strictEqual(await m.ev((s) => !!document.querySelector(s + ' [data-zt694-acao="whats-vazio"]'), m.sel('Teste Ret')), false, 'a caixa traz o WhatsApp com o texto; não sobra o botão vazio');
    await m.page.click(m.sel('Teste Ret') + ' [data-zt694-copia="0"] [data-zt694-acao="whats-texto"]'); await ate(async () => (await janelasDoZap(m)).some((j) => j.numero));   // a janela abre no toque; a presença é conferida e só então ela vai ao link (M1, N3)
    assert.deepStrictEqual((await janelasDoZap(m)).pop(), { numero: '5531999990001', texto: c[0].txt, fechada: false }, 'abre a conversa do tutor com o texto da caixa (número da ficha)');
    await m.tocar('Teste Um', 'verm_p', 'aguardar'); c = await pegarCaixas(m, 'Teste Um'); assert.strictEqual(c.length, 1); assert.strictEqual(c[0].txt, RETORNO('Tutor Um', FRASE_VERM, 'Teste Um'));
    assert.ok(!/Teste Saiu|Tutor Saiu/.test(await m.telaTexto()), 'nenhum texto para quem já saiu'); assert.strictEqual(m.erros.length, 0, m.erros.join(' | '));
  } finally { await m.fechar(); }
  m = await mundo({ filhots: [{ n: 'Teste Ret', tutor: 'Tutor Ret', tel: '(31) 99999-0001', cuidados: ['verm_p'] }] }, { relogio: '2026-10-20T10:00:00-03:00' });
  try {
    await m.tocar('Teste Ret', 'verm_p', 'aguardar');
    assert.strictEqual((await pegarCaixas(m, 'Teste Ret')).length, 0, 'antes das 13h30 não há caixa'); assert.ok(!/Podemos fazer|enquanto está com a gente/.test(await m.telaTexto()));
    await m.page.click(m.sel('Teste Ret') + ' [data-zt694-acao="whats-vazio"]');
    assert.deepStrictEqual(await m.ev(() => window.__ab.zWhats), [{ tel: '+5531999990001', texto: '' }], 'antes das 13h30 o WhatsApp abre vazio'); assert.strictEqual(m.erros.length, 0, m.erros.join(' | '));
  } finally { await m.fechar(); }
}, 'C');

// ================================================================= P20 a P23 — marcou errado: trocar e desfazer (AC9)
const motivoOk = 'dedo na tecla errada ao tocar';
/* o cartaz «Anular» da 6.57, de verdade: lê a lista, preenche motivo e senha e confirma */
async function cartaz(m, opcoes) {
  opcoes = opcoes || {};
  await m.page.waitForSelector('#corrMotivo', { timeout: 8000 });
  const lista = await m.ev(() => { const c = document.getElementById('corrCartaz') || document.querySelector('[id^="corr"]'); return document.body.innerText; });
  if (opcoes.cancelar) { await m.page.locator('#corrBox button', { hasText: 'Cancelar — não mexer em nada' }).first().click(); await m.quieto(200); return lista; }
  await m.page.fill('#corrMotivo', opcoes.motivo || motivoOk); await m.page.fill('#corrSenha', opcoes.senha || '1234');
  await m.page.locator('#corrBox button', { hasText: opcoes.botao || 'Trocar e tirar da lista' }).first().click(); await m.quieto(400); await esperar(300);
  return lista;
}
const fecharCartaz = (m) => m.ev(() => { try { corrToque('fechar'); } catch (e) {} });
const regDo = (m, nome) => m.ler('daycare/vencimentos/' + DIA + '/' + m.dcDe(nome));
const tarefaDe = async (m, nome, k) => { const r = await regDo(m, nome); const t = r.respostasEscopo49.tarefas57 || {}; return t[await m.ev((ck) => ZeluzResposta88.codificarChave(ck), m.cicloDe(nome, k))]; };
prova('P20', 'bolsa → casa: abre o cartaz «Anular» com a lista do que sai; cancelar não muda nada; confirmar troca a resposta, tira a linha e invalida a tarefa (AC9.2)', async () => {
  const m = await mundo({ filhots: [{ n: 'Teste Troca', tutor: 'Tutor Troca', tel: '(31) 99999-0001', cuidados: ['verm_p'] }] });
  try {
    await m.tocar('Teste Troca', 'verm_p', 'autorizar_bolsa'); assert.strictEqual(Object.keys(await linhasDoDia(m, 'vermifugo')).length, 1);
    await m.zerarLog(); await m.page.click(m.botao('Teste Troca', 'verm_p', 'autorizar_externo'));
    const tela = await cartaz(m, { cancelar: true });
    assert.ok(/Anular|Trocar a resposta e tirar o cuidado da lista do Day Care/.test(tela) && /sai da lista do Day Care de hoje, do cartão do Encãotador e da TV/.test(tela) && /A tarefa do Day Care deixa de valer\./.test(tela), 'o cartaz traz a lista do que sai: ' + tela.slice(-900));
    assert.deepStrictEqual((await m.log()).gravacoes, [], 'cancelar não grava nada');
    assert.ok(/Mandou na bolsa/.test(await m.texto('Teste Troca')) && Object.keys(await linhasDoDia(m, 'vermifugo')).length === 1);
    // sem motivo de 4 palavras e sem a senha própria nada é gravado
    await m.page.click(m.botao('Teste Troca', 'verm_p', 'autorizar_externo')); await m.page.waitForSelector('#corrMotivo');
    await m.page.fill('#corrMotivo', 'engano'); await m.page.fill('#corrSenha', '1234'); await m.page.locator('#corrBox button', { hasText: 'Trocar e tirar da lista' }).first().click(); await esperar(200);
    assert.ok(/4 palavras/i.test(await m.ev(() => document.body.innerText)) && (await m.log()).gravacoes.length === 0, 'motivo curto: barrado');
    await m.page.fill('#corrMotivo', motivoOk); await m.page.fill('#corrSenha', 'errada'); await m.page.locator('#corrBox button', { hasText: 'Trocar e tirar da lista' }).first().click(); await esperar(200);
    assert.ok((await m.log()).gravacoes.length === 0, 'senha errada: nada gravado');
    await m.page.fill('#corrSenha', '1234'); await m.page.locator('#corrBox button', { hasText: 'Trocar e tirar da lista' }).first().click(); await m.quieto(400); await esperar(300);
    await fecharCartaz(m); await esperar(100);
    const reg = await regDo(m, 'Teste Troca'), pc = Object.values(reg.respostasEscopo49.porCiclo)[0];
    assert.ok(pc.decisao === 'autorizar' && pc.origem === 'externo' && pc.revisao === 1, JSON.stringify(pc));
    assert.deepStrictEqual(Object.keys(await linhasDoDia(m, 'vermifugo')), [], 'a linha saiu da lista do Day Care (monitor e TV)');
    const t = await tarefaDe(m, 'Teste Troca', 'verm_p'); assert.strictEqual(t.estado, 'invalida', 'a tarefa deixa de valer'); assert.ok(t.invalidadaEm);
    assert.strictEqual(await m.ev(() => Object.keys(DASH_DADOS.vermifugo || {}).length), 0, 'e some da memória dos Lançamentos do dia');
    const aud = await m.ev((dia) => Object.values(window.__banco.ler('daycare/auditoria/' + dia) || {}).map((x) => x.detalhe), DIA);
    assert.ok(aud.some((x) => /Teste Troca — Vermífugo: de «Mandou na bolsa» para «Vai fazer em casa»; saiu da lista do Day Care \(dedo na tecla errada ao tocar\)/.test(x)), aud.join(' | '));
    const tx = await m.texto('Teste Troca'); assert.ok(/Vai fazer em casa · Amanda/.test(tx) && !/Foi para a lista do Day Care/.test(tx) && /Trocada de Mandou na bolsa para Vai fazer em casa por Amanda/.test(tx), tx);
    assert.strictEqual(m.erros.length, 0, m.erros.join(' | '));
  } finally { await m.fechar(); }
}, 'C');
prova('P20', 'loja → casa e bolsa → não respondeu: tiram a linha; a pendência do Snoopy sai junto; nada fica órfão (AC9.2)', async () => {
  const m = await mundo({ filhots: [{ n: 'Teste Loja', tutor: 'Tutor Loja', tel: '(31) 99999-0001', cuidados: ['verm_p'] }, { n: 'Teste Bolsa', tutor: 'Tutor Bolsa', tel: '(31) 99999-0002', cuidados: ['verm_p'] }] });
  try {
    await m.tocar('Teste Loja', 'verm_p', 'autorizar_loja'); await m.tocar('Teste Bolsa', 'verm_p', 'autorizar_bolsa'); await esperaSnoopy(m, 'Teste Loja', /Já lancei no Snoopy/);
    assert.strictEqual(Object.keys(await linhasDoDia(m, 'vermifugo')).length, 2);
    await m.page.click(m.botao('Teste Loja', 'verm_p', 'autorizar_externo'));
    const tela = await cartaz(m); assert.ok(/A pendência do Snoopy sai junto\./.test(tela), tela.slice(-700));
    await fecharCartaz(m); await esperar(100);
    await m.page.click(m.botao('Teste Bolsa', 'verm_p', 'aguardar')); await cartaz(m); await fecharCartaz(m); await esperar(100);
    assert.deepStrictEqual(Object.keys(await linhasDoDia(m, 'vermifugo')), [], 'nenhuma linha órfã');
    for (const n of ['Teste Loja', 'Teste Bolsa']) assert.strictEqual((await tarefaDe(m, n, 'verm_p')).estado, 'invalida');
    assert.ok(/Retorno humano às 13h30/.test(await m.texto('Teste Bolsa')) && !/Snoopy/.test(await m.texto('Teste Loja')), 'a pendência do Snoopy saiu');
    assert.strictEqual(m.erros.length, 0, m.erros.join(' | '));
  } finally { await m.fechar(); }
}, 'C');
prova('P20', 'bolsa ↔ loja: a MESMA linha segue (muda a origem e a pendência do Snoopy), sem cartaz (AC9.3)', async () => {
  const m = await mundo({ filhots: [{ n: 'Teste Vai', tutor: 'Tutor Vai', tel: '(31) 99999-0001', cuidados: ['verm_p'] }] });
  try {
    await m.tocar('Teste Vai', 'verm_p', 'autorizar_bolsa'); const id1 = Object.keys(await linhasDoDia(m, 'vermifugo'));
    await m.tocar('Teste Vai', 'verm_p', 'autorizar_loja'); await esperaSnoopy(m, 'Teste Vai', PENDENTE_NO_SNOOPY);
    assert.ok(!(await m.ev(() => !!document.querySelector('#corrMotivo'))), 'sem cartaz');
    const l = await linhasDoDia(m, 'vermifugo'); assert.deepStrictEqual(Object.keys(l), id1, 'a mesma linha'); assert.strictEqual(l[id1[0]].origemVencimento.origemResposta, 'loja'); assert.strictEqual(l[id1[0]].origemVencimento.revisao, 1);
    assert.ok(/Falta lançar no Snoopy/.test(await snoopyTexto(m, 'Teste Vai')));
    await m.tocar('Teste Vai', 'verm_p', 'autorizar_bolsa'); await ate(async () => !(await snoopyTexto(m, 'Teste Vai')));
    const l2 = await linhasDoDia(m, 'vermifugo'); assert.deepStrictEqual(Object.keys(l2), id1); assert.strictEqual(l2[id1[0]].origemVencimento.origemResposta, 'bolsa');
    assert.ok(!(await snoopyTexto(m, 'Teste Vai')), 'sem a pendência do Snoopy na bolsa');
    assert.strictEqual((await tarefaDe(m, 'Teste Vai', 'verm_p')).estado, 'criada');
  } finally { await m.fechar(); }
}, 'C');
prova('P20', 'bolsa → loja → «Já lancei no Snoopy»: a linha lida antes não fica velha; a confirmação vale e a linha da tela mostra quem e quando (AC6.1, AC6.6, AC9.3)', async () => {
  const m = await mundo({ filhots: [{ n: 'Teste Muda', tutor: 'Tutor Muda', tel: '(31) 99999-0001', cuidados: ['verm_p'] }] });
  try {
    await m.tocar('Teste Muda', 'verm_p', 'autorizar_bolsa');
    await m.tocar('Teste Muda', 'verm_p', 'autorizar_loja');
    { const t = await esperaSnoopy(m, 'Teste Muda', /Já lancei no Snoopy/); assert.ok(/Falta lançar no Snoopy/.test(t) && /Já lancei no Snoopy/.test(t), t); }
    await m.page.click(m.sel('Teste Muda') + ' button[data-snoopy-item]'); await m.modal('Já lancei no Snoopy');
    { const t = await esperaSnoopy(m, 'Teste Muda', /lançado por Amanda/); assert.ok(/lançado por Amanda/.test(t), t); }
    assert.strictEqual(m.erros.length, 0, m.erros.join(' | '));
  } finally { await m.fechar(); }
}, 'C');
prova('P20', 'loja com o Snoopy já confirmado: trocar para casa passa pelo cartaz e a linha sai (o histórico do Snoopy fica); trocar para bolsa é barrado (AC9.2, AC9.3)', async () => {
  const m = await mundo({ filhots: [{ n: 'Teste Conf', tutor: 'Tutor Conf', tel: '(31) 99999-0001', cuidados: ['verm_p'] }, { n: 'Teste Conf2', tutor: 'Tutor Conf2', tel: '(31) 99999-0002', cuidados: ['verm_p'] }] });
  try {
    for (const n of ['Teste Conf', 'Teste Conf2']) await m.tocar(n, 'verm_p', 'autorizar_loja');
    for (const n of ['Teste Conf', 'Teste Conf2']) await esperaSnoopy(m, n, /Já lancei no Snoopy/);
    for (const n of ['Teste Conf', 'Teste Conf2']) { await m.page.click(m.sel(n) + ' button[data-snoopy-item]'); await m.modal('Já lancei no Snoopy'); assert.ok(/lançado por Amanda/.test(await esperaSnoopy(m, n, /lançado por Amanda/))); }
    await m.zerarLog(); await m.page.click(m.botao('Teste Conf2', 'verm_p', 'autorizar_bolsa')); await m.quieto();
    assert.ok(/Esta linha já foi lançada no Snoopy; para mudar, desfaça antes a confirmação do Snoopy\./.test(await m.texto('Teste Conf2')), await m.texto('Teste Conf2'));
    assert.deepStrictEqual((await m.log()).gravacoes, [], 'barrado: nada gravado');
    await m.page.click(m.botao('Teste Conf', 'verm_p', 'autorizar_externo'));
    const tela = await cartaz(m); assert.ok(/A confirmação do Snoopy continua no histórico do Snoopy, mas a linha sai\./.test(tela), tela.slice(-700));
    await fecharCartaz(m); await esperar(100);
    const l = await linhasDoDia(m, 'vermifugo'); assert.strictEqual(Object.keys(l).length, 1, 'só a linha do outro FILHOt'); assert.strictEqual(l[Object.keys(l)[0]].chave, m.dcDe('Teste Conf2'));
    const eventos = await m.ev((dia) => { const d = window.__banco.ler('daycare/snoopy/' + dia + '/vermifugo') || {}; return Object.values(d).map((x) => Object.keys(x.eventos).length); }, DIA);
    assert.deepStrictEqual(eventos.sort(), [1, 1], 'a confirmação continua no histórico do Snoopy');
  } finally { await m.fechar(); }
}, 'C');
prova('P20', 'falha na metade: a tela diz o que ficou feito e o que não, e a tentativa seguinte completa sem duplicar (AC9.4)', async () => {
  const m = await mundo({ filhots: [{ n: 'Teste Meio', tutor: 'Tutor Meio', tel: '(31) 99999-0001', cuidados: ['verm_p'] }] });
  try {
    await m.tocar('Teste Meio', 'verm_p', 'autorizar_bolsa');
    await m.ev(() => { window.__banco.falharEscrita(['daycare/dashboard/']); });
    await m.page.click(m.botao('Teste Meio', 'verm_p', 'autorizar_externo')); await cartaz(m);
    const corpo = await m.ev(() => document.body.innerText);
    assert.ok(/A resposta foi trocada para «Vai fazer em casa»\. Mas a linha do Day Care ainda não saiu/.test(corpo), corpo.slice(-600));
    await fecharCartaz(m); await esperar(100);
    const reg = await regDo(m, 'Teste Meio'); assert.strictEqual(Object.values(reg.respostasEscopo49.porCiclo)[0].origem, 'externo', 'a resposta foi trocada');
    assert.strictEqual(Object.keys(await linhasDoDia(m, 'vermifugo')).length, 1, 'a linha ainda está lá');
    const t = await m.texto('Teste Meio'); assert.ok(/O cuidado ainda está na lista do Day Care: a troca não terminou\./.test(t) && /Tirar da lista do Day Care/.test(t), t);
    await m.ev(() => { window.__banco.falharEscrita([]); });
    await m.page.click(m.sel('Teste Meio') + ' [data-zt694-acao="completar"]'); await cartaz(m, { botao: 'Tirar da lista' }); await fecharCartaz(m); await esperar(100);
    assert.deepStrictEqual(Object.keys(await linhasDoDia(m, 'vermifugo')), [], 'completou');
    assert.strictEqual((await tarefaDe(m, 'Teste Meio', 'verm_p')).estado, 'invalida');
    assert.strictEqual(Object.values((await regDo(m, 'Teste Meio')).respostasEscopo49.porCiclo)[0].revisao, 1, 'a resposta não foi regravada');
    assert.ok(!/ainda está na lista do Day Care/.test(await m.texto('Teste Meio')));
  } finally { await m.fechar(); }
}, 'C');
prova('P20', 'alteração de hora pendente na linha barra a troca; sem papel para o cartaz a troca é barrada sem cartaz (AC9.6a)', async () => {
  const m = await mundo({ filhots: [{ n: 'Teste Pend', tutor: 'Tutor Pend', tel: '(31) 99999-0001', cuidados: ['verm_p'] }] });
  try {
    await m.tocar('Teste Pend', 'verm_p', 'autorizar_bolsa');
    await m.ev(([dia, item, id]) => { const p = 'daycare/dashboard/' + dia + '/' + item + '/' + id; const l = window.__banco.ler(p); l.edicao_pendente = true; window.__banco.poe(p, l); }, [DIA, 'vermifugo', Object.keys(await linhasDoDia(m, 'vermifugo'))[0]]);
    await m.zerarLog(); await m.page.click(m.botao('Teste Pend', 'verm_p', 'autorizar_externo')); await m.quieto();
    assert.ok(/Conclua ou reenvie a alteração de hora antes de tirar este lançamento/.test(await m.texto('Teste Pend')) && !(await m.ev(() => !!document.querySelector('#corrMotivo'))));
    assert.deepStrictEqual((await m.log()).gravacoes, []);
    await m.ev(([dia, item, id]) => { const p = 'daycare/dashboard/' + dia + '/' + item + '/' + id; const l = window.__banco.ler(p); delete l.edicao_pendente; window.__banco.poe(p, l); window.podePapel = function () { return false; }; }, [DIA, 'vermifugo', Object.keys(await linhasDoDia(m, 'vermifugo'))[0]]);
    await m.page.click(m.botao('Teste Pend', 'verm_p', 'autorizar_externo')); await m.quieto();
    assert.ok(/senha de quem tem acesso a este painel/.test(await m.texto('Teste Pend')) && !(await m.ev(() => !!document.querySelector('#corrMotivo'))), await m.texto('Teste Pend'));
    assert.deepStrictEqual((await m.log()).gravacoes, [], 'sem papel: nada gravado');
  } finally { await m.fechar(); }
}, 'C');

prova('P20', 'pendência de prevenção (6.63) ligada à linha: o cartaz diz que ela volta a abrir e, depois de tirar a linha, ela reabre; sem pendência ligada o cartaz não promete nada (AC9.6a)', async () => {
  const m = await mundo({ filhots: [{ n: 'Teste Lig', tutor: 'Tutor Lig', tel: '(31) 99999-0001', cuidados: ['verm_p'] }, { n: 'Teste Sem', tutor: 'Tutor Sem', tel: '(31) 99999-0002', cuidados: ['verm_p'] }] });
  try {
    await m.tocar('Teste Lig', 'verm_p', 'autorizar_bolsa'); await m.tocar('Teste Sem', 'verm_p', 'autorizar_bolsa');
    const ids = Object.keys(await linhasDoDia(m, 'vermifugo')), linhas = await linhasDoDia(m, 'vermifugo'), idLig = ids.filter((i) => linhas[i].chave === m.dcDe('Teste Lig'))[0];
    assert.strictEqual(await m.ev(() => pendItemConta('vermifugo')), true, 'o vermífugo é item de pendência de prevenção');
    // sem pendência ligada: o cartaz não promete reabrir nada
    await m.page.click(m.botao('Teste Sem', 'verm_p', 'autorizar_externo')); const t1 = await cartaz(m, { cancelar: true }); assert.ok(!/volta a ficar aberta/.test(t1), 'sem pendência ligada o cartaz não promete nada');
    // com uma pendência resolvida por esta linha (marca `resolvido_lanc`): a frase e a reabertura
    await m.ev(([chave, id, dia]) => { window.__banco.poe('daycare/pendencias/' + chave + '/vermifugo', { status: 'resolvida', resolvido_dia: dia, resolvido_lanc: { dia: dia, item: 'vermifugo', id: id }, nome: 'Teste Lig', base: 'Teste Lig/SRD', valor: 'Teste Lig/SRD' }); }, [m.dcDe('Teste Lig'), idLig, DIA]);
    await m.page.click(m.botao('Teste Lig', 'verm_p', 'autorizar_externo')); const t2 = await cartaz(m); await fecharCartaz(m); await esperar(300);
    assert.ok(/A pendência de .* de Teste Lig, resolvida por este lançamento, volta a ficar aberta\./.test(t2), t2.slice(-800));
    assert.strictEqual((await m.ler('daycare/pendencias/' + m.dcDe('Teste Lig') + '/vermifugo')).status, 'aberta', 'a pendência reabriu');
    assert.ok(!(idLig in await linhasDoDia(m, 'vermifugo')), 'e a linha saiu');
  } finally { await m.fechar(); }
}, 'C');
prova('P21', 'troca simples (casa ↔ não respondeu): 1 toque, com autoria, «antes → depois» na auditoria, histórico guarda todas, o retorno pendente sai do grupo (AC9.1, AC9.7)', async () => {
  const m = await mundo({ filhots: [{ n: 'Teste Simples', tutor: 'Tutor Simples', tel: '(31) 99999-0001', cuidados: ['verm_p'] }, { n: 'Teste Humano', tutor: 'Tutor Humano', tel: '(31) 99999-0002', modo: 'humano', cuidados: ['verm_p'] }] });
  try {
    await m.tocar('Teste Simples', 'verm_p', 'autorizar_externo'); await m.tocar('Teste Simples', 'verm_p', 'aguardar');
    const t = await m.texto('Teste Simples'); assert.ok(/Trocada de Vai fazer em casa para Não respondeu por Amanda às \d\d:\d\d\./.test(t), t);
    const aud = await m.ev((dia) => Object.values(window.__banco.ler('daycare/auditoria/' + dia) || {}).map((x) => x.detalhe), DIA);
    assert.ok(aud.some((x) => /Teste Simples — Vermífugo: de «Vai fazer em casa» para «Não respondeu»/.test(x)), aud.join(' | '));
    await m.tocar('Teste Simples', 'verm_p', 'autorizar_externo');
    const reg = await regDo(m, 'Teste Simples'); assert.strictEqual(reg.historicoRespostas49.length, 3, 'o histórico guarda todas as respostas'); assert.strictEqual(Object.values(reg.respostasEscopo49.porCiclo)[0].revisao, 2);
    // contato humano: «Não respondeu» cria o retorno pendente; trocar por outra resposta o tira do grupo das 13h30
    await m.tocar('Teste Humano', 'verm_p', 'aguardar'); assert.ok(/Retorno às 13h30: 1/.test(await m.ev(() => document.querySelector('[data-zt694-topo]').textContent)));
    await m.tocar('Teste Humano', 'verm_p', 'autorizar_externo');
    const ch = Object.values((await regDo(m, 'Teste Humano')).contatosHumanos89)[0]; assert.ok(ch.tipo === 'contato_humano' && ch.status === 'feito', 'o retorno pendente deixou de valer: ' + JSON.stringify(ch));
    assert.ok(!/Retorno às 13h30: [1-9]/.test(await m.ev(() => document.querySelector('[data-zt694-topo]').textContent)));
    assert.strictEqual(m.erros.length, 0, m.erros.join(' | '));
  } finally { await m.fechar(); }
}, 'C');

prova('P22', 'cuidado em execução ou já aplicado: a troca é barrada com a frase e nada é gravado (AC9.5)', async () => {
  for (const estado of ['emexecucao', 'realizado']) {
    const m = await mundo({ filhots: [{ n: 'Teste Aplicado', tutor: 'Tutor Aplicado', tel: '(31) 99999-0001', cuidados: ['verm_p'] }], respostas: [{ pet: 0, k: 'verm_p', valor: 'autorizar_bolsa', tarefa: estado }] });
    try {
      await m.zerarLog(); await m.page.click(m.botao('Teste Aplicado', 'verm_p', 'autorizar_externo')); await m.quieto();
      assert.ok(/Este cuidado já foi aplicado\. A correção é feita na ficha de Prevenção do FILHOt\./.test(await m.texto('Teste Aplicado')), estado + ': ' + await m.texto('Teste Aplicado'));
      assert.deepStrictEqual((await m.log()).gravacoes, [], estado + ': nada gravado');
      assert.strictEqual(Object.values((await regDo(m, 'Teste Aplicado')).respostasEscopo49.porCiclo)[0].origem, 'bolsa');
    } finally { await m.fechar(); }
  }
}, 'C');

prova('P23', 'conflito: outra pessoa respondeu no meio → «{nome} respondeu agora: {resposta}. Nada foi trocado.» e só aquela linha se atualiza (AC9.6)', async () => {
  const m = await mundo({ filhots: [{ n: 'Teste Conf', tutor: 'Tutor Conf', tel: '(31) 99999-0001', cuidados: ['verm_p'] }, { n: 'Teste Outro', tutor: 'Tutor Outro', tel: '(31) 99999-0002', cuidados: ['verm_p'] }] });
  try {
    await m.ev(([dia, dc, ck, gk]) => { const p = 'daycare/vencimentos/' + dia + '/' + dc, k = ZeluzResposta88.codificarChave(ck); window.__banco.poe(p, { respostasEscopo49: { porCiclo: { [k]: { cycleKey: ck, itemK: 'verm_p', groupKey: gk, respostaId: 'r88_outra', decisao: 'autorizar', origem: 'externo', onde: '', humanoId: 'bia', humanoNome: 'Bia', ts: Date.now(), revisao: 0, estado: 'decidido', baseOperacional88: {} } }, porResposta: {} }, historicoRespostas49: [] }); },
      [DIA, m.dcDe('Teste Conf'), m.cicloDe('Teste Conf', 'verm_p'), m.info[0].groupKey]);
    const outroAntes = await m.texto('Teste Outro');
    await m.page.click(m.botao('Teste Conf', 'verm_p', 'autorizar_bolsa')); await m.quieto();
    const t = await m.texto('Teste Conf'); assert.ok(/Bia respondeu agora: Vai fazer em casa\. Nada foi trocado\./.test(t), t);
    assert.strictEqual(Object.values((await regDo(m, 'Teste Conf')).respostasEscopo49.porCiclo)[0].origem, 'externo', 'nada foi trocado');
    assert.ok(/Vai fazer em casa · Bia/.test(t), 'a linha se atualizou com a resposta da outra pessoa');
    assert.strictEqual(await m.texto('Teste Outro'), outroAntes, 'só aquela linha se atualiza');
    assert.strictEqual(Object.keys(await linhasDoDia(m, 'vermifugo')).length, 0);
  } finally { await m.fechar(); }
}, 'C');

// ================================================================= P19 — 13h30 e atualização geral com a tela aberta (AC8.5, AC10.4)
const espiarNucleo = (m) => m.ev(() => { window.__api = { listar: 0, um: 0, pres: {} }; const c0 = ZelozinhaContatosHoje89.criar; ZelozinhaContatosHoje89.criar = function () { const a = c0.apply(this, arguments), l = a.listar, u = a.atualizarUm, pu = a.presencaUm; a.listar = function () { window.__api.listar++; return l.apply(this, arguments); }; a.atualizarUm = function () { window.__api.um++; return u.apply(this, arguments); }; if (pu) a.presencaUm = function (dc) { window.__api.pres[dc] = (window.__api.pres[dc] || 0) + 1; return pu.apply(this, arguments); }; return a; }; });
const amostrador = (m) => m.ev(() => { window.__q = { flash: false, hmin: 1e9, quadros: 0 }; const f = () => { const e = document.querySelector('[data-z89-contatos]'); if (e && /Conferindo/.test(e.textContent)) window.__q.flash = true; window.__q.hmin = Math.min(window.__q.hmin, document.documentElement.scrollHeight); window.__q.quadros++; window.__q.id = requestAnimationFrame(f); }; f(); });
const irPara = async (m, nome, folga) => { const y = await m.ev(([s, f]) => { const e = document.querySelector(s), de = document.documentElement, sb = de.style.scrollBehavior; de.style.scrollBehavior = 'auto'; try { window.scrollTo(0, e.getBoundingClientRect().top + window.pageYOffset - (f || 150)); } finally { de.style.scrollBehavior = sb; } return window.pageYOffset; }, [m.sel(nome), folga]); await esperar(60); return y; };
const espiarAtualizacoes = (m) => m.ev(() => { window.__t = { atual: 0, acomp: 0, desp: 0 }; const a = window.zPainel44Atualizar, b = window.zPainel44AtualizarAcompanhamento, c = window.zPainel44AtualizarDespacho80; window.zPainel44Atualizar = function () { window.__t.atual++; return a.apply(this, arguments); }; window.zPainel44AtualizarAcompanhamento = function () { window.__t.acomp++; return b.apply(this, arguments); }; window.zPainel44AtualizarDespacho80 = function () { window.__t.desp++; return c.apply(this, arguments); }; });
const alturaY = (m) => m.ev(() => ({ h: document.documentElement.scrollHeight, y: Math.round(window.pageYOffset) }));
prova('P19', 'às 13h30 com a tela aberta o retorno aparece sem reler a lista e sem mudar a rolagem (±2 px) (AC8.5)', async () => {
  const fs12 = []; for (let i = 0; i < 12; i++) fs12.push({ n: nomeTeste(i), tutor: 'Tutor ' + nomeTeste(i), tel: '(31) 99999-' + (3000 + i), cuidados: ['verm_p'] });
  const m = await mundo({ filhots: fs12, respostas: [{ pet: 2, k: 'verm_p', valor: 'aguardar' }] }, { relogio: '2026-10-20T13:29:59-03:00', abrir: false });
  try {
    await espiarNucleo(m); await m.abrirTela(); await m.quieto(300); await esperar(2300); await m.quieto(300);
    assert.deepStrictEqual(await m.ev(() => [...document.querySelectorAll('[data-zt694-grupo]')].map((e) => e.textContent)), ['Falta responder', 'Retorno às 13h30']);
    assert.strictEqual(await m.ev((s) => document.querySelectorAll(s + ' [data-zt694-copia]').length, m.sel(nomeTeste(2))), 0, 'às 13h29min59s ainda não há a caixa do texto do retorno');
    await irPara(m, nomeTeste(8)); const topo8 = () => m.ev((s) => Math.round(document.querySelector(s).getBoundingClientRect().top), m.sel(nomeTeste(8))); const antes = await alturaY(m), vista0 = await topo8(), lidas0 = (await m.log()).leituras.length, api0 = await m.ev(() => window.__api.listar);
    await amostrador(m); await espiarAtualizacoes(m); await m.ev(() => { zPainel44ProgramarRetorno(); });
    await m.page.clock.setFixedTime('2026-10-20T13:30:00-03:00'); await esperar(1500);
    const depois = await alturaY(m), q = await m.ev(() => window.__q);
    assert.deepStrictEqual(await m.ev(() => [...document.querySelectorAll('[data-zt694-grupo]')].map((e) => e.textContent)), ['Falta responder', 'Hora de retomar o contato'], 'o retorno aparece (rótulo e topo)');
    assert.ok(/Retomar o contato: 1/.test(await m.ev(() => document.querySelector('[data-zt694-topo]').textContent)));
    assert.ok(/Hora de retomar o contato \(retorno humano das 13h30\)/.test(await m.texto(nomeTeste(2))));
    assert.deepStrictEqual(await m.ev((s) => [...document.querySelectorAll(s + ' [data-zt694-texto]')].map((e) => e.textContent), m.sel(nomeTeste(2))), [RETORNO('Tutor ' + nomeTeste(2), FRASE_VERM, nomeTeste(2))], 'às 13h30 a caixa com o texto do retorno entra na linha, sem reler nada');
    assert.ok(Math.abs(depois.y - antes.y) <= 2, 'a rolagem não mudou: ' + antes.y + ' → ' + depois.y); assert.ok(Math.abs((await topo8()) - vista0) <= 2, 'o FILHOt que a pessoa estava vendo ficou no mesmo lugar da tela'); assert.ok(depois.h >= antes.h - 8, 'a página não encolheu: ' + antes.h + ' → ' + depois.h);
    assert.strictEqual(await m.ev(() => window.__api.listar), api0, 'a lista não foi relida'); { const dk = m.dcDe(nomeTeste(2)), noPet = ['daycare/checkin-corpo/' + DIA + '/' + dk, 'daycare/checkout-corpo/' + DIA + '/' + dk];
      const novas = (await m.log()).leituras.slice(lidas0).filter((x) => /^(piloto59|daycare\/(cadastro|checkin-corpo|checkout-corpo|vencimentos|zelozinha-operacao|dashboard|snoopy|banho-falta))/.test(x.path));
      assert.deepStrictEqual(novas.filter((x) => noPet.indexOf(x.path) < 0), [], 'nenhuma leitura da lista nem do painel (os relógios do almoço e da auditoria do app não contam): ' + JSON.stringify(porNo(novas)));
      assert.deepStrictEqual(novas.map((x) => x.path).sort(), noPet, 'só a presença do FILHOt em «Não respondeu», conferida antes de o texto entrar: o check-in e o check-out dele, uma leitura de cada (M1)'); }
    assert.ok(!q.flash && q.quadros > 5, 'nenhum quadro com «Conferindo…»: ' + JSON.stringify(q));
    assert.deepStrictEqual(await m.ev(() => window.__t), { atual: 0, acomp: 1, desp: 0 }, 'às 13h30 com a tela aberta o temporizador do app atualiza só o acompanhamento (sem leitura), não o painel dos envios');
    assert.strictEqual(m.erros.length, 0, m.erros.join(' | '));
  } finally { await m.fechar(); }
}, 'C');
prova('P19', 'sem a tela aberta o temporizador das 13h30 atualiza o painel inteiro como antes, e a virada do dia atualiza sempre o painel inteiro (AC8.5)', async () => {
  for (const [rel, depois, quem] of [['2026-10-20T13:29:59-03:00', '2026-10-20T13:30:00-03:00', '13h30'], ['2026-10-20T23:59:59-03:00', '2026-10-21T00:00:01-03:00', 'virada']]) {
    const m = await mundo({ filhots: [{ n: nomeTeste(0), tutor: 'Tutor 0', tel: '(31) 99999-3000', cuidados: ['verm_p'] }] }, { relogio: rel, abrir: false });
    try {
      await m.quieto(300); await esperar(2300); await m.quieto(300);
      await espiarAtualizacoes(m); await m.ev(() => { zPainel44ProgramarRetorno(); });
      assert.strictEqual(await m.ev(() => document.querySelectorAll('[data-zt694-ok]').length), 0, 'a tela nova não está aberta');
      await m.page.clock.setFixedTime(depois); await esperar(1800);
      const t = await m.ev(() => window.__t);
      assert.ok(t.atual >= 1, quem + ': o painel inteiro é atualizado (' + JSON.stringify(t) + ')');
    } finally { await m.fechar(); }
  }
}, 'C');
prova('P19', 'a atualização geral (projeção do serviço, «Atualizar envios») guarda as linhas abertas e a rolagem; só relê quando algo mudou (AC10.4)', async () => {
  const fs12 = []; for (let i = 0; i < 12; i++) fs12.push({ n: nomeTeste(i), tutor: 'Tutor ' + nomeTeste(i), tel: '(31) 99999-' + (3000 + i), cuidados: ['verm_p'] });
  const m = await mundo({ filhots: fs12 }, { abrir: false });
  try {
    await espiarNucleo(m); await m.abrirTela(); await m.quieto(300); await esperar(2300); await m.quieto(300);
    await m.page.click(m.sel(nomeTeste(7)) + ' .zt694-msg > summary'); await irPara(m, nomeTeste(7), 120); const antes = await alturaY(m);
    const lidoCom = () => m.ev(() => window.__api.listar); const l0 = await lidoCom();
    const aberta = () => m.ev((s) => document.querySelector(s + ' .zt694-msg').open, m.sel(nomeTeste(7)));
    await amostrador(m);
    // 1) o painel refaz o próprio HTML (acontece a cada atualização, a cada virada de hora, a cada resposta pelo caminho de fora)
    await m.ev(() => { zPainel44AtualizarDespacho80(); }); await m.quieto(400);
    let d = await alturaY(m); assert.ok(Math.abs(d.y - antes.y) <= 2 && Math.abs(d.h - antes.h) <= 8, 'tela refeita pelo painel: ' + JSON.stringify([antes, d]));
    assert.strictEqual(await aberta(), true, 'a linha aberta continua aberta'); assert.strictEqual(await lidoCom(), l0, 'sem leitura quando nada mudou');
    // 2) o serviço publica outra projeção: a lista é relida, e o que a pessoa via fica onde estava
    await m.ev(() => { Z44_DISPATCH80.dados.atualizadoEm = new Date(Date.now() + 5000).toISOString(); zPainel44Atualizar(); }); await ate(async () => (await lidoCom()) >= l0 + 1); await m.quieto(500);
    d = await alturaY(m); assert.ok(Math.abs(d.y - antes.y) <= 2, 'projeção nova: a rolagem fica (' + antes.y + ' → ' + d.y + ')'); assert.strictEqual(await aberta(), true);
    assert.strictEqual(await lidoCom(), l0 + 1, 'projeção nova: uma releitura');
    // 3) «Atualizar envios»
    await m.ev(() => { document.querySelector('[data-z44-reler]').click(); }); await ate(async () => (await lidoCom()) >= l0 + 2); await m.quieto(500); d = await alturaY(m);   // toque no DOM: o clique do Playwright rolaria a página até o botão e a prova mediria a rolagem dele, não a do app
    assert.ok(Math.abs(d.y - antes.y) <= 2 && (await aberta()), 'Atualizar envios: ' + JSON.stringify(d) + ' (antes ' + JSON.stringify(antes) + ')'); assert.strictEqual(await lidoCom(), l0 + 2);
    const q = await m.ev(() => window.__q); assert.ok(!q.flash, 'nenhum quadro com «Conferindo…»: ' + JSON.stringify(q)); assert.ok(q.hmin >= antes.h - 8, 'a página não encolheu em nenhum quadro: ' + q.hmin + ' vs ' + antes.h);
    assert.strictEqual(m.erros.length, 0, m.erros.join(' | '));
  } finally { await m.fechar(); }
}, 'C');

// ================================================================= P24 — sem salto de tela (AC10.1, AC10.2)
prova('P24', 'um toque redesenha só a linha tocada: durante o salvamento a página não encolhe (±8 px) nem rola (±2 px), o botão diz «Salvando…» e o toque duplo grava uma vez (AC10.1, AC10.2, AC10.7)', async () => {
  const fs12 = []; for (let i = 0; i < 12; i++) fs12.push({ n: nomeTeste(i), tutor: 'Tutor ' + nomeTeste(i), tel: '(31) 99999-' + (3000 + i), cuidados: ['verm_p'] });
  const m = await mundo({ filhots: fs12 }, { abrir: false, latencia: 45 });
  try {
    await espiarNucleo(m); await m.abrirTela(); await m.quieto(300); await esperar(2300); await m.quieto(300);
    await m.ev(() => { window.__ad = 0; const o = window.zPainel44AtualizarDespacho80; window.zPainel44AtualizarDespacho80 = function () { window.__ad++; return o.apply(this, arguments); }; window.__reg = 0; const r = ZeluzRespostaApp88.registrar; ZeluzRespostaApp88.registrar = function () { window.__reg++; return r.apply(this, arguments); }; });
    await irPara(m, nomeTeste(6), 200); const antes = await alturaY(m), listar0 = await m.ev(() => window.__api.listar);
    await m.ev((s) => { window.__amostras = []; const b = document.querySelector(s); b.click(); b.click(); const t0 = performance.now(); const f = () => { const row = document.querySelector(s.split(' ')[0]); window.__amostras.push({ t: Math.round(performance.now() - t0), h: document.documentElement.scrollHeight, y: Math.round(window.pageYOffset), salvando: !!(row && /Salvando/.test(row.textContent)), conferindo: /Conferindo presenças/.test(document.body.innerText), desl: row ? [...row.querySelectorAll('[data-zt694-care]')[0].querySelectorAll('[data-zt694-acao="resp"]')].every((x) => x.disabled) : null }); if (performance.now() - t0 < 2500) setTimeout(f, 60); }; f(); }, m.botao(nomeTeste(6), 'verm_p', 'autorizar_bolsa'));
    await esperar(2700); await m.quieto(200);
    const am = await m.ev(() => window.__amostras), salvando = am.filter((a) => a.salvando);
    assert.ok(salvando.length >= 3, 'houve um intervalo de salvamento observável: ' + salvando.length);
    salvando.forEach((a) => { assert.ok(Math.abs(a.h - antes.h) <= 8, 'a página encolheu/cresceu durante o salvamento: ' + antes.h + ' → ' + a.h); assert.ok(Math.abs(a.y - antes.y) <= 2, 'a rolagem mudou durante o salvamento: ' + antes.y + ' → ' + a.y); assert.ok(a.desl === true, 'os quatro botões do cuidado desligados até a resposta'); });
    assert.ok(am.every((a) => !a.conferindo), 'nunca «Conferindo presenças…»');
    const depois = await alturaY(m); assert.ok(Math.abs(depois.y - antes.y) <= 2, 'a rolagem no fim: ' + antes.y + ' → ' + depois.y);
    assert.strictEqual(await m.ev(() => window.__reg), 1, 'toque duplo: uma gravação só');
    assert.strictEqual(await m.ev(() => window.__ad), 0, 'o `registrar` verdadeiro não refaz o tema do painel quando a tela nova o chama');
    assert.strictEqual(await m.ev(() => window.__api.listar), listar0, 'e ninguém relê todos os FILHOts');
    assert.ok(/Mandou na bolsa · Amanda/.test(await m.texto(nomeTeste(6))));
    assert.strictEqual(m.erros.length, 0, m.erros.join(' | '));
  } finally { await m.fechar(); }
}, 'C');
prova('P24', 'o botão tocado mostra «Salvando…» no mesmo quadro (AC10.2)', async () => {
  const m = await mundo({ filhots: [{ n: 'Teste Salva', tutor: 'Tutor Salva', tel: '(31) 99999-0001', cuidados: ['verm_p'] }] }, { latencia: 60 });
  try {
    await m.ev((s) => { const b = document.querySelector(s); b.click(); window.__rotulo = b.textContent; }, m.botao('Teste Salva', 'verm_p', 'autorizar_bolsa'));
    assert.strictEqual(await m.ev(() => window.__rotulo), 'Salvando…', 'no mesmo quadro do toque'); await m.quieto();
  } finally { await m.fechar(); }
}, 'C');

// ================================================================= P25 — leituras por toque (AC10.3)
/* Leituras do app que não vêm do toque: relógios próprios dele (almoço, atividade, avisos, aniversário, turma, limpeza de fotos, configuração). Ficam de fora da conta. */
const RUIDO_DO_APP = /^(daycare\/(config\/ponte-planilha|almoco|atividade|avisos-comida|avisos-telegram-comida|aniversario-enviado|turma|limpeza-fotos)|auaulandia)(\/|$)/;
const porNo = (leituras) => leituras.filter((x) => !RUIDO_DO_APP.test(x.path)).reduce((a, x) => { const k = x.path.replace(/\d{4}-\d{2}-\d{2}/, 'DIA').replace(/teste-\d+__tutor-teste-\d+/, 'PET').replace(/teste \d+__tutor teste \d+/, 'PET').replace(/conferenciaEnvios86\/[0-9a-f]+/, 'conferenciaEnvios86/H'); a[k] = (a[k] || 0) + 1; return a; }, {});
const somaNos = (o) => Object.keys(o).reduce((t, k) => t + o[k], 0);
/* abre a tela com `n` presentes, espera o app acalmar (o que ele agenda ao abrir) e mede UM toque: `preparo(m)` roda antes (não conta), `toque(m)` é o medido.
   Na base (b044ecd) a tela antiga refaz o próprio conteúdo sem parar na máquina de teste («Conferindo os peludinhos…»): lá o toque é feito no instante em que o botão aparece. */
/* a tela antiga, com a máquina muito ocupada, às vezes não chega a mostrar o botão (ela é refeita pelo app antes de terminar de ler): a medida da base tenta até 3 vezes; a do toque novo não depende disso */
async function leiturasDoToque(n, toque, preparo, app) {
  let ultimo = null;
  for (let k = 0; k < (app ? 3 : 1); k++) { try { return await leiturasDoToque1(n, toque, preparo, app); } catch (e) { ultimo = e; if (!/a tela da base mostrou o botão/.test(String(e && e.message))) throw e; } }
  throw ultimo;
}
async function leiturasDoToque1(n, toque, preparo, app) {
  const fs = []; for (let i = 0; i < n; i++) fs.push({ n: nomeTeste(i), tutor: 'Tutor ' + nomeTeste(i), tel: '(31) 99999-' + (4000 + i), cuidados: ['verm_p'] });
  const m = await mundo({ filhots: fs }, { abrir: false, app: app });
  try {
    if (app) {
      /* a tela antiga só existe por instantes: um observador toca no botão NO MESMO instante em que ele aparece (não há corrida com a máquina ocupada) */
      await m.ev(() => { window.__tocou = false; const obs = new MutationObserver(() => { const b = document.querySelector('[data-z89-contatos] details.z89-card button[value="autorizar_bolsa"]'); if (!b || window.__tocou) return; window.__tocou = true; obs.disconnect(); window.__banco.log.leituras.length = 0; window.__banco.log.gravacoes.length = 0; b.closest('details').open = true; b.click(); }); obs.observe(document.body, { childList: true, subtree: true }); abrirItemDoMenu('painel-amanda'); });
      const tocou = await ate(() => m.ev(() => window.__tocou), 20000);
      assert.ok(tocou, 'a tela da base mostrou o botão');
      /* a tela antiga lê por eventos e por temporizadores: espera pelo menos 3,5 s e, depois disso, até o banco ficar quieto por 2 s (no máximo 12 s); com a máquina ocupada a contagem não fica menor do que seria */
      await esperar(3500); { let ult = -1, quieto = 0; for (let t = 0; t < 34 && quieto < 8; t++) { const n = await m.ev(() => window.__banco.log.leituras.length); if (n === ult) quieto++; else quieto = 0; ult = n; await esperar(250); } }
      const lb = await m.log(), nob = porNo(lb.leituras);
      return { total: somaNos(nob), porNo: nob, erros: m.erros.slice(), gravou: lb.gravacoes.length };
    }
    await espiarNucleo(m); await m.abrirTela(); await m.quieto(300);
    if (preparo) { await preparo(m); }
    await esperar(2300); await m.quieto(300);
    await m.ev(() => { window.__ad = 0; const o = window.zPainel44AtualizarDespacho80; window.zPainel44AtualizarDespacho80 = function () { window.__ad++; return o.apply(this, arguments); }; window.__z = 0; const z = window.z89Render104; window.z89Render104 = function () { window.__z++; return z.apply(this, arguments); }; window.__bf = 0; const bf = window.banhoFaltaAgendar; window.banhoFaltaAgendar = function () { window.__bf++; return bf.apply(this, arguments); }; window.__api.listar = 0; window.__api.um = 0; });
    await m.zerarLog();
    await toque(m);
    await m.quieto(400); await esperar(2000);
    const l = await m.log(), no = porNo(l.leituras);
    return { total: somaNos(no), porNo: no, ad: await m.ev(() => window.__ad), z: await m.ev(() => window.__z), bf: await m.ev(() => window.__bf), api: await m.ev(() => window.__api), erros: m.erros.slice(), gravou: l.gravacoes.length };
  } finally { await m.fechar(); }
}
const tocarBolsa = (nome) => (m) => m.page.click(m.botao(nome, 'verm_p', 'autorizar_bolsa'));
const tocarCasa = (nome) => (m) => m.page.click(m.botao(nome, 'verm_p', 'autorizar_externo'));
const tocarLoja = (nome) => (m) => m.page.click(m.botao(nome, 'verm_p', 'autorizar_loja'));
const tocarEscolha = (nome) => async (m) => { const c = m.cuidadoSel(nome, 'verm_p'); if (!(await m.ev((s) => document.querySelector(s + ' [data-zt694-esc]').open, c))) await m.page.click(c + ' [data-zt694-esc] > summary'); await m.page.click(c + ' [data-zt694-acao="esc"][data-zt694-campo="onde"][data-zt694-valor="BANHO"]'); };
const igualarToques = (a, b, rotulo) => {
  assert.deepStrictEqual(a.erros, [], rotulo + ' (10): ' + a.erros.join(' | ')); assert.deepStrictEqual(b.erros, [], rotulo + ' (30): ' + b.erros.join(' | '));
  assert.ok(a.gravou > 0 && b.gravou > 0, rotulo + ': o toque gravou');
  assert.deepStrictEqual(a.porNo, b.porNo, rotulo + ': as leituras do toque com 10 e com 30 presentes têm de ser as mesmas');
  assert.strictEqual(a.total, b.total, rotulo);
  assert.strictEqual(a.api.listar, 0, rotulo + ': nenhum `listar` pelo toque'); assert.strictEqual(b.api.listar, 0); assert.strictEqual(a.api.um, 1, rotulo + ': uma linha só relida pelo núcleo'); assert.strictEqual(b.api.um, 1);
  assert.strictEqual(a.ad, 0, rotulo + ': o tema do painel não é refeito'); assert.strictEqual(a.z, 0, rotulo + ': o z89Render104 não é chamado pelo toque'); assert.strictEqual(a.bf, 0, rotulo + ': o app não refaz as próprias telas por causa do toque'); assert.strictEqual(b.bf, 0);
};
prova('P25', 'o primeiro toque «Mandou na bolsa» lê o mesmo número de vezes com 10 e com 30 presentes, e não relê a lista, o dia nem o painel (AC10.3)', async () => {
  const a = await leiturasDoToque(10, tocarBolsa(nomeTeste(0))), b = await leiturasDoToque(30, tocarBolsa(nomeTeste(0)));
  igualarToques(a, b, 'bolsa');
  assert.ok(!Object.keys(a.porNo).some((k) => /^daycare\/(dashboard|snoopy)\/DIA$/.test(k)), 'o toque de bolsa não lê o dia inteiro: ' + JSON.stringify(a.porNo));
}, 'C');
prova('P25', '«Vai fazer em casa» e a escolha de «onde» também lêem o mesmo com 10 e com 30 presentes (AC10.3)', async () => {
  const casa10 = await leiturasDoToque(10, tocarCasa(nomeTeste(1))), casa30 = await leiturasDoToque(30, tocarCasa(nomeTeste(1)));
  igualarToques(casa10, casa30, 'casa');
  const prep = async (m) => { await m.page.click(m.botao(nomeTeste(0), 'verm_p', 'autorizar_bolsa')); await m.quieto(300); };
  const esc10 = await leiturasDoToque(10, tocarEscolha(nomeTeste(0)), prep), esc30 = await leiturasDoToque(30, tocarEscolha(nomeTeste(0)), prep);
  assert.deepStrictEqual(esc10.erros, [], esc10.erros.join(' | ')); assert.deepStrictEqual(esc10.porNo, esc30.porNo, 'escolha: as leituras com 10 e com 30'); assert.ok(esc10.gravou > 0);
  assert.strictEqual(esc10.ad, 0); assert.strictEqual(esc10.z, 0); assert.strictEqual(esc10.bf, 0);
}, 'C');
prova('P25', 'o primeiro toque «Autorizou pegar na loja» lê o dia uma vez (o Snoopy exige, AC6.4); o segundo toque de loja não lê o dia e lê o mesmo com 10 e com 30 presentes (AC10.3)', async () => {
  const prep = async (m) => { await m.page.click(m.botao(nomeTeste(0), 'verm_p', 'autorizar_loja')); await m.quieto(500); await esperar(2300); };
  const a = await leiturasDoToque(10, tocarLoja(nomeTeste(1)), prep), b = await leiturasDoToque(30, tocarLoja(nomeTeste(1)), prep);
  igualarToques(a, b, 'segunda loja');
  assert.ok(!Object.keys(a.porNo).some((k) => /^daycare\/dashboard\/DIA$/.test(k)), 'o segundo toque não relê o dia: ' + JSON.stringify(a.porNo));
  const primeira = await leiturasDoToque(10, tocarLoja(nomeTeste(0)));
  assert.strictEqual(primeira.porNo['daycare/dashboard/DIA'], 1, 'o primeiro toque de loja lê o dia inteiro uma vez: ' + JSON.stringify(primeira.porNo));
  assert.strictEqual(primeira.porNo['daycare/snoopy/DIA'], 1, 'e o Snoopy do dia uma vez');
}, 'C');
prova('P25', 'o toque novo lê, com 1 presente, no máximo o que a base lê (AC10.3)', async () => {
  if (!APP_BASE) return;
  const base = await leiturasDoToque(1, null, null, APP_BASE);
  const novo = await leiturasDoToque(1, tocarBolsa(nomeTeste(0)));
  assert.ok(novo.total <= base.total, 'novo ' + novo.total + ' ≤ base ' + base.total + ' ' + JSON.stringify([novo.porNo, base.porNo]));
  const b10 = await leiturasDoToque(10, null, null, APP_BASE);
  const b30 = await leiturasDoToque(30, null, null, APP_BASE);
  assert.ok(b30.total > b10.total, 'na base as leituras crescem com os presentes (' + b10.total + ' → ' + b30.total + '): é o defeito que a story corrige');
  const n10 = await leiturasDoToque(10, tocarBolsa(nomeTeste(0))), n30 = await leiturasDoToque(30, tocarBolsa(nomeTeste(0)));
  console.log('      MEDIDA leituras por toque na base: 1=' + base.total + ' 10=' + b10.total + ' 30=' + b30.total + ' | novo: 1=' + novo.total + ' 10=' + n10.total + ' 30=' + n30.total);
}, 'C');

// ================================================================= P31 — o fim do `registrar` (AC10.7)
prova('P31', 'com a opção, o `registrar` grava e não refaz o painel; sem ela, chama o painel como hoje; o que é gravado é o mesmo (AC10.7)', async () => {
  async function rodar(opcao) {
    const m = await mundo({ filhots: [{ n: 'Teste Fim', tutor: 'Tutor Fim', tel: '(31) 99999-0001', cuidados: ['verm_p'] }] });
    try {
      await m.ev(() => { window.__ad = 0; const o = window.zPainel44AtualizarDespacho80; window.zPainel44AtualizarDespacho80 = function () { window.__ad++; return o.apply(this, arguments); }; });
      const r = await m.ev(async ([ck, gk, opcao]) => { const op = { petId: 'pet1' }; if (opcao) op.semAtualizarPainel = true; return ZeluzRespostaApp88.registrar(gk, [{ cycleKey: ck, itemK: 'verm_p', decisao: 'autorizar', origem: 'externo', onde: '', baseRevision: -1 }], op).then((x) => ({ ok: x.ok, status: x.status })); }, [m.cicloDe('Teste Fim', 'verm_p'), m.info[0].groupKey, opcao]);
      await esperar(200);
      const reg = await regDo(m, 'Teste Fim'), pc = Object.values(reg.respostasEscopo49.porCiclo)[0]; delete pc.ts;
      const hist = reg.historicoRespostas49.map((h) => { const x = Object.assign({}, h); delete x.ts; return x; });
      return { chamadas: await m.ev(() => window.__ad), r: r, pc: pc, hist: hist, porResposta: Object.keys(reg.respostasEscopo49.porResposta) };
    } finally { await m.fechar(); }
  }
  const com = await rodar(true), sem = await rodar(false);
  assert.strictEqual(com.chamadas, 0, 'com a opção não chama zPainel44AtualizarDespacho80'); assert.ok(sem.chamadas >= 1, 'sem a opção chama, como hoje (a janela «Abrir resposta» e os outros chamadores): ' + sem.chamadas);
  assert.ok(com.r.ok && sem.r.ok); assert.deepStrictEqual(com.pc, sem.pc, 'o mesmo registro, o mesmo respostaId'); assert.deepStrictEqual(com.hist, sem.hist); assert.deepStrictEqual(com.porResposta, sem.porResposta);
  const uso = HTML.split('semAtualizarPainel').length - 1; assert.strictEqual(uso, 2, 'a opção existe no `registrar` e é passada só pela tela nova (' + uso + ')');
}, 'C');

// ================================================================= P26 — as travas da Codex continuam (AC11.2 a 11.6)
prova('P26', 'vacina: a linha diz se a veterinária confirmou a presença; a execução da vacina continua barrada sem ela (AC11.2)', async () => {
  const filhots = [{ n: 'Teste Vac', tutor: 'Tutor Vac', tel: '(31) 99999-0001', cuidados: ['vac_raiva_p', 'verm_p'] }];
  const vetTxt = (m) => m.ev((s) => [...document.querySelectorAll(s + ' [data-zt694-vet]')].map((e) => e.textContent), m.sel('Teste Vac'));
  let m = await mundo({ filhots: filhots, vetConfirmada: false });
  try {
    igual(await vetTxt(m), ['Falta a veterinária confirmar a presença hoje'], 'só a vacina leva a frase, e é a de falta');
    await m.tocar('Teste Vac', 'vac_raiva_p', 'autorizar_bolsa');
    const reg = await regDo(m, 'Teste Vac'), pc = reg.respostasEscopo49.porCiclo; assert.ok(Object.values(pc).some((x) => x.itemK === 'vac_raiva_p' && x.decisao === 'autorizar'), 'a resposta é gravada mesmo sem a veterinária');
    const r = await m.ev(async () => { const p = CUIDADO57_SOL_INSTANCIA.portas; return p.validarAntes({ itemK: 'vac_raiva_p' }, { ctx: p.contexto() }); });
    assert.strictEqual(r.ok, false); assert.ok(/vacina exige presença veterinária confirmada agora/.test(r.motivo), 'a trava de execução da vacina: ' + JSON.stringify(r));
  } finally { await m.fechar(); }
  m = await mundo({ filhots: filhots, vetConfirmada: true });
  try { igual(await vetTxt(m), ['Veterinária: confirmada hoje']); } finally { await m.fechar(); }
}, 'C');
prova('P26', 'depois das 13h (o fim da janela de envio) e depois das 13h30 a tela lista e grava as quatro respostas, sem bloqueio novo por hora (AC11.3)', async () => {
  for (const relogio of ['2026-10-20T13:15:00-03:00', '2026-10-20T15:00:00-03:00', '2026-10-20T21:45:00-03:00']) {
    const m = await mundo({ filhots: [0, 1, 2, 3].map((i) => ({ n: nomeTeste(i), tutor: 'Tutor ' + i, tel: '(31) 99999-000' + i, cuidados: ['verm_p'] })) }, { relogio: relogio });
    try {
      assert.strictEqual(await m.ev(() => document.querySelectorAll('[data-zt694-pet]').length), 4, relogio + ': a tela lista');
      for (const [i, v] of [[0, 'autorizar_bolsa'], [1, 'autorizar_loja'], [2, 'autorizar_externo'], [3, 'aguardar']]) {
        await m.tocar(nomeTeste(i), 'verm_p', v);
        const pc = Object.values((await regDo(m, nomeTeste(i))).respostasEscopo49.porCiclo)[0];
        assert.ok(pc && pc.respostaId, relogio + ' ' + v + ': gravou');
      }
      assert.strictEqual(m.erros.length, 0, m.erros.join(' | '));
    } finally { await m.fechar(); }
  }
}, 'C');
prova('P26', 'o serviço fica fora: nenhuma gravação em `piloto59/` nem em `daycare/zelozinha-operacao/`; só os nós da lista (registro, linha do Day Care, auditoria); a antiga `vencResponderTipo` nunca é chamada (AC11.4, AC11.6, AC13.3)', async () => {
  const m = await mundo({ filhots: [0, 1, 2, 3].map((i) => ({ n: nomeTeste(i), tutor: 'Tutor ' + i, tel: '(31) 99999-000' + i, cuidados: ['verm_p', 'ecto_p'] })) });
  try {
    await m.ev(() => { window.__antiga = 0; const o = window.vencResponderTipo; window.vencResponderTipo = function () { window.__antiga++; return o.apply(this, arguments); }; });
    await m.zerarLog();
    await m.page.click(m.todos(nomeTeste(0), 'autorizar_externo')); await m.quieto(300);
    await m.tocar(nomeTeste(1), 'verm_p', 'autorizar_loja'); await m.tocar(nomeTeste(2), 'verm_p', 'autorizar_bolsa'); await m.tocar(nomeTeste(3), 'verm_p', 'aguardar');
    await escolher(m, nomeTeste(1), 'onde', 'BANHO');
    await m.page.click(m.botao(nomeTeste(3), 'verm_p', 'autorizar_externo')); await m.quieto(300);
    const g = (await m.log()).gravacoes.map((x) => x.path);
    assert.ok(g.length > 5, 'houve gravações: ' + g.length);
    assert.deepStrictEqual(g.filter((p) => /^(piloto59|daycare\/zelozinha-operacao)\//.test(p)), [], 'nenhuma gravação nos nós do serviço');
    const fora = g.filter((p) => !/^daycare\/(vencimentos|dashboard|auditoria)\//.test(p) && !/^daycare\/(fotos-corpo|limpeza-fotos|aniversario-enviado)\//.test(p));  // a limpeza de fotos e o aviso de aniversário são relógios do próprio app (com banco lento caem no meio da prova), não da tela
    assert.deepStrictEqual(fora, [], 'só grava onde está escrito: ' + JSON.stringify([...new Set(g.map((p) => p.replace(/\d{4}-\d{2}-\d{2}/, 'DIA').replace(/teste-\d+__tutor-\d+/, 'PET').replace(/\/(r57_|[A-Za-z0-9_-]{12,}).*$/, '/…')))]));
    assert.strictEqual(await m.ev(() => window.__antiga), 0, 'a via antiga não é chamada');
    assert.strictEqual(m.erros.length, 0, m.erros.join(' | '));
  } finally { await m.fechar(); }
}, 'C');
prova('P26', 'a projeção só vale nas versões 86, 89, 92 e 104 e com `retornoHumanoPrevisto` 13:30: versão 105 → «Para conferir», nada se grava; o validador do grupo é o de sempre (AC11.4)', async () => {
  const m = await mundo({ filhots: [{ n: nomeTeste(0), tutor: 'Tutor 0', tel: '(31) 99999-0000', cuidados: ['verm_p'] }], detalhes: 105 });
  try {
    const t = await m.telaTexto(); assert.ok(/Para conferir: 1/.test(t) && /AINDA NÃO ENVIADA/.test(t) && /Atualize antes de registrar/.test(t), t);
    assert.strictEqual(await m.ev((s) => [...document.querySelectorAll(s + ' [data-zt694-acao="resp"]')].every((b) => b.disabled), m.sel(nomeTeste(0))), true, 'botões desligados');
    await m.zerarLog();
    const r = await m.ev(async ([gk, ck]) => ZeluzRespostaApp88.registrar(gk, [{ cycleKey: ck, itemK: 'verm_p', decisao: 'autorizar', origem: 'bolsa', onde: '', baseRevision: -1 }], { petId: 'pet1' }).then((x) => ({ ok: x && x.ok, motivo: x && x.motivo }), (e) => ({ ok: false, motivo: String(e && e.message || e) })), [m.info[0].groupKey, m.cicloDe(nomeTeste(0), 'verm_p')]);
    assert.strictEqual(r.ok, false, 'o `registrar` recusa a versão 105: ' + JSON.stringify(r)); const gr = (await m.log()).gravacoes; assert.strictEqual(gr.length, 0, 'nada gravado: ' + JSON.stringify(gr.map((x) => x.path)));
  } finally { await m.fechar(); }
  const c = noTodo().ctx, dia = '2026-10-20', id = (p, t) => ({ petId: p, tutorRefId: t, dcKeyAtual: 'dc', pelKeyAtual: 'pel' });
  const grupo = (extra) => Object.assign({ groupKey: JSON.stringify(['pet1', 'tut1', dia]), petId: 'pet1', tutorId: 'tut1', statusPainel: 'em_preparacao', respostaHumana: 'nao_aplicavel', autoria: { id: 'zelozinha-zeluz', nome: 'Zelozinha', tipo: 'servico' }, retornoHumanoPrevisto: '13:30' }, extra || {});
  const valido = (g) => c.zPainel44Grupo80Valido(g, dia, { groups: {} }, { pet1: id('pet1', 'tut1') });
  assert.strictEqual(valido(grupo()), true, 'o grupo bem formado vale'); assert.strictEqual(valido(grupo({ retornoHumanoPrevisto: '13:31' })), false, 'só o retorno das 13:30 vale'); assert.strictEqual(valido(grupo({ retornoHumanoPrevisto: undefined })), false);
}, 'C');

// ================================================================= P27 — quem vê e `PERM` (AC12.1)
prova('P27', 'consultora, supervisão, gestão e diretoria veem a tela; monitor, veterinária e os outros papéis não; `PERM` continua com 45 capacidades e o mesmo hash (AC12.1)', async () => {
  const w = noTodo(), PERM = w.J('PERM'); assert.strictEqual(Object.keys(PERM).length, 45, 'PERM com 45 capacidades'); assert.strictEqual(h16(w.run('JSON.stringify(PERM)')), 'ad9a293f33473d9b', 'PERM igual à base');
  igual(PERM['painel-consultoras'], ['consultora', 'supervisor', 'gestao', 'diretoria']); igual(PERM['painel-amanda'], ['supervisor', 'gestao', 'diretoria']);
  const veem = [['consultora', 'consultoras'], ['supervisor', 'painel-amanda'], ['gestao', 'painel-amanda'], ['diretoria', 'painel-amanda']], naoVeem = ['monitor', 'vet', 'plantonista', 'aprendiz', 'conferencia'];
  for (const [role, rota] of veem) {
    const m = await mundo({ filhots: [{ n: nomeTeste(0), tutor: 'Tutor 0', tel: '(31) 99999-0000', cuidados: ['verm_p'] }], usuario: { monId: 'p1', pessoa: 'P ' + role, nome: 'P ' + role, role: role } }, { abrir: false });
    try { await m.abrirTela(rota); assert.strictEqual(await m.ev(() => document.querySelectorAll('[data-zt694]').length), 1, role + ' vê a tela'); assert.strictEqual(await m.ev(() => zPainel44Despacho80Acesso()), true, role + ' tem o acesso ao painel'); } finally { await m.fechar(); }
  }
  for (const role of naoVeem) for (const rota of ['painel-amanda', 'consultoras']) {
    const m = await mundo({ filhots: [{ n: nomeTeste(0), tutor: 'Tutor 0', tel: '(31) 99999-0000', cuidados: ['verm_p'] }], usuario: { monId: 'p1', pessoa: 'P ' + role, nome: 'P ' + role, role: role } }, { abrir: false });
    try { await m.ev((r) => { abrirItemDoMenu(r); }, rota); await m.assentou(); assert.strictEqual(await m.ev(() => document.querySelectorAll('[data-zt694],[data-z89-contatos]').length), 0, role + ' não vê a tela em ' + rota); assert.strictEqual(await m.ev(() => zPainel44Despacho80Acesso()), false, role + ' não tem o acesso ao painel'); } finally { await m.fechar(); }
  }
}, 'C');

// ================================================================= P28 — 375 px e espaço (AC10.5, AC10.6, AC12.2)
prova('P28', 'a 375 px: sem rolagem lateral; botões de 44 px; 1 cuidado ≤ 200 px; 2 cuidados ≤ 320 px; os quatro botões do primeiro FILHOt que falta responder a ≤ 300 px do começo do conteúdo do tema (AC10.5, AC10.6, AC12.2)', async () => {
  const filhots = [{ n: nomeTeste(0), tutor: 'Tutor 0', tel: '(31) 99999-0000', cuidados: ['verm_p'] }, { n: nomeTeste(1), tutor: 'Tutor 1', tel: '(31) 99999-0001', cuidados: ['verm_p', 'ecto_p'] }, { n: nomeTeste(2), tutor: 'Tutor 2', tel: '(31) 99999-0002', modo: 'humano', cuidados: ['verm_p'] },
    { n: nomeTeste(3), tutor: 'Tutor 3', tel: '', modo: 'humano', cuidados: ['verm_p'] }, { n: nomeTeste(4), tutor: 'Tutor 4', tel: '(31) 99999-0004', cuidados: ['vac_raiva_p'] }, { n: nomeTeste(5), tutor: 'Tutor 5', tel: '(31) 99999-0005', cuidados: ['verm_p', 'ecto_p'] }, { n: nomeTeste(6), tutor: 'Tutor 6', tel: '(31) 99999-0006', cuidados: ['col_p'] }];
  const m = await mundo({ filhots: filhots, respostas: [{ pet: 5, k: 'verm_p', valor: 'aguardar' }] });
  try {
    const med = await m.ev(() => {
      const corpo = document.querySelector('.z-painel44__tema.aberto .z-painel44__tema-corpo'), c0 = corpo.getBoundingClientRect().top, art = document.querySelector('.z-painel44__tema.aberto').getBoundingClientRect().top;
      const linhas = [...document.querySelectorAll('[data-zt694-pet]')].map((r) => ({ dc: r.getAttribute('data-zt694-pet'), h: Math.round(r.getBoundingClientRect().height), cuidados: r.querySelectorAll('[data-zt694-care]').length, whats: !!r.querySelector('[data-zt694-acao="whats-vazio"]') }));
      const btns = [...document.querySelectorAll('[data-zt694] button:not([disabled])')].filter((b) => b.offsetParent).map((b) => ({ t: (b.textContent || '').trim().slice(0, 24), h: Math.round(b.getBoundingClientRect().height), a: b.getAttribute('data-zt694-acao') || '' }));
      const primeiro = document.querySelector('[data-zt694-grupo="falta"] ~ [data-zt694-pet] [data-zt694-acao="resp"]') || document.querySelector('[data-zt694-pet] [data-zt694-acao="resp"]'), quatro = [...primeiro.closest('[data-zt694-care]').querySelectorAll('[data-zt694-acao="resp"]')].map((b) => b.getBoundingClientRect());
      return { sw: document.documentElement.scrollWidth, iw: innerWidth, linhas: linhas, btns: btns, topoDosBotoes: Math.round(Math.min(...quatro.map((r) => r.top)) - c0), fimDosBotoes: Math.round(Math.max(...quatro.map((r) => r.bottom)) - c0), doCabecalho: Math.round(Math.max(...quatro.map((r) => r.bottom)) - art) };
    });
    assert.ok(med.sw <= med.iw, 'sem rolagem lateral: ' + med.sw + ' > ' + med.iw);
    med.linhas.forEach((l) => { if (l.cuidados === 1) assert.ok(l.h <= 200, '1 cuidado ≤ 200 px: ' + l.dc + ' ' + l.h + (l.whats ? ' (com «Abrir WhatsApp»)' : '')); if (l.cuidados === 2) assert.ok(l.h <= 320, '2 cuidados ≤ 320 px: ' + l.dc + ' ' + l.h); });
    assert.ok(med.linhas.filter((l) => l.cuidados === 1).length >= 4 && med.linhas.filter((l) => l.cuidados === 2).length === 2, 'mediu todos os tipos');
    assert.ok(med.btns.length > 20 && med.btns.every((b) => b.h >= 44), 'botões ≥ 44 px: ' + JSON.stringify(med.btns.filter((b) => b.h < 44)));
    assert.ok(med.fimDosBotoes <= 300, 'os quatro botões do primeiro FILHOt a ≤ 300 px do começo do conteúdo do tema: ' + med.fimDosBotoes + ' (começam em ' + med.topoDosBotoes + '; contando o cabeçalho do tema, que é do app: ' + med.doCabecalho + ')');
    const aria = await m.ev((s) => [...document.querySelectorAll(s + ' [data-zt694-acao="resp"]')].map((b) => b.getAttribute('aria-label')), m.sel(nomeTeste(0)));
    assert.ok(aria.length === 4 && aria.every((a) => /^(Mandou na bolsa|Autorizou pegar na loja|Vai fazer em casa|Não respondeu) para Vermífugo/.test(a)), 'aria-label «{resposta} para {cuidado}»: ' + aria.join(' | '));
    await m.page.keyboard.press('Tab'); const foco = await m.ev((s) => { const b = document.querySelector(s + ' [data-zt694-acao="resp"]'); b.focus(); return document.activeElement === b; }, m.sel(nomeTeste(0))); assert.ok(foco, 'o botão recebe foco por teclado');
    assert.strictEqual(m.erros.length, 0, m.erros.join(' | '));
  } finally { await m.fechar(); }
}, 'C');

// ================================================================= P29 — a área protegida (AC13.2)
const HASH_BASE = { zPainel44Montar: '149e64a476602475', zPainel44Prevenir: '16658e594861b31e', dcCuidado57Render: '23e2a97dc7f55eb7', dcCuidado57Abrir: '0c5a8cda289dd29a', dashLancar: 'd2497f26032a619b', dashRemover: '2fe5f74928dcfb57', dashSnoopy33LinhaHTML: 'c42c259617274d88', dashCuidado36LinhaHTML: '1b60fde46eff3943', zWhatsAbrir: '5695f7fdcd14a6ee', poTelDoTutor: '6bc17f286289cc16', corrAbrir: '208265cf2a0de416', corrRiscadoHTML: '666f47261fa79fea', dashNomePlanilha: '1731e5d48c4ce597', vermPreMarcar: '9c3b3baca86cbcb3', medPreMarcarLanc: '4ce53033620945e6', zPainel44Hora86: 'b65fd2e7b1e7aec1' };
prova('P29', 'as 157 funções `ck*`/`ckt*`/`pt*`/`pendAvisarChegada`, o `#v-daycare`, o `PERM` e as funções que a story manda não tocar estão idênticos à base `b044ecd` (AC13.2)', async () => {
  const c = noTodo(true), nomes = c.J("Object.getOwnPropertyNames(globalThis).filter(k=>typeof globalThis[k]==='function' && (/^(ck|ckt|pt)/.test(k) || k==='pendAvisarChegada')).sort()");
  let todas = ''; nomes.forEach((n) => { todas += n + '\n' + c.run('String(' + n + ')') + '\n'; });
  assert.strictEqual(nomes.length, 157, 'são 157 funções protegidas'); assert.strictEqual(h16(todas), 'af702c168c281ceb', 'o hash do conjunto é o da base');
  const linhas = HTML.split('\n'); assert.strictEqual(h16(linhas.slice(3124, 3206).join('\n') + '\n'), '2be3d20bb27e17f8', '#v-daycare (3125–3206) igual');
  assert.strictEqual(h16(c.run('JSON.stringify(PERM)')), 'ad9a293f33473d9b', 'PERM igual');
  Object.keys(HASH_BASE).forEach((n) => assert.strictEqual(h16(c.run('String(' + n + ')')), HASH_BASE[n], n + ' igual à base'));
  assert.ok(!/function (ck|ckt|pt)[A-Za-z0-9_]*\(/.test(HTML.slice(HTML.indexOf('<script id="zelozinha-tela94-puro">'))), 'nenhuma função `ck*`/`pt*` no código novo');
}, 'L');
prova('P29', 'só mudam as funções da lista: `zPainel44Atualizar` (dividida), `zPainel44AtualizarDespacho80` (só o título), `zPainel44ProgramarRetorno`, e as novas `zPainel44AtualizarAcompanhamento`; os dois textos antigos reaparecem ao desfazer as mudanças (AC13.2)', async () => {
  const c = noTodo(true), S = (n) => c.run('String(' + n + ')');
  // `zPainel44AtualizarDespacho80`: o título e o subtítulo de dentro saíram (o título aparece uma vez só, AC2.5); devolvidos, o texto é o da base
  const antigoTitulo = `html='<h3 class="pm-tit">Contatos e respostas de hoje</h3><p class="pm-sub">Abra o peludinho e marque a resposta da família. Os envios anteriores ficam no histórico.</p><button type="button" class="btn btn-ghost" data-z44-reler>`;
  const d80 = S('zPainel44AtualizarDespacho80'), novoInicio = `html='<button type="button" class="btn btn-ghost" data-z44-reler>`; assert.strictEqual(d80.split(novoInicio).length - 1, 1);
  assert.strictEqual(h16(d80.replace(novoInicio, antigoTitulo)), 'ed1955069b05189c', 'com o título antigo de volta, `zPainel44AtualizarDespacho80` é a da base');
  // `zPainel44Atualizar` foi dividida em duas: a primeira metade e a segunda, juntas, são a função da base
  const a = S('zPainel44Atualizar'), b = S('zPainel44AtualizarAcompanhamento'), cabeca = a.slice(0, a.indexOf('  zPainel44AtualizarAcompanhamento();')).replace(/\n$/, ''), corpo = b.slice(b.indexOf('{') + 1);
  assert.strictEqual(h16(cabeca + corpo), '3bc7700d8eea5836', 'as duas metades juntas são a `zPainel44Atualizar` da base');
  // `zPainel44ProgramarRetorno`: só o que o temporizador chama; sem a tela nova aberta, o que ele chama é a base
  const pr = S('zPainel44ProgramarRetorno'); assert.ok(/ehTreze30&&document\.querySelector\('\[data-zt694-ok="1"\]'\)/.test(pr) && /else zPainel44Atualizar\(\);/.test(pr), 'só pula o painel dos envios às 13h30 com a tela nova aberta');
  const todos = noTodo(true).J("Object.getOwnPropertyNames(globalThis).filter(k=>typeof globalThis[k]==='function' && /^zPainel44/.test(k)).sort()");
  assert.ok(todos.indexOf('zPainel44AtualizarAcompanhamento') >= 0);
  if (APP_BASE) {
    const base = carregarNode('2026-10-20T10:00:00-03:00', true, fs.readFileSync(APP_BASE, 'utf8')), nomesDe = (x) => x.J("Object.getOwnPropertyNames(globalThis).filter(k=>typeof globalThis[k]==='function').sort()");
    const dinamica = (n) => /^zcb_\d+_\d+$/.test(n), nb = nomesDe(base).filter((n) => !dinamica(n)), nn = nomesDe(noTodo(true)).filter((n) => !dinamica(n)), mudou = nn.filter((n) => nb.indexOf(n) >= 0 && base.run('String(' + n + ')') !== noTodo(true).run('String(' + n + ')'));
    assert.deepStrictEqual(nb.filter((n) => nn.indexOf(n) < 0), [], 'nenhuma função global saiu');
    assert.deepStrictEqual(mudou.filter((n) => ['zPainel44Atualizar', 'zPainel44AtualizarDespacho80', 'zPainel44ProgramarRetorno'].indexOf(n) < 0), [], 'só mudam as três funções globais da lista: ' + mudou.join(', '));
    assert.deepStrictEqual(nn.filter((n) => nb.indexOf(n) < 0), ['zPainel44AtualizarAcompanhamento'], 'a única função global nova');
    // scripts: os que mudam são o principal, o `core` da resposta 88 (só o `canon`, que passa a ignorar chave nula: 6.97 AC1), o `repositorio` da resposta 88 (só a transação, que passa a esperar o ouvinte: 6.113, passo 0), o `app` da resposta (registrar, textoEmCasa, mensagemAprovada), o núcleo e a tela dos contatos; o novo é o puro
    const ids = (h) => { const re = /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi; let m; const o = []; while ((m = re.exec(h))) o.push([((m[1].match(/(?:id|data-[a-z0-9]+)="([^"]+)"/) || [])[1] || 'anonimo'), h16(m[2])]); return o; };
    const sb = ids(fs.readFileSync(APP_BASE, 'utf8')), sn = ids(HTML), mudados = []; sn.forEach((x, i) => { if (!sb[i] || sb[i][1] !== x[1]) mudados.push(i + ':' + x[0]); });
    assert.strictEqual(sn.length, sb.length + 1, 'um script novo'); assert.deepStrictEqual(mudados.map((x) => x.split(':')[1]), ['anonimo', 'core', 'repositorio', 'app', 'zelozinha-contatos89-core', 'zelozinha-tela94-puro', 'zelozinha-contatos89-ui'], 'os scripts que mudam: ' + mudados.join(', '));
    // o `repositorio` da resposta 88 só muda no passo 0 da 6.113: a função nova que espera o ouvinte, a chamada a ela no lugar do `ref.transaction` e a falha do limite de 5 s
    const repo88 = (h) => /<script data-resposta88="repositorio">([\s\S]*?)<\/script>/.exec(h)[1];
    const semPasso0 = (x) => x.replace(/  \/\* O Firebase roda a 1ª rodada da transação[\s\S]*?\n  \}\n(?=  function criar\(p\))/, '').replace('return transacaoComOuvinte(ref,function(atual){', 'return ref.transaction(function(atual){').replace("if(tx===SEM_PRIMEIRO_VALOR)return falha('a conexão não respondeu em 5 segundos; nada foi salvo');", '');
    assert.strictEqual(semPasso0(repo88(HTML)), repo88(fs.readFileSync(APP_BASE, 'utf8')), 'o `repositorio` da resposta 88 só muda no passo 0 (6.113)'); assert.ok(/ref\.transaction\(fn,undefined,false\)/.test(repo88(HTML)) && /ref\.off\('value',ouvir\)/.test(repo88(HTML)), 'a transação sem rascunho na tela e o ouvinte desligado no fim');
    // o `core` da resposta 88 só muda no `canon` (e no comentário dele): o resto do núcleo é idêntico à base
    const core88 = (h) => /<script data-resposta88="core">([\s\S]*?)<\/script>/.exec(h)[1], semCanon = (s) => s.replace(/  \/\* O Realtime Database elimina[^\n]*\n/, '').replace(/  function canon\(v\)\{[^\n]*\n/, '');
    assert.strictEqual(semCanon(core88(HTML)), semCanon(core88(fs.readFileSync(APP_BASE, 'utf8'))), 'o `core` da resposta 88 só muda no `canon`'); assert.ok(/filter\(function\(k\)\{return v\[k\]!==null&&v\[k\]!==undefined;\}\)/.test(core88(HTML)), 'o `canon` ignora a chave nula e a indefinida');
  }
}, 'L');

// ================================================================= P32 — guarda da assinatura (AC4.8)
/* o que a ESCOLHA poderia gravar: a linha do Day Care, o Snoopy e o registro da resposta. Os relógios do próprio app (limpeza de fotos, auditoria, aniversário) gravam por conta própria, com banco lento no meio da prova, e não contam */
const gravouNaLinha = (log) => log.gravacoes.filter((x) => /^daycare\/(dashboard|snoopy|vencimentos)\//.test(x.path)).map((x) => x.path);
const FRASES_GUARDA = { snoopy: /Esta linha já foi lançada no Snoopy; para mudar, desfaça antes a confirmação do Snoopy\./, aplicado: /Este cuidado já está sendo aplicado ou foi aplicado; a correção é feita na ficha de Prevenção do FILHOt\./ };
const abrirEscolhas = async (m, nome, k) => { const c = m.cuidadoSel(nome, k || 'verm_p'); await ate(() => m.ev((s) => !!document.querySelector(s + ' [data-zt694-esc]'), c), 15000); if (!(await m.ev((s) => document.querySelector(s + ' [data-zt694-esc]').open, c))) await m.page.click(c + ' [data-zt694-esc] > summary'); return c; };
const escolher = async (m, nome, campo, valor, k) => { const c = await abrirEscolhas(m, nome, k); await m.page.click(c + ' [data-zt694-acao="esc"][data-zt694-campo="' + campo + '"][data-zt694-valor="' + valor + '"]'); await m.quieto(300); };
prova('P32', 'com o Snoopy já confirmado, mudar a observação de origem não grava e pede conferência (AC4.8a)', async () => {
  const m = await mundo({ filhots: [{ n: 'Teste Guarda', tutor: 'Tutor Guarda', tel: '(31) 99999-0001', cuidados: ['verm_p'] }] });
  try {
    await m.tocar('Teste Guarda', 'verm_p', 'autorizar_loja'); await esperaSnoopy(m, 'Teste Guarda', /Já lancei no Snoopy/);
    await m.page.click(m.sel('Teste Guarda') + ' button[data-snoopy-item]'); await m.modal('Já lancei no Snoopy');
    assert.ok(/Snoopy: lançado por Amanda/.test(await esperaSnoopy(m, 'Teste Guarda', /Snoopy: lançado por Amanda/))); await m.quieto(200);
    const antes = await m.ler('daycare/dashboard/' + DIA + '/vermifugo'); await m.zerarLog();
    await escolher(m, 'Teste Guarda', 'onde', 'BANHO');
    assert.deepStrictEqual(gravouNaLinha(await m.log()), [], 'nada gravado na linha, no Snoopy nem no registro'); assert.ok(FRASES_GUARDA.snoopy.test(await m.texto('Teste Guarda')), await m.texto('Teste Guarda'));
    igual(await m.ler('daycare/dashboard/' + DIA + '/vermifugo'), antes, 'a linha ficou como estava');
    assert.ok(/Snoopy: lançado por Amanda/.test(await snoopyTexto(m, 'Teste Guarda')), 'e a confirmação do Snoopy continua valendo, não vira «revisar»');
  } finally { await m.fechar(); }
}, 'C');
prova('P32', 'com a tarefa em execução ou realizada, escolher não grava nada e a tela manda corrigir na ficha de Prevenção (AC4.8a)', async () => {
  for (const estado of ['emexecucao', 'realizado']) {
    const m = await mundo({ filhots: [{ n: 'Teste Guarda', tutor: 'Tutor Guarda', tel: '(31) 99999-0001', cuidados: ['verm_p'] }], respostas: [{ pet: 0, k: 'verm_p', valor: 'autorizar_bolsa', tarefa: estado }] });
    try {
      await m.zerarLog(); await escolher(m, 'Teste Guarda', 'onde', 'BANHO');
      assert.deepStrictEqual(gravouNaLinha(await m.log()), [], estado + ': nada gravado na linha, no Snoopy nem no registro'); assert.ok(FRASES_GUARDA.aplicado.test(await m.texto('Teste Guarda')), estado + ': ' + await m.texto('Teste Guarda'));
    } finally { await m.fechar(); }
  }
}, 'C');
prova('P32', 'escolha igual à já gravada não escreve nada (a assinatura não muda) (AC4.8b)', async () => {
  const m = await mundo({ filhots: [{ n: 'Teste Guarda', tutor: 'Tutor Guarda', tel: '(31) 99999-0001', cuidados: ['ecto_p'] }] });
  try {
    await m.tocar('Teste Guarda', 'ecto_p', 'autorizar_bolsa');
    const sel = m.cuidadoSel('Teste Guarda', 'ecto_p'); await escolher(m, 'Teste Guarda', 'onde', 'BANHO', 'ecto_p');
    const linha = await linhasDoDia(m, 'carrapaticida'), det = Object.values(linha)[0].det; assert.strictEqual(det.onde, 'BANHO', 'a escolha foi gravada');
    await m.zerarLog(); await escolher(m, 'Teste Guarda', 'onde', 'BANHO', 'ecto_p');
    assert.deepStrictEqual(gravouNaLinha(await m.log()), [], 'a mesma escolha de novo não escreve na linha');
  } finally { await m.fechar(); }
}, 'C');
prova('P32', 'escolher antes do Snoopy confirmar deixa o Snoopy «pendente»; a confirmação feita depois da escolha continua válida (AC4.8c)', async () => {
  const m = await mundo({ filhots: [{ n: 'Teste Guarda', tutor: 'Tutor Guarda', tel: '(31) 99999-0001', cuidados: ['verm_p'] }] });
  try {
    await m.tocar('Teste Guarda', 'verm_p', 'autorizar_loja'); await esperaSnoopy(m, 'Teste Guarda', /Já lancei no Snoopy/);
    await escolher(m, 'Teste Guarda', 'onde', 'BANHO');
    const det = Object.values(await linhasDoDia(m, 'vermifugo'))[0].det; assert.strictEqual(det.onde, 'BANHO', 'a escolha gravou'); assert.strictEqual(det.cuidado57_estado, 'conferir-orientacao', 'o estado do cuidado não mudou');
    let t = await snoopyTexto(m, 'Teste Guarda'); assert.ok(/Falta lançar no Snoopy e receber do tutor/.test(t) && /Snoopy: pendente de confirmação humana/.test(t) && !/revisar|alterado/i.test(t), 'continua pendente: ' + t);
    await m.page.click(m.sel('Teste Guarda') + ' button[data-snoopy-item]'); await m.modal('Já lancei no Snoopy');
    t = await esperaSnoopy(m, 'Teste Guarda', /Snoopy: lançado por Amanda/); assert.ok(/Snoopy: lançado por Amanda/.test(t) && !/revisar|alterado/i.test(t), 'a confirmação feita depois da escolha vale: ' + t);
    await m.recarregar(); t = await esperaSnoopy(m, 'Teste Guarda', /Snoopy: lançado por Amanda/); assert.ok(/Snoopy: lançado por Amanda/.test(t) && !/revisar|alterado/i.test(t), 'e vale depois de reabrir a tela: ' + t);
    assert.strictEqual(m.erros.length, 0, m.erros.join(' | '));
  } finally { await m.fechar(); }
}, 'C');

// ================================================================= P33 e P34 — «Não respondeu» e «Não vai fazer» com o banco que descarta o nulo (6.97, AC1)
/* O Realtime Database descarta o filho nulo ao gravar. O núcleo 88 monta `origem: null` para `aguardar` e `recusar` e guarda isso dentro de `porResposta[...].canon`; a releitura
   que o `registrar` faz depois da gravação volta sem `origem` e, sem a correção, a comparação dava «id de resposta já usado com conteúdo diferente» (a resposta ficava gravada, a tela
   mostrava erro e repetir nunca resolvia). O banco de mentira agora descarta o nulo como o RTDB; estas provas rodam também contra a base (`APP94=` a base) e lá falham. */
prova('P33', 'o banco de mentira descarta o nulo como o RTDB em set, update, transaction e seed, e apaga o nó quando o valor é null', async () => {
  const m = await mundo({ filhots: [{ n: 'Teste Nulo', tutor: 'Tutor Nulo', tel: '(31) 99999-0001', cuidados: ['verm_p'] }] }, { abrir: false });
  try {
    const r = await m.ev(async () => {
      const b = window.__banco, o = {};
      b.poe('t94/seed', { a: null, b: 1, c: { d: null, e: 2 } }); o.seed = b.ler('t94/seed');
      await b.ref('t94/set').set({ x: null, y: 'ok' }); o.set = b.ler('t94/set');
      await b.ref('t94/upd').update({ x: 1, y: null, z: { w: null, v: 3 } }); o.upd = b.ler('t94/upd');
      await b.ref('t94/tx').transaction(() => ({ p: null, q: 4 })); o.tx = b.ler('t94/tx');
      await b.ref('t94/set').set(null); o.apagado = b.ler('t94/set');
      return o;
    });
    igual(r.seed, { b: 1, c: { e: 2 } }); igual(r.set, { y: 'ok' }); igual(r.upd, { x: 1, z: { v: 3 } }); igual(r.tx, { q: 4 }); assert.ok(r.apagado === undefined || r.apagado === null, 'set(null) apaga o nó');
  } finally { await m.fechar(); }
}, 'C');
prova('P33', '«Não respondeu» e «Não vai fazer» pela porta de gravação (`registrar`) salvam sem erro com o banco que descarta o nulo; repetir o mesmo pedido dá «já registrado», sem erro (6.97 AC1)', async () => {
  const m = await mundo({ filhots: [{ n: 'Teste Nulo', tutor: 'Tutor Nulo', tel: '(31) 99999-0001', cuidados: ['verm_p', 'ecto_p'] }] }, { abrir: false });
  try {
    const chamar = (decisao, k) => m.ev(async ([gk, ck, dec, k]) => ZeluzRespostaApp88.registrar(gk, [{ cycleKey: ck, itemK: k, decisao: dec, origem: null, onde: '', baseRevision: -1 }], { petId: 'pet1' }).then((x) => ({ ok: x && x.ok, status: x && x.status, motivo: x && x.motivo }), (e) => ({ ok: false, motivo: String((e && e.message) || e) })), [m.info[0].groupKey, m.cicloDe('Teste Nulo', k), decisao, k]);
    const sem = (x) => assert.ok(!/já usado com conteúdo diferente/.test(String(x.motivo || '')), JSON.stringify(x));
    for (const [decisao, k] of [['aguardar', 'verm_p'], ['recusar', 'ecto_p']]) {
      const a = await chamar(decisao, k); sem(a); assert.strictEqual(a.ok, true, decisao + ': a primeira vez salva sem erro: ' + JSON.stringify(a));
      const gravada = Object.values((await regDo(m, 'Teste Nulo')).respostasEscopo49.porCiclo).filter((x) => x.itemK === k); assert.ok(gravada.length === 1 && gravada[0].decisao === decisao, decisao + ': a resposta ficou gravada');
      const b = await chamar(decisao, k); sem(b); assert.strictEqual(b.ok, true, decisao + ': repetir não dá erro: ' + JSON.stringify(b)); assert.strictEqual(b.status, 'ja_registrado', decisao + ': repetir diz «já registrado»: ' + JSON.stringify(b));
    }
    const reg = await regDo(m, 'Teste Nulo'), pc = Object.values(reg.respostasEscopo49.porCiclo), por = Object.values(reg.respostasEscopo49.porResposta);
    assert.deepStrictEqual(pc.map((x) => x.decisao).sort(), ['aguardar', 'recusar'], 'as duas respostas ficaram gravadas, uma vez cada'); assert.strictEqual(reg.historicoRespostas49.length, 2, 'repetir não duplica o histórico');
    assert.ok(por.length === 2 && por.every((x) => x.canon.itens.every((i) => !('origem' in i))), 'o banco devolveu a resposta sem a chave `origem` (como o RTDB): é este o caso testado');
  } finally { await m.fechar(); }
}, 'C');
prova('P34', 'na tela, «Não respondeu» salva sem erro com o banco que descarta o nulo, o retorno entra no grupo das 13h30 e tocar de novo não dá erro nem duplica a resposta (6.97 AC1)', async () => {
  const m = await mundo({ filhots: [{ n: 'Teste Nulo', tutor: 'Tutor Nulo', tel: '(31) 99999-0001', cuidados: ['verm_p'] }, { n: 'Teste Outro', tutor: 'Tutor Outro', tel: '(31) 99999-0002', cuidados: ['verm_p'] }] });
  try {
    const ERRO = /Não foi possível salvar|já usado com conteúdo diferente|conteúdo diferente/;
    await m.tocar('Teste Nulo', 'verm_p', 'aguardar');
    let t = await m.texto('Teste Nulo'); assert.ok(!ERRO.test(t) && /Resposta salva por Amanda/.test(t), t);
    let reg = await regDo(m, 'Teste Nulo'); assert.strictEqual(Object.values(reg.respostasEscopo49.porCiclo)[0].decisao, 'aguardar'); assert.strictEqual(reg.historicoRespostas49.length, 1);
    await m.tocar('Teste Nulo', 'verm_p', 'aguardar');
    t = await m.texto('Teste Nulo'); assert.ok(!ERRO.test(t), 'tocar de novo não dá erro: ' + t);
    reg = await regDo(m, 'Teste Nulo'); assert.strictEqual(reg.historicoRespostas49.length, 1, 'tocar de novo não duplica a resposta'); assert.strictEqual(Object.values(reg.respostasEscopo49.porCiclo)[0].revisao, 0);
    assert.strictEqual(await m.ev(() => [...document.querySelectorAll('[data-zt694-pet] [data-zt694-acao="resp"][aria-pressed="true"]')].length), 1, 'o botão marcado é um só');
    await m.recarregar(); assert.deepStrictEqual(await m.ev(() => [...document.querySelectorAll('[data-zt694-grupo]')].map((e) => e.textContent)), ['Falta responder', 'Retorno às 13h30'], 'depois de atualizar, o FILHOt está no grupo das 13h30');
    assert.strictEqual(m.erros.length, 0, m.erros.join(' | '));
  } finally { await m.fechar(); }
}, 'C');

// ================================================================= P35 — o texto das 13h30 só vale com o FILHOt na casa (correção do QA, M1)
/* O texto das 13h30 diz «enquanto está com a gente» e vai a um tutor. A lista só relê quando a projeção do serviço muda; o FILHOt que sai depois da leitura continuava com o texto na tela.
   Agora a presença daquele FILHOt (check-in e check-out do dia, uma leitura de cada) é conferida: antes de a caixa aparecer, no toque em «Copiar mensagem» e «Abrir no WhatsApp» e ao reabrir o tema com a conferência velha. */
const saidaDe = (hhmm) => ({ tipo: 'saida', quem: 'Zeloso Teste', hora: hhmm, fim: Date.parse(DIA + 'T' + hhmm + ':00-03:00') });
const darSaida = (m, nome, hhmm) => m.ev(([dia, dk, reg]) => { window.__banco.poe('daycare/checkout-corpo/' + dia + '/' + dk, reg); }, [DIA, m.dcDe(nome), saidaDe(hhmm)]);
const caixasDoFilhot = (m, nome) => m.ev((s) => [...document.querySelectorAll(s + ' [data-zt694-copia]')].map((e) => ({ tipo: e.getAttribute('data-zt694-tipo'), txt: e.querySelector('[data-zt694-texto]').textContent })), m.sel(nome));
const temNaLinha = (m, nome, seletor) => m.ev(([s, q]) => !!document.querySelector(s + ' ' + q), [m.sel(nome), seletor]);
const textoDaLinha = (m, nome, seletor) => m.ev(([s, q]) => { const e = document.querySelector(s + ' ' + q); return e ? e.textContent : null; }, [m.sel(nome), seletor]);
/* as leituras do check-in e do check-out DAQUELE FILHOt (só os caminhos dele; os mapas do dia inteiro, que o app lê por conta própria, não entram) */
const leiturasDePresenca = async (m, nome) => { const dk = m.dcDe(nome); return (await m.log()).leituras.filter((x) => x.path === 'daycare/checkin-corpo/' + DIA + '/' + dk || x.path === 'daycare/checkout-corpo/' + DIA + '/' + dk).map((x) => x.path.split('/')[1]).sort(); };
/* as janelas que o «Abrir no WhatsApp» do texto das 13h30 abriu: para onde foram (o número e o texto do link, decodificado) e se foram fechadas */
const janelasDoZap = (m) => m.ev(() => window.__ab.janelas.map((j) => { const x = /^https:\/\/wa\.me\/(\d*)\?text=([\s\S]*)$/.exec(j.href); return { numero: x ? x[1] : null, texto: x ? decodeURIComponent(x[2]) : null, fechada: j.fechada }; }));
const FRASE_SAIU = (nome, hora) => nome + ' já saiu da casa às ' + hora + '. O texto das 13h30 não aparece mais.';
prova('P35', 'funções puras: a hora da saída (instante em número, em texto de data, só dígitos, ou o `hora` do registro) e o início do texto das 13h30 (M1)', async () => {
  const T = noTodo().ctx.ZelozinhaTela94;
  assert.strictEqual(T.horaDaSaida({ fim: Date.parse('2026-10-20T15:42:00-03:00') }), '15:42');
  assert.strictEqual(T.horaDaSaida({ fim: '2026-10-20T15:42:00-03:00' }), '15:42');
  assert.strictEqual(T.horaDaSaida({ fim: '2026-10-20T18:42:00Z' }), '15:42', 'a mesma hora em UTC e em São Paulo');
  assert.strictEqual(T.horaDaSaida({ fim: String(Date.parse('2026-10-20T15:42:00-03:00')) }), '15:42', 'só dígitos');
  assert.strictEqual(T.horaDaSaida({ hora: '15:42' }), '15:42', 'na falta do instante, o `hora` do registro');
  assert.strictEqual(T.horaDaSaida({ fim: 'lixo', hora: '25:99' }), '', 'hora inválida não vira hora');
  assert.strictEqual(T.horaDaSaida({}), ''); assert.strictEqual(T.horaDaSaida(null), ''); assert.strictEqual(T.horaDaSaida('x'), '');
  assert.strictEqual(T.inicio1330(DIA), Date.parse('2026-10-20T16:30:00Z'), '13h30 de São Paulo = 16h30 em UTC'); assert.ok(Number.isNaN(T.inicio1330('')));
});
prova('P35', 'núcleo: `presencaUm` lê só o check-in e o check-out daquele FILHOt, separa presente, saiu (qualquer registro de saída) e sem entrada, e não grava (M1)', async () => {
  const { ZelozinhaContatosHoje89: N } = noTodo().ctx, arv = {}; let lidos = [], permitido = true;
  const db = { ref: (p) => ({ once: () => { lidos.push(p); const v = arv[p]; return Promise.resolve({ val: () => (v === undefined ? null : JSON.parse(JSON.stringify(v))) }); }, set() { throw new Error('não grava'); }, update() { throw new Error('não grava'); }, transaction() { throw new Error('não grava'); } }) };
  const f = () => {}, api = N.criar({ db, dia: () => DIA, linhasHoje: () => [], pelKey: f, dcKey: f, pelExtra: f, vencItensDe: f, tipoCuidado: f, autor: f, permissao: () => permitido, serverTimestamp: f, painel: f, lerPainel: f, resolverEnvio: f });
  const cin = 'daycare/checkin-corpo/' + DIA + '/pet', cout = 'daycare/checkout-corpo/' + DIA + '/pet', entrada = { tipo: 'entrada', quem: 'Zeloso Teste', fim: 1760000000000 };
  arv[cin] = entrada;
  igual(await api.presencaUm('pet'), { dia: DIA, dcKey: 'pet', saiu: false, presente: true, saida: null }, 'presente'); igual(lidos.slice().sort(), [cin, cout].sort(), 'duas leituras, uma de cada');
  arv[cout] = { tipo: 'saida', quem: 'Zeloso Teste', fim: 1760000100000, hora: '15:42' };
  const s = await api.presencaUm('pet'); assert.ok(s.saiu === true && s.presente === false && s.saida.hora === '15:42', JSON.stringify(s));
  arv[cout] = { hora: '15:42' }; assert.strictEqual((await api.presencaUm('pet')).saiu, true, 'qualquer registro de saída conta, como no `resolver`');
  delete arv[cout]; delete arv[cin]; const sem = await api.presencaUm('pet'); assert.ok(sem.saiu === false && sem.presente === false, 'sem entrada confirmada: nem presente nem saiu');
  arv[cin] = { tipo: 'entrada', quem: '', fim: 1760000000000 }; assert.strictEqual((await api.presencaUm('pet')).presente, false, 'entrada sem quem não vale');
  permitido = false; await assert.rejects(() => api.presencaUm('pet'), /Acesso indisponível/); permitido = true; await assert.rejects(() => api.presencaUm(''), /FILHOt indisponível/);
});
prova('P35', 'FILHOt que saiu depois da leitura da lista: «Copiar mensagem» e «Abrir no WhatsApp» da caixa das 13h30 conferem a presença (uma leitura de cada) e, se ele saiu, nada é copiado nem aberto, a caixa some e a linha diz que saiu, com a hora (M1)', async () => {
  const nomes = ['Teste Saiu', 'Teste Zap', 'Teste Fica'], m = await mundo({ filhots: nomes.map((n, i) => ({ n: n, tutor: 'Tutor ' + n.slice(6), tel: '(31) 99999-000' + (i + 1), cuidados: ['verm_p'] })), respostas: nomes.map((_, i) => ({ pet: i, k: 'verm_p', valor: 'aguardar' })) }, { relogio: '2026-10-20T14:00:00-03:00', abrir: false });
  try {
    await espiarNucleo(m); await m.abrirTela(); await m.quieto(300); const lista0 = await m.ev(() => window.__api.listar);
    for (const n of nomes) { const c = await caixasDoFilhot(m, n); assert.deepStrictEqual(c.map((y) => y.txt), [RETORNO('Tutor ' + n.slice(6), FRASE_VERM, n)], n + ': a caixa do texto das 13h30 já está na linha'); assert.deepStrictEqual(c.map((y) => y.tipo), ['retorno'], n + ': a caixa é a do retorno das 13h30'); }
    await darSaida(m, 'Teste Saiu', '13:50'); await darSaida(m, 'Teste Zap', '13:55');
    await m.ev(() => navigator.clipboard.writeText('antes')); await m.zerarLog();
    await m.page.click(m.sel('Teste Saiu') + ' [data-zt694-copia="0"] [data-zt694-acao="copiar"]');
    assert.ok(await ate(() => temNaLinha(m, 'Teste Saiu', '[data-zt694-saiu]')), 'a linha diz que saiu: ' + await m.texto('Teste Saiu'));
    assert.strictEqual(await textoDaLinha(m, 'Teste Saiu', '[data-zt694-saiu]'), FRASE_SAIU('Teste Saiu', '13:50'));
    assert.deepStrictEqual(await caixasDoFilhot(m, 'Teste Saiu'), [], 'a caixa sumiu'); assert.strictEqual(await m.ev(() => navigator.clipboard.readText()), 'antes', 'nada foi copiado');
    assert.deepStrictEqual(await leiturasDePresenca(m, 'Teste Saiu'), ['checkin-corpo', 'checkout-corpo'], 'uma leitura do check-in e uma do check-out daquele FILHOt');
    assert.ok(await temNaLinha(m, 'Teste Saiu', '[data-zt694-acao="whats-vazio"]') && !(await temNaLinha(m, 'Teste Saiu', '[data-zt694-acao="whats-texto"]')), 'o retorno vira só o «Abrir WhatsApp» vazio');
    assert.ok(!/Podemos fazer|enquanto está com a gente/.test(await m.texto('Teste Saiu')), 'e o texto não está mais na linha');
    await m.page.click(m.sel('Teste Zap') + ' [data-zt694-copia="0"] [data-zt694-acao="whats-texto"]');
    assert.ok(await ate(() => temNaLinha(m, 'Teste Zap', '[data-zt694-saiu]')), 'Teste Zap: a linha diz que saiu'); assert.strictEqual(await textoDaLinha(m, 'Teste Zap', '[data-zt694-saiu]'), FRASE_SAIU('Teste Zap', '13:55'));
    assert.ok(await ate(async () => (await m.ev(() => window.__ab.janelas)).every((j) => j.fechada), 15000), 'a janela do WhatsApp de quem saiu foi fechada');
    assert.deepStrictEqual((await janelasDoZap(m)).map((j) => [j.numero, j.fechada]), [[null, true]], 'o WhatsApp não foi aberto com o texto de quem saiu (a janela abriu em branco no toque e fechou)');
    // quem continua na casa: os dois botões funcionam
    await m.page.click(m.sel('Teste Fica') + ' [data-zt694-copia="0"] [data-zt694-acao="copiar"]');
    await ate(async () => (await m.ev(() => navigator.clipboard.readText())) !== 'antes'); assert.strictEqual(await m.ev(() => navigator.clipboard.readText()), RETORNO('Tutor Fica', FRASE_VERM, 'Teste Fica'), 'Teste Fica: copiou');
    await m.ev(() => { window.__ab.janelas.length = 0; });
    await m.page.click(m.sel('Teste Fica') + ' [data-zt694-copia="0"] [data-zt694-acao="whats-texto"]'); await ate(async () => (await janelasDoZap(m)).some((j) => j.numero));
    assert.deepStrictEqual(await janelasDoZap(m), [{ numero: '5531999990003', texto: RETORNO('Tutor Fica', FRASE_VERM, 'Teste Fica'), fechada: false }], 'Teste Fica: abriu a conversa dele com o texto');
    assert.ok(!(await temNaLinha(m, 'Teste Fica', '[data-zt694-saiu]')) && (await caixasDoFilhot(m, 'Teste Fica')).length === 1, 'quem ficou continua com a caixa');
    assert.strictEqual(await m.ev(() => window.__api.listar), lista0, 'a lista inteira não foi relida'); assert.strictEqual(m.erros.length, 0, m.erros.join(' | '));
  } finally { await m.fechar(); }
}, 'C');
prova('P35', 'se a presença não puder ser conferida, nada é copiado: a caixa some e a linha diz que não deu para confirmar (M1)', async () => {
  const m = await mundo({ filhots: [{ n: 'Teste Falha', tutor: 'Tutor Falha', tel: '(31) 99999-0001', cuidados: ['verm_p'] }], respostas: [{ pet: 0, k: 'verm_p', valor: 'aguardar' }] }, { relogio: '2026-10-20T14:00:00-03:00' });
  try {
    assert.strictEqual((await caixasDoFilhot(m, 'Teste Falha')).length, 1);
    await m.ev(() => { window.__banco.falhar(['daycare/checkout-corpo/']); navigator.clipboard.writeText('antes'); });
    await m.page.click(m.sel('Teste Falha') + ' [data-zt694-copia="0"] [data-zt694-acao="copiar"]');
    assert.ok(await ate(() => temNaLinha(m, 'Teste Falha', '[data-zt694-presenca-incerta]')), await m.texto('Teste Falha'));
    assert.ok(/Não consegui confirmar que Teste Falha está na casa agora\./.test(await m.texto('Teste Falha'))); assert.strictEqual((await caixasDoFilhot(m, 'Teste Falha')).length, 0);
    assert.strictEqual(await m.ev(() => navigator.clipboard.readText()), 'antes', 'nada foi copiado');
  } finally { await m.fechar(); }
}, 'C');
prova('P35', 'às 13h30 com a tela aberta, a caixa só entra depois de conferir cada FILHOt em «Não respondeu»: quem saiu antes não ganha o texto, quem ficou ganha; a lista não é relida e só o check-in e o check-out deles são lidos (M1, AC8.5)', async () => {
  const m = await mundo({ filhots: ['Teste Saiu', 'Teste Fica'].map((n, i) => ({ n: n, tutor: 'Tutor ' + n.slice(6), tel: '(31) 99999-000' + (i + 1), cuidados: ['verm_p'] })), respostas: [{ pet: 0, k: 'verm_p', valor: 'aguardar' }, { pet: 1, k: 'verm_p', valor: 'aguardar' }] }, { relogio: '2026-10-20T13:29:59-03:00', abrir: false });
  try {
    await espiarNucleo(m); await m.abrirTela(); await m.quieto(300); const lista0 = await m.ev(() => window.__api.listar);
    for (const n of ['Teste Saiu', 'Teste Fica']) assert.ok((await caixasDoFilhot(m, n)).length === 0 && !(await temNaLinha(m, n, '[data-zt694-conferindo]')), n + ': antes das 13h30 não há caixa nem «conferindo»');
    await darSaida(m, 'Teste Saiu', '13:20'); await m.zerarLog();
    await m.ev((s) => { window.__viuTexto = 0; new MutationObserver(() => { const e = document.querySelector(s + ' [data-zt694-texto]'); if (e && /Podemos fazer/.test(e.textContent)) window.__viuTexto++; }).observe(document.body, { childList: true, subtree: true, characterData: true }); }, m.sel('Teste Saiu'));
    await m.ev(() => { zPainel44ProgramarRetorno(); }); await m.page.clock.setFixedTime('2026-10-20T13:30:00-03:00');
    assert.ok(await ate(async () => (await caixasDoFilhot(m, 'Teste Fica')).length === 1 && await temNaLinha(m, 'Teste Saiu', '[data-zt694-saiu]'), 15000), 'às 13h30: ' + await m.telaTexto());
    assert.strictEqual(await textoDaLinha(m, 'Teste Saiu', '[data-zt694-saiu]'), FRASE_SAIU('Teste Saiu', '13:20')); assert.deepStrictEqual(await caixasDoFilhot(m, 'Teste Saiu'), []);
    assert.strictEqual(await m.ev(() => window.__viuTexto), 0, 'o texto das 13h30 não apareceu na tela de quem saiu nem por um quadro (a caixa só entra depois de conferir)');
    assert.deepStrictEqual(await caixasDoFilhot(m, 'Teste Fica'), [{ tipo: 'retorno', txt: RETORNO('Tutor Fica', FRASE_VERM, 'Teste Fica') }]);
    assert.ok(await temNaLinha(m, 'Teste Saiu', '[data-zt694-acao="whats-vazio"]'), 'quem saiu fica só com o «Abrir WhatsApp» vazio');
    await m.quieto(200);
    assert.deepStrictEqual(await m.ev(() => window.__api.pres), { [m.dcDe('Teste Saiu')]: 1, [m.dcDe('Teste Fica')]: 1 }, 'cada FILHOt em «Não respondeu» foi conferido uma vez só (o check-in e o check-out dele)');
    assert.strictEqual(await m.ev(() => window.__api.listar), lista0, 'a lista inteira não foi relida'); assert.strictEqual(m.erros.length, 0, m.erros.join(' | '));
  } finally { await m.fechar(); }
}, 'C');
prova('P35', 'ao tocar «Não respondeu» de quem acabou de sair: a resposta é salva, mas o texto das 13h30 não aparece e a linha diz que saiu; quem ficou ganha a caixa (M1)', async () => {
  const m = await mundo({ filhots: ['Teste Saiu', 'Teste Fica'].map((n, i) => ({ n: n, tutor: 'Tutor ' + n.slice(6), tel: '(31) 99999-000' + (i + 1), cuidados: ['verm_p'] })) }, { relogio: '2026-10-20T14:00:00-03:00' });
  try {
    await darSaida(m, 'Teste Saiu', '13:40');
    await m.tocar('Teste Saiu', 'verm_p', 'aguardar'); assert.ok(await ate(() => temNaLinha(m, 'Teste Saiu', '[data-zt694-saiu]')), await m.texto('Teste Saiu'));
    assert.strictEqual(await textoDaLinha(m, 'Teste Saiu', '[data-zt694-saiu]'), FRASE_SAIU('Teste Saiu', '13:40')); assert.deepStrictEqual(await caixasDoFilhot(m, 'Teste Saiu'), []);
    assert.strictEqual(Object.values((await regDo(m, 'Teste Saiu')).respostasEscopo49.porCiclo)[0].decisao, 'aguardar', 'a resposta ficou gravada');
    assert.ok(await temNaLinha(m, 'Teste Saiu', '[data-zt694-acao="whats-vazio"]'));
    await m.tocar('Teste Fica', 'verm_p', 'aguardar'); assert.deepStrictEqual(await caixasDoFilhot(m, 'Teste Fica'), [{ tipo: 'retorno', txt: RETORNO('Tutor Fica', FRASE_VERM, 'Teste Fica') }]);
    assert.strictEqual(m.erros.length, 0, m.erros.join(' | '));
  } finally { await m.fechar(); }
}, 'C');
prova('P35', 'ao reabrir o tema: a conferência de poucos minutos vale (nenhuma leitura nova); com mais de 5 minutos, o check-in e o check-out são lidos de novo e quem saiu perde o texto (M1)', async () => {
  const m = await mundo({ filhots: ['Teste Saiu', 'Teste Fica'].map((n, i) => ({ n: n, tutor: 'Tutor ' + n.slice(6), tel: '(31) 99999-000' + (i + 1), cuidados: ['verm_p'] })), respostas: [{ pet: 0, k: 'verm_p', valor: 'aguardar' }, { pet: 1, k: 'verm_p', valor: 'aguardar' }] }, { relogio: '2026-10-20T14:00:00-03:00', abrir: false });
  try {
    const refazerTema = async () => { await m.ev(() => { zPainel44AtualizarDespacho80(); }); await m.quieto(300); }, pres = () => m.ev(() => window.__api.pres);
    await espiarNucleo(m); await m.abrirTela(); await m.quieto(300);
    await darSaida(m, 'Teste Saiu', '14:01');
    await m.page.clock.setFixedTime('2026-10-20T14:02:00-03:00'); await refazerTema();
    assert.strictEqual((await caixasDoFilhot(m, 'Teste Saiu')).length, 1, 'com a conferência de 2 minutos, a caixa continua'); assert.deepStrictEqual(await pres(), {}, 'e ninguém é conferido de novo');
    await m.page.clock.setFixedTime('2026-10-20T14:06:00-03:00'); await refazerTema();
    assert.ok(await ate(() => temNaLinha(m, 'Teste Saiu', '[data-zt694-saiu]')), 'com a conferência de 6 minutos: ' + await m.texto('Teste Saiu')); assert.strictEqual(await textoDaLinha(m, 'Teste Saiu', '[data-zt694-saiu]'), FRASE_SAIU('Teste Saiu', '14:01'));
    assert.deepStrictEqual(await pres(), { [m.dcDe('Teste Saiu')]: 1, [m.dcDe('Teste Fica')]: 1 }, 'os dois foram conferidos de novo, uma vez cada');
    assert.strictEqual((await caixasDoFilhot(m, 'Teste Fica')).length, 1, 'quem ficou continua com a caixa');
    await refazerTema(); assert.deepStrictEqual(await pres(), { [m.dcDe('Teste Saiu')]: 1, [m.dcDe('Teste Fica')]: 1 }, 'conferido há pouco: nada é lido de novo (e quem saiu nunca é relido)');
    assert.strictEqual(m.erros.length, 0, m.erros.join(' | '));
  } finally { await m.fechar(); }
}, 'C');

// ================================================================= P36 — toque duplo na troca (correção do QA, B1)
/* `responder` esperava a leitura do Snoopy antes de marcar «salvando»: o segundo toque passava a guarda. Agora a guarda fecha antes do primeiro `await`. */
prova('P36', 'toque duplo na troca de «Autorizou pegar na loja» para «Mandou na bolsa»: uma chamada ao `registrar`, uma troca, uma auditoria, as mesmas gravações de um toque só, e nenhuma frase falsa de tarefa não criada (B1)', async () => {
  async function rodar(duplo) {
    const m = await mundo({ filhots: [{ n: 'Teste Duplo', tutor: 'Tutor Duplo', tel: '(31) 99999-0001', cuidados: ['verm_p'] }] }, { cacheFrio: true });   /* 6.113: a troca numa linha enviada com a transação do Firebase de verdade (antes: «conflito de resposta concorrente» e «Amanda respondeu agora… Nada foi trocado.») */
    try {
      await m.tocar('Teste Duplo', 'verm_p', 'autorizar_loja'); await esperaSnoopy(m, 'Teste Duplo', PENDENTE_NO_SNOOPY);
      await m.ev(() => { window.__reg = 0; const o = ZeluzRespostaApp88.registrar; ZeluzRespostaApp88.registrar = function () { window.__reg++; return o.apply(this, arguments); }; });
      await m.zerarLog();
      await m.ev(([s, d]) => { const b = document.querySelector(s); b.click(); if (d) b.click(); }, [m.botao('Teste Duplo', 'verm_p', 'autorizar_bolsa'), duplo]);
      await ate(async () => /Trocada de Autorizou pegar na loja para Mandou na bolsa por Amanda/.test(await m.texto('Teste Duplo')), 15000); await m.quieto(400);
      const reg = await regDo(m, 'Teste Duplo'), l = await linhasDoDia(m, 'vermifugo'), id = Object.keys(l)[0], g = (await m.log()).gravacoes;
      const aud = await m.ev((dia) => Object.values(window.__banco.ler('daycare/auditoria/' + dia) || {}).map((x) => x.detalhe).filter((x) => /Teste Duplo/.test(x)).sort(), DIA);
      return { texto: await m.texto('Teste Duplo'), reg: await m.ev(() => window.__reg), historico: reg.historicoRespostas49.length, revisao: Object.values(reg.respostasEscopo49.porCiclo)[0].revisao, linhas: Object.keys(l).length, origem: l[id].origemVencimento.origemResposta,
        gravacoesNaLinha: g.filter((x) => x.path === 'daycare/dashboard/' + DIA + '/vermifugo/' + id).length, trocasNaAuditoria: aud.filter((x) => /de «Autorizou pegar na loja» para «Mandou na bolsa»/.test(x)).length, auditoria: aud, erros: m.erros.slice() };
    } finally { await m.fechar(); }
  }
  const um = await rodar(false), dois = await rodar(true);
  assert.strictEqual(um.reg, 1); assert.strictEqual(um.trocasNaAuditoria, 1, 'a troca foi feita e foi para a auditoria: ' + um.texto); assert.deepStrictEqual(um.erros, []);
  assert.strictEqual(dois.reg, 1, 'o toque duplo chama o `registrar` uma vez só'); assert.strictEqual(dois.trocasNaAuditoria, 1, 'e a troca vai para a auditoria uma vez só');
  assert.strictEqual(dois.gravacoesNaLinha, um.gravacoesNaLinha, 'e a linha do Day Care recebe as mesmas gravações de um toque só'); assert.deepStrictEqual(dois.auditoria, um.auditoria, 'a auditoria do dia é a mesma de um toque só');
  assert.ok(!/Resposta salva, mas a tarefa do Day Care ainda não foi criada/.test(dois.texto), 'sem a frase falsa: ' + dois.texto); assert.ok(/Trocada de Autorizou pegar na loja para Mandou na bolsa por Amanda/.test(dois.texto));
  assert.deepStrictEqual([dois.historico, dois.revisao, dois.linhas, dois.origem], [um.historico, um.revisao, um.linhas, um.origem], 'o banco fica como num toque só'); assert.deepStrictEqual([um.historico, um.revisao, um.linhas, um.origem], [2, 1, 1, 'bolsa']); assert.deepStrictEqual(dois.erros, []);
}, 'C');
prova('P36', 'depois de uma troca barrada, de um cartaz cancelado e de um erro a linha volta a ficar tocável (a guarda de «salvando» é solta) (B1)', async () => {
  const m = await mundo({ filhots: [{ n: 'Teste Solta', tutor: 'Tutor Solta', tel: '(31) 99999-0001', cuidados: ['verm_p'] }], respostas: [{ pet: 0, k: 'verm_p', valor: 'autorizar_bolsa', tarefa: 'emexecucao' }] });
  try {
    const habilitados = () => m.ev((s) => [...document.querySelectorAll(s + ' [data-zt694-acao="resp"]')].map((b) => !b.disabled), m.sel('Teste Solta'));
    await m.page.click(m.botao('Teste Solta', 'verm_p', 'autorizar_externo')); await m.quieto();
    assert.ok(/Este cuidado já foi aplicado\. A correção é feita na ficha de Prevenção do FILHOt\./.test(await m.texto('Teste Solta')), 'troca barrada: a frase'); assert.deepStrictEqual(await habilitados(), [true, true, true, true], 'e os quatro botões voltam a ficar ligados');
  } finally { await m.fechar(); }
  const n = await mundo({ filhots: [{ n: 'Teste Cartaz', tutor: 'Tutor Cartaz', tel: '(31) 99999-0001', cuidados: ['verm_p'] }] });
  try {
    await n.tocar('Teste Cartaz', 'verm_p', 'autorizar_bolsa'); await n.page.click(n.botao('Teste Cartaz', 'verm_p', 'autorizar_externo')); await cartaz(n, { cancelar: true });
    assert.ok(await ate(async () => (await n.ev((s) => [...document.querySelectorAll(s + ' [data-zt694-acao="resp"]')].map((b) => !b.disabled), n.sel('Teste Cartaz'))).every(Boolean)), 'cartaz cancelado: os botões voltam a ficar ligados');
    await n.page.click(n.botao('Teste Cartaz', 'verm_p', 'autorizar_loja')); await esperaSnoopy(n, 'Teste Cartaz', /Já lancei no Snoopy/); assert.strictEqual(n.erros.length, 0, n.erros.join(' | '));
  } finally { await n.fechar(); }
}, 'C');

// ================================================================= P37 — frases da tela e o WhatsApp da caixa (correção do QA, B2, B3 e B4)
prova('P37', 'a frase da lista vazia usa «FILHOt» (nada de «animal»), em toda a tela nova (B2)', async () => {
  const ui = HTML.slice(HTML.indexOf('<script id="zelozinha-contatos89-ui">'), HTML.indexOf('</script>', HTML.indexOf('<script id="zelozinha-contatos89-ui">')));
  assert.ok(!/\b(animal|animais|bicho|bichos|cachorro|cachorros|cão|cães|dono|donos|proprietário|funcionário|funcionários)\b/i.test(ui), 'palavra proibida na tela nova: ' + (ui.match(/\b(animal|animais|bicho|bichos|cachorro|cachorros|cão|cães|dono|donos|proprietário|funcionário|funcionários)\b/i) || [])[0]);
  assert.strictEqual(ui.split('Nenhum cuidado de FILHOt presente foi confirmado nesta leitura.').length - 1, 1);
  const m = await mundo({ filhots: [{ n: 'Teste Vazio', tutor: 'Tutor Vazio', tel: '(31) 99999-0001', cuidados: [] }] }, { abrir: false });
  try {
    await m.ev(() => { abrirItemDoMenu('painel-amanda'); });
    const t = await ate(async () => { const x = await m.telaTexto(); return /Nenhum cuidado de/.test(x) ? x : ''; }, 15000);
    assert.ok(/Nenhum cuidado de FILHOt presente foi confirmado nesta leitura\./.test(t) && !/animal/i.test(t), t); assert.strictEqual(m.erros.length, 0, m.erros.join(' | '));
  } finally { await m.fechar(); }
}, 'C');
prova('P37', 'o aviso das escolhas é uma frase inteira: «As escolhas de produto e lugar ficam registradas aqui. O Encãotador ainda vê só “conferir orientação”.» (B3)', async () => {
  const m = await mundo({ filhots: [{ n: 'Teste Aviso', tutor: 'Tutor Aviso', tel: '(31) 99999-0001', cuidados: ['verm_p'] }] });
  try {
    assert.strictEqual(await m.ev(() => document.querySelectorAll('.zt694-nota').length), 0, 'sem escolhas na tela, sem aviso');
    await m.tocar('Teste Aviso', 'verm_p', 'autorizar_bolsa');
    await m.recarregar();   // o aviso é desenhado com a tela inteira: repintar só ele empurraria as linhas na hora do toque (AC10.1, P24); a prova pede a repintura em vez de esperar o relógio do app, que com o banco lento (30 ms por operação) vem antes de a resposta terminar de gravar (N2)
    await ate(() => m.ev(() => document.querySelectorAll('.zt694-nota').length === 1));
    assert.strictEqual(await m.ev(() => document.querySelector('.zt694-nota').textContent), 'As escolhas de produto e lugar ficam registradas aqui. O Encãotador ainda vê só “conferir orientação”.');
  } finally { await m.fechar(); }
}, 'C');
prova('P37', 'ficha «só humano» com caixa de texto (as 13h30 ou «Vai fazer em casa») mostra um «WhatsApp» só, o da caixa; sem caixa, o vazio de sempre (B4)', async () => {
  const filhots = [{ n: 'Nina Teste', tutor: 'Tutor Nina', tel: '(31) 99999-0003', modo: 'humano', cuidados: ['verm_p'] }, { n: 'Buh Teste', tutor: 'Tutor Buh', tel: '(31) 99999-0004', modo: 'humano', cuidados: ['verm_p'] }, { n: 'Cris Teste', tutor: 'Tutor Cris', tel: '(31) 99999-0005', modo: 'humano', cuidados: ['verm_p'] }];
  const botoes = (m, n) => m.ev((s) => ({ vazio: document.querySelectorAll(s + ' [data-zt694-acao="whats-vazio"]').length, comTexto: document.querySelectorAll(s + ' [data-zt694-acao="whats-texto"]').length, mandou: /A Zelozinha não mandou: Contato humano conforme configuração da ficha\./.test(document.querySelector(s).innerText) }), m.sel(n));
  const m = await mundo({ filhots: filhots }, { relogio: '2026-10-20T14:00:00-03:00' });
  try {
    assert.deepStrictEqual(await botoes(m, 'Nina Teste'), { vazio: 1, comTexto: 0, mandou: true }, 'sem resposta: o «Abrir WhatsApp» vazio');
    await m.tocar('Nina Teste', 'verm_p', 'aguardar'); assert.deepStrictEqual(await botoes(m, 'Nina Teste'), { vazio: 0, comTexto: 1, mandou: true }, 'depois das 13h30, «Não respondeu»: só o botão da caixa');
    await m.tocar('Buh Teste', 'verm_p', 'autorizar_externo'); assert.deepStrictEqual(await botoes(m, 'Buh Teste'), { vazio: 0, comTexto: 1, mandou: true }, '«Vai fazer em casa»: só o botão da caixa');
    await m.tocar('Cris Teste', 'verm_p', 'autorizar_bolsa'); assert.deepStrictEqual(await botoes(m, 'Cris Teste'), { vazio: 1, comTexto: 0, mandou: true }, 'sem caixa de texto (bolsa), o vazio continua');
    await m.page.click(m.botao('Cris Teste', 'verm_p', 'autorizar_externo')); await cartaz(m); await fecharCartaz(m);   // de «bolsa» para «em casa» passa pelo cartaz «Anular»
    assert.ok(await ate(async () => (await botoes(m, 'Cris Teste')).comTexto === 1), 'a caixa chegou'); assert.deepStrictEqual(await botoes(m, 'Cris Teste'), { vazio: 0, comTexto: 1, mandou: true }, 'e o vazio some quando a caixa chega');
    assert.strictEqual(m.erros.length, 0, m.erros.join(' | '));
  } finally { await m.fechar(); }
}, 'C');

// ================================================================= P38 — voltar a «bolsa» depois do «Anular» (correção do QA, B6)
prova('P38', 'bolsa → loja → casa (cartaz «Anular») → bolsa: a linha do Day Care volta, a tarefa volta a «criada», as escolhas recomeçam do zero e o Snoopy sai; sem atraso e com 30 ms em cada operação do banco (B6)', async () => {
  for (const atraso of [0, 30]) {
    const m = await mundo({ filhots: [{ n: 'Teste Volta', tutor: 'Tutor Volta', tel: '(31) 99999-0001', cuidados: ['verm_p'] }] }, { latencia: atraso });
    try {
      const rot = 'atraso ' + atraso + ' ms: ';
      await m.tocar('Teste Volta', 'verm_p', 'autorizar_bolsa'); await ate(async () => Object.keys(await linhasDoDia(m, 'vermifugo')).length === 1);
      await escolher(m, 'Teste Volta', 'qtd', '1 COMPRIMIDO'); assert.strictEqual((await linhaDo(m, 'Teste Volta', 'verm_p')).det.qtd, '1 COMPRIMIDO');
      await m.tocar('Teste Volta', 'verm_p', 'autorizar_loja'); await esperaSnoopy(m, 'Teste Volta', /Já lancei no Snoopy/);
      await m.page.click(m.botao('Teste Volta', 'verm_p', 'autorizar_externo')); await cartaz(m); await fecharCartaz(m);
      assert.ok(await ate(async () => Object.keys(await linhasDoDia(m, 'vermifugo')).length === 0 && (await tarefaDe(m, 'Teste Volta', 'verm_p')).estado === 'invalida'), rot + 'a linha saiu e a tarefa deixou de valer');
      assert.ok(await ate(async () => /Vai fazer em casa · Amanda/.test(await m.texto('Teste Volta'))) && !/a troca não terminou|Tirar da lista do Day Care/.test(await m.texto('Teste Volta')), rot + 'depois do «Anular» nada fica pela metade: ' + await m.texto('Teste Volta'));
      await m.tocar('Teste Volta', 'verm_p', 'autorizar_bolsa');
      assert.ok(await ate(async () => Object.keys(await linhasDoDia(m, 'vermifugo')).length === 1 && (await tarefaDe(m, 'Teste Volta', 'verm_p')).estado === 'criada' && /Foi para a lista do Day Care: Vermífugo — falta aplicar e conferir\./.test(await m.texto('Teste Volta'))), rot + 'a linha voltou: ' + await m.texto('Teste Volta'));
      const l = await linhaDo(m, 'Teste Volta', 'verm_p'); assert.ok(l && l.origemVencimento.origemResposta === 'bolsa' && l.origemVencimento.revisao === 3, rot + JSON.stringify(l && l.origemVencimento)); assert.ok(!('qtd' in l.det), rot + 'a escolha de antes não voltou junto: ' + JSON.stringify(l.det));
      assert.ok(await ate(async () => /falta escolher: quanto/.test(await m.ev((s) => { const e = document.querySelector(s + ' .zt694-esc > summary'); return e ? e.textContent : ''; }, m.sel('Teste Volta')))), rot + 'as escolhas recomeçam: ' + await m.texto('Teste Volta'));
      assert.ok(await ate(async () => !(await snoopyTexto(m, 'Teste Volta'))), rot + 'a pendência do Snoopy da loja não voltou');
      assert.ok(!/a troca não terminou|Tirar da lista do Day Care/.test(await m.texto('Teste Volta')), rot + 'e de volta à bolsa também não: ' + await m.texto('Teste Volta'));
      const reg = await regDo(m, 'Teste Volta'); assert.deepStrictEqual([reg.historicoRespostas49.length, Object.values(reg.respostasEscopo49.porCiclo)[0].revisao], [4, 3], rot + 'quatro respostas, nenhuma apagada');
      assert.ok(/Trocada de Vai fazer em casa para Mandou na bolsa por Amanda/.test(await m.texto('Teste Volta')), rot + await m.texto('Teste Volta')); assert.strictEqual(m.erros.length, 0, rot + m.erros.join(' | '));
    } finally { await m.fechar(); }
  }
}, 'C');

// ================================================================= P39 — o gesto do toque (Safari do iPhone) nas duas saídas do texto das 13h30 (correção do QA, N3)
/* No Safari do iPhone o gesto do toque se perde depois de um `await`: a janela do WhatsApp pode ser bloqueada e o «Copiar mensagem» cai em «Selecione o texto para copiar.». Com a presença lida ANTES (M1), as duas saídas começavam depois da leitura.
   Agora a janela abre e a escrita na área de transferência começa NO TOQUE; a leitura vem depois e decide: quem saiu (ou não deu para conferir) fecha a janela e rejeita a escrita; quem está leva a janela ao link e entrega o texto.
   `ordem` (no mundo de teste) conta o que aconteceu primeiro: a janela e a escrita têm de vir ANTES de `leitura-volta`, seja qual for o atraso do banco. */
const espiarOrdem = async (m) => {
  /* antes de zerar a ordem, espera o banco ficar parado: uma leitura do toque anterior que ainda volta (a leitura que falha rejeita na hora e a outra, do par, volta 200 ms depois) não entra na conta do toque seguinte */
  await m.ev(() => new Promise((r) => { const t = () => (window.__banco.pendentes() === 0 ? setTimeout(r, 30) : setTimeout(t, 20)); t(); }));
  return m.ev(() => {
  window.__ab.ordem.length = 0; window.__ab.janelas.length = 0;
  if (window.__ordemPronta) return;
  window.__ordemPronta = true;
  const ref0 = window.__banco.ref;
  window.__banco.ref = function (p) {
    const r = ref0.apply(this, arguments);
    if (/^daycare\/check(in|out)-corpo\/[^/]+\/[^/]+$/.test(String(p).replace(/^\/+/, ''))) { const o = r.once; r.once = function () { window.__ab.ordem.push('leitura-vai'); const volta = () => { window.__ab.ordem.push('leitura-volta'); }; const pr = o.apply(this, arguments); pr.then(volta, volta); return pr; }; }
    return r;
  };
  const w0 = navigator.clipboard.write.bind(navigator.clipboard);
  navigator.clipboard.write = function (itens) { window.__ab.ordem.push('escrita-no-toque'); const r = window.__ab.negarEscrita ? Promise.reject(new Error('gesto negado')) : w0(itens); r.then(() => window.__ab.ordem.push('escrita-feita'), () => window.__ab.ordem.push('escrita-rejeitada')); return r; };   /* negarEscrita: o navegador nega a escrita logo no toque, antes de a leitura da presença voltar */
  const ec0 = document.execCommand.bind(document);
  document.execCommand = function (c) { if (c === 'copy') window.__ab.ordem.push('copia-por-selecao'); return ec0.apply(document, arguments); };
  });
};
const ordemDe = (m) => m.ev(() => window.__ab.ordem.slice());
const antesDaLeitura = (ordem, marca) => ordem.indexOf(marca) >= 0 && ordem.indexOf('leitura-volta') > ordem.indexOf(marca);
const botaoDaCaixa = (m, n, acao) => m.sel(n) + ' [data-zt694-copia="0"] [data-zt694-acao="' + acao + '"]';
prova('P39', 'o gesto do toque: «Abrir no WhatsApp» abre a janela e «Copiar mensagem» começa a escrita ANTES de a leitura da presença voltar; quem saiu (ou não deu para conferir) fecha a janela e deixa a área de transferência como estava; quem está leva a janela ao link com o texto das 13h30, letra por letra; janela bloqueada mantém o aviso; sem ClipboardItem copia depois da leitura (N3)', async () => {
  const nomes = ['Teste Saiu', 'Teste Zap', 'Teste Fica', 'Teste Falha', 'Teste Falha Zap', 'Teste Nega'];
  const m = await mundo({ filhots: nomes.map((n, i) => ({ n: n, tutor: 'Tutor ' + n.slice(6), tel: '(31) 99999-000' + (i + 1), cuidados: ['verm_p'] })), respostas: nomes.map((_, i) => ({ pet: i, k: 'verm_p', valor: 'aguardar' })) }, { relogio: '2026-10-20T14:00:00-03:00', latencia: 200, abrir: false });
  const dialogos = []; m.page.on('dialog', async (d) => { dialogos.push(d.message()); try { await d.dismiss(); } catch (_) { /* silencioso de propósito: o aviso já foi dispensado */ } });
  const TEXTO = (n) => RETORNO('Tutor ' + n.slice(6), FRASE_VERM, n), lerArea = () => m.ev(() => navigator.clipboard.readText());
  try {
    await m.abrirTela();
    for (const n of nomes) assert.ok(await ate(async () => (await caixasDoFilhot(m, n)).length === 1, 15000), n + ': a caixa do texto das 13h30 está na linha');
    await darSaida(m, 'Teste Saiu', '13:50'); await darSaida(m, 'Teste Zap', '13:55'); await darSaida(m, 'Teste Nega', '13:58');
    // ---- Copiar mensagem de quem saiu: a escrita começa no toque, a leitura a rejeita, nada fica na área de transferência
    await m.ev(() => navigator.clipboard.writeText('antes')); await espiarOrdem(m);
    await m.page.click(botaoDaCaixa(m, 'Teste Saiu', 'copiar'));
    assert.ok(await ate(() => temNaLinha(m, 'Teste Saiu', '[data-zt694-saiu]'), 15000), 'a linha diz que saiu: ' + await m.texto('Teste Saiu'));
    assert.ok(await ate(async () => (await ordemDe(m)).indexOf('escrita-rejeitada') >= 0, 15000), 'a escrita foi rejeitada: ' + (await ordemDe(m)).join(' > '));
    let ordem = await ordemDe(m);
    assert.ok(antesDaLeitura(ordem, 'escrita-no-toque'), 'a escrita na área de transferência começou no toque, antes de a leitura voltar: ' + ordem.join(' > '));
    assert.ok(ordem.indexOf('escrita-feita') < 0 && (await lerArea()) === 'antes', 'quem saiu: nada ficou na área de transferência');
    assert.strictEqual(await textoDaLinha(m, 'Teste Saiu', '[data-zt694-saiu]'), FRASE_SAIU('Teste Saiu', '13:50')); assert.deepStrictEqual(await caixasDoFilhot(m, 'Teste Saiu'), []);
    assert.ok(!/Selecione o texto para copiar/.test(await m.texto('Teste Saiu')), 'quem saiu não ganha nem a seleção do texto');
    // ---- Abrir no WhatsApp de quem saiu: a janela abre no toque, a leitura a fecha, ela nunca vai ao link
    await espiarOrdem(m);
    await m.page.click(botaoDaCaixa(m, 'Teste Zap', 'whats-texto'));
    assert.ok(await ate(async () => (await janelasDoZap(m)).every((j) => j.fechada) && (await ordemDe(m)).indexOf('janela-fechada') >= 0, 15000), 'a janela foi fechada: ' + (await ordemDe(m)).join(' > '));
    ordem = await ordemDe(m);
    assert.ok(antesDaLeitura(ordem, 'janela-aberta'), 'a janela abriu no toque, antes de a leitura voltar: ' + ordem.join(' > '));
    assert.ok(ordem.indexOf('janela-no-link') < 0, 'quem saiu: a janela nunca vai ao link: ' + ordem.join(' > ')); assert.deepStrictEqual(await janelasDoZap(m), [{ numero: null, texto: null, fechada: true }]);
    assert.ok(await ate(() => temNaLinha(m, 'Teste Zap', '[data-zt694-saiu]')), 'a linha de quem saiu diz a hora'); assert.strictEqual(await textoDaLinha(m, 'Teste Zap', '[data-zt694-saiu]'), FRASE_SAIU('Teste Zap', '13:55'));
    // ---- quem está na casa: copiar entrega o texto das 13h30 e o WhatsApp leva a janela ao link
    await m.ev(() => navigator.clipboard.writeText('antes')); await espiarOrdem(m);
    await m.page.click(botaoDaCaixa(m, 'Teste Fica', 'copiar'));
    assert.ok(await ate(async () => (await ordemDe(m)).indexOf('escrita-feita') >= 0, 15000), 'a escrita terminou: ' + (await ordemDe(m)).join(' > '));
    ordem = await ordemDe(m); assert.ok(antesDaLeitura(ordem, 'escrita-no-toque'), 'a escrita começou no toque, antes de a leitura voltar: ' + ordem.join(' > '));
    assert.strictEqual(await lerArea(), TEXTO('Teste Fica'), 'o texto das 13h30, letra por letra'); assert.ok(await ate(async () => /Mensagem copiada\./.test(await m.texto('Teste Fica'))), await m.texto('Teste Fica'));
    await espiarOrdem(m);
    await m.page.click(botaoDaCaixa(m, 'Teste Fica', 'whats-texto'));
    assert.ok(await ate(async () => (await ordemDe(m)).indexOf('janela-no-link') >= 0, 15000), 'a janela foi ao link: ' + (await ordemDe(m)).join(' > '));
    ordem = await ordemDe(m); assert.ok(antesDaLeitura(ordem, 'janela-aberta'), 'a janela abriu no toque, antes de a leitura voltar: ' + ordem.join(' > '));
    assert.ok(ordem.indexOf('janela-no-link') > ordem.indexOf('leitura-volta') && ordem.indexOf('janela-fechada') < 0, 'e só foi ao link depois da leitura: ' + ordem.join(' > '));
    assert.deepStrictEqual(await janelasDoZap(m), [{ numero: '5531999990003', texto: TEXTO('Teste Fica'), fechada: false }], 'o número da ficha e o texto das 13h30, letra por letra');
    assert.deepStrictEqual(await m.ev(() => window.__ab.zWhats), [], 'o texto das 13h30 não passa mais pelo `zWhatsAbrir` (que abre depois de uma espera)');
    // ---- janela bloqueada pelo navegador: o aviso de sempre, nenhuma leitura, nada marcado
    await espiarOrdem(m); await m.ev(() => { window.__ab.bloquearJanela = true; }); dialogos.length = 0;
    await m.page.click(botaoDaCaixa(m, 'Teste Fica', 'whats-texto'));
    assert.ok(await ate(() => dialogos.length > 0, 15000), 'o aviso apareceu'); assert.ok(/O navegador não abriu o WhatsApp \(janela bloqueada\)\. Nada foi marcado como mandado\. Use o Copiar e mande por fora\./.test(dialogos[0]), dialogos[0]);
    ordem = await ordemDe(m); assert.ok(ordem.indexOf('leitura-vai') < 0 && ordem.indexOf('janela-no-link') < 0, 'bloqueada: nada é lido nem aberto: ' + ordem.join(' > ')); await m.ev(() => { window.__ab.bloquearJanela = false; });
    // ---- o navegador nega a escrita logo no toque: a seleção do texto («Selecione o texto…») só vem DEPOIS de a presença ser confirmada; quem saiu não ganha nem a seleção
    await m.ev(async () => { await navigator.clipboard.writeText('antes'); window.__ab.negarEscrita = true; }); await espiarOrdem(m);
    await m.page.click(botaoDaCaixa(m, 'Teste Nega', 'copiar'));
    assert.ok(await ate(() => temNaLinha(m, 'Teste Nega', '[data-zt694-saiu]'), 15000), 'a linha de quem saiu diz a hora: ' + await m.texto('Teste Nega'));
    assert.ok(await ate(async () => (await ordemDe(m)).indexOf('escrita-rejeitada') >= 0, 15000), 'a escrita negada: ' + (await ordemDe(m)).join(' > ')); await esperar(400); ordem = await ordemDe(m);
    assert.ok(ordem.indexOf('copia-por-selecao') < 0 && (await lerArea()) === 'antes', 'quem saiu não ganha a seleção do texto, mesmo com a escrita negada: ' + ordem.join(' > '));
    await espiarOrdem(m);
    await m.page.click(botaoDaCaixa(m, 'Teste Fica', 'copiar'));
    assert.ok(await ate(async () => (await ordemDe(m)).indexOf('copia-por-selecao') >= 0, 15000), 'quem está na casa ganha a seleção: ' + (await ordemDe(m)).join(' > ')); ordem = await ordemDe(m);
    assert.ok(ordem.indexOf('escrita-rejeitada') >= 0 && ordem.indexOf('leitura-volta') >= 0 && ordem.indexOf('copia-por-selecao') > ordem.indexOf('leitura-volta'), 'a seleção só vem depois da leitura da presença: ' + ordem.join(' > '));
    assert.ok(await ate(async () => /Mensagem copiada\.|Selecione o texto para copiar\./.test(await m.texto('Teste Fica')), 15000), await m.texto('Teste Fica')); await m.ev(() => { window.__ab.negarEscrita = false; });
    // ---- sem `ClipboardItem` (navegador antigo): o caminho de antes, depois da leitura
    await m.ev(async () => { await navigator.clipboard.writeText('antes'); window.__ClipboardItem0 = window.ClipboardItem; window.ClipboardItem = undefined; }); await espiarOrdem(m);
    await m.page.click(botaoDaCaixa(m, 'Teste Fica', 'copiar'));
    assert.ok(await ate(async () => (await lerArea()) !== 'antes', 15000), 'copiou depois da leitura'); ordem = await ordemDe(m);
    assert.ok(ordem.indexOf('escrita-no-toque') < 0 && ordem.indexOf('leitura-volta') >= 0, 'sem ClipboardItem não há escrita no toque: ' + ordem.join(' > ')); assert.strictEqual(await lerArea(), TEXTO('Teste Fica'));
    await m.ev(() => { window.ClipboardItem = window.__ClipboardItem0; });
    // ---- a leitura da presença falha: nada é copiado nem aberto, a janela fecha e a linha diz que não deu para confirmar
    await m.ev(async () => { window.__banco.falhar(['daycare/checkout-corpo/']); await navigator.clipboard.writeText('antes'); }); await espiarOrdem(m);
    await m.page.click(botaoDaCaixa(m, 'Teste Falha', 'copiar'));
    assert.ok(await ate(() => temNaLinha(m, 'Teste Falha', '[data-zt694-presenca-incerta]'), 15000), await m.texto('Teste Falha'));
    assert.ok(await ate(async () => (await ordemDe(m)).indexOf('escrita-rejeitada') >= 0, 15000), 'a escrita foi rejeitada: ' + (await ordemDe(m)).join(' > ')); ordem = await ordemDe(m);
    assert.ok(antesDaLeitura(ordem, 'escrita-no-toque') && (await lerArea()) === 'antes', 'sem conferência, nada foi copiado: ' + ordem.join(' > '));
    await espiarOrdem(m);
    await m.page.click(botaoDaCaixa(m, 'Teste Falha Zap', 'whats-texto'));
    assert.ok(await ate(() => temNaLinha(m, 'Teste Falha Zap', '[data-zt694-presenca-incerta]'), 15000), await m.texto('Teste Falha Zap'));
    assert.ok(await ate(async () => (await ordemDe(m)).indexOf('janela-fechada') >= 0, 15000), 'a janela foi fechada: ' + (await ordemDe(m)).join(' > ')); ordem = await ordemDe(m);
    assert.ok(antesDaLeitura(ordem, 'janela-aberta') && ordem.indexOf('janela-no-link') < 0, 'sem conferência, a janela abriu no toque e fechou: ' + ordem.join(' > '));
    assert.strictEqual(m.erros.length, 0, m.erros.join(' | '));
  } finally { await m.fechar(); }
}, 'C');

// ================================================================= P40 — o passo 0 da 6.113: a resposta salva quando o nó do registro não está no aparelho (o caso do Boris)
/* O Firebase roda a 1ª rodada da transação com o que o aparelho tem guardado. Sem ouvinte no nó do registro (`daycare/vencimentos/{dia}/{dcKey}`), isso é null: o núcleo
   desistia ali mesmo, sem o servidor ser consultado («prova humana89 exata não confirmada» na linha em que a Zelozinha não mandou; «conflito» na troca de uma linha enviada).
   Agora o repositório da resposta liga o ouvinte, espera o 1º valor (null vale), roda a transação com ele ligado e sem mostrar o rascunho na tela (false), e desliga no fim;
   sem o 1º valor em 5 s, nada é gravado. As provas C usam o banco com `cacheFrio` (a transação do Firebase de verdade); as L testam o repositório sozinho. */
const NO_REG = (m, nome) => 'daycare/vencimentos/' + DIA + '/' + m.dcDe(nome);
const transacoesNoRegistro = (m, nome) => m.ev((p) => window.__banco.log.transacoes.filter((t) => t.path === p), NO_REG(m, nome));
const contatosDe = (r) => Object.values((r && r.contatosHumanos89) || {}).map((x) => [x.tipo, x.status, x.humano && x.humano.nome]);
const respostasDe = (r) => Object.values(((r && r.respostasEscopo49) || {}).porCiclo || {}).map((x) => [x.decisao, x.origem || null, x.humanoNome]);
const FRASE_DE_ERRO = /Não foi possível salvar|prova humana|não confirmad|respondeu agora|conflito/;
prova('P40', 'caso Boris: a Zelozinha não mandou; a pessoa toca «Mandou na bolsa» e, em outro FILHOt, «Não respondeu»: o contato e a resposta ficam gravados em nome de quem tocou, a tarefa do Day Care nasce, sem frase de erro, e o ouvinte do registro sai no fim; sem atraso e com 30 ms em cada operação do banco (6.113, passo 0)', async () => {
  for (const atraso of [0, 30]) {
    const m = await mundo({ filhots: [{ n: 'Boris Teste', tutor: 'Tutor Boris', tel: '(31) 99999-0007', modo: 'humano', cuidados: ['verm_p'] }, { n: 'Teste Quieto', tutor: 'Tutor Quieto', tel: '(31) 99999-0008', modo: 'humano', cuidados: ['verm_p'] }] }, { cacheFrio: true, latencia: atraso });
    try {
      const rot = 'atraso ' + atraso + ' ms: ';
      await m.ev(() => { window.__banco.log.transacoes.length = 0; });
      await m.tocar('Boris Teste', 'verm_p', 'autorizar_bolsa');
      await m.tocar('Teste Quieto', 'verm_p', 'aguardar');
      const boris = await regDo(m, 'Boris Teste'), quieto = await regDo(m, 'Teste Quieto');
      assert.deepStrictEqual(contatosDe(boris), [['contato_humano', 'feito', 'Amanda']], rot + 'o contato do Boris');
      assert.deepStrictEqual(contatosDe(quieto), [['retorno_humano', 'retorno_pendente', 'Amanda']], rot + 'o retorno pendente');
      assert.deepStrictEqual(respostasDe(boris), [['autorizar', 'bolsa', 'Amanda']], rot + '«Mandou na bolsa» gravou a resposta: ' + JSON.stringify((boris && boris.respostasEscopo49) || null));
      assert.deepStrictEqual(respostasDe(quieto), [['aguardar', null, 'Amanda']], rot + '«Não respondeu» gravou a resposta');
      assert.ok(await ate(async () => Object.keys(await linhasDoDia(m, 'vermifugo')).length === 1), rot + 'a tarefa do Day Care nasceu (a linha do vermífugo)');
      for (const n of ['Boris Teste', 'Teste Quieto']) assert.ok(!FRASE_DE_ERRO.test(await m.texto(n)), rot + 'nenhuma frase de erro: ' + await m.texto(n));
      // a transação do registro rodou com o nó no aparelho (a 1ª rodada já com o valor do servidor), com os três argumentos (fn, undefined, false), e o ouvinte saiu
      for (const n of ['Boris Teste', 'Teste Quieto']) {
        const tx = await transacoesNoRegistro(m, n);
        assert.ok(tx.length >= 1 && tx.every((t) => t.frio === false && t.nArgs === 3 && t.aplicarLocal === false && t.rodadas[0] === 'valor'), rot + n + ': ' + JSON.stringify(tx));
      }
      assert.strictEqual(await m.ev(() => window.__banco.ouvintesEm('daycare/vencimentos/')), 0, rot + 'nenhum ouvinte ficou ligado no registro');
      assert.strictEqual(m.erros.length, 0, rot + m.erros.join(' | '));
    } finally { await m.fechar(); }
  }
}, 'C');
prova('P40', 'o banco não manda o 1º valor do registro em 5 s: nada da resposta é gravado, a transação nem roda, a linha diz que não salvou e o ouvinte sai; com o banco de volta, tocar de novo completa e o contato que ficou do 1º toque não atrapalha (6.113, passo 0)', async () => {
  const m = await mundo({ filhots: [{ n: 'Boris Teste', tutor: 'Tutor Boris', tel: '(31) 99999-0007', modo: 'humano', cuidados: ['verm_p'] }] }, { cacheFrio: true });
  try {
    await m.ev(() => { window.__banco.calar(['daycare/vencimentos/']); window.__banco.log.transacoes.length = 0; });
    const t0 = Date.now();
    await m.page.click(m.botao('Boris Teste', 'verm_p', 'autorizar_bolsa'));
    assert.ok(await ate(async () => /Não foi possível salvar/.test(await m.texto('Boris Teste')), 15000), 'a linha diz que não salvou: ' + await m.texto('Boris Teste'));
    const levou = Date.now() - t0; await m.quieto();
    assert.ok(levou >= 4900 && levou < 12000, 'esperou o limite de 5 s: ' + levou + ' ms');
    assert.ok(/a conexão não respondeu em 5 segundos; nada foi salvo/.test(await m.texto('Boris Teste')), await m.texto('Boris Teste'));
    const r1 = await regDo(m, 'Boris Teste');
    assert.deepStrictEqual(respostasDe(r1), [], 'nada da resposta foi gravado: ' + JSON.stringify((r1 && r1.respostasEscopo49) || null));
    assert.deepStrictEqual(await transacoesNoRegistro(m, 'Boris Teste'), [], 'a transação do registro nem rodou');
    assert.strictEqual(await m.ev(() => window.__banco.ouvintesEm('daycare/vencimentos/')), 0, 'o ouvinte saiu depois do limite');
    assert.deepStrictEqual(contatosDe(r1), [['contato_humano', 'feito', 'Amanda']], 'o contato do toque ficou gravado (o efeito colateral que a investigação descreve)');
    await m.ev(() => { window.__banco.calar([]); });
    await m.tocar('Boris Teste', 'verm_p', 'autorizar_bolsa');
    const r2 = await regDo(m, 'Boris Teste');
    assert.deepStrictEqual(respostasDe(r2), [['autorizar', 'bolsa', 'Amanda']], 'o segundo toque gravou a resposta');
    assert.deepStrictEqual(contatosDe(r2), [['contato_humano', 'feito', 'Amanda']], 'e o contato continua um só');
    assert.ok(!FRASE_DE_ERRO.test(await m.texto('Boris Teste')), await m.texto('Boris Teste'));
    assert.strictEqual(m.erros.length, 0, m.erros.join(' | '));
  } finally { await m.fechar(); }
}, 'C');

/* o repositório da resposta 88 SOZINHO, num vm novo, com um núcleo de mentira e um relógio de mentira: os 5 s só «passam» quando a prova manda. O núcleo de mentira faz o que
   o de verdade faz com a prova do contato: com o registro do servidor (`contato: 'feito'`) decide e grava; com o `{}` do null desiste («prova humana89 exata não confirmada»). */
const ALVO88 = { confirmado: true, dia: DIA, dcKey: 'dc-boris', pelKey: 'pk-boris', petId: 'pet1', tutorId: 'tut1', escopoHistoricoSha: '', ciclos: [] };
const SESSAO88 = { confirmada: true, humana: true, id: 'amanda', papel: 'supervisor', assinatura: 'uid-teste|amanda|Amanda|supervisor|' + DIA };
const NO88 = 'daycare/vencimentos/' + DIA + '/dc-boris';
function repositorio88(semente, opcoesBanco) {
  const src = /<script data-resposta88="repositorio">([\s\S]*?)<\/script>/.exec(HTML)[1], relogios = [];
  const nucleo = { registros: [], aceitaVazio: false, decidir(a) {
    const reg = a.registro || {}; nucleo.registros.push(JSON.parse(JSON.stringify(reg)));
    if (reg.resposta === 'gravada') return { ok: true, status: 'ja_registrado', alterou: false, intencoes: [], registro: reg };
    if (reg.contato === 'feito' || nucleo.aceitaVazio) return { ok: true, status: 'registrado', alterou: true, intencoes: [], registro: Object.assign({}, reg, { resposta: 'gravada' }) };
    return { ok: false, status: 'revisao', alterou: false, intencoes: [], motivo: 'prova humana89 exata não confirmada' };
  } };
  const sb = { Promise, JSON, Object, Array, String, Number, Boolean, Error, TypeError, console, ZeluzResposta88: nucleo,
    setTimeout: (fn, ms) => { const t = { fn, ms, limpo: false }; relogios.push(t); return t; }, clearTimeout: (t) => { if (t) t.limpo = true; } };
  vm.runInContext(src, vm.createContext(sb), { filename: 'inline:repositorio' });
  const banco = criarBancoFalso(semente || {}, Object.assign({ cacheFrio: true }, opcoesBanco || {}));
  const repo = sb.ZeluzResposta88RTDB.criar({ db: banco, lerPainel: () => Promise.resolve(null), resolverAtual: () => Promise.resolve(ALVO88), sessaoHumana: () => Promise.resolve(SESSAO88), assinarTexto: () => '', agora: () => 0 });
  const decidir = () => repo.decidir({ groupKey: JSON.stringify(['contato_humano89', 'pet1', 'tut1', DIA]), petId: 'pet1', contatoId: 'c-boris', fonteContato: {}, resposta: { id: 'r88_teste', itens: [] } });
  return { banco, nucleo, relogios, decidir };
}
const COM_CONTATO = () => ({ daycare: { vencimentos: { [DIA]: { 'dc-boris': { contato: 'feito' } } } } });
/* espera a promessa por no máximo `ms` (relógio de verdade): uma promessa pendurada vira 'pendurou' em vez de travar a rodada */
const ouPendura = (p, ms) => Promise.race([p, esperar(ms || 1500).then(() => 'pendurou')]);
prova('P40', 'o repositório sozinho: liga o ouvinte, espera o 1º valor, roda a transação com ele ligado e o nó no aparelho, com (fn, undefined, false), uma rodada só, grava; desliga o ouvinte; o limite de 5 s é armado e desarmado (6.113, passo 0)', async () => {
  const R = repositorio88(COM_CONTATO());
  const r = await ouPendura(R.decidir());
  assert.ok(r && r.ok === true, 'decidiu: ' + JSON.stringify(r));
  assert.strictEqual(R.banco.ler(NO88).resposta, 'gravada', 'a resposta foi gravada no registro');
  assert.strictEqual(R.banco.ler(NO88).contato, 'feito', 'sem apagar o que o registro já tinha');
  assert.deepStrictEqual(R.banco.log.transacoes.map((t) => [t.path, t.nArgs, t.aplicarLocal, t.frio, t.rodadas.join(',')]), [[NO88, 3, false, false, 'valor']], 'uma transação, com o ouvinte ligado e o nó no aparelho');
  assert.deepStrictEqual(R.nucleo.registros[0], { contato: 'feito' }, 'a 1ª rodada recebeu o registro do servidor, não o {} do null');
  assert.strictEqual(R.banco.ouvintesEm('daycare/vencimentos/'), 0, 'o ouvinte saiu');
  assert.deepStrictEqual(R.relogios.map((t) => [t.ms, t.limpo]), [[5000, true]], 'o limite de 5 s foi armado e desarmado quando o 1º valor chegou');
  assert.strictEqual(R.banco.log.leituras.filter((l) => l.op === 'on' && l.path === NO88).length, 1, 'um ouvinte só, no nó do registro');
}, 'L');
prova('P40', 'o repositório sozinho: o nó ainda não existe e o 1º valor do ouvinte é null: isso basta (não espera um objeto, ao contrário do `tx()` da tarefa), a transação roda e grava sem esperar o limite (6.113, passo 0)', async () => {
  const R = repositorio88({}); R.nucleo.aceitaVazio = true;
  const r = await ouPendura(R.decidir());
  assert.ok(r !== 'pendurou' && r.ok === true, 'decidiu sem esperar o limite: ' + JSON.stringify(r));
  assert.strictEqual(R.banco.ler(NO88).resposta, 'gravada');
  assert.deepStrictEqual(R.banco.log.transacoes.map((t) => [t.nArgs, t.aplicarLocal, t.frio]), [[3, false, false]]);
  assert.deepStrictEqual(R.relogios.map((t) => t.limpo), [true], 'o limite foi desarmado pelo null do servidor'); assert.strictEqual(R.banco.ouvintesEm('daycare/vencimentos/'), 0);
}, 'L');
prova('P40', 'o repositório sozinho: o ouvinte não responde; antes dos 5 s nada roda; passados os 5 s, devolve «a conexão não respondeu em 5 segundos; nada foi salvo», sem rodar a transação e sem gravar; o ouvinte sai (6.113, passo 0)', async () => {
  const R = repositorio88(COM_CONTATO()); R.banco.calar([NO88]);
  let fim = null; const p = R.decidir().then((r) => { fim = r; return r; });
  await esperar(80);
  assert.strictEqual(fim, null, 'antes do limite, a resposta espera');
  assert.deepStrictEqual(R.banco.log.transacoes, [], 'e a transação não roda sem o 1º valor');
  assert.deepStrictEqual(R.relogios.map((t) => [t.ms, t.limpo]), [[5000, false]], 'um limite só, de 5 s, armado');
  R.relogios[0].fn();
  const r = await ouPendura(p);
  assert.deepStrictEqual(r && [r.ok, r.status, r.alterou, r.motivo], [false, 'revisao', false, 'a conexão não respondeu em 5 segundos; nada foi salvo'], JSON.stringify(r));
  assert.deepStrictEqual(R.banco.log.transacoes, [], 'nem depois do limite a transação roda'); assert.deepStrictEqual(R.banco.log.gravacoes, [], 'nada gravado');
  assert.deepStrictEqual(R.banco.ler(NO88), { contato: 'feito' }, 'o registro ficou como estava');
  assert.strictEqual(R.banco.ouvintesEm('daycare/vencimentos/'), 0, 'o ouvinte saiu');
}, 'L');
prova('P40', 'o repositório sozinho: o servidor recusa o ouvinte: devolve falha sem gravar, sem rodar a transação, desarma o limite e o ouvinte sai (6.113, passo 0)', async () => {
  const R = repositorio88(COM_CONTATO()); R.banco.falhar([NO88]);
  const r = await ouPendura(R.decidir());
  assert.ok(r && r.ok === false && r.alterou === false && r.status === 'revisao', JSON.stringify(r));
  assert.deepStrictEqual(R.banco.log.transacoes, []); assert.deepStrictEqual(R.banco.log.gravacoes, []);
  assert.deepStrictEqual(R.relogios.map((t) => t.limpo), [true]); assert.strictEqual(R.banco.ouvintesEm('daycare/vencimentos/'), 0);
}, 'L');

// ---------------------------------------------------------------- a rodada
(async () => {
  for (const p of fila) {
    if (!quer(p.id)) continue;
    if (p.ambiente === 'C' && semNavegador) { puladas++; console.log('  - ' + p.nome + ' — PULADO (' + semNavegador + ')'); continue; }
    let m = null;
    try {
      await p.fn();
      ok++; console.log('  ✓ ' + p.nome);
    } catch (e) { falhas.push(p.nome + ' — ' + (e && e.message)); console.log('  ✗ ' + p.nome + '\n      ' + String(e && e.message || e).split('\n').join('\n      ')); }
    finally { await fecharSobras(); }
  }
  if (navegador) await navegador.close();
  console.log('\n' + ok + ' provas passaram' + (puladas ? ', ' + puladas + ' puladas' : '') + (falhas.length ? ', ' + falhas.length + ' falharam' : '') + '.');
  if (falhas.length) { console.log('\nFALHARAM:\n  ' + falhas.join('\n  ')); process.exit(1); }
})();
