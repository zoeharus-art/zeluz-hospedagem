'use strict';
// Etapa 1 da redução do consumo do banco (Adriana, 29/out/2026: «Autorizo a Etapa 1 da redução do consumo em PR,
// sem publicar.»). Prova que cada corte está no app e que as funções novas fazem o que prometem.
// Nunca lê o banco real: as funções rodam num sandbox com um banco falso, e o FILHOt é inventado.
// Uso: node tests/consumo-etapa1.test.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'auaulandia', 'index.html'), 'utf8');
let ok = 0, falhas = 0;
function prova(nome, fn) {
  return Promise.resolve().then(fn).then(
    () => { ok++; console.log('  ✓ ' + nome); },
    (e) => { falhas++; console.log('  ✗ ' + nome + ' — ' + ((e && e.message) || e)); });
}
function igual(a, b, msg) { if (a !== b) throw new Error((msg || '') + ' esperado ' + JSON.stringify(b) + ', veio ' + JSON.stringify(a)); }
function tem(trecho, msg) { if (html.indexOf(trecho) < 0) throw new Error(msg || ('falta: ' + trecho.slice(0, 80))); }
function naoTem(trecho, msg) { if (html.indexOf(trecho) >= 0) throw new Error(msg || ('ainda tem: ' + trecho.slice(0, 80))); }
// Texto de uma função do app, pelas chaves (as funções usadas aqui não têm chave dentro de texto).
function fonte(nome) {
  const i = html.indexOf('function ' + nome + '(');
  if (i < 0) throw new Error('não achei a função ' + nome);
  let j = html.indexOf('{', i), n = 0;
  for (; j < html.length; j++) { if (html[j] === '{') n++; else if (html[j] === '}' && --n === 0) break; }
  return html.slice(i, j + 1);
}

