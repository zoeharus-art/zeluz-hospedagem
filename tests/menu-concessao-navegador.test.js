'use strict';
/*
 * PROVA NO NAVEGADOR — a tela liberada no Time aparece no menu, abre e vale na hora.
 * Story 6.19 (Adriana, 30/set/2026): "Preciso dar acesso à veterinária a Hoje na Zêluz,
 * Quem chamar hoje, Lançamentos do dia... Aparece, eu já dei, mas não deu."
 *
 * POR QUE NO NAVEGADOR
 * O defeito era de TELA: o item aparecia dentro de uma gaveta sem cabeçalho, os dias dos
 * Vencimentos nem apareciam, e a tela aberta respondia "Esta tela é da Central Zêluz".
 * A caixa de areia da Fase 0 prova a CONTA; só o navegador mede o que a pessoa enxerga
 * (CSS do papel, gaveta aberta ou fechada, cabeçalho escondido).
 *
 * O QUE ELE NUNCA FAZ: FALAR COM O BANCO
 * Todo pedido http(s) é abortado antes de sair — o app abre SEM Firebase. Nenhum dado de
 * cliente entra aqui: as pessoas são inventadas e o menu é o do próprio arquivo.
 *
 * COMO RODAR
 *   node tests/menu-concessao-navegador.test.js
 *   (precisa do Playwright; no Windows: NODE_PATH=C:/Users/zeluz/projetos-aios/code/node_modules)
 * Sem o Playwright instalado, diz PULADO e sai 0 — e diz por quê.
 */

