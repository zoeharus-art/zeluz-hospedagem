'use strict';
/*
 * SMOKE DE NAVEGADOR — abre o app de verdade e visita todas as telas do menu, papel por papel.
 * 28/ago/2026.
 *
 * POR QUE ESTE TESTE EXISTE
 * O tests/harness.js prova a LÓGICA (centenas de provas sobre as funções reais, em caixa de
 * areia), mas ele nunca abre a tela. Um bug de "a tela abre vazia" passou QUATRO vezes por
 * ele — a última corrigida no commit d86a3dc — porque nenhuma prova de lógica enxerga um
 * <section> que ficou em branco. Este teste faz o que só o navegador faz: entra com a senha
 * de cada papel, clica em cada item do menu e olha se apareceu alguma coisa na tela.
 *
 * O QUE ELE NUNCA FAZ: GRAVAR
 * O app fala com o Firebase Realtime Database REAL (login anônimo). Antes de o app carregar,
 * um guarda embrulha set/update/push/remove/transaction/onDisconnect e o fetch para o banco:
 * toda tentativa de gravação é ANOTADA e NÃO EXECUTADA. O relatório prova o guarda forçando
 * uma gravação de mentira (daycare/_smoke) e mostrando que o nó não existe no banco.
 * O teste também não toca em botão de ação: só menu, categorias e sub-cabeçalhos.
 *
 * COMO RODAR
 *   NODE_PATH=C:/Users/zeluz/projetos-aios/code/node_modules node tests/smoke-navegador.js
 *
 * Sai 0 quando toda tela abriu com conteúdo e sem erro; sai 1 quando alguma falhou.
 *
 * Variáveis opcionais:
 *   SMOKE_PORTA=8765      porta do servidor local (padrão: procura de 8765 a 8790)
 *   SMOKE_PAPEIS=gestao,vet   roda só esses papéis
 *   SMOKE_SEM_DAYCARE=1   pula a varredura das atividades do Day Care (mais rápido)
 *   SMOKE_BASE=http://...  usa um endereço já servido (serve para o teste de mutação, que
 *                          prova que este teste REPROVA de verdade uma tela quebrada)
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const { chromium } = require('playwright');

const RAIZ = path.join(__dirname, '..');
const APP = 'auaulandia/index.html';
const SAIDA_MD = path.join(RAIZ, 'docs', 'auditoria-28ago2026', '03-smoke-navegador.md');
const SAIDA_IMG = path.join(RAIZ, 'docs', 'auditoria-28ago2026', 'capturas-smoke');

const ESPERA_REDE_MS = 8000;   // teto para a rede aquietar
const ESPERA_EXTRA_MS = 1200;  // folga depois que ela aquieta (exigência do combinado)
const MIN_CARACTERES = 40;     // abaixo disto a tela está vazia

// ===================== SERVIDOR LOCAL =====================
// Nunca o GitHub Pages: o teste tem de medir o arquivo que está no disco agora.

function pedirCabecalho(porta, caminho) {
  return new Promise((res) => {
    const req = http.get({ host: '127.0.0.1', port: porta, path: caminho, timeout: 3000 }, (r) => {
      let n = 0;
      let inicio = '';
      r.on('data', (d) => { n += d.length; if (inicio.length < 400) inicio += d.toString('utf8'); });
      r.on('end', () => res({ status: r.statusCode, bytes: n, inicio }));
    });
    req.on('error', () => res(null));
    req.on('timeout', () => { req.destroy(); res(null); });
  });
}

function servidorInterno(porta) {
  // Reserva: sobe um servidor estático em Node quando não há python nem servidor já no ar.
  const tipos = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
  const srv = http.createServer((req, res) => {
    const rel = decodeURIComponent(String(req.url || '/').split('?')[0]).replace(/^\/+/, '');
    const alvo = path.join(RAIZ, rel || 'index.html');
    if (!alvo.startsWith(RAIZ)) { res.writeHead(403).end(); return; }
    fs.readFile(alvo, (e, buf) => {
      if (e) { res.writeHead(404).end('nao achei'); return; }
      res.writeHead(200, { 'Content-Type': tipos[path.extname(alvo).toLowerCase()] || 'application/octet-stream' });
      res.end(buf);
    });
  });
  return new Promise((res, rej) => {
    srv.on('error', rej);
    srv.listen(porta, '127.0.0.1', () => res(srv));
  });
}

async function garantirServidor() {
  if (process.env.SMOKE_BASE) {
    const base = process.env.SMOKE_BASE.replace(/\/+$/, '');
    return { base, como: 'endereço informado em SMOKE_BASE (' + base + ')', parar: () => {} };
  }
  const tamanhoReal = fs.statSync(path.join(RAIZ, APP)).size;
  const portas = process.env.SMOKE_PORTA ? [Number(process.env.SMOKE_PORTA)] : [];
  for (let p = 8765; p <= 8790 && !process.env.SMOKE_PORTA; p++) portas.push(p);

  // 1) Já existe um servidor no ar servindo ESTE arquivo? Reaproveita.
  for (const porta of portas) {
    const r = await pedirCabecalho(porta, '/' + APP);
    if (r && r.status === 200 && r.bytes === tamanhoReal) {
      return { porta, base: 'http://127.0.0.1:' + porta, como: 'servidor já no ar na porta ' + porta, parar: () => {} };
    }
  }

  // 2) Porta livre + python disponível → python -m http.server (o combinado).
  for (const porta of portas) {
    const ocupada = await pedirCabecalho(porta, '/');
    if (ocupada) continue;
    const py = await new Promise((res) => {
      const proc = spawn('python', ['-m', 'http.server', String(porta), '--bind', '127.0.0.1'],
        { cwd: RAIZ, stdio: 'ignore' });
      proc.on('error', () => res(null));
      setTimeout(() => res(proc.killed ? null : proc), 1400);
    });
    if (py) {
      const ok = await pedirCabecalho(porta, '/' + APP);
      if (ok && ok.status === 200 && ok.bytes === tamanhoReal) {
        return { porta, base: 'http://127.0.0.1:' + porta, como: 'python -m http.server ' + porta, parar: () => { try { py.kill(); } catch (e) {} } };
      }
      try { py.kill(); } catch (e) {}
    }
    // 3) Sem python: servidor interno em Node, mesma porta.
    try {
      const srv = await servidorInterno(porta);
      return { porta, base: 'http://127.0.0.1:' + porta, como: 'servidor Node interno na porta ' + porta, parar: () => { try { srv.close(); } catch (e) {} } };
    } catch (e) { /* porta recusou: tenta a próxima */ }
  }
  throw new Error('Não consegui subir nem encontrar um servidor local para ' + APP);
}

