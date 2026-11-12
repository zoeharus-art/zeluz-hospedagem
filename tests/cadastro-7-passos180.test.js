'use strict';

// NOVO AULUNO EM 7 PASSOS (Adriana, 11/nov/2026; maquete aprovada em 12/nov/2026): "Não abre a ficha completa, não tem
// informação de seresto, microchip, data de nascimento, se é castrado, macho ou fêmea... Tinha que ter tudo de uma só vez...
// passando de uma tela para outra, obrigatoriamente." Esta prova monta o app inteiro num sandbox (sem rede, banco de mentira,
// nomes inventados) e confere: o que cada passo cobra, o texto que acompanha o sexo do FILHOt, os campos que o cadastro grava
// (os MESMOS que a ficha lê, nos mesmos formatos), que grava UMA vez e que o plano em dinheiro fica só de rascunho.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const APP = path.join(__dirname, '..', 'auaulandia', 'index.html');
const html = fs.readFileSync(APP, 'utf8');

function universal(name) {
  const fn = function () { return fn; };
  return new Proxy(fn, {
    get(t, p) { if (p === Symbol.toPrimitive) return () => ''; if (p === 'then') return undefined; if (p in t) return t[p]; return universal(name + '.' + String(p)); },
    set() { return true; }, apply() { return universal(name + '()'); }, construct() { return universal('new ' + name); },
  });
}
function elemento(id) {
  return { id, innerHTML: '', style: { setProperty() {} }, dataset: {}, className: '', value: '', textContent: '', open: false, offsetParent: {}, offsetHeight: 0, hidden: false, scrollTop: 0,
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
function abrirApp() {
  const els = {};
  const getEl = (id) => (els[id] = els[id] || elemento(id));
  const corpo = { dataset: { role: 'gestao' }, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, appendChild() {}, style: {}, addEventListener() {}, setAttribute() {}, getAttribute() { return null; } };
  const doc = { body: corpo, head: { appendChild() {} }, documentElement: universal('documentElement'), getElementById: getEl, querySelector() { return null; }, querySelectorAll() { return []; }, createElement() { return universal('el'); }, addEventListener() {}, getElementsByClassName() { return []; }, getElementsByTagName() { return []; }, cookie: '', activeElement: null };
  const nunca = new Promise(() => {});
  const sandbox = { console, Date, Math, JSON, Object, Array, String, Number, Boolean, parseInt, parseFloat, isNaN, isFinite, RegExp, Promise, Map, Set, Symbol, encodeURIComponent, decodeURIComponent,
    setTimeout() {}, clearTimeout() {}, setInterval() {}, clearInterval() {}, requestAnimationFrame() {}, performance: { now() { return 0; } }, document: doc,
    firebase: { initializeApp() { return {}; }, auth() { return { signInAnonymously() { return nunca; }, onAuthStateChanged() {} }; }, database() { return { ref() { return universal('ref'); } }; } },
    localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} }, navigator: { userAgent: 'prova', onLine: true }, location: { href: 'https://prova.local/', reload() {}, hostname: 'prova.local' },
    Blob: class Blob {}, alert() {}, confirm() { return true; }, prompt() { return ''; }, scrollTo() {}, addEventListener() {}, getComputedStyle() { return {}; } };
  sandbox.window = sandbox; sandbox.globalThis = sandbox; sandbox.self = sandbox;
  const ctx = vm.createContext(sandbox);
  vm.runInContext(scriptsDoApp(html), ctx, { filename: 'index.html#script', timeout: 30000 });
  const run = (c) => vm.runInContext(c, ctx);
  return { ctx, run, els, doc };
}

const A = abrirApp();
const { run, els } = A;
const J = (c) => JSON.parse(run('JSON.stringify(' + c + ')'));
const HOJE = run('hojeISO()');
const ontem = run("addDiasISO(hojeISO(),-1)");

