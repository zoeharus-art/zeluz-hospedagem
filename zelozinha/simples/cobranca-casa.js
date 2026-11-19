/* cobranca-casa/index.js */
'use strict';

/* Cobrança do «Vai fazer em casa» (Adriana, 17/11/2026; textos aprovados em 19/11/2026).
 * O tutor respondeu que faria o cuidado fora da Zêluz e a ficha ainda não tem a data. No PRÓXIMO dia em que o FILHOt
 * está de novo na Zêluz (depois do check-in), a Zelozinha manda esta mensagem, uma vez. Tom de parceira: nunca
 * «você ia fazer em casa» (ela achou pesado), e já oferece resolver aqui.
 * Muda só os nomes (primeiro nome do tutor e do FILHOt) e o cuidado. Sem emoji. Sem «o/a» antes do nome do FILHOt.
 * Este texto NÃO é o da mensagem do dia (mensagem-unica41), que não muda.
 * Uma cópia idêntica deste arquivo mora no app (<script id="cobranca-casa">); a prova confere. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CobrancaCasa = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  /* vermífugo, carrapaticida e coleira: «Na ficha, {cuidado} ainda aparece em aberto» */
  const CUIDADOS = Object.freeze({
    verm_p: 'o vermífugo',
    verm_dose2_p: 'a 2ª dose do vermífugo',
    ecto_p: 'o carrapaticida',
    col_p: 'a coleira Seresto'
  });
  /* vacinas: «Na ficha, a vacina {nome} ainda aparece em aberto» */
  const VACINAS = Object.freeze({
    vac_mult_p: 'múltipla',
    vac_gripe_p: 'contra gripe',
    vac_raiva_p: 'antirrábica'
  });

  function motivo(m) { return { ok: false, motivo: m }; }
  function nomeValido(v) { const s = String(v || '').trim(); return /^[\p{L}\p{M}' .-]{1,40}$/u.test(s) ? s : ''; }

  /* entrada: { nomeTutor, nomePeludo, itemK } — os nomes já chegam só com o primeiro nome */
  function gerarCobranca(entrada) {
    if (!entrada || typeof entrada !== 'object') return motivo('entrada inválida');
    const tutor = nomeValido(entrada.nomeTutor), pet = nomeValido(entrada.nomePeludo), k = String(entrada.itemK || '').trim();
    if (!tutor) return motivo('o nome do tutor é obrigatório');
    if (!pet) return motivo('o nome do FILHOt é obrigatório');
    const abertura = `Olá, ${tutor}, tudo bem? ${pet} está aqui com a gente hoje, aproveitando o dia.`;
    const fecho = `Assim a proteção de ${pet} fica em dia, e a de todos os nossos Aulunos também.`;
    if (Object.prototype.hasOwnProperty.call(CUIDADOS, k)) {
      return { ok: true, vacina: false, texto: `${abertura} Na ficha, ${CUIDADOS[k]} ainda aparece em aberto. Se você já fez, é só nos contar o produto e a data, que atualizamos tudo por aqui. Se a correria não deixou, podemos cuidar disso hoje mesmo, enquanto ${pet} aproveita o dia. ${fecho} Podemos fazer hoje?` };
    }
    if (Object.prototype.hasOwnProperty.call(VACINAS, k)) {
      return { ok: true, vacina: true, texto: `${abertura} Na ficha, a vacina ${VACINAS[k]} ainda aparece em aberto. Se já foi aplicada, pode nos enviar uma foto do cartão de vacinação assinado pelo médico-veterinário? Assim atualizamos tudo por aqui. Se a correria não deixou, podemos aplicar aqui na Zêluz, com a nossa equipe veterinária. ${fecho} Quer que a gente agende?` };
    }
    return motivo('cuidado sem texto de cobrança aprovado');
  }

  return { gerarCobranca, CUIDADOS, VACINAS };
}));
