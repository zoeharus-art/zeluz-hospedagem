/**
 * ZÊLUZ · AuAulândia — ponte para os grupos do Telegram
 *
 * Versão 5 (25/ago/2026) — emoji parou de derrubar a mensagem inteira (par surrogado).
 * Versão 4 (25/ago/2026) — grupo "Diário do Daycare" (resumo do dia sai do Plantão AuAulândia)
 *                          e grupo desconhecido devolve erro em vez de cair na veterinária.
 * Versão 3 (13/ago/2026) — vários grupos, um bot só.
 *
 * O mesmo bot atende quantos grupos forem precisos: cada aviso diz para QUAL
 * grupo vai. Grupo novo = uma linha na lista GRUPOS aqui embaixo.
 *
 * Se o aviso não disser o grupo, vai para o da veterinária (o primeiro que
 * existiu). Se disser um grupo que não está na lista, a ponte RECUSA e avisa —
 * nunca manda para o grupo errado calada.
 */

var TOKEN_BOT = 'COLE_AQUI_O_TOKEN';
var SENHA     = 'zeluz-auaulandia';

var GRUPOS = {
  vet:    '-5484669898',   // Zêluz Daycare Vet — alterações do check-in do corpo
  comida: '-5460714392',   // Daycare - Quem não almoçou
  // Gestão — o resumo fechado de cada plantão (Adriana, 15/ago/2026: "precisamos criar um
  // grupo para passar os dados do plantão para a Gestão e quem mais em algum momento
  // convier — se tiver um dia um supervisor, gerente"). Começa só com a Adriana e a Márcia.
  // Quem entra e quem sai depois é decidido no próprio Telegram, sem mexer no sistema.
  gestao: '-5388577278',   // Zêluz - Plantão AuAulândia — só o fechamento do turno do hotel
  // Adriana, 25/ago/2026: "terá um grupo geral para o resumo do dia, para não colocar as
  // informações do Plantão do Hotel junto e fazer uma bagunça." Recebe o resumo do dia do
  // Day Care (EA, almoço, o que teve de diferente, medicação). Id lido com ?listar=1.
  diario: '-5486234450'    // Diário do Daycare
};
var GRUPO_PADRAO = 'vet';

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    if (String(d.senha || '') !== SENHA) {
      return _resp({ ok: false, erro: 'senha invalida' });
    }
    var nomeGrupo = String(d.grupo || GRUPO_PADRAO);
    // Grupo que a ponte não conhece NÃO cai no padrão: o app fica sabendo e diz na tela.
    // (Antes caía na veterinária em silêncio — o resumo do dia iria para o grupo errado.)
    if (!GRUPOS[nomeGrupo]) return _resp({ ok: false, erro: 'grupo nao configurado na ponte: ' + nomeGrupo });
    var destino = GRUPOS[nomeGrupo];
    var texto = d.texto ? String(d.texto) : _montarLegenda(d);
    if (d.fotoBase64) return _resp(_mandarFoto(destino, texto, d.fotoBase64));
    return _resp(_mandarTexto(destino, texto));
  } catch (err) {
    return _resp({ ok: false, erro: String(err) });
  }
}

/** Abra a URL /exec no navegador: manda um teste para CADA grupo configurado. */
function doGet(e) {
  // ?listar=1 → NÃO manda nada: só diz em que grupos o bot está e qual é o id de cada um.
  // É assim que se descobre o número de um grupo novo, sem precisar do token na mão: crie o
  // grupo, ponha o bot dentro, mande uma mensagem qualquer lá e abra a URL da ponte com
  // ?listar=1 no fim. (Adriana, 15/ago/2026 — grupo da Gestão.)
  if (e && e.parameter && e.parameter.listar) return _resp(_listarGrupos());
  var out = { ok: true, msg: 'ponte do telegram no ar', grupos: {} };
  Object.keys(GRUPOS).forEach(function (nome) {
    // Grupo ainda não configurado não recebe teste — e não vira erro escondido.
    if (String(GRUPOS[nome]).indexOf('COLE_AQUI') === 0) { out.grupos[nome] = 'AINDA NAO CONFIGURADO'; return; }
    out.grupos[nome] = _mandarTexto(GRUPOS[nome],
      '<b>Zêluz · AuAulândia</b>\nPonte de testes: está tudo funcionando. Acentuação: ação, coração, Zêluz, José.');
  });
  return _resp(out);
}

/** Onde o bot está: nome do grupo + id, lidos das mensagens recentes. Não envia nada. */
function _listarGrupos() {
  try {
    var r = UrlFetchApp.fetch('https://api.telegram.org/bot' + TOKEN_BOT + '/getUpdates',
      { muteHttpExceptions: true });
    var j = JSON.parse(r.getContentText());
    if (!j.ok) return { ok: false, erro: j.description || 'o Telegram recusou' };
    var vistos = {}, achados = [];
    (j.result || []).forEach(function (u) {
      var m = u.message || u.channel_post || u.my_chat_member || null;
      var c = m && m.chat; if (!c || vistos[c.id]) return;
      vistos[c.id] = true;
      achados.push({ id: String(c.id), titulo: c.title || c.first_name || '(sem titulo)', tipo: c.type });
    });
    var jaTem = {};
    Object.keys(GRUPOS).forEach(function (n) { jaTem[String(GRUPOS[n])] = n; });
    achados.forEach(function (a) { a.jaConfigurado = jaTem[a.id] || null; });
    return {
      ok: true,
      instrucao: 'Copie o "id" do grupo novo e cole na lista GRUPOS, no lugar do COLE_AQUI. Depois publique uma versao nova.',
      grupos_encontrados: achados,
      grupos_configurados: GRUPOS
    };
  } catch (err) { return { ok: false, erro: String(err) }; }
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

/**
 * Acento sobrevive à viagem: tudo que não é ASCII vira &#numero;.
 *
 * ⚠ 25/ago/2026 — EMOJI DERRUBAVA A MENSAGEM INTEIRA. Emoji (🐶 💛 🐾) ocupa DUAS
 * posições em JavaScript (um "par surrogado"). Lendo caractere a caractere, cada metade
 * virava uma entidade sem sentido e o Telegram recusava a mensagem toda com
 * "unmatched surrogate code units". Foi assim que as mensagens prontas para o tutor
 * pararam de chegar ao grupo "Quem não almoçou" — e ninguém ficou sabendo.
 * Agora as duas metades são juntadas no número certo antes de virar entidade.
 */
function _paraHtml(s) {
  var t = String(s == null ? '' : s), out = '';
  for (var i = 0; i < t.length; i++) {
    var c = t.charCodeAt(i);
    if (c >= 0xD800 && c <= 0xDBFF && i + 1 < t.length) {
      var lo = t.charCodeAt(i + 1);
      if (lo >= 0xDC00 && lo <= 0xDFFF) {
        out += '&#' + ((c - 0xD800) * 0x400 + (lo - 0xDC00) + 0x10000) + ';';
        i++;
        continue;
      }
    }
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
