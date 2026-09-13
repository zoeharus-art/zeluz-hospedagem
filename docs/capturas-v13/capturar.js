'use strict';
/*
 * Capturas do v-14 (2026-09-13-02) — a TRILHA QUE TREINA no Início do Check-in do corpo
 * (molde B, aprovado pela Adriana em 13/set/2026: "Aprovado o B, pode levar para o app").
 *
 * Roda no EMULADOR local carregado com o retrato do backup: o Firebase de verdade não
 * recebe um byte (a lição dos 695 MB de 08/set). Além disso, o mesmo guarda do smoke
 * embrulha set/update/push/remove/transaction — nenhuma gravação é executada, só anotada.
 * O script SÓ navega e ajusta o ESTADO DE TELA (quem está em treinamento, passo aberto,
 * motivo aberto) para fotografar os quatro momentos da trilha e o modo com prática.
 *
 * Uso: NODE_PATH=C:/Users/zeluz/projetos-aios/code/node_modules node docs/capturas-v13/capturar.js
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
const EMU_PORTA = 9002;
const SENHA_DIRETORIA = '1101';

function servidor() {
  const tipos = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml',
    '.webp': 'image/webp', '.jpg': 'image/jpeg', '.json': 'application/json; charset=utf-8' };
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
  const anotar = (m, r) => { try { window.__ESCRITAS__.push({ metodo: m, caminho: String(r) }); } catch (e) { /* o guarda nunca derruba a página */ } };
  const tenta = setInterval(() => {
    const fb = window.firebase;
    if (!fb || !fb.database || !fb.database.Reference) return;
    const R = fb.database.Reference.prototype;
    ['set', 'update', 'remove', 'push'].forEach((m) => {
      if (typeof R[m] !== 'function') return;
      R[m] = function () { anotar(m, this); return Promise.resolve(); };
    });
    if (typeof R.transaction === 'function') {
      R.transaction = function () { anotar('transaction', this); return Promise.resolve({ committed: false, snapshot: null }); };
    }
    clearInterval(tenta);
  }, 50);
}

function versaoNoDisco() {
  const html = fs.readFileSync(path.join(RAIZ, APP), 'utf8');
  const m = /const APP_VERSAO='([^']+)'/.exec(html);
  return m ? m[1] : '';
}

async function limpar(page) {
  await page.evaluate(() => { ['zAlertaoBox', 'zEscolhaBox'].forEach((id) => { const el = document.getElementById(id); if (el) el.remove(); }); });
}

async function entrar(page, base, aparelho) {
  await page.goto(base + '/' + APP + '?emulador=' + EMU_PORTA, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof DB !== 'undefined' && !!DB, null, { timeout: 45000 });
  await page.waitForTimeout(2000);
  await page.fill('#loginPwd', SENHA_DIRETORIA);
  await page.click('.login-btn');
  await page.waitForTimeout(1800);
  const pedeNome = await page.$('#loginPessoa');
  if (pedeNome) { await page.fill('#loginPessoa', 'Letícya'); await page.click('#zCampoOk'); await page.waitForTimeout(1200); }
  await page.waitForTimeout(2500);
  await limpar(page);
}

async function capturar(page, arq, inteira) {
  await page.screenshot({ path: path.join(SAIDA, arq), fullPage: inteira !== false });
  console.log('captura:', arq);
}

// Os 12 passos, os porquês e a pergunta da semana como a semeadura os grava — o retrato do
// backup é de 12/set e ainda não tem os porquês (eles nasceram em 13/set).
async function montarProtocolo(page) {
  await page.evaluate(() => {
    PROTOCOLOS = Object.assign({}, PROTOCOLOS, {
      'checkin-corpo': {
        inicio: { passos: CK_INICIO_PADRAO.slice(), porques: CK_INICIO_PORQUES.slice(),
                  perguntas: JSON.parse(JSON.stringify(CK_INICIO_PERGUNTAS)),
                  atualizadoEm: Date.now(), atualizadoPor: 'Gestão' },
        fim: { passos: [] },
      },
    });
  });
}

async function emTreinamento(page, ligado) {
  await page.evaluate((lig) => {
    meuMonId = function () { return 'demo'; };
    TREINAMENTO = lig ? { demo: { ativo: true, por: 'Márcia · Gestora', em: Date.now() } } : {};
    ckIni = {};
    CKT = { porque: false, motivo: false, quizResp: null };
    PROTO_FEITOS = {}; CKT_PONTOS_MES = 0; CKT_SEMANA = null; CKT_SEMANA_PEDIDA = true;
    if (typeof setCkStep === 'function') setCkStep('inicio');
  }, ligado);
  await page.waitForTimeout(700);
}

