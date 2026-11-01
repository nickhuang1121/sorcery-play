import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {install,card,officialBetaDecks} from '../src/cards.js';
import {newGame,restoreGame,legalActions,dispatch,observation} from '../src/engine.js';
import {finalDecisionController} from '../src/final-control.js';
import {turnControlView,createHandHandoff,needsHandHandoff,mayInspectControlledCards,handVisibleThroughControl,controlledTurn,turnControlStatus} from '../src/turn-control-view.js';
import {playerView} from '../src/net/online-view.js';
install(JSON.parse(fs.readFileSync(new URL('../data/official-cards.json',import.meta.url))));
function scenario(mode='local',firstRound=false){
 let s=newGame(officialBetaDecks().slice(0,2),42,mode);
 Object.assign(s,{turn:5,active:0,phase:'main',pending:null,choice:null,storyline:[],artifacts:[],auras:[]});
 s.board=Array.from({length:20},(_,at)=>({uid:'site'+at,card:card('valley').id,owner:at<10?1:0,controller:at<10?1:0}));
 for(const p of s.players){p.turnsTaken=2;p.hand=[];p.bonusMana=40;p.bonusAffinity={air:10,earth:10,fire:10,water:10};}
 if(firstRound){s.turn=1;s.firstPlayer=0;s.players[0].turnsTaken=1;s.players[1].turnsTaken=0;s.players[0].name='A';s.players[1].name='B';}
 s.players[0].hand.push({uid:'thais',card:card('courtesan_thais').id});s.players[1].hand.push({uid:'opponent-boar',card:card('wild_boars').id});
 s=restoreGame(s);const a=legalActions(s).find(a=>a.type==='cast'&&a.hand==='thais'&&a.at===12);assert.ok(a);return dispatch(s,a);
}
function next(s){s=dispatch(s,{type:'end',player:s.active,actor:finalDecisionController(s,s.active)});if(s.phase==='draw')s=dispatch(s,{type:'draw',player:s.active,actor:finalDecisionController(s,s.active),deck:'spells'});return s;}
test('Thaïs changes hand owner without passing the device to a different human',()=>{
 let s=scenario(),before=turnControlView(s);assert.equal(before.controlled,null,'Genesis schedules the next real turn, not immediate visibility');
 s=next(s);const first=turnControlView(s);
 assert.deepEqual([first.viewer,first.handPlayer,first.controlled],[0,1,1]);assert.equal(needsHandHandoff(before.viewer,first.viewer),false);
 assert.equal(handVisibleThroughControl(before,1),false);assert.equal(handVisibleThroughControl(first,0),true);assert.equal(handVisibleThroughControl(first,1),true);
 assert.ok(observation(s,0).players[1].hand.some(h=>h.uid==='opponent-boar'));
 s=next(s);const second=turnControlView(s);assert.deepEqual([second.viewer,second.handPlayer,second.controlled],[1,0,0]);assert.equal(needsHandHandoff(first.viewer,second.viewer),true);
 s=next(s);const expired=turnControlView(s);assert.equal(expired.controlled,null);assert.equal(needsHandHandoff(second.viewer,expired.viewer),false);
 assert.equal(mayInspectControlledCards(s,0,1),false);
});
test('literal turns 1-4: A casts, A plays and moves B, B plays and moves A, then ordinary control returns',()=>{
 let s=scenario('local',true);
 const handoff=createHandHandoff();assert.equal(handoff.update(s,turnControlView(s)),null);
 s.players[0].hand.push({uid:'a-boar',card:card('wild_boars').id});
 for(const [p,at] of [[0,12],[1,7]])s.units.push({uid:'mobile-'+p,card:card('wild_boars').id,owner:p,controller:p,at,layer:'surface',born:0,tapped:false,damage:0,mods:[]});
 s=restoreGame(s);
 assert.deepEqual([s.turn,s.active,controlledTurn(s).controller,controlledTurn(s).active],[1,0,0,false]);
 assert.equal(turnControlStatus(s).stage,'scheduled');assert.deepEqual(turnControlStatus(s).next,{owner:1,controller:0});
 assert.equal(controlledTurn(s).scheduled.length,2);
 s=next(s);assert.deepEqual([s.turn,s.active,controlledTurn(s).controller],[2,1,0]);
 for(const [owner,controller,hand,at,moveTo] of [[1,0,'opponent-boar',3,6],[0,1,'a-boar',18,13]]){
  const status=turnControlStatus(s);assert.equal(status.stage,'active');assert.equal(status.controller,controller);assert.equal(status.owner,owner);assert.equal(status.operator,controller);
  assert.deepEqual(status.next,owner===1?{owner:0,controller:1}:null);
  assert.equal(handoff.update(s,turnControlView(s)),null,'both controlled hands appear without acknowledgment');
  assert.equal(controlledTurn(s).owner,owner);assert.equal(controlledTurn(s).controller,controller);
  const view=playerView(s,controller);assert.deepEqual(view.state.players[owner].hand,s.players[owner].hand);
  const otherSpent=s.players[controller].spent;
  const cast=legalActions(s).find(a=>a.type==='cast'&&a.hand===hand&&a.at===at);assert.ok(cast);
  assert.throws(()=>dispatch(s,{...cast,actor:owner}),/操控者/);
  s=dispatch(s,{...cast,actor:controller});assert.ok(!s.players[owner].hand.some(h=>h.uid===hand));
  assert.equal(s.players[controller].spent,otherSpent);assert.ok(s.units.some(u=>u.at===at&&u.owner===owner&&card(u.card).slug==='wild_boars'));
  const move=legalActions(s).find(a=>a.type==='move'&&a.unit==='mobile-'+owner&&a.at===moveTo);assert.ok(move);
  s=dispatch(s,{...move,actor:controller});assert.equal(s.units.find(u=>u.uid==='mobile-'+owner).at,moveTo);
  s=next(s);
 }
 assert.deepEqual([s.turn,s.active,controlledTurn(s).controller,controlledTurn(s).active],[4,1,1,false]);
 assert.equal(handoff.update(s,turnControlView(s)),null,'the end of control leaves no handoff overlay');
 assert.equal(controlledTurn(s).scheduled.length,0);
 assert.equal(turnControlStatus(s).stage,'complete');assert.equal(turnControlStatus(s).controller,1);
 assert.equal(mayInspectControlledCards(s,0,1),false);assert.equal(mayInspectControlledCards(s,1,0),false);
 assert.ok(playerView(s,0).state.players[1].hand.every(h=>h.hidden));assert.ok(playerView(s,1).state.players[0].hand.every(h=>h.hidden));
 s=next(s);assert.equal(turnControlStatus(s),null,'completion notice only belongs to the first normal turn');
});
test('control identity follows a defending player decision without claiming ownership of that response',()=>{
 const s=next(scenario());s.pending={player:0,kind:'attack'};
 const status=turnControlStatus(s);
 assert.deepEqual([status.owner,status.controller,status.actor,status.operator,status.responding],[1,0,0,0,true]);
 assert.equal(turnControlStatus({...s,winner:0}),null);
});
test('AI mode shows controlled cards to the human, then restores the ordinary hidden hand boundary',()=>{
 let s=next(scenario('ai'));assert.equal(turnControlView(s).handPlayer,1);assert.equal(mayInspectControlledCards(s,0,1),true);
 s=next(s);assert.equal(turnControlView(s).handPlayer,0);assert.equal(turnControlView(s).controlledBy,1);
 assert.equal(mayInspectControlledCards(s,0,1),false);assert.ok(observation(s,0).players[1].hand.every(h=>h.hidden));
});
test('online rendering uses the authorized observed hand and revokes all-card inspection after the controlled turn',()=>{
 let s=next(scenario('online'));const view=playerView(s,0),perspective=turnControlView(view.state,0);
 assert.equal(perspective.handPlayer,1);assert.equal(perspective.controlled,1);assert.deepEqual(view.state.players[1].hand,s.players[1].hand);
 for(const zone of ['atlas','spells','collection'])assert.deepEqual(view.state.players[1][zone],s.players[1][zone]);
 s=next(s);const after=playerView(s,0);assert.equal(turnControlView(after.state,0).controlled,null);assert.ok(after.state.players[1].hand.every(h=>h.hidden));
 assert.equal(handVisibleThroughControl(turnControlView(after.state,0),1),false);
});
