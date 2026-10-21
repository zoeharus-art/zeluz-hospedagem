'use strict';
/*
 * PROVA mecânica do manual para qualquer IA (Story 6.112, Fase 2A, task 7: AC6.1 a AC6.5, AC6.7,
 * AC25.1, AC26.2).
 *
 * Confere, sem rede e sem ninguém ler o texto:
 *   - os três arquivos existem: AGENTS.md, CLAUDE.md e zelozinha/README.md;
 *   - o AGENTS.md tem as sete partes, na ordem, e na parte 5 os dez "nunca" e as duas regras da story
 *     (mais a regra "nada da pasta zelozinha direto no master", do "Fora" da story);
 *   - o CLAUDE.md tem no máximo 3 linhas não vazias, aponta para o AGENTS.md e não repete regra;
 *   - o README traz os assuntos do AC6.3;
 *   - os dois dizem, com a data, o estado de hoje (AC26.2): a VPS ainda roda a cópia da Codex e
 *     mudar o projeto ainda não muda o que roda (ou, depois da virada, que roda a partir do projeto);
 *   - o que não se sabe da VPS aparece escrito como «a confirmar pela Codex»;
 *   - marca e português (AC25.1): sem emoji, sem "Zeluz" sem circunflexo fora de código, sem as
 *     palavras proibidas da marca fora de uma linha de instrução;
 *   - nenhum segredo, dado pessoal, endereço ou porta da VPS (a mesma varredura do AC8);
 *   - (QA 3ª rodada, DOC-003) a parte 7 cita pelo NOME cada segredo que o projeto lê (as pontes, o App Check, o SSH do retrato, os PINs);
 *   - (QA 3ª rodada, DOC-004) as frases que diziam mais do que a fonte não voltam, e a parte 2 conta que o `tests/lib/retrato.js` entra
 *     por SSH numa VPS, em vez de dizer que o Claude não entra nela.
 *
 * Como as provas funcionam: `verificarManual` recebe os textos e devolve a lista de problemas. Ela
 * roda com os arquivos reais (lista vazia) e com "defeitos plantados": cópias estragadas de propósito,
 * uma por problema (d45: um "nunca" a menos, d46: regra duplicada no CLAUDE.md, etc.). Cada defeito tem
 * de ser pego.
 *
 * Uso:  node zelozinha/provas/manual.test.js
 */

const assert = require('assert');
const A = require('./ajuda');
const V = require('./varredura');
const S = require('./amostras');

const { prova, rodar } = A.criarProvas('Manual para qualquer IA (AGENTS.md, CLAUDE.md, zelozinha/README.md)');

