'use strict';
/*
 * CAPTURA DA v 2026-09-24-08 — Banhos recorrentes: "isso já vai automaticamente".
 *
 * POR QUE ESTA CAPTURA EXISTE
 * Adriana, 24/set/2026: "Muitos peludos tomam banho já marcado, semanal ou quinzenal, e são
 * do Day Care; o horário é sempre o mesmo. Em vez de lançar no dia, isso já vai
 * automaticamente e a gente só altera se o tutor mudar. Ex.: Lana toma banho de 15 em 15
 * dias, às quintas, a partir de 01/10. Nick da Cláudia toma banho toda quinta. Preciso de
 * uma caixa fácil para marcar 'esse peludo tem banho ou não', sem entrar na ficha e fazer
 * todo um cadastro. A ficha está muito confusa."
 *
 * A tela nova é a "caixa fácil": uma linha por FILHOt, um interruptor e, ao ligar, os botões
 * na PRÓPRIA linha — ritmo, dia, hora, a partir de quando e o shampoo. Nada é gravado antes
 * do Salvar daquela linha. Depois de salvo, o MESMO motor automático das reposições escreve
 * o nome na coluna "Banho" e a hora em "Hora Banho", hoje e nos 14 dias seguintes.
 *
 * O QUE ELA FOTOGRAFA
 *   banhos-recorrentes-1280.png · -500.png ....... a tela inteira, com a busca e o cabeçalho
 *     ("N com banho fixo · M na casa")
 *   banhos-linha-ligada-1280.png · -500.png ...... a LINHA do FILHOt escolhido, com o
 *     interruptor ligado e os botões abertos: Quinzenal · Qui · 10:00 · a partir de 01/10 ·
 *     shampoo — e a frase "Vai para a planilha assim: Nome/Raça (SHAMPOO · NA RECEPÇÃO)"
 *   lancamentos-banho-automatico-1280.png · -500.png ... os Lançamentos do dia de uma QUINTA
 *     futura, com o cartão Banho mostrando a linha do automático e a etiqueta
 *     "automático · banho fixo"
 *   prevencao-tabela-1280.png · -500.png ......... a Prevenção em TABELA, mostrando SÓ o que
 *     está em aberto (vencido ou sem data), com o botão dos 30 dias desligado
 *   prevencao-30dias-1280.png · -500.png ......... a mesma tela com o botão ligado: entra
 *     também o que vence nos próximos 30 dias, com a célula "vence dd/mm"
 *
 * NADA É GRAVADO. A linha é ligada pelo caminho de verdade (banhosLigar/banhosSet), que só
 * mexe no RASCUNHO da tela — o botão Salvar NÃO é tocado. O banho automático do dia futuro é
 * injetado no cache de leitura da página (REP_PLAN_CACHE), onde o app o leria do banco.
 * Além disso, o mesmo guarda de escrita do smoke embrulha set/update/push/remove/transaction
 * antes de o app carregar, e o banco é o EMULADOR local com o retrato do backup. O Firebase
 * de verdade não recebe um byte.
 *
 * E ELA CONFERE, antes de fotografar: a tela existe, abriu e ficou ativa; a busca filtrou; a
 * linha tem o interruptor; ligada, ela mostra ritmo, dia, hora, "a partir de" e o shampoo; a
 * frase do que vai para a planilha está lá; o cartão Banho dos Lançamentos do dia traz a
 * etiqueta do automático; nenhum vocabulário proibido escapou; e NADA foi gravado.
 *
 * Uso:  CAP_PORTA=8832 CAP_EMU_PORTA=9032 node tests/capturar-v36.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');
const retratoLib = require('./lib/retrato');
const emuladorLib = require('./lib/emulador');

const RAIZ = path.join(__dirname, '..');
const APP = 'auaulandia/index.html';
const PORTA = Number(process.env.CAP_PORTA) || 8832;
const EMU_PORTA = Number(process.env.CAP_EMU_PORTA) || 9032;
const SAIDA = path.join(RAIZ, 'docs', 'capturas-v36');
// A senha NÃO fica no repositório (público). Fase 0, 25/set/2026: vem do ambiente.
const SENHA_DIRETORIA = process.env.ZELUZ_SENHA_DIRETORIA || '';
if (!SENHA_DIRETORIA) { console.error('Defina ZELUZ_SENHA_DIRETORIA (a senha da Diretoria) antes de rodar esta captura.'); process.exit(1); }
// O combinado do exemplo dela: quinzenal, às quintas, às 10h, a partir de 01/10.
const COMBINADO = { freq: 'quinzenal', dia: 'qui', hora: '10:00', desde: '2026-10-01',
  sham: 'SHAMPOO', onde: 'NA RECEPÇÃO' };
const PREFERIDOS = ['lana', 'nick'];   // os nomes que ela citou; sem eles, vale quem vem na quinta

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

// ------------------------------------------- o FILHOt do exemplo, escolhido no cadastro real
// Prefere os nomes que ela citou (Lana, Nick). Sem eles, pega o primeiro ativo que vem na
// quinta — porque é de um auluno de quinta que o combinado dela fala.
function escolherFilhot(page, preferidos) {
  return page.evaluate((pref) => {
    const ativos = (PELUDINHOS || []).filter((p) => !pelInativo(p));
    const nomeDe = (p) => (pelNome(p) || p.n || '');
    const acha = (fn) => ativos.filter(fn)[0] || null;
    let p = null;
    for (const alvo of pref) {
      p = acha((x) => jsNorm(nomeDe(x)) === alvo);
      if (p) break;
    }
    if (!p) p = acha((x) => (pelDias(x) || []).indexOf('qui') >= 0);
    if (!p) p = ativos[0];
    if (!p) return null;
    return { nome: nomeDe(p), chave: dcKey(p.n, p.tutor),
      raca: pelGet(p, 'raca') || p.raca || '', naPlanilha: dashNomePlanilha(p) };
  }, preferidos);
}

// ------------------------------- a linha ligada NA TELA, pelo caminho de verdade (sem Salvar)
// banhosLigar/banhosSet são exatamente o que o dedo da Consultora chama. Eles mexem só no
// RASCUNHO: o botão Salvar não é tocado e nada chega ao banco.
function ligarNaTela(page, chave, c) {
  return page.evaluate(([k, comb]) => {
    banhosLigar(k, true);
    banhosSet(k, 'freq', comb.freq);
    banhosSet(k, 'dia', comb.dia);
    banhosSet(k, 'hora', comb.hora);
    banhosSet(k, 'desde', comb.desde);
    banhosSet(k, 'sham', comb.sham);
    banhosSet(k, 'onde', comb.onde);
    const el = document.getElementById('banhoL_' + k);
    return { achou: !!el, texto: el ? (el.innerText || '').replace(/\s+/g, ' ').trim() : '' };
  }, [chave, c]);
}

// ------------------------- o banho automático de uma QUINTA futura, no cache de leitura
// O retrato do backup não tem banho recorrente nenhum: o dia futuro nasceria vazio. Então o
// registro do automático é escrito onde o app o leria do banco (REP_PLAN_CACHE), já com a
// confirmação nome por nome — e a tela desenha a linha com a etiqueta "automático · banho
// fixo". Nenhum byte vai para o banco: o guarda de escrita continua de pé.
function injetarBanhoAutomatico(page, valor) {
  return page.evaluate((v) => {
    // a próxima quinta DEPOIS de hoje, dentro da janela de 14 dias do automático
    let dia = zHojeISO();
    for (let i = 0; i < 14; i++) {
      dia = orcMaisDias(dia, 1);
      if (['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'][new Date(dia + 'T12:00:00').getDay()] === 'qui') break;
    }
    // o app releria o dia e apagaria o que injetamos: aqui a leitura passa a devolver o cache
    vagasCarregarDia = function () { return Promise.resolve(REP_PLAN_CACHE[dia] || null); };
    const estado = { banho: {} };
    estado.banho[vagasNomeChave(v)] = { planilha_ok: true, planilha_msg: '', ts: Date.now() };
    REP_PLAN_CACHE[dia] = { ts: Date.now(), avulso: {}, reposicao: {},
      auto: { banho: [v], _estado: estado, _estado_v: 1, _ts: Date.now() } };
    dashTrocarDia(dia);
    return { dia };
  }, valor);
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

    // ---- 1 · quem vai ser o exemplo -------------------------------------------------
    const alvo = await escolherFilhot(page, PREFERIDOS);
    if (!alvo) { problemas.push('não achei nenhum FILHOt ativo no cadastro (' + larg.rot + ')'); await ctx.close(); continue; }
    if (larg.w === 1280) console.log('FILHOt do exemplo: ' + alvo.nome + ' · na planilha: ' + alvo.naPlanilha);

    // ---- 2 · a tela "Banhos recorrentes", pelo caminho do menu -----------------------
    await page.evaluate(() => { if (typeof abrirItemDoMenu === 'function') abrirItemDoMenu('banhos'); });
    await page.waitForTimeout(1500);
    await estabilizar(page);
    await dispensarCartazes(page, 3);

    const tela = await page.$('#v-banhos');
    if (!tela) { problemas.push('a tela #v-banhos não existe (' + larg.rot + ')'); await ctx.close(); continue; }
    const ativa = await page.evaluate(() => {
      const s = document.getElementById('v-banhos');
      return !!(s && s.classList.contains('active'));
    });
    if (!ativa) problemas.push('a tela "Banhos recorrentes" não ficou ativa (' + larg.rot + ')');

    const cab = await page.$eval('#banhosRoot h2', (n) => (n.textContent || '').trim()).catch(() => '');
    if (!/\d+ com banho fixo · \d+ na casa/.test(cab))
      problemas.push('o cabeçalho não traz os dois números (' + larg.rot + '): "' + cab + '"');
    if (larg.w === 1280) console.log('  cabeçalho: ' + cab);

    const todas = await page.$$eval('#banhosLista .banho-linha', (ns) => ns.length);
    await page.fill('#banhosBusca', alvo.nome);
    await page.waitForTimeout(700);
    const achadas = await page.$$eval('#banhosLista .banho-linha', (ns) => ns.length);
    if (!achadas) problemas.push('a busca por "' + alvo.nome + '" não achou ninguém (' + larg.rot + ')');
    if (achadas >= todas) problemas.push('a busca não filtrou nada (' + larg.rot + '): ' + achadas + ' de ' + todas);

    const temInterruptor = await page.$('#banhoOn_' + alvo.chave);
    if (!temInterruptor) problemas.push('a linha de ' + alvo.nome + ' não tem o interruptor (' + larg.rot + ')');

    // ---- 3 · o interruptor ligado, com o combinado dela (SEM Salvar) -----------------
    const linha = await ligarNaTela(page, alvo.chave, COMBINADO);
    await page.waitForTimeout(500);
    if (!linha.achou) problemas.push('não achei a linha #banhoL_' + alvo.chave + ' depois de ligar (' + larg.rot + ')');
    ['Quinzenal', 'Qui', '10:00', 'A partir de', 'Shampoo', 'Vai para a planilha assim'].forEach((t) => {
      if (linha.texto.indexOf(t) < 0) problemas.push('a linha ligada não mostra "' + t + '" (' + larg.rot + '): ' + linha.texto.slice(0, 200));
    });
    if (linha.texto.indexOf('(SHAMPOO · NA RECEPÇÃO)') < 0)
      problemas.push('a linha não diz o que vai para a planilha, com o detalhe (' + larg.rot + ')');
    if (linha.texto.indexOf('nada foi gravado ainda') < 0 && linha.texto.indexOf('Toque em Salvar') < 0)
      problemas.push('a linha não avisa que nada foi gravado ainda (' + larg.rot + ')');
    if (larg.w === 1280) console.log('  linha ligada: ' + linha.texto.replace(/\s+/g, ' ').slice(0, 220));

    // Nenhum vocabulário proibido pode ter escapado para a tela.
    const t1 = (await tela.innerText()) || '';
    ['cachorro', 'cãozinho', 'dono ', 'funcionário'].forEach((p) => {
      if (t1.toLowerCase().indexOf(p) >= 0) problemas.push('palavra proibida "' + p.trim() + '" na tela de banhos (' + larg.rot + ')');
    });

    // ---- 4 · as fotos da tela de banhos ---------------------------------------------
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    await mascararTelefones(page);
    await page.screenshot({ path: path.join(SAIDA, 'banhos-recorrentes-' + larg.rot + '.png'), fullPage: true });
    console.log('banhos-recorrentes-' + larg.rot + '.png · ' + achadas + ' de ' + todas + ' na busca');

    const elLinha = await page.$('#banhoL_' + alvo.chave);
    if (elLinha) {
      await elLinha.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      await mascararTelefones(page);
      await elLinha.screenshot({ path: path.join(SAIDA, 'banhos-linha-ligada-' + larg.rot + '.png'),
        animations: 'disabled', timeout: 30000 });
      console.log('banhos-linha-ligada-' + larg.rot + '.png');
    }

    // ---- 5 · os Lançamentos do dia de uma QUINTA futura, com o banho automático ------
    await page.evaluate(() => { if (typeof abrirItemDoMenu === 'function') abrirItemDoMenu('dashdc'); });
    await page.waitForTimeout(1500);
    await estabilizar(page);
    await dispensarCartazes(page, 3);

    const valorNaPlanilha = alvo.naPlanilha + ' (SHAMPOO · NA RECEPÇÃO)';
    const inj = await injetarBanhoAutomatico(page, valorNaPlanilha);
    await page.waitForTimeout(1200);
    await estabilizar(page);
    if (larg.w === 1280) console.log('  quinta futura escolhida: ' + inj.dia);

    const cartao = await page.evaluate(() => {
      const cards = Array.prototype.slice.call(document.querySelectorAll('#dashBlocos .card'));
      const c = cards.filter((x) => /Banho/.test(((x.querySelector('h2') || {}).textContent) || ''))[0];
      return c ? { texto: (c.innerText || '').replace(/\s+/g, ' ').trim(), i: cards.indexOf(c) } : null;
    });
    if (!cartao) problemas.push('não achei o cartão "Banho" nos Lançamentos do dia (' + larg.rot + ')');
    else {
      if (cartao.texto.indexOf('automático · banho fixo') < 0)
        problemas.push('o cartão Banho não traz a etiqueta "automático · banho fixo" (' + larg.rot + '): ' + cartao.texto.slice(0, 220));
      if (cartao.texto.indexOf(alvo.naPlanilha) < 0)
        problemas.push('o cartão Banho não traz o nome do FILHOt como vai para a planilha (' + larg.rot + ')');
      if (larg.w === 1280) console.log('  cartão Banho: ' + cartao.texto.slice(0, 220));
    }

    const elCartao = cartao ? await page.$('#dashBlocos .card:nth-child(' + (cartao.i + 1) + ')') : null;
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    await mascararTelefones(page);
    if (elCartao) {
      await elCartao.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      await mascararTelefones(page);
      await elCartao.screenshot({ path: path.join(SAIDA, 'lancamentos-banho-automatico-' + larg.rot + '.png'),
        animations: 'disabled', timeout: 30000 });
    } else {
      await page.screenshot({ path: path.join(SAIDA, 'lancamentos-banho-automatico-' + larg.rot + '.png'), fullPage: true });
    }
    console.log('lancamentos-banho-automatico-' + larg.rot + '.png');

    // ---- 6 · a Prevenção em tabela: só o que está em aberto --------------------------
    // (Adriana, 24/set/2026: "Só tem que aparecer o que está vencido ou que não tem data.
    //  Não dá para ficar aparecendo tudo; se aparece tudo, a gente não consegue ver.")
    await page.evaluate(() => {
      // a escolha do botão mora no aparelho: a foto começa sempre do padrão, que é o dela
      try { localStorage.removeItem('zeluz_prev_janela'); } catch (e) { /* sem localStorage vale o padrão */ }
      PREV_JANELA = null;
      if (typeof abrirItemDoMenu === 'function') abrirItemDoMenu('vacinas');
    });
    await page.waitForTimeout(1800);
    await estabilizar(page);
    await dispensarCartazes(page, 3);

    const prev = await page.evaluate(() => {
      const raiz = document.getElementById('prevLista');
      const t = raiz ? raiz.querySelector('table') : null;
      const cols = t ? Array.prototype.map.call(t.querySelectorAll('thead th'), (x) => (x.textContent || '').trim()) : [];
      const linhas = t ? t.querySelectorAll('tbody tr').length : 0;
      const txt = raiz ? (raiz.innerText || '').replace(/\s+/g, ' ') : '';
      const bt = document.getElementById('prevJanelaBt');
      return { temTabela: !!t, cols, linhas, txt: txt.slice(0, 400),
        botao: bt ? (bt.textContent || '').trim() : '' };
    });
    if (!prev.temTabela) problemas.push('a Prevenção não desenhou a tabela (' + larg.rot + '): ' + prev.txt.slice(0, 160));
    if (prev.cols.length < 2) problemas.push('a tabela da Prevenção não tem colunas de item (' + larg.rot + '): ' + JSON.stringify(prev.cols));
    if (prev.cols[0] !== 'Peludinho') problemas.push('a primeira coluna deveria ser Peludinho (' + larg.rot + '): ' + JSON.stringify(prev.cols[0]));
    if (prev.botao.indexOf('Mostrar também o que vence nos próximos 30 dias') < 0)
      problemas.push('o botão dos 30 dias não está desligado por padrão (' + larg.rot + '): "' + prev.botao + '"');
    if (/vence \d\d\/\d\d/.test(prev.txt))
      problemas.push('com o botão desligado NÃO pode aparecer "vence dd/mm" (' + larg.rot + '): ' + prev.txt.slice(0, 200));
    if (larg.w === 1280) console.log('  Prevenção: ' + prev.linhas + ' linha(s) · colunas: ' + JSON.stringify(prev.cols));

    // Rola até a TABELA: é ela que se confere aqui. Com 99 linhas, a foto da página inteira
    // viraria um arquivo de 5 MB no repositório — e o que importa é o FORMATO.
    await page.evaluate(() => {
      const t = document.querySelector('#prevLista table');
      if (t && t.scrollIntoView) t.scrollIntoView({ block: 'start' });
      else window.scrollTo(0, 0);
      window.scrollBy(0, -140);
    });
    await page.waitForTimeout(500);
    await mascararTelefones(page);
    await page.screenshot({ path: path.join(SAIDA, 'prevencao-tabela-' + larg.rot + '.png') });
    console.log('prevencao-tabela-' + larg.rot + '.png');

    // o botão dos 30 dias, ligado
    await page.evaluate(() => { if (typeof prevJanelaVirar === 'function') prevJanelaVirar(); });
    await page.waitForTimeout(900);
    const prev30 = await page.evaluate(() => {
      const raiz = document.getElementById('prevLista');
      const bt = document.getElementById('prevJanelaBt');
      return { txt: ((raiz && raiz.innerText) || '').replace(/\s+/g, ' ').slice(0, 400),
        botao: bt ? (bt.textContent || '').trim() : '',
        linhas: raiz && raiz.querySelector('table') ? raiz.querySelectorAll('tbody tr').length : 0 };
    });
    if (prev30.botao.indexOf('Mostrando também') < 0)
      problemas.push('o botão dos 30 dias não ficou ligado (' + larg.rot + '): "' + prev30.botao + '"');
    if (prev30.linhas < prev.linhas)
      problemas.push('ligar os 30 dias não pode ESCONDER quem já estava (' + larg.rot + '): ' + prev30.linhas + ' < ' + prev.linhas);
    if (larg.w === 1280) console.log('  Prevenção com 30 dias: ' + prev30.linhas + ' linha(s)');
    await page.evaluate(() => {
      const t = document.querySelector('#prevLista table');
      if (t && t.scrollIntoView) t.scrollIntoView({ block: 'start' });
      else window.scrollTo(0, 0);
      window.scrollBy(0, -140);
    });
    await page.waitForTimeout(500);
    await mascararTelefones(page);
    await page.screenshot({ path: path.join(SAIDA, 'prevencao-30dias-' + larg.rot + '.png') });
    console.log('prevencao-30dias-' + larg.rot + '.png');

    // ---- 7 · a prova de que nada foi gravado ----------------------------------------
    const escritas = await page.evaluate(() => (window.__ESCRITAS__ || []).slice());
    const naFicha = escritas.filter((e) => /daycare\/cadastro/.test(e.caminho || ''));
    if (naFicha.length) problemas.push('alguém tentou gravar na ficha (' + larg.rot + '): ' + JSON.stringify(naFicha.slice(0, 3)));
    console.log('Tentativas de gravação barradas pelo guarda (' + larg.rot + '): ' + escritas.length
      + ' (nenhuma foi ao banco; na ficha: ' + naFicha.length + ')');
    await ctx.close();
  }

  await navegador.close();
  pararTudo();
  if (problemas.length) { console.error('\nPROBLEMAS:\n- ' + problemas.join('\n- ')); process.exit(1); }
  console.log('\nCaptura v-36 pronta em docs/capturas-v36/');
})().catch((e) => { console.error(e); process.exit(1); });
