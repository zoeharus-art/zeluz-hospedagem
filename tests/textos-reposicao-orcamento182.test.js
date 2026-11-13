'use strict';
// Textos de 13/nov/2026 (Adriana):
// - reposição marcada depois das 12h do dia anterior: não pode ser desmarcada (nada de «liberar a vaga»);
// - fecho do orçamento da primeira hospedagem: convida a marcar a avaliação até 10 dias antes da entrada.
// Dados inventados, sem rede e sem banco.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const html = fs.readFileSync(path.resolve(__dirname, '../auaulandia/index.html'), 'utf8');

let falhas = 0, total = 0;
function prova(nome, fn) {
  total++;
  try { fn(); console.log('ok   ' + nome); }
  catch (e) { falhas++; console.log('FALHA ' + nome + '\n      ' + e.message); }
}

function funcao(nome) {
  const i = html.indexOf('function ' + nome + '(');
  assert.ok(i >= 0, 'não achei a função ' + nome);
  let j = html.indexOf('{', i), nivel = 0;
  for (; j < html.length; j++) {
    if (html[j] === '{') nivel++;
    else if (html[j] === '}') { nivel--; if (nivel === 0) break; }
  }
  return html.slice(i, j + 1);
}

const ctx = vm.createContext({
  orcEhFemea: (sel) => !!(sel && sel.femea),
  orcLinhasValores: (C, L) => { L.push('[valores]'); }
});
vm.runInContext(['orcMaisDias', 'orcBR', 'orcArtigoDe', 'orcFechoAvaliacao', 'orcMensagemPrimeira'].map(funcao).join('\n'), ctx);

prova('reposição fora do prazo: texto novo no lugar do antigo', () => {
  assert.ok(html.includes('Este agendamento foi feito depois do prazo de alteração, que é até 12h do dia anterior. Por isso, esta reposição já conta como utilizada e não pode ser desmarcada.'));
  assert.ok(!html.includes('conte conosco para cancelar e liberar a vaga'));
});

prova('reposição: o texto novo só sai quando a marcação foi depois do prazo', () => {
  const i = html.indexOf('var prazoMsg=rep14MarcadaAposCorte(dia,info)');
  assert.ok(i >= 0, 'não achei a escolha do texto pelo prazo');
  const trecho = html.slice(i, i + 600);
  assert.ok(trecho.indexOf('não pode ser desmarcada') > 0, 'texto novo fora do ramo depois do prazo');
  assert.ok(trecho.indexOf(":repMensagemPrazo('reposicao',dia)") > trecho.indexOf('não pode ser desmarcada'), 'o caso dentro do prazo mudou');
});

prova('orçamento: fecho com a data 10 dias antes da entrada', () => {
  const C = { entrada: '2026-12-12', pets: [{ sel: { nome: 'Pipoca', femea: true } }] };
  assert.equal(ctx.orcFechoAvaliacao(C, 'Ana', 'Pipoca'),
    'Ana, quer que eu já veja um horário para a avaliação da Pipoca? Precisamos fazê-la até 02/12, 10 dias antes da entrada, para garantir o período. 💛');
});

prova('orçamento: conta certo na virada do mês e do ano', () => {
  const C = { entrada: '2027-01-05', pets: [{ sel: { nome: 'Bidu', femea: false } }] };
  assert.match(ctx.orcFechoAvaliacao(C, 'Caio', 'Bidu'), /avaliação do Bidu\? Precisamos fazê-la até 26\/12, 10 dias antes/);
});

prova('orçamento: dois peludinhos usam «de»', () => {
  const C = { entrada: '2026-12-20', pets: [{ sel: { nome: 'Mel', femea: true } }, { sel: { nome: 'Thor' } }] };
  assert.match(ctx.orcFechoAvaliacao(C, 'Bia', 'Mel e Thor'), /avaliação de Mel e Thor\? Precisamos fazê-la até 10\/12,/);
});

prova('orçamento: sem data de entrada, não inventa data', () => {
  const C = { entrada: '', pets: [{ sel: { nome: 'Luna', femea: true } }] };
  assert.equal(ctx.orcFechoAvaliacao(C, 'Eva', 'Luna'),
    'Eva, quer que eu já veja um horário para a avaliação da Luna? Precisamos fazê-la pelo menos 10 dias antes da entrada para garantir o período. 💛');
});

prova('orçamento: a mensagem da primeira hospedagem termina com o fecho novo', () => {
  const C = { entrada: '2026-12-12', pets: [{ sel: { nome: 'Pipoca', femea: true } }] };
  const L = ctx.orcMensagemPrimeira(C, 'Ana', 'Pipoca');
  assert.match(L[L.length - 1], /^Ana, quer que eu já veja um horário para a avaliação da Pipoca\?/);
  assert.ok(!L.join('\n').includes('posso te explicar como funciona a avaliação'));
});

console.log('\n' + (total - falhas) + '/' + total + ' provas passaram');
if (falhas) process.exit(1);
