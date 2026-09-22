'use strict';
/*
 * CAPTURA DA v 2026-09-21-06 — a reposição que vai sozinha para a tabela, as vagas do dia
 * e o avulso com preço.
 *
 * POR QUE ESTA CAPTURA EXISTE
 * Adriana, 21/set/2026: "Reposições. Lançar falta... preciso que automaticamente vá para a
 * tabela. Tablito e Biscoito não virão amanhã (precisa ir para falta avisada) e ter
 * confirmação que foi lançado; se o tutor já avisou o dia, precisa ir para avulso (também
 * na tabela, de lançamentos do dia); precisa ser automático."
 * E: "são 5 por dia de reposição+avulso — se não tiver vaga, primeiro precisa de
 * autorização da Márcia."
 *
 * O QUE ELA FOTOGRAFA (como Diretoria, 1101)
 *   reposicoes-{larg}.png ...... a tela Reposições inteira, com um crédito mostrando o
 *                                estado na planilha: a falta "lançada na planilha ✓" e o
 *                                dia de repor ainda "a caminho", com o botão Mandar agora
 *   credito-{larg}.png ......... a linha daquele FILHOt de perto, para conferir as frases
 *   vagas-{larg}.png ........... o modal da falta avisada com o dia de repor escolhido e o
 *                                aviso "n de 5 vagas em 25/09/2026"
 *   valores-{larg}.png ......... Configurações › Valores do Day Care, com os dois preços da
 *                                diária avulsa e as vagas por dia
 *
 * E ELA CONFERE, antes de fotografar: a confirmação diz o que tem de dizer (✓ e "em até 5
 * min"), o aviso de vagas traz o "de 5", os três campos novos estão em Configurações e
 * nenhum vocabulário proibido escapou.
 *
 * NADA É GRAVADO. O mesmo guarda de escrita do smoke embrulha set/update/push/remove/
 * transaction antes de o app carregar, e o banco é o EMULADOR local com o retrato do
 * backup. O Firebase de verdade não recebe um byte. O crédito que aparece na foto é posto
 * NA MEMÓRIA do app (REPO_CACHE / REP_PLAN_CACHE) — o app desenha sozinho, pelo mesmo
 * caminho da vida real, como já fazia a captura da v-28.
 *
 * Uso:  NODE_PATH=C:/Users/zeluz/projetos-aios/code/node_modules node tests/capturar-v31.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');
const retratoLib = require('./lib/retrato');
const emuladorLib = require('./lib/emulador');

const RAIZ = path.join(__dirname, '..');
const APP = 'auaulandia/index.html';
const PORTA = Number(process.env.CAP_PORTA) || 8823;
const EMU_PORTA = Number(process.env.CAP_EMU_PORTA) || 9023;
const SAIDA = path.join(RAIZ, 'docs', 'capturas-v31');
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

    // ---- 1 · a tela de Reposições, pelo caminho do menu ----------------------------
    await page.evaluate(() => { if (typeof abrirItemDoMenu === 'function') abrirItemDoMenu('reposicao'); });
    await page.waitForTimeout(2000);
    await estabilizar(page);
    await dispensarCartazes(page, 3);
    const tela = await page.$('#v-reposicao');
    if (!tela) { problemas.push('a tela #v-reposicao não existe (' + larg.rot + ')'); await ctx.close(); continue; }

    // ---- 2 · um crédito com a confirmação da planilha ------------------------------
    // O retrato do backup não tem crédito com dia de repor marcado — e sem ele não dá para
    // fotografar o que ela pediu. O crédito é posto NA MEMÓRIA do app, com o guarda de
    // escrita ligado: o app desenha sozinho, pelo mesmo caminho da vida real.
    const posto = await page.evaluate(() => {
      const hoje = zHojeISO();
      const mais = (n) => orcMaisDias(hoje, n);
      const falta = mais(1), volta = mais(3);
      // O primeiro da lista da tela (ela ordena por saldo), para a foto de perto pegar
      // justamente o crédito que acabou de entrar.
      const p = (PELUDINHOS || []).filter((x) => !pelInativo(x))
        .sort((a, b) => repSaldo(b) - repSaldo(a))[0];
      if (!p) return null;
      const k = pelKey(p);
      REPO_CACHE[k] = REPO_CACHE[k] || {};
      REPO_CACHE[k].lancamentos = Object.assign({}, REPO_CACHE[k].lancamentos || {}, {
        capV31: { tipo: 'credito', data: falta, motivo: 'viagem', obs: 'tutora avisou pelo telefone',
          volta: volta, quem: 'Leticya', ts: Date.now() }
      });
      const chave = (typeof dashAutoNomeChave === 'function') ? dashAutoNomeChave(dashNomeRaca(p)) : '';
      // O dia da falta: a ponte JÁ aceitou. O dia de repor: ainda a caminho.
      REP_PLAN_CACHE[falta] = { ts: Date.now(), avulso: {}, auto: { _ts: Date.now(),
        _estado: { faltas: {} } } };
      REP_PLAN_CACHE[falta].auto._estado.faltas[chave] = { planilha_ok: true, planilha_msg: '', ts: Date.now() - 3600000 };
      REP_PLAN_CACHE[volta] = { ts: Date.now(), avulso: { a1: { valor: 'Bidu/SRD' }, a2: { valor: 'Nina/Poodle' } },
        auto: { _ts: Date.now(), _estado: { reposicao: {} } } };
      renderReposicao();
      return { nome: pelNome(p), falta: falta, volta: volta, saldo: repSaldo(p) };
    });
    if (!posto) { problemas.push('não achei um peludinho ativo para a foto (' + larg.rot + ')'); }
    await page.waitForTimeout(1200);

    if (posto) {
      const txt = (await tela.innerText()) || '';
      const brDe = (iso) => iso.slice(8, 10) + '/' + iso.slice(5, 7) + '/' + iso.slice(0, 4);
      const exig = [
        'Falta avisada de ' + brDe(posto.falta) + ' — lançada na planilha ✓',
        'Reposição em ' + brDe(posto.volta) + ' — vai para a planilha em até 5 min',
        'Mandar agora',
      ];
      exig.forEach((x) => { if (txt.indexOf(x) < 0) problemas.push('a confirmação (' + larg.rot + ') não mostra "' + x + '"'); });
      if (larg.w === 1280) console.log('  crédito de ' + posto.nome + ': falta ' + brDe(posto.falta) + ' · repõe ' + brDe(posto.volta));
    }

    // Nenhum vocabulário proibido pode ter escapado para a tela.
    {
      const t = ((await tela.innerText()) || '').toLowerCase();
      ['cachorro', 'cãozinho', 'dono ', 'funcionário'].forEach((p2) => {
        if (t.indexOf(p2) >= 0) problemas.push('palavra proibida "' + p2.trim() + '" na tela (' + larg.rot + ')');
      });
    }

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    await mascararTelefones(page);
    await page.screenshot({ path: path.join(SAIDA, 'reposicoes-' + larg.rot + '.png') });
    console.log('reposicoes-' + larg.rot + '.png');

    // a linha DAQUELE FILHOt — não a primeira que aparecer
    const linha = posto
      ? await page.$('#repLista .rep-row:has(.rp-nome:text-is("' + posto.nome.replace(/"/g, '') + '"))')
      : await page.$('#repLista .rep-row');
    if (linha) {
      await linha.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      await mascararTelefones(page);
      await linha.screenshot({ path: path.join(SAIDA, 'credito-' + larg.rot + '.png'),
        animations: 'disabled', timeout: 30000 });
      console.log('credito-' + larg.rot + '.png');
    } else { problemas.push('nenhuma linha de peludinho na lista (' + larg.rot + ')'); }

    // ---- 3 · o aviso de vagas ao escolher o dia de repor ---------------------------
    const aviso = await page.evaluate(() => {
      const p = (PELUDINHOS || []).filter((x) => !pelInativo(x))
        .sort((a, b) => repSaldo(b) - repSaldo(a))[0];
      if (!p || typeof repAbrirLancar !== 'function') return '';
      repAbrirLancar(p);
      const volta = orcMaisDias(zHojeISO(), 3);
      const el = document.getElementById('repVolta');
      if (!el) return '';
      el.value = volta;
      repVoltaMudou();
      const box = document.getElementById('repVagasBox');
      return box ? (box.textContent || '') : '';
    });
    await page.waitForTimeout(900);
    if (!/de 5 vagas em \d\d\/\d\d\/\d{4}/.test(aviso)) {
      problemas.push('o aviso de vagas (' + larg.rot + ') não veio no formato "n de 5 vagas em dd/mm/aaaa": "' + aviso.slice(0, 120) + '"');
    } else if (larg.w === 1280) console.log('  aviso de vagas: ' + aviso.replace(/\s+/g, ' ').trim());
    const modal = await page.$('#repModal .rep-card');
    if (modal) {
      await page.waitForTimeout(400);
      await mascararTelefones(page);
      await modal.screenshot({ path: path.join(SAIDA, 'vagas-' + larg.rot + '.png'),
        animations: 'disabled', timeout: 30000 });
      console.log('vagas-' + larg.rot + '.png');
    } else { problemas.push('o modal da falta avisada não abriu (' + larg.rot + ')'); }
    await page.evaluate(() => { if (typeof repFechar === 'function') repFechar(); });
    await page.waitForTimeout(400);

    // ---- 4 · Configurações › Valores do Day Care -----------------------------------
    await page.evaluate(() => { if (typeof abrirItemDoMenu === 'function') abrirItemDoMenu('config'); });
    await page.waitForTimeout(2600);
    await estabilizar(page);
    await dispensarCartazes(page, 3);
    const cartao = await page.$('#cardValoresDaycare');
    if (!cartao) { problemas.push('não achei o cartão "Valores do Day Care" em Configurações (' + larg.rot + ')'); }
    else {
      const tc = (await cartao.innerText()) || '';
      ['Valores do Day Care', 'Diária avulsa — não matriculado', 'Diária avulsa — matriculado',
        'Vagas por dia para reposição + avulso', 'Salvar valores']
        .forEach((x) => { if (tc.indexOf(x) < 0) problemas.push('Valores do Day Care (' + larg.rot + '): faltou "' + x + '"'); });
      const campos = await page.evaluate(() => {
        const g = (id) => { const el = document.getElementById(id); return el ? String(el.value || '') : null; };
        return { avulsa: g('cfgDiariaAvulsa'), matric: g('cfgDiariaAvulsaMatric'), vagas: g('cfgVagasDia') };
      });
      if (campos.avulsa !== '170,00') problemas.push('a diária de não matriculado (' + larg.rot + ') não veio 170,00: ' + JSON.stringify(campos.avulsa));
      if (campos.matric !== '97,00') problemas.push('a diária de matriculado (' + larg.rot + ') não veio 97,00: ' + JSON.stringify(campos.matric));
      if (campos.vagas !== '5') problemas.push('as vagas por dia (' + larg.rot + ') não vieram 5: ' + JSON.stringify(campos.vagas));
      await cartao.scrollIntoViewIfNeeded();
      // Configurações tem vários cartões que se preenchem sozinhos e empurram a página
      // enquanto chegam. Sem esta folga a foto sai tremida.
      await page.waitForTimeout(2000);
      await cartao.screenshot({ path: path.join(SAIDA, 'valores-' + larg.rot + '.png'),
        animations: 'disabled', timeout: 30000 });
      console.log('valores-' + larg.rot + '.png');
    }

    // ---- 5 · nada foi gravado ------------------------------------------------------
    const escritas = await page.evaluate(() => (window.__ESCRITAS__ || []));
    const naNossaArea = escritas.filter((x) => /reposicao|vagas-pedidos|dashboard/.test(x.caminho || ''));
    if (naNossaArea.length) {
      problemas.push('a captura tentou gravar em ' + naNossaArea.length + ' nó(s) de reposição/vagas/lançamento ('
        + larg.rot + '): ' + JSON.stringify(naNossaArea.slice(0, 3)));
    }
    console.log('Tentativas de gravação barradas pelo guarda (' + larg.rot + '): ' + escritas.length + ' (nenhuma foi ao banco)');
    await ctx.close();
  }

  await navegador.close();
  pararTudo();
  if (problemas.length) { console.error('\nPROBLEMAS:\n- ' + problemas.join('\n- ')); process.exit(1); }
  console.log('\nCaptura da v ' + versao + ' pronta em docs/capturas-v31/');
})().catch((e) => { console.error(e); process.exit(1); });
