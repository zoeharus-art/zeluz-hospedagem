'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '../auaulandia/index.html'), 'utf8');
const controller = html.match(/<script id="zelozinha-painel116-controller">([\s\S]*?)<\/script>/);
assert.ok(controller, 'controlador nativo existe');
const source = controller[1];
function extract(name) {
  const start = source.indexOf('  function ' + name + '(');
  assert.notEqual(start, -1, name + ' encontrado');
  const end = source.indexOf('\n  function ', start + 12);
  assert.notEqual(end, -1, name + ' delimitado');
  return source.slice(start, end);
}
const lista = { innerHTML: '', atual: null, querySelector() { return this.atual; } };
const ctx = {
  selecionado:'2026-10-30', snoopyConfirmados:{}, copia:v=>JSON.parse(JSON.stringify(v)), snoopySujo:{}, snoopyLendo:{}, snoopyRevisao:{}, snoopyConfirmados:{}, copia:v=>JSON.parse(JSON.stringify(v)), listaSnoopy:lista,
  txt: v => typeof v === 'string' ? v.trim() : '',
  esc: v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
  badgeSnoopy: n => { ctx.badge=n; }, evento: (nome, valor) => { ctx.ultimoEvento=valor; }
};
vm.createContext(ctx);
vm.runInContext(extract('identidadeSnoopy') + '\n' + extract('rotuloSnoopy') + '\n' + extract('renderSnoopy'), ctx);
const day='2026-10-30';
const items=[0,1,2,3].map(i=>({item:'carrapaticida',id:'f'+i,valor:'Ficticio '+i+'/Westie (PIPETA LOJA)',det:{prod:'PIPETA',qtd:'1'},confirmado:i<3,html:'Snoopy: lançado por Equipe'}));
function render(total=1) { ctx.renderSnoopy({dia:ctx.selecionado,estado:'pronto',total,itens:items}); }
render();
assert.equal(ctx.badge,1);
assert.match(lista.innerHTML,/Para lançar no Snoopy \(1\)/);
assert.match(lista.innerHTML,/Lançados \(3\)/);
assert.ok(lista.innerHTML.indexOf('Ficticio 3') < lista.innerHTML.indexOf('<details'));
assert.equal((lista.innerHTML.match(/data-z116-snoopy-check/g)||[]).length,4);
assert.equal((lista.innerHTML.match(/ checked/g)||[]).length,3);
for (let i=0;i<4;i++) { assert.match(lista.innerHTML,new RegExp('data-snoopy-id="f'+i+'"')); }
assert.match(lista.innerHTML,/data-snoopy-item="carrapaticida"/);
assert.match(lista.innerHTML,/data-z116-snoopy="carrapaticida\|f3"/);
assert.equal(ctx.rotuloSnoopy(items[3]).nome,'Ficticio 3');
assert.equal(ctx.rotuloSnoopy(items[3]).raca,'Westie');
assert.equal(ctx.rotuloSnoopy({valor:'Ficticio/Poodle (Toy)',det:{},item:'vet'}).raca,'Poodle (Toy)');
assert.equal(ctx.rotuloSnoopy({valor:'Ficticio/Raça/Variante',det:{},item:'vet'}).raca,'Raça/Variante');
assert.equal(ctx.rotuloSnoopy({valor:'Ficticio/Poodle (PIPETA LOJA)',det:{prod:'PIP'},item:'vet'}).raca,'Poodle (PIPETA LOJA)');
assert.match(lista.innerHTML,/<details class="z149-snoopy-historico"[^>]*><summary>/);
assert.doesNotMatch(lista.innerHTML,/data-z149-dia="2026-10-30" open/);
lista.atual={open:true,getAttribute:()=>day}; render();
assert.match(lista.innerHTML,/data-z149-dia="2026-10-30" open/);
ctx.selecionado='2026-10-31';render();
assert.doesNotMatch(lista.innerHTML,/data-z149-dia="2026-10-31" open/);
render(0);assert.equal(ctx.badge,null);assert.match(lista.innerHTML,/Não foi possível confirmar/);assert.equal(ctx.ultimoEvento.estado,'desconhecido');
ctx.renderSnoopy({dia:ctx.selecionado,estado:'desconhecido',total:null,itens:null});assert.equal(ctx.badge,null);assert.match(lista.innerHTML,/Não foi possível confirmar/);
console.log('snoopy-visual149: OK');
