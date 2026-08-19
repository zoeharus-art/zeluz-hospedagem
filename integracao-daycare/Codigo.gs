/**
 * ZÊLUZ · Day Care — ponte entre o APP e a planilha que alimenta o dashboard da TV
 * ============================================================================
 * Versão 1 (19/ago/2026)
 *
 * PARA QUE SERVE
 * A recepção parou de digitar na planilha: agora ela lança tudo no app do Day Care
 * (banho, veterinário, reposição, avulso, quem sai cedo, vermífugo, carrapaticida,
 * troca de coleira, hidratação, avaliação, adaptação, faltas avisadas…). Esta ponte
 * é quem leva o que foi lançado até a planilha — que continua sendo o que dá vida ao
 * dashboard https://zoeharus-art.github.io/dashboard-daycare1-zeluz/
 *
 * A planilha vira um ESPELHO: ninguém escreve nela à mão, mas ela continua ali. Se um
 * dia a ponte cair, dá para escrever à mão como antes e nada para.
 *
 * ============================================================================
 * COMO PUBLICAR (passo a passo, uma vez só)
 * ============================================================================
 * 1. Abra a planilha do Day Care no navegador (a mesma que o dashboard lê).
 * 2. Menu  Extensões → Apps Script.
 * 3. Apague o que estiver lá e cole TODO este arquivo.
 * 4. Na linha do TOKEN (logo abaixo), troque por uma senha sua — qualquer texto que
 *    ninguém adivinhe. É ela que impede um estranho de escrever na planilha.
 * 5. Salve (o disquete).
 * 6. Implantar → Nova implantação → engrenagem → App da Web.
 *      Executar como:  Eu
 *      Quem pode acessar:  Qualquer pessoa
 *    → Implantar. Autorize quando ele pedir (é a sua conta acessando a sua planilha).
 * 7. Copie a URL que termina em /exec e cole no app:
 *      Day Care → Dashboard Day Care → Ponte com a planilha  (URL + o token do passo 4)
 *
 * QUANDO MUDAR ESTE ARQUIVO: salvar NÃO publica. É preciso
 *   Implantar → Gerenciar implantações → lápis → Nova versão → Implantar.
 * ============================================================================
 */

var TOKEN = 'COLE_AQUI_UMA_SENHA_SUA';

/** Os rótulos EXATOS das colunas, como estão na planilha — inclusive onde há erro de
 *  digitação. O dashboard procura por estes nomes; mudar um acento aqui apaga o bloco
 *  dele na TV. Se um dia forem corrigidos na planilha, corrija junto aqui. */
var COL = {
  data:            'Data',
  hospRestricao:   'Hóspedes com Restrições',
  vet:             'Veterinário',
  vetHora:         'Hora Veterinário',
  banho:           'Banho',
  banhoHora:       'Hora Banho',
  aniversariante:  'AUniversariante',
  vermifugo:       'Vermifugo',
  carrapaticida:   'Carrapaticida',
  adaptacao:       'Adaptação',
  avulso:          'Avulso',
  faltas:          'Faltas Avisadas',
  clienteNovo:     'Cliente Novo',
  aulunos:         'Aulunos',
  hidratacao:      'Hidratação patinha e Focinho',
  reposicao:       'Reposição',
  avaliacao:       'Avaliação',
  avaliacaoHora:   'Horário',
  coleira:         'Troca de Coleira',
  saiCedo:         'Peludinho que sairá cedo',
  saiCedoHora:     'Hora Saída Cedo',
  festa:           'Festa na Zêluz - Auniversário)',
  auluRestricao:   'Aulunos com restriçóes'
};

/** As duas colunas que a Adriana criou em junho e faltam nos outros meses. Os nomes
 *  são copiados dali TAL E QUAL, com a grafia que está lá — é o que o dashboard lê. */
var COLUNAS_NOVAS = [COL.festa, COL.auluRestricao];

var MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
             'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

// ===========================================================================
// ENTRADA
// ===========================================================================
function doPost(e) {
  try {
    var d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (String(d.token || '') !== TOKEN) return _json({ ok: false, erro: 'token invalido' });
    var acao = String(d.acao || 'lancar');
    if (acao === 'garantirColunas') return _json(garantirColunas());
    if (acao === 'lancar')          return _json(lancar(d));
    if (acao === 'remover')         return _json(remover(d));
    if (acao === 'lerDia')          return _json(lerDia(d));
    return _json({ ok: false, erro: 'acao desconhecida: ' + acao });
  } catch (err) {
    return _json({ ok: false, erro: String(err) });
  }
}

/** Abrir a URL /exec no navegador diz se a ponte está viva e o que ela enxerga. */
function doGet(e) {
  var abas = _abasDayCare().map(function (s) { return s.getName(); });
  return _json({ ok: true, msg: 'ponte do Day Care no ar', abas: abas,
                 colunas_novas_que_eu_crio: COLUNAS_NOVAS });
}

