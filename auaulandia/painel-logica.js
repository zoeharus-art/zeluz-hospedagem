/* ============================================================================
 * painel-logica.js — a CONTA do Painel unificado (Fase 2.1), sem tela e sem banco.
 *
 * O que é: as funções puras de que a fatia do Monitor precisa. Recebem objetos
 * (o que veio do banco) e devolvem objetos. Nunca leem DOM, nunca leem Firebase,
 * nunca gravam nada. É de propósito: assim o harness prova a conta contra dado
 * REAL antes de existir uma linha de tela, e a tela depois só desenha o
 * resultado.
 *
 * Como entra no app: <script src="painel-logica.js"></script> ANTES do script
 * grande do index.html. As funções ficam globais com prefixo "pl" para não
 * esbarrar em nada que já existe.
 *
 * Estilo: var/function, ES5. Roda no tablet velho da recepção. Sem class, sem
 * arrow, sem template string, sem Object.assign, sem Array.prototype.find.
 *
 * Nós do banco que estas funções consomem (quem lê o banco é o chamador):
 *   daycare/auditoria/{AAAA-MM-DD}       — evento a evento: {ts,hora,quem,role,acao,detalhe,alvo,pet,assinou}
 *   daycare/pontos-checkout/{AAAA-MM}    — {id:{quem,pontos,faltas,pet,conferido_por,estadia,ts}}
 *   daycare/tempo-atividade/{AAAA-MM-DD} — {slug:{inicio,fim,quemInicio,quemFim,caes}}
 *   daycare/avisos-telegram-comida/{dia} — {k:{ok,erro,nome,quem,ts,tentando}}
 *   auaulandia/avisos-vet-fila           — fila: estar nela JÁ significa que não saiu
 *   daycare/config/escala e daycare/config/planos — dado NOVO (formato definido aqui)
 * ========================================================================== */

/* ------------------------------------------------------------------ básico */

/* Acentos à mão, para o caso de o aparelho não ter String.prototype.normalize.
   Sem isto, "Octávio" e "Octavio" virariam duas pessoas no tablet velho. */
var PL_ACENTOS = {
  'á': 'a', 'à': 'a', 'ã': 'a', 'â': 'a', 'ä': 'a', 'å': 'a',
  'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
  'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
  'ó': 'o', 'ò': 'o', 'õ': 'o', 'ô': 'o', 'ö': 'o',
  'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u',
  'ç': 'c', 'ñ': 'n', 'ý': 'y', 'ÿ': 'y'
};

/* plNorm — deixa o nome comparável: sem acento, minúsculo, sem espaço sobrando.
   É a MESMA ideia do jsNorm do app, reescrita aqui de propósito: este arquivo
   não pode depender do index.html, senão o harness não consegue prová-lo sozinho. */
function plNorm(s) {
  var t = (s === null || s === undefined) ? '' : String(s);
  t = t.toLowerCase();
  if (typeof t.normalize === 'function') {
    try { t = t.normalize('NFD').replace(/[̀-ͯ]/g, ''); } catch (e) { /* segue com a tabela */ }
  }
  var out = '', i, c;
  for (i = 0; i < t.length; i++) {
    c = t.charAt(i);
    out += (PL_ACENTOS[c] !== undefined ? PL_ACENTOS[c] : c);
  }
  return out.replace(/\s+/g, ' ').replace(/^ +| +$/g, '');
}

function plPad2(n) { n = String(n); return n.length < 2 ? ('0' + n) : n; }

function plEhHora(h) { return typeof h === 'string' && /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(h); }

function plEhISO(d) { return typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d); }

/* 'HH:MM' -> minutos desde a meia-noite. Devolve null se não for hora. */
function plMinutosDeHora(h) {
  if (!plEhHora(h)) return null;
  var p = String(h).split(':');
  return (parseInt(p[0], 10) * 60) + parseInt(p[1], 10);
}

/* Objeto seguro: null/undefined/lista viram {} — o banco às vezes devolve null. */
function plObj(o) {
  if (!o || typeof o !== 'object' || Object.prototype.toString.call(o) === '[object Array]') return {};
  return o;
}

function plEhLista(x) { return Object.prototype.toString.call(x) === '[object Array]'; }

/* Lista de valores de um objeto do Firebase (as chaves push não interessam). */
function plValores(o) {
  var v = plObj(o), ks = Object.keys(v), out = [], i;
  for (i = 0; i < ks.length; i++) if (v[ks[i]] && typeof v[ks[i]] === 'object') out.push(v[ks[i]]);
  return out;
}

