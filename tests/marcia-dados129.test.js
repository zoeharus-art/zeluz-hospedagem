'use strict';

const assert = require('node:assert/strict');
const Dados = require('../auaulandia/marcia129/dados.js');
const Hospedes = require('../auaulandia/hospedes-atividades.js');

function snap(v) { return { val() { return v == null ? null : JSON.parse(JSON.stringify(v)); } }; }
class FakeDB {
  constructor(dados) {
    this.dados = Object.assign({}, dados || {});
    this.leituras = [];
    this.writes = [];
    this.listeners = {};
    this.off = [];
    this.falhasLeitura = new Set();
    this.falhasTransacao = new Set();
    this.antesTransacao = null;
  }
  ref(path) { return new FakeRef(this, path || ''); }
  emitir(path, valor) {
    this.dados[path] = valor;
    (this.listeners[path] || []).slice().forEach(x => x.ok(snap(valor)));
  }
  falhar(path, erro = new Error('falha sintética')) {
    (this.listeners[path] || []).slice().forEach(x => x.erro(erro));
  }
}
class FakeRef {
  constructor(db, path) { this.db = db; this.path = path; }
  once(tipo) {
    assert.equal(tipo, 'value');
    this.db.leituras.push(this.path);
    if (this.db.falhasLeitura.has(this.path)) return Promise.reject(new Error('falha sintética'));
    return Promise.resolve(snap(this.db.dados[this.path]));
  }
  on(tipo, ok, erro) {
    assert.equal(tipo, 'value');
    this.db.leituras.push(this.path);
    (this.db.listeners[this.path] || (this.db.listeners[this.path] = [])).push({ ok, erro });
  }
  off(tipo, ok) {
    assert.equal(tipo, 'value');
    this.db.off.push({ path: this.path, ok });
    this.db.listeners[this.path] = (this.db.listeners[this.path] || []).filter(x => x.ok !== ok);
  }
  transaction(fn) {
    this.db.writes.push({ tipo: 'transaction', path: this.path });
    if (typeof this.db.antesTransacao === 'function') this.db.antesTransacao(this.path);
    if (this.db.falhasTransacao.has(this.path)) return Promise.reject(new Error('regra negou'));
    const atual = this.db.dados[this.path] == null ? null : JSON.parse(JSON.stringify(this.db.dados[this.path]));
    const novo = fn(atual);
    if (novo === undefined) return Promise.resolve({ committed: false, snapshot: snap(atual) });
    this.db.dados[this.path] = JSON.parse(JSON.stringify(novo));
    return Promise.resolve({ committed: true, snapshot: snap(novo) });
  }
}

