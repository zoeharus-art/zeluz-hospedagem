'use strict';
/*
 * Teste unitário da palavra-chave das pontes (integracao-telegram/Codigo.gs e
 * integracao-planilha/Codigo.gs) — auditoria 28/ago/2026, item 10 (docs/auditoria-28ago2026/
 * 06-pontes-e-pin.md).
 *
 * NÃO toca no Firebase, no Telegram nem no Google. Cada Codigo.gs é carregado de verdade
 * (o arquivo publicado é ESTE arquivo, sem cópia) dentro de uma sandbox `vm` do Node, com
 * duplos de mentira para os serviços do Apps Script (PropertiesService, Logger,
 * ContentService, SpreadsheetApp, UrlFetchApp, Utilities). O que se prova:
 *
 *   1. SEM a propriedade PONTE_SENHA configurada, doPost() recusa QUALQUER pedido —
 *      mesmo um com a senha antiga certa — e diz no log por quê. Nenhuma porta fica
 *      aberta por padrão.
 *   2. COM a propriedade certa, doPost() aceita a senha que bate com ela (a prova de
 *      "aceitou" é chegar além do portão — nenhuma das duas mensagens de recusa aparece).
 *   3. COM a propriedade certa mas a senha do pedido ERRADA, doPost() recusa.
 *   4. A string da antiga palavra-chave fixa não existe mais em NENHUM arquivo .gs do
 *      repositório — nem como valor funcional, nem como comentário.
 *
 * Uso:  node tests/pontes-senha.test.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const SENHA_ANTIGA = 'zeluz' + '-auaulandia'; // montada em duas partes: não pode nem aparecer aqui de corpo inteiro
const SENHA_NOVA = 'segredo-de-mentira-do-teste-29ago2026';

// ------------------------------------------------------------------ a sandbox do Apps Script
/** Duplo mínimo dos serviços do Apps Script usados no CAMINHO da senha (doPost). */
function montarSandbox(propriedades) {
  const logs = [];
  const props = Object.assign({}, propriedades);
  const sandbox = {
    logs,
    PropertiesService: {
      getScriptProperties() {
        return {
          getProperty(chave) {
            return Object.prototype.hasOwnProperty.call(props, chave) ? props[chave] : null;
          }
        };
      }
    },
    Logger: { log(msg) { logs.push(String(msg)); } },
    ContentService: {
      MimeType: { JSON: 'JSON' },
      createTextOutput(texto) {
        return {
          _texto: texto,
          setMimeType() { return this; },
          getContent() { return this._texto; }
        };
      }
    },
    // Não usados no caminho da senha, mas referenciados em outras funções do arquivo —
    // precisam existir para o script carregar sem ReferenceError.
    UrlFetchApp: { fetch() { throw new Error('UrlFetchApp.fetch não deveria ser chamado neste teste'); } },
    Utilities: {
      formatDate() { return ''; },
      newBlob() { return {}; },
      base64Decode() { return []; }
    },
    // Fake mínimo de planilha: sem abas, para _acharAba devolver null e as funções de
    // gravação caírem no próprio catch delas (o arquivo já trata isso — vira "ERRO - ...",
    // não uma exceção não tratada). É só o suficiente para provar que o PORTÃO DA SENHA
    // deixou passar; o conteúdo da planilha não é o que este teste audita.
    SpreadsheetApp: {
      getActiveSpreadsheet() {
        return { getSheetByName() { return null; }, getSheets() { return []; } };
      }
    },
    console
  };
  vm.createContext(sandbox);
  return sandbox;
}

/** Carrega um Codigo.gs de verdade na sandbox e devolve o contexto com as funções definidas. */
function carregarPonte(caminhoRelativo, propriedades) {
  const caminho = path.join(RAIZ, caminhoRelativo);
  const codigo = fs.readFileSync(caminho, 'utf8');
  const sandbox = montarSandbox(propriedades);
  vm.runInContext(codigo, sandbox, { filename: caminhoRelativo });
  return sandbox;
}

function chamarDoPost(sandbox, corpo) {
  const resposta = sandbox.doPost({ postData: { contents: JSON.stringify(corpo) } });
  return JSON.parse(resposta.getContent());
}

// ------------------------------------------------------------------ as duas pontes sob teste
const PONTES = [
  {
    nome: 'integracao-telegram/Codigo.gs',
    arquivo: 'integracao-telegram/Codigo.gs',
    // O campo do corpo que carrega a senha é 'senha'. Um grupo que não existe na ponte é
    // recusado SEM chamar o Telegram — prova limpa, sem rede, de que passou do portão.
    corpoComSenha(senha) { return { senha, grupo: 'grupo-de-teste-inexistente' }; },
    mensagemRecusaSenha: 'senha invalida',
    mensagemAlemDoPortao: 'grupo nao configurado na ponte: grupo-de-teste-inexistente'
  },
  {
    nome: 'integracao-planilha/Codigo.gs',
    arquivo: 'integracao-planilha/Codigo.gs',
    // O campo do corpo que carrega a senha é 'token'. Com a sandbox de planilha vazia, o
    // que vem depois do portão são erros de gravação capturados (ok:true, com 'ERRO - ...'
    // nos dois campos) — nunca a mensagem de senha/token inválido.
    corpoComSenha(senha) { return { token: senha }; },
    mensagemRecusaSenha: 'token invalido'
  }
];

