'use strict';
/*
 * PROVA: Calendário Dez/Jan (Adriana, 16/nov/2026 — maquete respondida no mesmo dia).
 *
 * «Dezembro e janeiro ficam imensos, precisamos conseguir visualizar as vagas. Todos que forem
 *  fechando coloque no calendário. São no máximo 30 vagas por dia; além disso, só com autorização
 *  da Márcia.» Respostas: número grande = quem dorme; pernoite do Day Care ocupa vaga; acima de 30
 *  só avisa; sem confirmar aparece à parte, sem ocupar vaga; quem sai no dia libera a vaga da noite;
 *  o detalhe do dia se esconde com um toque; no menu, «Calendário Dez/Jan».
 *
 * Três partes: a conta pura (calendario-vagas.js), a tela e o aviso do Orçamento num sandbox, e o
 * encaixe no app (menu, permissão junto com o Orçamento, lista do site). Sem rede e sem banco.
 * Todo dado é inventado («Teste 01», «Tutora Teste»).
 *
 * Uso:  node tests/calendario-vagas185.test.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const RAIZ = path.join(__dirname, '..', 'auaulandia');
const APP = path.join(RAIZ, 'index.html');
const CV = require(path.join(RAIZ, 'calendario-vagas.js'));

let ok = 0; const falhas = []; let fila = Promise.resolve();
function prova(nome, fn) {
  fila = fila.then(async () => {
    try { await fn(); ok++; console.log('  ✓ ' + nome); }
    catch (e) { falhas.push(nome + ' — ' + e.message); console.log('  ✗ ' + nome + '\n      ' + e.message); }
  });
}
const igual = (a, b, msg) => assert.deepStrictEqual(JSON.parse(JSON.stringify(a)), b, msg);
const nomes = (l) => l.map((p) => p.nome);
// n FILHOts inventados num orçamento fechado
function lote(prefixo, n, entrada, saida, status) {
  const o = {};
  for (let i = 0; i < n; i++) o[prefixo + i] = { status: status || 'fechado', entrada, saida, tutor: 'Tutora ' + prefixo + i, pets: [{ nome: 'Teste ' + prefixo + i, raca: 'SRD' }] };
  return o;
}

// ------------------------------------------------------------------ 1. a conta pura
console.log('A conta das noites');
prova('temporada: em novembro e dezembro é dez deste ano + jan do próximo; em janeiro continua a do dezembro anterior', () => {
  igual(CV.temporada('2026-11-16'), { dez: '2026-12', jan: '2027-01', inicio: '2026-12-01', fim: '2027-01-31', ano: 2026 });
  igual(CV.temporada('2027-01-10').dez, '2026-12');
  igual(CV.diasDoMes('2026-12').length, 31);
  igual(CV.diasDoMes('2027-01')[30], '2027-01-31');
});
prova('a noite do dia D vai de D para D+1: quem sai no dia 26 NÃO dorme na noite 26 (a vaga fica livre) e aparece em «saem»', () => {
  const oc = CV.ocupacao({ orcamentos: { a: { status: 'fechado', entrada: '2026-12-20', saida: '2026-12-26', tutor: 'Tutora Teste', pets: [{ nome: 'Teste 01' }] } } }, '2026-12-01', '2027-01-31');
  igual(oc.dias['2026-12-19'].dormem.length, 0);
  igual(oc.dias['2026-12-20'].dormem.length, 1);
  igual(oc.dias['2026-12-25'].dormem.length, 1);
  igual(oc.dias['2026-12-26'].dormem.length, 0);
  igual(nomes(oc.dias['2026-12-20'].chegam), ['Teste 01']);
  igual(nomes(oc.dias['2026-12-26'].saem), ['Teste 01']);
});
prova('só o FECHADO ocupa vaga; o aguardando aparece à parte; não fechou, cancelado e anulado somem', () => {
  const oc = CV.ocupacao({ orcamentos: {
    f: { status: 'fechado', entrada: '2026-12-24', saida: '2026-12-27', pets: [{ nome: 'Teste F', tutor: 'Tutora F' }] },
    g: { status: 'aguardando', entrada: '2026-12-24', saida: '2026-12-27', pets: [{ nome: 'Teste G', tutor: 'Tutora G' }] },
    n: { status: 'nao_fechou', entrada: '2026-12-24', saida: '2026-12-27', pets: [{ nome: 'Teste N' }] },
    c: { status: 'cancelado', entrada: '2026-12-24', saida: '2026-12-27', pets: [{ nome: 'Teste C' }] },
    x: { status: 'anulado', entrada: '2026-12-24', saida: '2026-12-27', pets: [{ nome: 'Teste X' }] },
  } }, '2026-12-01', '2027-01-31');
  const d = oc.dias['2026-12-25'];
  igual(nomes(d.dormem), ['Teste F']);
  igual(nomes(d.aConfirmar), ['Teste G']);
  igual(nomes(oc.dias['2026-12-27'].saem), ['Teste F'], 'o sem confirmar não entra em «saem»');
});
prova('irmãos no mesmo orçamento ocupam duas vagas', () => {
  const oc = CV.ocupacao({ orcamentos: { a: { status: 'fechado', entrada: '2026-12-24', saida: '2026-12-26', tutor: 'Tutora Teste', pets: [{ nome: 'Teste 01' }, { nome: 'Teste 02' }] } } }, '2026-12-01', '2027-01-31');
  igual(oc.dias['2026-12-24'].dormem.length, 2);
});
prova('quem já fez check-in conta pela estadia (não duas vezes) e a saída antecipada libera as noites restantes', () => {
  const oc = CV.ocupacao({
    orcamentos: { a: { status: 'fechado', entrada: '2026-12-20', saida: '2026-12-30', tutor: 'Tutora Teste', pets: [{ nome: 'Teste 01', key: 'teste 01__tutora teste' }] } },
    estadias: { e1: { status: 'encerrada', nome: 'Teste 01', tutor: 'Tutora Teste', refKey: 'teste 01__tutora teste', entrada: '2026-12-20', saida: '2026-12-30',
      saida_antecipada: { em: '2026-12-24', noites: 6 } } },
  }, '2026-12-01', '2027-01-31');
  igual(oc.dias['2026-12-22'].dormem.length, 1);
  igual(oc.dias['2026-12-22'].dormem[0].origem, 'hospedado');
  igual(oc.dias['2026-12-24'].dormem.length, 0, 'a partir da saída antecipada a vaga está livre');
  igual(oc.dias['2026-12-28'].dormem.length, 0, 'o orçamento não ressuscita as noites que sobraram');
});
prova('check-out feito antes da saída prevista vale a data do check-out; estadia cancelada não conta', () => {
  const ts = Date.UTC(2026, 11, 22, 15);
  const oc = CV.ocupacao({ estadias: {
    e1: { status: 'finalizada', nome: 'Teste 01', tutor: 'Tutora Teste', entrada: '2026-12-18', saida: '2026-12-28', checkout: { ts } },
    e2: { status: 'cancelada', nome: 'Teste 02', tutor: 'Tutora Teste', entrada: '2026-12-18', saida: '2026-12-28' },
  }, diaDoTs: () => '2026-12-22' }, '2026-12-01', '2027-01-31');
  igual(oc.dias['2026-12-21'].dormem.length, 1);
  igual(oc.dias['2026-12-22'].dormem.length, 0);
});
prova('o mesmo FILHOt escrito com o tutor curto e inteiro é um só («João» × «João Francisco»); xará de outra tutora não', () => {
  const a = CV.ident('Teste 01', 'João', ''), b = CV.ident('Teste 01', 'João Francisco', ''), c = CV.ident('Teste 01', 'Maria', '');
  assert.ok(CV.mesmo(a, b)); assert.ok(!CV.mesmo(a, c));
});
prova('pernoite do Day Care ocupa a vaga da noite; a cancelada não; a que já virou check-in não conta duas vezes', () => {
  const oc = CV.ocupacao({
    estadias: { e1: { status: 'ativa', nome: 'Teste 01', tutor: 'Tutora Teste', entrada: '2026-12-26', saida: '2026-12-27' } },
    pernoites: { '2026-12-26': {
      'teste-01__tutora-teste': { nome: 'Teste 01', status: 'checkin_feito' },
      'teste-02__tutora-teste': { nome: 'Teste 02', status: 'aguardando' },
      'teste-03__tutora-teste': { nome: 'Teste 03', status: 'cancelado' },
    } },
  }, '2026-12-01', '2027-01-31');
  const d = oc.dias['2026-12-26'];
  igual(nomes(d.dormem), ['Teste 01', 'Teste 02']);
  igual(d.dormem.find((p) => p.nome === 'Teste 02').origem, 'pernoite');
});
prova('cores: até 24 folga, 25 a 29 enchendo, 30 lotado, mais de 30 acima (só com a Márcia)', () => {
  igual([0, 24, 25, 29, 30, 31].map(CV.nivel), ['folga', 'folga', 'enchendo', 'enchendo', 'lotado', 'acima']);
  igual([CV.vagas(27), CV.vagas(30), CV.vagas(33)], [3, 0, 0]);
});
prova('resumo do mês: noites lotadas, acima de 30, a noite mais cheia e as vagas livres', () => {
  const orc = Object.assign(lote('a', 30, '2026-12-27', '2026-12-29'), lote('b', 2, '2026-12-28', '2026-12-29'));
  const oc = CV.ocupacao({ orcamentos: orc }, '2026-12-01', '2027-01-31');
  const r = CV.resumoMes(oc, '2026-12');
  igual([r.lotadas, r.acima, r.maisCheia, r.vagasLivres], [2, 1, { dia: '2026-12-28', n: 32 }, 29 * 30]);
});
prova('o Orçamento pergunta «cabe?»: conta os novos, aponta as noites acima de 30 e ignora o próprio orçamento em edição', () => {
  const orc = lote('a', 28, '2026-12-26', '2026-12-29');
  const oc = CV.ocupacao({ orcamentos: orc }, '2026-12-01', '2027-01-31');
  const r = CV.checarPeriodo(oc, '2026-12-27', '2026-12-30', 3, '');
  igual(r.acima.map((x) => [x.dia, x.depois]), [['2026-12-27', 31], ['2026-12-28', 31]]);
  igual(r.maisCheia.depois, 31);
  igual(CV.checarPeriodo(oc, '2026-12-27', '2026-12-28', 2, '').acima.length, 0, '28 + 2 = 30 ainda cabe');
  igual(CV.checarPeriodo(oc, '2026-12-27', '2026-12-28', 3, 'a0').acima.length, 0, 'o orçamento editado não se conta duas vezes');
  assert.ok(CV.checarPeriodo(oc, '2026-11-29', '2026-12-02', 1, '').foraDaTemporada, 'noite de novembro fica fora da conta');
});

// ------------------------------------------------------------------ 2. a tela e o aviso, num sandbox
function universal(name) {
  const fn = function () { return fn; };
  return new Proxy(fn, {
    get(t, p) { if (p === Symbol.toPrimitive) return () => ''; if (p === 'then') return undefined; if (p in t) return t[p]; return universal(name + '.' + String(p)); },
    set() { return true; }, apply() { return universal(name + '()'); }, construct() { return universal('new ' + name); },
  });
}
const els = {};
const body = { dataset: { role: 'consultora' }, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
  appendChild() {}, style: {}, addEventListener() {}, setAttribute() {}, getAttribute() { return null; } };
const sandbox = {
  console: { log() {}, warn() {}, error() {}, info() {} }, Date, Math, JSON, Object, Array, String, Number, Boolean, Intl,
  parseInt, parseFloat, isNaN, isFinite, RegExp, Promise, Map, Set, Symbol, encodeURIComponent, decodeURIComponent,
  setTimeout(f) { return 0; }, clearTimeout() {}, setInterval() {}, clearInterval() {}, requestAnimationFrame() {}, performance: { now() { return 0; } },
  document: { body, head: { appendChild() {} }, documentElement: universal('documentElement'),
    getElementById(id) { return (id in els) ? els[id] : universal('el'); }, querySelector() { return null; }, querySelectorAll() { return []; },
    createElement() { return universal('el'); }, addEventListener() {}, getElementsByClassName() { return []; }, getElementsByTagName() { return []; }, cookie: '' },
  firebase: { initializeApp() { return {}; }, auth() { return { signInAnonymously() { return new Promise(() => {}); }, onAuthStateChanged() {} }; },
    database() { return { ref() { return universal('ref'); } }; } },
  localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
  navigator: { userAgent: 'calendario', onLine: true }, location: { href: 'https://calendario.local/', reload() {}, hostname: 'calendario.local' },
  alert() {}, confirm() { return true; }, prompt() { return ''; }, scrollTo() {}, addEventListener() {},
};
sandbox.window = sandbox; sandbox.globalThis = sandbox; sandbox.self = sandbox;
const ctx = vm.createContext(sandbox);
const html = fs.readFileSync(APP, 'utf8');
(function () {
  const re = /<script([^>]*)>([\s\S]*?)<\/script>/gi; const todos = []; let m, maior = '';
  while ((m = re.exec(html)) !== null) { todos.push(m); if (!/\bsrc=/.test(m[1]) && m[2].length > maior.length) maior = m[2]; }
  for (const s of todos) {
    const src = (/\bsrc="([^"?:]+\.js)(?:\?[^"]*)?"/.exec(s[1]) || [])[1];
    if (src) { const f = path.join(RAIZ, src); if (!fs.existsSync(f)) continue;
      try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: src }); } catch (e) { /* não é desta prova */ } continue; }
    if (/\bsrc=/.test(s[1]) || /type="(?!text\/javascript)/.test(s[1])) continue;
    if (s[2] === maior) { vm.runInContext(maior, ctx, { filename: 'index.html#script', timeout: 20000 }); continue; }
    try { vm.runInContext(s[2], ctx, { filename: 'index.html#inline' }); } catch (e) { /* não é desta prova */ }
  }
})();
const run = (c) => vm.runInContext(c, ctx);
const tela = () => { for (const k of ['cvMeses', 'cvMsg', 'cvKpis', 'cvGrade', 'cvDetalhe']) els[k] = { innerHTML: '' }; };
// Três leituras falsas: orçamentos (a coleção inteira), estadias e pernoites.
function prepara(orcs, estadias, pernoites, falha) {
  sandbox.__orcs = orcs; sandbox.__est = estadias; sandbox.__pern = pernoites; sandbox.__falha = falha || '';
  run(`orcHojeISO=function(){ return '2026-11-16'; };
    orcFeriadosCfg=null; ORC_LISTA_CACHE={};
    orcLerVivos=function(){ return Promise.resolve(__falha==='orc'?{ok:false}:{ok:true, todos:__orcs}); };
    zMapaUma=function(){ return __falha==='est'?Promise.reject(new Error('x')):Promise.resolve(__est); };
    DB={ ref:function(){ var q={ orderByKey:function(){return q;}, startAt:function(){return q;}, endAt:function(){return q;},
      once:function(){ return __falha==='pern'?Promise.reject(new Error('x')):Promise.resolve({ val:function(){ return __pern; } }); } }; return q; } };
    CV.lido=null; CV.quando=0; CV.oc=null; CV.mes=''; CV.sel=''; CV.lendo=null;`);
}