function norm(s) {
  return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, '-');
}
function dcKey(nome, tutor) { return norm(nome + '__' + tutor); }
function pelKey(p) { return ((p.n || '') + '__' + (p.tutor || '')).toLowerCase().replace(/[.#$\[\]\/]/g, '-'); }
function instante(dia, hora) { return dia + 'T' + hora + ':00-03:00'; }
function adiar() { return new Promise(resolve => setImmediate(resolve)); }

const DIA = '2026-10-23';
const PETS = [
  { n: 'Novato', raca: 'Spitz', tutor: 'Tutora Alfa', dias: ['sex'], extra: { matricula: '2026-10-01', adaptacao: 'Sim', adaptacao_desde: '2026-10-20', adaptacao_tipo: 'Day Care' } },
  { n: 'Fixo', raca: 'SRD', tutor: 'Tutor Beta', dias: ['sex'], extra: {} },
  { n: 'Reposição', raca: 'Poodle', tutor: 'Tutora Gama', dias: [], extra: {} },
  { n: 'Avulso', raca: 'Beagle', tutor: 'Tutor Delta', dias: [], extra: {} },
  { n: 'Hóspede', raca: 'Yorkshire', tutor: 'Tutora Épsilon', dias: [], extra: {} },
  { n: 'Luz', raca: 'SRD', tutor: 'Tutora Um', dias: [], extra: { vac_mult_p: '2027-01-01' } },
  { n: 'Luz', raca: 'SRD', tutor: 'Tutora Dois', dias: [], extra: { vac_mult_p: '2027-01-01' } }
];
const K = Object.fromEntries(PETS.map(p => [p.n + p.tutor, dcKey(p.n, p.tutor)]));

function fontesBase() {
  const dash = {
    avaliacao: {
      a1: { valor: 'Sem Cadastro / SRD', hora: '09:00' },
      a2: { valor: 'Luz / SRD', hora: '10:00' }
    },
    reposicao: {
      dupFixo: { valor: 'Novato / Spitz', dcKey: K['NovatoTutora Alfa'] },
      nova: { valor: 'Reposição / Poodle', dcKey: K['ReposiçãoTutora Gama'] }
    },
    avulso: {
      dupRepo: { valor: 'Reposição / Poodle', dcKey: K['ReposiçãoTutora Gama'] }
    }
  };
  const chamada = {};
  chamada[K['NovatoTutora Alfa']] = 'veio';
  chamada[K['FixoTutor Beta']] = 'veio';
  const checkins = {};
  checkins[K['NovatoTutora Alfa']] = { fim: instante(DIA, '08:00'), tipo: 'entrada' };
  const almoco = {};
  almoco[K['NovatoTutora Alfa']] = 'nao';
  almoco[K['ReposiçãoTutora Gama']] = 'metade';
  almoco[K['AvulsoTutor Delta']] = 'nao';
  almoco[K['HóspedeTutora Épsilon']] = 'metade';
  almoco['identidade-desconhecida'] = 'nao';
  const almoco2 = {};
  almoco2[K['AvulsoTutor Delta']] = 'nao';
  return {
    ['daycare/dashboard/' + DIA]: dash,
    ['daycare/chamada/' + DIA]: chamada,
    ['daycare/chamada-meta/' + DIA]: {},
    ['daycare/checkin-corpo/' + DIA]: checkins,
    ['daycare/checkout-corpo/' + DIA]: {},
    ['daycare/almoco/' + DIA]: almoco,
    ['daycare/atividade/' + DIA + '/almoco2']: almoco2,
    ['daycare/avisos-comida/' + DIA]: {},
    ['daycare/avulsos/' + DIA]: { oficial1: { nome: 'Avulso', tutor: 'Tutor Delta', raca: 'Beagle' } },
    ['daycare/turma/' + DIA]: { chaves: [K['NovatoTutora Alfa'], K['FixoTutor Beta'], K['ReposiçãoTutora Gama'], K['AvulsoTutor Delta']] },
    ['daycare/ocorrencias/' + DIA]: { o1: { pet: 'Fixo', tutor: 'Tutor Beta', refKey: K['FixoTutor Beta'], origem: 'check-in de entrada', itens: ['Pata a conferir'], status: 'aberta', ts: 1 } },
    ['daycare/tempo-atividade/' + DIA]: {
      livre: { inicio: '09:00', fim: '09:30', quemInicio: 'Zelosa A' },
      ea: { inicio: '10:00', quemInicio: 'Zelosa B' }
    },
    ['daycare/avaliacoes-gestao/' + DIA]: {},
    ['daycare/painel-tarefas/' + DIA]: {}
  };
}

const Presenca96 = {
  checkinValido(v) { return Boolean(v && v.fim && (!v.tipo || v.tipo === 'entrada')); },
  checkoutValido(v) { return Boolean(v && v.fim && (!v.tipo || v.tipo === 'saida')); },
  refeicaoPositiva(v) { return ['tudo', 'metade', 'nao'].includes(typeof v === 'object' ? v.estado : v); },
  resumoGestao(cmd) {
    if (cmd.dia === cmd.hoje && cmd.minutosAgora < 690) return { estado: 'aguardando-1130', revisao15: false, avisadas: [], trocasReposicoes: [], contatar: [] };
    const p = cmd.participantes[0] || { chave: 'desconhecido', pet: 'FILHOt a conferir', tutor: '' };
    return { estado: 'pronto', revisao15: cmd.dia === cmd.hoje && cmd.minutosAgora >= 900, avisadas: [], trocasReposicoes: [], contatar: [{ chave: p.chave, pet: p.pet, tutor: p.tutor, tipo: 'falta-sem-aviso' }] };
  }
};

function dependencias(db, op = {}) {
  let permitido = op.permitido !== undefined ? op.permitido : true;
  const deps = {
    db,
    autor: () => typeof op.autor === 'function' ? op.autor() : (op.semAutor ? null : { id: 'gestao-1', nome: 'Márcia Teste' }),
    pode: () => typeof op.pode === 'function' ? op.pode() : permitido,
    fontesCadastro: () => ({
      pronto: true, peludinhos: PETS, cadastro: {}, estadiasProntas: op.estadiasProntas !== false,
      estadias: {
        e1: { status: 'ativa', entrada: '2026-10-20', saida: '2026-10-25', nome: 'Novato', tutor: 'Tutora Alfa', raca: 'Spitz', refKey: pelKey(PETS[0]) },
        e2: { status: 'ativa', entrada: '2026-10-22', saida: '2026-10-24', nome: 'Hóspede', tutor: 'Tutora Épsilon', raca: 'Yorkshire', refKey: pelKey(PETS[4]) }
      },
      reposProntas: true, reposicoes: []
    }),
    helpers: {
      pelDias: p => p.dias || [], pelGet: (p, c) => p.extra && p.extra[c] != null ? p.extra[c] : p[c],
      pelExtra: p => p.extra || {}, dcKey, pelKey, pelInativo: p => p.inativo === true,
      ehMoradorZeluz: p => p.morador === true,
      diffMin: (a, b) => { const x = a.split(':').map(Number), y = b.split(':').map(Number); return y[0] * 60 + y[1] - x[0] * 60 - x[1]; }
    },
    ZeluzHospedesAtividades: Hospedes, Presenca96,
    agora: () => Date.parse((op.hora || DIA + 'T15:10:00-03:00'))
  };
  deps.mudarPermissao = v => { permitido = v; };
  return deps;
}

async function executar() {
  assert.equal(typeof Dados.criar, 'function');

  const db = new FakeDB(fontesBase());
  const deps = dependencias(db);
  const provider = Dados.criar(deps);
  const s = await provider.carregar(DIA);
  assert.equal(db.writes.length, 0, 'carregar/renderizar não grava');
  assert.equal(s.dia, DIA);
  assert.equal(s.agenda.estado, 'pronto');
  assert.equal(s.agenda.itens.length, 2, 'todas as avaliações aparecem');
  s.agenda.itens.forEach(a => {
    assert(a.codigoOrigem, 'avaliação mantém o id original sem fabricar identidade');
    assert.equal(a.conferencia.revisao, 0);
    assert.equal(a.tutor, '', 'associação ausente ou ambígua não adivinha tutor');
    ['vacina', 'vermifugo', 'carrapaticida'].forEach(c => {
      assert.deepEqual(a[c], { conferido: false }, c + ' obrigatório começa a conferir');
      assert.deepEqual(a.conferencia[c], { conferido: false });
    });
  });

  const canceladaDados = fontesBase(), reciboCancelada = {
    recebido: true, valorPagoCentavos: 8000, autorId: 'recepcao', autorNome: 'Recepção', ts: 10, quando: '23/10/2026 08:00'
  };
  const registroCancelado = {
    valor: 'Cancelada Única / SRD', hora: '11:00', planilha_ok: true,
    det: { agendaMarcia: true, avaliacao129: {
      versao: 133, agendaMarcia: true, estado: 'cancelada',
      tutor: 'Família Cancelada', vacina: { conferido: true }, vermifugo: { conferido: true }, carrapaticida: { conferido: true },
      pagamento: reciboCancelada,
      cancelamento: { ativo: true, motivo: 'Tutor pediu cancelamento', autorId: 'gestao-1', autorNome: 'Márcia Teste', ts: 20, quando: '23/10/2026 09:00' },
      revisao: 3, autorId: 'gestao-1', autorNome: 'Márcia Teste', ts: 20
    } }
  };
  canceladaDados['daycare/dashboard/' + DIA].avaliacao = { canceladaOriginal: registroCancelado };
  const canceladaAntes = JSON.parse(JSON.stringify(canceladaDados['daycare/dashboard/' + DIA].avaliacao));
  const canceladaDB = new FakeDB(canceladaDados), canceladaSnap = await Dados.criar(dependencias(canceladaDB)).carregar(DIA);
  assert.deepEqual(canceladaSnap.agenda.itens, [], 'avaliação cancelada não aparece na agenda ativa da Gestão');
  assert.equal(canceladaSnap.tarefas.itens.some(t => JSON.stringify(t).includes('Cancelada Única') || t.id.includes('canceladaOriginal')), false,
    'avaliação cancelada não gera item no to-do da Gestão');
  assert.deepEqual(canceladaDB.dados['daycare/dashboard/' + DIA].avaliacao, canceladaAntes,
    'leitura preserva o registro cancelado e seu recibo original no fixture');
  assert.deepEqual(canceladaDB.dados['daycare/dashboard/' + DIA].avaliacao.canceladaOriginal.det.avaliacao129.pagamento, reciboCancelada);
  assert.equal(canceladaDB.writes.length, 0, 'filtrar cancelada não grava nem remove o registro');

  const origemDados = fontesBase();
  origemDados['daycare/dashboard/' + DIA].avaliacao = {
    'mesmo-id': {
      valor: 'Luz / SRD', hora: '09:30', chave: K['LuzTutora Um'],
      det: {
        fora_do_cadastro: true,
        avaliacao129: {
          tutor: 'Tutora do agendamento',
          vacina: { conferido: true }, vermifugo: { conferido: true }, carrapaticida: { conferido: true },
          experiencia: 'Veio de outra creche', observacoes: 'Nota da consultora'
        }
      }
    }
  };
  origemDados['daycare/avaliacoes-gestao/' + DIA] = {
    'mesmo-id': { vacina: { conferido: false }, observacoes: 'Nota revisada pela gestão', revisao: 4 }
  };
  const origemPessoas = [
    { n: 'Luz', raca: 'SRD', tutor: 'Tutora Um', extra: { vac_mult_p: '2027-01-01', vac_gripe_p: '2027-01-01', vac_raiva_p: '2027-01-01', verm_p: '2027-01-01', ecto_p: '2027-01-01', problema: 'Não herdar da ficha' } },
    { n: 'Luz', raca: 'SRD', tutor: 'Tutora Dois', extra: { vac_mult_p: '2027-01-01', vac_gripe_p: '2027-01-01', vac_raiva_p: '2027-01-01', verm_p: '2027-01-01', ecto_p: '2027-01-01' } }
  ];
  const origemDeps = dependencias(new FakeDB(origemDados)), origemCadastro = origemDeps.fontesCadastro;
  origemDeps.fontesCadastro = dia => Object.assign({}, origemCadastro(dia), { peludinhos: origemPessoas });
  const origemSnap = await Dados.criar(origemDeps).carregar(DIA), origemItem = origemSnap.agenda.itens[0];
  assert.equal(origemItem.codigoOrigem, 'mesmo-id', 'metadata do agendamento usa exatamente o id original');
  assert.equal(origemItem.tutor, 'Tutora do agendamento', 'tutor ausente na gestão vem do registro original');
  assert.deepEqual(
    [origemItem.vacina.conferido, origemItem.vermifugo.conferido, origemItem.carrapaticida.conferido],
    [false, true, true],
    'false explícito da gestão prevalece e os demais checks permanecem da origem'
  );
  assert.equal(origemItem.conferencia.experiencia, 'Veio de outra creche');
  assert.equal(origemItem.conferencia.saude, '', 'fora do cadastro não associa nem com chave residual ou homônimos');
  assert.equal(origemItem.conferencia.observacoes, 'Nota revisada pela gestão');
  assert.equal(origemItem.conferencia.revisao, 4, 'fallback da origem não fabrica revisão da gestão');

  const registro131 = {
    valor: 'Agenda Nova / SRD', hora: '13:30', planilha_ok: false,
    edicao_pendente: { op_id: 'pendente-1', antes: { valor: 'Agenda / SRD', hora: '13:00' }, depois: { valor: 'Agenda Nova / SRD', hora: '13:30' } },
    det: {
      agendaMarcia: true, fora_do_cadastro: true,
      avaliacao129: {
        versao: 131, agendaMarcia: true, nome: 'Nome interno antigo', raca: 'Raça antiga', tutor: 'Família da agenda', hora: '12:00',
        vacina: { conferido: true }, vermifugo: { conferido: false }, carrapaticida: { conferido: true },
        experiencia: 'Origem 131', saude: '', observacoes: 'Nota 131',
        pagamento: { recebido: true, valorPagoCentavos: 8000, autorId: 'recepcao', autorNome: 'Recepção', ts: 10, historico: [] },
        revisao: 2, autorId: 'recepcao', autorNome: 'Recepção', ts: 10
      }
    }
  };
  const dados131 = fontesBase();
  dados131['daycare/dashboard/' + DIA].avaliacao = { nova131: registro131 };
  dados131['daycare/dashboard/' + DIA + '/avaliacao/nova131'] = registro131;
  dados131['daycare/avaliacoes-gestao/' + DIA] = {
    nova131: { tutor: 'Legado não autoritativo', vacina: { conferido: false }, observacoes: 'Legado', revisao: 20 }
  };
  const db131 = new FakeDB(dados131), provider131 = Dados.criar(dependencias(db131));
  const snap131 = await provider131.carregar(DIA), item131 = snap131.agenda.itens[0];
  assert.equal(item131.nome, 'Agenda Nova');
  assert.equal(item131.raca, 'SRD');
  assert.equal(item131.hora, '13:30', 'dashboard usa o resumo superior alterado pelo protocolo nativo');
  assert.equal(item131.agendaMarcia, true);
  assert.deepEqual(item131.pagamento, { recebido: true, valorCent: 8000, quem: 'Recepção', quando: item131.pagamento.quando });
  assert(item131.pagamento.quando, 'pagamento válido expõe data/hora comprovada');
  assert.equal(item131.tutor, 'Família da agenda', 'marker 131 torna o registro original autoritativo');
  assert.equal(item131.vacina.conferido, true);
  assert.equal(item131.conferencia.observacoes, 'Nota 131');
  assert.equal(item131.conferencia.revisao, 2, 'revisão 131 não vem da metadata legada');
  const metaLegadaAntes = JSON.parse(JSON.stringify(dados131['daycare/avaliacoes-gestao/' + DIA]));
  const ack131 = await provider131.salvarAvaliacao({
    dia: DIA, id: item131.id, expectedRevision: 2, tutor: 'Família conferida',
    vacina: { conferido: false }, vermifugo: { conferido: true }, carrapaticida: { conferido: false },
    experiencia: 'Revista', saude: 'Atenção', observacoes: 'Revisada pela Márcia'
  });
  assert.equal(db131.writes.at(-1).path, 'daycare/dashboard/' + DIA + '/avaliacao/nova131', 'conferência 131 usa o mesmo registro');
  const salvo131 = db131.dados['daycare/dashboard/' + DIA + '/avaliacao/nova131'];
  assert.equal(salvo131.valor, 'Agenda Nova / SRD');
  assert.equal(salvo131.hora, '13:30');
  assert.equal(salvo131.planilha_ok, false);
  assert.equal(salvo131.edicao_pendente.op_id, 'pendente-1', 'conferência não apaga pendência do espelho');
  assert.equal(salvo131.det.avaliacao129.pagamento.valorPagoCentavos, 8000, 'conferência preserva pagamento');
  assert.equal(salvo131.det.avaliacao129.revisao, 3);
  assert.equal(ack131.conferencia.revisao, 3);
  assert.deepEqual(db131.dados['daycare/avaliacoes-gestao/' + DIA], metaLegadaAntes, 'marker 131 não regrava metadata legada');

  const cas131Dados = fontesBase();
  cas131Dados['daycare/dashboard/' + DIA].avaliacao = { nova131: registro131 };
  cas131Dados['daycare/dashboard/' + DIA + '/avaliacao/nova131'] = JSON.parse(JSON.stringify(registro131));
  const cas131DB = new FakeDB(cas131Dados), cas131Provider = Dados.criar(dependencias(cas131DB));
  const cas131Snap = await cas131Provider.carregar(DIA), cas131Item = cas131Snap.agenda.itens[0];
  cas131DB.dados['daycare/dashboard/' + DIA + '/avaliacao/nova131'].hora = '14:10';
  await assert.rejects(cas131Provider.salvarAvaliacao({
    dia: DIA, id: cas131Item.id, expectedRevision: 2, tutor: 'Família conferida',
    vacina: { conferido: false }, vermifugo: { conferido: true }, carrapaticida: { conferido: false }
  }), /AVALIACAO_DESATUALIZADA/, 'mudança nativa no resumo participa do CAS da conferência');

  const pagamentoInvalidoDados = fontesBase(), pagamentoInvalido = JSON.parse(JSON.stringify(registro131));
  pagamentoInvalido.det.avaliacao129.pagamento = { recebido: true, valorPagoCentavos: '8000', autorId: 'recepcao', autorNome: 'Recepção', ts: 10 };
  pagamentoInvalidoDados['daycare/dashboard/' + DIA].avaliacao = { invalido131: pagamentoInvalido };
  const pagamentoInvalidoSnap = await Dados.criar(dependencias(new FakeDB(pagamentoInvalidoDados))).carregar(DIA);
  assert.deepEqual(
    pagamentoInvalidoSnap.agenda.itens[0].pagamento,
    { recebido: false, valorCent: 0, quem: '', quando: '' },
    'valor string ou recibo malformado jamais confirma pagamento'
  );

  const horasDados = fontesBase();
  horasDados['daycare/dashboard/' + DIA].avaliacao = {
    tarde: { valor: 'Tarde / SRD', hora: '15h' },
    invalida: { valor: 'Combinar / SRD', hora: 'a combinar' },
    hMM: { valor: 'Meia / SRD', hora: '10h30' },
    hhmm: { valor: 'Cedo / SRD', hora: '08:15' },
    manha: { valor: 'Manhã / SRD', hora: '9h' }
  };
  const horas = await Dados.criar(dependencias(new FakeDB(horasDados))).carregar(DIA);
  assert.deepEqual(
    horas.agenda.itens.map(x => x.hora),
    ['08:15', '9h', '10h30', '15h', 'a combinar'],
    'agenda ordena HH:mm, Hh e HhMM por minutos e deixa horário inválido ao final'
  );
  assert.equal(horas.agenda.itens.at(-1).hora, 'a combinar', 'texto original do horário não é reescrito');

  const prevDados = fontesBase();
  prevDados['daycare/dashboard/' + DIA].avaliacao = {
    completa: { valor: 'Completa / SRD', hora: '08:00' },
    vencida: { valor: 'Vencida / SRD', hora: '09:00' },
    incompleta: { valor: 'Incompleta / SRD', hora: '10:00' },
    explicita: { valor: 'Explícita / SRD', hora: '11:00' },
    invalida: { valor: 'Inválida / SRD', hora: '12:00' }
  };
  prevDados['daycare/avaliacoes-gestao/' + DIA] = {
    explicita: { vacina: { conferido: false }, vermifugo: { conferido: false }, carrapaticida: { conferido: false } },
    invalida: { vacina: { conferido: 'sim' }, vermifugo: { situacao: 'em-dia', dataISO: 'data-ruim' }, carrapaticida: null }
  };
  const prevPessoas = [
    { n: 'Completa', raca: 'SRD', tutor: 'Tutora C', dias: [], extra: { vac_mult_p: '2027-01-01', vac_gripe_p: '2027-02-01', vac_raiva_p: '2027-03-01', verm_p: '2027-04-01', ecto_p: '2027-05-01' } },
    { n: 'Vencida', raca: 'SRD', tutor: 'Tutora V', dias: [], extra: { vac_mult_p: '2026-01-01', vac_gripe_p: '2027-02-01', vac_raiva_p: '2027-03-01', verm_p: '2027-04-01', ecto_p: '2027-05-01' } },
    { n: 'Incompleta', raca: 'SRD', tutor: 'Tutora I', dias: [], extra: { vac_mult_p: '2027-01-01', ecto_p: '2027-05-01' } },
    { n: 'Explícita', raca: 'SRD', tutor: 'Tutora E', dias: [], extra: { vac_mult_p: '2027-01-01', vac_gripe_p: '2027-02-01', vac_raiva_p: '2027-03-01', verm_p: '2027-04-01', ecto_p: '2027-05-01' } },
    { n: 'Inválida', raca: 'SRD', tutor: 'Tutora X', dias: [], extra: { vac_mult_p: '2027-01-01', vac_gripe_p: '2027-02-01', vac_raiva_p: '2027-03-01', verm_p: '2027-04-01', ecto_p: '2027-05-01' } }
  ];
  const prevDeps = dependencias(new FakeDB(prevDados)), prevFonteOriginal = prevDeps.fontesCadastro;
  prevDeps.fontesCadastro = dia => Object.assign({}, prevFonteOriginal(dia), { peludinhos: prevPessoas });
  const prevSnap = await Dados.criar(prevDeps).carregar(DIA);
  const prevPorNome = Object.fromEntries(prevSnap.agenda.itens.map(x => [x.nome, x]));
  assert.deepEqual(
    [prevPorNome.Completa.vacina.conferido, prevPorNome.Completa.vermifugo.conferido, prevPorNome.Completa.carrapaticida.conferido],
    [true, true, true],
    'ficha com três vacinas e prevenções válidas pré-marca os checks sem expor datas'
  );
  assert.deepEqual(
    [prevPorNome.Vencida.vacina.conferido, prevPorNome.Vencida.vermifugo.conferido, prevPorNome.Vencida.carrapaticida.conferido],
    [false, true, true],
    'vencimento real não vira check positivo'
  );
  assert.deepEqual(
    [prevPorNome.Incompleta.vacina.conferido, prevPorNome.Incompleta.vermifugo.conferido, prevPorNome.Incompleta.carrapaticida.conferido],
    [false, false, true],
    'ficha incompleta mantém somente a prevenção comprovada'
  );
  assert.deepEqual(
    [prevPorNome['Explícita'].vacina.conferido, prevPorNome['Explícita'].vermifugo.conferido, prevPorNome['Explícita'].carrapaticida.conferido],
    [false, false, false],
    'false específico da avaliação prevalece sobre ficha válida'
  );
  assert.deepEqual(
    [prevPorNome['Inválida'].vacina.conferido, prevPorNome['Inválida'].vermifugo.conferido, prevPorNome['Inválida'].carrapaticida.conferido],
    [false, false, false],
    'fonte específica inválida não herda confirmação da ficha'
  );
  assert.equal(s.quantidades.matriculados, 2);
  assert.equal(s.quantidades.reposicoes, 1, 'reposição duplicada com matrícula não soma');
  assert.equal(s.quantidades.avulsos, 1, 'avulso duplicado com reposição não soma');
  assert.equal(s.quantidades.total, 4, 'total contém identidades únicas');
  assert.equal(s.quantidades.hospedes, 2, 'hóspedes ficam em contagem separada');
  assert.equal(s.quantidades.presentes, 4, 'refeição individual também comprova presença operacional');
  assert.equal(s.novatos.itens.length, 1);
  assert.equal(s.novatos.itens[0].situacao, 'Cliente novo');
  assert.match(s.novatos.itens[0].detalhe, /Adaptação ativa/, 'matrícula nova e adaptação continuam critérios distintos');
  assert.deepEqual(s.comida.itens.map(x => x.situacao).sort(), ['Aguardando', 'Comeu metade', 'Comeu metade', 'Não comeu'].sort());
  assert(s.comida.itens.some(x => /15h30/.test(x.detalhe)), 'primeiro não vira aviso definitivo antes do segundo horário');
  assert(s.comida.itens.every(x => x.grupo === 'daycare' || x.grupo === 'hospede'), 'toda linha conhecida tem grupo explícito');
  assert.equal(s.comida.itens.filter(x => x.grupo === 'daycare').length, 2);
  assert.equal(s.comida.itens.filter(x => x.grupo === 'hospede').length, 2);
  assert.equal(s.comida.itens.filter(x => x.nome === 'Novato').length, 1, 'matriculado com estadia ativa aparece uma vez, como hóspede');
  assert.equal(s.comida.itens.find(x => x.nome === 'Novato').grupo, 'hospede');
  assert.equal(s.comida.itens.find(x => x.nome === 'Hóspede').grupo, 'hospede', 'hóspede fora da turma mantém origem da estadia');
  assert(!s.comida.itens.some(x => x.chave === 'identidade-desconhecida'), 'identidade sem turma ou estadia não vira Day Care por padrão');
  assert.equal(s.tempos.itens.find(x => x.emCurso).minutos, null, 'atividade aberta não recebe zero minuto confirmado');
  assert.equal(s.tempos.itens.find(x => x.atividade === 'livre').minutos, 30);
  assert.equal(s.saude.itens.length, 1);
  assert.equal(s.saude.itens[0].situacao, 'Em aberto');
  assert(s.faltas.itens.every(x => /Revisão das 15h/.test(x.detalhe)), 'depois das 15h usa revisão canônica');

  const proibidos = [
    'daycare', 'daycare/dashboard', 'daycare/checkin-corpo', 'daycare/auditoria',
    'auaulandia/avisos-vet-fila', 'auaulandia/medicacao-agenda', 'auaulandia/relatorios'
  ];
  proibidos.forEach(p => assert(!db.leituras.includes(p), 'não consulta nó amplo: ' + p));
  assert(db.leituras.every(p => p.includes(DIA)), 'toda leitura é delimitada ao dia');

  const db1130 = new FakeDB(fontesBase());
  const p1130 = Dados.criar(dependencias(db1130, { hora: DIA + 'T11:20:00-03:00' }));
  const antes = await p1130.carregar(DIA);
  assert.equal(antes.faltas.itens.length, 1);
  assert.equal(antes.faltas.itens[0].situacao, 'Aguardando 11h30');
  assert(!antes.faltas.itens.some(x => x.situacao === 'Falta sem aviso'), 'antes de 11h30 não cria falta');

  const parcialDB = new FakeDB(fontesBase());
  parcialDB.falhasLeitura.add('daycare/ocorrencias/' + DIA);
  const parcial = await Dados.criar(dependencias(parcialDB)).carregar(DIA);
  assert.equal(parcial.saude.estado, 'falha');
  assert.equal(parcial.agenda.estado, 'pronto', 'falha parcial não derruba a agenda');
  assert.equal(parcial.quantidades.estado, 'pronto', 'falha parcial não derruba contagens');

  const semEstadia = await Dados.criar(dependencias(new FakeDB(fontesBase()), { estadiasProntas: false })).carregar(DIA);
  assert.equal(semEstadia.quantidades.estado, 'pronto', 'estadia indisponível não esconde contagens do Day Care');
  assert.equal(semEstadia.quantidades.matriculados, 2);
  assert.equal(semEstadia.quantidades.total, 4);
  assert.equal(semEstadia.quantidades.hospedes, null);
  assert.equal(semEstadia.quantidades.presentes, null, 'sem hospedagem confirmada não fecha presentes');

  const fantasmaDados = fontesBase();
  fantasmaDados['daycare/dashboard/' + DIA].reposicao.fantasma = { valor: 'Nome sem ficha / SRD' };
  const fantasma = await Dados.criar(dependencias(new FakeDB(fantasmaDados))).carregar(DIA);
  assert.equal(fantasma.quantidades.matriculados, 2, 'cadastro conhecido continua disponível');
  assert.equal(fantasma.quantidades.reposicoes, null, 'lançamento sem casamento não vira FILHOt');
  assert.equal(fantasma.quantidades.total, null, 'turma incompleta não afirma total');

  const histDados = fontesBase();
  delete histDados['daycare/turma/' + DIA];
  const hist = await Dados.criar(dependencias(new FakeDB(histDados), { hora: '2026-10-24T15:10:00-03:00' })).carregar(DIA);
  assert.equal(hist.faltas.estado, 'falha', 'histórico sem fotografia da turma não afirma falta');
  assert.equal(hist.quantidades.total, null, 'histórico sem fotografia não é reconstruído pela ficha atual');
  const histComFoto = await Dados.criar(dependencias(new FakeDB(fontesBase()), { hora: '2026-10-24T15:10:00-03:00' })).carregar(DIA);
  assert.equal(histComFoto.quantidades.total, 4, 'histórico usa somente a fotografia salva da turma');
  assert.equal(histComFoto.quantidades.matriculados, null, 'fotografia sem origem não inventa matriculados históricos');
  assert.equal(histComFoto.quantidades.avulsos, null, 'fotografia sem origem não inventa avulsos históricos');
  const futuro = await Dados.criar(dependencias(new FakeDB(fontesBase()), { hora: '2026-10-22T15:10:00-03:00' })).carregar(DIA);
  assert.equal(futuro.quantidades.presentes, null, 'futuro não afirma presença');
  assert.equal(futuro.faltas.itens.length, 0, 'futuro não afirma falta');

  const obsDB = new FakeDB(fontesBase());
  const obs = Dados.criar(dependencias(obsDB));
  const recebidos = [];
  obs.observar(DIA, x => recebidos.push(x));
  const callbackAntigo = obsDB.listeners['daycare/dashboard/' + DIA][0].ok;
  const outroDia = '2026-10-24';
  obs.observar(outroDia, x => recebidos.push(x));
  const antesStale = recebidos.length;
  callbackAntigo(snap({ avaliacao: { velha: { valor: 'Dado velho / SRD' } } }));
  assert.equal(recebidos.length, antesStale, 'callback do dia anterior é descartado');
  assert.equal(obsDB.off.length, 14, 'troca de data remove somente os callbacks próprios');
  obs.fechar();
  assert.equal(obsDB.off.length, 28, 'fechar limpa os callbacks do dia corrente');

  const recalcularDB = new FakeDB(fontesBase());
  const recalcularDeps = dependencias(recalcularDB);
  const fonteOriginal = recalcularDeps.fontesCadastro;
  let incluirNovoCache = false, diaRecebido = '';
  recalcularDeps.fontesCadastro = dia => {
    diaRecebido = dia;
    const fonte = fonteOriginal();
    fonte.peludinhos = incluirNovoCache ? fonte.peludinhos.concat([
      { n: 'Cache novo', raca: 'SRD', tutor: 'Tutora Cache', dias: ['sex'], extra: {} }
    ]) : fonte.peludinhos;
    return fonte;
  };
  const recalculador = Dados.criar(recalcularDeps), republicados = [];
  const pararRecalculo = recalculador.observar(DIA, x => republicados.push(x));
  Object.entries(fontesBase()).forEach(([path, conteudo]) => recalcularDB.emitir(path, conteudo));
  assert.equal(republicados.at(-1).quantidades.matriculados, 2);
  incluirNovoCache = true;
  const leiturasAntesRecalculo = recalcularDB.leituras.length;
  const escritasAntesRecalculo = recalcularDB.writes.length;
  const publicacoesAntesRecalculo = republicados.length;
  const recalculado = recalculador.recalcular();
  assert.equal(diaRecebido, DIA, 'fontesCadastro recebe o dia observado quando puder filtrá-lo');
  assert.equal(recalculado.quantidades.matriculados, 3, 'recalcular usa o cache cadastral atual');
  assert.equal(republicados.length, publicacoesAntesRecalculo + 1, 'recalcular republica a observação ativa');
  assert.equal(recalcularDB.leituras.length, leiturasAntesRecalculo, 'recalcular não abre leitura Firebase');
  assert.equal(recalcularDB.writes.length, escritasAntesRecalculo, 'recalcular não grava');
  recalcularDeps.mudarPermissao(false);
  const antesSemPermissao = republicados.length;
  assert.equal(recalculador.recalcular(), null, 'sem permissão não republica cache');
  assert.equal(republicados.length, antesSemPermissao);
  recalcularDeps.mudarPermissao(true);
  pararRecalculo();
  const antesDescartado = republicados.length;
  assert.equal(recalculador.recalcular(), null, 'observação encerrada não republica');
  assert.equal(republicados.length, antesDescartado);
  assert.equal(recalcularDB.leituras.length, leiturasAntesRecalculo);
  assert.equal(recalcularDB.writes.length, escritasAntesRecalculo);

  const tarefasDB = new FakeDB(fontesBase());
  const tarefasDeps = dependencias(tarefasDB);
  const tarefas = Dados.criar(tarefasDeps);
  const ts = await tarefas.carregar(DIA);
  const tarefa = ts.tarefas.itens.find(x => x.categoria === 'faltas');
  assert(tarefa, 'há tarefa derivada de falta sem aviso');
  assert(!tarefa.id.includes('Novato') && /^[a-z0-9_-]+$/.test(tarefa.id), 'chave determinística não leva nome');
  const gravada = await tarefas.salvarTarefa({ dia: DIA, id: tarefa.id, feito: true });
  assert.equal(gravada.feito, true);
  assert.equal(gravada.quem, 'Márcia Teste');
  const no = 'daycare/painel-tarefas/' + DIA + '/' + tarefa.id;
  assert.equal(tarefasDB.dados[no].versao, 129);
  assert.equal(tarefasDB.dados[no].revisao, 1);
  assert.equal(tarefasDB.dados[no].historico.length, 1);
  const desfeita = await tarefas.salvarTarefa({ dia: DIA, id: tarefa.id, feito: false });
  assert.equal(desfeita.feito, false, 'tarefa permite desfazer');
  assert.equal(tarefasDB.dados[no].revisao, 2);
  assert.equal(tarefasDB.dados[no].historico.length, 2);

  const casDB = new FakeDB(fontesBase());
  const cas = Dados.criar(dependencias(casDB));
  const casSnap = await cas.carregar(DIA);
  const casTarefa = casSnap.tarefas.itens.find(x => x.categoria === 'faltas');
  const casNo = 'daycare/painel-tarefas/' + DIA + '/' + casTarefa.id;
  casDB.dados[casNo] = { versao: 129, feito: true, autorId: 'outro', autorNome: 'Outra pessoa', ts: 1, revisao: 1, historico: [] };
  await assert.rejects(cas.salvarTarefa({ dia: DIA, id: casTarefa.id, feito: true }), /TAREFA_DESATUALIZADA/, 'CAS não sobrescreve estado concorrente');

  const abaDB = new FakeDB(fontesBase());
  const aba = Dados.criar(dependencias(abaDB));
  const abaSnap = await aba.carregar(DIA);
  const abaTarefa = abaSnap.tarefas.itens.find(x => x.categoria === 'faltas');
  const abaNo = 'daycare/painel-tarefas/' + DIA + '/' + abaTarefa.id;
  abaDB.dados[abaNo] = { versao: 129, feito: false, autorId: 'outro', autorNome: 'Outro aparelho', ts: 2, revisao: 2, historico: [] };
  await assert.rejects(
    aba.salvarTarefa({ dia: DIA, id: abaTarefa.id, feito: true }),
    /TAREFA_DESATUALIZADA/,
    'CAS detecta ABA pela revisão mesmo quando o estado voltou ao valor memorizado'
  );

  const avaliacaoDB = new FakeDB(fontesBase());
  const avaliacao = Dados.criar(dependencias(avaliacaoDB));
  const avaliacaoSnap = await avaliacao.carregar(DIA);
  const avaliacaoItem = avaliacaoSnap.agenda.itens.find(x => x.codigoOrigem === 'a1');
  const dashboardAntes = JSON.parse(JSON.stringify(avaliacaoDB.dados['daycare/dashboard/' + DIA]));
  const avaliacaoAck = await avaliacao.salvarAvaliacao({
    dia: DIA, id: avaliacaoItem.id, tutor: '  Tutora Conferida  ',
    vacina: { conferido: true, desconhecido: 'não persistir' },
    vermifugo: { conferido: false },
    carrapaticida: { conferido: true },
    experiencia: 'Primeiro dia em grupo', saude: 'Conferir sensibilidade informada',
    observacoes: 'Chegar dez minutos antes', expectedRevision: 0, campoDesconhecido: 'ignorar'
  });
  assert.equal(avaliacaoAck.codigoOrigem, 'a1');
  assert.equal(avaliacaoAck.agenda.nome, 'Sem Cadastro', 'nome original não é alterado pela conferência');
  assert.equal(avaliacaoAck.agenda.raca, 'SRD');
  assert.equal(avaliacaoAck.agenda.hora, '09:00');
  assert.equal(avaliacaoAck.agenda.tutor, 'Tutora Conferida');
  assert.deepEqual(avaliacaoAck.agenda.vacina, { conferido: true });
  assert.deepEqual(avaliacaoAck.agenda.vermifugo, { conferido: false });
  assert.deepEqual(avaliacaoAck.agenda.carrapaticida, { conferido: true });
  assert.equal(avaliacaoAck.conferencia.revisao, 1);
  assert.equal(avaliacaoAck.conferencia.quem, 'Márcia Teste');
  const avaliacaoNo = 'daycare/avaliacoes-gestao/' + DIA + '/a1';
  assert.equal(avaliacaoDB.dados[avaliacaoNo].versao, 129);
  assert.equal(avaliacaoDB.dados[avaliacaoNo].revisao, 1);
  assert.equal(avaliacaoDB.dados[avaliacaoNo].historico.length, 1);
  assert(!('campoDesconhecido' in avaliacaoDB.dados[avaliacaoNo]));
  assert(!('desconhecido' in avaliacaoDB.dados[avaliacaoNo].vacina));
  assert(!('dataISO' in avaliacaoDB.dados[avaliacaoNo].vacina), 'nova conferência não grava data');
  assert.deepEqual(avaliacaoDB.dados['daycare/dashboard/' + DIA], dashboardAntes, 'salvar conferência não altera o lançamento original');
  assert.equal(avaliacaoDB.writes.at(-1).path, avaliacaoNo, 'grava somente metadata pelo id original');

  const legadoDados = fontesBase();
  const legadoReg = {
    versao: 129, tutor: 'Tutora Legada', revisao: 3, autorId: 'antigo', autorNome: 'Registro antigo', ts: 1,
    vacina: { situacao: 'em-dia', dataISO: '2027-03-10' },
    vermifugo: { situacao: 'vencido', dataISO: '2026-01-10' },
    carrapaticida: { conferido: false, situacao: 'em-dia', dataISO: '2027-04-10' }
  };
  legadoDados['daycare/avaliacoes-gestao/' + DIA] = { a1: legadoReg };
  legadoDados['daycare/avaliacoes-gestao/' + DIA + '/a1'] = legadoReg;
  const legadoDB = new FakeDB(legadoDados), legado = Dados.criar(dependencias(legadoDB));
  const legadoSnap = await legado.carregar(DIA), legadoItem = legadoSnap.agenda.itens.find(x => x.codigoOrigem === 'a1');
  assert.equal(legadoItem.vacina.conferido, true, 'em-dia legado com data válida migra para check confirmado');
  assert.equal(legadoItem.vermifugo.conferido, false, 'vencido legado não declara conferência positiva');
  assert.equal(legadoItem.carrapaticida.conferido, false, 'booleano novo explícito prevalece sobre o legado');
  const legadoAck = await legado.salvarAvaliacao({
    dia: DIA, id: legadoItem.id, tutor: 'Tutora Legada', expectedRevision: 3,
    vacina: { conferido: false }, vermifugo: { conferido: false }, carrapaticida: { conferido: false }
  });
  assert.equal(legadoAck.agenda.vacina.conferido, false, 'novo false volta o check para a conferir');
  const legadoSalvo = legadoDB.dados['daycare/avaliacoes-gestao/' + DIA + '/a1'];
  assert.equal(legadoSalvo.vacina.dataISO, '2027-03-10', 'migração preserva a data real antiga');
  assert.equal(legadoSalvo.vacina.situacao, 'em-dia');
  assert.equal(legadoSalvo.vacina.conferido, false);

  const invalidasAntes = avaliacaoDB.writes.length;
  await assert.rejects(avaliacao.salvarAvaliacao({
    dia: DIA, id: avaliacaoItem.id, tutor: 'Tutora',
    vacina: { conferido: 'sim', dataISO: '2027-01-01' },
    vermifugo: { conferido: false }, carrapaticida: { conferido: false }
  }), /VACINA_INVALIDO/, 'checkbox aceita somente booleano e não usa data');
  await assert.rejects(avaliacao.salvarAvaliacao({
    dia: DIA, id: 'avaliacao-inexistente', tutor: 'Tutora',
    vacina: { conferido: false }, vermifugo: { conferido: false }, carrapaticida: { conferido: false }
  }), /AVALIACAO_DESATUALIZADA/, 'não cria metadata sem lançamento carregado');
  assert.equal(avaliacaoDB.writes.length, invalidasAntes, 'entrada inválida ou inexistente não inicia transação');

  const avaliacaoCasDB = new FakeDB(fontesBase());
  const avaliacaoCas = Dados.criar(dependencias(avaliacaoCasDB));
  const avaliacaoCasSnap = await avaliacaoCas.carregar(DIA);
  const avaliacaoCasItem = avaliacaoCasSnap.agenda.itens[0];
  const avaliacaoCasNo = 'daycare/avaliacoes-gestao/' + DIA + '/' + avaliacaoCasItem.codigoOrigem;
  avaliacaoCasDB.dados[avaliacaoCasNo] = { versao: 129, tutor: 'Outro', revisao: 1, autorId: 'outro', autorNome: 'Outro aparelho', ts: 1 };
  await assert.rejects(avaliacaoCas.salvarAvaliacao({
    dia: DIA, id: avaliacaoCasItem.id, tutor: 'Tutora', expectedRevision: 0,
    vacina: { conferido: false }, vermifugo: { conferido: false }, carrapaticida: { conferido: false }
  }), /AVALIACAO_DESATUALIZADA/, 'conferência usa CAS por revisão');

  const falhaDB = new FakeDB(fontesBase());
  const falha = Dados.criar(dependencias(falhaDB));
  const falhaSnap = await falha.carregar(DIA);
  const falhaTarefa = falhaSnap.tarefas.itens.find(x => x.categoria === 'faltas');
  falhaDB.falhasTransacao.add('daycare/painel-tarefas/' + DIA + '/' + falhaTarefa.id);
  await assert.rejects(falha.salvarTarefa({ dia: DIA, id: falhaTarefa.id, feito: true }), /regra negou/, 'falha de gravação não confirma check');

  const authDB = new FakeDB(fontesBase());
  let pode = true;
  const auth = Dados.criar(dependencias(authDB, { pode: () => pode }));
  const authSnap = await auth.carregar(DIA);
  const authTarefa = authSnap.tarefas.itens.find(x => x.categoria === 'faltas');
  pode = false;
  await assert.rejects(auth.salvarTarefa({ dia: DIA, id: authTarefa.id, feito: true }), /SEM_PERMISSAO/);
  assert.equal(authDB.writes.length, 0, 'sem permissão não inicia transação');

  const dentroDB = new FakeDB(fontesBase());
  let dentroPode = true;
  const dentro = Dados.criar(dependencias(dentroDB, { pode: () => dentroPode }));
  const dentroSnap = await dentro.carregar(DIA);
  const dentroTarefa = dentroSnap.tarefas.itens.find(x => x.categoria === 'faltas');
  dentroDB.antesTransacao = () => { dentroPode = false; };
  await assert.rejects(dentro.salvarTarefa({ dia: DIA, id: dentroTarefa.id, feito: true }), /SEM_PERMISSAO/, 'transação reconfere permissão internamente');

  const autoriaDB = new FakeDB(fontesBase());
  let autoriaAtual = { id: 'adriana', nome: 'Adriana' };
  const autoria = Dados.criar(dependencias(autoriaDB, { autor: () => autoriaAtual }));
  const autoriaSnap = await autoria.carregar(DIA);
  const autoriaTarefa = autoriaSnap.tarefas.itens.find(x => x.categoria === 'faltas');
  autoriaDB.antesTransacao = () => { autoriaAtual = { id: 'marcia', nome: 'Márcia' }; };
  await assert.rejects(autoria.salvarTarefa({ dia: DIA, id: autoriaTarefa.id, feito: true }), /AUTORIA_ALTERADA/, 'tarefa não troca a assinatura no retry');

  const autoriaAvaliacaoDB = new FakeDB(fontesBase());
  let autoriaAvaliacaoAtual = { id: 'adriana', nome: 'Adriana' };
  const autoriaAvaliacao = Dados.criar(dependencias(autoriaAvaliacaoDB, { autor: () => autoriaAvaliacaoAtual }));
  const autoriaAvaliacaoSnap = await autoriaAvaliacao.carregar(DIA);
  const autoriaAvaliacaoItem = autoriaAvaliacaoSnap.agenda.itens[0];
  autoriaAvaliacaoDB.antesTransacao = () => { autoriaAvaliacaoAtual = { id: 'marcia', nome: 'Márcia' }; };
  await assert.rejects(autoriaAvaliacao.salvarAvaliacao({
    dia: DIA, id: autoriaAvaliacaoItem.id, tutor: 'Tutora',
    vacina: { conferido: false }, vermifugo: { conferido: false }, carrapaticida: { conferido: false }
  }), /AUTORIA_ALTERADA/, 'conferência não troca a assinatura no retry');

  const dedupDB = new FakeDB(fontesBase());
  const dedup = Dados.criar(dependencias(dedupDB));
  const a = dedup.carregar(DIA), b = dedup.carregar(DIA);
  assert.equal(a, b, 'carga simultânea do mesmo dia é deduplicada');
  await Promise.all([a, b]);
  assert.equal(dedupDB.leituras.length, 14);

  await adiar();
  console.log('marcia-dados129: OK');
}

executar().catch(err => { console.error(err); process.exitCode = 1; });
