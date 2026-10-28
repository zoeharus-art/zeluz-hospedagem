'use strict';
/*
 * TIRAR COMENTÁRIOS NA PUBLICAÇÃO — ganho de velocidade da varredura 360 (27/out/2026).
 *
 * O app tem ~1,9 MB de comentários (24% do index.html). Eles são para quem mexe no código, não
 * para o celular da equipe. O montador do site chama este módulo NA CÓPIA para _site/: o
 * repositório continua com todos os comentários; só o que vai para o ar sai sem eles.
 *
 * COMO É SEGURO
 *   - Quem acha os comentários é o acorn (tools/vendor/acorn-8.15.0, MIT, baixado do registro
 *     oficial do npm com a assinatura sha512 conferida): um leitor de JavaScript de verdade, que
 *     sabe a diferença entre «//» de comentário e «//» dentro de texto, de endereço ou de regex.
 *   - Depois de tirar, o resultado é lido de novo e comparado com o original, peça por peça
 *     (cada palavra, número, texto, regex e sinal) e com a mesma quebra de linha entre as peças
 *     (é ela que decide onde o JavaScript põe «;» sozinho). Qualquer diferença: aquele script
 *     vai para o ar como estava, com o motivo no relatório. Nunca bloqueia a publicação.
 *   - Ficam: /*! ... *\/, @license, @preserve e as linhas «//# sourceMappingURL» e «//# sourceURL».
 *   - Em página: só <script> sem type ou com type de JavaScript/module, e nunca um script que
 *     tenha «<!--» E «<script» juntos (só esse par muda o jeito de o navegador achar o fim do script;
 *     tirar comentário nunca cria nenhum dos dois, porque troca o comentário por espaço ou quebra).
 */

const acorn = require('./vendor/acorn-8.15.0/acorn.js');

const TIPOS_JS = /^(?:text\/javascript|application\/javascript|text\/ecmascript|application\/ecmascript|module)$/i;

