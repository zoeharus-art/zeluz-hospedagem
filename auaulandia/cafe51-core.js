/* Guardas puros do Café 51. Não lê DOM, Firebase nem sessão por conta própria. */
(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.ZeluzCafe51=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function texto(v){ return v==null?'':String(v).trim(); }
  function dataValida(v){ return /^\d{4}-\d{2}-\d{2}$/.test(texto(v)); }
  function monitorAtivo(usuario,monitores){
    if(!usuario || texto(usuario.role)!=='monitor' || !texto(usuario.monId)) return false;
    var achados=(Array.isArray(monitores)?monitores:[]).filter(function(m){ return m && texto(m.id)===texto(usuario.monId); });
    return achados.length===1 && achados[0].ativo!==false;
  }
  function liberacaoVigente(config,dia){
    config=config||{};
    if(config.modo==='permanente') return true;
    return config.modo==='somente_hoje' && dataValida(config.data) && texto(config.data)===texto(dia);
  }
  function podeAbrir(ctx){
    ctx=ctx||{};
    var u=ctx.usuario||null;
    if(!u || !texto(u.role)) return false;
    if(texto(u.role)!=='monitor') return !!ctx.original;
    if(!monitorAtivo(u,ctx.monitores)) return false;
    return liberacaoVigente(ctx.config,ctx.dia) || !!ctx.original;
  }
  function podeSalvar(ctx){ return podeAbrir(ctx) && !!ctx.sessaoAtual; }
  return {texto:texto,dataValida:dataValida,monitorAtivo:monitorAtivo,liberacaoVigente:liberacaoVigente,podeAbrir:podeAbrir,podeSalvar:podeSalvar};
});