// ===========================================================================
// 1) GARANTIR AS COLUNAS EM TODOS OS MESES
// ===========================================================================
/**
 * A Adriana criou "Festa na Zêluz" e "Aulunos com restrições" só na aba de junho — por
 * isso não apareciam no dashboard em agosto. Isto percorre TODA aba de Day Care e cria
 * o que faltar, no fim da faixa de títulos, sem tocar no que já existe.
 * Roda sozinho a cada lançamento (é barato) e também pode ser chamado à mão.
 */
function garantirColunas() {
  var criadas = [], jaTinha = [];
  _abasDayCare().forEach(function (sh) {
    var tit = _titulos(sh);
    COLUNAS_NOVAS.forEach(function (nome) {
      if (_acharCol(tit, nome) > 0) { jaTinha.push(sh.getName() + ' · ' + nome); return; }
      var col = _primeiraColunaLivre(sh, tit);
      sh.getRange(1, col).setValue(nome);
      criadas.push(sh.getName() + ' · ' + nome + ' (coluna ' + col + ')');
    });
  });
  return { ok: true, criadas: criadas, ja_tinha: jaTinha.length };
}

// ===========================================================================
// 2) LANÇAR / REMOVER
// ===========================================================================
/**
 * lancar({dia:'2026-08-19', coluna:'Reposição', valor:'Hoppy/Spitz', hora:'10:30'})
 *
 * A planilha tem ~50 linhas por dia e cada item ocupa UMA célula da sua coluna, dentro
 * do bloco daquele dia. Então: acha as linhas do dia, procura a primeira célula vazia
 * naquela coluna e escreve ali. Se o mesmo valor já estiver lá, não duplica — lançar
 * duas vezes do app não pode virar dois FILHOts na TV.
 */
function lancar(d) {
  var dia = String(d.dia || '');
  var nomeCol = String(d.coluna || '');
  var valor = String(d.valor || '').trim();
  if (!dia || !nomeCol || !valor) return { ok: false, erro: 'faltou dia, coluna ou valor' };

  var alvo = _abaDoDia(dia);
  if (!alvo.sh) return { ok: false, erro: alvo.erro };
  var sh = alvo.sh, tit = _titulos(sh);

  var cData = _acharCol(tit, COL.data);
  if (!cData) return { ok: false, erro: 'a aba "' + sh.getName() + '" nao tem coluna Data' };
  var cAlvo = _acharCol(tit, nomeCol);
  if (!cAlvo) {
    // Pode ser uma das colunas novas ainda não criada nesta aba: cria e segue.
    if (COLUNAS_NOVAS.indexOf(nomeCol) >= 0) { garantirColunas(); tit = _titulos(sh); cAlvo = _acharCol(tit, nomeCol); }
    if (!cAlvo) return { ok: false, erro: 'a aba "' + sh.getName() + '" nao tem a coluna "' + nomeCol + '"' };
  }
  var cHora = d.colunaHora ? _acharCol(tit, String(d.colunaHora)) : 0;

  var linhas = _linhasDoDia(sh, cData, dia);
  if (!linhas.length) return { ok: false, erro: 'nao achei nenhuma linha de ' + dia + ' na aba ' + sh.getName() };

  // Já está lá? Então não faz nada — e diz que já estava.
  var alvoNorm = _norm(valor);
  for (var i = 0; i < linhas.length; i++) {
    var atual = String(sh.getRange(linhas[i], cAlvo).getValue() || '').trim();
    if (atual && _norm(atual) === alvoNorm) {
      if (cHora && d.hora) sh.getRange(linhas[i], cHora).setValue(String(d.hora));
      return { ok: true, jaEstava: true, linha: linhas[i], aba: sh.getName() };
    }
  }
  // Primeira célula vazia da coluna dentro do dia.
  for (var j = 0; j < linhas.length; j++) {
    var v = String(sh.getRange(linhas[j], cAlvo).getValue() || '').trim();
    if (!v) {
      sh.getRange(linhas[j], cAlvo).setValue(valor);
      if (cHora && d.hora) sh.getRange(linhas[j], cHora).setValue(String(d.hora));
      return { ok: true, linha: linhas[j], aba: sh.getName() };
    }
  }
  // Bloco do dia cheio: acrescenta uma linha logo abaixo da última do dia, com a data.
  var ultima = linhas[linhas.length - 1];
  sh.insertRowAfter(ultima);
  var nova = ultima + 1;
  sh.getRange(nova, cData).setValue(_dataDe(dia));
  sh.getRange(nova, cAlvo).setValue(valor);
  if (cHora && d.hora) sh.getRange(nova, cHora).setValue(String(d.hora));
  return { ok: true, linha: nova, aba: sh.getName(), linhaNova: true };
}

