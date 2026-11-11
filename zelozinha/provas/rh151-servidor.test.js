'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {spawnSync} = require('node:child_process');
const path = require('node:path');
const dir=path.resolve(__dirname,'../../servidor-rh');
for (const arquivo of ['auth.test.cjs','dados.test.cjs','api.test.cjs','startup.test.cjs','startup-producao151.test.cjs','proxy-node151.test.cjs','proxy-rh151.test.cjs','preflight-rh151.test.cjs']) {
  test(arquivo,()=>{const r=spawnSync(process.execPath,[path.join(dir,arquivo)],{encoding:'utf8',timeout:30000});assert.equal(r.status,0,arquivo+' | '+r.stdout+' | '+r.stderr);});
}
