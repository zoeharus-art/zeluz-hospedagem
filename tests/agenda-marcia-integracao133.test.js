'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Agenda = require('../auaulandia/agenda-marcia/dados.js');

const DIA = '2026-10-26';
const PAI = 'daycare/dashboard/' + DIA + '/avaliacao';
const ROOT = path.resolve(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(ROOT, 'auaulandia/index.html'), 'utf8');

function clone(v) { return v == null ? v : JSON.parse(JSON.stringify(v)); }
function snap(v) { return { val() { return clone(v); } }; }

/* Firebase-shaped fake: transactions are real state transitions, but remain local. */
class FakeDB {
  constructor() { this.data = {}; this.listeners = new Map(); this.writes = []; this.removes = []; this.pushN = 0; }
  ref(p) { return new FakeRef(this, p || ''); }
  get(p) {
    let v = this.data;
    for (const part of p.split('/').filter(Boolean)) { if (v == null) return null; v = v[part]; }
    return v === undefined ? null : clone(v);
  }
  put(p, value) {
    const parts = p.split('/').filter(Boolean); let cur = this.data;
    for (const part of parts.slice(0, -1)) cur = cur[part] || (cur[part] = {});
    const key = parts.at(-1);
    if (value === null) { if (cur) delete cur[key]; }
    else cur[key] = clone(value);
    this.notify(p);
  }
  notify(p) {
    const parts = p.split('/').filter(Boolean);
    for (let n = 1; n <= parts.length; n++) {
      const parent = parts.slice(0, n).join('/');
      const listeners = this.listeners.get(parent) || [];
      const value = this.get(parent);
      listeners.slice().forEach(fn => fn(snap(value)));
    }
  }
}
class FakeRef {
  constructor(db, p) { this.db = db; this.path = p; }
  push() { this.db.pushN += 1; return { key: 'qa133-' + this.db.pushN }; }
  on(event, ok) { assert.equal(event, 'value'); const a = this.db.listeners.get(this.path) || []; a.push(ok); this.db.listeners.set(this.path, a); ok(snap(this.db.get(this.path))); return ok; }
  off(event, ok) { assert.equal(event, 'value'); this.db.listeners.set(this.path, (this.db.listeners.get(this.path) || []).filter(x => x !== ok)); }
  once(event) { assert.equal(event, 'value'); return Promise.resolve(snap(this.db.get(this.path))); }
  transaction(fn) {
    this.db.writes.push({ op: 'transaction', path: this.path });
    const before = this.db.get(this.path), next = fn(clone(before));
    if (next === undefined) return Promise.resolve({ committed: false, snapshot: snap(before) });
    this.db.put(this.path, next);
    return Promise.resolve({ committed: true, snapshot: snap(next) });
  }
  update(patch) {
    const value = this.db.get(this.path) || {};
    Object.keys(patch).forEach(k => patch[k] === null ? delete value[k] : value[k] = clone(patch[k]));
    this.db.put(this.path, value); return Promise.resolve();
  }
  set(value) { this.db.put(this.path, value); return Promise.resolve(); }
  remove() { this.db.removes.push(this.path); this.db.put(this.path, null); return Promise.resolve(); }
}

function extractTopLevel(name) {
  const marker = '  function ' + name + '(';
  const start = indexHtml.indexOf(marker);
  assert.notEqual(start, -1, 'função nativa encontrada: ' + name);
  const end = indexHtml.indexOf('\n  function ', start + marker.length);
  assert.notEqual(end, -1, 'fim da função nativa encontrado: ' + name);
  return indexHtml.slice(start, end).trim();
}

