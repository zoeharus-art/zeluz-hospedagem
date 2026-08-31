/* ============================================================================
 * resposta-tutor.js — o LEITOR da resposta do tutor (função pura, sem tela).
 *
 * O pedido (Adriana, 26/ago/2026, dentro do fluxo "DA RESPOSTA DO TUTOR PARA A
 * FICHA" do index.html): a Central Zêluz recebe pelo WhatsApp o questionário
 * respondido inteiro — a resposta da Yume tem quase 2 mil caracteres e responde
 * nove coisas diferentes — e hoje digita cada pedaço à mão na ficha. Este
 * arquivo lê esse texto colado e PROPÕE os campos; quem confirma e aplica é a
 * recepção, na tela (index.html), nunca este arquivo sozinho.
 *
 * Por que fora do index.html: assim como o painel-logica.js, esta função roda
 * sozinha no harness contra texto real, sem precisar de tela, DOM ou banco.
 * Prova-se a leitura ANTES de existir um botão "Colar resposta do tutor".
 *
 * NÃO DUPLICA a lista de perguntas do questionário. Quem já sabe as perguntas
 * — palavra por palavra, com a seção de cada uma e o campo da ficha para onde
 * cada resposta vai — é a função `algPerguntas(p)` de auaulandia/index.html
 * (bloco "DA RESPOSTA DO TUTOR PARA A FICHA", ~linha 18328). Se a pergunta
 * mudar lá, é lá que se conserta — nunca aqui. Este arquivo:
 *   1) Sozinho (sem `perguntas`): classifica cada linha por PALAVRA-CHAVE e
 *      devolve campos estruturados por chave de ficha (numero/unidade/tipo/
 *      mês/ano já calculados) — funciona mesmo sem saber as perguntas.
 *   2) Se o chamador passar `opcoes.perguntas = algPerguntas(pet)` (a lista
 *      REAL, lida na hora, nunca copiada para cá), casa cada pergunta com o
 *      pedaço de resposta correspondente — por CABEÇALHO (bullets dentro da
 *      seção "*ALIMENTAÇÃO*"/"*SAÚDE...*", na ordem das perguntas daquela
 *      seção), por ORDEM (texto sem nenhum cabeçalho, mesma quantidade de
 *      linhas que de perguntas) e por PALAVRA-CHAVE (o que sobrar) — nessa
 *      prioridade. Cada casamento por cabeçalho/ordem é CONFERIDO pela
 *      classificação por palavra-chave antes de valer: se a linha claramente
 *      fala de outra coisa, o casamento por posição cede lugar à palavra-
 *      chave. Nunca aceita a posição cega quando o conteúdo contradiz.
 *
 * O contrato de `perguntas` (o que `algPerguntas(p)` devolve, e é só isso que
 * este arquivo espera — nenhuma outra propriedade é lida):
 *   [{ k:'refeicoes', secao:'*ALIMENTAÇÃO*'|undefined, curta:'...',
 *      campo:'alim_horarios', t:'texto da pergunta' }, ...]
 * `k` é o identificador estável da pergunta (não muda mesmo que o texto dela
 * mude) — é por ele que este arquivo casa pergunta↔resposta. `campo` é a
 * chave REAL da ficha (`daycare/cadastro/<chave>`) — lida na hora, nunca
 * hardcoded aqui, porque foi visto (26/ago) que o campo de uma pergunta pode
 * não ser o que se imagina (ex: a pergunta 'restricao' grava no campo
 * `alergia`, não em `restricao`).
 *
 * Estilo: var/function, ES5. Roda no tablet velho da recepção. Sem class, sem
 * arrow, sem template string, sem Object.assign, sem Array.prototype.find.
 * Como entra no app: <script src="resposta-tutor.js"></script>. As funções
 * ficam globais com prefixo "rt" (Resposta do Tutor), como o "pl" do Painel.
 * ========================================================================== */

/* ------------------------------------------------------------------ básico */

