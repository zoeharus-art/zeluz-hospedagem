'use strict';
/*
 * PROVA: o almoço aparece dentro do cartão e da ficha do peludinho no plantão diurno (Adriana, 22/nov/2026).
 *
 * «Dentro da área do peludinho, da ficha dele. A plantonista tem a área dela, e deve continuar a ter.»
 *
 * No plantão diurno (domingo, feriado e recesso) o cartão do hóspede ganha a faixa «ALMOÇO: …» e o
 * tópico Alimentação da ficha mostra o café e o almoço do check-in. À noite, tudo continua com o jantar.
 * A fonte é a mesma das listas do plantão (estadia ativa + ZeluzCafeOperacional). Sem check-in, a tela
 * diz que falta e não inventa quantidade. A área da plantonista (Café, Almoço e Jantar) não muda.
 *
 * App real no Chromium, sem rede e sem banco. Todo dado é inventado («Teste 01», «Tutora Teste»).
 * Uso:  node tests/almoco-ficha188.test.js
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

async function montar(b, turno) {
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const erros = []; p.on('pageerror', (e) => erros.push(String(e.message || e)));
  await p.route(/^https?:/, (r) => r.abort());
  await p.goto('file:///' + APP.replace(/\\/g, '/'));
  await p.waitForTimeout(700);
  const r = await p.evaluate((turno) => {
    const u = { role: 'plantonista', nome: 'Plantonista Teste' };
    sessionStorage.setItem('zeluz_login', JSON.stringify(u)); aplicarLogin(u);
    ZeluzPlantaoTurno.turno = function () { return turno; };
    const hoje = cafeDataKey(), mais = (n) => orcMaisDias(hoje, n);
    const alim = (almoco) => ({ entrada: { cafe: true, almoco: true, jantar: true }, saida: { cafe: true, almoco: true, jantar: true },
      unidade: 'gramas', marca: 'Ração do Teste', obs: 'Misturar com água morna',
      refs: { fixas: { cafe: { on: true, racao: '20' }, almoco: almoco, jantar: { on: true, racao: '25' } } } });
    _cfIndexarEstadias({
      e1: { nome: 'Teste 01', tutor: 'Tutora Teste', raca: 'SRD', refKey: 'teste 01__tutora teste', status: 'ativa', entrada: mais(-2), saida: mais(2), ficha: { alim: alim({ on: true, racao: '30', natural: '40', extra: 'Probiótico' }) } },
      e2: { nome: 'Teste 02', tutor: 'Tutora Teste', raca: 'SRD', refKey: 'teste 02__tutora teste', status: 'ativa', entrada: mais(-2), saida: mais(2), ficha: { alim: alim({ on: false }) } },
      e3: { nome: 'Teste 03', tutor: 'Tutora Teste', raca: 'SRD', refKey: 'teste 03__tutora teste', status: 'ativa', entrada: mais(-2), saida: mais(2), ficha: { alim: alim({ on: true }) } }
    });
    hospedes = ['Teste 01', 'Teste 02', 'Teste 03', 'Teste 04'].map((n) => ({ nome: n, tutor: 'Tutora Teste', raca: 'SRD', refKey: n.toLowerCase() + '__tutora teste', ini: 'T', cor: '#234D67' }));
    // A moradora (sem estadia): a comida vem do cadastro de almoço do Day Care.
    almCadCache = { 'moradora teste__casa teste': { alim: 'Ração', quant: '50g', lento: true, nao: false } };
    hospedes.push({ nome: 'Moradora Teste', tutor: '', raca: 'SRD', ini: 'M', cor: '#5AABB5', mascote: true });
    renderHosp();
    PL_REF.almoco.leitura = { dia: cafeDataKey(), ger: 99, estado: 'ok', promessa: null, em: Date.now() };
    const listaAlmoco = plRefParticipantes('almoco').participantes.map((o) => o.hospede.nome);
    const listaCafe = cafeParticipantesAtivos().participantes.map((o) => o.hospede.nome);
    const faixaMoradora = (() => { const c = [...document.querySelectorAll('#hospGrid .pet')].find((x) => /Moradora Teste/.test(x.innerText)); const f = c && c.querySelector('.hb-almoco'); return f && getComputedStyle(f).display !== 'none' ? f.innerText.replace(/\s+/g, ' ').trim() : ''; })();
    const faixa = (nome) => {
      const c = [...document.querySelectorAll('#hospGrid .pet')].find((x) => ((x.querySelector('.nm') || {}).innerText || '').indexOf(nome) === 0);
      const f = c && c.querySelector('.hb-almoco');
      return f && getComputedStyle(f).display !== 'none' ? f.innerText.replace(/\s+/g, ' ').trim() : '';
    };
    const ficha = (nome) => { abrirPlantao(hospedes.findIndex((h) => h.nome === nome)); return document.getElementById('hf-alim-info').innerText.replace(/\s+/g, ' ').trim(); };
    const vis = (id) => getComputedStyle(document.getElementById(id)).display !== 'none';
    return {
      turnoBody: document.body.dataset.plantaoTurno,
      faixas: ['Teste 01', 'Teste 02', 'Teste 03', 'Teste 04'].map(faixa),
      fichas: ['Teste 01', 'Teste 02', 'Teste 03', 'Teste 04'].map(ficha),
      area: { cafe: vis('prevSec_plantao-cafe'), almoco: vis('prevSec_plantao-almoco'), jantar: vis('prevSec_plantao-jantar') },
      listaAlmoco, listaCafe, faixaMoradora
    };
  }, turno);
  await p.close();
  return { r, erros: erros.filter((x) => !/prevSecVirar/.test(x)) };
}

(async () => {
  const b = await chromium.launch();
  const dia = await montar(b, 'diurno');
  const noite = await montar(b, 'noturno');
  await b.close();

  console.log('Plantão diurno');
  await prova('o cartão mostra o almoço do check-in, com quantidade e marca', () => {
    assert.strictEqual(dia.r.faixas[0], 'ALMOÇO: 30 g de ração + 40 g de comida natural + Probiótico Ração do Teste');
  });
  await prova('quem não almoça pelo check-in aparece como «NÃO ALMOÇA HOJE»', () => {
    assert.ok(/^NÃO ALMOÇA HOJE/.test(dia.r.faixas[1]), dia.r.faixas[1]);
  });
  await prova('almoço ligado sem quantidade fica «a conferir», sem inventar número', () => {
    assert.ok(/^ALMOÇO A CONFERIR/.test(dia.r.faixas[2]), dia.r.faixas[2]);
    assert.ok(!/\d/.test(dia.r.faixas[2]), dia.r.faixas[2]);
  });
  await prova('sem check-in de hospedagem: «ALMOÇO A CONFIRMAR»', () => {
    assert.ok(/^ALMOÇO A CONFIRMAR/.test(dia.r.faixas[3]), dia.r.faixas[3]);
  });
  await prova('a ficha mostra o café e o almoço de hoje', () => {
    const f = dia.r.fichas[0];
    assert.ok(f.indexOf('Café da manhã de Teste 01: 20 g de ração') >= 0, f);
    assert.ok(f.indexOf('Almoço de Teste 01: 30 g de ração + 40 g de comida natural + Probiótico') >= 0, f);
    assert.ok(f.indexOf('Misturar com água morna') >= 0, f);
    assert.ok(f.indexOf('Jantar') < 0, f);
  });
  await prova('a ficha sem check-in avisa que falta e manda falar com a recepção', () => {
    assert.ok(/Almoço de Teste 04: não há check-in de hospedagem hoje/.test(dia.r.fichas[3]), dia.r.fichas[3]);
  });
  await prova('a área da plantonista continua: Café e Almoço à vista, Jantar escondido', () => {
    assert.deepStrictEqual(dia.r.area, { cafe: true, almoco: true, jantar: false });
  });
  await prova('a moradora também conta: entra no almoço e no café, com a comida do cadastro', () => {
    assert.ok(dia.r.listaAlmoco.indexOf('Moradora Teste') >= 0, dia.r.listaAlmoco.join(', '));
    assert.ok(dia.r.listaCafe.indexOf('Moradora Teste') >= 0, dia.r.listaCafe.join(', '));
    assert.strictEqual(dia.r.faixaMoradora, 'ALMOÇO: 50g de Ração + Comedouro LENTO');
  });
  await prova('nenhum erro de página', () => assert.deepStrictEqual(dia.erros, []));

  console.log('Plantão noturno');
  await prova('à noite o cartão não mostra a faixa do almoço', () => {
    assert.deepStrictEqual(noite.r.faixas, ['', '', '', '']);
  });
  await prova('à noite a ficha continua com o jantar, como antes', () => {
    const f = noite.r.fichas[0];
    assert.ok(/Jantar de Teste 01: 25/.test(f), f);
    assert.ok(f.indexOf('Almoço de') < 0, f);
  });
  await prova('a área da plantonista à noite: só o Jantar', () => {
    assert.deepStrictEqual(noite.r.area, { cafe: false, almoco: false, jantar: true });
  });
  await prova('nenhum erro de página', () => assert.deepStrictEqual(noite.erros, []));

  console.log('\n' + ok + ' provas passaram' + (falhas.length ? (', ' + falhas.length + ' falharam') : ''));
  process.exit(falhas.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
