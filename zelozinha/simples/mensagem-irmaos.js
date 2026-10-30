/* mensagem-irmaos/index.js */
'use strict';

/* Texto aprovado pela Adriana em 30/out/2026 para irmãos do mesmo tutor ("tutor dono de dois peludinhos,
 * sempre se tiver coisa junta mandar juntos, na mesma mensagem, não mandar várias"): uma mensagem só, com
 * uma linha por cuidado de cada FILHOt. As regras são as do texto de um FILHOt (mensagem-unica41): datas
 * de hoje, amanhã ou vencidas; vacina só com a veterinária no dia e nunca na quinta.
 * Uma cópia idêntica deste arquivo mora no app (<script id="mensagem-irmaos">); a prova confere. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MensagemIrmaos = factory();
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
  const NUMEROS = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez'];

  function motivo(m) { return { ok: false, motivo: m }; }
  function dataISO(valor) {
    if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null;
    const [ano, mes, dia] = valor.split('-').map(Number);
    const data = new Date(Date.UTC(ano, mes - 1, dia));
    if (data.getUTCFullYear() !== ano || data.getUTCMonth() !== mes - 1 || data.getUTCDate() !== dia) return null;
    return valor;
  }
  function amanhaISO(iso) {
    const [ano, mes, dia] = iso.split('-').map(Number);
    const data = new Date(Date.UTC(ano, mes - 1, dia) + 86400000);
    return `${data.getUTCFullYear()}-${String(data.getUTCMonth() + 1).padStart(2, '0')}-${String(data.getUTCDate()).padStart(2, '0')}`;
  }
  function brasileiro(iso) { const [ano, mes, dia] = iso.split('-'); return `${dia}/${mes}/${ano}`; }
  function juntar(nomes) { return nomes.length === 2 ? `${nomes[0]} e ${nomes[1]}` : `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`; }

  /* entrada: { nomeTutor, dia, presencaConfirmada, veterinariaConfirmada, peludos: [{ nome, sexo, cuidados: [{ itemK, vence }] }] } */
  function gerarMensagemIrmaos(entrada) {
    if (!entrada || typeof entrada !== 'object') return motivo('entrada inválida');
    const { nomeTutor, dia, presencaConfirmada, veterinariaConfirmada, peludos } = entrada;
    if (!String(nomeTutor || '').trim()) return motivo('o nome do tutor é obrigatório');
    if (presencaConfirmada !== true) return motivo('a presença confirmada é obrigatória');
    const hoje = dataISO(dia);
    if (!hoje) return motivo('dia inválido; use YYYY-MM-DD');
    if (!Array.isArray(peludos) || peludos.length < 2) return motivo('a mensagem de irmãos precisa de dois ou mais peludos');
    const amanha = amanhaISO(hoje), vistos = new Set(), grupos = [];
    let temVacina = false, total = 0;
    for (const p of peludos) {
      const nome = String((p && p.nome) || '').trim();
      if (!nome) return motivo('o nome de cada peludo é obrigatório');
      if (vistos.has(nome.toLocaleLowerCase('pt-BR'))) return motivo('há dois peludos com o mesmo nome');
      vistos.add(nome.toLocaleLowerCase('pt-BR'));
      if (p.sexo !== undefined && p.sexo !== '' && p.sexo !== 'F' && p.sexo !== 'M') return motivo('sexo inválido; use F, M ou omita');
      if (!Array.isArray(p.cuidados) || p.cuidados.length === 0) return motivo('cada peludo precisa de ao menos um cuidado');
      const unicos = new Map();
      for (const c of p.cuidados) {
        if (!c || !Object.prototype.hasOwnProperty.call(NOMES, c.itemK)) return motivo('item de cuidado não reconhecido');
        const vence = dataISO(c.vence);
        if (!vence) return motivo('data de vencimento ausente ou inválida; use YYYY-MM-DD');
        if (vence > amanha) return motivo('só são aceitas datas de hoje, amanhã ou vencidas');
        const anterior = unicos.get(c.itemK);
        if (anterior && anterior.vence !== vence) return motivo('há versões conflitantes para o mesmo cuidado');
        if (!anterior) unicos.set(c.itemK, { itemK: c.itemK, vence });
        if (c.itemK.startsWith('vac_')) temVacina = true;
      }
      total += unicos.size;
      grupos.push({ nome, sexo: p.sexo, itens: [...unicos.values()] });
    }
    if (temVacina) {
      const [ano, mes, diaNumero] = hoje.split('-').map(Number);
      const diaSemana = new Date(Date.UTC(ano, mes - 1, diaNumero)).getUTCDay();
      if (veterinariaConfirmada !== true) return motivo('a confirmação da veterinária é obrigatória para vacinas');
      if (diaSemana === 4) return motivo('vacinação não é oferecida na quinta-feira');
      if (![1, 2, 3, 5].includes(diaSemana)) return motivo('vacinação só é oferecida de segunda, terça, quarta ou sexta-feira');
    }
    const lista = [];
    grupos.forEach((g) => g.itens.forEach((item) => {
      let prazo = 'vence hoje';
      if (item.vence < hoje) prazo = `venceu em ${brasileiro(item.vence)}`;
      else if (item.vence === amanha) prazo = 'vence amanhã';
      lista.push(`🐾 ${g.nome}: ${ARTIGOS[item.itemK]} ${NOMES[item.itemK]} *${prazo}*.`);
    }));
    const pronome = grupos.every((g) => g.sexo === 'F') ? 'elas' : 'eles';
    const linhas = [
      `Bom dia, ${String(nomeTutor).trim()}! Como você está? 💛`,
      '',
      `${juntar(grupos.map((g) => g.nome))} estão com a gente hoje e temos ${NUMEROS[total] || total} cuidados para deixar em dia:`,
      ...lista
    ];
    if (temVacina) linhas.push('Nossa veterinária está aqui hoje.');
    linhas.push('', `Podemos cuidar disso hoje, enquanto ${pronome} aproveitam o dia na Zêluz? Assim, vocês resolvem tudo em uma só visita, sem precisar encaixar outro compromisso na rotina — e sobra mais tempo para curtirem juntos. 💛`);
    return { ok: true, texto: linhas.join('\n') };
  }

  return { gerarMensagemIrmaos };
}));
