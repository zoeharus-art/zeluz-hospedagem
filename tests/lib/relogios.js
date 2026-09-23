'use strict';
/*
 * RELÓGIOS DO CÓDIGO-FONTE — lê os setInterval() do index.html sem depender de
 * como a linha está escrita (23/set/2026).
 *
 * POR QUE EXISTE
 * A Prova 4 do consumo-bytes conferia os relógios com um recorte literal do código
 * ("if(document.hidden) return; if(typeof carregarRiscoNaoComer…"). Âncora assim
 * apodrece: bastou o conserto dos 695 MB enfiar MAIS uma guarda no meio
 * (economiaPausada) para o teste acusar falha num relógio que continuava certo — e
 * bastou o Painel do Dia ser dissolvido (09/set) para o teste cobrar um relógio que
 * já nem existe mais. Nos dois casos o app estava melhor e o teste, mentindo.
 *
 * A REGRA QUE NÃO ENVELHECE
 * Em vez de casar texto, este módulo ACHA cada setInterval(), recorta o CORPO dele e
 * lê o período. Aí o teste pergunta pelo comportamento — "o relógio que chama
 * carregarRiscoNaoComer para com a aba escondida?" — e continua valendo mesmo que
 * apareça guarda nova, o nome da tela mude ou a ordem das linhas vire outra.
 */

// Anda pelo código a partir de `i` (na abertura do parêntese) até fechar, pulando
// texto entre aspas e comentários — senão um ')' dentro de 'fila med (relógio)'
// fecharia a conta no lugar errado.
function fecharParentese(codigo, i) {
  let nivel = 0;
  for (let p = i; p < codigo.length; p++) {
    const c = codigo[p];
    if (c === '"' || c === "'" || c === '`') {
      const aspas = c;
      p++;
      while (p < codigo.length && codigo[p] !== aspas) { if (codigo[p] === '\\') p++; p++; }
      continue;
    }
    if (c === '/' && codigo[p + 1] === '/') { while (p < codigo.length && codigo[p] !== '\n') p++; continue; }
    if (c === '/' && codigo[p + 1] === '*') { p = codigo.indexOf('*/', p + 2); if (p === -1) return -1; p++; continue; }
    if (c === '(') nivel++;
    else if (c === ')') { nivel--; if (nivel === 0) return p; }
  }
  return -1;
}

// O período é o que vem depois da última vírgula de primeiro nível: setInterval(fn, 30000).
function ultimoArgumento(args) {
  let nivel = 0, corte = -1;
  for (let p = 0; p < args.length; p++) {
    const c = args[p];
    if (c === '"' || c === "'" || c === '`') {
      const aspas = c;
      p++;
      while (p < args.length && args[p] !== aspas) { if (args[p] === '\\') p++; p++; }
      continue;
    }
    if (c === '/' && args[p + 1] === '/') { while (p < args.length && args[p] !== '\n') p++; continue; }
    if (c === '/' && args[p + 1] === '*') { p = args.indexOf('*/', p + 2); if (p === -1) break; p++; continue; }
    if (c === '(' || c === '[' || c === '{') nivel++;
    else if (c === ')' || c === ']' || c === '}') nivel--;
    else if (c === ',' && nivel === 0) corte = p;
  }
  return corte === -1 ? { corpo: args, periodo: '' } : { corpo: args.slice(0, corte), periodo: args.slice(corte + 1).trim() };
}

// Resolve o período mesmo quando é conta (10*60*1000) ou constante (BATIMENTO_MS).
function periodoEmMs(expr, codigo) {
  const texto = String(expr || '').trim();
  if (/^[\d\s*+/.()-]+$/.test(texto) && /\d/.test(texto)) {
    try { return Function('"use strict";return (' + texto + ')')(); } catch (e) { return null; }
  }
  const nome = texto.match(/^[A-Za-z_$][\w$]*$/);
  if (nome) {
    const decl = new RegExp('\\b' + texto + '\\s*=\\s*([\\d\\s*+/.()-]+)').exec(codigo);
    if (decl) return periodoEmMs(decl[1], codigo);
  }
  return null;
}

/**
 * Lê todos os relógios (setInterval) do código.
 * Devolve [{ corpo, periodoMs, periodoTexto, linha }] — `corpo` é o que roda a cada volta.
 */
function lerRelogios(codigo) {
  const achados = [];
  const marca = /\bsetInterval\s*\(/g;
  let m;
  while ((m = marca.exec(codigo)) !== null) {
    const abre = codigo.indexOf('(', m.index);
    const fecha = fecharParentese(codigo, abre);
    if (fecha === -1) continue;
    const args = codigo.slice(abre + 1, fecha);
    const partes = ultimoArgumento(args);
    achados.push({
      corpo: partes.corpo,
      periodoTexto: partes.periodo,
      periodoMs: periodoEmMs(partes.periodo, codigo),
      linha: codigo.slice(0, m.index).split('\n').length
    });
    marca.lastIndex = fecha;
  }
  return achados;
}

/** Os relógios cujo corpo chama uma função `carregarXxx` — quem custa bytes a cada volta. */
function relogiosQueChamam(relogios, nomeFn) {
  const chama = new RegExp('\\b' + nomeFn + '\\s*\\(');
  return relogios.filter(function (r) { return chama.test(r.corpo); });
}

/** Para com a aba escondida? Qualquer forma de checar document.hidden serve. */
function paraComAbaEscondida(relogio) {
  return /document\s*\.\s*hidden/.test(relogio.corpo);
}

module.exports = { lerRelogios, relogiosQueChamam, paraComAbaEscondida };
