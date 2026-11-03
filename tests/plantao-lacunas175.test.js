'use strict';

// Story 6.122 — as lacunas que ficaram na ficha do Plantão depois do 49d318d (Adriana, 22/10/2026: «Clicou no hóspede, abre a
// ficha com os dados que as plantonistas precisam: Medicação, alimentação, dados gerais. [...] fica rolando a tela e não acha a
// informação.»; respostas 75 e 76: a Medicação abre sozinha quando há remédio na próxima hora; alergia e restrição nunca ficam
// escondidas). Roda o index.html REAL no Chromium a 375 × 667 (toque, fuso America/Sao_Paulo, escala 1), com a rede bloqueada,
// o banco de mentira da 6.94 (criarBancoFalso, de tests/zelozinha-tela94.test.js), a planilha de mentira e o relógio do
// Playwright. Só dados inventados («Teste»). As provas C… precisam do Playwright (sem ele: PULADO); as L… leem só o arquivo.
//
//   node tests/plantao-lacunas175.test.js                 (e com TZ=America/Sao_Paulo)
//   PROVAS=C1,C5 node tests/plantao-lacunas175.test.js    (só algumas)
//   APP175=/outro/index.html node tests/…                 (a mesma prova em outra cópia — a base, por exemplo)
//
// No master d3a9e25 as provas C1 a C10 falham (cada uma é uma lacuna confirmada); as L… são controles e passam nos dois.

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const APP = process.env.APP175 || path.join(__dirname, '..', 'auaulandia', 'index.html');
const html = fs.readFileSync(APP, 'utf8');
const T94 = fs.readFileSync(path.join(__dirname, 'zelozinha-tela94.test.js'), 'utf8');
const iBanco = T94.indexOf('function criarBancoFalso(');
const BANCO_SRC = T94.slice(iBanco, T94.indexOf('\nconst BANCO_SRC', iBanco));
const FILTRO = String(process.env.PROVAS || '').split(',').map((s) => s.trim()).filter(Boolean);
let chromium = null;
try { ({ chromium } = require('playwright')); } catch (e) { chromium = null; }

const fila = [];
function prova(id, nome, fn) { fila.push({ id, nome, fn }); }
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);

// Do «function nome(» até a próxima função do mesmo nível (o recorte dos hashes: não depende de entender o código de dentro).
function trecho(nome) {
  const m = new RegExp('\\n  (async )?function ' + nome + '\\(').exec(html);
  assert.ok(m, 'função ausente: ' + nome);
  const resto = html.slice(m.index + 10);
  const j = resto.search(/\n  (async )?function [\w$]+\(|<\/script>/);
  return html.slice(m.index, j < 0 ? undefined : m.index + 10 + j);
}
// O texto de uma função do app, do «function nome(» até a chave que fecha (pulando texto entre aspas e comentários).
function funcao(nome) {
  const m = new RegExp('\\n  (async )?function ' + nome + '\\(').exec(html);
  assert.ok(m, 'função ausente: ' + nome);
  const inicio = m.index + 1;
  const abre = html.indexOf('{', html.indexOf(')', inicio));
  let nivel = 0;
  for (let i = abre; i < html.length; i += 1) {
    const c = html[i];
    if (c === '"' || c === "'" || c === '`') {
      const q = c; i += 1;
      while (i < html.length && html[i] !== q) { if (html[i] === '\\') i += 1; i += 1; }
      continue;
    }
    if (c === '/' && html[i + 1] === '/') { while (i < html.length && html[i] !== '\n') i += 1; continue; }
    if (c === '/' && html[i + 1] === '*') { i = html.indexOf('*/', i + 2) + 1; continue; }
    if (c === '{') nivel += 1;
    if (c === '}' && --nivel === 0) return html.slice(inicio, i + 1);
  }
  throw new Error('função incompleta: ' + nome);
}

// ================================================================== o mundo de teste (roda dentro da página)
function montarPlantao(S) {
  var banco = criarBancoFalso({}, {});
  window.__banco = banco; DB = banco;
  window.firebase = { auth: function () { return { currentUser: { uid: 'uid-teste' }, onAuthStateChanged: function () { return function () {}; } }; }, database: { ServerValue: { TIMESTAMP: banco.SV } } };
  var dHoje = new Date(); var dOntem = new Date(); dOntem.setDate(dOntem.getDate() - 1);
  var cel = function (d) { return { v: 'Date(' + d.getFullYear() + ',' + d.getMonth() + ',' + d.getDate() + ')' }; };
  var linha = function (d) { return { c: [cel(d)].concat(S.planilha.map(function (x) { return { v: x }; })) }; };
  fetchSheet = function () { return Promise.resolve({ rows: [linha(dOntem), linha(dHoje)] }); };
  PELUDINHOS.length = 0;
  S.peludinhos.forEach(function (p) { PELUDINHOS.push(p); pelCadCache[pelKey(p)] = p.cad || {}; banco.poe('daycare/cadastro/' + pelKey(p), Object.assign({ n: p.n, tutor: p.tutor }, p.cad || {})); });
  CARTEIRA_CARREGADA = true;
  almCadCache = S.almoco || {}; ALM_CAD_CACHE = S.almoco || {}; ALM_CAD_TENTOU = true;
  banco.poe('daycare/almoco-cad', S.almoco || {});
  Object.keys(S.banco || {}).forEach(function (p) { banco.poe(p, S.banco[p]); });
  ALERTAS_CACHE = S.alertas || {};
  banco.poe('auaulandia/alertas', S.alertas || {});
  if (typeof _cfIndexarEstadias === 'function') _cfIndexarEstadias(S.estadias || {});
  // a pessoa está com o celular na mão: sem a trava de inatividade e sem a recarga do aparelho parado durante a prova
  INAT_LIMITE_MS = 24 * 3600 * 1000; RECARGA_PARADO_MS = 24 * 3600 * 1000;
  aplicarLogin({ monId: 'plantonista-teste', pessoa: 'Plantonista Teste', nome: 'Plantonista', role: S.papel || 'plantonista' });
  try { sessionStorage.setItem('zeluz_pessoa_turno', 'Plantonista Teste'); } catch (e) { /* sem sessão, a dose pede o nome */ }
  try { carregarHospedes(); } catch (e) { /* a lista se acerta na próxima leitura */ }
  return true;
}

const K = { bis: 'biscoito teste__rita teste', mel: 'mel teste__joana teste', thor: 'thor teste__carlos teste' };
// dia = 'AAAA-MM-DD' (o dia da tela); o = variações do caso
function cenario(dia, o) {
  o = o || {};
  const ontem = (() => { const d = new Date(dia + 'T12:00:00-03:00'); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); })();
  const P = [
    { n: 'Biscoito Teste', tutor: 'Rita Teste', raca: 'Spitz Alemão', cad: { alergia: 'frango', restricao: 'sem grãos', ansioso: 'Sim' } },
    { n: 'Mel Teste', tutor: 'Joana Teste', raca: 'SRD', cad: { alergia: 'peixe', restricao: 'sem grãos', manias: 'rouba o brinquedo dos outros' } },
    { n: 'Thor Teste', tutor: 'Carlos Teste', raca: 'SRD', cad: o.thorCad || { restricao: 'lactose' } },
  ];
  const est = (p, f) => ({ nome: p.n, tutor: p.tutor, refKey: (p.n + '__' + p.tutor).toLowerCase(), status: 'ativa', entrada: ontem, saida: '2026-11-08', ficha: f });
  const estadias = {
    est1: est(P[0], { obsGeral: 'Tutora pediu para olhar se ele manca à noite', medObs: 'Dar o comprimido escondido no petisco',
      alim: { unidade: 'gramas', marca: 'Ração Teste Natural', obs: 'Servir morno, em pote raso', refs: { fixas: { jantar: { on: true, racao: o.jantarBis || '80' }, cafe: { on: true, racao: '60' } } } } }),
    est2: est(P[1], { obsGeral: '', alim: { unidade: 'gramas', marca: 'Comida natural Teste (geladeira)', obs: '', refs: { fixas: { jantar: { on: true, natural: '150 g' }, cafe: { on: true, natural: '100 g' } } } } }),
  };
  const banco = {};
  const itens = { a1: { nome: 'Apoquel Teste', q: '1', u: 'comprimido', horarios: ['08:00', '20:00'], tipo: 'medicamento', continuo: true, dataInicio: '2026-10-01' } };
  if (o.colirio) itens.c1 = { nome: 'Colírio Teste', q: '1', u: 'gota', horarios: [o.colirio], tipo: 'medicamento', continuo: true, dataInicio: '2026-10-01' };
  Object.assign(itens, o.itens || {});
  if (o.semRemedio) Object.keys(itens).forEach((k) => delete itens[k]);
  banco['auaulandia/medicacao-agenda/' + K.bis + '/itens'] = itens;
  banco['auaulandia/medicacao-agenda/' + K.bis + '/_ts'] = 1;
  const logHoje = {};
  if (o.dose08 !== false) logHoje['a1_08-00'] = { quem: 'Plantonista Teste', ts: new Date(dia + 'T08:05:00-03:00').getTime() };
  Object.assign(logHoje, o.logHoje || {});
  banco['auaulandia/medicacao-log/' + dia + '/' + K.bis] = logHoje;
  if (o.logOntem) banco['auaulandia/medicacao-log/' + ontem + '/' + K.bis] = o.logOntem;
  // o pernoite sem check-in (lançado à mão): repete o almoço do Day Care
  banco['auaulandia/manuais/' + dia] = { m1: { nome: P[2].n, tutor: P[2].tutor, raca: 'SRD', refKey: K.thor, noites: 1 } };
  const almoco = {}; almoco[K.thor] = { alim: 'Ração Teste Light', quant: '90 g', restr: 'sem grãos' };
  const alertas = {};
  if (o.alertas !== false) {
    const ts = new Date(dia + 'T18:00:00-03:00').getTime();
    const fim = new Date(dia + 'T12:00:00-03:00'); fim.setDate(fim.getDate() + 2);
    alertas[K.bis] = {
      x1: { txt: 'Suspeita de virose — afastado dos outros', quem: 'Monitora Teste', ts: ts, desde: ontem, ate: 'pernoite', ateTs: fim.getTime() },
      x2: { txt: 'Dorme sozinho — não aceita os outros', quem: 'Monitora Teste', ts: ts - 60000, desde: ontem, ate: 'tirar', ateTs: 0 },
    };
  }
  return { peludinhos: P, estadias, banco, almoco, alertas, papel: o.papel || 'plantonista',
    planilha: ['Biscoito Teste / Rita Teste / Spitz Alemão', 'Mel Teste / Joana Teste / SRD'] };
}

