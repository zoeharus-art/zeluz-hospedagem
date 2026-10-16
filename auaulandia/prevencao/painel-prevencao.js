/* Painel de prevenção: projeção somente leitura. Sem rede, escrita, mensagem ou temporizador. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ZeluzPainelPrevencao = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var portas = { ler: null, ficha: null, atendimento: null };

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>'"]/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[c];
    });
  }
  function lista(v) { return Array.isArray(v) ? v : []; }
  function abertasDe(elemento) {
    var abertas = {};
    if (!elemento || typeof elemento.querySelectorAll !== 'function') return abertas;
    Array.prototype.forEach.call(elemento.querySelectorAll('details[data-prevencao-id]'), function (d) {
      if (d.open && d.getAttribute('data-prevencao-id')) abertas[d.getAttribute('data-prevencao-id')] = true;
    });
    return abertas;
  }
  function canalDesconectado(projecao) {
    var texto = lista(projecao && projecao.limitacoes).join(' ');
    return (projecao && (projecao.canal === 'desconectado' || projecao.estado === 'canal-desconectado')) || /(?:canal|ponte).{0,40}(?:desconect|indispon)/i.test(texto);
  }
  function evidenciaVerificavel(p) { return !p || !p.evidencia || p.evidencia.verificavel !== false; }
  function autorDe(p) { return p && evidenciaVerificavel(p) && ((p.evidencia && p.evidencia.autor) || p.autor || ''); }
  function quando(p) {
    if (!p || !evidenciaVerificavel(p)) return '';
    var v = (p.evidencia && p.evidencia.em) || p.em || p.horario || p.hora || p.timestamp || p.ts || p.atualizadoEm;
    if (v == null || v === '') return '';
    if (typeof v === 'number' || /^\d{11,}$/.test(String(v))) {
      var d = new Date(Number(v));
      if (!isNaN(d.getTime())) {
        try { return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }).format(d); }
        catch (e) { return d.toISOString().slice(11, 16); }
      }
    }
    return String(v);
  }
  function dataBR(v) {
    var s = String(v || '');
    return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s.slice(8, 10) + '/' + s.slice(5, 7) + '/' + s.slice(0, 4) : s;
  }
  function estado(p) {
    var autor = autorDe(p) ? ' por ' + esc(autorDe(p)) : '';
    var hora = quando(p);
    var em = hora ? (autor ? ' às ' : ' em ') + esc(hora) : '';
    if (p.estado === 'aguardando-conferencia') {
      var tipo = p.evidencia && p.evidencia.tipo;
      if (!evidenciaVerificavel(p)) return 'Há um registro de ' + (tipo === 'resposta' ? 'resposta do tutor' : tipo === 'contato' ? 'envio' : 'tentativa de envio') + ' que precisa de conferência. Autoria e horário ainda não estão validados.';
      if (tipo === 'tentativa') return 'Tentativa de envio registrada' + autor + em + '. O envio ainda não está confirmado; confira o retorno do tutor às 13h30.';
      if (tipo === 'resposta') return 'Resposta do tutor registrada' + autor + em + '. O registro precisa de conferência antes de qualquer autorização.';
      return 'Envio registrado' + autor + em + '. O registro precisa de conferência antes de considerar qualquer retorno.';
    }
    if (p.estado === 'tentativa-sem-resposta') return 'Tentativa de envio registrada' + autor + em + '. O retorno do tutor precisa ser conferido às 13h30.';
    if (p.estado === 'contato-confirmado') return 'Envio registrado' + autor + em + '. Entrega e leitura não estão confirmadas. A resposta do tutor deve ser acompanhada às 13h30.';
    if (p.estado === 'resposta-a-conferir') return 'Há indicação de resposta do tutor' + autor + em + '. A pessoa responsável precisa conferir e registrar o encaminhamento.';
    if (p.estado === 'resposta-registrada') return 'Resposta do tutor registrada' + autor + em + '. Ainda não é autorização nem execução do cuidado.';
    if (p.estado === 'autorizacao-registrada') return 'Autorização do tutor registrada' + autor + em + '. Ainda falta conferir a execução e a ficha atual.';
    return 'Cuidado a verificar: ainda não há contato, resposta ou autorização do tutor registrados.';
  }
  function cabecalho(projecao, quantidade) {
    var h = '<article class="pm-card"><h3 class="pm-tit">Prevenção de quem chegou</h3>';
    if (!projecao || projecao.estado === 'carregando') return h + '<p class="pm-sub">Carregando os cuidados de prevenção de quem tem entrada confirmada…</p></article>';
    if (projecao.estado === 'indisponivel') return h + '<p class="pm-sub">Painel indisponível: não foi possível identificar o dia. Nenhum cuidado foi inferido.</p></article>';
    h += '<p class="pm-sub">' + quantidade + ' ' + (quantidade === 1 ? 'cuidado para acompanhar' : 'cuidados para acompanhar') + '. A Zelozinha só prepara ou envia a primeira mensagem; uma pessoa registra resposta e autorização. Retorno humano às 13h30.</p>';
    if (canalDesconectado(projecao)) h += '<p class="pm-sub">Canal desconectado: nenhuma nova mensagem foi enviada por este painel.</p>';
    if (lista(projecao.limitacoes).length) h += '<p class="pm-sub">' + esc(projecao.limitacoes.join(' ')) + '</p>';
    return h;
  }
  function detalhe(p, abertas) {
    var id = String(p.id || (p.referencia && p.referencia.id) || 'sem-referencia');
    var ref = p.referencia || {};
    var nome = esc(p.nome || 'Ficha sem nome');
    var tutor = p.tutor ? ' · tutor: ' + esc(p.tutor) : '';
    var vencimento = p.vencimento ? ' · data: ' + esc(dataBR(p.vencimento)) : '';
    var h = '<details data-prevencao-id="' + esc(id) + '"' + (abertas[id] ? ' open' : '') + '><summary><strong>' + nome + '</strong>' + tutor + ' · ' + esc(p.cuidado || 'Cuidado') + vencimento + '</summary>';
    h += '<p class="pm-sub">' + estado(p) + '</p>';
    if (p.proximaAcao) h += '<p class="pm-sub">Próxima ação: ' + esc(p.proximaAcao) + '</p>';
    h += '<button type="button" class="pm-btn" data-prevencao-acao="ficha" data-prevencao-id="' + esc(id) + '">Ver ficha</button> ';
    h += '<button type="button" class="pm-btn" data-prevencao-acao="atendimento" data-prevencao-id="' + esc(id) + '">Abrir atendimento humano</button></details>';
    return h;
  }
  function conferencia(c, abertas) {
    var ref = c.referencia || {}, id = String(ref.id || c.id || 'conferencia-sem-referencia');
    var nome = esc(c.nome || 'Ficha sem nome'), tutor = c.tutor ? ' · tutor: ' + esc(c.tutor) : '';
    return '<details data-prevencao-id="' + esc(id) + '"' + (abertas[id] ? ' open' : '') + '><summary><strong>Conferir identidade: ' + nome + '</strong>' + tutor + '</summary><p class="pm-sub">' + esc(c.motivo || 'A referência precisa de conferência humana antes de qualquer contato.') + '</p><p class="pm-sub">Nenhuma mensagem é enviada por este painel.</p></details>';
  }
  function html(projecao, abertas) {
    if (!projecao) return cabecalho(null, 0);
    var pendencias = lista(projecao.pendencias).filter(function (p) { return p && !/^conclu/i.test(String(p.estado || '')); });
    var conferencias = lista(projecao.conferencias);
    var h = cabecalho(projecao, pendencias.length);
    if (projecao.estado !== 'pronto') return h + '<p class="pm-sub">A leitura ainda não trouxe cuidados confiáveis para listar.</p></article>';
    if (!pendencias.length && !conferencias.length) return h + '<p class="pm-sub">Nenhum cuidado aberto para quem chegou com entrada confirmada.</p></article>';
    if (!pendencias.length && conferencias.length) h += '<p class="pm-sub">Nenhum cuidado foi projetado enquanto as identidades abaixo aguardam conferência humana.</p>';
    return h + pendencias.map(function (p) { return detalhe(p, abertas || {}); }).join('') + conferencias.map(function (c) { return conferencia(c, abertas || {}); }).join('') + '</article>';
  }
  function ligarAcoes(elemento, pendencias) {
    if (!elemento || typeof elemento.querySelectorAll !== 'function') return;
    var porId = {};
    pendencias.forEach(function (p) { porId[String(p.id || (p.referencia && p.referencia.id) || '')] = p; });
    Array.prototype.forEach.call(elemento.querySelectorAll('[data-prevencao-acao]'), function (botao) {
      botao.addEventListener('click', function () {
        var p = porId[botao.getAttribute('data-prevencao-id')];
        if (!p) return;
        var porta = botao.getAttribute('data-prevencao-acao') === 'ficha' ? portas.ficha : portas.atendimento;
        if (typeof porta === 'function') porta(p.referencia);
      });
    });
  }
  function atualizar(elemento) {
    if (!elemento) return null;
    var abertas = abertasDe(elemento), projecao;
    if (typeof portas.ler !== 'function') {
      elemento.innerHTML = html({ estado: 'indisponivel', pendencias: [], limitacoes: ['A leitura do painel não foi instalada.'] }, abertas);
      return null;
    }
    try { projecao = portas.ler(); }
    catch (e) {
      elemento.innerHTML = '<article class="pm-card"><h3 class="pm-tit">Prevenção de quem chegou</h3><p class="pm-sub">Não consegui ler o painel agora. Nenhum cuidado foi alterado.</p></article>';
      return null;
    }
    projecao = projecao || { estado: 'carregando', pendencias: [], limitacoes: [] };
    elemento.innerHTML = html(projecao, abertas);
    ligarAcoes(elemento, lista(projecao.pendencias));
    return projecao;
  }
  function instalar(novasPortas) {
    novasPortas = novasPortas || {};
    portas = { ler: novasPortas.ler, ficha: novasPortas.ficha, atendimento: novasPortas.atendimento };
    return api;
  }
  var api = { html: html, atualizar: atualizar, instalar: instalar };
  return api;
}));
