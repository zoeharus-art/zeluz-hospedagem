'use strict';
/*
 * CAPTURA DA v 2026-09-22-01 — a foto do check-in do corpo que não voltava da câmera.
 *
 * POR QUE ESTA CAPTURA EXISTE
 * Adriana, 22/set/2026, 9h26: "Giulia com problemas para fazer check-in do corpo: tira foto
 * da Lana e não salva. As fotos precisam ser salvas. Tenta salvar, fica todo em vermelho e
 * volta para a foto."
 * No banco (daycare/auditoria/2026-09-22) havia QUATRO rastros
 * "checkin-corpo-barrado | Lana — faltou: foto de Orelhas" (9:23, 9:23, 9:24 e 9:26) e
 * NENHUM rastro de foto com erro. Ou seja: o ponto estava marcado como alterado, mas a foto
 * nunca chegava ao rascunho — em silêncio.
 *
 * O QUE ESTE TESTE PROVA, NO NAVEGADOR DE VERDADE (celular 412×915)
 *   1) Com a ficha aberta e a "câmera" no ar, um redesenho vindo do ouvinte do banco NÃO
 *      destrói o <input type="file"> — era isso que cancelava o seletor no Chrome do Android
 *      e fazia a foto nunca voltar (hipótese 3, a que o código confirmou).
 *   2) Uma foto GRANDE de verdade (4000×3000, alguns MB, feita no próprio navegador) entra
 *      no rascunho, vira miniatura e o Salvar passa — sem "faltou: foto de Orelhas".
 *   3) A porta da galeria (sem capture) aceita o mesmo arquivo pelo mesmo caminho.
 *
 * O QUE ELA FOTOGRAFA
 *   ponto-antes-{larg}.png .... Orelhas marcado como alterado, ainda sem foto, com os dois
 *                               caminhos: "Tirar foto" e "Escolher da galeria"
 *   ponto-depois-{larg}.png ... o mesmo ponto com a miniatura e "Foto guardada ✓"
 *   ficha-{larg}.png .......... a ficha inteira pronta para salvar
 *   foto-perdida-{larg}.png ... a faixa amarela de quando o celular fecha a página com a
 *                               câmera aberta
 *
 * NADA É GRAVADO. Mesmo guarda de escrita do smoke e da captura v-31: set/update/push/
 * remove/transaction viram anotação. O banco é o EMULADOR local com o retrato do backup.
 *
 * Uso:  CAP_PORTA=8824 CAP_EMU_PORTA=9024 node tests/capturar-v32.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');
const retratoLib = require('./lib/retrato');
const emuladorLib = require('./lib/emulador');

const RAIZ = path.join(__dirname, '..');
const APP = 'auaulandia/index.html';
const PORTA = Number(process.env.CAP_PORTA) || 8824;
const EMU_PORTA = Number(process.env.CAP_EMU_PORTA) || 9024;
const SAIDA = path.join(RAIZ, 'docs', 'capturas-v32');
// A senha NÃO fica no repositório (público). Fase 0, 25/set/2026: vem do ambiente.
const SENHA_DIRETORIA = process.env.ZELUZ_SENHA_DIRETORIA || '';
if (!SENHA_DIRETORIA) { console.error('Defina ZELUZ_SENHA_DIRETORIA (a senha da Diretoria) antes de rodar esta captura.'); process.exit(1); }

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

async function mascararTelefones(page) {
  await page.evaluate(() => {
    const re = /(\+?55\s?)?\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4}/g;
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nos = []; let n; while ((n = w.nextNode())) nos.push(n);
    nos.forEach((t) => { if (re.test(t.nodeValue)) t.nodeValue = t.nodeValue.replace(re, '+55 ••• ••••'); });
    document.querySelectorAll('textarea').forEach((ta) => { if (re.test(ta.value)) ta.value = ta.value.replace(re, '+55 ••• ••••'); });
  });
}
// scrollIntoViewIfNeeded às vezes rola a página DE LADO e a foto do pedaço sai cortada.
async function semRolagemLateral(page) {
  await page.evaluate(() => { try { window.scrollBy(-window.scrollX, 0); } catch (e) { /* enfeite de tela */ } });
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