// ===================== O GUARDA DE ESCRITA =====================
// Roda ANTES de qualquer script do app (page.addInitScript). Assim que o firebase existir,
// embrulha tudo que grava. Nada vai para o banco: a tentativa é anotada e a Promise volta
// resolvida, de modo que o app segue o fluxo dele achando que gravou.

function guardaDeEscrita() {
  window.__ESCRITAS__ = [];
  window.__GUARDA_OK__ = false;
  window.__TELA_ATUAL__ = '(antes do login)';

  const anotar = (metodo, caminho) => {
    try {
      window.__ESCRITAS__.push({
        metodo, caminho,
        tela: window.__TELA_ATUAL__ || '(sem tela)',
        ts: Date.now()
      });
    } catch (e) {}
  };

  const caminhoDe = (ref) => {
    try { return String(ref.toString()).replace(/^https?:\/\/[^/]+\//, ''); } catch (e) { return '(?)'; }
  };

  const embrulhar = () => {
    const fb = window.firebase;
    if (!fb || !fb.database || !fb.database.Reference || !fb.database.Reference.prototype) return false;
    const R = fb.database.Reference.prototype;
    if (R.__guardadoPeloSmoke) return true;

    ['set', 'update', 'remove', 'setWithPriority', 'setPriority'].forEach((m) => {
      if (typeof R[m] !== 'function') return;
      R[m] = function () { anotar(m, caminhoDe(this)); return Promise.resolve(); };
    });

    if (typeof R.transaction === 'function') {
      R.transaction = function () {
        anotar('transaction', caminhoDe(this));
        return Promise.resolve({ committed: false, snapshot: null });
      };
    }

    // push() SEM valor não grava nada — serve só para inventar uma chave, e o app conta com
    // isso. Então só a forma com valor é barrada; a chave continua sendo gerada de verdade.
    if (typeof R.push === 'function') {
      const pushOriginal = R.push;
      R.push = function (valor, cb) {
        if (valor === undefined) return pushOriginal.call(this);
        anotar('push', caminhoDe(this));
        const novo = pushOriginal.call(this);
        if (typeof cb === 'function') { try { cb(null); } catch (e) {} }
        return novo;
      };
    }

    const OD = fb.database.OnDisconnect && fb.database.OnDisconnect.prototype;
    if (OD) ['set', 'update', 'remove', 'setWithPriority', 'cancel'].forEach((m) => {
      if (typeof OD[m] !== 'function') return;
      OD[m] = function () { anotar('onDisconnect.' + m, '(onDisconnect)'); return Promise.resolve(); };
    });

    R.__guardadoPeloSmoke = true;
    window.__GUARDA_OK__ = true;
    return true;
  };

  if (!embrulhar()) {
    const t = setInterval(() => { if (embrulhar()) clearInterval(t); }, 5);
    setTimeout(() => clearInterval(t), 60000);
  }

  // Caminho REST: qualquer método diferente de GET para o banco é barrado do mesmo jeito.
  const fetchOriginal = window.fetch;
  window.fetch = function (entrada, init) {
    try {
      const url = String(typeof entrada === 'string' ? entrada : (entrada && entrada.url) || '');
      const metodo = String((init && init.method) || (entrada && entrada.method) || 'GET').toUpperCase();
      if (/firebaseio\.com|firebasedatabase\.app/.test(url) && metodo !== 'GET') {
        anotar('fetch:' + metodo, url.split('?')[0]);
        return Promise.resolve(new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } }));
      }
    } catch (e) {}
    return fetchOriginal.apply(this, arguments);
  };

  const abrirXHR = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (metodo, url) {
    this.__smokeBarrado = /firebaseio\.com|firebasedatabase\.app/.test(String(url || '')) &&
      String(metodo || 'GET').toUpperCase() !== 'GET';
    if (this.__smokeBarrado) anotar('xhr:' + String(metodo).toUpperCase(), String(url).split('?')[0]);
    return abrirXHR.apply(this, arguments);
  };
  const enviarXHR = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function () {
    if (this.__smokeBarrado) return; // engolido: não sai do navegador
    return enviarXHR.apply(this, arguments);
  };
}

