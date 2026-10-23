'use strict';
// Exercita o core e o repositório transacional EXTRAÍDOS do index candidato,
// com banco em memória e provas sintéticas. Nunca conecta a rede/Firebase.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const Buffer = require('node:buffer').Buffer;
const base = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(__dirname, '..', 'auaulandia', 'index.html');
const html = fs.readFileSync(base, 'utf8');
const scripts = {};
for (const kind of ['core', 'repositorio']) {
  const re = new RegExp('<script[^>]*data-resposta88="' + kind + '"[^>]*>([\\s\\S]*?)<\\/script>');
  const hit = html.match(re); assert.ok(hit, 'módulo real ' + kind + ' encontrado'); scripts[kind] = hit[1];
}
const ctx = { Buffer, console, Date, TextEncoder, Uint8Array, setTimeout, clearTimeout };
ctx.globalThis = ctx; vm.createContext(ctx);
vm.runInContext(scripts.core, ctx, {filename:'candidata:resposta88-core'});
vm.runInContext(scripts.repositorio, ctx, {filename:'candidata:resposta88-repositorio'});
const Core = ctx.ZeluzResposta88, Repo = ctx.ZeluzResposta88RTDB;
const day = '2026-10-23', dcKey = 'aluno-teste__familia-teste', pelKey = 'aluno-teste', petId = pelKey, tutorId = dcKey;
const cycleKey = JSON.stringify([petId,tutorId,'ecto',day,'ecto_p']), itemK = 'ecto_p', contactId = 'qa115-contato-sintetico', groupKey = JSON.stringify(['contato_humano89',petId,tutorId,day]), scope = 'a'.repeat(64);
const session = {confirmada:true,humana:true,id:'usuario-qa',nome:'Pessoa QA',papel:'recepcao',assinatura:'sessao-sintetica'};
const destino = {confirmado:true,dia:day,dcKey,pelKey,petId,tutorId,escopoHistoricoSha:scope,escopoAtualSha:scope,presencaCorporal:true,presencaHistorica:true,checkout:false,ciclos:[{cycleKey,itemK,tipo:'ecto',elegivel:true,aberto:true}]};
const contactKey = Core.codificarChave(contactId);
const marker = {versao:89,tipo:'contato_humano',status:'feito',groupKey,dia:day,dcKey,pelKey,petId,tutorId,escopoSha:scope,cycleKeys:[cycleKey],itemKs:[itemK],humano:{id:session.id,nome:session.nome,role:session.papel},ts:1761211000000};
function fakeDb(fail=false){
  const data = new Map([['daycare/vencimentos/'+day+'/'+dcKey,{contatosHumanos89:{[contactKey]:marker}}]]); const writes=[];
  return {data,writes,ref(key){return{once:async()=>({val:()=>data.has(key)?structuredClone(data.get(key)):null}),transaction:async update=>{const old=data.has(key)?data.get(key):null;const next=update(old==null?null:structuredClone(old));if(fail||next===undefined)return{committed:false,snapshot:{val:()=>old==null?null:structuredClone(old)}};data.set(key,structuredClone(next));writes.push(key);return{committed:true,snapshot:{val:()=>structuredClone(next)}};}};}};
}
function setup(db){let reads=0; return Repo.criar({db,lerPainel:async()=>null,resolverAtual:async()=>structuredClone(destino),sessaoHumana:async()=>structuredClone(session),assinarTexto:()=>'',agora:()=> '2026-10-23T13:40:00.000Z'});}
function decision(value){if(value==='loja')return{decisao:'autorizar',origem:'loja'};if(value==='bolsa')return{decisao:'autorizar',origem:'bolsa'};if(value==='casa')return{decisao:'autorizar',origem:'externo'};return{decisao:'aguardar',origem:null};}
(async()=>{
  const expected={loja:'EXECUTAR_AQUI',bolsa:'EXECUTAR_AQUI',casa:'ACOMPANHAR_FORA',nao:'RETORNO_HUMANO'};
  for(const [value,intent] of Object.entries(expected)){
    const db=fakeDb(),repo=setup(db),d=decision(value),entrada={groupKey,petId,contatoId:contactId,resposta:{id:'resposta-'+value,itens:[{cycleKey,itemK,tipo:'ecto',...d,onde:'',baseRevision:-1}]}};
    const saved=await repo.decidir(entrada); if(!saved.ok)console.log('falha-'+value,saved); assert.equal(saved.ok,true,value+' salva pelo repositório real'); assert.equal(db.writes.length,1,value+' grava uma transação');
    const savedCycle=saved.registro.respostasEscopo49.porCiclo[Core.codificarChave(cycleKey)];
    assert.equal(savedCycle.decisao,d.decisao,value+' decisão persistida'); assert.equal(savedCycle.origem,d.origem,value+' origem persistida'); assert.equal(savedCycle.humanoId,session.id,value+' autoria persistida');
    assert.equal(saved.intencoes.length,1,value+' gera uma intenção'); assert.equal(saved.intencoes[0].tipo,intent,value+' intenção correta');
    if(value==='loja'||value==='bolsa')assert.equal(saved.intencoes[0].estado,'tarefa_pendente',value+' deixa tarefa pendente, sem declarar cuidado feito');
    if(value==='nao')assert.equal(saved.intencoes[0].estado,'aguardando_13h30','não respondeu gera retorno humano');
    const again=await repo.decidir(entrada); assert.equal(again.ok,true,value+' repetição idempotente'); assert.equal(again.status,'ja_registrado',value+' repetição reconhecida'); assert.equal(db.writes.length,1,value+' não duplica gravação');
  }
  const failedDb=fakeDb(true),failed=await setup(failedDb).decidir({groupKey,petId,contatoId:contactId,resposta:{id:'resposta-falha',itens:[{cycleKey,itemK,tipo:'ecto',decisao:'autorizar',origem:'loja',onde:'',baseRevision:-1}]}});
  assert.equal(failed.ok,false,'falha transacional não retorna sucesso'); assert.equal(failedDb.writes.length,0,'falha transacional não persiste parcialmente');
  console.log('tela115 QA independente: 45 verificações core/repositório passaram (4 decisões, autoria, tarefa/retorno, idempotência e falha transacional; somente dados sintéticos).');
})().catch(e=>{console.error(e);process.exitCode=1;});