var PL_DIA_MS = 86400000;

/* 'AAAA-MM-DD' -> ms UTC do dia. Só para CONTAR dias; nunca para carimbar hora. */
function plDiaUTC(iso) {
  if (!plEhISO(iso)) return null;
  var p = iso.split('-');
  return Date.UTC(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
}

function plISODeUTC(ms) {
  var d = new Date(ms);
  return d.getUTCFullYear() + '-' + plPad2(d.getUTCMonth() + 1) + '-' + plPad2(d.getUTCDate());
}

/* ------------------------------------------------- 1 · quem fez o quê no dia */

/* plCheckinsPorPessoa — quebra o caderno de auditoria de UM dia por pessoa.
   Devolve { nomeNormalizado: {nome, checkinCorpo, checkoutCorpo, pertences,
   alvos:{corpo:[], pertences:[]}} }.
   Decisão de formato: o evento de pertences grava o FILHOt em `pet` (não em
   `alvo`) — os dois são aceitos, para a conta não perder ninguém.
   `pertences` conta a ENTRADA (checkin-pertences); a saída dos pertences não
   entra neste card. */
function plCheckinsPorPessoa(auditoriaDia) {
  var evs = plValores(auditoriaDia), out = {}, i, e, quem, k, alvo;
  for (i = 0; i < evs.length; i++) {
    e = evs[i];
    if (!e || !e.acao) continue;
    if (e.acao !== 'checkin-corpo' && e.acao !== 'checkout-corpo' && e.acao !== 'checkin-pertences') continue;
    quem = (e.quem === null || e.quem === undefined) ? '' : String(e.quem);
    k = plNorm(quem);
    if (!out[k]) out[k] = { nome: quem, checkinCorpo: 0, checkoutCorpo: 0, pertences: 0, alvos: { corpo: [], pertences: [] } };
    alvo = e.alvo || e.pet || '';
    if (e.acao === 'checkin-corpo') { out[k].checkinCorpo++; if (alvo) out[k].alvos.corpo.push(String(alvo)); }
    else if (e.acao === 'checkout-corpo') { out[k].checkoutCorpo++; }
    else { out[k].pertences++; if (alvo) out[k].alvos.pertences.push(String(alvo)); }
  }
  return out;
}

/* plProtocoloDe — "do que era meu hoje, o que eu fiz e o que ficou faltando".
   filhotsDoDia = lista de chaves `nome__tutor` (a turma do dia).
   Feito = existe checkin-corpo com aquele `alvo`, feito por esta pessoa.
   Sem turma do dia não se inventa cobrança: faltam=[] e pct=null. */
function plProtocoloDe(nome, auditoriaDia, filhotsDoDia) {
  var alvo = plNorm(nome), evs = plValores(auditoriaDia);
  var fez = {}, i, e, a;
  for (i = 0; i < evs.length; i++) {
    e = evs[i];
    if (!e || e.acao !== 'checkin-corpo') continue;
    if (plNorm(e.quem) !== alvo) continue;
    a = e.alvo || e.pet || '';
    if (a) fez[plNorm(a)] = true;
  }
  var turma = plEhLista(filhotsDoDia) ? filhotsDoDia : [];
  var vistos = {}, feitos = [], faltam = [], total = 0, ch, nk;
  for (i = 0; i < turma.length; i++) {
    ch = (turma[i] === null || turma[i] === undefined) ? '' : String(turma[i]);
    if (!ch) continue;
    nk = plNorm(ch);
    if (vistos[nk]) continue;                 /* a mesma chave duas vezes não conta dobrado */
    vistos[nk] = true;
    total++;
    if (fez[nk]) feitos.push(ch); else faltam.push(ch);
  }
  if (!total) return { feitos: [], faltam: [], total: 0, pct: null };
  return { feitos: feitos, faltam: faltam, total: total, pct: Math.round((feitos.length / total) * 100) };
}

/* ---------------------------------------- 2 · avisos que ficaram com a pessoa */

/* Nós de FILA: o item só existe enquanto NÃO saiu. Neles, a ausência do campo
   `ok` não quer dizer "deu certo" — quer dizer "ainda está preso". (Decisão
   tomada ao ler `vetFilaGuardar` no app: a fila não grava campo `ok` nenhum.) */
var PL_NOS_FILA = { 'vet-fila': true };

/* Quanto tempo um "tentando" pode ficar de pé antes de virar aviso travado. */
var PL_TENTANDO_MS = 120000;

/* plAvisosDe — o que esta pessoa mandou avisar e NÃO saiu.
   avisosPorNo = { 'telegram-comida': {…do dia…}, 'vet-fila': {…} }.
   Devolve [{no, k, nome, erro, ts, motivo}] do mais novo para o mais velho. */
function plAvisosDe(nome, avisosPorNo, agoraTs) {
  var alvo = plNorm(nome), nos = plObj(avisosPorNo);
  var agora = (typeof agoraTs === 'number' && isFinite(agoraTs)) ? agoraTs : 0;
  var out = [], chavesNo = Object.keys(nos), i, j, no, itens, ks, it, ts, motivo, ehFila;
  for (i = 0; i < chavesNo.length; i++) {
    no = chavesNo[i];
    ehFila = (PL_NOS_FILA[no] === true);
    itens = plObj(nos[no]);
    ks = Object.keys(itens);
    for (j = 0; j < ks.length; j++) {
      it = itens[ks[j]];
      if (!it || typeof it !== 'object') continue;
      if (plNorm(it.quem) !== alvo) continue;
      ts = (typeof it.ts === 'number' && isFinite(it.ts)) ? it.ts : 0;
      motivo = '';
      if (it.ok === false) motivo = 'não saiu';
      else if (it.tentando === true && (agora - ts) > PL_TENTANDO_MS) motivo = 'travou tentando';
      else if (ehFila && it.ok === undefined) motivo = 'na fila, ainda não saiu';
      if (!motivo) continue;
      out.push({
        no: no,
        k: ks[j],
        nome: String(it.nome || it.pet || ''),
        erro: String(it.erro || it.motivo || ''),
        ts: ts,
        motivo: motivo
      });
    }
  }
  out.sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
  return out;
}

/* --------------------------------------------------- 3 · semana ISO 8601 */

/* plSemanaISO — 'AAAA-Www'. Semana de segunda a domingo; a semana pertence ao
   ano da sua QUINTA-FEIRA (regra ISO 8601). Por isso 2026-01-01 (quinta) é
   2026-W01, e 2027-01-01 (sexta) cai em 2026-W53: quem manda é a quinta-feira
   da semana, não o 1º de janeiro. Devolve '' se a data não for AAAA-MM-DD. */
function plSemanaISO(iso) {
  var ms = plDiaUTC(iso);
  if (ms === null) return '';
  var dow = new Date(ms).getUTCDay(); if (dow === 0) dow = 7;   /* segunda=1 … domingo=7 */
  var quinta = ms + (4 - dow) * PL_DIA_MS;                      /* a quinta desta semana */
  var ano = new Date(quinta).getUTCFullYear();
  var jan1 = Date.UTC(ano, 0, 1);
  var semana = Math.floor((quinta - jan1) / PL_DIA_MS / 7) + 1;
  return ano + '-W' + plPad2(semana);
}

/* plDiasISO — todos os dias de `de` até `ate`, inclusive. Janela invertida
   devolve vazio (não se olha para trás por acidente). Trava de 400 dias: o
   Painel nunca precisa de mais que isso, e uma data digitada errada não pode
   virar um laço de dez anos. */
function plDiasISO(deISO, ateISO) {
  var a = plDiaUTC(deISO), b = plDiaUTC(ateISO);
  if (a === null || b === null || b < a) return [];
  var out = [], t = a, n = 0;
  while (t <= b && n < 400) { out.push(plISODeUTC(t)); t += PL_DIA_MS; n++; }
  return out;
}

/* ------------------------------------------- 4 · evolução de um colaborador */

/* Início e fim de um dia em ms LOCAL — é assim que casa com o `ts` do banco,
   que é o Date.now() do aparelho, hora local. */
function plInicioDoDiaMS(iso) {
  var p = String(iso).split('-');
  return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10), 0, 0, 0, 0).getTime();
}
function plFimDoDiaMS(iso) {
  var p = String(iso).split('-');
  return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10), 23, 59, 59, 999).getTime();
}

