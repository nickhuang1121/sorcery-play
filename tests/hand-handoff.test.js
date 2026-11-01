import test from 'node:test';
import assert from 'node:assert/strict';
import {createHandHandoff} from '../src/turn-control-view.js';
const state=(turn,active,extra={})=>({mode:'local',turn,active,phase:'main',winner:null,...extra});
const view=(viewer,handPlayer=viewer,controlled=null)=>({viewer,handPlayer,controlled});
test('both Thaïs controlled turns reveal immediately and normal play resumes without a handoff',()=>{
 const handoff=createHandHandoff();
 assert.equal(handoff.update(state(1,0),view(0)),null);
 assert.equal(handoff.update(state(2,1),view(0,1,1)),null);
 assert.equal(handoff.update(state(3,0),view(1,0,0)),null);
 assert.equal(handoff.update(state(3,0),view(1,0,0)),null);
 assert.equal(handoff.update(state(4,1),view(1)),null);
 assert.equal(handoff.update(state(5,0),view(0)).viewer,0,'ordinary hotseat privacy resumes');
});
test('entering player control clears an already pending ordinary handoff',()=>{
 const handoff=createHandHandoff();handoff.update(state(1,0),view(0));
 const pending=handoff.update(state(2,1),view(1));assert.ok(pending);
 assert.equal(handoff.update(state(2,1),view(0,1,1)),null);
 assert.equal(handoff.acknowledge(pending.key),false);
});
test('acknowledging the handoff survives redraw, layout and same-turn draw changes',()=>{
 const handoff=createHandHandoff();handoff.update(state(2,1),view(0,1));
 const pending=handoff.update(state(3,0,{phase:'draw'}),view(1,0));
 assert.equal(handoff.acknowledge('old-key'),false);assert.equal(handoff.acknowledge(pending.key),true);
 for(let i=0;i<5;i++)assert.equal(handoff.update(state(3,0),view(1,0)),null);
});
test('ordinary hotseat still requires handoff when a different human takes over',()=>{
 const handoff=createHandHandoff();handoff.update(state(1,0),view(0));
 const pending=handoff.update(state(2,1),view(1));assert.equal(pending.viewer,1);
 assert.equal(handoff.update(state(3,0),view(0)).viewer,0);
});
test('end of game, mulligan, nonlocal modes and a scene reset clear pending handoff state',()=>{
 for(const extra of [{winner:1},{phase:'mulligan'},{mode:'ai'},{mode:'online'}]){
  const handoff=createHandHandoff();handoff.update(state(1,0),view(0));handoff.update(state(2,1),view(1));
  assert.equal(handoff.update(state(2,1,extra),view(1)),null);
 }
 const handoff=createHandHandoff();handoff.update(state(1,0),view(0));handoff.update(state(2,1),view(1));handoff.reset();
 assert.equal(handoff.update(state(1,0),view(0)),null);
});
