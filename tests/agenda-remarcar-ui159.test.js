'use strict';
const assert=require('node:assert/strict');
const M=require('../auaulandia/agenda-marcia/painel.js');
const tick=()=>new Promise(r=>setImmediate(r));
class Root{constructor(){this.innerHTML='';this.h={};this.ownerDocument={activeElement:null};}addEventListener(k,f){this.h[k]=f;}removeEventListener(k){delete this.h[k];}querySelectorAll(){return [];}querySelector(){return null;}}
const DIA='2026-10-26';
function target(attr,id,value){return {value,hasAttribute:k=>k===attr,getAttribute:k=>k===attr?id:null,closest(){return this;}};}
function row(){return {id:'origem',dia:DIA,hora:'10:00',nome:'Aurora',raca:'SRD',tutor:'Família de teste',telefone:'(00) 90000-0000',vacina:{conferido:true,plano:'em_dia'},vermifugo:{conferido:false,plano:'na_zeluz'},carrapaticida:{conferido:false,plano:'antes'},pagamento:{recebido:true,valorCent:8000,quem:'Recepção de teste',quando:'26/10/2026'},revisao:3,fingerprint:'fp-original',estado:'confirmada',confirmada:true};}
function ack(p,concluida){const it=Object.assign(row(),{revisao:4,fingerprint:'fp-movido',remarcacao159:{requestId:p.requestId||'token-retomada',estado:concluida?'concluida':'pendente',destino:{dia:p.novoDia||'2026-10-27',hora:p.novaHora||'14:45',id:'destino'}}});return {ok:true,acao:'remarcar',dia:DIA,id:'origem',revisao:4,item:it,concluida,espelhoOk:false};}
async function run(){
 const root=new Root(),requests=[];let resolve;const painel=M.montar(root,{dia:DIA,carregar:()=>({dia:DIA,estado:'pronto',itens:[row()]}),salvar:p=>{requests.push(p);return new Promise(r=>resolve=r);}});await tick();
 root.h.click({target:target('data-am-remarcar','origem')});assert.equal(requests.length,0);assert(root.innerHTML.includes('Informe a nova data e o novo horário'));
 root.h.input({target:target('data-am-remarcar-dia','origem','2026-10-27')});
 root.h.click({target:target('data-am-remarcar','origem')});assert.equal(requests.length,0,'data sem horário não salva');
 root.h.input({target:target('data-am-remarcar-hora','origem','14:45')});
 root.h.click({target:target('data-am-remarcar','origem')});root.h.click({target:target('data-am-remarcar','origem')});
 assert.equal(requests.length,1,'clique duplo compartilha pedido pendente');assert.equal(requests[0].novoDia,'2026-10-27');assert.equal(requests[0].novaHora,'14:45');assert.equal(requests[0].expectedFingerprint,'fp-original');assert(!('pagamento'in requests[0]),'remarcar não envia intenção de cobrança');
 resolve(ack(requests[0],false));await tick();assert(root.innerHTML.includes('Concluir remarcação'));assert(root.innerHTML.includes('Remarcadas (1)'));assert(!root.innerHTML.includes('Desfazer cancelamento'));
 root.h.click({target:target('data-am-retomar-remarcacao','origem')});assert.equal(requests[1].acao,'retomar_remarcacao');assert.equal(requests[1].expectedFingerprint,'fp-movido');assert.equal(requests[1].requestId,undefined,'retomar usa vínculo persistido');
 let finalAck=ack(requests[0],true);resolve(finalAck);await tick();assert(root.innerHTML.includes('Abrir novo dia'));assert(!root.innerHTML.includes('Concluir remarcação'));
 assert(M.ackRemarcacao159(ack(requests[0],true),requests[0],row()));
 for(const alter of [a=>a.item.id='errado',a=>a.item.dia='2026-10-28',a=>a.item.remarcacao159.destino.hora='10:00',a=>a.item.remarcacao159.requestId='outro',a=>a.item.revisao=2,a=>a.concluida=false]){const a=ack(requests[0],true);alter(a);assert.equal(M.ackRemarcacao159(a,requests[0],row()),false,'ACK divergente não substitui registro na UI');}
 const dirtyRoot=new Root(),dirtyRequests=[];const dirtyPanel=M.montar(dirtyRoot,{dia:DIA,carregar:()=>({dia:DIA,estado:'pronto',itens:[row()]}),salvar:p=>{dirtyRequests.push(p);return null;}});await tick();
 const fields={nome:'Aurora',raca:'SRD',tutor:'Família de teste',telefone:'(00) 90000-0000',hora:'10:00',observacoes:'Nota ainda não salva','vacina-plano':'em_dia','vermifugo-plano':'na_zeluz','carrapaticida-plano':'antes'};
 const form={getAttribute:()=> 'origem',querySelector:s=>{const n=s.match(/name="(.+)"/)[1];return {value:fields[n]||'',checked:n==='pagamento-recebido'};}};
 dirtyRoot.h.input({target:{hasAttribute:()=>false,name:'observacoes',closest:()=>form}});
 dirtyRoot.h.input({target:target('data-am-remarcar-dia','origem','2026-10-27')});dirtyRoot.h.input({target:target('data-am-remarcar-hora','origem','14:45')});
 dirtyRoot.h.click({target:target('data-am-remarcar','origem')});assert.equal(dirtyRequests.length,0,'cadastro não salvo impede remarcação');
 assert(dirtyRoot.innerHTML.includes('Nota ainda não salva'));assert(dirtyRoot.innerHTML.includes('value="2026-10-27"'));assert(dirtyRoot.innerHTML.includes('value="14:45"'));assert(dirtyRoot.innerHTML.includes('Salve as alterações do cadastro antes de remarcar'));
 dirtyPanel.destroy();painel.destroy();assert.equal(Object.keys(root.h).length,0);
 console.log('agenda-remarcar-ui159: OK (data/hora explícitos, dupla ação, retomada e ACK divergente)');
}
run().catch(e=>{console.error(e);process.exitCode=1});