// ===================== PAPÉIS =====================
// As senhas fixas moram no HTML (só a Gestão e o plantão genérico). Todo o resto da equipe
// é cadastrado no banco, em daycare/config/monitores — é de lá que descobrimos as senhas de
// monitor, veterinária, recepção (consultora) e supervisão.

const SENHAS_FIXAS = {
  gestao: { senha: '0902', quem: 'Márcia · Gestora', origem: 'senha fixa no HTML' },
  diretoria: { senha: '1101', quem: 'Adriana · Gestão Total', origem: 'senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria)' },
  plantonista: { senha: '1001', quem: 'Plantonista', origem: 'senha fixa no HTML' }
};

// Quem "está no turno" quando a senha é de POSTO. O app pede este nome na porta de entrada
// desde 29/ago/2026 — posto não assina nada, pessoa assina.
const NOME_DE_QUEM_TESTA = 'Teste do Sistema';

// O papel no banco → o nome que a Adriana usa
const NOME_DO_PAPEL = {
  monitor: 'monitor', plantonista: 'plantonista', consultora: 'recepcao',
  gestao: 'gestao', diretoria: 'diretoria', vet: 'vet', supervisor: 'supervisao'
};

// ===================== FERRAMENTAS DE PÁGINA =====================

async function esperarBanco(page) {
  await page.waitForFunction(() => typeof DB !== 'undefined' && !!DB, null, { timeout: 45000 });
}

async function estabilizar(page) {
  const t0 = Date.now();
  await page.waitForLoadState('networkidle', { timeout: ESPERA_REDE_MS }).catch(() => {});
  await page.waitForTimeout(ESPERA_EXTRA_MS);
  return Date.now() - t0;
}

// O app às vezes abre um cartaz em tela cheia (zAlertao). Ele cobre o menu e travaria o
// clique seguinte. Some com o cartaz do mesmo jeito que o botão dele faz (remove o nó) —
// sem acionar o aoFechar, que poderia querer gravar.
async function dispensarCartazes(page) {
  return page.evaluate(() => {
    const vistos = [];
    ['zAlertaoBox', 'zEscolhaBox'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) { vistos.push((el.innerText || '').trim().slice(0, 90).replace(/\s+/g, ' ')); el.remove(); }
    });
    return vistos;
  });
}

// Abre TODAS as categorias e sub-cabeçalhos clicando nos pais (data-acc-toggle), como um
// humano faria. Repete até não sobrar nenhum fechado — os níveis são aninhados.
async function abrirTodoOMenu(page) {
  for (let volta = 0; volta < 8; volta++) {
    const fechados = await page.$$eval('#nav a.nav-parent[data-acc-toggle]', (as) => as
      .filter((a) => a.offsetParent !== null)
      .filter((a) => { const acc = a.closest('.acc'); return acc && !acc.classList.contains('acc-open'); })
      .map((a) => a.dataset.accToggle));
    if (!fechados.length) break;
    for (const k of fechados) {
      const el = await page.$('#nav a.nav-parent[data-acc-toggle="' + k + '"]');
      if (!el) continue;
      await el.click({ timeout: 4000 }).catch(() => {});
      await page.waitForTimeout(120);
    }
  }
  // As sub-sanfonas do Day Care (Turminhas / Atividades) não são .acc — abrem por classe.
  await page.$$eval('#dcSubnav .dcsub-head', (hs) => hs.forEach((h) => {
    const s = h.closest('.dcsub');
    if (s && !s.classList.contains('dcsub-open')) h.click();
  })).catch(() => {});
  await page.waitForTimeout(200);
}

// Ruído do ambiente: o teste roda em 127.0.0.1, e o App Check (reCAPTCHA) só reconhece o
// domínio de produção. Erro dele não é defeito do app — fica registrado, mas não reprova.
const RUIDO_DE_AMBIENTE = [
  /app-?check/i, /recaptcha/i, /favicon/i,
  /net::ERR_(BLOCKED|CERT|NAME_NOT_RESOLVED)/i,
  /Failed to load resource: the server responded with a status of 404/i
];
const ehRuido = (t) => RUIDO_DE_AMBIENTE.some((r) => r.test(t));

// ===================== MEDIÇÃO DE UMA TELA =====================

async function medirTela(page, idView) {
  return page.evaluate((id) => {
    const el = document.getElementById(id);
    if (!el) return { existe: false };
    const cs = getComputedStyle(el);
    const texto = (el.innerText || '').replace(/\u00a0/g, ' ').trim();
    const compacto = texto.replace(/\s+/g, ' ');
    return {
      existe: true,
      ativa: el.classList.contains('active'),
      visivel: cs.display !== 'none' && cs.visibility !== 'hidden',
      alturaPx: Math.round(el.scrollHeight),
      caracteres: texto.length,
      soCarregando: /^(carregando|carregando\.\.\.|aguarde)\.?$/i.test(compacto),
      temCarregando: /carregando/i.test(compacto),
      reconectando: /reconect|sem internet|não salvou no sistema|nao salvou no sistema/i.test(compacto),
      lixo: ['undefined', 'NaN', '[object Object]'].filter((s) => (
        s === 'NaN' ? /\bNaN\b/.test(compacto) :
        s === 'undefined' ? /\bundefined\b/.test(compacto) :
        compacto.indexOf(s) >= 0
      )),
      amostra: compacto.slice(0, 180)
    };
  }, idView);
}

