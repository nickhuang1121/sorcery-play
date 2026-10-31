import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {install,card,starter} from '../src/cards.js';
import {newGame,dispatch,legalActions,unit,restoreGame,resources} from '../src/engine.js';
import {hasSiteRarity,riftPlans} from '../src/final-built-sites.js';
import {passives} from '../src/definitions.js';

install(JSON.parse(fs.readFileSync(new URL('../data/official-cards.json',import.meta.url))));
function game(){const s=newGame([starter(),starter()],42,'local');s.turn=5;s.active=0;s.phase='main';s.artifacts=[];s.auras=[];s.storyline=[];s.choice=null;s.units.forEach(u=>{u.born=0;u.tapped=false;});s.board=Array.from({length:20},(_,at)=>({uid:'fixture'+at,card:card('valley').id,owner:at<10?1:0,controller:at<10?1:0}));for(const pl of s.players){pl.hand=[];pl.bonusMana=30;pl.bonusAffinity={air:10,earth:10,fire:10,water:10};pl.turnsTaken=3;pl.finalHasPlayedSite=true;}return s;}
function add(s,slug,at=12,p=0,extra={}){const u={uid:'u'+s.next++,card:card(slug).id,at,owner:p,controller:p,born:0,damage:0,mods:[],tapped:false,...extra};s.units.push(u);return u;}
function put(s,slug,at=12,p=0){s.board[at]={uid:'site'+s.next++,card:card(slug).id,owner:p,controller:p};return {...s.board[at],at,layer:'surface'};}
function effect(s,source,step,value){s.choice={player:source.controller,title:step.op,options:[{label:'Run',value}],frame:{source:structuredClone(source),controller:source.controller,effectCard:source.card,step}};return dispatch(s,{type:'choose',player:source.controller,option:0});}
function choose(s,fn){const index=s.choice.options.findIndex(o=>fn(o.value));assert.ok(index>=0,JSON.stringify(s.choice.options));return dispatch(s,{type:'choose',player:s.choice.player,option:index});}
function settle(s){let count=0;while(s.choice||s.pending){assert.ok(count++<150);s=s.choice?choose(s,()=>true):dispatch(s,{type:'pass',player:s.pending.player});}return s;}
function playSite(s,slug,at=12,clear=true){if(clear)s.board[at]=null;const h={uid:'h'+s.next++,card:card(slug).id};s.players[0].hand.push(h);const a=legalActions(s).find(a=>a.type==='site'&&a.hand===h.uid&&a.at===at);assert.ok(a,'No legal site play '+slug+' at '+at);return dispatch(s,a);}
function build(s){put(s,'the_base_of_babel',12);s.players[0].spells=[card('wild_boars').id,...s.players[0].spells];return playSite(s,'the_apex_of_babel',12,false);}
function effectDestroy(s,at,controller=1){return effect(s,s.units.find(u=>u.controller===controller&&card(u.card).type==='Avatar'),{op:'collapseSite'},{at,card:s.board[at].card});}

