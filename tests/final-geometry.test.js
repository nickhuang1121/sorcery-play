import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {install,card,starter} from '../src/cards.js';
import {newGame,restoreGame,legalActions,dispatch,freeCastActions,unit as liveUnit} from '../src/engine.js';
import {waterSite,bodyOfWater,regionalDistance} from '../src/geography.js';
import {area,inside} from '../src/objects.js';
import {boardPassenger} from '../src/transport.js';
import {passives} from '../src/definitions.js';
import {createFinalAvatarCopyPermit} from '../src/final-avatars.js';
import {isVoidCell,voidCount,geometryDistance,geometryOccupied,initGeometryUnit,refreshGeometry,geometrySummonAllowed,followGeometryAvatars,geometryOwnMoveAllowed,geometryLeap,edgePlacementAllowed,geometryViolations,canAttackSubsurface,growthLocations,initGeometryLocations,commitGeometryLocations,geometryLocationRecords,geometryRegionNames,geometryRegionsOverlap,occupiesGeometryLocation,geometrySafe,geometryFallOptions,setFixedGeometry,refreshGeometryWorld,geometryRackOptions,geometryCasterLocations} from '../src/final-geometry.js';
// Prototype registration is isolated to this test worker until all production
// Globe integrations are verified. It activates real handlers, never a no-op.
passives.magellan_globe={geometryWrap:true};
install(JSON.parse(fs.readFileSync(new URL('../data/official-cards.json',import.meta.url))));
const unit=(slug,at=12,p=0)=>({uid:slug,card:card(slug).id,at,owner:p,controller:p,mods:[],ongoingPower:0,layer:'surface'});
const site=(slug='valley',p=0)=>({card:card(slug).id,controller:p});
const state=()=>({board:Array.from({length:20},()=>site()),units:[],artifacts:[]});
const A={card,disabled:u=>!!u.disabled,keywords:u=>u.silenced?[]:card(u.card).slug==='aethermoeba'?['Voidwalk']:[],canEnterOnGround:()=>true,waterSite:()=>false};

