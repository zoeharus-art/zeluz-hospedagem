'use strict';
/*
 * A PLANILHA DE ESTADIAS DE MENTIRA — Story 6.68 (10/out/2026).
 *
 * Carrega a ponte de verdade (integracao-planilha/Codigo.gs, o arquivo publicado, sem cópia)
 * numa sandbox `vm` do Node, com duplos dos serviços do Apps Script e uma planilha de duas abas:
 *   · Hospedagem — a tabela do dinheiro (uma linha por FILHOt), com o cabeçalho de sempre;
 *   · Calendário Hospedagem para dash — uma linha por dia de outubro de 2026, quatro colunas
 *     «Hospede N».
 * As datas do calendário nascem com o `Date` DE DENTRO da sandbox: o `instanceof Date` da
 * ponte falharia com uma data criada fora dela.
 * Sem rede, sem Google: usada por tests/ponte-planilha.test.js e pela Fase 0 (as provas 6.68
 * que mandam o app falar com a ponte de verdade).
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..', '..');
const CABECALHO = ['Hospedes', 'Tutor Peludo', 'Entrada', 'Saida', 'Diarias', 'R$ Reserva', 'Data Reserva', 'Valor Total', 'Valor Diaria', 'A pagar', 'Data a pagar'];

function aba(nome, linhas) {
  const L = linhas.map((r) => r.slice());
  const fmt = {}, notas = {}, cores = {};
  const larg = () => Math.max(...L.map((r) => r.length), 1);
  const cel = (r, c) => { while (L.length < r) L.push([]); while (L[r - 1].length < c) L[r - 1].push(''); };
  const folha = {
    L, fmt, notas, cores,
    getName() { return nome; },
    getLastRow() { return L.length; },
    getLastColumn() { return larg(); },
    appendRow(v) { L.push(v.slice()); },
    deleteRow(r) { L.splice(r - 1, 1); },
    getRange(r, c, nr, nc) {
      nr = nr || 1; nc = nc || 1;
      return {
        getValues() {
          const out = [];
          for (let i = 0; i < nr; i++) { const row = []; for (let j = 0; j < nc; j++) { const x = (L[r - 1 + i] || [])[c - 1 + j]; row.push(x === undefined ? '' : x); } out.push(row); }
          return out;
        },
        setValue(v) { cel(r, c); L[r - 1][c - 1] = v; return this; },
        setValues(m) { for (let i = 0; i < nr; i++) for (let j = 0; j < nc; j++) { cel(r + i, c + j); L[r - 1 + i][c - 1 + j] = m[i][j]; } return this; },
        setNumberFormat() { return this; },
        setFontLine(x) { fmt[r] = x; return this; },
        setFontColor(x) { cores[r] = x; return this; },
        setNote(t) { notas[r + ':' + c] = String(t); return this; },
      };
    },
  };
  return folha;
}

/** A planilha de duas abas. `D` é o Date de dentro da sandbox. */
function planilha(D, colunas) {
  const nCols = colunas || 4;
  const fin = aba('Hospedagem', [CABECALHO.slice()]);
  const topo = ['Data']; for (let k = 1; k <= nCols; k++) topo.push('Hospede ' + k);
  const cal = [topo];
  for (let d = 1; d <= 31; d++) { const row = [new D(2026, 9, d)]; for (let k = 0; k < nCols; k++) row.push(''); cal.push(row); }
  const c = aba('Calendário Hospedagem para dash', cal);
  return { fin, cal: c, ss: { getSheetByName(n) { return n === 'Hospedagem' ? fin : (n === 'Calendário Hospedagem para dash' ? c : null); }, getSheets() { return [fin, c]; } } };
}

/**
 * Carrega a ponte. `opcoes.arquivo` (padrão: integracao-planilha/Codigo.gs), `opcoes.senha`
 * (a PONTE_SENHA das Propriedades; null = não configurada), `opcoes.codigo` (o texto do
 * Codigo.gs, para provar um defeito plantado sem tocar no arquivo).
 * Devolve {P, sb, post(corpo), get(), linhas(), noites(nome), colunaDe(nome), logs}.
 */
function carregarPonte(opcoes) {
  const o = opcoes || {};
  const arquivo = o.arquivo || 'integracao-planilha/Codigo.gs';
  const codigo = o.codigo || fs.readFileSync(path.join(RAIZ, arquivo), 'utf8');
  const senha = (o.senha === undefined) ? 'tk-de-mentira' : o.senha;
  const P = {}, logs = [];
  const sb = {
    PropertiesService: { getScriptProperties() { return { getProperty(k) { return (k === 'PONTE_SENHA') ? senha : null; } }; } },
    Logger: { log(m) { logs.push(String(m)); } },
    ContentService: { MimeType: { JSON: 'JSON' }, createTextOutput(t) { return { t, setMimeType() { return this; }, getContent() { return this.t; } }; } },
    SpreadsheetApp: { getActiveSpreadsheet() { return P.ss; } },
    Utilities: { formatDate(d) { const p = (x) => String(x).padStart(2, '0'); return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear(); } },
  };
  vm.createContext(sb);
  vm.runInContext(codigo, sb, { filename: arquivo });
  Object.assign(P, planilha(vm.runInContext('Date', sb), o.colunas));
  const dt = (x) => (x && x.getDate) ? (String(x.getDate()).padStart(2, '0') + '/' + String(x.getMonth() + 1).padStart(2, '0')) : x;
  return {
    P, sb, logs,
    post(corpo) { return JSON.parse(sb.doPost({ postData: { contents: JSON.stringify(Object.assign({ token: senha }, corpo)) } }).getContent()); },
    get() { return JSON.parse(sb.doGet().getContent()); },
    /** As linhas do dinheiro: [{nome, entrada, saida, diarias, reserva, dataReserva, total, diaria, aPagar, dataAPagar, riscada}] */
    linhas() {
      return P.fin.L.slice(1).map((r, i) => ({ nome: r[1], entrada: dt(r[2]), saida: dt(r[3]), diarias: r[4], reserva: r[5], dataReserva: dt(r[6]),
        total: r[7], diaria: r[8], aPagar: r[9], dataAPagar: dt(r[10]), riscada: P.fin.fmt[i + 2] === 'line-through', nota: P.fin.notas[(i + 2) + ':2'] || '' }));
    },
    /** As noites (dia do mês) em que o nome aparece no calendário. */
    noites(nome) { return P.cal.L.slice(1).filter((r) => r.slice(1).some((x) => String(x).toLowerCase() === String(nome).toLowerCase())).map((r) => r[0].getDate()); },
    /** As colunas (1, 2…) em que o nome aparece. */
    colunasDe(nome) {
      const s = new Set();
      P.cal.L.slice(1).forEach((r) => r.slice(1).forEach((x, j) => { if (String(x).toLowerCase() === String(nome).toLowerCase()) s.add(j + 1); }));
      return Array.from(s).sort();
    },
  };
}

module.exports = { carregarPonte, CABECALHO };
