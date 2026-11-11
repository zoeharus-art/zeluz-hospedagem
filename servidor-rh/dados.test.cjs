'use strict';
const assert = require('node:assert/strict');
const D = require('./dados.js');

const DIA = '2026-10-30';
const clone = x => x == null ? x : JSON.parse(JSON.stringify(x));

class DB {
  constructor() { this.tree = {}; this.reads = []; this.writes = []; this.offs = 0; this.forge = null; this.silencio = false; this.antesRetry = null; this.depoisCommit = null; }
  get(p) { let v = this.tree; for (const k of p.split('/')) { if (!v || typeof v !== 'object') return null; v = v[k]; } return v === undefined ? null : clone(v); }
  put(p, v) { const ks = p.split('/'); let o = this.tree; for (const k of ks.slice(0, -1)) o = o[k] ||= {}; o[ks.at(-1)] = clone(v); }
  ref(path) {
    const db = this;
    return {
      start: null, end: null, max: null,
      orderByKey() { return this; }, startAt(v) { this.start = v; return this; }, endAt(v) { this.end = v; return this; }, limitToFirst(v) { this.max = v; return this; },
      on(_event, ok) {
        db.reads.push({ path, start: this.start, end: this.end, max: this.max });
        if (db.silencio) return;
        let v = db.get(path);
        if (this.start && v && typeof v === 'object') v = Object.fromEntries(Object.entries(v).filter(([k]) => k >= this.start && k <= this.end).slice(0, this.max));
        ok({ val: () => clone(v) });
      },
      off() { db.offs++; },
      transaction(fn) {
        const old = db.get(path); let next = fn(clone(old));
        if (db.antesRetry) { db.antesRetry(); next = fn(clone(old)); }
        if (next === undefined) return Promise.resolve({ committed: false, snapshot: { val: () => old } });
        db.writes.push(path); db.put(path, next);
        if (db.depoisCommit) db.depoisCommit();
        const ack = db.forge ? db.forge(clone(next)) : next;
        return Promise.resolve({ committed: true, snapshot: { val: () => clone(ack) } });
      }
    };
  }
}

const campos = vaga => ({ tipo: 'entrevista', nome: 'Pessoa fictícia', vaga, telefone: '(00) 90000-0000', hora: '09:30' });
const autorA = { id: 'adriana', nome: 'Adriana' }, autorM = { id: 'marcia', nome: 'Márcia' };
const guarda = () => {};

