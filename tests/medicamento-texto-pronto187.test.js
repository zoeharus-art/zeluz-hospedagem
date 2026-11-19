'use strict';
// 19/11/2026, Adriana: (1) «Falta aqui colocar o nome do medicamento, para já salvar no que reservar quando comprado na Zêluz...
// O que separar só está pipeta, precisa do nome... como o vermífugo também, precisa de nome.»
// (2) «Quando não enviar, deixar o texto pronto, para copiar e colar, acelerando o humano.»
// Dados inventados, sem rede e sem banco.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const html = fs.readFileSync(path.resolve(__dirname, '../auaulandia/index.html'), 'utf8');
const MU = require('../zelozinha/simples/mensagem-unica41');
let falhas = 0, total = 0;
function prova(nome, fn) { total++; try { fn(); console.log('  ✓ ' + nome); } catch (e) { falhas++; console.log('  ✗ ' + nome + '\n      ' + String(e && e.message || e).split('\n').join('\n      ')); } }
function script(id) { const m = html.match(new RegExp('<script[^>]*id="' + id + '"[^>]*>([\\s\\S]*?)<\\/script>')); assert.ok(m, 'script ' + id); return m[1]; }
function trecho(ini, fim) { const a = html.indexOf(ini), b = html.indexOf(fim, a + ini.length); assert.ok(a >= 0 && b > a, 'trecho ' + ini); return html.slice(a, b); }

