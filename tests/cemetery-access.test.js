import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {install,card} from '../src/cards.js';
import {appendGrave,graveEntries,takeGrave} from '../src/cemetery.js';
import * as Z from '../src/cemetery-access.js';
install(JSON.parse(fs.readFileSync(new URL('../data/official-cards.json',import.meta.url))));
const A={card,resources:(s,p)=>({available:s.players[p].mana-s.players[p].spent,earth:s.players[p].earth})};
function state(){return {next:1,board:Array(20).fill(null),players:[0,1].map(()=>({mana:10,spent:0,earth:3,cemetery:[],banished:[]}))};}
function site(s,slug,at=12,p=0,extra={}){return s.board[at]={card:card(slug).id,owner:p,controller:p,...extra};}
function grave(s,p,slug){appendGrave(s,p,card(slug).id);return graveEntries(s,p).at(-1);}

test('Mortuary FAQ: only view identity swaps; cards still enter their owner physical cemetery',()=>{
 const s=state(),a=grave(s,0,'wild_boars'),b=grave(s,1,'skeleton');site(s,'mismanaged_mortuary');
 assert.deepEqual(Z.cemeteryCards(s,0,A),[b.card]);assert.deepEqual(Z.cemeteryCards(s,1,A),[a.card]);assert.equal(Z.viewCemeteryEntries(s,0,A)[0].player,1);
 grave(s,0,'brown_bears');assert.equal(s.players[0].cemetery.length,2);assert.equal(Z.viewCemeteryEntries(s,1,A).length,2);assert.equal(Z.viewCemeteryEntries(s,0,A).length,1);
});
test('Mortuary FAQ: even active copies cancel, and silence or leaving restores odd parity',()=>{
 const s=state();site(s,'mismanaged_mortuary');site(s,'mismanaged_mortuary',13,1);assert.equal(Z.cemeteryPhysicalPlayer(s,0,A),0);s.board[13].silenced=true;assert.equal(Z.cemeteryPhysicalPlayer(s,0,A),1);site(s,'mismanaged_mortuary',14,1);assert.equal(Z.cemeteryPhysicalPlayer(s,0,A),0);s.board[14]=null;assert.equal(Z.cemeteryPhysicalPlayer(s,0,A),1);
});
test('Wormelow protects affected cards only and follows swapped view identity at three-earth threshold',()=>{
 const s=state(),g=grave(s,1,'skeleton');site(s,'wormelow_tump',12,0);site(s,'mismanaged_mortuary',13,1);
 assert.equal(Z.canAffectCemetery(s,1,1,A),false);assert.equal(Z.canAffectCemetery(s,0,1,A),true);assert.equal(Z.physicalCemeteryEntries(s,1,A,{actor:1,affect:false})[0].card,g.card);assert.deepEqual(Z.physicalCemeteryEntries(s,1,A,{actor:1,affect:true}),[]);
 s.players[0].earth=2;assert.equal(Z.canAffectCemetery(s,1,1,A),true);s.players[0].earth=3;s.board[12].disabled=true;assert.equal(Z.canAffectCemetery(s,1,1,A),true);
});
test('Bureau FAQ: look/count/add cost zero, while one accepted effect pays for every leaving card',()=>{
 const s=state();site(s,'bureau_of_occult_control');const a=grave(s,0,'wild_boars'),b=grave(s,0,'brown_bears');assert.equal(Z.viewCemeteryEntries(s,0,A).length,2);assert.equal(s.players[0].spent,0);assert.deepEqual(Z.viewCemeteryEntries(s,0,A,{affect:true}),[]);
 const scope=Z.commitZoneAccess(s,0,A);assert.equal(s.players[0].spent,2);assert.equal(Z.zoneAccessPreviewCost(s,0,A,scope),0);assert.ok(Z.takeAccessGrave(s,a,0,A,scope));
 const current=graveEntries(s,0).find(g=>g.uid===b.uid);assert.ok(Z.takeAccessGrave(s,current,0,A,scope));Z.commitZoneAccess(s,0,A,{scope});assert.equal(s.players[0].spent,2);assert.equal(s.players[0].cemetery.length,0);
});
test('Bureau refusal blocks leaving cemetery/collection but preserves read access and permits other-zone effects',()=>{
 const s=state();site(s,'bureau_of_occult_control');const g=grave(s,0,'wild_boars'),scope=Z.commitZoneAccess(s,0,A,{pay:false});assert.equal(s.players[0].spent,0);assert.equal(Z.zoneAccessAllowed(s,0,A,scope),false);assert.equal(Z.takeAccessGrave(s,g,0,A,scope),null);assert.equal(s.players[0].cemetery.length,1);assert.equal(Z.viewCemeteryEntries(s,0,A,{scope}).length,1);assert.equal(Z.zoneAccessPreviewCost(s,0,A,scope),Infinity);
});
test('Bureau scope survives JSON and gives both Boneyard players one independent permission each',()=>{
 let s=state();site(s,'bureau_of_occult_control');const original=Z.commitZoneAccess(s,0,A);s.savedFrame={zoneAccessScope:structuredClone(original)};s=JSON.parse(JSON.stringify(s));const sameEffect=Z.commitZoneAccess(s,1,A,{scope:s.savedFrame.zoneAccessScope});assert.equal(s.players[0].spent,2);assert.equal(s.players[1].spent,2);assert.equal(sameEffect.id,original.id);
 Z.commitZoneAccess(s,0,A,{scope:s.savedFrame.zoneAccessScope});Z.commitZoneAccess(s,1,A,{scope:s.savedFrame.zoneAccessScope});assert.equal(s.players[0].spent,2);assert.equal(s.players[1].spent,2);
});
test('Bureau separate cost cannot be discounted or silently exceed the regular spell budget',()=>{
 const s=state();site(s,'bureau_of_occult_control');site(s,'bureau_of_occult_control',13,1);s.players[0].mana=5;assert.equal(Z.zoneAccessCost(s,A),4);assert.equal(Z.canPayZoneAccess(s,0,A,2),false);assert.equal(Z.canPayZoneAccess(s,0,A,0),true);s.players[0].mana=3;assert.throws(()=>Z.commitZoneAccess(s,0,A),/無法支付/);assert.equal(s.players[0].spent,0);assert.equal(s.zoneAccessScopes,undefined);
});
test('Wormelow mass prevention neither hides public cards nor affects burial into the physical owner zone',()=>{
 const s=state();site(s,'wormelow_tump',12,1);const a=grave(s,0,'wild_boars'),b=grave(s,1,'skeleton');assert.deepEqual(Z.removeAccessGraves(s,1,()=>true,0,A),[]);assert.equal(Z.cemeteryCards(s,1,A).length,1);assert.deepEqual(Z.removeAccessGraves(s,0,()=>true,0,A),[a.card]);
 grave(s,1,'brown_bears');assert.equal(s.players[1].cemetery.length,2);assert.ok(graveEntries(s,1).some(g=>g.uid===b.uid));
});
test('Physical descriptors never swap twice, and stale cemetery visits cannot move a re-entered copy',()=>{
 const s=state();site(s,'mismanaged_mortuary');const g=grave(s,1,'wild_boars'),read=Z.viewCemeteryEntries(s,0,A)[0];assert.equal(read.player,1);assert.ok(Z.takeAccessGrave(s,read,0,A));grave(s,1,'wild_boars');assert.equal(Z.canMoveGrave(s,g,0,A),false);assert.equal(s.players[1].cemetery.length,1);
});
test('Bureau explicit effect manifest distinguishes cemetery search from hand/book and read-only selection',()=>{
 assert.deepEqual(Z.effectsAccessZones([{op:'searchSummon',zones:['hand','spells']}]),[]);assert.deepEqual(Z.effectsAccessZones([{op:'searchSummon',zones:['hand','cemetery','spells']}]),['cemetery']);assert.deepEqual(Z.effectsAccessZones([{op:'peek',select:{kind:'grave',readOnly:true}}]),[]);assert.deepEqual(Z.effectsAccessZones([{op:'collectionPermit',zone:'cemetery'}]),['cemetery']);assert.deepEqual(Z.effectsAccessZones([{op:'collectionPermit',filter:{type:'Minion'}}]),['collection']);
});
test('Bureau pre-effect choice is serializable and refusing it does not consume mana',()=>{
 let s=state();site(s,'bureau_of_occult_control');const scope=Z.createZoneAccessScope(s),frame={source:{card:card('sorcerer').id},controller:0,effectCard:card('sorcerer').id,zoneAccessScope:scope,step:{op:'zoneAccessOffer',scope,player:0}};
 Z.resolveZoneAccess(s,frame,A);assert.equal(s.choice.options.length,2);assert.equal(s.players[0].spent,0);s=JSON.parse(JSON.stringify(s));Z.resolveZoneAccess(s,{...s.choice.frame,selected:false},A);assert.equal(Z.zoneAccessDecision(s,0,scope),'declined');assert.equal(s.players[0].spent,0);
});

