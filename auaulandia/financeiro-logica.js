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
 *                       quando?, plano_deduzido?, plano_deduzido_meses?,
 *                       dias_mes?}
 *                      `inicio` é rotulado na tela como "Data do pagamento".
 *                      `dias_mes` (desde 06/out/2026, Story 6.30): os dias da
 *                      semana de CADA mês do plano — ver "plano com dias
 *                      diferentes em cada mês", mais abaixo (Story 6.36).
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
 *  Nó de pagamentos (ver docs/FINANCEIRO-DASHBOARD.md) — desde 07/set/2026 a tela
 *  "Lançar pagamento" (index.html, v-10) grava nele:
 *    daycare/pagamentos/{AAAA-MM}/{id} =
 *      {chave, servico, valor_cent, data, forma, plano, ref, quem, ts}
 *  ESTORNO (só gestão/diretoria): o registro NUNCA some — ganha
 *  {estornado:true, estorno_motivo, estorno_quem, estorno_ts} e sai de toda soma
 *  (finPagamentosDoMes pula estornados). Histórico intocável, conta limpa.
 *
 * ---------------------------------------------------------------------------
 * AS 3 DECISÕES DA ADRIANA (02/set/2026) — as 3 perguntas do
 * docs/FINANCEIRO-DASHBOARD.md § 5 têm resposta. Este arquivo obedece:
 *
 *  1. TRIMESTRAL/SEMESTRAL É PAGO TODO À VISTA NA RENOVAÇÃO. O valor do
 *     período inteiro (mensalidade × meses do compromisso; no plano com dias
 *     diferentes em cada mês, a soma mês a mês — Story 6.36) entra inteiro no
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
      /* Estornado NÃO é caixa: o registro fica no nó (com quem estornou e por quê),
         mas o valor sai de TODA soma — recebido, pago por chave, situação. */
      if (p.estornado === true) continue;
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

/* ------------------------------- plano com dias diferentes em cada mês (6.36) */

/* O CASO DA HOPI (Adriana, 05/out/2026; Story 6.36):
 *   "Ela foi fechado a creche trimestral 718, mais duas vezes por semana de 589.
 *    Então, ficou o total de 1.307 o plano."
 *
 * Desde a Story 6.30 o plano gravado pode trazer renov.dias_mes: os dias da semana de
 * CADA mês do plano ([["seg"],["seg"],["seg","qua"]] — o índice 0 é o Mês 1). Só existe
 * no trimestral (3 meses) e no semestral (6). renov.aulas continua gravado, mas é SÓ o
 * Mês 1: quem calcular o plano por ele erra (a Hopi daria R$ 1.077,00 — R$ 230,00 a
 * menos que o combinado).
 *
 * O VALOR DO PLANO é a SOMA MÊS A MÊS da tabela: a mensalidade de cada mês pela
 * quantidade de dias daquele mês, com o desconto do Nº na família aplicado e
 * ARREDONDADO EM CADA MÊS (finMensalidade, a mesma fórmula do app). É a conta da aba
 * Plano (renovValorDoPlano, no index.html), centavo por centavo. Quando os meses são
 * iguais, dá o mesmo centavo que "mensalidade x meses" do caminho de sempre.
 *
 * Este arquivo roda ANTES do index.html e não enxerga as funções dele. Por isso a regra
 * de validade dos dias por mês e a conta das datas de cada mês estão REPLICADAS aqui,
 * passo a passo, das funções do app: renovMesesN, renovDiasMesSaneado, renovMesesDatas,
 * renovMesesDoPlano, renovDiasMesValido, renovMeioMesVale, mmMesDe, mmMesSeguinteDe,
 * renovPrimeiroDoMesSeguinte, addMesesISO e addDiasISO. A paridade é provada no harness
 * (v-50, H5) e na Fase 0 (bloco 6.36): mudar uma sem mudar a outra derruba a prova.
 */
var FIN_ORDEM_DIAS = ['seg', 'ter', 'qua', 'qui', 'sex'];

/* "Parece data" com a MESMA régua do app: /^\d{4}-\d{2}-\d{2}$/.test(x||''). */
function finPareceISO(x) { return /^\d{4}-\d{2}-\d{2}$/.test(x || ''); }

/* Espelho de addDiasISO do app: soma dias pelo calendário local. */
function finAddDiasISO(iso, n) {
  if (!finPareceISO(iso)) return '';
  var a = iso.split('-');
  var d = new Date(Number(a[0]), Number(a[1]) - 1, Number(a[2]));
  d.setDate(d.getDate() + n);
  return d.getFullYear() + '-' + finPad2(d.getMonth() + 1) + '-' + finPad2(d.getDate());
}

