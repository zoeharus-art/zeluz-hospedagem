/* aviso-plano/index.js */
'use strict';

/* Aviso do «plano com cuidados incluídos» (Adriana, 05/11/2026). A família já pagou o cuidado junto com o plano:
 * não recebe pergunta, só o aviso de que o FILHOt recebe o cuidado hoje, no dia em que ele vem.
 * Texto aprovado (09/11/2026, «hoje conforme, daremos o vermifugo conforme fechado no plano»):
 * «Oi, {tutor}, tudo bem? Hoje {o/a} {nome} recebe aqui {cuidado}, conforme fechado no plano. Qualquer novidade, a gente conta. 💛».
 * Muda só o artigo e os nomes. Irmãos do mesmo tutor recebem um aviso só.
 * Este texto NÃO é o da mensagem do dia (mensagem-unica41), que não muda.
 * CUIDADOS PAGOS NA RENOVAÇÃO (09/11/2026, maquete aprovada): o que vale não é mais uma chave ligada na ficha, e sim
 * o que foi pago junto com cada plano, com a quantidade de doses e o período do plano:
 *   ficha.plano_cuidados/{início do plano} = { fim, itens: { verm_p: 2, ecto_p: 3, ... } }
 *   ficha.plano_usos/{cuidado}/{dia} = true   (a dose gasta naquele dia; o check-in repetido no mesmo dia não gasta de novo)
 * A 2ª dose do vermífugo gasta do vermífugo. Fora do período, sem dose sobrando ou sem o cuidado pago: pergunta normal.
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
    const frases = [];
    porLista.forEach((membros) => {
      const itens = membros[0].itens;
      frases.push(`${juntar(membros.map(sujeito))} ${membros.length > 1 ? 'recebem' : 'recebe'} aqui ${juntar(itens.map((k) => `${ARTIGOS[k]} ${NOMES[k]}`))}`);
    });
    const corpo = frases.length === 1 ? frases[0] : juntar(frases);
    return { ok: true, texto: `Oi, ${String(nomeTutor).trim()}, tudo bem? Hoje ${corpo}, conforme fechado no plano. Qualquer novidade, a gente conta. 💛` };
  }

  /* ---------- os cuidados pagos junto com o plano ---------- */
  const PACOTES = Object.freeze(['vac_mult_p', 'vac_gripe_p', 'vac_raiva_p', 'verm_p', 'ecto_p', 'col_p']);
  const DOSES_MAX = 6;
  const objeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
  /* o cuidado que gasta a dose: a 2ª dose do vermífugo sai do vermífugo */
  function pacote(itemK) { return itemK === 'verm_dose2_p' ? 'verm_p' : (PACOTES.includes(itemK) ? itemK : ''); }
  function doses(v) { const n = Number(v); return Number.isInteger(n) && n >= 1 && n <= DOSES_MAX ? n : 0; }
  /* o plano de cuidados que vale no dia: o de início mais recente que cobre o dia; null se nenhum */
  function planoDoDia(ficha, dia) {
    if (!objeto(ficha) || !dataISO(dia) || !objeto(ficha.plano_cuidados)) return null;
    let achado = null;
    Object.keys(ficha.plano_cuidados).sort().forEach((inicio) => {
      const p = ficha.plano_cuidados[inicio];
      if (!dataISO(inicio) || !objeto(p) || !dataISO(p.fim) || p.fim < inicio || dia < inicio || dia > p.fim) return;
      const itens = {};
      if (objeto(p.itens)) PACOTES.forEach((k) => { const n = doses(p.itens[k]); if (n) itens[k] = n; });
      achado = { inicio, fim: p.fim, itens };
    });
    return achado;
  }
  /* quantas doses do cuidado o plano tem, quantas já foram gastas antes do dia e se a de hoje já foi gasta */
  function saldo(ficha, plano, k, dia, usos) {
    const u = objeto(usos) ? usos : (objeto(ficha) && objeto(ficha.plano_usos) ? ficha.plano_usos : {});
    const dias = objeto(u[k]) ? Object.keys(u[k]).filter((d) => u[k][d] === true && dataISO(d) && d >= plano.inicio && d <= plano.fim) : [];
    const hoje = dias.includes(dia), antes = dias.filter((d) => d !== dia).length, total = plano.itens[k] || 0;
    return { total, antes, hoje, sobra: Math.max(0, total - antes - (hoje ? 1 : 0)) };
  }
  /* o cuidado entra no aviso do plano hoje? (pago, dentro do período e com dose: a de hoje já gasta ou uma sobrando) */
  function cobre(ficha, dia, itemK, usos) {
    const k = pacote(itemK), p = k ? planoDoDia(ficha, dia) : null;
    if (!p || !p.itens[k]) return false;
    const s = saldo(ficha, p, k, dia, usos);
    return s.hoje || s.antes < s.total;
  }
  /* gasta a dose do dia (para a transação do check-in): devolve os usos novos com o dia marcado em cada cuidado coberto.
   * Quem já tem o dia marcado não gasta de novo. */
  function gastar(ficha, dia, itensK, usosAtuais) {
    const usos = JSON.parse(JSON.stringify(objeto(usosAtuais) ? usosAtuais : {}));
    (Array.isArray(itensK) ? itensK : []).forEach((itemK) => {
      const k = pacote(itemK);
      if (!k || !cobre(ficha, dia, itemK, usos)) return;
      if (!objeto(usos[k])) usos[k] = {};
      usos[k][dia] = true;
    });
    return usos;
  }
  /* o aviso só vale se a dose do dia está gasta na ficha (o serviço confere com o banco antes de enviar) */
  function doseDoDia(ficha, dia, itemK) {
    const k = pacote(itemK), p = k ? planoDoDia(ficha, dia) : null;
    return !!(p && p.itens[k] && objeto(ficha.plano_usos) && objeto(ficha.plano_usos[k]) && ficha.plano_usos[k][dia] === true);
  }

  return { gerarAvisoPlano, PACOTES, DOSES_MAX, pacote, planoDoDia, saldo, cobre, gastar, doseDoDia };
}));
