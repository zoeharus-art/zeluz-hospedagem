/*
 * Projeção somente-leitura da prevenção para o painel.
 * Browser: ZeluzPrevencaoFontes. Node/CommonJS: module.exports.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ZeluzPrevencaoFontes = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function isoValida(v) {
    var s = String(v || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    var p = s.split('-').map(Number), d = new Date(Date.UTC(p[0], p[1] - 1, p[2]));
    return d.getUTCFullYear() === p[0] && d.getUTCMonth() === p[1] - 1 && d.getUTCDate() === p[2];
  }
  function proprio(o, k) { return Object.prototype.hasOwnProperty.call(o || {}, k); }
  function cloneSeguro(o) { return o && typeof o === 'object' ? o : {}; }

  function tipoCuidado(item) {
    var k = String((item || {}).k || '');
    if (/^vac_/.test(k)) return 'vacina';
    if (/^verm/.test(k)) return 'vermifugo';
    if (k === 'ecto_p' || k === 'col_p') return 'ecto';
    return '';
  }

  function amanhaDe(dia) {
    var p = String(dia || '').split('-').map(Number), d = new Date(Date.UTC(p[0], p[1] - 1, p[2] + 1));
    return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
  }
  function situacaoData(data, dia) {
    if (!isoValida(data)) return 'sem-data';
    if (data < dia) return 'vencido';
    if (data === dia) return 'vence-hoje';
    if (data === amanhaDe(dia)) return 'vence-amanha';
    return 'fora-da-fila';
  }

  function entradaCorporalPronta(mapa, pronto, chave) {
    if (!pronto || !proprio(mapa, chave)) return false;
    var registro = mapa[chave];
    if (!registro || typeof registro !== 'object') return false;
    if (registro.tipo && registro.tipo !== 'entrada') return false;
    return Number.isFinite(Number(registro.fim)) && Number(registro.fim) > 0;
  }

  function entradaConfirmada(mapa, pronto, chave, nome, tutor) {
    if (!entradaCorporalPronta(mapa, pronto, chave)) return false;
    var registro = mapa[chave];
    return String(registro.nome || '') === String(nome || '') && String(registro.tutor || '') === String(tutor || '');
  }

  function assuntosDo(item, assunto) {
    var base = String(assunto || '');
    return base ? [base, 'ant_' + base] : [];
  }

  function evidenciaDoRegistro(registro, assuntos) {
    registro = cloneSeguro(registro);
    var i, assunto, v, resposta;
    for (i = 0; i < assuntos.length; i++) {
      assunto = assuntos[i];
      resposta = cloneSeguro(cloneSeguro(registro.respostas)[assunto]);
      v = String(resposta.v || '');
      if (v && v !== 'sem') return { tipo: 'resposta', assunto: assunto, valor: v, dado: resposta };
    }
    for (i = 0; i < assuntos.length; i++) {
      assunto = assuntos[i];
      resposta = cloneSeguro(cloneSeguro(registro.enviadas)[assunto]);
      if (resposta && Object.keys(resposta).length) return { tipo: 'contato', assunto: assunto, dado: resposta };
    }
    for (i = 0; i < assuntos.length; i++) {
      assunto = assuntos[i];
      var tentativas = cloneSeguro(registro.tentativas)[assunto];
      if (Array.isArray(tentativas) && tentativas.length) {
        return { tipo: 'tentativa', assunto: assunto, dado: cloneSeguro(tentativas[tentativas.length - 1]) };
      }
    }
    return null;
  }

  function respostaAutoriza(v) {
    return {
      hoje_bolsa: 1, hoje_loja: 1, vet_hoje_manha: 1, vet_hoje_tarde: 1,
      vet_manha: 1, vet_tarde: 1, vet_dia: 1, ab_bolsa: 1, ab_loja: 1,
      bolsa: 1, loja: 1
    }[String(v || '')] === 1;
  }

  function autoriaHumana(dado) {
    var quem = String((dado || {}).quem || '').trim(), ts = Number((dado || {}).ts);
    return !!quem && quem !== '-' && Number.isFinite(ts) && ts > 0;
  }

  function estadoDe(item, evidencia) {
    if (!isoValida(item.vence)) {
      return { estado: 'cuidado-a-verificar', proximaAcao: 'Conferir a data atual na ficha.' };
    }
    if (!evidencia) return { estado: 'cuidado-a-verificar', proximaAcao: 'Conferir o cuidado e registrar o fato na ficha atual.' };
    if (!autoriaHumana(evidencia.dado)) return { estado: 'aguardando-conferencia', proximaAcao: 'Conferir o registro: falta autoria humana identificada ou data válida.' };
    if (evidencia.tipo === 'tentativa') {
      return { estado: 'aguardando-conferencia', proximaAcao: 'Conferir retorno humano às 13h30: há tentativa sem resposta, sem envio confirmado.' };
    }
    if (evidencia.tipo === 'contato') {
      return { estado: 'contato-confirmado', proximaAcao: 'Aguardar retorno humano às 13h30; a pessoa responsável registra a resposta.' };
    }
    if (respostaAutoriza(evidencia.valor)) {
      return { estado: 'autorizacao-registrada', proximaAcao: 'Autorização registrada por humano; conferir a execução e atualizar a ficha pela fonte atual.' };
    }
    return { estado: 'resposta-registrada', proximaAcao: 'Resposta registrada por humano; conferir o encaminhamento e atualizar a ficha quando houver fato novo.' };
  }

  function referencia(dia, chave, item, pel) {
    return {
      id: 'prevencao:' + dia + ':' + chave + ':' + String(item.k || '') + ':' + String(item.vence || 'sem-data'),
      dcKey: chave,
      pelKey: pel || '',
      checkin: 'daycare/checkin-corpo/' + dia + '/' + chave,
      vencimento: 'daycare/vencimentos/' + dia + '/' + chave,
      ficha: pel ? 'daycare/cadastro/' + pel : ''
    };
  }

  function projetar(entrada) {
    entrada = entrada || {};
    var dia = String(entrada.dia || '');
    var mapa = cloneSeguro(entrada.checkinMapa);
    var pronto = entrada.checkinPronto === true;
    var pendencias = [], conferencias = [], limitacoes = [];
    var linhas = Array.isArray(entrada.linhas) ? entrada.linhas : [];
    var colisoes = cloneSeguro(entrada.colisoes);
    var assuntos = typeof entrada.assuntoDe === 'function' ? entrada.assuntoDe : function (it) { return tipoCuidado(it); };
    var ehDiaVet = typeof entrada.ehDiaVet === 'function' ? entrada.ehDiaVet : null;

    if (!isoValida(dia)) {
      return { dia: dia, estado: 'indisponivel', pendencias: [], conferencias: [], limitacoes: ['Data de hoje indisponível na página.'] };
    }
    if (entrada.fontesProntas !== true) return { dia: dia, estado: 'carregando', pendencias: [], conferencias: [], limitacoes: (entrada.limitacoes || []).concat(['As fontes de cadastro, prevenção ou respostas ainda não estão prontas; nada foi inferido.']) };
    if (!pronto) limitacoes.push('O mapa do check-in corporal de hoje ainda não está pronto; nenhuma presença foi qualificada.');

    linhas.forEach(function (linha) {
      linha = linha || {};
      var chave = String(linha.chave || '');
      if (!chave) return;
      if (!entradaConfirmada(mapa, pronto, chave, linha.nome, linha.tutor)) {
        if (entradaCorporalPronta(mapa, pronto, chave)) {
          conferencias.push({
            tipo: 'identidade-divergente', nome: String(linha.nome || ''), tutor: String(linha.tutor || ''),
            referencia: referencia(dia, chave, {}, String(linha.pelKey || '')),
            motivo: 'O check-in corporal pronto desta chave tem nome ou tutor diferente da ficha carregada; conferir a identidade humana antes de qualquer contato.'
          });
        }
        return;
      }
      var pel = String(linha.pelKey || '');
      if (colisoes[chave]) {
        conferencias.push({
          tipo: 'colisao-de-identidade', nome: String(linha.nome || ''), tutor: String(linha.tutor || ''),
          referencia: referencia(dia, chave, {}, pel),
          motivo: 'Mais de uma ficha carregada coincide nesta referência de presença; conferir a ficha humana antes de qualquer contato.'
        });
        return;
      }
      var registro = cloneSeguro(linha.registro);
      var cuidados = Array.isArray(linha.cuidados) ? linha.cuidados : [];
      cuidados.forEach(function (item) {
        item = item || {};
        var tipo = tipoCuidado(item);
        if (!tipo) return;
        var vencimento = String(item.vence || '');
        var situacao = situacaoData(vencimento, dia);
        if (situacao !== 'vencido' && situacao !== 'vence-hoje' && situacao !== 'vence-amanha' && situacao !== 'sem-data') return;
        var assunto = assuntos(item);
        var evidencia = typeof entrada.evidenciaDe === 'function'
          ? entrada.evidenciaDe(registro, item, assuntosDo(item, assunto))
          : evidenciaDoRegistro(registro, assuntosDo(item, assunto));
        var est = estadoDe(item, evidencia);
        if (tipo === 'vacina' && ehDiaVet && ehDiaVet(dia) === false) {
          est.proximaAcao = 'Organizar outro dia: a veterinária não atende nesta quinta-feira.';
        }
        pendencias.push({
          id: referencia(dia, chave, item, pel).id,
          referencia: referencia(dia, chave, item, pel),
          nome: String(linha.nome || ''), tutor: String(linha.tutor || ''),
          cuidado: String(item.nome || item.k || ''), tipo: tipo, assunto: assunto,
          vencimento: isoValida(vencimento) ? vencimento : null,
          situacao: situacao,
          estado: est.estado,
          autor: evidencia && autoriaHumana(evidencia.dado) ? String(evidencia.dado.quem) : null,
          evidencia: evidencia && evidencia.dado ? { tipo: evidencia.tipo, assunto: evidencia.assunto || assunto, valor: evidencia.valor || null, autor: autoriaHumana(evidencia.dado) ? String(evidencia.dado.quem) : null, em: autoriaHumana(evidencia.dado) ? Number(evidencia.dado.ts) : null, verificavel: autoriaHumana(evidencia.dado) } : null,
          proximaAcao: est.proximaAcao,
          origem: {
            checkin: 'daycare/checkin-corpo/' + dia + '/' + chave,
            ficha: pel ? 'daycare/cadastro/' + pel : '',
            vencimentos: 'daycare/vencimentos/' + dia + '/' + chave
          }
        });
      });
    });
    if (!linhas.length) limitacoes.push('A lista de hoje ainda não trouxe pessoas para projetar.');
    return { dia: dia, estado: pronto ? 'pronto' : 'carregando', pendencias: pendencias, conferencias: conferencias, limitacoes: limitacoes };
  }

  return { projetar: projetar, tipoCuidado: tipoCuidado, entradaConfirmada: entradaConfirmada, evidenciaDoRegistro: evidenciaDoRegistro };
}));
