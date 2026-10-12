'use strict';
/*
 * A ponte da planilha de estadias, versão 6 (integracao-planilha/Codigo.gs) — Story 6.68,
 * AC10 (10/out/2026).
 *
 * NÃO toca no Google nem na rede. O Codigo.gs publicado é carregado de verdade (o arquivo,
 * sem cópia) numa sandbox `vm`, com uma planilha de mentira de duas abas (tests/lib/
 * planilha-falsa.js): a Hospedagem (o dinheiro) e o Calendário (uma linha por dia de
 * outubro de 2026). O que se prova:
 *
 *   P1  doGet e toda resposta do doPost trazem versao:6 (é por ela que o app escolhe o caminho).
 *   P2  'atualizar' só da saída: a MESMA linha, com saída, diárias, total, diária, «A pagar» e a
 *       «Data reserva» que vieram, e a nota de quem alterou; as noites a mais marcadas.
 *   P3  'atualizar' da entrada: nenhuma segunda linha; as noites antigas liberadas e as novas
 *       marcadas na MESMA coluna.
 *   P4  'atualizar' com naoLiberar: as noites antigas ficam (a outra reserva viva do FILHOt).
 *   P5  'atualizar' com peludoTutorAntes: acha a linha do nome antigo e escreve o nome novo.
 *   P6  'atualizar' sem linha viva: «NAO ACHEI…», ok:false e nenhuma linha nova (quem decide é o app).
 *   P7  'cancelar' com marca: a palavra certa na célula; o reenvio responde «ja estava cancelada».
 *   P8  (guarda) os pedidos de antes — sem acao, 'calendario', 'cancelar' sem marca — dão a
 *       mesma linha, a mesma coluna e a mesma resposta da versão 5 (os valores da versão 5,
 *       medidos na base 910b143, estão escritos aqui).
 *   P9  (guarda) sem PONTE_SENHA, ou com a senha errada: recusa, também no 'atualizar'.
 *   P10 'atualizar' com duas linhas vivas iguais: atualiza a primeira e diz quantas havia.
 *   P11 'cancelar' com uma linha riscada e outra viva do mesmo nome e entrada (a reserva
 *       reativada): risca a VIVA — nunca responde «ja estava cancelada» com uma linha valendo.
 *   2ª rodada (11/out/2026, gate do QA):
 *   P12 'atualizar' com duas reservas do mesmo FILHOt (entradas diferentes): muda só a da entrada
 *       antiga do pedido (o defeito b01 do QA achava a linha só pelo nome).
 *   P13 (QA PQ2) erro do Apps Script no meio da escrita (célula protegida): ok:false, a linha
 *       inteira como estava (nunca datas novas com dinheiro velho) e o calendário intocado.
 *   P14 (QA PQ3) calendário sem coluna livre para as datas novas: ok:false e NADA muda (nem a
 *       linha do dinheiro, nem as noites antigas).
 *   P15 (QA PQ4) sem a aba Hospedagem: ok:false e o calendário intocado (sem a linha do dinheiro,
 *       as noites não se mexem).
 *   3ª rodada (11/out/2026, re-gate do QA):
 *   P16 (QA PR1) diferencial dos pedidos de hoje contra a versão 5 de verdade (tests/lib/ponte-v5-antes-6.68.gs):
 *       só mudam o reenvio do cancelar (B3) e o pedido em que a versão 5 escreveria por cima de outro hóspede.
 *   P17 a P20 (QA PR2 a PR5) a célula protegida, o calendário que estoura depois da linha, as propriedades do
 *       'atualizar' em 3.000 pedidos sorteados (nenhum outro hóspede some) e a fórmula que continua fórmula.
 *   P21 (LOW-R1) a coluna só é reaproveitada se estiver livre (ou com ele) em todos os dias: o outro hóspede
 *       não some quando o FILHOt tem outra reserva viva; o reenvio de sempre continua na coluna dele.
 *
 * Uso:  node tests/ponte-planilha.test.js
 */

const assert = require('assert');
const { carregarPonte } = require('./lib/planilha-falsa.js');

const THOR = { peludoTutor: 'Thor/Spitz/Renata Teste', hospedes: 1, entrada: '2026-10-10', saida: '2026-10-14', noites: 4, reserva: 260, dataReserva: '2026-10-09', total: 520, valorDiaria: 130, aPagar: 260, dataAPagar: '2026-10-10' };
const NALA = { peludoTutor: 'Nala/SRD/Renata Teste', hospedes: 1, entrada: '2026-10-12', saida: '2026-10-15', noites: 3, reserva: 150, dataReserva: '2026-10-09', total: 300, valorDiaria: 100, aPagar: 150, dataAPagar: '2026-10-12' };
const MUDA = { alteradoPor: 'Márcia Teste', alteradoEm: '10/10/2026 às 10:00', motivo: 'a tutora adiou a volta da viagem' };
const semVersao = (r) => { const x = Object.assign({}, r); delete x.versao; return x; };

const testes = [];
function teste(nome, fn) { testes.push({ nome, fn }); }

