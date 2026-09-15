'use strict';
/*
 * CAPTURAS DA v 2026-09-15-04 — as três entregas de 15/set/2026 (noite).
 *
 * Abre o app de verdade (servidor local + EMULADOR carregado com o retrato do backup,
 * nunca o Firebase real) e fotografa o que a Adriana precisa conferir:
 *
 *   1. config-prevencao-meses-dias.png  — 1280px, Configurações › Prevenção com o 1º aviso
 *                                          em meses e dias e a conta derivada ao lado
 *   2. config-fotos.png                 — 1280px, Configurações › Fotos do check-in do corpo
 *   3. checkin-copia-no-celular.png     — 390px (Android), o check-in do corpo com o aviso
 *                                          "Uma cópia fica em Downloads no seu celular."
 *
 * NADA É GRAVADO: o mesmo guarda de escrita do smoke embrulha set/update/push/remove/
 * transaction antes de o app carregar.
 *
 * Uso:  NODE_PATH=C:/Users/zeluz/projetos-aios/code/node_modules node tests/capturar-v17.js
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
const SAIDA = path.join(RAIZ, 'docs', 'capturas-v17');
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

  const novaPagina = async (largura, altura, extra) => {
    const ctx = await navegador.newContext(Object.assign({
      viewport: { width: largura, height: altura }, deviceScaleFactor: 1,
    }, extra || {}));
    const page = await ctx.newPage();
    await page.addInitScript(guardaDeEscrita);
    await page.addInitScript((id) => { try { localStorage.setItem('zeluz_device_id', id); } catch (e) { /* sem localStorage o app barra e o erro aparece na tela */ } }, aparelhos[0]);
    return page;
  };
  const entrarComo = async (page, senha) => {
    await page.goto(URL, { waitUntil: 'load' });
    await estabilizar(page);
    await page.fill('#loginPwd', senha);
    await page.click('.login-btn');
    await page.waitForTimeout(1800);
    await estabilizar(page);
    for (let i = 0; i < 3; i++) {
      const b = await page.$('#zAlertaoOk'); if (!b) break;
      await b.click(); await page.waitForTimeout(400);
    }
    return page.evaluate(() => document.body.dataset.role || '');
  };

  // ==================================================== 1 e 2. Configurações (computador)
  const page = await novaPagina(1280, 1400);
  const entrou = await entrarComo(page, SENHA_DIRETORIA);
  if (!entrou) { console.error('Não entrou no app.'); await navegador.close(); process.exit(1); }
  console.log('Entrou como: ' + entrou);

  await page.evaluate(() => abrirItemDoMenu('config'));
  await page.waitForTimeout(1400);
  const cardDe = (id) => page.evaluateHandle((x) => {
    const w = document.getElementById(x);
    return w ? w.closest('.card') : null;
  }, id);

  // ---- 1. Prevenção: o 1º aviso em meses e dias, com a conta derivada ----
  // O nó do emulador ainda pode não ter avisoApos — a foto precisa mostrar o campo PREENCHIDO
  // com o que a Adriana pediu (7 meses e 12 dias). Isso é feito só na memória da página.
  await page.evaluate(() => {
    AVISO_COLEIRA_APOS = { meses: 7, dias: 12 };
    if (typeof cfgPrevRender === 'function') cfgPrevRender();
  });
  await page.waitForTimeout(600);
  const cPrev = (await cardDe('cfgPrevWrap')).asElement();
  if (cPrev) {
    await cPrev.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await cPrev.screenshot({ path: path.join(SAIDA, 'config-prevencao-meses-dias.png') });
    const vals = await page.evaluate(() => ({
      seresto: (document.getElementById('cfgPrevCol_Seresto') || {}).value,
      meses: (document.getElementById('cfgPrevAposMeses') || {}).value,
      dias: (document.getElementById('cfgPrevAposDias') || {}).value,
      conta: (document.getElementById('cfgPrevAposConta') || {}).textContent,
      destaque: (document.getElementById('cfgPrevAviso2') || {}).value,
    }));
    console.log('1/3 config-prevencao-meses-dias.png — ' + JSON.stringify(vals));
  } else { console.error('Não achei o cartão de Configurações › Prevenção.'); }

  // ---- 2. Fotos do check-in do corpo ----
  const cFotos = (await cardDe('cfgFotosWrap')).asElement();
  if (cFotos) {
    await cFotos.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await cFotos.screenshot({ path: path.join(SAIDA, 'config-fotos.png') });
    const vals = await page.evaluate(() => {
      const seg = document.getElementById('cfgFotosCopia');
      const on = seg ? seg.querySelector('button.on') : null;
      return { ligado: on ? on.textContent : '(?)', rotulo: (document.querySelector('#cfgFotosWrap .cad-lb') || {}).textContent };
    });
    console.log('2/3 config-fotos.png — ' + JSON.stringify(vals));
  } else { console.error('Não achei o cartão de Configurações › Fotos.'); }
  await page.context().close();

  // ==================================================== 3. o check-in no celular (Android)
  // O aviso da cópia só aparece no Android — por isso este contexto usa userAgent de Android.
  {
    const cel = await novaPagina(390, 844, {
      userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Mobile Safari/537.36',
      isMobile: true, hasTouch: true, deviceScaleFactor: 2,
    });
    const papel = await entrarComo(cel, SENHA_DIRETORIA);
    console.log('Celular entrou como: ' + papel);
    // Abre o check-in do corpo da entrada, escolhe o 1º da turma e marca um ponto como
    // ALTERADO — é o que faz nascer o bloco da foto (e, com ele, o aviso da cópia).
    const alvo = await cel.evaluate(() => {
      // O check-in do corpo é uma ATIVIDADE dentro da tela do Day Care (v-daycare),
      // não um item de menu próprio: abre a tela, escolhe a atividade e redesenha.
      if (typeof abrirItemDoMenu === 'function') abrirItemDoMenu('daycare');
      dcAtiv = 'checkin-corpo';
      if (typeof renderAtual === 'function') renderAtual();
      const turma = (typeof turmaDoDia === 'function') ? turmaDoDia() : [];
      if (!turma.length) return null;
      const o = turma[0];
      const k = dcKey(o.p.n, o.p.tutor);
      ckAbrir(k);
      ckMarcar('pele', true);
      return { nome: pelNome(o.p), ligada: ckCopiaCelularLigada(), arquivo: ckNomeCopia('pele', '') };
    });
    await cel.waitForTimeout(1400);
    if (alvo) {
      const pt = await cel.$('#ckPt-pele');
      if (pt) {
        await pt.scrollIntoViewIfNeeded();
        await cel.waitForTimeout(400);
      }
      await cel.screenshot({ path: path.join(SAIDA, 'checkin-copia-no-celular.png') });
      const viu = await cel.evaluate(() => {
        const el = document.getElementById('ckPt-pele');
        return el ? (el.innerText.indexOf('Uma cópia fica em Downloads no seu celular.') >= 0) : false;
      });
      console.log('3/3 checkin-copia-no-celular.png — ' + JSON.stringify(alvo) + ' · aviso na tela: ' + viu);
    } else { console.error('Não achei turma do dia para abrir o check-in.'); }
    await cel.context().close();
  }

  // ---- a prova: nenhuma gravação escapou ----
  await navegador.close();
  pararTudo();
  console.log('Capturas em: ' + SAIDA);
  process.exit(0);
})().catch((e) => { console.error('FALHA NAS CAPTURAS:', e); process.exit(1); });
