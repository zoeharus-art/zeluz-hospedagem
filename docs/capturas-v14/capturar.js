'use strict';
/*
 * Capturas do v 2026-09-15-01 — AS FOTOS DO CHECK-IN DO CORPO.
 *
 * O que estas telas provam (Adriana, 15/set/2026, caso Cookie/Giulia):
 *   1. o rascunho volta sozinho quando a tela é reaberta ("Recuperei o que você já
 *      tinha preenchido") — nada mais se perde levando as fotos junto;
 *   2. "Pele molhada" e "Pele vermelha" são DOIS chips, e o bloco "Quem precisa ver
 *      isto?" saiu da tela da monitora;
 *   3. a galeria "Fotos do corpo" existe na ficha do FILHOt e no Cuidado Vet, com a
 *      foto abrindo em tamanho grande e os botões Baixar e Enviar.
 *
 * Roda no EMULADOR local carregado com o retrato do backup: o Firebase de verdade não
 * recebe um byte (a lição dos 695 MB de 08/set). O guarda de escrita embrulha
 * set/update/push/remove/transaction — nenhuma gravação é executada, só anotada.
 * As fotos da galeria são desenhadas no próprio navegador (canvas) e entregues ao
 * ckGaleriaRender: a captura mostra a TELA, e é o harness que prova o caminho do banco.
 *
 * Uso: NODE_PATH=C:/Users/zeluz/projetos-aios/code/node_modules node docs/capturas-v14/capturar.js
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
const PORTA = 8797;
const EMU_PORTA = 9004;
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

// Escrita anotada, nunca executada — o mesmo espírito do guarda do smoke.
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

async function entrar(page, base) {
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

// Desenha a galeria com fotos de MENTIRA, feitas ali mesmo no canvas do navegador.
// Nenhuma foto real de FILHOt sai do banco para uma captura — e o caminho de verdade
// (daycare/fotos-corpo) é o harness que prova, não a imagem.
async function desenharGaleria(page, caixaId, nomePel) {
  await page.evaluate(([alvo, nome]) => {
    const pinta = (rotulo, cor) => {
      const c = document.createElement('canvas');
      c.width = 420; c.height = 420;
      const g = c.getContext('2d');
      g.fillStyle = cor; g.fillRect(0, 0, 420, 420);
      g.fillStyle = 'rgba(255,253,246,.94)';
      g.textAlign = 'center';
      g.font = 'bold 30px Poppins, sans-serif';
      g.fillText(rotulo, 210, 200);
      g.font = '600 19px Poppins, sans-serif';
      g.fillText('exemplo para a captura', 210, 240);
      return c.toDataURL('image/jpeg', 0.7);
    };
    const hoje = dcDataKey();
    const ontem = orcMaisDias(hoje, -1);
    const itens = [
      { dia: hoje, tipo: 'entrada', ptk: 'pele', ponto: 'Pele e pelagem',
        alertas: ['Pele vermelha', 'Falha de pelo'], local: 'no dorso, perto da escápula',
        quem: 'Giulia', hora: '08:12', ts: Date.now(),
        fotos: [{ src: pinta('Pele e pelagem', '#234D67'), rot: 'de perto', suf: '' },
                { src: pinta('de longe', '#7c6a3f'), rot: 'de longe', suf: 'de-longe' }] },
      { dia: ontem, tipo: 'saida', ptk: 'patas', ponto: 'Patas e coxins',
        alertas: ['Pata molhada'], local: '', quem: 'Wandela', hora: '17:40',
        ts: Date.now() - 86400000,
        fotos: [{ src: pinta('Patas e coxins', '#1E8449'), rot: 'de perto', suf: '' }] },
    ];
    const caixa = document.getElementById(alvo + 'Wrap');
    if (caixa) caixa.style.display = '';
    ckGaleriaRender(document.getElementById(alvo), itens, nome);
    if (caixa) caixa.scrollIntoView({ block: 'center' });
  }, [caixaId, nomePel]);
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

  // A trava por aparelho é real: reaproveitar um id já autorizado é leitura pura.
  const ctxD = await navegador.newContext({ viewport: { width: 1280, height: 900 } });
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

  // ---------- o celular (390px): a tela da monitora ----------
  {
    const ctx = await navegador.newContext({ viewport: { width: 390, height: 900 } });
    const page = await ctx.newPage();
    await page.addInitScript(guardaDeEscrita);
    await page.addInitScript((id) => { try { localStorage.setItem('zeluz_device_id', id); } catch (e) { /* sem localStorage a trava barra e o script avisa */ } }, aparelho);
    await entrar(page, base);
    await page.evaluate(() => { if (typeof abrirAtividade === 'function') abrirAtividade('checkin-corpo'); });
    await page.waitForTimeout(3500);
    // quem já tem prática cai direto na lista de marcar (sem a trilha de treinamento)
    await page.evaluate(() => {
      meuMonId = function () { return 'demo'; };
      TREINAMENTO = {};
      if (typeof setCkStep === 'function') setCkStep('exec');
      // o protocolo fica RECOLHIDO depois da primeira leitura: e assim que a monitora
      // com pratica ve a tela, e e assim que a captura precisa mostra-la
      CK_PROTO_ABERTO = false;
      renderCheckin();
    });
    await page.waitForTimeout(700);
    await limpar(page);

    // 1) "Pele e pelagem" marcado como Alterado: os DOIS chips novos, e nenhum bloco
    //    "Quem precisa ver isto?" embaixo das fotos
    const abriu = await page.evaluate(() => {
      const t = (typeof turmaDoDia === 'function') ? turmaDoDia() : [];
      if (!t.length) return null;
      const k = dcKey(t[0].p.n, t[0].p.tutor);
      ckAbrir(k);
      ckMarcar('pele', true);
      ckAlerta('pele', 'Pele vermelha');
      return k;
    });
    if (!abriu) { console.error('Nenhum FILHOt na turma do dia do retrato — abortando.'); process.exit(1); }
    await page.waitForTimeout(700);
    await limpar(page);
    await page.evaluate(() => { const el = document.getElementById('ckPt-pele'); if (el) el.scrollIntoView({ block: 'center' }); });
    await page.waitForTimeout(400);
    await capturar(page, 'celular-390-1-chips-pele-separados.png', false);

    // 2) o rascunho recuperado: fecha a tela e abre de novo. O banco está VAZIO (foi
    //    barrado, como no caso real da Cookie) e mesmo assim nada se perdeu.
    await page.evaluate((k) => {
      ckVoltar();
      ckDados = {};
      ckAbrir(k);
    }, abriu);
    await page.waitForTimeout(800);
    // o topo da FICHA, nao o topo da pagina: o resumo da turma mora fora do #ckFicha
    await page.evaluate(() => {
      const f = document.getElementById('ckFicha');
      if (f) { f.scrollIntoView({ block: 'start' }); window.scrollBy(0, -190); }   // o cabecalho fixo cobre o topo
    });
    await page.waitForTimeout(400);
    await limpar(page);
    await capturar(page, 'celular-390-2-rascunho-recuperado.png', false);

    // 3) a ficha inteira do check-in
    await capturar(page, 'celular-390-3-ficha-inteira.png');

    todas.push(...await page.evaluate(() => (window.__ESCRITAS__ || []).map((e) => e.metodo + ' ' + e.caminho)));
    await ctx.close();
  }

  // ---------- o computador (1280px): a galeria, que é da chefia ----------
  {
    const ctx = await navegador.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await page.addInitScript(guardaDeEscrita);
    await page.addInitScript((id) => { try { localStorage.setItem('zeluz_device_id', id); } catch (e) { /* sem localStorage a trava barra e o script avisa */ } }, aparelho);
    await entrar(page, base);

    // 4) a galeria na ficha do FILHOt (Cadastro de Peludinhos › Exames do corpo)
    await page.evaluate(() => { if (typeof irParaView === 'function') irParaView('ficha'); });
    await page.waitForTimeout(2500);
    const nome = await page.evaluate(() => {
      if (!Array.isArray(PELUDINHOS) || !PELUDINHOS.length) return null;
      abrirPeludinho(0);
      return pelNome(PELUDINHOS[0]);
    });
    if (!nome) { console.error('Nenhum FILHOt no cadastro do retrato — abortando.'); process.exit(1); }
    await page.waitForTimeout(2000);
    await page.evaluate(() => {
      const bt = Array.prototype.find.call(document.querySelectorAll('.subtab2'),
        (b) => (b.getAttribute('onclick') || '').indexOf("'ps-exames'") >= 0);
      if (bt) pelSubtab(bt, 'ps-exames');
    });
    await page.waitForTimeout(600);
    await desenharGaleria(page, 'pelFotosCorpo', nome);
    await page.waitForTimeout(700);
    await limpar(page);
    await capturar(page, 'desktop-1280-4-galeria-ficha-filhot.png', false);

    // 5) a foto em tamanho grande, com Baixar e Enviar
    await page.evaluate(() => { const bt = document.querySelector('.ckgal-foto'); if (bt) bt.click(); });
    await page.waitForTimeout(700);
    await capturar(page, 'desktop-1280-5-foto-grande-baixar-enviar.png', false);
    await page.evaluate(() => { const el = document.getElementById('ckLbBox'); if (el) el.remove(); });

    // 6) a mesma galeria dentro do Cuidado Vet
    await page.evaluate(() => { if (typeof irParaView === 'function') irParaView('cuidadovet'); });
    await page.waitForTimeout(3000);
    await page.evaluate(() => { if (typeof abrirVetFicha === 'function') abrirVetFicha(0); });
    await page.waitForTimeout(2200);
    await desenharGaleria(page, 'vetFotosCorpo', nome);
    await page.waitForTimeout(700);
    await limpar(page);
    await capturar(page, 'desktop-1280-6-galeria-cuidado-vet.png', false);

    todas.push(...await page.evaluate(() => (window.__ESCRITAS__ || []).map((e) => e.metodo + ' ' + e.caminho)));
    await ctx.close();
  }

  await navegador.close();
  emulador.parar();
  srv.close();
  console.log('\nGravações tentadas (anotadas e NÃO executadas): ' + todas.length);
  todas.slice(0, 10).forEach((t) => console.log('  · ' + t));
})().catch((e) => { console.error('ERRO nas capturas:', e); process.exit(1); });
