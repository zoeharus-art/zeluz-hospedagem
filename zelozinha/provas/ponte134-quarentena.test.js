'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const APP = path.join(__dirname, '../../auaulandia/index.html');
const DIA = '2026-10-26';
const sha = valor => crypto.createHash('sha256').update(String(valor), 'utf8').digest('hex');
const copia = valor => structuredClone(valor);

function carregarRecibos43(html) {
  const inicio = html.indexOf('/* recibos43/index.js */');
  const fim = html.indexOf('/* recibos43/repositorio-rtdb43.js */', inicio);
  assert.ok(inicio >= 0 && fim > inicio, 'Recibos43 real delimitado no app');
  const modulo = { exports: {} };
  new Function('module', 'exports', html.slice(inicio, fim))(modulo, modulo.exports);
  return modulo.exports;
}

function carregarValidadorHub(html, Recibos43) {
  const trecho = html.match(/<script data-operacao116-hub>([\s\S]*?)<\/script>/);
  assert.ok(trecho, 'validador116 real delimitado no app');
  const window = { Recibos43 };
  const document = { querySelector: () => null };
  new Function('window', 'document', trecho[1])(window, document);
  return window.ZelozinhaOperacao116UI;
}

function carregarNormalizador(html, Recibos43, UI) {
  const inicio = html.indexOf('function zPainel104ValidarCuidados');
  const fim = html.indexOf('function zPainel44Projecao80Atual', inicio);
  assert.ok(inicio >= 0 && fim > inicio, 'normalizador literal delimitado no app');
  const window = { Recibos43, ZelozinhaOperacao116UI: UI };
  return new Function('window', 'zPainel44Dia', html.slice(inicio, fim) + ';return {normalizar:zPainel44ValidarFonte80,confirmar:zPainel116ConfirmaIncertoIsolado};')(
    window, () => DIA
  );
}

function projecaoIncerta() {
  const petId = 'PET_FIXTURE_134', tutorId = 'TUTOR_FIXTURE_134', dcKey = 'pet-fixture--tutor-fixture', pelKey = 'pet-fixture__tutor-fixture';
  const irmaoId = 'PET_IRMAO_FIXTURE_134', irmaoTutorId = 'TUTOR_IRMAO_FIXTURE_134';
  const groupKey = JSON.stringify([petId, tutorId, DIA]);
  const cycleKey = JSON.stringify([petId, tutorId, 'vermifugo', DIA, 'verm_p']);
  const hashGrupo = sha(groupKey).slice(0, 32), hashCiclo = sha(cycleKey).slice(0, 32);
  const nomePeludo = 'Peludo Fictício', nomeIrmao = 'Irmão Fictício', nomeTutor = 'Tutor Fictício', familiaId = 'f'.repeat(32);
  const estado43 = { version: 43, groups: {}, cycles: {}, active: null,
    lastAttemptAt: `${DIA}T07:00:01-03:00`, lastObservedAt: `${DIA}T07:00:01-03:00`, channelSuspended: false };
  return {
    versao: 81, detalhesEnvioVersao: 104, dia: DIA, atualizadoEm: `${DIA}T07:00:02-03:00`,
    autoria: { id: 'zelozinha-zeluz', nome: 'Zelozinha', tipo: 'servico' },
    estadoRecibos43: { versao: 43, stateJson: JSON.stringify(estado43) },
    identidadesPets: { [petId]: { petId, tutorRefId: tutorId, dcKeyAtual: dcKey, pelKeyAtual: pelKey, nomePeludo, nomeTutor },
      [irmaoId]: { petId: irmaoId, tutorRefId: irmaoTutorId, dcKeyAtual: 'irmao-fixture--tutor-fixture',
        pelKeyAtual: 'irmao-fixture__tutor-fixture', nomePeludo: nomeIrmao, nomeTutor } },
    grupos: { [hashGrupo]: { groupKey, petId, tutorId, statusPainel: 'incerto_conciliacao',
      autoria: { id: 'zelozinha-zeluz', nome: 'Zelozinha', tipo: 'servico' }, respostaHumana: 'nao_aplicavel',
      retornoHumanoPrevisto: '13:30', familiaId, membros: [{ petId, tutorId, dcKey, pelKey, nomePeludo, nomeTutor,
        temCuidados: true, cycleKeys: [cycleKey], itemKs: ['verm_p'] }, { petId: irmaoId, tutorId: irmaoTutorId,
        dcKey: 'irmao-fixture--tutor-fixture', pelKey: 'irmao-fixture__tutor-fixture', nomePeludo: nomeIrmao,
        nomeTutor, temCuidados: false }] } },
    cuidadosDia: { versao: 104, itens: { [hashCiclo]: { cycleKey, petId, tutorId, care: 'vermifugo', dueDate: DIA,
      itemK: 'verm_p', statusPainel: 'incerto_conciliacao', motivo: 'Resultado incerto; conferência humana necessária.' } } },
    operation116: { version: 116, control: { status: 'running', revision: 3, pause: null },
      channel: { status: 'operational', code: '' }, quarantines: { total: 1, items: [{ id: 'quarentena-fixture-134',
        groupId: hashGrupo, familyId: familiaId, status: 'uncertain', since: `${DIA}T07:00:01-03:00`,
        code: 'resultado_pos_chamada_desconhecido', requiresHumanReview: true, retryAllowed: false,
        nomeTutor, nomesPeludinhos: [nomePeludo, nomeIrmao], diaOriginal: DIA }] } }
  };
}