/* Espelho de addMesesISO do app: 31/01 + 1 mês = 28/02, não 03/03. */
function finAddMesesISO(iso, n) {
  if (!finPareceISO(iso)) return '';
  var a = iso.split('-');
  var d = new Date(Number(a[0]), Number(a[1]) - 1, Number(a[2]));
  var dia = d.getDate();
  d.setMonth(d.getMonth() + n);
  if (d.getDate() < dia) d.setDate(0);
  return d.getFullYear() + '-' + finPad2(d.getMonth() + 1) + '-' + finPad2(d.getDate());
}

/* Espelho de mmMesDe do app ('AAAA-MM-DD' -> 'AAAA-MM'). */
function finMmMesDe(iso) { return finPareceISO(iso) ? String(iso).slice(0, 7) : ''; }

/* Espelho de mmMesSeguinteDe do app ('2026-12-05' -> '2027-01'). */
function finMesSeguinteDe(iso) {
  if (!finPareceISO(iso)) return '';
  var a = iso.split('-');
  var ano = Number(a[0]), m = Number(a[1]);
  return ((m === 12) ? ano + 1 : ano) + '-' + finPad2((m === 12) ? 1 : m + 1);
}

/* Espelho de renovPrimeiroDoMesSeguinte do app. */
function finPrimeiroDoMesSeguinte(iso) { var m = finMesSeguinteDe(iso); return m ? (m + '-01') : ''; }

/* Espelho de renovMeioMesVale do app: o registro de "começou no meio do mês" só vale
   quando é do MESMO mês da data do pagamento. */
function finMeioMesVale(r) {
  var reg = (r && r.meio_mes && typeof r.meio_mes === 'object') ? r.meio_mes : null;
  if (!reg || !r.inicio) return null;
  if (!finMmMesDe(reg.inicio) || finMmMesDe(reg.inicio) !== finMmMesDe(r.inicio)) return null;
  return reg;
}

/* Espelho de renovMesesN do app: quantos meses o plano tem para dias por mês — 3 no
   trimestral, 6 no semestral; 0 quando não cabe (mensal, plano fora da tabela).
   `planos` é a tabela que o app entrega (planos()). */
function finMesesN(planos, r) {
  try {
    var pl = finObj(planos)[(r || {}).plano];
    var n = pl ? (FIN_PLANO_MESES[pl.compromisso] || 0) : 0;
    return n > 1 ? n : 0;
  } catch (e) { return 0; } /* sem a tabela de planos não há meses para contar */
}

/* Espelho de renovDiasMesSaneado do app. Dado do banco é dado, não ordem: aceita lista
   ou objeto de chaves numéricas (o Firebase devolve qualquer um dos dois), tira dia
   desconhecido, repetido e fora de ordem. null quando não fecha com o plano (outro
   número de meses, mês sem dia). */
function finDiasMesSaneado(L, n) {
  if (!L || typeof L !== 'object' || !(n > 1)) return null;
  var tam = finEhLista(L) ? L.length : Object.keys(L).length;
  if (tam !== n) return null;
  var out = [], i, j, m, arr, ks, dias;
  for (i = 0; i < n; i++) {
    m = L[i]; if (m == null) m = L[String(i)];
    if (!m || typeof m !== 'object') return null;
    if (finEhLista(m)) arr = m;
    else { arr = []; ks = Object.keys(m); for (j = 0; j < ks.length; j++) arr.push(m[ks[j]]); }
    dias = [];
    for (j = 0; j < FIN_ORDEM_DIAS.length; j++) if (arr.indexOf(FIN_ORDEM_DIAS[j]) >= 0) dias.push(FIN_ORDEM_DIAS[j]);
    if (!dias.length) return null;
    out.push(dias);
  }
  return out;
}

/* Espelho de renovMesesDatas do app: as DATAS de cada mês do plano, [{n, de, ate}] ou []
   (sem como valer: não inventa). O Mês 1 começa no começo do período; os seguintes
   contam da âncora, sempre a partir dela (nunca em cadeia). Quem começou no meio do mês
   tem a âncora no dia 1º do primeiro mês cobrado. O último mês termina no fim da
   vigência. ATENÇÃO: o começo do PERÍODO (que pode não ser o dia do pagamento) só serve
   aqui, para as datas dos meses — o mês do DINHEIRO continua sendo o de renov.inicio. */
