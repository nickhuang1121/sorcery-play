import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareCombat} from '../src/tabletop-motion.js';

test('a lethal committed strike keeps a visual copy of the attacker removed by resolution',()=>{
 const saved={document:globalThis.document,matchMedia:globalThis.matchMedia,CSS:globalThis.CSS};
 const animations=[],added=[];
 const ghost={style:{},removeAttribute(){},setAttribute(){},animate(frames,options){animations.push({frames,options});return {finished:Promise.resolve()};},remove(){this.removed=true;}};
 const from={getBoundingClientRect:()=>({left:10,top:10,width:40,height:60}),cloneNode:()=>ghost},to={getBoundingClientRect:()=>({left:100,top:100,width:40,height:60})};
 globalThis.document={querySelector:s=>s.includes('data-unit')?from:to,body:{append:n=>added.push(n)},hidden:false};globalThis.matchMedia=()=>({matches:false});globalThis.CSS={escape:s=>s};
 try{
  const before={pending:{kind:'attack',attacker:'bear',target:'enemy'},units:[{uid:'bear',at:1},{uid:'enemy',at:6}]};
  const play=prepareCombat(before,{type:'pass'});assert.equal(added.length,0,'capturing never plays before dispatch');
  play({pending:null,units:[]});assert.equal(added.length,1);assert.equal(animations.length,1);assert.match(animations[0].frames[1].transform,/scale\(1.5\)/);assert.match(animations[0].frames[2].transform,/90px,90px/);
  const count=added.length;play({pending:before.pending});assert.equal(added.length,count,'waiting for defense must not impact');
  assert.equal(prepareCombat(before,{type:'defend'}),null,'adding a defender must not impact');
 }finally{Object.assign(globalThis,saved);}
});

test('opening hand focus uses stable layout geometry and centers only the carousel',async()=>{
 const {bindOpeningHand}=await import('../src/tabletop-motion.js');
 const saved={matchMedia:globalThis.matchMedia,requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame};
 const handlers={},scrolls=[];
 const cards=[100,300,500].map((left,index)=>({offsetLeft:left,offsetWidth:100,selected:false,classList:{toggle(name,on){cards[index].selected=on;}},querySelectorAll:()=>[],events:{},addEventListener(name,fn){this.events[name]=fn;},focus(options){this.focusOptions=options;},getBoundingClientRect(){throw Error('animated bounds must not determine scroll focus');}}));
 const track={children:cards,scrollLeft:0,clientWidth:300,addEventListener(name,fn){handlers[name]=fn;},scrollTo(options){scrolls.push(options);}};
 globalThis.matchMedia=()=>({matches:true});globalThis.requestAnimationFrame=fn=>{fn();return 1;};globalThis.cancelAnimationFrame=()=>{};
 try{
  bindOpeningHand({querySelector:()=>track});assert.deepEqual(cards.map(c=>c.selected),[true,false,false]);
  track.scrollLeft=200;handlers.scroll();assert.deepEqual(cards.map(c=>c.selected),[false,true,false]);
  cards[1].events.click();assert.deepEqual(scrolls.at(-1),{left:200,behavior:'auto'});
  let prevented=false;cards[1].events.keydown({key:'ArrowRight',preventDefault(){prevented=true;}});
  assert.ok(prevented);assert.deepEqual(cards[2].focusOptions,{preventScroll:true});assert.equal(scrolls.at(-1).left,400);
 }finally{Object.assign(globalThis,saved);}
});
