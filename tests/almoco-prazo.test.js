'use strict';
/*
 * PROVAS da Story 6.117, Fatia 1 — nada do almoço chega ao Telegram fora do prazo.
 *
 * O caso (Adriana, 22/10/2026, 00h): «acabei de receber no telegram, agora 00:00 - quem nao almoçou ontem. Isso nao pode ocorrer.»
 * A cadeia reproduzida: a virada do dia recarrega o aparelho parado (6.21) → aplicarLogin agenda, para 6 s depois, o lembrete do
 * dia seguinte (empChecarAtrasoDiario → empAvisarAtrasoNoTelegram) → o grupo «comida» recebe à meia-noite o almoço de ontem.
 *
 * Este arquivo carrega o auaulandia/index.html REAL (todos os <script> inline, na ordem, e o painel-logica.js que a página liga
 * antes deles) num sandbox do Node (vm), com:
 *   · um relógio de mentira que a prova move (a hora é dita em hora LOCAL, então a prova dá o mesmo resultado em UTC e em
 *     America/Sao_Paulo);
 *   · um banco de mentira em árvore que CONTA cada leitura (once) e anota cada gravação; a transação roda como a do Firebase com
 *     o nó fora do aparelho (1ª rodada com null, depois com o valor do servidor — a lição da 6.113);
 *   · o fetch espião (a ponte do Telegram nunca é chamada de verdade) e os relógios (setTimeout/setInterval) guardados, para a
 *     prova rodar só o que quer, na hora que quer.
 * Dado 100% inventado («Teste 01», «Tutor Teste 01», «Encãotadora Teste»). Nenhum Firebase, nenhuma rede, nenhum dado de produção.
 *
 * Grupos de provas (PROVAS=P1,P3 roda só esses):
 *   P1 — o incidente de 22/10: a virada, a volta (aplicarLogin) e o relógio do reenvio à meia-noite (AC1)
 *   P2 — o prazo: Configurações, a guarda, a porta única, o aviso por FILHOt, o reenvio manual, a cobrança e a tela (AC2 a AC6)
 *   P3 — o reenvio automático: quem serviu e a hora da marcação, o prazo e a trava de 2 minutos (AC5.3)
 *   P7 — o consumo do banco: a entrada no app, a tela «Quem não comeu hoje» e o relógio de 2 min (AC2.1, AC2.4, AC7)
 *   R  — varreduras do arquivo (AC1.3, AC4.3)
 *
 * Uso:  node tests/almoco-prazo.test.js
 *       TZ=America/Sao_Paulo node tests/almoco-prazo.test.js
 *       PROVAS=P1,P7 node tests/almoco-prazo.test.js
 *       APP117=/caminho/auaulandia/index.html node tests/almoco-prazo.test.js   (outra cópia, para os defeitos plantados: a cópia
 *       fica ao lado dos scripts do app, porque o painel-logica.js é lido da mesma pasta)
 * Sai 0 se tudo passa, 1 se algo falha.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const assert = require('assert');

const APP = process.env.APP117 || path.join(__dirname, '..', 'auaulandia', 'index.html');
const HTML = fs.readFileSync(APP, 'utf8');
const PAINEL_LOGICA = fs.readFileSync(path.join(path.dirname(APP), 'painel-logica.js'), 'utf8');
const SO = (process.env.PROVAS || '').split(',').map((x) => x.trim().toUpperCase()).filter(Boolean);
const PONTE = 'https://ponte.teste/exec';

const fila = [];
function prova(id, nome, fn) { fila.push({ id, nome: '6.117 ' + id + ' — ' + nome, fn }); }
const igual = (a, b, msg) => assert.deepStrictEqual(JSON.parse(JSON.stringify(a)), b, msg);

// ---------------------------------------------------------------- o relógio (hora LOCAL do processo, como o aparelho)
// Datas do caso: 20/10/2026 é terça, 21/10 quarta, 22/10 quinta, 23/10 sexta e 25/10 domingo.
const local = (dia, hora) => { const [a, m, d] = dia.split('-').map(Number); const [h, mi, s] = (hora + ':00').split(':').map(Number); return new Date(a, m - 1, d, h, mi, s || 0).getTime(); };

// ---------------------------------------------------------------- o banco de mentira (árvore em memória, que conta)
// O que a página recém-aberta lê sozinha e não é do almoço: o registro do próprio aparelho. Fica fora da contagem.
const RUIDO = /^auaulandia\/aparelhos\//;
function criarBanco(seed) {
  let arv = seed ? JSON.parse(JSON.stringify(seed)) : {};
  const log = { leituras: [], gravacoes: [], ordem: [] };
  const clone = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));
  const partes = (p) => String(p || '').split('/').filter((x) => x !== '');
  function pegar(p) { let c = arv; for (const k of partes(p)) { if (c === null || typeof c !== 'object' || !(k in c)) return undefined; c = c[k]; } return c; }
  function por(p, v) {
    const ps = partes(p); if (!ps.length) { arv = v == null ? {} : clone(v); return; }
    let c = arv; for (let i = 0; i < ps.length - 1; i++) { if (c[ps[i]] === null || typeof c[ps[i]] !== 'object') c[ps[i]] = {}; c = c[ps[i]]; }
    if (v === null || v === undefined) delete c[ps[ps.length - 1]]; else c[ps[ps.length - 1]] = clone(v);
  }
  function snap(v, key) { const val = clone(v); return { key, val: () => (val === undefined ? null : clone(val)), exists: () => val != null, forEach(fn) { if (val && typeof val === 'object') Object.keys(val).some((k) => fn(snap(val[k], k)) === true); } }; }
  let n = 0;
  function ref(p0) {
    const p = partes(p0).join('/'), key = partes(p).pop() || null;
    const r = {
      key, path: p,
      child: (c) => ref(p + '/' + c),
      once: () => { if (!RUIDO.test(p)) log.leituras.push(p); log.ordem.push('ler ' + p); return Promise.resolve(snap(pegar(p), key)); },
      on: (ev, fn) => fn, off: () => {},
      set: (v) => { log.gravacoes.push({ op: 'set', p, v: clone(v) }); log.ordem.push('gravar ' + p); por(p, v); return Promise.resolve(); },
      update: (o) => { log.gravacoes.push({ op: 'update', p, v: clone(o) }); log.ordem.push('gravar ' + p); Object.keys(o || {}).forEach((k) => por(p + '/' + k, o[k])); return Promise.resolve(); },
      remove: () => { log.gravacoes.push({ op: 'remove', p }); log.ordem.push('apagar ' + p); por(p, null); return Promise.resolve(); },
      push: (v) => { const k = 'novo' + (++n); if (v !== undefined) por(p + '/' + k, v); const pr = Promise.resolve(ref(p + '/' + k)); pr.key = k; return pr; },
      // A transação do Firebase com o nó fora do aparelho: a 1ª rodada vem com null; se ela desiste ali, desistiu; se propõe sobre
      // um retrato diferente do servidor, roda de novo com o valor do servidor (6.113).
      transaction: (fn) => {
        let r1 = fn(null);
        if (r1 === undefined) return Promise.resolve({ committed: false, snapshot: snap(null, key) });
        const serv = pegar(p) === undefined ? null : clone(pegar(p));
        if (serv !== null) { r1 = fn(serv); if (r1 === undefined) return Promise.resolve({ committed: false, snapshot: snap(serv, key) }); }
        log.gravacoes.push({ op: 'transaction', p, v: clone(r1) }); log.ordem.push('gravar ' + p); por(p, r1);
        return Promise.resolve({ committed: true, snapshot: snap(r1, key) });
      },
    };
    ['orderByChild', 'orderByKey', 'limitToLast', 'limitToFirst', 'equalTo', 'startAt', 'endAt'].forEach((m) => { r[m] = () => r; });
    return r;
  }
  return { ref, log, ler: (p) => clone(pegar(p)), poe: (p, v) => por(p, v), zerarLog: () => { log.leituras.length = 0; log.gravacoes.length = 0; log.ordem.length = 0; } };
}

// ---------------------------------------------------------------- o app inteiro num sandbox
function universal(name) {
  const fn = function () { return fn; };
  return new Proxy(fn, {
    get(t, p) { if (p === Symbol.toPrimitive) return () => ''; if (p === 'then') return undefined; if (p in t) return t[p]; return universal(name + '.' + String(p)); },
    set() { return true; }, apply() { return universal(name + '()'); }, construct() { return universal('new ' + name); },
  });
}
/* abrir({dia, hora, banco, papel, ponte, respostaPonte}) — carrega o app como uma página nova, naquele instante. */
function abrir(op) {
  op = op || {};
  const relogio = { t: local(op.dia || '2026-10-21', op.hora || '10:00') };
  class D extends Date { constructor(...a) { if (a.length === 0) super(relogio.t); else super(...a); } static now() { return relogio.t; } }
  const timers = [], fetches = [], els = {}, sessao = {};
  const resposta = { atual: op.respostaPonte || { ok: true } };
  const bodyEl = { dataset: { role: op.papel || 'gestao' }, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, appendChild() {}, style: {}, addEventListener() {}, setAttribute() {}, getAttribute() { return null; }, removeAttribute() {} };
  const documentStub = { body: bodyEl, head: { appendChild() {} }, documentElement: universal('documentElement'), getElementById(id) { return els[id] || universal('el'); }, querySelector() { return null; }, querySelectorAll() { return []; }, createElement() { return universal('el'); }, addEventListener() {}, getElementsByClassName() { return []; }, getElementsByTagName() { return []; }, cookie: '', readyState: 'complete', hidden: false, visibilityState: 'visible' };
  const sb = {
    console, Date: D, Math, JSON, Object, Array, String, Number, Boolean, parseInt, parseFloat, isNaN, isFinite, RegExp, Promise, Map, Set, Symbol, Intl, Error, TypeError,
    encodeURIComponent, decodeURIComponent, escape, unescape, TextEncoder, btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
    setTimeout(fn, ms) { timers.push({ fn, ms: Number(ms) || 0 }); return timers.length; }, clearTimeout() {},
    setInterval(fn, ms) { timers.push({ fn, ms: Number(ms) || 0, intervalo: true }); return timers.length; }, clearInterval() {},
    requestAnimationFrame() {}, performance: { now() { return 0; } }, document: documentStub,
    firebase: { initializeApp() { return {}; }, auth() { return { signInAnonymously() { return new Promise(() => {}); }, onAuthStateChanged() {} }; }, database() { return { ref() { return universal('ref'); } }; } },
    localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
    sessionStorage: { getItem(k) { return k in sessao ? sessao[k] : null; }, setItem(k, v) { sessao[k] = String(v); }, removeItem(k) { delete sessao[k]; } },
    navigator: { userAgent: 't117', onLine: true }, location: { href: 'https://t117.local/', reload() {}, replace() {}, hostname: 't117.local' },
    Blob: class Blob {}, alert() {}, confirm() { return true; }, prompt() { return ''; }, scrollTo() {}, addEventListener() {}, crypto: crypto.webcrypto,
    fetch(url, o) {
      let corpo = null; try { corpo = JSON.parse((o && o.body) || 'null'); } catch (e) { corpo = null; } /* silencioso de propósito: GET sem corpo */
      fetches.push({ url: String(url), metodo: (o && o.method) || 'GET', corpo });
      if (op.banco) op.banco.log.ordem.push('fetch ' + ((corpo && corpo.grupo) || '-'));
      const r = resposta.atual;
      return Promise.resolve({ text: () => Promise.resolve(JSON.stringify(r)), json: () => Promise.resolve(r) });
    },
  };
  sb.window = sb; sb.globalThis = sb; sb.self = sb;
  const ctx = vm.createContext(sb);
  vm.runInContext(PAINEL_LOGICA, ctx, { filename: 'painel-logica.js' });
  const re = /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi; let m;
  while ((m = re.exec(HTML))) vm.runInContext(m[2], ctx, { filename: 'inline', timeout: 30000 });
  const run = (c) => vm.runInContext(c, ctx);
  const J = (c) => { const r = run('JSON.stringify(' + c + ')'); return r === undefined ? null : JSON.parse(r); };
  const banco = op.banco || criarBanco({});
  ctx.__banco = banco;
  run(`DB=__banco; __tg=[]; __aud=[]; __alertas=[]; __falhaGrav=[];
    TG_CFG=${op.ponte === false ? 'null' : JSON.stringify({ url: PONTE, senha: 'senha-teste' })};
    var __tgReal=tgAvisar; tgAvisar=function(d){ __tg.push(JSON.parse(JSON.stringify(d||{}))); return __tgReal(d); };
    audit=function(a,d,m){ __aud.push({acao:String(a||''), detalhe:String(d==null?'':d)}); };
    zAlertao=function(t,l){ __alertas.push(String(t||'')); };
    _logFalhaGrav=function(o){ __falhaGrav.push(String(o||'')); };
    pelCadCache={
      'teste-01__tutor-teste-01':{nome:'Teste 01', tutor:'Tutor Teste 01', raca:'Lhasa', sexo:'Macho'},
      'teste-02__tutor-teste-02':{nome:'Teste 02', tutor:'Tutor Teste 02', raca:'Spitz', sexo:'Fêmea'},
      'teste-03__tutor-teste-03':{nome:'Teste 03', tutor:'Tutor Teste 03', raca:'Poodle', sexo:'Macho'},
      'teste-04__tutor-teste-04':{nome:'Teste 04', tutor:'Tutor Teste 04', raca:'Golden', sexo:'Macho'}
    };`);
  const app = {
    ctx, run, J, banco, timers, fetches, els, relogio, resposta,
    hora: (dia, hora) => { relogio.t = local(dia, hora); },
    tg: () => J('__tg'), tgComida: () => J('__tg').filter((d) => d.grupo === 'comida'),
    fetchComida: () => fetches.filter((f) => f.corpo && f.corpo.grupo === 'comida'),
    fetchPonte: () => fetches.filter((f) => f.url.indexOf(PONTE) === 0 && f.metodo === 'POST'),
    aud: () => J('__aud'), alertas: () => J('__alertas'),
    // o turno do almoço deste aparelho: a turma da grade e quem serviu (a lista e a pessoa vêm do app nas telas; aqui, fixas)
    turma: (nomes) => { ctx.__turma = nomes.map((n) => ({ p: { n, tutor: 'Tutor ' + n, raca: 'SRD' } })); run('turmaDoDia=function(){ return __turma; }; pelExtra=function(){ return {sexo:"Macho"}; };'); },
    quemServe: (nome) => { ctx.__quem = nome; run('pessoaDoTurno=function(){ return __quem; };'); },
  };
  return app;
}
async function esperar(n) { for (let i = 0; i < (n || 40); i++) await new Promise((r) => setImmediate(r)); }
const K1 = 'teste-01__tutor-teste-01', K2 = 'teste-02__tutor-teste-02', K3 = 'teste-03__tutor-teste-03', K4 = 'teste-04__tutor-teste-04';
const kDe = (app, nome) => app.run(`dcKey(${JSON.stringify(nome)}, ${JSON.stringify('Tutor ' + nome)})`);

