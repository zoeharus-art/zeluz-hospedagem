'use strict';
/*
 * CAPTURAS DA MESA "O QUE A IA ENTENDEU" — v 2026-09-11-02.
 *
 * Adriana, 11/set/2026: "Eu preciso ter autonomia de corrigir o dado se a IA mandou para o
 * lugar errado ou 'entendeu errado'."
 *
 * O que este script fotografa, em 1440 px e em 390 px:
 *   1. a mesa com os 12 campos que parecem uma negativa (Central Zêluz › Peludinhos ›
 *      Pesquisa com a Família Multiespécie › aba "O que a IA entendeu");
 *   2. a janela de Corrigir / mover campo;
 *   3. a ficha do FILHOt com o atalho ao lado do campo que a IA preencheu.
 *
 * BANCO DE MENTIRA: sobe o emulador local carregado com o retrato do dia. O Firebase de
 * verdade não recebe um byte. Por cima disso, um guarda embrulha as escritas e as ANOTA
 * sem executar — o script só navega e desenha; nenhum botão de decisão é tocado.
 *
 * Uso: NODE_PATH=C:/Users/zeluz/projetos-aios/code/node_modules node docs/capturas-v10/capturar-mesa-ia.js
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');
const retratoLib = require('../../tests/lib/retrato');
const emuladorLib = require('../../tests/lib/emulador');

const RAIZ = path.join(__dirname, '..', '..');
const APP = 'auaulandia/index.html';
const SAIDA = __dirname;
const PORTA = 8796;
const EMU = 9010;
const ALVO = 'jasmin__riva';          // o caso que a Adriana relatou
const CAMPO = 'alergia';

function servidor() {
  const tipos = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml',
    '.webp': 'image/webp', '.jpg': 'image/jpeg', '.json': 'application/json; charset=utf-8' };
  const srv = http.createServer((req, res) => {
    const rel = decodeURIComponent(String(req.url || '/').split('?')[0]).replace(/^\/+/, '');
    const alvo = path.join(RAIZ, rel);
    if (!alvo.startsWith(RAIZ)) { res.writeHead(403).end(); return; }
    fs.readFile(alvo, (e, buf) => {
      if (e) { res.writeHead(404).end(); return; }
      res.writeHead(200, { 'Content-Type': tipos[path.extname(alvo).toLowerCase()] || 'application/octet-stream' });
      res.end(buf);
    });
  });
  return new Promise((res) => srv.listen(PORTA, '127.0.0.1', () => res(srv)));
}

// Mesmo espírito do guarda do smoke: escrita anotada, nunca executada.
const GUARDA = `(function(){
  window.__ESCRITAS__=[];
  var tenta=setInterval(function(){
    if(typeof firebase==='undefined'||!firebase.database) return;
    try{
      var R=firebase.database.Reference&&firebase.database.Reference.prototype;
      if(!R) return;
      ['set','update','push','remove','transaction'].forEach(function(m){
        if(typeof R[m]!=='function') return;
        R[m]=function(){ window.__ESCRITAS__.push({op:m, caminho:String((this&&this.toString&&this.toString())||'')}); return Promise.resolve(); };
      });
      clearInterval(tenta);
    }catch(e){}
  },30);
})();`;

async function entrar(page, base, senha, nome) {
  await page.goto(base + '/' + APP + '?emulador=' + EMU, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof DB !== 'undefined' && !!DB, null, { timeout: 60000 });
  await page.waitForTimeout(2000);
  await page.fill('#loginPwd', senha);
  await page.click('.login-btn');
  await page.waitForTimeout(1500);
  const pedeNome = await page.$('#loginPessoa');
  if (pedeNome) { await page.fill('#loginPessoa', nome); await page.click('#zCampoOk'); await page.waitForTimeout(1200); }
  await page.waitForTimeout(2500);
  await limparCartazes(page);
}

async function limparCartazes(page) {
  await page.evaluate(() => { const el = document.getElementById('zAlertaoBox'); if (el) el.remove(); });
}

async function foto(page, arq) {
  await page.screenshot({ path: path.join(SAIDA, arq), fullPage: true });
  const st = fs.statSync(path.join(SAIDA, arq));
  console.log('captura: ' + arq + ' (' + Math.round(st.size / 1024) + ' KB)');
}

async function umaLargura(navegador, base, largura, aparelho) {
  const sufixo = largura + 'px';
  const ctx = await navegador.newContext({ viewport: { width: largura, height: largura <= 500 ? 900 : 1200 } });
  const page = await ctx.newPage();
  await page.addInitScript(GUARDA);
  // A trava por aparelho é real: reaproveitar um id JÁ autorizado é leitura pura.
  await page.addInitScript((id) => { try { localStorage.setItem('zeluz_device_id', id); } catch (e) {} }, aparelho);
  await entrar(page, base, '0902', 'Teste do Sistema');

  const st = await page.evaluate(() => ({
    role: document.body.dataset.role || '',
    login: getComputedStyle(document.getElementById('loginScreen')).display
  }));
  if (st.login !== 'none') { console.error(sufixo + ': NÃO entrou — captura abortada'); await ctx.close(); return false; }
  console.log(sufixo + ': entrou como ' + st.role);

  // ---- 1. a mesa, com os 12 que parecem uma negativa ----
  await page.evaluate(() => { const a = document.querySelector('#nav a[data-v="alergia"]'); if (a) a.click(); });
  await page.waitForTimeout(3500);
  await page.evaluate(() => { if (typeof iaRevGarantir === 'function') iaRevGarantir(); });
  await page.waitForTimeout(2500);
  await page.evaluate(() => { if (typeof algAba === 'function') algAba('ia'); });
  await page.waitForTimeout(1500);
  await limparCartazes(page);
  const resumo = await page.evaluate(() => {
    const itens = (typeof iaRevItens === 'function') ? iaRevItens() : [];
    return { total: itens.length, negativas: itens.filter((x) => x.estado === 'negativa').length };
  });
  console.log(sufixo + ': a mesa mostra ' + resumo.total + ' campo(s), ' + resumo.negativas + ' com cara de negativa');
  await foto(page, 'mesa-ia-1-lista-' + largura + '.png');

  // ---- 2. a janela de Corrigir / mover campo ----
  await page.evaluate((o) => { if (typeof iaRevCorrigir === 'function') iaRevCorrigir(o.k, o.c); }, { k: ALVO, c: CAMPO });
  await page.waitForTimeout(900);
  await foto(page, 'mesa-ia-2-corrigir-' + largura + '.png');
  await page.evaluate(() => { const b = document.getElementById('zCampoNao'); if (b) b.click(); });
  await page.waitForTimeout(500);

  // ---- 3. a ficha do FILHOt, com o atalho ao lado do campo ----
  const abriu = await page.evaluate((o) => {
    if (typeof PELUDINHOS === 'undefined' || typeof abrirPeludinho !== 'function') return null;
    for (let i = 0; i < PELUDINHOS.length; i++) {
      if (pelKey(PELUDINHOS[i]) === o.k) {
        if (typeof irParaView === 'function') irParaView('ficha');
        abrirPeludinho(i);
        const bt = Array.prototype.find.call(document.querySelectorAll('.subtab2'),
          (b) => (b.getAttribute('onclick') || '').indexOf("'ps-atencao'") >= 0);
        if (bt) pelSubtab(bt, 'ps-atencao');
        return pelNome(PELUDINHOS[i]);
      }
    }
    return null;
  }, { k: ALVO });
  await page.waitForTimeout(2000);
  await limparCartazes(page);
  console.log(sufixo + ': ficha aberta — ' + (abriu || 'NÃO ACHEI o FILHOt'));
  await foto(page, 'mesa-ia-3-ficha-atalho-' + largura + '.png');

  const escritas = await page.evaluate(() => window.__ESCRITAS__ || []);
  console.log(sufixo + ': escritas tentadas (todas anotadas, nenhuma executada): ' + escritas.length
    + (escritas.length ? (' — ' + JSON.stringify(escritas.slice(0, 3))) : ''));
  await ctx.close();
  return true;
}

async function main() {
  const retrato = retratoLib.carregar();
  const aparelho = Object.keys(retratoLib.ler(retrato, 'auaulandia/aparelhos') || {}).sort()[0];
  if (!aparelho) { console.error('nenhum aparelho autorizado no retrato'); process.exit(1); }
  const versao = (fs.readFileSync(path.join(RAIZ, APP), 'utf8').match(/const APP_VERSAO='([^']+)'/) || [])[1] || '';
  const emulador = await emuladorLib.subir({
    porta: EMU, retrato, versaoApp: versao,
    regras: fs.readFileSync(path.join(RAIZ, 'database.rules.v2.json'), 'utf8'),
    log: (m) => console.log('Emulador: ' + m)
  });
  const srv = await servidor();
  const base = 'http://127.0.0.1:' + PORTA;
  console.log('Servidor: ' + base + ' · versão do app: ' + versao);
  const navegador = await chromium.launch();
  try {
    await umaLargura(navegador, base, 1440, aparelho);
    await umaLargura(navegador, base, 390, aparelho);
  } finally {
    await navegador.close();
    srv.close();
    emulador.parar();
  }
  console.log('pronto');
}
main().catch((e) => { console.error('ERRO:', e); process.exit(1); });
