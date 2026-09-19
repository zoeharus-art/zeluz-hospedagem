'use strict';
/*
 * CAPTURA DA v 2026-09-19-01 — "Medicação" nos Lançamentos do dia.
 *
 * POR QUE ESTA CAPTURA EXISTE
 * Adriana, 18/set/2026: "em lançamento do dia precisamos de uma coluna a mais na planilha,
 * que vira um box a mais no dashboard que fica na tv e uma parte no lançamento do dia de
 * Medicação. Hoje toshi tem medicamento de ouvido e não tenho como colocar. As opções é
 * está na bolsa dele ou na recepção."
 *
 * O QUE ELA FOTOGRAFA
 *   medicacao-vazio-1280.png · medicacao-vazio-500.png — o cartão novo, antes de escolher
 *   medicacao-toshi-1280.png · medicacao-toshi-500.png — o Toshi escolhido, remédio escrito,
 *   "Está na bolsa dele" marcado e a frase "Vai para a planilha assim" pronta
 *   lancamentos-1280.png · lancamentos-500.png — a tela inteira
 *
 * E ELA CONFERE, antes de fotografar: o cartão Medicação existe entre os itens; a busca
 * acha o Toshi; o campo de texto e os dois botões (bolsa / recepção) aparecem; sem
 * responder, o botão diz "Falta responder acima"; respondido, diz "Lançar na planilha" e
 * a frase traz o texto em MAIÚSCULA com "NA BOLSA". O botão Lançar NÃO é apertado: a ponte
 * da planilha é real (script.google.com) e esta captura não fala com ninguém lá fora.
 *
 * NADA É GRAVADO: o mesmo guarda de escrita do smoke embrulha set/update/push/remove antes
 * de o app carregar, e o banco é o EMULADOR local com o retrato do backup.
 *
 * Uso:  NODE_PATH=C:/Users/zeluz/projetos-aios/code/node_modules node tests/capturar-v24.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');
const retratoLib = require('./lib/retrato');
const emuladorLib = require('./lib/emulador');

const RAIZ = path.join(__dirname, '..');
const APP = 'auaulandia/index.html';
const EMU_PORTA = Number(process.env.CAP_EMU_PORTA) || 9009;
const SAIDA = path.join(RAIZ, 'docs', 'capturas-v24');
const SENHA_DIRETORIA = '1101';
const REMEDIO = 'gotas no ouvido, 2x ao dia';

// ------------------------------------------------------------------ servidor local
function tipoDe(p) {
  return ({ '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp'
  })[path.extname(p).toLowerCase()] || 'application/octet-stream';
}
function subirServidor(porta) {
  const srv = http.createServer((req, res) => {
    const rel = decodeURIComponent(String(req.url || '/').split('?')[0]).replace(/^\/+/, '');
    const alvo = path.join(RAIZ, rel || 'index.html');
    if (!alvo.startsWith(RAIZ)) { res.writeHead(403).end(); return; }
    fs.readFile(alvo, (e, buf) => {
      if (e) { res.writeHead(404).end('nao achei'); return; }
      res.writeHead(200, { 'Content-Type': tipoDe(alvo) });
      res.end(buf);
    });
  });
  return new Promise((res, rej) => {
    srv.on('error', rej);
    srv.listen(porta, '127.0.0.1', () => res({ base: 'http://127.0.0.1:' + porta, parar: () => { try { srv.close(); } catch (e) { /* já fechou */ } } }));
  });
}

