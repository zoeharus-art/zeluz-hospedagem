(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root){root.ZeluzAgendaMarciaApp=api;if(root.document)api.instalar(root);}
})(typeof window!=='undefined'?window:null,function(){
  'use strict';
  function criar(op){
    var painel=null,fonte=null,off=null,versao=0,sessao=null,receber=null,ultimo=null,contexto=null;
    function permitido(){try{var a=op.autor();return op.pode()===true&&!!a&&!!a.id&&!!a.nome&&(!sessao||a.id===sessao.id&&a.nome===sessao.nome)&&(!contexto||(op.db()===contexto.db&&op.raiz()===contexto.raiz&&op.dia()===contexto.dia&&entrevistaPermitida()===contexto.entrevistas));}catch(_){return false;}}
    function fechar(){
      versao++;receber=null;ultimo=null;
      if(off){off();off=null;}
      if(fonte){fonte.fechar();fonte=null;}
      if(painel){painel.destroy();painel=null;}
      sessao=null;contexto=null;
    }
    function entrevistaPermitida(){try{return typeof op.podeEntrevista==='function'&&op.podeEntrevista()===true}catch(_){return false;}}
    function reutilizavel(){try{return !!painel&&!!fonte&&!!contexto&&permitido()&&op.db()===contexto.db&&op.raiz()===contexto.raiz&&op.dia()===contexto.dia&&entrevistaPermitida()===contexto.entrevistas;}catch(_){return false;}}
    function ocultar(){if(!reutilizavel()){fechar();return false;}return true;}
    function abrir(){
      if(reutilizavel()){if(typeof painel.atualizarCadastro==='function')painel.atualizarCadastro(op.clientes(),op.racas);return true;}
      fechar();var raiz=op.raiz();if(!raiz)return false;
      if(!permitido()){raiz.textContent='Entre com um perfil autorizado para usar a Agenda Márcia.';return false;}
      if(!op.db()||!op.dados||!op.painel){raiz.textContent='A agenda ainda está carregando. Abra novamente em instantes.';return false;}
      var a=op.autor();sessao={id:a.id,nome:a.nome};contexto={db:op.db(),raiz:raiz,dia:op.dia(),entrevistas:entrevistaPermitida()};
      fonte=op.dados.criar({db:op.db(),pode:permitido,podeEntrevista:function(){return permitido()&&typeof op.podeEntrevista==='function'&&op.podeEntrevista()===true;},autor:op.autor,agora:op.agora,aoSalvar:op.aoSalvar});
      var dados=fonte;
      function carregar(dia){
        if(!permitido()){fechar();return Promise.reject(new Error('SEM_PERMISSAO'));}
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
      painel=op.painel.montar(raiz,{podeEntrevista:typeof op.podeEntrevista==='function'&&op.podeEntrevista()===true,dia:op.dia(),clientes:op.clientes(),racas:op.racas,canonizarRaca:op.canonizarRaca,carregar:carregar,
        observarMes:function(mes,cb){if(dados!==fonte||typeof dados.observarMes!=='function'){cb({mes:mes,estado:'falha',dias:{}});return function(){};}if(!permitido()){fechar();return function(){};}return dados.observarMes(mes,function(s){if(dados!==fonte)return;if(!permitido()){fechar();return;}cb(s);});},
        observar:function(dia,cb){if(!permitido()){fechar();return function(){};}if(ultimo&&ultimo.dia===dia){receber=cb;cb(ultimo);}return function(){if(receber===cb)receber=null;};},
        reenviarProjecao:function(cmd){if(dados!==fonte)return Promise.reject(new Error('SEM_PERMISSAO'));if(!permitido()){fechar();return Promise.reject(new Error('SEM_PERMISSAO'));}if(typeof op.reenviarProjecao!=='function')return Promise.reject(new Error('SEM_PERMISSAO'));return Promise.resolve(op.reenviarProjecao(cmd)).then(function(r){if(dados!==fonte)throw Error('SEM_PERMISSAO');if(!permitido()){fechar();throw Error('SEM_PERMISSAO');}return r;},function(e){if(dados===fonte&&!permitido())fechar();throw e;});},
        salvar:function(cmd){if(dados!==fonte)return Promise.reject(new Error('SEM_PERMISSAO'));if(!permitido()){fechar();return Promise.reject(new Error('SEM_PERMISSAO'));}return Promise.resolve(dados.salvar(cmd)).then(function(r){if(dados!==fonte)throw Error('SEM_PERMISSAO');if(!permitido()){fechar();throw Error('SEM_PERMISSAO');}return r;},function(e){if(dados===fonte&&!permitido())fechar();throw e;});}});
      return true;
    }
    return {abrir:abrir,ocultar:ocultar,fechar:fechar,reutilizavel:reutilizavel,sessaoValida:permitido};
  }
  function resumoHTML(){return '';}
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
        var telefone='';try{telefone=texto(typeof poTelDoTutor==='function'?poTelDoTutor(p):'');}catch(_){}
        return {id:String(i),nome:texto(p.n),raca:dado('raca',p.raca||p.r),tutor:dado('tutor',p.tutor),telefone:telefone};
      });
    }
    function espelhar(ctx){
      if(!pode()||!autor())return Promise.reject(new Error('SEM_PERMISSAO'));
      if(ctx.acaoProjecao==='nenhuma')return Promise.resolve({ok:true});
      if(typeof dashAgendaMarciaProjetar133!=='function')return Promise.reject(new Error('PLANILHA_INDISPONIVEL'));
      return dashAgendaMarciaProjetar133(ctx.dia,ctx.id,ctx.registro,false);
    }
    root.agendaMarciaFechar=function(){if(atual){atual.fechar();atual=null;}if(observador){observador.disconnect();observador=null;}};
    root.agendaMarciaOcultar=function(){if(atual&&!atual.ocultar())root.agendaMarciaFechar();};
    root.agendaMarciaAbrir=function(){
      if(atual&&atual.reutilizavel())return atual.abrir();
      root.agendaMarciaFechar();
      atual=criar({raiz:function(){return root.document.getElementById('agendaMarciaRoot');},db:function(){return typeof DB!=='undefined'?DB:null;},
        pode:pode,podeEntrevista:function(){return typeof entrevistas155Pode==='function'&&entrevistas155Pode();},autor:autor,clientes:clientes,racas:function(){
          if(typeof orcRacasAtualizar==='function')orcRacasAtualizar();
          return (typeof RACAS!=='undefined'&&Array.isArray(RACAS)?RACAS:[]).concat(typeof RACAS_CADASTRO!=='undefined'&&Array.isArray(RACAS_CADASTRO)?RACAS_CADASTRO:[]);
        },canonizarRaca:function(v){return typeof racaCanonica==='function'?racaCanonica(v):'';},dados:typeof root.ZeluzAgendaComposta150==='function'&&root.ZeluzAgendaMarciaEntrevistas?root.ZeluzAgendaComposta150(root.ZeluzAgendaMarcia,root.ZeluzAgendaMarciaEntrevistas):null,painel:root.ZeluzAgendaMarciaPainel,
        dia:function(){return root.ZeluzMarcia129.dataSP();},agora:function(){return Date.now();},aoSalvar:espelhar,reenviarProjecao:function(cmd){
          if(!pode()||!autor()||!cmd||!/^\d{4}-\d{2}-\d{2}$/.test(cmd.dia)||!cmd.id||/[.#$\[\]\/]/.test(cmd.id))return Promise.reject(new Error('SEM_PERMISSAO'));
          return DB.ref('daycare/dashboard/'+cmd.dia+'/avaliacao/'+cmd.id).once('value').then(function(s){
            var reg=s.val();if(!reg||typeof dashAgendaMarciaProjetar133!=='function')throw new Error('PLANILHA_INDISPONIVEL');
            return dashAgendaMarciaProjetar133(cmd.dia,cmd.id,reg,true).then(function(r){return {ok:r.ok===true,dia:cmd.dia,id:cmd.id,espelhoOk:r.ok===true};});
          });
        }});
      var abriu=atual.abrir();if(abriu&&typeof entrevistas155Pode==='function'){var u=typeof usuarioAtual==='function'?usuarioAtual():null;root.entrevistas155Ultimo=entrevistas155Pode()+'|'+String(u&&u.monId||u&&u.id||'')+'|'+String(u&&u.pessoa||u&&u.nome||'');}
      if(abriu&&typeof root.MutationObserver==='function'){observador=new root.MutationObserver(function(){if(!atual||!atual.sessaoValida())root.agendaMarciaFechar();});observador.observe(root.document.body,{attributes:true,attributeFilter:['data-role']});}
      return abriu;
    };
    var view=root.document.getElementById('v-agendamarcia');if(view&&view.classList.contains('active'))root.agendaMarciaAbrir();
  }
  return {criar:criar,instalar:instalar,resumoHTML:resumoHTML};
});
