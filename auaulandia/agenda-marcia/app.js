(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root){root.ZeluzAgendaMarciaApp=api;if(root.document)api.instalar(root);}
})(typeof window!=='undefined'?window:null,function(){
  'use strict';
  function criar(op){
    var painel=null,fonte=null,off=null,versao=0,sessao=null,receber=null,ultimo=null;
    function permitido(){try{var a=op.autor();return op.pode()===true&&!!a&&!!a.id&&!!a.nome&&(!sessao||a.id===sessao.id&&a.nome===sessao.nome);}catch(_){return false;}}
    function fechar(){
      versao++;receber=null;ultimo=null;
      if(off){off();off=null;}
      if(fonte){fonte.fechar();fonte=null;}
      if(painel){painel.destroy();painel=null;}
      sessao=null;
    }
    function abrir(){
      fechar();var raiz=op.raiz();if(!raiz)return false;
      if(!permitido()){raiz.textContent='Entre com um perfil autorizado para usar a Agenda Márcia.';return false;}
      if(!op.db()||!op.dados||!op.painel){raiz.textContent='A agenda ainda está carregando. Abra novamente em instantes.';return false;}
      var a=op.autor();sessao={id:a.id,nome:a.nome};
      fonte=op.dados.criar({db:op.db(),pode:permitido,autor:op.autor,agora:op.agora,aoSalvar:op.aoSalvar});
      var dados=fonte;
      function carregar(dia){
        if(off){off();off=null;}
        var minha=++versao;receber=null;ultimo=null;
        return new Promise(function(resolve,reject){
          var resolveu=false;
          try{off=dados.observar(dia,function(s){
            if(minha!==versao||dados!==fonte)return;
            if(!permitido()){fechar();return;}
            if(!s||s.dia!==dia)return;
            ultimo=s;
            if(!resolveu&&s.estado!=='carregando'){resolveu=true;resolve(s);}
            else if(receber)receber(s);
          });}catch(e){reject(e);}
        });
      }
      painel=op.painel.montar(raiz,{dia:op.dia(),clientes:op.clientes(),carregar:carregar,
        observarMes:function(mes,cb){if(!permitido()||dados!==fonte||typeof dados.observarMes!=='function'){cb({mes:mes,estado:'falha',dias:{}});return function(){};}return dados.observarMes(mes,function(s){if(dados===fonte&&permitido())cb(s);});},
        observar:function(dia,cb){if(ultimo&&ultimo.dia===dia){receber=cb;cb(ultimo);}return function(){if(receber===cb)receber=null;};},
        salvar:function(cmd){if(!permitido()||dados!==fonte)return Promise.reject(new Error('SEM_PERMISSAO'));return dados.salvar(cmd);}});
      return true;
    }
    return {abrir:abrir,fechar:fechar,sessaoValida:permitido};
  }
  function resumoHTML(reg){
    var det=reg&&reg.det||{},a=det.avaliacao129||{},pg=a.pagamento||{};
    if(det.agendaMarcia!==true&&a.agendaMarcia!==true&&a.versao!==131)return '';
    var pago=pg.recebido===true&&pg.valorPagoCentavos===8000&&typeof pg.autorId==='string'&&pg.autorId.trim()&&typeof pg.autorNome==='string'&&pg.autorNome.trim()&&Number(pg.ts)>0;
    return ' <span class="'+(pago?'am131__resumo-pago':'am131__resumo-pendente')+'">'+(pago?'Avaliação confirmada · R$ 80 recebidos':'Avaliação pendente · falta receber R$ 80')+'</span>';
  }
  function instalar(root){
    var atual=null,observador=null;
    root.agendaMarciaResumoHTML=resumoHTML;
    function texto(x){return typeof x==='string'?x.trim():'';}
    function usuario(){try{return typeof usuarioAtual==='function'?usuarioAtual():null;}catch(_){return null;}}
    function autor(){var u=usuario();if(!u)return null;var id=texto(u.monId||u.id||u.uid),nome=texto(u.pessoa||u.nome);return id&&nome?{id:id,nome:nome}:null;}
    function pode(){try{var u=usuario(),r=typeof papelDoCorpo==='function'?papelDoCorpo():u&&u.role;return !!u&&((typeof telaVemDoPapel==='function'&&telaVemDoPapel('agendamarcia',r)===true)||(typeof paginaConcedida==='function'&&paginaConcedida('agendamarcia')===true));}catch(_){return false;}}
    function clientes(){
      var lista=typeof PELUDINHOS!=='undefined'&&Array.isArray(PELUDINHOS)?PELUDINHOS:[];
      return lista.filter(function(p){try{return typeof pelInativo!=='function'||!pelInativo(p);}catch(_){return false;}}).map(function(p,i){
        function dado(k,f){try{return texto(typeof pelGet==='function'?pelGet(p,k):'')||texto(f);}catch(_){return texto(f);}}
        return {id:String(i),nome:texto(p.n),raca:dado('r',p.r),tutor:dado('tutor',p.tutor)};
      });
    }
    function espelhar(ctx){
      if(!pode()||!autor())return Promise.reject(new Error('SEM_PERMISSAO'));
      if(ctx.acao==='editar'&&ctx.resumoAlterado===false)return Promise.resolve();
      if(ctx.pendente&&typeof dashEditarEnviarPendente==='function')return Promise.resolve(dashEditarEnviarPendente('avaliacao',ctx.id,null,ctx.dia,ctx.pendente)).then(function(ok){if(ok!==true)throw new Error('PLANILHA_PENDENTE');});
      if(ctx.acao==='editar')return Promise.reject(new Error('PLANILHA_PENDENTE'));
      if(typeof dashEspelhar!=='function')return Promise.reject(new Error('PLANILHA_INDISPONIVEL'));
      return Promise.resolve(dashEspelhar('avaliacao',ctx.id,{valor:ctx.valor,hora:ctx.hora,quem:ctx.quem,ts:ctx.ts},'lancar',ctx.dia)).then(function(r){if(!r||r.ok!==true)throw new Error('PLANILHA_PENDENTE');});
    }
    root.agendaMarciaFechar=function(){if(atual){atual.fechar();atual=null;}if(observador){observador.disconnect();observador=null;}};
    root.agendaMarciaAbrir=function(){
      root.agendaMarciaFechar();
      atual=criar({raiz:function(){return root.document.getElementById('agendaMarciaRoot');},db:function(){return typeof DB!=='undefined'?DB:null;},
        pode:pode,autor:autor,clientes:clientes,dados:root.ZeluzAgendaMarcia,painel:root.ZeluzAgendaMarciaPainel,
        dia:function(){return root.ZeluzMarcia129.dataSP();},agora:function(){return Date.now();},aoSalvar:espelhar});
      var abriu=atual.abrir();
      if(abriu&&typeof root.MutationObserver==='function'){observador=new root.MutationObserver(function(){if(!atual||!atual.sessaoValida())root.agendaMarciaFechar();});observador.observe(root.document.body,{attributes:true,attributeFilter:['data-role']});}
      return abriu;
    };
    var view=root.document.getElementById('v-agendamarcia');if(view&&view.classList.contains('active'))root.agendaMarciaAbrir();
  }
  return {criar:criar,instalar:instalar,resumoHTML:resumoHTML};
});
