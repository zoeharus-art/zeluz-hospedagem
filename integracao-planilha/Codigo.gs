/**
 * ZÊLUZ · AuAulândia — ponte entre o app e a planilha de Hospedagem
 *
 * Versão 6 (10/out/2026, Story 6.68) — a linha do dinheiro acompanha a reserva fechada.
 *                          · acao 'atualizar': acha a linha VIVA pelo nome antigo
 *                            (peludoTutorAntes, ou peludoTutor) e pela entrada antiga
 *                            (entradaAntes), atualiza as colunas pelo nome, poe a nota de
 *                            quem alterou e acerta o calendario no mesmo pedido (libera o
 *                            periodo antigo, a nao ser com naoLiberar, e marca o novo).
 *                            Sem linha viva: responde 'NAO ACHEI…' e NAO cria linha nova —
 *                            quem decide lancar e o app.
 *                          · acao 'cancelar' aceita 'marca' (CANCELADO, ANULADO, VOLTOU PARA
 *                            PENDENTE, ALTERADA); sem marca, CANCELADO, como sempre. O
 *                            reenvio de um cancelamento responde 'ja estava cancelada'.
 *                          · toda resposta (doGet e doPost) traz 'versao': e por ela que o app
 *                            sabe se pode mandar 'atualizar' (a versao 5 trataria uma acao que
 *                            nao conhece como gravar).
 *                          Os pedidos de antes (sem acao, 'calendario' e 'cancelar' sem marca)
 *                          dao a mesma linha, a mesma coluna e a mesma resposta (mais a versao).
 *                          2a rodada (11/out/2026, gate do QA): o 'atualizar' escreve a linha
 *                          inteira de uma vez (nunca pela metade), confere ANTES se as datas
 *                          novas cabem no calendario (sem coluna livre, nada muda), so mexe no
 *                          calendario com a linha do dinheiro atualizada, e responde ok:false
 *                          sempre que a linha nao foi atualizada ('NAO ACHEI', 'ERRO', aba
 *                          sumida, calendario cheio).
 * Versão 5 (29/ago/2026) — a palavra-chave da ponte (TOKEN) saiu do código e passou a
 *                          morar só nas Propriedades do script, na propriedade PONTE_SENHA.
 *                          Antes ela era um texto fixo e curto, escrito neste
 *                          arquivo — que é um repositório PÚBLICO no GitHub — e qualquer
 *                          pessoa que o lesse ganhava escrita livre na planilha do financeiro
 *                          da Hospedagem (auditoria 28/ago/2026, achados 8 e 9). Sem a
 *                          propriedade configurada, a ponte RECUSA TUDO — nunca abre a porta
 *                          por padrão — e diz isso no log. Ver _ponteSenha() logo abaixo e
 *                          docs/auditoria-28ago2026/06-pontes-e-pin.md.
 * Versão 4 (13/ago/2026) — as duas abas são COISAS DIFERENTES.
 *
 * O QUE EU TINHA ENTENDIDO ERRADO
 * Achei que as duas abas fossem tabelas iguais e mandei uma linha nova para as
 * duas. A aba "Hospedagem" é mesmo uma tabela (uma linha por hospedagem). Mas a
 * "Calendário Hospedagem para dash" é um CALENDÁRIO: uma linha por DIA, e as
 * colunas são "Hospede 1", "Hospede 2"... até 40. Cada célula guarda o nome de
 * quem estava aqui naquele dia.
 *
 * Ao dar appendRow nela, criei uma linha solta no fim com data 31/12/1899 — e o
 * Looker Studio quebrou. Agora cada aba é tratada do jeito dela:
 *
 *   · Hospedagem  → uma linha nova, com cada valor na coluna certa PELO NOME.
 *   · Calendário  → o nome do FILHOt entra em CADA DIA da estadia, na primeira
 *                   coluna livre daquele dia. É isso que faz o dashboard contar
 *                   quantos hóspedes há por noite (e quantas plantonistas).
 *
 * Nunca cria linha nova no calendário: se o dia não existir, avisa.
 */

/* ---------------------------------------------------------------------------
 * PONTE_SENHA — a palavra-chave que autoriza o app a falar com esta ponte.
 *
 * NUNCA fica escrita neste arquivo (o repositório é público). Mora só nas
 * Propriedades do script: Configurações do projeto (a engrenagem, à esquerda) →
 * Propriedades do script → Adicionar propriedade do script → nome PONTE_SENHA,
 * valor a nova palavra-chave (uma string longa e aleatória, a mesma que vai ser
 * colada em Orçamentos → Ponte com a planilha, no app).
 *
 * Sem a propriedade, esta função devolve '' — e doPost() recusa TODO pedido,
 * mesmo sem 'token' nenhum vindo no corpo. O silêncio nunca pode ter dois
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

var ABA_FINANCEIRO = 'Hospedagem';
var ABA_DASHBOARD  = 'Calendário Hospedagem para dash';

/** O numero que o app pergunta (GET) antes de mandar uma acao nova. Subiu para 6 com o 'atualizar'. */
var VERSAO_PONTE = 6;

