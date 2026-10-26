'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {webcrypto}=require('node:crypto'),html=fs.readFileSync(path.resolve(__dirname,'..','auaulandia','index.html'),'utf8');
function trecho(re,n){const m=html.match(re);assert.ok(m,n+' existe');return m[1];}
function modulo(src,n){const b={module:{exports:{}},exports:{},Buffer,crypto:webcrypto,TextEncoder,Uint8Array,Date,JSON,Object,Array,Number,String,RegExp,Error,Promise,Intl,setTimeout,clearTimeout};b.globalThis=b;vm.runInNewContext(src,b,{filename:n});return b.module.exports;}
const Contatos=modulo(trecho(/<script id="zelozinha-contatos89-core">([\s\S]*?)<\/script>/,'provider89'),'contatos89.js');
const Core=modulo(trecho(/<script data-resposta88="core">([\s\S]*?)<\/script>/,'core88'),'core88.js');
const DIA='2026-10-26',pk='filhot-sintetico',dk=pk+'__familia-sintetica',petId=pk,tutorId=dk;
const verm=JSON.stringify([petId,tutorId,'vermifugo',DIA,'verm_p']),ecto=JSON.stringify([petId,tutorId,'ecto',DIA,'ecto_p']),vac=JSON.stringify([petId,tutorId,'vacina',DIA,'vac_v10_p']);
const atuaisLegado=[{cycleKey:verm,itemK:'verm_p',nome:'Vermífugo'},{cycleKey:ecto,itemK:'ecto_p',nome:'Carrapaticida'}];
assert.equal(JSON.stringify(Core.subescopoContato138([ecto,verm],['ecto_p','verm_p'],atuaisLegado).map(x=>x.itemK)),JSON.stringify(['ecto_p','verm_p']),'contato89 legado preserva a ordem histórica usada pelo próprio hash');
assert.equal(Core.subescopoContato138([ecto,ecto],['ecto_p','ecto_p'],atuaisLegado),null,'subescopo duplicado é ambíguo e fecha');
const selecaoFicha={versao:138,dia:DIA,dcKey:dk,pelKey:pk,petId,tutorId,cycleKey:ecto,itemK:'ecto_p',dataAplicacao:'2026-10-25',respostaId:'resposta-externa-138',revisao:3,ator:{id:'pessoa-138',nome:'Pessoa Sintética',papel:'recepcao'}};
const fontesFicha={dia:DIA,fichaUnica:true,cadastro:{n:'FILHOt Sintético',tutor:'Família Sintética'},ator:{id:'pessoa-138',nome:'Pessoa Sintética',papel:'recepcao'},resposta:{cycleKey:ecto,itemK:'ecto_p',respostaId:'resposta-externa-138',revisao:3,decisao:'autorizar',origem:'externo',confirmacaoTutor137:{versao:137,tipo:'tutor_ja_fez',dataAplicacao:'2026-10-25',estado:'atualizar_ficha_pendente'}},ciclos:[{cycleKey:ecto,itemK:'ecto_p'}],agora:'2026-10-26T14:00:00.000Z'};
assert.equal(Core.validarAtualizacaoFicha138(selecaoFicha,fontesFicha).ok,true,'ponte aceita somente resposta externa e ciclo exatos');
assert.equal(Core.validarAtualizacaoFicha138(selecaoFicha,Object.assign({},fontesFicha,{ator:{id:'outra',nome:'Outra Pessoa',papel:'recepcao'}})).ok,false,'troca de sessão fecha antes da ficha');
assert.equal(Core.validarAtualizacaoFicha138(selecaoFicha,Object.assign({},fontesFicha,{resposta:Object.assign({},fontesFicha.resposta,{revisao:4})})).ok,false,'resposta concorrente fecha antes da ficha');
assert.equal(Core.validarAtualizacaoFicha138(selecaoFicha,Object.assign({},fontesFicha,{ciclos:[]})).ok,false,'ciclo removido fecha antes da ficha');
assert.equal(Core.validarAtualizacaoFicha138(selecaoFicha,Object.assign({},fontesFicha,{ciclos:[{cycleKey:ecto,itemK:'ecto_p'},{cycleKey:ecto,itemK:'ecto_p'}]})).ok,false,'ciclo duplicado fecha antes da ficha');
assert.equal(Core.validarAtualizacaoFicha138(selecaoFicha,Object.assign({},fontesFicha,{cadastro:{n:'FILHOt Sintético',tutor:'Família Sintética',movido_para:'outra-ficha'}})).ok,false,'ficha movida fecha antes da gravação');
const futuro=Object.assign({},fontesFicha,{resposta:Object.assign({},fontesFicha.resposta,{confirmacaoTutor137:Object.assign({},fontesFicha.resposta.confirmacaoTutor137,{dataAplicacao:'2026-10-27'})})});
assert.equal(Core.validarAtualizacaoFicha138(Object.assign({},selecaoFicha,{dataAplicacao:'2026-10-27'}),futuro).ok,false,'data futura nunca autoriza atualização');
const painel={versao:81,detalhesEnvioVersao:104,dia:DIA,grupos:[{groupKey:'envio-verm',statusPainel:'enviado_confirmado',petId,tutorId}]};
const data=new Map([['daycare/cadastro/'+pk,{n:'FILHOt Sintético',tutor:'Família Sintética'}],['daycare/checkin-corpo/'+DIA+'/'+dk,{tipo:'entrada',quem:'Pessoa Sintética',fim:1760000000000}]]),writes=[];
const cp=v=>v==null?v:JSON.parse(JSON.stringify(v));
const db={ref(p){return{once:async()=>({val:()=>data.has(p)?cp(data.get(p)):null}),transaction:async fn=>{const old=data.has(p)?cp(data.get(p)):null,next=fn(cp(old));if(next===undefined)return{committed:false,snapshot:{val:()=>cp(old)}};data.set(p,cp(next));writes.push(p);return{committed:true,snapshot:{val:()=>cp(next)}};}};}};
let actor={id:'pessoa-138',nome:'Pessoa Sintética',role:'recepcao'},painelDisponivel=true;
const rows=[{chave:dk,p:{n:'FILHOt Sintético',tutor:'Família Sintética'}}];
const api=Contatos.criar({db,dia:()=>DIA,linhasHoje:()=>rows,pelKey:()=>pk,dcKey:()=>dk,pelExtra:()=>({}),
  vencItensDe:()=>[{k:'verm_p',vence:DIA,nome:'Vermífugo'},{k:'ecto_p',vence:DIA,nome:'Carrapaticida'},{k:'vac_v10_p',vence:DIA,nome:'V10'}],tipoCuidado:x=>x.k==='verm_p'?'vermifugo':x.k==='ecto_p'?'ecto':x.k==='vac_v10_p'?'vacina':'',
  autor:()=>cp(actor),permissao:()=>true,serverTimestamp:()=>1760000000123,painel:()=>painel,lerPainel:async()=>painelDisponivel?cp(painel):null,
  resolverEnvio:async g=>g==='envio-verm'?{confirmado:true,dia:DIA,petId,tutorId,ciclos:[{elegivel:true,aberto:true,cycleKey:verm,itemK:'verm_p'}]}:null});

