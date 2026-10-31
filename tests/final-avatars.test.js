import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {install,card,starter,byId,cards,validateDeck,deckSizes} from '../src/cards.js';
import {newGame,restoreGame,dispatch,legalActions,unit,avatar,spellcaster,keywords,disabled,unitUmbrellas,artifactController,region,castingCard,castingCost,resources,power,unitTypes} from '../src/engine.js';
import {definitions,passives} from '../src/definitions.js';
import {waterSite,locations,occupied,taxicab} from '../src/geography.js';
import {finalWaterSites,finalCorruptorTypes,finalAvatarUnitTypes,persecutorSteps,finalAvatarTreatsAsEvil,finalAvatarDefinitions,experimentalAvatarDefinitions,finalAvatarPassives,resolveFinalAvatar,createFinalAvatarCopyPermit,queueFinalAvatarCopyWindow} from '../src/final-avatars.js';
import {queueEffects} from '../src/storyline.js';
import {zoneAccessCost} from '../src/cemetery-access.js';
install(JSON.parse(fs.readFileSync(new URL('../data/official-cards.json',import.meta.url))));
const helperAPI={card,unit,region,disabled,keywords,unitUmbrellas,artifactController,locations,occupied,distance:taxicab};
function state(slug='avatar_of_water'){
 const s=newGame([starter(),starter()],42,'local');s.phase='main';s.active=0;s.turn=4;s.artifacts=[];s.auras=[];s.storyline=[];s.choice=null;
 for(const u of s.units){u.at=u.controller===0?17:2;u.born=0;u.tapped=false;}
 avatar(s,0).card=card(slug).id;
 s.board=s.board.map((_,at)=>({uid:'s'+s.next++,card:card('valley').id,owner:at<10?1:0,controller:at<10?1:0,ward:false}));
 for(const p of s.players){p.hand=[];p.bonusMana=30;p.bonusAffinity={air:10,earth:10,fire:10,water:10};}
 return s;
}
function add(s,slug,at,p=1,extra={}){const u={uid:'u'+s.next++,card:card(slug).id,at,owner:p,controller:p,tapped:false,born:0,damage:0,mods:[],...extra};s.units.push(u);return u;}
function choose(s,predicate){assert.ok(s.choice,'Expected a serializable choice');const i=s.choice.options.findIndex(o=>predicate(o.value,o));assert.notEqual(i,-1,'Expected choice option');return dispatch(s,{type:'choose',player:s.choice.player,option:i});}
function activateWater(s){const a=legalActions(s,0).find(a=>a.type==='activate'&&a.unit===avatar(s,0).uid);assert.ok(a,'Water Avatar ability must be integrated into dispatch');return dispatch(s,a);}

test('Avatar of Water: no body of water means no flood activation',()=>{
 const s=state();assert.deepEqual(finalWaterSites(s,avatar(s,0),helperAPI),[]);
 assert.ok(!legalActions(s,0).some(a=>a.type==='activate'&&a.unit===avatar(s,0).uid));
});
test('Avatar of Water: target selection uses connected water regardless of ownership',()=>{
 const s=state();s.board[17].flooded=true;s.board[12].flooded=true;s.board[7].flooded=true;
 s.board[7].controller=1;s.board[7].owner=1;
 const options=finalWaterSites(s,avatar(s,0),helperAPI);
 assert.ok(options.includes(2),'site adjacent to enemy part of the same body is eligible');
 assert.ok(!options.includes(0),'unconnected remote site is ineligible');
 s.board[0].flooded=true;assert.ok(!finalWaterSites(s,avatar(s,0),helperAPI).includes(1),'a disconnected water site is not part of this body');
});
test('Avatar of Water: cancellation before declaration does not tap or flood',()=>{
 let s=state();s.board[17].flooded=true;s=activateWater(s);
 assert.equal(avatar(s,0).tapped,false);assert.ok(s.choice.options.some(o=>o.value?.at===16));
 s=choose(s,v=>v===null);assert.equal(avatar(s,0).tapped,false);assert.equal(waterSite(s,16,card),false);
});
test('Avatar of Water: flood persists after a turn and teleport may be declined',()=>{
 let s=state();s.board[17].flooded=true;s=activateWater(s);s=choose(s,v=>v?.at===16);
 assert.equal(avatar(s,0).tapped,true);assert.equal(waterSite(s,16,card),true);
 assert.equal(s.choice.frame.step.op,'finalAvatarWaterTeleport');s=choose(s,v=>v===null);
 assert.equal(avatar(s,0).at,17);
 s.turn++;s=restoreGame(s);assert.equal(waterSite(s,16,card),true,'flood is not an end-of-turn effect');
});
test('Avatar of Water: optional teleport resolves after save round-trip and carries artifacts',()=>{
 let s=state();s.board[17].flooded=true;const av=avatar(s,0);s.artifacts.push({uid:'test-item',card:card('sword_and_shield').id,owner:0,controller:0,at:17,bearer:av.uid,layer:'surface'});
 s=activateWater(s);s=choose(s,v=>v?.at===16);s=restoreGame(JSON.parse(JSON.stringify(s)));s=choose(s,v=>v===true);
 assert.equal(avatar(s,0).at,16);assert.equal(s.artifacts.find(a=>a.uid==='test-item').at,16);
});
test('Avatar of Water: next flood removes only its own earlier flood',()=>{
 let s=state();s.board[17].flooded=true;s.board[16].effects=[{flood:true,stamp:s.next++,external:true}];
 s=activateWater(s);s=choose(s,v=>v?.at===12);s=choose(s,v=>v===null);
 assert.equal(waterSite(s,12,card),true);avatar(s,0).tapped=false;
 s=activateWater(s);s=choose(s,v=>v?.at===18);s=choose(s,v=>v===null);
 assert.equal(waterSite(s,12,card),false);assert.equal(waterSite(s,18,card),true);assert.equal(waterSite(s,16,card),true,'unrelated flood remains');
 assert.ok(!s.board[12].effects.some(e=>e.finalWaterSource));
});
test('Avatar of Water: silenced and disabled avatars cannot activate flood',()=>{
 let s=state();s.board[17].flooded=true;avatar(s,0).mods.push({silenced:true});s=restoreGame(s);
 assert.ok(!legalActions(s,0).some(a=>a.type==='activate'&&a.unit===avatar(s,0).uid));
 s=state();s.board[17].flooded=true;avatar(s,0).mods.push({disabled:true});s=restoreGame(s);
 assert.ok(!legalActions(s,0).some(a=>a.type==='activate'&&a.unit===avatar(s,0).uid));
});
test('experimental Corruptor helper adds types without deleting originals and respects controller',()=>{
 const s=state('corruptor');assert.deepEqual(finalCorruptorTypes(s,0,['Mortal','Beast','Angel'],helperAPI),['Mortal','Beast','Angel','Monster','Undead','Demon']);
 assert.deepEqual(finalCorruptorTypes(s,1,['Mortal'],helperAPI),['Mortal']);
 avatar(s,0).silenced=true;assert.deepEqual(finalCorruptorTypes(s,0,['Mortal'],helperAPI),['Mortal']);
 assert.deepEqual(finalAvatarUnitTypes({finalCorruptor:true},['Mortal']),['Mortal','Undead']);
});
test('experimental Persecutor path search ignores unreachable Evil and can use Airborne diagonal steps',()=>{
 const s=state('persecutor'),av=avatar(s,0);s.board=Array(20).fill(null);s.board[17]={uid:'one',card:card('valley').id,controller:0,owner:0};s.board[12]={uid:'two',card:card('valley').id,controller:0,owner:0};
 add(s,'bone_rabble',0,1);assert.deepEqual(persecutorSteps(s,av,helperAPI),[],'cannot chase an Evil across unreachable void');
 s.board=s.board.map((v,at)=>v||({uid:'s'+at,card:card('valley').id,controller:0,owner:0}));av.mods.push({keyword:'Airborne'});s.units=s.units.filter(u=>card(u.card).slug!=='bone_rabble');add(s,'bone_rabble',11,1);
 assert.ok(persecutorSteps(s,av,helperAPI).some(v=>v.at===11),'diagonal is an actual shortest step');
});
test('experimental Persecutor brand is visible only to its controller and expires',()=>{
 const s=state('persecutor'),target=add(s,'wild_boars',12,1);s.finalAvatarBrands=[{uid:target.uid,player:0,turn:s.turn}];
 assert.equal(finalAvatarTreatsAsEvil(s,target,0,false),true);assert.equal(finalAvatarTreatsAsEvil(s,target,1,false),false);s.turn++;
 assert.equal(finalAvatarTreatsAsEvil(s,target,0,false),false);
});
test('Corruptor and Persecutor registry follows the integrated contextual effects audit',()=>{
 assert.ok(finalAvatarDefinitions.avatar_of_water);assert.ok(finalAvatarDefinitions.persecutor);assert.ok(finalAvatarPassives.corruptor);
 assert.equal(experimentalAvatarDefinitions.persecutor,undefined);assert.ok(finalAvatarDefinitions.realm_eater);assert.equal(card('persecutor').playable,true);assert.equal(card('corruptor').playable,true);
});