/** As palavras que riscam uma linha do financeiro. A primeira e a de sempre (sem marca). */
var MARCAS = ['CANCELADO', 'ANULADO', 'VOLTOU PARA PENDENTE', 'ALTERADA'];

/**
 * As NOITES é que contam no calendário: quem entra dia 10 e sai dia 14 dorme aqui
 * nas noites de 10, 11, 12 e 13 — no dia 14 ele vai embora. É essa conta que diz
 * quantas plantonistas são necessárias.
 * Se a casa preencher também o dia da saída, mude para true.
 */
var CONTAR_DIA_DA_SAIDA = false;

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
    var senhaEsperada = _ponteSenha();
    if (!senhaEsperada) {
      Logger.log('PONTE_SENHA não configurada nas Propriedades do script — recusando o pedido.');
      return _resposta({ ok: false, erro: 'PONTE_SENHA não configurada nas Propriedades do script' });
    }
    if (String(d.token || '') !== senhaEsperada) {
      return _resposta({ ok: false, erro: 'token invalido' });
    }
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    // acao 'cancelar' desfaz o que a reserva escreveu: libera as noites no calendario e
    // marca a linha do financeiro como CANCELADA (Adriana, 14/ago/2026). Sem 'acao' o
    // comportamento e o de sempre — gravar a reserva.
    if (String(d.acao || '') === 'cancelar') {
      var rc = { ok: true, financeiro: '', calendario: '' };
      try { rc.calendario = _apagarDoCalendario(ss, d); } catch (c1) { rc.calendario = 'ERRO - ' + String(c1); }
      // soCalendario: o 2o FILHOt em diante so libera a coluna dele. A linha do dinheiro e
      // uma so para a reserva inteira e ja foi riscada no primeiro (Adriana, 17/ago/2026).
      if (!d.soCalendario) {
        try { rc.financeiro = _marcarCancelado(ss, d); } catch (c2) { rc.financeiro = 'ERRO - ' + String(c2); }
      } else { rc.financeiro = '(nao mexe: linha unica da reserva)'; }
      return _resposta(rc);
    }
    // acao 'calendario': grava SO no calendario. E como o 2o, 3o... FILHOt de um mesmo
    // orcamento entra, cada um na sua propria coluna ("cada um fica em uma coluna").
    if (String(d.acao || '') === 'calendario') {
      var rk = { ok: true, financeiro: '(nao mexe: linha unica da reserva)', calendario: '' };
      try { rk.calendario = _gravarCalendario(ss, d); } catch (k1) { rk.calendario = 'ERRO - ' + String(k1); rk.ok = false; }
      return _resposta(rk);
    }
    // acao 'atualizar' (versao 6, Story 6.68): a reserva fechada mudou de datas. A linha VIVA
    // daquele FILHOt muda no lugar (nunca uma segunda linha) e o calendario acompanha no mesmo
    // pedido. Sem linha viva, nada e criado: o app decide se lanca.
    if (String(d.acao || '') === 'atualizar') {
      // 2a rodada: ok so com a linha do dinheiro atualizada e o calendario acertado; senao ok:false e o motivo
      var ra = { ok: false, financeiro: '', calendario: '' };
      var colAntes = -1;
      try { colAntes = _colunaDoNome(ss, d.peludoTutorAntes || d.peludoTutor, d.entradaAntes, d.saidaAntes); } catch (a0) { colAntes = -1; }
      // as datas novas cabem no calendario? Confere ANTES de mexer em qualquer coisa (sem coluna livre, nada muda)
      var cabe = '';
      try { cabe = _calendarioCabe(ss, d, colAntes); } catch (a4) { cabe = 'ERRO - ' + String(a4); }
      if (cabe) {
        ra.financeiro = '(nao mexe: o calendario nao comporta as datas novas)';
        ra.calendario = cabe;
        return _resposta(ra);
      }
      try { ra.financeiro = _atualizarLinha(ss, d); } catch (a1) { ra.financeiro = 'ERRO - ' + String(a1); }
      if (!/^linha \d+ atualizada/.test(ra.financeiro)) {
        ra.calendario = '(nao mexe: a linha do dinheiro nao foi atualizada)';
        return _resposta(ra);
      }
      var partes = [];
      if (d.naoLiberar) partes.push('noites antigas mantidas (outra reserva viva)');
      else {
        try { partes.push(_apagarDoCalendario(ss, { peludoTutor: d.peludoTutorAntes || d.peludoTutor, entrada: d.entradaAntes, saida: d.saidaAntes })); }
        catch (a2) { partes.push('ERRO - ' + String(a2)); }
      }
      try { partes.push(_gravarCalendario(ss, d, colAntes)); } catch (a3) { partes.push('ERRO - ' + String(a3)); }
      ra.calendario = partes.join('; ');
      ra.ok = !/ERRO|SEM COLUNA|NENHUMA das datas|NAO ACHEI|ABA NAO ENCONTRADA|datas invalidas/.test(ra.calendario);
      return _resposta(ra);
    }
    var r = { ok: true, financeiro: '', calendario: '' };
    try { r.financeiro = _gravarTabela(ss, d); } catch (e1) { r.financeiro = 'ERRO - ' + String(e1); }
    try { r.calendario = _gravarCalendario(ss, d); } catch (e2) { r.calendario = 'ERRO - ' + String(e2); }
    return _resposta(r);
  } catch (err) {
    return _resposta({ ok: false, erro: String(err) });
  }
}