function finMesesDatas(planos, r) {
  try {
    r = r || {};
    var n = finMesesN(planos, r); if (!n) return [];
    var ini = r.vig_inicio || r.inicio;
    if (!finPareceISO(ini) || !finPareceISO(r.fim)) return [];
    var ancora = finMeioMesVale(r)
      ? (/^\d{4}-\d{2}$/.test(r.mes_cobranca_1 || '') ? (r.mes_cobranca_1 + '-01') : finPrimeiroDoMesSeguinte(r.inicio))
      : ini;
    if (!finPareceISO(ancora)) return [];
    var out = [], i, de, ate;
    for (i = 0; i < n; i++) {
      de = (i === 0) ? ini : finAddMesesISO(ancora, i);
      ate = (i === n - 1) ? r.fim : finAddDiasISO(finAddMesesISO(ancora, i + 1), -1);
      if (!finPareceISO(de) || !finPareceISO(ate) || de > ate || ate > r.fim) return [];
      out.push({ n: i + 1, de: de, ate: ate });
    }
    return out;
  } catch (e) { return []; } /* data torta no banco vira "sem meses" — nunca uma data inventada */
}

/* Espelho de renovMesesDoPlano do app: os meses do plano com os dias de cada um,
   [{n, de, ate, dias}], ou [] quando o plano não tem dias por mês válidos. */
function finMesesDoPlano(planos, r) {
  r = r || {};
  if (!r.dias_mes) return [];
  var n = finMesesN(planos, r); if (!n) return [];
  var dm = finDiasMesSaneado(r.dias_mes, n); if (!dm) return [];
  var D = finMesesDatas(planos, r); if (D.length !== n) return [];
  var out = [], i;
  for (i = 0; i < n; i++) out.push({ n: D[i].n, de: D[i].de, ate: D[i].ate, dias: dm[i].slice() });
  return out;
}

/* Espelho de renovDiasMesValido do app. */
function finDiasMesValidos(planos, r) { return finMesesDoPlano(planos, r).length > 0; }

/* finValorDoPlano — espelho de renovValorDoPlano do app, com a fórmula do Financeiro
   (finMensalidade, a mesma do app): o valor de cada mês pela quantidade de dias daquele
   mês, com o desconto do Nº na família aplicado e arredondado EM CADA MÊS, e a soma.
   Devolve {total, porMes:[{aulas, valor}], falta}: falta = o índice do 1º mês sem dia
   ou sem preço na tabela, -1 quando a conta fecha. Com falta, total = 0 — nunca uma
   soma pela metade. `diasMes` é a lista JÁ SANEADA (finMesesDoPlano). */
function finValorDoPlano(planos, planoKey, diasMes, ordemPet, descontos) {
  var L = finLista(diasMes), porMes = [], total = 0, falta = -1, i, n, v;
  for (i = 0; i < L.length; i++) {
    n = (L[i] || []).length;
    v = n ? finMensalidade(planos, planoKey, Math.min(5, n), ordemPet || 1, descontos) : 0;
    if (v === null) v = 0;               /* sem preço na tabela: o mês não fecha */
    porMes.push({ aulas: n, valor: v });
    if (!(v > 0) && falta < 0) falta = i;
    total += v;
  }
  return { total: (falta < 0 ? total : 0), porMes: porMes, falta: falta };
}

/* Por que os dias por mês gravados não valem — o motivo escrito do "sem como calcular".
   '' quando valem. Cada frase aponta o que conferir na ficha (aba Plano). */
function finDiasMesMotivo(planos, r) {
  r = finObj(r);
  var pre = 'plano ' + r.plano + ' com dias diferentes em cada mês: ';
  var fim = ' — confira na ficha, aba Plano';
  var n = finMesesN(planos, r);
  if (!n) return pre + 'só o trimestral e o semestral têm dias próprios em cada mês' + fim;
  var L = r.dias_mes;
  if (!L || typeof L !== 'object') return pre + 'os dias de cada mês gravados não são uma lista de meses' + fim;
  var tam = finEhLista(L) ? L.length : Object.keys(L).length;
  if (tam !== n) return pre + 'há dias gravados para ' + tam + (tam === 1 ? ' mês' : ' meses') +
    ', mas o plano tem ' + n + ' meses' + fim;
  if (!finDiasMesSaneado(L, n)) {
    var i, m, ruim = 0;
    for (i = 0; i < n; i++) {
      m = L[i]; if (m == null) m = L[String(i)];
      if (!finDiasMesSaneado([m, ['seg']], 2)) { ruim = i + 1; break; }
    }
    return pre + (ruim ? ('o Mês ' + ruim + ' está sem dia da semana válido (segunda a sexta)')
      : 'os dias de cada mês gravados não fecham com o plano') + fim;
  }
  if (finMesesDatas(planos, r).length !== n) {
    return pre + 'as datas dos meses não fecham (data do pagamento, fim do plano ou começo no meio do mês)' + fim;
  }
  return '';
}

