'use strict';
const {spawnSync}=require('node:child_process');
const path=require('node:path');
for(const [file,expected] of [['agenda-cuidados157.test.js','agenda-cuidados157: OK'],['marcia-cuidados157.test.js','marcia-cuidados157: OK'],['agenda-marcia-painel131.test.js','agenda-marcia-painel131: OK'],['marcia-dashboard129.test.js','marcia-dashboard129: OK'],['marcia-integracao129.test.js','marcia-integracao129: OK']]){
 const r=spawnSync(process.execPath,[path.resolve(__dirname,'../../tests',file)],{encoding:'utf8',timeout:12000});
 if(r.status!==0||!r.stdout.includes(expected)){process.stderr.write(file+' falhou ou não terminou\n'+r.stderr);process.exit(1)}
 process.stdout.write(r.stdout);
}
