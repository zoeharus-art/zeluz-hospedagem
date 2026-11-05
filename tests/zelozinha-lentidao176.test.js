'use strict';
// Zelozinha: «Está muito lento» (Adriana, 04/nov/2026). Um toque refazia a lista inteira várias vezes e nada mudava na tela até o banco responder.
// Dados inventados, sem rede e sem banco de verdade.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const html = fs.readFileSync(path.resolve(__dirname, '../auaulandia/index.html'), 'utf8');

let falhas = 0, total = 0;
function prova(nome, fn) { total++; try { fn(); console.log('  ok  ' + nome); } catch (e) { falhas++; console.log('  FALHOU  ' + nome + '\n    ' + (e && e.stack || e)); } }

/* a função como está na página: de uma linha só, ou até o `}` do mesmo recuo */
function fonte(nome) {
  const ini = html.indexOf('\n  function ' + nome + '(') + 1;
  assert.ok(ini > 0, 'função ' + nome);
  const linha = html.slice(ini, html.indexOf('\n', ini));
  if (linha.trimEnd().endsWith('}')) return linha;
  return html.slice(ini, html.indexOf('\n  }', ini) + 4);
}

function montar(extra) {
  const chamadas = { pintar: 0, topo: 0, petHTML: [] };
  const ctx = Object.assign({ encodeURIComponent, JSON, Array, window: {}, chamadas }, extra);
  ctx.pintar = () => { chamadas.pintar++; };
  ctx.atualizarTopo = () => { chamadas.topo++; };
  ctx.guardarAncora = () => ({});
  ctx.voltarAncora = () => {};
  ctx.anotarVista = () => {};
  ctx.lembrarAbertos = () => {};
  ctx.aplicarAbertos = () => {};
  ctx.filaDoAlvo = (el) => el.fila;
  ctx.petHTML = (c) => { chamadas.petHTML.push(c.dcKey); return '<novo>'; };
  ctx.document = { createElement: () => ({ set innerHTML(v) { this.firstElementChild = { novo: v }; } }) };
  vm.createContext(ctx);
  vm.runInContext(['assinaturaListas', 'pintarSoCartao', 'redesenharLinha'].map(fonte).join('\n'), ctx);
  return ctx;
}
function listaFalsa(fila, dcs) {
  const pai = { trocas: 0, replaceChild() { this.trocas++; } };
  return { fila, pai, querySelector: (sel) => { const dc = dcs.find((d) => sel.indexOf('"' + encodeURIComponent(d) + '"') >= 0); return dc ? { closest: () => ({ parentNode: pai }) } : null; } };
}
function repintar(valor) {
  let vezes = 0;
  const ctx = { estado: { itens: { a: {}, b: {}, c: {} } }, vmsDe: () => [{ valor }], daLinha: (v) => v === 'autorizar_loja', redesenharLinha: () => { vezes++; }, Object };
  vm.createContext(ctx);
  vm.runInContext(fonte('repintarCuidadosDoDayCare') + '\nrepintarCuidadosDoDayCare();', ctx);
  return vezes;
}

prova('repintar os cuidados do Day Care refaz a lista uma vez só, com qualquer número de FILHOts', () => {
  assert.equal(repintar('autorizar_loja'), 1);
});

prova('nada para repintar, nada é refeito', () => {
  assert.equal(repintar('aguardar'), 0);
});

function cenario(preparar) {
  const f = { paraResolver: [{ dcKey: 'mel__fulana' }, { dcKey: 'tico__beltrana' }], emAndamento: [{ dcKey: 'nina__sicrana' }] };
  const alvos = [listaFalsa('resolve', ['mel__fulana', 'tico__beltrana']), listaFalsa('progress', ['nina__sicrana'])];
  const ctx = montar({ classificacao117: () => f, alvosAtuais: () => alvos,
    estado: { erro: '', itens: { mel__fulana: { dcKey: 'mel__fulana' }, tico__beltrana: { dcKey: 'tico__beltrana' }, nina__sicrana: { dcKey: 'nina__sicrana' } }, listasPintadas: '' } });
  ctx.estado.listasPintadas = vm.runInContext('assinaturaListas', ctx)(f);
  if (preparar) preparar(ctx, f, alvos);
  return { ctx, f, alvos };
}

