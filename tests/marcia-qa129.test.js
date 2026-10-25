'use strict';
const assert = require('node:assert/strict');
const M = require('../auaulandia/marcia129/painel.js');

function empty(dia, overrides = {}) {
  return Object.assign({
    dia,
    agenda: { estado: 'pronto', itens: null },
    quantidades: { estado: 'pronto', matriculados: null, avulsos: 0, reposicoes: 0, total: null, hospedes: 0, presentes: null },
    faltas: { estado: 'pronto', itens: null }, novatos: { estado: 'pronto', itens: null },
    comida: { estado: 'pronto', itens: null }, saude: { estado: 'pronto', itens: null },
    tempos: { estado: 'pronto', itens: null }, tarefas: { estado: 'pronto', itens: null }
  }, overrides);
}
function later() { return new Promise(r => setImmediate(r)); }
function deferred() { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; }
class Root {
  constructor() { this.innerHTML = ''; this.listeners = {}; this.ownerDocument = { activeElement: null }; }
  addEventListener(k, fn) { this.listeners[k] = fn; }
  removeEventListener(k) { delete this.listeners[k]; }
  contains() { return true; }
  querySelectorAll() { return []; }
  querySelector() { return null; }
  click(attr, value = '') {
    const target = { closest() { return this; }, hasAttribute(k) { return k === attr; }, getAttribute(k) { return k === attr ? value : null; } };
    this.listeners.click({ target });
  }
}
async function settled() { await later(); await later(); }

