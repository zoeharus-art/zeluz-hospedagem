'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.resolve(__dirname, '../auaulandia/index.html'), 'utf8');
assert.match(html, /if\(v!==['"]agendamarcia['"]\)\{\s*if\(typeof agendaMarciaOcultar===['"]function['"]\) agendaMarciaOcultar\(\);\s*else if\(typeof agendaMarciaFechar===['"]function['"]\) agendaMarciaFechar\(\);\s*\}/);
assert.match(html, /function logout\(\)\{[\s\S]{0,500}?entrevistas155Fechar\(\)[\s\S]{0,500}?zelozinha45Logout\(\)/);
assert.match(html, /function trancarApp\(\)\{[\s\S]{0,300}?zelozinha116InvalidarSessao\(\)[\s\S]{0,200}?_appTrancado=true/);
assert.match(html, /function acessoTrancar\(frase, trava\)\{[\s\S]{0,300}?zelozinha116InvalidarSessao\(\)/);
function script(id) {
  const m = html.match(new RegExp(`<script[^>]*id="${id}"[^>]*>([\\s\\S]*?)<\\/script>`));
  assert.ok(m, `script ausente: ${id}`);
  return m[1];
}

function alvo() {
  return {
    innerHTML: '', attrs: {},
    setAttribute(k, v) { this.attrs[k] = String(v); },
    removeAttribute(k) { delete this.attrs[k]; },
    getAttribute(k) { return Object.hasOwn(this.attrs, k) ? this.attrs[k] : null; },
    hasAttribute(k) { return Object.hasOwn(this.attrs, k); },
    querySelector() { return null; }, querySelectorAll() { return []; }
  };
}

async function executar() {
  const dia = '2026-10-27';
  let agora = Date.parse(`${dia}T14:00:00-03:00`);
  class DataFalsa extends Date {
    constructor(v) { super(v === undefined ? agora : v); }
    static now() { return agora; }
  }

  let destino = alvo(), assinatura = 'conteudo-a', atualizadoEm = `${dia}T14:00:00.000Z`, permitido = true;
  let linhas = [{ chave: 'filhot-ficticio__familia-ficticia', fonte: 'checkin', hora: '08:00', itens: [{ k: 'vac_mult_p', vence: '2026-10-28' }] }];
  const contagem = { listar: 0, fontes: 0, presenca: 0, invalidar: 0 };
  let adiarLista = false, adiarPresenca = false, falharLista = false, cacheApi = null, cacheApiEm = 0; const liberarLista = [], liberarPresenca = [];
  const imediatos = [];
  function setTimeoutFalso(fn, ms) { if (Number(ms) <= 10) imediatos.push(fn); return imediatos.length; }
  function rodarImediatos() { while (imediatos.length) imediatos.shift()(); }

  const cycleKey = JSON.stringify(['pet-ficticio', 'tutor-ficticio', 'vacina', '2026-10-28', 'vac_mult_p']);
  function resultado() {
    return { dia, estado: 'pronto', itens: [{
      dia, dcKey: linhas[0].chave, pelKey: 'filhot-ficticio', petId: 'pet-ficticio', tutorId: 'tutor-ficticio', estado: 'feito',
      row: { chave: linhas[0].chave, p: { n: 'FILHOt Fictício', tutor: 'Família Fictícia', raca: 'SRD' } },
      cadastro: { tutor: 'Família Fictícia', raca: 'SRD' }, groupKey: 'grupo-ficticio',
      ciclos: [{ cycleKey, itemK: 'vac_mult_p', care: 'vacina', dueDate: '2026-10-28' }],
      registroRespostas139: { respostasEscopo49: { porCiclo: { k: { cycleKey, itemK: 'vac_mult_p', decisao: 'aguardar', revisao: 1 } } } },
      existente: { tipo: 'contato_humano', status: 'feito', humano: { nome: 'Equipe Fictícia' }, ts: agora }
    }] };
  }

  const api = {
    listar(forcar) {
      contagem.listar += 1;
      if (forcar !== true && cacheApi && agora - cacheApiEm < 15000) return cacheApi;
      contagem.fontes += 1; cacheApiEm = agora;
      cacheApi = (async () => { if (adiarLista) await new Promise(resolve => liberarLista.push(resolve)); if (falharLista) throw new Error('fonte fictícia indisponível'); return resultado(); })();
      return cacheApi;
    },
    async presencaUm(dcKey) { contagem.presenca += 1; if (adiarPresenca) return new Promise(resolve => liberarPresenca.push(v => resolve(v || { dia, dcKey, presente: true, saiu: false }))); return { dia, dcKey, presente: true, saiu: false }; },
    invalidate() { contagem.invalidar += 1; cacheApi = null; cacheApiEm = 0; }, async atualizarUm() { return resultado().itens[0]; }
  };
  const document = {
    body: {}, head: { appendChild() {} }, documentElement: { style: {} },
    createElement() { return { id: '', textContent: '', style: {}, appendChild() {}, querySelectorAll() { return []; } }; },
    getElementById() { return null; }, addEventListener() {}, querySelector() { return null; },
    querySelectorAll(sel) { return sel.includes('[data-z89-contatos]') ? [destino] : []; }
  };
  const window = {
    document, pageYOffset: 0, addEventListener() {}, scrollTo() {}, requestAnimationFrame(fn) { fn(); },
    ZelozinhaContatosHoje89: { criar() { return api; }, modoHumano() { return false; } },
    ZeluzResposta88: { codificarChave() { return 'k'; } },
    ZeluzRespostaApp88: { async painel() { return window.Z44_DISPATCH80.dados; } },
    zelozinha47Veterinaria: { async ler() { return { ok: true, dia, confirmada: true, tipo: 'confirmada' }; } },
    zPainel44Dia() { return dia; }, zPainel44Despacho80Acesso() { return permitido; },
    hojeLista() { return linhas; }, usuarioAtual() { return { id: 'pessoa-ficticia', nome: 'Pessoa Fictícia', role: 'gestao' }; },
    Z44_DISPATCH80: { dados: { dia, assinaturaConteudo: assinatura, atualizadoEm } },
    vencPendCarregar: async () => ({}), Z44_FONTE: { ok: true, dia, registros: {} }, VENC_PEND: {},
    PELUDINHOS: [], firebase: { auth() { return { currentUser: { uid: 'uid-ficticio' } }; } }
  };
  window.window = window; window.globalThis = window;
  const contexto = { window, globalThis: window, document, console, Date: DataFalsa, Intl, Promise, JSON, Object, Array, Number, String, RegExp, Error,
    setTimeout: setTimeoutFalso, clearTimeout() {}, MutationObserver: undefined, navigator: {}, Blob: class {}, encodeURIComponent, decodeURIComponent };
  Object.assign(contexto, window);
  Object.assign(contexto, {
    DB: { ref() { throw new Error('o núcleo falso não deve consultar DB diretamente'); } },
    pelKey(p) { return p && p.n ? 'filhot-ficticio' : ''; }, dcKey() { return linhas[0].chave; }, pelExtra() { return {}; },
    vencItensDe() { return []; }
  });
  vm.createContext(contexto);
  const puro = { module: { exports: {} }, exports: {}, Intl, Date: DataFalsa, JSON, Object, Array, Number, String, RegExp, Error };
  vm.createContext(puro); vm.runInContext(script('zelozinha-tela94-puro'), puro);
  window.ZelozinhaTela94 = contexto.ZelozinhaTela94 = puro.module.exports;
  vm.runInContext(script('zelozinha-contatos89-ui'), contexto);
  imediatos.length = 0;

  await window.z89Render104(false);
  assert.equal(contagem.listar, 1, 'primeira abertura confirma as fontes');
  assert.doesNotMatch(destino.innerHTML, /Conferindo presenças e cuidados/);

  agora += 30 * 1000;
  atualizadoEm = `${dia}T14:00:30.000Z`;
  window.Z44_DISPATCH80.dados = { dia, assinaturaConteudo: assinatura, atualizadoEm };
  destino = alvo();
  const reabertura = window.z89Render104(false);
  assert.doesNotMatch(destino.innerHTML, /Conferindo presenças e cuidados/, 'snapshot confirmado aparece no mesmo turno');
  assert.equal(contagem.presenca, 0, 'reabertura não começa uma leitura por cartão antes de mostrar o snapshot');
  await reabertura;
  assert.equal(contagem.listar, 1, 'mudança apenas do carimbo não repete a cascata das fontes');
  rodarImediatos();
  await new Promise(setImmediate);
  assert.equal(contagem.presenca, 0, 'presença ainda fresca não ganha leitura individual');

  agora += 6 * 60 * 1000; destino = alvo();
  const revalidacao = window.z89Render104(false);
  assert.doesNotMatch(destino.innerHTML, /Conferindo presenças e cuidados/, 'snapshot continua visível durante a revalidação periódica');
  assert.equal(contagem.presenca, 0, 'presença vencida ainda não é lida no turno da montagem');
  await revalidacao;
  assert.equal(contagem.listar, 2, 'após cinco minutos a abertura revalida em segundo plano para captar mudanças externas');
  rodarImediatos(); await new Promise(setImmediate);
  assert.equal(contagem.presenca, 0, 'a listagem recém-confirmada evita uma leitura individual redundante');

  assinatura = 'conteudo-b';
  window.Z44_DISPATCH80.dados = { dia, assinaturaConteudo: assinatura, atualizadoEm: `${dia}T14:07:00.000Z` };
  await window.z89Render104(false);
  assert.equal(contagem.listar, 3, 'mudança material da projeção atualiza a lista');

  linhas = linhas.concat([{ chave: 'outro-filhot__outra-familia', fonte: 'checkin', hora: '09:00', itens: [] }]);
  await window.z89Render104(false);
  assert.equal(contagem.listar, 4, 'nova presença em memória invalida o snapshot do dia');

  assinatura = 'conteudo-c';
  window.Z44_DISPATCH80.dados = { dia, assinaturaConteudo: assinatura, atualizadoEm: `${dia}T14:08:00.000Z` };
  adiarLista = true;
  const voo1 = window.z89Render104(false), voo2 = window.z89Render104(false);
  assert.equal(contagem.listar, 5, 'duas reaberturas concorrentes compartilham um único voo');
  assert.doesNotMatch(destino.innerHTML, /Conferindo presenças e cuidados/, 'fonte lenta atualiza em segundo plano sem apagar os cartões');
  assinatura = 'conteudo-d';
  linhas = linhas.concat([{ chave: 'terceiro-filhot__terceira-familia', fonte: 'checkin', hora: '10:00', itens: [] }]);
  window.Z44_DISPATCH80.dados = { dia, assinaturaConteudo: assinatura, atualizadoEm: `${dia}T14:08:30.000Z` };
  adiarLista = false; liberarLista.splice(0).forEach(fn => fn());
  await Promise.all([voo1, voo2]);
  await new Promise(setImmediate);
  assert.equal(contagem.listar, 6, 'mudança material durante o voo agenda exatamente uma atualização posterior');
  assert.equal(contagem.fontes, 6, 'atualização material força a fonte real mesmo dentro do TTL da API');

  await window.z89Render104(true);
  assert.equal(contagem.listar, 7, 'Atualizar envios continua forçando fontes verdadeiras');

  falharLista = true;
  await window.z89Render104(true);
  assert.equal(contagem.listar, 8, 'a tentativa de atualização consulta a fonte verdadeira');
  assert.match(destino.innerHTML, /última consulta confirmada/, 'falha de atualização é avisada sem esconder o snapshot');
  assert.match(destino.innerHTML, /FILHOt Fictício/, 'os cartões confirmados permanecem visíveis durante a falha');
  falharLista = false;
  await window.z89Render104(true);
  assert.equal(contagem.listar, 9, 'recuperação faz uma nova consulta real');
  assert.doesNotMatch(destino.innerHTML, /última consulta confirmada/, 'leitura confirmada remove o aviso de atualização');

  assert.equal(typeof window.z89InvalidarSessao, 'function');
  window.z89InvalidarSessao();
  assert.match(destino.innerHTML, /Conferindo presenças e cuidados/, 'logout ou troca de pessoa remove o snapshot sensível');
  assert.ok(contagem.invalidar >= 1, 'cache interno do leitor também é invalidado');
  permitido = false;
  await window.z89Render104(false);
  assert.equal(contagem.listar, 9, 'perfil sem acesso não reutiliza nem relê os dados protegidos');
  permitido = true;
  await window.z89Render104(false);
  assert.equal(contagem.listar, 10, 'acesso restaurado exige nova confirmação das fontes');

  adiarPresenca = true; adiarLista = true; agora += 6 * 60 * 1000; destino = alvo();
  const listaAntiga = window.z89Render104(false); rodarImediatos(); await new Promise(setImmediate);
  assert.equal(contagem.presenca, 1, 'uma reconferência antiga ficou em voo enquanto a lista atualizava');
  window.z89InvalidarSessao();
  adiarLista = false; liberarLista.splice(0).forEach(fn => fn()); await listaAntiga;
  await window.z89Render104(false);
  adiarLista = true; agora += 6 * 60 * 1000; destino = alvo();
  const listaNova = window.z89Render104(false); rodarImediatos(); await new Promise(setImmediate);
  assert.equal(contagem.presenca, 2, 'a nova sessão não reutiliza o voo de presença anterior');
  liberarPresenca.shift()({ dia, dcKey: linhas[0].chave, saiu: true, saida: { fim: agora } });
  await new Promise(setImmediate);
  assert.doesNotMatch(destino.innerHTML, /já saiu da casa/i, 'callback tardio da sessão anterior não publica presença velha');
  liberarPresenca.shift()({ dia, dcKey: linhas[0].chave, presente: true, saiu: false });
  adiarPresenca = false; adiarLista = false; liberarLista.splice(0).forEach(fn => fn()); await listaNova; await new Promise(setImmediate);
}

const watchdog = setTimeout(() => { console.error('abertura-agil158 excedeu o tempo'); process.exit(1); }, 5000);
executar().then(() => console.log('abertura-agil158: OK')).catch(e => { console.error(e); process.exitCode = 1; }).finally(() => clearTimeout(watchdog));
