import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {install,card,runtimeCard,starter} from '../src/cards.js';
import {newGame,unit,power,keywords,disabled,unitTypes,resources,dispatch,legalActions,restoreGame,canDropArtifact,ready} from '../src/engine.js';
import {passives} from '../src/definitions.js';
import {occupied,canEnterOnGround,taxicab,region} from '../src/geography.js';
import {prepareFinalArtifacts,finishFinalArtifacts,resolveFinalArtifacts,finalArtifactPassives,
  finalCageForceAllowed,finalEggPreventsDeathblow,endFinalArtifacts,finalCatapultAvailable,
  registerFinalArtifactCards,finalArtifactPending,finalArtifactDefinitions} from '../src/final-artifacts.js';

install(JSON.parse(fs.readFileSync(new URL('../data/official-cards.json',import.meta.url))));
function state(){const s=newGame([starter(),starter()],42,'local');s.turn=5;s.active=0;s.phase='main';s.units=[];s.artifacts=[];s.auras=[];s.storyline=[];s.choice=null;s.board=Array.from({length:20},(_,at)=>({uid:'site'+at,card:card('valley').id,owner:at<10?1:0,controller:at<10?1:0}));return s;}
function add(s,slug,at=12,p=0,extra={}){const u={uid:'u'+s.next++,card:card(slug).id,at,owner:p,controller:p,born:0,damage:0,mods:[],tapped:false,...extra};s.units.push(u);return u;}
function item(s,slug,at=12,p=0,bearer=null){const a={uid:'a'+s.next++,card:card(slug).id,at,owner:p,controller:p,bearer,layer:'surface'};s.artifacts.push(a);return a;}
const A={card,runtimeCard,unit,power,keywords,disabled,unitTypes,resources,occupied,canEnterOnGround,
  region:(s,u)=>region(s,u,card),
  passives:{...passives,...finalArtifactPassives},unmodifiable:u=>!!u.finalTabula||passives[card(u.card).slug]?.unmodifiable,
  fiftyForceAllowed:(s,u)=>!passives[card(u.card).slug]?.cannotForce,
  graveEntries:(s,p)=>s.players[p].cemetery.map((id,index)=>({uid:'grave'+index,card:id,player:p,index})),
  takeGrave(s,p,index){return s.players[p].cemetery.splice(index,1)[0];},
  queueEffects(s,steps,source,controller,effectCard){s.storyline.push(...steps.map(step=>({step,source,controller,effectCard})));},
  selectEffects(s,{source}){return Array.from({length:20},(_,at)=>({label:String(at),value:{at,layer:'surface'}}));},
  hurt(s,u,n){if(u.ward)u.ward=false;else u.damage+=n;},
};
const run=(s,object,op,selected,extra={})=>resolveFinalArtifacts(s,{step:{op,...extra},source:object,controller:object.controller,selected,effectCard:object.card},A);
function choose(s,value){const f=s.choice.frame;s.choice=null;assert.ok(resolveFinalArtifacts(s,{...f,selected:value},A));}
function next(s){const f=s.storyline.pop();assert.ok(f);assert.ok(resolveFinalArtifacts(s,f,A));}

