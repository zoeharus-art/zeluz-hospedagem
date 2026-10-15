/*
 * Reserva fechada -> cadastro mínimo de hotel.
 *
 * Funções puras. A tela decide quando ler/gravar no Firebase; este módulo apenas
 * protege a identidade e monta o menor registro que o cadastro-mestre entende.
 */
(function(root){
  'use strict';

  function texto(v){ return String(v == null ? '' : v).trim(); }
  function normal(v){
    return texto(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ');
  }
  function igual(a,b){ return !texto(a) || !texto(b) || normal(a)===normal(b); }
  function idDaReserva(orcamentoId, pet, indice){
    // `cadastro_ref` is written by this feature and must never change the source ID.
    // The original budget key is immutable; index is only the legacy fallback.
    var origem=texto((pet||{}).key);
    return texto(orcamentoId)+'__'+(origem || ('pet-'+String(indice)));
  }

  function chaveCadastro(pet, orcamento, cadastroExistente, chavePadrao){
    pet=pet||{}; orcamento=orcamento||{}; cadastroExistente=cadastroExistente||{};
    var nome=texto(pet.nome), tutor=texto(pet.tutor || orcamento.tutor), chave=texto(pet.cadastro_ref);
    if(!chave && texto(pet.key) && cadastroExistente[texto(pet.key)]) chave=texto(pet.key);
    if(!chave && nome && tutor && typeof chavePadrao==='function') chave=texto(chavePadrao({n:nome,tutor:tutor}));
    return chave;
  }

  function plano(orcamentoId, orcamento, pet, indice, cadastroExistente, chavePadrao){
    pet=pet||{}; orcamento=orcamento||{}; cadastroExistente=cadastroExistente||{};
    var nome=texto(pet.nome), tutor=texto(pet.tutor || orcamento.tutor), raca=texto(pet.raca);
    if(!nome || !tutor) return {ok:false, erro:'O orçamento fechado precisa de nome e tutor antes de criar a ficha mínima.'};

    var chave=chaveCadastro(pet,orcamento,cadastroExistente,chavePadrao);
    if(!chave) return {ok:false, erro:'Não foi possível formar a chave estável do cadastro.'};

    var atual=cadastroExistente[chave]||null;
    // A race may be absent from a legacy budget but already verified in its linked profile.
    if(!raca && atual) raca=texto(atual.raca);
    if(!raca) return {ok:false, erro:'O orçamento fechado precisa de raça, ou de uma ficha vinculada que já a confirme.'};
    if(atual && (!igual(atual.n,nome) || !igual(atual.tutor,tutor) || !igual(atual.raca,raca))){
      return {ok:false, conflito:true, chave:chave,
        erro:'Já existe uma ficha com esta chave, mas nome, tutor ou raça divergem. A recepção precisa conferir o vínculo; nada foi sobrescrito.'};
    }

    var fonte={
      orcamento_id:texto(orcamentoId),
      pet_id:idDaReserva(orcamentoId,pet,indice),
      pet_key:texto(pet.key), nome:nome, tutor:tutor, raca:raca,
      entrada:texto(orcamento.entrada), saida:texto(orcamento.saida),
      status:'preparado'
    };
    var novo=!atual;
    var base=novo ? {
      _novo:true, n:nome, tutor:tutor, raca:raca, nasc:'', dias:[], freq:'',
      hotel_only:true,
      hotel_cadastro:{estado:'preparado', incompleto:true, versao:1}
    } : {};
    return {ok:true, chave:chave, novo:novo, base:base, fonte:fonte};
  }

  function elegivelParaReconciliar(orcamento, hoje){
    var o=orcamento||{}, sai=texto(o.saida);
    return texto(o.status)==='fechado' && (!sai || sai>=texto(hoje));
  }

  root.ZeluzReservaCadastro={
    normal:normal,
    plano:plano,
    chaveCadastro:chaveCadastro,
    idDaReserva:idDaReserva,
    elegivelParaReconciliar:elegivelParaReconciliar
  };
})(window);
