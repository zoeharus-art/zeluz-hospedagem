'use strict';
/*
 * Capturas do v-10 (Lançar pagamento) — desktop e 500px, Gestão e Consultora.
 * SÓ NAVEGA E ESCOLHE FICHA. Nenhum botão de gravação é tocado; por segurança,
 * um guarda embrulha as escritas do Firebase e as anota SEM executar.
 * Uso: NODE_PATH=C:/Users/zeluz/projetos-aios/code/node_modules node docs/capturas-v10/capturar.js
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');

const RAIZ = path.join(__dirname, '..', '..');
const APP = 'auaulandia/index.html';
const SAIDA = __dirname;
const PORTA = 8793;

function servidor() {
  const tipos = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg' };
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

// O MESMO espírito do guarda do smoke: escrita anotada, nunca executada.
const GUARDA = `(function(){
  window.__ESCRITAS__=[];
  function anota(o){ window.__ESCRITAS__.push(o); return Promise.resolve(); }
  var tenta=setInterval(function(){
    if(typeof firebase==='undefined'||!firebase.database) return;
    try{
      var db=firebase.database();
      var refOrig=db.ref.bind(db);
      db.ref=function(p){
        var r=refOrig(p);
        ['set','update','push','remove','transaction'].forEach(function(m){
          var orig=r[m]&&r[m].bind(r);
          r[m]=function(){ anota({op:m,caminho:String(p)}); return {then:function(f){ f&&f(); return this; },catch:function(){ return this; }}; };
        });
        return r;
      };
      clearInterval(tenta);
    }catch(e){}
  },50);
})();`;

async function entrar(page, base, senha, nome) {
  await page.goto(base + '/' + APP, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof DB !== 'undefined' && !!DB, null, { timeout: 45000 });
  await page.waitForTimeout(1500);
  await page.fill('#loginPwd', senha);
  await page.click('.login-btn');
  await page.waitForTimeout(1500);
  const pedeNome = await page.$('#loginPessoa');
  if (pedeNome) { await page.fill('#loginPessoa', nome); await page.click('#zCampoOk'); await page.waitForTimeout(1200); }
  await page.waitForTimeout(2500);
  await page.evaluate(() => { ['zAlertaoBox', 'zEscolhaBox'].forEach((id) => { const el = document.getElementById(id); if (el) el.remove(); }); });
}

async function abrirTela(page) {
  await page.evaluate(() => {
    const a = document.querySelector('#nav a[data-v="lancar-pagamento"]');
    if (a) a.click();
  });
  // A tela lê irmãos e pagamentos e espera a carteira — dá tempo de verdade.
  await page.waitForTimeout(4000);
  await page.evaluate(() => { ['zAlertaoBox', 'zEscolhaBox'].forEach((id) => { const el = document.getElementById(id); if (el) el.remove(); }); });
}

async function capturar(page, arq) {
  await page.screenshot({ path: path.join(SAIDA, arq), fullPage: true });
  console.log('captura:', arq);
}

async function papel(navegador, base, rotulo, senha, nome, largura, aparelho) {
  const ctx = await navegador.newContext({ viewport: { width: largura, height: 900 } });
  const page = await ctx.newPage();
  await page.addInitScript(GUARDA);
  // A trava por aparelho é real: sem um id JÁ autorizado, ninguém entra. Reaproveitar um
  // id existente é leitura pura — não cria, não altera e não apaga nada (molde do smoke).
  await page.addInitScript((id) => { try { localStorage.setItem('zeluz_device_id', id); } catch (e) {} }, aparelho);
  await entrar(page, base, senha, nome);
  const st = await page.evaluate(() => ({
    role: document.body.dataset.role || '',
    login: getComputedStyle(document.getElementById('loginScreen')).display,
    quem: ((document.getElementById('whoName') || {}).textContent || '').trim()
  }));
  console.log(rotulo, largura + 'px — papel no app:', st.role, '· entrou:', st.login === 'none', '· como:', st.quem);
  if (st.login !== 'none') { console.log(rotulo, largura + 'px NAO ENTROU — captura abortada'); await ctx.close(); return; }
  await abrirTela(page);
  const sufixo = largura <= 500 ? '500' : 'desktop';
  await capturar(page, rotulo + '-' + sufixo + '-1-tela.png');

  // Escolhe uma ficha com cobrança em aberto (só leitura e desenho — nada grava).
  const escolhido = await page.evaluate(() => {
    if (typeof lpCobrancaDe !== 'function') return null;
    const dados = lpDados();
    for (let i = 0; i < (PELUDINHOS || []).length; i++) {
      const p = PELUDINHOS[i]; if (!p) continue;
      if (typeof pelInativo === 'function' && pelInativo(p)) continue;
      const cb = lpCobrancaDe(pelKey(p), dados, hojeISO());
      if (cb.linha && cb.linha.falta > 0) { lpEscolher(i); return { nome: pelNome(p), i }; }
    }
    return null;
  });
  if (escolhido) {
    await page.waitForTimeout(800);
    await capturar(page, rotulo + '-' + sufixo + '-2-cobranca.png');
  }
  // E uma FAMÍLIA (irmãos com vínculo), se houver alguma com cobrança calculável.
  const familia = await page.evaluate(() => {
    if (typeof lpCobrancasFamilia !== 'function') return null;
    const dados = lpDados();
    for (let i = 0; i < (PELUDINHOS || []).length; i++) {
      const p = PELUDINHOS[i]; if (!p) continue;
      if (typeof pelInativo === 'function' && pelInativo(p)) continue;
      const fam = lpCobrancasFamilia(pelKey(p), dados, hojeISO());
      if (fam.membros.length > 1 && fam.membros.every((m) => m.linha)) { lpEscolher(i); return fam.membros.map((m) => m.nome); }
    }
    return null;
  });
  if (familia) {
    await page.waitForTimeout(800);
    await capturar(page, rotulo + '-' + sufixo + '-3-familia.png');
    console.log('familia capturada:', familia.join(' e '));
  }
  const escritas = await page.evaluate(() => window.__ESCRITAS__ || []);
  console.log(rotulo, sufixo, '— escritas tentadas (todas bloqueadas pelo guarda):', JSON.stringify(escritas));
  await ctx.close();
}

async function main() {
  // Senha da consultora vem do retrato local (nunca escrita em arquivo de saída).
  const d = JSON.parse(fs.readFileSync(path.join(RAIZ, 'tests', '.retrato', 'daycare-2026-09-07.json'), 'utf8'));
  const cons = ((d.config && d.config.monitores) || []).find((m) => m && m.role === 'consultora' && m.senha);
  const a = JSON.parse(fs.readFileSync(path.join(RAIZ, 'tests', '.retrato', 'auaulandia-2026-09-07.json'), 'utf8'));
  const aparelho = Object.keys(a.aparelhos || {}).sort()[0];
  if (!aparelho) { console.error('nenhum aparelho autorizado no retrato'); process.exit(1); }
  const srv = await servidor();
  const base = 'http://127.0.0.1:' + PORTA;
  const navegador = await chromium.launch();
  try {
    await papel(navegador, base, 'gestao', '0902', 'Teste do Sistema', 1366, aparelho);
    await papel(navegador, base, 'gestao', '0902', 'Teste do Sistema', 500, aparelho);
    if (cons) {
      await papel(navegador, base, 'consultora', String(cons.senha), cons.nome, 1366, aparelho);
      await papel(navegador, base, 'consultora', String(cons.senha), cons.nome, 500, aparelho);
    } else {
      console.log('sem consultora com senha no retrato — capturas de consultora puladas');
    }
  } finally {
    await navegador.close();
    srv.close();
  }
  console.log('pronto');
}
main().catch((e) => { console.error('ERRO:', e); process.exit(1); });