test('final artifacts: Cage globally teleports weak minions, not Avatars, strong or immutable minions',()=>{
 const s=state(),cage=item(s,'cage_of_sidrak',12),weak=add(s,'wild_boars',2,1),strong=add(s,'brown_bears',3,1),av=add(s,'sorcerer',2,1),monk=add(s,'monks_of_kobalsa',4,1);
 weak.mods.push({set:2});strong.mods.push({set:4});
 run(s,cage,'finalCage');
 assert.equal(weak.at,12);assert.equal(weak.tapped,true);assert.equal(weak.effectDisabled,true);assert.equal(weak.finalCage.uid,cage.uid);
 assert.equal(strong.at,3);assert.equal(av.at,2);assert.equal(monk.at,4);
});
test('final artifacts: Cage carries prisoners when moved, teleport releases them, removal frees them',()=>{
 const s=state(),cage=item(s,'cage_of_sidrak'),u=add(s,'wild_boars');u.mods.push({set:2});run(s,cage,'finalCage');
 cage.at=13;prepareFinalArtifacts(s,A);finishFinalArtifacts(s,A);assert.equal(u.at,13);assert.equal(u.finalCaged,true);
 assert.equal(finalCageForceAllowed(u),false);assert.equal(finalCageForceAllowed(u,true),true);
 u.at=14;finishFinalArtifacts(s,A);assert.equal(u.finalCage,undefined);
 u.at=13;run(s,cage,'finalCage');s.artifacts=[];finishFinalArtifacts(s,A);assert.equal(u.finalCage,undefined);
});
test('final artifacts: Cage lock remains even if its prisoner grows stronger later',()=>{
 const s=state(),cage=item(s,'cage_of_sidrak'),u=add(s,'wild_boars');u.mods=[{set:1}];run(s,cage,'finalCage');u.mods=[{set:9}];
 prepareFinalArtifacts(s,A);finishFinalArtifacts(s,A);assert.equal(u.finalCaged,true);assert.equal(u.tapped,true);
});
test('final artifacts: Tabula silences and rejects bonuses, Ward and keyword grants; removal restores printed identity',()=>{
 const s=state(),u=add(s,'cherubim'),tabula=item(s,'tabula_rasa',12,0,u.uid);
 u.mods=[{power:9,keyword:'Voidwalk'}];u.ward=true;u.grantedKeywords=['Charge'];prepareFinalArtifacts(s,A);finishFinalArtifacts(s,A);
 assert.equal(u.silenced,true);assert.deepEqual(u.mods,[]);assert.equal(u.ward,false);assert.deepEqual(u.grantedKeywords,[]);assert.equal(u.card,card('cherubim').id);assert.equal(u.finalTabula,true);
 s.artifacts=s.artifacts.filter(a=>a.uid!==tabula.uid);prepareFinalArtifacts(s,A);assert.equal(u.finalTabula,false);
});
test('final artifacts: Tombstone becomes a five power Angel Automaton only on opponent turn and preserves UID',()=>{
 const s=state(),a=item(s,'tombstone_wardens',12,0);const uid=a.uid;s.active=1;prepareFinalArtifacts(s,A);
 const u=unit(s,uid);assert.ok(u);assert.equal(s.artifacts.some(a=>a.uid===uid),false);assert.equal(card(u.card).type,'Minion');assert.equal(card(u.card).artifactUnit,true);
 assert.equal(power(u),5);assert.ok(unitTypes(u).includes('Angel'));assert.ok(keywords(u).includes('Airborne'));
 assert.equal(ready(s,u),true,'Animation does not newly summon the artifact or impose sickness');
 u.damage=2;s.active=0;prepareFinalArtifacts(s,A);assert.equal(unit(s,uid),undefined);const restored=s.artifacts.find(a=>a.uid===uid);assert.equal(restored.card,card('tombstone_wardens').id);assert.equal(restored.owner,0);
});
test('final artifacts: deterministic Tombstone runtime card can be re-registered after install for saved-game reload',()=>{
 const id=registerFinalArtifactCards(card,runtimeCard);install(JSON.parse(fs.readFileSync(new URL('../data/official-cards.json',import.meta.url))));
 assert.equal(registerFinalArtifactCards(card,runtimeCard),id);assert.equal(card(id).attack,5);
});
test('final artifacts: silenced Tombstone does not animate',()=>{
 const s=state(),a=item(s,'tombstone_wardens');a.silenced=true;s.active=1;prepareFinalArtifacts(s,A);assert.equal(s.units.length,0);assert.ok(s.artifacts.includes(a));
});
test('final artifacts: Tombstone uses controller, and silence cannot undo already resolved Cage or Egg Genesis',()=>{
 const s=state(),a=item(s,'tombstone_wardens',12,0);a.controller=1;s.active=1;prepareFinalArtifacts(s,A);assert.ok(s.artifacts.includes(a));s.active=0;prepareFinalArtifacts(s,A);assert.ok(unit(s,a.uid));
 const cage=item(s,'cage_of_sidrak'),weak=add(s,'grain_sparrow');run(s,cage,'finalCage');cage.silenced=true;prepareFinalArtifacts(s,A);finishFinalArtifacts(s,A);assert.equal(weak.finalCaged,true);
 const av=add(s,'sorcerer'),egg=item(s,'koscheis_egg',12,0,av.uid);run(s,egg,'finalEgg');egg.silenced=true;assert.equal(finalEggPreventsDeathblow(s,0),true);
});
test('final artifacts: Egg Genesis binds only an Avatar bearer, and persists independently of dropping it',()=>{
 const s=state(),av=add(s,'sorcerer'),egg=item(s,'koscheis_egg',12,0,av.uid);run(s,egg,'finalEgg');
 assert.equal(finalEggPreventsDeathblow(s,0),true);egg.bearer=null;assert.equal(finalEggPreventsDeathblow(s,0),true);assert.equal(finalEggPreventsDeathblow(s,1),false);
 const minion=add(s,'wild_boars'),other=item(s,'koscheis_egg',12,1,minion.uid);run(s,other,'finalEgg');assert.equal(s.finalEggBonds.length,1);
});
test('final artifacts: Egg leaving realm loses immediately; lack of Genesis binding does not',()=>{
 const s=state(),av=add(s,'sorcerer'),egg=item(s,'koscheis_egg',12,0,av.uid);run(s,egg,'finalEgg');s.artifacts=[];finishFinalArtifacts(s,A);assert.equal(s.winner,1);assert.equal(s.phase,'over');
 const t=state();item(t,'koscheis_egg');t.artifacts=[];finishFinalArtifacts(t,A);assert.equal(t.winner,null);
});
test('final artifacts: Egg counts each owner end phase, including the turn of Genesis, not opponent turns',()=>{
 const s=state(),av=add(s,'sorcerer'),egg=item(s,'koscheis_egg',12,0,av.uid);run(s,egg,'finalEgg');
 for(let i=1;i<=3;i++){s.turn=3+i*2;endFinalArtifacts(s,1,A);assert.equal(s.finalEggBonds[0].turns,i-1);endFinalArtifacts(s,0,A);assert.equal(s.finalEggBonds[0].turns,i);assert.equal(s.winner,i===3?1:null);}
});
test('final artifacts: Catapult requires an untapped bearer, another ready ally and a dead minion',()=>{
 const s=state(),u=add(s,'sorcerer'),a=item(s,'corpse_catapult',12,0,u.uid);assert.equal(finalCatapultAvailable(s,a,0,A),false);
 const crew=add(s,'wild_boars');s.players[1].cemetery.push(card('brown_bears').id);assert.equal(finalCatapultAvailable(s,a,0,A),true);
 crew.tapped=true;assert.equal(finalCatapultAvailable(s,a,0,A),false);crew.tapped=false;u.tapped=true;assert.equal(finalCatapultAvailable(s,a,0,A),false);
});
test('final artifacts: Catapult cancellation leaves all costs unpaid',()=>{
 const s=state(),u=add(s,'sorcerer'),crew=add(s,'wild_boars'),a=item(s,'corpse_catapult',12,0,u.uid);s.players[1].cemetery.push(card('brown_bears').id);
 run(s,u,'finalCatapult');choose(s,null);assert.equal(u.tapped,false);assert.equal(crew.tapped,false);assert.equal(s.players[1].cemetery.length,1);assert.equal(s.players[1].banished.length,0);
});
test('final artifacts: Catapult pays both taps and corpse once, hits all units at location and respects three-step range',()=>{
 const s=state(),u=add(s,'sorcerer'),crew=add(s,'wild_boars'),a=item(s,'corpse_catapult',12,0,u.uid),enemy=add(s,'brown_bears',14,1),ally=add(s,'brown_bears',14),far=add(s,'brown_bears',4,1);s.players[1].cemetery.push(card('brown_bears').id);
 run(s,u,'finalCatapult');choose(s,crew.uid);next(s);const grave=s.choice.options.find(o=>o.value!==null).value;choose(s,grave);next(s);
 assert.ok(s.choice.options.filter(o=>o.value!==null).every(o=>taxicab(12,o.value.at)<=3));choose(s,{at:14,layer:'surface'});
 assert.equal(u.tapped,true);assert.equal(crew.tapped,true);assert.equal(s.players[1].cemetery.length,0);assert.equal(s.players[1].banished[0],card('brown_bears').id);
 assert.equal(enemy.damage,card('brown_bears').attack);assert.equal(ally.damage,card('brown_bears').attack);assert.equal(far.damage,0);
});
test('final artifacts: Key and Pallid have concrete production definitions after source and layer integration',()=>{
 assert.equal(finalArtifactPending.the_pallid_bust,undefined);assert.equal(card('the_pallid_bust').playable,true);assert.deepEqual(finalArtifactDefinitions.the_pallid_bust.genesis,[{op:'finalPallidBust'}]);assert.equal(finalArtifactPending.key_to_the_city,undefined);assert.equal(card('key_to_the_city').playable,true);assert.equal(finalArtifactPassives.key_to_the_city.protectedFromSites,true);
});

