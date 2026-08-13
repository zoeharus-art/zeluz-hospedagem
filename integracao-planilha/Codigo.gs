/**
 * ZÊLUZ · AuAulândia — ponte entre o app e a planilha de Hospedagem
 *
 * Versão 4 (13/ago/2026) — as duas abas são COISAS DIFERENTES.
 *
 * O QUE EU TINHA ENTENDIDO ERRADO
 * Achei que as duas abas fossem tabelas iguais e mandei uma linha nova para as
 * duas. A aba "Hospedagem" é mesmo uma tabela (uma linha por hospedagem). Mas a
 * "Calendário Hospedagem para dash" é um CALENDÁRIO: uma linha por DIA, e as
 * colunas são "Hospede 1", "Hospede 2"... até 40. Cada célula guarda o nome de
 * quem estava aqui naquele dia.
 *
 * Ao dar appendRow nela, criei uma linha solta no fim com data 31/12/1899 — e o
 * Looker Studio quebrou. Agora cada aba é tratada do jeito dela:
 *
 *   · Hospedagem  → uma linha nova, com cada valor na coluna certa PELO NOME.
 *   · Calendário  → o nome do FILHOt entra em CADA DIA da estadia, na primeira
 *                   coluna livre daquele dia. É isso que faz o dashboard contar
 *                   quantos hóspedes há por noite (e quantas plantonistas).
 *
 * Nunca cria linha nova no calendário: se o dia não existir, avisa.
 */

var TOKEN = 'zeluz-auaulandia';
var ABA_FINANCEIRO = 'Hospedagem';
var ABA_DASHBOARD  = 'Calendário Hospedagem para dash';

/**
 * As NOITES é que contam no calendário: quem entra dia 10 e sai dia 14 dorme aqui
 * nas noites de 10, 11, 12 e 13 — no dia 14 ele vai embora. É essa conta que diz
 * quantas plantonistas são necessárias.
 * Se a casa preencher também o dia da saída, mude para true.
 */
var CONTAR_DIA_DA_SAIDA = false;

var COLUNAS = [
  { campo: 'hospedes',    tipo: 'num',  nomes: ['hospedes', 's', 'qtd', 'quantidade'] },
  { campo: 'peludoTutor', tipo: 'txt',  nomes: ['tutor peludo', 'peludo tutor', 'peludo/tutor'] },
  { campo: 'entrada',     tipo: 'data', nomes: ['entrada'] },
  { campo: 'saida',       tipo: 'data', nomes: ['saida'] },
  { campo: 'noites',      tipo: 'num',  nomes: ['diarias', 'diaria'] },
  { campo: 'reserva',     tipo: 'num',  nomes: ['r$ reserva', 'reserva'] },
  { campo: 'dataReserva', tipo: 'data', nomes: ['data reserva'] },
  { campo: 'total',       tipo: 'num',  nomes: ['valor total', 'r$ total', 'total'] },
  { campo: 'valorDiaria', tipo: 'num',  nomes: ['valor diaria'] },
  { campo: 'aPagar',      tipo: 'num',  nomes: ['a pagar'] },
  { campo: 'dataAPagar',  tipo: 'data', nomes: ['data a pagar'] }
];

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    if (String(d.token || '') !== TOKEN) {
      return _resposta({ ok: false, erro: 'token invalido' });
    }
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var r = { ok: true, financeiro: '', calendario: '' };
    try { r.financeiro = _gravarTabela(ss, d); } catch (e1) { r.financeiro = 'ERRO - ' + String(e1); }
    try { r.calendario = _gravarCalendario(ss, d); } catch (e2) { r.calendario = 'ERRO - ' + String(e2); }
    return _resposta(r);
  } catch (err) {
    return _resposta({ ok: false, erro: String(err) });
  }
}

