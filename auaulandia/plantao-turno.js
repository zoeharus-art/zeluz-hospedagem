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
  // 24/nov/2026 (Adriana): «Ser disponibilizado conforme horário do celular. Se for 8h o café estará disponível e
  //  o almoço. Às 18h50 o jantar. [...] Para não criar confusão, esteja travada nos horários: às 8h não aparece a
  //  medicação da noite.» Plantão de 12 h: dia 07h00–18h49, noite 18h50–06h59.
  var NOITE_COMECA=18*60+50, DIA_COMECA=7*60;
  function minutos(hhmm){ var m=/^(\d{1,2}):(\d{2})/.exec(String(hhmm==null?'':hhmm)); if(!m) return NaN; var h=Number(m[1]), mi=Number(m[2]); return (h>=0&&h<24&&mi>=0&&mi<60)?h*60+mi:NaN; }
  function turno(diaFechado,hhmm){
    var t=minutos(hhmm);
    if(!(t>=0)) return 'fora';
    if(t>=NOITE_COMECA||t<DIA_COMECA) return 'noturno';
    return 'diurno';
  }
  function refeicoes(t){ return t==='diurno'?['cafe','almoco']:(t==='noturno'?['jantar']:[]); }
  // O jantar da madrugada pertence ao dia em que o plantão começou, às 18h50.
  function diaDoJantar(hojeISO,ontemISO,hhmm){ return hora(hhmm)<7?ontemISO:hojeISO; }
  // A dose do remédio aparece na ficha só no turno dela (a agenda é do dia do calendário):
  // de dia, 07h00–18h49; à noite, depois das 18h50 só as da noite que começa; de madrugada, só as até 06h59.
  function doseNoTurno(hDose,hAgora){
    var d=minutos(hDose), a=minutos(hAgora);
    if(!(d>=0)||!(a>=0)) return true;   // sem horário: não esconde
    if(a>=DIA_COMECA&&a<NOITE_COMECA) return d>=DIA_COMECA&&d<NOITE_COMECA;
    if(a>=NOITE_COMECA) return d>=NOITE_COMECA;
    return d<DIA_COMECA;
  }
  return {turno:turno,refeicoes:refeicoes,diaDoJantar:diaDoJantar,hora:hora,minutos:minutos,doseNoTurno:doseNoTurno};
});
