#!/usr/bin/env node
'use strict';
/*
 * MONTADOR DO SITE — publica só as telas (Story 6.114, 21/out/2026).
 *
 * O QUE FAZ
 *   Lê a LISTA DE PERMITIDOS (.github/site-permitidos.txt), confere que cada linha é um arquivo
 *   exato do repositório e que nenhum está na REGRA FIXA de «nunca publicar»; prova que nenhuma
 *   tela pede um arquivo que não está na lista; copia SÓ a lista para a pasta de saída (_site/) e
 *   confere o resultado. O GitHub Pages publica essa pasta e mais nada.
 *
 * COMO USAR
 *   node tools/montar-site.js --lista .github/site-permitidos.txt --saida _site
 *   MOSTRAR_PEDIDOS=1 node tools/montar-site.js ...     mostra quem pede cada arquivo (página:linha)
 *
 *   Sai com código 0 quando aprova e 1 em qualquer falha. Usa só módulos do Node (fs, path,
 *   child_process), roda no Node 18 ou mais novo, sem `npm install` e sem rede.
 *
 *   A pasta de saída é APAGADA antes de montar, então só vale pasta DENTRO do repositório, sem nome
 *   oculto (nada de .git), sem arquivo versionado e sem .git dentro. Se ela já existe, só é apagada
 *   quando foi este montador que a criou (ele a marca dentro do .git ao aprovar); uma pasta que ele
 *   não criou é recusada com a frase, e quem apaga é a pessoa. No GitHub a pasta não existe e nada disso atrapalha.
 *
 * REGRA DE QUEM MEXE NO APP
 *   ARQUIVO NOVO DE TELA (script, estilo, imagem ou página que uma tela carrega) = LINHA NOVA em
 *   .github/site-permitidos.txt, NO MESMO COMMIT. Sem a linha, este script bloqueia, o fluxo do
 *   GitHub fica vermelho, nada é publicado e o site no ar continua o anterior (a correção não
 *   chega aos aparelhos). Antes de empurrar, rode o comando acima: ele mostra a linha que falta.
 *   Nunca ponha na lista as pastas docs, tests, tools, servidor-senha, zelozinha nem as pontes integracao-*.
 *   Publicar uma tela = rodada VERDE do fluxo + o endereço já servindo o APP_VERSAO novo. Só então
 *   carimbe a versão (tools/carimbar-versao.js); carimbo antes do site novo faz o aparelho recarregar
 *   a versão velha em laço.
 *
 * COMO A PROVA ENXERGA OS PEDIDOS (limites escritos; é análise estática do texto, não executa nada)
 *   - Parte das linhas `entrada` e segue o que elas carregam (páginas, .css e .js da lista).
 *   - Lê: src, href, srcset, poster, data, action, formaction e manifest com valor entre aspas;
 *     url() e @import de CSS; todo texto entre aspas que é, inteiro, um caminho de arquivo;
 *     e nome MONTADO no código com sufixo (+'.png', ${x}.png) quando vira pedido ao site.
 *   - NÃO lê atributo sem aspas, nome montado por variável sem sufixo de arquivo, nem o que a
 *     tela decide só depois de entrar (a visita no navegador e a conferência dos endereços no ar
 *     cobrem o resto). Regra para quem escreve código: escreva o nome do arquivo inteiro, entre
 *     aspas, para a prova enxergar.
 *   - Resolve `?...` e `#...` (tiram-se antes), %XX (decodifica) e compara byte a byte, com
 *     maiúsculas, minúsculas e acentos exatos. Caminho com «/» no começo bloqueia.
 *
 * Este script não lê o conteúdo de docs/, tests/, tools/ nem de arquivo fora da lista: só as
 * entradas e o que elas carregam.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const MODOS_ARQUIVO = new Set(['100644', '100755']);
const MAX_LINHA_LISTA = 500;

/** Erro de uso (argumento ou pasta de saída errados): sai com a frase pura, sem «erro inesperado». */
class ErroDeUso extends Error {}

// ====================================================================== REGRA FIXA
// Nunca vai para o site, mesmo que alguém ponha na lista. A conferência em shell do fluxo
// (.github/workflows/publicar-site.yml) escreve a MESMA regra de outro jeito: se uma das duas
// estiver errada, a outra bloqueia. Mexeu aqui? Mexa lá (o teste compara as duas).
const PASTAS_FIXAS = ['tests', 'docs', 'tools', 'servidor-senha', 'zelozinha', 'node_modules'];
const NOMES_SEGREDO = ['senhas', 'credenciais', 'conta-servico', 'service-account', 'secret'];

