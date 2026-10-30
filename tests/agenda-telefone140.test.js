'use strict';

const assert = require('node:assert/strict');
const Dados = require('../auaulandia/agenda-marcia/dados.js');
const Painel = require('../auaulandia/agenda-marcia/painel.js');

const DIA = '2026-10-26';
const PATH = 'daycare/dashboard/' + DIA + '/avaliacao';
function clone(v) { return v == null ? v : JSON.parse(JSON.stringify(v)); }
function snapshot(v) { return { val() { return clone(v); } }; }
class FakeDB {
  constructor() { this.data = {}; this.refs = {}; this.pushes = 0; }
  ref(path) { return new FakeRef(this, path); }
}
class FakeRef {
  constructor(db, path) { this.db = db; this.path = path; }
  push() { this.db.pushes += 1; return { key: 'agenda-' + this.db.pushes }; }
  on(event, ok) { assert.equal(event, 'value'); ok(snapshot(this.db.data[this.path] || {})); }
  off() {}
  transaction(fn) {
    const parts = this.path.startsWith(PATH + '/') ? this.path.slice(PATH.length + 1).split('/') : [];
    const atual = clone(parts.length ? (this.db.data[this.path] || this.db.data[PATH] && this.db.data[PATH][parts[0]]) : this.db.data[this.path]);
    const novo = fn(atual);
    if (novo === undefined) return Promise.resolve({ committed: false, snapshot: snapshot(atual) });
    this.db.data[this.path] = clone(novo);
    if (parts.length) { this.db.data[PATH] = this.db.data[PATH] || {}; this.db.data[PATH][parts[0]] = clone(novo); }
    return Promise.resolve({ committed: true, snapshot: snapshot(novo) });
  }
}
function comando(extra = {}) {
  return Object.assign({
    nome: 'Aurora', raca: 'SRD', tutor: 'Responsável', telefone: '(00) 90000-0000', hora: '09:30',
    /* 30/out/2026: salvar exige as três escolhas (Em dia ou Vai fazer na Zêluz). */
    vacina: { conferido: true, plano: 'em_dia', detalhe: '' }, vermifugo: { conferido: false, plano: 'na_zeluz', detalhe: 'Produto fictício' }, carrapaticida: { conferido: true, plano: 'em_dia', detalhe: '' },
    experiencia: '', saude: '', observacoes: '', pagamento: { recebido: false, valorCent: 0 }
  }, extra);
}
function painelRaiz() {
  return {
    innerHTML: '', handlers: {}, ownerDocument: { createElement(tag) { return { tag, children: [], setAttribute(k, v) { this[k] = v; }, appendChild(x) { this.children.push(x); } }; } },
    addEventListener(k, fn) { this.handlers[k] = fn; }, removeEventListener(k) { delete this.handlers[k]; },
    contains() { return true; }
  };
}

