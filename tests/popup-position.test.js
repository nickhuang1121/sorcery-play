import test from 'node:test';
import assert from 'node:assert/strict';
import {fitPopupPosition,restorePopupPosition} from '../src/popup-position.js';
test('position survives reopening at the same screen location with a different panel height',()=>{
 const viewport={width:1280,height:720},saved={x:500/1280,y:180/720};
 assert.deepEqual(restorePopupPosition(saved,{width:420,height:140},viewport),{x:500,y:180});
 assert.deepEqual(restorePopupPosition(saved,{width:420,height:300},viewport),{x:500,y:180});
});
test('desktop positions remain reachable after rotating or switching to a small screen',()=>{
 assert.deepEqual(restorePopupPosition({x:.8,y:.8},{width:370,height:220},{width:390,height:844}),{x:12,y:616});
 assert.deepEqual(fitPopupPosition({x:-100,y:1000},{width:370,height:220},{width:390,height:844}),{x:8,y:616});
 assert.deepEqual(fitPopupPosition({x:1000,y:1000},{width:1000,height:1000},{width:390,height:844}),{x:8,y:8});
});
test('corrupt or stale saved position falls back to the stylesheet default',()=>{
 for(const saved of [null,{},[],{x:'1',y:0},{x:NaN,y:0},{x:-1,y:0},{x:2,y:0}])assert.equal(restorePopupPosition(saved,{width:420,height:140},{width:1280,height:720}),null);
});
