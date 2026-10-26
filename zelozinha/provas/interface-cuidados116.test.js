'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const source = fs.readFileSync(path.resolve(__dirname, '../../auaulandia/index.html'), 'utf8');
const start = source.indexOf('  function redesenharLinha(dc,semTopo){');
const end = source.indexOf('\n  function atualizarTopo(){', start);
assert.ok(start >= 0 && end > start, 'função real redesenharLinha localizada');
const redrawSource = source.slice(start, end);
const paintStart = source.indexOf('  function pintar(alvos,preservar){');
const paintEnd = source.indexOf('\n  function anexar(', paintStart);
assert.ok(paintStart >= 0 && paintEnd > paintStart, 'função real pintar localizada');
const paintSource = source.slice(paintStart, paintEnd);
const draftStart = source.indexOf('  function capturarFicha138(){');
assert.ok(draftStart >= 0 && draftStart < paintStart, 'helpers reais de preservação de rascunho localizados');
const draftSource = source.slice(draftStart, paintStart);
const filaStart = source.indexOf('  function filaDoAlvo(el){');
const filaEnd = source.indexOf('\n  function guardarAncora(){', filaStart);
assert.ok(filaStart >= 0 && filaEnd > filaStart, 'helper real filaDoAlvo localizado');
const filaSource = source.slice(filaStart, filaEnd);

class Element {
  constructor(tag, dc='') { this.tag=tag; this.dc=dc; this.children=[]; this.parent=null; this.open=false; this.text=''; this.attributes={}; }
  hasAttribute(name) { return Object.prototype.hasOwnProperty.call(this.attributes,name); }
  setAttribute(name,value) { this.attributes[name]=String(value); }
  set innerHTML(_html) { this.children=[]; this.append(wrapper('pet%2F1')); }
  append(child) { child.parent=this; this.children.push(child); return child; }
  querySelector(selector) {
    const want=(selector.match(/data-zt694-pet="([^"]+)"/)||[])[1];
    if(!want)return null;
    const stack=[...this.children];
    while(stack.length){const n=stack.shift();if(n.tag==='article'&&n.dc===want)return n;stack.unshift(...n.children);}
    return null;
  }
  replaceWith(next) {
    if(!this.parent)return;
    const siblings=this.parent.children, i=siblings.indexOf(this);
    if(i<0)return;
    next.parent=this.parent; siblings[i]=next; this.parent=null;
  }
}
function wrapper(dc, isOpen=false) { const w=new Element('details'); w.open=isOpen; w.append(new Element('summary')); w.append(new Element('article',dc)); return w; }
function allDetails(root) { const out=[]; const walk=n=>{if(n.tag==='details')out.push(n);n.children.forEach(walk);};walk(root);return out; }
function allArticles(root) { const out=[]; const walk=n=>{if(n.tag==='article')out.push(n);n.children.forEach(walk);};walk(root);return out; }
function contextFor(root,estado) {
  const doc={
    querySelector(){return null;},
    querySelectorAll(selector){
      if(selector==='details.zt694-familia')return allDetails(root);
      if(selector==='[data-zt694-pet="pet%2F1"]')return allArticles(root);
      if(selector==='[data-z89-contatos],[data-zt694-resolver-list][data-zt694-operacional="1"],[data-zt694-andamento-list][data-zt694-operacional="1"]')return [root];
      return [];
    },
    createElement(){return {set innerHTML(_html){this.firstElementChild=wrapper('pet%2F1');}};}
  };
  const ctx={estado,window:{},document:doc,encodeURIComponent,Array,petHTML:()=>'<details><article></article></details>',montarMarkup:()=>'<details><article></article></details>',alvosAtuais:()=>[root],guardarAncora:()=>null,anotarVista(){},lembrarAbertos(node){allDetails(node).forEach(d=>{estado.abertos['family|pet%2F1']=d.open;});},aplicarAbertos(node){allDetails(node).forEach(d=>{d.open=estado.abertos['family|pet%2F1']===true;});},atualizarTopo(){}};
  vm.runInNewContext(filaSource,ctx);
  vm.runInNewContext(draftSource,ctx);
  vm.runInNewContext(paintSource,ctx);
  return ctx;
}
function runRedraw({canonical}) {
  const root=new Element('root'); root.append(wrapper('pet%2F1',true));
  const estado={itens:{'pet/1':{dcKey:'pet/1'}},abertos:{}};
  const ctx=contextFor(root,estado);
  if(canonical) vm.runInNewContext('('+redrawSource+')',ctx)('pet/1',true);
  else {
    // Reproduz a implementação defeituosa anterior para documentar a causa: article.replaceWith(details).
    const oldFn=`(function redesenharLinha(dc,semTopo){var id=encodeURIComponent(dc),c=estado.itens[dc];Array.prototype.forEach.call(document.querySelectorAll('[data-zt694-pet="'+id+'"]'),function(el){var tmp=document.createElement('div');tmp.innerHTML=petHTML(c);var novo=tmp.firstElementChild;if(novo)el.replaceWith(novo);});})`;
    vm.runInNewContext(oldFn,ctx)('pet/1',true);
  }
  return {root,estado};
}
const legacy=runRedraw({canonical:false});
assert.equal(allDetails(legacy.root).length,2,'prova do defeito anterior: a primeira resposta já aninhava uma gaveta');
const fixed=runRedraw({canonical:true});
for(let i=0;i<3;i++){
  // `runRedraw` exposes one invocation; call the extracted real function again against current tree.
  const ctx=contextFor(fixed.root,fixed.estado);
  vm.runInNewContext('('+redrawSource+')',ctx)('pet/1',true);
  const wrappers=allDetails(fixed.root);
  const articles=allArticles(fixed.root);
  assert.equal(wrappers.length,1,'após redesenho '+(i+1)+' permanece um details por peludinho');
  assert.equal(articles.length,1,'após redesenho '+(i+1)+' permanece um article por peludinho');
  assert.equal(wrappers[0].open,true,'a gaveta aberta permanece aberta após o redesenho');
}
console.log('gaveta 6.94 DOM harness: regressão reproduzida e 3 redesenhos reais mantêm 1 details + 1 article e abertura.');

