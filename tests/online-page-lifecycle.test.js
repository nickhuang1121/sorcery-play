import test from 'node:test';
import assert from 'node:assert/strict';
import {bindOnlinePageLifecycle} from '../src/net/online-client.js';
const transition=(target,type,persisted)=>{const event=new Event(type);Object.defineProperty(event,'persisted',{value:persisted});target.dispatchEvent(event);};
test('back/forward cache restore reloads the authenticated room after the old client was closed',()=>{
 const target=new EventTarget(),events=[];
 const unbind=bindOnlinePageLifecycle({offline(){events.push('offline');},close(){events.push('close');}},{target,reload(){events.push('reload');}});
 transition(target,'pageshow',false);assert.deepEqual(events,[]);
 transition(target,'pagehide',true);assert.deepEqual(events,['offline','close']);
 transition(target,'pageshow',true);assert.deepEqual(events,['offline','close','reload']);
 unbind();transition(target,'pagehide',true);transition(target,'pageshow',true);assert.equal(events.length,3);
});
test('an unfinished offline request cannot block cached-page recovery',()=>{
 const target=new EventTarget();let closed=false,reloaded=false;
 const unbind=bindOnlinePageLifecycle({offline:()=>new Promise(()=>{}),close(){closed=true;}},{target,reload(){reloaded=true;}});
 transition(target,'pagehide',true);transition(target,'pageshow',true);
 assert.equal(closed,true);assert.equal(reloaded,true);unbind();
});