function createNative(db, transport) {
  const env = {
    DB: db,
    DASH_ITENS: [{ k: 'avaliacao', t: 'Avaliação', col: 'Avaliação', colHora: 'Horário' }],
    DASH_DADOS: {}, DASH_PONTE: { url: 'https://ponte.invalid', token: 'synthetic' },
    DASH_FILA_SEMCOL: false,
    dashNo: () => 'daycare/dashboard/' + DIA,
    dashDia: () => DIA,
    dashPonteChamar: payload => transport(clone(payload)),
    usuarioAtual: () => ({ monId: 'recepcao-1', pessoa: 'Consultora QA' }),
    dashPodeTirar: () => true,
    papelDoCorpo: () => 'recepcao',
    telaVemDoPapel: (tela, papel) => tela === 'agendamarcia' && papel === 'recepcao',
    paginaConcedida: () => false,
    dashAtualizarCard: () => {}, renderDash: () => {}, audit: () => {},
    _logFalhaGrav: () => {}, jsNorm: x => String(x || '').trim().toLocaleLowerCase('pt-BR'),
    ZeluzAgendaMarcia: Agenda
  };
  env.globalThis = env;
  vm.createContext(env);
  [
    'dashItem', 'dashVaiParaPlanilha', 'dashAgendaMarciaRegistro133',
    'dashAgendaMarciaPublicavel133', 'dashAgendaMarciaFiltrar133',
    'dashAgendaMarciaProjecao133', 'dashAgendaMarciaAtor133',
    'dashAgendaMarciaPode133', 'dashAgendaMarciaProjetar133',
    'dashLimparFantasmas', 'dashMesmoTextoEmOutro', 'dashEspelhar',
    'dashPlanFilaPendentes', 'dashPlanFilaMorto', 'dashPlanFilaErroDeConfig',
    'dashPlanFilaReenviar', 'dashReenviar'
  ].forEach(name => vm.runInContext(extractTopLevel(name), env, { filename: 'index.html:' + name }));
  return env;
}

function fields(payment) {
  return {
    nome: 'Luna', raca: 'SRD', tutor: 'Tutor Luna', hora: '09:30',
    vacina: { conferido: true }, vermifugo: { conferido: false }, carrapaticida: { conferido: true },
    experiencia: 'Primeira visita', saude: '', observacoes: '', pagamento: payment || { recebido: false, valorCent: 0 }
  };
}
function makeApi(db, native) {
  return Agenda.criar({
    db, pode: () => true, autor: () => ({ id: 'recepcao-1', nome: 'Consultora QA' }),
    agora: () => Date.parse('2026-10-25T12:00:00-03:00'),
    aoSalvar(ctx) {
      if (ctx.acaoProjecao === 'nenhuma') return { ok: true };
      return native.dashAgendaMarciaProjetar133(ctx.dia, ctx.id, ctx.registro, false);
    }
  });
}
function createCmd(id, payment) {
  return { acao: 'criar', dia: DIA, requestId: id, avaliacao: fields(payment) };
}
function node(db, id) { return db.get(PAI + '/' + id); }
function summarizePayments(r) {
  const a = r.det.avaliacao129, p = a.pagamento || {};
  return { recebido: p.recebido, valorPagoCentavos: p.valorPagoCentavos, autorId: p.autorId, autorNome: p.autorNome, ts: p.ts, historico: p.historico };
}
function deferred() {
  let resolve;
  const promise = new Promise(r => { resolve = r; });
  return { promise, resolve };
}
async function until(test, message) {
  for (let i = 0; i < 80; i += 1) { if (test()) return; await new Promise(r => setTimeout(r, 1)); }
  assert.fail(message);
}

