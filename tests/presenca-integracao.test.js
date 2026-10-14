'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const index=path.resolve(__dirname,'..','auaulandia','index.html');
const fonte=fs.readFileSync(index,'utf8');
function trecho(inicio,fim){const a=fonte.indexOf(inicio),b=fonte.indexOf(fim,a);assert.ok(a>=0&&b>a,inicio);return fonte.slice(a,b);}
const confirmar=trecho('  function presencaConfirmarFalta(k){','  function presencaImprimir(');
const imprimir=trecho('  function presencaImprimir(modo){','  function presencaAbrirChamada(');
const auto=trecho('  function aplicarFaltaAutomatica(){','  // O relógio passa sozinho:');
function esperar(){return new Promise(r=>setImmediate(r));}
function ctx(op){
 const avisos=[], chamadas=[], metas=[]; let atualizou=0;
 const c={console,Promise,Date,setTimeout,alert:m=>avisos.push(m),_logFalhaGrav:()=>{},
  ZeluzPresencaLogica:{agoraSP:()=>({dia:'2026-10-14'})},PO_PRESENCA_ATUAL:op.cache===false?null:{dia:'2026-10-14',itens:[{id:'id-1',estado:'falta-registrada-conferir'}]},
  dcDataKey:()=>op.diaLocal||'2026-10-14',podePapel:op.semPode?undefined:()=>op.pode!==false,quemSou:()=>op.quem===undefined?'Márcia Exemplo':op.quem,horaAgora:()=> '12:10',presencaAtualizar:()=>{atualizou++;},
  DB:{ref:p=>({once:()=>{chamadas.push(p);return Promise.resolve({val:()=>op.valor});},set:v=>{metas.push([p,v]);return op.rejeita?Promise.reject(new Error('falhou')):Promise.resolve();}})}};
 vm.createContext(c);new vm.Script(confirmar).runInContext(c);return {c,avisos,chamadas,metas,atualizacoes:()=>atualizou};
}
(async()=>{
 let x=ctx({valor:'faltou'});x.c.presencaConfirmarFalta('id-1');await esperar();await esperar();assert.equal(x.metas.length,1);assert.match(x.metas[0][0],/chamada-meta/);assert.equal(x.atualizacoes(),1,'só refresca depois do commit');
 x=ctx({valor:'faltou',rejeita:true});x.c.presencaConfirmarFalta('id-1');await esperar();await esperar();assert.equal(x.atualizacoes(),0,'rejeição não afirma sucesso');assert.match(x.avisos.join(' '),/continua a conferir/);
 x=ctx({valor:'veio'});x.c.presencaConfirmarFalta('id-1');await esperar();assert.equal(x.metas.length,0,'chegada concorrente não recebe nem reverte chamada');assert.equal(x.atualizacoes(),1);
 x=ctx({valor:'faltou',semPode:true});x.c.presencaConfirmarFalta('id-1');assert.equal(x.chamadas.length,0,'sem guard de papel falha fechada');
 x=ctx({valor:'faltou',quem:'-'});x.c.presencaConfirmarFalta('id-1');assert.equal(x.chamadas.length,0,'sessão sem indivíduo falha fechada');
 x=ctx({valor:'faltou',cache:false});x.c.presencaConfirmarFalta('id-1');assert.equal(x.chamadas.length,0,'cache indisponível não grava');
 let alerts=[],abriu=0;let c={PO_PRESENCA_ATUAL:{dia:'2026-10-13'},ZeluzPresencaLogica:{agoraSP:()=>({dia:'2026-10-14'}),impressaoHTML:()=>({ok:true,html:'x'})},Date,alert:m=>alerts.push(m),window:{open:()=>{abriu++;return null;}},setTimeout};vm.createContext(c);new vm.Script(imprimir).runInContext(c);c.presencaImprimir('dia');assert.equal(abriu,0);assert.match(alerts[0],/data do painel mudou/);
 alerts=[];abriu=0;c.PO_PRESENCA_ATUAL={dia:'2026-10-14'};c.presencaImprimir('dia');assert.equal(abriu,1);assert.match(alerts[0],/bloqueou/);
 let io=0;c={DB:{ref:()=>{io++;throw Error('IO');}},Promise};vm.createContext(c);new vm.Script(auto).runInContext(c);await c.aplicarFaltaAutomatica();assert.equal(io,0,'falta automática não faz IO');
 console.log('presenca-integracao.test.js: ok');
})().catch(e=>{console.error(e);process.exitCode=1;});
