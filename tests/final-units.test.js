import {criticalStrikeWaiting} from '../src/final-critical-strike.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {install,card,runtimeCard,starter,byId} from '../src/cards.js';
import {resolveFinalUnits,deferFinalUnitEntry,refreshFinalUnits,beforeFinalUnitUntap,prepareFinalUnitCards,finalUnitShortestRoutes,createFinalKairosArchive,returnFinalKairosArchive,restoreFinalArchiveCards,finalArchivePrintedCard} from '../src/final-units.js';
import {animateArtifact,refreshArtifactAnimations,restoreArtifactAnimations,artifactAnimationLeaves,externalArtifactBearer} from '../src/artifact-animation.js';
import {queueEffects} from '../src/storyline.js';
import {appendGrave,takeGrave,graveEntries} from '../src/cemetery.js';
import {occupied,locations} from '../src/geography.js';
import {keywords,disabled,unit,canTarget,newGame,restoreGame,dispatch,legalActions,resources,power,handIsRevealed,unitUmbrellas} from '../src/engine.js';

install(JSON.parse(fs.readFileSync(new URL('../data/official-cards.json',import.meta.url))));
function world(){
  return {turn:4,next:1,units:[],artifacts:[],auras:[],storyline:[],board:Array.from({length:20},(_,at)=>({card:card('valley').id,uid:'s'+at,controller:0})),players:[{banished:[]},{banished:[]}],winner:null,genesis:[]};
}
function add(s,slug,at=12,p=0){const u={uid:'u'+s.next++,card:card(slug).id,at,owner:p,controller:p,damage:0,born:0,tapped:false,mods:[],grantedKeywords:[]};s.units.push(u);return u;}
const A={card,runtimeCard,unit,occupied,locations,keywords,disabled,canTarget,queueEffects,
  unmodifiable:u=>card(u.card).slug==='monks_of_kobalsa',
  blocked:(s,p,u)=>{if(u.ward){u.ward=false;return true;}return false;},
  kill:(s,u)=>{if(u.ward){u.ward=false;return;}u.dying=true;},
  makeUnit:(s,id,p,at)=>add(s,card(id).slug,at,p),
  sendCard:(s,p,id,zone)=>s.players[p][zone].push(id),
  summonedGenesis:(s,u)=>s.genesis.push(u.uid),
};
function run(s,op,u,selected,extra={}){const frame={source:structuredClone(u),controller:u.controller,effectCard:u.card,step:{op,...extra}};if(arguments.length>=4)frame.selected=selected;assert.equal(resolveFinalUnits(s,frame,A),true);}
function choose(s,value){const choice=s.choice;assert.ok(choice);const option=choice.options.find(o=>JSON.stringify(o.value)===JSON.stringify(value));assert.ok(option,'Missing choice '+JSON.stringify(value));s.choice=null;assert.equal(resolveFinalUnits(s,{...choice.frame,selected:option.value},A),true);}

test('Gargoyle asks at a trigger, becomes a real Monument, and drops carried equipment',()=>{
  const s=world(),u=add(s,'monastery_gargoyle');s.artifacts.push({uid:'held',card:card('sword_and_shield').id,owner:0,controller:0,at:12,bearer:u.uid});
  run(s,'finalGargoyleMode',u);assert.equal(s.choice.options.length,2);choose(s,'monument');
  assert.equal(s.units.length,0);const monument=s.artifacts.find(a=>a.uid===u.uid);
  assert.equal(card(monument.card).type,'Artifact');assert.deepEqual(card(monument.card).subtypes,['Monument']);
  assert.equal(s.artifacts.find(a=>a.uid==='held').bearer,null);
  assert.equal(monument.originalCard,card('monastery_gargoyle').id);
});
test('Gargoyle returns from Monument to same unit without summoning/Genesis',()=>{
  const s=world(),u=add(s,'monastery_gargoyle');u.tapped=true;run(s,'finalGargoyleMode',u,'monument');
  const a=s.artifacts[0];run(s,'finalGargoyleMode',a,'airborne');
  const returned=unit(s,u.uid);assert.equal(returned.card,card('monastery_gargoyle').id);assert.equal(returned.tapped,true);assert.equal(s.artifacts.length,0);
  refreshFinalUnits(s,A);assert.ok(returned.grantedKeywords.includes('Airborne'));assert.deepEqual(s.genesis,[]);
});
test('Gargoyle loses its choice and granted Airborne while silenced',()=>{
  const s=world(),u=add(s,'monastery_gargoyle');u.finalGargoyleAirborne=true;u.silenced=true;
  run(s,'finalGargoyleMode',u);refreshFinalUnits(s,A);assert.equal(s.choice,undefined);assert.deepEqual(u.grantedKeywords,[]);
});
test('Gargoyle Monument runtime identity is deterministic after a new card installation',()=>{
  const first=prepareFinalUnitCards(A);install(JSON.parse(fs.readFileSync(new URL('../data/official-cards.json',import.meta.url))));
  assert.equal(prepareFinalUnitCards(A),first);assert.equal(card(first).type,'Artifact');
});
test('Mimic can decline its as-summoned replacement and continues Genesis exactly once',()=>{
  const s=world(),u=add(s,'mimic');s.artifacts.push({uid:'artifact',card:card('sword_and_shield').id,owner:1,at:2});
  assert.equal(deferFinalUnitEntry(s,u,A),true);assert.equal(deferFinalUnitEntry(s,u,A),false);
  const frame=s.storyline.pop();resolveFinalUnits(s,frame,A);choose(s,null);assert.deepEqual(s.genesis,[u.uid]);assert.equal(s.artifacts.length,1);
});
test('Mimic replaces an enemy carriable artifact: old card banished, same object, only one Mimic',()=>{
  const s=world(),u=add(s,'mimic'),id=card('sword_and_shield').id;s.artifacts.push({uid:'artifact',card:id,owner:1,at:2,layer:'below',bearer:'other',born:2,tapped:true,mods:[{power:2}]});
  run(s,'finalMimicEntry',u,'artifact',{uid:u.uid});const transformed=unit(s,'artifact');
  assert.equal(transformed.card,card('mimic').id);assert.equal(transformed.originalCard,undefined);assert.equal(transformed.owner,0);assert.equal(transformed.controller,0);assert.equal(transformed.layer,'below');
  assert.equal(s.artifacts.length,0);assert.equal(s.units.length,1);assert.equal(transformed.finalMimicEntryDone,true);assert.deepEqual(s.genesis,[]);assert.deepEqual(s.players[1].banished,[id]);
  assert.equal(transformed.born,2);assert.equal(transformed.tapped,true);assert.deepEqual(transformed.mods,[{power:2}]);
});
test('Mimic excludes Monuments and Automatons and cannot recurse through a transformed Mimic',()=>{
  const s=world(),u=add(s,'mimic');s.artifacts.push({uid:'monument',card:prepareFinalUnitCards(A),owner:0,at:2});
  run(s,'finalMimicEntry',u,undefined,{uid:u.uid});assert.equal(s.choice,undefined);assert.equal(s.artifacts.length,1);assert.deepEqual(s.genesis,[u.uid]);
});
test('Constrictor may stay and choose a minion here, but excludes itself and other regions',()=>{
  const s=world(),u=add(s,'tringh_constrictor'),victim=add(s,'wild_boars',12,1),buried=add(s,'wild_boars',12,1);buried.layer='below';
  run(s,'finalConstrictStep',u);choose(s,null);const next=s.storyline.pop();resolveFinalUnits(s,next,A);
  assert.deepEqual(s.choice.options.map(o=>o.value),[victim.uid]);choose(s,victim.uid);
  assert.equal(victim.carriedBy,u.uid);assert.equal(victim.carryDisabled,true);assert.equal(u.finalConstrictPending,true);
});
test('Constrictor only offers a single legal step, not full movement',()=>{
  const s=world(),u=add(s,'tringh_constrictor');u.mods.push({keyword:'Movement +2'});run(s,'finalConstrictStep',u);
  for(const o of s.choice.options)if(o.value){const d=Math.abs(o.value.at%5-u.at%5)+Math.abs(Math.floor(o.value.at/5)-Math.floor(u.at/5));assert.equal(d,1);}
});
test('Constrictor target Ward protects against constriction and is consumed',()=>{
  const s=world(),u=add(s,'tringh_constrictor'),v=add(s,'wild_boars',12,1);v.ward=true;run(s,'finalConstrictPick',u,v.uid,{uid:u.uid});
  assert.equal(v.ward,false);assert.equal(v.carriedBy,undefined);assert.equal(u.finalConstricting,undefined);
});
test('Constrictor replaces its next untap with killing its captive and stays tapped',()=>{
  const s=world(),u=add(s,'tringh_constrictor'),v=add(s,'wild_boars',12,1);u.tapped=true;run(s,'finalConstrictPick',u,v.uid,{uid:u.uid});
  assert.equal(beforeFinalUnitUntap(s,u,A),true);assert.equal(v.dying,true);assert.equal(u.tapped,true);assert.equal(beforeFinalUnitUntap(s,u,A),false);
});
test('Escaping a constrictor cancels the pending untap replacement',()=>{
  const s=world(),u=add(s,'tringh_constrictor'),v=add(s,'wild_boars',12,1);u.tapped=true;run(s,'finalConstrictPick',u,v.uid,{uid:u.uid});
  v.at=13;delete v.carriedBy;refreshFinalUnits(s,A);assert.equal(beforeFinalUnitUntap(s,u,A),false);assert.equal(v.dying,undefined);assert.equal(v.finalConstrictedBy,undefined);
});

function game(){
  let s=newGame([starter(),starter()],42,'local');s.phase='main';s.active=0;s.turn=4;s.artifacts=[];s.auras=[];s.storyline=[];
  // This fixture jumps past setup to turn four: the two setup Avatars have
  // already entered the realm and must not generate fresh Shark entry events.
  s.units.forEach(u=>{u.at=u.controller===0?17:2;u.born=0;u.justEntered=false;});
  s.board=s.board.map((_,at)=>({uid:'s'+s.next++,card:card('valley').id,owner:at<10?1:0,controller:at<10?1:0}));
  for(const p of s.players){p.hand=[];p.bonusMana=30;p.bonusAffinity={air:10,earth:10,fire:10,water:10};}return restoreGame(s);
}
function pick(s,value){const option=s.choice?.options.findIndex(o=>JSON.stringify(o.value)===JSON.stringify(value));assert.ok(option>=0,'Missing engine choice '+JSON.stringify(value));return dispatch(s,{type:'choose',player:s.choice.player,option});}
function nextMain(s){assert.equal(s.phase,'draw');return dispatch(s,{type:'draw',player:s.active,deck:'spells'});}

test('dispatch: Mimic replaces an existing artifact, banishes its physical card, and keeps exactly one Mimic',()=>{
  let s=game();const h={uid:'mimic-hand',card:card('mimic').id};s.players[0].hand.push(h);
  s.artifacts.push({uid:'old-artifact',card:card('sword_and_shield').id,owner:1,controller:null,bearer:null,at:7,layer:'surface',born:1});
  const action=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid&&a.at===12);assert.ok(action);
  s=dispatch(s,action);assert.equal(s.units.filter(u=>card(u.card).slug==='mimic').length,0);
  s=pick(s,'old-artifact');const mimics=s.units.filter(u=>card(u.card).slug==='mimic');
  assert.equal(mimics.length,1);assert.equal(mimics[0].uid,'old-artifact');assert.equal(mimics[0].at,7);assert.equal(mimics[0].owner,0);
  assert.ok(s.players[1].banished.includes(card('sword_and_shield').id));
  assert.ok(!s.players[0].hand.some(h=>h.uid==='mimic-hand'));assert.ok(legalActions(s).some(a=>a.unit==='old-artifact'&&a.type==='move'));
});
test('dispatch: Deathspeaker Mimic may transform an artifact and the copy is still banished afterward',()=>{
  let s=game();s.units.find(u=>u.controller===0&&card(u.card).type==='Avatar').card=card('deathspeaker').id;s.players[0].cemetery.push(card('mimic').id);
  s.artifacts.push({uid:'deathspeaker-artifact',card:card('sword_and_shield').id,owner:1,at:2,layer:'surface',born:1,bearer:null});s=restoreGame(s);
  const action=legalActions(s).find(a=>a.type==='cast'&&a.deathspeaker&&a.card===card('mimic').id&&a.at===12);assert.ok(action);s=dispatch(s,action);assert.equal(s.choice?.frame.step.op,'finalMimicEntry');
  s=pick(s,'deathspeaker-artifact');assert.equal(s.units.some(u=>card(u.card).slug==='mimic'),false);assert.equal(s.artifacts.some(a=>a.uid==='deathspeaker-artifact'),false);assert.ok(s.players[1].banished.includes(card('sword_and_shield').id));
});
test('dispatch: Gargoyle Monument survives a save reload and gets its next owner start choice',()=>{
  let s=game();const u=add(s,'monastery_gargoyle');u.ward=true;s=restoreGame(s);s=dispatch(s,{type:'end',player:0});assert.ok(s.choice);
  s=pick(s,'monument');assert.equal(s.active,1);assert.equal(s.units.some(v=>v.uid===u.uid),false);assert.equal(s.artifacts.find(v=>v.uid===u.uid).ward,false);
  s=restoreGame(JSON.parse(JSON.stringify(s)));s=nextMain(s);s=dispatch(s,{type:'end',player:1});assert.ok(s.choice);assert.equal(s.choice.player,0);
  s=pick(s,'airborne');assert.ok(keywords(unit(s,u.uid)).includes('Airborne'));assert.equal(s.phase,'draw');
});
test('dispatch: Constrictor disables its captive then replaces its next untap with destruction',()=>{
  let s=game();const u=add(s,'tringh_constrictor'),v=add(s,'wild_boars',12,1);s=restoreGame(s);
  const action=legalActions(s).find(a=>a.type==='activate'&&a.unit===u.uid);assert.ok(action);s=dispatch(s,action);const plan=s.choice.options.find(o=>o.value?.uid===v.uid&&o.value.to.at===12)?.value;assert.ok(plan);s=pick(s,plan);
  assert.equal(disabled(unit(s,v.uid)),true);assert.equal(unit(s,v.uid).carriedBy,u.uid);
  s=dispatch(s,{type:'end',player:0});s=nextMain(s);s=dispatch(s,{type:'end',player:1});
  assert.equal(unit(s,v.uid),undefined);assert.ok(s.players[1].cemetery.includes(v.card));assert.equal(unit(s,u.uid).tapped,true);
});
test('dispatch: Constrictor declares movement and target before tapping, and may cancel without paying',()=>{
  let s=game();const snake=add(s,'tringh_constrictor'),victim=add(s,'wild_boars',13,1);victim.ward=true;s=restoreGame(s);
  const activate=legalActions(s).find(a=>a.type==='activate'&&a.unit===snake.uid);assert.ok(activate);s=dispatch(s,activate);assert.equal(unit(s,snake.uid).tapped,false);s=pick(s,null);assert.equal(unit(s,snake.uid).tapped,false);assert.equal(unit(s,snake.uid).at,12);
  s=dispatch(s,activate);const plan=s.choice.options.find(o=>o.value?.uid===victim.uid&&o.value.to.at===13)?.value;assert.ok(plan);s=pick(s,plan);
  assert.equal(unit(s,snake.uid).tapped,true);assert.equal(unit(s,snake.uid).at,13);assert.equal(unit(s,victim.uid).ward,false);assert.equal(unit(s,victim.uid).carriedBy,undefined);
});
test('dispatch: Constrictor has no activation when no legal target can be declared',()=>{
  let s=game();const snake=add(s,'tringh_constrictor');add(s,'wild_boars',2,1);s=restoreGame(s);assert.equal(legalActions(s).some(a=>a.type==='activate'&&a.unit===snake.uid),false);
});

function jackHand(s){const h={uid:'jack-hand',card:card('jack_the_ripper').id};s.players[0].hand.push(h);return h;}
test('dispatch: Jack can be cast to an enemy Mortal without owning any site; silence prevents its Deathrite',()=>{
  let s=game();s.board.forEach(site=>{site.owner=1;site.controller=1;});const victim=add(s,'sir_mordred',7,1),other=add(s,'wild_boars',12,0);jackHand(s);s=restoreGame(s);
  const action=legalActions(s).find(a=>a.type==='cast'&&a.jackVictim===victim.uid);assert.ok(action);s=dispatch(s,action);
  assert.equal(unit(s,victim.uid),undefined);assert.ok(s.players[1].cemetery.includes(victim.card));assert.ok(unit(s,other.uid));assert.equal(Boolean(s.choice),false);
  const jack=s.units.find(u=>card(u.card).slug==='jack_the_ripper');assert.equal(jack.at,7);assert.equal(jack.stealth,true);assert.equal(s.players[0].spent,3);
});
test('dispatch: Jack silence precedes destruction; Ward prevents destruction and Jack still arrives in Stealth',()=>{
  let s=game();const victim=add(s,'sir_mordred',7,1);victim.ward=true;jackHand(s);s=restoreGame(s);
  const action=legalActions(s).find(a=>a.type==='cast'&&a.jackVictim===victim.uid);assert.ok(action);s=dispatch(s,action);
  const survivor=unit(s,victim.uid);assert.ok(survivor);assert.equal(survivor.silenced,true);assert.equal(survivor.ward,false);
  assert.ok(s.units.some(u=>card(u.card).slug==='jack_the_ripper'&&u.at===7&&u.stealth));
});
test('dispatch: Jack can choose a stealthy Mortal because its card does not target',()=>{
  let s=game();const victim=add(s,'sir_mordred',7,1);victim.stealth=true;jackHand(s);s=restoreGame(s);
  const action=legalActions(s).find(a=>a.type==='cast'&&a.jackVictim===victim.uid);assert.ok(action);s=dispatch(s,action);assert.equal(unit(s,victim.uid),undefined);
});
test('dispatch: Jack still requires mana, threshold and a functioning caster for its special placement',()=>{
  let s=game();add(s,'sir_mordred',7,1);jackHand(s);s.players[0].bonusAffinity={air:0,earth:0,fire:0,water:0};s=restoreGame(s);
  assert.equal(legalActions(s).some(a=>a.jackVictim),false);
  s.players[0].bonusAffinity.air=10;s.players[0].spent=100;assert.equal(legalActions(s).some(a=>a.jackVictim),false);
  s.players[0].spent=0;const caster=s.units.find(u=>u.controller===0);caster.mods.push({disabled:true});s=restoreGame(s);assert.equal(legalActions(s).some(a=>a.jackVictim),false);
});
test('dispatch: ordinary Jack casting does not kill another Mortal at its site',()=>{
  let s=game();const victim=add(s,'sir_mordred',12,0);jackHand(s);s=restoreGame(s);
  const action=legalActions(s).find(a=>a.type==='cast'&&a.hand==='jack-hand'&&a.at===12&&!a.jackVictim);assert.ok(action);s=dispatch(s,action);
  assert.ok(unit(s,victim.uid));assert.equal(unit(s,victim.uid).silenced,false);assert.ok(s.units.some(u=>card(u.card).slug==='jack_the_ripper'&&u.stealth));
});
test('dispatch: Jack special placement preserves spell-origin permissions instead of granting cemetery casting',()=>{
  let s=game();const victim=add(s,'sir_mordred',7,1),caster=s.units.find(u=>u.controller===0);s.players[0].cemetery.push(card('jack_the_ripper').id);s=restoreGame(s);
  assert.equal(legalActions(s).some(a=>a.jackVictim),false);
  s.boundSpells=[{uid:'jack-bound',card:card('jack_the_ripper').id,unit:caster.uid,owner:0}];
  const action=legalActions(s).find(a=>a.bound==='jack-bound'&&a.jackVictim===victim.uid);assert.ok(action);s=dispatch(s,action);
  assert.equal(unit(s,victim.uid),undefined);assert.equal(s.boundSpells.length,0);assert.ok(s.players[0].cemetery.includes(card('jack_the_ripper').id));
});
test('dispatch: Jack cast ability resolves after entry through Silence, but cannot kill while disabled',()=>{
  let s=game();const prey=add(s,'sir_mordred',7,1);jackHand(s);s.auras.push({uid:'jack-silence',card:card('silence').id,owner:1,controller:1,at:7});s=restoreGame(s);
  let action=legalActions(s).find(a=>a.jackVictim===prey.uid);assert.ok(action);s=dispatch(s,action);assert.equal(unit(s,prey.uid),undefined);let jack=s.units.find(u=>card(u.card).slug==='jack_the_ripper');assert.ok(jack);assert.equal(jack.silenced,true);assert.equal(jack.stealth,false);
  s=game();const alive=add(s,'sir_mordred',7,1);jackHand(s);s.ongoingEffects=[{op:'terrainEffect',at:7,minion:true,disabled:true,until:1}];s=restoreGame(s);
  action=legalActions(s).find(a=>a.jackVictim===alive.uid);assert.ok(action);s=dispatch(s,action);assert.ok(unit(s,alive.uid));assert.equal(unit(s,alive.uid).silenced,false);jack=s.units.find(u=>card(u.card).slug==='jack_the_ripper');assert.ok(jack);assert.equal(disabled(jack),true);assert.equal(jack.stealth,false);
});
test('dispatch: Jack cannot silence or kill prey if his destination banishes or kills him before the cast ability',()=>{
  for(const destination of ['void','underground']){
    let s=game();const prey=add(s,'sir_mordred',7,1);jackHand(s);
    if(destination==='void'){s.board[7]=null;prey.mods.push({keyword:'Voidwalk'});}else{prey.layer='below';prey.mods.push({keyword:'Burrowing'});}s=restoreGame(s);
    const action=legalActions(s).find(a=>a.jackVictim===prey.uid);assert.ok(action,destination);s=dispatch(s,action);
    assert.ok(unit(s,prey.uid));assert.equal(unit(s,prey.uid).silenced,false);assert.equal(s.units.some(u=>card(u.card).slug==='jack_the_ripper'),false);
    assert.ok(s.players[0][destination==='void'?'banished':'cemetery'].includes(card('jack_the_ripper').id));
  }
});
test('dispatch: Jack kills King of the Realm after briefly entering under enemy control and returns to the caster',()=>{
  let s=game();const king=add(s,'king_of_the_realm',7,1);jackHand(s);s=restoreGame(s);const action=legalActions(s).find(a=>a.jackVictim===king.uid);assert.ok(action);s=dispatch(s,action);
  assert.equal(unit(s,king.uid),undefined);const jack=s.units.find(u=>card(u.card).slug==='jack_the_ripper');assert.ok(jack);assert.equal(jack.controller,0);assert.equal(jack.stealth,true);
});

