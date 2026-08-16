/**
 * ZÊLUZ · AuAulândia — ponte para os grupos do Telegram
 *
 * Versão 3 (13/ago/2026) — vários grupos, um bot só.
 *
 * O mesmo bot atende quantos grupos forem precisos: cada aviso diz para QUAL
 * grupo vai. Grupo novo = uma linha na lista GRUPOS aqui embaixo.
 *
 * Se o aviso não disser o grupo, vai para o da veterinária (o primeiro que
 * existiu) — assim nada se perde por engano de configuração.
 */

var TOKEN_BOT = 'COLE_AQUI_O_TOKEN';
var SENHA     = 'zeluz-auaulandia';

var GRUPOS = {
  vet:    '-5484669898',   // Zêluz Daycare Vet — alterações do check-in do corpo
  comida: '-5460714392',   // Daycare - Quem não almoçou
  // Gestão — o resumo fechado de cada plantão (Adriana, 15/ago/2026: "precisamos criar um
  // grupo para passar os dados do plantão para a Gestão e quem mais em algum momento
  // convier — se tiver um dia um supervisor, gerente"). Começa só com a Adriana e a Márcia.
  // PARA LIGAR: crie o grupo no Telegram, ponha o bot dentro, mande qualquer mensagem lá e
  // troque o COLE_AQUI pelo id do grupo (começa com sinal de menos).
  // Quem entra e quem sai depois é decidido no próprio Telegram, sem mexer no sistema.
  gestao: 'COLE_AQUI_O_ID_DO_GRUPO_DA_GESTAO'
};
var GRUPO_PADRAO = 'vet';

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    if (String(d.senha || '') !== SENHA) {
      return _resp({ ok: false, erro: 'senha invalida' });
    }
    var destino = GRUPOS[String(d.grupo || GRUPO_PADRAO)] || GRUPOS[GRUPO_PADRAO];
    var texto = d.texto ? String(d.texto) : _montarLegenda(d);
    if (d.fotoBase64) return _resp(_mandarFoto(destino, texto, d.fotoBase64));
    return _resp(_mandarTexto(destino, texto));
  } catch (err) {
    return _resp({ ok: false, erro: String(err) });
  }
}

/** Abra a URL /exec no navegador: manda um teste para CADA grupo configurado. */
function doGet() {
  var out = { ok: true, msg: 'ponte do telegram no ar', grupos: {} };
  Object.keys(GRUPOS).forEach(function (nome) {
    out.grupos[nome] = _mandarTexto(GRUPOS[nome],
      '<b>Zêluz · AuAulândia</b>\nPonte de testes: está tudo funcionando. Acentuação: ação, coração, Zêluz, José.');
  });
  return _resp(out);
}

function _mandarTexto(destino, texto) {
  var r = UrlFetchApp.fetch('https://api.telegram.org/bot' + TOKEN_BOT + '/sendMessage', {
    method: 'post',
    payload: { chat_id: destino, text: _paraHtml(texto), parse_mode: 'HTML' },
    muteHttpExceptions: true
  });
  return { ok: r.getResponseCode() === 200, resposta: r.getContentText() };
}

function _mandarFoto(destino, legenda, dataUri) {
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
    payload: { chat_id: destino, caption: _paraHtml(legenda), parse_mode: 'HTML', photo: blob },
    muteHttpExceptions: true
  });
  return { ok: r.getResponseCode() === 200, resposta: r.getContentText() };
}

/** Acento sobrevive à viagem: tudo que não é ASCII vira &#numero;. */
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

function _esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function _resp(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
