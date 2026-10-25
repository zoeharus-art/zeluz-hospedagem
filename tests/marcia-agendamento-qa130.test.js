'use strict';

// Prova independente do caminho nativo de agendamento. Nunca conecta ao Firebase.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Dados = require('../auaulandia/marcia129/dados.js');
const Hospedes = require('../auaulandia/hospedes-atividades.js');

const DIA = '2026-10-25';
const html = fs.readFileSync(path.join(__dirname, '..', 'auaulandia', 'index.html'), 'utf8');
function funcao(nome) {
  const inicio = html.indexOf('function ' + nome + '(');
  assert(inicio >= 0, 'função real não encontrada: ' + nome);
  const fim = html.indexOf('\n  function ', inicio + 10);
  return html.slice(inicio, fim < 0 ? html.length : fim);
}

function fazerAmbiente() {
  const escritas = [], referencias = [], alertas = [];
  let hora = '';
  const pets = [
    { n: 'Maya', raca: 'SRD', tutor: 'Tutora Alfa', dias: [], extra: {} },
    { n: 'Maya', raca: 'SRD', tutor: 'Tutor Beta', dias: [], extra: {} }
  ];
  const db = {
    ref(caminho) {
      referencias.push(caminho);
      return {
        push() {
          const key = 'avaliacao-' + (escritas.length + 1);
          return { key, set(registro) { escritas.push({ caminho, key, registro: JSON.parse(JSON.stringify(registro)) }); return Promise.resolve(); } };
        }
      };
    }
  };
  const dom = { dashB_avaliacao: { value: 'Maya' }, dashS_avaliacao: { innerHTML: '' }, dashH_avaliacao: { get value() { return hora; } } };
  const documento = { getElementById(id) { return dom[id] || { value: '', innerHTML: '', textContent: '' }; } };
  let chamadasPlanCasar = 0;
  const contexto = {
    console, DB: db, document: documento, PELUDINHOS: pets,
    DASH_SEL: {}, DASH_SEL_I: {}, DASH_DET: {}, DASH_FORA: {},
    DASH_DADOS: { avaliacao: {} }, DASH_DADOS_DE: { dia: DIA }, DASH_HORA: {},
    dashItem() { return { k: 'avaliacao', t: 'Avaliação', hora: true, foraDoCadastro: true, campos: [] }; },
    dashForaLimpo(v) { return String(v == null ? '' : v).replace(/[()]/g, ' ').trim().replace(/\s+/g, ' '); },
    dashForaEhAvulso() { return false; },
    dashDia() { return DIA; },
    dashDetTexto() { return ''; },
    dashNomePlanilha(p) { return p.n + '/' + p.raca + ' (' + p.tutor + ')'; },
    dashXaraDe(p) { return pets.filter(x => x.n === p.n && x.raca === p.raca).length; },
    dashCampoAtivo() { return true; }, dashCampoEhTexto() { return false; }, dashDetTextoLimpo(v) { return String(v); },
    jsNorm(v) { return String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, ' '); },
    escAttr(v) { return String(v); },
    pelInativo() { return false; }, pelNome(p) { return p.n; }, pelGet(p, c) { return p[c]; },
    planCasar() { chamadasPlanCasar += 1; return { p: pets[0], ambiguo: true }; },
    dcKey(n, t) { return String(n).toLowerCase() + '__' + String(t).toLowerCase(); },
    quemSou() { return 'Consultora Fictícia'; }, dashVaiParaPlanilha() { return false; },
    dashAtualizarCard() {}, renderDash() {}, audit() {}, dashEspelhar() {},
    dashLancarFalhou(e) { return String(e && e.message || e); }, alert(v) { alertas.push(String(v)); },
    pendAvaliarLancamento() {}, DC_DASH_TURMA: { quando: 0 }
  };
  vm.createContext(contexto);
  ['dashDet', 'dashForaFalta', 'dashDetFalta', 'dashEscolher', 'dashSugerir', 'dashLancar']
    .forEach(nome => vm.runInContext(funcao(nome), contexto, { filename: 'index.html#' + nome }));
  return { contexto, escritas, referencias, alertas, dom, setHora(v) { hora = v; }, get chamadasPlanCasar() { return chamadasPlanCasar; } };
}

