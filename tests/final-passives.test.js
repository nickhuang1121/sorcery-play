import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {install,card} from '../src/cards.js';
import {occupied,near,taxicab} from '../src/geography.js';
import {inside} from '../src/objects.js';
import * as F from '../src/final-passives.js';
install(JSON.parse(fs.readFileSync(new URL('../data/official-cards.json',import.meta.url))));
function state(){return {next:1,turn:4,board:Array(20).fill(null),units:[],artifacts:[],auras:[],players:[0,1].map(()=>({spent:0,mana:10,earth:3,hand:[],spells:[],atlas:[],cemetery:[],banished:[]}))};}
function piece(s,slug,at=12,p=0,extra={}){return {uid:'p'+s.next++,card:card(slug).id,at,controller:p,owner:p,layer:'surface',mods:[],damage:0,...extra};}
function unit(s,slug,at=12,p=0,extra={}){const u=piece(s,slug,at,p,extra);s.units.push(u);return u;}
function artifact(s,slug,at=12,p=0,extra={}){const o=piece(s,slug,at,p,extra);s.artifacts.push(o);return o;}
function site(s,slug,at=12,p=0,extra={}){const o=piece(s,slug,at,p,extra);s.board[at]=o;return o;}
const A={card,occupied,nearby:near,distance:taxicab,inside,disabled:u=>!!u.disabled,unit:(s,id)=>s.units.find(u=>u.uid===id),
 region:(s,u)=>u.layer==='below'?'underground':'surface',regionsOverlap:(s,a,b)=>A.region(s,a)===A.region(s,b),regionNames:(s,u)=>new Set([A.region(s,u)]),printedKeywords:c=>c.keywords||[],
 unitUmbrellas:u=>F.finalUnitUmbrellas(u,[...(card(u.card).umbrellas||[]),...(['Demon','Undead'].some(t=>card(u.card).subtypes.includes(t))?['Evil']:[])]),
 kill(s,u,banish){s.units=s.units.filter(v=>v.uid!==u.uid);s.players[u.owner][banish?'banished':'cemetery'].push(u.card);},
 power:u=>card(u.card).defense,
 hurt(s,u,n,lethal){if(u.ward){u.ward=false;return 0;}u.damage+=n;if(lethal)u.lethal=true;return n;},
 draw(s,p){s.players[p].drawn=(s.players[p].drawn||0)+1;},resources:(s,p)=>({available:s.players[p].mana-s.players[p].spent,earth:s.players[p].earth}),
 graveEntries:(s,p)=>s.players[p].cemetery.map((id,index)=>({entity:'grave',player:p,index,card:id,uid:'g'+p+'_'+index})),
 takeGrave(s,p,index,id){assert.equal(s.players[p].cemetery[index],id);s.players[p].cemetery.splice(index,1);},
 removeObject(s,o,zone){s.auras=s.auras.filter(a=>a.uid!==o.uid);s.players[o.owner][zone].push(o.card);}};