prova('um cartão mudou e ninguém mudou de lista: troca só ele', () => {
  const { ctx, alvos } = cenario();
  vm.runInContext('redesenharLinha("mel__fulana")', ctx);
  assert.equal(ctx.chamadas.pintar, 0, 'a lista inteira não é refeita');
  assert.deepEqual(Array.from(ctx.chamadas.petHTML), ['mel__fulana'], 'só o cartão tocado é montado de novo');
  assert.equal(alvos[0].pai.trocas, 1);
  assert.equal(ctx.chamadas.topo, 1, 'o topo continua sendo atualizado');
});

prova('semTopo continua sem mexer no topo', () => {
  const { ctx } = cenario();
  vm.runInContext('redesenharLinha("mel__fulana",true)', ctx);
  assert.equal(ctx.chamadas.topo, 0);
});

prova('alguém mudou de lista ou de lugar: refaz tudo', () => {
  const { ctx, f } = cenario();
  f.emAndamento = [{ dcKey: 'nina__sicrana' }, { dcKey: 'mel__fulana' }]; f.paraResolver = [{ dcKey: 'tico__beltrana' }];
  vm.runInContext('redesenharLinha("mel__fulana")', ctx);
  assert.equal(ctx.chamadas.pintar, 1); assert.equal(ctx.chamadas.petHTML.length, 0);
});

prova('o cartão devia estar na lista e não está (tela ainda «conferindo»): refaz tudo', () => {
  const { ctx } = cenario((c, f, alvos) => { alvos[0].querySelector = () => null; });
  vm.runInContext('redesenharLinha("mel__fulana")', ctx);
  assert.equal(ctx.chamadas.pintar, 1);
});

prova('ficha em edição: refaz tudo, porque o rascunho dela volta pelo pintar', () => {
  const { ctx } = cenario((c) => { c.window.Z138_FICHA_SELECAO = { dcKey: 'tico__beltrana' }; });
  vm.runInContext('redesenharLinha("mel__fulana")', ctx);
  assert.equal(ctx.chamadas.pintar, 1);
});

prova('tela com erro: refaz tudo; FILHOt que não está na memória: não faz nada', () => {
  const a = cenario((c) => { c.estado.erro = 'falhou'; });
  vm.runInContext('redesenharLinha("mel__fulana")', a.ctx);
  assert.equal(a.ctx.chamadas.pintar, 1);
  const b = cenario();
  vm.runInContext('redesenharLinha("ninguem__nada")', b.ctx);
  assert.equal(b.ctx.chamadas.pintar, 0); assert.equal(b.ctx.chamadas.petHTML.length, 0);
});

prova('o toque acende a escolha na hora e trava as outras do cartão até o banco responder', () => {
  const botao = (v) => ({ v, style: {}, disabled: false, attrs: {}, setAttribute(k, x) { this.attrs[k] = x; } });
  const a = botao('pipeta'), b = botao('1 comprimido'), outro = botao('loja');
  const grupo = { querySelectorAll: () => [a, b] }, art = { querySelectorAll: () => [a, b, outro] };
  a.parentNode = grupo; a.closest = () => art;
  const ctx = { Array }; vm.createContext(ctx);
  vm.runInContext(fonte('acenderEscolha') + '\nthis.f=acenderEscolha;', ctx);
  ctx.f(a);
  assert.equal(a.attrs['aria-pressed'], 'true'); assert.equal(b.attrs['aria-pressed'], 'false');
  assert.equal(a.style.background, 'var(--z-blue)'); assert.equal(b.style.background, 'var(--z-cream-warm)');
  assert.ok(a.disabled && b.disabled && outro.disabled, 'um segundo toque não se perde em silêncio');
});

prova('a página: quem pinta anota as listas, o toque acende antes de gravar, e a segunda conferência não espera a primeira', () => {
  assert.match(html, /function pintar\(alvos,preservar\)\{[\s\S]{0,420}estado\.listasPintadas=assinaturaListas\(classificacao117\(\)\);/);
  assert.match(html, /function anexar\(novos\)\{[\s\S]{0,300}estado\.listasPintadas=assinaturaListas\(classificacao117\(\)\);/);
  assert.match(html, /if\(acao==='esc'&&cy&&!estado\.salvando\[c\.dcKey\]\)acenderEscolha\(el\);\s+if\(acao==='esc'\)\{if\(cy\)gravarEscolha\(/);
  assert.match(html, /var par=await Promise\.all\(\[ref\.once\('value'\),lerRegistro\(c\)\]\),warm=par\[0\];/);
});

console.log(`zelozinha-lentidao176: ${total - falhas} de ${total} provas passaram`);
if (falhas) process.exit(1);
