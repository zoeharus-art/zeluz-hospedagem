/**
 * ZÊLUZ · AuAulândia — ponte entre o app e a planilha de Hospedagem
 *
 * Versão 2 (13/ago/2026). O que mudou depois do primeiro teste:
 *  · Uma aba que falha não derruba a outra (antes, um erro na primeira abortava tudo).
 *  · A resposta diz exatamente o que aconteceu em CADA aba.
 *  · doGet lista as abas que existem de verdade — serve para achar nome trocado.
 *  · limparTestes() apaga as linhas de teste sem precisar mexer à mão.
 */

var TOKEN = 'zeluz-auaulandia';
var ABA_FINANCEIRO = 'Hospedagem';
// Nome REAL confirmado em 13/ago/2026: 'Calendário Hospedagem para dash' (com acento, dash
// minusculo). _acharAba tolera as duas formas — mas fica aqui o nome certo, para quem ler.
var ABA_DASHBOARD  = 'Calendário Hospedagem para dash';

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    if (String(d.token || '') !== TOKEN) {
      return _resposta({ ok: false, erro: 'token invalido' });
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var linha = [
      d.hospedes || 1,
      d.peludoTutor || '',
      _data(d.entrada),
      _data(d.saida),
      d.noites || 0,
      _num(d.reserva),
      _data(d.dataReserva),
      _num(d.total),
      _num(d.valorDiaria),
      _num(d.aPagar),
      _data(d.dataAPagar),
      ''
    ];

    var escritas = [];
    [ABA_FINANCEIRO, ABA_DASHBOARD].forEach(function (nome) {
      // try POR ABA: se uma falhar (aba protegida, nome trocado), a outra ainda grava.
      try {
        var aba = _acharAba(ss, nome);
        if (!aba) { escritas.push(nome + ': ABA NAO ENCONTRADA'); return; }
        if (_jaTem(aba, linha[1], linha[2])) { escritas.push(aba.getName() + ': ja estava la'); return; }
        aba.appendRow(linha);
        escritas.push(aba.getName() + ': ok');
      } catch (err2) {
        escritas.push(nome + ': ERRO — ' + String(err2));
      }
    });

    return _resposta({ ok: true, abas: escritas });
  } catch (err) {
    return _resposta({ ok: false, erro: String(err) });
  }
}

/** Abre a URL /exec no navegador para ver se está no ar E quais abas existem. */
function doGet() {
  var nomes = [];
  try {
    SpreadsheetApp.getActiveSpreadsheet().getSheets().forEach(function (s) { nomes.push(s.getName()); });
  } catch (e) { nomes = ['(nao consegui ler as abas: ' + String(e) + ')']; }
  return _resposta({
    ok: true,
    msg: 'ponte da AuAulandia no ar',
    abas_da_planilha: nomes,
    procurando_por: [ABA_FINANCEIRO, ABA_DASHBOARD]
  });
}

/**
 * Acha a aba tolerando acento, espaço a mais e maiúscula/minúscula.
 * "Calendário  Hospedagem para Dash" casa com "Calendario Hospedagem para Dash".
 */
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
    .normalize('NFD').replace(new RegExp('[' + String.fromCharCode(0x300) + '-' + String.fromCharCode(0x36f) + ']', 'g'), '')
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

/** Evita a linha repetida quando alguém marca "Fechou" duas vezes. */
function _jaTem(aba, peludoTutor, entrada) {
  var ultima = aba.getLastRow();
  if (ultima < 2) return false;
  var vals = aba.getRange(1, 2, ultima, 3).getValues(); // colunas B, C, D
  var alvoNome = String(peludoTutor).trim().toLowerCase();
  var alvoData = (entrada instanceof Date) ? entrada.toDateString() : '';
  for (var i = 0; i < vals.length; i++) {
    var nome = String(vals[i][0] || '').trim().toLowerCase();
    var dt = vals[i][1];
    var dtStr = (dt instanceof Date) ? dt.toDateString() : '';
    if (nome && nome === alvoNome && dtStr === alvoData) return true;
  }
  return false;
}

/**
 * LIMPEZA — apaga as linhas de teste das duas abas.
 * Como usar: escolha "limparTestes" na lista de funções, no topo do editor, e
 * clique em Executar. Depois olhe o Registro de execução para ver quantas saíram.
 */
function limparTestes() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var total = 0;
  [ABA_FINANCEIRO, ABA_DASHBOARD].forEach(function (nome) {
    var aba = _acharAba(ss, nome);
    if (!aba) return;
    var ultima = aba.getLastRow();
    if (ultima < 2) return;
    var vals = aba.getRange(1, 2, ultima, 1).getValues();
    // De baixo para cima: apagar de cima muda o número das linhas de baixo.
    for (var i = vals.length - 1; i >= 0; i--) {
      if (String(vals[i][0] || '').toUpperCase().indexOf('TESTE APAGAR') >= 0) {
        aba.deleteRow(i + 1);
        total++;
      }
    }
  });
  Logger.log('Linhas de teste apagadas: ' + total);
  return total;
}

function _resposta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