test('Saint removes derived and printed Evil from minions, not Avatars, and restores it on silence',()=>{
 const s=state(),saint=unit(s,'saint_of_redemption'),demon=unit(s,'lesser_blood_demon'),av=unit(s,'sorcerer');
 F.refreshFinalSaint(s,A);assert.equal(A.unitUmbrellas(demon).includes('Evil'),false);assert.equal(av.finalNoEvil,false);
 saint.silenced=true;F.refreshFinalSaint(s,A);assert.equal(A.unitUmbrellas(demon).includes('Evil'),true);
});
test('Saint taps every entering minion once; continuous refresh does not tap existing allies again',()=>{
 const s=state(),saint=unit(s,'saint_of_redemption');F.finalPassiveEntry(s,saint,A);assert.equal(saint.tapped,true);
 const enemy=unit(s,'wild_boars',7,1);F.finalPassiveEntry(s,enemy,A);assert.equal(enemy.tapped,true);enemy.tapped=false;F.refreshFinalSaint(s,A);assert.equal(enemy.tapped,false);
 const av=unit(s,'sorcerer');F.finalPassiveEntry(s,av,A);assert.equal(av.tapped,undefined);
});
test('An inactive Saint grants neither entry tapping nor removal of Evil',()=>{
 const s=state();unit(s,'saint_of_redemption',12,0,{disabled:true});const u=unit(s,'wild_boars');F.finalPassiveEntry(s,u,A);F.refreshFinalSaint(s,A);assert.equal(u.tapped,undefined);assert.equal(u.finalNoEvil,false);
});
test('White Wing banishes nearby uncast summons of either player but permits physical hand casts',()=>{
 const s=state();unit(s,'order_of_the_white_wing');const token=unit(s,'skeleton',13,1);assert.equal(F.orderOfWhiteWingReplacesEntry(s,token,false,A),true);assert.equal(A.unit(s,token.uid),undefined);assert.deepEqual(s.players[1].banished,[token.card]);
 const hand=unit(s,'wild_boars',13,1);assert.equal(F.orderOfWhiteWingReplacesEntry(s,hand,true,A),false);assert.ok(A.unit(s,hand.uid));
});
test('White Wing respects region, range, silence and does not replace its own entrance',()=>{
 const s=state(),order=unit(s,'order_of_the_white_wing');assert.equal(F.orderOfWhiteWingReplacesEntry(s,order,false,A),false);
 for(const u of [unit(s,'skeleton',0),unit(s,'skeleton',13,1,{layer:'below'})])assert.equal(F.orderOfWhiteWingReplacesEntry(s,u,false,A),false);
 order.silenced=true;assert.equal(F.orderOfWhiteWingReplacesEntry(s,unit(s,'skeleton',13),false,A),false);
});
test('Book wards a single allied chosen minion only when its bearer casts Magic',()=>{
 const s=state(),caster=unit(s,'sorcerer'),ally=unit(s,'wild_boars',13),book=artifact(s,'book_of_blessings',12,0,{bearer:caster.uid}),target={entity:'unit',uid:ally.uid};
 assert.equal(F.bookOfBlessingsTarget(s,caster,card('bless'),[target],A),true);assert.equal(ally.ward,true);ally.ward=false;
 assert.equal(F.bookOfBlessingsTarget(s,caster,card('wild_boars'),[target],A),false);book.bearer=null;assert.equal(F.bookOfBlessingsTarget(s,caster,card('bless'),[target],A),false);
});
test('Book counts only allied Minions and rejects multiple allies, enemy-only, Evil and location choices',()=>{
 const s=state(),caster=unit(s,'sorcerer'),ally=unit(s,'wild_boars'),enemy=unit(s,'wild_boars',13,1),evil=unit(s,'lesser_blood_demon'),otherAlly=unit(s,'wild_boars',14);artifact(s,'book_of_blessings',12,0,{bearer:caster.uid});
 assert.equal(F.bookOfBlessingsTarget(s,caster,card('bless'),[{entity:'unit',uid:ally.uid},{entity:'unit',uid:enemy.uid}],A),true);ally.ward=false;
 for(const targets of [[{entity:'unit',uid:ally.uid},{entity:'unit',uid:otherAlly.uid}],[{entity:'unit',uid:enemy.uid}],[{entity:'unit',uid:evil.uid}],[{entity:'location',at:12}],[]])assert.equal(F.bookOfBlessingsTarget(s,caster,card('bless'),targets,A),false);
 unit(s,'saint_of_redemption');F.refreshFinalSaint(s,A);assert.equal(F.bookOfBlessingsTarget(s,caster,card('bless'),[{entity:'unit',uid:evil.uid}],A),true);
});
function opt(value){return {label:'target',value};}
test('Oak target precedence is oak, site/location, other object there',()=>{
 const s=state(),oak=artifact(s,'blasted_oak'),u=unit(s,'wild_boars'),other=unit(s,'wild_boars',0),o=opt({entity:'artifact',uid:oak.uid}),siteOpt=opt({entity:'site',at:12}),uOpt=opt({entity:'unit',uid:u.uid}),out=opt({entity:'unit',uid:other.uid});
 assert.deepEqual(F.blastedOakTargets(s,[out,uOpt,siteOpt,o],{spell:true},A),[o]);assert.deepEqual(F.blastedOakTargets(s,[out,uOpt,siteOpt],{spell:true},A),[siteOpt]);assert.deepEqual(F.blastedOakTargets(s,[out,uOpt],{nonBasicAbility:true},A),[uOpt]);
});
test('Oak leaves basic abilities, untargeted effects, illegal targets and inactive Oaks alone',()=>{
 const s=state(),oak=artifact(s,'blasted_oak'),u=unit(s,'wild_boars'),other=unit(s,'wild_boars',0),options=[opt({entity:'unit',uid:u.uid}),opt({entity:'unit',uid:other.uid})];
 assert.deepEqual(F.blastedOakTargets(s,options,{},A),options);assert.deepEqual(F.blastedOakTargets(s,options,{spell:true,untargeted:true},A),options);oak.disabled=true;assert.deepEqual(F.blastedOakTargets(s,options,{spell:true},A),options);
});
test('Gawain redirects adjacent allies only; Bodyguard can optionally protect enemy royalty too',()=>{
 const s=state(),g=unit(s,'sir_gawain'),b=unit(s,'royal_bodyguard',7),ally=unit(s,'wild_boars',13),king=unit(s,'king_arthur',8,1),enemy=unit(s,'wild_boars',8,1);
 assert.deepEqual(F.finalDamageRedirectOptions(s,ally,A).map(o=>[o.uid,o.mandatory]),[[g.uid,true]]);
 assert.deepEqual(F.finalDamageRedirectOptions(s,king,A).map(o=>[o.uid,o.mandatory,o.player]),[[b.uid,false,0]]);assert.equal(F.finalDamageRedirectOptions(s,enemy,A).length,0);
});
test('Damage redirection requires explicit optional selection and retains Ward prevention',()=>{
 const s=state(),guard=unit(s,'royal_bodyguard'),av=unit(s,'sorcerer',13),r={amount:3,kind:'magic'};
 F.applyFinalDamageRedirect(s,av,r,null,A);assert.equal(av.damage,3);assert.equal(guard.damage,0);
 guard.ward=true;assert.equal(F.applyFinalDamageRedirect(s,av,r,guard.uid,A),0);assert.equal(guard.damage,0);assert.equal(av.damage,3);
});
test('Gawain draws only for lethal damage redirected from another ally, and redirect chains cannot cycle',()=>{
 const s=state(),g=unit(s,'sir_gawain'),ally=unit(s,'wild_boars',13);assert.throws(()=>F.applyFinalDamageRedirect(s,ally,{amount:1},null,A),/required/);
 F.applyFinalDamageRedirect(s,ally,{amount:2},g.uid,A);assert.equal(g.finalGawainDeathDraw,undefined);
 F.applyFinalDamageRedirect(s,ally,{amount:3},g.uid,A);assert.equal(g.finalGawainDeathDraw,true);F.finalGawainDeath(s,g,A);assert.equal(s.players[0].drawn,1);
 assert.equal(F.finalDamageRedirectOptions(s,ally,A,[g.uid]).length,0);
});
test('Bureau access charges each active Bureau once for an access, never a preview or another zone',()=>{
 const s=state();site(s,'bureau_of_occult_control');site(s,'bureau_of_occult_control',13);assert.equal(F.finalZoneAccessCost(s,A),4);assert.equal(s.players[0].spent,0);
 assert.equal(F.payFinalZoneAccess(s,0,'hand',A),true);assert.equal(s.players[0].spent,0);assert.equal(F.payFinalZoneAccess(s,0,'cemetery',A),true);assert.equal(s.players[0].spent,4);
 s.players[0].mana=7;assert.equal(F.payFinalZoneAccess(s,0,'collection',A),false);assert.equal(s.players[0].spent,4);s.board[13].silenced=true;assert.equal(F.finalZoneAccessCost(s,A),2);
});
test('Mortuary changes which physical cemetery is treated as yours without moving card ownership',()=>{
 const s=state();s.players[0].cemetery=[card('wild_boars').id];s.players[1].cemetery=[card('skeleton').id];const m=site(s,'mismanaged_mortuary');
 assert.equal(F.finalGraveEntries(s,0,A)[0].card,card('skeleton').id);assert.equal(F.finalGraveEntries(s,1,A)[0].card,card('wild_boars').id);assert.equal(F.finalGraveEntries(s,0,A)[0].player,1);
 m.silenced=true;assert.equal(F.finalGraveEntries(s,0,A)[0].card,card('wild_boars').id);
});
test('Wormelow requires three earth, protects from opponents only, and follows Mortuary zone identity',()=>{
 const s=state(),w=site(s,'wormelow_tump',12,1);s.players[1].cemetery=[card('skeleton').id];assert.equal(F.finalCanAffectGrave(s,0,1,A),false);assert.equal(F.finalCanAffectGrave(s,1,1,A),true);
 s.players[1].earth=2;assert.equal(F.finalCanAffectGrave(s,0,1,A),true);s.players[1].earth=3;site(s,'mismanaged_mortuary',13,0);assert.equal(F.finalCanAffectGrave(s,0,0,A),false);assert.equal(F.finalCanAffectGrave(s,0,1,A),true);
 w.disabled=true;assert.equal(F.finalCanAffectGrave(s,0,0,A),true);
});
test('Mortal Soil bans a chosen dead minion and prevents one complete damage event',()=>{
 const s=state(),a=piece(s,'mortal_soil',6);s.auras.push(a);s.players[0].cemetery=[card('bless').id,card('wild_boars').id];const options=F.mortalSoilOptions(s,a,A);assert.equal(options.length,1);
 assert.equal(F.resolveMortalSoilDamage(s,a.uid,12,options[0].value,A),true);assert.deepEqual(s.players[0].cemetery,[card('bless').id]);assert.deepEqual(s.players[0].banished,[card('wild_boars').id]);assert.equal(s.auras.length,1);
});
test('Mortal Soil dispels when unable to pay its mandatory banish; no damage prevention elsewhere',()=>{
 const s=state(),a=piece(s,'mortal_soil',6);s.auras.push(a);s.players[0].cemetery=[card('bless').id];assert.equal(F.resolveMortalSoilDamage(s,a.uid,0,null,A),false);assert.equal(s.auras.length,1);
 assert.equal(F.resolveMortalSoilDamage(s,a.uid,12,null,A),false);assert.equal(s.auras.length,0);assert.deepEqual(s.players[0].cemetery,[card('bless').id,a.card]);
});
test('Mortal Soil respects Bureau access cost and rejects stale/omitted corpse choices',()=>{
 const s=state(),a=piece(s,'mortal_soil',6);s.auras.push(a);s.players[0].cemetery=[card('wild_boars').id];site(s,'bureau_of_occult_control',7);
 assert.throws(()=>F.resolveMortalSoilDamage(s,a.uid,12,null,A),/requires/);assert.equal(s.players[0].spent,0);const e=F.mortalSoilOptions(s,a,A)[0].value;
 assert.equal(F.resolveMortalSoilDamage(s,a.uid,12,e,A),true);assert.equal(s.players[0].spent,2);
});
test('Central entry hook handles paths without Genesis, suppresses replaced Genesis, and runs once',()=>{
 const s=state();unit(s,'order_of_the_white_wing');const token=unit(s,'skeleton',13,0,{justEntered:true}),hand=unit(s,'wild_boars',13,0,{justEntered:true,finalCastFromHand:true});s.storyline=[{source:{uid:token.uid},step:{op:'draw'}},{source:{uid:hand.uid},step:{op:'draw'}}];
 assert.deepEqual(F.processFinalPassiveEntries(s,A),[token.uid]);assert.equal(s.storyline.length,1);assert.equal(s.storyline[0].source.uid,hand.uid);assert.equal(hand.finalPassiveEntryChecked,true);assert.deepEqual(F.processFinalPassiveEntries(s,A),[]);
});
test('Official White Wing FAQ: a simultaneously summoned Order and other minions all enter',()=>{
 const s=state(),order=unit(s,'order_of_the_white_wing',12,0,{justEntered:true}),other=unit(s,'wild_boars',13,0,{justEntered:true});
 assert.deepEqual(F.processFinalPassiveEntries(s,A),[]);assert.ok(A.unit(s,order.uid));assert.ok(A.unit(s,other.uid));
 order.justEntered=false;const later=unit(s,'skeleton',13,0,{justEntered:true});assert.deepEqual(F.processFinalPassiveEntries(s,A),[later.uid]);
});

