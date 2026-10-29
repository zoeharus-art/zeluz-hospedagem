'use strict';

// A ficha do peludinho em 8 abas (Adriana, 28/out/2026, maquete aprovada — versão 2). O princípio é MOVER, não reescrever:
// esta prova monta a ficha de verdade (o app inteiro num sandbox, com um FILHOt inventado), confere que TODOS os rótulos da ficha
// antiga continuam presentes (a lista abaixo saiu do abrirPeludinho do master), que as 8 abas existem na ordem, que o Resumo abre
// primeiro, que Monitora e Veterinária não veem Plano nem Com o tutor, que o comedouro lento grava as duas chaves e que a restrição
// grava `restricao` e `almoco-cad.restr`. Sem rede e sem banco real: banco de mentira, nomes «Exemplo», tudo inventado.
//
// Para refazer a lista de rótulos antigos: extraia o texto estático (sem as expressões ${…}) de `abrirPeludinho` em
//   git show origin/master:auaulandia/index.html   (labels, h2, h3, nomes de sanfona, abas, botões e dicas).

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const APP = path.join(__dirname, '..', 'auaulandia', 'index.html');
const html = fs.readFileSync(APP, 'utf8');

// ------------------------------------------------------------------------- o que a ficha ANTIGA tinha
const ROTULOS_ANTIGOS = [
  "Raça",
  "Data de nascimento",
  "Sexo",
  "Castrado?",
  "Microchip",
  "Tutor 1 (nome)",
  "Tutor 2 (nome) — guarda compartilhada",
  "Tutor principal (quem responde pelos cuidados)",
  "Data de matrícula",
  "Plano Day Care — início",
  "Plano Day Care — fim (vencimento)",
  "Frequência (automática pelos dias)",
  "Já fez check-up?",
  "Último check-up (fez em)",
  "Última troca de escova de dentes",
  "EMERGÊNCIA — veterinário(a) de confiança do tutor",
  "Veterinário(a) — nome",
  "Veterinário(a) — telefone",
  "Clínica — nome",
  "Clínica — endereço",
  "Alimentação em casa (ração / dose)",
  "Passeia?",
  "Xixi e cocô",
  "ALIMENTAÇÃO — o que e quanto ele come",
  "Ração (marca)",
  "Quanto de ração por refeição",
  "Comida natural (o quê)",
  "Quanto de natural por refeição",
  "Horários das refeições",
  "Em quais refeições",
  "Mistura ração com natural?",
  "Observação da comida",
  "Em casa",
  "Com pessoas",
  "Com outros peludos",
  "Medos",
  "Já atacou outro peludo?",
  "Brincadeira favorita",
  "Alergia",
  "Restrição alimentar",
  "Medicação",
  "Algum problema de saúde",
  "O que o tutor contou",
  "Manias",
  "Em adaptacao (45 dias)?",
  "Adaptacao comecou em",
  "Adaptacao de que?",
  "Come em comedouro lento?",
  "Restrição no Enriquecimento Ambiental (EA)",
  "Matilha (EA)",
  "Dados do peludinho",
  "Prevenção",
  "Medicamentos de uso contínuo",
  "Rotina & alimentação",
  "Comportamento",
  "Plano",
  "Exames do corpo",
  "Atenção · Saúde e Cuidados",
  "Vacinas",
  "Antiparasitários",
  "Peso",
  "Histórico de check-ins",
  "Fotos do corpo",
  "Família e contatos",
  "Plano atual",
  "Almoço na creche — aparece na grade do Day Care",
  "Mensagens para o tutor",
  "Saída do Day Care",
  "Rotina, adaptação e relato do tutor",
  "Enriquecimento ambiental",
  "Identificação",
  "Medicamentos",
  "Com o tutor",
  "Rotina & Almoço",
  "Atenção & Cuidados",
  "← Voltar",
  "📷 Inserir foto",
  "💾 Salvar foto",
  "Copiar para o tutor",
  "🔎 Conferir alterações",
  "Voltar",
  "Alterar na aba Plano — com resumo antes de gravar e opção de desfazer.",
  "Calculado pelo sistema a partir do plano e da data do pagamento. Alterar na aba Plano .",
  "Obrigatório para frequentar o Day Care. O que estiver vencido aparece como urgente para a Gestão, a Supervisora e a Consultora. Nos tópicos com Salvar , confirme no fim do bloco; check-up e escova atualizam ao escolher.",
  "O check-up vale por 12 meses. Quem nunca fez, ou está vencido, aparece na tela Prevenção com o convite pronto.",
  "Pipeta, comprimido, coleira, vermífugo e exame de fezes. Nada aqui é vacina — o que vencer neste bloco não é dose de vacina atrasada.",
  "O que este FILHOt toma sempre — cardíaco, tireoide, dor crônica. Esta lista vai inteira para o Check-in da hospedagem , onde a Consultora confirma com o tutor item por item. Diga quando dar (\"45 min antes do jantar\") que o app calcula a hora sozinho, pelo horário da refeição da casa. Nada grava antes de Salvar medicamentos .",
  "Montando o histórico com o tutor…",
  "Planos DayCare 2026. A tabela é por mês (a mensalidade); o valor do plano é a mensalidade vezes os meses do tipo (1 no mensal, 3 no trimestral, 6 no semestral), pago à vista. Desconto: 2º peludinho %, 3º %.",
  "Só quando o FILHOt deixa de ser auluno. Ele sai das listas do dia, mas o cadastro e todo o histórico continuam guardados em Relatórios › Inativos.",
  "Em todo check-in e check-out do Day Care, o monitor examina o corpo inteiro, ponto a ponto, com foto obrigatória do que estiver alterado. \"Tudo normal\" quer dizer que todos os pontos abaixo foram olhados e nada chamou a atenção.",
  "O que é analisado em cada exame: — e ainda xixi, cocô (com protocolo próprio para alteração) e vômito.",
  "Carregando…",
  "Cada alteração marcada no check-in guarda a foto aqui por 21 dias. Toque na foto para ver em tamanho grande, baixar ou enviar ao tutor e à veterinária.",
  "Tudo que o monitor precisa saber antes de cuidar e dar o almoço.",
  "Day Care conta dias corridos. Hospedagem só registra a data — sem contagem automática.",
];
// O que SAIU de propósito (cada um com o porquê). Tudo o mais da lista acima tem de aparecer na ficha nova.
const SAIU_DE_PROPOSITO = {
  'Plano Day Care — início': 'o tópico «Plano atual» saiu do Cadastro: virou o atalho «Plano» do Resumo e continua na aba Plano (Vale até)',
  'Plano Day Care — fim (vencimento)': 'idem',
  'Frequência (automática pelos dias)': 'idem — os dias e a frequência continuam no cabeçalho e no atalho «Plano»',
  'Plano atual': 'o tópico saiu do Cadastro (atalho do Resumo)',
  'Alterar na aba Plano — com resumo antes de gravar e opção de desfazer.': 'dica do tópico «Plano atual», que saiu do Cadastro',
  'Calculado pelo sistema a partir do plano e da data do pagamento. Alterar na aba Plano .': 'idem',
  'Come em comedouro lento?': 'decisão 2 da dona: um campo só, «Comedouro lento?», em Alimentação (grava as duas chaves)',
  'Identificação': 'nome da aba antiga (virou Cadastro)',
  'Rotina & Almoço': 'nome da aba antiga (virou Rotina e alimentação)',
  'Atenção & Cuidados': 'nome da aba antiga (o conteúdo foi distribuído em Saúde, Comportamento e Rotina)',
  'Atenção · Saúde e Cuidados': 'título da aba antiga',
  'Rotina, adaptação e relato do tutor': 'sanfona antiga, repartida em Adaptação, Relato do tutor e Como ele é',
  'Medicamentos de uso contínuo': 'título da aba antiga: a sanfona se chama «Medicamentos» e a lista tem os subtítulos «Uso contínuo» e «Receitas da veterinária»',
  'Medicamentos': 'nome da aba antiga (virou a sanfona «Medicamentos» da aba Saúde — o rótulo continua presente como sanfona)',
  'Planos DayCare 2026. A tabela é por mês (a mensalidade); o valor do plano é a mensalidade vezes os meses do tipo (1 no mensal, 3 no trimestral, 6 no semestral), pago à vista. Desconto: 2º peludinho %, 3º %.': 'o texto tem números calculados (os descontos); está igual na aba Plano — conferido abaixo sem os números',
  'O que é analisado em cada exame: — e ainda xixi, cocô (com protocolo próprio para alteração) e vômito.': 'o trecho «— e ainda xixi, cocô… e vômito» repetia o que já está em CK_PONTOS; corrigido de propósito',
  'Day Care conta dias corridos. Hospedagem só registra a data — sem contagem automática.': 'o texto tem um número calculado (ADAPT_DIAS); está igual na sanfona Adaptação — conferido abaixo sem o número',
};
// Campos do cadastro que a ficha antiga gravava: cada um tem de continuar gravável na ficha nova.
const CHAVES_ANTIGAS = ['adaptacao', 'adaptacao_desde', 'adaptacao_tipo', 'alergia', 'alim_horarios', 'alim_mistura', 'alim_nat', 'alim_nat_qtd', 'alim_obs', 'alim_racao_marca', 'alim_racao_qtd', 'alimentacao', 'ansioso', 'atacou', 'bairro', 'banheiro', 'brincadeira', 'castrado', 'checkup_fez', 'comp_casa', 'comp_peludos', 'comp_pessoas', 'ea_restr', 'ea_restr_nao', 'indicou', 'manias', 'matilha', 'matricula', 'medicacao', 'medos', 'obs_tutor', 'passeia', 'problema', 'restricao', 'sexo', 'tel', 'tel2', 'tutor2', 'tutorPrinc', 'vetClinica', 'vetEnd', 'vetNome', 'vetTel'];
// `restricao` agora grava pelo pelRestrGravar (restricao + almoco-cad.restr) e `ansioso` pelo pelLentoGravar (ansioso + almoco-cad.lento).
const GRAVA_POR_FUNCAO = { restricao: 'pelRestrGravar', ansioso: 'pelLentoGravar' };
const IDS_ANTIGOS = ['fichaTutorRoot', 'fmed-status', 'fmedAcoes', 'fmedItens', 'pel-saved', 'pel-saved2', 'pelAlertaPrev_antip', 'pelAlertaPrev_saude', 'pelAlertaPrev_vacina', 'pelAlmocoAviso', 'pelAtivsEdit', 'pelAv', 'pelCategoriaEdit', 'pelDiasEdit', 'pelFichaRaca', 'pelFotoFile', 'pelFotoSt', 'pelFotosCorpo', 'pelFotosCorpoWrap', 'pelHistCk', 'pelMedLinha', 'pelPills2', 'pelTutorLinha', 'ps-comp', 'ps-ident', 'ps-plano', 'ps-rotina', 'ps-saude', 'ps-tutor'];
// Ids que saíram de propósito: pelFreqInput (a «Frequência» somente leitura do tópico «Plano atual») e as abas ps-med, ps-exames e ps-atencao
// (o conteúdo delas virou sanfonas da aba Saúde, Comportamento e Rotina).

