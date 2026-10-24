(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./contrato116.js'));else root.ZelozinhaTransporte116=factory(root.ZelozinhaContrato116);})(typeof window!=='undefined'?window:this,function(schema){
'use strict';
const {ROUTE,validCommand,validCredential,validControl}=schema;
const knownCodes=new Set(['invalid_request','unauthenticated','unauthorized','revision_conflict','already_paused','not_paused','attempt_in_flight','persistence_failed','rate_limited']);
function endpointValido(value){try{const u=new URL(value);return u.protocol==='https:'&&u.pathname===ROUTE&&!u.username&&!u.password&&!u.search&&!u.hash;}catch(_){return false;}}
function criar({endpoint,fetchImpl,timeoutMs=8000}){
 if(!endpointValido(endpoint)||typeof fetchImpl!=='function'||!Number.isSafeInteger(timeoutMs)||timeoutMs<100||timeoutMs>15000)throw Error('transporte indisponível');
 return Object.freeze({async control(input){
  const command={version:116,action:input&&input.action,expectedRevision:input&&input.expectedRevision,reason:input&&input.reason};
  const credential=input&&input.credential;
  if(!validCommand(command)||!validCredential(credential))return{ok:false,version:116,code:'invalid_request'};
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);let payload;
  try{
   payload=JSON.stringify({command:{...command,reason:command.reason.trim()},credential:{pessoaId:credential.pessoaId,password:credential.password}});
   const res=await fetchImpl(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:payload,credentials:'omit',cache:'no-store',redirect:'error',referrerPolicy:'no-referrer',signal:controller.signal});
   payload='';
   if(!res||typeof res.json!=='function'||!res.headers||!String(res.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))return{ok:false,version:116,code:'unconfirmed'};
   const data=await res.json();
   if(res.ok&&data&&data.ok===true&&data.version===116&&validControl(data.control)){
    const c=data.control,p=c.pause;
    return{ok:true,version:116,changed:data.changed===true,control:{status:c.status,revision:c.revision,pause:p?{requestedAt:p.requestedAt,effectiveAt:p.effectiveAt,actor:{id:p.actor.id,name:p.actor.name},reason:p.reason}:null}};
   }
   return{ok:false,version:116,code:data&&data.ok===false&&knownCodes.has(data.code)?data.code:'unconfirmed'};
  }catch(_){return{ok:false,version:116,code:'unconfirmed'};}
  finally{clearTimeout(timer);payload='';if(credential)credential.password='';}
 }});
}
return Object.freeze({criar,endpointValido});
});