// O dia do incidente: 21/10 (quarta). Teste 01 não comeu nem no 2º horário (o grupo soube às 15:30); Teste 02 comeu metade.
// Ninguém tocou «Avisei o tutor». A auditoria do dia tem as horas das marcações (12:10, 15:30 e 12:20).
function bancoDoIncidente() {
  return criarBanco({ daycare: {
    almoco: { '2026-10-21': { [K1]: 'nao', [K2]: 'metade' } },
    atividade: { '2026-10-21': { almoco2: { [K1]: 'nao' } } },
    'avisos-telegram-comida': { '2026-10-21': { [K1]: { ts: local('2026-10-21', '15:30'), ok: true, tentando: false, nome: 'Teste 01', quem: 'Encãotadora Teste' } } },
    auditoria: { '2026-10-21': {
      x1: { acao: 'almoco_grade', alvo: K1, ts: local('2026-10-21', '12:10') },
      x2: { acao: 'almoco2', alvo: K1, ts: local('2026-10-21', '15:30') },
      x3: { acao: 'almoco_grade', alvo: K2, ts: local('2026-10-21', '12:20') } } },
  } });
}
const USUARIO = { gestao: { role: 'gestao', nome: 'Gestão Teste', monId: 'gestao-teste' }, consultora: { role: 'consultora', nome: 'Consultora Teste', monId: 'consultora-teste' } };
/* a entrada no app: aplicarLogin real e, passados os 6 s, o corpo real do agendamento que ele deixou */
async function entrar(app, papel, dia, horaDepois) {
  const n0 = app.timers.length;
  app.ctx.__u = USUARIO[papel];
  app.run('aplicarLogin(__u)');
  const seis = app.timers.slice(n0).filter((t) => t.ms === 6000 && /empVigiaAlmoco2\(\)/.test(String(t.fn)));
  assert.strictEqual(seis.length, 1, 'o aplicarLogin agenda uma vez o bloco de 6 s (empVigiaAlmoco2, gravarTurmaDoDia, aplicarFaltaAutomatica)');
  app.hora(dia, horaDepois);
  seis[0].fn();
  await esperar();
}
const doDiaPassado = (p, hoje) => /^daycare\/(almoco|avisos-comida|auditoria)\/\d{4}-\d{2}-\d{2}$|^daycare\/atividade\/\d{4}-\d{2}-\d{2}\/almoco2$/.test(p) && p.indexOf(hoje) < 0;

