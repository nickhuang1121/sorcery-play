import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {install,card,starter} from '../src/cards.js';
import {newGame,dispatch,legalActions,unit,restoreGame,resources} from '../src/engine.js';

install(JSON.parse(fs.readFileSync(new URL('../data/official-cards.json',import.meta.url))));
function game(){const s=newGame([starter(),starter()],42,'local');s.turn=5;s.active=0;s.phase='main';s.artifacts=[];s.auras=[];s.storyline=[];s.choice=null;s.units.forEach(u=>{u.born=0;u.tapped=false;});s.board=Array.from({length:20},(_,at)=>({uid:'site'+at,card:card('valley').id,owner:at<10?1:0,controller:at<10?1:0}));for(const pl of s.players){pl.hand=[];pl.bonusMana=30;pl.bonusAffinity={air:10,earth:10,fire:10,water:10};}return s;}
function add(s,slug,at=12,p=0,extra={}){const u={uid:'u'+s.next++,card:card(slug).id,at,owner:p,controller:p,born:0,damage:0,mods:[],tapped:false,...extra};s.units.push(u);return u;}
function put(s,slug,at=12,p=0){s.board[at]={uid:'site'+s.next++,card:card(slug).id,owner:p,controller:p};return {...s.board[at],at,layer:'surface'};}
function effect(s,source,step,value){s.choice={player:source.controller,title:step.op,options:[{label:'Run',value}],frame:{source:structuredClone(source),controller:source.controller,effectCard:source.card,step}};return dispatch(s,{type:'choose',player:source.controller,option:0});}
function choose(s,fn){const index=s.choice.options.findIndex(o=>fn(o.value));assert.ok(index>=0,JSON.stringify(s.choice.options));return dispatch(s,{type:'choose',player:s.choice.player,option:index});}
function settle(s){let count=0;while(s.choice){assert.ok(count++<100,'Bounded serializable path');s=choose(s,()=>true);}return s;}
function playSite(s,slug,at=12){s.board[at]=null;const h={uid:'h'+s.next++,card:card(slug).id};s.players[0].hand.push(h);const a=legalActions(s).find(a=>a.type==='site'&&a.hand===h.uid&&a.at===at);assert.ok(a,'No legal site play '+slug);return dispatch(s,a);}
function nextMain(s){if(s.phase==='draw')s=dispatch(s,legalActions(s).find(a=>a.type==='draw'&&a.deck==='spells'));return s;}

