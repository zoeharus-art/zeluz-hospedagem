'use strict';
/*
 * CAPTURAS DA v 2026-09-15-03 — as quatro entregas de 15/set/2026.
 *
 * Abre o app de verdade (servidor local + EMULADOR carregado com o retrato do backup,
 * nunca o Firebase real) e fotografa o que a Adriana pediu para ver:
 *
 *   1. entrada-placa-cuida-de-vidas.png   — 390px, a tela de entrada com a placa
 *   2. menu-central-zeluz.png            — 1280px, o menu aberto na Central Zêluz
 *   3. prevencao-coleira-vencendo.png    — 1280px, o bloco de coleira a vencer
 *   4. config-prevencao.png              — 1280px, Configurações › Prevenção
 *   5. config-mensagem-entrada.png       — 1280px, Configurações › Mensagem de entrada
 *
 * NADA É GRAVADO: o mesmo guarda de escrita do smoke embrulha set/update/push/remove antes
 * de o app carregar, e a coleira a vencer usada na foto 3 é injetada apenas na memória da
 * página (pelCadCache), nunca no banco.
 *
 * Uso:  NODE_PATH=C:/Users/zeluz/projetos-aios/code/node_modules node tests/capturar-v16.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');
const retratoLib = require('./lib/retrato');
const emuladorLib = require('./lib/emulador');

const RAIZ = path.join(__dirname, '..');
const APP = 'auaulandia/index.html';
const EMU_PORTA = Number(process.env.CAP_EMU_PORTA) || 9002;
const SAIDA = path.join(RAIZ, 'docs', 'capturas-v16');
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
  window.__GUARDA_OK__ = false;
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
    R.__guardado = true; window.__GUARDA_OK__ = true; return true;
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
  const servidor = await subirServidor(Number(process.env.CAP_PORTA) || 8792);
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

  const novaPagina = async (largura, altura) => {
    const ctx = await navegador.newContext({ viewport: { width: largura, height: altura }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.addInitScript(guardaDeEscrita);
    await page.addInitScript((id) => { try { localStorage.setItem('zeluz_device_id', id); } catch (e) { /* sem localStorage o app barra e o erro aparece na tela */ } }, aparelhos[0]);
    return page;
  };

  // ==================================================== 1. a placa, no celular (390px)
  {
    const page = await novaPagina(390, 844);
    await page.goto(URL, { waitUntil: 'load' });
    await estabilizar(page);
    await page.screenshot({ path: path.join(SAIDA, 'entrada-placa-cuida-de-vidas.png') });
    const txt = await page.evaluate(() => {
      const el = document.getElementById('entradaPlaca');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const t = document.getElementById('entradaPlacaT');
      return { texto: el.innerText.replace(/\n+/g, ' | '), largura: Math.round(r.width),
        alturaTitulo: Math.round(t.getBoundingClientRect().height) };
    });
    console.log('1/5 entrada-placa-cuida-de-vidas.png — ' + JSON.stringify(txt));
    await page.context().close();
  }

  // ==================================================== 2 a 5. o resto, no computador
  const page = await novaPagina(1280, 1400);
  await page.goto(URL, { waitUntil: 'load' });
  await estabilizar(page);
  await page.fill('#loginPwd', SENHA_DIRETORIA);
  await page.click('.login-btn');
  await page.waitForTimeout(1800);
  await estabilizar(page);
  for (let i = 0; i < 3; i++) {
    const b = await page.$('#zAlertaoOk'); if (!b) break;
    await b.click(); await page.waitForTimeout(400);
  }
  const entrou = await page.evaluate(() => document.body.dataset.role || '');
  if (!entrou) { console.error('Não entrou no app.'); await navegador.close(); process.exit(1); }
  console.log('Entrou como: ' + entrou);

  // ---- 2. o menu aberto na Central Zêluz ----
  await page.evaluate(() => {
    ['central', 'c-peludinhos', 'c-auaulandia', 'c-daycare'].forEach((k) => {
      const a = document.querySelector('#nav a[data-acc-toggle="' + k + '"]');
      const acc = a && a.closest('.acc');
      if (acc && !acc.classList.contains('acc-open')) a.click();
    });
    // fecha o que não é o assunto da foto e sobe a Central Zêluz para o topo da barra
    ['paineis', 'servicos'].forEach((k) => {
      const a = document.querySelector('#nav a[data-acc-toggle="' + k + '"]');
      const acc = a && a.closest('.acc');
      if (acc && acc.classList.contains('acc-open')) a.click();
    });
    const alvo = document.querySelector('#nav a[data-acc-toggle="central"]');
    if (alvo && alvo.scrollIntoView) alvo.scrollIntoView({ block: 'start' });
  });
  await page.waitForTimeout(700);
  const side = await page.$('#sidebar');
  if (side) {
    await side.screenshot({ path: path.join(SAIDA, 'menu-central-zeluz.png') });
    const itens = await page.evaluate(() => {
      const nav = document.getElementById('nav').innerHTML;
      const corte = (de, ate) => {
        const i = nav.indexOf('data-acc-toggle="' + de + '"');
        const f = ate ? nav.indexOf('data-acc-toggle="' + ate + '"') : nav.length;
        return nav.slice(i, f);
      };
      const nomes = (de, ate) => {
        const d = document.createElement('div'); d.innerHTML = corte(de, ate);
        return [...d.querySelectorAll('a')].filter((a) => !a.classList.contains('nav-parent'))
          .map((a) => (a.textContent || '').replace(/\s+/g, ' ').trim());
      };
      return { peludinhos: nomes('c-peludinhos', 'c-auaulandia'),
        daycare: nomes('c-daycare', 'operacao') };
    });
    console.log('2/5 menu-central-zeluz.png — ' + JSON.stringify(itens));
  } else { console.error('Não achei o #sidebar.'); }

  // ---- 3. a Prevenção com o bloco de coleira a vencer ----
  // A coleira a vencer é injetada SÓ NA MEMÓRIA da página: escolhe um FILHOt ativo e
  // marca a coleira dele para vencer em 5 dias. Nada disso vai para o banco.
  const alvo = await page.evaluate(() => {
    let idx = -1;
    for (let i = 0; i < PELUDINHOS.length; i++) { if (!pelInativo(PELUDINHOS[i])) { idx = i; break; } }
    if (idx < 0) return null;
    const p = PELUDINHOS[idx], k = pelKey(p);
    const hoje = hojeISO();
    pelCadCache[k] = Object.assign({}, pelCadCache[k] || {}, {
      col_nome: 'Seresto', col_t: addDiasISO(hoje, -235), col_p: addDiasISO(hoje, 5),
    });
    try { localStorage.removeItem('zeluz_pel_' + k); } catch (e) { /* sem cópia local vale o cache */ }
    abrirItemDoMenu('vacinas');
    return { nome: pelNome(p), vence: addDiasISO(hoje, 5) };
  });
  await page.waitForTimeout(1200);
  const prev = await page.$('#prevColeiraBloco');
  if (prev && alvo) {
    await prev.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await prev.screenshot({ path: path.join(SAIDA, 'prevencao-coleira-vencendo.png') });
    const titulo = await page.evaluate(() => {
      const h = document.querySelector('#prevColeiraBloco h2');
      return h ? h.textContent : '(sem título)';
    });
    console.log('3/5 prevencao-coleira-vencendo.png — ' + alvo.nome + ' vence ' + alvo.vence + ' · bloco: ' + titulo);
  } else { console.error('Não achei o bloco "Coleira vencendo" na Prevenção.'); }

  // ---- 4 e 5. Configurações › Prevenção e › Mensagem de entrada ----
  await page.evaluate(() => abrirItemDoMenu('config'));
  await page.waitForTimeout(1400);
  const cardDe = (id) => page.evaluateHandle((x) => {
    const w = document.getElementById(x);
    return w ? w.closest('.card') : null;
  }, id);

  const cPrev = (await cardDe('cfgPrevWrap')).asElement();
  if (cPrev) {
    await cPrev.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await cPrev.screenshot({ path: path.join(SAIDA, 'config-prevencao.png') });
    const vals = await page.evaluate(() => ({
      seresto: (document.getElementById('cfgPrevCol_Seresto') || {}).value,
      aviso1: (document.getElementById('cfgPrevAviso1') || {}).value,
      aviso2: (document.getElementById('cfgPrevAviso2') || {}).value,
    }));
    console.log('4/5 config-prevencao.png — ' + JSON.stringify(vals));
  } else { console.error('Não achei o cartão de Configurações › Prevenção.'); }

  const cEnt = (await cardDe('cfgEntradaWrap')).asElement();
  if (cEnt) {
    await cEnt.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await cEnt.screenshot({ path: path.join(SAIDA, 'config-mensagem-entrada.png') });
    const vals = await page.evaluate(() => ({
      titulo: (document.getElementById('cfgEntTitulo') || {}).value,
      l1: (document.getElementById('cfgEntL1') || {}).value,
    }));
    console.log('5/5 config-mensagem-entrada.png — ' + JSON.stringify(vals));
  } else { console.error('Não achei o cartão de Configurações › Mensagem de entrada.'); }

  // ---- a prova: nenhuma gravação escapou ----
  const escritas = await page.evaluate(() => (window.__ESCRITAS__ || []));
  console.log('Gravações capturadas pelo guarda (nenhuma chegou ao banco): ' + escritas.length +
    (escritas.length ? ' · ' + JSON.stringify(escritas.slice(0, 3)) : ''));

  await navegador.close();
  pararTudo();
  console.log('Capturas em: ' + SAIDA);
  process.exit(0);
})().catch((e) => { console.error('FALHA NAS CAPTURAS:', e); process.exit(1); });
