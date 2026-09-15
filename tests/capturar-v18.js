'use strict';
/*
 * CAPTURA DA v 2026-09-15-05 — a placa de entrada no desenho B ("placa de obra").
 *
 * Abre o app de verdade (servidor local + EMULADOR carregado com o retrato do backup,
 * nunca o Firebase real) e fotografa o que a Adriana pediu para ver:
 *
 *   1. entrada-placa-B.png   — 390px (o celular do time), a tela de entrada com a placa
 *                              no desenho B: retângulo vermelho, fita listrada em volta,
 *                              etiquetas creme em VIOLAÇÃO e INACEITÁVEL.
 *
 * NADA É GRAVADO: o mesmo guarda de escrita do smoke embrulha set/update/push/remove antes
 * de o app carregar. A placa aparece ANTES da senha, então a foto não precisa entrar.
 *
 * Uso:  NODE_PATH=C:/Users/zeluz/projetos-aios/code/node_modules node tests/capturar-v18.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');
const retratoLib = require('./lib/retrato');
const emuladorLib = require('./lib/emulador');

const RAIZ = path.join(__dirname, '..');
const APP = 'auaulandia/index.html';
const EMU_PORTA = Number(process.env.CAP_EMU_PORTA) || 9004;
const SAIDA = path.join(RAIZ, 'docs', 'capturas-v18');
const SENHA_DIRETORIA = '1101';

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
  const servidor = await subirServidor(Number(process.env.CAP_PORTA) || 8794);
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

  // 390px é a largura do celular que o time usa — a placa tem de caber INTEIRA aí, sem
  // corte e sem palavra partida no meio. É por isso que a foto é nessa medida.
  const ctx = await navegador.newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.addInitScript(guardaDeEscrita);
  await page.addInitScript((id) => { try { localStorage.setItem('zeluz_device_id', id); } catch (e) { /* sem localStorage o app barra e o erro aparece na tela */ } }, aparelhos[0]);
  await page.goto(URL, { waitUntil: 'load' });
  await estabilizar(page);
  await page.screenshot({ path: path.join(SAIDA, 'entrada-placa-B.png') });

  // A foto sozinha não prova que nada estourou: medimos a placa contra a janela e
  // conferimos que o texto que apareceu é o texto ditado.
  const medida = await page.evaluate(() => {
    const el = document.getElementById('entradaPlaca');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const etiquetas = [].map.call(el.querySelectorAll('.entrada-placa-etiqueta'), (e) => e.textContent);
    const st = getComputedStyle(el);
    return {
      texto: el.innerText.replace(/\n+/g, ' | '),
      largura: Math.round(r.width), altura: Math.round(r.height),
      // A rolagem lateral da PAGINA nao serve de medida aqui: a barra lateral do app mora
      // fora da tela (left negativo) enquanto ninguem entrou, e isso e de nascenca. O que
      // importa e a placa: ela cabe na janela e nada dentro dela vaza da propria caixa.
      dentroDaJanela: r.left >= -0.5 && r.right <= window.innerWidth + 0.5,
      nadaVazaDaPlaca: [].every.call(el.querySelectorAll('*'), function (e) {
        var c = e.getBoundingClientRect();
        return c.left >= r.left - 0.5 && c.right <= r.right + 0.5;
      }),
      etiquetas: etiquetas,
      fita: st.backgroundImage.indexOf('repeating-linear-gradient') >= 0,
      clicavel: st.pointerEvents !== 'none',
    };
  });
  console.log('entrada-placa-B.png — ' + JSON.stringify(medida, null, 1));
  const ok = medida && medida.dentroDaJanela && medida.nadaVazaDaPlaca && medida.fita
    && !medida.clicavel && medida.etiquetas.join(',') === 'VIOLAÇÃO,INACEITÁVEL';
  await ctx.close();
  await navegador.close();
  pararTudo();
  console.log(ok ? 'OK — a placa B coube em 390px, com as duas etiquetas e sem ser clicável.'
                 : 'FALHOU — confira a medida acima.');
  process.exit(ok ? 0 : 1);
})();