function eatSite(s,at=17){
 const eater=avatar(s,0),previous=eater.finalUndigestedSites||0;eater.at=at;eater.tapped=false;s.board[at]={uid:'food'+s.next++,card:card('valley').id,controller:1,owner:1,ward:false};
 const action=legalActions(s,0).find(a=>a.type==='attack'&&a.unit===eater.uid&&a.target==='site:'+at);assert.ok(action,'successful site attack is available');
 s=dispatch(s,action);if(s.pending){assert.ok(legalActions(s,1).some(a=>a.type==='pass'));s=dispatch(s,{type:'pass',player:1});}
 // The engine auto-resolves when no defender can intervene. Check the completed
 // effect rather than requiring a response window that correctly doesn't exist.
 assert.equal(avatar(s,0).finalUndigestedSites,previous+1);assert.equal(card(s.board[at].card).slug,'rubble');return s;
}
test('Realm-Eater: successful site attack destroys a site and grants ongoing Immobile',()=>{
 let s=state('realm_eater');const life=s.players[1].life;s=eatSite(s);
 assert.equal(card(s.board[17].card).slug,'rubble');assert.equal(s.players[1].life,life-1);
 assert.equal(avatar(s,0).finalUndigestedSites,1);assert.ok(keywords(avatar(s,0)).includes('Immobile'));
 avatar(s,0).tapped=false;assert.ok(!legalActions(s,0).some(a=>a.type==='move'&&a.unit===avatar(s,0).uid));
 assert.ok(legalActions(s,0).some(a=>a.type==='ability'&&a.unit===avatar(s,0).uid&&a.mode==='atlas'),'digest restriction does not forbid playing or drawing a site');
});
test('Realm-Eater: multiple site strikes stack and each digest removes only one',()=>{
 let s=eatSite(state('realm_eater'));s=eatSite(s);assert.equal(avatar(s,0).finalUndigestedSites,2);
 avatar(s,0).tapped=false;let a=legalActions(s,0).find(a=>a.type==='activate'&&a.unit===avatar(s,0).uid);assert.ok(a,'digest is activated through dispatch');s=dispatch(s,a);
 assert.equal(avatar(s,0).finalUndigestedSites,1);assert.ok(keywords(avatar(s,0)).includes('Immobile'));assert.equal(avatar(s,0).tapped,true);
 s=restoreGame(JSON.parse(JSON.stringify(s)));avatar(s,0).tapped=false;a=legalActions(s,0).find(a=>a.type==='activate'&&a.unit===avatar(s,0).uid);s=dispatch(s,a);
 assert.equal(avatar(s,0).finalUndigestedSites,0);assert.ok(!keywords(avatar(s,0)).includes('Immobile'));
 avatar(s,0).tapped=false;assert.ok(!legalActions(s,0).some(a=>a.type==='activate'&&a.unit===avatar(s,0).uid),'cannot waste digest activations when nothing is eaten');
});
test('Realm-Eater: silencing does not erase an already-created immobilizing effect',()=>{
 let s=eatSite(state('realm_eater'));avatar(s,0).tapped=false;avatar(s,0).mods.push({silenced:true});s=restoreGame(s);
 assert.ok(keywords(avatar(s,0)).includes('Immobile'));assert.ok(!legalActions(s,0).some(a=>a.type==='activate'&&a.unit===avatar(s,0).uid),'silenced printed digest ability cannot be used');
});
test('Realm-Eater: Onslaught temporarily ignores eaten-site immobility without digesting it',()=>{
 let s=eatSite(state('realm_eater'));(s.ongoingEffects||(s.ongoingEffects=[])).push({op:'fiftyOnslaught',controller:0,end:s.turn});s=restoreGame(s);
 assert.equal(avatar(s,0).finalUndigestedSites,1);assert.ok(!keywords(avatar(s,0)).includes('Immobile'));
 s.ongoingEffects=[];s=restoreGame(s);assert.ok(keywords(avatar(s,0)).includes('Immobile'));
});
test('Realm-Eater: a defended site does not count as successfully struck',()=>{
 let s=state('realm_eater');s.board[17].controller=1;s.board[17].owner=1;const defender=add(s,'wild_boars',17,1);const a=legalActions(s,0).find(a=>a.type==='attack'&&a.unit===avatar(s,0).uid&&a.target==='site:17');s=dispatch(s,a);
 const defend=legalActions(s,1).find(a=>a.type==='defend'&&a.unit===defender.uid);assert.ok(defend);s=dispatch(s,defend);s=dispatch(s,{type:'pass',player:1});
 let n=0;while(s.choice&&n++<20)s=dispatch(s,{type:'choose',player:s.choice.player,option:0});
 assert.equal(avatar(s,0).finalUndigestedSites||0,0);assert.equal(card(s.board[17].card).slug,'valley');
});

test('Avatar of Water: an existing water site is a legal flood choice',()=>{
 let s=state();s.board[17].flooded=true;s.board[16].flooded=true;s=activateWater(s);s=choose(s,v=>v?.at===16);s=choose(s,v=>v===null);
 assert.equal(waterSite(s,16,card),true);assert.ok(s.board[16].effects.some(e=>e.finalWaterSource===avatar(s,0).uid));
});
test('experimental Persecutor brand preserves Ward and does not modify an unmodifiable enemy',()=>{
 const s=state('persecutor'),target=add(s,'monks_of_kobalsa',12,1,{ward:true});
 resolveFinalAvatar(s,{source:avatar(s,0),controller:0,effectCard:avatar(s,0).card,step:{op:'finalAvatarHuntChoose'},selected:{mode:'brand',uid:target.uid}}, {...helperAPI,unmodifiable:()=>true});
 assert.equal(finalAvatarTreatsAsEvil(s,target,0,false),true);assert.equal(target.ward,true);assert.deepEqual(target.mods,[]);
});

function hand(s,slug){const h={uid:'h'+s.next++,card:card(slug).id};s.players[0].hand.push(h);return h;}
function castForm(s,h,form,at=17){const a=legalActions(s,0).find(a=>a.type==='cast'&&a.hand===h.uid&&a.avatarForm===form&&a.caster===avatar(s,0).uid&&(form!=='spirit'||a.at===at));assert.ok(a,'alternate '+form+' cast must be integrated');return {action:a,state:dispatch(s,a)};}
function effectOn(s,op,target,extra={}){s.choice={player:0,title:'effect test',options:[{label:'selected',value:{entity:'unit',uid:target.uid}}],frame:{source:structuredClone(avatar(s,0)),controller:0,effectCard:card('begone').id,step:{op,...extra}}};return choose(s,()=>true);}

