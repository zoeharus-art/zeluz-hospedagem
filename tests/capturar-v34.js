'use strict';
/*
 * CAPTURA DA v 2026-09-24-02 — qualquer foto do ponto é a foto do ponto.
 *
 * POR QUE ESTA CAPTURA EXISTE
 * Adriana, 24/set/2026, manhã: "o monitor ESTÁ tirando foto."
 * No banco (daycare/auditoria/2026-09-24) havia CINCO rastros
 * "checkin-corpo-barrado | Valentina — faltou: foto de Pele e pelagem (sem rastro de toque
 * na câmera) | camera:'sem-toque'" entre 09:58 e 10:00 — monitor Felipe, Android/Chrome.
 * Ele estava fotografando mesmo: a foto é que entrava por OUTRA gaveta da mesma tela (as
 * fotos extras, a de longe, a câmera de outro ponto), e a validação só sabia olhar a
 * gaveta `foto`.
 *
 * O QUE ESTE TESTE PROVA, NO NAVEGADOR DE VERDADE (celular 412×915)
 *   a) o ponto marcado como Alterado — SEM escolher alerta nenhum — já abre com o botão
 *      grande "📷 Tirar a foto de Pele e pelagem" e com "Escolher da galeria" ao lado;
 *   b) foto que entra pelas FOTOS EXTRAS satisfaz o ponto: o Salvar passa;
 *   c) foto que entra pela DE LONGE satisfaz o ponto: o Salvar passa;
 *   d) machucado com DUAS fotos extras passa — não se exige mais a gaveta certa;
 *   e) barrado sem foto nenhuma: o botão grande pisca (classe z-falta), passa a dizer
 *      "toque AQUI para a foto" e a tela rola até ele;
 *   f) todo toque num botão de foto deixa rastro (checkin-foto-tocou) com o campo usado.
 *
 * O QUE ELA FOTOGRAFA
 *   botao-grande-{larg}.png ..... o ponto Alterado, sem alerta escolhido, com o botão grande
 *   barrado-pisca-{larg}.png .... o botão grande piscando depois do Salvar barrado
 *   foto-pela-extra-{larg}.png .. o ponto resolvido por uma foto que entrou nas extras
 *   foto-pela-longe-{larg}.png .. o ponto resolvido pela foto de longe
 *   machucado-extras-{larg}.png . machucado resolvido com duas fotos extras
 *
 * NADA É GRAVADO. Mesmo guarda de escrita das capturas v-31 e v-32: set/update/push/
 * remove/transaction viram anotação. O banco é o EMULADOR local com o retrato do backup.
 *
 * Uso:  CAP_PORTA=8828 CAP_EMU_PORTA=9028 node tests/capturar-v34.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');
const retratoLib = require('./lib/retrato');
const emuladorLib = require('./lib/emulador');

const RAIZ = path.join(__dirname, '..');
const APP = 'auaulandia/index.html';
const PORTA = Number(process.env.CAP_PORTA) || 8828;
const EMU_PORTA = Number(process.env.CAP_EMU_PORTA) || 9028;
const SAIDA = path.join(RAIZ, 'docs', 'capturas-v34');
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
async function semRolagemLateral(page) {
  await page.evaluate(() => { try { window.scrollBy(-window.scrollX, 0); } catch (e) { /* enfeite de tela */ } });
}
async function estabilizar(page) {
  try { await page.waitForLoadState('networkidle', { timeout: 8000 }); } catch (e) { /* rede não aquietou: segue com a folga abaixo */ }
  await page.waitForTimeout(1200);
}
async function dispensarCartazes(page, quantos) {
  // Nao basta sair no primeiro "nao tem cartaz": o aviso do Telegram chega alguns
  // instantes DEPOIS do Salvar e, se ninguem o dispensar, ele engole o proximo toque.
  for (let i = 0; i < (quantos || 8); i++) {
    const b = await page.$('#zAlertaoOk');
    if (b) { await b.click({ timeout: 5000 }).catch(() => {}); await page.waitForTimeout(450); }
    else await page.waitForTimeout(300);
  }
}
async function fotografarPonto(page, nome) {
  const alvo = await page.$('#ckPt-pele');
  if (!alvo) return false;
  await alvo.scrollIntoViewIfNeeded();
  await semRolagemLateral(page);
  await page.waitForTimeout(400);
  await mascararTelefones(page);
  await alvo.screenshot({ path: path.join(SAIDA, nome), animations: 'disabled', timeout: 30000 });
  console.log(nome);
  return true;
}

