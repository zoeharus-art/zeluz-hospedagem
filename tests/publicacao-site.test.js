'use strict';
/*
 * TESTE DA PUBLICAÇÃO SÓ DAS TELAS — Story 6.114 (21/out/2026).
 *
 * Prova que o montador (tools/montar-site.js), a lista (.github/site-permitidos.txt) e o fluxo
 * (.github/workflows/publicar-site.yml) fazem o que prometem:
 *   - 23 MUTAÇÕES: cada uma estraga uma cópia da árvore de um jeito e o montador TEM de bloquear
 *     (código 1, com a frase que nomeia o arquivo e, quando há, a linha). M14 é a exceção: a lista
 *     com CRLF e BOM TEM de ser aceita.
 *   - 6 CONTROLES: o que tem de passar (a base, `?v=`, porcentagem, arquivo novo com linha,
 *     os falsos positivos que enganaram o primeiro rascunho, lista com CRLF e BOM).
 *   - EXTRAS: lista hostil, regra fixa por classe, índice do git, link simbólico e submódulo,
 *     tempo da prova, a conferência em shell do fluxo (a MESMA que o GitHub roda, extraída do
 *     YAML) com intrusos, a forma do fluxo (permissões, ações fixadas, publicar só no master, nenhuma
 *     publicação cancelada em andamento) e a pasta de saída (o montador só apaga o que ele mesmo montou).
 *
 * NÃO toca na rede, em produção nem em tests/harness.js. Trabalha em CÓPIA TEMPORÁRIA mínima da
 * árvore (as 4 entradas, os arquivos da lista e os intrusos de cada mutação, com `git init`);
 * nunca altera a árvore de trabalho. Dados de teste são inventados.
 *
 * Uso:            node tests/publicacao-site.test.js
 * Variáveis (todas opcionais):
 *   PUBLICACAO_ESPERADO=40,11262568,39   confere arquivos, bytes e pedidos da base (só vale no
 *                                         master 7fff9f0; depois a tela muda e os números mudam)
 *   PUBLICACAO_MONTADOR=caminho           roda outro montador (prova dos defeitos plantados)
 *   PUBLICACAO_FLUXO=caminho              usa outro fluxo (idem)
 *   PUBLICACAO_SO=M4,C1                   roda só estes
 * Precisa de `git` e `bash`. M10 e M10b precisam de permissão para criar link simbólico.
 * Na falha, o teste escreve a LINHA QUE FALTA ou SOBRA na lista, para corrigir antes de empurrar.
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const MONTADOR = process.env.PUBLICACAO_MONTADOR ? path.resolve(process.env.PUBLICACAO_MONTADOR) : path.join(RAIZ, 'tools', 'montar-site.js');
const FLUXO = process.env.PUBLICACAO_FLUXO ? path.resolve(process.env.PUBLICACAO_FLUXO) : path.join(RAIZ, '.github', 'workflows', 'publicar-site.yml');
const LISTA = path.join(RAIZ, '.github', 'site-permitidos.txt');
const SO = process.env.PUBLICACAO_SO ? process.env.PUBLICACAO_SO.split(',') : null;

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'publicacao-site-'));
function limpar() { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* já foi */ } }
process.on('exit', limpar);
process.on('SIGINT', function () { limpar(); process.exit(130); });

// ============================================================ utilidades
function copiar(origem, destino) {
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.copyFileSync(origem, destino);
}

function git(dir, args) {
  const r = spawnSync('git', ['-C', dir, '-c', 'core.autocrlf=false', '-c', 'core.safecrlf=false'].concat(args), { encoding: 'utf8' });
  if (r.status !== 0) throw new Error('git ' + args.join(' ') + ': ' + (r.stderr || r.stdout));
  return r.stdout;
}

/** Leitura independente da lista (não usa o montador, que pode estar com defeito). */
function itensDaLista(texto) {
  const itens = [];
  texto.replace(/^\uFEFF/, '').split('\n').forEach(function (l) {
    l = l.replace(/\r$/, '').replace(/\s+#.*$/, '').trim();
    if (!l || l.charAt(0) === '#') return;
    const m = /^(entrada|nao-e-arquivo)\s+(.+)$/.exec(l);
    itens.push({ tipo: m ? m[1] : 'comum', caminho: m ? m[2] : l });
  });
  return itens;
}

let BASE = null;
function criarBase() {
  BASE = path.join(TMP, 'base');
  const itens = itensDaLista(fs.readFileSync(LISTA, 'utf8'));
  itens.filter(function (i) { return i.tipo !== 'nao-e-arquivo'; }).forEach(function (i) {
    const origem = path.join(RAIZ, i.caminho);
    if (!fs.existsSync(origem)) throw new Error('a lista tem "' + i.caminho + '", que não existe na árvore de trabalho');
    copiar(origem, path.join(BASE, i.caminho));
  });
  copiar(MONTADOR, path.join(BASE, 'tools', 'montar-site.js'));
  // O montador tira os comentários na cópia (tools/tirar-comentarios.js + o acorn em tools/vendor).
  copiar(path.join(path.dirname(MONTADOR), 'tirar-comentarios.js'), path.join(BASE, 'tools', 'tirar-comentarios.js'));
  fs.cpSync(path.join(path.dirname(MONTADOR), 'vendor'), path.join(BASE, 'tools', 'vendor'), { recursive: true });
  copiar(LISTA, path.join(BASE, '.github', 'site-permitidos.txt'));
  git(BASE, ['init', '-q']);
  git(BASE, ['add', '-A']);
}

let contador = 0;
let ultimaSaida = '';

/** Uma cópia temporária da árvore, com ferramentas para estragá-la. */
function cenario() {
  const dir = path.join(TMP, 'c' + (++contador));
  fs.cpSync(BASE, dir, { recursive: true });
  const c = {
    dir: dir,
    p: function (rel) { return path.join(dir, rel); },
    ler: function (rel) { return fs.readFileSync(path.join(dir, rel), 'utf8'); },
    escrever: function (rel, conteudo) { fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true }); fs.writeFileSync(path.join(dir, rel), conteudo); },
    indexar: function () { git(dir, ['add', '-A']); },
    lista: function () { return c.ler('.github/site-permitidos.txt'); },
    escreverLista: function (t) { c.escrever('.github/site-permitidos.txt', t); },
    listaMais: function (linha) { c.escreverLista(c.lista().replace(/\n*$/, '\n') + linha + '\n'); },
    listaSem: function (linhaExata) {
      const antes = c.lista();
      const depois = antes.split('\n').filter(function (l) { return l.replace(/\r$/, '') !== linhaExata; }).join('\n');
      assert.notStrictEqual(depois, antes, 'a linha "' + linhaExata + '" não está na lista do teste');
      c.escreverLista(depois);
    },
    listaTroca: function (de, para) {
      const antes = c.lista();
      assert.ok(antes.split('\n').indexOf(de) !== -1, 'a linha "' + de + '" não está na lista do teste');
      c.escreverLista(antes.split('\n').map(function (l) { return l === de ? para : l; }).join('\n'));
    },
    linhaDe: function (rel, trecho) {
      const t = c.ler(rel);
      const i = t.indexOf(trecho);
      assert.ok(i !== -1, 'não achei "' + trecho + '" em ' + rel);
      return t.slice(0, i).split('\n').length;
    },
    /** Insere `texto` numa linha própria antes da âncora; devolve a linha (1, 2, 3...) do começo do texto. */
    inserirAntes: function (rel, ancora, texto, ultima) {
      const t = c.ler(rel);
      const i = ultima ? t.lastIndexOf(ancora) : t.indexOf(ancora);
      assert.ok(i !== -1, 'não achei a âncora "' + ancora + '" em ' + rel);
      c.escrever(rel, t.slice(0, i) + '\n' + texto + '\n' + t.slice(i));
      return t.slice(0, i).split('\n').length + 1;
    },
    rodar: function (extraEnv, args) {
      const ini = Date.now();
      const r = spawnSync(process.execPath, [path.join(dir, 'tools', 'montar-site.js')].concat(args || ['--lista', '.github/site-permitidos.txt', '--saida', '_site']), {
        cwd: dir, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
        env: Object.assign({}, process.env, { MOSTRAR_PEDIDOS: '' }, extraEnv || {})
      });
      const saida = (r.stdout || '') + (r.stderr || '');
      ultimaSaida = saida;
      return { status: r.status, saida: saida, ms: Date.now() - ini };
    },
    rodarComSaida: function (saida) { return c.rodar(null, ['--lista', '.github/site-permitidos.txt', '--saida', saida]); },
    existeSite: function () { return fs.existsSync(path.join(dir, '_site')); },
    arquivosDoSite: function () { return listarArquivos(path.join(dir, '_site')); }
  };
  return c;
}

function listarArquivos(dir) {
  const achados = [];
  (function andar(d, pre) {
    fs.readdirSync(d, { withFileTypes: true }).forEach(function (e) {
      const rel = pre ? pre + '/' + e.name : e.name;
      if (e.isDirectory()) andar(path.join(d, e.name), rel); else achados.push(rel);
    });
  })(dir, '');
  return achados.sort();
}

function resumo(saida) {
  const linhas = saida.split('\n').filter(Boolean);
  return linhas.slice(0, 12).join('\n') + (linhas.length > 12 ? '\n... (+' + (linhas.length - 12) + ' linhas)' : '');
}