var RT_ACENTOS = {
  'á': 'a', 'à': 'a', 'ã': 'a', 'â': 'a', 'ä': 'a', 'å': 'a',
  'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
  'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
  'ó': 'o', 'ò': 'o', 'õ': 'o', 'ô': 'o', 'ö': 'o',
  'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u',
  'ç': 'c', 'ñ': 'n', 'ý': 'y', 'ÿ': 'y'
};

/* rtNorm — mesma ideia do jsNorm do app / plNorm do painel-logica.js,
   reescrita aqui de propósito: este arquivo não pode depender de nenhum dos
   dois, senão o harness não consegue prová-lo sozinho. Só minúsculo + sem
   acento — pontuação fica, os regexes de classificação sabem lidar com ela. */
function rtNorm(s) {
  var t = (s === null || s === undefined) ? '' : String(s);
  t = t.toLowerCase();
  var out = '', i, c;
  for (i = 0; i < t.length; i++) {
    c = t.charAt(i);
    out += (RT_ACENTOS[c] !== undefined ? RT_ACENTOS[c] : c);
  }
  return out;
}

/* rtLimpo — o que o WhatsApp cola junto e o olho não vê: separador de
   palavra (U+2060), espaço de largura zero, espaço não-quebrável. Para o
   computador não são espaço, então grudam na palavra ao lado e escondem a
   pontuação do bullet. Saem antes de qualquer outra coisa. Também normaliza
   quebra de linha (\r\n / \r → \n) para o split funcionar igual em qualquer
   aparelho que a Central usar para colar. */
function rtLimpo(s) {
  var t = (s === null || s === undefined) ? '' : String(s);
  t = t.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  t = t.replace(/[\u200B-\u200F\u2060-\u2064\uFEFF]/g, '');
  t = t.replace(/[\u00A0\u2007\u202F\u2009\u2002-\u2006]/g, ' ');
  return t;
}

/* rtTiraBullet — tira "*", "-", "•", "–", "—" e numeração solta ("1.", "2)")
   do começo da linha. Sobra só o conteúdo, sem espaço nas pontas. */
function rtTiraBullet(linha) {
  var t = String(linha == null ? '' : linha);
  t = t.replace(/^\s+/, '');
  t = t.replace(/^(?:[*\-•–—]\s*)+/, '');
  t = t.replace(/^\d{1,2}[.)]\s*/, '');
  t = t.replace(/^\s+|\s+$/g, '');
  return t;
}

/* rtEhCabecalho — título de seção colado de volta pelo tutor ("Alimentação",
   "Saúde, rotina e comportamento"). Não é conteúdo — nem vira campo, nem
   vira `naoEntendi`. Comparação tolera acento, maiúscula e pontuação (":" ,
   ","), porque é exatamente isso que varia de um WhatsApp para outro. */
function rtEhCabecalho(semBullet) {
  var n = rtNorm(semBullet).replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ');
  n = n.replace(/^\s+|\s+$/g, '');
  if (n === 'alimentacao') return true;
  if (n.indexOf('saude') !== -1 && n.indexOf('comportamento') !== -1) return true;
  return false;
}

/* rtSecaoDoCabecalho — a que seção pertence um título ('alimentacao' ou
   'saude'), tanto para a linha do texto do tutor quanto para o `secao` de
   uma pergunta vinda de `algPerguntas` (que chega como '*ALIMENTAÇÃO*'). ''
   quando não reconhece — nunca inventa seção. */
function rtSecaoDoCabecalho(txt) {
  var n = rtNorm(String(txt == null ? '' : txt)).replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
  if (n.indexOf('alimenta') !== -1) return 'alimentacao';
  if (n.indexOf('saude') !== -1) return 'saude';
  return '';
}

function rtEhNenhuma(n) {
  return /\bnenhum/.test(n) || /\bsem\b/.test(n) || /\bnao\s*(ha|tem|possui)\b/.test(n);
}

/* ----------------------------------------------------- data (sem depender de nada) */

function rtPad2(n) { n = String(n); return n.length < 2 ? ('0' + n) : n; }