test('Animist: both Magic and Spirit alternatives exist without changing the physical hand',()=>{
 const s=state('animist'),h=hand(s,'fireball'),list=legalActions(s,0).filter(a=>a.type==='cast'&&a.hand===h.uid);
 assert.ok(list.some(a=>a.avatarForm==='spirit'));assert.ok(list.some(a=>a.avatarForm===undefined));
 const a=list.find(a=>a.avatarForm==='spirit');assert.equal(castingCard(s,a).type,'Minion');assert.equal(card(h.card).type,'Magic');assert.equal(h.card,card('fireball').id);
});
test('Animist: Craterize becomes a blank 8-power Spirit with printed elements and rarity, no discard cost',()=>{
 let s=state('animist');const h=hand(s,'craterize'),site=s.board[17].uid,before=s.players[0].spent;const result=castForm(s,h,'spirit');s=result.state;
 const spirit=s.units.find(u=>card(u.card).finalAnimistSpirit);assert.ok(spirit);assert.equal(power(spirit),8);assert.deepEqual(unitTypes(spirit),['Spirit']);
 assert.equal(card(spirit.card).earth,2);assert.equal(card(spirit.card).rarity,'Elite');assert.equal(card(spirit.card).rules,'');assert.equal(s.players[0].spent-before,8);
 assert.equal(spirit.originalCard,card('craterize').id);assert.equal(s.board[17].uid,site);assert.equal(s.players[0].hand.length,0);assert.equal(s.choice,null);
});
test('Animist: Spirit still pays mana, threshold and minion summoning taxes',()=>{
 let s=state('animist'),h=hand(s,'fireball');s.players[0].bonusAffinity.fire=0;
 assert.ok(!legalActions(s,0).some(a=>a.hand===h.uid&&a.avatarForm==='spirit'),'threshold cannot be skipped');
 s=state('animist');h=hand(s,'fireball');s.players[0].spent=resources(s,0).available-3;
 assert.equal(resources(s,0).available,3);assert.ok(!legalActions(s,0).some(a=>a.hand===h.uid&&a.avatarForm==='spirit'),'insufficient mana cannot cast');
 s=state('animist');h=hand(s,'bless');s.board[0].card=card('mock_court').id;
 const a=legalActions(s,0).find(a=>a.hand===h.uid&&a.avatarForm==='spirit'&&a.at===17&&a.caster===avatar(s,0).uid);assert.ok(a);assert.equal(castingCost(s,0,castingCard(s,a),17,avatar(s,0),null,0,'surface',a),2);
 s=dispatch(s,a);const spirit=s.units.find(u=>card(u.card).finalAnimistSpirit);assert.equal(power(spirit),1);assert.equal(s.players[0].spent,2);
});
test('Animist: summoning discount changes payment but not printed-cost power',()=>{
 let s=state('animist'),h=hand(s,'fireball');s.board[17].card=card('town').id;const before=s.players[0].spent;s=castForm(s,h,'spirit').state;
 const spirit=s.units.find(u=>card(u.card).finalAnimistSpirit);assert.equal(power(spirit),4);assert.equal(s.players[0].spent-before,3);
});
test('Animist: X is selected before payment, can cancel, and becomes lasting Spirit power',()=>{
 let s=state('animist'),h=hand(s,'arcane_barrage');s=castForm(s,h,'spirit').state;assert.ok(s.choice.options.some(o=>o.value===7));assert.equal(s.players[0].spent,0);
 s=choose(s,v=>v===null);assert.ok(s.players[0].hand.some(v=>v.uid===h.uid));assert.equal(s.players[0].spent,0);
 s=castForm(s,h,'spirit').state;s=choose(s,v=>v===7);const spirit=s.units.find(u=>card(u.card).finalAnimistSpirit);assert.ok(spirit);assert.equal(power(spirit),7);assert.equal(s.players[0].spent,7);assert.equal(s.choice,null,'no Magic projectile should occur');
});
test('Animist: Spirit outlives Animist silence and returns as its original Magic',()=>{
 let s=state('animist'),h=hand(s,'fireball');s=castForm(s,h,'spirit').state;const spirit=s.units.find(u=>card(u.card).finalAnimistSpirit);avatar(s,0).mods.push({silenced:true});s=restoreGame(s);
 assert.equal(card(unit(s,spirit.uid).card).type,'Minion');s=effectOn(s,'returnHand',unit(s,spirit.uid));
 assert.ok(!unit(s,spirit.uid));assert.ok(s.players[0].hand.some(v=>v.card===card('fireball').id));assert.ok(!s.players[0].hand.some(v=>String(v.card).startsWith('runtime:')));
});
test('Animist: killed Spirit sends original Magic to the cemetery without resolving it',()=>{
 let s=state('animist'),h=hand(s,'craterize');s=castForm(s,h,'spirit').state;const spirit=s.units.find(u=>card(u.card).finalAnimistSpirit),before=s.board.map(site=>site?.uid);s=effectOn(s,'damage',spirit,{amount:10});
 assert.ok(!unit(s,spirit.uid));assert.ok(s.players[0].cemetery.includes(card('craterize').id));assert.deepEqual(s.board.map(site=>site?.uid),before);
});
test('Animist: runtime Spirit definitions reconstruct on a true registry reset before restoring a save',()=>{
 let s=state('animist'),h=hand(s,'arcane_barrage');s=castForm(s,h,'spirit').state;s=choose(s,v=>v===5);const saved=JSON.parse(JSON.stringify(s)),spirit=s.units.find(u=>card(u.card).finalAnimistSpirit),runtime=spirit.card;
 byId.delete(runtime);assert.equal(byId.has(runtime),false);s=restoreGame(saved);assert.equal(power(unit(s,spirit.uid)),5);assert.equal(card(unit(s,spirit.uid).card).type,'Minion');
});
test('Animist: basic copying a Spirit returns Selfsame to cemetery as a non-Minion, with no Magic effect',()=>{
 let s=state('animist'),h=hand(s,'fireball');s=castForm(s,h,'spirit').state;const spirit=s.units.find(u=>card(u.card).finalAnimistSpirit);h=hand(s,'selfsame_simulacrum');
 const a=legalActions(s,0).find(a=>a.type==='cast'&&a.hand===h.uid&&a.at===17&&a.caster===avatar(s,0).uid);assert.ok(a);s=dispatch(s,a);s=choose(s,v=>v?.uid===spirit.uid);
 assert.ok(unit(s,spirit.uid));assert.equal(s.units.length,3,'no illegal Magic object remains in realm');assert.ok(s.players[0].cemetery.includes(card('selfsame_simulacrum').id));assert.equal(s.choice,null,'copied Magic has no effect');
});
test('Avatar of Fire: activation grants later drawn fire sites the Fireball alternative only this turn',()=>{
 let s=state('avatar_of_fire');s.board[16]=null;const a=legalActions(s,0).find(a=>a.type==='activate'&&a.unit===avatar(s,0).uid);assert.ok(a);s=dispatch(s,a);assert.equal(avatar(s,0).tapped,true);
 const h=hand(s,'steppe'),earth=hand(s,'valley');assert.ok(legalActions(s,0).some(a=>a.hand===h.uid&&a.avatarForm==='fireball'));assert.ok(!legalActions(s,0).some(a=>a.hand===earth.uid&&a.avatarForm==='fireball'));
 avatar(s,0).tapped=false;const siteAction=legalActions(s,0).find(a=>a.type==='site'&&a.hand===h.uid&&a.at===16);assert.ok(siteAction,'site mode remains available when a legal site location exists');s=dispatch(s,siteAction);assert.equal(s.board[16].card,card('steppe').id);const later=hand(s,'arid_desert');s.turn++;
 assert.ok(!legalActions(s,0).some(a=>a.hand===later.uid&&a.avatarForm==='fireball'));
});
test('Avatar of Fire: Fireball direction cancellation preserves the Site and pays nothing',()=>{
 let s=state('avatar_of_fire');s=dispatch(s,legalActions(s,0).find(a=>a.type==='activate'&&a.unit===avatar(s,0).uid));const h=hand(s,'arid_desert');s=castForm(s,h,'fireball').state;
 assert.equal(s.players[0].spent,0);s=choose(s,v=>v===null);assert.ok(s.players[0].hand.some(v=>v.uid===h.uid&&v.card===card('arid_desert').id));assert.equal(s.players[0].spent,0);
});
test('Avatar of Fire: Fireball uses the actual spell cost and splash but sends the physical Site to cemetery',()=>{
 let s=state('avatar_of_fire');s=dispatch(s,legalActions(s,0).find(a=>a.type==='activate'&&a.unit===avatar(s,0).uid));const h=hand(s,'arid_desert'),target=add(s,'ancient_dragon',12,1),other=add(s,'wild_boars',12,1);
 const result=castForm(s,h,'fireball');assert.equal(castingCard(s,result.action).id,card('fireball').id);s=result.state;s=choose(s,v=>v===1);
 let limit=0;while(s.choice&&limit++<10)s=choose(s,(v)=>v?.uid===target.uid||v===target.uid||v===true);
 assert.equal(s.players[0].spent,4);assert.equal(unit(s,target.uid)?.damage,4);assert.ok(!unit(s,other.uid));assert.ok(s.players[0].cemetery.includes(card('arid_desert').id));assert.ok(!s.players[0].cemetery.includes(card('fireball').id));assert.ok(!s.players[0].hand.some(v=>v.uid===h.uid));
});