function exigirBloqueio(c, r, frases) {
  assert.strictEqual(r.status, 1, 'tinha de BLOQUEAR (código 1) e saiu com ' + r.status + '.\n' + resumo(r.saida));
  assert.ok(r.saida.indexOf('BLOQUEADO:') !== -1, 'faltou a frase final «BLOQUEADO: ...».\n' + resumo(r.saida));
  frases.forEach(function (f) {
    assert.ok(r.saida.indexOf(f) !== -1, 'faltou a frase: ' + f + '\n--- saída do montador ---\n' + resumo(r.saida));
  });
  assert.ok(!c.existeSite(), 'o _site não pode existir quando o montador bloqueia (nada é publicado)');
}

/** Recusa da pasta de saída: código 1 e a frase; NÃO olha o _site (a pasta recusada continua como estava). */
function exigirRecusaDeSaida(r, frase) {
  assert.strictEqual(r.status, 1, 'tinha de RECUSAR a pasta de saída (código 1) e saiu com ' + r.status + '.\n' + resumo(r.saida));
  assert.ok(r.saida.indexOf('BLOQUEADO:') !== -1, 'faltou a frase final «BLOQUEADO: ...».\n' + resumo(r.saida));
  assert.ok(r.saida.indexOf(frase) !== -1, 'faltou a frase: ' + frase + '\n--- saída do montador ---\n' + resumo(r.saida));
}

function numerosDaSaida(saida) {
  const m = /APROVADO: (\d+) arquivos, ([\d.]+) bytes; (\d+) arquivos pedidos/.exec(saida);
  return m ? { arquivos: Number(m[1]), bytes: Number(m[2].replace(/\./g, '')), pedidos: Number(m[3]) } : null;
}

/** Aprovado: código 0, _site igual à lista (conferido AQUI, sem o montador), números batendo. */
function exigirAprovado(c, r) {
  assert.strictEqual(r.status, 0, 'tinha de APROVAR (código 0) e saiu com ' + r.status + '.\n' + resumo(r.saida));
  const n = numerosDaSaida(r.saida);
  assert.ok(n, 'faltou a frase «APROVADO: n arquivos, b bytes; m arquivos pedidos...».\n' + resumo(r.saida));
  const publicados = itensDaLista(c.lista()).filter(function (i) { return i.tipo !== 'nao-e-arquivo'; }).map(function (i) { return i.caminho; }).sort();
  assert.deepStrictEqual(c.arquivosDoSite(), publicados, '_site tem de ser exatamente a lista');
  let bytes = 0;
  publicados.forEach(function (a) { bytes += fs.statSync(c.p('_site/' + a)).size; });
  assert.strictEqual(n.arquivos, publicados.length, 'a contagem impressa não bate com a lista');
  assert.strictEqual(n.bytes, bytes, 'os bytes impressos não batem com os arquivos de _site');
  return n;
}

// ============================================================ registro dos testes
const testes = [];
function teste(grupo, id, titulo, fn) { testes.push({ grupo: grupo, id: id, titulo: titulo, fn: fn }); }
const mutacao = function (id, titulo, fn) { teste('mutação', id, titulo, fn); };
const controle = function (id, titulo, fn) { teste('controle', id, titulo, fn); };
const extra = function (id, titulo, fn) { teste('extra', id, titulo, fn); };

const PAG = 'auaulandia/index.html';

// ============================================================ CONTROLES (tudo o que TEM de passar)
controle('C1', 'a base aprova (a lista inteira, a prova e a cópia)', function () {
  const c = cenario();
  const r = c.rodar();
  const n = exigirAprovado(c, r);
  assert.ok(r.ms < 30000, 'a prova levou ' + r.ms + ' ms; o limite é 30 s (AC3.6)');
  const pedidosDaLista = itensDaLista(c.lista()).filter(function (i) { return i.tipo === 'comum'; }).length;
  assert.ok(n.pedidos >= pedidosDaLista, 'toda linha comum precisa ser pedida por uma tela');
  if (process.env.PUBLICACAO_ESPERADO) {
    const esp = process.env.PUBLICACAO_ESPERADO.split(',').map(Number);
    assert.deepStrictEqual([n.arquivos, n.bytes, n.pedidos], esp, 'números da base fora do esperado (arquivos, bytes, pedidos)');
  }
});

controle('C2', '«?v=» e «#» são aceitos (a página pede scripts com ?v=)', function () {
  const c = cenario();
  c.inserirAntes(PAG, '</head>', '<link rel="stylesheet" href="historico-checkins.css?v=2099-01-01-99#topo"><script src="resposta-tutor.js?v=2099-01-01-99"></script>');
  c.indexar();
  exigirAprovado(c, c.rodar());
});

controle('C3', 'o mesmo arquivo pedido com porcentagem (Vasilha%20ra%C3%A7%C3%A3o.png) é aceito', function () {
  const c = cenario();
  c.inserirAntes('index.html', '</body>', '<img src="stickers/Vasilha%20ra%C3%A7%C3%A3o.png" alt="">', true);
  c.indexar();
  exigirAprovado(c, c.rodar());
});

controle('C4', 'arquivo novo de tela com a linha na lista e o pedido na página é aceito', function () {
  const c = cenario();
  c.escrever('auaulandia/modulo-novo.js', '// módulo de teste\n');
  c.inserirAntes(PAG, '</body>', '<script src="modulo-novo.js?v=1"></script>', true);
  c.listaMais('auaulandia/modulo-novo.js');
  c.indexar();
  const antes = cenario().rodar();
  const n = exigirAprovado(c, c.rodar());
  assert.strictEqual(n.arquivos, numerosDaSaida(antes.saida).arquivos + 1, 'tinha de sair um arquivo a mais');
});

controle('C5', 'os falsos positivos que enganaram o primeiro rascunho passam', function () {
  const c = cenario();
  c.inserirAntes(PAG, '</body>', [
    '<button data-action="abrir" data-sol57="core-sol57.js">x</button>',
    '<script>',
    'reader.readAsDataURL(arquivo);',
    'var u=URL.createObjectURL(blob);',
    "var d=canvas.toDataURL('image/png');",
    'var h=\'<button data-action="abrir" data-sol57="core-sol57.js">x</button>\';',
    "link.download=nome+'.pdf'; outro.download='relatorio-'+dia+'.jpg';",
    'var a1="<i style=\\"background:url(\'"+cad.foto+"\')\\"></i>";',
    'var a2=`<i style="background:url(\'${foto}\')"></i>`;',
    "var a3='<svg><rect fill=\"url(#kfG)\"/></svg>';",
    "var a4=new URL('https://exemplo.invalid/a.png'); var a5='data:image/png;base64,AAAA';",
    'var l1=meuurl(abc); var l2=obj.url(def); var l3=$url(ghi);',   // «url(» colado em nome de função ou de campo não é pedido
    "var e1='background:url(\\'assets/simbolo.png\\')'; var e2=\"background:url(\\\"assets/simbolo.png\\\")\";",   // aspa escapada, arquivo que ESTÁ na lista
    "var m1='<img src=\"assets/simbolo.png\">'; var m2=\"<img src='assets/simbolo.png'>\"; var m3='url(assets/simbolo.png)';",   // nome inteiro em texto de HTML e de CSS
    "var d1='<a href=\"#\" download=\"'+nome+'.pdf\">x</a>'; var d2='<a download=\"foto-'+dia+'.jpg\">x</a>';",   // download com nome montado, sem pedido ao site
    '</script>'
  ].join('\n'), true);
  c.indexar();
  exigirAprovado(c, c.rodar());
});

controle('C6', 'a lista com CRLF e BOM é aceita', function () {
  const c = cenario();
  c.escreverLista('\uFEFF' + c.lista().replace(/\n/g, '\r\n'));
  c.indexar();
  exigirAprovado(c, c.rodar());
});

// ============================================================ MUTAÇÕES (tudo o que TEM de bloquear)
mutacao('M1', 'tirar auaulandia/cafe51-core.js da lista', function () {
  const c = cenario();
  c.listaSem('auaulandia/cafe51-core.js');
  const linha = c.linhaDe(PAG, 'src="cafe51-core.js');
  exigirBloqueio(c, c.rodar(), [PAG + ':' + linha + ': a tela pede "auaulandia/cafe51-core.js", que NÃO está na lista']);
});

mutacao('M2', 'pôr docs/INDICE-MENU-APP.md na lista', function () {
  const c = cenario();
  c.escrever('docs/INDICE-MENU-APP.md', '# índice de teste\n');
  c.listaMais('docs/INDICE-MENU-APP.md');
  c.indexar();
  exigirBloqueio(c, c.rodar(), ['docs/INDICE-MENU-APP.md: este caminho nunca vai para o site']);
});

mutacao('M3', 'pôr stickers/Coleira.png, que nenhuma tela usa', function () {
  const c = cenario();
  c.escrever('stickers/Coleira.png', 'png de teste');
  c.listaMais('stickers/Coleira.png');
  c.indexar();
  exigirBloqueio(c, c.rodar(), ['stickers/Coleira.png: está na lista, mas nenhuma tela pede']);
});

mutacao('M4', 'a tela pedir <script src="../tests/harness.js">', function () {
  const c = cenario();
  c.escrever('tests/harness.js', '// harness de teste\n');
  const linha = c.inserirAntes(PAG, '</head>', '<script src="../tests/harness.js"></script>');
  c.indexar();
  exigirBloqueio(c, c.rodar(), [PAG + ':' + linha + ': a tela pede "tests/harness.js", que NÃO está na lista']);
});

