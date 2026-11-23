/* Mudar a saída do hóspede sem refazer o check-in — Adriana, 23/nov/2026:
   «Tutor pediu para mudar a data de saída. Tive que entrar no check-in e confirmar todo ele. Quero uma forma mais
   simples de mudar o dia. [...] O check-in continua o mesmo; se for faltar algo, tem que ser avisado, para passarmos
   para o tutor, seja alimentação ou medicamento.» Maquete aprovada em 23/nov.
   Núcleo puro: as opções de data, a frase das noites, a régua, a gravação (um update só na estadia, com o banho de
   saída junto e o histórico em datas_historico) e a mensagem pronta para o tutor. Sem DOM, banco ou escrita. */
(function(root,factory){ var api=factory(); if(typeof module==='object'&&module.exports)module.exports=api; if(root)root.ZeluzMudarSaida=api; })(typeof globalThis!=='undefined'?globalThis:this,function(){
  var ISO=/^\d{4}-\d{2}-\d{2}$/, HORA=/^([01]\d|2[0-3]):[0-5]\d$/;
  var SEMANA=['domingo','segunda','terça','quarta','quinta','sexta','sábado'];
  // Os horários prontos do banho (os mesmos da casa: até 17:30).
  var HORAS=['09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30'];
  function s(v){ return v==null?'':String(v).trim(); }
  function iso(v){ v=s(v); return ISO.test(v)?v:''; }
  function hora(v){ v=s(v); return HORA.test(v)?v:''; }
  function data(i){ var p=i.split('-'); return new Date(Date.UTC(+p[0], +p[1]-1, +p[2], 12)); }
  function maisDias(i, n){ var d=data(i); d.setUTCDate(d.getUTCDate()+n); return d.toISOString().slice(0,10); }
  function dias(a, b){ return Math.round((data(b)-data(a))/86400000); }
  function br(i){ i=iso(i); return i?(i.slice(8,10)+'/'+i.slice(5,7)):''; }
  function semana(i){ i=iso(i); return i?SEMANA[data(i).getUTCDay()]:''; }
  function diaTexto(i){ return semana(i)+', '+br(i); }
  // As duas datas prontas: um e dois dias depois da saída combinada («Amanhã» quando é o dia seguinte a hoje).
  function opcoes(saida, hoje){
    saida=iso(saida); hoje=iso(hoje); if(!saida) return [];
    return [1,2].map(function(n){ var d=maisDias(saida, n);
      var rot=(hoje && d===maisDias(hoje,1))?'Amanhã':(n===1?'Mais 1 dia':'Mais 2 dias');
      return {v:d, rot:rot+' ('+br(d)+')'}; });
  }
  function frase(antes, nova){
    antes=iso(antes); nova=iso(nova); if(!antes || !nova) return '';
    var n=dias(antes, nova);
    if(!n) return 'É a mesma data de saída.';
    if(n>0) return 'Fica mais '+n+(n===1?' noite':' noites')+' (sai '+diaTexto(nova)+').';
    return 'Sai antes: '+(-n)+(n===-1?' noite':' noites')+' a menos (sai '+diaTexto(nova)+').';
  }
  // '' = pode salvar; texto = o que impede.
  function validar(e, nova, hoje){
    e=e||{}; var raw=s(nova); nova=iso(nova); hoje=iso(hoje);
    if(s(e.status||'ativa')!=='ativa') return 'Esta hospedagem não está em curso. Para mexer nela, use a aba Hóspedes.';
    if(!raw) return 'Escolha a nova data de saída.';
    if(!nova) return 'A data de saída não é válida. Escolha no calendário.';
    if(nova===s(e.saida)) return 'É a mesma data de saída. Escolha outra data.';
    if(iso(e.entrada) && nova<e.entrada) return 'A saída não pode ser antes da entrada ('+br(e.entrada)+').';
    if(hoje && nova<hoje) return 'Essa data já passou. Se ele já foi embora, use o check-out.';
    return '';
  }
  // O banho de saída que a estadia tem: {tem, hora, tipo}.
  function banho(e){
    var f=(e&&e.ficha)||{}, sp=(f.spa&&typeof f.spa==='object')?f.spa:{};
    var tem=s(sp.banho||f.banho)==='Sim';
    return {tem:tem, hora:tem?hora(sp.horario):'', tipo:tem?s(sp.tipo):''};
  }
  // A gravação: caminhos relativos à estadia, para UM update (tudo entra junto ou nada entra).
  // o = {e, nova, banho:'mesma'|'outra'|'sem', hora, quem, ts, quando, motivo, chave}
  function patch(o){
    var e=o.e||{}, nova=iso(o.nova), ts=Number(o.ts)||0, quem=s(o.quem)||'-', b=banho(e), P={};
    var esc=s(o.banho), h='', descr='';
    if(b.tem){
      if(esc==='sem'){
        P['ficha/spa/banho']='Não';
        P['ficha/spa/sem_por']={quem:quem, ts:ts, antes:{banho:'Sim', horario:b.hora, tipo:b.tipo}};
        descr='banho de saída tirado';
      } else {
        h=(esc==='outra')?hora(o.hora):b.hora;
        if(h){
          P['ficha/spa/horario']=h; P['ficha/spa/aConfirmar']=false; P['ficha/spa/horaDia']=nova;
          P['ficha/spa/hora_por']={quem:quem, ts:ts, de:b.hora};
          descr='banho de saída '+br(nova)+' às '+h;
        } else descr='banho de saída '+br(nova)+' sem hora';
      }
    }
    P.saida=nova; P.alterado_por=quem; P.alterado_ts=ts;
    P.alteracao_anterior={entrada:s(e.entrada), saida:s(e.saida)};
    P['datas_historico/'+s(o.chave)]={entrada_antes:s(e.entrada), saida_antes:s(e.saida), entrada:s(e.entrada), saida:nova,
      status_antes:s(e.status||'ativa'), motivo:s(o.motivo)||'Tutor pediu', origem:'mudar-saida', banho:descr,
      registro:{acao:'mudar-saida', por:quem, login:quem, quando:s(o.quando), ts:ts, motivo:s(o.motivo)||'Tutor pediu'}};
    return P;
  }
  // «2 comprimidos», «1 comprimido»; g, ml e o resto ficam como vieram.
  function qtd(n, u){ u=s(u); var num=Number(String(n).replace(',','.'));
    if(num!==1 && /^(comprimido|c[áa]psula|gota|dose|sach[êe]|ampola|unidade|pipeta)$/i.test(u)) u+='s';
    return s(n)+(u?(' '+u):''); }
  function remedio(nome){ nome=s(nome); return /^rem[ée]dio(\s|$)/i.test(nome)?nome:('Remédio '+nome); }
  // O texto de um item que vai faltar, como a tela e o aviso dizem.
  function faltaTexto(f){
    f=f||{}; var ate=br(f.ate);
    if(f.tipo==='medicacao-sem-contagem') return remedio(f.nome)+': ninguém registrou quanto veio. Confira se dá até '+ate+'.';
    var oq=(f.tipo==='racao')?('Comida '+s(f.nome)):remedio(f.nome);
    return oq+': veio '+qtd(f.trazido, f.unidade)+', precisa de '+qtd(f.necessario, f.unidade)+' até '+ate+'. Faltam '+qtd(f.deficit, f.unidade)+'.';
  }
  // A mensagem de WhatsApp para o tutor (formatada: saudação, linha em branco, uma ideia por linha).
  function mensagem(o){
    o=o||{}; var t=s(o.tutor).split(/\s+/)[0]||'', nome=s(o.nome)||'seu FILHOt', nova=iso(o.nova), L=[];
    L.push('Olá'+(t?(', '+t):'')+'! 💛', '');
    L.push('Anotamos: '+nome+' fica com a gente até '+diaTexto(nova)+'. 🐾');
    var fs=(o.faltas||[]).filter(function(f){ return f && f.tipo!=='medicacao-sem-contagem'; });
    if(fs.length){
      L.push('');
      fs.forEach(function(f){
        L.push((f.tipo==='racao'?'🥣 A comida':'💊 O '+s(f.nome))+' não dá para os dias a mais. Pode trazer mais '+qtd(f.deficit, f.unidade)+'?');
      });
    }
    L.push('', 'Qualquer dúvida, é só chamar. 💛');
    return L.join('\n');
  }
  return {opcoes:opcoes, frase:frase, validar:validar, banho:banho, patch:patch, faltaTexto:faltaTexto, mensagem:mensagem,
          maisDias:maisDias, br:br, diaTexto:diaTexto, HORAS:HORAS};
});
