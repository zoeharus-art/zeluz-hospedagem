'use strict';
// A frente 131 substitui a entrada completa da 130 pela Agenda Márcia dedicada.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'../auaulandia/index.html'),'utf8');
function funcao(nome){const a=html.indexOf('function '+nome+'(');assert(a>=0);const b=html.indexOf('\n  function ',a+10);return html.slice(a,b<0?html.length:b);}
['dashEscolher','dashDetFalta','dashForaFalta','dashForaPainelHTML','dashPainelHTML','dashLancar'].forEach(n=>new vm.Script(funcao(n)));
assert(!html.includes('function dashAvaliacaoPainelHTML('),'formulário completo sai do diário');
assert(!funcao('dashLancar').includes('__det.avaliacao129='),'diário não abre segunda fonte de dados');
assert(html.includes('data-v="agendamarcia"'),'rota dedicada existe');
assert(html.includes('id="v-agendamarcia"'),'raiz dedicada existe');
assert(funcao('dashLancar').includes("DB.ref('daycare/dashboard/'+__diaLanc+'/'+k).push()"),'entrada nativa original preservada');
console.log('marcia-agendamento130: diário resumido preservado (131)');