mutacao('M5', 'a tela pedir /zeluz-hospedagem/logo.png (caminho com barra no começo)', function () {
  const c = cenario();
  const linha = c.inserirAntes(PAG, '</body>', '<img src="/zeluz-hospedagem/logo.png" alt="">', true);
  c.indexar();
  exigirBloqueio(c, c.rodar(), [PAG + ':' + linha + ': o caminho "/zeluz-hospedagem/logo.png" começa com "/"']);
});

mutacao('M6', 'tirar a linha «nao-e-arquivo» do foto-do-corpo.jpg', function () {
  const c = cenario();
  c.listaSem('nao-e-arquivo auaulandia/foto-do-corpo.jpg');
  const linha = c.linhaDe(PAG, "'foto-do-corpo.jpg'");
  exigirBloqueio(c, c.rodar(), [PAG + ':' + linha + ': a tela pede "auaulandia/foto-do-corpo.jpg", que NÃO está na lista']);
});

mutacao('M7', 'pôr servidor-senha/servidor.js, database.rules.v2.json e zelozinha/servidor.js', function () {
  const c = cenario();
  ['servidor-senha/servidor.js', 'database.rules.v2.json', 'zelozinha/servidor.js'].forEach(function (a) {
    c.escrever(a, '// intruso de teste\n');
    c.listaMais(a);
  });
  c.indexar();
  exigirBloqueio(c, c.rodar(), [
    'servidor-senha/servidor.js: este caminho nunca vai para o site',
    'database.rules.v2.json: este caminho nunca vai para o site',
    'zelozinha/servidor.js: este caminho nunca vai para o site'
  ]);
});

mutacao('M7c', 'curinga auaulandia/*.js na lista', function () {
  const c = cenario();
  c.listaMais('auaulandia/*.js');
  exigirBloqueio(c, c.rodar(), ['a lista só aceita arquivo exato, sem curinga e sem pasta']);
});

mutacao('M7e', 'arquivo que não existe na lista', function () {
  const c = cenario();
  c.listaMais('auaulandia/nao-existe.js');
  exigirBloqueio(c, c.rodar(), ['auaulandia/nao-existe.js: não é arquivo do repositório. Confira maiúsculas, minúsculas e acentos.']);
});

mutacao('M8', "img.src='assets/stickers/'+nome+'.png' (nome montado no código)", function () {
  const c = cenario();
  const linha = c.inserirAntes(PAG, '</body>', "<script>\nvar img=new Image(); img.src='assets/stickers/'+nome+'.png';\n</script>", true) + 1;
  c.indexar();
  exigirBloqueio(c, c.rodar(), [PAG + ':' + linha + ': a tela monta o nome do arquivo no código', 'Escreva o nome inteiro, para a prova enxergar.']);
});

mutacao('M8b', "HTML em texto: '<img src=\"assets/stickers/'+n+'.png\">' (a aspa depois da extensão não é a que abriu)", function () {
  [
    ['<img> sozinho', "var h='<img src=\"assets/stickers/'+n+'.png\">';"],
    ['<img> depois de um download=, na mesma linha (o download só isenta o que é download)', "var h='<a download=\"x.png\"><img src=\"assets/stickers/'+n+'.png\"></a>';"]
  ].forEach(function (par) {
    const c = cenario();
    const linha = c.inserirAntes(PAG, '</body>', '<script>\n' + par[1] + '\n</script>', true) + 1;
    c.indexar();
    try {
      exigirBloqueio(c, c.rodar(), [PAG + ':' + linha + ': a tela monta o nome do arquivo no código', 'Escreva o nome inteiro, para a prova enxergar.']);
    } catch (e) {
      e.message = par[0] + ': ' + e.message;
      throw e;
    }
  });
});

mutacao('M8c', "HTML em texto com as aspas trocadas: \"<img src='assets/stickers/\"+n+\".png'>\"", function () {
  const c = cenario();
  const linha = c.inserirAntes(PAG, '</body>', "<script>\nvar h=\"<img src='assets/stickers/\"+n+\".png'>\";\n</script>", true) + 1;
  c.indexar();
  exigirBloqueio(c, c.rodar(), [PAG + ':' + linha + ': a tela monta o nome do arquivo no código', 'Escreva o nome inteiro, para a prova enxergar.']);
});

mutacao('M8d', 'url() montado no código: sem aspas, com aspas dentro de aspas e com aspa escapada', function () {
  [
    ['url() sem aspas', "var h='url(assets/stickers/'+n+'.png)';"],
    ["url('...') dentro de aspas duplas", "var h=\"background:url('assets/stickers/\"+n+\".png')\";"],
    ['url("...") dentro de aspas simples', "var h='background:url(\"assets/stickers/'+n+'.png\")';"],
    ["url(\\'...\\') com aspa escapada", "var h='background:url(\\'assets/stickers/'+n+'.png\\')';"]
  ].forEach(function (par) {
    const c = cenario();
    const linha = c.inserirAntes(PAG, '</body>', '<script>\n' + par[1] + '\n</script>', true) + 1;
    c.indexar();
    try {
      exigirBloqueio(c, c.rodar(), [PAG + ':' + linha + ': a tela monta o nome do arquivo no código', 'Escreva o nome inteiro, para a prova enxergar.']);
    } catch (e) {
      e.message = par[0] + ': ' + e.message;
      throw e;
    }
  });
});

mutacao('M8e', 'url() com aspa escapada em texto de código, pedindo arquivo que não está na lista', function () {
  [
    ["url(\\'...\\')", "var h='<i style=\"background:url(\\'assets/fora-a.png\\')\"></i>';", 'auaulandia/assets/fora-a.png'],
    ['url(\\"...\\")', 'var h="background:url(\\"assets/fora-b.png\\")";', 'auaulandia/assets/fora-b.png']
  ].forEach(function (caso) {
    const c = cenario();
    const linha = c.inserirAntes(PAG, '</body>', '<script>\n' + caso[1] + '\n</script>', true) + 1;
    c.indexar();
    try {
      exigirBloqueio(c, c.rodar(), [PAG + ':' + linha + ': a tela pede "' + caso[2] + '", que NÃO está na lista']);
    } catch (e) {
      e.message = caso[0] + ': ' + e.message;
      throw e;
    }
  });
});

mutacao('M9', 'imagem, texto no código, módulo .js, .css e url() de CSS novos sem linha na lista', function () {
  const c = cenario();
  c.escrever('auaulandia/assets/novo-a.png', 'png');
  c.escrever('auaulandia/assets/novo-b.png', 'png');
  c.escrever('auaulandia/modulo-sem-linha.js', '// js\n');
  c.escrever('auaulandia/estilo-sem-linha.css', '/* css */\n');
  c.escrever('auaulandia/assets/fundo-sem-linha.png', 'png');
  c.inserirAntes(PAG, '</body>', '<img src="assets/novo-a.png" alt="">', true);
  c.inserirAntes(PAG, '</body>', "<script>var x='assets/novo-b.png';</script>", true);
  c.inserirAntes(PAG, '</body>', '<script src="modulo-sem-linha.js"></script>', true);
  c.inserirAntes(PAG, '</head>', '<link rel="stylesheet" href="estilo-sem-linha.css">');
  c.escrever('auaulandia/historico-checkins.css', c.ler('auaulandia/historico-checkins.css') + '\n.fundo-teste{background:url(assets/fundo-sem-linha.png)}\n');
  const lcss = c.linhaDe('auaulandia/historico-checkins.css', '.fundo-teste');
  c.indexar();
  exigirBloqueio(c, c.rodar(), [
    'a tela pede "auaulandia/assets/novo-a.png", que NÃO está na lista',
    'a tela pede "auaulandia/assets/novo-b.png", que NÃO está na lista',
    'a tela pede "auaulandia/modulo-sem-linha.js", que NÃO está na lista',
    'a tela pede "auaulandia/estilo-sem-linha.css", que NÃO está na lista',
    'auaulandia/historico-checkins.css:' + lcss + ': a tela pede "auaulandia/assets/fundo-sem-linha.png", que NÃO está na lista'
  ]);
});

mutacao('M9fg', 'link da raiz para docs/INDICE-MENU-APP.md e para docs/', function () {
  const c = cenario();
  c.escrever('docs/INDICE-MENU-APP.md', '# índice de teste\n');
  const l1 = c.inserirAntes('index.html', '</body>', '<a href="docs/INDICE-MENU-APP.md">índice</a>', true);
  const l2 = c.inserirAntes('index.html', '</body>', '<a href="docs/">docs</a>', true);
  c.indexar();
  exigirBloqueio(c, c.rodar(), [
    'index.html:' + l1 + ': a tela pede "docs/INDICE-MENU-APP.md", que NÃO está na lista',
    'index.html:' + l2 + ': a tela pede "docs/", que NÃO está na lista'
  ]);
});

mutacao('M10', 'link simbólico na lista (novo e no lugar de um arquivo da lista)', function () {
  const c = cenario();
  c.escrever('docs/alvo.js', '// alvo\n');
  fs.symlinkSync('../docs/alvo.js', c.p('auaulandia/atalho.js'));
  c.listaMais('auaulandia/atalho.js');
  c.indexar();
  exigirBloqueio(c, c.rodar(), ['auaulandia/atalho.js: não é arquivo comum (link simbólico ou submódulo). Só arquivo comum pode ser publicado.']);

  const d = cenario();
  d.escrever('docs/alvo.png', 'png');
  fs.unlinkSync(d.p('logo.png'));
  fs.symlinkSync('docs/alvo.png', d.p('logo.png'));
  d.indexar();
  exigirBloqueio(d, d.rodar(), ['logo.png: não é arquivo comum (link simbólico ou submódulo).']);
});

