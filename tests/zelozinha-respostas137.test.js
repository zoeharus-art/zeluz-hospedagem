'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.resolve(__dirname, '..');
const fonte = fs.readFileSync(path.join(raiz, 'auaulandia', 'index.html'), 'utf8');

function trecho(re, nome) {
  const m = fonte.match(re);
  assert.ok(m, nome + ' existe');
  return m[1];
}
function modulo(codigo, nome) {
  const box = { module: { exports: {} }, exports: {}, Buffer, Intl, Date, JSON, Object, Array, Number, String, RegExp, Error };
  vm.runInNewContext(codigo, box, { filename: nome });
  return box.module.exports;
}

const Core = modulo(trecho(/<script data-resposta88="core">([\s\S]*?)<\/script>/, 'core88'), 'resposta88-core-inline.js');
const Tela = modulo(trecho(/<script id="zelozinha-tela94-puro">([\s\S]*?)<\/script>/, 'tela94 pura'), 'zelozinha-tela94-puro.js');
const uiReal = trecho(/<script id="zelozinha-contatos89-ui">([\s\S]*?)<\/script>/, 'renderer real 6.94');
new vm.Script(uiReal, { filename: 'zelozinha-contatos89-ui.js' });
const appBox = { Intl, Date, JSON, Object, Array, Number, String, RegExp, Error, Promise, setTimeout, clearTimeout };
appBox.globalThis = appBox;
appBox.ZeluzResposta88 = Core;
vm.runInNewContext(trecho(/<script data-resposta88="app">([\s\S]*?)<\/script>/, 'app88'), appBox, { filename: 'resposta88-app-inline.js' });
const App = appBox.ZeluzRespostaApp88;

const DIA = '2026-10-26';
const CICLO = JSON.stringify(['pet-137', 'tutor-137', 'ecto', '2026-10-25', 'ecto_p']);
const GRUPO = JSON.stringify(['pet-137', 'tutor-137', DIA]);
const SHA = 'a'.repeat(64);
const CONTATO = 'contato-sintetico-137';

function base() {
  const dc = 'dc-sintetico-137';
  const contato = {
    versao: 89, tipo: 'contato_humano', status: 'feito', groupKey: GRUPO,
    dia: DIA, dcKey: dc, pelKey: 'pel-sintetico-137', petId: 'pet-137', tutorId: 'tutor-137',
    escopoSha: SHA, cycleKeys: [CICLO], itemKs: ['ecto_p'],
    humano: { id: 'consultora-137', nome: 'Consultora Sintética', role: 'consultora' },
    ts: Date.parse('2026-10-26T12:00:00.000Z')
  };
  const registro = { contatosHumanos89: {} };
  registro.contatosHumanos89[Core.codificarChave(CONTATO)] = contato;
  return {
    contatoId: CONTATO, groupKey: GRUPO,
    destino: {
      confirmado: true, dia: DIA, dcKey: dc, pelKey: contato.pelKey, petId: contato.petId, tutorId: contato.tutorId,
      presencaHistorica: true, escopoAtualSha: SHA,
      ciclos: [{ cycleKey: CICLO, itemK: 'ecto_p', tipo: 'ecto', elegivel: true, aberto: true }]
    },
    sessao: { confirmada: true, humana: true, id: 'consultora-137', nome: 'Consultora Sintética', papel: 'consultora', assinatura: 'sessao-sintetica-137' },
    registro, agora: '2026-10-26T14:00:00.000Z'
  };
}
function item(data, revisao) {
  return {
    cycleKey: CICLO, itemK: 'ecto_p', decisao: 'autorizar', origem: 'externo', onde: '', baseRevision: revisao,
    confirmacaoTutor137: { versao: 137, tipo: 'tutor_ja_fez', dataAplicacao: data, estado: 'atualizar_ficha_pendente' }
  };
}
function externo(revisao) {
  return { cycleKey: CICLO, itemK: 'ecto_p', decisao: 'autorizar', origem: 'externo', onde: '', baseRevision: revisao };
}

const e = base();
e.resposta = { id: 'r137-primeiro', itens: [item('2026-10-25', -1)] };
const salvo = Core.decidir(e);
assert.strictEqual(salvo.ok, true);
assert.strictEqual(salvo.alterou, true);
const rv = salvo.registro.respostasEscopo49.porCiclo[Core.codificarChave(CICLO)];
assert.deepStrictEqual(JSON.parse(JSON.stringify(rv.confirmacaoTutor137)), { versao: 137, tipo: 'tutor_ja_fez', dataAplicacao: '2026-10-25', estado: 'atualizar_ficha_pendente' });
assert.strictEqual(rv.humanoId, 'consultora-137', 'autoria humana canônica');
assert.strictEqual(rv.groupKey, GRUPO, 'identidade do cuidado preservada');
assert.strictEqual(rv.cycleKey, CICLO);
assert.strictEqual(rv.itemK, 'ecto_p');
assert.strictEqual(rv.revisao, 0);
assert.strictEqual(salvo.intencoes.length, 1);
assert.strictEqual(salvo.intencoes[0].tipo, 'ACOMPANHAR_FORA', 'não cria execução clínica');
assert.ok(!salvo.registro.respostasEscopo49.tarefas57, 'não cria tarefa Snoopy/Day Care');

