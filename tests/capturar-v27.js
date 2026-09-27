'use strict';
/*
 * CAPTURA DA v 2026-09-19-05 — Pendências de prevenção e a senha da ponte de Hospedagem.
 *
 * POR QUE ESTA CAPTURA EXISTE
 * Adriana, 18/set/2026: "se o peludo não estiver lá no dia, igual hoje, tá lá que o Batata
 * tem que tomar vermífugo. No entanto, o Batata não foi hoje. Então isso precisa de um
 * alerta avisando que vira uma pendência para colocar para o próximo dia que o Batata vier…
 * é uma pendência dentro do daycare, onde elas precisam entrar e ver."
 * E, no mesmo dia: em Configurações › Valores da hospedagem a palavra-chave da ponte ainda
 * aparecia ESCRITA na tela. A ponte do Day Care já fazia o certo desde 19/ago.
 *
 * O QUE ELA FOTOGRAFA
 *   pendencias-1280.png · pendencias-500.png — a tela nova com a pendência do Batata
 *     (vermífugo do dia 18/09) e os DOIS botões: "Resolvido hoje" e "Tirar pendência"
 *   config-ponte-1280.png · config-ponte-500.png — só o bloco da ponte em Configurações ›
 *     Valores da hospedagem, provando que a senha NÃO aparece (campo vazio, type="password",
 *     e ao lado apenas "✓ senha guardada")
 *
 * E ELA CONFERE, antes de fotografar: o item existe no menu com o contador; a tela lista a
 * pendência do Batata com o item, o dia e o que estava lançado; os dois botões estão lá; o
 * campo #orcShToken é type="password", nasce sem `value` e a senha guardada no retrato não
 * aparece em lugar nenhum do HTML da tela.
 * Os botões "Resolvido hoje" e "Tirar pendência" NÃO são apertados: eles gravam.
 *
 * NADA É GRAVADO: o mesmo guarda de escrita do smoke embrulha set/update/push/remove/
 * transaction antes de o app carregar, e o banco é o EMULADOR local com o retrato do backup.
 * A pendência de exemplo é semeada NO RETRATO (em memória), antes de o emulador subir — o
 * Firebase de verdade não recebe um byte.
 *
 * Uso:  NODE_PATH=C:/Users/zeluz/projetos-aios/code/node_modules node tests/capturar-v27.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');
const retratoLib = require('./lib/retrato');
const emuladorLib = require('./lib/emulador');

const RAIZ = path.join(__dirname, '..');
const APP = 'auaulandia/index.html';
const PORTA = Number(process.env.CAP_PORTA) || 8815;
const EMU_PORTA = Number(process.env.CAP_EMU_PORTA) || 9015;
const SAIDA = path.join(RAIZ, 'docs', 'capturas-v27');
// A senha NÃO fica no repositório (público). Fase 0, 25/set/2026: vem do ambiente.
const SENHA_DIRETORIA = process.env.ZELUZ_SENHA_DIRETORIA || '';
if (!SENHA_DIRETORIA) { console.error('Defina ZELUZ_SENHA_DIRETORIA (a senha da Diretoria) antes de rodar esta captura.'); process.exit(1); }

// A pendência de exemplo: o Batata existe no retrato (daycare/cadastro/batata__roberta) e é
// o FILHOt da frase dela. Vermífugo lançado no dia 18/09, dia em que ele não veio.
const CHAVE_EX = 'batata__roberta';
const PENDENCIA_EX = {
  vermifugo: {
    dia: '2026-09-18', dias: ['2026-09-18'], item: 'vermifugo',
    valor: 'Batata/SRD (1 COMPRIMIDO · NA BOLSA)', base: 'Batata/SRD', hora: '',
    det: { qtd: '1 COMPRIMIDO', onde: 'NA BOLSA' },
    nome: 'Batata', tutor: 'Roberta Correa Vaz de Melo',
    origem: 'lancamento', criado_ts: Date.parse('2026-09-18T17:40:00-03:00'),
    criado_por: 'sistema', status: 'aberta',
  },
};

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

async function estabilizar(page) {
  try { await page.waitForLoadState('networkidle', { timeout: 8000 }); } catch (e) { /* rede não aquietou: segue com a folga abaixo */ }
  await page.waitForTimeout(1200);
}