test('Crave pathfinder measures legal steps around a void rather than Manhattan distance',()=>{
  const s=world(),u=add(s,'crave_golem');s.board[7]=null;
  const a=finalUnitShortestRoutes(s,u,node=>node.at===2,A),b=finalUnitShortestRoutes(s,u,node=>node.at===19,A);
  assert.equal(a.distance,4);assert.equal(b.distance,3);assert.deepEqual([...new Set(b.routes.map(path=>path[0].at))].sort((a,b)=>a-b),[13,17]);
});
test('dispatch: Crave attacks a friendly minion at opponent start without tapping and allows normal defense before draw',()=>{
  let s=game();const u=add(s,'crave_golem'),victim=add(s,'wild_boars',11,0);u.tapped=true;s.units.find(v=>v.controller===0&&card(v.card).type==='Avatar').at=16;s=restoreGame(s);
  s=dispatch(s,{type:'end',player:0});assert.equal(s.active,1);assert.equal(s.phase,'start');assert.equal(s.pending?.attacker,u.uid);assert.equal(s.pending?.target,victim.uid);assert.equal(s.pending?.player,0);
  assert.equal(unit(s,u.uid).tapped,true);assert.ok(legalActions(s,0).some(a=>a.type==='defend'));assert.equal(legalActions(s,0).some(a=>a.type==='defend'&&a.unit===u.uid),false);
  s=dispatch(s,{type:'pass',player:0});assert.equal(s.pending,null);assert.equal(s.phase,'draw');assert.equal(unit(s,victim.uid),undefined);assert.equal(unit(s,u.uid).damage,2);
});
test('dispatch: Crave start combat permits actual defending movement and resumes the interrupted start phase',()=>{
  let s=game();const u=add(s,'crave_golem'),victim=add(s,'wild_boars',11,0),guard=s.units.find(v=>v.controller===0&&card(v.card).type==='Avatar');guard.at=16;u.tapped=true;s=restoreGame(s);
  s=dispatch(s,{type:'end',player:0});const defend=legalActions(s,0).find(a=>a.type==='defend'&&a.unit===guard.uid&&!a.keep);assert.ok(defend);s=dispatch(s,defend);
  assert.equal(unit(s,guard.uid).at,11);assert.equal(s.phase,'start');assert.ok(s.pending);s=dispatch(s,{type:'pass',player:0});
  assert.equal(s.phase,'draw');assert.equal(s.pending,null);assert.ok(unit(s,victim.uid));assert.equal(s.players[0].life,17);
});
test('dispatch: Crave fallback chooses equally shortest steps toward the reachable closest minion',()=>{
  let s=game();const u=add(s,'crave_golem');u.tapped=true;add(s,'wild_boars',2,1);add(s,'wild_boars',19,1);s.board[7]=null;s=restoreGame(s);
  s=dispatch(s,{type:'end',player:0});assert.equal(s.choice?.frame.step.op,'finalCraveStep');assert.equal(s.choice.player,0);
  assert.deepEqual(s.choice.options.map(o=>o.value.at).sort((a,b)=>a-b),[13,17]);s=pick(s,s.choice.options.find(o=>o.value.at===13).value);
  assert.equal(unit(s,u.uid).at,13);assert.equal(unit(s,u.uid).tapped,true);assert.equal(s.pending,null);assert.equal(s.phase,'draw');
});
test('dispatch: Crave ignores unattackable Airborne and Stealth minions and cannot cross an isolated void',()=>{
  let s=game();const u=add(s,'crave_golem');add(s,'plumed_pegasus',13,1);const hidden=add(s,'wild_boars',11,1);hidden.stealth=true;s=restoreGame(s);
  s=dispatch(s,{type:'end',player:0});assert.equal(unit(s,u.uid).at,12);assert.equal(unit(s,hidden.uid).damage,0);assert.equal(s.phase,'draw');
  s=game();const isolated=add(s,'crave_golem');add(s,'wild_boars',2,1);s.board=s.board.map((site,at)=>[2,12].includes(at)?site:null);s=restoreGame(s);
  s=dispatch(s,{type:'end',player:0});assert.equal(unit(s,isolated.uid).at,12);assert.equal(s.phase,'draw');
});
test('dispatch: Crave random attack uses replay-aware RNG and lets Black Cat choose the random victim',()=>{
  let s=game();const u=add(s,'crave_golem'),friendly=add(s,'wild_boars',11,0),enemy=add(s,'wild_boars',13,1);add(s,'black_cat',2,1);s=restoreGame(s);
  s=dispatch(s,{type:'end',player:0});assert.equal(s.choice?.frame.step.op,'luckyResume');assert.equal(s.choice.player,1);
  const index=s.choice.options.findIndex(o=>String(o.label).includes('@ 13'));assert.ok(index>=0);s=dispatch(s,{type:'choose',player:1,option:index});
  if(s.pending)s=dispatch(s,{type:'pass',player:s.pending.player});
  assert.equal(unit(s,u.uid).at,13);assert.ok(unit(s,friendly.uid));assert.equal(unit(s,enemy.uid),undefined);
});

function britomartAttack(s){
  const u=add(s,'dame_britomart');s=restoreGame(s);const a=legalActions(s).find(a=>a.type==='attack'&&a.unit===u.uid&&a.target==='site:7');assert.ok(a);s=dispatch(s,a);
  if(s.pending)s=dispatch(s,{type:'pass',player:s.pending.player});return {s,uid:u.uid};
}
test('dispatch: Dame replaces an undefended site attack with a grave Mortal, resolves Genesis, and provides Lance',()=>{
  let s=game();s.players[0].cemetery.push(card('land_surveyor').id);const beforeLife=s.players[1].life,beforeHand=s.players[0].hand.length;
  const attacked=britomartAttack(s);s=attacked.s;assert.equal(s.choice?.frame.step.op,'finalBritomart');const g=s.choice.options.find(o=>o.value?.card===card('land_surveyor').id)?.value;assert.ok(g);s=pick(s,g);
  assert.equal(s.players[1].life,beforeLife);assert.ok(s.units.some(u=>u.card===card('land_surveyor').id&&u.at===7&&u.controller===0));assert.equal(s.players[0].hand.length,beforeHand+1);
  assert.ok(s.artifacts.some(a=>a.bearer===attacked.uid&&card(a.card).slug==='lance'));assert.ok(!s.players[0].cemetery.includes(card('land_surveyor').id));
});
test('dispatch: Dame can decline reanimation and then damages the site exactly once',()=>{
  let s=game();s.players[0].cemetery.push(card('land_surveyor').id);const before=s.players[1].life;s=britomartAttack(s).s;assert.equal(s.choice?.frame.step.op,'finalBritomart');s=pick(s,null);
  assert.equal(s.players[1].life,before-3);assert.ok(s.players[0].cemetery.includes(card('land_surveyor').id));assert.equal(s.choice,null);
});
test('dispatch: Dame pays cemetery access and summon tax, and offers no unpaid replacement',()=>{
  let s=game();s.players[0].cemetery.push(card('land_surveyor').id);s.board[0].card=card('mock_court').id;s.board[1].card=card('bureau_of_occult_control').id;s=restoreGame(s);
  s=britomartAttack(s).s;if(s.choice?.frame.step.op==='zoneAccessOffer')s=pick(s,true);const g=s.choice.options.find(o=>o.value?.card===card('land_surveyor').id)?.value;assert.ok(g);s=pick(s,g);assert.equal(s.players[0].spent,3);
  s=game();s.players[0].cemetery.push(card('land_surveyor').id);s.board[0].card=card('mock_court').id;s.board[1].card=card('bureau_of_occult_control').id;s=restoreGame(s);s.players[0].spent=resources(s,0).mana-2;
  const life=s.players[1].life;s=britomartAttack(s).s;assert.equal(Boolean(s.choice),false);assert.equal(s.players[1].life,life-3);assert.ok(s.players[0].cemetery.includes(card('land_surveyor').id));
});
test('dispatch: Dame can refuse Bureau access and still attack the site, or pay once with only enough mana for fee and tax',()=>{
  let s=game();s.players[0].cemetery.push(card('land_surveyor').id);s.board[0].card=card('bureau_of_occult_control').id;s=restoreGame(s);s=britomartAttack(s).s;
  assert.equal(s.choice?.frame.step.op,'zoneAccessOffer');s=pick(s,false);assert.equal(s.choice?.frame.step.op,'finalBritomart');assert.equal(s.choice.options.some(o=>o.value?.card),false);s=pick(s,null);assert.equal(s.players[1].life,17);assert.equal(s.players[0].spent,0);assert.ok(s.players[0].cemetery.includes(card('land_surveyor').id));
  s=game();s.players[0].cemetery.push(card('land_surveyor').id);s.board[0].card=card('bureau_of_occult_control').id;s.board[1].card=card('mock_court').id;s=restoreGame(s);manaAvailable(s,3);const spent=s.players[0].spent;s=britomartAttack(s).s;
  assert.equal(s.choice?.frame.step.op,'zoneAccessOffer');s=pick(s,true);const g=s.choice.options.find(o=>o.value?.card===card('land_surveyor').id)?.value;assert.ok(g);s=pick(s,g);assert.equal(s.players[0].spent,spent+3);assert.equal(s.players[1].life,20);
});
test('dispatch: Dame replacement is not offered when a unit defends the site',()=>{
  let s=game();const u=add(s,'dame_britomart');s.players[0].cemetery.push(card('land_surveyor').id);s=restoreGame(s);
  const attack=legalActions(s).find(a=>a.type==='attack'&&a.unit===u.uid&&a.target==='site:7');assert.ok(attack);s=dispatch(s,attack);
  const defend=legalActions(s,1).find(a=>a.type==='defend'&&!a.keep);assert.ok(defend);s=dispatch(s,defend);if(s.pending)s=dispatch(s,{type:'pass',player:1});
  assert.equal(s.choice?.frame.step.op==='finalBritomart',false);assert.ok(s.players[0].cemetery.includes(card('land_surveyor').id));assert.equal(s.units.some(v=>v.card===card('land_surveyor').id),false);
});
test('dispatch: Dame decline resumes site damage without duplicating allied after-attack triggers',()=>{
  let s=game();s.players[0].cemetery.push(card('land_surveyor').id);const ally=add(s,'sir_agravaine',8,0),expected=3+power(ally),life=s.players[1].life;s=restoreGame(s);s=britomartAttack(s).s;
  assert.equal(s.choice?.frame.step.op,'finalBritomart');s=pick(s,null);assert.equal(s.players[1].life,life-expected);
});

function waterGame(){const s=game();for(const site of s.board)site.card=card('deep_sea').id;return restoreGame(s);}
function settleShark(s){let n=0;while(s.choice?.frame.step.op==='finalSharkHunt'){assert.ok(n++<10);s=pick(s,s.choice.options[0].value);}return s;}
test('dispatch: Giant Shark fights a friendly summoned minion without tapping',()=>{
  let s=waterGame();const shark=add(s,'giant_shark',7,0);shark.tapped=true;const h={uid:'fish-food',card:card('wild_boars').id};s.players[0].hand.push(h);s=restoreGame(s);
  const action=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid&&a.at===12);assert.ok(action);s=dispatch(s,action);s=settleShark(s);
  assert.equal(s.units.some(u=>u.card===h.card&&u.controller===0),false);assert.equal(unit(s,shark.uid).at,12);assert.equal(unit(s,shark.uid).tapped,true);assert.equal(unit(s,shark.uid).damage,2);
});
test('dispatch: Giant Shark fights Airborne and Stealth units entering its water body',()=>{
  let s=waterGame();const shark=add(s,'giant_shark',12,1),prey=add(s,'plumed_pegasus',6,0);prey.stealth=true;shark.tapped=true;s=restoreGame(s);
  const move=legalActions(s).find(a=>a.type==='move'&&a.unit===prey.uid&&a.at===7&&!a.layer);assert.ok(move);s=dispatch(s,move);s=settleShark(s);
  assert.equal(unit(s,prey.uid),undefined);assert.equal(unit(s,shark.uid).at,7);assert.equal(unit(s,shark.uid).tapped,true);
});
test('dispatch: Giant Shark does not trigger on vertical movement at one site or another disconnected body',()=>{
  let s=waterGame();const shark=add(s,'giant_shark',12,1),prey=add(s,'drowned',7,0);s=restoreGame(s);const dive=legalActions(s).find(a=>a.type==='move'&&a.unit===prey.uid&&a.at===7&&a.layer==='below');assert.ok(dive);s=dispatch(s,dive);
  assert.equal(unit(s,shark.uid).at,12);assert.equal(unit(s,prey.uid).damage,0);
  s=game();for(const at of [1,6,12])s.board[at].card=card('deep_sea').id;const isolated=add(s,'giant_shark',12,1),other=add(s,'drowned',1,0);s=restoreGame(s);
  const move=legalActions(s).find(a=>a.type==='move'&&a.unit===other.uid&&a.at===6&&!a.layer);assert.ok(move);s=dispatch(s,move);
  assert.equal(unit(s,isolated.uid).at,12);assert.equal(unit(s,other.uid).damage,0);
});
test('dispatch: Giant Shark chooses a shortest route including submergence to fight an underwater arrival',()=>{
  let s=waterGame();const shark=add(s,'giant_shark',12,1),prey=add(s,'drowned',6,0);prey.layer='below';s=restoreGame(s);
  const move=legalActions(s).find(a=>a.type==='move'&&a.unit===prey.uid&&a.at===7&&a.layer==='below');assert.ok(move);s=dispatch(s,move);
  assert.equal(s.choice?.frame.step.op,'finalSharkHunt');assert.equal(s.choice.player,1);for(const o of s.choice.options){assert.equal(o.value.length,2);assert.equal(o.value.at(-1).layer,'below');}
  s=settleShark(s);assert.equal(unit(s,prey.uid),undefined);assert.equal(unit(s,shark.uid).at,7);assert.equal(unit(s,shark.uid).layer,'below');
});
test('dispatch: already-declared Shark movement and fight continue through a Silence aura',()=>{
  let s=waterGame();const shark=add(s,'giant_shark',12,1),h={uid:'shark-silence-food',card:card('wild_boars').id};s.players[0].hand.push(h);s.board[2].controller=0;
  s.auras.push({uid:'silence-path',card:card('silence').id,owner:0,controller:0,at:2});s=restoreGame(s);assert.equal(unit(s,shark.uid).silenced,false);
  const action=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid&&a.at===2);assert.ok(action);s=dispatch(s,action);s=settleShark(s);
  assert.equal(unit(s,shark.uid).at,2);assert.equal(unit(s,shark.uid).silenced,true);assert.equal(s.units.some(u=>u.card===h.card),false);
});

