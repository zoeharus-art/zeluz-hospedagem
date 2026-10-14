(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.ZeluzPresencaLogica=api;
}(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  var FUSO='America/Sao_Paulo';
  function esc(v){ return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
  function agoraSP(agora){
    var d=agora instanceof Date?agora:new Date(agora);
    if(isNaN(d.getTime())) throw new Error('agora inválido');
    var p=new Intl.DateTimeFormat('en-CA',{timeZone:FUSO,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(d);
    var x={}; p.forEach(function(i){ if(i.type!=='literal') x[i.type]=i.value; });
    return {dia:x.year+'-'+x.month+'-'+x.day,hora:x.hour+':'+x.minute, minutos:Number(x.hour)*60+Number(x.minute)};
  }
  function fonte(f){ return (f&&f.estado)||'indisponivel'; }
  function brDia(iso){ var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso||'')); return m?m[3]+'/'+m[2]+'/'+m[1]:String(iso||''); }
  function itemBase(p){ return {id:String(p.id||''),nome:String(p.nome||'Animal não informado'),tutor:String(p.tutor||'Tutor não informado')}; }
  function textoMotivo(v){
    if(!v) return '';
    if(typeof v==='object') return [v.motivo,v.obs].filter(function(x){ return typeof x==='string'&&x.trim(); }).join(' · ');
    return String(v);
  }
  function montar(entrada){
    entrada=entrada||{};
    var relogio=agoraSP(entrada.agora), dia=String(entrada.dia||relogio.dia), chamada=entrada.chamada||{}, meta=entrada.chamadaMeta||{}, estadoChamada=fonte(chamada), estadoMeta=fonte(meta), estadoTurma=entrada.turmaEstado||'indisponivel';
    var pronto=estadoChamada==='pronto'&&estadoMeta==='pronto'&&estadoTurma==='pronto';
    var estado=pronto?'pronto':(estadoChamada==='falha'||estadoMeta==='falha'||estadoTurma==='falha'?'falha':'carregando');
    var base={dia:dia,geradoEm:relogio,estado:estado,itens:[],totais:{presentes:0,faltasConfirmadas:0,faltasRegistradasConferir:0,aguardando:0,aConferir:0,desconhecidos:0}};
    if(!pronto) return base;
    var mapa=chamada.valores||{}, metas=meta.valores||{}, checkins=(entrada.checkins&&entrada.checkins.estado==='pronto'&&entrada.checkins.valores)||{};
    (entrada.participantes||[]).forEach(function(p){
      var i=itemBase(p), marca=mapa[i.id], ck=checkins[i.id]||null;
      if(marca==='faltou' && metas[i.id]&&metas[i.id].origem==='manual'&&metas[i.id].estado==='faltou') { i.estado='falta-confirmada'; i.rotulo='Falta confirmada'; i.motivo=textoMotivo(p.motivo); i.quem=String(metas[i.id].quem||''); i.hora=String(metas[i.id].hora||''); base.totais.faltasConfirmadas++; }
      else if(marca==='faltou') { i.estado='falta-registrada-conferir'; i.rotulo='Falta registrada — conferir'; i.motivo=textoMotivo(p.motivo); base.totais.faltasRegistradasConferir++; }
      else if(marca==='veio'||ck) { i.estado='presente'; i.rotulo='Presente'; i.hora=(ck&&ck.hora)?String(ck.hora):''; base.totais.presentes++; }
      else if(dia!==relogio.dia) { i.estado='a-conferir'; i.rotulo='A conferir'; base.totais.aConferir++; }
      else if(relogio.minutos<720) { i.estado='aguardando'; i.rotulo='Aguardando chegada'; base.totais.aguardando++; }
      else { i.estado='a-conferir'; i.rotulo='A conferir'; base.totais.aConferir++; }
      base.itens.push(i);
    });
    return base;
  }
  function etiqueta(estado){ return ({presente:'pm-b-ok','falta-confirmada':'pm-b-critico','falta-registrada-conferir':'pm-b-atencao',aguardando:'pm-b-atencao','a-conferir':'pm-b-atencao'})[estado]||'pm-b-atencao'; }
  function cardHTML(p){
    if(!p||p.estado!=='pronto'){
      var falha=p&&p.estado==='falha', msg=falha?'Os dados ainda não estão completos. Isto não confirma presença nem falta.':'Estou conferindo a presença do dia.';
      return '<article class="pm-card pm-rv pm-c12"><h3 class="pm-tit">Presença do dia</h3><p class="pm-sub">'+esc(msg)+'</p>'+(falha?'<div class="pm-acao"><button type="button" class="pm-bt" onclick="presencaAtualizar()">Atualizar presença</button></div>':'')+'</article>';
    }
    var t=p.totais, linhas=p.itens.map(function(i){ var confirmar=i.estado==='falta-registrada-conferir'?'<button type="button" class="pm-bt" data-presenca-id="'+esc(i.id)+'" onclick="presencaConfirmarFalta(this.dataset.presencaId)">Confirmar falta</button>':''; return '<div class="pm-li"><span class="pm-badge '+etiqueta(i.estado)+'">'+esc(i.rotulo)+'</span><div class="pm-li-txt"><b>'+esc(i.nome)+'</b><span>Tutor: '+esc(i.tutor)+(i.quem?' · Confirmada por '+esc(i.quem):'')+(i.hora?' · '+esc(i.hora):'')+(i.motivo?' · '+esc(i.motivo):'')+'</span>'+confirmar+'</div></div>'; }).join('');
    return '<article class="pm-card pm-rv pm-c12"><h3 class="pm-tit">Presença do dia</h3><p class="pm-sub">'+esc(brDia(p.dia))+' · Vamos conferir as faltas às 12h (São Paulo). A ausência de marcação não confirma falta.</p>'
      +'<div class="pm-segleg"><span class="pm-segleg-i"><b>'+t.presentes+'</b> presentes</span><span class="pm-segleg-i"><b>'+t.faltasConfirmadas+'</b> faltas confirmadas</span><span class="pm-segleg-i"><b>'+t.faltasRegistradasConferir+'</b> registradas — conferir</span><span class="pm-segleg-i"><b>'+t.aguardando+'</b> aguardando</span><span class="pm-segleg-i"><b>'+t.aConferir+'</b> a conferir</span></div>'
      +'<div class="pm-lista">'+(linhas||'<div class="pm-li"><div class="pm-li-txt"><b>Nenhum participante carregado.</b></div></div>')+'</div>'
      +'<div class="pm-acao"><button type="button" class="pm-bt" onclick="presencaAtualizar()">Atualizar presença</button><button type="button" class="pm-bt" onclick="presencaImprimir(\'dia\')">Imprimir / salvar PDF</button><button type="button" class="pm-bt" onclick="presencaImprimir(\'faltas\')">PDF das faltas</button><button type="button" class="pm-bt" onclick="presencaAbrirChamada()">Abrir a Chamada</button></div></article>';
  }
  function impressaoHTML(p,modo){
    if(!p||p.estado!=='pronto') return {ok:false,erro:'dados-incompletos'};
    modo=modo==='faltas'?'faltas':'dia';
    var itens=modo==='faltas'?p.itens.filter(function(i){ return i.estado==='falta-confirmada'; }):p.itens;
    var titulo=modo==='faltas'?'Faltas confirmadas':'Lista de presença';
    var vazio=modo==='faltas'?'Nenhuma falta confirmada.':'Nenhum participante no recorte.';
    var linhas=itens.length?itens.map(function(i){ var registro=[]; if(i.quem) registro.push('Confirmada por '+String(i.quem)); if(i.hora) registro.push(String(i.hora)); if(i.motivo) registro.push(String(i.motivo)); return '<tr><td>'+esc(i.nome)+'</td><td>'+esc(i.tutor)+'</td><td>'+esc(i.rotulo)+'</td><td>'+esc(registro.join(' · '))+'</td></tr>'; }).join(''):'<tr><td colspan="4">'+vazio+'</td></tr>';
    return {ok:true,html:'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>'+esc(titulo)+'</title><style>@page{margin:14mm}body{font-family:Poppins,Inter,sans-serif;color:#234D67;margin:0;font-size:12px}h1{font-size:20px;margin:0 0 6px}table{width:100%;border-collapse:collapse;table-layout:fixed}thead{display:table-header-group}tr{break-inside:avoid;page-break-inside:avoid}th,td{border:1px solid #b6c2cc;padding:7px;text-align:left;vertical-align:top;overflow-wrap:anywhere}th{background:#234D67;color:#FFFDF6}.meta{font-size:12px;color:#555;margin:0 0 14px}</style></head><body><h1>Zêluz · '+esc(titulo)+'</h1><p class="meta">Dia: '+esc(brDia(p.dia))+' · Gerado às '+esc(p.geradoEm.hora)+' (São Paulo)</p><table><thead><tr><th>Animal</th><th>Tutor</th><th>Situação</th><th>Registro</th></tr></thead><tbody>'+linhas+'</tbody></table></body></html>'};
  }
  return {agoraSP:agoraSP,montar:montar,cardHTML:cardHTML,impressaoHTML:impressaoHTML};
}));