/** Devolve o motivo (texto curto) se o caminho cai na regra fixa; null se está livre. */
function regraFixa(caminho) {
  const baixo = caminho.toLowerCase();
  const partes = baixo.split('/');
  const nome = partes[partes.length - 1];
  if (PASTAS_FIXAS.indexOf(partes[0]) !== -1 && partes.length > 1) return 'pasta ' + partes[0] + '/';
  if (partes[0].indexOf('integracao-') === 0) return 'pontes integracao-*/';
  if (partes.some(function (p) { return p.charAt(0) === '.'; })) return 'arquivo ou pasta oculta, que começa com ponto';
  if (/\.md$/.test(baixo)) return 'documento .md';
  if (partes.some(function (p) { return /^(agents|claude)/.test(p); })) return 'instruções AGENTS/CLAUDE';
  if (partes.some(function (p) { return /^database\.rules/.test(p); }) || nome === 'firebase.json') return 'regras e configuração do banco';
  if (/\.(gs|jsonl)$/.test(baixo)) return 'código de ponte ou dados (.gs, .jsonl)';
  if (/^package[^/]*\.json$/.test(nome)) return 'package.json';
  if (/\.(pem|key)$/.test(baixo)) return 'chave (.pem, .key)';
  for (let i = 0; i < NOMES_SEGREDO.length; i++) {
    if (baixo.indexOf(NOMES_SEGREDO[i]) !== -1) return 'nome de segredo («' + NOMES_SEGREDO[i] + '»)';
  }
  return null;
}

// ====================================================================== LISTA
/**
 * Lê o texto da lista. Devolve { itens, erros }. Cada item: { tipo, caminho, linha }, com tipo
 * 'entrada', 'comum' ou 'nao-e-arquivo'. Tolera CRLF e BOM; apara espaço no começo e no fim.
 * Faz só a validação de FORMA (sem olhar o repositório).
 */
