'use strict';
// Zelozinha: «Agendou para» (Adriana, 30/out/2026; maquete aprovada). Dados inventados, sem rede e sem banco de verdade.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const html = fs.readFileSync(path.resolve(__dirname, '../auaulandia/index.html'), 'utf8');

let falhas = 0, total = 0;
const fila = [];
function prova(nome, fn) { fila.push([nome, fn]); }

/* ---------- banco de mentira: set, update, remove, transaction, once e on('value') ---------- */
function bancoFalso(inicial) {
  const raiz = { v: JSON.parse(JSON.stringify(inicial || {})) }, ouvintes = [];
  const partes = (p) => p.split('/').filter(Boolean);
  function ler(p) { let n = raiz.v; for (const k of partes(p)) { if (!n || typeof n !== 'object') return null; n = n[k]; } return n === undefined ? null : JSON.parse(JSON.stringify(n)); }
  function gravar(p, valor) {
    const ks = partes(p); let n = raiz.v;
    ks.slice(0, -1).forEach((k) => { if (!n[k] || typeof n[k] !== 'object') n[k] = {}; n = n[k]; });
    if (valor === null) delete n[ks[ks.length - 1]]; else n[ks[ks.length - 1]] = JSON.parse(JSON.stringify(valor));
    ouvintes.forEach((o) => { if ((p + '/').startsWith(o.p + '/') || (o.p + '/').startsWith(p + '/')) o.fn({ val: () => ler(o.p) }); });
  }
  return {
    ref(p) {
      return {
        once: async () => ({ key: partes(p).pop(), val: () => ler(p) }),
        set: async (v) => gravar(p, v),
        update: async (o) => { Object.keys(o).forEach((k) => gravar(p + '/' + k, o[k])); },
        remove: async () => gravar(p, null),
        transaction: async (fn) => { const novo = fn(ler(p)); if (novo === undefined) return { committed: false }; gravar(p, novo); return { committed: true }; },
        on: (ev, fn) => { ouvintes.push({ p, fn }); fn({ val: () => ler(p) }); }
      };
    },
    ler, gravar
  };
}

/* ---------- os módulos do app, rodados como no navegador ---------- */
function script(id) { const m = html.match(new RegExp('<script[^>]*id="' + id + '"[^>]*>([\\s\\S]*?)<\\/script>')); assert.ok(m, 'script ' + id); return m[1]; }
const ctx = { Intl, Date, JSON, Object, Array, Number, String, RegExp, Error, Promise, Math, Map, Set, setTimeout, clearTimeout, setInterval: () => 0, clearInterval: () => {},
  DASH_QTD_PIP: [{ v: 'PIPETA', t: 'Pipeta (o tubo inteiro)' }, { v: '1 COMPRIMIDO', t: '1 comprimido' }], DASH_ONDE: [{ v: 'LOJA', t: 'Comprado aqui na loja' }, { v: '', t: 'Nada a observar' }] };
ctx.window = ctx; ctx.globalThis = ctx; ctx.self = ctx;
vm.createContext(ctx);
const ini = html.indexOf('/* mensagem-unica41/index.js */'), fim = html.indexOf('/* agrupador42/index.js */', ini);
vm.runInContext(html.slice(ini, fim), ctx);
vm.runInContext(script('zelozinha-agenda'), ctx);
vm.runInContext(script('zelozinha-simples'), ctx);
const ZA = ctx.ZelozinhaAgenda, ZS = ctx.ZelozinhaSimples;

const SEX = '2026-10-30', SAB = '2026-10-31', DOM = '2026-11-01', TER = '2026-11-03', QUI = '2026-11-05';
const base = { hoje: SEX, dcKey: 'biscoito__ciclano', pelKey: 'biscoito__ciclano', nome: 'Biscoito', tutor: 'Ciclano', por: 'Consultora' };

