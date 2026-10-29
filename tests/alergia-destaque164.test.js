'use strict';

// A alergia em destaque em toda tela onde o FILHOt aparece (Adriana, 28/out/2026: «alergias precisa aparecer em destaque e ser
// comunicado em tudo que o peludo aparecer. Onde tiver o registro dele, aparece essa informação»). Prova duas coisas:
//   1. alergiaSeloHTML (a função única que desenha o selo): vazio e «não tem» não desenham nada; texto vira «⚠ ALERGIA A …» em
//      maiúsculas e escapado; aceita o peludinho do cadastro, a chave do cadastro e o registro de hospedagem (que acha a alergia pelo
//      mesmo vínculo que a faixa); a versão curta leva o texto inteiro no title; não lê o banco.
//   2. cada tela do inventário FORA da área protegida do check-in do Day Care desenha o selo quando o FILHOt tem alergia: o app inteiro
//      roda num sandbox sem rede e sem banco real, com um FILHOt inventado («Biscoito», tutor «Tutor Exemplo»), e o HTML de cada tela é
//      montado de verdade. A área protegida (funções ck*/ckt*/pt*/pendAvisarChegada e o #v-daycare) fica com o texto do commit 870f235.
// Tudo inventado: nenhum dado de cliente.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const APP = path.join(__dirname, '..', 'auaulandia', 'index.html');
const html = fs.readFileSync(APP, 'utf8');

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
    appendChild() {}, scrollIntoView() {}, click() {}, closest() { return null; }, focus() {} };
}
function scriptsDoApp(texto) {
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi; let m; const todos = [];
  while ((m = re.exec(texto)) !== null) todos.push(m[1]);
  let principal = '', k = -1;
  todos.forEach((t, i) => { if (t.length > principal.length) { principal = t; k = i; } });
  return todos.slice(0, k).join('\n;\n') + '\n;\n' + principal;
}
function abrirApp(armazenamento) {
  const els = {};
  const getEl = (id) => (els[id] = els[id] || elemento(id));
  const corpo = { dataset: { role: 'gestao' }, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, appendChild() {}, style: {}, addEventListener() {}, setAttribute() {}, getAttribute() { return null; } };
  const doc = { body: corpo, head: { appendChild() {} }, documentElement: universal('documentElement'), getElementById: getEl, querySelector() { return null; }, querySelectorAll() { return []; }, createElement() { return universal('el'); },
    addEventListener() {}, activeElement: null, cookie: '', readyState: 'complete' };
  const nunca = new Promise(() => {});
  const sandbox = { console, Date, Math, JSON, Object, Array, String, Number, Boolean, parseInt, parseFloat, isNaN, isFinite, RegExp, Promise, Map, Set, Symbol, encodeURIComponent, decodeURIComponent,
    setTimeout() {}, clearTimeout() {}, setInterval() {}, clearInterval() {}, requestAnimationFrame() {}, performance: { now() { return 0; } }, document: doc,
    firebase: { initializeApp() { return {}; }, auth() { return { signInAnonymously() { return nunca; }, onAuthStateChanged() {} }; }, database() { return { ref() { return universal('ref'); } }; } },
    localStorage: armazenamento || { getItem() { return null; }, setItem() {}, removeItem() {} }, navigator: { userAgent: 'prova', onLine: true }, location: { href: 'https://prova.local/', reload() {}, hostname: 'prova.local' },
    Blob: class Blob {}, alert() {}, confirm() { return true; }, prompt() { return ''; }, scrollTo() {}, addEventListener() {}, getComputedStyle() { return {}; } };
  sandbox.window = sandbox; sandbox.globalThis = sandbox; sandbox.self = sandbox;
  const ctx = vm.createContext(sandbox);
  // A ordem da página: os módulos locais (<script src>) e os <script> inline, cada um no seu lugar. Os módulos de fora que a tela não usa
  // podem falhar em silêncio; o script principal tem de carregar.
  const re = /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>|<script[^>]*\bsrc="([^"?]+)[^"]*"[^>]*><\/script>/gi; let m; const principal = scriptsDoApp(html);
  while ((m = re.exec(html))) {
    if (m[3]) {
      if (/^https?:/.test(m[3])) continue;
      const arq = path.join(__dirname, '..', 'auaulandia', m[3]);
      if (!fs.existsSync(arq)) continue;
      try { vm.runInContext(fs.readFileSync(arq, 'utf8'), ctx, { filename: m[3], timeout: 30000 }); } catch (e) { /* módulo que a tela não precisa neste sandbox */ }
    } else if (m[2] && m[2].length > 0) {
      if (principal.indexOf(m[2]) >= 0 && m[2].length > 100000) vm.runInContext(m[2], ctx, { filename: 'index.html#script', timeout: 30000 });
      else { try { vm.runInContext(m[2], ctx, { filename: 'index.html#inline', timeout: 30000 }); } catch (e) { /* inline pequeno que a tela não precisa */ } }
    }
  }
  const run = (c) => vm.runInContext(c, ctx);
  return { ctx, run, els, doc, el: getEl };
}

const A = abrirApp();
const { run, els, doc } = A;
const lista = (v) => JSON.parse(JSON.stringify(v));
function ctxSet(nome, valor) { A.ctx.__v = valor; run(nome + '=__v;'); }

// O FILHOt inventado e a ficha dele no cadastro em memória.
const P = { n: 'Biscoito', tutor: 'Tutor Exemplo', raca: 'Beagle', freq: '3x', dias: ['seg', 'qui', 'sex'] };
const CHAVE = 'biscoito__tutor exemplo';
const HOSP = { nome: 'Biscoito', tutor: 'Tutor Exemplo', raca: 'Beagle', refKey: CHAVE, hospede: true, ini: 'B', cor: '#234D67' };
function cadastro(alergia, extra) {
  ctxSet('PELUDINHOS', [P]);
  A.ctx.__cad = {}; A.ctx.__cad[CHAVE] = Object.assign({ sexo: 'Fêmea', castrado: 'Sim' }, alergia === undefined ? {} : { alergia }, extra || {});
  run('pelCadCache=__cad;');
}
const SELO_CHEIO = /<span class="alergia-selo" role="note">⚠ ALERGIA A FRANGO<\/span>/;
const SELO_CURTO = /<span class="alergia-selo alergia-selo-curto" role="note" title="ALERGIA A FRANGO">⚠ ALERGIA<\/span>/;
const temSelo = (h) => SELO_CHEIO.test(h) || SELO_CURTO.test(h);