class BancoLeituraFalso {
  constructor(dados) { this.dados = dados; this.leituras = []; this.escritas = []; }
  ref(caminho) {
    const db = this;
    return {
      once(tipo) {
        assert.equal(tipo, 'value'); db.leituras.push(caminho);
        return Promise.resolve({ val() { return db.dados[caminho] == null ? null : JSON.parse(JSON.stringify(db.dados[caminho])); } });
      },
      transaction() { db.escritas.push(caminho); throw new Error('provider não deve gravar durante carregar'); }
    };
  }
}

function depsProvider(db, pets) {
  return {
    db, pode: () => true, autor: () => ({ id: 'gestao-ficticia', nome: 'Gestora Fictícia' }),
    agora: () => Date.parse(DIA + 'T15:10:00-03:00'),
    fontesCadastro: () => ({ pronto: true, peludinhos: pets, cadastro: {}, estadiasProntas: true, estadias: {}, reposProntas: true, reposicoes: [] }),
    helpers: {
      dcKey: (n, t) => String(n).toLowerCase() + '__' + String(t).toLowerCase(),
      pelKey: p => ((p.n || '') + '__' + (p.tutor || '')).toLowerCase(),
      pelDias: p => p.dias || [], pelGet: (p, c) => p.extra && p.extra[c] != null ? p.extra[c] : p[c],
      pelExtra: p => p.extra || {}, pelInativo: p => p.inativo === true, ehMoradorZeluz: p => p.morador === true,
      diffMin: (a, b) => { const x = a.split(':').map(Number), y = b.split(':').map(Number); return y[0] * 60 + y[1] - x[0] * 60 - x[1]; },
      atividadeNome: s => s
    },
    ZeluzHospedesAtividades: Hospedes,
    Presenca96: { resumoGestao: () => ({ estado: 'pronto', avisadas: [], trocasReposicoes: [], contatar: [], revisao15: false }) }
  };
}