const puro = {}; vm.createContext(puro); vm.runInContext(script('zelozinha-tela94-puro'), puro);
const T = puro.ZelozinhaTela94;
const tp = { Intl, Date, JSON, Object, Array, String, RegExp }; tp.globalThis = tp; vm.createContext(tp); vm.runInContext(script('zelozinha-texto-pronto'), tp);
const TP = tp.ZelozinhaTextoPronto;
const listas = {}; vm.createContext(listas);
vm.runInContext(trecho('  var DASH_PIPETA_NOME=[', '  var DASH_ONDE=[').replace(/var DASH_ONDE=\[$/, '') + ';this.P=DASH_PIPETA_NOME;this.V=DASH_VERM_NOME;this.ehPip=dashEhPipeta;', listas);
vm.runInContext(trecho('  function dashNomeParaFicha(lista, v){', '  function dashPrevFichaPatch(') + ';this.nf=dashNomeParaFicha;', listas);

console.log('O nome do medicamento:');
prova('as listas têm os produtos do Empório e um «Outro»; a pergunta da pipeta só aparece com a pipeta', () => {
  assert.deepEqual(Array.from(listas.P.map((x) => x.t).slice(0, 4)), ['Vectra 3D', 'Advantage Max3', 'Fiprolex', 'NeoPet']);
  assert.equal(listas.P[listas.P.length - 1].t, 'Outra');
  assert.deepEqual(Array.from(listas.V.map((x) => x.t).slice(0, 2)), ['Drontal Plus', 'Endogard']);
  assert.equal(listas.ehPip('PIPETA · 30 DIAS'), true); assert.equal(listas.ehPip('PIPETA · 45 DIAS'), true); assert.equal(listas.ehPip('BRAVECTO · 90 DIAS'), false);
  assert.match(html, /\{c:'nome', rot:'Qual vermífugo\?',\s+ops:DASH_VERM_NOME, obrig:true\}/);
  assert.match(html, /\{c:'nome', rot:'Qual pipeta\?',\s+ops:DASH_PIPETA_NOME, obrig:true, dep:\{c:'prod', f:dashEhPipeta\}\}/);
  assert.match(html, /if\(typeof c\.dep\.f==='function'\) return !!c\.dep\.f\(d\[c\.dep\.c\]\);/, 'a pergunta condicional aceita função');
});
prova('no cartão da Zelozinha: vermífugo pede o nome; carrapaticida só com pipeta', () => {
  assert.equal(JSON.stringify(T.camposDoCuidado('verm_p')), JSON.stringify(['nome', 'qtd', 'onde']));
  assert.equal(T.pedeNome('verm_p', {}), true);
  assert.equal(T.pedeNome('ecto_p', { prod: 'PIPETA · 30 DIAS' }), true);
  assert.equal(T.pedeNome('ecto_p', { prod: 'BRAVECTO · 90 DIAS' }), false);
  assert.equal(T.pedeNome('col_p', {}), false);
  assert.deepEqual(Array.from(T.faltaEscolher('verm_p', { qtd: '1 COMPRIMIDO' }, '')), ['nome']);
  assert.deepEqual(Array.from(T.faltaEscolher('ecto_p', { prod: 'PIPETA · 30 DIAS', qtd: 'PIPETA' }, '')), ['nome']);
  assert.deepEqual(Array.from(T.faltaEscolher('ecto_p', { prod: 'BRAVECTO · 90 DIAS', qtd: '1 COMPRIMIDO' }, '')), []);
});
prova('gravar o nome: aceito no vermífugo e na pipeta; trocar para comprimido apaga o nome da pipeta; nome no comprimido é recusado', () => {
  const linha = (itemK, det) => ({ det: Object.assign({ cuidado57_estado: 'conferir-orientacao' }, det), origemVencimento: { protocolo: 'cuidado57', linhaId: 'l1', respostaId: 'r1', revisao: 0, itemK } });
  const esp = (itemK) => ({ linhaId: 'l1', respostaId: 'r1', revisao: 0, itemK });
  let r = T.mesclarEscolha(linha('verm_p', {}), esp('verm_p'), { campo: 'nome', valor: 'DRONTAL PLUS' });
  assert.equal(r.ok, true); assert.equal(r.linha.det.nome, 'DRONTAL PLUS');
  r = T.mesclarEscolha(linha('ecto_p', { prod: 'PIPETA · 30 DIAS' }), esp('ecto_p'), { campo: 'nome', valor: 'VECTRA 3D' });
  assert.equal(r.ok, true); assert.equal(r.linha.det.nome, 'VECTRA 3D');
  r = T.mesclarEscolha(r.linha, esp('ecto_p'), { campo: 'prod', valor: 'BRAVECTO · 90 DIAS' });
  assert.equal(r.ok, true); assert.equal('nome' in r.linha.det, false, 'o nome da pipeta sai');
  r = T.mesclarEscolha(linha('ecto_p', { prod: 'BRAVECTO · 90 DIAS' }), esp('ecto_p'), { campo: 'nome', valor: 'VECTRA 3D' });
  assert.equal(r.ok, false);
  assert.equal(T.podeEscolher({ campo: 'nome', tarefaEstado: 'criada', snoopyConfirmado: true }).ok, true);
});
prova('a ficha recebe o nome bonito («Vectra 3D»); «Outra» não apaga o que a ficha sabe', () => {
  assert.equal(listas.nf(listas.P, 'VECTRA 3D'), 'Vectra 3D');
  assert.equal(listas.nf(listas.V, 'DRONTAL PLUS'), 'Drontal Plus');
  assert.equal(listas.nf(listas.P, 'OUTRA PIPETA'), '');
  assert.equal(listas.nf(listas.V, ''), '');
  assert.match(html, /patch\.verm_nome=nmV/); assert.match(html, /if\(nmE && prod==='Pipeta'\) patch\.ecto_nome=nmE/);
});
prova('o quadro «O que separar» e o cartão mostram o nome', () => {
  const sep = script('separar-quadro180');
  assert.match(sep, /if \(nm\) prod = nm \+ ' \(pipeta\)'/);
  assert.match(sep, /nomeEscolhido\(listaGlobal\('verm'\), det\.nome\)/);
  const ui = script('zelozinha-contatos89-ui');
  assert.match(ui, /T\.pedeNome\(cy\.itemK,det\)\?chipsHTML\(rotuloNome\(cy\.itemK\),'nome'/);
});

console.log('O texto pronto quando a Zelozinha não manda:');
prova('vacina em dia sem veterinária (caso do Romeo): texto formatado, com emojis, primeiro nome', () => {
  const r = TP.vacinaSemVet({ nomeTutor: 'Tutora', nomePeludo: 'Luna', dia: '2026-11-19', vacinas: [{ itemK: 'vac_raiva_p', vence: '2026-11-19' }] });
  assert.equal(r.ok, true);
  assert.equal(r.texto, ['Olá, Tutora, tudo bem? 💛', '', 'Luna está aqui com a gente hoje, aproveitando o dia. 🐾', 'A vacina antirrábica de Luna vence hoje.',
    'Podemos aplicar na próxima vinda, com a nossa equipe veterinária. Assim a proteção de Luna fica em dia, e a de todos os nossos Aulunos também.',
    'Qual dia fica melhor para você? 💛'].join('\n'));
  assert.match(TP.vacinaSemVet({ nomeTutor: 'Tutora', nomePeludo: 'Luna', dia: '2026-11-19', vacinas: [{ itemK: 'vac_mult_p', vence: '2026-11-10' }] }).texto, /A vacina múltipla de Luna venceu em 10\/11\/2026\./);
  assert.match(TP.vacinaSemVet({ nomeTutor: 'Tutora', nomePeludo: 'Luna', dia: '2026-11-19', vacinas: [{ itemK: 'vac_mult_p', vence: '2026-11-19' }, { itemK: 'vac_raiva_p', vence: '2026-11-20' }] }).texto, /As vacinas múltipla e antirrábica de Luna estão vencendo\./);
  assert.equal(TP.vacinaSemVet({ nomeTutor: '', nomePeludo: 'Luna', dia: '2026-11-19', vacinas: [{ itemK: 'vac_raiva_p', vence: '2026-11-19' }] }).ok, false);
});
prova('demais cuidados: o texto aprovado de sempre (mensagem-unica41), letra por letra; vacina sem veterinária vai numa caixa à parte', () => {
  const e = { nomeTutor: 'Tutora', nomePeludo: 'Luna', sexo: 'F', dia: '2026-11-19', vacinaHoje: false,
    pendentes: [{ itemK: 'verm_p', vence: '2026-11-19' }, { itemK: 'vac_raiva_p', vence: '2026-11-19' }] };
  const cx = TP.textos(e, MU.gerarMensagem);
  assert.equal(cx.length, 2);
  const esperado = MU.gerarMensagem({ nomeTutor: 'Tutora', nomePeludo: 'Luna', sexo: 'F', dia: '2026-11-19', presencaConfirmada: true, cuidados: [{ itemK: 'verm_p', vence: '2026-11-19' }], veterinariaConfirmada: false }).texto;
  assert.equal(cx[0].texto, esperado); assert.match(cx[0].titulo, /demais cuidados/);
  assert.match(cx[1].titulo, /vacina \(sem veterinária hoje\)/);
});
prova('com veterinária no dia (ficha «só contato humano»), vacina e demais vão juntos no texto de sempre', () => {
  const cx = TP.textos({ nomeTutor: 'Tutora', nomePeludo: 'Luna', sexo: 'F', dia: '2026-11-18', vacinaHoje: true,
    pendentes: [{ itemK: 'verm_p', vence: '2026-11-18' }, { itemK: 'vac_raiva_p', vence: '2026-11-18' }] }, MU.gerarMensagem);
  assert.equal(cx.length, 1); assert.match(cx[0].texto, /vacina antirrábica/i);
});
prova('no cartão: só o que ficou sem envio e sem resposta; a escova continua com a equipe', () => {
  const ui = script('zelozinha-contatos89-ui');
  assert.match(ui, /textosProntosDe\(c,vms\)\.forEach\(function\(x\)\{out\.push\(\{tipo:'pronta'/);
  assert.match(ui, /k!=='escova_p'&&!v\.atual&&!v\.retorno143&&!v\.agendado&&st\.enviada!==true/);
});

console.log((falhas ? total - falhas + ' de ' + total + ' provas passaram, ' + falhas + ' falharam' : 'medicamento-texto-pronto187: ' + total + ' de ' + total + ' provas passaram'));
process.exitCode = falhas ? 1 : 0;