teste('P1 — doGet e as respostas do doPost (gravar, calendario, cancelar, atualizar, e a recusa) trazem versao:6', () => {
  const B = carregarPonte();
  assert.strictEqual(B.get().versao, 6, 'doGet');
  assert.ok(/no ar/.test(B.get().msg), 'o «no ar» de sempre (o «Testar a ponte» do app procura por ele)');
  assert.strictEqual(B.post(THOR).versao, 6, 'gravar');
  assert.strictEqual(B.post({ acao: 'calendario', peludoTutor: 'Irma/SRD/Renata Teste', entrada: '2026-10-11', saida: '2026-10-13' }).versao, 6, 'calendario');
  assert.strictEqual(B.post({ acao: 'cancelar', soCalendario: true, peludoTutor: 'Irma/SRD/Renata Teste', entrada: '2026-10-11', saida: '2026-10-13' }).versao, 6, 'cancelar');
  assert.strictEqual(B.post(Object.assign({ acao: 'atualizar', entradaAntes: '2026-10-10', saidaAntes: '2026-10-14' }, THOR, MUDA)).versao, 6, 'atualizar');
  assert.strictEqual(B.post({ token: 'errada' }).versao, 6, 'a recusa também');
});

teste('P2 — atualizar só a saída (14 → 16): a mesma linha, com os números novos, a «Data reserva» que veio e a nota; 2 noites a mais na mesma coluna', () => {
  const B = carregarPonte();
  B.post(THOR);
  const r = B.post(Object.assign({}, THOR, MUDA, { acao: 'atualizar', entradaAntes: '2026-10-10', saidaAntes: '2026-10-14', saida: '2026-10-16', noites: 6, reserva: 390, total: 780, valorDiaria: 130, aPagar: 390, dataReserva: '2026-10-08' }));
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.financeiro, 'linha 2 atualizada');
  assert.ok(/4 noite\(s\) liberada\(s\) no calendario; 6 noite\(s\) marcada\(s\) na coluna Hospede 1/.test(r.calendario), r.calendario);
  const L = B.linhas();
  assert.strictEqual(L.length, 1, 'nenhuma segunda linha');
  assert.deepStrictEqual([L[0].nome, L[0].entrada, L[0].saida, L[0].diarias, L[0].reserva, L[0].dataReserva, L[0].total, L[0].diaria, L[0].aPagar, L[0].riscada],
    ['Thor/Spitz/Renata Teste', '10/10', '16/10', 6, 390, '08/10', 780, 130, 390, false]);
  assert.strictEqual(L[0].nota, 'Alterada em 10/10/2026 às 10:00 por Márcia Teste: 10/10/2026 a 14/10/2026 → 10/10/2026 a 16/10/2026. Motivo: a tutora adiou a volta da viagem.');
  assert.deepStrictEqual([B.noites(THOR.peludoTutor), B.colunasDe(THOR.peludoTutor)], [[10, 11, 12, 13, 14, 15], [1]]);
});

teste('P3 — atualizar a entrada (10 → 11): nenhuma segunda linha; a noite de 10 liberada e as novas marcadas na MESMA coluna (a coluna 2, mesmo com a 1 livre)', () => {
  const B = carregarPonte();
  B.post({ acao: 'calendario', peludoTutor: 'Bento/SRD/Lia Teste', entrada: '2026-10-10', saida: '2026-10-11' });   // ocupa a coluna 1 só no dia 10
  B.post(THOR);                                                                                                         // Thor vai para a coluna 2
  assert.deepStrictEqual(B.colunasDe(THOR.peludoTutor), [2]);
  const r = B.post(Object.assign({}, THOR, MUDA, { acao: 'atualizar', entradaAntes: '2026-10-10', saidaAntes: '2026-10-14', entrada: '2026-10-11', saida: '2026-10-15', dataAPagar: '2026-10-11' }));
  assert.strictEqual(r.financeiro, 'linha 2 atualizada', JSON.stringify(r));
  const L = B.linhas();
  assert.deepStrictEqual(L.map((x) => [x.nome, x.entrada, x.saida, x.riscada]), [['Thor/Spitz/Renata Teste', '11/10', '15/10', false]], 'uma linha só');
  assert.deepStrictEqual([B.noites(THOR.peludoTutor), B.colunasDe(THOR.peludoTutor)], [[11, 12, 13, 14], [2]], 'mesma coluna');
});

teste('P4 — atualizar com naoLiberar: as noites antigas ficam (são da outra reserva viva) e as novas entram', () => {
  const B = carregarPonte();
  B.post(THOR);
  const r = B.post(Object.assign({}, THOR, MUDA, { acao: 'atualizar', naoLiberar: true, entradaAntes: '2026-10-10', saidaAntes: '2026-10-14', entrada: '2026-10-12', saida: '2026-10-16' }));
  assert.strictEqual(r.financeiro, 'linha 2 atualizada');
  assert.ok(/^noites antigas mantidas/.test(r.calendario), r.calendario);
  assert.deepStrictEqual(B.noites(THOR.peludoTutor), [10, 11, 12, 13, 14, 15], 'as de 10 e 11 continuam; 14 e 15 entram');
});