// ------------------------------------------------------------------ guarda de escrita
// Igual ao do smoke: nada vai para o banco. A tentativa é anotada e a promessa volta OK.
function guardaDeEscrita() {
  window.__ESCRITAS__ = [];
  const anotar = (metodo, caminho) => { try { window.__ESCRITAS__.push({ metodo, caminho }); } catch (e) { /* o guarda nunca derruba a página */ } };
  const caminhoDe = (ref) => { try { return String(ref.toString()).replace(/^https?:\/\/[^/]+\//, ''); } catch (e) { return '(?)'; } };
  const embrulhar = () => {
    const fb = window.firebase;
    if (!fb || !fb.database || !fb.database.Reference || !fb.database.Reference.prototype) return false;
    const R = fb.database.Reference.prototype;
    if (R.__guardado) return true;
    ['set', 'update', 'remove', 'setWithPriority', 'setPriority'].forEach((m) => {
      if (typeof R[m] !== 'function') return;
      R[m] = function () { anotar(m, caminhoDe(this)); return Promise.resolve(); };
    });
    if (typeof R.transaction === 'function') R.transaction = function () { anotar('transaction', caminhoDe(this)); return Promise.resolve({ committed: false, snapshot: null }); };
    if (typeof R.push === 'function') {
      const orig = R.push;
      R.push = function (valor, cb) {
        if (valor === undefined) return orig.call(this);
        anotar('push', caminhoDe(this));
        const novo = orig.call(this);
        if (typeof cb === 'function') { try { cb(null); } catch (e) { /* callback do app */ } }
        return novo;
      };
    }
    const OD = fb.database.OnDisconnect && fb.database.OnDisconnect.prototype;
    if (OD) ['set', 'update', 'remove', 'setWithPriority', 'cancel'].forEach((m) => {
      if (typeof OD[m] !== 'function') return;
      OD[m] = function () { anotar('onDisconnect.' + m, '(onDisconnect)'); return Promise.resolve(); };
    });
    R.__guardado = true; return true;
  };
  if (!embrulhar()) {
    const t = setInterval(() => { if (embrulhar()) clearInterval(t); }, 5);
    setTimeout(() => clearInterval(t), 60000);
  }
}

async function estabilizar(page) {
  try { await page.waitForLoadState('networkidle', { timeout: 8000 }); } catch (e) { /* rede não aquietou: segue com a folga abaixo */ }
  await page.waitForTimeout(1200);
}

// O cartão "Medicação" dentro de #dashBlocos — achado pelo título, como a recepção acha.
async function cartaoMedicacao(page) {
  const cards = await page.$$('#dashBlocos .card');
  for (const c of cards) {
    const h = await c.$eval('h2', (el) => el.textContent || '').catch(() => '');
    if (/Medica\u00e7\u00e3o/.test(h)) return c;
  }
  return null;
}

(async () => {
  fs.mkdirSync(SAIDA, { recursive: true });
  const servidor = await subirServidor(Number(process.env.CAP_PORTA) || 8799);
  const retrato = retratoLib.carregar();
  const versao = (/APP_VERSAO='([^']+)'/.exec(fs.readFileSync(path.join(RAIZ, APP), 'utf8')) || [])[1] || '';
  const emulador = await emuladorLib.subir({
    porta: EMU_PORTA, retrato, versaoApp: versao,
    regras: fs.readFileSync(path.join(RAIZ, 'database.rules.v2.json'), 'utf8'),
    log: (m) => console.log('Emulador: ' + m),
  });
  const pararTudo = () => { try { emulador.parar(); } catch (e) { /* já parou */ } try { servidor.parar(); } catch (e) { /* já parou */ } };
  process.on('exit', pararTudo);

  const navegador = await chromium.launch({ headless: true });
  const aparelhos = Object.keys((retrato.auaulandia && retrato.auaulandia.aparelhos) || {}).sort();
  if (!aparelhos.length) { console.error('Nenhum aparelho autorizado no retrato.'); process.exit(1); }
  const URL = servidor.base + '/' + APP + '?emulador=' + EMU_PORTA;
  const problemas = [];

  // As duas larguras da lei: 1280 (o computador da Gestão) e 500 (o mínimo de celular).
  const LARGURAS = [{ w: 1280, rot: '1280' }, { w: 500, rot: '500' }];

  for (const larg of LARGURAS) {
    const ctx = await navegador.newContext({ viewport: { width: larg.w, height: 1200 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.addInitScript(guardaDeEscrita);
    await page.addInitScript((id) => { try { localStorage.setItem('zeluz_device_id', id); } catch (e) { /* sem localStorage o app barra e o erro aparece na tela */ } }, aparelhos[0]);
    await page.goto(URL, { waitUntil: 'load' });
    await estabilizar(page);
    await page.fill('#loginPwd', SENHA_DIRETORIA);
    await page.click('.login-btn');
    await page.waitForTimeout(1800);
    await estabilizar(page);
    for (let i = 0; i < 4; i++) {
      const b = await page.$('#zAlertaoOk'); if (!b) break;
      await b.click(); await page.waitForTimeout(400);
    }
    const papel = await page.evaluate(() => document.body.dataset.role || '');
    if (!papel) { console.error('Não entrou no app (' + larg.rot + ').'); await navegador.close(); pararTudo(); process.exit(1); }
    if (larg.w === 1280) console.log('Entrou como: ' + papel);

    await page.evaluate(() => { if (typeof abrirItemDoMenu === 'function') abrirItemDoMenu('dashdc'); });
    await page.waitForTimeout(2200);
    await estabilizar(page);

    // 1 · o cartão existe, e o texto da tela cita Medicação entre o que se lança à mão
    let card = await cartaoMedicacao(page);
    if (!card) { problemas.push('não achei o cartão "Medicação" em Lançamentos do dia (' + larg.rot + ')'); await ctx.close(); continue; }
    const citado = await page.evaluate(() => /Carrapaticida,\s*Medica\u00e7\u00e3o/.test(document.querySelector('#v-dashdc') ? document.querySelector('#v-dashdc').innerText : ''));
    if (!citado) problemas.push('o cartão "O que se preenche sozinho" não cita Medicação entre o que se lança à mão (' + larg.rot + ')');
    await card.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await card.screenshot({ path: path.join(SAIDA, 'medicacao-vazio-' + larg.rot + '.png') });
    console.log('medicacao-vazio-' + larg.rot + '.png');

    // 2 · busca o Toshi e escolhe a primeira sugestão
    await page.fill('#dashB_medicacao', 'Toshi');
    await page.waitForTimeout(600);
    const sug = await page.$('#dashS_medicacao button');
    if (!sug) { problemas.push('a busca por "Toshi" não trouxe sugestão no cartão Medicação (' + larg.rot + ')'); await ctx.close(); continue; }
    const nomeSug = (await sug.textContent()) || '';
    await sug.click();
    await page.waitForTimeout(700);
    card = await cartaoMedicacao(page);

    // 3 · sem responder, o botão tem de dizer que falta
    let textoCard = (await card.innerText()) || '';
    if (!/Falta responder acima/.test(textoCard)) problemas.push('com o Toshi escolhido e nada respondido, o botão devia dizer "Falta responder acima" (' + larg.rot + ')');
    if (!/Qual rem\u00e9dio/.test(textoCard)) problemas.push('não apareceu a pergunta "Qual remédio" (' + larg.rot + ')');
    if (!/Onde est\u00e1 o rem\u00e9dio/.test(textoCard)) problemas.push('não apareceu a pergunta "Onde está o remédio?" (' + larg.rot + ')');
    if (!/Est\u00e1 na recep\u00e7\u00e3o/.test(textoCard)) problemas.push('faltou o botão "Está na recepção" (' + larg.rot + ')');

    // 4 · escreve o remédio e marca "Está na bolsa dele"
    const txt = await card.$('input[type="text"]:not([id^="dashB_"])');
    if (!txt) { problemas.push('não achei o campo de texto do remédio (' + larg.rot + ')'); await ctx.close(); continue; }
    await txt.fill(REMEDIO);
    await txt.dispatchEvent('change');
    await page.waitForTimeout(500);
    card = await cartaoMedicacao(page);
    const botoes = await card.$$('button');
    let bolsa = null;
    for (const b of botoes) { const t = (await b.textContent()) || ''; if (/Est\u00e1 na bolsa dele/.test(t)) { bolsa = b; break; } }
    if (!bolsa) { problemas.push('não achei o botão "Está na bolsa dele" (' + larg.rot + ')'); await ctx.close(); continue; }
    await bolsa.click();
    await page.waitForTimeout(600);
    card = await cartaoMedicacao(page);
    textoCard = (await card.innerText()) || '';

    // 5 · a frase pronta e o botão liberado
    const frase = (/Vai para a planilha assim:\s*(.+)/.exec(textoCard) || [])[1] || '';
    if (larg.w === 1280) console.log('Sugestão escolhida: ' + nomeSug.trim() + ' · Vai para a planilha assim: ' + frase.trim());
    if (!/Toshi/.test(frase)) problemas.push('a frase da planilha não traz o Toshi (' + larg.rot + '): ' + frase);
    if (frase.indexOf(REMEDIO.toUpperCase()) < 0) problemas.push('o remédio não saiu em MAIÚSCULA na frase (' + larg.rot + '): ' + frase);
    if (frase.indexOf('NA BOLSA') < 0) problemas.push('a frase não traz "NA BOLSA" (' + larg.rot + '): ' + frase);
    if (!/Lan\u00e7ar na planilha/.test(textoCard)) problemas.push('respondido tudo, o botão devia dizer "Lançar na planilha" (' + larg.rot + ')');
    if (/Falta responder acima/.test(textoCard)) problemas.push('respondido tudo, ainda diz "Falta responder acima" (' + larg.rot + ')');
    const remedioNaTela = await card.$eval('input[type="text"]:not([id^="dashB_"])', (el) => el.value).catch(() => '');
    if (remedioNaTela !== REMEDIO) problemas.push('o texto do remédio sumiu do campo depois de marcar o botão (' + larg.rot + '): "' + remedioNaTela + '"');

    await card.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await card.screenshot({ path: path.join(SAIDA, 'medicacao-toshi-' + larg.rot + '.png') });
    console.log('medicacao-toshi-' + larg.rot + '.png');

    // 6 · a tela inteira
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SAIDA, 'lancamentos-' + larg.rot + '.png'), fullPage: true });
    console.log('lancamentos-' + larg.rot + '.png');

    const escritas = await page.evaluate(() => (window.__ESCRITAS__ || []).length);
    console.log('Tentativas de gravação barradas pelo guarda (' + larg.rot + '): ' + escritas + ' (nenhuma foi ao banco)');
    await ctx.close();
  }

  await navegador.close();
  pararTudo();
  if (problemas.length) { console.error('\nPROBLEMAS:\n- ' + problemas.join('\n- ')); process.exit(1); }
  console.log('\nCaptura v-24 pronta em docs/capturas-v24/');
})().catch((e) => { console.error(e); process.exit(1); });
