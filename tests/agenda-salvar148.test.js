'use strict';
const assert = require('node:assert/strict');
const D = require('../auaulandia/agenda-marcia/dados.js');
const P = require('../auaulandia/agenda-marcia/painel.js');
const dia = '2026-10-30', base = 'daycare/dashboard/' + dia + '/avaliacao';
const clone = v => v == null ? v : JSON.parse(JSON.stringify(v));
function valid(v,p) { if (v === undefined) throw new Error('undefined: '+p); if (v && typeof v === 'object') Object.keys(v).forEach(k => valid(v[k],p+'.'+k)); }
class DB { constructor(){this.data={};this.n=0;} ref(path){const db=this;return {push(){return {key:'teste-'+(++db.n)}},on(e,cb){cb({val:()=>clone(db.data[path]||{})})},off(){},transaction(fn){const old=clone(db.data[path]||null),next=fn(old);if(next===undefined)return Promise.resolve({committed:false,snapshot:{val:()=>old}});valid(next,'registro');db.data[path]=clone(next);if(path.startsWith(base+'/')){db.data[base] ||= {};db.data[base][path.slice(base.length+1)]=clone(next)}return Promise.resolve({committed:true,snapshot:{val:()=>clone(next)}})}}} }
const fields = {nome:'Ficticio',raca:'SRD',tutor:'Pessoa',telefone:'(00) 90000-0000',hora:'09:30',vacina:{conferido:false},vermifugo:{conferido:false},carrapaticida:{conferido:false},experiencia:'Nota ficticia',saude:'',observacoes:'',pagamento:{recebido:false,valorCent:0}};
function api(db){return D.criar({db,pode:()=>true,autor:()=>({id:'sintetico',nome:'Equipe'}),agora:()=>1793358000000})}
function root(){return {innerHTML:'',handlers:{},addEventListener(k,f){this.handlers[k]=f},removeEventListener(){},contains(){return true}}}
function form(id){const vals={...fields,'vacina-conferido':false,'vermifugo-conferido':false,'carrapaticida-conferido':false,'pagamento-recebido':false};return {closest(){return this},getAttribute(){return id},querySelector(sel){const n=sel.match(/name="(.+)"/)[1];return {value:vals[n],checked:vals[n]===true}}}}
const tick=()=>new Promise(r=>setImmediate(r));
async function run(){
 const db=new DB(), a=api(db), v=P.validar(fields).valor;
 const created=await a.salvar({acao:'criar',dia,avaliacao:v}); assert.equal(created.ok,true);assert.equal(P.ackValido(created,{acao:'criar',dia,avaliacao:v}),true);
 const paid=await a.salvar({acao:'criar',dia,requestId:'pago',avaliacao:{...v,pagamento:{recebido:true,valorCent:8000}}});assert.equal(paid.item.pagamento.recebido,true); const paidAgain=await a.salvar({acao:'criar',dia,requestId:'pago',avaliacao:{...v,pagamento:{recebido:true,valorCent:8000}}}); assert.equal(paidAgain.id,paid.id); assert.equal(paidAgain.revisao,paid.revisao);
 const legacy={valor:'Ficticio / SRD',hora:'08:00',det:{agendaMarcia:true,avaliacao129:{versao:131,tutor:'Pessoa',revisao:2,autorId:'equipe',autorNome:'Equipe',ts:1,quando:'09:00',historico:[{revisao:2,acao:'criar'}]}}}; db.data[base].legado=clone(legacy);db.data[base+'/legado']=clone(legacy);let snapshots=[];a.observar(dia,x=>snapshots.push(x));let old=snapshots.at(-1).itens.find(x=>x.id==='legado');
 const edited=await a.salvar({acao:'editar',dia,id:'legado',expectedRevision:old.revisao,expectedFingerprint:old.fingerprint,avaliacao:v});assert.equal(edited.item.telefone,'+5500900000000');assert.equal(db.data[base+'/legado'].det.avaliacao129.historico.length,2);
 const canceled=await a.salvar({acao:'cancelar',dia,id:'legado',expectedRevision:edited.revisao,expectedFingerprint:edited.item.fingerprint});const active=await a.salvar({acao:'reativar',dia,id:'legado',expectedRevision:canceled.revisao,expectedFingerprint:canceled.item.fingerprint});assert.equal(active.item.telefone,edited.item.telefone);assert.equal(active.item.cancelada,false);
 // Valores nulos e histórico existentes permanecem como recebidos.
 const preserve=clone(legacy);preserve.det.avaliacao129.cancelamento=null;preserve.det.avaliacao129.projecao=null;db.data[base].nulos=clone(preserve);db.data[base+'/nulos']=clone(preserve);
 let seen=[];a.observar(dia,x=>seen.push(x));let before=seen.at(-1).itens.find(x=>x.id==='nulos');await a.salvar({acao:'editar',dia,id:'nulos',expectedRevision:before.revisao,expectedFingerprint:before.fingerprint,avaliacao:v});assert.equal(db.data[base+'/nulos'].det.avaliacao129.cancelamento,null);assert.equal(db.data[base+'/nulos'].det.avaliacao129.projecao,null);
 const history=clone(legacy);history.det.avaliacao129.cancelamento={ativo:false,historico:[{ativo:false,autorId:'sintetico'}]};history.det.avaliacao129.projecao={estado:'confirmada',opId:'teste'};db.data[base].historico=clone(history);db.data[base+'/historico']=clone(history);seen=[];a.observar(dia,x=>seen.push(x));before=seen.at(-1).itens.find(x=>x.id==='historico');await a.salvar({acao:'editar',dia,id:'historico',expectedRevision:before.revisao,expectedFingerprint:before.fingerprint,avaliacao:v});assert.deepEqual(db.data[base+'/historico'].det.avaliacao129.cancelamento,history.det.avaliacao129.cancelamento);assert.deepEqual(db.data[base+'/historico'].det.avaliacao129.projecao,history.det.avaliacao129.projecao);
 // A tela usa a API real e o banco estrito, depois reabre o mesmo estado.
 const dbUI=new DB(), source=api(dbUI), first=root(); let ackCriacao;
 const carregar=()=>new Promise(resolve=>{source.observar(dia,s=>{if(s.estado==='pronto')resolve(s)})});
 P.montar(first,{dia,carregar,salvar:cmd=>source.salvar(cmd).then(a=>{ackCriacao=a;return a})});await tick();
 first.handlers.submit({target:form('novo'),preventDefault(){}}); await tick();
 assert.equal(ackCriacao.ok,true);assert.doesNotMatch(first.innerHTML,/Salvando…/);assert.doesNotMatch(first.innerHTML,/name="observacoes"[^>]*>Nota ficticia/);
 assert.equal(dbUI.data[base+'/'+ackCriacao.id].det.avaliacao129.telefone,'+5500900000000');
 const reopened=root();P.montar(reopened,{dia,carregar,salvar:cmd=>source.salvar(cmd)});await tick();assert.match(reopened.innerHTML,/Ficticio/);
 const leg={valor:'Ficticio / SRD',hora:'08:00',det:{agendaMarcia:true,avaliacao129:{tutor:'Pessoa',revisao:2,autorId:'a',autorNome:'Equipe',ts:1,quando:'09:00'}}};
 dbUI.data[base].legado=clone(leg);dbUI.data[base+'/legado']=clone(leg);
 const editUI=root(); let ackEdit;P.montar(editUI,{dia,carregar,salvar:cmd=>source.salvar(cmd).then(a=>{ackEdit=a;return a})});await tick();editUI.handlers.submit({target:form('legado'),preventDefault(){}});await tick();assert.equal(ackEdit.ok,true);assert.doesNotMatch(editUI.innerHTML,/Salvando…/);assert.equal(dbUI.data[base+'/legado'].det.avaliacao129.telefone,'+5500900000000');
 const checkAgain=root();P.montar(checkAgain,{dia,carregar,salvar:cmd=>source.salvar(cmd)});await tick();assert.match(checkAgain.innerHTML,/\+5500900000000/);
 // O callback começa no próprio submit; novo submit enquanto pendente não duplica.
 let chamadas=0, liberar; const uiDuplo=root(); P.montar(uiDuplo,{dia,carregar:()=>Promise.resolve({dia,estado:'pronto',itens:[]}),salvar:()=>{chamadas++;return new Promise(r=>{liberar=r})}});await tick();const ev={target:form('novo'),preventDefault(){}};uiDuplo.handlers.submit(ev);assert.equal(chamadas,1);uiDuplo.handlers.submit(ev);assert.equal(chamadas,1);liberar({ok:false});await tick();
 // Erros e confirmação inválida mantêm o rascunho e encerram o estado pendente.
 for(const mode of ['reject','invalid']){const u=root();P.montar(u,{dia,carregar:()=>Promise.resolve({dia,estado:'pronto',itens:[]}),salvar:()=>mode==='reject'?Promise.reject(Error('sintetico')):Promise.resolve({ok:false})});await tick();u.handlers.submit({target:form('novo'),preventDefault(){}});await tick();assert.match(u.innerHTML,/Nota ficticia/);assert.doesNotMatch(u.innerHTML,/Salvando…/);assert.match(u.innerHTML,mode==='reject'?/Não foi possível salvar/:/Não foi possível confirmar/);}
 const ui=root();P.montar(ui,{dia,carregar:()=>Promise.resolve({dia,estado:'pronto',itens:[]}),salvar(){throw Error('falha sintetica')}});await tick();ui.handlers.submit({target:form('novo'),preventDefault(){}});await tick();assert.match(ui.innerHTML,/Não foi possível salvar/);assert.match(ui.innerHTML,/Nota ficticia/);assert.doesNotMatch(ui.innerHTML,/Salvando…/);
 console.log('agenda-salvar148: OK');
}
module.exports = run();
if (require.main === module) module.exports.catch(e => { console.error(e); process.exitCode = 1; });
