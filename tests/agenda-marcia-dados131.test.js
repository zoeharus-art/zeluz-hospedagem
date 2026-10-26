'use strict';

const assert = require('node:assert/strict');
const Agenda = require('../auaulandia/agenda-marcia/dados.js');

function clone(v) { return v == null ? v : JSON.parse(JSON.stringify(v)); }
function snap(v) { return { val() { return clone(v); } }; }
class FakeDB {
  constructor() {
    this.dados = {}; this.listeners = {}; this.reads = []; this.queries = []; this.writes = []; this.offs = [];
    this.pushes = 0; this.antesTx = null;
  }
  ref(path) { return new FakeRef(this, path || ''); }
  emitir(path, valor) {
    this.dados[path] = clone(valor);
    (this.listeners[path] || []).slice().forEach(x => x.ok(snap(valor)));
  }
  falhar(path) { (this.listeners[path] || []).slice().forEach(x => x.erro(new Error('falha sintética'))); }
}
class FakeRef {
  constructor(db, path) { this.db = db; this.path = path; }
  push() { this.db.pushes += 1; return { key: 'push-' + this.db.pushes }; }
  orderByKey() { this.db.queries.push({ path: this.path, metodo: 'orderByKey' }); return this; }
  limitToFirst(n) { this.db.queries.push({ path: this.path, metodo: 'limitToFirst', valor: n }); return this; }
  on(tipo, ok, erro) {
    assert.equal(tipo, 'value'); this.db.reads.push(this.path);
    (this.db.listeners[this.path] || (this.db.listeners[this.path] = [])).push({ ok, erro });
  }
  off(tipo, ok) {
    assert.equal(tipo, 'value'); this.db.offs.push({ path: this.path, ok });
    this.db.listeners[this.path] = (this.db.listeners[this.path] || []).filter(x => x.ok !== ok);
  }
  transaction(fn) {
    this.db.writes.push({ tipo: 'transaction', path: this.path });
    if (this.db.antesTx) this.db.antesTx(this.path);
    const atual = clone(this.db.dados[this.path]), novo = fn(atual);
    if (novo === undefined) return Promise.resolve({ committed: false, snapshot: snap(atual) });
    this.db.dados[this.path] = clone(novo);
    return Promise.resolve({ committed: true, snapshot: snap(novo) });
  }
}

const DIA = '2026-10-25';
const CAMINHO = 'daycare/dashboard/' + DIA + '/avaliacao';
function avaliacao(extra = {}) {
  return Object.assign({
    nome: 'Luna', raca: 'SRD', tutor: 'Família Luna', telefone: '(00) 90000-0000', hora: '09:30',
    vacina: { conferido: true }, vermifugo: { conferido: false }, carrapaticida: { conferido: true },
    experiencia: 'Primeira creche', saude: '', observacoes: 'Receber na porta'
  }, extra);
}
function pedido(extra = {}) {
  return Object.assign({ acao: 'criar', dia: DIA, requestId: 'toque-1', avaliacao: avaliacao() }, extra);
}
function criar(db, op = {}) {
  let permitido = op.permitido !== false, ator = op.ator || { id: 'consultora-1', nome: 'Consultora Ana' };
  const api = Agenda.criar({
    db, pode: () => permitido, autor: () => ator,
    agora: () => Date.parse('2026-10-25T09:00:00-03:00'), aoSalvar: op.aoSalvar
  });
  return { api, permitir(v) { permitido = v; }, ator(v) { ator = v; } };
}
function observarPronto(api, db, valor = {}) {
  const vistos = [], off = api.observar(DIA, s => vistos.push(s));
  db.emitir(CAMINHO, valor);
  return { vistos, off, ultimo: () => vistos.at(-1) };
}