let n = 0;
const fila = [];
function prova(nome, fn) { fila.push([nome, fn]); }

// ------------------------------------------------------------------------- a função única
prova('alergiaSeloHTML: sem alergia (vazio ou «não tem») não desenha nada, e o objeto vazio ou nulo também não', () => {
  cadastro('');
  assert.strictEqual(run('alergiaSeloHTML(PELUDINHOS[0])'), '');
  ['', '   ', 'não tem', 'Não tem.', 'NAO TEM', 'nenhuma', 'Nenhum', 'sem alergia', 'Sem alergias', 'não', 'nada', 'n/a', '-'].forEach((v) => {
    cadastro(v);
    assert.strictEqual(run('alergiaSeloHTML(PELUDINHOS[0])'), '', '«' + v + '» é sem alergia');
    assert.strictEqual(run('alergiaSeloHTML(' + JSON.stringify(CHAVE) + ')'), '');
    assert.strictEqual(run('alergiaSeloHTML(' + JSON.stringify(HOSP) + ')'), '');
  });
  assert.strictEqual(run('alergiaSeloHTML(null)'), '');
  assert.strictEqual(run('alergiaSeloHTML(undefined)'), '');
  assert.strictEqual(run('alergiaSeloHTML({})'), '');
  assert.strictEqual(run('alergiaSeloHTML(42)'), '');
  assert.strictEqual(run("alergiaSeloDeTexto('')"), '');
});

