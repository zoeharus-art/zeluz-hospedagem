'use strict';
/*
 * Harness de teste da AuAulândia — a "rede de segurança".
 *
 * O que faz: carrega o <script> REAL do index.html dentro de um sandbox (vm),
 * com stubs universais de navegador/Firebase (nada conecta em lugar nenhum),
 * injeta DADO REAL do banco (baixado por REST com login anônimo) e chama as
 * funções de verdade do app — validando invariantes de negócio.
 *
 * Por que assim: foi extrair as funções reais e rodá-las contra dado real que
 * pegou quase todos os bugs. Testar a lógica isolada (mock) não pega — o bug
 * mora no encontro entre a função e o dado que a vida real produz.
 *
 * Uso:  node tests/harness.js
 * Sai 0 se tudo passa, 1 se algo falha (serve de gate antes de publicar).
 *
 * NÃO escreve nada no banco. Só leitura anônima.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const https = require('https');

const APP = path.join(__dirname, '..', 'auaulandia', 'index.html');
const DB_BASE = 'https://hospedagem-zeluz-default-rtdb.firebaseio.com';
const API_KEY = 'AIzaSyD3udp47XruRAEeIYWNGn0ICGCX3a1qr28';

// ---------------------------------------------------------------- util REST
function httpJSON(method, url, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = body ? JSON.stringify(body) : null;
    const req = https.request(
      { method, hostname: u.hostname, path: u.pathname + u.search,
        headers: data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {} },
      (res) => {
        let buf = '';
        res.on('data', (c) => (buf += c));
        res.on('end', () => {
          try { resolve({ status: res.statusCode, json: buf ? JSON.parse(buf) : null }); }
          catch (e) { resolve({ status: res.statusCode, json: null, raw: buf }); }
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function anonToken() {
  const r = await httpJSON('POST',
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
    { returnSecureToken: true });
  if (!r.json || !r.json.idToken) throw new Error('Não obtive token anônimo');
  return r.json.idToken;
}

async function dbRead(pathStr, token) {
  const r = await httpJSON('GET', `${DB_BASE}/${pathStr}.json?auth=${token}`);
  return r.json;
}

// -------------------------------------------------- stubs universais de browser
// Proxy que absorve qualquer acesso/chamada e devolve a si mesmo. É o que deixa
// o app carregar inteiro (getElementById(...).style.display='none', addEventListener…)
// sem quebrar, sem conectar em nada.
function universal(name) {
  const fn = function () { return fn; };
  fn.__name = name;
  return new Proxy(fn, {
    get(t, p) {
      if (p === Symbol.toPrimitive) return () => '';
      if (p === 'then') return undefined; // não fingir ser Promise por acidente
      if (p in t) return t[p];
      // dataset precisa ser objeto real e mutável (papel do usuário mora aqui)
      return universal(name + '.' + String(p));
    },
    set() { return true; },
    apply() { return universal(name + '()'); },
    construct() { return universal('new ' + name); },
  });
}

function makeSandbox() {
  const roleHolder = { role: 'gestao' }; // mutável: simula o papel de quem usa

  const bodyEl = {
    dataset: roleHolder,
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    appendChild() {}, style: {}, addEventListener() {},
    setAttribute() {}, getAttribute() { return null; },
  };
  const documentStub = {
    body: bodyEl,
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

  // firebase stub: inerte. auth().signInAnonymously() nunca resolve (não liga listeners).
  const neverResolves = new Promise(() => {});
  const firebaseStub = {
    initializeApp() { return {}; },
    auth() { return { signInAnonymously() { return neverResolves; }, onAuthStateChanged() {} }; },
    database() { return { ref() { return universal('ref'); } }; },
    appCheck: undefined, // sem App Check no teste
  };

  const sandbox = {
    console, Date, Math, JSON, Object, Array, String, Number, Boolean,
    parseInt, parseFloat, isNaN, isFinite, RegExp, Promise, Map, Set, Symbol,
    encodeURIComponent, decodeURIComponent, setTimeout() {}, clearTimeout() {},
    setInterval() {}, clearInterval() {}, requestAnimationFrame() {},
    performance: { now() { return 0; } },
    document: documentStub,
    firebase: firebaseStub,
    localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
    navigator: { userAgent: 'harness', onLine: true },
    location: { href: 'https://harness.local/', reload() {}, hostname: 'harness.local' },
    alert() {}, confirm() { return true; }, prompt() { return ''; },
    __ROLE__: roleHolder, // ponte para o teste trocar o papel
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.self = sandbox;
  return sandbox;
}

// -------------------------------------------------- extrair o <script> principal
function extractMainScript(html) {
  // pega o ÚLTIMO bloco <script>...</script> sem src (o gigante inline)
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  let m, last = null;
  while ((m = re.exec(html)) !== null) {
    if (m[1] && m[1].length > (last ? last.length : 0)) last = m[1];
  }
  if (!last) throw new Error('Não achei o <script> inline principal');
  return last;
}

// -------------------------------------------------- runner de testes
let pass = 0, fail = 0;
const fails = [];
function check(nome, cond, detalhe) {
  if (cond) { pass++; console.log('  ✓ ' + nome); }
  else { fail++; fails.push(nome + (detalhe ? ' — ' + detalhe : '')); console.log('  ✗ ' + nome + (detalhe ? ' — ' + detalhe : '')); }
}

async function main() {
  console.log('== Harness AuAulândia — rede de segurança ==\n');

  const html = fs.readFileSync(APP, 'utf8');
  const script = extractMainScript(html);
  const sandbox = makeSandbox();
  const ctx = vm.createContext(sandbox);

  try {
    vm.runInContext(script, ctx, { filename: 'index.html#script', timeout: 15000 });
  } catch (e) {
    console.error('FALHA ao carregar o script do app no sandbox:', e.message);
    process.exit(1);
  }
  console.log('Script do app carregou no sandbox.\n');

  // ---- funções que precisam existir (contrato mínimo) ----
  const precisa = ['repSaldo', 'repLancamentos', 'repAgendaDe', 'repAgendadosPara',
    'repDiasQueViria', 'pelKey', 'repHojeISO', 'repPodeLancar'];
  console.log('Contrato — funções existem:');
  precisa.forEach((f) => check(f + ' existe', typeof ctx[f] === 'function'));
  console.log('');

  // ---- dado real do banco ----
  console.log('Baixando dado real (login anônimo)…');
  const token = await anonToken();
  const [reposicao, irmaos] = await Promise.all([
    dbRead('daycare/reposicao', token),
    dbRead('daycare/irmaos', token),
  ]);
  console.log('  reposicao: ' + (reposicao ? Object.keys(reposicao).length : 0) + ' FILHOt(s)');
  console.log('  irmaos: ' + (irmaos ? Object.keys(irmaos).length : 0) + ' vínculo(s)\n');

  // injeta no cache real do app
  if (reposicao) ctx.REPO_CACHE = reposicao;

  // ---- v05: reposição — invariantes do saldo/agenda ----
  console.log('v05 — Reposição (saldo e agendamento):');
  if (reposicao) {
    let saldosOk = true, agendaOk = true, detalhe = '';
    for (const key of Object.keys(reposicao)) {
      const p = { n: key.split('__')[0], tutor: (key.split('__')[1] || '') };
      // pelKey pode sanitizar diferente; injeta direto pelo cache já carregado
      const s = ctx.repSaldo(p);
      if (typeof s !== 'number' || isNaN(s)) { saldosOk = false; detalhe = key + ' saldo=' + s; }
      // agenda: toda data agendada deve ser >= hoje (regra: passado não aparece)
      const hoje = ctx.repHojeISO();
      const ag = ctx.repAgendaDe(p);
      if (!Array.isArray(ag)) { agendaOk = false; detalhe = key + ' agenda não é lista'; }
      else ag.forEach((d) => { if (d < hoje) { agendaOk = false; detalhe = key + ' agenda no passado: ' + d; } });
    }
    check('repSaldo devolve número para todo FILHOt', saldosOk, detalhe);
    check('repAgendaDe nunca traz data no passado', agendaOk, detalhe);
  } else {
    check('havia dado de reposição para testar', false, 'REPO_CACHE vazio');
  }

  // repDiasQueViria: sanidade (janela inválida = vazio; não estoura a trava de 400 dias)
  const diasVazio = ctx.repDiasQueViria({ n: 'x', tutor: 'y', dias: ['seg'] }, '2026-09-01', '2026-08-01');
  check('repDiasQueViria com janela invertida devolve vazio', Array.isArray(diasVazio) && diasVazio.length === 0);
  const semDias = ctx.repDiasQueViria({ n: 'x', tutor: 'y', dias: [] }, '2026-08-01', '2026-08-30');
  check('repDiasQueViria sem dias marcados devolve vazio', Array.isArray(semDias) && semDias.length === 0);
  console.log('');

  // ---- v07: irmãos — vínculo por chave, nunca por nome ----
  console.log('v07 — Irmãos (vínculo por chave do cadastro):');
  if (irmaos) {
    let chaveComposta = true, det = '';
    for (const k of Object.keys(irmaos)) {
      const v = irmaos[k];
      // a e b devem ter formato nome__tutor (chave composta, não nome solto)
      if (!v || !v.a || !v.b || v.a.indexOf('__') < 0 || v.b.indexOf('__') < 0) {
        chaveComposta = false; det = k;
      }
    }
    check('todo vínculo usa chave composta nome__tutor', chaveComposta, det);
    check('há duplas reais no banco (não só semente vazia)', Object.keys(irmaos).length >= 10,
      Object.keys(irmaos).length + ' duplas');
  } else {
    check('irmãos migrados para o banco', false, 'nó daycare/irmaos vazio');
  }
  console.log('');

  // ---- papel de quem usa: repPodeLancar respeita o papel ----
  console.log('Papel de quem usa (não só Gestão):');
  ctx.__ROLE__.role = 'monitor';
  const monitorPode = ctx.repPodeLancar();
  ctx.__ROLE__.role = 'plantonista';
  const plantPode = ctx.repPodeLancar();
  ctx.__ROLE__.role = 'gestao';
  const gestaoPode = ctx.repPodeLancar();
  check('monitor NÃO pode lançar reposição', monitorPode === false);
  check('plantonista NÃO pode lançar reposição', plantPode === false);
  check('gestão PODE lançar reposição', gestaoPode === true);
  console.log('');

  // ---- nº 1: dose de remédio nunca some em silêncio ----
  console.log('Achado nº 1 — registro de dose de remédio:');
  // teste estático: a função não pode ter confirm() nativo no caminho de salvar
  // (limpa comentários primeiro — a explicação da correção cita a palavra "confirm")
  const srcDose = String(ctx.registrarDoseAgendada || '')
    .replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  check('registrarDoseAgendada NÃO usa confirm() nativo', srcDose.indexOf('confirm(') < 0);
  check('registrarDoseAgendada recebe o botão (confirmação na tela)',
    /^function[^(]*\([^)]*\bbtn\b/.test(String(ctx.registrarDoseAgendada || '')));
  // comportamento: roda DENTRO do contexto, onde `currentHosp` e `MED_AGENDA_ITENS` (let) vivem.
  // DB está null no sandbox — simula exatamente o "banco reconectando".
  ctx.__btn = { dataset: {}, style: {}, textContent: 'Dei agora', disabled: false };
  ctx.__res = {};
  vm.runInContext(`
    try {
      currentHosp = { nome: 'FILHOt Teste' };
      MED_AGENDA_ITENS = { i1: { nome: 'Optivet', q: 1, u: 'comprimido', horarios: ['10:00'] } };
      var __g = registrarDoseAgendadaGlobal, __gravou = false;
      registrarDoseAgendadaGlobal = function () { __gravou = true; };
      registrarDoseAgendada('i1', '10:00', __btn);            // 1º toque
      __res.armou = (__btn.dataset.armed === '1'); __res.gravou1 = __gravou; __res.txt1 = __btn.textContent;
      registrarDoseAgendada('i1', '10:00', __btn);            // 2º toque, DB null
      __res.txt2 = __btn.textContent; __res.gravou2 = __gravou;
      registrarDoseAgendadaGlobal = __g;
    } catch (e) { __res.err = e.message; }
  `, ctx);
  const R = ctx.__res;
  check('1º toque NÃO grava a dose (só arma)', R.gravou1 === false && R.armou === true, R.err || ('armou=' + R.armou));
  check('1º toque muda o texto para confirmar', /Confirmar/.test(R.txt1 || ''), R.txt1);
  check('2º toque com banco reconectando avisa (não sai mudo)', /conectando/i.test(R.txt2 || '') && R.gravou2 === false, R.txt2);
  console.log('');

  // ---- nº 3: alergia/restrição nunca grava em silêncio ----
  console.log('Achado nº 3 — gravação de alergia/restrição:');
  const srcRestr = String(ctx.ciSalvarRestricao || '');
  check('ciSalvarRestricao NÃO tem .catch vazio', !/\.catch\(\s*function\s*\(\s*\)\s*\{\s*\}\s*\)/.test(srcRestr) && !/\.catch\(\s*\(\s*\)\s*=>\s*\{\s*\}\s*\)/.test(srcRestr));
  check('ciSalvarRestricao audita a FALHA da gravação', /checkin-FALHA/.test(srcRestr));
  check('ciSalvarRestricao trata banco reconectando (else do if(DB))', /checkin-PENDENTE/.test(srcRestr));
  console.log('');

  // ---- nº 6: dobra de plantão compara nome normalizado ----
  console.log('Achado nº 6 — dobra de plantão (nome normalizado):');
  const srcDob = String(ctx.acertoMarcarDobras || '');
  check('acertoMarcarDobras usa jsNorm (não igualdade crua de nome)', /jsNorm\(/.test(srcDob) && !/seguinte\.nome===a\.nome/.test(srcDob));
  console.log('');

  // ---- nº 5: cadastro-mestre não grava em silêncio ----
  console.log('Achado nº 5 — cadastro-mestre (nome/raça/alergia):');
  check('_logFalhaGrav existe (helper de rastro na falha)', typeof ctx._logFalhaGrav === 'function');
  const semCatchVazio = (fn) => {
    const s = String(ctx[fn] || '');
    return !/\.catch\(\s*\(\s*\)\s*=>\s*\{\s*\}\s*\)/.test(s) && !/\.catch\(\s*function\s*\(\s*\)\s*\{\s*\}\s*\)/.test(s);
  };
  check('onCad (campo) audita falha (sem .catch vazio)', semCatchVazio('onCad'));
  check('onCadNome audita falha (sem .catch vazio)', semCatchVazio('onCadNome'));
  check('onBrinq audita falha (sem .catch vazio)', semCatchVazio('onBrinq'));
  check('setHospAlergia audita falha (sem .catch vazio)', semCatchVazio('setHospAlergia'));
  // o helper realmente registra na auditoria quando chamado
  let auditouFalha = false;
  vm.runInContext(`
    var __a = (typeof audit==='function') ? audit : null;
    audit = function(t){ if(t==='gravacao-FALHOU') __res2 = true; };
    _logFalhaGrav('teste', new Error('x'));
    audit = __a;
  `, Object.assign(ctx, { __res2: false }));
  auditouFalha = ctx.__res2 === true;
  check('_logFalhaGrav registra evento gravacao-FALHOU na auditoria', auditouFalha);
  console.log('');

  // ---- resumo ----
  console.log('== Resultado: ' + pass + ' ok, ' + fail + ' falha(s) ==');
  if (fail) { console.log('\nFalhas:'); fails.forEach((f) => console.log('  - ' + f)); }
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error('ERRO no harness:', e); process.exit(1); });
