'use strict';
/*
 * PROVA: mudar o dia e a hora de um banho nos Lançamentos do dia (Adriana, 23/nov/2026; maquete aprovada no mesmo dia).
 *
 * «O banho estava marcado para hoje e está na planilha, não estou conseguindo alterar ele para amanhã. [...] Não
 *  podemos ter uma trabalheira pra alterar uma data de saída, ou um horário de banho.»
 *
 * - «mudar o dia» na linha do banho lançado à mão e na do banho fixo.
 * - Outro dia: o lançamento novo entra primeiro (com movido_de) e vai para a planilha; depois o antigo sai.
 *   O lançado à mão sai do dia e da planilha; o banho fixo pula só aquele dia (o combinado continua).
 * - Mesmo dia: só a hora, pelo caminho de sempre.
 * - Domingo, dia passado e banho repetido no dia novo não passam.
 *
 * Parte pura (mudar-banho.js) e app real no Chromium, sem rede, com banco falso. Dados inventados.
 * Uso:  node tests/mudar-banho191.test.js
 */
const path = require('path');
const assert = require('assert');
const { chromium } = require('playwright');

const RAIZ = path.join(__dirname, '..', 'auaulandia');
const APP = path.join(RAIZ, 'index.html');
const Z = require(path.join(RAIZ, 'mudar-banho.js'));
let ok = 0; const falhas = [];
async function prova(nome, fn) {
  try { await fn(); ok++; console.log('  ✓ ' + nome); }
  catch (e) { falhas.push(nome + ' — ' + e.message); console.log('  ✗ ' + nome + '\n      ' + e.message); }
}

