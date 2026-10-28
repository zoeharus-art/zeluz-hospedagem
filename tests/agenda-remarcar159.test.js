'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Agenda = require('../auaulandia/agenda-marcia/dados.js');

const DIA = '2026-10-26';
const PAI = 'daycare/dashboard/' + DIA + '/avaliacao';
const ROOT = path.resolve(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(ROOT, 'auaulandia/index.html'), 'utf8');

function clone(v) { return v == null ? v : JSON.parse(JSON.stringify(v)); }
function snap(v) { return { val() { return clone(v); } }; }

/* Firebase-shaped fake: transactions are real state transitions, but remain local. */
class FakeDB {
  constructor() { this.data = {}; this.listeners = new Map(); this.writes = []; this.removes = []; this.pushN = 0; }
  ref(p) { return new FakeRef(this, p || ''); }
  get(p) {
    let v = this.data;
    for (const part of p.split('/').filter(Boolean)) { if (v == null) return null; v = v[part]; }
    return v === undefined ? null : clone(v);
  }
  put(p, value) {
    const parts = p.split('/').filter(Boolean); let cur = this.data;
    for (const part of parts.slice(0, -1)) cur = cur[part] || (cur[part] = {});
    const key = parts.at(-1);
    if (value === null) { if (cur) delete cur[key]; }
    else cur[key] = clone(value);
    this.notify(p);
  }
  notify(p) {
    const parts = p.split('/').filter(Boolean);
    for (let n = 1; n <= parts.length; n++) {
      const parent = parts.slice(0, n).join('/');
      const listeners = this.listeners.get(parent) || [];
      const value = this.get(parent);
      listeners.slice().forEach(fn => fn(snap(value)));
    }
  }
}
class FakeRef {
  constructor(db, p) { this.db = db; this.path = p; }
  push() { this.db.pushN += 1; return { key: 'qa133-' + this.db.pushN }; }
  orderByKey(){return new FakeRef(this.db,this.path);}
  limitToFirst(n){this.limit=n;return this;}
  on(event,ok){assert.equal(event,'value');const wrapped=s=>{let value=s.val();if(this.limit&&value){value=Object.fromEntries(Object.entries(value).sort().slice(0,this.limit));}ok(snap(value));};this.wrappers=this.wrappers||new Map();this.wrappers.set(ok,wrapped);const a=this.db.listeners.get(this.path)||[];a.push(wrapped);this.db.listeners.set(this.path,a);wrapped(snap(this.db.get(this.path)));return ok;}
  off(event, ok) { assert.equal(event, 'value'); this.db.listeners.set(this.path, (this.db.listeners.get(this.path) || []).filter(x => x !== (this.wrappers&&this.wrappers.get(ok)||ok))); }
  once(event) { assert.equal(event, 'value'); return Promise.resolve(snap(this.db.get(this.path))); }
  transaction(fn) {
    this.db.writes.push({ op: 'transaction', path: this.path });
    const before = this.db.get(this.path), next = fn(clone(before));
    if (next === undefined) return Promise.resolve({ committed: false, snapshot: snap(before) });
    this.db.put(this.path, next);
    return Promise.resolve({ committed: true, snapshot: snap(next) });
  }
  update(patch) {
    const value = this.db.get(this.path) || {};
    Object.keys(patch).forEach(k => patch[k] === null ? delete value[k] : value[k] = clone(patch[k]));
    this.db.put(this.path, value); return Promise.resolve();
  }
  set(value) { this.db.put(this.path, value); return Promise.resolve(); }
  remove() { this.db.removes.push(this.path); this.db.put(this.path, null); return Promise.resolve(); }
}

function extractTopLevel(name) {
  const marker = '  function ' + name + '(';
  const start = indexHtml.indexOf(marker);
  assert.notEqual(start, -1, 'função nativa encontrada: ' + name);
  const end = indexHtml.indexOf('\n  function ', start + marker.length);
  assert.notEqual(end, -1, 'fim da função nativa encontrado: ' + name);
  return indexHtml.slice(start, end).trim();
}

