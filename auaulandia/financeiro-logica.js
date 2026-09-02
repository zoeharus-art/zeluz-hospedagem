/* ============================================================================
 * financeiro-logica.js — a CONTA do Financeiro, sem tela e sem banco.
 *
 * O que é: as funções puras do dashboard Financeiro. Recebem objetos (o que
 * veio do banco) e devolvem objetos. Nunca leem DOM, nunca leem Firebase,
 * nunca gravam nada. Mesmo molde do painel-logica.js: assim o harness prova a
 * conta contra dado REAL antes de existir uma linha de tela.
 *
 * Como entra no app: <script src="financeiro-logica.js"></script> ANTES do
 * script grande do index.html. As funções ficam globais com prefixo "fin".
 *
 * Estilo: var/function, ES5. Roda no tablet velho da recepção. Sem class, sem
 * arrow, sem template string, sem Object.assign, sem Array.prototype.find.
 *
 * ---------------------------------------------------------------------------
 * DINHEIRO — as leis da casa que este arquivo obedece:
 *
 *  1. TUDO em CENTAVOS (número inteiro). Nenhuma conta em reais com ponto
 *     flutuante. finBRL() só existe para MOSTRAR, nunca para calcular.
 *  2. Formato sempre completo: R$ 1.234,56 — milhar com ponto, decimal com
 *     vírgula, DUAS casas sempre, inclusive ",00". Zero é "R$ 0,00".
 *  3. Tolerância ZERO a centavo. A mensalidade usa EXATAMENTE a mesma fórmula
 *     do app (Math.round(base*(100-pct)/100)) — de propósito, char por char:
 *     tela e cobrança não podem discordar sobre o valor.
 *  4. Nada inventado. O que não dá para saber com o dado que existe NÃO vira
 *     estimativa: vai para `semComoCalcular` com o motivo escrito, e fica
 *     FORA de qualquer soma.
 *
 * ---------------------------------------------------------------------------
 * O QUE O BANCO TEM HOJE (31/ago/2026) — e o que ele NÃO tem:
 *
 *  TEM (Day Care):     daycare/cadastro/{chave}/renov =
 *                      {plano, inicio, fim, aulas?, ordemPet?, mesRenov?,
 *                       quando?, plano_deduzido?, plano_deduzido_meses?}
 *                      `inicio` é rotulado na tela como "Data do pagamento".
 *  TEM (AuAulândia):   auaulandia/orcamentos/{id} =
 *                      {total_cent, parcela1_cent, parcela2_cent, entrada,
 *                       saida, status, status_em, criado_em, pets[], ...}
 *                      status: aguardando · fechado · nao_fechou · cancelado
 *
 *  NÃO TEM:            NENHUM registro de "pagamento recebido em tal data,
 *                      neste valor, nesta forma". Não existe nó de pagamento,
 *                      nem campo `pago`, nem baixa de parcela. `renov.inicio`
 *                      é uma DECLARAÇÃO de data (e em 88 fichas ela foi
 *                      DEDUZIDA da planilha, não digitada por ninguém).
 *
 *  Por isso este arquivo separa três coisas que não são a mesma:
 *    · RECEBIDO   — só sai de dados.pagamentos (o nó NOVO). Sem ele, é 0.
 *    · DECLARADO  — o que renov.inicio afirma, sem lançamento por trás.
 *    · A RECEBER  — o que vence no mês e não tem pagamento lançado.
 *
 *  Nó NOVO proposto (ver docs/FINANCEIRO-DASHBOARD.md):
 *    daycare/pagamentos/{AAAA-MM}/{id} =
 *      {chave, valor_cent, data, forma, plano, ref, quem, ts}
 *
 * ---------------------------------------------------------------------------
 * AS 3 DECISÕES DA ADRIANA (02/set/2026) — as 3 perguntas do
 * docs/FINANCEIRO-DASHBOARD.md § 5 têm resposta. Este arquivo obedece:
 *
 *  1. TRIMESTRAL/SEMESTRAL É PAGO TODO À VISTA NA RENOVAÇÃO. O valor do
 *     período inteiro (mensalidade × meses do compromisso) entra inteiro no
 *     mês de `renov.inicio` — os meses seguintes do período NÃO geram nova
 *     cobrança. Não existe mais escolha de "regime" (caixa × competência):
 *     só existe este jeito. O campo `parcelas` da tabela de planos do app
 *     segue sem uso — ninguém confirmou parcelamento, então ele fica de fora.
 *
 *  2. PAGAMENTO PARCIAL NÃO EXISTE. `finLancamentoValido()` só aceita o
 *     valor CHEIO — diferente (a menos OU a mais) é barrado na entrada, com
 *     o motivo já escrito. A situação de uma cobrança é só `pago` ou
 *     `aberto` — o estado `parcial` saiu da conta.
 *
 *  3. IRMÃOS: A FAMÍLIA RESOLVE A ORDEM SOZINHA. Por família (vínculos em
 *     `daycare/irmaos`), exatamente 1 FILHOt paga cheio (ordem 1) e os
 *     demais pagam com o desconto da tabela (`FIN_DESC_IRMAO`) — a dedução
 *     é automática, não importa qual É o 2º. Ficha com `renov.ordemPet`
 *     EXPLÍCITO sempre prevalece sobre a família. Sem vínculo nenhum: segue
 *     a regra antiga (assume 1º e avisa). Ver `finOrdensFamilia()`.
 * ========================================================================== */

