/**
 * ZÊLUZ · AuAulândia — ponte para o grupo do Telegram
 *
 * Versão 2 (13/ago/2026). O que mudou depois do primeiro teste:
 *
 *  · ACENTO virava "?". O Apps Script manda o formulário em latin-1, e "ê", "ç",
 *    "ã" se perdiam no caminho. Como já usamos parse_mode HTML, agora todo
 *    caractere fora do ASCII vira uma entidade numérica (&#234; para "ê"). O
 *    Telegram converte de volta e o acento aparece certo. Vale para texto e para
 *    a legenda da foto.
 *
 *  · A foto agora respeita o TIPO real do arquivo (jpeg, png...), em vez de
 *    dizer "jpeg" para tudo.
 *
 *  · Se o Telegram recusar, a resposta dele vem inteira — sem cortar em 300
 *    letras, que escondia justamente o motivo do erro.
 */

var TOKEN_BOT = 'COLE_AQUI_O_TOKEN';
var ID_GRUPO  = '-5484669898';
var SENHA     = 'zeluz-auaulandia';

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    if (String(d.senha || '') !== SENHA) {
      return _resp({ ok: false, erro: 'senha invalida' });
    }
    var legenda = _montarLegenda(d);
    if (d.fotoBase64) return _resp(_mandarFoto(legenda, d.fotoBase64));
    return _resp(_mandarTexto(legenda));
  } catch (err) {
    return _resp({ ok: false, erro: String(err) });
  }
}

function doGet() {
  var r = _mandarTexto('<b>Zêluz · AuAulândia</b>\nPonte de testes: está tudo funcionando. Acentuação: ação, coração, Zêluz, José.');
  return _resp({ ok: true, msg: 'ponte do telegram no ar', envio: r });
}

function _mandarTexto(texto) {
  var r = UrlFetchApp.fetch('https://api.telegram.org/bot' + TOKEN_BOT + '/sendMessage', {
    method: 'post',
    payload: { chat_id: ID_GRUPO, text: _paraHtml(texto), parse_mode: 'HTML' },
    muteHttpExceptions: true
  });
  return { ok: r.getResponseCode() === 200, resposta: r.getContentText() };
}

function _mandarFoto(legenda, dataUri) {
  var tipo = 'image/jpeg', nome = 'filhot.jpg';
  var m = String(dataUri).match(/^data:(image\/(\w+));base64,/);
  if (m) {
    tipo = m[1];
    nome = 'filhot.' + (m[2] === 'jpeg' ? 'jpg' : m[2]);
  }
  var limpo = String(dataUri).replace(/^data:image\/\w+;base64,/, '');
  var blob = Utilities.newBlob(Utilities.base64Decode(limpo), tipo, nome);
  var r = UrlFetchApp.fetch('https://api.telegram.org/bot' + TOKEN_BOT + '/sendPhoto', {
    method: 'post',
    payload: { chat_id: ID_GRUPO, caption: _paraHtml(legenda), parse_mode: 'HTML', photo: blob },
    muteHttpExceptions: true
  });
  return { ok: r.getResponseCode() === 200, resposta: r.getContentText() };
}

/**
 * Acento sobrevive à viagem: tudo que não é ASCII vira &#numero;.
 * As tags <b> que a gente mesmo põe continuam funcionando.
 */
function _paraHtml(s) {
  var t = String(s == null ? '' : s), out = '';
  for (var i = 0; i < t.length; i++) {
    var c = t.charCodeAt(i);
    out += (c > 127) ? ('&#' + c + ';') : t.charAt(i);
  }
  return out;
}

function _montarLegenda(d) {
  var L = [];
  L.push('<b>' + _esc(d.pet || 'FILHOt') + '</b>' + (d.raca ? (' · ' + _esc(d.raca)) : ''));
  if (d.tutor) L.push('Tutor: ' + _esc(d.tutor));
  if (d.ponto) L.push('<b>' + _esc(d.ponto) + '</b>');
  if (d.alertas) L.push(_esc(d.alertas));
  if (d.local) L.push('Onde: ' + _esc(d.local));
  if (d.obs) L.push('Observação: ' + _esc(d.obs));
  if (d.quem) L.push('Quem viu: ' + _esc(d.quem) + (d.hora ? (' às ' + _esc(d.hora)) : ''));
  return L.join('\n');
}

/** Só os três que o HTML do Telegram exige — o acento é tratado no _paraHtml. */
function _esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function _resp(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