async function run() {
  let posts = [];
  const parityIssues = [];
  const permissionIssues = [];
  const db = new FakeDB();
  const native = createNative(db, payload => { posts.push(payload); return Promise.resolve({ ok: true, linha: posts.length + 10 }); });
  const api = makeApi(db, native);

  // Permissão exclusiva da Agenda é suficiente; ausência dela nega projeção sem enviar.
  const agendaOnlyDb = new FakeDB(), agendaOnlyPosts = [];
  const agendaOnly = createNative(agendaOnlyDb, payload => { agendaOnlyPosts.push(payload); return Promise.resolve({ ok: true, linha: 17 }); });
  agendaOnly.dashPodeTirar = () => false;
  const agendaOnlyReg = {
    valor: 'Kiko / SRD', hora: '11:00', planilha_ok: false,
    det: { agendaMarcia: true, avaliacao129: {
      versao: 133, agendaMarcia: true, estado: 'confirmada',
      pagamento: { recebido: true, valorPagoCentavos: 8000, autorId: 'recepcao-1', autorNome: 'Consultora QA', ts: 1792930800000 },
      projecao: { opId: 'agenda-only-op', revisao: 1, acao: 'lancar', estado: 'pendente', depois: { valor: 'Kiko / SRD', hora: '11:00' } }
    } }
  };
  agendaOnlyDb.put(PAI + '/agenda-only', agendaOnlyReg);
  const agendaOnlyAllowed = agendaOnly.dashAgendaMarciaPode133();
  if (!agendaOnlyAllowed) permissionIssues.push('permissão exclusiva da Agenda foi recusada pelo gate nativo');
  if (agendaOnlyAllowed) {
    assert.equal((await agendaOnly.dashAgendaMarciaProjetar133(DIA, 'agenda-only', agendaOnlyReg, false)).ok, true);
    assert.equal(agendaOnlyPosts.length, 1);
  }
  const noAgendaDb = new FakeDB(), noAgendaPosts = [];
  const noAgenda = createNative(noAgendaDb, payload => { noAgendaPosts.push(payload); return Promise.resolve({ ok: true }); });
  noAgenda.dashPodeTirar = () => false;
  noAgenda.telaVemDoPapel = () => false;
  noAgenda.paginaConcedida = () => false;
  noAgendaDb.put(PAI + '/no-auth', Object.assign({}, agendaOnlyReg, { det: clone(agendaOnlyReg.det) }));
  assert.equal(noAgenda.dashAgendaMarciaPode133(), false);
  assert.equal((await noAgenda.dashAgendaMarciaProjetar133(DIA, 'no-auth', noAgendaDb.get(PAI + '/no-auth'), false)).ok, false);
  assert.equal(noAgendaPosts.length, 0, 'sem permissão de Agenda ou Lançamentos não envia');
  assert.equal(noAgendaDb.writes.length, 0, 'negação de permissão não cria lease');

  // 1. Pendente: não é publicável, não chama a ponte, não entra no retry nem é apagado como fantasma.
  const pending = await api.salvar(createCmd('pending', { recebido: false, valorCent: 0 }));
  assert.equal(pending.item.estado, 'pendente');
  assert.equal(posts.length, 0, 'criação pendente não chama transporte');
  assert.equal(native.dashAgendaMarciaPublicavel133(node(db, pending.id)), false);
  assert.equal(Agenda.publicavel(node(db, pending.id)), false);
  assert.deepEqual(Object.keys(native.dashAgendaMarciaFiltrar133('avaliacao', { [pending.id]: node(db, pending.id) })), []);
  assert.equal(Array.from(native.dashPlanFilaPendentes({ avaliacao: { [pending.id]: node(db, pending.id) } })).length, 0);
  const pendingGhost = clone(node(db, pending.id)); pendingGhost.valor = ''; pendingGhost.ts = 0;
  native.dashLimparFantasmas({ avaliacao: { [pending.id]: pendingGhost } });
  assert.deepEqual(db.removes, [], 'fantasma de avaliação pendente não apaga o registro de origem');
  const directPending = await native.dashEspelhar('avaliacao', pending.id, node(db, pending.id), 'lancar', DIA);
  assert.equal(directPending.agendaPendente, true);
  assert.equal(posts.length, 0, 'a função nativa também recusa lançamento direto pendente');

  // 2. Pago: uma projeção, uma linha no transporte e payload sem preço/recibo clínico-financeiro.
  const paid = await api.salvar(createCmd('paid', { recebido: true, valorCent: 8000 }));
  assert.equal(paid.item.estado, 'confirmada');
  assert.equal(paid.espelhoOk, true);
  assert.equal(posts.length, 1, 'pagamento confirmado publica uma vez');
  assert.equal(posts[0].acao, 'lancar');
  assert.deepEqual(Object.keys(posts[0]).sort(), ['acao', 'coluna', 'colunaHora', 'dia', 'hora', 'valor'].sort());
  assert.equal(posts[0].valor, 'Luna / SRD');
  assert.equal(JSON.stringify(posts[0]).includes('8000'), false, 'payload não inclui centavos/pagamento');
  assert.equal(native.dashAgendaMarciaPublicavel133(node(db, paid.id)), Agenda.publicavel(node(db, paid.id)));

  // Policy parity for malformed receipt metadata: backend and native projection must fail closed identically.
  const invalidReceipt = { det: { agendaMarcia: true, avaliacao129: { versao: 133, pagamento: {
    recebido: true, valorPagoCentavos: 8000, autorId: 'recepcao-1', autorNome: 'Consultora QA', ts: 'Infinity'
  } } } };
  const backendInvalidReceipt = Agenda.publicavel(invalidReceipt);
  const nativeInvalidReceipt = native.dashAgendaMarciaPublicavel133(invalidReceipt);
  assert.equal(nativeInvalidReceipt, false);
  if (backendInvalidReceipt !== nativeInvalidReceipt) parityIssues.push('timestamp não finito: backend=' + backendInvalidReceipt + ', native=' + nativeInvalidReceipt);
  const stringTimestamp = clone(invalidReceipt);
  stringTimestamp.det.avaliacao129.pagamento.ts = '123';
  const backendStringTimestamp = Agenda.publicavel(stringTimestamp);
  const nativeStringTimestamp = native.dashAgendaMarciaPublicavel133(stringTimestamp);
  assert.equal(backendStringTimestamp, false, 'recibo exige timestamp numérico real');
  if (backendStringTimestamp !== nativeStringTimestamp) parityIssues.push('timestamp numérico como texto: backend=' + backendStringTimestamp + ', native=' + nativeStringTimestamp);

  // 3. Cancelamento pago: preserva recibo/histórico, projeta o resumo ANTES e mantém o mesmo ID ao desfazer.
  const pagoAntes = clone(node(db, paid.id));
  const pagamentoAntes = summarizePayments(pagoAntes);
  const canceled = await api.salvar({ acao: 'cancelar', dia: DIA, id: paid.id,
    expectedRevision: paid.revisao, expectedFingerprint: paid.item.fingerprint, motivo: 'Tutor pediu outra data' });
  const canceledNode = node(db, paid.id);
  assert.equal(canceled.item.estado, 'cancelada');
  assert.equal(canceled.item.pagamento.recebido, true);
  assert.equal(canceled.item.pagamento.valorCent, 8000);
  assert.deepEqual(summarizePayments(canceledNode), pagamentoAntes, 'cancelar não altera recebimento/histórico nem simula reembolso');
  assert.deepEqual(canceledNode.det.avaliacao129.cancelamento.historico.map(x => x.ativo), [true]);
  assert.equal(Agenda.publicavel(canceledNode), false);
  assert.equal(native.dashAgendaMarciaPublicavel133(canceledNode), false);
  assert.equal(posts.length, 2);
  assert.equal(posts[1].acao, 'remover');
  assert.equal(posts[1].valor, 'Luna / SRD', 'remoção usa resumo antes da alteração/cancelamento');
  assert.equal(posts[1].hora, '09:30');
  assert.equal(Array.from(native.dashPlanFilaPendentes({ avaliacao: { [paid.id]: canceledNode } })).length, 0,
    'remoção confirmada sai da fila');
  const removeQueueFixture = clone(canceledNode);
  removeQueueFixture.planilha_ok = null;
  removeQueueFixture.det.avaliacao129.projecao.estado = 'pendente';
  const selectedRemoval = Array.from(native.dashPlanFilaPendentes({ avaliacao: { [paid.id]: removeQueueFixture } }));
  assert.equal(selectedRemoval.length, 1);
  assert.equal(selectedRemoval[0].reg.det.avaliacao129.projecao.acao, 'remover');
  const activeOnly = native.dashAgendaMarciaFiltrar133('avaliacao', { [paid.id]: canceledNode });
  assert.deepEqual(Object.keys(activeOnly), []);

  const undone = await api.salvar({ acao: 'reativar', dia: DIA, id: paid.id,
    expectedRevision: canceled.revisao, expectedFingerprint: canceled.item.fingerprint });
  assert.equal(undone.id, paid.id, 'desfazer preserva o mesmo registro');
  assert.equal(undone.item.estado, 'confirmada');
  assert.equal(undone.item.pagamento.recebido, true);
  assert.deepEqual(summarizePayments(node(db, paid.id)), pagamentoAntes, 'reativar preserva pagamento/histórico sem cobrar de novo');
  assert.deepEqual(node(db, paid.id).det.avaliacao129.cancelamento.historico.map(x => x.ativo), [true, false]);
  assert.equal(posts.length, 3);
  assert.equal(posts[2].acao, 'lancar');
  assert.equal(undone.id, paid.id);

  // 4. Cancelamento pendente não envia nem remove e deixa de ser elegível à fila antiga.
  const openPending = await api.salvar(createCmd('cancel-pending', { recebido: false, valorCent: 0 }));
  const countBeforePendingCancel = posts.length;
  const closedPending = await api.salvar({ acao: 'cancelar', dia: DIA, id: openPending.id,
    expectedRevision: openPending.revisao, expectedFingerprint: openPending.item.fingerprint, motivo: 'Erro de cadastro' });
  assert.equal(closedPending.item.estado, 'cancelada');
  assert.equal(posts.length, countBeforePendingCancel, 'pendente sem projeção não chama remover nem lançar');
  assert.equal(Array.from(native.dashPlanFilaPendentes({ avaliacao: { [openPending.id]: node(db, openPending.id) } })).length, 0);

  // 5. Legado sem marcador: mantém compatibilidade explícita, sem tratá-lo como registro 133.
  const legacy = { valor: 'Cão legado / SRD', hora: '10:00', ts: 1, planilha_ok: false };
  assert.equal(native.dashAgendaMarciaRegistro133(legacy), false);
  assert.equal(native.dashAgendaMarciaPublicavel133(legacy), true);
  assert.deepEqual(Object.keys(native.dashAgendaMarciaFiltrar133('avaliacao', { legado: legacy })), ['legado']);
  const legacyQueue = native.dashPlanFilaPendentes({ avaliacao: { legado: legacy } });
  assert.equal(legacyQueue.length, 1);
  assert.equal(legacyQueue[0].agenda133, undefined, 'legado continua no fluxo nativo antigo, sem protocolo 133 inventado');

  // 6. Falha da retirada persiste em planilha_ok=null; a fila carrega a operação remover e retry usa CAS.
  const failDb = new FakeDB(); let failRemove = true; const failPosts = [];
  const failNative = createNative(failDb, payload => {
    failPosts.push(payload);
    return Promise.resolve(payload.acao === 'remover' && failRemove ? { ok: false, erro: 'ponte indisponível' } : { ok: true, linha: 28 });
  });
  const failApi = makeApi(failDb, failNative);
  const paidFail = await failApi.salvar(createCmd('remove-retry', { recebido: true, valorCent: 8000 }));
  const postsBeforeFailedRemoval = failPosts.length;
  const cancelledFail = await failApi.salvar({ acao: 'cancelar', dia: DIA, id: paidFail.id,
    expectedRevision: paidFail.revisao, expectedFingerprint: paidFail.item.fingerprint, motivo: 'Desmarcou' });
  const removePending = node(failDb, paidFail.id);
  assert.equal(cancelledFail.espelhoOk, false);
  assert.equal(removePending.planilha_ok, null);
  const filaRemover = failNative.dashPlanFilaPendentes({ avaliacao: { [paidFail.id]: removePending } });
  assert.equal(filaRemover.length, 1);
  assert.equal(filaRemover[0].reg.det.avaliacao129.projecao.acao, 'remover');
  assert.equal(failPosts.at(-1).acao, 'remover');
  assert.equal(failPosts.slice(postsBeforeFailedRemoval).some(x => x.acao === 'lancar'), false, 'fila de remoção não relança cancelado');
  failRemove = false;
  assert.equal(await failNative.dashPlanFilaReenviar(DIA, 'avaliacao', paidFail.id), true);
  const removedConfirmed = node(failDb, paidFail.id);
  assert.equal(removedConfirmed.det.avaliacao129.projecao.estado, 'confirmada', 'retry confirma a revisão/opId pendentes por CAS');
  assert.equal(removedConfirmed.det.avaliacao129.projecao.acao, 'remover');
  assert.equal(removedConfirmed.planilha_ok, true);
  assert.deepEqual(failPosts.map(x => x.acao), ['lancar', 'remover', 'remover']);
  assert.equal(native.dashAgendaMarciaPublicavel133(removedConfirmed), false);

  // 6b. Cinco falhas tiram só a tentativa automática; o botão humano ainda pode concluir o mesmo opId/CAS.
  const capDb = new FakeDB(); let capSuccess = false; const capPosts = [];
  const capNative = createNative(capDb, payload => {
    capPosts.push(payload);
    return Promise.resolve(capSuccess ? { ok: true, linha: 29 } : { ok: false, erro: 'falha sintética' });
  });
  const capApi = makeApi(capDb, capNative);
  const capCreated = await capApi.salvar(createCmd('retry-cap', { recebido: true, valorCent: 8000 }));
  assert.equal(capCreated.espelhoOk, false);
  for (let attempt = 1; attempt < 5; attempt += 1) {
    const current = node(capDb, capCreated.id);
    const result = await capNative.dashAgendaMarciaProjetar133(DIA, capCreated.id, current, false);
    assert.equal(result.ok, false);
  }
  const exhausted = node(capDb, capCreated.id);
  assert.equal(exhausted.planilha_tent, 5);
  assert.equal(exhausted.planilha_desisti, true);
  assert.equal(capNative.dashPlanFilaMorto(exhausted), true);
  assert.equal(Array.from(capNative.dashPlanFilaPendentes({ avaliacao: { [capCreated.id]: exhausted } })).length, 0,
    'após cinco falhas a fila automática deixa de selecionar');
  const capOp = exhausted.det.avaliacao129.projecao.opId;
  const capRev = exhausted.det.avaliacao129.projecao.revisao;
  capSuccess = true;
  const manualRetry = await capNative.dashAgendaMarciaProjetar133(DIA, capCreated.id, exhausted, true);
  assert.equal(manualRetry.ok, true, 'a ação humana pode tentar novamente mesmo depois do limite automático');
  assert.equal(node(capDb, capCreated.id).det.avaliacao129.projecao.opId, capOp);
  assert.equal(node(capDb, capCreated.id).det.avaliacao129.projecao.revisao, capRev);
  assert.equal(node(capDb, capCreated.id).det.avaliacao129.projecao.estado, 'confirmada');
  assert.equal(capPosts.at(-1).acao, 'lancar');

  // 6b. Retry manual nativo relê a fonte original e passa pelo helper CAS/lease.
  // Dois cliques concorrentes no mesmo registro pago devem produzir um único POST.
  const manualDb = new FakeDB(), manualPosts = [], manualWait = deferred(); let manualHoldRetry = false;
  const manualNative = createNative(manualDb, payload => {
    manualPosts.push(clone(payload));
    if (payload.acao === 'lancar' && manualHoldRetry) return manualWait.promise;
    if (payload.acao === 'lancar') return Promise.resolve({ ok: false, erro: 'falha inicial sintética' });
    return Promise.resolve({ ok: true, linha: 61 });
  });
  const manualApi = makeApi(manualDb, manualNative);
  const manualCreated = await manualApi.salvar(createCmd('manual-native-retry', { recebido: true, valorCent: 8000 }));
  assert.equal(manualCreated.espelhoOk, false);
  const manualRecord = node(manualDb, manualCreated.id);
  manualNative.DASH_DADOS.avaliacao = { [manualCreated.id]: manualRecord };
  manualHoldRetry = true;
  const manualButton = { textContent: 'reenviar', disabled: false };
  const firstManual = manualNative.dashReenviar('avaliacao', manualCreated.id, manualButton);
  const secondManual = manualNative.dashReenviar('avaliacao', manualCreated.id, manualButton);
  await until(() => manualPosts.filter(x => x.acao === 'lancar').length === 2,
    'duas chamadas de criação + retry manual chegaram ao transporte sintético');
  assert.equal(manualPosts.filter(x => x.acao === 'lancar').length, 2,
    'o histórico contém apenas o POST inicial falho e um único retry manual concorrente');
  manualWait.resolve({ ok: true, linha: 62 });
  assert.deepEqual(await Promise.all([firstManual, secondManual]), [true, false],
    'um clique confirma a projeção; o concorrente perde a lease');
  assert.equal(manualPosts.filter(x => x.acao === 'lancar').length, 2);
  assert.equal(manualButton.disabled, false, 'o handler libera o botão ao concluir');
  assert.equal(node(manualDb, manualCreated.id).det.avaliacao129.projecao.estado, 'confirmada');

  // O entrypoint manual relê o estado atual e não envia para pendente nem cancelado.
  const manualPending = await manualApi.salvar(createCmd('manual-native-pending', { recebido: false, valorCent: 0 }));
  manualNative.DASH_DADOS.avaliacao[manualPending.id] = node(manualDb, manualPending.id);
  const postsBeforePending = manualPosts.length;
  assert.equal(await manualNative.dashReenviar('avaliacao', manualPending.id, manualButton), false);
  assert.equal(manualPosts.length, postsBeforePending, 'retry manual de pendente não transporta');
  const cancelManual = await manualApi.salvar({ acao: 'cancelar', dia: DIA, id: manualCreated.id,
    expectedRevision: manualCreated.revisao, expectedFingerprint: manualCreated.item.fingerprint, motivo: 'cancelar para teste' });
  manualNative.DASH_DADOS.avaliacao[manualCreated.id] = node(manualDb, manualCreated.id);
  const postsBeforeCanceled = manualPosts.length;
  assert.equal(await manualNative.dashReenviar('avaliacao', manualCreated.id, manualButton), false);
  assert.equal(manualPosts.length, postsBeforeCanceled, 'retry manual de cancelada não transporta');
  assert.equal(cancelManual.item.estado, 'cancelada');
  manualApi.fechar();

  // 7. Duplicata de texto: cancelar uma das duas avaliações não remove o resumo ainda usado pela outra.
  const dupDb = new FakeDB(), dupPosts = [];
  const dupNative = createNative(dupDb, payload => { dupPosts.push(payload); return Promise.resolve({ ok: true, linha: 31 }); });
  const dupApi = makeApi(dupDb, dupNative);
  const dupA = await dupApi.salvar(createCmd('duplicate-a', { recebido: true, valorCent: 8000 }));
  const dupB = await dupApi.salvar(createCmd('duplicate-b', { recebido: true, valorCent: 8000 }));
  const beforeDupCancel = dupPosts.length;
  const dupCancelled = await dupApi.salvar({ acao: 'cancelar', dia: DIA, id: dupA.id,
    expectedRevision: dupA.revisao, expectedFingerprint: dupA.item.fingerprint, motivo: 'Erro, desfazer' });
  assert.equal(dupCancelled.item.estado, 'cancelada');
  assert.equal(dupPosts.length, beforeDupCancel, 'resumo igual da segunda ativa evita remover a linha compartilhada');
  assert.equal(native.dashAgendaMarciaPublicavel133(node(dupDb, dupB.id)), true);

  // 8. Lease bloqueia duplo POST; cancelamento concorrente vence o lançamento atrasado após o retorno.
  const raceDb = new FakeDB(), racePosts = [], waitLaunch = deferred(); let deferNextLaunch = false;
  const raceNative = createNative(raceDb, payload => {
    racePosts.push(payload);
    if (payload.acao === 'lancar' && deferNextLaunch) { deferNextLaunch = false; return waitLaunch.promise; }
    return Promise.resolve({ ok: true, linha: 41 });
  });
  const raceApi1 = makeApi(raceDb, raceNative), raceApi2 = makeApi(raceDb, raceNative);
  // Primeira projeção falha de forma conhecida, deixando opId pendente para os dois retries.
  const originalTransport = raceNative.dashPonteChamar;
  raceNative.dashPonteChamar = payload => { racePosts.push(clone(payload)); return Promise.resolve({ ok: false, erro: 'falha sintética inicial' }); };
  const racePaid = await raceApi1.salvar(createCmd('race-lease', { recebido: true, valorCent: 8000 }));
  assert.equal(racePaid.espelhoOk, false);
  raceNative.dashPonteChamar = payload => {
    racePosts.push(clone(payload));
    if (payload.acao === 'lancar' && deferNextLaunch) { deferNextLaunch = false; return waitLaunch.promise; }
    return Promise.resolve({ ok: true, linha: 42 });
  };
  deferNextLaunch = true;
  const raceBefore = node(raceDb, racePaid.id);
  const retryInFlight = raceNative.dashAgendaMarciaProjetar133(DIA, racePaid.id, raceBefore, false);
  await until(() => racePosts.filter(x => x.acao === 'lancar').length === 2, 'primeiro retry adquiriu lease e chegou ao transporte sintético');
  const blockedConcurrent = await raceNative.dashAgendaMarciaProjetar133(DIA, racePaid.id, raceBefore, false);
  assert.equal(blockedConcurrent.ok, false);
  assert.equal(racePosts.filter(x => x.acao === 'lancar').length, 2, 'lease impede o segundo POST simultâneo');
  waitLaunch.resolve({ ok: true, linha: 43 });
  assert.equal((await retryInFlight).ok, true);
  await raceApi1.confirmarProjecao({ dia: DIA, id: racePaid.id,
    opId: raceBefore.det.avaliacao129.projecao.opId, revisao: raceBefore.det.avaliacao129.projecao.revisao });
  raceNative.dashPonteChamar = originalTransport;

  // A segunda sessão cancela enquanto um POST de lançamento está lento; ao voltar, o native hook compensa removendo.
  const cancelRaceDb = new FakeDB(), cancelRacePosts = [], pendingLaunch = deferred(); let holdLaunch = true;
  const cancelRaceNative = createNative(cancelRaceDb, payload => {
    cancelRacePosts.push(clone(payload));
    if (payload.acao === 'lancar' && holdLaunch) { holdLaunch = false; return pendingLaunch.promise; }
    return Promise.resolve({ ok: true, linha: 51 });
  });
  const sessionA = makeApi(cancelRaceDb, cancelRaceNative), sessionB = makeApi(cancelRaceDb, cancelRaceNative);
  const seen = [];
  sessionA.observar(DIA, x => seen.push(x));
  const createInFlight = sessionA.salvar(createCmd('cancel-race', { recebido: true, valorCent: 8000 }));
  await until(() => cancelRacePosts.some(x => x.acao === 'lancar'), 'lançamento iniciou transporte lento');
  const recordId = Object.keys(cancelRaceDb.get(PAI))[0];
  const current = node(cancelRaceDb, recordId);
  const seenItem = seen.flatMap(x => x.itens || []).find(x => x.id === recordId);
  assert(seenItem, 'a primeira sessão observou o registro antes do transporte');
  const cancelDuringSend = await sessionB.salvar({ acao: 'cancelar', dia: DIA, id: recordId,
    expectedRevision: seenItem.revisao, expectedFingerprint: seenItem.fingerprint, motivo: 'Cancelamento concorrente' });
  assert.equal(cancelDuringSend.item.estado, 'cancelada');
  assert.equal(cancelRacePosts.filter(x => x.acao === 'remover').length, 0, 'a lease impede POST paralelo antes do lançamento terminar');
  pendingLaunch.resolve({ ok: true, linha: 52 });
  await createInFlight;
  const cancelOps = cancelRacePosts.map(x => x.acao);
  assert.deepEqual(cancelOps, ['lancar', 'remover'], 'após o retorno do lançamento, o cancelamento mais novo compensa com uma remoção');
  assert.equal(node(cancelRaceDb, recordId).det.avaliacao129.estado, 'cancelada');
  assert.equal(Agenda.publicavel(node(cancelRaceDb, recordId)), false);
  sessionA.fechar(); sessionB.fechar();

  api.fechar(); failApi.fechar(); dupApi.fechar(); capApi.fechar(); raceApi1.fechar(); raceApi2.fechar();
  assert.deepEqual(parityIssues.concat(permissionIssues), [], 'gates backend/native e autorização da Agenda devem seguir a mesma regra');
  console.log('agenda-marcia-integracao133: OK (gate, bridge, cancellation, retries, lease, concurrency)');
}

run().catch(e => { console.error(e); process.exitCode = 1; });
