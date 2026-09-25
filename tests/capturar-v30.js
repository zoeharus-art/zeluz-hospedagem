'use strict';
/*
 * CAPTURA DA v 2026-09-21-03 — a dose do vermífugo sai do peso.
 *
 * POR QUE ESTA CAPTURA EXISTE
 * Adriana, 21/set/2026: "o vermífugo funciona da seguinte forma. Peludinhos até 2 kg e até
 * 5 kg tomam meio comprimido. Peludinhos a partir de 5 kg tomam um comprimido inteiro. Se
 * for maior, se for 12 kg vai tomar um e meio, e assim consecutivamente. (…) Se o peso,
 * vamos supor, um peludo que está pesando 4,900, 4,800, precisa pesar de novo. (…) Um peludo
 * que está com 10,100 kg, talvez ele emagreceu, precisa pesar de novo. Eu preciso que o peso
 * seja vinculado, facilitando se precisa de pesar ou não."
 *
 * A régua: meio comprimido a cada 5 kg. E o peso encostado na virada não decide sozinho —
 * nesses casos a tela não sugere nada: manda pesar de novo, com o caminho para a balança.
 *
 * O QUE ELA FOTOGRAFA
 *   vermifugo-sugestao-1280.png · -500.png — o cartão Vermífugo dos Lançamentos do dia com
 *     um FILHOt de peso recente escolhido: a frase "Pelo último peso, X kg em dd/mm: N
 *     comprimido(s)" acima de "Quanto foi dado", e o botão da dose já marcado
 *   vermifugo-pesar-1280.png · -500.png — o mesmo cartão com um FILHOt encostado na virada:
 *     a faixa amarela "Pese de novo antes de dar", o botão "Abrir a balança", e NADA marcado
 *   config-valores-1280.png · -500.png — Configurações › Valores do Day Care, com os dois
 *     números novos da régua (a faixa em kg e a folga da virada)
 *
 * E ELA CONFERE, antes de fotografar: a sugestão aparece e o botão certo está marcado; no
 * caso da virada nada vem marcado e a faixa amarela está lá; os dois campos de Configurações
 * existem com valor; nenhum vocabulário proibido escapou para a tela.
 *
 * NADA É GRAVADO: o botão "Lançar na planilha" NÃO é apertado, e "Salvar valores" também
 * não. O mesmo guarda de escrita do smoke embrulha set/update/push/remove/transaction antes
 * de o app carregar, e o banco é o EMULADOR local com o retrato do backup. O Firebase de
 * verdade não recebe um byte.
 *
 * Uso:  NODE_PATH=C:/Users/zeluz/projetos-aios/code/node_modules node tests/capturar-v30.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');
const retratoLib = require('./lib/retrato');
const emuladorLib = require('./lib/emulador');

const RAIZ = path.join(__dirname, '..');
const APP = 'auaulandia/index.html';
const PORTA = Number(process.env.CAP_PORTA) || 8820;
const EMU_PORTA = Number(process.env.CAP_EMU_PORTA) || 9020;
const SAIDA = path.join(RAIZ, 'docs', 'capturas-v30');
// A senha NÃO fica no repositório (público). Fase 0, 25/set/2026: vem do ambiente.
const SENHA_DIRETORIA = process.env.ZELUZ_SENHA_DIRETORIA || '';
if (!SENHA_DIRETORIA) { console.error('Defina ZELUZ_SENHA_DIRETORIA (a senha da Diretoria) antes de rodar esta captura.'); process.exit(1); }

// Os dois FILHOts do retrato que contam a história inteira:
//  · a Cookie da Raquel pesou 6,5 kg em 01/09 — no meio da faixa, a dose sai sozinha
//  · a Belinha da Shirley pesou 4,8 kg em 28/08 — a 0,2 kg da virada, a balança vem antes
const COM_DOSE = { busca: 'Cookie', tutor: 'Raquel' };
const COM_BALANCA = { busca: 'Belinha', tutor: 'Shirley' };

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

// O cartão do Vermífugo dentro de "Lançamentos do dia" — achado pelo título, não pela ordem.
async function cartaoVermifugo(page) {
  const cards = await page.$$('#dashBlocos .card');
  for (const c of cards) {
    const t = (await c.innerText()) || '';
    if (t.indexOf('Vermífugo') >= 0) return c;
  }
  return null;
}

// Escolhe um FILHOt no cartão do Vermífugo pelo MESMO caminho da consultora: digita na
// busca e clica na sugestão que traz o tutor certo (nome sozinho não identifica ninguém).
async function escolherFilhot(page, quem, problemas, rot) {
  const trocar = await page.$('#dashBlocos .card button[onclick*="dashTrocarFilhot(\'vermifugo\')"]');
  if (trocar) { await trocar.click(); await page.waitForTimeout(700); }
  const busca = await page.$('#dashB_vermifugo');
  if (!busca) { problemas.push('o campo de busca do Vermífugo não existe (' + rot + ')'); return false; }
  await busca.fill('');
  await busca.type(quem.busca, { delay: 45 });
  await page.waitForTimeout(900);
  const achou = await page.evaluate((q) => {
    const box = document.getElementById('dashS_vermifugo');
    if (!box) return 'sem caixa de sugestões';
    const bs = Array.from(box.querySelectorAll('button'));
    const alvo = bs.filter((b) => (b.textContent || '').indexOf(q.tutor) >= 0)[0];
    if (!alvo) return 'nenhuma sugestão com o tutor ' + q.tutor + ' (' + bs.length + ' sugestões)';
    alvo.click();
    return '';
  }, quem);
  if (achou) { problemas.push(achou + ' (' + rot + ')'); return false; }
  await page.waitForTimeout(900);
  return true;
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

    // ---- 1 · Lançamentos do dia ----------------------------------------------------
    // Pelo mesmo caminho da consultora: o item do menu, não uma função interna.
    await page.evaluate(() => { if (typeof abrirItemDoMenu === 'function') abrirItemDoMenu('dashdc'); });
    await page.waitForTimeout(2400);
    await estabilizar(page);
    await dispensarCartazes(page, 3);

    const tela = await page.$('#v-dashdc');
    if (!tela) { problemas.push('a tela #v-dashdc não existe (' + larg.rot + ')'); await ctx.close(); continue; }

    // ---- 2 · quem tem peso recente: a dose vem sugerida e marcada -------------------
    if (await escolherFilhot(page, COM_DOSE, problemas, larg.rot)) {
      const est = await page.evaluate(() => {
        const d = (window.DASH_DET || {}).vermifugo || {};
        const card = Array.from(document.querySelectorAll('#dashBlocos .card'))
          .filter((c) => (c.innerText || '').indexOf('Vermífugo') >= 0)[0];
        return { qtd: d.qtd || '', txt: card ? (card.innerText || '').replace(/\s+/g, ' ') : '' };
      });
      if (est.txt.indexOf('Pelo último peso') < 0) {
        problemas.push('o cartão não mostrou a frase do peso para ' + COM_DOSE.busca + ' (' + larg.rot + '): "'
          + est.txt.slice(0, 220) + '"');
      }
      if (est.txt.indexOf('Pese de novo antes de dar') >= 0) {
        problemas.push('o peso de ' + COM_DOSE.busca + ' já envelheceu no retrato: em vez da sugestão veio a faixa '
          + 'amarela. Atualize o retrato ou troque o FILHOt desta captura (' + larg.rot + ')');
      }
      if (!est.qtd) problemas.push('a dose não veio pré-marcada para ' + COM_DOSE.busca + ' (' + larg.rot + ')');
      if (larg.w === 1280) console.log('  ' + COM_DOSE.busca + ' (' + COM_DOSE.tutor + ') · pré-marcado: "' + est.qtd + '"');

      const card = await cartaoVermifugo(page);
      if (card) {
        await card.scrollIntoViewIfNeeded();
        await page.waitForTimeout(400);
        await mascararTelefones(page);
        await card.screenshot({ path: path.join(SAIDA, 'vermifugo-sugestao-' + larg.rot + '.png'),
          animations: 'disabled', timeout: 30000 });
        console.log('vermifugo-sugestao-' + larg.rot + '.png');
      } else { problemas.push('não achei o cartão do Vermífugo (' + larg.rot + ')'); }
    }

    // ---- 3 · quem está na virada: a balança vem antes do remédio --------------------
    if (await escolherFilhot(page, COM_BALANCA, problemas, larg.rot)) {
      const est = await page.evaluate(() => {
        const d = (window.DASH_DET || {}).vermifugo || {};
        const card = Array.from(document.querySelectorAll('#dashBlocos .card'))
          .filter((c) => (c.innerText || '').indexOf('Vermífugo') >= 0)[0];
        return { temQtd: Object.prototype.hasOwnProperty.call(d, 'qtd'),
          txt: card ? (card.innerText || '').replace(/\s+/g, ' ') : '' };
      });
      if (est.txt.indexOf('Pese de novo antes de dar') < 0) {
        problemas.push('o cartão não mostrou a faixa "Pese de novo" para ' + COM_BALANCA.busca
          + ' (' + larg.rot + '): "' + est.txt.slice(0, 220) + '"');
      }
      if (est.temQtd) problemas.push('veio dose pré-marcada para quem precisa pesar de novo (' + larg.rot + ')');
      if (larg.w === 1280) console.log('  ' + COM_BALANCA.busca + ' (' + COM_BALANCA.tutor + ') · nada pré-marcado: '
        + (!est.temQtd ? 'sim' : 'NÃO'));

      const card = await cartaoVermifugo(page);
      if (card) {
        await card.scrollIntoViewIfNeeded();
        await page.waitForTimeout(400);
        await mascararTelefones(page);
        await card.screenshot({ path: path.join(SAIDA, 'vermifugo-pesar-' + larg.rot + '.png'),
          animations: 'disabled', timeout: 30000 });
        console.log('vermifugo-pesar-' + larg.rot + '.png');
      } else { problemas.push('não achei o cartão do Vermífugo (' + larg.rot + ')'); }
    }

    // Nenhum vocabulário proibido pode ter escapado para a tela.
    const t = (await tela.innerText()) || '';
    ['cachorro', 'cãozinho', 'dono ', 'funcionário'].forEach((p) => {
      if (t.toLowerCase().indexOf(p) >= 0) problemas.push('palavra proibida "' + p.trim() + '" na tela (' + larg.rot + ')');
    });

    // ---- 4 · Configurações › Valores do Day Care -----------------------------------
    await page.evaluate(() => { if (typeof abrirItemDoMenu === 'function') abrirItemDoMenu('config'); });
    await page.waitForTimeout(2400);
    await estabilizar(page);
    await dispensarCartazes(page, 3);

    const cartaoCfg = await page.$('#cardValoresDaycare');
    if (!cartaoCfg) { problemas.push('o cartão #cardValoresDaycare não existe (' + larg.rot + ')'); }
    else {
      const campos = await page.evaluate(() => {
        const v = (id) => { const e = document.getElementById(id); return e ? String(e.value || '') : null; };
        return { faixa: v('cfgVermFaixa'), margem: v('cfgVermMargem'), diaria: v('cfgDiariaAvulsa') };
      });
      if (campos.faixa === null) problemas.push('o campo da faixa do vermífugo não foi desenhado (' + larg.rot + ')');
      if (campos.margem === null) problemas.push('o campo da folga da virada não foi desenhado (' + larg.rot + ')');
      if (campos.faixa === '' || campos.margem === '') problemas.push('campo do vermífugo em branco em Configurações (' + larg.rot + ')');
      if (larg.w === 1280) console.log('  Configurações · faixa: "' + campos.faixa + '" kg · folga: "'
        + campos.margem + '" kg · diária: "' + campos.diaria + '"');

      await cartaoCfg.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      await mascararTelefones(page);
      await cartaoCfg.screenshot({ path: path.join(SAIDA, 'config-valores-' + larg.rot + '.png'),
        animations: 'disabled', timeout: 30000 });
      console.log('config-valores-' + larg.rot + '.png');
    }

    // Nada foi lançado e nada foi salvo: o guarda conta quantas tentativas houve.
    const escritas = await page.evaluate(() => (window.__ESCRITAS__ || []).length);
    console.log('Tentativas de gravação barradas pelo guarda (' + larg.rot + '): ' + escritas + ' (nenhuma foi ao banco)');
    await ctx.close();
  }

  await navegador.close();
  pararTudo();
  if (problemas.length) { console.error('\nPROBLEMAS:\n- ' + problemas.join('\n- ')); process.exit(1); }
  console.log('\nCaptura v-30 pronta em docs/capturas-v30/');
})().catch((e) => { console.error(e); process.exit(1); });
