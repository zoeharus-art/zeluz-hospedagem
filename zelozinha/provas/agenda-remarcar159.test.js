'use strict';
const {spawnSync}=require('node:child_process'),path=require('node:path');
for(const [file,ok] of [['agenda-remarcar159.test.js','agenda-remarcar159: OK'],['agenda-remarcar-ui159.test.js','agenda-remarcar-ui159: OK'],['marcia-remarcar159.test.js','marcia-remarcar159: OK']]){
 const r=spawnSync(process.execPath,[path.resolve(__dirname,'../../tests',file)],{encoding:'utf8',timeout:12000});
 if(r.status!==0||!r.stdout.includes(ok)){process.stderr.write(file+' falhou ou não terminou\n'+r.stderr);process.exit(1)}process.stdout.write(r.stdout);
}
