'use strict';

// Sanfonas «clica abre, clica recolhe» em cinco telas (Adriana, 28/out/2026, decisão 5 aprovada): Pendências com o tutor, Plantão da
// noite (Protocolo e Café), Conferência do check-in («Sem check-in»), Quem vai embora hoje e Vencimentos. O princípio é só mudar a
// casca: o conteúdo de cada bloco (botões, textos, ações) continua o mesmo. Esta prova monta o app inteiro num sandbox, com dados
// inventados, e confere: as sanfonas existem com ids únicos, o que havia antes continua dentro delas, nascem abertas ou fechadas como
// combinado, o aparelho lembra o que a pessoa abriu ou fechou, e a área protegida do check-in do Day Care está idêntica à do commit
// 870f235. Sem rede e sem banco real: banco de mentira, nomes «Exemplo», tudo inventado.

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const APP = path.join(__dirname, '..', 'auaulandia', 'index.html');
const html = fs.readFileSync(APP, 'utf8');

let n = 0;
const fila = [];
function prova(nome, fn) { fila.push([nome, fn]); }

// ------------------------------------------------------------------------- o app inteiro num sandbox, sem rede e sem banco
function universal(name) {
  const fn = function () { return fn; };
  return new Proxy(fn, {
    get(t, p) { if (p === Symbol.toPrimitive) return () => ''; if (p === 'then') return undefined; if (p in t) return t[p]; return universal(name + '.' + String(p)); },
    set() { return true; }, apply() { return universal(name + '()'); }, construct() { return universal('new ' + name); },
  });
}
function elemento(id) {
  return { id, innerHTML: '', style: { setProperty() {} }, dataset: {}, className: '', value: '', textContent: '', open: false, offsetParent: {}, offsetHeight: 0,
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    querySelector() { return null; }, querySelectorAll() { return []; }, addEventListener() {}, setAttribute() {}, getAttribute() { return null; },
    appendChild() {}, scrollIntoView() {}, click() {}, closest() { return null; } };
}
function scriptsDoApp(texto) {
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi; let m; const todos = [];
  while ((m = re.exec(texto)) !== null) todos.push(m[1]);
  let principal = '', k = -1;
  todos.forEach((t, i) => { if (t.length > principal.length) { principal = t; k = i; } });
  return todos.slice(0, k).join('\n;\n') + '\n;\n' + principal;
}
function guardaLocal() {
  const m = {};
  return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: (k) => { delete m[k]; }, _m: m };
}
function abrirApp() {
  const els = {};
  const getEl = (id) => (els[id] = els[id] || elemento(id));
  const corpo = { dataset: { role: 'gestao' }, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, appendChild() {}, style: {}, addEventListener() {}, setAttribute() {}, getAttribute() { return null; } };
  const doc = { body: corpo, head: { appendChild() {} }, documentElement: universal('documentElement'), getElementById: getEl, querySelector() { return null; }, querySelectorAll() { return []; }, createElement() { return elemento('novo'); }, addEventListener() {}, getElementsByClassName() { return []; }, getElementsByTagName() { return []; } };
  const nunca = new Promise(() => {});
  const local = guardaLocal();
  const sandbox = { console, Date, Math, JSON, Object, Array, String, Number, Boolean, parseInt, parseFloat, isNaN, isFinite, RegExp, Promise, Map, Set, Symbol, encodeURIComponent, decodeURIComponent,
    setTimeout() {}, clearTimeout() {}, setInterval() {}, clearInterval() {}, requestAnimationFrame() {}, performance: { now() { return 0; } }, document: doc,
    firebase: { initializeApp() { return {}; }, auth() { return { signInAnonymously() { return nunca; }, onAuthStateChanged() {} }; }, database() { return { ref() { return universal('ref'); } }; } },
    localStorage: local, navigator: { userAgent: 'prova', onLine: true }, location: { href: 'https://prova.local/', reload() {}, hostname: 'prova.local' },
    Blob: class Blob {}, alert() {}, confirm() { return true; }, prompt() { return ''; }, scrollTo() {}, addEventListener() {}, getComputedStyle() { return {}; } };
  sandbox.window = sandbox; sandbox.globalThis = sandbox; sandbox.self = sandbox;
  const ctx = vm.createContext(sandbox);
  vm.runInContext(scriptsDoApp(html), ctx, { filename: 'index.html#script', timeout: 30000 });
  const run = (c) => vm.runInContext(c, ctx);
  return { ctx, run, els, doc, local };
}

