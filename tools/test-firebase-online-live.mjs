// Explicit, isolated live-rules audit. Uses the Firebase CLI owner's OAuth
// credential with database auth-variable overrides; never prints credentials.
// This tests deployed rules and RTDB transactions, not an OAuth login UI.
import fs from 'node:fs';import os from 'node:os';import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {install,officialBetaDecks} from '../src/cards.js';
import {createFirebaseOnline} from '../src/net/firebase-online.js';
import {FIREBASE_ROOMS,FIREBASE_DIRECTORY,makeFirebaseRoom} from '../src/net/firebase-match-model.js';
import {firebaseConfig} from '../src/net/firebase-config.js';
import {createCommunityService} from '../src/community/service.js';
import {ACCOUNT_ROOT,DIRECTORY} from '../src/community/model.js';
import {ENGINE_BUILD} from '../src/net/protocol.js';
if(!process.argv.includes('--live'))throw Error('Pass --live to audit isolated test rooms in the configured Firebase project.');
install(JSON.parse(fs.readFileSync(new URL('../data/official-cards.json',import.meta.url))));
const cached=JSON.parse(fs.readFileSync(os.homedir()+'/.config/configstore/firebase-tools.json')),access=cached.tokens?.access_token;
assert.ok(access,'Firebase CLI login required');
const prefix='codex-google-'+crypto.randomBytes(6).toString('hex'),owned=new Set(),watchers=new Set(),services=[];
const uid0=prefix+'-host',uid1=prefix+'-guest',uid2=prefix+'-outsider',checks=[];
const base=firebaseConfig.databaseURL;
async function http(path,{method='GET',value,uid,provider='google.com',etag}={}){const url=new URL(base+'/'+path+'.json');if(uid!==undefined)url.searchParams.set('auth_variable_override',JSON.stringify(uid===null?null:{uid,token:{firebase:{sign_in_provider:provider}}}));const headers={Authorization:'Bearer '+access,'Content-Type':'application/json','X-Firebase-ETag':'true'};if(etag)headers['If-Match']=etag;const response=await fetch(url,{method,headers,body:method==='GET'?undefined:JSON.stringify(value)});const data=await response.json();return {status:response.status,value:data,etag:response.headers.get('etag')};}
async function request(path,options){const r=await http(path,options);if(r.status>=400){const e=Error(r.value?.error||'Firebase request failed');e.code=r.status===401?'PERMISSION_DENIED':'HTTP_'+r.status;throw e;}return r;}
async function notify(path){for(const w of watchers)if(path===w.path||path.startsWith(w.path+'/')||w.path.startsWith(path+'/'))w.fn((await request(w.path,{uid:w.uid})).value);}
function transport(uid){return {serverNow:Date.now,serverTimestamp:()=>({'.sv':'timestamp'}),isConnected:()=>true,ensureAuth:async()=>({uid}),
 async get(path){if(path==='.info/connected')return true;const value=(await request(path,{uid})).value;if(path===FIREBASE_DIRECTORY)return Object.fromEntries(Object.entries(value||{}).filter(([id])=>owned.has(id)));return value;},
 async set(path,value){await request(path,{method:'PUT',value,uid});await notify(path);},async remove(path){await request(path,{method:'DELETE',value:null,uid});await notify(path);},
 async transact(path,updater){for(let i=0;i<20;i++){const old=await request(path,{uid}),next=updater(old.value);if(next===undefined)return {committed:false,value:old.value};const r=await http(path,{method:'PUT',value:next,uid,etag:old.etag});if(r.status===412)continue;if(r.status>=400){const e=Error(r.value.error);e.code='PERMISSION_DENIED';throw e;}await notify(path);return {committed:true,value:r.value};}throw Error('Too many transaction conflicts');},
 subscribe(path,fn){if(path==='.info/connected'){queueMicrotask(()=>fn(true));return ()=>{};}const entry={path,uid,fn};watchers.add(entry);return ()=>watchers.delete(entry);},registerDisconnect:async()=>()=>{},
 };}
