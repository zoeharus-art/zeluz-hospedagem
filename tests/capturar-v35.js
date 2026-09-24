'use strict';
/*
 * CAPTURA DA v 2026-09-24-03 — a chamada viva e a tela "Hoje na Zêluz".
 *
 * POR QUE ESTA CAPTURA EXISTE
 * Adriana, 24/set/2026: "Em turminhas daycare, não está aparecendo quem veio. Essa ficha
 * precisa ser preenchida; quando faz o check-in do corpo automaticamente já pode preencher
 * com quem veio. E preciso desse relatório de forma sucinta na Central Zêluz › Day Care:
 * precisamos na recepção saber todo mundo que está hoje e que está com pendência de algo
 * (carrapaticida, vermífugo, escova, vacinas)."
 *
 * O banco estava certo o tempo todo: em 24/09 o nó daycare/chamada/2026-09-24 tinha 34
 * chaves 'veio' e havia 34 check-ins do corpo — o check-in de ENTRADA já gravava a presença
 * sozinho. O que faltava era o REDESENHO: a Chamada lia o nó com once() e ficava com a
 * fotografia do instante em que foi aberta. Agora o nó do dia tem ouvinte vivo, a Chamada
 * diz de ONDE veio a presença ("presente pelo check-in às 07:52") e nasceu a tela que
 * responde a pergunta do balcão: quem está na casa e o que falta resolver com cada um.
 *
 * O QUE ELA FOTOGRAFA
 *   hoje-na-casa-1280.png · hoje-na-casa-500.png ....... a tela inteira: o cabeçalho com os
 *     dois números ("N presentes · M com pendência"), os botões de filtro e a lista
 *   hoje-primeira-linha-1280.png · -500.png ............ a PRIMEIRA linha de perto, para
 *     conferir a frase letra por letra
 *   hoje-so-pendencia-1280.png · -500.png .............. a mesma tela com o filtro
 *     "Só com pendência" ligado
 *   turminhas-chamada-1280.png · -500.png .............. a Chamada do dia, com os cartões
 *     verdes dizendo "presente pelo check-in às hh:mm"
 *
 * E ELA CONFERE, antes de fotografar: a tela existe e abriu; o cabeçalho traz os dois
 * números; há botão para cada um dos sete filtros; quem tem pendência aparece antes de quem
 * não tem; a Chamada mostra a frase da origem da presença; nenhum vocabulário proibido
 * escapou para a tela.
 *
 * NADA É GRAVADO. O mesmo guarda de escrita do smoke embrulha set/update/push/remove/
 * transaction antes de o app carregar, e o banco é o EMULADOR local com o retrato do
 * backup. O Firebase de verdade não recebe um byte. A presença do dia é injetada na MEMÓRIA
 * da página (o mesmo retrato que o ouvinte vivo entrega), nunca no banco: o retrato é de
 * ontem e o nó da chamada de hoje nasce vazio — sem isso a foto sairia de uma casa vazia.
 *
 * Uso:  CAP_PORTA=8829 CAP_EMU_PORTA=9029 node tests/capturar-v35.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');
const retratoLib = require('./lib/retrato');
const emuladorLib = require('./lib/emulador');

const RAIZ = path.join(__dirname, '..');
const APP = 'auaulandia/index.html';
const PORTA = Number(process.env.CAP_PORTA) || 8829;
const EMU_PORTA = Number(process.env.CAP_EMU_PORTA) || 9029;
const SAIDA = path.join(RAIZ, 'docs', 'capturas-v35');
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

// ---------------------------------------------------- a casa de hoje, na MEMÓRIA da página
// O retrato do backup é de ONTEM: o nó da chamada de hoje nasce vazio e a foto sairia de uma
// casa deserta. Então a presença do dia é escrita onde o ouvinte vivo a entregaria — no
// retrato em memória (Z_MAPAS) —, e os slots são chamados como o Firebase os chamaria.
// Nenhum byte vai para o banco: o guarda de escrita continua de pé.
function injetarCasaDeHoje(page) {
  return page.evaluate(() => {
    const hoje = zHojeISO();
    const turma = [];
    (turmaDeHoje() || []).forEach((o) => {
      const p = o && o.p; if (!p || !p.n) return;
      const chave = dcKey(p.n, p.tutor);
      if (!chave || turma.some((x) => x.chave === chave)) return;
      let venc = 0;
      try { venc = (vencItensDe(pelExtra(p) || {}, hoje, 0, hoje) || []).length; } catch (e) { venc = 0; }
      turma.push({ chave, nome: pelNome(p), venc });
    });
    const comPend = turma.filter((x) => x.venc > 0).slice(0, 9);
    const semPend = turma.filter((x) => x.venc === 0).slice(0, 7);
    const escolhidos = comPend.concat(semPend);
    const chamada = {}, checkin = {};
    escolhidos.forEach((x, i) => {
      chamada[x.chave] = 'veio';
      // Dois em cada três entraram pelo check-in do corpo — é assim que a casa funciona.
      if (i % 3 !== 2) {
        const m = (i * 7 + 5) % 60;                       // minuto SEMPRE de 00 a 59
        checkin[x.chave] = { tipo: 'entrada', hora: '0' + (7 + Math.floor(i / 8)) + ':' + String(m).padStart(2, '0'),
          nome: x.nome, fim: Date.now() };
      }
    });
    const ligar = (caminho, dados) => {
      const m = Z_MAPAS[caminho] || (Z_MAPAS[caminho] = { mapa: {}, pronto: true, slots: {}, prontoCbs: [], vivo: true, t: null, carimbo: null, carimboDoMapa: null });
      Object.assign(m.mapa, dados);
      m.pronto = true;
      Object.keys(m.slots).forEach((k) => { try { m.slots[k](m.mapa); } catch (e) { /* redesenho de tela */ } });
    };
    ligar('daycare/checkin-corpo/' + dcDataKey(), checkin);
    ligar(chamadaNo(), chamada);
    if (typeof hojeAtualizarBadge === 'function') hojeAtualizarBadge();
    return { turma: turma.length, presentes: escolhidos.length,
      comPendencia: comPend.length, comCheckin: Object.keys(checkin).length };
  });
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

    // ---- 1 · a casa de hoje ---------------------------------------------------------
    const casa = await injetarCasaDeHoje(page);
    if (larg.w === 1280) console.log('Casa de hoje: turma de ' + casa.turma + ' · ' + casa.presentes
      + ' presentes (' + casa.comPendencia + ' com vencimento, ' + casa.comCheckin + ' pelo check-in)');
    if (!casa.presentes) problemas.push('não consegui montar a casa de hoje (' + larg.rot + '): turma de ' + casa.turma);

    // ---- 2 · a tela "Hoje na Zêluz", pelo caminho do menu ----------------------------
    await page.evaluate(() => { if (typeof abrirItemDoMenu === 'function') abrirItemDoMenu('hoje'); });
    await page.waitForTimeout(1800);
    await estabilizar(page);
    await dispensarCartazes(page, 3);

    const tela = await page.$('#v-hoje');
    if (!tela) { problemas.push('a tela #v-hoje não existe (' + larg.rot + ')'); await ctx.close(); continue; }
    const ativa = await page.evaluate(() => {
      const s = document.getElementById('v-hoje');
      return !!(s && s.classList.contains('active'));
    });
    if (!ativa) problemas.push('a tela "Hoje na Zêluz" não ficou ativa (' + larg.rot + ')');

    const cab = await page.$eval('#hojeRoot h2', (n) => (n.textContent || '').trim()).catch(() => '');
    if (!/\d+ presentes? · \d+ com pendência/.test(cab))
      problemas.push('o cabeçalho não traz os dois números (' + larg.rot + '): "' + cab + '"');
    if (larg.w === 1280) console.log('  cabeçalho: ' + cab);

    const filtros = await page.$$eval('#hojeRoot [id^="hojeF-"]', (ns) => ns.map((x) => x.id.replace('hojeF-', '')));
    ['todos', 'pend', 'vacina', 'verm', 'ecto', 'col', 'escova'].forEach((f) => {
      if (filtros.indexOf(f) < 0) problemas.push('falta o botão de filtro "' + f + '" (' + larg.rot + ')');
    });

    // Quem tem pendência vem primeiro: a primeira linha não pode dizer "Nada pendente".
    const linhas = await page.$$eval('#hojeRoot .card:last-child > div', (ns) => ns
      .map((x) => (x.innerText || '').replace(/\s+/g, ' ').trim()).filter(Boolean));
    if (!linhas.length) problemas.push('a lista saiu vazia (' + larg.rot + ')');
    else if (/Nada pendente/.test(linhas[0]) && linhas.some((l) => !/Nada pendente/.test(l)))
      problemas.push('a lista não pôs quem tem pendência primeiro (' + larg.rot + ')');
    if (larg.w === 1280) linhas.slice(0, 3).forEach((l) => console.log('  ' + l.slice(0, 170)));

    // Nenhum vocabulário proibido pode ter escapado para a tela.
    const t = (await tela.innerText()) || '';
    ['cachorro', 'cãozinho', 'dono ', 'funcionário'].forEach((p) => {
      if (t.toLowerCase().indexOf(p) >= 0) problemas.push('palavra proibida "' + p.trim() + '" na tela (' + larg.rot + ')');
    });

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    await mascararTelefones(page);
    await page.screenshot({ path: path.join(SAIDA, 'hoje-na-casa-' + larg.rot + '.png'), fullPage: true });
    console.log('hoje-na-casa-' + larg.rot + '.png');

    const primeira = await page.$('#hojeRoot .card:last-child > div');
    if (primeira) {
      await primeira.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      await mascararTelefones(page);
      await primeira.screenshot({ path: path.join(SAIDA, 'hoje-primeira-linha-' + larg.rot + '.png'),
        animations: 'disabled', timeout: 30000 });
      console.log('hoje-primeira-linha-' + larg.rot + '.png');
    }

    // ---- 3 · o filtro "Só com pendência" -------------------------------------------
    await page.click('#hojeF-pend');
    await page.waitForTimeout(700);
    const soPend = await page.$$eval('#hojeRoot .card:last-child > div', (ns) => ns
      .map((x) => (x.innerText || '').replace(/\s+/g, ' ').trim()).filter(Boolean));
    if (soPend.some((l) => /Nada pendente/.test(l)))
      problemas.push('o filtro "Só com pendência" deixou passar quem não deve nada (' + larg.rot + ')');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    await mascararTelefones(page);
    await page.screenshot({ path: path.join(SAIDA, 'hoje-so-pendencia-' + larg.rot + '.png'), fullPage: true });
    console.log('hoje-so-pendencia-' + larg.rot + '.png · ' + soPend.length + ' de ' + linhas.length);
    await page.click('#hojeF-todos');
    await page.waitForTimeout(500);

    // ---- 4 · a Chamada das Turminhas, com a origem da presença ---------------------
    await page.evaluate(() => { if (typeof abrirAtividade === 'function') abrirAtividade('chamada'); });
    await page.waitForTimeout(2000);
    await estabilizar(page);
    await dispensarCartazes(page, 3);

    const fontes = await page.$$eval('#dcGrid .dc-veio-fonte', (ns) => ns.map((x) => (x.textContent || '').trim()));
    if (!fontes.length) problemas.push('nenhum cartão da Chamada diz de onde veio a presença (' + larg.rot + ')');
    if (!fontes.some((f) => /^presente pelo check-in às \d{2}:\d{2}$/.test(f)))
      problemas.push('nenhum cartão traz "presente pelo check-in às hh:mm" (' + larg.rot + '): '
        + JSON.stringify(fontes.slice(0, 4)));
    if (larg.w === 1280) console.log('  origens da presença: ' + JSON.stringify(fontes.slice(0, 4)));

    const presentes = await page.$$eval('#dcGrid .dc-card.veio', (ns) => ns.length);
    if (!presentes) problemas.push('a Chamada não mostrou ninguém como PRESENTE (' + larg.rot + ')');

    const grade = await page.$('#dcGrid');
    if (grade) {
      await grade.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      await mascararTelefones(page);
      await page.screenshot({ path: path.join(SAIDA, 'turminhas-chamada-' + larg.rot + '.png') });
      console.log('turminhas-chamada-' + larg.rot + '.png · ' + presentes + ' presente(s) na grade');
    }

    const escritas = await page.evaluate(() => (window.__ESCRITAS__ || []).length);
    console.log('Tentativas de gravação barradas pelo guarda (' + larg.rot + '): ' + escritas + ' (nenhuma foi ao banco)');
    await ctx.close();
  }

  await navegador.close();
  pararTudo();
  if (problemas.length) { console.error('\nPROBLEMAS:\n- ' + problemas.join('\n- ')); process.exit(1); }
  console.log('\nCaptura v-35 pronta em docs/capturas-v35/');
})().catch((e) => { console.error(e); process.exit(1); });