(async () => {
  // Null arrays and missing totals remain a valid empty/unknown state, not a crash or false zero.
  const nulls = M.normalizar(empty('2026-10-24'), '2026-10-24');
  assert.deepEqual(nulls.agenda.itens, []);
  assert.equal(nulls.quantidades.total, null);
  const nullHtml = M.desenhar(nulls, { dia: '2026-10-24' });
  assert(nullHtml.includes('—'), 'unknown metric is visually distinct from zero');
  assert(nullHtml.includes('Avulsos'));
  assert(nullHtml.includes('Nenhuma avaliação neste dia.'));
  const zero = M.normalizar(empty('2026-10-24', { quantidades: { estado: 'pronto', matriculados: 0, avulsos: 0, reposicoes: 0, total: 0, hospedes: 0, presentes: 0 } }), '2026-10-24');
  assert(M.desenhar(zero, { dia: zero.dia }).includes('<b>0</b>'), 'real zero stays zero');

  // Malformed persisted booleans must not masquerade as a completed task.
  const malformedTask = M.normalizar(empty('2026-10-24', { tarefas: { estado: 'pronto', itens: [{ id: 'malformed', titulo: 'Estado inválido', feito: 'false' }] } }), '2026-10-24');
  assert(M.desenhar(malformedTask, { dia: malformedTask.dia }).includes('data-marcia-tarefa="malformed" aria-pressed="false"'));
  // Invalid month falls back safely; no RangeError.
  for (const mes of ['2026-13', 'not-a-month', '']) assert.doesNotThrow(() => M.calendario('2026-10-24', mes));

  // Every untrusted rendered field is escaped.
  const hostile = empty('2026-10-24', {
    atualizadoEm: '<svg onload=1>',
    agenda: { estado: 'pronto', itens: [{ id: 'x', hora: '09:00', nome: '<img src=x>', raca: '<script>x</script>', tutor: '" onclick="x', vacina: null, vermifugo: null, carrapaticida: null, observacoes: [{ rotulo: '<b>', valor: '<script>no</script>' }] }] }
  });
  const html = M.desenhar(hostile, { dia: hostile.dia });
  assert(!html.includes('<script>'));
  assert(!html.includes('<img src=x>'));
  assert(!html.includes('<svg'));
  assert(html.includes('&lt;script&gt;'));

  // A provider resolving with another date is rejected; nothing from that snapshot is painted.
  const mismatchRoot = new Root();
  M.montar(mismatchRoot, { dia: '2026-10-24', carregar: () => Promise.resolve(empty('2026-10-25', { novatos: { estado: 'pronto', itens: [{ nome: 'OUTRO DIA' }] } })), salvarTarefa: () => Promise.resolve({ feito: true, quem: 'X', quando: '10:00' }) });
  await settled();
  assert(!mismatchRoot.innerHTML.includes('OUTRO DIA'));
  assert(mismatchRoot.innerHTML.includes('Informação indisponível.'));

  // A late result for the previous day cannot replace the selected-day render.
  const old = deferred(), current = deferred(), raceRoot = new Root();
  M.montar(raceRoot, { dia: '2026-10-24', carregar: d => d === '2026-10-24' ? old.promise : current.promise, salvarTarefa: () => Promise.resolve({ feito: true, quem: 'Z', quando: '10:00' }) });
  await later(); raceRoot.click('data-marcia-dia', '2026-10-25'); await later();
  current.resolve(empty('2026-10-25', { novatos: { estado: 'pronto', itens: [{ nome: 'ATUAL' }] } })); await settled();
  old.resolve(empty('2026-10-24', { novatos: { estado: 'pronto', itens: [{ nome: 'ANTIGO' }] } })); await settled();
  assert(raceRoot.innerHTML.includes('ATUAL'));
  assert(!raceRoot.innerHTML.includes('ANTIGO'));

  // A save ACK from a prior date cannot mutate the currently selected day.
  const saveOld = deferred(), saveRoot = new Root();
  const oldTasks = empty('2026-10-24', { tarefas: { estado: 'pronto', itens: [{ id: 'old', titulo: 'Tarefa do dia antigo', feito: false }] } });
  const newTasks = empty('2026-10-25', { tarefas: { estado: 'pronto', itens: [{ id: 'new', titulo: 'Tarefa do dia novo', feito: false }] } });
  M.montar(saveRoot, { dia: oldTasks.dia, carregar: d => Promise.resolve(d === oldTasks.dia ? oldTasks : newTasks), salvarTarefa: () => saveOld.promise });
  await settled(); saveRoot.click('data-marcia-tarefa', 'old'); await later();
  saveRoot.click('data-marcia-dia', '2026-10-25'); await settled();
  saveOld.resolve({ id: 'old', feito: true, quem: 'Márcia', quando: '10:30' }); await settled();
  assert(saveRoot.innerHTML.includes('Tarefa do dia novo'));
  assert(!saveRoot.innerHTML.includes('Tarefa do dia antigo'));
  assert(!saveRoot.innerHTML.includes('Márcia · 10:30'));
  // A malformed/mismatching persistence ACK must not make the check appear saved.
  const ackRoot = new Root();
  const tasks = empty('2026-10-24', { tarefas: { estado: 'pronto', itens: [{ id: 't1', titulo: 'Tarefa inventada', feito: false }] } });
  M.montar(ackRoot, { dia: tasks.dia, carregar: () => Promise.resolve(tasks), salvarTarefa: () => Promise.resolve({ id: 't1', feito: false, quem: 'Márcia', quando: '10:30' }) });
  await settled(); ackRoot.click('data-marcia-tarefa', 't1'); await settled();
  assert(ackRoot.innerHTML.includes('aria-pressed="false"'), 'ack with wrong state cannot show checked');
  assert(ackRoot.innerHTML.includes('Não foi possível salvar'));

  // Completed task remains available to undo via an accessible button.
  const undoRoot = new Root();
  const done = empty('2026-10-24', { tarefas: { estado: 'pronto', itens: [{ id: 'done', titulo: 'Feita', feito: true, quem: 'Márcia', quando: '10:00' }] } });
  let sent;
  M.montar(undoRoot, { dia: done.dia, carregar: () => Promise.resolve(done), salvarTarefa: x => { sent = x; return Promise.resolve({ id: x.id, feito: x.feito, quem: 'Márcia', quando: '10:30' }); } });
  await settled();
  assert(undoRoot.innerHTML.includes('Feitas (1)'));
  assert(undoRoot.innerHTML.includes('aria-pressed="true"'));
  assert(undoRoot.innerHTML.includes('Desfazer Feita'));
  undoRoot.click('data-marcia-tarefa', 'done'); await settled();
  assert.equal(sent.feito, false);
  assert(undoRoot.innerHTML.includes('aria-pressed="false"'));

  console.log('marcia-qa129: OK');
})().catch(e => { console.error(e); process.exitCode = 1; });