const repeticao = base();
repeticao.registro = salvo.registro;
repeticao.resposta = { id: 'r137-repeticao', itens: [item('2026-10-25', 0)] };
const mesma = Core.decidir(repeticao);
assert.strictEqual(mesma.ok, true);
assert.strictEqual(mesma.alterou, false);
assert.strictEqual(mesma.status, 'ja_registrado');

const limpar = base();
limpar.registro = salvo.registro;
limpar.resposta = { id: 'r137-voltar-casa', itens: [externo(0)] };
const limpa = Core.decidir(limpar);
assert.strictEqual(limpa.ok, true);
assert.strictEqual(limpa.alterou, true, 'voltar para Vai fazer em casa não é no-op');
const rvLimpa = limpa.registro.respostasEscopo49.porCiclo[Core.codificarChave(CICLO)];
assert.strictEqual(rvLimpa.revisao, 1);
assert.strictEqual(rvLimpa.confirmacaoTutor137, undefined, 'correção humana retira o marcador atual');
assert.ok(limpa.registro.historicoRespostas49[0].itens[0].confirmacaoTutor137, 'histórico anterior continua preservado');
assert.strictEqual(limpa.registro.historicoRespostas49.length, 2);
assert.ok(!limpa.registro.respostasEscopo49.tarefas57, 'correção não cria tarefa clínica');

const refazer = base();
refazer.registro = limpa.registro;
refazer.resposta = { id: 'r137-refazer', itens: [item('2026-10-24', 1)] };
const refeita = Core.decidir(refazer);
assert.strictEqual(refeita.ok, true);
assert.strictEqual(refeita.registro.respostasEscopo49.porCiclo[Core.codificarChave(CICLO)].revisao, 2, 'Vai fazer em casa → Tutor já fez também incrementa revisão');

const correcao = base();
correcao.registro = salvo.registro;
correcao.resposta = { id: 'r137-correcao', itens: [item('2026-10-24', 0)] };
const corrigida = Core.decidir(correcao);
assert.strictEqual(corrigida.ok, true);
assert.strictEqual(corrigida.registro.respostasEscopo49.porCiclo[Core.codificarChave(CICLO)].revisao, 1, 'nova data exige nova revisão CAS');

[['2026-10-27', 'futuro'], ['2026-02-30', 'data civil inexistente']].forEach(function (caso, n) {
  const entrada = base();
  entrada.resposta = { id: 'r137-invalida-' + n, itens: [item(caso[0], -1)] };
  assert.strictEqual(Core.decidir(entrada).ok, false, caso[1] + ' é recusado');
});

const clinico = base(), comProduto = item('2026-10-25', -1);
comProduto.confirmacaoTutor137.produto = 'não permitido';
clinico.resposta = { id: 'r137-campo-clinico', itens: [comProduto] };
assert.strictEqual(Core.decidir(clinico).ok, false, 'produto/validade não entram no metadado 137');

const origem = base(), loja = item('2026-10-25', -1);
loja.origem = 'loja';
origem.resposta = { id: 'r137-origem-errada', itens: [loja] };
assert.strictEqual(Core.decidir(origem).ok, false, 'Tutor já fez não pode virar execução na Zêluz');

const textoVacina = 'Combinado, Ana! 💛\n\nDepois da vacinação, você nos envia uma foto do cartão com a data, a assinatura e o carimbo do veterinário?\n\nAssim, mantemos a ficha atualizada e cuidamos, juntos, da segurança e do bem-estar de todos os nossos Aulunos.';
const textoGeral = 'Combinado, Ana! 💛\n\nDepois desse cuidado, você nos informa a data e o produto usado?\n\nAssim, mantemos a ficha atualizada e cuidamos, juntos, da segurança e do bem-estar de todos os nossos Aulunos.';
assert.strictEqual(App.textoEmCasa({ tutor: 'Ana' }, 'vac_raiva_p'), textoVacina, 'texto aprovado de vacina permanece byte a byte');
assert.strictEqual(App.textoEmCasa({ tutor: 'Ana' }, 'ecto_p'), textoGeral, 'texto aprovado geral permanece byte a byte');
assert.strictEqual(App.textoTutorJaFez({ tutor: 'Ana', pet: 'Luna' }, 'ecto_p', '2026-10-25'), 'Obrigada por nos avisar, Ana! 💛\n\nVamos atualizar a ficha de Luna com o cuidado realizado em 25/10/2026.\n\nManter essas informações em dia nos ajuda a cuidar da segurança e do bem-estar de todos os nossos Aulunos.');
const card = { nomeTutor: 'Ana', nomePeludo: 'Luna' }, ciclo = { itemK: 'ecto_p' };
assert.strictEqual(App.mensagemAprovada(card, ciclo, { decisao: 'autorizar', origem: 'loja', confirmacaoTutor137: item('2026-10-25', 0).confirmacaoTutor137 }, {}), '', 'marcador stale fora da origem externa não mostra agradecimento');
assert.strictEqual(App.mensagemAprovada(card, ciclo, { decisao: 'autorizar', origem: 'externo', confirmacaoTutor137: item('9999-12-31', 0).confirmacaoTutor137 }, {}), textoGeral, 'data futura impossível não mostra agradecimento');

