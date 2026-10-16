/* Decisão pura para exceção diária de café de aluno. Não consulta nem grava banco. */
(function(root,factory){
  var api=factory(); if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.ZeluzCafeAluno=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function texto(v){ return v==null?'':String(v).trim(); }
  function iso(v){ v=texto(v); if(!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false; var p=v.split('-'),d=new Date(+p[0],+p[1]-1,+p[2]); return d.getFullYear()===+p[0]&&d.getMonth()===+p[1]-1&&d.getDate()===+p[2]; }
  function chave(k){ return /^[^.#$\[\]/]+$/.test(texto(k)); }
  function chaveCafe(k){ return 'dc-cafe-'+texto(k); }
  function instrucaoValida(e,dia){
    e=e||{}; return e.tipo==='cafe-aluno'&&iso(dia)&&texto(e.dia)===dia&&chave(e.dcKey)
      &&texto(e.instrucao)&&texto(e.alimento)&&texto(e.quantidade)&&texto(e.quem)&&texto(e.papel)
      &&Number.isFinite(Number(e.ts))&&Number(e.ts)>0&&!e.retirada&&!e.conferir;
  }
  function presente(k,chamada,checkins){ var c=(checkins||{})[k]; return !!(c&&c.fim&&(!c.tipo||c.tipo==='entrada')); }
  function elegivel(entrada){
    entrada=entrada||{}; var e=entrada.excecao||{},dia=texto(entrada.dia), pessoas=Array.isArray(entrada.pessoas)?entrada.pessoas:[];
    if(!instrucaoValida(e,dia)) return {ok:false,motivo:'instrução de café ausente ou a conferir'};
    var achados=pessoas.filter(function(o){ var p=o&&o.p||{}; return texto(entrada.dcKey(p.n,p.tutor))===texto(e.dcKey)&&texto(p.n)===texto(e.pet)&&texto(p.tutor)===texto(e.tutor); });
    if(achados.length!==1) return {ok:false,motivo:'identidade do aluno a conferir'};
    if(!presente(e.dcKey,entrada.chamada,entrada.checkins)) return {ok:false,motivo:'presença do aluno ainda não confirmada'};
    return {ok:true,aluno:achados[0],chaveCafe:chaveCafe(e.dcKey)};
  }
  function podeCorrigir(fato){ var e=fato&&fato.estado; return !(e&&e!=='naochegou'); }
  return {iso:iso,chaveCafe:chaveCafe,instrucaoValida:instrucaoValida,elegivel:elegivel,presente:presente,podeCorrigir:podeCorrigir};
});
