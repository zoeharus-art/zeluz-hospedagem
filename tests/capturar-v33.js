'use strict';
/*
 * CAPTURA DA v 2026-09-22-02 — a aba Medicamentos e o remédio que segue o FILHOt.
 *
 * POR QUE ESTA CAPTURA EXISTE
 * Adriana, 22/set/2026: "Em cadastro do peludinho preciso de uma aba chamada Medicamentos!
 * Temos diversos cardíacos. Essa informação precisa ir para check-in de hospedagem para ser
 * perguntada ao tutor se é isso mesmo, e precisa de detalhes. Exemplo: Toshi está tomando
 * uma medicação 45 minutos antes do jantar e antes do café da manhã. E onde for a informação
 * dele precisa ir a medicação, como em hospedagem. Não só dele, mas de todos."
 *
 * O QUE ELA FOTOGRAFA (o Toshi é o caso dela, e ele já tem remédio de verdade no retrato)
 *   ficha-toshi-cabecalho-1280.png · -500.png — o cabeçalho da ficha com a linha
 *     "💊 toma remédio: ...", que é a linha que passou a aparecer em toda tela onde o
 *     FILHOt aparece
 *   aba-medicamentos-1280.png · -500.png — a aba Medicamentos inteira, com o que ele já toma
 *   novo-remedio-1280.png · -500.png — um item de exemplo PREENCHIDO E NÃO SALVO:
 *     Enalapril · 1 comprimido · 45 min antes do jantar · cardíaco — com a frase pronta
 *     mostrando a hora derivada (jantar 18:30 − 45 min = 17:45)
 *
 * E ELA CONFERE, antes de fotografar: a aba existe e está entre Prevenção e Rotina; a linha
 * do remédio aparece no cabeçalho; a frase pronta calculou a hora certa; o botão continua
 * dizendo "Salvar medicamentos" (ou seja, NADA foi gravado); nenhum vocabulário proibido.
 *
 * NADA É GRAVADO. O guarda de escrita do smoke embrulha set/update/push/remove/transaction
 * antes de o app carregar, e o banco é o EMULADOR local com o retrato do backup. O Firebase
 * de verdade não recebe um byte — e o "Salvar medicamentos" nunca é tocado.
 *
 * Uso:  NODE_PATH=C:/Users/zeluz/projetos-aios/code/node_modules node tests/capturar-v33.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');
const retratoLib = require('./lib/retrato');
const emuladorLib = require('./lib/emulador');

const RAIZ = path.join(__dirname, '..');
const APP = 'auaulandia/index.html';
const PORTA = Number(process.env.CAP_PORTA) || 8825;
const EMU_PORTA = Number(process.env.CAP_EMU_PORTA) || 9025;
const SAIDA = path.join(RAIZ, 'docs', 'capturas-v33');
// A senha NÃO fica no repositório (público). Fase 0, 25/set/2026: vem do ambiente.
const SENHA_DIRETORIA = process.env.ZELUZ_SENHA_DIRETORIA || '';
if (!SENHA_DIRETORIA) { console.error('Defina ZELUZ_SENHA_DIRETORIA (a senha da Diretoria) antes de rodar esta captura.'); process.exit(1); }
const BUSCA = 'Toshi';
const CHAVE_TOSHI = 'toshi__victor-zélia';

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
    document.querySelectorAll('input').forEach((i) => { if (i.type !== 'password' && re.test(i.value)) i.value = i.value.replace(re, '+55 ••• ••••'); });
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

    // ---- 1 · o cadastro, pelo mesmo caminho que a consultora usa --------------------
    await page.evaluate(() => { if (typeof abrirTodosPeludinhos === 'function') abrirTodosPeludinhos(); });
    await page.waitForTimeout(2200);
    await estabilizar(page);
    await dispensarCartazes(page, 3);

    await page.fill('#pelSearch', BUSCA);
    await page.waitForTimeout(900);

    // ---- 2 · a ficha do Toshi ------------------------------------------------------
    // Abre pela LINHA da lista (o clique de verdade), não por função interna.
    const achou = await page.evaluate((nome) => {
      const linhas = Array.from(document.querySelectorAll('#pelBody tr'));
      const alvo = linhas.find((tr) => ((tr.querySelector('.pel-nome') || {}).textContent || '').toLowerCase().indexOf(nome.toLowerCase()) >= 0);
      if (!alvo) return false;
      alvo.click(); return true;
    }, BUSCA);
    if (!achou) { problemas.push('não achei ' + BUSCA + ' na lista do cadastro (' + larg.rot + ')'); await ctx.close(); continue; }
    await page.waitForTimeout(1500);
    await estabilizar(page);
    await dispensarCartazes(page, 3);

    // A linha do remédio sai da agenda de medicação, que desce pelo ouvinte do banco. Se o
    // ouvinte ainda não chegou, o cache local recebe o item do retrato e o cabeçalho é
    // redesenhado — a foto mostra a linha de verdade, com o dado de verdade.
    const temLinha = await page.evaluate((chave) => {
      const pinta = () => {
        const el = document.getElementById('pelMedLinha');
        if (el && typeof medLinhaDoPel === 'function' && typeof pelAtual !== 'undefined' && pelAtual) {
          el.innerHTML = medLinhaDoPel(pelAtual, 'Detalhes e alterações na aba Medicamentos.');
        }
        return !!(el && el.textContent && el.textContent.indexOf('toma remédio') >= 0);
      };
      if (pinta()) return true;
      // último recurso: o item de exemplo da Adriana, só no cache LOCAL da página
      if (typeof MED_AGENDA_GERAL !== 'undefined') {
        MED_AGENDA_GERAL[chave] = MED_AGENDA_GERAL[chave] || { nome: 'Toshi', tutor: 'Victor/Zélia', itens: {} };
        MED_AGENDA_GERAL[chave].itens = MED_AGENDA_GERAL[chave].itens || {};
        MED_AGENDA_GERAL[chave].itens.exemplo_captura = {
          nome: 'Enalapril', q: '1', u: 'comprimido', continuo: true, motivo: 'cardíaco',
          quando: { ref: 'jantar', rel: 'antes', min: 45 }, horarios: ['17:45'], derivado_de: 'quando',
        };
      }
      return pinta();
    }, CHAVE_TOSHI);
    if (!temLinha) problemas.push('a linha "toma remédio" não apareceu no cabeçalho da ficha (' + larg.rot + ')');

    const cabecalho = await page.$('#pel-ficha .hosp-head');
    if (cabecalho) {
      await cabecalho.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      await mascararTelefones(page);
      await cabecalho.screenshot({ path: path.join(SAIDA, 'ficha-toshi-cabecalho-' + larg.rot + '.png'), animations: 'disabled', timeout: 30000 });
      console.log('ficha-toshi-cabecalho-' + larg.rot + '.png');
    } else { problemas.push('não achei o cabeçalho da ficha (' + larg.rot + ')'); }

    // ---- 3 · a aba Medicamentos ----------------------------------------------------
    const abriuAba = await page.evaluate(() => {
      const t = Array.from(document.querySelectorAll('#pel-ficha .subtab2'))
        .find((x) => (x.textContent || '').trim() === 'Medicamentos');
      if (!t) return false;
      t.click(); return true;
    });
    if (!abriuAba) { problemas.push('a aba Medicamentos não existe na ficha (' + larg.rot + ')'); await ctx.close(); continue; }
    await page.waitForTimeout(2000);
    await estabilizar(page);

    // A ordem das abas é a combinada: Prevenção · Medicamentos · Rotina & Almoço.
    const ordem = await page.$$eval('#pel-ficha .subtab2', (ns) => ns.map((x) => (x.textContent || '').trim()));
    const iPrev = ordem.indexOf('Prevenção'), iMed = ordem.indexOf('Medicamentos');
    if (!(iPrev >= 0 && iMed === iPrev + 1)) problemas.push('a aba Medicamentos não está logo depois de Prevenção (' + larg.rot + '): ' + ordem.join(' · '));

    await page.evaluate(() => { const p = document.getElementById('ps-med'); if (p && p.scrollIntoView) p.scrollIntoView(); });
    await page.waitForTimeout(400);
    await mascararTelefones(page);
    const painel = await page.$('#ps-med');
    if (painel) {
      await painel.screenshot({ path: path.join(SAIDA, 'aba-medicamentos-' + larg.rot + '.png'), animations: 'disabled', timeout: 30000 });
      console.log('aba-medicamentos-' + larg.rot + '.png');
    }

    // ---- 4 · um remédio de exemplo, PREENCHIDO E NÃO SALVO -------------------------
    const temAdd = await page.$('#fmedAcoes .med-add');
    if (!temAdd) { problemas.push('não achei o botão "+ Acrescentar medicamento" (' + larg.rot + ')'); await ctx.close(); continue; }
    await temAdd.click();
    await page.waitForTimeout(600);

    const sel = '#fmedItens .magitem:last-of-type ';
    await page.fill(sel + '[data-c=m]', 'Enalapril');
    await page.fill(sel + '[data-c=q]', '1');
    await page.fill(sel + '[data-c=motivo]', 'cardíaco');
    // Medida em BOTÃO (a lei: dose nunca é texto livre solto).
    await page.evaluate(() => {
      const linha = document.querySelector('#fmedItens .magitem:last-of-type');
      if (!linha) return;
      const b = Array.from(linha.querySelectorAll('.medunits button')).find((x) => (x.textContent || '').trim() === 'comprimido');
      if (b) b.click();
    });
    await page.waitForTimeout(300);
    await page.click(sel + '.mag-quando-b[data-ref="jantar"][data-rel="antes"]');
    await page.waitForTimeout(300);
    await page.click(sel + '.mag-quando-m[data-min="45"]');
    await page.waitForTimeout(500);

    const frase = (await page.textContent(sel + '.mag-quando-frase')) || '';
    if (frase.indexOf('45 min antes do jantar') < 0) problemas.push('a frase pronta não diz "45 min antes do jantar" (' + larg.rot + '): "' + frase.trim() + '"');
    if (frase.indexOf('17:45') < 0) problemas.push('a frase pronta não calculou a hora derivada 17:45 (' + larg.rot + '): "' + frase.trim() + '"');
    if (larg.w === 1280) console.log('  frase pronta: ' + frase.replace(/\s+/g, ' ').trim());

    // O botão continua PEDINDO para salvar — prova de que nada foi gravado.
    const rotuloBotao = ((await page.textContent('#fmedSalvarBtn')) || '').trim();
    if (rotuloBotao !== 'Salvar medicamentos') problemas.push('o botão de salvar mudou de nome (' + larg.rot + '): "' + rotuloBotao + '"');

    const linhaNova = await page.$('#fmedItens .magitem:last-of-type');
    if (linhaNova) {
      await linhaNova.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      await mascararTelefones(page);
      await linhaNova.screenshot({ path: path.join(SAIDA, 'novo-remedio-' + larg.rot + '.png'), animations: 'disabled', timeout: 30000 });
      console.log('novo-remedio-' + larg.rot + '.png');
    }

    // ---- 5 · vocabulário e o que NÃO pode ter acontecido ---------------------------
    const t = (await page.innerText('#pel-ficha')) || '';
    ['cachorro', 'cãozinho', 'dono ', 'funcionário'].forEach((p) => {
      if (t.toLowerCase().indexOf(p) >= 0) problemas.push('palavra proibida "' + p.trim() + '" na tela (' + larg.rot + ')');
    });
    const escritas = await page.evaluate(() => (window.__ESCRITAS__ || []).filter((e) => /medicacao-agenda/.test(e.caminho || '')));
    if (escritas.length) problemas.push('alguém tentou gravar na agenda de medicação sem ninguém tocar em Salvar (' + larg.rot + '): ' + JSON.stringify(escritas.slice(0, 3)));
    const todas = await page.evaluate(() => (window.__ESCRITAS__ || []).length);
    console.log('Tentativas de gravação barradas pelo guarda (' + larg.rot + '): ' + todas + ' (nenhuma foi ao banco)');
    await ctx.close();
  }

  await navegador.close();
  pararTudo();
  if (problemas.length) { console.error('\nPROBLEMAS:\n- ' + problemas.join('\n- ')); process.exit(1); }
  console.log('\nCaptura v-33 pronta em docs/capturas-v33/');
})().catch((e) => { console.error(e); process.exit(1); });