function grantPlunder(slugs){
  let s=game();for(const site of s.board)site.card=card('deep_sea').id;s.players[0].bonusAffinity={};s.players[1].spells=slugs.map(slug=>card(slug).id);
  const source=add(s,'captain_baldassare');s=restoreGame(s);
  s.choice={player:0,title:'已觸發的掠奪',options:[{label:'結算',value:true}],frame:{source:structuredClone(source),controller:0,effectCard:source.card,step:{op:'finalPlunder',player:1,count:slugs.length}}};
  return dispatch(s,{type:'choose',player:0,option:0});
}
test('dispatch: Captain discards three and grants casting before strikes, even if both combatants later die',()=>{
  let s=game();const captain=add(s,'captain_baldassare'),victim=add(s,'sea_raider',7,1);s.players[1].spells=['disintegrate','archangel_gabriel','sword_and_shield','wild_boars'].map(slug=>card(slug).id);s=restoreGame(s);
  const attack=legalActions(s).find(a=>a.type==='attack'&&a.unit===captain.uid&&a.target===victim.uid);assert.ok(attack);s=dispatch(s,attack);
  assert.ok(s.pending);assert.equal(unit(s,captain.uid).damage,0);assert.equal(unit(s,victim.uid).damage,0);assert.equal(s.finalPlunder.length,3);assert.equal(s.players[1].spells.length,1);
  s=dispatch(s,{type:'pass',player:1});assert.equal(unit(s,captain.uid),undefined);assert.equal(unit(s,victim.uid),undefined);assert.equal(s.finalPlunder.length,3);assert.ok(legalActions(s).some(a=>a.plunder));
});
test('dispatch: Captain also plunders on a site attack and does not repeat the discard after defenders pass',()=>{
  let s=game();const captain=add(s,'captain_baldassare');s.players[1].spells=['disintegrate','archangel_gabriel','sword_and_shield','wild_boars'].map(slug=>card(slug).id);s=restoreGame(s);
  const action=legalActions(s).find(a=>a.type==='attack'&&a.unit===captain.uid&&a.target==='site:7');assert.ok(action);s=dispatch(s,action);assert.equal(s.finalPlunder.length,3);assert.equal(s.players[1].life,20);
  if(s.pending)s=dispatch(s,{type:'pass',player:1});assert.equal(s.players[1].spells.length,1);assert.equal(s.finalPlunder.length,3);assert.equal(s.players[1].life,17);
});
test('dispatch: plunder ignores threshold for Magic and Minion, but pays mana and uses an ordinary legal caster',()=>{
  let s=grantPlunder(['disintegrate','archangel_gabriel']);const target=add(s,'brown_bears',12,1);s=restoreGame(s);
  assert.equal(resources(s,0).air,0);const magic=legalActions(s).find(a=>a.type==='cast'&&a.plunder&&a.card===card('disintegrate').id);assert.ok(magic);
  const minion=legalActions(s).find(a=>a.type==='cast'&&a.plunder&&a.card===card('archangel_gabriel').id&&a.at===13);assert.ok(minion);
  const cost=card('archangel_gabriel').cost;s=dispatch(s,minion);assert.equal(s.players[0].spent,cost);
  const summoned=s.units.find(u=>u.card===card('archangel_gabriel').id);assert.ok(summoned);assert.equal(summoned.controller,0);assert.equal(summoned.owner,1);assert.ok(unit(s,target.uid));
});
test('dispatch: cancelling plunder targeting spends no mana or permission; successful casting consumes exactly one original grave visit',()=>{
  let s=grantPlunder(['disintegrate']);const target=add(s,'brown_bears',12,1);s=restoreGame(s);const grant=s.finalPlunder[0],graveUid=grant.graveUid;
  const action=legalActions(s).find(a=>a.type==='cast'&&a.plunder===grant.uid);assert.ok(action);s=dispatch(s,action);assert.equal(s.choice?.frame.step.op,'commitSpell');s=pick(s,null);
  assert.equal(s.players[0].spent,0);assert.equal(s.finalPlunder[0].used,false);assert.ok(graveEntries(s,1).some(g=>g.uid===graveUid));
  const retry=legalActions(s).find(a=>a.type==='cast'&&a.plunder===grant.uid);assert.ok(retry);s=dispatch(s,retry);const choice=s.choice.options.find(o=>o.value?.uid===target.uid);assert.ok(choice);s=pick(s,choice.value);
  assert.equal(unit(s,target.uid),undefined);assert.equal(s.finalPlunder[0].used,true);assert.equal(s.players[0].spent,card('disintegrate').cost);assert.equal(legalActions(s).some(a=>a.plunder===grant.uid),false);
  assert.ok(s.players[1].cemetery.includes(card('disintegrate').id));assert.equal(s.players[0].cemetery.includes(card('disintegrate').id),false);assert.equal(graveEntries(s,1).some(g=>g.uid===graveUid),false);
});
test('dispatch: plunder permission is lost on leaving the cemetery even when the same card returns in the same turn',()=>{
  let s=grantPlunder(['archangel_gabriel']);const grant=s.finalPlunder[0],g=graveEntries(s,1).find(g=>g.uid===grant.graveUid);assert.ok(legalActions(s).some(a=>a.plunder===grant.uid));
  takeGrave(s,1,g.index,g.card,g.uid);appendGrave(s,1,g.card);s=restoreGame(s);
  assert.equal(legalActions(s).some(a=>a.plunder===grant.uid),false);assert.ok(graveEntries(s,1).some(g=>g.card===grant.card&&g.uid!==grant.graveUid));
});
test('dispatch: plunder follows its grave UID across reindexing and respects later Wormelow protection',()=>{
  let s=grantPlunder(['disintegrate','archangel_gabriel']);const grant=s.finalPlunder.find(e=>e.card===card('archangel_gabriel').id),first=graveEntries(s,1)[0];takeGrave(s,1,first.index,first.card,first.uid);s=restoreGame(s);
  const action=legalActions(s).find(a=>a.plunder===grant.uid);assert.ok(action);assert.equal(action.grave,0);assert.equal(action.graveUid,grant.graveUid);
  s.board[0].card=card('wormelow_tump').id;s.board[0].controller=1;s=restoreGame(s);assert.equal(legalActions(s).some(a=>a.plunder===grant.uid),false);
  s.board[0].silenced=true;assert.ok(legalActions(s).some(a=>a.plunder===grant.uid));
});
test('dispatch: plunder permissions survive save/reload but expire when their turn ends',()=>{
  let s=grantPlunder(['archangel_gabriel']);
  // This scenario tests permission expiry across two turns, not losing by an empty draw.
  s.players[1].spells.push(card('zap').id);
  const grant=s.finalPlunder[0];s=restoreGame(JSON.parse(JSON.stringify(s)));assert.ok(legalActions(s).some(a=>a.plunder===grant.uid));
  s=dispatch(s,{type:'end',player:0});s=nextMain(s);assert.equal(s.winner,null);assert.ok(s.players[1].hand.some(h=>h.card===card('zap').id));s=dispatch(s,{type:'end',player:1});s=nextMain(s);assert.equal(s.winner,null);assert.equal(s.active,0);assert.equal(legalActions(s).some(a=>a.plunder===grant.uid),false);
});
test('dispatch: plunder is not free and cannot be forged or used through a disabled caster',()=>{
  let s=grantPlunder(['archangel_gabriel']);const grant=s.finalPlunder[0],action=legalActions(s).find(a=>a.plunder===grant.uid);assert.ok(action);
  assert.throws(()=>dispatch(s,{...action,plunder:'forged-permission'}));assert.equal(s.finalPlunder[0].used,false);
  s.players[0].spent=resources(s,0).mana;assert.equal(legalActions(s).some(a=>a.plunder),false);
  s.players[0].spent=0;s.units.filter(u=>u.controller===0&&card(u.card).type==='Avatar').forEach(u=>u.mods.push({disabled:true}));s=restoreGame(s);assert.equal(legalActions(s).some(a=>a.plunder),false);
});
test('dispatch: plunder pays Bureau access in mana even when spell mana is paid with life',()=>{
  let s=grantPlunder(['archangel_gabriel']);s.board[0].card=card('bureau_of_occult_control').id;s.players[0].bloodManaTurn=s.turn;s=restoreGame(s);
  const before=s.players[0].life,action=legalActions(s).find(a=>a.plunder&&a.at===13);assert.ok(action);s=dispatch(s,action);
  assert.equal(s.players[0].spent,2);assert.equal(s.players[0].life,before-card('archangel_gabriel').cost);assert.equal(s.finalPlunder[0].used,true);
});
test('dispatch: Sea Raider grants plunder after killing during its own attack',()=>{
  let s=game();const raider=add(s,'sea_raider'),victim=add(s,'wild_boars',7,1);s.players[1].spells=[card('archangel_gabriel').id];s=restoreGame(s);
  const attack=legalActions(s).find(a=>a.type==='attack'&&a.unit===raider.uid&&a.target===victim.uid);assert.ok(attack);s=dispatch(s,attack);assert.equal(s.finalPlunder,undefined);if(s.pending)s=dispatch(s,{type:'pass',player:1});
  assert.equal(unit(s,victim.uid),undefined);assert.equal(s.finalPlunder.length,1);assert.equal(s.finalPlunder[0].player,0);assert.ok(legalActions(s).some(a=>a.plunder));
});
test('dispatch: Sea Raider still grants plunder after a simultaneous mutual kill',()=>{
  let s=game();const raider=add(s,'sea_raider'),victim=add(s,'sea_raider',7,1);s.players[1].spells=[card('archangel_gabriel').id];s=restoreGame(s);
  const attack=legalActions(s).find(a=>a.type==='attack'&&a.unit===raider.uid&&a.target===victim.uid);assert.ok(attack);s=dispatch(s,attack);if(s.pending)s=dispatch(s,{type:'pass',player:1});
  assert.equal(unit(s,raider.uid),undefined);assert.equal(unit(s,victim.uid),undefined);assert.equal(s.finalPlunder.length,1);assert.equal(s.finalPlunder[0].player,0);assert.ok(legalActions(s).some(a=>a.plunder));
});
test('dispatch: Sea Raider can plunder a killed defender who replaced the declared attack target',()=>{
  let s=game();const raider=add(s,'sea_raider'),target=add(s,'brown_bears',7,1),defender=add(s,'wild_boars',2,1);s.players[1].spells=[card('archangel_gabriel').id];s=restoreGame(s);
  const attack=legalActions(s).find(a=>a.type==='attack'&&a.unit===raider.uid&&a.target===target.uid);assert.ok(attack);s=dispatch(s,attack);
  const defend=legalActions(s,1).find(a=>a.type==='defend'&&a.unit===defender.uid&&!a.keep);assert.ok(defend);s=dispatch(s,defend);if(s.pending)s=dispatch(s,{type:'pass',player:1});
  assert.ok(unit(s,target.uid));assert.equal(unit(s,defender.uid),undefined);assert.equal(s.finalPlunder.length,1);
});
test('dispatch: Sea Raider does not plunder a kill from a spell fight or while its ability is silenced',()=>{
  let s=game();const raider=add(s,'sea_raider'),victim=add(s,'wild_boars',12,1);s.players[1].spells=[card('archangel_gabriel').id];s=restoreGame(s);
  s.choice={player:0,title:'spell fight',options:[{label:'Fight',value:{entity:'unit',uid:victim.uid}}],frame:{source:structuredClone(raider),controller:0,effectCard:card('duel').id,step:{op:'fightPair'}}};s=dispatch(s,{type:'choose',player:0,option:0});
  assert.equal(unit(s,victim.uid),undefined);assert.equal(s.finalPlunder,undefined);assert.equal(s.players[1].spells.length,1);
  s=game();const muted=add(s,'sea_raider'),other=add(s,'wild_boars',7,1);muted.mods.push({silenced:true});s.players[1].spells=[card('archangel_gabriel').id];s=restoreGame(s);
  const attack=legalActions(s).find(a=>a.type==='attack'&&a.unit===muted.uid&&a.target===other.uid);assert.ok(attack);s=dispatch(s,attack);if(s.pending)s=dispatch(s,{type:'pass',player:1});
  assert.equal(unit(s,other.uid),undefined);assert.equal(s.finalPlunder,undefined);assert.equal(s.players[1].spells.length,1);
});

function costCard(s,slug,uid='cost-spell'){const h={uid,card:card(slug).id};s.players[0].hand.push(h);return h;}
function manaAvailable(s,amount){s.players[0].spent=resources(s,0).mana-amount;}
function openCostCast(s,h,at=12){const action=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid&&a.at===at&&!a.layer);assert.ok(action,'Discounted cast must be legal');return dispatch(s,action);}
function addCost(s,predicate){const value=s.choice?.options.find(o=>o.value?.add&&predicate(o.value,o))?.value;assert.ok(value,'Missing extra cost candidate');return pick(s,value);}
function confirmCosts(s){assert.ok(s.choice?.options.some(o=>o.value?.confirm),'Actual selected costs must be affordable');return pick(s,{confirm:true});}
test('dispatch: Wendigo declares sacrifices before payment and uses only allied minions at its exact summoning location',()=>{
  let s=game();const h=costCard(s,'gnarled_wendigo'),warded=add(s,'wild_boars'),pigs=add(s,'muddy_pigs'),elsewhere=add(s,'wild_boars',13),enemy=add(s,'wild_boars',12,1),buried=add(s,'wild_boars');buried.layer='below';buried.mods.push({keyword:'Burrowing'});warded.ward=true;s.players[0].life=10;s=restoreGame(s);manaAvailable(s,2);const beforeSpent=s.players[0].spent;
  s=openCostCast(s,h);assert.equal(s.choice?.frame.step.op,'finalUnitCostPick');assert.equal(s.choice.options.some(o=>o.value?.confirm),false);
  const keys=s.choice.options.filter(o=>o.value?.add).map(o=>o.value.add);assert.ok(keys.some(k=>k.endsWith(':'+warded.uid)));assert.ok(keys.some(k=>k.endsWith(':'+pigs.uid)));for(const u of [elsewhere,enemy,buried])assert.equal(keys.some(k=>k.endsWith(':'+u.uid)),false);
  s=addCost(s,v=>v.add.endsWith(':'+warded.uid));assert.ok(unit(s,warded.uid));assert.equal(s.players[0].spent,beforeSpent);assert.equal(s.choice.options.some(o=>o.value?.confirm),false);
  s=addCost(s,v=>v.add.endsWith(':'+pigs.uid));assert.ok(unit(s,pigs.uid));assert.equal(unit(s,warded.uid).ward,true);s=confirmCosts(s);
  assert.equal(unit(s,warded.uid),undefined);assert.equal(unit(s,pigs.uid),undefined);assert.ok(unit(s,elsewhere.uid));assert.ok(unit(s,enemy.uid));assert.ok(unit(s,buried.uid));
  assert.equal(s.players[0].spent,beforeSpent+2);assert.equal(s.players[0].life,13);assert.ok(s.players[0].cemetery.includes(pigs.card));assert.ok(s.units.some(u=>u.card===h.card&&u.at===12));
});
test('dispatch: cancelling or removing Wendigo sacrifices changes neither cards nor mana',()=>{
  let s=game();const h=costCard(s,'gnarled_wendigo'),donor=add(s,'wild_boars');s=restoreGame(s);const before=s.players[0].spent;s=openCostCast(s,h);s=addCost(s,v=>v.add.endsWith(':'+donor.uid));
  const remove=s.choice.options.find(o=>o.value?.remove)?.value;assert.ok(remove);s=pick(s,remove);assert.equal(s.choice.frame.step.picks.length,0);s=addCost(s,v=>v.add.endsWith(':'+donor.uid));s=pick(s,null);
  assert.ok(unit(s,donor.uid));assert.ok(s.players[0].hand.some(v=>v.uid===h.uid));assert.equal(s.players[0].spent,before);
});
test('dispatch: stale Wendigo sacrifices are revalidated before any payment or sacrifice',()=>{
  let s=game();const h=costCard(s,'gnarled_wendigo'),donor=add(s,'wild_boars');s=restoreGame(s);s=openCostCast(s,h);s=addCost(s,v=>v.add.endsWith(':'+donor.uid));unit(s,donor.uid).at=13;const before=s.players[0].spent;
  assert.throws(()=>confirmCosts(s),/失效/);assert.equal(s.players[0].spent,before);assert.ok(unit(s,donor.uid));assert.ok(s.players[0].hand.some(v=>v.uid===h.uid));
});
test('dispatch: Wendigo discounts oversized minions occupying its square and clamps excess reductions at zero',()=>{
  let s=game();const h=costCard(s,'gnarled_wendigo'),giant=add(s,'mountain_giant',6);giant.size=2;for(let i=0;i<3;i++)add(s,'wild_boars');s=restoreGame(s);manaAvailable(s,0);const spent=s.players[0].spent;s=openCostCast(s,h);
  while(s.choice.options.some(o=>o.value?.add))s=addCost(s,()=>true);s=confirmCosts(s);assert.equal(s.players[0].spent,spent);assert.ok(s.units.some(u=>u.card===h.card));assert.equal(unit(s,giant.uid),undefined);
});
test('dispatch: Colossus banishes controlled minions, hand cards and corpses without Deathrites, preserving physical owners',()=>{
  let s=game();const h=costCard(s,'i_am_colossus'),stolen=add(s,'muddy_pigs',8,0);stolen.owner=1;const hand={uid:'colossus-donor',card:card('muddy_pigs').id};s.players[0].hand.push(hand);s.players[0].cemetery.push(card('land_surveyor').id);s.players[0].life=10;s=restoreGame(s);manaAvailable(s,7);const spent=s.players[0].spent;s=openCostCast(s,h);
  assert.equal(s.choice.options.some(o=>o.value?.add==='hand:0:'+h.uid),false);s=addCost(s,v=>v.add==='realm:1:'+stolen.uid);s=addCost(s,v=>v.add==='hand:0:'+hand.uid);s=addCost(s,v=>v.add.startsWith('grave:0:'));s=confirmCosts(s);
  assert.equal(unit(s,stolen.uid),undefined);assert.equal(s.players[0].life,10);assert.equal(s.players[0].spent,spent+7);assert.ok(s.players[1].banished.includes(stolen.card));assert.ok(s.players[0].banished.includes(hand.card));assert.ok(s.players[0].banished.includes(card('land_surveyor').id));assert.ok(s.units.some(u=>u.card===h.card&&card(u.card).artifactUnit));
});
test('dispatch: Colossus may select excess donors but never gains mana from reducing its cost below zero',()=>{
  let s=game();const h=costCard(s,'i_am_colossus');for(let i=0;i<11;i++)s.players[0].hand.push({uid:'extra-donor'+i,card:card('wild_boars').id});s=restoreGame(s);manaAvailable(s,0);const spent=s.players[0].spent;s=openCostCast(s,h);
  for(let i=0;i<11;i++)s=addCost(s,v=>v.add.startsWith('hand:0:'));s=confirmCosts(s);
  assert.equal(s.players[0].spent,spent);assert.equal(s.players[0].banished.filter(id=>id===card('wild_boars').id).length,11);assert.ok(s.units.some(u=>u.card===h.card));
});
test('dispatch: Colossus pays one independent Bureau fee for multiple grave donors, and cannot declare an unaffordable cast',()=>{
  let s=game();const h=costCard(s,'i_am_colossus');s.players[0].cemetery.push(card('wild_boars').id,card('land_surveyor').id,card('muddy_pigs').id);s.board[0].card=card('bureau_of_occult_control').id;s=restoreGame(s);manaAvailable(s,9);const spent=s.players[0].spent;s=openCostCast(s,h);
  for(let i=0;i<3;i++)s=addCost(s,v=>v.add.startsWith('grave:0:'));assert.equal(s.players[0].spent,spent);s=confirmCosts(s);assert.equal(s.players[0].spent,spent+9);assert.equal(s.players[0].cemetery.length,0);
  s=game();const impossible=costCard(s,'i_am_colossus');s.players[0].cemetery.push(card('wild_boars').id,card('land_surveyor').id,card('muddy_pigs').id);s.board[0].card=card('bureau_of_occult_control').id;s=restoreGame(s);manaAvailable(s,8);
  assert.equal(legalActions(s).some(a=>a.type==='cast'&&a.hand===impossible.uid),false);
});
test('dispatch: Colossus can decline cemetery access and use only hand donors without a Bureau fee',()=>{
  let s=game();const h=costCard(s,'i_am_colossus');s.players[0].hand.push({uid:'no-grave-donor',card:card('wild_boars').id});s.players[0].cemetery.push(card('land_surveyor').id);s.board[0].card=card('bureau_of_occult_control').id;s=restoreGame(s);manaAvailable(s,9);const spent=s.players[0].spent;s=openCostCast(s,h);
  s=addCost(s,v=>v.add==='hand:0:no-grave-donor');s=confirmCosts(s);assert.equal(s.players[0].spent,spent+9);assert.ok(s.players[0].cemetery.includes(card('land_surveyor').id));
});
test('dispatch: Colossus grave donors follow Mortuary view, and Wormelow blocks protected cemetery donors',()=>{
  let s=game();const h=costCard(s,'i_am_colossus');s.players[0].cemetery.push(card('wild_boars').id);s.players[1].cemetery.push(card('land_surveyor').id);s.board[0].card=card('mismanaged_mortuary').id;s=restoreGame(s);s=openCostCast(s,h);
  assert.equal(s.choice.options.some(o=>o.value?.add?.startsWith('grave:0:')),false);assert.ok(s.choice.options.some(o=>o.value?.add?.startsWith('grave:1:')));s=addCost(s,v=>v.add.startsWith('grave:1:'));s=confirmCosts(s);assert.ok(s.players[1].banished.includes(card('land_surveyor').id));assert.ok(s.players[0].cemetery.includes(card('wild_boars').id));
  s=game();const blocked=costCard(s,'i_am_colossus');s.players[0].cemetery.push(card('land_surveyor').id);s.board[0].card=card('mismanaged_mortuary').id;s.board[1].card=card('wormelow_tump').id;s.board[1].controller=1;s=restoreGame(s);s=openCostCast(s,blocked);assert.equal(s.choice.options.some(o=>o.value?.add?.startsWith('grave:')),false);
});
test('dispatch: Deathspeaker Colossus excludes its own source and preserves its grave UID after other corpses are paid',()=>{
  let s=game();s.units.find(u=>u.controller===0&&card(u.card).type==='Avatar').card=card('deathspeaker').id;s.players[0].cemetery.push(card('wild_boars').id,card('i_am_colossus').id,card('land_surveyor').id);s=restoreGame(s);
  const action=legalActions(s).find(a=>a.deathspeaker&&a.card===card('i_am_colossus').id&&a.at===12);assert.ok(action);s=dispatch(s,action);
  assert.equal(s.choice.options.some(o=>o.value?.add==='grave:0:'+action.graveUid),false);s=addCost(s,v=>v.add.startsWith('grave:0:')&&v.card===card('wild_boars').id);s=addCost(s,v=>v.add.startsWith('grave:0:')&&v.card===card('land_surveyor').id);s=confirmCosts(s);
  assert.equal(s.players[0].cemetery.length,0);assert.ok(s.players[0].banished.includes(card('i_am_colossus').id));assert.equal(s.units.some(u=>u.card===card('i_am_colossus').id),false);
});