// um cadastro inteiro, válido (FILHOt e família inventados)
function cheio(extra) {
  run('NA_S=naEstadoNovo(); NA_PASSO=1; NA_MAX=1; NA_TENTOU={};');
  A.ctx.__x = Object.assign({
    nome: 'Bolota', apelido: 'Bolotinha', raca: 'Shih Tzu', sexo: 'Fêmea', castrado: 'Sim', nasc: '2022-05-03', peso: '6,4', chip: 'Tem', chipNum: '985 112 003 456 789',
    t1: 'Joana Exemplo', t1tel: '(31) 90000-0000', seresto: 'Usa', serestoData: ontem, alergia: 'Não tem', saude: 'Não',
    vermProd: 'Endogard', ectoMarca: 'Simparic', refs: ['Jantar', 'Café da manhã'], mistura: 'Não', outros: 'Se dá bem', pessoas: 'Às vezes estranha', atacou: 'Não',
    eaNao: true, plano: 'Avulso · diária',
  }, extra || {});
  run('Object.assign(NA_S, __x);');
  run("NA_S.p.vac_mult.af=true; NA_S.p.vac_raiva.af=true; NA_S.p.vac_gripe.af=true; NA_S.p.verm.d=__ontem; NA_S.p.ecto.d=__ontem;".replace(/__ontem/g, JSON.stringify(ontem)));
}
const faltas = (n) => J('naFaltas(' + n + ').map(function(f){ return f.fk; })');

let n = 0;
const fila = [];
function prova(nome, fn) { fila.push([nome, fn]); }

