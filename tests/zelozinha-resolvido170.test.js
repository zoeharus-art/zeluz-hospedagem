'use strict';
// Zelozinha: «se eu resolver antes, ela deixar» (Adriana, 30/out/2026) e o registro da equipe sem o painel antigo.
// Dados inventados, sem rede e sem banco de verdade.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const html = fs.readFileSync(path.resolve(__dirname, '../auaulandia/index.html'), 'utf8');

let falhas = 0, total = 0;
const fila = [];
function prova(nome, fn) { fila.push([nome, fn]); }

/* banco de mentira; a transação entrega primeiro null (como o SDK sem cache) e depois o valor real */
function bancoFalso(inicial) {
  const raiz = { v: JSON.parse(JSON.stringify(inicial || {})) };
  const partes = (p) => p.split('/').filter(Boolean);
  function ler(p) { let n = raiz.v; for (const k of partes(p)) { if (!n || typeof n !== 'object') return null; n = n[k]; } return n === undefined ? null : JSON.parse(JSON.stringify(n)); }
  function gravar(p, valor) { const ks = partes(p); let n = raiz.v; ks.slice(0, -1).forEach((k) => { if (!n[k] || typeof n[k] !== 'object') n[k] = {}; n = n[k]; }); if (valor === null) delete n[ks[ks.length - 1]]; else n[ks[ks.length - 1]] = JSON.parse(JSON.stringify(valor)); }
  return {
    ref(p) {
      return {
        once: async () => ({ key: partes(p).pop(), val: () => ler(p) }),
        transaction: async (fn) => {
          let novo = fn(null); const atual = ler(p);
          if (atual !== null) novo = fn(atual);
          if (novo === undefined) return { committed: false };
          if (novo === null && atual === null) return { committed: true };
          gravar(p, novo); return { committed: true };
        }
      };
    },
    ler, gravar
  };
}

function script(id) { const m = html.match(new RegExp('<script[^>]*id="' + id + '"[^>]*>([\\s\\S]*?)<\\/script>')); assert.ok(m, 'script ' + id); return m[1]; }
const ctx = { Intl, Date, JSON, Object, Array, Number, String, RegExp, Error, Promise, Math, Map, Set, setTimeout, clearTimeout, setInterval: () => 0, clearInterval: () => {} };
ctx.window = ctx; ctx.globalThis = ctx; ctx.self = ctx;
vm.createContext(ctx);
const ini = html.indexOf('/* mensagem-unica41/index.js */'), fim = html.indexOf('/* agrupador42/index.js */', ini);
vm.runInContext(html.slice(ini, fim), ctx);
vm.runInContext(script('zelozinha-simples'), ctx);
const ZS = ctx.ZelozinhaSimples;
const SEX = '2026-10-30', DC = 'mel__fulana';
const item = (estado) => ({ v: 1, dia: SEX, dcKey: DC, estado, texto: 'Texto fictício', para: '5500900000000', itens: [{ itemK: 'verm_dose2_p', vence: '2026-10-20' }] });

prova('cancelar só tira quem ainda está «pronto»; enviado, conferir e ausente não mudam', async () => {
  const db = bancoFalso({ daycare: { 'zelozinha-fila': { [SEX]: { [DC]: item('pronto'), outro: item('enviado'), terceiro: item('conferir') } } } });
  assert.equal(await ZS.cancelarSePronto(db, SEX, DC, 'A equipe já resolveu antes do envio (Tutor já fez).'), true);
  const it = db.ler(`${ZS.FILA}/${SEX}/${DC}`);
  assert.equal(it.estado, 'cancelado'); assert.equal(it.motivo, 'A equipe já resolveu antes do envio (Tutor já fez).');
  assert.equal(await ZS.cancelarSePronto(db, SEX, 'outro', 'x'), false); assert.equal(db.ler(`${ZS.FILA}/${SEX}/outro`).estado, 'enviado');
  assert.equal(await ZS.cancelarSePronto(db, SEX, 'terceiro', 'x'), false); assert.equal(db.ler(`${ZS.FILA}/${SEX}/terceiro`).estado, 'conferir');
  assert.equal(await ZS.cancelarSePronto(db, SEX, 'ninguem', 'x'), false, 'quem não está na fila não muda nada');
  assert.equal(db.ler(`${ZS.FILA}/${SEX}/ninguem`), null);
});

function montar(db, prevencoes) {
  const portas = { peludinhos: () => [{ n: 'Mel', tutor: 'Fulana' }], dcKey: () => DC, pelNome: (p) => p.n };
  const snapshot = () => ({ ok: true, ficha: { dcKey: DC, pelKey: 'mel__fulana', base: { tutor: 'Fulana' } }, prevencoes: prevencoes() });
  return { portas, f: ZS.criarFabrica({ db: () => db, hoje: () => SEX, snapshot, veterinaria: async () => false }) };
}