teste('P5 — atualizar com peludoTutorAntes: a linha do nome antigo ganha o nome novo; o calendário troca o nome', () => {
  const B = carregarPonte();
  B.post(Object.assign({}, THOR, { peludoTutor: 'Thor/Spitz/Renata' }));
  const r = B.post(Object.assign({}, THOR, MUDA, { acao: 'atualizar', peludoTutorAntes: 'Thor/Spitz/Renata', entradaAntes: '2026-10-10', saidaAntes: '2026-10-14', saida: '2026-10-15' }));
  assert.strictEqual(r.financeiro, 'linha 2 atualizada');
  assert.deepStrictEqual(B.linhas().map((x) => [x.nome, x.saida]), [['Thor/Spitz/Renata Teste', '15/10']]);
  assert.deepStrictEqual([B.noites('Thor/Spitz/Renata'), B.noites(THOR.peludoTutor)], [[], [10, 11, 12, 13, 14]]);
});

teste('P6 — atualizar sem linha viva (nenhuma, ou só a riscada): «NAO ACHEI…», ok:false, nenhuma linha nova e o calendário intocado', () => {
  const B = carregarPonte();
  let r = B.post(Object.assign({}, THOR, MUDA, { acao: 'atualizar', entradaAntes: '2026-10-10', saidaAntes: '2026-10-14', saida: '2026-10-16' }));
  assert.deepStrictEqual([r.ok, r.financeiro, B.linhas().length, B.noites(THOR.peludoTutor)], [false, 'NAO ACHEI a linha desta reserva no financeiro', 0, []]);
  B.post(THOR);
  B.post({ acao: 'cancelar', peludoTutor: THOR.peludoTutor, entrada: THOR.entrada, saida: THOR.saida, canceladoPor: 'Ana Teste', canceladoEm: '09/10/2026' });
  r = B.post(Object.assign({}, THOR, MUDA, { acao: 'atualizar', entradaAntes: '2026-10-10', saidaAntes: '2026-10-14', saida: '2026-10-16' }));
  assert.strictEqual(r.financeiro, 'NAO ACHEI a linha desta reserva no financeiro', 'a riscada não vale');
  assert.deepStrictEqual(B.linhas().map((x) => x.riscada), [true], 'nenhuma linha nova');
});

teste('P7 — cancelar com marca: ANULADO, VOLTOU PARA PENDENTE e ALTERADA na célula; marca desconhecida vira CANCELADO; o reenvio responde «ja estava cancelada»', () => {
  for (const [marca, palavra, resposta] of [['ANULADO', 'ANULADO', 'ANULADO'], ['VOLTOU PARA PENDENTE', 'VOLTOU PARA PENDENTE', 'VOLTOU PARA PENDENTE'],
    ['ALTERADA', 'ALTERADA', 'ALTERADA'], ['APAGAR TUDO', 'CANCELADO', 'CANCELADA'], ['CANCELADO', 'CANCELADO', 'CANCELADA']]) {
    const B = carregarPonte();
    B.post(THOR);
    const c = { acao: 'cancelar', soCalendario: false, marca, peludoTutor: THOR.peludoTutor, entrada: THOR.entrada, saida: THOR.saida, canceladoPor: 'Márcia Teste', canceladoEm: '10/10/2026' };
    const r1 = B.post(c);
    assert.deepStrictEqual([r1.financeiro, r1.calendario], ['linha 2 marcada como ' + resposta, '4 noite(s) liberada(s) no calendario'], marca);
    assert.deepStrictEqual(B.linhas().map((x) => [x.nome, x.riscada]), [[palavra + ' por Márcia Teste em 10/10/2026 - Thor/Spitz/Renata Teste', true]], marca);
    const r2 = B.post(c);
    assert.deepStrictEqual([r2.ok, r2.financeiro], [true, 'ja estava cancelada'], 'o reenvio: ' + marca);
  }
  // o reenvio de outra entrada não acha a riscada (o nome é o mesmo, a reserva não)
  const B = carregarPonte();
  B.post(THOR);
  B.post({ acao: 'cancelar', peludoTutor: THOR.peludoTutor, entrada: THOR.entrada, saida: THOR.saida });
  assert.strictEqual(B.post({ acao: 'cancelar', peludoTutor: THOR.peludoTutor, entrada: '2026-10-20', saida: '2026-10-22' }).financeiro, 'NAO ACHEI a linha desta reserva no financeiro');
});