function chimeraSetup(){let s=game();const chimera=add(s,'karkemish_chimera'),targets=[add(s,'wild_boars',7,1),add(s,'wild_boars',7,1),add(s,'wild_boars',7,1)];return {s:restoreGame(s),chimera,targets};}
function tripleAttack(s,uid){const action=legalActions(s).find(a=>a.type==='attack'&&a.unit===uid&&a.targets?.length===3);assert.ok(action);return dispatch(s,action);}
test('dispatch: Chimera makes one simultaneous attack, divides six power, and restores a saved allocation',()=>{
  let {s,chimera,targets}=chimeraSetup();s=tripleAttack(s,chimera.uid);assert.deepEqual(new Set(s.pending.targets),new Set(targets.map(u=>u.uid)));assert.equal(s.pending.defenders.length,3);assert.equal(unit(s,chimera.uid).tapped,true);
  s=dispatch(s,{type:'pass',player:1});assert.equal(s.choice?.frame.step.op,'combatAllocate');assert.equal(Math.max(...s.choice.options.map(o=>o.value)),6);s=pick(s,2);
  s=restoreGame(JSON.parse(JSON.stringify(s)));assert.equal(s.choice?.frame.step.op,'combatAllocate');assert.equal(Math.max(...s.choice.options.map(o=>o.value)),4);s=pick(s,2);
  for(const u of [chimera,...targets])assert.equal(unit(s,u.uid),undefined);assert.equal(s.pending,null);assert.equal(s.choice,null);
});
test('dispatch: Chimera does not deal six to every target; zero allocations leave the other targets alive',()=>{
  let {s,chimera,targets}=chimeraSetup();s=tripleAttack(s,chimera.uid);s=dispatch(s,{type:'pass',player:1});s=pick(s,6);s=pick(s,0);
  assert.equal(unit(s,targets[0].uid),undefined);assert.ok(unit(s,targets[1].uid));assert.ok(unit(s,targets[2].uid));assert.equal(unit(s,targets[1].uid).damage,0);assert.equal(unit(s,targets[2].uid).damage,0);assert.equal(unit(s,chimera.uid),undefined);
});
test('dispatch: a Chimera defender protects only the selected target, and attacked units cannot defend another target',()=>{
  let {s,chimera,targets}=chimeraSetup();const guard=add(s,'wild_boars',6,1);s=restoreGame(s);s=tripleAttack(s,chimera.uid);const defenders=legalActions(s,1).filter(a=>a.type==='defend');
  for(const target of targets)assert.equal(defenders.some(a=>a.unit===target.uid),false);
  assert.deepEqual(new Set(defenders.filter(a=>a.unit===guard.uid&&!a.keep).map(a=>a.protect)),new Set(targets.map(u=>u.uid)));
  const defend=defenders.find(a=>a.unit===guard.uid&&a.protect===targets[0].uid&&!a.keep);assert.ok(defend);s=dispatch(s,defend);
  assert.equal(s.pending.defenders.includes(targets[0].uid),false);for(const target of targets.slice(1))assert.ok(s.pending.defenders.includes(target.uid));assert.ok(s.pending.defenders.includes(guard.uid));
  s=dispatch(s,{type:'pass',player:1});s=pick(s,2);s=pick(s,2);assert.ok(unit(s,targets[0].uid));for(const u of [...targets.slice(1),guard])assert.equal(unit(s,u.uid),undefined);
});
test('dispatch: Chimera can still choose an ordinary single-target attack',()=>{
  let {s,chimera,targets}=chimeraSetup();const action=legalActions(s).find(a=>a.type==='attack'&&a.unit===chimera.uid&&a.target===targets[0].uid&&!a.targets);assert.ok(action);s=dispatch(s,action);assert.equal(s.pending.targets,undefined);s=dispatch(s,{type:'pass',player:1});
  assert.equal(unit(s,targets[0].uid),undefined);assert.ok(unit(s,targets[1].uid));assert.ok(unit(s,targets[2].uid));assert.ok(unit(s,chimera.uid));
});
test('dispatch: Chimera groups only legal units at the same location, including an enemy Avatar, and never four targets',()=>{
  let {s,chimera,targets}=chimeraSetup();const fourth=add(s,'wild_boars',7,1),elsewhere=add(s,'wild_boars',8,1);s=restoreGame(s);let actions=legalActions(s).filter(a=>a.unit===chimera.uid&&a.targets);
  assert.ok(actions.some(a=>a.targets.length===2));assert.ok(actions.some(a=>a.targets.length===3));assert.equal(actions.some(a=>a.targets.length>3),false);assert.equal(actions.some(a=>a.targets.includes(elsewhere.uid)&&a.targets.some(uid=>targets.some(t=>t.uid===uid)||uid===fourth.uid)),false);
  const av=s.units.find(u=>u.controller===1&&card(u.card).type==='Avatar');av.at=7;s=restoreGame(s);actions=legalActions(s).filter(a=>a.unit===chimera.uid&&a.targets);assert.ok(actions.some(a=>a.targets.includes(av.uid)));
});
test('dispatch: Wisp escaping a Chimera multi-attack does not cancel combat against the other targets',()=>{
  let s=game();const chimera=add(s,'karkemish_chimera'),wisp=add(s,'wills_o_the_wisp',7,1),targets=[add(s,'wild_boars',7,1),add(s,'wild_boars',7,1)];chimera.mods.push({keyword:'Airborne'});s=restoreGame(s);s=tripleAttack(s,chimera.uid);
  assert.equal(s.choice?.frame.step.op,'reactionWisp');const escape=s.choice.options.find(o=>o.value?.at===8&&o.value.layer==='surface')?.value;assert.ok(escape);s=pick(s,escape);
  assert.ok(s.pending);assert.equal(s.pending.defenders.includes(wisp.uid),false);assert.deepEqual(new Set(s.pending.defenders),new Set(targets.map(u=>u.uid)));s=dispatch(s,{type:'pass',player:1});s=pick(s,3);
  assert.ok(unit(s,wisp.uid));assert.equal(unit(s,wisp.uid).at,8);for(const u of targets)assert.equal(unit(s,u.uid),undefined);assert.equal(unit(s,chimera.uid).damage,4);
});

function castUnitCard(s,h,at=12){const a=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid&&a.at===at);assert.ok(a,'Expected actual cast action');return dispatch(s,a);}
function summonExposed(s,at=7){assert.equal(s.choice?.frame.step.op,'finalInquisitionOffer');return pick(s,{at,layer:'surface'});}
test('dispatch: Inquisition Genesis visibly reveals the opponent hand and optionally banishes one physical card',()=>{
 let s=game(),h=costCard(s,'the_inquisition');s.players[1].hand=[{uid:'banish-me',card:card('wild_boars').id},{uid:'keep-me',card:card('fireball').id}];s=restoreGame(s);s=castUnitCard(s,h);
 assert.equal(s.choice?.frame.step.op,'finalInquisitionBanish');assert.equal(handIsRevealed(s,1),true);s=pick(s,'banish-me');assert.ok(s.players[1].banished.includes(card('wild_boars').id));assert.deepEqual(s.players[1].hand.map(h=>h.uid),['keep-me']);assert.equal(handIsRevealed(s,1),false);
});
test('dispatch: an exposed Inquisition waits for the revealing Genesis, and cannot summon if that effect banishes it',()=>{
 let s=game(),h=costCard(s,'the_inquisition');s.players[1].hand=[{uid:'enemy-inq',card:card('the_inquisition').id}];s=restoreGame(s);s=castUnitCard(s,h);assert.equal(s.choice?.frame.step.op,'finalInquisitionBanish');s=pick(s,'enemy-inq');assert.equal(s.choice,null);assert.equal(s.units.filter(u=>u.card===h.card).length,1);assert.ok(s.players[1].banished.includes(h.card));
});
test('dispatch: Inquisition revealed from hand summons freely at an enemy location without threshold, survives save and has Genesis',()=>{
 let s=game(),h=costCard(s,'the_inquisition');s.players[1].hand=[{uid:'enemy-inq',card:card('the_inquisition').id},{uid:'other',card:card('wild_boars').id}];s.players[1].bonusAffinity={};s.players[1].bonusMana=0;s.players[0].hand.push({uid:'target-zero',card:card('wild_boars').id});s=restoreGame(s);const spent=s.players[1].spent;s=castUnitCard(s,h);s=pick(s,'other');assert.equal(s.choice?.player,1);s=restoreGame(JSON.parse(JSON.stringify(s)));s=summonExposed(s,12);
 assert.equal(s.players[1].spent,spent);assert.ok(s.units.some(u=>u.card===h.card&&u.controller===1&&u.at===12));assert.equal(s.choice?.frame.step.op,'finalInquisitionBanish');s=pick(s,'target-zero');assert.ok(s.players[0].banished.includes(card('wild_boars').id));assert.equal(s.choice,null);
});
test('dispatch: declining an exposed Inquisition preserves its hand identity and consumes no resources',()=>{
 let s=game(),h=costCard(s,'the_inquisition');s.players[1].hand=[{uid:'enemy-inq',card:card('the_inquisition').id}];s=restoreGame(s);s=castUnitCard(s,h);s=pick(s,null);assert.equal(s.choice?.frame.step.op,'finalInquisitionOffer');const before=s.players[1].spent;s=pick(s,null);assert.equal(s.choice,null);assert.equal(s.players[1].spent,before);assert.equal(s.players[1].hand[0].uid,'enemy-inq');
});

test('dispatch: opponent book search exposes Inquisition even when it is not a Beast search result',()=>{
 let s=game(),h=costCard(s,'kingswood_poachers');s.players[1].spells=[card('the_inquisition').id,card('wild_boars').id];s=restoreGame(s);s=castUnitCard(s,h);s=pick(s,{entity:'player',player:1});assert.equal(s.choice?.frame.step.op,'poachOne');assert.equal(s.choice.options.some(o=>o.value?.card===card('the_inquisition').id),false);s=pick(s,null);s=summonExposed(s,12);assert.ok(s.units.some(u=>u.controller===1&&u.card===card('the_inquisition').id));assert.equal(s.players[1].spells.includes(card('the_inquisition').id),false);
});
test('dispatch: Haystack only exposes the actual searched prefix, and searching your own book stays private',()=>{
 for(const own of [false,true]){let s=game(),h=costCard(s,'kingswood_poachers');s.players[own?0:1].spells=[card('wild_boars').id,card('wild_boars').id,card('wild_boars').id,card('the_inquisition').id];s.board[0].card=card('haystack').id;s.board[0].controller=1;s=restoreGame(s);s=castUnitCard(s,h);s=pick(s,{entity:'player',player:own?0:1});s=pick(s,null);assert.equal(s.choice,null);assert.equal(s.units.some(u=>u.card===card('the_inquisition').id),false);}
});
test('dispatch: Feast finishes banishing before exposed Inquisition can summon',()=>{
 let s=game(),h=costCard(s,'feast_for_crows');s.players[1].spells=[card('the_inquisition').id,card('wild_boars').id];s=restoreGame(s);const a=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid);assert.ok(a);s=dispatch(s,a);s=pick(s,card('the_inquisition').name);assert.equal(s.choice,null);assert.ok(s.players[1].banished.includes(card('the_inquisition').id));assert.equal(s.units.some(u=>u.card===card('the_inquisition').id),false);
});
test('dispatch: Feast cannot banish or expose an identical Inquisition outside Haystack searched prefix',()=>{
 let s=game(),h=costCard(s,'feast_for_crows');s.players[1].spells=[card('the_inquisition').id,card('wild_boars').id,card('fireball').id,card('the_inquisition').id];s.board[0].card=card('haystack').id;s.board[0].controller=1;s=restoreGame(s);const a=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid);s=dispatch(s,a);s=pick(s,card('the_inquisition').name);assert.equal(s.choice,null);assert.equal(s.players[1].banished.filter(id=>id===card('the_inquisition').id).length,1);assert.equal(s.players[1].spells.filter(id=>id===card('the_inquisition').id).length,1);
});
test('dispatch: publicly revealed adjacent identical top cards create separate exposure windows when drawn',()=>{
 let s=game();add(s,'doomsday_cult',12);s.players[0].spells=[card('wild_boars').id];s.players[1].spells=[card('the_inquisition').id,card('the_inquisition').id,card('wild_boars').id];s=restoreGame(s);s=dispatch(s,{type:'end',player:0});assert.equal(s.choice?.frame.step.op,'finalInquisitionOffer');s=pick(s,null);assert.equal(s.phase,'draw');s=dispatch(s,{type:'draw',player:1,deck:'spells'});assert.equal(s.choice?.frame.step.op,'finalInquisitionOffer');s=summonExposed(s,12);assert.equal(s.players[1].hand.filter(h=>h.card===card('the_inquisition').id).length,1);assert.equal(s.units.filter(u=>u.card===card('the_inquisition').id).length,1);
});
test('dispatch: continuous Swiven Scout hand exposure triggers once and summons without the printed casting cost',()=>{
 let s=game();add(s,'swiven_scout',7);s.players[1].hand=[{uid:'scout-inq',card:card('the_inquisition').id}];s.players[1].bonusAffinity={};s.players[1].bonusMana=0;s=restoreGame(s);const before=s.players[1].spent;s=dispatch(s,{type:'end',player:0});assert.equal(s.choice?.frame.step.op,'finalInquisitionOffer');s=summonExposed(s,12);assert.equal(s.players[1].spent,before);assert.equal(s.units.filter(u=>u.card===card('the_inquisition').id).length,1);assert.equal(s.players[1].hand.length,0);
});
test('dispatch: Dhol reveal completes returning its uncast pool before Inquisition offers a saved free summon',()=>{
 let s=game(),h=costCard(s,'dhol_chants');s.players[0].spells=[card('the_inquisition').id];s.players[0].bonusAffinity={air:10};s=restoreGame(s);const av=s.units.find(u=>u.controller===0&&card(u.card).type==='Avatar');const a=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid);assert.ok(a);s=dispatch(s,a);assert.equal(s.choice?.frame.step.op,'finalDholTap');s=pick(s,av.uid);s=pick(s,null);assert.equal(s.choice?.frame.step.op,'finalDholBottom');assert.equal(s.players[0].spells.length,0);s=restoreGame(JSON.parse(JSON.stringify(s)));s=pick(s,0);assert.equal(s.choice?.frame.step.op,'finalInquisitionOffer');assert.equal(s.players[0].spells[0],card('the_inquisition').id);const spent=s.players[0].spent;s=summonExposed(s,7);assert.equal(s.players[0].spent,spent);assert.equal(s.players[0].spells.length,0);assert.ok(s.units.some(u=>u.card===card('the_inquisition').id&&u.at===7));
});
test('dispatch: exposure summons are not casts and therefore do not pay Court of Equity spell tax',()=>{
 let s=game(),h=costCard(s,'the_inquisition');s.board[0].card=card('court_of_equity').id;s.players[1].hand=[{uid:'no-cast-tax',card:card('the_inquisition').id}];s.players[1].bonusMana=0;s=restoreGame(s);s=castUnitCard(s,h);s=pick(s,null);const spent=s.players[1].spent;s=summonExposed(s,12);assert.equal(s.players[1].spent,spent);assert.ok(s.units.some(u=>u.controller===1&&u.card===card('the_inquisition').id));
});
function stitchedFixture(){let s=game();const attacker=add(s,'brown_bears',12);attacker.mods.push({set:7});const abom=add(s,'stitched_abomination',7,1);abom.finalStitchedParts=[5,4,3].map((power,i)=>({uid:'part'+i,card:card(['mountain_giant','brown_bears','wild_boars'][i]).id,owner:1,power,damage:0}));return {s:restoreGame(s),attacker,abom};}
function attackStitched(s,attacker,abom){const a=legalActions(s).find(a=>a.type==='attack'&&a.unit===attacker.uid&&a.target===abom.uid);assert.ok(a);s=dispatch(s,a);return dispatch(s,{type:'pass',player:1});}
test('dispatch: Stitched Genesis selects up to three cards from only one physical cemetery and banishes the originals',()=>{
 let s=game(),h=costCard(s,'stitched_abomination');s.players[0].cemetery=[card('brown_bears').id,card('wild_boars').id,card('muddy_pigs').id];s.players[1].cemetery=[card('mountain_giant').id];s=restoreGame(s);s=castUnitCard(s,h);assert.equal(s.choice?.frame.step.op,'finalStitch');let g=s.choice.options.find(o=>o.value?.player===1).value;s=pick(s,g);assert.equal(s.choice.options.filter(o=>o.value!==null).length,0);s=pick(s,null);const abom=s.units.find(u=>u.card===h.card);assert.ok(abom);assert.equal(power(abom),card('mountain_giant').attack);assert.equal(abom.finalStitchedParts.length,1);assert.ok(s.players[1].banished.includes(card('mountain_giant').id));assert.equal(s.players[0].cemetery.length,3);
});
test('dispatch: Stitched damage dealer allocates seven to destroy the four and three parts, with saved replay',()=>{
 let {s,attacker,abom}=stitchedFixture();s=attackStitched(s,attacker,abom);assert.equal(s.choice?.frame.step.op,'finalReplacementResume');assert.equal(s.choice.player,0);s=pick(s,0);s=restoreGame(JSON.parse(JSON.stringify(s)));s=pick(s,4);assert.equal(unit(s,abom.uid).finalStitchedParts.length,1);assert.equal(power(unit(s,abom.uid)),5);assert.equal(unit(s,abom.uid).damage,0);assert.equal(unit(s,attacker.uid),undefined);
});
test('dispatch: Stitched seven damage can preserve all three parts as 3/3/1 and clears every part at turn end',()=>{
 let {s,attacker,abom}=stitchedFixture();s=attackStitched(s,attacker,abom);s=pick(s,3);s=pick(s,3);assert.deepEqual(unit(s,abom.uid).finalStitchedParts.map(p=>p.damage),[3,3,1]);assert.equal(power(unit(s,abom.uid)),12);s=dispatch(s,{type:'end',player:0});assert.deepEqual(unit(s,abom.uid).finalStitchedParts.map(p=>p.damage),[0,0,0]);assert.equal(unit(s,abom.uid).damage,0);
});
test('dispatch: Stitched Ward prevents the whole damage event before any part allocation',()=>{
 let {s,attacker,abom}=stitchedFixture();add(s,'saint_of_redemption',18,1);s=restoreGame(s);unit(s,abom.uid).ward=true;s=attackStitched(s,attacker,abom);assert.equal(s.choice,undefined);assert.equal(unit(s,abom.uid).ward,false);assert.equal(power(unit(s,abom.uid)),12);assert.deepEqual(unit(s,abom.uid).finalStitchedParts.map(p=>p.damage),[0,0,0]);
});
test('dispatch: Stitched lethal strike destroys the entire unit without allocating individual parts',()=>{
 let {s,attacker,abom}=stitchedFixture();unit(s,attacker.uid).mods.push({keyword:'Lethal'});s=restoreGame(s);s=attackStitched(s,attacker,abom);assert.equal(s.choice,undefined);assert.equal(unit(s,abom.uid),undefined);assert.ok(s.players[1].cemetery.includes(card('stitched_abomination').id));
});
test('dispatch: Stitched three corpse selection commits once, pays Bureau once, and does not inherit the corpses abilities',()=>{
 let s=game(),h=costCard(s,'stitched_abomination');s.players[0].cemetery=[card('muddy_pigs').id,card('wild_boars').id,card('brown_bears').id];s.board[0].card=card('bureau_of_occult_control').id;s.players[0].life=10;s=restoreGame(s);s=castUnitCard(s,h);assert.equal(s.choice?.frame.step.op,'zoneAccessOffer');s=pick(s,true);const spent=s.players[0].spent;for(let i=0;i<3;i++){const g=s.choice.options.find(o=>o.value?.player===0)?.value;assert.ok(g);s=pick(s,g);}const u=s.units.find(u=>u.card===h.card);assert.equal(u.finalStitchedParts.length,3);assert.equal(s.players[0].spent,spent);assert.equal(s.players[0].cemetery.length,0);assert.equal(s.players[0].life,10);assert.equal(power(u),u.finalStitchedParts.reduce((n,p)=>n+p.power,0));
});
test('dispatch: Stitched declining Bureau or choosing zero parts leaves corpses untouched',()=>{
 let s=game(),h=costCard(s,'stitched_abomination');s.players[0].cemetery=[card('brown_bears').id];s.board[0].card=card('bureau_of_occult_control').id;s=restoreGame(s);s=castUnitCard(s,h);const before=s.players[0].spent;s=pick(s,false);assert.equal(s.choice?.frame.step.op,'finalStitch');assert.equal(s.choice.options.length,1);s=pick(s,null);assert.equal(s.players[0].spent,before);assert.equal(s.players[0].cemetery.length,1);assert.equal(power(s.units.find(u=>u.card===h.card)),0);
});
test('dispatch: destroying every Stitched part destroys the whole unit and puts only its physical card in cemetery',()=>{
 let {s,attacker,abom}=stitchedFixture();unit(s,attacker.uid).mods=[{set:12}];s=restoreGame(s);s=attackStitched(s,attacker,abom);s=pick(s,5);s=pick(s,4);assert.equal(unit(s,abom.uid),undefined);assert.deepEqual(s.players[1].cemetery,[card('stitched_abomination').id]);
});
test('dispatch: Stitched splits only damage remaining after nearby Shield Maidens prevention',()=>{
 let {s,attacker,abom}=stitchedFixture();add(s,'shield_maidens',8,1);s=restoreGame(s);s=attackStitched(s,attacker,abom);assert.equal(Math.max(...s.choice.options.map(o=>o.value)),6);s=pick(s,0);s=pick(s,3);const u=unit(s,abom.uid);assert.equal(power(u),9);assert.deepEqual(u.finalStitchedParts.map(p=>p.damage),[0,3]);
});
test('dispatch: actual Font of Life allocates partial healing across Stitched parts without recreating destroyed parts',()=>{
 let s=game(),h=costCard(s,'font_of_life'),u=add(s,'stitched_abomination',12);u.finalStitchedParts=[{uid:'h0',card:card('brown_bears').id,power:4,damage:3},{uid:'h1',card:card('wild_boars').id,power:3,damage:1}];u.damage=4;s.board[12].card=card('deep_sea').id;s=restoreGame(s);const a=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid);assert.ok(a);s=dispatch(s,a);assert.equal(s.choice?.frame.step.op,'finalReplacementResume');s=pick(s,0);assert.deepEqual(unit(s,u.uid).finalStitchedParts.map(p=>p.damage),[3,0]);assert.equal(unit(s,u.uid).damage,3);assert.equal(power(unit(s,u.uid)),7);assert.equal(s.players[0].cemetery.filter(id=>id===h.card).length,1);
});
test('dispatch: actual Fatality destroys all Stitched parts outright instead of offering allocation',()=>{
 let {s,abom}=stitchedFixture();const h=costCard(s,'fatality');unit(s,abom.uid).finalStitchedParts[0].damage=1;unit(s,abom.uid).damage=1;s=restoreGame(s);const a=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid&&a.target===abom.uid);assert.ok(a);s=dispatch(s,a);assert.equal(unit(s,abom.uid),undefined);assert.equal(s.choice,undefined);assert.equal(s.players[1].cemetery.filter(id=>id===abom.card).length,1);
});