(async () => {
  console.log('Parte pura');
  await prova('opções: hoje e amanhã; sábado pula o domingo e vai para a segunda', () => {
    assert.deepStrictEqual(Z.opcoes('2026-11-23', '2026-11-23'), [{ v: '2026-11-23', rot: 'Hoje (23/11)' }, { v: '2026-11-24', rot: 'Amanhã (24/11)' }]);
    assert.deepStrictEqual(Z.opcoes('2026-11-28', '2026-11-23'), [{ v: '2026-11-28', rot: 'Mesmo dia (28/11)' }, { v: '2026-11-30', rot: 'Segunda (30/11)' }]);
  });
  await prova('a régua: domingo, dia passado, sem hora e nada mudado não passam', () => {
    const b = { dia: '2026-11-23', horaAtual: '15:00', hoje: '2026-11-23' };
    assert.strictEqual(Z.validar(Object.assign({}, b, { novoDia: '2026-11-24', hora: '15:00' })), '');
    assert.strictEqual(Z.validar(Object.assign({}, b, { novoDia: '2026-11-23', hora: '16:00' })), '');
    assert.ok(/Domingo/.test(Z.validar(Object.assign({}, b, { novoDia: '2026-11-29', hora: '15:00' }))));
    assert.ok(/já passou/.test(Z.validar(Object.assign({}, b, { novoDia: '2026-11-22', hora: '15:00' }))));
    assert.ok(/hora/.test(Z.validar(Object.assign({}, b, { novoDia: '2026-11-24', hora: '' }))));
    assert.ok(/mesmo dia e a mesma hora/.test(Z.validar(Object.assign({}, b, { novoDia: '2026-11-23', hora: '15:00' }))));
  });
  await prova('repetido no dia novo: pela ficha quando há chave; senão pelo texto', () => {
    const L = { a: { valor: 'Teste/SRD (SEM SHAMPOO)', chave: 'teste__tutora' }, b: { valor: 'Outro/Poodle' } };
    assert.strictEqual(Z.repetido(L, 'teste__tutora', 'qualquer'), true);
    assert.strictEqual(Z.repetido(L, 'outra__ficha', 'Teste/SRD (SEM SHAMPOO)'), false);
    assert.strictEqual(Z.repetido(L, '', 'outro/poodle'), true);
    assert.strictEqual(Z.repetido(L, '', 'Novo/SRD'), false);
  });
  await prova('o registro novo leva o texto, a hora nova e de onde veio', () => {
    const r = Z.registro({ valor: 'Teste/SRD (SEM SHAMPOO)', chave: 'teste__tutora', det: { sham: 'SEM SHAMPOO' }, horaAntes: '15:00', dia: '2026-11-23', id: 'L1', novoDia: '2026-11-24', hora: '16:30', quem: 'Recepção Teste', ts: 5 });
    assert.deepStrictEqual(r, { valor: 'Teste/SRD (SEM SHAMPOO)', hora: '16:30', quem: 'Recepção Teste', ts: 5, planilha_ok: null,
      movido_de: { dia: '2026-11-23', hora: '15:00', por: 'Recepção Teste', ts: 5, id: 'L1' }, chave: 'teste__tutora', det: { sham: 'SEM SHAMPOO' } });
    assert.strictEqual(Z.registro({ valor: 'X', fixo: true, dia: '2026-11-23', hora: '10:00', ts: 1 }).movido_de.fixo, true);
    assert.strictEqual(Z.frase({ nome: 'Teste', dia: '2026-11-23', novoDia: '2026-11-24', hora: '16:30' }), 'Banho de Teste passa para terça, 24/11 às 16:30.');
  });

  console.log('App');
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const erros = []; p.on('pageerror', (e) => erros.push(String(e.message || e)));
  await p.route(/^https?:/, (r) => r.abort());
  await p.goto('file:///' + APP.replace(/\\/g, '/'));
  await p.waitForTimeout(700);
  const r = await p.evaluate(async () => {
    const out = {};
    const u = { role: 'consultora', nome: 'Recepção Teste' }; sessionStorage.setItem('zeluz_login', JSON.stringify(u)); aplicarLogin(u);
    const hoje = zHojeISO(), amanha = orcMaisDias(hoje, 1);
    let alvo = amanha; if (new Date(amanha + 'T12:00:00').getDay() === 0) alvo = orcMaisDias(hoje, 2);
    out.hoje = hoje; out.alvo = alvo;
    // Banco falso.
    const banco = {}; const ops = [];
    const pega = (c) => c.split('/').reduce((o, k) => (o == null ? o : o[k]), banco);
    const poe = (c, v) => { const ks = c.split('/'); let o = banco; ks.slice(0, -1).forEach((k) => { o[k] = o[k] || {}; o = o[k]; }); if (v === null) delete o[ks[ks.length - 1]]; else o[ks[ks.length - 1]] = v; };
    let n = 0;
    const ref = (c) => ({ key: c.split('/').pop(),
      once: () => Promise.resolve({ val: () => JSON.parse(JSON.stringify(pega(c) || null)), exists: () => pega(c) != null }),
      push: () => ref(c + '/novo' + (++n)),
      set: (v) => { ops.push(['set', c, v]); poe(c, JSON.parse(JSON.stringify(v))); return Promise.resolve(); },
      remove: () => { ops.push(['remove', c]); poe(c, null); return Promise.resolve(); },
      update: (v) => { ops.push(['update', c, v]); return Promise.resolve(); },
      transaction: (fn) => { const v = fn(JSON.parse(JSON.stringify(pega(c) || null))); if (v !== undefined) poe(c, v); return Promise.resolve({ committed: true, snapshot: { val: () => pega(c) } }); },
      on: () => {}, off: () => {} });
    DB = { ref };
    // A planilha: a ponte responde ok.
    const ponte = [];
    window.dashEspelhar = function (k, id, reg, acao, dia) { ponte.push({ k, id, acao, dia, valor: reg.valor, hora: reg.hora }); return Promise.resolve({ ok: true }); };
    window.dashRemoverDaPlanilha = function (k, id, reg, dia) { ponte.push({ k, id, acao: 'remover', dia, valor: reg.valor, hora: reg.hora }); return Promise.resolve({ ok: true }); };
    const alertas = []; window.zAlertao = function (t, linhas) { alertas.push(t + ' | ' + (linhas || []).join(' / ')); };
    // Lançamento à mão de hoje.
    const L1 = { valor: 'Teste/SRD (SEM SHAMPOO)', hora: '15:00', quem: 'Monitora Teste', ts: 1, chave: 'teste__tutora-teste', det: { sham: 'SEM SHAMPOO' }, planilha_ok: true, planilha_linha: 9 };
    poe('daycare/dashboard/' + hoje + '/banho/L1', JSON.parse(JSON.stringify(L1)));
    DASH_DIA_SEL = hoje; DASH_DADOS = { banho: { L1: JSON.parse(JSON.stringify(L1)) } };
    // O botão aparece para a recepção…
    out.botao = mbBotaoMao('L1', DASH_DADOS.banho.L1);
    // …e não para quem não tira lançamento.
    const pt = window.dashPodeTirar; window.dashPodeTirar = () => false; out.botaoSem = mbBotaoMao('L1', DASH_DADOS.banho.L1); window.dashPodeTirar = pt;
    // Não aparece no banho de saída lançado à mão nem num dia passado.
    out.botaoSaida = mbBotaoMao('X', { valor: 'Biscoito/SRD (BANHO DE SAÍDA · PREMIUM)', hora: '16:00' });
    // Abre o painel: amanhã já escolhido, a hora de antes.
    mbAbrirMao('L1', hoje);
    out.painel = mbPainelHTML();
    const div = document.createElement('div'); div.innerHTML = out.painel; document.body.appendChild(div);
    out.on = [...div.querySelectorAll('.seg button.on')].map((x) => x.textContent);
    out.botaoSalvar = [...div.querySelectorAll('button')].map((x) => x.textContent).filter((x) => /Mudar para|Salvar/.test(x));
    div.remove();
    // Domingo: travado.
    MB.opt = 'outra'; let dom = hoje; while (new Date(dom + 'T12:00:00').getDay() !== 0) dom = orcMaisDias(dom, 1);
    MB.novoDia = dom; out.domingo = mbPainelHTML();
    MB.opt = '1'; MB.novoDia = alvo; MB.hora = '16:30';
    await mbSalvar();
    out.ops1 = JSON.parse(JSON.stringify(ops)); out.ponte1 = JSON.parse(JSON.stringify(ponte)); out.alertas1 = alertas.slice();
    out.dadosDepois = Object.keys(DASH_DADOS.banho || {});
    out.mbDepois = MB;
    // Repetido no dia novo: um segundo banho do mesmo FILHOt não entra.
    poe('daycare/dashboard/' + hoje + '/banho/L2', { valor: 'Teste/SRD (SEM SHAMPOO)', hora: '17:00', chave: 'teste__tutora-teste' });
    DASH_DADOS = { banho: { L2: { valor: 'Teste/SRD (SEM SHAMPOO)', hora: '17:00', chave: 'teste__tutora-teste' } } };
    ops.length = 0; alertas.length = 0;
    mbAbrirMao('L2', hoje); MB.novoDia = alvo; MB.hora = '10:00';
    await mbSalvar();
    out.ops2 = ops.slice(); out.alertas2 = alertas.slice();
    // Mesmo dia, outra hora: vai pelo «editar hora» de sempre, sem lançar nem tirar nada.
    ops.length = 0; ponte.length = 0;
    let editou = null;
    window.dashEditarAbrir = function (k, id) { DASH_EDITAR_UI = { k, id, horaNova: '17:00' }; return true; };
    window.dashEditarSalvar = function () { editou = { k: DASH_EDITAR_UI.k, id: DASH_EDITAR_UI.id, hora: DASH_EDITAR_UI.horaNova }; return Promise.resolve(true); };
    mbAbrirMao('L2', hoje); MB.opt = '0'; MB.novoDia = hoje; MB.hora = '11:30';
    await mbSalvar();
    out.editou = editou; out.opsMesmo = ops.slice(); out.ponteMesmo = ponte.slice();
    // Banho fixo: o dia novo recebe o lançamento e o dia antigo pula (o combinado continua).
    ops.length = 0; ponte.length = 0; alertas.length = 0;
    const gravados = [];
    window.banhoDiaDoFixo = function (ch, dia) { return { p: { n: 'Fixo' }, br: { hora: '14:00', ativo: true }, ex: null, nome: 'Fixo', dBR: dia }; };
    window.banhoRecValorPlanilha = function () { return 'Fixo/Poodle (SEM SHAMPOO)'; };
    window.banhoRecHoraNoDia = function () { return '14:00'; };
    window.banhoRecValeNoDia = function () { return false; };
    window.banhoDiaGravar = function (ch, dia, mexer, frase) { gravados.push({ ch, dia, ex: mexer(null), frase }); return Promise.resolve({ ok: true }); };
    mbAbrirFixo('fixo__tutora-dois', hoje);
    out.painelFixo = mbPainelHTML();
    MB.novoDia = alvo; MB.hora = '14:00';
    await mbSalvar();
    out.opsF = ops.slice(); out.ponteF = ponte.slice(); out.gravados = gravados; out.alertasF = alertas.slice();
    return out;
  });
  await prova('o botão «mudar o dia» aparece para quem tira lançamento; não no banho de saída', () => {
    assert.ok(/mudar o dia/.test(r.botao) && /mbAbrirMao/.test(r.botao), r.botao);
    assert.strictEqual(r.botaoSem, ''); assert.strictEqual(r.botaoSaida, '');
  });
  await prova('o painel abre com o dia seguinte e a hora de antes', () => {
    assert.ok(r.on.some((x) => /^(Amanhã|Segunda)/.test(x)) && r.on.indexOf('15:00') >= 0, r.on.join(','));
    assert.ok(r.botaoSalvar.some((x) => /^Mudar para \d\d\/\d\d às 15:00$/.test(x)), r.botaoSalvar.join(','));
  });
  await prova('domingo: o painel diz que a casa está fechada e o botão fica travado', () => {
    assert.ok(/Domingo a casa está fechada/.test(r.domingo)); assert.ok(/disabled onclick="mbSalvar\(\)"/.test(r.domingo));
  });
  await prova('outro dia, banho à mão: o novo entra primeiro no dia novo (com a origem) e depois o antigo sai', () => {
    const set = r.ops1.findIndex((o) => o[0] === 'set' && o[1].indexOf('daycare/dashboard/' + r.alvo + '/banho/') === 0);
    const rem = r.ops1.findIndex((o) => o[0] === 'remove' && o[1] === 'daycare/dashboard/' + r.hoje + '/banho/L1');
    assert.ok(set >= 0 && rem > set, JSON.stringify(r.ops1).slice(0, 500));
    const v = r.ops1[set][2];
    assert.strictEqual(v.hora, '16:30'); assert.strictEqual(v.valor, 'Teste/SRD (SEM SHAMPOO)'); assert.strictEqual(v.chave, 'teste__tutora-teste');
    assert.deepStrictEqual(v.det, { sham: 'SEM SHAMPOO' }); assert.strictEqual(v.movido_de.dia, r.hoje); assert.strictEqual(v.movido_de.id, 'L1'); assert.strictEqual(v.movido_de.por, 'Recepção Teste');
    assert.deepStrictEqual(r.ponte1.map((x) => x.acao + ' ' + x.dia + ' ' + x.hora), ['lancar ' + r.alvo + ' 16:30', 'remover ' + r.hoje + ' 15:00']);
    assert.deepStrictEqual(r.dadosDepois, []); assert.strictEqual(r.mbDepois, null);
    assert.ok(r.alertas1.length === 1 && /^BANHO MUDADO \|/.test(r.alertas1[0]) && /às 16:30/.test(r.alertas1[0]), r.alertas1.join(' || '));
  });
  await prova('o mesmo FILHOt já tem banho no dia novo: nada é gravado', () => {
    assert.deepStrictEqual(r.ops2, []);
    assert.ok(/já tem banho lançado/.test(r.alertas2.join(' ')), r.alertas2.join(' '));
  });
  await prova('mesmo dia: só a hora, pelo «editar hora» de sempre', () => {
    assert.deepStrictEqual(r.editou, { k: 'banho', id: 'L2', hora: '11:30' });
    assert.deepStrictEqual(r.opsMesmo, []); assert.deepStrictEqual(r.ponteMesmo, []);
  });
  await prova('banho fixo: lança no dia novo e pula só o dia antigo, com o rastro', () => {
    assert.ok(/Muda só o banho desta semana/.test(r.painelFixo));
    const set = r.opsF.find((o) => o[0] === 'set');
    assert.ok(set && set[1].indexOf('daycare/dashboard/' + r.alvo + '/banho/') === 0, JSON.stringify(r.opsF));
    assert.strictEqual(set[2].valor, 'Fixo/Poodle (SEM SHAMPOO)'); assert.strictEqual(set[2].movido_de.fixo, true);
    assert.strictEqual(r.gravados.length, 1); assert.strictEqual(r.gravados[0].dia, r.hoje);
    assert.strictEqual(r.gravados[0].ex.pular, true); assert.strictEqual(r.gravados[0].ex.movido_para, r.alvo);
    assert.ok(!r.opsF.some((o) => o[0] === 'remove'), 'o banho fixo não apaga lançamento nenhum');
    assert.ok(/O combinado continua/.test(r.alertasF.join(' ')), r.alertasF.join(' '));
  });
  await prova('nenhum erro de página', () => { assert.deepStrictEqual(erros.filter((x) => !/prevSecVirar/.test(x)), []); });
  await b.close();
  console.log('\n' + ok + ' provas passaram' + (falhas.length ? ', ' + falhas.length + ' falharam' : ''));
  process.exit(falhas.length ? 1 : 0);
})();