/** Abra a URL /exec no navegador: mostra como o script está enxergando cada aba. */
function doGet() {
  var out = { ok: true, msg: 'ponte da AuAulandia no ar', versao: VERSAO_PONTE };
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var f = _acharAba(ss, ABA_FINANCEIRO);
    out.aba_financeiro = f ? { nome: f.getName(), colunas: _cabecalho(f).titulos } : 'NAO ENCONTRADA';
    var c = _acharAba(ss, ABA_DASHBOARD);
    if (!c) out.aba_calendario = 'NAO ENCONTRADA';
    else {
      var cal = _lerCalendario(c);
      out.aba_calendario = {
        nome: c.getName(),
        linha_do_cabecalho: cal.linhaCab,
        primeira_coluna_de_hospede: cal.col1,
        quantas_colunas_de_hospede: cal.nCols,
        primeiro_dia: cal.datas.length ? Utilities.formatDate(cal.datas[0].data, 'GMT-3', 'dd/MM/yyyy') : '-',
        ultimo_dia: cal.datas.length ? Utilities.formatDate(cal.datas[cal.datas.length - 1].data, 'GMT-3', 'dd/MM/yyyy') : '-',
        total_de_dias: cal.datas.length
      };
    }
    out.todas_as_abas = ss.getSheets().map(function (s) { return s.getName(); });
  } catch (e) { out.erro = String(e); }
  return _resposta(out);
}

/* ============================ ABA FINANCEIRA ============================ */

function _gravarTabela(ss, d) {
  var aba = _acharAba(ss, ABA_FINANCEIRO);
  if (!aba) return 'ABA NAO ENCONTRADA';
  var cab = _cabecalho(aba);
  if (!cab.linha) return 'NAO ACHEI O CABECALHO';
  if (_jaTem(aba, cab, d)) return 'ja estava la';
  var linha = _montarPorNome(cab, d);
  aba.appendRow(linha.valores);
  _ajustarFormatos(aba, aba.getLastRow(), linha.formatos);
  return 'ok (' + linha.usadas + ' campos)';
}

/** Marca a linha da reserva como CANCELADA na aba do financeiro, sem apagar o historico:
 *  o dinheiro que entrou (ou nao entrou) precisa continuar auditavel. Acrescenta quem
 *  cancelou e quando na propria celula do nome. */
function _marcarCancelado(ss, d) {
  var aba = _acharAba(ss, ABA_FINANCEIRO);
  if (!aba) return 'ABA NAO ENCONTRADA';
  var cab = _cabecalho(aba);
  if (!cab.linha) return 'NAO ACHEI O CABECALHO';
  var iNome = cab.chaves.indexOf('tutor peludo');
  if (iNome < 0) iNome = cab.chaves.indexOf('peludo tutor');
  var iEnt = cab.chaves.indexOf('entrada');
  if (iNome < 0 || iEnt < 0) return 'NAO ACHEI as colunas de nome e entrada';
  var ultima = aba.getLastRow();
  if (ultima <= cab.linha) return 'aba vazia';

  var vals = aba.getRange(cab.linha + 1, 1, ultima - cab.linha, cab.chaves.length).getValues();
  var alvo = String(d.peludoTutor || '').trim().toLowerCase();
  var dt0 = _data(d.entrada);
  var alvoDt = (dt0 instanceof Date) ? dt0.toDateString() : '';
  var quem = String(d.canceladoPor || '').trim();
  var quando = String(d.canceladoEm || '').trim();
  // Versao 6: a palavra que risca vem do app (so as da lista MARCAS); sem ela, CANCELADO.
  var palavra = _marcaValida(d.marca);

  for (var i = 0; i < vals.length; i++) {
    var nome = String(vals[i][iNome] || '').trim();
    var dt = vals[i][iEnt];
    var dtStr = (dt instanceof Date) ? dt.toDateString() : '';
    if (!nome || nome.toLowerCase() !== alvo || dtStr !== alvoDt) continue;
    var linhaReal = cab.linha + 1 + i;
    var marca = palavra + (quem ? ' por ' + quem : '') + (quando ? ' em ' + quando : '') + ' - ' + nome;
    var cel = aba.getRange(linhaReal, iNome + 1);
    cel.setValue(marca);
    // Riscado e cinza: quem abre a planilha ve na hora que aquela linha nao vale mais.
    aba.getRange(linhaReal, 1, 1, cab.chaves.length)
       .setFontLine('line-through').setFontColor('#999999');
    return 'linha ' + linhaReal + ' marcada como ' + (palavra === 'CANCELADO' ? 'CANCELADA' : palavra);
  }
  // Nenhuma linha viva: o reenvio de um cancelamento acha a linha JA riscada daquele nome e
  // daquela entrada (o nome dela agora comeca pela marca e termina em " - {nome}"). Antes da
  // versao 6 este ramo nunca era alcancado e o reenvio dizia "NAO ACHEI".
  for (var j = 0; j < vals.length; j++) {
    var nm = String(vals[j][iNome] || '').trim();
    var dj = vals[j][iEnt];
    var djStr = (dj instanceof Date) ? dj.toDateString() : '';
    if (djStr !== alvoDt || !_comecaComMarca(nm)) continue;
    var baixo = nm.toLowerCase();
    if (alvo && baixo.length > alvo.length + 3 && baixo.slice(-(alvo.length + 3)) === ' - ' + alvo) return 'ja estava cancelada';
  }
  return 'NAO ACHEI a linha desta reserva no financeiro';
}

