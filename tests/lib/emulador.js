'use strict';
/*
 * EMULADOR DO REALTIME DATABASE PARA OS ROBÔS — 08/set/2026.
 *
 * POR QUE EXISTE
 * O smoke de navegador abria 7 sessões novas e visitava 165 telas no banco REAL a cada
 * publicação. Cada sessão nova desce cadastro, estadias, fotos, auditoria, relatórios…
 * Dezenas de MB por rodada, várias rodadas por dia — eram os "robôs" dos 695 MB de 08/set,
 * com teto gratuito de 360 MB/dia. Aqui o teste ganha um banco de mentira, local, carregado
 * com o retrato do backup da VPS (tests/lib/retrato.js): o app abre com ?emulador=1 e fala
 * com a porta 9000 desta máquina. O Firebase de verdade não recebe UM byte.
 *
 * COMO FUNCIONA
 *  1. Acha o .jar do emulador que o firebase-tools já baixou (~/.cache/firebase/emulators).
 *  2. Sobe `java -jar … --host 127.0.0.1 --port 9000`.
 *  3. Cola as regras v2 (as mesmas publicadas no Console) e o retrato via REST, com o
 *     cabeçalho de dono que só o emulador aceita (Authorization: Bearer owner).
 *  4. Carimba daycare/config/versao-app com a versão que está no index.html do disco —
 *     assim o app em teste é "a versão publicada" e não tenta recarregar sozinho.
 *
 * Sem dependência externa: só Node, Java e o .jar já presente.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const NS = 'hospedagem-zeluz-default-rtdb';   // o mesmo namespace da databaseURL do app
const HOST = '127.0.0.1';

function acharJar() {
  const dirs = [
    path.join(os.homedir(), '.cache', 'firebase', 'emulators'),
    path.join(process.env.LOCALAPPDATA || '', 'firebase', 'emulators'),
  ];
  for (const d of dirs) {
    try {
      const jars = fs.readdirSync(d).filter((f) => /^firebase-database-emulator-v[\d.]+\.jar$/.test(f)).sort();
      if (jars.length) return path.join(d, jars[jars.length - 1]);
    } catch (e) { /* pasta não existe: tenta a próxima */ }
  }
  throw new Error('Não achei o .jar do emulador do Realtime Database em ' + dirs.join(' nem ') +
    '. Rode uma vez `npx --yes firebase-tools emulators:start --only database` para baixá-lo.');
}

function pedir(metodo, porta, caminho, corpo) {
  return new Promise((res, rej) => {
    const dados = corpo === undefined ? null : (typeof corpo === 'string' ? corpo : JSON.stringify(corpo));
    const req = http.request({
      host: HOST, port: porta, method: metodo,
      path: caminho + (caminho.indexOf('?') >= 0 ? '&' : '?') + 'ns=' + NS,
      headers: Object.assign({ Authorization: 'Bearer owner' },
        dados ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(dados) } : {}),
      timeout: 120000,
    }, (r) => {
      let s = '';
      r.on('data', (d) => { s += d; });
      r.on('end', () => res({ status: r.statusCode, corpo: s }));
    });
    req.on('error', rej);
    req.on('timeout', () => { req.destroy(); rej(new Error('tempo esgotado em ' + metodo + ' ' + caminho)); });
    if (dados) req.write(dados);
    req.end();
  });
}

async function esperarSubir(porta, tetoMs) {
  const t0 = Date.now();
  for (;;) {
    try {
      const r = await pedir('GET', porta, '/.json?shallow=true');
      if (r.status === 200 || r.status === 401) return;
    } catch (e) { /* ainda não subiu */ }
    if (Date.now() - t0 > tetoMs) throw new Error('O emulador não respondeu em ' + tetoMs + ' ms');
    await new Promise((r) => setTimeout(r, 400));
  }
}

/**
 * Sobe o emulador e carrega regras + retrato + carimbo de versão.
 * @param {{porta?:number, retrato:{daycare:object,auaulandia:object,dia:string}, regras?:string, versaoApp?:string, log?:function}} o
 * @returns {Promise<{porta:number, parar:function, jar:string}>}
 */
async function subir(o) {
  const porta = o.porta || 9000;
  const log = o.log || (() => {});
  const jar = acharJar();
  const proc = spawn('java', ['-Duser.language=en', '-jar', jar, '--host', HOST, '--port', String(porta)],
    { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  let saida = '';
  proc.stdout.on('data', (d) => { saida += d; });
  proc.stderr.on('data', (d) => { saida += d; });
  const parar = () => { try { proc.kill(); } catch (e) { /* já morreu */ } };
  try {
    await esperarSubir(porta, 60000);
  } catch (e) {
    parar();
    throw new Error(e.message + '\n' + saida.slice(-1500));
  }
  if (o.regras) {
    const r = await pedir('PUT', porta, '/.settings/rules.json', o.regras);
    if (r.status !== 200) { parar(); throw new Error('Regras recusadas pelo emulador (HTTP ' + r.status + '): ' + r.corpo.slice(0, 300)); }
    log('regras coladas no emulador (' + Buffer.byteLength(o.regras) + ' bytes)');
  }
  for (const no of ['daycare', 'auaulandia']) {
    const dados = o.retrato[no] || {};
    const r = await pedir('PUT', porta, '/' + no + '.json', dados);
    if (r.status !== 200) { parar(); throw new Error('Não consegui carregar ' + no + ' no emulador (HTTP ' + r.status + ')'); }
    log(no + ': ' + Object.keys(dados).length + ' nós carregados do retrato de ' + o.retrato.dia);
  }
  if (o.versaoApp) {
    const r = await pedir('PUT', porta, '/daycare/config/versao-app.json', JSON.stringify(o.versaoApp));
    if (r.status !== 200) { parar(); throw new Error('Não consegui carimbar a versão no emulador (HTTP ' + r.status + ')'); }
    log('versão carimbada no emulador: ' + o.versaoApp);
  }
  return { porta, parar, jar };
}

module.exports = { subir, acharJar, NS, HOST };