test('Kairos lineage distinguishes identical printed cards across realm and grave without replacing the whole game',()=>{
 const s=world();s.board=s.board.map(o=>({...o,owner:o.controller}));s.players.forEach(p=>Object.assign(p,{hand:[],cemetery:[],spells:[],atlas:[],collection:[],life:9}));s.auras=[];s.artifacts=[];s.boundControls=[];
 const a=add(s,'wild_boars',7),b=add(s,'wild_boars',12);const archive=createFinalKairosArchive(s,A),pa=a.card,pb=b.card;assert.notEqual(pa,pb);assert.equal(finalArchivePrintedCard(pa,A),card('wild_boars').id);
 s.units=s.units.filter(u=>u.uid!==a.uid);s.players[0].cemetery.push(pa);b.at=13;const newcomer=add(s,'brown_bears',14);s.storyline=[{sentinel:'preserve'}];s.players[0].life=4;s.turn=99;
 const result=returnFinalKairosArchive(s,A);assert.ok(result.restored.includes(archive.records.find(r=>r.state.uid===a.uid).physicalUid));assert.equal(unit(s,a.uid).at,7);assert.equal(unit(s,b.uid).at,12);assert.equal(s.players[0].cemetery.length,0);assert.equal(unit(s,newcomer.uid).at,14);assert.equal(s.players[0].life,4);assert.equal(s.turn,99);assert.deepEqual(s.storyline,[{sentinel:'preserve'}]);
});
test('Kairos never recovers a banished physical card even when an identical unarchived copy remains in hand',()=>{
 const s=world();s.players.forEach(p=>Object.assign(p,{hand:[],cemetery:[],spells:[],atlas:[],collection:[]}));s.auras=[];s.artifacts=[];const a=add(s,'wild_boars');createFinalKairosArchive(s,A);const tagged=a.card;s.units=[];s.players[0].banished.push(tagged);s.players[0].hand.push({uid:'new-copy',card:card('wild_boars').id});const result=returnFinalKairosArchive(s,A);assert.equal(unit(s,a.uid),undefined);assert.ok(result.blocked.includes(a.finalArchivePhysicalUid));assert.equal(s.players[0].hand[0].uid,'new-copy');assert.equal(s.players[0].banished[0],tagged);
});
test('Kairos preserves new carried artifacts in place, banishes blocking new sites, and survives serialized lineage',()=>{
 let s=world();s.players.forEach(p=>Object.assign(p,{hand:[],cemetery:[],spells:[],atlas:[],collection:[]}));s.auras=[];s.artifacts=[];const a=add(s,'wild_boars',7);createFinalKairosArchive(s,A);a.at=12;s.artifacts.push({uid:'new-artifact',card:card('sword_and_shield').id,owner:0,controller:0,bearer:a.uid,at:12});s.board[7]={uid:'new-site',card:card('lone_tower').id,owner:0,controller:0};s=JSON.parse(JSON.stringify(s));restoreFinalArchiveCards(s,A);returnFinalKairosArchive(s,A);assert.equal(unit(s,a.uid).at,7);assert.equal(s.artifacts[0].at,12);assert.equal(s.artifacts[0].bearer,null);assert.ok(s.players[0].banished.includes(card('lone_tower').id));assert.notEqual(s.board[7].uid,'new-site');
});