// Whole-card acceptance cases use the actual game dispatcher and engine API.
import * as E from '../src/engine.js';
import {starter} from '../src/cards.js';
function game(){const s=E.newGame([starter(),starter()],42,'local');s.phase='main';s.active=0;s.turn=4;s.pending=null;s.choice=null;s.storyline=[];s.artifacts=[];s.auras=[];s.units.forEach(u=>{u.at=u.controller===0?12:2;u.born=0;u.tapped=false;u.justEntered=false;});s.board=s.board.map((_,at)=>({uid:'s'+s.next++,card:card('valley').id,owner:at<10?1:0,controller:at<10?1:0}));for(const p of s.players){p.hand=[];p.cemetery=[];p.graves=[];p.spent=0;p.bonusMana=60;p.bonusAffinity={air:10,earth:10,fire:10,water:10};}return s;}
function existing(s,slug,at=12,p=0){const u={uid:'u'+s.next++,card:card(slug).id,at,owner:p,controller:p,tapped:false,born:0,damage:0,mods:[]};s.units.push(u);return u;}
function choose(s,predicate){assert.ok(s.choice);const option=s.choice.options.findIndex(o=>predicate(o.value,o));assert.notEqual(option,-1,'Missing expected choice '+s.choice.title);return E.dispatch(s,{type:'choose',player:s.choice.player,option});}
function settle(s){let n=0;while(s.choice){assert.ok(n++<100,'Continuation loop');s=choose(s,()=>true);}return s;}
function effect(s,op,extra={}){const source=E.avatar(s,0);s.choice={player:0,title:op,options:[{label:'Run',value:true}],frame:{source:structuredClone(source),controller:0,effectCard:source.card,step:{op,...extra}}};return E.dispatch(s,{type:'choose',player:0,option:0});}
function handCast(s,slug){const h={uid:'h'+s.next++,card:card(slug).id};s.players[0].hand.push(h);const a=E.legalActions(s,0).find(a=>a.type==='cast'&&a.hand===h.uid&&(a.at===undefined||a.at===12));assert.ok(a,'No cast for '+slug);return E.dispatch(s,a);}

