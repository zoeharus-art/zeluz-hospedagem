'use strict';
/*
 * CAPTURA DA v 2026-09-17-01 — a lista de orçamentos em quatro seções recolhidas, o menu
 * renomeado (Ecossistema Daycare · Configurações · Dashboards) e o cartaz da saída
 * antecipada em Hóspedes de hoje.
 *
 * Abre o app de verdade (servidor local + EMULADOR carregado com o retrato do backup,
 * nunca o Firebase real) e fotografa o que a Adriana pediu para ver:
 *
 *   1. orcamento-secoes-recolhidas.png — 1280px, as QUATRO seções fechadas, cada uma com
 *      só o título e a contagem ("Orçamentos a confirmar", "Estadias fechadas",
 *      "Cancelados", "Já hospedados / passadas"). É o desenho que ela ditou: "para
 *      ninguém ficar procurando".
 *   2. orcamento-secao-aberta.png — 1280px, a seção "Estadias fechadas" ABERTA: os cards
 *      com Check-in, Mudar as datas e Cancelar reserva, o "Já fez check-in" desabilitado e
 *      a faixa vermelha do duplicado.
 *   3. orcamento-linhas-historico.png — 1280px, "Cancelados" e "Já hospedados / passadas"
 *      abertos: UMA linha por item, com o motivo do cancelamento e o estado da planilha.
 *   4. menu-ecossistema-configuracoes-dashboards.png — 390px (o celular do time), o menu
 *      com "Ecossistema Daycare", "Configurações" e os três administrativos dentro de
 *      Dashboards.
 *   5. saida-antecipada-cartaz.png — 1280px, o cartaz da saída antecipada em Hóspedes de
 *      hoje, com a conta das noites não usadas antes de confirmar.
 *
 * NADA É GRAVADO: o mesmo guarda de escrita do smoke embrulha set/update/push/remove antes
 * de o app carregar. Os orçamentos das fotos vivem só na memória da página (ORC_LISTA_CACHE).
 *
 * Uso:  NODE_PATH=C:/Users/zeluz/projetos-aios/code/node_modules node tests/capturar-v20.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');
const retratoLib = require('./lib/retrato');
const emuladorLib = require('./lib/emulador');

const RAIZ = path.join(__dirname, '..');
const APP = 'auaulandia/index.html';
const EMU_PORTA = Number(process.env.CAP_EMU_PORTA) || 9006;
const SAIDA = path.join(RAIZ, 'docs', 'capturas-v20');
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
  const servidor = await subirServidor(Number(process.env.CAP_PORTA) || 8796);
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
  // A foto do CARD, não da página: o topo do app é fixo e cobriria justamente o primeiro
  // cabeçalho de seção — que é o assunto destas fotos.
  const fotoDoCard = async (page, idInterno, arquivo) => {
    const el = (await page.evaluateHandle((id) => {
      const w = document.getElementById(id);
      return w ? (w.closest('.card') || w) : null;
    }, idInterno)).asElement();
    if (!el) { problemas.push('não achei o card de #' + idInterno); return false; }
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await el.screenshot({ path: path.join(SAIDA, arquivo) });
    return true;
  };

  // ======================================= 1 e 2 e 3. Orçamento em quatro seções
  const page = await novaPagina(1280, 1600);
  const entrou = await entrarComo(page, SENHA_DIRETORIA);
  if (!entrou) { console.error('Não entrou no app.'); await navegador.close(); pararTudo(); process.exit(1); }
  console.log('Entrou como: ' + entrou);

  await page.evaluate(() => abrirItemDoMenu('orcamento'));
  await page.waitForTimeout(1200);

  // Os quatro estados, montados só na MEMÓRIA da página. O banco não é tocado: a foto
  // precisa mostrar as quatro seções de uma vez, e o retrato não tem garantia de ter todas.
  const montar = await page.evaluate(() => {
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
      a2: { status: 'aguardando', entrada: mais(12), saida: mais(15), noites: 3, tutor: 'Bruno',
        criado_por: 'Wandela', criado_em: Date.now() - 10800000, total_cent: 33000,
        pets: [pet('Bis Leon', 'Bruno')] },
      n1: { status: 'nao_fechou', entrada: mais(2), saida: mais(4), noites: 2, tutor: 'Carla',
        criado_por: 'Wandela', criado_em: Date.now() - 259200000, total_cent: 24000,
        pets: [pet('Chico', 'Carla')] },
      c1: { status: 'cancelado', entrada: mais(1), saida: mais(5), noites: 4, tutor: 'Yara',
        criado_por: 'Wandela', criado_em: Date.now() - 300000000, total_cent: 48000,
        cancelado_por: 'Adriana', cancelado_em_br: '16/09/2026 18:40',
        cancelado_motivo: 'A viagem da tutora foi desmarcada',
        pets: [pet('Cookie', 'Yara')] },
      p1: { status: 'fechado', entrada: mais(-20), saida: mais(-15), noites: 5, tutor: 'Marguita',
        criado_por: 'Adriana', criado_em: Date.now() - 2592000000, total_cent: 60000, planilha_ok: true,
        pets: [pet('Dolly', 'Marguita')] },
      p2: { status: 'fechado', entrada: mais(-9), saida: mais(-6), noites: 3, tutor: 'Enilce',
        criado_por: 'Wandela', criado_em: Date.now() - 900000000, total_cent: 31000,
        planilha_ok: false, planilha_msg: 'a ponte respondeu fora do ar',
        pets: [pet('Lisa', 'Enilce')] },
    };
    // Um check-in já feito para a entrada do Thor e da Nala: o botão vira "Já fez check-in".
    // Só o Thor foi recebido — a Nala continua com o botão, e é isso que a foto mostra.
    ORC_ESTADIAS_CACHE = { e1: { refKey: 'thor__renata', nome: 'Thor', tutor: 'Renata',
      entrada: ORC_LISTA_CACHE.f3.entrada, saida: ORC_LISTA_CACHE.f3.saida, status: 'ativa' } };
    // Todas as seções recolhidas — o estado com que a tela nasce.
    ORC_SEC_ABERTA = {};
    orcRenderLista();
    const el = document.getElementById('orcLista');
    const cabecalhos = [].map.call(el.querySelectorAll('.orc-sec-tit'), (x) => x.textContent.trim());
    const contagens = [].map.call(el.querySelectorAll('.orc-sec-n'), (x) => x.textContent.trim());
    return {
      cabecalhos, contagens,
      corpoAberto: el.querySelectorAll('.orc-sec-corpo').length,
      cards: el.querySelectorAll('.avr-card').length,
      escritas: (window.__ESCRITAS__ || []).length,
    };
  });
  await page.waitForTimeout(400);
  await fotoDoCard(page, 'orcLista', 'orcamento-secoes-recolhidas.png');
  console.log('orcamento-secoes-recolhidas.png — ' + JSON.stringify(montar, null, 1));
  if (JSON.stringify(montar.cabecalhos) !== JSON.stringify(['Orçamentos a confirmar',
    'Estadias fechadas', 'Cancelados', 'Já hospedados / passadas'])) {
    problemas.push('as quatro seções não saíram na ordem dela: ' + JSON.stringify(montar.cabecalhos));
  }
  if (JSON.stringify(montar.contagens) !== JSON.stringify(['2', '3', '2', '2'])) {
    problemas.push('a contagem de cada seção não bateu: ' + JSON.stringify(montar.contagens));
  }
  if (montar.corpoAberto !== 0) problemas.push('alguma seção nasceu aberta — elas devem nascer recolhidas');
  if (montar.cards !== 0) problemas.push('com tudo recolhido nenhum card pode estar desenhado');

  // ---- 2. a seção "Estadias fechadas" aberta ----
  const aberta = await page.evaluate(() => {
    orcSecToggle(1);
    const el = document.getElementById('orcLista');
    const bt = [].map.call(el.querySelectorAll('button'), (b) => b.textContent.trim());
    return {
      cards: el.querySelectorAll('.avr-card').length,
      temCheckin: bt.some((t) => t === 'Check-in' || t.indexOf('Check-in de ') === 0),
      temJaFez: bt.some((t) => t.indexOf('Já fez check-in') === 0),
      temMudar: bt.indexOf('Mudar as datas') >= 0,
      temCancelar: bt.indexOf('Cancelar reserva') >= 0,
      temDuplicado: el.innerText.indexOf('Duplicado com ') >= 0,
    };
  });
  await page.waitForTimeout(400);
  await fotoDoCard(page, 'orcLista', 'orcamento-secao-aberta.png');
  console.log('orcamento-secao-aberta.png — ' + JSON.stringify(aberta, null, 1));
  if (aberta.cards !== 3) problemas.push('a seção aberta devia mostrar 3 cards, mostrou ' + aberta.cards);
  if (!aberta.temCheckin) problemas.push('nenhum botão Check-in apareceu na seção aberta');
  if (!aberta.temJaFez) problemas.push('o "Já fez check-in" não apareceu');
  if (!aberta.temMudar) problemas.push('o "Mudar as datas" não apareceu');
  if (!aberta.temCancelar) problemas.push('o "Cancelar reserva" não apareceu');
  if (!aberta.temDuplicado) problemas.push('a faixa de duplicado não apareceu');

  // ---- 3. as duas seções de histórico, uma linha por item ----
  const linhas = await page.evaluate(() => {
    orcSecToggle(1);   // fecha a de trabalho para a foto ser só do histórico
    orcSecToggle(2); orcSecToggle(3);
    const el = document.getElementById('orcLista');
    const bt = [].map.call(el.querySelectorAll('button'), (b) => b.textContent.trim());
    return {
      linhas: el.querySelectorAll('.orc-linha').length,
      cards: el.querySelectorAll('.avr-card').length,
      temMotivo: el.innerText.indexOf('A viagem da tutora foi desmarcada') >= 0,
      temSemMotivo: el.innerText.indexOf('sem motivo registrado') >= 0,
      temPlanilhaOk: el.innerText.indexOf('lançado na planilha') >= 0,
      temPlanilhaFalha: el.innerText.indexOf('NÃO entrou na planilha') >= 0,
      botoes: bt.filter((t, i, a) => a.indexOf(t) === i),
    };
  });
  await page.waitForTimeout(400);
  await fotoDoCard(page, 'orcLista', 'orcamento-linhas-historico.png');
  console.log('orcamento-linhas-historico.png — ' + JSON.stringify(linhas, null, 1));
  if (linhas.linhas !== 4) problemas.push('o histórico devia ter 4 linhas, teve ' + linhas.linhas);
  if (linhas.cards !== 0) problemas.push('o histórico não pode desenhar card — é UMA linha por item');
  if (!linhas.temMotivo) problemas.push('o motivo do cancelamento não apareceu na linha');
  if (!linhas.temSemMotivo) problemas.push('o "sem motivo registrado" não apareceu (o "não fechou" não tem motivo)');
  if (!linhas.temPlanilhaOk || !linhas.temPlanilhaFalha) problemas.push('o estado da planilha não apareceu nas duas formas');
  const proibidos = ['Cancelar reserva', 'Mudar as datas', 'apagar', 'Check-in'];
  const vazou = linhas.botoes.filter((t) => proibidos.indexOf(t) >= 0);
  if (vazou.length) problemas.push('botão que não é do histórico apareceu: ' + JSON.stringify(vazou));

  // ======================================= 5. Saída antecipada em Hóspedes de hoje
  const est = await page.evaluate(() => {
    const hoje = zHojeISO();
    const mais = (n) => { const d = new Date(hoje + 'T12:00:00'); d.setDate(d.getDate() + n);
      const p = (x) => String(x).padStart(2, '0');
      return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); };
    abrirItemDoMenu('hospedes');
    // Uma hospedagem em curso, só na memória da página: entrou há 3 dias, sai em 6.
    EST_TODAS = { cap1: { nome: 'Juma', tutor: 'Caroline Moreira Nogueira', raca: 'Westie',
      refKey: 'juma__caroline moreira nogueira', entrada: mais(-3), saida: mais(6),
      status: 'ativa', _ts: Date.now() } };
    renderHospedesAba();
    const bt = [].map.call(document.querySelectorAll('#hospAbaLista button'), (b) => b.textContent.trim());
    return { temBotao: bt.indexOf('Saída antecipada') >= 0, botoes: bt, saidaPrevista: mais(6) };
  });
  if (!est.temBotao) problemas.push('o botão "Saída antecipada" não apareceu em Hóspedes de hoje: ' + JSON.stringify(est.botoes));
  const cartaz = await page.evaluate(() => {
    // O app tem rotinas de fundo que gravam sozinhas (vigia de medicação, auditoria,
    // limpeza de fotos) — todas barradas pelo guarda. O que importa aqui é o DELTA: abrir
    // o cartaz não pode gravar NADA. Ele só mostra a conta; quem grava é o Confirmar.
    const antes = (window.__ESCRITAS__ || []).length;
    hospSaidaAntecipada('cap1');
    const el = document.getElementById('hospAbaLista');
    return {
      conta: (document.getElementById('hospAntConta') || {}).textContent || '',
      texto: el.innerText.replace(/\n+/g, ' | ').slice(0, 400),
      temConfirmar: el.innerText.indexOf('Confirmar saída antecipada') >= 0,
      escritasDoCartaz: (window.__ESCRITAS__ || []).length - antes,
    };
  });
  await page.waitForTimeout(500);
  await fotoDoCard(page, 'hospAbaLista', 'saida-antecipada-cartaz.png');
  console.log('saida-antecipada-cartaz.png — ' + JSON.stringify(cartaz, null, 1));
  if (!cartaz.temConfirmar) problemas.push('o cartaz da saída antecipada não abriu');
  if (cartaz.conta.indexOf('6 noites não usadas') < 0) problemas.push('a conta das noites não apareceu certa: ' + cartaz.conta);
  if (cartaz.escritasDoCartaz) problemas.push('abrir o cartaz gravou algo — ele só mostra a conta: ' + cartaz.escritasDoCartaz);

  // ======================================= 4. O menu renomeado, no celular do time
  // Janela ALTA de propósito: a barra tem rolagem própria e, com 1100px, "Configurações"
  // — a gaveta que ela renomeou — ficava abaixo da dobra e não entrava na foto.
  const cel = await novaPagina(390, 2600);
  const entrouCel = await entrarComo(cel, SENHA_DIRETORIA);
  if (!entrouCel) problemas.push('não entrei no app no celular');
  const menu = await cel.evaluate(() => {
    // A barra é uma gaveta: em celular ela vive em translateX(-100%) e QUEM a traz para a
    // tela é o .open no #sidebar (openNav). Pôr o .open no #nav não move nada — a foto
    // saía com o painel de trás, e a conferência pela DOM não percebia.
    openNav();
    // Abre as categorias para a foto mostrar os itens de cada uma.
    document.querySelectorAll('#nav .acc').forEach((a) => a.classList.add('acc-open'));
    const cat = [].map.call(document.querySelectorAll('#nav .acc>a.grp:not(.grp-sub)'),
      (a) => a.querySelector('span:nth-of-type(2)').textContent.trim());
    const dash = (() => {
      const i = document.querySelector('#nav .acc[data-acc="paineis"] .acc-panel');
      return i ? [].map.call(i.querySelectorAll('a[data-v]'), (a) => a.dataset.v) : [];
    })();
    const conf = (() => {
      const i = document.querySelector('#nav .acc[data-acc="operacao"] .acc-panel');
      return i ? [].map.call(i.querySelectorAll('a[data-v]'), (a) => a.dataset.v) : [];
    })();
    return { cat, dash, conf };
  });
  await cel.waitForTimeout(600);
  // Confere com os PIXELS, não só com a DOM: a gaveta tem de estar dentro da janela.
  const naTela = await cel.evaluate(() => {
    const el = document.getElementById('sidebar');
    const r = el.getBoundingClientRect();
    return { esquerda: Math.round(r.left), largura: Math.round(r.width), altura: Math.round(r.height) };
  });
  if (naTela.esquerda < -1) problemas.push('a gaveta do menu ficou fora da janela: left=' + naTela.esquerda);
  if (naTela.largura < 200) problemas.push('a gaveta do menu saiu estreita demais: ' + naTela.largura + 'px');
  // A foto só serve se as TRÊS categorias renomeadas estiverem visíveis nela.
  const dentroDaFoto = await cel.evaluate(() => {
    const lado = document.getElementById('sidebar').getBoundingClientRect();
    const cabe = (texto) => {
      const a = [].slice.call(document.querySelectorAll('#nav .acc>a.grp:not(.grp-sub)'))
        .find((x) => x.textContent.indexOf(texto) >= 0);
      if (!a) return false;
      const r = a.getBoundingClientRect();
      return r.top >= lado.top - 1 && r.bottom <= lado.bottom + 1;
    };
    return { dashboards: cabe('Dashboards'), ecossistema: cabe('Ecossistema Daycare'), config: cabe('Configurações') };
  });
  Object.keys(dentroDaFoto).forEach((k) => {
    if (!dentroDaFoto[k]) problemas.push('a categoria ' + k + ' ficou fora da foto do menu');
  });
  const aside = await cel.$('#sidebar');
  if (aside) await aside.screenshot({ path: path.join(SAIDA, 'menu-ecossistema-configuracoes-dashboards.png') });
  else problemas.push('não achei a barra do menu para fotografar');
  console.log('menu-ecossistema-configuracoes-dashboards.png — ' + JSON.stringify(menu, null, 1));
  if (menu.cat.indexOf('Ecossistema Daycare') < 0) problemas.push('a categoria "Ecossistema Daycare" não apareceu: ' + JSON.stringify(menu.cat));
  if (menu.cat.filter((c) => c === 'Configurações').length !== 1) problemas.push('a categoria "Configurações" não apareceu uma vez só: ' + JSON.stringify(menu.cat));
  if (menu.cat.indexOf('Serviços') >= 0 || menu.cat.indexOf('Operação') >= 0) problemas.push('nome antigo de categoria ficou na tela: ' + JSON.stringify(menu.cat));
  ['eahist', 'linhadotempo', 'ritmo'].forEach((k) => {
    if (menu.dash.indexOf(k) < 0) problemas.push(k + ' não está nos Dashboards');
    if (menu.conf.indexOf(k) >= 0) problemas.push(k + ' continua na gaveta Configurações');
  });
  if (JSON.stringify(menu.conf) !== JSON.stringify(['config', 'planodia', 'acerto', 'pessoas'])) {
    problemas.push('a gaveta Configurações não ficou só com o que é ajuste: ' + JSON.stringify(menu.conf));
  }

  const escritas = await page.evaluate(() => (window.__ESCRITAS__ || []).map((e) => e.metodo + ' ' + e.caminho));
  if (escritas.length) console.log('Escritas barradas pelo guarda (nenhuma foi ao banco): ' + JSON.stringify(escritas));

  await navegador.close();
  pararTudo();
  if (problemas.length) { console.log('FALHOU:\n  - ' + problemas.join('\n  - ')); process.exit(1); }
  console.log('OK — as quatro seções recolhidas, a seção aberta com Check-in, o histórico em linhas, o cartaz da saída antecipada e o menu renomeado.');
  process.exit(0);
})();
