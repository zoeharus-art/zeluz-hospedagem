(function(root){
'use strict';
if(!root)return;
try{delete root.ZelozinhaOperacao116;}catch(_){return;}
try{
 const config=root.ZelozinhaOperacao116Config116;
 const transporte=root.ZelozinhaTransporte116;
 if(!config||typeof config!=='object'||Array.isArray(config))return;
 const chaves=Object.keys(config).sort();
 if(chaves.length!==2||chaves[0]!=='endpoint'||chaves[1]!=='version')return;
 const proto=Object.getPrototypeOf(config);
 if(proto!==Object.prototype&&proto!==null)return;
 if(config.version!==116||typeof config.endpoint!=='string'||typeof root.fetch!=='function')return;
 if(!transporte||typeof transporte.endpointValido!=='function'||typeof transporte.criar!=='function')return;
 const url=new URL(config.endpoint);
 if(url.hostname==='invalid'||url.hostname.endsWith('.invalid')||!transporte.endpointValido(config.endpoint))return;
 root.ZelozinhaOperacao116=transporte.criar({endpoint:config.endpoint,fetchImpl:root.fetch.bind(root)});
}catch(_){try{delete root.ZelozinhaOperacao116;}catch(__){}}
})(typeof window!=='undefined'?window:null);