test('final sites: Orpheus does not zero life and summons from either cemetery with original ownership and new control',()=>{
 let s=game();s.players[1].cemetery.push(card('wild_boars').id);s=playSite(s,'orpheus_crossing');assert.equal(s.players[0].life,20);assert.equal(s.players[0].doorTurn,5);assert.ok(s.choice);
 s=choose(s,v=>v?.player===1);const u=s.units.find(u=>card(u.card).slug==='wild_boars');assert.equal(u.at,12);assert.equal(u.owner,1);assert.equal(u.controller,0);assert.equal(s.players[1].cemetery.length,0);
});
test('final sites: Orpheus temporary Door still allows actual life loss and expires at next owner turn',()=>{
 let s=game();s=playSite(s,'orpheus_crossing');s=effect(s,s.units[1],{op:'damage',amount:3},{uid:s.units[0].uid,entity:'unit'});assert.equal(s.players[0].life,17);assert.equal(s.winner,null);
 s=dispatch(s,{type:'end',player:0});assert.notEqual(s.players[0].doorTurn,null);s=nextMain(s);s=dispatch(s,{type:'end',player:1});assert.equal(s.active,0);assert.equal(s.players[0].doorTurn,null);assert.equal(s.players[0].life,17);
});
test('final sites: Orpheus does not remove pre-existing permanent Death Door or rescue zero-life state at expiry',()=>{
 let s=game();s.players[0].life=0;s.players[0].doorTurn=3;s=playSite(s,'orpheus_crossing');assert.equal(s.players[0].doorTurn,3);s=dispatch(s,{type:'end',player:0});s=nextMain(s);s=dispatch(s,{type:'end',player:1});assert.equal(s.players[0].doorTurn,3);
 let t=game();t=playSite(t,'orpheus_crossing');t=effect(t,t.units[1],{op:'damage',amount:30},{uid:t.units[0].uid,entity:'unit'});assert.equal(t.players[0].life,0);t=dispatch(t,{type:'end',player:0});t=nextMain(t);t=dispatch(t,{type:'end',player:1});assert.notEqual(t.players[0].doorTurn,null);
});
test('final sites: Orpheus save restore preserves temporary vulnerability, opponent damage loses despite positive life',()=>{
 let s=game();s=playSite(s,'orpheus_crossing');s=restoreGame(JSON.parse(JSON.stringify(s)));s=dispatch(s,{type:'end',player:0});s=nextMain(s);s=effect(s,s.units[1],{op:'damage',amount:1},{uid:s.units[0].uid,entity:'unit'});assert.equal(s.winner,1);
});
test('final sites: Orpheus resurrection executes Genesis',()=>{
 let s=game();s.players[0].cemetery.push(card('lesser_blood_demon').id);s=playSite(s,'orpheus_crossing');s=choose(s,v=>v?.card===card('lesser_blood_demon').id);assert.equal(s.players[0].life,18);assert.ok(s.units.some(u=>card(u.card).slug==='lesser_blood_demon'));
});
test('final sites: Orpheus resurrection pays existing minion summoning tax without charging normal mana cost',()=>{
 let s=game();put(s,'mock_court',15,1);s.players[0].cemetery.push(card('wild_boars').id);s=playSite(s,'orpheus_crossing');s=choose(s,v=>v?.card===card('wild_boars').id);assert.equal(s.players[0].spent,1);assert.ok(s.units.some(u=>card(u.card).slug==='wild_boars'));
});
test('final sites: Orpheus Bureau refusal still grants temporary Door, while paying once enables its complete summon',()=>{
 for(const pay of [false,true]){let s=game();put(s,'bureau_of_occult_control',6,1);s.players[0].cemetery.push(card('wild_boars').id);s=playSite(s,'orpheus_crossing');assert.equal(s.choice.frame.step.op,'zoneAccessOffer');s=restoreGame(JSON.parse(JSON.stringify(s)));s=choose(s,v=>v===pay);assert.equal(s.players[0].doorTurn,5);assert.equal(s.players[0].life,20);
  if(pay){s=choose(s,v=>v?.card===card('wild_boars').id);assert.equal(s.players[0].spent,2);assert.ok(s.units.some(u=>card(u.card).slug==='wild_boars'));}
  else{assert.equal(s.choice,null);assert.equal(s.players[0].spent,0);assert.equal(s.players[0].cemetery.length,1);}
 }
});
test('final sites: Orpheus respects Wormelow after Mortuary swaps its protected view, and keeps resurrected card ownership',()=>{
 let s=game();put(s,'wormelow_tump',7,1);put(s,'mismanaged_mortuary',6,1);s.players[0].cemetery.push(card('wild_boars').id);s.players[1].cemetery.push(card('brown_bears').id);s=playSite(s,'orpheus_crossing');assert.ok(s.choice.options.some(o=>o.value?.player===1));assert.ok(!s.choice.options.some(o=>o.value?.player===0));s=choose(s,v=>v?.player===1);const u=s.units.find(u=>card(u.card).slug==='brown_bears');assert.equal(u.owner,1);assert.equal(u.controller,0);assert.equal(s.players[0].cemetery[0],card('wild_boars').id);
});