prova('a tela: o modal é o card vazio que o naRender desenha; os campos do modal de 2 campos saíram', () => {
  assert.ok(/<div id="novoAlunoModal" onclick="if\(event\.target===this\)fecharNovoAluno\(\)">\s*<div class="na-card" id="naCad" role="dialog" aria-modal="true" aria-labelledby="naTitulo"><\/div>/.test(html));
  ['id="naNome"', 'id="naTutor"', 'id="naTel"', 'id="naPrev"', 'naRenderPrev', 'NA_AFAZER'].forEach((s) => assert.ok(html.indexOf(s) < 0, 'sobrou: ' + s));
  // o CSS do cadastro fica preso ao modal: nenhuma regra nova solta mexe em outra tela
  const i = html.indexOf('/* NOVO AULUNO EM 7 PASSOS'), j = html.indexOf('\n  }', html.indexOf('@media(max-width:640px){', i));
  const css = html.slice(i, j).split('\n').filter((l) => /\{/.test(l) && !/^\s*\/\*/.test(l) && !/@media/.test(l));
  css.forEach((l) => assert.ok(/^\s*#novoAlunoModal/.test(l), 'regra solta: ' + l.trim()));
});

prova('o bloco novo segue as regras da casa: sem alert/confirm/prompt, sem vocabulário proibido', () => {
  const i = html.indexOf('// ===== NOVO AULUNO EM 7 PASSOS'), j = html.indexOf('// Excluir cadastro DE VERDADE', i);
  const bloco = html.slice(i, j);
  assert.ok(i > 0 && j > i);
  // só o alert de permissão que já existia no inserirAluno
  assert.strictEqual((bloco.match(/\balert\(/g) || []).length, 1);
  assert.ok(!/\bconfirm\(|\bprompt\(/.test(bloco));
  assert.ok(!/\bc[ãa]o\b|cachorr|\bbaia\b|\bsolt[ao]r?\b/i.test(bloco.replace(/\/\/.*$/gm, '')), 'vocabulário proibido');
});

prova('passo 1 vazio cobra os 7 obrigatórios; o texto acompanha o sexo (Castrada, Jeito dela, pela Bolota)', () => {
  run('inserirAluno();');
  assert.deepStrictEqual(J('[NA_PASSO, NA_S.nome]'), [1, '']);
  assert.deepStrictEqual(faltas(1), ['nome', 'raca', 'sexo', 'castrado', 'nasc', 'peso', 'chip']);
  assert.ok(/Passo 1 de 7 · FILHOt/.test(els.naCad.innerHTML));
  run("NA_S.nome='Bolota'; NA_S.sexo='Fêmea';");
  assert.deepStrictEqual(J('[naCast(), naJeitoTit(), naComNome("pel"), naComNome("d")]'), ['Castrada', 'Jeito dela', 'pela Bolota', 'da Bolota']);
  run("NA_S.sexo='Macho';");
  assert.deepStrictEqual(J('[naCast(), naJeitoTit(), naComNome("pel")]'), ['Castrado', 'Jeito dele', 'pelo Bolota']);
});

prova('passo 1: microchip com 15 dígitos; nascimento possível; peso que o app entende; idade aproximada no lugar da data', () => {
  cheio();
  assert.deepStrictEqual(faltas(1), []);
  run("NA_S.chipNum='12345';"); assert.deepStrictEqual(faltas(1), ['chipNum']);
  run("NA_S.chip='Não tem'; NA_S.chipNum='';"); assert.deepStrictEqual(faltas(1), []);
  run("NA_S.nasc='2099-01-01';"); assert.deepStrictEqual(faltas(1), ['nasc']);
  run("NA_S.dataModo='idade'; NA_S.idade='3';"); assert.deepStrictEqual(faltas(1), []);
  run("NA_S.idade='40';"); assert.deepStrictEqual(faltas(1), ['nasc']);
  run("NA_S.dataModo='data'; NA_S.nasc='2022-05-03'; NA_S.peso='abc';"); assert.deepStrictEqual(faltas(1), ['peso']);
});

prova('passo 2: Tutor 1 com sobrenome e telefone com DDD; Tutor 2 preenchido pede telefone e o tutor principal', () => {
  cheio();
  assert.deepStrictEqual(faltas(2), []);
  run("NA_S.t1='Joana'; NA_S.t1tel='9999';"); assert.deepStrictEqual(faltas(2), ['t1', 't1tel']);
  run("NA_S.t1='Joana Exemplo'; NA_S.t1tel='31900000000'; NA_S.t2='Paulo Exemplo';"); assert.deepStrictEqual(faltas(2), ['t2tel', 'tprinc']);
  run("NA_S.t2tel='31911111111'; NA_S.tprinc='Tutor 2';"); assert.deepStrictEqual(faltas(2), []);
});

prova('passo 3: cada prevenção pede a data ou «a fazer na Zêluz»; com data, o produto; Seresto, alergia e saúde respondidas', () => {
  cheio();
  assert.deepStrictEqual(faltas(3), []);
  run("NA_S.p.vac_mult.af=false;"); assert.deepStrictEqual(faltas(3), ['p_vac_mult']);
  run("NA_S.p.vac_mult.af=true; NA_S.vermProd=''; NA_S.ectoMarca='';"); assert.deepStrictEqual(faltas(3), ['vermProd', 'ectoMarca']);
  run("NA_S.vermProd='Endogard'; NA_S.ectoMarca='Simparic'; NA_S.seresto=''; NA_S.alergia='Tem'; NA_S.saude='';"); assert.deepStrictEqual(faltas(3), ['seresto', 'alergiaQ', 'saude']);
  run("NA_S.p.verm.d='2099-01-01'; NA_S.seresto='Usa'; NA_S.serestoData=''; NA_S.alergia='Não tem'; NA_S.saude='Não';"); assert.deepStrictEqual(faltas(3), ['p_verm', 'serestoData']);
});

prova('passos 4, 5 e 6: refeições, o jeito e o EA respondidos; aulas por semana = dias marcados', () => {
  cheio();
  [4, 5, 6].forEach((p) => assert.deepStrictEqual(faltas(p), [], 'passo ' + p));
  run("NA_S.refs=[]; NA_S.outros=''; NA_S.eaNao=false; NA_S.eaRestr='';");
  assert.deepStrictEqual([faltas(4), faltas(5)], [['refs'], ['outros', 'eaRestr']]);
  run("NA_S.plano='Mensal · Silver'; NA_S.vezes='2x'; NA_S.dias=['seg'];");
  assert.deepStrictEqual(J('naFaltas(6)'), [{ fk: 'dias', txt: 'marcar mais 1 dia da semana (são 2x por semana)' }]);
  run("NA_S.dias=['seg','qua','sex'];"); assert.deepStrictEqual(J('naFaltas(6).map(function(f){ return f.txt; })'), ['tirar 1 dia da semana (são 2x por semana)']);
  run("NA_S.dias=['seg','qua'];"); assert.deepStrictEqual(faltas(6), []);
});

prova('o que grava: os MESMOS campos e formatos da ficha (Nao sem acento, refeições na ordem, microchip, Seresto, «não tem» com quem e quando)', () => {
  cheio({ adaptacao: 'Não', t2: 'Paulo Exemplo', t2tel: '(31) 91111-1111', tprinc: 'Tutor 2', restr: 'sem frango', med: 'Sim', medQ: 'Remédio X 1x ao dia',
    checkupFez: 'Sim', checkupT: ontem, escovaT: ontem, compCasa: 'Calma', matilha: 'Pequeno porte', racaoMarca: 'Ração Exemplo', passeia: 'Sim' });
  const r = J("naMontarRegistro('Gestora Exemplo')");
  const g = r.reg;
  assert.deepStrictEqual([g.n, g.raca, g.tutor, g.tel, g.apelido, g.sexo, g.castrado, g.nasc], ['Bolota', 'Shih Tzu', 'Joana Exemplo', '(31) 90000-0000', 'Bolotinha', 'Fêmea', 'Sim', '2022-05-03']);
  assert.deepStrictEqual([g.chip, g.microchip], ['985112003456789', '985112003456789']);
  assert.deepStrictEqual(g.pesos.map((p) => [p.data, p.kg, p.quem]), [[HOJE, 6.4, 'Gestora Exemplo']]);
  assert.deepStrictEqual([g.adaptacao, g.alim_mistura, g.alim_refs], ['Nao', 'Nao', 'Café da manhã · Jantar']);
  assert.deepStrictEqual([g.tutor2, g.tel2, g.tutorPrinc], ['Paulo Exemplo', '(31) 91111-1111', 'Tutor 2']);
  assert.deepStrictEqual([g.vac_mult_afazer, g.vac_raiva_afazer, g.vac_gripe_afazer, g.vac_mult_t], [true, true, true, undefined]);
  assert.deepStrictEqual([g.verm_t, g.verm_p, g.verm_nome, g.ecto_t, g.ecto_p, g.ecto_nome],
    [ontem, run('addDiasISO(' + JSON.stringify(ontem) + ',120)'), 'Endogard', ontem, run('addDiasISO(' + JSON.stringify(ontem) + ',30)'), 'Simparic']);
  assert.deepStrictEqual([g.col_nome, g.col_t, g.col_p], ['Seresto', ontem, run("addDiasISO(" + JSON.stringify(ontem) + ", coleiraDur({col_nome:'Seresto'}))")]);
  assert.deepStrictEqual([g.checkup_fez, g.checkup_t, g.checkup_p, g.checkup_data, g.checkup], ['Sim', ontem, run('addDiasISO(' + JSON.stringify(ontem) + ',365)'), ontem, ontem]);
  assert.deepStrictEqual([g.escova_t, g.escova_p], [ontem, run('addDiasISO(' + JSON.stringify(ontem) + ',90)')]);
  assert.strictEqual(g.alergia, ''); assert.strictEqual(g.alergia_nenhuma.quem, 'Gestora Exemplo'); assert.strictEqual(typeof g.alergia_nenhuma.ts, 'number');
  assert.deepStrictEqual([g.restricao, g.medicacao, g.problema], ['sem frango', 'Remédio X 1x ao dia', undefined]);
  assert.deepStrictEqual([g.comp_peludos, g.comp_pessoas, g.atacou, g.comp_casa, g.ea_restr_nao, g.ea_restr, g.matilha], ['Se dá bem', 'Às vezes estranha', 'Não', 'Calma', true, undefined, 'Pequeno porte']);
  assert.deepStrictEqual([g.alim_racao_marca, g.passeia], ['Ração Exemplo', 'Sim']);
  // avulso: sem dias fixos e sem plano de rascunho
  assert.deepStrictEqual([g.categoria, g.dias, g.freq, r.plano], ['avulso', [], '', null]);
  // nada de campo com nome inventado: tudo o que grava a ficha já conhece (ou é da prevenção / do «não tem»)
  const conhecidos = /^(n|raca|tutor|tel|tel2|tutor2|tutorPrinc|apelido|sexo|castrado|nasc|idadeAprox|pesos|chip|microchip|microchip_nao_tem|foto|matricula|adaptacao|adaptacao_desde|adaptacao_tipo|bairro|indicou|vetNome|vetTel|vetClinica|vetEnd|(vac_mult|vac_raiva|vac_gripe|verm|ecto)_(t|p|p_manual|afazer)|verm_nome|ecto_nome|col_nome|col_t|col_p|checkup_fez|checkup_t|checkup_p|checkup_data|checkup|escova_t|escova_p|alergia|alergia_nenhuma|problema|restricao|medicacao|alim_racao_marca|alim_racao_qtd|alim_nat|alim_nat_qtd|alim_horarios|alim_refs|alim_mistura|alim_obs|passeia|banheiro|comp_peludos|comp_pessoas|atacou|comp_casa|medos|manias|brincadeira|obs_tutor|ea_restr|ea_restr_nao|matilha|categoria|dias|freq)$/;
  Object.keys(g).forEach((k) => assert.ok(conhecidos.test(k), 'campo desconhecido: ' + k));
});

prova('o «Vence em» digitado (Gestão) manda e não inventa a última dose; o «Não tem» do microchip vira o selo da ficha', () => {
  cheio({ chip: 'Não tem', chipNum: '' });
  run("NA_S.p.vac_mult.af=false; NA_S.p.vac_mult.v='2027-03-01';");
  const g = J("naMontarRegistro('Gestora Exemplo').reg");
  if (run('podeVencManual()')) {
    assert.deepStrictEqual([g.vac_mult_t, g.vac_mult_p, g.vac_mult_p_manual], [undefined, '2027-03-01', true]);
  }
  assert.deepStrictEqual([g.microchip, g.chip, g.microchip_nao_tem.quem], [run('Z_NAO_TEM'), '', 'Gestora Exemplo']);
});

prova('o plano: quem vê plano escolhe Mensal/Trimestral/Semestral (fica de rascunho); quem não vê, só a categoria', () => {
  cheio({ plano: 'Trimestral · Gold', vezes: '2x', dias: ['ter', 'qui'], ordemPet: '2º', dataPag: HOJE });
  if (run("podePapel('ver-plano')")) {
    const r = J("naMontarRegistro('Gestora Exemplo')");
    assert.deepStrictEqual([r.reg.categoria, r.reg.dias, r.reg.freq, r.plano], ['auluno', ['ter', 'qui'], '2x', { plano: 'Gold', ordemPet: 2, inicio: HOJE }]);
    assert.ok(r.reg.renov === undefined, 'o plano em dinheiro NÃO grava no cadastro');
  }
  const bk = run('podePapel');
  run("podePapel=function(c){ return c!=='ver-plano'; };");
  try {
    assert.deepStrictEqual(J('naPlanoOpcoes().map(function(o){ return o.v; })'), ['Auluno do Day Care', 'Avulso · diária', 'Só AuAulândia · hospedagem']);
    run("NA_S.plano='Auluno do Day Care';");
    const r2 = J("naMontarRegistro('Recepção Exemplo')");
    assert.deepStrictEqual([r2.reg.categoria, r2.reg.dias, r2.plano], ['auluno', ['ter', 'qui'], null]);
  } finally { A.ctx.__bk = bk; run('podePapel=__bk;'); }
});

prova('cadastrar: falta num passo abre aquele passo; completo, grava UMA vez em daycare/cadastro/<chave>, abre a ficha e limpa o cadastro', async () => {
  run("gateCadastro=function(){ return true; }; __w=[]; __au=[]; audit=function(){ __au.push([].slice.call(arguments)); };"
    + "DB={ref:function(p){ return {update:function(o){ __w.push([p,o]); return Promise.resolve(); }, set:function(){ return Promise.resolve(); }, push:function(){ return {set:function(){ return Promise.resolve(); }}; }, once:function(){ return new Promise(function(){}); }, on:function(){}, off:function(){}}; }};"
    + "PELUDINHOS=[]; pelCadCache={};");
  cheio({ seresto: '' });
  await run('criarAluno()');
  assert.deepStrictEqual(J('[NA_PASSO, NA_TENTOU[3], __w.length]'), [3, true, 0]);
  assert.ok(/Falta preencher:/.test(els.naFaltas.innerHTML));
  run("NA_S.seresto='Não usa';");
  await run('criarAluno()');
  for (let i = 0; i < 5; i++) await Promise.resolve();
  const w = J('__w');
  assert.strictEqual(w.length, 1, 'uma gravação só');
  assert.strictEqual(w[0][0], 'daycare/cadastro/' + run("pelKey({n:'Bolota',tutor:'Joana Exemplo'})"));
  assert.deepStrictEqual([w[0][1]._novo, w[0][1].n, w[0][1].sexo, w[0][1].col_nome], [true, 'Bolota', 'Fêmea', undefined]);
  assert.deepStrictEqual(J('[PELUDINHOS.length, PELUDINHOS[0].n, NA_S]'), [1, 'Bolota', null]);
  assert.strictEqual(J("__au.filter(function(a){ return a[0]==='cadastro-novo'; }).length"), 1, 'um rastro');
});

(async () => {
  for (const [nome, fn] of fila) {
    try { await fn(); n += 1; console.log('  ok  ' + nome); } catch (e) { console.error('FALHOU: ' + nome); throw e; }
  }
  console.log('cadastro-7-passos180: ' + n + ' de ' + fila.length + ' provas passaram');
})().catch((e) => { console.error(e); process.exitCode = 1; });