/** A marca pedida pelo app, se for uma das conhecidas; senao a de sempre (CANCELADO). */
function _marcaValida(m) {
  var t = String(m || '').trim().toUpperCase();
  return MARCAS.indexOf(t) >= 0 ? t : MARCAS[0];
}

function _comecaComMarca(nome) {
  var n = String(nome || '');
  for (var i = 0; i < MARCAS.length; i++) if (n.indexOf(MARCAS[i]) === 0) return true;
  return false;
}

/** Versao 6 — a linha VIVA da reserva muda no lugar. Acha pelo nome antigo (peludoTutorAntes,
 *  ou peludoTutor) e pela entrada antiga (entradaAntes), pulando as linhas riscadas (o nome
 *  delas comeca por uma marca). Escreve so as colunas que vieram no pedido, pelo nome da
 *  coluna, com os formatos de sempre, e deixa a nota de quem alterou na celula do nome.
 *  Sem linha viva: 'NAO ACHEI…' e nenhuma linha nova.
 *  2a rodada: as colunas que vieram sao escritas NUMA SO escrita (setValues na faixa da
 *  primeira a ultima coluna do pedido; o que esta no meio e nao veio continua como estava,
 *  formula inclusive). Um erro do Apps Script (celula protegida, tempo esgotado) derruba a
 *  escrita inteira: a linha nunca fica com datas novas e dinheiro velho. */
function _atualizarLinha(ss, d) {
  var aba = _acharAba(ss, ABA_FINANCEIRO);
  if (!aba) return 'ABA NAO ENCONTRADA';
  var cab = _cabecalho(aba);
  if (!cab.linha) return 'NAO ACHEI O CABECALHO';
  var iNome = cab.chaves.indexOf('tutor peludo');
  if (iNome < 0) iNome = cab.chaves.indexOf('peludo tutor');
  var iEnt = cab.chaves.indexOf('entrada');
  if (iNome < 0 || iEnt < 0) return 'NAO ACHEI as colunas de nome e entrada';
  var ultima = aba.getLastRow();
  if (ultima <= cab.linha) return 'NAO ACHEI a linha desta reserva no financeiro';
  var vals = aba.getRange(cab.linha + 1, 1, ultima - cab.linha, cab.chaves.length).getValues();
  var alvo = String(d.peludoTutorAntes || d.peludoTutor || '').trim().toLowerCase();
  var dt0 = _data(d.entradaAntes);
  var alvoDt = (dt0 instanceof Date) ? dt0.toDateString() : '';
  if (!alvo || !alvoDt) return 'NAO ACHEI a linha desta reserva no financeiro';
  var achadas = [];
  for (var i = 0; i < vals.length; i++) {
    var nome = String(vals[i][iNome] || '').trim().toLowerCase();
    var dt = vals[i][iEnt];
    var dtStr = (dt instanceof Date) ? dt.toDateString() : '';
    if (nome && nome === alvo && dtStr === alvoDt) achadas.push(cab.linha + 1 + i);
  }
  if (!achadas.length) return 'NAO ACHEI a linha desta reserva no financeiro';
  var linhaReal = achadas[0];
  var linha = _montarPorNome(cab, d);
  var c1 = -1, c2 = -1;
  for (var c = 0; c < linha.valores.length; c++) {
    if (linha.formatos[c] === null) continue;            // so o que veio no pedido muda
    if (c1 < 0) c1 = c;
    c2 = c;
  }
  if (c1 < 0) return 'ERRO - o pedido nao trouxe nenhuma coluna da linha';
  var faixa = aba.getRange(linhaReal, c1 + 1, 1, c2 - c1 + 1);
  var atual = vals[linhaReal - cab.linha - 1].slice(c1, c2 + 1);
  var formulas = (typeof faixa.getFormulas === 'function') ? faixa.getFormulas()[0] : [];
  var nova = [];
  for (var k = c1; k <= c2; k++) {
    if (linha.formatos[k] !== null) nova.push(linha.valores[k]);
    else nova.push((formulas && formulas[k - c1]) ? formulas[k - c1] : atual[k - c1]);
  }
  faixa.setValues([nova]);
  _ajustarFormatos(aba, linhaReal, linha.formatos);
  var antes = _dataBR(d.entradaAntes) + ' a ' + _dataBR(d.saidaAntes);
  var depois = _dataBR(d.entrada) + ' a ' + _dataBR(d.saida);
  var nota = 'Alterada em ' + String(d.alteradoEm || '').trim() + ' por ' + String(d.alteradoPor || '').trim() +
    ': ' + antes + ' → ' + depois + '. Motivo: ' + String(d.motivo || '').trim().replace(/[.\s]+$/, '') + '.';
  try { aba.getRange(linhaReal, iNome + 1).setNote(nota); } catch (n1) { /* sem nota, a linha ja esta certa */ }
  var msg = 'linha ' + linhaReal + ' atualizada';
  if (achadas.length > 1) msg += ' (havia ' + achadas.length + ' linhas iguais; atualizei a primeira)';
  return msg;
}