test('final sites: Mudslide uses a single direction for all units in its land column across void and both controllers',()=>{
 let s=game();s.board[7]=null;const enemy=add(s,'wild_boars',2,1),ally=add(s,'brown_bears',17,0),other=add(s,'brown_bears',11,1);s=playSite(s,'mudslide',12);assert.equal(s.choice.options.length,2);s=choose(s,v=>v===1);
 assert.equal(unit(s,enemy.uid).at,3);assert.equal(unit(s,ally.uid).at,18);assert.equal(unit(s,other.uid).at,11);assert.equal(s.units.find(u=>u.controller===0&&card(u.card).type==='Avatar').at,18);assert.equal(s.units.find(u=>u.controller===1&&card(u.card).type==='Avatar').at,3);
});
test('final sites: Mudslide ignores water sites, carries equipment, and cannot wrap left edge or force Iron Man Talus',()=>{
 let s=game();put(s,'spring_river',7,1);const wet=add(s,'wild_boars',7,1),talus=add(s,'iron_man_talus',17),ground=add(s,'brown_bears',2,1);s.artifacts.push({uid:'boots',card:card('seven_league_boots').id,owner:1,bearer:ground.uid,at:2});s=playSite(s,'mudslide',12);s=choose(s,v=>v===-1);assert.equal(unit(s,wet.uid).at,7);assert.equal(unit(s,talus.uid).at,17);assert.equal(unit(s,ground.uid).at,1);assert.equal(s.artifacts.find(a=>a.uid==='boots').at,1);
 let t=game();const edge=add(t,'brown_bears',5,1);t=playSite(t,'mudslide',10);t=choose(t,v=>v===-1);assert.equal(unit(t,edge.uid).at,5);
});
test('final sites: Mudslide can slide Immobile units but cannot push Voidwalk minions across the land/void boundary',()=>{
 let s=game();const immobile=add(s,'brown_bears',2,1,{mods:[{keyword:'Immobile'}]}),walker=add(s,'brown_bears',17,0,{mods:[{keyword:'Voidwalk'}]});s.board[18]=null;s=playSite(s,'mudslide',12);s=choose(s,v=>v===1);assert.equal(unit(s,immobile.uid).at,3);assert.equal(unit(s,walker.uid).at,17);
});

test('final sites: Sanctuary requires four earth, declares shortest steps, and Wards only after arrival',()=>{
 let s=game();put(s,'mount_ussar_sanctuary',10);const id=s.units[0].uid;s.players[0].life=1;s=effect(s,s.units[1],{op:'damage',amount:1},{uid:id,entity:'unit'});assert.ok(s.choice);assert.equal(unit(s,id).at,17);assert.equal(unit(s,id).ward,false);
 s=restoreGame(JSON.parse(JSON.stringify(s)));s=settle(s);assert.equal(unit(s,id).at,10);assert.equal(unit(s,id).ward,true);assert.equal(s.players[0].life,0);
});
test('final sites: Sanctuary has no movement or Ward if no complete legal path or insufficient threshold',()=>{
 let s=game();s.board=Array(20).fill(null);put(s,'valley',17);put(s,'valley',2,1);put(s,'mount_ussar_sanctuary',0);s.players[0].bonusAffinity.earth=4;s.players[0].life=1;const id=s.units[0].uid;s=effect(s,s.units[1],{op:'damage',amount:1},{uid:id,entity:'unit'});s=settle(s);assert.equal(unit(s,id).at,17);assert.equal(unit(s,id).ward,false);
 let t=game();t.board=Array(20).fill(null);put(t,'mount_ussar_sanctuary',16);put(t,'valley',17);put(t,'valley',2,1);t.players[0].bonusAffinity.earth=0;assert.ok(resources(t,0).earth<4);t.players[0].life=1;t=effect(t,t.units[1],{op:'damage',amount:1},{uid:t.units[0].uid,entity:'unit'});assert.equal(t.choice,null);assert.equal(t.units[0].at,17);assert.equal(t.units[0].ward,false);
});

