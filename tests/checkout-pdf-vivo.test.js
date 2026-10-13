'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const src=fs.readFileSync(path.resolve(__dirname,'..','auaulandia','index.html'),'utf8');
const a=src.indexOf('  function coAssinaturaSaidaJpeg('),b=src.indexOf('\n  /* ====================================================================================',a);
assert(a>0&&b>a,'bloco PDF vivo não localizado');
function rodar(est,opt){
  opt=opt||{}; let baixados=[],alertas=[],fontes=[]; const campos={
    'co-status':{style:{},textContent:''},coSemTutor:{checked:!!opt.semTutor},coAssinaNome:{value:opt.nome||''},coObs:{value:opt.obs||''}
  };
  class Img{constructor(){this.width=this.height=this.naturalWidth=this.naturalHeight=10;} set src(v){fontes.push(v); if(opt.trocar) setTimeout(()=>{ctx.coEstadia={nome:'Outra'};ctx.coEstadiaId='outra';this.onload&&this.onload()},0); else queueMicrotask(()=>{if(this.onload)this.onload();});}}
  const ctx={Promise,Blob,Uint8Array,Image:Img,atob:s=>Buffer.from(s,'base64').toString('binary'),setTimeout,clearTimeout,console,
    coEstadia:est,coEstadiaId:'id-1',coConf:opt.conf||{},CO_SIG:{dataURL:()=>opt.sig||''},coEtapaDe:e=>(e.checkout_etapa1&&e.checkout_etapa1.ts)?2:1,
    coItensLista:()=>[{k:'p',label:'Bolsa'}],ciBRdata:x=>x,ciHoje:()=> '2026-10-13',ciBaixarBlob:(blob,n)=>{baixados.push({blob,n});return true},
    zPdfDocBlob:(doc,opts)=>{ctx.doc=doc;ctx.opts=opts;return new Blob(['pdf'])},zAlertao:(...x)=>alertas.push(x),
    document:{getElementById:id=>campos[id]||null,createElement:()=>({width:0,height:0,getContext:()=>({fillStyle:'',fillRect(){},drawImage(){}}),toDataURL:()=> 'data:image/jpeg;base64,QUJD'})},
    File:function(parts,name,opts){this.parts=parts;this.name=name;this.type=opts.type;},navigator:opt.navigator||{canShare:()=>false},window:{}};
  vm.runInNewContext(src.slice(a,b),ctx); return {ctx,baixados,alertas,fontes,campos};
}
async function t(){
  let x=rodar({nome:'P',tutor:'T',saida:'2026-10-13',assinatura:'data:image/jpeg;base64,RU5UUkFEQQ=='},{sig:'data:image/png;base64,UFJFVklB'}); await x.ctx.coGerarPDF(); assert.equal(x.baixados.length,1); assert.match(x.ctx.doc.titulo,/Rascunho/); assert.equal(x.fontes.length,0,'etapa 3 não usa assinatura');
  x=rodar({nome:'P',checkout_etapa1:{quem:'M',ts:1}},{sig:'data:image/png;base64,UFJFVklB',nome:'Tutor'}); await x.ctx.coGerarPDF(); assert.equal(x.baixados.length,1); assert(x.ctx.opts.assinatura,'etapa 4 desenhada pode ilustrar rascunho'); assert.match(x.ctx.doc.titulo,/Rascunho/);
  const f={nome:'P',assinatura:'data:image/jpeg;base64,RU5UUkFEQQ==',checkout:{quem:'C',ts:2,assinado_por:'Tutor',assinatura:'data:image/png;base64,U0FJREE=',conferido:{p:true}}}; x=rodar(f); await x.ctx.coGerarPDF(); assert.equal(x.fontes[0],f.checkout.assinatura); assert.equal(x.ctx.opts.assinaNome,'Tutor'); assert.match(x.ctx.doc.titulo,/Comprovante/);
  const s=JSON.parse(JSON.stringify(f));s.checkout.semTutor=true;x=rodar(s);await x.ctx.coGerarPDF();assert.equal(x.fontes.length,0);assert.equal(x.ctx.opts.assinatura,null);
  const ruim=JSON.parse(JSON.stringify(f));ruim.checkout.assinatura='data:image/svg+xml;base64,PHN2Zz4=';x=rodar(ruim);await x.ctx.coGerarPDF();assert.equal(x.baixados.length,0);assert.match(x.campos['co-status'].textContent,/assinatura/i);
  x=rodar(f,{trocar:true});await x.ctx.coGerarPDF();assert.equal(x.baixados.length,0,'troca durante await cancela download');assert.match(x.campos['co-status'].textContent,/estadia mudou/,'o cancelamento é por troca de ficha, não por uma imagem inválida');
  x=rodar({nome:'P'});await x.ctx.coEnviarWhats();assert.equal(x.alertas.length,1,'sem checkout não envia rascunho');
  let shares=0; x=rodar(f,{navigator:{canShare:()=>true,share:async()=>{shares++;}}});await x.ctx.coEnviarWhats();assert.equal(shares,1);assert.equal(x.baixados.length,0,'Web Share bem-sucedido não baixa fallback');
  x=rodar(f,{navigator:{canShare:()=>true,share:async()=>{let e=new Error('cancelou');e.name='AbortError';throw e;}}});await x.ctx.coEnviarWhats();assert.equal(x.baixados.length,0,'cancelamento não baixa nem acusa envio');
  x=rodar(f,{navigator:{canShare:()=>true,share:async()=>{throw new Error('falhou');}}});await x.ctx.coEnviarWhats();assert.equal(x.baixados.length,1,'falha do share baixa para anexação manual');
  x=rodar(f,{navigator:{canShare:()=>false}});await x.ctx.coEnviarWhats();assert.equal(x.baixados.length,1,'sem suporte a arquivo baixa PDF');
  x=rodar({nome:'P',checkout:'inválido'});await x.ctx.coEnviarWhats();assert.equal(x.alertas.length,1);assert.equal(x.baixados.length,0,'checkout inválido não libera comprovante');
  await testarFinalizacao();
  console.log('PDF vivo: rascunhos, assinatura, troca, Web Share/fallback e execução de salvamento assíncrono passaram.');
}

