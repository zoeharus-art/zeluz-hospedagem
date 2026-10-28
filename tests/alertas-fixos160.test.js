'use strict';

// Alertas fixos e faixa «ATENÇÃO — LEIA ANTES» (Adriana, 28/out/2026, maquete aprovada). Prova a lógica pura —
// o que a faixa junta, a ordem, a contagem, quem liga e quem desliga, a alergia como campo, o «recolhida» guardado
// por dia (mesmo com o armazenamento do aparelho bloqueado) e a sanfona da aba Hóspedes de hoje — sem navegador,
// sem rede e sem banco real: banco de mentira, nomes «Exemplo», tudo inventado.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const APP = path.join(__dirname, '..', 'auaulandia', 'index.html');
const src = fs.readFileSync(APP, 'utf8');

function funcaoDe(texto, nome) {
  const inicio = texto.indexOf('function ' + nome + '(');
  assert.ok(inicio >= 0, 'função ausente: ' + nome);
  const abre = texto.indexOf('{', inicio);
  let nivel = 0;
  let aspas = '';
  let escape = false;
  for (let i = abre; i < texto.length; i += 1) {
    const c = texto[i];
    if (aspas) {
      if (escape) escape = false;
      else if (c === '\\') escape = true;
      else if (c === aspas) aspas = '';
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { aspas = c; continue; }
    if (c === '{') nivel += 1;
    if (c === '}' && --nivel === 0) return texto.slice(inicio, i + 1);
  }
  throw new Error('função incompleta: ' + nome);
}
// Funções de uma linha só (o leitor de chaves de funcaoDe não lida com regex que tem aspas dentro).
function linhaDe(texto, nome) {
  const l = texto.split('\n').find((x) => x.indexOf('function ' + nome + '(') >= 0);
  assert.ok(l, 'função ausente: ' + nome);
  return l.trim();
}
// Do começo da função até a próxima função do mesmo nível (2 espaços): serve para olhar o TEXTO da função quando ela tem
// comentário com aspas, que atrapalha o leitor de chaves de funcaoDe.
function corpoDe(texto, nome) {
  const i = texto.search(new RegExp('\\n  (async )?function ' + nome + '\\('));
  assert.ok(i >= 0, 'função ausente: ' + nome);
  const j = texto.slice(i + 10).search(/\n  (async )?function \w+\(/);
  return texto.slice(i, j < 0 ? undefined : i + 10 + j);
}
// O trecho inteiro dos alertas fixos e da faixa (do comentário de abertura até o «COMO COMEU?»).
function trechoFaixa() {
  const a = src.indexOf('// ===== ALERTAS FIXOS E FAIXA «ATENÇÃO — LEIA ANTES»');
  const b = src.indexOf('// ===== «COMO COMEU?»');
  assert.ok(a > 0 && b > a, 'trecho da faixa ausente');
  return src.slice(a, b);
}
// A lista ALERTAS_FIXOS (o porteiro só reconhece id que está nela).
function listaAlertasFixos() {
  const a = src.indexOf('var ALERTAS_FIXOS=[');
  const b = src.indexOf('];', a);
  assert.ok(a > 0 && b > a, 'lista ALERTAS_FIXOS ausente');
  return src.slice(a, b + 2);
}
function tabelaPerm() {
  const a = src.indexOf('const PERM={');
  const b = src.indexOf('\n  };', a);
  assert.ok(a > 0 && b > a, 'tabela PERM ausente');
  return src.slice(a, b + 5).replace('const PERM=', 'var PERM=');
}

let n = 0;
const fila = [];
function prova(nome, fn) { fila.push([nome, fn]); }

function guardaLocal() {
  const m = {};
  return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: (k) => { delete m[k]; }, _m: m };
}
function guardaBloqueada() {
  const falha = () => { throw new Error('armazenamento bloqueado'); };
  return { getItem: falha, setItem: falha, removeItem: falha };
}

// O aparelho de mentira: as peças do app de que o trecho depende, trocadas por versões simples.
function aparelho(opc) {
  opc = opc || {};
  const gravacoes = [];
  const auditoria = [];
  const sandbox = {
    console, JSON, Object, Array, String, Number, Boolean, Date, Math, RegExp, Promise,
    localStorage: opc.localStorage || guardaLocal(),
    document: { body: { dataset: { role: opc.papel || 'gestao' } }, getElementById() { return null; }, activeElement: null },
    HOJE: opc.hoje || '2026-10-28',
    EXTRA: opc.extra || {},
    ESTADIA: opc.estadia || [],
    gravacoes, auditoria,
    pelAtual: opc.pelAtual === undefined ? { n: 'Exemplo', tutor: 'Tutor Exemplo' } : opc.pelAtual,
    PERN_PEND: null, vetHosp: null,
    RESPOSTA_GRAVAR: opc.respostaGravar || { ok: true },
  };
  sandbox.window = sandbox; sandbox.globalThis = sandbox;
  const ctx = vm.createContext(sandbox);
  vm.runInContext([
    'function zHojeISO(){ return HOJE; }',
    'function pelExtra(p){ return EXTRA; }',
    'function extraDoHosp(h){ return EXTRA; }',
    'function pelNome(p){ return (p&&p.n)||""; }',
    'function pelGet(p,c){ return (p&&p[c])||""; }',
    'function pelKey(p){ return ((p.n||"")+"__"+(p.tutor||"")).toLowerCase(); }',
    'function cadKey(h){ return h&&h.refKey?String(h.refKey).toLowerCase():((h&&h.nome||"")+"__"+(h&&h.tutor||"")).toLowerCase(); }',
    'function alertasAtivosDe(h){ return ESTADIA; }',
    'function quemSou(){ return "Pessoa Exemplo"; }',
    'function papelDoCorpo(){ return document.body.dataset.role; }',
    'function audit(a,d,m){ auditoria.push([a,d,m]); }',
    'function refreshPills(){}',
    'function setPelExtra(p,patch,op){ gravacoes.push({patch:patch, op:op}); return Promise.resolve(RESPOSTA_GRAVAR); }',
    'function renderHospedesAba(){}',
    'function fichaAlertasRender(){}',
    linhaDe(src, 'escAttr'),
    linhaDe(src, 'jsAspas'),
    tabelaPerm(),
    funcaoDe(src, 'podePapel'),
    trechoFaixa(),
  ].join('\n'), ctx);
  const run = (c) => vm.runInContext(c, ctx);
  return { ctx, run, gravacoes, auditoria, set: (k, v) => { ctx[k] = v; } };
}
const espera = () => new Promise((r) => setImmediate(r));

// ------------------------------------------------------------------------- a faixa
prova('a faixa junta alertas fixos, alertas da estadia e as tarjas da ficha, com título e contador', () => {
  const a = aparelho({
    extra: { alertas_fixos: { foge: { on: true, det: 'pulou o portão no sábado', quem: 'Pessoa A', ts: 1 }, nocao: { on: true, quem: 'Pessoa B', ts: 2 } }, restricao: 'sem grãos', medicacao: 'Exemplo 5 mg', ansioso: 'Sim' },
    estadia: [{ _id: 'e1', txt: 'Afastado por suspeita de virose', ate: 'tirar', quem: 'Pessoa C', ts: 3 }],
  });
  const h = a.run("faixaAtencaoHTML({p:pelAtual, onde:'ficha'})");
  assert.ok(/ATENÇÃO — LEIA ANTES/.test(h), 'título da faixa');
  assert.ok(/NÃO pode ficar junto com outros peludinhos/.test(h) && /Foge \/ pula portão — conferir trancas/.test(h));
  assert.ok(/pulou o portão no sábado/.test(h), 'o motivo vira linha menor');
  assert.ok(/Afastado por suspeita de virose/.test(h) && /só nesta estadia · até alguém tirar · lançado por Pessoa C/.test(h), 'a etiqueta da estadia');
  assert.ok(/Também na ficha:/.test(h) && /RESTRIÇÃO/.test(h) && /MEDICAÇÃO/.test(h) && /ANSIOSO/.test(h), 'a linha com as tarjas da ficha');
  assert.ok(/data-n="3"/.test(h) && /data-m="3"/.test(h), 'contador: 3 cartões grandes e 3 tarjas');
  assert.ok(/class="faixa-cnt">3</.test(h), 'o contador à vista só conta os cartões grandes');
  assert.ok(/class="faixa-chip-txt"[^>]* hidden/.test(h), 'o texto do chip nasce fechado');
});

prova('a ordem é convivência (vermelho) primeiro, depois comportamento e saúde, depois a estadia', () => {
  const a = aparelho({
    extra: { alertas_fixos: { rep: { on: true }, foge: { on: true }, sep: { on: true }, nocao: { on: true } }, alergia: 'frango' },
    estadia: [{ _id: 'e1', txt: 'Ciumento', ate: 'tirar', quem: 'X', ts: 1 }],
  });
  const it = a.run("faixaItens({p:pelAtual})");
  const ids = it.grandes.map((x) => x.id);
  assert.deepStrictEqual(Array.from(ids), ['nocao', 'sep', 'foge', 'alerg', 'rep', 'estadia:e1']);
  assert.deepStrictEqual(Array.from(it.grandes.map((x) => x.kind)), ['conv', 'conv', 'amb', 'amb', 'amb', 'amb']);
  const r = a.run("faixaResumo({nome:'Exemplo', tutor:'Tutor Exemplo'})");
  assert.strictEqual(r.n, 6);
  assert.strictEqual(r.primeira, 'NÃO pode ficar junto com outros peludinhos', 'o selo da hospedagem mostra o mais grave');
  assert.strictEqual(a.run('faixaPlural(1)'), '1 alerta');
  assert.strictEqual(a.run('faixaPlural(2)'), '2 alertas');
});

prova('sem nada: faixa verde discreta, sem pulso; só tarjas da ficha: a faixa existe e a barra recolhida conta «da ficha»', () => {
  const vazio = aparelho({ extra: {} });
  const h0 = vazio.run("faixaAtencaoHTML({p:pelAtual, onde:'ficha'})");
  assert.ok(/Nenhum alerta cadastrado/.test(h0) && !/faixa-atn/.test(h0), 'verde discreta, sem a classe que pulsa');
  const so = aparelho({ extra: { problema: 'cardíaco' } });
  const t = so.run('faixaTituloHTML(true, 0, 1)');
  assert.ok(/ATENÇÃO — 1 da ficha · toque para ler/.test(t));
  assert.ok(/ATENÇÃO — 2 alertas · \+1 da ficha · toque para ler/.test(so.run('faixaTituloHTML(true, 2, 1)')), 'barra fina: N alertas · +M da ficha · toque para ler');
  assert.ok(/ATENÇÃO — 1 alerta · toque para ler/.test(so.run('faixaTituloHTML(true, 1, 0)')));
  assert.ok(/faixa-atn/.test(so.run("faixaAtencaoHTML({p:pelAtual, onde:'ficha'})")), 'só tarja: ainda é faixa');
});

prova('texto de gente vai escapado (motivo e alergia não viram HTML)', () => {
  const a = aparelho({ extra: { alertas_fixos: { foge: { on: true, det: '<img src=x onerror=alert(1)>' } }, alergia: '"><b>x</b>' } });
  const h = a.run("faixaAtencaoHTML({p:pelAtual, onde:'ficha'})");
  assert.ok(!/<img/.test(h) && !/<b>x/.test(h), 'nada de tag solta vinda de texto digitado');
  assert.ok(/&lt;img/.test(h));
});

prova('a alergia é o próprio campo Alergia: preenchido = ligado; o nó alertas_fixos/alerg não conta', () => {
  const sem = aparelho({ extra: { alertas_fixos: { alerg: { on: true } } } });
  assert.strictEqual(sem.run('alertasFixosItens(EXTRA).length'), 0, 'on:true sem texto na alergia não acende nada');
  const com = aparelho({ extra: { alergia: 'frango' } });
  const it = com.run('alertasFixosItens(EXTRA)');
  assert.strictEqual(it.length, 1);
  assert.strictEqual(it[0].tx, 'Alergia: frango');
  assert.strictEqual(com.run('alertaFixoLigado(EXTRA, "alerg")'), true);
  assert.strictEqual(com.run('faixaChipsDaFicha(EXTRA).length'), 0, 'a tarja de alergia não repete o cartão');
});

// ------------------------------------------------------------------------- recolher guardado por dia
prova('«recolhida» é guardada por FILHOt e por dia; no dia seguinte volta a pulsar; a Cuidado Vet nasce recolhida', () => {
  const a = aparelho({ extra: { alertas_fixos: { foge: { on: true } } } });
  const html = () => a.run("faixaAtencaoHTML({p:pelAtual, onde:'ficha'})");
  assert.ok(!/faixa-atn recolhida/.test(html()), 'nasce aberta (e pulsando) na ficha');
  assert.ok(/faixa-atn recolhida/.test(a.run("faixaAtencaoHTML({p:pelAtual, onde:'vet'})")), 'na Cuidado Vet nasce recolhida');
  a.run("faixaRecolhidaGravar(pelKey(pelAtual), true)");
  assert.ok(/faixa-atn recolhida/.test(html()), 'depois de recolher, continua recolhida no mesmo dia');
  const guardado = JSON.parse(a.ctx.localStorage.getItem('zeluz_faixa_recolhida_v1'));
  assert.deepStrictEqual(guardado, { 'exemplo__tutor exemplo': { d: '2026-10-28', r: true } });
  a.run("HOJE='2026-10-29'");
  assert.ok(!/faixa-atn recolhida/.test(html()), 'no dia seguinte volta a pulsar');
  a.run("faixaRecolhidaGravar('outro__tutor', false)");
  assert.deepStrictEqual(Object.keys(JSON.parse(a.ctx.localStorage.getItem('zeluz_faixa_recolhida_v1'))), ['outro__tutor'], 'o dia velho sai do mapa');
});

prova('com o armazenamento do aparelho bloqueado a faixa continua funcionando (só não lembra)', () => {
  const a = aparelho({ localStorage: guardaBloqueada(), extra: { alertas_fixos: { foge: { on: true } } } });
  assert.doesNotThrow(() => a.run("faixaRecolhidaGravar('x', true)"));
  assert.strictEqual(a.run("faixaRecolhidaDe('x', false)"), false);
  assert.strictEqual(a.run("faixaRecolhidaDe('x', true)"), true, 'o padrão da tela vale');
  assert.ok(/ATENÇÃO — LEIA ANTES/.test(a.run("faixaAtencaoHTML({p:pelAtual, onde:'ficha'})")));
});

prova('a prévia da ficha não grava «recolhida» e vem sempre aberta; recolher no DOM guarda o dia', () => {
  const a = aparelho({ extra: { alertas_fixos: { foge: { on: true } } } });
  a.run("faixaRecolhidaGravar(pelKey(pelAtual), true)");
  const h = a.run("faixaAtencaoHTML({p:pelAtual, onde:'previa', previa:true})");
  assert.ok(!/faixa-atn recolhida/.test(h) && /data-previa="1"/.test(h));
  // faixaAlternar sobre um «elemento» de mentira
  const cl = new Set();
  const t = { _a: '', setAttribute(k, v) { this._a = k + v; }, focus() {}, innerHTML: '' };
  const el = { classList: { contains: (c) => cl.has(c), toggle: (c, f) => { if (f) cl.add(c); else cl.delete(c); } }, querySelector: () => t, getAttribute: (k) => ({ 'data-n': '2', 'data-m': '1', 'data-chave': 'bia__tutor', 'data-previa': '' }[k] || '') };
  a.set('__btn', { closest: () => el });
  a.run('faixaAlternar(__btn)');
  assert.ok(cl.has('recolhida'));
  assert.ok(/toque para ler/.test(t.innerHTML));
  assert.strictEqual(JSON.parse(a.ctx.localStorage.getItem('zeluz_faixa_recolhida_v1'))['bia__tutor'].r, true);
});

prova('se a faixa falhar ao montar, a tela não quebra e também não finge «sem alerta»: aparece o aviso em vermelho', () => {
  const a = aparelho({ extra: { alertas_fixos: { foge: { on: true } } } });
  a.set('_logFalhaGrav', () => {});
  a.run('faixaItens = function(){ throw new Error("falha de mentira"); }');
  const h = a.run("faixaAtencaoHTML({p:pelAtual, onde:'ficha'})");
  assert.ok(/Não consegui montar os alertas deste FILHOt/.test(h) && /role="alert"/.test(h) && !/Nenhum alerta cadastrado/.test(h));
  a.run('alertasFixosEditorHTML = function(){ throw new Error("falha de mentira"); }');
  assert.strictEqual(a.run('alertasFixosSanfonaHTML(pelAtual)'), '', 'a aba Comportamento continua com os campos de sempre');
});

prova('o redesenho só troca a faixa quando o conteúdo mudou (não reinicia o pulso nem fecha o chip aberto)', () => {
  const a = aparelho({ extra: { alertas_fixos: { foge: { on: true } } } });
  const caixa = { firstElementChild: null, _n: 0 };
  Object.defineProperty(caixa, 'innerHTML', { set(v) { this._n += 1; this._h = v; const m = /data-sig="([^"]+)"/.exec(v); this.firstElementChild = { getAttribute: () => (m ? m[1] : null) }; }, get() { return this._h; } });
  a.set('document', { body: { dataset: { role: 'gestao' } }, getElementById: (id) => (id === 'pelFaixa' ? caixa : null) });
  a.run("faixaRedesenharEm('pelFaixa', {p:pelAtual, onde:'ficha'})");
  assert.strictEqual(caixa._n, 1, 'primeira vez desenha');
  a.run("faixaRedesenharEm('pelFaixa', {p:pelAtual, onde:'ficha'})");
  assert.strictEqual(caixa._n, 1, 'nada mudou: não desenha de novo');
  a.set('EXTRA', { alertas_fixos: { foge: { on: true }, nocao: { on: true } } });
  a.run("faixaRedesenharEm('pelFaixa', {p:pelAtual, onde:'ficha'})");
  assert.strictEqual(caixa._n, 2, 'um alerta novo: desenha');
  a.set('pelAtual', { n: 'Outro', tutor: 'Tutor Exemplo' });
  a.run("faixaRedesenharEm('pelFaixa', {p:pelAtual, onde:'ficha'})");
  assert.strictEqual(caixa._n, 3, 'outro FILHOt com os mesmos alertas: desenha (a assinatura leva a chave)');
});

// ------------------------------------------------------------------------- quem liga e quem desliga
function barrados(papel, patch, canEdit) {
  const ctx = vm.createContext({
    document: { body: { dataset: { role: papel } } },
    canEditPel() { return !!canEdit; },
    pelCuidado57PatchPermitido() { return false; },
    PEL_LIVRES: { pesos: 1, foto: 1 },
    PEL_ALERGIA: { alergia: 1, restricao: 1, alergia_nenhuma: 1, restricao_nenhuma: 1 },
    papelDoCorpo() { return papel; },
  });
  vm.runInContext([tabelaPerm(), funcaoDe(src, 'podePapel'), listaAlertasFixos(), linhaDe(src, 'alertaFixoDef'), funcaoDe(src, 'pelAlertaFixoPermitido'), funcaoDe(src, 'pelCamposBarrados')].join('\n'), ctx);
  ctx.__p = patch;
  return Array.from(vm.runInContext('pelCamposBarrados(__p, {})', ctx));
}
const LIGA = { 'alertas_fixos/nocao': { on: true, det: '', quem: 'X', ts: 1 } };
const DESLIGA = { 'alertas_fixos/nocao': { on: false, det: '', quem: 'X', ts: 1, desligadoPor: 'Y', desligadoTs: 2 } };
const DET = { 'alertas_fixos/nocao/det': 'novo motivo' };

prova('permissão: a monitora liga e põe motivo, mas não desliga; a Gestão, a Supervisão e a Diretoria ligam e desligam', () => {
  assert.deepStrictEqual(barrados('monitor', LIGA, false), []);
  assert.deepStrictEqual(barrados('monitor', DET, false), []);
  assert.deepStrictEqual(barrados('monitor', DESLIGA, false), ['alertas_fixos/nocao'], 'monitora tenta desligar: barrada');
  ['gestao', 'supervisor', 'diretoria'].forEach((p) => {
    assert.deepStrictEqual(barrados(p, LIGA, true), [], p + ' liga');
    assert.deepStrictEqual(barrados(p, DESLIGA, true), [], p + ' desliga');
    assert.deepStrictEqual(barrados(p, DET, true), [], p + ' muda o motivo');
  });
});

prova('permissão: a veterinária e a plantonista não ligam; a consultora edita a ficha mas não liga nem desliga alerta', () => {
  ['vet', 'plantonista', 'aprendiz'].forEach((p) => {
    assert.deepStrictEqual(barrados(p, LIGA, false), ['alertas_fixos/nocao'], p + ' não liga');
    assert.deepStrictEqual(barrados(p, DET, false), ['alertas_fixos/nocao/det'], p + ' não muda o motivo');
  });
  assert.deepStrictEqual(barrados('consultora', LIGA, true), ['alertas_fixos/nocao'], 'a lista de capacidade vale mesmo para quem edita a ficha');
  assert.deepStrictEqual(barrados('consultora', DESLIGA, true), ['alertas_fixos/nocao']);
  assert.deepStrictEqual(barrados('consultora', { tutor: 'Outro' }, true), [], 'o resto da ficha continua como era');
});

prova('porteiro: apagar o nó, valor sem «on» ou id estranho é barrado para todos; o resto do porteiro não mudou', () => {
  assert.deepStrictEqual(barrados('gestao', { 'alertas_fixos/nocao': null }, true), ['alertas_fixos/nocao']);
  assert.deepStrictEqual(barrados('gestao', { 'alertas_fixos/nocao': { det: 'x' } }, true), ['alertas_fixos/nocao']);
  assert.deepStrictEqual(barrados('gestao', { 'alertas_fixos/NOCAO!': { on: true } }, true), ['alertas_fixos/NOCAO!']);
  // revisão de segurança da parte A: o nó inteiro e qualquer caminho que o porteiro não reconhece ficam barrados para TODOS
  ['gestao', 'consultora', 'supervisor', 'diretoria'].forEach((p) => {
    assert.deepStrictEqual(barrados(p, { alertas_fixos: { nocao: { on: true } } }, true), ['alertas_fixos'], p + ': o nó inteiro é barrado');
    assert.deepStrictEqual(barrados(p, { 'alertas_fixos/inexistente': { on: true } }, true), ['alertas_fixos/inexistente'], p + ': id fora da lista');
    assert.deepStrictEqual(barrados(p, { 'alertas_fixos/nocao/on': true }, true), ['alertas_fixos/nocao/on'], p + ': subcaminho mais fundo');
    assert.deepStrictEqual(barrados(p, { '/alertas_fixos/nocao/on': true }, true), ['/alertas_fixos/nocao/on'], p + ': barra no começo (o banco a ignora) não escapa do filtro');
    assert.deepStrictEqual(barrados(p, { 'alertas_fixos/alerg': { on: true } }, true), ['alertas_fixos/alerg'], p + ': alergia é o campo Alergia, não um nó');
  });
  assert.deepStrictEqual(barrados('monitor', { alertas_fixos: { nocao: { on: true } } }, false), ['alertas_fixos'], 'monitora: o nó inteiro também');
  assert.deepStrictEqual(barrados('monitor', { pesos: [1], 'pesos_corr/2026-10-01': {}, alergia: 'frango', tutor: 'Outro' }, false), ['tutor'], 'monitora: peso, correção de peso e alergia como sempre; tutor barrado');
  assert.deepStrictEqual(barrados('monitor', Object.assign({ tutor: 'Outro' }, DESLIGA), false), ['alertas_fixos/nocao', 'tutor']);
});

prova('tabela de permissões: as duas capacidades novas têm exatamente os papéis da especificação', () => {
  const a = aparelho();
  assert.deepStrictEqual(Array.from(a.run("PERM['alerta-fixo-ligar']")), ['gestao', 'supervisor', 'diretoria', 'monitor']);
  assert.deepStrictEqual(Array.from(a.run("PERM['alerta-fixo-desligar']")), ['gestao', 'supervisor', 'diretoria']);
});

// ------------------------------------------------------------------------- ligar e desligar (o que a tela grava)
prova('ligar grava on:true com quem e quando, pela porta da ficha, só depois do ok; desligar grava on:false e guarda quem ligou', async () => {
  const a = aparelho({ papel: 'gestao', extra: { alertas_fixos: {} } });
  a.run("alertaFixoToque('nocao')");
  await espera();
  assert.strictEqual(a.gravacoes.length, 1);
  const g = a.gravacoes[0];
  assert.deepStrictEqual(Object.keys(g.patch), ['alertas_fixos/nocao']);
  assert.strictEqual(g.patch['alertas_fixos/nocao'].on, true);
  assert.strictEqual(g.patch['alertas_fixos/nocao'].quem, 'Pessoa Exemplo');
  assert.ok(g.patch['alertas_fixos/nocao'].ts > 0);
  assert.strictEqual(g.op.soDepoisDoOk, true, 'a tela só muda depois do ok do banco');
  assert.ok(a.auditoria.some((x) => x[0] === 'alerta-fixo' && /ligou/.test(x[1])), 'fica na auditoria');
  // agora está ligado: desligar
  a.set('EXTRA', { alertas_fixos: { nocao: { on: true, det: 'ciúme', quem: 'Pessoa A', ts: 5 } } });
  a.run("alertaFixoToque('nocao')");
  await espera();
  const d = a.gravacoes[1].patch['alertas_fixos/nocao'];
  assert.deepStrictEqual([d.on, d.det, d.quem, d.ts, d.desligadoPor], [false, 'ciúme', 'Pessoa A', 5, 'Pessoa Exemplo'], 'nada é apagado: on:false + quem desligou');
  assert.ok(d.desligadoTs > 0);
});

prova('a monitora vê o botão travado «só a Gestão desliga» e nada é gravado ao tocar', async () => {
  const a = aparelho({ papel: 'monitor', extra: { alertas_fixos: { foge: { on: true, quem: 'P', ts: 1 } } } });
  const h = a.run('alertasFixosEditorHTML(pelAtual)');
  assert.ok(/aria-disabled="true"[^>]*>Foge \/ pula portão · 🔒 só a Gestão desliga/.test(h), 'botão travado');
  a.run("alertaFixoToque('foge')");
  await espera();
  assert.strictEqual(a.gravacoes.length, 0);
  assert.ok(/Só a Gestão desliga este alerta/.test(a.run('alertasFixosEditorHTML(pelAtual)')));
  // e ela liga o que está desligado
  a.run("alertaFixoToque('colar')");
  await espera();
  assert.strictEqual(a.gravacoes.length, 1);
  assert.strictEqual(a.gravacoes[0].patch['alertas_fixos/colar'].on, true);
});

prova('quem não pode ligar (vet, plantonista, consultora) vê a lista só de leitura, sem botão', () => {
  ['vet', 'plantonista', 'consultora'].forEach((p) => {
    const a = aparelho({ papel: p, extra: { alertas_fixos: { mach: { on: true, quem: 'Pessoa A', ts: 1730073600000 } } } });
    const h = a.run('alertasFixosEditorHTML(pelAtual)');
    assert.ok(!/faixa-liga/.test(h) && /faixa-lista/.test(h), p);
    assert.ok(/Não pode com machos<\/b> — ligado por Pessoa A/.test(h), p);
  });
});

prova('o motivo/detalhe é opcional e grava só o campo det', async () => {
  const a = aparelho({ papel: 'monitor', extra: { alertas_fixos: { foge: { on: true } } } });
  a.run("alertaFixoDet('foge', '  pula o portão do fundo  ')");
  await espera();
  assert.deepStrictEqual(Object.assign({}, a.gravacoes[0].patch), { 'alertas_fixos/foge/det': 'pula o portão do fundo' });
});

prova('alergia: ligar pede o texto DENTRO da página e grava o campo alergia; desligar pede confirmação dentro da página e esvazia o campo', async () => {
  const a = aparelho({ papel: 'gestao', extra: {} });
  a.run("alertaFixoToque('alerg')");
  assert.strictEqual(a.gravacoes.length, 0, 'tocar só abre a pergunta');
  assert.ok(/id="afAlergiaNova"/.test(a.run('alertasFixosEditorHTML(pelAtual)')), 'a pergunta mora na página');
  a.set('document', { body: { dataset: { role: 'gestao' } }, getElementById: (id) => (id === 'afAlergiaNova' ? { value: '   ' } : null) });
  a.run('alertaFixoAlergiaLigar()');
  assert.strictEqual(a.gravacoes.length, 0, 'sem texto não liga');
  assert.ok(/Escreva a quê ele tem alergia/.test(a.run('alertasFixosEditorHTML(pelAtual)')));
  a.set('document', { body: { dataset: { role: 'gestao' } }, getElementById: (id) => (id === 'afAlergiaNova' ? { value: ' frango ' } : null) });
  a.run('alertaFixoAlergiaLigar()');
  await espera();
  assert.deepStrictEqual(Object.assign({}, a.gravacoes[0].patch), { alergia: 'frango' });
  // desligar
  a.set('EXTRA', { alergia: 'frango' });
  a.run("alertaFixoToque('alerg')");
  assert.strictEqual(a.gravacoes.length, 1, 'tocar em ligado só pede a confirmação');
  assert.ok(/Desligar «Alergia: frango»\?/.test(a.run('alertasFixosEditorHTML(pelAtual)')) && /Sim, desligar/.test(a.run('alertasFixosEditorHTML(pelAtual)')));
  a.run('alertaFixoAlergiaDesligar()');
  await espera();
  assert.deepStrictEqual(Object.assign({}, a.gravacoes[1].patch), { alergia: '' });
});

prova('alergia: a monitora liga e edita o texto, mas esvaziar (desligar) é só da Gestão', async () => {
  const a = aparelho({ papel: 'monitor', extra: { alergia: 'frango' } });
  a.run("alertaFixoAlergiaEditar('')");
  await espera();
  assert.strictEqual(a.gravacoes.length, 0);
  assert.ok(/Só a Gestão desliga este alerta/.test(a.run('alertasFixosEditorHTML(pelAtual)')));
  a.run("alertaFixoAlergiaEditar('frango e ovo')");
  await espera();
  assert.deepStrictEqual(Object.assign({}, a.gravacoes[0].patch), { alergia: 'frango e ovo' });
  a.run('alertaFixoAlergiaDesligar()');
  await espera();
  assert.strictEqual(a.gravacoes.length, 1, 'a monitora não esvazia a alergia por este caminho');
});

prova('gravação recusada: a tela avisa dentro da página e não finge que ligou', async () => {
  const a = aparelho({ papel: 'gestao', extra: {}, respostaGravar: { ok: false, erro: 'sem rede' } });
  a.run("alertaFixoToque('nocao')");
  await espera();
  assert.ok(/Não salvou o alerta/.test(a.run('alertasFixosEditorHTML(pelAtual)')));
  assert.strictEqual(a.auditoria.length, 0, 'sem ok do banco, sem linha de auditoria');
});

// ------------------------------------------------------------------------- sanfona da aba Hóspedes de hoje
prova('prevSecHTML: «Hospedados agora» e «A chegar» nascem abertas, o aparelho lembra o fechar; as de antes continuam nascendo fechadas', () => {
  const guarda = guardaLocal();
  const ctx = vm.createContext({ localStorage: guarda, document: {} });
  vm.runInContext([
    "var PREV_SEC_CH='zeluz_prev_secoes_v1', PREV_SEC=null;",
    linhaDe(src, 'escAttr'), linhaDe(src, 'jsAspas'),
    funcaoDe(src, 'prevSecAberta'), funcaoDe(src, 'prevSecVirar'), funcaoDe(src, 'prevSecHTML'),
  ].join('\n'), ctx);
  const run = (c) => vm.runInContext(c, ctx);
  assert.ok(/ open/.test(run("prevSecHTML('hosp-agora','Hospedados agora','','x',false,true)")), 'aberta de nascença');
  assert.ok(!/ open/.test(run("prevSecHTML('hosp-saiu','Já saíram','','x',false,false)")), 'fechada de nascença');
  assert.ok(/prevSecVirar\('hosp-agora',this\.open,1\)/.test(run("prevSecHTML('hosp-agora','t','','x',false,true)")));
  assert.ok(/prevSecVirar\('prev-x',this\.open\)"/.test(run("prevSecHTML('prev-x','t','','x')")), 'quem não pede padrão fica com o gancho de antes');
  run("prevSecVirar('hosp-agora', false, 1)");
  assert.ok(!/ open/.test(run("prevSecHTML('hosp-agora','Hospedados agora','','x',false,true)")), 'fechou: lembra');
  assert.strictEqual(JSON.parse(guarda.getItem('zeluz_prev_secoes_v1'))['hosp-agora'], false);
  run("prevSecVirar('hosp-saiu', true)");
  assert.ok(/ open/.test(run("prevSecHTML('hosp-saiu','t','','x',false,false)")));
  run("prevSecVirar('hosp-saiu', false)");
  assert.ok(!('hosp-saiu' in JSON.parse(guarda.getItem('zeluz_prev_secoes_v1'))), 'fechar uma seção comum continua apagando a marca');
  assert.ok(/ open/.test(run("prevSecHTML('hosp-saiu','t','','x',true,false)")), 'a busca (forçar) abre sem gravar');
});

prova('a aba Hóspedes de hoje: quatro sanfonas com ids hosp-, selo «⚠ N alertas» depois dos selos de antes, busca abre as com resultado', () => {
  const rh = corpoDe(src, 'renderHospedesAba');
  ['hosp-agora', 'hosp-achegar', 'hosp-saiu', 'hosp-pares'].forEach((id) => assert.ok(rh.indexOf("'" + id + "'") > 0, id));
  assert.ok(/prevSecHTML\(id, titulo[^)]*!!\(q&&lista\.length\), padrao\)/.test(rh), 'busca digitada abre as que têm resultado');
  assert.ok(/'hosp-agora','Hospedados agora',g\.agora,[^)]*,0,true\)/.test(rh) && /'hosp-achegar','A chegar',g\.achegar,[^)]*,0,true\)/.test(rh), 'as duas primeiras abertas');
  assert.ok(/'hosp-saiu','Já saíram — histórico',g\.saiu,[^)]*,40,false\)/.test(rh), 'já saíram fechada');
  assert.ok(/'hosp-pares','Pares já respondidos'/.test(rh) && /,\s*false\);/.test(rh.slice(rh.indexOf("'hosp-pares'"))), 'pares fechada');
  const linha = corpoDe(src, 'hospAbaLinha');
  assert.ok(/faixa-selo/.test(linha) && /⚠ '\+faixaPlural\(_ra\.n\)/.test(linha), 'o selo vermelho com a contagem');
  assert.ok(linha.indexOf('+ _selAl;') > linha.indexOf("'MEDICAÇÃO'"), 'o selo vem depois dos selos de antes');
  assert.ok(/hospAbrirFicha\(\\''\+id\+'\\'\)">Abrir ficha/.test(linha), '«Abrir ficha» continua indo para a ficha do cadastro');
  const pares = corpoDe(src, 'hospParesRespondidosHtml');
  assert.ok(/soCorpo/.test(pares) && /Pares já respondidos \('\+L\.length\+'\)/.test(pares), 'o jeito antigo de chamar continua igual');
});