// checkoutconf reaproveita a MESMA tela do check-out, em outro modo.
const idDaView = (v) => 'v-' + (v === 'checkoutconf' ? 'checkout' : v);

// ===================== VARREDURA DE UM PAPEL =====================

async function varrerPapel(navegador, base, papel, senha, quem, origem, aparelho) {
  const contexto = await navegador.newContext({ viewport: { width: 1440, height: 1800 } });
  const page = await contexto.newPage();
  await page.addInitScript(guardaDeEscrita);
  await page.addInitScript((id) => { try { localStorage.setItem('zeluz_device_id', id); } catch (e) {} }, aparelho);

  const errosSoltos = [];
  page.on('pageerror', (e) => errosSoltos.push({ tipo: 'pageerror', texto: String(e && e.message || e).slice(0, 240) }));
  page.on('console', (m) => { if (m.type() === 'error') errosSoltos.push({ tipo: 'console.error', texto: m.text().slice(0, 240) }); });

  const resultado = { papel, quem, senha, origem, entrou: false, motivo: '', telas: [], escritasNaCarga: [] };

  await page.goto(base + '/' + APP, { waitUntil: 'load' });
  await esperarBanco(page);
  await estabilizar(page);

  // ---- entrada pela porta da frente: senha + botão Entrar ----
  await page.evaluate(() => { window.__TELA_ATUAL__ = '(login)'; });
  await page.fill('#loginPwd', senha);
  await page.click('.login-btn');
  await page.waitForTimeout(1500);

  // Login de POSTO (ex.: "Plantonista") pergunta QUEM está usando antes de deixar entrar
  // (29/ago/2026). Aqui o teste responde como uma pessoa responderia: escreve o nome e
  // confirma. Sem isso, o papel plantonista não entraria e a varredura pararia nele.
  const pedeNome = await page.$('#loginPessoa');
  if (pedeNome) {
    await page.fill('#loginPessoa', NOME_DE_QUEM_TESTA);
    await page.click('#zCampoOk');
    await page.waitForTimeout(1200);
  }

  await estabilizar(page);
  await dispensarCartazes(page);

  const entrada = await page.evaluate(() => ({
    role: document.body.dataset.role || '',
    nome: (document.getElementById('whoName') || {}).textContent || '',
    login: getComputedStyle(document.getElementById('loginScreen')).display,
    erro: ((document.getElementById('loginErr') || {}).textContent || '').trim()
  }));

  if (!entrada.role || entrada.login !== 'none') {
    resultado.motivo = 'não entrou — ' + (entrada.erro || 'a tela de entrada continuou aberta');
    resultado.escritasNaCarga = await page.evaluate(() => window.__ESCRITAS__.slice());
    await contexto.close();
    return resultado;
  }
  resultado.entrou = true;
  resultado.papelNoApp = entrada.role;
  resultado.nomeNoApp = entrada.nome;
  resultado.escritasNaCarga = await page.evaluate(() => window.__ESCRITAS__.slice());

  await abrirTodoOMenu(page);
  await dispensarCartazes(page);

  // Itens do menu que este papel realmente enxerga. "sair" fica de fora: encerraria a sessão.
  const itens = await page.$$eval('#nav a[data-v]', (as) => as
    .filter((a) => a.offsetParent !== null)
    .map((a) => ({ v: a.dataset.v, rotulo: (a.innerText || '').trim().replace(/\s+/g, ' ') }))
    .filter((o) => o.v && o.v !== 'sair'));

  // As atividades do Day Care e as turminhas ficam num sub-menu próprio (data-a / data-d),
  // e todas caem na MESMA tela (v-daycare). É onde o bug de "abre vazia" mais aparece.
  const daycare = process.env.SMOKE_SEM_DAYCARE ? [] : await page.$$eval('#dcSubnav a', (as) => as
    .filter((a) => a.offsetParent !== null)
    .map((a) => ({
      chave: a.dataset.a ? ('atividade:' + a.dataset.a) : (a.dataset.d ? ('turminha:' + a.dataset.d) : ''),
      rotulo: (a.innerText || '').trim().replace(/\s+/g, ' '),
      sel: a.dataset.a ? ('#dcSubnav a[data-a="' + a.dataset.a + '"]') : (a.dataset.d ? ('#dcSubnav a[data-d="' + a.dataset.d + '"]') : '')
    }))
    .filter((o) => o.chave && o.sel));

  const paradas = itens.map((o) => ({ chave: o.v, rotulo: o.rotulo, sel: '#nav a[data-v="' + o.v + '"]', view: idDaView(o.v) }))
    .concat(daycare.map((o) => ({ chave: o.chave, rotulo: o.rotulo, sel: o.sel, view: 'v-daycare' })));

  for (const parada of paradas) {
    errosSoltos.length = 0;
    const marco = await page.evaluate((t) => { window.__TELA_ATUAL__ = t; return window.__ESCRITAS__.length; }, papel + '/' + parada.chave);

    let cliqueOk = true;
    let motivoClique = '';
    const t0 = Date.now();
    try {
      await page.click(parada.sel, { timeout: 8000 });
    } catch (e) {
      cliqueOk = false;
      motivoClique = String(e && e.message || e).split('\n')[0].slice(0, 160);
    }
    const msRede = await estabilizar(page);
    const ms = Date.now() - t0;
    const cartazes = await dispensarCartazes(page);

    const medida = cliqueOk ? await medirTela(page, parada.view) : { existe: false };
    const escritas = await page.evaluate((n) => window.__ESCRITAS__.slice(n), marco);
    const erros = errosSoltos.slice();
    const errosReais = erros.filter((e) => !ehRuido(e.texto));

    const falhas = [];
    if (!cliqueOk) falhas.push('não deu para clicar no item do menu: ' + motivoClique);
    else if (!medida.existe) falhas.push('a tela ' + parada.view + ' não existe no HTML');
    else {
      if (!medida.ativa) falhas.push('o item foi clicado e a tela não ficou ativa');
      if (!medida.visivel) falhas.push('a tela ficou ativa mas invisível (display/visibility)');
      if (medida.caracteres <= MIN_CARACTERES) falhas.push('tela vazia — só ' + medida.caracteres + ' caracteres de conteúdo');
      if (medida.soCarregando) falhas.push('a tela ficou só no "carregando"');
      if (medida.lixo.length) falhas.push('texto quebrado na tela: ' + medida.lixo.join(', '));
    }
    if (errosReais.length) falhas.push(errosReais.length + ' erro(s) de JavaScript: ' + errosReais[0].texto.slice(0, 120));

    if (falhas.length) {
      const arq = (papel + '-' + parada.chave).replace(/[^a-zA-Z0-9_-]+/g, '_') + '.png';
      try { await page.screenshot({ path: path.join(SAIDA_IMG, arq), fullPage: false }); parada.captura = arq; } catch (e) {}
    }

    resultado.telas.push({
      chave: parada.chave, rotulo: parada.rotulo, view: parada.view,
      ms, msRede, cliqueOk,
      alturaPx: medida.alturaPx || 0, caracteres: medida.caracteres || 0,
      ativa: !!medida.ativa, temCarregando: !!medida.temCarregando,
      reconectando: !!medida.reconectando,
      lixo: medida.lixo || [], amostra: medida.amostra || '',
      cartazes, escritas, erros, errosReais, falhas, captura: parada.captura || ''
    });
  }

  await contexto.close();
  return resultado;
}

