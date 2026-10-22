'use strict';
/*
 * PROVAS da Story 6.121 — a observação da alimentação do check-in.
 *
 * O caso (Adriana, 22/10/2026, à tarde, com a foto do cartão do almoço de uma hóspede): ela procurou na ficha inteira o texto
 * vermelho do cartão, não o achou, e queria consertar o nome de outro FILHOt escrito nele por engano.
 * O texto vermelho do cartão era a «Observação da alimentação (como dar, misturas, manias)» escrita NO CHECK-IN desta estadia
 * (ficha.alim.obs), que o cartão pintava como «RESTRICAO:». Depois do check-in, a tela leve «Comida e remédio» não tinha o campo.
 *
 * Este arquivo carrega o auaulandia/index.html REAL (todos os <script> inline, na ordem) num sandbox do Node (vm), com os módulos
 * que a página liga antes deles (alimentacao-hospede.js, cafe-operacional.js e hospedes-atividades.js, lidos da MESMA pasta do
 * index.html), um relógio fixo (quarta, 21/10/2026, 08:00 na hora LOCAL do processo: o resultado é o mesmo em UTC e em
 * America/Sao_Paulo) e um banco de mentira em árvore que CONTA cada leitura e cada gravação. A base (o master fe7ee54, pai deste
 * trabalho) é lida do git para as provas de «não muda» (hash por função, <style>, área protegida) e para as de «as mesmas leituras».
 * Todo dado é inventado («Teste 01», «Tutor Teste», «Ração do Teste 02 fica no armário»). Nenhum Firebase, nenhuma rede.
 *
 * Grupos (PROVAS=A,B roda só esses):
 *   A — «Comida e remédio» ganha a observação da alimentação (AC1 a AC6, AC15)
 *   B — a observação sai do vermelho: faixa amarela no Almoço e no Café, num ponto só (AC7, AC8, AC10); e a restrição e a alergia
 *       da ficha do hóspede em vermelho nos dois cartões, também para quem não tem entrada no Day Care (QA M1)
 *   C — os textos do Almoço com acento, sem mexer nos valores gravados (AC12, AC13)
 *   R — varreduras do arquivo contra a base: <style>, hash por função, área protegida, ?v= do módulo, texto novo (AC9.1, AC10.1,
 *       AC11, AC13, AC14, AC15, AC17)
 *   N — Chromium a 375 px (Playwright), com o CSS real das tags <style> e o HTML das funções reais (AC1.4, AC9.2). Sem o
 *       Playwright, diz PULADO e não conta.
 *   As sondas do QA independente que pegavam defeitos plantados (rodada 1: Q4 a Q7 e Q9; rodada 2: R2-Q3, R2-Q4, R2-Q5 e R2-Q7)
 *   viraram prova nos grupos A e B; o título de cada uma diz «sonda … do QA».
 *
 * Uso:  node tests/comida-observacao.test.js
 *       TZ=America/Sao_Paulo node tests/comida-observacao.test.js
 *       PROVAS=A,B node tests/comida-observacao.test.js
 *       APP6121=/caminho/auaulandia/index.html node tests/comida-observacao.test.js   (outra cópia, para os defeitos plantados: os
 *         módulos são lidos da pasta da cópia)
 *       BASE6121=fe7ee54   (o commit da base; padrão fe7ee54, o master em que este trabalho foi refeito)
 *       FOTOS6121=/pasta FOTOS6121_ROTULO=depois   (o grupo N guarda as fotos a 375 px nessa pasta)
 * Sai 0 se tudo passa, 1 se algo falha.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const assert = require('assert');
const { execFileSync } = require('child_process');

const APP = process.env.APP6121 || path.join(__dirname, '..', 'auaulandia', 'index.html');
const PASTA = path.dirname(APP);
const BASE = process.env.BASE6121 || 'fe7ee54';
const SO = (process.env.PROVAS || '').split(',').map((x) => x.trim().toUpperCase()).filter(Boolean);
const FOTOS = process.env.FOTOS6121 || '';
const ROTULO = process.env.FOTOS6121_ROTULO || 'novo';

const LER = (f) => fs.readFileSync(path.join(PASTA, f), 'utf8');
const doGit = (f) => execFileSync('git', ['-C', __dirname, 'show', BASE + ':' + f], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
const ARQ = { html: fs.readFileSync(APP, 'utf8'), alim: LER('alimentacao-hospede.js'), cafe: LER('cafe-operacional.js'), ativ: LER('hospedes-atividades.js') };
// A base só é lida quando uma prova compara com ela; sem o commit no repositório (outra cópia, rebase), essas provas dizem PULADO.
let ARQ_BASE_LIDO = null, SEM_BASE = false;
function arqBase() {
  if (ARQ_BASE_LIDO) return ARQ_BASE_LIDO;
  if (!SEM_BASE) {
    try { ARQ_BASE_LIDO = { html: doGit('auaulandia/index.html'), alim: doGit('auaulandia/alimentacao-hospede.js'), cafe: doGit('auaulandia/cafe-operacional.js'), ativ: doGit('auaulandia/hospedes-atividades.js') }; return ARQ_BASE_LIDO; }
    catch (e) { SEM_BASE = true; }
  }
  throw new Error('PULADO: a base ' + BASE + ' não está neste repositório (BASE6121=<commit> escolhe outra)');
}

const fila = [];
function prova(grupo, nome, fn) { fila.push({ grupo, nome: '6.121 ' + grupo + ' — ' + nome, fn }); }
const igual = (a, b, msg) => assert.deepStrictEqual(JSON.parse(JSON.stringify(a)), b, msg);
const h16 = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);

// ---------------------------------------------------------------- o relógio: quarta, 21/10/2026, 08:00 (hora LOCAL; antes do corte de presença das 11h em
// São Paulo nos dois fusos: em UTC são 05:00 de lá)
const AGORA = new Date(2026, 9, 21, 8, 0, 0).getTime();
const HOJE = '2026-10-21';

// ---------------------------------------------------------------- o banco de mentira (árvore em memória, que conta)
function criarBanco(seed) {
  const B = { s: JSON.parse(JSON.stringify(seed || {})), n: { once: 0, on: 0, transaction: 0, update: 0, set: 0, push: 0, remove: 0 }, log: [] };
  const parts = (p) => String(p || '').split('/').filter(Boolean);
  const get = (p) => { let c = B.s; for (const k of parts(p)) { if (c == null || typeof c !== 'object') return null; c = c[k]; } return c === undefined ? null : JSON.parse(JSON.stringify(c)); };
  const put = (p, v) => { const ps = parts(p); if (!ps.length) { B.s = v == null ? {} : JSON.parse(JSON.stringify(v)); return; } let c = B.s; for (let i = 0; i < ps.length - 1; i++) { if (c[ps[i]] == null || typeof c[ps[i]] !== 'object') c[ps[i]] = {}; c = c[ps[i]]; } const k = ps[ps.length - 1]; if (v === null || v === undefined) delete c[k]; else c[k] = JSON.parse(JSON.stringify(v)); };
  const snap = (p, v) => ({ key: parts(p).slice(-1)[0] || null, val: () => (v == null ? null : JSON.parse(JSON.stringify(v))), exists: () => v != null, forEach(fn) { if (v && typeof v === 'object') Object.keys(v).some((k) => fn(snap(p + '/' + k, v[k])) === true); } });
  B.get = get;
  B.ref = function (p0) {
    const p = parts(p0).join('/');
    const r = {
      key: parts(p).slice(-1)[0] || null,
      once() { B.n.once++; B.log.push(['once', p]); return Promise.resolve(snap(p, get(p))); },
      on() { B.n.on++; B.log.push(['on', p]); return function () {}; }, off() {},
      set(v) { B.n.set++; B.log.push(['set', p]); put(p, v); return Promise.resolve(); },
      update(o) { B.n.update++; B.log.push(['update', p, Object.keys(o).sort()]); Object.keys(o).forEach((k) => put((p ? p + '/' : '') + k, o[k])); return Promise.resolve(); },
      remove() { B.n.remove++; B.log.push(['remove', p]); put(p, null); return Promise.resolve(); },
      push(v) { B.n.push++; const k = '-p' + B.log.length; B.log.push(['push', p]); if (v !== undefined) put(p + '/' + k, v); const c = B.ref(p + '/' + k); c.then = (f, g) => Promise.resolve().then(f, g); c.catch = () => c; return c; },
      transaction(fn) { B.n.transaction++; B.log.push(['tx', p]); const n = fn(get(p)); if (n === undefined) return Promise.resolve({ committed: false, snapshot: snap(p, get(p)) }); put(p, n); return Promise.resolve({ committed: true, snapshot: snap(p, n) }); },
      child(k) { return B.ref(p + '/' + k); },
      orderByChild() { return r; }, orderByKey() { return r; }, equalTo() { return r; }, limitToFirst() { return r; }, limitToLast() { return r; }, startAt() { return r; }, endAt() { return r; },
    };
    return r;
  };
  return B;
}

// ---------------------------------------------------------------- o app inteiro num sandbox
function universal(name) {
  const fn = function () { return fn; };
  return new Proxy(fn, {
    get(t, p) { if (p === Symbol.toPrimitive) return () => ''; if (p === 'then') return undefined; if (p in t) return t[p]; return universal(name + '.' + String(p)); },
    set() { return true; }, apply() { return universal(name + '()'); }, construct() { return universal('new ' + name); },
  });
}
function elemento(id) {
  return { id, innerHTML: '', textContent: '', value: '', style: {}, scrollTop: 0, dataset: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, setAttribute() {}, getAttribute() { return null; }, appendChild() {}, remove() {}, addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; } };
}
function abrir(arq) {
  class D extends Date { constructor(...a) { if (a.length === 0) super(AGORA); else super(...a); } static now() { return AGORA; } }
  const els = {};
  const bodyEl = { dataset: { role: 'gestao' }, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, appendChild(e) { if (e && e.id) els[e.id] = e; }, style: {}, addEventListener() {}, setAttribute() {}, getAttribute() { return null; }, removeAttribute() {} };
  const documentStub = {
    body: bodyEl, head: { appendChild() {} }, documentElement: universal('documentElement'),
    getElementById(id) { return els[id] || universal('el'); },
    querySelector() { return null; }, querySelectorAll() { return []; },
    createElement() { return elemento(''); },
    addEventListener() {}, getElementsByClassName() { return []; }, getElementsByTagName() { return []; }, cookie: '', readyState: 'complete', hidden: false, visibilityState: 'visible',
  };
  const sb = {
    console, Date: D, Math, JSON, Object, Array, String, Number, Boolean, parseInt, parseFloat, isNaN, isFinite, RegExp, Promise, Map, Set, Symbol, Intl, Error, TypeError,
    encodeURIComponent, decodeURIComponent, escape, unescape, TextEncoder, btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
    setTimeout() { return 0; }, clearTimeout() {}, setInterval() { return 0; }, clearInterval() {}, requestAnimationFrame() {},
    performance: { now() { return 0; } }, document: documentStub,
    firebase: { initializeApp() { return {}; }, auth() { return { signInAnonymously() { return new Promise(() => {}); }, onAuthStateChanged() {} }; }, database() { return { ref() { return universal('ref'); } }; } },
    localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
    sessionStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
    navigator: { userAgent: 't6121', onLine: true }, location: { href: 'https://t6121.local/', reload() {}, replace() {}, hostname: 't6121.local' },
    Blob: class Blob { constructor(parts, opts) { this.parts = parts || []; this.type = (opts && opts.type) || ''; } },
    alert() {}, confirm() { return true; }, prompt() { return ''; }, scrollTo() {}, addEventListener() {}, crypto: crypto.webcrypto,
    fetch() { return Promise.resolve({ text: () => Promise.resolve('{}'), json: () => Promise.resolve({}) }); },
  };
  sb.window = sb; sb.globalThis = sb; sb.self = sb;
  const ctx = vm.createContext(sb);
  // a ordem da página: os módulos de fora (que entram antes do script grande) e depois todo <script> inline
  vm.runInContext(arq.ativ, ctx, { filename: 'hospedes-atividades.js' });
  vm.runInContext(arq.alim, ctx, { filename: 'alimentacao-hospede.js' });
  vm.runInContext(arq.cafe, ctx, { filename: 'cafe-operacional.js' });
  const re = /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi; let m;
  while ((m = re.exec(arq.html))) vm.runInContext(m[2], ctx, { filename: 'index.html#inline', timeout: 30000 });
  const run = (c) => vm.runInContext(c, ctx);
  const J = (c) => { const r = run('JSON.stringify(' + c + ')'); return r === undefined ? null : JSON.parse(r); };
  return { ctx, run, J, els, el: (id) => (els[id] = els[id] || elemento(id)) };
}
const volta = async () => { for (let i = 0; i < 120; i++) await Promise.resolve(); };

// ---------------------------------------------------------------- os dados inventados
const P1 = 'auaulandia/estadias/e1/';
const KH = 'teste 01__tutor teste';          // o hóspede SEM ficha no cadastro do Day Care (índice 'hosp'+refKey)
const OBS_ERRADA = 'Ração do Teste 02 fica no armário', OBS_CERTA = 'Ração do Teste 01 fica no armário';
// a estadia: almoço e jantar com 40 g e 50 g de ração, café com 30 g; observação do check-in com o nome errado
const EST = (o) => Object.assign({ nome: 'Teste 01', tutor: 'Tutor Teste', raca: 'SRD', refKey: KH, status: 'ativa', entrada: '2026-10-19', saida: '2026-10-24', _ts: 100,
  ficha: { obsGeral: 'gosta de colo', medObs: '', coleira: null, medEmUso: 'Não',
    alim: { obs: OBS_ERRADA, tipo: 'Ração', marca: 'Ração', unidade: 'gramas', confirmacao: { estado: 'confirmado', quem: 'Recepção Teste', ts: 1 },
      refs: { fixas: { cafe: { on: true, hora: '07:30', racao: '30', natural: '', extra: '' }, almoco: { on: true, hora: '12:00', racao: '40', natural: '', extra: '' }, jantar: { on: true, hora: '19:00', racao: '50', natural: '', extra: '' } }, extras: [] },
      refeicoes: '3', qtd: '', trazida: '700', dias: 6, entrada: { cafe: false, almoco: true, jantar: true }, saida: { cafe: true, almoco: false, jantar: false },
      racaoRefeicoes: { cafe: true, almoco: true, jantar: true }, minimo: 680, deficit: -20, comida: null },
    spa: { banho: 'Não', tipo: '', horario: '', aConfirmar: false } },
  pertences: [{ uid: 'p1', k: 'comida', nome: 'Ração', spec: 'Ração' }],
  medicacao: [],
  conferencia: { concluida: true, quem: 'Conferente Teste' }, assinatura: 'data:image/png;base64,AAA', assinado_por: 'Tutor Teste' }, o || {});
// estadia de formato antigo: sem refs (só refeicoes/qtd), como as de antes da 6.31
const EST_ANTIGA = () => { const e = EST(); delete e.ficha.alim.refs; e.ficha.alim.refeicoes = '2'; e.ficha.alim.qtd = '50'; return e; };

// a tela «Comida e remédio» aberta (estado puro), como a Fase 0 abre (6.54)
function tela(S, o) {
  S.ctx.__Ti = Object.assign({ id: 'e1', est: EST(), key: KH, itens: {}, log: {}, mestre: { raca: 'SRD', tutor: 'Tutor Teste' }, podeFicha: true, hoje: HOJE, aid: 'a1' }, o || {});
  S.run('__M=mcrEstadoInicial(__Ti); __M.motivo="a tutora corrigiu o nome dele"; __M.quem="Ana Teste";');
}
const CTX = (S, o) => { S.ctx.__Ci = Object.assign({ est: EST(), itens: {}, log: {}, hoje: HOJE, agoraMin: 480, ts: AGORA, quandoBR: '21/10 08:00', avisos: {} }, o || {}); return S.ctx.__Ci; };
const TS = AGORA;

// O cardápio do almoço: a turma de mentira + o cadastro (almCad / pelExtra) de mentira, e a tela do Almoço com os 4 elementos.
function almoco(S, op) {
  op = op || {};
  S.ctx.__alunos = op.alunos || [];
  S.ctx.__cad = op.cad || {};
  S.ctx.__extra = op.extra || {};
  S.ctx.__EST = op.estadias || { e1: EST() };
  ['almGrid', 'almResumo', 'almTurno', 'almCount'].forEach((id) => { S.el(id).innerHTML = ''; S.el(id).textContent = ''; });
  S.run(`PELUDINHOS=__alunos.map(function(a){ return a.p; });
    EST_TODAS=__EST; CF_ESTADIAS={}; Object.keys(EST_TODAS).forEach(function(id){ var e=EST_TODAS[id]; CF_ESTADIAS[e.refKey]={id:id, e:e}; }); CF_ESTADIAS_LIDO=true;
    almCad=function(p){ var k=(p&&p.n)||''; return __cad[k]?JSON.parse(JSON.stringify(__cad[k])):null; };
    pelExtra=function(p){ var k=(p&&p.n)||''; return __extra[k]?JSON.parse(JSON.stringify(__extra[k])):{}; };
    fotoDoPel=function(){ return ''; };
    turmaDoDia=function(){
      var base=PELUDINHOS.map(function(p,i){ return {p:p, i:i}; });
      ZeluzHospedesAtividades.aplicarNaTurma(base, {pronto:true, dia:zHojeISO(), estadias:EST_TODAS, peludinhos:PELUDINHOS, dcKey:dcKey, pelKey:pelKey});
      return base;
    };
    // presença: todo aluno da turma de mentira tem check-in do corpo hoje, menos quem faltou (a presença da 6.29 tira da execução quem não chegou)
    (function(){ var faltou=${JSON.stringify((op.faltas || []).map((f) => f.p.n))}, m={};
      PELUDINHOS.forEach(function(p){ if(faltou.indexOf(p.n)<0) m[dcKey(p.n,p.tutor)]={fim:Date.now()-3600000, tipo:'entrada'}; });
      Z_MAPAS['daycare/checkin-corpo/'+zHojeISO()]={pronto:true, mapa:m}; })();
    almMarcas=${JSON.stringify(op.marcas || {})}; almTurno=${JSON.stringify(op.turno || {})}; ALM_EXCECOES=${JSON.stringify(op.excecoes || {})};
    planDia=Object.assign({}, planDia, {faltas:${JSON.stringify(op.faltas || [])}});
    dcChamada={}; almSemRede=false; dcBuscaVal='';
    renderAlmoco();`);
  return { turno: S.els.almTurno.innerHTML, resumo: S.els.almResumo.innerHTML, grid: S.els.almGrid.innerHTML, count: S.els.almCount.textContent };
}
// um cartão do Almoço pelo nome do FILHOt
function cartao(grid, nome) {
  const partes = grid.split('<div class="pet alm-card').slice(1);
  const c = partes.find((x) => x.indexOf('<div class="nm">' + nome + '</div>') >= 0);
  assert.ok(c, 'o cartão de ' + nome + ' está na grade');
  return '<div class="pet alm-card' + c;
}
const vermelhos = (html) => (html.match(/<div class="alm-restr">[\s\S]*?<\/div>/g) || []);
const faixas = (html) => (html.match(/<div class="janta-box">[\s\S]*?<\/div>/g) || []);

// O café: a estadia do hóspede no café de hoje (entrada e saída fora de hoje), pelo cafe-operacional.js real.
function cafe(S, estadias) {
  S.ctx.__EST = estadias || { e1: EST() };
  ['cafeGrid', 'cafeResumo', 'cafeBarraTempo'].forEach((id) => { S.el(id).innerHTML = ''; });
  S.run(`EST_TODAS=__EST; CF_ESTADIAS_LIDO=true; hospedes=[];
    cafeLeitura={dia:cafeDataKey(), geracao:1, cafe:'ok', turno:'ok', promessa:null}; cafeMarcas={}; cafeTempo={}; cafeMarcasPendentes={};
    cafeAlunoLeitura={dia:cafeDataKey(), estado:'ok', excecoes:{}, chamada:{}, checkins:{}}; cafeAlunoPedidosHTML=function(){ return ''; };
    renderCafe();`);
  return S.els.cafeGrid.innerHTML;
}

// ================================================================== as cargas (a base é só para comparar «não muda»)
const S = abrir(ARQ);
let SB = null;
const base = () => (SB = SB || abrir(arqBase()));

// ================================================================== A — «Comida e remédio» ganha a observação
prova('A', 'AC1.1 — a tela abre com a observação de hoje: mcrComidaDe devolve obs (vazia vira \'\'; sem ficha.alim, \'\'), M.comidaAntes.obs = M.comida.obs', () => {
  S.ctx.__e = EST();
  igual(S.J('mcrComidaDe(__e).obs'), OBS_ERRADA);
  S.ctx.__e = EST(); S.ctx.__e.ficha.alim.obs = '';
  igual(S.J('mcrComidaDe(__e).obs'), '');
  S.ctx.__e = EST(); delete S.ctx.__e.ficha.alim.obs;
  igual(S.J('mcrComidaDe(__e).obs'), '', 'sem o campo');
  S.ctx.__e = EST(); delete S.ctx.__e.ficha.alim;
  igual(S.J('mcrComidaDe(__e).obs'), '', 'estadia sem ficha.alim');
  tela(S);
  igual(S.J('[__M.comidaAntes.obs, __M.comida.obs]'), [OBS_ERRADA, OBS_ERRADA]);
});
prova('A', 'AC1.1 — o cartão «Comida» traz o rótulo exato e um campo com o texto atual, aria-label igual ao rótulo, que chama mcrSetComidaTx(\'obs\', …)', () => {
  tela(S);
  const h = S.run('mcrComidaHTML(__M)');
  const ROT = 'Observação da alimentação (como dar, misturas, manias)';
  assert.ok(h.indexOf('<div class="mcr-lab">' + ROT + '</div>') >= 0, 'o rótulo exato');
  const campo = (h.match(/<textarea[^>]*aria-label="Observação da alimentação \(como dar, misturas, manias\)"[^>]*>([\s\S]*?)<\/textarea>/) || []);
  assert.ok(campo[0], 'o campo de texto com aria-label igual ao rótulo');
  igual(campo[1], OBS_ERRADA, 'o texto de hoje dentro do campo');
  assert.ok(/oninput="mcrSetComidaTx\('obs',this\.value\)"/.test(campo[0]), campo[0]);
});
prova('A', 'AC1.1 — o texto sai escapado no campo (aspas duplas, < e & não quebram o campo)', () => {
  tela(S, { est: EST({ ficha: Object.assign(EST().ficha, { alim: Object.assign(EST().ficha.alim, { obs: 'Dar "morno" <b>com</b> água & sal' }) }) }) });
  const h = S.run('mcrComidaHTML(__M)');
  const campo = (h.match(/<textarea[^>]*>([\s\S]*?)<\/textarea>/) || [])[1];
  igual(campo, 'Dar &quot;morno&quot; &lt;b>com&lt;/b> água &amp; sal');
  assert.ok(h.indexOf('<b>com</b>') < 0, 'nada do texto vira tag');
});
prova('A', 'AC1.1 — digitar no campo não redesenha a tela (só guarda o texto)', () => {
  tela(S);
  S.run('__bkR6121=mcrRender; __nRender=0; mcrRender=function(){ __nRender++; }; MCR=__M;');
  try {
    S.run(`mcrSetComidaTx('obs', ${JSON.stringify(OBS_CERTA)})`);
    igual(S.J('[MCR.comida.obs, __nRender]'), [OBS_CERTA, 0]);
  } finally { S.run('mcrRender=__bkR6121; MCR=null;'); }
});
// Sonda Q4 do QA independente (defeito QA-d3: o campo redesenhado com o texto de ANTES, enquanto o que vai ser salvo é o digitado).
prova('A', 'AC1.1 (sonda Q4 do QA) — digitar a observação e depois tocar em +5 g do jantar: a tela redesenha com o texto DIGITADO no campo (o que vai ser salvo)', () => {
  tela(S); S.el('mcrTela').innerHTML = '';
  S.run(`MCR=__M; mcrSetComidaTx('obs', ${JSON.stringify(OBS_CERTA)}); mcrPassoRef('jantar', 5);`);
  try {
    igual(S.J('[MCR.comida.obs, MCR.comida.refs.fixas.jantar.racao]'), [OBS_CERTA, '55'], 'o toque em +5 g mudou o jantar e guardou o texto');
    const h = S.els.mcrTela.innerHTML;
    assert.ok(h.indexOf('mcrPassoRef(') >= 0, 'a tela foi redesenhada pelo toque');
    igual((h.match(/<textarea[^>]*aria-label="Observação da alimentação[^"]*"[^>]*>([\s\S]*?)<\/textarea>/) || [])[1], OBS_CERTA, 'o campo mostra o que será salvo, não o texto de antes');
  } finally { S.run('MCR=null;'); }
});
prova('A', 'AC1.2 — o campo está à vista sem abrir «Mudar o que ele come (tipo, marca, patê, refeições)», e aparece uma vez só com o bloco aberto', () => {
  tela(S);
  igual(S.J('__M.editarTudo'), false);
  const fechado = S.run('mcrComidaHTML(__M)');
  igual((fechado.match(/mcrSetComidaTx\('obs'/g) || []).length, 1, 'à vista com o bloco fechado');
  assert.ok(S.run('mcrComidaTudoHTML(__M)').indexOf("mcrSetComidaTx('obs'") < 0, 'não mora dentro do bloco recolhido');
  S.run('__M.editarTudo=true;');
  igual((S.run('mcrComidaHTML(__M)').match(/mcrSetComidaTx\('obs'/g) || []).length, 1, 'com o bloco aberto, continua um só');
});
prova('A', 'AC1.3 — logo abaixo do campo, a frase de ajuda', () => {
  tela(S);
  const h = S.run('mcrComidaHTML(__M)');
  const AJ = '<div class="mcr-mut">Vale só para esta estadia; a ficha do FILHOt não guarda esta observação.</div>';
  const i = h.indexOf('</textarea>'), j = h.indexOf(AJ);
  assert.ok(i >= 0 && j > i, 'a ajuda vem depois do campo');
  igual(h.slice(i + '</textarea>'.length, j).trim(), '', 'logo abaixo, sem nada no meio');
});
prova('A', 'AC2.1 — mcrDiffComida: só a observação mudou = UMA frase «Observação da alimentação: {antes} → {depois}» («sem observação» no vazio); por último; espaços nas pontas não contam', () => {
  tela(S);
  S.run(`__M.comida.obs=${JSON.stringify(OBS_CERTA)};`);
  igual(S.J('mcrDiffComida(__M.comidaAntes, __M.comida)'), ['Observação da alimentação: ' + OBS_ERRADA + ' → ' + OBS_CERTA]);
  S.run(`__M.comida.obs='';`);
  igual(S.J('mcrDiffComida(__M.comidaAntes, __M.comida)'), ['Observação da alimentação: ' + OBS_ERRADA + ' → sem observação']);
  S.run(`__M.comidaAntes.obs=''; __M.comida.obs='dar morno';`);
  igual(S.J('mcrDiffComida(__M.comidaAntes, __M.comida)'), ['Observação da alimentação: sem observação → dar morno']);
  tela(S);
  S.run(`__M.comida.obs='  '+__M.comida.obs+'   ';`);
  igual(S.J('mcrDiffComida(__M.comidaAntes, __M.comida)'), [], 'só espaços de diferença');
  tela(S);
  S.run(`__M.comida.obs=${JSON.stringify(OBS_CERTA)}; __M.comida.refs.fixas.jantar.racao='45'; __M.comida.semRacao=true;`);
  igual(S.J('mcrDiffComida(__M.comidaAntes, __M.comida)'), ['Jantar: 50 g → 45 g de ração', 'Sem ração — comida úmida da casa: ligado (só nesta hospedagem)', 'Observação da alimentação: ' + OBS_ERRADA + ' → ' + OBS_CERTA], 'a frase da observação vem por último');
});
prova('A', 'AC2.2 — mudar só a observação é mudança: mcrTemMudanca verdadeiro; mcrValidar não diz «Nada mudou» e continua pedindo o motivo (4 palavras) e o nome', () => {
  tela(S);
  igual(S.J('mcrTemMudanca(__M)'), false, 'sem mexer, nada mudou');
  S.run(`__M.comida.obs=${JSON.stringify(OBS_CERTA)};`);
  igual(S.J('mcrTemMudanca(__M)'), true);
  igual(S.J('mcrValidar(__M, 480)'), [], 'com motivo e nome, pronto para conferir');
  S.run(`__M.motivo='erro'; __M.quem='';`);
  const p = S.J('mcrValidar(__M, 480)');
  assert.ok(!p.some((f) => /Nada mudou/.test(f)), p.join(' | '));
  assert.ok(p.some((f) => /4 palavras/.test(f)), 'o motivo de 4 palavras: ' + p.join(' | '));
  assert.ok(p.some((f) => /seu nome/i.test(f)), 'o nome de quem muda: ' + p.join(' | '));
});
// Sonda R2-Q4 do QA independente, rodada 2 (defeito QA2-r1: mcrDiffComida comparava a observação sem acento e sem maiúscula, com
// jsNorm; corrigir só um acento ou uma maiúscula virava «Nada mudou» e não deixava salvar, justamente o erro que a tela corrige).
prova('A', 'AC2.1 e AC2.2 (sonda R2-Q4 do QA) — corrigir só um acento ou uma maiúscula na observação é mudança: a frase «de → para», mcrTemMudanca verdadeiro, sem «Nada mudou», e a gravação leva o texto novo', () => {
  const pares = [['racao do teste 01 fica no armario', OBS_CERTA], ['Ração da teste 01 fica no armário', 'Ração da Teste 01 fica no armário']];
  for (const [ANT, NOVA] of pares) {
    const e = EST(); e.ficha.alim.obs = ANT;
    tela(S, { est: JSON.parse(JSON.stringify(e)) }); CTX(S, { est: JSON.parse(JSON.stringify(e)) });
    S.run(`__M.comida.obs=${JSON.stringify(NOVA)};`);
    igual(S.J('mcrDiffComida(__M.comidaAntes, __M.comida)'), ['Observação da alimentação: ' + ANT + ' → ' + NOVA], ANT);
    igual(S.J('mcrTemMudanca(__M)'), true, ANT);
    igual(S.J('mcrValidar(__M, 480)'), [], ANT + ': com motivo e nome, pronto para conferir (nada de «Nada mudou»)');
    igual(S.J('mcrMontar(__M, __Ci).up')[P1 + 'ficha/alim/obs'], NOVA, ANT + ': gravado');
  }
});
prova('A', 'AC2.3 — «Sair sem salvar?» pergunta quando só a observação foi mexida', async () => {
  tela(S);
  S.run(`__bkZ6121={p:zPergunta, f:mcrFechar}; __perg=[]; __fechou=0; zPergunta=function(t){ __perg.push(t); return Promise.resolve(false); }; mcrFechar=function(){ __fechou++; }; MCR=__M;`);
  try {
    S.run('mcrFecharPergunta();');
    igual(S.J('[__perg, __fechou]'), [[], 1], 'sem mudança, fecha direto');
    S.run(`MCR.comida.obs=${JSON.stringify(OBS_CERTA)}; mcrFecharPergunta();`); await volta();
    igual(S.J('[__perg, __fechou]'), [['Sair sem salvar?'], 1]);
  } finally { S.run('zPergunta=__bkZ6121.p; mcrFechar=__bkZ6121.f; MCR=null;'); }
});
prova('A', 'AC3.1 — só a observação mudou: grava SÓ ficha/alim/obs (texto aparado) e os caminhos de toda mudança de comida; nada de ficha/alim inteiro, confirmacao, refs nem derivados; a Conferência não reabre', () => {
  tela(S); CTX(S);
  S.run(`__M.comida.obs='  ${OBS_CERTA}  ';`);
  const G = S.J('__G=mcrMontar(__M, __Ci)');
  igual(Object.keys(G.up).sort(), [P1 + '_ts', P1 + '_ultimaEdicao', P1 + 'alteracoes/a1', P1 + 'conferencia/resolvidos/' + TS, P1 + 'conferencia/ultima_solucao', P1 + 'ficha/alim/obs'].sort(), 'a lista da 6.54 AC5/AC7 com ficha/alim/obs no lugar de ficha/alim');
  igual(G.up[P1 + 'ficha/alim/obs'], OBS_CERTA, 'o texto novo, aparado');
  // a estadia antes e depois de aplicar a gravação: dentro de ficha, só alim.obs muda
  S.ctx.__ant = EST(); const depois = S.J(`mcrAplicarCaminhos(JSON.parse(JSON.stringify(__ant)), __G.up, '${P1}')`), antes = EST();
  const alimSemObs = (a) => { const c = JSON.parse(JSON.stringify(a)); delete c.obs; return c; };
  igual(alimSemObs(depois.ficha.alim), alimSemObs(antes.ficha.alim), 'confirmacao, refs, qtd, minimo, deficit: idênticos');
  igual(depois.ficha.alim.obs, OBS_CERTA);
  igual(Object.keys(depois.ficha).filter((k) => k !== 'alim').map((k) => [k, depois.ficha[k]]), Object.keys(antes.ficha).filter((k) => k !== 'alim').map((k) => [k, antes.ficha[k]]), 'o resto da ficha da estadia: igual');
  const fora = ['ficha', 'alteracoes', 'conferencia', '_ts', '_ultimaEdicao'];
  igual(Object.keys(depois).filter((k) => fora.indexOf(k) < 0).map((k) => [k, depois[k]]), Object.keys(antes).filter((k) => fora.indexOf(k) < 0).map((k) => [k, antes[k]]), 'medicação, pertences, assinatura, datas: iguais');
  igual(depois.conferencia.concluida, true, 'a Conferência não reabre');
  igual(G.estNova.ficha.alim.obs, OBS_CERTA, 'a estadia nova da tela também');
});
prova('A', 'AC3.1 — estadia de formato antigo (sem refs): corrigir a observação não cria refs', () => {
  const e = EST_ANTIGA();
  tela(S, { est: e }); CTX(S, { est: EST_ANTIGA() });
  S.run(`__M.comida.obs=${JSON.stringify(OBS_CERTA)};`);
  const G = S.J('__G=mcrMontar(__M, __Ci)');
  igual(Object.keys(G.up).filter((k) => k.indexOf(P1 + 'ficha') === 0), [P1 + 'ficha/alim/obs']);
  igual('refs' in G.estNova.ficha.alim, false, 'continua sem refs');
  igual([G.estNova.ficha.alim.refeicoes, G.estNova.ficha.alim.qtd, G.estNova.ficha.alim.obs], ['2', '50', OBS_CERTA]);
});
prova('A', 'AC3.2 — a ficha do FILHOt não muda (interruptor ligado): fichaPlano null, nada chama setPelExtra; «Confira» diz «Só desta hospedagem: a ficha não muda.»', () => {
  tela(S); CTX(S);
  igual(S.J('__M.ficha'), true, 'o interruptor «Guardar também na ficha» está ligado');
  S.run(`__M.comida.obs=${JSON.stringify(OBS_CERTA)};`);
  const G = S.J('__G=mcrMontar(__M, __Ci)');
  igual(G.fichaPlano, null);
  const conf = S.run('mcrConferirHTML(__M)');
  assert.ok(conf.indexOf('Só desta hospedagem: a ficha não muda.') >= 0, 'a frase de hoje');
  assert.ok(conf.indexOf('também muda') < 0, 'e não diz que a ficha muda');
  assert.ok(conf.indexOf('Observação da alimentação: ' + OBS_ERRADA + ' → ' + OBS_CERTA) >= 0, 'o resumo da observação na conferência');
  S.run(`__bkSP6121={sp:setPelExtra, au:audit, zc:zCarimbar, rh:renderHosp, cf:checarFaltasDaEstadia}; __sp=0; setPelExtra=function(){ __sp++; return Promise.resolve({ok:true}); };
    audit=function(){}; zCarimbar=function(){}; renderHosp=function(){}; checarFaltasDaEstadia=function(){};
    __M.mestreRef={n:'Teste 01', tutor:'Tutor Teste'}; __bkET6121=EST_TODAS; EST_TODAS={}; mcrDepoisDeSalvar(__M, __G, __Ci);`);
  try { igual(S.J('__sp'), 0, 'setPelExtra não foi chamado'); }
  finally { S.run('setPelExtra=__bkSP6121.sp; audit=__bkSP6121.au; zCarimbar=__bkSP6121.zc; renderHosp=__bkSP6121.rh; checarFaltasDaEstadia=__bkSP6121.cf; EST_TODAS=__bkET6121;'); }
});
prova('A', 'AC3.3 — apagar a observação grava \'\' (não null: o nó fica, como o check-in grava) e a frase diz «… → sem observação»; sem ficha.alim, grava só ficha/alim/obs', () => {
  tela(S); CTX(S);
  S.run(`__M.comida.obs='   ';`);
  let G = S.J('__G=mcrMontar(__M, __Ci)');
  assert.ok(P1 + 'ficha/alim/obs' in G.up, 'o caminho vai na gravação');
  igual(G.up[P1 + 'ficha/alim/obs'], '', 'texto vazio, não null');
  igual(G.frases, ['Observação da alimentação: ' + OBS_ERRADA + ' → sem observação']);
  igual(G.estNova.ficha.alim.obs, '', 'o nó fica, vazio');
  const sem = EST(); delete sem.ficha.alim;
  tela(S, { est: sem }); const semC = EST(); delete semC.ficha.alim; CTX(S, { est: semC });
  S.run(`__M.comida.obs='dar morno';`);
  G = S.J('__G=mcrMontar(__M, __Ci)');
  igual(Object.keys(G.up).filter((k) => k.indexOf(P1 + 'ficha') === 0), [P1 + 'ficha/alim/obs']);
  igual(G.estNova.ficha.alim, { obs: 'dar morno' });
});
prova('A', 'AC3.4 — comidaMudou verdadeiro; a tela «Salvo.» diz «O Plantão já mostra a comida nova de Teste 01.»', () => {
  tela(S); CTX(S);
  S.run(`__M.comida.obs=${JSON.stringify(OBS_CERTA)}; __G=mcrMontar(__M, __Ci);`);
  igual(S.J('__G.comidaMudou'), true);
  S.run(`__M.etapa='salvo'; __M.final=__G.frases; __M.gravado=__G;`);
  assert.ok(S.run('mcrSalvoHTML(__M)').indexOf('O Plantão já mostra a comida nova de Teste 01.') >= 0);
});
prova('A', 'AC4.1 — observação MAIS a ração do jantar (50 → 45 g): grava ficha/alim inteiro como hoje (derivados, confirmacao) com a observação nova dentro; sem ficha/alim/obs à parte', () => {
  tela(S); CTX(S);
  S.run(`__M.comida.obs=${JSON.stringify(OBS_CERTA + '  ')}; __M.comida.refs.fixas.jantar.racao='45';`);
  const G = S.J('__G=mcrMontar(__M, __Ci)');
  igual(Object.keys(G.up).sort(), [P1 + '_ts', P1 + '_ultimaEdicao', P1 + 'alteracoes/a1', P1 + 'conferencia/resolvidos/' + TS, P1 + 'conferencia/ultima_solucao', P1 + 'ficha/alim'].sort());
  const a = G.up[P1 + 'ficha/alim'];
  // os derivados refeitos como no check-in: 6 dias; entrada 40 + 45, saída 30, dia cheio 30 + 40 + 45 → 85 + 4 × 115 + 30 = 575 g
  igual([a.obs, a.refs.fixas.jantar.racao, a.refs.fixas.almoco.racao, a.minimo, a.deficit, a.confirmacao.estado, a.confirmacao.via, a.confirmacao.quem], [OBS_CERTA, '45', '40', 575, -125, 'mudou', 'mudar-comida', 'Ana Teste']);
});
prova('A', 'AC4.1 — mudança de plano SEM mexer na observação: a observação da estadia é preservada, byte a byte', () => {
  const e = EST(); e.ficha.alim.obs = ' dar morno ';
  tela(S, { est: e }); const c = EST(); c.ficha.alim.obs = ' dar morno '; CTX(S, { est: c });
  S.run(`__M.comida.refs.fixas.jantar.racao='45';`);
  const G = S.J('__G=mcrMontar(__M, __Ci)');
  igual(G.up[P1 + 'ficha/alim'].obs, ' dar morno ', 'como estava (sem aparar: não foi mexida)');
  igual(P1 + 'ficha/alim/obs' in G.up, false);
  igual(G.frases, ['Jantar: 50 g → 45 g de ração'], 'nenhuma frase da observação');
});
prova('A', 'AC4.2 — o fichaPlano (interruptor ligado) nunca leva a observação: tem exatamente tipo, unidade, marca, refs e conf', () => {
  tela(S); CTX(S);
  S.run(`__M.comida.obs=${JSON.stringify(OBS_CERTA)}; __M.comida.refs.fixas.jantar.racao='45';`);
  const G = S.J('__G=mcrMontar(__M, __Ci)');
  igual(Object.keys(G.fichaPlano).sort(), ['conf', 'marca', 'refs', 'tipo', 'unidade']);
  assert.ok(JSON.stringify(G.fichaPlano).indexOf(OBS_CERTA) < 0 && JSON.stringify(G.fichaPlano).indexOf(OBS_ERRADA) < 0, 'nem o texto novo nem o antigo');
});
prova('A', 'AC4.3 — observação MAIS «Não trouxe ração»: grava a observação (só ficha/alim/obs) E alimentacao, como hoje', () => {
  tela(S); CTX(S);
  S.run(`__M.comida.obs=${JSON.stringify(OBS_CERTA)}; __M.comida.semRacao=true;`);
  const G = S.J('__G=mcrMontar(__M, __Ci)');
  igual(Object.keys(G.up).filter((k) => k.indexOf(P1 + 'ficha') === 0 || k === P1 + 'alimentacao').sort(), [P1 + 'alimentacao', P1 + 'ficha/alim/obs']);
  igual([G.up[P1 + 'ficha/alim/obs'], G.up[P1 + 'alimentacao'].sem_racao, G.up[P1 + 'alimentacao'].quem], [OBS_CERTA, true, 'Ana Teste']);
  igual(G.comidaMudou, true);
});
prova('A', 'AC5.1 — o rastro: comida.antes.obs e .depois.obs; a frase em frases, _ultimaEdicao.mudou e conferencia/resolvidos; o apêndice do PDF com «->»', () => {
  tela(S); CTX(S);
  S.run(`__M.comida.obs=${JSON.stringify(OBS_CERTA)};`);
  const G = S.J('__G=mcrMontar(__M, __Ci)');
  const al = G.up[P1 + 'alteracoes/a1'], FR = 'Observação da alimentação: ' + OBS_ERRADA + ' → ' + OBS_CERTA;
  igual([al.comida.antes.obs, al.comida.depois.obs], [OBS_ERRADA, OBS_CERTA], 'o texto errado fica no rastro');
  igual([al.quem, al.motivo, al.frases], ['Ana Teste', 'a tutora corrigiu o nome dele', [FR]]);
  igual(G.up[P1 + '_ultimaEdicao'].mudou, [FR]);
  igual(G.up[P1 + 'conferencia/resolvidos/' + TS].mudou, [FR]);
  S.ctx.__alt = { a1: al };
  const ap = S.J('mcrPdfApendice(__alt)');
  igual(ap.length, 1); igual(ap[0].titulo, 'ALTERAÇÕES DEPOIS DO CHECK-IN');
  assert.ok(ap[0].linhas.some((l) => l.t === 'Observação da alimentação: ' + OBS_ERRADA + ' -> ' + OBS_CERTA), JSON.stringify(ap[0].linhas));
});
prova('A', 'AC5.1 — só a observação: o rastro não marca «só desta vez» (a ficha nem entra na conta) e a próxima abertura não avisa disso; mudança de plano «só desta vez» continua marcando', () => {
  tela(S); CTX(S);
  S.run(`__M.comida.obs=${JSON.stringify(OBS_CERTA)};`);
  let G = S.J('__G=mcrMontar(__M, __Ci)');
  igual('ficha' in G.up[P1 + 'alteracoes/a1'].comida, false);
  tela(S, { est: G.estNova });
  igual(S.J('__M.teveSoDestaVez'), false, 'a próxima tela não diz «Antes, uma mudança foi só desta vez»');
  tela(S); CTX(S);
  S.run(`__M.ficha=false; __M.comida.refs.fixas.jantar.racao='45'; __M.comida.obs=${JSON.stringify(OBS_CERTA)};`);
  G = S.J('__G=mcrMontar(__M, __Ci)');
  igual(G.up[P1 + 'alteracoes/a1'].comida.ficha, false, 'plano «só desta vez» (com a observação junto): como hoje');
  tela(S); CTX(S);
  S.run(`__M.comida.semRacao=true; __M.comida.obs=${JSON.stringify(OBS_CERTA)};`);
  igual(S.J('mcrMontar(__M, __Ci).up["' + P1 + 'alteracoes/a1"].comida.ficha'), false, '«Não trouxe ração» junto: como hoje');
});
prova('A', 'AC5.2 — nenhuma mensagem nova ao Telegram: G.tg vazio', () => {
  tela(S); CTX(S);
  S.run(`__M.comida.obs=${JSON.stringify(OBS_CERTA)};`);
  igual(S.J('mcrMontar(__M, __Ci).tg'), []);
});
prova('A', 'AC5.3 — outra pessoa mudou a observação depois que a tela abriu: salvar recusa («…mudou depois que esta tela abriu… Nada foi salvo»)', () => {
  tela(S);
  const outra = EST(); outra.ficha.alim.obs = 'dar morno'; outra._ultimaEdicao = { quem: 'Bia Teste', ts: TS };
  CTX(S, { est: outra });
  S.run(`__M.comida.obs=${JSON.stringify(OBS_CERTA)};`);
  const r = S.J('mcrConferirAntes(__M, __Ci)');
  assert.ok(r.some((f) => /mudou depois que esta tela abriu/.test(f) && /Nada foi salvo/.test(f)), r.join(' | '));
});
prova('A', 'AC5.4 e AC15 — de ponta a ponta no banco de mentira: abrir e salvar contam as MESMAS leituras e a MESMA gravação de uma mudança de comida; EST_TODAS, CF_ESTADIAS e o cartão do Almoço mostram o texto novo', async () => {
  // a base: abrir + mudar a ração do jantar + salvar (a observação a base não salva). O novo: o mesmo, e só a observação.
  async function ponta(S0, mexer) {
    const B = criarBanco({ auaulandia: { estadias: { e1: EST() }, 'medicacao-agenda': {}, 'medicacao-log': {} } });
    S0.ctx.__B = B; S0.el('mcrTela');
    S0.run(`__bkPP6121={db:DB, au:audit, zc:zCarimbar, rh:renderHosp, cf:checarFaltasDaEstadia, sp:setPelExtra, ma:mcrAvisarPlantao};
      DB=__B; PELUDINHOS=[]; audit=function(){}; zCarimbar=function(){}; renderHosp=function(){}; checarFaltasDaEstadia=function(){}; setPelExtra=function(){ return Promise.resolve({ok:true}); };
      EST_TODAS={e1:JSON.parse(JSON.stringify(__B.get('auaulandia/estadias/e1')))}; CF_ESTADIAS={'${KH}':{id:'e1', e:EST_TODAS.e1}}; CF_ESTADIAS_LIDO=true; MCR=null;`);
    try {
      S0.run(`mcrAbrirEstadia('e1', 'hospedes');`); await volta();
      const abrirN = Object.assign({}, B.n);
      assert.ok(S0.run('!!MCR'), 'a tela abriu');
      igual(S0.J('MCR.bloqueio'), '', 'sem bloqueio de identidade');
      S0.run(`MCR.motivo='a tutora corrigiu o nome dele'; MCR.quem='Ana Teste'; ${mexer}`);
      const antesSalvar = Object.assign({}, B.n);
      S0.run('mcrGravar();'); await volta();
      const salvarN = {}; Object.keys(B.n).forEach((k) => { salvarN[k] = B.n[k] - antesSalvar[k]; });
      const caminhos = B.log.map((x) => x[0] + ' ' + String(x[1]).replace(/alteracoes\/a_[^/]+/, 'alteracoes/{aid}'));
      return { abrirN, salvarN, caminhos, etapa: S0.J('MCR.etapa'), erro: S0.J('MCR.erro'), banco: B.get('auaulandia/estadias/e1'), estTodas: S0.J('EST_TODAS.e1'), cf: S0.J(`CF_ESTADIAS['${KH}'].e`) };
    } finally { S0.run('DB=__bkPP6121.db; audit=__bkPP6121.au; zCarimbar=__bkPP6121.zc; renderHosp=__bkPP6121.rh; checarFaltasDaEstadia=__bkPP6121.cf; setPelExtra=__bkPP6121.sp; mcrAvisarPlantao=__bkPP6121.ma; MCR=null;'); }
  }
  const SBx = base();
  // a primeira abertura de cada página liga coisas de uma vez só (o sinal de conexão, o registro do aparelho): fica fora da conta
  await ponta(SBx, "MCR.comida.refs.fixas.jantar.racao='45';"); await ponta(S, "MCR.comida.refs.fixas.jantar.racao='45';");
  const b = await ponta(SBx, "MCR.comida.refs.fixas.jantar.racao='45';");
  const n = await ponta(S, "MCR.comida.refs.fixas.jantar.racao='45';");
  const o = await ponta(S, `mcrSetComidaTx('obs', ${JSON.stringify(OBS_CERTA)});`);
  igual([b.etapa, n.etapa, o.etapa], ['salvo', 'salvo', 'salvo'], 'os três salvaram: ' + [b.erro, n.erro, o.erro].join(' | '));
  console.log('      (abrir: base ' + JSON.stringify(b.abrirN) + ' · novo ' + JSON.stringify(n.abrirN) + ' · obs ' + JSON.stringify(o.abrirN) + ')');
  console.log('      (salvar: base ' + JSON.stringify(b.salvarN) + ' · novo ' + JSON.stringify(n.salvarN) + ' · obs ' + JSON.stringify(o.salvarN) + ')');
  igual(n.abrirN, b.abrirN, 'abrir a tela: as mesmas leituras da base');
  igual(o.abrirN, b.abrirN, 'abrir a tela para corrigir a observação: as mesmas leituras');
  igual(n.salvarN, b.salvarN, 'salvar uma mudança de comida: o mesmo que a base');
  igual(o.salvarN, b.salvarN, 'salvar só a observação: as mesmas leituras e UMA gravação multi-caminho');
  igual([o.salvarN.update, o.salvarN.transaction, o.salvarN.set, o.salvarN.on], [1, 0, 0, 0]);
  igual(o.caminhos, b.caminhos, 'os mesmos caminhos lidos, na mesma ordem, e uma gravação');
  igual(n.caminhos, b.caminhos);
  igual([o.banco.ficha.alim.obs, o.estTodas.ficha.alim.obs, o.cf.ficha.alim.obs], [OBS_CERTA, OBS_CERTA, OBS_CERTA], 'o banco, EST_TODAS e CF_ESTADIAS com o texto novo');
  igual(o.banco.ficha.alim.confirmacao, EST().ficha.alim.confirmacao, 'a confirmação do check-in fica');
  // o cartão do Almoço desenhado em seguida (a mesma EST_TODAS que a tela deixou)
  const c = cartao(almoco(S, { estadias: { e1: o.estTodas } }).grid, 'Teste 01');
  assert.ok(c.indexOf(OBS_CERTA) >= 0 && c.indexOf(OBS_ERRADA) < 0, 'o cartão mostra o texto novo');
});
prova('A', 'AC6 — nenhuma permissão nova: «mudar-comida-remedio» é a mesma, PERM com 45 chaves e o mesmo conteúdo da base; as três portas da tela iguais', () => {
  const SBx = base();
  igual(S.J("PERM['mudar-comida-remedio']"), SBx.J("PERM['mudar-comida-remedio']"));
  igual(S.J('Object.keys(PERM).length'), 45);
  igual(h16(S.run('JSON.stringify(PERM)')), h16(SBx.run('JSON.stringify(PERM)')));
  ['mcrPode', 'mcrBotaoHospedesHTML', 'mcrBotaoCheckinHTML', 'mcrBotaoPlantaoHTML', 'mcrAbrirDoPlantao', 'mcrAbrirEstadia'].forEach((f) => igual(h16(S.run('String(' + f + ')')), h16(SBx.run('String(' + f + ')')), f));
});
// Sonda R2-Q3 do QA independente, rodada 2 (defeito QA2-r4: o campo só aparecia com «Guardar também na ficha» ligado, M.ficha; sumia
// para a Veterinária, que pode mudar a comida mas não a ficha, e para o hóspede sem ficha-mestre ligada, o caso do QA M1).
prova('A', 'AC6 e AC1.2 (sonda R2-Q3 do QA) — papel por papel, num banco que conta: Encãotador(a), Plantão, Plantonista e Recepção não abrem (0 leituras, 0 gravações); Consultora, Veterinária, Gestão, Supervisão e Diretoria abrem e veem o campo, também sem poder mudar a ficha e sem ficha-mestre ligada', async () => {
  const campos = (h) => (h.match(/<textarea[^>]*mcrSetComidaTx\('obs'/g) || []).length;
  const res = {};
  for (const papel of ['monitor', 'plantao', 'plantonista', 'recepcao', 'consultora', 'vet', 'gestao', 'supervisor', 'diretoria']) {
    const B = criarBanco({ auaulandia: { estadias: { e1: EST() } } });
    S.ctx.__B = B; S.ctx.document.body.dataset.role = papel;
    S.run(`__bkPA6121={db:DB, za:zAlertao}; DB=__B; PELUDINHOS=[]; __alertas=[]; zAlertao=function(t){ __alertas.push(t); return Promise.resolve(); }; MCR=null;`);
    try {
      S.run(`mcrAbrirEstadia('e1', 'hospedes');`); await volta();
      const aberto = S.run('!!MCR');
      res[papel] = { alertas: S.J('__alertas'), aberto, leituras: B.n.once, gravacoes: B.n.update + B.n.set + B.n.transaction + B.n.push + B.n.remove,
        campo: aberto ? campos(S.run('mcrComidaHTML(MCR)')) : 0, podeFicha: aberto ? S.J('MCR.podeFicha') : null, ficha: aberto ? S.J('MCR.ficha') : null };
    } finally { S.run('DB=__bkPA6121.db; zAlertao=__bkPA6121.za; MCR=null;'); S.ctx.document.body.dataset.role = 'gestao'; }
  }
  console.log('      ' + JSON.stringify(res));
  ['monitor', 'plantao', 'plantonista', 'recepcao'].forEach((p) => igual([res[p].alertas, res[p].aberto, res[p].leituras, res[p].gravacoes], [['SEM PERMISSÃO PARA MUDAR'], false, 0, 0], p));
  // na turma de mentira não há ficha-mestre (PELUDINHOS vazio): M.ficha é falso para todos, que é o caso do hóspede do QA M1
  ['consultora', 'vet', 'gestao', 'supervisor', 'diretoria'].forEach((p) => igual([res[p].aberto, res[p].campo, res[p].ficha, res[p].gravacoes], [true, 1, false, 0], p + ': abre, vê o campo uma vez, sem ficha-mestre ligada, sem gravar'));
  igual(res.vet.podeFicha, false, 'a Veterinária não muda a ficha (o campo não pode depender disso)');
  // a mesma regra no estado puro da tela: com a ficha-mestre (controle), sem poder mudar a ficha, sem ficha-mestre e com o interruptor desligado
  tela(S); igual([S.J('__M.ficha'), campos(S.run('mcrComidaHTML(__M)'))], [true, 1], 'controle: ficha-mestre ligada');
  S.run('__M.ficha=false;'); igual(campos(S.run('mcrComidaHTML(__M)')), 1, '«Guardar também na ficha» desligado');
  tela(S, { podeFicha: false }); igual([S.J('__M.ficha'), campos(S.run('mcrComidaHTML(__M)'))], [false, 1], 'sem poder mudar a ficha (Veterinária)');
  tela(S, { mestre: null }); igual([S.J('__M.ficha'), campos(S.run('mcrComidaHTML(__M)'))], [false, 1], 'sem ficha-mestre ligada');
});

// ================================================================== B — a observação sai do vermelho (pergunta 73)
const TESTE01_SEM_FICHA = () => ({ estadias: { e1: EST() } });
prova('B', 'AC7.1 — hóspede sem restrição no cadastro: a observação NÃO está em nenhum vermelho; vai numa faixa janta-box «Observação do check-in: …» logo acima dos botões', () => {
  const c = cartao(almoco(S, TESTE01_SEM_FICHA()).grid, 'Teste 01');
  vermelhos(c).forEach((v) => assert.ok(v.indexOf(OBS_ERRADA) < 0, 'a observação dentro de um vermelho: ' + v));
  igual(faixas(c), ['<div class="janta-box">Observação do check-in: ' + OBS_ERRADA + '</div>']);
  const iF = c.indexOf('<div class="janta-box">'), iB = c.indexOf('<div class="alm-actions">');
  assert.ok(iF >= 0 && iB > iF, 'a faixa vem antes dos botões');
  const entre = c.slice(c.indexOf('</div>', iF) + 6, iB);
  igual(entre.replace(/\s+/g, ''), '</div>', 'logo acima: entre a faixa e os botões, só o fecho do alm-info');
  assert.ok(c.indexOf('Informado no check-in desta hospedagem') >= 0, 'a linha do check-in fica');
  assert.ok(/<span>Quantidade<\/span><b>40 gramas de ração<\/b>/.test(c), 'a quantidade fica');
});
prova('B', 'AC7.1 — a faixa vem DEPOIS do «SÓ HOJE» (almExcecaoHTML) e antes dos botões', () => {
  const k = S.run("dcKey('Teste 01','Tutor Teste')");
  const c = cartao(almoco(S, Object.assign(TESTE01_SEM_FICHA(), { excecoes: { [k]: { oque: 'frango cozido', quanto: '30 g', quem: 'Recepção Teste' } } })).grid, 'Teste 01');
  const iX = c.indexOf('<div class="alm-excecao">'), iF = c.indexOf('<div class="janta-box">'), iB = c.indexOf('<div class="alm-actions">');
  assert.ok(iX >= 0 && iX < iF && iF < iB, [iX, iF, iB].join(' < '));
});
prova('B', 'AC7.1(c) — «Comedouro LENTO», «Informado no check-in desta hospedagem» e as linhas de alimentação e quantidade ficam como estão (hóspede que também é aluno)', () => {
  const p = { n: 'Teste 03', tutor: 'Tutor Teste', raca: 'SRD', dias: ['seg'] };
  const e = EST({ nome: 'Teste 03', refKey: 'teste 03__tutor teste' });
  const c = cartao(almoco(S, { alunos: [{ p }], cad: { 'Teste 03': { lento: true, alim: 'Ração', quant: '40 g' } }, estadias: { e3: e } }).grid, 'Teste 03');
  assert.ok(c.indexOf('<div class="alm-badge">Comedouro LENTO</div>') >= 0, 'LENTO');
  assert.ok(c.indexOf('Informado no check-in desta hospedagem') >= 0);
  assert.ok(/<span>Quantidade<\/span><b>40 gramas de ração<\/b>/.test(c) && /<b>Ração<\/b>/.test(c));
  igual(faixas(c).length, 1);
});
prova('B', 'AC7.2 — restrição no cadastro («RESTRIÇÃO A TUDO») e SEM observação: o vermelho de hoje (sem prefixo, porque já diz «restri»), sem faixa', () => {
  const p = { n: 'Teste 04', tutor: 'Tutor Teste', raca: 'SRD', dias: ['seg'] };
  const e = EST({ nome: 'Teste 04', refKey: 'teste 04__tutor teste' }); e.ficha.alim.obs = '';
  const c = cartao(almoco(S, { alunos: [{ p }], cad: { 'Teste 04': { restr: 'RESTRIÇÃO A TUDO', alim: 'Ração' } }, estadias: { e4: e } }).grid, 'Teste 04');
  assert.ok(vermelhos(c).indexOf('<div class="alm-restr">&#9888; RESTRIÇÃO A TUDO</div>') >= 0, vermelhos(c).join(' | '));
  igual(faixas(c), []);
  const p2 = { n: 'Teste 05', tutor: 'Tutor Teste', raca: 'SRD', dias: ['seg'] };
  const e2 = EST({ nome: 'Teste 05', refKey: 'teste 05__tutor teste' }); e2.ficha.alim.obs = '';
  const c2 = cartao(almoco(S, { alunos: [{ p: p2 }], cad: { 'Teste 05': { restr: 'frango', alim: 'Ração' } }, estadias: { e5: e2 } }).grid, 'Teste 05');
  assert.ok(vermelhos(c2).indexOf('<div class="alm-restr">&#9888; RESTRIÇÃO: frango</div>') >= 0, 'o prefixo com o acento da parte C: ' + vermelhos(c2).join(' | '));
});
prova('B', 'AC7.3 — restrição no cadastro E observação: os dois — o vermelho só com o cadastro e a faixa com a observação', () => {
  const p = { n: 'Teste 06', tutor: 'Tutor Teste', raca: 'SRD', dias: ['seg'] };
  const e = EST({ nome: 'Teste 06', refKey: 'teste 06__tutor teste' });
  const c = cartao(almoco(S, { alunos: [{ p }], cad: { 'Teste 06': { restr: 'frango', alim: 'Ração' } }, estadias: { e6: e } }).grid, 'Teste 06');
  const v = vermelhos(c).filter((x) => /frango/.test(x));
  igual(v, ['<div class="alm-restr">&#9888; RESTRIÇÃO: frango</div>'], 'o vermelho só com o cadastro');
  igual(faixas(c), ['<div class="janta-box">Observação do check-in: ' + OBS_ERRADA + '</div>']);
});
prova('B', 'AC7.4 — observação IGUAL a uma restrição do cadastro (maiúsculas, acentos e espaços nas pontas não contam): só o vermelho, sem repetir', () => {
  const p = { n: 'Teste 07', tutor: 'Tutor Teste', raca: 'SRD', dias: ['seg'] };
  const e = EST({ nome: 'Teste 07', refKey: 'teste 07__tutor teste' }); e.ficha.alim.obs = '  NÃO pode FRANGO ';
  const c = cartao(almoco(S, { alunos: [{ p }], cad: { 'Teste 07': { restr: 'não pode frango', alim: 'Ração' } }, extra: { 'Teste 07': { alergia: 'corante' } }, estadias: { e7: e } }).grid, 'Teste 07');
  igual(faixas(c), [], 'sem faixa');
  const v = vermelhos(c).filter((x) => /frango/i.test(x));
  igual(v.length, 1);
  igual((v[0].match(/frango/gi) || []).length, 1, 'o texto não se repete: ' + v[0]);
});
prova('B', 'AC7.5 — observação vazia, só espaços ou ausente: nenhuma faixa (nem o título sozinho)', () => {
  [' ', '', null].forEach((obs) => {
    const e = EST(); if (obs === null) delete e.ficha.alim.obs; else e.ficha.alim.obs = obs;
    const c = cartao(almoco(S, { estadias: { e1: e } }).grid, 'Teste 01');
    igual(faixas(c), [], JSON.stringify(obs));
    assert.ok(c.indexOf('Observação do check-in') < 0, 'sem o título sozinho');
    vermelhos(c).forEach((v) => assert.ok(!/RESTRI/.test(v), 'sem vermelho de restrição: ' + v));
  });
});
prova('B', 'AC7.6 — hóspede que também é aluno: a restrição e a alergia da ficha continuam no vermelho; a observação na faixa. Sem check-in (cadastro do Day Care como referência): sem faixa', () => {
  const p = { n: 'Teste 08', tutor: 'Tutor Teste', raca: 'SRD', dias: ['seg'] };
  const e = EST({ nome: 'Teste 08', refKey: 'teste 08__tutor teste' });
  const c = cartao(almoco(S, { alunos: [{ p }], cad: { 'Teste 08': { restr: '', alim: 'Ração' } }, extra: { 'Teste 08': { restricao: 'sem glúten', alergia: 'corante' } }, estadias: { e8: e } }).grid, 'Teste 08');
  assert.ok(vermelhos(c).some((v) => v.indexOf('sem glúten · corante') >= 0), vermelhos(c).join(' | '));
  vermelhos(c).forEach((v) => assert.ok(v.indexOf(OBS_ERRADA) < 0, v));
  igual(faixas(c).length, 1);
  // sem check-in ativo: o cadastro do Day Care é a referência («Informação a conferir»), e não há observação de check-in
  const sem = EST({ nome: 'Teste 08', refKey: 'teste 08__tutor teste', entrada: '2026-10-25', saida: '2026-10-27' });
  const c2 = cartao(almoco(S, { alunos: [{ p }], cad: { 'Teste 08': { restr: 'frango', alim: 'Ração Teste', quant: '40 g' } }, estadias: { e8: sem } }).grid, 'Teste 08');
  igual(faixas(c2), []);
  assert.ok(vermelhos(c2).some((v) => /frango/.test(v)), 'o vermelho do cadastro continua');
});
prova('B', 'AC7.7 — texto com <, & ou aspas sai escapado na faixa; texto comprido sai inteiro', () => {
  const longo = 'Dar "morno" <b>com</b> água & sal; ' + 'misturar o patê devagar e esperar esfriar antes de servir, '.repeat(6) + 'fim.';
  const e = EST(); e.ficha.alim.obs = longo;
  const c = cartao(almoco(S, { estadias: { e1: e } }).grid, 'Teste 01');
  const f = faixas(c);
  igual(f.length, 1);
  igual(f[0], '<div class="janta-box">Observação do check-in: ' + longo.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;') + '</div>');
  assert.ok(c.indexOf('<b>com</b>') < 0);
});
prova('B', 'AC7.8 — o módulo (require em Node) entrega a restrição do cadastro e a observação em campos distintos; restr e refeicaoDaEstadia(…,\'cafe\').restricao continuam como antes', () => {
  const caminho = path.join(PASTA, 'alimentacao-hospede.js');
  delete require.cache[require.resolve(caminho)];
  const M = require(caminho);
  const est = EST();
  const portas = { EST_TODAS: { e1: est }, zHojeISO: () => HOJE, mcrEstadiaDoHosp: (k, T) => ({ id: 'e1', est: T.e1 }), medAgendaKey: () => KH };
  const a = M.almocoDaLinha(portas, { estadiaId: 'e1', refKey: KH, p: { n: 'Teste 01', tutor: 'Tutor Teste' } }, { restr: 'frango', lento: true });
  igual([a.restrCadastro, a.obsCheckin], ['frango', OBS_ERRADA], 'os dois separados');
  igual(a.restr, 'frango · ' + OBS_ERRADA, 'restr continua juntando (quem lê restr hoje não muda)');
  igual(M.refeicaoDaEstadia(est, 'cafe').restricao, OBS_ERRADA, 'o contrato que o café lê');
  const sem = M.almocoParaCard({ origem: 'checkin-hotel', estado: 'oferecer', quantidade: { racao: '40' }, unidade: 'gramas', restricao: '', marca: 'Ração' }, null);
  igual([sem.restrCadastro, sem.obsCheckin, sem.restr], ['', '', '']);
  igual(Object.prototype.hasOwnProperty.call(M.almocoParaCard(null, { restr: 'x' }), 'obsCheckin'), false, 'o cadastro do Day Care como referência não ganha observação de check-in');
});
prova('B', 'AC8 — Café: a observação sai do vermelho para a MESMA faixa, logo acima dos botões; «sem ração» continua vermelho', () => {
  const g = cafe(S, { e1: EST() });
  const c = '<div class="pet alm-card' + g.split('<div class="pet alm-card')[1];
  vermelhos(c).forEach((v) => assert.ok(v.indexOf(OBS_ERRADA) < 0, 'a observação dentro de um vermelho: ' + v));
  igual(faixas(c), ['<div class="janta-box">Observação do check-in: ' + OBS_ERRADA + '</div>']);
  const iF = c.indexOf('<div class="janta-box">'), iB = c.indexOf('<div class="alm-actions">');
  assert.ok(iF >= 0 && iB > iF, 'antes dos botões');
  igual(c.slice(c.indexOf('</div>', iF) + 6, iB).replace(/\s+/g, ''), '</div>', 'logo acima');
  const e2 = EST(); e2.alimentacao = { sem_racao: true, comida_umida: true };
  const c2 = cafe(S, { e1: e2 });
  assert.ok(vermelhos(c2).some((v) => /SEM RAÇÃO/.test(v)), 'sem ração continua vermelho');
  const e3 = EST(); e3.ficha.alim.obs = '  ';
  igual(faixas(cafe(S, { e1: e3 })), [], 'observação em branco: sem faixa');
  const e4 = EST(); e4.ficha.alim.obs = 'a <b> & "x"';
  igual(faixas(cafe(S, { e1: e4 })), ['<div class="janta-box">Observação do check-in: a &lt;b> &amp; &quot;x&quot;</div>'], 'escapado');
});
prova('B', 'AC10.1 — um ponto só: a constante ALIM_OBS_CHECKIN_EM_FAIXA (true) e a função alimObsCheckinCartao, usadas pelos dois cartões', () => {
  igual(S.J('typeof ALIM_OBS_CHECKIN_EM_FAIXA'), 'boolean');
  igual(S.J('ALIM_OBS_CHECKIN_EM_FAIXA'), true, 'o Recomendado da pergunta 73 vale até a resposta');
  igual(S.J('typeof alimObsCheckinCartao'), 'function');
  assert.ok(S.run('String(renderAlmoco)').indexOf('alimObsCheckinCartao(') >= 0, 'o Almoço usa a função');
  assert.ok(S.run('String(renderCafe)').indexOf('alimObsCheckinCartao(') >= 0, 'o Café usa a função');
  assert.ok(S.run('String(alimObsCheckinCartao)').indexOf('ALIM_OBS_CHECKIN_EM_FAIXA') >= 0, 'a função lê a constante');
  igual(S.J("alimObsCheckinCartao('frango', ' dar morno ')"), { restr: 'frango', faixa: '<div class="alm-info"><div class="janta-box">Observação do check-in: dar morno</div></div>' });
  igual(S.J("alimObsCheckinCartao('', '')"), { restr: '', faixa: '' });
});
prova('B', 'AC10.2 — a constante em false: nenhuma faixa; o vermelho volta a trazer a observação JUNTO com o cadastro (cadastro · observação, sem repetir), com o acento da parte C', () => {
  S.run('ALIM_OBS_CHECKIN_EM_FAIXA=false;');
  try {
    const c = cartao(almoco(S, TESTE01_SEM_FICHA()).grid, 'Teste 01');
    igual(faixas(c), []);
    assert.ok(vermelhos(c).indexOf('<div class="alm-restr">&#9888; RESTRIÇÃO: ' + OBS_ERRADA + '</div>') >= 0, vermelhos(c).join(' | '));
    const p = { n: 'Teste 06', tutor: 'Tutor Teste', raca: 'SRD', dias: ['seg'] };
    const c2 = cartao(almoco(S, { alunos: [{ p }], cad: { 'Teste 06': { restr: 'frango', alim: 'Ração' } }, estadias: { e6: EST({ nome: 'Teste 06', refKey: 'teste 06__tutor teste' }) } }).grid, 'Teste 06');
    assert.ok(vermelhos(c2).indexOf('<div class="alm-restr">&#9888; RESTRIÇÃO: frango · ' + OBS_ERRADA + '</div>') >= 0, vermelhos(c2).join(' | '));
    igual(faixas(c2), []);
    const e7 = EST({ nome: 'Teste 07', refKey: 'teste 07__tutor teste' }); e7.ficha.alim.obs = 'frango';
    const c3 = cartao(almoco(S, { alunos: [{ p: { n: 'Teste 07', tutor: 'Tutor Teste', raca: 'SRD', dias: ['seg'] } }], cad: { 'Teste 07': { restr: 'frango', alim: 'Ração' } }, estadias: { e7 } }).grid, 'Teste 07');
    assert.ok(vermelhos(c3).indexOf('<div class="alm-restr">&#9888; RESTRIÇÃO: frango</div>') >= 0, 'sem repetir: ' + vermelhos(c3).join(' | '));
    const g = cafe(S, { e1: EST() });
    igual(faixas(g), []);
    assert.ok(vermelhos(g).indexOf('<div class="alm-restr">&#9888; ' + OBS_ERRADA + '</div>') >= 0, 'o café volta ao vermelho de antes: ' + vermelhos(g).join(' | '));
  } finally { S.run('ALIM_OBS_CHECKIN_EM_FAIXA=true;'); }
});
prova('B', 'AC10.2 — a constante em false devolve exatamente o cartão da base mais o acento da parte C (mesmo hóspede, mesma turma)', () => {
  const SBx = base();
  S.run('ALIM_OBS_CHECKIN_EM_FAIXA=false;');
  try {
    const turma = { alunos: [{ p: { n: 'Teste 06', tutor: 'Tutor Teste', raca: 'SRD', dias: ['seg'] } }], cad: { 'Teste 06': { restr: 'frango', alim: 'Ração', lento: true } }, estadias: { e1: EST(), e6: EST({ nome: 'Teste 06', refKey: 'teste 06__tutor teste' }) } };
    const novo = almoco(S, turma).grid, velho = almoco(SBx, turma).grid;
    const comAcento = (h) => h.replace(/RESTRICAO: /g, 'RESTRIÇÃO: ').replace(/>Alimentacao</g, '>Alimentação<').replace(/NAO ALMOCA</g, 'NÃO ALMOÇA<').replace(/Almoco nao cadastrado/g, 'Almoço não cadastrado');
    igual(novo, comAcento(velho));
  } finally { S.run('ALIM_OBS_CHECKIN_EM_FAIXA=true;'); }
});

// ---- As sondas Q5 a Q7 do QA independente, viradas prova (defeitos QA-d1, QA-d2 e QA-d4 passavam pelas provas acima)
prova('B', 'AC8 (sonda Q5 do QA) — café com «Não trouxe ração» e observação: o vermelho «SEM RAÇÃO» e a faixa com a observação, os dois', () => {
  const e = EST(); e.alimentacao = { sem_racao: true, comida_umida: true };
  const g = cafe(S, { e1: e });
  assert.ok(vermelhos(g).some((v) => /SEM RAÇÃO/.test(v)), 'sem ração em vermelho: ' + vermelhos(g).join(' | '));
  igual(faixas(g), ['<div class="janta-box">Observação do check-in: ' + OBS_ERRADA + '</div>'], 'a observação não some do cartão');
});
prova('B', 'AC7.4 (sonda Q6 do QA) — observação que CONTÉM a restrição do cadastro e mais uma instrução: o vermelho do cadastro e a faixa inteira (só a observação IGUAL deixa de repetir)', () => {
  const p = { n: 'Teste 16', tutor: 'Tutor Teste', raca: 'SRD', dias: ['seg'] };
  const e = EST({ nome: 'Teste 16', refKey: 'teste 16__tutor teste' }); e.ficha.alim.obs = 'Não pode frango; servir morno, devagar';
  const c = cartao(almoco(S, { alunos: [{ p }], cad: { 'Teste 16': { restr: 'não pode frango', alim: 'Ração' } }, estadias: { e16: e } }).grid, 'Teste 16');
  igual(vermelhos(c).filter((v) => /frango/i.test(v)), ['<div class="alm-restr">&#9888; RESTRIÇÃO: não pode frango</div>'], 'o vermelho só com o cadastro');
  igual(faixas(c), ['<div class="janta-box">Observação do check-in: Não pode frango; servir morno, devagar</div>'], '«servir morno, devagar» não se perde');
});
prova('B', 'AC7.1 e AC7.6 (sonda Q7 do QA) — check-in «a conferir quantidade» (almoço sem ração na ficha): a observação na faixa, fora do vermelho; a alergia da ficha no vermelho', () => {
  const p = { n: 'Teste 17', tutor: 'Tutor Teste', raca: 'SRD', dias: ['seg'] };
  const e = EST({ nome: 'Teste 17', refKey: 'teste 17__tutor teste' }); e.ficha.alim.refs.fixas.almoco.racao = '';
  const c = cartao(almoco(S, { alunos: [{ p }], cad: { 'Teste 17': { restr: '', alim: 'Ração' } }, extra: { 'Teste 17': { alergia: 'corante' } }, estadias: { e17: e } }).grid, 'Teste 17');
  assert.ok(c.indexOf('<div class="alm-restr">Confirme a refeição e a quantidade antes de servir.</div>') >= 0, 'o cartão está «a conferir»');
  igual(vermelhos(c).filter((v) => /corante/.test(v)), ['<div class="alm-restr">&#9888; RESTRIÇÃO: corante</div>'], 'a alergia no vermelho, sem a observação junto');
  vermelhos(c).forEach((v) => assert.ok(v.indexOf(OBS_ERRADA) < 0, 'observação fora do vermelho: ' + v));
  igual(faixas(c), ['<div class="janta-box">Observação do check-in: ' + OBS_ERRADA + '</div>']);
});

// ---- QA M1: a restrição e a alergia da FICHA do hóspede em vermelho no Almoço e no Café, também para quem não tem entrada no
// Day Care (a sonda Q9 do QA, virada prova). A restrição entra pelo caminho do check-in («Tem restrição ou alergia?» → «O que
// ele NÃO pode?», ciSalvarRestricao, sem banco: guarda no aparelho e em pelCadCache); a alergia, pelo retrato vivo de
// daycare/cadastro (pelCadCache, o que o ouvinte do app entrega). As duas são o que a tarja da ficha lê (extraDoHosp).
function fichaDoHospede(S0, restricao, alergia) {
  S0.el('ciRestricaoTexto').value = restricao;
  S0.run(`__bkCi6121=ciHosp; ciHosp={nome:'Teste 01', tutor:'Tutor Teste', raca:'SRD', refKey:'${KH}'}; ciSalvarRestricao(); ciHosp=__bkCi6121;
    pelCadCache['${KH}']=Object.assign({}, pelCadCache['${KH}']||{}, {alergia:${JSON.stringify(alergia)}});`);
}
const semFicha = (S0) => S0.run(`delete pelCadCache['${KH}'];`);
const RF = '<div class="alm-restr">&#9888; RESTRIÇÃO: frango · corante</div>';
prova('B', 'M1 (sonda Q9 do QA) — hóspede SEM entrada no Day Care com restrição (gravada pelo check-in) e alergia na ficha: o Almoço e o Café em vermelho com as duas, sem faixa; é a mesma tarja da ficha (extraDoHosp)', () => {
  fichaDoHospede(S, 'frango', 'corante');
  try {
    igual(S.J(`(function(x){ return [x.restricao, x.alergia]; })(extraDoHosp({nome:'Teste 01', tutor:'Tutor Teste', refKey:'${KH}'}))`), ['frango', 'corante'], 'a tarja da ficha do hóspede');
    const e = EST(); e.ficha.alim.obs = '';
    const r = almoco(S, { estadias: { e1: e } });
    assert.ok(r.grid.indexOf('abrirPeludinhoDay(') < 0, 'o hóspede não tem entrada no Day Care (índice hosp…)');
    const c = cartao(r.grid, 'Teste 01');
    igual(vermelhos(c), [RF], 'Almoço');
    igual(faixas(c), []);
    const g = cafe(S, { e1: e });
    igual(vermelhos(g), [RF], 'Café');
    igual(faixas(g), []);
  } finally { semFicha(S); }
});
prova('B', 'M1 (sonda Q9 do QA) — a mesma ficha MAIS a observação do check-in: o vermelho com as duas e a faixa amarela também, no Almoço e no Café', () => {
  fichaDoHospede(S, 'frango', 'corante');
  try {
    const e = EST(); e.ficha.alim.obs = 'alérgico a frango, não dar petisco';
    const FX = ['<div class="janta-box">Observação do check-in: alérgico a frango, não dar petisco</div>'];
    const c = cartao(almoco(S, { estadias: { e1: e } }).grid, 'Teste 01');
    igual([vermelhos(c), faixas(c)], [[RF], FX], 'Almoço');
    const iV = c.indexOf(RF), iF = c.indexOf(FX[0]), iB = c.indexOf('<div class="alm-actions">');
    assert.ok(iV >= 0 && iV < iF && iF < iB, 'o vermelho em cima, a faixa logo acima dos botões');
    const g = cafe(S, { e1: e });
    igual([vermelhos(g), faixas(g)], [[RF], FX], 'Café');
  } finally { semFicha(S); }
});
prova('B', 'M1 (sonda Q9 do QA) — sem nada na ficha: nenhum vermelho (a observação vai na faixa); sem ficha e sem observação: nem vermelho nem faixa', () => {
  semFicha(S);
  const c = cartao(almoco(S, { estadias: { e1: EST() } }).grid, 'Teste 01');
  igual([vermelhos(c), faixas(c)], [[], ['<div class="janta-box">Observação do check-in: ' + OBS_ERRADA + '</div>']], 'Almoço');
  const g = cafe(S, { e1: EST() });
  igual([vermelhos(g), faixas(g).length], [[], 1], 'Café');
  const e = EST(); e.ficha.alim.obs = '';
  igual([vermelhos(cartao(almoco(S, { estadias: { e1: e } }).grid, 'Teste 01')), faixas(cafe(S, { e1: e }))], [[], []]);
});
prova('B', 'M1 — o hóspede que é aluno: o vermelho do Almoço é o de antes (sem dobrar); no Café, a ficha dele também fica em vermelho; o café do aluno do Day Care (sem hospedagem) não muda', () => {
  const p = { n: 'Teste 08', tutor: 'Tutor Teste', raca: 'SRD', dias: ['seg'] };
  const e = EST({ nome: 'Teste 08', refKey: 'teste 08__tutor teste' });
  const turma = { alunos: [{ p }], cad: { 'Teste 08': { restr: '', alim: 'Ração' } }, extra: { 'Teste 08': { restricao: 'sem glúten', alergia: 'corante' } }, estadias: { e8: e } };
  const c = cartao(almoco(S, turma).grid, 'Teste 08');
  igual(vermelhos(c), ['<div class="alm-restr">&#9888; RESTRIÇÃO: sem glúten · corante</div>'], 'Almoço: uma vez cada');
  const g = cafe(S, { e8: e });
  igual(vermelhos(g), ['<div class="alm-restr">&#9888; RESTRIÇÃO: sem glúten · corante</div>'], 'Café');
  igual(faixas(g).length, 1);
  // o aluno do Day Care no café (exceção da Recepção, sem hospedagem), mesmo com alergia na ficha: o cartão igual ao da base
  const alunoNoCafe = (S0) => {
    S0.run(`__bkCA6121=cafeAlunoDados; cafeAlunoDados=function(){ return {pronto:true, participantes:[{hospede:{nome:'Teste 19', tutor:'Tutor Teste', raca:'SRD', cafeAlunoKey:'ca19', cafeAluno:true}, plano:{origem:'cafe-aluno-excecao'}, porcao:{texto:'30 g · Recepção Teste'}}]}; };
      pelCadCache['teste 19__tutor teste']={alergia:'corante'};`);
    try { return cafe(S0, {}); } finally { S0.run(`cafeAlunoDados=__bkCA6121; delete pelCadCache['teste 19__tutor teste'];`); }
  };
  const ga = alunoNoCafe(S);
  assert.ok(ga.indexOf('Teste 19') >= 0, 'o aluno está no café');
  igual(vermelhos(ga), [], 'nenhum vermelho novo');
  igual(ga, alunoNoCafe(base()), 'o cartão do aluno no café é o da base');
});
prova('B', 'M1 — a constante da pergunta 73 em false não tira a ficha do vermelho: volta a juntar «ficha · observação», no Almoço e no Café', () => {
  fichaDoHospede(S, 'frango', 'corante');
  S.run('ALIM_OBS_CHECKIN_EM_FAIXA=false;');
  try {
    const J = '<div class="alm-restr">&#9888; RESTRIÇÃO: frango · corante · ' + OBS_ERRADA + '</div>';
    igual([vermelhos(cartao(almoco(S, { estadias: { e1: EST() } }).grid, 'Teste 01')), vermelhos(cafe(S, { e1: EST() }))], [[J], [J]]);
  } finally { S.run('ALIM_OBS_CHECKIN_EM_FAIXA=true;'); semFicha(S); }
});
prova('B', 'M1 e AC15 — abrir o Almoço (carregarAlmoco) e o Café (cafeCarregar) faz as MESMAS leituras da base, na mesma ordem, com a ficha preenchida; o vermelho da ficha vem só da memória', async () => {
  // páginas novas (a base e o novo), para contar a abertura de verdade; a ficha do hóspede já está em memória, como no app
  async function abertura(arq) {
    const X = abrir(arq);
    fichaDoHospede(X, 'frango', 'corante');
    almoco(X, { estadias: { e1: EST() } });
    const B = criarBanco({ daycare: {}, auaulandia: {} });
    X.ctx.__B = B; ['cafeGrid', 'cafeResumo', 'cafeBarraTempo'].forEach((id) => X.el(id));
    X.run(`DB=__B; dcAtiv='almoco'; almStep='grade'; hospedes=[]; carregarAlmoco();`); await volta();
    // o registro do aparelho usa um código sorteado por página: fica como {aparelho} para comparar
    const sem = (l) => l.map((x) => [x[0], String(x[1]).replace(/aparelhos\/[0-9a-f-]{36}/, 'aparelhos/{aparelho}')].concat(x.slice(2)));
    const almocoLog = sem(B.log.slice()); const grid = X.els.almGrid.innerHTML;
    X.run(`cafeLeitura={dia:'', geracao:0, cafe:'nao-lido', turno:'nao-lido', promessa:null}; cafeCarregar();`); await volta();
    const cafeLog = sem(B.log.slice(almocoLog.length));
    return { almocoLog, cafeLog, grid, cafeGrid: X.els.cafeGrid.innerHTML };
  }
  const n = await abertura(ARQ), b = await abertura(arqBase());
  console.log('      (abrir o Almoço: ' + n.almocoLog.length + ' chamadas ao banco; abrir o Café: ' + n.cafeLog.length + ')');
  assert.ok(n.almocoLog.length > 0 && n.cafeLog.length > 0, 'a abertura leu o banco (a conta não está vazia por engano)');
  igual(n.almocoLog, b.almocoLog, 'abrir o Almoço: as mesmas chamadas e caminhos da base');
  igual(n.cafeLog, b.cafeLog, 'abrir o Café: as mesmas chamadas e caminhos da base');
  igual(n.almocoLog.concat(n.cafeLog).filter((x) => /daycare\/cadastro/.test(x[1])), [], 'nenhuma leitura da ficha no banco');
  igual(vermelhos(cartao(n.grid, 'Teste 01')), [RF], 'o Almoço aberto mostra a ficha em vermelho');
  igual(vermelhos(n.cafeGrid), [RF], 'o Café aberto mostra a ficha em vermelho');
});
// Sonda R2-Q5 do QA independente, rodada 2 (defeito QA2-r2: a ficha entrava só no cartão do check-in confirmado; na conferência de
// identidade, com duas estadias ativas do mesmo hóspede sem entrada no Day Care, a alergia e a restrição da ficha sumiam do vermelho).
prova('B', 'M1 (sonda R2-Q5 do QA) — conferência de identidade (duas estadias ativas do hóspede sem entrada no Day Care): a restrição e a alergia da ficha continuam em vermelho; nenhuma das duas observações vira faixa', () => {
  fichaDoHospede(S, 'frango', 'corante');
  try {
    const e1 = EST(), e2 = EST({ _ts: 200 }); e2.ficha.alim.obs = 'Ração da outra estadia';
    const c = cartao(almoco(S, { estadias: { a1: e1, b1: e2 } }).grid, 'Teste 01');
    assert.ok(c.indexOf('<div class="alm-restr">Confirme a refeição e a quantidade antes de servir.</div>') >= 0, 'o cartão está na conferência de identidade');
    igual(vermelhos(c).filter((v) => /frango|corante/.test(v)), [RF], 'a ficha em vermelho, uma vez');
    igual(faixas(c), [], 'nenhuma observação de uma das duas estadias');
  } finally { semFicha(S); }
});
// Sonda R2-Q7 do QA independente, rodada 2 (defeito QA2-r3: no Café, o vermelho, que agora traz a ficha, saía sem escAttr; uma
// restrição escrita com «<», como «não dar <sem> petisco», virava tag e o texto sumia do vermelho).
prova('B', 'M1 (sonda R2-Q7 do QA) — a restrição da ficha com <, & e aspas sai escapada no vermelho do Almoço e do Café: nada vira tag, nada some', () => {
  fichaDoHospede(S, 'não dar <sem> petisco & "osso"', 'corante');
  try {
    const exp = ['<div class="alm-restr">&#9888; RESTRIÇÃO: não dar &lt;sem> petisco &amp; &quot;osso&quot; · corante</div>'];
    const c = cartao(almoco(S, { estadias: { e1: EST() } }).grid, 'Teste 01');
    igual(vermelhos(c), exp, 'Almoço');
    const g = cafe(S, { e1: EST() });
    igual(vermelhos(g), exp, 'Café');
    assert.ok(c.indexOf('<sem>') < 0 && g.indexOf('<sem>') < 0, 'nada vira tag');
  } finally { semFicha(S); }
});

// ================================================================== C — os textos do Almoço com acento
const TEXTOS_C = [
  ['Almoco - Quarta', 'Almoço - Quarta'], ['Inicio: <strong>', 'Início: <strong>'], ['&#9654; Iniciar almoco', '&#9654; Iniciar almoço'],
  ['<b>1</b>nao comeram', '<b>1</b>não comeram'], ['NAO COMERAM - vao para o 2&ordm; horario (1):', 'NÃO COMERAM - vão para o 2&ordm; horário (1):'],
  ['a planilha avisou a falta, entao sairam do almoco.', 'a planilha avisou a falta, então saíram do almoço.'],
  ['NAO ALMOCAM NORMALMENTE (1):', 'NÃO ALMOÇAM NORMALMENTE (1):'], ['Se hoje nao comerem, toque em <strong>Nao se aplica</strong>;', 'Se hoje não comerem, toque em <strong>Não se aplica</strong>;'],
  ['<span>Alimentacao</span>', '<span>Alimentação</span>'], ['>NAO ALMOCA</div>', '>NÃO ALMOÇA</div>'], ['Almoco nao cadastrado', 'Almoço não cadastrado'], ['RESTRICAO: frango', 'RESTRIÇÃO: frango'],
];
function turmaC(S0) {
  const al = (n) => ({ p: { n, tutor: 'Tutor Teste', raca: 'SRD', dias: ['seg'] } });
  const kN = S0.run("dcKey('Teste 11','Tutor Teste')");
  return almoco(S0, {
    alunos: [al('Teste 11'), al('Teste 12'), al('Teste 13'), al('Teste 14'), al('Teste 15')],
    cad: { 'Teste 11': { alim: 'Ração', quant: '40 g' }, 'Teste 12': { alim: 'Ração', quant: '40 g' }, 'Teste 13': { alim: 'Ração', quant: '40 g', nao: true }, 'Teste 15': { alim: 'Ração', quant: '40 g', restr: 'frango' } },
    marcas: { [kN]: 'nao' }, turno: { inicio: '11:30', quemInicio: 'Encãotadora Teste' },
    faltas: [{ p: { n: 'Teste 12', tutor: 'Tutor Teste' } }], estadias: {},
  });
}
prova('C', 'AC12 — os 11 lugares (20 palavras) na forma nova; nenhuma forma antiga em #almTurno, #almResumo e nos cartões', () => {
  const r = turmaC(S), tudo = r.turno + r.resumo + r.grid;
  const faltam = TEXTOS_C.filter(([, novo]) => tudo.indexOf(novo) < 0).map(([, novo]) => novo);
  igual(faltam, [], 'formas novas ausentes');
  const sobram = TEXTOS_C.filter(([velho]) => tudo.indexOf(velho) >= 0).map(([velho]) => velho);
  igual(sobram, [], 'formas antigas presentes');
  // texto de tela (não nome de função como marcarAlmoco nem classe como alm-btn nao): a palavra sem letra colada antes
  ['Almoco', 'Alimentacao', 'RESTRICAO', 'NAO ', 'horario', 'entao', 'sairam', 'Inicio'].forEach((w) => assert.ok(!new RegExp('(^|[^\\p{L}])' + w, 'u').test(tudo), 'sobrou «' + w + '»'));
});
prova('C', 'AC13.1 — os valores gravados e as classes seguem sem acento: marcarAlmoco(k,\'tudo\'|\'metade\'|\'nao\'|\'na\'), .alm-card.nao e .alm-btn.nao', () => {
  const r = turmaC(S), k = S.run("dcKey('Teste 11','Tutor Teste')");
  const c = cartao(r.grid, 'Teste 11');
  ['tudo', 'metade', 'nao', 'na'].forEach((v) => assert.ok(c.indexOf(`onclick="marcarAlmoco('${k}','${v}')"`) >= 0, v));
  assert.ok(c.indexOf('<div class="pet alm-card nao') === 0, 'a classe do cartão de quem não comeu');
  assert.ok(c.indexOf('class="alm-btn nao on"') >= 0, 'o botão');
  assert.ok(!/marcarAlmoco\([^)]*'não'\)/.test(r.grid), 'nenhum valor com acento');
});
prova('C', 'AC13.2 — nada fora de renderAlmoco muda de texto: hash por função igual à base em renderGenerico, avisoAlmoco2, empLista, empMensagem, iniciarAlmoco, encerrarAlmoco, marcarAlmoco, marcarAlmoco2; ATIVIDADES_DEFAULT byte a byte', () => {
  const SBx = base();
  ['renderGenerico', 'avisoAlmoco2', 'empLista', 'empMensagem', 'iniciarAlmoco', 'encerrarAlmoco', 'marcarAlmoco', 'marcarAlmoco2'].forEach((f) => igual(h16(S.run('String(' + f + ')')), h16(SBx.run('String(' + f + ')')), f));
  igual(S.run('JSON.stringify(ATIVIDADES_DEFAULT)'), SBx.run('JSON.stringify(ATIVIDADES_DEFAULT)'));
});
prova('C', 'AC13.3 — as linhas que a Fase 0 confere por texto em renderAlmoco ficam como estão', () => {
  const src = S.run('String(renderAlmoco)');
  assert.ok(src.indexOf('const faltouList=turma.filter(o=>almFaltouAvisada(o));') >= 0);
  assert.ok(src.indexOf('const list=ordemAlmoco(turma.filter(o=>!almFaltouAvisada(o)));') >= 0);
});

// ================================================================== R — varreduras contra a base
const semScripts = (html) => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const estilos = (html) => (semScripts(html).match(/<style\b[^>]*>[\s\S]*?<\/style>/gi) || []).join('\n');
const NAO_MUDA = ['alimDoHospede', 'alimMarcaDoCard', 'alimSemRacaoHTML', 'jantaSlotRender', 'abrirPlantao', 'renderCfFichaCompleta', 'ciFichaPdfBlob', 'ciColetarFicha', 'ciPlanoDaTela', 'ciPlanoGravarNaFicha', 'ciCorrigirExistente', 'ciDiffCorrecao', 'extraDoHosp', 'dashAutoCalcular', 'gradeAlmocoDados', 'almObsLimpa', 'renderGenerico', 'avisoAlmoco2', 'empMensagem', 'tgAvisar', 'avisarGrupoComida', 'marcarAlmoco', 'marcarAlmoco2', 'iniciarAlmoco', 'encerrarAlmoco', 'mcrEstadoInicial', 'mcrTemMudanca', 'mcrValidar', 'mcrConferirAntes', 'mcrFpEstadia', 'mcrGravar', 'mcrDepoisDeSalvar', 'mcrConferirHTML', 'mcrSalvoHTML', 'mcrSetComidaTx', 'alimDerivados', 'mcrAplicarCaminhos', 'mcrPdfApendice', 'podePapel', 'mcrComidaTudoHTML', 'mcrFecharPergunta', 'mcrAbrirEstadia'];
prova('R', 'AC9.1 — o texto das tags <style> do index.html é idêntico ao da base (nenhuma regra nova); a faixa usa só classes que já existem', () => {
  igual(h16(estilos(ARQ.html)), h16(estilos(arqBase().html)));
  const css = estilos(ARQ.html);
  assert.ok(/\.janta-box\{/.test(css) && /\.alm-info\{/.test(css), 'janta-box e alm-info já existem');
});
prova('R', 'AC10.1 — o título da faixa aparece UMA vez no arquivo (dentro da função), além da observação GERAL da Conferência; a constante só na declaração e na função', () => {
  const linhas = ARQ.html.split('\n').filter((l) => l.indexOf('Observação do check-in') >= 0);
  const daFaixa = linhas.filter((l) => l.indexOf('f.obsGeral') < 0);
  igual(daFaixa.length, 1, daFaixa.join('\n'));
  assert.ok(S.run('String(alimObsCheckinCartao)').indexOf('Observação do check-in: ') >= 0, 'a única vez é dentro da função');
  igual((ARQ.html.match(/ALIM_OBS_CHECKIN_EM_FAIXA/g) || []).length, 2, 'a declaração e a leitura na função');
  igual((ARQ.html.match(/class="janta-box">Observação/g) || []).length, 1);
});
prova('R', 'AC11 — hash por função IGUAL à base nas funções que não podem mudar; cafe-operacional.js e hospedes-atividades.js byte a byte', () => {
  const SBx = base();
  const dif = NAO_MUDA.filter((f) => h16(S.run('String(' + f + ')')) !== h16(SBx.run('String(' + f + ')')));
  igual(dif, [], 'mudaram');
  igual(h16(ARQ.cafe), h16(arqBase().cafe), 'cafe-operacional.js');
  igual(h16(ARQ.ativ), h16(arqBase().ativ), 'hospedes-atividades.js');
});
prova('R', 'AC14.1 — área protegida: as funções ck*/ckt*/pt* e pendAvisarChegada iguais à base (mesmos nomes, mesmo texto); PERM igual; #v-daycare igual; APP_VERSAO igual', () => {
  const SBx = base();
  const prot = (S0) => S0.J("Object.getOwnPropertyNames(globalThis).filter(function(k){ return typeof globalThis[k]==='function' && (/^(ck|ckt|pt)/.test(k) || k==='pendAvisarChegada'); }).sort()");
  const nN = prot(S), nB = prot(SBx);
  igual(nN, nB, 'nenhuma função nova com ck, ckt ou pt');
  const txt = (S0, ns) => ns.map((n) => n + '\n' + S0.run('String(' + n + ')')).join('\n');
  igual(h16(txt(S, nN)), h16(txt(SBx, nB)), 'o texto das ' + nN.length + ' funções');
  igual(h16(S.run('JSON.stringify(PERM)')), h16(SBx.run('JSON.stringify(PERM)')));
  const daycare = (html) => { const L = html.split('\n'); const i = L.findIndex((l) => l.indexOf('<section class="view" id="v-daycare">') >= 0); let j = i + 1; while (j < L.length && L[j].indexOf('<section class="view"') < 0) j++; return L.slice(i, j).join('\n'); };
  igual(h16(daycare(ARQ.html)), h16(daycare(arqBase().html)), '#v-daycare');
  const ver = (h) => (/const APP_VERSAO='([^']+)';/.exec(h) || [])[1];
  igual(ver(ARQ.html), ver(arqBase().html), 'APP_VERSAO não muda');
});
prova('R', 'AC14.2 — o módulo mudou, então o ?v= da linha dele trocou (2026-10-22-01); os outros ?v= iguais à base', () => {
  const v = (h, f) => (new RegExp('<script src="' + f.replace(/\./g, '\\.') + '\\?v=([^"]+)"></script>').exec(h) || [])[1];
  if (ARQ.alim !== arqBase().alim) assert.notStrictEqual(v(ARQ.html, 'alimentacao-hospede.js'), v(arqBase().html, 'alimentacao-hospede.js'), 'módulo novo com o ?v= velho: um aparelho rodaria o index novo com o módulo guardado');
  igual(v(ARQ.html, 'alimentacao-hospede.js'), '2026-10-22-01');
  const outros = (h) => (h.match(/<script src="(?!alimentacao-hospede\.js)[^"]+"><\/script>/g) || []).join('\n');
  igual(outros(ARQ.html), outros(arqBase().html));
});
prova('R', 'AC15 — as funções alteradas não ganharam nenhuma chamada ao banco (nem a leitura da ficha do QA M1); os cartões do Almoço e do Café não leem nada', () => {
  const SBx = base();
  const chamadas = (s) => (s.match(/\bDB\b|\.ref\(|\.once\(|\.on\(['"]|\.transaction\(|\.update\(/g) || []).length;
  ['mcrComidaDe', 'mcrDiffComida', 'mcrComidaRastro', 'mcrMontar', 'mcrComidaHTML', 'almDadosHospede29', 'renderAlmoco', 'renderCafe'].forEach((f) => igual(chamadas(S.run('String(' + f + ')')), chamadas(SBx.run('String(' + f + ')')), f));
  igual(chamadas(S.run('String(alimObsCheckinCartao)')), 0);
  igual(chamadas(S.run('String(alimRestricaoDaFicha)')), 0, 'a leitura da ficha (QA M1) não toca o banco');
  assert.ok(S.run('String(alimRestricaoDaFicha)').indexOf('extraDoHosp(h)') >= 0, 'é a leitura da tarja da ficha (extraDoHosp)');
  igual(chamadas(ARQ.alim), 0, 'o módulo continua sem banco');
  // desenhar os cartões (Almoço e Café) num banco que conta: o mesmo que a base (a turma já está ligada; o desenho não lê nada novo)
  const desenhar = (S0) => { almoco(S0, TESTE01_SEM_FICHA()); cafe(S0, { e1: EST() }); const B = criarBanco({}); S0.ctx.__B = B; S0.run('__bkDB6121=DB; DB=__B;'); try { almoco(S0, TESTE01_SEM_FICHA()); cafe(S0, { e1: EST() }); } finally { S0.run('DB=__bkDB6121;'); } return B.log; };
  const lN = desenhar(S), lB = desenhar(SBx);
  igual(lN, lB, 'o mesmo que a base');
  igual(lN, [], 'desenhar os cartões não lê nem grava');
});
prova('R', 'AC17 — o texto novo: sem palavra proibida da marca, sem emoji, sem alert/console.log/TODO, catch vazio só com «silencioso de propósito»', () => {
  const novas = (a, b) => { const vel = new Set(b.split('\n')); return a.split('\n').filter((l) => !vel.has(l)); };
  const L = novas(ARQ.html, arqBase().html).concat(novas(ARQ.alim, arqBase().alim));
  assert.ok(L.length > 0, 'há linhas novas');
  const sem = L.join('\n');
  const proib = sem.match(/(^|[^\p{L}])(cachorros?|cães|cão|animal|animais|bichos?|donos?|funcionári[oa]s?|atendentes?)(?![\p{L}])/giu);
  igual(proib, null, 'palavra proibida');
  igual(sem.match(/\p{Extended_Pictographic}/gu), null, 'emoji novo');
  igual(sem.match(/\balert\(|console\.log|TODO|FIXME/g), null);
  igual(sem.match(/catch\s*\([^)]*\)\s*\{\s*\}(?!\s*\/\*\s*silencioso de propósito)/g), null, 'catch vazio sem o comentário');
});

// ================================================================== N — Chromium a 375 px
let chromium = null, semNavegador = '';
try { ({ chromium } = require('playwright')); } catch (e) { try { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); } catch (e2) { semNavegador = 'o Playwright não está instalado nesta máquina'; } }
const CHROMIUM = ['/opt/pw-browsers/chromium'].filter((p) => fs.existsSync(p))[0];
const CSS = estilos(ARQ.html).replace(/<\/?style\b[^>]*>/gi, '\n');
const pagina = (corpo) => '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>' + CSS + '</style></head><body data-role="gestao" style="margin:0;padding:8px;background:var(--z-cream)">' + corpo + '</body></html>';
async function noNavegador(fn) {
  if (!chromium) return 'PULADO: ' + semNavegador;
  const nav = await chromium.launch({ executablePath: CHROMIUM, args: ['--no-sandbox'] });
  try { const pg = await nav.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 }); await fn(pg); return ''; }
  finally { await nav.close(); }
}
const foto = (nome) => (FOTOS ? path.join(FOTOS, ROTULO + '-' + nome + '.png') : null);
prova('N', 'AC9.2 — a 375 px: a faixa amarela (rgba(222, 180, 40, 0.18)), sem piscar, texto em --z-blue, fonte de 12 px ou mais, sem rolagem lateral; fotos dos três cartões', async () => {
  const p = (n) => ({ p: { n, tutor: 'Tutor Teste', raca: 'SRD', dias: ['seg'] } });
  const g = almoco(S, {
    alunos: [p('Teste 01'), p('Teste 06'), p('Teste 09')],
    cad: { 'Teste 01': { lento: true, alim: 'Ração' }, 'Teste 06': { restr: 'frango', alim: 'Ração' }, 'Teste 09': { alim: 'Ração' } },
    estadias: { e1: EST(), e6: EST({ nome: 'Teste 06', refKey: 'teste 06__tutor teste' }), e9: Object.assign(EST({ nome: 'Teste 09', refKey: 'teste 09__tutor teste' }), { ficha: Object.assign(EST().ficha, { alim: Object.assign(EST().ficha.alim, { obs: '' }) }) }) },
  }).grid;
  const msg = await noNavegador(async (pg) => {
    await pg.setContent(pagina('<div class="pets-grid" id="almGrid">' + g + '</div>'));
    const r = await pg.evaluate(() => {
      const zBlue = getComputedStyle(document.documentElement).getPropertyValue('--z-blue').trim();
      const t = document.createElement('div'); t.style.color = zBlue; document.body.appendChild(t); const azul = getComputedStyle(t).color; t.remove();
      const fx = Array.from(document.querySelectorAll('.janta-box')).map((el) => { const s = getComputedStyle(el); return { bg: s.backgroundColor, anim: s.animationName, cor: s.color, fonte: parseFloat(s.fontSize), largura: el.getBoundingClientRect().right, quebra: el.scrollWidth <= el.clientWidth }; });
      return { azul, fx, sw: document.documentElement.scrollWidth, cards: document.querySelectorAll('.alm-card').length };
    });
    igual(r.fx.length, 2, 'a faixa no Teste 01 e no Teste 06; o Teste 09 sem nenhuma');
    r.fx.forEach((f) => { igual([f.bg, f.anim, f.cor, f.quebra], ['rgba(222, 180, 40, 0.18)', 'none', r.azul, true]); assert.ok(f.fonte >= 12, 'fonte ' + f.fonte); assert.ok(f.largura <= 375, 'cabe: ' + f.largura); });
    assert.ok(r.sw <= 375, 'sem rolagem lateral: ' + r.sw);
    if (FOTOS) {
      fs.mkdirSync(FOTOS, { recursive: true });
      const cs = await pg.$$('.alm-card');
      const nomes = ['i-so-a-faixa', 'ii-vermelho-do-cadastro-e-a-faixa', 'iii-sem-nenhum'];
      for (let i = 0; i < cs.length; i++) await cs[i].screenshot({ path: foto('cartao-' + nomes[i]) });
    }
  });
  return msg;
});
prova('N', 'AC1.4 — a 375 px, a tela «Comida e remédio» com o campo: cabe sem rolagem lateral, o texto comprido quebra em linhas e rola dentro do campo, sem corte; foto como a tela abre (o campo com 2 linhas, sem esticar)', async () => {
  const longo = OBS_CERTA + '; misturar o patê devagar e esperar esfriar antes de servir, sem pressa, conferindo se ele comeu tudo.';
  tela(S, { est: (() => { const e = EST(); e.ficha.alim.obs = longo; return e; })() });
  S.el('mcrTela').innerHTML = '';
  S.run('MCR=__M; mcrRenderJa();');
  const html = S.els.mcrTela.innerHTML; S.run('MCR=null;');
  assert.ok(html.indexOf('mcrSetComidaTx(\'obs\'') >= 0, 'a tela tem o campo');
  const msg = await noNavegador(async (pg) => {
    await pg.setContent(pagina('<div id="mcrTela" role="dialog">' + html + '</div>'));
    const r = await pg.evaluate(() => {
      const ta = document.querySelector('textarea[aria-label^="Observação da alimentação"]');
      const b = ta.getBoundingClientRect(), tela = document.getElementById('mcrTela');
      return { dir: b.right, esq: b.left, sw: ta.scrollWidth, cw: ta.clientWidth, sh: ta.scrollHeight, ch: ta.clientHeight, linhas: ta.rows, telaSw: tela.querySelector('.mcr-in').scrollWidth, valor: ta.value };
    });
    assert.ok(r.esq >= 0 && r.dir <= 375, 'o campo cabe: ' + r.esq + '–' + r.dir);
    assert.ok(r.sw <= r.cw, 'sem rolagem lateral dentro do campo: ' + r.sw + ' > ' + r.cw);
    assert.ok(r.telaSw <= 375, 'a tela sem rolagem lateral: ' + r.telaSw);
    igual(r.valor, longo, 'o texto inteiro, sem corte');
    // como a tela abre de verdade (QA B3): o campo com 2 linhas; o resto do texto comprido rola dentro dele (ou se arrasta o canto)
    igual(r.linhas, 2, 'o campo abre com 2 linhas');
    assert.ok(r.sh > r.ch, 'o texto comprido continua inteiro, rolando dentro do campo: ' + r.sh + ' > ' + r.ch);
    if (FOTOS) {
      fs.mkdirSync(FOTOS, { recursive: true });
      // o cartão «Comida» inteiro, com o campo à vista (o bloco «Mudar o que ele come» fechado), sem esticar o campo
      const card = await pg.$('#mcrTela .mcr-card:has(textarea[aria-label^="Observação da alimentação"])');
      await card.screenshot({ path: foto('comida-e-remedio-campo') });
    }
  });
  return msg;
});
prova('N', 'foto — o cartão do almoço do caso (antes: base; depois: o texto corrigido em faixa amarela)', async () => {
  const p = { p: { n: 'Teste 01', tutor: 'Tutor Teste', raca: 'SRD', dias: ['seg'] } };
  const novoApp = S.run("typeof alimObsCheckinCartao==='function'");
  const e = EST(); if (novoApp) e.ficha.alim.obs = OBS_CERTA;
  const g = almoco(S, { alunos: [p], cad: { 'Teste 01': { lento: true, alim: 'Ração' } }, estadias: { e1: e } }).grid;
  const msg = await noNavegador(async (pg) => {
    await pg.setContent(pagina('<div class="pets-grid" id="almGrid" style="max-width:359px">' + g + '</div>'));
    if (FOTOS) { fs.mkdirSync(FOTOS, { recursive: true }); await (await pg.$('.alm-card')).screenshot({ path: foto('cartao-do-caso') }); }
  });
  return msg;
});

prova('N', 'M1 — a 375 px, o hóspede sem entrada no Day Care com alergia e restrição na ficha e observação do check-in: no Almoço e no Café, o vermelho da ficha e a faixa amarela, sem rolagem lateral; fotos', async () => {
  fichaDoHospede(S, 'frango', 'corante');
  let gA, gC;
  try {
    const e = EST(); e.ficha.alim.obs = 'Ração do Teste 01 fica no armário; servir morno';
    gA = almoco(S, { estadias: { e1: e } }).grid; gC = cafe(S, { e1: e });
  } finally { semFicha(S); }
  if (S.run("typeof alimRestricaoDaFicha!=='function'")) assert.fail('o app não lê a ficha do hóspede no cartão');
  const msg = await noNavegador(async (pg) => {
    for (const [rot, g] of [['almoco', gA], ['cafe', gC]]) {
      await pg.setContent(pagina('<div class="pets-grid" style="max-width:359px">' + g + '</div>'));
      const r = await pg.evaluate(() => {
        const v = Array.from(document.querySelectorAll('.alm-card .alm-restr')).map((el) => { const s = getComputedStyle(el); return { t: el.textContent, bg: s.backgroundColor, anim: s.animationName }; });
        const f = Array.from(document.querySelectorAll('.alm-card .janta-box')).map((el) => ({ t: el.textContent, bg: getComputedStyle(el).backgroundColor }));
        return { v, f, sw: document.documentElement.scrollWidth };
      });
      igual(r.v.map((x) => [x.t, x.bg, x.anim]), [['\u26a0 RESTRIÇÃO: frango · corante', 'rgb(192, 57, 43)', 'piscaAlerta']], rot + ': o vermelho da ficha');
      igual(r.f.map((x) => [x.t, x.bg]), [['Observação do check-in: Ração do Teste 01 fica no armário; servir morno', 'rgba(222, 180, 40, 0.18)']], rot + ': a faixa');
      assert.ok(r.sw <= 375, rot + ': sem rolagem lateral: ' + r.sw);
      if (FOTOS) { fs.mkdirSync(FOTOS, { recursive: true }); await (await pg.$('.alm-card')).screenshot({ path: foto('cartao-' + rot + '-hospede-sem-day-care-ficha-e-observacao') }); }
    }
  });
  return msg;
});

// ================================================================== rodar
(async () => {
  let ok = 0, pulados = 0; const falhas = [];
  for (const p of fila) {
    if (SO.length && SO.indexOf(p.grupo) < 0) continue;
    try {
      const r = await p.fn();
      if (typeof r === 'string' && r.indexOf('PULADO') === 0) { pulados++; console.log('  - ' + p.nome + '\n      ' + r); continue; }
      ok++; console.log('  ✓ ' + p.nome);
    } catch (e) {
      const m = String((e && e.message) || e);
      if (m.indexOf('PULADO') === 0) { pulados++; console.log('  - ' + p.nome + '\n      ' + m); continue; }
      falhas.push(p.nome); console.log('  ✗ ' + p.nome + '\n      ' + m.split('\n').slice(0, 6).join('\n      '));
    }
  }
  console.log('\n' + ok + ' passaram, ' + falhas.length + ' falharam' + (pulados ? ', ' + pulados + ' PULADAS (não contam)' : '') + (process.env.TZ ? ' (TZ=' + process.env.TZ + ')' : ''));
  falhas.forEach((f) => console.log('  FALHOU: ' + f));
  process.exit(falhas.length ? 1 : 0);
})();
