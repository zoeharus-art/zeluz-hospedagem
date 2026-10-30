'use strict';
// Zelozinha: a fila se completa sozinha, os vencimentos descem quando faltam e a veterinária vale pela agenda
// (Adriana, 30/out/2026). Dados inventados, sem rede e sem banco de verdade.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const html = fs.readFileSync(path.resolve(__dirname, '../auaulandia/index.html'), 'utf8');

let falhas = 0, total = 0;
const fila = [];
function prova(nome, fn) { fila.push([nome, fn]); }

/* ---------- banco de mentira: só o que a fábrica usa (once e transaction) ---------- */
function bancoFalso(inicial) {
  const raiz = { v: JSON.parse(JSON.stringify(inicial || {})) };
  const partes = (p) => p.split('/').filter(Boolean);
  function ler(p) { let n = raiz.v; for (const k of partes(p)) { if (!n || typeof n !== 'object') return null; n = n[k]; } return n === undefined ? null : JSON.parse(JSON.stringify(n)); }
  function gravar(p, valor) { const ks = partes(p); let n = raiz.v; ks.slice(0, -1).forEach((k) => { if (!n[k] || typeof n[k] !== 'object') n[k] = {}; n = n[k]; }); n[ks[ks.length - 1]] = JSON.parse(JSON.stringify(valor)); }
  const db = {
    transacoes: 0,
    ref(p) {
      return {
        once: async () => ({ key: partes(p).pop(), val: () => ler(p) }),
        transaction: async (fn) => { db.transacoes++; const novo = fn(ler(p)); if (novo === undefined) return { committed: false }; gravar(p, novo); return { committed: true }; }
      };
    },
    ler, gravar
  };
  return db;
}

/* ---------- o módulo do app, rodado como no navegador ---------- */
function script(id) { const m = html.match(new RegExp('<script[^>]*id="' + id + '"[^>]*>([\\s\\S]*?)<\\/script>')); assert.ok(m, 'script ' + id); return m[1]; }
const ctx = { Intl, Date, JSON, Object, Array, Number, String, RegExp, Error, Promise, Math, Map, Set, setTimeout, clearTimeout, setInterval: () => 0, clearInterval: () => {} };
ctx.window = ctx; ctx.globalThis = ctx; ctx.self = ctx;
vm.createContext(ctx);
const ini = html.indexOf('/* mensagem-unica41/index.js */'), fim = html.indexOf('/* agrupador42/index.js */', ini);
assert.ok(ini > 0 && fim > ini, 'o texto aprovado (mensagem-unica41) está na página');
vm.runInContext(html.slice(ini, fim), ctx);
vm.runInContext(script('zelozinha-simples'), ctx);
const ZS = ctx.ZelozinhaSimples;

const SEG = '2026-11-02', TER = '2026-11-03', QUA = '2026-11-04', QUI = '2026-11-05', SEX = '2026-11-06', SAB = '2026-11-07', DOM = '2026-11-08';
const TEL = '(00) 90000-0000';
/* três FILHOts inventados: um com vermífugo vencendo, um sem nada e um só com vacina */
const PETS = {
  'bolinha__familia-um': { n: 'Bolinha', tutor: 'Família Um', pelKey: 'bolinha__familia um', prev: [{ itemK: 'verm_p', dueDate: SEG }] },
  'pipoca__familia-dois': { n: 'Pipoca', tutor: 'Família Dois', pelKey: 'pipoca__familia dois', prev: [] },
  'farofa__familia-tres': { n: 'Farofa', tutor: 'Família Três', pelKey: 'farofa__familia tres', prev: [{ itemK: 'vac_raiva_p', dueDate: SEG }] }
};
const cadastro = () => {
  const c = {};
  Object.keys(PETS).forEach((k) => { c[PETS[k].pelKey] = { n: PETS[k].n, tutor: PETS[k].tutor, tel: TEL }; });
  return { daycare: { cadastro: c } };
};
const portas = (extra) => Object.assign({ peludinhos: () => Object.keys(PETS).map((k) => ({ n: PETS[k].n, tutor: PETS[k].tutor, dc: k })), dcKey: (n, t) => Object.keys(PETS).find((k) => PETS[k].n === n && PETS[k].tutor === t), pelNome: (p) => p.n }, extra || {});
const snapshot = (r) => { const p = PETS[r.dcKey]; return p ? { ok: true, ficha: { dcKey: r.dcKey, pelKey: p.pelKey, base: { tutor: p.tutor } }, prevencoes: p.prev } : { ok: false, motivo: 'FILHOt fora do catálogo' }; };
const checkin = (k, extra) => Object.assign({ tipo: 'entrada', fim: 1, quem: 'Pessoa Fictícia', nome: PETS[k] ? PETS[k].n : 'Outro', tutor: PETS[k] ? PETS[k].tutor : 'Outra' }, extra || {});

