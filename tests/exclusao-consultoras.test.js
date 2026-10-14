'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const indexPath=path.resolve(__dirname,'../auaulandia/index.html');
const html=fs.readFileSync(indexPath,'utf8');
function fimBloco(abre){
  let nivel=0,asp='',linha=false,bloco=false;
  for(let i=abre;i<html.length;i++){
    const c=html[i],n=html[i+1];
    if(linha){if(c==='\n')linha=false;continue;}
    if(bloco){if(c==='*'&&n==='/'){bloco=false;i++;}continue;}
    if(asp){if(c==='\\'){i++;continue;}if(c===asp)asp='';continue;}
    if(c==='/'&&n==='/'){linha=true;i++;continue;}if(c==='/'&&n==='*'){bloco=true;i++;continue;}
    if(c==='\''||c==='"'||c==='`'){asp=c;continue;}
    if(c==='{')nivel++; else if(c==='}'&&!--nivel)return i;
  }
  throw new Error('bloco sem fim');
}
function extrair(nome){
  const re=new RegExp('(?:async\\s+)?function\\s+'+nome.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s*\\(');
  const m=re.exec(html); assert(m,nome+' existe'); const abre=html.indexOf('{',m.index);
  return html.slice(m.index,fimBloco(abre)+1);
}
function extrairConst(nome){
  const m=new RegExp('const\\s+'+nome+'\\s*=').exec(html); assert(m,nome+' existe'); const abre=html.indexOf('{',m.index);
  return html.slice(m.index,fimBloco(abre)+1)+';';
}
function contexto(registro,aberto,op={}){
  const chamadas={cap:[],transacoes:0,rastro:[],cancelouOrcamento:0,leituras:0};
  let atual=JSON.parse(JSON.stringify(registro));
  const outro={id:'estadia-homonima',nome:registro.nome,tutor:'Outra família',refKey:'outro',_ts:10,status:'ativa'};
  const S={id:'estadia-frida',passo:'excluir',provas:op.provas||{bloqueia:false},aberto:Object.assign({},aberto),e:JSON.parse(JSON.stringify(registro)),nascidos:[],card:null,orcId:'orc-1',gravando:false};
  const ctx={Promise,Date,JSON,Math,console,HOSP_CORR:S,HOSP_ERRO_MEXEU:'conflito',EST_TODAS:{'estadia-frida':atual,'estadia-homonima':outro},
    hospLimpo:v=>JSON.parse(JSON.stringify(v)),hospTrocaIncompleta:()=>false,hospProvaDeEstadia:()=>({bloqueia:false,provas:[]}),
    hospAgora:()=>1700000000000,hospQuandoBR:()=> '14/11/2023 às 19:13',hospQuemLogado:()=> 'Consultora em sessão',
    hospDiasDaEstadia:()=>[],hospIsoDe:()=> '2023-11-14',hospHojeISO:()=> '2023-11-14',
    hospLerProvasExcluir:async()=>({agenda:{},logs:{},rels:{}}),hospRastro:async(acao,id,novo,reg)=>{chamadas.rastro.push({acao,id,novo,reg});return {ok:true};},
    hospEstadiaLocal:()=>{},hospGravarSinalAgenda:async()=>{},hospCorrDepois:()=>{},hospCorrRender:()=>{},_logFalhaGrav:()=>{},
    orcCancelarGravar:async()=>{chamadas.cancelouOrcamento++;return {ok:true};},orcJaForaDe:()=>'',orcStatusRotulo:()=>'',
    corrAssinar:(senha,capacidade)=>{chamadas.cap.push(capacidade); if(senha==='consultora-valida'&&capacidade==='assinar-anulacao-hospedagem-engano')return {ok:true,nome:'Consultora Demonstração',papel:'consultora',erro:''}; if(senha==='gestao-valida')return {ok:true,nome:'Gestão Demonstração',papel:'gestao',erro:''}; return {ok:false,nome:'',papel:'',erro:'senha inválida'};},
    DB:{ref:caminho=>({once:async()=>{chamadas.leituras++;const antes=atual;return {val:()=>antes};},transaction:async fn=>{chamadas.transacoes++;if(op.mudarNaTransacao)atual=Object.assign({},atual,op.mudarNaTransacao);const novo=fn(atual);if(novo===undefined||novo===null)return {committed:false,snapshot:{val:()=>atual}};atual=novo;ctx.EST_TODAS['estadia-frida']=novo;return {committed:true,snapshot:{val:()=>novo}};}})}
  };
  vm.createContext(ctx);
  ['motivoQuatroPalavras','hospAssinarPorSenha','hospAssinarExclusaoPorSenha','hospExclusaoPatch','hospExcluirGravar'].forEach(n=>vm.runInContext(extrair(n),ctx));
  return {ctx,S,chamadas,get atual(){return atual},outro};
}
function assinaturaReal(){
  const pessoas={consultora:{nome:'Consultora Demonstração',role:'consultora'},monitor:{nome:'Monitor Demonstração',role:'monitor'},posto:{nome:'Recepção',role:'consultora'}};
  const ctx={SENHA_PROVISORIA_FRASE:'provisória',SENHA_SEM_BANCO_FRASE:'sem banco',senhaProvisoriaAinda:s=>s==='provisoria',senhaCodigoSemConferir:()=>false,
    senhaQuem:s=>pessoas[s]||null,orcQuemPelaSenha:()=>null,corrEhPosto:n=>n==='Recepção',corrPaginasDaPessoa:()=>[],corrQuemPode:()=>'',papelDoCorpo:()=>''};
  vm.createContext(ctx); vm.runInContext(extrairConst('PERM'),ctx); vm.runInContext(extrair('podePapel'),ctx); vm.runInContext(extrair('corrAssinar'),ctx); return ctx;
}
const registro={nome:'Demonstração Frida',tutor:'Demonstração Luciana',raca:'SRD',refKey:'frida-07',_ts:10,status:'ativa',entrada:'2026-10-07',saida:'2026-10-08',valor_cent:12000};
const aberto={refKey:'frida-07',_ts:10,status:'ativa'};
const motivo='lançamento duplicado não aconteceu hoje';
test('consultora anula somente a estadia escolhida, com rastro e sem cancelar orçamento',async()=>{
  const s=contexto(registro,aberto); const r=await s.ctx.hospExcluirGravar(motivo,'consultora-valida',{orcamento:'cancelar'});
  assert.equal(r.ok,true); assert.equal(s.atual.status,'cancelada'); assert.equal(s.atual.nome,'Demonstração Frida');
  assert.equal(s.outro.status,'ativa'); assert.equal(s.chamadas.rastro.length,1); assert.equal(s.chamadas.rastro[0].reg.quem,'Consultora Demonstração');
  assert.equal(s.chamadas.rastro[0].reg.orcamento,'manter'); assert.equal(s.chamadas.cancelouOrcamento,0);
  assert.equal(s.chamadas.cap.at(-1),'assinar-anulacao-hospedagem-engano');
});
test('senha inválida e prova de estadia bloqueiam antes da transação',async()=>{
  const semSenha=contexto(registro,aberto); const a=await semSenha.ctx.hospExcluirGravar(motivo,'senha-inválida',{orcamento:'manter'});
  assert.equal(a.ok,false); assert.equal(semSenha.chamadas.transacoes,0); assert.equal(semSenha.atual.status,'ativa');
  const comProva=contexto(registro,aberto,{provas:{bloqueia:true,provas:['Conferência concluída']}}); const b=await comProva.ctx.hospExcluirGravar(motivo,'consultora-valida',{orcamento:'manter'});
  assert.equal(b.ok,false); assert.equal(comProva.chamadas.transacoes,0); assert.equal(comProva.atual.status,'ativa');
});
test('refKey e _ts divergentes bloqueiam sem afetar homônimo',async()=>{
  for(const atual of [{...registro,_ts:11},{...registro,refKey:'frida-outra'}]){
    const s=contexto(atual,aberto); const r=await s.ctx.hospExcluirGravar(motivo,'consultora-valida',{orcamento:'manter'});
    assert.equal(r.ok,false); assert.match(r.erro,/conflito/); assert.equal(s.chamadas.transacoes,0); assert.equal(s.atual.status,'ativa'); assert.equal(s.outro.status,'ativa');
  }
});
test('mudança entre leitura e transação é recusada sem rastro',async()=>{
  const s=contexto(registro,aberto,{mudarNaTransacao:{_ts:11}}); const r=await s.ctx.hospExcluirGravar(motivo,'consultora-valida',{orcamento:'manter'});
  assert.equal(r.ok,false); assert.equal(s.chamadas.transacoes,1); assert.equal(s.chamadas.rastro.length,0); assert.equal(s.atual.status,'ativa');
});
test('segunda tentativa vê a anulação existente e não cria outro rastro',async()=>{
  const s=contexto(registro,aberto); assert.equal((await s.ctx.hospExcluirGravar(motivo,'consultora-valida',{orcamento:'manter'})).ok,true);
  s.S.passo='excluir'; s.S.gravando=false; s.S.provas={bloqueia:false}; s.S.e=JSON.parse(JSON.stringify(s.atual));
  const r=await s.ctx.hospExcluirGravar(motivo,'consultora-valida',{orcamento:'manter'});
  assert.equal(r.ok,false); assert.match(r.erro,/já foi excluída/); assert.equal(s.chamadas.rastro.length,1);
});
test('corrAssinar e PERM reais aceitam consultora só na anulação',()=>{
  const c=assinaturaReal();
  assert.equal(c.corrAssinar('consultora','assinar-anulacao-hospedagem-engano','anulação').ok,true);
  assert.equal(c.corrAssinar('consultora','assinar-correcao-hospedagem','correção').ok,false);
  assert.equal(c.corrAssinar('monitor','assinar-anulacao-hospedagem-engano','anulação').ok,false);
  assert.equal(c.corrAssinar('posto','assinar-anulacao-hospedagem-engano','anulação').ok,false);
  assert.equal(c.corrAssinar('provisoria','assinar-anulacao-hospedagem-engano','anulação').ok,false);
});
test('reabertura continua na assinatura genérica e gestão preserva cancelar orçamento',async()=>{
  assert.match(html,/capacidade:'assinar-correcao-hospedagem'.{0,180}botao:'Reabrir a hospedagem'/s);
  const s=contexto(registro,aberto); const r=await s.ctx.hospExcluirGravar(motivo,'gestao-valida',{orcamento:'cancelar'});
  assert.equal(r.ok,true); assert.equal(s.chamadas.rastro[0].reg.orcamento,'cancelar'); assert.equal(s.chamadas.cancelouOrcamento,1);
});