/** Abra a URL /exec no navegador: mostra como o script está enxergando cada aba. */
function doGet() {
  var out = { ok: true, msg: 'ponte da AuAulandia no ar' };
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var f = _acharAba(ss, ABA_FINANCEIRO);
    out.aba_financeiro = f ? { nome: f.getName(), colunas: _cabecalho(f).titulos } : 'NAO ENCONTRADA';
    var c = _acharAba(ss, ABA_DASHBOARD);
    if (!c) out.aba_calendario = 'NAO ENCONTRADA';
    else {
      var cal = _lerCalendario(c);
      out.aba_calendario = {
        nome: c.getName(),
        linha_do_cabecalho: cal.linhaCab,
        primeira_coluna_de_hospede: cal.col1,
        quantas_colunas_de_hospede: cal.nCols,
        primeiro_dia: cal.datas.length ? Utilities.formatDate(cal.datas[0].data, 'GMT-3', 'dd/MM/yyyy') : '-',
        ultimo_dia: cal.datas.length ? Utilities.formatDate(cal.datas[cal.datas.length - 1].data, 'GMT-3', 'dd/MM/yyyy') : '-',
        total_de_dias: cal.datas.length
      };
    }
    out.todas_as_abas = ss.getSheets().map(function (s) { return s.getName(); });
  } catch (e) { out.erro = String(e); }
  return _resposta(out);
}

/* ============================ ABA FINANCEIRA ============================ */

function _gravarTabela(ss, d) {
  var aba = _acharAba(ss, ABA_FINANCEIRO);
  if (!aba) return 'ABA NAO ENCONTRADA';
  var cab = _cabecalho(aba);
  if (!cab.linha) return 'NAO ACHEI O CABECALHO';
  if (_jaTem(aba, cab, d)) return 'ja estava la';
  var linha = _montarPorNome(cab, d);
  aba.appendRow(linha.valores);
  _ajustarFormatos(aba, aba.getLastRow(), linha.formatos);
  return 'ok (' + linha.usadas + ' campos)';
}

function _cabecalho(aba) {
  var ate = Math.min(8, aba.getLastRow() || 1);
  var largura = Math.max(aba.getLastColumn(), 12);
  var vals = aba.getRange(1, 1, ate, largura).getValues();
  for (var i = 0; i < vals.length; i++) {
    var ch = vals[i].map(function (x) { return _chave(x); });
    if (ch.indexOf('entrada') >= 0 && ch.indexOf('saida') >= 0) {
      return { linha: i + 1, titulos: vals[i].map(function (x) { return String(x || ''); }), chaves: ch };
    }
  }
  return { linha: 0, titulos: [], chaves: [] };
}

function _montarPorNome(cab, d) {
  var valores = [], formatos = [], usadas = 0;
  for (var c = 0; c < cab.chaves.length; c++) { valores.push(''); formatos.push(null); }
  COLUNAS.forEach(function (def) {
    var idx = -1;
    for (var n = 0; n < def.nomes.length && idx < 0; n++) idx = cab.chaves.indexOf(def.nomes[n]);
    if (idx < 0) return;
    var v = d[def.campo];
    if (v === undefined || v === null || v === '') return;
    if (def.tipo === 'data') { valores[idx] = _data(v); formatos[idx] = 'dd/MM/yyyy'; }
    else if (def.tipo === 'num') { valores[idx] = _num(v); formatos[idx] = '0.##'; }
    else { valores[idx] = String(v); formatos[idx] = '@'; }
    usadas++;
  });
  return { valores: valores, formatos: formatos, usadas: usadas };
}

function _ajustarFormatos(aba, linha, formatos) {
  for (var i = 0; i < formatos.length; i++) {
    if (!formatos[i]) continue;
    try { aba.getRange(linha, i + 1).setNumberFormat(formatos[i]); } catch (e) {}
  }
}

