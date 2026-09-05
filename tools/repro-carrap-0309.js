'use strict';
// Reprodução do Bug A (04/set/2026): "Lançamentos do dia" em 03/09 mostra carrapaticida
// zerado? Abre o app REAL no navegador (guarda de escrita ligado: NADA grava), entra como
// Gestão, abre a tela dashdc, troca o dia para 2026-09-03 e fotografa DASH_DADOS + DOM.
// Uso: NODE_PATH=C:/Users/zeluz/projetos-aios/code/node_modules node tools/repro-carrap-0309.js
const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');

const RAIZ = path.join(__dirname, '..');

function servidor(porta) {
  return new Promise((res, rej) => {
    const srv = http.createServer((q, s) => {
      const alvo = path.join(RAIZ, decodeURIComponent(q.url.split('?')[0]).replace(/^\/+/, ''));
      fs.readFile(alvo, (e, b) => {
        if (e) { s.statusCode = 404; return s.end('nao achei'); }
        const ext = path.extname(alvo).toLowerCase();
        s.setHeader('Content-Type', ext === '.html' ? 'text/html; charset=utf-8' : ext === '.js' ? 'text/javascript' : 'application/octet-stream');
        s.end(b);
      });
    });
    srv.listen(porta, '127.0.0.1', () => res(srv));
    srv.on('error', rej);
  });
}

// guarda de escrita (mesma ideia do smoke): anota e NÃO grava
function guarda() {
  window.__ESCRITAS__ = [];
  const anotar = (m, c) => { try { window.__ESCRITAS__.push(m + ' ' + c); } catch (e) {} };
  const emb = () => {
    const fb = window.firebase;
    if (!fb || !fb.database || !fb.database.Reference) return false;
    const R = fb.database.Reference.prototype;
    if (R.__g) return true;
    ['set', 'update', 'remove'].forEach((m) => { const o = R[m]; if (typeof o === 'function') R[m] = function () { anotar(m, String(this)); return Promise.resolve(); }; });
    if (typeof R.transaction === 'function') R.transaction = function () { anotar('transaction', String(this)); return Promise.resolve({ committed: false, snapshot: null }); };
    const p0 = R.push;
    R.push = function (v, cb) { if (v === undefined) return p0.call(this); anotar('push', String(this)); const n = p0.call(this); if (cb) try { cb(null); } catch (e) {} return n; };
    R.__g = true; return true;
  };
  if (!emb()) { const t = setInterval(() => { if (emb()) clearInterval(t); }, 5); setTimeout(() => clearInterval(t), 60000); }
}

(async () => {
  const srv = await servidor(8797);
  const nav = await chromium.launch();
  const ctx = await nav.newContext({ viewport: { width: 1440, height: 1800 } });
  const page = await ctx.newPage();
  await page.addInitScript(guarda);
  const erros = [];
  page.on('pageerror', (e) => erros.push('pageerror: ' + String(e && e.message || e).slice(0, 200)));
  page.on('console', (m) => { if (m.type() === 'error') erros.push('console: ' + m.text().slice(0, 200)); });

  await page.goto('http://127.0.0.1:8797/auaulandia/index.html', { waitUntil: 'load' });
  await page.waitForFunction(() => typeof DB !== 'undefined' && !!DB, null, { timeout: 45000 });
  await page.fill('#loginPwd', '0902');
  await page.click('.login-btn');
  await page.waitForTimeout(2500);
  await page.evaluate(() => { ['zAlertaoBox', 'zEscolhaBox'].forEach((id) => { const el = document.getElementById(id); if (el) el.remove(); }); });

  // abre a tela de Lançamentos do dia e troca para 03/09
  await page.evaluate(() => { if (typeof mostrarView === 'function') mostrarView('dashdc'); });
  await page.waitForTimeout(2500);
  await page.evaluate(() => { dashTrocarDia('2026-09-03'); });
  await page.waitForTimeout(4000);

  const foto = await page.evaluate(() => {
    const d = (typeof DASH_DADOS !== 'undefined' && DASH_DADOS) || {};
    const porItem = {};
    Object.keys(d).forEach((k) => { porItem[k] = Object.keys(d[k] || {}).length; });
    const bloco = Array.from(document.querySelectorAll('#dashBlocos .card h2'))
      .map((h) => (h.textContent || '').trim()).filter((t) => /Carrapaticida/i.test(t));
    const card = Array.from(document.querySelectorAll('#dashBlocos .card'))
      .find((c) => /Carrapaticida/i.test((c.querySelector('h2') || {}).textContent || ''));
    return {
      dia: (typeof dashDia === 'function') ? dashDia() : '?',
      porItem,
      tituloCarrap: bloco,
      cardTexto: card ? card.innerText.slice(0, 400) : '(card não achado)',
      escritas: (window.__ESCRITAS__ || []).slice(0, 20)
    };
  });
  console.log(JSON.stringify(foto, null, 2));
  console.log('erros de página:', JSON.stringify(erros.slice(0, 10)));
  await nav.close();
  srv.close();
})().catch((e) => { console.error('FALHOU:', e); process.exit(1); });
