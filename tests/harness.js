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

  // A lógica do Painel (Fase 2.1) mora fora do index.html, num arquivo só de conta.
  // Carrega no MESMO contexto: as funções pl* ficam globais, como ficarão no app
  // quando ele incluir <script src="painel-logica.js">. Se o arquivo ainda não
  // existir, o harness segue como antes — a rede de segurança não pode cair por
  // causa de um arquivo que ainda está por vir.
  const PL = path.join(__dirname, '..', 'auaulandia', 'painel-logica.js');
  if (fs.existsSync(PL)) {
    vm.runInContext(fs.readFileSync(PL, 'utf8'), ctx, { filename: 'painel-logica.js' });
    console.log('painel-logica.js carregou no mesmo sandbox.\n');
  }

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

  // ---- Lote 3 da auditoria de gravações mudas (25/ago/2026) ----------------------
  // `if(DB){ grava }` SEM `else`: quando o banco está reconectando, o bloco inteiro é pulado
  // e a tela segue como se tivesse salvo. É pior que erro de gravação — no erro pelo menos
  // existe um `.catch`; aqui não existe caminho nenhum, a gravação nem chega a ser tentada.
  // O padrão certo já mora no app (`ciSalvarRestricao`): trata os DOIS jeitos de falhar —
  // banco ausente no clique E gravação que rejeita depois.
  console.log('Lote 3 — banco reconectando: a tela não mente que salvou:');
  {
    const LOTE3 = ['ckSalvar', 'setPelExtra', 'ciSalvarCadastroFalta', 'cfConfirmarAlarme',
      'cfToggleItem', 'setAlmCad', 'setHospAlergia', 'marcarPresenca'];
    LOTE3.forEach((fn) => {
      check(fn + ' existe', typeof ctx[fn] === 'function');
      check(fn + ' trata banco reconectando (else do if(DB))',
        /banco reconectando/.test(String(ctx[fn] || '')));
    });

    // ---- prova de comportamento: com DB=null, o que a tela faz ----------------------
    // `DB` e os estados de tela são `let`/`var` do escopo do app — só dá para trocá-los de
    // dentro do próprio contexto, com vm. O restore vem no finally.
    ctx.__l3 = [];        // eventos que passaram pelo audit()
    ctx.__l3alerta = [];  // cartazes zAlertao que apareceram
    ctx.__l3fechou = [];  // telas fechadas / re-renderizadas
    ctx.__l3res = {};     // estado depois da chamada
    ctx.__l3st = {};      // texto que cada status de tela recebeu
    ctx.__bkp3 = {};

    const gebOrig = ctx.document.getElementById;
    const elDoTeste = {};
    // getElementById de mentira: devolve objeto REAL (legível) para os ids que o teste
    // observa, e o proxy universal para todo o resto — o app carrega igual.
    ctx.document.getElementById = function (id) {
      const s = String(id || '');
      if (s === 'hf-alergia-st' || s === 'ciCadFaltaStatus' || s === 'pel-saved' || s === 'pel-saved2') {
        if (!elDoTeste[s]) {
          elDoTeste[s] = {
            style: {},
            get textContent() { return ctx.__l3st[s] || ''; },
            set textContent(v) { ctx.__l3st[s] = String(v); },
          };
        }
        return elDoTeste[s];
      }
      if (s.indexOf('cf-ouviu-') === 0) return { checked: true, focus() {} };
      if (s.indexOf('ciCadF_') === 0) return { value: 'preenchido pelo teste' };
      return gebOrig.call(ctx.document, id);
    };

    try {
      vm.runInContext(`
        __bkp3.DB=DB; __bkp3.audit=audit; __bkp3.zAlertao=zAlertao;
        __bkp3.ckPontosDe=ckPontosDe; __bkp3.zFalta=zFalta; __bkp3.renderCheckin=renderCheckin;
        __bkp3.ckAtual=ckAtual; __bkp3.ckRascunho=ckRascunho;
        __bkp3.renderCfMed=renderCfMed; __bkp3.renderCfGate=renderCfGate;
        __bkp3.cfConf=cfConf; __bkp3.cfEstadiaId=cfEstadiaId;
        __bkp3.renderDaycare=renderDaycare; __bkp3.dcChamada=dcChamada;
        __bkp3.currentHosp=currentHosp; __bkp3.renderHosp=renderHosp;
        __bkp3.ciPelAtual=ciPelAtual; __bkp3.ciRenderCadastroFalta=ciRenderCadastroFalta;
        (function(){
          DB = null;   // banco reconectando
          audit = function(a,d){ __l3.push({ acao:String(a||''), detalhe:String(d==null?'':d) }); };
          zAlertao = function(t,l){ __l3alerta.push({ titulo:String(t||''), linhas:[].concat(l||[]).join(' | ') }); };
          renderCheckin = function(){ __l3fechou.push('renderCheckin'); };
          renderCfMed = function(){}; renderCfGate = function(){};
          renderDaycare = function(){}; renderHosp = function(){};
          ciRenderCadastroFalta = function(){};

          // 1) ckSalvar — o pior caso: fechava a tela e zerava o rascunho sem ter gravado.
          //    Os pontos do exame e o validador saem do caminho: quem está sob teste é o
          //    que acontece DEPOIS da validação, quando o banco não está lá.
          ckPontosDe = function(){ return []; };
          zFalta = function(){ return false; };
          ckAtual = { p:{ n:'Teste Harness', tutor:'Tutor Teste' } };
          ckRascunho = { pontos:{}, coleiraRep:'Seresto', coleiraId:'Sim', coco:'normal' };
          try { ckSalvar(); } catch(e) { __l3.push({ acao:'ERRO-CHAMADA', detalhe:'ckSalvar: '+e.message }); }
          __l3res.ckAtualDepois    = (ckAtual !== null && ckAtual !== undefined);
          __l3res.ckRascunhoDepois = (ckRascunho !== null && ckRascunho !== undefined);
          __l3res.ckFechou         = __l3fechou.length;

          // 2) cfConfirmarAlarme — o checkbox JÁ estava marcado pelo clique; sem banco a
          //    marca tem de voltar atrás, senão o outro plantão lê "TESTADO" que não existe.
          cfEstadiaId = 'estadia_teste';
          cfConf = { medicacao:{}, pertences:{} };
          try { cfConfirmarAlarme('med_0_betaina'); }
          catch(e) { __l3.push({ acao:'ERRO-CHAMADA', detalhe:'cfConfirmarAlarme: '+e.message }); }
          __l3res.medDepois = ((cfConf.medicacao||{})['med_0_betaina'] == null);

          // 3) marcarPresenca — a chamada é "quem está no prédio".
          dcChamada = {};
          try { marcarPresenca('teste-harness__tutor-teste','veio'); }
          catch(e) { __l3.push({ acao:'ERRO-CHAMADA', detalhe:'marcarPresenca: '+e.message }); }

          // 4) setHospAlergia — dado de segurança; o status da ficha tem de dizer o que houve.
          currentHosp = { nome:'Teste Harness', tutor:'Tutor Teste', refKey:'teste-harness__tutor-teste' };
          try { setHospAlergia('alergia','frango'); }
          catch(e) { __l3.push({ acao:'ERRO-CHAMADA', detalhe:'setHospAlergia: '+e.message }); }
        })();
      `, ctx);

      // 5) ciSalvarCadastroFalta — antes dizia "✅ N campo(s) salvo(s)" na hora, sem esperar
      //    nada. Primeiro com o banco RECUSANDO a gravação, depois com o banco aceitando.
      ctx.__l3st['ciCadFaltaStatus'] = '';
      vm.runInContext(`
        (function(){
          var nega = function(){ return Promise.reject(new Error('permissao negada (teste)')); };
          DB = { ref: function(){ return { set:nega, update:nega, push:nega }; } };
          ciPelAtual = { n:'Teste Harness', tutor:'Tutor Teste' };
          try { ciSalvarCadastroFalta(); }
          catch(e) { __l3.push({ acao:'ERRO-CHAMADA', detalhe:'ciSalvarCadastroFalta(nega): '+e.message }); }
        })();
      `, ctx);
      await new Promise((r) => setImmediate(r));
      await new Promise((r) => setImmediate(r));
      ctx.__l3res.statusRecusa = ctx.__l3st['ciCadFaltaStatus'] || '';

      ctx.__l3st['ciCadFaltaStatus'] = '';
      vm.runInContext(`
        (function(){
          var ok = function(){ return Promise.resolve(); };
          DB = { ref: function(){ return { set:ok, update:ok, push:ok }; } };
          try { ciSalvarCadastroFalta(); }
          catch(e) { __l3.push({ acao:'ERRO-CHAMADA', detalhe:'ciSalvarCadastroFalta(ok): '+e.message }); }
        })();
      `, ctx);
      await new Promise((r) => setImmediate(r));
      await new Promise((r) => setImmediate(r));
      ctx.__l3res.statusOk = ctx.__l3st['ciCadFaltaStatus'] || '';

      // 6) contrato de retorno do setPelExtra: RESOLVE sempre, com {ok:true}/{ok:false} —
      //    nunca recusa. Recusar faria os ~48 chamadores que ignoram o retorno estourarem
      //    "Uncaught (in promise)" no aparelho de quem está trabalhando. O rastro da falha
      //    continua na auditoria; quem precisa saber (B3) lê o `ok`.
      vm.runInContext(`
        (function(){
          var pet = { n:'Teste Harness', tutor:'Tutor Teste' };
          DB = null;
          __l3res.pSemBanco = setPelExtra(pet, { raca:'SRD' });
          var nega = function(){ return Promise.reject(new Error('permissao negada (teste)')); };
          DB = { ref: function(){ return { set:nega, update:nega, push:nega }; } };
          __l3res.pRecusa = setPelExtra(pet, { raca:'SRD' });
        })();
      `, ctx);
      await ctx.__l3res.pSemBanco.then(
        (v) => { ctx.__l3res.semBanco = v; },
        () => { ctx.__l3res.semBancoRejeitou = true; });
      await ctx.__l3res.pRecusa.then(
        (v) => { ctx.__l3res.recusa = v; },
        () => { ctx.__l3res.recusaRejeitou = true; });
    } finally {
      vm.runInContext(`
        DB=__bkp3.DB; audit=__bkp3.audit; zAlertao=__bkp3.zAlertao;
        ckPontosDe=__bkp3.ckPontosDe; zFalta=__bkp3.zFalta; renderCheckin=__bkp3.renderCheckin;
        ckAtual=__bkp3.ckAtual; ckRascunho=__bkp3.ckRascunho;
        renderCfMed=__bkp3.renderCfMed; renderCfGate=__bkp3.renderCfGate;
        cfConf=__bkp3.cfConf; cfEstadiaId=__bkp3.cfEstadiaId;
        renderDaycare=__bkp3.renderDaycare; dcChamada=__bkp3.dcChamada;
        currentHosp=__bkp3.currentHosp; renderHosp=__bkp3.renderHosp;
        ciPelAtual=__bkp3.ciPelAtual; ciRenderCadastroFalta=__bkp3.ciRenderCadastroFalta;
      `, ctx);
      ctx.document.getElementById = gebOrig;
    }

    const r3 = ctx.__l3res || {};
    const rastro3 = ctx.__l3 || [];
    const falhou3 = rastro3.filter((e) => e.acao === 'gravacao-FALHOU');
    const alertas3 = ctx.__l3alerta || [];
    const visto3 = JSON.stringify(rastro3).slice(0, 260);

    check('ckSalvar sem banco NÃO fecha a tela nem limpa o rascunho',
      r3.ckAtualDepois === true && r3.ckRascunhoDepois === true && r3.ckFechou === 0,
      'ckAtual=' + r3.ckAtualDepois + ' ckRascunho=' + r3.ckRascunhoDepois + ' renderCheckin×' + r3.ckFechou);
    check('ckSalvar sem banco avisa (zAlertao) e deixa rastro',
      alertas3.some((a) => a.titulo.indexOf('NADA FOI SALVO') >= 0) &&
      falhou3.some((e) => e.detalhe.indexOf('check-in do corpo') === 0),
      JSON.stringify(alertas3).slice(0, 200));
    check('ckSalvar sem banco NÃO audita o check-in como concluído',
      !rastro3.some((e) => e.acao === 'checkin-corpo' || e.acao === 'checkout-corpo'), visto3);
    check('cfConfirmarAlarme sem banco NÃO marca confirmado',
      r3.medDepois === true, 'cfConf.medicacao ficou ' + JSON.stringify(r3.medDepois));
    check('marcarPresenca sem banco deixa rastro de banco reconectando',
      falhou3.some((e) => e.detalhe.indexOf('presença na chamada') === 0 &&
        e.detalhe.indexOf('reconectando') > 0), visto3);
    check('setHospAlergia sem banco deixa rastro e avisa na tela',
      falhou3.some((e) => e.detalhe.indexOf('alergia/') === 0 &&
        e.detalhe.indexOf('reconectando') > 0) &&
      String(ctx.__l3st['hf-alergia-st'] || '').indexOf('NÃO salvou') >= 0,
      JSON.stringify(ctx.__l3st['hf-alergia-st'] || '').slice(0, 160));
    check('ciSalvarCadastroFalta: banco recusa -> nada de "✅ salvo"',
      String(r3.statusRecusa).indexOf('✅') < 0 &&
      String(r3.statusRecusa).indexOf('NÃO salvou') >= 0, JSON.stringify(r3.statusRecusa));
    check('ciSalvarCadastroFalta: banco aceita -> aí sim "✅ salvo"',
      String(r3.statusOk).indexOf('✅') >= 0, JSON.stringify(r3.statusOk));
    check('setPelExtra nunca rejeita: sem banco resolve {ok:false}',
      r3.semBancoRejeitou !== true && !!r3.semBanco && r3.semBanco.ok === false,
      'rejeitou=' + (r3.semBancoRejeitou === true) + ' valor=' + JSON.stringify(r3.semBanco));
    check('setPelExtra com banco recusando resolve {ok:false} e deixa rastro',
      r3.recusaRejeitou !== true && !!r3.recusa && r3.recusa.ok === false &&
      falhou3.some((e) => e.detalhe.indexOf('ficha do cadastro') === 0),
      'rejeitou=' + (r3.recusaRejeitou === true) + ' valor=' + JSON.stringify(r3.recusa));
  }
  console.log('');

  // ---- Telegram: o aviso de quem não comeu (25/ago/2026) -------------------------
  // 24/ago, 15:33: o Octávio marcou Camus e Luna como quem não comeu nem no 2º horário.
  // O grupo nunca soube e não sobrou rastro — `avisos-telegram-comida/2026-08-24` vazio,
  // nenhum evento `telegram-comida` na auditoria. A leitura "já mandei isso hoje?" era um
  // `once('value')` puro: sem rede naquele segundo, o Firebase deixa a LEITURA pendente para
  // sempre e o envio morre esperando. Estes testes provam que agora não morre mais calado.
  console.log('Telegram — aviso de quem não comeu nunca trava mudo:');
  {
    const K = ctx.dcKey('Camus', 'Sophia');
    const DIA = ctx.dcDataKey();
    const P = 'daycare/avisos-telegram-comida/' + DIA + '/' + K;

    const bkp = {
      TG_CFG: ctx.TG_CFG, tgAvisar: ctx.tgAvisar, turmaDoDia: ctx.turmaDoDia,
      pessoaDoTurno: ctx.pessoaDoTurno, horaAgora: ctx.horaAgora, quemSou: ctx.quemSou,
      pelExtra: ctx.pelExtra, audit: ctx.audit, zAlertao: ctx.zAlertao,
      setTimeout: ctx.setTimeout, EMP_TG: ctx.EMP_TG, EMP_AVISOS: ctx.EMP_AVISOS,
      EMP_ATRASO: ctx.EMP_ATRASO, a1: ctx.__empAlm1, a2: ctx.__empAlm2,
      geb: ctx.document.getElementById,
    };
    ctx.__bkpTg = {};
    vm.runInContext('__bkpTg.DB = DB;', ctx);

    // Ordem REAL dos acontecimentos: gravações e envios no mesmo registro, para provar que o
    // rastro `tentando` é gravado ANTES da primeira mensagem sair.
    const log = [];
    const escritas = {};
    const fazDB = (leitura) => ({
      ref(p) {
        return {
          update(v) { log.push({ o: 'update', p, v }); escritas[p] = Object.assign({}, escritas[p] || {}, v); return Promise.resolve(); },
          set(v) { log.push({ o: 'set', p, v }); escritas[p] = v; return Promise.resolve(); },
          once() { log.push({ o: 'once', p }); return leitura(p); },
        };
      },
    });
    const porDB = (leitura) => { ctx.__tgDB = fazDB(leitura); vm.runInContext('DB = __tgDB;', ctx); };
    const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
    const zerar = () => { log.length = 0; Object.keys(escritas).forEach((k) => delete escritas[k]); auditados.length = 0; alertas.length = 0; try { ctx.COMIDA_AVISO_OK.clear(); } catch (e) {} };

    const auditados = [], alertas = [];
    let tgResp = { ok: true };

    try {
      // O sandbox tem `setTimeout(){}` VAZIO — sem isto, a corrida de 6 s nunca resolveria.
      ctx.setTimeout = (fn, ms) => setTimeout(fn, Math.min(Number(ms) || 0, 30));
      ctx.TG_CFG = { url: 'https://ponte.teste', senha: 'x' };
      ctx.tgAvisar = function (d) { log.push({ o: 'tg', t: String((d && d.texto) || '') }); return Promise.resolve(tgResp); };
      ctx.turmaDoDia = () => [{ p: { n: 'Camus', tutor: 'Sophia', raca: 'Maltês' } }];
      ctx.pessoaDoTurno = () => 'Octávio';
      ctx.horaAgora = () => '15:33';
      ctx.quemSou = () => 'Octávio';
      ctx.pelExtra = () => ({ sexo: 'M' });
      ctx.audit = function (a, d) { auditados.push({ acao: String(a || ''), detalhe: String(d == null ? '' : d) }); };
      ctx.zAlertao = function (t) { alertas.push(String(t || '')); };

      // 1) A LEITURA NUNCA RESPONDE — o caso real de 24/ago.
      zerar();
      porDB(() => new Promise(() => {}));
      ctx.avisarGrupoComida(K);
      await esperar(180);
      const envios1 = log.filter((e) => e.o === 'tg');
      const iTentando = log.findIndex((e) => e.o === 'update' && e.p === P && e.v && e.v.tentando === true);
      const iPrimeiroEnvio = log.findIndex((e) => e.o === 'tg');
      check('leitura travada: mesmo assim o grupo recebe as 2 mensagens',
        envios1.length === 2, envios1.length + ' mensagem(ns) — ' + JSON.stringify(envios1.map((e) => e.t.slice(0, 40))));
      check('leitura travada: fica registro tentando ANTES do envio',
        iTentando >= 0 && iPrimeiroEnvio >= 0 && iTentando < iPrimeiroEnvio,
        'tentando@' + iTentando + ' envio@' + iPrimeiroEnvio);
      check('leitura travada: o registro final tem ok:true',
        !!escritas[P] && escritas[P].ok === true && escritas[P].tentando === false,
        JSON.stringify(escritas[P]));
      check('leitura travada: audit telegram-comida gravado',
        auditados.some((e) => e.acao === 'telegram-comida' && /avisou o grupo/.test(e.detalhe)),
        JSON.stringify(auditados).slice(0, 200));

      // 2) JÁ AVISADO HOJE — não repete; só repete se for reenvio forçado pela consultora.
      zerar();
      porDB(() => Promise.resolve({ val: () => ({ ok: true }) }));
      ctx.avisarGrupoComida(K);
      await esperar(120);
      check('já avisado: não manda de novo sozinho', log.filter((e) => e.o === 'tg').length === 0);
      zerar();
      ctx.avisarGrupoComida(K, { forcar: true });
      await esperar(120);
      check('já avisado: com {forcar:true} manda as 2 mensagens de novo',
        log.filter((e) => e.o === 'tg').length === 2);

      // 3) A PONTE FALHA — registro com o motivo e cartaz na tela de quem serviu.
      zerar();
      tgResp = { ok: false, erro: 'ponte fora' };
      porDB(() => Promise.resolve({ val: () => null }));
      ctx.avisarGrupoComida(K);
      await esperar(120);
      check('ponte falha: registro final ok:false com o motivo',
        !!escritas[P] && escritas[P].ok === false && escritas[P].erro === 'ponte fora',
        JSON.stringify(escritas[P]));
      check('ponte falha: quem serviu vê o cartaz na tela',
        alertas.some((t) => /NÃO FOI AVISADO/.test(t)), JSON.stringify(alertas));
      tgResp = { ok: true };

      // 4) A TELA — a consultora precisa ver se o grupo soube, e reenviar quando não soube.
      const elFalso = { innerHTML: '' }, cntFalso = { textContent: '' };
      ctx.document.getElementById = function (id) {
        const s = String(id || '');
        if (s === 'empList') return elFalso;
        if (s === 'empCount') return cntFalso;
        return bkp.geb.call(ctx.document, id);
      };
      ctx.__empAlm1 = { [K]: 'nao' };
      ctx.__empAlm2 = { [K]: 'nao' };
      ctx.EMP_AVISOS = {};
      ctx.EMP_ATRASO = [];

      ctx.EMP_TG = { [K]: { ok: false, erro: 'ponte fora' } };
      elFalso.innerHTML = ''; ctx.renderEmporio();
      const htmlFalhou = String(elFalso.innerHTML || '');
      check('tela: sem aviso ao grupo, o cartão diz que NÃO foi avisado',
        /NÃO foi avisado/.test(htmlFalhou), htmlFalhou.slice(0, 160));
      check('tela: e oferece o botão de reenviar ao grupo',
        htmlFalhou.indexOf('empReenviarGrupo(') >= 0, htmlFalhou.slice(0, 160));

      ctx.EMP_TG = { [K]: { ok: true } };
      elFalso.innerHTML = ''; ctx.renderEmporio();
      check('tela: com o grupo avisado, o cartão confirma',
        /Grupo do Telegram avisado/.test(String(elFalso.innerHTML || '')),
        String(elFalso.innerHTML || '').slice(0, 160));

      ctx.EMP_TG = { [K]: { tentando: true, ts: Date.now() } };
      elFalso.innerHTML = ''; ctx.renderEmporio();
      check('tela: tentativa em curso aparece como "Avisando o grupo"',
        /Avisando o grupo/.test(String(elFalso.innerHTML || '')) &&
        String(elFalso.innerHTML || '').indexOf('empReenviarGrupo(') < 0,
        String(elFalso.innerHTML || '').slice(0, 160));

      // 5) O texto do código — as duas defesas continuam lá.
      check('avisarGrupoComida usa Promise.race (leitura com tempo máximo)',
        /Promise\.race/.test(String(ctx.avisarGrupoComida || '')));
      check('avisarGrupoComida grava o rastro tentando',
        /tentando/.test(String(ctx.avisarGrupoComida || '')));
      check('empAvisarAtrasoNoTelegram registra as falhas do envio',
        /falhas/.test(String(ctx.empAvisarAtrasoNoTelegram || '')));
    } finally {
      vm.runInContext('DB = __bkpTg.DB;', ctx);
      ctx.TG_CFG = bkp.TG_CFG; ctx.tgAvisar = bkp.tgAvisar; ctx.turmaDoDia = bkp.turmaDoDia;
      ctx.pessoaDoTurno = bkp.pessoaDoTurno; ctx.horaAgora = bkp.horaAgora; ctx.quemSou = bkp.quemSou;
      ctx.pelExtra = bkp.pelExtra; ctx.audit = bkp.audit; ctx.zAlertao = bkp.zAlertao;
      ctx.setTimeout = bkp.setTimeout; ctx.EMP_TG = bkp.EMP_TG; ctx.EMP_AVISOS = bkp.EMP_AVISOS;
      ctx.EMP_ATRASO = bkp.EMP_ATRASO; ctx.__empAlm1 = bkp.a1; ctx.__empAlm2 = bkp.a2;
      ctx.document.getElementById = bkp.geb;
      try { ctx.COMIDA_AVISO_OK.clear(); } catch (e) {}
    }
  }
  console.log('');

  // ---- Passo 2 — janelinhas nativas: duplos + Lote 1 ---------------------------------
  // O pior padrão do app era a janela nativa (confirm/prompt) no caminho de gravar: no
  // tablet o navegador pode suprimi-la e responder "cancelar" sozinho — foi assim que o
  // relatório inteiro de um plantão se perdeu (commit 260c544). Pior ainda eram os PARES
  // de confirm seguidos. Aqui provamos que saíram e que o substituto funciona: o 1º toque
  // só ARMA o botão (nada é gravado) e o 2º toque GRAVA.
  console.log('Passo 2 — janelinhas nativas: duplos + Lote 1:');
  {
    // Contagem no arquivo inteiro. Medida em 25/ago/2026, antes de mexer: 56 chamadas de
    // confirm e 35 de prompt. Este passo tirou 14 de confirm (13 chamadas reais + 1 citação
    // dentro de comentário histórico) e 3 de prompt.
    const CONFIRM_ANTES = 56, CONFIRM_SAIRAM = 14; // 25/ago/2026
    const PROMPT_ANTES = 35, PROMPT_SAIRAM = 3;    // 25/ago/2026
    const nConfirm = (html.match(/\bconfirm\s*\(/g) || []).length;
    const nPrompt = (html.match(/\bprompt\s*\(/g) || []).length;
    check('confirm() nativo no arquivo caiu para ' + (CONFIRM_ANTES - CONFIRM_SAIRAM),
      nConfirm === CONFIRM_ANTES - CONFIRM_SAIRAM, 'achei ' + nConfirm);
    check('prompt() nativo no arquivo caiu para ' + (PROMPT_ANTES - PROMPT_SAIRAM),
      nPrompt === PROMPT_ANTES - PROMPT_SAIRAM, 'achei ' + nPrompt);

    // ---- texto das funções: nenhuma pode mais chamar a janela nativa ----
    const LIMPAS = ['salvarRelatorioCard', 'acertoRecalcular', 'cancelarHospedeManual',
      'removerHospedeCard', 'cancelarPernoiteFicha', 'ciCriarNovoHospede', 'ciSalvar',
      'ciCorrigirExistente', 'cfAvisarFaltaMed', 'cfRemoverOcorrencia', 'zCampo'];
    LIMPAS.forEach((fn) => {
      check(fn + ' existe', typeof ctx[fn] === 'function');
      check(fn + ' NÃO usa confirm()/prompt() nativo',
        !/\b(confirm|prompt)\s*\(/.test(String(ctx[fn] || '')));
    });
    check('salvarRelatorioCard grava por continuação (_gravarRel) e pergunta na tela (zEscolha)',
      /_gravarRel/.test(String(ctx.salvarRelatorioCard || '')) &&
      /zEscolha/.test(String(ctx.salvarRelatorioCard || '')));
    check('ciSalvar lê motivo e nome dos campos da tela do modo CORRIGIR',
      /ciCorrigirMotivo/.test(String(ctx.ciSalvar || '')) &&
      /ciCorrigirQuem/.test(String(ctx.ciSalvar || '')));
    check('o cartão do modo CORRIGIR já mostra os dois campos',
      /ciCorrigirMotivo/.test(String(ctx.ciCorrigirExistente || '')) &&
      /ciCorrigirQuem/.test(String(ctx.ciCorrigirExistente || '')));
    check('os botões de 2 toques recebem o próprio botão (this) no onclick',
      /removerHospedeCard\(\$\{i\},this\)/.test(html) &&
      /cancelarPernoiteFicha\(this\)/.test(html) &&
      /acertoRecalcular\(\\'.+?\\',this\)/.test(html) &&
      /cfAvisarFaltaMed\('\+idx\+',this\)/.test(html) &&
      /ciCriarNovoHospede\(this\)/.test(html));

    // ---- prova de comportamento: 1º toque arma, 2º toque grava ----
    // Botão de mentira: só o que o app toca (texto, estilo, dataset, classes).
    const botao = (txt) => ({
      textContent: txt || 'Botão', title: '', disabled: false, style: {}, dataset: {},
      classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    });
    ctx.__p2 = { escritas: [], alertas: [], res: {} };
    ctx.__p2b = {
      acerto: botao('Atualizar para R$ 150,00'),
      med: botao('Avisar a Recepção'),
      ocor: botao('✕'),
      remCard: botao('✕'),
      remCurto: botao('✕'),
      fichaEst: botao('🗑️ Deletar este peludinho do Hotel (hoje)'),
      fichaMan: botao('🗑️ Deletar este peludinho do Hotel (hoje)'),
      novoPel: botao('Cadastrar e iniciar check-in'),
    };
    ctx.__bkp2 = {};
    const gebP2 = ctx.document.getElementById;
    const elsP2 = {
      ciNovoNome: { value: 'Maya' }, ciNovoTutor: { value: 'Carolina' }, ciNovoRaca: { value: 'Spitz' },
      ciNovoWarn: { textContent: '', innerHTML: '' },
      ciNovoNasc: { value: '' }, ciNovoPeso: { value: '' }, ciNovoChip: { value: '' },
      ciNovoCorPelo: { value: '' }, ciNovoIdadeAprox: { value: '' }, ciNovoIdade: { value: '' },
      ciNovoPainel: { style: {} }, ciToggleNovoTxt: { textContent: '' },
    };
    ctx.document.getElementById = function (id) {
      const s = String(id || '');
      if (Object.prototype.hasOwnProperty.call(elsP2, s)) return elsP2[s];
      return gebP2.call(ctx.document, id);
    };
    const papelAntes = ctx.__ROLE__.role;
    ctx.__ROLE__.role = 'gestao';

    try {
      vm.runInContext(`
        __bkp2.DB=DB; __bkp2.audit=audit; __bkp2.zAlertao=zAlertao; __bkp2.zCampo=zCampo;
        __bkp2.acertoNoites=acertoNoites; __bkp2.renderAcerto=renderAcerto;
        __bkp2.ACERTO_REG=ACERTO_REG; __bkp2.ACERTO_QUEM=ACERTO_QUEM;
        __bkp2.cfEstadia=cfEstadia; __bkp2.cfEstadiaId=cfEstadiaId;
        __bkp2.medCoberturaEstadia=medCoberturaEstadia; __bkp2.cfMedRefs=cfMedRefs;
        __bkp2.criarAvisoEstoque=criarAvisoEstoque; __bkp2.renderCfMed=renderCfMed;
        __bkp2.renderCfOcorrencias=renderCfOcorrencias;
        __bkp2.hospedes=hospedes; __bkp2.hospEstadiaAtivaDe=hospEstadiaAtivaDe;
        __bkp2.carregarHospedes=carregarHospedes; __bkp2.carregarManuais=carregarManuais;
        __bkp2.quemSou=quemSou; __bkp2.renderHosp=renderHosp; __bkp2.fecharPlantao=fecharPlantao;
        __bkp2.currentHosp=currentHosp; __bkp2.CF_ESTADIAS=CF_ESTADIAS; __bkp2.medAgendaKey=medAgendaKey;
        __bkp2.PELUDINHOS=PELUDINHOS; __bkp2.achaPorIdNR=achaPorIdNR; __bkp2.ciEscolher=ciEscolher;
        (function(){
          var mkRef=function(p){ return {
            set:function(v){ __p2.escritas.push({op:'set',path:p}); return Promise.resolve(); },
            update:function(v){ __p2.escritas.push({op:'update',path:p}); return Promise.resolve(); },
            remove:function(){ __p2.escritas.push({op:'remove',path:p}); return Promise.resolve(); },
            push:function(v){ __p2.escritas.push({op:'push',path:p}); return {key:'k1',
              set:function(){ __p2.escritas.push({op:'push-set',path:p}); return Promise.resolve(); }}; },
            once:function(){ return Promise.resolve({ val:function(){ return null; } }); }
          }; };
          DB={ ref:mkRef };
          audit=function(){};
          zAlertao=function(t){ __p2.alertas.push(String(t||'')); };
          var _zc=zCampo;
          zCampo=function(t,l,op){ __p2.res.zcampo={ titulo:String(t||''),
            campoId:(op&&op.campoId)||'', botao:(op&&op.botao)||'', minimo:(op&&op.minimo)||0 };
            return _zc(t,l,op); };

          // --- 1) acertoRecalcular (dinheiro do acerto do plantão) ---
          renderAcerto=function(){};
          acertoNoites=function(){ return [{ iso:'2026-08-20', n:2, pets:['Toddy','Maya'] }]; };
          ACERTO_REG={ '2026-08-20':{ valor_total_cent:12000 } };
          ACERTO_QUEM={ '2026-08-20':{ quantas:1, dobrou:false } };
          __p2.escritas.length=0;
          acertoRecalcular('2026-08-20', __p2b.acerto);
          __p2.res.acerto1={ n:__p2.escritas.length, txt:__p2b.acerto.textContent, armed:__p2b.acerto.dataset.armed };
          acertoRecalcular('2026-08-20', __p2b.acerto);
          __p2.res.acerto2={ n:__p2.escritas.length, path:(__p2.escritas[0]||{}).path||'' };

          // --- 2) cfAvisarFaltaMed (remédio que não cobre a estadia) ---
          renderCfMed=function(){}; renderCfOcorrencias=function(){};
          cfEstadia={ medicacao:[{ nome:'Apoquel', q:1, u:'comprimido' }], entrada:'2026-08-20', saida:'2026-08-25', ocorrencias:{ o1:{ texto:'chegou com colar' } } };
          medCoberturaEstadia=function(){ return { cobre:false, deficit:3, unidade:'comprimido', trazido:2, necessario:5, ate:'25/08' }; };
          cfMedRefs=function(){ return { key:'k', itemId:'i' }; };
          criarAvisoEstoque=function(d){ __p2.escritas.push({ op:'aviso-estoque', path:'estoque/'+(d&&d.medNome||'') }); };
          __p2.escritas.length=0;
          cfAvisarFaltaMed(0, __p2b.med);
          __p2.res.med1={ n:__p2.escritas.length, txt:__p2b.med.textContent, armed:__p2b.med.dataset.armed };
          cfAvisarFaltaMed(0, __p2b.med);
          __p2.res.med2={ n:__p2.escritas.length, path:(__p2.escritas[0]||{}).path||'' };

          // --- 3) cfRemoverOcorrencia (o que se apaga não volta) ---
          cfEstadiaId='est1';
          __p2.escritas.length=0;
          cfRemoverOcorrencia('o1', __p2b.ocor);
          __p2.res.ocor1={ n:__p2.escritas.length, txt:__p2b.ocor.textContent, armed:__p2b.ocor.dataset.armed };
          cfRemoverOcorrencia('o1', __p2b.ocor);
          __p2.res.ocor2={ n:__p2.escritas.length, path:(__p2.escritas[0]||{}).path||'' };

          // --- 4) DUPLO: removerHospedeCard (era confirm + prompt + confirm final) ---
          hospedes=[{ nome:'Toddy', tutor:'Ana', manualKey:'mk1', manualDia:'2026-08-25' }];
          hospEstadiaAtivaDe=function(){ return { entrada:'2026-08-20', saida:'2026-08-30' }; };
          carregarHospedes=function(){}; carregarManuais=function(){}; renderHosp=function(){};
          quemSou=function(){ return 'Rosana'; };
          __p2.escritas.length=0;
          removerHospedeCard(0, __p2b.remCard);
          __p2.res.rem1={ n:__p2.escritas.length, txt:__p2b.remCard.textContent,
            armed:__p2b.remCard.dataset.armed, titulo:__p2b.remCard.title };
          __p2b.remCard.dataset.motivo='lancei a Maya da tutora errada';
          removerHospedeCard(0, __p2b.remCard);
          __p2.res.rem2={ n:__p2.escritas.length, paths:__p2.escritas.map(function(e){ return e.path; }).join(' | ') };
          // motivo curto: NÃO grava e avisa na tela
          __p2.escritas.length=0; __p2.alertas.length=0;
          removerHospedeCard(0, __p2b.remCurto);
          __p2b.remCurto.dataset.motivo='erro';
          removerHospedeCard(0, __p2b.remCurto);
          __p2.res.remCurto={ n:__p2.escritas.length, alerta:__p2.alertas.join(' | ') };

          // --- 5) DUPLO: cancelarPernoiteFicha, par "cancelar a estadia" ---
          currentHosp={ nome:'Toddy', tutor:'Ana', refKey:'toddy__ana', manualKey:'mk1', manualDia:'2026-08-25' };
          medAgendaKey=function(){ return 'toddy__ana'; };
          fecharPlantao=function(){};
          CF_ESTADIAS={ 'toddy__ana':{ id:'est9', e:{ status:'ativa' } } };
          __p2.escritas.length=0;
          cancelarPernoiteFicha(__p2b.fichaEst);
          __p2.res.est1={ n:__p2.escritas.length, txt:__p2b.fichaEst.textContent, armed:__p2b.fichaEst.dataset.armed };
          cancelarPernoiteFicha(__p2b.fichaEst);
          __p2.res.est2={ n:__p2.escritas.length, path:(__p2.escritas[0]||{}).path||'' };

          // --- 6) DUPLO: cancelarPernoiteFicha, par "deletar do Hotel de hoje" ---
          CF_ESTADIAS={};
          __p2.escritas.length=0;
          cancelarPernoiteFicha(__p2b.fichaMan);
          __p2.res.man1={ n:__p2.escritas.length, txt:__p2b.fichaMan.textContent, armed:__p2b.fichaMan.dataset.armed };
          cancelarPernoiteFicha(__p2b.fichaMan);
          __p2.res.man2={ n:__p2.escritas.length, path:(__p2.escritas[0]||{}).path||'' };

          // --- 7) ciCriarNovoHospede (homônimo no check-in) ---
          PELUDINHOS=[{ n:'Maya', tutor:'Luciana', raca:'Yorkshire', dias:[] }];
          achaPorIdNR=function(){ return null; };
          ciEscolher=function(){};
          __p2.escritas.length=0;
          ciCriarNovoHospede(__p2b.novoPel);
          __p2.res.novo1={ n:__p2.escritas.length, txt:__p2b.novoPel.textContent,
            armed:__p2b.novoPel.dataset.armed, pel:PELUDINHOS.length };
          ciCriarNovoHospede(__p2b.novoPel);
          __p2.res.novo2={ n:__p2.escritas.length, pel:PELUDINHOS.length,
            path:(__p2.escritas[0]||{}).path||'' };
        })();
      `, ctx);

      const R2 = ctx.__p2.res;
      // acertoRecalcular
      check('acertoRecalcular: 1º toque NÃO grava (só arma)',
        R2.acerto1.n === 0 && R2.acerto1.armed === '1' && /^Confirmar/.test(R2.acerto1.txt),
        JSON.stringify(R2.acerto1));
      check('acertoRecalcular: o botão armado mostra o valor de antes e o de depois',
        /R\$ 120,00/.test(R2.acerto1.txt) && /R\$/.test(R2.acerto1.txt), R2.acerto1.txt);
      check('acertoRecalcular: 2º toque grava o acerto',
        R2.acerto2.n > 0 && /acerto-plantao\/2026-08-20/.test(R2.acerto2.path),
        JSON.stringify(R2.acerto2));
      // cfAvisarFaltaMed
      check('cfAvisarFaltaMed: 1º toque NÃO avisa a Recepção (só arma)',
        R2.med1.n === 0 && R2.med1.armed === '1' && /^Confirmar/.test(R2.med1.txt),
        JSON.stringify(R2.med1));
      check('cfAvisarFaltaMed: 2º toque cria o aviso de estoque',
        R2.med2.n > 0 && /estoque\/Apoquel/.test(R2.med2.path), JSON.stringify(R2.med2));
      // cfRemoverOcorrencia
      check('cfRemoverOcorrencia: 1º toque NÃO apaga (só arma)',
        R2.ocor1.n === 0 && R2.ocor1.armed === '1' && /Confirmar/.test(R2.ocor1.txt),
        JSON.stringify(R2.ocor1));
      check('cfRemoverOcorrencia: 2º toque apaga a ocorrência',
        R2.ocor2.n > 0 && /estadias\/est1\/ocorrencias\/o1/.test(R2.ocor2.path),
        JSON.stringify(R2.ocor2));
      // DUPLO 1 — removerHospedeCard
      check('removerHospedeCard (duplo): 1º toque NÃO grava (só arma)',
        R2.rem1.n === 0 && R2.rem1.armed === '1' && R2.rem1.txt !== '✕',
        JSON.stringify(R2.rem1));
      check('removerHospedeCard (duplo): o 1º toque abre o CAMPO do motivo na tela',
        (ctx.__p2.res.zcampo || {}).campoId === 'hospRemMotivo' &&
        (ctx.__p2.res.zcampo || {}).minimo === 8,
        JSON.stringify(ctx.__p2.res.zcampo || {}));
      check('removerHospedeCard (duplo): o botão do cartaz diz o que vai acontecer',
        /^Confirmar — tirar Toddy do Plantão de hoje/.test((ctx.__p2.res.zcampo || {}).botao || ''),
        (ctx.__p2.res.zcampo || {}).botao);
      check('removerHospedeCard (duplo): 2º toque grava (removidos + apaga o lançamento)',
        R2.rem2.n >= 2 && /removidos/.test(R2.rem2.paths) && /manuais\/2026-08-25\/mk1/.test(R2.rem2.paths),
        JSON.stringify(R2.rem2));
      check('removerHospedeCard: motivo curto NÃO grava e avisa na tela',
        R2.remCurto.n === 0 && /NÃO TIREI/.test(R2.remCurto.alerta), JSON.stringify(R2.remCurto));
      // DUPLO 2 — cancelarPernoiteFicha (estadia)
      check('cancelarPernoiteFicha (duplo "cancelar estadia"): 1º toque NÃO grava (só arma)',
        R2.est1.n === 0 && R2.est1.armed === '1' && /^Confirmar — cancelar a estadia de Toddy/.test(R2.est1.txt),
        JSON.stringify(R2.est1));
      check('cancelarPernoiteFicha (duplo "cancelar estadia"): 2º toque grava',
        R2.est2.n > 0 && /estadias\/est9/.test(R2.est2.path), JSON.stringify(R2.est2));
      // DUPLO 3 — cancelarPernoiteFicha (deletar do Hotel de hoje)
      check('cancelarPernoiteFicha (duplo "deletar do Hotel"): 1º toque NÃO grava (só arma)',
        R2.man1.n === 0 && R2.man1.armed === '1' && /^Confirmar — deletar Toddy/.test(R2.man1.txt),
        JSON.stringify(R2.man1));
      check('cancelarPernoiteFicha (duplo "deletar do Hotel"): 2º toque apaga o lançamento',
        R2.man2.n > 0 && /manuais\/2026-08-25\/mk1/.test(R2.man2.path), JSON.stringify(R2.man2));
      // ciCriarNovoHospede
      check('ciCriarNovoHospede: 1º toque NÃO cadastra (só arma e avisa do homônimo)',
        R2.novo1.n === 0 && R2.novo1.armed === '1' && R2.novo1.pel === 1 &&
        /Luciana/.test(elsP2.ciNovoWarn.innerHTML || ''),
        JSON.stringify(R2.novo1) + ' | ' + (elsP2.ciNovoWarn.innerHTML || '').slice(0, 120));
      check('ciCriarNovoHospede: 2º toque cadastra o FILHOt',
        R2.novo2.n > 0 && R2.novo2.pel === 2 && /daycare\/cadastro\//.test(R2.novo2.path),
        JSON.stringify(R2.novo2));
    } finally {
      vm.runInContext(`
        DB=__bkp2.DB; audit=__bkp2.audit; zAlertao=__bkp2.zAlertao; zCampo=__bkp2.zCampo;
        acertoNoites=__bkp2.acertoNoites; renderAcerto=__bkp2.renderAcerto;
        ACERTO_REG=__bkp2.ACERTO_REG; ACERTO_QUEM=__bkp2.ACERTO_QUEM;
        cfEstadia=__bkp2.cfEstadia; cfEstadiaId=__bkp2.cfEstadiaId;
        medCoberturaEstadia=__bkp2.medCoberturaEstadia; cfMedRefs=__bkp2.cfMedRefs;
        criarAvisoEstoque=__bkp2.criarAvisoEstoque; renderCfMed=__bkp2.renderCfMed;
        renderCfOcorrencias=__bkp2.renderCfOcorrencias;
        hospedes=__bkp2.hospedes; hospEstadiaAtivaDe=__bkp2.hospEstadiaAtivaDe;
        carregarHospedes=__bkp2.carregarHospedes; carregarManuais=__bkp2.carregarManuais;
        quemSou=__bkp2.quemSou; renderHosp=__bkp2.renderHosp; fecharPlantao=__bkp2.fecharPlantao;
        currentHosp=__bkp2.currentHosp; CF_ESTADIAS=__bkp2.CF_ESTADIAS; medAgendaKey=__bkp2.medAgendaKey;
        PELUDINHOS=__bkp2.PELUDINHOS; achaPorIdNR=__bkp2.achaPorIdNR; ciEscolher=__bkp2.ciEscolher;
      `, ctx);
      ctx.document.getElementById = gebP2;
      ctx.__ROLE__.role = papelAntes;
    }
  }
  console.log('');

  // ---- ponte da planilha do Day Care (Adriana, 25/ago/2026) ----
  // A ponte ficou 5 dias desligada porque a senha foi gravada COM as aspas
  // (' zeluz...') — copiada da linha do Apps Script, que é o que qualquer um faria.
  // E a senha de verdade começa com um espaço DENTRO das aspas: aparar quebra de novo.
  console.log('Ponte da planilha — a senha tem de sobreviver ao copiar e colar:');
  {
    check('dashLimparToken existe', typeof ctx.dashLimparToken === 'function');
    if (typeof ctx.dashLimparToken === 'function') {
      const f = ctx.dashLimparToken;
      check('tira as aspas simples', f("'abc'") === 'abc', JSON.stringify(f("'abc'")));
      check('tira as aspas duplas', f('"abc"') === 'abc', JSON.stringify(f('"abc"')));
      check('preserva o espaço DENTRO das aspas (o token real)',
        f("' zeluz2026daycare&hospedagem'") === ' zeluz2026daycare&hospedagem',
        JSON.stringify(f("' zeluz2026daycare&hospedagem'")));
      check('sem aspas, devolve fiel (não apara a senha)',
        f(' zeluz2026daycare&hospedagem') === ' zeluz2026daycare&hospedagem');
      check('aspas com espaço em volta ainda funcionam', f("  'abc'  ") === 'abc');
    }
    check('a ponte usa o token limpo ao chamar', /if\(c\.token\) c=\{url:c\.url, token:dashLimparToken\(c\.token\)\};/.test(html));
  }
  console.log('');

  // ---- planilha do Day Care se preenchendo sozinha ----
  console.log('Planilha do Day Care — o que o app preenche sozinho:');
  {
    ['dashAutoCalcular', 'dashAutoSincronizar', 'dashAutoRodar', 'dashAutoNomeChave'].forEach((n) =>
      check(n + ' existe', typeof ctx[n] === 'function'));
    if (typeof ctx.dashAutoNomeChave === 'function') {
      const a = ctx.dashAutoNomeChave('Ozzy - Lhasa'), b = ctx.dashAutoNomeChave('Ozzy/Lhasa');
      check('"Ozzy - Lhasa" e "Ozzy/Lhasa" são o MESMO FILHOt (não duplica na TV)', a === b, a + ' vs ' + b);
    }
    // as colunas têm de ser exatamente as da planilha, inclusive onde há erro de digitação
    const cols = ctx.DASH_AUTO_COLS || {};
    check('coluna de restrição usa a grafia da planilha ("restriçóes")',
      cols.aulunosRestr === 'Aulunos com restriçóes', String(cols.aulunosRestr));
    check('aniversariante usa "AUniversariante"', cols.aniversario === 'AUniversariante', String(cols.aniversario));
    // só o que se sabe com antecedência vai para dias futuros
    const fut = ctx.DASH_AUTO_FUTURO || {};
    check('dia futuro leva reposição, falta e aniversário', !!(fut.reposicao && fut.faltas && fut.aniversario));
    check('dia futuro NÃO leva restrição nem cliente novo', !fut.aulunosRestr && !fut.clienteNovo);
    check('o automático nunca mexe em banho/vet/avaliação (têm hora)',
      !cols.banho && !cols.vet && !cols.avaliacao);
  }
  console.log('');

  // ---- Painel 2.1 — a conta do Painel unificado, provada contra dado real ----
  // A fatia do Monitor ("minha rota hoje") é feita de conta, não de tela. Aqui a
  // conta roda contra o caderno de auditoria de verdade, o tempo por atividade de
  // verdade e os pontos do check-out de verdade — antes de existir uma linha de
  // tela. Nada é gravado: só leitura.
  console.log('Painel 2.1 — lógica pura (painel-logica.js):');
  {
    const fnsPL = ['plNorm', 'plCheckinsPorPessoa', 'plProtocoloDe', 'plAvisosDe',
      'plSemanaISO', 'plDiasISO', 'plEvolucao', 'plPlanoValido', 'plRotaDoDia'];
    fnsPL.forEach((f) => check(f + ' existe', typeof ctx[f] === 'function'));

    if (fnsPL.some((f) => typeof ctx[f] !== 'function')) {
      check('painel-logica.js carregado (sem ele o resto não roda)', false, 'faltam funções pl*');
    } else {
      // ---------------- semana ISO conferida por uma conta INDEPENDENTE ----------------
      // O painel-logica.js ancora na QUINTA-FEIRA da semana. Aqui a conta é outra:
      // ancora na SEGUNDA-FEIRA, comparando com a segunda da 1ª semana do ano (a
      // segunda em/antes de 4 de janeiro). Dois caminhos diferentes têm de chegar
      // ao mesmo lugar — é isso que prova a regra, e não o meu próprio código.
      const segDa = (ms) => { let w = new Date(ms).getUTCDay(); if (w === 0) w = 7; return ms - (w - 1) * 86400000; };
      const primSeg = (y) => segDa(Date.UTC(y, 0, 4));
      const semanaIndep = (iso) => {
        const p = iso.split('-');
        const s = segDa(Date.UTC(+p[0], +p[1] - 1, +p[2]));
        let y = new Date(s).getUTCFullYear() + 1;
        while (primSeg(y) > s) y--;
        return y + '-W' + String(Math.round((s - primSeg(y)) / (7 * 86400000)) + 1).padStart(2, '0');
      };
      check('plSemanaISO: 2026-08-24 (segunda) = 2026-W35', ctx.plSemanaISO('2026-08-24') === '2026-W35', ctx.plSemanaISO('2026-08-24'));
      check('plSemanaISO: 2026-01-01 (quinta) = 2026-W01', ctx.plSemanaISO('2026-01-01') === '2026-W01', ctx.plSemanaISO('2026-01-01'));
      check('plSemanaISO: 2026-12-31 (quinta) = 2026-W53', ctx.plSemanaISO('2026-12-31') === '2026-W53', ctx.plSemanaISO('2026-12-31'));
      check('plSemanaISO: 2027-01-01 (sexta) ainda é 2026-W53', ctx.plSemanaISO('2027-01-01') === '2026-W53', ctx.plSemanaISO('2027-01-01'));
      const datas30 = ['2024-02-29', '2024-12-30', '2025-01-01', '2025-06-15', '2025-12-28',
        '2025-12-29', '2025-12-31', '2026-01-01', '2026-01-04', '2026-01-05',
        '2026-02-28', '2026-03-01', '2026-04-13', '2026-05-31', '2026-06-01',
        '2026-07-04', '2026-08-19', '2026-08-24', '2026-08-25', '2026-08-30',
        '2026-08-31', '2026-09-06', '2026-10-12', '2026-11-15', '2026-12-25',
        '2026-12-31', '2027-01-01', '2027-01-03', '2027-01-04', '2028-02-29'];
      let batemAs30 = true, ondeFalhou = '';
      datas30.forEach((d) => {
        if (ctx.plSemanaISO(d) !== semanaIndep(d)) { batemAs30 = false; ondeFalhou = d + ': ' + ctx.plSemanaISO(d) + ' vs ' + semanaIndep(d); }
      });
      check('plSemanaISO bate com a conta independente em 30 datas', batemAs30, ondeFalhou);
      check('plSemanaISO com lixo devolve vazio (não inventa semana)',
        ctx.plSemanaISO('') === '' && ctx.plSemanaISO('24/08/2026') === '' && ctx.plSemanaISO(null) === '');
      check('plDiasISO: janela normal traz os dias na ordem',
        ctx.plDiasISO('2026-08-24', '2026-08-26').join(',') === '2026-08-24,2026-08-25,2026-08-26');
      check('plDiasISO: janela invertida devolve vazio', ctx.plDiasISO('2026-08-26', '2026-08-24').length === 0);

      // ---------------- dado real do banco (só leitura) ----------------
      const pd2 = (x) => String(x).padStart(2, '0');
      const isoDe = (d) => d.getFullYear() + '-' + pd2(d.getMonth() + 1) + '-' + pd2(d.getDate());
      const hojeD = new Date();
      const hojePL = isoDe(hojeD);
      const dias7 = [];
      for (let i = 0; i < 7; i++) { const d = new Date(hojeD); d.setDate(d.getDate() - i); dias7.push(isoDe(d)); }
      const auditoriaPorDia = {}, tempoPorDia = {};
      for (const d of dias7) {
        auditoriaPorDia[d] = await dbRead('daycare/auditoria/' + d, token);
        tempoPorDia[d] = await dbRead('daycare/tempo-atividade/' + d, token);
      }
      const mesAtual = hojePL.slice(0, 7);
      const mesAnterior = (() => { const d = new Date(hojeD.getFullYear(), hojeD.getMonth() - 1, 1); return d.getFullYear() + '-' + pd2(d.getMonth() + 1); })();
      const pontosPorMes = {};
      pontosPorMes[mesAtual] = await dbRead('daycare/pontos-checkout/' + mesAtual, token);
      pontosPorMes[mesAnterior] = await dbRead('daycare/pontos-checkout/' + mesAnterior, token);
      const avisosComidaHoje = await dbRead('daycare/avisos-telegram-comida/' + hojePL, token);
      const nEventos = dias7.reduce((a, d) => a + (auditoriaPorDia[d] ? Object.keys(auditoriaPorDia[d]).length : 0), 0);
      console.log('  dado real: ' + dias7.length + ' dias de auditoria (' + nEventos + ' eventos), pontos de '
        + mesAtual + ' e ' + mesAnterior + ', avisos de comida de hoje.');

      // ---------------- quem fez o quê: a soma tem de fechar com a contagem crua ----------------
      let diaCheio = dias7[0], nCheio = -1;
      dias7.forEach((d) => { const n = auditoriaPorDia[d] ? Object.keys(auditoriaPorDia[d]).length : 0; if (n > nCheio) { nCheio = n; diaCheio = d; } });
      const audCheio = auditoriaPorDia[diaCheio] || {};
      const evsCheio = Object.keys(audCheio).map((k) => audCheio[k]).filter((e) => e && typeof e === 'object');
      const porPessoa = ctx.plCheckinsPorPessoa(audCheio);
      const somaCorpo = Object.keys(porPessoa).reduce((a, k) => a + porPessoa[k].checkinCorpo, 0);
      const somaPert = Object.keys(porPessoa).reduce((a, k) => a + porPessoa[k].pertences, 0);
      const cruCorpo = evsCheio.filter((e) => e.acao === 'checkin-corpo').length;
      const cruPert = evsCheio.filter((e) => e.acao === 'checkin-pertences').length;
      check('houve movimento real para provar a conta (dia ' + diaCheio + ': ' + nCheio + ' eventos)', nCheio > 0);
      check('plCheckinsPorPessoa: soma dos check-ins de corpo = contagem crua do dia (' + cruCorpo + ')',
        somaCorpo === cruCorpo, somaCorpo + ' vs ' + cruCorpo);
      check('plCheckinsPorPessoa: soma dos pertences = contagem crua do dia (' + cruPert + ')',
        somaPert === cruPert, somaPert + ' vs ' + cruPert);
      check('plCheckinsPorPessoa com dia vazio não estoura', Object.keys(ctx.plCheckinsPorPessoa(null)).length === 0);

      // ---------------- protocolo do dia: o que eu fiz e o que ficou faltando ----------------
      const contaPorQuem = {};
      evsCheio.filter((e) => e.acao === 'checkin-corpo').forEach((e) => { const q = String(e.quem || ''); contaPorQuem[q] = (contaPorQuem[q] || 0) + 1; });
      let pessoa = '', nPessoa = -1;
      Object.keys(contaPorQuem).forEach((q) => { if (contaPorQuem[q] > nPessoa) { nPessoa = contaPorQuem[q]; pessoa = q; } });
      check('há uma pessoa real com check-in de corpo no dia (' + pessoa + ': ' + nPessoa + ')', nPessoa > 0, diaCheio);
      if (nPessoa > 0) {
        const alvosDela = [], vistosDela = {};
        evsCheio.filter((e) => e.acao === 'checkin-corpo' && ctx.plNorm(e.quem) === ctx.plNorm(pessoa))
          .forEach((e) => { const a = e.alvo || e.pet || ''; if (a && !vistosDela[a]) { vistosDela[a] = 1; alvosDela.push(a); } });
        const alvosDoDia = [], vistosDia = {};
        evsCheio.filter((e) => e.acao === 'checkin-corpo')
          .forEach((e) => { const a = e.alvo || e.pet || ''; if (a && !vistosDia[a]) { vistosDia[a] = 1; alvosDoDia.push(a); } });

        const proprio = ctx.plProtocoloDe(pessoa, audCheio, alvosDela);
        check('plProtocoloDe: com a turma que ela mesma atendeu, não falta ninguém e o placar é 100%',
          proprio.faltam.length === 0 && proprio.pct === 100 && proprio.feitos.length === alvosDela.length,
          JSON.stringify({ feitos: proprio.feitos.length, faltam: proprio.faltam.length, pct: proprio.pct }));

        const doDia = ctx.plProtocoloDe(pessoa, audCheio, alvosDoDia);
        const esperadoFaltam = alvosDoDia.length - alvosDela.length;
        check('plProtocoloDe: com a turma inteira do dia, faltam exatamente os que não foram dela (' + esperadoFaltam + ')',
          doDia.faltam.length === esperadoFaltam && doDia.feitos.length === alvosDela.length,
          JSON.stringify({ faltam: doDia.faltam.length, esperado: esperadoFaltam }));

        const comInventado = ctx.plProtocoloDe(pessoa, audCheio, alvosDoDia.concat(['filhot-que-nao-existe__tutor-nenhum']));
        check('plProtocoloDe: uma chave a mais na turma vira exatamente um FILHOt faltando',
          comInventado.faltam.length === doDia.faltam.length + 1 &&
          comInventado.faltam.indexOf('filhot-que-nao-existe__tutor-nenhum') >= 0,
          JSON.stringify({ antes: doDia.faltam.length, depois: comInventado.faltam.length }));

        const semTurma = ctx.plProtocoloDe(pessoa, audCheio, []);
        check('plProtocoloDe: sem a turma do dia não inventa cobrança (pct=null, faltam vazio)',
          semTurma.pct === null && semTurma.faltam.length === 0);
      }

      // ---------------- avisos que ficaram com a pessoa ----------------
      const agoraFix = 1787700000000;
      const avisosFix = {
        'telegram-comida': {
          a1: { ok: true, nome: 'Cookie', quem: 'Octávio', ts: agoraFix - 600000, erro: '' },
          a2: { ok: false, nome: 'Dolly', quem: 'octavio', ts: agoraFix - 300000, erro: 'a ponte não respondeu' },
          a3: { tentando: true, nome: 'Romeo', quem: 'OCTÁVIO ', ts: agoraFix - 900000, erro: '' },
          a4: { ok: false, nome: 'Flor', quem: 'Wandela', ts: agoraFix - 100000, erro: 'sem internet' }
        }
      };
      const av = ctx.plAvisosDe('Octávio', avisosFix, agoraFix);
      check('plAvisosDe: dos 3 avisos do Octávio devolve 2 (o que saiu não entra)', av.length === 2, JSON.stringify(av));
      check('plAvisosDe: vem do mais novo para o mais velho (Dolly antes de Romeo)',
        av.length === 2 && av[0].nome === 'Dolly' && av[1].nome === 'Romeo', JSON.stringify(av.map((x) => x.nome)));
      check('plAvisosDe: diz o motivo de cada um (não saiu / travou tentando)',
        av.length === 2 && av[0].motivo === 'não saiu' && av[1].motivo === 'travou tentando',
        JSON.stringify(av.map((x) => x.motivo)));
      check('plAvisosDe: nome de outra pessoa não vaza para a minha lista',
        av.every((x) => x.nome !== 'Flor'));
      const avNovo = ctx.plAvisosDe('Octávio', { 'telegram-comida': { z: { tentando: true, nome: 'Kako', quem: 'Octávio', ts: agoraFix - 5000 } } }, agoraFix);
      check('plAvisosDe: "tentando" de 5 segundos atrás ainda não é aviso travado', avNovo.length === 0, JSON.stringify(avNovo));
      const avFila = ctx.plAvisosDe('Octávio', { 'vet-fila': { f1: { pet: 'Romeo', quem: 'Octávio', ts: agoraFix - 60000 } } }, agoraFix);
      check('plAvisosDe: item parado na fila da vet conta como aviso que não saiu',
        avFila.length === 1 && avFila[0].nome === 'Romeo', JSON.stringify(avFila));
      let avReal = null, avErro = '';
      try { avReal = ctx.plAvisosDe(pessoa, { 'telegram-comida': avisosComidaHoje, 'vet-fila': null }, Date.now()); }
      catch (e) { avErro = e.message; }
      check('plAvisosDe: com o dado real de hoje não estoura', Array.isArray(avReal), avErro);

      // ---------------- evolução semana a semana ----------------
      const dadosEv = { auditoriaPorDia: auditoriaPorDia, pontosPorMes: pontosPorMes, tempoPorDia: tempoPorDia };
      const ev = ctx.plEvolucao(pessoa, dadosEv, 2, hojePL);
      check('plEvolucao: devolve 2 semanas', Array.isArray(ev) && ev.length === 2, JSON.stringify((ev || []).map((s) => s.semana)));
      if (Array.isArray(ev) && ev.length === 2) {
        check('plEvolucao: vem da semana mais antiga para a mais recente',
          ev[0].semana < ev[1].semana || ev[0].dias[0] < ev[1].dias[0], ev[0].semana + ' -> ' + ev[1].semana);
        check('plEvolucao: a semana corrente não lista dia que ainda não aconteceu',
          ev[1].dias[ev[1].dias.length - 1] <= hojePL, ev[1].dias.join(','));

        const diasEv = [];
        ev.forEach((s) => s.dias.forEach((d) => { if (diasEv.indexOf(d) < 0) diasEv.push(d); }));
        // contagem independente, direto do caderno de auditoria
        let cruCheckin = 0, cruPert2 = 0;
        diasEv.forEach((d) => {
          const o = auditoriaPorDia[d] || {};
          Object.keys(o).forEach((k) => {
            const e = o[k];
            if (!e || ctx.plNorm(e.quem) !== ctx.plNorm(pessoa)) return;
            if (e.acao === 'checkin-corpo') cruCheckin++;
            if (e.acao === 'checkin-pertences') cruPert2++;
          });
        });
        const somaEvCheckin = ev.reduce((a, s) => a + s.checkinCorpo, 0);
        const somaEvPert = ev.reduce((a, s) => a + s.checkinPertences, 0);
        check('plEvolucao: check-ins de corpo das 2 semanas = contagem crua nos dias cobertos (' + cruCheckin + ')',
          somaEvCheckin === cruCheckin, somaEvCheckin + ' vs ' + cruCheckin);
        check('plEvolucao: pertences das 2 semanas = contagem crua nos dias cobertos (' + cruPert2 + ')',
          somaEvPert === cruPert2, somaEvPert + ' vs ' + cruPert2);

        // minutos de check-in de corpo, somados de novo à mão a partir de tempo-atividade
        let cruMin = 0, cruVezes = 0;
        diasEv.forEach((d) => {
          const t = (tempoPorDia[d] || {})['checkin-corpo'];
          if (!t || ctx.plNorm(t.quemInicio) !== ctx.plNorm(pessoa)) return;
          cruVezes++;
          const hm = (h) => (/^([01]\d|2[0-3]):[0-5]\d$/.test(h || '') ? (+h.slice(0, 2)) * 60 + (+h.slice(3, 5)) : null);
          const a = hm(t.inicio), b = hm(t.fim);
          if (a !== null && b !== null && b > a) cruMin += (b - a);
        });
        const evMin = ev.reduce((a, s) => a + ((s.etapas['checkin-corpo'] || { minutos: 0 }).minutos), 0);
        const evVezes = ev.reduce((a, s) => a + ((s.etapas['checkin-corpo'] || { vezes: 0 }).vezes), 0);
        check('plEvolucao: minutos de check-in de corpo = soma feita à mão (' + cruMin + ' min)',
          evMin === cruMin, evMin + ' vs ' + cruMin);
        check('plEvolucao: nº de vezes do check-in de corpo bate (' + cruVezes + ')', evVezes === cruVezes, evVezes + ' vs ' + cruVezes);

        // pontos: recontados à mão dentro da janela da semana
        let cruPontos = 0, cruBolsas = 0;
        const deMS = new Date(+diasEv[0].slice(0, 4), +diasEv[0].slice(5, 7) - 1, +diasEv[0].slice(8, 10), 0, 0, 0, 0).getTime();
        const ultimo = diasEv[diasEv.length - 1];
        const ateMS = new Date(+ultimo.slice(0, 4), +ultimo.slice(5, 7) - 1, +ultimo.slice(8, 10), 23, 59, 59, 999).getTime();
        Object.keys(pontosPorMes).forEach((m) => {
          const o = pontosPorMes[m] || {};
          Object.keys(o).forEach((k) => {
            const r = o[k];
            if (!r || ctx.plNorm(r.quem) !== ctx.plNorm(pessoa)) return;
            if (!(r.ts >= deMS && r.ts <= ateMS)) return;
            cruBolsas++; cruPontos += (r.pontos || 0);
          });
        });
        const evPontos = ev.reduce((a, s) => a + s.pontos, 0), evBolsas = ev.reduce((a, s) => a + s.bolsas, 0);
        check('plEvolucao: pontos do check-out das 2 semanas = soma feita à mão (' + cruPontos + ')',
          evPontos === cruPontos, evPontos + ' vs ' + cruPontos);
        check('plEvolucao: nº de bolsas conferidas bate (' + cruBolsas + ')', evBolsas === cruBolsas, evBolsas + ' vs ' + cruBolsas);
        check('plEvolucao: bolsa perfeita nunca passa do nº de bolsas',
          ev.every((s) => s.bolsasPerfeitas <= s.bolsas));

        // nenhum campo NaN — número que vira NaN na tela é número que mente
        const achouNaN = (o) => {
          if (typeof o === 'number') return isNaN(o);
          if (!o || typeof o !== 'object') return false;
          return Object.keys(o).some((k) => achouNaN(o[k]));
        };
        check('plEvolucao: nenhum campo NaN em nenhuma semana', !achouNaN(ev), JSON.stringify(ev).slice(0, 200));
        console.log('  evolução de ' + pessoa + ': ' + ev.map((s) => s.semana + ' → ' + s.checkinCorpo + ' check-ins, '
          + s.pontos + ' ponto(s), ' + ((s.etapas['checkin-corpo'] || { minutos: 0 }).minutos) + ' min de corpo').join(' · '));
      }
      check('plEvolucao: data de hoje inválida devolve lista vazia (não chuta)',
        ctx.plEvolucao(pessoa, dadosEv, 2, 'ontem').length === 0);
      check('plEvolucao: sem dado nenhum devolve semanas zeradas, não erro',
        ctx.plEvolucao('Ninguém', {}, 3, hojePL).length === 3);

      // ---------------- escala e plano do dia (dado novo) ----------------
      const planoFix = {
        id: 'plano-2',
        nome: 'Plano 2 — um a menos',
        motivo: 'Wandela de folga',
        definidoPor: 'Márcia',
        ts: agoraFix,
        porMonitor: {
          'Octávio': [
            { hora: '15:00', atividade: '2º horário de almoço' },
            { hora: '07:30', atividade: 'check-in de corpo e pertences' },
            { hora: '11:00', atividade: 'guardar os pertences' }
          ],
          'Giulia': [{ hora: '11:00', atividade: 'Enriquecimento Ambiental' }]
        }
      };
      const vOk = ctx.plPlanoValido(planoFix);
      check('plPlanoValido: plano completo passa', vOk.ok === true && vOk.erros.length === 0, JSON.stringify(vOk.erros));
      const semDono = JSON.parse(JSON.stringify(planoFix)); delete semDono.definidoPor;
      const vSemDono = ctx.plPlanoValido(semDono);
      check('plPlanoValido: plano sem quem definiu é recusado', vSemDono.ok === false && vSemDono.erros.join(' ').indexOf('definiu') >= 0, JSON.stringify(vSemDono.erros));
      const horaTorta = JSON.parse(JSON.stringify(planoFix)); horaTorta.porMonitor['Octávio'][0].hora = '7:00';
      const vHora = ctx.plPlanoValido(horaTorta);
      check("plPlanoValido: hora '7:00' (sem o zero) é recusada", vHora.ok === false && vHora.erros.join(' ').indexOf('hora inválida') >= 0, JSON.stringify(vHora.erros));
      const semAtiv = JSON.parse(JSON.stringify(planoFix)); semAtiv.porMonitor['Giulia'][0].atividade = '  ';
      check('plPlanoValido: atividade sem nome é recusada', ctx.plPlanoValido(semAtiv).ok === false);
      check('plPlanoValido: plano vazio é recusado com a lista do que falta',
        ctx.plPlanoValido(null).ok === false && ctx.plPlanoValido(null).erros.length >= 3);

      const escalaFix = {
        'Octávio': { entrada: '07:00', almoco: '13:00-14:00', saida: '16:00' },
        'Wandela': { entrada: '07:00', almoco: '12:00-13:00', saida: '16:00' }
      };
      const rota = ctx.plRotaDoDia('Octávio', escalaFix, planoFix);
      check('plRotaDoDia: traz o horário da pessoa da escala',
        rota.entrada === '07:00' && rota.almoco === '13:00-14:00' && rota.saida === '16:00', JSON.stringify(rota));
      check('plRotaDoDia: as atividades vêm na ordem da hora',
        rota.atividades.map((a) => a.hora).join(',') === '07:30,11:00,15:00', JSON.stringify(rota.atividades));
      check('plRotaDoDia: nenhuma atividade de outro monitor aparece',
        rota.atividades.every((a) => a.atividade.indexOf('Enriquecimento') < 0));
      check('plRotaDoDia: sem aviso quando a pessoa está na escala e no plano', rota.avisos.length === 0, JSON.stringify(rota.avisos));
      check('plRotaDoDia: diz de quem é o plano de hoje e por quê',
        rota.plano.definidoPor === 'Márcia' && rota.plano.motivo === 'Wandela de folga');
      const fora = ctx.plRotaDoDia('Fulano', escalaFix, planoFix);
      check('plRotaDoDia: quem não está no plano recebe o aviso de falar com a Márcia',
        fora.avisos.join(' ').indexOf('não está no plano') >= 0, JSON.stringify(fora.avisos));
      check('plRotaDoDia: quem não está na escala fica com o horário em branco e é avisado',
        fora.entrada === '' && fora.avisos.join(' ').indexOf('escala') >= 0, JSON.stringify(fora));
      const semAcento = ctx.plRotaDoDia('octavio', escalaFix, planoFix);
      check('plRotaDoDia: "octavio" e "Octávio" são a mesma pessoa (acento não separa ninguém)',
        semAcento.entrada === '07:00' && semAcento.avisos.length === 0, JSON.stringify(semAcento.avisos));
    }
  }
  console.log('');

  // ---------------------------------------------------------------------------------
  // Norma culta — a frase do placar de quem monta a bolsa.
  // Dizia "7 de 9 bolsas desceu redondo": verbo no singular com sujeito no plural. Quem
  // manda no verbo é o número de bolsas certas, e "de" vira "das" ao recortar um grupo.
  // O monitor lê essa frase todo dia; texto errado na tela é a Zêluz parecendo amadora.
  console.log('Norma culta — frase das bolsas:');
  {
    const f = ctx.bolsasRedondasTexto;
    const igual = (p, t, esperado) =>
      check('bolsasRedondasTexto(' + p + ', ' + t + ') = "' + esperado + '"', f(p, t) === esperado, f(p, t));
    igual(1, 1, '1 de 1 bolsa desceu redondo');
    igual(1, 9, '1 das 9 bolsas desceu redondo');
    igual(7, 9, '7 das 9 bolsas desceram redondo');
    igual(9, 9, '9 das 9 bolsas desceram redondo');
    igual(0, 9, 'nenhuma das 9 bolsas desceu redondo');
    igual(0, 1, 'a bolsa não desceu redondo');
  }
  console.log('');

  // ---- Prevenção: a tela cobrava o que ja estava feito (Adriana, 26/ago/2026) ----
  console.log('Prevencao -- so cobra o que e real:');
  {
    const hoje = ctx.zHojeISO ? ctx.zHojeISO() : '2026-08-26';
    const linhaItem = (k) => {
      const m = html.match(new RegExp("\{k:'" + k + "'[^}]*\}"));
      return m ? m[0] : '';
    };
    check('vermifugo aceita o nome antigo do campo', /alt:'vermifugo_p'/.test(linhaItem('verm_p')), linhaItem('verm_p').slice(0, 90));
    check('ectoparasitas aceita o nome antigo do campo', /alt:'carrapaticida_p'/.test(linhaItem('ecto_p')), linhaItem('ecto_p').slice(0, 90));
    check('escova e check-up sao ROTINA (nao entram na conta de prevencao)',
      /rotina:true/.test(linhaItem('escova_p')) && /rotina:true/.test(linhaItem('checkup_p')));
    check('escova e check-up sao opcionais (a casa ainda nao registra)',
      /opcional:true/.test(linhaItem('escova_p')) && /opcional:true/.test(linhaItem('checkup_p')));

    if (typeof ctx.prevFaltasDe === 'function') {
      // ficha antiga: vermifugo e carrapaticida lancados com o nome velho, em dia
      const emDia = ctx.orcMaisDias ? ctx.orcMaisDias(hoje, 30) : '2026-09-25';
      const antiga = { vermifugo_p: emDia, carrapaticida_p: emDia,
        vac_mult_p: emDia, vac_gripe_p: emDia, vac_raiva_p: emDia };
      const f = ctx.prevFaltasDe(antiga).filter((x) => !x.rotina);
      check('ficha antiga em dia NAO gera pendencia de prevencao', f.length === 0,
        JSON.stringify(f.map((x) => x.nome)));

      // data impossivel (ano 0026) nao e "vencido ha 664 mil dias"
      const quebrada = ctx.prevFaltasDe({ vac_raiva_p: '0026-02-13', vac_mult_p: emDia, vac_gripe_p: emDia,
        verm_p: emDia, ecto_p: emDia });
      const inv = quebrada.filter((x) => x.tipo === 'invalida');
      check('data com ano impossivel vira "invalida", nao "vencida"', inv.length === 1, JSON.stringify(quebrada.map((x) => x.tipo + ':' + x.nome)));
      check('prevDataQuebrada reconhece 0026 e 0207',
        ctx.prevDataQuebrada('0026-02-13') === true && ctx.prevDataQuebrada('0207-05-22') === true);
      check('prevDataQuebrada aceita data normal', ctx.prevDataQuebrada('2026-08-26') === false);
    }
  }
  console.log('');

  console.log('Prevencao do hospede -- convite, nao cobranca:');
  {
    ['prevEhHospede', 'prevMensagemTutor', 'prevBlocoHospedes', 'prevMarcarAvisado', 'algCurGravar'].forEach((n) =>
      check(n + ' existe', typeof ctx[n] === 'function'));
    if (typeof ctx.prevMensagemTutor === 'function') {
      const msg = ctx.prevMensagemTutor({ nome: 'Simba', tutor: 'Marina Souza', sexo: 'Macho',
        faltas: [{ nome: 'Vacina Múltipla', tipo: 'venc', data: '2026-03-17' }] });
      check('a mensagem chama o tutor pelo primeiro nome', /Oi, Marina/.test(msg), msg.slice(0, 40));
      check('a mensagem diz o que venceu e quando', /Vacina Múltipla/.test(msg) && /17\/03\/2026/.test(msg));
      check('a mensagem convida a fazer na Zeluz', /veterinária|conosco/i.test(msg));
    }
    // a resposta do tutor TEM de chegar na ficha — agora pergunta a pergunta
    check('a resposta e separada pergunta a pergunta', /function algSeparar\(texto, perguntas\)/.test(html));
    check('cada pergunta ja sabe o campo da ficha a que pertence', /campo:'alergia'/.test(html));
    check('a resposta que ainda nao virou ficha aparece primeiro na tela',
      /function algPendentesFicha\(\)/.test(html) && /algFichaBlocoHTML\(\)\n?\s*\+algBlocoHTML\('H\u00f3spedes'/.test(html));
    check('"ja conferi" nao inventa conteudo em campo nenhum', /campos:\[\], ts:Date\.now\(\)/.test(html));
    check('e confirma em dois toques na tela, sem janelinha do navegador',
      /if\(ALG_NADA_ARMADO!==k\)\{ ALG_NADA_ARMADO=k;/.test(html) && /Toque de novo para confirmar/.test(html));
  }
  console.log('');

  console.log('Data nao se digita mais -- so o calendario escolhe (26/ago):');
  {
    // 13 fichas ficaram com ano 0026 / 0207 / 0001 porque o campo aceitava digitacao.
    const inputs = html.match(/<input[^>]*type="date"[^>]*>/g) || [];
    check('existem campos de data no app', inputs.length > 30, String(inputs.length));
    check('NENHUM campo de data aceita teclado',
      inputs.filter((t) => !/onkeydown/.test(t)).length === 0,
      String(inputs.filter((t) => !/onkeydown/.test(t)).length) + ' sem trava');
    check('todo campo de data tem ano minimo', inputs.filter((t) => !/ min=/.test(t)).length === 0);
    check('todo campo de data tem ano maximo', inputs.filter((t) => !/ max=/.test(t)).length === 0);
    if (typeof ctx.dataSoNoCalendario === 'function') {
      check('digitar numero e recusado', ctx.dataSoNoCalendario({ key: '2', preventDefault() {} }) === false);
      check('apagar continua valendo', ctx.dataSoNoCalendario({ key: 'Backspace' }) === true);
      check('Tab continua valendo (quem navega pelo teclado)', ctx.dataSoNoCalendario({ key: 'Tab' }) === true);
      check('colar continua valendo', ctx.dataSoNoCalendario({ key: 'v', ctrlKey: true }) === true);
    }
    if (typeof ctx.dataPlausivel === 'function') {
      check('ano 0026 nao passa nem colado', ctx.dataPlausivel('0026-02-13') === false);
      check('data normal passa', ctx.dataPlausivel('2026-08-26') === true);
    }
  }
  console.log('');

  console.log('O nome sozinho nao lanca: a tela pergunta antes (26/ago):');
  {
    // Adriana: "ao selecionar o peludinho ja entra direto, nao me deixa escolher a
    // quantidade e a observacao — ambos precisam ser obrigatorios".
    const item = (k) => {
      const i = html.indexOf("{k:'" + k + "',");
      if (i < 0) return '';
      return html.slice(i, html.indexOf("\n    {k:'", i + 5) > 0 ? html.indexOf("\n    {k:'", i + 5) : i + 900);
    };
    check('vermifugo pergunta quanto e a observacao',
      /campos:\[/.test(item('vermifugo')) && /c:'qtd'/.test(item('vermifugo')) && /c:'onde'/.test(item('vermifugo')));
    check('carrapaticida oferece a pipeta', /ops:DASH_QTD_PIP/.test(item('carrapaticida')));
    check('coleira pergunta se veio e onde troca',
      /c:'veio'/.test(item('coleira')) && /c:'onde'/.test(item('coleira')));
    check('festa exige o tema', /c:'tema'/.test(item('festa')) && /ops:DASH_TEMAS/.test(item('festa')));
    check('banho e vet continuam num clique so',
      !/campos:/.test(item('banho')) && !/campos:/.test(item('vet')));
    check('todo campo desses e obrigatorio',
      (item('vermifugo').match(/obrig:true/g) || []).length === 2 &&
      (item('carrapaticida').match(/obrig:true/g) || []).length === 2 &&
      (item('coleira').match(/obrig:true/g) || []).length === 2 &&
      (item('festa').match(/obrig:true/g) || []).length === 1);

    const temas = ['ATL\u00c9TICO', 'CRUZEIRO', '101 D\u00c1LMATAS', 'PATRULHA CANINA', 'PETS',
                   'A DAMA E O VAGABUNDO', 'BOLT'];
    check('os 7 temas de festa estao la',
      Array.isArray(ctx.DASH_TEMAS) && ctx.DASH_TEMAS.length === 7 &&
      temas.every((t) => ctx.DASH_TEMAS.some((o) => o.v === t)),
      JSON.stringify((ctx.DASH_TEMAS || []).map((o) => o.v)));

    // clicar no nome ESCOLHE quando ha pergunta; lanca direto quando nao ha
    check('o clique no nome escolhe (nao lanca) quando ha pergunta',
      /\(dashItem\(k\)\|\|\{\}\)\.campos\?'dashEscolher':'dashLancar'/.test(html));
    check('lancar sem responder e barrado tambem no caminho de baixo',
      /if\(it\.campos\)\{[\s\S]{0,200}dashDetFalta\(k\)/.test(html));
    check('depois de lancar, a escolha e o detalhe zeram',
      /if\(it\.campos\)\{ DASH_DET\[k\]=\{\}; delete DASH_SEL\[k\]; \}/.test(html));
    check('o re-render nao apaga a busca que a colega esta digitando',
      /__manter\[i\.k\]=\{b:/.test(html) && /if\(b&&m\.b\)\{ b\.value=m\.b;/.test(html));

    if (typeof ctx.dashSetDet === 'function' && typeof ctx.dashDetTexto === 'function') {
      ctx.DASH_DET = {}; ctx.DASH_SEL = {};
      check('sem responder nada, o botao diz o que falta',
        ctx.dashDetFalta('vermifugo') === 'Quanto foi dado \u00b7 Alguma observa\u00e7\u00e3o',
        JSON.stringify(ctx.dashDetFalta('vermifugo')));
      ctx.dashSetDet('vermifugo', 'qtd', '2 COMPRIMIDOS');
      check('ainda falta a observacao', ctx.dashDetFalta('vermifugo') === 'Alguma observa\u00e7\u00e3o',
        JSON.stringify(ctx.dashDetFalta('vermifugo')));
      check('a quantidade sai entre parenteses e em maiuscula',
        ctx.dashDetTexto('vermifugo') === ' (2 COMPRIMIDOS)', JSON.stringify(ctx.dashDetTexto('vermifugo')));
      ctx.dashSetDet('vermifugo', 'onde', 'NA BOLSA');
      check('respondido tudo, nada falta', ctx.dashDetFalta('vermifugo') === '');
      check('quantidade e observacao saem juntas, nessa ordem',
        ctx.dashDetTexto('vermifugo') === ' (2 COMPRIMIDOS \u00b7 NA BOLSA)', JSON.stringify(ctx.dashDetTexto('vermifugo')));
      // "Nada a observar" e uma RESPOSTA: libera o botao e nao escreve nada
      ctx.dashSetDet('vermifugo', 'onde', '');
      check('"nada a observar" conta como respondido', ctx.dashDetFalta('vermifugo') === '');
      check('"nada a observar" nao escreve nada na planilha',
        ctx.dashDetTexto('vermifugo') === ' (2 COMPRIMIDOS)', JSON.stringify(ctx.dashDetTexto('vermifugo')));
      // tocar de novo desmarca — e volta a faltar
      ctx.dashSetDet('vermifugo', 'qtd', '2 COMPRIMIDOS');
      check('tocar de novo desmarca e o campo volta a faltar',
        ctx.dashDetFalta('vermifugo') === 'Quanto foi dado' && ctx.dashDetTexto('vermifugo') === '',
        JSON.stringify([ctx.dashDetFalta('vermifugo'), ctx.dashDetTexto('vermifugo')]));

      ctx.DASH_DET = {};
      ctx.dashSetDet('carrapaticida', 'qtd', 'PIPETA');
      ctx.dashSetDet('carrapaticida', 'onde', 'BANHO');
      check('carrapaticida em pipeta, depois do banho',
        ctx.dashDetTexto('carrapaticida') === ' (PIPETA \u00b7 BANHO)', JSON.stringify(ctx.dashDetTexto('carrapaticida')));

      ctx.DASH_DET = {};
      ctx.dashSetDet('coleira', 'veio', 'NA BOLSA');
      check('coleira: so metade respondida ainda trava',
        ctx.dashDetFalta('coleira') === 'Onde vai ser trocada?', JSON.stringify(ctx.dashDetFalta('coleira')));
      ctx.dashSetDet('coleira', 'onde', 'DAYCARE');
      check('coleira sai com as duas respostas',
        ctx.dashDetTexto('coleira') === ' (NA BOLSA \u00b7 DAYCARE)', JSON.stringify(ctx.dashDetTexto('coleira')));

      ctx.DASH_DET = {};
      check('festa sem tema nao lanca', ctx.dashDetFalta('festa') === 'Tema da festa');
      ctx.dashSetDet('festa', 'tema', 'PATRULHA CANINA');
      check('festa sai com o tema',
        ctx.dashDetTexto('festa') === ' (PATRULHA CANINA)', JSON.stringify(ctx.dashDetTexto('festa')));

      // item sem pergunta nao inventa parenteses
      ctx.DASH_DET = {};
      check('banho nao ganha parenteses nenhum', ctx.dashDetTexto('banho') === '');
      check('banho nunca "falta responder"', ctx.dashDetFalta('banho') === '');
      ctx.DASH_DET = {}; ctx.DASH_SEL = {};
    }
  }
  console.log('');

  console.log('Lancamento fantasma: tirar antes da ponte responder nao pode ressuscitar (26/ago):');
  {
    check('a resposta da ponte usa transaction, nao set direto',
      /\.transaction\(function\(atual\)\{[\s\S]{0,120}if\(atual===null\|\|atual===undefined\) return;/.test(html));
    check('a gravacao direta de planilha_ok saiu do codigo',
      !/planilha_ok'\)\.set\(ok\)/.test(html));
    if (typeof ctx.dashLimparFantasmas === 'function') {
      const bruto = {
        vermifugo: {
          fantasma: { planilha_ok: true, planilha_msg: '' },
          real:     { valor: 'Hannah/West Terrier', ts: 1, quem: 'Adriana' }
        },
        banho: {
          semNomeMasComTs: { ts: 2, valor: '' },     // gravado agora mesmo: nao e lixo
          vazioDeVerdade:  { planilha_ok: false }
        }
      };
      const limpo = ctx.dashLimparFantasmas(bruto);
      check('o registro sem nome e sem ts some', !limpo.vermifugo.fantasma);
      check('o lancamento de verdade fica', !!limpo.vermifugo.real);
      check('registro com ts nao e apagado (pode estar sendo gravado)', !!limpo.banho.semNomeMasComTs);
      check('o vazio de verdade some tambem', !limpo.banho.vazioDeVerdade);
      check('a lista nao mente sobre o proprio tamanho',
        Object.keys(limpo.vermifugo).length === 1 && Object.keys(limpo.banho).length === 1);
    }
    check('a limpeza acontece na leitura da tela',
      /DASH_DADOS=dashLimparFantasmas\(s\.val\(\)\|\|\{\}\)/.test(html));
    check('apagar deixa rastro na auditoria',
      /apagou um lan\u00e7amento vazio em/.test(html) || /apagou um lançamento vazio em/.test(html));
  }
  console.log('');

  console.log('Perguntado nao e respondido: quem esta calado continua na fila (26/ago):');
  {
    // Adriana: "sem querer a Amanda cancelou o Billie do Cristiano e uma outra, ninguem
    // ainda respondeu". Salvar em branco gravava registro vazio e a lista tratava
    // qualquer registro como respondido — o FILHOt sumia da fila.
    check('respondido passa a exigir texto, nao so existir registro',
      /var respondeu=!!\(r&&String\(r\.resposta\|\|''\)\.trim\(\)\)/.test(html));
    check('so sai da fila quem respondeu de verdade',
      /if\(respondeu&&!vencido\) return;/.test(html));
    check('a tela separa "ainda nao respondeu" de "nunca perguntamos"',
      /o tutor ainda n\u00e3o respondeu/.test(html) && /nunca perguntamos/.test(html));
    check('quem ja foi perguntado nao aparece em vermelho de nunca-perguntado',
      /\(x\.vencido\|\|x\.esperando\)\?'var\(--crm-atencao-text\)'/.test(html));
    check('gravar em branco continua barrado na entrada',
      /Cole aqui o que o tutor respondeu/.test(html));

    // a fila montada com o dado real do banco: os 3 que sumiram tem de voltar
    if (typeof ctx.algLista === 'function') {
      ctx.ALG_RESP = (await dbRead('daycare/alergia-confirmada', token)) || {};
      const total = Object.keys(ctx.ALG_RESP).length;
      check('li as respostas do tutor no banco (' + total + ')', total > 0);
      const vazios = Object.keys(ctx.ALG_RESP).filter((k) => !String(ctx.ALG_RESP[k].resposta || '').trim());
      const L = ctx.algLista();
      const naFila = [...L.hospede, ...L.auluno].map((x) => x.k);
      // A bancada carrega menos FILHOts que o app: os hospedes entram em PELUDINHOS por um
      // carregamento que o sandbox nao roda (118 aqui, 142 no navegador). Cobrar deles seria
      // acusar um bug que nao existe — mas ficar calado seria pior. Entao separa-se: o que
      // este ambiente PODE julgar, e o que ele nao alcanca (dito em voz alta).
      const noCadastro = (k) => (ctx.PELUDINHOS || []).some((x) => ctx.pelKey(x) === k);
      const porque = (k) => {
        const p = (ctx.PELUDINHOS || []).find((x) => ctx.pelKey(x) === k);
        if (typeof ctx.pelInativo === 'function' && ctx.pelInativo(p)) return 'marcado como inativo';
        const cat = (typeof ctx.pelCategoria === 'function') ? ctx.pelCategoria(p) : '?';
        if (cat === 'morador') return 'categoria morador (nao tem tutor a consultar)';
        return 'categoria ' + cat + ' — deveria estar na fila';
      };
      const foraDoAlcance = vazios.filter((k) => !noCadastro(k));
      if (foraDoAlcance.length) {
        console.log('    (nao verificavel aqui — o sandbox nao carrega hospedes: ' +
          foraDoAlcance.join(', ') + '. Conferir no app.)');
      }
      const faltando = vazios.filter((k) => noCadastro(k) && !naFila.includes(k))
        .map((k) => k + ' [' + porque(k) + ']');
      check('todo registro sem resposta voltou para a fila (' + vazios.length + ' no banco)',
        faltando.length === 0, 'fora da fila: ' + JSON.stringify(faltando));
      if (!vazios.length) console.log('    (nenhum registro sem resposta no banco agora — nada a recuperar)');
      const marcados = [...L.hospede, ...L.auluno].filter((x) => x.esperando).map((x) => x.k);
      const julgaveis = vazios.filter(noCadastro);
      check('e aparecem marcados como "esperando resposta"' +
        (julgaveis.length < vazios.length ? ' (dos ' + julgaveis.length + ' ao alcance)' : ''),
        julgaveis.every((k) => marcados.includes(k)),
        JSON.stringify({ julgaveis, marcados }));
      const comTexto = Object.keys(ctx.ALG_RESP).filter((k) => String(ctx.ALG_RESP[k].resposta || '').trim());
      const voltouSemPrecisar = comTexto.filter((k) => naFila.includes(k) &&
        ![...L.hospede, ...L.auluno].find((x) => x.k === k && x.vencido));
      check('quem respondeu de verdade continua fora da fila',
        voltouSemPrecisar.length === 0, JSON.stringify(voltouSemPrecisar));
    }
  }
  console.log('');

  console.log('Da resposta do tutor para a ficha — contra as respostas REAIS (26/ago):');
  {
    // Adriana: "como iremos colocar as respostas? Elas sao essenciais para o cadastro".
    // Nao adianta testar com texto inventado: os tutores escrevem cada um de um jeito.
    // Este bloco roda a separacao contra o que EL@S mandaram de verdade.
    check('a mensagem e a separacao saem da mesma lista de perguntas',
      /algPerguntas\(p\)\.forEach/.test(html) && /function algPerguntas\(p\)/.test(html));
    check('o esquema antigo de 4 destinos saiu', !/ALG_DESTINOS/.test(html));
    check('a resposta e colada num textarea, nao num campo de uma linha',
      /<textarea class="cad-in" id="algResp_/.test(html));
    check('os dois campos novos existem na ficha',
      /alim_horarios:this\.value/.test(html) && /obs_tutor:this\.value/.test(html));
    check('nada e sobrescrito sozinho: campo com conteudo vem desmarcado',
      /grava:!atual/.test(html));

    if (typeof ctx.algSeparar === 'function' && typeof ctx.algPerguntas === 'function') {
      const respostas = ctx.ALG_RESP || {};
      const comTexto = Object.keys(respostas).filter((k) => String(respostas[k].resposta || '').trim());
      let separadas = 0, semNada = [], detalhe = [];
      comTexto.forEach((k) => {
        const p = (ctx.PELUDINHOS || []).find((x) => ctx.pelKey(x) === k);
        if (!p) return;
        const Q = ctx.algPerguntas(p);
        const sep = ctx.algSeparar(respostas[k].resposta, Q);
        const n = Object.keys(sep.por || {}).length;
        detalhe.push(k + ':' + n + '/' + Q.length);
        if (n >= 4) separadas++; else semNada.push(k + ' (' + n + ' de ' + Q.length + ')');
      });
      check('separei ao menos 4 perguntas na maioria das respostas reais (' +
        separadas + ' de ' + detalhe.length + ')',
        detalhe.length === 0 || separadas >= Math.ceil(detalhe.length * 0.6), detalhe.join(' · '));
      if (semNada.length) console.log('    (pouco separado, cai em "nao consegui encaixar": ' + semNada.join(', ') + ')');

      // O que a separacao NAO conseguir encaixar tem de voltar em `solto` — nunca sumir.
      let perdeu = [];
      comTexto.forEach((k) => {
        const p = (ctx.PELUDINHOS || []).find((x) => ctx.pelKey(x) === k);
        if (!p) return;
        const Q = ctx.algPerguntas(p);
        const sep = ctx.algSeparar(respostas[k].resposta, Q);
        const n = Object.keys(sep.por || {}).length;
        if (n === 0 && !String(sep.solto || '').trim()) perdeu.push(k);
      });
      check('resposta que nao deu para separar volta inteira em "nao consegui encaixar"',
        perdeu.length === 0, JSON.stringify(perdeu));

      // um caso controlado: o eco da pergunta tem de sair, e a alergia tem de cair no
      // campo de alergia — nao no meio de um paragrafo sobre esteira
      const pFake = { n: 'Teste', tutor: 'Fulano', dias: [] };
      const Qf = ctx.algPerguntas(pFake);
      const bruto = '1. Quantas refeicoes ele faz por dia, e em que horarios? 3 vezes: 7h, 12h e 18h\n' +
                    '2. Racao Golden\n3. 50 gramas\n4. Alergia a frango\n5. Evitar esteira';
      const sepF = ctx.algSeparar(bruto, Qf);
      check('o pedaco 4 (restricao) tem o destino "alergia"',
        (Qf.find((q) => q.k === 'restricao') || {}).campo === 'alergia');
      check('separou os 5 pedacos do caso controlado',
        Object.keys(sepF.por).length === 5, JSON.stringify(Object.keys(sepF.por)));
      check('a alergia veio limpa', (sepF.por.restricao || '').trim() === 'Alergia a frango',
        JSON.stringify(sepF.por.restricao));
      check('o horario nao virou numero de pergunta',
        (sepF.por.refeicoes || '').indexOf('7h, 12h e 18h') >= 0, JSON.stringify(sepF.por.refeicoes));

      // O ECO DA PERGUNTA: metade das perguntas continua DEPOIS do "?", entao cortar no
      // "?" devolvia o parenteses da pergunta como se fosse resposta da tutora.
      const eco = ctx.algTirarEco;
      check('tira a pergunta inteira, inclusive o que vem depois do "?"',
        eco('Qual a marca e o tipo do alimento? (racao seca, racao umida, comida natural ou uma combinacao) Racao seca Formula Natural',
            'Qual a marca e o tipo do alimento? (racao seca, racao umida, comida natural ou uma combinacao)')
          === 'Racao seca Formula Natural',
        JSON.stringify(eco('Qual a marca e o tipo do alimento? (racao seca, racao umida, comida natural ou uma combinacao) Racao seca Formula Natural',
            'Qual a marca e o tipo do alimento? (racao seca, racao umida, comida natural ou uma combinacao)')));
      check('quem respondeu sem repetir a pergunta nao perde nada',
        eco('3 refeicoes: 07:00, 12:00 e 18:00', 'Quantas refeicoes ela faz por dia, e em que horarios?')
          === '3 refeicoes: 07:00, 12:00 e 18:00');
      check('na duvida sobra texto, nunca falta',
        eco('Qual a marca? Nao sei', 'Qual a coisa completamente outra que eu perguntei aqui')
          === 'Qual a marca? Nao sei');

      // e agora contra as respostas REAIS: nenhum pedaco pode comecar repetindo a pergunta
      let comEco = [];
      comTexto.forEach((k) => {
        const p = (ctx.PELUDINHOS || []).find((x) => ctx.pelKey(x) === k);
        if (!p) return;
        const Q = ctx.algPerguntas(p);
        const sep = ctx.algSeparar(respostas[k].resposta, Q);
        Q.forEach((q) => {
          const v = String(sep.por[q.k] || '');
          if (!v) return;
          const primeiras = v.split(/\s+/).slice(0, 4).map(ctx.jsNorm).join(' ');
          const daPergunta = q.t.split(/\s+/).slice(0, 4).map(ctx.jsNorm).join(' ');
          if (primeiras && primeiras === daPergunta) comEco.push(k + '/' + q.k);
        });
      });
      check('nenhuma resposta real volta repetindo a pergunta', comEco.length === 0,
        JSON.stringify(comEco.slice(0, 5)));

      // dois residuos vistos ao abrir a curadoria da Amora, 26/ago:
      //  - o titulo da secao grudava no fim da resposta anterior ("Nao   SAUDE, ROTINA...")
      //  - o eco parava na 1a palavra diferente ("receoso" no lugar de "receosa"), e a
      //    pergunta inteira voltava como se fosse resposta da tutora
      let comSecao = [], quaseSoPergunta = [];
      comTexto.forEach((k) => {
        const p = (ctx.PELUDINHOS || []).find((x) => ctx.pelKey(x) === k);
        if (!p) return;
        const Q = ctx.algPerguntas(p);
        const sep = ctx.algSeparar(respostas[k].resposta, Q);
        Q.forEach((q) => {
          const v = String(sep.por[q.k] || '').trim();
          if (!v) return;
          if (/SAÚDE, ROTINA E COMPORTAMENTO|ALIMENTAÇÃO/i.test(v)) comSecao.push(k + '/' + q.k);
          const pv = v.split(/\s+/).map(ctx.jsNorm).filter(Boolean);
          const pq = new Set(q.t.split(/\s+/).map(ctx.jsNorm).filter(Boolean));
          if (pv.length >= 5) {
            const iguais = pv.filter((w) => pq.has(w)).length;
            if (iguais / pv.length > 0.7) quaseSoPergunta.push(k + '/' + q.k + ' → "' + v.slice(0, 45) + '"');
          }
        });
      });
      check('o titulo da secao nao gruda na resposta', comSecao.length === 0, JSON.stringify(comSecao));

      // A NUMERACAO QUE RECOMECA: a tutora do Boris respondeu 1..4, escreveu "Saude" e
      // recomecou do 1. "Evitar escadas ao maximo pois sua coluna trava" nao pode sumir
      // nem cair no campo de alergia de um FILHOt que tem um rim so.
      // O que NAO pode sumir sao as palavras da TUTORA: as que ela escreveu e que nao
      // estao em pergunta nenhuma (Formula, Natural, escadas, hemograma, hipoalergenica).
      // Comparar trechos literais nao serve — o eco da pergunta some de proposito.
      let sumiu = [];
      comTexto.forEach((k) => {
        const p = (ctx.PELUDINHOS || []).find((x) => ctx.pelKey(x) === k);
        if (!p) return;
        const Q = ctx.algPerguntas(p);
        const bruto = String(respostas[k].resposta || '');
        const sep = ctx.algSeparar(bruto, Q);
        const junto = Object.keys(sep.por).map((q) => sep.por[q]).join(' ') + ' ' + (sep.solto || '');
        const pal = (txt) => new Set(String(txt).split(/\s+/)
          .map((w) => ctx.jsNorm(w).replace(/[^a-z0-9]/g, '')).filter((w) => w.length >= 4));
        // as NOSSAS palavras entram todas, inclusive as curtas ("ele", "faz") — e delas
        // que saem as flexoes que o tutor escreve ("eles fazem")
        const nossas = new Set();
        Q.forEach((q) => String(q.t + ' ' + (q.secao || '')).split(/\s+/)
          .map((w) => ctx.jsNorm(w).replace(/[^a-z0-9]/g, '')).filter(Boolean)
          .forEach((w) => nossas.add(w)));
        const doResultado = pal(junto);
        // "eles fazem" onde a pergunta diz "ele faz", "receosa" onde diz "receoso":
        // e a NOSSA palavra reescrita pelo tutor, nao conteudo dele. Mesmo radical = nossa.
        const nossaFlexao = (w) => [...nossas].some((n) =>
          n.slice(0, 3) === w.slice(0, 3) && Math.abs(n.length - w.length) <= 2);
        const saudacao = new Set(['tarde', 'noite', 'obrigada', 'obrigado', 'respondendo', 'perguntas']);
        const perdidas = [...pal(bruto)].filter((w) =>
          !nossas.has(w) && !doResultado.has(w) && !nossaFlexao(w) && !saudacao.has(w));
        if (perdidas.length) sumiu.push(k + ': ' + perdidas.slice(0, 6).join(', '));
      });
      check('nenhuma palavra da tutora se perde no caminho',
        sumiu.length === 0, JSON.stringify(sumiu.slice(0, 4)));

      const boris = respostas['boris__laura'];
      if (boris) {
        const pB = (ctx.PELUDINHOS || []).find((x) => ctx.pelKey(x) === 'boris__laura');
        if (pB) {
          const sepB = ctx.algSeparar(boris.resposta, ctx.algPerguntas(pB));
          // A tutora recomecou a numeracao na segunda parte. "Evitar escadas ao maximo pois
          // sua coluna trava" nao pode cair no campo de ALERGIA de um FILHOt com um rim so
          // — e agora nem precisa esperar recorte: e reconhecido pelo assunto.
          check('"evitar escadas" vai para atividade fisica, nunca para a alergia',
            /escadas/i.test(sepB.por.atividade || '') && !/escadas/i.test(sepB.por.restricao || ''),
            JSON.stringify({ atividade: String(sepB.por.atividade || '').slice(0, 60),
                             restricao: String(sepB.por.restricao || '').slice(0, 60) }));
          check('e vem marcado como "reconheci pelo assunto"', !!(sepB.assunto || {}).atividade);
          check('os exames de hemograma viram check-up',
            /hemograma/i.test(sepB.por.checkup || ''), JSON.stringify(sepB.por.checkup));
        }
      }
      // QUANTO SOBRA PARA A MAO: o numero que a Adriana perguntou ("preciso de humanos?")
      {
        let semRecorte = 0, linhas = [];
        comTexto.forEach((k) => {
          const p = (ctx.PELUDINHOS || []).find((x) => ctx.pelKey(x) === k);
          if (!p) return;
          const Q = ctx.algPerguntas(p);
          const sep = ctx.algSeparar(respostas[k].resposta, Q);
          const n = Object.keys(sep.por).length;
          const sobra = String(sep.solto || '').trim();
          if (!sobra) semRecorte++;
          linhas.push(k.split('__')[0] + ': ' + n + '/' + Q.length + (sobra ? ' +recorte' : ''));
        });
        console.log('    [quanto o app resolve sozinho] ' + semRecorte + ' de ' + linhas.length +
          ' sem nada para recortar');
        console.log('    ' + linhas.join(' · '));
        comTexto.forEach((k) => {
          const p = (ctx.PELUDINHOS || []).find((x) => ctx.pelKey(x) === k);
          if (!p) return;
          const sep = ctx.algSeparar(respostas[k].resposta, ctx.algPerguntas(p));
          const sobra = String(sep.solto || '').trim();
          if (sobra) console.log('    [sobra ' + k + '] ' + sobra.split(String.fromCharCode(10)).join(' | ').slice(0, 300));
        });
        check('a maioria das respostas reais nao sobra nada para recortar',
          linhas.length === 0 || semRecorte >= Math.ceil(linhas.length * 0.7),
          semRecorte + '/' + linhas.length);
      }
      check('pontuacao sozinha nao vira "nao consegui encaixar"',
        !Object.keys(respostas).some((k) => {
          const p = (ctx.PELUDINHOS || []).find((x) => ctx.pelKey(x) === k);
          if (!p) return false;
          const sp = ctx.algSeparar(respostas[k].resposta || '', ctx.algPerguntas(p));
          return sp.solto && !/[a-zA-Z0-9]/.test(sp.solto);
        }));
      check('nenhum pedaco real e quase so a propria pergunta de volta',
        quaseSoPergunta.length === 0, JSON.stringify(quaseSoPergunta.slice(0, 4)));
      check('uma palavra trocada (genero) nao desmonta o reconhecimento',
        eco('Houve alguma mudanca recente de comportamento? Por exemplo: ficou mais receoso, irritado, quieto, inseguro ou sensivel ao toque? Nada novo',
            'Houve alguma mudanca recente de comportamento? Por exemplo: ficou mais receosa, irritada, quieta, insegura ou sensivel ao toque?')
          === 'Nada novo',
        JSON.stringify(eco('Houve alguma mudanca recente de comportamento? Por exemplo: ficou mais receoso, irritado, quieto, inseguro ou sensivel ao toque? Nada novo',
            'Houve alguma mudanca recente de comportamento? Por exemplo: ficou mais receosa, irritada, quieta, insegura ou sensivel ao toque?')));
    }
  }
  console.log('');

  // ============================================================================
  // Menu — índice aprovado (26/ago):
  // O menu foi reagrupado conforme docs/INDICE-MENU-APP.md. A promessa que a dona
  // fez e que estes testes cobram: NINGUÉM ganhou nem perdeu acesso. Só mudaram
  // grupo, ordem, título e a dica. Se alguém, ao mexer no menu, trocar uma classe
  // so-*/op-only de um item, o gabarito abaixo acende antes de virar produção.
  // ============================================================================
  console.log('Menu — índice aprovado (26/ago):');
  {
    // Gabarito colhido do sidebar ANTES da reorganização (25/ago/2026). É a foto de
    // QUEM VÊ O QUÊ. Só as classes de visibilidade — 'active' é estado, não permissão.
    const MENU_VISIBILIDADE_ANTES = {
      inicio: 'op-only',
      checkin: '',
      conferencia: 'so-conferencia',
      recepcao: 'so-recepcao',
      cuidadovet: 'so-vet',
      hospedagem: '',
      hospedes: 'so-hosp',
      checkout: '',
      checkoutconf: 'so-conf-saida',
      abertura: 'so-abertura',
      agenda: '',
      painel: 'so-master',
      emporio: 'so-emporio',
      ficha: 'so-gestao',
      pessoas: 'so-master',
      renovacao: 'so-gestao',
      vacinas: 'so-gestao',
      dashdc: 'so-recepcao',
      reposicao: 'so-recepcao',
      orcamento: 'so-recepcao',
      alergia: 'so-gestao',
      eahist: 'so-gestao',
      relatorios: 'so-gestao',
      acerto: 'so-master',
      ritmo: 'so-gestao',
      sair: '',
    };

    // ---- lê o sidebar de verdade (o trecho entre <nav id="nav"> e </nav>) ----
    const iNav = html.indexOf('<nav class="nav" id="nav">');
    const fNav = html.indexOf('</nav>', iNav);
    check('menu: o sidebar existe no HTML', iNav > 0 && fNav > iNav);
    const nav = html.slice(iNav, fNav);

    // Percorre o sidebar NA ORDEM: cada <a data-v> vira um item; cada <div class="grp">
    // (sem grp-sub) abre um grupo; com grp-sub é só um sub-cabeçalho.
    const itens = [];   // {v, vis, pos, grupo}
    const grupos = [];  // {titulo, pos}
    const subs = [];    // {titulo, pos}
    const re = /<(a|div)\s([^>]*)>/g;
    let m, grupoAtual = '';
    while ((m = re.exec(nav)) !== null) {
      const attrs = m[2];
      const cls = (/class="([^"]*)"/.exec(attrs) || [, ''])[1];
      const dv = /data-v="([a-z]+)"/.exec(attrs);
      // A CATEGORIA agora é um <a class="grp nav-parent"> (linha clicável que abre/fecha),
      // então o rótulo não é mais o texto solto logo após a tag: vem de dentro dos <span>.
      const fecha = nav.indexOf(m[1] === 'a' ? '</a>' : '</div>', m.index + m[0].length);
      const rotulo = nav.slice(m.index + m[0].length, fecha < 0 ? m.index : fecha)
        .replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      const ehGrp = /(^|\s)grp(\s|$)/.test(cls);
      if (dv) {
        // só as classes que decidem QUEM VÊ
        const vis = cls.split(/\s+/).filter((c) => c === 'op-only' || c.startsWith('so-')).sort().join(' ');
        itens.push({ v: dv[1], vis, pos: m.index, grupo: grupoAtual });
      } else if (ehGrp) {
        if (/grp-sub/.test(cls)) subs.push({ titulo: rotulo, pos: m.index });
        else { grupoAtual = rotulo; grupos.push({ titulo: rotulo, pos: m.index, cls, tag: m[1] }); }
      }
    }
    const porV = {};
    itens.forEach((it) => { porV[it.v] = it; });

    // ---- 1. ninguém ganhou nem perdeu acesso ----
    Object.keys(MENU_VISIBILIDADE_ANTES).forEach((k) => {
      const it = porV[k];
      check('menu: ' + k + ' mantém quem vê',
        !!it && it.vis === MENU_VISIBILIDADE_ANTES[k],
        it ? ('agora "' + it.vis + '", antes "' + MENU_VISIBILIDADE_ANTES[k] + '"') : 'sumiu do menu');
    });
    check('menu: nenhum item do menu antigo desapareceu',
      Object.keys(MENU_VISIBILIDADE_ANTES).every((k) => !!porV[k]),
      JSON.stringify(Object.keys(MENU_VISIBILIDADE_ANTES).filter((k) => !porV[k])));
    const duplicados = itens.map((i) => i.v).filter((v, i, a) => a.indexOf(v) !== i);
    check('menu: nenhum data-v aparece duas vezes', duplicados.length === 0, JSON.stringify(duplicados));
    check('menu: Configurações é a única tela nova, e é so-master',
      !!porV.config && porV.config.vis === 'so-master',
      porV.config ? porV.config.vis : 'não existe');

    // ---- 2. os grupos e a ordem do índice ----
    check('menu: os grupos estão na ordem do índice',
      JSON.stringify(grupos.map((g) => g.titulo)) === JSON.stringify(['Serviços', 'Central Zêluz', 'Operação', 'Em breve']),
      JSON.stringify(grupos.map((g) => g.titulo)));
    check('menu: os sub-cabeçalhos do índice estão lá',
      JSON.stringify(subs.map((s) => s.titulo)) === JSON.stringify([
        'AuAulândia — o hotel da Zêluz', 'Day Care', 'AuAulândia', 'Day Care', 'Peludinhos', 'Planos e cobranças']),
      JSON.stringify(subs.map((s) => s.titulo)));
    const grpDe = (t) => (grupos.find((g) => g.titulo === t) || { pos: -1 }).pos;
    // Adriana, 27/ago/2026: "Relatórios é um item à parte, no fim" — saiu de entre Operação
    // e Em breve e foi para DEPOIS de tudo, sozinho, logo antes do Sair.
    check('menu: Relatórios fica depois do grupo Em breve e antes de Sair',
      porV.relatorios && porV.sair
      && porV.relatorios.pos > grpDe('Em breve') && porV.relatorios.pos < porV.sair.pos,
      porV.relatorios ? String(porV.relatorios.pos) : 'sumiu');
    check('menu: nada do menu fica entre Relatórios e Sair',
      itens.every((it) => it.v === 'relatorios' || it.v === 'sair'
        || it.pos < porV.relatorios.pos || it.pos > porV.sair.pos),
      JSON.stringify(itens.filter((it) => it.pos > porV.relatorios.pos && it.pos < porV.sair.pos).map((i) => i.v)));
    check('menu: Relatórios vem separado por um fio (nav-solto)',
      /<a[^>]*data-v="relatorios"[^>]*class="[^"]*nav-solto/.test(nav)
      && /\.nav a\.nav-solto\{[^}]*border-top:/.test(html));
    check('menu: Relatórios não perdeu quem o vê ao virar item solto',
      porV.relatorios && porV.relatorios.vis === 'so-gestao', porV.relatorios ? porV.relatorios.vis : 'sumiu');
    [['conferencia', 'Serviços'], ['checkout', 'Serviços'], ['cuidadovet', 'Serviços'], ['abertura', 'Serviços'],
     ['checkin', 'Central Zêluz'], ['checkoutconf', 'Central Zêluz'], ['ficha', 'Central Zêluz'],
     ['emporio', 'Central Zêluz'], ['renovacao', 'Central Zêluz'],
     ['config', 'Operação'], ['acerto', 'Operação'], ['painel', 'Operação'],
     ['agenda', 'Em breve']].forEach(([k, g]) => {
      check('menu: ' + k + ' está no grupo ' + g, porV[k] && porV[k].grupo === g,
        porV[k] ? porV[k].grupo : 'sumiu');
    });
    check('menu: "Em débito" é etiqueta, não link (não tem data-v)',
      /<a[^>]*>(?:(?!<\/a>)[\s\S])*Em débito[\s\S]*?<\/a>/.test(nav)
      && !/<a[^>]*data-v="[a-z]*"[^>]*>(?:(?!<\/a>)[\s\S])*Em débito/.test(nav));
    check('menu: o Day Care continua num bloco só (a trava de permissão granular)',
      /id="blocoDaycare"/.test(nav) && /id="dcSubnav"/.test(nav)
      && html.indexOf("getElementById('blocoDaycare')") > 0);

    // ---- 3. título e dica de cada item (o app tem de ser autoexplicativo) ----
    const bloco = html.slice(html.indexOf('const titles={'));
    const titulos = {};
    const reT = /([a-z]+):\['([^']*)','([^']*)'\]/g;
    let t;
    while ((t = reT.exec(bloco.slice(0, bloco.indexOf('};') + 2))) !== null) titulos[t[1]] = [t[2], t[3]];
    const ESPERADO = {
      emporio: 'Quem não comeu hoje', recepcao: 'Pendências com o tutor',
      conferencia: 'Conferência do check-in', checkoutconf: 'Check-out com o tutor',
      hospedes: 'Hóspedes de hoje', hospedagem: 'Plantão da noite',
      abertura: 'Abertura do dia', eahist: 'Enriquecimento Ambiental',
      acerto: 'Financeiro do plantão', renovacao: 'Renovação de planos',
      dashdc: 'Lançamentos do dia', alergia: 'Alergias a confirmar',
      ficha: 'Cadastro de Peludinhos', config: 'Configurações',
    };
    Object.keys(ESPERADO).forEach((k) => {
      check('menu: ' + k + ' se chama "' + ESPERADO[k] + '"',
        titulos[k] && titulos[k][0] === ESPERADO[k],
        titulos[k] ? titulos[k][0] : 'sem título');
    });
    const semDica = itens.map((i) => i.v).filter((v) => !titulos[v] || !titulos[v][1]);
    check('menu: todo item do menu tem dica (subtítulo) não vazia',
      semDica.length === 0, JSON.stringify(semDica));
    // A dica também é o title= do link — é ela que o Zeloso lê passando o mouse.
    const semTitle = itens.map((i) => i.v).filter((v) => {
      const r = new RegExp('<a[^>]*data-v="' + v + '"[^>]*>');
      const mm = r.exec(nav);
      return !mm || !/title="[^"]+"/.test(mm[0]);
    });
    check('menu: todo link do menu carrega a dica no title=', semTitle.length === 0, JSON.stringify(semTitle));
    // navPend apagava o title ao zerar a pendência — o item ficava mudo para sempre.
    check('menu: ao zerar a pendência o navPend devolve a dica (não apaga o title)',
      /titles\[view\]\)\?titles\[view\]\[1\]/.test(html));

    // ---- 4. Configurações levou os campos, Relatórios não os tem mais ----
    const secao = (id) => {
      const i = html.indexOf('id="' + id + '"');
      if (i < 0) return '';
      const f = html.indexOf('</section>', i);
      return html.slice(i, f < 0 ? html.length : f);
    };
    const vConfig = secao('v-config'), vRel = secao('v-relatorios');
    check('menu: a tela v-config existe', vConfig.length > 0);
    ['tgUrl', 'tgSenha', 'tgStatus'].forEach((id) => {
      check('menu: v-config tem o campo ' + id, vConfig.indexOf('id="' + id + '"') > 0);
      check('menu: v-relatorios não tem mais o campo ' + id, vRel.indexOf('id="' + id + '"') < 0);
    });
    check('menu: abrir Configurações carrega o que está salvo (gancho em aoAbrirView)',
      /v==='config'\)\{\s*if\(typeof configCarregar==='function'\) configCarregar\(\);/.test(html));
    check('menu: v-relatorios continua existindo', vRel.length > 0);
    check('menu: v-inicio e v-painel continuam existindo',
      html.indexOf('id="v-inicio"') > 0 && html.indexOf('id="v-painel"') > 0);

    // Adriana, 27/ago/2026: "o nome está pequeno, não dá para enxergar; o que está dentro
    // está maior que o título". O sub-cabeçalho tem de ser MAIOR e mais pesado que o item.
    const cssSub = (/\.nav \.grp\.grp-sub\{([^}]*)\}/.exec(html) || [, ''])[1];
    const cssItem = (/\.nav a\{([^}]*)\}/.exec(html) || [, ''])[1];
    // Le "font-size:15px" sem regex: menos escape, menos chance de o teste mentir.
    const px = (css, prop) => {
      const i2 = css.indexOf(prop + ':');
      return i2 < 0 ? NaN : parseFloat(css.slice(i2 + prop.length + 1));
    };
    const peso = (css) => { const m = /font-weight:\s*(\d+)/.exec(css); return m ? parseInt(m[1], 10) : NaN; };
    check('menu: o sub-cabeçalho é MAIOR que o item que vem embaixo dele',
      px(cssSub, 'font-size') > px(cssItem, 'font-size'),
      'sub ' + px(cssSub, 'font-size') + 'px vs item ' + px(cssItem, 'font-size') + 'px');
    check('menu: o sub-cabeçalho é mais pesado que o item',
      peso(cssSub) > peso(cssItem), 'sub ' + peso(cssSub) + ' vs item ' + peso(cssItem));
    check('menu: o sub-cabeçalho não fica apagado por opacidade',
      /opacity:\s*1\s*;/.test(cssSub), cssSub);
    check('menu: o sub-cabeçalho é dourado (cor de título, não de rótulo)',
      /color:var\(--z-gold\)/.test(cssSub), cssSub);
    check('menu: o sub-cabeçalho não usa caixa-alta (o grupo é que usa)',
      /text-transform:\s*none/.test(cssSub) && /text-transform:uppercase/.test((/\.nav \.grp\{([^}]*)\}/.exec(html) || [, ''])[1]));

    // ---- 4b. TRÊS níveis, cada um um degrau abaixo (Adriana, 27/ago/2026) ----
    // "Central Zêluz mínimo... preciso de categoria de título, subtítulo e um outro título.
    //  Precisamos que as pessoas enxerguem." Referência: Azure Portal / Google Cloud / Zendesk.
    const cssCat = (/\.nav a\.grp\{([^}]*)\}/.exec(html) || [, ''])[1];
    const peso2 = (css) => { const m = /font-weight:(\d+)/.exec(css); return m ? parseInt(m[1], 10) : NaN; };
    check('menu: categoria > sub-cabeçalho > item, em tamanho',
      px(cssCat, 'font-size') > px(cssSub, 'font-size') && px(cssSub, 'font-size') > px(cssItem, 'font-size'),
      px(cssCat, 'font-size') + ' > ' + px(cssSub, 'font-size') + ' > ' + px(cssItem, 'font-size'));
    check('menu: categoria 17 / sub 15 / item 14',
      px(cssCat, 'font-size') === 17 && px(cssSub, 'font-size') === 15 && px(cssItem, 'font-size') === 14,
      [px(cssCat, 'font-size'), px(cssSub, 'font-size'), px(cssItem, 'font-size')].join('/'));
    check('menu: peso 700 / 700 / 500',
      peso2(cssCat) === 700 && peso2(cssSub) === 700 && peso2(cssItem) === 500,
      [peso2(cssCat), peso2(cssSub), peso2(cssItem)].join('/'));
    check('menu: a categoria não usa caixa-alta e é creme',
      /text-transform:none/.test(cssCat) && /color:var\(--z-cream\)/.test(cssCat), cssCat);
    check('menu: a categoria tem filete acima', /border-top:1px solid/.test(cssCat), cssCat);
    check('menu: categoria fechada esconde o que está dentro (por CSS, não mexendo em classe)',
      /\.acc:not\(\.acc-open\) > \.acc-panel\{display:none\}/.test(html));
    check('menu: item dentro de categoria tem trilha à esquerda',
      /\.nav \.acc-panel a\[data-v\][\s\S]{0,140}?border-left:2px solid/.test(html));
    // Fora de categoria = na raiz do <nav> (indentação de 4 espaços). Dentro de categoria
    // os itens vivem no .acc-panel, com 8 ou mais.
    const indent = (k) => {
      const mm = new RegExp('^( *)<a[^>]*data-v="' + k + '"', 'm').exec(nav);
      return mm ? mm[1].length : -1;
    };
    check('menu: Início, Relatórios e Sair ficam fora de categoria (na raiz do menu)',
      [4, 4, 4].join() === ['inicio', 'relatorios', 'sair'].map(indent).join(),
      JSON.stringify(['inicio', 'relatorios', 'sair'].map(indent)));
    check('menu: os itens de categoria ficam dentro do painel dela',
      ['conferencia', 'ficha', 'acerto', 'agenda'].every((k) => indent(k) >= 8),
      JSON.stringify(['conferencia', 'ficha', 'acerto', 'agenda'].map(indent)));

    // As 4 categorias: ícone, seta, clicável, e cada uma com sua chave de estado.
    const cats = [...nav.matchAll(/<a class="grp nav-parent" data-acc-toggle="([a-z]+)"([^>]*)>([\s\S]*?)<\/a>/g)]
      .map((mm) => ({ chave: mm[1], attrs: mm[2], dentro: mm[3] }));
    check('menu: as 4 categorias são linhas clicáveis (nav-parent)', cats.length === 4,
      JSON.stringify(cats.map((c) => c.chave)));
    cats.forEach((c) => {
      check('menu: categoria ' + c.chave + ' tem ícone', /data-icon="[a-z]+"/.test(c.dentro), c.dentro.slice(0, 60));
      check('menu: categoria ' + c.chave + ' tem seta', /acc-caret/.test(c.dentro));
    });
    check('menu: clicar na categoria abre/fecha (o listener do nav trata nav-parent)',
      /classList\.contains\('nav-parent'\)\)\{ toggleAcc\(a\); return; \}/.test(html));
    check('menu: o estado de aberto/fechado fica guardado',
      /localStorage\.setItem\('zeluz_acc_'\+k/.test(html) && /localStorage\.getItem\('zeluz_acc_'\+acc\.dataset\.acc\)/.test(html));
    check('menu: ao entrar, abre a categoria da tela em que a pessoa cai',
      /a\.click\(\); const _accIni=a\.closest\('\.acc'\); if\(_accIni\) _accIni\.classList\.add\('acc-open'\)/.test(html));
    check('menu: quem cai direto numa atividade entra com a categoria do Day Care aberta',
      /escopo && !_temPag[\s\S]{0,420}?blocoDaycare[\s\S]{0,220}?acc-open/.test(html));
    check('menu: a pendência de item escondido sobe para a linha da categoria',
      /function navPendSubirParaOPai\(\)[\s\S]{0,900}?\.acc-panel a\.nav-pend/.test(html)
      && /navPendSubirParaOPai\(\);/.test(html));
    check('menu: ao medir cabeçalho vazio, a categoria é aberta e depois restaurada',
      /cats\.forEach\(function\(x\)\{ x\.classList\.add\('acc-open'\); \}\);/.test(html)
      && /cats\.forEach\(function\(x,i\)\{ x\.classList\.toggle\('acc-open', catsAbertas\[i\]\); \}\);/.test(html));

    // ---- 5. cabeçalho sem item embaixo não aparece ----
    // Sem isto o monitor lia "Day Care", "Peludinhos" e "Planos e cobranças" na barra
    // sem um item embaixo — rótulo prometendo o que não existe.
    check('menu: existe a função que esconde cabeçalho vazio',
      /function ajustarSubcabecalhosMenu\(\)/.test(html));
    check('menu: o cabeçalho é reavaliado quando as permissões são aplicadas',
      /function aplicarPaginasPessoa\(u\)\{[\s\S]*?ajustarSubcabecalhosMenu\(\);[\s\S]*?\n  \}/.test(html));
    check('menu: o cabeçalho é reavaliado depois das pendências (navPend)',
      /navPendSubirParaOPai\(\);[\s\S]{0,220}?ajustarSubcabecalhosMenu\(\)/.test(html));
    const corpoFn = (/function ajustarSubcabecalhosMenu\(\)\{[\s\S]*?\n  \}/.exec(html) || [''])[0];
    check('menu: ela não encosta em classe de visibilidade (só mede e esconde o rótulo)',
      corpoFn.length > 0 && corpoFn.indexOf('so-') < 0 && corpoFn.indexOf('op-only') < 0);

    // Prova de verdade: um DOM de mentira, pequeno, com a mesma forma do menu real.
    // O teste de texto diz que a função existe; este diz que ela ACERTA qual rótulo some.
    const noMenu = (tag, cls, filhos) => {
      const n = { tagName: tag.toUpperCase(), _cls: cls ? cls.split(' ') : [],
        filhos: filhos || [], offsetParent: {}, nextElementSibling: null };
      n.style = { display: '', removeProperty(p) { if (p === 'display') n.style.display = ''; } };
      n.classList = { contains: (c) => n._cls.indexOf(c) >= 0 };
      n.desc = () => n.filhos.reduce((a, f) => a.concat([f], f.desc()), []);
      n.querySelectorAll = (sel) => n.desc().filter((f) => (sel[0] === '.'
        ? f.classList.contains(sel.slice(1)) : f.tagName === sel.toUpperCase()));
      n.querySelector = (sel) => n.querySelectorAll(sel)[0] || null;
      n.filhos.forEach((f, i) => { f.nextElementSibling = n.filhos[i + 1] || null; });
      return n;
    };
    const escondido = (el) => el.style.display === 'none';

    // Cenário do monitor: nada da AuAulândia visível, mas o Day Care (dentro do
    // #blocoDaycare, com cabeçalho próprio) tem a Abertura do dia à vista.
    const aConf = noMenu('a', ''); aConf.offsetParent = null;
    const aHosp = noMenu('a', ''); aHosp.offsetParent = null;
    const hDay = noMenu('div', 'grp grp-sub');
    const aAber = noMenu('a', '');                       // este está visível
    const blocoDC = noMenu('div', 'so-day', [hDay, aAber]);
    const hAua = noMenu('div', 'grp grp-sub');
    const gServ = noMenu('div', 'grp');
    const hPel = noMenu('div', 'grp grp-sub');
    const aVac = noMenu('a', ''); aVac.offsetParent = null;
    const gCentral = noMenu('div', 'grp');
    const navFake = noMenu('nav', '', [gServ, hAua, aConf, aHosp, blocoDC, gCentral, hPel, aVac]);

    const rodar = () => {
      const real = ctx.document.getElementById;
      ctx.document.getElementById = (id) => (id === 'nav' ? navFake : real.call(ctx.document, id));
      try { ctx.ajustarSubcabecalhosMenu(); } finally { ctx.document.getElementById = real; }
    };
    if (typeof ctx.ajustarSubcabecalhosMenu !== 'function') {
      check('menu: a função de esconder cabeçalho é alcançável para simular', false, 'não exportada');
    } else {
      rodar();
      check('menu: some o sub-cabeçalho que ficou sem nenhum item', escondido(hAua));
      check('menu: some o grupo inteiro quando nada sobrou (Central Zêluz)', escondido(gCentral));
      check('menu: some o sub-cabeçalho Peludinhos junto com o grupo', escondido(hPel));
      check('menu: fica o sub-cabeçalho que ainda tem item (Day Care)', !escondido(hDay));
      check('menu: fica o grupo que tem item aninhado num bloco (Serviços)', !escondido(gServ));
      // O rótulo de dentro do bloco não empresta itens para o rótulo de fora: se emprestasse,
      // "AuAulândia — o hotel da Zêluz" ficaria de pé sem nada seu embaixo.
      check('menu: um rótulo não conta os itens do bloco vizinho', escondido(hAua) && !escondido(hDay));
      // Trocar de papel tem que poder REVELAR de novo — senão some para sempre.
      aVac.offsetParent = {};
      rodar();
      check('menu: quando o item volta, o cabeçalho volta com ele', !escondido(hPel) && !escondido(gCentral));
    }
  }
  console.log('');

  console.log('Escape literal nao pode chegar na tela (27/ago):');
  {
    // A tela mostrou "\\u2713 Horarios das refeicoes" para a Adriana: uma string com a
    // barra dobrada vira o TEXTO "\\u2713" em vez do sinal de visto. Nenhum teste pegava
    // porque o app funcionava — so estava feio e sem sentido para quem le.
    const literais = html.match(/'[^']*\\\\u[0-9a-fA-F]{4}[^']*'/g) || [];
    check('nenhuma string do app carrega um escape com barra dobrada',
      literais.length === 0, JSON.stringify(literais.slice(0, 5)));
    check('os sinais da curadoria sao caracteres de verdade',
      /var selo = decidir \? '\u26a0'/.test(html) || /selo\s*=\s*decidir\s*\?\s*'\u26a0'/.test(html),
      'nao achei o sinal de atencao como caractere');
  }
  console.log('');

  console.log('Prevencao: so aparece quem precisa (27/ago):');
  {
    // Adriana: "Chico, Pastor de Shetland, nao esta devendo nada? Entao nao tem que
    // aparecer. Assim como Estrella, Felix e etc. So pode aparecer quando precisa."
    check('a tela abre em quem realmente deve', /var PREV_TIPO='deve';/.test(html));
    check('ficha de prevencao em branco tem nome proprio',
      /function prevFichaVazia\(ex\)/.test(html) && /Sem cadastro/.test(html));
    check('a classificacao poe erro de digitacao antes de vencimento',
      /function prevClasse\(faltas, ex\)/.test(html) &&
      html.indexOf("return 'erro';") < html.indexOf("return 'deve';"));

    if (typeof ctx.prevDados === 'function' && typeof ctx.prevClasse === 'function') {
      const antes = ctx.PREV_TIPO;
      ctx.PREV_TIPO = 'tudo';
      const todos = ctx.prevDados();
      const porClasse = {};
      todos.forEach((o) => { porClasse[o.classe] = (porClasse[o.classe] || 0) + 1; });
      ctx.PREV_TIPO = 'deve';
      const devendo = ctx.prevDados();
      ctx.PREV_TIPO = 'semcad';
      const semCad = ctx.prevDados();
      ctx.PREV_TIPO = antes;

      console.log('    [prevencao] ' + todos.length + ' com alguma pendencia · ' +
        JSON.stringify(porClasse));
      // A BANCADA NAO CARREGA A PREVENCAO: aqui todos caem em "sem cadastro" porque
      // pelExtra() vem sem as datas. Se eu deixar assim, as assercoes abaixo passam
      // sozinhas — teste que so pode dar verde nao testa nada. Entao ele DIZ isso, e a
      // logica e provada logo abaixo com fichas que eu mesmo monto.
      const semDadosReais = (todos.length > 0 && !porClasse.deve && !porClasse.rotina);
      if (semDadosReais) {
        console.log('    (o sandbox nao carrega as datas de prevencao — a prova real e ' +
          'no app; a logica vai ser testada com fichas montadas aqui)');
      }
      check('a lista de "devendo" e menor que a lista de tudo',
        devendo.length < todos.length, devendo.length + ' de ' + todos.length);
      check('ninguem com a ficha em branco entra em "devendo"',
        devendo.every((o) => !ctx.prevFichaVazia(ctx.pelExtra(o.p) || {})),
        JSON.stringify(devendo.filter((o) => ctx.prevFichaVazia(ctx.pelExtra(o.p) || {}))
          .map((o) => o.nome).slice(0, 5)));
      check('ninguem devendo so rotina entra em "devendo"',
        devendo.every((o) => o.faltas.some((f) => !f.rotina)),
        JSON.stringify(devendo.filter((o) => o.faltas.every((f) => f.rotina))
          .map((o) => o.nome).slice(0, 5)));
      check('quem tem ficha em branco aparece em "Sem cadastro", nao some do sistema',
        !porClasse.semcad || semCad.length === porClasse.semcad,
        semCad.length + ' vs ' + porClasse.semcad);

      // os tres nomes que a Adriana apontou
      const apontados = ['chico', 'estrella', 'felix'];
      const aindaDevendo = devendo.filter((o) =>
        apontados.includes(ctx.jsNorm(o.nome)) && ctx.prevFichaVazia(ctx.pelExtra(o.p) || {}));
      check('Chico, Estrella e Felix (ficha em branco) sairam de "devendo"',
        aindaDevendo.length === 0, JSON.stringify(aindaDevendo.map((o) => o.nome)));
    }

    // ---- a logica, com fichas montadas aqui: nao depende do que a bancada carrega ----
    if (typeof ctx.prevClasse === 'function' && typeof ctx.prevFaltasDe === 'function') {
      const hoje = new Date();
      const iso = (d) => new Date(hoje.getTime() + d * 86400000).toISOString().slice(0, 10);
      const classeDe = (ex) => ctx.prevClasse(ctx.prevFaltasDe(ex), ex);

      // vacina vencida ha 100 dias = DEVENDO
      check('vacina vencida cai em "devendo"',
        classeDe({ vac_mult_p: iso(-100), vac_mult_t: iso(-465) }) === 'deve',
        classeDe({ vac_mult_p: iso(-100), vac_mult_t: iso(-465) }));
      // nada preenchido = SEM CADASTRO (nao e divida: e o Chico da Adriana)
      check('ficha inteiramente em branco cai em "sem cadastro"',
        classeDe({}) === 'semcad', classeDe({}));
      // tudo em dia, so o peso do mes faltando = ROTINA
      const emDia = {};
      check('so o peso do mes nao poe ninguem em "devendo"',
        ['deve'].indexOf(classeDe({ vac_mult_p: iso(200), vac_raiva_p: iso(200),
          vac_gripe_p: iso(200), vac_giardia_p: iso(200), ecto_p: iso(20),
          verm_p: iso(60), coleira_p: iso(200), fezes_p: iso(200) })) < 0,
        classeDe({ vac_mult_p: iso(200), vac_raiva_p: iso(200), vac_gripe_p: iso(200),
          vac_giardia_p: iso(200), ecto_p: iso(20), verm_p: iso(60),
          coleira_p: iso(200), fezes_p: iso(200) }));
      // ano impossivel = ERRO, e vem antes de qualquer vencimento
      check('ano impossivel cai em "data errada", nao em "devendo"',
        classeDe({ vac_mult_p: '0026-02-13', ecto_p: iso(-90) }) === 'erro',
        classeDe({ vac_mult_p: '0026-02-13', ecto_p: iso(-90) }));
      // ficha com UM item preenchido e outro faltando = divida real, nao "sem cadastro"
      check('faltar um item numa ficha que ja tem os outros e divida de verdade',
        classeDe({ vac_mult_p: iso(200) }) === 'deve',
        classeDe({ vac_mult_p: iso(200) }));
      // o nome antigo do campo tambem conta como preenchido (fichas de antes)
      check('o nome antigo do campo tambem conta como cadastro feito',
        ctx.prevFichaVazia({ vermifugo_p: iso(60) }) === false);
    }
  }
  console.log('');

  console.log('Campo abandonado nao proibe ninguem de frequentar (27/ago):');
  {
    // "Painel do dia esta todo vermelho... resolva, porque acho que nao e real."
    // Eram 99 em "PREVENCAO VENCIDA - nao podem frequentar". No cadastro real:
    // campo novo ecto_p = 42 fichas, 9 vencidas; campo antigo carrapaticida_p = 122
    // fichas, 117 vencidas; e nas 28 que tem os dois, o novo e mais recente em 28/28.
    check('a pendencia sabe de onde veio', /function prevOrigem\(ex, it\)/.test(html));
    check('o bloqueio de frequentar usa so o campo em uso',
      /venc:venc\.filter\(function\(x\)\{ return !x\.antigo; \}\)/.test(html));
    check('o que veio do campo antigo sai separado, nunca calado',
      /desatualizado:venc\.filter/.test(html) && /Ficha por migrar/.test(html));

    if (typeof ctx.prevPendencias === 'function') {
      const hoje = new Date();
      const iso = (d) => new Date(hoje.getTime() + d * 86400000).toISOString().slice(0, 10);
      // so o campo ANTIGO, vencido: nao pode bloquear
      const soAntigo = ctx.prevPendencias({ carrapaticida_p: iso(-60) });
      check('vencido so no campo antigo nao entra no bloqueio',
        !soAntigo.venc.some((x) => /Ectoparasitas/.test(x.nome)),
        JSON.stringify(soAntigo.venc.map((x) => x.nome)));
      check('e aparece na lista de ficha por migrar',
        (soAntigo.desatualizado || []).some((x) => /Ectoparasitas/.test(x.nome)),
        JSON.stringify((soAntigo.desatualizado || []).map((x) => x.nome)));
      // campo NOVO vencido: bloqueia mesmo
      const novoVenc = ctx.prevPendencias({ ecto_p: iso(-10) });
      check('vencido no campo em uso continua bloqueando',
        novoVenc.venc.some((x) => /Ectoparasitas/.test(x.nome)),
        JSON.stringify(novoVenc.venc.map((x) => x.nome)));
      // os DOIS: vale o campo em uso (que e sempre o mais recente no cadastro real)
      const ambos = ctx.prevPendencias({ carrapaticida_p: iso(-60), ecto_p: iso(20) });
      check('tendo os dois, vale o campo em uso',
        !ambos.venc.some((x) => /Ectoparasitas/.test(x.nome)) &&
        !(ambos.desatualizado || []).some((x) => /Ectoparasitas/.test(x.nome)),
        JSON.stringify({ venc: ambos.venc.map((x) => x.nome),
                         velha: (ambos.desatualizado || []).map((x) => x.nome) }));
      check('"quem saiu" sai ordenado por data, do mais recente',
        /saiu\.sort\(function\(a,b\)\{ return String\(b\.quando/.test(html));
      check('quem faleceu sai da lista de contato',
        /function saidaPorObito\(motivo\)/.test(html) && /Partiram \('/.test(html));
      if (typeof ctx.saidaPorObito === 'function') {
        ['Faleceu em 15/08', 'obito', 'Morreu ontem', 'FALECIDA'].forEach((m) =>
          check('reconhece obito escrito como "' + m + '"', ctx.saidaPorObito(m) === true));
        ['Mudou de cidade', 'Tutora precisa economizar', 'Cio', 'Está em tratamento pós cirurgia']
          .forEach((m) => check('nao confunde "' + m + '" com obito', ctx.saidaPorObito(m) === false));
      }
    }
  }
  console.log('');

  console.log('Hospedados: o mesmo FILHOt nao pode virar dois (27/ago):');
  {
    // "Nelson chegou para hospedagem... em Hospedados agora consta 4 - sendo Nelson
    // mandela, Lara e Nelson so na planilha. Esses Nelson sao o mesmo peludinho."
    check('a raca sozinha nao vira tutor', /else if\(_tutor && !_raca && ehRacaLike\(_tutor\)\)/.test(html));
    check('a tela pergunta em vez de juntar sozinha',
      /function hospPodeSerMesmo\(a, b\)/.test(html) && /E o mesmo FILHOt que|É o mesmo FILHOt que/.test(html));
    check('a resposta fica gravada e vale para os dois lados',
      /daycare\/hospede-mesmo/.test(html) && /function hospParChave\(a, b\)/.test(html));

    if (typeof ctx.hospPodeSerMesmo === 'function') {
      const P = (nome, tutor, chip) => ({ nome, tutor, microchip: chip || '' });
      check('"Nelson" e "Nelson mandela" da mesma tutora sao suspeitos',
        ctx.hospPodeSerMesmo(P('Nelson', 'Lara de Castro'), P('Nelson mandela', 'Lara')) === true);
      check('nomes parecidos de tutoras diferentes NAO sao suspeitos',
        ctx.hospPodeSerMesmo(P('Maya', 'Carolina'), P('Maya do Sul', 'Luciana')) === false);
      check('nomes sem relacao nunca sao suspeitos',
        ctx.hospPodeSerMesmo(P('Nelson', 'Lara'), P('Toshi', 'Victor')) === false);
      check('nome identico nao e "suspeita", e o mesmo registro',
        ctx.hospPodeSerMesmo(P('Nelson', 'Lara'), P('Nelson', 'Lara')) === false);
    }
    if (typeof ctx.hospMesmoPeloChip === 'function') {
      const C = (chip) => ({ nome: 'x', microchip: chip });
      check('chip igual decide: e o mesmo', ctx.hospMesmoPeloChip(C('963003'), C('963.003')) === 1);
      check('chip diferente decide: sao dois', ctx.hospMesmoPeloChip(C('963003'), C('111222')) === 0);
      check('sem chip dos dois lados, o app nao decide sozinho',
        ctx.hospMesmoPeloChip(C('963003'), C('')) === -1 && ctx.hospMesmoPeloChip(C(''), C('')) === -1);
      check('chip diferente nem chega a virar pergunta',
        ctx.hospPodeSerMesmo({nome:'Nelson',tutor:'Lara',microchip:'963003'},
                             {nome:'Nelson mandela',tutor:'Lara',microchip:'999999'}) === false);
      check('chip igual dispensa a pergunta e junta',
        /porChip===1\){ a\.juntouPeloChip=true/.test(html) && /juntei pelo microchip/.test(html));
    }
  }
  console.log('');

  // ---- resumo ----
  console.log('== Resultado: ' + pass + ' ok, ' + fail + ' falha(s) ==');
  if (fail) { console.log('\nFalhas:'); fails.forEach((f) => console.log('  - ' + f)); }
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error('ERRO no harness:', e); process.exit(1); });
