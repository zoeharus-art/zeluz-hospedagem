'use strict';
/*
 * CAPTURAS DA v 2026-09-08-07 — os três dashboards, a Linha do tempo e o menu da Central.
 *
 * POR QUE: nesta versão o Painel do Dia foi DISSOLVIDO — cada bloco dele foi para a mesa
 * de quem age sobre ele. Adriana julga pela imagem, e precisa VER onde cada coisa foi
 * parar antes de aprovar.
 *
 * O BANCO É DE MENTIRA. Sobe o emulador local (tests/lib/emulador.js) carregado com o
 * retrato do backup da VPS e abre o app com ?emulador=9002. O Firebase de verdade não
 * recebe um byte — e, por cima disso, o mesmo guarda do smoke embrulha set/update/push/
 * remove/transaction: toda tentativa de gravação é ANOTADA e NÃO executada.
 *
 * Uso: NODE_PATH=C:/Users/zeluz/projetos-aios/code/node_modules node docs/capturas-v07/capturar.js
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');
const retratoLib = require('../../tests/lib/retrato');
const emuladorLib = require('../../tests/lib/emulador');

const RAIZ = path.join(__dirname, '..', '..');
const APP = 'auaulandia/index.html';
const SAIDA = __dirname;
const PORTA = 8795;
const EMU = Number(process.env.CAP_EMU_PORTA) || 9002;

function servidor() {
  const tipos = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml',
    '.webp': 'image/webp', '.jpg': 'image/jpeg', '.json': 'application/json' };
  const srv = http.createServer((req, res) => {
    const rel = decodeURIComponent(String(req.url || '/').split('?')[0]).replace(/^\/+/, '');
    const alvo = path.join(RAIZ, rel);
    if (!alvo.startsWith(RAIZ)) { res.writeHead(403).end(); return; }
    fs.readFile(alvo, (e, buf) => {
      if (e) { res.writeHead(404).end(); return; }
      res.writeHead(200, { 'Content-Type': tipos[path.extname(alvo).toLowerCase()] || 'application/octet-stream' });
      res.end(buf);
    });
  });
  return new Promise((res) => srv.listen(PORTA, '127.0.0.1', () => res(srv)));
}

// O mesmo espírito do guarda do smoke: escrita anotada, nunca executada.
function guardaDeEscrita() {
  window.__ESCRITAS__ = [];
  const anotar = (op, caminho) => { window.__ESCRITAS__.push({ op, caminho }); };
  const embrulhar = () => {
    if (typeof firebase === 'undefined' || !firebase.database) return false;
    const R = firebase.database.Reference && firebase.database.Reference.prototype;
    if (!R || R.__guardado) return !!(R && R.__guardado);
    ['set', 'update', 'push', 'remove', 'transaction', 'setWithPriority'].forEach((m) => {
      if (typeof R[m] !== 'function') return;
      R[m] = function () { anotar(m, String(this.toString?.() || '')); return Promise.resolve(); };
    });
    R.__guardado = true;
    window.__GUARDA_OK__ = true;
    return true;
  };
  if (!embrulhar()) {
    const t = setInterval(() => { if (embrulhar()) clearInterval(t); }, 5);
    setTimeout(() => clearInterval(t), 60000);
  }
}

async function limpar(page) {
  await page.evaluate(() => {
    ['zAlertaoBox', 'zEscolhaBox'].forEach((id) => { const el = document.getElementById(id); if (el) el.remove(); });
  });
}

async function entrar(navegador, base, largura, senha, nome, aparelho) {
  const ctx = await navegador.newContext({ viewport: { width: largura, height: 1400 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.addInitScript(guardaDeEscrita);
  await page.addInitScript((id) => { try { localStorage.setItem('zeluz_device_id', id); } catch (e) { /* sem storage */ } }, aparelho);
  await page.goto(base + '/' + APP + '?emulador=' + EMU, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof DB !== 'undefined' && !!DB, null, { timeout: 45000 });
  await page.waitForTimeout(1500);
  await page.fill('#loginPwd', senha);
  await page.click('.login-btn');
  await page.waitForTimeout(1500);
  const pedeNome = await page.$('#loginPessoa');
  if (pedeNome) { await page.fill('#loginPessoa', nome); await page.click('#zCampoOk'); await page.waitForTimeout(1200); }
  await page.waitForTimeout(2500);
  await limpar(page);
  const entrou = await page.evaluate(() => ({
    role: document.body.dataset.role || '',
    login: getComputedStyle(document.getElementById('loginScreen')).display,
    quem: ((document.getElementById('whoName') || {}).textContent || '').trim(),
  }));
  if (entrou.login !== 'none') { await ctx.close(); throw new Error('não entrou com a senha dada'); }
  console.log('entrou como', entrou.quem, '· papel:', entrou.role);
  return { ctx, page };
}

