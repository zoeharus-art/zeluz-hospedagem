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

class Element {
  constructor(tag, dc='') { this.tag=tag; this.dc=dc; this.children=[]; this.parent=null; this.open=false; this.text=''; }
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
function runRedraw({canonical}) {
  const root=new Element('root'); root.append(wrapper('pet%2F1',true));
  const estado={itens:{'pet/1':{dcKey:'pet/1'}},abertos:{}};
  const doc={
    querySelectorAll(selector){
      if(selector==='details.zt694-familia')return allDetails(root);
      if(selector==='[data-zt694-pet="pet%2F1"]') { const found=[]; const walk=n=>{if(n.tag==='article'&&n.dc==='pet%2F1')found.push(n);n.children.forEach(walk);};walk(root);return found; }
      return [];
    },
    createElement(){return {set innerHTML(_html){this.firstElementChild=wrapper('pet%2F1');}};}
  };
  const ctx={estado,document:doc,encodeURIComponent,Array,petHTML:()=>'<details><article></article></details>',lembrarAbertos(node){if(node.tag==='details')estado.abertos['family|pet%2F1']=node.open;},aplicarAbertos(node){node.open=estado.abertos['family|pet%2F1']===true;},atualizarTopo(){}};
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
  const context={...fixed,document:{...fixed.document}};
  // `runRedraw` exposes one invocation; call the extracted real function again against current tree.
  const doc={
    querySelectorAll(selector){return selector==='details.zt694-familia'?allDetails(fixed.root):[];},
    createElement(){return {set innerHTML(_html){this.firstElementChild=wrapper('pet%2F1');}};}
  };
  const ctx={estado:fixed.estado,document:doc,encodeURIComponent,Array,petHTML:()=>'<details><article></article></details>',lembrarAbertos(node){if(node.tag==='details')fixed.estado.abertos['family|pet%2F1']=node.open;},aplicarAbertos(node){node.open=fixed.estado.abertos['family|pet%2F1']===true;},atualizarTopo(){}};
  vm.runInNewContext('('+redrawSource+')',ctx)('pet/1',true);
  const wrappers=allDetails(fixed.root);
  const articles=[]; const walk=n=>{if(n.tag==='article')articles.push(n);n.children.forEach(walk);};walk(fixed.root);
  assert.equal(wrappers.length,1,'após redesenho '+(i+1)+' permanece um details por peludinho');
  assert.equal(articles.length,1,'após redesenho '+(i+1)+' permanece um article por peludinho');
  assert.equal(wrappers[0].open,true,'a gaveta aberta permanece aberta após o redesenho');
}
console.log('gaveta 6.94 DOM harness: regressão reproduzida e 3 redesenhos reais mantêm 1 details + 1 article e abertura.');
