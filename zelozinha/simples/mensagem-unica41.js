/* mensagem-unica41/index.js */
'use strict';

(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MensagemUnica41 = factory();
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
  const KEYS = new Set(Object.keys(NOMES));
  const ARTIGOS = Object.freeze({
    vac_mult_p: 'A', vac_gripe_p: 'A', vac_raiva_p: 'A',
    verm_p: 'O', verm_dose2_p: 'A', ecto_p: 'A', col_p: 'A'
  });

  function motivo(motivo) { return { ok: false, motivo }; }

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

  function brasileiro(iso) {
    const [ano, mes, dia] = iso.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  function gerarMensagem(entrada) {
    if (!entrada || typeof entrada !== 'object') return motivo('entrada inválida');
    const { nomeTutor, nomePeludo, sexo, dia, presencaConfirmada, cuidados, veterinariaConfirmada } = entrada;
    if (!String(nomeTutor || '').trim() || !String(nomePeludo || '').trim()) return motivo('nome do tutor e do peludo são obrigatórios');
    if (presencaConfirmada !== true) return motivo('a presença confirmada é obrigatória');
    const diaISO = dataISO(dia);
    if (!diaISO) return motivo('dia inválido; use YYYY-MM-DD');
    if (sexo !== undefined && sexo !== 'F' && sexo !== 'M') return motivo('sexo inválido; use F, M ou omita');
    if (!Array.isArray(cuidados) || cuidados.length === 0) return motivo('é necessário informar ao menos um cuidado');

    const hojeData = diaISO;
    const amanha = amanhaISO(hojeData);
    const unicos = new Map();
    let temVacina = false;
    for (const cuidado of cuidados) {
      if (!cuidado || !KEYS.has(cuidado.itemK)) return motivo('item de cuidado não reconhecido');
      const vence = dataISO(cuidado.vence);
      if (!vence) return motivo('data de vencimento ausente ou inválida; use YYYY-MM-DD');
      if (vence > amanha) return motivo('só são aceitas datas de hoje, amanhã ou vencidas');
      const assinatura = `${cuidado.itemK}|${vence}`;
      const anterior = [...unicos.values()].find((item) => item.itemK === cuidado.itemK);
      if (anterior && anterior.vence !== vence) return motivo('há versões conflitantes para o mesmo cuidado');
      if (!unicos.has(assinatura)) unicos.set(assinatura, { itemK: cuidado.itemK, vence });
      if (cuidado.itemK.startsWith('vac_')) temVacina = true;
    }
    if (temVacina) {
      const [ano, mes, diaNumero] = diaISO.split('-').map(Number);
      const diaSemana = new Date(Date.UTC(ano, mes - 1, diaNumero)).getUTCDay();
      if (veterinariaConfirmada !== true) return motivo('a confirmação da veterinária é obrigatória para vacinas');
      if (diaSemana === 4) return motivo('vacinação não é oferecida na quinta-feira');
      if (![1, 2, 3, 5].includes(diaSemana)) return motivo('vacinação só é oferecida de segunda, terça, quarta ou sexta-feira');
    }
    const itens = [...unicos.values()];
    const lista = itens.map((item) => {
      const vence = item.vence;
      let prazo = 'vence hoje';
      if (vence < hojeData) prazo = `venceu em ${brasileiro(vence)}`;
      else if (vence === amanha) prazo = 'vence amanhã';
      return `🐾 ${ARTIGOS[item.itemK]} ${NOMES[item.itemK]} *${prazo}*.`;
    });
    const numeros = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez'];
    const quantidade = itens.length === 1 ? 'um cuidado' : `${numeros[itens.length] || itens.length} cuidados`;
    const nome = String(nomePeludo).trim();
    const sujeito = sexo === 'F' ? `A ${nome}` : sexo === 'M' ? `O ${nome}` : nome;
    const pronome = sexo === 'F' ? 'ela' : sexo === 'M' ? 'ele' : nome;
    const linhas = [
      `Bom dia, ${String(nomeTutor).trim()}! Como você está? 💛`,
      '',
      `${sujeito} está com a gente hoje e temos ${quantidade} para deixar em dia:`,
      ...lista
    ];
    if (temVacina) linhas.push('Nossa veterinária está aqui hoje.');
    linhas.push('', `Podemos cuidar disso hoje, enquanto ${pronome} aproveita o dia na Zêluz? Assim, vocês resolvem tudo em uma só visita, sem precisar encaixar outro compromisso na rotina — e sobra mais tempo para curtirem juntos. 💛`);
    return { ok: true, texto: linhas.join('\n') };
  }

  return { gerarMensagem };
}));