test('final sites: Dungeon arms only the next allied Avatar strike and moves surviving units via shortest routes',()=>{
 let s=game();const attacker=add(s,'brown_bears',2);s=playSite(s,'darkest_dungeon',12);const target=s.units.find(u=>u.controller===1&&card(u.card).type==='Avatar');s=effect(s,attacker,{op:'strike'},{uid:target.uid,entity:'unit'});assert.ok(s.choice);assert.equal(unit(s,attacker.uid).at,2);s=settle(s);assert.equal(unit(s,attacker.uid).at,12);assert.equal(unit(s,target.uid).at,12);assert.equal(s.finalDungeonArms[0].used,true);
});
test('final sites: Dungeon consumes strike trigger even through Ward, but does not drag when one participant dies or has no path',()=>{
 let s=game();const attacker=add(s,'brown_bears',2);s=playSite(s,'darkest_dungeon');const target=s.units[1];target.ward=true;s=effect(s,attacker,{op:'strike'},{uid:target.uid,entity:'unit'});s=settle(s);assert.equal(unit(s,target.uid).at,12);assert.equal(s.players[1].life,20);
 let t=game();const a=add(t,'brown_bears',2,0,{mods:[]});t=playSite(t,'darkest_dungeon');t.units=t.units.filter(u=>u.uid!==a.uid);const arm=t.finalDungeonArms[0];t=effect(t,{...arm.source,controller:0},{op:'finalDungeonDrag',striker:a.uid,avatar:t.units[1].uid,goal:{at:12,layer:'surface'}},undefined);assert.equal(t.units[1].at,2);assert.equal(t.choice,null);
 let z=game();const b=add(z,'brown_bears',2);z=playSite(z,'darkest_dungeon');z.board=Array(20).fill(null);put(z,'valley',2,1);put(z,'valley',17);put(z,'darkest_dungeon',12);z=effect(z,b,{op:'strike'},{uid:z.units[1].uid,entity:'unit'});assert.equal(unit(z,b.uid).at,2);assert.equal(z.units[1].at,2);assert.equal(z.choice,null);
});
test('final sites: Dungeon trigger expires at end of its turn',()=>{
 let s=game();const attacker=add(s,'brown_bears',2);s=playSite(s,'darkest_dungeon');s=dispatch(s,{type:'end',player:0});s=nextMain(s);s=effect(s,unit(s,attacker.uid),{op:'strike'},{uid:s.units[1].uid,entity:'unit'});assert.equal(s.choice,null);assert.equal(unit(s,attacker.uid).at,2);
});
test('final sites: Dungeon does not move Avatar when the striking ally dies in the same actual fight',()=>{
 let s=game();const attacker=add(s,'grain_sparrow',2),enemy=s.units[1];s=playSite(s,'darkest_dungeon');const action=legalActions(s).find(a=>a.type==='attack'&&a.unit===attacker.uid&&a.target===enemy.uid);assert.ok(action);s=dispatch(s,action);
 let count=0;while(s.choice||s.pending){assert.ok(count++<100);if(s.choice)s=choose(s,()=>true);else s=dispatch(s,{type:'pass',player:s.pending.player});}
 assert.equal(unit(s,attacker.uid),undefined);assert.equal(unit(s,enemy.uid).at,2);assert.equal(s.players[1].life,19);assert.equal(s.finalDungeonArms[0].used,true);
});
test('final sites: Dungeon can drag Immobile units, uses cardinal forced steps and cannot cross regions even with Voidwalk',()=>{
 let s=game();const attacker=add(s,'brown_bears',2,0,{mods:[{keyword:'Immobile'},{keyword:'Airborne'}]});s=playSite(s,'darkest_dungeon',11);s=effect(s,attacker,{op:'strike'},{uid:s.units[1].uid,entity:'unit'});
 let checked=0;while(s.choice){if(s.choice.frame.step.op==='finalSiteRoute'){const f=s.choice.frame.step,route=f.routes[f.index],from=route[route.length-1];for(const option of s.choice.options){const to=option.value;assert.equal(Math.abs(to.at%5-from.at%5)+Math.abs(Math.floor(to.at/5)-Math.floor(from.at/5)),1);checked++;}}s=choose(s,()=>true);}assert.ok(checked>0);assert.equal(unit(s,attacker.uid).at,11);
 let t=game();t.board[9]=null;const walker=add(t,'brown_bears',9,0,{mods:[{keyword:'Voidwalk'}]});t=playSite(t,'darkest_dungeon');t=effect(t,walker,{op:'strike'},{uid:t.units[1].uid,entity:'unit'});assert.equal(t.choice,null);assert.equal(unit(t,walker.uid).at,9);assert.equal(t.units[1].at,2);
});