test('final artifacts: Doomsday has six counters and detonates once on sixth end phase using verified damage grid',()=>{
 const s=state(),d=item(s,'doomsday_device',12),center=add(s,'brown_bears',12),near=add(s,'brown_bears',13),far=add(s,'brown_bears',14),corner=add(s,'brown_bears',0),below=add(s,'bone_rabble',12,1,{layer:'below'});
 prepareFinalArtifacts(s,A);assert.equal(d.finalDoomCounters,6);
 for(let i=0;i<5;i++){run(s,d,'finalDoomsday');assert.equal(center.damage,0);}
 run(s,d,'finalDoomsday');assert.equal(d.finalDoomCounters,0);assert.equal(center.damage,20);assert.equal(near.damage,8);assert.equal(far.damage,4);assert.equal(corner.damage,0);assert.equal(below.damage,0);
 run(s,d,'finalDoomsday');assert.equal(center.damage,20);
});
test('final artifacts: Doomsday adds damage for every oversized occupied square and clips edges without wrapping',()=>{
 const s=state(),d=item(s,'doomsday_device',12),giant=add(s,'mountain_giant',6,1,{size:2});d.finalDoomCounters=1;run(s,d,'finalDoomsday');assert.equal(giant.damage,4+8+8+20);
 const t=state(),edge=item(t,'doomsday_device',0),wrap=add(t,'brown_bears',4),actual=add(t,'brown_bears',1);edge.finalDoomCounters=1;run(t,edge,'finalDoomsday');assert.equal(wrap.damage,0);assert.equal(actual.damage,8);
});
test('final artifacts: Doomsday pauses while silenced, retains counters after restore and does not damage other regions',()=>{
 let s=game();s=cast(s,'doomsday_device',a=>a.at===12);const id=s.artifacts.find(a=>card(a.card).slug==='doomsday_device').uid;s=dispatch(s,{type:'end',player:0});assert.equal(s.artifacts.find(a=>a.uid===id).finalDoomCounters,5);
 s=restoreGame(JSON.parse(JSON.stringify(s)));assert.equal(s.artifacts.find(a=>a.uid===id).finalDoomCounters,5);
 const t=state(),d=item(t,'doomsday_device',12),voidUnit=add(t,'aethermoeba',13);t.board[13]=null;d.finalDoomCounters=1;d.silenced=true;run(t,d,'finalDoomsday');assert.equal(d.finalDoomCounters,1);d.silenced=false;run(t,d,'finalDoomsday');assert.equal(voidUnit.damage,0);
});
test('final artifacts integration: Doomsday counts both players turns, explodes at six, and never repeats at zero',()=>{
 let s=game();s=cast(s,'doomsday_device',a=>a.at===12);const id=s.artifacts.find(a=>card(a.card).slug==='doomsday_device').uid;
 for(let i=1;i<=6;i++){
   s=dispatch(s,{type:'end',player:s.active});const d=s.artifacts.find(a=>a.uid===id);assert.equal(d.finalDoomCounters,6-i);
   assert.equal(s.players[0].life,i===6?12:20);assert.equal(s.players[1].life,i===6?16:20);
   s=dispatch(s,legalActions(s).find(a=>a.type==='draw'));
 }
 s=dispatch(s,{type:'end',player:s.active});assert.equal(s.artifacts.find(a=>a.uid===id).finalDoomCounters,0);assert.equal(s.players[0].life,12);assert.equal(s.players[1].life,16);
});

