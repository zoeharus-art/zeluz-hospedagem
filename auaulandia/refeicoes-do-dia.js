/* As três refeições do dia na ficha do hóspede — Adriana, 22/nov/2026:
   «Se dia do Day Care, as pessoas lançam no almoço do Day Care, e café... se plantonistas, elas têm o acesso,
   a informação chega no mesmo lugar: ficha dos hóspedes.»
   Núcleo puro: junta as marcas do café (auaulandia/cafe), do almoço do Day Care (daycare/almoco e o 2º horário),
   do almoço do plantão (auaulandia/almoco) e do jantar (auaulandia/jantar). Sem DOM, banco ou escrita. */
(function(root,factory){ var api=factory(); if(typeof module==='object'&&module.exports)module.exports=api; if(root)root.ZeluzRefeicoesDoDia=api; })(typeof globalThis!=='undefined'?globalThis:this,function(){
  var ESTADOS={tudo:1,metade:1,nao:1,naochegou:1,na:1};
  var TXT={tudo:'Comeu',metade:'Metade',nao:'Não comeu',naochegou:'Não chegou',na:'Não almoça hoje'};
  var CURTO={tudo:'ok',metade:'metade',nao:'não comeu',naochegou:'não chegou',na:'não almoça'};
  var ONDE={cafe:'no Café',plantao:'na tela da plantonista',daycare:'no Day Care'};
  var CLASSE={tudo:'ok',metade:'metade',nao:'nao',naochegou:'naochegou',na:'naochegou'};
  function s(v){ return typeof v==='string'?v.trim():''; }
  // A marca vem como texto ('tudo') no Day Care e como {estado,quem,hora} no café e no plantão.
  function marca(v){
    if(typeof v==='string') return ESTADOS[v]?{estado:v,quem:'',hora:''}:null;
    if(v&&typeof v==='object'&&ESTADOS[v.estado]) return {estado:v.estado,quem:s(v.quem),hora:s(v.hora)};
    return null;
  }
  // Almoço do Day Care: quem não comeu no 1º horário e comeu no 2º conta como comeu.
  function dayCare(v,v2){
    var m=marca(v), segundo=s(v2);
    if((!m||m.estado==='nao')&&segundo==='comeu') return {estado:'tudo',quem:'',hora:'',segundo:true};
    if(!m&&segundo==='na') return {estado:'na',quem:'',hora:'',segundo:true};
    return m;
  }
  function juntar(e){
    e=e||{};
    var c=marca(e.cafe); if(c) c.onde='cafe';
    var ap=marca(e.almocoPlantao), ad=dayCare(e.almocoDayCare,e.almoco2DayCare), a=null;
    // A marca da plantonista vale sobre a do Day Care (é a mais nova), mas a do Day Care não some.
    if(ap){ a=ap; a.onde='plantao'; if(ad) a.tambemDayCare=ad.estado; }
    else if(ad){ a=ad; a.onde='daycare'; }
    var j=marca(e.jantar); if(j) j.onde='plantao';
    return {cafe:c,almoco:a,jantar:j};
  }
  function feita(m){ return !!(m&&m.estado!=='naochegou'); }
  // Faixa do cartão. Vermelha só quando falta a refeição da vez (ou uma anterior a ela) ou alguém não comeu;
  // verde com as três feitas; dourada no resto (o jantar das 14h ainda não é falta).
  function faixa(r,turno){
    r=r||{};
    var partes=[['cafe','café'],['almoco','almoço'],['jantar','jantar']].map(function(x){ var m=r[x[0]]; return x[1]+' '+(m?CURTO[m.estado]:'falta'); });
    var daVez=(turno==='noturno')?['cafe','almoco','jantar']:['cafe','almoco'];
    var falta=daVez.some(function(k){ return !feita(r[k]); });
    var naoComeu=['cafe','almoco','jantar'].some(function(k){ return r[k]&&r[k].estado==='nao'; });
    var todas=['cafe','almoco','jantar'].every(function(k){ return feita(r[k]); });
    return {texto:'HOJE: '+partes.join(' · '), classe:(falta||naoComeu)?'falta':(todas?'ok':'')};
  }
  function texto(m){ return m?TXT[m.estado]:'Ainda não marcado'; }
  function classe(m){ return m?CLASSE[m.estado]:'vazio'; }
  function onde(m){ return m?(ONDE[m.onde]||''):''; }
  return {marca:marca,dayCare:dayCare,juntar:juntar,faixa:faixa,texto:texto,classe:classe,onde:onde,feita:feita,TXT:TXT};
});
