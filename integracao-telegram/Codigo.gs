/**
 * ZÊLUZ · AuAulândia — ponte para os grupos do Telegram
 *
 * Versão 8 (29/ago/2026) — a palavra-chave da ponte (SENHA) saiu do código e passou a
 *                          morar só nas Propriedades do script, na propriedade PONTE_SENHA.
 *                          Antes ela era um texto fixo e curto, escrito neste
 *                          arquivo — que é um repositório PÚBLICO no GitHub — e quem o lesse
 *                          ganhava poder de postar nos 4 grupos da Zêluz, inclusive no da
 *                          Gestão (auditoria 28/ago/2026, achados 8 e 9). Sem a propriedade
 *                          configurada, a ponte RECUSA TUDO — nunca abre a porta por padrão —
 *                          e diz isso no log. Ver _ponteSenha() logo abaixo e
 *                          docs/auditoria-28ago2026/06-pontes-e-pin.md.
 * Versão 7 (28/ago/2026) — App Check: a ponte passa a mandar a prova de que é da casa, lendo o
 *                          token de depuração das Propriedades do script (APPCHECK_DEBUG_TOKEN).
 *                          Sem a propriedade, nada muda. E a gravação no banco deixou de engolir
 *                          o erro calada.
 * Versão 6 (28/ago/2026) — vigia do 2º horário do almoço: às 16h20, se ninguém registrou,
 *                          a ponte avisa o grupo sozinha (roda sem o app aberto).
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

/* ---------------------------------------------------------------------------
 * PONTE_SENHA — a palavra-chave que autoriza o app a falar com esta ponte.
 *
 * NUNCA fica escrita neste arquivo (o repositório é público). Mora só nas
 * Propriedades do script: Configurações do projeto (a engrenagem, à esquerda) →
 * Propriedades do script → Adicionar propriedade do script → nome PONTE_SENHA,
 * valor a nova palavra-chave (uma string longa e aleatória, a mesma que vai ser
 * colada em Configurações → Avisos no Telegram, no app).
 *
 * Sem a propriedade, esta função devolve '' — e doPost() recusa TODO pedido,
 * mesmo sem 'senha' nenhuma vindo no corpo. O silêncio nunca pode ter dois
 * significados: o log diz exatamente por que recusou.
 * ------------------------------------------------------------------------- */