// ===================== RELATÓRIO =====================

const esc = (s) => String(s == null ? '' : s).replace(/\|/g, '\\|').replace(/\n/g, ' ');

function montarRelatorio(dados) {
  const L = [];
  const agora = new Date().toLocaleString('pt-BR');
  L.push('# Smoke de navegador — o app aberto de verdade, tela por tela');
  L.push('');
  L.push('> Gerado por `tests/smoke-navegador.js` em ' + agora + '.');
  L.push('> Servidor: ' + dados.servidor + ' · arquivo medido: `' + APP + '` (do disco, nunca o GitHub Pages).');
  L.push('');
  L.push('## Por que este teste existe');
  L.push('');
  L.push('O `tests/harness.js` prova a lógica do app em caixa de areia — mas ele nunca abre a tela.');
  L.push('Um bug de **tela que abre vazia** passou quatro vezes por ele (a última corrigida no commit `d86a3dc`),');
  L.push('porque nenhuma prova de lógica enxerga um `<section>` em branco. Este teste entra com a senha de cada');
  L.push('papel, clica em cada item do menu e olha se apareceu alguma coisa.');
  L.push('');
  L.push('## O guarda de escrita — a prova de que nada foi gravado');
  L.push('');
  L.push('O app conversa com o Firebase **real**. Antes de o app carregar, um guarda embrulha');
  L.push('`set`, `update`, `push`, `remove`, `transaction`, `onDisconnect` e o `fetch`/`XHR` para o banco:');
  L.push('cada tentativa é anotada em `window.__ESCRITAS__` e **não é executada**.');
  L.push('');
  L.push('| Prova | Resultado |');
  L.push('|---|---|');
  L.push('| Guarda ativo antes do app rodar | ' + (dados.prova.guardaAtivo ? '**sim**' : '**NÃO**') + ' |');
  L.push('| Gravação forçada de mentira | `' + esc(dados.prova.caminho) + '` com `set(1)` |');
  L.push('| A tentativa foi capturada | ' + (dados.prova.capturada ? '**sim** — método `' + esc(dados.prova.metodo) + '`' : '**NÃO**') + ' |');
  L.push('| O nó existe no banco depois | ' + (dados.prova.existeNoBanco ? '**SIM — O GUARDA FALHOU**' : '**não** (leitura de volta veio vazia)') + ' |');
  L.push('');
  if (!dados.prova.guardaAtivo || dados.prova.existeNoBanco || !dados.prova.capturada) {
    L.push('> **ATENÇÃO: o guarda não passou na própria prova. Nada abaixo é confiável.**');
    L.push('');
  }
  L.push('Além disso, o teste **só navega**: clica em item de menu (`a[data-v]`), em categoria e em');
  L.push('sub-cabeçalho (`data-acc-toggle`) e nas abas do Day Care (`data-a`/`data-d`).');
  L.push('Nenhum botão de salvar, confirmar, avisar ou enviar foi tocado.');
  L.push('');
  L.push('## Como saber que este teste não é teatro');
  L.push('');
  L.push('Um teste que só dá "tudo certo" não vale nada enquanto ninguém provar que ele sabe reprovar.');
  L.push('Em 28/ago/2026 o teste foi rodado contra uma cópia do app com **dois defeitos plantados de propósito**:');
  L.push('a tela de Relatórios esvaziada e um `R$ NaN` na tela do Ritmo do Time.');
  L.push('Ele reprovou as duas, com captura de tela, e saiu com código 1:');
  L.push('');
  L.push('```');
  L.push('gestao › ritmo       tela vazia — só 25 caracteres · texto quebrado na tela: NaN');
  L.push('gestao › relatorios  tela vazia — só 0 caracteres');
  L.push('```');
  L.push('');
  L.push('Para repetir: suba um servidor que sirva o repositório trocando o `index.html` pela versão');
  L.push('com defeito e rode `SMOKE_BASE=http://127.0.0.1:8799 node tests/smoke-navegador.js`.');
  L.push('');
  L.push('### O que conta como falha');
  L.push('');
  L.push('| Regra | Reprova quando |');
  L.push('|---|---|');
  L.push('| Tela vazia | o `<section>` tem ' + MIN_CARACTERES + ' caracteres de texto ou menos |');
  L.push('| Tela que não abriu | o item foi clicado e o `<section>` não ficou `active`, ou ficou invisível |');
  L.push('| Presa no carregando | o único texto da tela é "carregando" |');
  L.push('| Texto quebrado | aparece `undefined`, `NaN` ou `[object Object]` na tela |');
  L.push('| Erro de JavaScript | qualquer `pageerror` ou `console.error` que não seja ruído do laboratório |');
  L.push('| Menu travado | não deu para clicar no item (algo cobrindo, item inerte) |');
  L.push('');
  L.push('Cada tela espera a rede aquietar (teto de ' + ESPERA_REDE_MS + ' ms) e só então mais ' +
    ESPERA_EXTRA_MS + ' ms — nunca um tempo fixo curto.');
  L.push('');

  // --- resumo ---
  L.push('## Resumo');
  L.push('');
  L.push('| Papel | Entrou como | Telas visitadas | Falhas | Escritas tentadas |');
  L.push('|---|---|---:|---:|---:|');
  for (const r of dados.papeis) {
    if (!r.entrou) { L.push('| `' + r.papel + '` | — | 0 | — | — |'); continue; }
    const falhas = r.telas.filter((t) => t.falhas.length).length;
    const escritas = r.telas.reduce((a, t) => a + t.escritas.length, 0) + r.escritasNaCarga.length;
    L.push('| `' + r.papel + '` | ' + esc(r.nomeNoApp) + ' (`' + r.papelNoApp + '`) | ' + r.telas.length + ' | ' +
      (falhas ? '**' + falhas + '**' : '0') + ' | ' + escritas + ' |');
  }
  L.push('');
  const renomeados = dados.papeis.filter((r) => r.entrou && r.papelNoApp !== r.papel);
  if (renomeados.length) {
    L.push('### O nome do papel e o que o app grava');
    L.push('');
    L.push('Em alguns casos o nome que a gente usa não é a palavra que o app guarda em `body[data-role]`:');
    L.push('');
    for (const r of renomeados) {
      L.push('- **`' + r.papel + '`** entra como `' + r.papelNoApp + '` — ' + esc(r.origem) + '.');
    }
    L.push('');
  }
  if (dados.pulados.length) {
    L.push('### Papéis pulados');
    L.push('');
    for (const p of dados.pulados) L.push('- **`' + p.papel + '`** — ' + p.motivo);
    L.push('');
  }

  // --- falhas ---
  const todasFalhas = [];
  for (const r of dados.papeis) for (const t of (r.telas || [])) if (t.falhas.length) todasFalhas.push({ papel: r.papel, t });
  L.push('## Falhas encontradas — ' + (todasFalhas.length || 'nenhuma'));
  L.push('');
  if (!todasFalhas.length) {
    L.push('Nenhuma tela abriu vazia, presa no "carregando", com texto quebrado ou com erro de JavaScript.');
    L.push('');
  } else {
    for (const f of todasFalhas) {
      L.push('### `' + f.papel + '` › `' + f.t.chave + '` — ' + esc(f.t.rotulo));
      L.push('');
      for (const m of f.t.falhas) L.push('- ' + esc(m));
      L.push('');
      L.push('| Evidência | Valor |');
      L.push('|---|---|');
      L.push('| Tela (`.view`) | `#' + f.t.view + '` |');
      L.push('| Ficou ativa | ' + (f.t.ativa ? 'sim' : 'não') + ' |');
      L.push('| Conteúdo | ' + f.t.caracteres + ' caracteres · ' + f.t.alturaPx + ' px de altura |');
      L.push('| Tempo até estabilizar | ' + f.t.ms + ' ms |');
      L.push('| O que apareceu na tela | ' + (f.t.amostra ? '`' + esc(f.t.amostra) + '`' : '_(nada)_') + ' |');
      if (f.t.errosReais.length) {
        f.t.errosReais.slice(0, 4).forEach((e, i) => L.push('| Erro ' + (i + 1) + ' (' + e.tipo + ') | `' + esc(e.texto) + '` |'));
      }
      if (f.t.captura) L.push('| Captura | `docs/auditoria-28ago2026/capturas-smoke/' + f.t.captura + '` |');
      L.push('');
    }
  }

  // --- escritas por tela ---
  L.push('## Telas que tentam GRAVAR só de abrir');
  L.push('');
  L.push('Informação, não falha: são gravações que aconteceriam no banco real só por alguém abrir a tela.');
  L.push('Todas foram barradas pelo guarda.');
  L.push('');
  const linhasEscrita = [];
  for (const r of dados.papeis) {
    if (r.escritasNaCarga.length) {
      const mapa = {};
      r.escritasNaCarga.forEach((e) => { const k = e.metodo + ' ' + e.caminho; mapa[k] = (mapa[k] || 0) + 1; });
      linhasEscrita.push('| `' + r.papel + '` | _(carga + entrada)_ | ' + r.escritasNaCarga.length + ' | ' +
        esc(Object.keys(mapa).slice(0, 4).join(' · ')) + ' |');
    }
    for (const t of (r.telas || [])) {
      if (!t.escritas.length) continue;
      const mapa = {};
      t.escritas.forEach((e) => { const k = e.metodo + ' ' + e.caminho; mapa[k] = (mapa[k] || 0) + 1; });
      linhasEscrita.push('| `' + r.papel + '` | `' + t.chave + '` | ' + t.escritas.length + ' | ' +
        esc(Object.keys(mapa).slice(0, 4).join(' · ')) + ' |');
    }
  }
  if (linhasEscrita.length) {
    L.push('| Papel | Tela | Tentativas | Caminhos |');
    L.push('|---|---|---:|---|');
    linhasEscrita.forEach((l) => L.push(l));
  } else {
    L.push('Nenhuma tela tentou gravar só por ter sido aberta.');
  }
  L.push('');
  L.push('**Como ler esta tabela.** Gravar ao abrir não é errado por si só — às vezes é uma regra do');
  L.push('negócio (marcar falta depois da hora, por exemplo). Mas duas coisas merecem atenção sempre:');
  L.push('');
  L.push('1. **Gravação na carga, antes de qualquer login** — vale para qualquer pessoa que só abra o');
  L.push('   endereço do app. Remendo antigo esquecido no código costuma morar aí.');
  L.push('2. **Regra que só acontece se alguém abrir a tela certa** — se ninguém abrir, a regra não roda.');
  L.push('   É a mesma armadilha do aviso de almoço, que só saía quando alguém abria o Empório.');
  L.push('');

  // --- tabela completa por papel ---
  L.push('## Tabela completa — papel × tela');
  L.push('');
  for (const r of dados.papeis) {
    L.push('### `' + r.papel + '` — ' + esc(r.quem) + ' (senha ' + r.senha + ', ' + esc(r.origem) + ')');
    L.push('');
    if (!r.entrou) { L.push('**Não entrou.** ' + esc(r.motivo)); L.push(''); continue; }
    L.push('Entrou como **' + esc(r.nomeNoApp) + '**, papel `' + r.papelNoApp + '`. ' + r.telas.length + ' tela(s) no menu dele.');
    L.push('');
    L.push('| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |');
    L.push('|---|---|---:|---:|---:|---:|---:|---|');
    for (const t of r.telas) {
      const sit = t.falhas.length ? '**FALHA**' : (t.reconectando ? 'aviso: banco reconectando' : (t.temCarregando ? 'ok (tem "carregando" na tela)' : 'ok'));
      L.push('| `' + t.chave + '` | ' + esc(t.rotulo) + ' | ' + t.ms + ' | ' + t.caracteres + ' | ' + t.alturaPx + ' | ' +
        t.errosReais.length + ' | ' + t.escritas.length + ' | ' + sit + ' |');
    }
    L.push('');
  }

  // --- ruído ---
  const ruido = {};
  for (const r of dados.papeis) for (const t of (r.telas || [])) for (const e of t.erros) {
    if (!ehRuido(e.texto)) continue;
    const k = e.texto.slice(0, 80);
    ruido[k] = (ruido[k] || 0) + 1;
  }
  const chavesRuido = Object.keys(ruido);
  if (chavesRuido.length) {
    L.push('## Ruído do ambiente (não reprova)');
    L.push('');
    L.push('O teste roda em `127.0.0.1`, e o App Check (reCAPTCHA) só reconhece o domínio de produção.');
    L.push('Estes erros são do laboratório, não do app:');
    L.push('');
    L.push('| Mensagem | Vezes |');
    L.push('|---|---:|');
    chavesRuido.slice(0, 12).forEach((k) => L.push('| `' + esc(k) + '` | ' + ruido[k] + ' |'));
    L.push('');
  }

  return L.join('\n') + '\n';
}

