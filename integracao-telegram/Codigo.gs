/**
 * ZÊLUZ · AuAulândia — ponte para o grupo do Telegram
 * ==================================================
 *
 * PARA QUE SERVE
 * Quando a monitora marca uma alteração no check-in do corpo e tira a foto, a
 * foto vai sozinha para o grupo da veterinária no Telegram — com o nome do
 * FILHOt, o que foi encontrado e quem viu.
 *
 * Hoje isso depende de alguém lembrar de abrir o WhatsApp e mandar. Quando a
 * casa está cheia, é o primeiro passo que cai.
 *
 * POR QUE UM INTERMEDIÁRIO (e não o app falando direto com o Telegram)
 * O app da AuAulândia é uma página pública. Tudo que estiver escrito nela pode
 * ser lido por qualquer pessoa — inclusive o token do bot. Com o token na mão,
 * qualquer um manda mensagem em nome da Zêluz. Por isso o token mora AQUI, e o
 * app só conversa com este endereço.
 *
 * ----------------------------------------------------------------------------
 * PASSO A PASSO
 *
 * PARTE 1 — Criar o bot (no Telegram, no celular ou no computador)
 *  1. Abra o Telegram e procure por  @BotFather  (o do selo azul).
 *  2. Mande  /newbot
 *  3. Ele pede um NOME: escreva  Zeluz AuAulandia
 *  4. Ele pede um USUÁRIO: precisa terminar em "bot". Ex:  zeluz_auaulandia_bot
 *  5. Ele responde com um TOKEN, parecido com:
 *        8123456789:AAH1a2B3c4D5e6F7g8H9i0J...
 *     GUARDE esse token. Ele é a senha do bot — não mande por WhatsApp nem cole
 *     em lugar nenhum além do passo 12 aqui embaixo.
 *
 * PARTE 2 — Colocar o bot no grupo
 *  6. Abra o grupo da veterinária no Telegram (ou crie um novo).
 *  7. Toque no nome do grupo → Adicionar membro → procure pelo usuário do bot
 *     (ex.: zeluz_auaulandia_bot) e adicione.
 *  8. Mande qualquer mensagem no grupo (ex.: "oi").
 *  9. No navegador, abra este endereço trocando SEU_TOKEN pelo token do passo 5:
 *        https://api.telegram.org/botSEU_TOKEN/getUpdates
 * 10. Procure na resposta por  "chat":{"id":-100123456789
 *     Esse número NEGATIVO é o ID do grupo. Guarde também.
 *
 * PARTE 3 — Publicar esta ponte
 * 11. Vá em https://script.google.com → Novo projeto.
 * 12. Apague o que estiver lá, cole ESTE arquivo inteiro e preencha as três
 *     linhas de configuração logo abaixo.
 * 13. Salvar → Implantar → Nova implantação → tipo "App da Web".
 *       Executar como:      Eu
 *       Quem pode acessar:  Qualquer pessoa
 * 14. Autorize e COPIE a URL que termina em /exec.
 * 15. No app da AuAulândia: Time → (em breve, tela de integrações) ou peça para
 *     o Claude ligar a URL no app.
 *
 * Para testar: abra a URL /exec no navegador. Deve responder "ponte do telegram
 * no ar" e mandar uma mensagem de teste no grupo.
 */

// ============ CONFIGURAÇÃO (as três linhas que você preenche) ============
var TOKEN_BOT = 'COLE_AQUI_O_TOKEN_DO_BOTFATHER';
var ID_GRUPO  = 'COLE_AQUI_O_ID_DO_GRUPO';        // o número negativo, ex: -1001234567890
var SENHA     = 'zeluz-auaulandia';               // a mesma que você escreve no app
// =========================================================================

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    if (String(d.senha || '') !== SENHA) {
      return _resp({ ok: false, erro: 'senha invalida' });
    }

    var legenda = _montarLegenda(d);

    // Com foto usa sendPhoto; sem foto, sendMessage.
    if (d.fotoBase64) {
      var bytes = Utilities.base64Decode(String(d.fotoBase64).replace(/^data:image\/\w+;base64,/, ''));
      var blob = Utilities.newBlob(bytes, 'image/jpeg', 'filhot.jpg');
      var r = UrlFetchApp.fetch('https://api.telegram.org/bot' + TOKEN_BOT + '/sendPhoto', {
        method: 'post',
        payload: { chat_id: ID_GRUPO, caption: legenda, parse_mode: 'HTML', photo: blob },
        muteHttpExceptions: true,
      });
      return _resp({ ok: r.getResponseCode() === 200, resposta: r.getContentText().slice(0, 200) });
    }

    return _resp(_mandarTexto(legenda));
  } catch (err) {
    return _resp({ ok: false, erro: String(err) });
  }
}

function doGet() {
  var r = _mandarTexto('<b>Zêluz · AuAulândia</b>\nPonte de testes: está tudo funcionando.');
  return _resp({ ok: true, msg: 'ponte do telegram no ar', envio: r });
}

function _mandarTexto(texto) {
  var r = UrlFetchApp.fetch('https://api.telegram.org/bot' + TOKEN_BOT + '/sendMessage', {
    method: 'post',
    payload: { chat_id: ID_GRUPO, text: texto, parse_mode: 'HTML' },
    muteHttpExceptions: true,
  });
  return { ok: r.getResponseCode() === 200, resposta: r.getContentText().slice(0, 200) };
}

/** A mensagem que chega no grupo. Curta e completa: dá para decidir sem abrir o sistema. */
function _montarLegenda(d) {
  var L = [];
  L.push('<b>' + _esc(d.pet || 'FILHOt') + '</b>' + (d.raca ? (' · ' + _esc(d.raca)) : ''));
  if (d.tutor) L.push('Tutor: ' + _esc(d.tutor));
  if (d.ponto) L.push('<b>' + _esc(d.ponto) + '</b>');
  if (d.alertas) L.push(_esc(d.alertas));
  if (d.obs) L.push('Observação: ' + _esc(d.obs));
  if (d.quem) L.push('Quem viu: ' + _esc(d.quem) + (d.hora ? (' às ' + _esc(d.hora)) : ''));
  return L.join('\n');
}

function _esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function _resp(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
