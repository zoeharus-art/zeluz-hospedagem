/*
 * Lançamentos do dia — atualização pontual (6.76 P11)
 *
 * Carregado antes do script principal. Só define a API: não cria leitura, escrita,
 * listener ou timer. O HTML canônico define dashCartaoHTML() durante o carregamento.
 * O HTML canônico fornece dashCartaoHTML(), extraído pelo patcher do renderDash().
 */
(function(root){
  'use strict';

  function porChave(k){
    var itens=root.DASH_ITENS||[];
    for(var i=0;i<itens.length;i++) if(itens[i] && itens[i].k===k) return itens[i];
    return null;
  }
  function cartao(rootEl, k){
    var todos=rootEl ? rootEl.children||[] : [];
    for(var i=0;i<todos.length;i++) if(todos[i].getAttribute && todos[i].getAttribute('data-dash-card')===String(k)) return todos[i];
    return null;
  }
  function rascunho(k){
    var ler=function(id){ var e=document.getElementById(id); return e&&typeof e.value==='string'?e.value:''; };
    return {busca:ler('dashB_'+k), hora:ler('dashH_'+k), data:ler('dashD_'+k)};
  }
  function repor(k, r){
    var b=document.getElementById('dashB_'+k), h=document.getElementById('dashH_'+k), d=document.getElementById('dashD_'+k);
    if(b && r.busca){ b.value=r.busca; try{ if(typeof root.dashSugerir==='function') root.dashSugerir(k); }catch(e){} }
    if(h && r.hora) h.value=r.hora;
    if(d && r.data) d.value=r.data;
  }
  function atualizarAvisos(){
    var av=document.getElementById('dashPonteAviso');
    if(av && typeof root.dashAvisosHTML==='function') av.innerHTML=root.dashAvisosHTML();
  }

  /*
   * Contrato público para a edição: depois de alterar DASH_DADOS[k][id] e seus
   * efeitos de TV/ponte, chamar dashAtualizarCard(k). Se o cartão não estiver
   * montado ou se faltar uma dependência, a renderização total
   * continua sendo o caminho seguro.
   */
  root.dashAtualizarCard=function(k, opcoes){
    opcoes=opcoes||{};
    var el=document.getElementById('dashBlocos'), it=porChave(k);
    if(!el || !it || typeof root.dashCartaoHTML!=='function' || typeof root.dashDia!=='function'){
      if(typeof root.renderDash==='function') root.renderDash();
      return false;
    }
    var antigo=cartao(el,k);
    if(!antigo){ root.renderDash(); return false; }
    var r=rascunho(k), caixa=document.createElement('div');
    try{
      caixa.innerHTML=root.dashCartaoHTML(it,root.dashDia());
      var novo=caixa.firstElementChild;
      if(!novo) throw new Error('cartão vazio');
      antigo.replaceWith(novo);
      repor(k,r);
      atualizarAvisos();
      try{ if(typeof root.tvBanhoTique==='function') root.tvBanhoTique(); }catch(e){}
      return true;
    }catch(e){
      if(typeof root.renderDash==='function') root.renderDash();
      return false;
    }
  };

  // Releitura explícita: ignora só o cache curto da tela, sem criar polling.
  root.dashAtualizarLancamentos=function(){
    return typeof root.dashCarregar==='function' ? root.dashCarregar(true) : Promise.resolve(null);
  };
})(window);
