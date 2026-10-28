'use strict';

// Leituras do Firebase mais enxutas (varredura 360, ganho 2 — Adriana, 27/out/2026: «faca os dois
// na ordem que sugeriu»). Duas economias, e as duas não podem mudar NENHUM resultado:
//  1) o acerto das plantonistas: a dedução de «quem fez a noite» pela auditoria guarda a conta
//     de cada dia e só baixa de novo o dia cujo último registro mudou;
//  2) as fotos do Day Care: trocar uma foto baixa só aquela foto, não as 140.
// Banco de mentira, dados inventados (nomes «Exemplo»), sem rede.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const APP = path.join(__dirname, '..', 'auaulandia', 'index.html');
const src = fs.readFileSync(APP, 'utf8');

function funcaoDe(texto, nome) {
  const inicio = texto.indexOf('function ' + nome + '(');
  assert.ok(inicio >= 0, 'função ausente: ' + nome);
  const abre = texto.indexOf('{', inicio);
  let nivel = 0;
  let aspas = '';
  let escape = false;
  for (let i = abre; i < texto.length; i += 1) {
    const c = texto[i];
    if (aspas) {
      if (escape) escape = false;
      else if (c === '\\') escape = true;
      else if (c === aspas) aspas = '';
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { aspas = c; continue; }
    if (c === '{') nivel += 1;
    if (c === '}' && --nivel === 0) return texto.slice(inicio, i + 1);
  }
  throw new Error('função incompleta: ' + nome);
}

// A dedução DE ANTES (master 96631e0), copiada como referência fixa: a nova tem de dar a mesma conta.
const ACERTO_ANTIGO = `function acertoDeduzirQuem(){
    if(!DB) return Promise.resolve({});
    var hoje=(typeof hojeISO==='function')?hojeISO():'';
    var dias=[]; for(var i=0;i<=30;i++) dias.push(orcMaisDias(hoje,-i));
    return Promise.all(dias.map(function(d){
      return DB.ref('daycare/auditoria/'+d).once('value')
        .then(function(s){ return {d:d, v:s.val()||{}}; }).catch(function(){ return {d:d, v:{}}; });
    })).then(function(res){
      var porNoite={};
      var ehGenerico=function(n){ return !n || /plantonista|gest[ãa]o|supervisor|monitor\\s*\\d|recep|veterin/i.test(n); };
      res.forEach(function(r){
        Object.keys(r.v).forEach(function(id){
          var x=r.v[id]||{}; if(!x.quem||ehGenerico(x.quem)) return;
          var hh=parseInt(String(x.hora||'').slice(0,2),10);
          if(isNaN(hh)) return;
          var noite=null;
          if(hh>=18) noite=r.d;
          else if(hh<7) noite=orcMaisDias(r.d,-1);
          if(!noite) return;
          porNoite[noite]=porNoite[noite]||{};
          porNoite[noite][x.quem]=(porNoite[noite][x.quem]||0)+1;
        });
      });
      var out={};
      Object.keys(porNoite).forEach(function(n){
        var m=porNoite[n], nomes=Object.keys(m).sort(function(a,b){ return m[b]-m[a]; });
        if(nomes.length) out[n]={nome:nomes[0], acoes:m[nomes[0]], outros:nomes.slice(1,3)};
      });
      return out;
    });
  }`;

let n = 0;
const fila = [];
function prova(nome, fn) { fila.push([nome, fn]); }

// ---------------------------------------------------------------- banco de mentira
function bancoDeMentira(dados) {
  const leituras = [];
  const ouvintes = {};
  const pegar = (p) => p.split('/').reduce((o, k) => (o == null ? undefined : o[k]), dados);
  const snap = (v) => ({ val: () => (v === undefined ? null : JSON.parse(JSON.stringify(v))) });
  function ref(p) {
    return {
      once: () => { leituras.push(p); return Promise.resolve(snap(pegar(p))); },
      limitToLast: (k) => ({
        once: () => {
          leituras.push(p + '#ultimos' + k);
          const v = pegar(p) || {};
          const out = {};
          Object.keys(v).sort().slice(-k).forEach((c) => { out[c] = v[c]; });
          return Promise.resolve(snap(Object.keys(out).length ? out : null));
        },
      }),
      on: (ev, cb) => { (ouvintes[p] = ouvintes[p] || []).push(cb); cb(snap(pegar(p))); },
      set: (v) => {
        const partes = p.split('/');
        let o = dados;
        partes.slice(0, -1).forEach((k) => { o = o[k] = o[k] || {}; });
        o[partes[partes.length - 1]] = v;
        (ouvintes[p] || []).forEach((cb) => cb(snap(v)));
        return Promise.resolve();
      },
      remove: () => {
        const partes = p.split('/');
        let o = dados;
        partes.slice(0, -1).forEach((k) => { o = o && o[k]; });
        if (o) delete o[partes[partes.length - 1]];
        return Promise.resolve();
      },
    };
  }
  return { ref, leituras, dados };
}

function guardaLocal() {
  const m = {};
  return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: (k) => { delete m[k]; } };
}

