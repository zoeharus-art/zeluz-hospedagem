(function(root, factory){
  var api=factory(root||{});
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root){
    root.histCiPdfBaixar=api.histCiPdfBaixar; root.histCiPdfCriar=api.criar;
    root.histCiSecoesConferencia=api.histCiSecoesConferencia;
    root.histCiSecoesCheckout=api.histCiSecoesCheckout;
  }
})(typeof globalThis!=='undefined'?globalThis:this,function(glob){
  'use strict';

  var ZONA='America/Sao_Paulo';
  function texto(v){ return String(v==null?'':v); }
  function registrado(v){ return texto(v).trim()||'não registrado'; }
  function dataHora(v){
    if(v==null||v==='') return 'não registrada';
    var d=typeof v==='number'?new Date(v):new Date(texto(v));
    if(isNaN(d.getTime())) return 'não registrada';
    try{
      return new Intl.DateTimeFormat('pt-BR',{timeZone:ZONA,day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(d);
    }catch(e){ return 'não registrada'; }
  }
  function normaliza(v){
    var s=texto(v).toLowerCase();
    try{s=s.normalize('NFD').replace(/[\u0300-\u036f]/g,'');}catch(e){}
    return s.replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
  }
  function medChave(m,i,c){
    var prefixo='med_'+i+'_', slug=normaliza(m&&m.nome);
    if(slug) return prefixo+slug;
    // ciSlug usa Date.now() quando o nome está vazio. Nesse caso, a única forma fiel de
    // recuperar a chave histórica é ler a chave já salva na própria conferência.
    var chaves=[], conf=c||{};
    [conf.medicacaoEtiqueta,conf.medicacao].forEach(function(store){ Object.keys(store||{}).forEach(function(k){ if(k.indexOf(prefixo)===0&&chaves.indexOf(k)<0) chaves.push(k); }); });
    return chaves.length===1?chaves[0]:(prefixo+'item-nao-identificado');
  }
  function autoria(e){
    var c=(e&&e.conferencia)||{};
    return {
      checkin:registrado(e&&e.criado_por), checkinEm:dataHora(e&&e._ts),
      conferencia:registrado(c.concluida_por), conferenciaEm:dataHora(c.concluida_ts),
      concluida:c.concluida===true
    };
  }
  function arquivo(tipo,e){
    var base=normaliza((e&&e.nome)||'hospede')||'hospede';
    var entrada=texto(e&&e.entrada).replace(/[^0-9-]/g,'');
    var prefixo=tipo==='checkin'?'Reemissao-etapa-1-check-in-recepcao-':(tipo==='checkout'?'Extrato-etapas-3-e-4-check-out-':'Extrato-etapa-2-conferencia-check-in-');
    return prefixo+base+(entrada?('-'+entrada):'')+'.pdf';
  }
  function status(d,msg,erro){
    var doc=d&&d.document, el=doc&&doc.getElementById&&doc.getElementById('histCiPdfStatus');
    if(el){ el.textContent=msg; el.style.color=erro?'var(--crm-critico)':'var(--z-blue)'; }
  }
  function dependencia(nome, fixas){
    if(fixas&&Object.prototype.hasOwnProperty.call(fixas,nome)) return fixas[nome];
    return glob?glob[nome]:undefined;
  }
  function dependencias(fixas){
    var nomes=['podePapel','usuarioAtual','ciBaixarBlob','ciFichaFonteEstadia','ciFichaPdfBlob','zPdfDocBlob','histCiCadastroPorRefKey','histCiLerFotos','cfRefFotos','DB','Image','document','atob'];
    var d={}; nomes.forEach(function(n){ d[n]=dependencia(n,fixas); });
    return d;
  }
  function autorizado(d){
    try{
      return typeof d.podePapel==='function' && d.podePapel('historico-checkins')===true &&
        typeof d.usuarioAtual==='function' && !!d.usuarioAtual();
    }catch(e){ return false; }
  }

  function registroConferencia(tipo,reg){
    if(!reg||typeof reg!=='object') return 'não registrado';
    if(reg[tipo]===true) return 'sim';
    if(reg[tipo]===false) return 'não';
    return 'não registrado';
  }
  function complementoReg(reg){
    if(!reg||typeof reg!=='object') return '';
    var partes=[];
    if(reg.quem) partes.push('por '+reg.quem);
    if(reg.ts) partes.push('em '+dataHora(reg.ts));
    return partes.length?(' · '+partes.join(' · ')):'';
  }
  function dose(m){
    var q=texto(m&&m.q).trim(), u=texto(m&&m.u).trim();
    return [q,u].filter(Boolean).join(' ')||'não registrada';
  }
  function horarios(m){
    var h=Array.isArray(m&&m.horarios)?m.horarios.filter(Boolean):[];
    return h.length?h.join(', '):'não registrados';
  }
  function linhasItens(e){
    e=e||{};
    var c=e.conferencia||{}, p=Array.isArray(e.pertences)?e.pertences:[], meds=Array.isArray(e.medicacao)?e.medicacao:[];
    var out=[];
    p.forEach(function(x){
      var k=x.uid||x.k, r=(c.pertences||{})[k], descricao=registrado(x.nome||x.k)+(x.spec?(' ('+x.spec+')'):'');
      if(!r) out.push({k:'Pertence',v:descricao+' — conferência não registrada'});
      else out.push({k:'Pertence',v:descricao+' — etiquetado: '+registroConferencia('etiquetado',r)+complementoReg(r)});
    });
    meds.forEach(function(m,i){
      var k=medChave(m,i,c), etiqueta=(c.medicacaoEtiqueta||{})[k], alarme=(c.medicacao||{})[k];
      var sinais=[];
      sinais.push('dose '+dose(m)); sinais.push('horários '+horarios(m));
      sinais.push('etiquetado: '+(etiqueta?registroConferencia('etiquetado',etiqueta):'não registrado')+(etiqueta?complementoReg(etiqueta):''));
      sinais.push('alarme testado: '+(alarme?registroConferencia('testado',alarme):'não registrado'));
      sinais.push('som confirmado: '+(alarme?registroConferencia('confirmado',alarme):'não registrado')+(alarme?complementoReg(alarme):''));
      out.push({k:'Medicação',v:registrado(m.nome)+' — '+sinais.join('; ')});
    });
    return out;
  }
  function linhasAlimento(rotulo,r){
    if(!r||typeof r!=='object') return [{k:rotulo,v:'conferência não registrada'}];
    var partes=['modo: '+registrado(r.modo),'pesado: '+registroConferencia('pesado',r)];
    var campos={pesoTrazido:'peso trazido',qtdTrazida:'quantidade trazida',minimoNecessario:'mínimo necessário',qtdNecessaria:'quantidade necessária',deficit:'déficit'};
    Object.keys(campos).forEach(function(k){ if(r[k]!=null&&r[k]!=='') partes.push(campos[k]+': '+r[k]); });
    if(r.unidade) partes.push('unidade: '+r.unidade);
    if(r.obs) partes.push('observação: '+r.obs);
    return [{k:rotulo,v:partes.join('; ')+complementoReg(r)}];
  }
  function ocorrencias(e){
    var o=(e&&e.ocorrencias)||{};
    return Object.keys(o).sort(function(a,b){ return ((o[a]||{}).ts||0)-((o[b]||{}).ts||0); }).map(function(k){
      var x=o[k]||{}; return {t:registrado(x.texto)+complementoReg(x)};
    });
  }

  // Estas seções são deliberadamente puras: a tela de histórico pode exibi-las sem
  // consultar fotos, cadastro ou banco. A geração do PDF usa a mesma fonte salva.
  function histCiSecoesConferencia(e){
    e=e||{};
    var a=autoria(e), c=e.conferencia||{}, itens=linhasItens(e);
    var secoes=[
      {titulo:'EXTRATO SALVO DA CONFERÊNCIA DO CHECK-IN — ETAPA 2',linhas:[
        {t:'Extrato da estadia histórica escolhida; não altera nenhum registro.'},
        {k:'Hóspede',v:registrado(e.nome)+(e.raca?(' · '+e.raca):'')},
        {k:'Tutor',v:registrado(e.tutor)},
        {k:'Estadia',v:registrado(e.entrada)+' a '+registrado(e.saida)+' · status '+registrado(e.status)}
      ]},
      {titulo:'AUTORIA E STATUS',linhas:[
        {k:'Conferência',v:a.concluida?'concluída':'não concluída'},
        {k:'Conferida por',v:a.conferencia+' · '+a.conferenciaEm},
        {k:'Check-in feito por',v:a.checkin+' · '+a.checkinEm},
        {k:'Assinatura do tutor',v:e.assinatura?('imagem salva no check-in'+(e.assinado_por?(' · nome registrado: '+e.assinado_por):'')):(e.entregaSemTutor?'dispensada no check-in porque o tutor não estava presente':'imagem não registrada no check-in')}
      ]},
      {titulo:'PERTENCES E MEDICAÇÕES CONFERIDOS',linhas:itens.length?itens:[{t:'Não há pertences nem medicações registrados nesta estadia.'}]},
      {titulo:'ALIMENTAÇÃO CONFERIDA',linhas:linhasAlimento('Ração',c.racao).concat(c.comida?linhasAlimento('Comida natural',c.comida):[])}
    ];
    var oc=ocorrencias(e); if(oc.length) secoes.push({titulo:'OCORRÊNCIAS REGISTRADAS',linhas:oc});
    return secoes;
  }
  function checkoutItens(e){
    e=e||{};
    var mapa={}, ordem=[];
    function por(k,descricao){ if(!Object.prototype.hasOwnProperty.call(mapa,k)){ mapa[k]=descricao; ordem.push(k); } }
    (Array.isArray(e.pertences)?e.pertences:[]).forEach(function(p){ por('pert_'+(p.uid||p.k),'Pertence: '+registrado(p.nome||p.k)+(p.spec?(' — '+p.spec):'')); });
    (Array.isArray(e.medicacao)?e.medicacao:[]).forEach(function(m,i){ por('med_'+i,'Devolver medicação: '+registrado(m.nome)+(m.origem==='vet'?'':' (do tutor)')); });
    var alim=(e.ficha&&e.ficha.alim)||{};
    if(alim.tipo||alim.marca) por('racao','Devolver sobra de ração/comida: '+[alim.tipo,alim.marca].filter(Boolean).join(' · '));
    var anulados={};
    Object.keys(e.ocorrencias||{}).forEach(function(id){ var o=e.ocorrencias[id]||{};
      if(o.anulada) anulados['oc_'+id]='Registro anulado: '+registrado(o.texto);
      else por('oc_'+id,'Item da estadia: '+registrado(o.texto));
    });
    return {mapa:mapa,ordem:ordem,anulados:anulados};
  }
  function linhasCheckout(reg,itens){
    reg=reg||{}; itens=itens||{mapa:{},ordem:[]};
    var conf=(reg.conferido&&typeof reg.conferido==='object')?reg.conferido:{}, chaves=itens.ordem.slice();
    Object.keys(conf).forEach(function(k){ if(chaves.indexOf(k)<0) chaves.push(k); });
    if(!chaves.length) return [{t:'Nenhum item foi registrado para esta etapa.'}];
    return chaves.map(function(k){
      var descricao=itens.mapa[k]||(itens.anulados&&itens.anulados[k])||('Item sem descrição no registro ['+k+']');
      var estado=conf[k]===true?'marcado como conferido':(conf[k]===false?'não marcado como conferido':'conferência não registrada');
      // O PDF nativo reserva uma coluna fixa para {k,v}; descrições de pertences
      // ultrapassam essa coluna e encostam no estado. Uma linha textual pode quebrar
      // naturalmente e preserva os dois dados sem sugerir uma autoria diferente.
      return {t:descricao+' — '+estado};
    });
  }
  function histCiSecoesCheckout(e){
    e=e||{};
    var co=e.checkout;
    var e1=(e.checkout_etapa1&&typeof e.checkout_etapa1==='object')?e.checkout_etapa1:{};
    var temSaida=!!(co&&typeof co==='object'&&!Array.isArray(co));
    co=temSaida?co:{};
    var montouPor=e1.quem||co.bolsa_montada_por, montouEm=e1.ts||co.bolsa_montada_em;
    var itens=checkoutItens(e);
    var retirada=co.semTutor===true
      ?('retirada sem tutor'+(co.assinado_por?(' · '+co.assinado_por):''))
      :(co.assinatura?'assinatura de saída salva'+(co.assinado_por?(' · '+co.assinado_por):''):'assinatura de saída não registrada');
    var secoes=[];
    if(temSaida) secoes.push({titulo:'EXTRATO SALVO DO CHECK-OUT — ETAPAS 3 E 4',linhas:[
        {t:'Reemissão da saída salva; não altera nenhum registro.'},
        {k:'Hóspede',v:registrado(e.nome)+(e.raca?(' · '+e.raca):'')},
        {k:'Tutor',v:registrado(e.tutor)},
        {k:'Estadia',v:registrado(e.entrada)+' a '+registrado(e.saida)+' · status '+registrado(e.status)}
      ]});
    secoes.push({titulo:'ETAPA 3 — CHECK-OUT: BOLSA MONTADA',linhas:[
        {k:'Responsável',v:registrado(montouPor)}, {k:'Data e hora',v:dataHora(montouEm)}, {k:'Observação',v:registrado(e1.obs)}
      ].concat(linhasCheckout(e1,itens))});
    secoes.push({titulo:'ETAPA 4 — CONFERÊNCIA DO CHECK-OUT',linhas:temSaida?[
        {k:'Conferido por',v:registrado(co.quem)}, {k:'Data e hora',v:dataHora(co.ts)}, {k:'Observação',v:registrado(co.obs)}, {k:'Retirada',v:retirada}
      ].concat(linhasCheckout(co,itens)):[{t:'Pendente: a conferência final de saída ainda não foi registrada.'}]});
    if(Array.isArray(co.faltou_descer)&&co.faltou_descer.length) secoes.push({titulo:'ITENS QUE NÃO DESCERAM',linhas:co.faltou_descer.map(function(x){ return {t:registrado(x)}; })});
    return secoes;
  }

  function lerFotos(d,id){
    if(typeof d.histCiLerFotos==='function'){
      return Promise.resolve().then(function(){ return d.histCiLerFotos(id); }).then(function(v){
        if(v==null) return [];
        if(!Array.isArray(v)) throw new Error('o leitor de fotos devolveu um formato inesperado');
        return v.filter(function(src){ return typeof src==='string'&&src.trim(); });
      }).catch(function(e){ throw new Error('Não consegui ler as fotos disponíveis no registro da conferência: '+texto(e&&e.message||e)); });
    }
    var ref=null;
    try{
      if(typeof d.cfRefFotos==='function') ref=d.cfRefFotos(id);
      else if(d.DB&&typeof d.DB.ref==='function') ref=d.DB.ref('auaulandia/conferencia-fotos/'+id);
    }catch(e){ return Promise.reject(new Error('Não consegui abrir as fotos salvas da conferência: '+texto(e&&e.message||e))); }
    if(!ref||typeof ref.once!=='function') return Promise.reject(new Error('A leitura das fotos da conferência não está disponível nesta tela.'));
    return Promise.resolve(ref.once('value')).then(function(s){
      var v=s&&typeof s.val==='function'?s.val():null;
      if(v==null) return [];
      var lista=Array.isArray(v)?v:Object.keys(v).sort().map(function(k){ return v[k]; });
      // Compatibilidade com o formato antigo, no qual cada valor era a própria URL.
      // Registros novos ({src, tirada...}) devem passar por histCiLerFotos, que aplica
      // o normalizador canônico do app e não ressuscita fotos retiradas.
      if(lista.some(function(x){ return x&&typeof x==='object'; })){
        throw new Error('esta versão das fotos exige o leitor seguro do histórico');
      }
      return lista.filter(function(src){ return typeof src==='string'&&src.trim(); });
    }).catch(function(e){ throw new Error('Não consegui ler as fotos disponíveis no registro da conferência: '+texto(e&&e.message||e)); });
  }
  function imagemJpeg(d,url,rotulo){
    if(!/^data:image\//i.test(texto(url))) return Promise.reject(new Error(rotulo+' não tem um formato de imagem salvo reconhecido.'));
    if(typeof d.Image!=='function'||!d.document||typeof d.document.createElement!=='function'||typeof d.atob!=='function'){
      return Promise.reject(new Error('Este aparelho não oferece a conversão de imagem necessária para '+rotulo+'.'));
    }
    return new Promise(function(resolve,reject){
      var im=new d.Image();
      im.onload=function(){
        try{
          var w=im.naturalWidth||im.width, h=im.naturalHeight||im.height;
          if(!w||!h) throw new Error('dimensões vazias');
          var canvas=d.document.createElement('canvas'), ctx=canvas.getContext&&canvas.getContext('2d');
          if(!ctx) throw new Error('canvas indisponível');
          canvas.width=w; canvas.height=h;
          ctx.fillStyle='#FFFFFF'; ctx.fillRect(0,0,w,h); ctx.drawImage(im,0,0,w,h);
          var b64=canvas.toDataURL('image/jpeg',0.86).split(',')[1];
          // Window.atob exige que o receptor seja a própria Window em navegadores WebKit/
          // Chromium. Chamá-lo como d.atob(...) usa `d` como this e causa Illegal invocation.
          var bin=d.atob.call(glob,b64), bytes=new Uint8Array(bin.length);
          for(var i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
          resolve({bytes:bytes,w:w,h:h});
        }catch(e){ reject(new Error('Não consegui converter '+rotulo+' para JPEG: '+texto(e&&e.message||e))); }
      };
      im.onerror=function(){ reject(new Error('Não consegui abrir '+rotulo+' salva.')); };
      im.src=url;
    });
  }
  function imagensJpeg(d,lista,rotulo){
    return Promise.all((lista||[]).map(function(src,i){ return imagemJpeg(d,src,rotulo+' '+(i+1)); }));
  }

  function dadosComplementares(d,e){
    var refKey=texto(e&&e.refKey).trim();
    if(!refKey) return Promise.resolve({dados:{},nota:'Dados complementares atuais ausentes: esta estadia não possui vínculo com o cadastro.'});
    if(typeof d.histCiCadastroPorRefKey!=='function'){
      return Promise.resolve({dados:{},nota:'Dados complementares atuais não foram consultados: o cadastro vinculado não está disponível nesta tela. A reemissão usa os dados salvos na estadia.'});
    }
    return Promise.resolve().then(function(){ return d.histCiCadastroPorRefKey(refKey); }).then(function(v){
      if(!v) return {dados:{},nota:'Dados complementares atuais ausentes no cadastro vinculado à hospedagem. A reemissão usa os dados salvos na estadia.'};
      return {dados:v,nota:'Dados complementares atuais consultados exclusivamente no cadastro vinculado à hospedagem; podem refletir atualizações posteriores ao check-in.'};
    }).catch(function(err){
      return {dados:{},nota:'Falhou a consulta dos dados complementares atuais no cadastro vinculado ('+texto(err&&err.message||err)+'). A reemissão usa os dados salvos na estadia.'};
    });
  }
  function copiaFichaFonte(f){
    f=f||{};
    var d=Object.assign({},f.d||{}), ficha=Object.assign({},d.ficha||{});
    d.ficha=ficha;
    return Object.assign({},f,{d:d,ex:Object.assign({},f.ex||{})});
  }
  function checkinDoc(d,e){
    if(typeof d.ciFichaFonteEstadia!=='function'||typeof d.ciFichaPdfBlob!=='function') throw new Error('O montador nativo da ficha de check-in não está disponível nesta tela.');
    var a=autoria(e), fonte=copiaFichaFonte(d.ciFichaFonteEstadia(e,{}));
    return Promise.all([
      dadosComplementares(d,e),
      e.assinatura?imagemJpeg(d,e.assinatura,'a assinatura do tutor'):Promise.resolve(null)
    ]).then(function(r){
      var comp=r[0], sig=r[1], ficha=fonte.d.ficha;
      fonte.ex=Object.assign({},comp.dados||{});
      fonte.assinatura=sig;
      var estado=a.concluida?('concluída por '+a.conferencia+' em '+a.conferenciaEm):'não concluída';
      var nota='REEMISSÃO DO CHECK-IN — ETAPA 1 — gerada em '+dataHora(Date.now())+'. Registro da estadia escolhida; check-in feito por '+a.checkin+' em '+a.checkinEm+'. Conferência '+estado+'. '+comp.nota;
      ficha.obsGeral=[ficha.obsGeral||'',nota].filter(Boolean).join('\n');
      return d.ciFichaPdfBlob(fonte);
    });
  }
  function conferenciaDoc(d,id,e){
    if(typeof d.zPdfDocBlob!=='function') throw new Error('O montador nativo de PDF não está disponível nesta tela.');
    var a=autoria(e);
    return lerFotos(d,id).then(function(fs){
      return Promise.all([
        imagensJpeg(d,fs,'a foto da conferência'),
        e.assinatura?imagemJpeg(d,e.assinatura,'a assinatura do tutor'):Promise.resolve(null)
      ]);
    }).then(function(convertidas){
      var imgs=convertidas[0], sig=convertidas[1];
      if(imgs.length>1 && d.zPdfDocBlob.aceitaFotosHistorico!==true){
        throw new Error('O gerador de PDF desta versão ainda não consegue anexar todas as fotos salvas. Nenhum PDF incompleto foi baixado.');
      }
      var secoes=histCiSecoesConferencia(e);
      secoes[0].linhas.unshift({t:'Extrato gerado em '+dataHora(Date.now())+'. Reproduz a estadia histórica escolhida e não altera nenhum registro.'});
      secoes.push({titulo:'FOTOS DISPONÍVEIS NO REGISTRO',linhas:[{t:imgs.length?((imgs.length===1?'1 foto disponível':(imgs.length+' fotos disponíveis'))+' no registro, anexada'+(imgs.length===1?'':'s')+' a este extrato.'):'Nenhuma foto disponível no registro desta conferência.'}]});
      var opts={assinatura:sig,assinaNome:(!e.entregaSemTutor&&e.assinado_por)?e.assinado_por:null,fotos:imgs};
      if(imgs.length===1 && d.zPdfDocBlob.aceitaFotosHistorico!==true) opts.foto=imgs[0];
      return d.zPdfDocBlob({
        titulo:'Zêluz · AuAulândia — Extrato da Conferência do Check-in · Etapa 2',
        sub:registrado(e.nome)+' · '+(a.concluida?'concluída':'não concluída'),
        secoes:secoes
      },opts);
    });
  }
  function checkoutDoc(d,e){
    if(typeof d.zPdfDocBlob!=='function') throw new Error('O montador nativo de PDF não está disponível nesta tela.');
    var co=e&&e.checkout;
    if(!co||typeof co!=='object'||Array.isArray(co)) throw new Error('Esta estadia não possui um check-out salvo; status finalizada não substitui o registro da saída.');
    return Promise.resolve((!co.semTutor&&co.assinatura)?imagemJpeg(d,co.assinatura,'a assinatura de saída'):null).then(function(sig){
      var secoes=histCiSecoesCheckout(e);
      secoes[0].linhas.unshift({t:'Extrato gerado em '+dataHora(Date.now())+'. Reproduz a saída histórica escolhida e não altera nenhum registro.'});
      return d.zPdfDocBlob({
        titulo:'Zêluz · AuAulândia — Extrato do Check-out · Etapas 3 e 4',
        sub:registrado(e.nome)+' · reemissão da saída salva',
        secoes:secoes
      },{assinatura:sig,assinaNome:(!co.semTutor&&co.assinado_por)?co.assinado_por:null});
    });
  }

  function criar(fixas){
    return function(tipo,reg){
      var d=dependencias(fixas);
      if(!autorizado(d)){
        status(d,'Você não tem permissão ou uma sessão válida para baixar documentos do histórico.',true);
        return Promise.resolve({ok:false,erro:'sem-permissao'});
      }
      if((tipo!=='checkin'&&tipo!=='conferencia'&&tipo!=='checkout')||!reg||!reg.id||!reg.e){
        status(d,'Não encontrei a estadia histórica escolhida para gerar o documento.',true);
        return Promise.resolve({ok:false,erro:'registro-invalido'});
      }
      status(d,'Gerando documento histórico…',false);
      var p;
      try{ p=tipo==='checkin'?checkinDoc(d,reg.e):(tipo==='conferencia'?conferenciaDoc(d,reg.id,reg.e):checkoutDoc(d,reg.e)); }
      catch(e){ p=Promise.reject(e); }
      return Promise.resolve(p).then(function(blob){
        if(!blob) throw new Error('O PDF saiu vazio e não foi baixado.');
        if(!autorizado(d)) throw new Error('Sua sessão ou permissão mudou durante a geração; o PDF não foi baixado.');
        if(typeof d.ciBaixarBlob!=='function') throw new Error('O download de PDF não está disponível nesta tela.');
        var n=arquivo(tipo,reg.e), ok=d.ciBaixarBlob(blob,n);
        if(!ok) throw new Error('O aparelho não confirmou o download do PDF.');
        status(d,'PDF baixado: '+n,false);
        return {ok:true,nome:n,blob:blob};
      }).catch(function(err){
        var msg=texto(err&&err.message||err)||'falha não identificada';
        status(d,'Não foi possível gerar o PDF: '+msg,true);
        return {ok:false,erro:msg};
      });
    };
  }

  var histCiPdfBaixar=criar();
  return {
    criar:criar, histCiPdfBaixar:histCiPdfBaixar, autoria:autoria, linhasItens:linhasItens,
    histCiSecoesConferencia:histCiSecoesConferencia, histCiSecoesCheckout:histCiSecoesCheckout,
    arquivo:arquivo, medChave:medChave, dataHora:dataHora
  };
});