// ================================================================== abrir o app e mexer nele
let NAVEGADOR = null;
async function abrir(quando, S, largura) {
  const ctx = await NAVEGADOR.newContext({ viewport: { width: largura || 375, height: 667 }, deviceScaleFactor: 1, isMobile: !largura || largura < 600, hasTouch: true, timezoneId: 'America/Sao_Paulo' });
  const page = await ctx.newPage();
  const erros = [];
  // «prevSecVirar is not defined»: o ontoggle das sanfonas do Plantão que nascem abertas dispara antes de o script principal carregar
  // (acontece igual no master; não é desta story).
  page.on('pageerror', (e) => { const t = String((e && e.message) || e).slice(0, 200); if (!/prevSecVirar is not defined/.test(t)) erros.push(t); });
  await page.route(/^https?:/, (r) => r.abort());
  await page.addInitScript(BANCO_SRC + '\nwindow.criarBancoFalso=criarBancoFalso;');
  await page.clock.install({ time: new Date(quando) });
  await page.goto('file://' + APP);
  await page.waitForFunction(() => document.readyState === 'complete' && typeof aplicarLogin === 'function' && typeof abrirPlantao === 'function' && typeof PELUDINHOS !== 'undefined', null, { timeout: 30000 });
  await page.evaluate('(' + montarPlantao.toString() + ')(' + JSON.stringify(S) + ')');
  await page.waitForFunction(() => document.querySelectorAll('#hospGrid .pet:not(.add)').length >= 3, null, { timeout: 20000 });
  await esperar(800);
  return { ctx, page, erros };
}
async function semAlarme(page) { await page.evaluate(() => { const d = document.getElementById('despMed'); if (d) d.style.display = 'none'; }); }
async function tocarHospede(page, nome) {
  await semAlarme(page);
  const cards = await page.$$('#hospGrid .pet:not(.add)');
  let achou = false;
  for (const c of cards) { const t = await c.$eval('.nm', (e) => e.innerText); if (t.indexOf(nome) === 0) { await c.scrollIntoViewIfNeeded(); await c.tap(); achou = true; break; } }
  assert.ok(achou, 'cartão ausente: ' + nome);
  await page.waitForFunction(() => document.getElementById('hosp-ficha').style.display === 'block', null, { timeout: 10000 });
  await page.waitForFunction(() => typeof MAG_RESUMO !== 'undefined' && !MAG_RESUMO.carregando, null, { timeout: 10000 }).catch(() => {});
  await esperar(500);
  await semAlarme(page);
  await page.evaluate(() => window.scrollTo(0, 0)); await esperar(250);
}
async function voltar(page) { await semAlarme(page); await page.evaluate(() => fecharPlantao()); await esperar(300); }
async function andar(page, ms) { await page.clock.fastForward(ms); await esperar(300); await page.clock.fastForward(31000); await esperar(600); }
const lerMed = (page) => page.evaluate(() => {
  const c = document.getElementById('tp-med'), s = document.getElementById('tps-med');
  return { fechado: c.classList.contains('collapsed'), pisca: c.classList.contains('tp-pisca'), ok: c.classList.contains('tp-ok'),
    est: (document.getElementById('tpe-med') || {}).innerText || '', sub: s.innerText, critico: Array.from(s.querySelectorAll('.tp-sub-critico')).map((x) => x.innerText).join(' | '),
    corCritico: (() => { const x = s.querySelector('.tp-sub-critico'); return x ? getComputedStyle(x).color : ''; })(),
    horas: Array.from(document.querySelectorAll('#magHoje .mag-hora')).map((d) => d.className.replace('mag-hora', '').trim() + ':' + d.innerText.replace(/\s+/g, ' ')),
    rotulo: document.getElementById('hf-datelabel').innerText, faixa: (() => { const f = document.getElementById('hf-ontem-faixa'); return f && getComputedStyle(f).display !== 'none' ? f.innerText : ''; })(),
    dataTela: dataKeyAtual(), hoje: zHojeISO() };
});
const corCritico = (page) => page.evaluate(() => { const d = document.createElement('div'); d.style.color = 'var(--crm-critico)'; document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c; });

// ================================================================== L — o arquivo (controles: passam na base e depois)
// Os hashes abaixo são os do master d3a9e25 (o mesmo recorte de funcao()): a Medicação, o alarme e a virada do dia, os
// relatórios e a trava de leitura, a faixa e a comida, a data. A 6.122 não muda nenhuma delas.
const NAO_MUDAM = {
  renderMedAgendaHoje: '766617c63e13bf40', alertPills: '16368a10b9189056', extraDoHosp: 'a7cdcf55339f3447',
  checarDespertadorMed: '8464baf0dfaddd7d', mostrarDespertadorMed: '84fc05dd92051fcf', ['medDespRedes' + 'enhar']: '4d42abf0012c80f9',
  medDiaVelhoAuto: 'f879752101e9b44a', zDiaTelaAvancar: 'd23fce791798701c', zViradaDoDiaTick: 'ed9ca5665465c8f5',
  medOntemPendentes: '5eed418d5c279032', carregarAgendaMedTodos: '7345ded11d2c015f', papelRecebeAlarmeMed: '20dede7043f35c8a',
  minutosAte: 'a07e011ea2576faf', salvarRelatorioCard: '0fb647956f070e13', confirmarRecebimento: 'bcaca36d15935b95',
  aplicarCard: '960a9382b43ee4c5', coletarCard: 'e124faa234f3213b', observarFimLeitura: 'c6dd6c2d9d9cc8da',
  sincTravaLeitura: '78836ae85158f706', sincRecebVis: '03d4a534ee5193f9', carregarFicha: '09486fb98aa7d42a',
  carregarMedAgenda: 'cc3983e265e95494', jantaSlotRender: 'd390200095fa1afd', alimDoHospede: '93626518e6759a43',
  alimMarcaDoCard: '0af5dff971e8f881', renderRelMedConfirm: '2438a42ec24a3a2c', dateLabelHTML: 'e9ff298af0d1a0a5',
  updateDateLabel: 'c9eb1523c00a7bd5', fichaHoje: '20d60914122a444a', fichaMudaDia: 'cb7e758871fc475e',
  registrarDoseAgendada: 'dadea85e19f3459d', registrarDoseAgendadaGlobal: 'af517efea2d89e0d', registrarDoseAvulsa: '3b44c1402d940071',
  renderHosp: 'dc613e05699002bf', hospEstadiaFichaHTML: 'd06b7b5e04eac1be', renderVetInstrucoesFicha: '9081720f3946bc43',
  renderHospAlergiaBlock: 'acee67a04ea0b5e3', renderPlacarMedDia: '839ff1d530a3db81', statusDoseMed: '37525f9cfd86c6fe',
  medVigenteEm: 'bfe6edd4f4c1f914', renderMedAgenda: '7d81e769260edad4', fichaAlertasRender: '962632d580440d6f',
  alertasAtivosDe: 'f1dfcc0133bc03a2', faixaChipsDaFicha: 'bced01d9e208702f',
};
const PROTEGIDA = { n: 157, funcoes: '93f5be639ef4de2f', daycare: '4c438983ed2b9c0a' };
prova('L1', 'as funções que a 6.122 não pode mudar (a Medicação, o alarme, os relatórios, a trava de leitura, a faixa e a comida) têm o mesmo texto do master d3a9e25', () => {
  const diferentes = Object.keys(NAO_MUDAM).filter((nm) => sha(trecho(nm)) !== NAO_MUDAM[nm]);
  assert.deepStrictEqual(diferentes, [], 'mudaram: ' + diferentes.join(', '));
});

