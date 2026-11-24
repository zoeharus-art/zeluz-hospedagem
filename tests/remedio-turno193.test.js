'use strict';
/*
 * PROVA: o remédio da ficha fica travado no plantão da hora (Adriana, 24/nov/2026).
 *
 * «Eu preciso que as informações de medicamento e de alimentação estejam disponíveis e preciso que, para não criar
 *  confusão, esteja travada nos horários: exemplo, às 8h não aparece a medicação da noite.»
 *
 * Plantão de 12 h: dia 07h00–18h49, noite 18h50–06h59. A dose de horário que já passou e ninguém registrou
 * não vira botão: uma linha avisa o horário para a gestão conferir. App real no Chromium, sem rede e sem banco. Dados inventados.
 * Uso:  node tests/remedio-turno193.test.js
 */
const path = require('path');
const assert = require('assert');
const { chromium } = require('playwright');

const APP = path.join(__dirname, '..', 'auaulandia', 'index.html');
let ok = 0; const falhas = [];
async function prova(nome, fn) {
  try { await fn(); ok++; console.log('  ✓ ' + nome); }
  catch (e) { falhas.push(nome + ' — ' + e.message); console.log('  ✗ ' + nome + '\n      ' + e.message); }
}

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const erros = []; p.on('pageerror', (e) => erros.push(String(e.message || e)));
  await p.route(/^https?:/, (r) => r.abort());
  await p.goto('file:///' + APP.replace(/\\/g, '/'));
  await p.waitForTimeout(700);
  const r = await p.evaluate(() => {
    const u = { role: 'plantonista', nome: 'Plantonista Teste' };
    sessionStorage.setItem('zeluz_login', JSON.stringify(u)); aplicarLogin(u);
    hospedes = [{ nome: 'Teste 01', tutor: 'Tutora Teste', raca: 'SRD', refKey: 'teste 01__tutora teste', ini: 'T', cor: '#234D67' }];
    renderHosp(); abrirPlantao(0);
    const it = { nome: 'Remédio Teste', q: '1', u: 'comprimido', horarios: ['08:00', '12:00', '20:00', '02:00'], continuo: true };
    let hora = '08:30';
    fichaHoraAgora = function () { return hora; };
    fichaEhHoje = function () { return true; };
    const tela = (h, dadas) => {
      hora = h;
      MED_AGENDA_ITENS = { r1: Object.assign({}, it) };
      MED_AGENDA_LOG = {};
      (dadas || []).forEach((x) => { MED_AGENDA_LOG[magDoseId('r1', x)] = { quem: 'Plantonista Teste', ts: Date.now(), horario: x, nome: it.nome }; });
      renderMedAgendaHoje();
      const el = document.getElementById('magHoje');
      return { t: el.innerText.replace(/\s+/g, ' '), horas: [...el.querySelectorAll('.mag-hora')].map((x) => x.textContent.slice(0, 5)), resumo: Object.assign({}, MAG_RESUMO) };
    };
    return {
      manha: tela('08:30'),
      tardeComAtrasada: tela('13:00', ['08:00']),
      noite: tela('19:30', ['08:00', '12:00']),
      noiteAtrasada: tela('19:30', ['08:00']),
      madrugada: tela('03:00'),
      fimDaNoite: tela('06:50', ['02:00'])
    };
  });
  await b.close();

  console.log('Remédio travado no turno');
  await prova('às 8h30 aparecem só as doses do dia (08:00 e 12:00); as das 20:00 e 02:00 não', () => {
    assert.deepStrictEqual(r.manha.horas, ['08:00', '12:00'], r.manha.t);
    assert.ok(/Plantão do dia \(7h às 18h50\)/.test(r.manha.t), r.manha.t);
    assert.ok(!/20:00/.test(r.manha.t), r.manha.t);
    assert.ok(/Do outro plantão, sem registro: 02:00\. Avise a gestão\./.test(r.manha.t), 'a dose da madrugada sem registro vira aviso: ' + r.manha.t);
  });
  await prova('a próxima dose e o cabeçalho contam só o turno (às 8h30 a próxima é 12:00, nada da noite)', () => {
    assert.strictEqual(r.manha.resumo.pend, 2); assert.strictEqual(r.manha.resumo.proxima, '12:00');
  });
  await prova('às 19h30, com o dia todo dado, aparece só a dose das 20:00', () => {
    assert.deepStrictEqual(r.noite.horas, ['20:00'], r.noite.t);
    assert.ok(/Plantão da noite \(18h50 às 7h\)/.test(r.noite.t), r.noite.t);
  });
  await prova('dose do dia que ninguém registrou não vira botão à noite: só o aviso para a gestão', () => {
    assert.deepStrictEqual(r.noiteAtrasada.horas, ['20:00'], r.noiteAtrasada.t);
    assert.ok(/Do outro plantão, sem registro: 02:00, 12:00\./.test(r.noiteAtrasada.t), r.noiteAtrasada.t);
  });
  await prova('de madrugada aparece a dose das 02:00, não as do dia', () => {
    assert.deepStrictEqual(r.madrugada.horas, ['02:00'], r.madrugada.t);
  });
  await prova('às 6h50, com a dose das 02:00 dada, a ficha diz que não há remédio pendente no plantão', () => {
    assert.ok(!/08:00|12:00|20:00/.test(r.fimDaNoite.t), r.fimDaNoite.t);
  });
  await prova('às 13h a dose das 08:00 já dada some; 12:00 e nada da noite', () => {
    assert.deepStrictEqual(r.tardeComAtrasada.horas, ['12:00'], r.tardeComAtrasada.t);
    assert.ok(/08:00 — 1 remédio dado/.test(r.tardeComAtrasada.t) && !/20:00/.test(r.tardeComAtrasada.t), r.tardeComAtrasada.t);
  });
  await prova('nenhum erro de página', () => { assert.deepStrictEqual(erros.filter((x) => !/prevSecVirar/.test(x)), []); });

  console.log('\n' + ok + ' provas passaram' + (falhas.length ? ', ' + falhas.length + ' falharam' : ''));
  process.exit(falhas.length ? 1 : 0);
})();
