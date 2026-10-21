#!/usr/bin/env node
'use strict';
/*
 * VARREDURA de segredo, dado pessoal e endereço da VPS (Story 6.112, AC8.1, AC8.2, AC12.4, AC12.7).
 *
 * Para que serve: o projeto é ABERTO na internet e o histórico dele é público. Esta varredura roda em
 * todo pull request (e no commit do Merge) e fica vermelha se achar, em qualquer commit:
 *   - segredo: chave privada, token, JWT, chave de API, credencial atribuída a uma variável, senha em endereço;
 *   - dado pessoal: telefone com DDD, identificador do WhatsApp, e-mail, CPF;
 *   - endereço da VPS: IP, porta de SSH, impressão digital de SSH e os nomes da lista hosts-proibidos.sha256.
 *
 * O que ela NUNCA faz: mostrar o valor achado. O log do GitHub deste projeto é público, então a saída diz
 * só onde (arquivo:linha, ou a mensagem do commit), qual regra e, no modo de commits, qual commit.
 *
 * Dois modos:
 *   node zelozinha/provas/varredura.js --commits <base>..<head> [--repo <pasta>] [--escopo-total]
 *       Todos os commits do intervalo (sem os de junção): a mensagem de cada um e as linhas ACRESCENTADAS
 *       por ele; mais o resultado final do intervalo, para pegar o que uma junção trouxe. Um segredo posto no 1º commit e tirado no 2º continua sendo achado (AC8.1). Linhas que já
 *       estavam no projeto não são lidas de novo.
 *   node zelozinha/provas/varredura.js --arvore <pasta> [--so a,b,c]
 *       Todos os arquivos de texto de uma pasta (ou só os caminhos de --so). Com escopo total.
 *
 * Escopo (modo de commits): as regras de SEGREDO valem em qualquer arquivo; as de dado pessoal e de endereço
 * da VPS valem na "superfície" do projeto novo (AGENTS.md, CLAUDE.md, .github/, zelozinha/, regras-banco/),
 * para não travar o Merge de um pull request do app por um e-mail ou telefone que já mora no app.
 * A chave de API do Firebase que está no HTML do app é pública por natureza e por isso só vale na superfície.
 *
 * Saída: 0 = verde, 1 = vermelho (achou algo), 2 = uso errado ou erro (nunca verde por engano).
 *
 * Limites ditos com honestidade: telefone sem pontuação e sem o 55 na frente não é achado; binários e arquivos
 * maiores que 5 MB não são lidos (a saída conta quantos); nome de FILHOt e de tutor não se acha por padrão,
 * só por leitura (AC2.1(d), AC9.1).
 */

const cp = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const SUPERFICIE = ['AGENTS.md', 'CLAUDE.md', '.github/', 'zelozinha/', 'regras-banco/'];
const ARQUIVO_HOSTS = path.join(__dirname, 'hosts-proibidos.sha256');
const LIMITE_BYTES = 5 * 1024 * 1024;
const PASTAS_IGNORADAS = new Set(['.git', 'node_modules']);
const MENSAGEM_DO_COMMIT = '(mensagem do commit)';
const TAMANHO_DA_JANELA = 20000;   // linhas enormes (código minificado) são lidas em janelas, para a busca não ficar lenta

const sha256 = (texto) => crypto.createHash('sha256').update(texto).digest('hex');

// ---------------------------------------------------------------------------------------------
// As regras
// ---------------------------------------------------------------------------------------------

function algumaCasa(lista, linha) { return lista.some((re) => re.test(linha)); }

const RE_CHAVE_PRIVADA = /-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY(?: BLOCK)?-----/;