test('Artifact animation keeps one physical dual-type object with self-bearer abilities and original ownership',()=>{
 const s=world(),source=add(s,'grosse_poltergeist'),a={uid:'anim1',card:card('sword_and_shield').id,at:12,owner:1,controller:1,bearer:null};s.artifacts=[a];animateArtifact(s,a,{source,controller:0,power:card(a.card).cost},A);assert.equal(s.units.find(u=>u.uid===a.uid),a);assert.equal(s.artifacts[0],a);assert.equal(a.owner,1);assert.equal(a.controller,0);assert.equal(a.bearer,a.uid);assert.equal(externalArtifactBearer(a),null);assert.deepEqual(card(a.card).simultaneousTypes,['Artifact','Minion']);assert.ok(card(a.card).subtypes.includes('Automaton'));assert.equal(card(a.card).slug,'sword_and_shield');
});
test('Grosse animation and control persist through silence and expire only when their source leaves the realm',()=>{
 const s=world(),source=add(s,'grosse_poltergeist'),a={uid:'anim2',card:card('sword_and_shield').id,at:12,owner:1,controller:1,bearer:null};s.artifacts=[a];animateArtifact(s,a,{source,controller:0,power:3},A);source.silenced=true;refreshArtifactAnimations(s,A);assert.equal(a.bearer,a.uid);assert.equal(a.controller,0);s.units=s.units.filter(u=>u.uid!==source.uid);refreshArtifactAnimations(s,A);assert.equal(s.units.some(u=>u.uid===a.uid),false);assert.equal(a.card,card('sword_and_shield').id);assert.equal(a.controller,1);assert.equal(a.bearer,null);
});
test('Factory field animates at power two, preserves artifact control, and ends when no claim applies',()=>{
 const s=world(),a={uid:'factory-a',card:card('sword_and_shield').id,at:12,owner:1,controller:1,bearer:null};s.artifacts=[a];const claim={artifact:a,source:{uid:'factory'},kind:'factory',power:2,selfBearer:true};refreshArtifactAnimations(s,A,[claim]);assert.equal(power(a),2);assert.equal(a.controller,1);refreshArtifactAnimations(s,A,[]);assert.equal(a.card,card('sword_and_shield').id);assert.equal(s.units.some(u=>u.uid===a.uid),false);
});
test('Artifact animation restores shared object identity and layered Factory power/Grosse control across saves',()=>{
 let s=world(),source=add(s,'grosse_poltergeist'),a={uid:'anim-save',card:card('sword_and_shield').id,at:12,owner:1,controller:1,bearer:null};s.artifacts=[a];animateArtifact(s,a,{source,controller:0,power:3},A);const claim={artifact:a,source:{uid:'factory'},kind:'factory',power:2,selfBearer:true};refreshArtifactAnimations(s,A,[claim]);s=JSON.parse(JSON.stringify(s));restoreArtifactAnimations(s,A);a=s.artifacts[0];assert.equal(s.units.find(u=>u.uid===a.uid),a);assert.equal(power(a),2);assert.equal(a.controller,0);refreshArtifactAnimations(s,A,[]);assert.equal(power(a),3);assert.equal(a.controller,0);artifactAnimationLeaves(s,a);assert.equal(s.artifacts.length,0);
});
function grosseSetup(slug='sword_and_shield'){let s=game();const source=add(s,'grosse_poltergeist'),a={uid:'grosse-artifact',card:card(slug).id,at:13,owner:1,controller:1,bearer:null,layer:'surface'};s.artifacts.push(a);return {s:restoreGame(s),source,a};}
function grosseActivate(s,source,a){const action=legalActions(s).find(a=>a.type==='activate'&&a.unit===source.uid);assert.ok(action);s=dispatch(s,action);assert.equal(unit(s,source.uid).tapped,false);const value=s.choice.options.find(o=>o.value?.uid===a.uid)?.value;assert.ok(value);return pick(s,value);}
test('dispatch: Grosse activation can cancel before tapping, then animates the same enemy artifact with its own Sword and Shield bonus',()=>{
 let {s,source,a}=grosseSetup();const action=legalActions(s).find(a=>a.type==='activate'&&a.unit===source.uid);s=dispatch(s,action);s=pick(s,null);assert.equal(unit(s,source.uid).tapped,false);s=grosseActivate(s,source,a);const animated=unit(s,a.uid);assert.ok(animated);assert.equal(animated,s.artifacts.find(o=>o.uid===a.uid));assert.equal(animated.owner,1);assert.equal(animated.controller,0);assert.equal(power(animated),card('sword_and_shield').cost+2);assert.equal(unit(s,source.uid).tapped,true);assert.equal(legalActions(s).some(action=>action.type==='drop'&&action.unit===a.uid),false);
});
test('dispatch: Grosse animated Merlin staff actually casts a spell as its own bearer and gains its printed cast-power effect',()=>{
 let {s,source,a}=grosseSetup('merlins_staff');s=grosseActivate(s,source,a);assert.ok(keywords(unit(s,a.uid)).includes('Spellcaster'));const h=costCard(s,'wild_boars');s=restoreGame(s);const action=legalActions(s).find(action=>action.type==='cast'&&action.hand===h.uid&&action.caster===a.uid&&action.at===12);assert.ok(action);const magic=costCard(s,'font_of_life','staff-magic');s=restoreGame(s);const cast=legalActions(s).find(action=>action.type==='cast'&&action.hand===magic.uid&&action.caster===a.uid);assert.ok(cast);const before=power(unit(s,a.uid));s=dispatch(s,cast);assert.equal(power(unit(s,a.uid)),before+1);
});
test('dispatch: Grosse destroying an animated artifact removes both indexes and sends only one physical card to its owner cemetery',()=>{
 let {s,source,a}=grosseSetup();s=grosseActivate(s,source,a);const u=unit(s,a.uid);u.damage=1;const h=costCard(s,'fatality');s=restoreGame(s);const action=legalActions(s).find(action=>action.type==='cast'&&action.hand===h.uid&&action.target===a.uid);assert.ok(action);s=dispatch(s,action);assert.equal(unit(s,a.uid),undefined);assert.equal(s.artifacts.some(o=>o.uid===a.uid),false);assert.equal(s.players[1].cemetery.filter(id=>id===card('sword_and_shield').id).length,1);
});
test('dispatch: Grosse saved animation stays the same object and returns to an artifact only after Grosse leaves',()=>{
 let {s,source,a}=grosseSetup();s=grosseActivate(s,source,a);s=restoreGame(JSON.parse(JSON.stringify(s)));assert.equal(unit(s,a.uid),s.artifacts.find(o=>o.uid===a.uid));const h=costCard(s,'fatality');unit(s,source.uid).damage=1;s=restoreGame(s);const action=legalActions(s).find(action=>action.type==='cast'&&action.hand===h.uid&&action.target===source.uid);assert.ok(action);s=dispatch(s,action);assert.equal(unit(s,a.uid),undefined);assert.equal(s.artifacts.find(o=>o.uid===a.uid).card,card('sword_and_shield').id);assert.equal(s.artifacts.find(o=>o.uid===a.uid).bearer,null);assert.equal(s.players[1].cemetery.includes(card('sword_and_shield').id),false);
});
test('dispatch: Grosse animated Manuscript has one proper bearer-tap activation and actually draws and damages itself',()=>{
 let {s,source,a}=grosseSetup('pnakotic_manuscript');s=grosseActivate(s,source,a);s.players[0].spells=[card('wild_boars').id];s=restoreGame(s);const actions=legalActions(s);assert.equal(actions.some(action=>action.type==='activate'&&action.unit===a.uid),false);const activation=actions.find(action=>action.type==='activateArtifact'&&action.object===a.uid);assert.ok(activation);s=dispatch(s,activation);assert.equal(unit(s,a.uid).tapped,true);assert.equal(unit(s,a.uid).damage,card('wild_boars').cost);assert.ok(s.players[0].hand.some(h=>h.card===card('wild_boars').id));assert.equal(legalActions(s).some(action=>action.type==='activateArtifact'&&action.object===a.uid),false);
});
test('dispatch: Grosse a disabled animated artifact cannot bypass disability through artifact activation',()=>{
 let {s,source,a}=grosseSetup('pnakotic_manuscript');s=grosseActivate(s,source,a);unit(s,a.uid).mods.push({disabled:true});s=restoreGame(s);assert.equal(disabled(unit(s,a.uid)),true);assert.equal(legalActions(s).some(action=>(action.type==='activateArtifact'&&action.object===a.uid)||(action.type==='activate'&&action.unit===a.uid)),false);
});
test('dispatch: Grosse self-bearer is not a physically carried item for Just a Rock',()=>{
 let {s,source,a}=grosseSetup();s=grosseActivate(s,source,a);const h={uid:'enemy-rock',card:card('just_a_rock').id};s.players[1].hand.push(h);s.active=1;s=restoreGame(s);assert.equal(legalActions(s,1).some(action=>action.type==='cast'&&action.hand===h.uid&&action.bearer===a.uid),false);
});
function rasputinFixture(t,donorSlug='land_surveyor'){const c=card('grigori_rasputin');assert.equal(c.playable,true);let s=game();s.players[0].cemetery=[c.id];const donor=add(s,donorSlug,7);donor.copyEvil=true;return {s:restoreGame(s),donor,c};}
function castRasputin(s,action){s=dispatch(s,action);assert.equal(s.choice?.frame.step.op,'finalRasputinConfirm');return pick(s,true);}
function rasputinAction(s,donor){return legalActions(s).find(a=>a.type==='cast'&&a.rasputin?.uid===donor.uid);}
test('dispatch: Rasputin cemetery permission casts at an Evil ally on an enemy site, pays normal mana, and adds printed power plus Genesis',t=>{
 let {s,donor,c}=rasputinFixture(t);unit(s,donor.uid).mods.push({power:99});for(const site of s.board)site.controller=1;s=restoreGame(s);const before=s.players[0].spent,hand=s.players[0].hand.length,action=rasputinAction(s,donor);assert.ok(action);assert.equal(action.at,7);s=castRasputin(s,action);const u=s.units.find(u=>u.originalCard===c.id);assert.ok(u);assert.equal(u.at,7);assert.equal(u.controller,0);assert.equal(power(u),3);assert.equal(s.players[0].spent,before+2);assert.equal(s.players[0].hand.length,hand+1);assert.equal(unit(s,donor.uid),undefined);assert.ok(s.players[0].banished.includes(card('land_surveyor').id));assert.equal(s.players[0].cemetery.length,0);
});
test('dispatch: Rasputin inherited Inquisition Genesis fully resolves before the Evil ally banish cost is removed',t=>{
 let {s,donor,c}=rasputinFixture(t,'the_inquisition');s.players[1].hand=[{uid:'rasputin-reveal',card:card('wild_boars').id}];s=restoreGame(s);const action=rasputinAction(s,donor);assert.ok(action);s=castRasputin(s,action);assert.equal(s.choice?.frame.step.op,'finalInquisitionBanish');assert.ok(unit(s,donor.uid));assert.equal(s.players[0].banished.includes(card('the_inquisition').id),false);s=restoreGame(JSON.parse(JSON.stringify(s)));s=pick(s,'rasputin-reveal');assert.equal(unit(s,donor.uid),undefined);assert.ok(s.players[0].banished.includes(card('the_inquisition').id));assert.ok(s.players[1].banished.includes(card('wild_boars').id));assert.equal(power(s.units.find(u=>u.originalCard===c.id)),5);
});
test('dispatch: Rasputin printed Stealth and inherited search Genesis apply on entry before delayed cost removal',t=>{
 let {s,donor,c}=rasputinFixture(t,'kingswood_poachers');unit(s,donor.uid).stealth=false;s=restoreGame(s);s=castRasputin(s,rasputinAction(s,donor));const u=s.units.find(u=>u.originalCard===c.id);assert.equal(u.stealth,true);assert.equal(s.choice?.frame.step.op,'poachDeck');assert.ok(unit(s,donor.uid));s=pick(s,{entity:'player',player:0});s=pick(s,null);assert.equal(unit(s,donor.uid),undefined);assert.equal(unit(s,u.uid).stealth,true);
});
test('dispatch: Rasputin costs still require normal mana, Fire threshold, a real caster and an eligible Evil ally',t=>{
 let {s,donor}=rasputinFixture(t);for(const mode of ['mana','threshold','caster','evil','enemy','grave']){let x=restoreGame(structuredClone(s));if(mode==='mana')manaAvailable(x,1);if(mode==='threshold')x.players[0].bonusAffinity={};if(mode==='caster')x.units.find(u=>u.controller===0&&card(u.card).type==='Avatar').mods.push({disabled:true});if(mode==='evil')unit(x,donor.uid).copyEvil=false;if(mode==='enemy')unit(x,donor.uid).controller=1;if(mode==='grave')x.players[0].cemetery=[];x=restoreGame(x);assert.equal(!!rasputinAction(x,donor),false,mode);}
});
test('dispatch: Rasputin inherited Deathrite works and disappears after dying again',t=>{
 let {s,donor,c}=rasputinFixture(t,'muddy_pigs');s.players[0].life=10;s=castRasputin(s,rasputinAction(s,donor));assert.equal(s.players[0].life,10);const u=s.units.find(u=>u.originalCard===c.id);assert.ok(u);assert.equal(power(u),4);u.damage=1;const h=costCard(s,'fatality','rasputin-fatality');s=restoreGame(s);const a=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid&&a.target===u.uid);assert.ok(a);s=dispatch(s,a);assert.equal(unit(s,u.uid),undefined);assert.equal(s.players[0].life,13);assert.ok(s.players[0].cemetery.includes(c.id));assert.equal(s.players[0].cemetery.some(id=>card(id).abilitySlugs?.includes('muddy_pigs')),false);
});
test('dispatch: Rasputin cemetery permissions use physical Mortuary provenance and obey Wormelow and Bureau independently of spell cost',t=>{
 let {s,donor,c}=rasputinFixture(t);s.players[0].cemetery=[];s.players[1].cemetery=[c.id];s.board[0].card=card('mismanaged_mortuary').id;s.board[1].card=card('bureau_of_occult_control').id;s=restoreGame(s);const before=s.players[0].spent,a=rasputinAction(s,donor);assert.ok(a);assert.equal(a.graveOwner,1);s=castRasputin(s,a);assert.equal(s.players[0].spent,before+4);assert.equal(s.players[1].cemetery.length,0);const u=s.units.find(u=>u.originalCard===c.id);assert.equal(u.owner,1);assert.equal(u.controller,0);
 let x=game();x.players[0].cemetery=[c.id];const blocked=add(x,'land_surveyor',7);blocked.copyEvil=true;x.board[0].card=card('wormelow_tump').id;x.board[0].controller=1;x=restoreGame(x);assert.equal(!!rasputinAction(x,blocked),true);x.board[1].card=card('mismanaged_mortuary').id;x.players[1].cemetery=[c.id];x=restoreGame(x);assert.equal(!!rasputinAction(x,blocked),true);x.players[0].cemetery=[];x.board[1].card=card('valley').id;x=restoreGame(x);assert.equal(!!rasputinAction(x,blocked),false);
});
test('dispatch: Rasputin donor confirmation is reviewable and cancellation spends nothing or moves no card',t=>{
 let {s,donor,c}=rasputinFixture(t);const a=rasputinAction(s,donor),spent=s.players[0].spent;s=dispatch(s,a);assert.equal(s.choice?.frame.step.op,'finalRasputinConfirm');assert.ok(s.choice.title.includes(card(donor.card).name));assert.equal(s.players[0].spent,spent);assert.ok(unit(s,donor.uid));assert.ok(s.players[0].cemetery.includes(c.id));s=restoreGame(JSON.parse(JSON.stringify(s)));s=pick(s,null);assert.equal(s.players[0].spent,spent);assert.ok(unit(s,donor.uid));assert.ok(s.players[0].cemetery.includes(c.id));assert.equal(s.players[0].banished.length,0);
});
test('dispatch: Rasputin stale donor is revalidated before payment and multiple same-location donors remain distinct declarations',t=>{
 let {s,donor}=rasputinFixture(t);const other=add(s,'muddy_pigs',7);other.copyEvil=true;s=restoreGame(s);const all=legalActions(s).filter(a=>a.rasputin);assert.deepEqual(new Set(all.map(a=>a.rasputin.uid)),new Set([donor.uid,other.uid]));s=dispatch(s,all.find(a=>a.rasputin.uid===donor.uid));unit(s,donor.uid).controller=1;const before=s.players[0].spent;assert.throws(()=>pick(s,true),/失效/);assert.equal(s.players[0].spent,before);assert.ok(unit(s,donor.uid));
});
test('dispatch: Rasputin independently paying Bureau cannot be hidden by normal two-mana spell affordability',t=>{
 let {s,donor}=rasputinFixture(t);s.board[0].card=card('bureau_of_occult_control').id;s=restoreGame(s);manaAvailable(s,3);assert.equal(!!rasputinAction(s,donor),false);
});
test('dispatch: Kairos archived dead physical minion returns with recorded damage/tapping and Kairos is banished, while new cards and life persist',t=>{
 const c=card('kairos_the_archivist');assert.equal(c.playable,true);let s=game(),boar=add(s,'wild_boars',12);boar.damage=1;boar.tapped=true;const h=costCard(s,'kairos_the_archivist','kairos-cast');s=restoreGame(s);s=castUnitCard(s,h);assert.ok(s.finalKairosArchive);const kairos=s.units.find(u=>card(u.card).slug==='kairos_the_archivist');assert.ok(kairos);const originalPhysical=unit(s,boar.uid).card;
 let spell=costCard(s,'fatality','kairos-kill-boar');s=restoreGame(s);let a=legalActions(s).find(a=>a.type==='cast'&&a.hand===spell.uid&&a.target===boar.uid);assert.ok(a);s=dispatch(s,a);assert.equal(unit(s,boar.uid),undefined);assert.ok(s.players[0].cemetery.includes(originalPhysical));const newcomer=add(s,'brown_bears',13);s.players[0].life=7;unit(s,kairos.uid).damage=1;spell=costCard(s,'fatality','kairos-kill-self');s=restoreGame(s);a=legalActions(s).find(a=>a.type==='cast'&&a.hand===spell.uid&&a.target===kairos.uid);assert.ok(a);s=dispatch(s,a);assert.ok(unit(s,boar.uid));assert.equal(unit(s,boar.uid).card,originalPhysical);assert.equal(unit(s,boar.uid).damage,1);assert.equal(unit(s,boar.uid).tapped,true);assert.equal(unit(s,boar.uid).at,12);assert.equal(unit(s,kairos.uid),undefined);assert.ok(s.players[0].banished.some(id=>card(id).slug==='kairos_the_archivist'));assert.ok(unit(s,newcomer.uid));assert.equal(s.players[0].life,7);
});
test('dispatch: production Grosse can be cast normally, then really activates after summoning sickness expires',()=>{
 assert.equal(card('grosse_poltergeist').playable,true);let s=game(),h=costCard(s,'grosse_poltergeist','grosse-real-cast');const artifact={uid:'production-animation',card:card('sword_and_shield').id,at:13,owner:1,controller:1,bearer:null};s.artifacts.push(artifact);s=restoreGame(s);s=castUnitCard(s,h);const source=s.units.find(u=>u.card===h.card);assert.ok(source);assert.equal(legalActions(s).some(a=>a.type==='activate'&&a.unit===source.uid),false);s=dispatch(s,{type:'end',player:0});s=nextMain(s);s=dispatch(s,{type:'end',player:1});s=nextMain(s);s=grosseActivate(s,source,artifact);assert.ok(unit(s,artifact.uid));assert.equal(unit(s,artifact.uid).controller,0);
});
test('dispatch: Rasputin inherited Mimic replacement works before entry and preserves Rasputin physical card and added power',t=>{
 let {s,donor,c}=rasputinFixture(t,'mimic');const artifact={uid:'rasputin-mimic-target',card:card('sword_and_shield').id,owner:1,controller:1,at:13,bearer:null};s.artifacts.push(artifact);s=restoreGame(s);s=castRasputin(s,rasputinAction(s,donor));assert.equal(s.choice?.frame.step.op,'finalMimicEntry');assert.ok(unit(s,donor.uid));s=pick(s,artifact.uid);assert.equal(unit(s,donor.uid),undefined);const u=unit(s,artifact.uid);assert.ok(u);assert.equal(u.originalCard,c.id);assert.equal(power(u),2+card('mimic').attack);assert.ok(s.players[1].banished.includes(card('sword_and_shield').id));
});
test('dispatch: Rasputin borrowed Beast of Burden really carries a minion through the transport engine',t=>{
 let {s,donor,c}=rasputinFixture(t,'beast_of_burden');const passenger=add(s,'wild_boars',7);s=restoreGame(s);s=castRasputin(s,rasputinAction(s,donor));const u=s.units.find(u=>u.originalCard===c.id);s=dispatch(s,{type:'end',player:0});s=nextMain(s);s=dispatch(s,{type:'end',player:1});s=nextMain(s);const action=legalActions(s).find(a=>a.type==='pickup'&&a.unit===u.uid);assert.ok(action);s=dispatch(s,{...action,items:[],units:[passenger.uid]});assert.equal(unit(s,passenger.uid).carriedBy,u.uid);
});
test('dispatch: Rasputin inherited Sir Gawain redirects adjacent ally damage through the actual damage replacement engine',t=>{
 let {s,donor,c}=rasputinFixture(t,'sir_gawain');const ally=add(s,'brown_bears',8);s=restoreGame(s);s=castRasputin(s,rasputinAction(s,donor));const u=s.units.find(u=>u.originalCard===c.id),h=costCard(s,'zap','gawain-zap');s=restoreGame(s);const action=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid&&a.target===ally.uid);assert.ok(action);s=dispatch(s,action);assert.equal(unit(s,ally.uid).damage,0);assert.equal(unit(s,u.uid).damage,1);
});
test('dispatch: Rasputin inherited Royal Bodyguard offers optional redirection for the nearby Avatar',t=>{
 let {s,donor,c}=rasputinFixture(t,'royal_bodyguard');s.units.find(u=>u.controller===0&&card(u.card).type==='Avatar').at=8;s=restoreGame(s);s=castRasputin(s,rasputinAction(s,donor));const u=s.units.find(u=>u.originalCard===c.id),av=s.units.find(u=>u.controller===0&&card(u.card).type==='Avatar'),h=costCard(s,'zap','bodyguard-zap');s=restoreGame(s);const action=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid&&a.target===av.uid);assert.ok(action);s=dispatch(s,action);assert.equal(s.choice?.frame.step.op,'finalReplacementResume');const option=s.choice.options.find(o=>typeof o.value==='string'&&o.value.startsWith(u.uid+':')&&o.value.endsWith(':bodyguard'));assert.ok(option);s=pick(s,option.value);assert.equal(s.players[0].life,20);assert.equal(unit(s,u.uid).damage,1);
});
test('dispatch: Rasputin can banish an Evil basic copy of Rasputin without duplicating its cemetery ability or crashing duplicate passive registration',t=>{
 let {s,donor,c}=rasputinFixture(t,'grigori_rasputin');const before=s.players[0].hand.length;s=castRasputin(s,rasputinAction(s,donor));const u=s.units.find(u=>u.originalCard===c.id);assert.ok(u);assert.equal(power(u),4);assert.equal(s.players[0].hand.length,before);assert.equal(unit(s,donor.uid),undefined);assert.ok(s.players[0].banished.includes(c.id));
});
test('dispatch: Grosse animation drops an ordinary artifact bearer but preserves minion carrying with Grosse control priority',()=>{
 for(const carrierSlug of ['wild_boars','stagecoach']){let {s,source,a}=grosseSetup();const carrier=add(s,carrierSlug,13,1);s.artifacts.find(o=>o.uid===a.uid).bearer=carrier.uid;s=restoreGame(s);s=grosseActivate(s,source,a);const animated=unit(s,a.uid);assert.equal(animated.controller,0);assert.equal(animated.bearer,animated.uid);assert.equal(animated.artifactAnimation.externalBearer,carrier.uid);if(carrierSlug==='stagecoach')assert.equal(animated.carriedBy,carrier.uid);else assert.equal(animated.carriedBy,undefined);}
});
test('dispatch: a minion-carrying enemy bearer moves the animated artifact as a passenger without stealing Grosse control',()=>{
 let {s,source,a}=grosseSetup();const carrier=add(s,'stagecoach',13,1);s.artifacts.find(o=>o.uid===a.uid).bearer=carrier.uid;s=restoreGame(s);s=grosseActivate(s,source,a);s=dispatch(s,{type:'end',player:0});s=nextMain(s);const move=legalActions(s,1).find(action=>action.type==='move'&&action.unit===carrier.uid&&action.at===14&&(!action.layer||action.layer==='surface'));assert.ok(move);s=dispatch(s,move);assert.equal(unit(s,a.uid).at,14);assert.equal(unit(s,a.uid).controller,0);assert.equal(unit(s,a.uid).carriedBy,carrier.uid);
});
test('dispatch: a silenced Avatar retains its inherent casting for Jack placement and plunder',()=>{
 let s=game();const victim=add(s,'sir_mordred',7,1);jackHand(s);const av=s.units.find(u=>u.controller===0&&card(u.card).type==='Avatar');av.mods.push({silenced:true});s=restoreGame(s);const a=legalActions(s).find(a=>a.jackVictim===victim.uid&&a.caster===av.uid);assert.ok(a);s=dispatch(s,a);assert.equal(unit(s,victim.uid),undefined);
 s=grantPlunder(['archangel_gabriel']);const caster=s.units.find(u=>u.controller===0&&card(u.card).type==='Avatar');caster.mods.push({silenced:true});s=restoreGame(s);assert.ok(legalActions(s).some(a=>a.plunder&&a.caster===caster.uid));
});
test('Kairos preserves the physical Altar once-per-game marker earned after the archive instead of rewinding it',()=>{
 const s=world();s.players.forEach(p=>Object.assign(p,{hand:[],cemetery:[],spells:[],atlas:[],collection:[]}));s.artifacts=[];s.auras=[];s.board[6]={uid:'archive-altar',card:card('altar_of_malachai').id,owner:0,controller:0};createFinalKairosArchive(s,A);const tagged=s.board[6].card;s.board[6].card=runtimeCard(tagged,'altar_spent',{slug:card(tagged).slug,playable:true,finalAltarSpent:true});s.board[6].finalAltarSpent=true;returnFinalKairosArchive(s,A);assert.equal(s.board[6].finalAltarSpent,true);assert.equal(card(s.board[6].card).finalAltarSpent,true);assert.equal(card(s.board[6].card).finalPhysicalUid,card(tagged).finalPhysicalUid);
});
test('Kairos preserves one shared animated Artifact index and its physical tag survives ending animation',()=>{
 const s=world();s.players.forEach(p=>Object.assign(p,{hand:[],cemetery:[],spells:[],atlas:[],collection:[]}));s.artifacts=[];s.auras=[];const source=add(s,'grosse_poltergeist'),a={uid:'archive-animation',card:card('sword_and_shield').id,at:12,owner:0,controller:0,bearer:null};s.artifacts.push(a);animateArtifact(s,a,{source,controller:0,power:3},A);createFinalKairosArchive(s,A);const uid=a.finalArchivePhysicalUid;returnFinalKairosArchive(s,A);const restored=unit(s,a.uid);assert.equal(restored,s.artifacts.find(o=>o.uid===a.uid));s.units=s.units.filter(u=>u.uid!==source.uid);refreshArtifactAnimations(s,A);assert.equal(card(s.artifacts.find(o=>o.uid===a.uid).card).finalPhysicalUid,uid);
});
test('Kairos restores archive tags below Altar runtime wrappers after their runtime card registry entries are absent',()=>{
 let s=world();s.players.forEach(p=>Object.assign(p,{hand:[],cemetery:[],spells:[],atlas:[],collection:[]}));s.artifacts=[];s.auras=[];s.board[6]={uid:'cold-altar',card:card('altar_of_malachai').id,owner:0,controller:0};createFinalKairosArchive(s,A);const tagged=s.board[6].card,spent=runtimeCard(tagged,'altar_spent',{slug:card(tagged).slug,playable:true,finalAltarSpent:true});s.board[6].card=spent;s.board[6].finalAltarSpent=true;s=JSON.parse(JSON.stringify(s));byId.delete(spent);byId.delete(tagged);assert.throws(()=>card(spent),/未知卡牌/);restoreFinalArchiveCards(s,A);assert.equal(card(spent).finalAltarSpent,true);assert.equal(card(spent).finalPhysicalUid,card(tagged).finalPhysicalUid);returnFinalKairosArchive(s,A);assert.equal(s.board[6].finalAltarSpent,true);
});
test('Kairos can restore archived tokens after they leave, without stealing an unarchived identical real card',()=>{
 const s=world();s.players.forEach(p=>Object.assign(p,{hand:[],cemetery:[],spells:[],atlas:[],collection:[]}));s.artifacts=[];s.auras=[];const token=add(s,'foot_soldier');createFinalKairosArchive(s,A);const tagged=token.card;s.units=[];s.players[0].banished.push(tagged);s.players[0].hand.push({uid:'unarchived-token',card:card('foot_soldier').id});returnFinalKairosArchive(s,A);assert.ok(unit(s,token.uid));assert.equal(unit(s,token.uid).card,tagged);assert.equal(s.players[0].hand[0].uid,'unarchived-token');
});
function castKairos(s,at=12){assert.equal(card('kairos_the_archivist').playable,true);const h=costCard(s,'kairos_the_archivist','kairos-'+s.next);s=restoreGame(s);s=castUnitCard(s,h,at);return {s,kairos:s.units.find(u=>card(u.card).slug==='kairos_the_archivist')};}
function killWithFatality(s,uid,label){unit(s,uid).damage=Math.max(1,unit(s,uid).damage||0);const h=costCard(s,'fatality',label);s=restoreGame(s);const a=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid&&a.target===uid);assert.ok(a,JSON.stringify({phase:s.phase,active:s.active,turn:s.turn,choice:s.choice?.frame.step.op,target:unit(s,uid)?.uid,damage:unit(s,uid)?.damage,hand:h.uid,casts:legalActions(s).filter(a=>a.hand===h.uid)}));return dispatch(s,a);}
test('dispatch: Kairos a real Evil Twin basic copy has a distinct physical identity and stays when its archived model returns',t=>{
 let s=game(),model=add(s,'brown_bears',7,1);let {s:archived,kairos}=castKairos(s);s=archived;const physical=unit(s,model.uid).card,h=costCard(s,'evil_twin','archive-twin');s=restoreGame(s);s=castUnitCard(s,h,13);assert.equal(s.choice?.frame.step.op,'copyEntry');const target=s.choice.options.find(o=>o.value?.uid===model.uid)?.value;assert.ok(target);s=pick(s,target);const twin=s.units.find(u=>u.originalCard===h.card);assert.ok(twin);assert.equal(card(twin.card).slug,'brown_bears');assert.equal(card(twin.card).finalPhysicalUid,undefined);s=killWithFatality(s,model.uid,'archive-twin-model-death');s=killWithFatality(s,kairos.uid,'archive-twin-kairos-death');assert.equal(unit(s,model.uid).card,physical);assert.equal(unit(s,model.uid).at,7);assert.equal(unit(s,twin.uid).at,13);assert.equal(s.units.filter(u=>card(u.card).slug==='brown_bears').length,2);
});
test('dispatch: Kairos real Replication creates an independent artifact token and never steals the archived original lineage',t=>{
 let s=game();const av=s.units.find(u=>u.controller===0&&card(u.card).type==='Avatar'),original={uid:'replication-physical',card:card('sword_and_shield').id,owner:0,controller:0,bearer:av.uid,at:17};s.artifacts.push(original);let {s:archived,kairos}=castKairos(s);s=archived;const physical=s.artifacts.find(a=>a.uid===original.uid).card,h=costCard(s,'replication','archive-replication');s=restoreGame(s);let a=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid);assert.ok(a);s=dispatch(s,a);const item=s.choice.options.find(o=>o.value?.uid===original.uid)?.value;assert.ok(item);s=pick(s,item);const spot=s.choice.options.find(o=>o.value?.at===12)?.value;assert.ok(spot);s=pick(s,spot);const copy=s.artifacts.find(a=>a.tokenCopy);assert.ok(copy);assert.equal(card(copy.card).finalPhysicalUid,undefined);s=killWithFatality(s,kairos.uid,'archive-replication-kairos-death');assert.equal(s.artifacts.find(a=>a.uid===original.uid).card,physical);assert.ok(s.artifacts.some(a=>a.uid===copy.uid));
});
test('dispatch: Kairos Locusts conjure a new token lineage rather than duplicating their archived physical identity',t=>{
 let s=game(),locust=add(s,'locusts_of_illyria',12);s.board[17].card=card('wasteland').id;s.board[18].card=card('windmill').id;let {s:archived,kairos}=castKairos(s);s=archived;const physical=unit(s,locust.uid).card;s=dispatch(s,{type:'end',player:0});assert.equal(s.choice?.frame.step.op,'fiftyLocust');const spot=s.choice.options.find(o=>o.value?.at===13)?.value;assert.ok(spot);s=pick(s,spot);const copy=s.units.find(u=>u.tokenCopy&&card(u.card).slug==='locusts_of_illyria');assert.ok(copy);assert.equal(card(copy.card).finalPhysicalUid,undefined);s=nextMain(s);s=dispatch(s,{type:'end',player:1});s=nextMain(s);s=killWithFatality(s,kairos.uid,'locust-kairos-death');assert.equal(unit(s,locust.uid).card,physical);assert.equal(unit(s,copy.uid).at,13);
});
test('dispatch: Kairos an Orb spell token never makes the archived physical Magic appear banished',t=>{
 let s=game();const spellSpirit=add(s,'wild_boars',13);spellSpirit.card=runtimeCard(card('zap').id,'kairos_fixture_spirit',{type:'Minion',attack:1,defense:1});spellSpirit.originalCard=card('zap').id;const enemy=add(s,'brown_bears',7,1);let {s:archived,kairos}=castKairos(s);s=archived;const physical=unit(s,spellSpirit.uid).originalCard;s.units=s.units.filter(u=>u.uid!==spellSpirit.uid);s.players[0].hand.push({uid:'archived-magic-hand',card:physical});s.artifacts.push({uid:'archive-orb',card:card('orb_of_baal_berith').id,owner:0,controller:0,bearer:null,at:17});s=restoreGame(s);const action=legalActions(s).find(a=>a.type==='cast'&&a.hand==='archived-magic-hand'&&a.target===enemy.uid);assert.ok(action);s=dispatch(s,action);assert.equal(s.choice?.frame.step.op,'finalOrbChoice');s=pick(s,'keep');assert.equal(unit(s,enemy.uid).damage,2);assert.ok(s.players[0].cemetery.includes(physical));assert.equal(s.players[0].banished.some(id=>card(id).finalPhysicalUid===card(physical).finalPhysicalUid),false);s.artifacts=s.artifacts.filter(a=>a.uid!=='archive-orb');s=killWithFatality(s,kairos.uid,'orb-kairos-death');assert.ok(unit(s,spellSpirit.uid));assert.equal(unit(s,spellSpirit.uid).originalCard,physical);
});
function replaceFixtureSite(s,at,slug,p){const old=s.board[at];if(old)s.players[old.owner??old.controller].cemetery.push(old.originalCard||old.card);s.board[at]={uid:'new-site-'+s.next++,card:card(slug).id,owner:p,controller:p};return s;}
test('dispatch: Kairos Bureau charges one effect fee to restore multiple physical graves, including both owners, and saved payment resumes',t=>{
 let s=game(),a=add(s,'wild_boars',12),b=add(s,'wild_boars',7,1);let {s:archived,kairos}=castKairos(s);s=archived;s=killWithFatality(s,a.uid,'bureau-own-death');s=killWithFatality(s,b.uid,'bureau-enemy-death');s=replaceFixtureSite(s,0,'bureau_of_occult_control',1);s=killWithFatality(s,kairos.uid,'bureau-kairos-death');assert.equal(s.choice?.frame.step.op,'zoneAccessOffer');const before=s.players[0].spent;s=restoreGame(JSON.parse(JSON.stringify(s)));s=pick(s,true);assert.equal(s.players[0].spent,before+2);assert.ok(unit(s,a.uid));assert.ok(unit(s,b.uid));assert.equal(unit(s,kairos.uid),undefined);assert.ok(s.players[0].banished.some(id=>card(id).slug==='kairos_the_archivist'));
});
test('dispatch: Kairos declining Bureau restores realm placements and banishes dying Kairos while already buried cards stay inaccessible',t=>{
 let s=game(),dead=add(s,'wild_boars',12),survivor=add(s,'brown_bears',13);let {s:archived,kairos}=castKairos(s);s=archived;s=killWithFatality(s,dead.uid,'decline-dead');unit(s,survivor.uid).at=14;s=replaceFixtureSite(s,0,'bureau_of_occult_control',1);s=killWithFatality(s,kairos.uid,'decline-kairos-dead');assert.equal(s.choice?.frame.step.op,'zoneAccessOffer');const before=s.players[0].spent;s=pick(s,false);assert.equal(s.players[0].spent,before);assert.equal(unit(s,dead.uid),undefined);assert.equal(unit(s,survivor.uid).at,13);assert.equal(s.players[0].banished.some(id=>card(id).slug==='kairos_the_archivist'),true);assert.equal(s.players[0].cemetery.some(id=>card(id).slug==='kairos_the_archivist'),false);assert.ok(s.players[0].cemetery.some(id=>card(id).slug==='wild_boars'));
});
test('dispatch: Kairos Wormelow prevents returning an opponents protected physical corpse while own records still return',t=>{
 let s=game(),enemy=add(s,'wild_boars',7,1),own=add(s,'brown_bears',12);let {s:archived,kairos}=castKairos(s);s=archived;s=killWithFatality(s,enemy.uid,'worm-enemy-death');s=killWithFatality(s,own.uid,'worm-own-death');s=replaceFixtureSite(s,0,'wormelow_tump',1);s=killWithFatality(s,kairos.uid,'worm-kairos-death');assert.equal(unit(s,enemy.uid),undefined);assert.ok(s.players[1].cemetery.some(id=>card(id).slug==='wild_boars'));assert.ok(unit(s,own.uid));assert.equal(unit(s,kairos.uid),undefined);
});
test('dispatch: Kairos a real Altar death replacement remains spent after archive return and cannot save a second death',t=>{
 let s=game();s.board[6]={uid:'real-kairos-altar',card:card('altar_of_malachai').id,owner:0,controller:0};const sacrifice=add(s,'brown_bears',6);let {s:archived,kairos}=castKairos(s);s=archived;s.players[0].life=0;s.players[0].doorTurn=1;let h=costCard(s,'zap','altar-first-zap'),av=s.units.find(u=>u.controller===0&&card(u.card).type==='Avatar');s=restoreGame(s);let a=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid&&a.target===av.uid);assert.ok(a);s=dispatch(s,a);assert.equal(s.choice?.frame.step.op,'finalReplacementResume');const replacement=s.choice.options.find(o=>o.value?.minion===sacrifice.uid)?.value;assert.ok(replacement);s=pick(s,replacement);assert.equal(s.winner,null);assert.equal(s.board[6].finalAltarSpent,true);assert.equal(unit(s,sacrifice.uid),undefined);s=killWithFatality(s,kairos.uid,'altar-kairos-death');assert.ok(unit(s,sacrifice.uid));assert.equal(s.board[6].finalAltarSpent,true);assert.equal(card(s.board[6].originalCard||s.board[6].card).finalAltarSpent,true);assert.equal(s.players[0].life,0);
 h=costCard(s,'zap','altar-second-zap');s=restoreGame(s);a=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid&&a.target===av.uid);assert.ok(a);s=dispatch(s,a);assert.equal(s.winner,1);
});
test('dispatch: Kairos cold card-registry reinstall restores physical tags and animated artifact runtimes before a saved deathrite return',t=>{
 let {s,source,a}=grosseSetup('merlins_staff');s=grosseActivate(s,source,a);let {s:archived,kairos}=castKairos(s);s=archived;const physical=unit(s,a.uid).originalCard,saved=JSON.parse(JSON.stringify(s));install(JSON.parse(fs.readFileSync(new URL('../data/official-cards.json',import.meta.url))));assert.equal(card('kairos_the_archivist').playable,true);assert.throws(()=>card(physical),/未知卡牌/);s=restoreGame(saved);assert.equal(unit(s,a.uid),s.artifacts.find(o=>o.uid===a.uid));assert.equal(unit(s,a.uid).originalCard,physical);assert.ok(keywords(unit(s,a.uid)).includes('Spellcaster'));s=killWithFatality(s,kairos.uid,'cold-kairos-death');assert.equal(unit(s,a.uid),s.artifacts.find(o=>o.uid===a.uid));assert.equal(unit(s,a.uid).originalCard,physical);assert.equal(unit(s,a.uid).controller,0);
});
test('dispatch: Kairos The Geistwood offers both legal trigger orders and never archives again after Kairos is banished',t=>{
 for(const order of ['return','archive']){let s=game();s.board[12].card=card('the_geistwood').id;const boar=add(s,'wild_boars',13);let {s:archived,kairos}=castKairos(s);s=archived;const move=legalActions(s).find(a=>a.type==='move'&&a.unit===boar.uid&&a.at===14);assert.ok(move);s=dispatch(s,move);s=killWithFatality(s,kairos.uid,'geistwood-'+order);assert.equal(s.choice?.frame.step.op,'finalKairosDeathOrder');s=pick(s,order);assert.equal(unit(s,kairos.uid),undefined);assert.ok(s.players[0].banished.some(id=>card(id).slug==='kairos_the_archivist'));const expected=order==='return'?13:14;assert.equal(unit(s,boar.uid).at,expected);assert.equal(s.finalKairosArchive.records.find(r=>r.state.uid===boar.uid).state.at,expected);}
});
test('dispatch: Kairos two real controllers share the newest archive and the older Kairos restores its latest recorded positions',t=>{
 let s=game();s.board[0].card=card('windmill').id;s.board[1].card=card('wasteland').id;const boar=add(s,'wild_boars',12);let {s:archived,kairos}=castKairos(s);s=archived;const move=legalActions(s).find(a=>a.type==='move'&&a.unit===boar.uid&&a.at===13);assert.ok(move);s=dispatch(s,move);s=dispatch(s,{type:'end',player:0});s=nextMain(s);const h={uid:'second-controller-kairos',card:card('kairos_the_archivist').id};s.players[1].hand.push(h);s=restoreGame(s);let a=legalActions(s,1).find(a=>a.type==='cast'&&a.hand===h.uid&&a.at===7);assert.ok(a);s=dispatch(s,a);const second=s.units.find(u=>card(u.card).slug==='kairos_the_archivist'&&u.controller===1);assert.ok(second);assert.equal(s.finalKairosArchive.records.find(r=>r.state.uid===boar.uid).state.at,13);unit(s,kairos.uid).damage=1;const fatality={uid:'kill-older-kairos',card:card('fatality').id};s.players[1].hand.push(fatality);s=restoreGame(s);a=legalActions(s,1).find(a=>a.type==='cast'&&a.hand===fatality.uid&&a.target===kairos.uid);assert.ok(a);s=dispatch(s,a);assert.equal(unit(s,boar.uid).at,13);assert.equal(unit(s,kairos.uid),undefined);assert.ok(unit(s,second.uid));assert.equal(s.active,1);assert.equal(s.turn,5);
});
test('dispatch: Kairos restoring an archived card out of a real Dhol reveal pool removes it from the continuation instead of duplicating it',t=>{
 let s=game(),boar=add(s,'wild_boars',12),helper=add(s,'brown_bears',16);let {s:archived,kairos}=castKairos(s);s=archived;const physical=unit(s,boar.uid).card;s.units=s.units.filter(u=>u.uid!==boar.uid);s.players[0].spells=[physical,card('fatality').id];unit(s,kairos.uid).damage=1;const av=s.units.find(u=>u.controller===0&&card(u.card).type==='Avatar'),h=costCard(s,'dhol_chants','archive-dhol');s=restoreGame(s);const a=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid);assert.ok(a);s=dispatch(s,a);s=pick(s,av.uid);s=pick(s,helper.uid);s=pick(s,null);assert.equal(s.choice?.frame.step.op,'finalDholCast');const option=s.choice.options.find(o=>o.value?.index===1&&o.value.action.target===kairos.uid)?.value;assert.ok(option);s=pick(s,option);assert.equal(unit(s,kairos.uid),undefined);assert.equal(unit(s,boar.uid).card,physical);assert.equal(s.players[0].spells.includes(physical),false);assert.equal(s.units.filter(u=>u.card===physical).length,1);assert.equal(!!s.choice,false);
});
test('dispatch: Kairos a physical Magic currently resolving returns to its archived Spirit and finishMagic does not put the same card in a second zone',t=>{
 let s=game(),spirit=add(s,'wild_boars',13);spirit.card=runtimeCard(card('fatality').id,'kairos_fixture_fatality_spirit',{type:'Minion',attack:1,defense:1});spirit.originalCard=card('fatality').id;let {s:archived,kairos}=castKairos(s);s=archived;const physical=unit(s,spirit.uid).originalCard;s.units=s.units.filter(u=>u.uid!==spirit.uid);s.players[0].hand.push({uid:'resolving-physical-fatality',card:physical});unit(s,kairos.uid).damage=1;s=restoreGame(s);const a=legalActions(s).find(a=>a.type==='cast'&&a.hand==='resolving-physical-fatality'&&a.target===kairos.uid);assert.ok(a);s=dispatch(s,a);assert.ok(unit(s,spirit.uid));assert.equal(unit(s,spirit.uid).originalCard,physical);assert.equal(s.players[0].cemetery.includes(physical),false);assert.equal(s.players[0].hand.some(h=>h.card===physical),false);assert.equal(s.players[0].spells.includes(physical),false);assert.equal(s.players[0].banished.includes(physical),false);
});
function permanentFatalityThreshold(s){s.board[17].card=card('wasteland').id;s.board[18].card=card('windmill').id;return s;}
function roundToOwner(s){s=dispatch(s,{type:'end',player:0});s=nextMain(s);s=dispatch(s,{type:'end',player:1});return nextMain(s);}
test('dispatch: Kairos used pickup and once-per-turn abilities remain used after a snapshot returns in a later turn',t=>{
 let s=permanentFatalityThreshold(game());const av=s.units.find(u=>u.controller===0&&card(u.card).type==='Avatar');av.card=card('necromancer').id;const carrier=add(s,'beast_of_burden',12),passenger=add(s,'wild_boars',12),item={uid:'snapshot-pickup-item',card:card('sword_and_shield').id,owner:0,controller:0,at:12,bearer:null};s.artifacts.push(item);s=restoreGame(s);let a=legalActions(s).find(a=>a.type==='activate'&&a.unit===av.uid);assert.ok(a);s=dispatch(s,a);a=legalActions(s).find(a=>a.type==='pickup'&&a.unit===carrier.uid);assert.ok(a);s=dispatch(s,{...a,items:[item.uid],units:[passenger.uid]});let {s:archived,kairos}=castKairos(s);s=roundToOwner(archived);s.artifacts.push({uid:'new-pickup-after-archive',card:card('poisonous_dagger').id,owner:0,controller:0,at:12,bearer:null});s=restoreGame(s);assert.ok(legalActions(s).some(a=>a.type==='pickup'&&a.unit===carrier.uid));assert.ok(legalActions(s).some(a=>a.type==='activate'&&a.unit===av.uid));s=killWithFatality(s,kairos.uid,'pickup-state-kairos-death');assert.equal(unit(s,carrier.uid).pickedTurn,s.turn);assert.equal(legalActions(s).some(a=>a.type==='pickup'&&a.unit===carrier.uid),false);assert.equal(legalActions(s).some(a=>a.type==='activate'&&a.unit===av.uid),false);
});
test('dispatch: Kairos a newly summoned minion snapshot regains summoning sickness when returned in a later turn',t=>{
 let s=permanentFatalityThreshold(game()),h=costCard(s,'wild_boars','snapshot-new-minion');s=restoreGame(s);s=castUnitCard(s,h);const boar=s.units.find(u=>u.card===h.card);assert.equal(boar.born,s.turn);let {s:archived,kairos}=castKairos(s);s=roundToOwner(archived);assert.ok(legalActions(s).some(a=>a.type==='move'&&a.unit===boar.uid));s=killWithFatality(s,kairos.uid,'sickness-kairos-death');assert.equal(unit(s,boar.uid).born,s.turn);assert.equal(legalActions(s).some(a=>a.unit===boar.uid&&['move','attack'].includes(a.type)),false);
});
test('dispatch: Kairos applied Onslaught state returns only for archived cards and expires at the current turn end',t=>{
 let s=permanentFatalityThreshold(game()),boar=add(s,'wild_boars',12),h=costCard(s,'onslaught','snapshot-onslaught');s=restoreGame(s);let a=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid);assert.ok(a);s=dispatch(s,a);assert.equal(power(unit(s,boar.uid)),card('wild_boars').attack+1);let {s:archived,kairos}=castKairos(s);s=roundToOwner(archived);assert.equal(power(unit(s,boar.uid)),card('wild_boars').attack);const newcomer=add(s,'brown_bears',13);s=restoreGame(s);s=killWithFatality(s,kairos.uid,'onslaught-kairos-death');assert.equal(power(unit(s,boar.uid)),card('wild_boars').attack+1);assert.ok(keywords(unit(s,boar.uid)).includes('Charge'));assert.equal(power(unit(s,newcomer.uid)),card('brown_bears').attack);assert.equal(keywords(unit(s,newcomer.uid)).includes('Charge'),false);s=dispatch(s,{type:'end',player:0});assert.equal(power(unit(s,boar.uid)),card('wild_boars').attack);assert.equal(keywords(unit(s,boar.uid)).includes('Charge'),false);
});
test('dispatch: Kairos actual Gigantism and Power of Flight durations resume from the recorded card state in a later turn',t=>{
 let s=permanentFatalityThreshold(game()),boar=add(s,'wild_boars',12);for(const [slug,uid] of [['gigantism','snapshot-gigantism'],['power_of_flight','snapshot-flight']]){const h=costCard(s,slug,uid);s=restoreGame(s);const a=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid&&a.target===boar.uid);assert.ok(a);s=dispatch(s,a);}assert.equal(power(unit(s,boar.uid)),card('wild_boars').attack+6);assert.ok(keywords(unit(s,boar.uid)).includes('Airborne'));let {s:archived,kairos}=castKairos(s);s=roundToOwner(archived);assert.equal(power(unit(s,boar.uid)),card('wild_boars').attack);assert.equal(keywords(unit(s,boar.uid)).includes('Airborne'),false);s=killWithFatality(s,kairos.uid,'timed-mod-kairos-death');assert.equal(power(unit(s,boar.uid)),card('wild_boars').attack+6);assert.ok(keywords(unit(s,boar.uid)).includes('Airborne'));s=dispatch(s,{type:'end',player:0});assert.equal(power(unit(s,boar.uid)),card('wild_boars').attack);assert.ok(keywords(unit(s,boar.uid)).includes('Airborne'));s=nextMain(s);s=dispatch(s,{type:'end',player:1});s=nextMain(s);assert.equal(keywords(unit(s,boar.uid)).includes('Airborne'),false);
});
test('dispatch: Kairos returned Land Surveyor is placement and never triggers Genesis again',t=>{
 let s=game(),surveyor=add(s,'land_surveyor',13);let {s:archived,kairos}=castKairos(s);s=archived;s=killWithFatality(s,surveyor.uid,'surveyor-to-grave');const hand=s.players[0].hand.length;s=killWithFatality(s,kairos.uid,'surveyor-kairos-death');assert.ok(unit(s,surveyor.uid));assert.equal(s.players[0].hand.length,hand);assert.equal(unit(s,surveyor.uid).justEntered,false);
});
test('dispatch: Kairos official Gnome Hollows example bypasses entry restrictions and leaves a newly carried Grim Guisarme behind',t=>{
 let s=game();s.board[7]={uid:'kairos-gnome-site',card:card('gnome_hollows').id,owner:0,controller:0};const leprechaun=add(s,'kettletop_leprechaun',7),queen=add(s,'queen_guinevere',13);let {s:archived,kairos}=castKairos(s);s=archived;let a=legalActions(s).find(a=>a.type==='move'&&a.unit===leprechaun.uid&&a.at===8);assert.ok(a);s=dispatch(s,a);const banner=costCard(s,'house_arn_bannerman','kairos-new-bannerman');s=restoreGame(s);s=castUnitCard(s,banner,7);const weapon=costCard(s,'grim_guisarme','kairos-new-guisarme');s=restoreGame(s);a=legalActions(s).find(a=>a.type==='cast'&&a.hand===weapon.uid&&a.bearer===leprechaun.uid);assert.ok(a);s=dispatch(s,a);const item=s.artifacts.find(a=>a.card===weapon.card);assert.ok(item);a=legalActions(s).find(a=>a.type==='activate'&&a.unit===queen.uid);assert.ok(a);s=dispatch(s,a);const untap=s.choice.options.find(o=>o.value?.uid===leprechaun.uid)?.value;assert.ok(untap);s=pick(s,untap);assert.equal(unit(s,leprechaun.uid).tapped,false);assert.ok(legalActions(s).some(a=>a.type==='move'&&a.unit===leprechaun.uid));assert.equal(legalActions(s).some(a=>a.type==='move'&&a.unit===leprechaun.uid&&a.at===7),false);s=killWithFatality(s,kairos.uid,'gnome-kairos-death');assert.equal(unit(s,leprechaun.uid).at,7);assert.equal(power(unit(s,leprechaun.uid)),3);assert.equal(s.artifacts.find(a=>a.uid===item.uid).at,8);assert.equal(s.artifacts.find(a=>a.uid===item.uid).bearer,null);assert.ok(s.units.some(u=>u.card===banner.card));
});
test('Kairos safely replaces ownerless Rubble and can restore archived Rubble over a later real site',()=>{
 const s=world();s.players.forEach(p=>Object.assign(p,{hand:[],cemetery:[],spells:[],atlas:[],collection:[]}));s.artifacts=[];s.auras=[];s.board[6]={uid:'old-rubble',card:card('rubble').id,owner:null,controller:null};const original=s.board[7];original.owner=0;createFinalKairosArchive(s,A);s.players[0].cemetery.push(s.board[7].card);s.board[7]={uid:'new-rubble',card:card('rubble').id,owner:null,controller:null};s.board[6]={uid:'new-real-site',card:card('lone_tower').id,owner:1,controller:1};returnFinalKairosArchive(s,A);assert.equal(s.board[7].uid,original.uid);assert.equal(card(s.board[6].card).slug,'rubble');assert.equal(s.board[6].owner,null);assert.ok(s.players[1].banished.includes(card('lone_tower').id));
});
test('dispatch: Kairos an unused global Critical Strike is retained once rather than archived or rewound onto a particular card',t=>{
 let s=game(),boar=add(s,'wild_boars',12),enemy=add(s,'brown_bears',7,1),h=costCard(s,'critical_strike','kairos-critical-unused');s=restoreGame(s);let a=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid);assert.ok(a);s=dispatch(s,a);assert.equal(!!s.choice,false);const marker=criticalStrikeWaiting(s,0)[0];assert.ok(marker);let {s:archived,kairos}=castKairos(s);s=archived;assert.equal(s.finalKairosArchive.applyingEffects.some(r=>r.effect.op==='criticalStrikeWaiting'),false);s=killWithFatality(s,kairos.uid,'critical-unused-kairos-death');assert.deepEqual(criticalStrikeWaiting(s,0).map(e=>e.uid),[marker.uid]);a=legalActions(s).find(a=>a.type==='attack'&&a.unit===boar.uid&&a.target===enemy.uid);assert.ok(a);s=dispatch(s,a);s=dispatch(s,{type:'pass',player:1});assert.equal(criticalStrikeWaiting(s,0).length,0);assert.equal(unit(s,enemy.uid),undefined);
});
test('dispatch: Kairos a consumed global Critical Strike does not return with the archived attacker',t=>{
 let s=game(),boar=add(s,'wild_boars',12),enemy=add(s,'brown_bears',7,1),h=costCard(s,'critical_strike','kairos-critical-consumed');s=restoreGame(s);let a=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid);assert.ok(a);s=dispatch(s,a);let {s:archived,kairos}=castKairos(s);s=archived;a=legalActions(s).find(a=>a.type==='attack'&&a.unit===boar.uid&&a.target===enemy.uid);assert.ok(a);s=dispatch(s,a);s=dispatch(s,{type:'pass',player:1});assert.equal(criticalStrikeWaiting(s,0).length,0);assert.equal(unit(s,enemy.uid),undefined);s=killWithFatality(s,kairos.uid,'critical-consumed-kairos-death');assert.ok(unit(s,boar.uid));assert.ok(unit(s,enemy.uid));assert.equal(criticalStrikeWaiting(s,0).length,0);a=legalActions(s).find(a=>a.type==='attack'&&a.unit===boar.uid&&a.target===enemy.uid);assert.ok(a);s=dispatch(s,a);s=dispatch(s,{type:'pass',player:1});assert.ok(unit(s,enemy.uid));assert.equal(unit(s,enemy.uid).damage,card('wild_boars').attack);
});
function buildBabel(s){s.board[12]={uid:'kairos-built-base',card:card('the_base_of_babel').id,owner:0,controller:0};s.board[13]={uid:'kairos-sinkhole',card:card('sinkhole').id,owner:0,controller:0};s.players[0].finalHasPlayedSite=true;const h=costCard(s,'the_apex_of_babel','kairos-built-apex');s=restoreGame(s);const action=legalActions(s).find(a=>a.type==='site'&&a.hand===h.uid&&a.at===12);assert.ok(action);s=dispatch(s,action);assert.equal(s.choice?.frame.step.op,'builtBabelCast');s=pick(s,null);return s;}
function collapseBabel(s){const a=legalActions(s).find(a=>a.type==='activateSite'&&a.at===13);assert.ok(a);s=dispatch(s,a);const target=s.choice.options.find(o=>o.value?.at===12)?.value;assert.ok(target);return pick(s,target);}
test('dispatch: Kairos both built Babel physical parts retain separate lineage through destruction and return as one archived Tower without another build bonus',t=>{
 let s=buildBabel(game());let {s:archived,kairos}=castKairos(s,14);s=archived;const record=s.finalKairosArchive.records.find(r=>r.state.uid==='kairos-built-base');assert.equal(record.physicalUids.length,2);assert.equal(new Set(record.physicalUids).size,2);const parts=s.board[12].babelParts.map(part=>part.card);assert.equal(new Set(parts.map(id=>card(id).finalPhysicalUid)).size,2);s=collapseBabel(s);for(const id of parts)assert.ok(s.players[0].cemetery.includes(id));const hand=s.players[0].hand.length;s=killWithFatality(s,kairos.uid,'babel-kairos-death');assert.equal(card(s.board[12].card).name,'The Tower of Babel');assert.equal(s.board[12].babelParts.length,2);assert.equal(s.players[0].hand.length,hand);assert.equal(!!s.choice,false);for(const id of parts)assert.equal(s.players[0].cemetery.includes(id),false);
});
test('dispatch: Kairos banished Babel half never returns, and the eligible physical half returns as its standalone printed Site',t=>{
 for(const banned of ['the_base_of_babel','the_apex_of_babel']){let s=buildBabel(game());const av=s.units.find(u=>u.controller===0&&card(u.card).type==='Avatar');s.artifacts.push({uid:'babel-banish-coin',card:card('ferrymans_coin').id,owner:0,controller:0,bearer:av.uid,at:17});let {s:archived,kairos}=castKairos(s,14);s=collapseBabel(archived);const coin=legalActions(s).find(a=>a.type==='activateArtifact'&&a.object==='babel-banish-coin'&&a.index===1);assert.ok(coin);s=dispatch(s,coin);assert.equal(s.choice?.frame.step.op,'banishGraveOne');const selected=s.choice.options.find(o=>o.value?.card&&card(o.value.card).slug===banned)?.value;assert.ok(selected);const bannedPhysical=selected.card;s=pick(s,selected);s=pick(s,null);s=killWithFatality(s,kairos.uid,'partial-babel-'+banned);assert.equal(s.board[12].babelParts,undefined);assert.equal(card(s.board[12].card).slug,banned==='the_base_of_babel'?'the_apex_of_babel':'the_base_of_babel');assert.ok(s.players[0].banished.includes(bannedPhysical));assert.equal(s.board[12].card===bannedPhysical,false);assert.deepEqual(card(s.board[12].card).rarities||[card(s.board[12].card).rarity],[banned==='the_base_of_babel'?'Unique':'Exceptional']);}
});
test('dispatch: Kairos an unarchived Apex added after the photo stays behind when its archived Base returns from a moved Tower',t=>{
 let s=permanentFatalityThreshold(game());s.board[12]={uid:'prearchive-base',card:card('the_base_of_babel').id,owner:0,controller:0};s.board[13]=null;s.players[0].finalHasPlayedSite=true;s.players[1].finalHasPlayedSite=true;let {s:archived,kairos}=castKairos(s,14);s=archived;const basePhysical=s.board[12].card,apex=costCard(s,'the_apex_of_babel','new-apex-after-archive');s=restoreGame(s);let a=legalActions(s).find(a=>a.type==='site'&&a.hand===apex.uid&&a.at===12);assert.ok(a);s=dispatch(s,a);s=pick(s,null);assert.equal(s.board[12].babelParts.length,2);s=dispatch(s,{type:'end',player:0});s=nextMain(s);const rift={uid:'move-new-tower',card:card('rift_valley').id};s.players[1].hand.push(rift);s=restoreGame(s);a=legalActions(s,1).find(a=>a.type==='site'&&a.hand===rift.uid&&a.at===12);assert.ok(a);s=dispatch(s,a);const plan=s.choice.options.find(o=>o.value?.step===1&&o.value.moves.some(m=>m.from===12&&m.to===13))?.value;assert.ok(plan);s=pick(s,plan);assert.equal(s.board[13].babelParts.length,2);s=dispatch(s,{type:'end',player:1});s=nextMain(s);s=killWithFatality(s,kairos.uid,'detach-babel-kairos-death');assert.equal(s.board[12].card,basePhysical);assert.equal(card(s.board[13].card).slug,'the_apex_of_babel');assert.equal(s.board[13].babelParts,undefined);assert.notEqual(s.board[12].uid,s.board[13].uid);assert.equal(s.players[0].banished.includes(apex.card),false);assert.ok(s.players[1].banished.includes(rift.card));
});
test('Kairos archives face-down inert realm cards without turning them back into minions or duplicating their physical card',()=>{
 const s=world();s.players.forEach(p=>Object.assign(p,{hand:[],cemetery:[],spells:[],atlas:[],collection:[]}));s.artifacts=[];s.auras=[];const original=card('vivien_the_enchantress').id,id=runtimeCard(original,'vivien_back',{type:'None',category:'None',rules:'',attack:null,defense:null,playable:false});s.inertCards=[{uid:'archived-inert',card:id,originalCard:original,owner:0,controller:0,at:12,mods:[],born:0,damage:0,tapped:false}];createFinalKairosArchive(s,A);const physical=s.inertCards[0].originalCard;s.inertCards[0].at=13;returnFinalKairosArchive(s,A);assert.equal(s.inertCards.length,1);assert.equal(s.inertCards[0].at,12);assert.equal(s.inertCards[0].originalCard,physical);assert.equal(card(s.inertCards[0].card).type,'None');assert.equal(s.units.some(u=>u.uid==='archived-inert'),false);
});

