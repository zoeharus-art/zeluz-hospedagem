'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const app = fs.readFileSync(path.join(__dirname, '..', 'auaulandia', 'index.html'), 'utf8');

function funcao(nome) {
  const inicio = app.indexOf('function ' + nome + '(');
  assert(inicio >= 0, 'função real não encontrada: ' + nome);
  const fim = app.indexOf('\n  function ', inicio + 10);
  return app.slice(inicio, fim < 0 ? app.length : fim);
}

const item = app.match(/\{k:'avaliacao',[\s\S]*?\},\r?\n\s*\/\/ O AVULSO/);
assert(item, 'item Avaliação existe antes de Avulso');
assert(item[0].includes('foraDoCadastro:true, campos:[]'), 'Avaliação passa pelo painel de confirmação');

for (const k of ['avulso', 'banho', 'medicacao']) {
  const linha = app.split(/\r?\n/).find(x => x.includes("{k:'" + k + "'"));
  assert(linha, k + ' continua presente');
  if (k === 'avulso') assert(!linha.includes('campos:[]'), 'Avulso não foi redirecionado ao painel da avaliação');
}

const painelComFicha = funcao('dashPainelHTML');
const painelSemFicha = funcao('dashForaPainelHTML');
const confirmar = funcao('dashLancarSel');
const lancar = funcao('dashLancar');
['dashEscolher','dashDetFalta','dashForaFalta','dashAvaliacaoMarcar','dashAvaliacaoDados','dashAvaliacaoPainelHTML','dashForaPainelHTML','dashPainelHTML','dashLancarSel','dashLancar']
  .forEach(nome => new vm.Script(funcao(nome), { filename: 'index.html#' + nome }));
assert(painelComFicha.includes("it.k==='avaliacao'"), 'cadastro selecionado mostra o formulário antes de confirmar');
assert(painelSemFicha.includes("k==='avaliacao'"), 'nome manual usa o mesmo formulário');
assert(confirmar.includes('dashDetFalta(k)') && confirmar.includes('dashLancar(k, sel)'), 'botão valida e entra pela porta dashLancar');
assert(lancar.includes("if(k==='avaliacao')") && lancar.includes('__det.avaliacao129=dashAvaliacaoDados()'), 'dashLancar anexa o contrato no registro original');
assert(lancar.includes("DB.ref('daycare/dashboard/'+__diaLanc+'/'+k).push()"), 'persiste no push original do dashboard');
assert(!lancar.includes('avaliacoes-gestao'), 'não cria segunda escrita para a avaliação');

const ctx = {
  DASH_DET: { avaliacao: {} },
  dashDet(k) { return ctx.DASH_DET[k]; }
};
vm.createContext(ctx);
vm.runInContext(funcao('dashAvaliacaoDados'), ctx);

ctx.DASH_DET.avaliacao = {
  tutor: '  Responsável   Exemplo  ', vacina: true, vermifugo: false,
  carrapaticida: true, experiencia: '  já frequentou   creche ',
  saude: ' acompanhamento informado ', observacoes: ' prefere adaptação gradual '
};
const dados = vm.runInContext('dashAvaliacaoDados()', ctx);
assert.deepEqual(JSON.parse(JSON.stringify(dados)), {
  tutor: 'Responsável Exemplo',
  vacina: { conferido: true },
  vermifugo: { conferido: false },
  carrapaticida: { conferido: true },
  experiencia: 'já frequentou creche',
  saude: 'acompanhamento informado',
  observacoes: 'prefere adaptação gradual'
});
assert.deepEqual(Object.keys(dados), ['tutor','vacina','vermifugo','carrapaticida','experiencia','saude','observacoes'], 'somente chaves canônicas');

const falta = funcao('dashDetFalta');
const faltaFora = funcao('dashForaFalta');
assert(falta.includes("k==='avaliacao'") && falta.includes("falta.push('Tutor')"), 'com cadastro exige tutor');
assert(faltaFora.includes("k==='avaliacao'") && faltaFora.includes("falta.push('Tutor')"), 'sem cadastro exige tutor além de nome e raça');
assert(faltaFora.indexOf("falta.push('Nome')") < faltaFora.indexOf("falta.push('Raça')"));
assert(faltaFora.indexOf("falta.push('Raça')") < faltaFora.indexOf("falta.push('Tutor')"));
assert(faltaFora.includes("falta.push('Horário')"), 'sem cadastro exige horário');
assert(falta.includes("falta.push('Horário')"), 'com cadastro exige horário');

assert(app.includes("DASH_DET[k].tutor=String((typeof pelGet==='function'?pelGet(__pa,'tutor'):'')||__pa.tutor||'').slice(0,60)"), 'cadastro selecionado preenche tutor sem inventar prevenção');
assert(!funcao('dashEscolher').includes('emdia_'), 'seleção não promove vencimento a conferido');
assert(funcao('dashAvaliacaoPainelHTML').includes('isto não autoriza aplicação clínica'), 'UI limita o alcance dos checks');

console.log('marcia-agendamento130: OK');