/* As aulas da ROTINA (os dias do alto da ficha; senão os do array-mestre) — o que volta a
   valer quando o plano com dias por mês vence sem renovação. É o finAulasDe SEM o
   renov.aulas (que, nesse plano, é só o Mês 1). null quando não há dias em lugar nenhum. */
function finAulasRotina(chave, cadastro, peludinhos) {
  var c = finObj(finObj(cadastro)[chave]);
  var so = {};
  so[chave] = { dias: c.dias };
  return finAulasDe(chave, so, peludinhos);
}

/* A linha do mês de UM FILHOt com plano de dias por mês (chamada SÓ pelo finResumoMes,
   quando renov.dias_mes existe). Mexe em R do mesmo jeito que o caminho de sempre:
   porServico, porFILHOt, inadimplentes, semComoCalcular e os contadores de ordem.
   X = {planos, cadastro, peludinhos, ordensFamilia, descontos, mes, ultimoDia, hoje, pagoPorChave} */
function finResumoDiasMes(R, k, c, r, X) {
  var nome = String(c.n || k.split('__')[0]);
  var M = finMesesDoPlano(X.planos, r);
  if (!M.length) {
    /* Dado torto (outro número de meses, mês sem dia, data que não fecha): FORA de toda
       soma, com o motivo escrito — nunca um valor inventado. */
    R.semComoCalcular.push({ chave: k, nome: nome, servico: 'daycare', motivo: finDiasMesMotivo(X.planos, r) });
    return;
  }
  /* Ordem de desconto: a MESMA regra do caminho de sempre (finResumoMes) — ordemPet
     explícito prevalece; sem ele, a família resolve sozinha; sem os dois, 1º com aviso. */
  var ordemExplicita = (r.ordemPet !== undefined && r.ordemPet !== null);
  var ordemFamilia = ordemExplicita ? undefined : X.ordensFamilia[k];
  var ordemUsada = ordemExplicita ? r.ordemPet : ordemFamilia;
  if (!ordemExplicita) {
    if (ordemFamilia !== undefined) R.ordemFamiliaResolvida++;
    else R.ordemPetSuposta++;
  }
  var dias = [], i;
  for (i = 0; i < M.length; i++) dias.push(M[i].dias);
  var V = finValorDoPlano(X.planos, r.plano, dias, ordemUsada, X.descontos);
  if (V.falta >= 0) {
    R.semComoCalcular.push({ chave: k, nome: nome, servico: 'daycare',
      motivo: 'a tabela de preços não tem valor para ' + r.plano + ' com ' + V.porMes[V.falta].aulas +
        ' aula(s) no Mês ' + (V.falta + 1) + ' (plano com dias diferentes em cada mês)' });
    return;
  }
  var fim = String(M[M.length - 1].ate);     /* o último mês termina no fim da vigência */
  var pl = X.planos[r.plano];

  /* Regime caixa, como o caminho de sempre: o plano inteiro (a soma dos meses) cai no
     mês do pagamento; os meses seguintes do período não geram cobrança nova. */
  var entra = (finMesDe(r.inicio) === X.mes);
  var valorMes = entra ? V.total : 0;
  var vgD = finValorGravado(r);                   /* 6.44: o valor gravado no fechamento */
  if (entra && vgD) valorMes = vgD;
  var pago = finCent(X.pagoPorChave[k]);
  var falta = valorMes - pago; if (falta < 0) falta = 0;
  var venceEm = r.inicio;

  if (entra) {
    R.porServico.daycare.quantos++;
    R.porServico.daycare.recebido += pago;
    R.porServico.daycare.aReceber += falta;
    if (X.hoje && falta > 0 && finEhISO(venceEm) && venceEm < X.hoje) {
      R.porServico.daycare.emAtraso += falta;
    }
    if (r.plano_deduzido !== true) R.porServico.daycare.declarado += (vgD || V.total);
    var aulasPorMes = [], valorPorMes = [], meses = [], rotA = [], rotV = [];
    for (i = 0; i < M.length; i++) {
      aulasPorMes.push(V.porMes[i].aulas);
      valorPorMes.push(V.porMes[i].valor);
      meses.push({ n: M[i].n, de: M[i].de, ate: M[i].ate, dias: M[i].dias.slice(),
        aulas: V.porMes[i].aulas, valor: V.porMes[i].valor });
      rotA.push(V.porMes[i].aulas + 'x');
      rotV.push(finBRL(V.porMes[i].valor));
    }
    R.porFILHOt.push({
      chave: k,
      nome: nome,
      tutor: String(c.tutor || k.split('__')[1] || ''),
      servico: 'daycare',
      plano: String(r.plano),
      compromisso: String(pl.compromisso || ''),
      /* Não existe UMA quantidade de aulas nem UMA mensalidade: cada mês tem a sua
         (aulasPorMes, valorPorMes). null aqui impede que alguém multiplique o Mês 1. */
      aulas: null,
      mensalidade: null,
      valor: valorMes,
      pago: pago,
      falta: falta,
      vigencia: { inicio: r.inicio, fim: fim },
      venceEm: finEhISO(venceEm) ? venceEm : '',
      ordemPet: ordemExplicita ? parseInt(r.ordemPet, 10) : (ordemFamilia !== undefined ? ordemFamilia : 1),
      ordemPetSuposta: (!ordemExplicita && ordemFamilia === undefined),
      resolvidoPorFamilia: (!ordemExplicita && ordemFamilia !== undefined),
      planoDeduzido: r.plano_deduzido === true,
      situacao: falta === 0 ? 'pago' : 'aberto',
      /* Para quem confere: os dias e o valor de cada mês. */
      diasPorMes: true,
      aulasPorMes: aulasPorMes,
      valorPorMes: valorPorMes,
      mesesDoPlano: meses,
      aulasRotulo: rotA.join(', '),
      detalheMeses: rotA.join(', ') + ' — ' + rotV.join(' + ')
    });
    if (vgD) R.porFILHOt[R.porFILHOt.length - 1].valorGravado = true;   /* 6.44 */
  }

  /* VENCEU SEM RENOVAÇÃO: o que volta a valer é a ROTINA (os dias do alto da ficha) —
     resposta recomendada da pergunta 4 do desenho. O valor de UM mês é o da rotina, não
     o do último mês do plano. Sem como saber a rotina: fora da soma, com o motivo. */
  if (finEhISO(fim) && X.ultimoDia && fim < X.ultimoDia && finMesDe(r.inicio) <= X.mes) {
    var aulasRot = finAulasRotina(k, X.cadastro, X.peludinhos);
    var mensalRot = (aulasRot === null) ? null : finMensalidade(X.planos, r.plano, aulasRot, ordemUsada, X.descontos);
    if (mensalRot === null) {
      R.semComoCalcular.push({ chave: k, nome: nome, servico: 'daycare',
        motivo: (aulasRot === null)
          ? ('o plano ' + r.plano + ' com dias diferentes em cada mês venceu sem renovação e a ficha não tem os dias da rotina (os do alto da ficha) para o valor de um mês')
          : ('a tabela de preços não tem valor para ' + r.plano + ' com ' + aulasRot + ' aula(s) — a rotina, que volta a valer depois do plano com dias diferentes em cada mês') });
      return;
    }
    R.inadimplentes.push({
      chave: k,
      nome: nome,
      tutor: String(c.tutor || k.split('__')[1] || ''),
      servico: 'daycare',
      plano: String(r.plano),
      venceuEm: fim,
      valorDeUmMes: mensalRot,
      tipo: 'plano-vencido',
      contaEmAReceber: false,
      planoDeduzido: r.plano_deduzido === true,
      pelaRotina: true
    });
    R.porServico.daycare.inadimplencia += mensalRot;
  }
}