test('The Void is simultaneously a site and a void; suppression removes only its ability',()=>{
 const s=state();s.board[6]=site('the_void');s.board[7]=null;
 assert.equal(isVoidCell(s,6,card),true);assert.equal(voidCount(s,card),2);assert.ok(s.board[6]);
 s.board[6].silenced=true;assert.equal(isVoidCell(s,6,card),false);assert.equal(voidCount(s,card),1);
});
test('Magellan Globe connects both pairs of opposite edges, including diagonal nearby distance',()=>{
 const s=state();assert.equal(geometryDistance(s,0,4,card),4);
 s.artifacts.push(unit('magellan_globe'));assert.equal(geometryDistance(s,0,4,card),1);assert.equal(geometryDistance(s,0,15,card),1);assert.equal(geometryDistance(s,0,19,card,true),1);
 s.artifacts[0].silenced=true;assert.equal(geometryDistance(s,0,15,card),3);
});
test('Aethermoeba power counts only currently void occupied cells, not movement count',()=>{
 const s=state(),u=unit('aethermoeba');u.geometryCells=[12,13,8];s.units.push(u);s.board[8]=null;s.board[13]=site('the_void');
 refreshGeometry(s,A);assert.equal(u.ongoingPower,2);
 u.ongoingPower=0;s.board[8]=site();refreshGeometry(s,A);assert.equal(u.ongoingPower,1);
});
test('Megamoeba retains previous occupancy, gains power once per cell, and previews growth safely',()=>{
 const s=state(),u=unit('megamoeba');s.units.push(u);initGeometryUnit(u,card);u.at=13;refreshGeometry(s,A);
 assert.deepEqual(geometryOccupied(u),[12,13]);assert.equal(u.ongoingPower,2);assert.deepEqual(geometryOccupied({...u,at:8}),[12,13,8]);assert.deepEqual(u.geometryCells,[12,13]);
 u.silenced=true;u.ongoingPower=0;refreshGeometry(s,A);assert.equal(u.ongoingPower,0);assert.deepEqual(geometryOccupied(u),[12,13]);
});
test('Aethermoeba can grow from every occupied cell, including a part away from its anchor',()=>{
 const s=state(),u=unit('aethermoeba',13);u.geometryCells=[12,13];
 const choices=growthLocations(s,u,A,true);
 assert.ok(choices.some(v=>v.at===7));assert.ok(choices.some(v=>v.at===14));assert.ok(!choices.some(v=>v.at===6));
 assert.deepEqual(choices.find(v=>v.at===7).path,[{at:7,layer:'surface'}]);
});
test('Megamoeba cannot expand into void without Voidwalk; Aethermoeba can',()=>{
 const s=state();s.board[7]=null;
 assert.ok(!growthLocations(s,unit('megamoeba'),A,true).some(v=>v.at===7));
 assert.ok(growthLocations(s,unit('aethermoeba'),A,true).some(v=>v.at===7));
});
test('Growth obeys destination entry restrictions and movement bonus paths',()=>{
 const s=state(),u=unit('megamoeba');u.mods=[{movement:1}];
 const blocked={...A,canEnterOnGround:(_s,_u,_from,to)=>to.at!==7};
 assert.ok(!growthLocations(s,u,blocked,true).some(v=>v.at===7));
 assert.equal(growthLocations(s,u,A).find(v=>v.at===2).cost,2);
});
test('Yog-Sothoth occupies all cells as an intrinsic characteristic, even under silence',()=>{
 const u=unit('yog_sothoth');initGeometryUnit(u,card);assert.equal(geometryOccupied(u).length,20);
 u.silenced=true;assert.equal(geometryOccupied(u).length,20);
});
test('Yog-Sothoth banishment threshold counts The Void and triggers below five',()=>{
 const s=state(),u=unit('yog_sothoth');s.units.push(u);for(let i=0;i<4;i++)s.board[i]=null;s.board[4]=site('the_void');
 assert.deepEqual(geometryViolations(s,A).banish,[]);s.board[4]=site();assert.deepEqual(geometryViolations(s,A).banish,[u.uid]);
 u.silenced=true;assert.deepEqual(geometryViolations(s,A).banish,[]);
});
test('Cerberus may only summon to its controller Avatar location',()=>{
 const s=state();s.units.push(unit('sorcerer',17));
 assert.equal(geometrySummonAllowed(s,0,card('cerberus_in_chains'),17,card),true);
 assert.equal(geometrySummonAllowed(s,0,card('cerberus_in_chains'),12,card),false);
 assert.equal(geometrySummonAllowed(s,1,card('cerberus_in_chains'),17,card),false);
 assert.equal(geometrySummonAllowed(s,0,card('cerberus_in_chains'),17,card,undefined,'below'),false);
 s.units[0].layer='below';assert.equal(geometrySummonAllowed(s,0,card('cerberus_in_chains'),17,card,undefined,'below'),true);
});
test('Cerberus follows an Avatar through a teleport and layer change but cannot move itself away',()=>{
 const s=state(),a=unit('sorcerer',17),u=unit('cerberus_in_chains',17);s.units.push(a,u);a.at=2;a.layer='below';followGeometryAvatars(s,A);
 assert.equal(u.at,2);assert.equal(u.layer,'below');assert.equal(geometryOwnMoveAllowed(s,u,3,'below',card),false);assert.equal(geometryOwnMoveAllowed(s,u,2,'below',card),true);
 u.silenced=true;a.at=7;followGeometryAvatars(s,A);assert.equal(u.at,2);assert.equal(geometryOwnMoveAllowed(s,u,3,'below',card),true);
});
test('Felbog Frog Men leap over one adjacent site, never a void or diagonal corner',()=>{
 const s=state(),u=unit('felbog_frog_men');
 assert.equal(geometryLeap(s,u,{at:12},{at:2},card),true);assert.equal(geometryLeap(s,u,{at:12},{at:6},card),false);
 s.board[7]=null;assert.equal(geometryLeap(s,u,{at:12},{at:2},card),false);
 s.board[7]=site();u.silenced=true;assert.equal(geometryLeap(s,u,{at:12},{at:2},card),false);
});
test('Edge of the World placement requires an actual adjacent void, not the outer board edge',()=>{
 const s=state();assert.equal(edgePlacementAllowed(s,card('edge_of_the_world'),0,card),false);
 s.board[1]=null;assert.equal(edgePlacementAllowed(s,card('edge_of_the_world'),0,card),true);
 s.board[1]=site('the_void');assert.equal(edgePlacementAllowed(s,card('edge_of_the_world'),0,card),true);
});
test('Putrid Presence opens nearby subsurface site attacks for either player and stops under suppression',()=>{
 const s=state(),u=unit('putrid_presence');s.units.push(u);
 assert.equal(canAttackSubsurface(s,6,card,A.disabled),true);assert.equal(canAttackSubsurface(s,0,card,A.disabled),false);
 u.disabled=true;assert.equal(canAttackSubsurface(s,6,card,A.disabled),false);
});

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
test('Felbog dispatch leaps in one travel step over Bottomless Pit without entering it',()=>{
 let s=engineState();const u=addEngineUnit(s,'felbog_frog_men');s.board[7].card=card('bottomless_pit').id;s=restoreGame(s);
 const a=legalActions(s).find(a=>a.type==='move'&&a.unit===u.uid&&a.at===2);assert.ok(a);assert.deepEqual(a.path,[2]);
 s=dispatch(s,a);assert.equal(liveUnit(s,u.uid).at,2);assert.equal(liveUnit(s,u.uid).tapped,true);assert.equal(liveUnit(s,u.uid).dying,undefined);assert.ok(!s.choice);
});
test('Felbog cannot leap a missing intermediate site, and silence removes its extra movement',()=>{
 let s=engineState();const u=addEngineUnit(s,'felbog_frog_men');s.board[7]=null;s=restoreGame(s);
 assert.ok(!legalActions(s).some(a=>a.type==='move'&&a.unit===u.uid&&a.at===2));
 s.board[7]={uid:'s'+s.next++,card:card('valley').id,controller:0,owner:0};liveUnit(s,u.uid).mods.push({silenced:true});s=restoreGame(s);
 assert.ok(!legalActions(s).some(a=>a.type==='move'&&a.unit===u.uid&&a.at===2));assert.ok(legalActions(s).some(a=>a.type==='move'&&a.unit===u.uid&&a.at===7));
});
test('Felbog leap supports Movement bonus and cannot evade Immobile or disabled',()=>{
 let s=engineState();const u=addEngineUnit(s,'felbog_frog_men',17,0,{mods:[{movement:1}]});s=restoreGame(s);
 assert.ok(legalActions(s).some(a=>a.type==='move'&&a.unit===u.uid&&a.at===2));
 liveUnit(s,u.uid).mods.push({keyword:'Immobile'});s=restoreGame(s);assert.ok(!legalActions(s).some(a=>a.type==='move'&&a.unit===u.uid));
 liveUnit(s,u.uid).mods=[{disabled:true}];s=restoreGame(s);assert.ok(!legalActions(s).some(a=>a.type==='move'&&a.unit===u.uid));
});
test('Felbog may attack a unit after a leap, using ordinary defender priority',()=>{
 let s=engineState();const frog=addEngineUnit(s,'felbog_frog_men'),enemy=addEngineUnit(s,'brown_bears',2,1);s=restoreGame(s);
 const a=legalActions(s).find(a=>a.type==='attack'&&a.unit===frog.uid&&a.target===enemy.uid&&a.at===2);assert.ok(a);s=dispatch(s,a);
 assert.equal(liveUnit(s,frog.uid).at,2);assert.equal(s.pending.attacker,frog.uid);assert.equal(s.pending.target,enemy.uid);
});
test('Cerberus hand casting offers only its Avatar location and spends normal mana',()=>{
 let s=engineState();const h={uid:'h'+s.next++,card:card('cerberus_in_chains').id};s.players[0].hand.push(h);s=restoreGame(s);
 const actions=legalActions(s).filter(a=>a.type==='cast'&&a.hand===h.uid);assert.ok(actions.length);assert.deepEqual([...new Set(actions.map(a=>a.at))],[17]);
 s=dispatch(s,actions[0]);const dog=s.units.find(u=>u.card===h.card);assert.ok(dog);assert.equal(dog.at,17);assert.equal(s.players[0].spent,card(h.card).cost);
});
test('Cerberus follows an Avatar basic move and cannot leave through Move or Step choices',()=>{
 let s=engineState();const dog=addEngineUnit(s,'cerberus_in_chains',17);s=restoreGame(s);const av=s.units.find(u=>u.controller===0&&card(u.card).type==='Avatar');
 assert.ok(!legalActions(s).some(a=>a.type==='move'&&a.unit===dog.uid));
 const move=legalActions(s).find(a=>a.type==='move'&&a.unit===av.uid&&a.at===12);assert.ok(move);s=dispatch(s,move);assert.equal(liveUnit(s,dog.uid).at,12);
 assert.ok(!legalActions(s).some(a=>a.type==='move'&&a.unit===dog.uid));
});
test('Cerberus follows an Avatar teleport through ordinary spell dispatch',()=>{
 let s=engineState();const dog=addEngineUnit(s,'cerberus_in_chains',17),av=s.units.find(u=>u.controller===0&&card(u.card).type==='Avatar');
 const h={uid:'h'+s.next++,card:card('teleport').id};s.players[0].hand.push(h);s=restoreGame(s);
 const action=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid&&a.target?.unit===av.uid&&a.target.at===2);assert.ok(action);s=dispatch(s,action);
 assert.equal(liveUnit(s,av.uid).at,2);assert.equal(liveUnit(s,dog.uid).at,2);
});
test('Cerberus newly silenced before a refresh does not follow the Avatar',()=>{
 let s=engineState();const dog=addEngineUnit(s,'cerberus_in_chains',17),av=s.units.find(u=>u.controller===0&&card(u.card).type==='Avatar');s=restoreGame(s);
 liveUnit(s,dog.uid).mods.push({silenced:true});liveUnit(s,av.uid).at=12;s=restoreGame(s);
 assert.equal(liveUnit(s,dog.uid).silenced,true);assert.equal(liveUnit(s,dog.uid).at,17);
});
test('Cerberus arriving inside Silence immediately recalculates its continuous abilities',()=>{
 let s=engineState();const dog=addEngineUnit(s,'cerberus_in_chains',17),av=s.units.find(u=>u.controller===0&&card(u.card).type==='Avatar');
 s.auras.push({uid:'a'+s.next++,card:card('silence').id,at:6,owner:1,controller:1});s=restoreGame(s);
 liveUnit(s,av.uid).at=12;s=restoreGame(s);assert.equal(liveUnit(s,dog.uid).at,12);assert.equal(liveUnit(s,dog.uid).silenced,true);
});
test('Cerberus restriction also blocks a non-hand summon effect at a different location',()=>{
 let s=engineState();const source=addEngineUnit(s,'wild_boars',12);
 s.choice={player:0,title:'Summon',options:[{label:'Run',value:true}],frame:{source:structuredClone(source),controller:0,effectCard:source.card,step:{op:'summon',slug:'cerberus_in_chains'}}};
 s=dispatch(s,{type:'choose',player:0,option:0});assert.ok(!s.units.some(u=>card(u.card).slug==='cerberus_in_chains'));
});
test('Felbog can leap to defend an ally through the normal defense action',()=>{
 let s=engineState();s.active=1;const dog=addEngineUnit(s,'felbog_frog_men',12),enemy=addEngineUnit(s,'brown_bears',2,1),target=addEngineUnit(s,'wild_boars',2,0);s=restoreGame(s);
 const attack=legalActions(s,1).find(a=>a.type==='attack'&&a.unit===enemy.uid&&a.target===target.uid&&a.at===2);assert.ok(attack);s=dispatch(s,attack);
 const defend=legalActions(s,0).find(a=>a.type==='defend'&&a.unit===dog.uid);assert.ok(defend);s=dispatch(s,defend);
 assert.equal(liveUnit(s,dog.uid).at,2);assert.ok(s.pending.defenders.includes(dog.uid));
});
test('Putrid Presence enables a real subsurface site attack and normal life-loss resolution',()=>{
 let s=engineState();const presence=addEngineUnit(s,'putrid_presence',12),attacker=addEngineUnit(s,'wild_boars',6,0,{layer:'below',mods:[{keyword:'Burrowing'}]});addEngineUnit(s,'wild_boars',1,1,{layer:'below',mods:[{keyword:'Burrowing'}]});s=restoreGame(s);
 const attack=legalActions(s).find(a=>a.type==='attack'&&a.unit===attacker.uid&&a.target==='site:6'&&a.layer==='below');assert.ok(attack);s=dispatch(s,attack);assert.equal(s.pending.player,1);
 s=dispatch(s,{type:'pass',player:1});assert.equal(s.players[1].life,20-card('wild_boars').attack);assert.ok(liveUnit(s,presence.uid));
});
test('Putrid Presence permits both players to attack nearby subsurface, independent of its controller',()=>{
 let s=engineState();s.active=1;addEngineUnit(s,'putrid_presence',12,0);const attacker=addEngineUnit(s,'wild_boars',12,1,{layer:'below',mods:[{keyword:'Burrowing'}]});s=restoreGame(s);
 assert.ok(legalActions(s,1).some(a=>a.type==='attack'&&a.unit===attacker.uid&&a.target==='site:12'&&a.layer==='below'));
});
test('Putrid Presence does not enable far-away, silenced, or absent-provider subsurface site attacks',()=>{
 let s=engineState();const attacker=addEngineUnit(s,'wild_boars',1,0,{layer:'below',mods:[{keyword:'Burrowing'}]}),presence=addEngineUnit(s,'putrid_presence',12);s=restoreGame(s);
 assert.ok(!legalActions(s).some(a=>a.type==='attack'&&a.unit===attacker.uid&&a.target==='site:1'&&a.layer==='below'));
 liveUnit(s,attacker.uid).at=6;liveUnit(s,presence.uid).mods.push({silenced:true});s=restoreGame(s);assert.ok(!legalActions(s).some(a=>a.type==='attack'&&a.unit===attacker.uid&&a.target==='site:6'&&a.layer==='below'));
 s.units=s.units.filter(u=>u.uid!==presence.uid);s=restoreGame(s);assert.ok(!legalActions(s).some(a=>a.type==='attack'&&a.unit===attacker.uid&&a.target==='site:6'&&a.layer==='below'));
});
test('Putrid Presence subsurface attack offers only defenders able to reach its actual layer',()=>{
 let s=engineState();addEngineUnit(s,'putrid_presence',12);const attacker=addEngineUnit(s,'wild_boars',6,0,{layer:'below',mods:[{keyword:'Burrowing'}]}),below=addEngineUnit(s,'wild_boars',6,1,{layer:'below',mods:[{keyword:'Burrowing'}]}),surface=addEngineUnit(s,'wild_boars',6,1);s=restoreGame(s);
 const attack=legalActions(s).find(a=>a.type==='attack'&&a.unit===attacker.uid&&a.target==='site:6'&&a.layer==='below');assert.ok(attack);s=dispatch(s,attack);
 assert.ok(legalActions(s,1).some(a=>a.type==='defend'&&a.unit===below.uid));assert.ok(!legalActions(s,1).some(a=>a.type==='defend'&&a.unit===surface.uid));
});
test('Putrid Presence underwater site attack still respects the site Ward',()=>{
 let s=engineState();s.board[6].card=card('deep_sea').id;s.board[6].ward=true;addEngineUnit(s,'putrid_presence',12);const attacker=addEngineUnit(s,'wild_boars',6,0,{layer:'below',mods:[{keyword:'Submerge'}]});addEngineUnit(s,'wild_boars',6,1,{layer:'below',mods:[{keyword:'Submerge'}]});s=restoreGame(s);
 const attack=legalActions(s).find(a=>a.type==='attack'&&a.unit===attacker.uid&&a.target==='site:6'&&a.layer==='below');assert.ok(attack);s=dispatch(s,attack);s=dispatch(s,{type:'pass',player:1});assert.equal(s.board[6].ward,false);assert.equal(s.players[1].life,20);
});
test('Edge of the World cannot be played into the last void or allow another site to fill its last neighbor',()=>{
 let s=engineState();s.board[6]=null;const edge={uid:'h'+s.next++,card:card('edge_of_the_world').id};s.players[0].hand.push(edge);s=restoreGame(s);
 assert.ok(!legalActions(s).some(a=>a.type==='site'&&a.hand===edge.uid));assert.ok(s.players[0].hand.some(h=>h.uid===edge.uid));
 s=engineState();s.board[0].card=card('edge_of_the_world').id;s.board[0].controller=0;s.board[1]=null;const fill={uid:'h'+s.next++,card:card('valley').id};s.players[0].hand.push(fill);s=restoreGame(s);
 assert.ok(!legalActions(s).some(a=>a.type==='site'&&a.hand===fill.uid&&a.at===1));assert.ok(s.players[0].hand.some(h=>h.uid===fill.uid));assert.equal(s.units.find(u=>u.controller===0).tapped,false);
});
test('Edge of the World permits a valid hand placement with a remaining adjacent void',()=>{
 let s=engineState();s.board[11]=null;s.board[12]=null;const edge={uid:'h'+s.next++,card:card('edge_of_the_world').id};s.players[0].hand.push(edge);s=restoreGame(s);
 const play=legalActions(s).find(a=>a.type==='site'&&a.hand===edge.uid&&a.at===11);assert.ok(play);s=dispatch(s,play);assert.equal(card(s.board[11].card).slug,'edge_of_the_world');assert.equal(s.board[12],null);assert.ok(!s.players[0].hand.some(h=>h.uid===edge.uid));
});
test('Edge of the World blocks Cloud City movement into its final adjacent void',()=>{
 let s=engineState();s.board[0].card=card('edge_of_the_world').id;s.board[1]=null;s.board[6].card=card('cloud_city').id;const city=s.board[6],rider=addEngineUnit(s,'wild_boars',6);
 s=restoreGame(s);s.choice={player:0,title:'Cloud City',options:[{label:'Move',value:{at:1,entity:'location',layer:'surface'}}],frame:{source:{...city,at:6,layer:'surface'},controller:0,effectCard:city.card,step:{op:'flySite'}}};
 s=dispatch(s,{type:'choose',player:0,option:0});assert.equal(s.board[6].uid,city.uid);assert.equal(s.board[1],null);assert.equal(liveUnit(s,rider.uid).at,6);
});
test('Edge of the World destroys itself if a lost ability returns after it was surrounded',()=>{
 let s=engineState();s.board[7].card=card('edge_of_the_world').id;s.board[6].card=card('smokestacks_of_gnaak').id;const edge=s.board[7],smoke=s.board[6];s=restoreGame(s);assert.equal(s.board[7].silenced,true);
 s.choice={player:0,title:'Move Smokestacks',options:[{label:'Swap',value:{at:19,entity:'site'}}],frame:{source:{...smoke,at:6,layer:'surface'},controller:0,effectCard:smoke.card,step:{op:'swapSites'}}};s=dispatch(s,{type:'choose',player:0,option:0});
 assert.equal(s.board[19].uid,smoke.uid);assert.equal(card(s.board[7].card).slug,'rubble');assert.ok(s.players[edge.owner].cemetery.includes(edge.card));
});
test('Edge of the World prevents removing the last of two Globes that alone keep it adjacent to void',()=>{
 let s=engineState();s.board[0].card=card('edge_of_the_world').id;s.board[4]=null;for(let i=0;i<2;i++)s.artifacts.push({uid:'globe'+i,card:card('magellan_globe').id,at:10,layer:'surface',owner:0,controller:0,bearer:null});s=restoreGame(s);
 const source=s.units.find(u=>u.controller===0);s.choice={player:0,title:'Destroy artifacts',options:[{label:'Resolve',value:{at:10,entity:'location',layer:'surface'}}],frame:{source:structuredClone(source),controller:0,effectCard:source.card,step:{op:'destroyLocation'}}};s=dispatch(s,{type:'choose',player:0,option:0});
 assert.equal(s.artifacts.filter(a=>card(a.card).slug==='magellan_globe').length,1);assert.equal(card(s.board[0].card).slug,'edge_of_the_world');
});
test('Mismanaged Mortuary printed Flooded makes it water, is lost under silence, and yields to Drought',()=>{
 const s=state();s.board[6]=site('mismanaged_mortuary');assert.equal(waterSite(s,6,card),true);
 s.board[6].silenced=true;assert.equal(waterSite(s,6,card),false);s.board[6].silenced=false;s.board[6].effects=[{drought:true,stamp:1}];assert.equal(waterSite(s,6,card),false);
});
test('The Void official FAQ exposes simultaneous surface/void and underground/void regions',()=>{
 const s=state();s.board[6]=site('the_void');const above={at:6},below={at:6,layer:'below'},surface={at:7},empty={at:2};s.board[2]=null;
 assert.deepEqual([...geometryRegionNames(s,above,card,waterSite)].sort(),['surface','void']);assert.deepEqual([...geometryRegionNames(s,below,card,waterSite)].sort(),['underground','void']);
 assert.equal(geometryRegionsOverlap(s,above,below,card,waterSite),true);assert.equal(geometryRegionsOverlap(s,above,surface,card,waterSite),true);assert.equal(geometryRegionsOverlap(s,above,empty,card,waterSite),true);
 s.board[6].silenced=true;assert.equal(geometryRegionsOverlap(s,above,below,card,waterSite),false);
});
test('Megamoeba persists separate surface and subsurface locations and gains power for each',()=>{
 const s=state(),u=unit('megamoeba',12);u.mods=[{keyword:'Burrowing'}];s.units.push(u);initGeometryLocations(u,card);u.layer='below';commitGeometryLocations(u,card);
 assert.deepEqual(geometryLocationRecords(u),[{at:12,layer:'surface'},{at:12,layer:'below'}]);assert.equal(occupiesGeometryLocation(u,12,'surface'),true);assert.equal(occupiesGeometryLocation(u,12,'below'),true);
 refreshGeometry(s,A);assert.equal(u.ongoingPower,2);assert.equal(geometryRegionNames(s,u,card,waterSite).size,2);
});
test('Megamoeba can grow a second pseudopod from a different part and revisit occupied locations',()=>{
 const s=state(),u=unit('megamoeba',12);initGeometryLocations(u,card);u.at=13;commitGeometryLocations(u,card);
 const moves=growthLocations(s,u,A,true);assert.ok(moves.some(v=>v.at===7));assert.ok(moves.some(v=>v.at===12));
 u.at=7;commitGeometryLocations(u,card);assert.deepEqual(geometryOccupied(u),[12,13,7]);assert.equal(geometryLocationRecords(u).length,3);
});
test('Megamoeba silhouette translates under Silence, preserves size, and rejects row wrapping',()=>{
 const s=state(),u=unit('megamoeba',12);initGeometryLocations(u,card);u.at=13;commitGeometryLocations(u,card);u.silenced=true;
 const moves=growthLocations(s,u,A,true);assert.ok(moves.some(v=>v.at===8));assert.ok(!moves.some(v=>v.at===14&&v.layer==='below'));
 u.at=8;commitGeometryLocations(u,card);assert.deepEqual(geometryOccupied(u),[7,8]);assert.equal(geometryLocationRecords(u).length,2);
 u.geometryLocations=[{at:0,layer:'surface'},{at:1,layer:'surface'}];u.at=1;u.geometryAnchor={at:1,layer:'surface'};
 assert.ok(!growthLocations(s,u,A,true).some(v=>v.at===0));
});
test('Aethermoeba and Megamoeba safety checks every retained location, not only its latest tip',()=>{
 const s=state(),u=unit('megamoeba',12);initGeometryLocations(u,card);u.at=13;commitGeometryLocations(u,card);s.board[12]=null;
 assert.equal(geometrySafe(s,u,{...A,waterSite}),false);
 const ether=unit('aethermoeba',12);initGeometryLocations(ether,card);ether.at=13;commitGeometryLocations(ether,card);assert.equal(geometrySafe(s,ether,{...A,waterSite}),true);
});
test('Magellan Globe actual Move dispatch crosses the horizontal edge and silence removes the link',()=>{
 let s=engineState();const traveler=addEngineUnit(s,'wild_boars',0),globe={uid:'globe',card:card('magellan_globe').id,at:10,owner:0,controller:0,bearer:null};s.artifacts.push(globe);s=restoreGame(s);
 const move=legalActions(s).find(a=>a.type==='move'&&a.unit===traveler.uid&&a.at===4);assert.ok(move);s=dispatch(s,move);assert.equal(liveUnit(s,traveler.uid).at,4);
 s=engineState();const other=addEngineUnit(s,'wild_boars',0);s.artifacts.push({...globe,silenced:true});s=restoreGame(s);assert.ok(!legalActions(s).some(a=>a.type==='move'&&a.unit===other.uid&&a.at===4));
});
test('Magellan Globe permits an Airborne corner-to-opposite-corner Move',()=>{
 let s=engineState();const traveler=addEngineUnit(s,'wild_boars',0,0,{mods:[{keyword:'Airborne'}]});s.artifacts.push({uid:'globe',card:card('magellan_globe').id,at:10,owner:0,controller:0,bearer:null});s=restoreGame(s);
 const move=legalActions(s).find(a=>a.type==='move'&&a.unit===traveler.uid&&a.at===19);assert.ok(move);s=dispatch(s,move);assert.equal(liveUnit(s,traveler.uid).at,19);
});
test('Magellan Globe connects water bodies and regional range across the edge',()=>{
 const s=state();s.board[0]=site('deep_sea');s.board[4]=site('deep_sea');assert.ok(!bodyOfWater(s,0,card).has(4));
 s.artifacts.push(unit('magellan_globe'));assert.ok(bodyOfWater(s,0,card).has(4));assert.equal(regionalDistance(s,{at:0,layer:'below'},4,card),1);
});
test('Magellan Globe wraps all four squares of an Aura and a 2x2 footprint at the corner',()=>{
 assert.deepEqual(area(19,true),[19,15,4,0]);const aura={at:19,geometryWrap:true};for(const at of [19,15,4,0])assert.equal(inside(aura,at),true);assert.equal(inside(aura,1),false);
 assert.deepEqual(geometryOccupied({at:19,size:2,geometryWrap:true}),[19,15,4,0]);assert.deepEqual(area(19),[]);
});
test('Magellan Globe carries a passenger across the same edge without shifting it into another row',()=>{
 let s=engineState();const carrier=addEngineUnit(s,'beast_of_burden',0),rider=addEngineUnit(s,'wild_boars',0);boardPassenger(carrier,rider);s.artifacts.push({uid:'globe',card:card('magellan_globe').id,at:10,owner:0,controller:0,bearer:null});s=restoreGame(s);
 const action=legalActions(s).find(a=>a.type==='move'&&a.unit===carrier.uid&&a.at===4);assert.ok(action);s=dispatch(s,action);assert.equal(liveUnit(s,carrier.uid).at,4);assert.equal(liveUnit(s,rider.uid).at,4);assert.equal(liveUnit(s,rider.uid).carriedBy,carrier.uid);
});
test('Magellan Globe still respects a Wall of Ice occupying the wrapped border',()=>{
 let s=engineState();const traveler=addEngineUnit(s,'wild_boars',0);s.artifacts.push({uid:'globe',card:card('magellan_globe').id,at:10,owner:0,controller:0,bearer:null});s.auras.push({uid:'wall',card:card('wall_of_ice').id,at:0,wallTo:4,owner:1,controller:1});s=restoreGame(s);
 assert.ok(!legalActions(s).some(a=>a.type==='move'&&a.unit===traveler.uid&&a.at===4));liveUnit(s,traveler.uid).mods.push({keyword:'Airborne'});s=restoreGame(s);assert.ok(legalActions(s).some(a=>a.type==='move'&&a.unit===traveler.uid&&a.at===4));
});
test('Magellan Globe removal gives a spanning 2x2 unit both equally close sides, not an arbitrary fallback',()=>{
 const s=state(),u={...unit('mountain_giant',4),size:2,geometryWrap:true};
 assert.deepEqual(geometryFallOptions(s,u,{...A,waterSite}).map(o=>o.value.at).sort((a,b)=>a-b),[0,3]);
 u.at=19;assert.deepEqual(geometryFallOptions(s,u,{...A,waterSite}).map(o=>o.value.at).sort((a,b)=>a-b),[0,3,10,13]);
 s.board.fill(null);assert.deepEqual(geometryFallOptions(s,u,{...A,waterSite}),[]);
});
test('Edge of the World prevents Clay Golem from consuming an Atlas card for an impossible placement',()=>{
 let s=engineState();s.board[0].card=card('edge_of_the_world').id;s.board[1]=null;const source=addEngineUnit(s,'clay_golem',6),top=s.players[0].atlas[0],count=s.players[0].atlas.length;s=restoreGame(s);
 s.choice={player:0,title:'Clay Golem',options:[{label:'Place',value:{at:1,layer:'surface',entity:'location'}}],frame:{source:structuredClone(source),controller:0,effectCard:source.card,step:{op:'remainingClay'}}};s=dispatch(s,{type:'choose',player:0,option:0});
 assert.equal(s.board[1],null);assert.equal(s.players[0].atlas[0],top);assert.equal(s.players[0].atlas.length,count);
});
test('Edge of the World prevents Sow the Earth from consuming its top Atlas card',()=>{
 let s=engineState();s.board[0].card=card('edge_of_the_world').id;s.board[1]=null;const h={uid:'h'+s.next++,card:card('sow_the_earth').id},top=s.players[0].atlas[0],count=s.players[0].atlas.length;s.players[0].hand.push(h);s=restoreGame(s);
 const cast=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid&&a.at===1);assert.ok(cast);s=dispatch(s,cast);
 assert.equal(s.board[1],null);assert.equal(s.players[0].atlas[0],top);assert.equal(s.players[0].atlas.length,count);assert.ok(s.auras.some(a=>a.card===h.card));
});
test('Enchantress fixed two-location geometry translates as a whole and never grows or wraps without Globe',()=>{
 let s=engineState();const u=addEngineUnit(s,'wild_boars',0);setFixedGeometry(u,[0,1]);s=restoreGame(s);
 assert.ok(!legalActions(s).some(a=>a.type==='move'&&a.unit===u.uid&&a.at===4));const move=legalActions(s).find(a=>a.type==='move'&&a.unit===u.uid&&a.at===1);assert.ok(move);s=dispatch(s,move);
 assert.deepEqual(geometryOccupied(liveUnit(s,u.uid)),[1,2]);assert.equal(geometryLocationRecords(liveUnit(s,u.uid)).length,2);
});
test('Magellan Globe fall hook asks the correct controller and preserves a staged restore choice',()=>{
 const s=state(),u={...unit('mountain_giant',4,1),size:2,geometryWrap:true};s.units.push(u);s.finalDecisionPending={key:'globe-fall:'+u.uid};let calls=0;
 assert.equal(refreshGeometryWorld(s,{...A,waterSite},()=>{calls++;}),false);assert.equal(u.geometryWrap,true);assert.equal(calls,0);
 delete s.finalDecisionPending;s.finalDecisionReplay={};assert.equal(refreshGeometryWorld(s,{...A,waterSite},(key,p,options)=>{calls++;assert.equal(p,1);assert.equal(key,'globe-fall:'+u.uid);return options.find(o=>o.value.at===3).value;}),true);
 assert.equal(calls,1);assert.equal(u.at,3);assert.equal(u.geometryWrap,false);assert.deepEqual(geometryOccupied(u),null);
});
function addGlobe(s,at=10){const a={uid:'globe'+s.next++,card:card('magellan_globe').id,at,owner:0,controller:0,bearer:null};s.artifacts.push(a);return a;}
function beginAlkahest(s,at){const h={uid:'h'+s.next++,card:card('apply_alkahest').id};s.players[0].hand.push(h);s=restoreGame(s);const cast=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid);assert.ok(cast);s=dispatch(s,cast);assert.ok(s.choice);const option=s.choice.options.findIndex(o=>o.value.at===at);assert.ok(option>=0);return dispatch(s,{type:'choose',player:0,option});}
test('Magellan Globe can be truly cast from hand and enables a real wrapped Mountain Giant cast',()=>{
 let s=engineState();const h={uid:'h'+s.next++,card:card('magellan_globe').id};s.players[0].hand.push(h);s=restoreGame(s);const cast=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid&&a.at===10&&!a.bearer);assert.ok(cast);s=dispatch(s,cast);assert.ok(s.artifacts.some(a=>a.card===h.card));assert.ok(s.units.every(u=>u.geometryWrap));
 s.board[4].controller=0;const giant={uid:'h'+s.next++,card:card('mountain_giant').id};s.players[0].hand.push(giant);const summon=legalActions(s).find(a=>a.type==='cast'&&a.hand===giant.uid&&a.at===4);assert.ok(summon);s=dispatch(s,summon);const u=s.units.find(u=>u.card===giant.card);assert.ok(u);assert.deepEqual(geometryOccupied(u),[4,0,9,5]);
});
test('Magellan Globe allows an oversized unit to move across the top edge while preserving all four squares',()=>{
 let s=engineState();const giant=addEngineUnit(s,'mountain_giant',0,0,{size:2});addGlobe(s);s=restoreGame(s);const move=legalActions(s).find(a=>a.type==='move'&&a.unit===giant.uid&&a.at===15);assert.ok(move);s=dispatch(s,move);assert.deepEqual(geometryOccupied(liveUnit(s,giant.uid)),[15,16,0,1]);
});
test('Magellan Globe removal asks the unit controller to choose the nearest side and resumes after saved restore',()=>{
 let s=engineState();s.units.find(u=>u.controller===0).at=11;const giant=addEngineUnit(s,'mountain_giant',4,0,{size:2}),gear={uid:'gear',card:card('sword_and_shield').id,at:4,owner:0,controller:0,bearer:giant.uid};s.artifacts.push(gear);addGlobe(s);s=beginAlkahest(s,10);
 assert.equal(s.choice.frame.step.op,'finalReplacementResume');assert.equal(s.choice.player,0);assert.deepEqual(s.choice.options.map(o=>o.value.at).sort((a,b)=>a-b),[0,3]);assert.throws(()=>dispatch(s,{type:'choose',player:1,option:0}));
 s=restoreGame(JSON.parse(JSON.stringify(s)));const option=s.choice.options.findIndex(o=>o.value.at===3);s=dispatch(s,{type:'choose',player:0,option});assert.equal(liveUnit(s,giant.uid).at,3);assert.equal(liveUnit(s,giant.uid).geometryWrap,false);assert.equal(s.artifacts.find(a=>a.uid===gear.uid).at,3);assert.ok(!s.artifacts.some(a=>a.uid.startsWith('globe')));
});
test('Magellan Globe removal kills a spanning minion when no normal-sized footprint can fit',()=>{
 let s=engineState();s.board=s.board.map((site,at)=>[0,4,5,9,10].includes(at)?site:null);s.units.find(u=>u.controller===0).at=10;const giant=addEngineUnit(s,'mountain_giant',4,0,{size:2});addGlobe(s);s=beginAlkahest(s,10);
 assert.ok(!liveUnit(s,giant.uid));assert.ok(s.players[0].cemetery.includes(giant.card));assert.ok(!s.players[0].banished.includes(giant.card));
});
test('Magellan Globe removal shrinks an Avatar and lets its controller choose an existing occupied square',()=>{
 let s=engineState();for(const site of s.board)site.card=card('gnome_hollows').id;const av=s.units.find(u=>u.controller===0);av.at=4;av.size=2;av.mods=[{power:100}];addGlobe(s,4);s=beginAlkahest(s,4);
 assert.equal(s.choice.frame.step.op,'finalReplacementResume');assert.equal(s.choice.player,0);const option=s.choice.options.findIndex(o=>o.value.at===0);assert.ok(option>=0);s=dispatch(s,{type:'choose',player:0,option});assert.equal(liveUnit(s,av.uid).size,1);assert.equal(liveUnit(s,av.uid).at,0);assert.equal(liveUnit(s,av.uid).geometryWrap,false);
});