function _ponteSenha() {
  try {
    return PropertiesService.getScriptProperties().getProperty('PONTE_SENHA') || '';
  } catch (e) {
    Logger.log('PONTE_SENHA: não consegui ler as Propriedades do script — ' + e);
    return '';
  }
}

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
    var senhaEsperada = _ponteSenha();
    if (!senhaEsperada) {
      Logger.log('PONTE_SENHA não configurada nas Propriedades do script — recusando o pedido.');
      return _resp({ ok: false, erro: 'PONTE_SENHA não configurada nas Propriedades do script' });
    }
    if (String(d.senha || '') !== senhaEsperada) {
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

/* ================================================================================
 * VIGIA DO 2º HORÁRIO DO ALMOÇO — Adriana, 28/ago/2026
 *
 * "Precisa mandar todo dia; e se não mandar, mandar uma mensagem às 16h20:
 *  Não foi aberto o programa hoje do 2º horário do almoço. Confirmar.
 *  Amanda, ligar para o Day Care confirmando se não teve ninguém que não comeu hoje."
 *
 * Por que isto mora AQUI e não no app: o app só existe enquanto alguém está com ele
 * aberto. Justamente no dia em que ninguém abriu — que é o dia que precisa ser
 * cobrado — não há ninguém para mandar a mensagem. O Apps Script roda sozinho, no
 * servidor do Google, mesmo com a casa inteira de celular no bolso.
 *
 * COMO LIGAR (uma vez só):
 *   1. Cole este arquivo no editor do Apps Script e salve.
 *   2. Implantar → Gerenciar implantações → editar (lápis) → Versão: NOVA → Implantar.
 *   3. No menu da esquerda, Acionadores (o relógio) → Adicionar acionador:
 *        Função: vigiaAlmoco2
 *        Origem do evento: Baseado no tempo
 *        Tipo: Timer por minuto → A cada 15 minutos
 *      Salvar. (O acionador "diário" do Google só aceita uma FAIXA de uma hora, por
 *      isso o de 15 em 15 minutos: a função é que decide a hora certa.)
 *   4. Ela vai pedir autorização na primeira vez. Autorize com a conta da Zêluz.
 *
 * A função só age entre 16h20 e 17h20, uma vez por dia, e nunca aos domingos.
 * ============================================================================== */

var FB_URL = 'https://hospedagem-zeluz-default-rtdb.firebaseio.com';
var FB_KEY = 'AIzaSyD3udp47XruRAEeIYWNGn0ICGCX3a1qr28';   // a mesma chave pública do app
var VIGIA_HORA_INICIO = '16:20';
var VIGIA_HORA_FIM    = '17:20';

/* ---------------------------------------------------------------------------
 * App Check — a prova de que quem fala com o banco é gente da casa.
 *
 * O app roda no navegador e produz essa prova com o reCAPTCHA. Esta ponte roda
 * no servidor do Google (Apps Script), não tem navegador e não consegue fazer o
 * reCAPTCHA. O caminho oficial do Firebase para servidor e teste é o TOKEN DE
 * DEPURAÇÃO: cria-se um no Console (App Check → app web → Gerenciar tokens de
 * depuração) e troca-se esse segredo por um token de App Check de verdade.
 *
 * O segredo NUNCA fica no código — este repositório é público. Ele mora nas
 * Propriedades do script (Configurações do projeto → Propriedades do script),
 * na propriedade APPCHECK_DEBUG_TOKEN.
 *
 * Sem a propriedade, a ponte segue exatamente como hoje, sem o cabeçalho — e
 * diz isso no log, para o silêncio não ter dois significados.
 * ------------------------------------------------------------------------- */
var APPCHECK_PROJECT_ID = 'hospedagem-zeluz';
var APPCHECK_APP_ID     = '1:199129329105:web:22d0995972c197e24644f0';
var __appCheckToken = null;    // cache de uma execução (a troca vale ~1 hora)
var __appCheckLido  = false;

/** Troca o token de depuração por um token de App Check. Devolve '' se não houver. */
function _appCheckToken() {
  if (__appCheckLido) return __appCheckToken;
  __appCheckLido = true;
  __appCheckToken = '';
  var segredo = '';
  try {
    segredo = PropertiesService.getScriptProperties().getProperty('APPCHECK_DEBUG_TOKEN') || '';
  } catch (e) {
    Logger.log('App Check: não consegui ler as Propriedades do script — ' + e + ' — seguindo sem');
    return '';
  }
  if (!segredo) {
    Logger.log('App Check: sem token de depuração — seguindo sem');
    return '';
  }
  try {
    var url = 'https://firebaseappcheck.googleapis.com/v1/projects/' + APPCHECK_PROJECT_ID +
              '/apps/' + APPCHECK_APP_ID + ':exchangeDebugToken?key=' + FB_KEY;
    var r = UrlFetchApp.fetch(url, {
      method: 'post', contentType: 'application/json',
      payload: JSON.stringify({ debug_token: segredo }), muteHttpExceptions: true });
    var v = JSON.parse(r.getContentText() || '{}');
    if (r.getResponseCode() !== 200 || !v.token) {
      // Só o código e a mensagem de erro do Google — nunca o segredo nem o token.
      Logger.log('App Check: a troca do token de depuração falhou (HTTP ' + r.getResponseCode() +
                 ') — ' + ((v.error && v.error.status) || 'sem detalhe') + ' — seguindo sem');
      return '';
    }
    __appCheckToken = v.token;
    return __appCheckToken;
  } catch (e) {
    Logger.log('App Check: erro ao trocar o token de depuração — ' + e + ' — seguindo sem');
    return '';
  }
}

/** Cabeçalhos das chamadas ao banco: com a prova do App Check quando houver. */
function _fbCabecalhos() {
  var t = _appCheckToken();
  return t ? { 'X-Firebase-AppCheck': t } : {};
}

function vigiaAlmoco2() {
  var agora = new Date();
  var hhmm = Utilities.formatDate(agora, 'America/Sao_Paulo', 'HH:mm');
  if (hhmm < VIGIA_HORA_INICIO || hhmm > VIGIA_HORA_FIM) return;      // fora da janela
  var diaSemana = Number(Utilities.formatDate(agora, 'America/Sao_Paulo', 'u'));  // 7 = domingo
  if (diaSemana === 7) return;                                        // domingo não há Day Care
  var dia = Utilities.formatDate(agora, 'America/Sao_Paulo', 'yyyy-MM-dd');

  var token = _fbToken();
  if (!token) return;                                                 // sem token, não inventa

  // Já cobrado hoje? A mesma trava que o app usa — quem chegar primeiro grava.
  var jaFoi = _fbLer('daycare/cobranca-almoco2/' + dia, token);
  if (jaFoi) return;

  // O 2º horário do almoço foi registrado por alguém hoje?
  var almoco2 = _fbLer('daycare/atividade/' + dia + '/almoco2', token);
  var quantos = 0, algumNao = false;
  if (almoco2) {
    for (var k in almoco2) {
      if (!almoco2.hasOwnProperty(k)) continue;
      quantos++;
      if (almoco2[k] === 'nao') algumNao = true;
    }
  }
  // Foi registrado e alguém ficou sem comer: o grupo já recebeu caso a caso, na hora.
  if (quantos > 0 && algumNao) return;

  var texto = (quantos > 0)
    // Dia conferido e ninguém sem comer. Uma linha, para o silêncio não ter dois
    // significados — "todos comeram" e "ninguém abriu o programa" (Adriana, 28/ago/2026).
    ? ['<b>ALMOÇO — dia conferido</b>', '', 'Todos comeram hoje. Nenhum tutor a avisar.'].join('\n')
    : [
        '<b>ALMOÇO — 2º horário sem registro hoje</b>',
        '',
        'Não foi aberto o programa hoje no 2º horário do almoço. Confirmar.',
        '',
        'Amanda: ligar para o Day Care confirmando se não houve nenhum FILHOt que não comeu hoje.'
      ].join('\n');

  var r = _mandarTexto(GRUPOS['comida'], texto);
  // Grava a trava DEPOIS de mandar: se o Telegram falhar, tenta de novo daqui a 15 minutos,
  // ainda dentro da janela — silêncio aqui seria o mesmo defeito que esta função conserta.
  if (r && r.ok) {
    _fbGravar('daycare/cobranca-almoco2/' + dia, { ts: agora.getTime(), por: 'ponte', hora: hhmm }, token);
  }
}

/** Login anônimo no Firebase — a mesma porta que o app usa. */
function _fbToken() {
  try {
    var r = UrlFetchApp.fetch(
      'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' + FB_KEY,
      { method: 'post', contentType: 'application/json',
        payload: JSON.stringify({ returnSecureToken: true }), muteHttpExceptions: true });
    return JSON.parse(r.getContentText()).idToken || '';
  } catch (e) { return ''; }
}

function _fbLer(caminho, token) {
  try {
    var r = UrlFetchApp.fetch(FB_URL + '/' + caminho + '.json?auth=' + token,
      { headers: _fbCabecalhos(), muteHttpExceptions: true });
    if (r.getResponseCode() >= 300) {
      Logger.log('Firebase: leitura de ' + caminho + ' recusada (HTTP ' + r.getResponseCode() + ')');
      return null;
    }
    var v = JSON.parse(r.getContentText());
    return (v === null) ? null : v;
  } catch (e) {
    Logger.log('Firebase: erro ao ler ' + caminho + ' — ' + e);
    return null;
  }
}

function _fbGravar(caminho, obj, token) {
  // O comportamento de envio não muda: a ponte já mandou a mensagem antes de chegar aqui.
  // O que muda é que a falha DEIXA RASTRO. Antes, o catch vazio engolia o erro e a trava
  // diária simplesmente não existia — a ponte repetia o aviso a cada 15 minutos e ninguém
  // sabia por quê.
  try {
    var r = UrlFetchApp.fetch(FB_URL + '/' + caminho + '.json?auth=' + token,
      { method: 'put', contentType: 'application/json', headers: _fbCabecalhos(),
        payload: JSON.stringify(obj), muteHttpExceptions: true });
    if (r.getResponseCode() >= 300) {
      Logger.log('Firebase: gravação em ' + caminho + ' recusada (HTTP ' + r.getResponseCode() +
                 ') — a trava do dia NÃO foi gravada');
    }
  } catch (e) {
    Logger.log('Firebase: erro ao gravar em ' + caminho + ' — ' + e + ' — a trava do dia NÃO foi gravada');
  }
}

/** Teste de bancada: roda a verificação ignorando a hora, para ver se está tudo ligado. */
function vigiaAlmoco2_TESTE() {
  var token = _fbToken();
  var dia = Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'yyyy-MM-dd');
  var a2 = _fbLer('daycare/atividade/' + dia + '/almoco2', token);
  var n = 0; if (a2) { for (var k in a2) { if (a2.hasOwnProperty(k)) n++; } }
  Logger.log('token: ' + (token ? 'ok' : 'FALHOU'));
  Logger.log('App Check: ' + (_appCheckToken() ? 'ok (com prova)' : 'sem token de depuração — seguindo sem'));
  Logger.log('dia: ' + dia + ' · registros no 2º horário: ' + n);
  Logger.log('já cobrado hoje: ' + JSON.stringify(_fbLer('daycare/cobranca-almoco2/' + dia, token)));
  Logger.log(n > 0 ? 'Não cobraria: o 2º horário foi registrado.' : 'Cobraria: ninguém registrou o 2º horário.');
}