/* ------------------------------------------------- o valor fechado e as renovações (6.44) */

/* O VALOR GRAVADO NO FECHAMENTO (Story 6.44 — Adriana, 07/out/2026: "o valor do plano total
   fechado"). Desde a 6.44, o Confirmar da aba Plano grava renov.valor_plano_cent — o que a
   casa fechou com o tutor naquele dia. Ele vale mais que a tabela de hoje: o mês fechado não
   muda se o preço mudar depois. Ficha sem esse campo: 0, e vale a conta de sempre. */
function finValorGravado(r) {
  var v = finObj(r).valor_plano_cent;
  return (typeof v === 'number' && isFinite(v) && v > 0) ? Math.round(v) : 0;
}

/* O plano que entrou no lugar de outro é CORREÇÃO dele (e não renovação) quando tem a mesma
   data de pagamento, o mesmo fim, ou começa antes ou no mesmo dia — a mesma regra do
   renovEhCorrecao do app. Sem data no que entrou (virou morador, ficha zerada), o antigo
   valeu: não é correção. */
function finEhCorrecaoDe(antigo, novo) {
  var a = finObj(antigo), n = finObj(novo);
  var aIni = String(a.vig_inicio || a.inicio || ''), nIni = String(n.vig_inicio || n.inicio || '');
  if (!finEhISO(aIni) || !finEhISO(nIni)) return false;
  if (String(a.inicio || '') === String(n.inicio || '')) return true;
  /* "O mesmo fim" é o do dia em que o plano entrou: o registro do "Começou no meio do mês"
     estica o fim DEPOIS do Confirmar e guarda o de antes em fim_anterior. */
  if (finEhISO(a.fim) && (String(n.fim || '') === String(a.fim) || String(n.fim_anterior || '') === String(a.fim))) return true;
  return nIni <= aIni;
}