test('built sites Babel: merging Base and Apex creates one Site with two mana and both thresholds/rarities',()=>{
 let s=game();put(s,'the_base_of_babel',12);const before=resources(s,0);s=playSite(s,'the_apex_of_babel',12,false);const c=card(s.board[12].card),after=resources(s,0);assert.equal(c.name,'The Tower of Babel');assert.equal(s.board.filter(Boolean).length,20);assert.equal(after.mana,before.mana+1);assert.equal(after.earth,before.earth);assert.equal(after.air,before.air+1);assert.ok(hasSiteRarity(c,'Unique'));assert.ok(hasSiteRarity(c,'Exceptional'));assert.equal(s.board[12].babelParts.length,2);
 s=choose(s,v=>v===null);assert.equal(s.choice,null);
});
test('built sites Babel: build draws a spell then casts one for zero mana, with ordinary targeting and threshold',()=>{
 let s=game();s.players[0].spent=resources(s,0).mana;s=build(s);assert.ok(s.players[0].hand.some(h=>h.card===card('wild_boars').id));const spent=s.players[0].spent;s=choose(s,v=>v?.type==='cast'&&s.players[0].hand.find(h=>h.uid===v.hand)?.card===card('wild_boars').id&&v.at===12);s=settle(s);assert.equal(s.players[0].spent,spent);assert.ok(s.units.some(u=>u.card===card('wild_boars').id));assert.equal(s.finalFreeCast,undefined);
 let t=game();for(const p of t.players)p.bonusAffinity={};put(t,'the_base_of_babel');t.players[0].spells=[card('ancient_dragon').id];t=playSite(t,'the_apex_of_babel',12,false);assert.ok(!t.choice.options.some(o=>o.value&&t.players[0].hand.find(h=>h.uid===o.value.hand)?.card===card('ancient_dragon').id));
});
test('built sites Babel: standalone Apex does not trigger build bonus and enemy or silenced Base cannot be built on',()=>{
 let s=game();const cards=s.players[0].spells.length;s=playSite(s,'the_apex_of_babel');assert.equal(s.choice,null);assert.equal(s.players[0].spells.length,cards);
 const t=game();put(t,'the_base_of_babel',12,1);const h={uid:'apex',card:card('the_apex_of_babel').id};t.players[0].hand.push(h);assert.ok(!legalActions(t).some(a=>a.type==='site'&&a.hand===h.uid&&a.at===12));t.board[12].controller=0;t.board[12].silenced=true;assert.ok(!legalActions(t).some(a=>a.type==='site'&&a.hand===h.uid&&a.at===12));
});
test('built sites Babel: destruction and banishing send both physical cards, and saved merged Site restores identically',()=>{
 let s=build(game());s=choose(s,v=>v===null);s=restoreGame(JSON.parse(JSON.stringify(s)));assert.equal(card(s.board[12].card).name,'The Tower of Babel');s=effectDestroy(s,12);assert.equal(card(s.board[12].card).slug,'rubble');assert.ok(s.players[0].cemetery.includes(card('the_base_of_babel').id));assert.ok(s.players[0].cemetery.includes(card('the_apex_of_babel').id));assert.ok(!s.players[0].cemetery.some(id=>id.startsWith('runtime:')));
 let t=build(game());t=choose(t,v=>v===null);t=effect(t,t.units[1],{op:'banishSite'},{at:12});assert.equal(t.board[12],null);assert.ok(t.players[0].banished.includes(card('the_base_of_babel').id));assert.ok(t.players[0].banished.includes(card('the_apex_of_babel').id));
});
test('built sites Babel: Mirror Realm copies the merged characteristics without drawing or rebuilding, and leaves as one card',()=>{
 let s=build(game());s=choose(s,v=>v===null);s.units[0].tapped=false;const before=s.players[0].spells.length;s=playSite(s,'mirror_realm',13);s=choose(s,v=>card(v).name==='The Tower of Babel');assert.equal(card(s.board[13].card).name,'The Tower of Babel');assert.equal(s.players[0].spells.length,before);assert.equal(s.choice,null);assert.equal(s.board[13].babelParts,undefined);s=effectDestroy(s,13);assert.ok(s.players[0].cemetery.includes(card('mirror_realm').id));assert.equal(s.players[0].cemetery.includes(card('the_apex_of_babel').id),false);
});
test('built sites Babel: Exceptional-only destruction sees both rarities and Mirage returns both physical cards',()=>{
 let s=build(game());s=choose(s,v=>v===null);s=effect(s,s.units[1],{op:'destroyRanks',ranks:['Exceptional']},undefined);assert.equal(card(s.board[12].card).slug,'rubble');assert.ok(s.players[0].cemetery.includes(card('the_apex_of_babel').id));
 let t=build(game());t=choose(t,v=>v===null);t.units[0].tapped=false;t=playSite(t,'mirage',12,false);assert.equal(card(t.board[12].card).slug,'mirage');assert.ok(t.players[0].hand.some(h=>h.card===card('the_base_of_babel').id));assert.ok(t.players[0].hand.some(h=>h.card===card('the_apex_of_babel').id));
});