const PARTES = [
  [1, /^## 1\. O que é o projeto\s*$/m],
  [2, /^## 2\. Quem decide\s*$/m],
  [3, /^## 3\. Como testar\s*$/m],
  [4, /^## 4\. Como publicar e como voltar\s*$/m],
  [5, /^## 5\. O que nunca fazer\s*$/m],
  [6, /^## 6\. Como escrever para a equipe e para as famílias\s*$/m],
  [7, /^## 7\. Onde está cada segredo\s*$/m],
];

// Os dez "nunca" do AC6.4, as duas regras da story e a regra do "Fora" (nada da pasta direto no master).
// Cada exigência é um conjunto de expressões que o MESMO item da lista tem de satisfazer.
const EXIGENCIAS = [
  { id: 'N1', descricao: 'segredo ou dado de cliente em arquivo, commit, captura, log ou chat', res: [/segredo/i, /dado de cliente/i] },
  { id: 'N2', descricao: 'mensagem de teste a tutor', res: [/mensagem de teste/i, /tutor/i] },
  { id: 'N3', descricao: 'ler o banco real em teste sem querer', res: [/banco real/i, /teste/i] },
  { id: 'N4', descricao: 'editar código direto na VPS', res: [/direto na VPS/i] },
  { id: 'N5', descricao: 'reiniciar a Zelozinha de segunda a sexta das 6h45 às 13h05', res: [/reiniciar/i, /6h45/, /13h05/] },
  { id: 'N6', descricao: 'mudar texto aprovado sem a Adriana', res: [/texto aprovado/i, /Adriana/] },
  { id: 'N7', descricao: 'publicar regras do banco', res: [/regras do banco/i, /publicar/i] },
  { id: 'N8', descricao: 'mexer na área protegida do check-in do corpo', res: [/área protegida/i, /pendAvisarChegada/, /#v-daycare/] },
  { id: 'N9', descricao: 'usar /local/acompanhamento como teste de saúde', res: [/\/local\/acompanhamento/] },
  { id: 'N10', descricao: 'usar pull_request_target ou runner próprio na VPS', res: [/pull_request_target/, /runner/i] },
  { id: 'R1', descricao: 'regra: mudança de lugar e de comportamento nunca no mesmo pull request', res: [/mudança de lugar/i, /comportamento/i, /mesmo pull request/i] },
  { id: 'R2', descricao: 'regra: Merge só com sinal verde', res: [/Merge só com sinal verde/i] },
  { id: 'R3', descricao: 'regra: nada da pasta zelozinha direto no master', res: [/pasta `zelozinha`/i, /direto no master/i] },
];

const SECOES_README = [
  'O que ela faz',
  'O que ela não faz',
  'A janela de envio',
  'O que ela lê e grava no Firebase',
  'Como rodar os testes',
  'Como publicar',
  'Como voltar',
  'Como parar numa emergência',
  'Histórico de releases',
];

// DOC-003: cada segredo que o projeto lê tem de aparecer, pelo nome, numa linha da tabela da parte 7 (só o nome; o valor nunca).
// Cada exigência é um conjunto de expressões que a MESMA linha tem de satisfazer. O lookbehind separa APPCHECK_DEBUG_TOKEN (a ponte
// do Telegram) de FIREBASE_APPCHECK_DEBUG_TOKEN (o ambiente de quem roda).
const SEGREDOS_DA_PARTE_7 = [
  { id: 'S1', descricao: 'PONTE_SENHA, das três pontes', res: [/PONTE_SENHA/] },
  { id: 'S2', descricao: 'TOKEN_BOT, da ponte do Telegram', res: [/TOKEN_BOT/] },
  { id: 'S3', descricao: 'APPCHECK_DEBUG_TOKEN, da ponte do Telegram', res: [/(?<![A-Z_])APPCHECK_DEBUG_TOKEN/] },
  { id: 'S4', descricao: 'FIREBASE_APPCHECK_DEBUG_TOKEN, do ambiente de quem roda', res: [/FIREBASE_APPCHECK_DEBUG_TOKEN/] },
  { id: 'S5', descricao: 'a chave de SSH de quem roda tests/lib/retrato.js', res: [/SSH/, /retrato\.js/] },
  { id: 'S6', descricao: 'os PINs do app (a equipe, as senhas fixas trocadas e a Gestão)', res: [/PINs/, /pin-gestao/, /senhas-fixas/] },
];

// DOC-004: frases que diziam mais do que a fonte (o handoff da Codex e o código do app). Nenhuma pode voltar.
const FRASES_QUE_DIZIAM_MAIS = [
  { id: 'F1', re: /Qualquer volta preserva/i, fonte: 'o handoff diz «qualquer rollback precisa preservar»' },
  { id: 'F2', re: /O serviço de envio não o usa/i, fonte: 'o handoff diz «não há evidência documentada de integração de envio»' },
  { id: 'F3', re: /Não depende de Claude, Telegram nem Hermes/i, fonte: 'o handoff diz «não há evidência documentada de integração de envio»' },
  { id: 'F4', re: /o Claude não entra nela/i, fonte: 'o tests/lib/retrato.js entra por SSH numa VPS, com a chave de quem roda' },
  { id: 'F5', re: /O Claude, que escreveu esta primeira versão, não entra na VPS/i, fonte: 'a frase vale só para a sessão que escreveu o texto' },
];

const PALAVRAS_PROIBIDAS = /\b(cachorros?|cães|cão|cãozinhas?|animais|animal|bichos?|donos?|proprietários?|funcionários?|atendentes?|vendedoras?|monitor(?:es|as?)?|pets?|hospedagem|hotel canino)\b/i;
const LINHA_DE_INSTRUCAO = /não use|nunca use|nunca|proibid/i;

function semCodigo(texto) {
  return texto.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
}

function secao(texto, regexTitulo) {
  const m = regexTitulo.exec(texto);
  if (!m) return null;
  const resto = texto.slice(m.index + m[0].length);
  const fim = resto.search(/^## /m);
  return fim === -1 ? resto : resto.slice(0, fim);
}

function itensNumerados(texto) {
  return texto.split('\n').filter((l) => /^\d+\.\s/.test(l));
}

function itemQueCumpre(itens, exigencia) {
  return itens.filter((it) => exigencia.res.every((re) => re.test(it)));
}

function problemasDeMarca(nome, texto) {
  const p = [];
  if (/\p{Extended_Pictographic}/u.test(texto)) p.push(nome + ': tem emoji');
  const prosa = semCodigo(texto);
  if (/\b(Zeluz|Zéluz|ZELUZ)\b/.test(prosa)) p.push(nome + ': "Zêluz" sem o circunflexo');
  prosa.split('\n').forEach((linha, i) => {
    if (PALAVRAS_PROIBIDAS.test(linha) && !LINHA_DE_INSTRUCAO.test(linha)) {
      p.push(nome + ': palavra proibida da marca fora de uma linha de instrução (linha ' + (i + 1) + ' do texto sem código)');
    }
  });
  return p;
}

function problemasDeEstado(nome, texto) {
  const p = [];
  const antes = /^## Estado de hoje \(\d{2}\/\d{2}\/\d{4}\)/m.test(texto)
    && /a VPS ainda roda a cópia da Codex/i.test(texto)
    && /mudar o projeto ainda não muda o que roda/i.test(texto);
  const depois = /a VPS roda a partir do projeto, desde \d{2}\/\d{2}\/\d{4}/i.test(texto);
  if (!antes && !depois) p.push(nome + ': falta o estado com data (AC26.2): "a VPS ainda roda a cópia da Codex; mudar o projeto ainda não muda o que roda", ou, depois da virada, "a VPS roda a partir do projeto, desde dd/mm/aaaa"');
  if (!/a confirmar pela Codex/i.test(texto)) p.push(nome + ': o que não se sabe da VPS não aparece como «a confirmar pela Codex»');
  return p;
}

function problemasDoClaude(texto) {
  const p = [];
  const linhas = texto.split('\n').filter((l) => l.trim() !== '');
  if (linhas.length > 3) p.push('CLAUDE.md: tem ' + linhas.length + ' linhas não vazias (o máximo é 3)');
  if (!/AGENTS\.md/.test(texto)) p.push('CLAUDE.md: não manda ler o AGENTS.md');
  if (/\b(nunca|sempre|proibido|obrigatório|não faça)\b/i.test(texto)) p.push('CLAUDE.md: tem palavra de regra (nunca, sempre, proibido...); regra só mora no AGENTS.md');
  EXIGENCIAS.forEach((e) => { if (e.res.every((re) => re.test(texto))) p.push('CLAUDE.md: repete a regra ' + e.id); });
  return p;
}

function problemasDeFrases(nome, texto) {
  const p = [];
  FRASES_QUE_DIZIAM_MAIS.forEach((f) => {
    if (f.re.test(texto)) p.push(nome + ': frase que diz mais do que a fonte (' + f.id + '): ' + f.fonte);
  });
  if (/ledger/i.test(texto) && !/(?:precisa|tem de) preservar o ledger/i.test(texto)) p.push(nome + ': a volta tem de dizer «precisa preservar» (ou «tem de preservar») o ledger e a projeção (F1)');
  return p;
}

/** Devolve a lista de problemas dos três textos (null = arquivo que não existe). */
function verificarManual(t) {
  const p = [];
  if (t.agents === null) p.push('AGENTS.md não existe');
  if (t.claude === null) p.push('CLAUDE.md não existe');
  if (t.readme === null) p.push('zelozinha/README.md não existe');

  if (t.agents !== null) {
    let ultima = -1;
    PARTES.forEach(([n, re]) => {
      const m = re.exec(t.agents);
      if (!m) { p.push('AGENTS.md: falta a parte ' + n); return; }
      if (m.index < ultima) p.push('AGENTS.md: a parte ' + n + ' está fora de ordem');
      ultima = m.index;
    });
    const s5 = secao(t.agents, PARTES[4][1]);
    if (s5 !== null) {
      const itens = itensNumerados(s5);
      EXIGENCIAS.forEach((e) => {
        const quais = itemQueCumpre(itens, e);
        if (quais.length === 0) p.push('AGENTS.md, parte 5: falta «' + e.descricao + '» (' + e.id + ')');
        if (quais.length > 1) p.push('AGENTS.md, parte 5: ' + e.id + ' aparece em mais de um item (cada regra mora em um item só)');
      });
    }
    const s2 = secao(t.agents, PARTES[1][1]);
    if (s2 !== null && !(/retrato\.js/.test(s2) && /SSH/.test(s2) && /C7/.test(s2))) {
      p.push('AGENTS.md, parte 2: falta dizer que o tests/lib/retrato.js entra por SSH numa VPS e que se é a da Zelozinha está a confirmar (C7) (F4)');
    }
    const s7 = secao(t.agents, PARTES[6][1]);
    if (s7 !== null) {
      const linhasDaTabela = s7.split('\n').filter((l) => l.startsWith('|'));
      SEGREDOS_DA_PARTE_7.forEach((e) => {
        if (itemQueCumpre(linhasDaTabela, e).length === 0) p.push('AGENTS.md, parte 7: falta o segredo «' + e.descricao + '» (' + e.id + ')');
      });
    }
    p.push.apply(p, problemasDeEstado('AGENTS.md', t.agents));
    p.push.apply(p, problemasDeFrases('AGENTS.md', t.agents));
    p.push.apply(p, problemasDeMarca('AGENTS.md', t.agents));
  }
  if (t.claude !== null) {
    p.push.apply(p, problemasDoClaude(t.claude));
    p.push.apply(p, problemasDeMarca('CLAUDE.md', t.claude));
  }
  if (t.readme !== null) {
    SECOES_README.forEach((titulo) => {
      if (!new RegExp('^## ' + titulo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'm').test(t.readme)) p.push('README: falta a seção «' + titulo + '»');
    });
    p.push.apply(p, problemasDeEstado('README', t.readme));
    p.push.apply(p, problemasDeFrases('README', t.readme));
    p.push.apply(p, problemasDeMarca('README', t.readme));
  }
  // AC6.7: a mesma varredura de segredo e de dado pessoal do AC8, sobre os três textos.
  [['AGENTS.md', t.agents], ['CLAUDE.md', t.claude], ['zelozinha/README.md', t.readme]].forEach(([nome, texto]) => {
    if (texto === null) return;
    V.varrerTexto(texto, nome, { escopoTotal: true }).forEach((a) => p.push(nome + ':' + a.linha + ': varredura achou ' + a.rotulo));
  });
  return p;
}

function reais() {
  return { agents: A.lerDaRaiz('AGENTS.md'), claude: A.lerDaRaiz('CLAUDE.md'), readme: A.lerDaRaiz('zelozinha/README.md') };
}

function semProblemas(lista) {
  if (lista.length === 0) return;
  throw new Error(lista.length + ' problema(s):\n' + lista.slice(0, 8).join('\n') + (lista.length > 8 ? '\n(+' + (lista.length - 8) + ')' : ''));
}

prova('M1 (AC6.1 a AC6.5, AC6.7, AC25.1, AC26.2) — os três arquivos reais passam em todas as conferências', () => {
  semProblemas(verificarManual(reais()));
});

prova('M2 (AC6.4) — cada exigência da parte 5 aparece em UM item só, e a lista tem pelo menos 13 itens (dez «nunca», três regras)', () => {
  const t = reais();
  const itens = itensNumerados(secao(t.agents, PARTES[4][1]));
  assert.ok(itens.length >= 13, 'a parte 5 tem ' + itens.length + ' itens numerados');
  EXIGENCIAS.forEach((e) => assert.strictEqual(itemQueCumpre(itens, e).length, 1, e.id + ' deveria estar em exatamente um item'));
});

prova('M3 (d45) — defeito plantado: tirar qualquer um dos treze itens da parte 5 é pego', () => {
  const t = reais();
  EXIGENCIAS.forEach((e) => {
    const sem = t.agents.split('\n').filter((linha) => !e.res.every((re) => re.test(linha))).join('\n');
    assert.notStrictEqual(sem, t.agents, e.id + ': a linha nem foi encontrada para tirar');
    const problemas = verificarManual({ agents: sem, claude: t.claude, readme: t.readme });
    assert.ok(problemas.some((x) => x.includes(e.id)), 'tirar ' + e.id + ' passou sem ser pego');
  });
});

prova('M4 — defeito plantado: tirar qualquer uma das sete partes do AGENTS.md é pego', () => {
  const t = reais();
  PARTES.forEach(([n, re]) => {
    const sem = t.agents.replace(re, '## (título apagado)');
    assert.notStrictEqual(sem, t.agents);
    assert.ok(verificarManual({ agents: sem, claude: t.claude, readme: t.readme }).some((x) => x.includes('parte ' + n)), 'tirar a parte ' + n + ' passou sem ser pego');
  });
  // fora de ordem: troca a 2 pela 3
  const trocado = t.agents.replace(PARTES[1][1], '## 3. Como testar (TROCADO)').replace(PARTES[2][1], '## 2. Quem decide');
  assert.ok(verificarManual({ agents: trocado, claude: t.claude, readme: t.readme }).some((x) => /fora de ordem|falta a parte/.test(x)));
});

prova('M5 (d46, AC6.2) — defeito plantado: CLAUDE.md com mais de 3 linhas, sem apontar para o AGENTS.md, ou com regra própria é pego', () => {
  const t = reais();
  const casos = {
    'quatro linhas': 'a\nb\nc\nd\nLeia o AGENTS.md\n',
    'não aponta para o AGENTS.md': '# CLAUDE.md\nLeia o manual do projeto.\n',
    'regra própria (nunca)': '# CLAUDE.md\nLeia o AGENTS.md. Nunca faça push direto.\n',
    'repete uma regra inteira': '# CLAUDE.md\nLeia o AGENTS.md. Merge só com sinal verde.\n',
  };
  Object.keys(casos).forEach((nome) => {
    assert.ok(verificarManual({ agents: t.agents, claude: casos[nome], readme: t.readme }).length > 0, 'passou sem ser pego: ' + nome);
  });
});

prova('M6 (AC6.3) — defeito plantado: tirar qualquer seção do README é pego', () => {
  const t = reais();
  SECOES_README.forEach((titulo) => {
    const sem = t.readme.split('\n').filter((l) => !l.startsWith('## ' + titulo)).join('\n');
    assert.notStrictEqual(sem, t.readme, 'a seção «' + titulo + '» nem existe no README');
    assert.ok(verificarManual({ agents: t.agents, claude: t.claude, readme: sem }).some((x) => x.includes(titulo)), 'tirar «' + titulo + '» passou sem ser pego');
  });
});

prova('M7 (AC26.2) — defeito plantado: sem o estado de hoje com data, ou sem «a confirmar pela Codex», é pego (nos dois arquivos)', () => {
  const t = reais();
  ['agents', 'readme'].forEach((qual) => {
    const semEstado = t[qual].replace(/a VPS ainda roda a cópia da Codex/gi, 'a VPS roda o que roda');
    const semData = t[qual].replace(/^## Estado de hoje \(\d{2}\/\d{2}\/\d{4}\)/m, '## Estado de hoje');
    const semPendencia = t[qual].replace(/a confirmar pela Codex/gi, 'ver depois');
    [semEstado, semData, semPendencia].forEach((mutante) => {
      assert.notStrictEqual(mutante, t[qual]);
      const entrada = Object.assign({}, t, { [qual]: mutante });
      assert.ok(verificarManual(entrada).length > 0, qual + ': defeito de estado passou sem ser pego');
    });
  });
});

prova('M8 (AC25.1) — defeito plantado: emoji, "Zeluz" sem circunflexo, palavra proibida fora de linha de instrução e palavra proibida em linha de instrução (esta pode)', () => {
  const t = reais();
  const com = (extra) => Object.assign({}, t, { agents: t.agents + '\n' + extra + '\n' });
  const emoji = String.fromCodePoint(0x1f600);
  assert.ok(verificarManual(com('Texto com emoji ' + emoji)).length > 0, 'emoji passou');
  assert.ok(verificarManual(com('A Zeluz abre às sete.')).length > 0, 'Zeluz sem circunflexo passou');
  assert.ok(verificarManual(com('O cachorro do dono chegou.')).length > 0, 'palavra proibida passou');
  assert.ok(verificarManual(com('A hospedagem fica cheia.')).length > 0, 'hospedagem em prosa passou');
  assert.deepStrictEqual(verificarManual(com('Não use as palavras cachorro, animal, bicho e dono.')), [], 'a linha de instrução deveria poder citar as palavras');
  assert.deepStrictEqual(verificarManual(com('O banco se chama `hospedagem-zeluz` e o projeto `zeluz-hospedagem`.')), [], 'nome técnico em código deveria passar');
});

prova('M9 (AC6.7, d58) — defeito plantado: segredo, telefone, e-mail, endereço de servidor ou porta em qualquer dos três textos é pego (valores montados em execução)', () => {
  const t = reais();
  const plantas = S.positivas();
  ['agents', 'claude', 'readme'].forEach((qual) => {
    ['chave-privada', 'telefone-ddd', 'email', 'ip-publico', 'porta-ssh', 'jwt'].forEach((regra) => {
      const entrada = Object.assign({}, t, { [qual]: t[qual] + '\n' + plantas[regra][0] + '\n' });
      const problemas = verificarManual(entrada);
      assert.ok(problemas.some((x) => x.includes('varredura achou')), qual + ' + ' + regra + ' passou sem ser pego');
      assert.ok(!problemas.join('\n').includes(plantas[regra][0]), 'a mensagem de problema repetiu o valor plantado (' + regra + ')');
    });
  });
});

prova('M10 (DOC-003) — a parte 7 cita cada segredo do projeto pelo nome, e defeito plantado: tirar a linha de qualquer um deles é pego', () => {
  const t = reais();
  const s7 = secao(t.agents, PARTES[6][1]);
  const linhas = s7.split('\n').filter((l) => l.startsWith('|'));
  SEGREDOS_DA_PARTE_7.forEach((e) => {
    assert.strictEqual(itemQueCumpre(linhas, e).length >= 1, true, e.id + ' não está na tabela da parte 7');
    const sem = t.agents.split('\n').filter((linha) => !(linha.startsWith('|') && e.res.every((re) => re.test(linha)))).join('\n');
    assert.notStrictEqual(sem, t.agents, e.id + ': a linha nem foi encontrada para tirar');
    const problemas = verificarManual({ agents: sem, claude: t.claude, readme: t.readme });
    assert.ok(problemas.some((x) => x.includes(e.id)), 'tirar ' + e.id + ' passou sem ser pego');
  });
  // a tabela cita o nome, nunca o valor: a varredura do M1 já confere, e aqui nenhuma linha da parte 7 tem "=" seguido de valor
  assert.ok(!/(?:PONTE_SENHA|TOKEN_BOT|DEBUG_TOKEN)\s*[:=]\s*\S/.test(s7), 'a parte 7 parece trazer um valor, e deveria trazer só o nome');
});

prova('M11 (DOC-004) — as cinco frases que diziam mais do que a fonte não voltam: plantar qualquer uma delas no AGENTS.md ou no README é pego, e a volta tem de dizer «precisa preservar»', () => {
  const t = reais();
  const plantas = {
    F1: 'Qualquer volta preserva o ledger e a projeção.',
    F2: 'O serviço de envio não o usa.',
    F3: 'Não depende de Claude, Telegram nem Hermes para enviar.',
    F4: 'Quem decide é a Codex; o Claude não entra nela.',
    F5: 'O Claude, que escreveu esta primeira versão, não entra na VPS.',
  };
  Object.keys(plantas).forEach((id) => {
    ['agents', 'readme'].forEach((qual) => {
      const entrada = Object.assign({}, t, { [qual]: t[qual] + '\n' + plantas[id] + '\n' });
      assert.ok(verificarManual(entrada).some((x) => x.includes('(' + id + ')')), qual + ' + ' + id + ' passou sem ser pego');
    });
  });
  // a volta sem «precisa preservar» também é pega
  const semPreservar = t.agents.replace(/precisa preservar o ledger/, 'preserva o ledger');
  assert.notStrictEqual(semPreservar, t.agents);
  assert.ok(verificarManual({ agents: semPreservar, claude: t.claude, readme: t.readme }).some((x) => x.includes('(F1)')), 'a volta sem «precisa preservar» passou');
});

prova('M12 (DOC-004) — a parte 2 do AGENTS.md conta que o tests/lib/retrato.js entra por SSH numa VPS (e que se é a da Zelozinha está a confirmar); sem isso é pego', () => {
  const t = reais();
  const s2 = secao(t.agents, PARTES[1][1]);
  assert.ok(/retrato\.js/.test(s2) && /SSH/.test(s2) && /C7/.test(s2), 'a parte 2 não conta do retrato');
  const sem = t.agents.replace(/`tests\/lib\/retrato\.js`/, 'um script de teste');
  assert.notStrictEqual(sem, t.agents);
  assert.ok(verificarManual({ agents: sem, claude: t.claude, readme: t.readme }).some((x) => x.includes('(F4)')), 'tirar o retrato da parte 2 passou sem ser pego');
});

rodar();