// End-to-end tests below use the real action dispatcher, not hook mocks.
import * as E from '../src/engine.js';
import {starter} from '../src/cards.js';
function game(){
 const s=E.newGame([starter(),starter()],42,'local');s.phase='main';s.active=0;s.turn=4;s.pending=null;s.choice=null;s.storyline=[];s.artifacts=[];s.auras=[];
 s.units.forEach(u=>{u.at=u.controller===0?12:2;u.born=0;u.tapped=false;u.justEntered=false;});
 s.board=s.board.map((_,at)=>({uid:'s'+s.next++,card:card('valley').id,owner:at<10?1:0,controller:at<10?1:0}));
 for(const p of s.players){p.hand=[];p.bonusMana=60;p.bonusAffinity={air:10,earth:10,fire:10,water:10};}return s;
}
function existing(s,slug,at=12,p=0,extra={}){const u={uid:'u'+s.next++,card:card(slug).id,at,owner:p,controller:p,tapped:false,born:0,damage:0,mods:[],...extra};s.units.push(u);return u;}
function castHand(s,slug,at=12){const h={uid:'h'+s.next++,card:card(slug).id};s.players[0].hand.push(h);const a=E.legalActions(s,0).find(a=>a.type==='cast'&&a.hand===h.uid&&(a.at===undefined||a.at===at)&&(a.layer===undefined||a.layer==='surface'));assert.ok(a,'No cast action for '+slug);return E.dispatch(s,a);}
function runEffect(s,op,extra={}){const source=s.units.find(u=>u.controller===0&&card(u.card).type==='Avatar');s.choice={player:0,title:op,options:[{label:'Run',value:true}],frame:{source:structuredClone(source),controller:0,effectCard:source.card,step:{op,...extra}}};return E.dispatch(s,{type:'choose',player:0,option:0});}
function settleGame(s){let n=0;while(s.choice){assert.ok(n++<200,'Choice loop');s=E.dispatch(s,{type:'choose',player:s.choice.player,option:0});}return s;}
function oakAt(s,at=12,extra={}){s.artifacts.push({uid:'oak'+s.next++,card:card('blasted_oak').id,owner:0,controller:0,at,layer:'surface',bearer:null,...extra});}
function chooseValue(s,predicate){assert.ok(s.choice);const option=s.choice.options.findIndex(o=>predicate(o.value));assert.notEqual(option,-1,'Missing choice '+s.choice.title);return E.dispatch(s,{type:'choose',player:s.choice.player,option});}

