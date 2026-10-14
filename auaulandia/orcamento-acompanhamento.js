/*
 * Acompanhamento de orçamentos — módulo isolado para os painéis de Consultoras e Amanda.
 *
 * Lê o mapa de orçamentos já compartilhado pelo painel. As escritas ficam DENTRO do
 * orçamento, em `acompanhamento`, e usam transaction + revisão para não apagar a edição
 * concorrente de outra pessoa. Cada escrita usa um listener temporário no registro para
 * confirmar a leitura antes da transação; não cria listener permanente, não envia mensagem
 * e não muda status, reserva, calendário ou financeiro.
 */
(function(root, factory){
  var api=factory(root||{});
  if(typeof module==='object' && module.exports) module.exports=api;
  if(root) root.OrcAcompanhamento=api;
})(typeof window!=='undefined'?window:globalThis, function(root){
  'use strict';
  var FECHADOS={fechado:1,cancelado:1,anulado:1};
  var ACOES={assumir:1,atribuir:1,trocar_responsavel:1,pausar_protocolo:1,retomar:1,registrar:1,concluir:1};
  var LIMITE=3, state={consultoras:{mais:false,cache:null,opcoes:null},amanda:{mais:false,cache:null,opcoes:null}};

  function texto(v){ return String(v==null?'':v).trim(); }
  function esc(v){ return texto(v).replace(/[&<>'"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]; }); }
  function isoHoje(){ var d=new Date(), p=function(n){ return String(n).padStart(2,'0'); }; return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate()); }
  function hojeDaFila(opcoes){ return (opcoes&&opcoes.teste===true&&dataValida(opcoes.hoje))?opcoes.hoje:isoHoje(); }
  function listaPets(o){ var p=o&&o.pets; if(!Array.isArray(p)) p=p&&typeof p==='object'?Object.keys(p).map(function(k){return p[k];}):[]; return p; }
  function nomes(o){ var n=listaPets(o).map(function(p){return texto(p&&p.nome);}).filter(Boolean); return n.join(' e ')||'Família sem nomes registrados'; }
  function tutor(o){ return texto((o&&o.tutor)||((listaPets(o)[0]||{}).tutor)); }
  function revisao(o){ return Number((((o||{}).acompanhamento||{}).revisao)||0); }
  function fonteDe(o){ o=o||{}; return {status:texto(o.status||'aguardando'),entrada:texto(o.entrada),saida:texto(o.saida)}; }
  function mesmaFonte(a,b){ a=a||{}; b=b||{}; return texto(a.status)===texto(b.status)&&texto(a.entrada)===texto(b.entrada)&&texto(a.saida)===texto(b.saida); }
  function abertoPeloStatus(o){ return !FECHADOS[texto((o||{}).status||'aguardando')]; }
  // Adaptador compartilhado pelos dois dashboards e pela tela de orçamento: a função do
  // app mantém a coleção inteira em ORC_VIVOS por três minutos e também compartilha a
  // Promise quando as duas telas abrem juntas. Sem ela, a tela mostra falha; não retorna
  // para o recorte de 60 e não oculta propostas antigas abertas.
  function lerOrcamentos(forcar){
    if(typeof root.orcLerVivos!=='function') return Promise.resolve({ok:false,v:null});
    return root.orcLerVivos(forcar===true).then(function(r){ return r&&r.ok?{ok:true,v:r.todos||{}}:{ok:false,v:null}; });
  }
  function dataValida(v){
    v=texto(v); if(!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
    var p=v.split('-'), d=new Date(Date.UTC(Number(p[0]),Number(p[1])-1,Number(p[2])));
    return d.getUTCFullYear()===Number(p[0]) && d.getUTCMonth()===Number(p[1])-1 && d.getUTCDate()===Number(p[2]);
  }
  function idValido(v){ return /^[A-Za-z0-9_-]+$/.test(texto(v)); }
  function noPassado(v, hoje){ return dataValida(v)&&v<hoje; }
  function proximaPadrao(o, hoje){
    var passado=dataValida(o.entrada)&&o.entrada<hoje;
    return passado?{acao:'Registrar o que ocorreu',data:hoje,legado:true,periodoEncerrado:true}
      :{acao:'Definir próximo passo',data:hoje,legado:true,periodoEncerrado:false};
  }
  function projetar(id, o, opcoes){
    opcoes=opcoes||{}; o=o||{}; var hoje=hojeDaFila(opcoes), a=o.acompanhamento||{};
    var status=texto(o.status||'aguardando'), estado=texto(a.estado||'ativo');
    if(FECHADOS[status] || (status==='nao_fechou' && texto((o.nao_fechou||{}).texto||((o.nao_fechou||{}).motivo)))) estado='fechado';
    var prox=a.proxima_acao||null;
    if(estado==='ativo' && (dataValida(o.entrada)&&o.entrada<hoje)) prox=proximaPadrao(o,hoje);
    else if(estado==='ativo' && (!prox||!texto(prox.acao)||!dataValida(prox.data))) prox=proximaPadrao(o,hoje);
    var pausa=a.pausa||null;
    if(estado!=='fechado' && pausa && texto(pausa.codigo)==='protocolo_convivencia') estado='pausado';
    return {
      id:String(id), nomes:nomes(o), tutor:tutor(o), entrada:texto(o.entrada), saida:texto(o.saida), fonte:fonteDe(o),
      status:texto(o.status||'aguardando'), estado:estado, responsavel:a.responsavel||null,
      proxima:prox, pausa:pausa, historico:a.historico||{}, revisao:revisao(o),
      periodoEncerrado:!!(prox&&prox.periodoEncerrado), atrasado:!!(estado==='ativo'&&prox&&noPassado(prox.data,hoje)),
      contatoPermitido:!(estado==='pausado' && pausa && pausa.contato_automatico===false)
    };
  }
  function ordenar(a,b){
    var aa=(a.proxima&&a.proxima.data)||'9999-12-31', bb=(b.proxima&&b.proxima.data)||'9999-12-31';
    if(aa!==bb) return aa<bb?-1:1;
    return a.id<b.id?-1:a.id>b.id?1:0;
  }
  function projetarMapa(mapa, opcoes){
    if(mapa==null) return null;
    return Object.keys(mapa||{}).map(function(id){ return projetar(id,mapa[id],opcoes); }).sort(ordenar);
  }
  function pendentes(mapa, opcoes){ return (projetarMapa(mapa,opcoes)||[]).filter(function(x){ return x.estado==='ativo'; }); }
  function pausados(mapa, opcoes){ return (projetarMapa(mapa,opcoes)||[]).filter(function(x){ return x.estado==='pausado'; }); }
  function papelDe(usuario){ return texto((usuario||{}).role||(usuario||{}).papel).toLowerCase(); }
  function podeAtuar(usuario){ return ['consultora','supervisor','gestao','diretoria'].indexOf(papelDe(usuario))>=0; }
  function podeDistribuir(usuario){ return ['supervisor','gestao','diretoria'].indexOf(papelDe(usuario))>=0; }
  function equipeElegivel(lista){
    return (lista||[]).filter(function(x){
      if(!x||!texto(x.id)||!texto(x.nome)||x.ativo===false||x.desativado===true) return false;
      return ['consultora','supervisor','gestao'].indexOf(papelDe(x))>=0;
    });
  }
  function identidade(usuario){
    usuario=usuario||{}; var nome=texto(usuario.pessoa||usuario.nome), id=texto(usuario.monId||usuario.id||usuario.uid);
    return {id:id||nome.toLowerCase().replace(/[^a-z0-9]+/g,'-'), nome:nome, papel:papelDe(usuario), valida:!!nome};
  }
  function erro(codigo,mensagem){ return {ok:false,codigo:codigo,erro:mensagem}; }
  function validarPedido(acao, pedido, usuario){
    pedido=pedido||{};
    if(!ACOES[acao]) return erro('ACAO_INVALIDA','Ação de acompanhamento inválida.');
    if(!identidade(usuario).valida) return erro('IDENTIDADE_AUSENTE','Entre novamente com sua conta para registrar esta ação.');
    if(!podeAtuar(usuario)) return erro('SEM_PERMISSAO','Seu perfil não pode registrar acompanhamento de orçamento.');
    if(['atribuir','trocar_responsavel'].indexOf(acao)>=0 && !podeDistribuir(usuario)) return erro('SEM_PERMISSAO','Somente Amanda/gestão pode distribuir ou trocar a responsável.');
    if(acao==='pausar_protocolo' && pedido.protocoloConfirmado!==true)
      return erro('PROTOCOLO_NAO_CONFIRMADO','A pausa por protocolo só pode ser registrada após confirmação explícita da consultora.');
    if(acao==='retomar' && pedido.retomadaConfirmada!==true)
      return erro('RETOMADA_NAO_CONFIRMADA','Retome somente após solicitação ou acordo explícito da família.');
    if(['registrar','assumir','atribuir','trocar_responsavel','retomar'].indexOf(acao)>=0 && pedido.estado!=='pausado'){
      if(!texto(pedido.proximaAcao)||!dataValida(pedido.proximaData)) return erro('PROXIMA_ACAO','Orçamento ativo precisa de próxima ação e data.');
    }
    if((acao==='registrar'||acao==='concluir') && texto(pedido.resultado)==='nao_fechou' && !texto(pedido.motivoNaoFechamento))
      return erro('MOTIVO_NAO_FECHAMENTO','Registre o motivo informado ou “motivo não informado”; “sem resposta” é outro resultado.');
    if(acao==='concluir' && ['nao_fechou','sem_resposta'].indexOf(texto(pedido.resultado))<0)
      return erro('RESULTADO_FINAL','Concluir acompanhamento exige “não fechou” ou “sem resposta” como resultado registrado.');
    if((acao==='atribuir'||acao==='trocar_responsavel') && (!idValido(pedido.responsavelId)||!texto(pedido.responsavelNome)))
      return erro('RESPONSAVEL_INVALIDA','Escolha uma pessoa ativa do Time.');
    return {ok:true};
  }
  function chaveHistorico(db, caminho, agora){
    try{ var k=db.ref(caminho).push().key; if(k) return String(k); }catch(e){}
    return 'local-'+String(agora)+'-'+Math.random().toString(36).slice(2,8);
  }
  function existeSnapshot(s){
    if(!s) return false;
    try{ if(typeof s.exists==='function') return s.exists(); }catch(e){}
    try{ return s.val()!=null; }catch(e){ return false; }
  }
  // O listener é propositalmente curto: ele aquece/confirma a referência antes da
  // transação e fica ligado durante ela. Em RTDB, abortar no primeiro `null` local pode
  // impedir a chegada do valor remoto; escrever uma cópia nesse null poderia recriar um
  // orçamento apagado. Portanto, sem snapshot confirmado, não há transação.
  function prepararRegistro(db, caminho){
    var ref=db.ref(caminho), observador=function(){}, ligado=false;
    try{ if(ref&&typeof ref.on==='function'){ ref.on('value',observador,function(){}); ligado=true; } }catch(e){}
    var desligar=function(){ if(ligado){ try{ ref.off('value',observador); }catch(e){} ligado=false; } };
    if(!ref||typeof ref.once!=='function') return {ref:ref, pronto:Promise.reject(new Error('leitura indisponível')),desligar:desligar};
    return {ref:ref, pronto:Promise.resolve(ref.once('value')),desligar:desligar};
  }
  function copiar(o){ return JSON.parse(JSON.stringify(o||{})); }
  function aplicar(o, acao, pedido, ator, agora, chave){
    var novo=copiar(o), a=novo.acompanhamento||{}, h=a.historico||{}, evento={
      tipo:acao, autor:{id:ator.id,nome:ator.nome,papel:ator.papel}, ts:agora,
      canal:texto(pedido.canal), texto:texto(pedido.texto), resultado:texto(pedido.resultado),
      motivo_nao_fechamento:texto(pedido.motivoNaoFechamento), proxima_acao:texto(pedido.proximaAcao), proxima_data:texto(pedido.proximaData)
    };
    if(acao==='assumir') a.responsavel={id:ator.id,nome:ator.nome,atribuido_por:ator.nome,atribuido_ts:agora};
    if(acao==='atribuir'||acao==='trocar_responsavel'){
      var anterior=a.responsavel||null;
      a.responsavel={id:texto(pedido.responsavelId),nome:texto(pedido.responsavelNome),atribuido_por:ator.nome,atribuido_ts:agora};
      evento.responsavel_anterior=anterior; evento.responsavel_nova={id:a.responsavel.id,nome:a.responsavel.nome};
    }
    if(acao==='pausar_protocolo'){
      a.estado='pausado';
      a.pausa={codigo:'protocolo_convivencia',motivo:texto(pedido.motivo)||'Condição incompatível com o protocolo de convivência atual',contato_automatico:false,registrado_por:ator.nome,registrado_ts:agora};
      delete a.proxima_acao;
      evento.texto=a.pausa.motivo; evento.contato_automatico=false;
    } else if(acao==='retomar'){
      a.estado='ativo'; delete a.pausa;
      a.proxima_acao={acao:texto(pedido.proximaAcao),data:texto(pedido.proximaData),definida_por:ator.nome,definida_ts:agora};
      evento.retomada_confirmada=true;
    } else if(acao!=='concluir') {
      a.estado='ativo';
      a.proxima_acao={acao:texto(pedido.proximaAcao),data:texto(pedido.proximaData),definida_por:ator.nome,definida_ts:agora};
    }
    if(acao==='concluir'){ a.estado='fechado'; delete a.proxima_acao; }
    h[chave]=evento; a.historico=h; a.revisao=(Number(a.revisao)||0)+1; a.atualizado_por=ator.nome; a.atualizado_ts=agora;
    novo.acompanhamento=a; return novo;
  }
  function salvar(db, id, acao, pedido, usuario, opcoes){
    opcoes=opcoes||{}; if(!idValido(id)) return Promise.resolve(erro('ID_INVALIDO','Identificador de orçamento inválido.'));
    var valid=validarPedido(acao,pedido,usuario); if(!valid.ok) return Promise.resolve(valid);
    if(!db||!db.ref) return Promise.resolve(erro('SEM_CONEXAO','Sem conexão com o banco. Nada foi gravado.'));
    var ator=identidade(usuario), agora=Number(opcoes.agora||Date.now()), caminho='auaulandia/orcamentos/'+id,
        chave=chaveHistorico(db,caminho+'/acompanhamento/historico',agora), esperado=Number(pedido.revisao), falha='', preparo=prepararRegistro(db,caminho);
    return preparo.pronto.then(function(s){
      if(!existeSnapshot(s)) return erro('INEXISTENTE','Este orçamento não existe mais. Nada foi gravado.');
      return preparo.ref.transaction(function(atual){
      if(!atual) return;
      if(!abertoPeloStatus(atual)){ falha='FONTE_ENCERRADA'; return; }
      if(!mesmaFonte(fonteDe(atual),pedido.fonte)){ falha='FONTE_MUDOU'; return; }
      if(Number((((atual||{}).acompanhamento||{}).revisao)||0)!==esperado){ falha='CONFLITO'; return; }
      var acompAtual=((atual||{}).acompanhamento||{}), estadoAtual=texto(acompAtual.estado||'ativo'), atualResp=acompAtual.responsavel||{};
      if(acao==='retomar' && estadoAtual!=='pausado'){ falha='ESTADO_ATUAL'; return; }
      if(['registrar','assumir','atribuir','trocar_responsavel','pausar_protocolo','concluir'].indexOf(acao)>=0 && estadoAtual!=='ativo'){
        falha='ESTADO_ATUAL'; return;
      }
      if(acao==='assumir' && texto(atualResp.id) && texto(atualResp.id)!==ator.id){ falha='RESPONSAVEL_JA_ATRIBUIDA'; return; }
      return aplicar(atual,acao,pedido,ator,agora,chave);
      }).then(function(r){
      if(!r||!r.committed){
        if(falha==='FONTE_ENCERRADA') return erro(falha,'Este orçamento já foi encerrado em outro aparelho. Nada foi gravado.');
        if(falha==='FONTE_MUDOU') return erro(falha,'A situação ou as datas deste orçamento mudaram em outro aparelho. Atualize a lista antes de registrar.');
        if(falha==='RESPONSAVEL_JA_ATRIBUIDA') return erro(falha,'Outra pessoa já assumiu este orçamento. Atualize a lista antes de continuar.');
        if(falha==='ESTADO_ATUAL') return erro(falha,'Este acompanhamento mudou de situação em outro aparelho. Atualize a lista antes de continuar.');
        return erro('CONFLITO','Este orçamento mudou em outro aparelho. Atualize a lista antes de registrar.');
      }
      return {ok:true,orcamento:r.snapshot&&r.snapshot.val?r.snapshot.val():null,ator:ator};
      });
    }).catch(function(e){ return erro('FALHA_GRAVACAO','Não foi possível salvar agora. O formulário foi preservado.'); }).then(function(r){ preparo.desligar(); return r; },function(e){ preparo.desligar(); throw e; });
  }
  function badge(item){
    if(item.estado==='fechado') return '<span class="pm-badge pm-b-ok">concluído</span>';
    if(item.estado==='pausado') return '<span class="pm-badge pm-b-info">pausado por protocolo</span>';
    if(item.periodoEncerrado) return '<span class="pm-badge pm-b-ouro">período já passou</span>';
    if(item.atrasado) return '<span class="pm-badge pm-b-critico">retorno atrasado</span>';
    return '<span class="pm-badge pm-b-ouro">próxima ação</span>';
  }
  function historicoAberto(tipo,id){ return !!(state[tipo]&&state[tipo].historicoId===id); }
  function dataHistorico(ts){ return Number(ts)?new Date(Number(ts)).toLocaleString('pt-BR'):'horário não disponível'; }
  function historicoHTML(item){
    var h=item.historico||{}, chaves=Object.keys(h).sort(function(a,b){return (Number((h[b]||{}).ts)||0)-(Number((h[a]||{}).ts)||0);});
    if(!chaves.length) return '<div class="oa-historico hint">Sem histórico de acompanhamento.</div>';
    return '<div class="oa-historico pm-lista">'+chaves.map(function(k){
      var x=h[k]||{}, autor=(x.autor&&x.autor.nome)?x.autor.nome:'autoria não disponível', resultado=x.resultado||x.tipo||'registro';
      return '<div class="pm-li"><div class="pm-li-txt"><b>'+esc(dataHistorico(x.ts))+' · '+esc(autor)+'</b><span>'+esc(resultado)+(x.texto?': '+esc(x.texto):'')+(x.motivo_nao_fechamento?' · motivo: '+esc(x.motivo_nao_fechamento):'')+'</span></div></div>';
    }).join('')+'</div>';
  }
  function linha(item, tipo){
    var p=item.proxima||{}, responsavel=item.responsavel&&item.responsavel.nome?item.responsavel.nome:'sem responsável';
    var detalhe=item.estado==='pausado'
      ? 'Sem contato automático. '+esc((item.pausa||{}).motivo||'Motivo registrado.')
      : esc(p.acao||'Definir próximo passo')+' · '+esc(p.data||'sem data')+' · '+esc(responsavel);
    var acoes='';
    var rotHist=historicoAberto(tipo,item.id)?'Fechar histórico':'Ver histórico';
    if(item.estado==='ativo') acoes=(!item.responsavel||item.responsavel.id===identidade(usuarioAgora()).id?'<button type="button" class="btn" data-oa="assumir" data-oid="'+esc(item.id)+'">Vou cuidar</button>':'')
      +'<button type="button" class="btn" data-oa="registrar" data-oid="'+esc(item.id)+'">Registrar</button>'
      +'<button type="button" class="btn" data-oa="pausar_protocolo" data-oid="'+esc(item.id)+'">Pausar por protocolo</button>'
      +'<button type="button" class="btn" data-oa="concluir" data-oid="'+esc(item.id)+'">Concluir acompanhamento</button>'
      +'<button type="button" class="btn" data-oa="historico" data-oid="'+esc(item.id)+'">'+rotHist+'</button>'
      +(tipo==='amanda'?'<button type="button" class="btn" data-oa="trocar_responsavel" data-oid="'+esc(item.id)+'">Distribuir</button>':'');
    if(item.estado==='pausado') acoes='<button type="button" class="btn" data-oa="retomar" data-oid="'+esc(item.id)+'">Retomar com acordo</button><button type="button" class="btn" data-oa="historico" data-oid="'+esc(item.id)+'">'+rotHist+'</button>';
    if(item.estado==='fechado') acoes='<button type="button" class="btn" data-oa="historico" data-oid="'+esc(item.id)+'">'+rotHist+'</button>';
    return '<div class="pm-li oa-item" data-oa-item="'+esc(item.id)+'">'+badge(item)+'<div class="pm-li-txt"><b>'+esc(item.nomes)+'</b>'
      +(item.tutor?'<span>tutor: '+esc(item.tutor)+'</span>':'')+'<span>'+detalhe+'</span>'+acoes+'</div>'+(historicoAberto(tipo,item.id)?historicoHTML(item):'')+'</div>';
  }
  function card(tipo, mapa, opcoes){
    if(mapa==null) return '<article class="pm-card"><h3 class="pm-tit">Acompanhamento de orçamentos</h3><p class="pm-sub">Não foi possível carregar os orçamentos. Atualize a tela.</p></article>';
    var todos=projetarMapa(mapa,opcoes)||[], ativos=todos.filter(function(x){return x.estado==='ativo';}), paus=todos.filter(function(x){return x.estado==='pausado';}), concluidos=todos.filter(function(x){return x.estado==='fechado';}), st=state[tipo], max=st&&st.mais?ativos.length:LIMITE, vis=ativos.slice(0,max), detalheMax=st&&st.mais?todos.length:LIMITE;
    var h='<article class="pm-card" id="oa-'+tipo+'"><h3 class="pm-tit">Acompanhamento de orçamentos</h3><p class="pm-sub">Cada contato tem responsável, próxima ação e data. Copiar não significa enviar.</p>'
      +'<button type="button" class="btn" data-oa="atualizar" data-oatipo="'+tipo+'">Atualizar</button>'
      +'<div style="display:flex;gap:14px;flex-wrap:wrap;align-items:flex-end;margin-top:12px"><div><div class="pm-kpi">'+ativos.length+'</div><p class="pm-rot">ativos com acompanhamento</p></div>'
      +'<div><b>'+paus.length+'</b><p class="pm-rot">pausados fora das pendências</p></div></div>';
    if(!ativos.length) h+='<div class="pm-lista"><div class="pm-li"><span class="pm-badge pm-b-ok">sem pendências</span><div class="pm-li-txt"><b>Nenhum orçamento ativo nesta lista.</b></div></div></div>';
    else h+='<div class="pm-lista">'+vis.map(function(x){return linha(x,tipo);}).join('')+'</div>'+(ativos.length>max?'<button type="button" class="btn" data-oa="mais" data-oatipo="'+tipo+'">Ver mais '+(ativos.length-max)+'</button>':'');
    if(paus.length) h+='<details style="margin-top:10px"><summary><strong>Pausados ('+paus.length+')</strong> — fora das pendências</summary><div class="pm-lista">'+paus.slice(0,detalheMax).map(function(x){return linha(x,tipo);}).join('')+(paus.length>detalheMax?'<button type="button" class="btn" data-oa="mais" data-oatipo="'+tipo+'">Ver mais '+(paus.length-detalheMax)+'</button>':'')+'</div></details>';
    if(concluidos.length) h+='<details style="margin-top:10px"><summary><strong>Concluídos ('+concluidos.length+')</strong> — fora das pendências</summary><div class="pm-lista">'+concluidos.slice(0,detalheMax).map(function(x){return linha(x,tipo);}).join('')+(concluidos.length>detalheMax?'<button type="button" class="btn" data-oa="mais" data-oatipo="'+tipo+'">Ver mais '+(concluidos.length-detalheMax)+'</button>':'')+'</div></details>';
    if(st&&st.sucesso) h+='<p class="pm-nota"><strong>Registro salvo.</strong> '+esc(st.sucesso)+'</p>';
    return h+'</article>';
  }
  function usuarioAgora(){ try{ return root.usuarioAtual?root.usuarioAtual():JSON.parse(root.sessionStorage.getItem('zeluz_login')||'null'); }catch(e){return null;} }
  // Estilo isolado da etapa "Acompanhamento de orçamentos". Corrige o item que herda
  // display:flex de .pm-li sem alterar o Design System ou cartões de outros painéis.
  function garantirEstilos(){
    var d=root.document; if(!d||d.getElementById('oa-estilos-acompanhamento')) return;
    var s=d.createElement('style'); s.id='oa-estilos-acompanhamento';
    s.textContent='.oa-mount .oa-item{display:block;min-width:0}.oa-mount .oa-item>.pm-badge{display:inline-block;margin:0 0 6px}.oa-mount .oa-item>.pm-li-txt{display:block;width:100%;min-width:0}.oa-mount .oa-item .oa-form{width:100%;max-width:100%;min-width:0;margin-top:10px}.oa-mount .oa-item .oa-form .cad-in{box-sizing:border-box;max-width:100%;min-width:0}.oa-mount .oa-item .oa-form label{display:block;overflow-wrap:anywhere}.oa-mount .oa-item .btn{min-height:44px;max-width:100%;white-space:normal;overflow-wrap:anywhere;vertical-align:top}@media (max-width:390px){.oa-mount .oa-item .btn{display:block;width:100%;margin:6px 0 0}.oa-mount .oa-item .oa-form{padding:10px!important}}';
    (d.head||d.documentElement).appendChild(s);
  }
  function itemNoRoot(rootEl,id){
    var itens=rootEl&&rootEl.querySelectorAll?rootEl.querySelectorAll('[data-oa-item]'):[];
    for(var i=0;i<itens.length;i++) if(String(itens[i].dataset.oaItem||'')===String(id)) return itens[i];
    return null;
  }
  function abrirFormulario(tipo,id,acao){
    var st=state[tipo], item=(projetarMapa(st.cache,st.opcoes)||[]).filter(function(x){return x.id===id;})[0], alvo=itemNoRoot(st.root,id);
    if(!item||!alvo) return;
    var usuario=usuarioAgora(), ator=identidade(usuario); // Captura a identidade antes de abrir o formulário/modal.
    if((acao==='trocar_responsavel'||acao==='atribuir')&&!podeDistribuir(usuario)){ alert('Somente Amanda/gestão pode distribuir ou trocar a responsável.'); return; }
    if(acao!=='trocar_responsavel'&&!podeAtuar(usuario)){ alert('Seu perfil não pode registrar acompanhamento.'); return; }
    var p=item.proxima||{}, isPausa=acao==='pausar_protocolo', isTroca=acao==='trocar_responsavel', isConcluir=acao==='concluir', isRegistro=(acao==='registrar'||acao==='concluir'), isRetomar=acao==='retomar', equipe=equipeElegivel(st.opcoes.equipe);
    if(isTroca && !equipe.length){ alert('Não foi possível carregar o Time agora. Atualize a tela antes de distribuir este orçamento.'); return; }
    var form='<div class="oa-form" style="margin-top:8px;padding:9px;border:1px solid var(--line);border-radius:10px">'
      +'<div class="hint"><strong>'+esc(ator.nome)+'</strong> será a autora deste registro.</div>'
      +(isTroca?'<label class="cad-lb">Responsável</label><select class="cad-in" data-oaf="responsavel">'+equipe.map(function(x){return '<option value="'+esc(x.id)+'">'+esc(x.nome)+'</option>';}).join('')+'</select>':'')
      +(isPausa?'<label class="cad-lb">Motivo confirmado</label><textarea class="cad-in" data-oaf="motivo">Condição incompatível com o protocolo de convivência atual</textarea><label><input type="checkbox" data-oaf="protocolo"> Protocolo confirmado pela consultora; não gerar contato automático</label>':'')
      +(isRegistro?'<label class="cad-lb">Registro</label><select class="cad-in" data-oaf="resultado"><option value="">Atualização</option><option value="enviado">Envio registrado</option><option value="resposta">Resposta recebida</option><option value="sem_resposta">Sem resposta</option><option value="nao_fechou">Não fechou</option></select><textarea class="cad-in" data-oaf="texto" placeholder="O que ocorreu"></textarea>':'')
      +(!isPausa&&!isConcluir?'<label class="cad-lb">Próxima ação</label><input class="cad-in" data-oaf="acao" value="'+esc(p.acao||'Definir próximo passo')+'"><input type="date" class="cad-in" data-oaf="data" value="'+esc(p.data||hojeDaFila(st.opcoes))+'">':'')
      +(isRegistro?'<label class="cad-lb">Motivo de não fechamento (somente quando aplicável)</label><input class="cad-in" data-oaf="motivoNaoFechamento" value="">':'')
      +(isRetomar?'<label><input type="checkbox" data-oaf="retomada"> A família solicitou ou combinou expressamente esta retomada</label>':'')
      +'<div style="display:flex;gap:8px;margin-top:8px"><button type="button" class="btn btn-gold" data-oa="salvar" data-oatipo="'+tipo+'" data-oid="'+esc(id)+'" data-acao="'+esc(acao)+'" data-revisao="'+item.revisao+'">Salvar</button><button type="button" class="btn" data-oa="cancelar">Cancelar</button></div><div class="hint" data-oast></div></div>';
    var antigo=alvo.querySelector('.oa-form'); if(antigo) antigo.remove(); alvo.insertAdjacentHTML('beforeend',form);
    var aberto=alvo.querySelector('.oa-form'); if(aberto){ aberto.__oaAtor=ator; aberto.__oaFonte=item.fonte; }
  }
  function valor(form,n){ var e=form.querySelector('[data-oaf="'+n+'"]'); return e?(e.type==='checkbox'?e.checked:e.value):''; }
  // Atualiza a memória já existente sem redesenhar o outro painel: se ele tiver um
  // formulário aberto, o rascunho fica intacto e a revisão antiga gera conflito seguro.
  function sincronizarAposGravacao(id, orcamento){
    Object.keys(state).forEach(function(tipo){ if(state[tipo]&&state[tipo].cache) state[tipo].cache[id]=orcamento; });
    try{ if(root.ORC_VIVOS&&root.ORC_VIVOS.todos) root.ORC_VIVOS.todos[id]=orcamento; }catch(e){}
    try{ if(root.ORC_LISTA_CACHE) root.ORC_LISTA_CACHE[id]=orcamento; }catch(e){}
    try{ if(root.PC_CACHE) root.PC_CACHE.quando=0; }catch(e){}
    try{ if(root.PA_CACHE) root.PA_CACHE.quando=0; }catch(e){}
  }
  function salvarFormulario(botao){
    var form=botao.closest('.oa-form'), tipo=botao.dataset.oatipo, st=state[tipo], usuario=usuarioAgora();
    var atorAberto=form.__oaAtor||identidade(usuario), agoraAtor=identidade(usuario);
    if(atorAberto.id!==agoraAtor.id || atorAberto.nome!==agoraAtor.nome){ var mudou=form.querySelector('[data-oast]'); if(mudou) mudou.textContent='A sessão mudou enquanto este formulário estava aberto. Entre novamente e revise o registro; nada foi gravado.'; return; }
    var escolhido=valor(form,'responsavel'), equipe=equipeElegivel(st.opcoes.equipe).filter(function(x){return String(x.id)===String(escolhido);})[0]||{};
    var pedido={revisao:Number(botao.dataset.revisao), fonte:form.__oaFonte||{}, proximaAcao:valor(form,'acao'), proximaData:valor(form,'data'), texto:valor(form,'texto'), resultado:valor(form,'resultado'), motivoNaoFechamento:valor(form,'motivoNaoFechamento'), motivo:valor(form,'motivo'), protocoloConfirmado:valor(form,'protocolo'), retomadaConfirmada:valor(form,'retomada'), responsavelNome:texto(equipe.nome), responsavelId:texto(equipe.id)};
    if(botao.dataset.acao==='assumir'){ pedido.proximaAcao=pedido.proximaAcao||'Definir próximo passo'; pedido.proximaData=pedido.proximaData||hojeDaFila(st.opcoes); }
    var msg=form.querySelector('[data-oast]'); botao.disabled=true;
    salvar(st.opcoes.db,botao.dataset.oid,botao.dataset.acao,pedido,atorAberto,{agora:Date.now()}).then(function(r){
      botao.disabled=false;
      if(!r.ok){ if(msg) msg.textContent=r.erro; return; } // não apaga o formulário se der falha.
      sincronizarAposGravacao(botao.dataset.oid,r.orcamento); st.sucesso='Acompanhamento atualizado por '+r.ator.nome+'.'; renderPainel(tipo,st.root,st.cache,st.opcoes);
    });
  }
  function clicar(ev){ var b=ev.target&&ev.target.closest&&ev.target.closest('[data-oa]'); if(!b) return; var a=b.dataset.oa, tipo=b.dataset.oatipo||((b.closest('#oa-amanda'))?'amanda':'consultoras');
    if(a==='mais'){ state[tipo].mais=true; renderPainel(tipo,state[tipo].root,state[tipo].cache,state[tipo].opcoes); return; }
    if(a==='atualizar'){ if(state[tipo].opcoes.recarregar) state[tipo].opcoes.recarregar(); return; }
    if(a==='cancelar'){ var f=b.closest('.oa-form'); if(f) f.remove(); return; }
    if(a==='historico'){ state[tipo].historicoId=historicoAberto(tipo,b.dataset.oid)?'':b.dataset.oid; renderPainel(tipo,state[tipo].root,state[tipo].cache,state[tipo].opcoes); return; }
    if(a==='salvar'){ salvarFormulario(b); return; }
    abrirFormulario(tipo,b.dataset.oid,a);
  }
  function renderPainel(tipo, rootEl, mapa, opcoes){
    opcoes=opcoes||{}; state[tipo]={mais:(state[tipo]||{}).mais, sucesso:(state[tipo]||{}).sucesso||'', historicoId:(state[tipo]||{}).historicoId||'',cache:mapa,opcoes:opcoes,root:rootEl};
    garantirEstilos();
    var antigo=rootEl.querySelector('.oa-mount'); if(antigo) antigo.remove(); var box=root.document.createElement('div'); box.className='oa-mount'; box.innerHTML=card(tipo,mapa,opcoes); rootEl.insertBefore(box,rootEl.firstChild); if(!box.__oa){ box.addEventListener('click',clicar); box.__oa=true; }
    return box;
  }
  return {projetar:projetar,projetarMapa:projetarMapa,pendentes:pendentes,pausados:pausados,podeAtuar:podeAtuar,podeDistribuir:podeDistribuir,equipeElegivel:equipeElegivel,validarPedido:validarPedido,aplicar:aplicar,salvar:salvar,card:card,lerOrcamentos:lerOrcamentos,renderPainel:renderPainel,_state:state};
});