mutacao('M11', 'a tela pedir assets/painel44/auau.png (caixa errada)', function () {
  const c = cenario();
  const linha = c.inserirAntes(PAG, '</body>', '<img src="assets/painel44/auau.png" alt="">', true);
  c.indexar();
  exigirBloqueio(c, c.rodar(), [PAG + ':' + linha + ': a tela pede "auaulandia/assets/painel44/auau.png", que NÃO está na lista']);
});

mutacao('M12', 'a tela pedir o sticker com acento decomposto (NFD)', function () {
  const c = cenario();
  const nfd = 'stickers/Vasilha ração.png'.normalize('NFD');
  assert.notStrictEqual(nfd, 'stickers/Vasilha ração.png', 'o teste precisa de um nome decomposto de verdade');
  const linha = c.inserirAntes('index.html', '</body>', '<img src="' + nfd + '" alt="">', true);
  c.indexar();
  exigirBloqueio(c, c.rodar(), ['index.html:' + linha + ': a tela pede "' + nfd + '", que NÃO está na lista']);
});

mutacao('M13', 'o «?v=» não esconde o alvo: <script src="../tests/harness.js?v=2026-10-21-01">', function () {
  const c = cenario();
  c.escrever('tests/harness.js', '// harness de teste\n');
  const linha = c.inserirAntes(PAG, '</head>', '<script src="../tests/harness.js?v=2026-10-21-01"></script>');
  c.indexar();
  exigirBloqueio(c, c.rodar(), [PAG + ':' + linha + ': a tela pede "tests/harness.js", que NÃO está na lista']);
});

mutacao('M14', 'a lista com CRLF e BOM é aceita pelo montador E pela conferência em shell', function () {
  const c = cenario();
  c.escreverLista('\uFEFF' + c.lista().replace(/\n/g, '\r\n'));
  c.indexar();
  exigirAprovado(c, c.rodar());
  const sh = conferenciaEmShell(c.dir);
  assert.strictEqual(sh.status, 0, 'a conferência em shell tem de aceitar CRLF e BOM:\n' + resumo(sh.saida));
});

const LINHAS_HOSTIS = [
  ['./index.html', 'o caminho tem "."'],
  ['auaulandia//index.html', 'barras duplicadas no caminho'],
  ['auaulandia\\index.html', 'barra invertida no caminho'],
  ['auaulandia/in\u0000dex.html', 'caractere de controle no caminho'],
  ['x'.repeat(5000), 'linha longa demais'],
  ['entrada', 'o prefixo "entrada" precisa de um caminho'],
  ['nao-e-arquivo', 'o prefixo "nao-e-arquivo" precisa de um caminho'],
  ['saida index.html', 'saida index.html: não é arquivo do repositório'],
  ['entrada\tauaulandia/in\tdex.html', 'caractere de controle no caminho']
];
mutacao('M15', 'linhas hostis na lista (cada uma bloqueia; espaço sobrando só é aparado)', function () {
  LINHAS_HOSTIS.forEach(function (par) {
    const c = cenario();
    c.listaMais(par[0]);
    try {
      exigirBloqueio(c, c.rodar(), [par[1]]);
    } catch (e) {
      e.message = 'linha hostil ' + JSON.stringify(cortarTexto(par[0], 40)) + ': ' + e.message;
      throw e;
    }
  });
  const c = cenario();
  c.listaTroca('logo.png', '   logo.png   ');
  c.listaTroca('kairos-lockup.svg', '\tkairos-lockup.svg\t');
  exigirAprovado(c, c.rodar());
});

mutacao('M16', 'intrusos em _site: a conferência em shell falha em cada um', function () {
  intrusosNaConferencia().forEach(function (caso) {
    const pasta = montarSiteDeMentira(caso.nome);
    caso.estragar(pasta);
    const sh = conferenciaEmShell(pasta);
    assert.notStrictEqual(sh.status, 0, 'a conferência em shell tinha de FALHAR com: ' + caso.nome + '\n' + resumo(sh.saida));
    if (caso.frase) assert.ok(sh.saida.indexOf(caso.frase) !== -1, 'faltou a frase «' + caso.frase + '» com: ' + caso.nome + '\n' + resumo(sh.saida));
  });
  const limpo = montarSiteDeMentira('controle');
  const ok = conferenciaEmShell(limpo);
  assert.strictEqual(ok.status, 0, 'a conferência em shell tem de PASSAR com _site igual à lista:\n' + resumo(ok.saida));
});

function cortarTexto(s, n) { return s.length > n ? s.slice(0, n) + '...' : s; }

// ============================================================ A CONFERÊNCIA EM SHELL (a mesma do fluxo)
function lerFluxo() { return fs.readFileSync(FLUXO, 'utf8'); }

function extrairConferencia(yaml) {
  const linhas = yaml.split('\n');
  const i = linhas.findIndex(function (l) { return /^\s*- name: Confer[eê]ncia independente/.test(l); });
  if (i < 0) throw new Error('não achei o passo «Conferência independente» no fluxo');
  let j = i;
  while (j < linhas.length && !/^\s*run:\s*\|\s*$/.test(linhas[j])) j++;
  if (j >= linhas.length) throw new Error('o passo «Conferência independente» não tem «run: |»');
  const indentRun = linhas[j].match(/^\s*/)[0].length;
  const corpo = [];
  let indentCorpo = null;
  for (let k = j + 1; k < linhas.length; k++) {
    const l = linhas[k];
    if (l.trim() === '') { corpo.push(''); continue; }
    const ind = l.match(/^\s*/)[0].length;
    if (ind <= indentRun) break;
    if (indentCorpo === null) indentCorpo = ind;
    corpo.push(l.slice(indentCorpo));
  }
  return corpo.join('\n') + '\n';
}

/** Roda o texto EXATO da conferência do fluxo dentro de `dir` (que tem _site e .github/site-permitidos.txt). */
function conferenciaEmShell(dir) {
  const rt = fs.mkdtempSync(path.join(TMP, 'rt-'));
  const script = path.join(rt, 'conferir.sh');
  fs.writeFileSync(script, extrairConferencia(lerFluxo()));
  const r = spawnSync('bash', [script], { cwd: dir, encoding: 'utf8', env: Object.assign({}, process.env, { RUNNER_TEMP: rt }) });
  return { status: r.status, saida: (r.stdout || '') + (r.stderr || '') };
}

/** Uma pasta com a lista real e um _site de mentira (arquivos vazios com os nomes da lista). */
function montarSiteDeMentira(nome) {
  const dir = fs.mkdtempSync(path.join(TMP, 'sm-'));
  copiar(LISTA, path.join(dir, '.github', 'site-permitidos.txt'));
  itensDaLista(fs.readFileSync(LISTA, 'utf8')).filter(function (i) { return i.tipo !== 'nao-e-arquivo'; }).forEach(function (i) {
    const d = path.join(dir, '_site', i.caminho);
    fs.mkdirSync(path.dirname(d), { recursive: true });
    fs.writeFileSync(d, nome);
  });
  return dir;
}

function intrusosNaConferencia() {
  function mais(pasta, rel) { const d = path.join(pasta, '_site', rel); fs.mkdirSync(path.dirname(d), { recursive: true }); fs.writeFileSync(d, 'intruso'); }
  function naLista(pasta, linha) {
    const l = path.join(pasta, '.github', 'site-permitidos.txt');
    fs.writeFileSync(l, fs.readFileSync(l, 'utf8') + linha + '\n');
  }
  return [
    { nome: 'arquivo de docs/ (com linha na lista, só a busca de proibidos pega)', frase: 'arquivo proibido em _site', estragar: function (p) { mais(p, 'docs/INDICE-MENU-APP.png'); naLista(p, 'docs/INDICE-MENU-APP.png'); } },
    { nome: 'arquivo .md (com linha na lista)', frase: 'arquivo proibido em _site', estragar: function (p) { mais(p, 'LEIAME.md'); naLista(p, 'LEIAME.md'); } },
    { nome: 'arquivo de tests/ (com linha na lista)', frase: 'arquivo proibido em _site', estragar: function (p) { mais(p, 'tests/harness.js'); naLista(p, 'tests/harness.js'); } },
    { nome: 'regras do banco (com linha na lista)', frase: 'arquivo proibido em _site', estragar: function (p) { mais(p, 'database.rules.json'); naLista(p, 'database.rules.json'); } },
    { nome: 'ponte integracao-*/ (com linha na lista)', frase: 'arquivo proibido em _site', estragar: function (p) { mais(p, 'integracao-telegram/Codigo.gs'); naLista(p, 'integracao-telegram/Codigo.gs'); } },
    { nome: 'arquivo oculto (com linha na lista)', frase: 'arquivo proibido em _site', estragar: function (p) { mais(p, '.oculto'); naLista(p, '.oculto'); } },
    { nome: 'instruções AGENTS sem .md (com linha na lista)', frase: 'arquivo proibido em _site', estragar: function (p) { mais(p, 'AGENTS.txt'); naLista(p, 'AGENTS.txt'); } },
    { nome: 'nome com «senhas» (com linha na lista)', frase: 'arquivo proibido em _site', estragar: function (p) { mais(p, 'auaulandia/senhas-fixas.png'); naLista(p, 'auaulandia/senhas-fixas.png'); } },
    { nome: 'link simbólico a mais em _site', frase: 'link simbólico em _site', estragar: function (p) { fs.symlinkSync('../.github/site-permitidos.txt', path.join(p, '_site', 'atalho.png')); } },
    { nome: 'arquivo a mais (fora da lista)', frase: '+extra-fora-da-lista.png', estragar: function (p) { mais(p, 'extra-fora-da-lista.png'); } },
    { nome: 'arquivo a menos (na lista e ausente)', frase: '-logo.png', estragar: function (p) { fs.unlinkSync(path.join(p, '_site', 'logo.png')); } }
  ];
}