// Os valores da versão 5 (base 910b143), medidos com esta mesma planilha de mentira e escritos aqui: a versão 6 tem de dar o mesmo.
const V5 = {
  resp: [
    { ok: true, financeiro: 'ok (11 campos)', calendario: '4 noite(s) marcada(s) na coluna Hospede 1' },
    { ok: true, financeiro: 'ok (11 campos)', calendario: '3 noite(s) marcada(s) na coluna Hospede 2' },
    { ok: true, financeiro: 'ja estava la', calendario: '0 noite(s) marcada(s) na coluna Hospede 1, 4 ja estavam' },
    { ok: true, financeiro: '(nao mexe: linha unica da reserva)', calendario: '2 noite(s) marcada(s) na coluna Hospede 3' },
    { ok: true, financeiro: '(nao mexe: linha unica da reserva)', calendario: '2 noite(s) liberada(s) no calendario' },
    { ok: true, financeiro: 'linha 3 marcada como CANCELADA', calendario: '3 noite(s) liberada(s) no calendario' },
    { ok: true, financeiro: 'NAO ACHEI a linha desta reserva no financeiro', calendario: '0 noite(s) liberada(s) no calendario' },
  ],
  linhas: [
    ['Thor/Spitz/Renata Teste', '10/10', '14/10', 4, 260, '09/10', 520, 130, 260, '10/10', false],
    ['CANCELADO por Ana Teste em 10/10/2026 às 10:00 - Nala/SRD/Renata Teste', '12/10', '15/10', 3, 150, '09/10', 300, 100, 150, '12/10', true],
  ],
  thor: [[10, 11, 12, 13], [1]],
  nala: [[], []],
  irma: [],
};
teste('P8 (guarda) — os pedidos de antes (sem acao, calendario, cancelar sem marca, com e sem soCalendario) dão a mesma linha, a mesma coluna e a mesma resposta da versão 5', () => {
  const B = carregarPonte();
  const r = [];
  r.push(B.post(THOR));
  r.push(B.post(NALA));
  r.push(B.post(THOR));
  r.push(B.post({ acao: 'calendario', peludoTutor: 'Irma/SRD/Renata Teste', entrada: '2026-10-11', saida: '2026-10-13' }));
  r.push(B.post({ acao: 'cancelar', soCalendario: true, peludoTutor: 'Irma/SRD/Renata Teste', entrada: '2026-10-11', saida: '2026-10-13' }));
  r.push(B.post({ acao: 'cancelar', soCalendario: false, peludoTutor: NALA.peludoTutor, entrada: NALA.entrada, saida: NALA.saida, canceladoPor: 'Ana Teste', canceladoEm: '10/10/2026 às 10:00' }));
  r.push(B.post({ acao: 'cancelar', soCalendario: false, peludoTutor: 'Ninguem/SRD/Teste', entrada: '2026-10-20', saida: '2026-10-22' }));
  assert.deepStrictEqual(r.map(semVersao), V5.resp);
  assert.deepStrictEqual(B.linhas().map((x) => [x.nome, x.entrada, x.saida, x.diarias, x.reserva, x.dataReserva, x.total, x.diaria, x.aPagar, x.dataAPagar, x.riscada]), V5.linhas);
  assert.deepStrictEqual([B.noites(THOR.peludoTutor), B.colunasDe(THOR.peludoTutor)], V5.thor);
  assert.deepStrictEqual([B.noites(NALA.peludoTutor), B.colunasDe(NALA.peludoTutor)], V5.nala);
  assert.deepStrictEqual(B.noites('Irma/SRD/Renata Teste'), V5.irma);
});

teste('P9 (guarda) — sem PONTE_SENHA, ou com a senha errada, recusa (também o atualizar, sem mexer na planilha)', () => {
  let B = carregarPonte({ senha: null });
  let r = B.post(Object.assign({}, THOR, { acao: 'atualizar', entradaAntes: '2026-10-10', saidaAntes: '2026-10-14' }));
  assert.deepStrictEqual([r.ok, /PONTE_SENHA não configurada/.test(r.erro)], [false, true]);
  assert.ok(B.logs.some((l) => /PONTE_SENHA não configurada/.test(l)), 'o log diz por quê');
  B = carregarPonte();
  B.post(THOR);
  r = JSON.parse(B.sb.doPost({ postData: { contents: JSON.stringify(Object.assign({}, THOR, MUDA, { token: 'outra', acao: 'atualizar', entradaAntes: '2026-10-10', saidaAntes: '2026-10-14', saida: '2026-10-20' })) } }).getContent());
  assert.deepStrictEqual([r.ok, r.erro], [false, 'token invalido']);
  assert.deepStrictEqual(B.linhas().map((x) => x.saida), ['14/10'], 'a planilha não mudou');
});

teste('P10 — atualizar com duas linhas vivas iguais (o lançamento duplicado de antes): atualiza a primeira e diz quantas havia', () => {
  const B = carregarPonte();
  B.post(THOR);
  B.P.fin.appendRow(B.P.fin.L[1].slice());   // a mesma linha, duas vezes (dois envios ao mesmo tempo, K11)
  const r = B.post(Object.assign({}, THOR, MUDA, { acao: 'atualizar', entradaAntes: '2026-10-10', saidaAntes: '2026-10-14', saida: '2026-10-15' }));
  assert.strictEqual(r.financeiro, 'linha 2 atualizada (havia 2 linhas iguais; atualizei a primeira)');
  assert.deepStrictEqual(B.linhas().map((x) => x.saida), ['15/10', '14/10']);
});