(async () => {
  console.log('consumo-etapa1: os cortes da Etapa 1 estão no app');

  await prova('o risco de «não comeu» relê de 20 em 20 minutos (antes 5)', () => {
    tem("carregarRiscoNaoComer(); }, 1200000);");
    naoTem("carregarRiscoNaoComer(); }, 300000);");
  });

  await prova('o automático do Dashboard confere de 15 em 15 minutos e os avisos usam a variável', () => {
    tem('var DASH_AUTO_MIN=15;');
    naoTem('var DASH_AUTO_MIN=5;');
    tem("(até '+DASH_AUTO_MIN+' min)");
  });

  await prova('o cadastro da hospedagem tem selo e cópia no aparelho (zMapaVivo), sem ouvinte do nó inteiro', () => {
    tem("'auaulandia/cadastro':'auaulandia/versoes/cadastro'");
    tem("zMapaVivo('auaulandia/cadastro','_cadHosp'");
    naoTem("DB.ref('auaulandia/cadastro').on('value'");
  });

  await prova('manuais (8 dias) e trocas (35 dias) são ouvidos só numa janela de dias', () => {
    tem("zDesdeDias(DB.ref('auaulandia/manuais'), 8).on('value'");
    tem("zDesdeDias(DB.ref('daycare/trocas'), TROCA_JANELA_DIAS).on('value'");
    tem('var TROCA_JANELA_DIAS=35;');
    naoTem("DB.ref('auaulandia/manuais').on('value'");
    naoTem("DB.ref('daycare/trocas').on('value'");
  });

  await prova('zDesdeDias pede orderByKey().startAt(dia de N dias atrás) e, sem consulta, devolve o nó como antes', () => {
    const ctx = { zHojeISO: () => '2026-10-29' };
    vm.createContext(ctx);
    vm.runInContext(fonte('orcMaisDias') + '\n' + fonte('zDesdeDias'), ctx);
    const pedido = [];
    const ref = { orderByKey() { pedido.push('orderByKey'); return { startAt(k) { pedido.push(k); return 'consulta'; } }; } };
    igual(ctx.zDesdeDias(ref, 35), 'consulta');
    igual(pedido.join(','), 'orderByKey,2026-09-24');
    igual(ctx.zDesdeDias(ref, 8), 'consulta');
    igual(pedido[pedido.length - 1], '2026-10-21');
    const semConsulta = { on() {} };
    igual(ctx.zDesdeDias(semConsulta, 8), semConsulta, 'sem orderByKey:');
  });

  await prova('fila da vet: na 5ª tentativa o aviso vai para avisos-vet-parados (nada se apaga) e sai da fila; antes disso só conta', async () => {
    const banco = {
      'auaulandia/avisos-vet-fila': {
        a1: { pet: 'Biscoito', ponto: 'Orelha', tentativas: 4, foto: 'data:image/jpeg;base64,AAAA' },
        a2: { pet: 'Biscoito', ponto: 'Pata', tentativas: 0 },
      },
    };
    const gravou = [], tirou = [], rastro = [];
    const DB = {
      ref(p) {
        return {
          limitToFirst() { return { once() { return Promise.resolve({ val: () => banco[p] }); } }; },
          set(v) { gravou.push([p, v]); return Promise.resolve(); },
          remove() { tirou.push(p); return Promise.resolve(); },
        };
      },
    };
    const ctx = {
      DB, Promise, Object,
      tgCfgPronta: () => Promise.resolve({ url: 'https://exemplo.invalid' }),
      tgAvisar: () => Promise.resolve({ ok: false }),
      audit: (tipo, txt) => rastro.push(tipo + ': ' + txt),
      _logFalhaGrav: () => {},
      ckFotoMarcarEnviada: () => {},
    };
    vm.createContext(ctx);
    vm.runInContext('var _vetFilaRodando=false; var VET_FILA_TETO=5;\n' + fonte('vetFilaTentar'), ctx);
    igual(await ctx.vetFilaTentar(), 0);
    const parado = gravou.find((g) => g[0] === 'auaulandia/avisos-vet-parados/a1');
    if (!parado) throw new Error('o aviso de 5 tentativas não foi guardado em avisos-vet-parados');
    igual(parado[1].tentativas, 5);
    igual(parado[1].foto, 'data:image/jpeg;base64,AAAA', 'a foto vai junto:');
    if (tirou.indexOf('auaulandia/avisos-vet-fila/a1') < 0) throw new Error('o aviso parado não saiu da fila');
    const conta = gravou.find((g) => g[0] === 'auaulandia/avisos-vet-fila/a2/tentativas');
    igual(conta && conta[1], 1, 'o aviso novo só conta a tentativa:');
    if (tirou.indexOf('auaulandia/avisos-vet-fila/a2') >= 0) throw new Error('o aviso com 1 tentativa saiu da fila');
    if (!rastro.some((r) => /NÃO avisou o grupo depois de 5 tentativas/.test(r))) throw new Error('faltou o rastro na auditoria');
  });

  await prova('a foto da consulta da vet é reduzida antes de entrar na lista (vetFotoReduzir)', () => {
    tem('var VET_FOTO_MAX=1280;');
    tem('vetFotoReduzir(r.result).then(function(src){ vcFotosBuf.push(src); renderVcFotos(); });');
    naoTem('r.onload=function(){ vcFotosBuf.push(r.result); renderVcFotos(); };');
  });

  await prova('vetFotoReduzir: foto grande sai em JPG de até 1280 px; se não der para desenhar, vai a original', async () => {
    const canvas = { width: 0, height: 0, getContext: () => ({ drawImage() {} }), toDataURL: () => 'data:image/jpeg;base64,PEQUENA' };
    function Image() { const self = this; setTimeout(() => { self.width = 4000; self.height = 3000; self.onload(); }, 0); }
    const ctx = { Promise, Math, String, setTimeout, Image, document: { createElement: () => canvas }, _logFalhaGrav: () => {} };
    vm.createContext(ctx);
    vm.runInContext('var VET_FOTO_MAX=1280;\n' + fonte('vetFotoReduzir'), ctx);
    const grande = 'data:image/png;base64,' + 'A'.repeat(5000);
    igual(await ctx.vetFotoReduzir(grande), 'data:image/jpeg;base64,PEQUENA');
    igual(canvas.width, 1280); igual(canvas.height, 960);
    function ImageQuebrada() { const self = this; setTimeout(() => self.onerror(), 0); }
    const ctx2 = Object.assign({}, ctx, { Image: ImageQuebrada });
    vm.createContext(ctx2);
    vm.runInContext('var VET_FOTO_MAX=1280;\n' + fonte('vetFotoReduzir'), ctx2);
    igual(await ctx2.vetFotoReduzir(grande), grande);
  });

  console.log('\n' + ok + ' provas passaram' + (falhas ? (', ' + falhas + ' FALHARAM.') : '.'));
  process.exit(falhas ? 1 : 0);
})();