async function abrirItem(page, categoria, dataV, espera) {
  await page.evaluate((c) => {
    const cat = document.querySelector('#nav a.nav-parent[data-acc-toggle="' + c + '"]');
    if (cat) cat.click();
  }, categoria);
  await page.waitForTimeout(400);
  await page.evaluate((v) => {
    const a = document.querySelector('#nav a[data-v="' + v + '"]');
    if (a) a.click(); else if (typeof irParaView === 'function') irParaView(v);
  }, dataV);
  await page.waitForTimeout(espera || 9000);
  await limpar(page);
}

async function tirar(page, arquivo) {
  await page.screenshot({ path: path.join(SAIDA, arquivo), fullPage: true });
  const escritas = await page.evaluate(() => window.__ESCRITAS__ || []);
  console.log('captura:', arquivo, '· escritas tentadas (todas bloqueadas):', JSON.stringify(escritas));
}

async function main() {
  fs.mkdirSync(SAIDA, { recursive: true });
  const retrato = retratoLib.carregar();
  const versao = (/APP_VERSAO='([^']+)'/.exec(fs.readFileSync(path.join(RAIZ, APP), 'utf8')) || [])[1] || '';
  const emulador = await emuladorLib.subir({
    porta: EMU, retrato, versaoApp: versao,
    regras: fs.readFileSync(path.join(RAIZ, 'database.rules.v2.json'), 'utf8'),
    log: (m) => console.log('Emulador: ' + m),
  });
  const srv = await servidor();
  const base = 'http://127.0.0.1:' + PORTA;

  // A supervisão é cadastrada no banco (vem do RETRATO). Gestão e Diretoria têm senha FIXA
  // no HTML — é assim que o smoke-navegador também entra. Nenhuma senha é escrita aqui:
  // as do banco saem do retrato, e as fixas o próprio app já publica.
  const gente = ((retrato.daycare.config || {}).monitores || []).filter(Boolean);
  const sup = gente.find((m) => m && m.role === 'supervisor' && m.senha);
  const gestao = { senha: '0902', nome: 'Márcia · Gestora' };
  const dir = { senha: '1101', nome: 'Adriana · Gestão Total' };
  const aparelho = Object.keys(retrato.auaulandia.aparelhos || {}).sort()[0];
  if (!sup) { console.error('nenhuma supervisão com senha no retrato'); process.exit(1); }
  if (!aparelho) { console.error('nenhum aparelho autorizado no retrato'); process.exit(1); }

  const navegador = await chromium.launch({ headless: true });
  try {
    // 1 · Dashboard da Adriana (diretoria) — Plantão agora, protocolos e o gráfico do tempo
    {
      const s = await entrar(navegador, base, 1440, String(dir.senha), dir.nome, aparelho);
      await abrirItem(s.page, 'paineis', 'painel-diretoria', 12000);
      await tirar(s.page, 'dashboard-adriana.png');
      await s.ctx.close();
    }
    // 2 · Dashboard da Márcia (gestão) — Urgente a resolver, protocolos e o gráfico do tempo
    {
      const s = await entrar(navegador, base, 1440, String(gestao.senha), gestao.nome, aparelho);
      await abrirItem(s.page, 'paineis', 'paineloperacao', 12000);
      await tirar(s.page, 'dashboard-marcia.png');
      // 4 · a Linha do tempo do dia — a tela nova da Operação (mesma sessão, é so-master)
      await abrirItem(s.page, 'operacao', 'linhadotempo', 7000);
      await tirar(s.page, 'linha-do-tempo.png');
      // 5 · o menu da Central Zêluz aberto, nas três partes
      await s.page.evaluate(() => {
        ['central', 'c-peludinhos', 'c-auaulandia', 'c-daycare'].forEach((c) => {
          const a = document.querySelector('#nav a.nav-parent[data-acc-toggle="' + c + '"]');
          const acc = a && a.closest('.acc');
          if (acc && !acc.classList.contains('acc-open')) a.click();
        });
      });
      await s.page.waitForTimeout(900);
      const nav = await s.page.$('#sidebar');
      await nav.screenshot({ path: path.join(SAIDA, 'menu-central.png') });
      console.log('captura: menu-central.png');
      await s.ctx.close();
    }
    // 3 · Dashboard da Amanda (supervisão) — prevenção vencida e falta pesar
    {
      const s = await entrar(navegador, base, 1440, String(sup.senha), sup.nome, aparelho);
      await abrirItem(s.page, 'paineis', 'painel-amanda', 12000);
      await tirar(s.page, 'dashboard-amanda.png');
      await s.ctx.close();
    }
  } finally {
    await navegador.close();
    srv.close();
    try { emulador.parar(); } catch (e) { /* já parou */ }
  }
  console.log('pronto — as capturas estão em docs/capturas-v07/');
}
main().catch((e) => { console.error('ERRO:', e); process.exit(1); });