// ------------------------------------------------- a foto grande, feita no navegador
// 4000×3000 com ruído: sem ruído o JPEG fica com poucos KB e não prova nada sobre memória.
async function fabricarFotoGrande(page, destino) {
  const b64 = await page.evaluate(async () => {
    const L = 4000, A = 3000;
    const c = document.createElement('canvas'); c.width = L; c.height = A;
    const d = c.getContext('2d');
    const g = d.createLinearGradient(0, 0, L, A);
    g.addColorStop(0, '#234D67'); g.addColorStop(1, '#DEB428');
    d.fillStyle = g; d.fillRect(0, 0, L, A);
    for (let i = 0; i < 24000; i++) {
      d.fillStyle = 'rgba(' + ((i * 37) % 255) + ',' + ((i * 91) % 255) + ',' + ((i * 53) % 255) + ',0.6)';
      d.fillRect((i * 733) % L, (i * 397) % A, 14, 14);
    }
    const url = c.toDataURL('image/jpeg', 0.95);
    return url.split(',')[1];
  });
  const buf = Buffer.from(b64, 'base64');
  fs.writeFileSync(destino, buf);
  return buf.length;
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
  const ARQUIVO_FOTO = path.join(SAIDA, '_foto-de-teste-4000x3000.jpg');

  // O celular da monitora (412×915 é o Samsung da casa) e o computador da Gestão.
  const APARELHOS = [
    { w: 412, h: 915, dsf: 2.6, rot: '412' },
    { w: 1280, h: 1000, dsf: 2, rot: '1280' },
  ];

  for (const ap of APARELHOS) {
    const ctx = await navegador.newContext({
      viewport: { width: ap.w, height: ap.h },
      deviceScaleFactor: ap.dsf,
      isMobile: ap.w < 700, hasTouch: ap.w < 700,
    });
    const page = await ctx.newPage();
    await page.addInitScript(guardaDeEscrita);
    await page.addInitScript((id) => { try { localStorage.setItem('zeluz_device_id', id); } catch (e) { /* sem localStorage o app barra e o erro aparece na tela */ } }, aparelhos[0]);
    await page.goto(URL, { waitUntil: 'load' });
    await estabilizar(page);

    if (!fs.existsSync(ARQUIVO_FOTO)) {
      const bytes = await fabricarFotoGrande(page, ARQUIVO_FOTO);
      console.log('Foto de teste: 4000×3000, ' + (bytes / 1048576).toFixed(1) + ' MB');
      if (bytes < 900 * 1024) problemas.push('a foto de teste saiu pequena demais (' + bytes + ' bytes) — não prova nada sobre memória');
    }

    await page.fill('#loginPwd', SENHA_DIRETORIA);
    await page.click('.login-btn');
    await page.waitForTimeout(1800);
    await estabilizar(page);
    await dispensarCartazes(page);
    const papel = await page.evaluate(() => document.body.dataset.role || '');
    if (!papel) { console.error('Não entrou no app (' + ap.rot + ').'); await navegador.close(); pararTudo(); process.exit(1); }
    if (ap.rot === '412') console.log('Entrou como: ' + papel);

    // A auditoria passa a ser anotada: é nela que o barramento aparecia (checkin-corpo-barrado).
    await page.evaluate(() => {
      window.__AUD__ = [];
      const orig = audit;
      audit = function (acao, detalhe, meta) {
        try { window.__AUD__.push({ acao: acao, detalhe: String(detalhe || '') }); } catch (e) { /* o espião nunca derruba a página */ }
        return orig.apply(null, arguments);
      };
    });

    // ---- 1 · abrir o Check-in do corpo e achar a Lana -----------------------------
    const lana = await page.evaluate(() => {
      const ehLana = (p) => /(^|\s)lana(\s|$)/i.test(String(p.n || '').trim());
      let p = (PELUDINHOS || []).filter(ehLana)[0];
      if (!p) {
        p = { n: 'Lana', raca: 'Shih-tzu', tutor: 'Marcela Almeida Castro Leite', dias: [], nasc: '' };
        PELUDINHOS.push(p);
      }
      // Ela precisa estar na turma de HOJE para o check-in de entrada cobrá-la.
      const dias = (typeof pelDias === 'function' ? pelDias(p) : (p.dias || [])) || [];
      if (dias.indexOf(dcDia) < 0) p.dias = dias.concat([dcDia]);
      // pelo caminho de sempre: é abrirAtividade que troca a tela, o menu e o dia
      if (typeof abrirAtividade === 'function') abrirAtividade('checkin-corpo');
      ckStep = 'exec';
      return { n: p.n, tutor: p.tutor || '', k: dcKey(p.n, p.tutor) };
    });
    await page.waitForTimeout(2200);
    await estabilizar(page);
    await dispensarCartazes(page, 3);

    const abriu = await page.evaluate((k) => {
      if (typeof ckAbrir !== 'function') return 'sem ckAbrir';
      ckAbrir(k);
      return (typeof ckAtual !== 'undefined' && ckAtual) ? '' : 'a ficha não abriu';
    }, lana.k);
    if (abriu) { problemas.push('não consegui abrir a ficha da Lana (' + ap.rot + '): ' + abriu); await ctx.close(); continue; }
    await page.waitForTimeout(900);

    // ---- 2 · o resto do exame respondido pelo caminho de sempre --------------------
    await page.evaluate(() => {
      const pontos = ckPontosDe(ckAtual.p) || [];
      pontos.forEach((pt) => { if (pt.k !== 'orelhas') ckMarcar(pt.k, false); });
      ckSet('coleiraRep', 'nao');
      ckSet('coleiraId', 'nao');
    });
    await page.waitForTimeout(600);

    // ---- 3 · Orelhas alterado, com um alerta que NÃO é machucado -------------------
    await page.click('#ckPt-orelhas .ck-b.bad');
    await page.waitForTimeout(500);
    const chip = await page.$('#ckPt-orelhas .ck-chip:text-is("Cheiro forte")');
    if (chip) { await chip.click(); await page.waitForTimeout(500); }
    else problemas.push('não achei o alerta "Cheiro forte" em Orelhas (' + ap.rot + ')');

    const antes = await page.$('#ckPt-orelhas');
    if (antes) {
      const txt = (await antes.innerText()) || '';
      ['Tirar foto', 'Escolher da galeria'].forEach((x) => {
        if (txt.indexOf(x) < 0) problemas.push('o ponto Orelhas (' + ap.rot + ') não oferece "' + x + '"');
      });
      await antes.scrollIntoViewIfNeeded();
      await semRolagemLateral(page);
      await page.waitForTimeout(400);
      await mascararTelefones(page);
      await antes.screenshot({ path: path.join(SAIDA, 'ponto-antes-' + ap.rot + '.png'), animations: 'disabled', timeout: 30000 });
      console.log('ponto-antes-' + ap.rot + '.png');
    } else problemas.push('o ponto Orelhas não está na tela (' + ap.rot + ')');

    // ---- 4 · A PROVA DA HIPÓTESE 3 ------------------------------------------------
    // Toca no botão (o app grava fotoPendente) e, com a "câmera aberta", dispara o
    // redesenho que vinha do ouvinte do banco. Antes, isso trocava o <input> e o Chrome
    // cancelava o seletor: a foto nunca voltava. Agora o campo tem de ser O MESMO.
    const campoCamera = await page.$('#ckPt-orelhas .ck-fbt label.btn-gold input[type=file]');
    if (!campoCamera) { problemas.push('não achei o campo da câmera em Orelhas (' + ap.rot + ')'); await ctx.close(); continue; }
    await page.evaluate(() => {
      const el = document.querySelector('#ckPt-orelhas .ck-fbt label.btn-gold input[type=file]');
      el.dataset.marcaDoTeste = 'campo-original';
      ckFotoTocou('orelhas', 'foto');          // é o que o onclick do botão faz
      ckRedesenharDeFora();                    // é o que o ouvinte do banco fazia
      ckRedesenharDeFora();
    });
    const sobreviveu = await page.evaluate(() => {
      const el = document.querySelector('#ckPt-orelhas .ck-fbt label.btn-gold input[type=file]');
      return !!(el && el.dataset.marcaDoTeste === 'campo-original');
    });
    if (!sobreviveu) problemas.push('o campo da foto foi DESTRUÍDO por um redesenho de fora (' + ap.rot + ') — é o bug da Lana de volta');
    else if (ap.rot === '412') console.log('  o campo da câmera sobreviveu ao redesenho do ouvinte do banco ✓');

    // ---- 5 · a foto grande entra pelo TOQUE de verdade no botão -------------------
    // Clicar no rótulo é o gesto da monitora: o Chromium abre o seletor de arquivo e o
    // onclick do campo grava a marca ANTES disso. É esta a sequência da vida real.
    await page.evaluate(() => { ckFotoChegou(); });   // limpa a marca posta no passo 4
    const [seletor] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.click('#ckPt-orelhas .ck-fbt label.btn-gold'),
    ]);
    const marcouNoToque = await page.evaluate(() => {
      const fp = ckRascunho && ckRascunho.fotoPendente;
      return !!(fp && fp.pk === 'orelhas' && fp.campo === 'foto');
    });
    if (!marcouNoToque) problemas.push('o toque no botão da câmera NÃO gravou fotoPendente (' + ap.rot + ')');
    else if (ap.rot === '412') console.log('  o toque no botão gravou a marca antes de a câmera abrir ✓');
    await seletor.setFiles(ARQUIVO_FOTO);
    await page.waitForSelector('#ckPt-orelhas .ck-fstatus.ok', { timeout: 30000 }).catch(() => {});
    await page.waitForSelector('#ckPt-orelhas .ck-foto img', { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(600);

    const daFoto = await page.evaluate(() => {
      const at = (ckRascunho && ckRascunho.pontos && ckRascunho.pontos.orelhas) || {};
      const im = document.querySelector('#ckPt-orelhas .ck-foto img');
      return {
        noRascunho: String(at.foto || '').slice(0, 15),
        tamanho: String(at.foto || '').length,
        miniatura: !!im,
        pendencia: !!(ckRascunho && ckRascunho.fotoPendente),
        status: (typeof CK_FOTO_STATUS !== 'undefined') ? (CK_FOTO_STATUS.orelhas || '') : '?',
      };
    });
    if (daFoto.noRascunho !== 'data:image/jpeg') problemas.push('a foto NÃO entrou no rascunho (' + ap.rot + '): ' + JSON.stringify(daFoto));
    if (!daFoto.miniatura) problemas.push('a miniatura não apareceu no ponto (' + ap.rot + ')');
    if (daFoto.pendencia) problemas.push('a marca de foto pendente não foi limpa (' + ap.rot + ')');
    if (daFoto.status !== 'ok') problemas.push('o ponto não diz "Foto guardada" (' + ap.rot + '): status=' + daFoto.status);
    if (ap.rot === '412') console.log('  foto guardada: ' + Math.round(daFoto.tamanho / 1024) + ' KB de base64 (era um arquivo de vários MB)');

    const depois = await page.$('#ckPt-orelhas');
    if (depois) {
      await depois.scrollIntoViewIfNeeded();
      await semRolagemLateral(page);
      await page.waitForTimeout(400);
      await mascararTelefones(page);
      await depois.screenshot({ path: path.join(SAIDA, 'ponto-depois-' + ap.rot + '.png'), animations: 'disabled', timeout: 30000 });
      console.log('ponto-depois-' + ap.rot + '.png');
    }

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    await mascararTelefones(page);
    await page.screenshot({ path: path.join(SAIDA, 'ficha-' + ap.rot + '.png'), fullPage: false });
    console.log('ficha-' + ap.rot + '.png');

    // ---- 6 · SALVAR: tem de passar, sem "faltou: foto" ----------------------------
    await page.evaluate(() => { window.__AUD__ = []; });
    await page.evaluate(() => { if (typeof ckSalvar === 'function') ckSalvar(); });
    await page.waitForTimeout(1500);
    const veredito = await page.evaluate((k) => {
      const aud = window.__AUD__ || [];
      return {
        barrado: aud.filter((x) => x.acao === 'checkin-corpo-barrado').map((x) => x.detalhe),
        fotoFalhou: aud.filter((x) => x.acao === 'checkin-foto-falhou').map((x) => x.detalhe),
        vermelhos: document.querySelectorAll('.z-falta-msg').length,
        gravado: !!(typeof ckDados !== 'undefined' && ckDados[k]),
        temFoto: !!(typeof ckDados !== 'undefined' && ckDados[k] && ckDados[k].pontos
          && ckDados[k].pontos.orelhas && ckDados[k].pontos.orelhas.fotoRef),
      };
    }, lana.k);
    if (veredito.barrado.length) problemas.push('o Salvar foi BARRADO (' + ap.rot + '): ' + JSON.stringify(veredito.barrado));
    if (veredito.fotoFalhou.length) problemas.push('a foto falhou (' + ap.rot + '): ' + JSON.stringify(veredito.fotoFalhou));
    if (veredito.vermelhos) problemas.push('a tela ficou com ' + veredito.vermelhos + ' campo(s) em vermelho (' + ap.rot + ')');
    if (!veredito.gravado) problemas.push('o check-in não foi montado para gravação (' + ap.rot + ')');
    if (!veredito.temFoto) problemas.push('o registro saiu sem fotoRef em Orelhas (' + ap.rot + ')');
    if (ap.rot === '412') console.log('  Salvar passou: 0 barramentos, 0 campos em vermelho, Orelhas com fotoRef ✓');

    // ---- 7 · a porta da galeria aceita o mesmo arquivo ----------------------------
    await dispensarCartazes(page, 8);   // o aviso do Telegram cobre a tela depois de salvar
    await page.evaluate((k) => { ckAbrir(k); }, lana.k);
    await page.waitForTimeout(800);
    await dispensarCartazes(page, 8);
    await page.click('#ckPt-orelhas .ck-b.bad');
    await page.waitForTimeout(500);
    const campoGaleria = await page.$('#ckPt-orelhas .ck-fbt label.ck-galeria input[type=file]');
    if (!campoGaleria) problemas.push('não achei o campo "Escolher da galeria" (' + ap.rot + ')');
    else {
      const temCaptura = await page.evaluate(() => {
        const el = document.querySelector('#ckPt-orelhas .ck-fbt label.ck-galeria input[type=file]');
        return !!(el && el.hasAttribute('capture'));
      });
      if (temCaptura) problemas.push('a porta da galeria não pode ter capture (' + ap.rot + ')');
      const [seletorGal] = await Promise.all([
        page.waitForEvent('filechooser'),
        page.click('#ckPt-orelhas .ck-fbt label.ck-galeria'),
      ]);
      await seletorGal.setFiles(ARQUIVO_FOTO);
      await page.waitForSelector('#ckPt-orelhas .ck-fstatus.ok', { timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(600);
      const okGal = await page.evaluate(() => String(((ckRascunho.pontos.orelhas) || {}).foto || '').indexOf('data:image/jpeg') === 0);
      if (!okGal) problemas.push('a foto escolhida na galeria não entrou no rascunho (' + ap.rot + ')');
      else if (ap.rot === '412') console.log('  a porta da galeria guardou a mesma foto ✓');
    }

    // ---- 8 · a faixa de quando o celular fecha a página com a câmera aberta -------
    await page.evaluate((k) => {
      // O aparelho matou a aba: o rascunho volta do espelho COM a marca e SEM a foto.
      const at = Object.assign({}, ckRascunho.pontos.orelhas || {});
      delete at.foto;
      const r = { pontos: Object.assign({}, ckRascunho.pontos, { orelhas: at }),
        coleiraRep: ckRascunho.coleiraRep || '', coleiraId: ckRascunho.coleiraId || '', coco: ckRascunho.coco || '',
        fotoPendente: { pk: 'orelhas', campo: 'foto', ts: Date.now() - 20000 } };
      localStorage.setItem(ckRascChave(k), JSON.stringify({ dia: dcDataKey(), ts: Date.now(), r: r }));
      ckVoltar();
      ckAbrir(k);
    }, lana.k);
    await page.waitForTimeout(900);
    const faixa = await page.$('#ckPt-orelhas .ck-fperdida');
    if (!faixa) problemas.push('a faixa da foto que não voltou não apareceu (' + ap.rot + ')');
    else {
      const t = (await faixa.innerText()) || '';
      ['não voltou para o app', 'câmera estava aberta', 'use a galeria'].forEach((x) => {
        if (t.indexOf(x) < 0) problemas.push('a faixa da foto perdida (' + ap.rot + ') não diz "' + x + '"');
      });
      const rastro = await page.evaluate(() => (window.__AUD__ || []).filter((x) => x.acao === 'checkin-foto-perdida').length);
      if (!rastro) problemas.push('a foto que não voltou não deixou rastro checkin-foto-perdida (' + ap.rot + ')');
      const alvo = await page.$('#ckPt-orelhas');
      await alvo.scrollIntoViewIfNeeded();
      await semRolagemLateral(page);
      await page.waitForTimeout(400);
      await mascararTelefones(page);
      await alvo.screenshot({ path: path.join(SAIDA, 'foto-perdida-' + ap.rot + '.png'), animations: 'disabled', timeout: 30000 });
      console.log('foto-perdida-' + ap.rot + '.png');
    }

    // ---- 9 · nenhum vocabulário proibido e nada gravado no banco ------------------
    {
      const t = ((await page.innerText('body')) || '').toLowerCase();
      ['cachorro', 'cãozinho', 'dono ', 'funcionário'].forEach((p2) => {
        if (t.indexOf(p2) >= 0) problemas.push('palavra proibida "' + p2.trim() + '" na tela (' + ap.rot + ')');
      });
    }
    const escritas = await page.evaluate(() => (window.__ESCRITAS__ || []));
    console.log('Tentativas de gravação barradas pelo guarda (' + ap.rot + '): ' + escritas.length + ' (nenhuma foi ao banco)');
    await ctx.close();
  }

  await navegador.close();
  pararTudo();
  if (problemas.length) { console.error('\nPROBLEMAS:\n- ' + problemas.join('\n- ')); process.exit(1); }
  console.log('\nCaptura da v ' + versao + ' pronta em docs/capturas-v32/');
})().catch((e) => { console.error(e); process.exit(1); });
