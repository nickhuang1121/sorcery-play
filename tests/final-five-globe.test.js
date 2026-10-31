import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
import {install,card,starter} from '../src/cards.js';
import {newGame,restoreGame,legalActions,dispatch,unit as liveUnit,resources,keywords} from '../src/engine.js';
import {passives} from '../src/definitions.js';
import {geometryOccupied} from '../src/final-geometry.js';
import {effectChoiceHTML} from '../src/effect-choice-ui.js';
install(JSON.parse(fs.readFileSync(new URL('../data/official-cards.json',import.meta.url))));
// Explicit prototype registration: this is NOT evidence of production availability.

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


function castAt(s,slug,at){const h={uid:'h'+s.next++,card:card(slug).id};s.players[0].hand.push(h);s=restoreGame(s);const a=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid&&(a.at===at));assert.ok(a,'native '+slug+' cast at '+at+' actions '+JSON.stringify(legalActions(s).filter(a=>a.type==='cast'&&a.hand===h.uid)));return dispatch(s,a);}
test('Globe production definition opens actual hand cast and wrapped adjacency without prototype',()=>{
 let s=engineState();s=castAt(s,'magellan_globe',10);const u=addEngineUnit(s,'wild_boars',0);s=restoreGame(s);assert.ok(legalActions(s).some(a=>a.type==='move'&&a.unit===u.uid&&a.at===4));
});
test('Globe removal preserves real Silence covered cells after JSON, with actual keyword effects only there',()=>{
 passives.magellan_globe={geometryWrap:true};install(JSON.parse(fs.readFileSync(new URL('../data/official-cards.json',import.meta.url))));let s=engineState();s.units.find(u=>u.controller===0).at=11;s=castAt(s,'magellan_globe',10);
 const insideUnits=[0,4,5,9].map(at=>addEngineUnit(s,'belmotte_longbowmen',at,1)),outside=addEngineUnit(s,'belmotte_longbowmen',8,1);
 s=castAt(s,'silence',4);assert.equal(s.auras.length,1);for(const u of insideUnits)assert.ok(!keywords(liveUnit(s,u.uid),s).includes('Ranged'));assert.ok(keywords(liveUnit(s,outside.uid),s).includes('Ranged'));
 s=beginAlkahest(s,10);s=restoreGame(JSON.parse(JSON.stringify(s)));
 assert.equal(s.auras[0].at,4);for(const u of insideUnits)assert.ok(!keywords(liveUnit(s,u.uid),s).includes('Ranged'),'retained original covered cell '+u.at);assert.ok(keywords(liveUnit(s,outside.uid),s).includes('Ranged'),'outside never affected');
});
test('Project ruling: Doomsday same physical site from two 4 projections is 4, with no arbitrary differing-value policy',()=>{
 passives.magellan_globe={geometryWrap:true};install(JSON.parse(fs.readFileSync(new URL('../data/official-cards.json',import.meta.url))));let s=engineState();s=castAt(s,'magellan_globe',10);s=castAt(s,'doomsday_device',12);const d=s.artifacts.find(o=>card(o.card).slug==='doomsday_device');d.finalDoomCounters=1;
 const enemy=s.units.find(u=>u.controller===1),own=s.units.find(u=>u.controller===0);enemy.at=2;own.at=13;const life=s.players.map(p=>p.life);
 s=restoreGame(JSON.parse(JSON.stringify(s)));s=dispatch(s,{type:'end',player:0});
 assert.equal(life[1]-s.players[1].life,4);assert.equal(life[0]-s.players[0].life,8);
});