const A = abrirApp();
const { run, els, doc, local } = A;
run('var __coHojeReal=coCheckoutsDeHojeHTML;');   // as provas de «Quem vai embora hoje» trocam esta função por uma de mentira; a dos «Check-outs de hoje» usa a verdadeira
const json = (v) => JSON.parse(JSON.stringify(v));
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);
// Zera o que o aparelho guardou e o cache da casca (a prova de cada tela começa do zero).
function limparAparelho() { Object.keys(local._m).forEach((k) => delete local._m[k]); run('PREV_SEC=null;'); Object.keys(els).forEach((k) => delete els[k]); }
// Define uma variável do app a partir de um valor JSON.
function defina(nome, valor) { A.ctx.__v = valor; run(nome + '=__v;'); }
// O texto de uma função do app (para a prova olhar o que ela escreve).
const fonte = (nome) => run('String(' + nome + ')');
// Do começo da função no arquivo até a próxima do mesmo nível.
function corpoDe(nome) {
  const i = html.search(new RegExp('\\n  (async )?function ' + nome + '\\('));
  assert.ok(i >= 0, 'função ausente: ' + nome);
  const j = html.slice(i + 10).search(/\n  (async )?function \w+\(/);
  return html.slice(i, j < 0 ? undefined : i + 10 + j);
}
// O trecho de uma tela estática (da abertura da <section> até a seguinte).
function telaHtml(id) {
  const i = html.indexOf('<section class="view" id="' + id + '"');
  assert.ok(i >= 0, 'tela ausente: ' + id);
  const j = html.indexOf('<section class="view"', i + 10);
  return html.slice(i, j);
}
// O <details> estático de uma sanfona (da abertura ao fechamento do corpo).
function sanfonaEstatica(id) {
  const i = html.indexOf('<details class="prev-sec" id="prevSec_' + id + '"');
  assert.ok(i >= 0, 'sanfona estática ausente: ' + id);
  const j = html.indexOf('</details>', i);
  return html.slice(i, j + 10);
}
const textoLimpo = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const idsDe = (s) => (s.match(/ id="prevSec_([^"]+)"/g) || []).map((x) => x.slice(' id="prevSec_'.length, -1));
const aberta = (s) => / open[ >]/.test(s.slice(0, s.indexOf('<summary')));

// ------------------------------------------------------------------------- a casca: a sanfona escrita no HTML segue a de prevSecHTML
prova('a casca estática (sanfona escrita no HTML) é a mesma de prevSecHTML, com o padrão de nascença lido por ontoggle', () => {
  const dinamica = run("prevSecHTML('rcp-x','Titulo','<span id=\"prevConta_rcp-x\"></span>','CORPO',false,true)");
  const cabeca = dinamica.slice(0, dinamica.indexOf('<div class="prev-sec-corpo">'));
  ['rcp-chamados', 'rcp-estoque', 'rcp-racao', 'rcp-ocorr-hosp', 'rcp-ocorr-dc', 'plantao-protocolo', 'plantao-cafe'].forEach((id) => {
    const est = sanfonaEstatica(id);
    const cab = est.slice(0, est.indexOf('<div class="prev-sec-corpo">'));
    // mesma estrutura: details.prev-sec, summary com nome, contas (com id da conta), seta; o ontoggle lê data-padrao
    assert.ok(/^<details class="prev-sec" id="prevSec_[^"]+"( open)? ontoggle="prevSecVirar\('[^']+',this\.open,this\.dataset\.padrao==='1'\)"><summary>/.test(cab), id);
    assert.ok(/<span class="prev-sec-contas" id="prevConta_[^"]+"><\/span><span class="prev-sec-seta" aria-hidden="true">⌄<\/span><\/summary>$/.test(cab), id);
    assert.ok(new RegExp('prevSecVirar\\(\'' + id + '\'').test(cab), 'o ontoggle guarda pelo id da própria sanfona');
  });
  assert.ok(/<summary><span class="prev-sec-nome">Titulo<\/span><span class="prev-sec-contas">/.test(cabeca) && /<span class="prev-sec-seta" aria-hidden="true">⌄<\/span><\/summary>$/.test(cabeca), 'a casca dinâmica de referência');
  // o corpo fecha com </div></details>
  assert.ok(/<\/div><\/details>\s*$/.test(sanfonaEstatica('rcp-chamados')) || sanfonaEstatica('rcp-chamados').endsWith('</details>'));
});

prova('prevSecSincronizar: põe o selo, o padrão e o aberto/fechado guardado; o padrão de nascença não vira «fechei» guardado', () => {
  limparAparelho();
  const sec = els['prevSec_rcp-estoque'] = elemento('prevSec_rcp-estoque');
  const conta = els['prevConta_rcp-estoque'] = elemento('prevConta_rcp-estoque');
  run("prevSecSincronizar('rcp-estoque','<b>2</b>',true)");
  assert.strictEqual(conta.innerHTML, '<b>2</b>');
  assert.strictEqual(sec.dataset.padrao, '1');
  assert.strictEqual(sec.open, true, 'com pendência nasce aberta');
  // sem pendência: nasce fechada, e isso NÃO fica guardado como «a pessoa fechou»
  run("prevSecSincronizar('rcp-estoque','<b>0</b>',false)");
  assert.strictEqual(sec.open, false);
  assert.strictEqual(sec.dataset.padrao, '0');
  assert.deepStrictEqual(json(local._m), {}, 'nada guardado: foi o padrão, não uma escolha');
  // o ontoggle da casca estática (aberto = padrão) também não grava
  run("prevSecVirar('rcp-estoque', this_open, false)".replace('this_open', 'false'));
  assert.deepStrictEqual(json(local._m), {}, 'fechar o que já nasce fechado não grava');
  // a pessoa abre uma sanfona que nasce fechada: o aparelho lembra
  run("prevSecVirar('rcp-estoque', true, false)");
  assert.deepStrictEqual(json(JSON.parse(local._m.zeluz_prev_secoes_v1)), { 'rcp-estoque': true });
  run("prevSecSincronizar('rcp-estoque','<b>0</b>',false)");
  assert.strictEqual(sec.open, true, 'a escolha da pessoa vale mais que o padrão');
  // a pessoa fecha uma sanfona que nasce aberta: o aparelho lembra o «fechei» (false)
  limparAparelho();
  els['prevSec_rcp-estoque'] = elemento('prevSec_rcp-estoque');
  run("prevSecSincronizar('rcp-estoque','',true)");
  run("prevSecVirar('rcp-estoque', false, true)");
  assert.deepStrictEqual(json(JSON.parse(local._m.zeluz_prev_secoes_v1)), { 'rcp-estoque': false });
  run("prevSecSincronizar('rcp-estoque','',true)");
  assert.strictEqual(els['prevSec_rcp-estoque'].open, false, 'fechou: continua fechada, mesmo com pendência');
  // sem os elementos na tela (ou com elemento de mentira sem dataset) não quebra
  run("prevSecSincronizar('nao-existe-na-tela','',true)");
  const bk = doc.getElementById; doc.getElementById = () => ({ innerHTML: '' });
  try { run("prevSecSincronizar('rcp-estoque','x',true)"); } finally { doc.getElementById = bk; }
});

// ------------------------------------------------------------------------- 1. Pendências com o tutor
const GRUPOS_RCP = [
  ['rcp-chamados', 'Perguntas do Day Care', 'chamadosRecepcaoList', 'O Day Care precisa de uma resposta agora.'],
  ['rcp-estoque', 'Avisos de estoque de medicação', 'avisosEstoqueList', 'Quando um remédio de um hóspede está acabando'],
  ['rcp-racao', 'Avisos de ração', 'avisosRacaoList', 'Ração insuficiente para a estadia.'],
  ['rcp-ocorr-hosp', 'Ocorrências dos hóspedes', 'ocorrRecepcaoList', 'O que aconteceu com o FILHOt durante a estadia.'],
  ['rcp-ocorr-dc', 'Ocorrências do Day Care', 'ocorrDayCareRecepcaoList', 'O que o check-in e o check-out do Day Care encontraram.'],
];
prova('Pendências com o tutor: cada grupo é uma sanfona com o título de antes (h2), o texto de apoio e a lista de antes dentro dela', () => {
  const tela = telaHtml('v-recepcao');
  assert.deepStrictEqual(idsDe(tela), GRUPOS_RCP.map((g) => g[0]), 'as cinco sanfonas, na ordem de antes');
  GRUPOS_RCP.forEach(([id, titulo, lista, apoio]) => {
    const s = sanfonaEstatica(id);
    assert.ok(new RegExp('<summary><h2 class="prev-sec-nome">' + titulo + '</h2><span class="prev-sec-contas" id="prevConta_' + id + '">').test(s), titulo);
    assert.ok(s.indexOf('<div id="' + lista + '"></div>') > s.indexOf('<div class="prev-sec-corpo">'), 'a lista de antes mora no corpo: ' + lista);
    assert.ok(textoLimpo(s).indexOf(apoio) >= 0, 'o texto de apoio continua: ' + apoio);
    assert.ok(s.indexOf('class="role-note"') > s.indexOf('<div class="prev-sec-corpo">'), 'o texto de apoio está dentro do corpo');
    assert.ok(!/ open[ >]/.test(s.slice(0, s.indexOf('<summary'))), 'sem JS nasce fechada; quem abre é a conta da pendência');
  });
  // o título continua sendo h2, como a prova antiga da tela esperava
  assert.ok(/<h2[^>]*>Ocorrências dos hóspedes<\/h2>/.test(tela) && /<h2[^>]*>Ocorrências do Day Care<\/h2>/.test(tela));
  assert.ok(!/<h2 style="font-size:19px/.test(tela), 'os h2 soltos de antes viraram o título das sanfonas');
  // o resto da tela não ganhou nem perdeu nada: só estes cinco ids de lista
  assert.deepStrictEqual((tela.match(/ id="[A-Za-z]+List"/g) || []).sort(), GRUPOS_RCP.map((g) => ' id="' + g[2] + '"').sort());
});

prova('Pendências com o tutor: o título mostra a conta; com pendência a sanfona nasce aberta, sem nenhuma nasce fechada (0); o aparelho lembra', () => {
  limparAparelho();
  const sanf = (id) => ({ open: els['prevSec_' + id].open, conta: els['prevConta_' + id].innerHTML });
  ['rcp-chamados', 'rcp-estoque', 'rcp-racao', 'rcp-ocorr-hosp', 'rcp-ocorr-dc'].forEach((id) => { els['prevSec_' + id] = elemento('prevSec_' + id); els['prevConta_' + id] = elemento('prevConta_' + id); });
  // chamados: um aguardando, um respondido, um cancelado
  defina('PT_CHAMADOS', {
    a: { pet: 'Exemplo A', tutor: 'Tutor Exemplo', motivo: 'sem comida', quem: 'Zeloso Exemplo', ts: 1000 },
    b: { pet: 'Exemplo B', tutor: 'Tutor Exemplo', motivo: 'sem comida', quem: 'Zeloso Exemplo', ts: 2000, resposta: 'Pegar na recepção', respondido_por: 'Consultora Exemplo' },
    c: { pet: 'Exemplo C', tutor: 'Tutor Exemplo', motivo: 'sem comida', quem: 'Zeloso Exemplo', ts: 3000, cancelado: { quem: 'Zeloso Exemplo', ts: 3500, motivo: 'foi engano' } },
  });
  run('renderChamadosRecepcao()');
  assert.deepStrictEqual(sanf('rcp-chamados'), { open: true, conta: '<span class="prev-sec-conta prev-sec-venc">1 aguardando</span>' });
  assert.ok(/chamadoResponder\('a'\)/.test(els.chamadosRecepcaoList.innerHTML) && /Responder ao Day Care/.test(els.chamadosRecepcaoList.innerHTML), 'o conteúdo de antes continua');
  // sem chamado nenhum: 0 e fechada
  defina('PT_CHAMADOS', {});
  run('renderChamadosRecepcao()');
  assert.deepStrictEqual(sanf('rcp-chamados'), { open: false, conta: '<span class="prev-sec-conta">0</span>' });
  assert.ok(/Nenhuma pergunta do Day Care agora/.test(els.chamadosRecepcaoList.innerHTML));
  // só respondidos: conta 0, fechada (concluído nasce fechado)
  defina('PT_CHAMADOS', { b: { pet: 'Exemplo B', tutor: 'Tutor Exemplo', motivo: 'sem comida', quem: 'Zeloso Exemplo', ts: 2000, resposta: 'Pegar na recepção', respondido_por: 'Consultora Exemplo' } });
  run('renderChamadosRecepcao()');
  assert.strictEqual(sanf('rcp-chamados').open, false);
  assert.strictEqual(sanf('rcp-chamados').conta, '<span class="prev-sec-conta">0</span>');

  // estoque e ração: um aberto e um resolvido em cada
  const av = (extra) => Object.assign({ key: 'exemplo__tutor', itemId: 'i1', medNome: 'Remédio Exemplo', hospNome: 'Exemplo A', tutor: 'Tutor Exemplo', status: 'pendente', entries: [], _ts: 10 }, extra);
  defina('AVISOS_ESTOQUE_CACHE', { e1: av({ _ts: 20 }), e2: av({ status: 'resolvido', _ts: 10, resolvido_por: 'Consultora Exemplo', resolvido_em: 11, resolvido_motivo: 'o tutor trouxe' }) });
  run('renderAvisosEstoque()');
  assert.deepStrictEqual(sanf('rcp-estoque'), { open: true, conta: '<span class="prev-sec-conta prev-sec-venc">1 sem providência</span>' });
  assert.ok(/Já resolvidos \(1\)/.test(els.avisosEstoqueList.innerHTML) && /Registrar providência/.test(els.avisosEstoqueList.innerHTML), 'a lista de antes continua, com a gaveta dos resolvidos');
  defina('AVISOS_ESTOQUE_CACHE', {});
  run('renderAvisosEstoque()');
  assert.deepStrictEqual(sanf('rcp-estoque'), { open: false, conta: '<span class="prev-sec-conta">0</span>' });
  defina('AVISOS_RACAO_CACHE', { r1: av({ _ts: 20, tipo: 'racao' }), r2: av({ _ts: 21, tipo: 'racao' }) });
  run('renderAvisosRacao()');
  assert.strictEqual(sanf('rcp-racao').open, true);
  assert.strictEqual(sanf('rcp-racao').conta, '<span class="prev-sec-conta prev-sec-venc">2 sem providência</span>');
  defina('AVISOS_RACAO_CACHE', {});
  run('renderAvisosRacao()');
  assert.deepStrictEqual(sanf('rcp-racao'), { open: false, conta: '<span class="prev-sec-conta">0</span>' });

  // ocorrências: duas listas, cada uma com a sua sanfona
  const oc = (id, extra) => Object.assign({ estadiaId: 'e' + id, ocId: 'o' + id, pet: 'Exemplo ' + id, tutor: 'Tutor Exemplo', texto: 'mancando', quem: 'Zeloso Exemplo', ts: Number(id.charCodeAt(0)), avisado: null }, extra);
  A.ctx.__lj = [oc('A'), oc('B', { avisado: { acao: 'avisei', assinatura: 'Consultora Exemplo', desfecho: 'avisado', ts: 5 } })];
  A.ctx.__ld = [oc('C', { daycare: true, estadiaId: 'dc:2026-10-28' })];
  run('ocorrenciasLoja=function(){ return __lj.slice(); }; ocorrenciasDayCare=function(){ return __ld.slice(); }; ocorrenciasLojaAnuladas=function(){ return []; }; ocorrenciasDayCareAnuladas=function(){ return []; };');
  run('renderOcorrenciasRecepcao()');
  assert.deepStrictEqual(sanf('rcp-ocorr-hosp'), { open: true, conta: '<span class="prev-sec-conta prev-sec-venc">1 sem desfecho</span>' });
  assert.deepStrictEqual(sanf('rcp-ocorr-dc'), { open: true, conta: '<span class="prev-sec-conta prev-sec-venc">1 sem desfecho</span>' });
  assert.ok(/Avisei o tutor/.test(els.ocorrRecepcaoList.innerHTML) && /Avisei o tutor/.test(els.ocorrDayCareRecepcaoList.innerHTML), 'o desfecho continua na mão nos dois lados');
  assert.ok(/Exemplo A/.test(els.ocorrRecepcaoList.innerHTML) && !/Exemplo C/.test(els.ocorrRecepcaoList.innerHTML) && /Exemplo C/.test(els.ocorrDayCareRecepcaoList.innerHTML), 'cada ocorrência na sua seção');
  A.ctx.__lj = []; A.ctx.__ld = [];
  run('renderOcorrenciasRecepcao()');
  assert.deepStrictEqual(sanf('rcp-ocorr-hosp'), { open: false, conta: '<span class="prev-sec-conta">0</span>' });
  assert.deepStrictEqual(sanf('rcp-ocorr-dc'), { open: false, conta: '<span class="prev-sec-conta">0</span>' });

  // o aparelho lembra: a pessoa fecha a sanfona do estoque (que nasce aberta) e abre a de ração (que nasce fechada)
  defina('AVISOS_ESTOQUE_CACHE', { e1: av({}) });
  run('renderAvisosEstoque()');
  run("prevSecVirar('rcp-estoque', false, els_padrao('rcp-estoque'))".replace("els_padrao('rcp-estoque')", 'true'));
  run('renderAvisosEstoque()');
  assert.strictEqual(sanf('rcp-estoque').open, false, 'fechada de propósito: continua fechada com pendência');
  run("prevSecVirar('rcp-racao', true, false)");
  run('renderAvisosRacao()');
  assert.strictEqual(sanf('rcp-racao').open, true, 'aberta de propósito: continua aberta sem pendência');
  // outro aparelho (sem o que foi guardado) volta ao padrão
  run('PREV_SEC=null;'); Object.keys(local._m).forEach((k) => delete local._m[k]);
  run('renderAvisosEstoque(); renderAvisosRacao();');
  assert.strictEqual(sanf('rcp-estoque').open, true);
  assert.strictEqual(sanf('rcp-racao').open, false);
});

prova('Pendências com o tutor: nenhuma função de lista mudou o que escreve na lista (só ganhou a conta da sanfona)', () => {
  // as cinco listas continuam sendo escritas pelas mesmas funções, nos mesmos ids
  assert.ok(/getElementById\('chamadosRecepcaoList'\)/.test(fonte('renderChamadosRecepcao')));
  assert.ok(/getElementById\('avisosEstoqueList'\)/.test(fonte('renderAvisosEstoque')) && /_painelPendencias\(/.test(fonte('renderAvisosEstoque')));
  assert.ok(/getElementById\('avisosRacaoList'\)/.test(fonte('renderAvisosRacao')) && /_painelPendencias\(/.test(fonte('renderAvisosRacao')));
  assert.ok(/getElementById\('ocorrRecepcaoList'\)/.test(fonte('renderOcorrenciasRecepcao')) && /getElementById\('ocorrDayCareRecepcaoList'\)/.test(fonte('renderOcorrenciasRecepcao')));
  assert.ok(/_ocorrPainelHTML\(_lj, 'gvOcorr'\)/.test(fonte('renderOcorrenciasRecepcao')) && /_ocorrPainelHTML\(_ld, 'gvOcorrDc'\)/.test(fonte('renderOcorrenciasRecepcao')));
  // a tela abre pela mesma porta de sempre
  assert.ok(/carregarAvisosEstoque\(\)\{ renderAvisosEstoque\(\); renderAvisosRacao\(\); renderOcorrenciasRecepcao\(\);/.test(fonte('carregarAvisosEstoque')));
});

// ------------------------------------------------------------------------- 2. Plantão da noite: Protocolo e Café
prova('Plantão da noite: «Protocolo do Plantão» e «Café da manhã» são sanfonas, com tudo de antes dentro (ids, botões, listas)', () => {
  const tela = telaHtml('v-hospedagem');
  assert.deepStrictEqual(idsDe(tela).filter((i) => /^plantao-/.test(i)), ['plantao-protocolo', 'plantao-cafe']);
  const p = sanfonaEstatica('plantao-protocolo'), c = sanfonaEstatica('plantao-cafe');
  assert.ok(/<span class="prev-sec-nome">Protocolo do Plantão<\/span>/.test(p) && /<span class="prev-sec-nome">Café da manhã<\/span>/.test(c));
  assert.ok(aberta(p) && aberta(c), 'no HTML nascem abertas (a conta e o aparelho decidem em seguida)');
  // o cartão de antes está inteiro dentro do corpo
  ['id="card-checkout-plantao"', 'class="protocolo-regras"', 'Ler com atenção o <strong>Check-in de hospedagem</strong>', 'NENHUMA ALIMENTAÇÃO PODE SER TROCADA', 'Antes de sair — Plantão Noturno',
    'id="checkoutPlantaoList"', 'onclick="salvarCheckoutPlantao()">Salvar check-list do plantão</button>', 'id="status-checkout"'].forEach((t) => assert.ok(p.indexOf(t) > p.indexOf('<div class="prev-sec-corpo">'), t));
  ['id="card-cafe"', 'Cada um come <strong>o que está na ficha dele</strong>', 'id="cafeBarraTempo"', 'id="cafeResumo"', 'id="cafeGrid"'].forEach((t) => assert.ok(c.indexOf(t) > c.indexOf('<div class="prev-sec-corpo">'), t));
  // os dois cartões continuam existindo uma vez só, e o grid dos hóspedes continua depois
  assert.strictEqual((html.match(/id="card-checkout-plantao"/g) || []).length, 1);
  assert.strictEqual((html.match(/id="card-cafe"/g) || []).length, 1);
  assert.ok(tela.indexOf('id="hospGrid"') > tela.indexOf('id="prevSec_plantao-cafe"'));
  // só o plantonista vê o Protocolo: a regra que escondia o cartão esconde também a sanfona
  assert.ok(/body:not\(\[data-role="plantonista"\]\) #card-checkout-plantao, body:not\(\[data-role="plantonista"\]\) #prevSec_plantao-protocolo\{display:none !important\}/.test(html));
});

prova('Plantão da noite: o Protocolo diz «X de N» e nasce aberto enquanto falta item; o Café diz quantos faltam e abre o Café quando se vem atrás dele', () => {
  limparAparelho();
  els['prevSec_plantao-protocolo'] = elemento('prevSec_plantao-protocolo'); els['prevConta_plantao-protocolo'] = elemento('prevConta_plantao-protocolo');
  const total = run('CHECKOUT_PLANTAO.length');
  defina('coPlantao', { 0: { feito: true, quem: 'Zeloso Exemplo', hora: '06:40' } });
  run('renderCheckoutPlantao()');
  assert.strictEqual(els['prevConta_plantao-protocolo'].innerHTML, '<span class="prev-sec-conta prev-sec-venc">1 de ' + total + '</span>');
  assert.strictEqual(els['prevSec_plantao-protocolo'].open, true);
  assert.ok(/toggleCheckoutPlantao\(0\)/.test(els.checkoutPlantaoList.innerHTML) && /todo-item on/.test(els.checkoutPlantaoList.innerHTML), 'os itens de antes continuam');
  const todos = {}; for (let i = 0; i < total; i += 1) todos[i] = { feito: true };
  defina('coPlantao', todos);
  run('renderCheckoutPlantao()');
  assert.strictEqual(els['prevConta_plantao-protocolo'].innerHTML, '<span class="prev-sec-conta">' + total + ' de ' + total + '</span>');
  assert.strictEqual(els['prevSec_plantao-protocolo'].open, false, 'tudo feito: concluído nasce fechado');
  // a pessoa abre mesmo assim: o aparelho lembra
  run("prevSecVirar('plantao-protocolo', true, false)");
  run('renderCheckoutPlantao()');
  assert.strictEqual(els['prevSec_plantao-protocolo'].open, true);

  // Café: o selo e o padrão saem do que já estava calculado na própria renderCafe (servidos / faltam / não chegou)
  const rc = corpoDe('renderCafe');
  assert.ok(/_cafeSan\(servidos, faltam\);/.test(rc) && /_cafeSan\(0, 0\); return; \}/.test(rc), 'selo na renderCafe: com hóspede e sem hóspede');
  assert.ok(/prevSecSincronizar\('plantao-cafe', faltam>0\?/.test(rc) && /, faltam>0\);/.test(rc), 'aberto enquanto falta servir');
  assert.ok(!/_cafeSan/.test(rc.slice(0, rc.indexOf('var _cafeSan'))), 'a leitura ainda em curso não fecha nem abre nada');
  // quem vem atrás do Café (cafeAbrirOperacional) encontra a sanfona aberta
  const ca = fonte('cafeAbrirOperacional');
  assert.ok(/prevSec_plantao-cafe/.test(ca) && ca.indexOf('prevSec_plantao-cafe') < ca.indexOf("getElementById('card-cafe')") && /_sc\.open=true/.test(ca));
});

// ------------------------------------------------------------------------- 3. Conferência do check-in: «Sem check-in»
prova('Conferência do check-in: «Sem check-in» vira sanfona (aberta, com os cartões de antes); o resto da lista fica como estava', () => {
  limparAparelho();
  const h = (nome) => ({ nome, tutor: 'Tutor Exemplo', raca: 'Beagle', refKey: nome.toLowerCase() + '__tutor-exemplo', ini: nome[0], cor: '#234D67' });
  A.ctx.__lista = [h('Ana'), h('Bia'), h('Cuca')];
  run("cfListaHospedes=function(){ return __lista.slice(); }; cfPendente=function(x){ return x.nome==='Ana'?{concluida:false,e:{}}:(x.nome==='Bia'?{concluida:true,e:{}}:null); }; estadiasVencidas=function(){ return []; };");
  run('cfMostrarConferidos=false; renderCfLista()');
  const g = els.cfGrid.innerHTML;
  assert.ok(/id="prevSec_conf-sem-checkin" open ontoggle="prevSecVirar\('conf-sem-checkin',this\.open,1\)"/.test(g), 'sanfona própria, nasce aberta');
  assert.ok(/<span class="prev-sec-nome">Sem check-in \(1\)<\/span>/.test(g));
  assert.ok(/Estão hospedados mas ninguém fez o check-in — avise a recepção\./.test(g));
  const sem = g.slice(g.indexOf('id="prevSec_conf-sem-checkin"'), g.indexOf('</details>', g.indexOf('id="prevSec_conf-sem-checkin"')));
  assert.ok(/onclick="abrirCfFicha\(2\)"/.test(sem) && /SEM CHECK-IN/.test(sem) && /Cuca/.test(sem), 'o cartão de antes (o mesmo onclick) está dentro');
  assert.ok(!/abrirCfFicha\(0\)/.test(sem), 'quem falta conferir não entrou na sanfona');
  assert.ok(/FALTA CONFERIR \(1\)/.test(g) && /Confira estes antes de qualquer outra coisa\./.test(g), 'o bloco «Falta conferir» continua como antes');
  assert.ok(/Já conferidos \(1\)/.test(g) && /cfToggleConferidos\(\)/.test(g), 'o botão dos conferidos continua como antes');
  // o aparelho lembra
  run("prevSecVirar('conf-sem-checkin', false, 1)");
  run('renderCfLista()');
  assert.ok(!/id="prevSec_conf-sem-checkin" open/.test(els.cfGrid.innerHTML), 'fechou: continua fechada');
  assert.ok(/<details class="prev-sec" id="prevSec_conf-sem-checkin"/.test(els.cfGrid.innerHTML));
  // sem ninguém sem check-in não há sanfona, e a mensagem de «tudo conferido» segue as regras de antes
  A.ctx.__lista = [h('Ana')];
  run('renderCfLista()');
  assert.ok(!/conf-sem-checkin/.test(els.cfGrid.innerHTML) && /FALTA CONFERIR \(1\)/.test(els.cfGrid.innerHTML));
  // a montagem NÃO está numa função protegida
  assert.ok(!/^(ck|ckt|pt)/.test('renderCfLista'));
});

// ------------------------------------------------------------------------- 4. Quem vai embora hoje
function estadia(nome, saida, extra) {
  return Object.assign({ nome, tutor: 'Tutor Exemplo', raca: 'Beagle', status: 'ativa', entrada: '2026-10-01', saida }, extra || {});
}
prova('Quem vai embora hoje: cada bloco é uma sanfona (ids saida-mon-), o que exige ação nasce aberto, o concluído e o que ainda não é o dia nascem fechados', () => {
  limparAparelho();
  const hoje = run('hojeISO()'), amanha = run('diasISO(1)'), ontem = run('diasISO(-1)'), daqui5 = run('diasISO(5)');
  defina('CF_ESTADIAS_LIDO', true);
  defina('CF_ESTADIAS', {
    ana: { id: 'E1', e: estadia('Ana', hoje) },
    bia: { id: 'E2', e: estadia('Bia', amanha) },
    cuca: { id: 'E3', e: estadia('Cuca', daqui5) },
    dedé: { id: 'E4', e: estadia('Dedé', daqui5, { checkout_etapa1: { ts: 5, quem: 'Zeloso Exemplo', conferido: {} } }) },
    edu: { id: 'E5', e: estadia('Edu', ontem) },
  });
  run("ehMoradorDaCasa=function(){ return false; }; coModo='monitor'; coEhRecepcao=function(){ return false; }; coCheckoutsDeHojeHTML=function(){ return ''; };");
  run('coRenderLista()');
  const g = els.coGrid.innerHTML;
  const ids = idsDe(g);
  assert.deepStrictEqual(ids, ['saida-mon-hoje', 'saida-mon-amanha', 'saida-mon-resto', 'saida-mon-entregues', 'saida-mon-vencidas'], 'um bloco, uma sanfona, ids próprios');
  assert.strictEqual(new Set(ids).size, ids.length);
  const dentro = (id) => g.slice(g.indexOf('id="prevSec_' + id + '"'), g.indexOf('</details>', g.indexOf('id="prevSec_' + id + '"')));
  assert.ok(aberta(dentro('saida-mon-hoje')) && aberta(dentro('saida-mon-amanha')) && aberta(dentro('saida-mon-vencidas')), 'ação hoje: aberto');
  assert.ok(!aberta(dentro('saida-mon-resto')) && !aberta(dentro('saida-mon-entregues')), 'ainda não é o dia / já entregue: fechado');
  // o título e o texto de apoio de antes, e os cartões de antes (mesmo onclick)
  assert.ok(/<span class="prev-sec-nome">Quem vai embora hoje \(1\)<\/span>/.test(g) && /Veja a etapa mostrada em cada cartão e prepare somente quem ainda está A PREPARAR\./.test(dentro('saida-mon-hoje')));
  assert.ok(/onclick="coAbrirFicha\('ana'\)"/.test(dentro('saida-mon-hoje')) && /A PREPARAR/.test(dentro('saida-mon-hoje')));
  assert.ok(/<span class="prev-sec-nome">Saem AMANHÃ — já pode ir juntando \(1\)<\/span>/.test(g) && /onclick="coAbrirFicha\('bia'\)"/.test(dentro('saida-mon-amanha')));
  assert.ok(/<span class="prev-sec-nome">Outras estadias em curso \(1\)<\/span>/.test(g) && /Ainda não é o dia da saída — só entre aqui se o tutor antecipou\./.test(dentro('saida-mon-resto')) && /coAbrirFicha\('cuca'\)/.test(dentro('saida-mon-resto')));
  assert.ok(/<span class="prev-sec-nome">✅ Já entregues à recepção \(1\)<\/span>/.test(g) && /NA RECEPÇÃO/.test(dentro('saida-mon-entregues')) && /coAbrirFicha\('dedé'\)/.test(dentro('saida-mon-entregues')));
  assert.ok(/<span class="prev-sec-nome">⏳ Passaram da data e continuam abertas \(1\)<\/span>/.test(g) && /A saída nunca foi registrada\./.test(dentro('saida-mon-vencidas')) && /coAbrirFicha\('edu'\)/.test(dentro('saida-mon-vencidas')));
  // o aparelho lembra: fechar «Quem vai embora hoje» (nasce aberta) e abrir «Outras estadias» (nasce fechada)
  run("prevSecVirar('saida-mon-hoje', false, 1); prevSecVirar('saida-mon-resto', true);");
  run('coRenderLista()');
  const g2 = els.coGrid.innerHTML;
  const d2 = (id) => g2.slice(g2.indexOf('id="prevSec_' + id + '"'), g2.indexOf('</details>', g2.indexOf('id="prevSec_' + id + '"')));
  assert.ok(!aberta(d2('saida-mon-hoje')) && aberta(d2('saida-mon-resto')));
});

prova('Quem vai embora hoje: na tela das consultoras os ids são saida-rec- (cada tela lembra o seu), com o texto de antes; «Conferir com o tutor e assinar» nasce aberto', () => {
  limparAparelho();
  const hoje = run('hojeISO()'), amanha = run('diasISO(1)');
  defina('CF_ESTADIAS_LIDO', true);
  defina('CF_ESTADIAS', {
    ana: { id: 'E1', e: estadia('Ana', hoje) },
    bia: { id: 'E2', e: estadia('Bia', amanha) },
    cuca: { id: 'E3', e: estadia('Cuca', run('diasISO(4)'), { checkout_etapa1: { ts: 5, quem: 'Zeloso Exemplo', conferido: {} } }) },
  });
  run("ehMoradorDaCasa=function(){ return false; }; coModo='conferencia'; coCheckoutsDeHojeHTML=function(){ return ''; };");
  run('coRenderLista()');
  const g = els.coGrid.innerHTML;
  assert.deepStrictEqual(idsDe(g), ['saida-rec-conferir', 'saida-rec-hoje', 'saida-rec-amanha']);
  const dentro = (id) => g.slice(g.indexOf('id="prevSec_' + id + '"'), g.indexOf('</details>', g.indexOf('id="prevSec_' + id + '"')));
  assert.ok(aberta(dentro('saida-rec-conferir')) && /Passe item por item COM O TUTOR, colha a assinatura e entregue o PDF\./.test(dentro('saida-rec-conferir')) && /coAbrirFicha\('cuca'\)/.test(dentro('saida-rec-conferir')));
  assert.ok(/Acompanhe a etapa mostrada em cada cartão; a recepção só confere após o preparo\./.test(dentro('saida-rec-hoje')));
  assert.ok(/Avise a monitora para começar a juntar hoje — a saída se prepara na véspera\./.test(dentro('saida-rec-amanha')));
  // sem nada pronto: a mensagem de antes + o bloco de hoje
  defina('CF_ESTADIAS', { ana: { id: 'E1', e: estadia('Ana', hoje) } });
  run('coRenderLista()');
  assert.ok(/Nada para conferir agora/.test(els.coGrid.innerHTML) && /<strong>1<\/strong> sai\(em\) hoje/.test(els.coGrid.innerHTML) && /saida-rec-hoje/.test(els.coGrid.innerHTML));
  // lista vazia e leitura em curso: as mensagens de antes, sem sanfona
  defina('CF_ESTADIAS', {});
  run('coRenderLista()');
  assert.ok(/Nenhuma estadia ativa/.test(els.coGrid.innerHTML) && !/prev-sec/.test(els.coGrid.innerHTML));
  defina('CF_ESTADIAS_LIDO', false);
  run('coRenderLista()');
  assert.ok(/Conferindo as estadias já lançadas/.test(els.coGrid.innerHTML));
});

prova('Quem vai embora hoje: «Check-outs de hoje» (já saíram e assinaram) vira sanfona fechada, com o botão de reabrir de antes', () => {
  limparAparelho();
  const hoje = run('ac667Hoje()');
  A.ctx.__ts = new Date().getTime();
  defina('EST_TODAS', { est1: { nome: 'Exemplo A', status: 'finalizada', checkout: { ts: A.ctx.__ts, assinado_por: 'Tutor Exemplo' } } });
  run("coModo='monitor'; coCheckoutsDeHojeHTML=__coHojeReal;");
  const h = run('coCheckoutsDeHojeHTML()');
  assert.deepStrictEqual(idsDe(h), ['saida-mon-feitos']);
  assert.ok(!aberta(h), 'concluído: fechado');
  assert.ok(/<span class="prev-sec-nome">Check-outs de hoje \(1\)<\/span>/.test(h) && /A estadia que saiu errada \(o tutor errado, a assinatura ruim\) volta pela Gestão\./.test(h));
  assert.ok(/onclick="coCheckoutReabrirAbrir\('est1'\)">Reabrir o check-out</.test(h) && /assinou Tutor Exemplo/.test(h) && /min-height:44px/.test(h), 'o botão de antes, igual');
  assert.ok(hoje, 'o dia de hoje existe');
  defina('EST_TODAS', {});
  assert.strictEqual(run('coCheckoutsDeHojeHTML()'), '', 'sem check-out hoje, nada aparece');
  run("coModo='conferencia'; EST_TODAS=__v;");
  A.ctx.__v = { est1: { nome: 'Exemplo A', status: 'finalizada', checkout: { ts: A.ctx.__ts } } };
  run('EST_TODAS=__v');
  assert.deepStrictEqual(idsDe(run('coCheckoutsDeHojeHTML()')), ['saida-rec-feitos']);
  run("coModo='monitor'");
});

// ------------------------------------------------------------------------- 5. Vencimentos
prova('Vencimentos: cada grupo do resumo («Quem vem … com pendência») vira sanfona aberta (ids venc-g-), com os nomes tocáveis de antes; o painel aberto força a sua', () => {
  limparAparelho();
  A.ctx.__grupos = [
    { v: 'verm', rotulo: 'Vermífugo', nomes: ['Ana', 'Bia'], alvos: [{ chave: 'ana__t', k: 'verm_p', nome: 'Ana' }, { chave: 'bia__t', k: 'verm_p', nome: 'Bia' }] },
    { v: 'aberto', rotulo: 'Em aberto na ficha — nunca registrado', nomes: ['Cuca'], alvos: [{ chave: 'cuca__t', k: 'vacina_p', nome: 'Cuca' }] },
  ];
  run("vencResumoGrupos=function(){ return __grupos; }; vencFraseDia=function(){ return 'hoje'; }; PREV_CORRIGE_ORIGEM=''; PREV_CORRIGE_ABERTO='';");
  const h = run("vencResumoHTML([{}], '2026-10-28', '2026-10-28')");
  assert.deepStrictEqual(idsDe(h), ['venc-g-verm', 'venc-g-aberto']);
  assert.ok(aberta(h.slice(h.indexOf('id="prevSec_venc-g-verm"'))) && aberta(h.slice(h.indexOf('id="prevSec_venc-g-aberto"'))), 'quem está devendo exige ação: aberto');
  assert.ok(/<span class="prev-sec-nome">Vermífugo \(2\)<\/span>/.test(h) && /<span class="prev-sec-nome">Em aberto na ficha — nunca registrado \(1\)<\/span>/.test(h));
  assert.ok(/Quem vem hoje com pendência/.test(h) && /onclick="vencCopiarResumo\(this\)">Copiar resumo</.test(h) && /id="vencResumoTxt"/.test(h), 'o cabeçalho, o botão de copiar e o campo de antes');
  assert.ok((h.match(/prevCorrigeAbrir\(/g) || []).length === 3, 'os três nomes continuam tocáveis (o mesmo chip de antes)');
  assert.ok(/ontoggle="prevSecVirar\('venc-g-verm',this\.open,1\)"/.test(h));
  // o painel aberto por um toque num nome fica visível, mesmo com a sanfona fechada no aparelho
  run("prevSecVirar('venc-g-verm', false, 1)");
  const fechado = run("vencResumoHTML([{}], '2026-10-28', '2026-10-28')");
  assert.ok(!aberta(fechado.slice(fechado.indexOf('id="prevSec_venc-g-verm"'))), 'o que a pessoa fechou, o aparelho lembra');
  const nenhum = run("vencResumoGrupos=function(){ return []; }; vencResumoHTML([], '2026-10-28', '2026-10-28')");
  assert.strictEqual(nenhum, '', 'sem grupo, sem bloco (como antes)');
});

prova('Vencimentos: «Respostas pendentes» vira sanfona (aberta com resposta pendente; fechada com 0), com o texto e a lista de antes; entra depois do resumo e antes dos cartões', () => {
  limparAparelho();
  run("vencPendListaHTML=function(){ return '<div class=\"pend-linha\">LINHA</div>'; };");
  run("vencPendContagem=function(){ return {total:2, cobrar:1}; };");
  let h = run('vencPendSanfonaHTML()');
  assert.deepStrictEqual(idsDe(h), ['venc-pend']);
  assert.ok(aberta(h) && /<span class="prev-sec-nome">Respostas pendentes<\/span>/.test(h) && /<span class="prev-sec-conta prev-sec-venc">2 sem resposta<\/span>/.test(h));
  assert.ok(/Mensagens já mandadas, de <strong>qualquer dia<\/strong>, que ainda não tiveram resposta\./.test(h) && /o assunto só fecha quando o que o tutor disse estiver registrado\./.test(h) && /pend-linha/.test(h));
  run("vencPendContagem=function(){ return {total:0, cobrar:0}; };");
  h = run('vencPendSanfonaHTML()');
  assert.ok(!aberta(h) && /<span class="prev-sec-conta">0<\/span>/.test(h), 'sem resposta pendente: fechada, com 0');
  run("vencPendContagem=function(){ return null; };");
  h = run('vencPendSanfonaHTML()');
  assert.ok(aberta(h) && !/class="prev-sec-conta[ "]/.test(h), 'ainda lendo: aberta, sem selo: ' + h.slice(0, 300));
  // a ordem em vencRender: o resumo, as respostas pendentes e os cartões
  const vr = fonte('vencRender');
  assert.ok(/\+vencResumoHTML\(L, dia, hoje\)/.test(vr) && /\+vencPendSanfonaHTML\(\)\);\s*L\.forEach\(function\(o\)\{ h\+=vencCartaoHTML\(o, dia, hoje\); \}\);/.test(vr));
  assert.ok(vr.indexOf('vencResumoHTML(L, dia, hoje)') < vr.indexOf('vencPendSanfonaHTML()') && vr.indexOf('vencPendSanfonaHTML()') < vr.indexOf('vencCartaoHTML(o, dia, hoje)'));
});

// ------------------------------------------------------------------------- ids únicos e fora de colisão
prova('ids das sanfonas: cada tela tem o seu prefixo, nenhum se repete e nenhum colide com os de antes', () => {
  const estaticos = idsDe(html);
  assert.strictEqual(new Set(estaticos).size, estaticos.length, 'ids estáticos únicos');
  const dinamicos = [];
  const re = /prevSecHTML\('([a-z0-9-]+)'/g; let m;
  const prefixos = [];
  while ((m = re.exec(html)) !== null) (/-$/.test(m[1]) ? prefixos : dinamicos).push(m[1]);   // «saida-» e «venc-g-» são prefixos: o resto do id se monta na hora
  assert.deepStrictEqual(prefixos.sort(), ['saida-', 'venc-g-']);
  // os que montam o id na hora (prefixo + parte) — saida-mon/rec-…, venc-g-…, hosp-…, item_…
  const montados = ['saida-mon-hoje', 'saida-mon-amanha', 'saida-mon-resto', 'saida-mon-entregues', 'saida-mon-vencidas', 'saida-mon-feitos',
    'saida-rec-conferir', 'saida-rec-hoje', 'saida-rec-amanha', 'saida-rec-feitos', 'saida-rec-resto', 'saida-rec-entregues', 'saida-rec-vencidas'];
  const todos = estaticos.concat(dinamicos, montados);
  assert.strictEqual(new Set(todos).size, todos.length, 'nenhum id repetido entre as telas: ' + todos.filter((x, i) => todos.indexOf(x) !== i).join(', '));
  ['conf-sem-checkin', 'venc-pend'].forEach((id) => assert.ok(dinamicos.indexOf(id) >= 0, id));
  // prefixos por tela
  assert.ok(estaticos.filter((i) => /^rcp-/.test(i)).length === 5 && estaticos.filter((i) => /^plantao-/.test(i)).length === 2);
  // os de antes continuam existindo
  ['resumo'].forEach((id) => assert.ok(estaticos.indexOf(id) >= 0, id));
  ['checkup', 'atualizados', 'coleira', 'escova-treino', 'escova-kit', 'hospedes', 'tabela', 'hosp-pares'].forEach((id) => assert.ok(dinamicos.indexOf(id) >= 0, id));
  ['hosp-agora', 'hosp-achegar', 'hosp-saiu'].forEach((id) => assert.ok(html.indexOf("bloco('" + id + "'") >= 0, id));
  const dosDeAntes = dinamicos.concat(['hosp-agora', 'hosp-achegar', 'hosp-saiu']);
  ['rcp-', 'plantao-', 'conf-', 'saida-', 'venc-'].forEach((pre) => assert.ok(!dosDeAntes.some((id) => id.indexOf(pre) === 0 && !/^(conf-sem-checkin|venc-pend)$/.test(id)), 'prefixo novo sem colisão: ' + pre));
});

// ------------------------------------------------------------------------- as regras da casa
prova('regras da casa: sem alert/confirm/prompt novos, sem vocabulário proibido nos textos novos; área protegida, #v-daycare e APP_VERSAO intactos', () => {
  const NOVAS = ['prevSecSincronizar', 'prevSecContaPend', 'rcpSanfona', 'vencPendSanfonaHTML', 'coSanfonaHTML'];
  const texto = NOVAS.map(corpoDe).join('\n');
  assert.ok(!/\balert\s*\(|\bconfirm\s*\(|\bprompt\s*\(/.test(texto), 'confirmação dentro da página, nunca janela nativa');
  // os trechos que mudaram nas funções de antes (o que a mudança escreveu de novo)
  const NOVOS_TRECHOS = html.split('\n').filter((l) => /prevSecHTML\('(conf-sem-checkin|venc-g-)|coSanfonaHTML\(|rcpSanfona\(|prevSecSincronizar\(|_cafeSan/.test(l)).join('\n')
    + '\n' + ['rcp-chamados', 'rcp-estoque', 'rcp-racao', 'rcp-ocorr-hosp', 'rcp-ocorr-dc', 'plantao-protocolo', 'plantao-cafe'].map(sanfonaEstatica).map((s) => s.slice(0, s.indexOf('<div class="prev-sec-corpo">'))).join('\n');
  assert.ok(!/\balert\s*\(|\bconfirm\s*\(|\bprompt\s*\(/.test(NOVOS_TRECHOS));
  const so = (texto + '\n' + NOVOS_TRECHOS).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  assert.ok(!/\b(c[ãa]o|c[ãa]es|cachorro|cachorros|baia|baias|soltar|solto|solta)\b/i.test(so), 'vocabulário da casa');
  assert.ok(!/[\u{1F300}-\u{1FAFF}]/u.test(texto), 'sem emoji de marca nos textos novos');
  // a versão do app tem o formato de sempre (o número sobe a cada publicação; quem sobe é a sessão principal)
  assert.ok(/^\d{4}-\d{2}-\d{2}-\d{2}$/.test(run('APP_VERSAO')), 'APP_VERSAO no formato AAAA-MM-DD-NN');
  // a área protegida do check-in do Day Care: o mesmo texto do commit 870f235 (157 funções ck*/ckt*/pt*/pendAvisarChegada e o #v-daycare)
  const protegidas = json(run("Object.getOwnPropertyNames(globalThis).filter(function(k){ return typeof globalThis[k]==='function' && (/^(ck|ckt|pt)/.test(k) || k==='pendAvisarChegada'); }).sort()"));
  assert.strictEqual(protegidas.length, 157, 'as mesmas funções ck*/ckt*/pt*/pendAvisarChegada');
  // Antes: o hash era medido no texto inteiro das funções. Depois: medido sem a chamada `+alergiaSeloHTML(p)`.
  // Por quê: a dona autorizou (28/out/2026) mexer no check-in do Day Care SÓ para mostrar o selo de alergia. Tirando
  // a chamada, o texto tem de dar o mesmo hash de antes: prova que o selo foi a única mudança na área protegida.
  assert.strictEqual(sha(protegidas.map((nm) => nm + '\n' + run('String(' + nm + ')').split('+alergiaSeloHTML(p)').join('')).join('\n')), '73e7f281aff59c01', 'o texto de cada uma, igual ao do 870f235');
  const iDc = html.indexOf('id="v-daycare"'), jDc = html.indexOf('id="v-', iDc + 10);
  assert.strictEqual(sha(html.slice(iDc, jDc)), '4c438983ed2b9c0a', 'o #v-daycare, igual ao do 870f235');
  // as regras do banco não foram tocadas
  assert.ok(!/prev_secoes|sanfona/.test(fs.readFileSync(path.join(__dirname, '..', 'database.rules.json'), 'utf8')));
});

(async () => {
  for (const [nome, fn] of fila) {
    try { await fn(); n += 1; } catch (e) { console.error('FALHOU: ' + nome); throw e; }
  }
  console.log('sanfonas-telas163: OK (' + n + ' provas)');
})().catch((e) => { console.error(e); process.exitCode = 1; });