prova('a data: depois de hoje, nunca no domingo; vacina só nos dias da veterinária', () => {
  assert.match(ZA.validarData(SEX, SEX, 'verm_p').motivo, /depois de hoje/);
  assert.match(ZA.validarData(SEX, '2026-10-29', 'verm_p').motivo, /depois de hoje/);
  assert.match(ZA.validarData(SEX, DOM, 'verm_p').motivo, /não abre aos domingos/);
  assert.equal(ZA.validarData(SEX, SAB, 'verm_p').ok, true, 'sábado a Zêluz abre');
  assert.match(ZA.validarData(SEX, SAB, 'vac_mult_p').motivo, /veterinária não vem/);
  assert.match(ZA.validarData(SEX, QUI, 'vac_raiva_p').motivo, /veterinária não vem/);
  assert.equal(ZA.validarData(SEX, TER, 'vac_raiva_p').ok, true);
  assert.match(ZA.validarData(SEX, '', 'verm_p').motivo, /Escolha o dia/);
});

prova('agendar o carrapaticida pede a pipeta ou a quantidade; grava, desfaz e confirma o horário', async () => {
  const db = bancoFalso();
  await ZA.carregar(db);
  assert.match((await ZA.agendar(db, Object.assign({}, base, { para: TER, itemK: 'ecto_p' }))).motivo, /pipeta ou a quantidade/);
  const r = await ZA.agendar(db, Object.assign({}, base, { para: TER, itemK: 'ecto_p', qtd: 'PIPETA', onde: 'LOJA' }));
  assert.equal(r.ok, true);
  const reg = db.ler('daycare/agendamentos/biscoito__ciclano/ecto_p');
  assert.equal(reg.para, TER); assert.equal(reg.qtd, 'PIPETA'); assert.equal(reg.onde, 'LOJA'); assert.equal(reg.diaOrigem, SEX); assert.equal(reg.por, 'Consultora');
  assert.equal(ZA.de('biscoito__ciclano', 'ecto_p').para, TER, 'a agenda em memória acompanha o banco');
  assert.equal(ZA.escolhasTexto(reg), 'Pipeta (o tubo inteiro) · Comprado aqui na loja');
  assert.equal(ZA.rotuloSelo(reg, SEX), 'AGENDADO · 03/11');
  assert.match(ZA.motivoSelo(reg, SEX), /^Vai para o lançamento de terça, 03\/11, para confirmar o horário\.$/);
  assert.equal(ZA.rotuloSelo(reg, TER), 'AGENDADO PARA HOJE');
  assert.match(ZA.infoHTML(reg, SEX, 0), /agendar-desfazer/); assert.ok(!/agendar-desfazer/.test(ZA.infoHTML(reg, TER, 0)), 'no próprio dia não se desfaz pelo cartão');
  assert.match((await ZA.confirmarHorario(db, 'biscoito__ciclano', 'ecto_p', '9h', 'Consultora')).motivo, /horário/);
  assert.equal((await ZA.confirmarHorario(db, 'biscoito__ciclano', 'ecto_p', '09:30', 'Consultora')).ok, true);
  assert.equal(db.ler('daycare/agendamentos/biscoito__ciclano/ecto_p/horario'), '09:30');
  const lanc = ZA.lancamentoHTML(TER);
  assert.match(lanc, /Agendados para este dia \(1\)/); assert.match(lanc, /Biscoito · Ciclano/); assert.match(lanc, /Carrapaticida · Pipeta \(o tubo inteiro\)/);
  assert.match(lanc, /Horário confirmado · 09:30/); assert.match(lanc, /Agendado na Zelozinha em 30\/10 por Consultora/);
  assert.equal(ZA.lancamentoHTML(SAB), '', 'outro dia não mostra nada');
  assert.equal(await ZA.desfazer(db, 'biscoito__ciclano', 'ecto_p'), true);
  assert.equal(db.ler('daycare/agendamentos/biscoito__ciclano/ecto_p'), null); assert.equal(ZA.de('biscoito__ciclano', 'ecto_p'), null);
});

prova('o formulário: data, e no carrapaticida as escolhas de pipeta/quantidade e onde', () => {
  const ecto = ZA.formHTML('ecto_p', SEX, 2, { data: TER, qtd: 'PIPETA', onde: 'LOJA', erro: 'Algo faltou.' });
  assert.match(ecto, /Para qual dia\?/); assert.match(ecto, /type="date"[^>]*value="2026-11-03"[^>]*min="2026-10-30"/);
  assert.match(ecto, /Qual produto\/quantidade\?/); assert.match(ecto, /data-zt694-valor="PIPETA"[^>]*aria-pressed="true"/);
  assert.match(ecto, /data-zt694-agenda-erro>Algo faltou\./); assert.match(ecto, /data-zt694-acao="agendar-salvar" data-zt694-ciclo="2"/);
  assert.ok(!/Qual produto/.test(ZA.formHTML('verm_p', SEX, 0, {})), 'vermífugo não pede pipeta');
});