// ===================== PRINCIPAL =====================

(async () => {
  fs.mkdirSync(SAIDA_IMG, { recursive: true });
  fs.mkdirSync(path.dirname(SAIDA_MD), { recursive: true });

  const servidor = await garantirServidor();
  const base = servidor.base;
  console.log('Servidor: ' + servidor.como);

  const navegador = await chromium.launch({ headless: true });

  // ---- 1. Descoberta: senhas por papel, aparelho autorizado, e a prova do guarda ----
  const ctxDesc = await navegador.newContext({ viewport: { width: 1440, height: 1800 } });
  const pDesc = await ctxDesc.newPage();
  await pDesc.addInitScript(guardaDeEscrita);
  await pDesc.goto(base + '/' + APP, { waitUntil: 'load' });
  await esperarBanco(pDesc);
  await estabilizar(pDesc);

  const guardaAtivo = await pDesc.evaluate(() => window.__GUARDA_OK__ === true);
  const prova = await pDesc.evaluate(async () => {
    const antes = window.__ESCRITAS__.length;
    await DB.ref('daycare/_smoke').set(1);
    const capt = window.__ESCRITAS__.slice(antes).find((e) => e.caminho === 'daycare/_smoke') || null;
    const s = await DB.ref('daycare/_smoke').once('value');
    return { capturada: !!capt, metodo: capt ? capt.metodo : '', existeNoBanco: s.exists() };
  });
  prova.guardaAtivo = guardaAtivo;
  prova.caminho = 'daycare/_smoke';
  console.log('Guarda ativo: ' + guardaAtivo + ' · tentativa capturada: ' + prova.capturada +
    ' · nó existe no banco: ' + prova.existeNoBanco);

  const banco = await pDesc.evaluate(async () => {
    const out = { monitores: [], aparelhos: [] };
    try { const s = await DB.ref('daycare/config/monitores').once('value');
      out.monitores = (s.val() || []).filter(Boolean).map((m) => ({ nome: m.nome, role: m.role || 'monitor', senha: String(m.senha || '') })); } catch (e) { out.erroMon = e.message; }
    try { const s = await DB.ref('auaulandia/aparelhos').once('value');
      out.aparelhos = Object.keys(s.val() || {}); } catch (e) { out.erroAp = e.message; }
    return out;
  });
  await ctxDesc.close();

  if (!banco.aparelhos.length) {
    console.error('Nenhum aparelho autorizado no banco — o app barra qualquer entrada. Abortando.');
    await navegador.close(); servidor.parar(); process.exit(1);
  }
  // A trava por aparelho é real: sem um id autorizado, ninguém entra. Reaproveitar um id que
  // JÁ existe é leitura pura — não cria, não altera e não apaga nada no banco.
  const aparelho = banco.aparelhos.slice().sort()[0];

  // ---- 2. Monta a lista de papéis a testar ----
  const doBanco = {};
  for (const m of banco.monitores) {
    if (!m.senha) continue;
    const papel = NOME_DO_PAPEL[m.role];
    if (!papel || doBanco[papel]) continue;
    doBanco[papel] = { senha: m.senha, quem: m.nome, origem: 'cadastro do banco (daycare/config/monitores)' };
  }

  const ORDEM = ['monitor', 'plantonista', 'recepcao', 'vet', 'supervisao', 'gestao', 'diretoria'];
  const filtro = process.env.SMOKE_PAPEIS ? process.env.SMOKE_PAPEIS.split(',').map((s) => s.trim()) : null;

  const aTestar = [];
  const pulados = [];
  for (const papel of ORDEM) {
    if (filtro && filtro.indexOf(papel) < 0) continue;
    const achado = SENHAS_FIXAS[papel] || doBanco[papel];
    if (!achado) { pulados.push({ papel, motivo: 'nenhuma senha com este papel no HTML nem no cadastro do banco — não dá para entrar.' }); continue; }
    aTestar.push(Object.assign({ papel }, achado));
  }

  // ---- 3. Varredura ----
  const papeis = [];
  for (const alvo of aTestar) {
    process.stdout.write('→ ' + alvo.papel + ' (' + alvo.quem + ')… ');
    const r = await varrerPapel(navegador, base, alvo.papel, alvo.senha, alvo.quem, alvo.origem, aparelho);
    papeis.push(r);
    if (!r.entrou) console.log('NÃO ENTROU (' + r.motivo + ')');
    else console.log(r.telas.length + ' telas, ' + r.telas.filter((t) => t.falhas.length).length + ' falha(s)');
  }

  await navegador.close();
  servidor.parar();

  const dados = { servidor: servidor.como, prova, papeis, pulados };
  fs.writeFileSync(SAIDA_MD, montarRelatorio(dados), 'utf8');

  const totalFalhas = papeis.reduce((a, r) => a + (r.entrou ? r.telas.filter((t) => t.falhas.length).length : 1), 0);
  const totalTelas = papeis.reduce((a, r) => a + r.telas.length, 0);
  console.log('');
  console.log('Telas visitadas: ' + totalTelas + ' · falhas: ' + totalFalhas);
  console.log('Relatório: ' + SAIDA_MD);
  process.exit(totalFalhas || !prova.guardaAtivo || prova.existeNoBanco ? 1 : 0);
})().catch((e) => { console.error('FALHA NO TESTE:', e); process.exit(1); });