function grave(s,slug,p=0){s.players[p].cemetery.push(card(slug).id);return restoreGame(s);}
function castDead(s,slug,p=0,caster=avatar(s,0).uid,at=17){const a=legalActions(s,0).find(a=>a.type==='cast'&&a.deathspeaker&&a.card===card(slug).id&&a.graveOwner===p&&a.caster===caster&&a.at===at);assert.ok(a,'Deathspeaker copy source must be legal');return {action:a,state:dispatch(s,a)};}
test('Deathspeaker: enemy original is banished as cost; own token remains during Genesis and is banished afterward',()=>{
 let s=grave(state('deathspeaker'),'vile_imp',1);const target=add(s,'brown_bears',12,1);s=castDead(s,'vile_imp',1).state;
 const copy=s.units.find(u=>u.finalDeathspeakerOrigin);assert.ok(copy,'copy must remain in realm during its Genesis choice');assert.equal(copy.owner,0);assert.equal(copy.controller,0);assert.equal(copy.tokenCopy,true);
 assert.equal(copy.finalDeathspeakerOrigin.player,1);assert.ok(s.players[1].banished.includes(card('vile_imp').id));assert.ok(!s.players[1].cemetery.includes(card('vile_imp').id));assert.equal(s.players[0].spent,2);
 assert.ok(s.choice,'Genesis choice must happen before later banish');s=restoreGame(JSON.parse(JSON.stringify(s)));s=choose(s,v=>v?.uid===target.uid);
 assert.equal(unit(s,target.uid)?.damage,2);assert.ok(!unit(s,copy.uid));assert.ok(s.players[0].banished.includes(card('vile_imp').id),'token copy has its own controller/owner destination');
});
test('Deathspeaker: any allied Spellcaster may cast the copy, once per player turn',()=>{
 let s=grave(state('deathspeaker'),'land_surveyor',0);s=grave(s,'vile_imp',1);const wizard=add(s,'apprentice_wizard',12,0);const before=s.players[0].hand.length;s=castDead(s,'land_surveyor',0,wizard.uid).state;
 assert.equal(s.players[0].hand.length,before+1,'Genesis draws one site');assert.equal(s.players[0].finalDeathspeakerTurn,s.turn);assert.ok(!legalActions(s,0).some(a=>a.deathspeaker));
 s.turn++;s.players[0].spent=0;assert.ok(legalActions(s,0).some(a=>a.deathspeaker&&a.card===card('vile_imp').id),'permission renews on a later turn');
});
test('Deathspeaker: Death Door sets base mana cost to zero but keeps thresholds and mana-only extra costs',()=>{
 let s=grave(state('deathspeaker'),'vile_imp',0);s.players[0].doorTurn=s.turn;s.players[0].life=0;s.players[0].bonusAffinity.fire=0;
 assert.ok(!legalActions(s,0).some(a=>a.deathspeaker),'Death Door does not bypass fire threshold');
 s=grave(state('deathspeaker'),'land_surveyor',0);s.players[0].doorTurn=s.turn;s.players[0].life=0;s.board[0].card=card('mock_court').id;s.board[1].card=card('bureau_of_occult_control').id;
 s.players[0].spent=resources(s,0).available-3;const before=s.players[0].spent;const a=legalActions(s,0).find(a=>a.deathspeaker&&a.at===17&&a.caster===avatar(s,0).uid);assert.ok(a);assert.equal(castingCost(s,0,castingCard(s,a),17,avatar(s,0),null,0,'surface',a),1,'Mock Court summoning tax remains part of casting payment');assert.equal(zoneAccessCost(s,{card}),2,'cemetery access is a separate two-mana fee, not a discounted spell cost');
 s=dispatch(s,a);assert.equal(s.players[0].spent-before,3);assert.equal(s.players[0].life,0);assert.ok(s.players[0].banished.includes(card('land_surveyor').id));
});
test('Deathspeaker: unaffordable copies leave original cemetery cards untouched',()=>{
 let s=grave(state('deathspeaker'),'land_surveyor',1);s.players[0].spent=resources(s,0).available-1;
 const original=[...s.players[1].cemetery];assert.ok(!legalActions(s,0).some(a=>a.deathspeaker));assert.deepEqual(s.players[1].cemetery,original);assert.deepEqual(s.players[1].banished,[]);
});
test('Deathspeaker: Wormelow Tump protects the opposing cemetery and silenced source grants no permission',()=>{
 let s=grave(state('deathspeaker'),'land_surveyor',1);s.board[0].card=card('wormelow_tump').id;s.board[0].controller=1;s.players[1].bonusAffinity.earth=3;
 assert.ok(!legalActions(s,0).some(a=>a.deathspeaker&&a.graveOwner===1));
 s=grave(state('deathspeaker'),'land_surveyor',0);avatar(s,0).mods.push({silenced:true});s=restoreGame(s);assert.ok(!legalActions(s,0).some(a=>a.deathspeaker));
});
test('Deathspeaker: Order of the White Wing rejects the non-hand copy before Genesis',()=>{
 let s=grave(state('deathspeaker'),'vile_imp',1);const target=add(s,'brown_bears',12,1);add(s,'order_of_the_white_wing',17,0,{ward:true});s=castDead(s,'vile_imp',1).state;
 assert.equal(unit(s,target.uid).damage,0);assert.ok(!s.units.some(u=>u.finalDeathspeakerOrigin));assert.equal(s.choice,null);assert.ok(s.players[1].banished.includes(card('vile_imp').id));
});
test('Deathspeaker: Bottomless Pit can kill the entering token and resolve Deathrite before the release continuation',()=>{
 let s=grave(state('deathspeaker'),'muddy_pigs',1);s.players[0].life=10;s.board[17].card=card('bottomless_pit').id;s=castDead(s,'muddy_pigs',1).state;
 assert.equal(s.players[0].life,13,'entry kill triggers the actual Deathrite before release');assert.ok(!s.units.some(u=>u.finalDeathspeakerOrigin));assert.ok(s.players[1].banished.includes(card('muddy_pigs').id));assert.ok(!s.players[0].cemetery.includes(card('muddy_pigs').id),'token never turns into a physical cemetery card');
});