// ------------------------------------------------------------------------- o app inteiro num sandbox, sem rede e sem banco
function universal(name) {
  const fn = function () { return fn; };
  return new Proxy(fn, {
    get(t, p) { if (p === Symbol.toPrimitive) return () => ''; if (p === 'then') return undefined; if (p in t) return t[p]; return universal(name + '.' + String(p)); },
    set() { return true; }, apply() { return universal(name + '()'); }, construct() { return universal('new ' + name); },
  });
}
function elemento(id) {
  return { id, innerHTML: '', style: { setProperty() {} }, dataset: {}, className: '', value: '', textContent: '', open: false, offsetParent: {}, offsetHeight: 0,
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    querySelector() { return null; }, querySelectorAll() { return []; }, addEventListener() {}, setAttribute() {}, getAttribute() { return null; },
    appendChild() {}, scrollIntoView() {}, click() {}, closest() { return null; } };
}
function scriptsDoApp(texto) {
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi; let m; const todos = [];
  while ((m = re.exec(texto)) !== null) todos.push(m[1]);
  let principal = '', k = -1;
  todos.forEach((t, i) => { if (t.length > principal.length) { principal = t; k = i; } });
  // os <script> inline que vêm ANTES do principal (ex.: o ZeluzCadastroLinha115) entram junto
  return todos.slice(0, k).join('\n;\n') + '\n;\n' + principal;
}
function abrirApp() {
  const els = {};
  const getEl = (id) => (els[id] = els[id] || elemento(id));
  const corpo = { dataset: { role: 'gestao' }, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, appendChild() {}, style: {}, addEventListener() {}, setAttribute() {}, getAttribute() { return null; } };
  const doc = { body: corpo, head: { appendChild() {} }, documentElement: universal('documentElement'), getElementById: getEl, querySelector() { return null; }, querySelectorAll() { return []; }, createElement() { return universal('el'); }, addEventListener() {}, getElementsByClassName() { return []; }, getElementsByTagName() { return []; }, cookie: '', activeElement: null };
  const nunca = new Promise(() => {});
  const sandbox = { console, Date, Math, JSON, Object, Array, String, Number, Boolean, parseInt, parseFloat, isNaN, isFinite, RegExp, Promise, Map, Set, Symbol, encodeURIComponent, decodeURIComponent,
    setTimeout() {}, clearTimeout() {}, setInterval() {}, clearInterval() {}, requestAnimationFrame() {}, performance: { now() { return 0; } }, document: doc,
    firebase: { initializeApp() { return {}; }, auth() { return { signInAnonymously() { return nunca; }, onAuthStateChanged() {} }; }, database() { return { ref() { return universal('ref'); } }; } },
    localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} }, navigator: { userAgent: 'prova', onLine: true }, location: { href: 'https://prova.local/', reload() {}, hostname: 'prova.local' },
    Blob: class Blob {}, alert() {}, confirm() { return true; }, prompt() { return ''; }, scrollTo() {}, addEventListener() {}, getComputedStyle() { return {}; } };
  sandbox.window = sandbox; sandbox.globalThis = sandbox; sandbox.self = sandbox;
  const ctx = vm.createContext(sandbox);
  vm.runInContext(scriptsDoApp(html), ctx, { filename: 'index.html#script', timeout: 30000 });
  const run = (c) => vm.runInContext(c, ctx);
  return { ctx, run, els, doc };
}

const A = abrirApp();
const { run, els, doc } = A;
const lista = (v) => JSON.parse(JSON.stringify(v));
const limpa = (s) => s.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&mdash;/g, '—').replace(/&hellip;/g, '…').replace(/&ldquo;|&rdquo;/g, '"').replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();

// Um FILHOt inventado (fêmea, não castrada, para o Cio aparecer) e a ficha desenhada para um papel.
function fichaDe(papel, extra, almoco) {
  doc.body.dataset.role = papel || 'gestao';
  ctxSet('PELUDINHOS', [{ n: 'Biscoito', tutor: 'Tutor Exemplo', raca: 'Beagle', freq: '3x', dias: ['seg', 'qui', 'sex'] }]);
  run('pelCadCache={}; almCadCache={}; pelAtual=null;');
  A.ctx.__extra = Object.assign({ sexo: 'Fêmea', castrado: 'Não' }, extra || {});
  A.ctx.__alm = almoco || null;
  run('pelCadCache[pelKey(PELUDINHOS[0])]=__extra; if(__alm) almCadCache[pelKey(PELUDINHOS[0])]=__alm;');
  run("pelOrigem='peludinhos'; abrirPeludinho(0);");
  return els['pel-ficha'].innerHTML;
}
function ctxSet(nome, valor) { A.ctx.__v = valor; run(nome + '=__v;'); }
function painel(h, id) {   // o texto de um painel da ficha (do seu <div class="ppanel2" id=…> até o próximo painel)
  const i = h.indexOf('id="' + id + '"'); assert.ok(i > 0, 'painel ausente: ' + id);
  const j = h.indexOf('<div class="ppanel2', i + 10);
  return h.slice(i, j < 0 ? undefined : j);
}
function corpoDe(texto, nome) {
  const i = texto.search(new RegExp('\\n  (async )?function ' + nome + '\\('));
  assert.ok(i >= 0, 'função ausente: ' + nome);
  const j = texto.slice(i + 10).search(/\n  (async )?function \w+\(/);
  return texto.slice(i, j < 0 ? undefined : i + 10 + j);
}

let n = 0;
const fila = [];
function prova(nome, fn) { fila.push([nome, fn]); }

// ------------------------------------------------------------------------- as 8 abas
const ABAS = ['Resumo', 'Cadastro', 'Plano', 'Saúde', 'Prevenção', 'Comportamento', 'Rotina e alimentação', 'Com o tutor'];
const PAINEIS = ['ps-resumo', 'ps-ident', 'ps-plano', 'ps-saudeg', 'ps-saude', 'ps-comp', 'ps-rotina', 'ps-tutor'];

prova('as 8 abas existem, na ordem; só Plano e Com o tutor são sensíveis; os 8 painéis vêm na mesma ordem', () => {
  const h = fichaDe('gestao');
  const abas = [...h.matchAll(/<div class="subtab2([^"]*)" onclick="([^"]*)">([^<]*)<\/div>/g)].map((m) => ({ cls: m[1].trim(), onclick: m[2], txt: m[3] }));
  assert.deepStrictEqual(abas.map((a) => a.txt), ABAS);
  assert.deepStrictEqual(abas.filter((a) => /so-sensivel/.test(a.cls)).map((a) => a.txt), ['Plano', 'Com o tutor']);
  assert.deepStrictEqual(abas.map((a) => (/pelSubtab\(this,'(ps-[a-z]+)'\)/.exec(a.onclick) || [])[1]), PAINEIS);
  const pos = PAINEIS.map((id) => h.indexOf('<div class="ppanel2' + (id === 'ps-plano' ? ' so-sensivel' : '') + '" id="' + id + '"'));
  pos.forEach((p, i) => assert.ok(p > 0 && (i === 0 || p > pos[i - 1]), 'painel fora de ordem: ' + PAINEIS[i]));
  assert.ok(/<div class="subtabs ficha-abas" id="pelAbas">/.test(h), 'a barra de abas é a que gruda no topo');
  // a barra é uma faixa rolável de lado e gruda no topo
  assert.ok(/\.subtabs\.ficha-abas\{[^}]*overflow-x:auto[^}]*position:sticky[^}]*\}/.test(html), 'CSS da barra: rolável e grudada');
  // a faixa ATENÇÃO (parte A) fica entre o cabeçalho e as abas
  assert.ok(h.indexOf('class="card hosp-head"') < h.indexOf('id="pelFaixa"') && h.indexOf('id="pelFaixa"') < h.indexOf('id="pelAbas"'));
  // o Resumo se desenha ao tocar na aba; Medicamentos (dentro de Saúde) se desenha ao abrir a aba
  assert.ok(/pelSubtab\(this,'ps-resumo'\);fichaResumoRedesenhar\(\)/.test(h) && /pelSubtab\(this,'ps-saudeg'\);fmedRender\(\)/.test(h));
  assert.ok(/pelSubtab\(this,'ps-tutor'\);fichaTutorRender\(true\)/.test(h), 'Com o tutor continua desenhando por função');
});