console.log('A tela');
prova('abre em dezembro, com o número de quem dorme no quadradinho, as vagas e quem sai no dia', async () => {
  tela();
  const orc = Object.assign(lote('a', 27, '2026-12-20', '2026-12-26'), lote('b', 2, '2026-12-24', '2026-12-26'));
  prepara(orc, {}, { '2026-12-25': { 'teste-p__tutora-p': { nome: 'Teste P', status: 'aguardando' } } });
  await run('cvAbrir(false)');
  const g = els.cvGrade.innerHTML;
  assert.ok(/Dezembro 2026/.test(els.cvMeses.innerHTML) && /Janeiro 2027/.test(els.cvMeses.innerHTML));
  assert.ok(/class="on" aria-pressed="true" data-mes="2026-12"/.test(els.cvMeses.innerHTML), 'dezembro começa marcado');
  const d25 = (g.match(/<button type="button" class="cv-dia[^"]*" data-dia="2026-12-25"[\s\S]*?<\/button>/) || [''])[0];
  assert.ok(/n-lot/.test(d25) && /<b>30<\/b><em>0 vagas<\/em>/.test(d25), d25);
  const d26 = (g.match(/data-dia="2026-12-26"[\s\S]*?<\/button>/) || [''])[0];
  assert.ok(/<b>0<\/b>/.test(d26) && /29 saem/.test(d26), 'no dia 26 saem 29 e a noite fica livre: ' + d26);
  const d24 = (g.match(/data-dia="2026-12-24"[\s\S]*?<\/button>/) || [''])[0];
  assert.ok(/class="pt"/.test(d24), '24/12 é recesso: tem o pontinho');
  assert.ok(/noites lotadas/.test(els.cvKpis.innerHTML) && /vagas livres no mês/.test(els.cvKpis.innerHTML));
  assert.strictEqual(els.cvDetalhe.innerHTML, '', 'o detalhe começa escondido');
});
prova('tocar no dia abre o detalhe; tocar de novo esconde; o «sem confirmar» vem à parte', async () => {
  tela();
  const orc = Object.assign(lote('a', 3, '2026-12-26', '2026-12-28'), lote('s', 1, '2026-12-26', '2026-12-28', 'aguardando'));
  prepara(orc, { e1: { status: 'ativa', nome: 'Teste H', tutor: 'Tutora H', entrada: '2026-12-20', saida: '2026-12-26' } }, {});
  await run('cvAbrir(false)');
  run(`cvDia('2026-12-26')`);
  const d = els.cvDetalhe.innerHTML;
  assert.ok(/sábado · 26\/12/.test(d), d.slice(0, 200));
  assert.ok(/Saem neste dia — a vaga desta noite fica livre \(1\)/.test(d) && /Teste H/.test(d));
  assert.ok(/Chegam neste dia \(3\)/.test(d) && /Quem dorme nesta noite \(3\)/.test(d));
  assert.ok(/<details><summary>Com orçamento, sem confirmar \(1\) — não ocupam vaga<\/summary>/.test(d) && /Teste s0/.test(d));
  assert.ok(/reserva fechada/.test(d) && /Esconder/.test(d));
  run(`cvDia('2026-12-26')`);
  assert.strictEqual(els.cvDetalhe.innerHTML, '');
});
prova('acima de 30: quadradinho azul com borda dourada e a faixa «só com autorização da Márcia»', async () => {
  tela();
  prepara(lote('a', 32, '2026-12-30', '2027-01-01'), {}, {});
  await run('cvAbrir(false)');
  const d30 = (els.cvGrade.innerHTML.match(/data-dia="2026-12-30"[\s\S]*?<\/button>/) || [''])[0];
  assert.ok(/<b>32<\/b><em>\+2 acima<\/em>/.test(d30), d30);
  assert.ok(/class="cv-dia n-mais/.test((els.cvGrade.innerHTML.match(/<button type="button" class="cv-dia[^"]*" data-dia="2026-12-30"/) || [''])[0]));
  run(`cvDia('2026-12-30')`);
  assert.ok(/só com autorização da Márcia/.test(els.cvDetalhe.innerHTML));
});
prova('janeiro: o botão troca o mês e a grade começa na sexta (01/01/2027)', async () => {
  tela();
  prepara({}, {}, {});
  await run('cvAbrir(false)');
  run(`cvMes('2027-01')`);
  const g = els.cvGrade.innerHTML;
  assert.strictEqual((g.match(/cv-vazio/g) || []).length, 5, 'domingo a quinta vazios');
  assert.ok(/data-dia="2027-01-31"/.test(g) && !/data-dia="2026-12-31"/.test(g));
});
prova('leitura que falhou NUNCA vira vaga: a tela diz que não leu e não desenha a grade', async () => {
  for (const f of ['orc', 'est']) {
    tela(); prepara({}, {}, {}, f);
    await run('cvAbrir(false)');
    assert.strictEqual(els.cvGrade.innerHTML, '', f);
    assert.ok(/isso não quer dizer que há vaga/.test(els.cvMsg.innerHTML), f + ': ' + els.cvMsg.innerHTML);
  }
});
prova('sem as pernoites a grade aparece, com o aviso de que pode haver mais peludinhos', async () => {
  tela(); prepara(lote('a', 2, '2026-12-20', '2026-12-22'), {}, {}, 'pern');
  await run('cvAbrir(false)');
  assert.ok(/data-dia="2026-12-20"/.test(els.cvGrade.innerHTML));
  assert.ok(/pernoites do Day Care/.test(els.cvMsg.innerHTML));
});