prova('veterinária pela agenda: segunda, terça, quarta e sexta; quinta e fim de semana, não', () => {
  [SEG, TER, QUA, SEX].forEach((d) => assert.equal(ZS.veterinariaNoDia(d, null), true, d));
  [QUI, SAB, DOM].forEach((d) => assert.equal(ZS.veterinariaNoDia(d, null), false, d));
  assert.equal(ZS.veterinariaNoDia(SEX, { ok: true, dia: SEX, confirmada: false, tipo: 'indisponivel' }), false, 'quem registrou que ela não veio tira a vacina');
  assert.equal(ZS.veterinariaNoDia(SEX, { ok: true, dia: SEX, confirmada: false, tipo: 'saida' }), false);
  assert.equal(ZS.veterinariaNoDia(SEX, { ok: true, dia: QUI, confirmada: false, tipo: 'indisponivel' }), true, 'registro de outro dia não vale');
  assert.equal(ZS.veterinariaNoDia(SEX, { ok: false, confirmada: false, indisponivel: true }), true, 'sem registro do dia vale a agenda');
  assert.equal(ZS.veterinariaNoDia(QUI, { ok: true, dia: QUI, confirmada: true, tipo: 'confirmada' }), false, 'na quinta, nunca');
  assert.equal(ZS.veterinariaNoDia('ontem', null), false);
});

prova('com a veterinária pela agenda, a vacina entra na mensagem de sexta', async () => {
  const db = bancoFalso(cadastro());
  const f = ZS.criarFabrica({ db: () => db, hoje: () => SEX, snapshot: (r) => Object.assign(snapshot(r), { prevencoes: [{ itemK: 'vac_raiva_p', dueDate: SEX }] }), veterinaria: async (d) => ZS.veterinariaNoDia(d, null) });
  const r = await f.receber({ dia: SEX, dcKey: 'farofa__familia-tres', nome: 'Farofa', tutor: 'Família Três' }, portas(), { monId: 'pessoa' });
  assert.equal(r.status, 'na-fila');
  assert.deepEqual(db.ler(`${ZS.FILA}/${SEX}/farofa__familia-tres`).itens.map((x) => x.itemK), ['vac_raiva_p']);
});

prova('vencimentos que faltam descem antes de montar; cada resultado vai para o registro', async () => {
  const db = bancoFalso(cadastro());
  let prontos = false, cargas = 0;
  const reg = [];
  const f = ZS.criarFabrica({ db: () => db, hoje: () => SEG, veterinaria: async () => false,
    snapshot: (r) => (prontos ? snapshot(r) : { ok: false, motivo: 'cadastro ou vencimentos ainda não carregados' }),
    carregarVencimentos: async () => { cargas++; prontos = true; },
    registrar: (recibo, res, origem) => reg.push([recibo.dcKey, res.status, origem]) });
  const p = portas({ vencimentosProntos: () => prontos });
  const r = await f.receber({ dia: SEG, dcKey: 'bolinha__familia-um', nome: 'Bolinha', tutor: 'Família Um' }, p, { monId: 'pessoa' });
  assert.equal(r.status, 'na-fila'); assert.equal(cargas, 1);
  assert.deepEqual(reg, [['bolinha__familia-um', 'na-fila', 'check-in']]);
  /* sem o carregador, segue como antes: pendente, e a ponte avisa a recepção */
  const velho = ZS.criarFabrica({ db: () => db, hoje: () => SEG, veterinaria: async () => false, snapshot: () => ({ ok: false, motivo: 'cadastro ou vencimentos ainda não carregados' }) });
  const v = await velho.receber({ dia: SEG, dcKey: 'pipoca__familia-dois' }, p, {});
  assert.equal(v.ok, false); assert.match(v.motivo, /vencimentos/);
  /* com os vencimentos prontos e a conferência recusando, não recarrega à toa */
  prontos = true; cargas = 0;
  const recusa = ZS.criarFabrica({ db: () => db, hoje: () => SEG, veterinaria: async () => false, snapshot: () => ({ ok: false, motivo: 'outra coisa' }), carregarVencimentos: async () => { cargas++; } });
  assert.match((await recusa.receber({ dia: SEG, dcKey: 'pipoca__familia-dois' }, p, {})).motivo, /outra coisa/);
  assert.equal(cargas, 0);
});