/** A coluna do calendario onde o nome ja esta no periodo (para a atualizacao ficar na mesma). -1 se nao achou. */
function _colunaDoNome(ss, nome, entrada, saida) {
  var aba = _acharAba(ss, ABA_DASHBOARD);
  if (!aba) return -1;
  var cal = _lerCalendario(aba);
  if (!cal.linhaCab || !cal.datas.length) return -1;
  var ini = _data(entrada), fim = _data(saida);
  if (!(ini instanceof Date) || !(fim instanceof Date)) return -1;
  var alvo = String(nome || '').trim().toLowerCase();
  if (!alvo) return -1;
  var porDia = {};
  cal.datas.forEach(function (x) { porDia[_diaChave(x.data)] = x.linha; });
  var dia = new Date(ini.getTime()), guarda = 0;
  while (guarda < 400) {
    guarda++;
    if (CONTAR_DIA_DA_SAIDA ? (dia.getTime() > fim.getTime()) : (dia.getTime() >= fim.getTime())) break;
    var linha = porDia[_diaChave(dia)];
    if (linha) {
      var vals = aba.getRange(linha, cal.col1, 1, cal.nCols).getValues()[0];
      for (var c = 0; c < vals.length; c++) if (String(vals[c] || '').trim().toLowerCase() === alvo) return c;
    }
    dia = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate() + 1);
  }
  return -1;
}

function _dataBR(iso) {
  var p = String(iso || '').split('-');
  return p.length === 3 ? (p[2] + '/' + p[1] + '/' + p[0]) : String(iso || '');
}

function _cabecalho(aba) {
  var ate = Math.min(8, aba.getLastRow() || 1);
  var largura = Math.max(aba.getLastColumn(), 12);
  var vals = aba.getRange(1, 1, ate, largura).getValues();
  for (var i = 0; i < vals.length; i++) {
    var ch = vals[i].map(function (x) { return _chave(x); });
    if (ch.indexOf('entrada') >= 0 && ch.indexOf('saida') >= 0) {
      return { linha: i + 1, titulos: vals[i].map(function (x) { return String(x || ''); }), chaves: ch };
    }
  }
  return { linha: 0, titulos: [], chaves: [] };
}

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

function _ajustarFormatos(aba, linha, formatos) {
  for (var i = 0; i < formatos.length; i++) {
    if (!formatos[i]) continue;
    try { aba.getRange(linha, i + 1).setNumberFormat(formatos[i]); } catch (e) {}
  }
}

function _jaTem(aba, cab, d) {
  var iNome = cab.chaves.indexOf('tutor peludo');
  if (iNome < 0) iNome = cab.chaves.indexOf('peludo tutor');
  var iEnt = cab.chaves.indexOf('entrada');
  if (iNome < 0 || iEnt < 0) return false;
  var ultima = aba.getLastRow();
  if (ultima <= cab.linha) return false;
  var vals = aba.getRange(cab.linha + 1, 1, ultima - cab.linha, cab.chaves.length).getValues();
  var alvo = String(d.peludoTutor || '').trim().toLowerCase();
  var dt0 = _data(d.entrada);
  var alvoDt = (dt0 instanceof Date) ? dt0.toDateString() : '';
  for (var i = 0; i < vals.length; i++) {
    var nome = String(vals[i][iNome] || '').trim().toLowerCase();
    var dt = vals[i][iEnt];
    var dtStr = (dt instanceof Date) ? dt.toDateString() : '';
    if (nome && nome === alvo && dtStr === alvoDt) return true;
  }
  return false;
}

/* ============================== CALENDÁRIO ============================== */

/** Descobre onde ficam o cabeçalho, as colunas de hóspede e as datas. */
function _lerCalendario(aba) {
  var largura = Math.max(aba.getLastColumn(), 41);
  var alturaCab = Math.min(6, aba.getLastRow() || 1);
  var topo = aba.getRange(1, 1, alturaCab, largura).getValues();

  var linhaCab = 0, col1 = 0, nCols = 0;
  for (var i = 0; i < topo.length && !linhaCab; i++) {
    for (var j = 0; j < topo[i].length; j++) {
      if (_chave(topo[i][j]).indexOf('hospede 1') === 0) {
        linhaCab = i + 1; col1 = j + 1;
        for (var k = j; k < topo[i].length && String(topo[i][k] || '').trim() !== ''; k++) nCols++;
        break;
      }
    }
  }
  var datas = [];
  if (linhaCab) {
    var ultima = aba.getLastRow();
    if (ultima > linhaCab) {
      var colA = aba.getRange(linhaCab + 1, 1, ultima - linhaCab, 1).getValues();
      for (var r = 0; r < colA.length; r++) {
        if (colA[r][0] instanceof Date) datas.push({ linha: linhaCab + 1 + r, data: colA[r][0] });
      }
    }
  }
  return { linhaCab: linhaCab, col1: col1, nCols: nCols, datas: datas };
}