/* AS RENOVAÇÕES ANTERIORES QUE FORAM PAGAMENTO (6.44). Renovar manda o plano anterior para
   renov_hist, e o Financeiro lia só o atual: o pagamento anterior sumia do mês em que entrou.
   Aqui entram as que foram renovação de verdade, na ordem em que saíram. Ficam de fora a
   renovação DESFEITA (não aconteceu) e o plano CORRIGIDO (o pagamento é o mesmo do que entrou
   no lugar dele — contar os dois seria contar duas vezes): o que o Confirmar gravou como
   "correção" e, nos registros de antes da 6.44, o que a regra do app reconhece como correção. */
function finRenovHistContados(c) {
  var cc = finObj(c), h = finObj(cc.renov_hist), ids = Object.keys(h), todos = [], i, o;
  for (i = 0; i < ids.length; i++) {
    o = finObj(h[ids[i]]);
    if (!o.plano && !o.inicio) continue;
    todos.push(o);
  }
  todos.sort(function (a, b) { return (Number(a.substituidoEm) || 0) - (Number(b.substituidoEm) || 0); });
  var atual = finObj(cc.renov);
  /* A VERSÃO FINAL do pagamento que entrou no lugar (QA da 6.44): o que veio depois com a MESMA
     data de pagamento é o mesmo pagamento corrigido. É com a última versão dele que se decide
     se o anterior foi renovação ou correção — o plano gravado errado antes da 6.20 ("30/09 até
     30/09", o mesmo fim do anterior) e refeito depois ("de 01/10 até 31/10") não apaga o
     pagamento de antes. */
  function versaoFinal(seq, j) {
    while (j + 1 < seq.length && String(seq[j + 1].inicio || '') === String(seq[j].inicio || '')) j++;
    return seq[j];
  }
  /* Os planos que valeram: sem os desfeitos e sem o que o Confirmar disse que foi correção. */
  var cadeia = [];
  for (i = 0; i < todos.length; i++) {
    if (String(todos[i].motivo || '') === 'desfeita') continue;
    /* Desde a 6.44 o Confirmar diz no histórico quando foi correção: fica de fora sem adivinhar. */
    if (String(todos[i].motivo || '') === 'correção') continue;
    cadeia.push(todos[i]);
  }
  var seq = cadeia.concat([atual]), out = [], vistos = {};
  /* Um pagamento por data: a data do plano atual e a de um já contado não contam de novo. */
  if (finEhISO(atual.inicio)) vistos[atual.inicio] = true;
  for (i = 0; i < cadeia.length; i++) {
    o = cadeia[i];
    if (finEhCorrecaoDe(o, versaoFinal(seq, i + 1))) continue;
    if (vistos[o.inicio]) continue;
    vistos[o.inicio] = true;
    out.push(o);
  }
  /* O "DESFEITO" QUE FOI PAGAMENTO (QA da 6.44): desfazer e desfazer de novo (para trazer de
     volta a renovação) gravava o plano pago como "desfeita". O desfeito de verdade é sempre
     o plano novo que voltou para um anterior (o que entrou no lugar dele começa antes, ou é o
     mesmo pagamento); o que foi trocado por um plano que começa DEPOIS foi renovado, e conta. */
  var todosSeq = todos.concat([atual]);
  for (i = 0; i < todos.length; i++) {
    o = todos[i];
    if (String(o.motivo || '') !== 'desfeita') continue;
    if (finEhCorrecaoDe(o, versaoFinal(todosSeq, i + 1))) continue;
    if (vistos[o.inicio]) continue;
    vistos[o.inicio] = true;
    out.push(o);
  }
  /* Do pagamento mais antigo para o mais novo: é nessa ordem que o dinheiro lançado é gasto. */
  out.sort(function (a, b) { return String(a.inicio || '') < String(b.inicio || '') ? -1 : (String(a.inicio || '') > String(b.inicio || '') ? 1 : 0); });
  return out;
}

