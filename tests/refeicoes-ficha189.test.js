'use strict';
/*
 * PROVA: as três refeições do dia chegam à ficha do hóspede (Adriana, 22/nov/2026; maquete aprovada em 23/nov).
 *
 * «Se dia do Day Care, as pessoas lançam no almoço do Day Care, e café... se plantonistas, elas têm o acesso,
 * a informação chega no mesmo lugar: ficha dos hóspedes.»
 *
 * - Ficha › Alimentação ganha o bloco «Hoje» com café, almoço e jantar: estado, quem marcou, hora e onde.
 * - O almoço vem do Day Care (daycare/almoco, 2º horário incluído) ou da tela da plantonista.
 * - A lista do almoço da plantonista mostra «Já almoçou no Day Care» e conta como servido.
 * - O cartão ganha a faixa «HOJE: café … · almoço … · jantar …».
 *
 * Parte pura (refeicoes-do-dia.js) e app real no Chromium, sem rede e sem banco. Dados inventados.
 * Uso:  node tests/refeicoes-ficha189.test.js
 */
const path = require('path');
const assert = require('assert');
const { chromium } = require('playwright');

const RAIZ = path.join(__dirname, '..', 'auaulandia');
const APP = path.join(RAIZ, 'index.html');
const R = require(path.join(RAIZ, 'refeicoes-do-dia.js'));
let ok = 0; const falhas = [];
// O innerText junta blocos sem espaço: compara sem espaços.
const sq = (x) => String(x || '').replace(/\s+/g, '');
function tem(t, frag) { assert.ok(sq(t).indexOf(sq(frag)) >= 0, 'faltou «' + frag + '» em: ' + t); }
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
    const alim = { entrada: { cafe: true, almoco: true, jantar: true }, saida: { cafe: true, almoco: true, jantar: true },
      unidade: 'gramas', marca: 'Ração do Teste', obs: '',
      refs: { fixas: { cafe: { on: true, racao: '20' }, almoco: { on: true, racao: '30' }, jantar: { on: true, racao: '25' } } } };
    _cfIndexarEstadias({
      e1: { nome: 'Teste 01', tutor: 'Tutora Teste', raca: 'SRD', refKey: 'teste 01__tutora teste', status: 'ativa', entrada: mais(-2), saida: mais(2), ficha: { alim } },
      e2: { nome: 'Teste 02', tutor: 'Tutora Teste', raca: 'SRD', refKey: 'teste 02__tutora teste', status: 'ativa', entrada: mais(-2), saida: mais(2), ficha: { alim } }
    });
    hospedes = ['Teste 01', 'Teste 02'].map((n) => ({ nome: n, tutor: 'Tutora Teste', raca: 'SRD', refKey: n.toLowerCase() + '__tutora teste', ini: 'T', cor: '#234D67' }));
    renderHosp();
    // As leituras do banco, prontas e frescas (o teste não tem rede).
    const agora = Date.now(), h1 = hospedes[0], k1 = cafeKey(h1);
    cafeLeitura = { dia: hoje, geracao: 99, cafe: 'ok', turno: 'ok', promessa: null, atualizadoEm: agora };
    cafeMarcas = {}; cafeMarcas[k1] = { estado: 'metade', quem: 'Monitora Teste', hora: '08:05' };
    PL_REF.almoco.leitura = { dia: hoje, ger: 99, estado: 'ok', promessa: null, em: agora }; PL_REF.almoco.marcas = {};
    PL_REF.jantar.leitura = { dia: plRefDia('jantar'), ger: 99, estado: 'ok', promessa: null, em: agora }; PL_REF.jantar.marcas = {};
    REF_DC.dia = hoje; REF_DC.estado = 'ok'; REF_DC.em = agora; REF_DC.promessa = null; REF_DC.almoco2 = {};
    REF_DC.marcas = {}; REF_DC.marcas[dcKey('Teste 01', 'Tutora Teste')] = 'tudo';
    renderHosp();
    const txt = (el) => (el ? el.innerText.replace(/\s+/g, ' ').trim() : '');
    const cartao = (nome) => [...document.querySelectorAll('#hospGrid .pet')].find((x) => txt(x.querySelector('.nm')).indexOf(nome) === 0);
    const faixa = (nome) => { const c = cartao(nome), f = c && c.querySelector('.hb-hoje'); return f ? { t: txt(f), c: f.className } : null; };
    const ficha = (nome) => { abrirPlantao(hospedes.findIndex((h) => h.nome === nome)); const b = document.getElementById('refHojeFicha'); return { t: txt(b), pisca: [...b.querySelectorAll('.ref-pisca .q')].map(txt), on: [...b.querySelectorAll('button.on')].map(txt), acoes: [...b.querySelectorAll('button')].map((x) => x.getAttribute('onclick') || '') }; };
    const out = { faixa1: faixa('Teste 01'), faixa2: faixa('Teste 02'), ficha1: ficha('Teste 01'), ficha2: ficha('Teste 02') };
    // Lista do almoço da plantonista.
    plRefRender('almoco');
    const grid = document.getElementById(PL_REF_ID.almoco + 'Grid'), rz = document.getElementById(PL_REF_ID.almoco + 'Resumo');
    const card = (nome) => [...grid.querySelectorAll('.pet')].find((x) => txt(x.querySelector('.nm')).indexOf(nome) === 0);
    out.lista1 = txt(card('Teste 01')); out.lista1cls = (card('Teste 01') || {}).className || ''; out.lista2 = txt(card('Teste 02')); out.resumo = txt(rz); out.gridTxt = txt(grid);
    // 24/nov/2026: o relatório não pergunta mais a refeição; ao salvar, copia a marca para a pergunta escondida.
    abrirPlantao(0); relRefeicoesPreencher('card-dia');
    const linhaRel = (card, q) => [...document.querySelectorAll('#' + card + ' .obsline')].find((l) => (l.querySelector('.q') || {}).textContent === q);
    out.rel = { cafe: valDe('card-dia', 'Tomou café da manhã?'), almoco: valDe('card-dia', 'Almoçou?'),
      escondidas: ['card-dia|Tomou café da manhã?', 'card-dia|Almoçou?', 'card-inicio|Jantou?', 'card-noite|Jantou?', 'card-noite|Almoçou?'].map((x) => { const [c, q] = x.split('|'); const l = linhaRel(c, q); return l ? l.style.display : 'sem linha'; }),
      comeuEscondido: (document.querySelector('.tp-comeu') || {}).style.display };
    // A plantonista marca por cima: vale a dela, e a do Day Care continua à vista.
    abrirPlantao(0);
    PL_REF.almoco.marcas[k1] = { estado: 'metade', quem: 'Plantonista Teste', hora: '12:40' };
    plRefRender('almoco');
    out.fichaDepois = txt(document.getElementById('refHojeFicha'));
    out.faixaDepois = faixa('Teste 01');
    // Ficha de outro dia não ganha o bloco de hoje.
    const sd = selectedDate; selectedDate = new Date(Date.now() - 3 * 86400000); out.outroDia = refHojeFichaHTML(h1); selectedDate = sd;
    return out;
  }, turno);
  await p.close();
  return { r, erros: erros.filter((x) => !/prevSecVirar/.test(x)) };
}