function manter(c) {
  if (c.type === 'Block' && c.value.charAt(0) === '!') return true;
  if (/@license|@preserve/.test(c.value)) return true;
  if (c.type === 'Line' && /^[#@] source(?:Mapping)?URL=/.test(c.value)) return true;
  return false;
}

function ler(src, sourceType) {
  const pecas = [];
  const comentarios = [];
  acorn.parse(src, {
    ecmaVersion: 'latest',
    sourceType: sourceType,
    allowHashBang: true,
    onToken: pecas,
    onComment: comentarios
  });
  return { pecas: pecas, comentarios: comentarios };
}

const QUEBRA = new RegExp('[\n\r' + String.fromCharCode(0x2028, 0x2029) + ']');   // as quatro quebras de linha do JavaScript

/** Assinatura das peças: o texto exato de cada uma e se há quebra de linha antes dela. */
function assinatura(src, pecas) {
  const out = [];
  let fimAnterior = 0;
  for (let i = 0; i < pecas.length; i++) {
    const p = pecas[i];
    if (p.type.label === 'eof') break;
    const entre = src.slice(fimAnterior, p.start);
    // Entre duas peças só pode haver espaço e comentário; comentário de bloco com quebra conta como quebra.
    out.push((i && QUEBRA.test(entre) ? '\n' : '') + p.type.label + '\u0000' + src.slice(p.start, p.end));
    fimAnterior = p.end;
  }
  return out;
}

function ehEspaco(ch) { return ch === ' ' || ch === '\t'; }

/** Faixas [ini, fim, troca] a tirar do texto. */
function faixas(src, comentarios) {
  const out = [];
  comentarios.forEach(function (c) {
    if (manter(c)) return;
    let a = c.start;
    while (a > 0 && ehEspaco(src.charAt(a - 1))) a--;
    const comecaLinha = a === 0 || src.charAt(a - 1) === '\n' || src.charAt(a - 1) === '\r';
    let b = c.end;
    while (b < src.length && ehEspaco(src.charAt(b))) b++;
    const fimDeLinha = b === src.length || src.charAt(b) === '\n' || src.charAt(b) === '\r';
    const temQuebra = c.type === 'Block' && QUEBRA.test(c.value);
    if (comecaLinha && fimDeLinha && !temQuebra) {
      // A linha inteira era só o comentário: sai a linha toda, com a quebra dela.
      if (src.charAt(b) === '\r' && src.charAt(b + 1) === '\n') b += 2;
      else if (b < src.length) b += 1;
      out.push([a, b, '']);
    } else if (c.type === 'Line') {
      out.push([a, c.end, '']);                 // a quebra de linha depois dele fica
    } else {
      // Espaço só quando há código dos dois lados na mesma linha (a/**/b não pode virar ab).
      out.push([a, c.end, temQuebra ? '\n' : (comecaLinha || fimDeLinha ? '' : ' ')]);
    }
  });
  return out;
}

/**
 * Tira os comentários de um trecho de JavaScript.
 * Devolve { texto, tirou (caracteres), ok, motivo }. Se !ok, `texto` é o original sem mudança.
 */
function tirarDeJS(src, sourceType) {
  let antes;
  try { antes = ler(src, sourceType || 'script'); } catch (e) {
    if (sourceType) return { texto: src, tirou: 0, ok: false, motivo: 'o acorn não leu (' + e.message + ')' };
    try { antes = ler(src, 'module'); sourceType = 'module'; } catch (e2) {
      return { texto: src, tirou: 0, ok: false, motivo: 'o acorn não leu (' + e.message + ')' };
    }
  }
  sourceType = sourceType || 'script';
  const fx = faixas(src, antes.comentarios);
  if (!fx.length) return { texto: src, tirou: 0, ok: true, motivo: '' };
  let texto = '';
  let pos = 0;
  fx.forEach(function (f) {
    if (f[0] < pos) return;                     // faixas vêm em ordem e sem sobrepor; isto só não arrisca
    texto += src.slice(pos, f[0]) + f[2];
    pos = f[1];
  });
  texto += src.slice(pos);
  let depois;
  try { depois = ler(texto, sourceType); } catch (e) {
    return { texto: src, tirou: 0, ok: false, motivo: 'o resultado não foi lido de novo (' + e.message + ')' };
  }
  const A = assinatura(src, antes.pecas);
  const B = assinatura(texto, depois.pecas);
  if (A.length !== B.length) return { texto: src, tirou: 0, ok: false, motivo: 'número de peças mudou' };
  for (let i = 0; i < A.length; i++) {
    if (A[i] !== B[i]) return { texto: src, tirou: 0, ok: false, motivo: 'peça ' + i + ' mudou' };
  }
  return { texto: texto, tirou: src.length - texto.length, ok: true, motivo: '' };
}

/** Tira os comentários dos <script> inline de uma página. Devolve { texto, tirou, recusados: [motivo] }. */
function tirarDeHTML(html) {
  const re = /<script\b[^<>]{0,2000}>/gi;
  const reFim = /<\/script/gi;
  const recusados = [];
  let saida = '';
  let pos = 0;
  let tirou = 0;
  let m;
  while ((m = re.exec(html)) !== null) {
    const ini = m.index + m[0].length;
    reFim.lastIndex = ini;
    const f = reFim.exec(html);
    const fim = f ? f.index : html.length;
    re.lastIndex = Math.max(re.lastIndex, fim);
    const tipo = /\btype[ \t]*=[ \t]*["']?([^"'\s>]+)/i.exec(m[0]);
    if (/\bsrc[ \t]*=/i.test(m[0])) continue;
    if (tipo && !TIPOS_JS.test(tipo[1])) continue;
    const corpo = html.slice(ini, fim);
    if (!corpo.trim()) continue;
    if (corpo.indexOf('<!--') !== -1 && /<script/i.test(corpo)) { recusados.push('script na posição ' + ini + ': tem «<!--» e «<script»'); continue; }
    const r = tirarDeJS(corpo, tipo && /^module$/i.test(tipo[1]) ? 'module' : 'script');
    if (!r.ok) { recusados.push('script na posição ' + ini + ': ' + r.motivo); continue; }
    saida += html.slice(pos, ini) + r.texto;
    pos = fim;
    tirou += r.tirou;
  }
  saida += html.slice(pos);
  return { texto: saida, tirou: tirou, recusados: recusados };
}

module.exports = { tirarDeJS, tirarDeHTML };