function lerLista(texto, nomeLista) {
  const erros = [];
  const itens = [];
  const vistos = new Map();
  let t = texto;
  if (t.charCodeAt(0) === 0xFEFF) t = t.slice(1);
  const linhas = t.split('\n');
  for (let i = 0; i < linhas.length; i++) {
    const n = i + 1;
    let l = linhas[i].replace(/\r$/, '');
    if (l.length > MAX_LINHA_LISTA) {
      erros.push(nomeLista + ':' + n + ': linha longa demais (mais de ' + MAX_LINHA_LISTA + ' caracteres). A lista só aceita arquivo exato, sem curinga e sem pasta.');
      continue;
    }
    l = l.replace(/[ \t\v\f]+#.*$/, '').replace(/^[ \t\v\f]+/, '').replace(/[ \t\v\f]+$/, '');
    if (l === '' || l.charAt(0) === '#') continue;

    let tipo = 'comum';
    let caminho = l;
    const m = /^(entrada|nao-e-arquivo)[ \t\v\f]+(.+)$/.exec(l);
    if (m) {
      tipo = m[1];
      caminho = m[2];
    } else if (l === 'entrada' || l === 'nao-e-arquivo') {
      erros.push(nomeLista + ':' + n + ': o prefixo "' + l + '" precisa de um caminho depois dele.');
      continue;
    }
    const defeito = defeitoDeForma(caminho);
    if (defeito) {
      erros.push(nomeLista + ':' + n + ': ' + defeito + ' ("' + cortar(caminho, 80) + '")');
      continue;
    }
    if (vistos.has(caminho)) {
      erros.push(nomeLista + ':' + n + ': "' + caminho + '" já aparece na linha ' + vistos.get(caminho) + '. Linha repetida.');
      continue;
    }
    vistos.set(caminho, n);
    itens.push({ tipo: tipo, caminho: caminho, linha: n });
  }
  return { itens: itens, erros: erros };
}

const FRASE_CURINGA = 'a lista só aceita arquivo exato, sem curinga e sem pasta.';

/** Defeito de forma do caminho (curinga, pasta, "..", "/" no começo...). Null se está certo. */
function defeitoDeForma(c) {
  if (/[\x00-\x1f\x7f]/.test(c)) return 'caractere de controle no caminho; ' + FRASE_CURINGA;
  if (c.indexOf('#') !== -1) return 'o caminho tem "#"; ' + FRASE_CURINGA;
  if (/[*?[\]{}]/.test(c)) return FRASE_CURINGA;
  if (c.indexOf('\\') !== -1) return 'barra invertida no caminho; ' + FRASE_CURINGA;
  if (c.charAt(0) === '/') return 'o caminho começa com "/"; ' + FRASE_CURINGA;
  if (c.charAt(c.length - 1) === '/') return FRASE_CURINGA;
  const partes = c.split('/');
  for (let i = 0; i < partes.length; i++) {
    if (partes[i] === '') return 'barras duplicadas no caminho; ' + FRASE_CURINGA;
    if (partes[i] === '.') return 'o caminho tem "."; ' + FRASE_CURINGA;
    if (partes[i] === '..') return 'o caminho tem ".."; ' + FRASE_CURINGA;
  }
  return null;
}

function cortar(s, n) { return s.length > n ? s.slice(0, n) + '...' : s; }

// ====================================================================== GIT
/** Índice do git: caminho exato -> modo ('100644', '120000'...). Exato, com maiúsculas e acentos. */
function lerIndice(raiz) {
  let saida;
  try {
    saida = execFileSync('git', ['-C', raiz, 'ls-files', '-s', '-z'], { maxBuffer: 256 * 1024 * 1024 }).toString('utf8');
  } catch (e) {
    throw new Error('não consegui ler o índice do git em ' + raiz + ' (' + e.message.split('\n')[0] + ')');
  }
  const mapa = new Map();
  saida.split('\0').forEach(function (reg) {
    if (!reg) return;
    const tab = reg.indexOf('\t');
    const modo = reg.slice(0, reg.indexOf(' '));
    mapa.set(reg.slice(tab + 1), modo);
  });
  return mapa;
}

function temArquivoSob(indice, pasta) {
  const prefixo = pasta + '/';
  for (const k of indice.keys()) if (k.indexOf(prefixo) === 0) return true;
  return false;
}

/** Confere a lista contra o repositório. Devolve os erros (lista vazia = tudo certo). */
function conferirContraRepositorio(itens, indice, raiz) {
  const erros = [];
  itens.forEach(function (it) {
    const c = it.caminho;
    if (it.tipo === 'nao-e-arquivo') {
      if (indice.has(c)) {
        erros.push(c + ': está marcado "nao-e-arquivo", mas é arquivo do repositório. Ponha como arquivo comum ou tire o pedido da tela.');
      }
      return;
    }
    const regra = regraFixa(c);
    if (regra) {
      erros.push(c + ': este caminho nunca vai para o site (' + regra + '). Tire da lista.');
      return;
    }
    if (!indice.has(c)) {
      if (temArquivoSob(indice, c)) erros.push(c + ': ' + FRASE_CURINGA);
      else erros.push(c + ': não é arquivo do repositório. Confira maiúsculas, minúsculas e acentos.');
      return;
    }
    if (!MODOS_ARQUIVO.has(indice.get(c))) {
      erros.push(c + ': não é arquivo comum (link simbólico ou submódulo). Só arquivo comum pode ser publicado.');
      return;
    }
    let st;
    try { st = fs.lstatSync(path.join(raiz, c)); } catch (e) { st = null; }
    if (!st) erros.push(c + ': não é arquivo do repositório. Confira maiúsculas, minúsculas e acentos. (ausente no disco)');
    else if (!st.isFile()) erros.push(c + ': não é arquivo comum (link simbólico ou submódulo). Só arquivo comum pode ser publicado.');
  });
  return erros;
}

// ====================================================================== PROVA
const EXT_ARQUIVO = 'js|mjs|css|html?|png|jpe?g|gif|svg|webp|avif|ico|bmp|json|pdf|md|txt|csv|xml|woff2?|ttf|otf|eot|mp3|mp4|webm|wav|ogg|map|wasm|gs|jsonl|ya?ml|zip';
const EXT_IMAGEM_ETC = 'png|jpe?g|gif|svg|webp|avif|ico|bmp|css|js|mjs|html?|json|woff2?|ttf|otf|mp3|mp4|webm';

// Todos os quantificadores têm limite: nenhuma expressão abaixo retrocede de forma catastrófica,
// mesmo numa linha de 8 MB sem quebra (AC3.6).
const RE_ATRIBUTO = /(?<![A-Za-z0-9_\-])(src|href|srcset|poster|data|action|formaction|manifest)[ \t]*=[ \t]*\\?(?:"([^"\n]{0,2000})"|'([^'\n]{0,2000})')/gi;
// A barra invertida antes da aspa de abrir (url(\'a.png\') dentro de um texto do código) é só o escape da aspa.
const RE_URL_CSS = /(?<![A-Za-z0-9_$.\-])url\([ \t]*(?:\\(?=["']))?(?:"([^"\n]{0,2000})"|'([^'\n]{0,2000})'|([^()'"\s]{0,2000}))[ \t]*\)/g;
const RE_IMPORT_CSS = /@import[ \t]+(?:"([^"\n]{0,2000})"|'([^'\n]{0,2000})')/g;
const CARAC_CAMINHO = '[\\p{L}\\p{M}\\p{N}_\\-.%()@~/]{1,200}';
const RE_TEXTO_CAMINHO = new RegExp(
  '([\'"`])((?:\\.{0,2}/)?' + CARAC_CAMINHO + '(?: ' + CARAC_CAMINHO + '){0,2}\\.(?:' + EXT_ARQUIVO + '))\\1', 'giu');
// Depois da extensão vale qualquer caractere que não seja letra ou número: a aspa que fecha o texto do código
// nem sempre é a que abriu (a tela escreve '<img src="a/'+n+'.png">' ou 'url(a/'+n+'.png)').
const RE_MONTADO_SUFIXO = new RegExp('\\+[ \\t]*[\'"`][\\w\\-./ ]{0,60}?\\.(?:' + EXT_IMAGEM_ETC + ')(?![A-Za-z0-9])', 'gi');
const RE_MONTADO_MODELO = new RegExp('\\$\\{[^}\\n]{0,200}\\}[\\w\\-./ ]{0,60}?\\.(?:' + EXT_IMAGEM_ETC + ')(?![\\w])', 'gi');
const RE_GATILHO_PEDIDO = /\bsrc[ \t]*=|\bhref[ \t]*=|\burl\(|<img\b|<script\b|<link\b|\bfetch\(|\bimport\(|\bnew[ \t]+Image\b|setAttribute\([ \t]*['"]src/i;
const RE_ATRIBUTO_DATA = /data-[\w-]+[ \t]*=[ \t]*\\?$/i;

/** Linha (1, 2, 3...) de cada posição do texto, por busca binária nas quebras de linha. */
function indiceDeLinhas(texto) {
  const quebras = [];
  let p = texto.indexOf('\n');
  while (p !== -1) { quebras.push(p); p = texto.indexOf('\n', p + 1); }
  return function linhaDe(pos) {
    let a = 0, b = quebras.length;
    while (a < b) {
      const meio = (a + b) >> 1;
      if (quebras[meio] < pos) a = meio + 1; else b = meio;
    }
    return a + 1;
  };
}

/** Intervalos [inicio, fim) dos corpos de <script> inline numa página. */
function corposDeScript(texto) {
  const faixas = [];
  const re = /<script\b[^<>]{0,2000}>/gi;
  const reFim = /<\/script/gi;
  let m;
  while ((m = re.exec(texto)) !== null) {
    const ini = m.index + m[0].length;
    reFim.lastIndex = ini;
    const f = reFim.exec(texto);
    const fim = f ? f.index : texto.length;
    faixas.push([ini, fim]);
    re.lastIndex = Math.max(re.lastIndex, fim);
  }
  return faixas;
}

/** Nome do último atributo (ou campo) com «=» antes do fim do texto; vazio se não há. */
function ultimoAtributo(texto) {
  const re = /([\w-]+)[ \t]*=(?!=)/g;
  let nome = '';
  let m;
  while ((m = re.exec(texto)) !== null) nome = m[1].toLowerCase();
  return nome;
}

/** O valor tem cara de valor montado no código (não é um nome de arquivo)? */
function ehMontado(v) {
  return /\$\{|\{\{|['"`]\s*\+|\+\s*['"`]|^['"`]|['"`]$/.test(v) || /[<>]/.test(v);
}

function temFormaDeCaminho(p) {
  return p.indexOf('/') !== -1 || /\.[A-Za-z0-9]{1,6}$/.test(p);
}

/**
 * Extrai os pedidos de um arquivo. Devolve { pedidos: [{ bruto, pos, via }], montados: [{ trecho, pos }], bases: [pos] }.
 * `tipo` é 'html', 'css' ou 'js'.
 */
function extrairPedidos(texto, tipo) {
  const pedidos = [];
  const montados = [];
  const bases = [];
  const dentroDeScript = tipo === 'html' ? corposDeScript(texto) : null;
  function emScript(pos) {
    if (tipo === 'js') return true;
    if (tipo === 'css') return false;
    let a = 0, b = dentroDeScript.length;            // busca binária: as faixas estão em ordem
    while (a < b) {
      const meio = (a + b) >> 1;
      if (dentroDeScript[meio][1] <= pos) a = meio + 1; else b = meio;
    }
    return a < dentroDeScript.length && pos >= dentroDeScript[a][0];
  }
  function juntar(re, aoAchar) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(texto)) !== null) {
      if (m[0].length === 0) { re.lastIndex++; continue; }
      aoAchar(m);
    }
  }

  // url() e @import valem em CSS, em HTML (style="...") e em texto de código.
  juntar(RE_URL_CSS, function (m) {
    let v = m[1] !== undefined ? m[1] : (m[2] !== undefined ? m[2] : m[3]);
    if (m[3] === undefined) v = v.replace(/\\+$/, '');      // a aspa de fechar escapada (\') não faz parte do nome
    pedidos.push({ bruto: v, pos: m.index, via: 'url()' });
  });
  juntar(RE_IMPORT_CSS, function (m) {
    pedidos.push({ bruto: m[1] !== undefined ? m[1] : m[2], pos: m.index, via: '@import' });
  });
  if (tipo === 'css') return { pedidos: pedidos, montados: montados, bases: bases };

  juntar(RE_ATRIBUTO, function (m) {
    let v = m[2] !== undefined ? m[2] : m[3];
    v = v.replace(/\\+$/, '');
    const nome = m[1].toLowerCase();
    const pos = m.index;
    if (nome === 'srcset') {
      v.split(',').forEach(function (parte) {
        const url = parte.trim().split(/\s+/)[0];
        if (url) pedidos.push({ bruto: url, pos: pos, via: 'srcset' });
      });
      return;
    }
    // Em texto de código, um «data = 'abc'» qualquer não é pedido: exige cara de caminho.
    if (emScript(pos) && !temFormaDeCaminho(v.replace(/[?#].*$/, ''))) return;
    pedidos.push({ bruto: v, pos: pos, via: nome });
  });

  if (tipo === 'html') {
    // <base> muda de onde TODO caminho relativo é lido; a prova não sabe seguir isso, então recusa.
    juntar(/<base\b[^<>]{0,500}>/gi, function (m) { if (!emScript(m.index)) bases.push(m.index); });
  }

  juntar(RE_TEXTO_CAMINHO, function (m) {
    const antes = texto.slice(Math.max(0, m.index - 80), m.index);
    if (RE_ATRIBUTO_DATA.test(antes)) return;     // data-sol57="core-sol57.js" é rótulo, não pedido
    pedidos.push({ bruto: m[2], pos: m.index, via: 'texto' });
  });

  function nomeMontado(m) {
    const ini = Math.max(0, m.index - 200);
    let janela = texto.slice(ini, m.index);
    const nl = janela.lastIndexOf('\n');
    if (nl !== -1) janela = janela.slice(nl + 1);
    const g = RE_GATILHO_PEDIDO.exec(janela);
    if (!g) return;                                // nome de download, não pedido ao site
    if (ultimoAtributo(janela) === 'download') return;   // '<a href="'+u+'" download="foto-'+id+'.png">': o nome é do download
    montados.push({ trecho: (janela.slice(g.index) + m[0]).trim(), pos: m.index });
  }
  juntar(RE_MONTADO_SUFIXO, nomeMontado);
  juntar(RE_MONTADO_MODELO, nomeMontado);
  return { pedidos: pedidos, montados: montados, bases: bases };
}

/**
 * Resolve um valor bruto. Devolve { ignorar: true } ou { erro } ou { alvo, exibir }.
 * `base` é a pasta de onde o pedido é resolvido ('' = raiz do site).
 */
function resolverPedido(bruto, base) {
  let v = String(bruto).trim();
  if (v === '' || ehMontado(v) || /[\r\n]/.test(v)) return { ignorar: true };
  if (/^[A-Za-z][A-Za-z0-9+.\-]*:/.test(v)) return { ignorar: true };     // http:, https:, data:, blob:, tel:, mailto:, javascript:...
  if (v.indexOf('//') === 0) return { ignorar: true };
  if (v.charAt(0) === '#') return { ignorar: true };
  v = v.replace(/#.*$/, '').replace(/\?.*$/, '');
  if (v === '') return { ignorar: true };
  try { v = decodeURIComponent(v); } catch (e) { /* porcentagem inválida: compara como veio */ }
  v = v.replace(/\\/g, '/');
  if (v.charAt(0) === '/') return { erro: 'barra', exibir: v };
  const junto = path.posix.normalize(base ? base + '/' + v : v);
  if (junto === '..' || junto.indexOf('../') === 0) return { erro: 'fora', exibir: v };
  const ehPasta = /\/$/.test(v) || junto === '.' || v === '.' || /\/\.$/.test(v);
  const alvo = junto === '.' ? '' : junto.replace(/\/$/, '');
  return { alvo: alvo, ehPasta: ehPasta, exibir: ehPasta ? (alvo ? alvo + '/' : './') : alvo };
}

function tipoDe(arq) {
  const e = path.posix.extname(arq).toLowerCase();
  if (e === '.html' || e === '.htm') return 'html';
  if (e === '.css') return 'css';
  if (e === '.js' || e === '.mjs') return 'js';
  return null;
}

/**
 * A prova: nenhuma tela pede arquivo fora da lista; todo arquivo da lista (menos as entradas) é
 * pedido por alguma tela. Devolve { problemas, pedidos: Map(arquivo -> [{pagina, linha, bruto}]) }.
 */
function provar(itens, raiz, lerTexto) {
  const problemas = [];
  const pedidos = new Map();
  const permitidos = new Set(itens.filter(function (i) { return i.tipo !== 'nao-e-arquivo'; }).map(function (i) { return i.caminho; }));
  const naoEArquivo = new Set(itens.filter(function (i) { return i.tipo === 'nao-e-arquivo'; }).map(function (i) { return i.caminho; }));
  const leitor = lerTexto || function (c) { return fs.readFileSync(path.join(raiz, c), 'utf8'); };

  const fila = [];
  const seguidos = new Set();
  function seguir(arq, base) {
    const chave = arq + '|' + base;
    if (seguidos.has(chave)) return;
    seguidos.add(chave);
    fila.push({ arq: arq, base: base });
  }
  itens.filter(function (i) { return i.tipo === 'entrada'; }).forEach(function (i) {
    seguir(i.caminho, path.posix.dirname(i.caminho) === '.' ? '' : path.posix.dirname(i.caminho));
  });

  const vistosProblema = new Set();
  function problema(texto) {
    if (vistosProblema.has(texto)) return;
    vistosProblema.add(texto);
    problemas.push(texto);
  }

  while (fila.length) {
    const atual = fila.shift();
    const tipo = tipoDe(atual.arq);
    if (!tipo) continue;
    const texto = leitor(atual.arq);
    const linhaDe = indiceDeLinhas(texto);
    const achados = extrairPedidos(texto, tipo);

    achados.pedidos.forEach(function (p) {
      const linha = linhaDe(p.pos);
      const r = resolverPedido(p.bruto, atual.base);
      if (r.ignorar) return;
      if (r.erro === 'barra') {
        problema(atual.arq + ':' + linha + ': o caminho "' + r.exibir + '" começa com "/". No endereço do site isso aponta para a raiz da conta, e não do app. Use caminho relativo.');
        return;
      }
      if (r.erro === 'fora') {
        problema(atual.arq + ':' + linha + ': o caminho "' + r.exibir + '" sai da pasta do site. Use caminho relativo que fique dentro do app.');
        return;
      }
      let alvo = r.alvo;
      if (r.ehPasta) alvo = (alvo ? alvo + '/' : '') + 'index.html';
      let achouNaLista = permitidos.has(alvo);
      if (!achouNaLista && !r.ehPasta && permitidos.has(alvo + '/index.html') && !/\.[A-Za-z0-9]{1,6}$/.test(alvo)) {
        alvo = alvo + '/index.html';
        achouNaLista = true;
      }
      if (achouNaLista) {
        if (!pedidos.has(alvo)) pedidos.set(alvo, []);
        const quem = pedidos.get(alvo);
        if (!quem.some(function (q) { return q.pagina === atual.arq && q.linha === linha; })) {
          quem.push({ pagina: atual.arq, linha: linha, bruto: String(p.bruto).trim() });
        }
        const t = tipoDe(alvo);
        if (t === 'html' || t === 'css') seguir(alvo, path.posix.dirname(alvo) === '.' ? '' : path.posix.dirname(alvo));
        else if (t === 'js') seguir(alvo, atual.base);     // .js é resolvido a partir da página que o carrega
        return;
      }
      if (naoEArquivo.has(r.alvo) || naoEArquivo.has(alvo)) return;
      problema(atual.arq + ':' + linha + ': a tela pede "' + r.exibir + '", que NÃO está na lista. Se a tela precisa desse arquivo, acrescente a linha em .github/site-permitidos.txt; se não, tire o pedido da tela.');
    });

    achados.bases.forEach(function (pos) {
      problema(atual.arq + ':' + linhaDe(pos) + ': a página tem <base>, que muda de onde os caminhos são lidos, e a prova não sabe seguir isso. Tire o <base>.');
    });

    achados.montados.forEach(function (mo) {
      problema(atual.arq + ':' + linhaDe(mo.pos) + ': a tela monta o nome do arquivo no código ("' + cortar(mo.trecho.replace(/\s+/g, ' '), 90) + '"). Escreva o nome inteiro, para a prova enxergar.');
    });
  }

  // Lista mínima: tudo o que está na lista (menos as entradas) precisa ser pedido por alguma tela.
  itens.forEach(function (i) {
    if (i.tipo !== 'comum') return;
    if (!pedidos.has(i.caminho)) {
      problema(i.caminho + ': está na lista, mas nenhuma tela pede. Tire a linha (arquivo que nenhuma tela usa não é publicado) ou marque como "entrada" se alguém abre esse endereço.');
    }
  });
  return { problemas: problemas, pedidos: pedidos };
}

// ====================================================================== SAÍDA
// O montador APAGA a pasta de saída antes de montar. Por isso só apaga o que ele mesmo montou:
//   - a pasta tem de ficar DENTRO do repositório, sem nome oculto (nada de .git) e sem arquivo versionado;
//   - se já existe, tem de ter sido criada por este montador: ele a marca no fim de uma montagem aprovada,
//     numa lista guardada DENTRO do .git (nunca vai para o commit nem para o site), e a tira dessa lista ao apagar;
//   - pasta com um .git dentro nunca é apagada, nem marcada.
const ARQUIVO_DAS_MARCAS = 'montar-site-saidas.txt';

function caminhoDasMarcas(raiz) {
  let dir;
  try {
    dir = execFileSync('git', ['-C', raiz, 'rev-parse', '--git-dir'], { stdio: ['ignore', 'pipe', 'pipe'] }).toString('utf8').trim();
  } catch (e) {
    throw new Error('não consegui achar a pasta .git de ' + raiz + ' (' + e.message.split('\n')[0] + ')');
  }
  return path.join(path.resolve(raiz, dir), ARQUIVO_DAS_MARCAS);
}

function lerMarcas(raiz) {
  const arq = caminhoDasMarcas(raiz);
  let texto = '';
  try { texto = fs.readFileSync(arq, 'utf8'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  return new Set(texto.split('\n').filter(Boolean));
}

function gravarMarcas(raiz, marcas) {
  const lista = Array.from(marcas).sort();
  fs.writeFileSync(caminhoDasMarcas(raiz), lista.join('\n') + (lista.length ? '\n' : ''));
}

function marcarSaida(raiz, rel) { const m = lerMarcas(raiz); m.add(rel); gravarMarcas(raiz, m); }
function desmarcarSaida(raiz, rel) { const m = lerMarcas(raiz); if (m.delete(rel)) gravarMarcas(raiz, m); }

function existeNoDisco(caminho) {
  try { fs.lstatSync(caminho); return true; } catch (e) { return false; }
}

/** Confere a pasta de saída antes de apagar. Devolve o caminho dela a partir da raiz (com «/»). */
function segurancaDaSaida(saidaAbs, raiz, indice) {
  const rel = path.relative(raiz, saidaAbs);
  const fora = rel === '..' || rel.indexOf('..' + path.sep) === 0 || path.isAbsolute(rel);
  if (saidaAbs === path.parse(saidaAbs).root) throw new ErroDeUso('a pasta de saída não pode ser a raiz do disco');
  if (rel === '') throw new ErroDeUso('a pasta de saída não pode ser a raiz do repositório');
  if (fora) {
    throw new ErroDeUso('a pasta de saída "' + saidaAbs + '" fica fora do repositório; escolha uma pasta dentro dele (por exemplo _site)');
  }
  const relPosix = rel.split(path.sep).join('/');
  if (relPosix.split('/').some(function (p) { return p.charAt(0) === '.'; })) {
    throw new ErroDeUso('a pasta de saída "' + relPosix + '" é oculta ou fica dentro de uma pasta oculta (como o .git); escolha outra (por exemplo _site)');
  }
  // dentro do repositório: não pode ter arquivo versionado embaixo (seria apagado)
  if (indice.has(relPosix) || temArquivoSob(indice, relPosix)) {
    // se a pasta recusada já é o _site, não adianta mandar escolher o _site de novo
    throw new ErroDeUso('a pasta de saída "' + relPosix + '" tem arquivo versionado; ' + (relPosix === '_site'
      ? 'tire o _site do git (git rm -r --cached _site) e rode de novo'
      : 'escolha outra (por exemplo _site)'));
  }
  if (!existeNoDisco(saidaAbs)) return relPosix;
  if (existeNoDisco(path.join(saidaAbs, '.git'))) {
    throw new ErroDeUso('a pasta de saída "' + relPosix + '" tem um .git dentro; ela não é saída do montador e não será apagada');
  }
  if (!lerMarcas(raiz).has(relPosix)) {
    // se a pasta recusada já é o _site, não adianta mandar escolher o _site de novo: manda apagar e rodar outra vez
    throw new ErroDeUso('a pasta de saída "' + relPosix + '" já existe e não foi criada por este montador, então ele não a apaga; ' + (relPosix === '_site'
      ? 'apague a pasta _site você mesmo (se não houver nada a perder nela) e rode de novo'
      : 'apague-a você mesmo se não houver nada a perder nela, ou escolha outra (por exemplo _site)'));
  }
  return relPosix;
}

function listarSaida(dir) {
  const arquivos = [];
  const problemas = [];
  (function andar(d, prefixo) {
    fs.readdirSync(d, { withFileTypes: true }).forEach(function (e) {
      const rel = prefixo ? prefixo + '/' + e.name : e.name;
      if (e.isSymbolicLink()) { problemas.push(rel + ': link simbólico na saída'); return; }
      if (e.isDirectory()) { andar(path.join(d, e.name), rel); return; }
      if (!e.isFile()) { problemas.push(rel + ': não é arquivo comum na saída'); return; }
      arquivos.push(rel);
    });
  })(dir, '');
  return { arquivos: arquivos, problemas: problemas };
}

function copiarEConferir(publicados, raiz, saidaAbs) {
  publicados.forEach(function (c) {
    const destino = path.join(saidaAbs, c);
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.copyFileSync(path.join(raiz, c), destino);
  });
  // Conferência final: a saída é exatamente a lista; nada da regra fixa, nada oculto, nenhum link.
  const problemas = [];
  const ls = listarSaida(saidaAbs);
  problemas.push.apply(problemas, ls.problemas);
  const esperado = new Set(publicados);
  const real = new Set(ls.arquivos);
  ls.arquivos.forEach(function (a) {
    if (!esperado.has(a)) problemas.push(a + ': está na saída e não está na lista.');
    const regra = regraFixa(a);
    if (regra) problemas.push(a + ': este caminho nunca vai para o site (' + regra + ').');
  });
  publicados.forEach(function (c) { if (!real.has(c)) problemas.push(c + ': está na lista e não chegou à saída.'); });
  let bytes = 0;
  ls.arquivos.forEach(function (a) { bytes += fs.statSync(path.join(saidaAbs, a)).size; });
  return { problemas: problemas, bytes: bytes, total: ls.arquivos.length };
}

function formatarNumero(n) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// ====================================================================== PRINCIPAL
function lerArgumentos(argv) {
  const a = { lista: '.github/site-permitidos.txt', saida: '_site' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--lista') a.lista = argv[++i];
    else if (argv[i] === '--saida') a.saida = argv[++i];
    else throw new ErroDeUso('argumento desconhecido: ' + argv[i] + '. Uso: node tools/montar-site.js --lista .github/site-permitidos.txt --saida _site');
  }
  if (!a.lista || !a.saida) throw new ErroDeUso('faltou o valor de --lista ou de --saida');
  return a;
}

function bloquear(problemas) {
  problemas.forEach(function (p) { console.error(p); });
  console.error('BLOQUEADO: ' + problemas.length + (problemas.length === 1 ? ' problema' : ' problemas') + '. Nada foi publicado; o site no ar continua o anterior.');
  return 1;
}

function principal(argv) {
  const args = lerArgumentos(argv);
  const listaAbs = path.resolve(args.lista);
  const saidaAbs = path.resolve(args.saida);
  const nomeLista = path.relative(process.cwd(), listaAbs).split(path.sep).join('/') || args.lista;

  let texto;
  try { texto = fs.readFileSync(listaAbs, 'utf8'); } catch (e) {
    return bloquear([nomeLista + ': não consegui ler a lista (' + e.code + ').']);
  }
  const indice = lerIndice(RAIZ);
  const saidaNoRepo = segurancaDaSaida(saidaAbs, RAIZ, indice);
  fs.rmSync(saidaAbs, { recursive: true, force: true });     // sempre começa limpo; nunca sobra saída velha
  desmarcarSaida(RAIZ, saidaNoRepo);

  const lida = lerLista(texto, nomeLista);
  let problemas = lida.erros.slice();
  if (problemas.length) return bloquear(problemas);

  problemas = conferirContraRepositorio(lida.itens, indice, RAIZ);
  if (problemas.length) return bloquear(problemas);

  const publicados = lida.itens.filter(function (i) { return i.tipo !== 'nao-e-arquivo'; }).map(function (i) { return i.caminho; });
  const entradas = lida.itens.filter(function (i) { return i.tipo === 'entrada'; });
  if (!entradas.length) return bloquear([nomeLista + ': a lista não tem nenhuma linha "entrada".']);

  const prova = provar(lida.itens, RAIZ);
  if (process.env.MOSTRAR_PEDIDOS === '1') {
    console.log('--- quem pede cada arquivo (MOSTRAR_PEDIDOS=1) ---');
    Array.from(prova.pedidos.keys()).sort().forEach(function (arq) {
      const quem = prova.pedidos.get(arq);
      console.log(arq + '  <-  ' + quem.slice(0, 3).map(function (q) { return q.pagina + ':' + q.linha; }).join(', ') + (quem.length > 3 ? ' (+' + (quem.length - 3) + ')' : ''));
    });
    console.log('---');
  }
  if (prova.problemas.length) return bloquear(prova.problemas);

  const feito = copiarEConferir(publicados, RAIZ, saidaAbs);
  if (feito.problemas.length) {
    fs.rmSync(saidaAbs, { recursive: true, force: true });
    return bloquear(feito.problemas);
  }
  marcarSaida(RAIZ, saidaNoRepo);                              // da próxima vez, o montador sabe que a pasta é dele
  console.log('APROVADO: ' + feito.total + ' arquivos, ' + formatarNumero(feito.bytes) + ' bytes; ' + prova.pedidos.size + ' arquivos pedidos pelas telas, todos na lista.');
  const relSaida = path.relative(process.cwd(), saidaAbs);
  const mostraSaida = relSaida.indexOf('..') === 0 || path.isAbsolute(relSaida) ? saidaAbs : relSaida;
  console.log('(' + entradas.length + ' entradas + ' + (feito.total - entradas.length) + ' arquivos = ' + feito.total + ' publicados em ' + mostraSaida.split(path.sep).join('/') + '/)');
  return 0;
}

if (require.main === module) {
  let codigo;
  try { codigo = principal(process.argv.slice(2)); } catch (e) {
    console.error('BLOQUEADO: ' + (e instanceof ErroDeUso ? '' : 'erro inesperado: ') + e.message + '. Nada foi publicado; o site no ar continua o anterior.');
    codigo = 1;
  }
  process.exitCode = codigo;
}

module.exports = { regraFixa, lerLista, lerIndice, conferirContraRepositorio, extrairPedidos, resolverPedido, provar, copiarEConferir, principal };