function _jaTem(aba, cab, d) {
  var iNome = cab.chaves.indexOf('tutor peludo');
  if (iNome < 0) iNome = cab.chaves.indexOf('peludo tutor');
  var iEnt = cab.chaves.indexOf('entrada');
  if (iNome < 0 || iEnt < 0) return false;
  var ultima = aba.getLastRow();
  if (ultima <= cab.linha) return false;
  var vals = aba.getRange(cab.linha + 1, 1, ultima - cab.linha, cab.chaves.length).getValues();
  var alvo = String(d.peludoTutor || '').trim().toLowerCase();
  var dt0 = _data(d.entrada);
  var alvoDt = (dt0 instanceof Date) ? dt0.toDateString() : '';
  for (var i = 0; i < vals.length; i++) {
    var nome = String(vals[i][iNome] || '').trim().toLowerCase();
    var dt = vals[i][iEnt];
    var dtStr = (dt instanceof Date) ? dt.toDateString() : '';
    if (nome && nome === alvo && dtStr === alvoDt) return true;
  }
  return false;
}

/* ============================== CALENDÁRIO ============================== */

/** Descobre onde ficam o cabeçalho, as colunas de hóspede e as datas. */
function _lerCalendario(aba) {
  var largura = Math.max(aba.getLastColumn(), 41);
  var alturaCab = Math.min(6, aba.getLastRow() || 1);
  var topo = aba.getRange(1, 1, alturaCab, largura).getValues();

  var linhaCab = 0, col1 = 0, nCols = 0;
  for (var i = 0; i < topo.length && !linhaCab; i++) {
    for (var j = 0; j < topo[i].length; j++) {
      if (_chave(topo[i][j]).indexOf('hospede 1') === 0) {
        linhaCab = i + 1; col1 = j + 1;
        for (var k = j; k < topo[i].length && String(topo[i][k] || '').trim() !== ''; k++) nCols++;
        break;
      }
    }
  }
  var datas = [];
  if (linhaCab) {
    var ultima = aba.getLastRow();
    if (ultima > linhaCab) {
      var colA = aba.getRange(linhaCab + 1, 1, ultima - linhaCab, 1).getValues();
      for (var r = 0; r < colA.length; r++) {
        if (colA[r][0] instanceof Date) datas.push({ linha: linhaCab + 1 + r, data: colA[r][0] });
      }
    }
  }
  return { linhaCab: linhaCab, col1: col1, nCols: nCols, datas: datas };
}

function _gravarCalendario(ss, d) {
  var aba = _acharAba(ss, ABA_DASHBOARD);
  if (!aba) return 'ABA NAO ENCONTRADA';
  var cal = _lerCalendario(aba);
  if (!cal.linhaCab) return 'NAO ACHEI a linha "Hospede 1"';
  if (!cal.datas.length) return 'NAO ACHEI as datas na coluna A';

  var ini = _data(d.entrada), fim = _data(d.saida);
  if (!(ini instanceof Date) || !(fim instanceof Date)) return 'datas invalidas';

  var nome = String(d.peludoTutor || '').trim();
  if (!nome) return 'sem nome do FILHOt';

  // Índice das datas por dia, para achar a linha sem varrer tudo a cada vez.
  var porDia = {};
  cal.datas.forEach(function (x) { porDia[_diaChave(x.data)] = x.linha; });

  var escritos = 0, jaEstavam = 0, semLinha = [], semVaga = [];
  var dia = new Date(ini.getTime());
  var guarda = 0;
  while (guarda < 400) {
    guarda++;
    var passou = CONTAR_DIA_DA_SAIDA ? (dia.getTime() > fim.getTime()) : (dia.getTime() >= fim.getTime());
    if (passou) break;

    var linha = porDia[_diaChave(dia)];
    if (!linha) { semLinha.push(Utilities.formatDate(dia, 'GMT-3', 'dd/MM')); }
    else {
      var faixa = aba.getRange(linha, cal.col1, 1, cal.nCols);
      var vals = faixa.getValues()[0];
      var jaTem = false, vaga = -1;
      for (var c = 0; c < vals.length; c++) {
        var atual = String(vals[c] || '').trim();
        if (atual === '') { if (vaga < 0) vaga = c; }
        else if (atual.toLowerCase() === nome.toLowerCase()) { jaTem = true; break; }
      }
      if (jaTem) jaEstavam++;
      else if (vaga < 0) semVaga.push(Utilities.formatDate(dia, 'GMT-3', 'dd/MM'));
      else { aba.getRange(linha, cal.col1 + vaga).setValue(nome); escritos++; }
    }
    dia = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate() + 1);
  }

  var msg = escritos + ' noite(s) marcada(s)';
  if (jaEstavam) msg += ', ' + jaEstavam + ' ja estavam';
  if (semLinha.length) msg += '. SEM LINHA NO CALENDARIO: ' + semLinha.join(', ');
  if (semVaga.length) msg += '. CALENDARIO CHEIO em: ' + semVaga.join(', ');
  return msg;
}