(async () => {
  console.log('Parte pura');
  await prova('a marca da plantonista vale sobre a do Day Care, sem apagar a do Day Care', () => {
    const r = R.juntar({ almocoPlantao: { estado: 'metade', quem: 'P', hora: '12:40' }, almocoDayCare: 'tudo' });
    assert.deepStrictEqual([r.almoco.estado, r.almoco.onde, r.almoco.tambemDayCare], ['metade', 'plantao', 'tudo']);
  });
  await prova('só Day Care: o almoço vem de lá, sem quem e sem hora (o Day Care não grava)', () => {
    const r = R.juntar({ almocoDayCare: 'tudo' });
    assert.deepStrictEqual([r.almoco.estado, r.almoco.onde, R.onde(r.almoco)], ['tudo', 'daycare', 'no Day Care']);
  });
  await prova('não comeu no 1º horário e comeu no 2º: conta como comeu', () => {
    const r = R.juntar({ almocoDayCare: 'nao', almoco2DayCare: 'comeu' });
    assert.deepStrictEqual([r.almoco.estado, r.almoco.segundo], ['tudo', true]);
  });
  await prova('marca estranha não vira refeição', () => {
    const r = R.juntar({ cafe: 'xpto', almocoDayCare: { estado: 'qualquer' }, jantar: null });
    assert.deepStrictEqual([r.cafe, r.almoco, r.jantar], [null, null, null]);
  });
  await prova('faixa: de dia o jantar que falta não fica vermelho; à noite fica', () => {
    const r = R.juntar({ cafe: { estado: 'tudo' }, almocoDayCare: 'tudo' });
    assert.deepStrictEqual(R.faixa(r, 'diurno'), { texto: 'HOJE: café ok · almoço ok · jantar falta', classe: '' });
    assert.strictEqual(R.faixa(r, 'noturno').classe, 'falta');
    assert.strictEqual(R.faixa(R.juntar({ cafe: { estado: 'tudo' }, almocoDayCare: 'tudo', jantar: { estado: 'metade' } }), 'noturno').classe, 'ok');
    assert.strictEqual(R.faixa(R.juntar({ cafe: { estado: 'nao' }, almocoDayCare: 'tudo' }), 'diurno').classe, 'falta');
  });

  const b = await chromium.launch();
  const dia = await montar(b, 'diurno');
  const noite = await montar(b, 'noturno');
  await b.close();

  console.log('App, de dia');
  // 24/nov/2026: a ficha mostra só as refeições do plantão da hora e é ali que se marca (um lugar só).
  await prova('de dia a ficha mostra café e almoço (sem o jantar), com quem marcou, e marca ali mesmo', () => {
    const t = dia.r.ficha1.t;
    assert.ok(/^Plantão do dia · 7h às 18h50/.test(t), t);
    tem(t, 'Café da manhã Marcado por Monitora Teste às 08:05.');
    tem(t, 'Almoço Marcado pela monitora no Day Care Comeu');
    assert.ok(!/Jantar/.test(t), 'o jantar não aparece de dia: ' + t);
    assert.deepStrictEqual(dia.r.ficha1.on, ['Metade'], 'o botão marcado é o do café');
    assert.ok(dia.r.ficha2.acoes.some((a) => a === "fichaRefMarcar('cafe','tudo')") && dia.r.ficha2.acoes.some((a) => a === "fichaRefMarcar('almoco','nao')"), dia.r.ficha2.acoes.join(' | '));
  });
  await prova('de dia piscam café e almoço que faltam (Teste 02, nada marcado)', () => {
    assert.deepStrictEqual(dia.r.ficha2.pisca.map(sq), ['CafédamanhãAGORA', 'AlmoçoAGORA']);
    assert.deepStrictEqual(dia.r.ficha1.pisca, []);
  });
  await prova('o cartão ganha a faixa HOJE', () => {
    assert.strictEqual(dia.r.faixa1.t, 'HOJE: café metade · almoço ok · jantar falta');
    assert.ok(!/falta/.test(dia.r.faixa1.c.replace('hb-hoje', '')), dia.r.faixa1.c);
    assert.ok(/ falta$/.test(dia.r.faixa2.c), dia.r.faixa2.c);
  });
  await prova('a lista da plantonista mostra «Já almoçou no Day Care» e conta como servido', () => {
    tem(dia.r.lista1, 'Já almoçou no Day Care Comeu');
    assert.ok(/\btudo\b/.test(dia.r.lista1cls), dia.r.lista1cls);
    assert.ok(!/Já almoçou/.test(dia.r.lista2), dia.r.lista2);
    assert.ok(/^1servidos1faltam/.test(sq(dia.r.resumo)), dia.r.resumo);
    assert.ok(/Quem já almoçou no Day Care aparece aqui já marcado/.test(dia.r.gridTxt));
  });
  await prova('marca da plantonista por cima do Day Care: a ficha muda na hora', () => {
    tem(dia.r.fichaDepois, 'Almoço Marcado por Plantonista Teste às 12:40.');
    assert.strictEqual(dia.r.faixaDepois.t, 'HOJE: café metade · almoço metade · jantar falta');
  });
  await prova('os relatórios não perguntam a refeição; ao salvar copiam a marca da ficha (café metade, almoço do Day Care)', () => {
    assert.deepStrictEqual(dia.r.rel.escondidas, ['none', 'none', 'none', 'none', 'none']);
    assert.strictEqual(dia.r.rel.comeuEscondido, 'none', '«Como comeu?» saiu da ficha');
    assert.deepStrictEqual([dia.r.rel.cafe, dia.r.rel.almoco], ['Metade', 'Sim']);
  });
  await prova('ficha de outro dia não mostra o bloco de hoje', () => { assert.strictEqual(dia.r.outroDia, ''); });
  await prova('nenhum erro de página', () => { assert.deepStrictEqual(dia.erros, []); });

  console.log('App, à noite');
  await prova('à noite pisca o jantar e o cartão fica vermelho enquanto ele falta', () => {
    assert.deepStrictEqual(noite.r.ficha1.pisca.map((x) => sq(x.replace(/\(noite de [^)]*\)/, ''))), ['JantarAGORA']);
    assert.ok(/^Plantão da noite · 18h50 às 7h/.test(noite.r.ficha1.t) && !/Café da manhã|Almoço/.test(noite.r.ficha1.t.replace(/O café e o almoço aparecem às 7h\./, '')), noite.r.ficha1.t);
    assert.ok(/ falta$/.test(noite.r.faixa1.c), noite.r.faixa1.c);
  });
  await prova('nenhum erro de página', () => { assert.deepStrictEqual(noite.erros, []); });

  console.log('\n' + ok + ' provas passaram' + (falhas.length ? ', ' + falhas.length + ' falharam' : ''));
  process.exit(falhas.length ? 1 : 0);
})();