test('Animist: restore recreates a runtime definition referenced only by a suspended departed source',()=>{
 let s=state('animist'),h=hand(s,'fireball');s=castForm(s,h,'spirit').state;const spirit=structuredClone(s.units.find(u=>card(u.card).finalAnimistSpirit)),runtime=spirit.card;
 s=effectOn(s,'returnHand',spirit);assert.ok(!unit(s,spirit.uid));s.choice={player:0,title:'suspended granted draw',options:[{label:'continue',value:true}],frame:{source:spirit,controller:0,effectCard:runtime,step:{op:'draw',deck:'spells',count:1}}};
 const saved=JSON.parse(JSON.stringify(s)),before=s.players[0].hand.length;byId.delete(runtime);s=restoreGame(saved);s=choose(s,v=>v===true);
 assert.equal(s.players[0].hand.length,before+1);assert.ok(!unit(s,spirit.uid));assert.equal(card(runtime).type,'Minion');
});

test('Deathspeaker: a forged or stale grave-copy source descriptor is rejected',()=>{
 let s=grave(state('deathspeaker'),'land_surveyor',1);const a=legalActions(s,0).find(a=>a.deathspeaker&&a.graveOwner===1);assert.ok(a);
 assert.equal(castingCard(s,{...a,graveUid:'another-cemetery-visit'}),null);
 avatar(s,0).card=card('sorcerer').id;assert.equal(castingCard(s,a),null);
});

test('Deathspeaker: cemetery access remains a mana payment when casting mana is paid with life',()=>{
 let s=grave(state('deathspeaker'),'land_surveyor',0);s.board[0].card=card('bureau_of_occult_control').id;s.players[0].life=10;s.players[0].bloodManaTurn=s.turn;s.players[0].spent=resources(s,0).available-1;
 assert.ok(!legalActions(s,0).some(a=>a.deathspeaker),'one available mana cannot pay a two-mana cemetery access fee despite sufficient life');
 s.players[0].spent--;const before=s.players[0].spent;assert.equal(resources(s,0).available,2);s=castDead(s,'land_surveyor',0).state;
 assert.equal(s.players[0].spent-before,2);assert.equal(s.players[0].life,8);assert.ok(s.players[0].banished.includes(card('land_surveyor').id));
});

function finishMulligans(s){while(s.phase==='mulligan')s=dispatch(s,{type:'mulligan',player:s.mulligan,cards:[]});return s;}
function magicianDeck(){const d=starter();return {...d,name:'Magician test',avatar:card('magician').id,atlas:[],spells:[...d.spells,...d.atlas]};}
function pathfinderDeck(){return {...starter(),name:'Pathfinder test',avatar:card('pathfinder').id,atlas:cards.filter(c=>c.type==='Site'&&c.playable&&c.released).slice(0,30).map(c=>c.id)};}
function pathState(){const s=state('pathfinder');s.players[0].turnsTaken=2;s.players[0].finalHasPlayedSite=true;s.players[0].atlas=[card('valley').id,card('steppe').id];return s;}
function tapPath(s){const a=legalActions(s,0).find(a=>a.type==='activate'&&a.unit===avatar(s,0).uid&&definitions.pathfinder.activated[a.index].steps[0].op==='finalPathfinder');assert.ok(a,'Pathfinder activated ability must be integrated');return dispatch(s,a);}
test('Magician: deck validation accepts Site cards in Spellbook and requires no Atlas',()=>{
 const d=magicianDeck();assert.deepEqual(deckSizes(d),{atlas:0,spells:60});assert.deepEqual(validateDeck(d),[]);
 assert.ok(validateDeck({...d,atlas:[card('valley').id]}).some(e=>e.includes('沒有 Atlas')));
 assert.ok(validateDeck({...d,spells:d.spells.slice(0,59)}).some(e=>e.includes('至少需要 60')));
 assert.ok(validateDeck({...d,avatar:card('sorcerer').id}).some(e=>e.includes('牌庫類型錯誤')),'ordinary Avatar cannot put Site cards in Spellbook');
});
test('Magician: setup draws seven from Spellbook and saved state preserves the missing Atlas',()=>{
 const d=magicianDeck();let s=newGame([d,starter()],42,'local');assert.equal(s.players[0].hand.length,7);assert.equal(s.players[0].atlas.length,0);assert.equal(s.players[0].spells.length,d.spells.length-7);assert.equal(s.players[0].finalNoAtlas,true);
 s=restoreGame(JSON.parse(JSON.stringify(s)));s.phase='draw';s.active=0;assert.deepEqual(legalActions(s,0).map(a=>a.deck),['spells']);s=dispatch(s,{type:'draw',player:0,deck:'spells'});assert.equal(s.players[0].hand.length,8);
});
test('Magician: mulligan a physical Site back to Spellbook, never create an Atlas',()=>{
 let s=newGame([magicianDeck(),starter()],42,'local');const p=0;let h=s.players[p].hand.find(h=>card(h.card).type==='Site');
 if(!h){h=s.players[p].hand[0];const i=s.players[p].spells.findIndex(id=>card(id).type==='Site'),old=h.card;h.card=s.players[p].spells[i];s.players[p].spells[i]=old;}
 const id=h.card,before=s.players[p].spells.length;s=dispatch(s,{type:'mulligan',player:p,cards:[h.uid]});
 assert.equal(s.players[p].hand.length,7);assert.equal(s.players[p].atlas.length,0);assert.equal(s.players[p].spells.length,before);assert.equal(s.players[p].spells.at(-1),id);
});
test('Magician: printed tap ability only plays Sites; effects that draw Sites do not draw from Spellbook',()=>{
 let s=finishMulligans(newGame([magicianDeck(),starter()],42,'local'));s.active=0;s.players[0].hand=[];const h=hand(s,'valley');
 assert.ok(!legalActions(s,0).some(a=>a.type==='ability'&&a.mode==='atlas'));const siteAction=legalActions(s,0).find(a=>a.type==='site'&&a.hand===h.uid&&a.at===17);assert.ok(siteAction);s=dispatch(s,siteAction);assert.equal(s.board[17].card,card('valley').id);
 const before=s.players[0].hand.length,book=s.players[0].spells.length;s.choice={player:0,title:'draw site effect',options:[{label:'continue',value:true}],frame:{source:structuredClone(avatar(s,0)),controller:0,effectCard:card('land_surveyor').id,step:{op:'draw',deck:'atlas',count:1}}};s=choose(s,()=>true);
 assert.equal(s.players[0].hand.length,before);assert.equal(s.players[0].spells.length,book);assert.equal(s.winner,null);
});
test('Pathfinder: Atlas has no duplicate cards and setup draws only three Spellbook cards',()=>{
 const d=pathfinderDeck();assert.equal(d.atlas.length,30);assert.deepEqual(validateDeck(d),[]);const repeated={...d,atlas:[d.atlas[0],...d.atlas.slice(0,29)]};assert.ok(validateDeck(repeated).some(e=>e.includes('Atlas 不能含重複')));
 const s=newGame([d,starter()],42,'local');assert.equal(s.players[0].hand.length,3);assert.equal(s.players[0].atlas.length,30);assert.ok(s.players[0].hand.every(h=>card(h.card).type!=='Site'));
});
test('Pathfinder: the first Site on the personal first turn must be played under its Avatar',()=>{
 let s=finishMulligans(newGame([pathfinderDeck(),starter()],42,'local'));s.active=0;s.players[0].atlas=[card('valley').id,...s.players[0].atlas];s=tapPath(s);
 assert.equal(avatar(s,0).tapped,true);assert.deepEqual(s.choice.options.map(o=>o.value.at),[17]);s=choose(s,v=>v?.at===17);
 assert.equal(s.board[17].card,card('valley').id);assert.equal(avatar(s,0).at,17);assert.equal(s.players[0].finalHasPlayedSite,true);
});
test('Pathfinder: later plays a top Site adjacent to itself, then moves with carried artifacts after Genesis',()=>{
 let s=pathState();s.board[16]=null;s.players[0].atlas[0]=card('beacon').id;s.artifacts.push({uid:'path-item',card:card('sword_and_shield').id,owner:0,controller:0,at:17,bearer:avatar(s,0).uid,layer:'surface'});
 const before=s.players[0].atlas.length;s=tapPath(s);assert.ok(s.log.some(e=>e.text.includes('Pathfinder 揭示 Beacon')));s=restoreGame(JSON.parse(JSON.stringify(s)));s=choose(s,v=>v?.at===16);
 assert.equal(s.players[0].atlas.length,before-1);assert.equal(s.board[16].card,card('beacon').id);assert.equal(avatar(s,0).at,16);assert.equal(s.artifacts.find(a=>a.uid==='path-item').at,16);assert.equal(s.choice,null);
});
test('Pathfinder: surrounded by Sites may reveal, fail to play, and leave the card on top',()=>{
 let s=pathState();const id=s.players[0].atlas[0],length=s.players[0].atlas.length;s=tapPath(s);
 assert.equal(avatar(s,0).tapped,true);assert.equal(s.players[0].atlas[0],id);assert.equal(s.players[0].atlas.length,length);assert.equal(s.choice,null);assert.ok(s.log.some(e=>e.text.includes('Pathfinder 揭示')));
});
test('Pathfinder: no personal Sites on a later turn still permits an adjacent play, not a forced under-Avatar play',()=>{
 let s=pathState();s.board=Array(20).fill(null);s.players[0].finalHasPlayedSite=false;s.players[0].turnsTaken=3;s=tapPath(s);
 assert.ok(!s.choice.options.some(o=>o.value.at===17));assert.deepEqual(s.choice.options.map(o=>o.value.at).sort((a,b)=>a-b),[12,16,18]);
});
test('Pathfinder: cannot draw a Site or play an arbitrary Site from hand using its printed tap ability',()=>{
 const s=pathState(),h=hand(s,'valley');assert.ok(!legalActions(s,0).some(a=>a.type==='ability'&&a.mode==='atlas'));assert.ok(!legalActions(s,0).some(a=>a.type==='site'&&a.hand===h.uid));
});
test('Pathfinder: movement restriction does not undo the Site play',()=>{
 let s=pathState();s.board[16]=null;avatar(s,0).mods.push({keyword:'Immobile'});s=tapPath(s);s=choose(s,v=>v?.at===16);
 assert.equal(s.board[16].card,card('valley').id);assert.equal(avatar(s,0).at,17);assert.equal(s.players[0].atlas[0],card('steppe').id);
});
test('Pathfinder: Mirage may replace an adjacent owned controlled Site and returns that physical Site to hand',()=>{
 let s=pathState();s.players[0].atlas[0]=card('mirage').id;const old=s.board[16].card;s=tapPath(s);assert.ok(s.choice.options.some(o=>o.value.at===16));s=choose(s,v=>v?.at===16);
 assert.equal(s.board[16].card,card('mirage').id);assert.ok(s.players[0].hand.some(h=>h.card===old));assert.equal(s.players[0].atlas[0],card('steppe').id);assert.equal(avatar(s,0).at,16);
});
test('Pathfinder: Mirror Realm from top of Atlas keeps its normal copy choice without creating a hand card',()=>{
 let s=pathState();s.board[16]=null;s.players[0].atlas[0]=card('mirror_realm').id;const before=s.players[0].hand.length;s=tapPath(s);s=choose(s,v=>v?.at===16);
 assert.ok(s.choice,'Mirror Realm must still choose its copied Site');s=choose(s,v=>v===card('valley').id);
 assert.equal(s.board[16].card,card('valley').id);assert.equal(s.board[16].originalCard,card('mirror_realm').id);assert.equal(s.players[0].hand.length,before);assert.equal(s.players[0].atlas[0],card('steppe').id);assert.equal(avatar(s,0).at,16);
});