/** Tira o valor da coluna (a recepção desfez o lançamento no app). Limpa a hora junto. */
function remover(d) {
  var dia = String(d.dia || ''), nomeCol = String(d.coluna || ''), valor = String(d.valor || '').trim();
  if (!dia || !nomeCol || !valor) return { ok: false, erro: 'faltou dia, coluna ou valor' };
  var alvo = _abaDoDia(dia);
  if (!alvo.sh) return { ok: false, erro: alvo.erro };
  var sh = alvo.sh, tit = _titulos(sh);
  var cData = _acharCol(tit, COL.data), cAlvo = _acharCol(tit, nomeCol);
  if (!cData || !cAlvo) return { ok: false, erro: 'coluna nao encontrada' };
  var cHora = d.colunaHora ? _acharCol(tit, String(d.colunaHora)) : 0;
  var linhas = _linhasDoDia(sh, cData, dia), tirou = 0;
  var alvoNorm = _norm(valor);
  linhas.forEach(function (l) {
    var atual = String(sh.getRange(l, cAlvo).getValue() || '').trim();
    if (atual && _norm(atual) === alvoNorm) {
      sh.getRange(l, cAlvo).clearContent();
      if (cHora) sh.getRange(l, cHora).clearContent();
      tirou++;
    }
  });
  return { ok: true, removidos: tirou };
}

/** Devolve tudo que está lançado num dia — o app confere se a planilha bate com ele. */
function lerDia(d) {
  var dia = String(d.dia || '');
  var alvo = _abaDoDia(dia);
  if (!alvo.sh) return { ok: false, erro: alvo.erro };
  var sh = alvo.sh, tit = _titulos(sh);
  var cData = _acharCol(tit, COL.data);
  if (!cData) return { ok: false, erro: 'sem coluna Data' };
  var linhas = _linhasDoDia(sh, cData, dia);
  var out = {};
  linhas.forEach(function (l) {
    tit.forEach(function (t, i) {
      if (!t || i + 1 === cData) return;
      var v = String(sh.getRange(l, i + 1).getValue() || '').trim();
      if (!v) return;
      (out[t] = out[t] || []).push(v);
    });
  });
  return { ok: true, aba: sh.getName(), linhas: linhas.length, conteudo: out };
}

// ===========================================================================
// APOIO
// ===========================================================================
function _json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function _norm(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/\s+/g, ' ').trim();
}
/** Todas as abas de Day Care ("2026 DayCare Agosto", "2025 DayCare Março"…). */
function _abasDayCare() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheets().filter(function (s) {
    return _norm(s.getName()).indexOf('daycare') >= 0;
  });
}
function _titulos(sh) {
  var n = sh.getLastColumn();
  if (n < 1) return [];
  return sh.getRange(1, 1, 1, n).getValues()[0].map(function (v) { return String(v || '').trim(); });
}
function _acharCol(titulos, nome) {
  var alvo = _norm(nome);
  for (var i = 0; i < titulos.length; i++) if (_norm(titulos[i]) === alvo) return i + 1;
  return 0;
}
function _primeiraColunaLivre(sh, titulos) {
  for (var i = 0; i < titulos.length; i++) if (!titulos[i]) return i + 1;
  return titulos.length + 1;
}
/** '2026-08-19' → a aba "2026 DayCare Agosto". */
function _abaDoDia(dia) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dia);
  if (!m) return { sh: null, erro: 'data invalida: ' + dia + ' (use AAAA-MM-DD)' };
  var nome = m[1] + ' DayCare ' + MESES[+m[2] - 1];
  var alvo = _norm(nome);
  var achou = _abasDayCare().filter(function (s) { return _norm(s.getName()) === alvo; })[0];
  if (!achou) return { sh: null, erro: 'nao achei a aba "' + nome + '"' };
  return { sh: achou, erro: '' };
}
function _dataDe(dia) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dia);
  return new Date(+m[1], +m[2] - 1, +m[3]);
}
/** Linhas cuja coluna Data é o dia pedido. Aceita data de verdade e texto. */
function _linhasDoDia(sh, cData, dia) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dia);
  var ano = +m[1], mes = +m[2] - 1, d = +m[3];
  var ultima = sh.getLastRow();
  if (ultima < 2) return [];
  var vals = sh.getRange(2, cData, ultima - 1, 1).getValues();
  var out = [];
  for (var i = 0; i < vals.length; i++) {
    var v = vals[i][0];
    if (v instanceof Date) {
      if (v.getFullYear() === ano && v.getMonth() === mes && v.getDate() === d) out.push(i + 2);
    } else if (v) {
      var t = String(v).trim();
      var mm = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(t);
      if (mm && +mm[1] === d && +mm[2] === mes + 1 && +mm[3] === ano) out.push(i + 2);
      else if (t === dia) out.push(i + 2);
    }
  }
  return out;
}
