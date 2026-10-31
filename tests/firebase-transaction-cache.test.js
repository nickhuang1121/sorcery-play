import test from 'node:test';
import assert from 'node:assert/strict';
import {runPrimedFirebaseTransaction} from '../src/net/firebase-transport.js';
import {firebaseRoomExpired} from '../src/net/firebase-match-model.js';
const now=2_000_000;
const meta=beat=>({status:'lobby',createdAt:1,updatedAt:1,presence:{0:{online:false,beat},1:{online:false,beat:0}}});
function coldSDK(remote,{deny=false}={}){
 let cache=null,stopped=false,runs=0;
 return {get stopped(){return stopped;},get runs(){return runs;},onValue(reference,ready,error){assert.equal(reference,'room/meta');queueMicrotask(()=>{if(deny)error(Error('PERMISSION_DENIED'));else{cache=structuredClone(remote);ready({val:()=>cache});}});return ()=>{stopped=true;};},async runTransaction(reference,update,options){runs++;assert.equal(stopped,false,'keep the listener while the transaction runs');assert.deepEqual(options,{applyLocally:false});const next=update(cache);return {committed:next!==undefined,value:next??cache};}};
}
test('cold Firebase cache is loaded before an expired-room updater decides whether to abort',async()=>{
 const sdk=coldSDK(meta(1));
 const result=await runPrimedFirebaseTransaction('room/meta',current=>firebaseRoomExpired(current,now)?{...current,status:'deleting'}:undefined,sdk);
 assert.equal(result.committed,true);assert.equal(result.value.status,'deleting');assert.equal(sdk.stopped,true);
});
test('priming does not turn an active-room abort into a write',async()=>{
 const sdk=coldSDK(meta(now));
 const result=await runPrimedFirebaseTransaction('room/meta',current=>firebaseRoomExpired(current,now)?{...current,status:'deleting'}:undefined,sdk);
 assert.equal(result.committed,false);assert.equal(result.value.status,'lobby');assert.equal(sdk.stopped,true);
});
test('failed initial Firebase reads reject without running a transaction and release the listener',async()=>{
 const sdk=coldSDK(meta(1),{deny:true});
 await assert.rejects(runPrimedFirebaseTransaction('room/meta',()=>({status:'deleting'}),sdk),/PERMISSION_DENIED/);
 assert.equal(sdk.runs,0);assert.equal(sdk.stopped,true);
});
