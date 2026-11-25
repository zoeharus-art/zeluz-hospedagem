'use strict';
/*
 * PROVA: o carrapaticida diz ONDE vai ser passado — no Day Care ou depois do banho (Adriana, 25/nov/2026).
 *
 * «Quando o carrapaticida será depois do banho, não deixa ser marcado. Precisa ter escrito se vai passar no
 *  Day Care ou depois do banho.»
 *
 * O «Vai passar depois do banho» morava na mesma pergunta da origem (bolsa ou loja), que trava depois do Snoopy.
 * Agora o carrapaticida tem a pergunta própria «Onde vai passar?»:
 *   1. no Lançamento do dia ela é obrigatória e vai escrita na linha («· DEPOIS DO BANHO»);
 *   2. a observação do carrapaticida não oferece mais o banho; a do vermífugo continua igual;
 *   3. a linha do cuidado autorizado pelo tutor mostra o lugar escolhido;
 *   4. o cartão da resposta do tutor pergunta «Onde vai passar?» e cobra a resposta;
 *   5. o Snoopy não pede nova confirmação quando só o lugar muda.
 * App real no Chromium, sem rede. Dados inventados.
 * Uso:  node tests/carrapaticida-onde-passa196.test.js
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
    const ecto = dashItem('carrapaticida'), verm = dashItem('vermifugo');
    out.camposEcto = ecto.campos.map((c) => c.c);
    const passa = ecto.campos.filter((c) => c.c === 'passa')[0] || null;
    out.passa = passa && { rot: passa.rot, obrig: !!passa.obrig, ops: (passa.ops || []).map((o) => o.v + '=' + o.t) };
    out.ondeEcto = (ecto.campos.filter((c) => c.c === 'onde')[0].ops || []).map((o) => o.v);
    out.ondeVerm = (verm.campos.filter((c) => c.c === 'onde')[0].ops || []).map((o) => o.v);
    // o lançamento à mão: falta a pergunta até escolher; escolhida, vai escrita
    DASH_SEL.carrapaticida = 'Teste 01/SRD';
    DASH_DET.carrapaticida = { prod: 'BRAVECTO · 90 DIAS', qtd: '1 COMPRIMIDO', onde: 'LOJA' };
    out.faltaAntes = tenta(() => dashDetFalta('carrapaticida'));
    DASH_DET.carrapaticida.passa = 'DEPOIS DO BANHO';
    out.faltaDepois = tenta(() => dashDetFalta('carrapaticida'));
    out.texto = tenta(() => dashDetTexto('carrapaticida'));
    // a linha do cuidado autorizado pelo tutor
    const l57 = { valor: 'Teste 01/SRD (CONFERIR ORIENTAÇÃO)', det: { cuidado57_estado: 'conferir-orientacao', prod: 'PIPETA · 30 DIAS', nome: 'PRODUTO TESTE', qtd: 'PIPETA', passa: 'DEPOIS DO BANHO' },
      origemVencimento: { protocolo: 'cuidado57', origemResposta: 'loja' } };
    out.celula = tenta(() => dashCelulaComDose(l57));
    // o Snoopy: mudar só o lugar não muda a cobrança
    const S = window.ZeluzSnoopyConfirmacao;
    const semLugar = JSON.parse(JSON.stringify(l57)); delete semLugar.det.passa;
    out.snoopyIgual = !!(S && S.assinatura(l57) === S.assinatura(semLugar));
    const outraDose = JSON.parse(JSON.stringify(l57)); outraDose.det.qtd = 'MEIA PIPETA';
    out.snoopyQtd = !!(S && S.assinatura(l57) === S.assinatura(outraDose));
    // o cartão da resposta do tutor
    const T = window.ZelozinhaTela94;
    out.camposCartao = T ? T.camposDoCuidado('ecto_p') : null;
    out.faltaCartao = T ? T.faltaEscolher('ecto_p', { prod: 'BRAVECTO · 90 DIAS', qtd: '1 COMPRIMIDO' }, '') : null;
    out.podeDepoisSnoopy = T ? T.podeEscolher({ campo: 'passa', tarefaEstado: 'criada', snoopyConfirmado: true }).ok : null;
    out.origemTravada = T ? T.podeEscolher({ campo: 'onde', tarefaEstado: 'criada', snoopyConfirmado: true }).ok : null;
    return out;
  });

  console.log('Carrapaticida: onde vai passar');
  await prova('o Lançamento do dia pergunta «Onde vai passar?», obrigatória: No Day Care ou Depois do banho', async () => {
    assert.deepStrictEqual(r.passa, { rot: 'Onde vai passar?', obrig: true, ops: ['NO DAY CARE=No Day Care', 'DEPOIS DO BANHO=Depois do banho'] });
    assert.deepStrictEqual(r.camposEcto, ['prod', 'nome', 'qtd', 'onde', 'passa']);
  });
  await prova('a observação do carrapaticida não oferece mais o banho; a do vermífugo continua igual', async () => {
    assert.deepStrictEqual(r.ondeEcto, ['NA BOLSA', 'LOJA', '']);
    assert.deepStrictEqual(r.ondeVerm, ['NA BOLSA', 'LOJA', 'BANHO', '']);
  });
  await prova('sem a resposta, o botão diz o que falta; respondida, a linha vai com «DEPOIS DO BANHO» escrito', async () => {
    assert.strictEqual(r.faltaAntes, 'Onde vai passar?');
    assert.strictEqual(r.faltaDepois, '');
    assert.strictEqual(r.texto, ' (BRAVECTO · 90 DIAS · 1 COMPRIMIDO · LOJA · DEPOIS DO BANHO)');
  });
  await prova('a linha do cuidado autorizado pelo tutor mostra o lugar', async () => {
    assert.strictEqual(r.celula, 'Teste 01/SRD (PIPETA · 30 DIAS · PRODUTO TESTE · PIPETA · LOJA · DEPOIS DO BANHO)');
  });
  await prova('o cartão da resposta do tutor pergunta o lugar e cobra a resposta; ela muda mesmo depois do Snoopy', async () => {
    assert.deepStrictEqual(Array.from(r.camposCartao || []), ['prod', 'nome', 'qtd', 'onde', 'passa']);
    assert.deepStrictEqual(Array.from(r.faltaCartao || []), ['passa']);
    assert.strictEqual(r.podeDepoisSnoopy, true);
    assert.strictEqual(r.origemTravada, false, 'a origem (bolsa ou loja) continua travada pelo Snoopy');
  });
  await prova('o Snoopy não pede nova confirmação quando só o lugar muda (a dose continua pedindo)', async () => {
    assert.strictEqual(r.snoopyIgual, true);
    assert.strictEqual(r.snoopyQtd, false);
  });
  await prova('sem erro novo na página', async () => { assert.deepStrictEqual(erros.filter((x) => !/prevSecVirar/.test(x)), []); });

  await b.close();
  const total = ok + falhas.length;
  console.log('carrapaticida-onde-passa196: ' + ok + ' de ' + total + ' provas passaram' + (falhas.length ? (', ' + falhas.length + ' falharam') : ''));
  if (falhas.length) process.exitCode = 1;
})().catch((e) => { console.error(e); process.exit(1); });