function newCode(){const id=crypto.randomBytes(4).toString('hex').slice(0,6).toUpperCase();owned.add(id);return id;}
async function service(uid){const s=await createFirebaseOnline({transport:transport(uid),uid,seed:()=>42,code:newCode});services.push(s);return s;}
const command=(s,id,body)=>s.request('/rooms/'+id,{method:'POST',body:{...body,build:ENGINE_BUILD}});
try{
 for(const provider of ['anonymous','password'])assert.equal((await http(FIREBASE_DIRECTORY,{uid:uid2,provider})).status,401);
 assert.equal((await fetch(base+'/'+FIREBASE_DIRECTORY+'.json')).status,401);checks.push('only Google-token identities can access the room directory');
 const a=await service(uid0),b=await service(uid1),outsider=await service(uid2),created=await a.request('/rooms',{method:'POST'}),id=created.id;
 await request(FIREBASE_DIRECTORY+'/'+id,{method:'PUT',value:{createdAt:Date.now()-1500},uid:uid0});checks.push('directory accepts estimated SDK timestamps without relying on exact server equality');
 assert.equal((await http(FIREBASE_ROOMS+'/'+id,{uid:uid2})).status,401);assert.equal((await http(FIREBASE_ROOMS+'/'+id,{method:'DELETE',value:null,uid:uid0})).status,401);checks.push('non-members cannot read payloads; active rooms cannot be deleted');
 const joined=await b.request('/rooms/'+id+'/join',{method:'POST'});assert.equal(joined.seat,1);await assert.rejects(outsider.request('/rooms/'+id+'/join',{method:'POST'}));checks.push('fixed Google UID seats and full-room rejection');
 const decks=officialBetaDecks();for(const [s,i]of [[a,1],[b,2]]){await command(s,id,{type:'deck',deck:decks[i]});await command(s,id,{type:'ready',ready:true});}await command(a,id,{type:'start'});
 const replay=JSON.parse(fs.readFileSync(new URL('../data/online-dual-browser-played-match.json',import.meta.url)));let revision=1;
 for(const [index,action]of replay.history.entries()){const s=action.actor===1?b:a,view=await s.request('/rooms/'+id),body={type:'action',action,revision:view.revision,choiceToken:view.choiceToken,commandId:crypto.randomUUID()};const after=await command(s,id,body);assert.equal(after.revision,++revision,'command '+(index+1));if(index===0){const duplicate=await command(s,id,body);assert.equal(duplicate.revision,revision);}}
 const final=await a.request('/rooms/'+id);assert.equal(final.state.winner,0);assert.equal(final.state.turn,19);assert.deepEqual(final.state.players.map(p=>p.life),[14,0]);const exported=await b.request('/rooms/'+id+'/replay');assert.equal(exported.history.length,119);checks.push('119 real RTDB transaction commands, duplicate retry, revision 120, natural victory and member replay');
 await a.close();const resumed=await service(uid0);assert.equal((await resumed.request('/rooms/'+id)).seat,0);checks.push('Google UID resumes the original seat from a new client instance');
 const expiredId=newCode(),aged=makeFirebaseRoom(expiredId,uid0,Date.now()-16*60000);aged.meta.presence[0].online=false;await request(FIREBASE_ROOMS+'/'+expiredId,{method:'PUT',value:aged});await request(FIREBASE_DIRECTORY+'/'+expiredId,{method:'PUT',value:{createdAt:aged.meta.createdAt}});assert.ok((await outsider.sweep()).includes(expiredId));assert.equal((await http(FIREBASE_ROOMS+'/'+expiredId)).value,null);checks.push('outsider cleanup can delete only both-offline rooms older than fifteen minutes');
 const activeValue=(await http(FIREBASE_ROOMS+'/'+id)).value;assert.ok(activeValue);checks.push('cleanup preserves the currently active match');
 // Public-room audit stays inside owned IDs. Never claim or clean a real player's room.
 const waitingHost=await service(prefix+'-waiting-host'),privateHost=await service(prefix+'-private-host'),searchA=await service(prefix+'-search-a'),searchB=await service(prefix+'-search-b');
 const privateRoom=await privateHost.request('/rooms',{method:'POST',body:{visibility:'private'}}),publicRoom=await waitingHost.request('/rooms',{method:'POST',body:{visibility:'public'}});
 const available=await searchA.request('/rooms');assert.deepEqual(available.map(r=>r.id),[publicRoom.id]);assert.ok(!JSON.stringify(available).includes(prefix));checks.push('public discovery hides private/full/ended rooms and does not publish player identities or decks');
 const raced=await Promise.allSettled([searchA.request('/rooms/quick-join',{method:'POST'}),searchB.request('/rooms/quick-join',{method:'POST'})]);assert.equal(raced.filter(r=>r.status==='fulfilled').length,1);const winner=raced[0].status==='fulfilled'?searchA:searchB,loser=winner===searchA?searchB:searchA;
 const winnerUid=winner.uid;await winner.request('/rooms/'+publicRoom.id+'/leave',{method:'POST'});assert.equal((await loser.request('/rooms/'+publicRoom.id+'/join',{method:'POST'})).seat,1);
 assert.equal((await http(FIREBASE_ROOMS+'/'+publicRoom.id+'/meta/presence/1',{method:'PUT',value:{online:true,beat:Date.now()},uid:winnerUid})).status,401);
 const meta=(await http(FIREBASE_ROOMS+'/'+publicRoom.id+'/meta',{uid:loser.uid})).value;assert.equal((await http(FIREBASE_ROOMS+'/'+publicRoom.id+'/meta',{method:'PUT',value:{...meta,status:'cancelled'},uid:loser.uid})).status,401);checks.push('concurrent quick join reserves one seat; guest leave permits replacement and revoked identities cannot heartbeat or cancel the host');
 await waitingHost.request('/rooms/'+publicRoom.id+'/leave',{method:'POST'});assert.equal((await http(FIREBASE_ROOMS+'/'+publicRoom.id)).value,null);await privateHost.request('/rooms/'+privateRoom.id+'/leave',{method:'POST'});checks.push('only the waiting host can cancel immediately, and cancellation removes room and directory');
 const resultHost=createCommunityService({transport:transport(uid0),uid:uid0}),resultGuest=createCommunityService({transport:transport(uid1),uid:uid1});
 await Promise.all([resultHost.syncRoom(id),resultGuest.syncRoom(id)]);await resultHost.syncRoom(id);assert.equal((await resultHost.read()).public.wins,1);assert.equal((await resultGuest.read()).public.losses,1);assert.equal((await resultHost.read()).public.games,1);checks.push('natural online result sync records inverse host/guest outcomes exactly once in community rankings');
 const summary={build:ENGINE_BUILD,checkedAt:new Date().toISOString(),project:firebaseConfig.projectId,tests:checks.length,checks,match:{commands:119,revision:120,turn:19,winner:0,life:[14,0]},authentication:'Firebase CLI credential constrained with Google/non-Google auth-variable overrides; OAuth UI is verified separately'};
 fs.mkdirSync(new URL('../output/firebase-online/',import.meta.url),{recursive:true});fs.writeFileSync(new URL('../output/firebase-online/live-validation.json',import.meta.url),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary));
}finally{
 for(const uid of [uid0,uid1]){await http(DIRECTORY+'/'+uid,{method:'DELETE',value:null});await http(ACCOUNT_ROOT+'/'+uid,{method:'DELETE',value:null});}
 for(const s of services)try{await s.close();}catch{}
 for(const id of owned){const room=(await http(FIREBASE_ROOMS+'/'+id)).value;if(room?.meta?.host?.startsWith(prefix)||!room){await http(FIREBASE_ROOMS+'/'+id,{method:'DELETE',value:null});await http(FIREBASE_DIRECTORY+'/'+id,{method:'DELETE',value:null});}}
}