test('Project retained Abundance: exact native resources for both owners survive JSON and Globe re-entry',()=>{
 let s=engineState();s.units.find(u=>u.controller===0).at=11;s=castAt(s,'magellan_globe',10);
 for(const at of [0,4])s.board[at].controller=0;for(const at of [5,9])s.board[at].controller=1;
 const baseline=[resources(s,0).mana,resources(s,1).mana];s=castAt(s,'abundance',4);
 assert.equal(resources(s,0).mana-baseline[0],2);assert.equal(resources(s,1).mana-baseline[1],2);
 s=beginAlkahest(s,10);s=restoreGame(JSON.parse(JSON.stringify(s)));
 const aura=s.auras.find(a=>card(a.card).slug==='abundance');assert.deepEqual([...aura.geometryRetainedCells].sort((a,b)=>a-b),[0,4,5,9]);assert.equal(aura.at,4);
 assert.equal(resources(s,0).mana-baseline[0],2);assert.equal(resources(s,1).mana-baseline[1],2);
 const before=resources(s,0).mana;s.board[8].controller=0;s=restoreGame(s);assert.equal(resources(s,0).mana-before,1,'uncovered changed owner adds site mana only, not Aura mana');
 s=castAt(s,'magellan_globe',10);s=restoreGame(JSON.parse(JSON.stringify(s)));const retained=s.auras.find(a=>a.uid===aura.uid);assert.deepEqual([...retained.geometryRetainedCells].sort((a,b)=>a-b),[0,4,5,9]);assert.equal(retained.at,4);
 assert.equal(resources(s,0).mana-baseline[0],3);assert.equal(resources(s,1).mana-baseline[1],1);
 s=beginAlkahest(s,10);s=restoreGame(JSON.parse(JSON.stringify(s)));assert.deepEqual(s.auras.find(a=>a.uid===aura.uid).geometryRetainedCells,retained.geometryRetainedCells);assert.equal(resources(s,0).mana-baseline[0],3);
});

import {createMemoryBus} from '../src/net/memory-transport.js';
import {createMatchSync,checksumState} from '../src/net/match-sync.js';
import {dispatchFinalControlledEntry} from '../src/final-control.js';
import {choiceAction} from '../src/choice-context.js';
import {inside} from '../src/objects.js';
import {PROJECT_RULE_PROFILE} from '../src/project-rules.js';
test('Globe memorybus two-peer Alkahest target-choice actionlog replay from JSON preserves profile and exact Aura effects (no Firebase)',async()=>{
 let initial=engineState();initial.units.find(u=>u.controller===0).at=11;initial=castAt(initial,'magellan_globe',10);
 const covered=addEngineUnit(initial,'belmotte_longbowmen',0,1),outside=addEngineUnit(initial,'belmotte_longbowmen',8,1);initial=castAt(initial,'silence',4);
 const h={uid:'h'+initial.next++,card:card('apply_alkahest').id};initial.players[0].hand.push(h);initial=restoreGame(JSON.parse(JSON.stringify(initial)));
 const action=legalActions(initial).find(a=>a.type==='cast'&&a.hand===h.uid);assert.ok(action);
 const bus=createMemoryBus();function peer(seat){const sync=createMatchSync({transport:bus.transport('globe'+seat),roomId:'GLOBE',seat,playerId:'p'+seat}),p={sync,state:restoreGame(JSON.parse(JSON.stringify(initial))),errors:[],seen:[]};sync.on('action',entry=>{p.seen.push(entry.seq);try{p.state=dispatchFinalControlledEntry(p.state,entry,dispatch);}catch(e){p.errors.push(e.message);}});sync.start();return p;}
 async function drain(...ps){for(let i=0;i<3;i++)await Promise.all(ps.map(p=>p.sync.flush()));}
 const a=peer(0);await a.sync.publish(action);await drain(a);assert.ok(a.state.choice);const pick=a.state.choice.options.findIndex(o=>o.value.at===10);assert.ok(pick>=0);await a.sync.publish(choiceAction(a.state,pick));await drain(a);
 // Late second peer starts from JSON baseline, replays both actual logged actions.
 const b=peer(1);await drain(a,b);
 for(const p of[a,b]){assert.deepEqual(p.errors,[]);assert.deepEqual(p.seen,[1,2]);const aura=p.state.auras.find(o=>card(o.card).slug==='silence');assert.deepEqual(aura.geometryRetainedCells,[4,0,9,5]);for(let at=0;at<20;at++)assert.equal(inside(aura,at),[4,0,9,5].includes(at));assert.ok(!keywords(liveUnit(p.state,covered.uid),p.state).includes('Ranged'));assert.ok(keywords(liveUnit(p.state,outside.uid),p.state).includes('Ranged'));assert.equal(p.state.projectRuleProfile,PROJECT_RULE_PROFILE);p.sync.close();}
 assert.equal(checksumState(a.state),checksumState(b.state));
});
