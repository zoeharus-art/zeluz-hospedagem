'use strict';

// O Painel da prevenção (tela Prevenção, 28/out/2026): uma rosca por item — Vacina, Antiparasitário, Vermífugo,
// Coleira repelente, Check-up. As contas têm de bater com as listas de hoje (as mesmas funções), os segmentos somam a
// base, a borda dos 7 dias é exata e o HTML não usa as palavras que a casa não usa.
// Dados INVENTADOS (nomes «Exemplo», tutores «Teste»), sem rede, sem banco.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const APP = path.join(__dirname, '..', 'auaulandia', 'index.html');
const src = fs.readFileSync(APP, 'utf8');

function funcaoDe(texto, nome) {
  const inicio = texto.indexOf('function ' + nome + '(');
  assert.ok(inicio >= 0, 'função ausente: ' + nome);
  const abre = texto.indexOf('{', inicio);
  let nivel = 0;
  let aspas = '';
  let escape = false;
  for (let i = abre; i < texto.length; i += 1) {
    const c = texto[i];
    if (aspas) {
      if (escape) escape = false;
      else if (c === '\\') escape = true;
      else if (c === aspas) aspas = '';
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { aspas = c; continue; }
    if (c === '{') nivel += 1;
    if (c === '}' && --nivel === 0) return texto.slice(inicio, i + 1);
  }
  throw new Error('função incompleta: ' + nome);
}
function blocoDe(texto, inicioTxt, fimTxt) {
  const i = texto.indexOf(inicioTxt);
  assert.ok(i >= 0, 'bloco ausente: ' + inicioTxt);
  const j = texto.indexOf(fimTxt, i);
  assert.ok(j > i, 'fim do bloco ausente: ' + fimTxt);
  return texto.slice(i, j + fimTxt.length);
}

let n = 0;
const fila = [];
function prova(nome, fn) { fila.push([nome, fn]); }

// ---------------------------------------------------------------- o app, só com o que o painel lê
const HOJE = '2026-10-28';
const FUNCOES = [
  // as contas do painel
  'prevPainelUsaColeira', 'prevPainelEstado', 'prevPainelDados',
  // o desenho
  'prevPainelHTML', 'prevPnCartaoHTML', 'prevPnRoscaHTML', 'prevPnTabelaHTML', 'prevPnFilhots', 'prevPnPct', 'prevPnDiaTexto', 'prevPnFimDaLinha', 'escAttr',
  // a regra de hoje, reaproveitada sem cópia
  'prevFaltasDe', 'prevForaDaCobranca', 'prevDispensadoPorExame', 'vermOuFezes', 'vermDose2Prevista', 'vermIntervalo',
  'escovaNaoEscova', 'prevValor', 'prevOrigem', 'prevDataQuebrada', 'prevCheckupVence', 'prevCheckupData', 'prevCheckupContagem',
  'venceuISO', 'diasAteISO', 'addDiasISO', 'fmtBR', 'jsNorm', 'pelKey', 'pelInativo', 'prevJanela',
];
const PREV_ITENS = blocoDe(src, 'const PREV_ITENS=[', '\n  ];');
const PREV_PN = 'var PREV_PN_DIAS=7;\n' + blocoDe(src, 'var PREV_PN_ITENS=[', '\n  ];')
  + '\n' + blocoDe(src, 'var PREV_PN_ESTADOS=[', '\n  ];')
  + '\n' + src.match(/var PREV_PN_C=[^;]+;/)[0]
  + '\n' + blocoDe(src, 'var PREV_PN_SEMANA=[', '];');
const CONSTANTES = ['VERMIF_PROX', 'FEZES_PROX', 'VERMIF_2A_DOSE']
  .map((c) => { const m = src.match(new RegExp('const ' + c + '=[^;]+;')); assert.ok(m, 'constante ausente: ' + c); return m[0]; }).join('\n');

function aparelho(pets) {
  const ctx = { console, localStorage: { getItem: () => null, setItem: () => {} } };
  vm.createContext(ctx);
  const codigo = [
    CONSTANTES,
    'var PREV_ITENS_ESPELHO=0;',
    ...FUNCOES.map((f) => funcaoDe(src, f)),
    PREV_ITENS,
    PREV_PN,
    // O que vem do cadastro e do relógio: de mentira (o resto é o texto de verdade do app).
    "function zHojeISO(){ return '" + HOJE + "'; }",
    'function hojeISO(){ return zHojeISO(); }',
    'var PELUDINHOS=[];',
    'function pelExtra(p){ return p.ex||{}; }',
    'function pelNome(p){ return p.n||""; }',
    'function pelGet(p,c){ var v=(p.ex||{})[c]; return (v!=null&&v!=="")?v:(p[c]!=null?p[c]:""); }',
    'function pelNasc(p){ return (p.ex||{}).nasc||""; }',
    'function parseNascToISO(v){ return v; }',
  ].join('\n');
  vm.runInContext(codigo, ctx);
  ctx.PELUDINHOS = pets;
  return ctx;
}

// ---------------------------------------------------------------- o conjunto inventado
const dia = (k) => {
  const d = new Date(Date.UTC(2026, 9, 28 + k));
  return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
};
// Uma ficha toda em dia (vacinas, carrapaticida, vermífugo, check-up); cada FILHOt muda só o que importa.
function emDia(extra) {
  return Object.assign({
    vac_mult_p: dia(100), vac_gripe_p: dia(100), vac_raiva_p: dia(100),
    ecto_p: dia(20), ecto_t: dia(-10),
    verm_p: dia(50), verm_t: dia(-70),
    checkup_data: dia(-100),
  }, extra || {});
}
let seq = 0;
function pet(rotulo, ex, esperado, extra) {
  seq += 1;
  return Object.assign({ n: 'Exemplo ' + rotulo, tutor: 'Tutor Teste ' + seq, ex, esperado }, extra || {});
}
// esperado: {vacina, antipar, vermif, coleira (undefined = fora da base da coleira), checkup}
const E = (o) => Object.assign({ vacina: 'em', antipar: 'em', vermif: 'em', checkup: 'em' }, o);

function conjunto() {
  return [
    pet('Tudo em dia', emDia(), E({})),
    // vacina
    pet('Gripe vencida', emDia({ vac_gripe_p: dia(-5) }), E({ vacina: 'venc' })),                          // 1 de 3 vencida
    pet('Duas vencidas', emDia({ vac_gripe_p: dia(-40), vac_raiva_p: dia(-2) }), E({ vacina: 'venc' })),
    pet('Vacina sete dias', emDia({ vac_mult_p: dia(7) }), E({ vacina: 'd7' })),                            // borda: 7 exatos
    pet('Vacina oito dias', emDia({ vac_mult_p: dia(8) }), E({ vacina: 'em' })),                            // borda: 8 já é «em dia»
    pet('Vacina hoje', emDia({ vac_raiva_p: dia(0) }), E({ vacina: 'd7' })),                               // vence hoje: ainda não venceu
    pet('Vacina ontem', emDia({ vac_raiva_p: dia(-1) }), E({ vacina: 'venc' })),
    pet('Vacina sem data', emDia({ vac_raiva_p: '' }), E({ vacina: 'sem' })),
    pet('Vacina sem data e outra em sete dias', emDia({ vac_raiva_p: '', vac_mult_p: dia(3) }), E({ vacina: 'd7' })),
    pet('Vacina sem data e outra vencida', emDia({ vac_raiva_p: '', vac_mult_p: dia(-3) }), E({ vacina: 'venc' })),
    // antiparasitário
    pet('Carrapaticida vencido', emDia({ ecto_p: dia(-1) }), E({ antipar: 'venc' })),
    pet('Carrapaticida sete dias', emDia({ ecto_p: dia(7) }), E({ antipar: 'd7' })),
    pet('Carrapaticida oito dias', emDia({ ecto_p: dia(8) }), E({ antipar: 'em' })),
    pet('Carrapaticida sem data', emDia({ ecto_p: '', ecto_t: '' }), E({ antipar: 'sem' })),
    pet('Carrapaticida data impossível', emDia({ ecto_p: '0026-01-01' }), E({ antipar: 'sem' })),
    // vermífugo
    pet('Vermífugo vencido', emDia({ verm_p: dia(-10), verm_t: dia(-130) }), E({ vermif: 'venc' })),
    pet('Vermífugo vencido, fezes em dia', emDia({ verm_p: dia(-10), verm_t: dia(-130), fezes_t: dia(-20), fezes_p: dia(100) }), E({ vermif: 'em' })),
    pet('Vermífugo sem data e sem fezes', emDia({ verm_p: '', verm_t: '' }), E({ vermif: 'sem' })),
    pet('Vermífugo sem data, fezes em dia', emDia({ verm_p: '', verm_t: '', fezes_t: dia(-20), fezes_p: dia(100) }), E({ vermif: 'em' })),
    pet('Vermífugo sete dias', emDia({ verm_p: dia(7), verm_t: dia(-113) }), E({ vermif: 'd7' })),
    // coleira (só quem usa)
    pet('Coleira vencida', emDia({ col_nome: 'Seresto', col_t: dia(-190), col_p: dia(-3) }), E({ coleira: 'venc' })),
    pet('Coleira sete dias', emDia({ col_nome: 'Seresto', col_t: dia(-173), col_p: dia(7) }), E({ coleira: 'd7' })),
    pet('Coleira em dia', emDia({ col_nome: 'Seresto', col_t: dia(-20), col_p: dia(160) }), E({ coleira: 'em' })),
    pet('Coleira só a marca', emDia({ col_nome: 'Seresto' }), E({ coleira: 'sem' })),
    pet('Coleira a fazer na Zêluz', emDia({ col_afazer: 'Sim' }), E({ coleira: 'sem' })),
    pet('Não usa coleira', emDia({}), E({})),                                                                // fora da base da coleira
    // check-up
    pet('Check-up nunca fez', emDia({ checkup_data: '', checkup_fez: 'Nunca fez' }), E({ checkup: 'venc' })),
    pet('Check-up vencido', emDia({ checkup_data: dia(-400) }), E({ checkup: 'venc' })),
    pet('Check-up sem informação', emDia({ checkup_data: '' }), E({ checkup: 'sem' })),
    pet('Check-up à mão em sete dias', emDia({ checkup_data: dia(-358), checkup_p: dia(7), checkup_p_manual: true }), E({ checkup: 'd7' })),
    pet('Check-up à mão em oito dias', emDia({ checkup_data: dia(-357), checkup_p: dia(8), checkup_p_manual: true }), E({ checkup: 'em' })),
    // inativo: fora de tudo, mesmo devendo tudo
    pet('Inativo', emDia({ inativo: 'Sim', vac_mult_p: dia(-9), ecto_p: dia(-9), verm_p: dia(-9), verm_t: dia(-129), col_nome: 'Seresto', col_p: dia(-9), checkup_data: dia(-900) }), null),
  ];
}
const ITENS = ['vacina', 'antipar', 'vermif', 'coleira', 'checkup'];

// ---------------------------------------------------------------- 1) as contas
prova('contas: cada FILHOt cai no estado que a regra de hoje dá; inativo fica fora', () => {
  const pets = conjunto();
  const a = aparelho(pets);
  const d = a.prevPainelDados();
  const ativos = pets.filter((p) => p.esperado);
  assert.strictEqual(d.base, ativos.length, 'a base são os ativos');
  const usam = ativos.filter((p) => p.esperado.coleira);
  assert.strictEqual(d.baseColeira, usam.length, 'a base da coleira são só os que usam');
  ITENS.forEach((k) => {
    const it = d.itens.filter((x) => x.k === k)[0];
    const alvo = k === 'coleira' ? usam : ativos;
    const conta = { em: 0, d7: 0, venc: 0, sem: 0 };
    alvo.forEach((p) => { conta[p.esperado[k]] += 1; });
    assert.deepStrictEqual({ em: it.em, d7: it.d7, venc: it.venc, sem: it.sem }, conta, 'contagem de ' + k);
    assert.strictEqual(it.total, alvo.length, 'total de ' + k);
    assert.strictEqual(it.em + it.d7 + it.venc + it.sem, it.total, 'os segmentos de ' + k + ' somam a base');
    assert.strictEqual(it.listas.venc.length, it.venc, 'lista de vencidos de ' + k);
    assert.strictEqual(it.listas.d7.length, it.d7, 'lista de 7 dias de ' + k);
    const nomesV = Array.from(it.listas.venc.map((o) => o.nome)).sort();
    assert.deepStrictEqual(nomesV, alvo.filter((p) => p.esperado[k] === 'venc').map((p) => p.n).sort(), 'quem está na lista de vencidos de ' + k);
    const nomes7 = Array.from(it.listas.d7.map((o) => o.nome)).sort();
    assert.deepStrictEqual(nomes7, alvo.filter((p) => p.esperado[k] === 'd7').map((p) => p.n).sort(), 'quem está na lista de 7 dias de ' + k);
  });
  assert.ok(!d.itens.some((it) => it.listas.venc.concat(it.listas.d7).some((o) => o.nome === 'Exemplo Inativo')), 'o inativo não aparece em lista nenhuma');
});

prova('contas: bate com as listas de hoje — vencido no painel é vencido em prevFaltasDe (janela 0), 7 dias é «a vencer» na janela 7', () => {
  const pets = conjunto();
  const a = aparelho(pets);
  const d = a.prevPainelDados();
  const GRUPO = { vacina: ['vac_mult_p', 'vac_gripe_p', 'vac_raiva_p'], antipar: ['ecto_p'], vermif: ['verm_p'] };
  Object.keys(GRUPO).forEach((k) => {
    const it = d.itens.filter((x) => x.k === k)[0];
    const venc = [];
    const d7 = [];
    pets.filter((p) => p.esperado).forEach((p) => {
      const ex = p.ex;
      const hoje = a.prevFaltasDe(ex, 0).filter((f) => GRUPO[k].indexOf(f.k) >= 0);
      const sete = a.prevFaltasDe(ex, 7).filter((f) => GRUPO[k].indexOf(f.k) >= 0);
      if (hoje.some((f) => f.tipo === 'venc')) venc.push(p.n);
      else if (sete.some((f) => f.tipo === 'avencer')) d7.push(p.n);
    });
    assert.deepStrictEqual(Array.from(it.listas.venc.map((o) => o.nome)).sort(), venc.sort(), 'vencidos de ' + k + ' = os que a lista de hoje mostra');
    assert.deepStrictEqual(Array.from(it.listas.d7.map((o) => o.nome)).sort(), d7.sort(), 'a vencer de ' + k);
  });
  // check-up: a conta da seção «Check-up veterinário» (nunca + vencidos)
  const c = a.prevCheckupContagem();
  const it = d.itens.filter((x) => x.k === 'checkup')[0];
  assert.strictEqual(it.venc, c.nunca.length + c.vencidos.length, '«Nunca fez» conta como vencido');
  assert.strictEqual(it.sem, c.semInfo.length);
});

prova('contas: uma ficha com 1 de 3 vacinas vencida conta UMA vez em «vencido» e a linha traz só a vacina vencida', () => {
  const a = aparelho(conjunto());
  const it = a.prevPainelDados().itens.filter((x) => x.k === 'vacina')[0];
  const l = it.listas.venc.filter((o) => o.nome === 'Exemplo Gripe vencida')[0];
  assert.ok(l, 'está na lista');
  assert.deepStrictEqual(Array.from(l.faltas.map((f) => f.k)), ['vac_gripe_p']);
  const duas = it.listas.venc.filter((o) => o.nome === 'Exemplo Duas vencidas')[0];
  assert.deepStrictEqual(Array.from(duas.faltas.map((f) => f.k)).sort(), ['vac_gripe_p', 'vac_raiva_p']);
  assert.strictEqual(it.listas.venc.filter((o) => o.nome === 'Exemplo Duas vencidas').length, 1, 'um FILHOt, uma linha');
});

prova('contas: ordem das listas — quem venceu há mais tempo primeiro («nunca fez» antes); quem vence antes primeiro', () => {
  const a = aparelho(conjunto());
  const d = a.prevPainelDados();
  const ck = d.itens.filter((x) => x.k === 'checkup')[0];
  assert.strictEqual(ck.listas.venc[0].nome, 'Exemplo Check-up nunca fez');
  const vac = d.itens.filter((x) => x.k === 'vacina')[0];
  const dias = vac.listas.venc.map((o) => Math.max.apply(null, o.faltas.map((f) => f.dias)));
  assert.deepStrictEqual(dias, dias.slice().sort((x, y) => y - x), 'vencidos: do mais atrasado ao menos');
  const v7 = vac.listas.d7.map((o) => Math.min.apply(null, o.faltas.map((f) => f.dias)));
  assert.deepStrictEqual(v7, v7.slice().sort((x, y) => x - y), 'a vencer: do mais próximo ao mais distante');
});

prova('contas: sem nenhum FILHOt a conta é zero e nada quebra (base 0, nada de NaN)', () => {
  const a = aparelho([]);
  const d = a.prevPainelDados();
  assert.strictEqual(d.base, 0);
  d.itens.forEach((it) => { assert.deepStrictEqual([it.total, it.em, it.d7, it.venc, it.sem], [0, 0, 0, 0, 0]); });
});

// ---------------------------------------------------------------- 2) o desenho
const PALAVRAS_PROIBIDAS = /(?<![\p{L}])(cachorros?|c[ãa]es|c[ãa]o|animal|animais|bichos?|donos?|dona|propriet[áa]ri[oa]s?|funcion[áa]ri[oa]s?|atendentes?|vendedora|hotel canino|hospedagem|pet)(?![\p{L}])/iu;
function painelDeTeste(opc) {
  const pets = conjunto();
  const a = aparelho(pets);
  const d = a.prevPainelDados();
  return { a, d, pets, html: a.prevPainelHTML(d, Object.assign({ cols: 3 }, opc || {})) };
}
const pct = (x, total) => (x && Math.round(x / total * 100) === 0 ? 'menos de 1%' : Math.round(x / total * 100) + '%');

prova('desenho: cinco cartões na ordem do pedido, com número no centro, legenda, botões e a regra', () => {
  const { d, html } = painelDeTeste();
  const nomes = [...html.matchAll(/<h3 class="pv-nome">([^<]+)<\/h3>/g)].map((m) => m[1]);
  assert.deepStrictEqual(nomes, ['Vacina', 'Antiparasitário', 'Vermífugo', 'Coleira repelente', 'Check-up']);
  assert.deepStrictEqual([...html.matchAll(/class="pv-card[^"]*" data-i="(\d)"/g)].map((m) => m[1]), ['0', '1', '2', '3', '4']);
  d.itens.forEach((it) => {
    assert.ok(html.indexOf('Vence em 7 dias (' + it.d7 + ')') >= 0, 'botão de 7 dias de ' + it.k);
    assert.ok(html.indexOf('Vencido (' + it.venc + ')') >= 0, 'botão de vencidos de ' + it.k);
    assert.ok(html.indexOf('<b data-n="' + it.venc + '">' + it.venc + '</b>') >= 0, 'o centro mostra os vencidos de ' + it.k);
  });
  assert.ok(/Antiparasitário<\/strong> = carrapaticida/.test(html) && /quem faz exame de fezes em dia conta como em dia/.test(html) && /«nunca fez» conta como vencido/.test(html));
  assert.ok(new RegExp('só entra quem usa coleira \\(' + d.itens[3].total + ' dos ' + d.base + '\\)').test(html), 'a regra da coleira diz M dos N');
  assert.ok(/<button[^>]*id="prevPnBt_vacina_venc"[^>]*aria-expanded="false"/.test(html));
});

prova('desenho: cada segmento tem a dica «Rótulo: N FILHOts · P%», e os arcos mais os vãos fecham a volta inteira', () => {
  const { d, html } = painelDeTeste();
  const C = 2 * Math.PI * 59;
  d.itens.forEach((it, i) => {
    const art = html.split('<article ')[i + 1].split('</article>')[0];
    const segs = [...art.matchAll(/<circle class="pv-seg"[^>]*data-txt="([^"]+)"[^>]*data-len="([\d.]+)"/g)];
    const esperados = [['em', 'Em dia'], ['d7', 'Vence em 7 dias'], ['venc', 'Vencido'], ['sem', 'Sem data']].filter(([k]) => it[k] > 0);
    assert.strictEqual(segs.length, esperados.length, 'um segmento por estado com gente em ' + it.k);
    esperados.forEach(([k, rot], j) => {
      assert.strictEqual(segs[j][1], rot + ': ' + it[k] + ' FILHOt' + (it[k] === 1 ? '' : 's') + ' · ' + pct(it[k], it.total), 'dica de ' + it.k + '/' + k);
    });
    const volta = segs.reduce((s, m) => s + parseFloat(m[2]) + 2, 0);
    assert.ok(Math.abs(volta - C) < 0.1 * segs.length, 'a volta fecha em ' + it.k + ': ' + volta + ' x ' + C);
  });
});

prova('desenho: a dica diz «Vencido: 12 FILHOts · 8%» com os números certos (12 de 150)', () => {
  const a = aparelho([]);
  const it = { k: 'x', nome: 'Teste', total: 150, em: 100, d7: 10, venc: 12, sem: 28, soUsa: false, regra: 'r', listas: { venc: [], d7: [] } };
  const svg = a.prevPnRoscaHTML(it, false);
  assert.ok(svg.indexOf('data-txt="Vencido: 12 FILHOts · 8%"') >= 0);
  assert.ok(svg.indexOf('data-txt="Em dia: 100 FILHOts · 67%"') >= 0);
  const um = a.prevPnRoscaHTML(Object.assign({}, it, { total: 1000, venc: 1, em: 999, d7: 0, sem: 0 }), false);
  assert.ok(um.indexOf('data-txt="Vencido: 1 FILHOt · menos de 1%"') >= 0, 'um só: singular e nunca «0%»');
  const vazia = a.prevPnRoscaHTML(Object.assign({}, it, { total: 0, em: 0, d7: 0, venc: 0, sem: 0 }), false);
  assert.ok(vazia.indexOf('pv-seg') < 0 && vazia.indexOf('NaN') < 0, 'base zero: só o trilho');
});

prova('desenho: com animação os arcos nascem em 0 e levam o comprimento final guardado; sem, já nascem cheios', () => {
  const { a, d } = painelDeTeste();
  const com = a.prevPainelHTML(d, { cols: 3, animar: true }), sem = a.prevPainelHTML(d, { cols: 3, animar: false });
  assert.ok(/stroke-dasharray:0 370\.\d+/.test(com) && !/stroke-dasharray:[1-9]/.test(com));
  assert.ok(/stroke-dasharray:\d+\.\d+ 370\.\d+/.test(sem) && !/stroke-dasharray:0 /.test(sem));
  assert.ok(com.indexOf('data-len=') > 0);
});

prova('desenho: subtítulo com o dia da semana, a data e a base (coleira: só os que usam)', () => {
  const { d, html } = painelDeTeste();
  assert.ok(html.indexOf('Quarta-feira, 28/10/2026 · base: ' + d.base + ' FILHOts ativos (coleira: só os ' + d.baseColeira + ' que usam)') >= 0, html.match(/<p class="pn-sub">[^<]*/)[0]);
  const a = aparelho([]);
  assert.strictEqual(a.prevPnDiaTexto('2026-10-31'), 'Sábado, 31/10/2026');
  assert.strictEqual(a.prevPnDiaTexto('2026-11-01'), 'Domingo, 01/11/2026');
});

prova('desenho: «Ver em tabela» — cinco itens por em dia, vence em 7 dias, vencido, sem data e total', () => {
  const { d, html } = painelDeTeste({ tabela: true });
  assert.ok(/<button[^>]*id="prevPnTab"[^>]*aria-expanded="true"[^>]*>Esconder a tabela</.test(html));
  const tab = html.split('<table>')[1].split('</table>')[0];
  assert.ok(/<th scope="col">Item<\/th><th scope="col">Em dia<\/th><th scope="col">Vence em 7 dias<\/th><th scope="col">Vencido<\/th><th scope="col">Sem data<\/th><th scope="col">Total<\/th>/.test(tab));
  const linhas = [...tab.matchAll(/<tr><th scope="row">([^<]+)<\/th>((?:<td[^>]*>\d+<\/td>){5})<\/tr>/g)];
  assert.strictEqual(linhas.length, 5);
  linhas.forEach((m, i) => {
    const it = d.itens[i];
    assert.strictEqual(m[1], it.nome);
    assert.deepStrictEqual([...m[2].matchAll(/>(\d+)</g)].map((x) => +x[1]), [it.em, it.d7, it.venc, it.sem, it.total]);
  });
  assert.ok(/id="prevPnTabela" hidden/.test(painelDeTeste().html), 'fechada por padrão');
});

prova('desenho: o painel da lista entra logo depois da última carta da MESMA linha — 1 coluna, 2 colunas e 3+2', () => {
  const { a, d } = painelDeTeste();
  const lista = () => '<div id="prevPnLista"></div>';
  const depoisDe = (html) => {   // chave do cartão imediatamente antes do painel
    const antes = html.slice(0, html.indexOf('id="prevPnLista"'));
    const ks = [...antes.matchAll(/data-k="(\w+)"/g)];
    return ks[ks.length - 1][1];
  };
  const ordem = ['vacina', 'antipar', 'vermif', 'coleira', 'checkup'];
  const ESPERADO = {
    3: ['vermif', 'vermif', 'vermif', 'checkup', 'checkup'],
    2: ['antipar', 'antipar', 'coleira', 'coleira', 'checkup'],
    1: ordem,
  };
  [3, 2, 1].forEach((cols) => {
    ordem.forEach((k, i) => {
      const html = a.prevPainelHTML(d, { cols, aberto: { k, st: 'venc' }, lista });
      assert.strictEqual(depoisDe(html), ESPERADO[cols][i], cols + ' colunas, cartão ' + k);
      assert.strictEqual((html.match(/id="prevPnLista"/g) || []).length, 1, 'um painel só');
      assert.ok(new RegExp('<article class="pv-card[^"]*on[^"]*"[^>]*data-k="' + k + '"').test(html), 'o cartão aberto fica marcado');
      assert.ok(new RegExp('id="prevPnBt_' + k + '_venc"[^>]*aria-expanded="true"').test(html));
    });
  });
});

prova('desenho: nenhuma das palavras que a casa não usa (cão, cachorro, animal, bicho, dono, pet…) e o nome do item é escapado', () => {
  const { html } = painelDeTeste({ tabela: true });
  const m = html.replace(/<[^>]+>/g, ' ').match(PALAVRAS_PROIBIDAS);
  assert.strictEqual(m, null, 'achou: ' + (m && m[0]));
  assert.ok(/FILHOts? ativos?/.test(html));
  const a = aparelho([]);
  const d = a.prevPainelDados();
  d.itens[0].nome = 'Vacina <img src=x onerror=alert(1)>';
  assert.ok(a.prevPainelHTML(d, { cols: 3 }).indexOf('<img') < 0, 'o nome do item é escapado');
});

prova('desenho: o app liga o painel — contêiner entre o aviso e a busca, chamada isolada no renderPrevencao (se falhar, a lista continua)', () => {
  assert.ok(/<div id="prevPainel"><\/div>\s*<div class="card">\s*<input class="cad-in prev-busca"/.test(src), 'o contêiner fica entre o aviso e o cartão da busca');
  const r = funcaoDe(src, 'renderPrevencao');
  assert.ok(/try\{ prevPainelRender\(\); \}catch\(e\)\{ try\{ console\.warn\(/.test(r), 'chamada isolada (a falha vai para o console, não para a auditoria de gravações)');
  assert.ok(r.indexOf('prevPainelRender') < r.indexOf('var lista=prevDados()'), 'o painel vem antes da lista');
});

// ---------------------------------------------------------------- 3) o painel das linhas
// O que a lista de hoje já tem (chip, «Feito hoje», mensagem pronta, editor) vem das funções de verdade do app; aqui só entram
// de mentira o banco, o papel de quem usa e as caixas que não interessam à prova.
const FUNCOES_LISTA = ['prevPnListaHTML', 'prevPnLinhaHTML', 'prevPnChipTexto', 'prevPnChipEstilo', 'prevPnFeitoHoje', 'prevPnFicha', 'prevCelulaData',
  'prevCorrigeChip', 'prevCorrigeAlvo', 'prevMsgVirar'];
// jsAspas tem uma barra e aspas no corpo que confundem o extrator de funções; vem da linha inteira, como está no app.
const JS_ASPAS = src.slice(src.indexOf('function jsAspas(s){'), src.indexOf('\n', src.indexOf('function jsAspas(s){')));
function aparelhoLista(pets, opc) {
  opc = opc || {};
  const a = aparelho(pets);
  const chamadas = [];
  const codigo = [
    ...FUNCOES_LISTA.map((f) => funcaoDe(src, f)),
    JS_ASPAS,
    'var PREV_MSG_ABERTO="", PREV_CORRIGE_ABERTO="", PREV_CORRIGE_ORIGEM="", PREV_MSG_CFG_OK=true, PREV_MSG_CFG_ERRO=false, VENC_CFG={};',
    'var __chamadas=[]; var __pode=' + (opc.pode === false ? 'false' : 'true') + ';',
    'function prevCorrigePode(){ return __pode; }',
    'function prevCorrBotaoGravando(){ return false; }',
    'function prevCorrigePainelHTML(ch,t,h,o){ return PREV_CORRIGE_ABERTO && PREV_CORRIGE_ORIGEM===o ? "<div class=\\"editor-stub\\" data-o=\\""+o+"\\"></div>" : ""; }',
    'function prevCorrigeFeitoHoje(ch,k,t){ __chamadas.push(["feitoHoje",ch,k,t,PREV_CORRIGE_ORIGEM]); }',
    'function prevMsgHTML(p,k,pref){ return "<div class=\\"msg-stub\\" data-id=\\""+(pref||"")+pelKey(p)+"_"+k+"\\"></div>"; }',
    'function prevRedesenhar(){ __chamadas.push(["redesenhar"]); }',
    'function prevEhHospede(p){ return !!p.hospede; }',
    'function oportDe(k,t){ return null; }',
    'function oportLinha(o){ return ""; }',
    'function prevCheckupIdade(p){ return "3 anos"; }',
    'function abrirPeludinhoCheckup(i){ __chamadas.push(["ficha",i]); }',
    'function prevSecFaixaHTML(k){ return ""; }',
    'function escAttr(s){ return (s||"").toString().replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;"); }',
  ].join('\n');
  vm.runInContext(codigo, a);
  a.__lerChamadas = () => JSON.parse(JSON.stringify(vm.runInContext('__chamadas', a)));
  return a;
}
const itemDe = (d, k) => d.itens.filter((x) => x.k === k)[0];

prova('lista: o painel «Vacina · Vencido» traz o título, a contagem, o Fechar e as linhas, na ordem da conta', () => {
  const a = aparelhoLista(conjunto());
  const d = a.prevPainelDados();
  const it = itemDe(d, 'vacina');
  const html = a.prevPnListaHTML(it, 'venc');
  assert.ok(/id="prevPnListaT">Vacina · Vencido<span>4 FILHOts<\/span>/.test(html), html.slice(0, 400));
  assert.ok(html.indexOf('onclick="prevPnAbrir(\'vacina\',\'venc\')">Fechar</button>') >= 0);
  const nomes = [...html.matchAll(/class="pv-ficha"[^>]*>([^<]+)</g)].map((m) => m[1]);
  assert.deepStrictEqual(nomes, Array.from(it.listas.venc.map((o) => o.nome)));
  assert.ok(/role="region"/.test(html) && /tabindex="-1"/.test(html));
  const h7 = a.prevPnListaHTML(it, 'd7');
  assert.ok(h7.indexOf('Vacina · Vence em 7 dias<span>3 FILHOts</span>') >= 0);
});

prova('lista: o chip diz «venceu em dd/mm · há N dias» e «vence em dd/mm · em N dias» (hoje, amanhã), com o dia certo', () => {
  const a = aparelhoLista(conjunto());
  const d = a.prevPainelDados();
  const v = a.prevPnListaHTML(itemDe(d, 'vacina'), 'venc');
  assert.ok(v.indexOf('venceu em 27/10 · há 1 dia ✎') >= 0, 'ontem');
  assert.ok(v.indexOf('venceu em 23/10 · há 5 dias ✎') >= 0, 'gripe de 5 dias');
  const s = a.prevPnListaHTML(itemDe(d, 'vacina'), 'd7');
  assert.ok(s.indexOf('vence em 04/11 · em 7 dias ✎') >= 0, 'a borda dos 7 dias');
  assert.ok(s.indexOf('vence em 28/10 · hoje ✎') >= 0, 'hoje');
  assert.ok(s.indexOf('vence em 31/10 · em 3 dias ✎') >= 0);
  const p = aparelhoLista(conjunto());
  const x = p.prevPnChipTexto({ data: '2026-10-29', dias: 1 }, 'd7');
  assert.strictEqual(x, 'vence em 29/10 · amanhã');
  assert.strictEqual(p.prevPnChipTexto({ data: '2025-12-30', dias: 302 }, 'venc'), 'venceu em 30/12/2025 · há 302 dias', 'outro ano: a data inteira');
});

prova('lista: cada linha tem os MESMOS botões da lista de hoje — chip que abre o editor, «Feito hoje» e «Mensagem pronta» — e a origem do toque é do painel', () => {
  const a = aparelhoLista(conjunto());
  const d = a.prevPainelDados();
  const it = itemDe(d, 'antipar');
  const html = a.prevPnListaHTML(it, 'venc');
  const l = it.listas.venc[0];
  const ch = l.ch.replace(/'/g, "\\'");
  assert.ok(html.indexOf("onclick=\"prevPnFeitoHoje('" + ch + "','ecto_p')\">Feito hoje</button>") >= 0, 'Feito hoje');
  assert.ok(html.indexOf("onclick=\"prevMsgVirar('" + ch + "','ecto_p','pn:')\">Mensagem pronta</button>") >= 0, 'Mensagem pronta');
  assert.ok(html.indexOf("onclick=\"prevCorrigeAbrir('" + ch + "','ecto_p','prev','pn-ecto_p')\"") >= 0, 'o chip abre o editor de sempre, com a origem do painel');
  assert.ok(html.indexOf('class="prev-corrige-chip"') >= 0);
  // sem permissão de lançar (monitor, plantonista): o chip vira texto e some o «Feito hoje», como na lista de hoje
  const so = aparelhoLista(conjunto(), { pode: false });
  const h2 = so.prevPnListaHTML(itemDe(so.prevPainelDados(), 'antipar'), 'venc');
  assert.ok(h2.indexOf('Feito hoje') < 0 && h2.indexOf('prev-corrige-chip') < 0, 'sem permissão: só leitura');
  assert.ok(h2.indexOf('Mensagem pronta') >= 0, 'a mensagem continua');
});

prova('lista: vacina com mais de uma vencida mostra uma linha do FILHOt e uma ação por vacina, com o nome dela', () => {
  const a = aparelhoLista(conjunto());
  const html = a.prevPnListaHTML(itemDe(a.prevPainelDados(), 'vacina'), 'venc');
  const bloco = html.split('class="pv-lin"').filter((b) => b.indexOf('Exemplo Duas vencidas') >= 0)[0];
  assert.ok(bloco.indexOf('<div class="pv-fal-nome">Vacina de Gripe</div>') >= 0 && bloco.indexOf('<div class="pv-fal-nome">Vacina Antirrábica</div>') >= 0);
  assert.strictEqual((bloco.match(/>Feito hoje</g) || []).length, 2);
  assert.strictEqual((html.match(/Exemplo Duas vencidas/g) || []).length, 1, 'o FILHOt aparece uma vez');
});

prova('lista: «Feito hoje» e a mensagem passam pelas funções de sempre (nenhuma gravação nova) e a mensagem do painel tem id próprio', () => {
  const a = aparelhoLista(conjunto());
  a.prevPnFeitoHoje('exemplo__tutor teste 1', 'vac_gripe_p');
  assert.deepStrictEqual(a.__lerChamadas(), [['feitoHoje', 'exemplo__tutor teste 1', 'vac_gripe_p', 'prev', 'pn-vac_gripe_p']], 'prevCorrigeFeitoHoje, na tela «prev»');
  a.prevMsgVirar('ch', 'k', 'pn:');
  assert.strictEqual(vm.runInContext('PREV_MSG_ABERTO', a), 'pn:ch|k');
  a.prevMsgVirar('ch', 'k', 'pn:');
  assert.strictEqual(vm.runInContext('PREV_MSG_ABERTO', a), '', 'tocar de novo fecha');
  a.prevMsgVirar('ch', 'k');
  assert.strictEqual(vm.runInContext('PREV_MSG_ABERTO', a), 'ch|k', 'sem prefixo, como a seção sempre fez');
  assert.ok(/var id=\(pref\|\|''\)\+pelKey\(p\)\+'_'\+k/.test(funcaoDe(src, 'prevMsgHTML')), 'o id da caixa leva o prefixo');
  ['prevPainelDados', 'prevPnListaHTML', 'prevPnLinhaHTML', 'prevPnFeitoHoje', 'prevPainelRender', 'prevPnAbrir'].forEach((f) => {
    const c = funcaoDe(src, f);
    assert.ok(!/DB\.ref|prevGravar\(|\.set\(|\.update\(|\.remove\(/.test(c), f + ' não grava nada');
  });
  assert.ok(/prevCorrigeFeitoHoje\(ch, k, 'prev'\)/.test(funcaoDe(src, 'prevPnFeitoHoje')));
});

prova('lista: hóspede aparece sem «Feito hoje» nem editor — o aviso ao tutor é do bloco «Hóspedes»', () => {
  const pets = conjunto();
  pets.push(Object.assign(pet('Hóspede', emDia({ vac_mult_p: dia(-4) }), E({ vacina: 'venc' })), { hospede: true }));
  const a = aparelhoLista(pets);
  const html = a.prevPnListaHTML(itemDe(a.prevPainelDados(), 'vacina'), 'venc');
  const bloco = html.split('class="pv-lin"').filter((b) => b.indexOf('Exemplo Hóspede') >= 0)[0];
  assert.ok(bloco.indexOf('Feito hoje') < 0 && bloco.indexOf('prev-corrige-chip') < 0 && bloco.indexOf('Mensagem pronta') < 0);
  assert.ok(bloco.indexOf('Hóspede: o aviso ao tutor fica no bloco «Hóspedes»') >= 0);
  assert.ok(bloco.indexOf('venceu em 24/10 · há 4 dias') >= 0, 'mas a situação aparece');
});

prova('lista: check-up usa o que a seção dele tem — «Nunca fez — conta como vencido», idade e «Copiar mensagem» (só para vencido)', () => {
  const a = aparelhoLista(conjunto());
  const it = itemDe(a.prevPainelDados(), 'checkup');
  const v = a.prevPnListaHTML(it, 'venc');
  const nunca = v.split('class="pv-lin"').filter((b) => b.indexOf('Exemplo Check-up nunca fez') >= 0)[0];
  assert.ok(nunca.indexOf('Nunca fez — conta como vencido') >= 0 && nunca.indexOf('3 anos') >= 0);
  assert.ok(/prevCheckupCopiar\(this,\d+,'nunca'\)">Copiar mensagem</.test(nunca));
  const ven = v.split('class="pv-lin"').filter((b) => b.indexOf('Exemplo Check-up vencido') >= 0)[0];
  assert.ok(/prevCheckupCopiar\(this,\d+,'vencido'\)">Copiar mensagem</.test(ven) && /venceu em \d\d\/\d\d(\/\d{4})? · há \d+ dias/.test(ven), ven);
  const s = a.prevPnListaHTML(it, 'd7');
  assert.ok(s.indexOf('Copiar mensagem') < 0, 'quem ainda não venceu não recebe cobrança');
  assert.ok(/vence em 04\/11 · em 7 dias/.test(s), 'a borda dos 7 dias do check-up');
});

prova('lista: quem abre a ficha é o nome (leva ao índice certo); recorte vazio diz que não há ninguém', () => {
  const pets = conjunto();
  const a = aparelhoLista(pets);
  const alvo = pets.filter((p) => p.n === 'Exemplo Gripe vencida')[0];
  a.prevPnFicha(a.pelKey(alvo));
  assert.deepStrictEqual(a.__lerChamadas(), [['ficha', pets.indexOf(alvo)]]);
  const vazio = aparelhoLista([pet('Só em dia', emDia(), E({}))]);
  const h = vazio.prevPnListaHTML(itemDe(vazio.prevPainelDados(), 'vacina'), 'venc');
  assert.ok(h.indexOf('Ninguém com este item vencido agora.') >= 0 && h.indexOf('class="pv-lin"') < 0);
  assert.ok(vazio.prevPnListaHTML(itemDe(vazio.prevPainelDados(), 'vacina'), 'd7').indexOf('Ninguém com este item vencendo nos próximos 7 dias.') >= 0);
});

prova('lista: o HTML das linhas não usa as palavras que a casa não usa e escapa o que vem do cadastro (nome, raça, tutor)', () => {
  const pets = conjunto();
  pets.push(Object.assign(pet('<b>Perigo</b>', emDia({ vac_mult_p: dia(-4) }), E({ vacina: 'venc' })), { tutor: 'Tutor "Aspas" <i>x</i>' }));
  const a = aparelhoLista(pets);
  const d = a.prevPainelDados();
  const todo = d.itens.map((it) => a.prevPnListaHTML(it, 'venc') + a.prevPnListaHTML(it, 'd7')).join('\n');
  assert.ok(todo.indexOf('<b>Perigo') < 0 && todo.indexOf('<i>x') < 0, 'nada de HTML solto vindo do cadastro');
  assert.ok(todo.indexOf('&lt;b>Perigo') >= 0);
  const m = todo.replace(/<[^>]+>/g, ' ').match(PALAVRAS_PROIBIDAS);
  assert.strictEqual(m, null, 'achou: ' + (m && m[0]));
});

prova('lista: o app tem as peças — faixa verde com «Desfazer» também no painel, abrir/fechar e o painel dentro do contêiner', () => {
  assert.ok(/#prevPainel \[data-prev-faixa\]/.test(funcaoDe(src, 'prevSecFaixasRefazer')), 'a faixa do painel se atualiza quando o «Desfazer» fica pronto');
  const lista = funcaoDe(src, 'prevPnListaHTML');
  assert.ok(/prevSecFaixaHTML\(k\)/.test(lista) && /data-prev-faixa/.test(lista));
  const abrir = funcaoDe(src, 'prevPnAbrir');
  assert.ok(/PREV_PN_ABERTO\.k===k && PREV_PN_ABERTO\.st===st/.test(abrir), 'tocar de novo fecha');
});

// ---------------------------------------------------------------- 4) o redesenho (a tela chama prevPainelRender a cada mudança do cadastro)
function aparelhoRender(pets, reduz, foco) {
  const a = aparelhoLista(pets);
  const el = {
    innerHTML: '', style: {}, firstChild: null, attrs: {}, escrituras: 0,
    getAttribute(k) { return this.attrs[k] === undefined ? null : this.attrs[k]; },
    setAttribute(k, v) { this.attrs[k] = String(v); },
    addEventListener() {}, querySelectorAll() { return []; },
  };
  Object.defineProperty(el, 'html', { get() { return this._h; } });
  let h = '';
  Object.defineProperty(el, 'innerHTML', { get() { return h; }, set(v) { h = v; el.escrituras += 1; el.firstChild = v ? {} : null; } });
  a.document = {
    getElementById: (id) => (id === 'prevPainel' ? el : null), createElement: () => ({ setAttribute() {}, classList: { add() {}, remove() {} } }),
    body: { appendChild() {} }, addEventListener() {}, documentElement: { clientWidth: 1280 },
  };
  a.window = {
    matchMedia: (q) => ({ matches: /reduce/.test(q) ? !!reduz : true }), addEventListener() {}, innerHeight: 900,
  };
  a.performance = { now: () => 0 };
  a.requestAnimationFrame = () => 0;
  const codigo = [
    blocoDe(src, 'var PREV_PN_ABERTO=', "PREV_PN_FOCO='';"),
    'var __foco=' + (foco ? '{}' : 'null') + ';',
    'function cuidado57FocoAtual(){ return __foco; }',
    'function _logFalhaGrav(a,e){ throw e; }',
    ...['prevPainelRender', 'prevPnReduz', 'prevPnColunas', 'prevPnLigar', 'prevPnAnimar', 'prevPnTipo', 'prevPnTipSome', 'prevPnTipMostra', 'prevPnAbrir', 'prevPnTabelaVirar']
      .map((f) => funcaoDe(src, f)),
  ].join('\n');
  vm.runInContext(codigo, a);
  a.__el = el;
  return a;
}

prova('redesenho: a primeira vez anima; repetir com os mesmos números não anima nem reescreve o painel; mudar um número anima de novo', () => {
  const pets = conjunto();
  const a = aparelhoRender(pets, false, false);
  a.prevPainelRender();
  assert.ok(/stroke-dasharray:0 370/.test(a.__el.innerHTML), 'primeira vez: nasce em 0');
  const escritas = a.__el.escrituras;
  a.prevPainelRender();
  assert.strictEqual(a.__el.escrituras, escritas, 'sem mudança nenhuma, nem reescreve (digitar na busca redesenha a tela inteira)');
  // um FILHOt a menos vencido (o «Feito hoje» gravou): o número muda, a rosca anima de novo
  const alvo = pets.filter((p) => p.n === 'Exemplo Gripe vencida')[0];
  alvo.ex.vac_gripe_p = dia(300);
  a.prevPainelRender();
  assert.ok(a.__el.escrituras > escritas, 'redesenhou com o dado novo');
  assert.ok(/stroke-dasharray:0 370/.test(a.__el.innerHTML), 'mudou o dado: anima');
  const v = a.prevPainelDados().itens[0];
  assert.ok(a.__el.innerHTML.indexOf('Vencido (' + v.venc + ')') >= 0);
  const depois = a.__el.escrituras, tela = a.__el.innerHTML;
  a.prevPainelRender();
  a.prevPainelRender();
  assert.strictEqual(a.__el.escrituras, depois, 'outro redesenho logo em seguida não corta a animação que está rodando');
  assert.strictEqual(a.__el.innerHTML, tela);
});

prova('redesenho: com «menos movimento» (prefers-reduced-motion) os arcos já nascem cheios, sempre', () => {
  const a = aparelhoRender(conjunto(), true, false);
  a.prevPainelRender();
  assert.ok(!/stroke-dasharray:0 /.test(a.__el.innerHTML) && /stroke-dasharray:\d+\.\d+ 370/.test(a.__el.innerHTML));
  assert.ok(/prefers-reduced-motion:reduce\)\{ \.pv-dp\{animation:none\} \.pv-seg,\.pv-card,\.pv-bt\{transition:none\} \}/.test(src), 'o CSS também desliga a transição e a entrada do painel');
});

prova('redesenho: na tela de uma tarefa de cuidado (foco) o painel some e não calcula nada; sem cadastro carregado, também não quebra', () => {
  const a = aparelhoRender(conjunto(), false, true);
  a.prevPainelRender();
  assert.strictEqual(a.__el.innerHTML, '');
  assert.strictEqual(a.__el.style.display, 'none');
  const b = aparelhoRender([], false, false);
  b.prevPainelRender();
  assert.ok(/0 FILHOts ativos/.test(b.__el.innerHTML), 'base zero desenha, com zeros');
  assert.ok(b.__el.innerHTML.indexOf('NaN') < 0 && b.__el.innerHTML.indexOf('undefined') < 0);
});

prova('redesenho: abrir um recorte e tocar de novo fecha; trocar de recorte troca o painel; a tabela abre e fecha', () => {
  const a = aparelhoRender(conjunto(), false, false);
  a.__lerHtml = () => a.__el.innerHTML;
  vm.runInContext("function prevPnListaHTML(it,st){ return '<div id=\"prevPnLista\">'+it.k+'/'+st+'</div>'; }", a);
  a.prevPnAbrir('vacina', 'venc');
  assert.ok(a.__lerHtml().indexOf('<div id="prevPnLista">vacina/venc</div>') >= 0);
  a.prevPnAbrir('vacina', 'd7');
  assert.ok(a.__lerHtml().indexOf('vacina/d7') >= 0 && a.__lerHtml().indexOf('vacina/venc') < 0, 'trocar de recorte troca o painel');
  a.prevPnAbrir('vacina', 'd7');
  assert.ok(a.__lerHtml().indexOf('id="prevPnLista"') < 0, 'tocar de novo fecha');
  a.prevPnTabelaVirar();
  assert.ok(/id="prevPnTabela">/.test(a.__lerHtml()) && /aria-expanded="true"/.test(a.__lerHtml()));
  a.prevPnTabelaVirar();
  assert.ok(/id="prevPnTabela" hidden/.test(a.__lerHtml()));
});

(async () => {
  for (const [nome, fn] of fila) {
    try { await fn(); n += 1; } catch (e) { console.error('FALHOU: ' + nome); throw e; }
  }
  console.log('painel-prevencao161: OK (' + n + ' provas)');
})().catch((e) => { console.error(e); process.exitCode = 1; });
