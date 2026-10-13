'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(process.env.ZELUZ_AUTORIA_INDEX||path.resolve(__dirname,'../auaulandia/index.html'),'utf8');
function trecho(nome){
  const ini=html.indexOf('  function '+nome+'(){');
  assert(ini>=0,nome+' existe');const fim=html.indexOf('\n  }\n',ini);
  assert(fim>ini,nome+' tem limite explícito');return html.slice(ini,fim+5);
}
async function drenar(){for(let i=0;i<8;i++)await Promise.resolve();}
function preparar(tipo){
  const pendentes=[];
  function promessa(){
    let resolve,reject;const p=new Promise((a,b)=>{resolve=a;reject=b;});
    pendentes.push({resolve,reject,p});return p;
  }
  const original={nome:'Hóspede Alfa'},originalConf={pertences:{p:{etiquetado:true}},fotos:['foto sintética']};
  const campos={'co-status':{style:{},textContent:''},'cf-status':{style:{},textContent:''},coObs:{value:'Observação Alfa'},cfAssina:{value:'Monitor Alfa'}};
  const calls={gravacoes:[],audits:[],alertas:[],render:0,voltar:0};
  const db={ref:destino=>({set:dados=>{calls.gravacoes.push({destino,dados});return promessa();},update:dados=>{calls.gravacoes.push({destino,dados});return promessa();}})};
  const ctx={Promise,Date,DB:db,coEstadia:original,coEstadiaId:'alfa',coHosp:{nome:'Hóspede Alfa'},coConf:{p:true},
    cfEstadia:original,cfEstadiaId:'alfa',cfHosp:{nome:'Hóspede Alfa'},cfConf:originalConf,
    document:{getElementById:id=>campos[id]},quemSou:()=> 'Monitor Alfa',coItensLista:()=>[{k:'p',label:'Bolsa'}],
    cfPendencias:()=>[],renderCfGate(){},audit:(...args)=>calls.audits.push(args),
    zAlertao:(...args)=>calls.alertas.push(args),coRenderEtapa:()=>{calls.render++;},coVoltar:()=>{calls.voltar++;}};
  const nome=tipo==='bolsa'?'coFecharEtapa1':'cfFecharConferencia';
  vm.runInNewContext(trecho(nome),ctx);
  return {ctx,original,originalConf,campos,calls,pendentes,
    resolve:(i=0)=>pendentes[i].resolve(),reject:(erro,i=0)=>pendentes[i].reject(erro),iniciar:()=>ctx[nome]()};
}
test('bolsa: a conferência enviada não muda quando marcas da tela mudam',()=>{
  const s=preparar('bolsa');s.iniciar();s.ctx.coConf.p=false;
  assert.equal(s.calls.gravacoes[0].dados.conferido.p,true);
  assert.equal(s.calls.gravacoes[0].destino,'auaulandia/estadias/alfa/checkout_etapa1');
  assert.equal(s.calls.gravacoes[0].dados.quem,'Monitor Alfa');
});
test('bolsa: resposta tardia não monta bolsa de outra estadia nem fecha sua ficha',async()=>{
  const s=preparar('bolsa');s.iniciar();const outra={nome:'Hóspede Beta'};
  s.ctx.coEstadia=outra;s.ctx.coEstadiaId='beta';s.ctx.coHosp={nome:'Hóspede Beta'};
  s.campos['co-status'].textContent='Ficha Beta';s.resolve();await drenar();
  assert.equal(outra.checkout_etapa1,undefined);assert.equal(s.original.checkout_etapa1,s.calls.gravacoes[0].dados);
  assert.equal(s.calls.audits[0][2].pet,'Hóspede Alfa');assert.equal(s.calls.alertas.length,0);
  assert.equal(s.calls.render,0);assert.equal(s.calls.voltar,0);assert.equal(s.campos['co-status'].textContent,'Ficha Beta');
});
test('bolsa: confirmação na mesma ficha funciona e fechamento posterior respeita troca',async()=>{
  const s=preparar('bolsa');s.iniciar();s.resolve();await drenar();assert.equal(s.calls.alertas.length,1);
  assert.match(s.calls.alertas[0][1][0],/Hóspede Alfa/);
  s.ctx.coEstadia={nome:'Beta'};s.ctx.coEstadiaId='beta';s.calls.alertas[0][2].aoFechar();
  assert.equal(s.calls.render,0);assert.equal(s.calls.voltar,0);
});
test('bolsa: falha não inventa conclusão e não altera status de uma ficha nova',async()=>{
  const s=preparar('bolsa');s.iniciar();s.ctx.coEstadia={nome:'Beta'};s.ctx.coEstadiaId='beta';s.campos['co-status'].textContent='Ficha Beta';
  s.reject(new Error('falha Alfa'));await drenar();assert.equal(s.original.checkout_etapa1,undefined);
  assert.equal(s.calls.audits.length,0);assert.equal(s.calls.alertas.length,0);assert.equal(s.campos['co-status'].textContent,'Ficha Beta');
});
test('conferência: resposta tardia não conclui a nova ficha e audita a estadia original',async()=>{
  const s=preparar('conferencia');s.iniciar();const outra={nome:'Hóspede Beta'},outroConf={concluida:false};
  s.ctx.cfEstadia=outra;s.ctx.cfEstadiaId='beta';s.ctx.cfHosp={nome:'Hóspede Beta'};s.ctx.cfConf=outroConf;s.campos['cf-status'].textContent='Ficha Beta';
  s.resolve();await drenar();assert.equal(s.ctx.cfConf,outroConf);assert.equal(outroConf.concluida,false);assert.equal(outra.conferencia,undefined);
  assert.equal(s.calls.gravacoes[0].destino,'auaulandia/estadias/alfa/conferencia');
  assert.equal(s.calls.audits[0][1],'alfa');assert.equal(s.calls.audits[0][2].pet,'Hóspede Alfa');assert.equal(s.calls.audits[0][2].quem,'Monitor Alfa');
  assert.equal(s.campos['cf-status'].textContent,'Ficha Beta');
});
test('conferência: sucesso na mesma ficha preserva itens e informa autoria',async()=>{
  const s=preparar('conferencia');s.iniciar();s.resolve();await drenar();
  assert.equal(s.ctx.cfConf.concluida,true);assert.equal(s.ctx.cfConf.concluida_por,'Monitor Alfa');
  assert.equal(s.ctx.cfConf.pertences.p.etiquetado,true);assert.match(s.campos['cf-status'].textContent,/Monitor Alfa/);
});
test('conferência: falha preserva os registros e o status da ficha nova',async()=>{
  const s=preparar('conferencia');s.iniciar();const outroConf={concluida:false};s.ctx.cfEstadiaId='beta';s.ctx.cfEstadia={nome:'Beta'};s.ctx.cfConf=outroConf;s.campos['cf-status'].textContent='Ficha Beta';
  s.reject(new Error('falha Alfa'));await drenar();assert.equal(s.originalConf.concluida,undefined);assert.equal(s.ctx.cfConf,outroConf);assert.equal(s.calls.audits.length,0);
  assert.equal(s.campos['cf-status'].textContent,'Ficha Beta');
});
function trocarParaBeta(s,tipo){
  const beta={nome:'Hóspede Beta'};
  if(tipo==='bolsa'){
    s.ctx.coEstadia=beta;s.ctx.coEstadiaId='beta';s.ctx.coHosp={nome:'Hóspede Beta'};s.ctx.coConf={p:true};
  }else{
    s.ctx.cfEstadia=beta;s.ctx.cfEstadiaId='beta';s.ctx.cfHosp={nome:'Hóspede Beta'};s.ctx.cfConf={pertences:{p:{etiquetado:true}}};
  }
}
test('bolsa: duplo toque da mesma ficha reaproveita a promessa e confirma uma vez',async()=>{
  const s=preparar('bolsa'),a=s.iniciar(),b=s.iniciar();
  assert.equal(a,b);assert.equal(s.calls.gravacoes.length,1);
  s.resolve();await drenar();assert.equal(s.calls.audits.length,1);assert.equal(s.calls.alertas.length,1);
});
test('conferência: duplo toque da mesma ficha reaproveita a promessa e audita uma vez',async()=>{
  const s=preparar('conferencia'),a=s.iniciar(),b=s.iniciar();
  assert.equal(a,b);assert.equal(s.calls.gravacoes.length,1);
  s.resolve();await drenar();assert.equal(s.calls.audits.length,1);assert.match(s.campos['cf-status'].textContent,/Monitor Alfa/);
});
test('bolsa: falha libera a trava para nova tentativa da mesma ficha',async()=>{
  const s=preparar('bolsa');s.iniciar();s.reject(new Error('falha Alfa'));await drenar();
  s.iniciar();assert.equal(s.calls.gravacoes.length,2);s.resolve(1);await drenar();assert.equal(s.calls.alertas.length,1);
});
test('conferência: falha libera a trava para nova tentativa da mesma ficha',async()=>{
  const s=preparar('conferencia');s.iniciar();s.reject(new Error('falha Alfa'));await drenar();
  s.iniciar();assert.equal(s.calls.gravacoes.length,2);s.resolve(1);await drenar();assert.equal(s.calls.audits.length,1);
});
test('bolsa: outra ficha pode gravar enquanto a primeira está pendente',async()=>{
  const s=preparar('bolsa');s.iniciar();trocarParaBeta(s,'bolsa');s.iniciar();
  assert.deepEqual(s.calls.gravacoes.map(g=>g.destino),['auaulandia/estadias/alfa/checkout_etapa1','auaulandia/estadias/beta/checkout_etapa1']);
  s.resolve(0);s.resolve(1);await drenar();assert.equal(s.calls.audits.length,2);
});
test('conferência: outra ficha pode gravar enquanto a primeira está pendente',async()=>{
  const s=preparar('conferencia');s.iniciar();trocarParaBeta(s,'conferencia');s.iniciar();
  assert.deepEqual(s.calls.gravacoes.map(g=>g.destino),['auaulandia/estadias/alfa/conferencia','auaulandia/estadias/beta/conferencia']);
  s.resolve(0);s.resolve(1);await drenar();assert.equal(s.calls.audits.length,2);
});
