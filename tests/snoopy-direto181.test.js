'use strict';
/* «Lançado no Snoopy» no painel Zelozinha (Adriana, 10/11/2026: "clico em lançado e nada dá"). A caixinha voltava sozinha, sem aviso,
   sempre que o estado do item não era exatamente «pendente». Agora: relê e tenta uma vez de novo; se a confirmação antiga é de um
   lançamento que mudou depois, desfaz a antiga com motivo e confirma a atual (as duas ficam no histórico); se ainda não der, avisa o motivo. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'../auaulandia/index.html'),'utf8');
function modulo(nome){const reg=html.indexOf('root.'+nome+' = api;');assert.ok(reg>0,nome);const ini=html.lastIndexOf('(function (root, factory)',reg),fim=html.indexOf('\n}));',reg)+5;return html.slice(ini,fim);}
const sb={};vm.createContext(sb);['ZeluzSnoopyConfirmacao','ZeluzSnoopy31AdaptadorDB','ZeluzSnoopy33Interface'].forEach(n=>vm.runInContext(modulo(n),sb));
const C=sb.ZeluzSnoopyConfirmacao,A=sb.ZeluzSnoopy31AdaptadorDB,I=sb.ZeluzSnoopy33Interface;
function get(st,p){let o=st;for(const k of p.split('/')){if(o==null)return null;o=o[k];}return o===undefined?null:JSON.parse(JSON.stringify(o));}
function set(st,p,v){const ps=p.split('/');let o=st;for(let i=0;i<ps.length-1;i++){o=o[ps[i]]=o[ps[i]]||{};}o[ps[ps.length-1]]=v;}
function banco(st){return {ref(p){return {once:async()=>({val:()=>get(st,p)}),
  transaction:async(fn)=>{const cur=get(st,p),nv=fn(cur);if(nv===undefined)return {committed:false,snapshot:{val:()=>cur}};set(st,p,JSON.parse(JSON.stringify(nv)));return {committed:true,snapshot:{val:()=>get(st,p)}};}};}};}
const DIA='2026-11-10',CAM='daycare/snoopy/'+DIA+'/carrapaticida/L1';
async function cena(hist,op){
  op=op||{};const reg={chave:'k',valor:'Fictícia / SRD (PIPETA)',det:{onde:'LOJA',prod:'PIPETA',qtd:'30 DIAS'}},st={};
  set(st,'daycare/dashboard/'+DIA+'/carrapaticida/L1',reg);if(hist)set(st,CAM,hist);
  const dados={carrapaticida:{L1:reg}},ator={id:'u',nome:'Pessoa Fictícia',papel:'diretoria',valido:true,assinatura:'u|Pessoa Fictícia|diretoria'},db=banco(st);
  const base=A.criar({db,snoopy28:C,dashEditarAtor:()=>ator});base.cobravelNaFonte=C.cobravelNaFonte;
  const avisos=[];let fonte=true;
  const inst=I.criar({db,snoopy:base,dashDia:()=>DIA,dashDados:()=>dados,dashEditarAtor:()=>ator,dadosProntos:()=>fonte,avisar:(t,l)=>avisos.push(l.join(' ')),perguntar:async()=>true,redesenhar(){}});
  await inst.carregar();const lista=inst.listarPendentes();if(op.fonteCai)fonte=false;
  const r=await inst.confirmarDireto('carrapaticida','L1');
  return {lista,r,avisos,inst,ev:()=>Object.values((get(st,CAM)||{}).eventos||{})};
}
async function run(){
  let x=await cena();
  assert.equal(x.r.estado,'confirmacao-vigente');assert.equal(x.ev().length,1);assert.equal(x.avisos.length,0);
  const r2=await x.inst.confirmarDireto('carrapaticida','L1');assert.equal(r2.estado,'confirmacao-vigente','marcar de novo o que já está lançado não dá erro');assert.equal(x.ev().length,1,'nem duplica');
  assert.equal((await x.inst.desfazerDireto('carrapaticida','L1')).estado,'desfeito');
  x=await cena({eventos:{op1:{tipo:'confirmacao',operacaoId:'op1',assinatura:'{"chave":"k","det":{"onde":"LOJA"},"valor":"antigo"}',quem:'Outra Pessoa',em:1}}});
  assert.equal(x.lista.itens[0].estado,'revisar','a confirmação antiga é de um lançamento que mudou');
  assert.equal(x.r.estado,'confirmacao-vigente','marcar confirma o lançamento atual');
  assert.deepEqual(x.ev().map(e=>e.tipo||'confirmacao').sort(),['confirmacao','confirmacao','desfazer-confirmacao'],'a antiga é desfeita com motivo e fica no histórico');
  assert.ok(x.ev().some(e=>e.tipo==='desfazer-confirmacao'&&/mudou/.test(e.motivo||'')));
  assert.equal(x.inst.listarPendentes().itens[0].estado,'confirmacao-vigente');
  x=await cena(null,{fonteCai:true});
  assert.notEqual(x.r.estado,'confirmacao-vigente');assert.equal(x.ev().length,0,'nada gravado');
  assert.equal(x.avisos.length,1,'a caixinha não volta mais em silêncio');assert.match(x.avisos[0],/carregando/);
  assert.match(html,/if\(!ok\)\{if\(el\.isConnected\)\{el\.checked=!marcou;el\.disabled=false;\}if\(typeof w\.zelozinha116SnoopyAtualizar==='function'\)w\.zelozinha116SnoopyAtualizar\(\);\}/,'a caixinha que não confirmou relê a lista');
  assert.match(html,/erro:\(r&&\(r\.erro\|\|r\.motivo\)\)\|\|'rastro pendente'/,'o recibo do cuidado mostra o motivo real');
  console.log('snoopy-direto181: ok');
}
module.exports=run();if(require.main===module)module.exports.catch(e=>{console.error(e);process.exitCode=1;});