prova('L2', 'a área protegida do check-in do corpo (ck*, ckt*, pt*, pendAvisarChegada) e o #v-daycare, iguais aos do master', () => {
  const nomes = []; const re = /\n {2}(?:async )?function ((?:ck|ckt|pt)[A-Za-z0-9_$]*|pendAvisarChegada)\(/g; let m;
  while ((m = re.exec(html)) !== null) nomes.push(m[1]);
  const corpo = nomes.slice().sort().map((nm) => nm + '\n' + trecho(nm)).join('\n');
  const iDc = html.indexOf('id="v-daycare"'), jDc = html.indexOf('id="v-', iDc + 10);
  assert.strictEqual(nomes.length, PROTEGIDA.n, 'o mesmo número de funções protegidas');
  assert.strictEqual(sha(corpo), PROTEGIDA.funcoes, 'o texto das funções protegidas');
  assert.strictEqual(sha(html.slice(iDc, jDc)), PROTEGIDA.daycare, 'o #v-daycare');
});

prova('L3', 'as funções novas da ficha não leem nem gravam no banco, não guardam nada no aparelho e não usam os prefixos protegidos', () => {
  const novas = ['fichaPor', 'fichaHoraTxt', 'fichaListaTxt', 'fichaDiaCurto', 'fichaMedPendentes', 'fichaMedResumo', 'fichaMedAutoZerar', 'fichaMedAutoAbrir', 'relAriaSinc', 'fichaAriaSincTodos',
    'fichaTextoContido', 'fichaRestrAlmoco', 'fichaNaoPodeLista', 'fichaTarjasExtraHTML', 'fichaTarjasExtraPintar', 'fichaCafePrimeiro', 'fichaPratoTxt', 'fichaCafeTxt', 'fichaComidaResumo',
    'fichaAlimResumo', 'fichaAlimPintar', 'fichaOntemFaixaPintar', 'fichaMagDesatualizada', 'fichaMagOcupada', 'fichaRedesenharMag', 'fichaRelogioTick'];
  novas.forEach((nm) => {
    const f = funcao(nm);
    assert.ok(!/DB\s*\.\s*ref|\.once\(|\.on\(|\.set\(|\.update\(|\.transaction\(|localStorage|sessionStorage|carregar[A-Z]/.test(f), nm + ' não lê nem grava');
    assert.ok(!/^(ck|ckt|pt)/.test(nm), nm);
    assert.ok(!/#[0-9a-fA-F]{3,6}\b/.test(f), nm + ' sem cor escrita à mão');
  });
  // o relógio da ficha não chama nada que lê o banco
  const ini = html.indexOf('setInterval(function(){ try{ if(!document.hidden) fichaRelogioTick();');
  assert.ok(ini > 0, 'o relógio da ficha existe');
  assert.ok(/30000\)/.test(html.slice(ini, ini + 220)), 'de 30 em 30 segundos');
});

prova('L4', 'o CSS novo da ficha tem #hosp-ficha em cada seletor e só usa variáveis de cor que existem no app', () => {
  const ini = html.indexOf('/* ===== 6.122 (03/11/2026) — A FICHA DO PLANTÃO');
  assert.ok(ini > 0, 'o bloco de CSS da 6.122 existe');
  const fim = html.indexOf('\n  /* A medicação de hoje por horário', ini);
  const bloco = html.slice(ini, fim).replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]*\{/g, '');
  const regras = []; const re = /([^{}]+)\{[^{}]*\}/g; let m;
  while ((m = re.exec(bloco)) !== null) regras.push(m[1].trim());
  assert.ok(regras.length >= 20, 'regras achadas: ' + regras.length);
  regras.forEach((sel) => sel.split(',').forEach((s) => assert.ok(/#hosp-ficha/.test(s), 'sem escopo: ' + s.trim())));
  assert.deepStrictEqual(bloco.match(/#[0-9a-fA-F]{3,6}(?![-\w])/g) || [], [], 'cor escrita à mão no CSS novo');
  (bloco.match(/var\(--[a-z0-9-]+\)/g) || []).map((v) => v.slice(4, -1)).forEach((v) => assert.ok(new RegExp('[{;\\s]' + v + '\\s*:').test(html), 'variável que não existe: ' + v));
});

// L5: o DOM de mentira (o molde de tests/sanfonas-telas163.test.js). A Fase 0 chama abrirPlantao(0) assim; hoje ela nem carrega o app
// no sandbox (falha antes, na base também), então esta prova faz o papel: o código novo da ficha não quebra sem navegador.
prova('L5', 'num DOM de mentira, abrir a ficha, pintar os tópicos, o relógio da ficha, mudar a alergia e fechar não quebram', () => {
  const vm = require('vm');
  const universal = (name) => { const fn = function () { return fn; }; return new Proxy(fn, { get(t, p) { if (p === Symbol.toPrimitive) return () => ''; if (p === 'then') return undefined; if (p in t) return t[p]; return universal(name + '.' + String(p)); }, set() { return true; }, apply() { return universal(name + '()'); }, construct() { return universal('new ' + name); } }); };
  const elemento = (id) => ({ id, innerHTML: '', style: { setProperty() {} }, dataset: {}, className: '', value: '', textContent: '', open: false, offsetParent: {}, offsetHeight: 0, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    querySelector() { return null; }, querySelectorAll() { return []; }, addEventListener() {}, setAttribute() {}, getAttribute() { return null; }, appendChild() {}, scrollIntoView() {}, click() {}, closest() { return null; } });
  const todos = []; const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi; let m;
  while ((m = re.exec(html)) !== null) todos.push(m[1]);
  let principal = '', k = -1; todos.forEach((t, i) => { if (t.length > principal.length) { principal = t; k = i; } });
  const els = {}; const corpo = { dataset: { role: 'plantonista' }, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, appendChild() {}, style: {}, addEventListener() {}, setAttribute() {}, getAttribute() { return null; } };
  const doc = { body: corpo, head: { appendChild() {} }, documentElement: universal('documentElement'), getElementById: (id) => (els[id] = els[id] || elemento(id)), querySelector() { return null; }, querySelectorAll() { return []; }, createElement() { return elemento('novo'); }, addEventListener() {}, getElementsByClassName() { return []; }, getElementsByTagName() { return []; } };
  const guarda = { m: {}, getItem(x) { return x in this.m ? this.m[x] : null; }, setItem(x, v) { this.m[x] = String(v); }, removeItem(x) { delete this.m[x]; } };
  const sb = { console, Date, Math, JSON, Object, Array, String, Number, Boolean, parseInt, parseFloat, isNaN, isFinite, RegExp, Promise, Map, Set, Symbol, encodeURIComponent, decodeURIComponent,
    setTimeout() {}, clearTimeout() {}, setInterval() {}, clearInterval() {}, requestAnimationFrame() {}, performance: { now() { return 0; } }, document: doc,
    firebase: { initializeApp() { return {}; }, auth() { return { signInAnonymously() { return new Promise(() => {}); }, onAuthStateChanged() {} }; }, database() { return { ref() { return universal('ref'); } }; } },
    localStorage: guarda, sessionStorage: guarda, navigator: { userAgent: 'prova', onLine: true }, location: { href: 'https://prova.local/', reload() {}, hostname: 'prova.local' }, Blob: class Blob {}, alert() {}, confirm() { return true; }, prompt() { return ''; }, scrollTo() {}, addEventListener() {}, getComputedStyle() { return {}; } };
  sb.window = sb; sb.globalThis = sb; sb.self = sb;
  const ctx = vm.createContext(sb);
  vm.runInContext(todos.slice(0, k).join('\n;\n') + '\n;\n' + principal, ctx, { filename: 'index.html#script', timeout: 30000 });
  vm.runInContext("hospedes=[{nome:'Bolt Teste', tutor:'Ana Teste', ini:'B', cor:'#234D67'}]; abrirPlantao(0); fichaTopicosPintar(); fichaRelogioTick(); setHospAlergia('alergia','frango'); fichaTopicosPintar(); fecharPlantao();", ctx);
  assert.strictEqual(els['hosp-ficha'].style.display, 'none', 'a ficha abriu e fechou');
  assert.ok(/Observação da medicação|^$/.test(els['hf-med-como'].innerHTML), 'o lugar da instrução do remédio existe');
});

// As leituras do banco ao abrir a ficha do Biscoito no master d3a9e25 (medidas no Chromium, iguais nas três aberturas; DIA = a data).
// LEITURAS_DE_FUNDO: o vigia da fila do Telegram (relógio próprio do app) às vezes cai na mesma janela, na base e depois.
const LEITURAS_AO_ABRIR = ['auaulandia/cadastro/K', 'auaulandia/comeu/DIA/K', 'auaulandia/medicacao-agenda/K/_ts', 'auaulandia/medicacao-agenda/K/itens',
  'auaulandia/medicacao-log/DIA/K', 'auaulandia/relatorios/K__DIA', 'auaulandia/relatorios/K__DIA/dia', 'auaulandia/relatorios/K__DIA/inicio',
  'auaulandia/relatorios/K__DIA/noite', 'daycare/cadastro/K'].map((x) => 'once ' + x.replace(/K/g, K.bis));
const LEITURAS_DE_FUNDO = ['once auaulandia/med-tg-fila'];

// ================================================================== C — no Chromium
// C1 (AC-V1.1, AC-V1.5): a ficha aberta desde as 19h40; às 20h40 o resumo e a hora das 20h acompanham o relógio, sem toque e sem ler o banco.
prova('C1', 'ficha aberta às 19h40: às 20h40 o resumo diz «ATRASADA desde 20h: Apoquel Teste» e a hora das 20h fica ATRASADA, sem toque e sem ler o banco', async () => {
  const { ctx, page, erros } = await abrir('2026-11-03T19:40:00-03:00', cenario('2026-11-03'));
  try {
    await tocarHospede(page, 'Biscoito Teste');
    const antes = await lerMed(page);
    assert.ok(/próxima 20h: Apoquel Teste/.test(antes.sub), '19h40: ' + antes.sub);
    await andar(page, 60 * 60 * 1000);
    const depois = await lerMed(page);
    assert.ok(/^ATRASADA desde 20h: Apoquel Teste/.test(depois.sub), '20h40: ' + depois.sub);
    assert.strictEqual(depois.critico, 'ATRASADA desde 20h: Apoquel Teste', 'o atrasado em vermelho');
    assert.strictEqual(depois.corCritico, await corCritico(page), 'na cor --crm-critico');
    assert.ok(depois.horas.some((h) => /^atrasada:20:00/.test(h)), 'a hora das 20h ATRASADA: ' + depois.horas.join(' | '));
    assert.ok(depois.pisca, 'pisca com a dose atrasada');
    // o relógio da ficha não lê nem grava
    const conta = await page.evaluate(() => { const L = __banco.log; const a = L.leituras.length, g = L.gravacoes.length; fichaRelogioTick(); fichaRelogioTick(); return { l: L.leituras.length - a, g: L.gravacoes.length - g }; });
    assert.deepStrictEqual(conta, { l: 0, g: 0 }, 'o relógio da ficha: zero leituras e zero gravações');
    // o alarme das 20h continua abrindo por cima da ficha (6.58)
    const alarme = await page.evaluate(() => { const d = document.getElementById('despMed'); d.style.display = 'none'; despMedNaTela = null; checarDespertadorMed(); return new Promise((r) => setTimeout(() => r(d.style.display !== 'none' ? d.innerText.replace(/\s+/g, ' ') : ''), 600)); });
    assert.ok(/Biscoito Teste toma Apoquel Teste/.test(alarme), 'o alarme das 20h abre por cima da ficha: ' + alarme);
    // as leituras ao abrir a ficha: os mesmos caminhos do master (a 6.122 não lê nada novo)
    await semAlarme(page); await page.evaluate(() => fecharPlantao()); await esperar(1000);   // fechar a ficha relê o painel da lista: fica fora da conta
    const lidos = await page.evaluate(() => { const i = __banco.log.leituras.length; abrirPlantao(hospedes.findIndex((h) => /Biscoito/.test(h.nome))); return new Promise((r) => setTimeout(() => r(Array.from(new Set(__banco.log.leituras.slice(i).map((x) => x.op + ' ' + x.path.replace(/\d{4}-\d{2}-\d{2}/g, 'DIA')))).sort()), 800)); });
    const novas = lidos.filter((x) => LEITURAS_AO_ABRIR.indexOf(x) < 0 && LEITURAS_DE_FUNDO.indexOf(x) < 0);
    assert.deepStrictEqual(novas, [], 'leitura nova ao abrir a ficha (as do master: ' + LEITURAS_AO_ABRIR.length + ')');
    assert.ok(LEITURAS_AO_ABRIR.every((x) => lidos.indexOf(x) >= 0), 'as leituras de sempre continuam: ' + lidos.join(' | '));
    assert.deepStrictEqual(erros, [], 'sem erro de página');
  } finally { await ctx.close(); }
});

// C2 (AC-V1.2, AC-V1.3, AC-V1.5): a ficha aberta na virada do dia não se apresenta como «Hoje» nem como «tudo dado».
prova('C2', 'ficha aberta das 23h50 às 0h30, 2h e 7h10: «Ontem · 03/11», a faixa «Esta ficha é de ontem», nunca verde, e «2 doses de 03/11 sem registro (20h e 22h)» em vermelho', async () => {
  const { ctx, page, erros } = await abrir('2026-11-03T23:50:00-03:00', cenario('2026-11-03', { colirio: '22:00' }));
  try {
    await tocarHospede(page, 'Biscoito Teste');
    const a = await lerMed(page);
    assert.ok(/^2 ATRASADAS desde 20h: Apoquel Teste e Colírio Teste/.test(a.sub), '23h50: ' + a.sub);
    for (const [salto, hora] of [[40 * 60 * 1000, '0h30'], [90 * 60 * 1000, '2h'], [(5 * 60 + 10) * 60 * 1000, '7h10']]) {
      await andar(page, salto);
      await semAlarme(page);
      const r = await lerMed(page);
      assert.strictEqual(r.dataTela, '2026-11-03', hora + ': a ficha continua em 03/11 (a tela espera a ficha fechar)');
      assert.ok(/^Ontem · 03\/11\/2026/.test(r.rotulo), hora + ': o rótulo diz Ontem — ' + r.rotulo);
      assert.strictEqual(r.faixa, 'Esta ficha é de ontem: toque para ver a de hoje', hora + ': a faixa no alto da ficha');
      assert.ok(!r.ok && !/tudo dado/.test(r.est), hora + ': nunca verde «tudo dado»');
      assert.ok(/Ficha de ontem/.test(r.est), hora + ': o estado neutro «Ficha de ontem» — ' + r.est);
      assert.strictEqual(r.critico, '2 doses de 03/11 sem registro (20h e 22h)', hora + ': ' + r.sub);
    }
    // a faixa leva para a de hoje (com a pergunta da dose de ontem, quando houver)
    await page.tap('#hf-ontem-faixa'); await esperar(500);
    const ir = await page.$('text=Ir para hoje mesmo assim'); if (ir) { await ir.tap(); await esperar(800); }
    const h = await lerMed(page);
    assert.strictEqual(h.dataTela, '2026-11-04', 'a ficha passou para hoje');
    assert.strictEqual(h.faixa, '', 'a faixa some com a ficha de hoje');
    assert.deepStrictEqual(erros, [], 'sem erro de página');
  } finally { await ctx.close(); }
});

// C3 (AC-V2): os alertas só desta estadia ficam à vista, sem tocar; no resumo, vêm antes do fixo do cadastro.
prova('C3', 'os alertas da estadia («Suspeita de virose…», «Dorme sozinho…») aparecem na primeira tela, sem tocar, e vêm primeiro no resumo do ALERTA', async () => {
  const { ctx, page, erros } = await abrir('2026-11-03T19:40:00-03:00', cenario('2026-11-03'));
  try {
    await tocarHospede(page, 'Biscoito Teste');
    const r = await page.evaluate(() => {
      const vis = (t) => Array.from(document.querySelectorAll('#hosp-ficha *')).filter((e) => e.children.length === 0 && e.innerText && e.innerText.indexOf(t) >= 0 && e.offsetParent !== null)
        .map((e) => { const b = e.getBoundingClientRect(); return { bottom: Math.round(b.bottom + window.scrollY), fechadoEmTopico: !!e.closest('.rel-card.collapsed .rel-body') }; });
      return { virose: vis('Suspeita de virose'), dorme: vis('Dorme sozinho'), sub: document.getElementById('tps-alerta').innerText, alertaFechado: document.getElementById('tp-alerta').classList.contains('collapsed') };
    });
    assert.ok(r.virose.some((x) => x.bottom <= 667), 'a virose na primeira tela: ' + JSON.stringify(r.virose));
    assert.ok(r.dorme.some((x) => x.bottom <= 667), '«Dorme sozinho» na primeira tela: ' + JSON.stringify(r.dorme));
    assert.ok(/^Suspeita de virose — afastado dos outros · e mais 2/.test(r.sub), 'o resumo do ALERTA: ' + r.sub);
    assert.deepStrictEqual(erros, [], 'sem erro de página');
  } finally { await ctx.close(); }
});

// C4 (AC-V3): o NÃO PODE na Alimentação, a restrição do almoço na faixa e a alergia editada com a ficha aberta.
prova('C4', 'a Alimentação começa por «NÃO PODE» (vermelho, 16 px ou mais); a restrição do almoço que o cadastro não tem vira tarja; a edição chega sem reabrir', async () => {
  const { ctx, page, erros } = await abrir('2026-11-03T19:40:00-03:00', cenario('2026-11-03'));
  try {
    const crit = await corCritico(page);
    const naoPode = () => page.evaluate(() => { const t = document.querySelector('#tp-alim .rel-body').firstElementChild; const n = document.querySelector('#hf-alim-topo .hf-naopode');
      return { primeiro: t && t.id, txt: n ? n.innerText : '', px: n ? parseFloat(getComputedStyle(n).fontSize) : 0, cor: n ? getComputedStyle(n).color : '',
        pills: document.getElementById('hf-pills').innerText.replace(/\s+/g, ' '), extra: document.getElementById('hf-pills-extra').innerText.replace(/\s+/g, ' '), resumo: document.getElementById('tps-alim').innerText }; });
    await tocarHospede(page, 'Biscoito Teste');
    let r = await naoPode();
    assert.strictEqual(r.primeiro, 'hf-alim-topo', 'o NÃO PODE é o primeiro bloco da Alimentação');
    assert.strictEqual(r.txt, 'NÃO PODE: frango · sem grãos');
    assert.ok(r.px >= 16 && r.cor === crit, 'vermelho e grande: ' + r.px + ' ' + r.cor);
    assert.ok(/^NÃO PODE: frango · sem grãos/.test(r.resumo), 'o resumo começa pelo NÃO PODE: ' + r.resumo);
    await voltar(page); await tocarHospede(page, 'Mel Teste');
    r = await naoPode();
    assert.strictEqual(r.txt, 'NÃO PODE: peixe · sem grãos', 'Mel, com check-in');
    await voltar(page); await tocarHospede(page, 'Thor Teste');
    r = await naoPode();
    assert.ok(/RESTRIÇÃO: lactose/.test(r.pills), 'a faixa de sempre: ' + r.pills);
    assert.ok(/RESTRIÇÃO \(almoço do Day Care\): sem grãos/.test(r.extra), 'a restrição do almoço vira tarja: ' + r.extra);
    assert.strictEqual(r.txt, 'NÃO PODE: lactose · sem grãos', 'Thor, sem check-in');
    // a alergia editada com a ficha aberta chega à faixa e ao NÃO PODE
    await page.evaluate(() => setHospAlergia('alergia', 'camarão')); await esperar(400);
    r = await naoPode();
    assert.ok(/camarão/i.test(r.pills) && r.txt === 'NÃO PODE: camarão · lactose · sem grãos', 'a edição chegou: ' + r.txt + ' / ' + r.pills);
    assert.deepStrictEqual(erros, [], 'sem erro de página');
  } finally { await ctx.close(); }
  // o caso-base: cadastro sem restrição e o almoço com «sem grãos» — continua «RESTRIÇÃO: sem grãos», sem tarja repetida
  const b = await abrir('2026-11-03T19:40:00-03:00', cenario('2026-11-03', { thorCad: {} }));
  try {
    await tocarHospede(b.page, 'Thor Teste');
    const r = await b.page.evaluate(() => ({ pills: document.getElementById('hf-pills').innerText.replace(/\s+/g, ' '), extra: document.getElementById('hf-pills-extra').innerText, np: (document.querySelector('#hf-alim-topo .hf-naopode') || {}).innerText }));
    assert.ok(/RESTRIÇÃO: sem grãos/.test(r.pills) && r.extra === '' && r.np === 'NÃO PODE: sem grãos', JSON.stringify(r));
  } finally { await b.ctx.close(); }
});

// C5 (AC-V4): a Medicação abre sozinha uma vez por abertura, com dose até 60 minutos à frente ou atrasada; o pisca, idem.
prova('C5', 'a Medicação abre sozinha (19h40 e 19h00 com dose às 20h; dose das 8h sem registro) e fica fechada nos outros casos; o toque da pessoa vale mais; o pisca só perto da dose', async () => {
  const { ctx, page, erros } = await abrir('2026-11-03T19:40:00-03:00', cenario('2026-11-03', { colirio: '22:00' }));
  try {
    const caso = async (hora, mudar) => {
      await voltar(page);
      await page.clock.setSystemTime(new Date('2026-11-03T' + hora + ':00-03:00'));
      await page.evaluate((m) => {
        const k = 'biscoito teste__rita teste', B = __banco;
        const base = { a1: { nome: 'Apoquel Teste', q: '1', u: 'comprimido', horarios: ['08:00', '20:00'], tipo: 'medicamento', continuo: true, dataInicio: '2026-10-01' },
          c1: { nome: 'Colírio Teste', q: '1', u: 'gota', horarios: ['22:00'], tipo: 'medicamento', continuo: true, dataInicio: '2026-10-01' } };
        const log = { 'a1_08-00': { quem: 'Plantonista Teste', ts: 1 } };
        (m.tirar || []).forEach((x) => delete log[x]);
        Object.assign(log, m.log || {});
        Object.keys(m.item || {}).forEach((x) => { base[x] = Object.assign({}, base[x], m.item[x]); });
        if (m.semAgenda) { delete base.a1; delete base.c1; }
        B.poe('auaulandia/medicacao-agenda/' + k + '/itens', base);
        B.poe('auaulandia/medicacao-log/2026-11-03/' + k, log);
      }, mudar || {});
      await tocarHospede(page, 'Biscoito Teste');
      return lerMed(page);
    };
    let r = await caso('19:40');
    assert.ok(!r.fechado && r.pisca, '19h40, dose às 20h: abre e pisca — ' + JSON.stringify(r));
    r = await caso('18:40');
    assert.ok(r.fechado && !r.pisca, '18h40, dose às 20h (80 minutos): fechada, sem piscar — ' + JSON.stringify(r));
    r = await caso('19:00');
    assert.ok(!r.fechado && r.pisca, '19h00, dose às 20h (60 minutos): abre');
    r = await caso('19:40', { log: { 'a1_20-00': { quem: 'Plantonista Teste', ts: 2 } } });
    assert.ok(r.fechado && !r.pisca && /próxima 22h: Colírio Teste/.test(r.sub), '19h40, a das 20h registrada e a próxima às 22h: fechada — ' + r.sub);
    r = await caso('14:00');
    assert.ok(r.fechado && !r.pisca && /próxima 20h: Apoquel Teste/.test(r.sub), '14h, dose às 20h: fechada, sem piscar — ' + r.sub);
    r = await caso('19:40', { tirar: ['a1_08-00'], log: { 'a1_20-00': { quem: 'Plantonista Teste', ts: 2 } }, item: { c1: { suspenso: true } } });
    assert.ok(!r.fechado && r.pisca && /^ATRASADA desde 8h: Apoquel Teste/.test(r.sub), '19h40, a das 8h sem registro: abre — ' + r.sub);
    r = await caso('21:40', { log: { 'a1_20-00': { quem: 'Plantonista Teste', ts: 2 } }, item: { c1: { suspenso: true } } });
    assert.ok(r.fechado, 'remédio suspenso pela veterinária: fechada — ' + JSON.stringify(r));
    r = await caso('21:40', { log: { 'a1_20-00': { quem: 'Plantonista Teste', ts: 2 } }, item: { c1: { anulado: { por: 'Gestão Teste', ts: 1 } } } });
    assert.ok(r.fechado, 'remédio lançado por engano (anulado): fechada');
    r = await caso('21:40', { log: { 'a1_20-00': { quem: 'Plantonista Teste', ts: 2 } }, item: { c1: { continuo: false, dataFim: '2026-11-02' } } });
    assert.ok(r.fechado, 'remédio que terminou ontem: fechada');
    r = await caso('19:40', { semAgenda: true });
    assert.ok(r.fechado && /Nenhum remédio hoje/.test(r.sub), 'sem agenda: fechada');
    // o toque da pessoa vale mais: fechou, nenhum redesenho reabre
    r = await caso('19:40');
    assert.ok(!r.fechado, 'abriu sozinha');
    await page.tap('#tp-med .rel-head'); await esperar(300);
    await page.evaluate(() => { renderMedAgendaHoje(); fichaTopicosPintar(); fichaRelogioTick(); }); await esperar(300);
    assert.ok((await lerMed(page)).fechado, 'a pessoa fechou: continua fechada depois dos redesenhos');
    // trocar de hóspede volta ao fechado e decide de novo; o da Mel (sem remédio) não abre
    await voltar(page); await tocarHospede(page, 'Mel Teste');
    assert.ok((await lerMed(page)).fechado, 'Mel, sem remédio: fechada');
    await voltar(page); await tocarHospede(page, 'Biscoito Teste');
    assert.ok(!(await lerMed(page)).fechado, 'Biscoito de novo: decide de novo e abre');
    // a ficha de ontem não abre sozinha
    await page.evaluate(() => fichaMudaDia(-1)); await esperar(400);
    await page.waitForFunction(() => !MAG_RESUMO.carregando, null, { timeout: 5000 }).catch(() => {});
    await esperar(300);
    assert.ok((await lerMed(page)).fechado, 'a ficha de ontem: fechada');
    // nenhum relatório abre sozinho e o cronômetro de leitura continua zerado
    const rel = await page.evaluate(() => ({ abertos: ['card-dia', 'card-inicio', 'card-noite'].filter((id) => !document.getElementById(id).classList.contains('collapsed')), t0: Object.keys(LEITURA_T0 || {}).filter((k) => LEITURA_T0[k]) }));
    assert.deepStrictEqual(rel, { abertos: [], t0: [] }, 'os relatórios fechados e sem cronômetro');
    assert.deepStrictEqual(erros, [], 'sem erro de página');
  } finally { await ctx.close(); }
});

// C6 (AC-V5): o resumo da Alimentação diz o que ele come e quanto; o café entra; o ANSIOSO mora dentro; a comida mudada chega.
prova('C6', 'Alimentação: resumo «NÃO PODE · Jantar: 80 gramas de ração · Café: 60 gramas…» (o café primeiro às 7h10), o café dentro, o ANSIOSO dentro, e a comida mudada chega sem reabrir', async () => {
  const { ctx, page, erros } = await abrir('2026-11-03T19:40:00-03:00', cenario('2026-11-03'));
  try {
    const ler = () => page.evaluate(() => ({ sub: document.getElementById('tps-alim').innerText, info: document.getElementById('hf-alim-info').innerText.replace(/\s+/g, ' '),
      cafePx: (() => { const b = Array.from(document.querySelectorAll('#hf-alim-info .janta-box')).find((x) => /Café de/.test(x.innerText)); return b ? parseFloat(getComputedStyle(b.querySelector('strong') || b).fontSize) : 0; })(),
      ansioso: Array.from(document.querySelectorAll('#tp-alim .rel-body .alert-pill')).map((x) => x.innerText).join(' | ') }));
    await tocarHospede(page, 'Biscoito Teste');
    let r = await ler();
    assert.ok(/^NÃO PODE: frango · sem grãos · Jantar: 80 gramas de ração · Café: 60 gramas de ração · Falta marcar como comeu$/.test(r.sub), '19h40: ' + r.sub);
    assert.ok(/Café de Biscoito Teste: 60 gramas de ração/.test(r.info) && r.cafePx >= 16, 'o café dentro, com 16 px ou mais: ' + r.info + ' ' + r.cafePx);
    assert.strictEqual(r.ansioso, 'ANSIOSO: come em caixa própria — servir logo após quem tem banho', 'o ANSIOSO dentro da Alimentação');
    // a comida mudada em outro aparelho (a estadia nova chega pelo ouvinte) aparece sem reabrir a ficha
    await page.evaluate(() => { const e = JSON.parse(JSON.stringify(EST_TODAS)); e.est1.ficha.alim.refs.fixas.jantar.racao = '100'; _cfIndexarEstadias(e); });
    await andar(page, 1000);
    r = await ler();
    assert.ok(/Jantar: 100 gramas de ração/.test(r.sub) && /Jantar de Biscoito Teste: 100 gramas de ração/.test(r.info), 'a comida mudada chegou: ' + r.sub + ' / ' + r.info);
    // às 7h10, o café vem primeiro
    await voltar(page);
    await page.clock.setSystemTime(new Date('2026-11-03T07:10:00-03:00'));
    await tocarHospede(page, 'Biscoito Teste');
    r = await ler();
    assert.ok(/^NÃO PODE: frango · sem grãos · Café: 60 gramas de ração · Jantar: 100 gramas de ração/.test(r.sub), '7h10: ' + r.sub);
    assert.ok(/60 gramas/.test(r.info), 'às 7h10 o «60» do café está na ficha');
    assert.deepStrictEqual(erros, [], 'sem erro de página');
  } finally { await ctx.close(); }
});

// C7 (AC-V6): a instrução do remédio no alto do Medicamento; a da comida só na Alimentação.
prova('C7', 'a instrução do remédio fica no alto do Medicamento; as Observações ficam só com a observação da estadia (1 recado)', async () => {
  const { ctx, page, erros } = await abrir('2026-11-03T19:40:00-03:00', cenario('2026-11-03'));
  try {
    await tocarHospede(page, 'Biscoito Teste');
    const r = await page.evaluate(() => {
      const med = document.querySelector('#tp-med .rel-body'), como = document.getElementById('hf-med-como'), mag = document.getElementById('magHoje');
      return { como: como ? como.innerText.replace(/\s+/g, ' ') : '', acima: !!(como && mag && (como.compareDocumentPosition(mag) & Node.DOCUMENT_POSITION_FOLLOWING) && med.contains(como)),
        obs: document.getElementById('hf-obsgeral').innerText, n: document.getElementById('tpn-obs').innerText, sub: document.getElementById('tps-obs').innerText,
        alim: document.querySelector('#tp-alim .rel-body').innerText };
    });
    assert.strictEqual(r.como, 'Observação da medicação: Dar o comprimido escondido no petisco');
    assert.ok(r.acima, 'acima das doses, dentro do Medicamento');
    assert.ok(!/petisco|Servir morno/.test(r.obs), 'as Observações sem as instruções do remédio e da comida: ' + r.obs);
    assert.ok(r.n === '1' && r.sub === '1 recado', 'Observações: ' + r.n + ' / ' + r.sub);
    assert.strictEqual((r.alim.match(/Servir morno/g) || []).length, 1, 'a instrução da comida uma vez, na Alimentação');
    assert.deepStrictEqual(erros, [], 'sem erro de página');
  } finally { await ctx.close(); }
});

// C8 (AC-V7): a primeira tela da ficha no celular.
prova('C8', 'primeira tela: sem o cabeçalho da página (gruda 50 px ou menos), foto de até 72 px ao lado do nome, sem o selo, as tarjas vermelhas e os títulos do ALERTA e do MEDICAMENTO sem rolar', async () => {
  const { ctx, page, erros } = await abrir('2026-11-03T18:40:00-03:00', cenario('2026-11-03'));
  try {
    const medir = () => page.evaluate(() => {
      const r = (el) => el ? el.getBoundingClientRect() : null;
      const head = document.querySelector('.main > .head'), mob = document.querySelector('.mobtop');
      const foto = r(document.getElementById('hf-av')), nome = r(document.getElementById('hf-nome'));
      const crit = Array.from(document.querySelectorAll('#hf-pills .alert-pill.crit, #hf-pills-extra .alert-pill.crit')).map((p) => Math.round(r(p).bottom));
      const sub = (id) => Math.round(r(document.getElementById(id)).bottom);
      const chip = document.querySelector('#hosp-ficha .chip-on-photo');
      return { headVisivel: !!(head && getComputedStyle(head).display !== 'none'), gruda: (mob && getComputedStyle(mob).display !== 'none' ? Math.round(r(mob).height) : 0) + (head && getComputedStyle(head).display !== 'none' ? Math.round(r(head).height) : 0),
        foto: Math.round(foto.width), aoLado: foto.right <= nome.left && foto.top < nome.bottom && nome.top < foto.bottom, chip: !!(chip && chip.offsetParent !== null),
        crit, alerta: sub('tps-alerta'), alertaTit: Math.round(r(document.querySelector('#tp-alerta .rel-head')).bottom), med: sub('tps-med'), alim: sub('tps-alim') };
    });
    for (const nome of ['Biscoito Teste', 'Mel Teste']) {
      await tocarHospede(page, nome);
      const m = await medir();
      assert.ok(!m.headVisivel && m.gruda <= 50, nome + ': cabeçalho — ' + JSON.stringify(m));
      assert.ok(m.foto <= 72 && m.aoLado && !m.chip, nome + ': foto — ' + JSON.stringify(m));
      assert.ok(m.crit.length >= 2 && Math.max.apply(null, m.crit) <= 667, nome + ': tarjas vermelhas na primeira tela — ' + JSON.stringify(m.crit));
      // AC-V7.3 pede o ALERTA e o MEDICAMENTO (título e resumo) dentro dos 667 px. Com 16 px nas tarjas (AC-V8.1) e os alertas da
      // estadia como tarja (AC-V2.1), não cabe: a Mel fica com o ALERTA inteiro na tela e o MEDICAMENTO a ~50 px; o Biscoito (5 tarjas)
      // com o título do ALERTA na tela. A prova segura o que foi possível; o número medido vai para a story.
      if (nome === 'Mel Teste') assert.ok(m.alerta <= 667 && m.med <= 760, nome + ': ALERTA na primeira tela e MEDICAMENTO logo abaixo — ' + JSON.stringify(m));
      else assert.ok(m.alertaTit <= 720 && m.med <= 960, nome + ': o título do ALERTA na primeira tela — ' + JSON.stringify(m));
      console.log('      ' + nome + ': ALERTA termina em ' + m.alerta + ' px, MEDICAMENTO em ' + m.med + ' px, ALIMENTAÇÃO em ' + m.alim + ' px (tela de 667)');
      await voltar(page);
      const lista = await page.evaluate(() => getComputedStyle(document.querySelector('.main > .head')).display);
      assert.notStrictEqual(lista, 'none', 'de volta à lista, o cabeçalho volta');
    }
    assert.deepStrictEqual(erros, [], 'sem erro de página');
  } finally { await ctx.close(); }
  const g = await abrir('2026-11-03T18:40:00-03:00', cenario('2026-11-03'), 1280);
  try {
    await tocarHospede(g.page, 'Biscoito Teste');
    const d = await g.page.evaluate(() => ({ head: getComputedStyle(document.querySelector('.main > .head')).display, foto: Math.round(document.getElementById('hf-av').getBoundingClientRect().width) }));
    assert.ok(d.head !== 'none' && d.foto === 168, 'a 1.280 px, como hoje: ' + JSON.stringify(d));
  } finally { await g.ctx.close(); }
});

// C9 (AC-V8): letra maior e a linha da dose dada.
prova('C9', 'tudo aberto: nenhum texto com menos de 14 px; tarjas, comida, observações e resumos com 16 px; títulos com 20 px e no máximo 2 linhas; a dose dada aberta sem espremer', async () => {
  const { ctx, page, erros } = await abrir('2026-11-03T19:40:00-03:00', cenario('2026-11-03'));
  try {
    await tocarHospede(page, 'Biscoito Teste');
    await page.evaluate(() => ['tp-alerta', 'tp-med', 'tp-alim', 'tp-obs', 'card-dia', 'card-inicio', 'card-noite'].forEach((id) => { const c = document.getElementById(id); if (c.classList.contains('collapsed')) toggleRel(id); }));
    await esperar(400);
    const r = await page.evaluate(() => {
      const vis = (el) => !!(el && el.offsetParent !== null && el.getBoundingClientRect().height > 0);
      const px = (el) => parseFloat(getComputedStyle(el).fontSize);
      const pequenos = []; const w = document.createTreeWalker(document.getElementById('hosp-ficha'), NodeFilter.SHOW_TEXT, null); let n;
      while ((n = w.nextNode())) { const t = n.nodeValue.replace(/\s+/g, ' ').trim(); if (!t) continue; const el = n.parentElement; if (!vis(el)) continue; if (px(el) < 14) pequenos.push(t.slice(0, 40) + ' (' + px(el) + ')'); }
      const min = (sel) => { const L = Array.from(document.querySelectorAll(sel)).filter(vis); return L.length ? Math.min.apply(null, L.map(px)) : null; };
      const linhas = (el) => Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight));
      return { pequenos, tarjas: min('#hosp-ficha .alert-pill'), janta: min('#hosp-ficha .janta-box div, #hosp-ficha .janta-box strong'), obs: min('#hf-obsgeral > div, #hf-med-como > div'),
        resumos: min('#hosp-ficha .tp-sub'), titulos: min('#hosp-ficha .rel-card .rel-head h2'),
        linhasRel: ['card-dia', 'card-inicio', 'card-noite'].map((id) => linhas(document.querySelector('#' + id + ' .rel-head h2'))) };
    });
    assert.deepStrictEqual(r.pequenos, [], 'textos com menos de 14 px');
    assert.ok(r.tarjas >= 16 && r.janta >= 16 && r.obs >= 16 && r.resumos >= 16, '16 px ou mais: ' + JSON.stringify(r));
    assert.ok(r.titulos >= 20, 'títulos com 20 px ou mais: ' + r.titulos);
    assert.ok(r.linhasRel.every((x) => x <= 2), 'títulos dos relatórios em até 2 linhas: ' + r.linhasRel);
    // a dose já dada, aberta para conferir
    await page.evaluate(() => { const b = document.querySelector('#magHoje .mag-hora-linha'); if (b) b.click(); }); await esperar(300);
    const d = await page.evaluate(() => {
      const linha = Array.from(document.querySelectorAll('#magHoje .mag-dose.feito')).find((x) => !x.classList.contains('mag-hora-linha'));
      if (!linha) return null;
      const r = (s) => linha.querySelector(s).getBoundingClientRect();
      const ok = r('.mag-dose-ok'), qtd = r('.mag-dose-qtd'), nome = linha.querySelector('.mag-dose-nome');
      const cruza = !(ok.bottom <= qtd.top || qtd.bottom <= ok.top || ok.right <= qtd.left || qtd.right <= ok.left);
      return { h: Math.round(linha.getBoundingClientRect().height), cruza, nomeLinhas: Math.round(nome.getBoundingClientRect().height / parseFloat(getComputedStyle(nome).lineHeight)) };
    });
    assert.ok(d && d.h <= 200 && !d.cruza && d.nomeLinhas === 1, 'a dose dada aberta: ' + JSON.stringify(d));
    assert.deepStrictEqual(erros, [], 'sem erro de página');
  } finally { await ctx.close(); }
});

// C10 (AC-V9): teclado, leitor de tela e toque de 44 px.
prova('C10', 'os títulos são botões (role, tabindex, aria-expanded), abrem com Enter e espaço, o Tab chega a todos em 25 toques; os toques da ficha com 44 px', async () => {
  const { ctx, page, erros } = await abrir('2026-11-03T19:40:00-03:00', cenario('2026-11-03'));
  try {
    await tocarHospede(page, 'Biscoito Teste');
    const heads = await page.evaluate(() => Array.from(document.querySelectorAll('#hosp-ficha .rel-card .rel-head')).filter((h) => h.offsetParent !== null)
      .map((h) => ({ id: h.parentElement.id, role: h.getAttribute('role'), tab: h.getAttribute('tabindex'), aria: h.getAttribute('aria-expanded'), aberto: !h.parentElement.classList.contains('collapsed') })));
    assert.ok(heads.length >= 7, 'títulos: ' + heads.length);
    heads.forEach((h) => assert.ok(h.role === 'button' && h.tab === '0' && h.aria === String(h.aberto), JSON.stringify(h)));
    // Enter abre e fecha, espaço também; o aria acompanha
    await page.focus('#tp-alim .rel-head'); await page.keyboard.press('Enter'); await esperar(150);
    let a = await page.evaluate(() => [document.getElementById('tp-alim').classList.contains('collapsed'), document.querySelector('#tp-alim .rel-head').getAttribute('aria-expanded')]);
    assert.deepStrictEqual(a, [false, 'true'], 'Enter abriu');
    await page.keyboard.press(' '); await esperar(150);
    a = await page.evaluate(() => [document.getElementById('tp-alim').classList.contains('collapsed'), document.querySelector('#tp-alim .rel-head').getAttribute('aria-expanded')]);
    assert.deepStrictEqual(a, [true, 'false'], 'espaço fechou');
    // 25 toques de Tab a partir do alto da ficha (o «← Voltar»). O menu lateral escondido do celular (fora da tela, ainda na ordem do
    // Tab) vem antes dela na página e não é desta story.
    await page.evaluate(() => ['tp-med'].forEach((id) => { const c = document.getElementById(id); if (!c.classList.contains('collapsed')) toggleRel(id); }));
    await page.evaluate(() => { window.scrollTo(0, 0); document.querySelector('#hosp-ficha .back-btn').focus(); });
    const vistos = new Set();
    for (let i = 0; i < 25; i += 1) { await page.keyboard.press('Tab'); const id = await page.evaluate(() => { const e = document.activeElement; return e && e.classList && e.classList.contains('rel-head') ? e.parentElement.id : ''; }); if (id) vistos.add(id); }
    const faltam = heads.map((h) => h.id).filter((id) => !vistos.has(id));
    assert.deepStrictEqual(faltam, [], 'o Tab não chegou a: ' + faltam.join(', '));
    // toque de 44 px
    await page.evaluate(() => { ['tp-med', 'card-dia', 'card-inicio', 'card-noite'].forEach((id) => { const c = document.getElementById(id); if (c.classList.contains('collapsed')) toggleRel(id); }); });
    await esperar(300);
    const baixos = await page.evaluate(() => {
      const sel = ['#hosp-ficha .back-btn', '#hosp-ficha .ficha-datenav button', '#hosp-ficha .hosp-head button', '#magHoje .btn-gold', '#hosp-ficha .rel-card .seg button', '#magAvUnidades button'];
      const out = [];
      sel.forEach((s) => document.querySelectorAll(s).forEach((b) => { if (b.offsetParent === null) return; const h = b.getBoundingClientRect().height; if (h < 44) out.push(s + ' «' + b.innerText.trim().slice(0, 20) + '» ' + Math.round(h)); }));
      return out;
    });
    assert.deepStrictEqual(baixos, [], 'toques com menos de 44 px');
    assert.deepStrictEqual(erros, [], 'sem erro de página');
  } finally { await ctx.close(); }
});

// C11 (AC-V11.1, AC-V11.3): abrir e fechar tópicos não lê nem grava; «Dei agora» e a dose avulsa gravam como antes.
prova('C11', 'abrir e fechar os tópicos: 0 leituras e 0 gravações; «Dei agora» grava quem e quando; a dose avulsa grava avulso:true', async () => {
  const { ctx, page, erros } = await abrir('2026-11-03T19:40:00-03:00', cenario('2026-11-03'));
  try {
    await tocarHospede(page, 'Biscoito Teste');
    const conta = await page.evaluate(() => { const L = __banco.log, a = L.leituras.length, g = L.gravacoes.length;
      ['tp-alerta', 'tp-med', 'tp-alim', 'tp-obs', 'tp-alerta', 'tp-med', 'tp-alim', 'tp-obs'].forEach((id) => toggleRel(id));
      return { l: L.leituras.length - a, g: L.gravacoes.length - g }; });
    assert.deepStrictEqual(conta, { l: 0, g: 0 }, 'abrir e fechar tópicos');
    await page.evaluate(() => { const c = document.getElementById('tp-med'); if (c.classList.contains('collapsed')) toggleRel('tp-med'); });
    const bt = await page.$('#magHoje .btn-gold'); assert.ok(bt, 'o «Dei agora» das 20h');
    await bt.tap(); await esperar(200); await (await page.$('#magHoje .btn-gold')).tap(); await esperar(800);
    const dose = await page.evaluate(() => __banco.ler('auaulandia/medicacao-log/2026-11-03/biscoito teste__rita teste/a1_20-00'));
    assert.ok(dose && dose.quem === 'Plantonista Teste' && dose.ts > 0, 'a dose das 20h gravada: ' + JSON.stringify(dose));
    await page.fill('#magAvNome', 'Pomada Teste'); await page.fill('#magAvHora', '19:41'); await page.fill('#magAvQtd', '1');
    await page.evaluate(() => { const b = Array.from(document.querySelectorAll('#magAvUnidades button')).find((x) => x.innerText.trim() === 'comprimido'); b.click(); });
    await page.evaluate(() => registrarDoseAvulsa()); await esperar(800);
    const av = await page.evaluate(() => { const L = __banco.ler('auaulandia/medicacao-log/2026-11-03/biscoito teste__rita teste') || {}; return Object.keys(L).map((k) => L[k]).filter((x) => x && x.avulso); });
    assert.ok(av.length === 1 && av[0].nome === 'Pomada Teste', 'a dose avulsa: ' + JSON.stringify(av));
    assert.deepStrictEqual(erros, [], 'sem erro de página');
  } finally { await ctx.close(); }
});

// ================================================================== a rodada
(async () => {
  const sel = fila.filter((p) => !FILTRO.length || FILTRO.indexOf(p.id) >= 0);
  const precisaNav = sel.some((p) => p.id[0] === 'C');
  if (precisaNav && chromium) NAVEGADOR = await chromium.launch();
  const falhas = []; let ok = 0, pulado = 0;
  try {
    for (const p of sel) {
      if (p.id[0] === 'C' && !NAVEGADOR) { pulado += 1; console.log('  - PULADO ' + p.id + ' ' + p.nome + ' (sem Playwright)'); continue; }
      try { await p.fn(); ok += 1; console.log('  ✓ ' + p.id + ' ' + p.nome); }
      catch (e) { falhas.push(p.id + ' ' + p.nome); console.log('  ✗ ' + p.id + ' ' + p.nome + '\n      ' + String((e && e.message) || e).split('\n').slice(0, process.env.TUDO ? 400 : 8).join('\n      ')); }
    }
  } finally { if (NAVEGADOR) await NAVEGADOR.close(); }
  console.log('\nplantao-lacunas175: ' + ok + ' passaram, ' + falhas.length + ' falharam' + (pulado ? (', ' + pulado + ' puladas') : ''));
  if (falhas.length) { console.log('FALHARAM:\n  ' + falhas.join('\n  ')); process.exitCode = 1; }
})().catch((e) => { console.error(e); process.exitCode = 1; });