const path = require('path');
let chromium;
try { ({ chromium } = require('playwright')); }
catch (e) {
  try { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
  catch (e2) { console.log('PULADO: o Playwright não está instalado nesta máquina (npm i -g playwright).'); process.exit(0); }
}

const APP = path.join(__dirname, '..', 'auaulandia', 'index.html');
let ok = 0; const falhas = [];
function prova(nome, cond, detalhe) {
  if (cond) { ok++; console.log('  ✓ ' + nome); }
  else { falhas.push(nome); console.log('  ✗ ' + nome + (detalhe ? '\n      ' + detalhe : '')); }
}

// O que a pessoa ALCANÇA: o item está à mostra e cada gaveta acima dele está aberta ou tem
// um cabeçalho à mostra para ela abrir.
const MEDIR = `(() => {
  const vis = (el) => getComputedStyle(el).display !== 'none';
  const alcanca = (a) => {
    if (!vis(a)) return false;
    for (let el = a.parentElement; el && el.id !== 'nav'; el = el.parentElement) {
      if (!vis(el) && !el.classList.contains('acc-panel')) return false;
      if (el.classList.contains('acc')) {
        const hd = el.querySelector(':scope > .nav-parent, :scope > .grp');
        if (!el.classList.contains('acc-open') && !(hd && vis(hd))) return false;
      }
    }
    return true;
  };
  return {
    itens: [...document.querySelectorAll('#nav a[data-v]')].filter(alcanca).map((a) => a.dataset.v),
    dias: [...document.querySelectorAll('#navVencDias a')].filter(alcanca).length,
    cab: [...document.querySelectorAll('#nav .grp')].filter(vis).map((g) => (g.closest('.acc') || { dataset: {} }).dataset.acc),
  };
})()`;

async function abrirApp(b) {
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  p.__erros = [];
  p.on('pageerror', (e) => p.__erros.push(String(e.message || e).slice(0, 160)));
  await p.route(/^https?:/, (r) => r.abort());
  await p.goto('file://' + APP);
  await p.waitForTimeout(500);
  return p;
}
async function entrar(p, u) {
  await p.evaluate((u) => { sessionStorage.setItem('zeluz_login', JSON.stringify(u)); aplicarLogin(u); }, u);
  await p.waitForTimeout(350);
  return p.evaluate(MEDIR);
}
async function abrirTela(p, v) {
  await p.evaluate((v) => { const a = document.querySelector('#nav a[data-v="' + v + '"]'); _navegarMenu(a, v); }, v);
  await p.waitForTimeout(350);
  return p.evaluate((v) => (document.getElementById('v-' + v).innerText || '').replace(/\s+/g, ' ').trim(), v);
}
const barrada = (t) => /Esta tela é da/.test(t);

(async () => {
  let b;
  try { b = await chromium.launch(); }
  catch (e) { b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' }); }
  try {
    console.log('A veterinária com as telas da Central liberadas no Time:');
    let p = await abrirApp(b);
    const vet = { role: 'vet', nome: 'Vet Teste', monId: 'p1',
      paginas: ['cuidadovet', 'hoje', 'contatos', 'dashdc', 'pendencias', 'vencimentos', 'vacinas'] };
    let r = await entrar(p, vet);
    ['hoje', 'contatos', 'dashdc', 'pendencias', 'vencimentos', 'vacinas', 'cuidadovet', 'peso'].forEach((k) =>
      prova('alcança ' + k + ' no menu', r.itens.indexOf(k) >= 0, r.itens.join(' ')));
    prova('o cabeçalho "Day Care" da Central Zêluz aparece (a gaveta tem nome)', r.cab.indexOf('c-daycare') >= 0, r.cab.join(' '));
    prova('os 6 dias dos Vencimentos (Hoje a Sexta) aparecem', r.dias === 6, 'dias: ' + r.dias);
    for (const v of ['hoje', 'contatos', 'dashdc', 'pendencias', 'vencimentos', 'vacinas']) {
      const t = await abrirTela(p, v);
      prova('a tela ' + v + ' abre (não responde "Esta tela é da Central Zêluz")', !barrada(t) && t.length > 40, t.slice(0, 120));
    }
    prova('nenhum erro de JavaScript', p.__erros.length === 0, p.__erros.join(' | '));
    await p.close();

    console.log('\nVale na hora — a Gestão libera e depois tira, sem a veterinária sair:');
    p = await abrirApp(b);
    r = await entrar(p, { role: 'vet', nome: 'Vet Teste', monId: 'p1', paginas: ['cuidadovet'] });
    prova('antes: sem Hoje na Zêluz e sem o cabeçalho Day Care', r.itens.indexOf('hoje') < 0 && r.cab.indexOf('c-daycare') < 0, JSON.stringify(r));
    await p.evaluate(() => { MONITORES = [{ id: 'p1', nome: 'Vet Teste', role: 'vet', paginas: ['cuidadovet', 'hoje'] }]; permReaplicarDoTime(); });
    await p.waitForTimeout(200);
    r = await p.evaluate(MEDIR);
    prova('liberou: Hoje na Zêluz aparece, com o cabeçalho', r.itens.indexOf('hoje') >= 0 && r.cab.indexOf('c-daycare') >= 0, JSON.stringify(r));
    prova('liberou: a tela abre', !barrada(await abrirTela(p, 'hoje')));
    await p.evaluate(() => { MONITORES = [{ id: 'p1', nome: 'Vet Teste', role: 'vet', paginas: ['cuidadovet'] }]; permReaplicarDoTime(); });
    await p.waitForTimeout(200);
    r = await p.evaluate(MEDIR);
    prova('tirou: o item some do menu', r.itens.indexOf('hoje') < 0 && r.cab.indexOf('c-daycare') < 0, JSON.stringify(r));
    prova('tirou: a tela volta a explicar o porquê', barrada(await abrirTela(p, 'hoje')));
    await p.close();

    console.log('\nQuem não recebeu nada no Time vê a barra de sempre:');
    p = await abrirApp(b);
    r = await entrar(p, { role: 'vet', nome: 'Vet Teste', monId: 'p1', paginas: ['cuidadovet'] });
    prova('veterinária só com Cuidado Vet: Cuidado Vet, Peso e Sair — e só os 3 cabeçalhos do caminho dela',
      JSON.stringify(r.itens) === JSON.stringify(['cuidadovet', 'peso', 'sair'])
      && JSON.stringify(r.cab) === JSON.stringify(['central', 'c-peludinhos', 'c-auaulandia']), JSON.stringify(r));
    await p.close();
    p = await abrirApp(b);
    r = await entrar(p, { role: 'plantonista', nome: 'Plantão', monId: 'p3', paginas: ['hospedagem'] });
    prova('plantonista com o Plantão da noite: nenhum cabeçalho novo', r.cab.length === 0 && r.itens.indexOf('hospedagem') >= 0, JSON.stringify(r));
    await p.close();
    p = await abrirApp(b);
    r = await entrar(p, { role: 'consultora', nome: 'Consultora', monId: 'p2', paginas: ['checkin', 'orcamento', 'renovacao'] });
    prova('consultora com telas marcadas (sem Lançamentos do dia): continua com os Lançamentos do dia e o Peso (as telas novas só liberam)',
      r.itens.indexOf('dashdc') >= 0 && r.itens.indexOf('peso') >= 0, r.itens.join(' '));
    await p.close();

    console.log('\nA gaveta dos Vencimentos some com o item (achado de 30/set/2026):');
    p = await abrirApp(b);
    r = await entrar(p, { role: 'monitor', nome: 'Monitor', monId: 'p5', paginas: ['hospedagem'] });
    prova('o monitor não vê Hoje, Segunda... soltos no menu (a tela dos Vencimentos não é dele)', r.dias === 0, 'dias: ' + r.dias);
    await p.close();
    p = await abrirApp(b);
    r = await entrar(p, { role: 'monitor', nome: 'Monitor', monId: 'p5', paginas: ['hospedagem', 'pessoas', 'banhos'] });
    prova('monitor com Time e Banhos recorrentes liberados: alcança os dois (a gaveta Configurações se abre para ele)',
      r.itens.indexOf('pessoas') >= 0 && r.itens.indexOf('banhos') >= 0 && r.cab.indexOf('operacao') >= 0, JSON.stringify(r));
    await p.close();
  } finally { await b.close(); }
  console.log('\n' + ok + ' provas passaram' + (falhas.length ? (', ' + falhas.length + ' falharam:') : '.'));
  falhas.forEach((f) => console.log('  - ' + f));
  process.exit(falhas.length ? 1 : 0);
})().catch((e) => { console.error('FALHA ao rodar a prova no navegador:', e.message); process.exit(1); });