// ------------------------------------------------------------------------- onde a faixa aparece
prova('a faixa aparece nos cinco lugares pedidos e a ficha do plantão lista os fixos sem botão de tirar', () => {
  const pel = corpoDe(src, 'abrirPeludinho');
  assert.ok(pel.indexOf('id="pelFaixa">${faixaAtencaoHTML({p:p, onde:\'ficha\'})}') > pel.indexOf('class="card hosp-head"'), 'ficha: abaixo do cabeçalho');
  assert.ok(pel.indexOf('id="pelFaixa"') < pel.indexOf('<div class="subtabs ficha-abas"'), 'ficha: antes das abas');
  assert.ok(pel.indexOf('${alertasFixosSanfonaHTML(p)}') > pel.indexOf('id="ps-comp"') && pel.indexOf('${alertasFixosSanfonaHTML(p)}') < pel.indexOf('Em casa'), 'Comportamento: a sanfona vem antes dos campos de antes');
  const pern = corpoDe(src, 'abrirPernForm');
  assert.ok(pern.indexOf("faixaAtencaoHTML({h:reg, onde:'pernoite'})") > 0 && pern.indexOf("faixaAtencaoHTML({h:reg, onde:'pernoite'})") < pern.indexOf('id="pfData"'), 'pernoite: antes de qualquer campo');
  assert.ok(/alertaFormHTML\('pf'/.test(pern), 'o campo «Alerta para o plantão» continua');
  const vet = corpoDe(src, 'abrirVetFicha');
  assert.ok(/faixaRedesenharEm\('vfFaixa', \{h:h, onde:'vet'\}\)/.test(vet));
  assert.ok(/<div id="vfFaixa"><\/div>/.test(src));
  const ren = corpoDe(src, 'fichaAlertasRender');
  assert.ok(/fichaAlertasFixosDoHosp\(currentHosp\)/.test(ren) && !/alertaTirar\('\+/.test(ren.slice(0, ren.indexOf('fxHTML')) ), 'plantão: lista os fixos');
  assert.ok(/faixaCartaoHTML/.test(ren) && !/Tirar alerta[\s\S]{0,40}fx/.test(ren));
  const cad = src.indexOf("zMapaVivo('daycare/cadastro','_pelcad'");
  assert.ok(src.indexOf('alertasFixosRedesenharAgendar()', cad) > cad && src.indexOf('alertasFixosRedesenharAgendar()', cad) - cad < 5000, 'o ouvinte do cadastro redesenha');
  const ouv = src.indexOf("DB.ref('auaulandia/alertas').on('value'");
  assert.ok(src.indexOf('alertasFixosRedesenharAgendar', ouv) - ouv < 1500, 'o ouvinte dos alertas da estadia também');
});

prova('o rótulo do porteiro/rastro e o carimbo de «recolhida» estão onde a especificação mandou', () => {
  assert.ok(/alertas_fixos:'Alertas fixos \(faixa ATENÇÃO\)'/.test(src), 'rótulo em PEL_RASTRO_ROTULO');
  assert.ok(/zeluz_faixa_recolhida_v1/.test(trechoFaixa()));
  assert.ok(/@keyframes faixaPulso\{0%,100%\{box-shadow:0 0 0 0 rgba\(192,57,43,0\)\}50%\{box-shadow:0 0 0 6px rgba\(192,57,43,\.18\)\}\}/.test(src), 'o pulso: 6px, alpha .18');
  assert.ok(/animation:faixaPulso 1\.6s ease-in-out infinite/.test(src), '1,6 s');
  assert.ok(/@media \(prefers-reduced-motion:reduce\)\{\s*\.faixa-atn\{animation:none;border-width:3px\}/.test(src), 'sem pulso e borda 3px para quem prefere menos movimento');
  assert.ok(/@media \(min-width:900px\)\{ \.faixa-grandes\{grid-template-columns:1fr 1fr\} \}/.test(src), 'duas colunas no computador');
  assert.ok(/\.faixa-al\.conv\{background:rgba\(192,57,43,\.12\);color:var\(--crm-critico\)\}/.test(src) && /\.faixa-al\.amb\{background:rgba\(222,180,40,\.14\);color:var\(--crm-atencao-text\)\}/.test(src), 'cores: wash alpha, nunca fundo chapado');
});

// ------------------------------------------------------------------------- vocabulário e janelas nativas
prova('os textos novos não usam termos proibidos e o caminho dos alertas fixos não abre janela nativa', () => {
  const t = trechoFaixa();
  assert.ok(!/\b(c[ãa]o|c[ãa]es|cachorro|cachorros|baia|baias|soltar|solto|solta)\b/i.test(t), 'vocabulário da casa');
  assert.ok(/ATENÇÃO — LEIA ANTES/.test(t));
  assert.ok(!/\balert\s*\(/.test(t) && !/\bconfirm\s*\(/.test(t) && !/\bprompt\s*\(/.test(t), 'confirmação dentro da página, nunca janela nativa');
  ['pelAlertaFixoPermitido'].forEach((f) => { const s = funcaoDe(src, f); assert.ok(!/\balert\s*\(|\bconfirm\s*\(/.test(s), f); });
  // o que o app mostra: todos os textos da tabela, sem termo proibido
  const a = aparelho();
  const todos = a.run('ALERTAS_FIXOS.map(function(d){ return d.tx+" | "+d.chip; }).join("\\n")');
  assert.ok(!/\b(c[ãa]o|c[ãa]es|cachorro|baia|solt)/i.test(todos));
  assert.strictEqual(a.run('ALERTAS_FIXOS.length'), 11);
  assert.deepStrictEqual(Array.from(a.run('ALERTAS_FIXOS.map(function(d){ return d.id; })')), ['nocao', 'peq', 'mach', 'sozi', 'sep', 'foge', 'morde', 'medo', 'alerg', 'colar', 'rep']);
  assert.strictEqual(a.run("alertaFixoDef('nocao').tx"), 'NÃO pode ficar junto com outros peludinhos');
  assert.strictEqual(a.run("alertaFixoDef('nocao').chip"), 'Não pode ficar com outros peludinhos');
  assert.strictEqual(a.run("alertaFixoDef('mach').chip"), 'Não pode com machos');
  assert.strictEqual(a.run("alertaFixoDef('sozi').tx"), 'Dorme SOZINHO');
  assert.strictEqual(a.run("alertaFixoDef('morde').tx"), 'Morde quando mexem na comida');
  assert.strictEqual(a.run("alertaFixoDef('medo').tx"), 'Medo de trovão / fogos');
  assert.strictEqual(a.run("alertaFixoDef('rep').chip"), 'Não pode correr / repouso');
});

(async () => {
  for (const [nome, fn] of fila) {
    try { await fn(); n += 1; } catch (e) { console.error('FALHOU: ' + nome); throw e; }
  }
  console.log('alertas-fixos160: OK (' + n + ' provas)');
})().catch((e) => { console.error(e); process.exitCode = 1; });
