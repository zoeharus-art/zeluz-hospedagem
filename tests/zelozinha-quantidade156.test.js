'use strict';
const watchdog=setTimeout(()=>{console.error('Teste não terminou');process.exit(1)},5000);

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.resolve(__dirname, '../auaulandia/index.html'), 'utf8');
const entre = (inicio, fim) => {
  const a = html.indexOf(inicio), b = html.indexOf(fim, a + inicio.length);
  assert.ok(a >= 0 && b > a, `trecho não encontrado: ${inicio}`);
  return html.slice(a, b);
};
const script = (id) => {
  const m = html.match(new RegExp(`<script[^>]*id="${id}"[^>]*>([\\s\\S]*?)<\\/script>`));
  assert.ok(m, `script ausente: ${id}`);
  return m[1];
};
const puro = {};
vm.createContext(puro);
vm.runInContext(script('zelozinha-tela94-puro'), puro);
vm.runInContext(entre('/* Confirmação humana de lançamento no Snoopy.', '/* Adaptador local para Snoopy28.'), puro);
const T = puro.ZelozinhaTela94, S = puro.ZeluzSnoopyConfirmacao;
assert.ok(T && S && typeof S.projetar === 'function');
assert.match(script('zelozinha-contatos89-ui'), /if\(acao==='esc'\)\{if\(cy\)gravarEscolha\(c,cy,el\.getAttribute\('data-zt694-campo'\)/, 'clique do chip deve chegar à gravação');

const corpo = entre('  async function gravarEscolha(c,cy,campo,valor,op){', '  function capacidadeCartaz(){');
const controller116 = script('zelozinha-painel116-controller');
const clone = (x) => JSON.parse(JSON.stringify(x));
const dia = '2026-10-26', dc = 'filhot-ficticio__tutor-ficticio';
const cycleKey = JSON.stringify(['pet-fixture','tutor-fixture','antip','2026-10-27','verm_dose2_p']);
const cy = { cycleKey, itemK: 'verm_dose2_p' };
const c = { dia, dcKey: dc, ciclos: [cy] };
const lineId = 'linha-fixture', respostaId = 'resposta-fixture';
const ref = { dia, item: 'vermifugo', id: lineId };
function linha() {
  return { chave: dc, valor: 'FILHOt fictício (CONFERIR ORIENTAÇÃO)', det: { cuidado57_estado: 'conferir-orientacao', onde:'NA BOLSA' },
    origemVencimento: { protocolo: 'cuidado57', linhaId: lineId, cycleKey, itemK: 'verm_dose2_p', respostaId, revisao: 0, origemResposta: 'bolsa' } };
}
function registro() {
  return { respostasEscopo49: { porCiclo: { [cycleKey]: { cycleKey, itemK: 'verm_dose2_p', respostaId, revisao: 0, decisao: 'autorizar', origem: 'bolsa' } },
    tarefas57: { [cycleKey]: { estado: 'criada', versao: { respostaId, revisao: 0 }, linha: { item: 'vermifugo', id: lineId } } } } };
}
function mundo(op = {}) {
  const store = { linha: linha(), registro: registro(), snoopy: { eventos: {} }, tx: 0, redraw: 0, releu: 0, invalidou116: 0, aviso: '', bloquearTx: false };
  const antigo = clone(store.linha), assAntiga = S.assinatura(antigo);
  store.snoopy.eventos.confirmacaoFicticia = { tipo: 'confirmacao', assinatura: assAntiga, operacaoId: 'confirmacaoFicticia' };
  assert.equal(S.projetar(store.linha, store.snoopy, store.linha).estado, 'confirmacao-vigente');
  let soltarWarm;
  const ctx = {
    T, c, cy, estado: { salvando: {}, avisos: {}, linhas: {}, registros139: {}, snoopyEstado: 'pronto' }, DASH_DADOS: {},
    vmCuidado: () => ({ tarefa: store.registro.respostasEscopo49.tarefas57[cycleKey] }),
    lerRegistro: async () => { const r = clone(store.registro); ctx.estado.registros139[dc] = { dia, registro: r }; return r; },
    respostaAtual: () => ctx.estado.registros139[dc].registro.respostasEscopo49.porCiclo[cycleKey],
    tarefaDe: () => ctx.estado.registros139[dc].registro.respostasEscopo49.tarefas57[cycleKey],
    valorAtual: (r) => r && r.decisao === 'autorizar' && r.origem === 'bolsa' ? 'autorizar_bolsa' : '',
    daLinha: (v) => v === 'autorizar_bolsa', linhaDoDia: () => clone(store.linha),
    snoopyConfirmadoDe: async () => op.snoopyFalha ? null : true,
    avisoLinha: (_dc, _i, msg) => { store.aviso = msg; }, redesenharLinha: () => { store.redraw++; },
    chaveLinha: () => 'linha', linhaPronta: () => !op.semMemoria, txt: (v) => typeof v === 'string' ? v.trim() : '',
    DB: { ref: (p) => ({
      on: (_event,cb) => { store.escuta=cb; cb({val:()=>clone(store.linha)}); }, off: (_event,cb) => { if(store.escuta===cb) store.escuta=null; }, once: async () => { if (p === `daycare/snoopy/${dia}/vermifugo/${lineId}`) return { val: () => clone(store.snoopy) };
        assert.equal(p, `daycare/dashboard/${dia}/vermifugo/${lineId}`); if (op.noWarm) await new Promise(resolve => { soltarWarm = resolve; });
        if (op.mudarTarefaNoWarm) store.registro.respostasEscopo49.tarefas57[cycleKey].estado = 'emexecucao';
        if (op.mudarRespostaNoWarm) { store.registro.respostasEscopo49.porCiclo[cycleKey].respostaId = 'resposta-concorrente'; store.registro.respostasEscopo49.porCiclo[cycleKey].revisao = 1; store.registro.respostasEscopo49.tarefas57[cycleKey].versao = { respostaId: 'resposta-concorrente', revisao: 1 }; }
        return { val: () => clone(store.linha) }; },
      transaction: async (f) => { assert.equal(p, `daycare/dashboard/${dia}/vermifugo/${lineId}`); store.tx++; const novo = f(op.nullRemoto ? null : (store.escuta ? clone(store.linha) : null)); if (op.falharAck || !novo) return { committed: false, snapshot: { val: () => clone(store.linha) } }; store.linha = clone(novo); return { committed: true, snapshot: { val: () => clone(store.linha) } }; }
    }) },
    sincronizarSnoopyExterno: async () => { store.releu++; store.projecao = S.projetar(store.linha, store.snoopy, store.linha); return true; },
    window: { ZeluzSnoopyConfirmacao: S, zelozinha116SnoopyInvalidar: () => { store.invalidou116++; return true; } }
  };
  vm.createContext(ctx);
  vm.runInContext(corpo, ctx);
  return { store, ctx, escolher: (campo, valor) => ctx.gravarEscolha(c, cy, campo, valor, {}), soltar: () => soltarWarm && soltarWarm() };
}

(async()=>{const m=mundo();assert.equal(await m.escolher('qtd','1 UNIDADE'),true,'a linha existente deve permitir escolher quantidade');assert.equal(m.store.linha.det.qtd,'1 UNIDADE');assert.equal(m.store.escuta,null,'listener temporário é removido');const ausente=mundo({nullRemoto:true});assert.equal(await ausente.escolher('qtd','1 UNIDADE'),false);assert.equal(ausente.store.linha.det.qtd,undefined);assert.equal(ausente.store.escuta,null);const mudou=mundo();mudou.store.linha.origemVencimento.revisao=3;assert.equal(await mudou.escolher('qtd','1 UNIDADE'),false);assert.equal(mudou.store.linha.det.qtd,undefined);assert.equal(mudou.store.escuta,null);for(const campo of ['linhaId','itemK','cycleKey','respostaId','origemResposta']){const alterado=mundo();alterado.store.linha.origemVencimento[campo]='outro-ficticio';assert.equal(await alterado.escolher('qtd','1 UNIDADE'),false);assert.equal(alterado.store.linha.det.qtd,undefined);assert.equal(alterado.store.escuta,null)}const aplicado=mundo();aplicado.store.linha.det.cuidado57_estado='realizado-conferido';assert.equal(await aplicado.escolher('qtd','1 UNIDADE'),false);assert.equal(aplicado.store.linha.det.qtd,undefined);assert.equal(aplicado.store.escuta,null);console.log('quantidade156: OK');})().finally(()=>clearTimeout(watchdog)).catch(e=>{console.error(e);process.exitCode=1});
