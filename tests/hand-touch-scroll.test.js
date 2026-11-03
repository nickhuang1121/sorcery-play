import test from 'node:test';
import assert from 'node:assert/strict';
import {installHandTouchScroll} from '../src/hand-touch-scroll.js';

function fixture(){
 const handlers={},frames=new Map();let time=0,next=0,starts=0;
 const track={scrollWidth:1000,clientWidth:300,scrollLeft:100,isConnected:true,contains:target=>target===targetNode};
 const targetNode={closest:()=>track};
 const root={addEventListener:(name,fn)=>handlers[name]=fn,removeEventListener:name=>delete handlers[name]};
 const dispose=installHandTouchScroll(root,{now:()=>time,requestFrame:fn=>{frames.set(++next,fn);return next;},cancelFrame:id=>frames.delete(id),onScrollStart:()=>starts++});
 function emit(name,x=200,y=100,extra={}){
  time+=20;const event={target:targetNode,touches:name==='touchend'?[]:[{identifier:1,clientX:x,clientY:y}],cancelable:true,prevented:false,stopped:false,preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;},...extra};
  handlers[name](event);return event;
 }
 return {track,handlers,frames,emit,dispose,get starts(){return starts;},advance(ms){time+=ms;}};
}
test('touch movement directly scrolls overflowing hands in both directions and cancels native panning',()=>{
 const f=fixture();f.emit('touchstart');assert.equal(f.emit('touchmove',196,99).prevented,false);
 assert.equal(f.emit('touchmove',140,102).prevented,true);assert.equal(f.track.scrollLeft,160);
 f.emit('touchmove',240,101);assert.equal(f.track.scrollLeft,60);assert.equal(f.starts,1);
 f.emit('touchend');assert.ok(f.emit('click').stopped,'A swipe cannot inspect or play a card');
});
test('vertical play gestures, taps, and multi-touch are not stolen by horizontal browsing',()=>{
 for(const dy of [-35,35]){const f=fixture();f.emit('touchstart');assert.equal(f.emit('touchmove',202,100+dy).prevented,false);assert.equal(f.track.scrollLeft,100);assert.equal(f.starts,0);}
 const tap=fixture();tap.emit('touchstart');tap.emit('touchend');assert.equal(tap.emit('click').stopped,false);
 const multi=fixture();multi.emit('touchstart');multi.emit('touchmove',150,100,{touches:[{identifier:1,clientX:150,clientY:100},{identifier:2,clientX:160,clientY:100}]});assert.equal(multi.track.scrollLeft,100);
});
test('hands that fit cannot be dragged horizontally and scroll targets stop at their boundaries',()=>{
 const fit=fixture();fit.track.scrollWidth=300;fit.emit('touchstart');assert.equal(fit.emit('touchmove',100).prevented,false);assert.equal(fit.starts,0);
 const f=fixture();f.emit('touchstart');f.emit('touchmove',-1000);assert.equal(f.track.scrollLeft,700);f.emit('touchmove',2000);assert.equal(f.track.scrollLeft,0);
});
test('a new intentional tap stops momentum and is not suppressed by a preceding swipe',()=>{
 const f=fixture();f.emit('touchstart');f.emit('touchmove',120);f.emit('touchend');assert.ok(f.frames.size);
 f.emit('touchstart');assert.equal(f.frames.size,0);f.emit('touchend');assert.equal(f.emit('click').stopped,false);
});
test('momentum stops if a render removes the track, and disposal removes all listeners',()=>{
 const f=fixture();f.emit('touchstart');f.emit('touchmove',120);f.emit('touchend');const frame=[...f.frames.values()][0],left=f.track.scrollLeft;
 f.track.isConnected=false;f.advance(16);frame();assert.equal(f.track.scrollLeft,left);f.dispose();assert.equal(Object.keys(f.handlers).length,0);
});
