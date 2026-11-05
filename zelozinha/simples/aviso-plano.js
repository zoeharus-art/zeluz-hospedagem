/* aviso-plano/index.js */
'use strict';

/* Aviso do «plano com cuidados incluídos» (Adriana, 05/11/2026). A família já acertou o cuidado no início do mês:
 * não recebe pergunta, só o aviso de que o FILHOt recebe o cuidado hoje, no dia em que ele vem.
 * Texto aprovado: «Oi, {tutor}, tudo bem? Hoje {o/a} {nome} recebe aqui {cuidado}, já combinada no acerto do mês.
 * Qualquer novidade, a gente conta. 💛». Muda só o artigo, os nomes e a concordância («combinada»/«combinado»).
 * Irmãos do mesmo tutor recebem um aviso só. Este texto NÃO é o da mensagem do dia (mensagem-unica41), que não muda.
 * Uma cópia idêntica deste arquivo mora no app (<script id="aviso-plano">); a prova confere. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AvisoPlano = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  const NOMES = Object.freeze({
    vac_mult_p: 'vacina múltipla',
    vac_gripe_p: 'vacina contra gripe',
    vac_raiva_p: 'vacina antirrábica',
    verm_p: 'vermífugo',
    verm_dose2_p: '2ª dose do vermífugo',
    ecto_p: 'proteção contra pulgas e carrapatos',
    col_p: 'coleira repelente'
  });
  const ARTIGOS = Object.freeze({
    vac_mult_p: 'a', vac_gripe_p: 'a', vac_raiva_p: 'a',
    verm_p: 'o', verm_dose2_p: 'a', ecto_p: 'a', col_p: 'a'
  });
  const ORDEM = Object.keys(NOMES);

  function motivo(m) { return { ok: false, motivo: m }; }
  function dataISO(valor) {
    if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null;
    const [ano, mes, dia] = valor.split('-').map(Number);
    const data = new Date(Date.UTC(ano, mes - 1, dia));
    if (data.getUTCFullYear() !== ano || data.getUTCMonth() !== mes - 1 || data.getUTCDate() !== dia) return null;
    return valor;
  }
  function juntar(partes) { return partes.length === 1 ? partes[0] : partes.length === 2 ? `${partes[0]} e ${partes[1]}` : `${partes.slice(0, -1).join(', ')} e ${partes[partes.length - 1]}`; }
  function sujeito(p) { return `${p.sexo === 'F' ? 'a ' : p.sexo === 'M' ? 'o ' : ''}${p.nome}`; }

  /* entrada: { nomeTutor, dia (opcional: com vacina, vale a regra da veterinária), peludos: [{ nome, sexo, cuidados: [{ itemK }] }] }
   * Com um peludo, o texto aprovado; com mais de um, um aviso só para todos. */
  function gerarAvisoPlano(entrada) {
    if (!entrada || typeof entrada !== 'object') return motivo('entrada inválida');
    const { nomeTutor, dia, peludos } = entrada;
    if (!String(nomeTutor || '').trim()) return motivo('o nome do tutor é obrigatório');
    if (!Array.isArray(peludos) || peludos.length === 0) return motivo('é necessário informar ao menos um peludo');
    const vistos = new Set(), grupos = [];
    let temVacina = false;
    for (const p of peludos) {
      const nome = String((p && p.nome) || '').trim();
      if (!nome) return motivo('o nome de cada peludo é obrigatório');
      if (vistos.has(nome.toLocaleLowerCase('pt-BR'))) return motivo('há dois peludos com o mesmo nome');
      vistos.add(nome.toLocaleLowerCase('pt-BR'));
      if (p.sexo !== undefined && p.sexo !== '' && p.sexo !== 'F' && p.sexo !== 'M') return motivo('sexo inválido; use F, M ou omita');
      if (!Array.isArray(p.cuidados) || p.cuidados.length === 0) return motivo('cada peludo precisa de ao menos um cuidado');
      const itens = new Set();
      for (const c of p.cuidados) {
        if (!c || !Object.prototype.hasOwnProperty.call(NOMES, c.itemK)) return motivo('item de cuidado não reconhecido');
        itens.add(c.itemK);
        if (c.itemK.startsWith('vac_')) temVacina = true;
      }
      grupos.push({ nome, sexo: p.sexo === 'F' || p.sexo === 'M' ? p.sexo : '', itens: ORDEM.filter((k) => itens.has(k)) });
    }
    if (temVacina && dia !== undefined) {
      const d = dataISO(dia);
      if (!d) return motivo('dia inválido; use YYYY-MM-DD');
      const [ano, mes, diaNumero] = d.split('-').map(Number);
      const semana = new Date(Date.UTC(ano, mes - 1, diaNumero)).getUTCDay();
      if (semana === 4) return motivo('vacinação não é oferecida na quinta-feira');
      if (![1, 2, 3, 5].includes(semana)) return motivo('vacinação só é oferecida de segunda, terça, quarta ou sexta-feira');
    }
    /* quem tem os mesmos cuidados fala junto: «o Tico e a Teca recebem aqui a vacina múltipla» */
    const porLista = new Map();
    grupos.forEach((g) => { const k = g.itens.join('|'); if (!porLista.has(k)) porLista.set(k, []); porLista.get(k).push(g); });
    const frases = [], impressos = [];
    porLista.forEach((membros) => {
      const itens = membros[0].itens;
      itens.forEach((k) => { if (!impressos.includes(k)) impressos.push(k); });
      frases.push(`${juntar(membros.map(sujeito))} ${membros.length > 1 ? 'recebem' : 'recebe'} aqui ${juntar(itens.map((k) => `${ARTIGOS[k]} ${NOMES[k]}`))}`);
    });
    const plural = impressos.length > 1, feminino = impressos.every((k) => ARTIGOS[k] === 'a');
    const combinado = plural ? (feminino ? 'combinadas' : 'combinados') : (feminino ? 'combinada' : 'combinado');
    const corpo = frases.length === 1 ? frases[0] : juntar(frases);
    return { ok: true, texto: `Oi, ${String(nomeTutor).trim()}, tudo bem? Hoje ${corpo}, já ${combinado} no acerto do mês. Qualquer novidade, a gente conta. 💛` };
  }

  return { gerarAvisoPlano };
}));