function _diaChave(dt) {
  return dt.getFullYear() + '-' + (dt.getMonth() + 1) + '-' + dt.getDate();
}

/* ================================ APOIO ================================ */

function _acharAba(ss, nome) {
  var direta = ss.getSheetByName(nome);
  if (direta) return direta;
  var alvo = _chave(nome), achada = null;
  ss.getSheets().forEach(function (s) { if (!achada && _chave(s.getName()) === alvo) achada = s; });
  return achada;
}

function _chave(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(new RegExp('[' + String.fromCharCode(0x300) + '-' + String.fromCharCode(0x36f) + ']', 'g'), '')
    .replace(/\s+/g, ' ').trim().toLowerCase();
}

function _data(iso) {
  if (!iso) return '';
  var p = String(iso).split('-');
  if (p.length !== 3) return '';
  return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
}

function _num(v) {
  var n = Number(v);
  return isNaN(n) ? '' : n;
}

/**
 * LIMPEZA — tira as linhas e as marcações de teste das duas abas.
 * Escolha "limparTestes" na lista de funções, no topo do editor, e clique em Executar.
 */
function limparTestes() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), total = 0;

  var f = _acharAba(ss, ABA_FINANCEIRO);
  if (f) {
    var ultima = f.getLastRow();
    if (ultima > 1) {
      var largura = Math.max(f.getLastColumn(), 4);
      var vals = f.getRange(1, 1, ultima, largura).getValues();
      for (var i = vals.length - 1; i >= 0; i--) {
        if (vals[i].join(' ').toUpperCase().indexOf('TESTE APAGAR') >= 0) { f.deleteRow(i + 1); total++; }
      }
    }
  }

  var c = _acharAba(ss, ABA_DASHBOARD);
  if (c) {
    var cal = _lerCalendario(c);
    if (cal.linhaCab && cal.datas.length) {
      var prim = cal.datas[0].linha, ult = cal.datas[cal.datas.length - 1].linha;
      var faixa = c.getRange(prim, cal.col1, ult - prim + 1, cal.nCols);
      var m = faixa.getValues(), mexeu = false;
      for (var r = 0; r < m.length; r++) {
        for (var k = 0; k < m[r].length; k++) {
          if (String(m[r][k] || '').toUpperCase().indexOf('TESTE APAGAR') >= 0) { m[r][k] = ''; total++; mexeu = true; }
        }
      }
      if (mexeu) faixa.setValues(m);
    }
    // Linhas soltas sem data (o estrago da versao antiga) — some com elas.
    var u2 = c.getLastRow();
    if (cal.linhaCab && u2 > cal.linhaCab) {
      var colA = c.getRange(cal.linhaCab + 1, 1, u2 - cal.linhaCab, 1).getValues();
      for (var q = colA.length - 1; q >= 0; q--) {
        var v = colA[q][0];
        if (v instanceof Date && v.getFullYear() < 2000) { c.deleteRow(cal.linhaCab + 1 + q); total++; }
      }
    }
  }

  Logger.log('Itens de teste apagados: ' + total);
  return total;
}

function _resposta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