function archState(slugs=['divine_healing','overpower','bless'],owner=0){let s=state('archimago');s.players[owner].cemetery=slugs.map(slug=>card(slug).id);return restoreGame(s);}
function startArch(s){const a=legalActions(s,0).find(a=>a.type==='activate'&&a.unit===avatar(s,0).uid&&definitions.archimago.activated[a.index].steps[0].op==='finalArchimago');assert.ok(a,'Archimago activated ability must be integrated');return dispatch(s,a);}
function payArch(s,slugs=[]){s=startArch(s);for(let i=0;i<3;i++)s=choose(s,v=>v?.entity==='grave'&&(!slugs[i]||v.card===card(slugs[i]).id));return s;}
function copySpell(s,slug,caster=avatar(s,0).uid){return choose(s,v=>v?.type==='cast'&&v.card===card(slug).id&&v.caster===caster);}
test('Archimago: three physical Magic costs are banished; one paid copy resolves and never returns the original',()=>{
 let s=archState();s.players[0].life=10;const beforeHand=s.players[0].hand.length;s=payArch(s);
 assert.equal(s.players[0].cemetery.length,0);assert.equal(s.players[0].banished.length,3);assert.equal(s.players[0].spent,0);assert.equal(s.choice.frame.step.op,'finalAvatarCopyWindow');
 s=copySpell(s,'divine_healing');assert.equal(s.players[0].life,17);assert.equal(s.players[0].spent,1);assert.equal(s.players[0].hand.length,beforeHand);assert.equal(s.players[0].cemetery.length,0);
 const permit=s.finalAvatarCopies.at(-1);assert.equal(permit.used,true);assert.equal(permit.active,false);assert.equal(permit.copiedCard,card('divine_healing').id);assert.equal(s.players[0].banished.filter(id=>id===card('divine_healing').id).length,2,'physical original and resolved token copy remain distinct banished instances');
});
test('Archimago: selecting costs can cancel before any card, mana, or Stealth payment',()=>{
 let s=archState();avatar(s,0).stealth=true;const original=[...s.players[0].cemetery];s=startArch(s);s=choose(s,v=>v?.entity==='grave');s=choose(s,v=>v?.entity==='grave');
 assert.equal(s.players[0].spent,0);assert.deepEqual(s.players[0].cemetery,original);s=choose(s,v=>v===null);
 assert.deepEqual(s.players[0].cemetery,original);assert.equal(s.players[0].banished.length,0);assert.equal(s.players[0].spent,0);assert.equal(avatar(s,0).stealth,true);assert.equal((s.finalAvatarCopies||[]).length,0);
});
test('Archimago: three duplicate Magic names may pay as three different cemetery instances and survive saved declaration',()=>{
 let s=archState(['divine_healing','divine_healing','divine_healing']);s=startArch(s);const first=s.choice.options.find(o=>o.value?.entity==='grave').value;s=choose(s,v=>v?.uid===first.uid);assert.ok(!s.choice.options.some(o=>o.value?.uid===first.uid));
 s=restoreGame(JSON.parse(JSON.stringify(s)));s=choose(s,v=>v?.entity==='grave');s=choose(s,v=>v?.entity==='grave');assert.equal(s.players[0].banished.length,3);assert.equal(new Set(s.finalAvatarCopies[0].originals.map(g=>g.uid)).size,3);
 s=copySpell(s,'divine_healing');assert.equal(s.finalAvatarCopies[0].used,true);
});
test('Archimago: paying three costs with no affordable copy leaves all three banished and casts nothing',()=>{
 let s=archState();s.players[0].spent=resources(s,0).available;const before=s.players[0].spent;s=payArch(s);
 assert.equal(s.players[0].cemetery.length,0);assert.equal(s.players[0].banished.length,3);assert.equal(s.players[0].spent,before);assert.equal(s.finalAvatarCopies[0].used,false);assert.equal(s.finalAvatarCopies[0].active,false);assert.equal(s.choice,null);
 assert.ok(!s.log.some(e=>e.text.startsWith('施放 ')));
});
test('Archimago: copies still require threshold and may be cast by a different allied Spellcaster',()=>{
 let s=archState(['fireball','immolation','charge']);s.players[0].bonusAffinity.fire=0;s=payArch(s);assert.equal(s.finalAvatarCopies[0].used,false);assert.equal(s.players[0].spent,0);assert.equal(s.players[0].banished.length,3);
 s=archState();const wizard=add(s,'apprentice_wizard',12,0);s=payArch(s);s=copySpell(s,'divine_healing',wizard.uid);assert.equal(s.finalAvatarCopies[0].castBy,wizard.uid);assert.equal(s.players[0].spent,1);
});
test('Archimago: cancelling a Fireball direction returns to the mandatory saved copy window without consuming a copy',()=>{
 let s=archState(['fireball','overpower','bless']);s=payArch(s);s=copySpell(s,'fireball');assert.equal(s.choice.frame.step.op,'commitSpell');assert.equal(s.players[0].spent,0);
 s=choose(s,v=>v===null);assert.equal(s.choice.frame.step.op,'finalAvatarCopyWindow');assert.equal(s.finalAvatarCopies[0].used,false);s=restoreGame(JSON.parse(JSON.stringify(s)));s=copySpell(s,'fireball');s=choose(s,v=>v===1);
 let limit=0;while(s.choice&&limit++<20)s=choose(s,()=>true);assert.equal(s.finalAvatarCopies[0].used,true);assert.equal(s.players[0].spent,4);assert.equal(s.choice,null);
});
test('Archimago: ability is repeatable when three more Magic costs remain',()=>{
 let s=archState(['divine_healing','overpower','bless','divine_healing','overpower','bless']);s=payArch(s);s=copySpell(s,'divine_healing');assert.equal(s.players[0].cemetery.length,3);
 s=payArch(s);s=copySpell(s,'divine_healing');assert.equal(s.finalAvatarCopies.length,2);assert.ok(s.finalAvatarCopies.every(p=>p.used));assert.equal(s.players[0].spent,2);assert.equal(avatar(s,0).tapped,false,'Archimago copy ability has no Tap or once-per-turn cost');
});
test('Archimago: Bureau charges once for the three-card cost and the entire copied effect',()=>{
 let s=archState();s.board[0].card=card('bureau_of_occult_control').id;s=payArch(s);assert.equal(s.players[0].spent,2,'one cemetery access, not three');s=copySpell(s,'divine_healing');assert.equal(s.players[0].spent,3,'copy pays its normal spell cost in addition to one access');
});
test('Archimago: odd Mortuary swaps your cemetery view but physical owner is preserved when paying costs',()=>{
 let s=archState(['divine_healing','overpower','bless'],1);s.players[0].cemetery=[card('wild_boars').id];s.board[0].card=card('mismanaged_mortuary').id;s=restoreGame(s);s=startArch(s);assert.ok(s.choice.options.filter(o=>o.value?.entity==='grave').every(o=>o.value.player===1));
 for(let i=0;i<3;i++)s=choose(s,v=>v?.entity==='grave');assert.equal(s.players[1].banished.length,3);assert.equal(s.players[0].cemetery[0],card('wild_boars').id);s=copySpell(s,'divine_healing');assert.equal(s.finalAvatarCopies[0].player,0);assert.equal(s.players[1].cemetery.length,0);
});
test('Archimago: Valor and Dodge Roll may pay Magic costs but cannot be cast by this Main Phase ability',()=>{
 let s=archState(['valor','dodge_roll','divine_healing']);s=payArch(s);assert.ok(s.choice.options.every(o=>!['valor','dodge_roll'].includes(card(o.value.card).slug)));s=copySpell(s,'divine_healing');assert.equal(s.finalAvatarCopies[0].copiedCard,card('divine_healing').id);
});

