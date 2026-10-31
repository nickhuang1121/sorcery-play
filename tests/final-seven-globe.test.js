import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
import {install,card,starter} from '../src/cards.js';
import {newGame,restoreGame,legalActions,dispatch,unit as liveUnit} from '../src/engine.js';
import {passives} from '../src/definitions.js';
import {geometryOccupied} from '../src/final-geometry.js';
import {effectChoiceHTML} from '../src/effect-choice-ui.js';
install(JSON.parse(fs.readFileSync(new URL('../data/official-cards.json',import.meta.url))));
// Explicit prototype registration: this is NOT evidence of production availability.
passives.magellan_globe={geometryWrap:true};
function engineState(){
 const s=newGame([starter(),starter()],42,'local');s.phase='main';s.active=0;s.turn=4;s.artifacts=[];s.auras=[];s.storyline=[];
 s.board=Array.from({length:20},(_,at)=>({uid:'s'+s.next++,card:card('valley').id,owner:at<10?1:0,controller:at<10?1:0}));
 for(const u of s.units){u.born=0;u.at=u.controller===0?17:2;}
 for(const p of s.players){p.hand=[];p.bonusMana=30;p.bonusAffinity={air:10,earth:10,fire:10,water:10};}
 return s;
}
function addEngineUnit(s,slug,at=12,p=0,extra={}){
 const u={uid:'u'+s.next++,card:card(slug).id,at,owner:p,controller:p,born:0,damage:0,tapped:false,mods:[],...extra};s.units.push(u);return u;
}
function addGlobe(s,at=10){const a={uid:'globe'+s.next++,card:card('magellan_globe').id,at,owner:0,controller:0,bearer:null};s.artifacts.push(a);return a;}
function beginAlkahest(s,at){const h={uid:'h'+s.next++,card:card('apply_alkahest').id};s.players[0].hand.push(h);s=restoreGame(s);const cast=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid);assert.ok(cast);s=dispatch(s,cast);assert.ok(s.choice);const option=s.choice.options.findIndex(o=>o.value.at===at);assert.ok(option>=0);return dispatch(s,{type:'choose',player:0,option});}

test('Globe two-controller falls resume sequentially across JSON and invalid responses preserve transaction',()=>{
 let s=engineState();s.units.find(u=>u.controller===0).at=11;
 const a=addEngineUnit(s,'mountain_giant',4,0,{size:2}),b=addEngineUnit(s,'mountain_giant',4,1,{size:2});addGlobe(s);
 s=beginAlkahest(s,10);assert.equal(s.choice.player,0);assert.equal(s.choice.frame.step.op,'finalReplacementResume');
 assert.ok(s.choice.options.every(o=>o.value!==null));const frozen=JSON.stringify(s);
 for(const option of [-1,999,0.5])assert.throws(()=>dispatch(s,{type:'choose',player:0,option}));
 assert.throws(()=>dispatch(s,{type:'choose',player:1,option:0}));assert.equal(JSON.stringify(s),frozen);
 s=restoreGame(JSON.parse(frozen));s=dispatch(s,{type:'choose',player:0,option:s.choice.options.findIndex(o=>o.value.at===3)});
 assert.equal(s.choice?.player,1);assert.equal(liveUnit(s,a.uid).at,3);
 const html=effectChoiceHTML(s.choice);assert.ok(html.includes('data-effect-choice="0"'));assert.ok(html.includes('Magellan Globe'));
 s=restoreGame(JSON.parse(JSON.stringify(s)));const target=s.choice.options[0].value.at;s=dispatch(s,{type:'choose',player:1,option:0});
 assert.equal(liveUnit(s,a.uid).at,3);assert.equal(liveUnit(s,b.uid).at,target);assert.equal(liveUnit(s,b.uid).geometryWrap,false);assert.ok(!s.choice);assert.ok(!s.finalDecisionPending);assert.ok(!s.artifacts.some(o=>card(o.card).slug==='magellan_globe'));
});
test('Globe last-copy semantics: remove one of two leaves wrapped body, last removal asks fall',()=>{
 let s=engineState();s.units.find(u=>u.controller===0).at=11;const a=addEngineUnit(s,'mountain_giant',4,0,{size:2});addGlobe(s,10);addGlobe(s,12);
 s=beginAlkahest(s,10);assert.ok(!s.choice);assert.equal(liveUnit(s,a.uid).at,4);assert.equal(liveUnit(s,a.uid).geometryWrap,true);assert.deepEqual(geometryOccupied(liveUnit(s,a.uid)),[4,0,9,5]);
 s=beginAlkahest(s,12);assert.equal(s.choice.frame.step.op,'finalReplacementResume');assert.equal(s.choice.player,0);
 s=restoreGame(JSON.parse(JSON.stringify(s)));s=dispatch(s,{type:'choose',player:0,option:0});assert.equal(liveUnit(s,a.uid).geometryWrap,false);
});
