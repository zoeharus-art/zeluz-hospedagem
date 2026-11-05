'use strict';
// «Não aparece quanto dá de medicação no Lançamento do dia» e «eu escolhi na Zelozinha e não foi» (Adriana, 05/nov/2026). Dados inventados.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const html = fs.readFileSync(path.resolve(__dirname, '../auaulandia/index.html'), 'utf8');
let falhas = 0, total = 0;
function prova(nome, fn) { total++; try { fn(); console.log('  ok  ' + nome); } catch (e) { falhas++; console.log('  FALHOU  ' + nome + '\n    ' + (e && e.stack || e)); } }

const ini = html.indexOf('  function dashCelulaComDose(o){'), fim = html.indexOf('  function dashCartaoHTML(', ini);
assert.ok(ini > 0 && fim > ini);
const ctx = { String }; vm.createContext(ctx); vm.runInContext(html.slice(ini, fim) + '\nthis.f=dashCelulaComDose;', ctx);
const linha = (valor, det, origem) => ({ valor, det: Object.assign({ cuidado57_estado: 'conferir-orientacao' }, det), origemVencimento: { protocolo: 'cuidado57', origemResposta: origem } });

prova('a dose escolhida aparece no lugar de «conferir», com o lugar que a resposta diz', () => {
  assert.equal(ctx.f(linha('Mel/SRD (Fulana) (CONFERIR ORIENTAÇÃO)', { qtd: '1 COMPRIMIDO E MEIO' }, 'loja')), 'Mel/SRD (Fulana) (1 COMPRIMIDO E MEIO · LOJA)');
  assert.equal(ctx.f(linha('Tico/Westie (CONFERIR ORIENTAÇÃO)', { qtd: '1 COMPRIMIDO' }, 'bolsa')), 'Tico/Westie (1 COMPRIMIDO · NA BOLSA)');
});
prova('produto e quantidade saem na mesma ordem de quem lança à mão', () => {
  assert.equal(ctx.f(linha('Nina/SRD (CONFERIR ORIENTAÇÃO)', { prod: 'PIPETA · 30 DIAS', qtd: 'PIPETA' }, 'loja')), 'Nina/SRD (PIPETA · 30 DIAS · PIPETA · LOJA)');
});
prova('o lugar trocado na escolha vale mais que o da resposta', () => {
  assert.equal(ctx.f(linha('Tico/Westie (CONFERIR ORIENTAÇÃO)', { qtd: '1 COMPRIMIDO', onde: 'LOJA' }, 'bolsa')), 'Tico/Westie (1 COMPRIMIDO · LOJA)');
});
prova('sem dose escolhida continua pedindo para conferir', () => {
  assert.equal(ctx.f(linha('Tico/Westie (CONFERIR ORIENTAÇÃO)', {}, 'bolsa')), 'Tico/Westie (CONFERIR ORIENTAÇÃO)');
});
prova('linha lançada à mão ou vazia fica como está', () => {
  assert.equal(ctx.f({ valor: 'Bia/SRD (1 COMPRIMIDO · LOJA)', det: { qtd: '1 COMPRIMIDO', onde: 'LOJA' } }), 'Bia/SRD (1 COMPRIMIDO · LOJA)');
  assert.equal(ctx.f(undefined), '');
});
prova('o cartão dos Lançamentos e a lista do Day Care usam a função', () => {
  assert.match(html, /<strong>'\+escAttr\(dashCelulaComDose\(o\)\)\+'<\/strong>/);
  assert.match(html, /nome:String\(dashCelulaComDose\(reg\)\|\|'Peludinho'\)/);
});
prova('a dose do peso é sugestão: não acende nem conta como escolhida até o toque', () => {
  assert.match(html, /qtdAtual=txt\(det\.qtd\),sugerida=qtdAtual\?'':preMarcaQtd\(c,cy\)/);
  assert.match(html, /falta=T\.faltaEscolher\(cy\.itemK,det,''\),travado=/);
  assert.match(html, /Toque nela para confirmar\./);
  assert.doesNotMatch(html, /faltaEscolher\(cy\.itemK,det,preMarcaQtd/);
});
prova('o texto do plano ativo aprovado está nas mensagens de saldo e fora das de troca', () => {
  assert.ok(html.includes("REP_OBS_PLANO='Um detalhe para você ter sempre à mão: as reposições são feitas com o plano ativo, tá?'"));
  assert.ok(html.includes("var semReposicao=modo==='troca'||modo==='troca-desmarcada-fora'||(modo==='troca-desfeita'&&info.estorna);"));
  assert.ok(html.includes("(semReposicao?'':'\\n\\n'+REP_OBS_PLANO)+'\\n\\nEssa mensagem é para que possamos controlar juntas. 💛'"));
  assert.ok(html.includes("ficando somente o valor da pernoite para acerto.\\n\\n'+REP_OBS_PLANO"));
});
console.log(`zelozinha-dose-lancamento177: ${total - falhas} de ${total} provas passaram`);
if (falhas) process.exit(1);