function openCopyWindow(s,p,id,source,options={}){
 const permit=createFinalAvatarCopyPermit(s,p,[id],source,options);queueFinalAvatarCopyWindow(s,permit,source,{queueEffects});
 s.choice={player:p,title:'resolve queued copy permission',options:[{label:'continue',value:true}],frame:{source:structuredClone(source),controller:p,effectCard:source.card,step:{op:'gainMana',amount:0}}};
 return {state:choose(s,v=>v===true),permit:permit.uid};
}
test('generic copy: opponent-turn free casting ignores threshold without granting a mana pool or changing the active player',()=>{
 let s=state('sorcerer');s.players[1].spent=5;s.players[1].bonusAffinity={air:0,earth:0,fire:0,water:0};const source=avatar(s,1),target=avatar(s,0);const opened=openCopyWindow(s,1,card('fireball').id,source,{kind:'free test',free:true,ignoreThreshold:true,caster:source.uid});s=opened.state;
 assert.equal(s.active,0);assert.equal(resources(s,1).available,0);assert.ok(s.choice.options.every(o=>o.value.caster===source.uid));s=choose(s,v=>v.avatarCopy===opened.permit);s=choose(s,v=>v===3);
 let limit=0;while(s.choice&&limit++<20)s=choose(s,v=>v?.uid===target.uid||v===target.uid||v===true);
 assert.equal(s.players[0].life,16);assert.equal(s.players[1].spent,5);assert.equal(s.active,0);assert.equal(resources(s,1).available,0);assert.equal(s.finalAvatarCopies.at(-1).used,true);
});
test('generic copy: preview never invents opponent-turn mana to pay an additional summoning tax',()=>{
 let s=state('sorcerer');s.board[0].card=card('mock_court').id;const source=avatar(s,1);const opened=openCopyWindow(s,1,card('wild_boars').id,source,{kind:'taxed free test',free:true,ignoreThreshold:true,caster:source.uid});s=opened.state;
 assert.equal(s.choice,null,'no cast is affordable when one mana of extra summoning tax is required');assert.equal(s.finalAvatarCopies.at(-1).used,false);assert.equal(s.finalAvatarCopies.at(-1).active,false);assert.ok(!s.units.some(u=>u.finalAvatarCopyOrigin));assert.equal(s.players[1].spent,0);
});
test('generic copy: a fixed Site spellcaster retains its declared subsurface layer',()=>{
 let s=state('sorcerer');s.board[2].card=card('lone_tower').id;s.board[2].towerMagicTurn=s.turn;const source=spellcaster(s,'site:2','below');const opened=openCopyWindow(s,1,card('fireball').id,source,{kind:'site copy test',free:true,ignoreThreshold:true,caster:source.uid,casterLayer:'below'});s=opened.state;
 assert.ok(s.choice.options.length);assert.ok(s.choice.options.every(o=>o.value.caster==='site:2'&&o.value.casterLayer==='below'));const action=s.choice.options[0].value;assert.equal(castingCard(s,{...action,casterLayer:'surface'}),null);
 s=choose(s,v=>v.avatarCopy===opened.permit);s=choose(s,v=>v===3);assert.equal(s.finalAvatarCopies.at(-1).used,true);assert.equal(s.players[1].spent,0);assert.equal(s.players[0].life,20,'subsurface projectile does not hit surface Avatar');
});
test('generic copy: a permanent Minion copy stays in the realm and remains a token when returned',()=>{
 let s=state('sorcerer');const source=avatar(s,0);const opened=openCopyWindow(s,0,card('wild_boars').id,source,{kind:'permanent copy test',free:true,ignoreThreshold:true,caster:source.uid});s=opened.state;s=choose(s,v=>v.avatarCopy===opened.permit&&v.at===17);
 const copy=s.units.find(u=>u.finalAvatarCopyOrigin);assert.ok(copy);assert.equal(copy.tokenCopy,true);assert.equal(copy.finalAvatarCopyOrigin.permit,opened.permit);assert.equal(s.players[0].spent,0);
 s=effectOn(s,'returnHand',copy);assert.ok(!unit(s,copy.uid));assert.ok(!s.players[0].hand.some(h=>h.card===card('wild_boars').id));assert.ok(s.players[0].banished.includes(card('wild_boars').id));
});

