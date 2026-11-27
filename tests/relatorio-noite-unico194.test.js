'use strict';
/*
 * PROVA: um relatório só para o plantão da noite (Adriana, 24/nov/2026).
 *
 * «Não tem início e fim como no Day Care. Não precisa. Precisamos dos dados. Como foi o plantão, ele comeu ou
 *  não comeu no jantar? [...] Pela manhã ela faz o relatório de como foi a noite, cocô, xixi, comportamento e
 *  passa o plantão.»
 *
 * O Relatório do Jantar saiu da ficha (só aparece, para leitura, no dia que já tem o antigo salvo). O Relatório
 * da Noite cobre das 18h50 às 7h e é fechado de manhã: a ficha do dia D é a noite de D-1 para D, e o jantar e o
 * almoço que ele mostra e grava são os marcados na ficha no dia D-1. «Onde está a comida dele?» passou para a Noite.
 * App real no Chromium, sem rede; o banco é de mentira e só responde as leituras desta prova. Dados inventados.
 * Uso:  node tests/relatorio-noite-unico194.test.js
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
  const r = await p.evaluate(async () => {
    const u = { role: 'plantonista', nome: 'Plantonista Teste' };
    sessionStorage.setItem('zeluz_login', JSON.stringify(u)); aplicarLogin(u);
    selectedDate = new Date(2026, 10, 24, 8, 30);
    hospedes = [{ nome: 'Teste 01', tutor: 'Tutora Teste', raca: 'SRD', refKey: 'teste 01__tutora teste', ini: 'T', cor: '#234D67' }];
    renderHosp(); abrirPlantao(0);
    const h = currentHosp, ck = cafeKey(h), dk = refDcChaves(h)[0];
    const txt = (el) => (el ? el.innerText.replace(/\s+/g, ' ').trim() : '');
    // Banco de mentira: só leitura, por caminho.
    function bancoFalso(dados, falhar) {
      const val = (c) => c.split('/').reduce((o, k) => (o && o[k] !== undefined ? o[k] : null), dados);
      const ref = (c) => { const x = { once: () => (falhar && falhar.test(c) ? Promise.reject(new Error('sem rede')) : Promise.resolve({ val: () => val(c), exists: () => val(c) != null, forEach() {} })),
        on() { return () => {}; }, off() {}, child: (k) => ref(c + '/' + k), orderByKey: () => x, orderByChild: () => x, startAt: () => x, endAt: () => x, equalTo: () => x, limitToLast: () => x, limitToFirst: () => x }; return x; };
      return { ref };
    }
    const base = () => ({ auaulandia: { jantar: { '2026-11-23': { [ck]: { estado: 'nao', quem: 'Plantonista Teste', hora: '19:10' } }, '2026-11-24': { [ck]: { estado: 'tudo', quem: 'Outra', hora: '19:00' } } } },
      daycare: { almoco: { '2026-11-23': { [dk]: 'tudo' } } } });
    const out = {};
    out.inicioEscondido = document.getElementById('card-inicio').style.display;
    out.tag = txt(document.querySelector('#card-noite .rel-tag'));
    out.perguntasNoite = [...document.querySelectorAll('#card-noite .obsline:not(.rel-ref) .q')].map(txt);
    // 1) Jantar e almoço marcados na véspera.
    const db0 = DB;
    DB = bancoFalso(base()); await relNoiteRefCarregar();
    out.resumo = txt(document.getElementById('noite-ref-resumo'));
    relRefeicoesPreencher('card-noite');
    out.jantou = valDe('card-noite', 'Jantou?'); out.almocou = valDe('card-noite', 'Almoçou?');
    // 2) Sem marca na véspera.
    DB = bancoFalso({}); await relNoiteRefCarregar();
    out.resumoSem = txt(document.getElementById('noite-ref-resumo'));
    // 3) Leitura falhou.
    DB = bancoFalso(base(), /jantar/); await relNoiteRefCarregar();
    out.resumoFalha = txt(document.getElementById('noite-ref-resumo'));
    // 4) Dia antigo, com o Relatório do Jantar salvo: o cartão aparece para leitura.
    const antigo = base(); antigo.auaulandia.relatorios = { [fichaKey()]: { inicio: { passou: 'Plantonista Antiga', byQ: {} } } };
    DB = bancoFalso(antigo); carregarFicha(); await new Promise((ok) => setTimeout(ok, 300));
    out.inicioAntigo = document.getElementById('card-inicio').style.display;
    out.topicoNoite = txt(document.querySelector('#card-noite .tp-sub')) || txt(document.querySelector('#card-noite'));
    DB = db0;
    // 5) A Gestão recebe «Onde está a comida» no resumo da Noite.
    out.linhas = plantLinhas('noite', { byQ: { 'Onde está a comida dele?': 'Geladeira', 'Jantou?': 'Não' } });
    return out;
  });
  await b.close();

  console.log('Relatório da Noite, um só por plantão');
  await prova('o Relatório do Jantar não aparece num dia novo', () => assert.strictEqual(r.inicioEscondido, 'none'));
  await prova('o Relatório da Noite cobre das 18h50 às 7h', () => assert.strictEqual(r.tag, 'Plantonista · 18h50 às 7h'));
  await prova('«Onde está a comida dele?» passou para a Noite; a Noite não pergunta o jantar', () => {
    assert.ok(r.perguntasNoite.indexOf('Onde está a comida dele?') >= 0, r.perguntasNoite.join(' | '));
    assert.ok(r.perguntasNoite.indexOf('Jantou?') < 0 && r.perguntasNoite.indexOf('Almoçou?') < 0, r.perguntasNoite.join(' | '));
  });
  await prova('o relatório mostra a noite certa e o jantar marcado na ficha na véspera, com quem e a hora', () => {
    assert.ok(r.resumo.indexOf('Noite de 23/11 para 24/11') >= 0, r.resumo);
    assert.ok(r.resumo.indexOf('Jantar: Não comeu · marcado por Plantonista Teste às 19:10') >= 0, r.resumo);
    assert.ok(r.resumo.indexOf('Almoço: Comeu') >= 0, r.resumo);
  });
  await prova('ao salvar, grava o jantar e o almoço da véspera (não os de hoje)', () => {
    assert.strictEqual(r.jantou, 'Não'); assert.strictEqual(r.almocou, 'Sim');
  });
  await prova('sem marca na véspera, avisa que o jantar não foi marcado', () => {
    assert.ok(r.resumoSem.indexOf('Jantar: não foi marcado na ficha') >= 0, r.resumoSem);
  });
  await prova('se a leitura falha, diz que não deu para ler (não afirma que não jantou)', () => {
    assert.ok(/Não deu para ler o jantar/.test(r.resumoFalha), r.resumoFalha);
  });
  await prova('dia antigo com o Relatório do Jantar salvo: o cartão aparece para leitura', () => assert.strictEqual(r.inicioAntigo, ''));
  await prova('o tópico da Noite diz para fechar de manhã, do jantar até as 7h', () => {
    assert.ok(/fechar de manhã, antes de passar o plantão: do jantar até as 7h/i.test(r.topicoNoite), r.topicoNoite);
  });
  await prova('a Gestão recebe «Onde está a comida» no resumo da Noite', () => {
    assert.ok(r.linhas.indexOf('Onde está a comida: Geladeira') >= 0, r.linhas.join(' | '));
  });
  await prova('nenhum erro de página', () => { assert.deepStrictEqual(erros.filter((x) => !/prevSecVirar/.test(x)), []); });

  console.log('\n' + ok + ' provas passaram' + (falhas.length ? ', ' + falhas.length + ' falharam' : ''));
  process.exit(falhas.length ? 1 : 0);
})();