/* ================================================================================
 * VIGIA DA FALTA DAS 12h — a retaguarda de quem fecha o dia (30/ago/2026)
 *
 * O app fecha o dia sozinho ao meio-dia: quem não passou pelo check-in de entrada
 * vira falta, e a trava desse fechamento fica em daycare/falta-automatica/<dia>.
 * Só que esse fechamento ainda depende de UM aparelho estar aberto em algum lugar
 * da casa. No dia em que ninguém abrir o app — que é justamente o dia em que a
 * falta não seria marcada — não há ninguém para perceber.
 *
 * Esta função é a retaguarda. Ela NÃO marca falta em ninguém: marcar exige saber
 * quem passou pelo check-in, e essa decisão é da casa, não da ponte. O que ela faz
 * é olhar se a trava do dia existe:
 *
 *   - Trava existe  -> alguém (ou o temporizador do app) fechou o dia. Silêncio.
 *   - Trava não existe -> ninguém fechou. Cobra UMA vez no grupo da Gestão.
 *
 * Por que só cobrar: a regra da casa é que o humano sempre vence o automático. Uma
 * ponte que marcasse falta sem enxergar o check-in poderia marcar como ausente um
 * FILHOt que está deitado na sala. Cobrar quem tem o app na mão custa uma mensagem
 * e não estraga dado nenhum.
 *
 * COMO LIGAR (uma vez só) — igual ao vigiaAlmoco2:
 *   Acionadores (o relógio) -> Adicionar acionador:
 *     Função: vigiaFalta12h
 *     Origem do evento: Baseado no tempo
 *     Tipo: Timer por minuto -> A cada 15 minutos
 *
 * A função só age entre 12h15 e 13h15, de segunda a sexta, e cobra uma vez por dia.
 * ============================================================================== */