const espera = () => new Promise((r) => setTimeout(r, 0)).then(() => new Promise((r) => setTimeout(r, 0)));

// ---------------------------------------------------------------- 1) o acerto
const HOJE = '2026-10-28';
function contexto(codigo, extra) {
  const ctx = Object.assign({ console }, extra || {});
  vm.createContext(ctx);
  vm.runInContext(funcaoDe(src, 'orcMaisDias') + '\n' + codigo + "\nfunction hojeISO(){ return '" + HOJE + "'; }", ctx);
  return ctx;
}
const ACERTO_NOVO = ['acertoAudCacheLer', 'acertoAudCacheGuardar', 'acertoAudContarDia', 'acertoAudDia', 'acertoDeduzirQuem']
  .map((f) => funcaoDe(src, f)).join('\n') + "\nvar ACERTO_AUD_CHAVE='zeluz_acerto_aud_v1';";

// 32 dias de auditoria inventada: plantonistas «Exemplo», horas da noite e do dia, login genérico.
function auditoriaInventada(semente) {
  let x = semente;
  const rnd = () => { x = (x * 1103515245 + 12345) % 2147483648; return x / 2147483648; };
  const nomes = ['Bia Exemplo', 'Cris Exemplo', 'Dani Exemplo', 'Plantonista', 'Gestão', 'Monitor 6', 'Eva Exemplo'];
  const aud = {};
  for (let i = 0; i <= 31; i += 1) {
    const d = new Date(2026, 9, 28 - i, 12);
    const dia = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    aud[dia] = {};
    const qtd = Math.floor(rnd() * 25);
    for (let j = 0; j < qtd; j += 1) {
      const hh = Math.floor(rnd() * 24);
      aud[dia]['-K' + dia.replace(/-/g, '') + String(j).padStart(4, '0')] = { quem: nomes[Math.floor(rnd() * nomes.length)], hora: String(hh).padStart(2, '0') + ':' + String(Math.floor(rnd() * 60)).padStart(2, '0') };
    }
  }
  return aud;
}
const copia = (o) => JSON.parse(JSON.stringify(o));