teste('P11 — cancelar com uma linha riscada e outra viva do mesmo nome e entrada (a reserva reativada): risca a viva', () => {
  const B = carregarPonte();
  B.post(THOR);
  B.post({ acao: 'cancelar', peludoTutor: THOR.peludoTutor, entrada: THOR.entrada, saida: THOR.saida, canceladoPor: 'Ana Teste', canceladoEm: '09/10/2026' });
  B.post(THOR);   // reativada: a linha nova entra (a riscada não é achada como a mesma)
  assert.deepStrictEqual(B.linhas().map((x) => x.riscada), [true, false]);
  const r = B.post({ acao: 'cancelar', marca: 'ANULADO', peludoTutor: THOR.peludoTutor, entrada: THOR.entrada, saida: THOR.saida, canceladoPor: 'Gestora Teste', canceladoEm: '10/10/2026' });
  assert.strictEqual(r.financeiro, 'linha 3 marcada como ANULADO');
  assert.deepStrictEqual(B.linhas().map((x) => x.riscada), [true, true]);
});

// ------------------------------------------------------------------ execução
// ---- 2ª rodada (gate do QA) ----------------------------------------------------------------------------
// a célula protegida: QUALQUER escrita que alcance a coluna `col` (setValue ou setValues) é recusada pelo Apps Script
const protege = (B, col) => {
  const fin = B.P.fin, gr = fin.getRange;
  fin.getRange = function (r, c, nr, nc) {
    const x = gr.call(fin, r, c, nr, nc), ate = c + (nc || 1) - 1;
    if (r > 1 && c <= col && ate >= col) { x.setValue = () => { throw new Error('Exception: You are trying to edit a protected cell'); }; x.setValues = x.setValue; }
    return x;
  };
};
const resumoLinha = (L) => [L.entrada, L.saida, L.diarias, L.total, L.aPagar];

teste('P12 — atualizar com duas reservas do mesmo FILHOt (10 a 14 e 20 a 22): muda só a da entrada antiga do pedido; a outra fica como estava', () => {
  const B = carregarPonte();
  B.post(THOR);
  B.post(Object.assign({}, THOR, { entrada: '2026-10-20', saida: '2026-10-22', noites: 2, reserva: 130, total: 260, aPagar: 130, dataAPagar: '2026-10-20' }));
  const r = B.post(Object.assign({}, THOR, MUDA, { acao: 'atualizar', entradaAntes: '2026-10-20', saidaAntes: '2026-10-22', entrada: '2026-10-21', saida: '2026-10-24',
    noites: 3, reserva: 195, total: 390, aPagar: 195, dataAPagar: '2026-10-21' }));
  const L = B.linhas();
  assert.deepStrictEqual([r.ok, r.financeiro, L.map(resumoLinha)], [true, 'linha 3 atualizada', [['10/10', '14/10', 4, 520, 260], ['21/10', '24/10', 3, 390, 195]]]);
  assert.deepStrictEqual(B.noites(THOR.peludoTutor), [10, 11, 12, 13, 21, 22, 23], 'as noites das duas reservas');
});

teste('P13 (QA PQ2) — erro do Apps Script no meio da escrita (célula protegida na 5ª coluna): ok:false, a linha inteira como estava e o calendário intocado', () => {
  const B = carregarPonte();
  B.post(THOR);
  protege(B, 5);
  const r = B.post(Object.assign({}, THOR, MUDA, { acao: 'atualizar', entradaAntes: '2026-10-10', saidaAntes: '2026-10-14', entrada: '2026-10-11', saida: '2026-10-16', noites: 5, total: 650 }));
  assert.deepStrictEqual([r.ok, /^ERRO - /.test(r.financeiro), resumoLinha(B.linhas()[0]), B.noites(THOR.peludoTutor)], [false, true, ['10/10', '14/10', 4, 520, 260], [10, 11, 12, 13]],
    JSON.stringify(r));
});

teste('P14 (QA PQ3) — calendário sem coluna livre para as datas novas: ok:false, e nada muda (a linha do dinheiro e as noites antigas)', () => {
  const B = carregarPonte();
  B.post(THOR);
  for (let k = 1; k <= 4; k++) B.post({ acao: 'calendario', peludoTutor: 'Outro' + k + '/SRD/Teste', entrada: '2026-10-14', saida: '2026-10-16' });
  const r = B.post(Object.assign({}, THOR, MUDA, { acao: 'atualizar', entradaAntes: '2026-10-10', saidaAntes: '2026-10-14', saida: '2026-10-16', noites: 6, total: 780 }));
  assert.deepStrictEqual([r.ok, /^CALENDARIO SEM COLUNA LIVRE/.test(r.calendario), resumoLinha(B.linhas()[0]), B.noites(THOR.peludoTutor)], [false, true, ['10/10', '14/10', 4, 520, 260], [10, 11, 12, 13]],
    JSON.stringify(r));
});

teste('P15 (QA PQ4) — sem a aba Hospedagem: ok:false, e o calendário não se mexe sem a linha do dinheiro', () => {
  const B = carregarPonte();
  B.post(THOR);
  B.P.ss.getSheetByName = (n) => (n === 'Calendário Hospedagem para dash' ? B.P.cal : null);
  B.P.ss.getSheets = () => [B.P.cal];
  const r = B.post(Object.assign({}, THOR, MUDA, { acao: 'atualizar', entradaAntes: '2026-10-10', saidaAntes: '2026-10-14', entrada: '2026-10-20', saida: '2026-10-22' }));
  assert.deepStrictEqual([r.ok, r.financeiro, B.noites(THOR.peludoTutor)], [false, 'ABA NAO ENCONTRADA', [10, 11, 12, 13]], JSON.stringify(r));
});