function castMephisto(s){const h=hand(s,'mephistopheles');const a=legalActions(s,0).find(a=>a.type==='cast'&&a.hand===h.uid&&a.at===avatar(s,0).at);assert.ok(a,'Mephistopheles cast must be legal at the owned Avatar site');return dispatch(s,a);}
test('Mephistopheles: casting replaces the Avatar atomically and preserves current and maximum life',()=>{
 let s=state('sorcerer');const old=avatar(s,0).uid;s.players[0].life=13;s.players[0].maxLife=25;s=castMephisto(s);const replacement=avatar(s,0),c=card(replacement.card);
 assert.notEqual(replacement.uid,old);assert.ok(!unit(s,old));assert.ok(s.players[0].banished.includes(card('sorcerer').id));assert.equal(c.type,'Avatar');assert.equal(c.rarity,'Unique');assert.ok(c.subtypes.includes('Demon'));assert.equal(c.air,3);assert.equal(power(replacement),4);assert.equal(s.players[0].life,13);assert.equal(s.players[0].maxLife,25);assert.equal(c.life,25);assert.equal(s.players[0].spent,6);assert.equal(s.winner,null);
});
test('Mephistopheles: casting restrictions require both the Avatar location and a controlled Site',()=>{
 let s=state('sorcerer');const h=hand(s,'mephistopheles');const actions=legalActions(s,0).filter(a=>a.hand===h.uid);assert.ok(actions.length);assert.ok(actions.every(a=>a.at===17&&(a.layer||'surface')==='surface'));
 s.board[17].controller=1;assert.ok(!legalActions(s,0).some(a=>a.hand===h.uid));s.board[17].controller=0;s.players[0].bonusAffinity.air=2;assert.ok(!legalActions(s,0).some(a=>a.hand===h.uid));
});
test('Mephistopheles: restored runtime Avatar stays an Avatar and has no inherited normal Site ability',()=>{
 let s=castMephisto(state('sorcerer'));const id=avatar(s,0).card;byId.delete(id);s=restoreGame(JSON.parse(JSON.stringify(s)));assert.equal(card(avatar(s,0).card).type,'Avatar');const h=hand(s,'valley');avatar(s,0).tapped=false;assert.ok(!legalActions(s,0).some(a=>a.type==='site'&&a.hand===h.uid));assert.ok(!legalActions(s,0).some(a=>a.type==='activate'&&a.unit===avatar(s,0).uid&&/抽|地點/.test(a.label||'')));
 const magic=hand(s,'divine_healing');assert.ok(legalActions(s,0).some(a=>a.type==='cast'&&a.hand===magic.uid&&a.caster===avatar(s,0).uid),'Avatar retains its Spellcaster characteristic');
});
test('Mephistopheles: non-cast summoning keeps the original Avatar and the summoned card a Minion',()=>{
 let s=state('sorcerer');const old=avatar(s,0).uid;s=effectOn(s,'summon',avatar(s,0),{slug:'mephistopheles'});assert.equal(avatar(s,0).uid,old);const m=s.units.find(u=>card(u.card).slug==='mephistopheles');assert.ok(m);assert.equal(card(m.card).type,'Minion');assert.equal(s.players[0].banished.length,0);
});
test('Mephistopheles: Evil hand summoning offers enemy adjacent Sites, pays only entry tax, and is once per turn',()=>{
 let s=castMephisto(state('sorcerer'));const h=hand(s,'vile_imp');s.board[12].controller=1;s.board[0].card=card('mock_court').id;const before=s.players[0].spent;const a=legalActions(s,0).find(a=>a.type==='activate'&&a.unit===avatar(s,0).uid);assert.ok(a);s=dispatch(s,a);assert.ok(s.choice.options.some(o=>o.value?.hand===h.uid&&o.value.at===12));s=choose(s,v=>v?.hand===h.uid&&v.at===12);
 assert.equal(s.players[0].spent,before+1);assert.ok(s.units.some(u=>u.card===card('vile_imp').id&&u.at===12));assert.ok(!s.players[0].hand.some(v=>v.uid===h.uid));assert.ok(!legalActions(s,0).some(a=>a.type==='activate'&&a.unit===avatar(s,0).uid));
});
test('Mephistopheles: Order and Saint cannot treat the cast replacement as a Minion',()=>{
 let s=state('sorcerer');add(s,'order_of_the_white_wing',17,0);add(s,'saint_of_redemption',17,1);s=castMephisto(s);assert.equal(card(avatar(s,0).card).slug,'mephistopheles');assert.equal(avatar(s,0).tapped,false);assert.ok(unitTypes(avatar(s,0)).includes('Demon'));assert.equal(s.winner,null);
});
test('Mephistopheles: Deathspeaker release cannot banish the resulting Avatar',()=>{
 let s=grave(state('deathspeaker'),'mephistopheles',1);add(s,'order_of_the_white_wing',17,0);s.players[0].life=11;s=castDead(s,'mephistopheles',1).state;assert.equal(s.choice,null);const m=avatar(s,0);assert.equal(card(m.card).slug,'mephistopheles');assert.equal(card(m.card).type,'Avatar');assert.equal(m.tokenCopy,true);assert.ok(m.finalDeathspeakerOrigin);assert.equal(s.players[0].life,11);assert.equal(s.winner,null);assert.ok(s.players[1].banished.includes(card('mephistopheles').id));assert.ok(s.players[0].banished.includes(card('deathspeaker').id));
});
test('Mephistopheles: cancelling the declared Evil summon spends neither mana nor the once permission',()=>{
 let s=castMephisto(state('sorcerer'));hand(s,'vile_imp');const before=s.players[0].spent;let a=legalActions(s,0).find(a=>a.type==='activate'&&a.unit===avatar(s,0).uid);s=dispatch(s,a);s=choose(s,v=>v===null);assert.equal(s.players[0].spent,before);a=legalActions(s,0).find(a=>a.type==='activate'&&a.unit===avatar(s,0).uid);assert.ok(a);s=dispatch(s,a);s=choose(s,v=>v?.at===12);assert.equal(s.players[0].spent,before);assert.ok(s.units.some(u=>u.card===card('vile_imp').id));
});
test('Mephistopheles: summoning a second Mephistopheles from hand does not replace the Avatar',()=>{
 let s=castMephisto(state('sorcerer'));const old=avatar(s,0).uid,h=hand(s,'mephistopheles'),before=s.players[0].spent;const a=legalActions(s,0).find(a=>a.type==='activate'&&a.unit===old);s=dispatch(s,a);s=choose(s,v=>v?.hand===h.uid&&v.at===12);assert.equal(avatar(s,0).uid,old);const minion=s.units.find(u=>u.uid!==old&&card(u.card).slug==='mephistopheles');assert.ok(minion);assert.equal(card(minion.card).type,'Minion');assert.equal(s.players[0].spent,before);assert.equal(s.players[0].banished.filter(id=>id===card('sorcerer').id).length,1);
});
test('Mephistopheles: Bottomless Pit cannot kill the cast Avatar but kills a normally summoned Minion',()=>{
 let s=state('sorcerer');s.board[17].card=card('bottomless_pit').id;s=castMephisto(s);assert.equal(card(avatar(s,0).card).slug,'mephistopheles');assert.equal(s.winner,null);
 s=state('sorcerer');s.board[17].card=card('bottomless_pit').id;s=effectOn(s,'summon',avatar(s,0),{slug:'mephistopheles'});assert.equal(card(avatar(s,0).card).slug,'sorcerer');assert.ok(!s.units.some(u=>card(u.card).slug==='mephistopheles'));assert.ok(s.players[0].cemetery.includes(card('mephistopheles').id));
});
