(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root){root.ZeluzMarciaApp129=api;if(root.document)api.instalar(root);}
})(typeof window!=='undefined'?window:null,function(){
  'use strict';
  function criar(op){
    var painel=null,dados=null,calendarioDados=null,parar=null,geracao=0,removerCaches=null,sessaoId='',sessaoNome='';
    function permitido(){try{var a=op.autor();return op.pode()===true&&!!a&&(!sessaoId||a.id===sessaoId&&a.nome===sessaoNome);}catch(_){return false;}}
    function fechar(){
      geracao+=1;
      if(parar){parar();parar=null;}
      if(removerCaches){removerCaches();removerCaches=null;}
      if(dados){dados.fechar();dados=null;}
      if(calendarioDados){calendarioDados.fechar();calendarioDados=null;}
      if(painel){painel.destroy();painel=null;}
      sessaoId='';sessaoNome='';
    }
    function abrir(){
      fechar();
      var raiz=op.raiz();if(!raiz)return false;
      if(!permitido()){raiz.textContent='Este painel está disponível para Gestão e Diretoria.';return false;}
      if(!op.db()||!op.dados||!op.painel){raiz.textContent='O painel ainda não terminou de carregar. Abra novamente em instantes.';return false;}
      var pessoaInicial=op.autor();sessaoId=pessoaInicial.id;sessaoNome=pessoaInicial.nome;
      dados=op.dados.criar({db:op.db(),pode:permitido,autor:op.autor,fontesCadastro:op.fontesCadastro,helpers:op.helpers,
        ZeluzHospedesAtividades:op.hospedes,Presenca96:op.presenca,agora:op.agora});
      var fonte=dados;
      if(op.agendaDados)calendarioDados=op.agendaDados.criar({db:op.db(),pode:permitido,autor:op.autor,agora:op.agora});
      var calendario=calendarioDados;
      function carregar(dia){
        if(parar){parar();parar=null;}
        var minha=++geracao;
        return new Promise(function(resolve,reject){
          var respondeu=false;
          try{
            parar=fonte.observar(dia,function(snapshot){
              if(minha!==geracao)return;
              if(!permitido()){fechar();return;}
              // A observação já faz a primeira leitura; não duplicar com once().
              if(painel)painel.atualizar(snapshot);
              if(!respondeu&&snapshot.agenda&&snapshot.agenda.estado!=='carregando'){
                respondeu=true;resolve(snapshot);
              }
            });
          }catch(e){reject(e);}
        });
      }
      painel=op.painel.montar(raiz,{dia:op.dia(),carregar:carregar,observarMes:function(mes,cb){
        if(!permitido()||!calendario||typeof calendario.observarMes!=='function'){cb({mes:mes,estado:'falha',dias:{}});return function(){};}
        return calendario.observarMes(mes,function(s){if(calendario===calendarioDados&&permitido())cb(s);});
      },salvarTarefa:function(pedido){
        if(!permitido())return Promise.reject(new Error('SEM_PERMISSAO'));
        return fonte.salvarTarefa(pedido);
      },salvarAvaliacao:function(pedido){
        if(!permitido()||typeof fonte.salvarAvaliacao!=='function')return Promise.reject(new Error('SEM_PERMISSAO'));
        return fonte.salvarAvaliacao(pedido);
      }});
      if(typeof op.observarCaches==='function')removerCaches=op.observarCaches(function(){
        if(fonte===dados&&permitido()&&typeof fonte.recalcular==='function')fonte.recalcular();
      });
      return true;
    }
    return {abrir:abrir,fechar:fechar,sessaoValida:permitido,recalcular:function(){
      if(dados&&permitido()&&typeof dados.recalcular==='function')return dados.recalcular();
      return null;
    }};
  }

  function instalar(root){
    var atual=null,observador=null;
    function texto(x){return typeof x==='string'?x.trim():'';}
    function usuario(){try{return typeof usuarioAtual==='function'?usuarioAtual():null;}catch(_){return null;}}
    function autor(){
      var u=usuario();if(!u)return null;
      var id=texto(u.monId||u.id||u.uid),nome=texto(u.pessoa||u.nome);
      return id&&nome?{id:id,nome:nome}:null;
    }
    function pode(){return !!usuario()&&typeof podePapel==='function'&&podePapel('painel-operacao')===true;}
    function reposicoesDoCache(dia,pets){
      var out=[],por={};
      if(typeof pelKey!=='function')return out;
      pets.forEach(function(p){por[pelKey(p)]=p;});
      var cache=typeof REPO_CACHE!=='undefined'&&REPO_CACHE||{};
      Object.keys(cache).forEach(function(pk){
        var p=por[pk],grupo=cache[pk]||{},linhas=[],anulados={};
        try{
          linhas=p&&typeof repLancamentos==='function'?repLancamentos(p):Object.keys(grupo.lancamentos||{}).map(function(id){return Object.assign({_id:id},grupo.lancamentos[id]);});
          anulados=typeof repAnulados==='function'?repAnulados(linhas):{};
        }catch(_){return;}
        linhas.forEach(function(l){
          if(!l||anulados[l._id])return;
          if(dia&&l.data!==dia&&l.volta!==dia&&!(l.troca&&(l.troca.de===dia||l.troca.para===dia)))return;
          var chave=p&&typeof dcKey==='function'?dcKey(p.n,p.tutor):'',rotulo=texto(l.motivo);
          try{if(typeof repMotivoRotulo==='function')rotulo=texto(repMotivoRotulo(l.motivo))||rotulo;}catch(_){}
          out.push({chave:chave,pet:p?p.n:texto(grupo.nome),tutor:p?texto(p.tutor):'',tipo:texto(l.tipo),data:texto(l.data),volta:texto(l.volta),troca:l.troca||null,
            motivo:texto(l.motivo),motivoRotulo:rotulo,obs:texto(l.obs),quem:texto(l.quem),hora:texto(l.hora),informante:texto(l.informante)});
        });
      });
      return out;
    }
    function fontesCadastro(dia){
      var pets=typeof PELUDINHOS!=='undefined'&&Array.isArray(PELUDINHOS)?PELUDINHOS:[];
      return {pronto:typeof CARTEIRA_CARREGADA!=='undefined'&&CARTEIRA_CARREGADA===true,peludinhos:pets,
        cadastro:typeof pelCadCache!=='undefined'&&pelCadCache||{},
        estadiasProntas:typeof CF_ESTADIAS_LIDO!=='undefined'&&CF_ESTADIAS_LIDO===true&&typeof EST_TODAS!=='undefined'&&!!EST_TODAS,
        estadias:typeof EST_TODAS!=='undefined'&&EST_TODAS||{},reposProntas:typeof REPO_LIDO!=='undefined'&&REPO_LIDO===true&&!(typeof REPO_ERRO!=='undefined'&&REPO_ERRO),
        reposicoes:reposicoesDoCache(dia,pets)};
    }
    function observarCaches(callback){
      var registrados=[],slot='_marcia129_caches';
      // Só reutiliza coleções que a sessão já está lendo; não cria carga ampla.
      if(typeof Z_MAPAS!=='undefined'&&typeof zMapaVivo==='function'){
        ['daycare/cadastro','auaulandia/estadias','daycare/reposicao'].forEach(function(caminho){
          if(!Z_MAPAS[caminho])return;
          zMapaVivo(caminho,slot,callback);registrados.push(caminho);
        });
      }
      return function(){registrados.forEach(function(caminho){if(typeof Z_MAPAS!=='undefined'&&Z_MAPAS[caminho]&&Z_MAPAS[caminho].slots)delete Z_MAPAS[caminho].slots[slot];});};
    }
    root.marcia129CachesMudaram=function(){if(atual)atual.recalcular();};
    root.marcia129Fechar=function(){if(atual){atual.fechar();atual=null;}if(observador){observador.disconnect();observador=null;}};
    root.marcia129Abrir=function(){
      root.marcia129Fechar();
      atual=criar({raiz:function(){return root.document.getElementById('marcia129Root');},db:function(){return typeof DB!=='undefined'?DB:null;},
        pode:pode,autor:autor,fontesCadastro:fontesCadastro,observarCaches:observarCaches,
        dados:root.ZeluzMarciaDados129,painel:root.ZeluzMarcia129,agendaDados:root.ZeluzAgendaMarcia,hospedes:root.ZeluzHospedesAtividades,presenca:root.ZeluzPresenca96Core,
        helpers:{pelDias:typeof pelDias==='function'?pelDias:null,pelGet:typeof pelGet==='function'?pelGet:null,pelExtra:typeof pelExtra==='function'?pelExtra:null,
          dcKey:typeof dcKey==='function'?dcKey:null,pelInativo:typeof pelInativo==='function'?pelInativo:null,ehMoradorZeluz:typeof ehMoradorZeluz==='function'?ehMoradorZeluz:null,
          pelKey:typeof pelKey==='function'?pelKey:null,diffMin:typeof diffMin==='function'?diffMin:null,
          atividadeNome:function(slug){var itens=typeof ATIVS_DC!=='undefined'&&Array.isArray(ATIVS_DC)?ATIVS_DC:[];var item=itens.filter(function(x){return x.s===slug;})[0];return item?item.t:slug;}},
        dia:function(){return root.ZeluzMarcia129.dataSP();},agora:function(){return Date.now();}});
      var abriu=atual.abrir();
      if(abriu&&typeof root.MutationObserver==='function'){
        observador=new root.MutationObserver(function(){if(!atual||!atual.sessaoValida())root.marcia129Fechar();});
        observador.observe(root.document.body,{attributes:true,attributeFilter:['data-role']});
      }
      return abriu;
    };
    var view=root.document.getElementById('v-gestaomarcia');
    if(view&&view.classList.contains('active'))root.marcia129Abrir();
  }
  return {criar:criar,instalar:instalar};
});
