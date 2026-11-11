'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const arquivo = path.join(__dirname, 'preflight-rh151.sh');
const fonte = fs.readFileSync(arquivo, 'utf8');
assert.match(fonte, /usuario_existe\(\) \{ id zeluz-piloto >\/dev\/null 2>&1; \}/);
assert.match(fonte, /\$\(bool usuario_existe\)/);
assert.doesNotMatch(fonte, /\$\(bool id zeluz-piloto >\/dev\/null/);

const bash = process.platform === 'win32' ? 'C:\\Program Files\\Git\\bin\\bash.exe' : 'bash';
const sintaxe = spawnSync(bash, ['-n', arquivo], { encoding: 'utf8' });
assert.equal(sintaxe.status, 0, sintaxe.stderr);

const semantica = spawnSync(bash, ['-c', 'bool(){ if "$@"; then printf true; else printf false; fi; }; usuario_existe(){ false >/dev/null 2>&1; }; printf "{\\"usuarioExiste\\":%s}\\n" "$(bool usuario_existe)"'], { encoding: 'utf8' });
assert.equal(semantica.status, 0, semantica.stderr);
assert.deepEqual(JSON.parse(semantica.stdout), { usuarioExiste: false });

console.log('preflight-rh151: bool de usuário produz JSON válido mesmo quando o comando falha.');
