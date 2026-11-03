import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {install,card,starter} from '../src/cards.js';
import {newGame,dispatch,legalActions,unit,restoreGame,resources,power,unitTypes} from '../src/engine.js';

install(JSON.parse(fs.readFileSync(new URL('../data/official-cards.json',import.meta.url))));
function game(){const s=newGame([starter(),starter()],42,'local');s.turn=5;s.active=0;s.phase='main';s.artifacts=[];s.auras=[];s.storyline=[];s.choice=null;s.units.forEach(u=>{u.born=0;u.tapped=false;});s.board=Array.from({length:20},(_,at)=>({uid:'site'+at,card:card('valley').id,owner:at<10?1:0,controller:at<10?1:0}));for(const pl of s.players){pl.hand=[];pl.bonusMana=30;pl.bonusAffinity={air:10,earth:10,fire:10,water:10};}return s;}
function add(s,slug,at=12,p=0,extra={}){const u={uid:'u'+s.next++,card:card(slug).id,at,owner:p,controller:p,born:0,damage:0,mods:[],tapped:false,...extra};s.units.push(u);return u;}
function put(s,slug,at=12,p=0){s.board[at]={uid:'site'+s.next++,card:card(slug).id,owner:p,controller:p};return {...s.board[at],at,layer:'surface'};}
function effect(s,source,step,value){s.choice={player:source.controller,title:step.op,options:[{label:'Run',value}],frame:{source:structuredClone(source),controller:source.controller,effectCard:source.card,step}};return dispatch(s,{type:'choose',player:source.controller,option:0});}
function choose(s,fn){const index=s.choice.options.findIndex(o=>fn(o.value));assert.ok(index>=0,JSON.stringify(s.choice.options));return dispatch(s,{type:'choose',player:s.choice.player,option:index});}
function settle(s){let count=0;while(s.choice){assert.ok(count++<100,'Bounded serializable path');s=choose(s,()=>true);}return s;}
function playSite(s,slug,at=12){s.board[at]=null;const h={uid:'h'+s.next++,card:card(slug).id};s.players[0].hand.push(h);const a=legalActions(s).find(a=>a.type==='site'&&a.hand===h.uid&&a.at===at);assert.ok(a,'No legal site play '+slug);return dispatch(s,a);}
function nextMain(s){if(s.phase==='draw')s=dispatch(s,legalActions(s).find(a=>a.type==='draw'&&a.deck==='spells'));return s;}