// ============================================================ EXTRAS
registrarListasHostis();
function registrarListasHostis() {
  const casos = [
    ['pasta com barra no fim', 'auaulandia/', 'a lista só aceita arquivo exato, sem curinga e sem pasta'],
    ['pasta sem barra no fim', 'auaulandia', 'a lista só aceita arquivo exato, sem curinga e sem pasta'],
    ['curinga ? no nome', 'auaulandia/?.js', 'a lista só aceita arquivo exato, sem curinga e sem pasta'],
    ['curinga [..] no nome', 'auaulandia/[a].js', 'a lista só aceita arquivo exato, sem curinga e sem pasta'],
    ['curinga {..} no nome', 'auaulandia/{a,b}.js', 'a lista só aceita arquivo exato, sem curinga e sem pasta'],
    ['«..» no começo', '../index.html', 'o caminho tem ".."'],
    ['«..» no meio', 'auaulandia/../index.html', 'o caminho tem ".."'],
    ['«/» no começo da linha', '/index.html', 'o caminho começa com "/"'],
    ['«#» dentro do nome', 'index.html#topo', 'o caminho tem "#"'],
    ['linha repetida (comum)', 'logo.png', 'Linha repetida'],
    ['linha repetida (entrada e comum)', 'index.html', 'Linha repetida']
  ];
  casos.forEach(function (caso, i) {
    extra('X1' + String.fromCharCode(97 + i), 'lista hostil: ' + caso[0], function () {
      const c = cenario();
      c.listaMais(caso[1]);
      exigirBloqueio(c, c.rodar(), [caso[2]]);
    });
  });
}

const REGRA_FIXA_CASOS = [
  'docs/x.png', 'tests/x.js', 'tools/x.js', 'servidor-senha/x.js', 'zelozinha/x.js', 'node_modules/x.js',
  'integracao-telegram/x.png', 'integracao-daycare/x.png', 'LEIAME.md', 'auaulandia/nota.MD', 'AGENTS.md', 'CLAUDE.md',
  'AGENTS.txt', 'CLAUDE.txt', 'auaulandia/Claude-notas.png', 'agents/x.png',      // instruções AGENTS/CLAUDE que NÃO terminam em .md
  'database.rules.json', 'database.rules.v2.json', 'firebase.json', '.firebaserc', '.github/x.png', '.oculto/x.png',
  'auaulandia/.oculto.png', 'x.gs', 'x.jsonl', 'package.json', 'package-lock.json', 'x.pem', 'x.key',
  'auaulandia/senhas.png', 'auaulandia/credenciais.png', 'auaulandia/conta-servico.png', 'auaulandia/service-account.png', 'auaulandia/meu-secret.png'
];
extra('X2', 'regra fixa: cada classe de «nunca publicar» bloqueia, mesmo existindo no repositório', function () {
  REGRA_FIXA_CASOS.forEach(function (caminho) {
    const c = cenario();
    c.escrever(caminho, /(^|\/)package\.json$/.test(caminho) ? '{}\n' : 'intruso de teste\n');   // package.json inválido derrubaria o próprio Node
    c.listaMais(caminho);
    c.indexar();
    try {
      exigirBloqueio(c, c.rodar(), [caminho + ': este caminho nunca vai para o site']);
    } catch (e) {
      e.message = 'regra fixa com ' + caminho + ': ' + e.message;
      throw e;
    }
  });
});

extra('X3', 'a existência é conferida pelo ÍNDICE do git, não pelo disco', function () {
  const c = cenario();
  c.escrever('auaulandia/so-no-disco.js', '// existe no disco, não no índice\n');
  c.listaMais('auaulandia/so-no-disco.js');
  exigirBloqueio(c, c.rodar(), ['auaulandia/so-no-disco.js: não é arquivo do repositório']);
});

extra('X4', 'acentos exatos na lista: forma decomposta (NFD) não vale', function () {
  const c = cenario();
  const nfd = 'stickers/Cachorro coração.png'.normalize('NFD');
  assert.notStrictEqual(nfd, 'stickers/Cachorro coração.png');
  c.listaTroca('stickers/Cachorro coração.png', nfd);
  exigirBloqueio(c, c.rodar(), [nfd + ': não é arquivo do repositório']);
});

extra('X5', 'caixa exata na lista: Logo.png não é logo.png', function () {
  const c = cenario();
  c.listaTroca('logo.png', 'Logo.png');
  exigirBloqueio(c, c.rodar(), ['Logo.png: não é arquivo do repositório']);
});

extra('X6', 'submódulo na lista (modo 160000) bloqueia', function () {
  const c = cenario();
  git(c.dir, ['update-index', '--add', '--cacheinfo', '160000,' + 'a'.repeat(40) + ',auaulandia/submodulo.js']);
  c.listaMais('auaulandia/submodulo.js');
  exigirBloqueio(c, c.rodar(), ['auaulandia/submodulo.js: não é arquivo comum (link simbólico ou submódulo).']);
});

extra('X7', '_site que o próprio montador criou e ficou velho é apagado: ao aprovar e ao bloquear', function () {
  const c = cenario();
  exigirAprovado(c, c.rodar());                                   // a primeira montagem cria o _site e o marca como dela
  c.escrever('_site/lixo-velho.txt', 'sobra de uma montagem antiga');
  const ok = c.rodar();
  exigirAprovado(c, ok);
  assert.ok(!fs.existsSync(c.p('_site/lixo-velho.txt')), 'o _site tem de começar limpo');
  const d = cenario();
  exigirAprovado(d, d.rodar());
  d.escrever('_site/lixo-velho.txt', 'sobra de uma montagem antiga');
  d.listaMais('auaulandia/nao-existe.js');
  exigirBloqueio(d, d.rodar(), ['auaulandia/nao-existe.js']);
});

extra('X8', 'a conferência final da saída acusa intruso, arquivo oculto e link simbólico', function () {
  const m = require(MONTADOR);
  const c = cenario();
  const saida = c.p('_site-conferida');
  fs.mkdirSync(saida, { recursive: true });
  fs.writeFileSync(path.join(saida, 'extra.png'), 'x');
  fs.writeFileSync(path.join(saida, '.oculto'), 'x');
  fs.mkdirSync(path.join(saida, 'docs'));
  fs.writeFileSync(path.join(saida, 'docs', 'nota.png'), 'x');
  fs.symlinkSync('../logo.png', path.join(saida, 'atalho.png'));
  const feito = m.copiarEConferir(['logo.png', 'index.html'], c.dir, saida);
  const texto = feito.problemas.join('\n');
  ['extra.png: está na saída e não está na lista', '.oculto', 'docs/nota.png', 'atalho.png: link simbólico na saída'].forEach(function (f) {
    assert.ok(texto.indexOf(f) !== -1, 'a conferência final não acusou: ' + f + '\n' + texto);
  });
  const limpo = cenario();
  const s2 = limpo.p('_site-limpa');
  const ok = m.copiarEConferir(['logo.png', 'index.html'], limpo.dir, s2);
  assert.deepStrictEqual(ok.problemas, [], 'saída limpa não pode ter problema');
  assert.strictEqual(ok.total, 2);
});

extra('X9', 'srcset, poster, data, action, formaction e manifest também são pedidos', function () {
  const c = cenario();
  const l = c.inserirAntes('index.html', '</body>', [
    '<img srcset="fora-s1.png 1x, fora-s2.png 2x" alt="">',
    '<video poster="fora-poster.png"></video>',
    '<object data="fora-objeto.png"></object>',
    '<form action="fora-acao.html"></form>',
    '<button formaction="fora-formacao.html"></button>',
    '<link rel="manifest" href="fora-manifesto.json">'
  ].join('\n'), true);
  c.indexar();
  exigirBloqueio(c, c.rodar(), [
    'index.html:' + l + ': a tela pede "fora-s1.png"', 'index.html:' + l + ': a tela pede "fora-s2.png"',
    'index.html:' + (l + 1) + ': a tela pede "fora-poster.png"', 'index.html:' + (l + 2) + ': a tela pede "fora-objeto.png"',
    'index.html:' + (l + 3) + ': a tela pede "fora-acao.html"', 'index.html:' + (l + 4) + ': a tela pede "fora-formacao.html"',
    'index.html:' + (l + 5) + ': a tela pede "fora-manifesto.json"'
  ]);
});

extra('X10', '@import de CSS e url() de CSS são resolvidos a partir do próprio .css', function () {
  const c = cenario();
  const css = 'auaulandia/assets/tokens-ds-v8.css';
  c.escrever(css, '@import "fora-import.css";\n' + c.ler(css) + '\n.teste{background:url(fora-imagem.png)}\n');
  c.indexar();
  exigirBloqueio(c, c.rodar(), [
    css + ':1: a tela pede "auaulandia/assets/fora-import.css", que NÃO está na lista',
    'a tela pede "auaulandia/assets/fora-imagem.png", que NÃO está na lista'
  ]);
});