prova('alergiaSeloHTML: com alergia vira «⚠ ALERGIA A FRANGO» em maiúsculas, selo vermelho alpha (borda e texto, nunca fundo chapado)', () => {
  cadastro('frango');
  assert.strictEqual(run('alergiaSeloHTML(PELUDINHOS[0])'), '<span class="alergia-selo" role="note">⚠ ALERGIA A FRANGO</span>');
  cadastro('maçã e ovo');
  assert.ok(/⚠ ALERGIA A MAÇÃ E OVO</.test(run('alergiaSeloHTML(PELUDINHOS[0])')), 'maiúsculas com acento');
  cadastro('TUDO');
  assert.ok(/⚠ ALERGIA A TUDO</.test(run('alergiaSeloHTML(PELUDINHOS[0])')));
  // o desenho: classe única, com o gabarito (wash alpha, borda 1.5px alpha, texto vermelho, 800, pílula)
  const css = html.slice(html.indexOf('.alergia-selo{'), html.indexOf('}', html.indexOf('.alergia-selo{')) + 1);
  assert.ok(/background:rgba\(192,57,43,\.12\)/.test(css) && /color:var\(--crm-critico\)/.test(css) && /border:1\.5px solid rgba\(192,57,43,\.45\)/.test(css) && /font-weight:800/.test(css) && /border-radius:999px/.test(css), css);
  assert.ok(!/background:(#|var\(--crm-critico\)|rgb\()/.test(css), 'nada de fundo chapado');
});

prova('alergiaSeloHTML: texto com <script> e aspas sai escapado (nada vira tag)', () => {
  cadastro('<script>alert(1)</script> "x"');
  const h = run('alergiaSeloHTML(PELUDINHOS[0])');
  assert.ok(!/<script/i.test(h) && /&lt;SCRIPT>ALERT\(1\)&lt;\/SCRIPT> &quot;X&quot;/.test(h), h);
  cadastro('<img src=x onerror=alert(1)>');
  assert.ok(!/<img/i.test(run('alergiaSeloHTML(PELUDINHOS[0], {curto:true})')) && !/<img/i.test(run('alergiaSeloHTML(PELUDINHOS[0])')));
  assert.ok(!/<img/i.test(run('alertPills(pelExtra(PELUDINHOS[0]))')), 'o selo das tarjas também');
});

prova('alergiaSeloHTML: versão curta «⚠ ALERGIA» com o texto inteiro no title', () => {
  cadastro('frango');
  assert.strictEqual(run('alergiaSeloHTML(PELUDINHOS[0], {curto:true})'), '<span class="alergia-selo alergia-selo-curto" role="note" title="ALERGIA A FRANGO">⚠ ALERGIA</span>');
  cadastro('frango "e" <b>');
  assert.ok(/title="ALERGIA A FRANGO &quot;E&quot; &lt;B>"/.test(run('alergiaSeloHTML(PELUDINHOS[0], {curto:true})')), 'o title também é escapado');
});

prova('alergiaSeloHTML: aceita o peludinho do cadastro, a chave do cadastro, o registro de hospedagem e o objeto com a chave', () => {
  cadastro('frango');
  assert.ok(SELO_CHEIO.test(run('alergiaSeloHTML(PELUDINHOS[0])')), 'o peludinho do cadastro');
  assert.ok(SELO_CHEIO.test(run('alergiaSeloHTML(' + JSON.stringify(CHAVE) + ')')), 'a chave do cadastro');
  assert.ok(SELO_CHEIO.test(run('alergiaSeloHTML(' + JSON.stringify(HOSP) + ')')), 'o registro de hospedagem com refKey');
  assert.ok(SELO_CHEIO.test(run('alergiaSeloHTML({nome:"Biscoito", tutor:"Tutor Exemplo"})')), 'a hospedagem sem refKey: acha por nome + tutor');
  assert.ok(SELO_CHEIO.test(run('alergiaSeloHTML({chave:' + JSON.stringify(CHAVE) + ', nome:"Biscoito"})')), 'a lista que carrega a chave do cadastro');
  assert.ok(SELO_CHEIO.test(run('alergiaSeloHTML({chave:' + JSON.stringify(CHAVE) + '})')), 'só a chave');
  assert.ok(SELO_CHEIO.test(run('alergiaSeloHTML({alergia:"frango"})')), 'o objeto que já traz o campo alergia');
  // a chave com maiúsculas e o caractere que o banco não aceita
  assert.ok(SELO_CHEIO.test(run('alergiaSeloHTML("Biscoito__Tutor Exemplo")')));
  // outro FILHOt sem alergia no mesmo cadastro: nada
  assert.strictEqual(run('alergiaSeloHTML({nome:"Outro", tutor:"Tutor Qualquer", refKey:"outro__tutor qualquer"})'), '');
});

prova('alergiaSeloHTML: hospedagem → cadastro pelo mesmo vínculo da faixa; a alergia gravada no próprio registro de hospedagem vale se o cadastro não tem', () => {
  // o vínculo é o da faixa: extraDoHosp(h). A alergia do cadastro vale mesmo com o refKey de outra grafia do tutor
  cadastro('frango');
  assert.ok(SELO_CHEIO.test(run('alergiaSeloHTML({nome:"Biscoito", tutor:"Tutor Exemplo", refKey:"biscoito__tutor exemplo"})')));
  assert.deepStrictEqual(lista(run('faixaItens({h:{nome:"Biscoito", tutor:"Tutor Exemplo", refKey:"biscoito__tutor exemplo"}}).fixos.map(function(x){ return x.tx; })')), ['ALERGIA A FRANGO'], 'a faixa lê o mesmo dado');
  // cadastro sem alergia, mas a hospedagem traz uma
  cadastro('');
  assert.ok(SELO_CHEIO.test(run('alergiaSeloHTML({nome:"Biscoito", tutor:"Tutor Exemplo", refKey:"biscoito__tutor exemplo", alergia:"frango"})')), 'a alergia da própria hospedagem');
  // se o cadastro tem, é o do cadastro que vale
  cadastro('ovo');
  assert.ok(/ALERGIA A OVO</.test(run('alergiaSeloHTML({nome:"Biscoito", tutor:"Tutor Exemplo", refKey:"biscoito__tutor exemplo", alergia:"frango"})')));
});

prova('alergiaSeloHTML não lê o banco: nenhuma chamada a DB.ref, e sem cadastro carregado devolve vazio sem quebrar', () => {
  cadastro('frango');
  run('__refs=0; DB={ref:function(){ __refs++; return {once:function(){ return new Promise(function(){}); }, on:function(){}, off:function(){}}; }};');
  run('alergiaSeloHTML(PELUDINHOS[0]); alergiaSeloHTML({nome:"Biscoito",tutor:"Tutor Exemplo",refKey:"biscoito__tutor exemplo"}); alergiaSeloHTML("biscoito__tutor exemplo"); alergiaSeloHTML({chave:"biscoito__tutor exemplo"});');
  assert.strictEqual(run('__refs'), 0);
  run('DB=null;');
  const fonte = html.slice(html.indexOf('function alergiaDoAlvo('), html.indexOf('function alergiaSeloHTML('));
  assert.ok(!/\bDB\b|\.once\(|\.ref\(|fetch\(|XMLHttpRequest/.test(fonte), 'o código do selo não toca o banco');
  ctxSet('PELUDINHOS', []); run('pelCadCache={};');
  assert.strictEqual(run('alergiaSeloHTML({nome:"Fantasma", tutor:"Ninguém"})'), '');
  cadastro('frango');
});

prova('alertPills: o selo «ALERGIA» das tarjas é o selo novo (um só desenho, sem duplicar), com o texto da alergia; restrição e o resto como sempre', () => {
  cadastro('frango', { restricao: 'sem grãos', medicacao: 'Exemplo 5 mg' });
  const h = run('alertPills(pelExtra(PELUDINHOS[0]))');
  assert.strictEqual((h.match(/alergia-selo/g) || []).length, 1, 'um selo só');
  assert.ok(/<span class="alert-pill crit"><span class="alergia-selo" role="note">⚠ ALERGIA A FRANGO<\/span><\/span>/.test(h));
  assert.ok(!/ALERGIA: /.test(h), 'o desenho antigo «ALERGIA: x» saiu');
  assert.ok(/RESTRIÇÃO: sem grãos/.test(h) && /MEDICAÇÃO: Exemplo 5 mg/.test(h));
  cadastro('não tem');
  assert.ok(!/ALERGIA/.test(run('alertPills(pelExtra(PELUDINHOS[0]))')), '«não tem» não vira tarja');
});

// ------------------------------------------------------------------------- o inventário (fora da área protegida): cada tela desenha o selo
const TELAS = [];   // {tela, funcao, versao: 'cheio'|'curto'}
function tela(nome, funcao, versao, fn) {
  TELAS.push({ tela: nome, funcao, versao });
  prova('tela «' + nome + '» (' + funcao + ', selo ' + versao + '): o HTML montado com um FILHOt com alergia tem o selo; sem alergia, não tem', () => {
    const comAlergia = (() => { cadastro('frango'); return fn(); })();
    assert.ok(typeof comAlergia === 'string' && comAlergia.length > 40, 'a tela montou HTML');
    assert.ok(versao === 'curto' ? SELO_CURTO.test(comAlergia) : SELO_CHEIO.test(comAlergia), 'falta o selo (' + versao + ') em ' + funcao);
    assert.ok(comAlergia.indexOf('Biscoito') >= 0, 'o FILHOt inventado está na tela');
    const sem = (() => { cadastro(''); return fn(); })();
    assert.ok(sem.indexOf('Biscoito') >= 0 && !/alergia-selo/.test(sem), 'sem alergia a tela não tem selo');
    cadastro('frango');
  });
}

// ---- Plantão
tela('Plantão (cartões do dia)', 'renderHosp', 'cheio', () => {
  run('hospedes=[' + JSON.stringify(HOSP) + ']; renderHosp();');
  return els.hospGrid.innerHTML;
});
tela('Hospedar (busca do FILHOt)', 'renderHospBuscaResults', 'cheio', () => {
  els.hbBusca = Object.assign(elemento('hbBusca'), { value: 'bisc' });
  run('renderHospBuscaResults();');
  return els.hbResults.innerHTML;
});

const EST = { nome: 'Biscoito', tutor: 'Tutor Exemplo', raca: 'Beagle', refKey: CHAVE, status: 'ativa', entrada: '2020-01-01', saida: '2099-12-31', _ts: 100,
  ficha: { obsGeral: '', medObs: '', coleira: null, medEmUso: 'Não',
    alim: { obs: '', tipo: 'Ração', marca: 'Ração', unidade: 'gramas', confirmacao: { estado: 'confirmado', quem: 'Recepção Exemplo', ts: 1 },
      refs: { fixas: { cafe: { on: true, hora: '07:30', racao: '30', natural: '', extra: '' }, almoco: { on: true, hora: '12:00', racao: '40', natural: '', extra: '' }, jantar: { on: true, hora: '19:00', racao: '50', natural: '', extra: '' } }, extras: [] },
      refeicoes: '3', qtd: '', trazida: '700', dias: 6, entrada: { cafe: false, almoco: true, jantar: true }, saida: { cafe: true, almoco: false, jantar: false },
      racaoRefeicoes: { cafe: true, almoco: true, jantar: true }, minimo: 680, deficit: -20, comida: null },
    spa: { banho: 'Não', tipo: '', horario: '', aConfirmar: false } },
  pertences: [{ uid: 'p1', k: 'comida', nome: 'Ração', spec: 'Ração' }], medicacao: [],
  conferencia: { concluida: true, quem: 'Conferente Exemplo' }, assinatura: 'data:image/png;base64,AAA', assinado_por: 'Tutor Exemplo' };
function hoje(iso) { run('hospHojeISO=function(){ return ' + JSON.stringify(iso || '2026-10-28') + '; };'); }

tela('Hóspedes de hoje (linha da estadia)', 'hospAbaLinha', 'cheio', () => {
  hoje();
  A.ctx.__o = { e: EST, id: 'e1' };
  return run('hospAbaLinha(__o, 0)');
});
tela('Hóspedes de hoje (estadia só na planilha)', 'hospAbaLinha', 'cheio', () => {
  hoje();
  A.ctx.__o = { e: Object.assign({}, EST, { _soPlanilha: true, _spIdx: 0 }), id: 'p1' };
  return run('hospAbaLinha(__o, 0)');
});
tela('Café da manhã dos hóspedes', 'renderCafe', 'cheio', () => {
  A.ctx.__EST = { e1: EST };
  ['cafeGrid', 'cafeResumo', 'cafeBarraTempo'].forEach((id) => { A.el(id).innerHTML = ''; });
  run(`EST_TODAS=__EST; CF_ESTADIAS_LIDO=true; hospedes=[];
    cafeLeitura={dia:cafeDataKey(), geracao:1, cafe:'ok', turno:'ok', promessa:null}; cafeMarcas={}; cafeTempo={}; cafeMarcasPendentes={};
    cafeAlunoLeitura={dia:cafeDataKey(), estado:'ok', excecoes:{}, chamada:{}, checkins:{}}; cafeAlunoPedidosHTML=function(){ return ''; };
    renderCafe();`);
  return els.cafeGrid.innerHTML;
});
tela('Cuidado Vet (lista dos hóspedes)', 'renderVetLista', 'cheio', () => {
  run('hospedes=[' + JSON.stringify(HOSP) + ']; renderVetLista();');
  return els.vetGrid.innerHTML;
});
tela('Conferência (cartão do hóspede)', 'cfCardHTML', 'cheio', () => {
  run('CF_ESTADIAS={}; CF_ESTADIAS[medAgendaKey(' + JSON.stringify(HOSP) + ')]={id:"e1", e:' + JSON.stringify(EST) + '}; CF_LISTA=[' + JSON.stringify(HOSP) + '];');
  return run('cfCardHTML(CF_LISTA[0], 0)');
});
tela('Quem vai embora hoje (check-out)', 'coRenderLista', 'cheio', () => {
  A.ctx.__e = Object.assign({}, EST, { saida: '2026-10-28' });
  run('hospHojeISO=function(){ return "2026-10-28"; }; CF_ESTADIAS_LIDO=true; CF_ESTADIAS={ e1:{id:"e1", e:__e} }; ehMoradorDaCasa=function(){ return false; }; estadiaVencida=function(){ return false; }; coRenderLista();');
  return els.coGrid.innerHTML;
});
tela('Check-in (busca do FILHOt)', 'renderCiBusca', 'cheio', () => {
  els.ciBusca = Object.assign(elemento('ciBusca'), { value: 'bisc' });
  run('renderCiBusca();');
  return els.ciResults.innerHTML;
});
tela('Cadastro (lista de peludinhos)', 'renderPel', 'curto', () => {
  els.pelSearch = Object.assign(elemento('pelSearch'), { value: '' });
  run('renderPel();');
  return els.pelBody.innerHTML;
});
tela('Painel do monitor: Quem vai embora hoje', 'pmSaidasConteudo', 'curto', () => {
  A.ctx.__d = { pronto: true, itens: [{ rk: CHAVE, e: Object.assign({}, EST, { saida: '2026-10-28' }) }] };
  run('pmSaidasDados=function(){ return __d; }; ehPernoite=function(){ return false; }; coEtapaDe=function(){ return 1; };');
  return run('pmSaidasConteudo()');
});

// ---- Vencimentos, pendências com o tutor e o Hoje
tela('Vencimentos (cartão do FILHOt)', 'vencCartaoHTML', 'cheio', () => {
  A.ctx.__o = { chave: CHAVE, nome: 'Biscoito', raca: 'Beagle', tutor: 'Tutor Exemplo', tel: '', atrasados: 1, itens: [], faltas: [] };
  return run('vencCartaoHTML(__o, "2026-10-28", "2026-10-28")');
});
tela('Pendências com o tutor (linha do Vencimentos)', 'vencPendLinhaHTML', 'cheio', () => {
  A.ctx.__x = { chave: CHAVE, pet: 'Biscoito', dia: '2026-10-28', estado: 'cobrar', itens: [], cobrancas: [], tentativas: [], rotulo: 'x', tutor: 'Tutor Exemplo', tipo: 'vermifugo' };
  return run('vencPendLinhaHTML(__x, "2026-10-28", Date.now())');
});
tela('Contatos com o tutor (linha da conversa)', 'contatosLinhaHTML', 'cheio', () => {
  A.ctx.__x = { chave: CHAVE, nome: 'Biscoito', grupo: 'cobrar', rotulo: 'r' };
  return run('contatosLinhaHTML(__x, 0)');
});
tela('Hoje na Zêluz (veio sem check-in do corpo)', 'hojeSemCheckinCardHTML', 'cheio', () => {
  A.ctx.__L = [{ p: P, nome: 'Biscoito' }];
  run('hojeSemCheckinLista=function(L){ return L; }; hojeSemCheckinNome=function(o){ return o.nome; };');
  return run('hojeSemCheckinCardHTML(__L)');
});
tela('Hoje na Zêluz (banho de quem faltou)', 'banhoFaltaCardHTML', 'cheio', () => {
  run('BANHO_FALTA_DIA=dcDataKey(); BANHO_FALTA=[{chave:' + JSON.stringify(CHAVE) + ',nome:"Biscoito"}]; BANHO_FALTA_CHEGOU=[]; BANHO_FALTA_DEC={};');
  return run('banhoFaltaCardHTML()');
});

// ---- Prevenção (listas e painel) e Banho
const OP = { p: P, nome: 'Biscoito', raca: 'Beagle', tutor: 'Tutor Exemplo', i: 0, faltas: [] };
tela('Prevenção (linha de cada assunto)', 'prevLinhaHTML', 'cheio', () => {
  A.ctx.__o = OP;
  return run('prevLinhaHTML(__o, {tipo:"sem"}, {k:"vermifugo", nome:"Vermífugo"}, "2026-10-28", false)');
});
tela('Prevenção (tabela de todos os FILHOts)', 'prevTabelaHTML', 'curto', () => {
  A.ctx.__o = OP;
  return run('prevTabelaHTML([__o], {})');
});
tela('Prevenção (check-up)', 'renderPrevCheckup', 'curto', () => {
  run('renderPrevCheckup()');
  return els.prevCheckup.innerHTML;
});
tela('Prevenção (painel da ficha de prevenção)', 'prevEdicaoHTML', 'cheio', () => {
  A.ctx.__o = { p: P, nome: 'Biscoito' };
  return run('prevEdicaoHTML(__o, ["vermifugo"])');
});
tela('Banho (linha de cada FILHOt)', 'banhosLinhaHTML', 'cheio', () => run('banhosLinhaHTML(PELUDINHOS[0])'));

// ---- Pernoite, Peso, Adaptação, Medicação
tela('Pernoite (cartão das pernoites de hoje)', 'pernCartaoHojeHTML', 'cheio', () => run('pernCartaoHojeHTML("2026-10-28", [{nome:"Biscoito", tutor:"Tutor Exemplo", refKey:' + JSON.stringify(CHAVE) + '}], {})'));
tela('Peso (tela de pesar)', 'renderPesoTela', 'cheio', () => {
  run('PESOT_I=0; PESOT_BUSCA=""; renderPesoTela();');
  return els.pesoTelaPainel.innerHTML;
});
// A data de hoje no relógio do aparelho (como o app conta), não a do UTC: depois das 21h de Brasília o UTC já
// está no dia seguinte, e o FILHOt inventado começaria a adaptação «amanhã» — a prova caía só à noite.
function hojeLocal() { const d = new Date(), p = (x) => String(x).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); }
tela('Em adaptação (cartão do Hoje na Zêluz)', 'renderAdaptPendentes', 'cheio', () => {
  A.ctx.__cad2 = {}; A.ctx.__cad2[CHAVE] = Object.assign({}, A.ctx.__cad[CHAVE], { adaptacao: 'Sim', adaptacao_desde: hojeLocal(), adaptacao_tipo: 'Day Care' });
  run('pelCadCache=__cad2; renderAdaptPendentes();');
  return els.adaptPendCard.innerHTML;
});
tela('Medicação atrasada (painel da Gestão)', 'renderMedAtrasadaGestora', 'curto', () => {
  A.ctx.__doses = [{ status: 'atrasada', atrasoMin: 30, hospNome: 'Biscoito', tutor: 'Tutor Exemplo', key: CHAVE, nome: 'Remédio Exemplo', horario: '08:00', q: '1', u: 'comprimido', itemId: 'i1', doseId: 'd1' }];
  run('urgMedAtrasada=function(){}; renderMedAtrasadaGestora(__doses);');
  return els.painelMedAtrasada.innerHTML;
});

// ---- Painel da supervisão
tela('Painel da supervisão: quem deixou comida', 'poCardComida', 'curto', () => run('poCardComida([{nome:"Biscoito", raca:"Beagle", tutor:"Tutor Exemplo", motivo:"deixou o prato", aviso:false, pronto:true}], 3)'));
tela('Painel da supervisão: questões da veterinária', 'poCardVet', 'curto', () => run('poCardVet([{nome:"Biscoito", texto:"remédio chegou ao fim", tipo:"remedio", grave:false}])'));
tela('Painel da supervisão: problemas do dia', 'poCardProblemas', 'curto', () => run('poCardProblemas([{lado:"Day Care", nome:"Biscoito", texto:"vomitou", ts:1, resolvido:false}])'));
tela('Painel da supervisão: ligações de adaptação', 'poCardLigacoes', 'curto', () => run('poCardLigacoes([{i:0, nome:"Biscoito", marco:30, quando:"2026-10-28", tutor:"Tutor Exemplo"}])'));
tela('Painel da supervisão: Enriquecimento (ficou de fora)', 'poCardEA', 'curto', () => {
  A.ctx.__E = { oque: 'Cabo de guerra', feitos: 1, etapas: [{ k: 'a', t: 'Manhã', ini: '08:00', fim: '08:30' }], impedidos: [{ n: 'Biscoito', motivo: 'restrição' }] };
  return run('poCardEA(__E)');
});
tela('Painel da supervisão: quem não veio', 'poCardFaltas', 'curto', () => {
  A.ctx.__T = { aulunos: [{ p: P }], avulsos: [], faltas: [{ p: P }], presentes: 0, semMarcar: 0, total: 1 };
  run('poMotivoDaFalta=function(){ return null; }; poTelDoTutor=function(){ return ""; };');
  return run('poCardFaltas(__T, "2026-10-28")');
});
tela('Painel da supervisão: pernoites sem check-in', 'poCardPernoites', 'curto', () => {
  A.ctx.__r = { nome: 'Biscoito', tutor: 'Tutor Exemplo', refKey: CHAVE, _dia: '2026-10-27', motivo: 'o tutor não buscou' };
  run('pernContagem=function(){ return {n:1}; }; pernAnterioresVisiveis=function(){ return [__r]; }; pernLista=function(){ return [__r]; }; pernNoiteTexto=function(){ return "ontem"; };');
  return run('poCardPernoites()');
});

// ---- Cabeçalhos de ficha: o selo vem das tarjas (alertPills) e, na ficha do cadastro, também do cabeçalho
prova('cabeçalhos de ficha: Plantão, Cuidado Vet e Conferência desenham as tarjas com o selo de alergia; o Check-in usa a mesma função das tarjas', () => {
  cadastro('frango');
  run('hospedes=[' + JSON.stringify(HOSP) + ']; abrirPlantao(0);');
  assert.ok(SELO_CHEIO.test(els['hf-pills'].innerHTML), 'Plantão (ficha do hóspede)');
  run('VET_LISTA=[' + JSON.stringify(HOSP) + ']; abrirVetFicha(0);');
  assert.ok(SELO_CHEIO.test(els['vf-pills'].innerHTML), 'Cuidado Vet (ficha)');
  run('CF_LISTA=[' + JSON.stringify(HOSP) + ']; abrirCfFicha(0);');
  assert.ok(SELO_CHEIO.test(els['cf-pills'].innerHTML), 'Conferência (ficha)');
  assert.ok(/ciPills'\)\.innerHTML=\(typeof alertPills==='function'\)\?alertPills\(/.test(html), 'Check-in: a tarja ciPills sai do alertPills');
  cadastro('');
  run('hospedes=[' + JSON.stringify(HOSP) + ']; abrirPlantao(0);');
  assert.ok(!/alergia-selo/.test(els['hf-pills'].innerHTML), 'sem alergia, sem selo');
  cadastro('frango');
});

prova('ficha do cadastro: o cabeçalho mostra o selo logo depois do tutor e acompanha o campo Alergia na hora (refreshPills)', () => {
  doc.body.dataset.role = 'gestao';
  cadastro('frango');
  run("almCadCache={}; pelAtual=null; pelOrigem='peludinhos'; abrirPeludinho(0);");
  const h = els['pel-ficha'].innerHTML;
  assert.ok(/<div class="hf-estadia">Tutor: Tutor Exemplo<\/div>\s*<div id="pelAlergiaCab"[^>]*><span class="alergia-selo" role="note">⚠ ALERGIA A FRANGO<\/span><\/div>/.test(h), 'o selo vem depois do tutor, no cabeçalho');
  assert.ok(h.indexOf('id="pelAlergiaCab"') < h.indexOf('id="pelFaixa"') && h.indexOf('id="pelFaixa"') < h.indexOf('id="pelAbas"'), 'cabeçalho, faixa, abas');
  assert.ok(/<div id="pelPills2">/.test(h) && /alergia-selo/.test(h.slice(h.indexOf('id="pelPills2"'), h.indexOf('id="pelPills2"') + 200)), 'as tarjas da Saúde também');
  // o campo muda: o selo do cabeçalho acompanha
  A.ctx.__cad[CHAVE].alergia = 'ovo';
  run('refreshPills();');
  assert.strictEqual(els.pelAlergiaCab.innerHTML, '<span class="alergia-selo" role="note">⚠ ALERGIA A OVO</span>');
  A.ctx.__cad[CHAVE].alergia = '';
  run('refreshPills();');
  assert.strictEqual(els.pelAlergiaCab.innerHTML, '', 'esvaziou o campo: o selo some');
  cadastro('frango');
});

prova('ficha › Saúde: ao lado de «Não tem», o botão rápido «ALERGIA A TUDO» (só com o campo vazio) grava alergia=\'TUDO\' pelo setPelExtra; com texto, o botão some', () => {
  doc.body.dataset.role = 'gestao';
  cadastro('');
  run("almCadCache={}; pelAtual=null; pelOrigem='peludinhos'; abrirPeludinho(0);");
  const h = els['pel-ficha'].innerHTML;
  const campo = h.slice(h.indexOf('<label>Alergia</label>'), h.indexOf('<label>Restrição alimentar</label>'));
  assert.ok(/onclick="pelNaoTemGravar\('alergia','alergia'\)">Não tem<\/button>/.test(campo), 'o «Não tem» continua');
  assert.ok(/onclick="pelAlergiaTudoGravar\(\)">ALERGIA A TUDO<\/button>/.test(campo), 'o botão rápido está no mesmo campo');
  assert.ok(campo.indexOf('>Não tem</button>') < campo.indexOf('>ALERGIA A TUDO</button>'), 'ao lado, depois do «Não tem»');
  // o clique grava pela porta única da ficha
  A.ctx.__gravou = [];
  run('__setBk=setPelExtra; setPelExtra=function(p,patch,op){ __gravou.push(JSON.parse(JSON.stringify(patch))); return Promise.resolve({ok:true}); }; renderPelFicha=function(){};');
  try { run('pelAlergiaTudoGravar();'); } finally { run('setPelExtra=__setBk;'); }
  assert.deepStrictEqual(lista(A.ctx.__gravou), [{ alergia: 'TUDO' }], 'o mesmo campo alergia, o mesmo caminho');
  // com alergia escrita o botão rápido não aparece
  cadastro('frango');
  run("almCadCache={}; pelAtual=null; pelOrigem='peludinhos'; abrirPeludinho(0);");
  const h2 = els['pel-ficha'].innerHTML;
  assert.ok(!/pelAlergiaTudoGravar/.test(h2.slice(h2.indexOf('<label>Alergia</label>'), h2.indexOf('<label>Restrição alimentar</label>'))));
});

prova('«ALERGIA A TUDO» na ficha segue a mesma permissão de editar a alergia: o porteiro responde igual para {alergia:TUDO} e {alergia:frango} em todos os papéis; nenhuma permissão nova de alergia', () => {
  const papeis = ['gestao', 'supervisor', 'diretoria', 'monitor', 'vet', 'plantonista', 'consultora', 'aprendiz'];
  papeis.forEach((p) => {
    doc.body.dataset.role = p;
    A.ctx.__a = { alergia: 'TUDO' }; A.ctx.__b = { alergia: 'frango' };
    assert.deepStrictEqual(lista(run('pelCamposBarrados(__a)')), lista(run('pelCamposBarrados(__b)')), p);
  });
  doc.body.dataset.role = 'monitor';
  A.ctx.__a = { alergia: 'TUDO' };
  assert.deepStrictEqual(lista(run('pelCamposBarrados(__a)')), [], 'a monitora grava alergia (editar-alergia)');
  doc.body.dataset.role = 'vet';
  assert.deepStrictEqual(lista(run('pelCamposBarrados(__a)')), ['alergia'], 'a veterinária não grava alergia');
  doc.body.dataset.role = 'gestao';
  assert.deepStrictEqual(lista(run("PERM['editar-alergia']")), ['gestao', 'supervisor', 'diretoria', 'monitor'], 'editar-alergia segue como era');
  assert.ok(!Object.keys(lista(run('PERM'))).some((k) => /alergia/.test(k) && k !== 'editar-alergia'), 'nenhuma permissão nova de alergia');
});

// ---- O check-in do Day Care (#v-daycare): com a autorização da dona (28/out/2026), SÓ o selo entrou nas telas dele
// A turma do dia é só o FILHOt inventado; o resto de cada tela roda como no app.
function turmaSoBiscoito() {
  run('turmaDoDia=function(){ return [{p:PELUDINHOS[0], i:0}]; }; ativTurmaPresente=function(){ return {lista:[{p:PELUDINHOS[0], i:0}]}; };');
}
tela('Chamada do Day Care', 'renderDaycare', 'cheio', () => {
  turmaSoBiscoito(); run('dcChamada={}; renderDaycare();');
  return els.dcGrid.innerHTML;
});
tela('Check-in do corpo (a grade)', 'renderCheckinExec', 'cheio', () => {
  turmaSoBiscoito(); run("dcAtiv='checkin-corpo'; ckAtual=null; ckDados={}; renderCheckinExec();");
  return els.ckGrid.innerHTML;
});
tela('Check-in do corpo (a ficha aberta)', 'ckFichaHtml', 'cheio', () => {
  turmaSoBiscoito(); run("dcAtiv='checkin-corpo'; ckAtual={p:PELUDINHOS[0], i:0}; ckRascunho={pontos:{}};");
  const h = run('ckFichaHtml()'); run('ckAtual=null; ckRascunho=null;');
  return h;
});
tela('Pertences (a grade)', 'renderPertences', 'cheio', () => {
  turmaSoBiscoito(); run("dcAtiv='checkin-pert'; ptAtual=null; ptDados={}; renderPertences();");
  return els.ptGrid.innerHTML;
});
tela('Pertences (a ficha aberta)', 'ptFichaHtml', 'cheio', () => {
  turmaSoBiscoito(); run("dcAtiv='checkin-pert'; ptAtual={p:PELUDINHOS[0], i:0}; ptRascunho={itens:{}};");
  const h = run('ptFichaHtml()'); run('ptAtual=null; ptRascunho=null;');
  return h;
});
tela('Almoço do Day Care', 'renderAlmoco', 'cheio', () => {
  turmaSoBiscoito(); run('almMarcas={}; renderAlmoco();');
  return els.almGrid.innerHTML;
});
tela('Outras atividades do Day Care', 'renderGenerico', 'cheio', () => {
  turmaSoBiscoito(); run("dcAtiv='recreacao'; genMarcas={}; renderGenerico();");
  return els.genGrid.innerHTML;
});
tela('Peso do dia (atividade)', 'renderPesoAtiv', 'cheio', () => {
  turmaSoBiscoito(); run('renderPesoAtiv();');
  return els.genGrid.innerHTML;
});
tela('Foto do dia (atividade)', 'renderFotoAtiv', 'cheio', () => {
  turmaSoBiscoito(); run('renderFotoAtiv();');
  return els.genGrid.innerHTML;
});
tela('Diária avulsa (a busca)', 'renderAvulsaResults', 'cheio', () => {
  run("dcAvulsos=[]; document.getElementById('avBusca').value='biscoito'; renderAvulsaResults();");
  return els.avResults.innerHTML;
});
// a tarja que já existia no check-in (sobre a foto) continua lá: o selo entrou ao lado, nada saiu
prova('check-in do Day Care: a tarja de antes continua, e cada tela chama o selo uma vez só', () => {
  cadastro('frango');
  turmaSoBiscoito(); run('dcChamada={}; renderDaycare();');
  assert.ok(/<span class="mini-alert">ALÉRGICO<\/span>/.test(els.dcGrid.innerHTML), 'a tarja ALÉRGICO segue na chamada');
  ['renderDaycare', 'renderAlmoco', 'renderCheckinExec', 'renderPertences', 'renderGenerico', 'renderPesoAtiv', 'renderFotoAtiv', 'renderAvulsaResults', 'ckFichaHtml', 'ptFichaHtml']
    .forEach((f) => assert.strictEqual(run('String(' + f + ')').split('alergiaSeloHTML(').length - 1, 1, f + ' chama o selo uma vez'));
});

// ---- A área protegida do check-in do Day Care fica igual à do commit 870f235
prova('área protegida: as funções ck*/ckt*/pt*/pendAvisarChegada (sem a chamada do selo) e o #v-daycare têm o texto do commit 870f235; as telas do Day Care ganharam o selo', () => {
  const sha = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);
  const protegidas = lista(run("Object.getOwnPropertyNames(globalThis).filter(function(k){ return typeof globalThis[k]==='function' && (/^(ck|ckt|pt)/.test(k) || k==='pendAvisarChegada'); }).sort()"));
  // (medidos no commit 870f235, neste mesmo sandbox: 157 funções e o #v-daycare; iguais aos do commit ecc4719 da parte A)
  assert.strictEqual(protegidas.length, 157, 'as mesmas funções');
  // Antes: o hash era medido no texto inteiro das funções. Depois: medido sem a chamada `+alergiaSeloHTML(p)`.
  // Por quê: a dona autorizou (28/out/2026) mexer no check-in do Day Care SÓ para mostrar o selo de alergia. Tirando
  // a chamada, o texto tem de dar o mesmo hash de antes: prova que o selo foi a única mudança na área protegida.
  assert.strictEqual(sha(protegidas.map((nm) => nm + '\n' + run('String(' + nm + ')').split('+alergiaSeloHTML(p)').join('')).join('\n')), '73e7f281aff59c01', 'o texto de cada uma, igual ao do 870f235');
  const iDc = html.indexOf('id="v-daycare"'), jDc = html.indexOf('id="v-', iDc + 10);
  assert.strictEqual(sha(html.slice(iDc, jDc)), '4c438983ed2b9c0a', 'o #v-daycare, igual ao do 870f235');
  // Antes: as telas do #v-daycare ficavam sem o selo. Depois (28/out/2026, com a autorização da dona): as que desenham o
  // nome do FILHOt chamam o selo — a prova de cada uma está nas telas do Day Care, logo acima.
  ['renderDaycare', 'renderAlmoco', 'renderCheckinExec', 'renderPertences', 'renderGenerico', 'renderPesoAtiv', 'renderFotoAtiv', 'renderAvulsaResults', 'ckFichaHtml', 'ptFichaHtml']
    .forEach((f) => assert.ok(/alergiaSeloHTML\(/.test(run('String(' + f + ')')), f + ' mora no #v-daycare: com o selo'));
});

prova('o inventário está completo na prova: toda tela da lista foi montada com um FILHOt com alergia (selo cheio ou curto) e sem alergia (sem selo)', () => {
  const nomes = TELAS.map((t) => t.funcao);
  ['renderHosp', 'renderHospBuscaResults', 'hospAbaLinha', 'renderCafe', 'renderVetLista', 'cfCardHTML', 'coRenderLista', 'renderCiBusca', 'renderPel', 'pmSaidasConteudo',
    'vencCartaoHTML', 'vencPendLinhaHTML', 'contatosLinhaHTML', 'hojeSemCheckinCardHTML', 'banhoFaltaCardHTML', 'prevLinhaHTML', 'prevTabelaHTML', 'renderPrevCheckup', 'prevEdicaoHTML', 'banhosLinhaHTML',
    'pernCartaoHojeHTML', 'renderPesoTela', 'renderAdaptPendentes', 'renderMedAtrasadaGestora', 'poCardComida', 'poCardVet', 'poCardProblemas', 'poCardLigacoes', 'poCardEA', 'poCardFaltas', 'poCardPernoites']
    .forEach((f) => assert.ok(nomes.indexOf(f) >= 0, 'tela sem prova: ' + f));
  assert.ok(TELAS.length >= 32, 'telas provadas: ' + TELAS.length);
  assert.ok(TELAS.some((t) => t.versao === 'curto') && TELAS.some((t) => t.versao === 'cheio'));
});

prova('regras da casa: os textos novos não têm termo proibido nem alert/confirm/prompt; só a alergia digitada passa por escAttr', () => {
  const fonte = html.slice(html.indexOf('function alergiaDoAlvo('), html.indexOf('function alergiaSeloHTML(')) + run('String(alergiaSeloHTML)') + run('String(alergiaSeloDeTexto)') + run('String(pelAlergiaTudoHTML)') + run('String(pelAlergiaTudoGravar)');
  const so = fonte.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  assert.ok(!/\b(c[ãa]o|c[ãa]es|cachorro|cachorros|baia|baias|soltar|solto|solta)\b/i.test(so), 'vocabulário da casa');
  assert.ok(!/\balert\s*\(|\bconfirm\s*\(|\bprompt\s*\(/.test(so), 'sem janela nativa');
  assert.ok(/escAttr\(cheio\)/.test(run('String(alergiaSeloDeTexto)')), 'o texto digitado passa por escAttr');
  assert.ok(!/innerHTML\s*=/.test(so), 'as funções do selo só devolvem texto');
});

// (as demais telas entram abaixo; este bloco final roda a fila)
(async () => {
  for (const [nome, fn] of fila) {
    try { await fn(); n += 1; } catch (e) { console.error('FALHOU: ' + nome); throw e; }
  }
  console.log('alergia-destaque164: OK (' + n + ' provas)');
})().catch((e) => { console.error(e); process.exitCode = 1; });