// ---- 3ª rodada (11/out/2026): as provas do re-gate do QA (qa668r2-ponte.test.js, PR1 a PR5) e o LOW-R1 -----------------------------
// A versão 5 de verdade (a ponte publicada hoje), congelada em tests/lib/ponte-v5-antes-6.68.gs (o Codigo.gs da base 910b143, sem mudar
// um byte; md5 34a224ebcc4e4cde78c52f7ed1d1980d), para o diferencial.
const fs = require('fs');
const path = require('path');
const V5_GS = fs.readFileSync(path.join(__dirname, 'lib', 'ponte-v5-antes-6.68.gs'), 'utf8');
function sorteio(semente) { let s = semente >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const NOMES = ['Thor/Spitz/Renata Teste', 'Nala/SRD/Renata Teste', 'Irma/SRD/Renata Teste', 'Bento/SRD/Lia Teste', 'Maya/SRD/Luciana Teste'];
const iso = (d) => '2026-10-' + String(d).padStart(2, '0');
const dts = (row) => row.map((x) => (x && x.getDate) ? x.toDateString() : x);
const estado = (B) => JSON.stringify([B.P.fin.L.map(dts), B.P.fin.fmt, B.P.fin.cores, B.P.cal.L.map(dts)]);
const estadoFin = (B) => JSON.stringify([B.P.fin.L.map(dts), B.P.fin.fmt, B.P.fin.cores]);
const linhaCompleta = (nome, ent, noites, k) => ({ peludoTutor: nome, hospedes: 1, entrada: iso(ent), saida: iso(Math.min(31, ent + noites)), noites, reserva: 100 * noites + k, dataReserva: '2026-10-01', total: 200 * noites + k, valorDiaria: 200, aPagar: 100 * noites, dataAPagar: iso(ent) });
const celulas = (B) => B.P.cal.L.slice(1).map((r) => r.slice(1).map((x) => String(x || '').trim()));
// as células de OUTRO hóspede que viraram o nome do pedido (o nome escrito por cima)
const porCima = (antes, depois, nome) => { const n = String(nome).trim().toLowerCase(), out = [];
  antes.forEach((r, i) => r.forEach((x, c) => { if (x && x.toLowerCase() !== n && String(depois[i][c]).toLowerCase() === n) out.push((i + 1) + ':' + (c + 1)); })); return out; };

teste('P16 (QA PR1, LOW-R1) — diferencial dos pedidos de hoje, versão 5 de verdade × 6: 400 sequências; só mudam o reenvio do cancelar (B3) e o pedido em que a versão 5 escreveria o nome POR CIMA de outro hóspede (aí a 6 escolhe outra coluna, sem apagar ninguém, e o dinheiro é o mesmo)', () => {
  let b3 = 0, n = 0, lowR1 = 0;
  for (let k = 1; k <= 400; k++) {
    const r = sorteio(k * 7919);
    const B5 = carregarPonte({ codigo: V5_GS }), B6 = carregarPonte();
    for (let i = 0; i < 12; i++) {
      const nome = NOMES[Math.floor(r() * NOMES.length)], ent = [5, 10, 15, 20][Math.floor(r() * 4)], noites = 1 + Math.floor(r() * 5), t = r();
      const base = { peludoTutor: nome, entrada: iso(ent), saida: iso(Math.min(31, ent + noites)) };
      const p = (t < 0.45) ? linhaCompleta(nome, ent, noites, 0) : ((t < 0.6) ? Object.assign({ acao: 'calendario' }, base)
        : Object.assign({ acao: 'cancelar', soCalendario: r() < 0.3, canceladoPor: 'Ana Teste', canceladoEm: '10/10/2026' }, base));
      n++;
      const c5 = celulas(B5), c6 = celulas(B6);
      const a = semVersao(B5.post(p)), b = semVersao(B6.post(p));
      if (p.acao === 'cancelar' && a.financeiro === 'NAO ACHEI a linha desta reserva no financeiro' && b.financeiro === 'ja estava cancelada') { b3++; b.financeiro = a.financeiro; }
      if (JSON.stringify(b) !== JSON.stringify(a) || estado(B6) !== estado(B5)) {
        // LOW-R1: só o pedido de calendário (gravar ou calendario) em que a 5 escreveu por cima de outro hóspede
        const cima5 = porCima(c5, celulas(B5), nome), cima6 = porCima(c6, celulas(B6), nome);
        assert.ok(p.acao !== 'cancelar' && cima5.length > 0, 'diverge sem a versão 5 escrever por cima: seq ' + k + ' pedido ' + i + ' ' + JSON.stringify([p, a, b]));
        assert.deepStrictEqual([cima6, b.ok, b.financeiro, estadoFin(B6) === estadoFin(B5), B6.noites(nome).join() === B5.noites(nome).join()], [[], a.ok, a.financeiro, true, true],
          'a 6 não escreve por cima e o resto fica igual: seq ' + k + ' pedido ' + i + ' ' + JSON.stringify([p, a, b]));
        lowR1++;
        break;   // os dois calendários já são diferentes: a sequência para aqui
      }
    }
  }
  console.log('    PONTE-R3|P16|' + JSON.stringify({ pedidos: n, reenvioB3: b3, lowR1: lowR1 }));
  assert.ok(n > 4500 && lowR1 > 0, JSON.stringify({ n, lowR1 }));
});

teste('P17 (QA PR2) — célula protegida (a escrita inteira recusada: setValue e setValues): ok:false e nada muda nas duas abas', () => {
  const B = carregarPonte();
  B.post(THOR);
  const antes = estado(B);
  const fin = B.P.fin, gr = fin.getRange;
  fin.getRange = function (r, c, nr, nc) { const x = gr.call(fin, r, c, nr, nc); if (r > 1) { const lanca = () => { throw new Error('Exception: You are trying to edit a protected cell'); }; x.setValue = lanca; x.setValues = lanca; } return x; };
  const r = B.post(Object.assign({}, THOR, MUDA, { acao: 'atualizar', entradaAntes: '2026-10-10', saidaAntes: '2026-10-14', entrada: '2026-10-11', saida: '2026-10-16', noites: 5, total: 650 }));
  assert.deepStrictEqual([r.ok, estado(B) === antes], [false, true], JSON.stringify(r));
});

teste('P18 (QA PR3) — a linha do dinheiro foi escrita, mas o calendário estoura no meio: a resposta nunca é ok:true', () => {
  const B = carregarPonte();
  B.post(THOR);
  const cal = B.P.cal, gr = cal.getRange;
  let n = 0;
  cal.getRange = function (r, c, nr, nc) { const x = gr.call(cal, r, c, nr, nc); const sv = x.setValue; x.setValue = function (v) { if (v !== '' && ++n === 2) throw new Error('Service Spreadsheets timed out'); return sv.call(this, v); }; return x; };
  const r = B.post(Object.assign({}, THOR, MUDA, { acao: 'atualizar', entradaAntes: '2026-10-10', saidaAntes: '2026-10-14', entrada: '2026-10-11', saida: '2026-10-16', noites: 5, total: 650 }));
  assert.strictEqual(r.ok, false, JSON.stringify(r));
});

teste('P19 (QA PR4, LOW-R1) — propriedades do atualizar em 3.000 pedidos sorteados (calendário com outros hóspedes, naoLiberar, a outra reserva viva do FILHOt): ok:false ⇒ nada mudou; nenhum outro hóspede some nem é sobrescrito; ok:true ⇒ a linha e as noites novas', () => {
  const quebras = { nadaMudou: [], outroSumiu: [], okSemNoites: [] };
  let oks = 0, naos = 0, comOutra = 0;
  for (let k = 1; k <= 3000; k++) {
    const r = sorteio(k * 104729);
    const B = carregarPonte({ colunas: 2 + Math.floor(r() * 3) });
    for (let j = 0; j < 2 + Math.floor(r() * 5); j++) { const e = 1 + Math.floor(r() * 26); B.post({ acao: 'calendario', peludoTutor: 'Outro' + j + '/SRD/Teste', entrada: iso(e), saida: iso(Math.min(31, e + 1 + Math.floor(r() * 5))) }); }
    const e0 = 3 + Math.floor(r() * 20), n0 = 1 + Math.floor(r() * 5);
    const L0 = linhaCompleta('Thor/Spitz/Renata Teste', e0, n0, 0); B.post(L0);
    const outra = r() < 0.3;
    if (outra) { comOutra++; B.post(linhaCompleta('Thor/Spitz/Renata Teste', Math.max(1, e0 - 1), n0 + 2, 7)); }
    const e1 = 1 + Math.floor(r() * 25), n1 = 1 + Math.floor(r() * 5);
    const pedido = Object.assign(linhaCompleta('Thor/Spitz/Renata Teste', e1, n1, 3), MUDA, { acao: 'atualizar', entradaAntes: L0.entrada, saidaAntes: L0.saida });
    if (outra || r() < 0.15) pedido.naoLiberar = true;
    const antes = estado(B);
    const outrosAntes = {};
    B.P.cal.L.slice(1).forEach((row, i) => row.slice(1).forEach((x, c) => { if (x && String(x).indexOf('Outro') === 0) outrosAntes[i + ':' + c] = x; }));
    const resp = B.post(pedido);
    if (!resp.ok) { naos++; if (estado(B) !== antes) quebras.nadaMudou.push({ k, resp }); } else oks++;
    const sumiu = Object.keys(outrosAntes).filter((p) => { const [i, c] = p.split(':').map(Number); return B.P.cal.L[i + 1][c + 1] !== outrosAntes[p]; });
    if (sumiu.length) quebras.outroSumiu.push({ k, resp: resp.calendario, celulas: sumiu.slice(0, 4) });
    if (resp.ok) {
      const noites = B.noites('Thor/Spitz/Renata Teste'), falta = [];
      for (let d = e1; d < Math.min(31, e1 + n1); d++) if (noites.indexOf(d) < 0) falta.push(d);
      if (falta.length) quebras.okSemNoites.push({ k, falta, resp: resp.calendario });
    }
  }
  console.log('    PONTE-R3|P19|' + JSON.stringify({ oks, naos, comOutra, nadaMudou: quebras.nadaMudou.length, outroSumiu: quebras.outroSumiu.length, okSemNoites: quebras.okSemNoites.length }));
  assert.deepStrictEqual([quebras.nadaMudou.slice(0, 2), quebras.outroSumiu.slice(0, 2), quebras.okSemNoites.slice(0, 2)], [[], [], []]);
});

teste('P20 (QA PR5) — fórmula numa coluna do meio que não veio no pedido continua fórmula depois do atualizar', () => {
  const B = carregarPonte();
  B.post(THOR);
  const fin = B.P.fin, gr = fin.getRange;
  fin.getRange = function (r, c, nr, nc) { const x = gr.call(fin, r, c, nr, nc); x.getFormulas = function () { const out = []; for (let i = 0; i < (nr || 1); i++) { const row = []; for (let j = 0; j < (nc || 1); j++) row.push((r + i === 2 && c + j === 5) ? '=D2-C2' : ''); out.push(row); } return out; }; return x; };
  const p = Object.assign({}, THOR, MUDA, { acao: 'atualizar', entradaAntes: '2026-10-10', saidaAntes: '2026-10-14', saida: '2026-10-16', total: 780 }); delete p.noites;
  const r = B.post(p);
  assert.deepStrictEqual([r.ok, B.P.fin.L[1][4]], [true, '=D2-C2'], JSON.stringify([r, B.P.fin.L[1]]));
});

teste('P21 (LOW-R1) — a Maya com outra reserva viva (6 a 11, na coluna 1) e outro hóspede na coluna 1 nas noites 4 e 5: a reserva que muda para 3 a 7 (atualizar com naoLiberar, e o envio de sempre da ponte de hoje) não apaga o outro hóspede; a versão 5 apagava. O reenvio de sempre continua reaproveitando a coluna dele quando ela está livre', () => {
  const L = (nome, e, n, k) => linhaCompleta(nome, e, n, k);
  const cena = (B) => { B.post({ acao: 'calendario', peludoTutor: 'Outro/SRD/Teste', entrada: iso(4), saida: iso(6) }); B.post(L('Maya/SRD/Luciana Teste', 6, 3, 0)); B.post(L('Maya/SRD/Luciana Teste', 6, 5, 7)); };
  const out = [];
  for (const [rot, B, pedido] of [
    ['6 atualizar', carregarPonte(), Object.assign(L('Maya/SRD/Luciana Teste', 3, 4, 3), MUDA, { acao: 'atualizar', entradaAntes: iso(6), saidaAntes: iso(9), naoLiberar: true })],
    ['6 envio', carregarPonte(), L('Maya/SRD/Luciana Teste', 3, 4, 3)],
    ['5 envio', carregarPonte({ codigo: V5_GS }), L('Maya/SRD/Luciana Teste', 3, 4, 3)]]) {
    cena(B); const r = B.post(pedido);
    out.push([rot, r.ok, B.noites('Outro/SRD/Teste'), B.noites('Maya/SRD/Luciana Teste')]);
  }
  assert.deepStrictEqual(out, [['6 atualizar', true, [4, 5], [3, 4, 5, 6, 7, 8, 9, 10]], ['6 envio', true, [4, 5], [3, 4, 5, 6, 7, 8, 9, 10]], ['5 envio', true, [], [3, 4, 5, 6, 7, 8, 9, 10]]]);
  // o reenvio (o mesmo período, ou um período maior com a coluna dele livre nos dias novos) fica na coluna de sempre
  const B = carregarPonte();
  B.post({ acao: 'calendario', peludoTutor: 'Bento/SRD/Lia Teste', entrada: '2026-10-10', saida: '2026-10-11' });
  B.post(THOR);
  const r1 = B.post(THOR), r2 = B.post(Object.assign({}, THOR, { saida: '2026-10-16' }));
  assert.deepStrictEqual([r1.calendario, r2.calendario, B.colunasDe(THOR.peludoTutor), B.noites(THOR.peludoTutor)],
    ['0 noite(s) marcada(s) na coluna Hospede 2, 4 ja estavam', '2 noite(s) marcada(s) na coluna Hospede 2, 4 ja estavam', [2], [10, 11, 12, 13, 14, 15]]);
});

(async () => {
  let passou = 0, falhou = 0;
  for (const t of testes) {
    try {
      await t.fn();
      console.log('  ok   ' + t.nome);
      passou++;
    } catch (e) {
      console.log('  FALHA ' + t.nome + '\n         ' + e.message);
      falhou++;
    }
  }
  console.log(`\n${passou} passaram, ${falhou} falharam.`);
  process.exit(falhou ? 1 : 0);
})();