extra('X11', 'caminho que sobe para fora do site bloqueia', function () {
  const c = cenario();
  const l1 = c.inserirAntes(PAG, '</body>', '<script src="../../fora.js"></script>', true);
  const l2 = c.inserirAntes('index.html', '</body>', '<img src="../fora.png" alt="">', true);
  c.indexar();
  exigirBloqueio(c, c.rodar(), [PAG + ':' + l1 + ': o caminho "../../fora.js" sai da pasta do site', 'index.html:' + l2 + ': o caminho "../fora.png" sai da pasta do site']);
});

extra('X12', 'o .js é resolvido a partir da página que o carrega (não da pasta dele)', function () {
  const c = cenario();
  const arq = 'auaulandia/prevencao/painel-prevencao.js';
  c.escrever(arq, c.ler(arq) + '\nvar imagemTeste=new Image(); imagemTeste.src="icone-fora.png";\n');
  const linha = c.linhaDe(arq, 'icone-fora.png');
  c.indexar();
  exigirBloqueio(c, c.rodar(), [arq + ':' + linha + ': a tela pede "auaulandia/icone-fora.png", que NÃO está na lista']);
});

extra('X13', 'texto entre aspas só conta inteiro; data-* e nome em frase não contam', function () {
  const c = cenario();
  c.inserirAntes(PAG, '</body>', [
    '<div data-sol57="core-sol57.js" data-x = "painel58.js"></div>',
    "<script>var aviso='Veja o roteiro em docs/roteiro-de-teste.md antes de publicar'; var k='image/png'; var t='.pdf';</script>"
  ].join('\n'), true);
  c.indexar();
  exigirAprovado(c, c.rodar());
});

extra('X14', 'nome montado com ${...}.png em modelo de texto bloqueia', function () {
  const c = cenario();
  const linha = c.inserirAntes(PAG, '</body>', '<script>var h=`<img src="assets/stickers/${nome}.png">`;</script>', true);
  c.indexar();
  exigirBloqueio(c, c.rodar(), [PAG + ':' + linha + ': a tela monta o nome do arquivo no código']);
});

extra('X15', 'AC3.6: a prova leva menos de 30 s na página de 7,9 MB e não trava com linha de 8 MB', function () {
  const c = cenario();
  const base = c.rodar();
  exigirAprovado(c, base);
  assert.ok(base.ms < 30000, 'a base levou ' + base.ms + ' ms');
  const N = 8 * 1024 * 1024;
  const variantes = {
    'uma linha de 8 MB com palavras': function () { return '<!DOCTYPE html><html><body><script>var x="' + 'a '.repeat(N / 2) + '";</script></body></html>'; },
    'uma linha de 8 MB de «a»': function () { return '<html><body>' + 'a'.repeat(N) + '</body></html>'; },
    'src=" repetido sem fechar': function () { return '<html><body>' + 'src="'.repeat(N / 5) + '</body></html>'; },
    'url( repetido': function () { return '<html><body><style>' + 'url('.repeat(N / 4) + '</style></body></html>'; },
    '<script repetido': function () { return '<html><body>' + '<script '.repeat(N / 8) + '</body></html>'; },
    'aspas e palavras': function () { return '<html><body><script>' + '"a b c d e f '.repeat(N / 13) + '</script></body></html>'; },
    '${ repetido': function () { return '<html><body><script>' + '${a}.pn'.repeat(N / 7) + '</script></body></html>'; }
  };
  Object.keys(variantes).forEach(function (nome) {
    const v = cenario();
    v.escrever('index.html', variantes[nome]());
    v.escreverLista('entrada index.html\n');
    v.indexar();
    const r = v.rodar();
    assert.ok([0, 1].indexOf(r.status) !== -1, nome + ': o montador caiu (código ' + r.status + ')\n' + resumo(r.saida));
    assert.ok(r.ms < 30000, nome + ': levou ' + r.ms + ' ms; o limite é 30 s');
  });
});

extra('X16', 'a página com <base> bloqueia (a prova não sabe resolver caminhos com <base>)', function () {
  const c = cenario();
  const linha = c.inserirAntes('index.html', '</head>', '<base href="outra-pasta/">');
  c.indexar();
  exigirBloqueio(c, c.rodar(), ['index.html:' + linha + ': a página tem <base>']);
});

