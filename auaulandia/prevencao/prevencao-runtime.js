/* Runtime somente-leitura. Portas devem ser criadas no escopo léxico do app legado. */
(function (root, factory) {
  var fontes = (typeof module === 'object' && module.exports) ? require('./prevencao-fontes') : root.ZeluzPrevencaoFontes;
  var api = factory(fontes);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ZeluzPrevencaoRuntime = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (fontes) {
  'use strict';
  if (!fontes || typeof fontes.projetar !== 'function') throw new Error('prevencao-fontes.js precisa ser carregado antes do runtime.');

  var portasInstaladas = null;
  var obrigatorias = ['hoje', 'lerHoje', 'getMapas', 'peludinhos', 'cadastroPronto', 'vencimentosProntos', 'pelKey', 'pelExtra', 'dcKey', 'vencItensDe', 'vencRegDeDia', 'vencRespostaDe', 'vencRespDef'];
  function chamada(portas, nome, args, padrao) {
    try { return typeof portas[nome] === 'function' ? portas[nome].apply(null, args || []) : padrao; }
    catch (e) { return padrao; }
  }
  function amanha(dia) {
    var p = String(dia || '').split('-').map(Number), d = new Date(Date.UTC(p[0], p[1] - 1, p[2] + 1));
    return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
  }
  function faltamPortas(portas) { return obrigatorias.filter(function (nome) { return typeof portas[nome] !== 'function'; }); }
  function snapshotCheckin(portas, dia) {
    var mapas = chamada(portas, 'getMapas', [], null), no = mapas && mapas['daycare/checkin-corpo/' + dia];
    return { pronto: !!(no && no.pronto === true), mapa: no && no.mapa && typeof no.mapa === 'object' ? no.mapa : {} };
  }
  function colisoes(portas, peludinhos) {
    var por = {};
    peludinhos.forEach(function (p) { var k = p && p.n ? chamada(portas, 'dcKey', [p.n, p.tutor], '') : ''; if (k) (por[k] = por[k] || []).push(p); });
    Object.keys(por).forEach(function (k) { if (por[k].length < 2) delete por[k]; });
    return por;
  }
  function cuidados(portas, p, dia) {
    var ex = chamada(portas, 'pelExtra', [p], null);
    if (!ex || typeof ex !== 'object') return null;
    var a = chamada(portas, 'vencItensDe', [ex, dia, 0, dia, { incluirSemRegistro: true }], null);
    var b = chamada(portas, 'vencItensDe', [ex, amanha(dia), 0, dia, { incluirSemRegistro: true }], null);
    if (!Array.isArray(a) || !Array.isArray(b)) return null;
    var vistos = {};
    return a.concat(b).filter(function (item) { var k = String((item || {}).k || '') + '|' + String((item || {}).vence || ''); if (vistos[k]) return false; vistos[k] = true; return true; });
  }
  function evidencia(portas, registro, item, assuntos) {
    for (var i = 0; i < assuntos.length; i++) {
      var r = chamada(portas, 'vencRespostaDe', [registro, assuntos[i]], null);
      if (r && r.v && String(r.v) !== 'sem') { chamada(portas, 'vencRespDef', [r.v], null); return { tipo: 'resposta', assunto: assuntos[i], valor: String(r.v), dado: r }; }
    }
    return fontes.evidenciaDoRegistro(registro, assuntos);
  }
  function lerCom(portas, agora) {
    portas = portas || {};
    var dia = typeof agora === 'string' ? agora : chamada(portas, 'hoje', [], '');
    var faltam = faltamPortas(portas);
    if (faltam.length) return fontes.projetar({ dia: dia, fontesProntas: false, limitacoes: ['Portas ausentes: ' + faltam.join(', ') + '.'] });
    var pessoas = chamada(portas, 'peludinhos', [], null);
    var pronto = chamada(portas, 'cadastroPronto', [], false) === true && chamada(portas, 'vencimentosProntos', [dia], false) === true && Array.isArray(pessoas);
    if (!pronto) return fontes.projetar({ dia: dia, fontesProntas: false, limitacoes: ['Cadastro, prevenção ou cache de respostas ainda não está pronto.'] });
    var lista = chamada(portas, 'lerHoje', [], []), incompleta = false;
    var linhas = (Array.isArray(lista) ? lista : []).map(function (o) {
      var p = o && o.p, chave = String((o && o.chave) || ''), itens = p ? cuidados(portas, p, dia) : null;
      if (!p || !chave || itens === null) incompleta = true;
      return { chave: chave, nome: o && o.nome, tutor: o && o.tutor, pelKey: p ? chamada(portas, 'pelKey', [p], '') : '', cuidados: itens || [], registro: chamada(portas, 'vencRegDeDia', [dia, chave], {}) };
    });
    if (incompleta) return fontes.projetar({ dia: dia, fontesProntas: false, limitacoes: ['Uma ficha ou prevenção ainda não está carregada; a fila não foi parcialmente inferida.'] });
    var snap = snapshotCheckin(portas, dia);
    return fontes.projetar({
      dia: dia, fontesProntas: true, checkinMapa: snap.mapa, checkinPronto: snap.pronto, linhas: linhas, colisoes: colisoes(portas, pessoas),
      assuntoDe: function (item) { return chamada(portas, 'vencTipoDoItemObj', [item], fontes.tipoCuidado(item)); },
      evidenciaDe: function (registro, item, assuntos) { return evidencia(portas, registro, item, assuntos); },
      ehDiaVet: function (data) { return chamada(portas, 'vencEhDiaVet', [data], null); }
    });
  }
  function criar(portas) { return { ler: function (agora) { return lerCom(portas, agora); } }; }
  return {
    criar: criar,
    instalar: function (portas) { portasInstaladas = portas || null; return this; },
    ler: function (agora) { return lerCom(portasInstaladas, agora); },
    portasConfiguradas: function () { return !!portasInstaladas; }
  };
}));