function createNative(db, transport) {
  const env = {
    DB: db,
    DASH_ITENS: [{ k: 'avaliacao', t: 'Avaliação', col: 'Avaliação', colHora: 'Horário' }],
    DASH_DADOS: {}, DASH_PONTE: { url: 'https://ponte.invalid', token: 'synthetic' },
    DASH_FILA_SEMCOL: false,
    dashNo: () => 'daycare/dashboard/' + DIA,
    dashDia: () => DIA,
    dashPonteChamar: payload => transport(clone(payload)),
    usuarioAtual: () => ({ monId: 'recepcao-1', pessoa: 'Consultora QA' }),
    dashPodeTirar: () => true,
    papelDoCorpo: () => 'recepcao',
    telaVemDoPapel: (tela, papel) => tela === 'agendamarcia' && papel === 'recepcao',
    paginaConcedida: () => false,
    dashAtualizarCard: () => {}, renderDash: () => {}, audit: () => {},
    _logFalhaGrav: () => {}, jsNorm: x => String(x || '').trim().toLocaleLowerCase('pt-BR'),
    ZeluzAgendaMarcia: Agenda
  };
  env.globalThis = env;
  vm.createContext(env);
  [
    'dashItem', 'dashVaiParaPlanilha', 'dashAgendaMarciaRegistro133',
    'dashAgendaMarciaPublicavel133', 'dashAgendaMarciaFiltrar133',
    'dashAgendaMarciaProjecao133', 'dashAgendaMarciaAtor133',
    'dashAgendaMarciaPode133', 'dashAgendaMarciaProjetar133',
    'dashLimparFantasmas', 'dashMesmoTextoEmOutro', 'dashEspelhar',
    'dashPlanFilaPendentes', 'dashPlanFilaMorto', 'dashPlanFilaErroDeConfig',
    'dashPlanFilaReenviar', 'dashReenviar', 'dashCalCarregarMarcas'
  ].forEach(name => vm.runInContext(extractTopLevel(name), env, { filename: 'index.html:' + name }));
  return env;
}

function fields(payment) {
  return {
    nome: 'Luna', raca: 'SRD', tutor: 'Tutor Luna', telefone: '(00) 90000-0000', hora: '09:30',
    vacina: { conferido: true }, vermifugo: { conferido: false }, carrapaticida: { conferido: true },
    experiencia: 'Primeira visita', saude: '', observacoes: '', pagamento: payment || { recebido: false, valorCent: 0 }
  };
}
function makeApi(db, native) {
  return Agenda.criar({
    db, pode: () => true, autor: () => ({ id: 'recepcao-1', nome: 'Consultora QA' }),
    agora: () => Date.parse('2026-10-25T12:00:00-03:00'),
    aoSalvar(ctx) {
      if (ctx.acaoProjecao === 'nenhuma') return { ok: true };
      return native.dashAgendaMarciaProjetar133(ctx.dia, ctx.id, ctx.registro, false);
    }
  });
}
function createCmd(id, payment) {
  return { acao: 'criar', dia: DIA, requestId: id, avaliacao: fields(payment) };
}
function node(db, id) { return db.get(PAI + '/' + id); }
function summarizePayments(r) {
  const a = r.det.avaliacao129, p = a.pagamento || {};
  return { recebido: p.recebido, valorPagoCentavos: p.valorPagoCentavos, autorId: p.autorId, autorNome: p.autorNome, ts: p.ts, historico: p.historico };
}
function deferred() {
  let resolve;
  const promise = new Promise(r => { resolve = r; });
  return { promise, resolve };
}
async function until(test, message) {
  for (let i = 0; i < 80; i += 1) { if (test()) return; await new Promise(r => setTimeout(r, 1)); }
  assert.fail(message);
}