/* ------------------------------------------------------------------ básico */

/* Objeto seguro: null/undefined/lista viram {} — o banco às vezes devolve null. */
function finObj(o) {
  if (!o || typeof o !== 'object' || Object.prototype.toString.call(o) === '[object Array]') return {};
  return o;
}

function finEhLista(x) { return Object.prototype.toString.call(x) === '[object Array]'; }

function finLista(x) { return finEhLista(x) ? x : []; }

function finPad2(n) { n = String(n); return n.length < 2 ? ('0' + n) : n; }

function finEhISO(d) { return typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d); }

function finEhMes(m) { return typeof m === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(m); }

/* Inteiro de centavos, ou 0. NUNCA NaN: um NaN numa soma de dinheiro
   contamina o total inteiro e a tela mostra "R$ NaN" — que não é número
   nenhum e ninguém sabe conferir. */
function finCent(v) {
  if (typeof v === 'number' && isFinite(v)) return Math.round(v);
  if (typeof v === 'string' && /^-?\d+$/.test(v)) return parseInt(v, 10);
  return 0;
}

/* --------------------------------------------------------------- dinheiro */

/* finBRL — centavos -> "R$ 1.234,56". SEMPRE duas casas, SEMPRE com R$ e um
   espaço. Escrito à mão (sem toLocaleString) porque o tablet velho não
   garante o locale pt-BR, e um ponto no lugar da vírgula muda o número por
   mil vezes. Negativo sai como "-R$ 240,00" (o sinal vem antes do R$). */
function finBRL(cent) {
  var c = finCent(cent);
  var neg = c < 0;
  if (neg) c = -c;
  var reais = Math.floor(c / 100);
  var centavos = c - (reais * 100);
  var s = String(reais), out = '', i, n = 0;
  for (i = s.length - 1; i >= 0; i--) {
    out = s.charAt(i) + out;
    n++;
    if (n % 3 === 0 && i > 0) out = '.' + out;
  }
  return (neg ? '-' : '') + 'R$ ' + out + ',' + finPad2(centavos);
}

/* --------------------------------------------------------------- calendário */

/* 'AAAA-MM-DD' -> 'AAAA-MM'. Devolve '' se não for data. */
function finMesDe(iso) { return finEhISO(iso) ? String(iso).slice(0, 7) : ''; }

/* ms (carimbo do Firebase) -> 'AAAA-MM-DD', na hora LOCAL do aparelho.
   É o mesmo fuso em que a recepção trabalha; usar UTC jogaria as gravações
   da noite para o dia seguinte e o mês fecharia errado na virada. */
function finISODeTs(ts) {
  if (typeof ts !== 'number' || !isFinite(ts) || ts <= 0) return '';
  var d = new Date(ts);
  if (isNaN(d.getTime())) return '';
  return d.getFullYear() + '-' + finPad2(d.getMonth() + 1) + '-' + finPad2(d.getDate());
}

function finPrimeiroDia(mes) { return finEhMes(mes) ? (mes + '-01') : ''; }

/* Último dia do mês, como ISO. Sai pelo "dia 0 do mês seguinte". */
function finUltimoDia(mes) {
  if (!finEhMes(mes)) return '';
  var a = parseInt(mes.slice(0, 4), 10), m = parseInt(mes.slice(5, 7), 10);
  var d = new Date(a, m, 0);
  return d.getFullYear() + '-' + finPad2(d.getMonth() + 1) + '-' + finPad2(d.getDate());
}

/* Quantos meses um compromisso vale. Mesma tabela do app (PLANO_MESES). */
var FIN_PLANO_MESES = { mensal: 1, trimestral: 3, semestral: 6 };
function finMesesDoCompromisso(c) {
  var m = FIN_PLANO_MESES[String(c || '').toLowerCase()];
  return m ? m : 0;
}

/* Fim da vigência: MESMA regra do app (fimVigenciaISO). O plano é pago
   antecipado e vale até o ÚLTIMO DIA DO MÊS final — não são "N meses
   corridos a partir do dia". Regra da Adriana, 30/jul/2026. */
function finFimVigencia(inicioISO, meses) {
  if (!finEhISO(inicioISO) || !meses) return '';
  var a = inicioISO.split('-');
  var d = new Date(parseInt(a[0], 10), (parseInt(a[1], 10) - 1) + meses, 0);
  return d.getFullYear() + '-' + finPad2(d.getMonth() + 1) + '-' + finPad2(d.getDate());
}

/* Lista de meses 'AAAA-MM' cobertos por uma vigência [inicio..fim].
   Vazia se qualquer ponta faltar — nunca "chuta" um mês. */