console.log('O aviso no Orçamento');
prova('cabe: diz a noite mais cheia contando este orçamento; passa de 30: lista as noites e só avisa', async () => {
  els.orcVagasAviso = { innerHTML: '' };
  prepara(lote('a', 28, '2026-12-26', '2026-12-29'), {}, {});
  await run('cvCarregar(true)');
  run(`ORC_SEL=[{nome:'Teste N1'},{nome:'Teste N2'}]; ORC_EDITANDO=null; cvAvisoOrcamento('2026-12-27','2026-12-28');`);
  assert.ok(/<strong>Cabe\.<\/strong>/.test(els.orcVagasAviso.innerHTML) && /fica lotada/.test(els.orcVagasAviso.innerHTML), els.orcVagasAviso.innerHTML);
  run(`ORC_SEL=[{},{},{}]; cvAvisoOrcamento('2026-12-27','2026-12-29');`);
  const h = els.orcVagasAviso.innerHTML;
  assert.ok(/Passa de 30 peludinhos em 2 noites:/.test(h) && /dom 27\/12 \(31\)/.test(h) && /só com autorização da Márcia/.test(h), h);
  assert.ok(/Ver no Calendário Dez\/Jan/.test(h));
  assert.ok(!/disabled/.test(h), 'não trava nada');
});
prova('fora de dezembro e janeiro o Orçamento não mostra o aviso', () => {
  els.orcVagasAviso = { innerHTML: 'x' };
  run(`ORC_SEL=[{}]; cvAvisoOrcamento('2026-11-20','2026-11-25');`);
  assert.strictEqual(els.orcVagasAviso.innerHTML, '');
});
prova('o orcCalcular chama o aviso depois de montar as noites', () => {
  assert.ok(/guarda\+\+; \}\n\s*\/\/ CALENDÁRIO DEZ\/JAN[^\n]*\n\s*try\{ if\(typeof cvAvisoOrcamento==='function'\) cvAvisoOrcamento\(ent, saiReal\); \}/.test(html.replace(/\r\n/g, '\n')));
});