test('dispatch Oak: a direct Magic target is forced after final legality filtering and remains cancellable without costs',()=>{
 let s=game();oakAt(s,13);s=E.restoreGame(s);s=castHand(s,'apply_alkahest');assert.deepEqual(s.choice.options.filter(o=>o.value!==null).map(o=>o.value.at),[13]);assert.equal(s.players[0].spent,0);s=chooseValue(s,v=>v===null);assert.equal(s.players[0].spent,0);assert.ok(s.players[0].hand.some(h=>h.card===card('apply_alkahest').id));
});
test('dispatch Oak: ordinary Magic choices and random outcomes do not acquire target status',()=>{
 let s=game();oakAt(s,12);const away=existing(s,'wild_boars',13);s=E.restoreGame(s);s=castHand(s,'bless');assert.ok(s.choice.options.some(o=>o.value?.uid===away.uid));s=chooseValue(s,v=>v?.uid===away.uid);assert.equal(E.unit(s,away.uid).ward,true);
});
test('dispatch Oak/Chain Lightning: every affordable eligible unit at its site is declared before payment or early completion',()=>{
 let s=game();oakAt(s,13);const one=existing(s,'brown_bears',13),two=existing(s,'brown_bears',13);existing(s,'wild_boars',14);s=E.restoreGame(s);s=castHand(s,'chain_lightning');assert.deepEqual(new Set(s.choice.options.filter(o=>o.value!==null).map(o=>o.value.uid)),new Set([one.uid,two.uid]));s=chooseValue(s,v=>v?.uid===one.uid);assert.equal(s.choice.frame.step.op,'chainDeclare');assert.equal(s.choice.options.some(o=>o.value==='commit'),false);assert.deepEqual(s.choice.options.filter(o=>o.value!==null).map(o=>o.value.uid),[two.uid]);assert.equal(s.players[0].spent,0);s=E.restoreGame(JSON.parse(JSON.stringify(s)));s=chooseValue(s,v=>v?.uid===two.uid);assert.ok(s.choice.options.some(o=>o.value==='commit'));s=chooseValue(s,v=>v==='commit');assert.equal(s.players[0].spent,card('chain_lightning').cost+2);assert.equal(E.unit(s,one.uid).damage,2);assert.equal(E.unit(s,two.uid).damage,2);
});
test('dispatch Oak/Meteor Shower: later nonadjacent choices remain available after the forced site is already selected',()=>{
 let s=game();oakAt(s,12);s=E.restoreGame(s);s=castHand(s,'meteor_shower');assert.equal(s.choice.frame.step.op,'magicDeclareMeteor');assert.deepEqual(s.choice.options.filter(o=>o.value!==null).map(o=>o.value.at),[12]);assert.equal(s.players[0].spent,0);s=chooseValue(s,v=>v?.at===12);assert.equal(s.choice.frame.step.op,'magicDeclareMeteor');assert.ok(s.choice.options.length>1);assert.ok(s.choice.options.filter(o=>o.value!==null).every(o=>o.value.at!==12&&E.distance(s,12,o.value.at)!==1));s=settleGame(s);assert.equal(s.choice,null);
});
test('dispatch Oak: a non-basic Dragon ability targets its location while an inactive Oak imposes no restriction',()=>{
 let s=game();oakAt(s,12);const dragon=existing(s,'ancient_dragon',13);s=E.restoreGame(s);const action=E.legalActions(s,0).find(a=>a.type==='activate'&&a.unit===dragon.uid);assert.ok(action);s=E.dispatch(s,action);assert.deepEqual(s.choice.options.map(o=>o.value.at),[12]);let restored=E.restoreGame(JSON.parse(JSON.stringify(s)));assert.equal(restored.choice.options.length,1);let inactive=game();oakAt(inactive,12,{silenced:true});const inactiveDragon=existing(inactive,'ancient_dragon',13);inactive=E.restoreGame(inactive);inactive.artifacts[0].silenced=true;inactive=E.dispatch(inactive,E.legalActions(inactive,0).find(a=>a.type==='activate'&&a.unit===inactiveDragon.uid));assert.ok(inactive.choice.options.length>1);
});
test('dispatch Oak/legacy: Zap targets are forced but ordinary Overpower choices are unrestricted',()=>{
 let s=game();oakAt(s,13);const victim=existing(s,'brown_bears',13,1),ally=existing(s,'brown_bears',11);s.players[0].hand=[{uid:'zap-hand',card:card('zap').id},{uid:'power-hand',card:card('overpower').id}];s=E.restoreGame(s);const zap=E.legalActions(s,0).filter(a=>a.type==='cast'&&a.hand==='zap-hand');assert.ok(zap.length);assert.ok(zap.every(a=>a.target===victim.uid));assert.ok(E.legalActions(s,0).some(a=>a.type==='cast'&&a.hand==='power-hand'&&a.target===ally.uid));s=E.dispatch(s,zap[0]);s=settleGame(s);assert.equal(E.unit(s,victim.uid).damage,1);
});
test('dispatch Oak/legacy Teleport: a target site is forced while the ally choice remains free',()=>{
 let s=game();oakAt(s,13);const ally=existing(s,'brown_bears',11);s.players[0].hand=[{uid:'teleport-hand',card:card('teleport').id}];s=E.restoreGame(s);const actions=E.legalActions(s,0).filter(a=>a.type==='cast'&&a.hand==='teleport-hand');assert.ok(actions.length);assert.ok(actions.every(a=>a.target.at===13));const action=actions.find(a=>a.target.unit===ally.uid);assert.ok(action);s=settleGame(E.dispatch(s,action));assert.equal(E.unit(s,ally.uid).at,13);
});
test('dispatch Oak/Iron Shackles: targeted conjuring is forced without deleting the ordinary cast mode',()=>{
 let s=game();oakAt(s,13);const victim=existing(s,'brown_bears',13,1);existing(s,'brown_bears',14,1);s.players[0].hand=[{uid:'shackles-hand',card:card('iron_shackles').id}];s=E.restoreGame(s);const actions=E.legalActions(s,0).filter(a=>a.type==='cast'&&a.hand==='shackles-hand');assert.ok(actions.some(a=>!a.shacklesTarget));const targets=actions.filter(a=>a.shacklesTarget);assert.ok(targets.length);assert.ok(targets.every(a=>a.bearer===victim.uid));s=settleGame(E.dispatch(s,targets[0]));assert.equal(s.artifacts.find(o=>card(o.card).slug==='iron_shackles').bearer,victim.uid);assert.equal(E.disabled(E.unit(s,victim.uid)),true);
});
test('dispatch Oak/Joust: ally choice stays free and the chosen ally must target the eligible enemy at Oak',()=>{
 let s=game();oakAt(s,13);const ally=existing(s,'brown_bears',12),forced=existing(s,'brown_bears',13,1);existing(s,'brown_bears',11,1);s=E.restoreGame(s);s=castHand(s,'joust');assert.equal(s.choice.frame.step.op,'finalJoustStart');assert.ok(s.choice.options.some(o=>o.value===ally.uid));s=chooseValue(s,v=>v===ally.uid);assert.equal(s.choice.frame.step.op,'finalJoustEnemy');assert.deepEqual(s.choice.options.map(o=>o.value.uid),[forced.uid]);s=settleGame(s);assert.equal(s.choice,null);
});
test('dispatch Oak/Harpyon: an otherwise illegal strong minion at Oak does not suppress legal weaker targets elsewhere',()=>{
 let s=game();oakAt(s,13);const flyer=existing(s,'brown_bears',12);existing(s,'ancient_dragon',13,1);const weak=existing(s,'wild_boars',14,1);s=E.restoreGame(s);s=castHand(s,'harpyon_urge');s=chooseValue(s,v=>v?.uid===flyer.uid);assert.equal(s.choice.frame.step.op,'magicDeclareComposite');assert.equal(s.players[0].spent,0);assert.ok(s.choice.options.some(o=>o.value?.uid===weak.uid));assert.equal(s.choice.options.some(o=>o.value?.uid&&E.unit(s,o.value.uid)?.at===13),false);
});
test('dispatch Oak/Catapult: crew and grave selections are free choices, but the final legal impact location is forced',()=>{
 let s=game();oakAt(s,13);const bearer=s.units.find(u=>u.controller===0&&card(u.card).type==='Avatar'),crew=existing(s,'brown_bears',12);s.artifacts.push({uid:'catapult-oak-test',card:card('corpse_catapult').id,owner:0,controller:0,at:12,layer:'surface',bearer:bearer.uid});s.players[0].cemetery=[card('wild_boars').id];s.players[0].graves=[];s=E.restoreGame(s);const action=E.legalActions(s,0).find(a=>a.type==='activateArtifact'&&a.object==='catapult-oak-test');assert.ok(action);s=E.dispatch(s,action);s=chooseValue(s,v=>v===crew.uid);s=chooseValue(s,v=>v?.card===card('wild_boars').id);assert.equal(s.choice.frame.step.op,'finalCatapult');assert.deepEqual(s.choice.options.filter(o=>o.value!==null).map(o=>o.value.at),[13]);assert.equal(E.unit(s,bearer.uid).tapped,false);s=chooseValue(s,v=>v?.at===13);s=settleGame(s);assert.equal(E.unit(s,bearer.uid).tapped,true);assert.equal(E.unit(s,crew.uid).tapped,true);assert.equal(s.players[0].cemetery.includes(card('wild_boars').id),false);
});
test('dispatch Oak: a buried source still forces a target above its existing site',()=>{
 let s=game();oakAt(s,13,{layer:'below'});const above=existing(s,'brown_bears',13),other=existing(s,'brown_bears',11);s.players[0].hand=[{uid:'oak-layer-zap',card:card('zap').id}];s=E.restoreGame(s);const actions=E.legalActions(s,0).filter(a=>a.type==='cast'&&a.hand==='oak-layer-zap');assert.ok(actions.length);assert.ok(actions.every(a=>a.target===above.uid));assert.equal(actions.some(a=>a.target===other.uid),false);s=settleGame(E.dispatch(s,actions[0]));assert.equal(E.unit(s,above.uid).damage,1);
});
test('dispatch Oak: an Aura covering its site is forced even when its anchor is elsewhere',()=>{
 let s=game();oakAt(s,12);s.auras=[{uid:'oak-covered-aura',card:card('acid_rain').id,at:6,owner:1,controller:1},{uid:'oak-other-aura',card:card('acid_rain').id,at:14,owner:1,controller:1}];s=E.restoreGame(s);s=castHand(s,'arjaro_exorcist',13);assert.equal(s.choice.frame.step.op,'exorcistBanish');assert.deepEqual(s.choice.options.filter(o=>o.value!==null).map(o=>o.value.uid),['oak-covered-aura']);s=chooseValue(s,v=>v?.uid==='oak-covered-aura');s=settleGame(s);assert.equal(s.auras.some(a=>a.uid==='oak-covered-aura'),false);assert.ok(s.auras.some(a=>a.uid==='oak-other-aura'));
});
test('dispatch Oak: an active gained source on a silenced minion is traced without requiring an Artifact index',()=>{
 let s=game();const source=existing(s,'brown_bears',13,0,{finalAbilitySources:[card('blasted_oak').id],mods:[{silenced:true}]}),other=existing(s,'brown_bears',13);s.players[0].hand=[{uid:'gained-oak-zap',card:card('zap').id}];s=E.restoreGame(s);assert.equal(E.unit(s,source.uid).silenced,true);const actions=E.legalActions(s,0).filter(a=>a.type==='cast'&&a.hand==='gained-oak-zap');assert.ok(actions.length);assert.ok(actions.every(a=>a.target===source.uid));assert.equal(actions.some(a=>a.target===other.uid),false);s=settleGame(E.dispatch(s,actions[0]));assert.equal(E.unit(s,source.uid).damage,1);
});
test('dispatch Oak production registry: hand-casting the Artifact immediately forces its own legal Displace target',()=>{
 assert.equal(card('blasted_oak').playable,true);let s=game();s.players[0].hand=[{uid:'oak-hand-production',card:card('blasted_oak').id}];s=E.restoreGame(s);const action=E.legalActions(s,0).find(a=>a.type==='cast'&&a.hand==='oak-hand-production'&&a.at===13&&!a.bearer);assert.ok(action);s=settleGame(E.dispatch(s,action));const oak=s.artifacts.find(o=>card(o.card).slug==='blasted_oak');assert.ok(oak);assert.equal(oak.at,13);const paid=s.players[0].spent;s=castHand(s,'displace');assert.deepEqual(s.choice.options.filter(o=>o.value!==null).map(o=>o.value.uid),[oak.uid]);s=chooseValue(s,v=>v?.uid===oak.uid);s=chooseValue(s,v=>v===7);s=settleGame(s);assert.equal(s.artifacts.find(o=>o.uid===oak.uid).at,7);assert.equal(s.players[0].spent,paid+card('displace').cost);
});
test('dispatch Oak: basic attacks remain free to target an eligible enemy outside the forced site',()=>{
 let s=game();oakAt(s,13);existing(s,'brown_bears',13,1);const outside=existing(s,'brown_bears',11,1);s=E.restoreGame(s);const actor=E.avatar(s,0),action=E.legalActions(s,0).find(a=>a.type==='attack'&&a.unit===actor.uid&&a.at===11&&a.target===outside.uid);assert.ok(action);s=E.dispatch(s,action);assert.equal(E.avatar(s,0).at,11);assert.equal(E.unit(s,outside.uid).damage,1);assert.equal(s.units.find(u=>u.controller===1&&u.at===13).damage,0);
});
test('dispatch Oak: a non-targeted summon location and Kythera random outcomes remain unrestricted',()=>{
 let s=game();oakAt(s,13);s.players[0].cemetery=[card('wild_boars').id,card('brown_bears').id];s.players[0].graves=[];const bearer=E.avatar(s,0);s.artifacts.push({uid:'oak-random-kythera',card:card('kythera_mechanism').id,at:12,layer:'surface',owner:0,controller:0,bearer:bearer.uid});s=E.restoreGame(s);s=castHand(s,'raise_dead');assert.ok(s.choice.options.some(o=>o.value?.at===11));s=chooseValue(s,v=>v?.at===11);assert.equal(s.choice.frame.step.op,'luckyResume');assert.equal(s.choice.options.length,2);s=chooseValue(s,v=>v===1);s=settleGame(s);assert.ok(s.units.some(u=>card(u.card).slug==='brown_bears'&&u.at===11));
});

