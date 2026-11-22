/* TURNO DO PLANTÃO — Adriana, 15/nov/2026 (maquete aprovada no mesmo dia).
   «As plantonistas dão o almoço durante o dia que elas estão e o café: nos feriados, domingos
    (nacionais, municipais e estaduais), e em dias como 24 e 31 de dezembro, que não são feriado
    mas a Zêluz não trabalha. O plantão noturno — 19h às 7h — continua somente com o jantar; o
    diurno, de 7h às 19h, precisa estar com o café e o almoço. O desenho não pode confundir.»
   Leitura pura: não consulta banco nem tela. Quem chama diz se o dia é fechado e que horas são. */
(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.ZeluzPlantaoTurno=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function hora(hhmm){ var m=/^(\d{1,2}):(\d{2})/.exec(String(hhmm==null?'':hhmm)); return m?Number(m[1]):NaN; }
  // 22/nov/2026 (Adriana): «Sempre apareça almoço e café para as plantonistas. Todos os dias, bem como
  //  relatório de jantar. Pelo horário aparece qual fazer piscando. Até as 18h aparece café e almoço,
  //  depois das 18h já aparece o relatório do jantar.» O turno diz só O QUE PISCA; nada some da tela.
  // 'diurno' 07h–18h (café e almoço) · 'noturno' 18h–07h (jantar e relatório) · todo dia.
  // diaFechado continua no contrato (quem chama ainda manda), mas não muda mais o turno.
  function turno(diaFechado,hhmm){
    var h=hora(hhmm);
    if(!(h>=0&&h<24)) return 'fora';
    if(h>=18||h<7) return 'noturno';
    return 'diurno';
  }
  function refeicoes(t){ return t==='diurno'?['cafe','almoco']:(t==='noturno'?['jantar']:[]); }
  // O jantar da madrugada pertence ao dia em que o plantão começou, às 19h.
  function diaDoJantar(hojeISO,ontemISO,hhmm){ return hora(hhmm)<7?ontemISO:hojeISO; }
  return {turno:turno,refeicoes:refeicoes,diaDoJantar:diaDoJantar,hora:hora};
});