/* plEvolucao — a série semana a semana de UMA pessoa (o pedido da Márcia:
   "ver a evolução de cada colaborador").
   dados = { auditoriaPorDia:{dia:obj}, pontosPorMes:{mes:obj}, tempoPorDia:{dia:obj} }
   Devolve as últimas nSemanas terminando em hojeISO, da MAIS ANTIGA para a mais
   recente. Decisões de formato:
   - a semana corrente é aparada em hojeISO: dia que ainda não aconteceu não
     entra na lista de dias (não se cobra o futuro de ninguém);
   - `etapas[slug].minutos` só soma quando a atividade tem começo E fim; sem fim
     (atividade que ficou aberta) conta como 1 vez e 0 minuto;
   - `pontos`/`bolsas` vêm de pontos-checkout, filtrando `quem` e o `ts` dentro
     da semana — o nó é por mês, e uma semana pode cair em dois meses. */
function plEvolucao(nome, dados, nSemanas, hojeISO) {
  var d = plObj(dados);
  var aud = plObj(d.auditoriaPorDia), pts = plObj(d.pontosPorMes), tmp = plObj(d.tempoPorDia);
  var alvo = plNorm(nome);
  var n = parseInt(nSemanas, 10); if (!(n > 0)) n = 1; if (n > 104) n = 104;
  var hojeMS = plDiaUTC(hojeISO);
  if (hojeMS === null) return [];

  var dow = new Date(hojeMS).getUTCDay(); if (dow === 0) dow = 7;
  var segundaDeHoje = hojeMS - (dow - 1) * PL_DIA_MS;
  var primeiraSegunda = segundaDeHoje - (n - 1) * 7 * PL_DIA_MS;

  var out = [], i, j, k;
  for (i = 0; i < n; i++) {
    var ini = primeiraSegunda + i * 7 * PL_DIA_MS;
    var fim = ini + 6 * PL_DIA_MS;
    if (fim > hojeMS) fim = hojeMS;                        /* apara o futuro */
    var dias = plDiasISO(plISODeUTC(ini), plISODeUTC(fim));
    var sem = {
      semana: plSemanaISO(plISODeUTC(ini)),
      dias: dias,
      checkinCorpo: 0,
      checkinPertences: 0,
      pontos: 0,
      bolsas: 0,
      bolsasPerfeitas: 0,
      avisosNaoEnviados: 0,
      gravacoesFalhas: 0,
      etapas: {}
    };

    for (j = 0; j < dias.length; j++) {
      /* --- caderno de auditoria do dia --- */
      var evs = plValores(aud[dias[j]]);
      for (k = 0; k < evs.length; k++) {
        var e = evs[k];
        if (!e || plNorm(e.quem) !== alvo) continue;
        if (e.acao === 'checkin-corpo') sem.checkinCorpo++;
        else if (e.acao === 'checkin-pertences') sem.checkinPertences++;
        else if (e.acao === 'gravacao-FALHOU') sem.gravacoesFalhas++;
        else if (e.acao === 'telegram-comida' && plNorm(e.detalhe).indexOf('nao') === 0) sem.avisosNaoEnviados++;
      }
      /* --- tempo por etapa: só de quem COMEÇOU a atividade --- */
      var t = plObj(tmp[dias[j]]), slugs = Object.keys(t);
      for (k = 0; k < slugs.length; k++) {
        var a = t[slugs[k]];
        if (!a || typeof a !== 'object') continue;
        if (plNorm(a.quemInicio) !== alvo) continue;
        if (!sem.etapas[slugs[k]]) sem.etapas[slugs[k]] = { minutos: 0, vezes: 0 };
        sem.etapas[slugs[k]].vezes++;
        var mi = plMinutosDeHora(a.inicio), mf = plMinutosDeHora(a.fim);
        if (mi !== null && mf !== null && mf > mi) sem.etapas[slugs[k]].minutos += (mf - mi);
      }
    }

    /* --- pontos do check-out: o nó é por mês, o recorte é por semana --- */
    if (dias.length) {
      var deMS = plInicioDoDiaMS(dias[0]), ateMS = plFimDoDiaMS(dias[dias.length - 1]);
      var meses = {}, lm, regs, r, ts;
      for (j = 0; j < dias.length; j++) meses[dias[j].slice(0, 7)] = true;
      lm = Object.keys(meses);
      for (j = 0; j < lm.length; j++) {
        regs = plValores(pts[lm[j]]);
        for (k = 0; k < regs.length; k++) {
          r = regs[k];
          if (!r || plNorm(r.quem) !== alvo) continue;
          ts = (typeof r.ts === 'number' && isFinite(r.ts)) ? r.ts : 0;
          if (ts < deMS || ts > ateMS) continue;
          sem.bolsas++;
          sem.pontos += (typeof r.pontos === 'number' && isFinite(r.pontos)) ? r.pontos : 0;
          if (r.pontos === 10) sem.bolsasPerfeitas++;       /* bolsa que desceu redondo */
        }
      }
    }
    out.push(sem);
  }
  return out;
}