test('built sites Rift: split shifts a contiguous run simultaneously, carries normal units/equipment, leaves oversized units and auras',()=>{
 let s=game();s.board[14]=null;const normal=add(s,'brown_bears',12),large=add(s,'mountain_giant',12,0,{size:2});s.artifacts.push({uid:'item',card:card('sword_and_shield').id,owner:0,bearer:normal.uid,at:12});s.auras.push({uid:'area',card:card('abundance').id,owner:0,controller:0,at:12});s=playSite(s,'rift_valley',12,false);assert.ok(s.choice);const beforeHand=s.players[0].hand.length;assert.equal(s.units[0].tapped,false);s=choose(s,v=>v&&v.step===1&&v.moves.length===2);assert.equal(card(s.board[12].card).slug,'rift_valley');assert.equal(unit(s,normal.uid).at,13);assert.equal(unit(s,large.uid).at,12);assert.equal(s.artifacts.find(a=>a.uid==='item').at,13);assert.equal(s.auras.find(a=>a.uid==='area').at,12);assert.equal(s.players[0].hand.length,beforeHand-1);assert.equal(s.board[14].uid,'fixture13');
});
test('built sites Rift: alternate play may be nonadjacent but needs at least two contiguous sites and an in-line void',()=>{
 let s=game();s.board=Array(20).fill(null);put(s,'valley',17);put(s,'valley',2,1);put(s,'valley',0,1);put(s,'valley',1,1);s=playSite(s,'rift_valley',1,false);s=choose(s,v=>v&&v.step===1);assert.equal(card(s.board[1].card).slug,'rift_valley');assert.equal(s.board[2].uid.startsWith('site'),true);
 const t=game();t.board=Array(20).fill(null);put(t,'valley',12);assert.equal(riftPlans(t,{passives,card}).length,0);
});
test('built sites Rift: cancellation and saved declaration do not consume hand or tap Avatar; Bedrock blocks shift',()=>{
 let s=game();s.board[14]=null;s=playSite(s,'rift_valley',12,false);s=restoreGame(JSON.parse(JSON.stringify(s)));const hand=s.players[0].hand.map(h=>h.uid),board=s.board.map(v=>v?.uid);s=choose(s,v=>v===null);assert.deepEqual(s.players[0].hand.map(h=>h.uid),hand);assert.deepEqual(s.board.map(v=>v?.uid),board);assert.equal(s.units[0].tapped,false);
 const t=game();t.board[14]=null;put(t,'bedrock',13);assert.ok(!riftPlans(t,{passives,card}).some(p=>p.at===12&&p.step===1));
 const z=game();z.board[14]=null;put(z,'edge_of_the_world',13);assert.ok(!riftPlans(z,{passives,card}).some(p=>p.at===12&&p.step===1),'Filling the last void must not invalidate an existing Edge');
});
test('built sites Rift: Pathfinder pulls apart an adjacent occupied square using the actual Atlas top and then moves there',()=>{
 let s=game();s.units[0].card=card('pathfinder').id;s.board[14]=null;s.players[0].atlas=[card('rift_valley').id];const action=legalActions(s).find(a=>a.type==='activate'&&a.unit===s.units[0].uid&&a.index===0);assert.ok(action);s=dispatch(s,action);s=choose(s,v=>v?.at===12);assert.equal(s.players[0].atlas.length,1);s=restoreGame(JSON.parse(JSON.stringify(s)));s=choose(s,v=>v&&v.step===1&&v.moves.length===2);s=settle(s);assert.equal(s.players[0].atlas.length,0);assert.equal(card(s.board[12].card).slug,'rift_valley');assert.equal(s.units[0].at,12);
});
test('built sites Rift: Mirror can copy a Rift and enter by splitting while retaining its physical Mirror identity',()=>{
 let s=game();put(s,'rift_valley',11);s.board[14]=null;s=playSite(s,'mirror_realm',12,false);assert.ok(s.choice);assert.ok(s.choice.options.filter(o=>o.value!==null).every(o=>card(o.value).slug==='rift_valley'));s=choose(s,v=>v&&card(v).slug==='rift_valley');s=choose(s,v=>v&&v.step===1);assert.equal(card(s.board[12].card).slug,'rift_valley');assert.equal(s.board[12].originalCard,card('mirror_realm').id);s=effectDestroy(s,12);assert.ok(s.players[0].cemetery.includes(card('mirror_realm').id));assert.equal(s.players[0].cemetery.includes(card('rift_valley').id),false);
});