(async () => {
  const srv = await servidor();
  const retrato = retratoLib.carregar();
  const emulador = await emuladorLib.subir({
    porta: EMU_PORTA, retrato, versaoApp: versaoNoDisco(),
    regras: fs.readFileSync(path.join(RAIZ, 'database.rules.v2.json'), 'utf8'),
    log: (m) => console.log('Emulador: ' + m),
  });
  const base = 'http://127.0.0.1:' + PORTA;
  const navegador = await chromium.launch({ headless: true });

  // A trava por aparelho é real: sem um id JÁ autorizado ninguém entra. Reaproveitar um id
  // existente é leitura pura — não cria, não altera e não apaga nada.
  const ctxD = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
  const pD = await ctxD.newPage();
  await pD.goto(base + '/' + APP + '?emulador=' + EMU_PORTA, { waitUntil: 'load' });
  await pD.waitForFunction(() => typeof DB !== 'undefined' && !!DB, null, { timeout: 45000 });
  const aparelhos = await pD.evaluate(async () => {
    const s = await DB.ref('auaulandia/aparelhos').once('value');
    return Object.keys(s.val() || {});
  });
  await ctxD.close();
  if (!aparelhos.length) { console.error('Nenhum aparelho autorizado no retrato — abortando.'); process.exit(1); }
  const aparelho = aparelhos.slice().sort()[0];
  console.log('Aparelho reaproveitado: ' + aparelho);

  const todas = [];

  // ---------- o celular: a trilha, momento a momento ----------
  {
    const ctx = await navegador.newContext({ viewport: { width: 390, height: 900 } });
    const page = await ctx.newPage();
    await page.addInitScript(guardaDeEscrita);
    await page.addInitScript((id) => { try { localStorage.setItem('zeluz_device_id', id); } catch (e) { /* sem localStorage a trava barra e o script avisa */ } }, aparelho);
    await entrar(page, base, aparelho);
    await page.evaluate(() => { if (typeof abrirAtividade === 'function') abrirAtividade('checkin-corpo'); });
    await page.waitForTimeout(3500);
    await montarProtocolo(page);
    await limpar(page);

    // 1) em treinamento, passo 1 de 12
    await emTreinamento(page, true);
    await limpar(page);
    await capturar(page, 'celular-390-1-treinamento-passo1.png');

    // 2) o porquê aberto
    await page.evaluate(() => { CKT.porque = true; renderCheckin(); });
    await page.waitForTimeout(500);
    await limpar(page);
    await capturar(page, 'celular-390-2-treinamento-porque-aberto.png');

    // 3) "Não deu para fazer" com as três opções
    await page.evaluate(() => { CKT.porque = false; CKT.motivo = true; renderCheckin(); });
    await page.waitForTimeout(500);
    await limpar(page);
    await capturar(page, 'celular-390-3-treinamento-nao-deu.png');

    // 4) a tela do fim: confira os 12, placar e a pergunta da semana
    await page.evaluate(() => {
      for (let i = 0; i < 12; i++) ckIni[i] = { quem: 'Letícya', hora: '07:' + String(10 + i).padStart(2, '0'), ts: Date.now() + i };
      ckIni[2].naoDeu = 'acabou-material';
      PROTO_FEITOS = { 'checkin-corpo-inicio': { '2026-09-10': 1, '2026-09-11': 1, '2026-09-12': 1 } };
      CKT_PONTOS_MES = 30; CKT_SEMANA = { 2: 2 }; CKT_SEMANA_PEDIDA = true;
      CKT = { porque: false, motivo: false, quizResp: null };
      renderCheckin();
    });
    await page.waitForTimeout(600);
    await limpar(page);
    await capturar(page, 'celular-390-4-treinamento-fim.png');

    // 5) o modo com prática: a lista de marcar com a frase de advertência
    await emTreinamento(page, false);
    await limpar(page);
    await capturar(page, 'celular-390-5-com-pratica.png');

    // 6) Configurações › Protocolos, no celular
    await page.evaluate(() => { if (typeof abrirItemDoMenu === 'function') abrirItemDoMenu('config'); });
    await page.waitForTimeout(3500);
    await montarProtocolo(page);
    await page.evaluate(() => { if (typeof protoRender === 'function') protoRender(); });
    await page.waitForTimeout(600);
    await limpar(page);
    await capturar(page, 'celular-390-6-configuracoes-protocolos.png');

    todas.push(...await page.evaluate(() => (window.__ESCRITAS__ || []).map((e) => e.metodo + ' ' + e.caminho)));
    await ctx.close();
  }

  // ---------- o computador: a tela da Gestão ----------
  {
    const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.addInitScript(guardaDeEscrita);
    await page.addInitScript((id) => { try { localStorage.setItem('zeluz_device_id', id); } catch (e) { /* sem localStorage a trava barra e o script avisa */ } }, aparelho);
    await entrar(page, base, aparelho);
    await page.evaluate(() => { if (typeof abrirItemDoMenu === 'function') abrirItemDoMenu('config'); });
    await page.waitForTimeout(3500);
    await montarProtocolo(page);
    await page.evaluate(() => { if (typeof protoRender === 'function') protoRender(); });
    await page.waitForTimeout(800);
    await limpar(page);
    await capturar(page, 'desktop-1440-7-configuracoes-protocolos.png');
    todas.push(...await page.evaluate(() => (window.__ESCRITAS__ || []).map((e) => e.metodo + ' ' + e.caminho)));
    await ctx.close();
  }

  await navegador.close();
  emulador.parar();
  srv.close();
  console.log('\nGravações tentadas (anotadas e NÃO executadas): ' + todas.length);
  todas.slice(0, 10).forEach((t) => console.log('  · ' + t));
})().catch((e) => { console.error('ERRO nas capturas:', e); process.exit(1); });