function montarCompletar(db, hoje, extra) {
  const mapas = {}, desligados = [], recebidos = [];
  const fab = ZS.criarFabrica({ db: () => db, hoje: () => hoje.dia, snapshot, veterinaria: async (d) => ZS.veterinariaNoDia(d, null) });
  const espiao = { receber: (r, p, a) => { recebidos.push(r.dcKey); assert.equal(r.origem, 'completar'); return fab.receber(r, p, a); } };
  const c = ZS.criarCompletar(Object.assign({ fabrica: espiao, hoje: () => hoje.dia, portas: () => portas(), ator: () => ({ monId: 'aparelho' }), esperaMs: 0,
    mapaVivo: (caminho, vaga, fn) => { mapas[caminho] = fn; assert.equal(vaga, '_zelozinhaCompletar'); },
    desligarMapa: (caminho) => desligados.push(caminho) }, extra || {}));
  return { c, mapas, desligados, recebidos };
}

prova('a fila se completa sozinha: quem tem check-in e cuidado entra; vários aparelhos não duplicam', async () => {
  const db = bancoFalso(cadastro()), hoje = { dia: SEG };
  const a = montarCompletar(db, hoje), b = montarCompletar(db, hoje);
  a.c.ligar(); b.c.ligar();
  const caminho = `daycare/checkin-corpo/${SEG}`;
  assert.ok(a.mapas[caminho], 'usa o mapa vivo dos check-ins do dia');
  a.mapas[caminho]({ 'bolinha__familia-um': checkin('bolinha__familia-um'), 'pipoca__familia-dois': checkin('pipoca__familia-dois'), 'farofa__familia-tres': checkin('farofa__familia-tres', { tipo: 'outra' }) });
  assert.equal(await a.c.rodar(), 1, 'só o FILHOt com cuidado entra');
  const it = db.ler(`${ZS.FILA}/${SEG}/bolinha__familia-um`);
  assert.equal(it.estado, 'pronto'); assert.equal(it.criadoPor, 'aparelho'); assert.match(it.texto, /^Bom dia, Família Um!/);
  assert.ok(!a.recebidos.includes('farofa__familia-tres'), 'registro que não é de entrada fica de fora');
  /* o outro aparelho vê o mesmo mapa: nada duplica */
  b.mapas[caminho]({ 'bolinha__familia-um': checkin('bolinha__familia-um') });
  assert.equal(await b.c.rodar(), 0);
  assert.equal(Object.keys(db.ler(`${ZS.FILA}/${SEG}`)).length, 1);
  /* quem já está na fila não é refeito; quem não tinha cuidado é olhado de novo no próximo check-in */
  a.recebidos.length = 0;
  a.mapas[caminho]({ 'bolinha__familia-um': checkin('bolinha__familia-um'), 'pipoca__familia-dois': checkin('pipoca__familia-dois'), 'farofa__familia-tres': checkin('farofa__familia-tres') });
  assert.equal(await a.c.rodar(), 1, 'a vacina de segunda entra (veterinária pela agenda)');
  assert.deepEqual(a.recebidos.sort(), ['farofa__familia-tres', 'pipoca__familia-dois']);
  assert.deepEqual(db.ler(`${ZS.FILA}/${SEG}/farofa__familia-tres`).itens.map((x) => x.itemK), ['vac_raiva_p']);
});