function activateCity(s,at=12){const a=legalActions(s).find(a=>a.type==='activateSite'&&a.at===at);assert.ok(a,'No Free City attack');return dispatch(s,a);}
test('built sites City: power-three attack uses normal defenders and damages Site owner without killing Site',()=>{
 let s=game();put(s,'free_city',12);const target=add(s,'brown_bears',12,1);add(s,'grain_sparrow',11,1);s=activateCity(s);s=choose(s,v=>v?.target===target.uid);assert.ok(s.pending);s=settle(s);assert.equal(unit(s,target.uid).damage,3);assert.equal(s.players[0].life,16);assert.equal(card(s.board[12].card).slug,'free_city');assert.ok(!legalActions(s).some(a=>a.type==='activateSite'&&a.at===12));
});
test('built sites City: may attack on entry and underground, but cannot target Airborne, Stealth or different squares',()=>{
 let s=game();const below=add(s,'bone_rabble',12,1,{layer:'below',mods:[{keyword:'Burrowing'}]}),air=add(s,'cherubim',12,1),hidden=add(s,'wild_boars',12,1,{stealth:true}),far=add(s,'wild_boars',13,1);s=playSite(s,'free_city',12);s=activateCity(s);assert.ok(s.choice.options.some(o=>o.value?.target===below.uid));for(const u of [air,hidden,far])assert.ok(!s.choice.options.some(o=>o.value?.target===u.uid));s=choose(s,v=>v?.target===below.uid);s=settle(s);assert.equal(unit(s,below.uid),undefined);assert.equal(card(s.board[12].card).slug,'free_city');
});
test('built sites City: can defend itself or another unit at its own square once, and saved attack window restores',()=>{
 let s=game();put(s,'free_city',12);const attacker=add(s,'brown_bears',12,1);s.active=1;const a=legalActions(s).find(a=>a.type==='attack'&&a.unit===attacker.uid&&a.target==='site:12');assert.ok(a);s=dispatch(s,a);s=restoreGame(JSON.parse(JSON.stringify(s)));const defend=legalActions(s,0).find(a=>a.type==='cityDefend');assert.ok(defend);s=dispatch(s,defend);s=settle(s);assert.equal(unit(s,attacker.uid).damage,3);assert.equal(s.players[0].life,16);assert.equal(card(s.board[12].card).slug,'free_city');assert.equal(s.board[12].finalCityUsedTurn,s.turn);
});
test('built sites City: cannot defend when oversized attacker attacks another square, nor defend while silenced',()=>{
 let s=game();put(s,'free_city',12);const giant=add(s,'mountain_giant',12,1,{size:2});s.active=1;const a=legalActions(s).find(a=>a.type==='attack'&&a.unit===giant.uid&&a.target==='site:13');assert.ok(a);s=dispatch(s,a);assert.ok(!legalActions(s,0).some(a=>a.type==='cityDefend'));
 const t=game();put(t,'free_city',12);t.board[12].silenced=true;add(t,'brown_bears',12,1);assert.ok(!legalActions(t).some(a=>a.type==='activateSite'&&a.at===12));
});
test('built sites City: Site Ward prevents simultaneous combat damage without turning City into a Minion',()=>{
 let s=game();put(s,'free_city',12);s.board[12].ward=true;const target=add(s,'brown_bears',12,1);s=activateCity(s);s=choose(s,v=>v?.target===target.uid);s=settle(s);assert.equal(s.players[0].life,20);assert.equal(s.board[12].ward,false);assert.equal(s.units.some(u=>card(u.card).type==='Site'),false);
});

test('built sites Vindictive: opposing site modification triggers one life, own modification and damage do not',()=>{
 let s=game();put(s,'vindictive_nation',12);s=effect(s,s.units[1],{op:'floodSite'},{at:13});assert.equal(s.players[1].life,19);s=effect(s,s.units[0],{op:'floodSite'},{at:11});assert.equal(s.players[1].life,19);s=effect(s,s.units[1],{op:'siteDamage',amount:2},{at:13});assert.equal(s.players[1].life,19);
});
test('built sites Vindictive: destruction causes seven even when Nation itself is destroyed, but Ward prevents it',()=>{
 let s=game();put(s,'vindictive_nation',12);s=effectDestroy(s,13);assert.equal(s.players[1].life,13);s=effectDestroy(s,12);assert.equal(s.players[1].life,6);assert.equal(card(s.board[12].card).slug,'rubble');
 let t=game();put(t,'vindictive_nation',12);t.board[13].ward=true;t=effectDestroy(t,13);assert.equal(t.players[1].life,20);assert.equal(t.board[13].ward,false);assert.equal(card(t.board[13].card).slug,'valley');
});
test('built sites Vindictive: same effect flooding and silencing Nation triggers once despite losing its ability',()=>{
 let s=game();put(s,'vindictive_nation',12);for(const at of [13,17,18]){s.board[at].owner=1;s.board[at].controller=1;}s.active=1;const h={uid:'fate',card:card('atlantean_fate').id};s.players[1].hand.push(h);const a=legalActions(s,1).find(a=>a.type==='cast'&&a.hand===h.uid&&a.at===12);assert.ok(a);s=dispatch(s,a);s=settle(s);assert.equal(s.players[1].life,19);assert.equal(s.board[12].silenced,true);
});
test('built sites Vindictive: movement checks prior proximity, three per moved protected allied Site, not destination proximity',()=>{
 let s=game();put(s,'vindictive_nation',10);for(const at of [12,16,17])s.board[at].controller=1;const id=s.board[11].uid;s=effect(s,s.units[1],{op:'finalEarthquakeApply',cells:[11,12,16,17],mapping:{11:12,12:11,16:16,17:17}},undefined);assert.equal(s.board[12].uid,id);assert.equal(s.players[1].life,17);
 let t=game();put(t,'vindictive_nation',10);for(const at of [11,16,17])t.board[at].controller=1;t=effect(t,t.units[1],{op:'finalEarthquakeApply',cells:[11,12,16,17],mapping:{11:12,12:11,16:16,17:17}},undefined);assert.equal(t.players[1].life,20);
});