var FALTA_HORA_INICIO = '12:15';
var FALTA_HORA_FIM    = '13:15';

function vigiaFalta12h() {
  var agora = new Date();
  var hhmm = Utilities.formatDate(agora, 'America/Sao_Paulo', 'HH:mm');
  if (hhmm < FALTA_HORA_INICIO || hhmm > FALTA_HORA_FIM) return;      // fora da janela
  var diaSemana = Number(Utilities.formatDate(agora, 'America/Sao_Paulo', 'u'));  // 6 = sábado, 7 = domingo
  if (diaSemana === 6 || diaSemana === 7) return;                     // fim de semana não há Day Care
  var dia = Utilities.formatDate(agora, 'America/Sao_Paulo', 'yyyy-MM-dd');

  var token = _fbToken();
  if (!token) return;                                                 // sem token, não inventa

  // Já cobrado hoje? A cobrança tem trava própria — a do fechamento é outra coisa e
  // não pode ser tocada por aqui, senão a ponte "fecharia" um dia que ninguém fechou.
  var jaCobrado = _fbLer('daycare/cobranca-falta/' + dia, token);
  if (jaCobrado) return;

  // O dia foi fechado por alguém? Esta é a única leitura que decide.
  var fechado = _fbLer('daycare/falta-automatica/' + dia, token);
  if (fechado) return;                                                // fechou: nada a cobrar

  var texto = [
    '<b>FALTA DAS 12h — ninguém fechou o dia</b>',
    '',
    'Passou do meio-dia e a falta de hoje não foi fechada: nenhum aparelho abriu o app.',
    '',
    'Abram o app para o dia fechar. Quem não passou pelo check-in de entrada continua em aberto até lá.'
  ].join('\n');

  var r = _mandarTexto(GRUPOS['gestao'], texto);
  // Grava a trava DEPOIS de mandar: se o Telegram falhar, tenta de novo daqui a 15 minutos,
  // ainda dentro da janela — silêncio aqui seria o mesmo defeito que esta função conserta.
  if (r && r.ok) {
    _fbGravar('daycare/cobranca-falta/' + dia, { ts: agora.getTime(), por: 'ponte', hora: hhmm }, token);
  }
}

/** Teste de bancada: roda a verificação ignorando a hora, para ver se está tudo ligado. */
function vigiaFalta12h_TESTE() {
  var token = _fbToken();
  var dia = Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'yyyy-MM-dd');
  var fechado = _fbLer('daycare/falta-automatica/' + dia, token);
  Logger.log('token: ' + (token ? 'ok' : 'FALHOU'));
  Logger.log('App Check: ' + (_appCheckToken() ? 'ok (com prova)' : 'sem token de depuração — seguindo sem'));
  Logger.log('dia: ' + dia + ' · fechamento do dia: ' + JSON.stringify(fechado));
  Logger.log('turma fotografada de manhã: ' + JSON.stringify(_fbLer('daycare/turma/' + dia, token)));
  Logger.log('já cobrado hoje: ' + JSON.stringify(_fbLer('daycare/cobranca-falta/' + dia, token)));
  Logger.log(fechado ? 'Não cobraria: o dia já foi fechado.' : 'Cobraria: ninguém fechou o dia.');
}
