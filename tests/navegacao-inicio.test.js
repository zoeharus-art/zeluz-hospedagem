'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const raiz = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(raiz, 'auaulandia', 'index.html'), 'utf8');
const modulo = require(path.join(raiz, 'auaulandia', 'navegacao-inicio.js'));

function podeDe(lista) {
  const permitidas = new Set(lista);
  return (capacidade) => permitidas.has(capacidade);
}

assert.equal(modulo.escolherPorta(podeDe(['painel-consultoras'])).rota, 'consultoras');
assert.equal(modulo.escolherPorta(podeDe(['painel-amanda', 'painel-consultoras'])).rota, 'painel-amanda');
assert.equal(modulo.escolherPorta(podeDe(['painel-operacao', 'painel-amanda'])).rota, 'gestaomarcia');
assert.equal(modulo.escolherPorta(podeDe(['painel-diretoria', 'painel-operacao'])).rota, 'painel-diretoria');
assert.equal(modulo.escolherPorta(podeDe(['painel-monitor'])).rota, 'painelmeu');
assert.equal(modulo.escolherPorta(podeDe([])), null);

const supervisor = modulo.escolherPorta(podeDe(['painel-amanda', 'painel-consultoras']));
assert.deepEqual(supervisor.atalhos.map((x) => x.rota), ['consultoras']);
const diretoria = modulo.escolherPorta(podeDe(['painel-diretoria', 'painel-operacao', 'painel-amanda', 'historico-checkins']));
assert.deepEqual(diretoria.atalhos.map((x) => x.rota), ['gestaomarcia', 'painel-amanda', 'historicocheckins']);

for (const porta of modulo.PORTAS) {
  assert.match(html, new RegExp('id="v-' + porta.rota.replace(/[.*+?^\${}()|[\]\\]/g, '\\$&') + '"'));
}

const inicio = html.match(/<section class="view active" id="v-inicio">([\s\S]*?)<\/section>/);
assert.ok(inicio, 'a porta inicial existe');
assert.match(inicio[1], /id="inicioPortaConteudo"/);
assert.doesNotMatch(inicio[1], /pendGrid|kpiTotal|cardCarteira/, 'a home não recompõe a grade genérica');
assert.ok(html.includes('data-v="mesa" class="so-mesa"') && html.includes('>Visão por setor</span>'));
assert.match(html, /id="v-mesa"/, 'a rota antiga continua acessível');
for (const texto of ['Meu dia', 'Recepção', 'Day Care e Hotel', 'Gestão da operação', 'Diretoria', 'Cadastros e ajustes', 'Conhecer a família']) {
  assert.ok(html.includes(texto), 'rótulo ausente: ' + texto);
}
assert.match(html, /data-acc-toggle="servicos"[^>]*><span[^>]*><\/span><span>Day Care e Hotel<\/span>/);

const inicioCodigo = html.slice(html.indexOf('  function inicioPortaEscolher()'), html.indexOf("  document.getElementById('nav').addEventListener", html.indexOf('  function inicioPortaEscolher()')));
assert.ok(inicioCodigo.includes('podePapel(capacidade)'), 'a porta consulta a capacidade real');
assert.doesNotMatch(inicioCodigo, /DB\.|\.once\(|\.on\(|\.set\(|\.update\(/, 'a porta não cria leitura nem gravação');

const scripts = Array.from(html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g));
const inline = scripts.at(-1)[1];
assert.doesNotThrow(() => new vm.Script(inline, { filename: path.join(raiz, 'auaulandia', 'index.html#inline-script-' + scripts.length) }), 'o script inline mantém sintaxe válida');

function renderCom(capacidades, sessao, usuarioAtualAusente) {
  const area = { innerHTML: '' };
  const navegadas = [];
  const contexto = {
    console,
    document: { getElementById: (id) => id === 'inicioPortaConteudo' ? area : null },
    podePapel: podeDe(capacidades),
    esc: (v) => String(v),
    escAttr: (v) => String(v),
    irParaView: (rota) => navegadas.push(rota)
  };
  if (!usuarioAtualAusente) contexto.usuarioAtual = () => sessao === false ? null : { role: 'consultora' };
  vm.createContext(contexto);
  vm.runInContext(fs.readFileSync(path.join(raiz, 'auaulandia', 'navegacao-inicio.js'), 'utf8'), contexto);
  vm.runInContext(inicioCodigo, contexto);
  contexto.inicioPortaRender();
  return { area, navegadas, contexto };
}

const consultora = renderCom(['painel-consultoras', 'historico-checkins']);
assert.match(consultora.area.innerHTML, /Recepção/);
assert.match(consultora.area.innerHTML, /Histórico de hospedagens/);
function clicarMarkup(area, contexto, rotaMarkup, rotaDataset) {
  const botao = Array.from(area.innerHTML.matchAll(/<button\b([^>]*)>/g))
    .find((m) => m[1].includes('data-rota="' + rotaMarkup + '"'));
  assert.ok(botao, 'botão gerado para ' + rotaMarkup);
  const rota = botao[1].match(/data-rota="([^"]*)"/)[1];
  const onclick = botao[1].match(/onclick="([^"]*)"/)[1];
  const executar = vm.runInContext('(function(){' + onclick + '})', contexto);
  executar.call({ dataset: { rota: rotaDataset === undefined ? rota : rotaDataset } });
}

clicarMarkup(consultora.area, consultora.contexto, 'consultoras');
clicarMarkup(consultora.area, consultora.contexto, 'historicocheckins');
// Simula dataset adulterado usando onclick gerado; a autorização é revalidada.
clicarMarkup(consultora.area, consultora.contexto, 'consultoras', 'painel-diretoria');
assert.deepEqual(consultora.navegadas, ['consultoras', 'historicocheckins']);

const semSessao = renderCom(['painel-consultoras'], false);
assert.match(semSessao.area.innerHTML, /área autorizada/);
semSessao.contexto.inicioPortaIr('consultoras');
assert.deepEqual(semSessao.navegadas, []);

const semUsuarioAtual = renderCom(['painel-consultoras'], true, true);
assert.match(semUsuarioAtual.area.innerHTML, /área autorizada/);
semUsuarioAtual.contexto.inicioPortaIr('consultoras');
assert.deepEqual(semUsuarioAtual.navegadas, []);

console.log('navegacao-inicio.test.js: ok');
