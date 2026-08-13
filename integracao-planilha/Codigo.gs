/**
 * ZÊLUZ · AuAulândia — ponte entre o app e a planilha de Hospedagem
 * ================================================================
 *
 * PARA QUE SERVE
 * Quando a consultora marca "Fechou" num orçamento dentro do app, este script
 * escreve a hospedagem nas DUAS abas da planilha — sozinho, na hora.
 *
 * Isso mata o erro humano de esquecimento: hoje alguém precisa lembrar de abrir
 * a planilha e digitar em dois lugares. Se esquecer, o financeiro fica furado E
 * o dashboard de ocupação não mostra o hóspede — e ninguém sabe quantas
 * plantonistas vão ser necessárias.
 *
 * O dashboard NÃO muda em nada. Ele continua lendo a mesma planilha, do mesmo
 * jeito. A única diferença é que agora a planilha se preenche.
 *
 * ----------------------------------------------------------------------------
 * COMO INSTALAR (uma vez só, ~3 minutos)
 *
 *  1. Abra a planilha de Hospedagem no Google Planilhas.
 *  2. Menu  Extensões → Apps Script.
 *  3. Apague o que estiver lá e cole ESTE arquivo inteiro.
 *  4. Clique em Salvar (ícone de disquete).
 *  5. Clique em  Implantar → Nova implantação.
 *  6. Em "Selecionar tipo" (engrenagem) escolha  App da Web.
 *  7. Preencha:
 *       Executar como:              Eu  (a sua conta)
 *       Quem pode acessar:          Qualquer pessoa
 *  8. Clique em Implantar. O Google vai pedir autorização — autorize.
 *       (Vai aparecer um aviso de "app não verificado": clique em
 *        "Avançado" → "Acessar ...". É o seu próprio script.)
 *  9. COPIE a URL que aparece (termina em /exec).
 * 10. No app da AuAulândia: Orçamento de Hospedagem → Tabela e feriados →
 *     cole a URL no campo "Ponte com a planilha" e salve.
 *
 * Pronto. A partir daí, todo orçamento marcado como "Fechou" cai nas duas abas.
 *
 * ----------------------------------------------------------------------------
 * SEGURANÇA
 * A URL do app da web é o segredo. Quem tiver a URL consegue escrever na
 * planilha. Por isso existe o TOKEN abaixo: troque por uma palavra sua e
 * escreva a MESMA palavra no app. Sem o token certo, o script recusa.
 */

// TROQUE por uma palavra sua (a mesma que você vai escrever no app).
var TOKEN = 'zeluz-auaulandia';

// Nomes das abas — se você renomear alguma aba, mude aqui também.
var ABA_FINANCEIRO = 'Hospedagem';
var ABA_DASHBOARD  = 'Calendario Hospedagem para Dash';

/**
 * Colunas (as duas abas têm a mesma ordem, A até L):
 *  A  quantidade de hóspedes
 *  B  Tutor peludo   →  "Ragnar/Paola"
 *  C  Entrada
 *  D  Saída
 *  E  Diárias        →  total de noites (diárias de hotel + pernoites)
 *  F  R$ Reserva     →  os 50% da reserva
 *  G  Data Reserva
 *  H  Valor Total
 *  I  Valor Diária   →  valor unitário da diária usado no orçamento
 *  J  A pagar        →  os outros 50%
 *  K  Data a Pagar   →  o dia da hospedagem (entrada)
 *  L  Média do Valor da Diária  →  deixado em branco (é fórmula da planilha)
 */
function doPost(e) {
  try {
    var dados = JSON.parse(e.postData.contents);

    if (String(dados.token || '') !== TOKEN) {
      return _resposta({ ok: false, erro: 'token invalido' });
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var linha = _montarLinha(dados);
    var escritas = [];

    [ABA_FINANCEIRO, ABA_DASHBOARD].forEach(function (nome) {
      var aba = ss.getSheetByName(nome);
      if (!aba) { escritas.push(nome + ': ABA NAO ENCONTRADA'); return; }

      // Já existe? Não duplica: mesma dupla FILHOt/tutor + mesma entrada.
      if (_jaTem(aba, linha[1], linha[2])) {
        escritas.push(nome + ': ja estava la');
        return;
      }
      aba.appendRow(linha);
      escritas.push(nome + ': ok');
    });

    return _resposta({ ok: true, abas: escritas });
  } catch (err) {
    return _resposta({ ok: false, erro: String(err) });
  }
}

/** Teste rápido pelo navegador: abrir a URL /exec deve responder "no ar". */
function doGet() {
  return _resposta({ ok: true, msg: 'ponte da AuAulandia no ar' });
}

function _montarLinha(d) {
  return [
    d.hospedes || 1,
    d.peludoTutor || '',          // "Ragnar/Paola"
    _data(d.entrada),
    _data(d.saida),
    d.noites || 0,
    _num(d.reserva),
    _data(d.dataReserva),
    _num(d.total),
    _num(d.valorDiaria),
    _num(d.aPagar),
    _data(d.dataAPagar),
    ''                            // Média: fórmula da planilha, não mexemos
  ];
}

/** "2026-08-12" → Date. Sem data, devolve vazio (nunca inventa hoje). */
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

function _resposta(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
