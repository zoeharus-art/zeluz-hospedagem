'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const App = require('../auaulandia/marcia129/app.js');
const Painel = require('../auaulandia/marcia129/painel.js');

function snap(dia, marker) { return { dia, agenda: { estado: 'pronto', itens: [] }, marker }; }
function setup(opcoes = {}) {
  const state = { pode: opcoes.pode !== false, autor: opcoes.autor === undefined ? { id: 'g1', nome: 'Gestora Fictícia' } : opcoes.autor,
    created: 0, observers: [], stops: 0, closed: 0, cacheSetup: 0, cacheCleanup: 0, mounted: 0, destroyed: 0, updates: [], saves: [] };
  const raiz = { textContent: '', contains() { return true; } };
  const fonte = {
    observar(dia, cb) {
      const entry = { dia, cb, active: true };
      state.observers.push(entry);
      cb(snap(dia, 'initial'));
      return () => { if (entry.active) { entry.active = false; state.stops += 1; } };
    },
    fechar() { state.closed += 1; },
    recalcular() { state.recalculations = (state.recalculations || 0) + 1; },
    salvarTarefa(pedido) {
      state.saves.push(pedido);
      const autor = state.autor;
      if (!state.pode || !autor || !autor.id || !autor.nome) return Promise.reject(new Error('AUTORIA_OBRIGATORIA'));
      return Promise.resolve({ id: pedido.id, feito: pedido.feito, quem: autor.nome, quando: '24/10/2026 10:30' });
    }
  };
  const data = { criar(deps) { state.created += 1; state.dataDeps = deps; return fonte; } };
  const painel = { montar(root, opts) {
    state.mounted += 1; state.root = root; state.opts = opts;
    opts.carregar(opcoes.dia || '2026-10-24');
    return { atualizar(s) { state.updates.push(s); }, destroy() { state.destroyed += 1; } };
  } };
  const app = App.criar({
    raiz: () => raiz, pode: () => state.pode, autor: () => state.autor, db: () => ({}),
    dados: data, painel, dia: () => opcoes.dia || '2026-10-24',
    fontesCadastro: () => ({ pronto: true }), helpers: { marcador: true },
    hospedes: {}, presenca: {}, agora: () => 1,
    observarCaches(cb) { state.cacheSetup += 1; state.cacheCallback = cb; return () => { state.cacheCleanup += 1; }; }
  });
  return { app, fonte, state, raiz };
}

