(function (raiz, fabrica) {
  var api = fabrica();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (raiz) raiz.ZeluzMarcia129 = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var ESTADOS = ['pronto', 'carregando', 'falha'];
  var SECOES = ['faltas', 'novatos', 'comida', 'saude', 'tempos'];

  function esc(valor) {
    return String(valor == null ? '' : valor)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function dataSP(agora) {
    var partes = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(agora || new Date());
    var p = {};
    partes.forEach(function (x) { p[x.type] = x.value; });
    return p.year + '-' + p.month + '-' + p.day;
  }

  function dataValida(dia) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dia || ''))) return false;
    var p = dia.split('-').map(Number);
    var d = new Date(Date.UTC(p[0], p[1] - 1, p[2], 12));
    return d.getUTCFullYear() === p[0] && d.getUTCMonth() === p[1] - 1 && d.getUTCDate() === p[2];
  }

  function somarDias(dia, n) {
    var p = dia.split('-').map(Number);
    var d = new Date(Date.UTC(p[0], p[1] - 1, p[2] + n, 12));
    return d.toISOString().slice(0, 10);
  }

  function estado(valor) { return ESTADOS.indexOf(valor) >= 0 ? valor : 'falha'; }
  function texto(valor) { return typeof valor === 'string' ? valor.trim() : ''; }
  function numero(valor) { return Number.isFinite(valor) && valor >= 0 ? valor : null; }
  function inteiro(valor) { var n = typeof valor === 'number' ? valor : Number(valor); return Number.isInteger(n) && n >= 0 ? n : 0; }
  function lista(valor) { return Array.isArray(valor) ? valor : []; }
  function itemBase(item) {
    item = item && typeof item === 'object' ? item : {};
    return { id: texto(item.id), nome: texto(item.nome), raca: texto(item.raca), tutor: texto(item.tutor) };
  }

  function normalizar(snapshot, diaEsperado) {
    var s = snapshot && typeof snapshot === 'object' ? snapshot : {};
    var dia = dataValida(s.dia) ? s.dia : diaEsperado;
    var agenda = s.agenda && typeof s.agenda === 'object' ? s.agenda : {};
    var q = s.quantidades && typeof s.quantidades === 'object' ? s.quantidades : {};
    var saida = {
      dia: dataValida(dia) ? dia : dataSP(), atualizadoEm: texto(s.atualizadoEm),
      agenda: { estado: estado(agenda.estado), itens: [] },
      quantidades: { estado: estado(q.estado), matriculados: numero(q.matriculados), avulsos: numero(q.avulsos), reposicoes: numero(q.reposicoes), total: numero(q.total), hospedes: numero(q.hospedes), presentes: numero(q.presentes) },
      tarefas: { estado: 'falha', itens: [] }
    };
    saida.agenda.itens = lista(agenda.itens).map(function (x) {
      x = x && typeof x === 'object' ? x : {};
      var b = itemBase(x);
      function prev(v) {
        v = v && typeof v === 'object' ? v : {};
        return { conferido: v.conferido === true };
      }
      var c = x.conferencia && typeof x.conferencia === 'object' ? x.conferencia : {};
      function prevComConferencia(nome) {
        var visual = x[nome] && typeof x[nome] === 'object' ? x[nome] : {};
        var canonico = c[nome] && typeof c[nome] === 'object' ? c[nome] : {};
        return prev({ conferido: typeof canonico.conferido === 'boolean' ? canonico.conferido : visual.conferido });
      }
      return Object.assign(b, {
        codigoOrigem: texto(x.codigoOrigem), hora: texto(x.hora),
        agendaMarcia:x.agendaMarcia===true, pagamento:{recebido:!!(x.pagamento&&x.pagamento.recebido===true&&x.pagamento.valorCent===8000),valorCent:x.pagamento&&x.pagamento.valorCent===8000?8000:0,quem:texto(x.pagamento&&x.pagamento.quem),quando:texto(x.pagamento&&x.pagamento.quando)},
        vacina: prevComConferencia('vacina'), vermifugo: prevComConferencia('vermifugo'), carrapaticida: prevComConferencia('carrapaticida'),
        tutor: texto(c.tutor) || b.tutor,
        observacoes: lista(x.observacoes).map(function (o) { return { rotulo: texto(o && o.rotulo), valor: texto(o && o.valor) }; }).filter(function (o) { return o.rotulo || o.valor; }),
        conferencia: { tutor: texto(c.tutor), experiencia: texto(c.experiencia), saude: texto(c.saude), observacoes: texto(c.observacoes), revisao: inteiro(c.revisao), quem: texto(c.quem), quando: texto(c.quando), vacina: c.vacina ? prev(c.vacina) : prevComConferencia('vacina'), vermifugo: c.vermifugo ? prev(c.vermifugo) : prevComConferencia('vermifugo'), carrapaticida: c.carrapaticida ? prev(c.carrapaticida) : prevComConferencia('carrapaticida') }
      });
    });
    SECOES.forEach(function (chave) {
      var bloco = s[chave] && typeof s[chave] === 'object' ? s[chave] : {};
      saida[chave] = { estado: estado(bloco.estado), itens: lista(bloco.itens).map(function (x) {
        x = x && typeof x === 'object' ? x : {};
        var b = itemBase(x);
        return Object.assign(b, {
          situacao: texto(x && x.situacao), motivo: texto(x && x.motivo), detalhe: texto(x && x.detalhe), grupo: texto(x && x.grupo),
          refeicao: texto(x && x.refeicao), atividade: texto(x && x.atividade),
          minutos: numero(x && x.minutos), emCurso: x && x.emCurso === true
        });
      }) };
    });
    var t = s.tarefas && typeof s.tarefas === 'object' ? s.tarefas : {};
    saida.tarefas = { estado: estado(t.estado), itens: lista(t.itens).map(function (x) {
      return { id: texto(x && x.id), titulo: texto(x && x.titulo), detalhe: texto(x && x.detalhe), feito: Boolean(x && x.feito === true), quem: texto(x && x.quem), quando: texto(x && x.quando), categoria: texto(x && x.categoria) };
    }).filter(function (x) { return x.id && x.titulo; }) };
    return saida;
  }

  function calendario(dia, mesBase) {
    var selecionado = dataValida(dia) ? dia : dataSP();
    var candidato = String(mesBase || '');
    var base = /^\d{4}-(0[1-9]|1[0-2])$/.test(candidato) ? candidato : selecionado.slice(0, 7);
    var p = base.split('-').map(Number);
    var primeiro = new Date(Date.UTC(p[0], p[1] - 1, 1, 12));
    var deslocamento = primeiro.getUTCDay();
    var qtd = new Date(Date.UTC(p[0], p[1], 0, 12)).getUTCDate();
    var dias = [];
    for (var i = 0; i < deslocamento; i += 1) dias.push(null);
    for (var n = 1; n <= qtd; n += 1) { var d = base + '-' + String(n).padStart(2, '0'); dias.push({ dia: d, numero: n, selecionado: d === selecionado, hoje: d === dataSP(), passado: d < dataSP() }); }
    return { mes: base, dias: dias };
  }

  function nomeData(dia) {
    var p = dia.split('-').map(Number);
    var nome = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(Date.UTC(p[0], p[1] - 1, p[2], 12)));
    return nome.charAt(0).toLocaleUpperCase('pt-BR') + nome.slice(1);
  }

  function validarConferencia(valor, dia) {
    valor = valor && typeof valor === 'object' ? valor : {};
    var limpo = {
      tutor: texto(valor.tutor),
      vacina: { conferido: (valor.vacina || {}).conferido === true },
      vermifugo: { conferido: (valor.vermifugo || {}).conferido === true },
      carrapaticida: { conferido: (valor.carrapaticida || {}).conferido === true },
      experiencia: texto(valor.experiencia), saude: texto(valor.saude), observacoes: texto(valor.observacoes), expectedRevision: inteiro(valor.expectedRevision)
    };
    var erros = [];
    if (!limpo.tutor) erros.push('Informe o tutor.');
    ['vacina','vermifugo','carrapaticida'].forEach(function(nome){
      if (!valor[nome] || typeof valor[nome].conferido !== 'boolean') erros.push('Confira as três opções de prevenção.');
    });
    return { valido: erros.length === 0, erros: erros, valor: limpo };
  }

  function conferenciaCompleta(x, dia) {
    return x.vacina.conferido && x.vermifugo.conferido && x.carrapaticida.conferido && validarConferencia({ tutor: x.tutor, vacina: x.vacina, vermifugo: x.vermifugo, carrapaticida: x.carrapaticida }, dia).valido;
  }

  function estadoHTML(bloco, vazio) {
    if (bloco.estado === 'carregando') return '<p class="marcia129__estado" role="status">Carregando…</p>';
    if (bloco.estado === 'falha') return '<p class="marcia129__estado marcia129__estado--falha">Informação indisponível.</p>';
    if (!bloco.itens.length) return '<p class="marcia129__estado">' + esc(vazio) + '</p>';
    return '';
  }

  function prevHTML(rotulo, valor) {
    return '<li><span>' + esc(rotulo) + '</span><strong class="marcia129__situacao marcia129__situacao--' + (valor.conferido ? 'conferido' : 'conferir') + '">' + (valor.conferido ? 'Conferido' : 'A conferir') + '</strong></li>';
  }

  function agendaHTML(bloco, dia, podeSalvar, pendentes, erros) {
    var e = estadoHTML(bloco, 'Nenhuma avaliação neste dia.');
    if (e) return e;
    return '<div class="marcia129__avaliacoes">' + bloco.itens.map(function (x) {
      var obs = x.observacoes.length ? '<dl class="marcia129__obs">' + x.observacoes.map(function (o) { return '<div><dt>' + esc(o.rotulo || 'Observação') + '</dt><dd>' + esc(o.valor || 'A conferir') + '</dd></div>'; }).join('') + '</dl>' : '';
      var completa = conferenciaCompleta(x, dia);
      function campoPrev(nome, rotulo, p) { return '<label class="marcia129__prev-check" for="marcia129-' + nome + '-' + esc(x.id) + '"><input id="marcia129-' + nome + '-' + esc(x.id) + '" name="' + nome + '-conferido" type="checkbox"' + (p.conferido ? ' checked' : '') + '><span>' + rotulo + '</span></label>'; }
      var form = '';
      if (podeSalvar) {
        var dados = '<details class="marcia129__editar"' + (!x.tutor ? ' open' : '') + '><summary><span>Corrigir dados da avaliação</span><span class="marcia129__chevron" aria-hidden="true">⌄</span></summary><div class="marcia129__editar-corpo"><label class="cad-lb" for="marcia129-tutor-' + esc(x.id) + '">Tutor *</label><input class="cad-in" id="marcia129-tutor-' + esc(x.id) + '" name="tutor" required value="' + esc(x.tutor) + '"><label class="cad-lb" for="marcia129-experiencia-' + esc(x.id) + '">Experiência anterior em creche</label><textarea class="cad-in" id="marcia129-experiencia-' + esc(x.id) + '" name="experiencia" rows="2">' + esc(x.conferencia.experiencia) + '</textarea><label class="cad-lb" for="marcia129-saude-' + esc(x.id) + '">Doença ou restrição informada</label><textarea class="cad-in" id="marcia129-saude-' + esc(x.id) + '" name="saude" rows="2">' + esc(x.conferencia.saude) + '</textarea><label class="cad-lb" for="marcia129-observacoes-' + esc(x.id) + '">Observações</label><textarea class="cad-in" id="marcia129-observacoes-' + esc(x.id) + '" name="observacoes" rows="2">' + esc(x.conferencia.observacoes) + '</textarea></div></details>';
        form = '<form class="marcia129__conferencia" data-marcia-form-avaliacao="' + esc(x.id) + '"><p class="marcia129__nota">Conferência da avaliação. A ficha original permanece preservada.</p><div class="marcia129__prev-form">' + campoPrev('vacina', 'Vacina', x.vacina) + campoPrev('vermifugo', 'Vermífugo', x.vermifugo) + campoPrev('carrapaticida', 'Pulgas e carrapatos', x.carrapaticida) + '</div>' + dados + '<input type="hidden" name="expectedRevision" value="' + esc(x.conferencia.revisao) + '"><button type="submit" class="marcia129__salvar" data-marcia-salvar-avaliacao="' + esc(x.id) + '"' + (pendentes && pendentes[x.id] ? ' disabled' : '') + '>' + (pendentes && pendentes[x.id] ? 'Salvando…' : 'Salvar conferência') + '</button>' + (erros && erros[x.id] ? '<p class="marcia129__erro" role="alert">' + esc(erros[x.id]) + '</p>' : '') + '</form>';
      }
      if (x.conferencia.quem && x.conferencia.quando) form = '<p class="marcia129__situacao marcia129__situacao--conferido" role="status">Conferência salva · ' + esc(x.conferencia.quem) + ' · ' + esc(x.conferencia.quando) + '</p>' + form;
      var prevLeitura = podeSalvar ? '' : '<ul class="marcia129__prev">' + prevHTML('Vacina', x.vacina) + prevHTML('Vermífugo', x.vermifugo) + prevHTML('Pulgas e carrapatos', x.carrapaticida) + '</ul>';
      return '<details class="marcia129__avaliacao" data-marcia-avaliacao="' + esc(x.id) + '"><summary><span class="marcia129__hora">' + esc(x.hora || 'Horário a conferir') + '</span><span class="marcia129__avaliacao-resumo"><strong>' + esc(x.nome || 'FILHOt a conferir') + '</strong><small>' + esc(x.raca || 'Raça a conferir') + ' · ' + esc(x.tutor || 'Tutor a conferir') + '</small>' + (!completa ? '<em>Dados a conferir</em>' : '') + (x.agendaMarcia ? '<em class="'+(x.pagamento.recebido?'marcia129__pago':'marcia129__aguarda-pagamento')+'">'+(x.pagamento.recebido?'Confirmada · R$ 80,00 recebidos':'Pendente de pagamento · R$ 80,00')+'</em>' : '') + '</span><span class="marcia129__chevron" aria-hidden="true">⌄</span></summary><div class="marcia129__avaliacao-corpo">' + prevLeitura + obs + form + '</div></details>';
    }).join('') + '</div>';
  }

  function tarefasHTML(bloco, pendentes, erro) {
    var e = estadoHTML(bloco, 'Nenhuma tarefa para este dia.');
    if (e) return e;
    function itensHTML(itens) { return itens.map(function (x) {
      var busy = pendentes && pendentes[x.id];
      var falha = erro && erro[x.id];
      return '<div class="todo-item marcia129__tarefa' + (x.feito ? ' is-feita' : '') + '"><button type="button" class="marcia129__check" data-marcia-tarefa="' + esc(x.id) + '" aria-pressed="' + (x.feito ? 'true' : 'false') + '"' + (busy ? ' disabled' : '') + '><span aria-hidden="true">' + (x.feito ? '✓' : '') + '</span><span class="sr-only">' + (x.feito ? 'Desfazer ' : 'Marcar ') + esc(x.titulo) + '</span></button><div><strong>' + esc(x.titulo) + '</strong>' + (x.detalhe ? '<p>' + esc(x.detalhe) + '</p>' : '') + (x.quem || x.quando ? '<small>' + esc([x.quem, x.quando].filter(Boolean).join(' · ')) + '</small>' : '') + (busy ? '<small role="status">Salvando…</small>' : '') + (falha ? '<small class="marcia129__erro" role="alert">Não foi possível salvar. Tente novamente.</small>' : '') + '</div></div>';
    }).join(''); }
    var pend = bloco.itens.filter(function (x) { return !x.feito; });
    var feitas = bloco.itens.filter(function (x) { return x.feito; });
    var h = '<div class="marcia129__tarefas">' + (pend.length ? itensHTML(pend) : '<p class="marcia129__estado">Nada pendente.</p>') + '</div>';
    if (feitas.length) h += '<details class="marcia129__feitas"><summary><span>Feitas (' + feitas.length + ')</span><span class="marcia129__chevron" aria-hidden="true">⌄</span></summary><div class="marcia129__tarefas">' + itensHTML(feitas) + '</div></details>';
    return h;
  }

  function quantidadesHTML(q) {
    if (q.estado === 'carregando') return '<p class="marcia129__estado" role="status">Carregando quantidades…</p>';
    if (q.estado === 'falha') return '<p class="marcia129__estado marcia129__estado--falha">Quantidades indisponíveis.</p>';
    function k(rotulo, v, extra, classe) { return '<div class="pm-tile ' + classe + '"><b>' + (v == null ? '—' : esc(v)) + '</b><span>' + esc(rotulo) + '</span>' + (extra ? '<small>' + esc(extra) + '</small>' : '') + '</div>'; }
    return '<div class="pm-tiles pm-grandes marcia129__kpis">' + k('Matriculados previstos', q.matriculados, '', 'marcia129__tile--daycare') + k('Avulsos', q.avulsos, '', 'marcia129__tile--avulso') + k('Reposições', q.reposicoes, '', 'marcia129__tile--reposicao') + k('Total Day Care', q.total, q.presentes == null ? '' : q.presentes + ' presentes', 'marcia129__tile--total') + k('Hóspedes', q.hospedes, 'contagem separada', 'marcia129__tile--hospedes') + '</div>';
  }

  function listaSecao(bloco, chave) {
    var e = estadoHTML(bloco, 'Nenhum registro neste dia.');
    if (e) return e;
    return '<ul class="marcia129__lista">' + bloco.itens.map(function (x) {
      var titulo = x.nome || x.atividade || 'Item';
      var meta = [x.raca, x.tutor, x.situacao, x.motivo, x.refeicao].filter(Boolean).join(' · ');
      if (chave === 'tempos') meta = (x.atividade || 'Atividade') + ' · ' + (x.minutos != null ? x.minutos + ' min' : x.emCurso ? 'Em curso' : 'duração a conferir');
      return '<li><strong>' + esc(titulo) + '</strong>' + (meta ? '<span>' + esc(meta) + '</span>' : '') + (x.detalhe ? '<p>' + esc(x.detalhe) + '</p>' : '') + '</li>';
    }).join('') + '</ul>';
  }

  function desenhar(snapshot, ui) {
    ui = ui || {};
    var s = normalizar(snapshot, ui.dia);
    var cal = calendario(s.dia, ui.mes);
    var mesNome = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', month: 'long', year: 'numeric' }).format(new Date(cal.mes + '-01T12:00:00Z'));
    var semana = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'].map(function (x) { return '<div class="dcal-sem">' + x + '</div>'; }).join('');
    var dias = cal.dias.map(function (x) { if (!x) return '<button type="button" class="dcal-dia" disabled aria-hidden="true"></button>'; return '<button type="button" data-marcia-dia="' + x.dia + '" class="dcal-dia' + (x.selecionado ? ' sel' : x.passado ? ' passado' : '') + (x.hoje ? ' hoje' : '') + '" aria-label="' + esc(nomeData(x.dia)) + '" aria-pressed="' + (x.selecionado ? 'true' : 'false') + '">' + x.numero + '</button>'; }).join('');
    var secoesTela = [
      { chave: 'faltas', titulo: 'Faltas', bloco: s.faltas, tom: 'critico' },
      { chave: 'novatos', titulo: 'Novatos', bloco: s.novatos, tom: 'info' },
      { chave: 'comida-daycare', titulo: 'Quem não comeu — Day Care', bloco: { estado: s.comida.estado, itens: s.comida.itens.filter(function (x) { return x.grupo === 'daycare'; }) }, tom: 'atencao' },
      { chave: 'comida-hospedes', titulo: 'Quem não comeu — Hóspedes', bloco: { estado: s.comida.estado, itens: s.comida.itens.filter(function (x) { return x.grupo === 'hospede'; }) }, tom: 'critico' },
      { chave: 'comida-conferir', titulo: 'Quem não comeu — grupo a conferir', bloco: { estado: s.comida.estado, itens: s.comida.itens.filter(function (x) { return x.grupo !== 'daycare' && x.grupo !== 'hospede'; }) }, tom: 'atencao' },
      { chave: 'saude', titulo: 'Questões do check-in', bloco: s.saude, tom: 'atencao' },
      { chave: 'tempos', titulo: 'Tempo nas atividades', bloco: s.tempos, tom: 'neutro' }
    ];
    secoesTela = secoesTela.filter(function (secao) { return secao.chave !== 'comida-conferir' || secao.bloco.itens.length > 0; });
    var accordions = secoesTela.map(function (secao) {
      var chave = secao.chave, b = secao.bloco;
      var contagem = b.estado === 'pronto' ? b.itens.length : '—';
      var tom = b.estado === 'pronto' && b.itens.length > 0 ? secao.tom : 'neutro';
      return '<details class="ficha-topico marcia129__topico" data-marcia-secao="' + chave + '"><summary><span>' + secao.titulo + '</span><span class="marcia129__resumo-final"><strong class="marcia129__secao-badge marcia129__secao-badge--' + tom + '">' + contagem + '</strong><span class="marcia129__chevron" aria-hidden="true">⌄</span></span></summary><div class="marcia129__topico-corpo">' + listaSecao(b, chave.indexOf('comida-') === 0 ? 'comida' : chave) + '</div></details>';
    }).join('');
    var atualizado = s.atualizadoEm ? '<p class="marcia129__atualizado">Atualizado em ' + esc(s.atualizadoEm) + '</p>' : '';
    var agendaContagem = s.agenda.estado === 'pronto' ? s.agenda.itens.length : '—';
    return '<div class="marcia129" data-marcia-dia-atual="' + s.dia + '"><header class="marcia129__cabecalho"><div><p class="marcia129__sobretitulo">Márcia · Gestão</p><h2>' + esc(nomeData(s.dia)) + '</h2>' + atualizado + '</div><button type="button" class="marcia129__hoje" data-marcia-hoje>Hoje</button></header><section class="pm-card marcia129__agenda" aria-labelledby="marcia129-agenda"><div class="marcia129__titulo"><h2 class="pm-tit" id="marcia129-agenda">Agenda da Márcia</h2><span class="marcia129__badge">Avaliações do dia (' + agendaContagem + ')</span></div><div class="dcal marcia129__cal"><div class="dcal-top"><button type="button" class="dcal-nav" data-marcia-mes="-1" aria-label="mês anterior">‹</button><span class="dcal-mes">' + esc(mesNome) + '</span><button type="button" class="dcal-nav" data-marcia-mes="1" aria-label="próximo mês">›</button></div><div class="dcal-grade">' + semana + dias + '</div></div><div class="marcia129__agenda-lista">' + agendaHTML(s.agenda, s.dia, ui.podeSalvarAvaliacao, ui.avaliacoesPendentes, ui.avaliacoesErros) + '</div></section><section class="pm-card marcia129__todo" aria-labelledby="marcia129-todo"><h2 class="pm-tit" id="marcia129-todo">O que fazer hoje</h2>' + tarefasHTML(s.tarefas, ui.pendentes, ui.erros) + '</section><section class="marcia129__quantidades" aria-labelledby="marcia129-quantidades"><h2 class="pm-tit" id="marcia129-quantidades">Visão do dia</h2>' + quantidadesHTML(s.quantidades) + '</section><section class="marcia129__detalhes" aria-label="Detalhes do dia">' + accordions + '</section></div>';
  }

  function montar(root, opcoes) {
    if (!root || typeof root.addEventListener !== 'function') throw new TypeError('raiz_invalida');
    opcoes = opcoes || {};
    if (typeof opcoes.carregar !== 'function' || typeof opcoes.salvarTarefa !== 'function') throw new TypeError('provider_invalido');
    var vivo = true, versao = 0, revisaoLive = 0;
    var ui = { dia: dataValida(opcoes.dia) ? opcoes.dia : dataSP(), mes: '', pendentes: {}, erros: {}, podeSalvarAvaliacao: typeof opcoes.salvarAvaliacao === 'function', avaliacoesPendentes: {}, avaliacoesErros: {} };
    var atual = normalizar({ dia: ui.dia, agenda: { estado: 'carregando' }, quantidades: { estado: 'carregando' }, faltas: { estado: 'carregando' }, novatos: { estado: 'carregando' }, comida: { estado: 'carregando' }, saude: { estado: 'carregando' }, tempos: { estado: 'carregando' }, tarefas: { estado: 'carregando' } }, ui.dia);

    function pintar() {
      if (!vivo) return;
      var abertos = Array.prototype.map.call(root.querySelectorAll('details[open][data-marcia-secao]'), function (x) { return x.getAttribute('data-marcia-secao'); });
      var avaliacoesAbertas = Array.prototype.map.call(root.querySelectorAll('details[open][data-marcia-avaliacao]'), function (x) { return x.getAttribute('data-marcia-avaliacao'); });
      var edicoesAbertas = Array.prototype.map.call(root.querySelectorAll('details[open].marcia129__editar'), function (x) { var pai = x.closest('details[data-marcia-avaliacao]'); return pai ? pai.getAttribute('data-marcia-avaliacao') : ''; }).filter(Boolean);
      var ativo = root.ownerDocument && root.ownerDocument.activeElement && root.contains(root.ownerDocument.activeElement) ? root.ownerDocument.activeElement : null;
      var foco = ativo ? ativo.getAttribute('data-marcia-tarefa') || ativo.getAttribute('data-marcia-dia') || ativo.getAttribute('data-marcia-mes') || (ativo.hasAttribute('data-marcia-hoje') ? 'hoje' : '') : '';
      var focoSecao = ativo && ativo.closest ? ativo.closest('details[data-marcia-secao]') : null;
      focoSecao = focoSecao ? focoSecao.getAttribute('data-marcia-secao') : '';
      var focoId = ativo && ativo.id ? ativo.id : '';
      root.innerHTML = desenhar(atual, ui);
      abertos.forEach(function (id) { var d = root.querySelector('details[data-marcia-secao="' + id + '"]'); if (d) d.open = true; });
      avaliacoesAbertas.forEach(function (id) { var d = root.querySelector('details[data-marcia-avaliacao="' + id + '"]'); if (d) d.open = true; });
      edicoesAbertas.forEach(function (id) { var d = root.querySelector('details[data-marcia-avaliacao="' + id + '"] .marcia129__editar'); if (d) d.open = true; });
      if (foco || focoSecao) {
        var seletor = foco === 'hoje' ? '[data-marcia-hoje]' : foco ? '[data-marcia-tarefa="' + foco + '"],[data-marcia-dia="' + foco + '"],[data-marcia-mes="' + foco + '"]' : 'details[data-marcia-secao="' + focoSecao + '"]>summary';
        var el = focoId ? root.querySelector('#' + focoId) : root.querySelector(seletor); if (el) el.focus();
      }
    }

    function carregar(dia) {
      ui.dia = dia; ui.mes = dia.slice(0, 7); ui.erros = {}; ui.pendentes = {}; ui.avaliacoesPendentes = {}; ui.avaliacoesErros = {};
      var minha = ++versao;
      var liveNoInicio = revisaoLive;
      atual = normalizar({ dia: dia, agenda: { estado: 'carregando' }, quantidades: { estado: 'carregando' }, faltas: { estado: 'carregando' }, novatos: { estado: 'carregando' }, comida: { estado: 'carregando' }, saude: { estado: 'carregando' }, tempos: { estado: 'carregando' }, tarefas: { estado: 'carregando' } }, dia);
      pintar();
      return Promise.resolve().then(function () { return opcoes.carregar(dia); }).then(function (dados) {
        if (!vivo || minha !== versao || ui.dia !== dia || revisaoLive !== liveNoInicio) return false;
        if (!dados || dados.dia !== dia) {
          atual = normalizar({ dia: dia, agenda: { estado: 'falha' }, quantidades: { estado: 'falha' }, faltas: { estado: 'falha' }, novatos: { estado: 'falha' }, comida: { estado: 'falha' }, saude: { estado: 'falha' }, tempos: { estado: 'falha' }, tarefas: { estado: 'falha' } }, dia);
          pintar(); return false;
        }
        atual = normalizar(dados, dia); pintar(); return true;
      }, function () {
        if (!vivo || minha !== versao || ui.dia !== dia || revisaoLive !== liveNoInicio) return false;
        atual = normalizar({ dia: dia, agenda: { estado: 'falha' }, quantidades: { estado: 'falha' }, faltas: { estado: 'falha' }, novatos: { estado: 'falha' }, comida: { estado: 'falha' }, saude: { estado: 'falha' }, tempos: { estado: 'falha' }, tarefas: { estado: 'falha' } }, dia); pintar(); return false;
      });
    }

    function clique(ev) {
      var alvo = ev.target.closest && ev.target.closest('[data-marcia-dia],[data-marcia-mes],[data-marcia-hoje],[data-marcia-tarefa]');
      if (!alvo || !root.contains(alvo)) return;
      if (alvo.hasAttribute('data-marcia-dia')) { carregar(alvo.getAttribute('data-marcia-dia')); return; }
      if (alvo.hasAttribute('data-marcia-hoje')) { carregar(dataSP()); return; }
      if (alvo.hasAttribute('data-marcia-mes')) {
        var p = ui.mes.split('-').map(Number), delta = Number(alvo.getAttribute('data-marcia-mes'));
        var d = new Date(Date.UTC(p[0], p[1] - 1 + delta, 1, 12)); ui.mes = d.toISOString().slice(0, 7); pintar(); return;
      }
      var id = alvo.getAttribute('data-marcia-tarefa');
      var tarefa = atual.tarefas.itens.find(function (x) { return x.id === id; });
      if (!tarefa || ui.pendentes[id]) return;
      ui.pendentes[id] = true; delete ui.erros[id]; pintar();
      var diaPedido = ui.dia, minha = versao;
      Promise.resolve().then(function () { return opcoes.salvarTarefa({ dia: diaPedido, id: id, feito: !tarefa.feito }); }).then(function (registro) {
        if (!vivo || minha !== versao || diaPedido !== ui.dia) return;
        if (!registro || typeof registro.feito !== 'boolean' || registro.feito !== !tarefa.feito || !texto(registro.quem) || !texto(registro.quando) || (registro.id != null && texto(registro.id) !== id)) throw new Error('confirmacao_invalida');
        delete ui.pendentes[id];
        var atualTarefa = atual.tarefas.itens.find(function (x) { return x.id === id; });
        if (atualTarefa) { atualTarefa.feito = Boolean(registro && registro.feito); atualTarefa.quem = texto(registro && registro.quem); atualTarefa.quando = texto(registro && registro.quando); }
        pintar();
      }).catch(function () { if (!vivo || minha !== versao || diaPedido !== ui.dia) return; delete ui.pendentes[id]; ui.erros[id] = true; pintar(); });
    }

    function valorCampo(form, nome) {
      var el = form.querySelector('[name="' + nome + '"]');
      return el ? el.value : '';
    }
    function campoMarcado(form, nome) { var el = form.querySelector('[name="' + nome + '"]'); return Boolean(el && el.checked === true); }

    function submeter(ev) {
      var form = ev.target && ev.target.closest ? ev.target.closest('form[data-marcia-form-avaliacao]') : null;
      if (!form || !root.contains(form) || !ui.podeSalvarAvaliacao) return;
      ev.preventDefault();
      var id = form.getAttribute('data-marcia-form-avaliacao');
      var item = atual.agenda.itens.find(function (x) { return x.id === id; });
      if (!item || ui.avaliacoesPendentes[id]) return;
      function prev(nome) { return { conferido: campoMarcado(form, nome + '-conferido') }; }
      var leitura = validarConferencia({
        tutor: valorCampo(form, 'tutor'), vacina: prev('vacina'), vermifugo: prev('vermifugo'), carrapaticida: prev('carrapaticida'),
        experiencia: valorCampo(form, 'experiencia'), saude: valorCampo(form, 'saude'), observacoes: valorCampo(form, 'observacoes'), expectedRevision: valorCampo(form, 'expectedRevision')
      }, ui.dia);
      if (!leitura.valido) { ui.avaliacoesErros[id] = leitura.erros.join(' '); pintar(); return; }
      ui.avaliacoesPendentes[id] = true; delete ui.avaliacoesErros[id]; pintar();
      var diaPedido = ui.dia, minha = versao;
      var pedido = Object.assign({ dia: diaPedido, id: id }, leitura.valor);
      Promise.resolve().then(function () { return opcoes.salvarAvaliacao(pedido); }).then(function (ack) {
        if (!vivo || minha !== versao || diaPedido !== ui.dia) return;
        if (!ack || texto(ack.id) !== id || !ack.agenda || typeof ack.agenda !== 'object' || !ack.conferencia || typeof ack.conferencia !== 'object') throw new Error('confirmacao_avaliacao_invalida');
        if (item.codigoOrigem && texto(ack.codigoOrigem) !== item.codigoOrigem) throw new Error('confirmacao_avaliacao_invalida');
        var agendaAck = ack.agenda, conferenciaAck = ack.conferencia;
        var checagem = validarConferencia({ tutor: agendaAck.tutor || conferenciaAck.tutor, vacina: agendaAck.vacina, vermifugo: agendaAck.vermifugo, carrapaticida: agendaAck.carrapaticida }, diaPedido);
        var escolhasIguais = ['vacina','vermifugo','carrapaticida'].every(function(nome){return agendaAck[nome] && agendaAck[nome].conferido === pedido[nome].conferido;});
        if (!checagem.valido || !escolhasIguais || !texto(conferenciaAck.quem) || !texto(conferenciaAck.quando)) throw new Error('confirmacao_avaliacao_invalida');
        var mesclado = Object.assign({}, item, agendaAck, { codigoOrigem: texto(ack.codigoOrigem) || item.codigoOrigem, conferencia: Object.assign({}, item.conferencia, { tutor: agendaAck.tutor }, conferenciaAck) });
        var normalizado = normalizar({ dia: diaPedido, agenda: { estado: 'pronto', itens: [mesclado] } }, diaPedido).agenda.itens[0];
        var pos = atual.agenda.itens.findIndex(function (x) { return x.id === id; });
        if (pos >= 0) atual.agenda.itens[pos] = normalizado;
        delete ui.avaliacoesPendentes[id]; pintar();
      }).catch(function () { if (!vivo || minha !== versao || diaPedido !== ui.dia) return; delete ui.avaliacoesPendentes[id]; ui.avaliacoesErros[id] = 'Não foi possível salvar a conferência. Tente novamente.'; pintar(); });
    }

    root.addEventListener('click', clique);
    root.addEventListener('submit', submeter);
    carregar(ui.dia);
    return {
      destroy: function () { vivo = false; versao += 1; root.removeEventListener('click', clique); root.removeEventListener('submit', submeter); root.innerHTML = ''; },
      carregar: carregar,
      atualizar: function (snapshot) {
        if (!vivo || !snapshot || snapshot.dia !== ui.dia) return false;
        revisaoLive += 1; atual = normalizar(snapshot, ui.dia); pintar(); return true;
      },
      getDia: function () { return ui.dia; }
    };
  }

  return { montar: montar, normalizar: normalizar, desenhar: desenhar, calendario: calendario, dataSP: dataSP, validarConferencia: validarConferencia };
});
