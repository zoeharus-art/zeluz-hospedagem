const assert=require('assert/strict');
const fs=require('fs');
const path=require('path');
const vm=require('vm');

const indice=fs.readFileSync(path.resolve(__dirname,'../auaulandia/index.html'),'utf8');

function extrairFuncao(nome){
  const inicio=indice.indexOf('function '+nome+'(');
  assert.notEqual(inicio,-1,'função '+nome+' deve existir no index real');
  const abre=indice.indexOf('{',inicio);
  let nivel=0,aspas='',escape=false;
  for(let i=abre;i<indice.length;i++){
    const c=indice[i];
    if(aspas){
      if(escape)escape=false;
      else if(c==='\\')escape=true;
      else if(c===aspas)aspas='';
      continue;
    }
    if(c==='\''||c==='"'||c==='`'){aspas=c;continue;}
    if(c==='{')nivel++;
    if(c==='}'&&--nivel===0)return indice.slice(inicio,i+1);
  }
  throw new Error('não foi possível extrair '+nome);
}

function papeisReais(){
  const achado=indice.match(/'historico-checkins'\s*:\s*\[([^\]]+)\]/);
  assert.ok(achado,'capacidade historico-checkins deve estar no PERM real');
  return Array.from(achado[1].matchAll(/'([^']+)'/g),m=>m[1]);
}

const fonte=extrairFuncao('histCiLerEstadias')+'\n'+extrairFuncao('histCiCadastroPorRefKey')+'\n'+
  'globalThis.__histCiLerEstadias=histCiLerEstadias;globalThis.__histCiCadastroPorRefKey=histCiCadastroPorRefKey;';

function vmDasFuncoes(opcoes){
  opcoes=opcoes||{};
  const timers=[],papeis=opcoes.papeis||papeisReais();
  let leituras=0,refs=0,escritas=0;
  const db=opcoes.dbAusente?null:{
    ref(){refs++;return {set(){escritas++;},update(){escritas++;},remove(){escritas++;}};}
  };
  const sandbox={
    Promise,Error,Object,Array,
    DB:db,
    pelCadCache:opcoes.pelCadCache||{},cadCache:opcoes.cadCache||{},
    usuarioAtual(){return opcoes.semSessao?null:{uid:'sessao-teste'};},
    podePapel(cap){return cap==='historico-checkins'&&papeis.includes(opcoes.papel||'gestao');},
    zMapaUma(chave){leituras++;return opcoes.zMapaUma?opcoes.zMapaUma(chave):Promise.resolve({});},
    setTimeout(fn,ms){const t={fn,ms,limpo:false};timers.push(t);return t;},
    clearTimeout(t){t.limpo=true;}
  };
  vm.createContext(sandbox);
  vm.runInContext(fonte,sandbox,{filename:'index.html:historico-checkins'});
  return {ler:sandbox.__histCiLerEstadias,cadastro:sandbox.__histCiCadastroPorRefKey,timers,
    get leituras(){return leituras;},get refs(){return refs;},get escritas(){return escritas;}};
}