function _gravarCalendario(ss, d, colPreferida) {
  var aba = _acharAba(ss, ABA_DASHBOARD);
  if (!aba) return 'ABA NAO ENCONTRADA';
  var cal = _lerCalendario(aba);
  if (!cal.linhaCab) return 'NAO ACHEI a linha "Hospede 1"';
  if (!cal.datas.length) return 'NAO ACHEI as datas na coluna A';

  var ini = _data(d.entrada), fim = _data(d.saida);
  if (!(ini instanceof Date) || !(fim instanceof Date)) return 'datas invalidas';

  var nome = String(d.peludoTutor || '').trim();
  if (!nome) return 'sem nome do FILHOt';

  // Índice das datas por dia, para achar a linha sem varrer tudo a cada vez.
  var porDia = {};
  cal.datas.forEach(function (x) { porDia[_diaChave(x.data)] = x.linha; });

  // ===== UMA COLUNA SO, DO COMECO AO FIM DA ESTADIA ==============================
  // Adriana, 14/ago/2026: "thor 21 a 23 - na mesma coluna... o sistema esta jogando em
  // colunas diferentes."
  // O erro era decidir a coluna DIA A DIA: para cada dia, a primeira vazia daquele dia.
  // No dia 21 a coluna 1 estava livre; no dia 22 ela ja tinha outro hospede que entrou
  // antes, entao o Thor ia para a 2; no dia 23, para a 3. Cada dia decidido isolado
  // produzia uma escada, e no calendario o mesmo FILHOt parecia tres hospedes diferentes.
  // Agora a coluna e escolhida UMA VEZ, olhando o periodo inteiro: a primeira que esteja
  // livre em TODOS os dias. Se ele ja estiver em alguma coluna (reenvio do mesmo orcamento),
  // essa coluna e reaproveitada em vez de abrir outra — desde que nao tenha outro hospede em
  // nenhum dos dias (6.68, 3a rodada: nunca escreve um nome por cima de outro).
  var linhas = [], semLinha = [];
  var dia = new Date(ini.getTime());
  var guarda = 0;
  while (guarda < 400) {
    guarda++;
    var passou = CONTAR_DIA_DA_SAIDA ? (dia.getTime() > fim.getTime()) : (dia.getTime() >= fim.getTime());
    if (passou) break;
    var linha = porDia[_diaChave(dia)];
    if (!linha) semLinha.push(Utilities.formatDate(dia, 'GMT-3', 'dd/MM'));
    else linhas.push(linha);
    dia = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate() + 1);
  }
  if (!linhas.length) {
    return 'NENHUMA das datas da estadia existe no calendario' +
      (semLinha.length ? ' (' + semLinha.join(', ') + ')' : '');
  }

  // Le o bloco de hospedes de cada dia da estadia de uma vez so.
  var grade = linhas.map(function (l) {
    return aba.getRange(l, cal.col1, 1, cal.nCols).getValues()[0];
  });
  var alvo = nome.toLowerCase();
  var escolhida = _colunaEscolhida(grade, alvo, cal.nCols, colPreferida);

  // 3) Nenhuma coluna atravessa a estadia inteira: NAO espalha em escada. Diz o que houve,
  //    para a Gestao abrir uma coluna nova — melhor um aviso que um calendario mentiroso.
  if (escolhida < 0) {
    return 'CALENDARIO SEM COLUNA LIVRE para a estadia inteira (' +
      Utilities.formatDate(ini, 'GMT-3', 'dd/MM') + ' a ' + Utilities.formatDate(fim, 'GMT-3', 'dd/MM') +
      '). Acrescente uma coluna de hospede ou lance a mao.';
  }

  var escritos = 0, jaEstavam = 0;
  for (var i = 0; i < linhas.length; i++) {
    if (String(grade[i][escolhida] || '').trim().toLowerCase() === alvo) { jaEstavam++; continue; }
    aba.getRange(linhas[i], cal.col1 + escolhida).setValue(nome);
    escritos++;
  }

  var msg = escritos + ' noite(s) marcada(s) na coluna Hospede ' + (escolhida + 1);
  if (jaEstavam) msg += ', ' + jaEstavam + ' ja estavam';
  if (semLinha.length) msg += '. SEM LINHA NO CALENDARIO: ' + semLinha.join(', ');
  return msg;
}

/** A coluna da estadia (a mesma regra de sempre, numa funcao so: a gravacao e a conferencia do
 *  'atualizar' escolhem igual). grade: uma linha por dia da estadia (os valores das colunas
 *  Hospede N). -1 se nenhuma coluna atravessa a estadia inteira. */