async function executar() {
  assert.equal(Dados.telefoneBR('(00) 90000-0000', true), '+5500900000000');
  assert.equal(Dados.telefoneBR('+55 (00) 9000-0000', true), '+550090000000');
  assert.throws(() => Dados.telefoneBR('', true), /TELEFONE_OBRIGATORIO/);
  assert.throws(() => Dados.telefoneBR('1234', true), /TELEFONE_INVALIDO/);

  assert.equal(Painel.validar(comando({ telefone: '' })).valido, false, 'tela rejeita telefone vazio');
  assert.equal(Painel.validar(comando({ telefone: '1234' })).valido, false, 'tela rejeita telefone inválido');
  const validado = Painel.validar(comando());
  assert.equal(validado.valido, true);
  assert.equal(validado.valor.telefone, '+5500900000000');
  const htmlNovo = Painel.desenhar({ dia: DIA, estado: 'pronto', itens: [] }, { novo: {}, erros: {}, pendentes: {} });
  assert.match(htmlNovo, /name="telefone" required maxlength="24" type="tel"/);
  assert.match(htmlNovo, /Telefone do tutor/);

  const db = new FakeDB();
  const api = Dados.criar({ db, pode: () => true, autor: () => ({ id: 'equipe-sintetica', nome: 'Consultora' }), agora: () => Date.parse('2026-10-26T10:00:00-03:00') });
  await assert.rejects(api.salvar({ acao: 'criar', dia: DIA, avaliacao: comando({ telefone: '' }) }), /TELEFONE_OBRIGATORIO/);
  await assert.rejects(api.salvar({ acao: 'criar', dia: DIA, avaliacao: comando({ telefone: '12-34' }) }), /TELEFONE_INVALIDO/);
  assert.equal(db.pushes, 0, 'writer rejeita dados antes de alocar/agendar');

  const criado = await api.salvar({ acao: 'criar', dia: DIA, requestId: 'criacao-sintetica', avaliacao: comando() });
  assert.equal(criado.ok, true);
  assert.equal(criado.item.telefone, '+5500900000000');
  const reaberto = [];
  api.observar(DIA, x => reaberto.push(x));
  assert.equal(reaberto.at(-1).itens[0].telefone, '+5500900000000', 'telefone persiste e volta ao abrir a agenda');
  const htmlReaberto = Painel.desenhar(reaberto.at(-1), { novo: {}, rascunhos: {}, erros: {}, pendentes: {} });
  assert.match(htmlReaberto, /name="telefone"[^>]*value="\+5500900000000"/);
  assert.match(htmlReaberto, /href="https:\/\/wa\.me\/5500900000000"/);
  assert.match(htmlReaberto, /data-am-copiar-campo aria-label="Copiar telefone"/, 'o box do telefone tem o copiar à direita');
  assert.match(htmlReaberto, /class="am171__tel-wa" data-am-wa href="https:\/\/wa\.me\/5500900000000"/, 'e o WhatsApp à esquerda');

  const raizBusca = painelRaiz();
  Painel.montar(raizBusca, { dia: DIA, clientes: [{ id: 'cadastro-sintetico', nome: 'Aurora', raca: 'SRD', tutor: 'Responsável', telefone: '(00) 90000-0000' }], carregar: () => Promise.resolve({ dia: DIA, estado: 'pronto', itens: [] }) });
  await new Promise(r => setImmediate(r));
  const seletorCadastro = { closest() { return this; }, hasAttribute(n) { return n === 'data-am-cliente'; }, getAttribute(n) { return n === 'data-am-cliente' ? 'cadastro-sintetico' : null; } };
  raizBusca.handlers.click({ target: seletorCadastro });
  assert.match(raizBusca.innerHTML, /name="telefone" required maxlength="24" type="tel" value="\+5500900000000"/);
  const formularioDigitado = { closest() { return this; }, getAttribute() { return 'novo'; }, querySelector(sel) { const m = sel.match(/^\[name="(.+)"\]$/), nome = m && m[1]; const vals = { nome: 'Aurora', raca: 'SRD', tutor: 'Responsável', telefone: '00 90000-0001', hora: '10:00', 'vacina-conferido': false, 'vermifugo-conferido': false, 'carrapaticida-conferido': false, experiencia: '', saude: '', observacoes: '', 'pagamento-recebido': false }; return nome ? { value: vals[nome] == null ? '' : vals[nome], checked: vals[nome] === true } : null; } };
  raizBusca.handlers.input({ target: { closest() { return formularioDigitado; }, hasAttribute() { return false; } } });
  raizBusca.handlers.click({ target: seletorCadastro });
  assert.match(raizBusca.innerHTML, /name="telefone" required maxlength="24" type="tel" value="00 90000-0001"/);

  await assert.rejects(api.salvar({ acao: 'editar', dia: DIA, id: criado.id, expectedRevision: criado.revisao, expectedFingerprint: criado.item.fingerprint, avaliacao: comando({ telefone: '' }) }), /TELEFONE_OBRIGATORIO/);
  const editado = await api.salvar({ acao: 'editar', dia: DIA, id: criado.id, expectedRevision: criado.revisao, expectedFingerprint: criado.item.fingerprint, avaliacao: comando({ telefone: '00 3000-0000', observacoes: 'Nota preservada' }) });
  assert.equal(editado.item.telefone, '+550030000000');
  assert.equal(editado.item.observacoes, 'Nota preservada');

  const legado = { valor: 'Legado / SRD', hora: '08:00', det: { agendaMarcia: true, avaliacao129: { versao: 131, tutor: 'Responsável', revisao: 2, autorId: 'antigo', autorNome: 'Equipe', ts: 1, quando: '09:00' } } };
  db.data[PATH]['agenda-legado'] = legado;
  const legados = [];
  api.observar(DIA, x => legados.push(x));
  const itemLegado = legados.at(-1).itens.find(x => x.id === 'agenda-legado');
  assert.equal(itemLegado.telefone, '', 'registro legado continua legível sem telefone');
  const htmlLegado = Painel.desenhar(legados.at(-1), { novo: {}, rascunhos: {}, erros: {}, pendentes: {} });
  assert.match(htmlLegado, /Telefone do tutor não informado neste registro/);
  const cancelado = await api.salvar({ acao: 'cancelar', dia: DIA, id: 'agenda-legado', expectedRevision: itemLegado.revisao, expectedFingerprint: itemLegado.fingerprint, motivo: 'Registro sintético' });
  assert.equal(cancelado.item.cancelada, true, 'cancelamento legado não exige telefone');

  const raiz = painelRaiz(), valoresCopiados = [];
  const itemUI = { id: 'salvo', dia: DIA, fingerprint: 'fp-s', hora: '09:00', nome: 'Aurora', raca: 'SRD', tutor: 'Responsável', telefone: '+5500900000000', vacina: {}, vermifugo: {}, carrapaticida: {}, pagamento: { recebido: false, valorCent: 0 }, revisao: 1 };
  Painel.montar(raiz, { dia: DIA, carregar: () => Promise.resolve({ dia: DIA, estado: 'pronto', itens: [itemUI] }), salvar() {}, copiarTexto: v => { valoresCopiados.push(v); return Promise.resolve(); } });
  await new Promise(r => setImmediate(r));
  const textoAntesDaCopia = raiz.innerHTML;
  const contato = { children: [], classList: { v: new Set(), add(c) { this.v.add(c); }, remove(c) { this.v.delete(c); }, contains(c) { return this.v.has(c); } }, querySelector() { return null; }, appendChild(x) { this.children.push(x); } };
  const botao = { parentNode: contato, closest() { return this; }, hasAttribute(n) { return n === 'data-am-copiar-telefone'; }, getAttribute(n) { return n === 'data-am-copiar-telefone' ? 'salvo' : null; } };
  raiz.handlers.click({ target: botao });
  await new Promise(r => setImmediate(r));
  assert.deepEqual(valoresCopiados, ['+5500900000000']);
  assert.equal(raiz.innerHTML, textoAntesDaCopia, 'feedback de cópia não redesenha o formulário nem apaga notas em rascunho');
  /* 30/out/2026: copiou, o ícone vira ✓ e aparece «Copiado» por 2 s (a classe `copiado` no box). */
  assert.equal(contato.classList.contains('copiado'), true);
  assert.equal(contato.children.length, 0, 'sem aviso de falha quando a cópia deu certo');

  console.log('agenda-telefone140: OK');
}
executar().catch(e => { console.error(e); process.exitCode = 1; });
