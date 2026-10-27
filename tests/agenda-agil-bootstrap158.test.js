'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const day='2026-10-30',base='daycare/agenda-marcia/entrevistas',clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
function check(v){if(v===undefined)throw Error('undefined em transação');if(v&&typeof v==='object')Object.values(v).forEach(check)}
class FakeDB{
 constructor(){this.onCount=0;this.offCount=0;this.tree={};this.listeners=[];this.writes=[];this.queries=[];this.projecoes=0}
 get(p){let v=this.tree;for(const k of p.split('/')){if(!v||typeof v!=='object')return null;v=v[k]}return v===undefined?null:clone(v)}
 put(p,v){let parts=p.split('/'),o=this.tree;for(const k of parts.slice(0,-1))o=o[k]||={};o[parts.at(-1)]=clone(v);this.listeners.slice().forEach(l=>{if(p===l.path||p.startsWith(l.path+'/'))l.emit()})}
 ref(p){const db=this,q={path:p,lo:null,hi:null,max:null,orderByKey(){return this},startAt(v){this.lo=v;return this},endAt(v){this.hi=v;return this},limitToFirst(v){this.max=v;return this},push(){return{key:'avaliacao-ficticia'}},on(event,ok,err){db.onCount++;assert.equal(event,'value');if(p===base)db.queries.push({path:p,lo:this.lo,hi:this.hi,max:this.max});const entry={path:p,ok,emit:()=>{let value=db.get(p);if(this.lo&&value&&typeof value==='object')value=Object.fromEntries(Object.entries(value).filter(([k])=>k>=this.lo&&k<=this.hi).slice(0,this.max));else if(this.max&&value&&typeof value==='object')value=Object.fromEntries(Object.entries(value).slice(0,this.max));ok({val:()=>clone(value)})}};db.listeners.push(entry);entry.emit()},off(event,ok){db.offCount++;db.listeners=db.listeners.filter(x=>x.path!==p||x.ok!==ok)},transaction(fn){const old=db.get(p),next=fn(clone(old));if(next===undefined)return Promise.resolve({committed:false,snapshot:{val:()=>old}});check(next);db.writes.push(p);db.put(p,next);return Promise.resolve({committed:true,snapshot:{val:()=>clone(next)}})}};return q}
}
const db=new FakeDB(), handlers={};
const root={innerHTML:'',textContent:'',handlers,addEventListener(k,f){handlers[k]=f},removeEventListener(k){delete handlers[k]},contains(){return true},ownerDocument:{}};
const doc={body:{},getElementById(id){if(id==='agendaMarciaRoot')return root;if(id==='v-agendamarcia')return {classList:{contains:()=>false}};return null}};
const ctx={crypto:require('node:crypto').webcrypto,document:doc,DB:db,entrevistas155Pode:()=>true,usuarioAtual:()=>({id:'equipe-ficticia',nome:'Equipe'}),papelDoCorpo:()=> 'gestao',telaVemDoPapel:(pagina)=>pagina==='agendamarcia',paginaConcedida:()=>false,PELUDINHOS:[],RACAS:[],RACAS_CADASTRO:[],ZeluzMarcia129:{dataSP:()=>day},dashAgendaMarciaProjetar133(){db.projecoes++;return Promise.resolve({ok:true})}};
ctx.window=ctx;vm.createContext(ctx);
for(const file of ['dados.js','entrevistas.js','composta.js','painel.js','app.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../auaulandia/agenda-marcia',file),'utf8'),ctx,{filename:file});
function form(values){return {closest(){return this},getAttribute(){return 'novo'},querySelector(sel){const m=sel.match(/name="(.+)"/),k=m&&m[1];return k&&Object.hasOwn(values,k)?{value:values[k],checked:values[k]===true}:null}}}
const tick=()=>new Promise(r=>setImmediate(r));

const watchdog=setTimeout(()=>{console.error('Teste 158 pendente');process.exit(1)},5000);
async function run(){
 assert.equal(ctx.agendaMarciaAbrir(),true);await tick();const inicial={on:db.onCount,off:db.offCount,listeners:db.listeners.length,queries:db.queries.length};assert(inicial.on>0&&inicial.listeners>0);
 ctx.agendaMarciaOcultar();assert.equal(ctx.agendaMarciaAbrir(),true);await tick();const segunda={on:db.onCount,off:db.offCount,listeners:db.listeners.length,queries:db.queries.length};assert.deepEqual(segunda,inicial,'mesmo ator e dia preservam as fontes reais');
 ctx.entrevistas155Pode=()=>false;db.listeners.slice().forEach(x=>x.emit());await tick();assert.equal(root.innerHTML,'','revogação limpa dados mesmo antes de reabrir');assert.equal(db.listeners.length,0);ctx.entrevistas155Pode=()=>true;assert.equal(ctx.agendaMarciaAbrir(),true);await tick();const antigoDb=db;ctx.DB=new FakeDB();antigoDb.listeners.slice().forEach(x=>x.emit());await tick();assert.equal(root.innerHTML,'','troca de banco limpa dados mesmo antes de reabrir');assert.equal(antigoDb.listeners.length,0);ctx.DB=db;assert.equal(ctx.agendaMarciaAbrir(),true);await tick();
 ctx.usuarioAtual=()=>({id:'outro-ficticio',nome:'Outra pessoa'});assert.equal(ctx.agendaMarciaAbrir(),true);await tick();assert(db.offCount>inicial.off,'troca de identidade fecha listeners');assert(db.onCount>inicial.on,'outra identidade cria fonte própria');
 console.log('reabertura fake:',JSON.stringify({primeira:inicial,segunda:segunda}));const antigas=db.listeners.slice();ctx.agendaMarciaFechar();assert.equal(db.listeners.length,0,'fechamento de segurança remove listeners');assert.equal(root.innerHTML,'','fechamento de segurança apaga conteúdo do painel');antigas.forEach(x=>x.emit());await tick();assert.equal(root.innerHTML,'','callback atrasado não repinta');ctx.usuarioAtual=()=>null;assert.equal(ctx.agendaMarciaAbrir(),false);assert.match(root.textContent,/perfil autorizado/);console.log('agenda-agil-bootstrap158: OK');
}
run().finally(()=>clearTimeout(watchdog)).catch(e=>{console.error(e);process.exitCode=1});