(async function(){
  const papeis=papeisReais();
  assert.deepEqual(papeis,['gestao','diretoria','consultora'],'PERM real limita a consulta aos três papéis aprovados');

  for(const papel of papeis){
    const mapa={caso:{nome:'Hóspede Exemplo'}},p=vmDasFuncoes({papel,zMapaUma(chave){assert.equal(chave,'auaulandia/estadias');return Promise.resolve(mapa);}});
    assert.strictEqual(await p.ler(),mapa,'papel '+papel+' reutiliza o mapa da sessão');
    assert.equal(p.leituras,1);assert.equal(p.refs,0,'leitura não usa DB.ref');assert.equal(p.escritas,0,'consulta não escreve no banco');
  }
  for(const papel of ['monitor','plantonista']){
    const p=vmDasFuncoes({papel});
    await assert.rejects(p.ler(),/Sem permissão/,'papel '+papel+' não inicia leitura');
    assert.equal(p.leituras,0);assert.equal(p.refs,0);
  }
  const semSessao=vmDasFuncoes({semSessao:true});
  await assert.rejects(semSessao.ler(),/Sem permissão/,'sem sessão não inicia leitura');
  assert.equal(semSessao.leituras,0);assert.equal(semSessao.refs,0);
  const semDb=vmDasFuncoes({dbAusente:true});
  await assert.rejects(semDb.ler(),/conexão de leitura ainda não está disponível/i,'DB ausente é erro explícito');
  assert.equal(semDb.leituras,0);

  const comErro=vmDasFuncoes({zMapaUma(){return Promise.reject(new Error('falha do mapa'));}});
  await assert.rejects(comErro.ler(),/falha do mapa/,'erro de sincronização não vira mapa vazio');
  assert.equal(comErro.refs,0);assert.equal(comErro.escritas,0);

  let iniciarMapa;
  const pendente=vmDasFuncoes({zMapaUma(){return new Promise(function(resolve){iniciarMapa=resolve;});}});
  const espera=pendente.ler();
  await Promise.resolve();await Promise.resolve();
  assert.equal(pendente.leituras,1);assert.equal(pendente.timers.length,1);assert.equal(pendente.timers[0].ms,15000,'timeout real é programado');
  pendente.timers[0].fn();
  await assert.rejects(espera,/ainda não sincronizou/i,'timeout não devolve coleção vazia');
  assert.equal(pendente.refs,0);assert.equal(pendente.escritas,0);
  iniciarMapa({naoDeveSubstituirTimeout:true});

  const ficha={nome:'Hóspede Exemplo',tutor:'Tutor Exemplo'};
  const cad=vmDasFuncoes({pelCadCache:{'ref-exata':ficha,'id-de-outro':{nome:'Hóspede Exemplo'}},cadCache:{'ref-exata':{nome:'não deve vencer'}}});
  const copia=cad.cadastro('ref-exata');
  assert.deepEqual({...copia},ficha,'cadastro vem da refKey exata e respeita prioridade do cache');
  assert.notStrictEqual(copia,ficha,'cadastro entregue é cópia, sem mutar cache');
  assert.equal(cad.cadastro('Hóspede Exemplo'),null,'nome não é usado como chave de cadastro');
  assert.equal(vmDasFuncoes({papel:'monitor',pelCadCache:{'ref-exata':ficha}}).cadastro('ref-exata'),null,'papel negado não recebe cadastro');
  // Lê fotos da estadia solicitada, inclusive formatos antigo e atual, sem usar a tela aberta.
  const fotosSandbox={Promise,Error,Array,Object,String,Number,Boolean,DB:{},
    usuarioAtual:()=>({uid:'teste'}),podePapel:()=>true,
    CF_FOTOS:[{src:'foto-de-outra-estadia'}],
    cfRefFotos(id){assert.equal(id,'estadia-correta');return {once(evento){assert.equal(evento,'value');return Promise.resolve({val:()=>({a:'legada',b:{src:'atual'},c:{src:'retirada',tirada:{quem:'teste'}},d:null})});}};}
  };
  vm.createContext(fotosSandbox);
  vm.runInContext(extrairFuncao('cfFotosDe')+'\n'+extrairFuncao('histCiLerFotos'),fotosSandbox);
  assert.deepEqual(Array.from(await fotosSandbox.histCiLerFotos('estadia-correta')),['legada','atual']);
  fotosSandbox.podePapel=()=>false;
  await assert.rejects(fotosSandbox.histCiLerFotos('estadia-correta'),/Sem permissão/);
  fotosSandbox.podePapel=()=>true;fotosSandbox.usuarioAtual=()=>null;
  await assert.rejects(fotosSandbox.histCiLerFotos('estadia-correta'),/Sem permissão/);
  fotosSandbox.usuarioAtual=()=>({uid:'teste'});fotosSandbox.DB=null;
  await assert.rejects(fotosSandbox.histCiLerFotos('estadia-correta'),/conexão de leitura/);
  console.log('ok: integração histórica extrai index real, protege leitura e resolve somente refKey');
})().catch(function(erro){console.error(erro);process.exitCode=1;});
