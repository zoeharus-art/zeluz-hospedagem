/* Mudar o dia e a hora de um banho nos Lançamentos do dia — Adriana, 23/nov/2026:
   «O banho estava marcado para hoje e está na planilha, não estou conseguindo alterar ele para amanhã. [...] Não
   podemos ter uma trabalheira pra alterar uma data de saída, ou um horário de banho.» Maquete aprovada em 23/nov.
   Núcleo puro: as opções de dia, a régua, a trava de repetido no dia novo e o registro do banho que muda de dia
   (com a origem guardada). Sem DOM, banco ou escrita. */
(function(root,factory){ var api=factory(); if(typeof module==='object'&&module.exports)module.exports=api; if(root)root.ZeluzMudarBanho=api; })(typeof globalThis!=='undefined'?globalThis:this,function(){
  var ISO=/^\d{4}-\d{2}-\d{2}$/, HORA=/^([01]\d|2[0-3]):[0-5]\d$/;
  var SEMANA=['domingo','segunda','terça','quarta','quinta','sexta','sábado'];
  var HORAS=['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30'];
  function s(v){ return v==null?'':String(v).trim(); }
  function iso(v){ v=s(v); return ISO.test(v)?v:''; }
  function hora(v){ v=s(v); return HORA.test(v)?v:''; }
  function data(i){ var p=i.split('-'); return new Date(Date.UTC(+p[0], +p[1]-1, +p[2], 12)); }
  function maisDias(i, n){ var d=data(i); d.setUTCDate(d.getUTCDate()+n); return d.toISOString().slice(0,10); }
  function br(i){ i=iso(i); return i?(i.slice(8,10)+'/'+i.slice(5,7)):''; }
  function semana(i){ i=iso(i); return i?SEMANA[data(i).getUTCDay()]:''; }
  function norm(v){ return s(v).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/\s+/g,' '); }
  // As escolhas de dia: o dia do banho, o seguinte e (na tela) «Outra data».
  function opcoes(dia, hoje){
    dia=iso(dia); hoje=iso(hoje); if(!dia) return [];
    var seg=maisDias(dia, 1);
    if(semana(seg)==='domingo') seg=maisDias(seg, 1);   // domingo a casa não abre: o seguinte é a segunda
    return [{v:dia, rot:(dia===hoje?'Hoje':'Mesmo dia')+' ('+br(dia)+')'},
            {v:seg, rot:((hoje && seg===maisDias(hoje,1))?'Amanhã':(semana(seg).charAt(0).toUpperCase()+semana(seg).slice(1)))+' ('+br(seg)+')'}];
  }
  // '' = pode salvar; texto = o que impede.
  function validar(o){
    o=o||{}; var dia=iso(o.dia), novo=iso(o.novoDia), h=hora(o.hora), hoje=iso(o.hoje);
    if(!s(o.novoDia)) return 'Escolha o dia do banho.';
    if(!novo) return 'A data não é válida. Escolha no calendário.';
    if(hoje && novo<hoje) return 'Esse dia já passou. Escolha hoje ou um dia à frente.';
    if(semana(novo)==='domingo') return 'Domingo a casa está fechada. Escolha outro dia.';
    if(!h) return 'Escolha a hora do banho.';
    if(novo===dia && h===hora(o.horaAtual)) return 'É o mesmo dia e a mesma hora. Mude o dia ou a hora.';
    return '';
  }
  // Já tem banho deste FILHOt no dia novo? Pela ficha quando os dois lados têm chave; senão, pelo texto.
  function repetido(lista, chave, valor){
    lista=lista||{}; chave=s(chave); var v=norm(valor);
    return Object.keys(lista).some(function(id){ var r=lista[id]||{};
      if(chave && r.chave) return s(r.chave)===chave;
      return norm(r.valor)===v; });
  }
  // O lançamento novo, no dia novo: o mesmo texto, a hora escolhida e de onde ele veio.
  // o = {valor, chave, det, horaAntes, dia, id, fixo, novoDia, hora, quem, ts}
  function registro(o){
    var r={valor:s(o.valor), hora:hora(o.hora), quem:s(o.quem)||'-', ts:Number(o.ts)||0, planilha_ok:null,
           movido_de:{dia:iso(o.dia), hora:s(o.horaAntes), por:s(o.quem)||'-', ts:Number(o.ts)||0}};
    if(o.id) r.movido_de.id=s(o.id);
    if(o.fixo) r.movido_de.fixo=true;
    if(s(o.chave)) r.chave=s(o.chave);
    if(o.det && typeof o.det==='object' && Object.keys(o.det).length) r.det=JSON.parse(JSON.stringify(o.det));
    return r;
  }
  function frase(o){
    o=o||{}; var nome=s(o.nome)||'o FILHOt';
    if(iso(o.novoDia)===iso(o.dia)) return 'Banho de '+nome+' passa para as '+hora(o.hora)+' ('+br(o.dia)+').';
    return 'Banho de '+nome+' passa para '+semana(o.novoDia)+', '+br(o.novoDia)+' às '+hora(o.hora)+'.';
  }
  return {opcoes:opcoes, validar:validar, repetido:repetido, registro:registro, frase:frase, maisDias:maisDias, br:br, semana:semana, HORAS:HORAS};
});
