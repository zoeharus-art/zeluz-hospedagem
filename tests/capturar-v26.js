'use strict';
/*
 * CAPTURA DA v 2026-09-19-04 — "Começou no meio do mês?" e os Valores do Day Care.
 *
 * POR QUE ESTA CAPTURA EXISTE
 * Adriana, 18/set/2026: "Em cadastro dos peludinhos em creche, quando o peludo começa no
 * meio do mês temos duas opções: pagar diária avulsa 170,00 cada, ou pagar o próximo mês
 * inteiro, e as diárias avulsas do mês anterior pelo valor do plano (o plano são
 * considerados 4/8/12/16/20 diárias...). Esse é o caso da Maria Eduarda e do Bethoven —
 * estou fazendo o cadastro deles e não consigo ter essa opção aqui dentro. (...) Construa
 * uma solução para isso, à prova de burros e autoexplicativa."
 *
 * O QUE ELA FOTOGRAFA
 *   config-valores-daycare-1280.png · -500.png — o cartão novo em Configurações, com a
 *     diária avulsa de R$ 170,00 editável por ela, sem programador
 *   meio-do-mes-1280.png · -500.png — o bloco "Começou no meio do mês?" na aba Plano da
 *     Cookie (tutora Yara), com a irmã Cristal na mesma conta: as duas opções abertas,
 *     linha a linha, e a mensagem para o tutor pronta para copiar
 *
 * E ELA CONFERE, antes de fotografar: o cartão dos Valores do Day Care existe e traz a
 * diária avulsa; a ficha da Cookie abre na aba Plano; o bloco do meio do mês aparece com a
 * família inteira (Cookie 1ª, Cristal 2ª), com os dois totais, com a conta das diárias
 * escrita em português e com a frase-chave da Adriana e o "Qual fica melhor para vocês?"
 * dentro da mensagem. Os botões "Tutor escolheu a opção 1 / 2" NÃO são apertados: nada
 * pode ser gravado numa captura.
 *
 * NADA É GRAVADO: o mesmo guarda de escrita do smoke embrulha set/update/push/remove antes
 * de o app carregar, e o banco é o EMULADOR local com o retrato do backup.
 *
 * Uso:  CAP_PORTA=8814 CAP_EMU_PORTA=9014 \
 *       NODE_PATH=C:/Users/zeluz/projetos-aios/code/node_modules node tests/capturar-v26.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');
const retratoLib = require('./lib/retrato');
const emuladorLib = require('./lib/emulador');

const RAIZ = path.join(__dirname, '..');
const APP = 'auaulandia/index.html';
const EMU_PORTA = Number(process.env.CAP_EMU_PORTA) || 9014;
const SAIDA = path.join(RAIZ, 'docs', 'capturas-v26');
// A senha NÃO fica no repositório (público). Fase 0, 25/set/2026: vem do ambiente.
const SENHA_DIRETORIA = process.env.ZELUZ_SENHA_DIRETORIA || '';
if (!SENHA_DIRETORIA) { console.error('Defina ZELUZ_SENHA_DIRETORIA (a senha da Diretoria) antes de rodar esta captura.'); process.exit(1); }
const CHAVE_PEL = 'cookie__yara';          // a Cookie da Yara — plano, dias às terças e uma irmã
const ANO = new Date().getFullYear();
const DIA_UM = ANO + '-09-18';             // 18/09 do ano corrente: o meio do mês dela

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

// O cabeçalho da tela é fixo e pinta POR CIMA do alto do bloco fotografado — o título
// "Começou no meio do mês?" sumia atrás dele. Some com o que é fixo só durante a foto e
// devolve tudo depois: a captura mostra o bloco inteiro, e a tela continua a mesma.
async function semBarrasFixas(page, seletor, tirarFoto) {
  await page.evaluate((sel) => {
    const alvo = document.querySelector(sel);
    window.__ESCONDIDOS__ = [];
    document.querySelectorAll('body *').forEach((el) => {
      const pos = getComputedStyle(el).position;
      if (pos !== 'fixed' && pos !== 'sticky') return;
      if (alvo && (el === alvo || el.contains(alvo) || alvo.contains(el))) return;
      window.__ESCONDIDOS__.push([el, el.style.visibility]);
      el.style.visibility = 'hidden';
    });
  }, seletor);
  try { await tirarFoto(); } finally {
    await page.evaluate(() => {
      (window.__ESCONDIDOS__ || []).forEach(([el, v]) => { el.style.visibility = v || ''; });
      window.__ESCONDIDOS__ = [];
    });
  }
}

(async () => {
  fs.mkdirSync(SAIDA, { recursive: true });
  const servidor = await subirServidor(Number(process.env.CAP_PORTA) || 8814);
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

  for (const larg of LARGURAS) {
    const ctx = await navegador.newContext({ viewport: { width: larg.w, height: 1400 }, deviceScaleFactor: 2 });
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

    // 1 · Configurações › Valores do Day Care
    await page.evaluate(() => { if (typeof abrirItemDoMenu === 'function') abrirItemDoMenu('config'); });
    await page.waitForTimeout(2200);
    await estabilizar(page);
    const cardVal = await page.$('#cardValoresDaycare');
    if (!cardVal) problemas.push('não achei o cartão "Valores do Day Care" em Configurações (' + larg.rot + ')');
    else {
      const t = (await cardVal.innerText()) || '';
      ['Valores do Day Care', 'Diária avulsa', 'R$ 170,00', 'Salvar valores']
        .forEach((s) => { if (t.indexOf(s) < 0) problemas.push('Valores do Day Care (' + larg.rot + '): faltou "' + s + '"'); });
      const campo = await page.$('#cfgDiariaAvulsa');
      if (!campo) problemas.push('a diária avulsa não é editável na tela (' + larg.rot + ')');
      await cardVal.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      await semBarrasFixas(page, '#cardValoresDaycare', () =>
        cardVal.screenshot({ path: path.join(SAIDA, 'config-valores-daycare-' + larg.rot + '.png') }));
      console.log('config-valores-daycare-' + larg.rot + '.png');
    }

    // 2 · A ficha da Cookie (tutora Yara), aba Plano, bloco "Começou no meio do mês?"
    await page.evaluate(() => { if (typeof abrirItemDoMenu === 'function') abrirItemDoMenu('ficha'); });
    await page.waitForTimeout(1800);
    await estabilizar(page);
    const achou = await page.evaluate((chave) => {
      if (typeof PELUDINHOS === 'undefined' || typeof pelKey !== 'function') return -1;
      const i = PELUDINHOS.findIndex((p) => pelKey(p) === chave);
      if (i >= 0 && typeof abrirPeludinho === 'function') abrirPeludinho(i);
      return i;
    }, CHAVE_PEL);
    if (achou < 0) { problemas.push('não achei o FILHOt ' + CHAVE_PEL + ' no cadastro (' + larg.rot + ')'); }
    else {
      await page.waitForTimeout(900);
      await page.evaluate(() => { if (typeof irParaAbaPlano === 'function') irParaAbaPlano(); });
      await page.waitForTimeout(900);
      // A data do primeiro dia, pelo caminho da tela: o campo dispara o onchange do app.
      const temCampo = await page.evaluate((iso) => {
        const el = document.getElementById('mmInicio');
        if (!el) return false;
        el.value = iso; el.dispatchEvent(new Event('change'));
        return true;
      }, DIA_UM);
      if (!temCampo) problemas.push('não achei o campo do primeiro dia (#mmInicio) na aba Plano (' + larg.rot + ')');
      await page.waitForTimeout(900);
      const bloco = await page.$('#mmBloco');
      if (!bloco) problemas.push('não achei o bloco "Começou no meio do mês?" na aba Plano (' + larg.rot + ')');
      else {
        const t = (await bloco.innerText()) || '';
        ['Começou no meio do mês?', 'Opção 1 — diárias avulsas', 'Opção 2 —',
          'Diárias que ainda caem em setembro', 'Cookie', 'Cristal',
          'Mensagem para o tutor', 'Copiar mensagem',
          'Tutor escolheu a opção 1', 'Tutor escolheu a opção 2',
        ].forEach((s) => { if (t.indexOf(s) < 0) problemas.push('bloco do meio do mês (' + larg.rot + '): faltou "' + s + '"'); });
        if (t.indexOf('caem 2 terças: 2 diárias') < 0)
          problemas.push('a conta das diárias não veio escrita ("caem 2 terças: 2 diárias") (' + larg.rot + ')');
        const msg = await page.$eval('#mmTexto', (el) => el.value || '').catch(() => '');
        ['Encaminho a nossa tabela de valores.',
          'O plano é contabilizado em mês de 4 semanas.',
          'Total da 2ª proposta:', 'Qual fica melhor para vocês?',
        ].forEach((s) => { if (msg.indexOf(s) < 0) problemas.push('mensagem para o tutor (' + larg.rot + '): faltou "' + s + '"'); });
        if (larg.w === 1280) {
          console.log('--- mensagem para o tutor ---');
          console.log(msg);
          console.log('-----------------------------');
        }
        await bloco.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        await semBarrasFixas(page, '#mmBloco', () =>
          bloco.screenshot({ path: path.join(SAIDA, 'meio-do-mes-' + larg.rot + '.png') }));
        console.log('meio-do-mes-' + larg.rot + '.png');
      }
    }

    // Nada foi confirmado: nenhuma escrita pode ter tentado ir para a ficha de ninguém.
    const escritas = await page.evaluate(() => (window.__ESCRITAS__ || []));
    const naFicha = escritas.filter((e) => /daycare\/cadastro\//.test(String(e.caminho || '')));
    if (naFicha.length) problemas.push('alguma coisa tentou gravar na ficha sem o Confirmar (' + larg.rot + '): '
      + naFicha.map((e) => e.metodo + ' ' + e.caminho).join(', '));
    console.log('Tentativas de gravação barradas pelo guarda (' + larg.rot + '): ' + escritas.length
      + ' (nenhuma foi ao banco; nas fichas: ' + naFicha.length + ')');
    await ctx.close();
  }

  await navegador.close();
  pararTudo();
  if (problemas.length) { console.error('\nPROBLEMAS:\n- ' + problemas.join('\n- ')); process.exit(1); }
  console.log('\nCaptura v-26 pronta em docs/capturas-v26/');
})().catch((e) => { console.error(e); process.exit(1); });