extra('X17', 'AC13.4: o montador só lê as entradas e o que elas carregam (nada de docs/, tests/, tools/)', function () {
  const m = require(MONTADOR);
  const c = cenario();
  const lida = m.lerLista(c.lista(), 'lista');
  assert.deepStrictEqual(lida.erros, [], 'a lista da árvore de trabalho tem erro de forma');
  const lidos = [];
  const prova = m.provar(lida.itens, c.dir, function (rel) { lidos.push(rel); return fs.readFileSync(path.join(c.dir, rel), 'utf8'); });
  assert.deepStrictEqual(prova.problemas, [], 'a prova tinha de aprovar a base:\n' + prova.problemas.slice(0, 5).join('\n'));
  const naLista = new Set(lida.itens.filter(function (i) { return i.tipo !== 'nao-e-arquivo'; }).map(function (i) { return i.caminho; }));
  lidos.forEach(function (rel) {
    assert.ok(naLista.has(rel), 'o montador leu "' + rel + '", que não está na lista');
    assert.ok(!/^(docs|tests|tools|servidor-senha|zelozinha)\//.test(rel), 'o montador leu "' + rel + '"');
    assert.ok(/\.(html|css|js)$/.test(rel), 'o montador leu "' + rel + '", que não é página, estilo nem script');
  });
  const entradas = lida.itens.filter(function (i) { return i.tipo === 'entrada'; }).map(function (i) { return i.caminho; });
  entradas.forEach(function (e) { assert.ok(lidos.indexOf(e) !== -1, 'a entrada ' + e + ' não foi lida'); });
});

extra('X18', 'lista vazia ou sem nenhuma «entrada» bloqueia (nunca publica um site vazio)', function () {
  // Só comentários e uma linha «nao-e-arquivo»: nada seria publicado.
  const vazia = cenario();
  vazia.escreverLista('# lista sem nenhuma linha útil\n\nnao-e-arquivo auaulandia/foto-do-corpo.jpg\n');
  exigirBloqueio(vazia, vazia.rodar(), ['a lista não tem nenhuma linha "entrada"']);
  // Todos os arquivos comuns, mas nenhuma «entrada»: a frase tem de dizer o que falta.
  const semEntrada = cenario();
  semEntrada.escreverLista(semEntrada.lista().split('\n').map(function (l) { return l.replace(/^entrada[ \t]+/, ''); }).join('\n'));
  exigirBloqueio(semEntrada, semEntrada.rodar(), ['a lista não tem nenhuma linha "entrada"']);
});

extra('X19', 'link simbólico: o modo do índice e o exame do disco bloqueiam, cada um sozinho', function () {
  const frase = ['logo.png: não é arquivo comum (link simbólico ou submódulo).'];
  // A: o índice diz «arquivo comum» (100644), mas o disco tem um link (só o exame do disco pega).
  const a = cenario();
  const blobA = git(a.dir, ['rev-parse', ':logo.png']).trim();
  fs.rmSync(a.p('logo.png'));
  fs.symlinkSync('.github/site-permitidos.txt', a.p('logo.png'));
  git(a.dir, ['update-index', '--cacheinfo', '100644,' + blobA + ',logo.png']);
  exigirBloqueio(a, a.rodar(), frase);
  // B: o índice diz «link» (120000), mas o disco tem um arquivo comum (só o modo do índice pega).
  const b = cenario();
  const blobB = git(b.dir, ['rev-parse', ':logo.png']).trim();
  git(b.dir, ['update-index', '--cacheinfo', '120000,' + blobB + ',logo.png']);
  exigirBloqueio(b, b.rodar(), frase);
});

// ------------------------------------------------------------ a forma do fluxo
function blocoDoJob(yaml, nome) {
  const linhas = yaml.split('\n');
  const ini = linhas.findIndex(function (l) { return l === '  ' + nome + ':'; });
  if (ini < 0) throw new Error('o fluxo não tem o job «' + nome + '»');
  let fim = linhas.length;
  for (let i = ini + 1; i < linhas.length; i++) { if (/^  \S/.test(linhas[i])) { fim = i; break; } }
  return linhas.slice(ini, fim).join('\n');
}

function semComentarios(texto) { return texto.split('\n').map(function (l) { return l.replace(/(^|\s)#.*$/, ''); }).join('\n'); }

extra('X20', 'fluxo: disparos e permissões (permissions {} no topo, montar só lê, sem pull_request_target)', function () {
  const yaml = lerFluxo();
  const util = semComentarios(yaml);
  const topo = util.slice(0, util.indexOf('\njobs:'));
  assert.ok(/^permissions:\s*\{\}\s*$/m.test(topo), 'falta «permissions: {}» no topo do fluxo');
  assert.ok(/^on:/m.test(topo) && /^  push:/m.test(topo) && /branches:\s*\[master\]/.test(topo), 'falta o disparo em push no master');
  assert.ok(/^  workflow_dispatch:/m.test(topo), 'falta o disparo manual (workflow_dispatch)');
  assert.ok(/^  pull_request:/m.test(topo), 'falta o pull_request (só para o job montar)');
  assert.ok(util.indexOf('pull_request_target') === -1, 'pull_request_target é proibido');
  const montar = blocoDoJob(util, 'montar');
  assert.ok(/permissions:\s*\n\s+contents:\s*read\s*\n/.test(montar), 'o job montar precisa de «contents: read»');
  assert.ok(!/:\s*write/.test(montar), 'o job montar não pode ter permissão de escrita');
  assert.ok(/persist-credentials:\s*false/.test(montar), 'o checkout precisa de «persist-credentials: false»');
  assert.ok(/uses:\s*actions\/checkout@/.test(montar), 'o job montar precisa do checkout');
});

extra('X21', 'fluxo: só ações oficiais fixadas por hash de 40 caracteres, sem segredo, sem runner próprio', function () {
  const util = semComentarios(lerFluxo());
  const usos = util.split('\n').filter(function (l) { return /^\s*(-\s+)?uses:/.test(l); });
  assert.ok(usos.length >= 4, 'esperava ao menos 4 ações; achei ' + usos.length);
  usos.forEach(function (l) {
    const m = /uses:\s*(\S+)\s*$/.exec(l);
    assert.ok(m && /^actions\/[\w.-]+@[0-9a-f]{40}$/.test(m[1]), 'ação fora do padrão (oficial «actions/» e hash de 40 caracteres): ' + l.trim());
  });
  ['secrets.', 'self-hosted', 'npm install', 'npm ci', 'pull_request_target'].forEach(function (proibido) {
    assert.ok(util.indexOf(proibido) === -1, 'o fluxo não pode ter «' + proibido + '»');
  });
  const rodam = util.match(/runs-on:\s*(\S+)/g) || [];
  assert.ok(rodam.length === 2 && rodam.every(function (r) { return /ubuntu-24\.04/.test(r); }), 'os dois jobs devem rodar em ubuntu-24.04');
});

extra('X22', 'fluxo: publicar depende do montar, nunca roda em pull request, só no master, sem checkout', function () {
  const util = semComentarios(lerFluxo());
  const pub = blocoDoJob(util, 'publicar');
  assert.ok(/^\s+needs:\s*montar\s*$/m.test(pub), 'o job publicar precisa de «needs: montar»');
  const se = /^\s+if:\s*(.+)$/m.exec(pub);
  assert.ok(se, 'o job publicar precisa de «if»');
  assert.ok(se[1].indexOf("github.event_name != 'pull_request'") !== -1, 'o job publicar não pode rodar em pull request');
  assert.ok(se[1].indexOf("github.ref == 'refs/heads/master'") !== -1, 'o job publicar só roda no master');
  assert.ok(/pages:\s*write/.test(pub) && /id-token:\s*write/.test(pub), 'o job publicar precisa de pages: write e id-token: write');
  assert.ok(pub.indexOf('actions/checkout') === -1, 'o job publicar NÃO pode ter checkout (não baixa o código)');
  assert.ok(/name:\s*github-pages/.test(pub), 'falta o ambiente github-pages');
  assert.ok(/actions\/configure-pages@/.test(pub) && /actions\/deploy-pages@/.test(pub), 'faltam configure-pages e deploy-pages');
});

extra('X23', 'fluxo: o artefato é a pasta _site (nunca a raiz) e não sai em pull request', function () {
  const util = semComentarios(lerFluxo());
  const i = util.indexOf('actions/upload-pages-artifact@');
  assert.ok(i !== -1, 'falta o upload-pages-artifact');
  const passo = util.slice(i).split('\n\n')[0];
  assert.ok(/^\s+path:\s*_site\s*$/m.test(passo), 'o artefato tem de ser «path: _site»');
  assert.ok(/if:\s*github\.event_name != 'pull_request'/.test(passo), 'o artefato não deve sair em pull request');
});

extra('X24', 'fluxo: a regra fixa da conferência em shell é a MESMA do montador', function () {
  const m = require(MONTADOR);
  const script = extrairConferencia(lerFluxo());
  const g = /grep -inE '([^']+)'/.exec(script);
  assert.ok(g, 'a conferência em shell não tem a busca de proibidos («grep -inE ...»)');
  const amostras = REGRA_FIXA_CASOS.concat(['index.html', 'logo.png', 'auaulandia/index.html', 'stickers/Osso.png', 'auaulandia/assets/painel44/Auau.png', 'kairos-lockup.svg', 'auaulandia/prevencao/prevencao-runtime.js', 'auaulandia/docs-nao-e-pasta-raiz.png']);
  amostras.forEach(function (a) {
    const sh = spawnSync('grep', ['-inE', g[1]], { input: a + '\n', encoding: 'utf8', env: Object.assign({}, process.env, { LC_ALL: 'C' }) });
    const noShell = sh.status === 0;
    const noMontador = m.regraFixa(a) !== null;
    assert.strictEqual(noShell, noMontador, 'a regra fixa divergiu em «' + a + '»: shell ' + (noShell ? 'bloqueia' : 'deixa') + ', montador ' + (noMontador ? 'bloqueia' : 'deixa'));
  });
});

extra('X25', 'conferência em shell: o link simbólico é pego sozinho; busca de proibidos e diff valem cada uma', function () {
  const script = extrairConferencia(lerFluxo());
  assert.ok(/find _site -type l/.test(script), 'a conferência precisa procurar link simbólico');
  assert.ok(/diff -u/.test(script), 'a conferência precisa do diff entre a lista e _site');
  assert.ok(/set -euo pipefail/.test(script), 'a conferência precisa de «set -euo pipefail»');
});

// ------------------------------------------------------------ a pasta de saída (B3 do QA da 6.114)
// O montador APAGA a pasta de saída antes de montar. Só pode apagar o que ele mesmo montou.
function pastaComArquivo(dir, arquivo, conteudo) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, arquivo), conteudo || 'não pode ser apagado');
}

extra('X26', 'B3: --saida .git (e qualquer pasta oculta) é recusada e o .git continua inteiro', function () {
  const c = cenario();
  const indiceAntes = git(c.dir, ['ls-files', '-s']);
  exigirRecusaDeSaida(c.rodarComSaida('.git'), 'é oculta');
  assert.ok(fs.existsSync(c.p('.git/HEAD')), 'o .git foi apagado pelo montador');
  assert.strictEqual(git(c.dir, ['ls-files', '-s']), indiceAntes, 'o índice do git mudou: o .git não está inteiro');
  exigirRecusaDeSaida(c.rodarComSaida('.git/objetos-de-teste'), 'é oculta');
  // uma pasta oculta que não existe também é recusada (nada é criado)
  exigirRecusaDeSaida(c.rodarComSaida('.oculta-nova'), 'é oculta');
  assert.ok(!fs.existsSync(c.p('.oculta-nova')), 'o montador criou a pasta oculta');
});

extra('X27', 'B3: --saida fora da cópia é recusada (a pasta existente não é apagada, a nova não é criada)', function () {
  const c = cenario();
  const existente = path.join(TMP, 'fora-existente-' + contador);
  pastaComArquivo(existente, 'importante.txt');
  exigirRecusaDeSaida(c.rodarComSaida(existente), 'fica fora do repositório');
  assert.ok(fs.existsSync(path.join(existente, 'importante.txt')), 'o montador apagou uma pasta que está fora da cópia');
  const nova = path.join(TMP, 'fora-nova-' + contador);
  exigirRecusaDeSaida(c.rodarComSaida(nova), 'fica fora do repositório');
  assert.ok(!fs.existsSync(nova), 'o montador criou uma pasta fora da cópia');
  exigirRecusaDeSaida(c.rodarComSaida('../fora-relativa-' + contador), 'fica fora do repositório');
  assert.ok(!fs.existsSync(path.join(TMP, 'fora-relativa-' + contador)), 'o montador criou uma pasta fora da cópia (caminho relativo)');
});

extra('X28', 'B3: pasta que já existe e que o montador não criou não é apagada', function () {
  const c = cenario();
  pastaComArquivo(c.p('minha-pasta'), 'importante.txt');
  const outra = c.rodarComSaida('minha-pasta');
  exigirRecusaDeSaida(outra, 'já existe e não foi criada por este montador');
  assert.ok(outra.saida.indexOf('escolha outra (por exemplo _site)') !== -1, 'a recusa de uma pasta que não é o _site tem de sugerir o _site');
  assert.ok(fs.existsSync(c.p('minha-pasta/importante.txt')), 'o montador apagou uma pasta que não era dele');
  // o _site feito à mão também não: é a mesma regra, sem exceção para o nome
  pastaComArquivo(c.p('_site'), 'feito-a-mao.txt');
  const site = c.rodar();
  exigirRecusaDeSaida(site, 'já existe e não foi criada por este montador');
  assert.ok(fs.existsSync(c.p('_site/feito-a-mao.txt')), 'o montador apagou um _site que não era dele');
  // N2: a pasta recusada é o próprio _site, então a frase não pode mandar escolher o _site de novo
  assert.ok(site.saida.indexOf('por exemplo _site') === -1, 'a recusa do próprio _site manda escolher o _site de novo.\n' + resumo(site.saida));
  assert.ok(site.saida.indexOf('apague a pasta _site você mesmo') !== -1 && site.saida.indexOf('rode de novo') !== -1, 'a recusa do próprio _site tem de mandar apagar a pasta e rodar de novo.\n' + resumo(site.saida));
  // o _site que o montador apagou ao bloquear deixa de ser «dele»: um _site novo, feito à mão, também é recusado
  const e = cenario();
  exigirAprovado(e, e.rodar());
  e.listaMais('auaulandia/nao-existe.js');
  exigirBloqueio(e, e.rodar(), ['auaulandia/nao-existe.js']);   // bloqueou e apagou o _site dele
  pastaComArquivo(e.p('_site'), 'feito-a-mao.txt');
  exigirRecusaDeSaida(e.rodar(), 'já existe e não foi criada por este montador');
  assert.ok(fs.existsSync(e.p('_site/feito-a-mao.txt')), 'o montador apagou um _site feito à mão depois de uma montagem bloqueada');
  // N1: a marca do _site vale só para o nome inteiro «_site», nunca para um nome que apenas COMEÇA com _site
  const f = cenario();
  exigirAprovado(f, f.rodar());                                   // _site montado pelo montador (fica marcado como dele)
  ['_site-copia', '_site2'].forEach(function (nome) {
    pastaComArquivo(f.p(nome), 'importante.txt');                 // pasta feita à mão, com o nome começando por _site
    exigirRecusaDeSaida(f.rodarComSaida(nome), 'já existe e não foi criada por este montador');
    assert.ok(fs.existsSync(f.p(nome + '/importante.txt')), 'o montador apagou a pasta "' + nome + '", feita à mão: a marca do _site valeu por prefixo');
  });
  assert.ok(f.existeSite(), 'o _site do montador sumiu quando ele recusou outra pasta');
});