prova('o Resumo abre primeiro para todos os papéis (não o Plano nem a Identificação)', () => {
  ['gestao', 'consultora', 'monitor', 'vet'].forEach((papel) => {
    const h = fichaDe(papel);
    const paineis = [...h.matchAll(/<div class="ppanel2[^"]*" id="(ps-[a-z]+)"/g)].map((m) => ({ id: m[1], ativo: false, classList: { add() { this.ref.ativo = true; }, remove() { this.ref.ativo = false; }, ref: null } }));
    paineis.forEach((p) => { p.classList.ref = p; });
    const abas = [...h.matchAll(/<div class="subtab2[^"]*" onclick="([^"]*)">([^<]*)<\/div>/g)].map((m) => { const o = { onclick: m[1], txt: m[2], ativa: false, classList: { add() { o.ativa = true; }, remove() { o.ativa = false; } }, getAttribute(a) { return a === 'onclick' ? m[1] : null; } }; return o; });
    const antes = { qsa: doc.querySelectorAll, gid: doc.getElementById };
    doc.querySelectorAll = (sel) => (sel === '.ppanel2' ? paineis : (sel === '.subtab2' ? abas : []));
    doc.getElementById = (id) => paineis.find((p) => p.id === id) || els[id] || (els[id] = elemento(id));
    try { run('abrirAbaInicialPel()'); } finally { doc.querySelectorAll = antes.qsa; doc.getElementById = antes.gid; }
    assert.deepStrictEqual(paineis.filter((p) => p.ativo).map((p) => p.id), ['ps-resumo'], papel);
    assert.deepStrictEqual(abas.filter((a) => a.ativa).map((a) => a.txt), ['Resumo'], papel);
  });
  assert.ok(!/podeVerPlano\(\)\?'ps-plano'/.test(corpoDe(html, 'abrirAbaInicialPel')), 'não escolhe mais a aba pelo plano');
});

prova('Monitora e Veterinária não veem Plano nem Com o tutor (a aba some e o atalho do Resumo também); Gestão e Consultora veem', () => {
  const css = html.slice(html.indexOf('.subtabs .subtab2.so-sensivel{display:none !important}'), html.indexOf('.subtabs .subtab2.so-sensivel{display:none !important}') + 700);
  assert.ok(/body\[data-role="gestao"\] \.subtabs \.subtab2\.so-sensivel/.test(css) && /body\[data-role="consultora"\] \.subtabs \.subtab2\.so-sensivel/.test(css));
  assert.ok(!/data-role="(monitor|vet)"\] \.subtabs/.test(css), 'monitor e vet não estão na lista de quem vê');
  ['monitor', 'vet'].forEach((papel) => {
    fichaDe(papel);
    assert.strictEqual(run('podeVerPlano()'), false, papel + ' não vê plano');
    const d = lista(run('fichaResumoDados(PELUDINHOS[0], pelExtra(PELUDINHOS[0]))'));
    const nomes = d.atalhos.map((a) => a.l);
    assert.ok(nomes.indexOf('Plano') < 0 && nomes.indexOf('Com o tutor') < 0, papel + ': sem os atalhos de Plano e Com o tutor: ' + nomes.join(', '));
    assert.ok(nomes.indexOf('Reposições') < 0, papel + ': o saldo de reposições é dado de cobrança (mora no Plano), então a linha nem aparece');
    assert.ok(d.cuidados.length === 5, 'os 5 cuidados de hoje aparecem para todos');
  });
  ['gestao', 'consultora'].forEach((papel) => {
    fichaDe(papel);
    assert.strictEqual(run('podeVerPlano()'), true);
    const nomes = lista(run('fichaResumoDados(PELUDINHOS[0], pelExtra(PELUDINHOS[0]))')).atalhos.map((a) => a.l);
    assert.deepStrictEqual(nomes, ['Prevenção', 'Plano', 'Com o tutor', 'Reposições', 'Peso', 'Adaptação', 'Reavaliação da vet'], papel);
  });
  doc.body.dataset.role = 'gestao';
});

// ------------------------------------------------------------------------- nada de fora
prova('TODOS os rótulos da ficha antiga continuam presentes (menos os que saíram de propósito, cada um com o porquê)', () => {
  const h = fichaDe('gestao');
  const txt = limpa(h);
  const faltam = ROTULOS_ANTIGOS.filter((l) => txt.indexOf(l) < 0);
  const semMotivo = faltam.filter((l) => !(l in SAIU_DE_PROPOSITO));
  assert.deepStrictEqual(semMotivo, [], 'rótulo da ficha antiga que sumiu sem motivo: ' + semMotivo.join(' | '));
  // e a lista dos que saíram não é enfeite: cada um dela existia mesmo na ficha antiga
  const naoExistia = Object.keys(SAIU_DE_PROPOSITO).filter((l) => ROTULOS_ANTIGOS.indexOf(l) < 0);
  assert.deepStrictEqual(naoExistia, []);
  // os dois textos com número calculado: iguais, sem o número
  assert.ok(/Planos DayCare 2026\. A tabela é por mês \(a mensalidade\); o valor do plano é a mensalidade vezes os meses do tipo \(1 no mensal, 3 no trimestral, 6 no semestral\), pago à vista\. Desconto: 2º peludinho \d+%, 3º \d+%\./.test(txt));
  assert.ok(/Day Care conta \d+ dias corridos\. Hospedagem só registra a data — sem contagem automática\./.test(txt));
  // «Medicamentos» e a frase da nova sanfona
  assert.ok(/O que é analisado em cada exame: Consciência · Patas e coxins · Pele e pelagem · Orelhas · Olhos · Boca e focinho · Xixi · Cocô · Vômito · Rabo e bumbum\./.test(txt), 'a lista dos pontos, sem repetir xixi, cocô e vômito');
  assert.ok(!/e ainda xixi, cocô/.test(txt));
});

prova('todo campo que a ficha antiga gravava continua gravável na nova; nenhum id de campo foi renomeado', () => {
  const h = fichaDe('gestao');
  CHAVES_ANTIGAS.forEach((k) => {
    const direto = h.indexOf('setPelExtra(pelAtual,{' + k + ':') >= 0;
    const porFuncao = GRAVA_POR_FUNCAO[k] && h.indexOf(GRAVA_POR_FUNCAO[k]) >= 0;
    assert.ok(direto || porFuncao, 'o campo «' + k + '» não é mais gravado pela ficha');
  });
  IDS_ANTIGOS.forEach((id) => assert.ok(h.indexOf('id="' + id + '"') >= 0, 'id que sumiu: ' + id));
  ['onRacaPel', 'setPelNasc', 'onTutorPel', 'prevUltimaDireta', 'pelAlimRef', 'onNomePel', 'inativarPeludinhoRapido', 'registrarObito', 'salvarFichaPel', 'salvarFotoPel', 'copiarGest'].forEach((f) => {
    assert.ok(h.indexOf(f + '(') >= 0, 'chamada que sumiu: ' + f);
  });
  // saíram de propósito
  assert.ok(h.indexOf('id="pelFreqInput"') < 0 && h.indexOf('id="ps-med"') < 0 && h.indexOf('id="ps-exames"') < 0 && h.indexOf('id="ps-atencao"') < 0);
});

prova('cada bloco foi para a aba certa: o mapa aba → sanfonas', () => {
  const h = fichaDe('gestao');
  const sanfonas = (id) => [...painel(h, id).matchAll(/data-ficha-topico="([^"]+)"/g)].map((m) => m[1]);
  assert.deepStrictEqual(sanfonas('ps-ident'), ['cad-dados', 'ident-contatos', 'cad-saida']);
  assert.deepStrictEqual(sanfonas('ps-plano'), ['plano-mensagens', 'pl-repos']);
  assert.deepStrictEqual(sanfonas('ps-saudeg'), ['sg-emerg', 'sg-alerg', 'sg-med', 'sg-reav', 'sg-peso', 'sg-cio', 'sg-exames']);
  assert.deepStrictEqual(sanfonas('ps-comp'), ['comp-alertas', 'comp-como', 'comp-adapt', 'comp-relato', 'atencao-ea']);
  assert.deepStrictEqual(sanfonas('ps-rotina'), ['ro-ali', 'rotina-almoco', 'ro-hosp', 'ro-day']);
  const prev = sanfonas('ps-saude');
  assert.ok(prev.indexOf('checkup') === 0 && prev.indexOf('escova') === 1 && prev.some((x) => /^vac-/.test(x)) && prev.indexOf('ecto') > 0 && prev.indexOf('col') > 0 && prev.indexOf('verm') > 0 && prev.indexOf('fezes') > 0);
  // sai da Prevenção: Emergência, Peso e Cio; fica: check-up, escova, oportunidades, vacinas, antiparasitários
  const p = painel(h, 'ps-saude');
  assert.ok(p.indexOf('EMERGÊNCIA') < 0 && p.indexOf('id="pesoNovo"') < 0 && p.indexOf('Último cio') < 0, 'Emergência, Peso e Cio não estão mais na Prevenção');
  assert.ok(/Oportunidades/.test(p) && /<h3 class="cad-sub">Vacinas<\/h3>/.test(p) && /<h3 class="cad-sub">Antiparasitários<\/h3>/.test(p) && p.indexOf('pelAlertaPrev_saude') > 0);
  // Saúde tem Emergência, Peso e Cio
  const s = painel(h, 'ps-saudeg');
  ['EMERGÊNCIA — veterinário(a) de confiança do tutor', 'id="pesoNovo"', 'Último cio', 'id="pelHistCk"', 'id="pelFotosCorpoWrap"', 'id="fmedItens"', 'id="pelVetReav"'].forEach((t) => assert.ok(s.indexOf(t) >= 0, 'em Saúde falta: ' + t));
  // Reposições foi da Identificação para o Plano; a Saída do Day Care foi do Plano para o Cadastro
  assert.ok(painel(h, 'ps-plano').indexOf('REPOSIÇÕES') > 0 && painel(h, 'ps-ident').indexOf('REPOSIÇÕES') < 0);
  assert.ok(painel(h, 'ps-ident').indexOf('Saiu do Day Care?') > 0 && painel(h, 'ps-plano').indexOf('Saiu do Day Care?') < 0);
  assert.ok(painel(h, 'ps-plano').indexOf('Categoria e dias ficam no cabeçalho, como hoje.') > 0);
  // Manias, Adaptação e Relato saíram de Atenção; Alimentação em casa foi para junto da Ração
  const c = painel(h, 'ps-comp');
  ['Manias', 'Em adaptacao (45 dias)?', 'O que o tutor contou', 'Brinquedos que trouxe', 'Restrição no Enriquecimento Ambiental (EA)'].forEach((t) => assert.ok(c.indexOf(t) >= 0, 'em Comportamento falta: ' + t));
  const r = painel(h, 'ps-rotina');
  assert.ok(r.indexOf('Ração (marca)') < r.indexOf('Alimentação em casa (ração / dose)') && r.indexOf('Alimentação em casa (ração / dose)') < r.indexOf('Quanto de ração por refeição'), 'o campo antigo fica logo abaixo de «Ração (marca)», os dois visíveis');
  ['Plano alimentar da hospedagem', 'Rotina do Day Care', 'Banho recorrente', 'Editado na tela de Banho'].forEach((t) => assert.ok(limpa(r).indexOf(t) >= 0, 'em Rotina falta: ' + t));
});

prova('o cabeçalho continua como era (só a frase da Medicação mudou e o apelido mostra o novo campo)', () => {
  const h = fichaDe('gestao', { apelido: 'Bisco' });
  const cab = h.slice(h.indexOf('class="card hosp-head"'), h.indexOf('id="pelFaixa"'));
  ['pelFotoFile', 'pelAv', 'pelMedLinha', 'pelTutorLinha', 'pelCategoriaEdit', 'pelDiasEdit', 'pelAtivsEdit', 'pelFotoSt', 'Atividades seletivas', 'Inserir foto', 'Salvar foto', 'chip-serv'].forEach((t) => assert.ok(cab.indexOf(t) >= 0, 'cabeçalho: falta ' + t));
  assert.ok(/medLinhaDoPel\(p,'Detalhes e alterações em Saúde › Medicamentos\.'\)/.test(corpoDe(html, 'abrirPeludinho')), 'a frase nova do cabeçalho');
  assert.ok(!/Detalhes e alterações na aba Medicamentos/.test(html), 'a frase antiga não sobrou em nenhum redesenho do cabeçalho');
  assert.ok(/id="pelApelidoCab"[^>]*> \(Bisco\)<\/span>/.test(cab), 'o apelido novo aparece ao lado do nome');
});

// ------------------------------------------------------------------------- o Resumo
prova('Resumo › Cuidados de hoje: alergia, restrição, remédio de hoje, almoço na creche e comedouro lento', () => {
  const key = (fichaDe('gestao', { alergia: 'frango', restricao: 'sem grãos', ansioso: 'Sim' }, { alim: 'Ração', quant: '60g', lento: true }), run('medChaveDoPel(PELUDINHOS[0])'));
  A.ctx.__k = key;
  run("MED_AGENDA_GERAL={}; MED_AGENDA_GERAL[__k]={itens:{a:{nome:'Enalapril', q:'1', u:'comprimido', continuo:true, horarios:['08:00']}}}");
  const c = Object.fromEntries(lista(run('fichaResumoDados(PELUDINHOS[0], pelExtra(PELUDINHOS[0]))')).cuidados);
  assert.strictEqual(c['Alergia'], 'frango');
  assert.strictEqual(c['Restrição alimentar'], 'sem grãos');
  assert.ok(/Enalapril/.test(c['Remédio de hoje']));
  // a receita da veterinária em vigor entra em «Remédio de hoje» (com «até dd/mm»); a suspensa e a que já terminou não
  A.ctx.__h = run('zHojeISO()');
  run("MED_AGENDA_GERAL[__k].itens.r1={nome:'Prednisolona', q:'1', u:'comprimido', continuo:false, origem:'vet', horarios:['09:00'], dataFim:addDiasISO(__h, 5)}; MED_AGENDA_GERAL[__k].itens.r2={nome:'Tramadol', q:'1', u:'comprimido', continuo:false, origem:'vet', horarios:['09:00'], dataFim:addDiasISO(__h, 5), suspenso:true}; MED_AGENDA_GERAL[__k].itens.r3={nome:'Amoxicilina', q:'1', u:'comprimido', continuo:false, origem:'vet', horarios:['09:00'], dataFim:addDiasISO(__h, -2)};");
  const c2 = Object.fromEntries(lista(run('fichaResumoDados(PELUDINHOS[0], pelExtra(PELUDINHOS[0]))')).cuidados);
  assert.ok(/Enalapril/.test(c2['Remédio de hoje']) && /Prednisolona 1 comprimido \(até \d\d\/\d\d\)/.test(c2['Remédio de hoje']) && !/Tramadol|Amoxicilina/.test(c2['Remédio de hoje']), c2['Remédio de hoje']);
  run("delete MED_AGENDA_GERAL[__k].itens.r1; delete MED_AGENDA_GERAL[__k].itens.r2; delete MED_AGENDA_GERAL[__k].itens.r3;");
  assert.strictEqual(c['Almoço na creche'], 'Ração · 60g');
  assert.strictEqual(c['Comedouro lento'], 'Sim — usar o comedouro lento');
  // sem dado, o resumo não afirma o que não sabe
  fichaDe('gestao', {}, null);
  run('MED_AGENDA_GERAL={}');
  const v = Object.fromEntries(lista(run('fichaResumoDados(PELUDINHOS[0], pelExtra(PELUDINHOS[0]))')).cuidados);
  assert.strictEqual(v['Alergia'], 'Não informada'); assert.strictEqual(v['Restrição alimentar'], 'Não informada');
  assert.strictEqual(v['Remédio de hoje'], 'Nenhum cadastrado'); assert.strictEqual(v['Almoço na creche'], 'Almoço não lançado'); assert.strictEqual(v['Comedouro lento'], 'Não informado');
  // «Não tem» é dito só quando alguém registrou
  fichaDe('gestao', { alergia_nenhuma: { quem: 'Pessoa A', ts: 1 } });
  assert.strictEqual(Object.fromEntries(lista(run('fichaResumoDados(PELUDINHOS[0], pelExtra(PELUDINHOS[0]))')).cuidados)['Alergia'], 'Não tem');
  // o almoço marcado como «não almoça»
  fichaDe('gestao', {}, { nao: true, alim: 'Ração' });
  assert.strictEqual(Object.fromEntries(lista(run('fichaResumoDados(PELUDINHOS[0], pelExtra(PELUDINHOS[0]))')).cuidados)['Almoço na creche'], 'Não almoça na creche');
});

prova('Resumo › Atalhos: cada linha leva à aba e à sanfona certas; o HTML tem botão só onde há aonde ir', () => {
  fichaDe('gestao', { checkup_fez: 'Sim' });
  const d = lista(run('fichaResumoDados(PELUDINHOS[0], pelExtra(PELUDINHOS[0]))'));
  const por = Object.fromEntries(d.atalhos.map((a) => [a.l, a]));
  assert.deepStrictEqual([por['Prevenção'].aba, por['Prevenção'].topico], ['ps-saude', 'checkup']);
  assert.deepStrictEqual([por['Plano'].aba, por['Plano'].topico], ['ps-plano', '']);
  assert.deepStrictEqual([por['Com o tutor'].aba, por['Com o tutor'].topico], ['ps-tutor', '']);
  assert.deepStrictEqual([por['Reposições'].aba, por['Reposições'].topico], ['ps-plano', 'pl-repos']);
  assert.deepStrictEqual([por['Peso'].aba, por['Peso'].topico], ['ps-saudeg', 'sg-peso']);
  assert.deepStrictEqual([por['Adaptação'].aba, por['Adaptação'].topico], ['ps-comp', 'comp-adapt']);
  assert.deepStrictEqual([por['Reavaliação da vet'].aba, por['Reavaliação da vet'].topico], ['ps-saudeg', 'sg-reav']);
  assert.strictEqual(por['Peso'].estado.classe, 'breve', 'sem pesagem: falta pesar este mês');
  assert.strictEqual(por['Reavaliação da vet'].t, 'sem data marcada');
  const h = limpa(run('fichaResumoHTML(PELUDINHOS[0], pelExtra(PELUDINHOS[0]))'));
  assert.ok(/Cuidados de hoje/.test(h) && /Atalhos/.test(h) && /Toque numa linha para ir direto à sanfona\./.test(h));
  const bruto = run('fichaResumoHTML(PELUDINHOS[0], pelExtra(PELUDINHOS[0]))');
  assert.strictEqual((bruto.match(/<button type="button" class="fres-at"/g) || []).length, 7, 'sete atalhos tocáveis para a Gestão');
  // a reavaliação marcada e o saldo de reposição entram nos selos
  A.ctx.__k = run('medChaveDoPel(PELUDINHOS[0])');
  run("VET_REAVAL_CACHE={}; VET_REAVAL_CACHE[__k]={data:'2026-11-05', motivo:'ver a córnea', por:'Vet Exemplo', ts:1761600000000}");
  const r = lista(run('fichaResumoDados(PELUDINHOS[0], pelExtra(PELUDINHOS[0]))')).atalhos.find((a) => a.l === 'Reavaliação da vet');
  assert.ok(/05\/11\/2026/.test(r.t) && r.estado.texto === '05/11', r.t + ' / ' + r.estado.texto);
  run('VET_REAVAL_CACHE={}');
  // monitora: Reposições nem aparece (é dado de cobrança); os 4 atalhos dela são tocáveis
  doc.body.dataset.role = 'monitor';
  const mon = run('fichaResumoHTML(PELUDINHOS[0], pelExtra(PELUDINHOS[0]))');
  assert.ok(!/Reposições/.test(mon) && (mon.match(/<button type="button" class="fres-at"/g) || []).length === 4, 'monitora: 4 atalhos tocáveis e nenhuma linha de Reposições');
  doc.body.dataset.role = 'gestao';
});

prova('o atalho abre a aba e a sanfona certas e rola até ela; os nomes das abas antigas levam à sanfona nova', () => {
  assert.deepStrictEqual(lista(run("pelAbaDeAntiga('ps-med')")), { aba: 'ps-saudeg', topico: 'sg-med' });
  assert.deepStrictEqual(lista(run("pelAbaDeAntiga('ps-exames')")), { aba: 'ps-saudeg', topico: 'sg-exames' });
  assert.deepStrictEqual(lista(run("pelAbaDeAntiga('ps-atencao')")), { aba: 'ps-saudeg', topico: 'sg-alerg' });
  assert.deepStrictEqual(lista(run("pelAbaDeAntiga('ps-rotina')")), { aba: 'ps-rotina', topico: '' });
  const log = [];
  const aba = { getAttribute: () => "pelSubtab(this,'ps-saudeg');fmedRender()", click() { log.push('clicou na aba Saúde'); } };
  const outra = { getAttribute: () => "pelSubtab(this,'ps-saude')", click() { log.push('clicou na errada'); } };
  const sanfona = { tagName: 'DETAILS', open: false, scrollIntoView() { log.push('rolou até a sanfona'); } };
  const ficha = { querySelectorAll: () => [outra, aba] };
  const gid = doc.getElementById;
  doc.getElementById = (id) => (id === 'pel-ficha' ? ficha : (id === 'fichaTopico_sg-med' ? sanfona : (els[id] = els[id] || elemento(id))));
  try {
    assert.strictEqual(run("fichaIrPara('ps-med')"), true);
    assert.deepStrictEqual(log, ['clicou na aba Saúde', 'rolou até a sanfona']);
    assert.strictEqual(sanfona.open, true, 'a sanfona abriu');
    assert.strictEqual(run("fichaIrPara('ps-plano','pl-repos')"), false, 'aba que não existe para quem está logado: devolve false');
  } finally { doc.getElementById = gid; }
  assert.ok(/fichaIrPara\(aba\)/.test(corpoDe(html, 'hospAbrirFichaAba')), 'as conferências do check-in (que ainda dizem ps-med) chegam pela tradução');
});

// ------------------------------------------------------------------------- Cadastro
prova('Cadastro: Apelido grava `apelido` pelo setPelExtra; o histórico de saídas e voltas lista as saídas; Reposições e a Saída ficam no lugar certo', () => {
  const h = fichaDe('gestao', { apelido: 'Bisco', saidas: [{ quando: '2026-05-01', motivo: 'mudança', tipo: 'definitiva', retornoEm: '02/06 10:00', retornoPor: 'Pessoa B', retornoMotivo: 'voltou', retornoTs: 1, desfeita: { por: 'Pessoa C', quando: '03/06', motivo: 'foi engano do registro' } },
    { quando: '2026-09-01', motivo: 'viagem da família', tipo: 'pausa', retornoEm: '10/10 09:00', retornoPor: 'Pessoa A', retornoMotivo: 'voltou da viagem', retornoTs: 2 }] });
  const cad = painel(h, 'ps-ident');
  assert.ok(/<label>Apelido<\/label><input class="cad-in" value="Bisco"[^>]*onchange="pelApelidoSet\(this\.value\)"/.test(cad));
  const t = limpa(cad);
  assert.ok(/Histórico de saídas e voltas/.test(t) && /Saiu em 2026-09-01 · pausa — viagem da família Voltou em 10\/10 09:00 · por Pessoa A: voltou da viagem/.test(t), t.slice(t.indexOf('Histórico'), t.indexOf('Histórico') + 400));
  assert.ok(/Volta desfeita por Pessoa C em 03\/06 — foi engano do registro/.test(t));
  assert.ok(t.indexOf('Saiu em 2026-09-01') < t.indexOf('Saiu em 2026-05-01'), 'a saída mais nova (a última gravada) vem primeiro');
  assert.ok(/Nenhuma saída e volta registrada ainda\./.test(limpa(run('fichaSaidaHistoricoHTML({})'))));
  // grava
  run('__g=[]; setPelExtra=function(p,patch){ __g.push(patch); return Promise.resolve({ok:true}); };');
  run("pelAtual=PELUDINHOS[0]; pelApelidoSet('  Bisquinho ')");
  assert.deepStrictEqual(lista(run('__g')), [{ apelido: 'Bisquinho' }]);
  // o selo da Saída
  assert.strictEqual(lista(run("fichaSaidaSelo({inativo:'Sim'})")).texto, 'Inativo');
  assert.strictEqual(lista(run("fichaSaidaSelo({tipoSaida:'obito', dataObito:'01/10/2026'})")).texto, 'Faleceu em 01/10/2026');
  assert.strictEqual(lista(run('fichaSaidaSelo({})')).texto, 'Ativo');
  assert.ok(/apelido:'Apelido'/.test(html), 'o rastro da ficha tem o rótulo do apelido');
  // a Saída do Day Care morava na aba Plano (sensível): no Cadastro continua só para quem vê o plano
  assert.ok(/<div class="so-sensivel">[^<]*<!--[^>]*-->\s*<details[^>]*data-ficha-topico="cad-saida"/.test(cad), 'a sanfona da Saída fica dentro de .so-sensivel');
});

// ------------------------------------------------------------------------- Saúde › Medicamentos, Reavaliação, restrição
prova('Medicamentos na ficha: uso contínuo E receitas da veterinária em vigor, com os subtítulos; o que terminou fica em «Já não toma mais»', () => {
  fichaDe('gestao');
  const hoje = run('zHojeISO()');
  A.ctx.__h = hoje;
  run(`FMED_ITENS={
    cont:{nome:'Enalapril', q:'1', u:'comprimido', continuo:true, origem:'tutor', horarios:['08:00'], dataInicio:'2026-01-01'},
    recVig:{nome:'Prednisolona', q:'1', u:'comprimido', continuo:false, origem:'vet', horarios:['09:00'], dataInicio:'2026-01-01', dataFim:addDiasISO(__h, 5)},
    recHoje:{nome:'Omeprazol', q:'1', u:'comprimido', continuo:false, origem:'vet', horarios:['09:00'], dataInicio:'2026-01-01', dataFim:__h},
    recSusp:{nome:'Tramadol', q:'1', u:'comprimido', continuo:false, origem:'vet', horarios:['09:00'], dataInicio:'2026-01-01', dataFim:addDiasISO(__h,-3), suspenso:true},
    recFim:{nome:'Amoxicilina', q:'1', u:'comprimido', continuo:false, origem:'vet', horarios:['09:00'], dataInicio:'2026-01-01', dataFim:addDiasISO(__h,-1)},
    tutTemp:{nome:'Ômega 3', q:'1', u:'cápsula', continuo:false, origem:'tutor', horarios:['09:00'], dataInicio:'2026-01-01', dataFim:addDiasISO(__h, 5)},
    parou:{nome:'Dipirona', q:'1', u:'comprimido', continuo:false, origem:'tutor', horarios:['09:00']},
    eng:{nome:'Engano', q:'1', u:'comprimido', continuo:true, origem:'vet', horarios:['09:00'], anulado:{por:'Pessoa A', motivo:'lancado por engano', quando:'01/10'}}
  };`);
  const o = lista(run('fmedOrdem()'));
  assert.deepStrictEqual(o.vivos, ['cont']);
  assert.deepStrictEqual(o.receitas.sort(), ['recHoje', 'recSusp', 'recVig']);
  assert.deepStrictEqual(o.parados.sort(), ['parou', 'recFim', 'tutTemp']);
  assert.deepStrictEqual(o.anulados, ['eng']);
  // desenha
  const caixa = doc.getElementById('fmedItens'); caixa.innerHTML = '';
  run('fmedDesenhar()');
  const t = limpa(caixa.innerHTML);
  const iCont = t.indexOf('Uso contínuo'), iRec = t.indexOf('Receitas da veterinária'), iPar = t.indexOf('Já não toma mais'), iEng = t.indexOf('Lançados por engano');
  assert.ok(iCont >= 0 && iCont < iRec && iRec < iPar && iPar < iEng, 'subtítulos, nesta ordem: ' + [iCont, iRec, iPar, iEng].join(','));
  assert.ok(/1 receita|3 receitas da veterinária em vigor/.test(t) && /3 receitas da veterinária em vigor\./.test(t), 'o resumo conta as receitas');
  const cru = caixa.innerHTML, pos = (id) => cru.indexOf('data-id="' + id + '"');
  const rCont = cru.indexOf('>Uso contínuo<'), rRec = cru.indexOf('>Receitas da veterinária<'), rPar = cru.indexOf('>Já não toma mais<');
  assert.ok(pos('cont') > rCont && pos('cont') < rRec, 'o uso contínuo sob o subtítulo «Uso contínuo»');
  ['recVig', 'recHoje', 'recSusp'].forEach((id) => assert.ok(pos(id) > rRec && pos(id) < rPar, id + ' sob «Receitas da veterinária»'));
  ['recFim', 'tutTemp', 'parou'].forEach((id) => assert.ok(pos(id) > rPar, id + ' em «Já não toma mais»'));
  assert.ok(/Salvar medicamentos|Nada grava antes/.test(limpa(doc.getElementById('fmedAcoes').innerHTML) + limpa(html.slice(html.indexOf('Nada grava antes'), html.indexOf('Nada grava antes') + 80))));
  // sem receita
  run("FMED_ITENS={cont:{nome:'Enalapril', q:'1', u:'comprimido', continuo:true, origem:'tutor', horarios:['08:00']}}; fmedDesenhar();");
  assert.ok(/Nenhuma receita da veterinária em vigor\./.test(limpa(caixa.innerHTML)));
  run("FMED_ITENS={}; fmedDesenhar();");
  assert.ok(/Nenhum medicamento de uso contínuo cadastrado\./.test(limpa(caixa.innerHTML)));
  // a sanfona avisa o que o Cuidado Vet faz (mesma agenda) e o selo
  const h = fichaDe('gestao');
  assert.ok(/Aqui também aparecem as receitas da veterinária em vigor, como no Cuidado Vet\./.test(limpa(painel(h, 'ps-saudeg'))));
  assert.ok(/ficha-topico-nome">Medicamentos<\/span><span class="ficha-topico-estado ficha-topico-(ok|sem)" id="fichaSelo_sg-med"/.test(h));
  run('FMED_ITENS={}');
});

prova('Medicamentos: redesenhar a ficha dentro da aba Saúde guarda o rascunho (antes era a aba ps-med)', () => {
  const f = corpoDe(html, 'renderPelFicha');
  assert.ok(!/ativa==='ps-med'/.test(f) && (f.match(/ativa==='ps-saudeg'/g) || []).length === 2);
});

prova('Saúde › Reavaliação da veterinária: só leitura, com a data, quem marcou, as recomendações ativas; chega em tempo real; sem marcação, diz que não há', () => {
  const h = fichaDe('gestao');
  assert.ok(/id="pelVetReav"/.test(h) && /ficha-topico-nome">Reavaliação da veterinária<\/span>/.test(h));
  A.ctx.__k = run('medChaveDoPel(PELUDINHOS[0])');
  run("VET_REAVAL_CACHE={}; VET_RECOM_CACHE={}");
  els['pelVetReav'] = elemento('pelVetReav'); els['pelVetInstr'] = elemento('pelVetInstr');
  run('pelAtual=PELUDINHOS[0]; fichaVetReavDesenhar();');
  assert.ok(/Nenhuma reavaliação marcada pela Veterinária\./.test(limpa(els['pelVetReav'].innerHTML)));
  assert.ok(/Só leitura aqui: quem marca a reavaliação e as instruções é a Veterinária, no Cuidado Vet\./.test(limpa(els['pelVetReav'].innerHTML)));
  run("VET_REAVAL_CACHE[__k]={data:'2026-11-05', motivo:'ver a córnea', por:'Vet Exemplo', ts:1761600000000}; VET_RECOM_CACHE[__k]={texto:'Repouso por 7 dias', cuidados:['Colar elizabetano'], por:'Vet Exemplo', ts:1761600000000, ativo:true};");
  run('fichaVetRedesenhar();');
  const t = limpa(els['pelVetReav'].innerHTML), i = limpa(els['pelVetInstr'].innerHTML);
  assert.ok(/Reavaliação marcada: 05\/11\/2026 — ver a córnea/.test(t) && /Marcada por Vet Exemplo no Cuidado Vet/.test(t), t);
  assert.ok(/Instruções da Veterinária/.test(i) && /Colar elizabetano/.test(i) && /Repouso por 7 dias/.test(i), i);
  assert.ok(!/Retirar instrução|vetInstrRetirar/.test(els['pelVetInstr'].innerHTML), 'sem os botões que só existem no Cuidado Vet');
  // os dois ouvintes do Cuidado Vet redesenham a ficha aberta
  assert.ok(/VET_RECOM_CACHE=s\.val\(\)\|\|\{\};\s*try\{ if\(typeof fichaVetRedesenhar==='function'\) fichaVetRedesenhar\(\)/.test(html));
  assert.ok(/VET_REAVAL_CACHE=s\.val\(\)\|\|\{\};\s*try\{ if\(typeof fichaVetRedesenhar==='function'\) fichaVetRedesenhar\(\)/.test(html));
  run('VET_REAVAL_CACHE={}; VET_RECOM_CACHE={}');
});

prova('comedouro lento: UM controle que grava as duas chaves (ansioso e almoco-cad.lento); a divergência aparece e o botão escolhe o valor certo', () => {
  fichaDe('gestao');
  run('__g=[]; __a=[]; setPelExtra=function(p,patch){ __g.push(patch); return Promise.resolve({ok:true}); }; setAlmCad=function(p,patch){ __a.push(patch); };');
  run('pelAtual=PELUDINHOS[0]; pelLentoGravar(true);');
  assert.deepStrictEqual([lista(run('__g')), lista(run('__a'))], [[{ ansioso: 'Sim' }], [{ lento: true }]]);
  run('__g=[]; __a=[]; pelLentoGravar(false);');
  assert.deepStrictEqual([lista(run('__g')), lista(run('__a'))], [[{ ansioso: 'Nao' }], [{ lento: false }]]);
  // a divergência (Sim num lado e Não no outro) é mostrada; sem resposta num lado não é divergência
  const est = (cad, alm) => { fichaDe('gestao', cad, alm); return lista(run('pelLentoEstado(PELUDINHOS[0], pelExtra(PELUDINHOS[0]))')); };
  assert.deepStrictEqual(est({ ansioso: 'Sim' }, { lento: false }), { cad: true, alm: false, diverge: true, valor: null });
  assert.deepStrictEqual(est({ ansioso: 'Nao' }, { lento: true }), { cad: false, alm: true, diverge: true, valor: null });
  assert.deepStrictEqual(est({ ansioso: 'Sim' }, { lento: true }), { cad: true, alm: true, diverge: false, valor: true });
  assert.deepStrictEqual(est({}, { lento: true }), { cad: null, alm: true, diverge: false, valor: true });
  assert.deepStrictEqual(est({ ansioso: 'Nao' }, null), { cad: false, alm: null, diverge: false, valor: false });
  assert.deepStrictEqual(est({}, null), { cad: null, alm: null, diverge: false, valor: null });
  const h = fichaDe('gestao', { ansioso: 'Sim' }, { lento: false });
  assert.ok(/Os dois cadastros diziam coisas diferentes: o cadastro do FILHOt diz «Sim» e o almoço \(grade do Day Care\) diz «Não»\. Escolha o certo: o botão grava nos dois\./.test(limpa(h)));
  const ok = fichaDe('gestao', { ansioso: 'Sim' }, { lento: true });
  assert.ok(!/Os dois cadastros diziam/.test(ok) && /<button type="button" class="on" onclick="pelLentoGravar\(true\)">Sim<\/button>/.test(ok));
  // os dois controles antigos saíram (as chaves ficam): nem «Come em comedouro lento?» na Atenção nem o seg do almoço
  assert.ok(!/Come em comedouro lento\?/.test(h) && !/setAlmCad\(pelAtual,\{lento:/.test(h), 'os controles antigos saíram');
  assert.strictEqual((limpa(h).match(/Comedouro lento\?/g) || []).length, 1, 'um só campo «Comedouro lento?» na ficha');
  assert.ok(/O comedouro lento agora é um campo só/.test(limpa(h)));
  // a tarja ANSIOSO continua lendo `ansioso` (a chave não mudou)
  assert.ok(/ex\.ansioso==='Sim'/.test(html));
});

prova('restrição alimentar num dado só: grava `restricao` e `almoco-cad.restr`; o almoço mostra a de Saúde em leitura; se estava diferente: «No almoço estava» e botão', () => {
  fichaDe('gestao', { restricao: 'sem grãos' }, { alim: 'Ração', restr: 'sem grãos' });
  run('__g=[]; __a=[]; __au=[]; setPelExtra=function(p,patch){ __g.push(patch); return Promise.resolve({ok:true}); }; setAlmCad=function(p,patch){ __a.push(patch); }; audit=function(a,d){ __au.push([a,d]); };');
  run("pelAtual=PELUDINHOS[0]; pelRestrGravar('sem frango')");
  assert.deepStrictEqual([lista(run('__g')), lista(run('__a'))], [[{ restricao: 'sem frango' }], [{ restr: 'sem frango' }]]);
  assert.strictEqual(lista(run('__au')).length, 1, 'a frase que estava no almoço fica no rastro');
  assert.ok(/no almoço estava: «sem grãos»/.test(lista(run('__au'))[0][1]));
  // sem diferença, sem rastro
  run("__g=[]; __a=[]; __au=[]; pelRestrGravar('sem grãos')");
  fichaDe('gestao', { restricao: 'sem grãos' }, { alim: 'Ração', restr: 'sem grãos' });
  run('__g=[]; __a=[]; __au=[]; pelAtual=PELUDINHOS[0]; pelRestrGravar("sem grãos")');
  assert.strictEqual(lista(run('__au')).length, 0);
  // a ficha: Saúde grava pelo pelRestrGravar; o almoço mostra em leitura, sem campo para digitar
  const h = fichaDe('gestao', { restricao: 'sem grãos' }, { alim: 'Ração', quant: '60g', restr: 'sem grãos' });
  assert.ok(/id="pelRestricaoInput"[^>]*onchange="pelRestrGravar\(this\.value\)"/.test(h));
  const alm = painel(h, 'ps-rotina').replace(/<!--[\s\S]*?-->/g, '');   // sem os comentários do HTML
  assert.ok(!/setAlmCad\(pelAtual,\{restr:this\.value\}/.test(alm), 'o almoço não grava mais a restrição digitada');
  assert.ok(/<label>Restrição \(aparece em vermelho\)<\/label><div id="pelRestrAlmo">/.test(alm));
  assert.ok(/sem grãos/.test(limpa(alm)) && /Vem de Saúde › Restrição alimentar \. Para mudar, mude lá — o almoço acompanha\./.test(limpa(alm)));
  assert.ok(!/No almoço estava/.test(alm), 'iguais: nada a avisar');
  // diferente: «No almoço estava» com «Usar a de Saúde» (nunca apaga sozinho)
  const dif = fichaDe('gestao', { restricao: 'sem grãos' }, { alim: 'Ração', restr: 'RESTRIÇÃO A TUDO' });
  assert.ok(/No almoço estava: «RESTRIÇÃO A TUDO»\./.test(limpa(dif)) && /onclick="pelRestrAlmoUsarSaude\(\)">Usar a de Saúde</.test(dif));
  run('__g=[]; __a=[]; pelAtual=PELUDINHOS[0]; pelRestrAlmoUsarSaude();');
  assert.deepStrictEqual([lista(run('__g')), lista(run('__a'))], [[], [{ restr: 'sem grãos' }]], '«Usar a de Saúde» grava só no almoço');
  // quem só lê (Monitora, Veterinária) vê o aviso, mas não ganha botão que grava
  doc.body.dataset.role = 'monitor';
  const lido = run('pelRestrAlmoHTML(PELUDINHOS[0], pelExtra(PELUDINHOS[0]))');
  assert.ok(/No almoço estava: «RESTRIÇÃO A TUDO»/.test(lido) && !/<button/.test(lido), 'só leitura: o aviso aparece, o botão não');
  doc.body.dataset.role = 'gestao';
  // Saúde vazia e restrição só no almoço: o botão NÃO apaga a restrição de segurança — passa a do almoço para Saúde
  const so = fichaDe('gestao', {}, { alim: 'Ração', restr: 'RESTRIÇÃO A TUDO' });
  assert.ok(/No almoço estava: «RESTRIÇÃO A TUDO»\./.test(limpa(so)) && /onclick="pelRestrAlmoPassarParaSaude\(\)">Passar para Saúde</.test(so) && !/Usar a de Saúde/.test(so));
  run('__g=[]; __a=[]; pelAtual=PELUDINHOS[0]; renderPelFicha=function(){}; pelRestrAlmoPassarParaSaude();');
  assert.deepStrictEqual([lista(run('__g')), lista(run('__a'))], [[{ restricao: 'RESTRIÇÃO A TUDO', restricao_nenhuma: null }], []], 'passar para Saúde desfaz o «não tem» antigo');
  // ...ou «Limpar a do almoço» (o caso de quem disse que não tem): zera só o almoço e guarda a frase de antes no rastro
  assert.ok(/onclick="pelRestrAlmoZerar\(\)">Limpar a do almoço</.test(so));
  run('__g=[]; __a=[]; __au=[]; pelAtual=PELUDINHOS[0]; renderAlmSeFor=function(){}; pelRestrAlmoZerar();');
  assert.deepStrictEqual([lista(run('__g')), lista(run('__a'))], [[], [{ restr: '' }]]);
  assert.ok(/no almoço estava: «RESTRIÇÃO A TUDO»/.test(lista(run('__au'))[0][1]));
  // «Não tem» na restrição também zera a do almoço (a grade do Day Care lê o almoço)
  fichaDe('gestao', { restricao: 'sem grãos' }, { alim: 'Ração', restr: 'sem grãos' });
  run('__g=[]; __a=[]; __au=[]; setPelExtra=function(p,patch){ __g.push(patch); return Promise.resolve({ok:true}); }; setAlmCad=function(p,patch){ __a.push(patch); }; audit=function(a,d){ __au.push([a,d]); }; renderPelFicha=function(){}; renderAlmSeFor=function(){};');
  run("pelAtual=PELUDINHOS[0]; pelNaoTemGravar('restricao','restrição alimentar')");
  assert.strictEqual(lista(run('__g'))[0].restricao, '');
  assert.deepStrictEqual(lista(run('__a')), [{ restr: '' }], '«Não tem» na restrição zera também o almoço');
  run("__a=[]; pelNaoTemGravar('alergia','alergia')");
  assert.deepStrictEqual(lista(run('__a')), [], '«Não tem» na alergia não mexe no almoço');
  // quem pode editar: o setAlmCad não tem porteiro próprio (grava direto, como sempre) e as regras do banco deixam qualquer entrada autenticada gravar em daycare/almoco-cad
  assert.ok(!/podePapel|canEditPel|papelDoCorpo/.test(corpoDe(html, 'setAlmCad')), 'o setAlmCad não depende de papel: quem edita restrição na ficha (editar-peludinho) já consegue gravar os dois');
  const regras = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'database.rules.json'), 'utf8'));
  assert.strictEqual(regras.rules.daycare.$colecao.$item['.write'], 'auth != null', 'daycare/almoco-cad/$k: qualquer entrada autenticada grava');
  // EA continua herdando `restricao` quando vazio
  assert.ok(/ea_restr\|\|ex\.restricao/.test(html));
});

// ------------------------------------------------------------------------- Comportamento e Rotina: o que só existia na hospedagem
prova('Comportamento e Rotina: Brinquedos que trouxe, Plano alimentar da hospedagem e Banho recorrente aparecem em leitura', () => {
  run("getCad=function(h){ return {brinquedos:'bolinha e corda'}; };");
  assert.ok(/Brinquedos que trouxe/.test(limpa(run('fichaBrinquedosHospHTML(PELUDINHOS[0])'))) && /bolinha e corda/.test(run('fichaBrinquedosHospHTML(PELUDINHOS[0])')));
  run("getCad=function(h){ return {}; };");
  assert.ok(/Nada anotado na hospedagem\./.test(run('fichaBrinquedosHospHTML(PELUDINHOS[0])')));
  const plano = { tipo: 'misto', unidade: 'gramas', marca: 'Marca Exemplo', refs: { fixas: { cafe: { on: true, hora: '07:00', racao: '60', natural: '', extra: '' }, almoco: { on: false }, jantar: { on: true, hora: '18:00', racao: '50', natural: '1 colher', extra: 'sem sal' } }, extras: [{ nome: 'Lanche', hora: '15:00', racao: '', natural: '', extra: 'um petisco' }] } };
  A.ctx.__p = plano;
  const t = run('fichaPlanoAlimHospTexto(__p)');
  assert.ok(/ração Marca Exemplo · misto — Café da manhã \(07:00\): 60g de ração · Jantar \(18:00\): 50g de ração \+ 1g de natural \+ sem sal · Lanche \(15:00\): um petisco/.test(t) || /Café da manhã \(07:00\): 60g de ração/.test(t), t);
  assert.ok(!/Almoço/.test(t), 'refeição desligada não entra');
  assert.strictEqual(run("fichaPlanoAlimHospTexto(null)"), '');
  assert.ok(/Ainda não há plano alimentar da hospedagem guardado na ficha\./.test(run('fichaPlanoAlimHospHTML({})')));
  assert.ok(/só leitura/i.test(run('fichaPlanoAlimHospHTML({})')));
  assert.ok(/Sem banho recorrente\./.test(run('fichaBanhoRecHTML(PELUDINHOS[0])')) && /Editado na tela de Banho\./.test(run('fichaBanhoRecHTML(PELUDINHOS[0])')));
  fichaDe('gestao', { banho_rec: { ativo: true, freq: 'quinzenal', dia: 'qui', hora: '10:00', desde: '2026-10-01' } });
  assert.ok(/banho quinzenal qui 10:00/.test(run('fichaBanhoRecHTML(PELUDINHOS[0])')), run('fichaBanhoRecHTML(PELUDINHOS[0])'));
});

prova('selos das sanfonas: o estado de cada uma, dito pelas mesmas contas da ficha', () => {
  const s = (c) => lista(run(c));
  assert.deepStrictEqual(s("fichaAlergSelo({alergia:'frango'})"), { texto: 'Tem alergia', classe: 'breve' });
  assert.deepStrictEqual(s("fichaAlergSelo({alergia_nenhuma:{quem:'A',ts:1}})"), { texto: 'Sem alergia', classe: 'ok' });
  assert.deepStrictEqual(s('fichaAlergSelo({})'), { texto: 'Sem informação', classe: 'sem' });
  assert.deepStrictEqual(s("fichaEmergSelo({vetNome:'Dra. Exemplo'})"), { texto: 'Preenchida', classe: 'ok' });
  assert.deepStrictEqual(s('fichaEmergSelo({})'), { texto: 'Sem informação', classe: 'sem' });
  assert.deepStrictEqual(s('fichaEASelo({})'), { texto: 'Falta responder', classe: 'breve' });
  assert.deepStrictEqual(s('fichaEASelo({ea_restr_nao:true})'), { texto: 'OK', classe: 'ok' });
  assert.deepStrictEqual(s('fichaAlimSelo({})'), { texto: 'Falta marcar refeição', classe: 'breve' });
  assert.deepStrictEqual(s("fichaAlimSelo({alim_refs:'Almoço'})"), { texto: 'OK', classe: 'ok' });
  assert.deepStrictEqual(s('fichaAdaptSelo({})'), { texto: 'Fora da adaptação', classe: 'sem' });
  assert.deepStrictEqual(s("fichaAdaptSelo({adaptacao:'Sim', adaptacao_tipo:'Hospedagem'})"), { texto: 'Hospedagem', classe: 'sem' });
  assert.deepStrictEqual(s('fichaPesoSelo({})'), { texto: 'Falta pesar', classe: 'breve' });
  assert.deepStrictEqual(s("fichaSelo('x','ok')"), { texto: 'x', classe: 'ok' });
  // a sanfona: aberta/fechada por padrão e guardada por FILHOt; sem selo quando não há estado
  fichaDe('gestao');
  const ab = run("fichaSanfonaInicio('prova-a','Prova A',null,true)"), fe = run("fichaSanfonaInicio('prova-b','Prova B',{texto:'OK',classe:'ok'},false)");
  assert.ok(/<details class="ficha-topico" data-ficha-topico="prova-a" id="fichaTopico_prova-a" open/.test(ab) && !/ficha-topico-estado/.test(ab));
  assert.ok(!/ open ontoggle/.test(fe) && /ficha-topico-estado ficha-topico-ok" id="fichaSelo_prova-b">OK</.test(fe));
  run("fichaTopicoAlternar('prova-a', false)");
  assert.ok(!/ open ontoggle/.test(run("fichaSanfonaInicio('prova-a','Prova A',null,true)")), 'o que a pessoa fechou continua fechado');
  assert.strictEqual(run('fichaTopicoFim()'), '</div></details>');
});

// ------------------------------------------------------------------------- as regras da casa
prova('regras da casa: sem alert/confirm/prompt, sem vocabulário proibido, sem emoji de marca nos textos novos; área protegida e `APP_VERSAO` intactas', () => {
  const NOVAS = ['pelAbaDeAntiga', 'fichaIrPara', 'fichaSanfonaInicio', 'fichaSelo', 'fmedEhReceitaVigor', 'fichaMedContagem', 'fichaMedSelo', 'fichaResumoDados', 'fichaResumoHTML', 'fichaResumoRedesenhar',
    'pelApelidoSet', 'fichaSaidaHistoricoHTML', 'fichaSaidaSelo', 'fichaVetObj', 'fichaVetReavSelo', 'fichaVetReavDesenhar', 'fichaVetRedesenhar', 'fichaBrinquedosHospHTML', 'fichaPlanoAlimHospTexto', 'fichaPlanoAlimHospHTML',
    'fichaBanhoRecHTML', 'pelLentoEstado', 'pelLentoHTML', 'pelLentoGravar', 'pelRestrGravar', 'pelRestrAlmoHTML', 'pelRestrAlmoRedesenhar', 'pelRestrAlmoUsarSaude', 'pelRestrAlmoPassarParaSaude',
    'fichaDadosSelo', 'fichaReposSelo', 'fichaEmergSelo', 'fichaAlergSelo', 'fichaPesoSelo', 'fichaAdaptSelo', 'fichaEASelo', 'fichaAlimSelo', 'fichaAlmocoSelo'];
  const texto = NOVAS.map((f) => corpoDe(html, f)).join('\n') + '\n' + corpoDe(html, 'abrirPeludinho');
  assert.ok(!/\balert\s*\(|\bconfirm\s*\(|\bprompt\s*\(/.test(texto), 'confirmação dentro da página, nunca janela nativa');
  const so = texto.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '').replace(/<!--[\s\S]*?-->/g, '');
  assert.ok(!/\b(c[ãa]o|c[ãa]es|cachorro|cachorros|baia|baias|soltar|solto|solta)\b/i.test(so), 'vocabulário da casa');
  assert.ok(!/[\u{1F300}-\u{1FAFF}]/u.test(NOVAS.map((f) => corpoDe(html, f)).join('\n')), 'sem emoji de marca nos textos novos');
  // não mexeu na área protegida do check-in do Day Care
  const protegidas = lista(run("Object.getOwnPropertyNames(globalThis).filter(function(k){ return typeof globalThis[k]==='function' && (/^(ck|ckt|pt)/.test(k) || k==='pendAvisarChegada'); }).sort()"));
  // (os valores abaixo são os do commit da parte A, ecc4719, medidos neste mesmo sandbox: nenhuma função ck*/ckt*/pt*/pendAvisarChegada
  //  mudou, nenhuma nasceu, e o #v-daycare tem o mesmo texto)
  const sha = (s) => require('crypto').createHash('sha256').update(s).digest('hex').slice(0, 16);
  assert.strictEqual(protegidas.length, 157, 'as mesmas funções ck*/ckt*/pt*/pendAvisarChegada');
  // Antes: o hash era medido no texto inteiro das funções. Depois: medido sem a chamada `+alergiaSeloHTML(p)`.
  // Por quê: a dona autorizou (28/out/2026) mexer no check-in do Day Care SÓ para mostrar o selo de alergia. Tirando
  // a chamada, o texto tem de dar o mesmo hash de antes: prova que o selo foi a única mudança na área protegida.
  assert.strictEqual(sha(protegidas.map((nm) => nm + '\n' + run('String(' + nm + ')').split('+alergiaSeloHTML(p)').join('')).join('\n')), '73e7f281aff59c01', 'o texto de cada uma, igual');
  const iDc = html.indexOf('id="v-daycare"'), jDc = html.indexOf('id="v-', iDc + 10);
  assert.strictEqual(sha(html.slice(iDc, jDc)), '4c438983ed2b9c0a', 'o #v-daycare, igual');
  // a regras do banco não foram tocadas por esta mudança (quem publica é a dona)
  assert.ok(!/alertas_fixos|apelido/.test(fs.readFileSync(path.join(__dirname, '..', 'database.rules.json'), 'utf8')));
});

(async () => {
  for (const [nome, fn] of fila) {
    try { await fn(); n += 1; } catch (e) { console.error('FALHOU: ' + nome); throw e; }
  }
  console.log('ficha-abas162: OK (' + n + ' provas)');
})().catch((e) => { console.error(e); process.exitCode = 1; });