(async () => {
  assert.equal(typeof App.criar, 'function');

  // One provider, one panel, and one live observer per open; no parallel once/load bootstrap.
  const x = setup();
  assert.equal(x.app.abrir(), true);
  assert.equal(x.state.created, 1);
  assert.equal(x.state.mounted, 1);
  assert.equal(x.state.observers.length, 1);
  assert.equal(x.state.cacheSetup, 1);
  const cacheSignal = x.state.cacheCallback;
  cacheSignal();
  assert.equal(x.state.recalculations, 1, 'existing cache notification recalculates the active provider');
  assert.equal(x.state.dataDeps.autor(), x.state.autor);
  assert.equal(x.state.updates.length, 0, 'first value resolves the panel loader rather than double-rendering');

  // Date change closes the old source and stale callbacks cannot repaint the current day.
  const old = x.state.observers[0];
  x.state.opts.carregar('2026-10-25');
  const current = x.state.observers[1];
  assert.equal(x.state.stops, 1);
  const updatesBeforeStale = x.state.updates.length;
  old.cb(snap(old.dia, 'stale'));
  assert.equal(x.state.updates.length, updatesBeforeStale, 'old source callback does not repaint');
  current.cb(snap(current.dia, 'current-update'));
  assert.equal(x.state.updates.length, updatesBeforeStale + 1);
  assert.equal(x.state.updates.at(-1).marker, 'current-update');

  // Authorship is passed to the provider; an absent/empty author cannot persist a task.
  x.state.autor = { id: '', nome: '' };
  await assert.rejects(x.state.opts.salvarTarefa({ dia: '2026-10-25', id: 't1', feito: true }), /SEM_PERMISSAO/);
  assert.equal(x.state.saves.length, 0, 'author identity cannot change within an open session');
  x.state.autor = { id: 'g1', nome: 'Gestora Fictícia' };
  x.state.pode = false;
  await assert.rejects(x.state.opts.salvarTarefa({ dia: '2026-10-25', id: 't1', feito: true }), /SEM_PERMISSAO/);
  assert.equal(x.state.saves.length, 0, 'revoked capability blocks before provider call');
  x.state.pode = true;

  // Closing the route cleans source, caches, and panel; stale callbacks after close are inert.
  x.app.fechar();
  cacheSignal();
  assert.equal(x.state.recalculations, 1, 'cache notification after dispose is inert');
  assert.equal(x.state.stops, 2);
  assert.equal(x.state.cacheCleanup, 1);
  assert.equal(x.state.closed, 1);
  assert.equal(x.state.destroyed, 1);
  const updatesBefore = x.state.updates.length;
  current.cb(snap(current.dia, 'after-close'));
  assert.equal(x.state.updates.length, updatesBefore);

  // Reopening tears down the former bootstrap before creating one new instance.
  assert.equal(x.app.abrir(), true);
  assert.equal(x.state.created, 2);
  assert.equal(x.state.mounted, 2);
  assert.equal(x.state.observers.length, 3);
  assert.equal(x.state.cacheSetup, 2);
  x.app.fechar();
  assert.equal(x.state.cacheCleanup, 2);
  assert.equal(x.state.closed, 2);

  // Capability gate denies opening before reading/creating the provider.
  const deny = setup({ pode: false });
  assert.equal(deny.app.abrir(), false);
  assert.equal(deny.state.created, 0);
  assert.equal(deny.state.observers.length, 0);
  assert.match(deny.raiz.textContent, /Gestão e Diretoria/);

  // The production script/route and allowlist wiring are present and leave on route exit.
  const base = path.resolve(__dirname, '..');
  const page = fs.readFileSync(path.join(base, 'auaulandia/index.html'), 'utf8');
  const allow = fs.readFileSync(path.join(base, '.github/site-permitidos.txt'), 'utf8');
  const nav = fs.readFileSync(path.join(base, 'auaulandia/navegacao-inicio.js'), 'utf8');
  const appSource = fs.readFileSync(path.join(base, 'auaulandia/marcia129/app.js'), 'utf8');
  ['marcia129/painel.js', 'marcia129/dados.js', 'marcia129/app.js'].forEach(src => {
    const version = (page.match(/const APP_VERSAO='([^']+)'/) || [])[1];
    assert(page.includes('<script src="' + src + '?v=' + version + '"></script>'), src + ' linked to the current app version');
    assert(allow.split(/\r?\n/).includes('auaulandia/' + src), src + ' publish-allowlisted');
  });
  assert(page.includes('data-v="gestaomarcia"'));
  assert(page.includes("gestaomarcia:['Márcia Gestão'"));
  assert(page.includes("if(v!=='gestaomarcia' && typeof marcia129Fechar==='function') marcia129Fechar()"));
  assert(page.includes("if(v==='gestaomarcia'){ if(typeof marcia129Abrir==='function') marcia129Abrir(); }"));
  assert(nav.includes("rota:'gestaomarcia'"));
  assert(appSource.includes('root.marcia129CachesMudaram=function(){if(atual)atual.recalcular();}'));
  assert.equal((page.match(/if\(typeof marcia129CachesMudaram==='function'\)marcia129CachesMudaram\(\);/g) || []).length, 2, 'existing repo listener signals both success and error without a new read');
  assert(appSource.includes("reposProntas:typeof REPO_LIDO!=='undefined'&&REPO_LIDO===true&&!(typeof REPO_ERRO!=='undefined'&&REPO_ERRO)"));

  // Real provider + fake RTDB interfaces: no Firebase/network and no collection-wide once() reads.
  const Dados = require('../auaulandia/marcia129/dados.js');
  class BancoFalso {
    constructor() { this.valores = { 'daycare/ocorrencias/2026-10-24': { x1: { pet: 'FILHOt Inventado', tutor: 'Tutor Inventado', origem: 'Check-in', itens: ['Observação fictícia'] } } }; this.leiturasUnicas = 0; this.writes = []; this.listeners = {}; this.off = 0; }
    ref(path) {
      const db = this;
      return {
        once() { db.leiturasUnicas += 1; return Promise.resolve({ val: () => db.valores[path] || null }); },
        on(tipo, ok, erro) { (db.listeners[path] || (db.listeners[path] = [])).push({ ok, erro }); setImmediate(() => ok({ val: () => db.valores[path] || null })); },
        off(tipo, ok) { db.off += 1; db.listeners[path] = (db.listeners[path] || []).filter(x => x.ok !== ok); },
        transaction(fn) { db.writes.push(path); const before = db.valores[path] || null; const next = fn(before); if (next === undefined) return Promise.resolve({ committed: false, snapshot: { val: () => before } }); db.valores[path] = next; return Promise.resolve({ committed: true, snapshot: { val: () => next } }); }
      };
    }
  }
  const banco = new BancoFalso();
  let autorReal = { id: '', nome: '' }, capability = true, gotSnapshot = null, mounted = null, destroyed = 0;
  const rootPanel = { contains() { return true; } };
  const fakePanel = { montar(root, opts) { mounted = opts; opts.carregar('2026-10-24'); return { atualizar(x) { gotSnapshot = x; }, destroy() { destroyed += 1; } }; } };
  const hospedes = require('../auaulandia/hospedes-atividades.js');
  const integrated = App.criar({
    raiz: () => rootPanel, pode: () => capability, autor: () => autorReal, db: () => banco,
    dados: Dados, painel: fakePanel, dia: () => '2026-10-24',
    fontesCadastro: () => ({ pronto: true, peludinhos: [], estadiasProntas: true, estadias: {}, reposProntas: true, reposicoes: [] }),
    helpers: { dcKey: () => '', pelKey: () => '', pelDias: () => [], pelGet: () => '', pelExtra: () => ({}), pelInativo: () => false, ehMoradorZeluz: () => false, diffMin: () => null },
    hospedes, presenca: { checkinValido: () => false, checkoutValido: () => false, refeicaoPositiva: () => false, resumoGestao: () => ({ estado: 'pronto', avisadas: [], trocasReposicoes: [], contatar: [], revisao15: false }) },
    agora: () => Date.parse('2026-10-24T12:30:00-03:00')
  });
  assert.equal(integrated.abrir(), true);
  await new Promise(resolve => setImmediate(resolve)); await new Promise(resolve => setImmediate(resolve));
  assert.equal(banco.leiturasUnicas, 0, 'integration boot uses observers rather than duplicate once reads');
  assert(gotSnapshot && gotSnapshot.tarefas.itens.some(t => t.categoria === 'saude'), 'existing occurrence creates a derived task');
  const tarefaSaude = gotSnapshot.tarefas.itens.find(t => t.categoria === 'saude');
  await assert.rejects(mounted.salvarTarefa({ dia: '2026-10-24', id: tarefaSaude.id, feito: true }), /AUTORIA_OBRIGATORIA/);
  assert.equal(banco.writes.length, 0, 'invalid author cannot start a database transaction');
  autorReal = { id: 'gestao-ficticia', nome: 'Gestora Fictícia' };
  const ack = await mounted.salvarTarefa({ dia: '2026-10-24', id: tarefaSaude.id, feito: true });
  assert.equal(ack.quem, 'Gestora Fictícia');
  assert.equal(banco.writes.length, 1);
  capability = false;
  await assert.rejects(mounted.salvarTarefa({ dia: '2026-10-24', id: tarefaSaude.id, feito: false }), /SEM_PERMISSAO/);
  assert.equal(banco.writes.length, 1, 'capability is checked again before write');
  integrated.fechar();
  assert.equal(banco.off, 14, 'closing the route detaches each daily source listener');
  assert.equal(destroyed, 1);
  // Installation tears down for either a new identity or a changed display name, with no Firebase event.
  const savedGlobals = { usuarioAtual: globalThis.usuarioAtual, podePapel: globalThis.podePapel, DB: globalThis.DB };
  const sessionHost = { innerHTML: '', ownerDocument: { activeElement: null }, handlers: {}, addEventListener(k, fn) { this.handlers[k] = fn; }, removeEventListener(k) { delete this.handlers[k]; }, querySelectorAll() { return []; }, querySelector() { return null; }, contains() { return true; } };
  class ObserverFalso { static instances = []; constructor(cb) { this.cb = cb; this.disconnected = false; ObserverFalso.instances.push(this); } observe() {} disconnect() { this.disconnected = true; } }
  const actorSession = { id: 'gestora-a', nome: 'Gestora A' }, sessionDb = new BancoFalso();
  const appRoot = { document: { body: {}, getElementById(id) { return id === 'marcia129Root' ? sessionHost : { classList: { contains() { return false; } } }; } }, MutationObserver: ObserverFalso,
    ZeluzMarciaDados129: Dados, ZeluzMarcia129: Painel, ZeluzHospedesAtividades: hospedes, ZeluzPresenca96Core: {} };
  globalThis.usuarioAtual = () => actorSession; globalThis.podePapel = cap => cap === 'painel-operacao'; globalThis.DB = sessionDb;
  App.instalar(appRoot);
  assert.equal(appRoot.marcia129Abrir(), true);
  await Promise.resolve();
  ObserverFalso.instances.at(-1).cb([]); // no fake source callback has run yet
  actorSession.nome = 'Gestora A Atualizada';
  ObserverFalso.instances.at(-1).cb([]);
  assert.equal(sessionDb.off, 14, 'name change closes all 14 provider subscriptions without a source callback');
  assert.equal(ObserverFalso.instances.at(-1).disconnected, true);
  assert.equal(appRoot.marcia129Abrir(), true);
  await Promise.resolve();
  actorSession.id = 'gestora-b';
  ObserverFalso.instances.at(-1).cb([]);
  assert.equal(sessionDb.off, 28, 'identity change closes the reopened 14 subscriptions immediately');
  assert.equal(ObserverFalso.instances.at(-1).disconnected, true);
  globalThis.usuarioAtual = savedGlobals.usuarioAtual; globalThis.podePapel = savedGlobals.podePapel; globalThis.DB = savedGlobals.DB;

  // Real app + provider + panel, fake RTDB only: stale ABA revisions and evaluation ACK path.
  const DIA = '2026-10-24';
  const incompleteHtml = Painel.desenhar({ dia: DIA,
    agenda: { estado: 'pronto', itens: [{ id: 'avaliacao-x', codigoOrigem: 'x', nome: 'Pet Inventado', raca: 'SRD', tutor: 'Tutor Inventado', hora: '09:00',
      vacina: { conferido: true }, vermifugo: { conferido: false }, carrapaticida: { conferido: false }, observacoes: [], conferencia: { tutor: 'Tutor Inventado', revisao: 0 } }] },
    quantidades: { estado: 'pronto' }, faltas: { estado: 'pronto', itens: [] }, novatos: { estado: 'pronto', itens: [] }, comida: { estado: 'pronto', itens: [] }, saude: { estado: 'pronto', itens: [] }, tempos: { estado: 'pronto', itens: [] }, tarefas: { estado: 'pronto', itens: [] }
  }, { dia: DIA, podeSalvarAvaliacao: true });
  assert(incompleteHtml.includes('Dados a conferir'), 'a required prevention value left unknown remains visibly incomplete');
  assert(incompleteHtml.includes('name="vacina-conferido" type="checkbox" checked'), 'the known check remains checked');
  assert(incompleteHtml.includes('name="vermifugo-conferido" type="checkbox"'), 'an unknown check remains visible');
  assert(!incompleteHtml.includes('type="date"') && !incompleteHtml.includes('name="vacina-data"'), 'prevention uses checkboxes and asks for no dates');
  assert(incompleteHtml.includes('name="vermifugo-conferido" type="checkbox"'), 'required unknown values stay exposed rather than hidden');
  const toneHtml = Painel.desenhar({ dia: DIA, agenda: { estado: 'pronto', itens: [] }, quantidades: { estado: 'pronto' },
    faltas: { estado: 'pronto', itens: [{ id: 'f1', nome: 'Pet falta fictícia', situacao: 'Falta sem aviso' }] },
    novatos: { estado: 'pronto', itens: [{ id: 'n1', nome: 'Pet novo fictício' }] },
    comida: { estado: 'pronto', itens: [{ id: 'cd', nome: 'DayCare fictício', grupo: 'daycare', situacao: 'Não comeu' }, { id: 'ch', nome: 'Hóspede fictício', grupo: 'hospede', situacao: 'Não comeu' }] },
    saude: { estado: 'pronto', itens: [] }, tempos: { estado: 'pronto', itens: [] }, tarefas: { estado: 'pronto', itens: [] }
  }, { dia: DIA });
  for (const [section, tone] of [['faltas', 'critico'], ['novatos', 'info'], ['comida-daycare', 'atencao'], ['comida-hospedes', 'critico']]) {
    const block = new RegExp('<details[^>]*data-marcia-secao="' + section + '"[\\s\\S]*?<\\/details>').exec(toneHtml);
    assert(block && block[0].includes('marcia129__secao-badge--' + tone), section + ' uses the requested status tone');
  }
  async function rejeitaAckPrevencaoInvalida(valorVacina, pedidoVacina = true) {
    const raizAck = { innerHTML: '', ownerDocument: { activeElement: null }, handlers: {}, addEventListener(k, fn) { this.handlers[k] = fn; }, removeEventListener(k) { delete this.handlers[k]; }, querySelectorAll() { return []; }, querySelector() { return null; }, contains() { return true; } };
    const itemAck = { id: 'avaliacao-ack', codigoOrigem: 'origem-ack', nome: 'Pet ACK fictício', raca: 'SRD', hora: '10:00', tutor: 'Tutor fictício', vacina: { conferido: false }, vermifugo: { conferido: false }, carrapaticida: { conferido: false }, observacoes: [], conferencia: { tutor: 'Tutor fictício', revisao: 0 } };
    const painelAck = Painel.montar(raizAck, { dia: DIA, carregar: async d => ({ dia: d, agenda: { estado: 'pronto', itens: [itemAck] }, quantidades: { estado: 'pronto' }, faltas: { estado: 'pronto', itens: [] }, novatos: { estado: 'pronto', itens: [] }, comida: { estado: 'pronto', itens: [] }, saude: { estado: 'pronto', itens: [] }, tempos: { estado: 'pronto', itens: [] }, tarefas: { estado: 'pronto', itens: [] } }), salvarTarefa: async () => ({}), salvarAvaliacao: async () => ({ id: itemAck.id, codigoOrigem: itemAck.codigoOrigem, agenda: { tutor: 'Tutor fictício', vacina: { conferido: valorVacina }, vermifugo: { conferido: false }, carrapaticida: { conferido: false } }, conferencia: { tutor: 'Tutor fictício', quem: 'Gestora fictícia', quando: '24/10/2026 11:00', revisao: 1 } }) });
    await new Promise(resolve => setImmediate(resolve));
    const formAck = { closest() { return this; }, getAttribute(k) { return k === 'data-marcia-form-avaliacao' ? itemAck.id : null; }, querySelector(sel) { const m = /^\[name="(.+)"\]$/.exec(sel); const v = { tutor: 'Tutor fictício', 'vacina-conferido': pedidoVacina, 'vermifugo-conferido': false, 'carrapaticida-conferido': false, expectedRevision: '0' }; return m ? { value: v[m[1]] || '', checked: v[m[1]] === true } : null; } };
    raizAck.handlers.submit({ target: formAck, preventDefault() {} });
    await new Promise(resolve => setImmediate(resolve)); await new Promise(resolve => setImmediate(resolve));
    assert(raizAck.innerHTML.includes('role="alert"'), 'malformed prevention ACK is surfaced as a save error');
    assert(!raizAck.innerHTML.includes('role="status">Conferência salva'), 'malformed prevention ACK cannot show success');
    painelAck.destroy();
  }
  await rejeitaAckPrevencaoInvalida(undefined);
  await rejeitaAckPrevencaoInvalida('false');
  await rejeitaAckPrevencaoInvalida(true, false);
  const bancoFlow = new BancoFalso();
  bancoFlow.valores['daycare/dashboard/' + DIA] = { avaliacao: { a1: { valor: 'FILHOt Inventado / SRD', hora: '09:00' } } };
  bancoFlow.valores['daycare/ocorrencias/' + DIA] = { o1: { pet: 'FILHOt Inventado', tutor: 'Tutor Fictício', origem: 'Check-in', itens: ['Nota sintética'] } };
  const htmlRoot = { innerHTML: '', ownerDocument: { activeElement: null }, handlers: {}, addEventListener(k, fn) { this.handlers[k] = fn; }, removeEventListener(k) { delete this.handlers[k]; }, querySelectorAll() { return []; }, querySelector() { return null; }, contains() { return true; } };
  let flowOpts;
  const painelReal = { montar(root, opts) { flowOpts = opts; return Painel.montar(root, opts); } };
  const flowAutor = { id: 'gestao-offline', nome: 'Gestora Offline' };
  const fluxo = App.criar({ raiz: () => htmlRoot, pode: () => true, autor: () => flowAutor, db: () => bancoFlow,
    dados: Dados, painel: painelReal, dia: () => DIA,
    fontesCadastro: () => ({ pronto: true, peludinhos: [], estadiasProntas: true, estadias: {}, reposProntas: true, reposicoes: [] }),
    helpers: { dcKey: () => '', pelKey: () => '', pelDias: () => [], pelGet: () => '', pelExtra: () => ({}), pelInativo: () => false, ehMoradorZeluz: () => false, diffMin: () => null },
    hospedes, presenca: { checkinValido: () => false, checkoutValido: () => false, refeicaoPositiva: () => false, resumoGestao: () => ({ estado: 'pronto', avisadas: [], trocasReposicoes: [], contatar: [], revisao15: false }) },
    agora: () => Date.parse('2026-10-24T12:30:00-03:00') });
  assert.equal(fluxo.abrir(), true);
  await new Promise(resolve => setImmediate(resolve)); await new Promise(resolve => setImmediate(resolve)); await new Promise(resolve => setImmediate(resolve));
  assert.equal(bancoFlow.leiturasUnicas, 0);
  assert(htmlRoot.innerHTML.includes('FILHOt Inventado'));
  assert(htmlRoot.innerHTML.includes('Questões do check-in'));
  const tarefaMatch = /data-marcia-tarefa="([^"]+)"/.exec(htmlRoot.innerHTML);
  assert(tarefaMatch, 'real provider task is rendered in the real panel');
  const tarefaPath = 'daycare/painel-tarefas/' + DIA + '/' + tarefaMatch[1];
  const tarefasMasterPath = 'daycare/painel-tarefas/' + DIA;
  const dashboardAntes = JSON.parse(JSON.stringify(bancoFlow.valores['daycare/dashboard/' + DIA]));
  const writeCount = bancoFlow.writes.length;
  await assert.rejects(flowOpts.salvarTarefa({ dia: 'invalid-date', id: tarefaMatch[1], feito: true }), /DIA_INVALIDO/);
  assert.equal(bancoFlow.writes.length, writeCount, 'invalid day rejected before any transaction');
  bancoFlow.valores[tarefaPath] = { feito: false, revisao: 2 };
  const clickTask = () => htmlRoot.handlers.click({ target: { closest() { return this; }, hasAttribute(k) { return k === 'data-marcia-tarefa'; }, getAttribute(k) { return k === 'data-marcia-tarefa' ? tarefaMatch[1] : null; } } });
  clickTask(); await new Promise(resolve => setImmediate(resolve)); await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(bancoFlow.valores[tarefaPath], { feito: false, revisao: 2 }, 'stale A→B→A revision is rejected by CAS');
  assert(bancoFlow.writes.every(path => path === tarefaPath), 'task writes are scoped to that task node');
  const parentListener = bancoFlow.listeners[tarefasMasterPath] || [];
  parentListener.forEach(x => x.ok({ val: () => ({ [tarefaMatch[1]]: bancoFlow.valores[tarefaPath] }) }));
  await new Promise(resolve => setImmediate(resolve));
  clickTask(); await new Promise(resolve => setImmediate(resolve)); await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(bancoFlow.valores[tarefaPath].feito, true);
  assert.equal(bancoFlow.valores[tarefaPath].autorId, flowAutor.id);
  assert(htmlRoot.innerHTML.includes('Gestora Offline'));
  assert.deepEqual(bancoFlow.valores['daycare/dashboard/' + DIA], dashboardAntes, 'task writes preserve the source dashboard record');

  const avaliacaoFormMatch = /data-marcia-form-avaliacao="([^"]+)"/.exec(htmlRoot.innerHTML);
  assert(avaliacaoFormMatch, 'real source assessment exposes a save form');
  const formValues = { tutor: 'Tutor Fictício', 'vacina-conferido': true, 'vermifugo-conferido': true, 'carrapaticida-conferido': true, experiencia: 'Frequenta creche', saude: '', observacoes: 'Nota de teste', expectedRevision: '' };
  const formReal = { closest() { return this; }, getAttribute(k) { return k === 'data-marcia-form-avaliacao' ? avaliacaoFormMatch[1] : null; }, querySelector(sel) { const m = /^\[name="(.+)"\]$/.exec(sel); return m ? { value: formValues[m[1]] || '', checked: formValues[m[1]] === true } : null; } };
  const writesBeforeInvalid = bancoFlow.writes.length;
  await assert.rejects(flowOpts.salvarAvaliacao({ dia: DIA, id: avaliacaoFormMatch[1], tutor: 'Tutor Fictício', vacina: { conferido: 'sim' }, vermifugo: { conferido: false }, carrapaticida: { conferido: true }, expectedRevision: 0 }), /VACINA_INVALIDO/);
  assert.equal(bancoFlow.writes.length, writesBeforeInvalid, 'malformed checkbox is rejected before transaction/master write');
  htmlRoot.handlers.submit({ target: formReal, preventDefault() {} });
  await new Promise(resolve => setImmediate(resolve)); await new Promise(resolve => setImmediate(resolve)); await new Promise(resolve => setImmediate(resolve));
  assert(bancoFlow.writes.some(path => path === 'daycare/avaliacoes-gestao/' + DIA + '/a1'), 'valid form submits via provider transaction');
  assert(!htmlRoot.innerHTML.includes('Não foi possível salvar a conferência'), 'the real UI accepts the provider ACK');
  assert(htmlRoot.innerHTML.includes('role="status">Conferência salva · Gestora Offline · '), 'a saved assessment reports accessible success feedback');
  assert(htmlRoot.innerHTML.includes('name="vacina-conferido" type="checkbox" checked') && htmlRoot.innerHTML.includes('name="vermifugo-conferido" type="checkbox" checked') && htmlRoot.innerHTML.includes('name="carrapaticida-conferido" type="checkbox" checked'), 'a complete assessment keeps all three checks available after save');
  assert(!htmlRoot.innerHTML.includes('Dados a conferir'), 'complete checks do not leave a stale incomplete summary');
  assert.deepEqual(bancoFlow.valores['daycare/dashboard/' + DIA], dashboardAntes, 'assessment metadata must not mutate the source assessment');
  const metaAvaliacaoPath = 'daycare/avaliacoes-gestao/' + DIA + '/a1';
  assert.equal(bancoFlow.valores[metaAvaliacaoPath].revisao, 1);
  assert.equal(bancoFlow.valores[metaAvaliacaoPath].autorId, flowAutor.id);
  assert.equal(bancoFlow.valores[metaAvaliacaoPath].vacina.conferido, true);
  assert.equal(bancoFlow.valores[metaAvaliacaoPath].vermifugo.conferido, true);
  assert(htmlRoot.innerHTML.includes('name="vacina-conferido" type="checkbox" checked'), 'provider ACK leaves the confirmed checkbox checked');
  assert(htmlRoot.innerHTML.includes('name="vermifugo-conferido" type="checkbox" checked'), 'provider ACK leaves the checked value available to edit');
  const writesAtRevision1 = bancoFlow.writes.length;
  await assert.rejects(flowOpts.salvarAvaliacao({ dia: DIA, id: avaliacaoFormMatch[1], tutor: 'Tutor Fictício', vacina: { conferido: true }, vermifugo: { conferido: true }, carrapaticida: { conferido: true }, expectedRevision: 0 }), /AVALIACAO_DESATUALIZADA/);
  assert.equal(bancoFlow.writes.length, writesAtRevision1, 'stale revision is rejected before another transaction');
  formValues.expectedRevision = '1';
  formValues['vacina-conferido'] = false;
  formValues['vermifugo-conferido'] = true;
  htmlRoot.handlers.submit({ target: formReal, preventDefault() {} });
  await new Promise(resolve => setImmediate(resolve)); await new Promise(resolve => setImmediate(resolve)); await new Promise(resolve => setImmediate(resolve));
  assert.equal(bancoFlow.valores[metaAvaliacaoPath].revisao, 2, 'second UI save uses revision 1');
  assert.equal(bancoFlow.valores[metaAvaliacaoPath].vacina.conferido, false, 'second save can uncheck a previously confirmed item');
  assert.equal(bancoFlow.valores[metaAvaliacaoPath].vermifugo.conferido, true);
  assert(/name="vacina-conferido" type="checkbox"(?! checked)/.test(htmlRoot.innerHTML), 'unchecked state is reflected in the form after the second ACK');
  assert(!htmlRoot.innerHTML.includes('Não foi possível salvar a conferência'));
  assert.deepEqual(bancoFlow.valores['daycare/dashboard/' + DIA], dashboardAntes, 'second save still preserves master record');
  fluxo.fechar();
  console.log('marcia-integracao129: OK');
})().catch(e => { console.error(e); process.exitCode = 1; });