// ------------------------------------------------------------------ os testes
const testes = [];
function teste(nome, fn) { testes.push({ nome, fn }); }

PONTES.forEach((ponte) => {
  teste(`${ponte.nome} — sem PONTE_SENHA configurada: recusa mesmo com a senha certa`, () => {
    const sandbox = carregarPonte(ponte.arquivo, {}); // nenhuma propriedade
    const r = chamarDoPost(sandbox, ponte.corpoComSenha(SENHA_NOVA));
    assert.strictEqual(r.ok, false, 'sem a propriedade, o pedido tem de ser recusado');
    assert.ok(/PONTE_SENHA não configurada/.test(r.erro || ''),
      'a recusa tem de dizer que falta PONTE_SENHA — não pode ser um erro genérico: ' + JSON.stringify(r));
    assert.ok(sandbox.logs.some((l) => /PONTE_SENHA não configurada/.test(l)),
      'o log tem de registrar por que recusou — o silêncio não pode ter dois significados');
  });

  teste(`${ponte.nome} — com PONTE_SENHA configurada e senha certa: aceita`, () => {
    const sandbox = carregarPonte(ponte.arquivo, { PONTE_SENHA: SENHA_NOVA });
    const r = chamarDoPost(sandbox, ponte.corpoComSenha(SENHA_NOVA));
    assert.notStrictEqual(r.erro, ponte.mensagemRecusaSenha, 'não pode recusar por senha quando ela está certa');
    assert.ok(!/PONTE_SENHA não configurada/.test(r.erro || ''), 'a propriedade está configurada — não pode reclamar dela');
    if (ponte.mensagemAlemDoPortao) {
      assert.strictEqual(r.erro, ponte.mensagemAlemDoPortao,
        'com a senha certa, o pedido tem de passar do portão e chegar ao próximo passo real');
    } else {
      assert.strictEqual(r.ok, true, 'com a senha certa e sem grupo/aba em jogo, o pedido segue como ok');
    }
  });

  teste(`${ponte.nome} — com PONTE_SENHA configurada e senha ERRADA no pedido: recusa`, () => {
    const sandbox = carregarPonte(ponte.arquivo, { PONTE_SENHA: SENHA_NOVA });
    const r = chamarDoPost(sandbox, ponte.corpoComSenha('outra-coisa-qualquer'));
    assert.strictEqual(r.ok, false, 'senha errada tem de ser recusada');
    assert.strictEqual(r.erro, ponte.mensagemRecusaSenha,
      'a mensagem de recusa tem de ser a de senha/token inválido — não a de propriedade ausente');
  });

  teste(`${ponte.nome} — sem PONTE_SENHA: recusa mesmo um pedido SEM campo de senha nenhum`, () => {
    const sandbox = carregarPonte(ponte.arquivo, {});
    const r = chamarDoPost(sandbox, { texto: 'sem senha nenhuma no corpo' });
    assert.strictEqual(r.ok, false);
    assert.ok(/PONTE_SENHA não configurada/.test(r.erro || ''));
  });
});

teste('a antiga palavra-chave fixa não existe mais em nenhum arquivo .gs do repositório', () => {
  const arquivosGs = [];
  (function varrer(dir) {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      if (item.name === 'node_modules' || item.name === '.git') continue;
      const caminho = path.join(dir, item.name);
      if (item.isDirectory()) varrer(caminho);
      else if (item.isFile() && item.name.endsWith('.gs')) arquivosGs.push(caminho);
    }
  })(RAIZ);

  assert.ok(arquivosGs.length >= 3, 'esperava encontrar pelo menos as 3 pontes (.gs) do repositório, achei ' + arquivosGs.length);

  const comAAntiga = arquivosGs.filter((f) => fs.readFileSync(f, 'utf8').indexOf(SENHA_ANTIGA) !== -1);
  assert.deepStrictEqual(comAAntiga.map((f) => path.relative(RAIZ, f)), [],
    'a antiga palavra-chave fixa ainda aparece em: ' + comAAntiga.join(', '));
});

// ------------------------------------------------------------------ execução
(async () => {
  let passou = 0, falhou = 0;
  for (const t of testes) {
    try {
      await t.fn();
      console.log('  ok   ' + t.nome);
      passou++;
    } catch (e) {
      console.log('  FALHA ' + t.nome + '\n         ' + e.message);
      falhou++;
    }
  }
  console.log(`\n${passou} passaram, ${falhou} falharam.`);
  process.exit(falhou ? 1 : 0);
})();
