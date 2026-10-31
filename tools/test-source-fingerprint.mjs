import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
export function testSourceFingerprint(root,tests){
 const files=[];
 function walk(dir){for(const entry of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){const rel=dir+'/'+entry.name;if(entry.isDirectory())walk(rel);else if(entry.name.endsWith('.js')&&entry.name!=='firebase-config.js')files.push(rel);}}
 walk('src');files.push(...tests,'data/official-cards.json');
 const h=crypto.createHash('sha256');for(const file of files.sort()){h.update(file+'\0');h.update(fs.readFileSync(path.join(root,file)));}return h.digest('hex');
}
