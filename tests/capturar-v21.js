'use strict';
/*
 * CAPTURA DA v 2026-09-17-03 — a ficha de check-in em PDF no layout aprovado (UMA página)
 * e o check-in com o botão novo.
 *
 * POR QUE ESTA CAPTURA EXISTE
 * A Adriana viu o PDF do Check-in sair com OITO páginas e sem as informações. A causa era
 * um segundo montador, que ia para a impressão do navegador. Estas fotos provam, com o app
 * de verdade rodando, que agora sai o PDF aprovado e que ele tem uma página só.
 *
 * O QUE ELA FOTOGRAFA
 *   1. ficha-checkin-pdf-pagina1.png — a FICHA DE VERDADE: o PDF é gerado dentro da página
 *      (ciBuildPdfBlob, o montador aprovado), salvo em disco e convertido em imagem pelo
 *      pdftoppm. Se o PDF tiver mais de uma página, a captura FALHA.
 *   2. checkin-botao-salvar-e-gerar.png — o rodapé da tela do check-in: o botão principal
 *      "Salvar e gerar a ficha em PDF", o "Baixar a ficha em PDF" e a linha informativa
 *      (o 8º item do "o que falta", que nunca trava o salvar).
 *   3. cartaz-ficha-nao-chegou-telegram.png — o cartaz vermelho simulado: as frases saem da
 *      função de verdade (ciFichaLinhasFalha), com o Telegram respondendo "fora do ar".
 *
 * NADA É GRAVADO: o mesmo guarda de escrita do smoke embrulha set/update/push/remove antes
 * de o app carregar, e o banco é o EMULADOR local com o retrato do backup.
 *
 * Uso:  NODE_PATH=C:/Users/zeluz/projetos-aios/code/node_modules node tests/capturar-v21.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const retratoLib = require('./lib/retrato');
const emuladorLib = require('./lib/emulador');

const RAIZ = path.join(__dirname, '..');
const APP = 'auaulandia/index.html';
const EMU_PORTA = Number(process.env.CAP_EMU_PORTA) || 9007;
const SAIDA = path.join(RAIZ, 'docs', 'capturas-v21');
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

// ------------------------------------------------------------------ PDF → imagem
// Sem ferramenta local a captura não inventa nada: avisa e segue com as outras fotos.
function pdfParaPng(pdf, destinoSemExt) {
  const candidatos = [
    'pdftoppm',
    'C:/Users/zeluz/AppData/Local/Microsoft/WinGet/Packages/oschwartz10612.Poppler_Microsoft.Winget.Source_8wekyb3d8bbwe/poppler-25.07.0/Library/bin/pdftoppm.exe',
  ];
  for (const exe of candidatos) {
    try {
      execFileSync(exe, ['-png', '-r', '110', '-f', '1', '-l', '1', pdf, destinoSemExt], { stdio: 'ignore' });
      return true;
    } catch (e) { /* tenta o próximo caminho */ }
  }
  return false;
}

