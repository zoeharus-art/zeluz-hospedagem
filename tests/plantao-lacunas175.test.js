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
// No master d3a9e25 falham L3, L4, L5 (as funções e o CSS da 6.122 ainda não existem), C1 a C10, C12, C13, C14 e C15 (cada uma é uma
// lacuna confirmada); L2 e C11 são controles e passam nos dois, e a L1 também era, até a rodada 4 (desde ela, a L1 confere a linha nova
// de jantaSlotRender, e falha no master e no 831eae8). C13 e C14 e as partes novas de C2, C3, C6, C8, C10 e L3 vêm da rodada 1
// do QA (03/11/2026) e falham também no 42bc54e; a parte nova da C5 (o toque antes de a agenda chegar) pega o defeito plantado pelo QA.
// A C15, as três guardas da C13 e as partes novas de L1 e L3 vêm da rodada 2 do QA (o relatório pela metade com a dose de hoje na
// hora): a C15, a C13 e a L3 falham também no c6444d8. A C16, a C17 e a C18, as partes novas de L1, L3, C13 e C14 vêm da rodada 3 do
// QA (04/11/2026: a dose de hoje pela agenda de ontem, a dose registrada em outro aparelho, as três guardas sem prova e o «NÃO PODE:
// Servir morno» dentro do Relatório do Jantar) e falham também no 831eae8.

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
    { n: 'Thor Teste', tutor: 'Carlos Teste', raca: 'SRD', cad: o.thorCad || { restricao: 'lactose', medicacao: 'Vermífugo Teste no sábado' } },
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
  carregarMedAgenda: 'cc3983e265e95494', alimDoHospede: '93626518e6759a43',
  alimMarcaDoCard: '0af5dff971e8f881', renderRelMedConfirm: '2438a42ec24a3a2c', dateLabelHTML: 'e9ff298af0d1a0a5',
  updateDateLabel: 'c9eb1523c00a7bd5', fichaHoje: '20d60914122a444a', fichaMudaDia: 'cb7e758871fc475e',
  registrarDoseAgendada: 'dadea85e19f3459d', registrarDoseAgendadaGlobal: 'af517efea2d89e0d', registrarDoseAvulsa: '3b44c1402d940071',
  renderHosp: 'dc613e05699002bf', hospEstadiaFichaHTML: 'd06b7b5e04eac1be', renderVetInstrucoesFicha: '9081720f3946bc43',
  renderHospAlergiaBlock: 'acee67a04ea0b5e3', renderPlacarMedDia: '839ff1d530a3db81', statusDoseMed: '37525f9cfd86c6fe',
  medVigenteEm: 'bfe6edd4f4c1f914', renderMedAgenda: '7d81e769260edad4', fichaAlertasRender: '962632d580440d6f',
  alertasAtivosDe: 'f1dfcc0133bc03a2', faixaChipsDaFicha: 'bced01d9e208702f',
  // rodada 2 do QA (03/11/2026): o bip, o que segura a virada e a pergunta do «Hoje» também não mudam
  bipDespertador: '5b00c48f7cf0c145', zDiaTrabalhoAberto: 'c4943cd37850f19e', zDiaOntemEstado: 'dc76ec2e4070c451',
  zDiaOntemPendente: '4791c77206d9f5d8', zDiaHojePergunta: 'f520f373cd947aac', zEscolha: '13faab7feace613f',
};
const PROTEGIDA = { n: 157, funcoes: '93f5be639ef4de2f', daycare: '4c438983ed2b9c0a' };
// jantaSlotRender (a caixa do jantar dentro do Relatório do Jantar) muda numa linha só, de propósito (rodada 3 do QA, ponto 4 da
// rodada 4): no SEM RAÇÃO com check-in, a observação da comida é instrução («Observação da alimentação: …»), não «NÃO PODE: …». Com
// essa linha e o comentário dela trocados de volta pelo texto do master, a função tem o hash do master: nada mais mudou nela.
const JANTA_NOVA = "+(a.obs?('<div>'+(a.fonte==='checkin'?'Observação da alimentação: ':'NÃO PODE: ')+escAttr(a.obs)+'</div>'):'')";
const JANTA_VELHA = "+(a.obs?('<div>NÃO PODE: '+escAttr(a.obs)+'</div>'):'')";
prova('L1', 'as funções que a 6.122 não pode mudar (a Medicação, o alarme, os relatórios, a trava de leitura, a faixa e a comida) têm o mesmo texto do master d3a9e25; jantaSlotRender só com a linha da observação do SEM RAÇÃO', () => {
  const diferentes = Object.keys(NAO_MUDAM).filter((nm) => sha(trecho(nm)) !== NAO_MUDAM[nm]);
  assert.deepStrictEqual(diferentes, [], 'mudaram: ' + diferentes.join(', '));
  const j = trecho('jantaSlotRender');
  assert.strictEqual(j.split(JANTA_NOVA).length - 1, 1, 'a linha nova do SEM RAÇÃO, uma vez só (o ramo «sem jantar lançado» continua com NÃO PODE)');
  assert.strictEqual(sha(j.replace(/\n {6}\/\/ 6\.122 \(QA, rodada 3\):[^\n]*\n {6}\/\/[^\n]*/, '').replace(JANTA_NOVA, JANTA_VELHA)), 'd390200095fa1afd', 'o resto de jantaSlotRender igual ao master');
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
    'fichaAlimResumo', 'fichaAlimPintar', 'fichaOntemFaixaPintar', 'fichaMagDesatualizada', 'fichaMagOcupada', 'fichaRedesenharMag', 'fichaRelogioTick',
    'fichaTarjaAmarela', 'fichaTarjasTopicosPintar', 'fichaDadosResumo', 'fichaMaisResumo',
    // rodada 1 do QA (03/11/2026): o remédio de hoje com a ficha em ontem e a foto dos relatórios
    'fichaMedHojeProximas', 'fichaMedHojeTxt', 'fichaDoseHojeChegou', 'fichaRelValor', 'fichaRelFotoAcertar', 'fichaRelRascunho', 'fichaEmUso', 'fichaVirarParaHoje',
    // rodada 2 do QA (03/11/2026): a dose de hoje com o relatório pela metade — a faixa que gruda, o bip e o toque que pergunta
    'fichaDosesHojeNaHora', 'fichaDosesHojeTxt', 'fichaTopoGrudado', 'fichaOntemFaixaToque',
    // rodada 3 do QA (04/11/2026): as doses de hoje pela agenda e pelo registro de HOJE
    'fichaItensHojeDe', 'fichaDosesHojeDe', 'fichaDosesHoje', 'fichaLogHoje', 'fichaLogHojeLigar'];
  novas.forEach((nm) => {
    const f = funcao(nm);
    assert.ok(!/DB\s*\.\s*ref|\.once\(|\.on\(|\.set\(|\.update\(|\.transaction\(|localStorage|sessionStorage|carregar[A-Z]/.test(f), nm + ' não lê nem grava');
    assert.ok(!/^(ck|ckt|pt)/.test(nm), nm);
    assert.ok(!/#[0-9a-fA-F]{3,6}\b/.test(f), nm + ' sem cor escrita à mão');
  });
  // A ficha segurada em ontem na hora da dose de hoje (AC-V1.4) passa para hoje SÓ pelo «Hoje» de sempre (fichaHoje: as leituras de
  // tocar em «Hoje», que a C13 mede) e não grava nada; nenhuma outra função nova chama fichaHoje.
  assert.ok(/\n    fichaHoje\(\);\n/.test(funcao('fichaVirarParaHoje')), 'fichaVirarParaHoje passa para hoje pelo fichaHoje()');
  // A exceção é o toque da pessoa na faixa (fichaOntemFaixaToque): sem relatório por salvar, vai para hoje como sempre; com relatório
  // por salvar, só pela pergunta (zEscolha), nunca direto (rodada 2 do QA: a faixa que gruda no alto não pode apagar o texto num toque).
  assert.deepStrictEqual(novas.filter((nm) => nm !== 'fichaVirarParaHoje' && nm !== 'fichaOntemFaixaToque' && /fichaHoje\(|fichaMudaDia\(|goToToday\(|changeDate\(/.test(funcao(nm))), [], 'nenhuma outra função nova troca o dia');
  const toque = funcao('fichaOntemFaixaToque');
  assert.ok(/if\(!R\.length \|\| typeof zEscolha!=='function'\)\{ fichaHoje\(\); return 'hoje'; \}/.test(toque) && (toque.match(/fichaHoje\(/g) || []).length === 2 && /zEscolha\(/.test(toque),
    'com relatório por salvar, o toque na faixa pergunta antes de ir para hoje');
  assert.ok(/id="hf-ontem-faixa"[^>]*onclick="fichaOntemFaixaToque\(\)"/.test(html), 'a faixa chama fichaOntemFaixaToque');
  assert.ok(!/audit\(/.test(funcao('fichaVirarParaHoje')), 'sem rastro novo gravado');
  // O alarme na tela segura a virada pela conta única de zDiaTrabalhoAberto (que não muda), e o bip é o de sempre, só no relógio da ficha.
  assert.ok(/var ab=zDiaTrabalhoAberto\(\); if\(ab && ab!=='sem internet'\) return 'espera: '\+ab;/.test(funcao('fichaVirarParaHoje')), 'o alarme, o check-in e o almoço seguram a virada');
  assert.deepStrictEqual(novas.filter((nm) => /bipDespertador\(|AudioContext/.test(funcao(nm))), ['fichaRelogioTick'], 'o bip só no relógio da ficha');
  // As doses de hoje (rodada 3 do QA): uma regra só, a do alarme no dia de hoje — sem suspenso nem anulado e valendo HOJE —, para a
  // faixa, o bip, a passagem para hoje e o resumo; nenhuma lê a fila do alarme montada para o dia da tela (MED_AGENDA_TODOS).
  assert.ok(/if\(it\.suspenso \|\| medItemAnulado\(it\) \|\| !medVigenteEm\(it, hoje\)\) return;/.test(funcao('fichaDosesHojeDe')), 'a vigência de HOJE (início, fim e frequência)');
  assert.ok(/if\(L\[magDoseId\(id, hh\)\]\) return;/.test(funcao('fichaDosesHojeDe')), 'a dose registrada hoje sai');
  assert.ok(/fichaDosesHojeDe\(/.test(funcao('fichaMedHojeProximas')) && /fichaDosesHoje\(DESP_ANTES_MIN, fichaLogHoje\(\)\)/.test(funcao('fichaDosesHojeNaHora')) && /fichaDosesHojeDe\(/.test(funcao('fichaDosesHoje')), 'o resumo e a faixa pela mesma conta');
  assert.ok(/h\.saidaHoje/.test(funcao('fichaDosesHoje')) && /h\.saidaHoje/.test(funcao('fichaMedHojeProximas')), 'quem saiu ontem não conta');
  assert.deepStrictEqual(novas.filter((nm) => /MED_AGENDA_TODOS/.test(funcao(nm))), [], 'nenhuma usa a fila do dia da tela');
  // A única leitura nova é o retrato vivo do registro de HOJE (o mesmo que o alarme lê com a tela em hoje, medLogHoje), ligado só pelo
  // relógio da ficha; nenhuma outra função nova abre retrato.
  assert.deepStrictEqual(novas.filter((nm) => /zMapaVivo\(|zMapaUma\(/.test(funcao(nm))), ['fichaLogHojeLigar'], 'só fichaLogHojeLigar abre o retrato');
  assert.ok(/var p='auaulandia\/medicacao-log\/'\+zHojeISO\(\)/.test(funcao('fichaLogHojeLigar')) && (funcao('fichaLogHojeLigar').match(/zMapaVivo\(/g) || []).length === 1, 'o registro de hoje, e só ele');
  assert.ok(/'auaulandia\/medicacao-log\/'\+dataKeyAtual\(\)/.test(trecho('medLogHoje')) && /zMapaUma\(p\)/.test(trecho('medLogHoje')), 'o mesmo caminho e o mesmo retrato do alarme (medLogHoje)');
  assert.deepStrictEqual(novas.filter((nm) => nm !== 'fichaLogHojeLigar' && /fichaLogHojeLigar\(/.test(funcao(nm))), ['fichaRelogioTick'], 'só o relógio da ficha liga o registro');
  assert.ok(/medDiaVelhoAuto\(\) && !fichaEhHoje\(\) && fichaDosesHoje\(60, null\)\.length\) fichaLogHojeLigar\(\)/.test(funcao('fichaRelogioTick')), 'só com a ficha segurada em ontem e remédio de hoje na próxima hora');
  // o relógio da ficha não chama nada que lê o banco (além da passagem para hoje e do registro de hoje, acima)
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
      // às 7h10 a dose de hoje das 8h está a 50 minutos: a faixa e o resumo avisam (AC-V1.4); antes disso, a faixa de sempre
      const remHoje = hora === '7h10';
      assert.strictEqual(r.faixa, remHoje ? 'Esta ficha é de ontem. Remédio de hoje às 8h: toque para ver a de hoje' : 'Esta ficha é de ontem: toque para ver a de hoje', hora + ': a faixa no alto da ficha');
      assert.ok(!r.ok && !/tudo dado/.test(r.est), hora + ': nunca verde «tudo dado»');
      assert.ok(/Ficha de ontem/.test(r.est), hora + ': o estado neutro «Ficha de ontem» — ' + r.est);
      assert.strictEqual(r.critico, '2 doses de 03/11 sem registro (20h e 22h)' + (remHoje ? ' | Remédio de hoje às 8h: Apoquel Teste' : ''), hora + ': ' + r.sub);
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

// C3 (AC-V2; bloqueio 5 da rodada 1 do QA): os alertas só desta estadia ficam à vista, sem tocar, numa tarja só; o resumo do ALERTA
// mostra só o que a faixa do alto não mostra (o fixo de convivência), sem repetir a estadia nem a alergia.
prova('C3', 'os alertas da estadia («Suspeita de virose…», «Dorme sozinho…») aparecem na primeira tela, sem tocar, numa tarja só; o resumo do ALERTA mostra só o que a faixa não mostra', async () => {
  const ler = (page) => page.evaluate(() => {
    const vis = (t) => Array.from(document.querySelectorAll('#hosp-ficha *')).filter((e) => e.children.length === 0 && e.innerText && e.innerText.indexOf(t) >= 0 && e.offsetParent !== null)
      .map((e) => { const b = e.getBoundingClientRect(); return { bottom: Math.round(b.bottom + window.scrollY), fechadoEmTopico: !!e.closest('.rel-card.collapsed .rel-body') }; });
    return { virose: vis('Suspeita de virose'), dorme: vis('Dorme sozinho'), sub: document.getElementById('tps-alerta').innerText, n: document.getElementById('tpn-alerta').innerText,
      est: (document.getElementById('tpe-alerta') || {}).innerText || '', subVisivel: getComputedStyle(document.getElementById('tps-alerta')).display !== 'none',
      tarjas: Array.from(document.querySelectorAll('#hf-pills-extra .alert-pill')).map((x) => x.innerText.replace(/\s+/g, ' ')) };
  });
  const { ctx, page, erros } = await abrir('2026-11-03T19:40:00-03:00', cenario('2026-11-03'));
  try {
    await tocarHospede(page, 'Biscoito Teste');
    const r = await ler(page);
    assert.ok(r.virose.some((x) => x.bottom <= 667 && !x.fechadoEmTopico), 'a virose na primeira tela: ' + JSON.stringify(r.virose));
    assert.ok(r.dorme.some((x) => x.bottom <= 667 && !x.fechadoEmTopico), '«Dorme sozinho» na primeira tela: ' + JSON.stringify(r.dorme));
    assert.deepStrictEqual(r.tarjas, ['ALERTA: Suspeita de virose — afastado dos outros · Dorme sozinho — não aceita os outros'], 'os dois alertas da estadia numa tarja só');
    // tudo já está na faixa (a estadia na tarja ALERTA, a alergia na dela): o título do ALERTA fica sem resumo, com o número e o «⚠ LER»
    assert.ok(r.sub === '' && !r.subVisivel && r.n === '3' && /LER/.test(r.est), 'o resumo do ALERTA não repete a faixa: ' + JSON.stringify(r));
    assert.deepStrictEqual(erros, [], 'sem erro de página');
  } finally { await ctx.close(); }
  // um alerta fixo de convivência (não aparece na faixa do alto): é ele que o resumo mostra
  const S = cenario('2026-11-03'); S.peludinhos[0].cad.alertas_fixos = { mach: { on: true, quem: 'Gestão Teste', ts: 1 } };
  const b = await abrir('2026-11-03T19:40:00-03:00', S);
  try {
    await tocarHospede(b.page, 'Biscoito Teste');
    const r = await ler(b.page);
    assert.ok(r.sub === 'NÃO pode ficar com MACHOS' && r.subVisivel && r.n === '4', 'o resumo com o fixo que a faixa não mostra: ' + JSON.stringify(r));
    assert.deepStrictEqual(b.erros, [], 'sem erro de página');
  } finally { await b.ctx.close(); }
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
    // o toque ANTES de a agenda chegar também vale (rodada 1 do QA: o caso não tinha prova): abriu e fechou com a agenda ainda
    // carregando; quando ela chega, a Medicação continua fechada
    await voltar(page);
    const cedo = await page.evaluate(() => { abrirPlantao(hospedes.findIndex((h) => /Biscoito/.test(h.nome))); const c = MAG_RESUMO.carregando === true; toggleRel('tp-med'); toggleRel('tp-med'); return c; });
    assert.ok(cedo, 'os dois toques foram com a agenda ainda carregando');
    await page.waitForFunction(() => !MAG_RESUMO.carregando, null, { timeout: 5000 }).catch(() => {});
    await esperar(400); await page.evaluate(() => { fichaTopicosPintar(); fichaRelogioTick(); }); await esperar(200);
    assert.ok((await lerMed(page)).fechado, 'tocou antes de a agenda chegar: a Medicação não abre sozinha depois');
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
    const rel = await page.evaluate(() => ({ abertos: ['card-dia', 'card-inicio', 'card-noite'].filter((id) => !document.getElementById(id).classList.contains('collapsed')), t0: ['dia', 'inicio', 'noite'].filter((k) => LEITURA_T0[k]) }));   // o cronômetro é dos relatórios (o toque na Medicação, acima, marca o dele)
    assert.deepStrictEqual(rel, { abertos: [], t0: [] }, 'os relatórios fechados e sem cronômetro');
    assert.deepStrictEqual(erros, [], 'sem erro de página');
  } finally { await ctx.close(); }
});

// C6 (AC-V5): o resumo da Alimentação diz o que ele come e quanto; o café entra; o ANSIOSO mora dentro; a comida mudada chega.
prova('C6', 'Alimentação: resumo «NÃO PODE · ANSIOSO: caixa própria · Jantar: 80 gramas de ração · Café: 60 gramas…» (o café primeiro às 7h10), o café dentro, o ANSIOSO dentro, e a comida mudada chega sem reabrir', async () => {
  const { ctx, page, erros } = await abrir('2026-11-03T19:40:00-03:00', cenario('2026-11-03'));
  try {
    const ler = () => page.evaluate(() => ({ sub: document.getElementById('tps-alim').innerText, info: document.getElementById('hf-alim-info').innerText.replace(/\s+/g, ' '),
      cafePx: (() => { const b = Array.from(document.querySelectorAll('#hf-alim-info .janta-box')).find((x) => /Café de/.test(x.innerText)); return b ? parseFloat(getComputedStyle(b.querySelector('strong') || b).fontSize) : 0; })(),
      ansioso: Array.from(document.querySelectorAll('#tp-alim .rel-body .alert-pill')).map((x) => x.innerText).join(' | ') }));
    await tocarHospede(page, 'Biscoito Teste');
    let r = await ler();
    // o ANSIOSO à vista sem tocar (rodada 1 do QA: a tarja amarela saiu do alto na segunda rodada), logo depois do NÃO PODE
    assert.ok(/^NÃO PODE: frango · sem grãos · ANSIOSO: caixa própria · Jantar: 80 gramas de ração · Café: 60 gramas de ração · Falta marcar como comeu$/.test(r.sub), '19h40: ' + r.sub);
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
    assert.ok(/^NÃO PODE: frango · sem grãos · ANSIOSO: caixa própria · Café: 60 gramas de ração · Jantar: 100 gramas de ração/.test(r.sub), '7h10: ' + r.sub);
    assert.ok(/60 gramas/.test(r.info), 'às 7h10 o «60» do café está na ficha');
    // a Mel não é ansiosa: o resumo dela não fala de caixa própria
    await voltar(page); await tocarHospede(page, 'Mel Teste');
    r = await ler();
    assert.ok(/^NÃO PODE: peixe · sem grãos · /.test(r.sub) && !/ANSIOSO/.test(r.sub), 'Mel: ' + r.sub);
    // o Thor (pernoite sem check-in): o jantar repete o almoço do Day Care e diz de quê (rodada 1 do QA: «90 g» sozinho)
    await voltar(page); await tocarHospede(page, 'Thor Teste');
    r = await ler();
    assert.ok(/Jantar: 90 g de Ração Teste Light \(do almoço do Day Care, confirme\)/.test(r.sub), 'Thor: ' + r.sub);
    assert.deepStrictEqual(erros, [], 'sem erro de página');
  } finally { await ctx.close(); }
});

// C7 (AC-V6): a instrução do remédio no alto do Medicamento; a da comida só na Alimentação.
prova('C7', 'a instrução do remédio fica no alto do Medicamento; Dados gerais (antes Observações) fica com a observação da estadia, sem as instruções do remédio e da comida', async () => {
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
    assert.ok(r.n === '2' && r.sub === 'Tutora pediu para olhar se ele manca à noite · Ansioso: come em caixa própria', 'Dados gerais: ' + r.n + ' / ' + r.sub);
    assert.strictEqual((r.alim.match(/Servir morno/g) || []).length, 1, 'a instrução da comida uma vez, na Alimentação');
    assert.deepStrictEqual(erros, [], 'sem erro de página');
  } finally { await ctx.close(); }
});

// C8 (AC-V7): a primeira tela da ficha no celular.
prova('C8', 'primeira tela: sem o cabeçalho da página (gruda 50 px ou menos), foto de até 72 px ao lado do nome, sem o selo, as tarjas vermelhas e o título e o resumo do ALERTA e do MEDICAMENTO sem rolar (Biscoito e Mel)', async () => {
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
      // AC-V7.3: o ALERTA e o MEDICAMENTO (título e resumo) dentro dos 667 px — também o Biscoito (rodada 1 do QA, bloqueio 5), com a
      // alergia, a restrição e os dois alertas da estadia (numa tarja só) no alto e o resumo do ALERTA sem repetir a faixa.
      assert.ok(m.alerta <= 667 && m.alertaTit <= 667 && m.med <= 667, nome + ': ALERTA e MEDICAMENTO na primeira tela — ' + JSON.stringify(m));
      console.log('      ' + nome + ': ALERTA termina em ' + Math.max(m.alerta, m.alertaTit) + ' px, MEDICAMENTO em ' + m.med + ' px, ALIMENTAÇÃO em ' + m.alim + ' px (tela de 667)');
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
    await page.evaluate(() => ['tp-alerta', 'tp-med', 'tp-alim', 'tp-obs', 'card-dia', 'card-inicio', 'card-noite', 'tp-mais'].forEach((id) => { const c = document.getElementById(id); if (c && c.classList.contains('collapsed')) toggleRel(id); }));
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
    // «Mais informações» aberto também: o «Reemitir ficha de check-in (PDF)» mora lá desde a segunda rodada (rodada 1 do QA: 33 px)
    await page.evaluate(() => { ['tp-med', 'card-dia', 'card-inicio', 'card-noite', 'tp-mais'].forEach((id) => { const c = document.getElementById(id); if (c.classList.contains('collapsed')) toggleRel(id); }); });
    await esperar(300);
    const reemitir = await page.evaluate(() => { const b = document.querySelector('#tp-mais button[onclick="reemitirFichaAtual()"]'); return b && b.offsetParent !== null ? Math.round(b.getBoundingClientRect().height) : -1; });
    assert.ok(reemitir >= 44, '«Reemitir ficha de check-in» à vista em «Mais informações», com 44 px ou mais: ' + reemitir);
    const baixos = await page.evaluate(() => {
      const sel = ['#hosp-ficha .back-btn', '#hosp-ficha .ficha-datenav button', '#hosp-ficha .hosp-head button', '#magHoje .btn-gold', '#hosp-ficha .rel-card .seg button', '#magAvUnidades button', '#hosp-ficha #tp-mais .rel-body button'];
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

// C12 (segunda rodada da 6.122: «Dados gerais» do pedido de 22/10 e «Mais informações» da resposta 76; a ordem do ar fica).
prova('C12', '«Dados gerais» com as tarjas amarelas MANIAS e ANSIOSO e a observação da estadia; a MEDICAÇÃO do cadastro continua no alto; «Mais informações», fechado, por último, com o PDF, a foto, o cadastro, os brinquedos e o texto ao tutor', async () => {
  const { ctx, page, erros } = await abrir('2026-11-03T18:40:00-03:00', cenario('2026-11-03'));
  try {
    const ler = () => page.evaluate(() => {
      const vis = (el) => !!(el && el.offsetParent !== null);
      const ordem = ['tp-alerta', 'tp-med', 'tp-alim', 'tp-obs', 'card-dia', 'tp-mais'].map((id) => { const e = document.getElementById(id); return e ? Math.round(e.getBoundingClientRect().top + scrollY) : -1; });
      return { titulo: document.querySelector('#tp-obs .rel-head h2').textContent.replace(/\s+\d+\s*$/, '').trim(), maisTitulo: ((document.querySelector('#tp-mais .rel-head h2') || {}).textContent || '').trim(),
        maisFechado: document.getElementById('tp-mais').classList.contains('collapsed'), maisSub: document.getElementById('tps-mais').innerText,
        noAlto: Array.from(document.querySelectorAll('#hf-pills .alert-pill')).filter(vis).map((p) => p.innerText.replace(/\s+/g, ' ')),
        dados: Array.from(document.querySelectorAll('#hf-dados-tarjas .alert-pill')).map((p) => p.innerText), medSub: document.getElementById('tps-med').innerText,
        obs: document.getElementById('hf-obsgeral').innerText.replace(/\s+/g, ' '), reemitirNoMais: !!document.querySelector('#tp-mais button[onclick="reemitirFichaAtual()"]'),
        reemitirFora: document.querySelectorAll('button[onclick="reemitirFichaAtual()"]').length, ordem, aria: document.querySelector('#tp-mais .rel-head').getAttribute('aria-expanded') };
    });
    await tocarHospede(page, 'Mel Teste');
    let r = await ler();
    assert.strictEqual(r.titulo, 'Dados gerais', 'o título');
    assert.deepStrictEqual(r.dados, ['MANIAS: rouba o brinquedo dos outros'], 'MANIAS dentro de Dados gerais');
    assert.ok(r.noAlto.every((t) => !/^MANIAS|^ANSIOSO/.test(t)) && r.noAlto.some((t) => /ALERGIA A PEIXE/.test(t)) && r.noAlto.some((t) => /RESTRIÇÃO: sem grãos/.test(t)), 'no alto, sem MANIAS e ANSIOSO, com as vermelhas: ' + r.noAlto.join(' | '));
    assert.strictEqual(r.maisTitulo, 'Mais informações', 'o tópico Mais informações');
    assert.ok(r.maisFechado && r.aria === 'false' && r.reemitirNoMais && r.reemitirFora === 1, 'fechado, com o PDF dentro (e só lá): ' + JSON.stringify(r));
    assert.strictEqual(r.maisSub, 'Ficha de check-in (PDF)', 'o resumo para a plantonista');
    const ord = r.ordem; assert.ok(ord.every((x, i) => i === 0 || x > ord[i - 1]), 'a ordem do ar, com Mais informações por último: ' + ord.join(' < '));
    await voltar(page); await tocarHospede(page, 'Biscoito Teste');
    r = await ler();
    assert.deepStrictEqual(r.dados, ['ANSIOSO: come em caixa própria — servir logo após quem tem banho'], 'ANSIOSO dentro de Dados gerais');
    assert.strictEqual(r.obs, 'Observação da estadia: Tutora pediu para olhar se ele manca à noite');
    // a MEDICAÇÃO do cadastro sem agenda (Thor): continua à vista no alto, porque o Medicamento diz «Nenhum remédio hoje»
    await voltar(page); await tocarHospede(page, 'Thor Teste');
    r = await ler();
    assert.ok(r.noAlto.some((t) => t === 'MEDICAÇÃO: Vermífugo Teste no sábado') && /Nenhum remédio hoje/.test(r.medSub), 'a MEDICAÇÃO no alto: ' + r.noAlto.join(' | ') + ' / ' + r.medSub);
    await voltar(page); await tocarHospede(page, 'Biscoito Teste');
    // abre, troca de hóspede, volta fechado
    await page.tap('#tp-mais .rel-head'); await esperar(200);
    assert.ok(!(await ler()).maisFechado, 'abriu com o toque');
    await voltar(page); await tocarHospede(page, 'Biscoito Teste');
    assert.ok((await ler()).maisFechado, 'abrir a ficha de novo: fechado');
    assert.deepStrictEqual(erros, [], 'sem erro de página');
  } finally { await ctx.close(); }
  // a Gestão vê mais coisas lá dentro: o resumo diz o que ela vai achar
  const g = await abrir('2026-11-03T18:40:00-03:00', cenario('2026-11-03', { papel: 'gestao' }));
  try {
    await g.page.evaluate(() => irParaView('hospedagem')); await esperar(800);   // a Gestão entra pelo Início; a plantonista, direto no Plantão
    await tocarHospede(g.page, 'Biscoito Teste');
    const sub = await g.page.evaluate(() => document.getElementById('tps-mais').innerText);
    assert.strictEqual(sub, 'Ficha de check-in (PDF), foto, cadastro, brinquedos e texto para o tutor', 'o resumo para a Gestão');
    await g.page.evaluate(() => { toggleRel('tp-mais'); toggleCadastro(); }); await esperar(300);
    const cad = await g.page.evaluate(() => { const c = document.getElementById('card-cadastro'); return { aberto: c.style.display === 'block', dentro: !!c.closest('#tp-mais') }; });
    assert.ok(cad.aberto && cad.dentro, '«Editar cadastro» abre o cadastro dentro de Mais informações: ' + JSON.stringify(cad));
  } finally { await g.ctx.close(); }
});

// C13 (AC-V1.4; bloqueio 1 da rodada 1 do QA): a ficha segurada em ontem pela virada passa sozinha para hoje na hora de uma dose de
// hoje, e o alarme de sempre (checarDespertadorMed, que não muda) toca por cima dela. Antes disso, a faixa e o resumo do Medicamento
// avisam do remédio de hoje. Com o que foi escrito num relatório e ainda não salvo, ou com o cursor num campo, a ficha espera (o texto
// não se perde) e avisa; desfeito o rascunho e fora do campo, passa e o alarme toca. O caso do QA: tudo de 03/11 dado, Colírio às 0h15.
const LOG_0311_TUDO_DADO = { 'a1_08-00': { quem: 'Plantonista Teste', ts: 1 }, 'a1_20-00': { quem: 'Plantonista Teste', ts: 2 }, 'c1_00-15': { quem: 'Plantonista Teste', ts: 3 } };
// a planilha com os três dias (02, 03 e 04/11): depois da meia-noite, a lista de hoje tem os mesmos hóspedes
const planilhaTresDias = (page) => page.evaluate(() => {
  const L = []; for (const d of [new Date(2026, 10, 2), new Date(2026, 10, 3), new Date(2026, 10, 4)]) L.push({ c: [{ v: 'Date(' + d.getFullYear() + ',' + d.getMonth() + ',' + d.getDate() + ')' }, { v: 'Biscoito Teste / Rita Teste / Spitz Alemão' }, { v: 'Mel Teste / Joana Teste / SRD' }] });
  fetchSheet = function () { return Promise.resolve({ rows: L }); }; try { carregarHospedes(); } catch (e) { /* a lista se acerta na próxima leitura */ }
});
const estadoVirada = (page) => page.evaluate(() => ({ ficha: document.getElementById('hosp-ficha').style.display, dia: dataKeyAtual(), rotulo: document.getElementById('hf-datelabel').innerText,
  faixa: (() => { const f = document.getElementById('hf-ontem-faixa'); return f && getComputedStyle(f).display !== 'none' ? f.innerText : ''; })(),
  sub: document.getElementById('tps-med').innerText, critico: Array.from(document.querySelectorAll('#tps-med .tp-sub-critico')).map((x) => x.innerText).join(' | '),
  alarme: (() => { const d = document.getElementById('despMed'); return d && getComputedStyle(d).display !== 'none' ? d.innerText.replace(/\s+/g, ' ') : ''; })() }));
// o caminho com a data trocada por DIA e a chave do FILHOt por K (o tipo de leitura, não o nome: depois da meia-noite, a lista do dia
// novo lê o relatório de cada hóspede dela, como no toque em «Hoje»)
const caminhos = (L, desde) => Array.from(new Set(L.slice(desde || 0).map((x) => x.op + ' ' + x.path.replace(/\d{4}-\d{2}-\d{2}/g, 'DIA').replace(/[^/]*__[^/]*/g, 'K')))).sort();
prova('C13', 'ficha aberta às 23h55, tudo de 03/11 dado e o Colírio às 0h15: às 0h05 a faixa e o resumo avisam do remédio de hoje; às 0h16 a ficha passou para hoje e o alarme toca por cima dela, sem leitura nem gravação nova; com texto não salvo no relatório ou o cursor num campo, espera sem perder o texto, com a faixa no alto dizendo o que fazer; e as três guardas: a Gestão (não recebe o alarme), o alarme de ontem na tela e a dose de ontem ainda conferindo seguram a ficha em ontem, sem pergunta na tela', async () => {
  const { ctx, page, erros } = await abrir('2026-11-03T23:55:00-03:00', cenario('2026-11-03', { colirio: '00:15', logHoje: LOG_0311_TUDO_DADO }));
  try {
    await planilhaTresDias(page); await esperar(800);
    await tocarHospede(page, 'Biscoito Teste');
    await andar(page, 10 * 60 * 1000);   // 0h05
    let r = await estadoVirada(page);
    assert.ok(r.dia === '2026-11-03' && /^Ontem · 03\/11\/2026/.test(r.rotulo) && r.alarme === '', '0h05: a ficha ainda em ontem, sem alarme — ' + JSON.stringify(r));
    assert.strictEqual(r.faixa, 'Esta ficha é de ontem. Remédio de hoje às 0h15: toque para ver a de hoje', '0h05: a faixa avisa do remédio de hoje');
    assert.strictEqual(r.critico, 'Remédio de hoje às 0h15: Colírio Teste', '0h05: o resumo do Medicamento avisa, em vermelho — ' + r.sub);
    assert.ok(/^Todas as doses de 03\/11 registradas · Remédio de hoje às 0h15: Colírio Teste$/.test(r.sub), '0h05: ' + r.sub);
    const L = await page.evaluate(() => ({ l: __banco.log.leituras.length, g: __banco.log.gravacoes.length }));
    const lidasAntes = await page.evaluate(() => __banco.log.leituras.map((x) => ({ op: x.op, path: x.path })));
    const gravadasAntes = await page.evaluate(() => __banco.log.gravacoes.map((x) => ({ op: x.op, path: x.path })));
    await page.mouse.move(20, 20);
    await andar(page, 11 * 60 * 1000);   // 0h16
    r = await estadoVirada(page);
    assert.ok(r.ficha === 'block' && r.dia === '2026-11-04' && /^Hoje · 04\/11\/2026/.test(r.rotulo) && r.faixa === '', '0h16: a ficha passou para hoje, aberta — ' + JSON.stringify(r));
    assert.ok(/Biscoito Teste toma Colírio Teste/.test(r.alarme), '0h16: o alarme do Colírio toca por cima da ficha — ' + JSON.stringify(r));
    // a passagem para hoje lê o que o toque em «Hoje» lê e não grava nada além do que ele grava: o controle é o próprio «Hoje»,
    // na mesma página (de volta a ontem pela seta, e «Hoje» de novo)
    const depois = await page.evaluate(() => ({ l: __banco.log.leituras.map((x) => ({ op: x.op, path: x.path })), g: __banco.log.gravacoes.map((x) => ({ op: x.op, path: x.path })) }));
    await semAlarme(page);
    await page.evaluate(() => fichaMudaDia(-1)); await esperar(800);
    const k = await page.evaluate(() => ({ l: __banco.log.leituras.length, g: __banco.log.gravacoes.length }));
    await page.evaluate(() => fichaHoje(true)); await esperar(1200);
    const hojeMao = await page.evaluate(() => ({ l: __banco.log.leituras.map((x) => ({ op: x.op, path: x.path })), g: __banco.log.gravacoes.map((x) => ({ op: x.op, path: x.path })) }));
    const permitidasL = caminhos(lidasAntes).concat(caminhos(hojeMao.l, k.l), LEITURAS_DE_FUNDO);
    const lidasNovas = caminhos(depois.l, L.l).filter((x) => permitidasL.indexOf(x) < 0);
    assert.deepStrictEqual(lidasNovas, [], 'leitura que o «Hoje» não faz');
    const permitidasG = caminhos(gravadasAntes).concat(caminhos(hojeMao.g, k.g));
    const gravNovas = caminhos(depois.g, L.g).filter((x) => permitidasG.indexOf(x) < 0);
    assert.deepStrictEqual(gravNovas, [], 'gravação que o «Hoje» não faz');
    assert.deepStrictEqual(erros, [], 'sem erro de página');
  } finally { await ctx.close(); }
  // o relatório com texto não salvo: a ficha espera (o texto fica), a faixa avisa; desfeito o texto e fora do campo, passa e toca
  const b = await abrir('2026-11-03T23:55:00-03:00', cenario('2026-11-03', { colirio: '00:15', logHoje: LOG_0311_TUDO_DADO }));
  try {
    const pg = b.page;
    await planilhaTresDias(pg); await esperar(800);
    await tocarHospede(pg, 'Biscoito Teste');
    await pg.evaluate(() => toggleRel('card-inicio')); await esperar(200);
    await pg.fill('#card-inicio textarea', 'Plantonista Teste escrevendo o jantar'); await pg.evaluate(() => document.activeElement && document.activeElement.blur());
    await andar(pg, 21 * 60 * 1000);   // 0h16
    let r = await estadoVirada(pg);
    const texto = await pg.evaluate(() => document.querySelector('#card-inicio textarea').value);
    assert.ok(r.dia === '2026-11-03' && texto === 'Plantonista Teste escrevendo o jantar', '0h16 com texto não salvo: a ficha espera e o texto fica — ' + JSON.stringify(r) + ' / ' + texto);
    // rodada 2 do QA: a faixa diz a dose (no jeito do alarme) e o que fazer para o alarme tocar, e gruda no alto
    assert.strictEqual(r.faixa, 'Remédio de hoje às 0h15: Biscoito Teste toma Colírio Teste. Para o alarme tocar, salve o relatório ou toque aqui', 'a faixa avisa');
    assert.strictEqual(await pg.evaluate(() => fichaVirarParaHoje()), 'espera: relatório não salvo');
    // o texto desfeito, mas o cursor no campo: ainda espera, e a faixa diz para fechar o teclado
    await pg.fill('#card-inicio textarea', '');
    assert.strictEqual(await pg.evaluate(() => fichaVirarParaHoje()), 'espera: campo com o cursor');
    const fx = await pg.evaluate(() => { fichaRelogioTick(); const f = document.getElementById('hf-ontem-faixa'); return { t: f.innerText, pos: getComputedStyle(f).position, cursor: (document.activeElement || {}).tagName }; });
    assert.ok(fx.t === 'Remédio de hoje às 0h15: Biscoito Teste toma Colírio Teste. Para o alarme tocar, feche o teclado ou toque aqui' && fx.pos === 'sticky' && fx.cursor === 'TEXTAREA', 'com o cursor no campo, a faixa no alto diz para fechar o teclado — ' + JSON.stringify(fx));
    await pg.evaluate(() => document.activeElement && document.activeElement.blur());
    await andar(pg, 1000);
    await andar(pg, 1000);
    r = await estadoVirada(pg);
    assert.ok(r.dia === '2026-11-04' && /Biscoito Teste toma Colírio Teste/.test(r.alarme), 'sem rascunho e fora do campo: passou para hoje e o alarme toca — ' + JSON.stringify(r));
    assert.deepStrictEqual(b.erros, [], 'sem erro de página');
  } finally { await b.ctx.close(); }
  // AS TRÊS GUARDAS (rodada 2 do QA: podiam ser apagadas sem a prova notar).
  // (1) Quem não recebe o alarme (a Gestão): a ficha fica em ontem, sem alarme — o alarme não é dela, e a virada não a tira do dia que ela lê.
  const g = await abrir('2026-11-03T23:55:00-03:00', cenario('2026-11-03', { colirio: '00:15', logHoje: LOG_0311_TUDO_DADO, papel: 'gestao' }));
  try {
    const pg = g.page;
    assert.ok(await contarSom(pg), 'o navegador da prova tem AudioContext');
    await planilhaTresDias(pg); await esperar(800);
    await pg.evaluate(() => irParaView('hospedagem')); await esperar(800);   // a Gestão entra pelo Início
    await tocarHospede(pg, 'Biscoito Teste');
    await andar(pg, 21 * 60 * 1000);   // 0h16
    const r = await estadoVirada(pg);
    const v = await pg.evaluate(() => fichaVirarParaHoje());
    assert.ok(v === 'espera: não recebe o alarme' && r.ficha === 'block' && r.dia === '2026-11-03' && r.alarme === '', 'Gestão às 0h16: a ficha fica em ontem — ' + v + ' / ' + JSON.stringify(r));
    // rodada 3 do QA: o bip da ficha só toca nas duas esperas (relatório não salvo e teclado aberto); a Gestão não é acordada
    assert.strictEqual(await pg.evaluate(() => { fichaRelogioTick(); return window.__som; }), 0, 'Gestão às 0h16: nenhum bip');
    assert.deepStrictEqual(g.erros, [], 'sem erro de página');
  } finally { await g.ctx.close(); }
  // (2) e (3): o Colírio de 03/11 às 22h sem registro e a Vitamina de hoje às 0h15. Às 23h55, o alarme das 22h abre por cima da ficha;
  // às 0h11 ele ainda está na tela: a ficha espera por ele («alarme na tela»). Depois do «Dei o remédio», com a conferência do registro
  // de ontem ainda sem voltar (como com a internet lenta: o estado «conferindo» é posto na mesma batida, para não depender do banco de
  // mentira), a ficha espera a dose de ontem («dose de ontem»), sem abrir a pergunta do «Hoje» por conta própria.
  const S6 = cenario('2026-11-03', { colirio: '22:00', logHoje: { 'a1_08-00': { quem: 'Plantonista Teste', ts: 1 }, 'a1_20-00': { quem: 'Plantonista Teste', ts: 2 } }, itens: { v1: { nome: 'Vitamina Teste', q: '1', u: 'comprimido', horarios: ['00:15'], tipo: 'suplemento', continuo: true, dataInicio: '2026-10-01' } } });
  S6.banco['auaulandia/medicacao-log/2026-11-03/' + K.bis]['v1_00-15'] = { quem: 'Plantonista Teste', ts: 6 };
  const h = await abrir('2026-11-03T23:55:00-03:00', S6);
  try {
    const pg = h.page;
    const caixa = () => pg.evaluate(() => { const x = document.getElementById('zAlertaoBox'); return x ? x.innerText.replace(/\s+/g, ' ').slice(0, 120) : ''; });
    assert.ok(await contarSom(pg), 'o navegador da prova tem AudioContext');
    await planilhaTresDias(pg); await esperar(800);
    await pg.evaluate(() => { const i = hospedes.findIndex((x) => /Biscoito/.test(x.nome)); abrirPlantao(i); }); await esperar(1500);
    await andar(pg, 15 * 60 * 1000);   // 0h10 e meia: a Vitamina das 0h15 já chegou à régua do alarme
    const r = await estadoVirada(pg);
    const v = await pg.evaluate(() => fichaVirarParaHoje());
    assert.ok(v === 'espera: alarme na tela' && r.dia === '2026-11-03' && /Colírio Teste/.test(r.alarme) && (await caixa()) === '', '0h11 com o alarme de ontem na tela: a ficha espera — ' + v + ' / ' + JSON.stringify(r));
    const bt = await pg.$('#despMed button:has-text("Dei o remédio")');
    assert.ok(bt, 'o alarme de ontem tem o «Dei o remédio»');
    await bt.tap(); await esperar(400);
    const c = await pg.evaluate(() => { __medOntemConf = null; __medOntemPedido = { dia: DIA_TELA_AUTO, ts: Date.now() };
      const est = zDiaOntemEstado(Date.now()), vira = fichaVirarParaHoje(), s0 = window.__som, tick = fichaRelogioTick();
      return { est, vira, tick, dia: dataKeyAtual(), alarme: !!despMedNaTela, bip: window.__som - s0 }; });
    assert.ok(c.est === 'conferindo' && c.vira === 'espera: dose de ontem' && c.dia === '2026-11-03' && !c.alarme && (await caixa()) === '', '0h11, a dose de ontem conferindo: a ficha espera, sem pergunta na tela — ' + JSON.stringify(c) + ' / ' + (await caixa()));
    assert.strictEqual(c.bip, 0, '0h11, a dose de ontem conferindo: a espera não é a do relatório nem a do teclado, e o relógio da ficha não bipa');
    // (o que vem depois da conferência é da 6.47 e depende do registro de ontem, que o banco de mentira não devolve à conferência: fica fora)
    assert.deepStrictEqual(h.erros, [], 'sem erro de página');
  } finally { await h.ctx.close(); }
});

// C14 (bloqueio 2 da rodada 1 do QA): no hóspede SEM RAÇÃO com check-in, a instrução da comida não vira «NÃO PODE».
prova('C14', 'SEM RAÇÃO com check-in: a instrução da comida aparece como «Observação da alimentação: Servir morno, em pote raso» na Alimentação, e nunca como «NÃO PODE: Servir morno…»', async () => {
  const S = cenario('2026-11-03'); S.estadias.est1.alimentacao = { sem_racao: true };
  const { ctx, page, erros } = await abrir('2026-11-03T19:40:00-03:00', S);
  try {
    await tocarHospede(page, 'Biscoito Teste');
    const r = await page.evaluate(() => { const c = document.getElementById('tp-alim'); if (c.classList.contains('collapsed')) toggleRel('tp-alim');
      return { alim: document.querySelector('#tp-alim .rel-body').innerText, naoPode: (document.querySelector('#hf-alim-topo .hf-naopode') || {}).innerText || '',
        obs: Array.from(document.querySelectorAll('#tp-alim .hf-alim-obs')).map((x) => x.innerText.replace(/\s+/g, ' ')), resumo: document.getElementById('tps-alim').innerText }; });
    assert.ok(!/NÃO PODE: Servir morno/.test(r.alim), 'a instrução da comida não vira NÃO PODE: ' + r.alim);
    assert.deepStrictEqual(r.obs, ['Observação da alimentação: Servir morno, em pote raso'], 'a instrução com o rótulo certo');
    assert.strictEqual(r.naoPode, 'NÃO PODE: frango · sem grãos', 'o NÃO PODE verdadeiro continua no alto');
    assert.ok(/SEM RAÇÃO — Biscoito Teste come a comida úmida da casa hoje/.test(r.alim) && /SEM RAÇÃO: comida úmida da casa/.test(r.resumo), 'o aviso SEM RAÇÃO continua: ' + r.resumo);
    assert.strictEqual((r.alim.match(/Servir morno/g) || []).length, 1, 'na Alimentação, a instrução uma vez só');
    // rodada 3 do QA: dentro do Relatório do Jantar (a caixa de jantaSlotRender), a mesma instrução, com o mesmo rótulo, e nunca «NÃO PODE»
    const jantar = await page.evaluate(() => { toggleRel('card-inicio'); const el = document.getElementById('janta-slot-inicio'); return { txt: el.innerText, linhas: Array.from(el.querySelectorAll('.janta-box > div')).map((d) => d.innerText.trim()) }; });
    assert.ok(!/NÃO PODE/.test(jantar.txt), 'o Relatório do Jantar sem «NÃO PODE: Servir morno»: ' + jantar.txt);
    assert.ok(jantar.linhas.indexOf('Observação da alimentação: Servir morno, em pote raso') >= 0 && /^SEM RAÇÃO — Biscoito Teste come a comida úmida da casa hoje\./.test(jantar.txt), 'a instrução de como servir, no Relatório do Jantar: ' + JSON.stringify(jantar));
    assert.deepStrictEqual(erros, [], 'sem erro de página');
  } finally { await ctx.close(); }
});

// C15 (bloqueio da rodada 2 do QA, segurança do FILHOt): o Relatório da noite pela metade (marcou «Como passou a noite?» e escreveu uma
// linha; ele não salva incompleto) segura a ficha em ontem a noite inteira. A dose de hoje não pode ficar muda: na hora dela (0h10 para a
// das 0h15, 6h55 para a das 7h), a faixa gruda no alto, logo abaixo da barra azul, onde ela estiver rolada, diz a dose e o que fazer, e o
// bip de sempre toca a cada batida; o texto fica. O toque na faixa pergunta antes de perder o texto; «Ir para a ficha de hoje» leva para
// hoje e o alarme toca por cima. Som = osciladores criados pelo AudioContext da página (o bipDespertador cria três por bip).
const contarSom = (page) => page.evaluate(() => {
  const AC0 = window.AudioContext || window.webkitAudioContext; if (!AC0) return false;
  window.__som = 0;
  window.AudioContext = function () { const ac = new AC0(); const co = ac.createOscillator.bind(ac); ac.createOscillator = function () { window.__som += 1; return co(); }; return ac; };
  return true;
});
const TEXTO_NOITE = 'Plantonista Teste: dormiu bem até agora';
const ondeEla = (page) => page.evaluate(() => {
  const f = document.getElementById('hf-ontem-faixa'), b = f.getBoundingClientRect(), azul = document.querySelector('.mobtop').getBoundingClientRect();
  const cx = Math.round(b.left + b.width / 2), cy = Math.round(b.top + b.height / 2), el = (cy > 0 && cy < innerHeight) ? document.elementFromPoint(cx, cy) : null;
  const ta = document.querySelector('#card-noite textarea'), tb = ta.getBoundingClientRect(), on = document.querySelector('#card-noite .obsline button.on');
  return { hora: new Date().toTimeString().slice(0, 5), dia: dataKeyAtual(), faixa: getComputedStyle(f).display !== 'none' ? f.innerText : '', pos: getComputedStyle(f).position,
    topo: Math.round(b.top), fim: Math.round(b.bottom), azulFim: Math.round(azul.bottom), porCima: !!(el && (el === f || f.contains(el))), rolagem: Math.round(scrollY),
    relNaTela: tb.bottom > 0 && tb.top < innerHeight, texto: ta.value, marca: on ? on.textContent : '', som: window.__som || 0,
    alarme: (() => { const d = document.getElementById('despMed'); return d && getComputedStyle(d).display !== 'none' ? d.innerText.replace(/\s+/g, ' ') : ''; })(),
    caixa: (() => { const x = document.getElementById('zAlertaoBox'); return x ? x.innerText.replace(/\s+/g, ' ') : ''; })() };
});
async function irAte(page, iso) { const agora = await page.evaluate(() => Date.now()); await page.mouse.move(12, 300); await andar(page, Math.max(0, Date.parse(iso) - agora - 31000)); }
prova('C15', 'Relatório da noite pela metade das 23h50 às 7h10: na hora da dose de hoje (0h10 e 6h55) a faixa gruda no alto, onde ela está, diz a dose e o que fazer, e o bip toca a cada batida; o texto fica; o toque na faixa pergunta antes de perder o texto', async () => {
  const S = cenario('2026-11-03', { colirio: '00:15', logHoje: LOG_0311_TUDO_DADO, itens: { v1: { nome: 'Vitamina Teste', q: '1', u: 'comprimido', horarios: ['07:00'], tipo: 'suplemento', continuo: true, dataInicio: '2026-10-01' } } });
  S.banco['auaulandia/medicacao-log/2026-11-03/' + K.bis]['v1_07-00'] = { quem: 'Plantonista Teste', ts: 5 };
  const { ctx, page, erros } = await abrir('2026-11-03T23:50:00-03:00', S);
  try {
    assert.ok(await contarSom(page), 'o navegador da prova tem AudioContext');
    await planilhaTresDias(page); await esperar(800);
    await tocarHospede(page, 'Biscoito Teste');
    await page.evaluate(() => toggleRel('card-noite')); await esperar(300);
    const marcou = await page.evaluate(() => { const b = document.querySelector('#card-noite .obsline .seg button'); b.click(); return b.textContent; });
    await page.fill('#card-noite textarea', TEXTO_NOITE);
    await page.evaluate(() => { document.activeElement && document.activeElement.blur(); document.querySelector('#card-noite textarea').scrollIntoView({ block: 'center' }); });
    await esperar(300);
    const intacto = (r) => r.texto === TEXTO_NOITE && r.marca === marcou && r.dia === '2026-11-03';
    // 0h05: a dose das 0h15 ainda não chegou à régua do alarme (5 minutos antes): sem som, a faixa no lugar de sempre (lá em cima)
    await irAte(page, '2026-11-04T00:05:00-03:00');
    let r = await ondeEla(page);
    assert.ok(intacto(r) && r.som === 0 && r.pos === 'static' && !r.porCima, '0h05: sem som e sem faixa grudada — ' + JSON.stringify(r));
    // 0h10: a faixa gruda logo abaixo da barra azul, por cima do relatório onde ela está, e o bip toca a cada batida
    for (const [quando, txt] of [['2026-11-04T00:10:20-03:00', 'Remédio de hoje às 0h15: Biscoito Teste toma Colírio Teste. Para o alarme tocar, salve o relatório ou toque aqui'],
      ['2026-11-04T06:55:20-03:00', 'Remédio de hoje às 0h15: Biscoito Teste toma Colírio Teste (e mais 1 dose). Para o alarme tocar, salve o relatório ou toque aqui']]) {
      await irAte(page, quando);
      r = await ondeEla(page);
      assert.ok(intacto(r) && r.faixa === txt, quando.slice(11, 16) + ': a faixa diz a dose e o texto fica — ' + JSON.stringify(r));
      assert.ok(r.pos === 'sticky' && r.porCima && r.relNaTela && r.rolagem > 1000 && r.topo >= r.azulFim - 1 && r.topo <= r.azulFim + 2 && r.fim <= 667, quando.slice(11, 16) + ': a faixa à vista, abaixo da barra azul, com ela rolada no relatório — ' + JSON.stringify(r));
      assert.ok(r.som > 0, quando.slice(11, 16) + ': o bip tocou — ' + JSON.stringify(r));
      const antes = r.som;
      await andar(page, 0);
      r = await ondeEla(page);
      assert.ok(r.som > antes && intacto(r), quando.slice(11, 16) + ': o bip toca de novo na batida seguinte — ' + antes + ' → ' + r.som);
    }
    // 7h10: ainda espera, e o texto continua
    await irAte(page, '2026-11-04T07:10:00-03:00');
    r = await ondeEla(page);
    assert.ok(intacto(r) && r.pos === 'sticky' && r.porCima && r.alarme === '', '7h10: o texto fica — ' + JSON.stringify(r));
    // o toque na faixa: pergunta antes; «Continuar o relatório» fica em ontem, com o texto, e mostra o botão de salvar
    await page.tap('#hf-ontem-faixa'); await esperar(300);
    r = await ondeEla(page);
    assert.ok(/^REMÉDIO DE HOJE NA HORA Remédio de hoje às 0h15: Biscoito Teste toma Colírio Teste \(e mais 1 dose\)\. «Relatório da Noite» ainda não foi salvo\. Indo agora para a ficha de hoje, o que não foi salvo se perde\. Ir para a ficha de hoje Continuar o relatório$/.test(r.caixa) && intacto(r),
      'o toque na faixa pergunta — ' + JSON.stringify(r));
    await page.tap('#zAlertaoBox button:has-text("Continuar o relatório")'); await esperar(400);
    r = await ondeEla(page);
    const salvarNaTela = await page.evaluate(() => { const b = document.querySelector('#card-noite .actions button').getBoundingClientRect(); return b.top >= 0 && b.bottom <= innerHeight; });
    assert.ok(r.caixa === '' && intacto(r) && salvarNaTela, '«Continuar o relatório»: o texto fica e o «Passar plantão (salvar)» à vista — ' + JSON.stringify(r));
    // «Ir para a ficha de hoje»: a ficha passa para hoje e o alarme do Colírio toca por cima dela
    await page.tap('#hf-ontem-faixa'); await esperar(300);
    await page.tap('#zAlertaoBox button:has-text("Ir para a ficha de hoje")'); await esperar(1200);
    await andar(page, 0);
    r = await estadoVirada(page);
    assert.ok(r.ficha === 'block' && r.dia === '2026-11-04' && /Biscoito Teste toma Colírio Teste/.test(r.alarme) && r.faixa === '', '«Ir para a ficha de hoje»: hoje, com o alarme por cima — ' + JSON.stringify(r));
    assert.deepStrictEqual(erros, [], 'sem erro de página');
  } finally { await ctx.close(); }
});

// ================================================================== rodada 3 do QA (04/11/2026)
// O Relatório da noite pela metade: marca «Como passou a noite?», escreve uma linha e rola até ela (ele não salva incompleto).
async function rascunhoNoite(page) {
  await page.evaluate(() => toggleRel('card-noite')); await esperar(300);
  const marcou = await page.evaluate(() => { const b = document.querySelector('#card-noite .obsline .seg button'); b.click(); return b.textContent; });
  await page.fill('#card-noite textarea', TEXTO_NOITE);
  await page.evaluate(() => { document.activeElement && document.activeElement.blur(); document.querySelector('#card-noite textarea').scrollIntoView({ block: 'center' }); });
  await esperar(300);
  return marcou;
}
const FAIXA_ONTEM = 'Esta ficha é de ontem: toque para ver a de hoje';
const naHora = (page) => page.evaluate(() => ({ vira: fichaVirarParaHoje(), med: document.getElementById('tps-med').innerText,
  critico: Array.from(document.querySelectorAll('#tps-med .tp-sub-critico')).map((x) => x.innerText).join(' | ') }));

// C16 (bloqueio da rodada 3 do QA, segurança do FILHOt): com a ficha segurada em ontem, a dose «de hoje» é a da agenda que vale HOJE
// (a regra do alarme: início, fim e frequência). O remédio que terminou ontem, o de dia da semana que não é hoje e o de dia sim, dia não
// que foi ontem não grudam a faixa nem tocam o bip (nem o suspenso pela veterinária, nem o anulado); o que começa hoje leva a ficha para
// hoje com o alarme por cima e, com o relatório pela metade, gruda a faixa e toca o bip. A faixa e o resumo do Medicamento dizem o mesmo
// remédio. Hoje (04/11/2026) é quarta; ontem, terça. Cada cena roda duas vezes: com a agenda da casa em memória, como no aparelho de
// verdade (o ouvinte de auaulandia/medicacao-agenda que o login liga, MED_AGENDA_GERAL; o mundo de teste não o liga), e só com a agenda
// do FILHOt da ficha (MED_AGENDA_ITENS), a que vale se a da casa não chegou.
const NAO_VALEM_HOJE = { c1: { nome: 'Colírio Teste', q: '1', u: 'gota', horarios: ['00:15'], tipo: 'medicamento', continuo: false, dataInicio: '2026-10-25', dataFim: '2026-11-03' },
  f1: { nome: 'Vermífugo Teste', q: '1', u: 'comprimido', horarios: ['00:15'], tipo: 'medicamento', continuo: true, dataInicio: '2026-10-01', freq: { tipo: 'dias', dias: ['ter'] } },
  p1: { nome: 'Probiótico Teste', q: '1', u: 'sachê', horarios: ['00:15'], tipo: 'suplemento', continuo: true, dataInicio: '2026-11-03', freq: { tipo: 'alternado' } },
  s1: { nome: 'Gotas Suspensas Teste', q: '2', u: 'gota', horarios: ['00:15'], tipo: 'medicamento', continuo: true, dataInicio: '2026-10-01', suspenso: true },
  x1: { nome: 'Xarope Anulado Teste', q: '5', u: 'ml', horarios: ['00:15'], tipo: 'medicamento', continuo: true, dataInicio: '2026-10-01', anulado: { quem: 'Gestão Teste', ts: 1 } } };
const COMECA_HOJE = { n1: { nome: 'Antibiótico Teste', q: '1', u: 'comprimido', horarios: ['00:15'], tipo: 'medicamento', continuo: true, dataInicio: '2026-11-04' } };
const LOG_0311_COM_VERMIFUGO = Object.assign({}, LOG_0311_TUDO_DADO, { 'f1_00-15': { quem: 'Plantonista Teste', ts: 4 }, 'p1_00-15': { quem: 'Plantonista Teste', ts: 5 } });
// A agenda da casa em memória, como no login (wireFirebaseListeners): o mesmo ouvinte, no banco de mentira; devolve as chaves que chegaram.
const agendaDaCasa = (page) => page.evaluate(() => new Promise((ok) => {
  DB.ref('auaulandia/medicacao-agenda').on('value', (s) => { MED_AGENDA_GERAL = s.val() || {}; MED_AGENDA_GERAL_CARREGADA = true; ok(Object.keys(MED_AGENDA_GERAL)); });
}));
prova('C16', 'ficha segurada em ontem: o remédio que terminou ontem, o de terça (hoje é quarta), o de dia sim, dia não, o suspenso e o anulado não grudam a faixa nem tocam o bip; o que começa hoje leva a ficha para hoje com o alarme por cima e, com o relatório pela metade, gruda a faixa com o nome dele, igual ao resumo (com a agenda da casa em memória e sem ela)', async () => {
  for (const casa of [true, false]) {
    const modo = casa ? '[agenda da casa] ' : '[só a do FILHOt] ';
    const preparar = async (page) => {
      if (!casa) return;
      const ks = await agendaDaCasa(page);
      assert.ok(ks.indexOf(K.bis) >= 0, modo + 'a agenda da casa chegou: ' + ks.join(', '));
    };
    // (1) o caso do QA: o Colírio terminou ontem, o Vermífugo é só às terças, o Probiótico foi ontem (dia sim, dia não), as Gotas estão
    // suspensas e o Xarope anulado; tudo de 03/11 dado; o Relatório da noite pela metade
    const a = await abrir('2026-11-03T23:50:00-03:00', cenario('2026-11-03', { logHoje: LOG_0311_COM_VERMIFUGO, itens: NAO_VALEM_HOJE }));
    try {
      const page = a.page;
      assert.ok(await contarSom(page), 'o navegador da prova tem AudioContext');
      await planilhaTresDias(page); await esperar(800); await preparar(page);
      await tocarHospede(page, 'Biscoito Teste');
      const marcou = await rascunhoNoite(page);
      for (const quando of ['2026-11-04T00:10:20-03:00', '2026-11-04T00:40:00-03:00']) {
        await irAte(page, quando);
        const r = await ondeEla(page), n = await naHora(page);
        assert.ok(r.dia === '2026-11-03' && r.texto === TEXTO_NOITE && r.marca === marcou, modo + quando.slice(11, 16) + ': a ficha em ontem, o texto intacto — ' + JSON.stringify(r));
        assert.ok(r.faixa === FAIXA_ONTEM && r.pos === 'static' && r.som === 0 && r.alarme === '' && n.vira === '', modo + quando.slice(11, 16) + ': nenhum remédio de hoje, sem faixa grudada e sem bip — ' + JSON.stringify(r) + ' / ' + JSON.stringify(n));
        assert.ok(n.med === 'Todas as doses de 03/11 registradas' && n.critico === '', modo + quando.slice(11, 16) + ': o resumo diz o mesmo — ' + JSON.stringify(n));
      }
      assert.deepStrictEqual(a.erros, [], modo + 'sem erro de página');
    } finally { await a.ctx.close(); }
    // (2) o Antibiótico começa hoje às 0h15, sem relatório pela metade: a faixa e o resumo avisam antes; na hora, a ficha passa para hoje e o alarme toca
    const b = await abrir('2026-11-03T23:50:00-03:00', cenario('2026-11-03', { logHoje: { 'a1_08-00': LOG_0311_TUDO_DADO['a1_08-00'], 'a1_20-00': LOG_0311_TUDO_DADO['a1_20-00'] }, itens: COMECA_HOJE }));
    try {
      const page = b.page;
      await planilhaTresDias(page); await esperar(800); await preparar(page);
      await tocarHospede(page, 'Biscoito Teste');
      await irAte(page, '2026-11-04T00:05:00-03:00');
      let r = await estadoVirada(page);
      assert.ok(r.dia === '2026-11-03' && r.faixa === 'Esta ficha é de ontem. Remédio de hoje às 0h15: toque para ver a de hoje' && r.critico === 'Remédio de hoje às 0h15: Antibiótico Teste', modo + '0h05: a faixa e o resumo avisam do que começa hoje — ' + JSON.stringify(r));
      await page.mouse.move(20, 20);
      await irAte(page, '2026-11-04T00:16:00-03:00');
      r = await estadoVirada(page);
      assert.ok(r.ficha === 'block' && r.dia === '2026-11-04' && /^Hoje · 04\/11\/2026/.test(r.rotulo) && /Biscoito Teste toma Antibiótico Teste/.test(r.alarme), modo + '0h16: a ficha passou para hoje e o alarme do Antibiótico toca por cima dela — ' + JSON.stringify(r));
      assert.deepStrictEqual(b.erros, [], modo + 'sem erro de página');
    } finally { await b.ctx.close(); }
    // (3) todos às 0h15 e o Relatório da noite pela metade: a faixa gruda e toca só pelo Antibiótico; o resumo diz o mesmo remédio
    const c = await abrir('2026-11-03T23:50:00-03:00', cenario('2026-11-03', { logHoje: LOG_0311_COM_VERMIFUGO, itens: Object.assign({}, NAO_VALEM_HOJE, COMECA_HOJE) }));
    try {
      const page = c.page;
      assert.ok(await contarSom(page), 'o navegador da prova tem AudioContext');
      await planilhaTresDias(page); await esperar(800); await preparar(page);
      await tocarHospede(page, 'Biscoito Teste');
      const marcou = await rascunhoNoite(page);
      await irAte(page, '2026-11-04T00:10:20-03:00');
      const r = await ondeEla(page), n = await naHora(page);
      assert.ok(r.dia === '2026-11-03' && r.texto === TEXTO_NOITE && r.marca === marcou, modo + '0h10: o texto intacto — ' + JSON.stringify(r));
      assert.ok(r.faixa === 'Remédio de hoje às 0h15: Biscoito Teste toma Antibiótico Teste. Para o alarme tocar, salve o relatório ou toque aqui' && r.pos === 'sticky' && r.porCima && r.som > 0,
        modo + '0h10: a faixa grudada e o bip, só pelo remédio que vale hoje — ' + JSON.stringify(r));
      assert.ok(n.vira === 'espera: relatório não salvo' && n.critico === 'Remédio de hoje às 0h15: Antibiótico Teste' && !/Colírio|Vermífugo|Probiótico|Suspensas|Anulado/.test(n.med + ' ' + r.faixa), modo + '0h10: o resumo diz o mesmo remédio da faixa — ' + JSON.stringify(n));
      assert.deepStrictEqual(c.erros, [], modo + 'sem erro de página');
    } finally { await c.ctx.close(); }
  }
});

// C17 (observação da rodada 3 do QA: risco de dose dupla): com o Relatório da noite pela metade e a faixa grudada pela dose das 0h15,
// a outra plantonista registra a dose no aparelho dela às 0h12. O registro chega ao retrato vivo do dia de hoje (o mesmo que o alarme
// lê com a tela em hoje, auaulandia/medicacao-log/<hoje>): a faixa solta na hora, o resumo deixa de pedir o remédio e o bip para; este
// aparelho não grava nada, e a leitura a mais é só esse retrato (o banco de mentira não entrega child_* com a chave do filho: a prova
// entrega o registro ao retrato como o Firebase faria).
prova('C17', 'a dose de hoje registrada em outro aparelho cala a faixa e o bip da ficha segurada em ontem: a faixa solta na hora, o resumo para de pedir o remédio, sem gravação e sem leitura além do registro de hoje', async () => {
  const { ctx, page, erros } = await abrir('2026-11-03T23:50:00-03:00', cenario('2026-11-03', { colirio: '00:15', logHoje: LOG_0311_TUDO_DADO }));
  try {
    assert.ok(await contarSom(page), 'o navegador da prova tem AudioContext');
    await planilhaTresDias(page); await esperar(800);
    await tocarHospede(page, 'Biscoito Teste');
    const marcou = await rascunhoNoite(page);
    const L0 = await page.evaluate(() => ({ l: __banco.log.leituras.length, g: __banco.log.gravacoes.length, lidas: __banco.log.leituras.map((x) => ({ op: x.op, path: x.path })) }));
    await irAte(page, '2026-11-04T00:10:20-03:00');
    let r = await ondeEla(page);
    assert.ok(r.pos === 'sticky' && /toma Colírio Teste/.test(r.faixa) && r.som > 0, '0h10: a faixa grudada e o bip — ' + JSON.stringify(r));
    await irAte(page, '2026-11-04T00:12:00-03:00');
    const entregue = await page.evaluate((k) => {
      const P = 'auaulandia/medicacao-log/2026-11-04';
      window.__banco.poe(P + '/' + k + '/c1_00-15', { quem: 'Outra Plantonista Teste', ts: Date.now() });
      const m = Z_MAPAS[P]; if (!m || !m.pronto) return 'sem o retrato vivo de hoje';
      m.mapa[k] = window.__banco.ler(P + '/' + k); Object.keys(m.slots).forEach((x) => m.slots[x](m.mapa));
      return Object.keys(m.slots).join(',');
    }, K.bis);
    assert.ok(/_fichaDoseHoje/.test(entregue), 'a ficha escuta o registro de hoje: ' + entregue);
    await esperar(300);
    r = await ondeEla(page);
    let n = await naHora(page);
    const som0 = r.som;
    assert.ok(r.faixa === FAIXA_ONTEM && r.pos === 'static' && r.texto === TEXTO_NOITE && r.marca === marcou && r.dia === '2026-11-03', '0h12, logo depois do registro (sem esperar a batida): a faixa solta — ' + JSON.stringify(r));
    assert.ok(n.med === 'Todas as doses de 03/11 registradas' && n.critico === '' && n.vira === '', '0h12: o resumo para de pedir o Colírio — ' + JSON.stringify(n));
    for (const quando of ['2026-11-04T00:30:00-03:00', '2026-11-04T02:00:00-03:00']) {
      await irAte(page, quando);
      r = await ondeEla(page); n = await naHora(page);
      assert.ok(r.som === som0 && r.pos === 'static' && r.alarme === '' && n.vira === '' && r.texto === TEXTO_NOITE, quando.slice(11, 16) + ': nenhum bip a mais — ' + som0 + ' → ' + JSON.stringify(r));
    }
    // a anulada não conta: anulado o registro da outra plantonista, a faixa volta a grudar e o bip volta
    await page.evaluate((k) => { const P = 'auaulandia/medicacao-log/2026-11-04', m = Z_MAPAS[P];
      m.mapa[k] = { 'c1_00-15': { quem: 'Outra Plantonista Teste', ts: Date.now(), anulada: { quem: 'Gestão Teste', ts: Date.now() } } }; Object.keys(m.slots).forEach((x) => m.slots[x](m.mapa)); }, K.bis);
    await andar(page, 0);
    r = await ondeEla(page);
    assert.ok(r.pos === 'sticky' && /toma Colírio Teste/.test(r.faixa) && r.som > som0, 'a dose anulada volta a pedir o remédio — ' + JSON.stringify(r));
    const D = await page.evaluate(() => ({ lidas: __banco.log.leituras.map((x) => ({ op: x.op, path: x.path })), grav: __banco.log.gravacoes.map((x) => ({ op: x.op, path: x.path })) }));
    // as leituras do registro de doses depois de a ficha abrir: só o retrato do dia de hoje (o resto do app tem relógios próprios
    // nessas duas horas, que não são da ficha)
    const antesL = L0.lidas.map((x) => x.op + ' ' + x.path);
    const novasLog = Array.from(new Set(D.lidas.slice(L0.l).filter((x) => /medicacao-log/.test(x.path) && antesL.indexOf(x.op + ' ' + x.path) < 0).map((x) => x.path)));
    assert.deepStrictEqual(novasLog, ['auaulandia/medicacao-log/2026-11-04'], 'só o registro de hoje, o dia inteiro, o mesmo retrato do alarme: ' + novasLog.join(', '));
    assert.deepStrictEqual(D.grav.slice(L0.g).filter((x) => /medicacao/.test(x.path)), [], 'este aparelho não grava nenhuma dose');
    assert.deepStrictEqual(erros, [], 'sem erro de página');
  } finally { await ctx.close(); }
});

// C18 (observação da rodada 3 do QA: guardas sem prova). (1) Quem tinha saída marcada para ontem («Dormiu · sai hoje») já foi para casa:
// a dose de hoje dele não gruda a faixa nem toca o bip (e, sem a saída, gruda e toca: é a agenda da casa em memória, MED_AGENDA_GERAL).
// (2) Salvo o relatório, a faixa solta na hora, sem esperar a batida; na batida seguinte, a ficha passa para hoje e o alarme toca.
// (O bip só nas duas esperas está na C13: a Gestão e a dose de ontem conferindo.)
prova('C18', 'quem saiu ontem não gruda a faixa nem toca o bip pela dose de hoje (sem a saída, gruda e toca); salvo o relatório, a faixa solta na hora e, na batida seguinte, a ficha passa para hoje com o alarme', async () => {
  const a = await abrir('2026-11-03T23:50:00-03:00', cenario('2026-11-03', { logHoje: LOG_0311_TUDO_DADO }));
  try {
    const page = a.page;
    assert.ok(await contarSom(page), 'o navegador da prova tem AudioContext');
    await planilhaTresDias(page); await esperar(800);
    await tocarHospede(page, 'Biscoito Teste');
    // a Mel toma as Gotas às 0h15 e tem saída marcada para ontem; a agenda dela só chega pela agenda da casa em memória (o ouvinte de
    // auaulandia/medicacao-agenda que o login liga), como no aparelho de verdade
    const k = await page.evaluate(() => { const mel = hospedes.find((h) => /^Mel Teste/.test(h.nome)), km = medAgendaKey(mel);
      __banco.poe('auaulandia/medicacao-agenda/' + km + '/itens', { g1: { nome: 'Gotas Teste', q: '2', u: 'gota', horarios: ['00:15'], tipo: 'medicamento', continuo: true, dataInicio: '2026-10-01' } });
      mel.saidaHoje = true; return km; });
    const ks = await agendaDaCasa(page);
    assert.ok(k && ks.indexOf(k) >= 0 && ks.indexOf(K.bis) >= 0, 'a agenda da casa chegou, com a Mel e o Biscoito: ' + ks.join(', '));
    const marcou = await rascunhoNoite(page);
    await irAte(page, '2026-11-04T00:10:20-03:00');
    let r = await ondeEla(page), n = await naHora(page);
    const saiu = await page.evaluate(() => hospedes.find((h) => /^Mel Teste/.test(h.nome)).saidaHoje);
    assert.ok(saiu === true && r.faixa === FAIXA_ONTEM && r.pos === 'static' && r.som === 0 && n.vira === '' && r.texto === TEXTO_NOITE && r.marca === marcou, '0h10, a Mel saiu ontem: sem faixa grudada e sem bip — ' + JSON.stringify(r) + ' / ' + JSON.stringify(n));
    // o controle: a mesma Mel sem a saída
    await page.evaluate(() => { hospedes.find((h) => /^Mel Teste/.test(h.nome)).saidaHoje = false; });
    await andar(page, 0);
    r = await ondeEla(page); n = await naHora(page);
    assert.ok(r.faixa === 'Remédio de hoje às 0h15: Mel Teste toma Gotas Teste. Para o alarme tocar, salve o relatório ou toque aqui' && r.pos === 'sticky' && r.som > 0 && n.vira === 'espera: relatório não salvo',
      'a Mel na casa: a faixa gruda e o bip toca — ' + JSON.stringify(r) + ' / ' + JSON.stringify(n));
    assert.deepStrictEqual(a.erros, [], 'sem erro de página');
  } finally { await a.ctx.close(); }
  // (2) o Relatório do Jantar com texto não salvo segura a ficha; salvo, a faixa solta antes da batida seguinte
  const b = await abrir('2026-11-03T23:55:00-03:00', cenario('2026-11-03', { colirio: '00:15', logHoje: LOG_0311_TUDO_DADO }));
  try {
    const page = b.page;
    await planilhaTresDias(page); await esperar(800);
    await tocarHospede(page, 'Biscoito Teste');
    await page.evaluate(() => toggleRel('card-inicio')); await esperar(200);
    await page.fill('#card-inicio textarea', '80 g de ração Teste');
    await page.evaluate(() => document.activeElement && document.activeElement.blur());
    await andar(page, 21 * 60 * 1000);   // 0h16
    const fx = () => page.evaluate(() => { const f = document.getElementById('hf-ontem-faixa'); return { t: getComputedStyle(f).display !== 'none' ? f.innerText : '', pos: getComputedStyle(f).position, dia: dataKeyAtual(),
      st: (document.getElementById('status-inicio') || {}).innerText || '' }; });
    let f = await fx();
    assert.ok(f.pos === 'sticky' && /Para o alarme tocar, salve o relatório/.test(f.t) && f.dia === '2026-11-03', '0h16: a faixa grudada pelo relatório não salvo — ' + JSON.stringify(f));
    await page.evaluate(() => { document.querySelectorAll('#card-inicio .obsline').forEach((l) => { if (l.style.display === 'none' || l.closest('.med-confirm-slot') || l.querySelector('button.on')) return; const x = l.querySelector('.seg button'); if (x) x.click(); });
      document.getElementById('passou-inicio').value = 'Plantonista Teste'; salvarRelatorioCard('inicio'); });
    await esperar(400);
    f = await fx();
    assert.ok(/salvo/i.test(f.st) && f.pos === 'static' && !/Para o alarme tocar/.test(f.t) && f.dia === '2026-11-03', 'salvo o relatório, a faixa solta na hora, sem esperar a batida — ' + JSON.stringify(f));
    await andar(page, 0);
    const r = await estadoVirada(page);
    assert.ok(r.dia === '2026-11-04' && /Biscoito Teste toma Colírio Teste/.test(r.alarme), 'na batida seguinte, a ficha passa para hoje e o alarme toca — ' + JSON.stringify(r));
    assert.deepStrictEqual(b.erros, [], 'sem erro de página');
  } finally { await b.ctx.close(); }
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
