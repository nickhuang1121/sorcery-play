import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
for(const entry of ['engine','geography','objects'])test('public '+entry+' entry initializes its rule registry in a fresh process',()=>{
 const run=spawnSync(process.execPath,['--input-type=module','-e',"await import('./src/"+entry+".js');"],{cwd:new URL('../',import.meta.url),encoding:'utf8'});
 assert.equal(run.status,0,run.stderr);
});