function _colunaEscolhida(grade, alvo, nCols, colPreferida) {
  // 1) Ele ja esta em alguma coluna? Reaproveita — nao abre vaga nova no reenvio. 3a rodada da 6.68
  //    (LOW-R1 do re-gate): so a coluna em que ele aparece E que esta livre (ou com ele mesmo) em
  //    TODOS os dias da estadia. Com outro hospede em algum dia (o FILHOt com outra reserva viva,
  //    a trava da Maya), a gravacao escreveria o nome por cima e o outro hospede sumiria do
  //    calendario: segue para o 1b e o 2.
  var escolhida = -1;
  for (var c = 0; c < nCols && escolhida < 0; c++) {
    var temEle = false, cabe = true;
    for (var r = 0; r < grade.length; r++) {
      var v = String(grade[r][c] || '').trim().toLowerCase();
      if (v === alvo) temEle = true;
      else if (v !== '') { cabe = false; break; }
    }
    if (temEle && cabe) escolhida = c;
  }

  // 1b) Versao 6 ('atualizar'): a coluna em que ele estava antes da mudanca de datas, se ela
  //     estiver livre em todos os dias novos — a reserva alterada continua na mesma coluna.
  if (escolhida < 0 && typeof colPreferida === 'number' && colPreferida >= 0 && colPreferida < nCols) {
    var livrePref = true;
    for (var rp = 0; rp < grade.length; rp++) {
      if (String(grade[rp][colPreferida] || '').trim() !== '') { livrePref = false; break; }
    }
    if (livrePref) escolhida = colPreferida;
  }

  // 2) Senao, a primeira coluna livre em TODOS os dias.
  if (escolhida < 0) {
    for (var c2 = 0; c2 < nCols; c2++) {
      var livreSempre = true;
      for (var r2 = 0; r2 < grade.length; r2++) {
        if (String(grade[r2][c2] || '').trim() !== '') { livreSempre = false; break; }
      }
      if (livreSempre) { escolhida = c2; break; }
    }
  }
  return escolhida;
}

/** 2a rodada do 'atualizar' (LOW-7 do gate): as datas novas cabem no calendario? Simula, SEM
 *  ESCREVER, o que o pedido vai fazer — as noites antigas dele liberadas (a nao ser com
 *  naoLiberar) e a coluna escolhida pela mesma regra da gravacao. '' cabe; senao o motivo (e
 *  nada e mudado: nem a linha do dinheiro, nem as noites antigas). */
function _calendarioCabe(ss, d, colPreferida) {
  var aba = _acharAba(ss, ABA_DASHBOARD);
  if (!aba) return 'ABA DO CALENDARIO NAO ENCONTRADA: nada foi mudado';
  var cal = _lerCalendario(aba);
  if (!cal.linhaCab) return 'NAO ACHEI a linha "Hospede 1": nada foi mudado';
  if (!cal.datas.length) return 'NAO ACHEI as datas na coluna A: nada foi mudado';
  var ini = _data(d.entrada), fim = _data(d.saida);
  if (!(ini instanceof Date) || !(fim instanceof Date)) return 'datas invalidas: nada foi mudado';
  var alvo = String(d.peludoTutor || '').trim().toLowerCase();
  if (!alvo) return 'sem nome do FILHOt: nada foi mudado';
  var porDia = {};
  cal.datas.forEach(function (x) { porDia[_diaChave(x.data)] = x.linha; });
  var antesAlvo = String(d.peludoTutorAntes || d.peludoTutor || '').trim().toLowerCase();
  var a0 = _data(d.entradaAntes), a1 = _data(d.saidaAntes);
  var libera = !d.naoLiberar && (a0 instanceof Date) && (a1 instanceof Date);
  var dentroAntes = function (dt) {
    if (!libera || dt.getTime() < a0.getTime()) return false;
    return CONTAR_DIA_DA_SAIDA ? (dt.getTime() <= a1.getTime()) : (dt.getTime() < a1.getTime());
  };
  var grade = [];
  var dia = new Date(ini.getTime()), guarda = 0;
  while (guarda < 400) {
    guarda++;
    if (CONTAR_DIA_DA_SAIDA ? (dia.getTime() > fim.getTime()) : (dia.getTime() >= fim.getTime())) break;
    var linha = porDia[_diaChave(dia)];
    if (linha) {
      var vals = aba.getRange(linha, cal.col1, 1, cal.nCols).getValues()[0].slice();
      if (dentroAntes(dia)) for (var c = 0; c < vals.length; c++) if (String(vals[c] || '').trim().toLowerCase() === antesAlvo) vals[c] = '';
      grade.push(vals);
    }
    dia = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate() + 1);
  }
  if (!grade.length) return 'NENHUMA das datas da estadia existe no calendario: nada foi mudado';
  if (_colunaEscolhida(grade, alvo, cal.nCols, colPreferida) < 0) {
    return 'CALENDARIO SEM COLUNA LIVRE para a estadia inteira (' +
      Utilities.formatDate(ini, 'GMT-3', 'dd/MM') + ' a ' + Utilities.formatDate(fim, 'GMT-3', 'dd/MM') +
      '): nada foi mudado. Acrescente uma coluna de hospede e tente de novo.';
  }
  return '';
}