/* --------------------------------------------- 5 · escala e plano do dia */

/* Formato do dado novo (ainda não existe no banco — nasce aqui):
 *
 * escala = { 'Wandela': { entrada:'07:00', almoco:'12:00-13:00', saida:'16:00' } }
 *
 * plano = {
 *   id:'plano-2', nome:'Plano 2 — um a menos', motivo:'Wandela de folga',
 *   definidoPor:'Márcia', ts:1787600000000,
 *   porMonitor:{ 'Octávio':[ {hora:'07:30', atividade:'check-in de corpo e pertences'} ] }
 * }
 *
 * Quem define o plano do dia é sempre a Márcia (decisão da Adriana, 26/ago).
 */

/* plPlanoValido — o plano só vale se uma pessoa consegue segui-lo sem adivinhar. */
function plPlanoValido(plano) {
  var erros = [], p = plObj(plano);
  if (!p.id || !String(p.id).replace(/\s+/g, '')) erros.push('falta o id do plano');
  if (!p.nome || !String(p.nome).replace(/\s+/g, '')) erros.push('falta o nome do plano');
  if (!p.definidoPor || !String(p.definidoPor).replace(/\s+/g, '')) erros.push('falta quem definiu o plano');
  if (!p.porMonitor || typeof p.porMonitor !== 'object' || plEhLista(p.porMonitor)) {
    erros.push('falta porMonitor (o plano é por monitor)');
    return { ok: false, erros: erros };
  }
  var quem = Object.keys(p.porMonitor), i, j, lista, it;
  if (!quem.length) erros.push('porMonitor está vazio — ninguém tem rota nesse plano');
  for (i = 0; i < quem.length; i++) {
    lista = p.porMonitor[quem[i]];
    if (!plEhLista(lista)) { erros.push(quem[i] + ': as atividades não são uma lista'); continue; }
    for (j = 0; j < lista.length; j++) {
      it = lista[j] || {};
      if (!plEhHora(it.hora)) erros.push(quem[i] + ': hora inválida (' + String(it.hora) + ') — use HH:MM, com o zero na frente');
      if (!it.atividade || !String(it.atividade).replace(/\s+/g, '')) erros.push(quem[i] + ': atividade sem nome às ' + String(it.hora));
    }
  }
  return { ok: erros.length === 0, erros: erros };
}

