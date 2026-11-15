'use strict';
/*
 * PROVA — o quadro «O que separar» no topo da Zelozinha (maquete aprovada pela Adriana em 11/nov/2026).
 * «Quando a zelosinha manda a mensagem e o tutor permite fazer o cuidado (vermífugo, carrapaticida ou a escova), o
 *  nosso colaborador tem que separar. Preciso de um quadro ali na zelozinha o que separar — mas esse quadro precisa
 *  estar visível como o calendário.»
 *
 * Roda o <script id="separar-quadro180"> do próprio index.html numa caixa de areia (vm), sem navegador e sem banco:
 * as fichas, o peso e o banco são falsos e inventados aqui. Nenhum dado de cliente.
 *   node tests/separar-quadro181.test.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const HTML = fs.readFileSync(path.join(__dirname, '..', 'auaulandia', 'index.html'), 'utf8').replace(/\r\n/g, '\n');
let ok = 0; const falhas = [];
async function prova(nome, fn) {
  try { await fn(); ok++; console.log('  ✓ ' + nome); }
  catch (e) { falhas.push(nome); console.log('  ✗ ' + nome + '\n      ' + e.message); }
}
function trecho(id, tag) {
  const a = HTML.indexOf('<' + tag + ' id="' + id + '">');
  if (a < 0) throw new Error('sem <' + tag + ' id="' + id + '">');
  const b = HTML.indexOf('</' + tag + '>', a);
  return HTML.slice(HTML.indexOf('>', a) + 1, b);
}
const JS = trecho('separar-quadro180', 'script');
const CSS = trecho('separar-quadro180-estilo', 'style');

// Caixa de areia: sem o hub na página (o quadro não se liga sozinho); as funções puras e o «marcar» são chamados direto.
function caixa(opts) {
  opts = opts || {};
  const ctx = {
    console, Date, Math, JSON, Object, Array, String, Number, Promise, setTimeout,
    document: { querySelector: () => null },
    ultimoPeso: (ex) => (ex && ex.__peso) || null,
    quemSou: () => 'Recepção Teste',
    DB: opts.db || null,
    _logFalhaGrav: () => {}, _logLeituraFalhou: () => {}
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(JS, ctx);
  return ctx;
}
const DIA = '2026-11-12';
const ficha = (n, tutor, ex) => ({ p: { n, tutor }, ex: Object.assign({ n }, ex || {}), dc: (n + '__' + tutor).toLowerCase(), pk: (n + '__' + tutor).toLowerCase() });

(async () => {
  console.log('O lugar e o desenho:');
  await prova('o quadro mora no topo da Zelozinha, entre o calendário e os botões, fora das abas', () => {
    const ini = HTML.indexOf('<section class="view" id="v-hoje">');
    const v = HTML.slice(ini, HTML.indexOf('<div class="hub116-panes">', ini));
    const cal = v.indexOf('data-zt694-date-host'), sep = v.indexOf('data-sep-host'), ops = v.indexOf('hub116-topline-ops');
    assert.ok(cal > 0 && sep > cal && ops > sep, JSON.stringify({ cal, sep, ops }));
    assert.strictEqual((HTML.match(/data-sep-host role="region"/g) || []).length, 1);
  });
  await prova('o estilo novo só vale dentro da Zelozinha (nenhuma regra solta no resto do app)', () => {
    const regras = CSS.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]*\{/g, '').split('}').map((r) => r.split('{')[0].trim()).filter(Boolean);
    const soltas = regras.filter((sel) => sel.split(',').some((s) => s.trim().indexOf('[data-zelozinha-hub116]') !== 0));
    assert.deepStrictEqual(soltas, []);
  });
  await prova('regras da casa no bloco novo: sem alert/confirm/prompt, sem emoji, sem palavra proibida', () => {
    const t = CSS + JS;
    assert.strictEqual(/\balert\(|\bconfirm\(|\bprompt\(|console\.log/.test(t), false);
    assert.strictEqual(/\p{Extended_Pictographic}/u.test(t), false);
    assert.strictEqual(t.match(/(^|[^\p{L}])(cachorros?|cães|cão|animal|animais|bichos?|donos?|baias?|soltar|soltos?|soltas?)(?![\p{L}])/giu), null);
    assert.strictEqual(/catch\s*\([^)]*\)\s*\{\s*\}(?!\s*\/\*\s*silencioso de propósito)/.test(t), false);
  });

  console.log('\nAs contas:');
  const Q = caixa().SepararQuadro180;
  await prova('o tamanho do carrapaticida sai do peso: até 4, até 10 e até 20 kg', () => {
    assert.deepStrictEqual([3, 4, 7.2, 10, 14, 20, 26, 0].map(Q.tamanhoCarrapaticida), ['até 4 kg', 'até 4 kg', 'até 10 kg', 'até 10 kg', 'até 20 kg', 'até 20 kg', 'acima de 20 kg', '']);
  });
  await prova('de onde sai: a resposta do tutor manda; senão, o «onde»/«veio» da recepção; senão, agendado', () => {
    assert.strictEqual(Q.origemDe('carrapaticida', { origemVencimento: { origemResposta: 'loja' } }), 'loja');
    assert.strictEqual(Q.origemDe('vermifugo', { origemVencimento: { origemResposta: 'bolsa' }, det: { onde: 'LOJA' } }), 'bolsa');
    assert.strictEqual(Q.origemDe('escova', { det: { onde: 'LOJA' } }), 'loja');
    assert.strictEqual(Q.origemDe('coleira', { det: { veio: 'NA BOLSA', onde: 'DAYCARE' } }), 'bolsa');
    assert.strictEqual(Q.origemDe('carrapaticida', { det: { onde: 'BANHO' } }), 'agendado');
    assert.strictEqual(Q.origemDe('vermifugo', {}), 'agendado');
  });
  await prova('as linhas do dia: lançamentos, plano, peso velho, coleira que não veio fica de fora, vacina do plano fica de fora', () => {
    const lista = [
      ficha('Pipoca', 'Ana Teste', { __peso: { data: '2026-10-30', kg: 7.2 }, ecto_nome: 'Credelli' }),
      ficha('Mel', 'Bia Teste', { __peso: { data: '2026-11-01', kg: 14 }, verm_nome: 'Endogard', plano_usos: { verm_dose2_p: { [DIA]: true }, vac_raiva_p: { [DIA]: true } } }),
      ficha('Bidu', 'Caio Teste', { __peso: { data: '2026-08-01', kg: 3.1 } }),
      ficha('Thor', 'Davi Teste', { __peso: { data: '2026-11-10', kg: 26 }, plano_usos: { ecto_p: { [DIA]: true } } })
    ];
    const dash = {
      carrapaticida: {
        a1: { valor: 'Pipoca/SRD (CONFERIR ORIENTAÇÃO)', chave: 'pipoca__ana teste', origemVencimento: { origemResposta: 'loja' }, det: {}, ts: 1 },
        a4: { valor: 'Thor/Golden', chave: 'thor__davi teste', det: { prod: 'Bravecto · 90 dias', qtd: 'PIPETA', onde: 'BANHO' }, ts: 2 }
      },
      vermifugo: { a5: { valor: 'Bidu/SRD (1 COMPRIMIDO · LOJA)', chave: 'bidu__caio teste', det: { qtd: '1 COMPRIMIDO', onde: 'LOJA' }, ts: 3 } },
      escova: { a6: { valor: 'Pipoca/SRD (NA BOLSA)', chave: 'pipoca__ana teste', det: { onde: 'NA BOLSA' }, ts: 4 } },
      coleira: { a7: { valor: 'Bidu/SRD (NÃO VEIO · DAYCARE)', chave: 'bidu__caio teste', det: { veio: 'NÃO VEIO', onde: 'DAYCARE' }, ts: 5 } }
    };
    const L = Q.montarLinhas(DIA, dash, lista, { 'd~escova~a6': { feito: true, quem: 'X', ts: 1 } });
    const ver = JSON.parse(JSON.stringify(L)).map((x) => [x.pet, x.origem, x.b + (x.m || ''), x.velho, x.feito].join(' | '));
    assert.deepStrictEqual(ver, [
      'Bidu | loja | Vermífugo · 1 comprimido (3,1 kg) | true | false',
      'Mel | plano | Vermífugo Endogard · 2ª dose · dose pelo peso (14 kg) | false | false',
      'Pipoca | loja | Carrapaticida · até 10 kg · marca: escolher — da última vez: Credelli | false | false',
      'Pipoca | bolsa | Escova de dentes | false | true',
      'Thor | plano | Carrapaticida Bravecto · 90 dias · acima de 20 kg | false | false'
    ], ver.join('\n'));
    assert.ok(L.some((x) => x.id === 'p~mel__bia teste~verm_dose2_p'), 'a linha do plano tem chave própria');
  });
  await prova('sem lançamento e sem plano no dia: nenhuma linha (o quadro diz «Nada para separar neste dia»)', () => {
    assert.deepStrictEqual(JSON.parse(JSON.stringify(Q.montarLinhas(DIA, {}, [ficha('Mel', 'Bia Teste', { plano_usos: { ecto_p: { '2026-11-13': true } } })], {}))), []);
    assert.ok(JS.indexOf('Nada para separar neste dia.') > 0 && JS.indexOf('Tudo separado neste dia.') > 0);
  });

  console.log('\nO «Separado» grava com quem e quando — e a falha não fica muda:');
  await prova('«Separado» grava {feito, quem, ts} em daycare/separar/{dia}/{linha}', async () => {
    const gravados = [];
    const db = { ref: (c) => ({ set: (v) => { gravados.push([c, v]); return Promise.resolve(); }, on() {}, off() {} }) };
    const ctx = caixa({ db }), S = ctx.SepararQuadro180.estado();
    S.dia = DIA; S.marcas = {};
    const r = await ctx.SepararQuadro180.marcar('d~escova~a6', true);
    assert.strictEqual(r, true);
    assert.strictEqual(gravados.length, 1);
    assert.strictEqual(gravados[0][0], 'daycare/separar/' + DIA + '/d~escova~a6');
    assert.strictEqual(gravados[0][1].feito, true);
    assert.strictEqual(gravados[0][1].quem, 'Recepção Teste');
    assert.ok(gravados[0][1].ts > 0);
    await ctx.SepararQuadro180.marcar('d~escova~a6', false);
    assert.strictEqual(gravados[1][1].feito, false, 'voltar para «Falta separar» também grava (nada se apaga)');
  });
  await prova('gravação recusada: a linha volta ao que estava e o quadro diz para tocar de novo', async () => {
    const db = { ref: () => ({ set: () => Promise.reject(new Error('PERMISSION_DENIED')), on() {}, off() {} }) };
    const ctx = caixa({ db }), S = ctx.SepararQuadro180.estado();
    S.dia = DIA; S.marcas = {};
    const r = await ctx.SepararQuadro180.marcar('d~escova~a6', true);
    assert.strictEqual(r, false);
    assert.strictEqual('d~escova~a6' in S.marcas, false);
    assert.ok(/Não consegui gravar/.test(S.erroGravar), S.erroGravar);
  });

  console.log('\n' + ok + ' provas passaram' + (falhas.length ? (', ' + falhas.length + ' falharam:') : '.'));
  falhas.forEach((f) => console.log('  - ' + f));
  process.exit(falhas.length ? 1 : 0);
})();