(async()=>{
  const card=(await api.listar(true)).itens[0];assert.equal(card.estado,'envio_aceito');assert.deepEqual(card.cycleKeys,[verm,ecto,vac]);
  const ack=await api.marcar(card,{cycleKeys:[ecto],itemKs:['ecto_p']});assert.equal(ack.ok,true);assert.deepEqual(ack.registro.cycleKeys,[ecto]);assert.deepEqual(ack.registro.itemKs,['ecto_p']);assert.equal(writes.length,1);
  const recarregado=(await api.listar(true)).itens[0],again=await api.marcar(recarregado,{cycleKeys:[ecto],itemKs:['ecto_p']});assert.equal(again.idempotente,true);assert.equal(writes.length,1,'releitura e correção encontram o mesmo escopo residual sem regravar');
  const ackVac=await api.marcar(recarregado,{cycleKeys:[vac],itemKs:['vac_v10_p']});assert.equal(ackVac.ok,true);assert.notEqual(ackVac.fonteContato.contatoId,ack.fonteContato.contatoId);assert.equal(writes.length,2,'dois resíduos ficam em contatos independentes');
  await assert.rejects(()=>api.marcar(card,{cycleKeys:[verm],itemKs:['verm_p']}),/Este cuidado já teve contato hoje/);
  await assert.rejects(()=>api.marcar(card,{cycleKeys:[ecto],itemKs:['verm_p']}),/mudou|não é único/);
  const sessao={confirmada:true,humana:true,id:actor.id,nome:actor.nome,papel:actor.role,assinatura:'sessao-138'};
  const destino={confirmado:true,dia:DIA,dcKey:dk,pelKey:pk,petId,tutorId,presencaHistorica:true,escopoAtualSha:ack.registro.escopoSha,ciclos:[{cycleKey:ecto,itemK:'ecto_p',tipo:'ecto',elegivel:true,aberto:true}]};
  const reg={contatosHumanos89:{[Core.codificarChave(ack.fonteContato.contatoId)]:cp(ack.registro)}};
  const r=Core.decidir({groupKey:ack.registro.groupKey,contatoId:ack.fonteContato.contatoId,destino,sessao,registro:reg,agora:'2026-10-26T14:00:00.000Z',resposta:{id:'residual-138',itens:[{cycleKey:ecto,itemK:'ecto_p',decisao:'autorizar',origem:'loja',onde:'',baseRevision:-1}]}});
  assert.equal(r.ok,true);assert.equal(r.intencoes.length,1);assert.equal(r.intencoes[0].tipo,'EXECUTAR_AQUI');assert.equal(r.intencoes[0].cycleKey,ecto);assert.ok(!JSON.stringify(r).includes(verm),'vermífugo anterior não é materializado outra vez');
  reg.contatosHumanos89[Core.codificarChave(ackVac.fonteContato.contatoId)]=cp(ackVac.registro);const destinoVac=Object.assign({},destino,{escopoAtualSha:ackVac.registro.escopoSha,ciclos:[{cycleKey:vac,itemK:'vac_v10_p',tipo:'vacina',elegivel:true,aberto:true}]});
  const rv=Core.decidir({groupKey:ackVac.registro.groupKey,contatoId:ackVac.fonteContato.contatoId,destino:destinoVac,sessao,registro:reg,agora:'2026-10-26T14:05:00.000Z',resposta:{id:'residual-vac-138',itens:[{cycleKey:vac,itemK:'vac_v10_p',decisao:'aguardar',origem:null,onde:'',baseRevision:-1}]}});assert.equal(rv.ok,true);assert.ok(rv.intencoes.every(x=>x.cycleKey===vac&&x.itemK==='vac_v10_p'));assert.ok(!JSON.stringify(rv).includes(ecto)&&!JSON.stringify(rv).includes(verm),'segundo residual não reexpande cuidados anteriores');
  painelDisponivel=false;await assert.rejects(()=>api.marcar(card,{cycleKeys:[ecto],itemKs:['ecto_p']}),/Não foi possível confirmar os contatos/, 'fonte incompleta falha fechada');painelDisponivel=true;
  painel.identidadesPets={a:{petId:'a',tutorRefId:tutorId,pelKeyAtual:pk,dcKeyAtual:dk},b:{petId:'b',tutorRefId:tutorId,pelKeyAtual:pk,dcKeyAtual:dk}};
  await assert.rejects(()=>api.marcar(card,{cycleKeys:[ecto],itemKs:['ecto_p']}),/mais de uma ficha possível/);delete painel.identidadesPets;
  assert.match(html,/marcar\(c,pedido\)/);assert.match(html,/contatoAck\.fonteContato/);
  const ponteFicha=trecho(/async function abrirFichaTutor138\(c,v,i,care\)\{([\s\S]*?)\n  window\.zTutor138ValidarAntes=/,'ponte de ficha138');
  assert.match(ponteFicha,/prevEdicaoItemHTML138\(pet,cy\.itemK/,'embute somente o formulário nativo do cuidado');
  assert.doesNotMatch(ponteFicha,/irParaView|prevAbrir\(/,'não troca de tela nem abre a ficha inteira');
  assert.match(ponteFicha,/campo\.value=conf\.dataAplicacao;campo\.readOnly=true/,'prefill preserva a data informada pelo tutor');
  assert.match(ponteFicha,/Confira produto, regime e vencimento; a ficha só muda depois de tocar em Salvar/,'não confunde abrir/preencher com salvar');
  assert.doesNotMatch(ponteFicha,/setPelExtra|\.update\(|\.set\(/,'abrir o formulário não grava ficha nem cache');
  assert.match(html,/function prevEdicaoHTML\(o, somenteItens\)/,'renderer nativo aceita recorte de um cuidado sem mudar chamadores antigos');
  assert.match(html,/patch\[base\+'_ondefoi'\]='Tutor em casa'/,'writer persiste a proveniência externa no mesmo patch confirmado');
  assert.match(html,/a 2ª dose informada exige revisão do esquema/,'ponte externa nunca converte silenciosamente uma 2ª dose velha em nova 1ª dose');
  assert.match(html,/function capturarFicha138\(\)[\s\S]*querySelectorAll\('input\[id\],select\[id\],textarea\[id\]'\)[\s\S]*function restaurarFicha138/,'repintura captura todos os campos editáveis do formulário nativo');
  assert.match(html,/Object\.keys\(r\.valores\|\|\{\}\)\.forEach[\s\S]*x\.value=r\.valores\[id\]/,'repintura restaura produto, validade e demais valores pelo mesmo id');
  assert.match(html,/zTutor138DepoisFalhar=function\(s,r\)[\s\S]{0,700}O que foi digitado continua no cartão/,'falha mantém o rascunho visível no cartão');
  assert.doesNotMatch(ponteFicha,/font-weight:800/,'nota explicativa não transforma todo o texto em negrito');
  assert.match(html,/data-zt694-acao="atualizar-ficha"/,'ação humana separada fica no mesmo cartão');
  assert.match(html,/zTutor138ValidarAntes\(tutor138,p,k\)[\s\S]{0,500}prevLanceGravar35/,'writer nativo só roda após revalidação');
  assert.match(html,/r&&r\.ok===true&&window\.Z138_FICHA_SELECAO===tutor138/,'contexto só é encerrado depois do ACK real');
  assert.match(html,/data-zt694-acao="atualizar-ficha"\],\[data-zt694-data-fez\]/,'duplo toque fica bloqueado durante outra gravação');
  console.log('zelozinha-contato-residual138: provas passaram (residual, legado ordenado, envio protegido, idempotência, fonte fechada, identidade e ponte nativa da ficha).');
})().catch(e=>{console.error(e);process.exitCode=1;});
