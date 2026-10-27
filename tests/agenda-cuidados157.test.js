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

const watchdog=setTimeout(()=>{console.error('Teste 157 não terminou');process.exit(1)},5000);
(async()=>{
 const db=new DB(),a=api(db),v={...fields,vacina:{conferido:false,plano:'antes',detalhe:'Múltipla e gripe'},vermifugo:{conferido:false,plano:'na_zeluz',detalhe:''},carrapaticida:{conferido:false,plano:'a_conferir',detalhe:''}};
 assert.equal(P.validar(v).valido,true);
 assert.equal(P.validar({...v,vacina:{...v.vacina,detalhe:''}}).valido,false);
 await assert.rejects(a.salvar({acao:'criar',dia,avaliacao:{...v,vacina:{...v.vacina,detalhe:''}}}),/VACINA_DETALHE_OBRIGATORIO/);
 await assert.rejects(a.salvar({acao:'criar',dia,avaliacao:{...v,vermifugo:{...v.vermifugo,conferido:true}}}),/PLANO_INCONSISTENTE/);
 const novo=await a.salvar({acao:'criar',dia,requestId:'ficticio157',avaliacao:v});assert.equal(novo.item.vacina.plano,'antes');assert.equal(novo.item.vacina.detalhe,'Múltipla e gripe');assert.equal(P.ackValido(novo,{acao:'criar',dia,avaliacao:P.validar(v).valor}),true);
 const path=base+'/'+novo.id;db.data[path].det.avaliacao129.vacina.feitoNaZeluz={autor:'Equipe fictícia',ts:42};db.data[base][novo.id]=clone(db.data[path]);
 let itens=[];a.observar(dia,x=>itens=x.itens);const atual=itens.find(x=>x.id===novo.id);const alterado={...v,vacina:{...v.vacina,plano:'na_zeluz',detalhe:'Raiva'}};
 const editado=await a.salvar({acao:'editar',dia,id:novo.id,expectedRevision:atual.revisao,expectedFingerprint:atual.fingerprint,avaliacao:alterado});assert.equal(editado.item.vacina.plano,'na_zeluz');assert.equal(db.data[path].det.avaliacao129.vacina.feitoNaZeluz.autor,'Equipe fictícia');assert.equal(db.data[path].det.avaliacao129.historico.at(-1).cuidados.vacina.detalhe,'Raiva');assert.notEqual(editado.item.fingerprint,atual.fingerprint);
 await assert.rejects(a.salvar({acao:'editar',dia,id:novo.id,expectedRevision:atual.revisao,expectedFingerprint:atual.fingerprint,avaliacao:{...v,telefone:'(00) 91111-1111'}}),/DESATUALIZADO/);
 const antigoCmd={...fields,vacina:{conferido:true}};const depoisLegado=await a.salvar({acao:'editar',dia,id:novo.id,expectedRevision:editado.revisao,expectedFingerprint:editado.item.fingerprint,avaliacao:antigoCmd});assert.equal(depoisLegado.item.vacina.plano,'na_zeluz');assert.equal(depoisLegado.item.vacina.conferido,false);assert.equal(db.data[path].det.avaliacao129.vacina.feitoNaZeluz.autor,'Equipe fictícia');
 const legado={valor:'Ficticio / SRD',hora:'08:00',det:{agendaMarcia:true,avaliacao129:{versao:131,tutor:'Pessoa',telefone:'+5500900000000',vacina:{conferido:true,feitoNaZeluz:{autor:'Equipe antiga',ts:12}},vermifugo:{conferido:false},carrapaticida:{conferido:false},revisao:2}}};db.data[base].legado=clone(legado);db.data[base+'/legado']=clone(legado);a.observar(dia,x=>itens=x.itens);const old=itens.find(x=>x.id==='legado');assert.equal(old.vacina.plano,undefined);await a.salvar({acao:'editar',dia,id:'legado',expectedRevision:old.revisao,expectedFingerprint:old.fingerprint,avaliacao:{...fields,vacina:{conferido:true}}});assert.equal(db.data[base+'/legado'].det.avaliacao129.vacina.feitoNaZeluz.autor,'Equipe antiga');assert.equal(db.data[base+'/legado'].det.avaliacao129.vacina.plano,undefined);
 let legadoAtual=[];a.observar(dia,x=>legadoAtual=x.itens);const original=legadoAtual.find(x=>x.id==='legado');let enviada;const host={innerHTML:'',handlers:{},addEventListener(k,f){this.handlers[k]=f},removeEventListener(){},contains(){return true}};
 const view=P.montar(host,{dia,carregar:async()=>({dia,estado:'pronto',itens:[original]}),salvar:cmd=>{enviada=cmd;return a.salvar(cmd)}});await new Promise(r=>setImmediate(r));
 const campos={nome:'Ficticio',raca:'SRD',tutor:'Pessoa',telefone:'(00) 92222-2222',hora:'08:00','vacina-plano':'em_dia','vermifugo-plano':'a_conferir','carrapaticida-plano':'a_conferir','vacina-detalhe':'','vermifugo-detalhe':'','carrapaticida-detalhe':'',experiencia:'',saude:'',observacoes:'','pagamento-recebido':false};
 const form={closest(){return this},getAttribute(){return 'legado'},querySelector(sel){const m=sel.match(/name="(.+)"/),k=m&&m[1];if(!k||!Object.hasOwn(campos,k))return null;return {value:campos[k],checked:campos[k]===true,getAttribute(n){return n==='data-plano-legado'&&k.endsWith('-plano')?campos[k]:null}}}};host.handlers.submit({target:form,preventDefault(){}});await new Promise(r=>setImmediate(r));await new Promise(r=>setImmediate(r));assert(enviada);assert.equal(enviada.avaliacao.vacina.plano,undefined);assert.equal(db.data[base+'/legado'].det.avaliacao129.vacina.feitoNaZeluz.autor,'Equipe antiga');assert.equal(db.data[base+'/legado'].det.avaliacao129.vacina.plano,undefined);view.destroy();

 const html=P.desenhar({dia,estado:'pronto',itens:[editado.item]},{});assert.match(html,/Vai fazer na Zêluz/);assert.doesNotMatch(html,/feito fora/i);assert.match(html,/Previsto na Zêluz não significa aplicado/);
 console.log('agenda-cuidados157: OK');
})().finally(()=>clearTimeout(watchdog)).catch(e=>{console.error(e);process.exitCode=1});
