'use strict';

const assert = require('node:assert/strict');
const Painel = require('../auaulandia/marcia129/painel.js');

const DIA = '2026-10-26';
const item = {
  id: 'avaliacao-sintetica', codigoOrigem: 'registro-sintetico', dia: DIA, hora: '09:00', nome: 'FILHOt sintético', raca: 'SRD', tutor: 'Responsável sintético',
  telefone: '(00) 90000-0000', agendaMarcia: true, pagamento: { recebido: false, valorCent: 0 },
  vacina: { conferido: true }, vermifugo: { conferido: false }, carrapaticida: { conferido: true },
  observacoes: [{ rotulo: 'Nota', valor: 'Rascunho sintético preservado' }], conferencia: { tutor: 'Responsável sintético', revisao: 2, experiencia: '', saude: '', observacoes: '' }
};
function snap(avaliacoes) {
  const pronto = itens => ({ estado: 'pronto', itens: itens || [] });
  return { dia: DIA, agenda: pronto(avaliacoes), quantidades: { estado: 'pronto' }, faltas: pronto(), novatos: pronto(), comida: pronto(), saude: pronto(), tempos: pronto(), tarefas: pronto() };
}
class Raiz {
  constructor() { this.innerHTML = ''; this.handlers = {}; this.ownerDocument = { createElement(tag) { return { tag, children: [], setAttribute(k, v) { this[k] = v; }, appendChild(x) { this.children.push(x); } }; } }; }
  addEventListener(tipo, fn) { this.handlers[tipo] = fn; }
  removeEventListener(tipo) { delete this.handlers[tipo]; }
  querySelectorAll() { return []; }
  querySelector() { return null; }
  contains() { return true; }
}
function adiar() { return new Promise(resolve => setImmediate(resolve)); }

async function executar() {
  const normalizado = Painel.normalizar(snap([item]), DIA);
  assert.equal(normalizado.agenda.itens[0].telefone, '+5500900000000', 'ficha recebe o telefone do registro persistido');
  const html = Painel.desenhar(normalizado, { dia: DIA, podeSalvarAvaliacao: true });
  assert.match(html, /Telefone/);
  assert.match(html, /href="https:\/\/wa\.me\/5500900000000"/);
  assert.match(html, /data-marcia-copiar-telefone="avaliacao-sintetica">Copiar<\/button>/);
  assert.match(html, /Rascunho sintético preservado/);

  const semTelefone = Painel.normalizar(snap([{ ...item, telefone: '' }]), DIA);
  assert.equal(semTelefone.agenda.itens[0].telefone, '', 'telefone ausente segue legível no legado');
  assert.match(Painel.desenhar(semTelefone, { dia: DIA }), /Telefone do tutor não informado neste registro/);

  const raiz = new Raiz(), copiados = [];
  Painel.montar(raiz, { dia: DIA, carregar: () => Promise.resolve(snap([item])), salvarTarefa() { return Promise.resolve(); }, copiarTexto: texto => { copiados.push(texto); return Promise.resolve(); } });
  await adiar();
  const antes = raiz.innerHTML;
  const contato = { children: [], querySelector() { return null; }, appendChild(x) { this.children.push(x); } };
  const botao = { parentNode: contato, closest() { return this; }, hasAttribute(n) { return n === 'data-marcia-copiar-telefone'; }, getAttribute(n) { return n === 'data-marcia-copiar-telefone' ? 'avaliacao-sintetica' : null; } };
  raiz.handlers.click({ target: botao });
  await adiar();
  assert.deepEqual(copiados, ['+5500900000000']);
  assert.equal(raiz.innerHTML, antes, 'cópia atualiza só o feedback e não redesenha nem apaga a nota');
  assert.equal(contato.children[0].textContent, 'Telefone copiado.');

  console.log('marcia-telefone140: OK');
}
executar().catch(e => { console.error(e); process.exitCode = 1; });
