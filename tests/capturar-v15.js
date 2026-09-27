'use strict';
/*
 * CAPTURAS DA v 2026-09-15-02 — o plano que só grava no Confirmar.
 *
 * Abre o app de verdade (servidor local + EMULADOR carregado com o retrato do backup,
 * nunca o Firebase real), entra como Diretoria, abre a ficha de um FILHOt com plano e
 * fotografa as três telas da entrega:
 *
 *   1. bloco-plano-seletor-e-faixa.png  — o bloco Plano com o seletor "Aulas por semana"
 *                                          e a faixa amarela de dado inconsistente
 *   2. cartaz-confira-antes-de-gravar.png — o resumo que aparece ao tocar em Confirmar
 *   3. historico-e-desfazer.png          — "Renovações anteriores" com o botão Desfazer
 *
 * NADA É GRAVADO: o mesmo guarda de escrita do smoke embrulha set/update/push/remove antes
 * de o app carregar, e a inconsistência/histórico usados na foto são injetados apenas na
 * memória da página (pelCadCache), nunca no banco.
 *
 * Uso:  NODE_PATH=C:/Users/zeluz/projetos-aios/code/node_modules node tests/capturar-v15.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const { chromium } = require('playwright');
const retratoLib = require('./lib/retrato');
const emuladorLib = require('./lib/emulador');

const RAIZ = path.join(__dirname, '..');
const APP = 'auaulandia/index.html';
const EMU_PORTA = Number(process.env.CAP_EMU_PORTA) || 9001;
const SAIDA = path.join(RAIZ, 'docs', 'capturas-v15');
const LARGURA = 1280;
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
  const servidor = await subirServidor(Number(process.env.CAP_PORTA) || 8791);
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
  const ctx = await navegador.newContext({ viewport: { width: LARGURA, height: 1400 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.addInitScript(guardaDeEscrita);

  // aparelho autorizado: reaproveita um id que já existe no retrato (leitura pura)
  const aparelhos = Object.keys((retrato.auaulandia && retrato.auaulandia.aparelhos) || {}).sort();
  if (!aparelhos.length) { console.error('Nenhum aparelho autorizado no retrato.'); process.exit(1); }
  await page.addInitScript((id) => { try { localStorage.setItem('zeluz_device_id', id); } catch (e) { /* sem localStorage o app barra e o erro aparece na tela */ } }, aparelhos[0]);

  await page.goto(servidor.base + '/' + APP + '?emulador=' + EMU_PORTA, { waitUntil: 'load' });
  await estabilizar(page);
  await page.fill('#loginPwd', SENHA_DIRETORIA);
  await page.click('.login-btn');
  await page.waitForTimeout(1800);
  await estabilizar(page);
  // dispensa cartaz de aviso, se houver
  for (let i = 0; i < 3; i++) {
    const b = await page.$('#zAlertaoOk'); if (!b) break;
    await b.click(); await page.waitForTimeout(400);
  }

  const entrou = await page.evaluate(() => document.body.dataset.role || '');
  if (!entrou) { console.error('Não entrou no app.'); await navegador.close(); process.exit(1); }
  console.log('Entrou como: ' + entrou);

  // ---- abre a ficha de um FILHOt COM plano mensal e monta o cenário da foto ----
  const alvo = await page.evaluate(() => {
    // escolhe o primeiro auluno ativo com plano Silver/Gold/Black
    let idx = -1;
    for (let i = 0; i < PELUDINHOS.length; i++) {
      const p = PELUDINHOS[i]; if (pelInativo(p)) continue;
      const r = renovDe(pelExtra(p));
      if (['Silver', 'Gold', 'Black'].indexOf(r.plano) >= 0) { idx = i; break; }
    }
    if (idx < 0) return null;
    const p = PELUDINHOS[idx], k = pelKey(p);
    // SÓ NA MEMÓRIA DA PÁGINA: o dado torto do caso Cookie (plano gravado 2x, 1 dia marcado)
    // e um histórico para o botão Desfazer aparecer. Nada disso vai para o banco.
    pelCadCache[k] = pelCadCache[k] || {};
    pelCadCache[k].dias = ['ter'];
    pelCadCache[k].freq = '1x';
    pelCadCache[k].renov = Object.assign({}, renovDe(pelExtra(p)), { aulas: 2, inicio: '2026-09-11', ordemPet: 1 });
    pelCadCache[k].renov_hist = { h1: { plano: 'Silver', aulas: 1, inicio: '2026-06-01', fim: '2026-06-30',
      mesRenov: 'junho de 2026', substituidoEm: Date.now() - 86400000 * 92, por: 'Amanda Silva', motivo: 'renovação' } };
    try { localStorage.removeItem('zeluz_pel_' + k); } catch (e) { /* sem cópia local vale o cache */ }
    irParaView('ficha');
    abrirPeludinho(idx);
    const bt = Array.prototype.find.call(document.querySelectorAll('.subtab2'), (b) => (b.getAttribute('onclick') || '').indexOf("'ps-plano'") >= 0);
    if (bt) pelSubtab(bt, 'ps-plano');
    return { nome: pelNome(p), tutor: pelGet(p, 'tutor'), k: k };
  });
  if (!alvo) { console.error('Nenhum FILHOt com plano mensal no retrato.'); await navegador.close(); process.exit(1); }
  console.log('Ficha aberta: ' + alvo.nome + ' · ' + alvo.tutor);
  await page.waitForTimeout(900);

  // ---- 1. o bloco Plano: seletor Nx + faixa de inconsistência ----
  const bloco = await page.$('#planoBloco');
  if (!bloco) { console.error('Não achei #planoBloco.'); await navegador.close(); process.exit(1); }
  await bloco.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await bloco.screenshot({ path: path.join(SAIDA, 'bloco-plano-seletor-e-faixa.png') });
  const temFaixa = await page.$('#planoIncoerente');
  const temSeletor = await page.$('#planoAulasSeg');
  console.log('1/3 bloco-plano-seletor-e-faixa.png — faixa: ' + !!temFaixa + ' · seletor Nx: ' + !!temSeletor);

  // ---- 3. histórico + Desfazer (antes do cartaz, que cobre a tela) ----
  const hist = await page.$('#renovHist');
  if (hist) {
    await hist.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await hist.screenshot({ path: path.join(SAIDA, 'historico-e-desfazer.png') });
    const temBt = await page.$('#renovDesfazer');
    console.log('2/3 historico-e-desfazer.png — botão Desfazer: ' + !!temBt);
  } else { console.error('Não achei #renovHist.'); }

  // ---- 2. o cartaz de conferência ao tocar em Confirmar ----
  await page.click('#planoConfirmar');
  await page.waitForTimeout(900);
  const cartaz = await page.$('#zAlertaoBox');
  if (cartaz) {
    await cartaz.screenshot({ path: path.join(SAIDA, 'cartaz-confira-antes-de-gravar.png') });
    const titulo = await page.evaluate(() => (document.querySelector('#zAlertaoBox div div') || {}).textContent || '');
    console.log('3/3 cartaz-confira-antes-de-gravar.png — título: ' + titulo.trim());
  } else { console.error('O cartaz de conferência não apareceu.'); }

  // ---- a prova: nenhuma gravação escapou (o Confirmar não foi confirmado) ----
  const escritas = await page.evaluate(() => (window.__ESCRITAS__ || []).filter((e) => /cadastro/.test(e.caminho)));
  console.log('Gravações no cadastro capturadas pelo guarda (devem ser 0): ' + escritas.length +
    (escritas.length ? ' · ' + JSON.stringify(escritas.slice(0, 3)) : ''));

  await navegador.close();
  pararTudo();
  console.log('Capturas em: ' + SAIDA);
  process.exit(0);
})().catch((e) => { console.error('FALHA NAS CAPTURAS:', e); process.exit(1); });