/* A renovação anterior no mês em que foi paga (6.44). Só entra no mês do pagamento dela: não
   gera inadimplência (o plano atual é quem responde por isso) nem cobrança fora do mês. O
   valor é o gravado no fechamento; sem ele, a tabela, com as aulas e o nº na família DAQUELE
   plano. O pagamento lançado do FILHOt é gasto aqui primeiro (pagoPorChave diminui), para o
   plano atual não usar o mesmo dinheiro duas vezes.
   X = {planos, cadastro, peludinhos, ordensFamilia, descontos, mes, hoje, pagoPorChave} */
function finResumoHistorico(R, k, c, h, X) {
  if (finMesDe(h.inicio) !== X.mes) return;
  var nome = String(c.n || k.split('__')[0]);
  var pl = X.planos[h.plano];
  if (!pl) {
    R.semComoCalcular.push({ chave: k, nome: nome, servico: 'daycare',
      motivo: 'renovação anterior com o plano "' + String(h.plano || '') + '", que não está na tabela' });
    return;
  }
  var ordemExplicita = (h.ordemPet !== undefined && h.ordemPet !== null);
  var ordemUsada = ordemExplicita ? h.ordemPet : X.ordensFamilia[k];
  var meses = finMesesDoCompromisso(pl.compromisso);
  var nAulas = parseInt(h.aulas, 10);
  var aulas = (nAulas >= 1) ? Math.min(5, nAulas) : null;
  var mensal = null, valor = finValorGravado(h), i, rotA = [];
  if (h.dias_mes) {
    /* Plano com dias diferentes em cada mês: não existe UMA quantidade de aulas (como no plano
       atual, aulas fica null) — o rótulo diz as de cada mês. */
    aulas = null;
    var M = finMesesDoPlano(X.planos, h), dias = [];
    for (i = 0; i < M.length; i++) { dias.push(M[i].dias); rotA.push(M[i].dias.length + 'x'); }
    var V = M.length ? finValorDoPlano(X.planos, h.plano, dias, ordemUsada, X.descontos) : null;
    if (!valor && V && V.falta < 0) valor = V.total;
  } else if (!valor) {
    if (aulas === null) aulas = finAulasDe(k, X.cadastro, X.peludinhos);
    mensal = (aulas === null) ? null : finMensalidade(X.planos, h.plano, aulas, ordemUsada, X.descontos);
    if (mensal !== null) valor = mensal * (meses || 1);
  }
  if (!valor) {
    R.semComoCalcular.push({ chave: k, nome: nome, servico: 'daycare',
      motivo: 'renovação anterior (' + String(h.plano) + ', paga em ' + String(h.inicio).slice(8, 10) + '/' + String(h.inicio).slice(5, 7) + '/' + String(h.inicio).slice(0, 4) + ') sem como calcular o valor' });
    return;
  }
  var pago = Math.min(finCent(X.pagoPorChave[k]), valor);
  X.pagoPorChave[k] = finCent(X.pagoPorChave[k]) - pago;
  var falta = valor - pago;
  R.porServico.daycare.quantos++;
  R.porServico.daycare.recebido += pago;
  R.porServico.daycare.aReceber += falta;
  if (X.hoje && falta > 0 && finEhISO(h.inicio) && h.inicio < X.hoje) R.porServico.daycare.emAtraso += falta;
  if (h.plano_deduzido !== true) R.porServico.daycare.declarado += valor;
  R.porFILHOt.push({
    chave: k,
    nome: nome,
    tutor: String(c.tutor || k.split('__')[1] || ''),
    servico: 'daycare',
    plano: String(h.plano),
    compromisso: String(pl.compromisso || ''),
    aulas: aulas,
    mensalidade: mensal,
    valor: valor,
    pago: pago,
    falta: falta,
    vigencia: { inicio: String(h.inicio), fim: finEhISO(h.fim) ? h.fim : finFimVigencia(h.inicio, meses) },
    venceEm: String(h.inicio),
    ordemPet: ordemExplicita ? parseInt(h.ordemPet, 10) : (ordemUsada !== undefined ? ordemUsada : 1),
    ordemPetSuposta: (!ordemExplicita && ordemUsada === undefined),
    resolvidoPorFamilia: (!ordemExplicita && ordemUsada !== undefined),
    planoDeduzido: h.plano_deduzido === true,
    situacao: falta === 0 ? 'pago' : 'aberto',
    origem: 'renovacao-anterior',
    valorGravado: finValorGravado(h) > 0
  });
  if (rotA.length) R.porFILHOt[R.porFILHOt.length - 1].aulasRotulo = rotA.join(', ');
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
 *   Plano com dias diferentes em cada mês (renov.dias_mes, Story 6.36): o
 *   valor é a SOMA MÊS A MÊS da tabela (finResumoDiasMes); dias por mês que
 *   não fecham com o plano vão para `semComoCalcular` com o motivo escrito.
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
    /* RENOVAÇÕES ANTERIORES (6.44): o pagamento de um plano que já foi renovado continua no
       mês em que entrou — mesmo que a categoria de hoje seja outra (virou morador). */
    var histK = finRenovHistContados(c), zh;
    for (zh = 0; zh < histK.length; zh++) {
      finResumoHistorico(R, k, c, histK[zh], { planos: planos, cadastro: cadastro, peludinhos: peludinhos,
        ordensFamilia: ordensFamilia, descontos: d.descontoIrmao, mes: mes, hoje: hoje, pagoPorChave: pagoPorChave });
    }
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
    /* PLANO COM DIAS DIFERENTES EM CADA MÊS (6.36): caminho próprio, somado mês a mês
       (finResumoDiasMes). Sem renov.dias_mes, NADA abaixo muda — é o caminho de sempre. */
    if (r.dias_mes) {
      finResumoDiasMes(R, k, c, r, { planos: planos, cadastro: cadastro, peludinhos: peludinhos,
        ordensFamilia: ordensFamilia, descontos: d.descontoIrmao, mes: mes, ultimoDia: ultimoDia,
        hoje: hoje, pagoPorChave: pagoPorChave });
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
    /* 6.44: o valor GRAVADO no fechamento vale mais que a tabela de hoje. */
    var vg = finValorGravado(r);
    if (entra && vg) valorMes = vg;

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
        if (vg) R.porServico.daycare.declarado += vg - mensal * (meses || 1);   /* 6.44: o gravado */
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
      if (vg) R.porFILHOt[R.porFILHOt.length - 1].valorGravado = true;   /* 6.44 */
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

  /* UM FILHOt QUE PAGOU DUAS VEZES NO MÊS (6.44: a renovação anterior e o plano atual no mesmo
     mês) é UM FILHOt: "quantos" conta FILHOts, não pagamentos. Sem renovação anterior no mês,
     nada muda (uma linha por chave). */
  var vistosDc = {}, repetidos = 0, zq;
  for (zq = 0; zq < R.porFILHOt.length; zq++) {
    if (R.porFILHOt[zq].servico !== 'daycare') continue;
    if (vistosDc[R.porFILHOt[zq].chave]) repetidos++;
    vistosDc[R.porFILHOt[zq].chave] = true;
  }
  R.porServico.daycare.quantos -= repetidos;

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
  var foraChaves = {}, foraN = 0;
  for (zq = 0; zq < R.semComoCalcular.length; zq++) {
    if (!foraChaves[R.semComoCalcular[zq].chave]) foraN++;
    foraChaves[R.semComoCalcular[zq].chave] = true;
  }
  if (R.semComoCalcular.length) {
    R.avisos.push(foraN + ' FILHOt(s) ficaram FORA da soma por falta de dado. ' +
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
    finPareceISO: finPareceISO, finAddDiasISO: finAddDiasISO, finAddMesesISO: finAddMesesISO,
    finMeioMesVale: finMeioMesVale, finMesesN: finMesesN, finDiasMesSaneado: finDiasMesSaneado,
    finMesesDatas: finMesesDatas, finMesesDoPlano: finMesesDoPlano, finDiasMesValidos: finDiasMesValidos,
    finValorDoPlano: finValorDoPlano, finDiasMesMotivo: finDiasMesMotivo, finAulasRotina: finAulasRotina,
    finResumoDiasMes: finResumoDiasMes,
    finResumoMes: finResumoMes,
    FIN_PLANOS_PADRAO: FIN_PLANOS_PADRAO, FIN_DESC_IRMAO: FIN_DESC_IRMAO
  };
}
