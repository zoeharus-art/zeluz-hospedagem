'use strict';
// «Resposta salva, mas a tarefa do Day Care ainda não foi criada» (Adriana, 06/nov/2026): a tela dos Lançamentos estava em outro dia e a linha da tarefa foi parar nele. Dados inventados.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const html = fs.readFileSync(path.resolve(__dirname, '../auaulandia/index.html'), 'utf8');
let falhas = 0, total = 0;
async function prova(nome, fn) { total++; try { await fn(); console.log('  ok  ' + nome); } catch (e) { falhas++; console.log('  FALHOU  ' + nome + '\n    ' + (e && e.stack || e)); } }

const ini = html.indexOf('  function dashLancar(k, valor, idx, horaOpc, cuidado36Recibo){'), fim = html.indexOf('\n  function ', ini + 10);
assert.ok(ini > 0 && fim > ini);
const HOJE = '2026-11-06', TELA = '2026-11-19';
function montar(diaDaTela) {
  const gravados = [], espelhos = [], avaliados = [];
  const DB = { ref: (p) => ({ key: p.split('/').pop(),
    push() { const id = 'novo1'; return { key: id, set(v) { gravados.push({ path: p + '/' + id, v }); return Promise.resolve(); } }; },
    transaction(fn) { const v = fn(null); gravados.push({ path: p, v }); return Promise.resolve({ committed: true }); } }) };
  const ctx = { DB, console, alert: (m) => { throw new Error('alerta: ' + m); }, dashLancarFalhou: (e) => String(e), DC_DASH_TURMA: {}, Date, JSON, Object, String, Number, Math, Promise,
    PELUDINHOS: [{ n: 'Tico', tutor: 'Fulana' }], DASH_FORA: {}, DASH_DADOS: {}, DASH_DET: {}, DASH_SEL: {}, DASH_SEL_I: {}, DASH_DADOS_DE: { dia: diaDaTela },
    dashItem: (k) => ({ k, t: k }), dashDia: () => diaDaTela, dcDataKey: () => HOJE, dashDet: () => ({}), dashVaiParaPlanilha: () => true,
    dcKey: () => 'tico__fulana', jsNorm: (s) => String(s), quemSou: () => 'Equipe', planCasar: () => null, renderDash() {}, dashAtualizarCard() {}, audit() {},
    pendAvaliarLancamento: (k, reg, dia) => { avaliados.push(dia); return false; }, dashEspelhar: (k, id, reg, modo, dia) => { espelhos.push(dia); }, document: { getElementById: () => null } };
  vm.createContext(ctx); vm.runInContext(html.slice(ini, fim) + '\nthis.lancar=dashLancar;', ctx);
  return { ctx, gravados, espelhos, avaliados };
}
const recibo = (dia) => ({ cuidado57: Object.assign({ linhaId: 'r57_a_b', petIndex: 0 }, dia ? { dia } : {}), origemVencimento: { protocolo: 'cuidado57', diaOrigem: HOJE, chave: 'tico__fulana', tipo: 'escova', groupKey: 'g', cycleKey: 'c', itemK: 'escova_p', respostaId: 'r', revisao: 0, origemResposta: 'loja' } });

(async () => {
  await prova('a tarefa cai no dia da resposta, mesmo com a tela dos Lançamentos em outro dia', async () => {
    const m = montar(TELA), r = recibo(HOJE);
    assert.equal(await m.ctx.lancar('escova', 'Tico/SRD', 0, '', r), true);
    assert.equal(m.gravados[0].path, 'daycare/dashboard/' + HOJE + '/escova/r57_a_b');
    assert.equal(r.id, 'r57_a_b');
    assert.deepEqual(m.espelhos, [HOJE]);
    assert.deepEqual(m.avaliados, [HOJE]);
  });
  await prova('tarefa sem dia no recibo vai para hoje, nunca para o dia da tela', async () => {
    const m = montar(TELA);
    await m.ctx.lancar('escova', 'Tico/SRD', 0, '', recibo(''));
    assert.equal(m.gravados[0].path, 'daycare/dashboard/' + HOJE + '/escova/r57_a_b');
  });
  await prova('lançamento à mão continua no dia escolhido na tela', async () => {
    const m = montar(TELA);
    await m.ctx.lancar('escova', 'Tico/SRD', 0);
    assert.equal(m.gravados[0].path, 'daycare/dashboard/' + TELA + '/escova/novo1');
    assert.deepEqual(m.espelhos, [TELA]);
  });
  await prova('a criação da tarefa manda o dia no recibo', async () => {
    assert.ok(html.includes('var recibo={cuidado57:{linhaId:t(q.linhaId),petIndex:f.petIndex,dia:c.dia},origemVencimento:cp(a)};'));
  });
  console.log(`zelozinha-tarefa-dia179: ${total - falhas} de ${total} provas passaram`);
  if (falhas) process.exit(1);
})();