function finMesesDaVigencia(inicioISO, fimISO) {
  if (!finEhISO(inicioISO) || !finEhISO(fimISO)) return [];
  if (fimISO < inicioISO) return [];
  var a = parseInt(inicioISO.slice(0, 4), 10), m = parseInt(inicioISO.slice(5, 7), 10);
  var fa = parseInt(fimISO.slice(0, 4), 10), fm = parseInt(fimISO.slice(5, 7), 10);
  var out = [], guarda = 0;
  while ((a < fa || (a === fa && m <= fm)) && guarda < 240) {
    out.push(a + '-' + finPad2(m));
    m++; if (m > 12) { m = 1; a++; }
    guarda++;
  }
  return out;
}

/* --------------------------------------------------------------- identidade */

/* finChave — MESMA regra do pelKey do app. Nome e tutor viram a chave do
   cadastro. Trocar esta regra separa o pagamento do FILHOt dono dele. */
function finChave(nome, tutor) {
  return (String(nome || '') + '__' + String(tutor || ''))
    .toLowerCase().replace(/[.#$\[\]\/]/g, '-');
}

/* -------------------------------------------------------------- mensalidade */

var FIN_PLANOS_PADRAO = {
  Silver: { rotulo: 'Silver', compromisso: 'mensal',     hospOff: 0,
    valores: { 1: 38700, 2: 61700, 3: 73700, 4: 87700, 5: 106700 } },
  Gold:   { rotulo: 'Gold',   compromisso: 'trimestral', hospOff: 10,
    valores: { 1: 35900, 2: 58900, 3: 69900, 4: 82900, 5: 96900 } },
  Black:  { rotulo: 'Black',  compromisso: 'semestral',  hospOff: 15,
    valores: { 1: 33800, 2: 56800, 3: 67800, 4: 81800, 5: 95800 } }
};

/* Desconto de irmão no PLANO do Day Care (não confundir com o da hospedagem,
   que é 5% do 2º em diante). Adriana, 13/ago/2026: são duas tabelas. */
var FIN_DESC_IRMAO = { 2: 7, 3: 12 };

/* finMensalidade — o valor mensal de um FILHOt. Devolve null quando não dá
   para saber (plano desconhecido, sem tabela de aulas). null NÃO é zero:
   zero entraria calado numa soma e a soma mentiria.
   A fórmula é a MESMA do app: Math.round(base * (100 - pct) / 100). */
function finMensalidade(planos, planoKey, aulas, ordemPet, descontos) {
  var tab = finObj(planos);
  if (!tab[planoKey]) tab = FIN_PLANOS_PADRAO;
  var pl = tab[planoKey];
  if (!pl) return null;
  var vals = finObj(pl.valores);
  var n = parseInt(aulas, 10);
  if (!(n >= 1 && n <= 5)) return null;
  var base = finCent(vals[n]);
  if (!base) return null;
  var d = finObj(descontos);
  if (!d[2] && !d[3]) d = FIN_DESC_IRMAO;
  var o = parseInt(ordemPet, 10); if (!(o >= 1)) o = 1;
  var pct = d[o] !== undefined ? d[o] : (o >= 3 ? d[3] : 0);
  pct = finCent(pct);
  return Math.round(base * (100 - pct) / 100);
}

/* finAulasDe — quantas aulas por semana. A ordem importa e é a do app:
     1) renov.aulas (o que a consultora lançou)
     2) dias marcados no cadastro do banco
     3) dias do array-mestre PELUDINHOS (que vive no index.html)
   Devolve null quando nenhuma fonte responde — e aí o FILHOt vai para
   `semComoCalcular`, nunca para a soma. */
function finAulasDe(chave, cadastro, peludinhos) {
  var c = finObj(finObj(cadastro)[chave]);
  var r = finObj(c.renov);
  var n = parseInt(r.aulas, 10);
  if (n >= 1) return Math.min(5, n);
  if (finEhLista(c.dias) && c.dias.length) return Math.min(5, Math.max(1, c.dias.length));
  var lista = finLista(peludinhos), i, p;
  for (i = 0; i < lista.length; i++) {
    p = lista[i];
    if (p && finChave(p.n, p.tutor) === chave && finEhLista(p.dias) && p.dias.length) {
      return Math.min(5, Math.max(1, p.dias.length));
    }
  }
  return null;
}

/* Categoria do FILHOt, com a mesma dedução do app (pelCategoria). */
function finCategoria(chave, cadastro) {
  var c = finObj(finObj(cadastro)[chave]);
  if (c.categoria) return String(c.categoria);
  var pl = String(finObj(c.renov).plano || '');
  if (pl === 'auaulandia') return 'hospede';
  if (pl === 'avulso') return 'avulso';
  if (pl === 'morador') return 'morador';
  if (/repolho/i.test(chave)) return 'morador';
  return 'auluno';
}

/* ------------------------------------------------------------- família (irmãos) */

/* finGruposFamilia — agrupa os vínculos de irmãos (daycare/irmaos, pares
   {a,b} com a chave dos dois lados) em famílias (componentes conectados).
   Um vínculo A-B e outro B-C viram UMA família com os três — não duas
   duplas soltas. Devolve {raiz: [chave, chave, ...]}, sem ordem definida. */
function finGruposFamilia(irmaos) {
  var pares = finObj(irmaos);
  var pai = {};
  function acha(x) {
    if (!pai[x]) pai[x] = x;
    while (pai[x] !== x) { pai[x] = pai[pai[x]]; x = pai[x]; }
    return x;
  }
  function junta(a, b) {
    var ra = acha(a), rb = acha(b);
    if (ra !== rb) pai[ra] = rb;
  }
  var ks = Object.keys(pares), i, v;
  for (i = 0; i < ks.length; i++) {
    v = pares[ks[i]];
    if (!v || !v.a || !v.b) continue;
    junta(String(v.a), String(v.b));
  }
  var grupos = {}, chaves = Object.keys(pai), r;
  for (i = 0; i < chaves.length; i++) {
    r = acha(chaves[i]);
    if (!grupos[r]) grupos[r] = [];
    grupos[r].push(chaves[i]);
  }
  return grupos;
}

/* finOrdensFamilia — decide o "Nº do peludinho na família" AUTOMATICAMENTE
   para quem não tem renov.ordemPet gravado, usando os vínculos de irmãos.
   Regra da Adriana (02/set/2026): por família, exatamente 1 FILHOt paga
   cheio (ordem 1) e os demais pagam com o desconto da tabela — a dedução é
   automática, não importa qual É o 2º.
     · Ficha com ordemPet EXPLÍCITO sempre prevalece — "reserva" a posição.
     · Quem não tem, preenche as posições que sobraram, em ordem
       DETERMINÍSTICA (pela chave, ordem alfabética) — nunca por sorte de
       iteração de objeto, senão a mesma família calcularia valores
       diferentes em duas rodadas.
     · Família com menos de 2 aulunos cobráveis não conta como família para
       fins de cobrança (o outro vínculo pode ser com um morador/hóspede, ou
       o FILHOt do vínculo pode não existir mais no cadastro) — segue a
       regra antiga (assume 1º, avisa).
   Devolve {chave: ordemResolvida} — só para quem foi resolvido por aqui. */
function finOrdensFamilia(cadastro, irmaos) {
  var grupos = finGruposFamilia(irmaos);
  var out = {};
  var raizes = Object.keys(grupos), i, membros, m, k, elegiveis, r, op, ord;
  for (i = 0; i < raizes.length; i++) {
    membros = grupos[raizes[i]];
    elegiveis = [];
    for (m = 0; m < membros.length; m++) {
      k = membros[m];
      if (!finObj(cadastro)[k]) continue;                    /* vínculo órfão */
      if (finCategoria(k, cadastro) !== 'auluno') continue;   /* só quem é cobrado entra na fila */
      elegiveis.push(k);
    }
    if (elegiveis.length < 2) continue;    /* não é família pra fins de cobrança */

    var explicitos = {}, usados = {}, semOrdem = [];
    for (m = 0; m < elegiveis.length; m++) {
      k = elegiveis[m];
      r = finObj(finObj(cadastro)[k]).renov;
      op = finObj(r).ordemPet;
      ord = null;
      if (op !== undefined && op !== null) {
        ord = parseInt(op, 10);
        if (!(ord >= 1)) ord = null;
      }
      if (ord !== null) { explicitos[k] = ord; usados[ord] = true; }
      else { semOrdem.push(k); }
    }
    semOrdem.sort();
    var prox = 1;
    for (m = 0; m < semOrdem.length; m++) {
      while (usados[prox]) prox++;
      out[semOrdem[m]] = prox;
      usados[prox] = true;
      prox++;
    }
  }
  return out;
}

/* --------------------------------------------------------------- pagamentos */

/* finPagamentosDoMes — o que foi LANÇADO como recebido. Aceita as duas formas
   do nó: já fatiado por mês (daycare/pagamentos/{AAAA-MM}/{id}) ou tudo
   junto num nível só. A competência de um lançamento é `ref` quando existe
   (o mês a que o pagamento se refere) e, senão, o mês da `data`. */
function finPagamentosDoMes(pagamentos, mes) {
  var out = [];
  if (!finEhMes(mes)) return out;
  var raiz = finObj(pagamentos);
  var baldes = [];
  if (raiz[mes] !== undefined) baldes.push(finObj(raiz[mes]));
  else baldes.push(raiz);
  var b, ks, i, j, p, comp;
  for (j = 0; j < baldes.length; j++) {
    b = baldes[j]; ks = Object.keys(b);
    for (i = 0; i < ks.length; i++) {
      p = b[ks[i]];
      if (!p || typeof p !== 'object' || finEhLista(p)) continue;
      comp = finEhMes(p.ref) ? p.ref : finMesDe(p.data);
      if (comp !== mes) continue;
      out.push({
        id: ks[i],
        chave: String(p.chave || ''),
        valor_cent: finCent(p.valor_cent),
        data: finEhISO(p.data) ? p.data : '',
        forma: String(p.forma || ''),
        plano: String(p.plano || ''),
        servico: String(p.servico || ''),
        quem: String(p.quem || ''),
        ref: comp
      });
    }
  }
  return out;
}

/* Soma por chave dos pagamentos de uma lista. */
function finSomaPorChave(pgs) {
  var m = {}, i, p;
  for (i = 0; i < finLista(pgs).length; i++) {
    p = pgs[i];
    if (!p || !p.chave) continue;
    m[p.chave] = finCent(m[p.chave]) + finCent(p.valor_cent);
  }
  return m;
}

/* finLancamentoValido — Adriana, 02/set/2026: "pagamento parcial não
   existe". Todo lançamento tem que bater EXATAMENTE com o valor esperado —
   nem a menos (falta), nem a mais (sobra é erro de digitação, não vira
   crédito). Devolve {ok:true} ou {ok:false, motivo:"..."} com a diferença
   já em finBRL(), pronta pra tela mostrar sem conta nenhuma.
   `lancamento` aceita tanto o valor em centavos direto (número) quanto o
   objeto {valor_cent:...} — o formato gravado em daycare/pagamentos. */
function finLancamentoValido(lancamento, valorEsperado) {
  var bruto = (lancamento && typeof lancamento === 'object') ? lancamento.valor_cent : lancamento;
  var v = finCent(bruto);
  var esperado = finCent(valorEsperado);
  if (esperado <= 0) return { ok: false, motivo: 'não há valor esperado para conferir' };
  if (v === esperado) return { ok: true };
  if (v < esperado) return { ok: false, motivo: 'falta ' + finBRL(esperado - v) };
  return { ok: false, motivo: 'passa ' + finBRL(v - esperado) + ' do valor esperado' };
}

/* ------------------------------------------------------------------ resumo */

/* finResumoMes(dados, mes, opcoes) — a conta do mês.
 *
 * dados = {
 *   peludinhos: [{n,tutor,dias:[]}]        // o array-mestre do index.html
 *   cadastro:   {chave:{...,renov:{...}}}  // daycare/cadastro
 *   orcamentos: {id:{...}}                 // auaulandia/orcamentos
 *   pagamentos: {...}                      // daycare/pagamentos (NÓ NOVO — hoje não existe)
 *   planos:     {...}                      // planos() do app; sem isso usa o padrão 2026
 *   descontoIrmao: {2:7,3:12}
 *   irmaos:     {id:{a,b,...}}             // daycare/irmaos — vínculos de irmãos
 * }
 * mes = 'AAAA-MM'
 * opcoes = { hoje:'AAAA-MM-DD' }
 *
 *   Regime é SEMPRE caixa: o plano inteiro (mensalidade x meses do
 *   compromisso) cai no MÊS DO PAGAMENTO. Decisão da Adriana, 02/set/2026 —
 *   ver o cabeçalho deste arquivo. Não existe mais opção de "competência".
 *
 * Devolve zeros — nunca NaN, nunca undefined — quando o mês não tem nada.
 */
function finResumoMes(dados, mes, opcoes) {
  var d = finObj(dados), o = finObj(opcoes);
  var hoje = finEhISO(o.hoje) ? o.hoje : '';
  var cadastro = finObj(d.cadastro);
  var peludinhos = finLista(d.peludinhos);
  var orcamentos = finObj(d.orcamentos);
  var planos = finObj(d.planos);
  if (!planos.Silver && !planos.Gold && !planos.Black) planos = FIN_PLANOS_PADRAO;
  var ordensFamilia = finOrdensFamilia(cadastro, d.irmaos);

  var R = {
    mes: finEhMes(mes) ? mes : '',
    regime: 'caixa',
    recebidoTotal: 0,
    aReceberTotal: 0,
    /* ATENÇÃO ao somar — os quatro totais NÃO se somam entre si:
       · recebidoTotal      — caixa de verdade (lançamentos).
       · aReceberTotal      — o que falta receber do que vence NESTE mês.
       · emAtrasoTotal      — PARTE de aReceberTotal cujo vencimento já passou.
                              É recorte, não parcela nova. Somar com aReceber
                              conta o mesmo dinheiro duas vezes.
       · inadimplenciaTotal — outra população: plano que VENCEU e ninguém
                              renovou. Não está em aReceber (não há vigência
                              neste mês para cobrar). Um mês por FILHOt. */
    emAtrasoTotal: 0,
    inadimplenciaTotal: 0,
    declaradoTotal: 0,
    porServico: {
      daycare:    { recebido: 0, aReceber: 0, emAtraso: 0, inadimplencia: 0, declarado: 0, quantos: 0 },
      auaulandia: { recebido: 0, aReceber: 0, emAtraso: 0, inadimplencia: 0, declarado: 0, quantos: 0 }
    },
    porFILHOt: [],
    inadimplentes: [],
    semComoCalcular: [],
    ordemPetSuposta: 0,
    ordemFamiliaResolvida: 0,
    propostasAbertas: { quantas: 0, total: 0 },
    avisos: []
  };
  if (!finEhMes(mes)) {
    R.avisos.push('Mês inválido — informe no formato AAAA-MM.');
    return R;
  }

  var ultimoDia = finUltimoDia(mes);
  var pgsDoMes = finPagamentosDoMes(d.pagamentos, mes);
  var pagoPorChave = finSomaPorChave(pgsDoMes);
  var temNoDePagamento = Object.keys(finObj(d.pagamentos)).length > 0;

  /* ---------------------------------------------------------- DAY CARE ---- */
  var chaves = Object.keys(cadastro), i, k, c, r, cat, meses, aulas, mensal, valorMes;
  for (i = 0; i < chaves.length; i++) {
    k = chaves[i];
    c = finObj(cadastro[k]);
    if (c.inativo === 'Sim') continue;                 /* saiu: não cobra */
    r = finObj(c.renov);
    cat = finCategoria(k, cadastro);
    /* Hóspede, avulso e morador não têm mensalidade. Moradores nunca geram
       cobrança (Adriana, 03/ago/2026). Não é buraco de dado: é a regra. */
    if (cat !== 'auluno') continue;
    if (!planos[r.plano]) {
      /* Auluno sem plano lançado: não some, mas também não some da tela. */
      R.semComoCalcular.push({ chave: k, nome: String(c.n || k.split('__')[0]),
        servico: 'daycare', motivo: 'auluno sem plano lançado (Silver/Gold/Black)' });
      continue;
    }
    if (!finEhISO(r.inicio)) {
      R.semComoCalcular.push({ chave: k, nome: String(c.n || k.split('__')[0]),
        servico: 'daycare', motivo: 'plano ' + r.plano + ' sem data de pagamento lançada' });
      continue;
    }
    aulas = finAulasDe(k, cadastro, peludinhos);
    if (aulas === null) {
      R.semComoCalcular.push({ chave: k, nome: String(c.n || k.split('__')[0]),
        servico: 'daycare', motivo: 'não há como saber quantas aulas por semana (sem renov.aulas e sem dias)' });
      continue;
    }
    /* Ordem de desconto: ordemPet explícito prevalece; sem ele, a família
       resolve sozinha (finOrdensFamilia); sem os dois, assume 1º e avisa. */
    var ordemExplicita = (r.ordemPet !== undefined && r.ordemPet !== null);
    var ordemFamilia = ordemExplicita ? undefined : ordensFamilia[k];
    var ordemUsada = ordemExplicita ? r.ordemPet : ordemFamilia;
    if (!ordemExplicita) {
      if (ordemFamilia !== undefined) R.ordemFamiliaResolvida++;
      else R.ordemPetSuposta++;
    }
    mensal = finMensalidade(planos, r.plano, aulas, ordemUsada, d.descontoIrmao);
    if (mensal === null) {
      R.semComoCalcular.push({ chave: k, nome: String(c.n || k.split('__')[0]),
        servico: 'daycare', motivo: 'a tabela de preços não tem valor para ' + r.plano + ' com ' + aulas + ' aula(s)' });
      continue;
    }
    meses = finMesesDoCompromisso(planos[r.plano].compromisso);
    var fim = finEhISO(r.fim) ? r.fim : finFimVigencia(r.inicio, meses);

    /* Este FILHOt entra neste mês? Regime caixa: o plano inteiro (mensal x
       meses do compromisso) cai no mês do pagamento — os meses seguintes do
       período não geram cobrança nova (decisão da Adriana, 02/set/2026). */
    var entra = (finMesDe(r.inicio) === mes);
    valorMes = entra ? mensal * (meses || 1) : 0;

    var pago = finCent(pagoPorChave[k]);
    var falta = valorMes - pago; if (falta < 0) falta = 0;

    /* Quando esta cobrança venceu: a própria data do pagamento declarada na ficha. */
    var venceEm = r.inicio;

    if (entra) {
      R.porServico.daycare.quantos++;
      R.porServico.daycare.recebido += pago;
      R.porServico.daycare.aReceber += falta;
      /* EM ATRASO é RECORTE do que falta: a parte cujo vencimento já passou.
         Nunca é uma parcela nova — somar com "a receber" contaria duas vezes. */
      if (hoje && falta > 0 && finEhISO(venceEm) && venceEm < hoje) {
        R.porServico.daycare.emAtraso += falta;
      }
      /* DECLARADO: renov.inicio afirma que houve pagamento neste mês, mas não
         há lançamento por trás. Fichas com plano_deduzido nunca contam aqui —
         a data veio de uma importação de planilha, não de alguém dizendo
         "o tutor pagou". */
      if (finMesDe(r.inicio) === mes && r.plano_deduzido !== true) {
        R.porServico.daycare.declarado += mensal * (meses || 1);
      }
      R.porFILHOt.push({
        chave: k,
        nome: String(c.n || k.split('__')[0]),
        tutor: String(c.tutor || k.split('__')[1] || ''),
        servico: 'daycare',
        plano: String(r.plano),
        compromisso: String(planos[r.plano].compromisso || ''),
        aulas: aulas,
        mensalidade: mensal,
        valor: valorMes,
        pago: pago,
        falta: falta,
        vigencia: { inicio: r.inicio, fim: fim },
        venceEm: finEhISO(venceEm) ? venceEm : '',
        ordemPet: ordemExplicita ? parseInt(r.ordemPet, 10) : (ordemFamilia !== undefined ? ordemFamilia : 1),
        ordemPetSuposta: (!ordemExplicita && ordemFamilia === undefined),
        resolvidoPorFamilia: (!ordemExplicita && ordemFamilia !== undefined),
        planoDeduzido: r.plano_deduzido === true,
        /* "parcial" saiu da conta (Adriana, 02/set/2026) — só existe pago/aberto. */
        situacao: falta === 0 ? 'pago' : 'aberto'
      });
    }

    /* INADIMPLENTE: a vigência acabou antes do fim deste mês e ninguém
       renovou. É o "Em débito" do menu. População SEPARADA de "a receber" —
       não há vigência neste mês para cobrar, então este valor NÃO entra na
       soma do mês. O valor devido é o de UM mês: afirmar mais seria inventar. */
    if (finEhISO(fim) && ultimoDia && fim < ultimoDia && finMesDe(r.inicio) <= mes) {
      R.inadimplentes.push({
        chave: k,
        nome: String(c.n || k.split('__')[0]),
        tutor: String(c.tutor || k.split('__')[1] || ''),
        servico: 'daycare',
        plano: String(r.plano),
        venceuEm: fim,
        valorDeUmMes: mensal,
        /* Plano vencido: NÃO está em aReceberTotal (não há vigência no mês). */
        tipo: 'plano-vencido',
        contaEmAReceber: false,
        planoDeduzido: r.plano_deduzido === true
      });
      R.porServico.daycare.inadimplencia += mensal;
    }
  }

  /* -------------------------------------------------------- AUAULÂNDIA ---- */
  /* O dinheiro da hospedagem é UM por reserva (a linha do financeiro é uma
     só — o próprio app escreve assim na planilha). Por isso a linha aqui é
     por ORÇAMENTO, não por FILHOt.
     · parcela1 (a reserva) vence quando o orçamento é FECHADO (status_em).
     · parcela2 vence no dia da ENTRADA.
     Só orçamento FECHADO é cobrança. 'aguardando' é proposta, 'nao_fechou' e
     'cancelado' não são dinheiro nenhum. */
  var ids = Object.keys(orcamentos), t, orc, nomes, pets, z2, dtRes, chaveOrc, pagoOrc;
  for (i = 0; i < ids.length; i++) {
    t = ids[i];
    orc = finObj(orcamentos[t]);
    var st = String(orc.status || 'aguardando');
    pets = finLista(orc.pets);
    nomes = [];
    for (z2 = 0; z2 < pets.length; z2++) if (pets[z2] && pets[z2].nome) nomes.push(String(pets[z2].nome));

    if (st === 'aguardando') {
      /* Proposta em aberto: aparece à parte, NUNCA soma em "a receber". */
      if (finMesDe(finISODeTs(orc.criado_em)) === mes) {
        R.propostasAbertas.quantas++;
        R.propostasAbertas.total += finCent(orc.total_cent);
      }
      continue;
    }
    if (st !== 'fechado') continue;

    dtRes = finISODeTs(orc.status_em);
    if (!dtRes) dtRes = finISODeTs(orc.criado_em);
    chaveOrc = 'orc:' + t;
    pagoOrc = finCent(pagoPorChave[chaveOrc]);

    var parc = [];
    if (finMesDe(dtRes) === mes) parc.push({ qual: 'reserva', valor: finCent(orc.parcela1_cent), vence: dtRes });
    if (finMesDe(orc.entrada) === mes) parc.push({ qual: 'no dia', valor: finCent(orc.parcela2_cent), vence: orc.entrada });
    if (!parc.length) continue;

    var devidoOrc = 0;
    for (z2 = 0; z2 < parc.length; z2++) devidoOrc += parc[z2].valor;
    /* Orçamento antigo sem a quebra em parcelas: o total é a única verdade. */
    if (!devidoOrc && finMesDe(dtRes) === mes) devidoOrc = finCent(orc.total_cent);
    if (!devidoOrc) continue;

    var faltaOrc = devidoOrc - pagoOrc; if (faltaOrc < 0) faltaOrc = 0;
    R.porServico.auaulandia.quantos++;
    R.porServico.auaulandia.recebido += pagoOrc;
    R.porServico.auaulandia.aReceber += faltaOrc;

    R.porFILHOt.push({
      chave: chaveOrc,
      nome: nomes.length ? nomes.join(' e ') : 'reserva sem FILHOt nomeado',
      tutor: String(orc.tutor || ''),
      servico: 'auaulandia',
      plano: 'hospedagem',
      compromisso: '',
      aulas: null,
      mensalidade: null,
      valor: devidoOrc,
      pago: pagoOrc,
      falta: faltaOrc,
      vigencia: { inicio: String(orc.entrada || ''), fim: String(orc.saida || '') },
      parcelas: parc,
      totalDaReserva: finCent(orc.total_cent),
      ordemPet: null,
      ordemPetSuposta: false,
      planoDeduzido: false,
      /* "parcial" saiu da conta (Adriana, 02/set/2026) — só existe pago/aberto. */
      situacao: faltaOrc === 0 ? 'pago' : 'aberto'
    });

    /* Parcela vencida dentro deste mês e sem lançamento = atraso. */
    if (hoje && faltaOrc > 0) {
      var venceuTudo = true;
      for (z2 = 0; z2 < parc.length; z2++) if (parc[z2].vence >= hoje) venceuTudo = false;
      if (venceuTudo) {
        R.inadimplentes.push({
          chave: chaveOrc,
          nome: nomes.length ? nomes.join(' e ') : 'reserva sem FILHOt nomeado',
          tutor: String(orc.tutor || ''),
          servico: 'auaulandia',
          plano: 'hospedagem',
          venceuEm: parc[parc.length - 1].vence,
          valorDeUmMes: faltaOrc,
          /* Esta parcela JÁ ESTÁ dentro de aReceberTotal — é recorte dele. */
          tipo: 'parcela-vencida',
          contaEmAReceber: true,
          planoDeduzido: false
        });
        R.porServico.auaulandia.emAtraso += faltaOrc;
      }
    }
  }

  /* ------------------------------------------------------------- totais ---- */
  R.recebidoTotal = R.porServico.daycare.recebido + R.porServico.auaulandia.recebido;
  R.aReceberTotal = R.porServico.daycare.aReceber + R.porServico.auaulandia.aReceber;
  R.emAtrasoTotal = R.porServico.daycare.emAtraso + R.porServico.auaulandia.emAtraso;
  R.inadimplenciaTotal = R.porServico.daycare.inadimplencia + R.porServico.auaulandia.inadimplencia;
  R.declaradoTotal = R.porServico.daycare.declarado + R.porServico.auaulandia.declarado;

  /* Ordem: quem deve mais primeiro; empate resolve pelo nome. */
  R.porFILHOt.sort(function (a, b) {
    if (a.falta !== b.falta) return b.falta - a.falta;
    return String(a.nome).localeCompare(String(b.nome), 'pt');
  });
  R.inadimplentes.sort(function (a, b) {
    if (a.venceuEm !== b.venceuEm) return String(a.venceuEm).localeCompare(String(b.venceuEm));
    return String(a.nome).localeCompare(String(b.nome), 'pt');
  });

  /* --------------------------------------------------------- os avisos ---- */
  /* O dashboard NUNCA mostra um total sem dizer de que ele é feito. */
  if (!temNoDePagamento) {
    R.avisos.push('Não existe registro de pagamento recebido no sistema. ' +
      '"Recebido" fica em ' + finBRL(0) + ' até alguém lançar o primeiro pagamento em Planos e cobranças.');
  }
  if (R.declaradoTotal > 0) {
    R.avisos.push('Há ' + finBRL(R.declaradoTotal) + ' com data de pagamento lançada na ficha, ' +
      'mas sem lançamento de recebimento por trás. É declaração, não é caixa.');
  }
  if (R.ordemPetSuposta > 0) {
    R.avisos.push(R.ordemPetSuposta + ' FILHOt(s) sem o "Nº do peludinho na família" gravado e sem ' +
      'vínculo de irmãos cadastrado. A conta assumiu 1º (sem desconto) — se algum for 2º ou 3º, ' +
      'o valor está ALTO em 7% ou 12%.');
  }
  if (R.ordemFamiliaResolvida > 0) {
    R.avisos.push(R.ordemFamiliaResolvida + ' FILHOt(s) sem o "Nº do peludinho na família" tiveram a ' +
      'ordem de desconto resolvida automaticamente pelo vínculo de irmãos (daycare/irmaos).');
  }
  if (R.semComoCalcular.length) {
    R.avisos.push(R.semComoCalcular.length + ' FILHOt(s) ficaram FORA da soma por falta de dado. ' +
      'Estão listados em "sem como calcular" — não foram estimados.');
  }
  return R;
}

/* Exposição em Node (harness) sem quebrar no navegador. */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    finBRL: finBRL, finCent: finCent, finChave: finChave,
    finMesDe: finMesDe, finISODeTs: finISODeTs,
    finPrimeiroDia: finPrimeiroDia, finUltimoDia: finUltimoDia,
    finMesesDoCompromisso: finMesesDoCompromisso,
    finFimVigencia: finFimVigencia, finMesesDaVigencia: finMesesDaVigencia,
    finMensalidade: finMensalidade, finAulasDe: finAulasDe, finCategoria: finCategoria,
    finGruposFamilia: finGruposFamilia, finOrdensFamilia: finOrdensFamilia,
    finPagamentosDoMes: finPagamentosDoMes, finSomaPorChave: finSomaPorChave,
    finLancamentoValido: finLancamentoValido,
    finResumoMes: finResumoMes,
    FIN_PLANOS_PADRAO: FIN_PLANOS_PADRAO, FIN_DESC_IRMAO: FIN_DESC_IRMAO
  };
}
