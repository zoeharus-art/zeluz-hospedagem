'use strict';
/*
 * PROVA: o cuidado autorizado pelo tutor espera as escolhas antes de ir para a ficha, e o «Corrigir» reabre (Adriana, 26/nov/2026).
 *
 * «Fui lançar o carrapaticida e não deixou eu colocar o nome para ser separado, só saiu e foi para o em dia. Preciso poder
 *  clicar e refazer, mudar, cancelar em caso de erro. E preciso que a informação colocada ali vá para a ficha individual
 *  bem como para o lançamento do dia.»
 *
 * Causa: a linha do cuidado autorizado (cuidado57) gravava a ficha assim que nascia; a ficha em dia tirava o cartão da
 * Zelozinha antes de alguém escolher o nome, a quantidade e onde vai passar.
 *   1. a ficha espera as escolhas completas (e o nome vai junto para a ficha);
 *   2. a linha diz por que a ficha ainda não mudou;
 *   3. a linha lançada à mão e a do vermífugo completa (caso de 25/11) continuam gravando;
 *   4. o «Corrigir» aparece no «Já em dia hoje» só para os cuidados de prevenção;
 *   5. tocar em «Corrigir» marca a linha em correção, devolve a ficha ao que era e solta a marca da ficha;
 *   6. o Snoopy não pede nova confirmação só porque a linha entrou em correção.
 * App real no Chromium, sem rede; o banco é de mentira, na memória. Dados inventados.
 * Uso:  node tests/carrapaticida-corrigir197.test.js
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
    const out = {}, tenta = (f) => { try { return f(); } catch (e) { return 'erro: ' + e.message; } };
    const ov = { protocolo: 'cuidado57', chave: 'teste01__tutora', itemK: 'ecto_p', origemResposta: 'loja', linhaId: 'r57_x' };
    const linha = (det) => ({ chave: 'teste01__tutora', valor: 'Teste01/SRD (CONFERIR ORIENTAÇÃO)', origemVencimento: ov,
      det: Object.assign({ cuidado57_estado: 'conferir-orientacao' }, det) });
    const incompleta = linha({ prod: 'PIPETA · 30 DIAS' });
    const completa = linha({ prod: 'PIPETA · 30 DIAS', nome: 'PRODUTO TESTE', qtd: 'PIPETA', passa: 'DEPOIS DO BANHO' });
    const corrigindo = linha({ prod: 'PIPETA · 30 DIAS', nome: 'PRODUTO TESTE', qtd: 'PIPETA', passa: 'DEPOIS DO BANHO', corrigindo: { ts: 1, quem: 'Teste' } });
    out.eleg = [incompleta, completa, corrigindo].map((o) => tenta(() => dashPrevFichaElegivel('carrapaticida', o)));
    out.espera = [incompleta, completa, corrigindo].map((o) => tenta(() => dashPrev57Espera(o)));
    // a linha diz por quê (o dia aberto precisa ser hoje para a função falar)
    out.linhaInc = tenta(() => dashPrevFichaLinhaHTML('carrapaticida', 'r57_x', incompleta));
    out.linhaCor = tenta(() => dashPrevFichaLinhaHTML('carrapaticida', 'r57_x', corrigindo));
    // o nome escolhido vai para a ficha
    out.patch = tenta(() => dashPrevFichaPatch('carrapaticida', {}, '2026-11-26', 'Teste', completa.det));
    // regressões: linha à mão e vermífugo completo do cuidado57
    out.mao = tenta(() => dashPrevFichaElegivel('carrapaticida', { chave: 'teste01__tutora', valor: 'x', det: { prod: 'BRAVECTO · 90 DIAS' } }));
    const ovV = Object.assign({}, ov, { itemK: 'verm_dose2_p' });
    out.verm = tenta(() => dashPrevFichaElegivel('vermifugo', { chave: 'teste01__tutora', valor: 'x', origemVencimento: ovV,
      det: { cuidado57_estado: 'conferir-orientacao', nome: 'VERMÍFUGO TESTE', qtd: 'MEIO COMPRIMIDO', onde: 'NA BOLSA' } }));
    // Snoopy
    const S = window.ZeluzSnoopyConfirmacao;
    out.snoopy = !!(S && S.assinatura(completa) === S.assinatura(corrigindo));
    // «Já em dia hoje»: o botão só nos cuidados de prevenção
    const Z = window.ZelozinhaSimples, dia = zPainel44Dia();
    Z._vivo.dia = dia;
    Z._vivo.fila = {
      'teste01__tutora': { estado: 'enviado', nome: 'Teste01', tutor: 'Tutora', enviadoEm: 2, itens: [{ itemK: 'ecto_p' }], texto: 'oi' },
      'teste02__tutora': { estado: 'enviado', nome: 'Teste02', tutor: 'Tutora', enviadoEm: 1, itens: [{ itemK: 'vac_raiva_p' }], texto: 'oi' } };
    const h = Z.secaoEmDiaHTML(dia, {});
    out.botoes = (h.match(/data-zt694-acao="corrigir-emdia" data-zt694-dc="([^"]+)"/g) || []).map((x) => x.split('dc="')[1].replace('"', ''));
    out.dia = dia;
    return out;
  });

  // o «Corrigir» de verdade: banco de mentira, ficha de mentira
  const fluxo = await p.evaluate(async () => {
    const dia = zPainel44Dia(), pet = { n: 'Teste01', tutor: 'Tutora' }, pk = pelKey(pet);
    const banco = { daycare: { 'prev-ficha': {}, dashboard: {} } };
    const partes = (c) => String(c).split('/').filter(Boolean);
    const ler = (c) => partes(c).reduce((o, k) => (o && typeof o === 'object') ? o[k] : undefined, banco);
    const pôr = (c, v) => { const ps = partes(c), ult = ps.pop(); let o = banco; ps.forEach((k) => { if (!o[k] || typeof o[k] !== 'object') o[k] = {}; o = o[k]; }); if (v === null) delete o[ult]; else o[ult] = JSON.parse(JSON.stringify(v)); };
    DB = { ref: (c) => ({
      once: async () => ({ val: () => { const v = ler(c); return v === undefined ? null : JSON.parse(JSON.stringify(v)); } }),
      on: () => {}, off: () => {}, set: async (v) => pôr(c, v), remove: async () => pôr(c, null),
      update: async (o) => Object.keys(o).forEach((k) => pôr(c + '/' + k, o[k])) }) };
    const det = { cuidado57_estado: 'conferir-orientacao', prod: 'PIPETA · 30 DIAS', nome: 'PRODUTO ERRADO', qtd: 'PIPETA', passa: 'NO DAY CARE' };
    pôr('daycare/dashboard/' + dia + '/carrapaticida/r57_x', { chave: pk, valor: 'Teste01/SRD (CONFERIR ORIENTAÇÃO)', det,
      origemVencimento: { protocolo: 'cuidado57', chave: pk, itemK: 'ecto_p', origemResposta: 'loja', linhaId: 'r57_x' } });
    pôr('daycare/prev-ficha/' + dia + '/carrapaticida/r57_x', { chave: pk, pelKey: pk, estado: 'aplicado', itemK: 'ecto_p',
      antes: { ecto_t: '2026-10-27', ecto_p: dia }, depois: { ecto_t: dia, ecto_p: '2026-12-26', ecto_nome: 'PRODUTO ERRADO', ecto_p_lanc: { dia, quem: 'Teste', ts: 1 } } });
    const ficha = { ecto_t: dia, ecto_p: '2026-12-26', ecto_nome: 'PRODUTO ERRADO', ecto_p_lanc: { dia, quem: 'Teste', ts: 1 } };
    const gravou = [];
    dashCuidado36PetPorDc = () => pet; canEditPel = () => true; pelExtra = () => ficha;
    prevGravar = (pp, patch) => { gravou.push(patch); Object.assign(ficha, patch); return Promise.resolve({ ok: true }); };
    zPergunta = () => Promise.resolve(true); zAlertao = () => {};
    const Z = window.ZelozinhaSimples;
    Z._vivo.dia = dia; Z._vivo.fila = { [pk]: { estado: 'enviado', nome: 'Teste01', tutor: 'Tutora', enviadoEm: 2, itens: [{ itemK: 'ecto_p' }], texto: 'oi' } };
    const caixa = document.createElement('div'); caixa.className = 'zt694'; caixa.innerHTML = Z.secaoEmDiaHTML(dia, {}); document.body.appendChild(caixa);
    const bt = caixa.querySelector('[data-zt694-acao="corrigir-emdia"]');
    if (!bt) return { erro: 'sem botão' };
    bt.click();
    for (let i = 0; i < 40 && ler('daycare/prev-ficha/' + dia + '/carrapaticida/r57_x'); i++) await new Promise((ok) => setTimeout(ok, 50));
    const depoisCorrigir = {
      corrigindo: !!(ler('daycare/dashboard/' + dia + '/carrapaticida/r57_x/det/corrigindo') || {}).ts,
      marca: ler('daycare/prev-ficha/' + dia + '/carrapaticida/r57_x') === undefined ? 'saiu' : 'ficou',
      volta: gravou[0] || null,
      espera: dashPrev57Espera(ler('daycare/dashboard/' + dia + '/carrapaticida/r57_x')),
    };
    // a escolha nova e o «Pronto»: a marca de correção sai e a linha volta a poder gravar a ficha
    pôr('daycare/dashboard/' + dia + '/carrapaticida/r57_x/det/nome', 'PRODUTO CERTO');
    const pronto = document.createElement('button');
    pronto.setAttribute('data-zt694-acao', 'pronto-ficha'); pronto.setAttribute('data-zt694-linha', dia + '|carrapaticida|r57_x');
    caixa.appendChild(pronto); pronto.click();
    for (let i = 0; i < 40 && ler('daycare/dashboard/' + dia + '/carrapaticida/r57_x/det/corrigindo'); i++) await new Promise((ok) => setTimeout(ok, 50));
    const linhaFim = ler('daycare/dashboard/' + dia + '/carrapaticida/r57_x');
    depoisCorrigir.pronto = { corrigindo: !!linhaFim.det.corrigindo, nome: linhaFim.det.nome, eleg: dashPrevFichaElegivel('carrapaticida', linhaFim) };
    return depoisCorrigir;
  });

  console.log('Carrapaticida: escolhas antes da ficha e «Corrigir»');
  await prova('sem nome, quanto e onde vai passar, a ficha espera; completas, grava; em correção, espera', async () => {
    assert.deepStrictEqual(r.eleg, [false, true, false]);
    assert.deepStrictEqual(r.espera, ['escolhas', '', 'corrigindo']);
  });
  await prova('a linha do dia diz por que a ficha ainda não mudou', async () => {
    assert.ok(/Ficha: falta escolher na Zelozinha/.test(r.linhaInc), r.linhaInc);
    assert.ok(/Ficha: em correção na Zelozinha/.test(r.linhaCor), r.linhaCor);
  });
  await prova('o nome escolhido vai para a ficha junto com a data', async () => {
    assert.strictEqual(r.patch.patch.ecto_t, '2026-11-26');
    assert.strictEqual(r.patch.patch.ecto_nome, 'Produto Teste');
  });
  await prova('a linha lançada à mão e o vermífugo completo continuam gravando a ficha', async () => {
    assert.strictEqual(r.mao, true);
    assert.strictEqual(r.verm, true);
  });
  await prova('o Snoopy não pede nova confirmação só porque a linha entrou em correção', async () => {
    assert.strictEqual(r.snoopy, true);
  });
  await prova('«Corrigir» aparece no «Já em dia hoje» só no cuidado de prevenção', async () => {
    assert.deepStrictEqual(r.botoes, ['teste01__tutora']);
  });
  await prova('tocar em «Corrigir»: a linha fica em correção, a ficha volta ao que era e a marca sai', async () => {
    assert.ok(!fluxo.erro, fluxo.erro);
    assert.strictEqual(fluxo.corrigindo, true);
    assert.strictEqual(fluxo.marca, 'saiu');
    assert.ok(fluxo.volta, 'a ficha não foi gravada');
    assert.strictEqual(fluxo.volta.ecto_t, '2026-10-27');
    assert.strictEqual(fluxo.volta.ecto_nome, '');
    assert.strictEqual(fluxo.espera, 'corrigindo');
  });
  await prova('«Pronto, atualizar a ficha»: a correção sai e a linha, com o nome novo, volta a gravar a ficha', async () => {
    assert.deepStrictEqual(fluxo.pronto, { corrigindo: false, nome: 'PRODUTO CERTO', eleg: true });
  });
  await prova('sem erro novo na página', async () => { assert.deepStrictEqual(erros.filter((x) => !/prevSecVirar/.test(x)), []); });

  await b.close();
  const total = ok + falhas.length;
  console.log('carrapaticida-corrigir197: ' + ok + ' de ' + total + ' provas passaram' + (falhas.length ? (', ' + falhas.length + ' falharam') : ''));
  if (falhas.length) process.exitCode = 1;
})().catch((e) => { console.error(e); process.exit(1); });