function finalConsumerSource(s,slug,at,mode){
 const u=add(s,mode==='native'||mode==='nativeSilenced'?slug:'mountain_giant',at);
 if(mode!=='native'&&mode!=='nativeSilenced')s.artifacts.push({uid:'consumer-bust'+s.next++,card:card('the_pallid_bust').id,bearer:mode==='removed'?null:u.uid,owner:0,controller:0,at,pallidPrintedCard:card(slug).id});
 if(mode==='gainedSilenced'||mode==='nativeSilenced')u.mods.push({silenced:true});
 return u;
}
for(const mode of ['native','gainedSilenced','removed','nativeSilenced']){
 const enabled=mode==='native'||mode==='gainedSilenced';
 test('dispatch: source-aware Chimera '+mode,()=>{
  let s=game();const u=finalConsumerSource(s,'karkemish_chimera',12,mode);add(s,'wild_boars',7,1);add(s,'wild_boars',7,1);s=restoreGame(s);
  const action=legalActions(s).find(a=>a.type==='attack'&&a.unit===u.uid&&a.targets?.length===2);assert.equal(!!action,enabled);
  if(action){s=dispatch(s,action);assert.equal(s.pending.targets.length,2);s=dispatch(s,{type:'pass',player:1});while(s.choice?.frame.step.op==='combatAllocate')s=pick(s,s.choice.options.at(-1).value);assert.equal(s.pending,null);}
 });
 test('dispatch: source-aware Britomart '+mode,()=>{
  let s=game();const u=finalConsumerSource(s,'dame_britomart',12,mode);s.players[0].cemetery.push(card('land_surveyor').id);s=restoreGame(s);
  const action=legalActions(s).find(a=>a.type==='attack'&&a.unit===u.uid&&a.target==='site:7');assert.ok(action);s=dispatch(s,action);if(s.pending)s=dispatch(s,{type:'pass',player:1});assert.equal(s.choice?.frame.step.op==='finalBritomart',enabled);
  if(enabled){const g=s.choice.options.find(o=>o.value?.card===card('land_surveyor').id)?.value;assert.ok(g);s=pick(s,g);assert.ok(s.units.some(v=>v.card===card('land_surveyor').id&&v.at===7));assert.equal(s.players[1].life,20);}
  else assert.equal(s.players[1].life<20,true);
 });
 test('dispatch: source-aware Shark '+mode,()=>{
  let s=waterGame();const u=finalConsumerSource(s,'giant_shark',7,mode),h={uid:'source-aware-food',card:card('wild_boars').id};s.players[0].hand.push(h);s=restoreGame(s);const action=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid&&a.at===12);assert.ok(action);s=dispatch(s,action);s=settleShark(s);
  assert.equal(unit(s,u.uid).at,enabled?12:7);assert.equal(s.units.some(v=>v.card===h.card),!enabled);
 });
}
test('dispatch: two Britomart source instances each offer a replacement but replace site damage only once',()=>{
 let s=game();const u=add(s,'dame_britomart');s.artifacts.push({uid:'second-britomart',card:card('the_pallid_bust').id,bearer:u.uid,owner:0,controller:0,at:u.at,pallidPrintedCard:card('dame_britomart').id});s.players[0].cemetery.push(card('land_surveyor').id);s=restoreGame(s);
 const a=legalActions(s).find(a=>a.type==='attack'&&a.unit===u.uid&&a.target==='site:7');assert.ok(a);s=dispatch(s,a);if(s.pending)s=dispatch(s,{type:'pass',player:1});assert.equal(s.choice.frame.step.op,'finalBritomart');const first=s.choice.frame.step.abilityInstance;s=pick(s,null);assert.equal(s.choice.frame.step.op,'finalBritomart');assert.notEqual(s.choice.frame.step.abilityInstance,first);s=pick(s,s.choice.options.find(o=>o.value?.card===card('land_surveyor').id).value);assert.equal(s.players[1].life,20);assert.equal(s.units.filter(v=>v.card===card('land_surveyor').id).length,1);assert.equal(s.choice,null);
});