/* Procura a pessoa num objeto com chave de nome, comparando normalizado —
   'Octávio', 'octavio' e 'OCTÁVIO ' são a mesma pessoa. */
function plAchaPorNome(obj, nome) {
  var o = plObj(obj), ks = Object.keys(o), alvo = plNorm(nome), i;
  for (i = 0; i < ks.length; i++) if (plNorm(ks[i]) === alvo) return o[ks[i]];
  return null;
}

/* plRotaDoDia — o card "Meu dia" do monitor: o meu horário e as minhas
   atividades, na ordem. Nada de outra pessoa, nada de dinheiro. */
function plRotaDoDia(nome, escala, plano) {
  var avisos = [];
  var e = plAchaPorNome(escala, nome);
  var p = plObj(plano);
  var minhas = plAchaPorNome(p.porMonitor, nome);

  if (!e || typeof e !== 'object') { avisos.push('Seu horário ainda não está na escala — fale com a Márcia.'); e = {}; }
  if (!plEhLista(minhas)) {
    avisos.push('Você não está no plano de hoje — fale com a Márcia.');
    minhas = [];
  }

  var lista = [], i, it;
  for (i = 0; i < minhas.length; i++) {
    it = minhas[i] || {};
    lista.push({ hora: plEhHora(it.hora) ? it.hora : '', atividade: String(it.atividade || '') });
  }
  /* atividade sem hora vai para o fim: ela existe, mas não manda na ordem */
  lista.sort(function (a, b) {
    var ma = plMinutosDeHora(a.hora), mb = plMinutosDeHora(b.hora);
    if (ma === null && mb === null) return 0;
    if (ma === null) return 1;
    if (mb === null) return -1;
    return ma - mb;
  });

  return {
    entrada: String(e.entrada || ''),
    almoco: String(e.almoco || ''),
    saida: String(e.saida || ''),
    atividades: lista,
    plano: { id: String(p.id || ''), nome: String(p.nome || ''), motivo: String(p.motivo || ''), definidoPor: String(p.definidoPor || '') },
    avisos: avisos
  };
}
