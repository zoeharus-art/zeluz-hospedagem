'use strict';
/*
 * CAPTURA DA v 2026-09-21-02 — o peso na busca do cadastro.
 *
 * POR QUE ESTA CAPTURA EXISTE
 * Adriana, 21/set/2026: "preciso que a informação peso esteja na busca do cliente aludindo
 * com a data do último peso. em cadastro do peludinho, ao procurar aparece a raça, quantas
 * vezes vem e os dias, tutor, idade e último peso."
 *
 * As colunas da tabela já traziam raça, dias, tutor e idade — mas no celular a tabela quebra
 * e a consultora precisa rolar de lado para juntar as peças. Agora existe UMA linha embaixo
 * do nome com tudo na ordem em que ela fala, e com o que faltava: o último peso COM a data.
 *
 * O QUE ELA FOTOGRAFA
 *   busca-cookie-1280.png · busca-cookie-500.png — a tela "Cadastro de Peludinhos" com
 *     "Cookie" digitado na busca: os resultados, cada um com a linha secundária embaixo
 *     do nome (raça · Nx por semana (dias) · tutor: ... · idade · último peso: X em dd/mm)
 *   linha-cookie-1280.png · linha-cookie-500.png — a PRIMEIRA linha de resultado de perto,
 *     para conferir a frase letra por letra
 *
 * E ELA CONFERE, antes de fotografar: a busca filtrou de verdade; cada resultado tem a
 * linha secundária; a linha traz as cinco informações; nenhum vocabulário proibido escapou.
 *
 * NADA É GRAVADO nem a ficha é aberta: só se digita na busca. O mesmo guarda de escrita do
 * smoke embrulha set/update/push/remove/transaction antes de o app carregar, e o banco é o
 * EMULADOR local com o retrato do backup. O Firebase de verdade não recebe um byte.
 *
 * Uso:  NODE_PATH=C:/Users/zeluz/projetos-aios/code/node_modules node tests/capturar-v29.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');
const retratoLib = require('./lib/retrato');
const emuladorLib = require('./lib/emulador');

const RAIZ = path.join(__dirname, '..');
const APP = 'auaulandia/index.html';
const PORTA = Number(process.env.CAP_PORTA) || 8818;
const EMU_PORTA = Number(process.env.CAP_EMU_PORTA) || 9018;
const SAIDA = path.join(RAIZ, 'docs', 'capturas-v29');
// A senha NÃO fica no repositório (público). Fase 0, 25/set/2026: vem do ambiente.
const SENHA_DIRETORIA = process.env.ZELUZ_SENHA_DIRETORIA || '';
if (!SENHA_DIRETORIA) { console.error('Defina ZELUZ_SENHA_DIRETORIA (a senha da Diretoria) antes de rodar esta captura.'); process.exit(1); }
const BUSCA = 'Cookie';

// ------------------------------------------------------------------ servidor local
function tipoDe(p) {
  return ({ '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp',
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
    srv.listen(porta, '127.0.0.1', () => res({
      base: 'http://127.0.0.1:' + porta,
      parar: () => { try { srv.close(); } catch (e) { /* já fechou */ } },
    }));
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

// Telefone de tutor não vai para foto que mora no repositório público: antes de cada foto,
// todo texto com número de telefone vira "+55 ••• ••••".
async function mascararTelefones(page) {
  await page.evaluate(() => {
    const re = /(\+?55\s?)?\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4}/g;
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nos = []; let n; while ((n = w.nextNode())) nos.push(n);
    nos.forEach((t) => { if (re.test(t.nodeValue)) t.nodeValue = t.nodeValue.replace(re, '+55 ••• ••••'); });
    document.querySelectorAll('textarea').forEach((ta) => { if (re.test(ta.value)) ta.value = ta.value.replace(re, '+55 ••• ••••'); });
  });
}
async function estabilizar(page) {
  try { await page.waitForLoadState('networkidle', { timeout: 8000 }); } catch (e) { /* rede não aquietou: segue com a folga abaixo */ }
  await page.waitForTimeout(1200);
}
async function dispensarCartazes(page, quantos) {
  for (let i = 0; i < (quantos || 6); i++) {
    const b = await page.$('#zAlertaoOk'); if (!b) break;
    await b.click(); await page.waitForTimeout(400);
  }
}