test('dispatch: a silenced Pallid bearer can declare and resolve Constrictor and kill its captive at the next untap',()=>{
 let s=game();const u=finalConsumerSource(s,'tringh_constrictor',12,'gainedSilenced'),v=add(s,'wild_boars',12,1);s=restoreGame(s);const a=legalActions(s).find(a=>a.type==='activate'&&a.unit===u.uid);assert.ok(a);s=dispatch(s,a);const plan=s.choice.options.find(o=>o.value?.uid===v.uid&&o.value.to.at===12)?.value;assert.ok(plan);s=pick(s,plan);assert.equal(unit(s,v.uid).carriedBy,u.uid);assert.equal(disabled(unit(s,v.uid)),true);s=dispatch(s,{type:'end',player:0});s=nextMain(s);s=dispatch(s,{type:'end',player:1});assert.equal(unit(s,v.uid),undefined);assert.equal(unit(s,u.uid).tapped,true);
});
test('dispatch: a silenced Pallid Crave bearer triggers on the opponents start and finishes combat before drawing',()=>{
 let s=game();const u=finalConsumerSource(s,'crave_golem',12,'gainedSilenced'),v=add(s,'wild_boars',11);unit(s,s.units.find(x=>card(x.card).type==='Avatar'&&x.controller===0).uid).at=16;s=restoreGame(s);s=dispatch(s,{type:'end',player:0});assert.equal(s.pending?.attacker,u.uid);assert.equal(s.pending?.target,v.uid);s=dispatch(s,{type:'pass',player:0});assert.equal(unit(s,v.uid),undefined);assert.equal(s.phase,'draw');assert.equal(unit(s,u.uid).damage,2);
});
test('dispatch: a Pallid Gargoyle bearer under Silence gains Airborne and preserves its own physical card in Monument form',()=>{
 let s=game();const u=finalConsumerSource(s,'monastery_gargoyle',12,'gainedSilenced'),original=u.card;s=restoreGame(s);s=dispatch(s,{type:'end',player:0});assert.equal(s.choice?.frame.step.op,'finalGargoyleMode');s=pick(s,'airborne');assert.ok(keywords(unit(s,u.uid)).includes('Airborne'));
 s=nextMain(s);s=dispatch(s,{type:'end',player:1});s=pick(s,'monument');const monument=s.artifacts.find(a=>a.uid===u.uid);assert.ok(monument);assert.equal(monument.originalCard,original);assert.equal(card(monument.card).name,card(original).name);assert.equal(card(monument.card).type,'Artifact');assert.deepEqual(card(monument.card).subtypes,['Monument']);assert.equal(s.units.some(v=>v.uid===u.uid),false);
 const dropped=s.artifacts.find(a=>card(a.card).slug==='the_pallid_bust');assert.equal(dropped.bearer,null);const save=JSON.parse(JSON.stringify(s)),form=monument.card;install(JSON.parse(fs.readFileSync(new URL('../data/official-cards.json',import.meta.url))));assert.throws(()=>card(form),/未知卡牌/);s=restoreGame(save);s=nextMain(s);s=dispatch(s,{type:'end',player:0});assert.equal(s.choice,null);assert.equal(s.phase,'draw');assert.equal(s.artifacts.find(a=>a.uid===u.uid).card,form);assert.equal(s.units.some(v=>v.uid===u.uid),false);
});
test('dispatch: a real Rasputin Gargoyle Monument cold-restores its borrowed abilities, returns as the same host and dies as its physical card',t=>{
 let {s,donor,c}=rasputinFixture(t,'monastery_gargoyle');s=castRasputin(s,rasputinAction(s,donor));const u=s.units.find(v=>v.originalCard===c.id),uid=u.uid;assert.ok(u);assert.equal(unit(s,donor.uid),undefined);s=dispatch(s,{type:'end',player:0});assert.equal(s.choice?.frame.step.op,'finalGargoyleMode');s=pick(s,'monument');const monument=s.artifacts.find(a=>a.uid===uid),form=monument.card;assert.ok(form.startsWith('runtime:gargoyle_form:'));assert.equal(monument.originalCard,c.id);assert.equal(card(form).name,c.name);const saved=JSON.parse(JSON.stringify(s));install(JSON.parse(fs.readFileSync(new URL('../data/official-cards.json',import.meta.url))));assert.throws(()=>card(form),/未知卡牌/);s=restoreGame(saved);assert.equal(s.artifacts.find(a=>a.uid===uid).card,form);assert.equal(s.units.some(v=>v.uid===uid),false);s=nextMain(s);s=dispatch(s,{type:'end',player:1});assert.equal(s.choice?.frame.step.op,'finalGargoyleMode');s=pick(s,'airborne');assert.equal(unit(s,uid).originalCard,c.id);assert.equal(power(unit(s,uid)),c.attack+card('monastery_gargoyle').attack);assert.ok(keywords(unit(s,uid)).includes('Airborne'));s=nextMain(s);s=permanentFatalityThreshold(s);s=killWithFatality(s,uid,'cold-gargoyle-rasputin-death');assert.equal(unit(s,uid),undefined);assert.ok(s.players[0].cemetery.includes(c.id));assert.equal(s.players[0].cemetery.some(id=>id===form),false);
});
test('dispatch: Rasputin may pay a naturally Evil donor with Monks gained modification protection, while inheriting only its printed card',()=>{
 let s=game();const c=card('grigori_rasputin'),donor=add(s,'ghoul',7);s.players[0].cemetery=[c.id];s.artifacts.push({uid:'monks-protection-bust',card:card('the_pallid_bust').id,bearer:donor.uid,owner:0,controller:0,at:donor.at,pallidPrintedCard:card('monks_of_kobalsa').id});s=restoreGame(s);assert.equal(unit(s,donor.uid).gainedModificationGuard.origin,card('monks_of_kobalsa').id);assert.equal(unit(s,donor.uid).gainedModificationGuard.instance,'artifact:monks-protection-bust');const action=rasputinAction(s,donor);assert.ok(action);const spent=s.players[0].spent;s=castRasputin(s,action);assert.equal(unit(s,donor.uid),undefined);assert.ok(s.players[0].banished.includes(card('ghoul').id));assert.equal(s.players[0].spent,spent+c.cost);const summoned=s.units.find(u=>u.originalCard===c.id);assert.ok(summoned);assert.equal(power(summoned),c.attack+card('ghoul').attack);assert.equal(!!summoned.gainedModificationGuard,false);assert.equal(s.artifacts.find(a=>a.uid==='monks-protection-bust').bearer,null);
});
test('dispatch: Persecutor can treat enemy Monks as Evil without allowing Rasputin to use a non-ally as cost',()=>{
 let s=game();const av=s.units.find(u=>u.controller===0&&card(u.card).type==='Avatar');av.card=card('persecutor').id;av.born=0;av.tapped=false;const monks=add(s,'monks_of_kobalsa',12,1);monks.ward=true;s.players[0].cemetery=[card('grigori_rasputin').id];s=restoreGame(s);const a=legalActions(s,0).find(a=>a.type==='activate'&&a.unit===av.uid);assert.ok(a);s=dispatch(s,a);const brand=s.choice.options.find(o=>o.value?.mode==='brand'&&o.value.uid===monks.uid)?.value;assert.ok(brand);s=pick(s,brand);assert.ok(s.finalAvatarBrands.some(b=>b.uid===monks.uid&&b.player===0));assert.ok(unitUmbrellas(unit(s,monks.uid),s,0).includes('Evil'));assert.equal(unitUmbrellas(unit(s,monks.uid),s,1).includes('Evil'),false);assert.equal(unit(s,monks.uid).ward,true);assert.equal(unit(s,monks.uid).controller,1);assert.equal(legalActions(s,0).some(a=>a.rasputin?.uid===monks.uid),false);assert.equal(s.players[0].spent,0);assert.ok(s.players[0].cemetery.includes(card('grigori_rasputin').id));
});
test('dispatch: Doom of Dilmun cannot pay Rasputins banishment cost even though it is a controlled Evil minion',()=>{
 let s=game();const doom=add(s,'the_doom_of_dilmun',12);s.players[0].cemetery=[card('grigori_rasputin').id];s=restoreGame(s);assert.equal(legalActions(s,0).some(a=>a.rasputin?.uid===doom.uid),false);assert.ok(unit(s,doom.uid));assert.equal(s.players[0].spent,0);assert.equal(s.players[0].banished.length,0);
});
test('dispatch: gaining Dooms no-banish ability after Rasputin declaration invalidates the cost before payment',()=>{
 let s=game();const donor=add(s,'ghoul',7),c=card('grigori_rasputin');s.players[0].cemetery=[c.id];s=restoreGame(s);const action=rasputinAction(s,donor);assert.ok(action);s=dispatch(s,action);assert.equal(s.choice?.frame.step.op,'finalRasputinConfirm');const spent=s.players[0].spent;s.artifacts.push({uid:'late-doom-permission',card:card('the_pallid_bust').id,bearer:donor.uid,owner:0,controller:0,at:7,pallidPrintedCard:card('the_doom_of_dilmun').id});s=restoreGame(s);assert.throws(()=>pick(s,true),/失效/);assert.equal(s.players[0].spent,spent);assert.ok(unit(s,donor.uid));assert.deepEqual(s.players[0].cemetery,[c.id]);assert.equal(s.players[0].banished.length,0);
});
