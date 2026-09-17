'use strict';
/*
 * CAPTURA DA v 2026-09-17-04 — o cartão "Cadastro incompleto" recolhido, no check-in.
 *
 * POR QUE ESTA CAPTURA EXISTE
 * Adriana, 17/set/2026, fazendo o check-in da Lisa (tutora Nilce, aluna há anos): o cartão
 * de cadastro incompleto aparecia INTEIRO, exposto, e incomoda — a ficha está boa, o que
 * falta é detalhe. Agora ele nasce recolhido: uma linha só, que abre ao toque. Continua
 * sendo aviso — nunca travou o check-in e continua não travando.
 *
 * O QUE ELA FOTOGRAFA
 *   checkin-cadastro-recolhido.png — duas metades na mesma imagem: em cima, o cartão
 *   RECOLHIDO como a consultora vê ao abrir a ficha; embaixo, o mesmo cartão ABERTO, com
 *   o "Preencher agora" de cada item e o botão "Não tem microchip".
 *
 * NADA É GRAVADO: o mesmo guarda de escrita do smoke embrulha set/update/push/remove antes
 * de o app carregar, e o banco é o EMULADOR local com o retrato do backup.
 *
 * Uso:  NODE_PATH=C:/Users/zeluz/projetos-aios/code/node_modules node tests/capturar-v22b.js
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
const SAIDA = path.join(RAIZ, 'docs', 'capturas-v22');
const SENHA_DIRETORIA = '1101';

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

// Nada vai para o banco. A tentativa é anotada e a promessa volta OK.
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

  // 390 px — o celular da consultora, que é onde o check-in acontece.
  const ctx = await navegador.newContext({ viewport: { width: 390, height: 1000 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.addInitScript(guardaDeEscrita);
  await page.addInitScript((id) => { try { localStorage.setItem('zeluz_device_id', id); } catch (e) { /* sem localStorage o app barra e o erro aparece na tela */ } }, aparelhos[0]);
  // O aparelho NUNCA viu este cartão: é assim que se prova que ele nasce recolhido.
  await page.addInitScript(() => { try { localStorage.removeItem('zeluz_ci_cadfalta_aberto'); } catch (e) { /* sem localStorage vale o padrão recolhido */ } });
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

  // ===================================== o check-in, com um FILHOt de cadastro incompleto
  const alvo = await page.evaluate(() => {
    abrirItemDoMenu('checkin');
    // Escolhe quem REALMENTE tem cadastro incompleto — o cartão só existe para esse.
    var i = (PELUDINHOS || []).findIndex(function (p) {
      try { return (cadastroFaltando(p) || []).length > 0; } catch (e) { return false; }
    });
    if (i < 0) i = 0;
    ciEscolher(i);
    var p = PELUDINHOS[i] || {};
    return { nome: (typeof pelNome === 'function') ? pelNome(p) : (p.n || ''),
             falta: (cadastroFaltando(p) || []).map(function (f) { return f.t; }) };
  });
  await page.waitForTimeout(1200);
  console.log('FILHOt escolhido: ' + alvo.nome + ' — falta: ' + JSON.stringify(alvo.falta));
  if (!alvo.falta.length) problemas.push('nenhum FILHOt do retrato tem cadastro incompleto: a captura não prova nada');

  const estado = () => page.evaluate(() => {
    const card = document.getElementById('ciCadFaltaCard') || {};
    const corpo = document.getElementById('ciCadFaltaCorpo') || {};
    const cab = document.getElementById('ciCadFaltaCab');
    return {
      cardVisivel: (card.style || {}).display !== 'none',
      corpoAberto: (corpo.style || {}).display === 'block',
      aria: cab ? cab.getAttribute('aria-expanded') : '',
      resumo: (document.getElementById('ciCadFaltaResumo') || {}).textContent || '',
      alturaDoToque: cab ? Math.round(cab.getBoundingClientRect().height) : 0,
      temNaoTemMicrochip: /Não tem microchip/.test((document.getElementById('ciCadFaltaCampos') || {}).innerText || ''),
      temPreencherAgora: /Preencher agora/.test((document.getElementById('ciCadFaltaCampos') || {}).innerText || ''),
    };
  });

  const fechado = await estado();
  console.log('Recolhido: ' + JSON.stringify(fechado));
  if (!fechado.cardVisivel) problemas.push('o cartão não apareceu — sem ele não há o que fotografar');
  if (fechado.corpoAberto) problemas.push('o cartão NASCEU ABERTO: era exatamente isso que devia deixar de acontecer');
  if (fechado.aria !== 'false') problemas.push('o cabeçalho não diz que está recolhido (aria-expanded=' + fechado.aria + ')');
  if (!/toque para ver/.test(fechado.resumo)) problemas.push('a linha única não convida ao toque: ' + fechado.resumo);
  if (fechado.alturaDoToque < 44) problemas.push('o alvo do toque tem só ' + fechado.alturaDoToque + 'px (o mínimo é 44)');

  const cartao = async () => (await page.evaluateHandle(() => document.getElementById('ciCadFaltaCard'))).asElement();
  // O cartão aberto é mais alto que a tela. Foto de elemento mais alto que a janela sai
  // com retalhos de quem está em volta, então a janela cresce ATÉ o cartão caber.
  const caberNaTela = async () => {
    const h = await page.evaluate(() => {
      const c = document.getElementById('ciCadFaltaCard');
      return c ? Math.ceil(c.getBoundingClientRect().height) : 0;
    });
    await page.setViewportSize({ width: 390, height: Math.max(700, Math.min(4000, h + 260)) });
    await page.waitForTimeout(400);
  };
  await caberNaTela();
  let el = await cartao();
  if (!el) { problemas.push('não achei o cartão na tela'); }
  else {
    await el.scrollIntoViewIfNeeded(); await page.waitForTimeout(300);
    await el.screenshot({ path: path.join(SAIDA, '_tmp-recolhido.png') });
  }

  // ===================================== e agora aberto, com os atalhos de cada item
  await page.evaluate(() => { ciCadFaltaAlternar(); });
  await page.waitForTimeout(500);
  const aberto = await estado();
  console.log('Aberto: ' + JSON.stringify(aberto));
  if (!aberto.corpoAberto) problemas.push('o toque não abriu o cartão');
  if (aberto.aria !== 'true') problemas.push('o cabeçalho não diz que está aberto (aria-expanded=' + aberto.aria + ')');
  if (!aberto.temPreencherAgora) problemas.push('nenhum item ganhou o atalho "Preencher agora"');
  const faltaChip = alvo.falta.some((t) => /Microchip/i.test(t));
  if (faltaChip && !aberto.temNaoTemMicrochip) problemas.push('falta o microchip e o botão "Não tem microchip" não está na tela');

  await caberNaTela();
  el = await cartao();
  if (el) {
    await el.scrollIntoViewIfNeeded(); await page.waitForTimeout(300);
    await el.screenshot({ path: path.join(SAIDA, '_tmp-aberto.png') });
  }

  // As duas metades viram UMA imagem: o antes e o depois do toque, lado a lado na
  // vertical. Sem biblioteca de imagem — é o próprio navegador que monta a folha.
  const b64 = (f) => fs.readFileSync(path.join(SAIDA, f)).toString('base64');
  const folha = await ctx.newPage();
  await folha.setViewportSize({ width: 430, height: 900 });
  await folha.setContent(`<!doctype html><meta charset="utf-8">
    <style>
      body{margin:0;background:#FFFDF6;font:600 13px/1.4 system-ui,sans-serif;color:#234D67;padding:16px}
      h3{margin:0 0 6px;font-size:13.5px;font-weight:800}
      p{margin:0 0 14px;font-size:12px;color:#5b6b76;font-weight:600}
      img{width:100%;display:block;border:1px solid rgba(35,77,103,.18);border-radius:12px}
      .par{margin-bottom:20px}
    </style>
    <div class="par"><h3>1. Como a consultora vê ao abrir a ficha</h3>
      <p>Uma linha só. O cartão nasce recolhido e não trava nada.</p>
      <img src="data:image/png;base64,${b64('_tmp-recolhido.png')}"></div>
    <div class="par"><h3>2. Depois do toque</h3>
      <p>Cada item com "Preencher agora" — e o microchip com "Não tem microchip".</p>
      <img src="data:image/png;base64,${b64('_tmp-aberto.png')}"></div>`,
    { waitUntil: 'load' });
  await folha.waitForTimeout(500);
  await folha.screenshot({ path: path.join(SAIDA, 'checkin-cadastro-recolhido.png'), fullPage: true });
  await folha.close();
  ['_tmp-recolhido.png', '_tmp-aberto.png'].forEach((f) => { try { fs.unlinkSync(path.join(SAIDA, f)); } catch (e) { /* já não estava lá */ } });
  console.log('checkin-cadastro-recolhido.png — o cartão recolhido e o mesmo cartão aberto');

  // ===================================== a restrição que se CONFIRMA, em vez de perguntar
  // Adriana: "não pode perguntar toda vez; precisa confirmar se continua não tendo."
  const restr = await page.evaluate(() => {
    const p = PELUDINHOS[(PELUDINHOS || []).findIndex(function (x) {
      try { return (cadastroFaltando(x) || []).length > 0; } catch (e) { return false; }
    })] || PELUDINHOS[0];
    const k = pelKey(p);
    // O selo é o que a ficha JÁ teria depois de alguém responder "Não" num check-in
    // anterior. Só o retrato local muda — nada vai para o banco (o guarda embrulha).
    pelCadCache[k] = Object.assign({}, pelCadCache[k] || {}, {
      restricao: '', alergia: '',
      restricao_nenhuma: { quem: 'Amanda Silva', ts: new Date(2026, 8, 17, 10, 0, 0).getTime() },
      alergia_nenhuma: { quem: 'Amanda Silva', ts: new Date(2026, 8, 17, 10, 0, 0).getTime() },
    });
    ciRenderRestricao(pelExtra(p));
    const h2 = [].find.call(document.querySelectorAll('#v-checkin h2'), function (h) {
      return /Restrição \/ Alergia/.test(h.textContent || '');
    });
    const card = h2 ? h2.closest('.card') : null;
    if (card) card.id = 'zCapRestricao';
    return {
      achou: !!card,
      perguntaEscondida: (document.getElementById('ciRestricaoPergunta') || {}).style.display === 'none',
      texto: ((document.getElementById('ciRestricaoConfirma') || {}).innerText || '').replace(/\s+/g, ' ').trim(),
    };
  });
  console.log('Restrição confirmada: ' + JSON.stringify(restr));
  if (!restr.achou) problemas.push('não achei o cartão "Restrição / Alergia" na tela do check-in');
  if (!restr.perguntaEscondida) problemas.push('com o selo na ficha a PERGUNTA continuou na tela — era isso que devia parar');
  if (!/confirmado em 17\/09 por Amanda Silva/.test(restr.texto)) problemas.push('a linha não diz desde quando e por quem: ' + restr.texto);
  if (!/Continua assim/.test(restr.texto)) problemas.push('falta o botão "Continua assim"');
  if (restr.achou) {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.waitForTimeout(300);
    const cr = (await page.evaluateHandle(() => document.getElementById('zCapRestricao'))).asElement();
    if (cr) {
      await cr.scrollIntoViewIfNeeded(); await page.waitForTimeout(300);
      await cr.screenshot({ path: path.join(SAIDA, 'checkin-restricao-confirmada.png') });
      console.log('checkin-restricao-confirmada.png — a pergunta deu lugar a "Continua assim"');
    }
  }

  const escritas = await page.evaluate(() => (window.__ESCRITAS__ || []).length);
  console.log('Tentativas de gravação barradas pelo guarda: ' + escritas + ' (nenhuma foi ao banco)');

  await navegador.close();
  pararTudo();
  if (problemas.length) { console.error('\nPROBLEMAS:\n- ' + problemas.join('\n- ')); process.exit(1); }
  console.log('\nCaptura v-22b pronta em docs/capturas-v22/');
})().catch((e) => { console.error(e); process.exit(1); });
