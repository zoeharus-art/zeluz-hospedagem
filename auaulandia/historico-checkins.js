(function(root, factory){
  var api=factory();
  if(typeof module==='object' && module.exports) module.exports=api;
  if(root){
    root.histCiAbrir=function(opcoes){ return api.abrir(root, opcoes); };
    root.histCiReceberEstadias=function(mapa){ return api.receberEstadias(root, mapa); };
  }
})(typeof globalThis!=='undefined'?globalThis:this, function(){
  'use strict';
  var CHAVE='__histCiEstado';
  function texto(v){ return String(v==null?'':v); }
  function normalizar(v){ return texto(v).normalize ? texto(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim() : texto(v).toLowerCase().trim(); }
  function dataValida(v){ return /^\d{4}-\d{2}-\d{2}$/.test(texto(v)); }
  function datasInvalidas(f){ return dataValida(f.inicio)&&dataValida(f.fim)&&f.fim<f.inicio; }
  function periodoSobrepoe(e,inicio,fim){
    inicio=dataValida(inicio)?inicio:''; fim=dataValida(fim)?fim:''; if(!inicio&&!fim) return true;
    var entra=texto((e||{}).entrada), sai=texto((e||{}).saida||(e||{}).entrada);
    if(!dataValida(entra)||!dataValida(sai)) return false; if(sai<entra){ var t=entra; entra=sai; sai=t; }
    return (!inicio||sai>=inicio)&&(!fim||entra<=fim);
  }
  function dataHora(v){
    if(v===null||v===undefined||v==='') return 'não registrado'; var d=typeof v==='number'?new Date(v):new Date(texto(v));
    if(isNaN(d.getTime())) return 'não registrado';
    try{return new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(d);}catch(x){return 'não registrado';}
  }
  function resumoPadrao(e){ e=e||{}; var c=e.conferencia||{}; return {checkinPor:texto(e.criado_por).trim()||'não registrado',checkinQuando:dataHora(e._ts),conferenciaConcluida:c.concluida===true,conferenciaPor:texto(c.concluida_por).trim()||'não registrado',conferenciaQuando:dataHora(c.concluida_ts)}; }
  function resumo(root,e){ try{if(root&&typeof root.auResumoEstadia==='function') return root.auResumoEstadia(e);}catch(x){} return resumoPadrao(e); }
  function registro(id,e,root){ return {id:texto(id),e:e||{},resumo:resumo(root,e||{})}; }
  function filtrar(mapa,f,root){
    f=f||{}; var busca=normalizar(f.busca), estado=texto(f.estado||'todos'), out=[];
    Object.keys(mapa||{}).forEach(function(id){ var e=mapa[id]||{}; if(busca&&normalizar(e.nome).indexOf(busca)<0&&normalizar(e.tutor).indexOf(busca)<0) return; if(!periodoSobrepoe(e,f.inicio,f.fim)) return; var r=registro(id,e,root), feita=r.resumo.conferenciaConcluida===true; if(estado==='conferida'&&!feita) return; if(estado==='pendente'&&feita) return; out.push(r); });
    return out.sort(function(a,b){return (Number(b.e._ts)||0)-(Number(a.e._ts)||0)||a.id.localeCompare(b.id);});
  }
  function permitido(root){ try{ if(!root||typeof root.podePapel!=='function'||typeof root.usuarioAtual!=='function'||!root.usuarioAtual()) return false; return !!root.podePapel('historico-checkins'); }catch(e){return false;} }
  function estadoFonte(s){ if(s&&s.carregando)return'carregando'; if(s&&s.erro)return'erro'; return s&&s.mapa?'pronto':'sem-fonte'; }
  function novoEstado(root){ if(!root[CHAVE]) root[CHAVE]={mapa:null,carregando:false,erro:null,aberto:false,pagina:1,porPagina:20,selecionado:'',focoDetalhe:false,retorno:null,ui:null,filtros:{busca:'',inicio:'',fim:'',estado:'todos'},fotos:{cache:{},carregando:{},erro:{},pedido:0}}; return root[CHAVE]; }
  function el(doc,tag,classe,conteudo){ var n=doc.createElement(tag); if(classe)n.className=classe; if(conteudo!==undefined&&conteudo!==null)n.textContent=conteudo; return n; }
  function botao(doc,rotulo,acao){ var b=el(doc,'button','btn btn-primary hist-ci-botao',rotulo); b.type='button'; b.dataset.action=acao; return b; }
  function limpar(no){while(no.firstChild)no.removeChild(no.firstChild);}
  function dataBR(iso){if(!dataValida(iso))return'não informado';var p=iso.split('-');return p[2]+'/'+p[1]+'/'+p[0];}
  function periodo(e){var i=dataBR((e||{}).entrada),f=dataBR((e||{}).saida||(e||{}).entrada);return i==='não informado'&&f==='não informado'?'Período não informado':i+' a '+f;}
  function container(root){return root&&root.document?root.document.getElementById('histCiConteudo'):null;}
  function campo(doc,ui,chave,rotulo,tipo){ var caixa=el(doc,'label','hist-ci-campo-grupo'), lab=el(doc,'span','hist-ci-rotulo',rotulo), inp=el(doc,'input','hist-ci-campo'); inp.type=tipo; inp.dataset.field=chave; inp.setAttribute('aria-label',rotulo); caixa.appendChild(lab); caixa.appendChild(inp); ui.campos[chave]=inp; return caixa; }
  function montarShell(root,c,s){
    if(s.ui&&s.ui.container===c) return s.ui; limpar(c); var doc=root.document, ui={container:c,campos:{}};
    var cab=el(doc,'div','hist-ci-cabecalho'); cab.appendChild(el(doc,'h2','hist-ci-titulo','Histórico de hospedagens')); cab.appendChild(el(doc,'p','hist-ci-subtitulo','Consulte entradas, conferências, saída e documentos já registrados.')); var at=botao(doc,'Atualizar','atualizar'); at.className+=' hist-ci-secundario'; cab.appendChild(at); c.appendChild(cab);
    var filtros=el(doc,'div','hist-ci-filtros'); var busca=campo(doc,ui,'busca','Animal ou tutor','search'); ui.campos.busca.placeholder='Buscar por nome ou tutor'; ui.campos.busca.setAttribute('aria-label','Buscar por animal ou tutor'); filtros.appendChild(busca); filtros.appendChild(campo(doc,ui,'inicio','Hospedado entre','date')); filtros.appendChild(campo(doc,ui,'fim','Hospedado até','date'));
    var estadoCaixa=el(doc,'label','hist-ci-campo-grupo'), estadoLab=el(doc,'span','hist-ci-rotulo','Estado da conferência'), estado=el(doc,'select','hist-ci-campo'); estado.dataset.field='estado'; estado.setAttribute('aria-label','Estado da conferência'); [['todos','Todas as situações'],['conferida','Conferência concluída'],['pendente','Conferência pendente']].forEach(function(x){var o=el(doc,'option','',x[1]);o.value=x[0];estado.appendChild(o);}); estadoCaixa.appendChild(estadoLab);estadoCaixa.appendChild(estado);ui.campos.estado=estado;filtros.appendChild(estadoCaixa);c.appendChild(filtros);
    ui.corpo=el(doc,'div','hist-ci-corpo');c.appendChild(ui.corpo);s.ui=ui;return ui;
  }
  function sincronizarCampos(root,s){var ui=s.ui;if(!ui)return;var ativo=root.document.activeElement;Object.keys(ui.campos).forEach(function(k){var no=ui.campos[k];if(no!==ativo&&no.value!==s.filtros[k])no.value=s.filtros[k];});}
  function renderAviso(doc,corpo,mensagem,tipo){corpo.appendChild(el(doc,'div','pm-card hist-ci-aviso hist-ci-'+tipo,mensagem));}
  function render(root){
    var c=container(root),s=novoEstado(root);if(!c)return;
    if(!permitido(root)){limparFotosRestritas(root,s);s.ui=null;limpar(c);renderAviso(root.document,c,'Você não tem permissão para consultar este histórico.','negado');return;}
    var ui=montarShell(root,c,s),doc=root.document;sincronizarCampos(root,s);limpar(ui.corpo);
    if(s.carregando){renderAviso(doc,ui.corpo,'Carregando histórico salvo…','carregando');return;}
    if(s.erro){renderAviso(doc,ui.corpo,'Não foi possível carregar o histórico. '+s.erro,'erro');ui.corpo.appendChild(botao(doc,'Tentar novamente','tentar'));return;}
    if(!s.mapa){renderAviso(doc,ui.corpo,'O histórico ainda não está disponível.','erro');ui.corpo.appendChild(botao(doc,'Tentar novamente','tentar'));return;}
    if(datasInvalidas(s.filtros)){renderAviso(doc,ui.corpo,'A data final deve ser igual ou posterior à inicial.','erro');return;}
    var lista=filtrar(s.mapa,s.filtros,root);if(s.selecionado){var detalhe=lista.filter(function(r){return r.id===s.selecionado;})[0];if(detalhe){renderDetalhe(root,ui.corpo,detalhe,s);return;}s.selecionado='';}
    renderLista(root,ui.corpo,lista,s);
  }
  function renderLista(root,corpo,lista,s){
    var doc=root.document,total=lista.length,paginas=Math.max(1,Math.ceil(total/s.porPagina));if(s.pagina>paginas)s.pagina=paginas;corpo.appendChild(el(doc,'p','hist-ci-contagem',total+' histórico'+(total===1?'':'s')+' encontrado'+(total===1?'':'s')+'.'));
    if(!total){renderAviso(doc,corpo,'Nenhum histórico corresponde aos filtros.','vazio');return;}
    var grade=el(doc,'div','hist-ci-lista'),inicio=(s.pagina-1)*s.porPagina;lista.slice(inicio,inicio+s.porPagina).forEach(function(r){var b=botao(doc,'','abrir');b.className='pm-card hist-ci-card';b.dataset.id=r.id;b.setAttribute('aria-label','Abrir detalhes de '+(r.e.nome||'estadia'));var nome=el(doc,'strong','hist-ci-nome',r.e.nome||'Animal não informado');nome.appendChild(el(doc,'span','hist-ci-tutor',' · '+(r.e.tutor||'Tutor não informado')));b.appendChild(nome);b.appendChild(el(doc,'span','hist-ci-periodo',periodo(r.e)));b.appendChild(el(doc,'span','hist-ci-autor','Check-in: '+r.resumo.checkinPor+' · '+r.resumo.checkinQuando));var conf=r.resumo.conferenciaConcluida?'Conferência: '+r.resumo.conferenciaPor+' · '+r.resumo.conferenciaQuando:'Conferência pendente';b.appendChild(el(doc,'span','hist-ci-autor',conf));b.appendChild(el(doc,'span',r.resumo.conferenciaConcluida?'hist-ci-estado concluida':'hist-ci-estado pendente',r.resumo.conferenciaConcluida?'Conferida':'Pendente'));grade.appendChild(b);});corpo.appendChild(grade);
    if(paginas>1){var nav=el(doc,'nav','hist-ci-paginacao');nav.setAttribute('aria-label','Paginação do histórico');var ant=botao(doc,'Anterior','pagina-anterior');ant.disabled=s.pagina===1;var prox=botao(doc,'Próxima','pagina-proxima');prox.disabled=s.pagina===paginas;nav.appendChild(ant);nav.appendChild(el(doc,'span','hist-ci-pagina','Página '+s.pagina+' de '+paginas));nav.appendChild(prox);corpo.appendChild(nav);}
  }
  function linha(doc,r,v){var p=el(doc,'p','hist-ci-linha');p.appendChild(el(doc,'strong','',r+': '));p.appendChild(doc.createTextNode(v));return p;}
  function temValor(v){return texto(v).trim()!=='';}
  function pessoaHora(pessoa,quando){return (temValor(pessoa)?texto(pessoa).trim():'não registrado')+' · '+dataHora(quando);}
  function temCheckout(e){
    var co=(e||{}).checkout;
    return !!co&&typeof co==='object'&&!Array.isArray(co)&&Object.keys(co).some(function(k){var v=co[k];return k==='semTutor'?v===true:(Array.isArray(v)?v.length>0:(v&&typeof v==='object'?Object.keys(v).length>0:temValor(v)));});
  }
  function temDadosConferencia(c){return Object.keys(c||{}).some(function(k){if(k==='concluida')return false;var v=c[k];if(Array.isArray(v))return v.length>0;if(v&&typeof v==='object')return Object.keys(v).length>0;return temValor(v);});}
  function etapa(doc,titulo,descricao,estado){var li=el(doc,'li','hist-ci-etapa '+(estado||''));li.appendChild(el(doc,'strong','',titulo));li.appendChild(el(doc,'span','',descricao));return li;}
  function renderResumoEtapas(doc,d,e,r){
    var c=e.conferencia||{}, e1=e.checkout_etapa1||{}, co=e.checkout||{}, bolsaPor=temValor(e1.quem)?e1.quem:co.bolsa_montada_por, bolsaEm=temValor(e1.ts)?e1.ts:co.bolsa_montada_em, conferenciaParcial=temDadosConferencia(c);
    var bloco=el(doc,'section','hist-ci-resumo-etapas');bloco.setAttribute('aria-label','Resumo do fluxo da hospedagem');bloco.appendChild(el(doc,'h4','', 'Resumo da hospedagem'));
    var lista=el(doc,'ol','hist-ci-etapas');
    lista.appendChild(etapa(doc,'Check-in','Consultora: '+pessoaHora(e.criado_por,e._ts),'registrada'));
    lista.appendChild(etapa(doc,'Conferência do check-in',c.concluida===true?'Monitor: '+pessoaHora(c.concluida_por,c.concluida_ts):(conferenciaParcial?'Pendente de conclusão · monitor e horário não registrados':'não registrada'),''+(c.concluida===true?'registrada':(conferenciaParcial?'pendente':'ausente'))));
    lista.appendChild(etapa(doc,'Check-out',(temValor(bolsaPor)||temValor(bolsaEm))?'Monitor: '+pessoaHora(bolsaPor,bolsaEm):'não registrado',''+((temValor(bolsaPor)||temValor(bolsaEm))?'registrada':'ausente')));
    var saida=temValor(co.quem)||temValor(co.ts)?'Consultora: '+pessoaHora(co.quem,co.ts):(co.semTutor===true?'Retirada sem o tutor':'não registrada');if(co.semTutor===true&&saida!=='Retirada sem o tutor')saida='Retirada sem o tutor · '+saida;
    lista.appendChild(etapa(doc,'Conferência do check-out',saida,''+(temValor(co.quem)||temValor(co.ts)||co.semTutor===true?'registrada':'ausente')));
    bloco.appendChild(lista);d.appendChild(bloco);
  }
  function seguroImagem(url){var v=texto(url).trim();return /^data:image\/(?:jpeg|png|webp);base64,[a-z0-9+/=\s]+$/i.test(v)||/^https:\/\/[^\s]+$/i.test(v);}
  function detalhesSecao(doc,titulo,resultado,classe){
    var d=el(doc,'details','hist-ci-grupo '+(classe||'')), sm=el(doc,'summary','',titulo), corpo=el(doc,'div','hist-ci-grupo-corpo');d.appendChild(sm);
    if(!resultado||resultado.ok!==true){corpo.appendChild(el(doc,'p','hist-ci-erro','Não foi possível exibir esta seção.'));d.appendChild(corpo);return d;}
    var secoes=resultado.secoes;
    if(!Array.isArray(secoes)||!secoes.length){corpo.appendChild(el(doc,'p','hist-ci-linha','Nenhum registro disponível.'));}
    else secoes.forEach(function(sec){var s=el(doc,'section','hist-ci-secao'), h=texto(sec&&sec.titulo).trim();if(/^extrato salvo/i.test(h))return;if(h)s.appendChild(el(doc,'h5','',h));(Array.isArray(sec&&sec.linhas)?sec.linhas:[]).forEach(function(l){if(l&&Object.prototype.hasOwnProperty.call(l,'t'))s.appendChild(el(doc,'p','hist-ci-linha',texto(l.t)));else if(l){var p=el(doc,'p','hist-ci-linha');p.appendChild(el(doc,'strong','',texto(l.k)+': '));p.appendChild(doc.createTextNode(texto(l.v)));s.appendChild(p);}});corpo.appendChild(s);});
    d.appendChild(corpo);return d;
  }
  function obterSecoes(root,nome,e){try{var fn=root&&root[nome];if(typeof fn!=='function')return {ok:false};var secoes=fn(e);return Array.isArray(secoes)?{ok:true,secoes:secoes}:{ok:false};}catch(x){return {ok:false};}}
  function resultadoEtapaCheckout(resultado,e,etapa){
    if(!resultado||resultado.ok!==true)return {ok:false};
    var padrao=etapa===3?/^ETAPA\s*3\b|CHECK-OUT.*BOLSA/i:/^ETAPA\s*4\b|CONFER[ÊE]NCIA.*CHECK-OUT|^ITENS QUE N[ÃA]O DESCERAM/i;
    var secoes=resultado.secoes.filter(function(sec){return padrao.test(texto(sec&&sec.titulo));});
    if(secoes.length)return {ok:true,secoes:secoes};
    if(etapa===3)return {ok:true,secoes:[]};
    return {ok:true,secoes:[{titulo:'Conferência do check-out não registrada',linhas:[{t:'Nenhuma conferência final foi registrada.'}]}]};
  }
  function renderFotos(root,doc,d,s,id){
    var area=el(doc,'section','hist-ci-fotos');area.setAttribute('aria-live','polite');var fotos=s.fotos.cache[id];
    if(s.fotos.carregando[id]) area.appendChild(el(doc,'p','hist-ci-linha','Carregando fotos da conferência do check-in…'));
    else if(s.fotos.erro[id]){area.appendChild(el(doc,'p','hist-ci-erro','Não foi possível carregar as fotos da conferência do check-in.'));area.appendChild(botao(doc,'Tentar novamente','fotos'));}
    else if(Array.isArray(fotos)){if(!fotos.length)area.appendChild(el(doc,'p','hist-ci-linha','Nenhuma foto da conferência do check-in foi registrada.'));else {var grade=el(doc,'div','hist-ci-miniaturas');fotos.forEach(function(src,i){var b=botao(doc,'Abrir foto '+(i+1),'foto-ampliar');b.dataset.src=src;b.dataset.indice=String(i+1);var img=doc.createElement('img');img.src=src;img.alt='Foto '+(i+1)+' da conferência do check-in';img.loading='lazy';img.referrerPolicy='no-referrer';img.addEventListener('error',function(){falhaImagem(root,id);});b.appendChild(img);grade.appendChild(b);});area.appendChild(grade);}}
    else area.appendChild(botao(doc,'Ver fotos da conferência do check-in','fotos'));
    d.appendChild(area);
  }
  function abrirFoto(root,src,indice){if(!seguroImagem(src)||!permitido(root))return;var doc=root.document, antigo=doc.getElementById('histCiFotoDialog');if(antigo)antigo.remove();var dia=doc.createElement('dialog');dia.id='histCiFotoDialog';dia.className='hist-ci-dialog';var fechar=botao(doc,'Fechar foto','foto-fechar');var img=doc.createElement('img');img.src=src;img.alt='Foto '+texto(indice)+' da conferência do check-in ampliada';img.referrerPolicy='no-referrer';dia.appendChild(fechar);dia.appendChild(img);doc.body.appendChild(dia);if(typeof dia.showModal==='function')dia.showModal();else dia.setAttribute('open','');fechar.focus();}
  function adicionarAssinatura(doc,alvo,titulo,pessoa,assinatura,semTutor,mensagemSemTutor,etapaRegistrada){
    if(semTutor!==true&&!temValor(pessoa)&&!seguroImagem(assinatura)&&etapaRegistrada!==true)return;
    var grupo=el(doc,'section','hist-ci-evidencia-assinatura');grupo.appendChild(el(doc,'h4','',titulo));
    if(semTutor===true){grupo.appendChild(el(doc,'p','hist-ci-linha',mensagemSemTutor));alvo.appendChild(grupo);return;}
    if(temValor(pessoa))grupo.appendChild(linha(doc,'Assinatura registrada por',texto(pessoa)));
    if(seguroImagem(assinatura)){var img=doc.createElement('img');img.className='hist-ci-assinatura';img.src=assinatura;img.referrerPolicy='no-referrer';img.alt='Assinatura registrada em '+titulo.toLowerCase();grupo.appendChild(img);}
    else grupo.appendChild(el(doc,'p','hist-ci-linha','Nenhuma imagem de assinatura registrada.'));
    alvo.appendChild(grupo);
  }
  function renderDetalhe(root,corpo,r,s){
    var doc=root.document,voltar=botao(doc,'Voltar aos resultados','voltar'),d=el(doc,'section','pm-card hist-ci-detalhe'),h=el(doc,'h3','pm-tit',r.e.nome||'Estadia');h.tabIndex=-1;corpo.appendChild(voltar);d.appendChild(h);d.appendChild(linha(doc,'Tutor',r.e.tutor||'não registrado'));d.appendChild(linha(doc,'Período',periodo(r.e)));renderResumoEtapas(doc,d,r.e,r);adicionarAssinatura(doc,d,'Check-in',r.e.assinado_por,r.e.assinatura,r.e.entregaSemTutor,'Entrada sem a presença do tutor.',true);d.appendChild(detalhesSecao(doc,'Conferência do check-in',obterSecoes(root,'histCiSecoesConferencia',r.e),'hist-ci-conferencia'));renderFotos(root,doc,d,s,r.id);var secoesSaida=obterSecoes(root,'histCiSecoesCheckout',r.e);d.appendChild(detalhesSecao(doc,'Check-out',resultadoEtapaCheckout(secoesSaida,r.e,3),'hist-ci-checkout'));var saida=detalhesSecao(doc,'Conferência do check-out',resultadoEtapaCheckout(secoesSaida,r.e,4),'hist-ci-saida');var co=r.e.checkout||{};adicionarAssinatura(doc,saida,'Conferência do check-out',co.assinado_por,co.assinatura,co.semTutor,'Retirada sem o tutor.',temCheckout(r.e));d.appendChild(saida);
    var a=el(doc,'div','hist-ci-acoes');[['checkin','PDF do check-in'],['conferencia','PDF da conferência de check-in']].forEach(function(par){var b=botao(doc,par[1],'pdf');b.dataset.pdfTipo=par[0];b.dataset.id=r.id;a.appendChild(b);});var out;if(temCheckout(r.e)){out=botao(doc,'PDF da conferência de check-out','pdf');out.dataset.pdfTipo='checkout';out.dataset.id=r.id;}else{out=botao(doc,'Conferência do check-out não registrada','');out.disabled=true;out.className+=' hist-ci-secundario';}a.appendChild(out);d.appendChild(a);var st=el(doc,'p','hist-ci-pdf-status','');st.id='histCiPdfStatus';st.setAttribute('aria-live','polite');d.appendChild(st);corpo.appendChild(d);
    if(s.focoDetalhe){s.focoDetalhe=false;try{h.focus();}catch(e){}}
  }
  function receberEstadias(root,mapa){var s=novoEstado(root);s.mapa=mapa||{};s.carregando=false;s.erro=null;if(s.aberto)render(root);return s.mapa;}
  function carregar(root){
    var s=novoEstado(root);s.aberto=true;if(!permitido(root)){render(root);return Promise.resolve(false);}s.carregando=true;s.erro=null;render(root);
    var leitura;try{if(typeof root.histCiLerEstadias==='function')leitura=root.histCiLerEstadias();else if(root.DB&&typeof root.DB.ref==='function')leitura=root.DB.ref('auaulandia/estadias').once('value');else throw new Error('A conexão de leitura não está disponível.');}catch(e){s.carregando=false;s.erro=texto(e&&e.message||e);render(root);return Promise.resolve(null);}
    return Promise.resolve(leitura).then(function(sn){var v=sn&&typeof sn.val==='function'?sn.val():sn;return receberEstadias(root,v||{});}).catch(function(e){s.carregando=false;s.erro=texto(e&&e.message||e||'Erro de leitura.');render(root);return null;});
  }
  function abrir(root,opcoes){ligar(root);var s=novoEstado(root);s.aberto=true;if(opcoes&&opcoes.atualizar){s.fotos={cache:{},carregando:{},erro:{},pedido:s.fotos.pedido+1};}if(!permitido(root)){render(root);return Promise.resolve(false);}if(!(opcoes&&opcoes.atualizar)&&root.CF_ESTADIAS_LIDO===true){receberEstadias(root,root.EST_TODAS||{});return Promise.resolve(true);}return carregar(root);}
  function limparFotosRestritas(root,s){var d=root&&root.document&&root.document.getElementById('histCiFotoDialog');if(d){if(typeof d.close==='function')d.close();d.remove();}s.fotos={cache:{},carregando:{},erro:{},pedido:(s.fotos&&s.fotos.pedido||0)+1};}
  function falhaImagem(root,id){var s=novoEstado(root);if(!permitido(root)||s.selecionado!==id)return;delete s.fotos.cache[id];s.fotos.erro[id]='imagem indisponível';render(root);}
  function sessaoFotos(root){try{var u=root&&typeof root.usuarioAtual==='function'&&root.usuarioAtual();return u&&temValor(u.id)?texto(u.id):'';}catch(x){return '';}}
  function carregarFotos(root,id){
    var s=novoEstado(root);if(!permitido(root)||!id||Object.prototype.hasOwnProperty.call(s.fotos.cache,id)||s.fotos.carregando[id])return;
    if(typeof root.histCiLerFotos!=='function'){s.fotos.erro[id]='leitura indisponível';render(root);return;}
    var fotosEstado=s.fotos,pedido=++fotosEstado.pedido,sessao=sessaoFotos(root);fotosEstado.carregando[id]=pedido;delete fotosEstado.erro[id];render(root);
    Promise.resolve().then(function(){return root.histCiLerFotos(id);}).then(function(fotos){
      if(s.fotos!==fotosEstado)return;var deste=fotosEstado.carregando[id]===pedido;if(deste)delete fotosEstado.carregando[id];
      if(!permitido(root)){render(root);return;}
      if(!deste||sessao!==sessaoFotos(root)){if(deste)render(root);return;}
      if(!Array.isArray(fotos)||fotos.some(function(url){return !seguroImagem(url);})){fotosEstado.erro[id]='resposta inválida';render(root);return;}
      fotosEstado.cache[id]=fotos;render(root);
    }).catch(function(){if(s.fotos!==fotosEstado)return;var deste=fotosEstado.carregando[id]===pedido;if(deste)delete fotosEstado.carregando[id];if(!permitido(root)){render(root);return;}if(!deste||sessao!==sessaoFotos(root)){if(deste)render(root);return;}fotosEstado.erro[id]='falha';render(root);});
  }
  function restaurarResultado(root,s){s.selecionado='';render(root);var ui=s.ui,alvo=null;if(ui&&ui.corpo){Array.prototype.some.call(ui.corpo.querySelectorAll('[data-action="abrir"]'),function(b){if(b.dataset.id===s.retorno.id){alvo=b;return true;}return false;});}if(alvo){try{alvo.focus();alvo.scrollIntoView({block:'center'});}catch(e){}}else if(s.retorno&&typeof root.scrollTo==='function'){try{root.scrollTo(0,s.retorno.y);}catch(x){}}s.retorno=null;}
  function ligar(root){
    var c=container(root);if(!c||c.dataset.histCiLigado==='1')return;c.dataset.histCiLigado='1';
    function mudar(ev){var campo=ev.target&&ev.target.dataset&&ev.target.dataset.field;if(!campo)return;var s=novoEstado(root),valor=ev.target.value;if(s.filtros[campo]===valor)return;s.filtros[campo]=valor;s.pagina=1;s.selecionado='';render(root);}
    c.addEventListener('input',mudar);c.addEventListener('change',mudar);
    c.addEventListener('click',function(ev){var b=ev.target&&ev.target.closest?ev.target.closest('[data-action]'):null;if(!b||!c.contains(b))return;var s=novoEstado(root),acao=b.dataset.action;if(acao==='abrir'){s.retorno={id:b.dataset.id||'',y:Number(root.scrollY)||0};s.selecionado=b.dataset.id||'';s.focoDetalhe=true;render(root);}else if(acao==='voltar'){restaurarResultado(root,s);}else if(acao==='pagina-anterior'){s.pagina=Math.max(1,s.pagina-1);render(root);}else if(acao==='pagina-proxima'){s.pagina++;render(root);}else if(acao==='atualizar'||acao==='tentar'){abrir(root,{atualizar:true});}else if(acao==='fotos'){carregarFotos(root,s.selecionado);}else if(acao==='foto-ampliar'){abrirFoto(root,b.dataset.src,b.dataset.indice);}else if(acao==='pdf'){var r=(s.mapa||{})[b.dataset.id||''];if(r&&typeof root.histCiPdfBaixar==='function')root.histCiPdfBaixar(b.dataset.pdfTipo,{id:b.dataset.id,e:r});}});
    root.document.addEventListener('click',function(ev){var b=ev.target&&ev.target.closest?ev.target.closest('[data-action="foto-fechar"]'):null;if(b){var d=root.document.getElementById('histCiFotoDialog');if(d){if(typeof d.close==='function')d.close();d.remove();}}});
  }
  return {normalizar:normalizar,periodoSobrepoe:periodoSobrepoe,datasInvalidas:datasInvalidas,resumoPadrao:resumoPadrao,filtrar:filtrar,permitido:permitido,estadoFonte:estadoFonte,ligar:ligar,abrir:abrir,receberEstadias:receberEstadias,carregar:carregar,seguroImagem:seguroImagem,temCheckout:temCheckout,temDadosConferencia:temDadosConferencia};
});