async function executar() {
  assert.equal(Agenda.PRECO_CENTAVOS, 8000);
  const regPagoEstrito = { det: { agendaMarcia: true, avaliacao129: { versao: 133, pagamento: {
    recebido: true, valorPagoCentavos: 8000, autorId: 'a', autorNome: 'Pessoa', ts: 1, quando: 'agora'
  } } } };
  assert.equal(Agenda.ehAgenda(regPagoEstrito), true);
  assert.equal(Agenda.publicavel(regPagoEstrito), true);
  assert.equal(Agenda.publicavel({ det: { agendaMarcia: true, avaliacao129: { pagamento: {
    recebido: true, valorPagoCentavos: 8000, autorId: 'a', autorNome: '', ts: 1
  } } } }), false, 'R$ 80 sem autoria completa nunca confirma');
  for (const tsInvalido of ['Infinity', Infinity, -Infinity, NaN, '10']) {
    assert.equal(Agenda.publicavel({ det: { agendaMarcia: true, avaliacao129: { pagamento: {
      recebido: true, valorPagoCentavos: 8000, autorId: 'a', autorNome: 'Pessoa', ts: tsInvalido
    } } } }), false, 'timestamp não finito ou não numérico nunca autentica recibo');
  }
  const regCanceladoEstrito = clone(regPagoEstrito);
  regCanceladoEstrito.det.avaliacao129.cancelamento = { ativo: true, autorId: 'a', autorNome: 'Pessoa', ts: 2 };
  assert.equal(Agenda.publicavel(regCanceladoEstrito), false, 'cancelamento válido fecha o gate mesmo preservando o recibo');
  const regCanceladoIncompleto = clone(regPagoEstrito);
  regCanceladoIncompleto.det.avaliacao129.cancelamento = { ativo: true };
  assert.equal(Agenda.publicavel(regCanceladoIncompleto), false, 'marca de cancelamento incompleta falha fechada e nunca vaza para TV');
  const db = new FakeDB(), ctx = criar(db), obs = observarPronto(ctx.api, db);
  assert.equal(obs.vistos[0].estado, 'carregando');
  assert.equal(obs.ultimo().estado, 'pronto');
  assert.deepEqual(db.reads, [CAMINHO], 'observa somente avaliações do dia');
  assert.equal(db.writes.length, 0, 'observar/renderizar não grava');

  const dbPendenteSemTv = new FakeDB(), chamadasPendente = [];
  const pendenteSemTvCtx = criar(dbPendenteSemTv, { aoSalvar: x => { chamadasPendente.push(x); return true; } });
  observarPronto(pendenteSemTvCtx.api, dbPendenteSemTv);
  const pendenteSemTv = await pendenteSemTvCtx.api.salvar(pedido({ requestId: 'pendente-sem-tv' }));
  assert.equal(chamadasPendente.length, 0, 'avaliação sem pagamento não chama ponte nem TV');
  assert.equal(pendenteSemTv.item.estado, 'pendente');
  assert.equal(pendenteSemTv.item.espelhoOk, null, 'sem projeção não inventa confirmação de espelho');
  const criadoSemRequestId = await pendenteSemTvCtx.api.salvar({ acao: 'criar', dia: DIA, avaliacao: avaliacao({ nome: 'Sem token' }) });
  assert.equal(criadoSemRequestId.ok, true, 'criação via UI funciona sem requestId e sem cancelamento prévio');
  assert.equal(criadoSemRequestId.item.nome, 'Sem token');

  const dbFalha = new FakeDB(), falhaCtx = criar(dbFalha), falhas = [];
  falhaCtx.api.observar(DIA, s => falhas.push(s));
  dbFalha.falhar(CAMINHO);
  assert.equal(falhas.at(-1).estado, 'falha', 'falha da fonte não vira lista pronta vazia');
  assert.equal(dbFalha.writes.length, 0);

  const mesVistosA = [], mesVistosB = [], leiturasAntesMes = db.reads.length;
  const offMesA = ctx.api.observarMes('2026-11', s => mesVistosA.push(s));
  const offMesB = ctx.api.observarMes('2026-11', s => mesVistosB.push(s));
  assert.equal(mesVistosA[0].estado, 'carregando');
  assert.equal(db.reads.length - leiturasAntesMes, 30, 'mês de novembro abre no máximo uma query por dia');
  assert.equal(db.queries.filter(x => x.metodo === 'limitToFirst').length, 30);
  assert(db.queries.filter(x => x.metodo === 'limitToFirst').every(x => x.valor === 1), 'toda query mensal limita o payload a uma avaliação');
  assert(db.reads.slice(leiturasAntesMes).every(p => /^daycare\/dashboard\/2026-11-\d{2}\/avaliacao$/.test(p)), 'não lê dashboard mensal ou raiz ampla');
  for (let n = 1; n <= 29; n += 1) {
    const dia = '2026-11-' + String(n).padStart(2, '0');
    db.emitir('daycare/dashboard/' + dia + '/avaliacao', n === 5 ? { unica: { valor: 'Sintética / SRD' } } : {});
  }
  db.falhar('daycare/dashboard/2026-11-30/avaliacao');
  const mesFinal = mesVistosA.at(-1);
  assert.equal(mesFinal.estado, 'falha');
  assert.equal(mesFinal.dias['2026-11-05'], true);
  assert.equal(mesFinal.dias['2026-11-04'], false, 'false só aparece depois de leitura vazia confirmada');
  assert(!Object.prototype.hasOwnProperty.call(mesFinal.dias, '2026-11-30'), 'erro não vira false');
  assert.equal(mesVistosB.at(-1).estado, 'falha', 'assinantes do mesmo mês compartilham as queries');
  const offsAntesA = db.offs.length;
  offMesA();
  assert.equal(db.offs.length, offsAntesA, 'primeiro assinante não desliga a fonte compartilhada');
  const bAntesOff = mesVistosB.length;
  offMesB();
  assert.equal(db.offs.length - offsAntesA, 30, 'o último assinante remove somente os callbacks do mês');
  db.emitir('daycare/dashboard/2026-11-05/avaliacao', {});
  assert.equal(mesVistosB.length, bAntesOff, 'callback mensal descartado fica inerte');

  const pendente = await ctx.api.salvar(pedido());
  assert.deepEqual(
    { ok: pendente.ok, acao: pendente.acao, dia: pendente.dia, id: pendente.id, revisao: pendente.revisao },
    { ok: true, acao: 'criar', dia: DIA, id: 'push-1', revisao: 1 },
    'ACK confirma ação, dia, id e revisão persistida'
  );
  assert.equal(db.pushes, 1);
  assert.deepEqual(pendente.item.pagamento, { recebido: false, valorCent: 0, quem: '', quando: '' });
  assert.match(pendente.item.fingerprint, /^am131-[a-z0-9]+$/);
  const regPendente = db.dados[CAMINHO + '/push-1'];
  assert.equal(regPendente.valor, 'Luna / SRD');
  assert.equal(regPendente.hora, '09:30');
  assert.equal(regPendente.det.agendaMarcia, true);
  assert.equal(regPendente.det.avaliacao129.agendaMarcia, true);
  assert.equal(regPendente.det.avaliacao129.versao, 133);
  assert.equal(regPendente.det.fora_do_cadastro, true);
  assert(!Object.prototype.hasOwnProperty.call(regPendente, 'planilha_ok'), 'pendente não entra na fila nativa da TV');
  assert.equal(pendente.item.estado, 'pendente');
  assert.equal(pendente.item.confirmada, false);
  assert.equal(pendente.item.cancelada, false);
  assert(!('tutor' in regPendente), 'dados completos ficam no det e não vazam para projeção da TV');
  const repetido = await ctx.api.salvar(pedido());
  assert.equal(repetido.id, pendente.id);
  assert.equal(repetido.revisao, 1, 'retry idempotente não cria nova revisão');
  assert.equal(db.pushes, 1, 'retry reutiliza o push local');

  const dbDuplo = new FakeDB(), duploCtx = criar(dbDuplo);
  observarPronto(duploCtx.api, dbDuplo);
  const [toqueA, toqueB] = await Promise.all([
    duploCtx.api.salvar(pedido({ requestId: 'duplo' })), duploCtx.api.salvar(pedido({ requestId: 'duplo' }))
  ]);
  assert.equal(toqueA.id, toqueB.id);
  assert.equal(dbDuplo.pushes, 1);
  assert.equal(dbDuplo.writes.length, 1, 'toque duplo compartilha a transação em voo');

  const dbNativo = new FakeDB(), nativoCtx = criar(dbNativo), nativoObs = observarPronto(nativoCtx.api, dbNativo);
  const criadoNativo = await nativoCtx.api.salvar(pedido({ requestId: 'nativo-resumo' }));
  const rawNativo = clone(dbNativo.dados[CAMINHO + '/' + criadoNativo.id]);
  rawNativo.valor = 'Luna Nativa / SRD';
  rawNativo.hora = '11:20';
  dbNativo.dados[CAMINHO + '/' + criadoNativo.id] = clone(rawNativo);
  dbNativo.emitir(CAMINHO, { [criadoNativo.id]: rawNativo });
  const itemNativo = nativoObs.ultimo().itens[0];
  assert.equal(itemNativo.nome, 'Luna Nativa', 'resumo superior 131 é canônico para nome/raça');
  assert.equal(itemNativo.hora, '11:20', 'edição nativa de hora não é escondida pelo det antigo');
  assert.notEqual(itemNativo.fingerprint, criadoNativo.item.fingerprint, 'resumo nativo altera o fingerprint sem depender da revisão');
  await assert.rejects(nativoCtx.api.salvar({
    acao: 'editar', dia: DIA, id: criadoNativo.id, expectedRevision: criadoNativo.revisao,
    expectedFingerprint: criadoNativo.item.fingerprint, avaliacao: avaliacao()
  }), /AGENDAMENTO_DESATUALIZADO/, 'fingerprint anterior recusa edição após mudança nativa do resumo');

  const dbPago = new FakeDB(), espelhos = [];
  const pagoCtx = criar(dbPago, { aoSalvar: x => { espelhos.push(x); } });
  observarPronto(pagoCtx.api, dbPago);
  const pago = await pagoCtx.api.salvar(pedido({
    requestId: 'pagamento-1', avaliacao: avaliacao({ pagamento: { recebido: true, valorCent: 8000 } })
  }));
  assert.equal(pago.item.pagamento.recebido, true);
  assert.equal(pago.item.pagamento.valorCent, 8000);
  assert.equal(pago.item.pagamento.quem, 'Consultora Ana');
  assert.match(pago.item.pagamento.quando, /^25\/10\/2026 09:00$/);
  assert.deepEqual(
    { acao: espelhos[0].acao, dia: espelhos[0].dia, id: espelhos[0].id, valor: espelhos[0].valor, hora: espelhos[0].hora, resumoAlterado: espelhos[0].resumoAlterado },
    { acao: 'criar', dia: DIA, id: pago.id, valor: 'Luna / SRD', hora: '09:30', resumoAlterado: false },
    'callback distingue criação e entrega resumo seguro'
  );
  assert.equal(espelhos[0].antes, null);
  assert.equal(espelhos[0].registro.det.avaliacao129.pagamento.recebido, true);
  const pagoNo = CAMINHO + '/' + pago.id, pagoReg = dbPago.dados[pagoNo];
  const reciboOriginal = clone(pagoReg.det.avaliacao129.pagamento);

  pagoReg.planilha_ok = 'campo alheio'; pagoReg.legado = { preservar: true };
  dbPago.dados[pagoNo] = clone(pagoReg);
  const writesSemBase = dbPago.writes.length;
  await assert.rejects(pagoCtx.api.salvar({
    acao: 'editar', dia: DIA, id: pago.id, expectedRevision: pago.revisao, avaliacao: avaliacao()
  }), /BASE_OBRIGATORIA/, 'edição sem fingerprint observado falha fechada');
  assert.equal(dbPago.writes.length, writesSemBase);
  const editado = await pagoCtx.api.salvar({
    acao: 'editar', dia: DIA, id: pago.id, expectedRevision: pago.revisao, expectedFingerprint: pago.item.fingerprint,
    avaliacao: avaliacao({ observacoes: 'Nota alterada sem mexer no pagamento' })
  });
  assert.notEqual(editado.item.fingerprint, pago.item.fingerprint, 'ACK devolve fingerprint da nova revisão');
  assert.equal(editado.item.pagamento.recebido, true);
  assert.deepEqual(dbPago.dados[pagoNo].det.avaliacao129.pagamento, reciboOriginal, 'editar notas preserva recibo e autoria');
  assert.equal(dbPago.dados[pagoNo].planilha_ok, 'campo alheio');
  assert.deepEqual(dbPago.dados[pagoNo].legado, { preservar: true });

  const desfeito = await pagoCtx.api.salvar({
    acao: 'editar', dia: DIA, id: pago.id, expectedRevision: editado.revisao, expectedFingerprint: editado.item.fingerprint,
    avaliacao: avaliacao({ observacoes: 'Nota alterada sem mexer no pagamento', pagamento: { recebido: false, valorCent: 0 } })
  });
  assert.equal(desfeito.item.pagamento.recebido, false);
  assert.equal(espelhos.at(-1).acaoProjecao, 'remover', 'corrigir pagamento recebido remove a projeção sem apagar o registro');
  assert.equal(dbPago.dados[pagoNo].planilha_ok, true, 'remoção confirmada pode marcar o estado técnico como resolvido');
  const histPg = dbPago.dados[pagoNo].det.avaliacao129.pagamento.historico;
  assert.deepEqual(histPg.map(x => x.recebido), [true, false], 'recebimento e desfazer ficam auditados');
  assert(histPg.every(x => x.autorId === 'consultora-1' && x.ts > 0));

  const writesInvalidos = dbPago.writes.length;
  for (const pagamento of [
    { recebido: 'sim', valorCent: 8000 }, { recebido: true, valorCent: 80 }, { recebido: false, valorCent: 8000 }
  ]) {
    await assert.rejects(pagoCtx.api.salvar(pedido({ requestId: JSON.stringify(pagamento), avaliacao: avaliacao({ pagamento }) })), /PAGAMENTO_INVALIDO/);
  }
  assert.equal(dbPago.writes.length, writesInvalidos, 'pagamento malformado não inicia transação');

  const nativo = clone(dbPago.dados[pagoNo]);
  nativo.det.avaliacao129.observacoes = 'Mudança nativa concorrente';
  dbPago.dados[pagoNo] = nativo;
  await assert.rejects(pagoCtx.api.salvar({
    acao: 'editar', dia: DIA, id: pago.id, expectedRevision: desfeito.revisao,
    expectedFingerprint: desfeito.item.fingerprint, avaliacao: avaliacao()
  }), /AGENDAMENTO_DESATUALIZADO/, 'fingerprint em cache detecta edição nativa sem nova revisão');

  const dbConf = new FakeDB(), confCtx = criar(dbConf);
  observarPronto(confCtx.api, dbConf);
  const criadoConf = await confCtx.api.salvar(pedido({ requestId: 'conf-1', avaliacao: avaliacao({ pagamento: { recebido: true, valorCent: 8000 } }) }));
  dbConf.emitir(CAMINHO, { [criadoConf.id]: dbConf.dados[CAMINHO + '/' + criadoConf.id] });
  const conf = await confCtx.api.salvarConferencia({
    dia: DIA, id: criadoConf.id, expectedRevision: criadoConf.revisao,
    tutor: 'Família atualizada', vacina: { conferido: false }, vermifugo: { conferido: true }, carrapaticida: { conferido: false },
    experiencia: '', saude: 'Atenção informada', observacoes: 'Conferência Márcia'
  });
  assert.equal(conf.item.tutor, 'Família atualizada');
  assert.equal(conf.item.pagamento.recebido, true, 'conferência no mesmo registro preserva pagamento');
  assert.equal(dbConf.writes.at(-1).path, CAMINHO + '/' + criadoConf.id);

  const dbResumo = new FakeDB(), contextosResumo = [];
  const resumoCtx = criar(dbResumo, { aoSalvar: x => { contextosResumo.push(x); return x.acao === 'editar' ? false : true; } });
  observarPronto(resumoCtx.api, dbResumo);
  const resumoCriado = await resumoCtx.api.salvar(pedido({ requestId: 'resumo-1', avaliacao: avaliacao({ pagamento: { recebido: true, valorCent: 8000 } }) }));
  const resumoNo = CAMINHO + '/' + resumoCriado.id;
  dbResumo.dados[resumoNo].planilha_tent = 5;
  dbResumo.dados[resumoNo].planilha_desisti = true;
  const resumoEditado = await resumoCtx.api.salvar({
    acao: 'editar', dia: DIA, id: resumoCriado.id, expectedRevision: resumoCriado.revisao,
    expectedFingerprint: resumoCriado.item.fingerprint,
    avaliacao: avaliacao({ nome: 'Luna Nova', hora: '10:15' })
  });
  assert.equal(resumoEditado.espelhoOk, false, 'retorno false da ponte não vira confirmação de espelho');
  const resumoReg = dbResumo.dados[CAMINHO + '/' + resumoCriado.id];
  assert.equal(resumoReg.edicao_pendente.depois.valor, 'Luna Nova / SRD');
  assert.equal(resumoReg.edicao_pendente.depois.hora, '10:15');
  assert.equal(resumoReg.planilha_ok, false);
  assert.equal(resumoReg.planilha_tent, 0, 'nova projeção reabre a fila com zero tentativas');
  assert.equal(Object.prototype.hasOwnProperty.call(resumoReg, 'planilha_desisti'), false, 'nova projeção limpa desistência antiga');
  assert.equal(contextosResumo.at(-1).resumoAlterado, true);
  assert.deepEqual(contextosResumo.at(-1).pendente, contextosResumo.at(-1).edicaoPendente);
  assert.equal(contextosResumo.at(-1).acaoProjecao, 'editar');

  const dbEspelho = new FakeDB(), espelhoCtx = criar(dbEspelho, { aoSalvar: () => Promise.reject(new Error('espelho indisponível')) });
  observarPronto(espelhoCtx.api, dbEspelho);
  const semEspelho = await espelhoCtx.api.salvar(pedido({ requestId: 'espelho-1', avaliacao: avaliacao({ pagamento: { recebido: true, valorCent: 8000 } }) }));
  assert.equal(semEspelho.espelhoOk, false);
  assert.equal(semEspelho.item.pagamento.recebido, true, 'ACK financeiro vem da transação, não do espelho');
  assert.equal(dbEspelho.pushes, 1, 'falha do espelho não cria segundo push');

  const noSemEspelho = CAMINHO + '/' + semEspelho.id;
  const projSemEspelho = dbEspelho.dados[noSemEspelho].det.avaliacao129.projecao;
  assert.equal(projSemEspelho.acao, 'lancar');
  assert.equal(projSemEspelho.estado, 'pendente', 'falha externa deixa operação recuperável no mesmo registro');
  const retrySemEspelho = await espelhoCtx.api.salvar(pedido({
    requestId: 'espelho-1', avaliacao: avaliacao({ pagamento: { recebido: true, valorCent: 8000 } })
  }));
  assert.equal(retrySemEspelho.id, semEspelho.id);
  assert.equal(retrySemEspelho.espelhoOk, false, 'retry idempotente não esconde projeção ainda pendente');
  const notasDurantePendente = await espelhoCtx.api.salvar({
    acao: 'editar', dia: DIA, id: semEspelho.id, expectedRevision: semEspelho.revisao,
    expectedFingerprint: semEspelho.item.fingerprint,
    avaliacao: avaliacao({ observacoes: 'Nota segura enquanto a projeção aguarda' })
  });
  assert.equal(notasDurantePendente.espelhoOk, false, 'editar só notas não mascara a projeção anterior pendente');
  assert.equal(notasDurantePendente.revisao, semEspelho.revisao + 1);
  assert.equal(dbEspelho.dados[noSemEspelho].det.avaliacao129.projecao.opId, projSemEspelho.opId);
  assert.equal(dbEspelho.dados[noSemEspelho].det.avaliacao129.projecao.revisao, projSemEspelho.revisao,
    'revisão da projeção é própria e não acompanha edição de notas');
  const revAntesConfirmar = notasDurantePendente.item.revisao;
  const projConfirmada = await espelhoCtx.api.confirmarProjecao({
    dia: DIA, id: semEspelho.id, opId: projSemEspelho.opId, revisao: projSemEspelho.revisao
  });
  assert.equal(projConfirmada.ok, true);
  assert.equal(projConfirmada.item.revisao, revAntesConfirmar, 'confirmação técnica não altera revisão editável');
  assert.equal(dbEspelho.dados[noSemEspelho].det.avaliacao129.projecao.estado, 'confirmada');
  assert.equal(dbEspelho.dados[noSemEspelho].planilha_ok, true);
  await assert.rejects(espelhoCtx.api.confirmarProjecao({
    dia: DIA, id: semEspelho.id, opId: projSemEspelho.opId, revisao: projSemEspelho.revisao
  }), /PROJECAO_DESATUALIZADA/, 'mesmo opId não confirma duas vezes');

  const dbPayload = new FakeDB(), payloadCtx = criar(dbPayload, { aoSalvar: () => false });
  observarPronto(payloadCtx.api, dbPayload);
  const payloadPendente = await payloadCtx.api.salvar(pedido({
    requestId: 'payload-imutavel', avaliacao: avaliacao({ pagamento: { recebido: true, valorCent: 8000 } })
  }));
  const noPayload = CAMINHO + '/' + payloadPendente.id;
  const opPayload = clone(dbPayload.dados[noPayload].det.avaliacao129.projecao);
  dbPayload.dados[noPayload].valor = 'Alterado fora do protocolo / SRD';
  await assert.rejects(payloadCtx.api.confirmarProjecao({
    dia: DIA, id: payloadPendente.id, opId: opPayload.opId, revisao: opPayload.revisao
  }), /PROJECAO_DESATUALIZADA/, 'CAS não confirma projeção cujo resumo foi alterado fora do protocolo');
  assert.equal(dbPayload.writes.at(-1).path, noPayload, 'confirmação transaciona só o registro, nunca o ancestral do dia');

  const dbLegado = new FakeDB(), chamadasLegado = [], legadoCtx = criar(dbLegado, {
    aoSalvar: x => { chamadasLegado.push(clone(x)); return true; }
  });
  const rawLegado = { valor: 'Legado / SRD', hora: '08:30', quem: 'Pessoa Antiga', ts: 10, det: { avaliacao129: {
    nome: 'Legado', raca: 'SRD', tutor: 'Família Legado', hora: '08:30', vacina: { conferido: true },
    vermifugo: { conferido: true }, carrapaticida: { conferido: true }, experiencia: '', saude: '', observacoes: '',
    revisao: 4, autorId: 'antigo', autorNome: 'Pessoa Antiga', ts: 10, quando: 'antes'
  } } };
  const obsLegado = observarPronto(legadoCtx.api, dbLegado, { legado: rawLegado });
  dbLegado.dados[CAMINHO + '/legado'] = clone(rawLegado);
  const itemLegado = obsLegado.ultimo().itens[0];
  assert.equal(Agenda.ehAgenda(rawLegado), false, 'fixture prova ausência de marker legado');
  assert.equal(Agenda.publicavel(rawLegado), false, 'helper estrito não inventa recibo para formato antigo');
  const canceladoLegado = await legadoCtx.api.salvar({
    acao: 'cancelar', dia: DIA, id: 'legado', expectedRevision: itemLegado.revisao,
    expectedFingerprint: itemLegado.fingerprint, motivo: 'Cancelamento do registro antigo'
  });
  assert.equal(canceladoLegado.item.cancelada, true);
  assert.equal(chamadasLegado.length, 1);
  assert.equal(chamadasLegado[0].acaoProjecao, 'remover', 'cancelar legado já listado solicita retirada da TV mesmo sem recibo novo');
  assert.equal(chamadasLegado[0].projecao.antes.valor, 'Legado / SRD');
  const legadoCanceladoRaw = dbLegado.dados[CAMINHO + '/legado'];
  assert.equal(canceladoLegado.item.pagamento.recebido, false);
  assert.equal(Object.prototype.hasOwnProperty.call(legadoCanceladoRaw.det.avaliacao129, 'pagamento'), false,
    'cancelar legado não fabrica pagamento nem reembolso');
  const legadoReativado = await legadoCtx.api.salvar({
    acao: 'reativar', dia: DIA, id: 'legado', expectedRevision: canceladoLegado.revisao,
    expectedFingerprint: canceladoLegado.item.fingerprint
  });
  assert.equal(legadoReativado.item.estado, 'pendente');
  assert.equal(legadoReativado.item.pagamento.recebido, false);
  assert.equal(chamadasLegado.length, 1, 'reativar legado sem recibo não relança na TV');

  const db131SemPg = new FakeDB(), chamadas131SemPg = [], ctx131SemPg = criar(db131SemPg, {
    aoSalvar: x => { chamadas131SemPg.push(clone(x)); return false; }
  });
  const raw131SemPg = clone(rawLegado);
  raw131SemPg.planilha_ok = true;
  raw131SemPg.det.agendaMarcia = true;
  raw131SemPg.det.avaliacao129.versao = 131;
  raw131SemPg.det.avaliacao129.agendaMarcia = true;
  const obs131SemPg = observarPronto(ctx131SemPg.api, db131SemPg, { antigo131: raw131SemPg });
  db131SemPg.dados[CAMINHO + '/antigo131'] = clone(raw131SemPg);
  const item131SemPg = obs131SemPg.ultimo().itens[0];
  assert.equal(item131SemPg.pagamento.recebido, false, 'v131 antigo continua sem recibo inventado');
  const cancelado131SemPg = await ctx131SemPg.api.salvar({
    acao: 'cancelar', dia: DIA, id: 'antigo131', expectedRevision: item131SemPg.revisao,
    expectedFingerprint: item131SemPg.fingerprint, motivo: 'Cancelar avaliação antiga já espelhada'
  });
  assert.equal(cancelado131SemPg.item.cancelada, true);
  assert.equal(chamadas131SemPg.length, 1);
  assert.equal(chamadas131SemPg[0].acaoProjecao, 'remover', 'v131 sem pagamento mas com planilha_ok true retira a linha antiga');
  assert.equal(Object.prototype.hasOwnProperty.call(db131SemPg.dados[CAMINHO + '/antigo131'].det.avaliacao129, 'pagamento'), false,
    'compatibilidade v131 não fabrica pagamento');

  const dbCancelar = new FakeDB(), projecoes = [];
  let falharRemocao = true;
  const cancelarCtx = criar(dbCancelar, { aoSalvar: x => { projecoes.push(clone(x)); return x.acaoProjecao === 'remover' && falharRemocao ? false : true; } });
  const cancelarObs = observarPronto(cancelarCtx.api, dbCancelar);
  const ativo = await cancelarCtx.api.salvar(pedido({
    requestId: 'cancelar-pago', avaliacao: avaliacao({ pagamento: { recebido: true, valorCent: 8000 } })
  }));
  assert.equal(ativo.item.estado, 'confirmada');
  const cancelado = await cancelarCtx.api.salvar({
    acao: 'cancelar', dia: DIA, id: ativo.id, expectedRevision: ativo.revisao,
    expectedFingerprint: ativo.item.fingerprint, motivo: 'Tutor pediu nova data'
  });
  assert.equal(cancelado.item.estado, 'cancelada');
  assert.equal(cancelado.item.confirmada, false);
  assert.equal(cancelado.item.cancelada, true);
  assert.deepEqual(cancelado.item.cancelamento, { motivo: 'Tutor pediu nova data', quem: 'Consultora Ana', quando: '25/10/2026 09:00' });
  assert.equal(cancelado.item.pagamento.recebido, true, 'cancelar preserva o recebimento e não declara reembolso');
  assert.equal(cancelado.item.pagamento.valorCent, 8000);
  assert.equal(cancelado.espelhoOk, false);
  assert.equal(projecoes.at(-1).acaoProjecao, 'remover');
  const regCancelado = dbCancelar.dados[CAMINHO + '/' + ativo.id];
  assert.equal(regCancelado.det.avaliacao129.projecao.acao, 'remover');
  assert.equal(regCancelado.det.avaliacao129.projecao.estado, 'pendente');
  assert.equal(regCancelado.planilha_ok, null, 'cancelamento não entra na fila antiga de relançamento');
  dbCancelar.emitir(CAMINHO, { [ativo.id]: regCancelado });
  assert.equal(cancelarObs.ultimo().itens[0].espelhoOk, false, 'reload preserva aviso de retirada pendente');
  const fpCancelado = cancelado.item.fingerprint;
  falharRemocao = false;
  await cancelarCtx.api.confirmarProjecao({ dia: DIA, id: ativo.id,
    opId: regCancelado.det.avaliacao129.projecao.opId, revisao: regCancelado.det.avaliacao129.projecao.revisao });
  const aposRemover = dbCancelar.dados[CAMINHO + '/' + ativo.id];
  assert.equal(aposRemover.det.avaliacao129.projecao.estado, 'confirmada');
  assert.equal(Agenda.publicavel(aposRemover), false);
  dbCancelar.emitir(CAMINHO, { [ativo.id]: aposRemover });
  assert.equal(cancelarObs.ultimo().itens[0].espelhoOk, true, 'reload reconhece retirada confirmada');
  const reativado = await cancelarCtx.api.salvar({
    acao: 'reativar', dia: DIA, id: ativo.id, expectedRevision: cancelado.revisao,
    expectedFingerprint: fpCancelado
  });
  assert.equal(reativado.item.cancelada, false);
  assert.equal(reativado.item.cancelamento, null);
  assert.equal(reativado.item.estado, 'confirmada', 'reativar usa o recibo válido já preservado');
  assert.equal(reativado.item.pagamento.recebido, true);
  assert.equal(reativado.item.espelhoOk, true, 'ACK recomposto depois do cleanup traz espelho confirmado');
  assert.equal(projecoes.at(-1).acaoProjecao, 'lancar');
  assert.notEqual(reativado.item.fingerprint, fpCancelado);
  const histCancelamento = dbCancelar.dados[CAMINHO + '/' + ativo.id].det.avaliacao129.cancelamento.historico;
  assert.deepEqual(histCancelamento.map(x => x.ativo), [true, false], 'cancelar e reativar deixam histórico assinado');

  const dbCancelaPendente = new FakeDB(), chamadasCancelaPendente = [];
  const cancelaPendenteCtx = criar(dbCancelaPendente, { aoSalvar: x => { chamadasCancelaPendente.push(x); return true; } });
  observarPronto(cancelaPendenteCtx.api, dbCancelaPendente);
  const abertoPendente = await cancelaPendenteCtx.api.salvar(pedido({ requestId: 'cancela-pendente' }));
  dbCancelaPendente.dados[CAMINHO + '/' + abertoPendente.id].planilha_ok = true;
  const fechadoPendente = await cancelaPendenteCtx.api.salvar({
    acao: 'cancelar', dia: DIA, id: abertoPendente.id, expectedRevision: abertoPendente.revisao,
    expectedFingerprint: abertoPendente.item.fingerprint, motivo: ''
  });
  assert.equal(fechadoPendente.item.cancelada, true);
  assert.equal(chamadasCancelaPendente.length, 0, 'v133 pendente não chama remoção nem com planilha_ok residual');

  const dbAutoria = new FakeDB(), autoriaCtx = criar(dbAutoria);
  observarPronto(autoriaCtx.api, dbAutoria);
  dbAutoria.antesTx = () => autoriaCtx.ator({ id: 'outra', nome: 'Outra pessoa' });
  await assert.rejects(autoriaCtx.api.salvar(pedido({ requestId: 'troca-ator' })), /AUTORIA_ALTERADA/);

  const dbPerm = new FakeDB(), permCtx = criar(dbPerm);
  observarPronto(permCtx.api, dbPerm);
  dbPerm.antesTx = () => permCtx.permitir(false);
  await assert.rejects(permCtx.api.salvar(pedido({ requestId: 'sem-permissao' })), /SEM_PERMISSAO/);

  const antesStale = obs.vistos.length, outros = [];
  ctx.api.observar('2026-10-26', s => outros.push(s));
  db.emitir(CAMINHO, { antigo: regPendente });
  assert.equal(obs.vistos.length, antesStale, 'troca de data remove callback antigo');
  ctx.api.fechar();
  const antesFechar = outros.length;
  db.emitir('daycare/dashboard/2026-10-26/avaliacao', {});
  assert.equal(outros.length, antesFechar, 'fechar não publica depois do descarte');

  console.log('agenda-marcia-dados131: OK');
}

executar().catch(e => { console.error(e); process.exitCode = 1; });