(async () => {
  fs.mkdirSync(SAIDA, { recursive: true });
  const servidor = await subirServidor(Number(process.env.CAP_PORTA) || 8797);
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

  const ctx = await navegador.newContext({ viewport: { width: 430, height: 1100 }, deviceScaleFactor: 2 });
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
  if (!papel) { console.error('Não entrou no app.'); await navegador.close(); pararTudo(); process.exit(1); }
  console.log('Entrou como: ' + papel);

  // ============================================ 1. a FICHA de verdade, em PDF
  // O hóspede e a ficha são de mentira, mas o MONTADOR é o do app (ciBuildPdfBlob) e o
  // arquivo é o mesmo que a consultora baixa no celular.
  const ficha = await page.evaluate(async () => {
    ciHosp = { nome: 'Bud', raca: 'Spitz Alemão', tutor: 'Carolina', refKey: 'bud__carolina' };
    window.extraDoHosp = () => ({ alergia: 'frango', restricao: '', microchip: '985113001234',
      vetNome: 'Dra. Tanara Kelly', vetTel: '(31) 99999-1234', vetClinica: 'Clínica Amigo Fiel' });
    window.ciColetarFicha = () => ({
      entrada: '2026-09-17', saida: '2026-09-24', saidaPer: 'Tarde',
      pertences: [{ nome: 'Mochila', spec: 'azul' }, { nome: 'Vasilha' }, { nome: 'Coberta' }],
      ficha: {
        obsGeral: 'Dorme melhor com a coberta dele. Não gosta de barulho alto.',
        medObs: 'O tutor trouxe o Apoquel contado.',
        alim: {
          tipo: 'Ração', marca: 'Guabi', qtd: 80, unidade: 'g', refeicoes: 2,
          refs: { fixas: { cafe: { on: true, hora: '07:30', racao: '80' },
                           jantar: { on: true, hora: '18:00', racao: '80', natural: '50' } }, extras: [] },
          dias: 7, minimo: 1120, trazida: 1200,
          comida: { qtd: 50, refeicoes: { jantar: true }, minimo: 350, trazida: 400 },
        },
        spa: { banho: 'Sim', tipo: 'Dermoprotetor', horario: '10:00' },
      },
    });
    window.ciColetarMeds = () => ({
      a: { nome: 'Apoquel', q: '1', u: 'comprimido', horarios: ['07:00', '18:00'],
           estoque: { inicial: 14 } },
    });
    const el = document.getElementById('ciAssinaNome'); if (el) el.value = 'Carolina Duarte';
    const qd = document.getElementById('ciQuemDeixou'); if (qd) qd.value = '';
    const blob = ciBuildPdfBlob();
    const b64 = await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(String(fr.result).split(',')[1]); fr.readAsDataURL(blob); });
    return { b64, paginas: blob.paginas, bytes: blob.bytes, nome: ciPdfFileName() };
  });
  const pdfPath = path.join(SAIDA, 'ficha-checkin.pdf');
  fs.writeFileSync(pdfPath, Buffer.from(ficha.b64, 'base64'));
  console.log('PDF gerado no app: ' + ficha.nome + ' — ' + ficha.paginas + ' página(s), ' + ficha.bytes + ' bytes');
  if (ficha.paginas !== 1) problemas.push('a ficha do caso típico saiu com ' + ficha.paginas + ' página(s) — o layout aprovado é de UMA');
  if (!/^Checkin-Bud-/.test(ficha.nome)) problemas.push('o nome do arquivo não é o combinado: ' + ficha.nome);
  const base = path.join(SAIDA, 'ficha-checkin-pdf-pagina1');
  if (pdfParaPng(pdfPath, base)) {
    // o pdftoppm acrescenta o número da página ao nome
    ['-1', '-01', '-001'].forEach((suf) => {
      const de = base + suf + '.png';
      if (fs.existsSync(de)) fs.renameSync(de, base + '.png');
    });
    console.log('ficha-checkin-pdf-pagina1.png — a ficha convertida em imagem');
  } else {
    problemas.push('não achei o pdftoppm neste computador: o PDF está em docs/capturas-v21/ficha-checkin.pdf, sem a versão em imagem');
  }

  // ============================================ 2. o rodapé da tela do check-in
  await page.evaluate(() => {
    abrirItemDoMenu('checkin');
    // A ficha do check-in só aparece depois de escolher o FILHOt — é esse o caminho real.
    if (typeof PELUDINHOS !== 'undefined' && PELUDINHOS.length) ciEscolher(0);
    else {
      document.getElementById('ci-escolha').style.display = 'none';
      document.getElementById('ci-ficha').style.display = 'block';
    }
  });
  await page.waitForTimeout(1400);
  await page.evaluate(() => {
    const el = document.getElementById('ciBtnSalvar');
    if (el) el.scrollIntoView({ block: 'center' });
  });
  await page.waitForTimeout(600);
  const rodape = await page.evaluateHandle(() => {
    const b = document.getElementById('ciBtnSalvar');
    return b ? (b.closest('.card') || b.parentElement) : null;
  });
  const elRodape = rodape.asElement();
  if (elRodape) {
    await elRodape.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await elRodape.screenshot({ path: path.join(SAIDA, 'checkin-botao-salvar-e-gerar.png') });
    console.log('checkin-botao-salvar-e-gerar.png — o botão novo e a linha informativa');
  } else { problemas.push('não achei o cartão dos botões do check-in'); }
  const textos = await page.evaluate(() => ({
    salvar: (document.getElementById('ciBtnSalvar') || {}).textContent || '',
    aviso: (document.getElementById('ciFichaAviso') || {}).textContent || '',
    baixar: [].map.call(document.querySelectorAll('#v-checkin button'), (b) => b.textContent.trim())
      .filter((t) => /ficha em PDF/.test(t)),
  }));
  if (!/Salvar e gerar a ficha em PDF/.test(textos.salvar)) problemas.push('o botão principal não diz o que faz: ' + textos.salvar);
  if (!/gerada e guardada ao salvar/.test(textos.aviso)) problemas.push('a linha informativa não apareceu na tela');
  if (!textos.baixar.length) problemas.push('o botão de baixar a ficha não está na tela');

  // ============================================ 3. o cartaz de quando o grupo NÃO recebe
  // As frases saem da função de verdade (ciFichaLinhasFalha) — o cartaz é o mesmo que o
  // salvar mostra quando a ponte do Telegram não responde.
  await page.evaluate(() => {
    const f = { ok: false, nome: 'Checkin-Bud-2026-09-17.pdf', paginas: 1, baixou: true,
      recibo: { tg: { ok: false, erro: 'a ponte respondeu fora do ar' } } };
    zAlertao('⚠ A FICHA NÃO CHEGOU AO TELEGRAM — MANDE O PDF BAIXADO PELO SEU CELULAR AGORA',
      ['O check-in ESTÁ SALVO. Bud — estadia de 17/09/2026 até 24/09/2026.',
       'Já aparece na Conferência e no Plantão.'].concat(ciFichaLinhasFalha(f)),
      { botao: 'Vou mandar agora' });
  });
  await page.waitForTimeout(700);
  // O cartaz é o #zAlertaoBox (o fundo escuro com a caixa dentro). O filho direto é a caixa.
  const cartaz = (await page.evaluateHandle(() => {
    const box = document.getElementById('zAlertaoBox');
    return box ? (box.firstElementChild || box) : null;
  })).asElement();
  if (cartaz) {
    await cartaz.screenshot({ path: path.join(SAIDA, 'cartaz-ficha-nao-chegou-telegram.png') });
    console.log('cartaz-ficha-nao-chegou-telegram.png — o aviso que não deixa a ficha morrer calada');
  } else {
    await page.screenshot({ path: path.join(SAIDA, 'cartaz-ficha-nao-chegou-telegram.png') });
    console.log('cartaz-ficha-nao-chegou-telegram.png — a tela inteira (não isolei o cartaz)');
  }

  const escritas = await page.evaluate(() => (window.__ESCRITAS__ || []).length);
  console.log('Tentativas de gravação barradas pelo guarda: ' + escritas + ' (nenhuma foi ao banco)');

  await navegador.close();
  pararTudo();
  if (problemas.length) { console.error('\nPROBLEMAS:\n- ' + problemas.join('\n- ')); process.exit(1); }
  console.log('\nCaptura v-21 pronta em docs/capturas-v21/');
})().catch((e) => { console.error(e); process.exit(1); });