/** Apaga o FILHOt do calendario no periodo — usado quando o tutor CANCELA a reserva.
 *  Adriana, 14/ago/2026: "tem situacao que o tutor faz reserva, esta tudo preparado, mas
 *  algo impede a viagem". Sem isto a vaga fica presa a uma hospedagem que nao vai acontecer
 *  e ninguem consegue colocar outro FILHOt no lugar. */
function _apagarDoCalendario(ss, d) {
  var aba = _acharAba(ss, ABA_DASHBOARD);
  if (!aba) return 'ABA NAO ENCONTRADA';
  var cal = _lerCalendario(aba);
  if (!cal.linhaCab) return 'NAO ACHEI a linha "Hospede 1"';

  var ini = _data(d.entrada), fim = _data(d.saida);
  if (!(ini instanceof Date) || !(fim instanceof Date)) return 'datas invalidas';
  var alvo = String(d.peludoTutor || '').trim().toLowerCase();
  if (!alvo) return 'sem nome do FILHOt';

  var porDia = {};
  cal.datas.forEach(function (x) { porDia[_diaChave(x.data)] = x.linha; });

  var apagados = 0;
  var dia = new Date(ini.getTime()), guarda = 0;
  while (guarda < 400) {
    guarda++;
    var passou = CONTAR_DIA_DA_SAIDA ? (dia.getTime() > fim.getTime()) : (dia.getTime() >= fim.getTime());
    if (passou) break;
    var linha = porDia[_diaChave(dia)];
    if (linha) {
      var vals = aba.getRange(linha, cal.col1, 1, cal.nCols).getValues()[0];
      for (var c = 0; c < vals.length; c++) {
        if (String(vals[c] || '').trim().toLowerCase() === alvo) {
          aba.getRange(linha, cal.col1 + c).setValue('');
          apagados++;
        }
      }
    }
    dia = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate() + 1);
  }
  return apagados + ' noite(s) liberada(s) no calendario';
}

function _diaChave(dt) {
  return dt.getFullYear() + '-' + (dt.getMonth() + 1) + '-' + dt.getDate();
}

/* ================================ APOIO ================================ */

function _acharAba(ss, nome) {
  var direta = ss.getSheetByName(nome);
  if (direta) return direta;
  var alvo = _chave(nome), achada = null;
  ss.getSheets().forEach(function (s) { if (!achada && _chave(s.getName()) === alvo) achada = s; });
  return achada;
}

function _chave(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(new RegExp('[' + String.fromCharCode(0x300) + '-' + String.fromCharCode(0x36f) + ']', 'g'), '')
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

/**
 * LIMPEZA — tira as linhas e as marcações de teste das duas abas.
 * Escolha "limparTestes" na lista de funções, no topo do editor, e clique em Executar.
 */
function limparTestes() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), total = 0;

  var f = _acharAba(ss, ABA_FINANCEIRO);
  if (f) {
    var ultima = f.getLastRow();
    if (ultima > 1) {
      var largura = Math.max(f.getLastColumn(), 4);
      var vals = f.getRange(1, 1, ultima, largura).getValues();
      for (var i = vals.length - 1; i >= 0; i--) {
        if (vals[i].join(' ').toUpperCase().indexOf('TESTE APAGAR') >= 0) { f.deleteRow(i + 1); total++; }
      }
    }
  }

  var c = _acharAba(ss, ABA_DASHBOARD);
  if (c) {
    var cal = _lerCalendario(c);
    if (cal.linhaCab && cal.datas.length) {
      var prim = cal.datas[0].linha, ult = cal.datas[cal.datas.length - 1].linha;
      var faixa = c.getRange(prim, cal.col1, ult - prim + 1, cal.nCols);
      var m = faixa.getValues(), mexeu = false;
      for (var r = 0; r < m.length; r++) {
        for (var k = 0; k < m[r].length; k++) {
          if (String(m[r][k] || '').toUpperCase().indexOf('TESTE APAGAR') >= 0) { m[r][k] = ''; total++; mexeu = true; }
        }
      }
      if (mexeu) faixa.setValues(m);
    }
    // Linhas soltas sem data (o estrago da versao antiga) — some com elas.
    var u2 = c.getLastRow();
    if (cal.linhaCab && u2 > cal.linhaCab) {
      var colA = c.getRange(cal.linhaCab + 1, 1, u2 - cal.linhaCab, 1).getValues();
      for (var q = colA.length - 1; q >= 0; q--) {
        var v = colA[q][0];
        if (v instanceof Date && v.getFullYear() < 2000) { c.deleteRow(cal.linhaCab + 1 + q); total++; }
      }
    }
  }

  Logger.log('Itens de teste apagados: ' + total);
  return total;
}

function _resposta(obj) {
  // Versao 6: toda resposta diz a versao da ponte — e por ela que o app escolhe o caminho.
  if (obj && typeof obj === 'object' && obj.versao === undefined) obj.versao = VERSAO_PONTE;
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
