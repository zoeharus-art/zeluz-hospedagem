'use strict';

// «Qual falta este dia repõe?» bate com o saldo (Adriana, 27/out/2026: «aparece como duas reposições, mas
// quando vou marcar tem 3 faltas»). O uso que não grava a falta (Lançamentos do dia, «Veio repor hoje» sem
// dia marcado, baixa da hospedagem) tirava 1 do saldo e nenhuma falta da lista. Dados fictícios, sem banco.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const src = fs.readFileSync(path.join(__dirname, '..', 'auaulandia', 'index.html'), 'utf8');

function funcao(nome) {
  const inicio = src.indexOf('function ' + nome + '(');
  assert.ok(inicio >= 0, 'função ausente: ' + nome);
  const abre = src.indexOf('{', inicio);
  let nivel = 0;
  let aspas = '';
  let escape = false;
  for (let i = abre; i < src.length; i += 1) {
    const c = src[i];
    if (aspas) {
      if (escape) escape = false;
      else if (c === '\\') escape = true;
      else if (c === aspas) aspas = '';
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { aspas = c; continue; }
    if (c === '{') nivel += 1;
    if (c === '}' && --nivel === 0) return src.slice(inicio, i + 1);
  }
  throw new Error('função incompleta: ' + nome);
}

const ctx = {
  L: [],
  REP_RETRO_GESTAO: false,
  _logFalhaGrav: (onde, e) => { throw e; },
  repHojeISO: () => '2026-10-27',
  repNaRegra: () => false,
  repVoltasVencidasValendo: () => [],
};
ctx.repLancamentos = () => ctx.L;
vm.createContext(ctx);
vm.runInContext(['repSaldoDe', 'repLancDe', 'repCreditoLivre', 'repCreditosLivresLista', 'dxFaltaAtual', 'dxCreditoParaMarcar']
  .map(funcao).join('\n') + "\nvar dxFaltaId='';", ctx);

const run = (codigo) => vm.runInContext(codigo, ctx);
const livres = () => run('repCreditosLivresLista({})').map((l) => l._id).join(',');
const C = () => [
  { _id: 'c1', tipo: 'credito', data: '2026-07-27' },
  { _id: 'c2', tipo: 'credito', data: '2026-09-30' },
  { _id: 'c3', tipo: 'credito', data: '2026-10-02' },
];
let n = 0;
function prova(nome, L, espera, extra) {
  ctx.L = L;
  run("dxFaltaId='';");
  assert.strictEqual(livres(), espera, nome);
  if (extra) extra();
  n += 1;
}

prova('o uso dos Lançamentos do dia gasta a mais antiga: sobram as duas do saldo',
  C().concat([{ _id: 'u1', tipo: 'uso', data: '2026-10-15', motivo: 'reposicao', obs: 'Reposição lançada nos Lançamentos do dia' }]),
  'c2,c3', () => {
    assert.strictEqual(run('repSaldoDe(repLancamentos())'), 2, 'o saldo é 2');
    assert.strictEqual(run('dxCreditoParaMarcar({}, {})._id'), 'c2', 'sem escolher, vale a mais antiga que sobrou');
    run("dxFaltaId='c3';");
    assert.strictEqual(run('dxCreditoParaMarcar({}, {})._id'), 'c3', 'a escolhida vale');
    run("dxFaltaId='c1';");
    assert.strictEqual(run('dxCreditoParaMarcar({}, {})._id'), 'c2', 'a já gasta não pode ser escolhida');
  });
prova('a baixa da hospedagem também gasta; sobrando uma, o dia vai para ela',
  C().concat([{ _id: 'u1', tipo: 'uso', data: '2026-10-15', motivo: 'hospedagem', orcId: 'o1', orcSeq: 1 }, { _id: 'u2', tipo: 'uso', data: '2026-10-16' }]),
  'c3', () => assert.strictEqual(run('dxCreditoParaMarcar({}, {})._id'), 'c3', 'não a de 27/07'));
prova('o uso com a falta gravada risca a dele, não a mais antiga',
  C().concat([{ _id: 'u1', tipo: 'uso', data: '2026-10-15', credito: 'c2' }]), 'c1,c3');
prova('o uso devolvido não gasta nada',
  C().concat([{ _id: 'u1', tipo: 'uso', data: '2026-10-15' }, { _id: 'e1', tipo: 'estorno', estornaId: 'u1' }]), 'c1,c2,c3');
prova('o uso no dia de uma reposição marcada gasta a marcada (como a agenda), não uma livre',
  C().concat([{ _id: 'c4', tipo: 'credito', data: '2026-10-05', volta: '2026-10-20' }, { _id: 'u1', tipo: 'uso', data: '2026-10-20' }]), 'c1,c2,c3');
prova('dois usos no dia de uma marcada só: um gasta a marcada, o outro a mais antiga',
  C().concat([{ _id: 'c4', tipo: 'credito', data: '2026-10-05', volta: '2026-10-20' }, { _id: 'u1', tipo: 'uso', data: '2026-10-20' }, { _id: 'u2', tipo: 'uso', data: '2026-10-20' }]), 'c2,c3');
prova('saldo 0: nenhuma falta para escolher',
  C().concat([1, 2, 3].map((i) => ({ _id: 'u' + i, tipo: 'uso', data: '2026-10-1' + i }))), '');
prova('sem uso nenhum: as três, como antes',
  C(), 'c1,c2,c3', () => assert.strictEqual(run('dxCreditoParaMarcar({}, {})._id'), 'c1'));

console.log('reposicao-faltas150: OK (' + n + ' provas)');
