'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const test = require('node:test');
// Fixtures fictícias. Executa o módulo literal do app; sem rede e sem banco real.
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '../../auaulandia/index.html'), 'utf8');
const bloco = html.match(/<script id="zelozinha-dados-painel116">([\s\S]*?)<\/script>/);
assert.ok(bloco, 'módulo de cuidados datados precisa estar no app');
const modulo = { exports: {} };
new Function('module', 'exports', bloco[1])(modulo, modulo.exports);
const Dados116 = modulo.exports;

const sha = valor => crypto.createHash('sha256').update(String(valor), 'utf8').digest('hex');
const copia = valor => valor == null ? valor : structuredClone(valor);

function painel(dia, pets) {
  const identidadesPets = {};
  const itens = {};
  const grupos = [];
  pets.forEach((p, i) => {
    identidadesPets[p.petId] = {
      petId: p.petId,
      tutorRefId: p.tutorId,
      dcKeyAtual: p.dcKey,
      pelKeyAtual: p.pelKey,
      nomePeludo: p.nomePeludo,
      nomeTutor: p.nomeTutor
    };
    const cycleKey = JSON.stringify([p.petId, p.tutorId, p.care, dia, p.itemK]);
    itens[String(i + 1).padStart(32, 'a')] = {
      cycleKey,
      petId: p.petId,
      tutorId: p.tutorId,
      care: p.care,
      itemK: p.itemK,
      dueDate: dia,
      statusPainel: 'ainda_nao_enviada',
      motivo: 'fixture local'
    };
    if (p.textoEnviado) grupos.push({
      groupKey: `GRUPO_FICTICIO_${i + 1}`,
      textoDisponivel: true,
      textoEnviado: p.textoEnviado,
      cycleKeys: [cycleKey],
      itemKs: [p.itemK]
    });
  });
  return {
    versao: 81,
    dia,
    atualizadoEm: `${dia}T10:00:00-03:00`,
    detalhesEnvioVersao: 104,
    assinaturaConteudo: sha(`painel-${dia}`),
    identidadesPets,
    grupos,
    cuidadosDia: { versao: 104, itens }
  };
}

function dbFake(valores, atrasos = {}) {
  const leituras = [];
  return {
    leituras,
    ref(caminho) {
      return {
        once: async evento => {
          assert.equal(evento, 'value');
          leituras.push(caminho);
          if (atrasos[caminho]) await new Promise(resolve => setTimeout(resolve, atrasos[caminho]));
          if (!Object.prototype.hasOwnProperty.call(valores, caminho)) throw Error(`caminho não preparado: ${caminho}`);
          return { val: () => copia(valores[caminho]) };
        }
      };
    }
  };
}

const PET_1 = { petId: 'PET_FICTICIO_1', tutorId: 'TUTOR_FICTICIO_1', dcKey: 'orvalho__familia-limoeiro', pelKey: 'orvalho__família limoeiro', nomePeludo: 'Orvalho', nomeTutor: 'Família Limoeiro', care: 'vermifugo', itemK: 'verm_p' };
const PET_1_B = { ...PET_1, care: 'ecto', itemK: 'ecto_p' };
const PET_2 = { petId: 'PET_FICTICIO_2', tutorId: 'TUTOR_FICTICIO_2', dcKey: 'brisa__familia-serra', pelKey: 'brisa__família serra', nomePeludo: 'Brisa', nomeTutor: 'Família Serra', care: 'vacina', itemK: 'vac_v10' };

test('duas datas usam apenas seus snapshots e a leitura antiga não substitui a mais nova', async () => {
  const d1 = '2026-10-22', d2 = '2026-10-23';
  const raiz = 'piloto59/interno-20261019/painel81/';
  const valores = {
    [`${raiz}${d1}`]: painel(d1, [{ ...PET_1, textoEnviado: 'Mensagem real confirmada da Família Limoeiro.' }, PET_1_B, PET_2]),
    [`daycare/checkin-corpo/${d1}`]: { [PET_1.dcKey]: { tipo: 'entrada', fim: `${d1}T08:00:00-03:00` }, [PET_2.dcKey]: { tipo: 'entrada', fim: `${d1}T08:10:00-03:00` } },
    [`daycare/checkout-corpo/${d1}`]: { [PET_1.dcKey]: { tipo: 'saida', fim: `${d1}T17:00:00-03:00` }, [PET_2.dcKey]: { tipo: 'saida', fim: `${d1}T17:10:00-03:00` } },
    [`daycare/chamada/${d1}`]: { [PET_1.dcKey]: 'veio', [PET_2.dcKey]: 'veio' },
    [`${raiz}${d2}`]: painel(d2, [PET_2]),
    [`daycare/checkin-corpo/${d2}`]: { [PET_2.dcKey]: { tipo: 'entrada', fim: `${d2}T08:05:00-03:00` } },
    [`daycare/checkout-corpo/${d2}`]: {},
    [`daycare/chamada/${d2}`]: { [PET_2.dcKey]: 'veio' }
  };
  const db = dbFake(valores, { [`${raiz}${d1}`]: 30 });
  const api = Dados116.criar({
    db,
    validarPainel: (v, dia) => v && v.dia === dia ? copia(v) : null,
    assinar: async valor => sha(valor),
    ttlMs: 60000
  });

  const antiga = api.ler(d1, true);
  await new Promise(resolve => setTimeout(resolve, 2));
  const nova = await api.ler(d2, true);
  const descartada = await antiga;
  assert.equal(nova.estado, 'pronto');
  assert.equal(nova.dia, d2);
  assert.equal(nova.total, 1);
  assert.equal(nova.itens[0].dcKey, PET_2.dcKey);
  assert.equal(descartada.estado, 'obsoleto');
  assert.equal(api.estado().dia, d2, 'o retorno atrasado não pode repor a data anterior');

  const passada = await api.ler(d1, true);
  assert.equal(passada.estado, 'pronto');
  assert.equal(passada.total, 2, 'dois cuidados do mesmo FILHOt contam uma vez');
  assert.deepEqual(passada.itens.map(x => x.cuidados.length).sort(), [1, 2]);
  assert.ok(passada.itens.every(x => x.presenca.estado === 'saiu'), 'checkout final é contexto e não remove o registro do dia');
  assert.equal(passada.itens.find(x => x.dcKey === PET_1.dcKey).cuidados[0].textoEnviado, 'Mensagem real confirmada da Família Limoeiro.');
  assert.equal(passada.itens.find(x => x.dcKey === PET_2.dcKey).cuidados[0].textoEnviado, '', 'sem texto confirmado, o histórico não inventa mensagem');
  assert.match(passada.assinatura, /^[a-f0-9]{64}$/);
  assert.equal(api.estado().dia, d1);
  assert.ok(db.leituras.every(c => c.includes(d1) || c.includes(d2)));
});

test('fonte 104 inválida é desconhecida e nunca vira contador zero', async () => {
  const dia = '2026-10-21';
  const db = dbFake({
    [`piloto59/interno-20261019/painel81/${dia}`]: { versao: 81, dia, detalhesEnvioVersao: 92 },
    [`daycare/checkin-corpo/${dia}`]: {},
    [`daycare/checkout-corpo/${dia}`]: {},
    [`daycare/chamada/${dia}`]: {}
  });
  const api = Dados116.criar({ db, validarPainel: () => null, assinar: async valor => sha(valor) });
  const r = await api.ler(dia, true);
  assert.equal(r.estado, 'desconhecido');
  assert.equal(r.total, null);
  assert.equal(r.itens, null);
  assert.equal(r.assinatura, '');
});