test('dispatch: Saint himself and later hand-cast minions enter tapped and Evil is restored when silenced',()=>{
 let s=game();const d=existing(s,'lesser_blood_demon',13);s=castHand(s,'saint_of_redemption');let saint=s.units.find(u=>card(u.card).slug==='saint_of_redemption');assert.equal(saint.tapped,true);assert.equal(E.unitUmbrellas(E.unit(s,d.uid)).includes('Evil'),false);assert.ok(E.unitTypes(E.unit(s,d.uid)).includes('Demon'));
 s=castHand(s,'wild_boars');assert.equal(s.units.find(u=>card(u.card).slug==='wild_boars').tapped,true);
 saint=s.units.find(u=>card(u.card).slug==='saint_of_redemption');saint.mods.push({silenced:true});s=E.restoreGame(s);assert.equal(E.unitUmbrellas(E.unit(s,d.uid)).includes('Evil'),true);
});
test('dispatch: White Wing allows hand cast but banishes its token Genesis summon without entry effects',()=>{
 let s=game();existing(s,'order_of_the_white_wing',12);s=E.restoreGame(s);s=settleGame(castHand(s,'novice_necromancer',12));assert.ok(s.units.some(u=>card(u.card).slug==='novice_necromancer'));assert.equal(s.units.some(u=>card(u.card).slug==='skeleton'),false);assert.ok(s.players[0].banished.includes(card('skeleton').id));
});
test('dispatch: White Wing replacement prevents Genesis of an effect-summoned minion',()=>{
 let s=game();existing(s,'order_of_the_white_wing',12);s=E.restoreGame(s);s=settleGame(runEffect(s,'summon',{slug:'novice_necromancer',count:1}));assert.equal(s.units.some(u=>card(u.card).slug==='novice_necromancer'),false);assert.equal(s.units.some(u=>card(u.card).slug==='skeleton'),false);assert.ok(s.players[0].banished.includes(card('novice_necromancer').id));
});
test('dispatch official FAQ: Golden Dawn simultaneously summons Order and adjacent minions successfully',()=>{
 let s=game();s.players[0].spells=[card('order_of_the_white_wing').id,card('wild_boars').id];s=settleGame(runEffect(s,'goldenDawn'));const order=s.units.find(u=>card(u.card).slug==='order_of_the_white_wing'),boars=s.units.find(u=>card(u.card).slug==='wild_boars');assert.ok(order);assert.ok(boars);assert.equal(order.justEntered,false);assert.equal(boars.justEntered,false);
 s.units.find(u=>u.controller===0&&card(u.card).type==='Avatar').at=16;s=settleGame(runEffect(s,'summon',{slug:'skeleton',count:1}));assert.equal(s.units.some(u=>card(u.card).slug==='skeleton'),false);
});
test('dispatch official FAQ: Saint prevents Black Mass revealing Evil minions from the spellbook',()=>{
 let s=game();existing(s,'saint_of_redemption');s=E.restoreGame(s);s.players[0].spells=[card('lesser_blood_demon').id,card('greater_blood_demon').id];s=settleGame(runEffect(s,'browseTop',{count:4,limit:2,evilMinions:true}));assert.equal(s.players[0].hand.length,0);assert.equal(s.players[0].spells.length,2);
});
test('dispatch: Saint removes Evil from cemetery card checks and top-of-spellbook cast permission',()=>{
 let s=game();existing(s,'doomsday_cult',12);s.players[0].spells=[card('lesser_blood_demon').id];s=E.restoreGame(s);assert.ok(E.legalActions(s,0).some(a=>a.type==='cast'&&a.top!==undefined));
 existing(s,'saint_of_redemption',17);s=E.restoreGame(s);assert.equal(E.legalActions(s,0).some(a=>a.type==='cast'&&a.top!==undefined),false);
 s.players[0].cemetery=[card('lesser_blood_demon').id];assert.equal(F.finalCardUmbrellas(s,card('lesser_blood_demon'),{card,disabled:E.disabled}).includes('Evil'),false);
});
test('dispatch: Saint lets redeemed Demons enter Crucifix location; inactive Saint restores the restriction',()=>{
 let s=game();const d=existing(s,'lesser_blood_demon',13);s.artifacts.push({uid:'o'+s.next++,card:card('crucifix').id,owner:0,controller:0,at:12,layer:'surface',bearer:null});s=E.restoreGame(s);assert.equal(E.reachable(s,E.unit(s,d.uid)).has(12),false);
 const saint=existing(s,'saint_of_redemption',17);s=E.restoreGame(s);assert.equal(E.reachable(s,E.unit(s,d.uid)).has(12),true);E.unit(s,saint.uid).mods.push({disabled:true});s=E.restoreGame(s);assert.equal(E.reachable(s,E.unit(s,d.uid)).has(12),false);
});