extra('X29', 'B3: pasta com .git dentro não é apagada, nem que o nome já tenha sido montado antes', function () {
  const c = cenario();
  exigirAprovado(c, c.rodar());                                   // _site montado pelo montador (fica marcado como dele)
  fs.rmSync(c.p('_site'), { recursive: true, force: true });      // alguém apaga e põe outra coisa no mesmo nome: um repositório
  pastaComArquivo(c.p('_site/.git'), 'HEAD', 'ref: refs/heads/main\n');
  pastaComArquivo(c.p('_site'), 'codigo.js', 'não pode ser apagado');
  exigirRecusaDeSaida(c.rodar(), 'tem um .git dentro');
  assert.ok(fs.existsSync(c.p('_site/.git/HEAD')) && fs.existsSync(c.p('_site/codigo.js')), 'o montador apagou uma pasta com .git dentro');
});

extra('X30', 'q01: pasta com arquivo versionado não é apagada, nem a que o montador montou antes', function () {
  const c = cenario();
  exigirRecusaDeSaida(c.rodarComSaida('auaulandia'), 'tem arquivo versionado');
  assert.ok(fs.existsSync(c.p('auaulandia/index.html')), 'o montador apagou a pasta auaulandia, que tem arquivo versionado');
  exigirRecusaDeSaida(c.rodarComSaida('stickers/Osso.png'), 'tem arquivo versionado');
  assert.ok(fs.existsSync(c.p('stickers/Osso.png')), 'o montador apagou um arquivo versionado');
  // o _site que o montador montou, mas que alguém passou a versionar: não é mais só saída
  const d = cenario();
  exigirAprovado(d, d.rodar());
  pastaComArquivo(d.p('_site'), 'versionado.txt');
  git(d.dir, ['add', '-f', '_site/versionado.txt']);
  const versionado = d.rodar();
  exigirRecusaDeSaida(versionado, 'tem arquivo versionado');
  assert.ok(fs.existsSync(d.p('_site/versionado.txt')), 'o montador apagou um _site que tem arquivo versionado');
  // N2: a pasta recusada é o próprio _site, então a frase não pode mandar escolher o _site de novo
  assert.ok(versionado.saida.indexOf('por exemplo _site') === -1, 'a recusa do próprio _site manda escolher o _site de novo.\n' + resumo(versionado.saida));
  assert.ok(versionado.saida.indexOf('git rm -r --cached _site') !== -1, 'a recusa do _site versionado tem de dizer como tirar o _site do git.\n' + resumo(versionado.saida));
});

/** Valor de um campo do bloco `concurrency` do topo do fluxo, avaliado como o GitHub avalia (só as contas do fluxo). */
function avaliarConcorrencia(valor, github) {
  const m = /^\$\{\{\s*(.+?)\s*\}\}$/.exec(valor.trim());
  if (!m) return valor.trim() === 'true' ? true : (valor.trim() === 'false' ? false : valor.trim());
  assert.ok(/^[\w\s.'(),{}\-=&|!]+$/.test(m[1]), 'expressão da concorrência com caractere inesperado: ' + m[1]);
  const nomes = m[1].replace(/'[^']*'/g, "''").match(/[A-Za-z_]\w*/g) || [];
  nomes.forEach(function (n) { assert.ok(['github', 'event_name', 'ref', 'format'].indexOf(n) !== -1, 'a expressão da concorrência usa «' + n + '», que o teste não sabe avaliar: ' + m[1]); });
  const format = function (fmt) {
    const args = Array.prototype.slice.call(arguments, 1);
    return fmt.replace(/\{(\d+)\}/g, function (_, i) { return args[Number(i)]; });
  };
  return new Function('github', 'format', 'return (' + m[1] + ');')(github, format);
}

extra('X31', 'q02: uma publicação em andamento nunca é cancelada (só o pull request cancela, e só a prova do pull request)', function () {
  const util = semComentarios(lerFluxo());
  const blocos = util.match(/^\s*concurrency:/gm) || [];
  assert.strictEqual(blocos.length, 1, 'o fluxo tem de ter UM bloco «concurrency» (achei ' + blocos.length + '); job com concurrency próprio pode cancelar a publicação');
  const cancelam = util.match(/^\s*cancel-in-progress:/gm) || [];
  assert.strictEqual(cancelam.length, 1, 'o fluxo tem de ter UM «cancel-in-progress» (achei ' + cancelam.length + ')');
  const linhas = util.split('\n');
  const ini = linhas.findIndex(function (l) { return /^concurrency:\s*$/.test(l); });
  assert.ok(ini !== -1, 'o bloco «concurrency» tem de ficar no topo do fluxo, fora dos jobs');
  let fim = linhas.length;
  for (let i = ini + 1; i < linhas.length; i++) { if (/^\S/.test(linhas[i])) { fim = i; break; } }
  const bloco = linhas.slice(ini + 1, fim).join('\n');
  const grupo = /^\s+group:\s*(.+?)\s*$/m.exec(bloco);
  const cancela = /^\s+cancel-in-progress:\s*(.+?)\s*$/m.exec(bloco);
  assert.ok(grupo && cancela, 'o bloco «concurrency» precisa de «group» e de «cancel-in-progress»');
  ['push', 'workflow_dispatch'].forEach(function (evento) {
    const gh = { event_name: evento, ref: 'refs/heads/master' };
    assert.strictEqual(avaliarConcorrencia(cancela[1], gh), false, 'em «' + evento + '» o fluxo NÃO pode cancelar a publicação em andamento (cancel-in-progress tem de valer false)');
    assert.strictEqual(avaliarConcorrencia(grupo[1], gh), 'pages', 'em «' + evento + '» o grupo tem de ser «pages» (uma publicação por vez)');
  });
  const pr = { event_name: 'pull_request', ref: 'refs/pull/7/merge' };
  assert.strictEqual(avaliarConcorrencia(cancela[1], pr), true, 'o pull request cancela a prova velha dele mesmo (cancel-in-progress true só ali)');
  const grupoPr = String(avaliarConcorrencia(grupo[1], pr));
  assert.ok(grupoPr !== 'pages' && grupoPr.indexOf(pr.ref) !== -1, 'o grupo do pull request tem de ser só dele (nunca «pages», e com o ramo do pull request): ' + grupoPr);
});

// ============================================================ EXECUÇÃO
function dicasDaSaida(saida) {
  const dicas = [];
  saida.split('\n').forEach(function (l) {
    let m = /a tela pede "(.+?)", que NÃO está na lista/.exec(l);
    if (m) dicas.push('FALTA a linha na lista (ou tire o pedido da tela): ' + m[1]);
    m = /^(.+?): está na lista, mas nenhuma tela pede/.exec(l);
    if (m) dicas.push('SOBRA a linha na lista: ' + m[1]);
  });
  return dicas;
}

function main() {
  criarBase();
  const ordem = ['controle', 'mutação', 'extra'];
  const sel = testes.filter(function (t) { return !SO || SO.indexOf(t.id) !== -1; })
    .sort(function (a, b) { return ordem.indexOf(a.grupo) - ordem.indexOf(b.grupo); });
  const placar = { controle: [0, 0], 'mutação': [0, 0], extra: [0, 0] };
  const falhas = [];
  sel.forEach(function (t) {
    const ini = Date.now();
    ultimaSaida = '';
    placar[t.grupo][1]++;
    try {
      t.fn();
      placar[t.grupo][0]++;
      console.log('  ok   ' + t.id.padEnd(5) + ' ' + t.titulo + '  (' + (Date.now() - ini) + ' ms)');
    } catch (e) {
      falhas.push(t.id);
      console.log('  FALHOU ' + t.id + ' ' + t.titulo);
      console.log('         ' + String(e && e.message ? e.message : e).split('\n').join('\n         '));
      dicasDaSaida(ultimaSaida).slice(0, 8).forEach(function (d) { console.log('         >> ' + d); });
    }
  });
  console.log('');
  console.log('Controles: ' + placar.controle[0] + ' de ' + placar.controle[1] + ' passam (esperado 6).');
  console.log('Mutações:  ' + placar['mutação'][0] + ' de ' + placar['mutação'][1] + ' como esperado (esperado 23: 22 bloqueiam e M14 aceita).');
  console.log('Extras:    ' + placar.extra[0] + ' de ' + placar.extra[1] + '.');
  if (falhas.length) {
    console.log('FALHOU: ' + falhas.join(', '));
    process.exitCode = 1;
  } else {
    console.log('TUDO CERTO.');
  }
}

main();
