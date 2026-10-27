'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const compostaFactory = require('../auaulandia/agenda-marcia/composta.js');
const entrevistas = require('../auaulandia/agenda-marcia/entrevistas.js');

const copia = x => x == null ? x : JSON.parse(JSON.stringify(x));

function fonteAvaliacoes(dias) {
  return {
    criar() {
      return {
        observar(dia, cb) { cb({ dia, estado: 'pronto', itens: [] }); return () => {}; },
        observarMes(mes, cb) { cb({ mes, estado: 'pronto', dias }); return () => {}; },
        salvar() { return Promise.resolve({ ok: true }); },
        fechar() {}
      };
    }
  };
}

class BancoFake {
  constructor() { this.data = {}; }
  ref(caminho) {
    const banco = this;
    return {
      transaction(fn) {
        const antes = copia(banco.data[caminho] || null);
        const depois = fn(antes);
        if (depois === undefined) return Promise.resolve({ committed: false, snapshot: { val: () => antes } });
        banco.data[caminho] = copia(depois);
        return Promise.resolve({ committed: true, snapshot: { val: () => copia(depois) } });
      },
      on() {},
      off() {}
    };
  }
}

test('avaliações mensais prontas continuam prontas quando Entrevistas está sem permissão', () => {
  let recebido;
  const composta = compostaFactory(fonteAvaliacoes({ '2026-10-29': true }), entrevistas)
    .criar({ podeEntrevista: () => false });
  composta.observarMes('2026-10', valor => { recebido = valor; });
  assert.equal(recebido.estado, 'pronto');
  assert.deepEqual(recebido.dias, { '2026-10-29': true });
  composta.fechar();
});

test('duas intenções confirmadas com os mesmos quatro campos recebem IDs distintos', async () => {
  const db = new BancoFake();
  const fonte = entrevistas.criar({
    db,
    pode: () => true,
    autor: () => ({ id: 'consultora-ficticia', nome: 'Consultora Fictícia' }),
    agora: () => 1793358000000
  });
  const pedido = {
    acao: 'criar',
    dia: '2026-10-30',
    avaliacao: { tipo: 'entrevista', nome: 'Pessoa Fictícia', vaga: 'Vaga Fictícia', telefone: '(00) 90000-0000', hora: '09:30' }
  };
  const primeira = await fonte.salvar(pedido);
  const segunda = await fonte.salvar(pedido);
  assert.notEqual(segunda.id, primeira.id);
  fonte.fechar();
});

test('troca de pessoa atualiza o papel antes de reabrir os painéis de Entrevistas', () => {
  const arquivo = path.join(__dirname, '../auaulandia/index.html');
  const html = fs.readFileSync(arquivo, 'utf8');
  const inicio = html.indexOf('  function aplicarLogin(u){');
  const fim = html.indexOf('\n  function ', inicio + 10);
  const corpo = html.slice(inicio, fim);
  const papel = corpo.indexOf('document.body.dataset.role=u.role');
  const reabrir = corpo.indexOf('entrevistas155Atualizar');
  assert.ok(papel >= 0 && reabrir >= 0 && papel < reabrir,
    'a reabertura usa papelDoCorpo; o novo papel precisa estar no body antes dela');
});