(async () => {
  fs.mkdirSync(SAIDA, { recursive: true });
  const servidor = await subirServidor(PORTA);
  const retrato = retratoLib.carregar();
  const versao = (/APP_VERSAO='([^']+)'/.exec(fs.readFileSync(path.join(RAIZ, APP), 'utf8')) || [])[1] || '';

  const emulador = await emuladorLib.subir({
    porta: EMU_PORTA, retrato, versaoApp: versao,
    regras: fs.readFileSync(path.join(RAIZ, 'database.rules.v2.json'), 'utf8'),
    log: (m) => console.log('Emulador: ' + m),
  });
  const pararTudo = () => {
    try { emulador.parar(); } catch (e) { /* já parou */ }
    try { servidor.parar(); } catch (e) { /* já parou */ }
  };
  process.on('exit', pararTudo);

  const navegador = await chromium.launch({ headless: true });
  const aparelhos = Object.keys((retrato.auaulandia && retrato.auaulandia.aparelhos) || {}).sort();
  if (!aparelhos.length) { console.error('Nenhum aparelho autorizado no retrato.'); process.exit(1); }
  const URL = servidor.base + '/' + APP + '?emulador=' + EMU_PORTA;
  const problemas = [];

  // As duas larguras da lei: 1280 (o computador da Gestão) e 500 (o mínimo de celular).
  const LARGURAS = [{ w: 1280, rot: '1280' }, { w: 500, rot: '500' }];

  for (const larg of LARGURAS) {
    const ctx = await navegador.newContext({ viewport: { width: larg.w, height: 1000 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.addInitScript(guardaDeEscrita);
    await page.addInitScript((id) => { try { localStorage.setItem('zeluz_device_id', id); } catch (e) { /* sem localStorage o app barra e o erro aparece na tela */ } }, aparelhos[0]);
    await page.goto(URL, { waitUntil: 'load' });
    await estabilizar(page);
    await page.fill('#loginPwd', SENHA_DIRETORIA);
    await page.click('.login-btn');
    await page.waitForTimeout(1800);
    await estabilizar(page);
    await dispensarCartazes(page);
    const papel = await page.evaluate(() => document.body.dataset.role || '');
    if (!papel) { console.error('Não entrou no app (' + larg.rot + ').'); await navegador.close(); pararTudo(); process.exit(1); }
    if (larg.w === 1280) console.log('Entrou como: ' + papel);

    // ---- 1 · a tela do cadastro ----------------------------------------------------
    // Pelo mesmo caminho que a consultora usa: o item do menu, não uma função interna.
    await page.evaluate(() => { if (typeof abrirTodosPeludinhos === 'function') abrirTodosPeludinhos(); });
    await page.waitForTimeout(2200);
    await estabilizar(page);
    await dispensarCartazes(page, 3);

    const tela = await page.$('#v-ficha');
    if (!tela) { problemas.push('a tela #v-ficha não existe (' + larg.rot + ')'); await ctx.close(); continue; }

    // ---- 2 · a busca ---------------------------------------------------------------
    const todos = await page.$$eval('#pelBody tr', (ns) => ns.length);
    await page.fill('#pelSearch', BUSCA);
    await page.waitForTimeout(900);
    const achados = await page.$$eval('#pelBody tr', (ns) => ns.length);
    if (!achados) problemas.push('a busca por "' + BUSCA + '" não achou ninguém (' + larg.rot + ')');
    if (achados >= todos) problemas.push('a busca não filtrou nada (' + larg.rot + '): ' + achados + ' de ' + todos);

    // ---- 3 · a linha secundária, resultado por resultado ----------------------------
    const linhas = await page.$$eval('#pelBody tr .pel-busca-sub', (ns) => ns.map((x) => (x.textContent || '').replace(/\s+/g, ' ').trim()));
    if (linhas.length !== achados) {
      problemas.push('nem todo resultado tem a linha secundária (' + larg.rot + '): '
        + linhas.length + ' linhas para ' + achados + ' resultados');
    }
    linhas.forEach((l, i) => {
      if (l.indexOf('último peso: ') < 0) problemas.push('a linha ' + (i + 1) + ' não traz o último peso (' + larg.rot + '): "' + l + '"');
    });
    if (larg.w === 1280) linhas.forEach((l) => console.log('  ' + l));

    // Nenhum vocabulário proibido pode ter escapado para a tela.
    const t = (await tela.innerText()) || '';
    ['cachorro', 'cãozinho', 'dono ', 'funcionário'].forEach((p) => {
      if (t.toLowerCase().indexOf(p) >= 0) problemas.push('palavra proibida "' + p.trim() + '" na tela (' + larg.rot + ')');
    });

    // ---- 4 · as fotos --------------------------------------------------------------
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await mascararTelefones(page);
    await page.screenshot({ path: path.join(SAIDA, 'busca-cookie-' + larg.rot + '.png') });
    console.log('busca-cookie-' + larg.rot + '.png · ' + achados + ' resultado(s) de ' + todos);

    const primeira = await page.$('#pelBody tr');
    if (primeira) {
      await primeira.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      await mascararTelefones(page);
      await primeira.screenshot({ path: path.join(SAIDA, 'linha-cookie-' + larg.rot + '.png'),
        animations: 'disabled', timeout: 30000 });
      console.log('linha-cookie-' + larg.rot + '.png');
    }

    // A ficha NÃO é aberta: esta captura é só da busca.
    const abriu = await page.evaluate(() => {
      const fi = document.getElementById('pel-ficha');
      return !!(fi && fi.style.display !== 'none');
    });
    if (abriu) problemas.push('a ficha abriu sem ninguém ter clicado (' + larg.rot + ')');

    const escritas = await page.evaluate(() => (window.__ESCRITAS__ || []).length);
    console.log('Tentativas de gravação barradas pelo guarda (' + larg.rot + '): ' + escritas + ' (nenhuma foi ao banco)');
    await ctx.close();
  }

  await navegador.close();
  pararTudo();
  if (problemas.length) { console.error('\nPROBLEMAS:\n- ' + problemas.join('\n- ')); process.exit(1); }
  console.log('\nCaptura v-29 pronta em docs/capturas-v29/');
})().catch((e) => { console.error(e); process.exit(1); });
