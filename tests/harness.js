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
require('./lib/appcheck').instalarNoHttps(https); // App Check: só age com FIREBASE_APPCHECK_DEBUG_TOKEN no ambiente

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

  // As janelinhas da casa, no sandbox. zPergunta/zTexto desenham um cartaz na tela e só
  // resolvem quando alguém TOCA num botão — e aqui não há dedo nenhum. Por padrão o
  // sandbox responde "sim" e escreve um texto, que é o caminho que os testes de negócio
  // já exercitavam com confirm()/prompt(). Quem quiser provar o "não" usa respondendo().
  const RESP = { pergunta: true, texto: 'motivo escrito no teste' };
  ctx.zPergunta = () => Promise.resolve(RESP.pergunta);
  ctx.zTexto = () => Promise.resolve(RESP.texto);
  const respondendo = async (op, fn) => {
    const antes = { pergunta: RESP.pergunta, texto: RESP.texto };
    Object.assign(RESP, op);
    try { return await fn(); } finally { Object.assign(RESP, antes); }
  };
  const passarAsVoltas = (n) => new Promise((r) => setTimeout(r, n || 30));

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

  // A conta do Financeiro (fin*) — mesma ideia do painel-logica.js: função pura,
  // fora do index.html, provada aqui ANTES de existir uma tela de dinheiro.
  const FIN = path.join(__dirname, '..', 'auaulandia', 'financeiro-logica.js');
  if (fs.existsSync(FIN)) {
    vm.runInContext(fs.readFileSync(FIN, 'utf8'), ctx, { filename: 'financeiro-logica.js' });
    console.log('financeiro-logica.js carregou no mesmo sandbox.\n');
  }

  // O leitor da resposta do tutor (rt*) — mesma ideia do painel-logica.js: função
  // pura, fora do index.html, provada aqui ANTES de existir um botão na tela.
  const RT = path.join(__dirname, '..', 'auaulandia', 'resposta-tutor.js');
  if (fs.existsSync(RT)) {
    vm.runInContext(fs.readFileSync(RT, 'utf8'), ctx, { filename: 'resposta-tutor.js' });
    console.log('resposta-tutor.js carregou no mesmo sandbox.\n');
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
  // Uma função de gravação pode ser um porteiro fino que confere a permissão e entrega o
  // trabalho ao gêmeo de underline (`setPelExtra` → `_setPelExtra`). O caminho REAL da
  // gravação é a soma dos dois — então a fonte examinada é a do porteiro MAIS a do gêmeo,
  // e só quando o porteiro de fato o chama. Sem isso, partir a função em duas faria a prova
  // passar a olhar para o lado errado e o rastro poderia sumir sem ninguém perceber.
  const srcGrav = (fn) => {
    let s = String(ctx[fn] || '');
    const gemeo = '_' + fn;
    if (typeof ctx[gemeo] === 'function' && s.indexOf(gemeo + '(') >= 0) {
      s += '\n' + String(ctx[gemeo]);
    }
    return s;
  };
  const semCatchVazio = (fn) => {
    const s = srcGrav(fn);
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
    // Gabarito atualizado em 31/ago/2026 (paginação do PDF): o nome de quem assinou
    // passou a ficar ABAIXO da imagem da assinatura, não atravessando-a. Mesmo tamanho.
    const GABARITO_PDF_CHECKIN = 'd87be8577fd6c31b3c0fdf7b1e7dc74c97ec7b83c44cac53feb541c1c9ecf058'; // 3628 bytes
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
      check(fn + ' deixa rastro na falha (_logFalhaGrav)', /_logFalhaGrav\(/.test(srcGrav(fn)));
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
      check(fn + ' deixa rastro na falha (_logFalhaGrav)', /_logFalhaGrav\(/.test(srcGrav(fn)));
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
        /banco reconectando/.test(srcGrav(fn)));
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
    // 29/ago/2026 — de 56/35 (25/ago) para UMA janelinha nativa no arquivo inteiro. O bloco
    // "Janelinhas do navegador" no fim deste arquivo conta e nomeia a única que ficou.
    const nConfirm = (html.match(/\bconfirm\s*\(/g) || []).length;
    const nPrompt = (html.match(/\bprompt\s*\(/g) || []).length;
    check('confirm() nativo só aparece em comentário (memória histórica)', nConfirm <= 2, 'achei ' + nConfirm);
    check('prompt() nativo: só a de quem está no turno, mais os comentários', nPrompt <= 8, 'achei ' + nPrompt);

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

  // ---- Prevenção: trava de logica da data (Adriana, 29/ago/2026) ----
  // "a pessoa foi colocar a data da vacina, nao mudou o ano do calendario -- tomou em
  //  29/08/2025 e continua devendo. Precisa aparecer um aviso... nao permitir o erro
  //  humano." Funcao pura prevChecarLogica(nome, feitoISO, proximoISO, hoje).
  console.log('Prevencao -- trava de logica da data:');
  if (typeof ctx.prevChecarLogica === 'function') {
    // (a) o erro real: 29/08/2025 lancado em 29/08/2026, calendario nao avancou o ano
    const a = ctx.prevChecarLogica('Vacina Antirrábica', '2025-08-29', '2025-08-29', '2026-08-29');
    check('(a) ano do calendario esquecido: ok=false', a.ok === false, JSON.stringify(a));
    check('(a) sugestao e a mesma data com o ano corrente (2026-08-29)', a.sugestao === '2026-08-29', JSON.stringify(a));
    check('(a) pede confirmacao, nao bloqueia sozinho', a.confirmar === true, JSON.stringify(a));

    // (b) feito no futuro -- bloqueia
    const b = ctx.prevChecarLogica('Vermífugo', '2026-09-01', '', '2026-08-29');
    check('(b) feito no futuro bloqueia (ok=false, sem confirmar)', b.ok === false && !b.confirmar, JSON.stringify(b));
    check('(b) motivo fala da data no futuro', /futuro/.test(b.motivo || ''), JSON.stringify(b));

    // (c) validade termina antes da aplicacao -- bloqueia
    const c = ctx.prevChecarLogica('Coleira repelente', '2026-08-29', '2026-08-01', '2026-08-29');
    check('(c) validade antes da aplicacao bloqueia (ok=false, sem confirmar)', c.ok === false && !c.confirmar, JSON.stringify(c));
    check('(c) motivo fala da validade antes da aplicacao', /validade/.test(c.motivo || ''), JSON.stringify(c));

    // (d) data correta -- ok
    const d = ctx.prevChecarLogica('Exame de fezes', '2026-08-01', '2026-09-15', '2026-08-29');
    check('(d) data correta devolve ok=true', d.ok === true, JSON.stringify(d));

    // mordida: se a regra do futuro for invertida (feito no futuro passa como ok),
    // este teste tem que cair -- prova que o teste de fato exercita a regra.
    const mordidaFuturo = ctx.prevChecarLogica('Vermífugo', '2026-09-01', '', '2026-08-29');
    check('mordida -- feito no futuro nunca pode voltar ok=true', mordidaFuturo.ok !== true, JSON.stringify(mordidaFuturo));
  } else {
    check('prevChecarLogica existe', false, 'função não encontrada no app');
  }

  // (e) prevLancar e o salvar da ficha (pbSalvar) de fato CHAMAM a trava -- não é só
  // uma função pura solta que ninguém usa.
  const corpoFuncao = (nomeFn) => {
    const re = new RegExp('function\\s+' + nomeFn + '\\s*\\([^)]*\\)\\s*\\{');
    const m = re.exec(html);
    if (!m) return '';
    let i = m.index + m[0].length, depth = 1;
    while (i < html.length && depth > 0) {
      if (html[i] === '{') depth++;
      else if (html[i] === '}') depth--;
      i++;
    }
    return html.slice(m.index + m[0].length, i);
  };
  const corpoPrevLancar = corpoFuncao('prevLancar');
  const corpoPbSalvar = corpoFuncao('pbSalvar');
  check('prevLancar (aba Prevenção) chama prevChecarLogica', /prevChecarLogica\(/.test(corpoPrevLancar), 'corpo com ' + corpoPrevLancar.length + ' caracteres');
  check('pbSalvar (Salvar da ficha) chama prevChecarLogica', /prevChecarLogica\(/.test(corpoPbSalvar), 'corpo com ' + corpoPbSalvar.length + ' caracteres');
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
    check('banho pergunta o shampoo e onde ele esta',
      /c:'sham'/.test(item('banho')) && /ops:DASH_SHAM_ONDE/.test(item('banho')));
    check('e "onde esta" so vale se ele trouxe',
      /dep:\{c:'sham', v:'SHAMPOO'\}/.test(item('banho')));
    check('vet continua num clique so', !/campos:/.test(item('vet')));
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
      check('hidratacao nao ganha parenteses nenhum', ctx.dashDetTexto('hidratacao') === '');
      check('hidratacao nunca "falta responder"', ctx.dashDetFalta('hidratacao') === '');

      // ----- o shampoo dele (Adriana, 28/ago/2026) -----
      ctx.DASH_DET = {}; ctx.DASH_SEL = {};
      check('banho comeca cobrando o shampoo',
        ctx.dashDetFalta('banho') === 'Trouxe shampoo?', JSON.stringify(ctx.dashDetFalta('banho')));
      ctx.dashSetDet('banho', 'sham', 'SEM SHAMPOO');
      check('nao trouxe: nao pergunta onde esta',
        ctx.dashDetFalta('banho') === '', JSON.stringify(ctx.dashDetFalta('banho')));
      check('nao trouxe sai escrito assim',
        ctx.dashDetTexto('banho') === ' (SEM SHAMPOO)', JSON.stringify(ctx.dashDetTexto('banho')));
      ctx.dashSetDet('banho', 'sham', 'SHAMPOO');
      check('trouxe: agora precisa dizer onde esta',
        ctx.dashDetFalta('banho') === 'Onde está o shampoo?', JSON.stringify(ctx.dashDetFalta('banho')));
      ctx.dashSetDet('banho', 'onde', 'NA RECEPÇÃO');
      check('shampoo na recepcao vai junto com o nome',
        ctx.dashDetTexto('banho') === ' (SHAMPOO · NA RECEPÇÃO)', JSON.stringify(ctx.dashDetTexto('banho')));
      ctx.dashSetDet('banho', 'onde', 'NA BOLSA');
      check('trocar para a bolsa troca so o lugar',
        ctx.dashDetTexto('banho') === ' (SHAMPOO · NA BOLSA)', JSON.stringify(ctx.dashDetTexto('banho')));
      // a armadilha: responder "onde" e depois dizer que nao trouxe
      ctx.dashSetDet('banho', 'sham', 'SEM SHAMPOO');
      check('mudar de ideia esquece o lugar do shampoo',
        ctx.dashDetTexto('banho') === ' (SEM SHAMPOO)' && ctx.dashDetFalta('banho') === '',
        JSON.stringify([ctx.dashDetTexto('banho'), ctx.dashDetFalta('banho')]));

      // o relogio do banho passou a morar dentro do painel
      check('o painel de quem tem horario desenha o relogio',
        /if\(it\.hora\)\{[\s\S]{0,200}type="time" class="cad-in" id="dashH_/.test(html));
      ctx.DASH_SEL = {banho: 'Toshi/Shih Tzu'};
      check('escolhido sem horario, o botao cobra o horario',
        ctx.dashDetFalta('banho') === 'Horário', JSON.stringify(ctx.dashDetFalta('banho')));
      ctx.DASH_DET = {}; ctx.DASH_SEL = {};
      check('sem ninguem escolhido nao se cobra horario de ninguem',
        ctx.dashDetFalta('banho') === 'Trouxe shampoo?', JSON.stringify(ctx.dashDetFalta('banho')));
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
    const cssSubAcc = (/\.nav a\.grp\.grp-sub\{([^}]*)\}/.exec(html) || [, ''])[1];
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
    check('menu: ao entrar, abre a corrente inteira (categoria E sub-cabeçalho) da tela ativa',
      /a\.click\(\); abrirSanfonasDe\(a\);/.test(html)
      && /function abrirSanfonasDe\(el\)[\s\S]{0,400}?parentElement\.closest\('\.acc'\)/.test(html));
    check('menu: quem cai direto numa atividade entra com o Day Care aberto',
      /escopo && !_temPag[\s\S]{0,420}?abrirSanfonasDe\(document\.getElementById\('blocoDaycare'\)\)/.test(html));

    // ---- 4c. SEGUNDO nível: o sub-cabeçalho também abre e fecha ----
    // Adriana, 27/ago/2026: "Toda vez que abro a Central Zêluz, tudo abre... isso vira poluição.
    // Quero que abra os títulos, e ao clicar nele abre o restante; clico de novo, fecha."
    const subsAcc = [...nav.matchAll(/<a class="grp grp-sub nav-parent" data-acc-toggle="([a-z-]+)"([^>]*)>([\s\S]*?)<\/a>/g)]
      .map((mm) => ({ chave: mm[1], dentro: mm[3] }));
    check('menu: os 6 sub-cabeçalhos são linhas clicáveis que abrem e fecham',
      subsAcc.length === 6, JSON.stringify(subsAcc.map((x) => x.chave)));
    subsAcc.forEach((x) => {
      check('menu: sub-cabeçalho ' + x.chave + ' tem seta', /acc-caret/.test(x.dentro));
    });
    check('menu: cada sub-cabeçalho guarda o próprio estado (chave própria)',
      new Set(subsAcc.map((x) => x.chave)).size === 6 && subsAcc.every((x) => /^[sc]-/.test(x.chave)));
    check('menu: sub-cabeçalho fechado esconde os itens dele (mesma mecânica da categoria)',
      subsAcc.every((x) => {
        const i = nav.indexOf('data-acc-toggle="' + x.chave + '"');
        return nav.indexOf('<div class="acc-panel">', i) > i;
      }));
    check('menu: o sub-cabeçalho é 15px dourado, não herda os 17px creme da categoria',
      px(cssSubAcc, 'font-size') === 15 && /color:var\(--z-gold\)/.test(cssSubAcc), cssSubAcc);
    check('menu: o sub-cabeçalho tem alvo de toque de 44px',
      px(cssSubAcc, 'min-height') >= 44, cssSubAcc);
    check('menu: Cadastro de Peludinhos fica na RAIZ da Central Zêluz (fora de sub-cabeçalho)',
      (() => {
        const iFicha = nav.indexOf('data-v="ficha"');
        const iCentral = nav.indexOf('data-acc-toggle="central"');
        const iPrimeiroSub = nav.indexOf('data-acc-toggle="c-auaulandia"');
        return iCentral < iFicha && iFicha < iPrimeiroSub;
      })());
    check('menu: a pendência sobe em dois degraus (item, sub-cabeçalho, categoria)',
      /\.acc-panel a\.nav-pend:not\(\.nav-parent\)/.test(html));
    check('menu: ao medir cabeçalho vazio, cabeçalho não conta como item',
      /!a\.classList\.contains\('nav-parent'\)/.test(html));
    check('menu: Enriquecimento Ambiental (eahist) continua na Operação',
      porV.eahist && porV.eahist.grupo === 'Operação', porV.eahist ? porV.eahist.grupo : 'sumiu');
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

  console.log('Reposicao vira pernoite no orcamento (27/ago):');
  {
    // Adriana: "tutor de auluno no Day Care, quando tem reposicao, acaba utilizando na
    // hospedagem, pagando apenas pernoite. No orcamento, se e um peludinho do Day Care
    // tem que ter uma caixa de 'Tem reposicoes' — se sim, perguntar quantas usar."
    check('o saldo de reposicao aparece na ficha do FILHOt',
      /function blocoReposicaoFicha\(p\)/.test(html) && /\$\{blocoReposicaoFicha\(p\)\}/.test(html));
    check('da para lancar e usar sem sair da ficha',
      /function repFichaCreditar\(\)/.test(html) && /function repFichaUsar\(\)/.test(html));
    check('a caixa so aparece para quem tem saldo', /if\(!saldo\) return '';/.test(html));
    check('a reposicao transforma diaria em pernoite',
      /n\.pernoite=true; n\.porReposicao=true;/.test(html));
    check('nunca usa mais reposicoes do que ha diarias',
      /var repUsa=Math\.min\(repPedidas, nDiaBruto\);/.test(html));
    check('o saldo NAO cai no orcamento — so no check-in',
      /O saldo s\u00f3 cai no check-in|O saldo só cai no check-in/.test(html));
    check('linha zerada nao aparece na conta (0 diarias x R$ 130,00)',
      /if\(p\.nDia>0\) h\+=/.test(html) && /if\(p\.nPer>0\) h\+=/.test(html));
    check('a mensagem ao tutor conta a reposicao usada',
      /Já usando |J\u00e1 usando /.test(html));

    // A CONTA. Preco em centavos: pernoite 8500, diaria 13000 (baixa temporada).
    // 4 noites, nenhuma em dia de Day Care dele => 4 diarias.
    //   sem reposicao:        4 x 13000            = 52000
    //   com 2 reposicoes:     2 x 13000 + 2 x 8500 = 43000  (economia 9000)
    // com 15% de desconto de plano na diaria:
    //   diaria liquida = 11050; economia por noite = 11050 - 8500 = 2550
    {
      // os precos sao `const` dentro do script, entao o teste os le do arquivo: e a
      // mesma fonte que a tela usa, e assim a conta e conferida de verdade
      const mp = html.match(/ORC_PRECOS_PADRAO=\{ pernoite:\{baixa:(\d+), alta:(\d+)\}, diaria:\{baixa:(\d+), alta:(\d+)\}/);
      check('achei a tabela de precos no arquivo', !!mp);
      const P = mp ? { pernoite: { baixa: +mp[1], alta: +mp[2] }, diaria: { baixa: +mp[3], alta: +mp[4] } }
                   : { pernoite: { baixa: 0, alta: 0 }, diaria: { baixa: 0, alta: 0 } };
      check('o pernoite e mais barato que a diaria (senao a troca nao economiza nada)',
        P.pernoite.baixa < P.diaria.baixa && P.pernoite.alta < P.diaria.alta,
        JSON.stringify(P));
      const semRep = 4 * P.diaria.baixa;
      const comRep = 2 * P.diaria.baixa + 2 * P.pernoite.baixa;
      check('2 reposicoes em 4 noites economizam a diferenca das duas noites',
        semRep - comRep === 2 * (P.diaria.baixa - P.pernoite.baixa),
        'sem=' + semRep + ' com=' + comRep);
      const liq = Math.round(P.diaria.baixa * 85 / 100);
      check('com desconto de plano, a economia usa a diaria JA com desconto',
        Math.max(0, liq - P.pernoite.baixa) === liq - P.pernoite.baixa,
        'liquida=' + liq + ' pernoite=' + P.pernoite.baixa);
    }
    if (typeof ctx.orcRepUsadas === 'function' && typeof ctx.orcSaldoRep === 'function') {
      ctx.ORC_REP = {};
      const fake = { key: 'nao-existe__ninguem', nome: 'Teste' };
      check('quem nao tem saldo nunca usa reposicao', ctx.orcRepUsadas(fake) === 0);
      ctx.ORC_REP['nao-existe__ninguem'] = 5;
      check('pedir mais do que tem nao cria credito do nada', ctx.orcRepUsadas(fake) === 0);
      ctx.ORC_REP = {};
      check('FILHOt sem cadastro (avulso) nao tem reposicao',
        ctx.orcSaldoRep({ key: 'x', semCadastro: true }) === 0);
    }
  }
  console.log('');

  console.log('Peso e Foto: as duas coisas que o monitor pode mexer (27/ago):');
  {
    // Adriana: "crie uma atividade nova: Peso do Peludinho... e uma atividade Foto do
    // peludinho, para que os proprios monitores possam colocar a foto (eles nao tem
    // direito de alterar nenhum dado da ficha, a nao ser a foto). Ao colocar uma foto,
    // tem que tirar a outra."
    check('as duas atividades existem na lista do Day Care',
      /\{s:'peso',t:'Peso do peludinho'/.test(html) && /\{s:'foto',t:'Foto do peludinho'/.test(html));
    check('cada uma tem tela propria (nao e "marcar feito")',
      /if\(dcAtiv==='peso'\)\{ try\{ renderPesoAtiv\(\)/.test(html) &&
      /if\(dcAtiv==='foto'\)\{ try\{ renderFotoAtiv\(\)/.test(html));
    check('o peso cai na MESMA ficha (pesos), nao num lugar paralelo',
      /setPelExtra\(p,\{pesos:lista\}\)/.test(html));
    check('as tres telas de peso passam pela mesma regua',
      (html.match(/pesoTentar\(/g) || []).length >= 4);
    check('pesar duas vezes no mesmo dia nao cria duas linhas',
      /lista=lista\.filter\(function\(x\)\{ return x\.data!==hj; \}\)/.test(html));
    check('a foto nova apaga a antiga, e a tela avisa',
      /A antiga será apagada/.test(html) && /a antiga sai/.test(html));
    // Adriana, 29/ago: so tira foto de quem nao tem; se ficar ruim, ai troca
    check('quem NAO tem foto recebe o botao grande', />Tirar foto</.test(html));
    check('quem JA tem recebe so um link discreto, nao um botao dourado',
      /está ruim\? trocar/.test(html) && !/\(tinha\?'Trocar':'Tirar foto'\)/.test(html));
    check('a nota da tela manda fotografar so quem esta sem',
      /<strong>Só fotografe quem está sem foto<\/strong>/.test(html));
    check('e o cartao de quem tem mostra o selo verde', /já tem foto/.test(html));
    check('editar o NOME nao cria ficha nova (resto da fabrica de 04-ago)',
      /var _ckn=__cadKeyFixa\|\|cadKey\(currentHosp\);/.test(html));
    check('a foto e comprimida antes de gravar (o cadastro inteiro e baixado toda vez)',
      /var max=160, w=img\.width, h=img\.height;/.test(html));
    check('a tela de foto abre por quem NAO tem', /sem foto primeiro: e para isso|sem foto primeiro: é para isso/.test(html));
    check('falha ao gravar a foto nao some em silencio',
      /N\u00c3O gravou: '\+\(\(e&&e\.message\)\|\|e\)\+' — a foto continua aqui|NÃO gravou: '\+\(\(e&&e\.message\)\|\|e\)\+' — a foto continua aqui/.test(html));

    // ---- o relatorio de quem nao tem foto ----
    check('o relatorio de sem-foto existe e esta na lista',
      /function semFotoDados\(\)/.test(html) && /FILHOts SEM foto na ficha/.test(html));
    check('separa "sem foto nenhuma" de "foto a conferir"',
      /sem:sem, soltas:soltas/.test(html) && /CONFERIR antes de usar/.test(html));
    check('o relatorio avisa do xara (Boris da Laura x Boris da Valeria)',
      /Boris da Laura tem foto guardada como Boris da Val/.test(html));

    if (typeof ctx.semFotoDados === 'function') {
      const d = ctx.semFotoDados();
      console.log('    [fotos] ' + d.comFoto + ' com foto · ' + d.sem.length +
        ' sem foto nenhuma · ' + d.soltas.length + ' com foto a conferir');
      // A bancada nao carrega as fotos (elas vivem em daycare/fotos, que o sandbox nao
      // baixa), entao aqui todos caem em "sem foto". Se eu deixar assim, as assercoes
      // passam sozinhas. Entao ela DIZ, e a logica e provada logo abaixo com um FOTOS
      // montado a mao — inclusive o caso do xara, que e o perigoso.
      if (!d.comFoto && d.sem.length) {
        console.log('    (o sandbox nao carrega as fotos — a contagem real e no app: ' +
          '126 ativos, 79 com foto, 38 sem, 9 a conferir em 27/ago)');
      }
      check('o relatorio roda contra o cadastro real',
        (d.comFoto + d.sem.length + d.soltas.length) > 0);
      check('ninguem aparece nas duas listas ao mesmo tempo',
        !d.sem.some((x) => d.soltas.some((y) => y.chave === x.chave)));
      check('toda "foto a conferir" traz onde a foto esta',
        d.soltas.every((x) => (x.candidatas || []).length > 0),
        JSON.stringify(d.soltas.filter((x) => !(x.candidatas || []).length).map((x) => x.nome)));
      const boris = d.soltas.find((x) => /boris/i.test(x.nome));
      if (boris) {
        check('o Boris aparece como A CONFERIR, nunca religado sozinho',
          (boris.candidatas || []).length > 0 && boris.chave !== boris.candidatas[0],
          JSON.stringify({ ficha: boris.chave, foto: boris.candidatas }));
      }

      // ---- a logica, com fotos montadas aqui: nao depende do que a bancada carrega ----
      const bkpFotos = ctx.FOTOS;
      try {
        const alvo = (ctx.PELUDINHOS || []).filter((p) => !ctx.pelInativo(p)).slice(0, 3);
        if (alvo.length === 3) {
          const k0 = ctx.pelKey(alvo[0]);
          const nome1 = ctx.jsNorm(ctx.pelNome(alvo[1]));
          ctx.FOTOS = {};
          ctx.FOTOS[k0] = 'data:image/jpeg;base64,xxx';            // esse TEM foto
          ctx.FOTOS[nome1 + '__outro tutor'] = 'data:image/jpeg;base64,yyy'; // xara do segundo
          const r = ctx.semFotoDados();
          check('quem tem foto na chave certa sai da lista',
            !r.sem.some((x) => x.chave === k0) && !r.soltas.some((x) => x.chave === k0));
          check('foto de xara NAO conta como foto — vai para "a conferir"',
            r.soltas.some((x) => ctx.jsNorm(x.nome) === nome1),
            JSON.stringify(r.soltas.map((x) => x.nome)));
          check('e quem nao tem nada em lugar nenhum fica em "sem foto"',
            r.sem.some((x) => x.chave === ctx.pelKey(alvo[2])));
          check('a contagem de "com foto" bate com o que foi montado', r.comFoto === 1, String(r.comFoto));
        }
      } finally { ctx.FOTOS = bkpFotos; }
    }
  }
  console.log('');

  console.log('Download, obitos e "Cookie e Cookie" (28/ago):');
  {
    // "Download nao baixa" (duas vezes) · "Inativos esta constando a Stopa, que morreu"
    // · "precisa da raca e do primeiro nome do tutor... esta aqui hoje Cookie e Cookie"
    check('o download tem um segundo caminho quando o aparelho nao baixa',
      /function relEntregar\(nomeArquivo, html, quantos\)/.test(html) &&
      /function relAbrirNaTela\(\)/.test(html));
    check('nenhum relatorio usa mais o caminho unico que falhava calado',
      !/a\.href=url; a\.download=\w+; document\.body\.appendChild\(a\); a\.click\(\);/.test(html));
    check('a tela diz o que houve, mesmo quando o clique "funcionou"',
      /Se nada apareceu no seu aparelho/.test(html));
    check('pop-up bloqueado tambem e dito, nao fica mudo',
      /O navegador bloqueou a janela/.test(html));

    check('quem partiu sai da lista de quem pode voltar',
      /const luto=todos\.filter\(ehObito\)/.test(html) && /Partiram \(\$\{luto\.length\}\)/.test(html));
    check('a linha de quem partiu nao tem botao "Voltou"',
      /A linha de quem partiu NÃO tem botão de voltar|A linha de quem partiu NÃO tem botão de voltar/.test(html));
    check('e a reativacao e barrada por dentro, nao so pelo botao escondido',
      /if\(saidaPorObito\(_ex\.motivoSaida\|\|''\)\)\{/.test(html));

    check('os cards do monitor trazem raca e primeiro nome do tutor',
      /function ativIdent\(p\)/.test(html) && /'tutor: '\+escAttr\(pri\)/.test(html));
    if (typeof ctx.ativIdent === 'function') {
      const r = ctx.ativIdent({ n: 'Cookie', tutor: 'Raquel Duarte Ziller', raca: 'Poodle' });
      check('mostra raca e SO o primeiro nome do tutor',
        /Poodle/.test(r) && /Raquel/.test(r) && !/Ziller/.test(r), r);
      check('sem tutor e sem raca nao inventa texto', ctx.ativIdent({ n: 'X' }) === '');
    }
  }
  console.log('');

  console.log('Quem nao veio nao entra, e foto errada da para apagar (28/ago):');
  {
    // "Hulk nao esta vindo e consta na lista; quem nao esta na turma tem que sair."
    // "Coco e Coco Chanel sao diferentes e esta errada a foto. Coco Chanel: deletar."
    check('a lista de Peso e Foto passa a ser de quem ESTA presente',
      /function ativTurmaPresente\(\)/.test(html) && /presentes=prev\.filter/.test(html));
    check('antes do primeiro check-in, cai para a turma prevista COM aviso',
      /Ainda ninguém passou pelo check-in hoje|Ainda ninguém passou pelo check-in hoje/.test(html));
    check('gravar tambem procura na turma presente (nao na prevista)',
      (html.match(/ativTurmaPresente\(\)\.lista\.filter/g) || []).length >= 2);
    check('da para apagar foto errada', /function fotoAtivApagar\(k\)/.test(html));
    check('apagar pede dois toques, sem janelinha do navegador',
      /if\(FOTO_APAGAR_ARMADO!==k\)\{ FOTO_APAGAR_ARMADO=k;/.test(html) &&
      /Toque em Confirmar para apagar/.test(html));
    check('falha ao apagar nao some em silencio',
      /NÃO apaguei: |NÃO apaguei: /.test(html));
    check('apagar limpa o cache local tambem, nao so o banco',
      /delete FOTOS\[chave\]/.test(html));
  }
  console.log('');

  console.log('A linha respondida nao some sob o dedo (28/ago):');
  {
    // "Cristal, eu apertei 'nao e ela' varias vezes e nao foi." Fui ao banco: ela apertou
    // UMA vez, as 11h46, e gravou certo. As 10 decisoes dela estao corretas. O que falhou
    // foi a tela: a linha sumia na hora, a lista subia, e o toque seguinte caia em cima de
    // OUTRO FILHOt. Pior que parecer quebrado: e a chance de responder pelo errado.
    check('a resposta marca a linha em vez de faze-la sumir',
      /FOTO_CONF_AGORA\[chaveFicha\+'\|\|'\+chaveFoto\]=ehEle\?'sim':'nao';/.test(html));
    check('a tela mostra o que foi respondido agora',
      /Você respondeu agora \('|Você respondeu agora \('/.test(html));
    check('e da para desfazer', /function fotoConfDesfazer\(chaveFicha, chaveFoto\)/.test(html));
    check('desfazer "e ele" tira a copia da ficha, sem tocar na original',
      /a foto original continua onde sempre esteve/.test(html));
    check('quem respondeu "e ele" volta a aparecer pela memoria da sessao',
      /a linha volta pela memória|a linha volta pela memória/.test(html));
    check('falha ao tirar a foto no desfazer nao some em silencio',
      /NÃO consegui tirar a foto da ficha|NÃO consegui tirar a foto da ficha/.test(html));

    if (typeof ctx.fotoConfResponder === 'function' && typeof ctx.fotosConferirHTML === 'function') {
      const bkp = ctx.FOTO_CONF_AGORA;
      try {
        ctx.FOTO_CONF_AGORA = { 'x__y||x__z': 'nao' };
        const h2 = ctx.fotosConferirHTML();
        check('o bloco "respondeu agora" aparece com a resposta dada',
          /respondeu agora/.test(h2) && /não é|não é/.test(h2));
        check('e traz o botao de desfazer', /desfazer/.test(h2));
      } finally { ctx.FOTO_CONF_AGORA = bkp; }
    }
  }
  console.log('');

  console.log('Xara nao empresta foto (28/ago):');
  {
    // "A Giulia, ao tirar da Cookie Shih Tzu, apareceu na SRD; depois tirou da SRD e
    // mudou tambem da Shih Tzu. Sao duas peludinhas diferentes, racas e tutoras."
    // A gravacao estava certa (conferi no banco: fotos diferentes). O erro era a LEITURA:
    // fotoDe() procurava por NOME em qualquer chave, ignorando o tutor.
    check('existe a checagem de xara', /function nomeTemXara\(nome\)/.test(html));
    check('a chave propria vem antes de qualquer busca',
      /if\(h&&h\.refKey\)\{ var fx=fotoCad\(h\.refKey\); if\(fx\) return fx; \}/.test(html));
    check('com xara, nao se procura por nome',
      /if\(h&&h\.nome&&nomeTemXara\(h\.nome\)\) return '';/.test(html));
    check('na duvida trata como xara (lado seguro)',
      /catch\(e\)\{ return true; \}\s*\/\/ na dúvida|catch\(e\)\{ return true; \}   \/\/ na dúvida/.test(html));
    check('pelMestreDe nao escolhe mais "o primeiro da lista" sem desempate',
      /return d\|\|null; \}/.test(html) && !/return d\|\|ex\[0\]; \}/.test(html));

    if (typeof ctx.nomeTemXara === 'function') {
      const nomes = {};
      (ctx.PELUDINHOS || []).forEach((p) => {
        if (ctx.pelInativo(p)) return;
        const n = ctx.jsNorm(ctx.pelNome(p));
        nomes[n] = (nomes[n] || 0) + 1;
      });
      const xaras = Object.keys(nomes).filter((n) => nomes[n] > 1);
      const solos = Object.keys(nomes).filter((n) => nomes[n] === 1);
      console.log('    [xaras] ' + xaras.length + ' nomes repetidos entre os ativos: ' +
        xaras.slice(0, 12).join(', '));
      check('encontrei os nomes repetidos no cadastro real (Cookie entre eles)',
        xaras.length > 0 && xaras.some((n) => /cookie/.test(n)), JSON.stringify(xaras));
      check('todo nome repetido e tratado como xara',
        xaras.every((n) => ctx.nomeTemXara(n) === true),
        JSON.stringify(xaras.filter((n) => !ctx.nomeTemXara(n))));
      check('nome unico continua podendo ser procurado',
        solos.length === 0 || solos.slice(0, 20).every((n) => ctx.nomeTemXara(n) === false),
        JSON.stringify(solos.slice(0, 20).filter((n) => ctx.nomeTemXara(n))));
      check('nome vazio conta como xara (nao procura nada)', ctx.nomeTemXara('') === true);
    }
    check('identidade (foto, microchip) nao se herda por nome',
      /_NAO_HERDA_POR_NOME=\{foto:1, microchip:1, chip:1\}/.test(html) &&
      /if\(_NAO_HERDA_POR_NOME\[k\]\) return;/.test(html));
    if (typeof ctx.extraDoHosp === 'function') {
      // seguranca CONTINUA sendo herdada por nome: errar para mais protege
      const alvo = (ctx.PELUDINHOS || []).find((p) => {
        const e = ctx.pelExtra(p) || {};
        return !ctx.pelInativo(p) && String(e.alergia || e.restricao || '').trim();
      });
      if (alvo) {
        const e = ctx.pelExtra(alvo) || {};
        const herdado = ctx.extraDoHosp({ nome: ctx.pelNome(alvo), tutor: 'tutor escrito de outro jeito' });
        check('alergia/restricao continuam acompanhando o FILHOt pelo nome',
          String(herdado.alergia || herdado.restricao || '').trim() !== '' ||
          !String(e.alergia || '').trim(),
          JSON.stringify({ ficha: e.alergia || e.restricao, herdado: herdado.alergia || herdado.restricao }));
      }
    }
    if (typeof ctx.fotoDe === 'function') {
      const bkp = ctx.FOTOS;
      try {
        ctx.FOTOS = { 'cookie__raquel': 'FOTO-DA-RAQUEL' };
        check('a Cookie da Yara NAO pega a foto da Cookie da Raquel',
          ctx.fotoDe({ nome: 'Cookie', tutor: 'Yara Athayde' }) !== 'FOTO-DA-RAQUEL',
          String(ctx.fotoDe({ nome: 'Cookie', tutor: 'Yara Athayde' })).slice(0, 30));
        check('e a da Raquel tambem nao pega pela busca por nome (so pela chave)',
          ctx.fotoDe({ nome: 'Cookie', tutor: 'Raquel Duarte Ziller' }) !== 'FOTO-DA-RAQUEL' ||
          ctx.fotoDe({ nome: 'Cookie', tutor: 'Raquel Duarte Ziller', refKey: 'cookie__raquel' }) === 'FOTO-DA-RAQUEL');
        check('com a chave na mao, acha a foto certa',
          ctx.fotoDe({ nome: 'Cookie', tutor: 'Raquel', refKey: 'cookie__raquel' }) === 'FOTO-DA-RAQUEL');
      } finally { ctx.FOTOS = bkp; }
    }
  }
  console.log('');

  console.log('Foto maior para a plantonista, apagar so para a Gestao (28/ago):');
  {
    // "Tire a opcao apagar do monitor. Deixe so trocar." · "Essas fotos precisam aparecer
    // maiores para as plantonistas (elas nao ficam direto com os peludinhos)... a foto e
    // uma das formas, e a mais utilizada, de identificar o peludinho."
    check('apagar foto passa a exigir quem edita ficha',
      /function fotoPodeApagar\(\)/.test(html) && /canEditPel==='function'\) \? !!canEditPel\(\)/.test(html));
    check('o botao Apagar so aparece para quem pode',
      /tinha&&!pend&&fotoPodeApagar\(\)/.test(html));
    check('e a funcao tambem barra por dentro, com o caminho certo na mensagem',
      /Apagar foto é da Gestão e da Supervisão|Apagar foto é da Gestão e da Supervisão/.test(html) &&
      /tire a certa em "Trocar"/.test(html));
    check('a foto do hospede cresce para a plantonista',
      /#hospGrid \.pet \.ph, #cafeGrid \.pet \.ph\{width:132px;height:132px/.test(html));
    check('e a da atividade de foto tambem',
      /#genGrid\.foto-grande \.pet \.ph\{width:140px;height:140px/.test(html));
    check('no celular o retrato continua grande, sem estourar a tela',
      /@media\(max-width:520px\)\{[\s\S]{0,400}#hospGrid \.pet \.ph, #cafeGrid \.pet \.ph\{width:112px/.test(html));
    check('o modo grande e ligado so na atividade de foto',
      /el\.classList\.add\('foto-grande'\);/.test(html) &&
      /if\(dcAtiv!=='foto'\) document\.getElementById\('genGrid'\)\.classList\.remove\('foto-grande'\)/.test(html));
    check('e desligado no peso (que divide o mesmo grid)',
      /el\.classList\.remove\('foto-grande'\);/.test(html));
  }
  console.log('');

  console.log('Travas de peso: 130 kg nao entra, 9.700 e 9,7 kg, e a vet e avisada (28/ago):');
  {
    const L = (t) => ctx.pesoLer(t);
    // 1) o caso da Repolho
    check('130 kg e recusado', !!L('130').erro, JSON.stringify(L('130')));
    check('e a recusa diz o numero de volta', /130 kg n\u00e3o \u00e9 peso de FILHOt/.test(L('130').erro || ''));
    // 2) o ponto e a virgula
    check('9,7 continua 9,7', L('9,7').kg === 9.7);
    check('9.700 e 9,7 kg (ninguem pesa 9700 kg)', L('9.700').kg === 9.7, JSON.stringify(L('9.700')));
    check('9700 e lido como gramas', L('9700').kg === 9.7 && L('9700').como === 'gramas', JSON.stringify(L('9700')));
    check('700g e 0,7 kg', L('700g').kg === 0.7, JSON.stringify(L('700g')));
    check('14.4 e 14,4 kg', L('14.4').kg === 14.4);
    // A casa nao recebe cao grande: o maior FILHOt tem 21 kg (Adriana, 28/ago)
    check('21 kg (o maior da casa) passa direto', L('21').kg === 21 && !L('21').como);
    check('22 kg existe, mas pede confirmacao',
      L('22').kg === 22 && /acima do porte/.test(L('22').como || ''), JSON.stringify(L('22')));
    check('45 kg NAO e mais aceito', !!L('45').erro, JSON.stringify(L('45')));
    check('e a recusa ensina o limite da casa', /não recebe acima de 21 kg/.test(L('45').erro || ''));
    check('o "kg" digitado junto nao atrapalha', L('8,5 kg').kg === 8.5, JSON.stringify(L('8,5 kg')));
    // 3) o que nao e peso
    check('vazio nao grava', !!L('').erro);
    check('letra nao grava', !!L('abc').erro);
    check('0,2 kg e leve demais ate para filhote', !!L('0,2').erro, JSON.stringify(L('0,2')));
    check('101 (nem kg nem grama) e recusado', !!L('101').erro, JSON.stringify(L('101')));
    check('9,7 nao pede confirmacao; 9700 pede',
      !L('9,7').como && !!L('9700').como);

    // 4) a variacao — o exemplo que ela mesma escreveu (Toshi)
    const dias = (n) => { const d = new Date(ctx.hojeISO() + 'T12:00:00'); d.setDate(d.getDate() - n);
      return d.toISOString().slice(0, 10); };
    const v1 = ctx.pesoVariacao(13.9, {data: dias(10), kg: 14.4});
    check('Toshi: 14,4 para 13,9 em 10 dias e suspeito', v1.suspeito, JSON.stringify(v1));
    check('e a conta bate: -500 g', Math.abs(v1.delta + 0.5) < 1e-9, JSON.stringify(v1.delta));
    const v2 = ctx.pesoVariacao(14.45, {data: dias(7), kg: 14.4});
    check('50 g nao incomoda ninguem', !v2.suspeito, JSON.stringify(v2));
    const v3 = ctx.pesoVariacao(3.15, {data: dias(7), kg: 3.0});
    check('150 g num FILHOt de 3 kg JA e suspeito', v3.suspeito, JSON.stringify(v3));
    const v4 = ctx.pesoVariacao(21.08, {data: dias(7), kg: 21.0});
    check('80 g no maior FILHOt da casa ainda e a agua que ele bebeu', !v4.suspeito, JSON.stringify(v4));
    const v4b = ctx.pesoVariacao(21.15, {data: dias(7), kg: 21.0});
    check('150 g ja e sinal, mesmo nos 21 kg', v4b.suspeito, JSON.stringify(v4b));
    const v5 = ctx.pesoVariacao(4.6, {data: dias(120), kg: 4.4});
    check('200 g em 4 meses e crescer, nao adoecer', !v5.suspeito, JSON.stringify(v5));
    const v5b = ctx.pesoVariacao(4.8, {data: dias(120), kg: 4.4});
    check('400 g em 4 meses ja merece um olhar', v5b.suspeito, JSON.stringify(v5b));
    check('a regua e 100 g, e 300 g depois de 45 dias',
      /var limite = \(dias>45\) \? 0\.3 : 0\.1;/.test(html));
    check('sem peso anterior nao existe variacao', ctx.pesoVariacao(9.7, null) === null);

    // 5) o recado que chega na veterinaria
    const txt = ctx.pesoTextoVet({n: 'Toshi', raca: 'Shih Tzu', tutor: 'Carolina'}, 13.9,
      {data: dias(10), kg: 14.4}, v1);
    check('o recado nomeia o FILHOt, a raca e o tutor',
      /Toshi/.test(txt) && /Shih Tzu/.test(txt) && /Carolina/.test(txt));
    check('traz os dois pesos e as duas datas',
      /14,4 kg/.test(txt) && /13,9 kg/.test(txt) && (txt.match(/\d{2}\/\d{2}\/\d{4}/g) || []).length === 2, txt);
    check('diz a diferenca em gramas e em %', /-500 g/.test(txt) && /%/.test(txt), txt);
    check('diz quem pesou', /Quem pesou:/.test(txt));
    check('sem emoji (a ponte engasga com eles)',
      !/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(txt), txt);
    check('vai para o grupo da veterinaria', /tgAvisar\(\{grupo:'vet', texto:texto\}\)/.test(html));
    check('se o grupo NAO for avisado, quem pesou fica sabendo',
      /grupo da veterin\u00e1ria N\u00c3O foi avisado/.test(html));

    // 6) confirmacao em dois toques, nunca janelinha do navegador
    check('o primeiro toque explica, o segundo grava',
      /var jaConfirmou = \(PESO_CONF\[chave\]===r\.kg\);/.test(html) &&
      /Toque de novo para confirmar/.test(html));
    check('o campo aceita virgula (nao e mais type=number)',
      !/type="number"[^>]*id="pesoAtiv_/.test(html) &&
      /<input type="text" inputmode="decimal" class="cad-in" id="pesoAtiv_/.test(html));
    check('a ficha tambem tem onde mostrar o recado', /id="pesoSt"/.test(html));

    // 7) a tela de peso da recepcao e da veterinaria
    check('existe a tela e ela abre sozinha',
      /<section class="view" id="v-peso">/.test(html) &&
      /if\(v==='peso'\)\{ if\(typeof renderPesoTela==='function'\) renderPesoTela\(\); \}/.test(html));
    check('tem entrada no menu', /data-v="peso" class="so-pesa"/.test(html));
    check('recepcao, veterinaria, gestao e supervisao enxergam',
      /body\[data-role="consultora"\] \.nav a\.so-pesa/.test(html) &&
      /body\[data-role="vet"\] \.nav a\.so-pesa/.test(html) &&
      /body\[data-role="supervisor"\] \.nav a\.so-pesa/.test(html));
    check('e a veterinaria enxerga o CAMINHO ate ela (nao so o item)',
      /body\[data-role="vet"\] \.nav a\[data-v="peso"\],[\s\S]{0,220}acc="c-peludinhos"\]>a\.grp\{display:flex !important\}/.test(html));
    check('a tela tem titulo proprio', /peso:\['Peso'/.test(html));
    check('a busca mostra raca e tutor (nome sozinho nao identifica)',
      /pesoTelaBuscar[\s\S]{0,1400}ativIdent\(o\.p\)/.test(html));
    check('procura qualquer FILHOt do cadastro, nao so a turma do dia',
      /function pesoTelaBuscar\(\)[\s\S]{0,700}\(PELUDINHOS\|\|\[\]\)\.forEach/.test(html));
    check('a tela mostra quem ja foi pesado hoje', /function pesoTelaHojeHTML\(\)/.test(html));
  }
  console.log('');

  console.log('Aviso de almoco: sai sozinho, separa o urgente e nada some no 8o dia (28/ago):');
  {
    check('o envio nao depende mais de abrir a tela do Emporio',
      /function empChecarAtrasoDiario\(\)/.test(html) &&
      /try\{ empChecarAtrasoDiario\(\); \}catch\(e\)\{\}/.test(html) && /\}, 6000\); \}catch\(e\)\{\}/.test(html));
    check('quem entra dispara, seja qual for o papel (so o tutor fica de fora)',
      (html.match(/if\(r==='tutor'\) return/g) || []).length >= 1 &&
      !/\['consultora','gestao','supervisor','diretoria'\]\.indexOf\(r\)<0\) return;/.test(html));

    // a cobranca das 16h20 (Adriana, 28/ago): "nao foi aberto o programa hoje"
    check('existe o vigia do 2o horario', /function empVigiaAlmoco2\(\)/.test(html));
    check('so age depois das 16h20', /var VIGIA_ALM2_INICIO='16:20';/.test(html) &&
      /if\(!agora \|\| agora<VIGIA_ALM2_INICIO\) return/.test(html));
    check('domingo nao cobra (nao ha Day Care)', /if\(d\.getDay\(\)===0\) return/.test(html));
    check('nao cobra se o 2o horario FOI registrado',
      /var registrado=!!\(a2 && Object\.keys\(a2\)\.length\);/.test(html) &&
      /if\(registrado\)\{/.test(html));
    check('a trava do dia e a mesma da ponte, com transaction',
      /cobranca-almoco2\/'\+dia\)\.transaction/.test(html));
    check('se o Telegram falhar, a trava e solta para tentar de novo',
      /cobranca-almoco2\/'\+dia\)\.remove\(\)/.test(html));
    check('o texto e o que ela escreveu',
      /Não foi aberto o programa hoje no 2º horário do almoço\. Confirmar\./.test(html) &&
      /Amanda: ligar para o Day Care confirmando/.test(html));
    check('o vigia roda junto com o resumo, na entrada',
      /try\{ empVigiaAlmoco2\(\); \}catch\(e\)\{\}/.test(html));
    check('dia conferido e ninguem sem comer: fecha o dia com uma linha',
      /function empFecharDiaAlmoco\(dia\)/.test(html) &&
      /Todos comeram hoje\. Nenhum tutor a avisar\./.test(html));
    check('se alguem ficou sem comer, nao repete (o grupo ja soube na hora)',
      /var ninguem=!Object\.keys\(a2\)\.some\(function\(k\)\{ return a2\[k\]==='nao'; \}\);/.test(html));
    check('o fechamento tambem solta a trava se o Telegram falhar',
      (html.match(/cobranca-almoco2\/'\+dia\)\.remove\(\)/g) || []).length >= 2);
    check('duas pessoas entrando juntas nao mandam a mensagem em dobro',
      /avisos-telegram-atraso\/'\+hoje\)\.transaction\(function\(atual\)\{/.test(html) &&
      /if\(!res \|\| !res\.committed\) return;/.test(html));
    check('a leitura antiga (once + set) saiu do caminho do envio',
      !/avisos-telegram-atraso\/'\+hoje\)\.once\('value'\)/.test(html));
    check('o grupo recebe 2 dias; a tela enxerga 21',
      /var EMP_DIAS_GRUPO=2, EMP_DIAS_TELA=21;/.test(html));
    check('o que passou de anteontem nao vai para o grupo',
      /EMP_ANTIGO=todos\.filter\(function\(g\)\{ return recentes\.indexOf\(g\.dia\)<0; \}\)/.test(html));
    check('mas conta no rodape da mensagem, para ninguem achar que acabou',
      /Há ainda '\+nAntigo\+' de dias anteriores esperando decisão/.test(html));
    check('o que ficou para tras aparece na tela com decisao de gente',
      /Ficou para trás \('\+nAnt\+'\)/.test(html) && /function empDispensarDia\(dia,k\)/.test(html));
    check('"deixa para la" grava QUEM decidiu (nada some por decurso de prazo)',
      /dispensado:true[\s\S]{0,80}avisos-comida\/'\+dia\+'\/'\+k/.test(html) ||
      /quem:\(typeof quemSou[\s\S]{0,140}dispensado:true/.test(html));
    check('a data vira "Ontem"/"Anteontem" para quem le no celular',
      /function empComoFoi\(dia\)/.test(html) && /if\(d===1\) return 'Ontem';/.test(html));
    if (typeof ctx.empComoFoi === 'function') {
      const p = (n) => { const d = new Date(ctx.hojeISO() + 'T12:00:00'); d.setDate(d.getDate() - n);
        return d.toISOString().slice(0, 10); };
      check('ontem e ontem', ctx.empComoFoi(p(1)) === 'Ontem', ctx.empComoFoi(p(1)));
      check('anteontem e anteontem', ctx.empComoFoi(p(2)) === 'Anteontem', ctx.empComoFoi(p(2)));
      check('mais velho conta os dias', ctx.empComoFoi(p(9)) === 'Há 9 dias', ctx.empComoFoi(p(9)));
    }
    if (typeof ctx.empPendentesDoDia === 'function') {
      const a1 = {'kako__marcia': 'nao', 'bob__ana': 'comeu', 'zeca__lia': 'na', 'tina__rui': 'metade'};
      const a2 = {'kako__marcia': 'nao', 'tina__rui': ''};
      check('quem nao comeu nem no 2o entra na lista',
        ctx.empPendentesDoDia(a1, a2, {}).some(x => x.k === 'kako__marcia'));
      check('quem nao almoca ("na") NUNCA vira aviso ao tutor',
        !ctx.empPendentesDoDia(a1, a2, {}).some(x => x.k === 'zeca__lia'));
      check('tutor ja avisado sai da lista',
        !ctx.empPendentesDoDia(a1, a2, {'kako__marcia': {quem: 'Amanda'}}).some(x => x.k === 'kako__marcia'));
      check('"deixa para la" tambem tira da lista',
        !ctx.empPendentesDoDia(a1, a2, {'kako__marcia': {dispensado: true, quem: 'Amanda'}}).some(x => x.k === 'kako__marcia'));
    }
  }
  console.log('');

  console.log('Ponte do Telegram: o vigia roda sem o app aberto (28/ago):');
  {
    const fs2 = require('fs'), path2 = require('path');
    const gs = fs2.readFileSync(path2.join(__dirname, '..', 'integracao-telegram', 'Codigo.gs'), 'utf8');
    check('a ponte tem a funcao do acionador', /function vigiaAlmoco2\(\)/.test(gs));
    check('so age entre 16h20 e 17h20',
      /VIGIA_HORA_INICIO = '16:20'/.test(gs) && /hhmm < VIGIA_HORA_INICIO \|\| hhmm > VIGIA_HORA_FIM/.test(gs));
    check('usa o fuso de Sao Paulo (nao o do servidor do Google)',
      /'America\/Sao_Paulo'/.test(gs));
    check('domingo nao cobra', /if \(diaSemana === 7\) return;/.test(gs));
    check('divide a trava do dia com o app', /daycare\/cobranca-almoco2\/' \+ dia/.test(gs));
    check('so grava a trava se o Telegram aceitou', /if \(r && r\.ok\) \{[\s\S]{0,180}cobranca-almoco2/.test(gs));
    check('manda o texto dela quando ninguem registrou',
      /Não foi aberto o programa hoje no 2º horário do almoço\. Confirmar\./.test(gs));
    check('e fecha o dia quando todos comeram', /Todos comeram hoje\. Nenhum tutor a avisar\./.test(gs));
    check('tem funcao de teste de bancada', /function vigiaAlmoco2_TESTE\(\)/.test(gs));
    check('o passo a passo de ligar o acionador esta no arquivo',
      /A cada 15 minutos/.test(gs) && /Acionadores/.test(gs));
  }
  console.log('');

  console.log('Nascimento nao e data de operacao: 25 anos para tras (28/ago):');
  {
    check('o campo de nascimento tem regua propria', /var NASC_ANOS_MAX=25;/.test(html) &&
      /function nascMinISO\(\)/.test(html));
    check('e nao usa mais o min de 2015 das datas de operacao',
      !/nasc:this\.value\}\)" min="2015-01-01"/.test(html) &&
      /min="\$\{nascMinISO\(\)\}" max="\$\{zHojeISO\(\)\}"/.test(html));
    check('grava passando pela validacao, nao direto', /onchange="setPelNasc\(this\.value,this\)"/.test(html));
    check('os dois campos digitados avisam tambem',
      (html.match(/Essa data de nascimento não é possível/g) || []).length >= 3);
    if (typeof ctx.nascPlausivel === 'function') {
      const anoAtual = new Date(ctx.hojeISO() + 'T12:00:00').getFullYear();
      check('o Kako, de 01/09/2014, entra', ctx.nascPlausivel('2014-09-01'));
      check('o auluno de 2009 entra', ctx.nascPlausivel('2009-06-15'));
      check('20 anos atras entra', ctx.nascPlausivel((anoAtual - 20) + '-03-10'));
      check('25 anos atras ainda entra', ctx.nascPlausivel((anoAtual - 25) + '-01-01'));
      check('30 anos atras nao entra', !ctx.nascPlausivel((anoAtual - 30) + '-01-01'));
      check('ninguem nasce amanha', !ctx.nascPlausivel((anoAtual + 1) + '-01-01'));
      check('o ano 0026 (o erro que originou a trava) continua barrado', !ctx.nascPlausivel('0026-08-13'));
      check('data pela metade nao passa', !ctx.nascPlausivel('2014-09'));
    }
    check('as datas de OPERACAO continuam travadas em 2015',
      /var DATA_MIN='2015-01-01', DATA_MAX='2035-12-31';/.test(html));
  }
  console.log('');

  console.log('Quem faltou nao se examina, e foto nao nasce fora de ficha (28/ago):');
  {
    check('a tela do corpo agora sabe quem faltou', /function ckFaltou\(o\)/.test(html) &&
      /dcChamada\[dcKey\(o\.p\.n,o\.p\.tutor\)\]==='faltou'/.test(html));
    check('e le a chamada ao abrir (quem entra direto na atividade nao passou por ela)',
      /daycare\/chamada\/'\+dcDataKey\(\)\)\.once\('value'\)[\s\S]{0,300}CK_FALTA_TARDIA=/.test(html));
    check('quem faltou sai da conta de "faltam conferir"',
      /const lista=turma\.filter\(function\(o\)\{ return !ckFaltou\(o\); \}\);/.test(html));
    check('mas nao some: vai para o rodape', /NÃO VIERAM HOJE/.test(html));
    check('tem botao "Nao veio hoje" em cada card, em dois toques',
      /Confirmar: não veio/.test(html) && /Não veio hoje/.test(html) &&
      /if\(CK_FALTA_ARMADA!==k\)\{ CK_FALTA_ARMADA=k;/.test(html));
    check('falta marcada no check-out fica registrada como TARDIA',
      /daycare\/falta-tardia\/'\+dia\+'\/'\+k/.test(html) &&
      /origem:\(tardia\?'checkout-corpo':'checkin-corpo'\)/.test(html));
    check('e o rodape diz que era para ter sido no check-in da manha',
      /era para ter sido lançada no check-in da manhã/.test(html));
    check('se a gravacao falhar, a marcacao volta atras e avisa',
      /delete dcChamada\[k\]; delete CK_FALTA_TARDIA\[k\]; renderCheckin\(\);/.test(html));

    // foto em chave-fantasma (luna__shihtzu, jujuba__srd)
    check('chave de foto cujo "tutor" e raca e reconhecida como fantasma',
      /function fotoChaveFantasma\(k\)/.test(html) && /ehRacaLike\(t\)/.test(html));
    check('havendo UMA ficha com esse nome, a foto vai para ela',
      /function fotoFichaUnicaPorNome\(nome\)/.test(html) &&
      /return achados\.length===1 \? achados\[0\] : null;/.test(html));
    check('havendo duas, recusa (nome sozinho nao identifica ninguem)',
      /return Promise\.reject\(new Error\(msg\)\);/.test(html));
    check('e a recusa aparece na tela, nao so no log',
      /try\{ alert\(\(e&&e\.message\)\|\|'A foto não foi guardada\.'\); \}catch\(e2\)\{\}/.test(html));
    if (typeof ctx.fotoChaveFantasma === 'function') {
      check('luna__shihtzu e fantasma', ctx.fotoChaveFantasma('luna__shihtzu'));
      check('jujuba__srd e fantasma', ctx.fotoChaveFantasma('jujuba__srd'));
      check('luna__riva NAO e fantasma', !ctx.fotoChaveFantasma('luna__riva'));
      check('chave sem tutor e fantasma', ctx.fotoChaveFantasma('luna__'));
      check('cookie__yara continua valendo', !ctx.fotoChaveFantasma('cookie__yara'));
    }
  }
  console.log('');

  console.log('Galeria: ver TODAS as fotos e dizer de quem e cada uma (28/ago):');
  {
    check('a galeria existe e entra na tela de Relatorios',
      /function galeriaFotosHTML\(\)/.test(html) && /fotosConferirHTML\(\)\+galeriaFotosHTML\(\)/.test(html));
    check('agrupa por NOME: fichas e fotos soltas juntas',
      /function galDados\(\)/.test(html) && /g\.fichas\.push/.test(html) && /g\.fotos\.push/.test(html));
    check('a galeria diz em uma frase o que fazer ali',
      /<strong>O que fazer aqui:<\/strong>/.test(html));
    check('quem tem xara aparece marcado', /FILHOts com este nome/.test(html));
    check('da para dizer de quem e a foto solta', /function galAtribuir\(chaveFoto, chaveFicha\)/.test(html));
    check('e da para apagar em dois toques, dos dois lados',
      /function galApagar\(chave\)/.test(html) && /if\(GAL_ARMADO!==chave\)\{ GAL_ARMADO=chave;/.test(html));
    check('atribuir NAO apaga a original (erro nao perde nada)',
      /A original continua onde estava/.test(html));
    check('abre mostrando so o que precisa de decisao', /var GAL_SO_DECIDIR=true;/.test(html));
    check('mas da para ver todos os nomes', /Ver todos os '\+grupos\.length\+' nomes/.test(html));
    if (typeof ctx.galFotoNome === 'function') {
      check('o nome sai da chave', ctx.galFotoNome('luna__shihtzu') === 'luna');
      check('e tutor com __ nao confunde', ctx.galFotoNome('nelson mandela__lara') === 'nelson mandela');
    }
    // a suposicao que causou o problema nao pode voltar
    check('o semFotoDados ainda pula quem tem foto — POR ISSO a galeria existe',
      /if\(chaves\[k\]\) return;/.test(html));
    check('da para mandar um link que abre direto na tela',
      /var _h=String\(location\.hash\|\|''\)\.replace\('#',''\)\.trim\(\);/.test(html) &&
      /if\(_h && document\.getElementById\('v-'\+_h\)\) v=_h;/.test(html));
    check('e o link nao fura permissao (o filtro de paginas vem depois)',
      /v=_h;[\s\S]{0,120}if\(Array\.isArray\(u\.paginas\)\)\{/.test(html));
  }
  console.log('');

  console.log('A ficha do cliente nao e de quem passa (30/ago):');
  {
    check('a consultora entrou em quem edita ficha (e ela quem cadastra na recepcao)',
      /'editar-peludinho':\s*\['gestao','supervisor','diretoria','consultora'\]/.test(html));
    check('o monitor continua fora', !/'editar-peludinho':[^\]]*'monitor'/.test(html));
    check('existe porteiro na GRAVACAO, nao so na tela',
      /function pelCamposBarrados\(patch\)/.test(html) &&
      /var _barrados=pelCamposBarrados\(patch\);/.test(html));
    check('peso e foto continuam livres para todos',
      /var PEL_LIVRES=\{pesos:1, foto:1\};/.test(html));
    check('alergia continua com quem tem a capacidade',
      /podeAlergia && PEL_ALERGIA\[c\]/.test(html));
    check('a barrada deixa rastro na auditoria', /BARROU alteração de/.test(html));
    check('o campo Tutor 1 deixou de ser editavel por qualquer um',
      /Só a recepção, a Supervisão ou a Gestão mudam o nome do tutor/.test(html));
    check('e o onTutorPel barra por dentro (o campo readonly nao basta)',
      /function onTutorPel\(v\)\{[\s\S]{0,260}canEditPel\(\)\)\{/.test(html));
    if (typeof ctx.pelCamposBarrados === 'function' && typeof ctx.podePapel === 'function') {
      const papelAntes = ctx.document.body.dataset.role;
      ctx.document.body.dataset.role = 'monitor';   // o sandbox nasce como gestao
      // sem papel definido no sandbox, canEditPel() e falso: e o caso do monitor
      check('monitor: peso passa', ctx.pelCamposBarrados({pesos: [{data: '2026-08-30', kg: 9}]}).length === 0);
      check('monitor: foto passa', ctx.pelCamposBarrados({foto: 'data:...'}).length === 0);
      check('monitor: tutor NAO passa', ctx.pelCamposBarrados({tutor: 'Outro'}).length === 1);
      check('monitor: raca NAO passa', ctx.pelCamposBarrados({raca: 'Westie'}).length === 1);
      check('monitor: telefone NAO passa', ctx.pelCamposBarrados({tel: '31999'}).length === 1);
      check('monitor: mistura barra o que deve',
        JSON.stringify(ctx.pelCamposBarrados({pesos: [], tutor: 'x', foto: 'y'})) === '["tutor"]',
        JSON.stringify(ctx.pelCamposBarrados({pesos: [], tutor: 'x', foto: 'y'})));
      ctx.document.body.dataset.role = 'consultora';
      check('consultora: tutor PASSA (e ela quem corrige o cadastro)',
        ctx.pelCamposBarrados({tutor: 'Roberta Senna'}).length === 0);
      ctx.document.body.dataset.role = papelAntes;
    }
  }
  console.log('');

  console.log('Missao 31/ago: medicacao com dono, telegram, PDF que pagina, avulso, reposicao:');
  {
    // ---- 1. dose so grava com nome de gente ----
    check('dose agendada bloqueia assinatura generica',
      /function registrarDoseAgendadaGlobal[\s\S]{0,700}LOGIN_GENERICO\.test\(String\(_quem\)\.trim\(\)\)/.test(html));
    check('dose avulsa tambem', /const _qa=pessoaDoTurno\(\);[\s\S]{0,400}LOGIN_GENERICO\.test\(String\(_qa\)\.trim\(\)\)/.test(html));
    check('o bloqueio explica e pede o nome', /precisa do nome de uma pessoa, não do papel "Plantonista"/.test(html));

    // ---- 2. cada dose vira mensagem no grupo, com fila ----
    check('a dose dada chama o telegram', /medTgAvisarDose\(reg, it\.hospNome\|\|''\)/.test(html));
    check('a avulsa tambem', /medTgAvisarDose\(reg, currentHosp\.nome\|\|''\)/.test(html));
    check('falha NAO se perde: fila no banco', /auaulandia\/med-tg-fila/.test(html) &&
      /function medTgFilaTentar\(\)/.test(html));
    if (typeof ctx.medTgTexto === 'function') {
      const t = ctx.medTgTexto({nome: 'Pimobendan', q: '1', u: 'comprimido', horario: '18:00', quem: 'Jeisi'}, 'Toshi');
      check('a mensagem nomeia FILHOt, remedio, dose, horario e quem deu',
        /Toshi/.test(t) && /Pimobendan/.test(t) && /18:00/.test(t) && /Jeisi/.test(t), t);
      const av = ctx.medTgTexto({nome: 'Dipirona', q: '10', u: 'gotas', horario: '21:15', quem: 'Carol', avulso: true, motivo: 'febre'}, 'Harry');
      check('a avulsa diz que e avulsa e o motivo', /AVULSA/.test(av) && /febre/.test(av), av);
    }

    // ---- 3. estoque desce mesmo sem o modo marcado (caso Toshi) ----
    check('inicial numerico conta como estoque contavel',
      /est\.modo==='contavel' \|\| \(est\.modo==null && \(typeof est\.inicial==='number' \|\| typeof est\.restante==='number'\)\)/.test(html));

    // ---- 4. painel da gestao com o dia inteiro ----
    check('o painel recebe TODAS as doses, nao so as atrasadas',
      /renderMedAtrasadaGestora\(doses\);/.test(html) &&
      !/renderMedAtrasadaGestora\(doses\.filter/.test(html));
    check('mostra dadas, a dar e atrasadas', /Medicações de hoje/.test(html) &&
      /SEM REGISTRO — agir agora/.test(html) && /Ainda vão ser dadas/.test(html));

    // ---- 5. avulso na turma sem depender da planilha ----
    check('a turma le o lancamento direto do banco',
      /var DC_DASH_TURMA=\{reposicao:\[\], avulso:\[\], quando:0\};/.test(html) &&
      /\(\(DC_DASH_TURMA\[campo\]\|\|\[\]\)\.concat\(planDia\[campo\]\|\|\[\]\)\)/.test(html));
    check('a leitura roda em toda atividade (dcGarantirPlanilha)',
      /try\{ dcCarregarLancamentos\(\); \}catch/.test(html));
    check('a diaria avulsa tambem e relida fora da Chamada',
      /daycare\/avulsos\/'\+dcDataKey\(\)\)\.once\('value'\)[\s\S]{0,140}dcAvulsos=Object\.values/.test(html));
    check('o fetch da ponte tem tempo maximo (nunca mais pendurado)',
      /AbortController/.test(html) && /a ponte não respondeu em 12s/.test(html));
    check('nome lancado sem ficha ainda APARECE (entrada crua)',
      /cru:true/.test(html));

    // ---- 6. PDF pagina em vez de cortar ----
    if (typeof ctx.zPdfTextBlob === 'function') {
      const muitas = []; for (let i = 0; i < 120; i++) muitas.push({t: 'Linha ' + (i + 1), size: 11, gap: 4});
      const b = ctx.zPdfTextBlob(muitas);
      const bytes = blobBytes(b); const txt = String.fromCharCode.apply(null, Array.prototype.slice.call(bytes, 0, 4000));
      const count = (txt.match(/\/Count (\d+)/) || [])[1];
      check('120 linhas viram 3 paginas (nada e descartado)', count === '3', '/Count ' + count);
      let tj = 0; for (let i = 0; i < bytes.length - 2; i++) { if (bytes[i] === 84 && bytes[i + 1] === 106) tj++; }
      check('TODAS as 120 linhas estao no PDF', tj >= 120, tj + ' linhas desenhadas');
      const uma = ctx.zPdfTextBlob([{t: 'So uma', size: 11}]);
      check('uma linha continua dando UMA pagina', /\/Count 1/.test(String.fromCharCode.apply(null, Array.prototype.slice.call(blobBytes(uma), 0, 1200))));
    }

    // ---- 7. refeicoes fixas com horario ----
    check('cafe/almoco/jantar tem campo de horario', /ciRefs=\{cafe:\{on:false,hora:''/.test(html));
    check('o horario sai no texto por refeicao', /if\(r&&r\.on\) monta\(f\.n,r\.hora\|\|'',r\);/.test(html));
    check('a quantidade que veio sai na ficha e no PDF',
      /function ciMedVeioTxt\(it\)/.test(html) && (html.match(/ciMedVeioTxt\(it\)/g) || []).length >= 3);

    // ---- 8. o grupo recebe o check-in ----
    check('salvar o check-in manda resumo e PDF ao grupo',
      /function ciMandarTelegram\(\)/.test(html) &&
      /try\{ ciMandarTelegram\(\); \}catch/.test(html) &&
      /documentoBase64:b64/.test(html));
    check('falha do texto cai na fila (nunca silencio)', /medTgGuardar\('📋 CHECK-IN/.test(html));

    // ---- 9. o retrato do vigia ----
    check('o app grava o retrato das doses esperadas',
      /function medVigiaGravar\(\)/.test(html) && /auaulandia\/med-vigia\//.test(html));

    // ---- 10. reposicao: mensagens prontas ----
    if (typeof ctx.repMensagem === 'function') {
      const p = {n: 'Maya', tutor: 'Luciana Couto'};
      const pelExtraOrig = ctx.pelExtra;
      ctx.pelExtra = () => ({sexo: 'Fêmea'});
      const mc = ctx.repMensagem(p, 'credito', {qtd: 1, data: '2026-08-31', saldo: 3});
      check('credito: saudacao da casa + saldo + dia', /Oi, Luciana, como está\?/.test(mc) && /3 reposições/.test(mc) && /31\/08\/2026/.test(mc), mc);
      check('credito: flexiona pelo sexo da ficha', /a Maya/.test(mc), mc);
      const mu = ctx.repMensagem(p, 'uso', {saldo: 0});
      check('uso com saldo zero avisa que terminaram', /terminaram/.test(mu), mu);
      const m1 = ctx.repMensagem(p, 'uso', {saldo: 1});
      check('resta 1 no singular', /resta 1 reposição/.test(m1), m1);
      check('fecho dela: "controlar juntas"', /controlar juntas/.test(mc) && /controlar juntas/.test(mu));
      ctx.pelExtra = pelExtraOrig;
    }
    check('lançar e usar mostram o modal com a mensagem',
      /repMsgModal\('✅ Reposição lançada'/.test(html) && /repMsgModal\('✅ Reposição usada'/.test(html));
  }
  console.log('');

  console.log('Ponte v7: documento e vigia de medicacao (31/ago):');
  {
    const fs3 = require('fs'), path3 = require('path');
    const gs = fs3.readFileSync(path3.join(__dirname, '..', 'integracao-telegram', 'Codigo.gs'), 'utf8');
    check('a ponte sabe mandar ARQUIVO (sendDocument)',
      /function _mandarDocumento\(/.test(gs) && /sendDocument/.test(gs) &&
      /if \(d\.documentoBase64\) return _resp\(_mandarDocumento/.test(gs));
    check('vigia de medicacao existe e roda das 7h as 22h30',
      /function vigiaMedicacao\(\)/.test(gs) && /hhmm < '07:00' \|\| hhmm > '22:30'/.test(gs));
    check('le o retrato do app e o log do dia',
      /auaulandia\/med-vigia\//.test(gs) && /auaulandia\/medicacao-log\//.test(gs));
    check('cobra so depois de 30 min', /agoraMin - alvoMin < 30/.test(gs));
    check('uma trava por dose, gravada SO se o telegram aceitou',
      /daycare\/cobranca-medvigia\//.test(gs) && /if \(r && r\.ok\) _fbGravar\('daycare\/cobranca-medvigia/.test(gs));
    check('ninguem abriu o app = aviso proprio (silencio nao e "tudo bem")',
      /sem vigilância hoje/.test(gs) && /sem-app/.test(gs));
    check('tem teste de bancada', /function vigiaMedicacao_TESTE\(\)/.test(gs));
  }
  console.log('');

  console.log('Tela que abre vazia: uma lista de ganchos so, com as excecoes escritas (28/ago):');
  {
    check('irParaView passa pela mesma lista do clique no menu',
      /if\(typeof aoAbrirView==='function'\) aoAbrirView\(v\);/.test(html));
    check('as excecoes sao duas, e explicadas', /if\(v==='ficha' \|\| v==='daycare'\) return;/.test(html));
    check('a listinha paralela de tres telas sumiu',
      !/A lista COMPLETA de ganchos vive em aoAbrirView/.test(html));
    // toda tela do menu tem que ter titulo: sem ele irParaView quebra antes do gancho
    const doMenu = Array.from(html.matchAll(/<a data-v="([a-z]+)"/g)).map(m => m[1]);
    const NL = String.fromCharCode(10);
    const semTitulo = doMenu.filter(v => v !== 'sair'
      && html.indexOf(NL + '    ' + v + ":['") < 0
      && html.indexOf(',' + v + ":['") < 0
      && html.indexOf('{' + v + ":['") < 0);
    check('toda tela do menu tem titulo e dica', semTitulo.length === 0, JSON.stringify(semTitulo));
  }
  console.log('');

  console.log('Ícones do menu: nada fala mais que estrela (28/ago):');
  {
    // (a) todo data-icon="x" do arquivo tem uma chave x na função ic() — e (c) essa
    // chave gera SVG não vazio (chave desconhecida vira <svg> sem nenhum <path>).
    const chaves = Array.from(new Set(Array.from(html.matchAll(/data-icon="([a-z-]+)"/g)).map(m => m[1])));
    check('achei chaves de ícone no arquivo', chaves.length > 0, 'chaves=' + chaves.length);
    let semMapa = [], semPath = [];
    chaves.forEach(k => {
      const svg = ctx.ic(k);
      if (typeof svg !== 'string' || !svg.includes('<svg')) { semMapa.push(k); return; }
      if (!/<path/.test(svg)) semPath.push(k);
    });
    check('toda chave data-icon do arquivo existe em ic()', semMapa.length === 0, JSON.stringify(semMapa));
    check('toda chave data-icon gera pelo menos um <path> (SVG não vazio)', semPath.length === 0, JSON.stringify(semPath));

    // (b) nenhum item do menu (dentro de <nav id="nav">…</nav>) usa mais "star" —
    // o ícone mora num <span> FILHO do <a>, não em atributo do próprio <a>, então
    // o teste procura "star" em QUALQUER lugar do bloco do menu, não só na tag <a>.
    const navHtml = (html.match(/<nav class="nav" id="nav">[\s\S]*?<\/nav>/) || [''])[0];
    check('achei o bloco do menu (<nav id="nav">) no arquivo', navHtml.length > 0);
    const linksComStar = Array.from(navHtml.matchAll(/data-icon="star"/g));
    check('nenhum <a do menu usa data-icon="star"', linksComStar.length === 0, linksComStar.length + ' ocorrência(s)');
    // e "star" nem aparece mais em NENHUM lugar do arquivo (nav ou role-note)
    const starNoArquivo = Array.from(html.matchAll(/data-icon="star"/g));
    check('data-icon="star" sumiu do arquivo inteiro', starNoArquivo.length === 0, starNoArquivo.length + ' ocorrência(s)');

    // ícones novos deste redesenho — cada um precisa existir e desenhar algo
    const NOVOS = ['clipboard', 'stethoscope', 'bed', 'bag', 'bell', 'id-card', 'login', 'door-out',
      'dollar', 'dollar-alert', 'message', 'bowl', 'refresh', 'list-check', 'shield', 'drop', 'scale',
      'card', 'ball', 'settings', 'chart', 'file-text', 'info', 'alert'];
    const faltando = NOVOS.filter(k => !/<path/.test(ctx.ic(k) || ''));
    check('os ' + NOVOS.length + ' ícones novos desenham SVG', faltando.length === 0, JSON.stringify(faltando));
  }
  console.log('');

  // ============================================================================
  // FALTA AUTOMÁTICA DAS 12h — o dia fecha sem ninguém abrir tela (29/ago/2026)
  // ----------------------------------------------------------------------------
  // Até 28/ago quem gravava a falta era o "Check-in do corpo": se ninguém abrisse
  // AQUELA tela depois do meio-dia, o dia ficava sem falta nenhuma. Regra da casa:
  // aviso que depende de abrir a tela não é aviso. Aqui a função real é chamada
  // contra um banco de mentira, com o relógio na mão.
  console.log('Falta automática das 12h: fecha o dia sem depender da tela (29/ago):');
  {
    // -- o texto, para o padrão do almoço não se perder num refactor --
    check('a trava do dia mora no banco, com transaction',
      /function faltaAutoTrava\(dia\)\{ return 'daycare\/falta-automatica\/'\+dia; \}/.test(html) &&
      /DB\.ref\(faltaAutoTrava\(hoje\)\)\.transaction\(function\(atual\)\{/.test(html));
    check('a trava fica FORA da chamada (senão o resumo do dia conta errado)',
      !/daycare\/chamada\/'\+hoje\+'\/_fechado/.test(html) &&
      /daycare\/falta-automatica\//.test(html));
    check('o gancho de entrada é o mesmo do almoço (qualquer tela)',
      /try\{ aplicarFaltaAutomatica\(\); \}catch\(e\)\{\}(?: \/\* silencioso de prop[^*]*\*\/)?\n    \}, 6000\); \}catch\(e\)\{\}/.test(html));
    check('e existe o temporizador de 30 s para quem já estava logado',
      /setInterval\(function\(\)\{ try\{ aplicarFaltaAutomatica\(\); \}catch\(e\)\{\}(?: \/\* silencioso de prop[^*]*\*\/)? \}, 30000\);/.test(html));
    check('a turma é sempre a de HOJE, não a da aba aberta',
      /function turmaDeHoje\(\)\{/.test(html) &&
      /try\{ dcDia=HOJE_DIA; return turmaDoDia\(\); \}/.test(html) &&
      !/dcDia!==HOJE_DIA/.test(html));
    check('sábado e domingo não fecham dia (não há Day Care)',
      /if\(ds===0\|\|ds===6\) return Promise\.resolve\(\);/.test(html));
    check('a gravação que falha deixa rastro e solta a trava',
      /_logFalhaGrav\('falta automática das '\+CK_HORA_FALTA\+'h', e\)/.test(html) &&
      /_logFalhaGrav\('soltar a trava da falta automática', e2\)/.test(html));

    // -------- prova de comportamento: a função real, com relógio de mentira --------
    const DIA = '2026-08-27';                       // uma quinta-feira
    const bkpF = {
      Date: ctx.Date, turmaDoDia: ctx.turmaDoDia, PELUDINHOS: ctx.PELUDINHOS,
      pelNome: ctx.pelNome, ehMoradorZeluz: ctx.ehMoradorZeluz,
      faltouHoje: ctx.faltouHoje, audit: ctx.audit, quemSou: ctx.quemSou,
      horaAgora: ctx.horaAgora,
    };
    const RealDate = ctx.Date;
    // Relógio na mão: a hora do dia é o gatilho, e dcDataKey() lê o mesmo Date.
    const porRelogio = (iso) => {
      function FakeDate(...a) { return a.length ? new RealDate(...a) : new RealDate(iso); }
      FakeDate.prototype = RealDate.prototype;
      FakeDate.now = () => new RealDate(iso).getTime();
      FakeDate.parse = RealDate.parse; FakeDate.UTC = RealDate.UTC;
      ctx.Date = FakeDate;
    };
    // Banco de mentira: guarda o que foi escrito e responde o que mandarmos.
    const feito = { escritas: [], travaNoBanco: null, transacoes: 0, leituraDaTravaMente: false };
    const auditF = [];
    const fazBanco = (dados) => ({
      ref(p) {
        return {
          once() {
            feito.escritas.push({ o: 'once', p });
            if (p.indexOf('daycare/falta-automatica/') === 0) {
              // leituraDaTravaMente = a corrida real: dois celulares leem "sem trava" no
              // mesmo segundo e um deles grava primeiro. Quem chega depois só descobre
              // no transaction — que é justamente o que este banco de mentira testa.
              const v = feito.leituraDaTravaMente ? null : feito.travaNoBanco;
              return Promise.resolve({ val: () => v });
            }
            return Promise.resolve({ val: () => (dados[p] || null) });
          },
          transaction(fn) {
            feito.transacoes++;
            const novo = fn(feito.travaNoBanco);
            if (novo === undefined) return Promise.resolve({ committed: false });
            feito.travaNoBanco = novo;
            feito.escritas.push({ o: 'trava', p, v: novo });
            return Promise.resolve({ committed: true });
          },
          update(v) { feito.escritas.push({ o: 'update', p, v }); return Promise.resolve(); },
          remove() { feito.travaNoBanco = null; feito.escritas.push({ o: 'remove', p }); return Promise.resolve(); },
        };
      },
    });
    const zerarF = () => { feito.escritas.length = 0; feito.transacoes = 0; auditF.length = 0; };
    const esperarF = (ms) => new Promise((r) => setTimeout(r, ms));
    const TURMA = [
      { p: { n: 'Camus', tutor: 'Sophia' } },
      { p: { n: 'Luna', tutor: 'Carolina' } },
      { p: { n: 'Toddy', tutor: 'Ana' } },
    ];
    const chaveDe = (i) => ctx.dcKey(TURMA[i].p.n, TURMA[i].p.tutor);

    vm.runInContext('__bkpF = { DB: DB };', ctx);
    const papelAntesF = ctx.__ROLE__ ? ctx.__ROLE__.role : null;
    try {
      ctx.document.body.dataset.role = 'gestao';
      if (ctx.__ROLE__) ctx.__ROLE__.role = 'gestao';
      ctx.turmaDoDia = () => TURMA;
      ctx.PELUDINHOS = TURMA.map((o) => o.p);      // sem cadastro carregado a função nem começa
      ctx.ehMoradorZeluz = () => false;
      ctx.faltouHoje = () => false;
      ctx.quemSou = () => 'Márcia';
      ctx.horaAgora = () => '12:05';
      ctx.audit = (a, d, m) => auditF.push({ acao: String(a || ''), detalhe: String(d == null ? '' : d), meta: m || {} });

      // 2 dos 3 passaram pelo check-in de entrada; o 3º (Toddy) não.
      const dados = {};
      dados['daycare/checkin-corpo/' + DIA] = {};
      dados['daycare/checkin-corpo/' + DIA][chaveDe(0)] = { ok: 1 };
      dados['daycare/checkin-corpo/' + DIA][chaveDe(1)] = { ok: 1 };
      dados['daycare/chamada/' + DIA] = {};
      ctx.__bancoF = fazBanco(dados);

      // ---- (a) ANTES do corte: 11h50, ninguém vira falta ----
      porRelogio('2026-08-27T11:50:00');
      vm.runInContext('DB = __bancoF; _faltaAutoFeita = "";', ctx);
      zerarF();
      await ctx.aplicarFaltaAutomatica();
      await esperarF(30);
      check('antes das 12h não grava nada (ainda dá tempo de chegar)',
        feito.escritas.length === 0 && feito.travaNoBanco === null,
        JSON.stringify(feito.escritas));

      // ---- (b) DEPOIS do corte: 12h05, o 3º vira falta, com rastro ----
      porRelogio('2026-08-27T12:05:00');
      vm.runInContext('_faltaAutoFeita = "";', ctx);
      zerarF();
      await ctx.aplicarFaltaAutomatica();
      await esperarF(30);
      const updates = feito.escritas.filter((e) => e.o === 'update');
      const gravou = updates.length === 1 && Object.keys(updates[0].v).length === 1 &&
        updates[0].v[chaveDe(2)] === 'faltou' && updates[0].p === 'daycare/chamada/' + DIA;
      check('passou das 12h: grava 1 falta (só quem não fez check-in)',
        gravou, JSON.stringify(updates));
      check('e deixa rastro na auditoria, assinado pelo sistema',
        auditF.some((a) => a.acao === 'falta-automatica' && /Toddy/.test(a.detalhe) && a.meta.assinou === 'sistema'),
        JSON.stringify(auditF));
      check('a trava do dia ficou gravada no banco',
        !!feito.travaNoBanco && feito.travaNoBanco.quantos === 1,
        JSON.stringify(feito.travaNoBanco));

      // ---- (c) RODAR DE NOVO não duplica — nem no mesmo aparelho, nem em outro ----
      zerarF();
      await ctx.aplicarFaltaAutomatica();           // mesmo aparelho (trava na memória)
      await esperarF(30);
      check('rodar de novo no mesmo aparelho não grava nada',
        feito.escritas.filter((e) => e.o === 'update').length === 0,
        JSON.stringify(feito.escritas));

      vm.runInContext('_faltaAutoFeita = "";', ctx);  // outro celular: memória zerada, trava é a do banco
      zerarF();
      await ctx.aplicarFaltaAutomatica();
      await esperarF(30);
      check('outro aparelho vê a trava do banco e também não grava',
        feito.escritas.filter((e) => e.o === 'update').length === 0 && feito.transacoes === 0,
        JSON.stringify(feito.escritas));

      // ---- (c2) a tela pode estar mostrando OUTRO dia da semana: fecha assim mesmo ----
      // Era exatamente isto que travava antes: quem abrisse a aba de outro dia impedia o
      // fechamento de hoje, porque a função devolvia cedo em `dcDia !== HOJE_DIA`.
      const outroDia = vm.runInContext('ORDEM_DIAS.filter(function(d){ return d!==HOJE_DIA; })[0]', ctx);
      feito.travaNoBanco = null;
      vm.runInContext('_faltaAutoFeita = ""; __diaAntes = dcDia; dcDia = "' + outroDia + '";', ctx);
      zerarF();
      await ctx.aplicarFaltaAutomatica();
      await esperarF(30);
      check('com a tela em outro dia da semana, o dia de hoje fecha do mesmo jeito',
        feito.escritas.filter((e) => e.o === 'update').length === 1,
        JSON.stringify(feito.escritas.map((e) => e.o)));
      check('e a aba do usuário volta para o dia que ele estava vendo',
        vm.runInContext('dcDia', ctx) === outroDia, vm.runInContext('dcDia', ctx));
      vm.runInContext('dcDia = __diaAntes;', ctx);

      // ---- (c3) dois celulares no mesmo segundo: só um fecha o dia ----
      // A leitura da trava mente (diz "sem trava") — é o transaction que segura.
      feito.travaNoBanco = { ts: 1, por: 'outro celular', hora: '12:01', quantos: 1 };
      feito.leituraDaTravaMente = true;
      vm.runInContext('_faltaAutoFeita = "";', ctx);
      zerarF();
      await ctx.aplicarFaltaAutomatica();
      await esperarF(30);
      check('o transaction segura a corrida: quem chega depois não grava a falta em dobro',
        feito.transacoes === 1 && feito.escritas.filter((e) => e.o === 'update').length === 0,
        JSON.stringify(feito.escritas.map((e) => e.o)));
      check('e a trava do outro celular fica intacta',
        feito.travaNoBanco && feito.travaNoBanco.por === 'outro celular',
        JSON.stringify(feito.travaNoBanco));
      feito.leituraDaTravaMente = false;

      // ---- (d) o tutor nunca fecha o dia da casa ----
      ctx.document.body.dataset.role = 'tutor';
      feito.travaNoBanco = null;
      vm.runInContext('_faltaAutoFeita = "";', ctx);
      zerarF();
      await ctx.aplicarFaltaAutomatica();
      await esperarF(30);
      check('tutor não fecha o dia (nem lê o banco)', feito.escritas.length === 0);
      ctx.document.body.dataset.role = 'gestao';

      // ---- (e) sábado não fecha dia: o Day Care é de segunda a sexta ----
      porRelogio('2026-08-29T12:05:00');            // 29/ago/2026 é sábado
      vm.runInContext('_faltaAutoFeita = "";', ctx);
      zerarF();
      await ctx.aplicarFaltaAutomatica();
      await esperarF(30);
      check('sábado ao meio-dia não marca a turma de segunda como falta',
        feito.escritas.length === 0, JSON.stringify(feito.escritas));

      // ---- (f) se a gravação falhar, a trava é solta e sobra rastro ----
      porRelogio('2026-08-27T12:05:00');
      feito.travaNoBanco = null;
      vm.runInContext('_faltaAutoFeita = "";', ctx);
      zerarF();
      const bancoRuim = fazBanco(dados);
      ctx.__bancoF = { ref(p) {
        const r = bancoRuim.ref(p);
        if (p.indexOf('daycare/chamada/') === 0) r.update = () => Promise.reject(new Error('permissão negada'));
        return r;
      } };
      vm.runInContext('DB = __bancoF;', ctx);
      await ctx.aplicarFaltaAutomatica();
      await esperarF(30);
      check('gravação que falha vira rastro (não some calada)',
        auditF.some((a) => a.acao === 'gravacao-FALHOU' && /falta autom/.test(a.detalhe)),
        JSON.stringify(auditF));
      check('e a trava é solta, para o próximo a entrar tentar de novo',
        feito.travaNoBanco === null && feito.escritas.some((e) => e.o === 'remove'),
        JSON.stringify(feito.escritas.map((e) => e.o)));
    } finally {
      ctx.Date = bkpF.Date; ctx.turmaDoDia = bkpF.turmaDoDia; ctx.PELUDINHOS = bkpF.PELUDINHOS;
      ctx.pelNome = bkpF.pelNome; ctx.ehMoradorZeluz = bkpF.ehMoradorZeluz;
      ctx.faltouHoje = bkpF.faltouHoje; ctx.audit = bkpF.audit; ctx.quemSou = bkpF.quemSou;
      ctx.horaAgora = bkpF.horaAgora;
      if (ctx.__ROLE__ && papelAntesF !== null) ctx.__ROLE__.role = papelAntesF;
      vm.runInContext('DB = __bkpF.DB; _faltaAutoFeita = "";', ctx);
    }
  }
  console.log('');
  // ============================================================================
  // A FOTOGRAFIA DA TURMA — quem ERA esperado hoje fica registrado (30/ago/2026)
  // ----------------------------------------------------------------------------
  // Retaguarda da falta das 12h. A turma é calculada dentro do aparelho: sem ninguém
  // abrir o app, não sobra registro nenhum de quem deveria ter vindo — nem para
  // conferir depois, nem para a retaguarda que roda fora do app cobrar o fechamento.
  // De manhã o primeiro aparelho grava daycare/turma/<dia>, uma vez só, com transaction.
  console.log('A fotografia da turma do dia (retaguarda da falta):');
  {
    check('o caminho da fotografia é daycare/turma/<dia>',
      /function turmaFotoTrava\(dia\)\{ return 'daycare\/turma\/'\+dia; \}/.test(html));
    check('grava com transaction (dois celulares não escrevem em dobro)',
      /DB\.ref\(turmaFotoTrava\(hoje\)\)\.transaction\(function\(atual\)\{/.test(html));
    check('tem temporizador próprio, como a falta',
      /setInterval\(function\(\)\{ try\{ gravarTurmaDoDia\(\); \}catch\(e\)\{\}(?: \/\* silencioso de prop[^*]*\*\/)? \}, 30000\);/.test(html));
    check('e roda no mesmo gancho de entrada da falta (qualquer tela)',
      /try\{ gravarTurmaDoDia\(\); \}catch\(e\)\{\}[\s\S]{0,400}try\{ aplicarFaltaAutomatica\(\); \}catch\(e\)\{\}(?: \/\* silencioso de prop[^*]*\*\/)?\n    \}, 6000\); \}catch\(e\)\{\}/.test(html));
    check('sábado e domingo não fotografam turma',
      /function gravarTurmaDoDia\(\)\{[\s\S]{0,700}if\(ds===0\|\|ds===6\) return Promise\.resolve\(\);/.test(html));
    check('a falha deixa rastro (não some calada)',
      /_logFalhaGrav\('a fotografia da turma do dia', e\)/.test(html) &&
      /_logFalhaGrav\('ler a fotografia da turma do dia', e\)/.test(html));

    // -------- prova de comportamento: a função real, com relógio de mentira --------
    const DIA_T = '2026-08-27';                   // uma quinta-feira
    const bkpT = {
      Date: ctx.Date, turmaDoDia: ctx.turmaDoDia, PELUDINHOS: ctx.PELUDINHOS,
      audit: ctx.audit, quemSou: ctx.quemSou, horaAgora: ctx.horaAgora,
    };
    const RealDateT = ctx.Date;
    const porRelogioT = (iso) => {
      function FakeDate(...a) { return a.length ? new RealDateT(...a) : new RealDateT(iso); }
      FakeDate.prototype = RealDateT.prototype;
      FakeDate.now = () => new RealDateT(iso).getTime();
      FakeDate.parse = RealDateT.parse; FakeDate.UTC = RealDateT.UTC;
      ctx.Date = FakeDate;
    };
    // Banco de mentira: só o nó da fotografia responde alguma coisa.
    const st = { escritas: [], foto: null, transacoes: 0 };
    const auditT = [];
    const bancoT = { ref(p) { return {
      once() {
        st.escritas.push({ o: 'once', p });
        return Promise.resolve({ val: () => (p.indexOf('daycare/turma/') === 0 ? st.foto : null) });
      },
      transaction(fn) {
        st.transacoes++;
        const novo = fn(st.foto);
        if (novo === undefined) return Promise.resolve({ committed: false });
        st.foto = novo; st.escritas.push({ o: 'foto', p, v: novo });
        return Promise.resolve({ committed: true });
      },
      update(v) { st.escritas.push({ o: 'update', p, v }); return Promise.resolve(); },
      remove() { st.escritas.push({ o: 'remove', p }); return Promise.resolve(); },
    }; } };
    const TURMA_T = [
      { p: { n: 'Camus', tutor: 'Sophia' } },
      { p: { n: 'Luna', tutor: 'Carolina' } },
      { p: { n: 'Toddy', tutor: 'Ana' } },
    ];
    const zerarT = () => { st.escritas.length = 0; st.transacoes = 0; auditT.length = 0; };
    const esperarT = (ms) => new Promise((r) => setTimeout(r, ms));

    vm.runInContext('__bkpT = { DB: DB };', ctx);
    const papelAntesT = ctx.__ROLE__ ? ctx.__ROLE__.role : null;
    try {
      ctx.document.body.dataset.role = 'gestao';
      if (ctx.__ROLE__) ctx.__ROLE__.role = 'gestao';
      ctx.turmaDoDia = () => TURMA_T;
      ctx.PELUDINHOS = TURMA_T.map((o) => o.p);
      ctx.quemSou = () => 'Márcia';
      ctx.horaAgora = () => '07:10';
      ctx.audit = (a, d, m) => auditT.push({ acao: String(a || ''), detalhe: String(d == null ? '' : d), meta: m || {} });
      ctx.__bancoT = bancoT;

      // ---- (a) antes das 7h: a turma ainda não é notícia ----
      porRelogioT('2026-08-27T06:30:00');
      vm.runInContext('DB = __bancoT; _turmaGravada = "";', ctx);
      zerarT();
      await ctx.gravarTurmaDoDia();
      await esperarT(30);
      check('antes das 7h não grava nada', st.escritas.length === 0 && st.foto === null,
        JSON.stringify(st.escritas));

      // ---- (b) 07h10: grava a turma inteira, uma vez ----
      porRelogioT('2026-08-27T07:10:00');
      vm.runInContext('_turmaGravada = "";', ctx);
      zerarT();
      await ctx.gravarTurmaDoDia();
      await esperarT(30);
      const chavesT = TURMA_T.map((o) => ctx.dcKey(o.p.n, o.p.tutor));
      check('às 7h grava a turma do dia, com as 3 chaves',
        !!st.foto && st.foto.quantos === 3 && JSON.stringify(st.foto.chaves) === JSON.stringify(chavesT),
        JSON.stringify(st.foto));
      check('grava no caminho daycare/turma/<dia>',
        st.escritas.some((e) => e.o === 'foto' && e.p === 'daycare/turma/' + DIA_T),
        JSON.stringify(st.escritas.map((e) => e.p)));
      check('e deixa rastro na auditoria, assinado pelo sistema',
        auditT.some((a) => a.acao === 'turma-do-dia' && a.meta.assinou === 'sistema'),
        JSON.stringify(auditT));
      check('a fotografia não toca na chamada (não marca falta nenhuma)',
        !st.escritas.some((e) => String(e.p).indexOf('daycare/chamada/') === 0),
        JSON.stringify(st.escritas.map((e) => e.p)));

      // ---- (c) não regrava: nem o mesmo aparelho, nem outro ----
      zerarT();
      await ctx.gravarTurmaDoDia();
      await esperarT(30);
      check('rodar de novo no mesmo aparelho não grava nada', st.escritas.length === 0,
        JSON.stringify(st.escritas));

      vm.runInContext('_turmaGravada = "";', ctx);   // outro celular: memória zerada
      zerarT();
      await ctx.gravarTurmaDoDia();
      await esperarT(30);
      check('outro aparelho vê a fotografia no banco e não regrava',
        st.transacoes === 0 && !st.escritas.some((e) => e.o === 'foto'),
        JSON.stringify(st.escritas.map((e) => e.o)));

      // ---- (c2) dois celulares no mesmo segundo: o transaction segura ----
      const fotoAntes = st.foto;
      const bancoMente = { ref(p) {
        const r = bancoT.ref(p);
        if (p.indexOf('daycare/turma/') === 0) r.once = () => Promise.resolve({ val: () => null });
        return r;
      } };
      ctx.__bancoT2 = bancoMente;
      vm.runInContext('DB = __bancoT2; _turmaGravada = "";', ctx);
      zerarT();
      await ctx.gravarTurmaDoDia();
      await esperarT(30);
      check('a leitura mentindo "sem fotografia" não gera fotografia em dobro',
        st.transacoes === 1 && !st.escritas.some((e) => e.o === 'foto') && st.foto === fotoAntes,
        JSON.stringify(st.escritas.map((e) => e.o)));
      vm.runInContext('DB = __bancoT;', ctx);

      // ---- (d) fim de semana não fotografa ----
      st.foto = null;
      porRelogioT('2026-08-29T08:00:00');            // 29/ago/2026 é sábado
      vm.runInContext('_turmaGravada = "";', ctx);
      zerarT();
      await ctx.gravarTurmaDoDia();
      await esperarT(30);
      check('sábado não grava turma (não há Day Care)',
        st.escritas.length === 0 && st.foto === null, JSON.stringify(st.escritas));

      porRelogioT('2026-08-30T08:00:00');            // domingo
      vm.runInContext('_turmaGravada = "";', ctx);
      zerarT();
      await ctx.gravarTurmaDoDia();
      await esperarT(30);
      check('domingo também não', st.escritas.length === 0 && st.foto === null,
        JSON.stringify(st.escritas));

      // ---- (e) o tutor não fotografa a turma da casa ----
      porRelogioT('2026-08-27T07:10:00');
      ctx.document.body.dataset.role = 'tutor';
      vm.runInContext('_turmaGravada = "";', ctx);
      zerarT();
      await ctx.gravarTurmaDoDia();
      await esperarT(30);
      check('tutor não grava a turma (nem lê o banco)', st.escritas.length === 0,
        JSON.stringify(st.escritas));
      ctx.document.body.dataset.role = 'gestao';

      // ---- (f) cadastro ainda carregando não vira fotografia em branco ----
      ctx.PELUDINHOS = [];
      vm.runInContext('_turmaGravada = "";', ctx);
      zerarT();
      await ctx.gravarTurmaDoDia();
      await esperarT(30);
      check('cadastro ainda carregando não vira fotografia vazia',
        st.escritas.length === 0 && st.foto === null, JSON.stringify(st.escritas));
      ctx.PELUDINHOS = TURMA_T.map((o) => o.p);

      // ---- (g) turma vazia com cadastro carregado: não grava, tenta de novo depois ----
      ctx.turmaDoDia = () => [];
      vm.runInContext('_turmaGravada = "";', ctx);
      zerarT();
      await ctx.gravarTurmaDoDia();
      await esperarT(30);
      check('turma vazia não vira fotografia (o próximo aparelho tenta de novo)',
        st.foto === null && !st.escritas.some((e) => e.o === 'foto'),
        JSON.stringify(st.escritas.map((e) => e.o)));
      ctx.turmaDoDia = () => TURMA_T;
    } finally {
      ctx.Date = bkpT.Date; ctx.turmaDoDia = bkpT.turmaDoDia; ctx.PELUDINHOS = bkpT.PELUDINHOS;
      ctx.audit = bkpT.audit; ctx.quemSou = bkpT.quemSou; ctx.horaAgora = bkpT.horaAgora;
      if (ctx.__ROLE__ && papelAntesT !== null) ctx.__ROLE__.role = papelAntesT;
      vm.runInContext('DB = __bkpT.DB; _turmaGravada = "";', ctx);
    }
  }
  console.log('');
  // ============================================================================
  // CATCH VAZIO: OU FALA, OU DIZ POR QUE CALA (LOTE B — 30/ago/2026)
  // ----------------------------------------------------------------------------
  // O inventário da auditoria de 28/ago contou centenas de `catch` vazios. Nem todos são
  // defeito: perder o foco de um campo ou não conseguir redesenhar uma lista realmente não
  // pode derrubar quem chamou. O que não pode existir é silêncio SEM MOTIVO ESCRITO —
  // porque aí ninguém sabe, ao ler, se aquilo foi decisão ou esquecimento.
  //
  // A regra que passa a valer:
  //   - banco: LER que falha vai para o console com rótulo (_logLeituraFalhou);
  //            GRAVAR que falha vai para a auditoria (_logFalhaGrav). Nenhum dos dois
  //            continua sendo `catch` vazio.
  //   - o resto: pode continuar calado, mas com o motivo escrito ao lado, na forma
  //            /* silencioso de propósito: ... */
  console.log('Catch vazio: ou fala, ou diz por que cala (LOTE B):');
  {
    check('existe o registrador de leitura que falha', /function _logLeituraFalhou\(oque,e\)\{/.test(html));
    check('e ele NÃO enche a auditoria (leitura se resolve relendo)',
      /_logLeituraFalhou[\s\S]{0,220}console\.warn/.test(html) &&
      !/function _logLeituraFalhou\(oque,e\)\{[\s\S]{0,220}audit\(/.test(html));
    check('gravação que falha continua indo para a auditoria', /function _logFalhaGrav\(oque,e\)\{/.test(html));

    // ---- o detector: nenhum catch vazio pode ficar sem motivo escrito ----------------
    // Aceita o comentário na MESMA LINHA (antes ou depois do catch) ou na LINHA ANTERIOR.
    const MARCA = /silencioso de prop[óo]sito/;
    const RE = /catch\s*(?:\([^)]*\))?\s*\{\s*\}/g;
    const mudos = [];
    const linhasComCatchVazio = [];   // toda linha que tem catch vazio, com motivo ou sem
    let achado, total = 0;
    while ((achado = RE.exec(html)) !== null) {
      total++;
      const fim = achado.index + achado[0].length;
      const iniLinha = html.lastIndexOf('\n', achado.index) + 1;
      const fimLinha = html.indexOf('\n', fim);
      const restoDaLinha = html.slice(fim, fimLinha < 0 ? html.length : fimLinha);
      const antesNaLinha = html.slice(iniLinha, achado.index);
      const fimAnterior = iniLinha - 1;
      const iniAnterior = html.lastIndexOf('\n', fimAnterior - 1) + 1;
      const linhaAnterior = fimAnterior > 0 ? html.slice(iniAnterior, fimAnterior) : '';
      // Só a forma `.catch(...)` é promessa: é assim que a recusa do Firebase chega.
      // Um `try{...}catch(e){}` na mesma linha é outra coisa (costuma ser localStorage).
      if (html[achado.index - 1] === String.fromCharCode(46)) {
        linhasComCatchVazio.push(html.slice(iniLinha, fimLinha < 0 ? html.length : fimLinha));
      }
      if (MARCA.test(restoDaLinha) || MARCA.test(antesNaLinha) || MARCA.test(linhaAnterior)) continue;
      mudos.push(html.slice(iniLinha, fim).trim().slice(-110));
    }
    check('há catch vazio no arquivo (o detector está mesmo olhando)', total > 100, String(total));
    check('ZERO catch vazio sem comentário de propósito', mudos.length === 0,
      mudos.length + ' sem motivo — o primeiro: ' + (mudos[0] || ''));

    // ---- e o banco não voltou a calar ------------------------------------------------
    // Um `.set(...)/.update(...)` do Firebase com `catch` vazio é o defeito que mais mordeu
    // esta casa: a tela diz "salvo" e o dado não foi. A conferência é por LINHA — regex que
    // atravessa o arquivo procurando o `.catch` lá adiante volta com falso alarme (já voltou:
    // um `MED_AGENDA_TODOS.push` de lista casava com um `.catch` de outra instrução).
    const gravMudas = [];
    for (const l of linhasComCatchVazio) {
      if (/DB\.ref\s*\(/.test(l) && /\.(set|update|remove|push|transaction)\s*\(/.test(l)) gravMudas.push(l);
    }
    check('nenhuma gravação no banco com catch vazio', gravMudas.length === 0,
      gravMudas.length + ' — a primeira: ' + (gravMudas[0] || '').slice(0, 140));

    check('as leituras do banco ganharam rótulo no console',
      (html.match(/_logLeituraFalhou\(/g) || []).length >= 20,
      String((html.match(/_logLeituraFalhou\(/g) || []).length));
  }
  console.log('');

  // ============================================================================
  // AS GRAVAÇÕES MUDAS — nenhuma escrita no Firebase morre em silêncio (29/ago/2026)
  // ----------------------------------------------------------------------------
  // A auditoria de 28/ago (02-gordura-codigo.md, seção 6) achou 10 blocos try/catch
  // VAZIOS em volta de uma gravação no Firebase: o app tentava salvar, falhava, e
  // ninguém — nem a tela, nem a auditoria — ficava sabendo. O teste refaz a MESMA
  // medição do relatório, agora exigindo zero.
  console.log('Gravações mudas: escrita no Firebase que falha deixa rastro (29/ago):');
  {
    // -- refaz a medição do relatório: try{...}catch(){} vazio com .ref( + escrita --
    const catchesVazios = (texto) => {
      const achados = [];
      const re = /catch\s*(\([^)]*\))?\s*\{\s*\}/g;
      let m;
      while ((m = re.exec(texto)) !== null) {
        const j = texto.lastIndexOf('}', m.index);
        if (j < 0) continue;
        let prof = 1, k = j - 1;
        while (k >= 0 && prof > 0) {
          const c = texto[k];
          if (c === '}') prof++; else if (c === '{') prof--;
          k--;
        }
        if (prof !== 0) continue;
        const ini = k + 1;
        if (texto.slice(Math.max(0, ini - 12), ini + 1).indexOf('try') < 0) continue;
        const corpo = texto.slice(ini, j);
        if (corpo.indexOf('.ref(') < 0) continue;
        if (!/\.(set|update|push|remove)\(/.test(corpo)) continue;
        achados.push(texto.slice(0, ini).split('\n').length);
      }
      return achados;
    };
    const mudas = catchesVazios(html);
    check('nenhuma gravação no Firebase fica dentro de try/catch vazio (eram 10)',
      mudas.length === 0, 'ainda mudas nas linhas: ' + JSON.stringify(mudas));

    // -- e o rótulo de cada uma existe: sem rótulo o rastro não diz o que se perdeu --
    const ROTULOS = [
      'divergência de medicação no relatório do plantão',
      'registro da falha do aviso à Gestão — ',
      'mover a foto ao renomear ',
      'mover o cardápio de almoço ao renomear ',
      'guardar o aviso da veterinária na fila',
      'registro da falha do aviso de comida — ',
      'congelar o registro do Enriquecimento Ambiental do dia',
      'cronômetro da atividade do Enriquecimento Ambiental',
      'apagar lançamento vazio do painel do Day Care em ',
    ];
    const semRotulo = ROTULOS.filter((r) => html.indexOf("_logFalhaGrav('" + r) < 0);
    check('cada uma das 9 tem rótulo próprio no rastro (a 10ª é o próprio audit)',
      semRotulo.length === 0, JSON.stringify(semRotulo));
    check('o audit não chama _logFalhaGrav (seria roda-viva) — guarda no bolso',
      /acao:'audit-FALHOU'/.test(html) &&
      /_audGuardarNoBolso\(_audKey\(\)/.test(html));
    check('as 3 gravações que tinham .catch VAZIO agora têm rastro',
      /\.catch\(function\(e\)\{ _logFalhaGrav\('registro da falha do aviso à Gestão — '\+k, e\); \}\);/.test(html) &&
      /\.catch\(function\(e\)\{ _eaCongelarFalhou\(e\); \}\);/.test(html) &&
      /\.catch\(function\(e\)\{ _logFalhaGrav\('cronômetro da atividade do Enriquecimento Ambiental', e\); \}\);/.test(html));

    // -------- prova de comportamento: o banco recusa, e sobra rastro --------
    const bkpM = {
      audit: ctx.audit, zAlertao: ctx.zAlertao, quemSou: ctx.quemSou,
      plantAvisoNaTela: ctx.plantAvisoNaTela, eaImpedidos: ctx.eaImpedidos,
      turmaDoDia: ctx.turmaDoDia, eaNo: ctx.eaNo, pessoaDoTurno: ctx.pessoaDoTurno,
    };
    const rastros = [], cartazes = [];
    vm.runInContext('__bkpM = { DB: DB };', ctx);
    try {
      ctx.audit = (a, d) => rastros.push({ acao: String(a || ''), detalhe: String(d == null ? '' : d) });
      ctx.zAlertao = (t) => cartazes.push(String(t || ''));
      ctx.quemSou = () => 'Rosana';
      ctx.plantAvisoNaTela = () => {};
      // Banco que recusa TUDO — é o que acontece com regra de permissão ou quota estourada.
      ctx.__dbRecusa = { ref() { return {
        set: () => Promise.reject(new Error('permissão negada')),
        update: () => Promise.reject(new Error('permissão negada')),
        push: () => Promise.reject(new Error('permissão negada')),
        remove: () => Promise.reject(new Error('permissão negada')),
        once: () => Promise.resolve({ val: () => null }),
      }; } };
      vm.runInContext('DB = __dbRecusa;', ctx);
      const esperarM = (ms) => new Promise((r) => setTimeout(r, ms));

      // (1) o registro de que a Gestão NÃO foi avisada também pode não gravar
      rastros.length = 0;
      ctx.plantFalhou('daycare/plantao-aviso/2026-08-27', 'toddy__ana', { nome: 'Toddy' }, 'a ponte não respondeu');
      await esperarM(30);
      check('aviso à Gestão que não grava vira rastro, com o nome do que se perdeu',
        rastros.some((r) => r.acao === 'gravacao-FALHOU' && /aviso à Gestão/.test(r.detalhe)),
        JSON.stringify(rastros));

      // (2) congelar o dia do Enriquecimento Ambiental: rastro E cartaz na tela
      rastros.length = 0; cartazes.length = 0;
      ctx.eaImpedidos = () => [];
      ctx.turmaDoDia = () => [{ p: { n: 'Camus', tutor: 'Sophia' } }];
      ctx.eaNo = () => 'daycare/ea/2026-08-27';
      ctx.pessoaDoTurno = () => 'Octávio';
      ctx.eaCongelar();
      await esperarM(30);
      check('congelar o dia do EA que falha deixa rastro',
        rastros.some((r) => r.acao === 'gravacao-FALHOU' && /Enriquecimento Ambiental/.test(r.detalhe)),
        JSON.stringify(rastros));
      check('e avisa na tela quem fechou a atividade (amanhã já não dá para reconstruir)',
        cartazes.some((t) => /NÃO CONSEGUI GRAVAR O REGISTRO DE HOJE/.test(t)),
        JSON.stringify(cartazes));
    } finally {
      ctx.audit = bkpM.audit; ctx.zAlertao = bkpM.zAlertao; ctx.quemSou = bkpM.quemSou;
      ctx.plantAvisoNaTela = bkpM.plantAvisoNaTela; ctx.eaImpedidos = bkpM.eaImpedidos;
      ctx.turmaDoDia = bkpM.turmaDoDia; ctx.eaNo = bkpM.eaNo; ctx.pessoaDoTurno = bkpM.pessoaDoTurno;
      vm.runInContext('DB = __bkpM.DB;', ctx);
    }
  }
  console.log('');

  // ---- Resposta do tutor → ficha (resposta-tutor.js) ----
  console.log('Resposta do tutor → ficha (resposta-tutor.js):');
  if (typeof ctx.rtLerResposta !== 'function') {
    check('rtLerResposta existe', false, 'resposta-tutor.js não carregou');
  } else {
    // Espelha a FORMA real de algPerguntas(p) (auaulandia/index.html, ~linha
    // 18328) para um FILHOt fictício sem microchip cadastrado e sem sexo
    // conhecido (por isso sem a pergunta 'cio') — só para alimentar o teste
    // do casamento por cabeçalho/ordem/palavra-chave. O TEXTO de cada
    // pergunta não importa para o casamento (ele usa `k`, `secao` e
    // `campo`) — por isso não é copiado da tela aqui; quem manda nisso
    // continua sendo só a função real do app.
    const perguntasYume = [
      { k: 'refeicoes', secao: '*ALIMENTAÇÃO*', curta: 'Refeições e horários', campo: 'alim_horarios' },
      { k: 'marca', curta: 'Marca e tipo do alimento', campo: 'alim_racao_marca' },
      { k: 'quanto', curta: 'Quantidade por refeição', campo: 'alim_racao_qtd' },
      { k: 'restricao', curta: 'Restrição, sensibilidade ou alergia', campo: 'alergia' },
      { k: 'atividade', secao: '*SAÚDE, ROTINA E COMPORTAMENTO*', curta: 'Atividade física a evitar', campo: 'ea_restr' },
      { k: 'checkup', curta: 'Último check-up', campo: 'obs_tutor' },
      { k: 'chip', curta: 'Microchip', campo: 'microchip' },
      { k: 'comportamento', curta: 'Mudança de comportamento', campo: 'manias' },
      { k: 'estresse', curta: 'Situação estressante', campo: 'obs_tutor' },
    ];

    // O texto real da tutora da Yume, colado do WhatsApp — inclui o WORD
    // JOINER (U+2060) que o WhatsApp intercala depois de alguns bullets.
    const textoYume = [
      'Alimentação',
      '* 2 por dia, de manhã e à noite',
      '* ⁠Ração seca, ND Prime Frango e Romã',
      '* ⁠70g por refeição',
      '* ⁠Nenhuma restrição',
      '',
      'Saúde, rotina e comportamento',
      '* Atividades físicas liberadas',
      '* ⁠Último checkup em janeiro',
      '* ⁠Possui microchip: 900215002669358',
      '* ⁠Nenhuma mudança recente',
      '* ⁠Ela já foi atacada por um Golden (mais de 1 ano atrás) durante um passeio, e desde então tem receio com a raça e cachorros de porte parecido',
    ].join('\n');

    const HOJE = '2026-08-29'; // determinístico: agosto/2026, para a inferência de ano do check-up

    // ---- 1) texto da Yume, SEM perguntas: só os campos estruturados ----
    const semPerguntas = ctx.rtLerResposta(textoYume, { hoje: HOJE });
    const c = semPerguntas.campos;
    check('alim_horarios: 2 vezes, manhã e noite',
      c.alim_horarios && c.alim_horarios.vezes === 2 && c.alim_horarios.horarios.join(',') === 'manha,noite',
      JSON.stringify(c.alim_horarios));
    check('alim_racao_marca: tipo "Ração seca" + marca "ND Prime Frango e Romã"',
      c.alim_racao_marca && c.alim_racao_marca.tipo === 'Ração seca' && c.alim_racao_marca.marca === 'ND Prime Frango e Romã',
      JSON.stringify(c.alim_racao_marca));
    check('alim_racao_qtd: 70 g',
      c.alim_racao_qtd && c.alim_racao_qtd.numero === 70 && c.alim_racao_qtd.unidade === 'g',
      JSON.stringify(c.alim_racao_qtd));
    check('restricao: nenhuma',
      c.restricao && c.restricao.nenhuma === true,
      JSON.stringify(c.restricao));
    check('ea_restr: liberada',
      c.ea_restr && c.ea_restr.liberada === true,
      JSON.stringify(c.ea_restr));
    check('checkup_t: 2026-01-01, inferido (janeiro já passou em 2026 até agosto)',
      c.checkup_t && c.checkup_t.valor === '2026-01-01' && c.checkup_t.mes === 1 && c.checkup_t.inferido === true,
      JSON.stringify(c.checkup_t));
    check('checkup_p: 2027-01-01 (checkup_t + 365 dias)',
      c.checkup_p && c.checkup_p.valor === '2027-01-01',
      JSON.stringify(c.checkup_p));
    check('microchip: 900215002669358, 15 dígitos válido',
      c.microchip && c.microchip.numero === '900215002669358' && c.microchip.valido === true,
      JSON.stringify(c.microchip));
    check('manias.mudancaRecente: nenhuma',
      c.manias && c.manias.mudancaRecente && c.manias.mudancaRecente.nenhuma === true,
      JSON.stringify(c.manias && c.manias.mudancaRecente));
    check('manias.comportamentoMedos: ALERTA (texto integral preservado)',
      c.manias && c.manias.comportamentoMedos && c.manias.comportamentoMedos.alerta === true
        && c.manias.comportamentoMedos.texto === 'Ela já foi atacada por um Golden (mais de 1 ano atrás) durante um passeio, e desde então tem receio com a raça e cachorros de porte parecido',
      JSON.stringify(c.manias && c.manias.comportamentoMedos));
    check('manias.alerta sobe para o nível de cima (EA e plantonista enxergam sem abrir nada)',
      c.manias && c.manias.alerta === true,
      JSON.stringify(c.manias));
    check('nenhuma linha da Yume virou naoEntendi (bullets + cabeçalhos todos reconhecidos)',
      Array.isArray(semPerguntas.naoEntendi) && semPerguntas.naoEntendi.length === 0,
      JSON.stringify(semPerguntas.naoEntendi));

    // ---- 2) mesmo texto, COM perguntas: casamento por cabeçalho ----
    const comPerguntas = ctx.rtLerResposta(textoYume, { hoje: HOJE, perguntas: perguntasYume });
    const respostasEsperadas = {
      refeicoes: '2 por dia, de manhã e à noite',
      marca: 'Ração seca, ND Prime Frango e Romã',
      quanto: '70g por refeição',
      restricao: 'Nenhuma restrição',
      atividade: 'Atividades físicas liberadas',
      checkup: 'Último checkup em janeiro',
      chip: 'Possui microchip: 900215002669358',
      comportamento: 'Nenhuma mudança recente',
      estresse: 'Ela já foi atacada por um Golden (mais de 1 ano atrás) durante um passeio, e desde então tem receio com a raça e cachorros de porte parecido',
    };
    let cabecalhoOk = true, cabecalhoDet = '';
    Object.keys(respostasEsperadas).forEach((k) => {
      const r = comPerguntas.respostas[k];
      if (!r || r.texto !== respostasEsperadas[k] || r.via !== 'cabecalho') {
        cabecalhoOk = false; cabecalhoDet += k + '=' + JSON.stringify(r) + ' ';
      }
    });
    check('casamento por CABEÇALHO: as 9 perguntas casam com o bullet certo da seção certa', cabecalhoOk, cabecalhoDet);
    check('campo devolvido é o da pergunta REAL (não o palpite deste arquivo) — restricao→alergia, checkup/estresse→obs_tutor',
      comPerguntas.respostas.restricao && comPerguntas.respostas.restricao.campo === 'alergia'
        && comPerguntas.respostas.checkup && comPerguntas.respostas.checkup.campo === 'obs_tutor'
        && comPerguntas.respostas.estresse && comPerguntas.respostas.estresse.campo === 'obs_tutor',
      JSON.stringify([comPerguntas.respostas.restricao, comPerguntas.respostas.checkup, comPerguntas.respostas.estresse]));
    check('estresse (o ataque do Golden) sai com alerta:true também em `respostas`',
      comPerguntas.respostas.estresse && comPerguntas.respostas.estresse.alerta === true,
      JSON.stringify(comPerguntas.respostas.estresse));
    check('nenhuma pergunta ficou sem resposta', comPerguntas.perguntasSemResposta.length === 0, JSON.stringify(comPerguntas.perguntasSemResposta));

    // ---- 3) prova pedida: respostas FORA DE ORDEM e SEM NENHUM título ----
    const textoBaguncado = [
      'Ela já foi atacada por um Golden (mais de 1 ano atrás) durante um passeio, e desde então tem receio com a raça e cachorros de porte parecido',
      'Possui microchip: 900215002669358',
      'Nenhuma restrição',
      'Ração seca, ND Prime Frango e Romã',
      'Nenhuma mudança recente',
      'Atividades físicas liberadas',
      '70g por refeição',
      '2 por dia, de manhã e à noite',
      'Último checkup em janeiro',
    ].join('\n'); // mesma quantidade de linhas que perguntas (9), ordem embaralhada, zero cabeçalho
    const forDeOrdem = ctx.rtLerResposta(textoBaguncado, { hoje: HOJE, perguntas: perguntasYume });
    let forDeOrdemOk = true, forDeOrdemDet = '';
    Object.keys(respostasEsperadas).forEach((k) => {
      const r = forDeOrdem.respostas[k];
      if (!r || r.texto !== respostasEsperadas[k]) { forDeOrdemOk = false; forDeOrdemDet += k + '=' + JSON.stringify(r) + ' '; }
    });
    check('SEM cabeçalho e FORA DE ORDEM: as 9 respostas ainda casam certo (conferidas por palavra-chave)',
      forDeOrdemOk, forDeOrdemDet);
    check('sem cabeçalho: nenhum casamento fica marcado como "cabecalho" (a posição por seção nunca foi vista)',
      Object.keys(forDeOrdem.respostas).every((k) => forDeOrdem.respostas[k].via !== 'cabecalho'),
      JSON.stringify(forDeOrdem.respostas));

    // ---- 4) mordidas: texto vazio, cabeçalhos sem conteúdo, texto solto que não casa com nada ----
    const vazio = ctx.rtLerResposta('', { hoje: HOJE });
    check('texto vazio: nenhum campo, aviso claro, sem estourar',
      Object.keys(vazio.campos).length === 0 && vazio.avisos.length === 1,
      JSON.stringify(vazio));
    const soCabecalho = ctx.rtLerResposta('Alimentação\nSaúde, rotina e comportamento', { hoje: HOJE, perguntas: perguntasYume });
    check('só cabeçalho, sem nenhum bullet: nenhuma pergunta é respondida por adivinhação',
      Object.keys(soCabecalho.respostas).length === 0,
      JSON.stringify(soCabecalho.respostas));
    const solto = ctx.rtLerResposta('Adora dormir de barriga para cima\nGosta muito de bolinha', { hoje: HOJE });
    check('texto sem palavra-chave nenhuma: as duas linhas viram naoEntendi, nada é descartado',
      solto.naoEntendi.length === 2 && solto.naoEntendi[0] === 'Adora dormir de barriga para cima',
      JSON.stringify(solto.naoEntendi));
    const microInvalido = ctx.rtLerResposta('Possui microchip: 12345');
    check('microchip com menos de 15 dígitos: gera aviso, não trava e não inventa validade',
      microInvalido.campos.microchip.valido === false && /5 dígito/.test(microInvalido.avisos[0] || ''),
      JSON.stringify(microInvalido));
    const checkupSemMes = ctx.rtLerResposta('Fez check-up recentemente, tudo certo', { hoje: HOJE });
    check('check-up sem mês reconhecível: fica como observação (texto preservado), nunca inventa data',
      checkupSemMes.campos.checkup_t && checkupSemMes.campos.checkup_t.inferido === false && checkupSemMes.campos.checkup_t.valor === '',
      JSON.stringify(checkupSemMes.campos.checkup_t));
    const unidades = ctx.rtLerResposta('70 g por refeição\n70gr por refeição\n1 xícara por refeição', { hoje: HOJE });
    check('unidade "70 g" (com espaço) reconhecida', unidades.campos.alim_racao_qtd.numero === 70, JSON.stringify(unidades.campos.alim_racao_qtd));
    const checkupDezembro = ctx.rtLerResposta('Último check up foi em dezembro', { hoje: HOJE });
    check('check-up em mês que AINDA NÃO CHEGOU neste ano (dezembro, hoje=agosto): infere o ANO PASSADO',
      checkupDezembro.campos.checkup_t.valor === '2025-12-01' && checkupDezembro.campos.checkup_t.ano === 2025,
      JSON.stringify(checkupDezembro.campos.checkup_t));

    // ---- 5) O BOTÃO NA TELA: "Colar resposta do tutor" (29/ago/2026) ----
    // O leitor já era provado aqui, mas vivia fora do app: ninguém na recepção conseguia
    // usá-lo. Agora ele entra pela página e por um botão da tela de Alergias a confirmar.
    check('o app carrega o leitor junto com a página (<script src="resposta-tutor.js">)',
      /<script src="resposta-tutor\.js"><\/script>/.test(html));
    check('a tela de Alergias a confirmar tem o botão "Colar resposta do tutor"',
      (html.match(/>Colar resposta do tutor</g) || []).length >= 2 &&
      (html.match(/onclick="algColarBotao\(/g) || []).length >= 2,
      'botões: ' + (html.match(/>Colar resposta do tutor</g) || []).length);
    check('o botão abre uma CAIXA GRANDE (zCampo com textarea) — a resposta tem quase 2 mil letras',
      /grande:9/.test(html) && /op\.grande[\s\S]{0,40}<textarea id="/.test(html));
    check('o campo de uma linha do zCampo continua existindo (senha e nome não viraram caixa)',
      /type="'\+escAttr\(op\.tipo\|\|'text'\)\+'"/.test(html));

    if (typeof ctx.algColarLer === 'function' && Array.isArray(ctx.PELUDINHOS) && typeof ctx.pelKey === 'function') {
      // Um FILHOt de mentira, com ficha VAZIA: sem sexo (por isso sem a pergunta de cio) e
      // sem microchip (por isso COM a pergunta de chip) — as mesmas 9 perguntas do texto real.
      const fake = { n: 'Yume Do Harness', tutor: 'Tutora Do Harness', raca: 'Spitz', dias: [] };
      ctx.PELUDINHOS.push(fake);
      const kFake = ctx.pelKey(fake);
      check('o FILHOt de teste faz as mesmas 9 perguntas do texto real',
        ctx.algPerguntas(fake).length === 9, String(ctx.algPerguntas(fake).length));

      const prop = ctx.algColarLer(kFake, textoYume);
      check('texto da Yume colado na tela → 9 propostas, uma por pergunta',
        !!prop && Object.keys(prop.campos).length === 9,
        prop ? Object.keys(prop.campos).join(',') : 'null');
      check('cada proposta diz POR ONDE reconheceu (aqui: via cabeçalho)',
        !!prop && Object.keys(prop.campos).every((q) => prop.campos[q].via === 'cabecalho'),
        prop ? JSON.stringify(Object.keys(prop.campos).map((q) => q + ':' + prop.campos[q].via)) : '');
      check('a tela sabe escrever esse "por onde" em português',
        typeof ctx.algViaTexto === 'function' &&
        ctx.algViaTexto({ via: 'cabecalho' }) === 'via cabeçalho' &&
        ctx.algViaTexto({ via: 'ordem' }) === 'via ordem' &&
        ctx.algViaTexto({ via: 'palavra-chave' }) === 'via palavra-chave');
      check('o ataque do Golden vem MARCADO como alerta',
        !!prop && prop.campos.estresse && prop.campos.estresse.alerta === true,
        JSON.stringify(prop && prop.campos.estresse));
      check('o campo é o da pergunta REAL — restrição→alergia, check-up→observação do tutor',
        !!prop && prop.campos.restricao.campo === 'alergia' && prop.campos.checkup.campo === 'obs_tutor',
        JSON.stringify(prop && [prop.campos.restricao.campo, prop.campos.checkup.campo]));
      check('ficha vazia: a proposta já vem marcada (não há o que perder)',
        !!prop && Object.keys(prop.campos).every((q) => prop.campos[q].grava === true));
      check('no texto da Yume nada sobra sem encaixe',
        !!prop && (prop.sobras || []).length === 0, JSON.stringify(prop && prop.sobras));

      // O que o leitor não entende NÃO SOME: vira lista para ela alocar à mão.
      const prop2 = ctx.algColarLer(kFake, 'Adora dormir de barriga para cima\nGosta muito de bolinha');
      check('o que não encaixa vira a lista "não consegui encaixar", com destino em branco',
        !!prop2 && prop2.sobras.length === 2 && prop2.sobras[0].campo === '' &&
        prop2.sobras[0].txt === 'Adora dormir de barriga para cima',
        JSON.stringify(prop2 && prop2.sobras));
      check('enquanto ela não escolher o campo, o pedaço não entra em proposta nenhuma',
        !!prop2 && Object.keys(prop2.campos).length === 0, JSON.stringify(prop2 && prop2.campos));

      // ---- APLICAR À FICHA usa o MESMO gravador que a tela já usava ----
      // (algCurGravar → setPelExtra). Se um dia alguém escrever um caminho paralelo de
      // gravação para o texto colado, este teste cai.
      const corpoGravar = corpoFuncao('algCurGravar');
      check('o gravador da tela continua sendo setPelExtra (um caminho só)',
        /setPelExtra\(p, patch\)/.test(corpoGravar) && (html.match(/function algCurGravar\(/g) || []).length === 1);

      ctx.algColarLer(kFake, textoYume);
      const espiao = [];
      const setReal = ctx.setPelExtra;
      const auditReal = ctx.audit;
      const auditado = [];
      ctx.setPelExtra = (p, patch) => { espiao.push({ k: ctx.pelKey(p), patch }); return Promise.resolve({ ok: true }); };
      ctx.audit = (tipo, oque) => { auditado.push(tipo + '|' + oque); };
      try { ctx.algCurGravar(kFake); } finally { ctx.setPelExtra = setReal; ctx.audit = auditReal; }
      check('Aplicar à ficha chama o MESMO gravador, uma vez só, na ficha certa',
        espiao.length === 1 && espiao[0].k === kFake, JSON.stringify(espiao.map((x) => x.k)));
      check('e leva os 8 campos da ficha (check-up e estresse dividem "observação do tutor")',
        espiao.length === 1 && Object.keys(espiao[0].patch).length === 8 &&
        espiao[0].patch.alergia === 'Nenhuma restrição' &&
        /Último checkup em janeiro/.test(espiao[0].patch.obs_tutor) &&
        /atacada por um Golden/.test(espiao[0].patch.obs_tutor),
        JSON.stringify(espiao[0] && espiao[0].patch));
      check('a gravação deixa rastro no audit (quem levou, e o quê)',
        auditado.some((x) => /^alergia-ficha\|levou para a ficha/.test(x)), JSON.stringify(auditado));

      // Mordida: pedaço alocado à mão na lista "não consegui encaixar" TEM de ir junto.
      const prop3 = ctx.algColarLer(kFake, 'Adora dormir de barriga para cima');
      ctx.algSobraCampo(kFake, 0, 'manias');
      const espiao2 = [];
      const setReal2 = ctx.setPelExtra;
      ctx.setPelExtra = (p, patch) => { espiao2.push(patch); return Promise.resolve({ ok: true }); };
      try { ctx.algCurGravar(kFake); } finally { ctx.setPelExtra = setReal2; }
      check('mordida — o que ela alocou à mão vai para a ficha pelo mesmo caminho',
        !!prop3 && espiao2.length === 1 && espiao2[0].manias === 'Adora dormir de barriga para cima',
        JSON.stringify(espiao2));

      // Mordida: sem nada marcado e sem nada alocado, NADA é gravado.
      ctx.algColarLer(kFake, 'Adora dormir de barriga para cima');
      const espiao3 = [];
      const setReal3 = ctx.setPelExtra;
      const alertaoReal = ctx.zAlertao;
      let avisou = 0;
      ctx.setPelExtra = (p, patch) => { espiao3.push(patch); return Promise.resolve({ ok: true }); };
      ctx.zAlertao = () => { avisou++; };
      try { ctx.algCurGravar(kFake); } finally { ctx.setPelExtra = setReal3; ctx.zAlertao = alertaoReal; }
      check('mordida — nada marcado, nada alocado: não grava e AVISA na tela (sem janelinha)',
        espiao3.length === 0 && avisou === 1, 'gravou ' + espiao3.length + ', avisou ' + avisou);

      ctx.PELUDINHOS.pop();
      delete (ctx.ALG_CUR || {})[kFake];
    } else {
      check('algColarLer existe (o botão da tela sem função é botão morto)', false);
    }
  }
  console.log('');

  // ============================================================================
  // O REMÉDIO DA ESTADIA ANTERIOR (Adriana, 29/ago/2026)
  // ----------------------------------------------------------------------------
  // "Na última hospedagem o Arthur tomava Apoquel — não toma mais?" O remédio some do
  // check-in e a dose simplesmente deixa de acontecer. Agora o app pergunta antes de
  // concluir — na AuAulândia e no Day Care — e cada resposta deixa rastro.
  console.log('O remédio da estadia anterior — a pergunta antes de concluir (29/ago):');
  {
    if (typeof ctx.medSumiram !== 'function' || typeof ctx.medGate !== 'function') {
      check('medSumiram e medGate existem', false, 'funções não encontradas no app');
    } else {
      // ---- a conta pura: o que sumiu ----
      check('acha o remédio que sumiu, ignorando maiúscula, acento e espaço sobrando',
        JSON.stringify(ctx.medSumiram([{ nome: 'Apoquel' }, { nome: 'Ômega 3' }], [{ nome: ' apoquel ' }]).map((x) => x.nome)) === '["Ômega 3"]',
        JSON.stringify(ctx.medSumiram([{ nome: 'Apoquel' }, { nome: 'Ômega 3' }], [{ nome: ' apoquel ' }])));
      check('mesmo remédio dos dois lados: nada a perguntar',
        ctx.medSumiram([{ nome: 'Apoquel' }], [{ nome: 'APOQUEL' }]).length === 0);
      check('sem histórico nenhum: nada a perguntar',
        ctx.medSumiram([], [{ nome: 'Apoquel' }]).length === 0);
      check('o mesmo nome duas vezes no histórico não vira duas perguntas',
        ctx.medSumiram([{ nome: 'Apoquel' }, { nome: 'apoquel ' }], []).length === 1);
      check('o item INTEIRO volta junto — é dele que sai a dose já preenchida',
        (ctx.medSumiram([{ nome: 'Apoquel', q: '1', u: 'comprimido', horarios: ['08:00'] }], [])[0] || {}).item.horarios[0] === '08:00');

      // ---- o portão, com banco de mentira ----
      const dados = {};
      const escritas = [];
      const fazSnap = (v) => ({ val: () => (v === undefined ? null : v) });
      const bancoM = {
        ref(p) {
          return {
            once() { return Promise.resolve(fazSnap(dados[p])); },
            push(v) { escritas.push({ o: 'push', p, v }); return Promise.resolve({ key: 'novo' }); },
            set(v) { escritas.push({ o: 'set', p, v }); return Promise.resolve(); },
            update(v) { escritas.push({ o: 'update', p, v }); return Promise.resolve(); },
          };
        },
      };
      ctx.__bkpMed = {};
      vm.runInContext('__bkpMed = { DB: DB, audit: audit, zEscolha: zEscolha, zAlertao: zAlertao, quemSou: quemSou, hospHojeISO: hospHojeISO, pelGet: pelGet };', ctx);
      ctx.__bancoMed = bancoM;

      const perguntas = [], auditados = [], alertas = [];
      const toque = { botao: 0 };                 // qual dos 3 botões a pessoa toca
      ctx.zEscolha = (titulo, linhas, botoes) => {
        perguntas.push({ titulo: String(titulo || ''), botoes: (botoes || []).map((b) => b.t) });
        const b = (botoes || [])[toque.botao];
        if (b && typeof b.fn === 'function') b.fn();
      };
      ctx.zAlertao = (t, l, op) => { alertas.push(String(t || '')); if (op && typeof op.aoFechar === 'function') op.aoFechar(); };
      ctx.audit = (a, d, m) => auditados.push({ acao: String(a || ''), detalhe: String(d == null ? '' : d), meta: m || {} });
      ctx.quemSou = () => 'Giullian';
      ctx.hospHojeISO = () => '2026-08-29';
      ctx.pelGet = () => 'Macho';
      vm.runInContext('DB = __bancoMed;', ctx);

      const zerarMed = () => {
        perguntas.length = 0; auditados.length = 0; alertas.length = 0; escritas.length = 0;
        Object.keys(dados).forEach((k) => delete dados[k]);
        try { Object.keys(ctx.MED_GATE_ULTIMO).forEach((k) => delete ctx.MED_GATE_ULTIMO[k]); } catch (e) {}
      };
      const esperarMed = () => new Promise((r) => setTimeout(r, 30));
      const KEY = 'arthur__renata';
      const agendaComApoquel = (estadiaId) => {
        dados['auaulandia/medicacao-agenda/' + KEY] = {
          estadiaId: estadiaId, itens: { m1: { nome: 'Apoquel', q: '1', u: 'comprimido', horarios: ['08:00'] } },
        };
      };

      try {
        // (a) tinha Apoquel na estadia PASSADA e o check-in de agora vem sem ele → PERGUNTA
        zerarMed();
        agendaComApoquel('est-antiga');
        dados['auaulandia/estadias/est-antiga'] = { status: 'ativa', entrada: '2026-07-01', saida: '2026-07-10' };
        let seguiu = 0, mudou = null;
        toque.botao = 0;
        ctx.medGate('auaulandia', KEY, 'Arthur', 'Renata', false, [], (f) => { mudou = f; }, () => { seguiu++; });
        await esperarMed();
        check('(a) tinha Apoquel e o check-in vem sem ele → o app PERGUNTA antes de concluir',
          perguntas.length === 1 &&
          perguntas[0].titulo === 'Giullian, na última hospedagem o Arthur tomava Apoquel — não toma mais?',
          JSON.stringify(perguntas));
        check('(a) a pergunta oferece as TRÊS respostas, nessa ordem',
          perguntas.length === 1 &&
          JSON.stringify(perguntas[0].botoes) === '["Não toma mais","Mudou a dose","O tutor esqueceu de trazer"]',
          JSON.stringify(perguntas[0] && perguntas[0].botoes));
        check('(a) "Não toma mais" grava audit com quem respondeu e segue o check-in',
          seguiu === 1 &&
          auditados.some((x) => x.acao === 'remedio-anterior' && /não toma mais Apoquel/.test(x.detalhe) && x.meta.assinou === 'Giullian' && x.meta.alvo === 'Apoquel'),
          JSON.stringify(auditados));

        // (b) o mesmo remédio está no check-in de agora → NÃO pergunta
        zerarMed();
        agendaComApoquel('est-antiga');
        dados['auaulandia/estadias/est-antiga'] = { status: 'ativa', entrada: '2026-07-01', saida: '2026-07-10' };
        let seguiu2 = 0;
        ctx.medGate('auaulandia', KEY, 'Arthur', 'Renata', false, [{ nome: 'apoquel' }], () => {}, () => { seguiu2++; });
        await esperarMed();
        check('(b) o mesmo remédio no check-in de agora: nenhuma pergunta, o check-in segue direto',
          perguntas.length === 0 && seguiu2 === 1, JSON.stringify(perguntas));

        // (c) "Mudou a dose": abre o cadastro preenchido e NÃO deixa salvar
        zerarMed();
        agendaComApoquel('est-antiga');
        dados['auaulandia/estadias/est-antiga'] = { status: 'ativa', entrada: '2026-07-01', saida: '2026-07-10' };
        let seguiu3 = 0, mudou3 = null;
        toque.botao = 1;
        ctx.medGate('auaulandia', KEY, 'Arthur', 'Renata', false, [], (f) => { mudou3 = f; }, () => { seguiu3++; });
        await esperarMed();
        check('(c) "Mudou a dose" devolve o remédio JÁ PREENCHIDO (dose e horário da última vez)',
          !!mudou3 && mudou3.nome === 'Apoquel' && mudou3.item.q === '1' && mudou3.item.horarios[0] === '08:00',
          JSON.stringify(mudou3));
        check('(c) e o check-in NÃO conclui: quem ajusta a dose é gente',
          seguiu3 === 0 && auditados.some((x) => /mudou a dose de Apoquel/.test(x.detalhe)),
          'seguiu ' + seguiu3 + ' — ' + JSON.stringify(auditados));

        // (d) "O tutor esqueceu de trazer": vira pendência no nó que a tela já lê
        zerarMed();
        agendaComApoquel('est-antiga');
        dados['auaulandia/estadias/est-antiga'] = { status: 'ativa', entrada: '2026-07-01', saida: '2026-07-10' };
        let seguiu4 = 0;
        toque.botao = 2;
        ctx.medGate('auaulandia', KEY, 'Arthur', 'Renata', false, [], () => {}, () => { seguiu4++; });
        await esperarMed();
        const pend = escritas.filter((x) => x.o === 'push' && x.p === 'auaulandia/avisos-racao');
        check('(d) "esqueceu de trazer" vira pendência em auaulandia/avisos-racao (a tela Pendências lê daqui)',
          pend.length === 1 && pend[0].v.tipo === 'medicacao-nao-veio' && pend[0].v.itemNome === 'Apoquel' &&
          pend[0].v.status === 'pendente' && pend[0].v.hospNome === 'Arthur' && pend[0].v.criado_por === 'Giullian',
          JSON.stringify(pend));
        check('(d) e o check-in segue, com rastro de quem respondeu',
          seguiu4 === 1 && auditados.some((x) => x.acao === 'remedio-anterior' && /esqueceu de trazer Apoquel/.test(x.detalhe) && x.meta.assinou === 'Giullian'),
          'seguiu ' + seguiu4);

        // (e) MORDIDA: a estadia dona da agenda AINDA ESTÁ EM CURSO — é o formulário de
        // agora, não é passado. Perguntar aqui seria perguntar sobre o próprio check-in.
        zerarMed();
        agendaComApoquel('est-de-agora');
        dados['auaulandia/estadias/est-de-agora'] = { status: 'ativa', entrada: '2026-08-28', saida: '2026-09-05' };
        let seguiu5 = 0;
        toque.botao = 0;
        ctx.medGate('auaulandia', KEY, 'Arthur', 'Renata', false, [], () => {}, () => { seguiu5++; });
        await esperarMed();
        check('(e) mordida — estadia ainda em curso: não pergunta sobre o próprio check-in',
          perguntas.length === 0 && seguiu5 === 1, JSON.stringify(perguntas));

        // (f) MORDIDA: remédio já SUSPENSO pela veterinária não vira surpresa
        zerarMed();
        dados['auaulandia/medicacao-agenda/' + KEY] = { estadiaId: 'est-antiga', itens: { m1: { nome: 'Apoquel', suspenso: true } } };
        dados['auaulandia/estadias/est-antiga'] = { status: 'ativa', saida: '2026-07-10' };
        let seguiu6 = 0;
        ctx.medGate('auaulandia', KEY, 'Arthur', 'Renata', false, [], () => {}, () => { seguiu6++; });
        await esperarMed();
        check('(f) mordida — remédio já suspenso pela veterinária não é perguntado de novo',
          perguntas.length === 0 && seguiu6 === 1, JSON.stringify(perguntas));

        // (g) DAY CARE: a memória por FILHOt, e o texto que fala da vinda ao Day Care
        zerarMed();
        dados['daycare/med-ultimo/toddy__marina'] = {
          nome: 'Toddy', dia: '2026-08-28',
          itens: { medicacao_0: { nome: 'Apoquel', dose: 'meio comprimido', horarios: ['12:00'] } },
        };
        let seguiu7 = 0, mudou7 = null;
        toque.botao = 1;
        ctx.medGate('daycare', 'toddy__marina', 'Toddy', 'Marina', false, [], (f) => { mudou7 = f; }, () => { seguiu7++; });
        await esperarMed();
        check('(g) Day Care: pergunta pela última VINDA, com a dose de lá',
          perguntas.length === 1 &&
          perguntas[0].titulo === 'Giullian, na última vinda ao Day Care o Toddy tomava Apoquel — não toma mais?' &&
          !!mudou7 && mudou7.item.dose === 'meio comprimido' && seguiu7 === 0,
          JSON.stringify(perguntas) + ' ' + JSON.stringify(mudou7));

        // (h) fêmea: a frase concorda ("a Yume", não "o Yume")
        zerarMed();
        dados['daycare/med-ultimo/yume__ana'] = { nome: 'Yume', itens: { m0: { nome: 'Ômega 3' } } };
        toque.botao = 0;
        ctx.medGate('daycare', 'yume__ana', 'Yume', 'Ana', true, [], () => {}, () => {});
        await esperarMed();
        check('(h) a frase concorda com o gênero do FILHOt',
          perguntas.length === 1 && /a Yume tomava Ômega 3/.test(perguntas[0].titulo),
          JSON.stringify(perguntas));

        // (i) sem memória nenhuma: nada é inventado
        zerarMed();
        let seguiu9 = 0;
        ctx.medGate('daycare', 'nunca__tomou', 'Ninguém', '', false, [], () => {}, () => { seguiu9++; });
        await esperarMed();
        check('(i) FILHOt sem passado de remédio: nenhuma pergunta, nenhum palpite',
          perguntas.length === 0 && seguiu9 === 1);
      } finally {
        vm.runInContext('DB = __bkpMed.DB; audit = __bkpMed.audit; zEscolha = __bkpMed.zEscolha; zAlertao = __bkpMed.zAlertao; quemSou = __bkpMed.quemSou; hospHojeISO = __bkpMed.hospHojeISO; pelGet = __bkpMed.pelGet;', ctx);
        try { Object.keys(ctx.MED_GATE_ULTIMO).forEach((k) => delete ctx.MED_GATE_ULTIMO[k]); } catch (e) {}
      }

      // ---- o portão está LIGADO nos dois salvamentos, e vem ANTES de gravar ----
      const corpoCi = corpoFuncao('ciSalvar');
      const corpoPt = corpoFuncao('ptSalvar');
      check('o check-in da AuAulândia chama o portão', /medGate\('auaulandia'/.test(corpoCi));
      check('o check-in do Day Care chama o portão', /medGate\('daycare'/.test(corpoPt));
      check('na AuAulândia a pergunta vem ANTES de qualquer gravação',
        corpoCi.indexOf("medGate('auaulandia'") > 0 &&
        corpoCi.indexOf("medGate('auaulandia'") < corpoCi.indexOf('__ciGravar('),
        'medGate em ' + corpoCi.indexOf("medGate('auaulandia'") + ', __ciGravar em ' + corpoCi.indexOf('__ciGravar('));
      check('no Day Care a pergunta vem ANTES de qualquer gravação',
        corpoPt.indexOf("medGate('daycare'") > 0 &&
        corpoPt.indexOf("medGate('daycare'") < corpoPt.indexOf('DB.ref(ptNo()'),
        'medGate em ' + corpoPt.indexOf("medGate('daycare'") + ', gravação em ' + corpoPt.indexOf('DB.ref(ptNo()'));
      check('o check-in do Day Care guarda a memória do remédio para a próxima vez',
        /daycare\/med-ultimo\/'\+k/.test(corpoPt) && /dia:dcDataKey\(\)/.test(corpoPt));
      check('dia sem remédio nenhum APAGA a memória (a resposta "não toma mais" vira fato)',
        /Object\.keys\(memoria\)\.length\?\{[^}]*\}:null/.test(corpoPt));
      check('as três respostas são as três da Adriana, escritas na tela',
        /'Não toma mais'/.test(html) && /'Mudou a dose'/.test(html) && /'O tutor esqueceu de trazer'/.test(html));
    }
  }
  console.log('');

  // ============================================================================
  // A BARRA COM O VISUAL DA OPÇÃO F (Adriana escolheu, 29/ago/2026)
  // ----------------------------------------------------------------------------
  // Só pintura: superfície, marca, tipografia, pílula do ativo e rodapé. A estrutura do
  // menu, a hierarquia e a sanfona continuam provadas no bloco "menu" acima — se alguma
  // delas cair, é porque a pintura mexeu no que não devia.
  console.log('Barra lateral — o visual da Opção F (29/ago):');
  {
    const cssSb = (/\.sidebar\{([^}]*)\}/.exec(html) || [, ''])[1];
    const cssBrandLogo = (/\.brand-logo\{([^}]*)\}/.exec(html) || [, ''])[1];
    const cssBrand = (/\.brand\{([^}]*)\}/.exec(html) || [, ''])[1];
    const cssAtivo = (/\.nav a\.active\{([^}]*)\}/.exec(html) || [, ''])[1];

    // ---- a marca: SVG de verdade, grande, sem caixa (zeluz-logo-lei.md) ----
    check('a marca da barra é o SÍMBOLO OFICIAL #39, em SVG — não a palavra "Zêluz" digitada',
      /<img src="assets\/simbolo-zeluz-39-claro\.svg"[^>]*class="brand-logo"/.test(html),
      (html.match(/class="brand-logo"[^>]*>/) || [])[0] || 'não achei a marca');
    check('o arquivo do símbolo veio junto com o app (senão a barra abre sem marca)',
      fs.existsSync(path.join(__dirname, '..', 'auaulandia', 'assets', 'simbolo-zeluz-39-claro.svg')) &&
      fs.existsSync(path.join(__dirname, '..', 'auaulandia', 'assets', 'simbolo-zeluz-39.svg')));
    check('em fundo escuro entra a versão CLARA (a preta sumiria na barra)',
      /simbolo-zeluz-39-claro\.svg/.test(html) &&
      /fill: #FFFDF6/.test(fs.readFileSync(path.join(__dirname, '..', 'auaulandia', 'assets', 'simbolo-zeluz-39-claro.svg'), 'utf8')));
    const larguraLogo = parseFloat((/width:(\d+)px/.exec(cssBrandLogo) || [, '0'])[1]);
    check('o símbolo é GRANDE: pelo menos 72px', larguraLogo >= 72, larguraLogo + 'px');
    check('e não mora dentro de caixa nenhuma (o .brand não tem fundo nem borda próprios)',
      !/background/.test(cssBrand) && !/border/.test(cssBrand), cssBrand);

    // ---- a superfície: a barra desce para o azul profundo ----
    check('a barra é o azul profundo da Opção F',
      /#1A3A4F/.test(cssSb) && /#15303F/.test(cssSb), cssSb.slice(0, 160));
    check('e continua com profundidade — nada de fundo chapado',
      /radial-gradient/.test(cssSb) && /\.sidebar::after/.test(html));

    // ---- o item ativo: pílula de dourado baixo + fio, nunca a bola amarela cheia ----
    check('o item ativo NÃO é mais a bola amarela cheia (fundo dourado sólido)',
      !/background:var\(--z-gold\)/.test(cssAtivo), cssAtivo);
    check('o item ativo é uma pílula de dourado baixo com o texto aceso',
      /background:rgba\(222,180,40,\.13\)/.test(cssAtivo) && /color:var\(--z-gold-light\)/.test(cssAtivo), cssAtivo);
    check('e tem o fio dourado à esquerda marcando onde a pessoa está',
      /\.nav a\.active::before\{[^}]*background:var\(--z-gold\)/.test(html.replace(/\s*\n\s*/g, '')));
    check('o ícone do item ativo acende em dourado', /\.nav a\.active svg\{color:var\(--z-gold\)\}/.test(html));

    // ---- o rodapé: quem está usando E em que papel ----
    check('o rodapé mostra o PAPEL embaixo do nome',
      /id="whoPapel"/.test(html) && /\.who-papel\{/.test(html));
    check('o nome continua no mesmo id de sempre (nada quebrou fora daqui)', /id="whoName"/.test(html));
    if (typeof ctx.papelRotulo === 'function') {
      check('o papel sai por extenso, da MESMA lista do Time (ROLE_OPCOES)',
        ctx.papelRotulo('monitor') === 'Monitor(a)' &&
        ctx.papelRotulo('vet') === 'Veterinária' &&
        ctx.papelRotulo('plantonista') === 'Plantonista',
        [ctx.papelRotulo('monitor'), ctx.papelRotulo('vet'), ctx.papelRotulo('plantonista')].join(' / '));
      check('e os papéis que não se cadastram no Time também têm nome',
        ctx.papelRotulo('gestao') === 'Gestão' && ctx.papelRotulo('diretoria') === 'Diretoria' &&
        ctx.papelRotulo('recepcao') === 'Consultora (Recepção)',
        [ctx.papelRotulo('gestao'), ctx.papelRotulo('diretoria'), ctx.papelRotulo('recepcao')].join(' / '));
      check('mordida — papel desconhecido não vira "undefined" na tela',
        ctx.papelRotulo('coisa-que-nao-existe') === 'Zêluz' && ctx.papelRotulo('') === 'Zêluz' && ctx.papelRotulo() === 'Zêluz');
      check('o rodapé é preenchido no login (papel escrito, não só guardado)',
        /_wp\.textContent=\(u\.pessoa\?/.test(html) && /papelRotulo\(u\.role\)/.test(html));
      check('com login de posto, quem aparece no rodapé é a PESSOA (o posto vira o papel)',
        /whoName'\)\.textContent=\(u\.pessoa\|\|u\.nome\)/.test(html));
    } else {
      check('papelRotulo existe', false, 'função não encontrada no app');
    }

    // ---- o que a pintura NÃO podia mexer ----
    // A senha antiga das pontes não pode ficar escrita como dica de campo: quem abre a tela
    // acha que é o valor certo e cola ela. As pontes leem a senha de PONTE_SENHA (propriedade
    // do Apps Script), não mais do código.
    check('a palavra-chave antiga das pontes saiu das dicas de campo',
      html.indexOf('zeluz-auaulandia') === -1,
      'ainda aparece ' + ((html.match(/zeluz-auaulandia/g) || []).length + 'x'));
    check('e os dois campos citam PONTE_SENHA, que é onde a senha mora agora',
      (html.match(/PONTE_SENHA no Apps Script/g) || []).length === 2 &&
      (html.match(/PONTE_SENHA do Apps Script/g) || []).length === 2,
      'rótulo ' + (html.match(/PONTE_SENHA no Apps Script/g) || []).length +
      ' · dica ' + (html.match(/PONTE_SENHA do Apps Script/g) || []).length);

    check('a sanfona continua sendo a mesma (nenhuma classe nova de abrir/fechar)',
      /\.acc:not\(\.acc-open\) > \.acc-panel\{display:none\}/.test(html));
    check('a pendência continua acendendo em vermelho por cima de tudo (!important)',
      /\.nav a\.nav-pend\{[\s\S]{0,220}?!important/.test(html));
  }
  console.log('');

  // ============================================================================
  // AS JANELINHAS DO NAVEGADOR SAÍRAM (29/ago/2026)
  // ----------------------------------------------------------------------------
  // A auditoria de 28/ago (seção 7) contou 41 confirm() e 27 prompt() — 68 janelas
  // nativas. Elas travam a tela, não têm a cara da Zêluz e, no celular, o navegador
  // pode SUPRIMI-LAS e responder sozinho: foi assim que um relatório inteiro de
  // plantão se perdeu. No lugar entraram zPergunta/zTexto, que desenham um cartaz na
  // própria página em cima do zEscolha/zCampo que já existiam.
  console.log('Janelinhas do navegador: confirm() e prompt() saíram (29/ago):');
  {
    // Só conta chamada de verdade: as citações dentro de comentário (// ...) são
    // memória histórica do arquivo e devem continuar lá.
    const chamadasNativas = (texto) => {
      const achadas = [];
      // Apaga o que é comentário de HTML (<!-- ... -->), mantendo as quebras de linha
      // para o número continuar batendo com o arquivo. Comentário de bloco /* */ NÃO se
      // apaga aqui: o CSS e as expressões regulares do arquivo têm barras e asteriscos
      // que enganariam a varredura e engoliriam código de verdade.
      const semBloco = texto.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '));
      semBloco.split('\n').forEach((linha, i) => {
        const semComentario = linha.replace(/\/\/.*$/, '');
        const m = semComentario.match(/\b(confirm|prompt)\s*\(/g);
        if (m) m.forEach((x) => achadas.push({ linha: i + 1, qual: x.trim(), texto: linha.trim().slice(0, 70) }));
      });
      return achadas;
    };
    // NENHUMA sobrou (29/ago/2026). A última era o prompt() do nome de quem está no turno,
    // que abria NO MEIO da ação — na hora de dar o remédio, de marcar o almoço. A pergunta
    // subiu para a porta de entrada: login de POSTO ("Plantonista", "Monitor 3") não entra
    // sem dizer quem está usando, o nome fica na sessão, e pessoaDoTurno() virou leitura
    // síncrona — continua cabendo dentro de `assinou:pessoaDoTurno()` nos 16 lugares.
    const sobraram = chamadasNativas(html);
    check('não sobrou NENHUMA janelinha nativa no arquivo (eram 68)',
      sobraram.length === 0, JSON.stringify(sobraram.map((x) => x.linha + ':' + x.texto)));
    check('pessoaDoTurno não abre mais nada: lê a sessão e devolve na hora',
      /function pessoaDoTurno\(forcar\)\{/.test(html) &&
      !/prompt\(/.test(corpoFuncao('pessoaDoTurno')) &&
      /return atual\|\|'-';/.test(corpoFuncao('pessoaDoTurno')),
      corpoFuncao('pessoaDoTurno').slice(0, 120));
    check('login de POSTO não entra sem o nome de quem está usando',
      /function entrarComoPessoa\(u, erroAnterior\)\{/.test(html) &&
      /LOGIN_GENERICO\.test\(nomeLogin\)/.test(corpoFuncao('entrarComoPessoa')) &&
      /Quem está usando este aparelho agora\?/.test(html));
    check('e quem desiste NÃO entra (o cancelar não deixa passar)',
      /aoCancelar:function\(\)\{[\s\S]{0,320}?este acesso não entra/.test(html));
    check('doLogin passa por essa porta — não grava a sessão por fora',
      /entrarComoPessoa\(u\); return;/.test(String(ctx.doLogin || '')));
    if (typeof ctx.pessoaDoTurno === 'function' && typeof ctx.quemSou === 'function') {
      // Sessão de mentira: é assim que o app guarda o login (zeluz_login) e o nome escrito
      // na entrada (campo `pessoa`).
      const sessao = {};
      const bkpSS = ctx.sessionStorage;
      ctx.sessionStorage = {
        getItem(k) { return Object.prototype.hasOwnProperty.call(sessao, k) ? sessao[k] : null; },
        setItem(k, v) { sessao[k] = String(v); },
        removeItem(k) { delete sessao[k]; },
      };
      try {
        sessao.zeluz_login = JSON.stringify({ role: 'plantonista', nome: 'Plantonista', pessoa: 'Wandela Cristina' });
        check('com o nome na sessão, pessoaDoTurno devolve a PESSOA — sem abrir nada',
          ctx.pessoaDoTurno() === 'Wandela Cristina', String(ctx.pessoaDoTurno()));
        check('e quemSou também: o posto sozinho não responde por nada',
          ctx.quemSou() === 'Wandela Cristina', String(ctx.quemSou()));
        delete sessao.zeluz_pessoa_turno;
        sessao.zeluz_login = JSON.stringify({ role: 'monitor', nome: 'Giulia Andrade' });
        check('login com nome de gente continua valendo por si',
          ctx.pessoaDoTurno() === 'Giulia Andrade', String(ctx.pessoaDoTurno()));
        delete sessao.zeluz_pessoa_turno;
        sessao.zeluz_login = JSON.stringify({ role: 'plantonista', nome: 'Plantonista' });
        check('mordida — posto SEM nome não vira responsável: não devolve "Plantonista"',
          ctx.pessoaDoTurno() !== 'Plantonista', String(ctx.pessoaDoTurno()));
      } finally { ctx.sessionStorage = bkpSS; }
    }

    // Os dois envelopes que substituíram tudo — e o campo de senha que a janela nativa
    // mostrava em texto puro.
    check('zPergunta devolve promessa em cima do zEscolha',
      /function zPergunta\(titulo, linhas, op\)\{/.test(html) &&
      /zEscolha\(titulo, linhas, \[/.test(html));
    check('zTexto devolve o texto, ou null quando a pessoa desiste',
      /function zTexto\(titulo, linhas, op\)\{/.test(html) &&
      /cfg\.aoCancelar=function\(\)\{ res\(null\); \};/.test(html));
    check('zCampo aceita campo de senha (a janela nativa mostrava em texto puro)',
      /type="'\+escAttr\(op\.tipo\|\|'text'\)\+'"/.test(html) &&
      (html.match(/tipo:'password'/g) || []).length >= 2);

    // Todo botão de zPergunta tem VERBO — "OK/Cancelar" não diz o que vai acontecer.
    const semVerbo = [];
    (html.match(/\{sim:'[^']*', ?nao:'[^']*'/g) || []).forEach((par) => {
      const sim = (par.match(/sim:'([^']*)'/) || [])[1] || '';
      if (/^(OK|Ok|Sim|Confirmar)$/.test(sim.trim())) semVerbo.push(sim);
    });
    check('nenhum botão ficou só com "OK"/"Sim"', semVerbo.length === 0, JSON.stringify(semVerbo));

    // ---- prova de comportamento: a decisão de negócio de cada uma continua a mesma ----
    // Com o cartaz respondendo "não", nada é gravado. Com "sim", grava.
    const bkpJ = { audit: ctx.audit, alert: ctx.alert,
                   salvarAtiv: ctx.salvarAtiv, renderAtiv: ctx.renderAtiv,
                   quemSou: ctx.quemSou, horaAgora: ctx.horaAgora };
    const escritas = [];
    vm.runInContext('__bkpJ = { DB: DB };', ctx);
    try {
      ctx.audit = () => {};
      ctx.salvarAtiv = () => { escritas.push('salvarAtiv'); };
      ctx.renderAtiv = () => {};
      ctx.quemSou = () => 'Márcia';
      ctx.horaAgora = () => '11:47';
      ctx.__dbJ = { ref(p) { return {
        set(v) { escritas.push({ o: 'set', p, v }); return Promise.resolve(); },
        update(v) { escritas.push({ o: 'update', p, v }); return Promise.resolve(); },
        push(v) { escritas.push({ o: 'push', p, v }); return Promise.resolve(); },
        remove() { escritas.push({ o: 'remove', p }); return Promise.resolve(); },
        once() { return Promise.resolve({ val: () => null }); },
      }; } };
      vm.runInContext('DB = __dbJ;', ctx);

      // (a) removerAtividade — "Manter" não tira nada da lista.
      // ATIVIDADES é `let` no script do app: só existe DENTRO do contexto.
      const ativs = () => vm.runInContext('JSON.stringify(ATIVIDADES)', ctx);
      vm.runInContext("ATIVIDADES = [{t:'Banho de sol'},{t:'Piscina'}];", ctx);
      escritas.length = 0;
      await respondendo({ pergunta: false }, async () => { await ctx.removerAtividade(0); });
      check('quem responde "Manter" não perde a atividade',
        JSON.parse(ativs()).length === 2 && escritas.length === 0, ativs());
      escritas.length = 0;
      await respondendo({ pergunta: true }, async () => { await ctx.removerAtividade(0); });
      check('quem responde "Remover" perde a atividade — e ela é a certa',
        JSON.parse(ativs()).length === 1 && JSON.parse(ativs())[0].t === 'Piscina', ativs());

      // (b) acrescentarAtividade — o texto escrito no cartaz é o que entra na lista
      await respondendo({ texto: 'Cama elástica' }, async () => { await ctx.acrescentarAtividade(); });
      check('o texto escrito no cartaz vira a atividade nova',
        JSON.parse(ativs()).some((x) => x.t === 'Cama elástica'), ativs());
      const antesN = JSON.parse(ativs()).length;
      await respondendo({ texto: null }, async () => { await ctx.acrescentarAtividade(); });
      check('quem desiste do cartaz não cria atividade em branco',
        JSON.parse(ativs()).length === antesN, ativs());

      // (c) turnoTrocar — o horário de outra pessoa não se apaga sem resposta
      escritas.length = 0;
      const r1 = await respondendo({ pergunta: false }, () =>
        ctx.turnoTrocar('daycare/almoco-turno/2026-08-27', 'inicio', 'quemInicio',
          { inicio: '11:20', quemInicio: 'Wandela' }, 'O início do almoço'));
      check('"Manter como está" devolve null e NÃO grava por cima do horário da outra',
        r1 === null && escritas.length === 0, JSON.stringify(escritas));
      escritas.length = 0;
      const r2 = await respondendo({ pergunta: true }, () =>
        ctx.turnoTrocar('daycare/almoco-turno/2026-08-27', 'inicio', 'quemInicio',
          { inicio: '11:20', quemInicio: 'Wandela' }, 'O início do almoço'));
      check('"Trocar o horário" grava o novo E guarda o antigo no histórico',
        r2 && r2.h === '11:47' &&
        escritas.some((e) => e.o === 'push' && /historico/.test(e.p) && e.v.era === '11:20') &&
        escritas.some((e) => e.o === 'update' && e.v.inicio === '11:47'),
        JSON.stringify(escritas));

      // (d) sair do Check-in com rascunho: a navegação espera a resposta
      const bkpRasc = ctx.ciTemRascunhoNaoSalvo;
      try {
        ctx.ciTemRascunhoNaoSalvo = () => true;
        let seguiu = 0;
        check('com rascunho, o menu NÃO navega na hora',
          ctx.ciPodeSairDoCheckin(() => { seguiu++; }) === false && seguiu === 0);
        await passarAsVoltas(20);
        check('e só navega depois de a pessoa tocar em "Sair e perder o que preenchi"', seguiu === 1);
        seguiu = 0;
        await respondendo({ pergunta: false }, async () => {
          ctx.ciPodeSairDoCheckin(() => { seguiu++; });
          await passarAsVoltas(20);
        });
        check('quem toca em "Ficar e salvar" continua no Check-in', seguiu === 0);
        ctx.ciTemRascunhoNaoSalvo = () => false;
        seguiu = 0;
        check('sem rascunho, o menu navega direto, como sempre',
          ctx.ciPodeSairDoCheckin(() => { seguiu++; }) === true && seguiu === 1);
      } finally { ctx.ciTemRascunhoNaoSalvo = bkpRasc; }

      // (e) ciQuemRecebeu — nome de gente, ou nada é lançado
      const rec = await respondendo({ texto: 'Giullian' }, () => ctx.ciQuemRecebeu(['Roupa bege']));
      check('o nome de quem recebeu o material vem do cartaz', rec === 'Giullian', String(rec));
      const rec2 = await respondendo({ texto: '.', pergunta: true }, () => ctx.ciQuemRecebeu(['Roupa bege']));
      check('um ponto não é nome de gente — não passa', rec2 === null, String(rec2));
      const rec3 = await respondendo({ texto: '', pergunta: true }, () => ctx.ciQuemRecebeu(['Roupa bege']));
      check('em branco + "Cancelar o lançamento" devolve null (nada é salvo)', rec3 === null, String(rec3));
    } finally {
      ctx.audit = bkpJ.audit;
      ctx.salvarAtiv = bkpJ.salvarAtiv; ctx.renderAtiv = bkpJ.renderAtiv;
      ctx.quemSou = bkpJ.quemSou; ctx.horaAgora = bkpJ.horaAgora;
      vm.runInContext('DB = __bkpJ.DB;', ctx);
    }
  }
  console.log('');

  // ============================================================================
  // FINANCEIRO — a conta do dinheiro (financeiro-logica.js)
  //
  // Dinheiro é a única parte do app onde ser rápido é ser errado. Aqui a rede
  // é apertada de propósito: formato provado caractere a caractere, soma
  // conferida ao CENTAVO, mês vazio obrigado a devolver zero (nunca NaN) e
  // mordidas para cada jeito conhecido de a conta mentir calada.
  // ============================================================================
  console.log('Financeiro — a conta do dinheiro (financeiro-logica.js):');
  if (typeof ctx.finResumoMes !== 'function' || typeof ctx.finBRL !== 'function') {
    check('financeiro-logica.js carregado (sem ele o resto não roda)', false, 'faltam funções fin*');
  } else {
    // ---- 1) finBRL: a lei do formato (R$ 1.234,56, SEMPRE duas casas) ----
    check('finBRL(0) = "R$ 0,00" — zero é R$ 0,00, nunca "0" nem "R$ 0"',
      ctx.finBRL(0) === 'R$ 0,00', ctx.finBRL(0));
    check('finBRL(123456) = "R$ 1.234,56" — milhar com ponto, decimal com vírgula',
      ctx.finBRL(123456) === 'R$ 1.234,56', ctx.finBRL(123456));
    check('finBRL(100) = "R$ 1,00" — valor redondo mantém os centavos ",00"',
      ctx.finBRL(100) === 'R$ 1,00', ctx.finBRL(100));
    check('finBRL(5) = "R$ 0,05" — centavo sozinho não vira "R$ 0,5"',
      ctx.finBRL(5) === 'R$ 0,05', ctx.finBRL(5));
    check('finBRL(50) = "R$ 0,50"', ctx.finBRL(50) === 'R$ 0,50', ctx.finBRL(50));
    check('finBRL(999) = "R$ 9,99"', ctx.finBRL(999) === 'R$ 9,99', ctx.finBRL(999));
    check('finBRL(38700) = "R$ 387,00" — mensalidade Silver 1x',
      ctx.finBRL(38700) === 'R$ 387,00', ctx.finBRL(38700));
    check('finBRL(100000000) = "R$ 1.000.000,00" — dois pontos de milhar',
      ctx.finBRL(100000000) === 'R$ 1.000.000,00', ctx.finBRL(100000000));
    check('finBRL(-24000) = "-R$ 240,00" — o sinal vem ANTES do R$',
      ctx.finBRL(-24000) === '-R$ 240,00', ctx.finBRL(-24000));
    // mordida: lixo na entrada NUNCA pode virar "R$ NaN" na tela da Adriana
    check('mordida — finBRL(undefined/null/"abc"/NaN) nunca escreve NaN',
      ctx.finBRL(undefined) === 'R$ 0,00' && ctx.finBRL(null) === 'R$ 0,00' &&
      ctx.finBRL('abc') === 'R$ 0,00' && ctx.finBRL(NaN) === 'R$ 0,00',
      [ctx.finBRL(undefined), ctx.finBRL(null), ctx.finBRL('abc'), ctx.finBRL(NaN)].join(' / '));

    // ---- 2) finChave é a MESMA chave do app (pelKey) ----
    check('finChave é a mesma chave do app (pelKey) — senão o pagamento não acha o dono',
      ctx.finChave('Billy Paul', 'Juliana') === ctx.pelKey({ n: 'Billy Paul', tutor: 'Juliana' }) &&
      ctx.finChave('Hannah Clara', 'Adriana Duarte') === ctx.pelKey({ n: 'Hannah Clara', tutor: 'Adriana Duarte' }),
      ctx.finChave('Billy Paul', 'Juliana') + ' vs ' + ctx.pelKey({ n: 'Billy Paul', tutor: 'Juliana' }));

    // ---- 3) calendário da vigência (a regra da Adriana, 30/jul/2026) ----
    check('finFimVigencia("2026-08-05",6) = 2027-01-31 — semestral vale até o ÚLTIMO DIA do 6º mês',
      ctx.finFimVigencia('2026-08-05', 6) === '2027-01-31', ctx.finFimVigencia('2026-08-05', 6));
    check('finFimVigencia("2026-08-01",1) = 2026-08-31 — mensal termina no fim do próprio mês',
      ctx.finFimVigencia('2026-08-01', 1) === '2026-08-31', ctx.finFimVigencia('2026-08-01', 1));
    check('finUltimoDia("2026-02") = 2026-02-28 e ("2028-02") = 2028-02-29 (bissexto)',
      ctx.finUltimoDia('2026-02') === '2026-02-28' && ctx.finUltimoDia('2028-02') === '2028-02-29',
      ctx.finUltimoDia('2026-02') + ' / ' + ctx.finUltimoDia('2028-02'));
    check('finMesesDaVigencia("2026-08-01","2027-01-31") = 6 meses, virando o ano',
      ctx.finMesesDaVigencia('2026-08-01', '2027-01-31').join(',') ===
      '2026-08,2026-09,2026-10,2026-11,2026-12,2027-01',
      ctx.finMesesDaVigencia('2026-08-01', '2027-01-31').join(','));

    // ---- 4) finMensalidade: a MESMA fórmula do app, ao centavo ----
    check('Silver 5x, 1º peludinho = R$ 1.067,00 (tabela 2026)',
      ctx.finMensalidade(null, 'Silver', 5, 1) === 106700, String(ctx.finMensalidade(null, 'Silver', 5, 1)));
    check('Gold 2x, 1º = R$ 589,00', ctx.finMensalidade(null, 'Gold', 2, 1) === 58900,
      String(ctx.finMensalidade(null, 'Gold', 2, 1)));
    check('Black 1x, 1º = R$ 338,00', ctx.finMensalidade(null, 'Black', 1, 1) === 33800,
      String(ctx.finMensalidade(null, 'Black', 1, 1)));
    // 73700 * 93 / 100 = 68541 — conferido à mão
    check('Silver 3x, 2º peludinho (-7%) = R$ 685,41',
      ctx.finMensalidade(null, 'Silver', 3, 2) === 68541, String(ctx.finMensalidade(null, 'Silver', 3, 2)));
    // 35900 * 88 / 100 = 31592 — conferido à mão
    check('Gold 1x, 3º peludinho (-12%) = R$ 315,92',
      ctx.finMensalidade(null, 'Gold', 1, 3) === 31592, String(ctx.finMensalidade(null, 'Gold', 1, 3)));
    check('4º peludinho paga o mesmo desconto do 3º (12%), como no app',
      ctx.finMensalidade(null, 'Gold', 1, 4) === ctx.finMensalidade(null, 'Gold', 1, 3),
      String(ctx.finMensalidade(null, 'Gold', 1, 4)));
    // 38799 * 93 / 100 = 36083,07 -> 36083. Prova que arredonda AO CENTAVO e não deixa fração.
    check('arredonda ao centavo (38799 com -7% = 36083, não 36083,07)',
      ctx.finMensalidade({ X: { compromisso: 'mensal', valores: { 1: 38799 } } }, 'X', 1, 2) === 36083,
      String(ctx.finMensalidade({ X: { compromisso: 'mensal', valores: { 1: 38799 } } }, 'X', 1, 2)));
    // mordida: o que não dá para saber devolve null — NUNCA zero
    check('mordida — sem aulas válidas devolve null, nunca 0 (zero entraria calado na soma)',
      ctx.finMensalidade(null, 'Silver', 0, 1) === null &&
      ctx.finMensalidade(null, 'Silver', 6, 1) === null &&
      ctx.finMensalidade(null, 'Silver', null, 1) === null,
      [ctx.finMensalidade(null, 'Silver', 0, 1), ctx.finMensalidade(null, 'Silver', 6, 1)].join('/'));
    check('mordida — "auaulandia"/"avulso"/"morador" não têm mensalidade: null',
      ctx.finMensalidade(null, 'auaulandia', 3, 1) === null &&
      ctx.finMensalidade(null, 'avulso', 3, 1) === null &&
      ctx.finMensalidade(null, 'morador', 3, 1) === null);

    // ---- 5) mês sem dado nenhum = zeros, jamais NaN ----
    const vazio = ctx.finResumoMes({}, '2026-08');
    const numeros = [vazio.recebidoTotal, vazio.aReceberTotal, vazio.emAtrasoTotal,
      vazio.inadimplenciaTotal, vazio.declaradoTotal,
      vazio.porServico.daycare.aReceber, vazio.porServico.auaulandia.aReceber];
    check('mês sem dado: todo total é 0 e nenhum é NaN',
      numeros.every((n) => n === 0) && numeros.every((n) => typeof n === 'number' && !isNaN(n)),
      JSON.stringify(numeros));
    check('mês sem dado: listas vêm vazias (nunca undefined)',
      Array.isArray(vazio.porFILHOt) && vazio.porFILHOt.length === 0 &&
      Array.isArray(vazio.inadimplentes) && vazio.inadimplentes.length === 0);
    const semNada = ctx.finResumoMes(null, null);
    check('mordida — dados nulos e mês inválido não explodem: zeros + aviso',
      semNada.recebidoTotal === 0 && semNada.aReceberTotal === 0 && semNada.avisos.length > 0,
      JSON.stringify(semNada.avisos));
    check('mês sem lançamento nenhum avisa que "Recebido" é R$ 0,00 por falta de registro',
      vazio.avisos.join(' ').indexOf('R$ 0,00') >= 0, JSON.stringify(vazio.avisos));

    // ---- 6) caso montado: a soma bate AO CENTAVO ----
    // 3 aulunos, contas feitas à mão antes de escrever o teste:
    //   Silver 3x, 1º ................ 73.700
    //   Gold   2x, 1º = 58.900 x 3 ... 176.700
    //   Black  1x, 2º = 33.800 x0,93 = 31.434 x 6 ... 188.604
    //   TOTAL ........................ 439.004 centavos = R$ 4.390,04
    const CAD = {
      'a__x': { n: 'Ayla', tutor: 'Xuxa', dias: ['seg', 'qua', 'sex'],
        renov: { plano: 'Silver', inicio: '2026-08-01', fim: '2026-08-31', aulas: 3, ordemPet: 1 } },
      'b__y': { n: 'Bento', tutor: 'Yara', dias: ['ter', 'qui'],
        renov: { plano: 'Gold', inicio: '2026-08-10', fim: '2026-10-31', aulas: 2, ordemPet: 1 } },
      'c__z': { n: 'Caju', tutor: 'Zeca', dias: ['seg'],
        renov: { plano: 'Black', inicio: '2026-08-01', fim: '2027-01-31', aulas: 1, ordemPet: 2 } },
      // não cobram, cada um pelo seu motivo — e nenhum é "buraco de dado"
      'repolho__zeluz': { n: 'Repolho', tutor: 'Zêluz', renov: { plano: 'morador' } },
      'h__w': { n: 'Harry', tutor: 'Wanda', renov: { plano: 'auaulandia' } },
      'v__u': { n: 'Vito', tutor: 'Ubi', renov: { plano: 'avulso' } },
      'inativo__i': { n: 'Bud', tutor: 'Iara', inativo: 'Sim', dias: ['seg'],
        renov: { plano: 'Silver', inicio: '2026-08-01', fim: '2026-08-31', aulas: 1 } },
      // auluno com plano e data, mas SEM como saber as aulas: fica fora da soma
      'sem__aulas': { n: 'Nina', tutor: 'Sem Aulas',
        renov: { plano: 'Silver', inicio: '2026-08-01', fim: '2026-08-31' } }
    };
    const r1 = ctx.finResumoMes({ cadastro: CAD }, '2026-08');
    check('caixa: a receber de agosto = R$ 4.390,04 (soma conferida à mão)',
      r1.aReceberTotal === 439004 && ctx.finBRL(r1.aReceberTotal) === 'R$ 4.390,04',
      r1.aReceberTotal + ' / ' + ctx.finBRL(r1.aReceberTotal));
    check('sem nó de pagamento, "recebido" é exatamente R$ 0,00 (não se inventa caixa)',
      r1.recebidoTotal === 0);
    const somaLinhas = r1.porFILHOt.reduce((a, o) => a + o.falta, 0);
    check('a soma das linhas bate com o total, ao centavo',
      somaLinhas === r1.aReceberTotal, somaLinhas + ' vs ' + r1.aReceberTotal);
    check('todo valor da conta é inteiro em centavos (nenhuma fração escapou)',
      r1.porFILHOt.every((o) => Number.isInteger(o.valor) && Number.isInteger(o.pago) && Number.isInteger(o.falta)));
    check('morador, hóspede e avulso NÃO viram cobrança nem viram "falta de dado"',
      !r1.porFILHOt.some((o) => /repolho|h__w|v__u/.test(o.chave)) &&
      !r1.semComoCalcular.some((o) => /repolho|h__w|v__u/.test(o.chave)),
      JSON.stringify(r1.semComoCalcular.map((o) => o.chave)));
    check('quem saiu (inativo) não é cobrado', !r1.porFILHOt.some((o) => o.chave === 'inativo__i'));
    check('mordida — sem como saber as aulas, o FILHOt sai da soma E aparece listado (não vira R$ 0,00 calado)',
      !r1.porFILHOt.some((o) => o.chave === 'sem__aulas') &&
      r1.semComoCalcular.some((o) => o.chave === 'sem__aulas'),
      JSON.stringify(r1.semComoCalcular));
    check('o 2º peludinho da família pagou 7% a menos — R$ 314,34/mês, não R$ 338,00',
      (r1.porFILHOt.filter((o) => o.chave === 'c__z')[0] || {}).mensalidade === 31434,
      String((r1.porFILHOt.filter((o) => o.chave === 'c__z')[0] || {}).mensalidade));

    // ---- 7) pagamento lançado abate — e o parcial aparece como parcial ----
    const PAG = { '2026-08': {
      p1: { chave: 'a__x', valor_cent: 73700, data: '2026-08-03', forma: 'pix', quem: 'Amanda' },
      p2: { chave: 'b__y', valor_cent: 50000, data: '2026-08-10', forma: 'cartão', quem: 'Amanda' }
    } };
    const r2 = ctx.finResumoMes({ cadastro: CAD, pagamentos: PAG }, '2026-08');
    check('recebido = R$ 1.237,00 (73.700 + 50.000)',
      r2.recebidoTotal === 123700 && ctx.finBRL(r2.recebidoTotal) === 'R$ 1.237,00',
      ctx.finBRL(r2.recebidoTotal));
    check('a receber cai para R$ 3.153,04 (4.390,04 - 1.237,00)',
      r2.aReceberTotal === 315304 && ctx.finBRL(r2.aReceberTotal) === 'R$ 3.153,04',
      ctx.finBRL(r2.aReceberTotal));
    check('recebido + a receber = o devido do mês, ao centavo',
      r2.recebidoTotal + r2.aReceberTotal === r1.aReceberTotal);
    check('quem pagou tudo fica "pago"; quem pagou parte fica "parcial"',
      (r2.porFILHOt.filter((o) => o.chave === 'a__x')[0] || {}).situacao === 'pago' &&
      (r2.porFILHOt.filter((o) => o.chave === 'b__y')[0] || {}).situacao === 'parcial',
      JSON.stringify(r2.porFILHOt.map((o) => o.chave + ':' + o.situacao)));
    // mordida: pagar a mais não pode virar "a receber negativo"
    const r2b = ctx.finResumoMes({ cadastro: CAD,
      pagamentos: { '2026-08': { p: { chave: 'a__x', valor_cent: 99999900, data: '2026-08-03' } } } }, '2026-08');
    check('mordida — pagamento maior que a conta não gera "a receber" negativo',
      r2b.aReceberTotal >= 0 &&
      (r2b.porFILHOt.filter((o) => o.chave === 'a__x')[0] || {}).falta === 0,
      String(r2b.aReceberTotal));

    // ---- 8) caixa x competência: os dois existem, nenhum é escolhido calado ----
    const rComp = ctx.finResumoMes({ cadastro: CAD }, '2026-09', { regime: 'competencia' });
    check('competência: em setembro o Gold cobra UMA mensalidade (R$ 589,00), não o trimestre',
      (rComp.porFILHOt.filter((o) => o.chave === 'b__y')[0] || {}).valor === 58900,
      String((rComp.porFILHOt.filter((o) => o.chave === 'b__y')[0] || {}).valor));
    const rCaixaSet = ctx.finResumoMes({ cadastro: CAD }, '2026-09');
    check('caixa: em setembro não entra nada dos planos pagos em agosto',
      rCaixaSet.porFILHOt.filter((o) => o.servico === 'daycare').length === 0,
      JSON.stringify(rCaixaSet.porFILHOt.map((o) => o.chave)));
    check('mordida — os dois regimes NÃO dão o mesmo número (o app não pode escolher por conta própria)',
      rComp.aReceberTotal !== rCaixaSet.aReceberTotal,
      rComp.aReceberTotal + ' vs ' + rCaixaSet.aReceberTotal);

    // ---- 9) inadimplente = plano que venceu e ninguém renovou ----
    const rSet = ctx.finResumoMes({ cadastro: CAD }, '2026-09', { hoje: '2026-09-15' });
    check('em setembro, o Silver que venceu em 31/08 vira "em débito"',
      rSet.inadimplentes.some((o) => o.chave === 'a__x'), JSON.stringify(rSet.inadimplentes.map((o) => o.chave)));
    check('quem tem vigência até 31/10 ou 31/01 NÃO é inadimplente em setembro',
      !rSet.inadimplentes.some((o) => o.chave === 'b__y' || o.chave === 'c__z'));
    check('o débito cobrado é o de UM mês (R$ 737,00) — afirmar mais seria inventar',
      (rSet.inadimplentes.filter((o) => o.chave === 'a__x')[0] || {}).valorDeUmMes === 73700,
      String((rSet.inadimplentes.filter((o) => o.chave === 'a__x')[0] || {}).valorDeUmMes));
    check('plano vencido é população SEPARADA: entra em inadimplência, não em "a receber"',
      rSet.inadimplenciaTotal === 73700 && rSet.aReceberTotal === 0 &&
      rSet.inadimplentes[0].tipo === 'plano-vencido' &&
      rSet.inadimplentes[0].contaEmAReceber === false,
      ctx.finBRL(rSet.inadimplenciaTotal) + ' / ' + ctx.finBRL(rSet.aReceberTotal));

    // ---- 9b) MORDIDA CENTRAL: "em atraso" é RECORTE de "a receber", não parcela nova ----
    // Se um dia alguém somar os dois cards da tela, o número tem que continuar
    // verdadeiro. Aqui: em 15/08 as três cobranças de agosto (venc. 01/08, 10/08
    // e 01/08) já venceram, então "em atraso" tem que ser EXATAMENTE o "a receber".
    const rAtraso = ctx.finResumoMes({ cadastro: CAD }, '2026-08', { hoje: '2026-08-15' });
    check('"em atraso" é recorte de "a receber" — nunca maior que ele',
      rAtraso.emAtrasoTotal === rAtraso.aReceberTotal && rAtraso.emAtrasoTotal === 439004,
      ctx.finBRL(rAtraso.emAtrasoTotal) + ' vs ' + ctx.finBRL(rAtraso.aReceberTotal));
    // Em 05/08 o Gold (vence 10/08) ainda não venceu: sai do atraso, fica no a receber.
    const rAtraso2 = ctx.finResumoMes({ cadastro: CAD }, '2026-08', { hoje: '2026-08-05' });
    check('o que ainda não venceu fica fora do atraso (R$ 4.390,04 a receber, R$ 2.623,04 vencido)',
      rAtraso2.aReceberTotal === 439004 && rAtraso2.emAtrasoTotal === 262304,
      ctx.finBRL(rAtraso2.aReceberTotal) + ' / ' + ctx.finBRL(rAtraso2.emAtrasoTotal));
    check('mordida — pagou, some do atraso na mesma hora',
      ctx.finResumoMes({ cadastro: CAD, pagamentos: PAG }, '2026-08', { hoje: '2026-08-15' })
        .emAtrasoTotal === 315304);

    // ---- 10) plano DEDUZIDO nunca vira "declarado" ----
    const CAD2 = {
      'd__1': { n: 'Dado', tutor: 'Um', dias: ['seg'],
        renov: { plano: 'Silver', inicio: '2026-08-01', fim: '2026-08-31', aulas: 1, ordemPet: 1 } },
      'd__2': { n: 'Deduz', tutor: 'Dois', dias: ['seg'],
        renov: { plano: 'Silver', inicio: '2026-08-01', fim: '2026-08-31', aulas: 1, ordemPet: 1,
          plano_deduzido: true, plano_deduzido_meses: 1 } }
    };
    const r3 = ctx.finResumoMes({ cadastro: CAD2 }, '2026-08');
    check('a data lançada à mão conta como DECLARADO (R$ 387,00); a deduzida da planilha, não',
      r3.declaradoTotal === 38700, ctx.finBRL(r3.declaradoTotal));
    check('mordida — "declarado" nunca é somado em "recebido"',
      r3.recebidoTotal === 0 && r3.declaradoTotal > 0);

    // ---- 11) ordemPet ausente: assume 1º, mas AVISA (nada some calado) ----
    const CAD3 = { 'e__1': { n: 'Eco', tutor: 'Um', dias: ['seg', 'qua'],
      renov: { plano: 'Silver', inicio: '2026-08-01', fim: '2026-08-31', aulas: 2 } } };
    const r4 = ctx.finResumoMes({ cadastro: CAD3 }, '2026-08');
    check('sem o "Nº do peludinho na família", a conta assume 1º E avisa que pode estar alta',
      r4.ordemPetSuposta === 1 &&
      r4.porFILHOt[0].ordemPetSuposta === true &&
      r4.avisos.join(' ').indexOf('7%') >= 0, JSON.stringify(r4.avisos));

    // ---- 12) AuAulândia: as duas parcelas caem em meses diferentes ----
    const ORC = {
      o1: { status: 'fechado', status_em: new Date(2026, 7, 20, 10, 0, 0).getTime(),
        criado_em: new Date(2026, 7, 20, 9, 0, 0).getTime(),
        entrada: '2026-09-04', saida: '2026-09-08', noites: 4,
        total_cent: 43600, parcela1_cent: 21800, parcela2_cent: 21800,
        tutor: 'Caroline', pets: [{ nome: 'Juma', key: 'juma__caroline' }] },
      o2: { status: 'aguardando', criado_em: new Date(2026, 7, 25, 9, 0, 0).getTime(),
        entrada: '2026-10-01', saida: '2026-10-03', total_cent: 26000,
        parcela1_cent: 13000, parcela2_cent: 13000, tutor: 'Jeanine', pets: [{ nome: 'Romeo' }] },
      o3: { status: 'cancelado', status_em: new Date(2026, 7, 22, 9, 0, 0).getTime(),
        criado_em: new Date(2026, 7, 21, 9, 0, 0).getTime(),
        entrada: '2026-08-30', saida: '2026-08-31', total_cent: 13000,
        parcela1_cent: 6500, parcela2_cent: 6500, tutor: 'Ana', pets: [{ nome: 'Lua' }] }
    };
    const rA = ctx.finResumoMes({ orcamentos: ORC }, '2026-08');
    check('AuAulândia em agosto: só a parcela da reserva (R$ 218,00), não a reserva inteira',
      rA.porServico.auaulandia.aReceber === 21800 && rA.aReceberTotal === 21800,
      ctx.finBRL(rA.porServico.auaulandia.aReceber));
    const rB = ctx.finResumoMes({ orcamentos: ORC }, '2026-09');
    check('a 2ª parcela (R$ 218,00) cai em setembro, no mês da ENTRADA',
      rB.porServico.auaulandia.aReceber === 21800, ctx.finBRL(rB.porServico.auaulandia.aReceber));
    check('as duas parcelas somadas dão o total da reserva, ao centavo (R$ 436,00)',
      rA.porServico.auaulandia.aReceber + rB.porServico.auaulandia.aReceber === 43600);
    check('mordida — orçamento "aguardando" é proposta, NÃO entra em "a receber"',
      rA.propostasAbertas.quantas === 1 && rA.propostasAbertas.total === 26000 &&
      !rA.porFILHOt.some((o) => o.tutor === 'Jeanine'),
      JSON.stringify(rA.propostasAbertas));
    check('mordida — reserva CANCELADA não é dinheiro nenhum',
      !rA.porFILHOt.some((o) => o.tutor === 'Ana') && !rB.porFILHOt.some((o) => o.tutor === 'Ana'));
    check('a linha do dinheiro da hospedagem é por RESERVA, não por FILHOt',
      rA.porFILHOt.filter((o) => o.servico === 'auaulandia').length === 1);

    // ---- 13) finPagamentosDoMes: "ref" manda mais que "data" ----
    const pgRef = ctx.finPagamentosDoMes({ x: { chave: 'a__x', valor_cent: 100, data: '2026-09-02', ref: '2026-08' } }, '2026-08');
    check('pagamento atrasado com "ref" conta no mês a que se refere, não no dia em que caiu',
      pgRef.length === 1 && pgRef[0].valor_cent === 100, JSON.stringify(pgRef));
    const pgSemRef = ctx.finPagamentosDoMes({ x: { chave: 'a__x', valor_cent: 100, data: '2026-09-02' } }, '2026-08');
    check('sem "ref", vale o mês da data — e setembro não entra em agosto', pgSemRef.length === 0);

    // ---- 14) DADO REAL do banco: a conta não pode quebrar com a vida como ela é ----
    const [cadReal, orcReal] = await Promise.all([
      dbRead('daycare/cadastro', token),
      dbRead('auaulandia/orcamentos', token),
    ]);
    console.log('  cadastro real: ' + (cadReal ? Object.keys(cadReal).length : 0) + ' FILHOt(s)' +
      ' · orçamentos: ' + (orcReal ? Object.keys(orcReal).length : 0));
    if (cadReal) {
      const dadosReais = { cadastro: cadReal, orcamentos: orcReal || {},
        peludinhos: (typeof ctx.PELUDINHOS !== 'undefined' ? ctx.PELUDINHOS : []) };
      const meses = ['2026-06', '2026-07', '2026-08', '2026-09'];
      let tudoNumero = true, tudoInteiro = true, somaBate = true, recorteOk = true, det = '';
      meses.forEach((m) => {
        const r = ctx.finResumoMes(dadosReais, m, { hoje: '2026-08-31' });
        const tot = [r.recebidoTotal, r.aReceberTotal, r.emAtrasoTotal, r.inadimplenciaTotal, r.declaradoTotal];
        if (r.emAtrasoTotal > r.aReceberTotal) { recorteOk = false; det = m + ' atraso=' + r.emAtrasoTotal + ' > aReceber=' + r.aReceberTotal; }
        if (!tot.every((n) => typeof n === 'number' && !isNaN(n))) { tudoNumero = false; det = m + ' ' + JSON.stringify(tot); }
        if (!tot.every((n) => Number.isInteger(n))) { tudoInteiro = false; det = m + ' fração ' + JSON.stringify(tot); }
        const s = r.porFILHOt.reduce((a, o) => a + o.falta, 0);
        if (s !== r.aReceberTotal) { somaBate = false; det = m + ' linhas=' + s + ' total=' + r.aReceberTotal; }
        const porServ = r.porServico.daycare.aReceber + r.porServico.auaulandia.aReceber;
        if (porServ !== r.aReceberTotal) { somaBate = false; det = m + ' porServico=' + porServ + ' total=' + r.aReceberTotal; }
      });
      check('dado real: nenhum total vira NaN em nenhum mês', tudoNumero, det);
      check('dado real: todo total é inteiro em centavos (zero fração)', tudoInteiro, det);
      check('dado real: linhas e por-serviço batem com o total, ao centavo', somaBate, det);
      check('dado real: "em atraso" nunca passa de "a receber" (é recorte dele)', recorteOk, det);

      const rAgo = ctx.finResumoMes(dadosReais, '2026-08', { hoje: '2026-08-31' });
      check('dado real: "recebido" de agosto é R$ 0,00 — o banco não tem registro de pagamento',
        rAgo.recebidoTotal === 0, ctx.finBRL(rAgo.recebidoTotal));
      check('dado real: o dashboard avisa que não existe registro de pagamento',
        rAgo.avisos.join(' ').indexOf('Não existe registro de pagamento') >= 0,
        JSON.stringify(rAgo.avisos));
      check('dado real: nenhum morador, hóspede ou avulso entrou na cobrança do Day Care',
        !rAgo.porFILHOt.some((o) => o.servico === 'daycare' &&
          ['auaulandia', 'avulso', 'morador'].indexOf(o.plano) >= 0),
        JSON.stringify(rAgo.porFILHOt.filter((o) => o.servico === 'daycare').map((o) => o.plano).slice(0, 5)));
      console.log('  agosto/2026 (regime caixa) — a receber ' + ctx.finBRL(rAgo.aReceberTotal) +
        ' (Day Care ' + ctx.finBRL(rAgo.porServico.daycare.aReceber) +
        ' · AuAulândia ' + ctx.finBRL(rAgo.porServico.auaulandia.aReceber) + ')' +
        ' · em atraso ' + ctx.finBRL(rAgo.emAtrasoTotal) +
        ' · planos vencidos ' + ctx.finBRL(rAgo.inadimplenciaTotal) +
        ' · declarado ' + ctx.finBRL(rAgo.declaradoTotal) +
        ' · sem como calcular: ' + rAgo.semComoCalcular.length +
        ' · ordemPet suposta: ' + rAgo.ordemPetSuposta);
    } else {
      check('dado real do cadastro chegou', false, 'leitura devolveu null');
    }
  }
  console.log('');

  // ---- resumo ----
  console.log('== Resultado: ' + pass + ' ok, ' + fail + ' falha(s) ==');
  if (fail) { console.log('\nFalhas:'); fails.forEach((f) => console.log('  - ' + f)); }
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error('ERRO no harness:', e); process.exit(1); });