function game(){const s=state();add(s,'sorcerer',17,0);add(s,'sorcerer',2,1);for(const pl of s.players){pl.hand=[];pl.bonusMana=30;pl.bonusAffinity={air:10,earth:10,fire:10,water:10};}return s;}
function cast(s,slug,find=()=>true){const h={uid:'h'+s.next++,card:card(slug).id};s.players[0].hand.push(h);const a=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid&&find(a));assert.ok(a,'No legal cast '+slug);return dispatch(s,a);}
function effect(s,source,step,value){s.choice={player:source.controller,title:step.op,options:[{label:'Run',value}],frame:{source:structuredClone(source),controller:source.controller,effectCard:source.card,step}};return dispatch(s,{type:'choose',player:source.controller,option:0});}

test('final artifacts integration: cast Cage through dispatch and lock units after state-based refresh',()=>{
 let s=game();const weak=add(s,'grain_sparrow',3,1),strong=add(s,'brown_bears',4,1);const uid=weak.uid;
 s=cast(s,'cage_of_sidrak',a=>a.at===12);const u=unit(s,uid);assert.equal(u.at,12);assert.equal(u.tapped,true);assert.equal(disabled(u),true);assert.equal(unit(s,strong.uid).at,4);
 assert.ok(!legalActions(s,1).some(a=>a.unit===uid));
 s=restoreGame(JSON.parse(JSON.stringify(s)));assert.equal(disabled(unit(s,uid)),true);
});
test('final artifacts integration: enemy Tabula bearer is silenced, unmodified, cannot drop it, and protected Monks remain unmodified',()=>{
 let s=game();const enemy=add(s,'cherubim',12,1,{mods:[{power:7}]});s=cast(s,'tabula_rasa',a=>a.bearer===enemy.uid);
 const u=unit(s,enemy.uid),tabula=s.artifacts.find(a=>card(a.card).slug==='tabula_rasa');assert.equal(u.silenced,true);assert.equal(power(u),card('cherubim').attack);assert.equal(canDropArtifact(s,tabula),false);
 s=effect(s,s.units[0],{op:'ward'}, {uid:u.uid,entity:'unit'});assert.equal(unit(s,u.uid).ward,false);
 let t=game();const monks=add(t,'monks_of_kobalsa',12,1);t=cast(t,'tabula_rasa',a=>a.bearer===monks.uid);assert.equal(unit(t,monks.uid).silenced,false);assert.equal(unit(t,monks.uid).finalTabula,false);
});
test('final artifacts integration: Tombstone animates and reverts across actual turn changes and survives saved-game restore',()=>{
 let s=game();s=cast(s,'tombstone_wardens',a=>a.at===12);const id=s.artifacts.find(a=>card(a.card).slug==='tombstone_wardens').uid;
 s=dispatch(s,{type:'end',player:0});assert.equal(s.active,1);assert.equal(power(unit(s,id)),5);assert.ok(keywords(unit(s,id)).includes('Airborne'));
 s=restoreGame(JSON.parse(JSON.stringify(s)));assert.equal(power(unit(s,id)),5);
 s=dispatch(s,legalActions(s).find(a=>a.type==='draw'));s=dispatch(s,{type:'end',player:1});assert.equal(s.active,0);assert.equal(unit(s,id),undefined);assert.equal(s.artifacts.find(a=>a.uid===id).card,card('tombstone_wardens').id);
});
test('final artifacts integration: Egg protects Death Door Avatar from damage but does not prevent ordinary life reduction',()=>{
 let s=game(),av=s.units[0];s=cast(s,'koscheis_egg',a=>a.bearer===av.uid);assert.equal(s.finalEggBonds.length,1);
 s.players[0].life=0;s.players[0].doorTurn=s.turn-1;s=effect(s,s.units[1],{op:'damage',amount:4},{uid:av.uid,entity:'unit'});assert.equal(s.winner,null);
 s.players[0].doorTurn=null;s.players[0].life=10;s=effect(s,s.units[1],{op:'damage',amount:4},{uid:av.uid,entity:'unit'});assert.equal(s.players[0].life,6);
});
test('final artifacts integration: Catapult activation stays untapped until all choices confirmed and then applies real damage',()=>{
 let s=game();const bearer=s.units[0],crew=add(s,'wild_boars',17),victim=add(s,'brown_bears',18,1);s=cast(s,'corpse_catapult',a=>a.bearer===bearer.uid);s.players[0].cemetery.push(card('brown_bears').id);
 const object=s.artifacts.find(a=>card(a.card).slug==='corpse_catapult');const action=legalActions(s).find(a=>a.type==='activateArtifact'&&a.object===object.uid);assert.ok(action);s=dispatch(s,action);assert.equal(unit(s,bearer.uid).tapped,false);
 const pick=fn=>{const i=s.choice.options.findIndex(o=>fn(o.value));assert.ok(i>=0);s=dispatch(s,{type:'choose',player:s.choice.player,option:i});};
 pick(v=>v===crew.uid);pick(v=>v?.card===card('brown_bears').id);assert.equal(unit(s,bearer.uid).tapped,false);pick(v=>v?.at===18&&v.layer==='surface');
 assert.equal(unit(s,bearer.uid).tapped,true);assert.equal(unit(s,crew.uid).tapped,true);assert.equal(s.players[0].banished.includes(card('brown_bears').id),true);assert.equal(unit(s,victim.uid),undefined);
});
test('final artifacts integration: Catapult excludes Wormelow-protected graves and preserves physical owner descriptors',()=>{
 let s=game();const bearer=s.units[0],crew=add(s,'wild_boars',17);s=cast(s,'corpse_catapult',a=>a.bearer===bearer.uid);s.board[7]={uid:'worm-site',card:card('wormelow_tump').id,owner:1,controller:1};s.players[0].cemetery.push(card('wild_boars').id);s.players[1].cemetery.push(card('brown_bears').id);
 const object=s.artifacts.find(a=>card(a.card).slug==='corpse_catapult'),a=legalActions(s).find(a=>a.type==='activateArtifact'&&a.object===object.uid);assert.ok(a);s=dispatch(s,a);let i=s.choice.options.findIndex(o=>o.value===crew.uid);s=dispatch(s,{type:'choose',player:0,option:i});assert.ok(s.choice.options.some(o=>o.value?.player===0));assert.ok(!s.choice.options.some(o=>o.value?.player===1));
});
test('final artifacts integration: Catapult pays Bureau once for its complete ability, or declines without tapping either crew',()=>{
 for(const pay of [true,false]){
  let s=game();const bearer=s.units[0],crew=add(s,'wild_boars',17),target=add(s,'brown_bears',18,1);s=cast(s,'corpse_catapult',a=>a.bearer===bearer.uid);s.board[5]={uid:'bureau-site',card:card('bureau_of_occult_control').id,owner:1,controller:1};s.players[0].cemetery.push(card('brown_bears').id);const spent=s.players[0].spent,object=s.artifacts.find(a=>card(a.card).slug==='corpse_catapult');
  s=dispatch(s,legalActions(s).find(a=>a.type==='activateArtifact'&&a.object===object.uid));assert.equal(s.choice.frame.step.op,'zoneAccessOffer');s=restoreGame(JSON.parse(JSON.stringify(s)));let index=s.choice.options.findIndex(o=>o.value===pay);s=dispatch(s,{type:'choose',player:0,option:index});
  if(pay){for(const predicate of [v=>v===crew.uid,v=>v?.card===card('brown_bears').id,v=>v?.at===18&&v.layer==='surface']){index=s.choice.options.findIndex(o=>predicate(o.value));assert.ok(index>=0);s=dispatch(s,{type:'choose',player:0,option:index});}assert.equal(s.players[0].spent,spent+2);assert.equal(unit(s,target.uid),undefined);assert.equal(unit(s,bearer.uid).tapped,true);}
  else{assert.equal(s.choice,null);assert.equal(s.players[0].spent,spent);assert.equal(unit(s,bearer.uid).tapped,false);assert.equal(unit(s,crew.uid).tapped,false);assert.equal(s.players[0].cemetery.length,1);}
 }
});