function prepararFinalizacao(){
  const inicio=src.indexOf('  function coFinalizar(){'),fim=src.indexOf('  function coResumoTexto(){',inicio);
  assert(inicio>0&&fim>inicio);
  let resolver,rejeitar;
  const pendente=new Promise((resolve,reject)=>{resolver=resolve;rejeitar=reject;});
  const chamadas={updates:[],pontos:[],audits:[],timers:[],voltar:0,agenda:0};
  const original={nome:'Hóspede Alfa',status:'hospedado',checkout_etapa1:{quem:'Monitor Alfa',ts:1}};
  const campos={'co-status':{style:{},textContent:''},coSemTutor:{checked:false},coAssinaNome:{value:'Tutor Alfa'},coObs:{value:'Observação salva'}};
  const ctx={console,Promise,Date,coEstadia:original,coEstadiaId:'alfa',coHosp:{nome:'Hóspede Alfa'},coConf:{p:true},CO_FALTOU:{p:true},
    CO_SIG:{dataURL:()=> 'data:image/png;base64,U0FJREE='},coEtapaDe:()=>2,coItensLista:()=>[{k:'p',label:'Pertence Alfa'}],
    quemSou:()=> 'Consultora Alfa',coPontosDe:n=>n?5:10,coMesDoTs:ts=>'mes-'+ts,
    document:{getElementById:id=>campos[id]},zAlertao:()=>assert.fail('Dados completos não devem abrir alerta'),
    DB:{ref:caminho=>({update:dados=>{chamadas.updates.push({caminho,dados});return pendente;}})},
    coPontoLancar:(mes,id,dados)=>{chamadas.pontos.push({mes,id,dados});return Promise.resolve({ja:false});},
    audit:(...args)=>chamadas.audits.push(args),_logFalhaGrav:()=>assert.fail('Pontuação simulada não falha'),
    carregarAgendaMedTodos:()=>{chamadas.agenda++;},coVoltar:()=>{chamadas.voltar++;},setTimeout:fn=>{chamadas.timers.push(fn);}
  };
  vm.runInNewContext(src.slice(inicio,fim),ctx);
  return {ctx,original,campos,chamadas,resolver,rejeitar};
}
async function esvaziarFila(){for(let i=0;i<8;i++) await Promise.resolve();}
async function testarFinalizacao(){
  let s=prepararFinalizacao();s.ctx.coFinalizar();
  assert.equal(s.chamadas.updates.length,1);assert.equal(s.original.checkout,undefined,'antes da resposta não inventa saída salva');
  s.rejeitar(new Error('falha simulada'));await esvaziarFila();
  assert.equal(s.original.checkout,undefined);assert.equal(s.original.status,'hospedado');assert.equal(s.chamadas.pontos.length,0);
  assert.match(s.campos['co-status'].textContent,/falha simulada/);

  s=prepararFinalizacao();s.ctx.coFinalizar();const registro=s.chamadas.updates[0].dados.checkout;
  s.ctx.coConf.p=false;
  assert.equal(registro.conferido.p,true,'marcas enviadas são cópia, não objeto editável da ficha');
  const outra={nome:'Hóspede Beta',status:'hospedado'}, faltas={outro:true};
  s.ctx.coEstadia=outra;s.ctx.coEstadiaId='beta';s.ctx.coHosp={nome:'Hóspede Beta'};s.ctx.CO_FALTOU=faltas;s.ctx.quemSou=()=> 'Outra pessoa';
  s.campos['co-status'].textContent='Status da ficha Beta';
  s.resolver();await esvaziarFila();
  assert.equal(s.original.checkout,registro);assert.equal(s.original.status,'finalizada');assert.equal(outra.checkout,undefined);assert.equal(outra.status,'hospedado');
  assert.equal(s.chamadas.updates[0].caminho,'auaulandia/estadias/alfa');
  assert.equal(s.chamadas.pontos.length,1);const ponto=s.chamadas.pontos[0];
  assert.equal(ponto.id,'alfa');assert.equal(ponto.dados.estadia,'alfa');assert.equal(ponto.dados.pet,'Hóspede Alfa');
  assert.equal(ponto.dados.quem,'Monitor Alfa');assert.equal(ponto.dados.conferido_por,'Consultora Alfa');assert.equal(ponto.dados.ts,registro.ts);assert.equal(ponto.mes,'mes-'+registro.ts);
  assert.equal(s.campos['co-status'].textContent,'Status da ficha Beta');assert.equal(s.ctx.CO_FALTOU,faltas);assert.equal(s.chamadas.timers.length,0);assert.equal(s.chamadas.agenda,0);
  assert(s.chamadas.audits.every(a=>a[2].pet==='Hóspede Alfa'));

  s=prepararFinalizacao();s.ctx.coFinalizar();s.resolver();await esvaziarFila();
  assert.match(s.campos['co-status'].textContent,/Check-out finalizado/);assert.equal(s.chamadas.agenda,1);assert.equal(s.chamadas.timers.length,1);
  s.ctx.coEstadia={nome:'Outra ficha'};s.ctx.coEstadiaId='outra';s.chamadas.timers[0]();assert.equal(s.chamadas.voltar,0,'troca durante atraso não fecha ficha nova');

  s=prepararFinalizacao();s.ctx.coFinalizar();s.ctx.coEstadia={nome:'Outra ficha'};s.ctx.coEstadiaId='outra';s.campos['co-status'].textContent='Nova ficha';
  s.rejeitar(new Error('falha da ficha antiga'));await esvaziarFila();assert.equal(s.campos['co-status'].textContent,'Nova ficha');assert.equal(s.original.checkout,undefined);
}
t().catch(e=>{console.error(e.stack||e);process.exit(1)});