function rtDiaUTC(iso) {
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  var p = iso.split('-');
  return Date.UTC(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
}
function rtISODeUTC(ms) {
  var d = new Date(ms);
  return d.getUTCFullYear() + '-' + rtPad2(d.getUTCMonth() + 1) + '-' + rtPad2(d.getUTCDate());
}
/* rtSomaDias — mesma conta do `addDiasISO` do app (prazo de prevenção =
   última vez + N dias), reescrita aqui para não depender do index.html. */
function rtSomaDias(iso, dias) {
  var ms = rtDiaUTC(iso);
  if (ms === null) return '';
  return rtISODeUTC(ms + dias * 86400000);
}

/* rtHojeAnoMes — 'hoje' vem de `opcoes.hoje` (ISO, para o harness ser
   determinístico) ou do relógio real do aparelho. */
function rtHojeAnoMes(hojeISO) {
  if (typeof hojeISO === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(hojeISO)) {
    var p = hojeISO.split('-');
    return { ano: parseInt(p[0], 10), mes: parseInt(p[1], 10) };
  }
  var d = new Date();
  return { ano: d.getFullYear(), mes: d.getMonth() + 1 };
}

/* rtInferAno — "em janeiro" sem dizer o ano: se o mês já passou (ou é o mês
   atual) dentro do ano corrente, foi ESTE ano; se ainda não chegou, só pode
   ter sido no ano passado (ninguém relata um check-up que ainda vai
   acontecer como "o último"). */
function rtInferAno(mes, hojeISO) {
  var h = rtHojeAnoMes(hojeISO);
  return (mes <= h.mes) ? h.ano : (h.ano - 1);
}

var RT_MESES_NOMES = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
var RT_MESES_ABREV = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/* rtExtraiMes — acha o nome (ou abreviação, com fronteira de palavra — "mar"
   não casa dentro de "marca") de um mês no texto já normalizado. null se não
   achar: mês incerto não vira palpite. */
function rtExtraiMes(n) {
  var i;
  for (i = 0; i < RT_MESES_NOMES.length; i++) {
    if (n.indexOf(RT_MESES_NOMES[i]) !== -1) return { mes: i + 1, nome: RT_MESES_NOMES[i] };
  }
  for (i = 0; i < RT_MESES_ABREV.length; i++) {
    if (new RegExp('\\b' + RT_MESES_ABREV[i] + '\\b').test(n)) return { mes: i + 1, nome: RT_MESES_ABREV[i] };
  }
  return null;
}

/* ------------------------------------------------------- classificação por linha */

var RT_QTD_REGEX = /(\d+(?:[.,]\d+)?)\s*(gramas?|grs?|g)\b/;
var RT_XIC_REGEX = /(\d+(?:[.,]\d+)?)?\s*(xicaras?|copos?|colheres?|colher)\b/;
var RT_REF_REGEX = /(\d+)\s*x?\s*(?:vezes\s*)?por\s*dia/;
var RT_REF_REGEX2 = /(\d+)\s*vezes\s*ao\s*dia/;

/* rtClassificar — a QUE ASSUNTO uma linha pertence, pela palavra que só
   aparece ali. Ordem importa: dos sinais mais específicos (microchip, um
   número de 15 dígitos não confunde com nada) para os mais genéricos (a
   marca da ração, que só sobra quando nada mais bateu). "restricao" só
   conta se a linha NÃO fala de atividade nem de enriquecimento — senão
   "liberada... sem restrição nenhuma" (atividade) roubaria o campo da
   restrição alimentar. Devolve null quando não reconhece nada — a linha
   vira `naoEntendi`, nunca é descartada. */
function rtClassificar(n) {
  if (/micro\s*-?\s*chip/.test(n) || /\bchip\b/.test(n)) return 'microchip';
  if (/check[\s-]?up/.test(n)) return 'checkup';
  if (/mudan/.test(n) && /recente/.test(n)) return 'mudancaRecente';
  if (/atacad|\bmedo\b|receio|agress|trauma|mordeu|\bmorde\b|\bbrig/.test(n)) return 'comportamentoMedos';
  if (/ativ[a-z]*\s*fisic/.test(n) || /liberad/.test(n)) return 'atividade';
  if (/restri/.test(n) && !/ativ/.test(n) && !/enriquec/.test(n)) return 'restricao';
  if (RT_QTD_REGEX.test(n) || RT_XIC_REGEX.test(n)) return 'quantidade';
  if (RT_REF_REGEX.test(n) || RT_REF_REGEX2.test(n)) return 'refeicoes';
  if (/racao/.test(n) || /\balimento\b/.test(n)) return 'racao';
  return null;
}

/* Momentos do dia citados, sempre devolvidos na ordem cronológica do dia
   (não na ordem em que apareceram no texto — é mais útil assim para quem lê
   a ficha depois). */
function rtMomentos(n) {
  var TOKENS = ['manha', 'tarde', 'noite', 'madrugada', 'cafe', 'almoco', 'jantar'];
  var out = [], i;
  for (i = 0; i < TOKENS.length; i++) if (n.indexOf(TOKENS[i]) !== -1) out.push(TOKENS[i]);
  return out;
}

function rtParseRefeicoes(rawLinha, n) {
  var m = n.match(RT_REF_REGEX) || n.match(RT_REF_REGEX2);
  var vezes = m ? parseInt(m[1], 10) : null;
  return { vezes: vezes, horarios: rtMomentos(n), texto: rawLinha };
}

/* "Ração seca, ND Prime Frango e Romã" -> tipo pela palavra-chave (seca /
   úmida / natural), marca pelo que vem depois da primeira vírgula. Sem
   vírgula, marca fica vazia e o texto inteiro sobra em `texto` — nada se
   perde mesmo quando a heurística não separa direito. */
function rtParseRacao(rawLinha, n) {
  var tipo = '';
  if (/seca/.test(n)) tipo = 'Ração seca';
  else if (/umida/.test(n) && /racao/.test(n)) tipo = 'Ração úmida';
  else if (/natural/.test(n) && /racao/.test(n)) tipo = 'Ração + natural';
  else if (/natural/.test(n)) tipo = 'Comida natural';
  var marca = '';
  var partes = rawLinha.split(',');
  if (partes.length > 1) {
    marca = partes.slice(1).join(',').replace(/^\s+|\s+$/g, '');
    if (!tipo) tipo = partes[0].replace(/^\s+|\s+$/g, '');
  }
  return { tipo: tipo, marca: marca, texto: rawLinha };
}

/* "70g" -> numero=70, unidade='g' (aceita "70 g", "70gr", "70 gramas").
   "1 xícara" não é grama — fica numero+unidade em 'xicara' mesmo assim (é
   estruturado, só não é métrico); se nada bater, numero fica null e o valor
   inteiro continua disponível em `texto` — a instrução manda aceitar como
   texto quando não for grama, e é isso que sobra aqui. */
function rtParseQuantidade(rawLinha, n) {
  var m = n.match(RT_QTD_REGEX);
  if (m) return { numero: parseFloat(m[1].replace(',', '.')), unidade: 'g', texto: rawLinha };
  m = n.match(RT_XIC_REGEX);
  if (m) {
    var unidade = m[2].replace(/s$/, '');
    var numero = m[1] ? parseFloat(m[1].replace(',', '.')) : null;
    return { numero: numero, unidade: unidade, texto: rawLinha };
  }
  return { numero: null, unidade: null, texto: rawLinha };
}

function rtParseAtividade(rawLinha, n) {
  var liberada = /liberad/.test(n);
  return { liberada: liberada, restricoes: liberada ? '' : rawLinha, texto: rawLinha };
}

function rtParseRestricao(rawLinha, n) {
  return { nenhuma: rtEhNenhuma(n), texto: rawLinha };
}

/* Primeiro número "comprido" da linha, sem separador. Microchip Zêluz é de
   15 dígitos (padrão ISO 11784/11785) — outra contagem não é inválida por
   si (pode ser chip antigo/importado), mas vira aviso para a recepção
   conferir com o tutor antes de gravar. */
function rtParseMicrochip(rawLinha) {
  var m = rawLinha.match(/\d[\d .\-]*\d|\d/);
  var digitos = m ? m[0].replace(/\D/g, '') : '';
  return { numero: digitos, valido: (digitos.length === 15), texto: rawLinha };
}

function rtParseCheckup(rawLinha, n, hojeISO) {
  var info = rtExtraiMes(n);
  if (!info) return { valor: '', mes: null, ano: null, inferido: false, texto: rawLinha };
  var ano = rtInferAno(info.mes, hojeISO);
  return { valor: ano + '-' + rtPad2(info.mes) + '-01', mes: info.mes, ano: ano, inferido: true, texto: rawLinha };
}

/* ---------------------------------------------------- montagem de `campos` */

/* rtDefinirCampo — a chave da ficha guarda o PRIMEIRO achado estruturado;
   se outra linha cair na mesma chave, só o texto se soma (com " · "), pra
   não perder o que o tutor escreveu em nenhuma das duas. */
function rtDefinirCampo(campos, chave, novo) {
  if (!campos[chave]) { campos[chave] = novo; return; }
  var existente = campos[chave];
  if (novo.texto && existente.texto && existente.texto.indexOf(novo.texto) === -1) {
    existente.texto = existente.texto + ' · ' + novo.texto;
  }
}

/* Mudança recente e comportamento/medo são DUAS perguntas do questionário
   (algPerguntas: 'comportamento' e 'estresse'), mas gravam na MESMA chave
   de ficha (`manias`) — é lá que a ficha mostra o alerta amarelo hoje. Por
   isso ficam juntas aqui dentro de `campos.manias`, cada uma no seu
   subcampo, e o texto final da ficha é a junção das duas. `alerta` sobe
   para o nível de cima porque é o que a tela de EA e a plantonista
   precisam enxergar de cara — sem abrir nada. */
function rtDefinirManias(campos, subtipo, dado) {
  if (!campos.manias) {
    campos.manias = { chaveFicha: 'manias', mudancaRecente: null, comportamentoMedos: null, alerta: false, texto: '' };
  }
  campos.manias[subtipo] = dado;
  var partes = [];
  if (campos.manias.mudancaRecente && campos.manias.mudancaRecente.texto) partes.push(campos.manias.mudancaRecente.texto);
  if (campos.manias.comportamentoMedos && campos.manias.comportamentoMedos.texto) partes.push(campos.manias.comportamentoMedos.texto);
  campos.manias.texto = partes.join(' · ');
  campos.manias.alerta = !!(campos.manias.comportamentoMedos && campos.manias.comportamentoMedos.alerta);
}

/* Concept (o que rtClassificar devolve) -> chave real da ficha, para montar
   `campos`. checkup vira DOIS campos (a data e o prazo de 365 dias), do
   mesmo jeito que a tela de Prevenção já calcula pra vacina/vermífugo. */
var RT_CONCEITO_PARA_CHAVE = {
  refeicoes: 'alim_horarios',
  racao: 'alim_racao_marca',
  quantidade: 'alim_racao_qtd',
  restricao: 'restricao',
  atividade: 'ea_restr',
  microchip: 'microchip'
};

/* -------------------------------------- casamento pergunta -> resposta */

/* k da pergunta (estável, de algPerguntas) -> concept (o que rtClassificar
   devolve). É o único lugar onde este arquivo "conhece" os `k` do
   questionário — não é a pergunta em si (isso quem sabe é algPerguntas),
   é só o rótulo curto e estável que ela usa para se identificar. */
var RT_K_PARA_CONCEITO = {
  refeicoes: 'refeicoes',
  marca: 'racao',
  quanto: 'quantidade',
  restricao: 'restricao',
  atividade: 'atividade',
  checkup: 'checkup',
  chip: 'microchip',
  comportamento: 'mudancaRecente',
  estresse: 'comportamentoMedos'
  /* 'cio' não tem concept próprio: não há palavra-chave confiável só dela
     (a data do cio é livre demais) — fica só para casamento por cabeçalho
     ou por ordem; sem os dois, some para `naoEntendi`. */
};

/* rtConfereOuAlternativa — um casamento por posição (cabeçalho ou ordem) só
   vale se o CONTEÚDO da linha não contradiz a pergunta esperada, E se essa
   linha ainda não foi entregue para outra pergunta. Se a classificação por
   palavra-chave da própria linha aponta para outro assunto (ou a linha já
   foi usada), a posição cede — e se houver uma linha de sobra já
   classificada para o assunto certo (ainda não usada por ninguém), essa é
   que entra no lugar. Nunca aceita posição cega contra conteúdo claro; é
   isso que deixa o casamento por ordem se corrigir sozinho quando a
   sequência real não é a esperada (ver a prova "fora de ordem"): cada
   posição errada empurra a resposta certa para o lugar certo, uma a uma. */
function rtConfereOuAlternativa(linhaObj, kPergunta, porConceito, usadas, viaPrimaria) {
  var esperado = RT_K_PARA_CONCEITO[kPergunta];
  var real = rtClassificar(rtNorm(linhaObj.texto));
  var casaAqui = (!esperado || real === null || real === esperado);
  if (casaAqui && !usadas[linhaObj.id]) {
    usadas[linhaObj.id] = true;
    return { texto: linhaObj.texto, concept: real, via: viaPrimaria };
  }
  if (!esperado) return null; /* sem concept esperado (ex: 'cio') e a linha já foi para outra pergunta */
  var lista = porConceito[esperado] || [];
  var i;
  for (i = 0; i < lista.length; i++) {
    if (!usadas[lista[i].id]) { usadas[lista[i].id] = true; return { texto: lista[i].texto, concept: esperado, via: 'palavra-chave' }; }
  }
  return null; /* posição contradiz e não há alternativa por palavra-chave sobrando: sem resposta confiável */
}

/* ---------------------------------------------------------------- rtLerResposta */

/* rtLerResposta(texto, opcoes) -> {campos, naoEntendi, avisos, respostas,
 * perguntasSemResposta}
 *
 * opcoes.hoje       — 'AAAA-MM-DD' para o cálculo do check-up ser
 *                      determinístico (harness); sem isso usa o relógio real.
 * opcoes.perguntas  — a lista de algPerguntas(pet) (ver cabeçalho do
 *                      arquivo). Sem ela, só `campos` sai preenchido —
 *                      `respostas` fica {} e `perguntasSemResposta` fica [].
 */
function rtLerResposta(texto, opcoes) {
  var op = opcoes || {};
  var hojeISO = (typeof op.hoje === 'string') ? op.hoje : null;
  var campos = {};
  var naoEntendi = [];
  var avisos = [];
  var respostas = {};
  var perguntasSemResposta = [];

  var bruto = (texto === null || texto === undefined) ? '' : String(texto);
  var limpo = rtLimpo(bruto);
  if (!limpo.replace(/\s+/g, '').length) {
    avisos.push('resposta vazia — nada para ler');
    return { campos: campos, naoEntendi: naoEntendi, avisos: avisos, respostas: respostas, perguntasSemResposta: perguntasSemResposta };
  }

  var linhasBrutas = limpo.split('\n');
  var i, linhaCrua, semBullet, n, tipo, idSeq = 0;

  var secaoAtual = '';
  var headersVistos = { alimentacao: false, saude: false };
  var linhasComSecao = [];      /* [{id, texto, secao, concept}] — TODO conteúdo, na ordem do texto */
  var linhasPorSecao = { alimentacao: [], saude: [], '': [] };
  var porConceito = {};         /* {concept: [{id, texto}]} — para o casamento por palavra-chave */

  for (i = 0; i < linhasBrutas.length; i++) {
    linhaCrua = linhasBrutas[i];
    semBullet = rtTiraBullet(linhaCrua);
    if (!semBullet) continue; /* linha vazia: ignora, sem virar aviso nem naoEntendi */
    if (rtEhCabecalho(semBullet)) {
      var sec = rtSecaoDoCabecalho(semBullet);
      if (sec) { secaoAtual = sec; headersVistos[sec] = true; }
      continue; /* título de seção não é conteúdo */
    }

    n = rtNorm(semBullet);
    tipo = rtClassificar(n);
    idSeq++;
    var item = { id: idSeq, texto: semBullet, secao: secaoAtual, concept: tipo };
    linhasComSecao.push(item);
    linhasPorSecao[secaoAtual || ''].push(item);
    if (tipo) {
      if (!porConceito[tipo]) porConceito[tipo] = [];
      porConceito[tipo].push(item);
    }

    /* -------- campos estruturados por chave de ficha (sempre roda) -------- */
    if (tipo === 'microchip') {
      var dm = rtParseMicrochip(semBullet);
      rtDefinirCampo(campos, RT_CONCEITO_PARA_CHAVE.microchip, dm);
      if (!dm.valido) {
        avisos.push(dm.numero
          ? ('microchip com ' + dm.numero.length + ' dígito(s) (esperado 15) — confirmar com o tutor')
          : 'microchip mencionado sem número — perguntar ao tutor');
      }
    } else if (tipo === 'checkup') {
      var dc = rtParseCheckup(semBullet, n, hojeISO);
      rtDefinirCampo(campos, 'checkup_t', dc);
      if (dc.valor) campos.checkup_p = { valor: rtSomaDias(dc.valor, 365), inferido: true };
      else avisos.push('checkup: mês não identificado no texto — ficou só como observação');
    } else if (tipo === 'mudancaRecente') {
      rtDefinirManias(campos, 'mudancaRecente', { texto: semBullet, nenhuma: rtEhNenhuma(n) });
    } else if (tipo === 'comportamentoMedos') {
      rtDefinirManias(campos, 'comportamentoMedos', { texto: semBullet, alerta: true });
    } else if (tipo === 'atividade') {
      rtDefinirCampo(campos, RT_CONCEITO_PARA_CHAVE.atividade, rtParseAtividade(semBullet, n));
    } else if (tipo === 'restricao') {
      rtDefinirCampo(campos, RT_CONCEITO_PARA_CHAVE.restricao, rtParseRestricao(semBullet, n));
    } else if (tipo === 'quantidade') {
      rtDefinirCampo(campos, RT_CONCEITO_PARA_CHAVE.quantidade, rtParseQuantidade(semBullet, n));
    } else if (tipo === 'refeicoes') {
      rtDefinirCampo(campos, RT_CONCEITO_PARA_CHAVE.refeicoes, rtParseRefeicoes(semBullet, n));
    } else if (tipo === 'racao') {
      rtDefinirCampo(campos, RT_CONCEITO_PARA_CHAVE.racao, rtParseRacao(semBullet, n));
    } else {
      naoEntendi.push(semBullet);
    }
  }

  /* -------------------------- casamento pergunta -> resposta (opcional) -------------------------- */
  var perguntas = (Object.prototype.toString.call(op.perguntas) === '[object Array]') ? op.perguntas : [];
  if (perguntas.length) {
    var usadas = {}; /* id de linha já usada por uma resposta — não reaproveita entre perguntas */
    var secaoDaPergunta = '', j, q, resolvida;

    /* -------- 1) por cabeçalho: agrupa as perguntas por seção (herdando a
       seção da pergunta anterior quando ela não repete o `secao`, do jeito
       que algPerguntas monta a lista) e casa 1-a-1 com as linhas que caíram
       sob aquele título — só quando a QUANTIDADE bate exatamente. Contagem
       diferente é sinal de que a pessoa pulou ou juntou perguntas: aí não
       se adivinha por posição, cai para as próximas etapas. -------- */
    var gruposPorSecao = {};       /* secao: [pergunta,...] na ordem do questionário */
    var ordemSecoes = [];
    secaoDaPergunta = '';
    for (j = 0; j < perguntas.length; j++) {
      q = perguntas[j] || {};
      if (q.secao) secaoDaPergunta = rtSecaoDoCabecalho(q.secao);
      var sk = secaoDaPergunta || '';
      if (!gruposPorSecao[sk]) { gruposPorSecao[sk] = []; ordemSecoes.push(sk); }
      gruposPorSecao[sk].push(q);
    }
    for (j = 0; j < ordemSecoes.length; j++) {
      var sk2 = ordemSecoes[j];
      if (!sk2 || !headersVistos[sk2]) continue; /* sem cabeçalho visto no texto: não casa por posição aqui */
      var linhasDaSecao = linhasPorSecao[sk2] || [];
      var perguntasDaSecao = gruposPorSecao[sk2];
      if (linhasDaSecao.length !== perguntasDaSecao.length) continue;
      var pi;
      for (pi = 0; pi < perguntasDaSecao.length; pi++) {
        if (respostas[perguntasDaSecao[pi].k]) continue;
        resolvida = rtConfereOuAlternativa(linhasDaSecao[pi], perguntasDaSecao[pi].k, porConceito, usadas, 'cabecalho');
        if (resolvida) {
          respostas[perguntasDaSecao[pi].k] = { campo: perguntasDaSecao[pi].campo, texto: resolvida.texto, via: resolvida.via, alerta: (resolvida.concept === 'comportamentoMedos') };
        }
      }
    }

    /* -------- 2) por ordem: só quando o texto NÃO tem nenhum cabeçalho e a
       quantidade de linhas bate com a quantidade de perguntas — aí sim dá
       para supor que a ordem das respostas segue a ordem das perguntas.
       Cada casamento ainda passa pela conferência de conteúdo, e se a
       posição i não bater com o assunto esperado, a função busca a linha
       CERTA (por palavra-chave) entre as que ainda sobraram — é assim que
       este passo sobrevive a um texto fora de ordem mesmo sem cabeçalho. */
    if (!headersVistos.alimentacao && !headersVistos.saude && linhasComSecao.length === perguntas.length) {
      for (j = 0; j < perguntas.length; j++) {
        q = perguntas[j] || {};
        if (respostas[q.k]) continue;
        resolvida = rtConfereOuAlternativa(linhasComSecao[j], q.k, porConceito, usadas, 'ordem');
        if (resolvida) {
          respostas[q.k] = { campo: q.campo, texto: resolvida.texto, via: resolvida.via, alerta: (resolvida.concept === 'comportamentoMedos') };
        }
      }
    }

    /* -------- 3) por palavra-chave: o que sobrou, resolvido só pelo
       assunto da linha — sem olhar posição nenhuma. -------- */
    for (j = 0; j < perguntas.length; j++) {
      q = perguntas[j] || {};
      if (respostas[q.k]) continue;
      var concept = RT_K_PARA_CONCEITO[q.k];
      var candidatos = concept ? (porConceito[concept] || []) : [];
      var achou = null, ci;
      for (ci = 0; ci < candidatos.length; ci++) {
        if (!usadas[candidatos[ci].id]) { achou = candidatos[ci]; break; }
      }
      if (achou) {
        usadas[achou.id] = true;
        respostas[q.k] = { campo: q.campo, texto: achou.texto, via: 'palavra-chave', alerta: (concept === 'comportamentoMedos') };
      } else {
        perguntasSemResposta.push(q.k);
      }
    }
  }

  return { campos: campos, naoEntendi: naoEntendi, avisos: avisos, respostas: respostas, perguntasSemResposta: perguntasSemResposta };
}

/* --------------------------------------------------------------------- glue */
if (typeof window !== 'undefined') {
  window.rtLerResposta = rtLerResposta;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { rtLerResposta: rtLerResposta };
}
