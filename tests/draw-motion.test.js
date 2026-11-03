import test from 'node:test';
import assert from 'node:assert/strict';
import {drawnHandCards,prepareDrawMotion} from '../src/tabletop-motion.js';

const lookup=id=>({type:id.startsWith('site')?'Site':'Minion'});
const opening=()=>({phase:'draw',players:[{hand:[{uid:'old',card:'spell0'}],atlas:['site1','site2'],spells:['spell1','spell2']},{hand:[],atlas:[],spells:[]}]});
test('draw animation identifies physical cards drawn from each library rather than every new hand card',()=>{
 const before=opening(),after=structuredClone(before);after.phase='main';after.players[0].atlas.pop();after.players[0].spells.pop();after.players[0].hand.push({uid:'site-drawn',card:'site1'},{uid:'spell-drawn',card:'spell1'});
 assert.deepEqual(drawnHandCards(before,after,0,lookup),[{uid:'site-drawn',deck:'atlas'},{uid:'spell-drawn',deck:'spells'}]);
 assert.deepEqual(drawnHandCards(before,after,1,lookup),[],'Never animate another seat’s private hand');
});
test('returning cards, replaying an unchanged state, and initial mulligans do not produce draw flights',()=>{
 const before=opening(),after=structuredClone(before);after.players[0].hand.push({uid:'returned',card:'spell3'});
 assert.deepEqual(drawnHandCards(before,after,0,lookup),[]);
 assert.deepEqual(drawnHandCards(before,before,0,lookup),[]);
 after.players[0].spells.pop();before.phase='mulligan';assert.deepEqual(drawnHandCards(before,after,0,lookup),[]);
 assert.deepEqual(drawnHandCards(null,after,0,lookup),[],'Reconnection cannot replay a historical draw');
});
test('draw motion honors reduced motion, disabled effects, and the visible hand owner before capturing art',()=>{
 const saved={document:globalThis.document,matchMedia:globalThis.matchMedia,localStorage:globalThis.localStorage};
 const before=opening(),after=structuredClone(before);after.players[0].spells.pop();after.players[0].hand.push({uid:'drawn',card:'spell1'});
 try{
  globalThis.document={hidden:false,querySelector:()=>({dataset:{handPlayer:'1'}})};
  globalThis.matchMedia=()=>({matches:false});globalThis.localStorage={getItem:()=>null};
  assert.equal(prepareDrawMotion(before,after,0,lookup),null,'A seat handoff cannot leak the new card');
  globalThis.document.querySelector=()=>{throw Error('No art may be captured');};
  globalThis.matchMedia=()=>({matches:true});assert.equal(prepareDrawMotion(before,after,0,lookup),null);
  globalThis.matchMedia=()=>({matches:false});globalThis.localStorage.getItem=()=> 'false';assert.equal(prepareDrawMotion(before,after,0,lookup),null);
 }finally{for(const [key,value]of Object.entries(saved)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}}
});
