'use strict';
/*
 * CAPTURA DA v 2026-09-21-01 — Vence amanhã.
 *
 * POR QUE ESTA CAPTURA EXISTE
 * Adriana, 21/set/2026: "Nós temos dentro do aplicativo a parte de trocas: vacinação, a
 * vermifugação, o carrapaticida, a troca de coleiras, a troca de escova dental. Todas essas
 * questões são de suma importância. Eu preciso facilitar esse processo. Como? Tudo que for
 * vencer no dia, eu ter um calendário do dia para o setor de consultoria, onde vai mandar;
 * isso tem que mandar para o peludo ANTES dele vir... O fluxo hoje não está dando certo: as
 * pessoas estão mandando e não estão finalizando aquilo dali. A gente precisa que dê uma
 * resposta... Então tem que perguntar: já foi atualizada a ficha? E a pessoa tem que clicar
 * em sim ou não."
 *
 * O QUE ELA FOTOGRAFA
 *   vencimentos-1280.png · vencimentos-500.png — a PRIMEIRA DOBRA da tela: a frase do
 *     dia-alvo, o seletor (Hoje · Amanhã · calendário), as contas e o começo da fila
 *     (a tela inteira, com dezenas de cartões, daria uma foto que ninguém consegue olhar)
 *   cartao-1280.png · cartao-500.png — UM cartão por inteiro: os itens com a data, a
 *     mensagem pronta na caixa editável, "Copiar mensagem"/"Mandei" e os quatro botões de
 *     resposta do tutor
 *   config-mensagens-1280.png · config-mensagens-500.png — Configurações › Mensagens
 *     prontas: os dois textos e a folga em dias, editáveis pela Gestão sem programador
 *
 * E ELA CONFERE, antes de fotografar: o item existe no menu com o rótulo certo; a tela traz
 * o dia-alvo e o seletor; há pelo menos um cartão com mensagem pronta e os quatro botões de
 * resposta; o cartão do Configurações traz os dois textos, a folga e as variáveis explicadas.
 * NENHUM botão que grava é apertado — nem "Mandei", nem as respostas, nem "Salvar".
 *
 * NADA É GRAVADO: o mesmo guarda de escrita do smoke embrulha set/update/push/remove/
 * transaction antes de o app carregar, e o banco é o EMULADOR local com o retrato do backup.
 * O Firebase de verdade não recebe um byte.
 *
 * Uso:  NODE_PATH=C:/Users/zeluz/projetos-aios/code/node_modules node tests/capturar-v28.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');
const retratoLib = require('./lib/retrato');
const emuladorLib = require('./lib/emulador');

const RAIZ = path.join(__dirname, '..');
const APP = 'auaulandia/index.html';
const PORTA = Number(process.env.CAP_PORTA) || 8816;
const EMU_PORTA = Number(process.env.CAP_EMU_PORTA) || 9016;
const SAIDA = path.join(RAIZ, 'docs', 'capturas-v28');
const SENHA_DIRETORIA = '1101';

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
    await dispensarCartazes(page);
    const papel = await page.evaluate(() => document.body.dataset.role || '');
    if (!papel) { console.error('Não entrou no app (' + larg.rot + ').'); await navegador.close(); pararTudo(); process.exit(1); }
    if (larg.w === 1280) console.log('Entrou como: ' + papel);

    // ---- 1 · o item do menu -------------------------------------------------------
    const itemMenu = await page.$('#nav a[data-v="vencimentos"]');
    if (!itemMenu) problemas.push('não achei o item "Vence amanhã" no menu (' + larg.rot + ')');
    const rotuloMenu = itemMenu ? ((await itemMenu.innerText()) || '').replace(/\s+/g, ' ').trim() : '';
    if (itemMenu && rotuloMenu.indexOf('Vence amanhã') < 0) {
      problemas.push('o rótulo do item do menu não é o esperado (' + larg.rot + '): "' + rotuloMenu + '"');
    }

    // ---- 2 · a tela ----------------------------------------------------------------
    await page.evaluate(() => { if (typeof abrirItemDoMenu === 'function') abrirItemDoMenu('vencimentos'); });
    await page.waitForTimeout(2600);
    await estabilizar(page);
    await dispensarCartazes(page, 3);

    const tela = await page.$('#v-vencimentos');
    if (!tela) { problemas.push('a tela #v-vencimentos não existe (' + larg.rot + ')'); }
    else {
      // O retrato é de um dia útil, e há dezenas de FILHOts com prevenção vencida — mas a
      // captura pode rodar num dia em que a turma do dia-alvo esteja inteira em dia. Nesse
      // caso, anda pelos próximos dias de Day Care até achar um com cartão. Ninguém fabrica
      // dado: só se escolhe OUTRO dia, pelo mesmo seletor que a consultora usa.
      let nCartoes = await page.$$eval('#vencRoot [id^="vencCard_"]', (ns) => ns.length);
      for (let tent = 0; tent < 6 && nCartoes === 0; tent++) {
        const achou = await page.evaluate(() => {
          if (typeof proximoDiaDayCare !== 'function' || typeof vencTrocarDia !== 'function') return '';
          const base = (typeof vencDiaAlvo === 'function') ? vencDiaAlvo() : '';
          const prox = proximoDiaDayCare(base);
          if (!prox) return '';
          vencTrocarDia(prox);
          return prox;
        });
        if (!achou) break;
        await page.waitForTimeout(2200);
        await estabilizar(page);
        nCartoes = await page.$$eval('#vencRoot [id^="vencCard_"]', (ns) => ns.length);
      }
      if (!nCartoes) problemas.push('não consegui mostrar nenhum cartão em Vence amanhã (' + larg.rot + ')');

      const t = (await tela.innerText()) || '';
      ['Mande hoje, para quem vem', 'Hoje', 'para mandar', 'sem resposta']
        .forEach((s) => { if (t.indexOf(s) < 0) problemas.push('Vence amanhã (' + larg.rot + '): faltou "' + s + '" na tela'); });
      if (nCartoes) {
        ['Copiar mensagem', 'Mandei', 'O QUE O TUTOR RESPONDEU', 'Pode fazer na Zêluz',
          'Tutor faz em casa / no veterinário', 'Não quer agora', 'Não respondeu']
          .forEach((s) => { if (t.indexOf(s) < 0) problemas.push('Vence amanhã (' + larg.rot + '): faltou "' + s + '" no cartão'); });
        const msg = await page.$$eval('#vencRoot textarea[id^="vencMsg_"]', (ts) => ts.map((x) => x.value || ''));
        if (!msg.length) problemas.push('nenhuma mensagem pronta desenhada (' + larg.rot + ')');
        else if (msg[0].indexOf('Olá') !== 0 || msg[0].indexOf('Passando para avisar:') < 0)
          problemas.push('a mensagem pronta não saiu como esperado (' + larg.rot + '): "' + msg[0].slice(0, 90) + '"');
      }
      // Nenhum vocabulário proibido pode ter escapado para a tela.
      ['cachorro', 'cãozinho', 'dono ', 'funcionário'].forEach((p) => {
        if (t.toLowerCase().indexOf(p) >= 0) problemas.push('palavra proibida "' + p.trim() + '" na tela (' + larg.rot + ')');
      });

      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);
      // A tela inteira com 34 cartões dá uma foto de 33 mil pixels de altura, que ninguém
      // consegue olhar. O que ela precisa ver é a PRIMEIRA DOBRA: a frase do dia, o seletor,
      // as contas e o começo da fila. O cartão de perto vem na foto seguinte.
      await mascararTelefones(page);
      await page.screenshot({ path: path.join(SAIDA, 'vencimentos-' + larg.rot + '.png') });
      console.log('vencimentos-' + larg.rot + '.png · ' + nCartoes + ' cartão(ões)');

      // ---- 3 · UM cartão, de perto ------------------------------------------------
      const cartao = await page.$('#vencRoot [id^="vencCard_"]');
      if (cartao) {
        await cartao.scrollIntoViewIfNeeded();
        await page.waitForTimeout(400);
        await mascararTelefones(page);
        await cartao.screenshot({ path: path.join(SAIDA, 'cartao-' + larg.rot + '.png') });
        console.log('cartao-' + larg.rot + '.png');
      }
    }

    // ---- 4 · Configurações › Mensagens prontas --------------------------------------
    await page.evaluate(() => { if (typeof abrirItemDoMenu === 'function') abrirItemDoMenu('config'); });
    await page.waitForTimeout(2600);
    await estabilizar(page);
    await dispensarCartazes(page, 3);
    const cfg = await page.$('#cfgVencCard');
    if (!cfg) problemas.push('não achei o cartão "Mensagens prontas" em Configurações (' + larg.rot + ')');
    else {
      const tc = (await cfg.innerText()) || '';
      ['Mensagens prontas', '{tutor}', '{ofilhot}', '{itens}', '{dia}',
        'Entrar na lista com quantos dias de folga', 'Salvar', 'Voltar ao texto de fábrica']
        .forEach((s) => { if (tc.indexOf(s) < 0) problemas.push('Mensagens prontas (' + larg.rot + '): faltou "' + s + '"'); });
      const campos = await page.evaluate(() => {
        const g = (id) => { const el = document.getElementById(id); return el ? String(el.value || '') : null; };
        return { texto: g('cfgVencTexto'), vacina: g('cfgVencVacina'), margem: g('cfgVencMargem') };
      });
      if (!campos.texto || campos.texto.indexOf('{itens}') < 0)
        problemas.push('o campo do texto padrão não trouxe o modelo (' + larg.rot + '): ' + JSON.stringify(campos.texto));
      if (!campos.vacina || campos.vacina.indexOf('veterinária') < 0)
        problemas.push('o campo do texto de vacina não trouxe o modelo (' + larg.rot + '): ' + JSON.stringify(campos.vacina));
      if (!/^\d+$/.test(String(campos.margem || '')))
        problemas.push('a folga em dias não veio como número (' + larg.rot + '): ' + JSON.stringify(campos.margem));
      await cfg.scrollIntoViewIfNeeded();
      // Configurações tem vários cartões que se preenchem sozinhos (protocolos, valores,
      // fotos) e empurram a página enquanto chegam. Sem esta folga a foto sai tremida — ou
      // nem sai, porque o elemento nunca fica parado.
      await page.waitForTimeout(2000);
      await cfg.screenshot({ path: path.join(SAIDA, 'config-mensagens-' + larg.rot + '.png'),
        animations: 'disabled', timeout: 30000 });
      console.log('config-mensagens-' + larg.rot + '.png');
    }

    const escritas = await page.evaluate(() => (window.__ESCRITAS__ || []).length);
    console.log('Tentativas de gravação barradas pelo guarda (' + larg.rot + '): ' + escritas + ' (nenhuma foi ao banco)');
    await ctx.close();
  }

  await navegador.close();
  pararTudo();
  if (problemas.length) { console.error('\nPROBLEMAS:\n- ' + problemas.join('\n- ')); process.exit(1); }
  console.log('\nCaptura v-28 pronta em docs/capturas-v28/');
})().catch((e) => { console.error(e); process.exit(1); });
