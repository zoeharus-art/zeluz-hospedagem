'use strict';
/*
 * CAPTURA DA v 2026-09-17-04 — a origem "Loja" nos Lançamentos do dia.
 *
 * POR QUE ESTA CAPTURA EXISTE
 * Adriana, 17/set/2026: "carrapaticida, troca de coleira, vermífugo e os outros que têm
 * observação / campo de 'onde está' precisam ganhar a opção Loja" — porque o produto pode
 * ter sido comprado aqui, na loja da Zêluz, e não ter vindo de casa. Antes disso a
 * consultora era obrigada a mentir ("na bolsa") ou a calar ("nada a observar").
 *
 * O QUE ELA FOTOGRAFA
 *   lancamentos-loja.png — os três cartões vizinhos da tela "Lançamentos do dia"
 *   (Vermífugo, Carrapaticida e Troca de coleira) com os painéis abertos, cada um
 *   mostrando o botão novo, e o carrapaticida já respondido: a linha "Vai para a planilha
 *   assim: … (PIPETA · LOJA)" é exatamente o que a TV vai ler.
 *
 * NADA É GRAVADO: o mesmo guarda de escrita do smoke embrulha set/update/push/remove antes
 * de o app carregar, e o banco é o EMULADOR local com o retrato do backup.
 *
 * Uso:  NODE_PATH=C:/Users/zeluz/projetos-aios/code/node_modules node tests/capturar-v22.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');
const retratoLib = require('./lib/retrato');
const emuladorLib = require('./lib/emulador');

const RAIZ = path.join(__dirname, '..');
const APP = 'auaulandia/index.html';
const EMU_PORTA = Number(process.env.CAP_EMU_PORTA) || 9008;
const SAIDA = path.join(RAIZ, 'docs', 'capturas-v22');
// A senha NÃO fica no repositório (público). Fase 0, 25/set/2026: vem do ambiente.
const SENHA_DIRETORIA = process.env.ZELUZ_SENHA_DIRETORIA || '';
if (!SENHA_DIRETORIA) { console.error('Defina ZELUZ_SENHA_DIRETORIA (a senha da Diretoria) antes de rodar esta captura.'); process.exit(1); }

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

(async () => {
  fs.mkdirSync(SAIDA, { recursive: true });
  const servidor = await subirServidor(Number(process.env.CAP_PORTA) || 8798);
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

  // 500 px é o mínimo combinado para captura de celular (lei de 26/ago/2026).
  const ctx = await navegador.newContext({ viewport: { width: 500, height: 1200 }, deviceScaleFactor: 2 });
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
  if (!papel) { console.error('Não entrou no app.'); await navegador.close(); pararTudo(); process.exit(1); }
  console.log('Entrou como: ' + papel);

  // ============================================ Lançamentos do dia, com os painéis abertos
  await page.evaluate(() => { abrirItemDoMenu('dashdc'); });
  await page.waitForTimeout(1500);

  // Abre o painel dos três tipos vizinhos (Vermífugo · Carrapaticida · Troca de coleira) e
  // responde o carrapaticida — a linha "Vai para a planilha assim" é a prova que interessa.
  const estado = await page.evaluate(() => {
    const nomeDe = (i) => {
      const p = (typeof PELUDINHOS !== 'undefined' && PELUDINHOS[i]) ? PELUDINHOS[i] : null;
      return p ? dashNomeRaca(p) : '';
    };
    const alvos = ['vermifugo', 'carrapaticida', 'coleira'];
    alvos.forEach((k, n) => { dashEscolher(k, nomeDe(n) || ('FILHOt ' + (n + 1)), n); });
    dashSetDet('carrapaticida', 'qtd', 'PIPETA');
    dashSetDet('carrapaticida', 'onde', 'LOJA');
    // o que a tela está mostrando agora, para a captura não passar por bonita e estar errada
    const cards = [].slice.call(document.querySelectorAll('#dashBlocos > .card'));
    const doTipo = {};
    (DASH_ITENS || []).forEach((it, i) => { doTipo[it.k] = i; });
    const textoDe = (k) => (cards[doTipo[k]] || {}).innerText || '';
    return {
      escolhidos: alvos.map((k) => DASH_SEL[k] || ''),
      lojaNoBotao: alvos.map((k) => /aqui na loja/.test(textoDe(k))),
      linhaDaPlanilha: (/Vai para a planilha assim:\s*(.+)/.exec(textoDe('carrapaticida')) || [])[1] || '',
      indices: [doTipo.vermifugo, doTipo.carrapaticida, doTipo.coleira],
      cards: cards.length,
    };
  });
  console.log('Escolhidos na tela: ' + JSON.stringify(estado.escolhidos));
  console.log('Botão "aqui na loja" visível em vermífugo/carrapaticida/coleira: ' + JSON.stringify(estado.lojaNoBotao));
  console.log('Linha da planilha (carrapaticida): ' + estado.linhaDaPlanilha);
  if (estado.lojaNoBotao.some((v) => !v)) problemas.push('algum dos três tipos ficou SEM o botão da loja: ' + JSON.stringify(estado.lojaNoBotao));
  if (!/\(PIPETA · LOJA\)/.test(estado.linhaDaPlanilha)) problemas.push('a linha da planilha não saiu com "(PIPETA · LOJA)": ' + estado.linhaDaPlanilha);

  // A foto: um retângulo que cobre do primeiro ao último dos três cartões vizinhos.
  await page.evaluate((i) => {
    const c = document.querySelectorAll('#dashBlocos > .card')[i];
    if (c) c.scrollIntoView({ block: 'start' });
  }, estado.indices[0]);
  await page.waitForTimeout(500);
  const caixa = await page.evaluate((ix) => {
    const cards = document.querySelectorAll('#dashBlocos > .card');
    const a = cards[ix[0]].getBoundingClientRect();
    const z = cards[ix[2]].getBoundingClientRect();
    return { x: Math.max(0, a.left - 8), y: Math.max(0, a.top - 8),
             width: Math.min(window.innerWidth, a.width + 16), height: (z.bottom - a.top) + 16 };
  }, estado.indices);
  await page.setViewportSize({ width: 500, height: Math.min(4000, Math.ceil(caixa.height) + 120) });
  await page.waitForTimeout(600);
  const caixa2 = await page.evaluate((ix) => {
    const cards = document.querySelectorAll('#dashBlocos > .card');
    cards[ix[0]].scrollIntoView({ block: 'start' });
    // a barra de cima é fixa: sem esta folga ela come o título do primeiro cartão
    window.scrollBy(0, -190);
    const a = cards[ix[0]].getBoundingClientRect();
    const z = cards[ix[2]].getBoundingClientRect();
    return { x: Math.max(0, a.left - 8), y: Math.max(0, a.top - 8),
             width: Math.min(window.innerWidth, a.width + 16), height: (z.bottom - a.top) + 16 };
  }, estado.indices);
  await page.screenshot({ path: path.join(SAIDA, 'lancamentos-loja.png'), clip: caixa2 });
  console.log('lancamentos-loja.png — Vermífugo, Carrapaticida e Troca de coleira com a opção Loja');

  const escritas = await page.evaluate(() => (window.__ESCRITAS__ || []).length);
  console.log('Tentativas de gravação barradas pelo guarda: ' + escritas + ' (nenhuma foi ao banco)');

  await navegador.close();
  pararTudo();
  if (problemas.length) { console.error('\nPROBLEMAS:\n- ' + problemas.join('\n- ')); process.exit(1); }
  console.log('\nCaptura v-22 pronta em docs/capturas-v22/');
})().catch((e) => { console.error(e); process.exit(1); });