import {passives as realPassives} from '../src/definitions.js';
const RockA={...A,passives:realPassives,queueEffects(s,steps,source,controller,effectCard){(s.storyline??=[]).push(...steps.slice().reverse().map(step=>({step,source:structuredClone(source),controller,effectCard})));}};
function rockEffect(s,rock,pick=()=>0){s.storyline=[{step:{op:'finalRedRock'},source:structuredClone(rock),controller:rock.controller,effectCard:rock.card}];let n=0;while(s.storyline.length||s.choice){assert.ok(n++<200,'Rock continuation loop');if(s.choice){const c=s.choice;s.choice=null;const option=pick(c,s);s.storyline.push({...c.frame,selected:c.options[option].value});}else F.resolveFinalPassives(s,s.storyline.pop(),RockA);}return s;}
test('Red Rock: sharing its location stops carrying even cannot-drop Tabula, but not another region',()=>{
 const s=state(),rock=artifact(s,'red_rock_of_ravannis'),u=unit(s,'wild_boars'),tabula=artifact(s,'tabula_rasa',12,0,{bearer:u.uid}),below=artifact(s,'sword_and_shield',12,0,{layer:'below',bearer:'below-bearer'});
 assert.equal(F.redRockCarryingForbidden(s,tabula,RockA),true);assert.equal(F.refreshRedRockCarrying(s,RockA),true);assert.equal(tabula.bearer,null);assert.equal(below.bearer,'below-bearer');assert.equal(F.refreshRedRockCarrying(s,RockA),false);rock.silenced=true;assert.equal(F.redRockCarryingForbidden(s,tabula,RockA),false);
});
test('Red Rock: artifacts and the shared bearer move one step together after every direction has been chosen',()=>{
 const s=state();site(s,'valley',12);const rock=artifact(s,'red_rock_of_ravannis',12),bearer=unit(s,'wild_boars',0),a=artifact(s,'sword_and_shield',0,0,{bearer:bearer.uid}),b=artifact(s,'poisonous_dagger',0,0,{bearer:bearer.uid}),distant=artifact(s,'lance',19);let decisions=0;
 rockEffect(s,rock,()=>{decisions++;assert.equal(bearer.at,0);assert.equal(a.at,0);assert.equal(b.at,0);assert.equal(distant.at,19);return 0;});assert.equal(decisions,2);assert.equal(bearer.at,1);assert.equal(a.at,1);assert.equal(b.at,1);assert.equal(distant.at,14);assert.equal(a.bearer,bearer.uid);
});
test('Red Rock official FAQ: an unpullable bearer loses movable artifacts to the pull',()=>{
 const s=state();site(s,'valley',12);const rock=artifact(s,'red_rock_of_ravannis',12),talus=unit(s,'iron_man_talus',0),sword=artifact(s,'sword_and_shield',0,0,{bearer:talus.uid});rockEffect(s,rock);assert.equal(talus.at,0);assert.equal(sword.at,1);assert.equal(sword.bearer,null);
});
test('Red Rock pulls other Monuments and artifact units, but cannot-force Talus remains still',()=>{
 const s=state();site(s,'valley',12);const rock=artifact(s,'red_rock_of_ravannis'),monument=artifact(s,'the_immortal_throne',0),golem=unit(s,'clay_golem',19),talus=unit(s,'iron_man_talus',4);rockEffect(s,rock);assert.equal(monument.at,1);assert.equal(golem.at,14);assert.equal(talus.at,4);
});
test('Red Rock cannot pull across a region boundary and cannot refer to a nonexistent source site',()=>{
 const s=state(),rock=artifact(s,'red_rock_of_ravannis',12),o=artifact(s,'sword_and_shield',0);assert.deepEqual(F.redRockPullDestinations(s,o,12,0,RockA),[]);site(s,'valley',12);
 const boundaryA={...RockA,region:(state,o)=>o.at===0?'void':'surface',regionsOverlap:(state,a,b)=>(a.at===0?'void':'surface')===(b.at===0?'void':'surface')};assert.deepEqual(F.redRockPullDestinations(s,o,12,0,boundaryA),[]);assert.equal(F.redRockPullDestinations(s,o,12,0,RockA).length,2);rockEffect(s,rock);assert.equal(o.at,1);
});
test('dispatch: Red Rock prohibits Pick Up and forcibly releases a cannot-drop artifact without a Drop action',()=>{
 let s=game();const bearer=existing(s,'wild_boars',12);s.artifacts.push({uid:'rock',card:card('red_rock_of_ravannis').id,owner:0,controller:0,at:12,layer:'surface',bearer:null},{uid:'tabula',card:card('tabula_rasa').id,owner:0,controller:0,at:12,layer:'surface',bearer:bearer.uid});s=E.restoreGame(s);assert.equal(s.artifacts.find(o=>o.uid==='tabula').bearer,null);assert.equal(E.pickupItems(s,E.unit(s,bearer.uid)).length,0);assert.equal(E.unit(s,bearer.uid).silenced,false);
});
test('dispatch: Red Rock pulls on both players end phases and direction choices survive a saved-game roundtrip',()=>{
 let s=game();s.artifacts.push({uid:'rock',card:card('red_rock_of_ravannis').id,owner:0,controller:0,at:12,layer:'surface',bearer:null},{uid:'sword',card:card('sword_and_shield').id,owner:0,controller:0,at:0,layer:'surface',bearer:null});s=E.restoreGame(s);s=E.dispatch(s,{type:'end',player:0});assert.ok(s.choice);assert.equal(s.choice.player,0);assert.equal(s.artifacts.find(o=>o.uid==='sword').at,0);s=E.restoreGame(JSON.parse(JSON.stringify(s)));s=settleGame(s);assert.equal(s.artifacts.find(o=>o.uid==='sword').at,1);
 // Reach the next main phase using the engine's ordinary draw action.
 while(s.phase!=='main'){const actions=E.legalActions(s,s.active),a=actions.find(a=>a.type==='draw')||actions[0];assert.ok(a);s=settleGame(E.dispatch(s,a));}
 s=E.dispatch(s,{type:'end',player:s.active});assert.ok(s.choice);assert.equal(s.choice.player,0);s=settleGame(s);assert.equal(s.artifacts.find(o=>o.uid==='sword').at,2);
});
test('dispatch/restore: newly silencing Saint immediately restores Evil site bonuses in the same recalculation',()=>{
 let s=game();const saint=existing(s,'saint_of_redemption',12),demon=existing(s,'lesser_blood_demon',13);s.board[13]={uid:'evil-site',card:card('desecrated_ground').id,owner:0,controller:0};s=E.restoreGame(s);assert.equal(E.power(E.unit(s,demon.uid)),card('lesser_blood_demon').attack);
 E.unit(s,saint.uid).mods.push({silenced:true});s=E.restoreGame(s);assert.equal(E.power(E.unit(s,demon.uid)),card('lesser_blood_demon').attack+1);
 E.unit(s,saint.uid).mods=[];s=E.restoreGame(s);assert.equal(E.power(E.unit(s,demon.uid)),card('lesser_blood_demon').attack);
});
test('dispatch: casting Tabula onto Saint immediately silences redemption before Evil power is recalculated',()=>{
 let s=game();const saint=existing(s,'saint_of_redemption',12),demon=existing(s,'lesser_blood_demon',13);s.board[13]={uid:'evil-site',card:card('desecrated_ground').id,owner:0,controller:0};s=E.restoreGame(s);assert.equal(E.power(E.unit(s,demon.uid)),card('lesser_blood_demon').attack);
 const h={uid:'tabula-hand',card:card('tabula_rasa').id};s.players[0].hand.push(h);const action=E.legalActions(s,0).find(a=>a.type==='cast'&&a.hand===h.uid&&a.bearer===saint.uid);assert.ok(action);s=E.dispatch(s,action);assert.equal(E.unit(s,saint.uid).silenced,true);assert.equal(E.power(E.unit(s,demon.uid)),card('lesser_blood_demon').attack+1);
 s.artifacts=s.artifacts.filter(a=>card(a.card).slug!=='tabula_rasa');s=E.restoreGame(s);assert.equal(E.unit(s,saint.uid).silenced,false);assert.equal(E.power(E.unit(s,demon.uid)),card('lesser_blood_demon').attack);
});

