'use strict';
/*
 * CAPTURA DA v 2026-09-18-01 — "Recebimentos do mês" nos dois dashboards.
 *
 * POR QUE ESTA CAPTURA EXISTE
 * Adriana, 18/set/2026: "Plano e cobranças.. delete lançar pagamentos.. inútil, a soma dos
 * recebimentos vai para o meu dashboard e da Márcia com os valores, quanto foi de
 * mensalidade, trimestral e semestral esse mês de setembro, quanto foi de diária avulsa e
 * etc.. não faz sentido ter mais algo."
 *
 * O QUE ELA FOTOGRAFA
 *   dashboard-adriana-1280.png · dashboard-adriana-500.png — o painel inteiro
 *   dashboard-marcia-1280.png  · dashboard-marcia-500.png  — o painel inteiro
 *   recebimentos-adriana-1280.png · recebimentos-adriana-500.png — só o quadro novo
 *   recebimentos-marcia-1280.png  · recebimentos-marcia-500.png  — o MESMO quadro, no
 *   painel da Márcia (é a mesma função: as duas fotos têm de mostrar os mesmos valores).
 *
 * E ELA CONFERE, antes de fotografar: o quadro saiu do "ainda lendo", traz as linhas por
 * tipo, o total em R$ 1.234,56, a diária avulsa SEM VALOR — e o menu NÃO tem mais o item
 * "Lançar pagamento". Foto bonita com tela errada não serve de prova.
 *
 * NADA É GRAVADO: o mesmo guarda de escrita do smoke embrulha set/update/push/remove antes
 * de o app carregar, e o banco é o EMULADOR local com o retrato do backup.
 *
 * Uso:  NODE_PATH=C:/Users/zeluz/projetos-aios/code/node_modules node tests/capturar-v23.js
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
const SAIDA = path.join(RAIZ, 'docs', 'capturas-v23');
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

// Espera o quadro sair do "ainda lendo". Devolve o texto dele — ou '' se nunca chegou.
async function esperarQuadro(page, id, segundos) {
  const ate = Date.now() + (segundos || 25) * 1000;
  for (;;) {
    const t = await page.evaluate((sel) => {
      const el = document.getElementById(sel);
      return el ? (el.innerText || '') : '';
    }, id);
    if (t && t.indexOf('Ainda não sei dizer') < 0 && /Total de/.test(t)) return t;
    if (Date.now() > ate) return t || '';
    await page.waitForTimeout(700);
  }
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
  const PAINEIS = [
    { view: 'painel-diretoria', card: 'pdirCardRecebimentos', nome: 'adriana', titulo: 'Dashboard da Adriana' },
    { view: 'paineloperacao', card: 'poCardRecebimentos', nome: 'marcia', titulo: 'Dashboard da Márcia' },
  ];
  const textos = {};

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

    // O menu NÃO tem mais o item que saiu — é a primeira prova, antes de qualquer foto.
    const menu = await page.evaluate(() => ({
      temLancar: !!document.querySelector('#nav a[data-v="lancar-pagamento"]'),
      itens: document.querySelectorAll('#nav a[data-v]').length,
    }));
    if (menu.temLancar) problemas.push('o item "Lançar pagamento" AINDA está no menu (' + larg.rot + ')');
    if (larg.w === 1280) console.log('Itens de menu com data-v: ' + menu.itens + ' · "Lançar pagamento" presente: ' + menu.temLancar);

    for (const p of PAINEIS) {
      await page.evaluate((v) => { if (typeof abrirItemDoMenu === 'function') abrirItemDoMenu(v); }, p.view);
      await page.waitForTimeout(2200);
      await estabilizar(page);
      const texto = await esperarQuadro(page, p.card, 25);
      textos[p.nome + '-' + larg.rot] = texto;
      if (!texto) problemas.push('o quadro dos recebimentos não apareceu no ' + p.titulo + ' (' + larg.rot + ')');
      else {
        if (texto.indexOf('Ainda não sei dizer') >= 0) problemas.push(p.titulo + ' (' + larg.rot + '): o quadro ficou no "ainda lendo"');
        ['Mensalidade', 'Trimestral', 'Semestral', 'Hospedagem na AuAulândia', 'Diária avulsa', 'Total de']
          .forEach((linha) => { if (texto.indexOf(linha) < 0) problemas.push(p.titulo + ' (' + larg.rot + '): faltou a linha "' + linha + '"'); });
        if (texto.indexOf('sem valor') < 0) problemas.push(p.titulo + ' (' + larg.rot + '): a diária avulsa devia aparecer SEM VALOR');
        if (!/R\$ \d{1,3}(\.\d{3})*,\d{2}/.test(texto)) problemas.push(p.titulo + ' (' + larg.rot + '): nenhum valor no formato R$ 1.234,56');
      }

      // 1 · o quadro sozinho, recortado
      const alvo = await page.$('#' + p.card + ' article');
      if (alvo) {
        await alvo.scrollIntoViewIfNeeded();
        await page.waitForTimeout(400);
        await alvo.screenshot({ path: path.join(SAIDA, 'recebimentos-' + p.nome + '-' + larg.rot + '.png') });
        console.log('recebimentos-' + p.nome + '-' + larg.rot + '.png');
      } else problemas.push('não achei o cartão para recortar no ' + p.titulo + ' (' + larg.rot + ')');

      // 2 · o painel inteiro
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(SAIDA, 'dashboard-' + p.nome + '-' + larg.rot + '.png'), fullPage: true });
      console.log('dashboard-' + p.nome + '-' + larg.rot + '.png');
    }

    const escritas = await page.evaluate(() => (window.__ESCRITAS__ || []).length);
    console.log('Tentativas de gravação barradas pelo guarda (' + larg.rot + '): ' + escritas + ' (nenhuma foi ao banco)');
    await ctx.close();
  }

  // MORDIDA FINAL: é a MESMA função nos dois painéis — os valores têm de ser IDÊNTICOS.
  const soValores = (t) => (String(t || '').match(/R\$ [\d.]+,\d{2}/g) || []).join(' | ');
  LARGURAS.forEach((l) => {
    const a = soValores(textos['adriana-' + l.rot]);
    const m = soValores(textos['marcia-' + l.rot]);
    if (!a || a !== m) problemas.push('os valores divergem entre os dois painéis (' + l.rot + '): [' + a + '] x [' + m + ']');
  });
  console.log('\nValores lidos no quadro (1280): ' + soValores(textos['adriana-1280']));

  await navegador.close();
  pararTudo();
  if (problemas.length) { console.error('\nPROBLEMAS:\n- ' + problemas.join('\n- ')); process.exit(1); }
  console.log('\nCaptura v-23 pronta em docs/capturas-v23/');
})().catch((e) => { console.error(e); process.exit(1); });