const pronto = [{ dcKey: 'dc-1', cuidados: [{ respostaSalva: true, linhaObrigatoria: false, linhaConfirmada: false, bloqueado: false, tarefaOrfa: false }] }];
assert.strictEqual(Tela.classificarFilas117(pronto).emAndamento.length, 1, 'sem pin, resposta externa segue para Em andamento');
const fixo = Tela.classificarFilas117(pronto, { 'dc-1': true });
assert.strictEqual(fixo.paraResolver.length, 1, 'pin do controlador mantém o mesmo cartão visível');
assert.strictEqual(fixo.emAndamento.length, 0);

const mesmoCiclo = JSON.stringify(['ciclo', 'compartilhado']), cuidadosPorPet = {
  'dc-pet-a': [{ cycleKey: mesmoCiclo, itemK: 'vac_p' }, { cycleKey: mesmoCiclo, itemK: 'ecto_p' }],
  'dc-pet-b': [{ cycleKey: mesmoCiclo, itemK: 'vac_p' }, { cycleKey: mesmoCiclo, itemK: 'ecto_p' }]
};
const chavesAntes = Object.keys(cuidadosPorPet).flatMap(function (dc) {
  return cuidadosPorPet[dc].map(function (c) { return Tela.chaveRascunho137(dc, c.cycleKey, c.itemK); });
});
assert.strictEqual(new Set(chavesAntes).size, 4, 'dois pets no mesmo ciclo e dois cuidados têm identidades únicas');
const rascunhos = {};
rascunhos[Tela.chaveRascunho137('dc-pet-a', mesmoCiclo, 'ecto_p')] = '2026-10-24';
rascunhos[Tela.chaveRascunho137('dc-pet-b', mesmoCiclo, 'vac_p')] = '2026-10-25';
Object.keys(cuidadosPorPet).reverse().forEach(function (dc) {
  cuidadosPorPet[dc].slice().reverse().forEach(function (c) {
    const k = Tela.chaveRascunho137(dc, c.cycleKey, c.itemK);
    if (dc === 'dc-pet-a' && c.itemK === 'ecto_p') assert.strictEqual(rascunhos[k], '2026-10-24', 'reordenação preserva o rascunho no cuidado correto do pet A');
    if (dc === 'dc-pet-b' && c.itemK === 'vac_p') assert.strictEqual(rascunhos[k], '2026-10-25', 'reordenação preserva o rascunho no cuidado correto do pet B');
  });
});
const idsData = chavesAntes.map(function (k) { return 'zt694-tutor-fez-' + encodeURIComponent(k); });
assert.strictEqual(new Set(idsData).size, 4, 'ids de input derivados da mesma identidade também são únicos');

assert.match(fonte, />Tutor já fez<\/button>/);
assert.match(fonte, /data-zt694-data-fez/);
assert.match(fonte, /Agradecimento ao tutor, pronto para copiar/);
assert.match(fonte, /Atualizar ficha — pendente/);
const gravar = fonte.slice(fonte.indexOf('async function gravarRespostas'), fonte.indexOf('async function preMarcar'));
assert.match(gravar, /estado\.fixosResolver\[dc\]=true/);
assert.doesNotMatch(gravar, /abrirRota117\(/, 'respostas permanecem no cartão sem trocar a aba');
assert.match(fonte, /if\(reler\)\{estado\.fixosResolver=\{\}/, 'Atualizar envios libera a reclassificação normal');
assert.match(fonte, /estado\.datasTutor137\[T\.chaveRascunho137\(dc,cycleKey,itemK\)\]/, 'input guarda o rascunho pela identidade estável, sem índice visual');
assert.match(fonte, /dataId='zt694-tutor-fez-'\+encodeURIComponent\(dataKey\)/, 'id do input deriva da identidade completa do pet, ciclo e cuidado');
assert.doesNotMatch(fonte, /datasTutor137\[dc\+'\|'\+i\]/, 'nenhuma rota de rascunho continua dependente da posição visual');
assert.match(fonte, /addEventListener\('input',aoDigitarData137,true\)/, 'controlador captura o rascunho antes do refresh');
assert.match(uiReal, /petHTML\(p\.contato\)/, 'a fila usa o renderer real do cartão');
assert.match(uiReal, /\+corpo\+copiaHTML\(c,vms\)\+/, 'o mesmo cartão recomposto contém a caixa de copiar');
assert.match(uiReal, /el\.innerHTML=montarMarkup\(filaDoAlvo\(el\)\)/, 'o repintar DOM recompõe a fila visível com o pin');

console.log('zelozinha-respostas137: provas passaram (mensagem antiga exata, mesmo cartão, data real, autoria/identidade/revisão, CAS e nenhum cuidado clínico fabricado).');