async function run() {
  const db = new DB(), dados = D.criarDados({ banco: db, timeoutMs: 1000, agora: () => 1_800_000_000_000 });
  assert.equal(dados.root, 'rh-entrevistas-v1/entrevistas');
  const criado = await dados.salvar({ acao: 'criar', dia: DIA, requestId: 'pedido-151', avaliacao: campos('Vaga fictícia') }, autorA, guarda);
  assert.equal(criado.item.telefone, '+5500900000000');
  assert.ok(db.writes.every(p => p.startsWith(D.ROOT + '/')));
  assert.ok(db.writes.every(p => !p.includes('daycare')));
  const armazenado = db.get(D.ROOT + '/' + DIA + '/' + criado.id);
  for (const k of ['det', 'raca', 'tutor', 'vacina', 'pagamento', 'role', 'path']) assert.equal(Object.hasOwn(armazenado, k), false);

  const outraInstancia = D.criarDados({ banco: db, timeoutMs: 1000, agora: () => 1_800_000_000_000 });
  const repetido = await outraInstancia.salvar({ acao: 'criar', dia: DIA, requestId: 'pedido-151', avaliacao: campos('Vaga fictícia') }, autorA, guarda);
  assert.equal(repetido.id, criado.id);
  assert.equal(Object.keys(db.get(D.ROOT + '/' + DIA)).length, 1);
  await assert.rejects(outraInstancia.salvar({ acao: 'criar', dia: DIA, requestId: 'pedido-151', avaliacao: campos('Outra vaga') }, autorA, guarda), /CRIACAO_CONFLITANTE/);
  await assert.rejects(dados.salvar({ acao: 'criar', dia: DIA, requestId: 'x', role: 'gestao', avaliacao: campos('Vaga') }, autorA, guarda), /COMANDO_INVALIDO/);
  await assert.rejects(dados.salvar({ acao: 'criar', dia: DIA, requestId: 'x2', avaliacao: { ...campos('Vaga'), pagamento: true } }, autorA, guarda), /CAMPOS_INVALIDOS/);
  await assert.rejects(dados.salvar({ acao: 'criar', dia: DIA, requestId: 'x3', avaliacao: campos('Vaga') }, { id: 'gestao', nome: 'Adriana' }, guarda), /COMANDO_INVALIDO/);

  const editado = await dados.salvar({ acao: 'editar', dia: DIA, id: criado.id, expectedRevision: criado.revisao, expectedFingerprint: criado.item.fingerprint, avaliacao: campos('Vaga revisada') }, autorM, guarda);
  assert.equal(editado.item.vaga, 'Vaga revisada');
  assert.equal(editado.quem, 'Márcia');
  await assert.rejects(dados.salvar({ acao: 'editar', dia: DIA, id: criado.id, expectedRevision: criado.revisao, expectedFingerprint: criado.item.fingerprint, avaliacao: campos('Velha') }, autorA, guarda), /AGENDAMENTO_DESATUALIZADO/);

  db.reads.length = 0; db.offs = 0;
  const mes = await dados.listarMes('2026-10');
  assert.equal(mes.dias[DIA], true);
  assert.deepEqual(db.reads, [{ path: D.ROOT, start: '2026-10-01', end: '2026-10-31', max: 31 }]);
  assert.equal(db.offs, 1, 'listener mensal é removido após o primeiro snapshot');

  db.put(D.ROOT + '/' + DIA, 'inválido');
  await assert.rejects(dados.listarDia(DIA), /FONTE_INVALIDA/);
  db.put(D.ROOT + '/' + DIA, { [criado.id]: db.get(D.ROOT + '/' + DIA + '/' + criado.id) });

  const ackDb = new DB(), ackDados = D.criarDados({ banco: ackDb, timeoutMs: 1000, agora: () => 1_800_000_000_000 });
  const base = await ackDados.salvar({ acao: 'criar', dia: DIA, requestId: 'ack151', avaliacao: campos('Vaga') }, autorA, guarda);
  ackDb.forge = x => ({ ...x, cancelamento: { ...x.cancelamento, ativo: false } });
  await assert.rejects(ackDados.salvar({ acao: 'cancelar', dia: DIA, id: base.id, expectedRevision: base.revisao, expectedFingerprint: base.item.fingerprint, motivo: 'Motivo fictício' }, autorM, guarda), /CONFIRMACAO_INVALIDA/);
  ackDb.forge = null;
  const estado = await ackDados.listarDia(DIA), cancelado = estado.itens[0];
  assert.equal(cancelado.cancelada, true);
  ackDb.forge = x => ({ ...x, cancelamento: { ...x.cancelamento, ativo: true } });
  await assert.rejects(ackDados.salvar({ acao: 'reativar', dia: DIA, id: cancelado.id, expectedRevision: cancelado.revisao, expectedFingerprint: cancelado.fingerprint }, autorA, guarda), /CONFIRMACAO_INVALIDA/);

  const lento = new DB(); lento.silencio = true;
  let cancelou = false;
  const timeoutDados = D.criarDados({ banco: lento, timeoutMs: 100, agora: () => 1_800_000_000_000, setTimeout: fn => { queueMicrotask(fn); return 1; }, clearTimeout: () => { cancelou = true; } });
  await assert.rejects(timeoutDados.listarDia(DIA), /BANCO_TIMEOUT/);
  assert.equal(lento.offs, 1, 'timeout remove observador');
  assert.equal(cancelou, true);

  function guardaDe(estado) { return () => { if (!estado.ativa) { const e = new Error('NAO_AUTENTICADO'); e.code = 'NAO_AUTENTICADO'; throw e; } }; }
  const retryDb = new DB(), retryDados = D.criarDados({ banco: retryDb, timeoutMs: 1000, agora: () => 1_800_000_000_000 }), sessaoRetry = { ativa: true };
  retryDb.antesRetry = () => { sessaoRetry.ativa = false; retryDb.antesRetry = null; };
  await assert.rejects(retryDados.salvar({ acao: 'criar', dia: DIA, requestId: 'retry-revogado', avaliacao: campos('Vaga') }, autorA, guardaDe(sessaoRetry)), /NAO_AUTENTICADO/);
  assert.equal(retryDb.writes.length, 0, 'revogação entre retries impede commit');

  const commitDb = new DB(), commitDados = D.criarDados({ banco: commitDb, timeoutMs: 1000, agora: () => 1_800_000_000_000 }), sessaoCommit = { ativa: true };
  commitDb.depoisCommit = () => { sessaoCommit.ativa = false; commitDb.depoisCommit = null; };
  const comandoCommit = { acao: 'criar', dia: DIA, requestId: 'expira-apos-commit', avaliacao: campos('Vaga') };
  await assert.rejects(commitDados.salvar(comandoCommit, autorM, guardaDe(sessaoCommit)), /NAO_AUTENTICADO/);
  assert.equal(commitDb.writes.length, 1, 'expiração após commit não dispara nova escrita interna');
  assert.equal(Object.keys(commitDb.get(D.ROOT + '/' + DIA)).length, 1);
  sessaoCommit.ativa = true;
  const recuperado = await commitDados.salvar(comandoCommit, autorM, guardaDe(sessaoCommit));
  assert.equal(Object.keys(commitDb.get(D.ROOT + '/' + DIA)).length, 1, 'retry externo é idempotente');
  assert.equal(recuperado.id, Object.keys(commitDb.get(D.ROOT + '/' + DIA))[0]);

  const bancoFalho = { ref() { return { transaction() { return Promise.reject(new Error('host-interno-nao-expor')); } }; } };
  const dadosFalhos = D.criarDados({ banco: bancoFalho, timeoutMs: 1000, agora: () => 1_800_000_000_000 });
  await assert.rejects(dadosFalhos.salvar({ acao: 'criar', dia: DIA, requestId: 'banco-falho', avaliacao: campos('Vaga') }, autorA, guarda), e => e.code === 'BANCO_INDISPONIVEL' && !e.message.includes('host-interno'));

  await assert.rejects(dados.salvar({ acao: 'criar', dia: DIA, requestId: 'sem-guarda', avaliacao: campos('Vaga') }, autorA), /GUARDA_SESSAO_OBRIGATORIA/);
  console.log('dados151: OK');
}

module.exports = run;
if (require.main === module) run().catch(e => { console.error(e); process.exitCode = 1; });
