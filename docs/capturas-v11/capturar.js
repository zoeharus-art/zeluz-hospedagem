'use strict';
/*
 * Capturas do v-13 (2026-09-12-01) — o protocolo do Check-in do corpo em três etapas
 * (Início · Check-in · Fim) e a tela Configurações › Protocolos passo a passo.
 *
 * Roda no EMULADOR local carregado com o retrato do backup: o Firebase de verdade não
 * recebe um byte (a lição dos 695 MB de 08/set). Além disso, o mesmo guarda do smoke
 * embrulha set/update/push/remove/transaction — nenhuma gravação é executada, só anotada.
 * O script SÓ navega: abre a atividade, troca de etapa e fotografa.
 *
 * Uso: NODE_PATH=C:/Users/zeluz/projetos-aios/code/node_modules node docs/capturas-v11/capturar.js
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
const PORTA = 8794;
const EMU_PORTA = 9001;
const SENHA_DIRETORIA = '1101';   // a mesma senha fixa que o smoke usa para a Diretoria

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

// O mesmo espírito do guarda do smoke: escrita anotada, nunca executada.
function guardaDeEscrita() {
  window.__ESCRITAS__ = [];
  const anotar = (m, r) => { try { window.__ESCRITAS__.push({ metodo: m, caminho: String(r) }); } catch (e) { /* o guarda nunca derruba a página */ } };
  const tenta = setInterval(() => {
    const fb = window.firebase;
    if (!fb || !fb.database || !fb.database.Reference) return;
    const R = fb.database.Reference.prototype;
    ['set', 'update', 'remove'].forEach((m) => {
      if (typeof R[m] !== 'function') return;
      R[m] = function () { anotar(m, this); return Promise.resolve(); };
    });
    if (typeof R.transaction === 'function') {
      R.transaction = function () { anotar('transaction', this); return Promise.resolve({ committed: false, snapshot: null }); };
    }
    clearInterval(tenta);
  }, 50);
}

function versaoNoDisco() {
  const html = fs.readFileSync(path.join(RAIZ, APP), 'utf8');
  const m = /const APP_VERSAO='([^']+)'/.exec(html);
  return m ? m[1] : '';
}

async function limpar(page) {
  await page.evaluate(() => { ['zAlertaoBox', 'zEscolhaBox'].forEach((id) => { const el = document.getElementById(id); if (el) el.remove(); }); });
}

async function entrar(page, base, aparelho) {
  await page.goto(base + '/' + APP + '?emulador=' + EMU_PORTA, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof DB !== 'undefined' && !!DB, null, { timeout: 45000 });
  await page.waitForTimeout(2000);
  await page.fill('#loginPwd', SENHA_DIRETORIA);
  await page.click('.login-btn');
  await page.waitForTimeout(1800);
  const pedeNome = await page.$('#loginPessoa');
  if (pedeNome) { await page.fill('#loginPessoa', 'Adriana'); await page.click('#zCampoOk'); await page.waitForTimeout(1200); }
  await page.waitForTimeout(2500);
  await limpar(page);
}

async function capturar(page, arq, inteira) {
  await page.screenshot({ path: path.join(SAIDA, arq), fullPage: inteira !== false });
  console.log('captura:', arq);
}

async function umaLargura(navegador, base, largura, rotulo, aparelho) {
  const ctx = await navegador.newContext({ viewport: { width: largura, height: 900 } });
  const page = await ctx.newPage();
  await page.addInitScript(guardaDeEscrita);
  await page.addInitScript((id) => { try { localStorage.setItem('zeluz_device_id', id); } catch (e) { /* sem localStorage: a trava de aparelho barra e o script avisa */ } }, aparelho);
  await entrar(page, base, aparelho);

  // Check-in do corpo: as três etapas. Só navegação — abrirAtividade e setCkStep não gravam.
  await page.evaluate(() => { if (typeof abrirAtividade === 'function') abrirAtividade('checkin-corpo'); });
  await page.waitForTimeout(3500);
  await limpar(page);
  for (const [passo, nome] of [['inicio', '1-checkin-inicio'], ['exec', '2-checkin-execucao'], ['fim', '3-checkin-fim']]) {
    await page.evaluate((p) => { if (typeof setCkStep === 'function') setCkStep(p); }, passo);
    await page.waitForTimeout(1200);
    await limpar(page);
    // A etapa do meio é a grade com dezenas de FILHOts: a página inteira viraria uma
    // imagem de 14 mil pixels e mais de 1 MB. Dela basta o alto da tela, que é onde a
    // estrutura das três etapas aparece.
    await capturar(page, rotulo + '-' + nome + '.png', passo !== 'exec');
  }

  // Configurações › Protocolos passo a passo.
  await page.evaluate(() => { if (typeof abrirItemDoMenu === 'function') abrirItemDoMenu('config'); });
  await page.waitForTimeout(3500);
  await limpar(page);
  await capturar(page, rotulo + '-4-configuracoes-protocolos.png');

  const escritas = await page.evaluate(() => (window.__ESCRITAS__ || []).map((e) => e.metodo + ' ' + e.caminho));
  await ctx.close();
  return escritas;
}

(async () => {
  const srv = await servidor();
  const retrato = retratoLib.carregar();
  const emulador = await emuladorLib.subir({
    porta: EMU_PORTA, retrato, versaoApp: versaoNoDisco(),
    regras: fs.readFileSync(path.join(RAIZ, 'database.rules.v2.json'), 'utf8'),
    log: (m) => console.log('Emulador: ' + m),
  });
  const base = 'http://127.0.0.1:' + PORTA;
  const navegador = await chromium.launch({ headless: true });

  // A trava por aparelho é real: sem um id JÁ autorizado ninguém entra. Reaproveitar um id
  // existente é leitura pura — não cria, não altera e não apaga nada.
  const ctxD = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
  const pD = await ctxD.newPage();
  await pD.goto(base + '/' + APP + '?emulador=' + EMU_PORTA, { waitUntil: 'load' });
  await pD.waitForFunction(() => typeof DB !== 'undefined' && !!DB, null, { timeout: 45000 });
  const aparelhos = await pD.evaluate(async () => {
    const s = await DB.ref('auaulandia/aparelhos').once('value');
    return Object.keys(s.val() || {});
  });
  await ctxD.close();
  if (!aparelhos.length) { console.error('Nenhum aparelho autorizado no retrato — abortando.'); process.exit(1); }
  const aparelho = aparelhos.slice().sort()[0];
  console.log('Aparelho reaproveitado: ' + aparelho);

  const todas = [];
  todas.push(...await umaLargura(navegador, base, 390, 'celular-390', aparelho));
  todas.push(...await umaLargura(navegador, base, 1440, 'desktop-1440', aparelho));

  await navegador.close();
  emulador.parar();
  srv.close();
  console.log('\nGravações tentadas (anotadas e NÃO executadas): ' + todas.length);
  todas.slice(0, 10).forEach((t) => console.log('  · ' + t));
})().catch((e) => { console.error('ERRO nas capturas:', e); process.exit(1); });