// ------------------------------------------------- a foto de teste, feita no navegador
function fabricarFoto(page, destino) {
  return page.evaluate(async () => {
    const L = 1600, A = 1200;
    const c = document.createElement('canvas'); c.width = L; c.height = A;
    const d = c.getContext('2d');
    const g = d.createLinearGradient(0, 0, L, A);
    g.addColorStop(0, '#234D67'); g.addColorStop(1, '#DEB428');
    d.fillStyle = g; d.fillRect(0, 0, L, A);
    for (let i = 0; i < 6000; i++) {
      d.fillStyle = 'rgba(' + ((i * 37) % 255) + ',' + ((i * 91) % 255) + ',' + ((i * 53) % 255) + ',0.6)';
      d.fillRect((i * 733) % L, (i * 397) % A, 12, 12);
    }
    return c.toDataURL('image/jpeg', 0.9).split(',')[1];
  }).then((b64) => {
    const buf = Buffer.from(b64, 'base64');
    fs.writeFileSync(destino, buf);
    return buf.length;
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
  const ARQUIVO_FOTO = path.join(SAIDA, '_foto-de-teste-1600x1200.jpg');
  const LARG = '412';

  const ctx = await navegador.newContext({
    viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.6, isMobile: true, hasTouch: true,
  });
  const page = await ctx.newPage();
  await page.addInitScript(guardaDeEscrita);
  await page.addInitScript((id) => { try { localStorage.setItem('zeluz_device_id', id); } catch (e) { /* sem localStorage o app barra e o erro aparece na tela */ } }, aparelhos[0]);
  await page.goto(URL, { waitUntil: 'load' });
  await estabilizar(page);

  if (!fs.existsSync(ARQUIVO_FOTO)) {
    const bytes = await fabricarFoto(page, ARQUIVO_FOTO);
    console.log('Foto de teste: 1600×1200, ' + Math.round(bytes / 1024) + ' KB');
  }

  await page.fill('#loginPwd', SENHA_DIRETORIA);
  await page.click('.login-btn');
  await page.waitForTimeout(1800);
  await estabilizar(page);
  await dispensarCartazes(page);
  const papel = await page.evaluate(() => document.body.dataset.role || '');
  if (!papel) { console.error('Não entrou no app.'); await navegador.close(); pararTudo(); process.exit(1); }
  console.log('Entrou como: ' + papel);

  // A auditoria passa a ser espiada: é nela que moram checkin-corpo-barrado e checkin-foto-tocou.
  await page.evaluate(() => {
    window.__AUD__ = [];
    const orig = audit;
    audit = function (acao, detalhe, meta) {
      try { window.__AUD__.push({ acao: acao, detalhe: String(detalhe || ''), meta: meta || {} }); } catch (e) { /* o espião nunca derruba a página */ }
      return orig.apply(null, arguments);
    };
  });

  // ---- 1 · abrir o Check-in do corpo e achar a Valentina (valentina__marina) ------
  const val = await page.evaluate(() => {
    const ehEla = (p) => /^valentina$/i.test(String(p.n || '').trim()) && /marina/i.test(String(p.tutor || ''));
    let p = (PELUDINHOS || []).filter(ehEla)[0];
    if (!p) {
      p = { n: 'Valentina', raca: 'Shih Tzu', tutor: 'Marina', nasc: '2020-08-24', dias: [] };
      PELUDINHOS.push(p);
    }
    const dias = (typeof pelDias === 'function' ? pelDias(p) : (p.dias || [])) || [];
    if (dias.indexOf(dcDia) < 0) p.dias = dias.concat([dcDia]);
    if (typeof abrirAtividade === 'function') abrirAtividade('checkin-corpo');
    ckStep = 'exec';
    return { n: p.n, tutor: p.tutor || '', k: dcKey(p.n, p.tutor) };
  });
  await page.waitForTimeout(2200);
  await estabilizar(page);
  await dispensarCartazes(page, 3);
  console.log('FILHOt do teste: ' + val.k);

  // Reabre a ficha e responde o exame inteiro, deixando SÓ "Pele e pelagem" alterado.
  const prepararFicha = async () => {
    await page.waitForTimeout(1200);
    await dispensarCartazes(page, 14);
    await page.evaluate((k) => { if (typeof ckAbrir === 'function') ckAbrir(k); }, val.k);
    await page.waitForTimeout(900);
    await dispensarCartazes(page, 10);
    await page.evaluate(() => {
      const pontos = ckPontosDe(ckAtual.p) || [];
      pontos.forEach((pt) => { if (pt.k !== 'pele') ckMarcar(pt.k, false); });
      ckSet('coleiraRep', 'nao');
      ckSet('coleiraId', 'nao');
    });
    await page.waitForTimeout(600);
    await page.click('#ckPt-pele .ck-b.bad');       // Alterado — e mais nada
    await page.waitForTimeout(600);
  };

  // ---- 2 · (a) e (4): o botão grande nasce com o "Alterado", SEM alerta escolhido --
  await prepararFicha();
  {
    const semAlerta = await page.evaluate(() => {
      const chips = Array.prototype.slice.call(document.querySelectorAll('#ckPt-pele .ck-chip.on'));
      const bt = document.getElementById('ckFotoGB-pele');
      const gal = document.getElementById('ckFotoGG-pele');
      const bloco = document.querySelector('#ckPt-pele .ck-fgrande');
      const alertas = document.querySelector('#ckPt-pele .ck-alertas');
      return {
        alertasEscolhidos: chips.length,
        temBotao: !!bt,
        rotulo: bt ? String(bt.textContent || '').trim() : '',
        temGaleria: !!gal,
        // o botão grande tem de vir ANTES do bloco de alertas na ordem da tela
        antesDosAlertas: !!(bloco && alertas
          && (bloco.compareDocumentPosition(alertas) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0),
        alturaBotao: bt ? Math.round(bt.getBoundingClientRect().height) : 0,
        larguraBotao: bt ? Math.round(bt.getBoundingClientRect().width) : 0,
        // largo de verdade = ocupa TODA a faixa que o ponto lhe dá, sem sobra
        larguraFaixa: bloco ? Math.round(bloco.getBoundingClientRect().width) : 0,
        cameraNoBotao: !!(bt && bt.querySelector('input[type=file][capture]')),
        galeriaSemCaptura: !!(gal && gal.querySelector('input[type=file]') && !gal.querySelector('input[type=file]').hasAttribute('capture')),
      };
    });
    if (semAlerta.alertasEscolhidos !== 0) problemas.push('o teste começou com alerta escolhido — devia estar sem nenhum');
    if (!semAlerta.temBotao) problemas.push('(a) o botão grande NÃO apareceu no ponto Alterado sem alerta escolhido');
    if (semAlerta.rotulo.indexOf('Tirar a foto de Pele e pelagem') < 0) problemas.push('(a) o botão grande não chama o ponto pelo nome: "' + semAlerta.rotulo + '"');
    if (!semAlerta.temGaleria) problemas.push('(a) falta o "Escolher da galeria" ao lado do botão grande');
    if (!semAlerta.antesDosAlertas) problemas.push('(a) o botão grande não é o primeiro da lista — vem depois dos alertas');
    if (!semAlerta.cameraNoBotao) problemas.push('(a) o botão grande não abre a câmera (falta capture)');
    if (!semAlerta.galeriaSemCaptura) problemas.push('(a) a porta da galeria não pode ter capture');
    if (semAlerta.alturaBotao < 44) problemas.push('(a) o botão grande tem só ' + semAlerta.alturaBotao + 'px de altura — toque de dedo pede 44px ou mais');
    if (semAlerta.larguraFaixa - semAlerta.larguraBotao > 2) problemas.push('(a) o botão grande não ocupa a faixa inteira do ponto: ' + semAlerta.larguraBotao + ' de ' + semAlerta.larguraFaixa + 'px');
    console.log('  (a) botão grande: ' + semAlerta.larguraBotao + '×' + semAlerta.alturaBotao + 'px (faixa de ' + semAlerta.larguraFaixa + 'px), sem alerta escolhido ✓');
    await fotografarPonto(page, 'botao-grande-' + LARG + '.png');
  }

  // ---- 3 · (e) barrado sem foto: o botão grande pisca e diz o que fazer -----------
  {
    await page.evaluate(() => { window.__AUD__ = []; });
    await page.evaluate(() => { if (typeof ckSalvar === 'function') ckSalvar(); });
    await page.waitForTimeout(1200);
    const barrou = await page.evaluate(() => {
      const bt = document.getElementById('ckFotoGB-pele');
      const aud = window.__AUD__ || [];
      return {
        barrado: aud.filter((x) => x.acao === 'checkin-corpo-barrado').map((x) => x.detalhe),
        tocou: aud.filter((x) => x.acao === 'checkin-foto-tocou').length,
        pisca: !!(bt && bt.classList.contains('z-falta')),
        texto: bt ? String(bt.textContent || '').trim() : '',
        temEntrada: !!(bt && bt.querySelector('input[type=file]')),
        frase: String((document.querySelector('.z-falta-msg') || {}).textContent || ''),
      };
    });
    if (!barrou.barrado.length) problemas.push('(e) o Salvar NÃO barrou o ponto sem foto');
    if (barrou.tocou !== 0) problemas.push('(e) apareceu rastro de toque onde ninguém tocou em botão nenhum');
    if (!barrou.pisca) problemas.push('(e) o botão grande não recebeu a classe z-falta — não pisca');
    if (barrou.texto.indexOf('toque AQUI para a foto') < 0) problemas.push('(e) o botão grande não passou a dizer "toque AQUI para a foto": "' + barrou.texto + '"');
    if (!barrou.temEntrada) problemas.push('(e) o <input type="file"> foi destruído ao reescrever o texto do botão');
    if (barrou.frase.indexOf('Toque AQUI') < 0) problemas.push('(e) a frase do que fazer não manda tocar no botão: "' + barrou.frase + '"');
    console.log('  (e) barrado sem foto: botão pisca, diz "toque AQUI" e o campo de arquivo sobreviveu ✓');
    await fotografarPonto(page, 'barrado-pisca-' + LARG + '.png');
  }

  // ---- 4 · (b) e (f) a foto entra pelas FOTOS EXTRAS e o Salvar passa -------------
  {
    await page.evaluate(() => { window.__AUD__ = []; });
    const [seletor] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.click('#ckPt-pele .ck-extras .ex-add'),      // "+ outra foto"
    ]);
    await seletor.setFiles(ARQUIVO_FOTO);
    await page.waitForSelector('#ckPt-pele .ck-extras .ex-item img', { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(800);

    const depoisDaExtra = await page.evaluate(() => {
      const at = (ckRascunho && ckRascunho.pontos && ckRascunho.pontos.pele) || {};
      const aud = window.__AUD__ || [];
      const t = aud.filter((x) => x.acao === 'checkin-foto-tocou')[0] || null;
      return {
        extras: (at.extras || []).length,
        temFotoPrincipal: !!at.foto,
        botaoGrandeSaiu: !document.getElementById('ckFotoGB-pele'),
        miniatura: !!document.querySelector('#ckPt-pele .ck-foto img'),
        tocou: t ? { detalhe: t.detalhe, campo: (t.meta || {}).campo, ponto: (t.meta || {}).ponto } : null,
      };
    });
    if (depoisDaExtra.extras !== 1) problemas.push('(b) a foto não entrou nas extras: extras=' + depoisDaExtra.extras);
    if (depoisDaExtra.temFotoPrincipal) problemas.push('(b) o teste precisa da foto SÓ nas extras — ela caiu no campo principal');
    if (!depoisDaExtra.botaoGrandeSaiu) problemas.push('(b) com foto no ponto o botão grande devia sair da frente');
    if (!depoisDaExtra.miniatura) problemas.push('(b) a foto das extras não apareceu como a foto do ponto');
    if (!depoisDaExtra.tocou) problemas.push('(f) o toque em "+ outra foto" não deixou rastro checkin-foto-tocou');
    else {
      if (depoisDaExtra.tocou.campo !== 'extra') problemas.push('(f) o rastro do toque não diz o campo usado: ' + JSON.stringify(depoisDaExtra.tocou));
      if (depoisDaExtra.tocou.ponto !== 'pele') problemas.push('(f) o rastro do toque não diz o ponto: ' + JSON.stringify(depoisDaExtra.tocou));
      console.log('  (f) rastro do toque: ' + depoisDaExtra.tocou.detalhe);
    }
    await fotografarPonto(page, 'foto-pela-extra-' + LARG + '.png');

    await page.evaluate(() => { window.__AUD__ = []; });
    await page.evaluate(() => { if (typeof ckSalvar === 'function') ckSalvar(); });
    await page.waitForTimeout(1500);
    const veredito = await page.evaluate((k) => {
      const aud = window.__AUD__ || [];
      const reg = (typeof ckDados !== 'undefined' && ckDados[k]) || null;
      return {
        barrado: aud.filter((x) => x.acao === 'checkin-corpo-barrado').map((x) => x.detalhe),
        vermelhos: document.querySelectorAll('.z-falta-msg').length,
        gravado: !!reg,
        fotoRef: !!(reg && reg.pontos && reg.pontos.pele && reg.pontos.pele.fotoRef),
        semBase64: reg ? JSON.stringify(reg).indexOf('data:image') < 0 : false,
      };
    }, val.k);
    if (veredito.barrado.length) problemas.push('(b) o Salvar foi BARRADO com a foto nas extras: ' + JSON.stringify(veredito.barrado));
    if (veredito.vermelhos) problemas.push('(b) a tela ficou com ' + veredito.vermelhos + ' campo(s) em vermelho');
    if (!veredito.gravado) problemas.push('(b) o check-in não foi montado para gravação');
    if (!veredito.fotoRef) problemas.push('(b) o registro saiu sem fotoRef em Pele e pelagem');
    if (!veredito.semBase64) problemas.push('(b) o registro do dia voltou a carregar base64 de foto');
    console.log('  (b) foto pelas EXTRAS: Salvar passou, 0 barramentos, ponto com fotoRef ✓');
  }

  // ---- 5 · (c) a foto entra pela DE LONGE e o Salvar passa ------------------------
  {
    await prepararFicha();
    // A caixa "2 · De longe" só existe enquanto o alerta é de machucado. Ela fotografa por
    // ali e DEPOIS troca o alerta — caminho real de quem muda de ideia sobre o que viu.
    const chipMachucado = await page.$('#ckPt-pele .ck-chip:text-is("Machucado")');
    if (!chipMachucado) problemas.push('(c) não achei o alerta "Machucado" em Pele e pelagem');
    else {
      await chipMachucado.click();
      await page.waitForTimeout(600);
      const [sel2] = await Promise.all([
        page.waitForEvent('filechooser'),
        page.click('#ckPt-pele .ck-foto2 .cx:nth-child(2) .ck-fbt label.btn-gold'),
      ]);
      await sel2.setFiles(ARQUIVO_FOTO);
      await page.waitForSelector('#ckPt-pele .ck-fstatus.ok', { timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(800);

      // troca o alerta: sai o machucado, entra "Pele vermelha" — a foto de longe fica
      await page.click('#ckPt-pele .ck-chip:text-is("Machucado")');
      await page.waitForTimeout(500);
      const chipVermelha = await page.$('#ckPt-pele .ck-chip:text-is("Pele vermelha")');
      if (chipVermelha) { await chipVermelha.click(); await page.waitForTimeout(500); }

      const soLonge = await page.evaluate(() => {
        const at = (ckRascunho && ckRascunho.pontos && ckRascunho.pontos.pele) || {};
        return {
          temFoto: !!at.foto, temLonge: !!at.foto2, extras: (at.extras || []).length,
          botaoGrandeSaiu: !document.getElementById('ckFotoGB-pele'),
          miniatura: !!document.querySelector('#ckPt-pele .ck-foto img'),
        };
      });
      if (soLonge.temFoto || !soLonge.temLonge) problemas.push('(c) o teste precisa da foto SÓ na gaveta "de longe": ' + JSON.stringify(soLonge));
      if (!soLonge.botaoGrandeSaiu) problemas.push('(c) com a foto de longe no ponto o botão grande devia sair da frente');
      if (!soLonge.miniatura) problemas.push('(c) a foto de longe não apareceu como a foto do ponto');
      await fotografarPonto(page, 'foto-pela-longe-' + LARG + '.png');

      await page.evaluate(() => { window.__AUD__ = []; });
      await page.evaluate(() => { if (typeof ckSalvar === 'function') ckSalvar(); });
      await page.waitForTimeout(1500);
      const v2 = await page.evaluate((k) => {
        const aud = window.__AUD__ || [];
        const reg = (typeof ckDados !== 'undefined' && ckDados[k]) || null;
        return {
          barrado: aud.filter((x) => x.acao === 'checkin-corpo-barrado').map((x) => x.detalhe),
          vermelhos: document.querySelectorAll('.z-falta-msg').length,
          fotoRef: !!(reg && reg.pontos && reg.pontos.pele && reg.pontos.pele.fotoRef),
        };
      }, val.k);
      if (v2.barrado.length) problemas.push('(c) o Salvar foi BARRADO com a foto de longe: ' + JSON.stringify(v2.barrado));
      if (v2.vermelhos) problemas.push('(c) a tela ficou com ' + v2.vermelhos + ' campo(s) em vermelho');
      if (!v2.fotoRef) problemas.push('(c) o registro saiu sem fotoRef em Pele e pelagem');
      console.log('  (c) foto pela DE LONGE: Salvar passou, 0 barramentos ✓');
    }
  }

  // ---- 6 · (d) machucado com DUAS fotos extras passa ------------------------------
  {
    await prepararFicha();
    const chipMachucado = await page.$('#ckPt-pele .ck-chip:text-is("Machucado")');
    if (!chipMachucado) problemas.push('(d) não achei o alerta "Machucado" em Pele e pelagem');
    else {
      await chipMachucado.click();
      await page.waitForTimeout(600);
      await page.fill('#ckPt-pele input[placeholder^="EM QUE PARTE DO CORPO"]', 'no dorso, perto da escápula');
      await page.waitForTimeout(400);
      for (let i = 0; i < 2; i++) {
        const [sel] = await Promise.all([
          page.waitForEvent('filechooser'),
          page.click('#ckPt-pele .ck-extras .ex-add'),
        ]);
        await sel.setFiles(ARQUIVO_FOTO);
        await page.waitForTimeout(1400);
      }
      const duas = await page.evaluate(() => {
        const at = (ckRascunho && ckRascunho.pontos && ckRascunho.pontos.pele) || {};
        return { extras: (at.extras || []).length, temFoto: !!at.foto, temLonge: !!at.foto2 };
      });
      if (duas.extras !== 2 || duas.temFoto || duas.temLonge) problemas.push('(d) o teste precisa das DUAS fotos só nas extras: ' + JSON.stringify(duas));
      await fotografarPonto(page, 'machucado-extras-' + LARG + '.png');

      await page.evaluate(() => { window.__AUD__ = []; });
      await page.evaluate(() => { if (typeof ckSalvar === 'function') ckSalvar(); });
      await page.waitForTimeout(1500);
      const v3 = await page.evaluate((k) => {
        const aud = window.__AUD__ || [];
        const reg = (typeof ckDados !== 'undefined' && ckDados[k]) || null;
        return {
          barrado: aud.filter((x) => x.acao === 'checkin-corpo-barrado').map((x) => x.detalhe),
          vermelhos: document.querySelectorAll('.z-falta-msg').length,
          fotoRef: !!(reg && reg.pontos && reg.pontos.pele && reg.pontos.pele.fotoRef),
        };
      }, val.k);
      if (v3.barrado.length) problemas.push('(d) machucado com duas fotos extras foi BARRADO: ' + JSON.stringify(v3.barrado));
      if (v3.vermelhos) problemas.push('(d) a tela ficou com ' + v3.vermelhos + ' campo(s) em vermelho');
      if (!v3.fotoRef) problemas.push('(d) o registro saiu sem fotoRef em Pele e pelagem');
      console.log('  (d) machucado com DUAS fotos extras: Salvar passou ✓');
    }
  }

  // ---- 7 · nenhum vocabulário proibido e nada gravado no banco --------------------
  {
    const t = ((await page.innerText('body')) || '').toLowerCase();
    ['cachorro', 'cãozinho', 'dono ', 'funcionário'].forEach((p2) => {
      if (t.indexOf(p2) >= 0) problemas.push('palavra proibida "' + p2.trim() + '" na tela');
    });
  }
  const escritas = await page.evaluate(() => (window.__ESCRITAS__ || []));
  console.log('Tentativas de gravação barradas pelo guarda: ' + escritas.length + ' (nenhuma foi ao banco)');
  await ctx.close();

  await navegador.close();
  pararTudo();
  if (problemas.length) { console.error('\nPROBLEMAS:\n- ' + problemas.join('\n- ')); process.exit(1); }
  console.log('\nCaptura da v ' + versao + ' pronta em docs/capturas-v34/');
})().catch((e) => { console.error(e); process.exit(1); });
