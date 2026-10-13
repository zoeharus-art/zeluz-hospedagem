(function(root, factory){
  var api=factory();
  if(typeof module==='object' && module.exports) module.exports=api;
  if(root) root.auResumoEstadia=api.resumoEstadia;
})(typeof globalThis!=='undefined'?globalThis:this, function(){
  'use strict';

  function textoOuNaoRegistrado(valor){
    var texto=String(valor==null?'':valor).trim();
    return texto||'não registrado';
  }

  function dataHoraSaoPaulo(valor){
    if(valor===null || valor===undefined || valor==='') return 'não registrado';
    var data=(typeof valor==='number') ? new Date(valor) : new Date(String(valor));
    if(isNaN(data.getTime())) return 'não registrado';
    try{
      return new Intl.DateTimeFormat('pt-BR', {
        timeZone:'America/Sao_Paulo', year:'numeric', month:'2-digit', day:'2-digit',
        hour:'2-digit', minute:'2-digit'
      }).format(data);
    }catch(e){ return 'não registrado'; }
  }

  // `_ts` é o instante salvo do check-in. Ele nunca substitui a pessoa que o criou.
  function resumoEstadia(estadia){
    var e=estadia||{}, conferencia=e.conferencia||{};
    return {
      checkinPor:textoOuNaoRegistrado(e.criado_por),
      checkinQuando:dataHoraSaoPaulo(e._ts),
      conferenciaConcluida:conferencia.concluida===true,
      conferenciaPor:textoOuNaoRegistrado(conferencia.concluida_por),
      conferenciaQuando:dataHoraSaoPaulo(conferencia.concluida_ts)
    };
  }

  return {textoOuNaoRegistrado:textoOuNaoRegistrado, dataHoraSaoPaulo:dataHoraSaoPaulo, resumoEstadia:resumoEstadia};
});
