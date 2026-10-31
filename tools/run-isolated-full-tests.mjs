// Reentrant read-only test execution: only writes its own unique /tmp folder.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const output=fs.mkdtempSync('/tmp/sorcery-full-regression-');
const tests=fs.readdirSync(path.join(root,'tests')).filter(f=>f.endsWith('.test.js')).sort().map(f=>'tests/'+f);
function sourceFingerprint(){
 const files=[];
 function walk(dir){for(const entry of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){const rel=dir+'/'+entry.name;if(entry.isDirectory())walk(rel);else if(entry.name.endsWith('.js')&&entry.name!=='firebase-config.js')files.push(rel);}}
 walk('src');files.push(...tests,'data/official-cards.json');
 const h=crypto.createHash('sha256');for(const file of files.sort()){h.update(file+'\0');h.update(fs.readFileSync(path.join(root,file)));}return h.digest('hex');
}
const startedAt=new Date().toISOString(),before=sourceFingerprint();
fs.writeFileSync(path.join(output,'running.json'),JSON.stringify({startedAt,sourceFingerprint:before,tests,scope:'Native full suite; independent unique output, no progress/statistics mutation.'},null,2));
console.log(output);
const stdout=fs.openSync(path.join(output,'results.tap'),'wx'),stderr=fs.openSync(path.join(output,'stderr.log'),'wx');
const child=spawn(process.execPath,['--test','--test-reporter=tap',...tests],{cwd:root,stdio:['ignore',stdout,stderr]});
child.on('error',error=>{fs.writeFileSync(path.join(output,'spawn-error.txt'),String(error));process.exitCode=1;});
child.on('close',(code,signal)=>{
 fs.closeSync(stdout);fs.closeSync(stderr);
 const tap=fs.readFileSync(path.join(output,'results.tap'),'utf8'),n=label=>Number(tap.match(new RegExp('^# '+label+' (\\d+)','m'))?.[1]||0),after=sourceFingerprint();
 const result={startedAt,checkedAt:new Date().toISOString(),command:'node --test --test-reporter=tap tests/*.test.js',exitCode:code,signal,tests:n('tests'),passed:n('pass'),failed:n('fail'),skipped:n('skipped'),cancelled:n('cancelled'),sourceBefore:before,sourceAfter:after,sourceUnchanged:before===after,resultFile:path.join(output,'results.tap'),stderrFile:path.join(output,'stderr.log')};
 fs.writeFileSync(path.join(output,'validation.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));process.exitCode=code===0&&before===after?0:1;
});
