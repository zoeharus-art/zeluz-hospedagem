'use strict';
/*
 * CAPTURA DA v 2026-09-24-06 — "Está vencendo": os DIAS DA SEMANA no menu, o que está EM
 * ABERTO na ficha, o resumo do dia por tipo de pendência, o CALENDÁRIO, a COBRANÇA e a
 * resposta que lança sozinha.
 *
 * Adriana, 24/set/2026: "Coloque 'Vencimentos' aqui dentro; o título 'está vencendo', e
 * abrindo no sidebar aparece segunda, terça, quarta, quinta, sexta. (…) Quem está com
 * pendência? Hoje: fulano, fulano. Amanhã: fulano. E quais são as pendências? Tudo
 * organizado para eu arrumar e deixar zerado. Com pendência de vermífugo, carrapaticida,
 * todas as vacinas e a escova dentária que estava sem nada.\"
 *
 * POR QUE ESTA CAPTURA EXISTE
 * Adriana, 21/set/2026: "Preciso que tenha um calendário. Hoje dia 21/09 com tudo que
 * preciso enviar. Precisa cobrar resposta. Se o tutor respondeu e o que respondeu. Vai
 * aplicar em casa / Vai mandar na bolsa / Pegar na loja / precisamos desse fluxo de forma
 * fácil e que tudo seja atualizado. Que no dashboard apareça que tem que dar (sem a
 * consultoria precisar digitar)."
 * E, no mesmo dia: "Uma das coisas mais importantes é que eu preciso de cobrar. Isso
 * precisa ir para o dashboard da consultora, onde ela precisa cobrar... Só fecha quando ela
 * consegue responder. Às vezes o tutor não responde no dia... Aquilo tem que ficar como
 * pendente. Ela tem que voltar nessa resposta para colocar o que o tutor respondeu."
 *
 * O QUE ELA FOTOGRAFA
 *   menu-dias-1280.png · menu-dias-500.png — o SIDEBAR com a gaveta "Vencimentos" ABERTA,
 *     mostrando Hoje · Segunda · Terça · Quarta · Quinta · Sexta
 *   vencimentos-1280.png · vencimentos-500.png — a PRIMEIRA DOBRA: o título "Está vencendo",
 *     o subtítulo do dia, o aviso da véspera, o seletor, as contas e o começo da fila
 *   resumo-dia-1280.png · resumo-dia-500.png — o bloco "Quem vem {dia} com pendência":
 *     os nomes em fila, agrupados por tipo de pendência, antes dos cartões
 *   calendario-1280.png · calendario-500.png — o CALENDÁRIO DO MÊS, com os contadores de
 *     cada dia (a mandar · a cobrar · mandado sem resposta · respondido) e o fim de semana
 *     apagado
 *   cartao-1280.png · cartao-500.png — UM cartão por inteiro: os itens com a data, as
 *     mensagens prontas (uma por assunto) e os CINCO botões de resposta nas palavras dela
 *   cobrar-1280.png · cobrar-500.png — um cartão no estado COBRAR: a faixa laranja com a
 *     hora em que a mensagem saiu, a mensagem de cobrança pronta e o botão "Cobrei"
 *   respostas-pendentes-1280.png · respostas-pendentes-500.png — o quadro "Respostas
 *     pendentes" do Dashboard das Consultoras (ou o da mesa, quando o papel não tem a tela),
 *     com os botões de resposta dentro
 *   config-mensagens-1280.png · config-mensagens-500.png — Configurações › Mensagens
 *     prontas: as seis mensagens, o fecho, a folga, o prazo da cobrança e os padrões do
 *     lançamento automático
 *
 * E ELA CONFERE, antes de fotografar: o item existe no menu com o rótulo certo; a tela traz
 * o dia-alvo, o aviso da véspera e o calendário; há pelo menos um cartão com mensagem pronta
 * e os cinco botões nas PALAVRAS DELA; cada mensagem começa com "Olá" e traz uma das frases
 * dela; o estado "cobrar" mostra a hora, a mensagem de cobrança e o "Cobrei"; o quadro das
 * respostas pendentes traz botões; o cartão do Configurações traz as seis mensagens, o
 * fecho, a folga, o prazo e os dois padrões.
 * NENHUM botão que grava é apertado — nem "Mandei", nem as respostas, nem "Cobrei", nem
 * "Salvar".
 *
 * O ESTADO "COBRAR" é injetado no banco do EMULADOR com uma marca de envio antiga
 * (enviadas/{assunto}.ts de ontem) pelo próprio navegador, com o guarda de escrita ligado —
 * o app lê e desenha sozinho. Nada é fabricado na tela: é o mesmo caminho da vida real.
 *
 * NADA É GRAVADO NO FIREBASE DE VERDADE: o mesmo guarda de escrita do smoke embrulha
 * set/update/push/remove/transaction antes de o app carregar, e o banco é o EMULADOR local
 * com o retrato do backup.
 *
 * Uso:  CAP_PORTA=8831 CAP_EMU_PORTA=9031 NODE_PATH=C:/Users/zeluz/projetos-aios/code/node_modules node tests/capturar-v28.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');
const retratoLib = require('./lib/retrato');
const emuladorLib = require('./lib/emulador');

const RAIZ = path.join(__dirname, '..');
const APP = 'auaulandia/index.html';
const PORTA = Number(process.env.CAP_PORTA) || 8831;
const EMU_PORTA = Number(process.env.CAP_EMU_PORTA) || 9031;
const SAIDA = path.join(RAIZ, 'docs', 'capturas-v28');
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
// A chave do FILHOt tem acento e traço; num seletor de id, o que precisa de barra é o que
// o CSS trata como especial. Escapa à mão para não depender de CSS.escape no contexto do teste.
function CSS_escapar(v) {
  return String(v || '').replace(/([ !"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~])/g, '\\$1');
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
    const ctx = await navegador.newContext({ viewport: { width: larg.w, height: 1400 }, deviceScaleFactor: 2 });
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

    // ---- 1 · o item do menu -------------------------------------------------------
    const itemMenu = await page.$('#nav a[data-v="vencimentos"]');
    if (!itemMenu) problemas.push('não achei o item "Vencimentos" no menu (' + larg.rot + ')');
    const rotuloMenu = itemMenu ? ((await itemMenu.innerText()) || '').replace(/\s+/g, ' ').trim() : '';
    if (itemMenu && rotuloMenu.indexOf('Vencimentos') < 0) {
      problemas.push('o rótulo do item do menu não é o esperado (' + larg.rot + '): "' + rotuloMenu + '"');
    }
    // A GAVETA DOS DIAS (24/set/2026): o sidebar abre em Hoje · Segunda … Sexta. A foto é a
    // prova de que ela existe e de que o filho é menor que o pai.
    const dias = await page.$$eval('#navVencDias a[data-vdia]',
      (ns) => ns.map((a) => (a.textContent || '').trim()));
    if (JSON.stringify(dias) !== JSON.stringify(['Hoje', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'])) {
      problemas.push('os dias da gaveta "Vencimentos" não são os esperados (' + larg.rot + '): ' + JSON.stringify(dias));
    }
    // Abre a corrente inteira (categoria › Day Care › Vencimentos) e fotografa a barra.
    await page.evaluate(() => {
      const a = document.querySelector('#nav a[data-v="vencimentos"]');
      if (a && typeof abrirSanfonasDe === 'function') abrirSanfonasDe(a);
    });
    await page.waitForTimeout(700);
    const barra = await page.$('#nav');
    if (barra) {
      const visivel = await page.evaluate(() => {
        const el = document.querySelector('#navVencDias');
        return !!(el && el.getBoundingClientRect().height > 0);
      });
      if (!visivel) problemas.push('a gaveta "Vencimentos" não abriu no sidebar (' + larg.rot + ')');
      const tamanhos = await page.evaluate(() => {
        const px = (sel) => { const el = document.querySelector(sel); return el ? parseFloat(getComputedStyle(el).fontSize) : 0; };
        return { cat: px('#nav a.grp[data-acc-toggle="central"]'),
          sub: px('#nav a.grp.grp-sub[data-acc-toggle="c-daycare"]'),
          item: px('#nav a[data-v="vacinas"]'), dia: px('#nav a.nav-dia[data-vdia="seg"]') };
      });
      if (!(tamanhos.cat > tamanhos.sub && tamanhos.sub > tamanhos.item && tamanhos.item > tamanhos.dia)) {
        problemas.push('a hierarquia do menu inverteu (' + larg.rot + '): ' + JSON.stringify(tamanhos));
      }
      await barra.screenshot({ path: path.join(SAIDA, 'menu-dias-' + larg.rot + '.png'),
        animations: 'disabled', timeout: 30000 });
      console.log('menu-dias-' + larg.rot + '.png · ' + JSON.stringify(tamanhos));
    }

    // ---- 2 · a tela ----------------------------------------------------------------
    await page.evaluate(() => { if (typeof abrirItemDoMenu === 'function') abrirItemDoMenu('vencimentos'); });
    await page.waitForTimeout(2600);
    await estabilizar(page);
    await dispensarCartazes(page, 3);

    const tela = await page.$('#v-vencimentos');
    if (!tela) { problemas.push('a tela #v-vencimentos não existe (' + larg.rot + ')'); }
    else {
      // O retrato é de um dia útil, e há dezenas de FILHOts com prevenção vencida — mas a
      // captura pode rodar num dia em que a turma do dia-alvo esteja inteira em dia. Nesse
      // caso, anda pelos próximos dias de Day Care até achar um com cartão. Ninguém fabrica
      // dado: só se escolhe OUTRO dia, pelo mesmo seletor que a consultora usa.
      let nCartoes = await page.$$eval('#vencRoot [id^="vencCard_"]', (ns) => ns.length);
      for (let tent = 0; tent < 6 && nCartoes === 0; tent++) {
        const achou = await page.evaluate(() => {
          if (typeof proximoDiaDayCare !== 'function' || typeof vencTrocarDia !== 'function') return '';
          const base = (typeof vencDiaAlvo === 'function') ? vencDiaAlvo() : '';
          const prox = proximoDiaDayCare(base);
          if (!prox) return '';
          vencTrocarDia(prox);
          return prox;
        });
        if (!achou) break;
        await page.waitForTimeout(2200);
        await estabilizar(page);
        nCartoes = await page.$$eval('#vencRoot [id^="vencCard_"]', (ns) => ns.length);
      }
      if (!nCartoes) problemas.push('não consegui mostrar nenhum cartão em Vence amanhã (' + larg.rot + ')');

      const t = (await tela.innerText()) || '';
      ['Está vencendo', 'quem vem', 'e o que está em aberto', 'Hoje', 'para mandar', 'sem resposta',
        'Mande até', 'a mensagem se manda na véspera', 'Respostas pendentes']
        .forEach((s) => { if (t.indexOf(s) < 0) problemas.push('Vence amanhã (' + larg.rot + '): faltou "' + s + '" na tela'); });
      if (nCartoes) {
        // As palavras da resposta são as DELA, na ordem que ela ditou.
        ['Copiar mensagem', 'Mandei', 'O que o tutor respondeu sobre',
          'Vai aplicar em casa', 'Vai mandar na bolsa', 'Pegar na loja',
          'Não respondeu', 'Não quer agora']
          .forEach((s) => { if (t.indexOf(s) < 0) problemas.push('Vence amanhã (' + larg.rot + '): faltou "' + s + '" no cartão'); });
        // Os botões antigos não podem reaparecer numa tela sem ninguém notar.
        ['Pode fazer na Zêluz', 'Tutor faz em casa / no veterinário']
          .forEach((s) => { if (t.indexOf(s) >= 0) problemas.push('o botão antigo "' + s + '" voltou à tela (' + larg.rot + ')'); });
        const msg = await page.$$eval('#vencRoot textarea[id^="vencMsg_"]', (ts) => ts.map((x) => x.value || ''));
        if (!msg.length) problemas.push('nenhuma mensagem pronta desenhada (' + larg.rot + ')');
        else {
          // As mensagens são as DELA. Cada uma começa com "Olá" e traz uma das frases dela;
          // "Passando para avisar:" era o texto genérico que eu tinha inventado — se ele
          // reaparecer numa tela, é porque alguém voltou atrás sem querer.
          // 24/set/2026: entraram as duas mensagens novas — o que está EM ABERTO na ficha e
          // a vacina que precisa de agendamento porque o dia dele não é dia da Veterinária.
          const frasesDela = ['Passando para informar que', 'Passando para lembrar que',
            'É dia da segunda dose', 'está na hora de trocar',
            'Está em aberto na ficha', 'A nossa Veterinária atende de segunda a sexta'];
          msg.forEach((m, i) => {
            if (m.indexOf('Olá') !== 0 || !frasesDela.some((f) => m.indexOf(f) > 0))
              problemas.push('a mensagem ' + (i + 1) + ' não saiu como esperado (' + larg.rot + '): "' + m.slice(0, 100) + '"');
          });
          if (msg.some((m) => m.indexOf('Passando para avisar:') >= 0))
            problemas.push('o texto genérico antigo ("Passando para avisar:") ainda está saindo (' + larg.rot + ')');
          if (larg.w === 1280) console.log('mensagens prontas desenhadas na tela: ' + msg.length);
        }
      }
      // Nenhum vocabulário proibido pode ter escapado para a tela.
      ['cachorro', 'cãozinho', 'dono ', 'funcionário'].forEach((p) => {
        if (t.toLowerCase().indexOf(p) >= 0) problemas.push('palavra proibida "' + p.trim() + '" na tela (' + larg.rot + ')');
      });

      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);
      // A tela inteira com 34 cartões dá uma foto de 33 mil pixels de altura, que ninguém
      // consegue olhar. O que ela precisa ver é a PRIMEIRA DOBRA: a frase do dia, o seletor,
      // as contas e o começo da fila. O cartão de perto vem na foto seguinte.
      await mascararTelefones(page);
      await page.screenshot({ path: path.join(SAIDA, 'vencimentos-' + larg.rot + '.png') });
      console.log('vencimentos-' + larg.rot + '.png · ' + nCartoes + ' cartão(ões)');

      // ---- 2b · "QUEM VEM {dia} COM PENDÊNCIA" — a lista organizada ----------------
      // "Quem está com pendência? Hoje: fulano, fulano. (…) Tudo organizado para eu arrumar
      // e deixar zerado." O bloco vem ANTES dos cartões, com os nomes em fila por tipo.
      // A tela se redesenha sozinha até 9 s depois de abrir (o cadastro chega em partes).
      // Fotografar antes disso pega o elemento sendo trocado — "element is not stable".
      await page.waitForTimeout(9500);
      await estabilizar(page);
      const resumo = page.locator('#vencRoot .card', { hasText: 'com pendência' }).first();
      if (!(await resumo.count())) {
        problemas.push('não achei o bloco "Quem vem … com pendência" (' + larg.rot + ')');
      } else {
        const tr = (await resumo.innerText()) || '';
        if (tr.indexOf('Copiar resumo') < 0) problemas.push('o resumo do dia não traz o botão "Copiar resumo" (' + larg.rot + ')');
        const linhas = ['Vermífugo', 'Carrapaticida', 'Vacinas', 'Coleira', 'Escova de dentes',
          'Em aberto na ficha'];
        if (!linhas.some((x) => tr.indexOf(x) >= 0)) {
          problemas.push('o resumo do dia não agrupou por tipo de pendência (' + larg.rot + '): ' + tr.slice(0, 160));
        }
        // O texto puro é o MESMO da tela — duas escritas da mesma lista viram duas verdades.
        const txt = await page.evaluate(() => {
          if (typeof vencResumoTexto !== 'function' || typeof vencLista !== 'function') return '';
          const dia = vencDiaAlvo();
          let L = []; try { L = vencLista(dia) || []; } catch (e) { L = []; }
          return vencResumoTexto(L, dia, (typeof zHojeISO === 'function') ? zHojeISO() : '');
        });
        if (txt.indexOf('Está vencendo — quem vem ') !== 0) {
          problemas.push('o texto do "Copiar resumo" não começa como a tela (' + larg.rot + '): ' + JSON.stringify(txt.slice(0, 80)));
        }
        await resumo.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        await mascararTelefones(page);
        await resumo.screenshot({ path: path.join(SAIDA, 'resumo-dia-' + larg.rot + '.png'),
          animations: 'disabled', timeout: 30000 });
        console.log('resumo-dia-' + larg.rot + '.png');
      }

      // ---- 3 · O CALENDÁRIO DO MÊS -------------------------------------------------
      const cal = await page.$('#vencCal');
      if (!cal) problemas.push('não achei o calendário do mês (#vencCal) em Vence amanhã (' + larg.rot + ')');
      else {
        const tc = (await cal.innerText()) || '';
        ['a mandar', 'a cobrar', 'mandado, sem resposta', 'respondido']
          .forEach((x) => { if (tc.indexOf(x) < 0) problemas.push('o calendário (' + larg.rot + ') não explica "' + x + '"'); });
        const apagados = await page.$$eval('#vencCal .vcal-off', (ns) => ns.length);
        if (apagados < 4) problemas.push('o calendário (' + larg.rot + ') não apagou os dias sem Day Care: ' + apagados);
        await page.locator('#vencCal').first().scrollIntoViewIfNeeded();
        await page.waitForTimeout(700);
        await page.locator('#vencCal').first().screenshot({
          path: path.join(SAIDA, 'calendario-' + larg.rot + '.png'),
          animations: 'disabled', timeout: 30000 });
        console.log('calendario-' + larg.rot + '.png · ' + apagados + ' dia(s) apagado(s)');
      }

      // ---- 4 · UM cartão, de perto ------------------------------------------------
      const cartao = await page.$('#vencRoot [id^="vencCard_"]');
      if (cartao) {
        const umCartao = page.locator('#vencRoot [id^="vencCard_"]').first();
        await umCartao.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        await mascararTelefones(page);
        await umCartao.screenshot({ path: path.join(SAIDA, 'cartao-' + larg.rot + '.png'),
          animations: 'disabled', timeout: 30000 });
        console.log('cartao-' + larg.rot + '.png');
      }

      // ---- 5 · UM cartão no estado COBRAR -------------------------------------------
      // A marca de envio antiga é INJETADA no banco do emulador pelo próprio navegador, com
      // o guarda de escrita ligado: o app lê e desenha sozinho. Nada é fabricado na tela.
      const injetou = await page.evaluate(() => {
        const cartoes = Array.from(document.querySelectorAll('#vencRoot [id^="vencCard_"]'));
        if (!cartoes.length || typeof vencDiaAlvo !== 'function') return '';
        const chave = cartoes[0].id.replace(/^vencCard_/, '');
        const o = (typeof vencAchar === 'function') ? vencAchar(chave) : null;
        const tipos = (o && typeof vencGrupos === 'function') ? vencGrupos(o).map((g) => g.tipo) : [];
        if (!tipos.length) return '';
        const ontem = Date.now() - 26 * 3600000;
        const env = {}; tipos.forEach((t) => { env[t] = { quem: 'Amanda Silva', ts: ontem }; });
        VENC_REG = VENC_REG || {};
        VENC_REG[chave] = Object.assign({}, VENC_REG[chave] || {}, { enviadas: env });
        if (typeof vencRender === 'function') vencRender();
        return chave;
      });
      if (!injetou) problemas.push('não consegui pôr um cartão no estado "cobrar" (' + larg.rot + ')');
      else {
        await page.waitForTimeout(900);
        const cob = page.locator('#vencCard_' + CSS_escapar(injetou)).first();
        const tcob = (await cob.count()) ? ((await cob.innerText()) || '') : '';
        ['COBRAR', 'sem resposta — cobrar', 'Copiar a cobrança', 'Cobrei']
          .forEach((x) => { if (tcob.indexOf(x) < 0) problemas.push('o cartão em "cobrar" (' + larg.rot + ') não mostra "' + x + '"'); });
        if (!/Mandado às \d\d:\d\d/.test(tcob))
          problemas.push('o cartão em "cobrar" (' + larg.rot + ') não diz a que horas a mensagem saiu');
        if (await cob.count()) {
          await cob.scrollIntoViewIfNeeded();
          await page.waitForTimeout(500);
          await mascararTelefones(page);
          await cob.screenshot({ path: path.join(SAIDA, 'cobrar-' + larg.rot + '.png'),
            animations: 'disabled', timeout: 30000 });
          console.log('cobrar-' + larg.rot + '.png');
        }
      }
    }

    // ---- 6 · o quadro "Respostas pendentes" ----------------------------------------
    // No Dashboard das Consultoras quando o papel tem a tela; senão, na mesa "O que fazer
    // hoje", que é onde o mesmo quadro aparece.
    //
    // O retrato do backup ainda não tem mensagem mandada em daycare/vencimentos — e um
    // quadro vazio não mostra o que ela pediu para ver. Então a marca de "mandado ontem" é
    // posta NA MEMÓRIA do app (VENC_PEND), com o guarda de escrita ligado: o app desenha
    // sozinho, pelo mesmo caminho da vida real, e o banco não recebe um byte.
    {
      const podePc = await page.evaluate(() =>
        (typeof podePapel === 'function') && podePapel('painel-consultoras'));
      await page.evaluate((v) => { if (typeof abrirItemDoMenu === 'function') abrirItemDoMenu(v); },
        podePc ? 'consultoras' : 'painelmeu');
      await page.waitForTimeout(3200);
      await estabilizar(page);
      await dispensarCartazes(page, 3);
      const quantos = await page.evaluate(() => {
        if (typeof VENC_PEND === 'undefined' || typeof vencLista !== 'function') return 0;
        const dia = (typeof vencDiaAlvo === 'function') ? vencDiaAlvo() : '';
        let L = [];
        try { L = vencLista(dia) || []; } catch (e) { L = []; }
        if (!dia || !L.length) return 0;
        const ontem = Date.now() - 26 * 3600000;
        VENC_PEND = VENC_PEND || {};
        VENC_PEND[dia] = VENC_PEND[dia] || {};
        L.slice(0, 3).forEach((o) => {
          const env = {};
          vencGrupos(o).forEach((g) => { env[g.tipo] = { quem: 'Amanda Silva', ts: ontem }; });
          VENC_PEND[dia][o.chave] = Object.assign({}, VENC_PEND[dia][o.chave] || {}, {
            pet: o.nome, tutor: o.tutor, enviadas: env,
            itens: (o.itens || []).map((x) => ({ k: x.k, nome: x.nome, vence: x.vence, atrasado: !!x.atrasado })),
          });
        });
        // Pela MESMA porta do app (vencPcQuadro): ela troca o conteúdo E acende o .pm-rv.
        // Mexer no innerHTML à mão aqui deixaria a foto em branco — e a foto é a prova.
        if (typeof vencPcQuadro === 'function' && typeof vencPendCardHTML === 'function')
          vencPcQuadro('pcCardPend', vencPendCardHTML());
        if (typeof MESA_EXPAND !== 'undefined') MESA_EXPAND.respostas = true;
        if (typeof mesaRender === 'function' && document.getElementById('mesaRoot')) mesaRender();
        return Math.min(3, L.length);
      });
      if (!quantos) problemas.push('não consegui mostrar nenhuma resposta pendente (' + larg.rot + ')');
      await page.waitForTimeout(900);
      // display:contents não tem retângulo próprio — fotografa-se o cartão de dentro.
      const selPend = (await page.$('#pcCardPend article')) ? '#pcCardPend article' : '#mesaRoot';
      const alvoPend = (await page.locator(selPend).count()) ? page.locator(selPend).first() : null;
      if (!alvoPend) problemas.push('não achei o quadro "Respostas pendentes" (' + larg.rot + ')');
      else {
        const tp = (await alvoPend.innerText()) || '';
        ['Respostas pendentes', 'Vai aplicar em casa', 'Vai mandar na bolsa', 'Pegar na loja',
          'Não respondeu', 'Não quer agora', 'Cobrei']
          .forEach((x) => { if (tp.indexOf(x) < 0) problemas.push('o quadro das respostas pendentes (' + larg.rot + ') não mostra "' + x + '"'); });
        await alvoPend.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1500);
        await mascararTelefones(page);
        // O quadro do Dashboard das Consultoras nasce invisível (.pm-rv) — se ele não
        // estiver aceso, a foto sai em branco e ninguém descobre isso lendo o código.
        const aceso = await page.evaluate((sel) => {
          const el = document.querySelector(sel);
          if (!el) return false;
          const alvo = el.classList.contains('pm-rv') ? el : el.querySelector('.pm-rv');
          return !alvo || alvo.classList.contains('dentro');
        }, selPend);
        if (!aceso) problemas.push('o quadro das respostas pendentes ficou invisível (.pm-rv sem "dentro") em ' + larg.rot);
        await alvoPend.screenshot({ path: path.join(SAIDA, 'respostas-pendentes-' + larg.rot + '.png'),
          animations: 'disabled', timeout: 30000 });
        console.log('respostas-pendentes-' + larg.rot + '.png · ' + quantos + ' pendente(s)');
      }
    }

    // ---- 7 · Configurações › Mensagens prontas --------------------------------------
    await page.evaluate(() => { if (typeof abrirItemDoMenu === 'function') abrirItemDoMenu('config'); });
    await page.waitForTimeout(2600);
    await estabilizar(page);
    await dispensarCartazes(page, 3);
    const cfg = await page.$('#cfgVencCard');
    if (!cfg) problemas.push('não achei o cartão "Mensagens prontas" em Configurações (' + larg.rot + ')');
    else {
      const tc = (await cfg.innerText()) || '';
      ['Mensagens prontas', '{tutor}', '{ofilhot}', '{dofilhot}', '{quando}', '{vacina}', '{item}',
        '{valor_escova}', '{fecho}', 'Vacina — quando é preciso marcar horário',
        'Vacina — quando ele vem num dia de atendimento', 'Vermífugo, carrapaticida e coleira',
        'Vermífugo — a 2ª dose (21 dias depois da 1ª)', 'Troca de escova de dentes',
        'O fecho da autorização', 'A cobrança — quando o tutor não responde',
        'Entrar na lista com quantos dias de folga', 'Cobrar resposta depois de (horas)',
        'Padrões do lançamento automático', 'Carrapaticida — quanto lançar',
        'Coleira — onde vai ser trocada',
        'Salvar', 'Voltar ao texto de fábrica']
        .forEach((s) => { if (tc.indexOf(s) < 0) problemas.push('Mensagens prontas (' + larg.rot + '): faltou "' + s + '"'); });
      const campos = await page.evaluate(() => {
        const g = (id) => { const el = document.getElementById(id); return el ? String(el.value || '') : null; };
        return { vacina: g('cfgVencVacina'), creche: g('cfgVencVacinaCreche'), antip: g('cfgVencAntip'),
          verm2: g('cfgVencVerm2'), escova: g('cfgVencEscova'), fecho: g('cfgVencFecho'),
          cobranca: g('cfgVencCobranca'), margem: g('cfgVencMargem'), cobrancaH: g('cfgVencCobrancaH'),
          autoEcto: g('cfgVencAutoEcto'), autoCol: g('cfgVencAutoCol') };
      });
      const exigir = [['vacina', 'Temos horário no dia {dia_vet}'], ['creche', 'sem precisar marcar horário'],
        ['antip', '{item}'], ['verm2', 'É dia da segunda dose'],
        ['escova', '{valor_escova}'], ['fecho', '{quando}'],
        ['cobranca', 'Podemos contar com a sua resposta?']];
      exigir.forEach(([k, trecho]) => {
        if (!campos[k] || campos[k].indexOf(trecho) < 0)
          problemas.push('o campo "' + k + '" não trouxe o modelo dela (' + larg.rot + '): ' + JSON.stringify((campos[k] || '').slice(0, 90)));
      });
      if (!/^\d+$/.test(String(campos.margem || '')))
        problemas.push('a folga em dias não veio como número (' + larg.rot + '): ' + JSON.stringify(campos.margem));
      if (!/^\d+([.,]\d+)?$/.test(String(campos.cobrancaH || '')))
        problemas.push('o prazo da cobrança não veio como número (' + larg.rot + '): ' + JSON.stringify(campos.cobrancaH));
      if (!campos.autoEcto || !campos.autoCol)
        problemas.push('os padrões do lançamento automático vieram vazios (' + larg.rot + '): '
          + JSON.stringify([campos.autoEcto, campos.autoCol]));
      await cfg.scrollIntoViewIfNeeded();
      // Configurações tem vários cartões que se preenchem sozinhos (protocolos, valores,
      // fotos) e empurram a página enquanto chegam. Sem esta folga a foto sai tremida — ou
      // nem sai, porque o elemento nunca fica parado.
      await page.waitForTimeout(2000);
      await cfg.screenshot({ path: path.join(SAIDA, 'config-mensagens-' + larg.rot + '.png'),
        animations: 'disabled', timeout: 30000 });
      console.log('config-mensagens-' + larg.rot + '.png');
    }

    const escritas = await page.evaluate(() => (window.__ESCRITAS__ || []).length);
    console.log('Tentativas de gravação barradas pelo guarda (' + larg.rot + '): ' + escritas + ' (nenhuma foi ao banco)');
    await ctx.close();
  }

  await navegador.close();
  pararTudo();
  if (problemas.length) { console.error('\nPROBLEMAS:\n- ' + problemas.join('\n- ')); process.exit(1); }
  console.log('\nCaptura da v 2026-09-24-06 pronta em docs/capturas-v28/');
})().catch((e) => { console.error(e); process.exit(1); });
