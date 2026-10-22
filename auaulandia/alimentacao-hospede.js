/* Leitura pura da comida do check-in de hotel. Não consulta nem grava banco. */
(function(root,factory){ var api=factory(); if(typeof module==='object'&&module.exports)module.exports=api; if(root)root.ZeluzAlimentacaoHospede=api; })(typeof globalThis!=='undefined'?globalThis:this,function(){
  function texto(v){ return v==null?'':String(v).trim(); }
  function tem(obj,k){ return !!obj && Object.prototype.hasOwnProperty.call(obj,k); }
  function refeicaoDaEstadia(estadia,tipo){
    var e=estadia||{}, a=e.ficha&&e.ficha.alim, r=a&&a.refs&&a.refs.fixas&&a.refs.fixas[tipo];
    if(!r || typeof r!=='object') return {estado:'sem-registro',tipo:tipo,origem:'sem-fonte'};
    var ligada=tem(r,'on')?r.on===true:null;
    var q={racao:texto(r.racao),natural:texto(r.natural),extra:texto(r.extra),hora:texto(r.hora)};
    var base={tipo:tipo,origem:'checkin-hotel',referencia:'ficha.alim.refs.fixas.'+tipo,
      quantidade:q,unidade:texto(a.unidade),marca:texto(a.marca||a.tipo),
      restricao:texto(a.obs),semRacao:!!(e.alimentacao&&e.alimentacao.sem_racao)};
    if(ligada===false) return Object.assign(base,{estado:'nao-oferecer'});
    if(ligada!==true) return Object.assign(base,{estado:'conferir-refeicao'});
    if(!q.racao&&!q.natural&&!q.extra) return Object.assign(base,{estado:'conferir-quantidade'});
    if(q.racao&&!base.unidade) return Object.assign(base,{estado:'conferir-unidade-racao'});
    return Object.assign(base,{estado:'oferecer'});
  }
  function doCheckinAtivo(portas,hospede,tipo){
    portas=portas||{};
    if(typeof portas.mcrEstadiaDoHosp!=='function'||typeof portas.medAgendaKey!=='function'||typeof portas.zHojeISO!=='function')
      return {estado:'carregando',tipo:tipo,origem:'porta-ausente'};
    var chave=texto(portas.medAgendaKey(hospede||{}));
    if(!chave) return {estado:'conferencia-identidade',tipo:tipo,origem:'chave-ausente'};
    var r=portas.mcrEstadiaDoHosp(chave,portas.EST_TODAS||{},portas.zHojeISO());
    if(!r||!r.id||!r.est) return {estado:'sem-estadia-ativa',tipo:tipo,origem:'mcrEstadiaDoHosp'};
    if(texto(r.est.refKey).toLowerCase()!==chave.toLowerCase())
      return {estado:'conferencia-identidade',tipo:tipo,origem:'mcrEstadiaDoHosp',referencia:chave};
    var out=refeicaoDaEstadia(r.est,tipo); out.estadiaId=texto(r.id); out.refKey=chave; return out;
  }
  function almocoParaCard(plano,fallback){
    if(plano&&plano.origem==='checkin-hotel'){
      var q=plano.quantidade||{};
      var f=fallback||{}, u=texto(plano.unidade);
      function porcaoRacao(v){ return v?(v+(u?' '+u:'')+' de ração'):''; }
      function porcaoNatural(v){ return v?(v+' g de comida natural'):''; }
      var restr=[texto(f.restr),texto(plano.restricao)].filter(Boolean).filter(function(v,i,a){ return a.indexOf(v)===i; }).join(' · ');
      return {alim:plano.estado==='nao-oferecer'?'Não almoça':(plano.marca||'Check-in do hotel'),
        // Nunca supõe gramas: a unidade só aparece quando está na ficha deste check-in.
        quant:plano.semRacao?'':[porcaoRacao(q.racao),porcaoNatural(q.natural)].filter(Boolean).join(' + '),
        extra:q.extra?('Complemento: '+q.extra):'', lento:!!f.lento,
        restr:restr,nao:plano.estado==='nao-oferecer',semRacao:!!plano.semRacao,
        // Os dois separados (Story 6.121): a restrição do cadastro e a observação do check-in desta estadia
        // (como dar, misturas, manias). A tela decide a cor de cada um num ponto só; restr continua juntando.
        restrCadastro:texto(f.restr),obsCheckin:texto(plano.restricao),
        fonte:'checkin-hotel',conferir:plano.estado.indexOf('conferir-')===0};
    }
    if(!fallback) return null;
    // O cadastro antigo é referência clínica, nunca confirmação do check-in desta hospedagem.
    var copia={}; Object.keys(fallback).forEach(function(k){ copia[k]=fallback[k]; }); copia.fonte='cadastro-daycare'; copia.conferirCheckin=true; return copia;
  }
  function almocoAtivo(portas,hospede,fallback){
    return almocoParaCard(doCheckinAtivo(portas,hospede,'almoco'),fallback);
  }
  function almocoDaLinha(portas,linha,fallback){
    portas=portas||{}; linha=linha||{};
    var T=portas.EST_TODAS||{}, id=texto(linha.estadiaId), chave=texto(linha.refKey), est=id?T[id]:null;
    if(est){
      // Não confia em uma linha antiga: o helper real revalida data/status e denuncia duas estadias.
      if(!chave||typeof portas.mcrEstadiaDoHosp!=='function'||typeof portas.zHojeISO!=='function') return {alim:'',quant:'',extra:'',lento:false,restr:'',nao:false,fonte:'conferencia-identidade',conferir:true};
      var checado=portas.mcrEstadiaDoHosp(chave,T,portas.zHojeISO());
      if(!checado||checado.id!==id||checado.est!==est||texto(est.refKey).toLowerCase()!==chave.toLowerCase()) return {alim:'',quant:'',extra:'',lento:false,restr:'',nao:false,fonte:'conferencia-identidade',conferir:true};
      return almocoParaCard(refeicaoDaEstadia(est,'almoco'),fallback);
    }
    // A linha sintética não tem índice numérico de aluno. A referência preservada é suficiente.
    var p={}; Object.keys(portas).forEach(function(k){ p[k]=portas[k]; });
    p.medAgendaKey=function(){ return chave || (typeof portas.medAgendaKey==='function'?portas.medAgendaKey((linha||{}).p||{}):''); };
    return almocoAtivo(p,linha.p||{},fallback);
  }
  function cafeAtivo(portas,hospede){
    var plano=doCheckinAtivo(portas,hospede,'cafe');
    if(plano.origem!=='checkin-hotel') return plano;
    var e=(portas||{}).EST_TODAS&&portas.EST_TODAS[plano.estadiaId], a=e&&e.ficha&&e.ficha.alim, hoje=typeof (portas||{}).zHojeISO==='function'?portas.zHojeISO():'';
    if(!e||!a||!hoje) return Object.assign(plano,{estado:'conferir-dia'});
    var entra=String(e.entrada||'')===hoje, sai=String(e.saida||'')===hoje;
    if(!entra&&!sai) return plano;
    var deEntrada=a.entrada&&a.entrada.cafe, deSaida=a.saida&&a.saida.cafe;
    if((entra&&!a.entrada)||(sai&&!a.saida)) return Object.assign(plano,{estado:'conferir-dia'});
    if((entra&&deEntrada===true)||(sai&&deSaida===true)) return plano;
    return Object.assign(plano,{estado:'nao-oferecer-no-dia'});
  }
  return {refeicaoDaEstadia:refeicaoDaEstadia,doCheckinAtivo:doCheckinAtivo,almocoParaCard:almocoParaCard,almocoAtivo:almocoAtivo,almocoDaLinha:almocoDaLinha,cafeAtivo:cafeAtivo};
});
