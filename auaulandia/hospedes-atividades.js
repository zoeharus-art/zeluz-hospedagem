/* Núcleo puro do patch de hóspedes nas atividades. Sem DOM, DB ou escrita. */
(function(root,factory){ var api=factory(); if(typeof module==='object'&&module.exports)module.exports=api; if(root)root.ZeluzHospedesAtividades=api; })(typeof globalThis!=='undefined'?globalThis:this,function(){
  function s(v){ return typeof v==='string'?v.trim():''; }
  function iso(v){
    v=s(v); if(!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
    var p=v.split('-'), d=new Date(Number(p[0]),Number(p[1])-1,Number(p[2]));
    return d.getFullYear()===Number(p[0]) && d.getMonth()===Number(p[1])-1 && d.getDate()===Number(p[2]);
  }
  function cobre(e,dia){
    e=e||{};
    if(String(e.status||'ativa')!=='ativa' || !iso(dia)) return false;
    var ent=s(e.entrada), sai=s(e.saida);
    if(!iso(ent) || ent>dia) return false;
    if(sai && !iso(sai)) return false;
    return !sai || sai>=dia; // a saída só exclui depois de efetivada; no dia dela ainda está na casa
  }
  function chaveEstadia(id,e,dcKey){ return s(e.refKey)||('estadia:'+s(id))||dcKey(e.nome,e.tutor); }
  function acharFicha(e,refKey,peludinhos,pelKey,dcKey){
    var P=Array.isArray(peludinhos)?peludinhos:[], alvo=dcKey(e.nome,e.tutor);
    var porRef=P.filter(function(p){ return s(pelKey(p))===refKey; });
    if(porRef.length>1) return {p:null,conferencia:'refkey-ambigua'};
    if(porRef.length===1){
      if(s(e.nome)&&s(e.tutor)&&s(dcKey(porRef[0].n,porRef[0].tutor))!==alvo)
        return {p:null,conferencia:'identidade-divergente'};
      return {p:porRef[0],conferencia:''};
    }
    var exata=P.filter(function(p){ return s(dcKey(p.n,p.tutor))===alvo; });
    return exata.length===1?{p:exata[0],conferencia:''}:{p:null,conferencia:exata.length?'chave-ambigua':''};
  }
  function listar(entrada){
    entrada=entrada||{};
    if(entrada.pronto!==true) return {pronto:false,itens:[]};
    var dia=s(entrada.dia), T=entrada.estadias||{}, pel=entrada.peludinhos||[];
    var dcKey=entrada.dcKey, pelKey=entrada.pelKey;
    if(!iso(dia)||typeof dcKey!=='function'||typeof pelKey!=='function') return {pronto:false,itens:[]};
    var vistos={}, out=[];
    Object.keys(T).forEach(function(id){
      var e=T[id]||{}; if(!cobre(e,dia)) return;
      var ref=chaveEstadia(id,e,dcKey); if(vistos[ref]) return; vistos[ref]=true;
      var achou=acharFicha(e,s(e.refKey),pel,pelKey,dcKey), p=achou.p;
      // Sem ficha, a referência da estadia é preservada. Nenhum casamento por nome isolado.
      out.push({p:p||{n:s(e.nome),tutor:s(e.tutor),raca:s(e.raca),freq:'hospede',dias:[]},
        i:p?pel.indexOf(p):('hosp'+ref), hospede:true, refKey:ref, estadiaId:s(id), conferencia:achou.conferencia});
    });
    return {pronto:true,itens:out};
  }
  function juntar(turma, entrada){
    var base=Array.isArray(turma)?turma.slice():[], L=listar(entrada);
    if(!L.pronto) return {pronto:false,itens:base};
    var dcKey=entrada.dcKey, vistos={};
    base.forEach(function(o){ vistos[dcKey(o.p.n,o.p.tutor)]=true; });
    L.itens.forEach(function(o){
      var k=dcKey(o.p.n,o.p.tutor);
      if(vistos[k]){
        // O aluno fixo continua sendo a mesma linha, mas a hospedagem precisa sobreviver ao
        // filtro de presença/banho das 11h.
        base.forEach(function(x){ if(dcKey(x.p.n,x.p.tutor)===k){ x.hospede=true; x.refKey=o.refKey; x.estadiaId=o.estadiaId; } });
        return;
      }
      vistos[k]=true; base.push(o);
    });
    return {pronto:true,itens:base};
  }
  function aplicarNaTurma(base, entrada){
    var j=juntar(base,entrada);
    if(j.pronto) base.splice.apply(base,[0,base.length].concat(j.itens));
    return {pronto:j.pronto,itens:base};
  }
  return {estadiaCobreDia:cobre,listarHospedesAtivos:listar,juntarTurma:juntar,aplicarNaTurma:aplicarNaTurma};
});