test('Throne: a Site uses printed cost zero, both players trigger it, and counters are added after a declared draw',()=>{
 const s=state(),throne=artifact(s,'the_immortal_throne');s.players[1].spells=[card('wild_boars').id];s.storyline=[];F.finalThronePlayed(s,1,card('valley'),RockA);assert.equal(s.storyline.length,1);assert.equal(throne.finalThroneLevel,undefined);
 const f=s.storyline.pop();F.resolveFinalPassives(s,f,RockA);assert.equal(s.choice.player,1);assert.equal(throne.finalThroneLevel,undefined);F.resolveFinalPassives(s,{...s.choice.frame,selected:'spells'},RockA);assert.equal(s.players[1].drawn,1);assert.equal(throne.finalThroneLevel,1);
});
test('Throne: cost comparison ignores paid mana and preserves separate counters for multiple Thrones',()=>{
 const s=state(),a=artifact(s,'the_immortal_throne',12,0,{finalThroneLevel:card('wild_boars').cost}),b=artifact(s,'the_immortal_throne',7,1,{finalThroneLevel:card('wild_boars').cost});s.players[0].spent=0;s.players[0].spells=[card('wild_boars').id];s.storyline=[];F.finalThronePlayed(s,0,card('wild_boars'),RockA);assert.equal(s.storyline.length,2);
 for(const f of s.storyline.splice(0))F.resolveFinalPassives(s,{...f,selected:'spells'},RockA);assert.equal(a.finalThroneLevel,card('wild_boars').cost+1);assert.equal(b.finalThroneLevel,card('wild_boars').cost+1);assert.equal(s.players[0].drawn,2);
});
test('Throne: attempting the chosen empty deck loses before adding a level, while already-triggered draws survive removal',()=>{
 const s=state(),throne=artifact(s,'the_immortal_throne');s.winner=null;s.storyline=[];F.finalThronePlayed(s,0,card('valley'),RockA);const f=s.storyline.pop();F.resolveFinalPassives(s,{...f,selected:'atlas'},RockA);assert.equal(s.winner,1);assert.equal(s.phase,'over');assert.equal(throne.finalThroneLevel,undefined);
 s.winner=null;s.phase='main';s.players[0].spells=[card('wild_boars').id];s.artifacts=[];F.resolveFinalPassives(s,{...f,selected:'spells'},RockA);assert.equal(s.players[0].drawn,1);
});
test('Throne: alone means no other unit at that location, including dying units; normal artifacts do not block',()=>{
 const s=state();s.winner=null;const throne=artifact(s,'the_immortal_throne',12,0,{finalThroneLevel:8}),avatar=unit(s,'sorcerer',12,1),blocker=unit(s,'wild_boars',12,0,{dying:true});artifact(s,'lance',12);assert.deepEqual(F.finalThroneWinners(s,RockA),[]);
 s.units=s.units.filter(u=>u.uid!==blocker.uid);assert.deepEqual(F.finalThroneWinners(s,RockA),[1]);throne.silenced=true;assert.deepEqual(F.finalThroneWinners(s,RockA),[]);throne.silenced=false;avatar.layer='below';assert.deepEqual(F.finalThroneWinners(s,RockA),[]);avatar.layer='surface';assert.equal(F.checkFinalThroneVictory(s,RockA),true);assert.equal(s.winner,1);
});
test('Throne project ruling: simultaneous double-win chooses the current turn player',()=>{
 const s=state();s.winner=null;artifact(s,'the_immortal_throne',12,0,{finalThroneLevel:8});artifact(s,'the_immortal_throne',2,1,{finalThroneLevel:8});unit(s,'sorcerer',12,0);unit(s,'sorcerer',2,1);
 s.active=1;assert.equal(F.checkFinalThroneVictory(s,RockA),true);assert.equal(s.winner,1);assert.equal(s.phase,'over');
});
test('dispatch: playing a Site then a printed-one-cost spell advances Throne from zero to two',()=>{
 let s=game();s.board[11]=null;s.artifacts.push({uid:'throne',card:card('the_immortal_throne').id,owner:0,controller:0,at:12,layer:'surface',bearer:null});s.players[0].spells=[card('wild_boars').id,card('wild_boars').id];s.players[0].hand=[{uid:'site-hand',card:card('valley').id}];s=E.restoreGame(s);const play=E.legalActions(s,0).find(a=>a.type==='site'&&a.hand==='site-hand'&&a.at===11);assert.ok(play);s=E.dispatch(s,play);assert.ok(s.choice);assert.equal(s.choice.player,0);s=settleGame(s);assert.equal(s.artifacts.find(o=>o.uid==='throne').finalThroneLevel,1);
 assert.equal(card('grain_sparrow').cost,1);s=settleGame(castHand(s,'grain_sparrow'));assert.equal(s.artifacts.find(o=>o.uid==='throne').finalThroneLevel,2);assert.equal(s.players[0].hand.length,2);
});
test('dispatch: an Avatar arriving alone at an eighth-level Throne wins immediately',()=>{
 let s=game();s.units.find(u=>u.controller===0&&card(u.card).type==='Avatar').at=11;s.artifacts.push({uid:'throne',card:card('the_immortal_throne').id,owner:1,controller:1,at:12,layer:'surface',bearer:null,finalThroneLevel:8});s=E.restoreGame(s);const av=s.units.find(u=>u.controller===0&&card(u.card).type==='Avatar'),move=E.legalActions(s,0).find(a=>a.type==='move'&&a.unit===av.uid&&a.at===12);assert.ok(move);s=E.dispatch(s,move);assert.equal(s.winner,0);assert.equal(s.phase,'over');
});
test('dispatch: Throne makes the actual opposing site player choose a draw, and an empty chosen deck loses',()=>{
 let s=game();s.active=1;s.board[3]=null;s.artifacts.push({uid:'throne',card:card('the_immortal_throne').id,owner:0,controller:0,at:12,layer:'surface',bearer:null});s.players[1].hand=[{uid:'op-site',card:card('valley').id}];s.players[1].spells=[];s=E.restoreGame(s);const action=E.legalActions(s,1).find(a=>a.type==='site'&&a.at===3);assert.ok(action);s=E.dispatch(s,action);assert.equal(s.choice.player,1);assert.equal(s.choice.frame.step.op,'finalThrone');s=E.dispatch(s,{type:'choose',player:1,option:0});assert.equal(s.winner,0);assert.equal(s.phase,'over');assert.equal(s.artifacts.find(o=>o.uid==='throne').finalThroneLevel,undefined);
});
test('dispatch: Throne waits for a dying blocker and its Deathrite-created unit before declaring an Avatar alone',()=>{
 let s=game();const blocker=existing(s,'noisome_twosome',12);s.artifacts.push({uid:'throne',card:card('the_immortal_throne').id,owner:0,controller:0,at:12,layer:'surface',bearer:null,finalThroneLevel:8});s=E.restoreGame(s);
 const destroy=(state,uid)=>{const source=state.units.find(u=>u.controller===0&&card(u.card).type==='Avatar');state.choice={player:0,title:'Destroy blocker',options:[{label:'Destroy',value:{entity:'unit',uid}}],frame:{source:structuredClone(source),controller:0,effectCard:source.card,step:{op:'destroy',select:{kind:'unit',minion:true,untargeted:true}}}};return E.dispatch(state,{type:'choose',player:0,option:0});};
 s=settleGame(destroy(s,blocker.uid));assert.equal(s.winner,null);const skeleton=s.units.find(u=>card(u.card).slug==='skeleton');assert.ok(skeleton);s=settleGame(destroy(s,skeleton.uid));assert.equal(s.winner,0);assert.equal(s.phase,'over');
});