prova('na revisão, a ficha atualizada (cuidado já sem pendência) tira a mensagem «pronta» da fila', async () => {
  const db = bancoFalso({ daycare: { cadastro: { 'mel__fulana': { tutor: 'Fulana', tel: '(00) 90000-0000' } }, 'zelozinha-fila': { [SEX]: { [DC]: item('pronto') } } } });
  let prev = [];
  const { f, portas } = montar(db, () => prev);
  const recibo = { dia: SEX, dcKey: DC, nome: 'Mel', tutor: 'Fulana' };
  assert.equal((await f.receber(recibo, portas, { monId: 'aparelho' })).status, 'sem-cuidados', 'sem revisão, só olha');
  assert.equal(db.ler(`${ZS.FILA}/${SEX}/${DC}`).estado, 'pronto');
  assert.equal((await f.receber(Object.assign({ revisar: true }, recibo), portas, { monId: 'aparelho' })).status, 'resolvido-antes');
  assert.equal(db.ler(`${ZS.FILA}/${SEX}/${DC}`).estado, 'cancelado');
  /* com o cuidado ainda pendente, a revisão não tira ninguém */
  const db2 = bancoFalso({ daycare: { cadastro: { 'mel__fulana': { tutor: 'Fulana', tel: '(00) 90000-0000' } }, 'zelozinha-fila': { [SEX]: { [DC]: item('pronto') } } } });
  prev = [{ itemK: 'verm_dose2_p', dueDate: '2026-10-20' }];
  const m2 = montar(db2, () => prev);
  assert.equal((await m2.f.receber(Object.assign({ revisar: true }, recibo), m2.portas, { monId: 'aparelho' })).status, 'ja-estava-na-fila');
  assert.equal(db2.ler(`${ZS.FILA}/${SEX}/${DC}`).estado, 'pronto');
});

prova('a fila que se completa revisa de 10 em 10 min lendo a fila do dia e olhando de novo só quem está «pronto»', async () => {
  const db = bancoFalso({ daycare: { cadastro: { 'mel__fulana': { tutor: 'Fulana', tel: '(00) 90000-0000' } }, 'zelozinha-fila': { [SEX]: { [DC]: item('pronto') } } } });
  let prev = [{ itemK: 'verm_dose2_p', dueDate: '2026-10-20' }], relogio = null, mapaFn = null, leituras = 0;
  const { f, portas } = montar(db, () => prev);
  const salvo = ctx.setInterval; ctx.setInterval = (fn) => { relogio = fn; return 1; };
  const c = ZS.criarCompletar({ fabrica: f, hoje: () => SEX, portas: () => portas, ator: () => ({ monId: 'aparelho' }), esperaMs: 60000,
    mapaVivo: (cam, vaga, fn) => { mapaFn = fn; }, lerFila: async (d) => { leituras++; return db.ler(`${ZS.FILA}/${d}`) || {}; } });
  try { c.ligar(); } finally { ctx.setInterval = salvo; }
  mapaFn({ [DC]: { tipo: 'entrada', fim: 1, quem: 'Pessoa Fictícia', nome: 'Mel', tutor: 'Fulana' } });
  await c.rodar();
  assert.equal(c._e.feitos[DC], 'ja-estava-na-fila'); assert.equal(leituras, 0, 'fora da revisão, não lê a fila');
  prev = [];   /* a equipe atualizou a ficha: o cuidado deixou de estar pendente */
  await c.rodar(); assert.equal(db.ler(`${ZS.FILA}/${SEX}/${DC}`).estado, 'pronto', 'quem já estava na fila só é revisto no relógio');
  assert.equal(await c.revisarAgora(), 0); assert.equal(leituras, 1);
  assert.equal(db.ler(`${ZS.FILA}/${SEX}/${DC}`).estado, 'cancelado'); assert.equal(c._e.feitos[DC], 'resolvido-antes');
  assert.equal(typeof relogio, 'function');
  c.desligar();
});

prova('a página: registro da equipe sem o painel antigo, resposta e agendamento tiram da fila', () => {
  assert.match(html, /async function enviosCorrespondentes\(c,p\)\{[\s\S]{0,400}if\(!p\|\|p\.dia!==c\.dia\)return \[\];/);
  assert.match(html, /if\(salvos\.length&&window\.ZelozinhaSimples&&typeof window\.ZelozinhaSimples\.cancelarSePronto==='function'\)window\.ZelozinhaSimples\.cancelarSePronto\(DB,c\.dia,dc,/);
  assert.match(html, /cancelarSePronto\(DB,c\.dia,c\.dcKey,'A equipe agendou o cuidado antes do envio\.'\)/);
  assert.match(html, /lerFila:function\(d\)\{var db=dbAtual\(\);return db\?db\.ref\('daycare\/zelozinha-fila\/'\+d\)\.once\('value'\)/);
  assert.match(html, /'resolvido-antes':'saiu da fila da Zelozinha: o cuidado foi resolvido antes do envio'/);
  assert.match(html, /const APP_VERSAO='2026-10-30-04';/);
});

(async () => {
  for (const [nome, fn] of fila) {
    total++;
    try { await fn(); console.log('  ok  ' + nome); } catch (e) { falhas++; console.log('  FALHOU  ' + nome + '\n    ' + (e && e.stack || e)); }
  }
  console.log(`zelozinha-resolvido170: ${total - falhas} de ${total} provas passaram`);
  if (falhas) process.exit(1);
})();