prova('a fila que se completa: sem login não faz nada; telefone corrigido entra na volta seguinte', async () => {
  const base = cadastro();
  base.daycare.cadastro['bolinha__familia um'].tel = '';
  const db = bancoFalso(base), hoje = { dia: SEG };
  let logado = false;
  const a = montarCompletar(db, hoje, { ator: () => (logado ? { monId: 'aparelho' } : {}) });
  a.c.ligar();
  a.mapas[`daycare/checkin-corpo/${SEG}`]({ 'bolinha__familia-um': checkin('bolinha__familia-um') });
  assert.equal(await a.c.rodar(), 0); assert.equal(a.recebidos.length, 0, 'sem pessoa logada, nada');
  logado = true;
  assert.equal(await a.c.rodar(), 0, 'sem telefone, não entra'); assert.equal(db.ler(`${ZS.FILA}/${SEG}`), null);
  db.gravar('daycare/cadastro/bolinha__familia um/tel', TEL);
  assert.equal(await a.c.rodar(), 1, 'com o telefone na ficha, entra');
});

prova('a fila que se completa troca de dia sozinha e desliga o mapa de ontem', async () => {
  const db = bancoFalso(cadastro()), hoje = { dia: SEG };
  let relogio = null;
  const a = montarCompletar(db, hoje);
  const salvo = ctx.setInterval;
  ctx.setInterval = (fn) => { relogio = fn; return 1; };
  try { a.c.ligar(); } finally { ctx.setInterval = salvo; }
  assert.equal(typeof relogio, 'function');
  hoje.dia = TER; relogio();
  assert.ok(a.mapas[`daycare/checkin-corpo/${TER}`], 'liga o mapa do dia novo');
  assert.deepEqual(a.desligados, [`daycare/checkin-corpo/${SEG}`]);
  /* o mapa de ontem chegando atrasado não põe ninguém na fila de hoje */
  a.mapas[`daycare/checkin-corpo/${SEG}`]({ 'bolinha__familia-um': checkin('bolinha__familia-um') });
  assert.equal(await a.c.rodar(), 0);
  a.c.desligar();
  assert.deepEqual(a.desligados, [`daycare/checkin-corpo/${SEG}`, `daycare/checkin-corpo/${TER}`]);
});

prova('a página: veterinária pela agenda, vencimentos sob demanda, registro e fila que se completa', () => {
  assert.match(html, /return root\.ZelozinhaSimples\.veterinariaNoDia\(d,x\);/);
  assert.match(html, /carregarVencimentos:function\(\)\{[^\n]*vencPendCarregar\(true\)/);
  assert.match(html, /audit\('zelozinha-fila',/);
  assert.match(html, /estado\.completar=root\.ZelozinhaSimples\.criarCompletar\(\{/);
  assert.match(html, /estado\.completar\.ligar\(\);/);
  /* a ponte não depende mais do instalador antigo: ela é instalada fora do try dele */
  const ini2 = html.indexOf('function tentar(){'), fim2 = html.indexOf('function bancoPronto(){', ini2), tentar = html.slice(ini2, fim2);
  assert.ok(tentar.indexOf('}catch(_){api=null;}') > 0 && tentar.indexOf('}catch(_){api=null;}') < tentar.indexOf('root.zelozinha42Instalar(estado.fabrica)'));
  assert.match(html, /const APP_VERSAO='2026-10-30-02';/);
  assert.equal(html.split('2026-10-30-02').length - 1, 11);
});

(async () => {
  for (const [nome, fn] of fila) {
    total++;
    try { await fn(); console.log('  ok  ' + nome); } catch (e) { falhas++; console.log('  FALHOU  ' + nome + '\n    ' + (e && e.stack || e)); }
  }
  console.log(`zelozinha-fila-completa167: ${total - falhas} de ${total} provas passaram`);
  if (falhas) process.exit(1);
})();