test('printed passive layers: each source retains distinct types/other/allies conditions on the real bearer',()=>{
 let s=game();const bearer=add(s,'brown_bears',12),beast=add(s,'brown_bears',13),undead=add(s,'ghoul',11);bearer.finalAbilitySources=[card('death_knight').id,card('wicked_witch').id];
 s=effect(s,s.units[0],{op:'drawOne',deck:'spells'},true);
 assert.equal(unit(s,beast.uid).ongoingPower,-2);assert.equal(unit(s,undead.uid).ongoingPower,-1);assert.equal(unit(s,bearer.uid).ongoingPower,0,'Both other-only source abilities exclude their own carrier');assert.equal(unit(s,bearer.uid).card,card('brown_bears').id);
});
test('printed passive layers: two physical Pallid sources stack, silence and detachment remove only their own contribution',()=>{
 let s=game();const bearer=add(s,'brown_bears',12),ally=add(s,'brown_bears',13);
 const a={uid:'bustA',card:card('the_pallid_bust').id,bearer:bearer.uid,at:12,owner:0,controller:0,pallidPrintedCard:card('house_arn_bannerman').id},b={...a,uid:'bustB'};s.artifacts.push(a,b);
 s=effect(s,s.units[0],{op:'drawOne',deck:'spells'},true);assert.equal(unit(s,ally.uid).ongoingPower,2);
 s.artifacts.find(o=>o.uid==='bustA').silenced=true;s=effect(s,s.units[0],{op:'drawOne',deck:'spells'},true);assert.equal(unit(s,ally.uid).ongoingPower,1);
 s.artifacts.find(o=>o.uid==='bustB').bearer=null;s=effect(s,s.units[0],{op:'drawOne',deck:'spells'},true);assert.equal(unit(s,ally.uid).ongoingPower,0);
});
test('Pallid prepared Genesis really banishes a dead minion and the live artifact supplies its passive layer, with save-safe identity',()=>{
 let s=game();const bearer=add(s,'brown_bears',12),ally=add(s,'brown_bears',13),a={uid:'realBust',card:card('the_pallid_bust').id,bearer:bearer.uid,at:12,owner:0,controller:0};s.artifacts.push(a);s.players[1].cemetery.push(card('house_arn_bannerman').id);
 s=effect(s,a,{op:'finalPallidBust'},undefined);s=choose(s,v=>v?.card===card('house_arn_bannerman').id);assert.equal(s.players[1].cemetery.length,0);assert.ok(s.players[1].banished.includes(card('house_arn_bannerman').id));assert.equal(s.artifacts.find(o=>o.uid==='realBust').pallidPrintedCard,card('house_arn_bannerman').id);assert.equal(unit(s,ally.uid).ongoingPower,1);
 s=restoreGame(JSON.parse(JSON.stringify(s)));s=effect(s,s.units[0],{op:'drawOne',deck:'spells'},true);assert.equal(unit(s,ally.uid).ongoingPower,1);
});
test('Pallid prepared Genesis remains a real cemetery access effect with independent Bureau permission',async()=>{
 const {queueEffects}=await import('../src/storyline.js');let s=game();const bearer=add(s,'brown_bears',12),a={uid:'taxBust',card:card('the_pallid_bust').id,bearer:bearer.uid,at:12,owner:0,controller:0};s.artifacts.push(a);put(s,'bureau_of_occult_control',5,1);s.players[1].cemetery.push(card('house_arn_bannerman').id);const before=s.players[0].spent||0;
 queueEffects(s,[{op:'finalPallidBust'}],a,0);s=effect(s,s.units[0],{op:'drawOne',deck:'spells'},true);assert.equal(s.choice.frame.step.op,'zoneAccessOffer');s=choose(s,v=>v===true);assert.equal(s.choice.frame.step.op,'finalPallidBust');s=restoreGame(JSON.parse(JSON.stringify(s)));s=choose(s,v=>v?.card===card('house_arn_bannerman').id);assert.equal(s.players[0].spent,before+2);assert.equal(s.players[1].cemetery.length,0);assert.equal(s.artifacts.find(o=>o.uid==='taxBust').pallidPrintedCard,card('house_arn_bannerman').id);
});
test('Pallid layers: bearer silence retains externally granted abilities, while Acid Rain silences the granting artifact before the grant',()=>{
 let s=game();const bearer=add(s,'brown_bears',12),ally=add(s,'brown_bears',13);s.artifacts.push({uid:'externalBust',card:card('the_pallid_bust').id,bearer:bearer.uid,at:12,owner:0,controller:0,pallidPrintedCard:card('house_arn_bannerman').id});bearer.mods.push({silenced:true});
 s=effect(s,s.units[0],{op:'drawOne',deck:'spells'},true);assert.equal(unit(s,bearer.uid).silenced,true);assert.equal(unit(s,ally.uid).ongoingPower,1);assert.ok(unitTypes(unit(s,bearer.uid),s).includes('Mortal'));
 s.auras.push({uid:'acid',card:card('acid_rain').id,controller:1,owner:1,at:12});s=effect(s,s.units[0],{op:'drawOne',deck:'spells'},true);assert.equal(s.artifacts.find(a=>a.uid==='externalBust').silenced,true);assert.equal(unit(s,ally.uid).ongoingPower,0);assert.equal(unitTypes(unit(s,bearer.uid),s).includes('Mortal'),false);
});
test('Pallid layers: granting a printed Mortal type precedes Bower transformation without reintroducing Mortal afterwards',()=>{
 let s=game();const bearer=add(s,'brown_bears',12),ally=add(s,'brown_bears',13);s.artifacts.push({uid:'mortalBust',card:card('the_pallid_bust').id,bearer:bearer.uid,at:12,owner:0,controller:0,pallidPrintedCard:card('house_arn_bannerman').id});put(s,'bower_of_bliss',4,1);
 s=effect(s,s.units[0],{op:'drawOne',deck:'spells'},true);assert.equal(unit(s,bearer.uid).completionBower,true);assert.equal(unitTypes(unit(s,bearer.uid),s).includes('Mortal'),false);assert.ok(unitTypes(unit(s,bearer.uid),s).includes('Beast'));assert.equal(unit(s,ally.uid).ongoingPower,1,'The un-silenced Bust remains an external source even when bearer is silenced by Bower');
});
test('Pallid remover layers: gained Sisters silence survives bearer silence and ends when Acid Rain silences the artifact',()=>{
 let s=game();const bearer=add(s,'brown_bears',12),neighbor=add(s,'house_arn_bannerman',13);bearer.mods.push({silenced:true});s.artifacts.push({uid:'sistersBust',stamp:100,card:card('the_pallid_bust').id,bearer:bearer.uid,at:12,owner:0,controller:0,pallidPrintedCard:card('sisters_of_silence').id});
 s=effect(s,s.units[0],{op:'drawOne',deck:'spells'},true);assert.equal(unit(s,bearer.uid).silenced,true);assert.equal(unit(s,neighbor.uid).silenced,true);
 s.auras.push({uid:'acidRemover',card:card('acid_rain').id,controller:1,owner:1,at:12});s=effect(s,s.units[0],{op:'drawOne',deck:'spells'},true);assert.equal(s.artifacts.find(a=>a.uid==='sistersBust').silenced,true);assert.equal(unit(s,neighbor.uid).silenced,false);
});
test('Pallid live activation: duplicate once-per-turn abilities retain independent physical source identity under bearer silence',()=>{
 let s=game();const bearer=add(s,'brown_bears',12);bearer.mods.push({silenced:true});for(const uid of ['spearOne','spearTwo'])s.artifacts.push({uid,card:card('the_pallid_bust').id,bearer:bearer.uid,at:12,owner:0,controller:0,pallidPrintedCard:card('spearmarshal').id});
 s=effect(s,s.units[0],{op:'drawOne',deck:'spells'},true);let actions=legalActions(s).filter(a=>a.type==='activate'&&a.unit===bearer.uid);assert.equal(actions.length,2);assert.notEqual(actions[0].abilityInstance,actions[1].abilityInstance);
 s=dispatch(s,actions[0]);assert.equal(s.artifacts.filter(a=>card(a.card).slug==='lance'&&a.bearer===bearer.uid).length,1);actions=legalActions(s).filter(a=>a.type==='activate'&&a.unit===bearer.uid);assert.equal(actions.length,1);s=dispatch(s,actions[0]);assert.equal(s.artifacts.filter(a=>card(a.card).slug==='lance'&&a.bearer===bearer.uid).length,2);assert.equal(legalActions(s).some(a=>a.type==='activate'&&a.unit===bearer.uid),false);
});
test('Pallid live activation: a removed source cannot be replaced by another ability at the same numeric index before costs',()=>{
 let s=game();const bearer=add(s,'brown_bears',12);for(const uid of ['armyOne','armyTwo'])s.artifacts.push({uid,card:card('the_pallid_bust').id,bearer:bearer.uid,at:12,owner:0,controller:0,pallidPrintedCard:card('midland_army').id});s=effect(s,s.units[0],{op:'drawOne',deck:'spells'},true);
 const action=legalActions(s).find(a=>a.type==='activate'&&a.unit===bearer.uid);assert.ok(action?.abilityInstance.includes('armyOne'));s=dispatch(s,action);assert.ok(s.choice);s.artifacts=s.artifacts.filter(a=>a.uid!=='armyOne');s=restoreGame(JSON.parse(JSON.stringify(s)));const spent=s.players[0].spent||0;
 assert.throws(()=>choose(s,v=>v?.at===13),/失效/);assert.equal(s.players[0].spent||0,spent);assert.equal(unit(s,bearer.uid).tapped,false);
});
test('Pallid live triggers: duplicate gained Deathrites each resolve after a silenced bearer dies and artifacts drop',()=>{
 let s=game();const bearer=add(s,'brown_bears',12);bearer.mods.push({silenced:true});s.players[0].life=10;for(const uid of ['pigsOne','pigsTwo'])s.artifacts.push({uid,card:card('the_pallid_bust').id,bearer:bearer.uid,at:12,owner:0,controller:0,pallidPrintedCard:card('muddy_pigs').id});const enemy=s.units.find(u=>u.controller===1&&card(u.card).type==='Avatar');
 s=effect(s,enemy,{op:'destroy',select:{kind:'unit'}},{entity:'unit',uid:bearer.uid});assert.equal(unit(s,bearer.uid),undefined);assert.equal(s.players[0].life,16);assert.ok(s.artifacts.filter(a=>a.uid.startsWith('pigs')).every(a=>!a.bearer));
});
test('Pallid live triggers: gained end and next own start hooks retain their own source and timing under silence',()=>{
 let s=game();const bearer=add(s,'brown_bears',12);bearer.mods.push({silenced:true});for(const [uid,slug] of [['foxBust','sly_fox'],['ifritBust','mazuj_ifrit']])s.artifacts.push({uid,card:card('the_pallid_bust').id,bearer:bearer.uid,at:12,owner:0,controller:0,pallidPrintedCard:card(slug).id});s=effect(s,s.units[0],{op:'drawOne',deck:'spells'},true);
 s=settle(dispatch(s,{type:'end',player:0}));assert.equal(unit(s,bearer.uid).stealth,true);if(s.phase==='draw')s=dispatch(s,legalActions(s).find(a=>a.type==='draw'&&a.deck==='spells'));assert.equal(s.players[0].life,20);
 s=settle(dispatch(s,{type:'end',player:1}));assert.equal(s.players[0].life,18);
});
test('Pallid resources: printed mana and Fire provision are gained abilities and remain while bearer is silenced',()=>{
 let s=game();const bearer=add(s,'brown_bears',12);bearer.mods.push({silenced:true});const before=resources(s,0);for(const [uid,slug] of [['manaBust','alvalinne_dryads'],['fireBust','blacksmith_family']])s.artifacts.push({uid,card:card('the_pallid_bust').id,bearer:bearer.uid,at:12,owner:0,controller:0,pallidPrintedCard:card(slug).id});s=effect(s,s.units[0],{op:'drawOne',deck:'spells'},true);assert.equal(resources(s,0).mana,before.mana+1);assert.equal(resources(s,0).fire,before.fire+1);
});
test('Pallid own continuous layers: two Warded power abilities stack and retain the actual bearer power',()=>{
 let s=game();const bearer=add(s,'brown_bears',12);bearer.ward=true;for(const uid of ['angelOne','angelTwo'])s.artifacts.push({uid,card:card('the_pallid_bust').id,bearer:bearer.uid,at:12,owner:0,controller:0,pallidPrintedCard:card('angel_ascendant').id});s=effect(s,s.units[0],{op:'drawOne',deck:'spells'},true);assert.equal(unit(s,bearer.uid).ongoingPower,2);assert.equal(power(unit(s,bearer.uid)),card('brown_bears').attack+2);assert.ok(unit(s,bearer.uid).grantedKeywords.includes('Airborne'));
});
test('Pallid own continuous layers: independent zero-unless restrictions combine without a later satisfied condition erasing a failure',()=>{
 let s=game();const bearer=add(s,'brown_bears',12);add(s,'ghoul',13);for(const [uid,slug] of [['wardCondition','revered_revenant'],['evilCondition','profane_revenant']])s.artifacts.push({uid,card:card('the_pallid_bust').id,bearer:bearer.uid,at:12,owner:0,controller:0,pallidPrintedCard:card(slug).id});s=effect(s,s.units[0],{op:'drawOne',deck:'spells'},true);assert.equal(unit(s,bearer.uid).zeroPower,true);assert.equal(power(unit(s,bearer.uid)),0);
});
test('Pallid own movement restrictions: sideways and forward permissions intersect, and removing one restores only the remaining direction',()=>{
 let s=game();const bearer=add(s,'brown_bears',12);for(const [uid,slug] of [['sideways','sedge_crabs'],['forward','dalcean_phalanx']])s.artifacts.push({uid,card:card('the_pallid_bust').id,bearer:bearer.uid,at:12,owner:0,controller:0,pallidPrintedCard:card(slug).id});s=effect(s,s.units[0],{op:'drawOne',deck:'spells'},true);assert.equal(unit(s,bearer.uid).moveAxis,'none');assert.equal(legalActions(s).some(a=>a.type==='move'&&a.unit===bearer.uid&&a.at!==12),false);s.artifacts=s.artifacts.filter(a=>a.uid!=='sideways');s=effect(s,s.units[0],{op:'drawOne',deck:'spells'},true);assert.equal(unit(s,bearer.uid).moveAxis,'forward');assert.ok(legalActions(s).some(a=>a.type==='move'&&a.unit===bearer.uid&&a.at===7));assert.equal(legalActions(s).some(a=>a.type==='move'&&a.unit===bearer.uid&&a.at===13),false);
});
test('Pallid gained ranged ability: a silenced bearer shoots the copied Ranged 2 distance with its own power',()=>{
 let s=game();const bearer=add(s,'brown_bears',12),target=add(s,'brown_bears',2,1,{mods:[{power:2}],stealth:true});bearer.mods.push({silenced:true});s.artifacts.push({uid:'borsBust',card:card('the_pallid_bust').id,bearer:bearer.uid,at:12,owner:0,controller:0,pallidPrintedCard:card('sir_bors_the_younger').id});s=effect(s,s.units[0],{op:'drawOne',deck:'spells'},true);assert.equal(unit(s,bearer.uid).grantedRange,2);assert.equal(unit(s,target.uid).stealth,false);
 const action=legalActions(s).find(a=>a.type==='ranged'&&a.unit===bearer.uid&&a.direction===0);assert.ok(action);s=dispatch(s,action);if(s.choice)s=choose(s,v=>v?.uid===target.uid||v===target.uid);s=settle(s);assert.equal(unit(s,target.uid).damage,card('brown_bears').attack);
});
test('Pallid cemetery power: each copied ability counts the current logical cemetery view without opening paid or protected access',()=>{
 let s=game();const bearer=add(s,'brown_bears',12);bearer.mods.push({silenced:true});for(const uid of ['wolpOne','wolpTwo'])s.artifacts.push({uid,card:card('the_pallid_bust').id,bearer:bearer.uid,at:12,owner:0,controller:0,pallidPrintedCard:card('wolpertinger').id});s.players[0].cemetery.push(card('brown_bears').id,card('wild_boars').id);s.players[1].cemetery.push(card('brown_bears').id);put(s,'bureau_of_occult_control',3,1);put(s,'wormelow_tump',4,0);const spent=s.players[0].spent||0;s=effect(s,s.units[0],{op:'drawOne',deck:'spells'},true);assert.equal(unit(s,bearer.uid).ongoingPower,4);assert.equal(s.choice,null);assert.equal(s.players[0].spent||0,spent);
 put(s,'mismanaged_mortuary',5,1);s=effect(s,s.units[0],{op:'drawOne',deck:'spells'},true);assert.equal(unit(s,bearer.uid).ongoingPower,2);assert.equal(s.players[0].spent||0,spent);
});
test('Pallid control layers: duplicate gained Kings control Mortals and add power independently, removal restores their native controller',()=>{
 let s=game();const bearer=add(s,'brown_bears',12),mortal=add(s,'apprentice_wizard',4,1),monks=add(s,'monks_of_kobalsa',5,1);bearer.mods.push({silenced:true});for(const [uid,stamp] of [['kingOne',10],['kingTwo',20]])s.artifacts.push({uid,stamp,card:card('the_pallid_bust').id,bearer:bearer.uid,at:12,owner:0,controller:0,pallidPrintedCard:card('king_of_the_realm').id});s=effect(s,s.units[0],{op:'drawOne',deck:'spells'},true);assert.equal(unit(s,mortal.uid).controller,0);assert.equal(unit(s,mortal.uid).owner,1);assert.equal(unit(s,mortal.uid).ongoingPower,2);assert.equal(unit(s,monks.uid).controller,1);
 s.artifacts=s.artifacts.filter(a=>a.uid!=='kingOne');s=effect(s,s.units[0],{op:'drawOne',deck:'spells'},true);assert.equal(unit(s,mortal.uid).controller,0);assert.equal(unit(s,mortal.uid).ongoingPower,1);s.artifacts=s.artifacts.filter(a=>a.uid!=='kingTwo');s=effect(s,s.units[0],{op:'drawOne',deck:'spells'},true);assert.equal(unit(s,mortal.uid).controller,1);assert.equal(unit(s,mortal.uid).ongoingPower,0);
});
test('Pallid control layers: gained Piper applies after power and remains active under bearer silence',()=>{
 let s=game();const bearer=add(s,'brown_bears',12),weak=add(s,'foot_soldier',4,1),strong=add(s,'brown_bears',5,1);bearer.mods.push({silenced:true});s.artifacts.push({uid:'piperBust',stamp:20,card:card('the_pallid_bust').id,bearer:bearer.uid,at:12,owner:0,controller:0,pallidPrintedCard:card('pied_piper_of_hameln').id});s=effect(s,s.units[0],{op:'drawOne',deck:'spells'},true);assert.equal(unit(s,weak.uid).controller,0);assert.equal(unit(s,strong.uid).controller,1);assert.equal(power(unit(s,bearer.uid)),card('brown_bears').attack);
 s.artifacts=[];s=effect(s,s.units[0],{op:'drawOne',deck:'spells'},true);assert.equal(unit(s,weak.uid).controller,1);
});
test('Pallid live resource passives: duplicate printed threshold stacks and a gained Granary Rats ability suppresses its occupied Site threshold',()=>{
 let s=game();const bearer=add(s,'brown_bears',12);bearer.mods.push({silenced:true});const before=resources(s,0);for(const uid of ['servantsOne','servantsTwo'])s.artifacts.push({uid,card:card('the_pallid_bust').id,bearer:bearer.uid,at:12,owner:0,controller:0,pallidPrintedCard:card('castle_servants').id});s=effect(s,s.units[0],{op:'drawOne',deck:'spells'},true);assert.equal(resources(s,0).air,before.air+2);
 s.artifacts.push({uid:'ratsBust',card:card('the_pallid_bust').id,bearer:bearer.uid,at:12,owner:0,controller:0,pallidPrintedCard:card('granary_rats').id});s=effect(s,s.units[0],{op:'drawOne',deck:'spells'},true);assert.equal(resources(s,0).earth,before.earth-card('valley').earth);assert.equal(resources(s,0).air,before.air+2);
});
test('Pallid live resource passives: each Finwife source contributes only while the enemy Avatar is nearby in the same region',()=>{
 let s=game();const bearer=add(s,'brown_bears',12);bearer.mods.push({silenced:true});for(const uid of ['finwifeOne','finwifeTwo'])s.artifacts.push({uid,card:card('the_pallid_bust').id,bearer:bearer.uid,at:12,owner:0,controller:0,pallidPrintedCard:card('finwife').id});const before=resources(s,0).mana;s=effect(s,s.units[0],{op:'drawOne',deck:'spells'},true);assert.equal(resources(s,0).mana,before);s.units.find(u=>u.controller===1&&card(u.card).type==='Avatar').at=7;s=effect(s,s.units[0],{op:'drawOne',deck:'spells'},true);assert.equal(resources(s,0).mana,before+4);
});
test('Pallid control layers: duplicate Returned King instances control and strengthen actual Undead tokens without changing bearer characteristics',()=>{
 let s=game();const bearer=add(s,'brown_bears',12),skeleton=add(s,'skeleton',4,1);for(const uid of ['returnedOne','returnedTwo'])s.artifacts.push({uid,card:card('the_pallid_bust').id,bearer:bearer.uid,at:12,owner:0,controller:0,pallidPrintedCard:card('returned_king').id});s=effect(s,s.units[0],{op:'drawOne',deck:'spells'},true);assert.equal(unit(s,skeleton.uid).controller,0);assert.equal(unit(s,skeleton.uid).ongoingPower,2);assert.equal(unit(s,bearer.uid).card,card('brown_bears').id);assert.ok(unitTypes(unit(s,bearer.uid),s).includes('Undead'));
});
test('Pallid tower layers: each Spire Lich source adds its own conditional power and grants real casting permission while at a Tower',()=>{
 let s=game();const bearer=add(s,'brown_bears',12),enemy=add(s,'brown_bears',13,1);for(const uid of ['spireOne','spireTwo'])s.artifacts.push({uid,card:card('the_pallid_bust').id,bearer:bearer.uid,at:12,owner:0,controller:0,pallidPrintedCard:card('spire_lich').id});put(s,'dark_tower',12);s=effect(s,s.units[0],{op:'drawOne',deck:'spells'},true);assert.equal(unit(s,bearer.uid).ongoingPower,4);assert.ok(unit(s,bearer.uid).grantedKeywords.includes('Ranged'));assert.ok(unit(s,bearer.uid).grantedKeywords.includes('Spellcaster'));
 const h={uid:'spireZap',card:card('zap').id};s.players[0].hand.push(h);const action=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid&&a.caster===bearer.uid&&a.target===enemy.uid);assert.ok(action);s=dispatch(s,action);assert.equal(unit(s,enemy.uid).damage,1);put(s,'valley',12);s=effect(s,s.units[0],{op:'drawOne',deck:'spells'},true);assert.equal(unit(s,bearer.uid).ongoingPower,0);assert.equal(unit(s,bearer.uid).grantedKeywords.includes('Spellcaster'),false);
});
test('Pallid self-name: borrowed Search Party counts dead copies of its real bearer name rather than the banished source name',()=>{
 let s=game();const bearer=add(s,'brown_bears',12);s.artifacts.push({uid:'searchBust',card:card('the_pallid_bust').id,bearer:bearer.uid,at:12,owner:0,controller:0,pallidPrintedCard:card('search_party').id});s.players[0].cemetery.push(card('brown_bears').id,card('brown_bears').id,card('search_party').id);s=effect(s,s.units[0],{op:'drawOne',deck:'spells'},true);assert.equal(unit(s,bearer.uid).ongoingPower,2);
});
test('Pallid self-name: an actual borrowed Adept activation searches for another Brown Bears and really summons it from hand',()=>{
 let s=game();const bearer=add(s,'brown_bears',12);s.artifacts.push({uid:'adeptBust',card:card('the_pallid_bust').id,bearer:bearer.uid,at:12,owner:0,controller:0,pallidPrintedCard:card('adept_illusionist').id});s.players[0].hand.push({uid:'namedBear',card:card('brown_bears').id});s=effect(s,s.units[0],{op:'drawOne',deck:'spells'},true);const action=legalActions(s).find(a=>a.type==='activate'&&a.unit===bearer.uid);assert.ok(action);s=dispatch(s,action);s=choose(s,v=>v===false);s=choose(s,v=>v?.uid==='namedBear');s=choose(s,v=>v?.at===13);assert.equal(s.units.filter(u=>card(u.card).slug==='brown_bears').length,2);assert.equal(s.players[0].hand.some(h=>h.uid==='namedBear'),false);assert.equal(unit(s,bearer.uid).tapped,true);
});
test('Pallid self-name: borrowed Locust copies of different real bearer names do not share one global copy lock',()=>{
 let s=game();const bear=add(s,'brown_bears',12),boar=add(s,'wild_boars',13);for(const [uid,u] of [['bearLocust',bear],['boarLocust',boar]])s.artifacts.push({uid,card:card('the_pallid_bust').id,bearer:u.uid,at:u.at,owner:0,controller:0,pallidPrintedCard:card('locusts_of_illyria').id});s=effect(s,s.units[0],{op:'drawOne',deck:'spells'},true);s=settle(dispatch(s,{type:'end',player:0}));assert.equal(s.units.filter(u=>card(u.card).slug==='brown_bears').length,2);assert.equal(s.units.filter(u=>card(u.card).slug==='wild_boars').length,2);assert.equal(s.summonHistory.filter(e=>e.turn===5&&['Brown Bears','Wild Boars'].includes(e.name)).length,2);
});
test('Pallid self-name: an actual same-turn hand summon blocks the gained Locust copy until a later own end',()=>{
 let s=game();const h={uid:'newBody',card:card('brown_bears').id};s.players[0].hand.push(h);const action=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid&&a.at===12);assert.ok(action);s=dispatch(s,action);const bearer=s.units.find(u=>card(u.card).slug==='brown_bears');assert.ok(s.summonHistory.some(e=>e.uid===bearer.uid&&e.turn===5));s.artifacts.push({uid:'newBodyLocust',card:card('the_pallid_bust').id,bearer:bearer.uid,at:12,owner:0,controller:0,pallidPrintedCard:card('locusts_of_illyria').id});s=effect(s,s.units[0],{op:'drawOne',deck:'spells'},true);s=settle(dispatch(s,{type:'end',player:0}));assert.equal(s.units.filter(u=>card(u.card).slug==='brown_bears').length,1);
 if(s.phase==='draw')s=dispatch(s,legalActions(s).find(a=>a.type==='draw'&&a.deck==='spells'));s=settle(dispatch(s,{type:'end',player:1}));if(s.phase==='draw')s=dispatch(s,legalActions(s).find(a=>a.type==='draw'&&a.deck==='spells'));s=settle(dispatch(s,{type:'end',player:0}));assert.equal(s.units.filter(u=>card(u.card).slug==='brown_bears').length,2);
});
test('Pallid cannot grant printed abilities or types to an unmodifiable bearer, even though the artifact may remain carried',()=>{
 for(const slug of ['monks_of_kobalsa','the_doom_of_dilmun']){let s=game();const bearer=add(s,slug,12),ally=add(s,'brown_bears',13);s.artifacts.push({uid:'blockedBust',card:card('the_pallid_bust').id,bearer:bearer.uid,at:12,owner:0,controller:0,pallidPrintedCard:card('house_arn_bannerman').id});s=effect(s,s.units[0],{op:'drawOne',deck:'spells'},true);assert.equal(unit(s,ally.uid).ongoingPower,0);assert.equal(s.artifacts.find(a=>a.uid==='blockedBust').bearer,bearer.uid);}
});
