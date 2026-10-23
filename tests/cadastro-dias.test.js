'use strict';
// Extrai a função real ZeluzCadastroLinha115 da candidata congelável e a testa
// com ficha sintética. Nenhum dado do cadastro real é carregado.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const htmlPath=process.argv[2]?path.resolve(process.argv[2]):path.resolve(__dirname,'..','auaulandia','index.html');
const html=fs.readFileSync(htmlPath,'utf8');
const hit=html.match(/<script[^>]*id="tela115-cadastro-script"[^>]*>([\s\S]*?)<\/script>/);assert.ok(hit,'script de cadastro da candidata presente');
const ctx={};ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(hit[1],ctx,{filename:'candidata:tela115-cadastro'});
const row=ctx.ZeluzCadastroLinha115.linha({nome:'Peludo QA',raca:'Raça sintética',tutor:'Família QA',dias:['qua','seg','qua']});
assert.equal(row.texto,'Peludo QA — Raça sintética — Família QA — seg., qua.');
assert.match(row.html,/Peludo QA[\s\S]*Raça sintética[\s\S]*Família QA[\s\S]*seg\., qua\./);
assert.equal(ctx.ZeluzCadastroLinha115.linha({nome:'Peludo QA',raca:'',tutor:'',dias:[]}).texto,'Peludo QA — raça não cadastrada — tutor não cadastrado — dias não cadastrados');
assert.match(html,/<th>Nome — Raça — Tutor — Dias atuais<\/th>/);
assert.match(html,/ZeluzCadastroLinha115\.linha\(\{nome:pelNome\(p\),raca:pelGet\(p,'raca'\),tutor:pelGet\(p,'tutor'\),dias:pelDias\(p\)\}\)/);
console.log('tela115 QA independente: 6 verificações de cadastro/dias atuais passaram em função real extraída.');


