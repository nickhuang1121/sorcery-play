import test from 'node:test';
import assert from 'node:assert/strict';
import {handMotion,handScrollAfterRender} from '../src/hand-gestures.js';
test('the first small horizontal touch movements never select or drag a card',()=>{for(const dx of [0,4,8,9,10,11])assert.equal(handMotion(dx,0),'pending');for(const dx of [-12,12,-80,80])assert.equal(handMotion(dx,2),'scroll');});
test('a deliberate upward swipe selects a play gesture; horizontal and downward swipes do not',()=>{assert.equal(handMotion(3,-20),'drag');assert.equal(handMotion(30,-90),'drag');assert.equal(handMotion(80,-20),'scroll');assert.equal(handMotion(0,30),'cancel');});
test('ambiguous diagonal movement waits for intent instead of stealing native scrolling',()=>{for(const d of [12,18,30])assert.equal(handMotion(d,-d),'pending');assert.equal(handMotion(32,-26),'scroll');assert.equal(handMotion(26,-32),'drag');});
test('a hand that fits does not turn a horizontal swipe into an attempted play',()=>{assert.equal(handMotion(40,0,{canScroll:false}),'cancel');assert.equal(handMotion(0,-40,{canScroll:false}),'drag');});
test('the hand remains at its browse position after selection or game updates, clamped when cards leave',()=>{const previous={player:0,left:310};assert.equal(handScrollAfterRender(previous,0,600),310);assert.equal(handScrollAfterRender(previous,0,160),160);assert.equal(handScrollAfterRender({player:0,left:-25},0,600),0);});
test('passing seats or missing saved geometry starts at the beginning of the correct private hand',()=>{assert.equal(handScrollAfterRender({player:0,left:310},1,600),0);assert.equal(handScrollAfterRender(null,0,600),0);assert.equal(handScrollAfterRender({player:0,left:NaN},0,600),0);});
