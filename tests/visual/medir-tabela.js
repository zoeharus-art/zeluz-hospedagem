'use strict';
/*
 * Medidor de tabela no celular — 26/ago/2026.
 *
 * O harness (tests/harness.js) roda a lógica real, mas não tem layout: ele nunca
 * saberia que a última coluna da tabela está fora da tela. Este medidor abre o CSS
 * REAL do index.html num Chromium de 390 px e pergunta a coisa mais simples do mundo:
 * a célula da última coluna cabe dentro da tela?
 *
 * Uso (o Playwright mora no repo `code`):
 *   NODE_PATH=C:/Users/zeluz/projetos-aios/code/node_modules node tests/visual/medir-tabela.js
 *
 * Sai 0 se toda célula da última coluna termina dentro da largura da tela e a página
 * não rola de lado; sai 1 se alguma coluna está escondida.
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

// APP_HTML permite medir outra versão do arquivo (ex.: `git show HEAD:auaulandia/index.html`)
// para comparar o antes e o depois de uma correção de layout.
const APP = process.env.APP_HTML || path.join(__dirname, '..', '..', 'auaulandia', 'index.html');
const SAIDA = path.join(__dirname, 'tabela-celular.html');
const LARGURA = 390;   // iPhone 14/15 — a tela da Márcia
const ALTURA = 1200;

// Pega o <style> principal do app (o primeiro, que carrega os tokens e as tabelas).
function estiloDoApp() {
  const html = fs.readFileSync(APP, 'utf8');
  const ini = html.indexOf('<style>');
  const fim = html.indexOf('</style>', ini);
  if (ini < 0 || fim < 0) throw new Error('Não achei o <style> principal do index.html');
  return html.slice(ini + '<style>'.length, fim);
}

// Os três formatos de tabela .pel que a Márcia abre no celular. Em todos eles a última
// coluna é a que carrega a informação que decide alguma coisa — valor, motivo, idade.
const TABELAS = [
  { nome: 'Acerto das Plantonistas',
    th: ['Noite', 'Quem dormiu', 'FILHOts', 'Assinatura', 'Valor'],
    tr: [['24/08', 'Wandela Cristina', '9 FILHOts', '1 relatório sem assinatura, noite de 24/08', 'R$ 1.404,00'],
         ['23/08', 'Amanda de Souza', '4 FILHOts', 'assinado por Amanda de Souza', 'R$ 118,00'],
         ['22/08', 'Giulia e Octávio', '11 FILHOts', 'dupla — assinado pelas duas', 'R$ 246,00']] },
  { nome: 'Peludinhos (Day Care)',
    th: ['Nº', 'Peludinho', 'Raça', 'Vem', 'Dias', 'Tutor', 'Idade'],
    tr: [['1', 'Toddy', 'Lhasa Apso', '3x', 'Seg Ter Qua Qui Sex', 'Maria Aparecida de Nascimento', '4 anos e 2 meses'],
         ['2', 'Repolho', 'Spitz Alemão', 'mora aqui', 'Seg Ter Qua Qui Sex', 'Zêluz', '7 anos'],
         ['3', 'Dolly', 'West Highland White Terrier', '2x', 'Ter Qui', 'Ana Carolina Rodrigues', '1 ano e 9 meses']] },
  { nome: 'Inativos',
    th: ['Nº', 'Peludinho', 'Tutor', 'Data da saída', 'Motivo da saída', 'Voltou?'],
    tr: [['1', 'Ozzy', 'Luciana Fernandes de Oliveira', '14/08/2026', 'mudou de cidade com a família', 'Voltou'],
         ['2', 'Maya', 'Carolina Menezes', '02/07/2026', 'trocou o Day Care pelo passeio da manhã', 'Voltou']] }
];

function paginaDeTeste(css) {
  const blocos = TABELAS.map((t) => {
    const th = '<tr>' + t.th.map((c) => '<th>' + c + '</th>').join('') + '</tr>';
    const tr = t.tr.map((l) => '<tr>' + l.map((c) => '<td>' + c + '</td>').join('') + '</tr>').join('\n');
    return '<h3 data-tabela="' + t.nome + '">' + t.nome + '</h3>'
      + '<div class="pel-wrap"><table class="pel"><thead>' + th + '</thead><tbody>' + tr + '</tbody></table></div>';
  }).join('\n');
  return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<title>Medição — tabelas no celular</title><style>' + css + '</style></head><body>'
    + blocos + '</body></html>';
}

(async () => {
  fs.mkdirSync(path.dirname(SAIDA), { recursive: true });
  fs.writeFileSync(SAIDA, paginaDeTeste(estiloDoApp()), 'utf8');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: LARGURA, height: ALTURA } });
  await page.goto('file:///' + SAIDA.replace(/\\/g, '/'));

  const m = await page.evaluate(() => {
    const tela = window.innerWidth;
    const tabelas = Array.from(document.querySelectorAll('table.pel')).map((tb) => {
      const wrap = tb.closest('.pel-wrap');
      const ultimas = Array.from(tb.querySelectorAll('thead tr, tbody tr')).map((tr) => tr.lastElementChild);
      return {
        nome: wrap.previousElementSibling.getAttribute('data-tabela'),
        celulas: ultimas.length,
        fora: ultimas
          .map((td) => ({ txt: td.textContent.trim().slice(0, 24), right: Math.round(td.getBoundingClientRect().right) }))
          .filter((o) => o.right > tela),
        largura: Math.round(tb.getBoundingClientRect().width),
        wrapRola: wrap.scrollWidth > wrap.clientWidth
      };
    });
    return { tela, tabelas, docScrollWidth: document.documentElement.scrollWidth };
  });

  await browser.close();

  console.log('== Tabelas .pel em ' + m.tela + ' px ==');
  let fora = 0;
  m.tabelas.forEach((t) => {
    fora += t.fora.length;
    console.log('  ' + t.nome + ': ' + t.celulas + ' células medidas · FORA DA TELA: ' + t.fora.length
      + (t.fora.length ? ' → ' + JSON.stringify(t.fora) : '')
      + ' · largura ' + t.largura + ' px · rola de lado: ' + (t.wrapRola ? 'sim' : 'não'));
  });
  console.log('  scrollWidth do documento: ' + m.docScrollWidth + ' px (tela: ' + m.tela + ' px)');

  const ok = fora === 0 && m.docScrollWidth === m.tela;
  console.log(ok ? '\n✓ nenhuma coluna escondida' : '\n✗ ' + fora + ' célula(s) escondida(s) no celular');
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.error('ERRO na medição:', e); process.exit(1); });
