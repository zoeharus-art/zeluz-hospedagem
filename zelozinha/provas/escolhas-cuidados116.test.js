'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const sourcePath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(__dirname, '../../auaulandia/index.html');
const source = fs.readFileSync(sourcePath, 'utf8');

function scriptPorId(id) {
  const esc = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = source.match(new RegExp(`<script[^>]*id=["']${esc}["'][^>]*>([\\s\\S]*?)<\\/script>`, 'i'));
  assert.ok(m, `script ${id} não encontrado em ${sourcePath}`);
  return m[1];
}

const inicioProdutos = source.indexOf('  const ECTO_DUR_PADRAO=');
const fimProdutos = source.indexOf('  // ===== COLEIRA REPELENTE', inicioProdutos);
const inicioPickers = source.indexOf('  var DASH_QTD=[');
const fimPickers = source.indexOf('  // Shampoo proprio', inicioPickers);
assert.ok(inicioProdutos >= 0 && fimProdutos > inicioProdutos, 'produtos canônicos não encontrados');
assert.ok(inicioPickers >= 0 && fimPickers > inicioPickers, 'pickers canônicos não encontrados');

const ctx = {};
vm.createContext(ctx);
vm.runInContext(scriptPorId('zelozinha-tela94-puro'), ctx, { filename: 'zelozinha-tela94-puro.js' });
vm.runInContext(source.slice(inicioProdutos, fimProdutos), ctx, { filename: 'produtos-nativos.js' });
vm.runInContext(source.slice(inicioPickers, fimPickers), ctx, { filename: 'pickers-nativos.js' });

const T = ctx.ZelozinhaTela94;
assert.ok(T && typeof T.mesclarEscolha === 'function' && typeof T.podeEscolher === 'function');
const pickers = [
  ['qtd', ctx.DASH_QTD],
  ['qtd', ctx.DASH_QTD_PIP],
  ['onde', ctx.DASH_ONDE],
  ['prod', ctx.DASH_ECTO_PROD]
];
pickers.forEach(([campo, lista]) => assert.ok(Array.isArray(lista) && lista.length, `${campo} sem opções nativas`));

const esperado = { linhaId: 'linha_fixture_116', respostaId: 'resposta_fixture_116', revisao: 4 };
function linha() {
  return {
    valor: 'Zafir/SRD (CONFERIR ORIENTAÇÃO)',
    chave: 'zafir__familia-cedro',
    origemVencimento: {
      protocolo: 'cuidado57', linhaId: esperado.linhaId,
      respostaId: esperado.respostaId, revisao: esperado.revisao,
      groupKey: 'grupo_fixture_116', cycleKey: 'ciclo_fixture_116', itemK: 'verm_p'
    },
    det: { cuidado57_estado: 'conferir-orientacao' }
  };
}

let total = 0;
pickers.forEach(([campo, lista]) => lista.forEach(opcao => {
  const antes = linha();
  const origemAntes = structuredClone(antes.origemVencimento);
  const r = T.mesclarEscolha(antes, esperado, { campo, valor: opcao.v, padrao: '' });
  assert.equal(r.ok, true, `${campo} recusou a opção nativa ${JSON.stringify(opcao.v)}: ${r.motivo || r.frase}`);
  assert.equal(r.linha.valor, antes.valor, 'a escolha não pode alterar a célula do lançamento');
  assert.equal(JSON.stringify(r.linha.origemVencimento), JSON.stringify(origemAntes), 'a escolha não pode alterar a resposta humana vinculada');
  assert.equal(r.linha.det.cuidado57_estado, 'conferir-orientacao');
  if (opcao.v) assert.equal(r.linha.det[campo], opcao.v);
  total += 1;
}));

['linha\nnova', `nul\u0000aqui`, `del\u007Faqui`, 'A'.repeat(81)].forEach(valor => {
  const r = T.mesclarEscolha(linha(), esperado, { campo: 'qtd', valor, padrao: '' });
  assert.equal(r.ok, false, `valor inválido foi aceito: ${JSON.stringify(valor)}`);
  assert.equal(r.motivo, 'escolha-invalida');
});
assert.equal(T.mesclarEscolha(linha(), esperado, { campo: 'dose', valor: '1 COMPRIMIDO' }).ok, false);
assert.equal(T.mesclarEscolha(linha(), { ...esperado, revisao: 5 }, { campo: 'qtd', valor: '1 COMPRIMIDO' }).motivo, 'linha-de-outra-resposta');
const aplicada = linha(); aplicada.det.cuidado57_estado = 'realizado-conferido';
assert.equal(T.mesclarEscolha(aplicada, esperado, { campo: 'qtd', valor: '1 COMPRIMIDO' }).motivo, 'ja-aplicado');
assert.equal(T.podeEscolher({ snoopyConfirmado: true }).motivo, 'ja-no-snoopy');
assert.equal(T.podeEscolher({ tarefaEstado: 'emexecucao' }).motivo, 'ja-aplicado');

console.log(`escolhas 6.94: ${total} opções nativas aceitas; controles, tamanho, vínculo, estado e Snoopy protegidos.`);