// O editor embutido reutiliza os helpers REAIS, com apenas os nós externos em memória.
const stateDraft={dia:'2026-10-26',itens:{'pet/1':{ciclos:[{cycleKey:'ciclo-sintetico',itemK:'ecto_p'}]}},abertos:{}};
const draftCtx=contextFor(new Element('root'),stateDraft);
const selection={dia:stateDraft.dia,dcKey:'pet/1',pelKey:'ficha-sintetica',cycleKey:'ciclo-sintetico',itemK:'ecto_p'};
draftCtx.window.Z138_FICHA_SELECAO=selection;
const ids=['prevT_ficha-sintetica_ecto_p','prevQ_ficha-sintetica_ecto_p','produto-sintetico','validade-sintetica'];
const values=['2026-10-25','Tutor — informado por Pessoa Sintética','produto escolhido','2026-11-24'];
const fields=Object.fromEntries(ids.map((id,i)=>[id,{id,value:values[i]}]));
const editor={querySelectorAll:()=>Object.values(fields)};
const slot={innerHTML:'',insertAdjacentHTML(_where,value){this.notice=value;}};
const care={querySelector:()=>slot},article={querySelector:()=>care};
draftCtx.document.querySelector=selector=>selector==='[data-z138-editor-native]'?editor:article;
draftCtx.document.getElementById=id=>fields[id]||null;
draftCtx.fichaUnica138=()=>({});draftCtx.cuidadoNome=()=> 'Cuidado sintético';
draftCtx.prevEdicaoItemHTML138=()=>({ok:true,html:'formulário nativo sintético'});
const savedDraft=draftCtx.capturarFicha138();
Object.values(fields).forEach(field=>{field.value='';});
draftCtx.restaurarFicha138(savedDraft);
ids.forEach((id,i)=>assert.equal(fields[id].value,values[i],'repintura preserva '+id));
assert.equal(fields[ids[0]].readOnly,true,'data confirmada mantém-se protegida');
assert.equal(fields[ids[1]].readOnly,true,'proveniência humana mantém-se protegida');
assert.match(slot.notice,/só muda depois de tocar em Salvar/);
console.log('editor138: captura e restauração literais preservam data, autoria, produto e validade sem navegador.');