(async () => {
  fs.mkdirSync(SAIDA, { recursive: true });
  const servidor = await subirServidor(PORTA);
  const retrato = retratoLib.carregar();
  // A pendência de exemplo entra NO RETRATO (em memória), antes de o emulador subir.
  retrato.daycare = retrato.daycare || {};
  retrato.daycare.pendencias = Object.assign({}, retrato.daycare.pendencias || {},
    { [CHAVE_EX]: PENDENCIA_EX });
  // Ele veio HOJE: é assim que o quadro dos dashboards e o aviso da chegada fazem sentido.
  const hoje = retrato.dia;
  retrato.daycare.chamada = retrato.daycare.chamada || {};
  retrato.daycare.chamada[hoje] = Object.assign({}, retrato.daycare.chamada[hoje] || {},
    { [CHAVE_EX]: 'veio' });

  const versao = (/APP_VERSAO='([^']+)'/.exec(fs.readFileSync(path.join(RAIZ, APP), 'utf8')) || [])[1] || '';
  // A senha guardada no retrato — é ela que NÃO pode aparecer. Nunca é impressa no console.
  const senhaGuardada = String((((retrato.auaulandia || {}).config || {}).orcamento || {}).sheets
    ? retrato.auaulandia.config.orcamento.sheets.token || '' : '');

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
    for (let i = 0; i < 6; i++) {
      const b = await page.$('#zAlertaoOk'); if (!b) break;
      await b.click(); await page.waitForTimeout(400);
    }
    const papel = await page.evaluate(() => document.body.dataset.role || '');
    if (!papel) { console.error('Não entrou no app (' + larg.rot + ').'); await navegador.close(); pararTudo(); process.exit(1); }
    if (larg.w === 1280) console.log('Entrou como: ' + papel);

    // ---- 1 · o item do menu e a tela de Pendências ---------------------------------
    const itemMenu = await page.$('#nav a[data-v="pendencias"]');
    if (!itemMenu) problemas.push('não achei o item "Pendências de prevenção" no menu (' + larg.rot + ')');
    const rotuloMenu = itemMenu ? ((await itemMenu.innerText()) || '').replace(/\s+/g, ' ').trim() : '';
    if (itemMenu && rotuloMenu.indexOf('Pendências de prevenção') < 0) {
      problemas.push('o rótulo do item do menu não é o esperado (' + larg.rot + '): "' + rotuloMenu + '"');
    }

    await page.evaluate(() => { if (typeof abrirItemDoMenu === 'function') abrirItemDoMenu('pendencias'); });
    await page.waitForTimeout(2200);
    await estabilizar(page);
    for (let i = 0; i < 3; i++) {
      const b = await page.$('#zAlertaoOk'); if (!b) break;
      await b.click(); await page.waitForTimeout(400);
    }

    const tela = await page.$('#v-pendencias');
    if (!tela) problemas.push('a tela #v-pendencias não existe (' + larg.rot + ')');
    else {
      const t = (await tela.innerText()) || '';
      ['Batata', 'Vermífugo', '18/09', '1 COMPRIMIDO', 'Resolvido hoje', 'Tirar pendência']
        .forEach((s) => { if (t.indexOf(s) < 0) problemas.push('Pendências (' + larg.rot + '): faltou "' + s + '" na tela'); });
      const nBt = await page.$$eval('#pendRoot button', (bs) => bs.map((b) => (b.innerText || '').trim()));
      if (nBt.filter((x) => x === 'Resolvido hoje').length !== 1)
        problemas.push('esperava exatamente 1 botão "Resolvido hoje" (' + larg.rot + '): ' + JSON.stringify(nBt));
      if (nBt.filter((x) => x === 'Tirar pendência').length !== 1)
        problemas.push('esperava exatamente 1 botão "Tirar pendência" (' + larg.rot + '): ' + JSON.stringify(nBt));
      const contador = await page.$eval('#navPendN', (el) => (el.textContent || '').trim()).catch(() => '');
      if (contador !== '(1)') problemas.push('o contador do menu devia dizer "(1)" (' + larg.rot + '): "' + contador + '"');
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(400);
      await tela.screenshot({ path: path.join(SAIDA, 'pendencias-' + larg.rot + '.png') });
      console.log('pendencias-' + larg.rot + '.png');
    }

    // ---- 2 · Configurações › Valores da hospedagem: só o bloco da ponte -------------
    await page.evaluate(() => { if (typeof abrirItemDoMenu === 'function') abrirItemDoMenu('config'); });
    await page.waitForTimeout(2400);
    await estabilizar(page);
    const ponte = await page.$('#orcCfgPonte');
    if (!ponte) problemas.push('não achei o bloco da ponte em Configurações › Valores da hospedagem (' + larg.rot + ')');
    else {
      const campo = await page.evaluate(() => {
        const el = document.getElementById('orcShToken');
        if (!el) return null;
        return { tipo: el.getAttribute('type') || '', temValueNoHtml: /\svalue=/.test(el.outerHTML), valor: el.value || '' };
      });
      if (!campo) problemas.push('não achei o campo #orcShToken (' + larg.rot + ')');
      else {
        if (campo.tipo !== 'password') problemas.push('o campo da palavra-chave não é type="password" (' + larg.rot + '): "' + campo.tipo + '"');
        if (campo.temValueNoHtml) problemas.push('o campo da palavra-chave ainda nasce com value= no HTML (' + larg.rot + ')');
        if (campo.valor !== '') problemas.push('o campo da palavra-chave devia nascer VAZIO (' + larg.rot + ')');
      }
      const html = await page.$eval('#orcCfgPonte', (el) => el.innerHTML);
      if (senhaGuardada && html.indexOf(senhaGuardada) >= 0)
        problemas.push('A SENHA APARECE no HTML do bloco da ponte (' + larg.rot + ')');
      const txt = (await ponte.innerText()) || '';
      if (txt.indexOf('senha guardada') < 0)
        problemas.push('o aviso "✓ senha guardada" não aparece ao lado do campo (' + larg.rot + ')');
      if (senhaGuardada && txt.indexOf(senhaGuardada) >= 0)
        problemas.push('A SENHA APARECE no texto visível do bloco da ponte (' + larg.rot + ')');
      await ponte.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      await ponte.screenshot({ path: path.join(SAIDA, 'config-ponte-' + larg.rot + '.png') });
      console.log('config-ponte-' + larg.rot + '.png');
    }

    const escritas = await page.evaluate(() => (window.__ESCRITAS__ || []).length);
    console.log('Tentativas de gravação barradas pelo guarda (' + larg.rot + '): ' + escritas + ' (nenhuma foi ao banco)');
    await ctx.close();
  }

  await navegador.close();
  pararTudo();
  if (problemas.length) { console.error('\nPROBLEMAS:\n- ' + problemas.join('\n- ')); process.exit(1); }
  console.log('\nCaptura v-27 pronta em docs/capturas-v27/');
})().catch((e) => { console.error(e); process.exit(1); });