// ------------------------------------------------------------------ 3. o encaixe no app
console.log('Encaixe no app');
prova('menu: «Calendário Dez/Jan» logo abaixo do Orçamento, para as mesmas pessoas (so-recepcao)', () => {
  const i = html.indexOf('<span>Orçamento de hospedagem</span></a>'), j = html.indexOf('data-v="calendariovagas"');
  assert.ok(i > 0 && j > i && j - i < 400, 'logo abaixo');
  assert.ok(/<a data-v="calendariovagas" class="so-recepcao"[^>]*><span data-icon="cal"><\/span><span>Calendário Dez\/Jan<\/span><\/a>/.test(html));
  assert.ok(/<section class="view" id="v-calendariovagas">/.test(html));
  assert.ok(/calendariovagas:\['Calendário Dez\/Jan','[^']+'\],/.test(html), 'o título do topo existe (sem ele a tela não abre)');
  assert.ok(/if\(v==='calendariovagas'\)\{ if\(typeof cvAbrir==='function'\) cvAbrir\(false\); \}/.test(html));
  assert.ok(/<div id="orcVagasAviso" role="status" aria-live="polite"><\/div>/.test(html));
});
prova('quem tem o Orçamento concedido no Time vê o calendário; dá para conceder só o calendário', () => {
  assert.ok(/\{k:'calendariovagas', t:'Calendário Dez\/Jan'\}/.test(html));
  const tem = run('navPaginaTem');
  assert.strictEqual(tem({ paginas: ['orcamento'] }, 'calendariovagas'), true);
  assert.strictEqual(tem({ paginas: ['calendariovagas'] }, 'calendariovagas'), true);
  assert.strictEqual(tem({ paginas: ['checkin'] }, 'calendariovagas'), false);
  assert.strictEqual(tem({ paginas: ['calendariovagas'] }, 'orcamento'), false, 'o calendário não abre o Orçamento');
  assert.ok(/var pode=navPaginaTem\(u, k\);/.test(html) && /if\(!navPaginaTem\(u, v\)\) v=u\.paginas\[0\];/.test(html));
});
prova('módulo carregado pela página, na lista do site, versão 2026-11-19-01 em todos os arquivos versionados', () => {
  assert.ok(/<script src="calendario-vagas\.js\?v=2026-11-19-01"><\/script>/.test(html));
  const lista = fs.readFileSync(path.join(__dirname, '..', '.github', 'site-permitidos.txt'), 'utf8');
  assert.ok(/^auaulandia\/calendario-vagas\.js$/m.test(lista));
  assert.match(html, /const APP_VERSAO='2026-11-19-01';/);
  assert.equal(html.split('2026-11-19-01').length - 1, 15);
  assert.ok(html.indexOf('2026-11-15-01') < 0);
});
prova('regras da casa no texto novo: sem cão/cachorro/baia/solto, sem emoji, sem alert/confirm', () => {
  const novo = fs.readFileSync(path.join(RAIZ, 'calendario-vagas.js'), 'utf8')
    + (html.match(/<section class="view" id="v-calendariovagas">[\s\S]*?<\/section>/) || [''])[0]
    + (html.match(/\/\/ ===== CALENDÁRIO DEZ\/JAN \(Adriana[\s\S]*?\/\/ ================= ACERTO DAS PLANTONISTAS/) || [''])[0];
  assert.ok(novo.length > 5000, 'achou o código novo');
  assert.ok(!/\b(cão|cães|cachorro|baia|soltar|solto)\b/i.test(novo));
  assert.ok(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(novo));
  assert.ok(!/\balert\(|\bconfirm\(|\bprompt\(/.test(novo));
});

fila.then(() => {
  console.log('\ncalendario-vagas185: ' + ok + ' de ' + (ok + falhas.length) + ' provas passaram');
  if (falhas.length) { falhas.forEach((f) => console.log('  FALHOU: ' + f)); process.exitCode = 1; }
});