const html = fs.readFileSync(APP, 'utf8');
const Recibos43 = carregarRecibos43(html);
const UI = carregarValidadorHub(html, Recibos43);
const api = carregarNormalizador(html, Recibos43, UI);
const normalizar = api.normalizar;

test('incerto isolado atravessa o normalizador literal quando grupo, família, membros, cuidado e quarentena coincidem', () => {
  const projecao = projecaoIncerta();
  assert.equal(JSON.parse(projecao.estadoRecibos43.stateJson).channelSuspended, false);
  assert.equal(projecao.operation116.quarantines.total, 1);
  const hash = Object.keys(projecao.grupos)[0], grupo = projecao.grupos[hash];
  const quarentena = projecao.operation116.quarantines.items[0];
  assert.equal(quarentena.groupId, hash);
  assert.equal(quarentena.familyId, grupo.familiaId);
  assert.equal(quarentena.diaOriginal, DIA);
  assert.deepEqual(quarentena.nomesPeludinhos, grupo.membros.map(m => m.nomePeludo));
  assert.equal(quarentena.nomeTutor, grupo.membros[0].nomeTutor);
  assert.equal(UI.validarProjecao({ operation116: projecao.operation116 }), true);
  assert.equal(api.confirmar(grupo, DIA, hash, projecao.operation116, projecao.cuidadosDia), true);
  assert.ok(normalizar(projecao, DIA), 'a projeção isolada corroborada deve permanecer visível');
});

test('isolamento falha fechado quando qualquer corroboração estrita diverge', () => {
  const base = projecaoIncerta();
  const casos = [
    p => { p.operation116.quarantines.items[0].groupId = '0'.repeat(32); },
    p => { p.operation116.quarantines.items[0].familyId = '0'.repeat(32); },
    p => { p.operation116.quarantines.items[0].id = ''; },
    p => { const q = copia(p.operation116.quarantines.items[0]);q.groupId='1'.repeat(32);q.familyId='2'.repeat(32);p.operation116.quarantines.items.push(q);p.operation116.quarantines.total=2; },
    p => { p.operation116.control.revision = -1; },
    p => { p.operation116.quarantines.items[0].nomesPeludinhos = ['Outro peludo']; },
    p => { p.operation116.quarantines.items[0].retryAllowed = true; },
    p => { Object.values(p.cuidadosDia.itens)[0].statusPainel = 'ainda_nao_enviada'; },
    p => { Object.values(p.grupos)[0].canalReciboId = 'recibo-inventado'; },
    p => { delete p.operation116; }
  ];
  for (const alterar of casos) {
    const divergente = copia(base); alterar(divergente);
    assert.equal(normalizar(divergente, DIA), null);
  }
});

test('família incerta e outro grupo em preparação permanecem juntos sem fabricar recibo', () => {
  const projecao = projecaoIncerta();
  const petId = 'PET_PREPARO_134', tutorId = 'TUTOR_PREPARO_134', groupKey = JSON.stringify([petId, tutorId, DIA]);
  const cycleKey = JSON.stringify([petId, tutorId, 'carrapaticida', DIA, 'ecto_p']);
  projecao.identidadesPets[petId] = { petId, tutorRefId: tutorId, dcKeyAtual: 'preparo--fixture',
    pelKeyAtual: 'preparo__fixture', nomePeludo: 'Preparo Fictício', nomeTutor: 'Tutor Preparo' };
  projecao.grupos[sha(groupKey).slice(0,32)] = { groupKey, petId, tutorId, statusPainel: 'em_preparacao',
    autoria: { id: 'zelozinha-zeluz', nome: 'Zelozinha', tipo: 'servico' }, respostaHumana: 'nao_aplicavel', retornoHumanoPrevisto: '13:30' };
  projecao.cuidadosDia.itens[sha(cycleKey).slice(0,32)] = { cycleKey, petId, tutorId, care: 'carrapaticida', dueDate: DIA,
    itemK: 'ecto_p', statusPainel: 'ainda_nao_enviada', motivo: 'Pronto para envio automático.' };
  const normalizada = normalizar(projecao, DIA);
  assert.ok(normalizada);
  assert.equal(normalizada.grupos.length, 2);
  assert.equal(Object.values(normalizada.cuidadosDia.itens).filter(x => x.statusPainel==='incerto_conciliacao').length, 1);
  assert.equal(Object.values(normalizada.cuidadosDia.itens).filter(x => x.statusPainel==='ainda_nao_enviada').length, 1);
});

test('contrato legado com suspensão global confirmada continua aceito sem operation116', () => {
  const legado = projecaoIncerta();
  const estado43 = JSON.parse(legado.estadoRecibos43.stateJson);
  estado43.channelSuspended = true;
  legado.estadoRecibos43.stateJson = JSON.stringify(estado43);
  delete legado.operation116;
  assert.ok(normalizar(legado, DIA));
});