test('dispatch Mortuary: grave cast uses swapped view while ownership and later burial stay physical',()=>{
 let s=game();site(s,'mismanaged_mortuary',13);grave(s,1,'recurring_specter');s=E.restoreGame(s);const action=E.legalActions(s,0).find(a=>a.type==='cast'&&a.graveOwner===1&&a.at===12&&(a.layer||'surface')==='surface');assert.ok(action);s=E.dispatch(s,action);const u=s.units.find(u=>card(u.card).slug==='recurring_specter');assert.ok(u);assert.equal(u.owner,1);assert.equal(u.controller,0);assert.equal(s.players[1].cemetery.length,0);
 const source=E.avatar(s,0);s.choice={player:0,title:'Destroy',options:[{label:'Destroy',value:{entity:'unit',uid:u.uid}}],frame:{source:structuredClone(source),controller:0,effectCard:source.card,step:{op:'destroy',select:{kind:'unit',minion:true,untargeted:true}}}};s=E.dispatch(s,{type:'choose',player:0,option:0});assert.ok(s.players[1].cemetery.includes(card('recurring_specter').id));assert.equal(s.players[0].cemetery.includes(card('recurring_specter').id),false);
});
test('dispatch Mortuary: two active copies cancel both grave cast views and cemetery-power effects',()=>{
 let s=game();const beast=existing(s,'wolpertinger');grave(s,0,'recurring_specter');grave(s,1,'wild_boars');grave(s,1,'brown_bears');site(s,'mismanaged_mortuary',13);s=E.restoreGame(s);assert.equal(E.power(E.unit(s,beast.uid)),card('wolpertinger').attack+2);assert.equal(E.legalActions(s,0).some(a=>a.type==='cast'&&a.graveOwner===0),false);
 site(s,'mismanaged_mortuary',14,1);s=E.restoreGame(s);assert.equal(E.power(E.unit(s,beast.uid)),card('wolpertinger').attack);assert.ok(E.legalActions(s,0).some(a=>a.type==='cast'&&a.graveOwner===0));
});
test('dispatch Wormelow: target and mass effects leave protected graves untouched while public reads stay visible',()=>{
 let s=game();site(s,'wormelow_tump',13,1);grave(s,0,'wild_boars');grave(s,1,'skeleton');s.players[0].life=10;s.players[0].maxLife=20;s=E.restoreGame(s);const frame={source:E.avatar(s,0),controller:0};assert.equal(E.effectOptions(s,frame,{kind:'grave'}).some(o=>o.value.player===1),false);assert.equal(E.effectOptions(s,frame,{kind:'grave',readOnly:true}).some(o=>o.value.player===1),true);
 s=settle(effect(s,'banishDeadHeal'));assert.deepEqual(s.players[1].cemetery,[card('skeleton').id]);assert.deepEqual(s.players[0].banished,[card('wild_boars').id]);assert.equal(s.players[0].life,11);
});
test('dispatch Wormelow/Mortuary: protection follows viewed cemetery, not original owner, and threshold is live',()=>{
 let s=game();site(s,'wormelow_tump',13,1);site(s,'mismanaged_mortuary',14,0);grave(s,0,'wild_boars');grave(s,1,'skeleton');s=E.restoreGame(s);const frame={source:E.avatar(s,0),controller:0};assert.equal(E.effectOptions(s,frame,{kind:'grave'}).some(o=>o.value.player===0),false);assert.ok(E.effectOptions(s,frame,{kind:'grave'}).some(o=>o.value.player===1));s.players[1].bonusAffinity={air:0,earth:0,fire:0,water:0};s.board=s.board.map((v,i)=>i===13||i===14?v:null);s=E.restoreGame(s);assert.ok(E.effectOptions(s,{source:E.avatar(s,0),controller:0},{kind:'grave'}).some(o=>o.value.player===0));
});
test('dispatch Bureau: grave-cast tax is separate, cancellation is free, and Ghostfire self-banish does not pay again',()=>{
 let s=game();site(s,'bureau_of_occult_control',13);grave(s,0,'ghostfire');s=E.restoreGame(s);const action=E.legalActions(s,0).find(a=>a.type==='cast'&&a.grave!==undefined);assert.ok(action);assert.equal(E.castingCost(s,0,card('ghostfire'),undefined,E.avatar(s,0),undefined,0,'surface',action),1);s=E.dispatch(s,action);assert.equal(s.players[0].spent,0);s=choose(s,v=>v===null);assert.equal(s.players[0].spent,0);assert.deepEqual(s.players[0].cemetery,[card('ghostfire').id]);
 s=E.dispatch(s,action);s=choose(s,v=>v!==null);s=settle(s);assert.equal(s.players[0].spent,3);assert.ok(s.players[0].banished.includes(card('ghostfire').id));assert.equal(s.players[0].cemetery.length,0);
});
test('dispatch Bureau: decline preserves mixed-zone Adept Illusionist hand search and all grave cards',()=>{
 let s=game();site(s,'bureau_of_occult_control',13);const adept=existing(s,'adept_illusionist');s.players[0].hand=[{uid:'copy-in-hand',card:card('adept_illusionist').id}];grave(s,0,'adept_illusionist');s=E.restoreGame(s);const action=E.legalActions(s,0).find(a=>a.type==='activate'&&a.unit===adept.uid);assert.ok(action);s=E.dispatch(s,action);assert.equal(s.choice.frame.step.op,'zoneAccessOffer');s=choose(s,v=>v===false);s=choose(s,v=>v===false);s=settle(s);assert.equal(s.players[0].spent,0);assert.equal(s.players[0].cemetery.length,1);assert.equal(s.units.filter(u=>card(u.card).slug==='adept_illusionist').length,2);
});
test('dispatch Bureau: one paid effect banishes multiple graves and the payment choice survives JSON restore',()=>{
 let s=game();site(s,'bureau_of_occult_control',13);grave(s,0,'wild_boars');grave(s,1,'brown_bears');s.board[11]=null;s.players[0].hand=[{uid:'pillar',card:card('pillar_of_zeiros').id}];s=E.restoreGame(s);const action=E.legalActions(s,0).find(a=>a.type==='site'&&a.hand==='pillar'&&a.at===11);assert.ok(action);s=E.dispatch(s,action);assert.equal(s.choice.frame.step.op,'zoneAccessOffer');assert.equal(s.players[0].spent,0);s=E.restoreGame(JSON.parse(JSON.stringify(s)));s=choose(s,v=>v===true);s=settle(s);assert.equal(s.players[0].spent,2);assert.equal(s.players[0].cemetery.length+s.players[1].cemetery.length,0);assert.equal(s.players[0].banished.length+s.players[1].banished.length,2);
});
test('dispatch Bureau/Boneyard: each chooser has a separate permission; the opponent cannot spend mana off turn',()=>{
 let s=game();site(s,'bureau_of_occult_control',13);grave(s,0,'wild_boars');grave(s,1,'brown_bears');s.board[11]=null;s.players[0].hand=[{uid:'boneyard',card:card('boneyard').id}];s=E.restoreGame(s);const action=E.legalActions(s,0).find(a=>a.type==='site'&&a.hand==='boneyard'&&a.at===11);assert.ok(action);s=E.dispatch(s,action);assert.equal(s.choice.player,0);s=choose(s,v=>v===true);assert.equal(s.choice.player,1);assert.equal(s.choice.frame.step.op,'zoneAccessOffer');assert.deepEqual(s.choice.options.map(o=>o.value),[false]);assert.throws(()=>Z.commitZoneAccess(s,1,{card,resources:E.resources},{scope:s.choice.frame.zoneAccessScope}),/無法支付/);assert.equal(s.players[1].spent,0);s=choose(s,v=>v===false);s=choose(s,v=>v===null);assert.equal(s.choice.player,0);s=choose(s,v=>v?.card===card('wild_boars').id&&v.layer==='surface');s=settle(s);assert.equal(s.players[0].spent,2);assert.equal(s.players[1].spent,0);assert.ok(s.units.some(u=>card(u.card).slug==='wild_boars'&&u.controller===0));assert.equal(s.units.some(u=>card(u.card).slug==='brown_bears'),false);assert.deepEqual(s.players[1].cemetery,[card('brown_bears').id]);
});
test('dispatch Bureau: a newly summoned minion Genesis is an independent access effect, not its summoning effect ticket',()=>{
 let s=game();site(s,'bureau_of_occult_control',13);grave(s,0,'miracle_workers');appendGrave(s,0,card('wild_boars').id,4);s.board[11]=null;s.players[0].hand=[{uid:'boneyard',card:card('boneyard').id}];s=E.restoreGame(s);const action=E.legalActions(s,0).find(a=>a.type==='site'&&a.hand==='boneyard'&&a.at===11);assert.ok(action);s=E.dispatch(s,action);assert.equal(s.choice.player,0);s=choose(s,v=>v===true);assert.equal(s.choice.player,1);s=choose(s,v=>v===false);s=choose(s,v=>v===null);assert.equal(s.choice.player,0);s=choose(s,v=>v?.card===card('miracle_workers').id&&v.layer==='surface');assert.equal(s.players[0].spent,2);assert.equal(s.choice.frame.step.op,'zoneAccessOffer');assert.equal(s.choice.player,0);s=choose(s,v=>v===true);s=choose(s,v=>v?.card===card('wild_boars').id);s=settle(s);assert.equal(s.players[0].spent,4);assert.ok(s.players[0].hand.some(h=>h.card===card('wild_boars').id));
});
test('dispatch collection: a minion cast through a collection effect is not a hand cast for White Wing',()=>{
 let s=game();existing(s,'order_of_the_white_wing',12);s.board[11]=null;s.players[0].hand=[{uid:'keep',card:card('forlorn_keep').id}];s.players[0].collection=[card('penitent_knight').id];s=E.restoreGame(s);const action=E.legalActions(s,0).find(a=>a.type==='site'&&a.hand==='keep'&&a.at===11);assert.ok(action);s=E.dispatch(s,action);s=choose(s,v=>v!==null);s=settle(s);assert.equal(s.players[0].collection.length,0);assert.equal(s.units.some(u=>card(u.card).slug==='penitent_knight'),false);assert.ok(s.players[0].banished.includes(card('penitent_knight').id));
});
test('dispatch Bureau collection: one tax covers a collection cast and remains separate from the spell cost',()=>{
 let s=game();site(s,'bureau_of_occult_control',13);s.board[11]=null;s.players[0].hand=[{uid:'keep',card:card('forlorn_keep').id}];s.players[0].collection=[card('penitent_knight').id];s=E.restoreGame(s);const action=E.legalActions(s,0).find(a=>a.type==='site'&&a.hand==='keep'&&a.at===11);assert.ok(action);s=E.dispatch(s,action);s=choose(s,v=>v===true);s=choose(s,v=>v!==null);s=settle(s);assert.equal(s.players[0].spent,2+card('penitent_knight').cost);assert.equal(s.players[0].collection.length,0);assert.ok(s.units.some(u=>card(u.card).slug==='penitent_knight'));
});
test('dispatch Bureau/Rescue: refusing tax keeps the grave target, paying it returns the target and charges once',()=>{
 let s=game();site(s,'bureau_of_occult_control',13);grave(s,0,'wild_boars');s=E.restoreGame(s);s=handCast(s,'rescue');assert.equal(s.players[0].spent,card('rescue').cost);assert.equal(s.choice.frame.step.op,'zoneAccessOffer');s=choose(s,v=>v===false);s=settle(s);assert.ok(s.players[0].cemetery.includes(card('wild_boars').id));assert.equal(s.players[0].hand.length,0);assert.equal(s.players[0].spent,card('rescue').cost);
 let paid=game();site(paid,'bureau_of_occult_control',13);grave(paid,0,'wild_boars');paid=E.restoreGame(paid);paid=handCast(paid,'rescue');paid=choose(paid,v=>v===true);paid=settle(paid);assert.ok(paid.players[0].hand.some(h=>h.card===card('wild_boars').id));assert.equal(paid.players[0].spent,card('rescue').cost+2);
});
test('dispatch Mortuary/Rescue: returned foreign card goes to its immutable owner hand',()=>{
 let s=game();site(s,'mismanaged_mortuary',13);grave(s,1,'wild_boars');s=E.restoreGame(s);s=settle(handCast(s,'rescue'));assert.equal(s.players[1].cemetery.length,0);assert.ok(s.players[1].hand.some(h=>h.card===card('wild_boars').id));assert.equal(s.players[0].hand.some(h=>h.card===card('wild_boars').id),false);
});
test('dispatch Bureau/Heir: cancelling an optional grave extra cost is free; confirming pays one separate access fee',()=>{
 let s=game();site(s,'bureau_of_occult_control',13);grave(s,0,'sir_lamorak');const h={uid:'heir-hand',card:card('vengeful_heir').id};s.players[0].hand=[h];s=E.restoreGame(s);const action=E.legalActions(s,0).find(a=>a.type==='cast'&&a.hand===h.uid&&a.at===12);assert.ok(action);s=E.dispatch(s,action);assert.equal(s.players[0].spent,0);s=choose(s,v=>v===null);assert.equal(s.players[0].spent,0);assert.equal(s.players[0].cemetery.length,1);assert.equal(s.players[0].hand.length,1);
 s=E.dispatch(s,action);s=choose(s,v=>v?.card===card('sir_lamorak').id);s=settle(s);assert.equal(s.players[0].spent,card('vengeful_heir').cost+2);assert.ok(s.players[0].banished.includes(card('sir_lamorak').id));assert.equal(s.players[0].hand.length,0);
});
test('dispatch Bureau/Heir: an unaffordable optional banishment is hidden while normal casting stays available',()=>{
 let s=game();site(s,'bureau_of_occult_control',13);grave(s,0,'sir_lamorak');s=E.restoreGame(s);s.players[0].spent=E.resources(s,0).mana-card('vengeful_heir').cost;const before=s.players[0].spent;s=handCast(s,'vengeful_heir');assert.equal(s.choice.frame.step.op,'copyHeirCost');assert.equal(s.choice.options.some(o=>o.value?.card===card('sir_lamorak').id),false);assert.equal(s.players[0].spent,before);s=choose(s,v=>v===false);s=settle(s);assert.equal(s.players[0].spent,before+card('vengeful_heir').cost);assert.equal(s.players[0].cemetery.length,1);assert.ok(s.units.some(u=>card(u.card).slug==='vengeful_heir'));
});
test('dispatch Bureau/Feast: refusal still searches hand and spellbook while leaving the cemetery untouched',()=>{
 let s=game();site(s,'bureau_of_occult_control',13);s.players[1].hand=[{uid:'named-in-hand',card:card('wild_boars').id}];s.players[1].spells=[card('wild_boars').id,card('brown_bears').id];grave(s,1,'wild_boars');s=E.restoreGame(s);s=handCast(s,'feast_for_crows');assert.equal(s.choice.frame.step.op,'zoneAccessOffer');s=choose(s,v=>v===false);s=choose(s,v=>v===card('wild_boars').name);s=settle(s);assert.equal(s.players[0].spent,card('feast_for_crows').cost);assert.equal(s.players[1].hand.length,0);assert.deepEqual(s.players[1].spells,[card('brown_bears').id]);assert.deepEqual(s.players[1].cemetery,[card('wild_boars').id]);assert.equal(s.players[1].banished.filter(id=>id===card('wild_boars').id).length,2);assert.equal(s.zoneAccessScope,undefined);
});
test('dispatch Grim Reaper/Wormelow/Bureau: cemetery protection does not cancel the hand and spellbook parts',()=>{
 let s=game();site(s,'bureau_of_occult_control',13,0);site(s,'wormelow_tump',14,1);const reaper=existing(s,'grim_reaper',12,0),victim=existing(s,'wild_boars',12,1);grave(s,1,'wild_boars');s.players[1].hand=[{uid:'named-hand',card:card('wild_boars').id}];s.players[1].spells=[card('wild_boars').id,card('brown_bears').id];s=E.restoreGame(s);s.choice={player:0,title:'Strike',options:[{label:'Strike',value:{entity:'unit',uid:victim.uid}}],frame:{source:structuredClone(E.unit(s,reaper.uid)),controller:0,effectCard:reaper.card,step:{op:'strike',select:{kind:'unit',minion:true}}}};s=E.dispatch(s,{type:'choose',player:0,option:0});assert.equal(s.choice.frame.step.op,'zoneAccessOffer');s=choose(s,v=>v===true);s=settle(s);assert.equal(s.players[0].spent,2);assert.equal(E.unit(s,victim.uid),undefined);assert.deepEqual(s.players[1].cemetery,[card('wild_boars').id]);assert.equal(s.players[1].hand.length,0);assert.deepEqual(s.players[1].spells,[card('brown_bears').id]);assert.equal(s.players[1].banished.filter(id=>id===card('wild_boars').id).length,3);
});
test('dispatch Mortuary/Bureau: Skeleton-return ability preserves physical owner and pays the separate fee once',()=>{
 let s=game();site(s,'mismanaged_mortuary',13);site(s,'bureau_of_occult_control',14);grave(s,1,'bone_jumble');const skeleton=existing(s,'skeleton',12);s=E.restoreGame(s);const action=E.legalActions(s,0).find(a=>a.type==='resurrect'&&a.graveOwner===1&&a.skeleton===skeleton.uid);assert.ok(action);s=settle(E.dispatch(s,action));const returned=s.units.find(u=>card(u.card).slug==='bone_jumble');assert.ok(returned);assert.equal(returned.owner,1);assert.equal(returned.controller,0);assert.equal(s.players[0].spent,3);assert.equal(s.players[1].cemetery.length,0);assert.equal(E.unit(s,skeleton.uid),undefined);assert.equal(s.zoneAccessScope,undefined);
});
test('dispatch Bureau: a grave cast is unavailable when only the spell cost, but not the separate fee, is affordable',()=>{
 let s=game();site(s,'bureau_of_occult_control',13);grave(s,0,'ghostfire');s=E.restoreGame(s);s.players[0].spent=E.resources(s,0).mana-2;const before=s.players[0].spent;assert.equal(E.resources(s,0).available,2);assert.equal(E.legalActions(s,0).some(a=>a.type==='cast'&&a.grave!==undefined),false);assert.equal(s.players[0].spent,before);assert.equal(s.players[0].cemetery.length,1);
});
test('dispatch: the three cemetery sites are playable cards and their effects apply immediately when actually played',()=>{
 for(const name of ['bureau_of_occult_control','mismanaged_mortuary','wormelow_tump']){
  assert.equal(card(name).playable,true,name);let s=game();grave(s,0,'ghostfire');grave(s,1,'recurring_specter');s.board[11]=null;s.players[0].hand=[{uid:'actual-site',card:card(name).id}];s=E.restoreGame(s);const action=E.legalActions(s,0).find(a=>a.type==='site'&&a.hand==='actual-site'&&a.at===11);assert.ok(action,name);s=E.dispatch(s,action);assert.equal(card(s.board[11].card).slug,name);assert.equal(s.players[0].hand.length,0);
  if(name==='bureau_of_occult_control'){assert.equal(Z.zoneAccessCost(s,{card}),2);const cast=E.legalActions(s,0).find(a=>a.type==='cast'&&a.grave!==undefined);assert.ok(cast);s=E.dispatch(s,cast);s=choose(s,v=>v!==null);s=settle(s);assert.equal(s.players[0].spent,3);}
  if(name==='mismanaged_mortuary'){assert.ok(E.regionNames(s,{at:11,layer:'below'}).has('underwater'));assert.ok(E.legalActions(s,0).some(a=>a.type==='cast'&&a.graveOwner===1));assert.equal(E.legalActions(s,0).some(a=>a.type==='cast'&&a.graveOwner===0),false);}
  if(name==='wormelow_tump'){const options=E.effectOptions(s,{source:E.avatar(s,1),controller:1},{kind:'grave'});assert.equal(options.some(o=>o.value.player===0),false);assert.ok(options.some(o=>o.value.player===1));}
 }
});
test('dispatch Bureau/random: paid access ticket survives a Kythera random-result choice and saved-game resume',()=>{
 let s=game();site(s,'bureau_of_occult_control',13);grave(s,0,'wild_boars');grave(s,0,'brown_bears');const av=E.avatar(s,0);s.artifacts.push({uid:'kythera',stamp:1,card:card('kythera_mechanism').id,owner:0,controller:0,bearer:av.uid,at:av.at,layer:'surface'});s=E.restoreGame(s);s=handCast(s,'raise_dead');assert.equal(s.choice.frame.step.op,'zoneAccessOffer');s=choose(s,v=>v===true);s=choose(s,v=>v?.at===12);assert.equal(s.choice.frame.step.op,'luckyResume');const ticket=s.choice.frame.step.original.zoneAccessScope;assert.ok(ticket);assert.equal(s.choice.frame.zoneAccessScope?.id,ticket.id);s=E.restoreGame(JSON.parse(JSON.stringify(s)));s=choose(s,()=>true);s=settle(s);assert.equal(s.players[0].spent,card('raise_dead').cost+2);assert.equal(s.units.filter(u=>['wild_boars','brown_bears'].includes(card(u.card).slug)).length,1);assert.equal(s.zoneAccessScope,undefined);
});
