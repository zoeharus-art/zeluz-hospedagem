(function(root, factory){
  var api = factory();
  if(typeof module === 'object' && module.exports) module.exports = api;
  if(root) root.ZeluzNavegacaoInicio = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function(){
  'use strict';
  var PORTAS = [
    {capacidade:'painel-diretoria', rota:'painel-diretoria', titulo:'Diretoria', acao:'Abrir Diretoria',
      resumo:'Visão da casa, recebido no mês e valores a receber.', atalhos:[
        {capacidade:'painel-operacao', rota:'gestaomarcia', rotulo:'Márcia Gestão'},
        {capacidade:'painel-amanda', rota:'painel-amanda', rotulo:'Supervisão'},
        {capacidade:'historico-checkins', rota:'historicocheckins', rotulo:'Histórico de hospedagens'}
      ]},
    {capacidade:'painel-operacao', rota:'gestaomarcia', titulo:'Márcia Gestão', acao:'Abrir Márcia Gestão',
      resumo:'Agenda, tarefas, faltas e cuidados do dia em um só lugar.', atalhos:[
        {capacidade:'painel-amanda', rota:'painel-amanda', rotulo:'Supervisão'},
        {capacidade:'historico-checkins', rota:'historicocheckins', rotulo:'Histórico de hospedagens'}
      ]},
    {capacidade:'painel-amanda', rota:'painel-amanda', titulo:'Supervisão', acao:'Abrir Supervisão',
      resumo:'Pendências e ações concluídas da equipe.', atalhos:[
        {capacidade:'painel-consultoras', rota:'consultoras', rotulo:'Recepção'}
      ]},
    {capacidade:'painel-consultoras', rota:'consultoras', titulo:'Recepção', acao:'Abrir Recepção',
      resumo:'Chegadas, saídas e contatos com as famílias.', atalhos:[
        {capacidade:'historico-checkins', rota:'historicocheckins', rotulo:'Histórico de hospedagens'}
      ]},
    {capacidade:'painel-monitor', rota:'painelmeu', titulo:'Meu dia', acao:'Abrir Meu dia',
      resumo:'Sua rota, horário e plano do dia.', atalhos:[]}
  ];
  function escolherPorta(pode){
    if(typeof pode !== 'function') return null;
    for(var i=0;i<PORTAS.length;i++){
      var porta=PORTAS[i];
      if(!pode(porta.capacidade)) continue;
      return {
        capacidade:porta.capacidade, rota:porta.rota, titulo:porta.titulo,
        acao:porta.acao, resumo:porta.resumo,
        atalhos:porta.atalhos.filter(function(atalho){ return pode(atalho.capacidade); })
      };
    }
    return null;
  }
  return {PORTAS:PORTAS, escolherPorta:escolherPorta};
}));
