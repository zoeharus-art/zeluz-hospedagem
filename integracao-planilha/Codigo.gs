/**
 * ZÊLUZ · AuAulândia — ponte entre o app e a planilha de Hospedagem
 *
 * Versão 3 (13/ago/2026) — escreve pelo NOME da coluna, não pela posição.
 *
 * POR QUE MUDOU (o erro que quebrou o dashboard):
 * A versão 2 montava a linha na ordem A,B,C,D... assumindo que as duas abas eram
 * iguais. NÃO SÃO. Na aba "Hospedagem" a coluna A é um número; na aba do
 * dashboard a coluna A está formatada como DATA. Ao gravar o número 1 ali, o
 * Google entendeu "dia 1" e escreveu 31/12/1899 — e o Looker Studio quebrou.
 *
 * Agora o script LÊ O CABEÇALHO de cada aba e põe cada valor na coluna certa,
 * pelo nome. Se a aba não tiver aquela coluna, o valor simplesmente não é
 * escrito. Mudar a ordem das colunas na planilha deixa de quebrar a ponte.
 */

var TOKEN = 'zeluz-auaulandia';
var ABA_FINANCEIRO = 'Hospedagem';
var ABA_DASHBOARD  = 'Calendário Hospedagem para dash';

/**
 * De/para: cada campo que o app manda e os nomes de coluna que ele aceita.
 * Vários nomes por campo porque as abas escrevem diferente ("Valor Total" x "R$ Total").
 */
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
    var escritas = [];

    [ABA_FINANCEIRO, ABA_DASHBOARD].forEach(function (nome) {
      try {
        var aba = _acharAba(ss, nome);
        if (!aba) { escritas.push(nome + ': ABA NAO ENCONTRADA'); return; }

        var cab = _cabecalho(aba);
        if (!cab.linha) { escritas.push(aba.getName() + ': NAO ACHEI O CABECALHO'); return; }

        if (_jaTem(aba, cab, d)) { escritas.push(aba.getName() + ': ja estava la'); return; }

        var linha = _montarPorNome(cab, d);
        aba.appendRow(linha.valores);
        // Corrige o formato SO das celulas que este script escreveu — uma coluna
        // formatada como data recebendo numero vira 31/12/1899 e derruba o dashboard.
        _ajustarFormatos(aba, aba.getLastRow(), linha.formatos);

        escritas.push(aba.getName() + ': ok (' + linha.usadas + ' campos)');
      } catch (err2) {
        escritas.push(nome + ': ERRO - ' + String(err2));
      }
    });

    return _resposta({ ok: true, abas: escritas });
  } catch (err) {
    return _resposta({ ok: false, erro: String(err) });
  }
}

/** Abra a URL /exec no navegador: mostra as abas e os cabecalhos que o script enxerga. */
function doGet() {
  var out = { ok: true, msg: 'ponte da AuAulandia no ar', abas: {} };
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    [ABA_FINANCEIRO, ABA_DASHBOARD].forEach(function (nome) {
      var aba = _acharAba(ss, nome);
      if (!aba) { out.abas[nome] = 'NAO ENCONTRADA'; return; }
      var cab = _cabecalho(aba);
      out.abas[aba.getName()] = { linha_do_cabecalho: cab.linha, colunas: cab.titulos };
    });
    out.todas_as_abas = ss.getSheets().map(function (s) { return s.getName(); });
  } catch (e) { out.erro = String(e); }
  return _resposta(out);
}

/** Acha a aba tolerando acento, espaco a mais e maiuscula/minuscula. */
function _acharAba(ss, nome) {
  var direta = ss.getSheetByName(nome);
  if (direta) return direta;
  var alvo = _chave(nome);
  var achada = null;
  ss.getSheets().forEach(function (s) {
    if (!achada && _chave(s.getName()) === alvo) achada = s;
  });
  return achada;
}

function _chave(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(new RegExp('[' + String.fromCharCode(0x300) + '-' + String.fromCharCode(0x36f) + ']', 'g'), '')
    .replace(/\s+/g, ' ').trim().toLowerCase();
}

/**
 * Procura o cabecalho nas 6 primeiras linhas: a linha que contem "Entrada" e "Saida".
 * Devolve o numero da linha e os titulos de cada coluna.
 */
function _cabecalho(aba) {
  var ate = Math.min(6, aba.getLastRow() || 1);
  var largura = Math.max(aba.getLastColumn(), 12);
  var vals = aba.getRange(1, 1, ate, largura).getValues();
  for (var i = 0; i < vals.length; i++) {
    var titulos = vals[i].map(function (x) { return _chave(x); });
    if (titulos.indexOf('entrada') >= 0 && titulos.indexOf('saida') >= 0) {
      return { linha: i + 1, titulos: vals[i].map(function (x) { return String(x || ''); }), chaves: titulos };
    }
  }
  return { linha: 0, titulos: [], chaves: [] };
}

/** Monta a linha na ordem DAQUELA aba, pondo cada valor na coluna certa pelo nome. */
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

/** Aplica o formato certo em cada celula recem-escrita. */
function _ajustarFormatos(aba, linha, formatos) {
  for (var i = 0; i < formatos.length; i++) {
    if (!formatos[i]) continue;
    try { aba.getRange(linha, i + 1).setNumberFormat(formatos[i]); } catch (e) {}
  }
}

/** Nao duplica: mesma dupla FILHOt/tutor + mesma entrada. */
function _jaTem(aba, cab, d) {
  var iNome = cab.chaves.indexOf('tutor peludo');
  if (iNome < 0) iNome = cab.chaves.indexOf('peludo tutor');
  var iEnt = cab.chaves.indexOf('entrada');
  if (iNome < 0 || iEnt < 0) return false;
  var ultima = aba.getLastRow();
  if (ultima <= cab.linha) return false;
  var vals = aba.getRange(cab.linha + 1, 1, ultima - cab.linha, cab.chaves.length).getValues();
  var alvoNome = String(d.peludoTutor || '').trim().toLowerCase();
  var alvoData = _data(d.entrada);
  var alvoStr = (alvoData instanceof Date) ? alvoData.toDateString() : '';
  for (var i = 0; i < vals.length; i++) {
    var nome = String(vals[i][iNome] || '').trim().toLowerCase();
    var dt = vals[i][iEnt];
    var dtStr = (dt instanceof Date) ? dt.toDateString() : '';
    if (nome && nome === alvoNome && dtStr === alvoStr) return true;
  }
  return false;
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
 * LIMPEZA — apaga as linhas de teste das duas abas.
 * Escolha "limparTestes" na lista de funcoes, no topo do editor, e clique em Executar.
 */
function limparTestes() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var total = 0;
  [ABA_FINANCEIRO, ABA_DASHBOARD].forEach(function (nome) {
    var aba = _acharAba(ss, nome);
    if (!aba) return;
    var ultima = aba.getLastRow();
    if (ultima < 2) return;
    var largura = Math.max(aba.getLastColumn(), 4);
    var vals = aba.getRange(1, 1, ultima, largura).getValues();
    // De baixo para cima: apagar de cima muda o numero das linhas de baixo.
    for (var i = vals.length - 1; i >= 0; i--) {
      var linhaToda = vals[i].join(' ').toUpperCase();
      if (linhaToda.indexOf('TESTE APAGAR') >= 0) { aba.deleteRow(i + 1); total++; }
    }
  });
  Logger.log('Linhas de teste apagadas: ' + total);
  return total;
}

function _resposta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