test('The Void physical top and below locations share a region without becoming the same location',()=>{
 const s=state();s.board[6]=site('the_void');const top={at:6,layer:'surface'},below={at:6,layer:'below'};
 assert.equal(geometryRegionsOverlap(s,top,below,card,()=>false),true);
 assert.equal(occupiesGeometryLocation(top,6,'below',s),false);
 assert.deepEqual([...geometryRegionNames(s,below,card,()=>false)].sort(),['underground','void']);
});
test('The Void actual Move permits Voidwalk departure into the adjacent opposite layer',()=>{
 let s=engineState();s.board[12].card=card('the_void').id;
 const h=addEngineUnit(s,'wild_boars',12,0,{mods:[{keyword:'Voidwalk'},{keyword:'Burrowing'}]});s=restoreGame(s);
 const move=legalActions(s).find(a=>a.type==='move'&&a.unit===h.uid&&a.at===7&&a.layer==='below');assert.ok(move);
 s=dispatch(s,move);assert.equal(liveUnit(s,h.uid).at,7);assert.equal(liveUnit(s,h.uid).layer,'below');assert.equal(s.board[12].card,card('the_void').id);
});
test('The Void rejects opposite-layer departure when the destination terrain ability is missing',()=>{
 let s=engineState();s.board[12].card=card('the_void').id;const h=addEngineUnit(s,'wild_boars',12,0,{mods:[{keyword:'Voidwalk'}]});s=restoreGame(s);
 assert.ok(!legalActions(s).some(a=>a.type==='move'&&a.unit===h.uid&&a.at===7&&a.layer==='below'));
});
test('The Void banishes a non-Voidwalk minion after a real forced entry while retaining its Site',()=>{
 let s=engineState();s.board[7].card=card('the_void').id;const h=addEngineUnit(s,'wild_boars',12);s=restoreGame(s);
 const magic={uid:'h'+s.next++,card:card('teleport').id};s.players[0].hand.push(magic);s=restoreGame(s);
 const action=legalActions(s).find(a=>a.type==='cast'&&a.hand===magic.uid&&a.target?.unit===h.uid&&a.target.at===7);assert.ok(action);s=dispatch(s,action);assert.ok(!liveUnit(s,h.uid));assert.ok(s.players[0].banished.includes(h.card));assert.equal(card(s.board[7].card).slug,'the_void');
});
test('The Rack fixed geometry preserves distinct top and below locations while translating',()=>{
 const u=unit('wild_boars',12);setFixedGeometry(u,[{at:12,layer:'surface'},{at:12,layer:'below'},{at:13,layer:'surface'}]);
 assert.deepEqual(geometryLocationRecords({...u,at:7}),[{at:7,layer:'surface'},{at:7,layer:'below'},{at:8,layer:'surface'}]);
 assert.equal(occupiesGeometryLocation(u,12,'below'),true);assert.deepEqual(geometryOccupied(u),[12,13]);
});
test('The Void allows a real enemy-owned Site cast by a printed Voidwalker, but not an ordinary minion',()=>{
 let s=engineState();s.board[6].card=card('the_void').id;
 const h={uid:'h'+s.next++,card:card('hounds_of_ondaros').id},ordinary={uid:'h'+s.next++,card:card('wild_boars').id};s.players[0].hand.push(h,ordinary);s=restoreGame(s);
 const cast=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid&&a.at===6);assert.ok(cast);
 assert.ok(!legalActions(s).some(a=>a.type==='cast'&&a.hand===ordinary.uid&&a.at===6));
 s=dispatch(s,cast);assert.ok(s.units.some(u=>u.card===h.card&&u.at===6&&u.controller===0));assert.equal(s.board[6].controller,1);
});
test('The Void silenced Site stops granting the enemy Voidwalker casting permission',()=>{
 let s=engineState();s.board[6].card=card('the_void').id;s.board[6].effects=[{silenced:true}];
 const h={uid:'h'+s.next++,card:card('hounds_of_ondaros').id};s.players[0].hand.push(h);s=restoreGame(s);
 // Site silence is represented by the continuous Site flag in this fixture.
 s.board[6].silenced=true;
 assert.ok(!legalActions(s).some(a=>a.type==='cast'&&a.hand===h.uid&&a.at===6));
});
test('The Rack real strike stretches an Avatar into a chosen new location and loses life per occupied location',()=>{
 let s=engineState();const target=s.units.find(u=>u.controller===1&&card(u.card).type==='Avatar');target.at=12;
 const bearer=addEngineUnit(s,'wild_boars',12);s.artifacts.push({uid:'rack',card:card('the_rack').id,owner:0,controller:0,bearer:bearer.uid,at:12});s=restoreGame(s);
 const attack=legalActions(s).find(a=>a.type==='attack'&&a.unit===bearer.uid&&a.target===target.uid&&a.at===12);assert.ok(attack);s=dispatch(s,attack);if(s.pending&&!s.choice)s=dispatch(s,{type:'pass',player:1});
 assert.equal(s.choice?.title,'The Rack · 選擇伸展位置');assert.equal(s.choice.player,0);
 const chosen=s.choice.options.findIndex(o=>o.value.at===7&&o.value.layer==='surface');assert.ok(chosen>=0);s=dispatch(s,{type:'choose',player:0,option:chosen});
 assert.deepEqual(geometryLocationRecords(liveUnit(s,target.uid)),[{at:12,layer:'surface'},{at:7,layer:'surface'}]);
 assert.equal(s.players[1].life,20-card('wild_boars').attack-2);assert.equal(liveUnit(s,target.uid).at,12);assert.ok(!liveUnit(s,target.uid).movedSinceStop);
});
test('The Rack stretch enters a damaging Site without counting as movement',()=>{
 let s=engineState();const target=s.units.find(u=>u.controller===1&&card(u.card).type==='Avatar');target.at=12;
 // Replace with an actual passage-damage Site from the installed rules.
 const passage=Object.entries(passives).find(([slug,d])=>d.entryExitEnemyDamage&&card(slug).type==='Site');assert.ok(passage);s.board[7].card=card(passage[0]).id;s.board[7].controller=0;
 const bearer=addEngineUnit(s,'wild_boars',12);s.artifacts.push({uid:'rack',card:card('the_rack').id,owner:0,controller:0,bearer:bearer.uid,at:12});s=restoreGame(s);
 const attack=legalActions(s).find(a=>a.type==='attack'&&a.unit===bearer.uid&&a.target===target.uid&&a.at===12);assert.ok(attack);s=dispatch(s,attack);if(s.pending&&!s.choice)s=dispatch(s,{type:'pass',player:1});
 const chosen=s.choice.options.findIndex(o=>o.value.at===7&&o.value.layer==='surface');assert.ok(chosen>=0);s=dispatch(s,{type:'choose',player:0,option:chosen});
 assert.equal(s.players[1].life,20-card('wild_boars').attack-2-passage[1].entryExitEnemyDamage);assert.ok(!liveUnit(s,target.uid).movedSinceStop);
});
test('The Rack cannot stretch across a regional boundary or into an already occupied location',()=>{
 const s=state(),u=unit('wild_boars',12);s.board[7]=null;
 const api={...A,keywords:()=>['Voidwalk','Burrowing'],regionsOverlap:(s,a,b)=>geometryRegionsOverlap(s,a,b,card,()=>false)};
 const options=geometryRackOptions(s,u,api);assert.ok(!options.some(o=>o.value.at===7));assert.ok(!options.some(o=>o.value.at===12));assert.ok(options.some(o=>o.value.at===11));
 s.board[12]=site('the_void');assert.ok(geometryRackOptions(s,u,api).some(o=>o.value.at===7));assert.ok(!geometryRackOptions(s,u,api).some(o=>o.value.at===12&&o.value.layer==='below'));
});
test('The Rack silenced equipment does not trigger a stretch from a real strike',()=>{
 let s=engineState();const target=s.units.find(u=>u.controller===1&&card(u.card).type==='Avatar');target.at=12;const bearer=addEngineUnit(s,'wild_boars',12);
 s.artifacts.push({uid:'rack',card:card('the_rack').id,owner:0,controller:0,bearer:bearer.uid,at:12,mods:[{silenced:true}],silenced:true});s=restoreGame(s);s.artifacts[0].silenced=true;
 const attack=legalActions(s).find(a=>a.type==='attack'&&a.unit===bearer.uid&&a.target===target.uid&&a.at===12);assert.ok(attack);s=dispatch(s,attack);if(s.pending&&!s.choice)s=dispatch(s,{type:'pass',player:1});
 assert.ok(!s.choice);assert.equal(geometryLocationRecords(liveUnit(s,target.uid)).length,1);assert.equal(s.players[1].life,20-card('wild_boars').attack);
});
test('Megamoeba real movement retains its old location and increases its power once per new location',()=>{
 let s=engineState();const u=addEngineUnit(s,'megamoeba',12);s=restoreGame(s);assert.equal(liveUnit(s,u.uid).ongoingPower,1);
 const move=legalActions(s).find(a=>a.type==='move'&&a.unit===u.uid&&a.at===7);assert.ok(move);s=dispatch(s,move);
 assert.deepEqual(geometryLocationRecords(liveUnit(s,u.uid)),[{at:12,layer:'surface'},{at:7,layer:'surface'}]);assert.equal(liveUnit(s,u.uid).ongoingPower,2);
 s=restoreGame(s);assert.equal(liveUnit(s,u.uid).ongoingPower,2);
});
test('Megamoeba real teleport expands a remote location instead of translating the previous shape',()=>{
 let s=engineState();const u=addEngineUnit(s,'megamoeba',12),h={uid:'h'+s.next++,card:card('teleport').id};s.players[0].hand.push(h);s=restoreGame(s);
 const cast=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid&&a.target?.unit===u.uid&&a.target.at===0);assert.ok(cast);s=dispatch(s,cast);
 assert.deepEqual(geometryLocationRecords(liveUnit(s,u.uid)),[{at:12,layer:'surface'},{at:0,layer:'surface'}]);assert.equal(liveUnit(s,u.uid).ongoingPower,2);
});
test('Aethermoeba real movement counts only occupied void locations for added power',()=>{
 let s=engineState();s.board[7]=null;const u=addEngineUnit(s,'aethermoeba',12);s=restoreGame(s);assert.equal(liveUnit(s,u.uid).ongoingPower,0);
 const move=legalActions(s).find(a=>a.type==='move'&&a.unit===u.uid&&a.at===7);assert.ok(move);s=dispatch(s,move);
 assert.deepEqual(geometryOccupied(liveUnit(s,u.uid)),[12,7]);assert.equal(liveUnit(s,u.uid).ongoingPower,1);
});
test('Yog-Sothoth real checkpoint keeps all locations and banishes when fewer than five voids remain',()=>{
 let s=engineState();for(const at of [0,1,3,4,5])s.board[at]=null;const u=addEngineUnit(s,'yog_sothoth',12);s=restoreGame(s);
 assert.ok(liveUnit(s,u.uid));assert.equal(geometryLocationRecords(liveUnit(s,u.uid)).length,40);
 s.board[0]=site();s=dispatch(s,{type:'end',player:0});assert.ok(!liveUnit(s,u.uid));assert.ok(s.players[0].banished.includes(u.card));
});
test('The Rack expanded Avatar actually moves its whole fixed shape and does not grow further',()=>{
 let s=engineState();s.active=1;const u=s.units.find(u=>u.controller===1&&card(u.card).type==='Avatar');u.at=12;setFixedGeometry(u,[12,7]);s=restoreGame(s);
 const move=legalActions(s,1).find(a=>a.type==='move'&&a.unit===u.uid&&a.at===13&&(a.layer||'surface')==='surface');assert.ok(move);s=dispatch(s,move);
 assert.deepEqual(geometryLocationRecords(liveUnit(s,u.uid)),[{at:13,layer:'surface'},{at:8,layer:'surface'}]);assert.equal(geometryLocationRecords(liveUnit(s,u.uid)).length,2);
});
test('The Rack arbitrary shape crossing Globe edge falls to equally nearest fitting fixed shapes',()=>{
 const s=state(),u=unit('wild_boars',4);setFixedGeometry(u,[4,0],true);
 assert.deepEqual(geometryFallOptions(s,u,A).map(o=>o.value.at),[0,3]);
 assert.deepEqual(geometryLocationRecords({...u,at:3,geometryWrap:false}),[{at:3,layer:'surface'},{at:4,layer:'surface'}]);
});
test('Megamoeba chooses a real spell casting location without moving its physical anchor or expanding its spell origin',()=>{
 let s=engineState();const u=addEngineUnit(s,'megamoeba',12,0,{mods:[{keyword:'Spellcaster'}],geometryLocations:[{at:12,layer:'surface'},{at:0,layer:'surface'}],geometryAnchor:{at:12,layer:'surface'},stealth:true});const enemy=addEngineUnit(s,'brown_bears',5,1),h={uid:'h'+s.next++,card:card('flame_strike').id};s.players[0].hand.push(h);s=restoreGame(s);
 const casts=legalActions(s).filter(a=>a.type==='cast'&&a.hand===h.uid&&a.caster===u.uid);assert.deepEqual([...new Set(casts.map(a=>a.casterLocation.at))].sort((a,b)=>a-b),[0,12]);
 const cast=casts.find(a=>a.casterLocation.at===0);s=dispatch(s,cast);assert.equal(s.choice.frame.source.at,0);assert.deepEqual(geometryLocationRecords(s.choice.frame.source),[{at:0,layer:'surface'}]);
 s=dispatch(s,{type:'choose',player:0,option:2});assert.equal(liveUnit(s,enemy.uid).damage,3);assert.equal(liveUnit(s,u.uid).at,12);assert.equal(liveUnit(s,u.uid).stealth,false);assert.equal(geometryLocationRecords(liveUnit(s,u.uid)).length,2);
});
test('Megamoeba free-cast API pins a selected caster descriptor and preserves both origin actions when passed only a uid',()=>{
 let s=engineState();const u=addEngineUnit(s,'megamoeba',12,0,{mods:[{keyword:'Spellcaster'}],geometryLocations:[{at:12,layer:'surface'},{at:0,layer:'surface'}],geometryAnchor:{at:12,layer:'surface'}}),h={uid:'h'+s.next++,card:card('flame_strike').id};s.players[0].hand.push(h);s=restoreGame(s);
 const descriptor=geometryCasterLocations(s,liveUnit(s,u.uid)).find(v=>v.at===0),pinned=freeCastActions(s,0,h.uid,descriptor);
 assert.ok(pinned.length);assert.ok(pinned.every(a=>a.casterLocation.at===0));const all=freeCastActions(s,0,h.uid,u.uid);assert.deepEqual([...new Set(all.map(a=>a.casterLocation.at))].sort((a,b)=>a-b),[0,12]);
});
test('Yog-Sothoth real hand cast occupies every location, ignores a Site damage ability, and loses safety under silence',()=>{
 let s=engineState();for(const at of [0,1,3,4,5])s.board[at]=null;const h={uid:'h'+s.next++,card:card('yog_sothoth').id};s.players[0].hand.push(h);s=restoreGame(s);
 const cast=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid&&a.at===12);assert.ok(cast);s=dispatch(s,cast);const u=s.units.find(u=>u.card===h.card);assert.ok(u);assert.equal(geometryLocationRecords(u).length,40);
 s.choice={player:1,title:'Site ability',options:[{label:'Resolve',value:true}],frame:{source:{...s.board[6],at:6,uid:'site:6',layer:'surface'},controller:1,effectCard:s.board[6].card,step:{op:'sitePassage',uid:u.uid,damage:3}}};
 s=dispatch(s,{type:'choose',player:1,option:0});assert.equal(liveUnit(s,u.uid).damage,0);liveUnit(s,u.uid).mods.push({silenced:true});s=dispatch(s,{type:'end',player:0});assert.ok(!liveUnit(s,u.uid));assert.ok(s.players[0].banished.includes(u.card));
});
test('Yog-Sothoth granted Spellcaster offers forty native casting locations and separates both layers at one square',()=>{
 let s=engineState();for(const at of [0,1,3,4,5])s.board[at].card=card('the_void').id;
 const u=addEngineUnit(s,'yog_sothoth',12,0,{mods:[{keyword:'Spellcaster'}]}),h={uid:'h'+s.next++,card:card('flame_strike').id};s.players[0].hand.push(h);s=restoreGame(s);
 const actions=legalActions(s).filter(a=>a.type==='cast'&&a.hand===h.uid&&a.caster===u.uid);assert.equal(actions.length,40);
 assert.ok(actions.some(a=>a.casterLocation.at===6&&a.casterLocation.layer==='surface'));const below=actions.find(a=>a.casterLocation.at===6&&a.casterLocation.layer==='below');assert.ok(below);
 s=dispatch(s,below);assert.equal(s.choice.frame.source.at,6);assert.equal(s.choice.frame.source.layer,'below');assert.deepEqual(geometryLocationRecords(s.choice.frame.source),[{at:6,layer:'below'}]);assert.equal(liveUnit(s,u.uid).at,12);
});
test('Yog-Sothoth saved free-copy permit pins its casting location and rejects a forged alternative occupied location',()=>{
 let s=engineState();for(const at of [0,1,3,4,5])s.board[at].card=card('the_void').id;const u=addEngineUnit(s,'yog_sothoth',12,0,{mods:[{keyword:'Spellcaster'}]});s=restoreGame(s);
 const source=geometryCasterLocations(s,liveUnit(s,u.uid)).find(v=>v.at===6&&v.layer==='below'),permit=createFinalAvatarCopyPermit(s,0,[card('flame_strike').id],source,{free:true,ignoreThreshold:true,caster:u.uid});permit.active=true;
 s=restoreGame(JSON.parse(JSON.stringify(s)));const actions=legalActions(s).filter(a=>a.type==='cast'&&a.avatarCopy===permit.uid);assert.equal(actions.length,1);const action=actions[0];assert.deepEqual(action.casterLocation,{at:6,layer:'below'});
 assert.throws(()=>dispatch(s,{...action,casterLocation:{at:7,layer:'below'}}));assert.equal(s.finalAvatarCopies.find(p=>p.uid===permit.uid).used,false);
 s=dispatch(s,action);assert.equal(s.choice.frame.source.at,6);assert.equal(s.choice.frame.source.layer,'below');assert.equal(liveUnit(s,u.uid).at,12);
});
test('The Rack same-square two-layer oversized Avatar is not carried by an Earthquake Site permutation',()=>{
 let s=engineState();const u=s.units.find(u=>u.controller===0&&card(u.card).type==='Avatar');u.at=10;u.mods.push({keyword:'Burrowing'});setFixedGeometry(u,[{at:10,layer:'surface'},{at:10,layer:'below'}]);const h={uid:'h'+s.next++,card:card('earthquake').id};s.players[0].hand.push(h);s=restoreGame(s);
 const cast=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid);assert.ok(cast);s=dispatch(s,cast);
 let i=s.choice.options.findIndex(o=>o.value?.at===10);assert.ok(i>=0);s=dispatch(s,{type:'choose',player:0,option:i});i=s.choice.options.findIndex(o=>o.value?.[10]===11&&o.value?.[11]===10&&o.value?.[15]===15&&o.value?.[16]===16);assert.ok(i>=0);s=dispatch(s,{type:'choose',player:0,option:i});
 assert.equal(liveUnit(s,u.uid).at,10);assert.equal(geometryLocationRecords(liveUnit(s,u.uid)).length,2);
});
test('The Rack cannot stretch a surface Avatar into subsurface even with the destination movement keywords',()=>{
 let s=engineState();s.board[12].card=card('the_void').id;const target=s.units.find(u=>u.controller===1&&card(u.card).type==='Avatar');target.at=12;target.mods.push({keyword:'Burrowing'},{keyword:'Submerge'});
 const bearer=addEngineUnit(s,'wild_boars',12,0,{mods:[{keyword:'Voidwalk'}]});s.artifacts.push({uid:'rack',card:card('the_rack').id,owner:0,controller:0,bearer:bearer.uid,at:12});s=restoreGame(s);
 const attack=legalActions(s).find(a=>a.type==='attack'&&a.unit===bearer.uid&&a.target===target.uid&&a.at===12);assert.ok(attack);s=dispatch(s,attack);if(s.pending&&!s.choice)s=dispatch(s,{type:'pass',player:1});assert.equal(s.choice.title,'The Rack · 選擇伸展位置');
 assert.ok(s.choice.options.length);assert.ok(s.choice.options.every(o=>o.value.layer==='surface'));assert.ok(!s.choice.options.some(o=>o.value.at===12&&o.value.layer==='below'));
});
test('Megamoeba entering a previously occupied square on another layer produces that layer in the real Site trigger frame',()=>{
 let s=engineState();s.board[12].card=card('troll_bridge').id;s.board[12].controller=1;const u=addEngineUnit(s,'megamoeba',12,0,{mods:[{keyword:'Submerge'}]});s=restoreGame(s);
 for(const v of s.units){v.justEntered=false;v.observedPosition={at:v.at,layer:v.layer||'surface',cells:geometryOccupied(v)||[v.at],locations:geometryLocationRecords(v)};}
 const move=legalActions(s).find(a=>a.type==='move'&&a.unit===u.uid&&a.at===12&&a.layer==='below');assert.ok(move);s=dispatch(s,move);
 assert.equal(s.choice.title,'Troll Bridge');assert.equal(s.choice.frame.source.at,12);assert.equal(s.choice.frame.source.layer,'below');assert.equal(geometryLocationRecords(liveUnit(s,u.uid)).length,2);
});
test('Megamoeba actual Scatter push chooses a remote pseudopod and grows only its destination',()=>{
 let s=engineState();const u=addEngineUnit(s,'megamoeba',12,1,{geometryLocations:[{at:12,layer:'surface'},{at:0,layer:'surface'}],geometryAnchor:{at:12,layer:'surface'}}),h={uid:'h'+s.next++,card:card('scatter').id};s.players[0].hand.push(h);s=restoreGame(s);
 const cast=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid&&(a.target===null||a.target?.at===12));assert.ok(cast);s=dispatch(s,cast);
 if(s.choice.options.some(o=>o.value?.entity==='location'))s=dispatch(s,{type:'choose',player:0,option:s.choice.options.findIndex(o=>o.value.at===12&&o.value.layer==='surface')});
 if(s.choice.options.some(o=>o.value?.uid===u.uid&&!o.value?.from))s=dispatch(s,{type:'choose',player:0,option:s.choice.options.findIndex(o=>o.value.uid===u.uid)});
 assert.match(s.choice.title,/受推拉分肢/);const option=s.choice.options.findIndex(o=>o.value?.from?.at===0&&o.value.to.at===1);assert.ok(option>=0);assert.match(s.choice.options[option].label,/A4 surface → B4 surface/);
 s=dispatch(s,{type:'choose',player:0,option});assert.deepEqual(geometryOccupied(liveUnit(s,u.uid)),[12,0,1]);assert.equal(liveUnit(s,u.uid).ongoingPower,3);assert.equal(liveUnit(s,u.uid).at,1);
});
test('Megamoeba actual Maelstrom pull selects its remote pseudopod and preserves the other locations',()=>{
 let s=engineState();for(const site of s.board)site.card=card('spring_river').id;const u=addEngineUnit(s,'megamoeba',12,1,{geometryLocations:[{at:12,layer:'surface'},{at:0,layer:'surface'}],geometryAnchor:{at:12,layer:'surface'}});s.board[17].card=card('maelstrom').id;s.board[17].controller=0;s.active=1;s=restoreGame(s);
 s=dispatch(s,{type:'end',player:1});if(s.choice?.options.some(o=>o.value===true))s=dispatch(s,{type:'choose',player:0,option:s.choice.options.findIndex(o=>o.value===true)});assert.match(s.choice.title,/Mael/);
 const option=s.choice.options.findIndex(o=>o.value?.geometryFrom?.at===0&&o.value.at===5);assert.ok(option>=0);assert.match(s.choice.options[option].label,/A4 surface → A3 surface/);
 s=dispatch(s,{type:'choose',player:0,option});assert.deepEqual(geometryOccupied(liveUnit(s,u.uid)),[12,0,5]);assert.equal(liveUnit(s,u.uid).ongoingPower,3);
});
test('Megamoeba selected pseudopod respects its actual Wall of Ice border instead of the body anchor',()=>{
 let s=engineState();const u=addEngineUnit(s,'megamoeba',12,1,{geometryLocations:[{at:12,layer:'surface'},{at:0,layer:'surface'}],geometryAnchor:{at:12,layer:'surface'}});s.auras.push({uid:'wall',card:card('wall_of_ice').id,owner:0,controller:0,at:0,wallTo:1});s=restoreGame(s);
 s.choice={player:0,title:'Push',options:[{label:'Resolve',value:undefined}],frame:{source:structuredClone(s.units[0]),controller:0,effectCard:card('scatter').id,step:{op:'fiftyPushChoose',target:{entity:'unit',uid:u.uid},remaining:[]}}};s=dispatch(s,{type:'choose',player:0,option:0});
 assert.match(s.choice.title,/受推拉分肢/);assert.ok(!s.choice.options.some(o=>o.value.from.at===0&&o.value.to.at===1));assert.ok(s.choice.options.some(o=>o.value.from.at===12&&o.value.to.at===13));
});
test('Megamoeba selected remote pseudopod triggers Wall of Fire damage across that border exactly once',()=>{
 let s=engineState();const u=addEngineUnit(s,'megamoeba',12,1,{mods:[{power:10}],geometryLocations:[{at:12,layer:'surface'},{at:0,layer:'surface'}],geometryAnchor:{at:12,layer:'surface'}});s.auras.push({uid:'wall',card:card('wall_of_fire').id,owner:0,controller:0,at:0,wallTo:1});s=restoreGame(s);
 s.choice={player:0,title:'Push',options:[{label:'Resolve',value:undefined}],frame:{source:structuredClone(s.units[0]),controller:0,effectCard:card('scatter').id,step:{op:'fiftyPushChoose',target:{entity:'unit',uid:u.uid},remaining:[]}}};s=dispatch(s,{type:'choose',player:0,option:0});const option=s.choice.options.findIndex(o=>o.value.from.at===0&&o.value.to.at===1);assert.ok(option>=0);s=dispatch(s,{type:'choose',player:0,option});assert.equal(liveUnit(s,u.uid).damage,3);assert.deepEqual(geometryOccupied(liveUnit(s,u.uid)),[12,0,1]);
});
test('Megamoeba actual Windblast plans a chosen remote pseudopod before simultaneously moving ordinary units',()=>{
 let s=engineState();const u=addEngineUnit(s,'megamoeba',12,1,{geometryLocations:[{at:12,layer:'surface'},{at:0,layer:'surface'}],geometryAnchor:{at:12,layer:'surface'}}),normal=addEngineUnit(s,'wild_boars',13,1),h={uid:'h'+s.next++,card:card('windblast').id};s.players[0].hand.push(h);s=restoreGame(s);
 const cast=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid);assert.ok(cast);s=dispatch(s,cast);s=dispatch(s,{type:'choose',player:0,option:1});assert.match(s.choice.title,/受推拉分肢/);assert.equal(liveUnit(s,normal.uid).at,13);
 const option=s.choice.options.findIndex(o=>o.value.from.at===0&&o.value.to.at===1);assert.ok(option>=0);s=dispatch(s,{type:'choose',player:0,option});assert.deepEqual(geometryOccupied(liveUnit(s,u.uid)),[12,0,1]);assert.equal(liveUnit(s,normal.uid).at,14);
});
test('Megamoeba actual Whirlwind can rotate a participating remote pseudopod whose anchor is outside the area',()=>{
 let s=engineState();const u=addEngineUnit(s,'megamoeba',12,1,{geometryLocations:[{at:12,layer:'surface'},{at:10,layer:'surface'}],geometryAnchor:{at:12,layer:'surface'}}),normal=addEngineUnit(s,'wild_boars',15,1),h={uid:'h'+s.next++,card:card('whirlwind').id};s.players[0].hand.push(h);s=restoreGame(s);
 const cast=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid&&(a.target===null||a.target?.at===10));assert.ok(cast);s=dispatch(s,cast);
 if(s.choice.options.some(o=>o.value?.at===10))s=dispatch(s,{type:'choose',player:0,option:s.choice.options.findIndex(o=>o.value.at===10)});s=dispatch(s,{type:'choose',player:0,option:s.choice.options.findIndex(o=>o.value===1)});
 assert.match(s.choice.title,/受推拉分肢/);assert.equal(liveUnit(s,normal.uid).at,15);const option=s.choice.options.findIndex(o=>o.value.from.at===10&&o.value.to.at===11);assert.ok(option>=0);s=dispatch(s,{type:'choose',player:0,option});assert.deepEqual(geometryOccupied(liveUnit(s,u.uid)),[12,10,11]);assert.equal(liveUnit(s,normal.uid).at,10);
});
test('Megamoeba Cloud City Site movement carries only the pseudopod on that Site without growth or entry damage',()=>{
 let s=engineState();s.board[0].card=card('cloud_city').id;s.board[1]=null;const u=addEngineUnit(s,'megamoeba',12,0,{geometryLocations:[{at:12,layer:'surface'},{at:0,layer:'surface'}],geometryAnchor:{at:12,layer:'surface'}});s=restoreGame(s);
 s.choice={player:0,title:'Cloud City',options:[{label:'Move',value:{entity:'location',at:1,layer:'surface'}}],frame:{source:{...s.board[0],at:0,uid:'site:0',layer:'surface'},controller:0,effectCard:s.board[0].card,step:{op:'flySite'}}};s=dispatch(s,{type:'choose',player:0,option:0});
 assert.deepEqual(geometryLocationRecords(liveUnit(s,u.uid)),[{at:12,layer:'surface'},{at:1,layer:'surface'}]);assert.equal(liveUnit(s,u.uid).at,12);assert.equal(liveUnit(s,u.uid).ongoingPower,2);assert.ok(!liveUnit(s,u.uid).movedSinceStop);assert.equal(s.board[0],null);
});
test('Megamoeba Smokestacks swaps the Site under a remote pseudopod without translating its whole body',()=>{
 let s=engineState();s.board[0].card=card('smokestacks_of_gnaak').id;const u=addEngineUnit(s,'megamoeba',12,0,{geometryLocations:[{at:12,layer:'surface'},{at:0,layer:'surface'}],geometryAnchor:{at:12,layer:'surface'}});s=restoreGame(s);
 s.choice={player:0,title:'Swap',options:[{label:'Swap',value:{entity:'site',at:19}}],frame:{source:{...s.board[0],at:0,uid:'site:0',layer:'surface'},controller:0,effectCard:s.board[0].card,step:{op:'swapSites'}}};s=dispatch(s,{type:'choose',player:0,option:0});assert.deepEqual(geometryOccupied(liveUnit(s,u.uid)),[12,19]);assert.equal(liveUnit(s,u.uid).at,12);assert.equal(liveUnit(s,u.uid).ongoingPower,2);
});
test('Megamoeba Earthquake moves the affected below pseudopod with its Site and preserves the other part',()=>{
 let s=engineState();const u=addEngineUnit(s,'megamoeba',12,0,{layer:'below',mods:[{keyword:'Burrowing'}],geometryLocations:[{at:12,layer:'below'},{at:10,layer:'below'}],geometryAnchor:{at:12,layer:'below'}}),h={uid:'h'+s.next++,card:card('earthquake').id};s.players[0].hand.push(h);s=restoreGame(s);
 const cast=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid);assert.ok(cast);s=dispatch(s,cast);let option=s.choice.options.findIndex(o=>o.value?.at===10);assert.ok(option>=0);s=dispatch(s,{type:'choose',player:0,option});option=s.choice.options.findIndex(o=>o.value?.[10]===11&&o.value?.[11]===10&&o.value?.[15]===15&&o.value?.[16]===16);assert.ok(option>=0);s=dispatch(s,{type:'choose',player:0,option});assert.deepEqual(geometryLocationRecords(liveUnit(s,u.uid)),[{at:12,layer:'below'},{at:11,layer:'below'}]);assert.equal(liveUnit(s,u.uid).ongoingPower,2);
});
test('Megamoeba real Burrow expands into the second location of one Site, and silence subsequently moves that whole retained shape',()=>{
 let s=engineState();const u=addEngineUnit(s,'megamoeba',12,0,{mods:[{keyword:'Burrowing'}]});s=restoreGame(s);const down=legalActions(s).find(a=>a.type==='move'&&a.unit===u.uid&&a.at===12&&a.layer==='below');assert.ok(down);s=dispatch(s,down);
 assert.deepEqual(geometryLocationRecords(liveUnit(s,u.uid)),[{at:12,layer:'surface'},{at:12,layer:'below'}]);assert.equal(liveUnit(s,u.uid).ongoingPower,2);
 liveUnit(s,u.uid).mods.push({silenced:true});liveUnit(s,u.uid).tapped=false;s=restoreGame(s);const sideways=legalActions(s).find(a=>a.type==='move'&&a.unit===u.uid&&a.at===13&&a.layer==='below');assert.ok(sideways);s=dispatch(s,sideways);
 assert.deepEqual(geometryLocationRecords(liveUnit(s,u.uid)),[{at:13,layer:'surface'},{at:13,layer:'below'}]);assert.equal(liveUnit(s,u.uid).ongoingPower,0);
});
test('The Rack expanded Avatar uses its controller choice when removal of Globe requires the fixed shape to fall inward',()=>{
 let s=engineState();s.units.find(u=>u.controller===0).at=11;const u=s.units.find(u=>u.controller===1&&card(u.card).type==='Avatar');u.at=4;setFixedGeometry(u,[4,0],true);addGlobe(s);s=beginAlkahest(s,10);
 assert.equal(s.choice.frame.step.op,'finalReplacementResume');assert.equal(s.choice.player,1);assert.deepEqual(s.choice.options.map(o=>o.value.at).sort((a,b)=>a-b),[0,3]);s=restoreGame(JSON.parse(JSON.stringify(s)));s=dispatch(s,{type:'choose',player:1,option:s.choice.options.findIndex(o=>o.value.at===3)});assert.deepEqual(geometryOccupied(liveUnit(s,u.uid)),[3,4]);assert.equal(liveUnit(s,u.uid).geometryWrap,false);
});
test('The Rack expanded Avatar shrinks to one chosen existing location when Globe removal leaves no legal fixed footprint',()=>{
 let s=engineState();for(const site of s.board)site.card=card('gnome_hollows').id;s.units.find(u=>u.controller===0).at=11;const u=s.units.find(u=>u.controller===1&&card(u.card).type==='Avatar');u.at=4;u.mods.push({power:10});setFixedGeometry(u,[4,0],true);addGlobe(s);s=beginAlkahest(s,10);
 assert.equal(s.choice.player,1);assert.deepEqual(s.choice.options.map(o=>o.value.at).sort((a,b)=>a-b),[0,4]);s=dispatch(s,{type:'choose',player:1,option:s.choice.options.findIndex(o=>o.value.at===0)});assert.deepEqual(geometryLocationRecords(liveUnit(s,u.uid)),[{at:0,layer:'surface'}]);assert.equal(liveUnit(s,u.uid).size,1);assert.equal(liveUnit(s,u.uid).geometryFixedCells,undefined);
});
test('Megamoeba multi-step growth checks Gnome Hollows entry power before each new pseudopod',()=>{
 let s=engineState();const u=addEngineUnit(s,'megamoeba',12,0,{mods:[{movement:2}]});s.board[9].card=card('gnome_hollows').id;s=restoreGame(s);
 // 12→7→8 gives three occupied locations; a third expansion into 9 is
 // prohibited at power three, even though the starting unit had power one.
 assert.ok(!legalActions(s).some(a=>a.type==='move'&&a.unit===u.uid&&a.at===9));s.board[9].card=card('valley').id;assert.ok(legalActions(s).some(a=>a.type==='move'&&a.unit===u.uid&&a.at===9));
});
test('Megamoeba can move to an already occupied remote location to carry its artifact without gaining power',()=>{
 let s=engineState();const u=addEngineUnit(s,'megamoeba',12,0,{geometryLocations:[{at:12,layer:'surface'},{at:0,layer:'surface'}],geometryAnchor:{at:12,layer:'surface'}});s.artifacts.push({uid:'gear',card:card('sword_and_shield').id,owner:0,controller:0,bearer:u.uid,at:12});s=restoreGame(s);
 const beforePower=liveUnit(s,u.uid).ongoingPower;const move=legalActions(s).find(a=>a.type==='move'&&a.unit===u.uid&&a.at===0);assert.ok(move);s=dispatch(s,move);assert.deepEqual(geometryOccupied(liveUnit(s,u.uid)),[12,0]);assert.equal(liveUnit(s,u.uid).ongoingPower,beforePower);assert.equal(s.artifacts.find(a=>a.uid==='gear').at,0);
});
test('Megamoeba can grow away and still attack through the original retained location',()=>{
 let s=engineState();const u=addEngineUnit(s,'megamoeba',12,0,{mods:[{power:10}]}),enemy=addEngineUnit(s,'brown_bears',12,1);s=restoreGame(s);
 const attack=legalActions(s).find(a=>a.type==='attack'&&a.unit===u.uid&&a.at===7&&a.target===enemy.uid&&a.combatAt===12);assert.ok(attack);s=dispatch(s,attack);if(s.pending&&!s.choice)s=dispatch(s,{type:'pass',player:1});assert.deepEqual(geometryOccupied(liveUnit(s,u.uid)),[12,7]);assert.ok(!liveUnit(s,enemy.uid));assert.ok(s.players[1].cemetery.includes(enemy.card));
});
test('Megamoeba silenced oversized shape crosses a Globe edge as a whole without growth',()=>{
 let s=engineState();const u=addEngineUnit(s,'megamoeba',0,0,{mods:[{silenced:true}],geometryLocations:[{at:0,layer:'surface'},{at:1,layer:'surface'}],geometryAnchor:{at:0,layer:'surface'}});addGlobe(s);s=restoreGame(s);
 const move=legalActions(s).find(a=>a.type==='move'&&a.unit===u.uid&&a.at===15);assert.ok(move);s=dispatch(s,move);assert.deepEqual(geometryOccupied(liveUnit(s,u.uid)),[15,16]);assert.equal(liveUnit(s,u.uid).ongoingPower,0);
});
test('Aethermoeba real hand cast and later movement retain the original Site while its void part supplies power',()=>{
 let s=engineState();s.board[7]=null;const h={uid:'h'+s.next++,card:card('aethermoeba').id};s.players[0].hand.push(h);s=restoreGame(s);const cast=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid&&a.at===12);assert.ok(cast);s=dispatch(s,cast);const u=s.units.find(u=>u.card===h.card);assert.ok(u);assert.equal(u.ongoingPower,0);
 s=dispatch(s,{type:'end',player:0});s=dispatch(s,{type:'draw',player:1,deck:'spells'});s=dispatch(s,{type:'end',player:1});s=dispatch(s,{type:'draw',player:0,deck:'spells'});const move=legalActions(s).find(a=>a.type==='move'&&a.unit===u.uid&&a.at===7);assert.ok(move);s=dispatch(s,move);assert.deepEqual(geometryOccupied(liveUnit(s,u.uid)),[12,7]);assert.equal(liveUnit(s,u.uid).ongoingPower,1);
});
test('Megamoeba is banished if any retained part becomes void even when its latest anchor remains on a safe Site',()=>{
 let s=engineState();const u=addEngineUnit(s,'megamoeba',12,0,{geometryLocations:[{at:12,layer:'surface'},{at:0,layer:'surface'}],geometryAnchor:{at:12,layer:'surface'}});s=restoreGame(s);s.board[0]=null;s=dispatch(s,{type:'end',player:0});assert.ok(!liveUnit(s,u.uid));assert.ok(s.players[0].banished.includes(u.card));
});


test('Cerberus borrowed printed source constrains off-realm VV summon location even when duplicate sources have no scalar passive',()=>{
 const s=state();s.units=[unit('sorcerer',17)];const contextual={...card('vivien_the_enchantress'),slug:'__vivien_geometry_constraint',printedAbilityRecord:{records:[{passive:{}},{passive:{geometryFollowAvatar:true}},{passive:{geometryFollowAvatar:true}}]}};
 assert.equal(geometrySummonAllowed(s,0,contextual,12,card),false);
 assert.equal(geometrySummonAllowed(s,0,contextual,17,card),true);
 assert.equal(geometrySummonAllowed(s,0,contextual,17,card,undefined,'below'),false);
 s.units[0].layer='below';assert.equal(geometrySummonAllowed(s,0,contextual,17,card,undefined,'below'),true);
 assert.equal(geometrySummonAllowed(s,0,{...contextual,printedAbilityRecord:{records:[{passive:{}}]}},12,card),true);
});
