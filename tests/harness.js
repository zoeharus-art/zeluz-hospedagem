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
const crypto = require('crypto');

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
    head: { appendChild() {} }, // o app pendura o script da planilha aqui; sem isso, tropeça e faz barulho
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
    // Blob mínimo: o Node do sandbox não tem. Guarda os pedaços (Uint8Array) como
    // vieram, para o teste poder conferir o PDF byte a byte.
    Blob: class Blob {
      constructor(parts, opts) { this.parts = parts || []; this.type = (opts && opts.type) || ''; }
    },
    alert() {}, confirm() { return true; }, prompt() { return ''; },
    addEventListener() {}, // o quadro de assinatura registra o 'mouseup' no window
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

// -------------------------------------------------- bytes de um Blob (PDF)
// Junta os pedaços do Blob de mentira num Buffer só e tira a impressão digital.
// É o que permite provar que o PDF continua EXATAMENTE o mesmo depois de mexer no código.
function blobBytes(b) {
  const partes = ((b && b.parts) || []).map((p) => Buffer.from(p));
  return Buffer.concat(partes);
}
function sha256(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }

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

  // ---- Fase 1 / Etapa A: Centro de Permissões é EQUIVALENTE às funções atuais ----
  console.log('Fase 1 — Centro de Permissões (prova de equivalência):');
  // PERM é const (escopo léxico do script) — checa por dentro do contexto
  ctx.__permOk = false;
  vm.runInContext("__permOk = (typeof PERM==='object' && PERM!==null && Object.keys(PERM).length>=15);", ctx);
  check('PERM (tabela central) existe com >=15 capacidades', ctx.__permOk === true);
  check('podePapel existe', typeof ctx.podePapel === 'function');
  // função de permissão atual  ->  capacidade na tabela
  const MAPA_PERM = [
    ['podeVerSenhas', 'ver-senhas'],
    ['repPodeLancar', 'lancar-reposicao'],
    ['trocaEhGestora', 'decidir-troca'],
    ['canEditHospAlergia', 'editar-alergia'],
    ['canEditMed', 'editar-medicacao'],
    ['canEditCheckinMed', 'editar-medicacao-checkin'],
    ['hospPodeDesfazer', 'desfazer-hospedagem'],
    ['papelRecebeAlarme', 'recebe-alarme'],
    ['podeAlterarVet', 'alterar-vet'],
    ['vePorDia', 'ver-por-dia'],
    ['canEditPel', 'editar-peludinho'],
    ['canCriarCadastro', 'criar-cadastro'],
    ['ehGestaoRole', 'gestao-role'],
    ['podeVerPlano', 'ver-plano'],
    ['hospAbaPode', 'aba-hospedes'],
  ];
  const PAPEIS = ['gestao', 'diretoria', 'supervisor', 'monitor', 'plantonista',
    'consultora', 'vet', 'conferencia', 'aprendiz', 'tutor', ''];
  let divergencias = [];
  let comparacoes = 0;
  for (const [fn, cap] of MAPA_PERM) {
    if (typeof ctx[fn] !== 'function') { divergencias.push(fn + ' não existe'); continue; }
    for (const papel of PAPEIS) {
      ctx.__ROLE__.role = papel;
      const atual = ctx[fn]() === true;         // o que a função de hoje responde
      const central = ctx.podePapel(cap, papel); // o que a tabela central responde
      comparacoes++;
      if (atual !== central) divergencias.push(`${fn}('${papel}'): atual=${atual} central=${central}`);
    }
  }
  ctx.__ROLE__.role = 'gestao';
  check(`Centro de Permissões reproduz as 15 funções em ${comparacoes} comparações (10 papéis)`,
    divergencias.length === 0, divergencias.slice(0, 5).join(' | '));
  console.log('');

  // ---- Fase 1 · passo 1: "data de hoje" tem UMA fonte (zHojeISO) ----
  console.log('Fase 1 · passo 1 — Data de hoje (fonte única):');
  check('zHojeISO existe', typeof ctx.zHojeISO === 'function');
  {
    const d = new Date(), p2 = (x) => String(x).padStart(2, '0');
    const esperado = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
    check('zHojeISO devolve AAAA-MM-DD de hoje (' + esperado + ')', ctx.zHojeISO() === esperado, ctx.zHojeISO());
    for (const nome of ['repHojeISO', 'hojeISO', 'ciHoje', 'hospHojeISO']) {
      check(nome + ' responde igual à fonte única',
        typeof ctx[nome] === 'function' && ctx[nome]() === ctx.zHojeISO(), String(ctx[nome] && ctx[nome]()));
    }
    // no código-fonte, cada nome é declarado UMA vez (a segunda hojeISO sumiu)
    for (const nome of ['zHojeISO', 'repHojeISO', 'hojeISO', 'ciHoje', 'hospHojeISO']) {
      const n = (html.match(new RegExp('function[ 	]+' + nome + '[ 	]*[(]', 'g')) || []).length;
      check(nome + ' declarada exatamente 1 vez no código', n === 1, 'achei ' + n);
    }
    // e só a fonte única faz a conta (as outras são apelidos de uma linha)
    const apelidos = ['repHojeISO', 'hojeISO', 'ciHoje', 'hospHojeISO'].every((nome) =>
      new RegExp('function[ \t]+' + nome + '[ \t]*[(][)][ \t]*[{][ \t]*return zHojeISO[(][)];[ \t]*[}]').test(html));
    check('as 4 antigas são apelidos que chamam zHojeISO (ninguém recalcula)', apelidos);
  }
  console.log('');

  // ---- chave do relatório do plantão (Toshi, 23-24/ago/2026) ----
  // 14 relatórios do Toshi morreram com "invalid key (Tuross 07:00 1/2 comprimido…)": a pergunta
  // vira chave no Firebase, e o Firebase não aceita . # $ / [ ] em chave.
  console.log('Relatório do plantão — chave segura no Firebase:');
  {
    check('relChave existe', typeof ctx.relChave === 'function');
    const ruim = 'Tuross 07:00 1/2 comprimido · Dar 1/2 (40.minutos) [x] #1 $';
    const k = typeof ctx.relChave === 'function' ? ctx.relChave(ruim) : '';
    check('relChave tira . # $ / [ ] (o que derrubava o relatório do Toshi)', !!k && !/[.#$\/\[\]]/.test(k), k);
    check('relChave não mexe em pergunta normal', typeof ctx.relChave === 'function' && ctx.relChave('Fez cocô?') === 'Fez cocô?');
    check('coletarCard grava pela chave segura', /byQ\[relChave\(q\.dataset\.k\|\|q\.textContent\)\]/.test(html));
    check('linha de remédio do relatório tem chave própria (data-k)', html.indexOf("<span class=\"q\"'+dk+'>") >= 0);
  }
  console.log('');

  // ---- Fase 1 · passo 2: o quadro de assinatura tem UM construtor só (zSigCriar) ----
  console.log('Fase 1 · passo 2 — Quadro de assinatura (fonte única):');
  check('zSigCriar existe', typeof ctx.zSigCriar === 'function');
  for (const nome of ['CI_SIG', 'CO_SIG']) {
    const S = ctx[nome];
    check(nome + ' é um quadro com init, limpar e dataURL',
      !!S && typeof S.init === 'function' && typeof S.limpar === 'function' && typeof S.dataURL === 'function',
      String(S && Object.keys(S)));
  }
  {
    // canvas e pincel de mentira: gravam o que o app mandou desenhar
    const chamadas = [];
    const fakeCtx = {
      beginPath() { chamadas.push(['beginPath']); },
      moveTo(x, y) { chamadas.push(['moveTo', x, y]); },
      lineTo(x, y) { chamadas.push(['lineTo', x, y]); },
      stroke() { chamadas.push(['stroke']); },
      clearRect(a, b, c, d) { chamadas.push(['clearRect', a, b, c, d]); },
    };
    const fakeCanvas = {
      offsetWidth: 300, width: 0, height: 0, listeners: {}, addCount: 0,
      getContext() { return fakeCtx; },
      getBoundingClientRect() { return { left: 10, top: 20 }; },
      addEventListener(ev, fn) { this.addCount++; this.listeners[ev] = fn; },
      toDataURL() { return 'data:fake'; },
    };
    const fakeHint = { style: { display: 'block' } };
    const achou = (nome, ...args) => chamadas.some((c) =>
      c[0] === nome && args.every((v, i) => c[i + 1] === v));
    const getOrig = ctx.document.getElementById;
    try {
      ctx.document.getElementById = function (id) {
        if (id === 'ciSig') return fakeCanvas;
        if (id === 'ciSigHint') return fakeHint;
        return getOrig.call(this, id);
      };
      const S = ctx.CI_SIG;

      S.init();
      check('init ajusta o quadro ao tamanho na tela (300 × 190)',
        fakeCanvas.width === 300 && fakeCanvas.height === 190, fakeCanvas.width + ' × ' + fakeCanvas.height);
      check('caneta: espessura 2.5 e traço no azul Zêluz (#234D67)',
        fakeCtx.lineWidth === 2.5 && fakeCtx.strokeStyle === '#234D67',
        fakeCtx.lineWidth + ' / ' + fakeCtx.strokeStyle);
      check('o quadro escuta os 5 gestos (mouse e dedo)',
        ['mousedown', 'mousemove', 'touchstart', 'touchmove', 'touchend']
          .every((e) => typeof fakeCanvas.listeners[e] === 'function') && fakeCanvas.addCount === 5,
        'addCount=' + fakeCanvas.addCount);
      check('antes de assinar: não há tinta e o dataURL é vazio',
        S.hasInk === false && S.dataURL() === '', String(S.hasInk) + ' / ' + JSON.stringify(S.dataURL()));

      // o dedo encosta e arrasta
      fakeCanvas.listeners.touchstart({ preventDefault() {}, touches: [{ clientX: 50, clientY: 60 }] });
      fakeCanvas.listeners.touchmove({ preventDefault() {}, touches: [{ clientX: 80, clientY: 90 }] });
      check('o dedo deixou tinta e o aviso "assine aqui" sumiu',
        S.hasInk === true && fakeHint.style.display === 'none',
        String(S.hasInk) + ' / ' + fakeHint.style.display);
      check('o traço saiu no lugar certo (moveTo 40,40 e lineTo 70,70)',
        achou('moveTo', 40, 40) && achou('lineTo', 70, 70), JSON.stringify(chamadas));
      check('com tinta, o dataURL devolve a imagem', S.dataURL() === 'data:fake', S.dataURL());

      // "Limpar assinatura"
      S.limpar();
      check('limpar apaga o quadro inteiro (0,0,300,190)', achou('clearRect', 0, 0, 300, 190), JSON.stringify(chamadas));
      check('depois de limpar: sem tinta, aviso de volta e dataURL vazio',
        S.hasInk === false && fakeHint.style.display === 'block' && S.dataURL() === '',
        String(S.hasInk) + ' / ' + fakeHint.style.display + ' / ' + JSON.stringify(S.dataURL()));

      // reabrir a tela não pode empilhar escuta em cima de escuta
      S.init();
      check('abrir o quadro de novo NÃO duplica as escutas (continua 5)', fakeCanvas.addCount === 5, 'addCount=' + fakeCanvas.addCount);

      check('ciAssinaturaDataURL só repassa o quadro do check-in',
        typeof ctx.ciAssinaturaDataURL === 'function' && ctx.ciAssinaturaDataURL() === ctx.CI_SIG.dataURL());
    } finally {
      ctx.document.getElementById = getOrig;
    }
    for (const nome of ['ciInitSig', 'ciLimparAssinatura', 'coInitSig', 'coLimparAssinatura']) {
      check(nome + ' continua existindo (os botões da tela chamam por esse nome)', typeof ctx[nome] === 'function');
    }
    // no código-fonte: o quadro é escrito uma vez só e os nomes duplicados sumiram
    check("strokeStyle='#234D67' aparece 1 vez (antes eram 2 quadros)",
      html.split("strokeStyle='#234D67'").length - 1 === 1, 'achei ' + (html.split("strokeStyle='#234D67'").length - 1));
    for (const nome of ['ciSigCtx', 'ciSigDrawing', 'ciSigHasInk', 'ciSigReady',
      'coSigCtx', 'coSigDrawing', 'coSigHasInk', 'coSigReady']) {
      check(nome + ' não existe mais no código', html.indexOf(nome) === -1);
    }
  }
  console.log('');

  // ---- aviso do plantão para a Gestão (Adriana, 25/ago/2026) ----
  console.log('Plantão → Gestão: só quem teve algo vira mensagem:');
  {
    const f = ['plantAlertas', 'plantLinhas', 'plantMensagem', 'plantFechamento', 'plantaoAvisoGestao'];
    f.forEach((n) => check(n + ' existe', typeof ctx[n] === 'function'));
    if (typeof ctx.plantAlertas === 'function') {
      const bom = { byQ: { 'Como passou a noite?': 'Dormiu a noite inteira', 'Está ativo?': 'Sim', 'Bebeu água?': 'Sim', 'Fez xixi?': 'Sim' }, areas: [''] };
      const ruim = { byQ: { 'Como passou a noite?': 'Agitado', 'Bebeu água?': 'Não' }, areas: [''] };
      check('FILHOt que passou bem NÃO gera mensagem', ctx.plantAlertas('noite', bom).length === 0,
        JSON.stringify(ctx.plantAlertas('noite', bom)));
      const al = ctx.plantAlertas('noite', ruim);
      check('noite agitada + sem água viram alerta', al.length >= 2, JSON.stringify(al));
      // alergia sozinha não pode disparar mensagem todo dia
      check('alergia sozinha não vira gatilho', ctx.plantAlertas('dia', { byQ: { 'Tem alergia?': 'Sim', 'Almoçou?': 'Sim' }, areas: [''] }).length === 0);
      // observação escrita à mão sempre conta
      check('observação escrita conta como algo', ctx.plantAlertas('dia', { byQ: {}, areas: ['mancando da pata traseira'] }).length === 1);
    }
    if (typeof ctx.plantLinhas === 'function') {
      const l = ctx.plantLinhas('inicio', { byQ: { 'Jantou?': 'Não', 'Bebeu água?': 'Não' }, areas: ['55g ração'] });
      check('linhas do jantar destacam o que é ruim', l.join(' ').indexOf('<b>NÃO</b>') >= 0, l.join(' | '));
      check('o que foi servido entra na mensagem', l.join(' ').indexOf('55g ração') >= 0, l.join(' | '));
    }
    check('o aviso é disparado ao salvar o relatório', /plantaoAvisoGestao\(tipo, dados\)/.test(html));
    check('vai para o grupo da Gestão (Plantão AuAulândia)', /tgAvisar\(\{grupo:'gestao', texto:plantMensagem/.test(html));
  }
  console.log('');

  // ---- Fase 1 · passo 3: o PDF tem UM montador só (zPdfTextBlob) ----
  // Prova por bytes: o PDF do Check-in e o Receituário da Vet são montados a partir de
  // dados fixos e comparados com a impressão digital colhida ANTES da unificação.
  // Se um único byte mudar, o teste cai — é o que permite mexer no montador sem apostar.
  console.log('Fase 1 · passo 3 — PDF (fonte única):');
  {
    // Gabaritos colhidos do código ANTES da unificação, em 25/ago/2026.
    // Se mudarem, o PDF mudou — não é para "ajustar o gabarito", é para investigar.
    const GABARITO_PDF_CHECKIN = '98858e0506fafb8ffa9e6cf69ebb4339038affadbd54df62caebf3b0a42aa791'; // 3628 bytes
    const GABARITO_PDF_VET = '83338caf3f53ba3f20a6f7dd5de1bdc7fb3d7f0fcdbb9260cac499190cbc792d'; // 2086 bytes
    const GABARITO_PDF_TEXTO = '82c7cd6e0345969d1db34d3c9fdb04e8038668720292fea9a7373f0e0f51207e'; // 848 bytes

    const JPEG_FALSO = [255, 216, 255, 224, 0, 16, 74, 70, 73, 70, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 255, 217];
    const LINHAS_SIMPLES = [{ t: 'Linha 1', bold: true, size: 12, gap: 4 }, { t: 'Linha 2', size: 11, gap: 4 }];
    // Sem `ts`: a data por extenso sairia pelo fuso da máquina e o gabarito deixaria de
    // ser reproduzível fora daqui — a fixture tem de valer em qualquer computador.
    const CONSULTA = {
      data: '2026-08-25', temperatura: '38.5', peso: '7.2',
      cuidados: ['Evitar banho por 3 dias'], recomendacoes: 'Retornar se coçar',
      obs: 'Orelha vermelha', reavaliacao: '2026-09-01', reavaliacaoMotivo: 'reavaliar pele',
      por: 'Dra. Tanara',
    };

    // ciHosp é declarado com `let` — mora no escopo léxico do script, não vira propriedade
    // do global. Só dá para ler e trocar rodando código DENTRO do sandbox.
    const lerCiHosp = () => vm.runInContext('ciHosp', ctx);
    const porCiHosp = (v) => { ctx.__fixHosp = v; vm.runInContext('ciHosp = __fixHosp;', ctx); };

    const geOrig = ctx.document.getElementById;
    const ciHospOrig = lerCiHosp();
    const orig = {};
    ['ciColetarFicha', 'ciColetarMeds', 'ciAssinaturaJpeg', 'vetHosp', 'VET_MED_CACHE', 'tutorDe']
      .forEach((k) => { orig[k] = ctx[k]; });
    let bCheckin = null, bVet = null, bTexto = null, bSemSig = null, bComSig = null, erro = '';
    try {
      ctx.document.getElementById = function (id) {
        if (id === 'ciAssinaNome') return { value: 'Maria Tutora' };
        return geOrig.call(this, id);
      };
      porCiHosp({ nome: 'Toddy', raca: 'Spitz Alemão', tutor: 'Carolina' });
      ctx.ciColetarFicha = () => ({
        entrada: '2026-08-20', saida: '2026-08-27',
        pertences: [{ nome: 'Mochila', spec: 'azul' }, { nome: 'Vasilha' }],
        ficha: {
          alim: {
            tipo: 'Ração', marca: 'Guabi', qtd: 80, unidade: 'g', refeicoes: 2,
            refs: { fixas: { cafe: { on: true, racao: '80' }, jantar: { on: true, racao: '80', natural: '50' } }, extras: [] },
            dias: 7, minimo: 1120, trazida: 1200,
            comida: { qtd: 50, refeicoes: { jantar: true }, minimo: 350, trazida: 400 },
          },
          spa: { banho: 'Sim', tipo: 'Dermoprotetor', horario: '10:00' },
        },
      });
      ctx.ciColetarMeds = () => ({ a: { nome: 'Apoquel', q: '1', u: 'comprimido', horarios: ['08:00', '20:00'] } });
      // O Uint8Array PRECISA nascer dentro do sandbox: o montador testa `instanceof
      // Uint8Array` e um array vindo de fora seria tratado como texto — a assinatura
      // sairia corrompida e o gabarito estaria protegendo a coisa errada.
      vm.runInContext('ciAssinaturaJpeg = function(){ return { bytes: Uint8Array.from('
        + JSON.stringify(JPEG_FALSO) + '), w:300, h:190 }; };', ctx);
      ctx.vetHosp = { nome: 'Luna', raca: 'Westie', tutor: 'Beatriz' };
      ctx.VET_MED_CACHE = { m1: { nome: 'Simparic', q: '1', u: 'comprimido', horarios: ['09:00'] } };
      ctx.tutorDe = () => 'Beatriz'; // sem depender do cache de cadastros

      bCheckin = blobBytes(ctx.ciBuildPdfBlob());
      bVet = blobBytes(ctx.vetConsultaBlob(CONSULTA));
      bTexto = blobBytes(ctx.zPdfTextBlob(LINHAS_SIMPLES));
      try {
        bSemSig = blobBytes(ctx.zPdfTextBlob(LINHAS_SIMPLES, { assinatura: null, assinaNome: 'Fulano', reservaRodape: true }));
      } catch (e) { erro += ' [opts sem assinatura: ' + e.message + ']'; }
      try {
        bComSig = blobBytes(ctx.zPdfTextBlob(LINHAS_SIMPLES, { assinatura: ctx.ciAssinaturaJpeg(), assinaNome: 'Fulano', reservaRodape: true }));
      } catch (e) { erro += ' [opts com assinatura: ' + e.message + ']'; }
    } catch (e) {
      erro = (e && e.message) || String(e);
    } finally {
      ctx.document.getElementById = geOrig;
      Object.keys(orig).forEach((k) => { ctx[k] = orig[k]; });
      porCiHosp(ciHospOrig);
    }

    const digital = (b) => (b ? sha256(b) + ' (' + b.length + ' bytes)' : 'não gerou: ' + erro);

    check('PDF do check-in continua byte a byte igual ao gabarito',
      !!bCheckin && sha256(bCheckin) === GABARITO_PDF_CHECKIN, digital(bCheckin));
    check('Receituário da Vet continua byte a byte igual ao gabarito',
      !!bVet && sha256(bVet) === GABARITO_PDF_VET, digital(bVet));
    check('zPdfTextBlob sem opts continua byte a byte igual ao gabarito',
      !!bTexto && sha256(bTexto) === GABARITO_PDF_TEXTO, digital(bTexto));
    check('o PDF do check-in leva a assinatura como JPEG de verdade (não vira texto)',
      !!bCheckin && bCheckin.indexOf(Buffer.from([0xFF, 0xD8, 0xFF])) > 0
      && bCheckin.indexOf('/DCTDecode') > 0, digital(bCheckin));

    check('sem assinatura: o PDF avisa na folha e não declara imagem nenhuma',
      !!bSemSig && bSemSig.indexOf('(sem assinatura no quadro)') > 0
      && bSemSig.indexOf('(Fulano)') > 0 && bSemSig.indexOf('/XObject') < 0,
      bSemSig ? String(bSemSig.length) + ' bytes' : erro);
    check('com assinatura: o PDF declara a imagem JPEG no lugar certo',
      !!bComSig && bComSig.indexOf('/XObject << /Im0 7 0 R >>') > 0
      && bComSig.indexOf('/DCTDecode') > 0,
      bComSig ? String(bComSig.length) + ' bytes' : erro);

    // no código-fonte: o montador de PDF e o bloco de impressão existem UMA vez só
    const conta = (s) => html.split(s).length - 1;
    check('startxref aparece 1 vez no código (antes eram 2 montadores)', conta('startxref') === 1, 'achei ' + conta('startxref'));
    check('%%EOF aparece 1 vez no código (antes eram 2)', conta('%%EOF') === 1, 'achei ' + conta('%%EOF'));
    check('<h3>Assinatura do tutor</h3> aparece 1 vez no código (antes eram 3)',
      conta('<h3>Assinatura do tutor</h3>') === 1, 'achei ' + conta('<h3>Assinatura do tutor</h3>'));
    check('window.print() aparece 1 vez no código (antes eram 3)', conta('window.print()') === 1, 'achei ' + conta('window.print()'));
    check('zPrintAssinaturaHtml existe', typeof ctx.zPrintAssinaturaHtml === 'function');
    check('zPrintAbrir existe', typeof ctx.zPrintAbrir === 'function');
    if (typeof ctx.zPrintAssinaturaHtml === 'function') {
      const comImg = '<div class="pf-sec"><h3>Assinatura do tutor</h3><img class="pf-sig-img" src="data:x"><div class="pf-row" style="margin-top:6px">Ana</div></div>';
      const semImg = '<div class="pf-sec"><h3>Assinatura do tutor</h3><div class="pf-row">(sem assinatura)</div><div class="pf-row" style="margin-top:6px">—</div></div>';
      check('bloco de assinatura COM imagem sai exatamente como antes',
        ctx.zPrintAssinaturaHtml('data:x', 'Ana') === comImg, ctx.zPrintAssinaturaHtml('data:x', 'Ana'));
      check('bloco de assinatura SEM imagem sai exatamente como antes',
        ctx.zPrintAssinaturaHtml('', '') === semImg, ctx.zPrintAssinaturaHtml('', ''));
    }
  }
  console.log('');

  // ---- emoji no Telegram (Adriana, 25/ago/2026) ----
  // As mensagens para o tutor não chegavam ao grupo: emoji vira par surrogado e a ponte
  // quebrava cada metade numa entidade inválida — o Telegram recusava a mensagem inteira.
  console.log('Telegram — emoji não pode derrubar a mensagem:');
  {
    check('tgEmojiSeguro existe', typeof ctx.tgEmojiSeguro === 'function');
    if (typeof ctx.tgEmojiSeguro === 'function') {
      const r = ctx.tgEmojiSeguro('Hoje o Camus não quis comer. \u{1F436} Reforce em casa. \u{1F49B}');
      check('emoji sai como um número só (não em duas metades)',
        r.indexOf('&#128054;') >= 0 && r.indexOf('&#128155;') >= 0 && r.indexOf('&#55357;') < 0, r.slice(0, 120));
      check('acento é preservado como está (a ponte trata)', r.indexOf('não') >= 0);
      check('texto sem emoji não muda', ctx.tgEmojiSeguro('Camus não comeu') === 'Camus não comeu');
    }
    check('tgAvisar trata o texto antes de enviar', /_d\[k\]=tgEmojiSeguro\(_d\[k\]\)/.test(html));
    // a ponte também foi corrigida (vale quando a Adriana republicar)
    const gs = fs.readFileSync(path.join(__dirname, '..', 'integracao-telegram', 'Codigo.gs'), 'utf8');
    check('Codigo.gs junta o par surrogado antes de virar entidade', /0xD800\) \* 0x400/.test(gs));
  }
  console.log('');

  // ---- lista de exemplo virando hóspede de verdade (Adriana, 25/ago/2026) ----
  // O Check-in cobrava check-in de Bene, Bloom, Duda, Harry, Rock e Teka — a lista de
  // exemplo de 04/06 que ficava na tela quando a leitura da planilha falhava.
  console.log('Hospedagem — nada de hóspede inventado:');
  {
    ['Bene', 'Bloom', 'Teka', 'Harry'].forEach((n) => {
      const re = new RegExp("\\{\\s*nome:\\s*'" + n + "'");
      check('não existe ' + n + ' escrito à mão como hóspede', !re.test(html));
    });
    check('a lista de hóspedes começa vazia', /let hospedes=\[\];/.test(html));
    check('o app registra se conseguiu ler a planilha (HOSP_PLANILHA)', /var HOSP_PLANILHA=null;/.test(html));
    check('sem planilha lida, ninguém é cobrado de check-in',
      /if\(HOSP_PLANILHA!==true\) return out;/.test(html));
    check('a falha da planilha vai para a auditoria (não morre no console)',
      /audit\('planilha-hospedagem'/.test(html));
    if (typeof ctx.hospedesSemCheckin === 'function') {
      ctx.HOSP_PLANILHA = false;
      check('hospedesSemCheckin devolve vazio quando a planilha falhou', ctx.hospedesSemCheckin().length === 0);
      ctx.HOSP_PLANILHA = null;
      check('hospedesSemCheckin devolve vazio enquanto carrega', ctx.hospedesSemCheckin().length === 0);
    }
  }
  console.log('');

  // ---- Lote 1 da auditoria de gravações mudas (25/ago/2026) ----------------------
  // Gravação que engole o erro (`.catch(function(){})`) é gravação que ninguém sabe que
  // não aconteceu: o remédio some da tela e continua no banco, a presença não grava e o
  // FILHOt aparece como falta, a ocorrência de diarreia nunca chega à Coordenação.
  // O padrão certo já existe no app: `_logFalhaGrav(oque, e)` deixa rastro na auditoria
  // sem mudar o caminho de sucesso nem a tela.
  console.log('Lote 1 — gravações mudas graves (medicação, estoque, presença):');
  {
    // O inventário atribuiu a divergência de medicação a `_vMed`; `_vMed` é um validador
    // ANINHADO dentro de `salvarRelatorioCard` e a gravação mora na função de fora — por
    // isso o alvo aqui é `salvarRelatorioCard`, cujo texto cobre os dois.
    const LOTE1 = ['magRemoverItem', 'descontarEstoquePorDose', 'criarAvisoEstoque',
      'tocarEstoqueAcabando', 'registrarDoseAgendadaGlobal', 'salvarRelatorioCard',
      'vetSalvarMed', 'vetFilaGuardar', 'ckSalvar'];
    LOTE1.forEach((fn) => {
      check(fn + ' existe', typeof ctx[fn] === 'function');
      check(fn + ' sem .catch vazio', semCatchVazio(fn));
      check(fn + ' deixa rastro na falha (_logFalhaGrav)', /_logFalhaGrav\(/.test(String(ctx[fn] || '')));
    });

    // ---- prova de comportamento: o banco recusa e a auditoria fica sabendo ----------
    // `DB`, `currentHosp` e `MED_AGENDA_ITENS` são `let` no script do app (escopo léxico
    // global do realm) — só dá para trocá-los de dentro do próprio contexto, com vm.
    // O restore vem DEPOIS do await: a rejeição da promessa é microtarefa, e restaurar o
    // espião no mesmo bloco síncrono faria o rastro cair no `audit` de verdade.
    ctx.__lote1 = [];
    ctx.__bkp = {};
    const qsOrig = ctx.document.querySelector;
    const canEditMedOrig = ctx.canEditMed;
    try {
      const elFalso = { closest() { return {}; }, remove() {}, querySelector() { return null; } };
      ctx.document.querySelector = () => elFalso;
      ctx.canEditMed = () => true;
      vm.runInContext(`
        __bkp.DB = DB; __bkp.audit = audit; __bkp.hosp = currentHosp; __bkp.itens = MED_AGENDA_ITENS;
        (function(){
          var nega = function(){ return Promise.reject(new Error('permissao negada (teste)')); };
          var refFalso = { remove: nega, push: nega, set: nega, update: nega, transaction: nega,
                           once: function(){ return new Promise(function(){}); } };
          DB = { ref: function(){ return refFalso; } };
          audit = function(a, d){ __lote1.push({ acao: String(a || ''), detalhe: String(d == null ? '' : d) }); };
          currentHosp = { nome: 'Teste Harness', tutor: 'Tutor Teste', refKey: 'teste__tutor' };
          MED_AGENDA_ITENS = { item_teste: { nome: 'Betaína', q: '1', u: 'comprimido', horarios: ['07:30'] } };
          try { magRemoverItem('item_teste'); } catch(e) { __lote1.push({ acao: 'ERRO-CHAMADA', detalhe: 'magRemoverItem: ' + e.message }); }
          try { criarAvisoEstoque({ key: 'teste__tutor', itemId: 'item_teste', medNome: 'Betaína', motivo: 'projecao' }); }
          catch(e) { __lote1.push({ acao: 'ERRO-CHAMADA', detalhe: 'criarAvisoEstoque: ' + e.message }); }
        })();
      `, ctx);
      await new Promise((r) => setImmediate(r));
      await new Promise((r) => setImmediate(r));
    } finally {
      vm.runInContext('DB = __bkp.DB; audit = __bkp.audit; currentHosp = __bkp.hosp; MED_AGENDA_ITENS = __bkp.itens;', ctx);
      ctx.document.querySelector = qsOrig;
      ctx.canEditMed = canEditMedOrig;
    }
    const rastro = ctx.__lote1 || [];
    const falhou = rastro.filter((e) => e.acao === 'gravacao-FALHOU');
    const visto = JSON.stringify(rastro).slice(0, 240);
    check('magRemoverItem: banco recusa -> gravacao-FALHOU na auditoria',
      falhou.some((e) => e.detalhe.indexOf('remover rem') === 0), visto);
    check('criarAvisoEstoque: banco recusa -> gravacao-FALHOU na auditoria',
      falhou.some((e) => e.detalhe.indexOf('aviso de estoque') === 0), visto);
    check('o rastro nomeia o que não gravou (não é erro genérico)',
      falhou.every((e) => e.detalhe.length > 3), visto);

    // contagem: zero .catch vazio dentro do texto destas 9 funções
    const reVazio = /\.catch\(\s*(?:function\s*\(\s*\)|\(\s*\)\s*=>)\s*\{\s*\}\s*\)/g;
    let sobrou = 0, ondeSobrou = [];
    LOTE1.forEach((fn) => {
      const n = (String(ctx[fn] || '').match(reVazio) || []).length;
      if (n) { sobrou += n; ondeSobrou.push(fn + '×' + n); }
    });
    check('zero .catch vazio nas 9 funções do Lote 1', sobrou === 0, ondeSobrou.join(', '));
  }
  console.log('');

  // ---- Lote 2 da auditoria de gravações mudas (25/ago/2026) ----------------------
  // Parte A: mais 8 gravações graves (ficha do cadastro, renomear, presença na chamada,
  // conferência de pertences/alarme, aviso de ração) passam a deixar rastro.
  // Parte B: o próprio audit() ganha bolso. Ele é o caderno — não conseguia anotar a
  // própria falha, porque anotar significaria gravar no mesmo nó que acabou de recusar.
  // Agora o evento fica no aparelho e sobe sozinho quando o banco volta.
  console.log('Lote 2 — gravações graves + bolso da auditoria:');
  {
    const LOTE2 = ['setPelExtra', 'renomearCadastroPel', 'marcarPresenca',
      'cfToggleItem', 'cfCriarAvisoRacao', 'cfConfirmarAlarme'];
    LOTE2.forEach((fn) => {
      check(fn + ' existe', typeof ctx[fn] === 'function');
      check(fn + ' sem .catch vazio', semCatchVazio(fn));
      check(fn + ' deixa rastro na falha (_logFalhaGrav)', /_logFalhaGrav\(/.test(String(ctx[fn] || '')));
    });

    // #39: a tentativa de login barrada não grava mais direto no nó da auditoria (que é
    // o mesmo nó que pode estar recusando) — agora passa pelo audit() e herda o bolso.
    const srcLogin = String(ctx.doLogin || '');
    check('doLogin existe', typeof ctx.doLogin === 'function');
    check('doLogin não grava mais direto em daycare/auditoria', !/daycare\/auditoria/.test(srcLogin));
    check("doLogin registra pelo audit('login-barrado')", /audit\('login-barrado'/.test(srcLogin));

    // #46: a foto movida no renomear era disparada e esquecida (nem .catch tinha).
    check('renomearCadastroPel encadeia .catch no salvarFotoCad',
      /salvarFotoCad\([^;]*\)\s*\.catch/.test(String(ctx.renomearCadastroPel || '')));

    // ---- prova de comportamento: o bolso guarda, o reenvio esvazia -------------------
    // O localStorage do sandbox é um stub que sempre devolve null. Para provar a fila,
    // troca por um Map-like de verdade só durante o teste (restaurado no finally).
    const lsOrig = ctx.localStorage;
    const lojaFalsa = {
      _m: {},
      getItem(k) { return (k in this._m) ? this._m[k] : null; },
      setItem(k, v) { this._m[k] = String(v); },
      removeItem(k) { delete this._m[k]; },
    };
    let filaDepoisDeRecusa = null, filaDepoisDeSemBanco = null;
    let devolvidos = null, enviados = [], filaFinal = null, filaCap = null;
    try {
      ctx.localStorage = lojaFalsa;
      vm.runInContext('__bkp.DB2 = DB;', ctx);

      // 1) banco recusando -> o rastro cai no bolso com o motivo real
      vm.runInContext(`
        (function(){
          var nega = function(){ return Promise.reject(new Error('permissao negada (teste)')); };
          DB = { ref: function(){ return { push: nega, set: nega, update: nega }; } };
          audit('teste-fila', 'x', {});
        })();
      `, ctx);
      await new Promise((r) => setImmediate(r));
      await new Promise((r) => setImmediate(r));
      filaDepoisDeRecusa = JSON.parse(lojaFalsa.getItem('zeluz_audit_fila') || '[]');

      // 2) banco nulo (reconectando na abertura) -> também não perde o evento
      vm.runInContext(`DB = null; audit('teste-sem-banco', 'y');`, ctx);
      filaDepoisDeSemBanco = JSON.parse(lojaFalsa.getItem('zeluz_audit_fila') || '[]');

      // 3) banco de volta -> o bolso esvazia e tudo sobe marcado como reenviado
      ctx.__enviados = [];
      vm.runInContext(`
        DB = { ref: function(){ return { push: function(o){ __enviados.push(o); return Promise.resolve(); } }; } };
      `, ctx);
      devolvidos = await ctx._audReenviarBolso();
      enviados = ctx.__enviados || [];
      filaFinal = JSON.parse(lojaFalsa.getItem('zeluz_audit_fila') || '[]');

      // 4) cap de 200: o bolso não cresce sem fim (os mais antigos caem)
      lojaFalsa.setItem('zeluz_audit_fila', '[]');
      for (let i = 0; i < 205; i++) ctx._audGuardarNoBolso('2026-08-25', { acao: 'enche', i: i }, 'teste');
      filaCap = JSON.parse(lojaFalsa.getItem('zeluz_audit_fila') || '[]');
    } finally {
      vm.runInContext('DB = __bkp.DB2;', ctx);
      ctx.localStorage = lsOrig;
    }

    check('banco recusa -> o rastro fica no bolso (1 item)',
      Array.isArray(filaDepoisDeRecusa) && filaDepoisDeRecusa.length === 1 &&
      filaDepoisDeRecusa[0].rec && filaDepoisDeRecusa[0].rec.acao === 'teste-fila',
      JSON.stringify(filaDepoisDeRecusa || '').slice(0, 200));
    check('o bolso guarda o motivo real da recusa',
      !!(filaDepoisDeRecusa && filaDepoisDeRecusa[0] &&
         String(filaDepoisDeRecusa[0].motivo || '').indexOf('permissao') >= 0),
      JSON.stringify((filaDepoisDeRecusa || [])[0] || '').slice(0, 200));
    check('banco reconectando -> o evento também não se perde (2 itens)',
      Array.isArray(filaDepoisDeSemBanco) && filaDepoisDeSemBanco.length === 2 &&
      filaDepoisDeSemBanco[1].rec.acao === 'teste-sem-banco' &&
      filaDepoisDeSemBanco[1].motivo === 'banco reconectando',
      JSON.stringify(filaDepoisDeSemBanco || '').slice(0, 240));
    check('banco volta -> _audReenviarBolso devolve 2', devolvidos === 2, 'devolveu ' + devolvidos);
    check('os 2 sobem marcados como reenviado',
      enviados.length === 2 && enviados.every((r) => r.reenviado === true),
      JSON.stringify(enviados).slice(0, 240));
    check('o reenvio leva as ações certas',
      enviados.map((r) => r.acao).join(',') === 'teste-fila,teste-sem-banco',
      enviados.map((r) => r.acao).join(','));
    check('depois do reenvio o bolso fica vazio',
      Array.isArray(filaFinal) && filaFinal.length === 0,
      JSON.stringify(filaFinal || '').slice(0, 120));
    check('o bolso não passa de 200 (205 gravados -> 200)',
      Array.isArray(filaCap) && filaCap.length === 200, 'ficou com ' + (filaCap || []).length);
    check('wireFirebaseListeners esvazia o bolso quando o banco fica pronto',
      /_audReenviarBolso/.test(String(ctx.wireFirebaseListeners || '')));
  }
  console.log('');

  // ---- resumo ----
  console.log('== Resultado: ' + pass + ' ok, ' + fail + ' falha(s) ==');
  if (fail) { console.log('\nFalhas:'); fails.forEach((f) => console.log('  - ' + f)); }
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error('ERRO no harness:', e); process.exit(1); });