const RE_TOKEN = [
  /\bgh[pousr]_[A-Za-z0-9]{30,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
  /\bxox[abprs]-[A-Za-z0-9-]{10,}/,
  /\bya29\.[A-Za-z0-9_-]{20,}/,
  /(?<![\w:])\d{8,10}:[A-Za-z0-9_-]{35}\b/,
  /\bBearer\s+[A-Za-z0-9._~+/=-]{24,}/,
];

const RE_JWT = /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/;

const RE_CHAVE_API = [
  /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/,
  /\b[sr]k_(?:live|test)_[0-9A-Za-z]{16,}\b/,
  /\bsk-(?:ant-|proj-)?[A-Za-z0-9_-]{20,}/,
];
const RE_CHAVE_GOOGLE = /\bAIza[0-9A-Za-z_-]{35}\b/;   // a do Firebase no HTML do app é pública: só vale na superfície

const RE_ATRIBUICAO = /(?:token|secret|segredo|senha|password|passwd|api[_-]?key|apikey|private[_-]?key|chave[_-]?(?:privada|api))\w*["']?\s*[:=]\s*["']([^"'\s]{12,})["']/gi;

function parecerSegredo(valor, superficie) {
  if (/[<>${}*]/.test(valor)) return false;                       // marcador, variável ou máscara
  if (/^(.)\1+$/.test(valor)) return false;                       // um caractere só, repetido
  if (/exemplo|example|placeholder|inventad|sintetic|fake|mentira|dummy|mock|troque|xxxx/i.test(valor)) return false;
  if (!superficie && /^AIza[0-9A-Za-z_-]{35}$/.test(valor)) return false;   // chave do Firebase no app: pública por natureza
  return (/[A-Za-z]/.test(valor) && /\d/.test(valor)) || valor.length >= 32;
}

function credencialAtribuida(linha, superficie) {
  RE_ATRIBUICAO.lastIndex = 0;
  let m;
  while ((m = RE_ATRIBUICAO.exec(linha)) !== null) {
    if (parecerSegredo(m[1], superficie)) return true;
  }
  return false;
}

const RE_SENHA_EM_ENDERECO = /\b[a-z][a-z0-9+.-]*:\/\/[^\s/:@<>${}*]+:[^\s/@<>${}*]{3,}@[^\s/]+/i;

// As fronteiras (?<!\w) e (?!\w) evitam achar "telefone" no meio de um hash ou de um texto em base64 (manifesto, lockfile).
const RE_TELEFONE = [
  /(?<!\w)\+?55[\s.-]?\(?[1-9]\d\)?[\s.-]?9?\d{4}[\s.-]?\d{4}(?!\w)/,
  /\([1-9]\d\)\s?9?\d{4}[\s.-]?\d{4}(?!\d)/,
  /(?<![\w.\-/])[1-9]\d[\s.-]9\d{4}[\s.-]?\d{4}(?!\w)/,
];

const RE_JID = /[A-Za-z0-9._:-]{6,}@(?:s\.whatsapp\.net|c\.us|g\.us|lid|broadcast)\b/;

const RE_EMAIL = /[A-Za-z0-9._%+-]+@([A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,})\b/g;
const EXTENSAO_DE_ARQUIVO = /\.(?:png|jpe?g|gif|svg|webp|ico|css|js|mjs|cjs|json|md|html?|txt|ya?ml|sh|ts|map|woff2?|ttf|pdf|bin)$/;
const HOST_DE_EXEMPLO = /(?:^|\.)(?:example\.(?:com|org|net)|exemplo\.(?:com|org|net|com\.br)|invalid|test|localhost|example)$/;

function emailDeVerdade(linha) {
  RE_EMAIL.lastIndex = 0;
  let m;
  while ((m = RE_EMAIL.exec(linha)) !== null) {
    const local = m[0].slice(0, m[0].indexOf('@')).toLowerCase();
    const host = m[1].toLowerCase();
    if (host.endsWith('users.noreply.github.com')) continue;
    if (local === 'noreply' && (host === 'anthropic.com' || host === 'github.com')) continue;   // rodapé dos commits
    if (EXTENSAO_DE_ARQUIVO.test(host)) continue;                                               // logo@2x.png
    if (HOST_DE_EXEMPLO.test(host)) continue;
    if (/^(?:s\.whatsapp\.net|c\.us|g\.us)$/.test(host)) continue;                              // é identificador do WhatsApp
    return true;
  }
  return false;
}

function cpfValido(onze) {
  if (!/^\d{11}$/.test(onze) || /^(\d)\1{10}$/.test(onze)) return false;
  const digitos = onze.split('').map(Number);
  const dv = (n) => {
    let soma = 0;
    for (let i = 0; i < n; i++) soma += digitos[i] * (n + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return dv(9) === digitos[9] && dv(10) === digitos[10];
}

const RE_CPF_FORMATADO = /(?<![\d.])\d{3}\.\d{3}\.\d{3}-\d{2}(?!\d)/;
const RE_ONZE_DIGITOS = /(?<![\w.\-/])\d{11}(?![\w\-/]|\.\d)/g;   // fora de hash e de texto colado

function temCpf(linha) {
  if (RE_CPF_FORMATADO.test(linha)) return true;
  RE_ONZE_DIGITOS.lastIndex = 0;
  let m;
  while ((m = RE_ONZE_DIGITOS.exec(linha)) !== null) {
    if (cpfValido(m[0])) return true;
  }
  return false;
}

const OCTETO = '(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)';
const RE_IPV4 = new RegExp('(?<![\\d.])(' + OCTETO + '(?:\\.' + OCTETO + '){3})(?!\\d|\\.\\d)', 'g');

function ipIgnorado(o) {
  const a = o[0]; const b = o[1]; const c = o[2];
  if (a === 0 || a === 127 || a >= 224) return true;            // 0.0.0.0, loopback, multicast e máscaras
  if (a === 10 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31) || (a === 169 && b === 254)) return true;   // rede interna
  if ((a === 192 && b === 0 && c === 2) || (a === 198 && b === 51 && c === 100) || (a === 203 && b === 0 && c === 113)) return true;   // endereços de documentação (RFC 5737)
  return false;
}

function ipPublico(linha) {
  RE_IPV4.lastIndex = 0;
  let m;
  while ((m = RE_IPV4.exec(linha)) !== null) {
    if (!ipIgnorado(m[1].split('.').map(Number))) return true;
  }
  return false;
}

const RE_PORTA = [
  /\bssh\b[^\n]*?\s-p\s*\d{2,5}\b/,
  /\bscp\b[^\n]*?\s-P\s*\d{2,5}\b/,
  /\bPort[\s=]+\d{2,5}\b/,
  /\b[a-z][a-z0-9+.-]*:\/\/(?!localhost\b|127\.|0\.0\.0\.0|\[::1\])[A-Za-z0-9.-]+:\d{2,5}\b/i,
];

const RE_IMPRESSAO_SSH = [
  /\bSHA256:[A-Za-z0-9+/]{43}(?![A-Za-z0-9+/])/,
  /\bssh-(?:ed25519|rsa|dss)\s+AAAA[0-9A-Za-z+/]{40,}/,
  /\becdsa-sha2-nistp\d+\s+AAAA[0-9A-Za-z+/]{40,}/,
];

const RE_NOME_DE_HOST = /[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+/g;
const cacheDeImpressoes = new Map();

function impressao(nome) {
  let h = cacheDeImpressoes.get(nome);
  if (h === undefined) {
    if (cacheDeImpressoes.size > 100000) cacheDeImpressoes.clear();
    h = sha256(nome);
    cacheDeImpressoes.set(nome, h);
  }
  return h;
}

function hostProibido(linha, hashes) {
  if (!hashes || hashes.size === 0) return false;
  const nomes = linha.toLowerCase().match(RE_NOME_DE_HOST);
  if (!nomes) return false;
  for (const nome of nomes) {
    const partes = nome.split('.');
    for (let i = 0; i <= partes.length - 2; i++) {
      if (hashes.has(impressao(partes.slice(i).join('.')))) return true;   // o nome, ou um nome-pai dele
    }
  }
  return false;
}

/**
 * Cada regra: id estável, grupo, rótulo (em português, sem valor), escopo ('tudo' = vale em qualquer arquivo;
 * 'superficie' = só na superfície do projeto novo) e testar(linha, contexto) -> verdadeiro/falso.
 */
const REGRAS = [
  { id: 'chave-privada', grupo: 'segredo', escopo: 'tudo', rotulo: 'chave privada', testar: (l) => RE_CHAVE_PRIVADA.test(l) },
  { id: 'token', grupo: 'segredo', escopo: 'tudo', rotulo: 'token de acesso', testar: (l) => algumaCasa(RE_TOKEN, l) },
  { id: 'jwt', grupo: 'segredo', escopo: 'tudo', rotulo: 'JWT', testar: (l) => RE_JWT.test(l) },
  { id: 'chave-api', grupo: 'segredo', escopo: 'tudo', rotulo: 'chave de API', testar: (l, c) => algumaCasa(RE_CHAVE_API, l) || (c.superficie && RE_CHAVE_GOOGLE.test(l)) },
  { id: 'credencial-atribuida', grupo: 'segredo', escopo: 'tudo', rotulo: 'valor de segredo atribuído a uma variável ou chave', testar: (l, c) => credencialAtribuida(l, c.superficie) },
  { id: 'senha-em-endereco', grupo: 'segredo', escopo: 'tudo', rotulo: 'senha dentro de um endereço', testar: (l) => RE_SENHA_EM_ENDERECO.test(l) },
  { id: 'telefone-ddd', grupo: 'pessoal', escopo: 'superficie', rotulo: 'telefone com DDD', testar: (l) => algumaCasa(RE_TELEFONE, l) },
  { id: 'jid-whatsapp', grupo: 'pessoal', escopo: 'superficie', rotulo: 'identificador do WhatsApp', testar: (l) => RE_JID.test(l) },
  { id: 'email', grupo: 'pessoal', escopo: 'superficie', rotulo: 'e-mail', testar: (l) => emailDeVerdade(l) },
  { id: 'cpf', grupo: 'pessoal', escopo: 'superficie', rotulo: 'CPF', testar: (l) => temCpf(l) },
  { id: 'ip-publico', grupo: 'endereco', escopo: 'superficie', rotulo: 'endereço IP de servidor', testar: (l) => ipPublico(l) },
  { id: 'porta-ssh', grupo: 'endereco', escopo: 'superficie', rotulo: 'porta de servidor', testar: (l) => algumaCasa(RE_PORTA, l) },
  { id: 'impressao-ssh', grupo: 'endereco', escopo: 'superficie', rotulo: 'impressão digital ou chave pública de SSH', testar: (l) => algumaCasa(RE_IMPRESSAO_SSH, l) },
  { id: 'host-proibido', grupo: 'endereco', escopo: 'superficie', rotulo: 'nome de servidor da lista de proibidos', testar: (l, c) => hostProibido(l, c.hashes) },
];

// ---------------------------------------------------------------------------------------------
// A lista de nomes proibidos (impressões digitais SHA-256; o nome nunca é escrito)
// ---------------------------------------------------------------------------------------------

function carregarHashesProibidos(arquivo) {
  const conjunto = new Set();
  let texto = '';
  try { texto = fs.readFileSync(arquivo || ARQUIVO_HOSTS, 'utf8'); } catch (e) { return conjunto; }
  texto.split('\n').forEach((linha) => {
    const t = linha.trim();
    if (t === '' || t[0] === '#') return;
    const m = /^([0-9a-f]{64})(?:\s|$)/.exec(t);
    if (m) conjunto.add(m[1]);
  });
  return conjunto;
}

let hashesPadrao = null;
function hashesDaCasa() {
  if (hashesPadrao === null) hashesPadrao = carregarHashesProibidos();
  return hashesPadrao;
}

// ---------------------------------------------------------------------------------------------
// Varrer texto, árvore e commits
// ---------------------------------------------------------------------------------------------

function normalizarCaminho(caminho) {
  return String(caminho).replace(/\\/g, '/').replace(/^\.\//, '');
}

function dentroDaSuperficie(caminho) {
  const c = normalizarCaminho(caminho);
  return SUPERFICIE.some((s) => (s.endsWith('/') ? c.startsWith(s) : c === s));
}

function linhaComAlgumaRegra(linha, regras, contexto) {
  const ids = [];
  regras.forEach((r) => {
    if (r.escopo === 'superficie' && !contexto.superficie) return;
    if (linha.length <= TAMANHO_DA_JANELA) {
      if (r.testar(linha, contexto)) ids.push(r);
      return;
    }
    for (let i = 0; i < linha.length; i += TAMANHO_DA_JANELA - 256) {
      if (r.testar(linha.slice(i, i + TAMANHO_DA_JANELA), contexto)) { ids.push(r); return; }
    }
  });
  return ids;
}

/**
 * Varre um texto. Devolve [{ caminho, linha, regra, rotulo, grupo }]; NUNCA o valor achado.
 * opcoes: { escopoTotal, hashesProibidos (Set de SHA-256), regras }
 */
function varrerTexto(texto, caminho, opcoes) {
  const o = opcoes || {};
  const contexto = {
    superficie: !!o.escopoTotal || dentroDaSuperficie(caminho),
    hashes: o.hashesProibidos || hashesDaCasa(),
  };
  const regras = o.regras || REGRAS;
  const achados = [];
  String(texto).split('\n').forEach((linha, i) => {
    linhaComAlgumaRegra(linha, regras, contexto).forEach((r) => {
      achados.push({ caminho: normalizarCaminho(caminho), linha: i + 1, regra: r.id, rotulo: r.rotulo, grupo: r.grupo });
    });
  });
  return achados;
}

function ehBinario(buffer) {
  const n = Math.min(buffer.length, 8192);
  for (let i = 0; i < n; i++) if (buffer[i] === 0) return true;
  return false;
}

/** Todos os arquivos de texto de uma pasta (ou só os caminhos de `so`). */
function varrerArvore(pasta, opcoes) {
  const o = Object.assign({ escopoTotal: true }, opcoes || {});
  const resultado = { arquivos: 0, binarios: 0, grandes: 0, pastasIgnoradas: 0, achados: [] };
  const raiz = path.resolve(pasta);

  function lerArquivo(absoluto) {
    const relativo = normalizarCaminho(path.relative(raiz, absoluto));
    const tamanho = fs.statSync(absoluto).size;
    if (tamanho > LIMITE_BYTES) { resultado.grandes++; return; }
    const buffer = fs.readFileSync(absoluto);
    if (ehBinario(buffer)) { resultado.binarios++; return; }
    resultado.arquivos++;
    varrerTexto(buffer.toString('utf8'), relativo, o).forEach((a) => resultado.achados.push(a));
  }

  function andar(absoluto) {
    let info;
    try { info = fs.lstatSync(absoluto); } catch (e) { return; }
    if (info.isSymbolicLink()) return;
    if (info.isDirectory()) {
      if (PASTAS_IGNORADAS.has(path.basename(absoluto)) && absoluto !== raiz) { resultado.pastasIgnoradas++; return; }
      fs.readdirSync(absoluto).sort().forEach((nome) => andar(path.join(absoluto, nome)));
      return;
    }
    if (info.isFile()) lerArquivo(absoluto);
  }

  if (o.so && o.so.length) o.so.forEach((rel) => andar(path.join(raiz, rel)));
  else andar(raiz);
  return resultado;
}

function gitNoRepositorio(repo, args) {
  const r = cp.spawnSync('git', ['-c', 'core.quotepath=false', '--no-pager'].concat(args), {
    cwd: repo,
    env: Object.assign({}, process.env, { GIT_TERMINAL_PROMPT: '0' }),
    maxBuffer: 1024 * 1024 * 1024,
    encoding: 'utf8',
  });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error('git ' + args[0] + ' falhou: ' + String(r.stderr || '').trim().split('\n')[0]);
  return r.stdout;
}

/**
 * Lê um diff sem contexto (-U0) e devolve só as linhas acrescentadas, com o número da linha NO ARQUIVO NOVO.
 * Anda pelas contagens do cabeçalho @@ para não confundir uma linha de conteúdo "+++ x" com um cabeçalho.
 */
function linhasAcrescentadas(diff) {
  const saida = [];
  const linhas = diff.split('\n');
  let caminho = null;
  let i = 0;
  while (i < linhas.length) {
    const l = linhas[i];
    if (l.startsWith('diff --git ')) { caminho = null; i++; continue; }
    if (l.startsWith('+++ ')) {
      const bruto = l.slice(4).split('\t')[0];
      const m = /^"?b\/(.*?)"?$/.exec(bruto);
      caminho = m ? m[1] : null;
      i++;
      continue;
    }
    const cab = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(l);
    if (cab && caminho !== null) {
      let velhas = cab[2] === undefined ? 1 : Number(cab[2]);
      let novas = cab[4] === undefined ? 1 : Number(cab[4]);
      let numero = Number(cab[3]) + (novas === 0 ? 1 : 0);
      i++;
      while ((velhas > 0 || novas > 0) && i < linhas.length) {
        const c = linhas[i];
        if (c.startsWith('+')) { saida.push({ caminho, linha: numero, texto: c.slice(1) }); numero++; novas--; }
        else if (c.startsWith('-')) velhas--;
        else if (!c.startsWith('\\')) { numero++; velhas--; novas--; }   // linha de contexto (não ocorre com -U0, mas não quebra)
        i++;
      }
      continue;
    }
    i++;
  }
  return saida;
}

function intervaloValido(intervalo) {
  return typeof intervalo === 'string' && /^[0-9A-Za-z_@{}\/~^.][0-9A-Za-z_@{}\/~^.-]*$/.test(intervalo) && intervalo.includes('..');
}

/** Todos os commits de `base..head`: a mensagem de cada um e as linhas que ele acrescentou. */
function varrerCommits(repo, intervalo, opcoes) {
  const o = opcoes || {};
  if (!intervaloValido(intervalo)) throw new Error('Intervalo de commits inválido: use <base>..<head>, sem espaços nem opções.');
  let commits;
  try {
    commits = gitNoRepositorio(repo, ['rev-list', '--no-merges', '--reverse', intervalo]).split('\n').filter(Boolean);
  } catch (e) {
    throw new Error('Intervalo de commits não encontrado (' + e.message + ')');
  }
  const resultado = { commits: commits.length, arquivos: 0, achados: [] };
  const vistos = new Set();
  commits.forEach((commit) => {
    const mensagem = gitNoRepositorio(repo, ['show', '-s', '--format=%B', commit]);
    varrerTexto(mensagem, MENSAGEM_DO_COMMIT, Object.assign({}, o, { escopoTotal: true })).forEach((a) => {
      resultado.achados.push(Object.assign({ commit }, a));
    });
    const diff = gitNoRepositorio(repo, ['show', '--format=', '--no-color', '--no-ext-diff', '--unified=0', commit]);
    const porArquivo = new Map();
    linhasAcrescentadas(diff).forEach((l) => {
      if (!porArquivo.has(l.caminho)) porArquivo.set(l.caminho, []);
      porArquivo.get(l.caminho).push(l);
    });
    porArquivo.forEach((linhas, caminho) => {
      vistos.add(caminho);
      const contexto = {
        superficie: !!o.escopoTotal || dentroDaSuperficie(caminho),
        hashes: o.hashesProibidos || hashesDaCasa(),
      };
      linhas.forEach((l) => {
        linhaComAlgumaRegra(l.texto, o.regras || REGRAS, contexto).forEach((r) => {
          resultado.achados.push({ commit, caminho, linha: l.linha, regra: r.id, rotulo: r.rotulo, grupo: r.grupo });
        });
      });
    });
  });
  // Commits de junção não têm diff próprio acima. Para uma linha posta na resolução de uma junção não escapar,
  // confere também o resultado final do intervalo; só entra o que ainda não foi achado naquele arquivo e regra.
  const pontas = intervalo.split(/\.\.\.?/);
  if (pontas.length === 2 && pontas[0] !== '' && pontas[1] !== '') {
    const jaAchados = new Set(resultado.achados.map((a) => a.caminho + '\n' + a.regra));
    const liquido = gitNoRepositorio(repo, ['diff', '--no-color', '--no-ext-diff', '--no-renames', '--unified=0', pontas[0] + '...' + pontas[1]]);
    linhasAcrescentadas(liquido).forEach((l) => {
      const contexto = {
        superficie: !!o.escopoTotal || dentroDaSuperficie(l.caminho),
        hashes: o.hashesProibidos || hashesDaCasa(),
      };
      linhaComAlgumaRegra(l.texto, o.regras || REGRAS, contexto).forEach((r) => {
        const chave = l.caminho + '\n' + r.id;
        if (jaAchados.has(chave)) return;
        jaAchados.add(chave);
        vistos.add(l.caminho);
        resultado.achados.push({ commit: '', caminho: l.caminho, linha: l.linha, regra: r.id, rotulo: r.rotulo, grupo: r.grupo });
      });
    });
  }
  resultado.arquivos = vistos.size;
  return resultado;
}

// ---------------------------------------------------------------------------------------------
// Linha de comando
// ---------------------------------------------------------------------------------------------

function mostrarAchados(achados) {
  achados.forEach((a) => {
    console.log('ACHADO  ' + a.caminho + (a.caminho === MENSAGEM_DO_COMMIT ? '' : ':' + a.linha) + '  [' + a.regra + '] ' + a.rotulo + (a.commit ? '  (commit ' + a.commit.slice(0, 8) + ')' : (a.commit === '' ? '  (resultado final do intervalo)' : '')));
  });
}

function fecho(achados) {
  if (achados.length === 0) {
    console.log('VERDE: nenhum achado.');
    return 0;
  }
  console.log('VERMELHO: ' + achados.length + ' achado(s). Nenhum valor é mostrado, porque o log do GitHub deste projeto é público. Tire o que foi achado (e, se era segredo, troque o segredo: apagar do histórico não basta) e rode de novo.');
  return 1;
}

function plural(n, singular, pluralTexto) { return n + ' ' + (n === 1 ? singular : pluralTexto); }

function principal(argv) {
  const args = argv.slice();
  const pegar = (nome) => { const i = args.indexOf(nome); if (i === -1) return null; const v = args[i + 1]; args.splice(i, v === undefined ? 1 : 2); return v === undefined ? '' : v; };
  const tem = (nome) => { const i = args.indexOf(nome); if (i === -1) return false; args.splice(i, 1); return true; };
  try {
    if (tem('--ajuda') || tem('-h')) {
      console.log('Uso:\n  node zelozinha/provas/varredura.js --commits <base>..<head> [--repo <pasta>] [--escopo-total]\n  node zelozinha/provas/varredura.js --arvore <pasta> [--so a,b,c]');
      return 0;
    }
    const intervalo = pegar('--commits');
    const arvore = pegar('--arvore');
    const repo = pegar('--repo') || process.cwd();
    const so = pegar('--so');
    const escopoTotal = tem('--escopo-total');
    if ((intervalo === null) === (arvore === null)) {
      console.error('ERRO: informe --commits <base>..<head> OU --arvore <pasta>.');
      return 2;
    }
    if (intervalo !== null) {
      const r = varrerCommits(repo, intervalo, { escopoTotal });
      console.log('Varredura de segredo, dado pessoal e endereço da VPS: ' + plural(r.commits, 'commit', 'commits') + ' (' + intervalo + '), ' + plural(r.arquivos, 'arquivo com linhas acrescentadas', 'arquivos com linhas acrescentadas') + '.');
      mostrarAchados(r.achados);
      return fecho(r.achados);
    }
    const r = varrerArvore(arvore, { so: so ? so.split(',').filter(Boolean) : null });
    console.log('Varredura de segredo, dado pessoal e endereço da VPS: ' + plural(r.arquivos, 'arquivo lido', 'arquivos lidos') + '. Não lidos: ' + r.binarios + ' binário(s), ' + r.grandes + ' grande(s) (mais de 5 MB), ' + plural(r.pastasIgnoradas, 'pasta ignorada', 'pastas ignoradas') + ' (.git e node_modules).');
    mostrarAchados(r.achados);
    return fecho(r.achados);
  } catch (e) {
    console.error('ERRO: ' + e.message);
    return 2;
  }
}

module.exports = {
  REGRAS,
  SUPERFICIE,
  carregarHashesProibidos,
  dentroDaSuperficie,
  linhasAcrescentadas,
  varrerArvore,
  varrerCommits,
  varrerTexto,
};

if (require.main === module) process.exit(principal(process.argv.slice(2)));