async function executar() {
  const env = fazerAmbiente(), c = env.contexto;
  const itens = [
    { nome: 'Maya', raca: 'SRD', tutor: 'Tutora Alfa', dias: [], extra: {} },
    { nome: 'Maya', raca: 'SRD', tutor: 'Tutor Beta', dias: [], extra: {} }
  ];

  // O botão de sugestão devolve uma seleção explícita, incluindo o índice da ficha.
  vm.runInContext("dashSugerir('avaliacao')", c);
  const sugestoes = env.dom.dashS_avaliacao.innerHTML;
  assert.match(sugestoes, /Tutora Alfa/);
  assert.match(sugestoes, /Tutor Beta/);
  const escolha = /dashEscolher\('avaliacao','Maya\/SRD \(Tutor Beta\)',(\d+)\)/.exec(sugestoes);
  assert(escolha, 'sugestão do homônimo envia seu índice de ficha');
  vm.runInContext("dashEscolher('avaliacao','Maya/SRD (Tutor Beta)'," + escolha[1] + ')', c);
  assert.equal(c.DASH_DET.avaliacao.tutor, undefined, 'Lançamento diário permanece um resumo; dados completos usam a Agenda Márcia');
  assert.equal(vm.runInContext("dashDetFalta('avaliacao')", c), 'Horário', 'cadastro selecionado ainda exige hora');
  env.setHora('10:30');
  assert.equal(vm.runInContext("dashDetFalta('avaliacao')", c), '', 'tutor e hora válidos liberam confirmação');
  await vm.runInContext("dashLancar('avaliacao','Maya/SRD (Tutor Beta)')", c);
  assert.equal(env.escritas.length, 1, 'uma única persistência para o cadastro selecionado');
  assert.equal(env.escritas[0].caminho, 'daycare/dashboard/' + DIA + '/avaliacao');
  assert.equal(env.escritas[0].registro.chave, 'maya__tutor beta', 'a chave é da ficha selecionada, não do homônimo');
  assert.equal(env.escritas[0].registro.det && env.escritas[0].registro.det.avaliacao129, undefined);

  // Nome manual idêntico às duas fichas não pode ser resolvido por texto nem ganhar chave.
  c.DASH_FORA.avaliacao = true;
  c.DASH_DET.avaliacao = {};
  env.setHora('');
  assert.equal(vm.runInContext("dashDetFalta('avaliacao')", c), 'Nome · Raça · Horário');
  await vm.runInContext("dashLancar('avaliacao','Maya/SRD')", c);
  assert.equal(env.escritas.length, 1, 'horário ausente: nenhum write');
  assert.match(env.alertas.at(-1), /Escolha o horário/);
  env.setHora('09:00');
  await vm.runInContext("dashLancar('avaliacao','Maya/SRD')", c);
  assert.equal(env.escritas.length, 1, 'nome, raça e tutor ausentes: nenhum write');
  assert.match(env.alertas.at(-1), /Nome · Raça/);
  c.DASH_DET.avaliacao = { nome: 'Maya', raca: 'SRD', tutor: 'Tutor Beta', vacina: true, vermifugo: false, carrapaticida: true };
  env.setHora('11:00');
  await vm.runInContext("dashLancar('avaliacao','Maya/SRD')", c);
  assert.equal(env.escritas.length, 2, 'um write após os quatro campos obrigatórios');
  assert.equal(env.escritas[1].caminho, 'daycare/dashboard/' + DIA + '/avaliacao');
  assert.equal(env.escritas[1].registro.chave, undefined, 'manual sem ficha permanece sem vínculo');
  assert.equal(env.escritas[1].registro.det.fora_do_cadastro, true);
  assert.equal(env.escritas[1].registro.det.avaliacao129, undefined, 'diário nativo não cria formulário completo paralelo');
  assert.equal(env.chamadasPlanCasar, 0, 'nome manual nunca chama casamento pelo texto, mesmo com duas fichas iguais');
  assert.deepEqual(env.referencias.filter(p => /avaliacoes-gestao|vet|medicacao|saude/.test(p)), [], 'launch path has no second or clinical reference');
  assert.equal(env.referencias.filter(p => p === 'daycare/dashboard/' + DIA + '/avaliacao').length, 2);

  // O provider real consome o registro nativo; metadata de Gestão vence campo a campo,
  // inclusive false, e os demais campos vêm de det.avaliacao129 pelo mesmo ID.
  const dashboard = { avaliacao: {} };
  env.escritas.forEach(x => { dashboard.avaliacao[x.key] = x.registro; });
  dashboard.avaliacao[env.escritas[1].key].det.avaliacao129={tutor:'Tutor Beta',vacina:{conferido:true},vermifugo:{conferido:false},carrapaticida:{conferido:true},experiencia:'',saude:'',observacoes:''};
  const dados = {
    ['daycare/dashboard/' + DIA]: dashboard,
    ['daycare/avaliacoes-gestao/' + DIA]: {
      [env.escritas[1].key]: { vacina: { conferido: false }, revisao: 1, autorNome: 'Gestora Fictícia' }
    }
  };
  const petsProvider = [
    { n: 'Maya', raca: 'SRD', tutor: 'Tutora Alfa', dias: [], extra: { problema: 'não importar em avaliação manual' } },
    { n: 'Maya', raca: 'SRD', tutor: 'Tutor Beta', dias: [], extra: { problema: 'não importar em avaliação manual' } }
  ];
  const banco = new BancoLeituraFalso(dados);
  const provider = Dados.criar(depsProvider(banco, petsProvider));
  const snapshot = await provider.carregar(DIA);
  const porOrigem = Object.fromEntries(snapshot.agenda.itens.map(x => [x.codigoOrigem, x]));
  const itemManual = porOrigem[env.escritas[1].key];
  assert(itemManual, 'provider mantém o ID original do lançamento');
  assert.equal(itemManual.tutor, 'Tutor Beta');
  assert.equal(itemManual.vacina.conferido, false, 'metadata persisted false tem prioridade sobre o registro de origem');
  assert.equal(itemManual.vermifugo.conferido, false, 'fallback usa o valor explícito do registro de origem');
  assert.equal(itemManual.carrapaticida.conferido, true);
  assert.equal(itemManual.conferencia.experiencia, '');
  assert.equal(itemManual.conferencia.saude, '', 'não importa dado clínico do cadastro para o manual homônimo');
  assert.equal(itemManual.conferencia.quem, 'Gestora Fictícia');
  assert.equal(banco.escritas.length, 0, 'carregar o provider não grava');
  assert.equal(banco.leituras.filter(p => p === 'daycare/dashboard/' + DIA).length, 1);

  console.log('marcia-agendamento-qa130: OK');
}

executar().catch(erro => { console.error(erro); process.exitCode = 1; });