prova('a Zelozinha não manda mensagem de cuidado agendado; sem agendamento, manda', async () => {
  const db = bancoFalso({ daycare: { cadastro: { 'biscoito__ciclano': { n: 'Biscoito', tutor: 'Ciclano', tel: '(00) 90000-0000' } } } });
  await ZA.carregar(db);
  await ZA.agendar(db, Object.assign({}, base, { para: TER, itemK: 'verm_p' }));
  const portas = { peludinhos: () => [{ n: 'Biscoito', tutor: 'Ciclano' }], dcKey: () => 'biscoito__ciclano', pelNome: (p) => p.n };
  const snapshot = () => ({ ok: true, ficha: { dcKey: 'biscoito__ciclano', pelKey: 'biscoito__ciclano', base: { tutor: 'Ciclano' } }, prevencoes: [{ itemK: 'verm_p', dueDate: SEX }] });
  const f = ZS.criarFabrica({ db: () => db, hoje: () => SEX, snapshot, veterinaria: async () => false,
    agendaPronta: () => ZA.carregar(db), agendado: (dc, k, d) => ZA.bloqueiaMensagem(dc, k, d) });
  const r = await f.receber({ dia: SEX, dcKey: 'biscoito__ciclano', nome: 'Biscoito', tutor: 'Ciclano' }, portas, { monId: 'pessoa' });
  assert.equal(r.status, 'sem-cuidados'); assert.match(r.motivo, /agendado/);
  assert.equal(db.ler(`${ZS.FILA}/${SEX}`), null, 'nada entra na fila');
  assert.equal(ZA.bloqueiaMensagem('biscoito__ciclano', 'verm_p', TER), true, 'nem no próprio dia agendado');
  assert.equal(ZA.bloqueiaMensagem('biscoito__ciclano', 'verm_p', '2026-11-04'), false, 'passado o dia, volta ao normal');
  await ZA.desfazer(db, 'biscoito__ciclano', 'verm_p');
  assert.equal((await f.receber({ dia: SEX, dcKey: 'biscoito__ciclano', nome: 'Biscoito', tutor: 'Ciclano' }, portas, { monId: 'pessoa' })).status, 'na-fila');
});

prova('a página: o botão, o cálculo do cuidado, o lançamento do dia e a fila usam a agenda', () => {
  assert.ok(html.indexOf('<script id="zelozinha-agenda">') < html.indexOf('<script id="zelozinha-simples">'), 'a agenda carrega antes da Zelozinha simples');
  assert.match(html, /data-zt694-acao="agendar-abrir"/);
  assert.match(html, /if\(acao==='agendar-abrir'\|\|acao==='agendar-esc'\|\|acao==='agendar-salvar'\|\|acao==='agendar-desfazer'\)/);
  assert.match(html, /if\(v\.agendado&&v\.agendado\.para>c\.dia\)return\{respostaSalva:true,/);
  assert.match(html, /<div data-zt694-agendados><\/div>\s*<div data-zt694-snoopy-list>/);
  assert.match(html, /agendado:function\(dc,itemK,d\)\{var ZA=root\.ZelozinhaAgenda;return !!\(ZA&&ZA\.bloqueiaMensagem\(dc,itemK,d\)\);\}/);
  assert.match(html, /window\.ZelozinhaAgenda\.carregar\(DB\)\.then\(pintarAgendados\)/);
});

(async () => {
  for (const [nome, fn] of fila) {
    total++;
    try { await fn(); console.log('  ok  ' + nome); } catch (e) { falhas++; console.log('  FALHOU  ' + nome + '\n    ' + (e && e.stack || e)); }
  }
  console.log(`zelozinha-agenda169: ${total - falhas} de ${total} provas passaram`);
  if (falhas) process.exit(1);
})();
