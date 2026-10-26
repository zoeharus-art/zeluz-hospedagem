'use strict';
// Fluxo literal: clique -> repositório real -> ACK -> memória fria -> cartão/texto.
// Dados inteiramente sintéticos, sem navegador/rede/Firebase.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.resolve(__dirname,'../auaulandia/index.html'),'utf8');
function script(attr){const m=html.match(new RegExp('<script[^>]*'+attr+'[^>]*>([\\s\\S]*?)<\\/script>'));assert.ok(m,attr);return m[1];}
const ctx={Buffer,Intl,Date,JSON,Object,Array,Number,String,RegExp,Error,Promise,TextEncoder,Uint8Array,setTimeout,clearTimeout};ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);vm.runInContext(script('data-resposta88="core"'),ctx);vm.runInContext(script('data-resposta88="repositorio"'),ctx);vm.runInContext(script('id="zelozinha-tela94-puro"'),ctx);
const Core=ctx.ZeluzResposta88,day='2026-10-26',dc='aluno-sintetico__familia-sintetica',pk='aluno-sintetico',petId=pk,tutorId=dc;
const key=JSON.stringify([petId,tutorId,'ecto','2026-10-24','ecto_p']),groupKey=JSON.stringify([petId,tutorId,day]),sha='a'.repeat(64);
const cy={cycleKey:key,itemK:'ecto_p',tipo:'ecto',care:'ecto',nome:'Cuidado sintético',dueDate:'2026-10-24',elegivel:true,aberto:true};
const session={confirmada:true,humana:true,id:'pessoa-139',nome:'Pessoa Sintética',papel:'recepcao',assinatura:'sessao-sintetica'};
const destino={confirmado:true,dia:day,dcKey:dc,pelKey:pk,petId,tutorId,escopoHistoricoSha:sha,presencaCorporal:true,presencaHistorica:true,checkout:false,ciclos:[cy]};
const grupo={groupKey,petId,tutorId,textoSha:sha,textoEnviado:'Mensagem sintética',messageId:'msg-sintetica',statusPainel:'entrega_pendente',acompanhamentoHumanoPendente:true,textoDisponivel:true,cycleKeys:[key],itemKs:['ecto_p']};
const painel={versao:81,detalhesEnvioVersao:104,dia:day,assinaturaConteudo:sha,identidadesPets:{[petId]:{petId,tutorRefId:tutorId,dcKeyAtual:dc,pelKeyAtual:pk}},grupos:[grupo],cuidadosDia:{itens:{sintetico:{petId,tutorId,cycleKey:key,itemK:'ecto_p',statusPainel:'envio_registrado_entrega_pendente'}}}};
const memory=new Map(),writes=[];let failRead=false,failWrite=false;
const db={ref:p=>({once:async()=>{if(failRead)throw Error('leitura sintética recusada');return{val:()=>structuredClone(memory.get(p)||null)};},transaction:async fn=>{const old=structuredClone(memory.get(p)||null),next=fn(old);if(next===undefined||failWrite)return{committed:false,snapshot:{val:()=>old}};memory.set(p,structuredClone(next));writes.push(p);return{committed:true,snapshot:{val:()=>structuredClone(next)}};}})};
const repo=ctx.ZeluzResposta88RTDB.criar({db,lerPainel:async()=>painel,resolverAtual:async()=>structuredClone(destino),sessaoHumana:async()=>session,assinarTexto:()=>sha,agora:()=> '2026-10-26T13:20:00.000Z'});
const uiSource=script('id="zelozinha-contatos89-ui"'),tail=uiSource.indexOf('  var baseAtualizar=window.zPainel44Atualizar;');assert.ok(tail>0);
ctx.DB=db;ctx.VENC_PEND=null;ctx.document={querySelectorAll:()=>[],querySelector:()=>null};
// Somente serviços de DOM/tarefa são substituídos. Funções de resposta/cache/textos permanecem literais.
const exportUI=`
  redesenharLinha=function(){};trazerLinhasFaltando=async function(){};publicarHumanos=function(){};
  window.__ui139={estado:estado,normalizar:normalizar,lerRegistro:lerRegistro,respostaAtual:respostaAtual,gravarRespostas:gravarRespostas,vmCuidado:vmCuidado,caixasDe:caixasDe,horaDe:horaDe,aoClicar:aoClicar,copiaHTML:copiaHTML,classificacao117:classificacao117,cuidadoFila117:cuidadoFila117};
})();`;
vm.runInContext(uiSource.slice(0,tail)+exportUI,ctx);
const ui=ctx.__ui139,card={dia:day,dcKey:dc,pelKey:pk,petId,tutorId,groupKey:'contato-sintetico',row:{p:{n:'FILHOt Sintético',tutor:'Família Sintética'}},cadastro:{tutor:'Família Sintética'},ciclos:[cy],envios:[{grupo}]};
ui.estado.itens[dc]=card;ui.estado.resultado={dia:day,itens:[card]};ui.estado.dia=day;ui.estado.projecao=painel;
const appSource=script('data-resposta88="app"');const a=appSource.indexOf('  async function registrar(groupKey,itens,op){'),b=appSource.indexOf('\n  function no(',a);assert.ok(a>0&&b>a);
const textoA=appSource.indexOf('  var TEXTO_EM_CASA='),textoB=appSource.indexOf('\n  function mensagemAprovada(',textoA);assert.ok(textoB>textoA);
let seq=0;ctx.__repo139=repo;ctx.__resolve139=async()=>structuredClone(destino);ctx.__next139=()=> 'resposta-sintetica-'+(++seq);ctx.__material139=async()=>({ok:true});
vm.runInContext(`window.__bridge139=(function(){var estado={cache:null};function t(v){return typeof v==='string'?v.trim():'';}function cp(v){return v==null?v:JSON.parse(JSON.stringify(v));}function snap(s){return s.val();}function repo(){return window.__repo139;}async function idResposta(){return window.__next139();}async function resolverGrupo(){return window.__resolve139();}async function resolverContatoHumano(){return window.__resolve139();}async function materializar(){return window.__material139();}${appSource.slice(a,b)}${appSource.slice(textoA,textoB)}return{registrar:registrar,textoEmCasa:textoEmCasa,textoTutorJaFez:textoTutorJaFez};})();`,ctx);
ctx.ZeluzRespostaApp88=ctx.__bridge139;
(async()=>{
  const input={cycleKey:key,itemK:'ecto_p',decisao:'autorizar',origem:'externo',onde:'',baseRevision:-1};
  const saved=await repo.decidir({groupKey,petId,resposta:{id:'primeira-sintetica',itens:[input]}});assert.equal(saved.ok,true);
  const loaded=await ui.lerRegistro(card);
  assert.ok(loaded,'releitura de registro com memória inicialmente null precisa funcionar');
  assert.equal(ctx.VENC_PEND,null,'leitura de um cartão não declara o histórico inteiro carregado');
  assert.equal(ui.respostaAtual(card,cy).humanoNome,session.nome);
  assert.equal(ui.horaDe(ui.respostaAtual(card,cy)),'10:20');
  assert.notEqual(ui.horaDe(null),'21:00','ausência de timestamp não vira 21h');
  for(const ts of [null,'',undefined,'inválido',0])assert.equal(ui.horaDe({ts}),'hora não registrada','horário ausente não é fabricado');
  const boxes=ui.caixasDe(card,[ui.vmCuidado(card,cy)]);assert.equal(boxes.length,1);assert.match(boxes[0].texto,/data e o produto usado/);assert.match(boxes[0].texto,/todos os nossos Aulunos/);
  ctx.VENC_PEND=null;ui.estado.registros139={};
  const repeated=await ctx.__bridge139.registrar(groupKey,[{...input,baseRevision:0}],{petId,semAtualizarPainel:true});
  assert.equal(repeated.ok,true);assert.ok(repeated.alvoConfirmado88,'o ACK devolve destino confirmado sem depender de cache de grupo');
  assert.ok(repeated.registro.respostasEscopo49,'ponte devolve o registro confirmado ao controlador');
  assert.equal(ctx.VENC_PEND,null,'ACK não fabrica completude histórica');
  ui.normalizar(Object.assign({},card,{registroRespostas139:repeated.registro}));
  assert.ok(ui.respostaAtual(card,cy),'o cartão usa somente sua leitura pontual confirmada');
  assert.equal(writes.length,1,'repetição não duplica a resposta');
  const campo={value:'2026-10-24'},care={querySelector:selector=>selector==='[data-zt694-data-fez]'?campo:null,getAttribute:()=> '0'};
  const article={getAttribute:()=>encodeURIComponent(dc)};
  const button={disabled:false,getAttribute:name=>name==='data-zt694-acao'?'tutor-fez':name==='data-zt694-ciclo'?'0':'',closest:selector=>selector==='[data-zt694-acao]'?button:selector==='[data-zt694-care]'?care:selector==='[data-zt694-pet]'?article:null};
  const click=()=>ui.aoClicar({target:button,preventDefault(){},stopPropagation(){}});
  async function settle(){for(let i=0;i<60;i++){await new Promise(setImmediate);if(!ui.estado.salvando[dc])return;}throw Error('clique não encerrou');}
  const beforeClick=writes.length;click();click();await settle();assert.equal(writes.length,beforeClick+1,'duplo clique registra uma resposta só');
  const atual=ui.respostaAtual(card,cy);assert.ok(atual.confirmacaoTutor137,'clique real Tutor já fez grava a data');
  assert.equal(atual.confirmacaoTutor137.dataAplicacao,'2026-10-24');
  assert.equal(ui.caixasDe(card,[ui.vmCuidado(card,cy)])[0].tipo,'tutor-fez','agradecimento aparece no próprio cartão');
  assert.match(ui.caixasDe(card,[ui.vmCuidado(card,cy)])[0].texto,/24\/10\/2026/);
  ui.estado.fixosResolver={};assert.equal(ui.classificacao117().paraResolver.length,1,'resposta externa não some ao atualizar enquanto o cuidado ainda está aberto');
  assert.equal(ctx.ZelozinhaTela94.classificarFilas117([{dcKey:dc,cuidados:[{respostaSalva:true,linhaObrigatoria:true,linhaConfirmada:true,cuidadoEmAberto:true}]}]).paraResolver.length,1,'encaminhar uma tarefa ainda não aplicada não conclui o cuidado');
  const before=writes.length;failWrite=true;campo.value='2026-10-23';click();await settle();failWrite=false;
  assert.equal(writes.length,before,'gravação recusada não altera a ficha/resposta');
  assert.equal(ui.respostaAtual(card,cy).confirmacaoTutor137.dataAplicacao,'2026-10-24','data confirmada anterior não é trocada por otimismo');
  assert.match(ui.estado.msgs[dc],/Não foi possível salvar/,'recusa dá retorno visível');
  const markup=ui.copiaHTML(card,[ui.vmCuidado(card,cy)]);assert.match(markup,/Copiar mensagem/);assert.doesNotMatch(markup,/Abrir no WhatsApp/);
  const confirmado=ui.respostaAtual(card,cy);failRead=true;assert.equal(await ui.lerRegistro(card),null);failRead=false;
  assert.equal(ui.respostaAtual(card,cy),confirmado,'erro de releitura não apaga um ACK confirmado');assert.equal(ctx.VENC_PEND,null);
  console.log('respostas139: clique real, repositório/ponte/ACK com memória fria, texto e agradecimento, horário SP, permanência e falha visível passaram.');
})().catch(e=>{console.error(e.message);process.exitCode=1;});
