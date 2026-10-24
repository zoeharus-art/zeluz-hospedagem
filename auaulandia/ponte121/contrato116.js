(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ZelozinhaContrato116=factory();})(typeof window!=='undefined'?window:this,function(){
'use strict';
const ROUTE='/zelozinha/controle116';
const object=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
const exact=(v,keys)=>object(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
function validCommand(v){return exact(v,['version','action','expectedRevision','reason'])&&v.version===116&&['pause','resume'].includes(v.action)&&Number.isSafeInteger(v.expectedRevision)&&v.expectedRevision>=0&&typeof v.reason==='string'&&v.reason.trim().length>=3&&v.reason.trim().length<=240&&!/[\x00-\x1f\x7f]/.test(v.reason);}
function validCredential(v){return exact(v,['password','pessoaId'])&&typeof v.password==='string'&&v.password.length>=1&&v.password.length<=512&&typeof v.pessoaId==='string'&&/^[\w-]{1,120}$/.test(v.pessoaId);}
const validDate=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T/.test(v)&&Number.isFinite(Date.parse(v));
function validControl(c){
 if(!object(c)||!['running','pause_requested','paused'].includes(c.status)||!Number.isSafeInteger(c.revision)||c.revision<0)return false;
 if(c.status==='running')return c.pause===null;
 const p=c.pause;
 return object(p)&&validDate(p.requestedAt)&&object(p.actor)&&typeof p.actor.id==='string'&&/^[\w-]{1,120}$/.test(p.actor.id)&&typeof p.actor.name==='string'&&p.actor.name.trim().length>0&&p.actor.name.length<=120&&typeof p.reason==='string'&&validCommand({version:116,action:'pause',expectedRevision:0,reason:p.reason})&&(c.status==='pause_requested'?p.effectiveAt===null:validDate(p.effectiveAt)&&Date.parse(p.effectiveAt)>=Date.parse(p.requestedAt));
}
return Object.freeze({ROUTE,object,exact,validCommand,validCredential,validControl});
});
