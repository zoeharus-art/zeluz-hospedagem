'use strict';
const assert=require('node:assert/strict');
const Dados=require('../auaulandia/marcia129/dados.js');
const Hospedes=require('../auaulandia/hospedes-atividades.js');
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


function copy(x){return x==null?x:JSON.parse(JSON.stringify(x));}
function fonteDia(dia){const base=fontesBase();return Object.fromEntries(Object.entries(base).map(([k,v])=>[k.replaceAll(DIA,dia),v]));}
function registro({remarcada=false,destino=false}={}){const a={versao:133,agendaMarcia:true,estado:remarcada?'remarcada':'confirmada',tutor:'Tutora de teste',vacina:{conferido:true},vermifugo:{conferido:false},carrapaticida:{conferido:true},experiencia:'Cuidado preservado',observacoes:'Nota preservada',pagamento:{recebido:true,valorPagoCentavos:8000,autorId:'recepcao',autorNome:'Recepção',ts:1792930800000,quando:'23/10/2026 09:00'},revisao:3,autorId:'recepcao',autorNome:'Recepção',ts:10,quando:'23/10/2026 09:00'};if(remarcada)a.remarcacao159={requestId:'move-1',estado:'pendente',origem:{dia:DIA,id:'registro',hora:'09:30'},destino:{dia:'2026-10-24',id:'destino',hora:'14:45'}};if(destino)a.origem159={dia:DIA,id:'registro',requestId:'move-1'};return {valor:'Luz / SRD',hora:destino?'14:45':'09:30',planilha_ok:true,det:{agendaMarcia:true,avaliacao129:a}};}
async function main(){
 const oldData=fonteDia(DIA);oldData['daycare/dashboard/'+DIA].avaliacao={registro:registro({remarcada:true})};const oldDb=new FakeDB(oldData),oldProvider=Dados.criar(dependencias(oldDb));const old=await oldProvider.carregar(DIA);assert.equal(old.agenda.estado,'pronto');assert.equal(old.agenda.itens.length,0,'origem remarcada não reaparece no Dashboard Márcia antigo');
 const newDay='2026-10-24',newData=fonteDia(newDay);newData['daycare/dashboard/'+newDay].avaliacao={destino:registro({destino:true})};const newDb=new FakeDB(newData),newProvider=Dados.criar(dependencias(newDb));const next=await newProvider.carregar(newDay);assert.equal(next.agenda.itens.length,1,'destino segue visível no novo dia');assert.equal(next.agenda.itens[0].agendaMarcia,true);assert.equal(next.agenda.itens[0].tutor,'Tutora de teste');assert.deepEqual(next.agenda.itens[0].vacina,{conferido:true});assert.deepEqual(next.agenda.itens[0].pagamento,{recebido:true,valorCent:8000,quem:'Recepção',quando:'23/10/2026 09:00'});assert.deepEqual(newDb.dados['daycare/dashboard/'+newDay].avaliacao.destino.det.avaliacao129.pagamento,registro({destino:true}).det.avaliacao129.pagamento,'ler o destino não altera o recibo persistido');
 const liveData=fonteDia(DIA);const active=registro();delete active.det.avaliacao129.estado;liveData['daycare/dashboard/'+DIA].avaliacao={registro:active};const liveDb=new FakeDB(liveData),liveProvider=Dados.criar(dependencias(liveDb));const cached=await liveProvider.carregar(DIA);const originItem=cached.agenda.itens.find(x=>x.codigoOrigem==='registro');assert(originItem);let latest;const off=liveProvider.observar(DIA,x=>{latest=x});for(const [path,value] of Object.entries(liveDb.dados))liveDb.emitir(path,value);const moved=copy(liveDb.dados['daycare/dashboard/'+DIA]);moved.avaliacao.registro.det.avaliacao129=Object.assign({},moved.avaliacao.registro.det.avaliacao129,{estado:'remarcada',remarcacao159:{requestId:'move-1',estado:'pendente',origem:{dia:DIA,id:'registro'},destino:{dia:newDay,id:'destino'}}});liveDb.emitir('daycare/dashboard/'+DIA,moved);assert.equal(latest.agenda.itens.length,0,'callback ativo remove a origem remarcada do snapshot sem recarregar a página');
 const writerData=fonteDia(DIA),writer=registro();writer.det.avaliacao129.estado='confirmada';writerData['daycare/dashboard/'+DIA].avaliacao={registro:writer};const writerDb=new FakeDB(writerData),writerProvider=Dados.criar(dependencias(writerDb));const before=await writerProvider.carregar(DIA),beforeItem=before.agenda.itens[0];const now=copy(writerDb.dados['daycare/dashboard/'+DIA]);now.avaliacao.registro.det.avaliacao129.estado='remarcada';now.avaliacao.registro.det.avaliacao129.remarcacao159={requestId:'move-1',estado:'pendente',origem:{dia:DIA,id:'registro'},destino:{dia:newDay,id:'destino'}};writerDb.dados['daycare/dashboard/'+DIA]=now;await assert.rejects(writerProvider.salvarAvaliacao({dia:DIA,id:beforeItem.id,tutor:'Tutora atualizada',vacina:{conferido:false},vermifugo:{conferido:false},carrapaticida:{conferido:false},expectedRevision:beforeItem.conferencia.revisao}),/AVALIACAO_DESATUALIZADA|REMARCADA/,'formulário antigo não grava sobre origem já remarcada');assert.deepEqual(writerDb.dados['daycare/dashboard/'+DIA],now,'bloqueio stale não mexe na origem nem no pagamento');
 off();oldProvider.fechar&&oldProvider.fechar();newProvider.fechar&&newProvider.fechar();liveProvider.fechar&&liveProvider.fechar();writerProvider.fechar&&writerProvider.fechar();console.log('marcia-remarcar159: OK');}
main().catch(e=>{console.error(e);process.exitCode=1});

