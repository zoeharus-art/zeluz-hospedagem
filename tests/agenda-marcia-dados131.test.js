'use strict';

const assert = require('node:assert/strict');
const Agenda = require('../auaulandia/agenda-marcia/dados.js');

function clone(v) { return v == null ? v : JSON.parse(JSON.stringify(v)); }
function snap(v) { return { val() { return clone(v); } }; }
class FakeDB {
  constructor() {
    this.dados = {}; this.listeners = {}; this.reads = []; this.writes = []; this.offs = [];
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
    nome: 'Luna', raca: 'SRD', tutor: 'Família Luna', hora: '09:30',
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
  const db = new FakeDB(), ctx = criar(db), obs = observarPronto(ctx.api, db);
  assert.equal(obs.vistos[0].estado, 'carregando');
  assert.equal(obs.ultimo().estado, 'pronto');
  assert.deepEqual(db.reads, [CAMINHO], 'observa somente avaliações do dia');
  assert.equal(db.writes.length, 0, 'observar/renderizar não grava');

  const dbFalha = new FakeDB(), falhaCtx = criar(dbFalha), falhas = [];
  falhaCtx.api.observar(DIA, s => falhas.push(s));
  dbFalha.falhar(CAMINHO);
  assert.equal(falhas.at(-1).estado, 'falha', 'falha da fonte não vira lista pronta vazia');
  assert.equal(dbFalha.writes.length, 0);

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
  assert.equal(regPendente.det.avaliacao129.versao, 131);
  assert.equal(regPendente.det.fora_do_cadastro, true);
  assert.equal(regPendente.planilha_ok, false, 'criação nasce na fila nativa até a ponte confirmar');
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
  const resumoCriado = await resumoCtx.api.salvar(pedido({ requestId: 'resumo-1' }));
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
  assert.equal(contextosResumo.at(-1).resumoAlterado, true);
  assert.deepEqual(contextosResumo.at(-1).pendente, contextosResumo.at(-1).edicaoPendente);

  const dbEspelho = new FakeDB(), espelhoCtx = criar(dbEspelho, { aoSalvar: () => Promise.reject(new Error('espelho indisponível')) });
  observarPronto(espelhoCtx.api, dbEspelho);
  const semEspelho = await espelhoCtx.api.salvar(pedido({ requestId: 'espelho-1', avaliacao: avaliacao({ pagamento: { recebido: true, valorCent: 8000 } }) }));
  assert.equal(semEspelho.espelhoOk, false);
  assert.equal(semEspelho.item.pagamento.recebido, true, 'ACK financeiro vem da transação, não do espelho');
  assert.equal(dbEspelho.pushes, 1, 'falha do espelho não cria segundo push');

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
