/* CALENDÁRIO DEZ/JAN — Adriana, 16/nov/2026 (maquete respondida no mesmo dia).
   «Dezembro e janeiro ficam imensos, precisamos conseguir visualizar as vagas. Todos que forem
    fechando coloque no calendário. São no máximo 30 vagas por dia — 30 peludinhos; além disso, só
    com autorização da Márcia.»
   Respostas dela na maquete:
     - o número grande do dia é quantos peludinhos DORMEM naquela noite;
     - a pernoite de auluno do Day Care ocupa vaga;
     - passar de 30 só avisa, não trava;
     - conta só o fechado; quem tem orçamento sem confirmar aparece à parte, sem ocupar vaga;
     - quem SAI no dia libera a vaga daquela noite, e isso tem que estar à vista.
   A NOITE do dia D vai de D para D+1: dorme na noite D quem tem entrada <= D < saída.
   Leitura pura: não consulta banco nem tela. Quem chama entrega orçamentos, estadias e pernoites. */
(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.ZeluzCalendarioVagas=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  var LIMITE=30;
  var ISO=/^\d{4}-\d{2}-\d{2}$/;
  function ehISO(d){ return ISO.test(String(d||'')); }
  function maisDias(iso,n){
    if(!ehISO(iso)) return '';
    var p=iso.split('-'), dt=new Date(Date.UTC(+p[0], +p[1]-1, +p[2]+(n||0)));
    return dt.toISOString().slice(0,10);
  }
  function nrm(t){ return String(t==null?'':t).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim().replace(/\s+/g,' '); }
  function chave(t){ return nrm(t).replace(/[.#$\[\]\/ ]/g,'-'); }

  // Dezembro e o janeiro seguinte. Em janeiro ainda vale a temporada que começou em dezembro.
  function temporada(hoje){
    var a=Number(String(hoje||'').slice(0,4)), m=Number(String(hoje||'').slice(5,7));
    if(!(a>2000)) a=new Date().getFullYear();
    var ano=(m===1)?a-1:a;
    return {dez:ano+'-12', jan:(ano+1)+'-01', inicio:ano+'-12-01', fim:(ano+1)+'-01-31', ano:ano};
  }
  function diasDoMes(mes){
    var out=[], d=String(mes||'')+'-01';
    if(!ehISO(d)) return out;
    while(d.slice(0,7)===mes){ out.push(d); d=maisDias(d,1); }
    return out;
  }

  // ---- identidade do FILHOt: a chave do cadastro, ou nome + tutor; nome sozinho só sem tutor dos dois lados
  function ident(nome,tutor,key){
    var ks={};
    if(key) ks[chave(key)]=1;
    if(nome) ks[chave(String(nome)+'__'+String(tutor||''))]=1;
    return {ks:ks, n:nrm(nome), t:nrm(tutor)};
  }
  function mesmo(a,b){
    for(var k in a.ks) if(b.ks[k]) return true;
    if(!a.n || a.n!==b.n) return false;
    if(!a.t || !b.t || a.t===b.t) return true;
    return a.t.indexOf(b.t+' ')===0 || b.t.indexOf(a.t+' ')===0;   // «João» × «João Francisco»
  }

  // A saída que vale na estadia: a combinada, ou a do check-out / saída antecipada se veio antes.
  function saidaDaEstadia(e, hoje, diaDoTs){
    var st=String(e.status||'ativa'), sai=String(e.saida||'');
    var sa=e.saida_antecipada||null;
    if(sa && ehISO(sa.em) && (!ehISO(sai) || sa.em<sai)) sai=sa.em;
    if(st==='finalizada' && e.checkout && e.checkout.ts && typeof diaDoTs==='function'){
      var co=String(diaDoTs(e.checkout.ts)||'');
      if(ehISO(co) && (!ehISO(sai) || co<sai)) sai=co;
    }
    if(!ehISO(sai)){
      // Sem saída escrita: só a estadia aberta conta, e só até a noite de hoje (é o que se sabe).
      if(st!=='ativa' || !ehISO(hoje)) return '';
      sai=maisDias(hoje,1);
    }
    return sai;
  }

  /* dados = {orcamentos:{id:o}, estadias:{id:e}, pernoites:{dia:{chave:r}}, hoje:'AAAA-MM-DD', diaDoTs:fn}
     Devolve {dias:{iso:{dormem:[], chegam:[], saem:[], aConfirmar:[]}}} para cada dia de inicio a fim. */
  function ocupacao(dados, inicio, fim){
    dados=dados||{};
    var dias={}, d=inicio, guarda=0;
    if(!ehISO(inicio) || !ehISO(fim)) return {dias:dias};
    while(d<=fim && guarda<800){ dias[d]={dormem:[], chegam:[], saem:[], aConfirmar:[]}; d=maisDias(d,1); guarda++; }
    var hoje=dados.hoje||'';
    var hosp=[];                                   // quem já fez check-in (estadias)
    function noites(p, lista, campo){
      var x=p.entrada, g=0; campo=campo||'dormem';
      while(x<p.saida && g<800){ if(dias[x]) dias[x][campo].push(p); x=maisDias(x,1); g++; }
      if(lista!==false){
        if(dias[p.entrada]) dias[p.entrada].chegam.push(p);
        if(dias[p.saida]) dias[p.saida].saem.push(p);
      }
    }
    var E=dados.estadias||{};
    Object.keys(E).forEach(function(id){
      var e=E[id]||{}, st=String(e.status||'ativa');
      if(st==='cancelada' || st==='recusada') return;
      var ent=String(e.entrada||''); if(!ehISO(ent)) return;
      var sai=saidaDaEstadia(e, hoje, dados.diaDoTs); if(!sai || sai<=ent) return;
      var p={nome:String(e.nome||''), tutor:String(e.tutor||''), raca:String(e.raca||''), entrada:ent, saida:sai,
             origem:'hospedado', estId:id, id:ident(e.nome, e.tutor, e.refKey)};
      hosp.push(p); noites(p);
    });
    // Orçamento FECHADO: cada FILHOt dorme do dia de entrada até a véspera da saída — a não ser que
    // já tenha feito o check-in (a estadia que cruza o período é quem conta, com a saída real dela).
    var O=dados.orcamentos||{};
    Object.keys(O).forEach(function(id){
      var o=O[id]||{}, st=String(o.status||'aguardando');
      if(st!=='fechado' && st!=='aguardando') return;
      var ent=String(o.entrada||''), sai=String(o.saida||'');
      if(!ehISO(ent) || !ehISO(sai) || sai<=ent) return;
      (o.pets||[]).forEach(function(pet){
        pet=pet||{};
        var nome=String(pet.nome||''); if(!nome) return;
        var p={nome:nome, tutor:String(pet.tutor||o.tutor||''), raca:String(pet.raca||''), entrada:ent, saida:sai,
               origem:(st==='fechado')?'reserva':'aConfirmar', orcId:id, id:ident(nome, pet.tutor||o.tutor, pet.key)};
        var jaEntrou=hosp.some(function(h){ return h.entrada<=sai && h.saida>=ent && mesmo(h.id, p.id); });
        if(jaEntrou) return;
        if(st==='fechado') noites(p);
        else noites(p, false, 'aConfirmar');
      });
    });
    // Pernoite do Day Care: ocupa a vaga da noite em que foi lançada (Adriana, 16/nov/2026).
    var P=dados.pernoites||{};
    Object.keys(P).forEach(function(dia){
      if(!dias[dia]) return;
      var noite=P[dia]||{};
      Object.keys(noite).forEach(function(ch){
        var r=noite[ch]||{}, st=String(r.status||'aguardando');
        if(st!=='aguardando' && st!=='checkin_feito') return;
        var nome=String(r.nome||r.valor||'').replace(/\s*\([^)]*\)\s*$/,'').trim() || String(ch).split('__')[0];
        var tut=String(ch).indexOf('__')>=0?String(ch).split('__').slice(1).join('__').replace(/-/g,' '):'';
        var p={nome:nome, tutor:tut, raca:'', entrada:dia, saida:maisDias(dia,1), origem:'pernoite', id:ident(nome, tut, ch)};
        // A pernoite que já virou check-in está nas estadias: não conta duas vezes.
        if(dias[dia].dormem.some(function(q){ return mesmo(q.id, p.id); })) return;
        noites(p, false, 'dormem');
      });
    });
    Object.keys(dias).forEach(function(k){
      var ord=function(a,b){ return nrm(a.nome)<nrm(b.nome)?-1:(nrm(a.nome)>nrm(b.nome)?1:0); };
      dias[k].dormem.sort(ord); dias[k].chegam.sort(ord); dias[k].saem.sort(ord); dias[k].aConfirmar.sort(ord);
    });
    return {dias:dias};
  }

  // 'folga' até 24 · 'enchendo' 25 a 29 · 'lotado' 30 · 'acima' mais de 30 (só com a Márcia).
  function nivel(n){ n=Number(n)||0; return n>LIMITE?'acima':(n===LIMITE?'lotado':(n>=25?'enchendo':'folga')); }
  function vagas(n){ return Math.max(0, LIMITE-(Number(n)||0)); }

  function resumoMes(oc, mes){
    var r={lotadas:0, acima:0, maisCheia:null, vagasLivres:0};
    diasDoMes(mes).forEach(function(d){
      var x=((oc&&oc.dias)||{})[d]; if(!x) return;
      var n=x.dormem.length;
      if(n>=LIMITE) r.lotadas++;
      if(n>LIMITE) r.acima++;
      r.vagasLivres+=vagas(n);
      if(!r.maisCheia || n>r.maisCheia.n) r.maisCheia={dia:d, n:n};
    });
    return r;
  }

  // O Orçamento pergunta: com `novos` FILHOts a mais de `entrada` a `saida`, cabe?
  // ignorarOrc: o orçamento que está sendo editado (já está contado nas noites dele).
  function checarPeriodo(oc, entrada, saida, novos, ignorarOrc){
    var out={noites:[], acima:[], maisCheia:null, foraDaTemporada:false};
    if(!ehISO(entrada) || !ehISO(saida) || saida<=entrada) return out;
    var d=entrada, g=0, D=(oc&&oc.dias)||{};
    while(d<saida && g<400){
      var x=D[d];
      if(!x){ out.foraDaTemporada=true; }
      else {
        var ja=x.dormem.filter(function(p){ return !(ignorarOrc && p.orcId===ignorarOrc); }).length;
        var depois=ja+(Number(novos)||0);
        var item={dia:d, ja:ja, depois:depois};
        out.noites.push(item);
        if(depois>LIMITE) out.acima.push(item);
        if(!out.maisCheia || depois>out.maisCheia.depois) out.maisCheia=item;
      }
      d=maisDias(d,1); g++;
    }
    return out;
  }

  return {LIMITE:LIMITE, temporada:temporada, diasDoMes:diasDoMes, maisDias:maisDias, ocupacao:ocupacao,
          nivel:nivel, vagas:vagas, resumoMes:resumoMes, checarPeriodo:checarPeriodo, mesmo:mesmo, ident:ident};
});
