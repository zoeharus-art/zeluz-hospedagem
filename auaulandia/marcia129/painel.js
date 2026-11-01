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
  function telefoneBR(valor) { var d=texto(valor).replace(/\D/g,'');if((d.length===12||d.length===13)&&d.slice(0,2)==='55')return'+'+d;if(d.length===10||d.length===11)return'+55'+d;return''; }
  function linkWhatsApp(valor) { var t=telefoneBR(valor);return t?'https://wa.me/'+t.slice(1):''; }
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
      entrevistas: { estado: estado(s.entrevistas&&s.entrevistas.estado), itens: lista(s.entrevistas&&s.entrevistas.itens).filter(function(x){return x&&x.cancelada!==true;}).map(function(x){return {id:texto(x.id).indexOf('entrevista:')===0?texto(x.id):'entrevista:'+texto(x.id),nome:texto(x.nome),vaga:texto(x.vaga),hora:texto(x.hora),telefone:telefoneBR(x.telefone)};}) },
      quantidades: { estado: estado(q.estado), matriculados: numero(q.matriculados), avulsos: numero(q.avulsos), reposicoes: numero(q.reposicoes), total: numero(q.total), hospedes: numero(q.hospedes), presentes: numero(q.presentes) },
      tarefas: { estado: 'falha', itens: [] }
    };
    saida.agenda.itens = lista(agenda.itens).map(function (x) {
      x = x && typeof x === 'object' ? x : {};
      var b = itemBase(x);
      function prev(v) {
        v = v && typeof v === 'object' ? v : {};
        var out={conferido:v.conferido===true};if(['em_dia','antes','na_zeluz','a_conferir'].indexOf(v.plano)>=0){out.plano=v.plano;out.detalhe=texto(v.detalhe);}return Object.assign(out,registro171(v));
      }
      var c = x.conferencia && typeof x.conferencia === 'object' ? x.conferencia : {};
      function prevComConferencia(nome) {
        var visual = x[nome] && typeof x[nome] === 'object' ? x[nome] : {};
        var canonico = c[nome] && typeof c[nome] === 'object' ? c[nome] : {};
        return prev(Object.assign({}, visual, canonico, { conferido: typeof canonico.conferido === 'boolean' ? canonico.conferido : visual.conferido }));
      }
      return Object.assign(b, {
        codigoOrigem: texto(x.codigoOrigem), hora: texto(x.hora), idade: texto(x.idade),
        agendaMarcia:x.agendaMarcia===true, pagamento:{recebido:!!(x.pagamento&&x.pagamento.recebido===true&&x.pagamento.valorCent===8000),valorCent:x.pagamento&&x.pagamento.valorCent===8000?8000:0,quem:texto(x.pagamento&&x.pagamento.quem),quando:texto(x.pagamento&&x.pagamento.quando)},
        vacina: prevComConferencia('vacina'), vermifugo: prevComConferencia('vermifugo'), carrapaticida: prevComConferencia('carrapaticida'),
        tutor: texto(c.tutor) || b.tutor, telefone: telefoneBR(x.telefone),
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
  function mesAvaliacoes(valor, mes, anterior) {
    valor = valor && typeof valor === 'object' ? valor : {};
    var st = ['pronto','carregando','falha'].indexOf(valor.estado) >= 0 ? valor.estado : 'falha', dias = {};
    if (st !== 'pronto' && anterior && anterior.mes === mes) Object.keys(anterior.dias || {}).forEach(function (d) { if (anterior.dias[d] === true) dias[d] = true; });
    if (valor.mes === mes && valor.dias && typeof valor.dias === 'object') Object.keys(valor.dias).forEach(function (d) { if (d.slice(0, 7) === mes && valor.dias[d] === true) dias[d] = true; });
    return { mes: mes, estado: st, dias: dias };
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
    var plano=valor.plano||(valor.conferido?'em_dia':'a_conferir'),rot=({em_dia:'Em dia',antes:'Vai fazer antes da avaliação',na_zeluz:'Vai fazer na Zêluz',a_conferir:'A conferir'})[plano]||'A conferir';return '<li><span>'+esc(rotulo)+'</span><span class="marcia129__situacao marcia129__situacao--'+(plano==='em_dia'?'conferido':'conferir')+'">'+esc(rot)+'</span>'+(valor.detalhe?'<small>'+esc(valor.detalhe)+'</small>':'')+(!valor.plano&&valor.conferido?'<small>origem não registrada</small>':'')+'</li>';
  }

  var ICONE_WA = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true" focusable="false"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>';
  var ICONE_COPIAR = '<svg class="m171__i-copiar" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg><svg class="m171__i-ok" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 12.5l4.5 4.5L19 7"/></svg>';
  /* O mesmo box de telefone da Agenda Márcia (30/out/2026): WhatsApp dentro, à esquerda; copiar à direita (vira ✓ e «Copiado» por 2 s). */
  function telefoneHTML(item) {
    var tel = telefoneBR(item && item.telefone), link = linkWhatsApp(tel);
    if (!tel) return '<p class="marcia129__telefone-aviso" role="status">Telefone do tutor não informado neste registro.</p>';
    return '<div class="marcia129__contato"><span class="marcia129__telefone-rotulo">Telefone</span><div class="m171__tel-box"><a class="m171__tel-wa" href="' + esc(link) + '" target="_blank" rel="noopener noreferrer" aria-label="Abrir o WhatsApp do tutor">' + ICONE_WA + '</a><a class="marcia129__telefone m171__tel-link" href="' + esc(link) + '" target="_blank" rel="noopener noreferrer" aria-label="Abrir conversa com o tutor no WhatsApp">' + esc(tel) + '</a><span class="m171__tel-ok" role="status">Copiado</span><button type="button" class="marcia129__copiar m171__btn-icone" data-marcia-copiar-telefone="' + esc(item.id) + '" aria-label="Copiar telefone">' + ICONE_COPIAR + '</button></div></div>';
  }

  /* ===== 30/out/2026 — a agenda do dia da Márcia (maquete aprovada pela Adriana) =====
     Cada avaliação mostra os três cuidados como checklist: «Em dia» já vem marcado (apagado); «Vai fazer na Zêluz» (e os
     registros antigos «antes», «a conferir» ou sem escolha) ficam abertos para «Revisei», depois «Feito» com o registro
     (o que foi feito, o que foi usado e como o peludinho ficou). Reação acende o alerta até alguém marcar «Tutor avisado». */
  var CUIDADOS171 = [['vacina', 'Vacina'], ['vermifugo', 'Vermífugo'], ['carrapaticida', 'Carrapaticida']];
  var REACOES171 = [['bem', 'Bem, sem reação'], ['dor', 'Dor'], ['vomito', 'Vômito'], ['diarreia', 'Diarreia'], ['outro', 'Outro']];
  var QTD171 = [{ v: 'PIPETA', t: 'Pipeta (o tubo inteiro)' }, { v: 'MEIO COMPRIMIDO', t: '½ comprimido' }, { v: '1 COMPRIMIDO', t: '1 comprimido' }, { v: '2 COMPRIMIDOS', t: '2 comprimidos' }];
  /* As quantidades do carrapaticida são as mesmas do app (DASH_QTD_PIP); fora do app, os mesmos rótulos. */
  function qtdOpcoes171() { try { var g = typeof globalThis !== 'undefined' ? globalThis.DASH_QTD_PIP : null; if (Array.isArray(g) && g.length && g.every(function (o) { return o && typeof o.v === 'string' && typeof o.t === 'string'; })) return g; } catch (_) {} return QTD171; }
  function qtdTexto171(v) { var o = qtdOpcoes171().filter(function (x) { return x.v === v; })[0]; return o ? o.t : texto(v); }
  function registro171(v) {
    v = v && typeof v === 'object' ? v : {}; var out = {}, r = v.revisao || {}, f = v.feito || {}, t = v.tutorAvisado || {}, ok = REACOES171.map(function (x) { return x[0]; });
    if (texto(r.por) && Number(r.em) > 0) out.revisao = { por: texto(r.por), em: Number(r.em) };
    if (texto(f.por) && Number(f.em) > 0) out.feito = { oQue: texto(f.oQue), usado: texto(f.usado), qtd: texto(f.qtd), reacoes: lista(f.reacoes).map(texto).filter(function (x) { return ok.indexOf(x) >= 0; }), obs: texto(f.obs), por: texto(f.por), em: Number(f.em) };
    if (texto(t.por) && Number(t.em) > 0) out.tutorAvisado = { por: texto(t.por), em: Number(t.em) };
    return out;
  }
  function comReacao171(reacoes) { var r = lista(reacoes); return r.length > 0 && r.indexOf('bem') < 0; }
  function horaSP171(ts) { try { return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(Number(ts))); } catch (_) { return ''; } }
  function reacoesTexto171(reacoes) { var r = lista(reacoes); if (!comReacao171(r)) return 'sem reação'; return r.map(function (v) { var o = REACOES171.filter(function (x) { return x[0] === v; })[0]; return o ? o[1].toLocaleLowerCase('pt-BR') : v; }).join(', '); }
  /* Estado de UM cuidado na agenda do dia: em_dia, aberto (falta revisar), revisado, feito, alerta (reação sem «Tutor avisado») ou avisado. */
  function estadoCuidado171(v) {
    v = v || {};
    if (v.plano === 'em_dia') return 'em_dia';
    if (v.feito) return comReacao171(v.feito.reacoes) ? (v.tutorAvisado ? 'avisado' : 'alerta') : 'feito';
    return v.revisao ? 'revisado' : 'aberto';
  }
  /* A conta da faixa do topo e do contador do menu: cuidados ainda não revisados + reações sem «Tutor avisado».
     Só entra o agendamento da Agenda Márcia — é o único em que a Márcia consegue registrar pela tela. */
  function contarCuidados171(itens) {
    var out = { avaliacoes: 0, revisar: 0, alertas: 0 };
    lista(itens).forEach(function (x) {
      if (!x) return; out.avaliacoes += 1; if (x.agendaMarcia !== true) return;
      CUIDADOS171.forEach(function (c) { var e = estadoCuidado171(x[c[0]]); if (e === 'aberto') out.revisar += 1; else if (e === 'alerta') out.alertas += 1; });
    });
    return out;
  }
  function planoLegado171(v) {
    var p = v && v.plano;
    if (p === 'antes') return 'Registro antigo: «Vai fazer antes da avaliação» — a revisar';
    if (p === 'a_conferir') return 'Registro antigo: «A conferir» — a revisar';
    if (p === 'na_zeluz') return '';
    return v && v.conferido === true ? 'Registro antigo sem escolha (Em dia, origem não registrada) — a revisar' : 'Registro antigo sem escolha (A conferir) — a revisar';
  }
  /* «Mensagem para o tutor» quando o peludinho teve reação. TEXTO A APROVAR pela Adriana: neutro, sem emoji, mostrado na
     tela antes de ser enviado (a pessoa copia ou abre o WhatsApp). Não sai sozinho. */
  function mensagemReacao171(item, k, f) {
    var tutor = texto(item && item.tutor).split(/[\s\/,]+/)[0], nome = texto(item && item.nome) || 'o peludinho', c = CUIDADOS171.filter(function (x) { return x[0] === k; })[0];
    var usado = texto(f.usado) + (f.qtd ? ' · ' + qtdTexto171(f.qtd) : '');
    return 'Olá' + (tutor ? ', ' + tutor : '') + '! Aqui é a Márcia, da Zêluz.\n'
      + 'Hoje, na avaliação, ' + nome + ' recebeu ' + (c ? c[1].toLocaleLowerCase('pt-BR') : 'um cuidado') + ': ' + texto(f.oQue) + (usado ? ' (' + usado + ')' : '') + '.\n'
      + 'Depois, apresentou: ' + reacoesTexto171(f.reacoes) + '.' + (texto(f.obs) ? ' Observação: ' + texto(f.obs) + '.' : '') + '\n'
      + 'Estamos acompanhando de perto. Se notar algo diferente em casa, é só falar com a gente.';
  }
  function chave171(id, k) { return id + '|' + k; }
  function registroFormHTML171(item, k, rot, r, ui) {
    var id = item.id, base = 'm171-' + esc(id) + '-' + k, ch = chave171(id, k), busy = ui.cuidadosPendentes && ui.cuidadosPendentes[ch];
    function chip(f, v, t, on, risco) { return '<button type="button" class="m171__chip' + (risco ? ' m171__chip--risco' : '') + '" data-m171-chip="' + esc(ch) + '" data-f="' + f + '" data-v="' + esc(v) + '" aria-pressed="' + (on ? 'true' : 'false') + '">' + esc(t) + '</button>'; }
    var usado = '<label class="cad-lb" for="' + base + '-usado">' + (k === 'carrapaticida' ? 'Produto usado' : 'O que foi usado (produto e dose)') + '</label><input class="cad-in" id="' + base + '-usado" data-m171-campo="' + esc(ch) + '" data-f="usado" maxlength="200" autocomplete="off" value="' + esc(r.usado) + '">';
    if (k === 'carrapaticida') usado += '<p class="cad-lb" id="' + base + '-qtd">Quanto foi usado</p><div class="m171__chips" role="group" aria-labelledby="' + base + '-qtd">' + qtdOpcoes171().map(function (o) { return chip('qtd', o.v, o.t, r.qtd === o.v, false); }).join('') + '</div>';
    var risco = comReacao171(r.reacoes);
    return '<div class="m171__reg" data-m171-form="' + esc(ch) + '"><label class="cad-lb" for="' + base + '-oque">O que foi feito</label><input class="cad-in" id="' + base + '-oque" data-m171-campo="' + esc(ch) + '" data-f="oQue" maxlength="300" autocomplete="off" value="' + esc(r.oQue) + '">' + usado
      + '<p class="cad-lb" id="' + base + '-reacao">Como o peludinho ficou depois</p><div class="m171__chips" role="group" aria-labelledby="' + base + '-reacao">' + REACOES171.map(function (o) { return chip('reacao', o[0], o[1], lista(r.reacoes).indexOf(o[0]) >= 0, o[0] !== 'bem'); }).join('') + '</div>'
      + '<div class="m171__obs"' + (risco ? '' : ' hidden') + '><label class="cad-lb" for="' + base + '-obs">Observação (o que aconteceu e quando)</label><textarea class="cad-in" id="' + base + '-obs" data-m171-campo="' + esc(ch) + '" data-f="obs" maxlength="500" rows="2">' + esc(r.obs) + '</textarea></div>'
      + (ui.cuidadosErros && ui.cuidadosErros[ch] ? '<p class="marcia129__erro" role="alert">' + esc(ui.cuidadosErros[ch]) + '</p>' : '')
      + '<div class="m171__acoes"><button type="button" class="m171__btn m171__btn--gold" data-m171-acao="salvar-feito" data-m171="' + esc(ch) + '"' + (busy ? ' disabled' : '') + '>' + (busy ? 'Salvando…' : 'Salvar o que foi feito') + '</button><button type="button" class="m171__btn m171__btn--sec" data-m171-acao="cancelar" data-m171="' + esc(ch) + '"' + (busy ? ' disabled' : '') + '>Cancelar</button></div></div>';
  }
  function cuidadoItemHTML171(item, k, rot, ui) {
    var v = item[k] || {}, e = estadoCuidado171(v), ch = chave171(item.id, k), busy = ui.cuidadosPendentes && ui.cuidadosPendentes[ch], erro = ui.cuidadosErros && ui.cuidadosErros[ch];
    var attr = ' data-m171="' + esc(ch) + '"' + (busy ? ' disabled' : '');
    var erroHTML = erro ? '<p class="marcia129__erro" role="alert">' + esc(erro) + '</p>' : '';
    if (e === 'em_dia') return '<li class="m171__it is-feito"><span class="m171__caixa ok" aria-hidden="true">✓</span><div class="m171__txt"><strong>' + rot + '</strong><small>Em dia</small></div></li>';
    var qual = v.plano === 'na_zeluz' ? (texto(v.detalhe) ? '<p class="m171__qual">Qual: ' + esc(v.detalhe) + '</p>' : '<p class="m171__qual">Qual: não informado</p>') : '<p class="m171__qual">' + esc(planoLegado171(v)) + (texto(v.detalhe) ? ' · ' + esc(v.detalhe) : '') + '</p>';
    if (item.agendaMarcia !== true) return '<li class="m171__it is-aberto"><span class="m171__caixa" aria-hidden="true"></span><div class="m171__txt"><strong>' + rot + '</strong>' + qual + '<span class="m171__pend">Lançado fora da Agenda Márcia: confira na ficha.</span></div></li>';
    if (e === 'feito' || e === 'alerta' || e === 'avisado') {
      var f = v.feito, usado = texto(f.usado) + (f.qtd ? ' · ' + qtdTexto171(f.qtd) : '');
      var corpo = '<strong>' + rot + ': feito na Zêluz</strong><p class="m171__resumo">Feito por ' + esc(f.por) + ' às ' + esc(horaSP171(f.em)) + ' · ' + esc(f.oQue) + ' · ' + esc(reacoesTexto171(f.reacoes)) + '</p>' + (usado ? '<p class="m171__usado">Usado: ' + esc(usado) + '</p>' : '') + (texto(f.obs) ? '<p class="m171__usado">Observação: ' + esc(f.obs) + '</p>' : '');
      if (e === 'alerta') {
        var msg = mensagemReacao171(item, k, f), link = linkWhatsApp(item.telefone), aberta = ui.mensagensAbertas && ui.mensagensAbertas[ch], mid = 'm171-msg-' + esc(item.id) + '-' + k;
        corpo += '<span class="m171__tag-alerta">Atenção: reação — avisar o tutor</span><div class="m171__acoes"><button type="button" class="m171__btn m171__btn--prim" data-m171-acao="mensagem"' + attr + ' aria-expanded="' + (aberta ? 'true' : 'false') + '">Mensagem para o tutor</button><button type="button" class="m171__btn m171__btn--sec" data-m171-acao="avisado"' + attr + '>' + (busy ? 'Salvando…' : 'Tutor avisado') + '</button></div>';
        if (aberta) corpo += '<div class="m171__msg-cab"><span>Mensagem para o tutor</span><span class="m171__pilula">texto a aprovar</span></div><div class="m171__msg" id="' + mid + '">' + esc(msg) + '</div><div class="m171__acoes"><button type="button" class="m171__btn m171__btn--prim" data-m171-copiar="' + mid + '">Copiar mensagem</button>' + (link ? '<a class="m171__btn m171__btn--sec" href="' + esc(link + '?text=' + encodeURIComponent(msg)) + '" target="_blank" rel="noopener noreferrer">Abrir no WhatsApp</a>' : '<span class="m171__pend">Sem telefone no registro: use Copiar.</span>') + '</div>';
        return '<li class="m171__it is-alerta" data-m171-alerta="1"><span class="m171__caixa alerta" aria-hidden="true">✓</span><div class="m171__txt">' + corpo + erroHTML + '</div></li>';
      }
      if (e === 'avisado') corpo += '<span class="m171__rev">Tutor avisado por ' + esc(v.tutorAvisado.por) + ' às ' + esc(horaSP171(v.tutorAvisado.em)) + '</span>';
      return '<li class="m171__it is-feito"><span class="m171__caixa ok" aria-hidden="true">✓</span><div class="m171__txt">' + corpo + '</div></li>';
    }
    var rascunho = ui.cuidadosForm && ui.cuidadosForm[ch];
    if (e === 'revisado' && rascunho) return '<li class="m171__it is-aberto"><span class="m171__caixa" aria-hidden="true"></span><div class="m171__txt"><strong>' + rot + ': registrar o que foi feito</strong>' + qual + registroFormHTML171(item, k, rot, rascunho, ui) + '</div></li>';
    if (e === 'revisado') return '<li class="m171__it is-aberto"><span class="m171__caixa" aria-hidden="true"></span><div class="m171__txt"><strong>' + rot + '</strong><small>Vai fazer na Zêluz</small>' + qual + '<span class="m171__rev">Revisado por ' + esc(v.revisao.por) + ' às ' + esc(horaSP171(v.revisao.em)) + '</span><div class="m171__acoes"><button type="button" class="m171__btn m171__btn--gold" data-m171-acao="feito"' + attr + '>Feito</button></div>' + erroHTML + '</div></li>';
    return '<li class="m171__it is-aberto" data-m171-pend="1"><span class="m171__caixa" aria-hidden="true"></span><div class="m171__txt"><strong>' + rot + '</strong><small>Vai fazer na Zêluz</small>' + qual + '<span class="m171__pend">Revisar antes da avaliação</span><div class="m171__acoes"><button type="button" class="m171__btn m171__btn--prim" data-m171-acao="revisar"' + attr + '>' + (busy ? 'Salvando…' : 'Revisei') + '</button></div>' + erroHTML + '</div></li>';
  }
  function cuidadosHTML171(item, ui) {
    return '<ul class="m171__lista" aria-label="Cuidados de ' + esc(item.nome || 'FILHOt') + '">' + CUIDADOS171.map(function (c) { return cuidadoItemHTML171(item, c[0], c[1], ui || {}); }).join('') + '</ul>';
  }
  function faixaHTML171(bloco, dia) {
    if (!bloco || bloco.estado !== 'pronto' || !bloco.itens.length) return '';
    var n = contarCuidados171(bloco.itens), partes = [(dia === dataSP() ? 'Hoje: ' : 'Neste dia: ') + n.avaliacoes + (n.avaliacoes === 1 ? ' avaliação' : ' avaliações')];
    if (n.revisar) partes.push(n.revisar + (n.revisar === 1 ? ' cuidado para revisar antes' : ' cuidados para revisar antes'));
    if (n.alertas) partes.push(n.alertas + (n.alertas === 1 ? ' alerta de reação' : ' alertas de reação'));
    if (n.alertas) return '<p class="m171__faixa m171__faixa--falta" role="status">' + esc(partes.join(' · ')) + ' <a href="#" data-m171-ir="alerta">Ir ao alerta</a></p>';
    if (n.revisar) return '<p class="m171__faixa m171__faixa--atencao" role="status">' + esc(partes.join(' · ')) + ' <a href="#" data-m171-ir="pend">Ir ao primeiro em aberto</a></p>';
    return '<p class="m171__faixa m171__faixa--ok" role="status">' + esc(partes[0]) + ' · nada para revisar antes.</p>';
  }

  function entrevistasHTML(bloco) {
    var status=estadoHTML(bloco,'Nenhuma entrevista neste dia.');
    return '<details class="pm-card marcia129__entrevistas" data-marcia-secao="entrevistas"><summary><span>Entrevistas do dia ('+(bloco.estado==='pronto'?bloco.itens.length:'—')+')</span><span aria-hidden="true">⌄</span></summary>'+(status||'<div class="marcia129__avaliacoes">'+bloco.itens.slice().sort(function(a,b){return a.hora.localeCompare(b.hora)}).map(function(x){return '<article class="marcia129__avaliacao"><strong>'+esc(x.hora)+' · '+esc(x.nome)+'</strong><p>'+esc(x.vaga)+'</p>'+telefoneHTML(x).replace('Telefone do tutor não informado','Telefone não informado').replace('conversa com o tutor no WhatsApp','conversa no WhatsApp')+'</article>'}).join('')+'</div>')+'</details>';
  }

  function agendaHTML(bloco, dia, podeSalvar, pendentes, erros, ui) {
    var e = estadoHTML(bloco, 'Nenhuma avaliação neste dia.');
    if (e) return e;
    return '<div class="marcia129__avaliacoes">' + bloco.itens.map(function (x) {
      var obs = x.observacoes.length ? '<dl class="marcia129__obs">' + x.observacoes.map(function (o) { return '<div><dt>' + esc(o.rotulo || 'Observação') + '</dt><dd>' + esc(o.valor || 'A conferir') + '</dd></div>'; }).join('') + '</dl>' : '';
      var completa = conferenciaCompleta(x, dia);
      var form = '';
      if (podeSalvar) {
        var dados = '<details class="marcia129__editar"' + (!x.tutor ? ' open' : '') + '><summary><span>Corrigir dados da avaliação</span><span class="marcia129__chevron" aria-hidden="true">⌄</span></summary><div class="marcia129__editar-corpo"><label class="cad-lb" for="marcia129-tutor-' + esc(x.id) + '">Tutor *</label><input class="cad-in" id="marcia129-tutor-' + esc(x.id) + '" name="tutor" required value="' + esc(x.tutor) + '"><label class="cad-lb" for="marcia129-experiencia-' + esc(x.id) + '">Experiência anterior em creche</label><textarea class="cad-in" id="marcia129-experiencia-' + esc(x.id) + '" name="experiencia" rows="2">' + esc(x.conferencia.experiencia) + '</textarea><label class="cad-lb" for="marcia129-saude-' + esc(x.id) + '">Doença ou restrição informada</label><textarea class="cad-in" id="marcia129-saude-' + esc(x.id) + '" name="saude" rows="2">' + esc(x.conferencia.saude) + '</textarea><label class="cad-lb" for="marcia129-observacoes-' + esc(x.id) + '">Observações</label><textarea class="cad-in" id="marcia129-observacoes-' + esc(x.id) + '" name="observacoes" rows="2">' + esc(x.conferencia.observacoes) + '</textarea></div></details>';
        form = '<form class="marcia129__conferencia" data-marcia-form-avaliacao="' + esc(x.id) + '"><p class="marcia129__nota">Conferência da avaliação. A ficha original permanece preservada.</p>' + dados + '<input type="hidden" name="expectedRevision" value="' + esc(x.conferencia.revisao) + '"><button type="submit" class="marcia129__salvar" data-marcia-salvar-avaliacao="' + esc(x.id) + '"' + (pendentes && pendentes[x.id] ? ' disabled' : '') + '>' + (pendentes && pendentes[x.id] ? 'Salvando…' : 'Salvar conferência') + '</button>' + (erros && erros[x.id] ? '<p class="marcia129__erro" role="alert">' + esc(erros[x.id]) + '</p>' : '') + '</form>';
      }
      if (x.conferencia.quem && x.conferencia.quando) form = '<p class="marcia129__situacao marcia129__situacao--conferido" role="status">Conferência salva · ' + esc(x.conferencia.quem) + ' · ' + esc(x.conferencia.quando) + '</p>' + form;
      /* 30/out/2026: os três cuidados viram checklist (ver cuidadosHTML171); a avaliação com algo em aberto já vem aberta. */
      var prevLeitura = cuidadosHTML171(x, ui), conta171 = contarCuidados171([x]);
      return '<details class="marcia129__avaliacao" data-marcia-avaliacao="' + esc(x.id) + '"' + (conta171.revisar || conta171.alertas ? ' open' : '') + '><summary><span class="marcia129__hora">' + esc(x.hora || 'Horário a conferir') + '</span><span class="marcia129__avaliacao-resumo"><strong>' + esc(x.nome || 'FILHOt a conferir') + '</strong><small>' + esc(x.raca || 'Raça a conferir') + (x.idade ? ' · ' + esc(x.idade) : '') + ' · ' + esc(x.tutor || 'Tutor a conferir') + '</small>' + (!completa ? '<em>Dados a conferir</em>' : '') + (x.agendaMarcia ? '<em class="'+(x.pagamento.recebido?'marcia129__pago':'marcia129__aguarda-pagamento')+'">'+(x.pagamento.recebido?'Confirmada · R$ 80,00 recebidos':'Pendente de pagamento · R$ 80,00')+'</em>' : '') + '</span><span class="marcia129__chevron" aria-hidden="true">⌄</span></summary><div class="marcia129__avaliacao-corpo">' + telefoneHTML(x) + prevLeitura + obs + form + '</div></details>';
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
    var mm = ui.mesAvaliacoes && ui.mesAvaliacoes.mes === cal.mes ? ui.mesAvaliacoes : { estado: 'carregando', dias: {} };
    var dias = cal.dias.map(function (x) { if (!x) return '<button type="button" class="dcal-dia" disabled aria-hidden="true"></button>'; var tem = mm.dias[x.dia] === true; return '<button type="button" data-marcia-dia="' + x.dia + '" class="dcal-dia' + (x.selecionado ? ' sel' : x.passado ? ' passado' : '') + (x.hoje ? ' hoje' : '') + '" aria-label="' + esc(nomeData(x.dia) + (tem ? ' · tem avaliação' : '')) + '" aria-pressed="' + (x.selecionado ? 'true' : 'false') + '">' + x.numero + (tem ? '<span class="dcal-dot" aria-hidden="true"></span>' : '') + '</button>'; }).join('');
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
    return '<div class="marcia129" data-marcia-dia-atual="' + s.dia + '"><header class="marcia129__cabecalho"><div><p class="marcia129__sobretitulo">Márcia · Gestão</p><h2>' + esc(nomeData(s.dia)) + '</h2>' + atualizado + '</div><button type="button" class="marcia129__hoje" data-marcia-hoje>Hoje</button></header><section class="pm-card marcia129__agenda" aria-labelledby="marcia129-agenda"><div class="marcia129__titulo"><h2 class="pm-tit" id="marcia129-agenda">Agenda da Márcia</h2><span class="marcia129__badge">Avaliações do dia (' + agendaContagem + ')</span></div><div class="dcal marcia129__cal"><div class="dcal-top"><button type="button" class="dcal-nav" data-marcia-mes="-1" aria-label="mês anterior">‹</button><span class="dcal-mes">' + esc(mesNome) + (mm.estado === 'carregando' ? '<small class="dcal-mes-estado" role="status"> atualizando</small>' : mm.estado === 'falha' ? '<small class="dcal-mes-estado" role="status"> marcações indisponíveis</small>' : '') + '</span><button type="button" class="dcal-nav" data-marcia-mes="1" aria-label="próximo mês">›</button></div><div class="dcal-grade">' + semana + dias + '</div></div><div class="marcia129__agenda-lista">' + faixaHTML171(s.agenda, s.dia) + agendaHTML(s.agenda, s.dia, ui.podeSalvarAvaliacao, ui.avaliacoesPendentes, ui.avaliacoesErros, ui) + '</div></section>' + entrevistasHTML(s.entrevistas) + '<section class="pm-card marcia129__todo" aria-labelledby="marcia129-todo"><h2 class="pm-tit" id="marcia129-todo">O que fazer hoje</h2>' + tarefasHTML(s.tarefas, ui.pendentes, ui.erros) + '</section><section class="marcia129__quantidades" aria-labelledby="marcia129-quantidades"><h2 class="pm-tit" id="marcia129-quantidades">Visão do dia</h2>' + quantidadesHTML(s.quantidades) + '</section><section class="marcia129__detalhes" aria-label="Detalhes do dia">' + accordions + '</section></div>';
  }

  function montar(root, opcoes) {
    if (!root || typeof root.addEventListener !== 'function') throw new TypeError('raiz_invalida');
    opcoes = opcoes || {};
    if (typeof opcoes.carregar !== 'function' || typeof opcoes.salvarTarefa !== 'function') throw new TypeError('provider_invalido');
    var vivo = true, versao = 0, revisaoLive = 0, offMes = null, versaoMes = 0, cacheMes = {};
    var ui = { dia: dataValida(opcoes.dia) ? opcoes.dia : dataSP(), mes: '', mesAvaliacoes: null, pendentes: {}, erros: {}, podeSalvarAvaliacao: typeof opcoes.salvarAvaliacao === 'function', avaliacoesPendentes: {}, avaliacoesErros: {}, cuidadosPendentes: {}, cuidadosErros: {}, cuidadosForm: {}, mensagensAbertas: {} };
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
      var mudouMes = ui.mes !== dia.slice(0, 7); ui.dia = dia; ui.mes = dia.slice(0, 7); ui.erros = {}; ui.pendentes = {}; ui.avaliacoesPendentes = {}; ui.avaliacoesErros = {}; ui.cuidadosPendentes = {}; ui.cuidadosErros = {}; ui.cuidadosForm = {}; ui.mensagensAbertas = {};
      if (mudouMes) observarMesVisivel();
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
    function observarMesVisivel() {
      var mes = ui.mes, minha = ++versaoMes;
      if (offMes) { try { offMes(); } catch (e) {} offMes = null; }
      var antiga = cacheMes[mes] || { mes: mes, estado: 'carregando', dias: {} };
      ui.mesAvaliacoes = mesAvaliacoes({ mes: mes, estado: 'carregando', dias: {} }, mes, antiga);
      pintar();
      if (typeof opcoes.observarMes !== 'function') return;
      var off = opcoes.observarMes(mes, function (valor) {
        if (!vivo || minha !== versaoMes || ui.mes !== mes) return;
        var prox = mesAvaliacoes(valor, mes, cacheMes[mes] || antiga); cacheMes[mes] = prox; ui.mesAvaliacoes = prox; pintar();
      });
      if (typeof off === 'function') offMes = off;
    }

    function copiarTelefone(id, botao) {
      var item = atual.agenda.itens.concat(atual.entrevistas.itens).find(function (x) { return x.id === id; }), tel = telefoneBR(item && item.telefone), doc = root.ownerDocument;
      var box = botao && botao.parentNode; box = box && box.parentNode && box.classList && box.classList.contains('m171__tel-box') ? box.parentNode : box;
      if (!tel || !box) return;
      function feedback(mensagem, falhou) {
        var antigo = box.querySelector && box.querySelector('[data-marcia-telefone-status]');
        if (antigo && antigo.parentNode) antigo.parentNode.removeChild(antigo);
        if (!doc || typeof doc.createElement !== 'function') return;
        var aviso = doc.createElement(falhou ? 'label' : 'p');
        aviso.className = falhou ? 'marcia129__telefone-fallback' : 'marcia129__telefone-status';
        aviso.setAttribute('data-marcia-telefone-status', '');
        aviso.textContent = mensagem;
        if (falhou) { var input = doc.createElement('input'); input.className = 'cad-in'; input.type = 'tel'; input.readOnly = true; input.value = tel; aviso.appendChild(input); }
        box.appendChild(aviso);
      }
      /* 30/out/2026: deu certo, o ícone vira ✓ e aparece «Copiado» por 2 s (navigator.clipboard e, se falhar, o execCommand). */
      copiar171(tel, botao).then(function () {}, function () { feedback('Não foi possível copiar automaticamente. Selecione e copie o telefone.', true); });
    }

    /* ---- 30/out/2026: «Revisei», «Feito» (registro), «Tutor avisado» e a mensagem para o tutor ---- */
    function acharItem171(ch) { var p = String(ch || '').split('|'), id = p[0], k = p[1]; var item = atual.agenda.itens.find(function (x) { return x.id === id; }); return item && CUIDADOS171.some(function (c) { return c[0] === k; }) ? { id: id, k: k, item: item } : null; }
    function faltasRegistro171(r, k) { var f = []; if (!texto(r.oQue)) f.push('o que foi feito'); if (!texto(r.usado)) f.push('o que foi usado'); if (k === 'carrapaticida' && !texto(r.qtd)) f.push('quanto foi usado'); if (!lista(r.reacoes).length) f.push('como o peludinho ficou depois'); return f; }
    function salvarCuidado171(ch, acao) {
      var h = acharItem171(ch); if (!h || ui.cuidadosPendentes[ch] || typeof opcoes.salvarCuidado !== 'function') return;
      var pedido = { dia: ui.dia, id: h.id, cuidado: h.k, acao: acao };
      if (acao === 'feito') {
        var r = ui.cuidadosForm[ch] || {}, faltam = faltasRegistro171(r, h.k);
        if (faltam.length) { ui.cuidadosErros[ch] = 'Falta: ' + faltam.join('; ') + '.'; pintar(); return; }
        pedido.feito = { oQue: texto(r.oQue), usado: texto(r.usado), qtd: texto(r.qtd), reacoes: lista(r.reacoes).slice(), obs: comReacao171(r.reacoes) ? texto(r.obs) : '' };
      }
      ui.cuidadosPendentes[ch] = true; delete ui.cuidadosErros[ch]; pintar();
      var diaPedido = ui.dia, minha = versao;
      Promise.resolve().then(function () { return opcoes.salvarCuidado(pedido); }).then(function (ack) {
        if (!vivo || minha !== versao || diaPedido !== ui.dia) return;
        if (!ack || ack.ok !== true || texto(ack.id) !== h.id || !ack.agenda || typeof ack.agenda !== 'object') throw new Error('confirmacao_cuidado_invalida');
        var normal = normalizar({ dia: diaPedido, agenda: { estado: 'pronto', itens: [ack.agenda] } }, diaPedido).agenda.itens[0];
        var pos = atual.agenda.itens.findIndex(function (x) { return x.id === h.id; }); if (pos >= 0) atual.agenda.itens[pos] = normal;
        delete ui.cuidadosPendentes[ch]; if (acao === 'feito') delete ui.cuidadosForm[ch]; if (acao === 'avisado' || acao === 'tutor_avisado') delete ui.mensagensAbertas[ch];
        pintar();
      }).catch(function (e) {
        if (!vivo || minha !== versao || diaPedido !== ui.dia) return; delete ui.cuidadosPendentes[ch];
        var m = String(e && e.message || '');
        ui.cuidadosErros[ch] = /JA_|DESATUALIZADA/.test(m) ? 'Outra pessoa já registrou este cuidado. A tela foi atualizada; confira.' : m === 'REVISAR_ANTES' ? 'Toque em «Revisei» antes de registrar o que foi feito.' : 'Não foi possível salvar. Tente novamente; o que foi digitado continua aqui.';
        pintar();
      });
    }
    function copiar171(texto, botao) {
      var doc = root.ownerDocument, nav = doc && doc.defaultView && doc.defaultView.navigator;
      function antigo() { var ta = doc.createElement('textarea'); ta.value = texto; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;top:0'; doc.body.appendChild(ta); ta.select(); var ok = doc.execCommand('copy'); doc.body.removeChild(ta); if (!ok) throw new Error('copia_recusada'); }
      var p = typeof opcoes.copiarTexto === 'function' ? Promise.resolve().then(function () { return opcoes.copiarTexto(texto); })
        : (nav && nav.clipboard && typeof nav.clipboard.writeText === 'function' ? Promise.resolve().then(function () { return nav.clipboard.writeText(texto); }).catch(function () { antigo(); }) : Promise.resolve().then(antigo));
      return p.then(function () { if (!botao) return; if (botao.classList && botao.classList.contains('m171__btn-icone')) { var box = botao.parentNode; if (box && box.classList) { box.classList.add('copiado'); clearTimeout(box._m171); box._m171 = setTimeout(function () { box.classList.remove('copiado'); }, 2000); } return; } if (botao._m171orig === undefined) botao._m171orig = botao.textContent; botao.textContent = 'Copiado ✓'; clearTimeout(botao._m171); botao._m171 = setTimeout(function () { botao.textContent = botao._m171orig; botao._m171orig = undefined; }, 2000); });
    }
    function clique171(alvo, ev) {
      if (alvo.hasAttribute('data-m171-ir')) {
        if (ev && ev.preventDefault) ev.preventDefault();
        var el = root.querySelector(alvo.getAttribute('data-m171-ir') === 'alerta' ? '[data-m171-alerta="1"]' : '[data-m171-pend="1"]'); if (!el) return;
        var det = el.closest && el.closest('details'); if (det) det.open = true;
        el.setAttribute('tabindex', '-1'); if (el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); if (el.focus) el.focus({ preventScroll: true }); return;
      }
      if (alvo.hasAttribute('data-m171-copiar')) { var caixa = root.querySelector('#' + alvo.getAttribute('data-m171-copiar')); if (caixa) copiar171(caixa.textContent, alvo); return; }
      if (alvo.hasAttribute('data-m171-chip')) {
        var chc = alvo.getAttribute('data-m171-chip'), rr = ui.cuidadosForm[chc]; if (!rr) return;
        var f = alvo.getAttribute('data-f'), v = alvo.getAttribute('data-v');
        if (f === 'qtd') rr.qtd = rr.qtd === v ? '' : v;
        else { var i = rr.reacoes.indexOf(v); if (i >= 0) rr.reacoes.splice(i, 1); else if (v === 'bem') rr.reacoes = ['bem']; else { rr.reacoes = rr.reacoes.filter(function (z) { return z !== 'bem'; }); rr.reacoes.push(v); } }
        delete ui.cuidadosErros[chc]; pintar(); return;
      }
      var ch = alvo.getAttribute('data-m171'), acao = alvo.getAttribute('data-m171-acao');
      if (alvo.disabled || !acharItem171(ch)) return;
      if (acao === 'revisar') { salvarCuidado171(ch, 'revisar'); return; }
      if (acao === 'feito') { ui.cuidadosForm[ch] = { oQue: '', usado: '', qtd: '', reacoes: [], obs: '' }; delete ui.cuidadosErros[ch]; pintar(); var campo = root.querySelector('#m171-' + ch.split('|')[0] + '-' + ch.split('|')[1] + '-oque'); if (campo && campo.focus) campo.focus(); return; }
      if (acao === 'cancelar') { delete ui.cuidadosForm[ch]; delete ui.cuidadosErros[ch]; pintar(); return; }
      if (acao === 'salvar-feito') { salvarCuidado171(ch, 'feito'); return; }
      if (acao === 'mensagem') { ui.mensagensAbertas[ch] = !ui.mensagensAbertas[ch]; pintar(); return; }
      if (acao === 'avisado') { salvarCuidado171(ch, 'tutor_avisado'); }
    }
    function entrada171(ev) {
      var el = ev.target; if (!el || !el.getAttribute) return;
      var ch = el.getAttribute('data-m171-campo'), f = el.getAttribute('data-f'); if (!ch || !f || !ui.cuidadosForm[ch]) return;
      ui.cuidadosForm[ch][f] = String(el.value || ''); delete ui.cuidadosErros[ch];
    }

    function clique(ev) {
      var a171 = ev.target.closest && ev.target.closest('[data-m171-acao],[data-m171-chip],[data-m171-copiar],[data-m171-ir]');
      if (a171 && a171.hasAttribute && ['data-m171-acao', 'data-m171-chip', 'data-m171-copiar', 'data-m171-ir'].some(function (n) { return a171.hasAttribute(n); }) && root.contains(a171)) { clique171(a171, ev); return; }
      var alvo = ev.target.closest && ev.target.closest('[data-marcia-dia],[data-marcia-mes],[data-marcia-hoje],[data-marcia-tarefa],[data-marcia-copiar-telefone]');
      if (!alvo || !root.contains(alvo)) return;
      if (alvo.hasAttribute('data-marcia-copiar-telefone')) { copiarTelefone(alvo.getAttribute('data-marcia-copiar-telefone'), alvo); return; }
      if (alvo.hasAttribute('data-marcia-dia')) { carregar(alvo.getAttribute('data-marcia-dia')); return; }
      if (alvo.hasAttribute('data-marcia-hoje')) { carregar(dataSP()); return; }
      if (alvo.hasAttribute('data-marcia-mes')) {
        var p = ui.mes.split('-').map(Number), delta = Number(alvo.getAttribute('data-marcia-mes'));
        var d = new Date(Date.UTC(p[0], p[1] - 1 + delta, 1, 12)); ui.mes = d.toISOString().slice(0, 7); observarMesVisivel(); return;
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
      function prev(nome) { return Object.assign({},item[nome]||{conferido:false}); }
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
        var escolhasIguais = ['vacina','vermifugo','carrapaticida'].every(function(nome){return agendaAck[nome] && agendaAck[nome].conferido === pedido[nome].conferido && (!item[nome].plano || (agendaAck[nome].plano===item[nome].plano && agendaAck[nome].detalhe===item[nome].detalhe));});
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
    root.addEventListener('input', entrada171);
    carregar(ui.dia);
    return {
      destroy: function () { vivo = false; versao += 1; versaoMes += 1; if (offMes) try { offMes(); } catch (e) {} root.removeEventListener('click', clique); root.removeEventListener('submit', submeter); root.removeEventListener('input', entrada171); root.innerHTML = ''; },
      carregar: carregar,
      atualizar: function (snapshot) {
        if (!vivo || !snapshot || snapshot.dia !== ui.dia) return false;
        revisaoLive += 1; atual = normalizar(snapshot, ui.dia); pintar(); return true;
      },
      getDia: function () { return ui.dia; }
    };
  }

  return { montar: montar, normalizar: normalizar, desenhar: desenhar, calendario: calendario, mesAvaliacoes: mesAvaliacoes, dataSP: dataSP, validarConferencia: validarConferencia,
    contarCuidados171: contarCuidados171, estadoCuidado171: estadoCuidado171, mensagemReacao171: mensagemReacao171, cuidadosHTML171: cuidadosHTML171, faixaHTML171: faixaHTML171 };
});