const Painel=require('../auaulandia/agenda-marcia/painel.js');
const AMANHA='2026-10-27';
function move(x,extra={}){return Object.assign({acao:'remarcar',dia:DIA,id:x.id,expectedRevision:x.revisao,expectedFingerprint:x.item.fingerprint,requestId:'remarca-unica',novoDia:AMANHA,novaHora:'14:45'},extra);}
function resume(x){return {acao:'retomar_remarcacao',dia:DIA,id:x.id,expectedRevision:x.revisao,expectedFingerprint:x.item.fingerprint};}
function dest(db,r){return db.get('daycare/dashboard/'+r.destino.dia+'/avaliacao/'+r.destino.id);}
function capture(api,db,id){let item;const off=api.observar(DIA,s=>{item=(s.itens||[]).find(x=>x.id===id)||item;});off();return {id,revisao:item.revisao,item};}
async function fixture(paid=true){const db=new FakeDB(),posts=[];let failRemove=false,failLaunch=false;const native=createNative(db,p=>{posts.push(p);return Promise.resolve({ok:!(p.acao==='remover'&&failRemove||p.acao==='lancar'&&failLaunch),linha:12});});const api=makeApi(db,native),created=await api.salvar(createCmd('nova',{recebido:paid,valorCent:paid?8000:0}));return {db,posts,native,api,created,setRemove(v){failRemove=v},setLaunch(v){failLaunch=v}};}
async function run(){
  const f=await fixture(),before=node(f.db,f.created.id),receipt=clone(before.det.avaliacao129.pagamento);
  const meses=[];f.api.observarMes('2026-10',s=>meses.push(s));
  f.native.DASH_DADOS.avaliacao={[f.created.id]:clone(before)};
  const r=await f.api.salvar(move(f.created));
  assert.equal(f.native.DASH_DADOS.avaliacao[f.created.id],undefined,'cache do dia antigo perde origem após retirada');
  f.native.dashCalMesDoDia=()=>DIA.slice(0,7);f.native.dashCalRender=()=>{};
  f.native.dashCalCarregarMarcas();await new Promise(r=>setImmediate(r));assert.equal(f.native.DASH_CAL_TEM[DIA],undefined,'calendário de Lançamentos exclui somente origem remarcada');assert.equal(f.native.DASH_CAL_TEM[AMANHA],true);
  f.db.put('daycare/dashboard/'+DIA+'/outro/quadro',{valor:'Outra atividade sintética'});f.native.dashCalCarregarMarcas();await new Promise(r=>setImmediate(r));assert.equal(f.native.DASH_CAL_TEM[DIA],true,'outras categorias mantêm marca no dia antigo');
  assert.equal(r.concluida,true);assert.equal(r.espelhoOk,true);
  assert.deepEqual(f.posts.map(x=>[x.acao,x.dia]),[['lancar',DIA],['remover',DIA],['lancar',AMANHA]]);
  const source=node(f.db,r.id),target=dest(f.db,r);
  assert.equal(source.det.avaliacao129.estado,'remarcada');assert.equal(Agenda.publicavel(source),false);assert.equal(f.native.dashAgendaMarciaPublicavel133(source),false);
  assert.equal(Agenda.publicavel(target),true);assert.equal(target.hora,'14:45');
  assert.deepEqual(target.det.avaliacao129.pagamento,receipt);assert.deepEqual(source.det.avaliacao129.pagamento,receipt);
  for(const k of ['vacina','vermifugo','carrapaticida','tutor','telefone','experiencia','saude','observacoes'])assert.deepEqual(target.det.avaliacao129[k],before.det.avaliacao129[k]);
  assert.deepEqual(target.det.avaliacao129.historico.slice(0,-1),before.det.avaliacao129.historico);
  assert.equal(target.det.avaliacao129.historico.at(-1).acao,'remarcar');
  assert.equal(meses.at(-1).dias[DIA],false);assert.equal(meses.at(-1).dias[AMANHA],true);
  f.db.put(PAI+'/zz-outro',before);assert.equal(meses.at(-1).dias[DIA],true,'origem primeiro ID não esconde outra avaliação');
  f.db.put(PAI+'/zz-outro',null);assert.equal(meses.at(-1).dias[DIA],false);
  const beforeRetryPosts=f.posts.length;const repeat=await f.api.salvar(move(f.created));assert.deepEqual(repeat.destino,r.destino);assert.equal(f.posts.length,beforeRetryPosts,'retry não envia de novo');
  for(const acao of ['reativar','editar','cancelar'])await assert.rejects(f.api.salvar({acao,dia:DIA,id:r.id,expectedRevision:r.revisao,expectedFingerprint:r.item.fingerprint,avaliacao:fields({recebido:true,valorCent:8000})}),/AGENDAMENTO_REMARCADO/);
  assert.equal(Object.keys(f.db.get('daycare/dashboard/'+AMANHA+'/avaliacao')).length,1);
  const gate=f.native.dashAgendaMarciaFiltrar133('avaliacao',{[r.id]:source});assert.equal(Object.keys(gate).length,0);
  const unpaid=await fixture(false),u=await unpaid.api.salvar(move(unpaid.created));assert.equal(u.concluida,true);assert.equal(unpaid.posts.length,0);assert.equal(dest(unpaid.db,u).det.avaliacao129.pagamento.recebido,false);
  const fail=await fixture();fail.setRemove(true);const stopped=await fail.api.salvar(move(fail.created));assert.equal(stopped.concluida,false);assert.equal(fail.db.get('daycare/dashboard/'+AMANHA+'/avaliacao'),null,'falha remover nunca cria destino');
  assert.equal(node(fail.db,stopped.id).det.avaliacao129.remarcacao159.estado,'pendente');
  const pendingMonth=[];fail.api.observarMes('2026-10',s=>pendingMonth.push(s));assert.equal(pendingMonth.at(-1).dias[DIA],true,'origem pendente conserva marcador para recuperação');
  fail.setRemove(false);const resumed=await makeApi(fail.db,fail.native).salvar(resume(capture(fail.api,fail.db,stopped.id)));assert.equal(resumed.concluida,true);assert.equal(pendingMonth.at(-1).dias[DIA],false,'concluída deixa somente marcador do destino');assert.equal(resumed.destino.id,'am159-remarca-unica');
  const interrupted=await fixture();const origRef=interrupted.db.ref.bind(interrupted.db);let failDest=true;
  interrupted.db.ref=p=>{const ref=origRef(p);if(p.includes(AMANHA)&&p.endsWith('am159-remarca-unica')&&failDest){ref.transaction=()=>Promise.reject(Error('queda sintética antes do destino'));}return ref;};
  await assert.rejects(interrupted.api.salvar(move(interrupted.created)),/queda sintética/);assert.equal(interrupted.db.get('daycare/dashboard/'+AMANHA+'/avaliacao'),null);
  failDest=false;const recovered=await interrupted.api.salvar(resume(capture(interrupted.api,interrupted.db,interrupted.created.id)));assert.equal(recovered.concluida,true);assert.equal(interrupted.posts.filter(x=>x.acao==='remover').length,1,'retomada não repete remoção confirmada');
  const collision=await fixture(),busy={valor:'Reserva sintética preservada'};collision.db.put('daycare/dashboard/'+AMANHA+'/avaliacao/am159-remarca-unica',busy);
  await assert.rejects(collision.api.salvar(move(collision.created)),/DESTINO_OCUPADO/);assert.deepEqual(collision.db.get('daycare/dashboard/'+AMANHA+'/avaliacao/am159-remarca-unica'),busy);
  assert.equal(node(collision.db,collision.created.id).det.avaliacao129.remarcacao159.estado,'pendente');
  const concurrent=await fixture(),second=makeApi(concurrent.db,concurrent.native);
  const both=await Promise.all([concurrent.api.salvar(move(concurrent.created)),second.salvar(move(concurrent.created))]);
  assert(both.some(x=>x.concluida));assert.equal(Object.keys(concurrent.db.get('daycare/dashboard/'+AMANHA+'/avaliacao')).length,1);assert.equal(concurrent.posts.filter(x=>x.acao==='lancar'&&x.dia===AMANHA).length,1);
  const locked=await fixture();let lockReg=node(locked.db,locked.created.id);lockReg.lockTs=Date.now();locked.db.put(PAI+'/'+locked.created.id,lockReg);
  await assert.rejects(locked.api.salvar(move(locked.created)),/PROJECAO_PENDENTE/);assert.equal(locked.db.get('daycare/dashboard/'+AMANHA+'/avaliacao'),null);
  const stale=await fixture();let staleReg=node(stale.db,stale.created.id);staleReg.valor='Mudança concorrente / SRD';stale.db.put(PAI+'/'+stale.created.id,staleReg);await assert.rejects(stale.api.salvar(move(stale.created)),/AGENDAMENTO_DESATUALIZADO/);
  const slow=await fixture(),ackSlow=deferred(),nativeProject=slow.native.dashAgendaMarciaProjetar133;let held=false;
  slow.native.dashAgendaMarciaProjetar133=(d,id,reg,c)=>{if(reg.det.avaliacao129.projecao.acao==='remover'&&!held){held=true;return ackSlow.promise;}return nativeProject(d,id,reg,c);};
  const moving=slow.api.salvar(move(slow.created));await until(()=>held,'remover aguardando retorno');
  let changed=node(slow.db,slow.created.id);changed.det.avaliacao129.projecao.opId='operacao-concorrente';slow.db.put(PAI+'/'+slow.created.id,changed);ackSlow.resolve({ok:true});const late=await moving;
  assert.equal(late.concluida,false,'ACK antigo não confirma operação nova');assert.equal(slow.db.get('daycare/dashboard/'+AMANHA+'/avaliacao'),null);
  const destFail=await fixture();destFail.setLaunch(true);const incompleteTv=await destFail.api.salvar(move(destFail.created));assert.equal(incompleteTv.concluida,true);assert.equal(incompleteTv.espelhoOk,false);assert.equal(dest(destFail.db,incompleteTv).det.avaliacao129.projecao.estado,'pendente');
  const blank=await fixture();await assert.rejects(blank.api.salvar(move(blank.created,{novaHora:''})),/HORA_INVALID[AO]/);assert.equal(node(blank.db,blank.created.id).det.avaliacao129.remarcacao159,undefined);
  const html=Painel.desenhar(Painel.normalizar({dia:DIA,estado:'pronto',itens:[r.item]},DIA),{pendentes:{},erros:{}});
  assert(html.includes('Remarcadas (1)'));assert(!html.includes('data-am-reativar'));assert(!html.includes('data-am-remarcar='));assert(html.includes('Abrir novo dia'));
  const pendingHtml=Painel.desenhar(Painel.normalizar({dia:DIA,estado:'pronto',itens:[stopped.item]},DIA),{pendentes:{},erros:{}});assert(pendingHtml.includes('Concluir remarcação'));
  const activeHtml=Painel.desenhar(Painel.normalizar({dia:DIA,estado:'pronto',itens:[f.created.item]},DIA),{pendentes:{},erros:{}});assert(activeHtml.includes('Nova data'));assert(activeHtml.includes('Novo horário'));assert(activeHtml.includes('data-am-remarcar-hora="'+f.created.id+'" value=""'),'horário nunca presumido');
  for(const fx of [f,unpaid,fail,interrupted,collision,concurrent,locked,stale,slow,destFail,blank])fx.api.fechar();second.fechar();
  console.log('agenda-remarcar159: OK (pagamento, cuidados, remoção antes do destino, retry, conflito, lease, ACK tardio, mês e interface)');
}
run().catch(e=>{console.error(e);process.exitCode=1});