// ================================================================ P1 — o incidente de 22/10
prova('P1', 'AC1.1 — às 00:00:05 de 22/10, o aparelho parado desde 21/10 recarrega (a 6.21 não muda)', () => {
  const app = abrir({ dia: '2026-10-21', hora: '23:59:50', banco: bancoDoIncidente() });
  assert.strictEqual(app.run('APP_DIA_ABERTO'), '2026-10-21');
  app.run("zMotivoParado=function(){ return '3 min sem toque'; };");
  app.hora('2026-10-22', '00:00:05');
  assert.strictEqual(app.run('zViradaDoDiaTick()'), 'recarga');
  assert.ok(app.timers.some((t) => t.ms === 600), 'a recarga fica agendada (600 ms), como na 6.21');
});
for (const papel of ['gestao', 'consultora']) {
  prova('P1', `AC1.1/AC1.4 — na volta da recarga (${papel}), passados os 6 s (00:00:11) e em outras entradas da madrugada (00:00:20, 03:29, 06:00): nenhum aviso do almoço, nenhuma ida à ponte, nenhuma auditoria lida, nada em avisos-telegram-atraso; e o resto do agendamento roda`, async () => {
    // a base mandava 3 mensagens às 00:00:11 e às 00:00:20, 2 às 03:29 e 0 às 06:00 («tudo velho»), com a trava gravada sempre
    for (const [entra, depois] of [['00:00:05', '00:00:11'], ['00:00:14', '00:00:20'], ['03:28:54', '03:29'], ['05:59:54', '06:00']]) {
      const banco = bancoDoIncidente();
      const app = abrir({ dia: '2026-10-22', hora: entra, banco, papel });
      app.run(`__chamou=[]; ['empVigiaAlmoco2','gravarTurmaDoDia','aplicarFaltaAutomatica'].forEach(function(n){ var f=globalThis[n]; globalThis[n]=function(){ __chamou.push(n); return f.apply(this, arguments); }; });`);
      banco.zerarLog();
      await entrar(app, papel, '2026-10-22', depois);
      igual(app.tgComida(), [], depois + ': nenhuma chamada a tgAvisar com grupo comida');
      igual(app.fetchPonte(), [], depois + ': nenhum fetch à ponte');
      igual(banco.log.leituras.filter((p) => /^daycare\/auditoria\//.test(p)), [], depois + ': nenhuma leitura de auditoria');
      igual(banco.log.gravacoes.filter((g) => /avisos-telegram-atraso/.test(g.p)), [], depois + ': nada gravado em avisos-telegram-atraso');
      assert.strictEqual(banco.ler('daycare/avisos-telegram-atraso'), undefined);
      igual(app.J('__chamou'), ['empVigiaAlmoco2', 'gravarTurmaDoDia', 'aplicarFaltaAutomatica'], depois + ': a 6.21 e a falta das 12h não perdem nada');
    }
  });
}
prova('P1', 'AC1.2 — o relógio do reenvio automático às 00:00:20, 03:29 e 06:00: nada vai ao grupo, nem a fila presa de ontem nem a de hoje', async () => {
  for (const hora of ['00:00:20', '03:29', '06:00']) {
    const banco = bancoDoIncidente();
    banco.poe('daycare/avisos-telegram-comida/2026-10-21/' + K2, { ts: local('2026-10-21', '15:40'), ok: false, tentando: false, nome: 'Teste 02', quem: 'Encãotadora Teste', erro: 'a ponte não respondeu' });
    banco.poe('daycare/avisos-telegram-comida/2026-10-22/' + K3, { ts: local('2026-10-22', '00:00'), ok: false, tentando: false, nome: 'Teste 03', quem: 'Plantonista Teste', erro: 'a ponte não respondeu' });
    const app = abrir({ dia: '2026-10-22', hora, banco, papel: 'plantonista' });
    app.turma(['Teste 03']); app.quemServe('Plantonista Teste');
    app.run('comidaTgFilaTentar()');
    await esperar();
    igual(app.tgComida(), [], 'às ' + hora + ': nenhuma mensagem ao grupo');
    igual(app.fetchPonte(), [], 'às ' + hora + ': nenhuma ida à ponte');
  }
});

// ================================================================ P2 — o prazo, a guarda e cada caminho
prova('P2', 'AC3.2 — almTgPrazo: sempre {ini, fim} válidos, nunca lança (vazio, formato, faixa, parcial, ini > fim, teto de 19:00)', () => {
  const app = abrir({ dia: '2026-10-21', hora: '10:00' });
  assert.strictEqual(typeof app.ctx.almTgPrazo, 'function', 'a função existe');
  igual(app.J('almTgPrazo()'), { ini: '07:00', fim: '18:00' }, 'o padrão');
  igual(app.J('AUDIT_CFG.almocoTelegram'), { ini: '07:00', fim: '18:00', label: 'Avisos do almoço no Telegram' }, 'o padrão mora no AUDIT_CFG');
  const casos = [
    ['undefined', { ini: '07:00', fim: '18:00' }], ['null', { ini: '07:00', fim: '18:00' }], ['"18:00"', { ini: '07:00', fim: '18:00' }], ['42', { ini: '07:00', fim: '18:00' }],
    ["{fim:'17:30'}", { ini: '07:00', fim: '17:30' }], ["{ini:'08:15'}", { ini: '08:15', fim: '18:00' }],
    ["{ini:'', fim:''}", { ini: '07:00', fim: '18:00' }], ["{ini:'7:00', fim:'18:00'}", { ini: '07:00', fim: '18:00' }],
    ["{ini:'24:00', fim:'18:60'}", { ini: '07:00', fim: '18:00' }], ["{ini:'ab:cd', fim:'99:99'}", { ini: '07:00', fim: '18:00' }],
    ["{ini:'07:00', fim:'18:00:00'}", { ini: '07:00', fim: '18:00' }], ["{ini:7, fim:18}", { ini: '07:00', fim: '18:00' }],
    ["{ini:'12:00', fim:'11:00'}", { ini: '07:00', fim: '18:00' }], ["{ini:'07:00', fim:'20:00'}", { ini: '07:00', fim: '19:00' }],
    ["{ini:'06:00', fim:'23:59'}", { ini: '06:00', fim: '19:00' }], ["{ini:'19:30', fim:'20:00'}", { ini: '07:00', fim: '18:00' }],
    ["{ini:'09:00', fim:'09:00'}", { ini: '09:00', fim: '09:00' }],
    ["{get ini(){ throw new Error('x'); }, fim:'17:00'}", { ini: '07:00', fim: '18:00' }],
  ];
  for (const [v, esperado] of casos) {
    app.run('AUDIT_CFG.almocoTelegram=' + v + ';');
    let r; try { r = app.J('almTgPrazo()'); } catch (e) { assert.fail('almTgPrazo lançou com ' + v + ': ' + e.message); }
    igual(r, esperado, 'com ' + v);
  }
  app.run('delete AUDIT_CFG.almocoTelegram;');
  igual(app.J('almTgPrazo()'), { ini: '07:00', fim: '18:00' }, 'sem o objeto');
});
prova('P2', 'AC3.1/AC3.3 — o editor de Configurações ganha «Avisos do almoço no Telegram — de / até»; salvar grava só daycare/config/auditoria; com fim 17:30, às 17:30 sai e às 17:31 não', () => {
  const banco = criarBanco({});
  const app = abrir({ dia: '2026-10-21', hora: '17:30', banco });
  app.els.painelCfg = { style: { display: 'none' }, innerHTML: '' };
  app.run('abrirAuditCfg()');
  const h = app.els.painelCfg.innerHTML;
  assert.ok(h.indexOf('Avisos do almoço no Telegram') >= 0, 'a linha nova no editor');
  assert.ok(h.indexOf("setAuditCfg('almocoTelegram','ini',this.value)") >= 0 && h.indexOf("setAuditCfg('almocoTelegram','fim',this.value)") >= 0, 'o «de» e o «até»');
  assert.ok(/<label>de <input type="time" value="07:00" onchange="setAuditCfg\('almocoTelegram','ini'/.test(h) && /<label>até <input type="time" value="18:00" onchange="setAuditCfg\('almocoTelegram','fim'/.test(h), 'com os valores de agora');
  ['Abertura do Day Care', 'Chamada', 'Almoço', 'Início do Plantão', 'Relatório da Noite', 'Protocolo do Plantão'].forEach((t) => assert.ok(h.indexOf(t) >= 0, 'as janelas de antes continuam: ' + t));
  banco.zerarLog();
  app.run("setAuditCfg('almocoTelegram','fim','17:30')");
  igual(banco.log.gravacoes.map((g) => g.op + ' ' + g.p), ['set daycare/config/auditoria'], 'grava só o nó das janelas');
  igual(banco.ler('daycare/config/auditoria/almocoTelegram'), { ini: '07:00', fim: '17:30', label: 'Avisos do almoço no Telegram' });
  igual(banco.log.leituras, [], 'nenhuma leitura nova');
  assert.strictEqual(app.run('almTgPodeSair(dcDataKey()).pode'), true, 'às 17:30, sai');
  app.hora('2026-10-21', '17:31');
  assert.strictEqual(app.run('almTgPodeSair(dcDataKey()).pode'), false, 'às 17:31, não');
  assert.strictEqual(app.run('almTgPodeSair(dcDataKey()).porque'), 'passou do prazo');
});
prova('P2', 'AC4.1 — almTgPodeSair: a tabela inteira (faixa inclusiva, domingo, dia diferente de hoje, dia inválido), com o relógio do aparelho', () => {
  const app = abrir({ dia: '2026-10-21', hora: '10:00' });
  assert.strictEqual(typeof app.ctx.almTgPodeSair, 'function', 'a função existe');
  const tabela = [
    ['2026-10-21', '15:50', 'hoje', true, ''], ['2026-10-20', '07:00', 'hoje', true, ''], ['2026-10-21', '18:00', 'hoje', true, ''],
    ['2026-10-21', '18:01', 'hoje', false, 'passou do prazo'], ['2026-10-23', '23:58', 'hoje', false, 'passou do prazo'],
    ['2026-10-21', '06:59', 'hoje', false, 'ainda não é hora'], ['2026-10-25', '15:50', 'hoje', false, 'domingo'],
    ['2026-10-22', '00:00:20', '2026-10-21', false, 'dia diferente de hoje'], ['2026-10-22', '15:50', '2026-10-21', false, 'dia diferente de hoje'],
    ['2026-10-21', '15:50', '', false, 'dia inválido'], ['2026-10-21', '15:50', undefined, false, 'dia inválido'], ['2026-10-21', '15:50', '21/10/2026', false, 'dia inválido'],
    ['2026-10-21', '15:50', null, false, 'dia inválido'], ['2026-10-21', '15:50', 20261021, false, 'dia inválido'],
  ];
  for (const [dia, hora, assunto, pode, porque] of tabela) {
    app.hora(dia, hora);
    const arg = assunto === 'hoje' ? 'dcDataKey()' : (assunto === undefined ? 'undefined' : JSON.stringify(assunto));
    const r = app.J('almTgPodeSair(' + arg + ')');
    assert.strictEqual(r.pode, pode, dia + ' ' + hora + ' ' + String(assunto) + ': pode=' + r.pode);
    assert.strictEqual(r.porque, porque, dia + ' ' + hora + ' ' + String(assunto) + ': porque=' + r.porque);
    assert.ok(!('motivo' in r), 'o campo não se chama motivo (a régua da 6.48)');
  }
  // o dia da semana que o teste fixa vale (AC8.2): numa quarta com o dia da semana trocado para domingo, não sai
  app.hora('2026-10-21', '15:50');
  app.run('__dsBkp=almTgDiaDaSemana; almTgDiaDaSemana=function(){ return 0; };');
  igual(app.J('almTgPodeSair(dcDataKey())'), { pode: false, porque: 'domingo' });
  app.run('almTgDiaDaSemana=__dsBkp;');
  igual(app.J('almTgPodeSair(dcDataKey())'), { pode: true, porque: '' });
});
prova('P2', 'AC4.2 — a porta única: tgAvisar({grupo:"comida"}) fora do prazo devolve {ok:false, foraDoPrazo:true} sem ir à rede; os outros grupos não mudam', async () => {
  const app = abrir({ dia: '2026-10-21', hora: '23:58' });
  const r = await app.run("tgAvisar({grupo:'comida', texto:'teste'})");
  assert.strictEqual(r.ok, false); assert.strictEqual(r.foraDoPrazo, true); assert.ok(typeof r.erro === 'string' && r.erro.length > 0, 'com um erro curto');
  igual(app.fetches, [], 'às 23:58 nenhuma ida à ponte');
  app.hora('2026-10-25', '15:50');
  assert.strictEqual((await app.run("tgAvisar({grupo:'comida', texto:'teste'})")).foraDoPrazo, true, 'domingo também não');
  igual(app.fetches, [], 'nem no domingo');
  app.hora('2026-10-21', '15:50');
  assert.strictEqual((await app.run("tgAvisar({grupo:'comida', texto:'teste'})")).ok, true, 'dentro do prazo sai');
  igual(app.fetchComida().length, 1, 'uma ida à ponte, com o grupo comida');
  app.hora('2026-10-21', '18:01');
  for (const g of ['gestao', 'vet', 'diario', 'urgencia']) {
    const n0 = app.fetches.length;
    const rr = await app.run(`tgAvisar({grupo:'${g}', texto:'teste'})`);
    assert.strictEqual(rr.ok, true, g + ' às 18:01 continua saindo');
    assert.strictEqual(app.fetches.length, n0 + 1, g + ': uma ida à ponte');
  }
  const n1 = app.fetches.length;
  assert.strictEqual((await app.run("tgAvisar({texto:'sem grupo (a vet, padrão)'})")).ok, true);
  assert.strictEqual(app.fetches.length, n1 + 1, 'sem grupo também não muda');
  app.hora('2026-10-25', '10:00');
  assert.strictEqual((await app.run("tgAvisar({grupo:'gestao', texto:'teste'})")).ok, true, 'a Gestão recebe também no domingo');
});
prova('P2', 'AC5.1 — dentro do prazo nada muda: marcar «não comeu» no 2º horário às 15:33 manda as 2 mensagens de hoje, com o rastro antes do envio e o registro final', async () => {
  const banco = criarBanco({});
  const app = abrir({ dia: '2026-10-21', hora: '15:33', banco, papel: 'monitor' });
  app.turma(['Teste 01']); app.quemServe('Encãotadora Teste');
  const k = kDe(app, 'Teste 01');
  app.run('genMarcas={};');
  app.run(`marcarAlmoco2(${JSON.stringify(k)}, 'nao')`);
  await esperar();
  const msgs = app.tgComida().map((d) => d.texto);
  igual(msgs.length, 2, 'as 2 mensagens');
  assert.strictEqual(msgs[0], '<b>Teste 01</b> · SRD · Tutor: Tutor Teste 01\nNão comeu no 1º nem no 2º horário.\nQuem serviu o 2º horário: Encãotadora Teste às 15:33');
  assert.strictEqual(msgs[1], 'Mensagem para enviar ao tutor do Teste 01:\n\nOi, Tutor, como está?\n\nHoje o Teste 01 não quis comer por aqui. 🐶\nTentamos no primeiro horário e oferecemos novamente no segundo, mas ele não aceitou.\n\nGentileza, reforçar a comidinha em casa mais tarde. 💛');
  const P = 'daycare/avisos-telegram-comida/2026-10-21/' + k;
  const iRastro = banco.log.ordem.indexOf('gravar ' + P), iFetch = banco.log.ordem.indexOf('fetch comida');
  assert.ok(iRastro >= 0 && iFetch > iRastro, 'o rastro «tentando» é gravado antes do envio: ' + banco.log.ordem.join(' | '));
  assert.strictEqual(banco.log.gravacoes.find((g) => g.p === P).v.tentando, true);
  const fim = banco.ler(P);
  assert.strictEqual(fim.ok, true); assert.strictEqual(fim.tentando, false); assert.strictEqual(fim.nome, 'Teste 01'); assert.strictEqual(fim.erro, '');
  assert.ok(app.aud().some((a) => a.acao === 'telegram-comida' && a.detalhe === 'avisou o grupo que Teste 01 não almoçou'), JSON.stringify(app.aud()));
  igual(app.alertas(), [], 'sem cartaz');
});
prova('P2', 'AC5.2 — fora do prazo (18:05): nada vai ao grupo; o registro diz foraDoPrazo e «passou das 18:00»; a auditoria registra; sem cartaz e sem buscar a ponte', async () => {
  for (const ponte of [true, false]) {
    const banco = criarBanco({});
    const app = abrir({ dia: '2026-10-21', hora: '18:05', banco, papel: 'monitor', ponte });
    app.turma(['Teste 01']); app.quemServe('Encãotadora Teste');
    app.run("sessionStorage.setItem('zeluz_login', JSON.stringify({role:'monitor', nome:'Monitor 3', pessoa:'Encãotadora Teste'}));");
    const k = kDe(app, 'Teste 01');
    app.run('genMarcas={};');
    app.run(`marcarAlmoco2(${JSON.stringify(k)}, 'nao')`);
    await esperar();
    const quadro = ponte ? 'com a ponte configurada' : 'sem a ponte na memória';
    igual(app.tgComida(), [], quadro + ': nenhuma mensagem');
    igual(app.fetches, [], quadro + ': nenhuma ida à ponte');
    igual(banco.log.leituras.filter((p) => /config\/telegram/.test(p)), [], quadro + ': não busca a configuração da ponte');
    const r = banco.ler('daycare/avisos-telegram-comida/2026-10-21/' + k);
    assert.ok(r && typeof r.ts === 'number', quadro + ': registro com ts');
    igual(Object.assign({}, r, { ts: 0 }), { ts: 0, ok: false, tentando: false, foraDoPrazo: true, nome: 'Teste 01', quem: 'Encãotadora Teste', erro: 'passou das 18:00' }, quadro);
    assert.ok(app.aud().some((a) => a.acao === 'telegram-comida' && a.detalhe === 'NÃO avisou o grupo — passou das 18:00'), quadro + ': ' + JSON.stringify(app.aud()));
    igual(app.alertas(), [], quadro + ': sem o cartaz «AVISE NO GRUPO PELO SEU CELULAR»');
  }
});
prova('P2', 'AC5.2 — fora do prazo, quem o grupo já soube na hora continua «avisado» (o registro ok:true não é trocado), mesmo com o nó fora do aparelho', async () => {
  const banco = criarBanco({});
  const app = abrir({ dia: '2026-10-21', hora: '18:05', banco, papel: 'monitor' });
  app.turma(['Teste 01']); app.quemServe('Encãotadora Teste');
  const k = kDe(app, 'Teste 01'), P = 'daycare/avisos-telegram-comida/2026-10-21/' + k;
  const antes = { ts: local('2026-10-21', '15:33'), ok: true, tentando: false, nome: 'Teste 01', quem: 'Encãotadora Teste', erro: '' };
  banco.poe(P, antes);
  app.run(`avisarGrupoComida(${JSON.stringify(k)})`);
  await esperar();
  igual(banco.ler(P), antes, 'o registro de 15:33 fica');
  igual(app.tgComida(), [], 'e nada sai');
  assert.ok(!app.aud().some((a) => /NÃO avisou/.test(a.detalhe)), 'nem auditoria de «não avisou» para quem foi avisado');
});
prova('P2', 'AC4.2/AC5.2 — o prazo acaba no meio do envio (a leitura «já mandei?» volta depois das 18:00): a porta única segura, o registro diz foraDoPrazo e não abre o cartaz', async () => {
  const banco = criarBanco({});
  const app = abrir({ dia: '2026-10-21', hora: '18:00', banco, papel: 'monitor' });
  app.turma(['Teste 01']); app.quemServe('Encãotadora Teste');
  const k = kDe(app, 'Teste 01');
  app.run(`avisarGrupoComida(${JSON.stringify(k)})`);   // às 18:00 a guarda deixa; a leitura ainda não voltou
  app.hora('2026-10-21', '18:01');
  await esperar();
  igual(app.fetches, [], 'nada vai à ponte');
  const r = banco.ler('daycare/avisos-telegram-comida/2026-10-21/' + k);
  assert.strictEqual(r.ok, false); assert.strictEqual(r.foraDoPrazo, true, JSON.stringify(r)); assert.strictEqual(r.erro, 'passou das 18:00');
  igual(app.alertas(), [], 'sem o cartaz «AVISE NO GRUPO PELO SEU CELULAR»');
});
prova('P2', 'AC5.4/AC5.5 — «Quem não comeu hoje»: dentro do prazo o botão de reenviar; fora, a frase no lugar do botão; o registro foraDoPrazo em tom de atenção, sem botão', () => {
  const app = abrir({ dia: '2026-10-21', hora: '15:50' });
  const x = { k: K1, grave: true };
  app.ctx.__x = x;
  app.run(`EMP_TG={'${K1}':{ok:false, tentando:false, erro:'ponte fora'}};`);
  let h = app.run('empStatusGrupo(__x)');
  assert.ok(/NÃO foi avisado/.test(h) && h.indexOf('empReenviarGrupo(') >= 0, 'dentro do prazo, como hoje: ' + h);
  app.hora('2026-10-21', '18:30');
  h = app.run('empStatusGrupo(__x)');
  assert.ok(/NÃO foi avisado/.test(h), 'continua dizendo que o grupo não soube');
  assert.ok(h.indexOf('empReenviarGrupo(') < 0, 'fora do prazo, sem o botão: ' + h);
  assert.ok(h.indexOf('Passou das 18:00: o aviso não vai mais ao Telegram. Avise por fora, se ainda fizer sentido.') >= 0, 'a frase no lugar do botão: ' + h);
  for (const hora of ['15:50', '18:30']) {
    app.hora('2026-10-21', hora);
    app.run(`EMP_TG={'${K1}':{ok:false, tentando:false, foraDoPrazo:true, erro:'passou das 18:00'}};`);
    h = app.run('empStatusGrupo(__x)');
    assert.ok(h.indexOf('Não foi ao grupo (passou das 18:00). Avise por fora, se ainda fizer sentido.') >= 0, hora + ': ' + h);
    assert.ok(h.indexOf('var(--crm-atencao-text)') >= 0 && h.indexOf('crm-critico') < 0, hora + ': tom de atenção, sem o vermelho de falha');
    assert.ok(h.indexOf('<button') < 0, hora + ': sem botão');
  }
  app.run(`EMP_TG={'${K1}':{ok:true}};`);
  assert.ok(/Grupo do Telegram avisado/.test(app.run('empStatusGrupo(__x)')), 'o avisado continua avisado');
});
prova('P2', 'AC5.4 — «reenviar ao grupo» fora do prazo não vai à ponte e o registro passa a dizer foraDoPrazo; dentro do prazo, reenvia como hoje', async () => {
  for (const [hora, sai] of [['18:30', false], ['15:50', true]]) {
    const banco = criarBanco({});
    const app = abrir({ dia: '2026-10-21', hora, banco, papel: 'consultora' });
    app.turma(['Teste 01']); app.quemServe('Consultora Teste');
    const k = kDe(app, 'Teste 01'), P = 'daycare/avisos-telegram-comida/2026-10-21/' + k;
    banco.poe(P, { ts: local('2026-10-21', '15:33'), ok: false, tentando: false, nome: 'Teste 01', quem: 'Encãotadora Teste', erro: 'ponte fora' });
    app.run(`empReenviarGrupo(${JSON.stringify(k)})`);
    await esperar();
    assert.strictEqual(app.tgComida().length, sai ? 2 : 0, hora);
    assert.strictEqual(app.fetchComida().length, sai ? 2 : 0, hora + ': idas à ponte');
    if (!sai) assert.strictEqual(banco.ler(P).foraDoPrazo, true, hora + ': o registro diz foraDoPrazo');
    else assert.strictEqual(banco.ler(P).ok, true, hora + ': reenviado');
  }
});
prova('P2', 'AC5.4 — Meu Painel: o registro foraDoPrazo não oferece «Reenviar» (mostra «passou das 18:00»); fora do prazo o «Reenviar» nunca diz «Mandei» sem mandar', async () => {
  const app = abrir({ dia: '2026-10-21', hora: '18:30', papel: 'monitor' });
  const fora = [{ no: 'telegram-comida', k: K1, nome: 'Teste 01', erro: 'passou das 18:00', ts: local('2026-10-21', '18:05'), motivo: 'não saiu' }];
  app.ctx.__av = fora;
  app.ctx.__comida = { [K1]: { ok: false, tentando: false, foraDoPrazo: true, nome: 'Teste 01', quem: 'Encãotadora Teste', erro: 'passou das 18:00' } };
  let h = app.run('pmCardAvisos(__av, __comida)');
  assert.ok(h.indexOf('pmReenviar(') < 0, 'sem o botão: ' + h);
  assert.ok(h.indexOf('passou das 18:00') >= 0, 'o selo: ' + h);
  h = app.run('pmCardAvisos(__av)');
  assert.ok(h.indexOf('pmReenviar(0,this)') >= 0, 'o aviso preso de sempre (sem foraDoPrazo) oferece o reenvio, como hoje');
  app.turma(['Teste 01']); app.quemServe('Encãotadora Teste');
  app.run("PM_ULTIMO={avisos:__av}; __bt={disabled:false, textContent:'Reenviar'};");
  app.run('pmReenviar(0, __bt)');
  await esperar();
  assert.notStrictEqual(app.run('__bt.textContent'), 'Mandei', 'fora do prazo não responde «Mandei»');
  assert.strictEqual(app.run('__bt.textContent'), 'Não vai: passou das 18:00');
  igual(app.fetches, [], 'e não vai à ponte');
  app.hora('2026-10-21', '15:50');
  app.run("__bt={disabled:false, textContent:'Reenviar'};");
  app.run('pmReenviar(0, __bt)');
  await esperar();
  assert.strictEqual(app.run('__bt.textContent'), 'Mandei', 'dentro do prazo, como hoje');
  assert.strictEqual(app.fetchComida().length, 2, 'e manda as 2 mensagens');
});
prova('P2', 'AC6.1/AC6.3 — a cobrança das 16h20 (E): entre 16:20 e o fim do prazo, como hoje (mesmo texto, mesma trava); às 22:00, antes das 16:20, no domingo e com o fim antes das 16:20, nada (nem leitura)', async () => {
  const TEXTO = '<b>ALMOÇO — 2º horário sem registro hoje</b>\n\nNão foi aberto o programa hoje no 2º horário do almoço. Confirmar.\n\nAmanda: ligar para o Day Care confirmando se não houve nenhum FILHOt que não comeu hoje.';
  {
    const banco = criarBanco({});
    const app = abrir({ dia: '2026-10-21', hora: '16:25', banco, papel: 'consultora' });
    await app.run('empVigiaAlmoco2()'); await esperar();
    igual(app.tgComida().map((d) => d.texto), [TEXTO], 'às 16:25 de uma quarta: o texto de 28/08');
    const trava = banco.ler('daycare/cobranca-almoco2/2026-10-21');
    assert.ok(trava && trava.hora === '16:25' && typeof trava.ts === 'number' && 'por' in trava, JSON.stringify(trava));
  }
  for (const [dia, hora, papel, rotulo, cfg] of [['2026-10-21', '22:00', 'plantonista', 'às 22:00 (plantonista)'], ['2026-10-21', '18:01', 'gestao', 'às 18:01'],
    ['2026-10-21', '16:19', 'consultora', 'às 16:19'], ['2026-10-25', '16:25', 'consultora', 'no domingo'], ['2026-10-21', '16:25', 'consultora', 'com o fim às 16:00', "{ini:'07:00', fim:'16:00'}"]]) {
    const banco = criarBanco({});
    const app = abrir({ dia, hora, banco, papel });
    if (cfg) app.run('AUDIT_CFG.almocoTelegram=' + cfg + ';');
    let erro = null;
    try { await app.run('empVigiaAlmoco2()'); await esperar(); } catch (e) { erro = e; }
    assert.strictEqual(erro, null, rotulo + ': sem erro');
    igual(app.tgComida(), [], rotulo + ': nada ao grupo');
    igual(banco.log.leituras, [], rotulo + ': nenhuma leitura');
    assert.strictEqual(banco.ler('daycare/cobranca-almoco2/' + dia), undefined, rotulo + ': trava não gravada');
  }
});
prova('P2', 'AC6.2 — o «dia conferido» (F): sai como hoje dentro do prazo; depois do fim, nem trava nem mensagem', async () => {
  {
    const banco = criarBanco({ daycare: { atividade: { '2026-10-21': { almoco2: { [K1]: 'comeu' } } } } });
    const app = abrir({ dia: '2026-10-21', hora: '16:30', banco, papel: 'consultora' });
    await app.run('empVigiaAlmoco2()'); await esperar();
    igual(app.tgComida().map((d) => d.texto), ['<b>ALMOÇO — dia conferido</b>\n\nTodos comeram hoje. Nenhum tutor a avisar.'], 'às 16:30, como hoje');
    assert.strictEqual(banco.ler('daycare/cobranca-almoco2/2026-10-21').fechamento, true);
  }
  for (const [dia, hora] of [['2026-10-21', '18:30'], ['2026-10-21', '23:58'], ['2026-10-25', '16:30']]) {
    const banco = criarBanco({});
    const app = abrir({ dia, hora, banco, papel: 'gestao' });
    await app.run(`empFecharDiaAlmoco('${dia}')`); await esperar();
    igual(app.tgComida(), [], dia + ' ' + hora + ': nada ao grupo');
    assert.strictEqual(banco.ler('daycare/cobranca-almoco2/' + dia), undefined, dia + ' ' + hora + ': trava não gravada');
  }
});
// A tela «Quem não comeu hoje» com o que ficou de ontem, de anteontem e de 6 dias atrás (22/10, 09:00).
function bancoDaTela() {
  const b = bancoDoIncidente();
  b.poe('daycare/almoco/2026-10-20/' + K3, 'nao'); b.poe('daycare/atividade/2026-10-20/almoco2/' + K3, 'nao');
  b.poe('daycare/almoco/2026-10-16/' + K4, 'metade');
  b.poe('daycare/auditoria/2026-10-20/x9', { acao: 'almoco2', alvo: K3, ts: local('2026-10-20', '15:31') });
  return b;
}
prova('P2', 'AC2.2/AC2.3 — «Quem não comeu hoje» continua com tudo (ontem, anteontem, «Ficou para trás», a mensagem pronta letra por letra, «Avisei o tutor», «Deixa para lá», as contagens); o aviso do cartão deixa de falar em «12h»', async () => {
  const app = abrir({ dia: '2026-10-22', hora: '09:00', banco: bancoDaTela(), papel: 'consultora' });
  app.els.empList = { innerHTML: '' }; app.els.empCount = { textContent: '' };
  app.run('abrirEmporio()'); await esperar();
  const h = app.els.empList.innerHTML;
  assert.ok(h.indexOf('Ontem, 21/10 (2)') >= 0 && h.indexOf('Anteontem, 20/10 (1)') >= 0 && h.indexOf('Ficou para trás (1)') >= 0, h.slice(0, 300));
  assert.strictEqual(app.els.empCount.textContent, '4 de dias anteriores · ninguém de hoje');
  // a mensagem pronta é a da Adriana (13/08), sem mudança: o «metade» da Teste 02 (fêmea) e o «não comeu» do Teste 01
  const metade = 'Oi, Tutor, como está?\n\nHoje a Teste 02 comeu só metade da comidinha por aqui. 🐶\nOferecemos de novo no segundo horário, mas ela não quis mais.\n\nGentileza, reforçar a comidinha em casa mais tarde. 💛';
  const naoComeu = 'Oi, Tutor, como está?\n\nHoje o Teste 01 não quis comer por aqui. 🐶\nTentamos no primeiro horário e oferecemos novamente no segundo, mas ele não aceitou.\n\nGentileza, reforçar a comidinha em casa mais tarde. 💛';
  assert.ok(h.indexOf('>' + app.run('escAttr(' + JSON.stringify(metade) + ')') + '</textarea>') >= 0, 'a mensagem do «metade»');
  assert.ok(h.indexOf('>' + app.run('escAttr(' + JSON.stringify(naoComeu) + ')') + '</textarea>') >= 0, 'a mensagem do «não comeu»');
  assert.strictEqual((h.match(/✅ Avisei o tutor/g) || []).length, 3, 'o «Avisei o tutor» em cada cartão de ontem e anteontem');
  assert.ok(h.indexOf('Deixa para lá') >= 0 && h.indexOf("empDispensarDia('2026-10-16'") >= 0, 'o «Deixa para lá» do que ficou para trás');
  assert.strictEqual((h.match(/⚠ Aviso de ontem não vai ao Telegram\. Avise por fora, se ainda fizer sentido\./g) || []).length, 2, 'o aviso dos 2 cartões de ontem');
  assert.strictEqual((h.match(/⚠ Aviso de anteontem não vai ao Telegram\. Avise por fora, se ainda fizer sentido\./g) || []).length, 1, 'e o de anteontem');
  assert.ok(!/12h/.test(h), 'nada de «12h» na tela');
  // «Avisei o tutor» de ontem grava no dia certo, como hoje
  app.run("document.getElementById=function(id){ return null; }; quemSou=function(){ return 'Consultora Teste'; };");
  app.run(`empAvisarDia('2026-10-21', '${K2}')`); await esperar();
  const reg = app.banco.ler('daycare/avisos-comida/2026-10-21/' + K2);
  igual(Object.keys(reg).sort(), ['atrasado', 'hora', 'obs', 'quem', 'ts']);
  assert.strictEqual(reg.quem, 'Consultora Teste'); assert.strictEqual(reg.atrasado, true);
});
prova('P2', 'AC2.1 — abrir «Quem não comeu hoje» (consultora, supervisor, gestão, diretoria), à meia-noite ou de manhã, não manda nada ao grupo', async () => {
  for (const papel of ['consultora', 'supervisor', 'gestao', 'diretoria']) {
    for (const hora of ['00:00:20', '03:29', '06:00', '09:00']) {
      const app = abrir({ dia: '2026-10-22', hora, banco: bancoDaTela(), papel });
      app.els.empList = { innerHTML: '' }; app.els.empCount = { textContent: '' };
      app.run('abrirEmporio()'); await esperar();
      igual(app.tgComida(), [], papel + ' às ' + hora + ': nada ao grupo');
      igual(app.fetches, [], papel + ' às ' + hora + ': nenhuma ida à ponte');
      assert.ok(app.els.empList.innerHTML.indexOf('Ontem, 21/10 (2)') >= 0, papel + ': a tela mostra');
    }
  }
});

// ================================================================ P3 — o reenvio automático (C)
function bancoDaFila() {
  return criarBanco({ daycare: { 'avisos-telegram-comida': { '2026-10-21': {
    [K1]: { ts: local('2026-10-21', '15:34'), ok: false, tentando: false, nome: 'Teste 01', quem: 'Encãotadora Teste', erro: 'a ponte não respondeu', quemServiu: 'Encãotadora Teste', horaMarcacao: '15:33' },
    [K2]: { ts: local('2026-10-21', '15:35'), ok: true, tentando: false, nome: 'Teste 02', quem: 'Encãotadora Teste', erro: '' },
    [K3]: { ts: local('2026-10-21', '18:05'), ok: false, tentando: false, foraDoPrazo: true, nome: 'Teste 03', quem: 'Encãotadora Teste', erro: 'passou das 18:00' },
  } } } });
}
prova('P3', 'AC5.3 — dentro do prazo, o relógio de 2 min reenvia só o ok:false sem foraDoPrazo, com quem serviu e a hora da MARCAÇÃO (não as do reenvio)', async () => {
  const banco = bancoDaFila();
  const app = abrir({ dia: '2026-10-21', hora: '15:50', banco, papel: 'recepcao' });
  app.turma(['Teste 01', 'Teste 02', 'Teste 03']); app.quemServe('Aprendiz Teste');
  app.run('comidaTgFilaTentar()'); await esperar();
  const msgs = app.tgComida().map((d) => d.texto);
  igual(msgs.length, 2, 'só o Teste 01 (as 2 mensagens dele): ' + JSON.stringify(msgs.map((t) => t.slice(0, 40))));
  assert.strictEqual(msgs[0], '<b>Teste 01</b> · SRD · Tutor: Tutor Teste 01\nNão comeu no 1º nem no 2º horário.\nQuem serviu o 2º horário: Encãotadora Teste às 15:33');
  const fim = banco.ler('daycare/avisos-telegram-comida/2026-10-21/' + K1);
  assert.strictEqual(fim.ok, true, 'reenviado sozinho, sem ninguém abrir tela');
  assert.strictEqual(fim.quemServiu, 'Encãotadora Teste'); assert.strictEqual(fim.horaMarcacao, '15:33');
  assert.strictEqual(banco.ler('daycare/avisos-telegram-comida/2026-10-21/' + K3).foraDoPrazo, true, 'o foraDoPrazo fica como está');
});
prova('P3', 'AC5.3 — o 1º registro (tentando) guarda quemServiu e horaMarcacao; a ponte falha; o reenvio de 15:40 usa os dois', async () => {
  const banco = criarBanco({});
  const app = abrir({ dia: '2026-10-21', hora: '15:33', banco, papel: 'monitor', respostaPonte: { ok: false, erro: 'ponte fora' } });
  app.turma(['Teste 01']); app.quemServe('Encãotadora Teste');
  const k = kDe(app, 'Teste 01'), P = 'daycare/avisos-telegram-comida/2026-10-21/' + k;
  app.run('genMarcas={};');
  app.run(`marcarAlmoco2(${JSON.stringify(k)}, 'nao')`); await esperar();
  const rastro = banco.log.gravacoes.find((g) => g.p === P && g.op === 'update');
  assert.ok(rastro && rastro.v.tentando === true && rastro.v.quemServiu === 'Encãotadora Teste' && rastro.v.horaMarcacao === '15:33', JSON.stringify(rastro));
  const falhou = banco.ler(P);
  assert.strictEqual(falhou.ok, false); assert.strictEqual(falhou.quemServiu, 'Encãotadora Teste'); assert.strictEqual(falhou.horaMarcacao, '15:33');
  // 7 minutos depois, outra pessoa no aparelho; a ponte voltou
  app.hora('2026-10-21', '15:40'); app.quemServe('Aprendiz Teste'); app.resposta.atual = { ok: true };
  app.run('__tg.length=0;');
  app.run('comidaTgFilaTentar()'); await esperar();
  const msgs = app.tgComida().map((d) => d.texto);
  igual(msgs.length, 2);
  assert.ok(msgs[0].endsWith('Quem serviu o 2º horário: Encãotadora Teste às 15:33'), msgs[0]);
  assert.strictEqual(banco.ler(P).ok, true);
});
prova('P3', 'AC5.3 — registro antigo, sem quemServiu e horaMarcacao: cai no comportamento de hoje (quem e hora do reenvio)', async () => {
  const banco = criarBanco({ daycare: { 'avisos-telegram-comida': { '2026-10-21': { [K4]: { ts: local('2026-10-21', '15:20'), ok: false, tentando: false, nome: 'Teste 04', quem: 'Encãotadora Teste', erro: 'ponte fora' } } } } });
  const app = abrir({ dia: '2026-10-21', hora: '15:50', banco, papel: 'recepcao' });
  app.turma(['Teste 04']); app.quemServe('Aprendiz Teste');
  app.run('comidaTgFilaTentar()'); await esperar();
  const msgs = app.tgComida().map((d) => d.texto);
  igual(msgs.length, 2);
  assert.ok(msgs[0].endsWith('Quem serviu o 2º horário: Aprendiz Teste às 15:50'), msgs[0]);
});
prova('P3', 'AC5.3/AC7.2 — depois do prazo o relógio nem lê o nó; às 18:30, 23:58 e 23:59:59, nada vai ao grupo', async () => {
  for (const hora of ['18:30', '23:58', '23:59:59']) {
    const banco = bancoDaFila();
    const app = abrir({ dia: '2026-10-21', hora, banco, papel: 'plantonista' });
    app.turma(['Teste 01']); app.quemServe('Plantonista Teste');
    app.run('comidaTgFilaTentar()'); await esperar();
    igual(banco.log.leituras.filter((p) => /avisos-telegram-comida/.test(p)), [], hora + ': nenhuma leitura de avisos-telegram-comida');
    igual(app.tgComida(), [], hora + ': nada ao grupo');
    igual(app.fetches, [], hora + ': nenhuma ida à ponte');
  }
});
prova('P3', 'AC5.3 — dois aparelhos no mesmo tique (o mesmo banco): só um reenvia (a trava de 2 minutos), e o 2º tique dentro dos 2 min não repete', async () => {
  const banco = bancoDaFila();
  const a = abrir({ dia: '2026-10-21', hora: '15:50', banco, papel: 'recepcao' });
  const b = abrir({ dia: '2026-10-21', hora: '15:50', banco, papel: 'monitor' });
  for (const app of [a, b]) { app.turma(['Teste 01']); app.quemServe('Aprendiz Teste'); }
  a.run('comidaTgFilaTentar()'); b.run('comidaTgFilaTentar()'); await esperar();
  assert.strictEqual(a.tgComida().length + b.tgComida().length, 2, 'um aparelho só manda as 2 mensagens');
  const lock = banco.ler('daycare/comida-tg-retry-lock/2026-10-21/' + K1);
  assert.ok(lock && lock.tentativas === 1 && typeof lock.lockTs === 'number', JSON.stringify(lock));
  banco.poe('daycare/avisos-telegram-comida/2026-10-21/' + K1 + '/ok', false);
  a.hora('2026-10-21', '15:51'); a.run('__tg.length=0;'); a.run('comidaTgFilaTentar()'); await esperar();
  igual(a.tgComida(), [], 'dentro dos 2 minutos, o 2º tique não manda de novo');
});

// ================================================================ P7 — o consumo do banco
prova('P7', 'AC7.1 — a entrada no app não lê nada de dias passados por causa do almoço (sem pendência, com pendência, e na 2ª entrada do dia)', async () => {
  const casos = [['sem pendência de ontem', () => criarBanco({})], ['com pendência de ontem', bancoDoIncidente]];
  for (const [rotulo, fazer] of casos) {
    const banco = fazer();
    for (const vez of ['1ª entrada', '2ª entrada']) {
      const app = abrir({ dia: '2026-10-22', hora: '09:00', banco, papel: 'consultora' });
      banco.zerarLog();
      await entrar(app, 'consultora', '2026-10-22', '09:00:06');
      igual(banco.log.leituras.filter((p) => doDiaPassado(p, '2026-10-22')), [], rotulo + ', ' + vez + ': leituras de dias passados');
      igual(banco.log.leituras.filter((p) => /^daycare\/auditoria\//.test(p)), [], rotulo + ', ' + vez + ': auditoria');
    }
  }
});
prova('P7', 'AC2.1/AC2.4 — «Quem não comeu hoje»: 67 leituras pequenas (3 nós × 21 dias + 4 de hoje), nenhuma de auditoria; e reabrir depois de «reenviar ao grupo» também', async () => {
  const banco = bancoDaTela();
  const app = abrir({ dia: '2026-10-22', hora: '09:00', banco, papel: 'consultora' });
  app.els.empList = { innerHTML: '' }; app.els.empCount = { textContent: '' };
  banco.zerarLog();
  app.run('abrirEmporio()'); await esperar();
  const l = banco.log.leituras.slice();
  igual(l.filter((p) => /auditoria/.test(p)), [], 'nenhuma auditoria');
  assert.strictEqual(l.length, 67, 'leituras: ' + l.length);
  const hoje = ['daycare/almoco/2026-10-22', 'daycare/atividade/2026-10-22/almoco2', 'daycare/avisos-comida/2026-10-22', 'daycare/avisos-telegram-comida/2026-10-22'];
  igual(l.filter((p) => p.indexOf('2026-10-22') >= 0).sort(), hoje.slice().sort(), 'os 4 de hoje');
  assert.strictEqual(l.filter((p) => doDiaPassado(p, '2026-10-22')).length, 63, '3 nós × 21 dias');
  // «reenviar ao grupo» reabre a tela 1,5 s depois: a mesma leitura leve
  app.turma(['Teste 01']); app.quemServe('Consultora Teste');
  const n0 = app.timers.length;
  app.run(`empReenviarGrupo('${K1}')`); await esperar();
  const reabre = app.timers.slice(n0).filter((t) => t.ms === 1500);
  assert.strictEqual(reabre.length, 1, 'a reabertura agendada');
  banco.zerarLog();
  reabre[0].fn(); await esperar();
  igual(banco.log.leituras.filter((p) => /auditoria/.test(p)), [], 'a reabertura não lê auditoria');
  assert.strictEqual(banco.log.leituras.length, 67, 'a reabertura: ' + banco.log.leituras.length);
});
prova('P7', 'AC7.2 — o relógio de 2 min: 1 leitura pequena por aparelho até o prazo, 0 depois', async () => {
  for (const [hora, n] of [['15:50', 1], ['18:00', 1], ['18:01', 0], ['06:59', 0]]) {
    const banco = criarBanco({});
    const app = abrir({ dia: '2026-10-21', hora, banco, papel: 'monitor' });
    app.run('comidaTgFilaTentar()'); await esperar();
    igual(banco.log.leituras.filter((p) => /avisos-telegram-comida/.test(p)), n ? ['daycare/avisos-telegram-comida/2026-10-21'] : [], hora);
  }
});

// ================================================================ R — varreduras do arquivo
function corpoDe(app, nome) { return String(app.run('String(' + nome + ')')); }
prova('R', 'AC1.3 — o lembrete do dia seguinte não existe mais: nenhuma das duas funções, nenhuma chamada na entrada nem na tela, nada grava avisos-telegram-atraso', () => {
  assert.strictEqual((HTML.match(/empChecarAtrasoDiario/g) || []).length, 0, 'empChecarAtrasoDiario');
  assert.strictEqual((HTML.match(/empAvisarAtrasoNoTelegram/g) || []).length, 0, 'empAvisarAtrasoNoTelegram');
  assert.ok(!/ref\(\s*['"]daycare\/avisos-telegram-atraso/.test(HTML), 'ninguém grava avisos-telegram-atraso');
  const app = abrir({});
  ['aplicarLogin', 'abrirEmporio', 'comidaTgFilaTentar'].forEach((f) => assert.ok(!/empChecarAtrasoDiario|empAvisarAtrasoNoTelegram|daycare\/auditoria/.test(corpoDe(app, f)), f));
  assert.ok(!/empHorasDoDia|auditoria/.test(corpoDe(app, 'empCarregarDias')), 'a tela não lê mais a auditoria');
});
prova('R', 'AC4.2/AC4.3 — os únicos pontos com grupo comida são os de B (2), E (1) e F (1), cada um numa função coberta pela guarda; a porta única confere o grupo comida', () => {
  const app = abrir({});
  const todos = (HTML.match(/grupo\s*:\s*['"`]comida['"`]/g) || []).length;
  const donos = { avisarGrupoComida: 2, empVigiaAlmoco2: 1, empFecharDiaAlmoco: 1 };
  let soma = 0;
  for (const f of Object.keys(donos)) {
    const c = corpoDe(app, f);
    const n = (c.match(/grupo\s*:\s*['"`]comida['"`]/g) || []).length;
    assert.strictEqual(n, donos[f], f + ': ' + n);
    assert.ok(/almTgPodeSair\(/.test(c), f + ' passa pela guarda');
    soma += n;
  }
  assert.strictEqual(todos, soma, 'nenhum outro ponto com grupo comida no arquivo (' + todos + ')');
  const porta = corpoDe(app, '__tgReal');   // o tgAvisar real (a prova o embrulha para contar)
  assert.ok(/grupo\s*===\s*['"]comida['"]/.test(porta) && /almTgPodeSair\(/.test(porta) && /foraDoPrazo\s*:\s*true/.test(porta), 'a porta única');
  assert.ok(/almTgPodeSair\(/.test(corpoDe(app, 'comidaTgFilaTentar')), 'o reenvio automático passa pela guarda');
  assert.ok(!/toISOString/.test(corpoDe(app, 'almTgPodeSair') + corpoDe(app, 'almTgPrazo')), 'a guarda não usa toISOString');
});
prova('R', 'AC9.1 — os textos novos de tela são em português, sem palavra proibida da marca e sem emoji além do ⚠', () => {
  const app = abrir({ dia: '2026-10-21', hora: '18:30' });
  app.ctx.__x = { k: K1, grave: true };
  app.run(`EMP_TG={'${K1}':{ok:false, erro:'x'}};`); const a = app.run('empStatusGrupo(__x)');
  app.run(`EMP_TG={'${K1}':{ok:false, foraDoPrazo:true}};`); const b = app.run('empStatusGrupo(__x)');
  const textos = [a, b, app.J('AUDIT_CFG.almocoTelegram.label'), 'passou das ' + app.J('almTgPrazo().fim')].map((t) => String(t).replace(/<[^>]+>/g, ' '));
  for (const t of textos) {
    assert.ok(!/\b(cachorro|cão|cães|cãozinho|animal|bicho|dono|funcionári[oa]|atendente)\b/i.test(t), t);
    assert.ok(!/[\u{1F300}-\u{1FAFF}]/u.test(t), 'sem emoji: ' + t);
  }
});

// ---------------------------------------------------------------- roda
(async () => {
  let ok = 0; const falhas = [];
  for (const p of fila) {
    if (SO.length && SO.indexOf(p.id) < 0) continue;
    try { await p.fn(); ok++; console.log('  ✓ ' + p.nome); }
    catch (e) { falhas.push(p.nome); console.log('  ✗ ' + p.nome + '\n      ' + String((e && e.message) || e).split('\n').slice(0, 6).join('\n      ')); }
  }
  console.log('\n' + ok + ' passaram, ' + falhas.length + ' falharam (fuso ' + (process.env.TZ || 'do sistema') + ').');
  process.exit(falhas.length ? 1 : 0);
})();
