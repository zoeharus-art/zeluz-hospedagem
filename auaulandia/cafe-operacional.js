/* Leitura pura do cafe do hotel. Nao consulta nem grava banco. */
(function(root,factory){
  var api=factory(root&&root.ZeluzAlimentacaoHospede);
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.ZeluzCafeOperacional=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Alim){
  function texto(v){ return v==null?'':String(v).trim(); }
  function iso(v){
    v=texto(v); if(!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
    var p=v.split('-'), d=new Date(Number(p[0]),Number(p[1])-1,Number(p[2]));
    return d.getFullYear()===Number(p[0])&&d.getMonth()===Number(p[1])-1&&d.getDate()===Number(p[2]);
  }
  function cobreHoje(e,dia){
    e=e||{};
    if(String(e.status||'ativa')!=='ativa'||!iso(dia)) return false;
    var ent=texto(e.entrada), sai=texto(e.saida);
    if(!iso(ent)||ent>dia) return false;
    if(sai&&!iso(sai)) return false;
    return !sai||sai>=dia;
  }
  function cafeBruto(e){
    return e&&e.ficha&&e.ficha.alim&&e.ficha.alim.refs&&e.ficha.alim.refs.fixas&&e.ficha.alim.refs.fixas.cafe;
  }
  function aplicarDia(plano,e,dia){
    var alim=e&&e.ficha&&e.ficha.alim, marcacoes=[];
    if(!alim) return plano;
    var entra=texto(e.entrada)===dia, sai=texto(e.saida)===dia;
    // Entrada e saída no mesmo dia são instruções independentes. Se uma delas
    // não foi registrada, ou se elas discordam, a operação para para conferência.
    if(entra&&(!alim.entrada||typeof alim.entrada.cafe!=='boolean')) return Object.assign({},plano,{estado:'conferir-dia'});
    if(sai&&(!alim.saida||typeof alim.saida.cafe!=='boolean')) return Object.assign({},plano,{estado:'conferir-dia'});
    if(entra) marcacoes.push(alim.entrada.cafe);
    if(sai) marcacoes.push(alim.saida.cafe);
    if(marcacoes.indexOf(true)>=0&&marcacoes.indexOf(false)>=0) return Object.assign({},plano,{estado:'conferir-dia'});
    if(marcacoes.indexOf(false)>=0) return Object.assign({},plano,{estado:'nao-oferecer-no-dia'});
    return plano;
  }
  function planoDaEstadia(e,dia){
    var bruto=cafeBruto(e);
    // "on" ausente não significa que o hóspede não toma café. A tela precisa pedir
    // conferência, porque a omissão no check-in não autoriza servir nem esconder a pessoa.
    if(!bruto||typeof bruto!=='object') return {estado:'conferir-refeicao',origem:'cafe-sem-registro'};
    if(bruto.on===false) return {estado:'nao-oferecer',origem:'checkin-hotel'};
    if(bruto.on!==true) return {estado:'conferir-refeicao',origem:'cafe-sem-confirmacao'};
    if(!Alim||typeof Alim.refeicaoDaEstadia!=='function') return {estado:'carregando',origem:'modulo-alimentacao-ausente'};
    return aplicarDia(Alim.refeicaoDaEstadia(e,'cafe'),e,dia);
  }
  function unidadeRacao(v){ v=texto(v); return /^gramas?$/i.test(v)?'g':v; }
  function porcao(plano){
    plano=plano||{}; var q=plano.quantidade||{}, partes=[], u=unidadeRacao(plano.unidade), pendente='';
    if(plano.semRacao) return {texto:'SEM RAÇÃO — comida úmida da casa',extra:texto(q.extra),pendente:'',semRacao:true};
    if(texto(q.racao)) partes.push(texto(q.racao)+(u?(' '+u):'')+' de ração'+(u?'':' · unidade a confirmar'));
    if(texto(q.natural)) partes.push(texto(q.natural)+' g de comida natural');
    if(!partes.length&&!texto(q.extra)) pendente='Quantidade a confirmar no check-in';
    else if(plano.estado==='conferir-unidade-racao') pendente='Unidade da ração a confirmar no check-in';
    return {texto:partes.join(' + '),extra:texto(q.extra),pendente:pendente,semRacao:false};
  }
  function mesmoRef(h,ref){ return texto(h&&h.refKey).toLowerCase()===texto(ref).toLowerCase(); }
  function hospedeVisual(e,id,todos){
    var achados=(Array.isArray(todos)?todos:[]).filter(function(h){ return mesmoRef(h,e.refKey); });
    if(achados.length===1) return Object.assign({},achados[0],{refKey:texto(e.refKey),estadiaId:texto(id)});
    return {nome:texto(e.nome),tutor:texto(e.tutor),raca:texto(e.raca),refKey:texto(e.refKey),estadiaId:texto(id),hospede:true};
  }
  function criar(portas){
    portas=portas||{};
    function ler(){
      if(portas.pronto!==true) return {pronto:false,participantes:[],conferencias:[{estado:'estadias-carregando'}]};
      var dia=typeof portas.hoje==='function'?texto(portas.hoje()):texto(portas.hoje);
      if(!iso(dia)) return {pronto:false,participantes:[],conferencias:[{estado:'dia-invalido'}]};
      var T=portas.estadias||{}, todos=typeof portas.hospedes==='function'?(portas.hospedes()||[]):[], grupos={}, conferencias=[], participantes=[];
      Object.keys(T).forEach(function(id){
        var e=T[id]||{}; if(!cobreHoje(e,dia)) return;
        var ref=texto(e.refKey);
        if(!ref){ conferencias.push({estado:'identidade-a-confirmar',estadiaId:texto(id),nome:texto(e.nome),tutor:texto(e.tutor)}); return; }
        var k=ref.toLowerCase(); (grupos[k]||(grupos[k]=[])).push({id:id,e:e});
      });
      Object.keys(grupos).forEach(function(k){
        var g=grupos[k];
        if(g.length!==1){ conferencias.push({estado:'estadias-ativas-duplicadas',refKey:k,quantidade:g.length,nome:texto(g[0].e.nome),tutor:texto(g[0].e.tutor)}); return; }
        var o=g[0], plano=planoDaEstadia(o.e,dia);
        if(!plano||plano.estado==='nao-oferecer'||plano.estado==='nao-oferecer-no-dia') return;
        if(plano.estado==='carregando'||String(plano.estado||'').indexOf('conferir-')===0){
          conferencias.push({estado:plano.estado||'alimentacao-a-conferir',refKey:k,estadiaId:texto(o.id),nome:texto(o.e.nome),tutor:texto(o.e.tutor)}); return;
        }
        participantes.push({hospede:hospedeVisual(o.e,o.id,todos),plano:plano,porcao:porcao(plano),estadiaId:texto(o.id),refKey:texto(o.e.refKey)});
      });
      return {pronto:true,participantes:participantes,conferencias:conferencias};
    }
    return {ler:ler};
  }
  return {criar:criar,estadiaCobreHoje:cobreHoje,planoDaEstadia:planoDaEstadia,porcao:porcao};
});
