'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const nginx = fs.readFileSync(path.join(__dirname, 'nginx-rh151.conf.modelo'), 'utf8');
const compose = fs.readFileSync(path.join(__dirname, 'compose-proxy-rh151.modelo.yml'), 'utf8');

assert.match(nginx, /location \^~ \/rh151\//);
assert.match(nginx, /proxy_pass http:\/\/unix:\/run\/zeluz-rh151\/api\.sock/);
assert.match(nginx, /proxy_set_header X-RH-Client-IP \$remote_addr/);
assert.match(nginx, /set_real_ip_from @@TRAEFIK_NETWORK_CIDR@@/);
assert.match(nginx, /location \/ \{ return 404; \}/);
assert.doesNotMatch(nginx, /server_name\s+(?!_;)[^\s]+/);
assert.match(compose, /read_only:\s*true/);
assert.match(compose, /cap_drop:\s*\n\s*- ALL/);
assert.match(compose, /entrypoint: \["\/usr\/sbin\/nginx"\]/);
assert.match(compose, /PathPrefix\(`\/rh151`\)/);
assert.match(compose, /Host\(`@@HOST_EXISTENTE@@`\)/);
assert.match(compose, /\/run\/zeluz-rh151:\/run\/zeluz-rh151:ro/);
assert.match(compose, /expose:\s*\n\s*- "8080"/);
assert.doesNotMatch(compose, /\n\s*ports:/);
assert.doesNotMatch(compose, /https?:\/\/[A-Za-z0-9]/);

console.log('proxy-rh151: 14 verificações estáticas passaram; nenhuma porta/socket/rede foi aberta.');