prova('acerto: a conta nova é IDÊNTICA à de antes — na primeira abertura, na seguinte (do guardado) e depois de um registro atrasado', async () => {
  for (const semente of [7, 42, 2026]) {
    const aud = auditoriaInventada(semente);
    const dbVelho = bancoDeMentira({ daycare: { auditoria: copia(aud) } });
    const velho = contexto(ACERTO_ANTIGO, { DB: dbVelho });
    const esperado = JSON.stringify(await velho.acertoDeduzirQuem());
    assert.ok(Object.keys(JSON.parse(esperado)).length > 5, 'a auditoria inventada tem noites');

    const db = bancoDeMentira({ daycare: { auditoria: copia(aud) } });
    const novo = contexto(ACERTO_NOVO, { DB: db, localStorage: guardaLocal() });
    assert.strictEqual(JSON.stringify(await novo.acertoDeduzirQuem()), esperado, 'primeira abertura (semente ' + semente + ')');
    assert.strictEqual(db.leituras.filter((l) => l.indexOf('#') < 0).length, 31, 'primeira abertura baixa os 31 dias');

    db.leituras.length = 0;
    assert.strictEqual(JSON.stringify(await novo.acertoDeduzirQuem()), esperado, 'segunda abertura (semente ' + semente + ')');
    assert.strictEqual(db.leituras.filter((l) => l.indexOf('#') < 0).length, 0, 'segunda abertura não baixa nenhum dia inteiro');
    assert.strictEqual(db.leituras.filter((l) => /#ultimos1$/.test(l)).length, 31, 'só pergunta o último registro de cada dia');

    // Um registro ATRASADO (o bolso que reenviou) num dia passado: chave mais nova, vira o último.
    const diaVelho = '2026-10-15';
    const atrasado = { quem: 'Bia Exemplo', hora: '23:10' };
    for (let j = 0; j < 6; j += 1) {   // seis registros atrasados: a noite passa a ser dela
      db.dados.daycare.auditoria[diaVelho]['-Zatrasado' + j] = atrasado;
      dbVelho.dados.daycare.auditoria[diaVelho]['-Zatrasado' + j] = atrasado;
    }
    const esperado2 = JSON.stringify(await velho.acertoDeduzirQuem());
    assert.notStrictEqual(esperado2, esperado, 'o registro atrasado muda a conta');
    db.leituras.length = 0;
    assert.strictEqual(JSON.stringify(await novo.acertoDeduzirQuem()), esperado2, 'depois do registro atrasado (semente ' + semente + ')');
    assert.deepStrictEqual(db.leituras.filter((l) => l.indexOf('#') < 0), ['daycare/auditoria/' + diaVelho], 'só o dia que mudou desce de novo');
  }
});

prova('acerto: sem o guardado (aparelho novo, aba anônima) baixa os 31 dias e dá a mesma conta', async () => {
  const aud = auditoriaInventada(99);
  const velho = contexto(ACERTO_ANTIGO, { DB: bancoDeMentira({ daycare: { auditoria: copia(aud) } }) });
  const quebrado = { getItem: () => { throw new Error('sem acesso'); }, setItem: () => { throw new Error('sem acesso'); } };
  const db = bancoDeMentira({ daycare: { auditoria: copia(aud) } });
  const novo = contexto(ACERTO_NOVO, { DB: db, localStorage: quebrado, console: { warn() {} } });
  assert.strictEqual(JSON.stringify(await novo.acertoDeduzirQuem()), JSON.stringify(await velho.acertoDeduzirQuem()));
  assert.strictEqual(db.leituras.filter((l) => l.indexOf('#') < 0).length, 31);
});

// ---------------------------------------------------------------- 2) as fotos
const FOTOS_FUNCOES = ['_fotosDoCache', '_fotosGuardar', '_fotosRedesenhar', '_fotosCarimbosLocal', '_fotosCarimbosGuardar', '_fotosBaixarTudo', 'fotosAvisarMudanca', 'carregarFotos', 'fotoChaveFantasma', 'salvarFotoCad'];
function aparelho(db, local) {
  const ctx = { console, localStorage: local, DB: db, window: {} };
  vm.createContext(ctx);
  vm.runInContext('var FOTOS={}, __fotosV=null; function _logFalhaGrav(){}\n' + FOTOS_FUNCOES.map((f) => funcaoDe(src, f)).join('\n'), ctx);
  return ctx;
}
function fotosIniciais() {
  const f = {};
  for (let i = 0; i < 140; i += 1) f['filhot' + i + '__tutor exemplo'] = 'data:image/jpeg;base64,F' + i;
  return f;
}
const leuFoto = (db) => db.leituras.filter((l) => /^daycare\/fotos(\/|$)/.test(l));

prova('fotos: primeira abertura baixa tudo; trocar UMA foto em outro aparelho faz este baixar só aquela', async () => {
  const db = bancoDeMentira({ daycare: { fotos: fotosIniciais(), 'fotos-v': '100' } });
  const a = aparelho(db, guardaLocal());
  const b = aparelho(db, guardaLocal());
  a.carregarFotos(); b.carregarFotos();
  await espera();
  assert.strictEqual(db.leituras.filter((l) => l === 'daycare/fotos').length, 2, 'cada aparelho baixa tudo uma vez');
  db.leituras.length = 0;
  await b.salvarFotoCad('filhot7__tutor exemplo', 'data:image/jpeg;base64,NOVA');
  await espera();
  assert.deepStrictEqual(leuFoto(db), ['daycare/fotos/filhot7__tutor exemplo'], 'o aparelho A baixou só a foto trocada (B já tinha)');
  assert.strictEqual(vm.runInContext("FOTOS['filhot7__tutor exemplo']", a), 'data:image/jpeg;base64,NOVA');
  assert.strictEqual(vm.runInContext('Object.keys(FOTOS).length', a), 140);
  assert.strictEqual(String(db.dados.daycare['fotos-carimbos']['filhot7__tutor exemplo']), String(db.dados.daycare['fotos-v']), 'carimbo da foto = carimbo geral');
});

prova('fotos: foto apagada some no outro aparelho sem baixar as outras', async () => {
  const db = bancoDeMentira({ daycare: { fotos: fotosIniciais(), 'fotos-v': '100' } });
  const a = aparelho(db, guardaLocal());
  const b = aparelho(db, guardaLocal());
  a.carregarFotos(); b.carregarFotos();
  await espera();
  db.leituras.length = 0;
  await db.ref('daycare/fotos/filhot3__tutor exemplo').remove();
  await b.fotosAvisarMudanca('filhot3__tutor exemplo', '555');
  await espera();
  assert.deepStrictEqual(leuFoto(db), ['daycare/fotos/filhot3__tutor exemplo']);
  assert.strictEqual(vm.runInContext("'filhot3__tutor exemplo' in FOTOS", a), false);
});

prova('fotos: app ANTIGO trocou a foto (sem carimbo da foto) — este aparelho baixa tudo, como antes', async () => {
  const db = bancoDeMentira({ daycare: { fotos: fotosIniciais(), 'fotos-v': '100' } });
  const a = aparelho(db, guardaLocal());
  a.carregarFotos();
  await espera();
  db.leituras.length = 0;
  await db.ref('daycare/fotos/filhot9__tutor exemplo').set('data:image/jpeg;base64,ANTIGO');
  await db.ref('daycare/fotos-v').set('777');
  await espera();
  assert.ok(db.leituras.indexOf('daycare/fotos') >= 0, 'sem saber o que mudou, baixa tudo');
  assert.strictEqual(vm.runInContext("FOTOS['filhot9__tutor exemplo']", a), 'data:image/jpeg;base64,ANTIGO');
});

prova('quem grava ou apaga foto passa pelo carimbo (nenhum fotos-v solto sobrou no app)', () => {
  const soltos = src.match(/DB\.ref\('daycare\/fotos-v'\)\.set\(/g) || [];
  assert.strictEqual(soltos.length, 1, 'o único set do carimbo geral é o de fotosAvisarMudanca');
  ['salvarFotoCad', 'fotoAtivApagar', 'fotoConfDesfazer', 'renomearCadastroPel'].forEach((f) => {
    assert.ok(/fotosAvisarMudanca\(/.test(funcaoDe(src, f)), f + ' carimba a foto');
  });
});

(async () => {
  for (const [nome, fn] of fila) {
    try { await fn(); n += 1; } catch (e) { console.error('FALHOU: ' + nome); throw e; }
  }
  console.log('firebase-enxuto153: OK (' + n + ' provas)');
})().catch((e) => { console.error(e); process.exitCode = 1; });
