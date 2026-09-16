'use strict';
/*
 * CAPTURA DA v 2026-09-16-01 — o aparelho que não se perde no iPhone e o orçamento que
 * sobe quando fecha.
 *
 * Abre o app de verdade (servidor local + EMULADOR carregado com o retrato do backup,
 * nunca o Firebase real) e fotografa o que a Adriana pediu para ver:
 *
 *   1. orcamento-grupos-e-checkin.png — 1280px, a lista de orçamentos com os cabeçalhos de
 *      grupo ("Fechados — próximas hospedagens", "Aguardando resposta", "Não fechou /
 *      cancelado", "Hospedagens passadas"), o botão Check-in nos fechados por vir, o
 *      "Já fez check-in" desabilitado e a faixa vermelha do duplicado.
 *   2. entrada-sem-memoria.png — 390px (o celular do time), a tela de entrada com o aviso
 *      de celular que não guarda a autorização. O aviso é SIMULADO (o Chrome do teste
 *      guarda tudo): a página chama devChecarMemoria com os três armazenamentos mudos.
 *
 * NADA É GRAVADO: o mesmo guarda de escrita do smoke embrulha set/update/push/remove antes
 * de o app carregar. Os orçamentos das fotos vivem só na memória da página (ORC_LISTA_CACHE).
 *
 * Uso:  NODE_PATH=C:/Users/zeluz/projetos-aios/code/node_modules node tests/capturar-v19.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');
const retratoLib = require('./lib/retrato');
const emuladorLib = require('./lib/emulador');

const RAIZ = path.join(__dirname, '..');
const APP = 'auaulandia/index.html';
const EMU_PORTA = Number(process.env.CAP_EMU_PORTA) || 9005;
const SAIDA = path.join(RAIZ, 'docs', 'capturas-v19');
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
  window.__GUARDA_OK__ = false;
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
    R.__guardado = true; window.__GUARDA_OK__ = true; return true;
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

(async () => {
  fs.mkdirSync(SAIDA, { recursive: true });
  const servidor = await subirServidor(Number(process.env.CAP_PORTA) || 8795);
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

  const novaPagina = async (largura, altura) => {
    const ctx = await navegador.newContext({ viewport: { width: largura, height: altura }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.addInitScript(guardaDeEscrita);
    await page.addInitScript((id) => { try { localStorage.setItem('zeluz_device_id', id); } catch (e) { /* sem localStorage o app barra e o erro aparece na tela */ } }, aparelhos[0]);
    return page;
  };
  const entrarComo = async (page, senha) => {
    await page.goto(URL, { waitUntil: 'load' });
    await estabilizar(page);
    await page.fill('#loginPwd', senha);
    await page.click('.login-btn');
    await page.waitForTimeout(1800);
    await estabilizar(page);
    for (let i = 0; i < 4; i++) {
      const b = await page.$('#zAlertaoOk'); if (!b) break;
      await b.click(); await page.waitForTimeout(400);
    }
    return page.evaluate(() => document.body.dataset.role || '');
  };

  // ======================================= 1. Orçamento: grupos, Check-in e duplicado
  const page = await novaPagina(1280, 1500);
  const entrou = await entrarComo(page, SENHA_DIRETORIA);
  if (!entrou) { console.error('Não entrou no app.'); await navegador.close(); pararTudo(); process.exit(1); }
  console.log('Entrou como: ' + entrou);

  await page.evaluate(() => abrirItemDoMenu('orcamento'));
  await page.waitForTimeout(1200);

  // Os quatro estados, montados só na MEMÓRIA da página. O banco não é tocado: a foto
  // precisa mostrar os quatro grupos de uma vez, e o retrato não tem garantia de ter todos.
  const medida = await page.evaluate(() => {
    const hoje = zHojeISO();
    const mais = (n) => { const d = new Date(hoje + 'T12:00:00'); d.setDate(d.getDate() + n);
      const p = (x) => String(x).padStart(2, '0');
      return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); };
    const pet = (nome, tutor) => ({ key: nome.toLowerCase() + '__' + tutor.toLowerCase(), nome, raca: 'SRD', tutor });
    ORC_LISTA_CACHE = {
      f1: { status: 'fechado', entrada: mais(3), saida: mais(8), noites: 5, tutor: 'Adriana',
        criado_por: 'Adriana', criado_em: Date.now() - 86400000, total_cent: 62000, planilha_ok: true,
        pets: [pet('Tônico', 'Adriana')] },
      f2: { status: 'fechado', entrada: mais(3), saida: mais(8), noites: 5, tutor: 'Adriana',
        criado_por: 'Adriana', criado_em: Date.now() - 3600000, total_cent: 62000, planilha_ok: true,
        pets: [pet('Tônico', 'Adriana')] },
      f3: { status: 'fechado', entrada: mais(10), saida: mais(14), noites: 4, tutor: 'Renata',
        criado_por: 'Wandela', criado_em: Date.now() - 172800000, total_cent: 48000, planilha_ok: true,
        pets: [pet('Thor', 'Renata'), pet('Nala', 'Renata')] },
      a1: { status: 'aguardando', entrada: mais(6), saida: mais(9), noites: 3, tutor: 'Juliana',
        criado_por: 'Wandela', criado_em: Date.now() - 7200000, total_cent: 36000,
        pets: [pet('Pufe', 'Juliana')] },
      n1: { status: 'nao_fechou', entrada: mais(2), saida: mais(4), noites: 2, tutor: 'Carla',
        criado_por: 'Wandela', criado_em: Date.now() - 259200000, total_cent: 24000,
        pets: [pet('Chico', 'Carla')] },
      p1: { status: 'fechado', entrada: mais(-20), saida: mais(-15), noites: 5, tutor: 'Yara',
        criado_por: 'Adriana', criado_em: Date.now() - 2592000000, total_cent: 60000, planilha_ok: true,
        pets: [pet('Cookie', 'Yara')] },
    };
    // Um check-in já feito para a entrada do Thor e da Nala: o botão vira "Já fez check-in".
    ORC_ESTADIAS_CACHE = { e1: { refKey: 'thor__renata', nome: 'Thor', tutor: 'Renata',
      entrada: ORC_LISTA_CACHE.f3.entrada, status: 'ativa' } };
    orcRenderLista();
    const el = document.getElementById('orcLista');
    const txt = el.innerText;
    const bt = [].map.call(el.querySelectorAll('button'), (b) => b.textContent.trim());
    return {
      grupos: ['Fechados — próximas hospedagens', 'Aguardando resposta',
        'Não fechou / cancelado', 'Hospedagens passadas'].filter((g) => txt.indexOf(g) >= 0),
      // A ordem em que os cabeçalhos aparecem no texto é a ordem da tela.
      ordemOk: txt.indexOf('Fechados — próximas hospedagens') < txt.indexOf('Aguardando resposta')
        && txt.indexOf('Aguardando resposta') < txt.indexOf('Não fechou / cancelado')
        && txt.indexOf('Não fechou / cancelado') < txt.indexOf('Hospedagens passadas'),
      temCheckin: bt.some((t) => t === 'Check-in' || t.indexOf('Check-in de ') === 0),
      temJaFez: bt.some((t) => t.indexOf('Já fez check-in') === 0),
      temDuplicado: txt.indexOf('Duplicado com ') >= 0,
      escritas: (window.__ESCRITAS__ || []).length,
    };
  });
  await page.waitForTimeout(500);
  // Foto do CARD da lista, não da página: o topo do app é fixo e cobriria o primeiro
  // cabeçalho de grupo justamente na foto que existe para mostrar os cabeçalhos.
  const cardLista = (await page.evaluateHandle(() => {
    const w = document.getElementById('orcLista');
    return w ? w.closest('.card') : null;
  })).asElement();
  if (!cardLista) { problemas.push('não achei o card da lista de orçamentos'); }
  else {
    await cardLista.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await cardLista.screenshot({ path: path.join(SAIDA, 'orcamento-grupos-e-checkin.png') });
  }
  console.log('orcamento-grupos-e-checkin.png — ' + JSON.stringify(medida, null, 1));
  if (medida.grupos.length !== 4) problemas.push('faltou cabeçalho de grupo: ' + JSON.stringify(medida.grupos));
  if (!medida.ordemOk) problemas.push('os grupos não saíram na ordem da tela');
  if (!medida.temCheckin) problemas.push('nenhum botão Check-in apareceu');
  if (!medida.temJaFez) problemas.push('o "Já fez check-in" não apareceu');
  if (!medida.temDuplicado) problemas.push('a faixa de duplicado não apareceu');

  // ======================================= 2. Entrada: o celular que não guarda nada
  // O Chrome do teste guarda tudo, então o estado é SIMULADO: os três armazenamentos são
  // emudecidos e o próprio devChecarMemoria do app decide mostrar o aviso.
  const cel = await novaPagina(390, 900);
  await cel.goto(URL, { waitUntil: 'load' });
  await estabilizar(cel);
  const aviso = await cel.evaluate(async () => {
    devTesteArmazenamento = function () { return Promise.resolve({ ls: false, cookie: false, idb: false, guarda: false }); };
    await devChecarMemoria();
    const el = document.getElementById('deviceSemMemoria');
    const r = el.getBoundingClientRect();
    const pwd = document.getElementById('loginPwd').getBoundingClientRect();
    return {
      visivel: el.style.display === 'block' && r.height > 0,
      abaixoDaSenha: r.top > pwd.top,
      dentroDaJanela: r.left >= -0.5 && r.right <= window.innerWidth + 0.5,
      texto: el.innerText.replace(/\n+/g, ' | '),
    };
  });
  await cel.waitForTimeout(400);
  // Só a janela do celular: a tela de entrada é um cartaz por cima do app, e a foto
  // inteira mostraria o painel que está atrás — ruído que não é o assunto aqui.
  await cel.screenshot({ path: path.join(SAIDA, 'entrada-sem-memoria.png') });
  console.log('entrada-sem-memoria.png — ' + JSON.stringify(aviso, null, 1));
  if (!aviso.visivel) problemas.push('o aviso de aparelho sem memória não apareceu');
  if (!aviso.abaixoDaSenha) problemas.push('o aviso não ficou abaixo do campo de senha');
  if (!aviso.dentroDaJanela) problemas.push('o aviso vazou da janela de 390px');
  if (aviso.texto.indexOf('Este celular não guarda a autorização.') < 0) problemas.push('o texto do aviso mudou');

  const escritas = await page.evaluate(() => (window.__ESCRITAS__ || []).map((e) => e.metodo + ' ' + e.caminho));
  if (escritas.length) console.log('Escritas barradas pelo guarda (nenhuma foi ao banco): ' + JSON.stringify(escritas));

  await navegador.close();
  pararTudo();
  if (problemas.length) { console.log('FALHOU:\n  - ' + problemas.join('\n  - ')); process.exit(1); }
  console.log('OK — os quatro grupos, o Check-in, o "Já fez check-in", a faixa de duplicado e o aviso do celular sem memória.');
  process.exit(0);
})();
