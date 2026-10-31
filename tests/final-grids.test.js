import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {install,card,starter} from '../src/cards.js';
import {newGame,restoreGame,dispatch,legalActions,unit} from '../src/engine.js';
import {placedGrid,gridPatterns,waveGrid,judgmentPlacements} from '../src/final-grids.js';
install(JSON.parse(fs.readFileSync(new URL('../data/official-cards.json',import.meta.url))));
function state(){const s=newGame([starter(),starter()],42,'local');s.phase='main';s.active=0;s.turn=4;s.artifacts=[];s.auras=[];s.storyline=[];s.units.forEach(u=>{u.at=u.controller===0?17:2;u.born=0;});s.board=s.board.map((_,at)=>({uid:'s'+s.next++,card:card('valley').id,owner:at<10?1:0,controller:at<10?1:0}));for(const p of s.players){p.hand=[];p.bonusMana=80;p.bonusAffinity={air:10,earth:10,fire:10,water:10};}return s;}
function add(s,slug='wild_boars',at=12,p=1,extra={}){const u={uid:'u'+s.next++,card:card(slug).id,at,owner:p,controller:p,born:0,damage:0,tapped:false,ward:false,mods:[{power:50}],...extra};s.units.push(u);return u;}
function hand(s,slug){const h={uid:'h'+s.next++,card:card(slug).id};s.players[0].hand.push(h);return h;}
function cast(s,slug,caster){const h=hand(s,slug);s=restoreGame(s);const a=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid&&(!caster||a.caster===caster));assert.ok(a,'No cast action for '+slug);return dispatch(s,a);}
function choose(s,predicate){assert.ok(s.choice,'Expected grid choice');const option=s.choice.options.findIndex(o=>predicate(o.value,o));assert.notEqual(option,-1,'Missing grid choice: '+JSON.stringify(s.choice.options));return dispatch(s,{type:'choose',player:s.choice.player,option});}
const damage=(s,u)=>unit(s,u.uid)?.damage;

test('printed directional grid rotation clips edges without wrapping rows',()=>{
 assert.deepEqual(placedGrid(0,gridPatterns.flame_strike,0),[]);
 assert.deepEqual(placedGrid(4,gridPatterns.burning_hands,1),[]);
 assert.deepEqual(placedGrid(12,gridPatterns.burning_hands,1),[{at:13,amount:2},{at:14,amount:1}]);
 assert.equal(waveGrid().find(c=>c.at===0).amount,7);assert.ok(!waveGrid().some(c=>c.at===4));
});
test('Burning Hands uses two distinct cardinal directions, near 2/far 1, and can be cast by a Mortal',()=>{
 let s=state();const caster=add(s,'field_laborers',12,0),north=add(s,'wild_boars',7),far=add(s,'wild_boars',2),east=add(s,'wild_boars',13),south=add(s,'wild_boars',17);
 s=cast(s,'burning_hands',caster.uid);s=choose(s,v=>v===0);assert.ok(!s.choice.options.some(o=>o.value===0));s=choose(s,v=>v===1);
 assert.equal(damage(s,north),2);assert.equal(damage(s,far),1);assert.equal(damage(s,east),2);assert.equal(damage(s,south),0);assert.equal(damage(s,caster),0);assert.equal(s.players[0].spent,card('burning_hands').cost);
});
test('Burning Hands does not let a non-Mortal non-Spellcaster act as caster',()=>{
 let s=state();const beast=add(s,'wild_boars',12,0),h=hand(s,'burning_hands');s=restoreGame(s);
 assert.ok(!legalActions(s).some(a=>a.type==='cast'&&a.hand===h.uid&&a.caster===beast.uid));
});
test('Firebreathing allows Beast and Dragon casters and applies its 4/1/1/1 pattern',()=>{
 let s=state();const beast=add(s,'wild_boars',12,0),center=add(s,'wild_boars',7),left=add(s,'wild_boars',6),far=add(s,'wild_boars',2),dragon=add(s,'ancient_dragon',16,0);
 const h=hand(s,'firebreathing');s=restoreGame(s);assert.ok(legalActions(s).some(a=>a.type==='cast'&&a.hand===h.uid&&a.caster===dragon.uid));
 const action=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid&&a.caster===beast.uid);assert.ok(action);s=dispatch(s,action);s=choose(s,v=>v===0);
 assert.equal(damage(s,center),4);assert.equal(damage(s,left),1);assert.equal(damage(s,far),1);assert.equal(damage(s,beast),0);
});
test('Flame Strike hits near center for 3 and the far row for 1 each',()=>{
 let s=state();const center=add(s,'wild_boars',12),left=add(s,'wild_boars',6),far=add(s,'wild_boars',7),right=add(s,'wild_boars',8),unhit=add(s,'wild_boars',11);
 s=cast(s,'flame_strike');s=choose(s,v=>v===0);assert.equal(damage(s,center),3);assert.equal(damage(s,left),1);assert.equal(damage(s,far),1);assert.equal(damage(s,right),1);assert.equal(damage(s,unhit),0);
});
test('Flame Strike sums all affected oversized squares before applying Ward once',()=>{
 let s=state();const giant=add(s,'mountain_giant',6,1,{size:2}),warded=add(s,'mountain_giant',6,1,{size:2,ward:true});
 s=cast(s,'flame_strike');s=choose(s,v=>v===0);assert.equal(damage(s,giant),5);assert.equal(damage(s,warded),0);assert.equal(unit(s,warded.uid).ward,false);
});
test('Directional grids stay in the origin region and do not affect below units',()=>{
 let s=state();const below=add(s,'wild_boars',12,1,{layer:'below',mods:[{power:50},{keyword:'Burrowing'}]}),surface=add(s,'wild_boars',12);
 s=cast(s,'flame_strike');s=choose(s,v=>v===0);assert.equal(damage(s,below),0);assert.equal(damage(s,surface),3);
});
test('Flame Wave is horizontal, can reflect, affects atop sites, and has 7/5/3/1 columns',()=>{
 let s=state();const left=add(s,'wild_boars',0),second=add(s,'wild_boars',6),fourth=add(s,'wild_boars',18),right=add(s,'wild_boars',4),below=add(s,'wild_boars',5,1,{layer:'below',mods:[{power:50},{keyword:'Burrowing'}]});
 s=cast(s,'flame_wave');assert.deepEqual(s.choice.options.map(o=>o.value),[false,true]);s=choose(s,v=>v===false);
 assert.equal(damage(s,left),7);assert.equal(damage(s,second),5);assert.equal(damage(s,fourth),1);assert.equal(damage(s,right),0);assert.equal(damage(s,below),0);
});
test('Flame Wave reflection starts on the right edge and excludes void squares',()=>{
 let s=state();const right=add(s,'wild_boars',4),left=add(s,'wild_boars',0),voidwalker=add(s,'aethermoeba',9,1);s.board[9]=null;
 s=cast(s,'flame_wave');s=choose(s,v=>v===true);assert.equal(damage(s,right),7);assert.equal(damage(s,left),0);assert.equal(damage(s,voidwalker),0);
});
test('Lava Flow hits other units at origin for 5, near for 4, far for 2, and spares caster',()=>{
 let s=state();const origin=add(s,'wild_boars',17),near=add(s,'wild_boars',12),far=add(s,'wild_boars',7),avatar=s.units.find(u=>u.controller===0);
 s=cast(s,'lava_flow');s=choose(s,v=>v===0);assert.equal(damage(s,origin),5);assert.equal(damage(s,near),4);assert.equal(damage(s,far),2);assert.equal(damage(s,avatar),0);
});
test('Lava Flow is unavailable to a caster without a site',()=>{
 let s=state();s.board[17]=null;const h=hand(s,'lava_flow');s=restoreGame(s);assert.ok(!legalActions(s).some(a=>a.type==='cast'&&a.hand===h.uid));
});
test('Holy Nova normally centers on caster, damages only enemies, and uses 3/2/1 grid',()=>{
 let s=state();const enemy=add(s,'wild_boars',17),adjacent=add(s,'wild_boars',12),corner=add(s,'wild_boars',11),ally=add(s,'wild_boars',12,0);
 s=cast(s,'holy_nova');s=choose(s,v=>v.caster===true);assert.equal(damage(s,enemy),3);assert.equal(damage(s,adjacent),2);assert.equal(damage(s,corner),1);assert.equal(damage(s,ally),0);
});
test('Holy Nova can break a distant allied Ward to recenter without targeting or consuming enemy Ward elsewhere',()=>{
 let s=state();const beacon=add(s,'wild_boars',6,0,{ward:true}),enemy=add(s,'wild_boars',6),near=add(s,'wild_boars',7),remote=add(s,'wild_boars',17);
 s=cast(s,'holy_nova');s=choose(s,v=>v.uid===beacon.uid);assert.equal(unit(s,beacon.uid).ward,false);assert.equal(damage(s,enemy),3);assert.equal(damage(s,near),2);assert.equal(damage(s,remote),0);
});
test('Holy Nova also permits breaking an allied site Ward and rejects enemy Wards as centers',()=>{
 let s=state();s.board[6].controller=0;s.board[6].ward=true;const enemy=add(s,'wild_boars',6),enemyWard=add(s,'wild_boars',7,1,{ward:true});
 s=cast(s,'holy_nova');assert.ok(!s.choice.options.some(o=>o.value.uid===enemyWard.uid));s=choose(s,v=>v.entity==='site'&&v.at===6);
 assert.equal(s.board[6].ward,false);assert.equal(damage(s,enemy),3);assert.equal(damage(s,enemyWard),0);assert.equal(unit(s,enemyWard.uid).ward,false);
});
test('Wreathed wards all non-Evil minions at target location then damages only surrounding minions',()=>{
 let s=state();const ally=add(s,'wild_boars',12,0),enemy=add(s,'wild_boars',12),evil=add(s,'bone_rabble',12),neighbor=add(s,'wild_boars',7),av=s.units.find(u=>u.controller===1);av.at=7;
 s=cast(s,'wreathed_in_righteousness');s=choose(s,v=>v.at===12&&v.layer==='surface');
 assert.equal(unit(s,ally.uid).ward,true);assert.equal(unit(s,enemy.uid).ward,true);assert.equal(unit(s,evil.uid).ward,false);assert.equal(damage(s,ally),0);assert.equal(damage(s,neighbor),2);assert.equal(damage(s,av),0);
});
test('Wreathed can Ward an oversized center occupant before its surrounding-square damage',()=>{
 let s=state();const giant=add(s,'mountain_giant',6,1,{size:2});s=cast(s,'wreathed_in_righteousness');s=choose(s,v=>v.at===6&&v.layer==='surface');
 assert.equal(damage(s,giant),0);assert.equal(unit(s,giant.uid).ward,false);
});
test('Meteor Shower chooses three non-bordering sites, permits corners, and applies distinct large/medium/small grids',()=>{
 let s=state();const large=add(s,'wild_boars',6),medium=add(s,'wild_boars',12),small=add(s,'wild_boars',19),overlap=add(s,'wild_boars',7);
 s=cast(s,'meteor_shower');s=choose(s,v=>v.at===6);assert.ok(!s.choice.options.some(o=>[1,5,6,7,11].includes(o.value?.at)));assert.ok(s.choice.options.some(o=>o.value?.at===12));
 s=choose(s,v=>v.at===12);s=choose(s,v=>v.at===19);s=choose(s,v=>v==='commit');
 assert.equal(damage(s,large),7);assert.equal(damage(s,medium),7);assert.equal(damage(s,small),3);assert.equal(damage(s,overlap),7);
});
test('Meteor Shower is unavailable without three mutually non-bordering sites',()=>{
 let s=state();s.board=s.board.map((site,at)=>[16,17,18].includes(at)?site:null);const h=hand(s,'meteor_shower');s=restoreGame(s);
 assert.ok(!legalActions(s).some(a=>a.type==='cast'&&a.hand===h.uid));
});
test('Meteor Shower choice survives a save/restore round trip with earlier centers intact',()=>{
 let s=state();const victim=add(s,'wild_boars',6);s=cast(s,'meteor_shower');s=choose(s,v=>v.at===6);s=restoreGame(JSON.parse(JSON.stringify(s)));s=choose(s,v=>v.at===12);s=choose(s,v=>v.at===19);s=choose(s,v=>v==='commit');assert.equal(damage(s,victim),7);
});
test('Burning Hands can choose opposite directions and clips the far edge',()=>{
 let s=state();const caster=add(s,'field_laborers',12,0),north=add(s,'wild_boars',7),south=add(s,'wild_boars',17),east=add(s,'wild_boars',13);
 s=cast(s,'burning_hands',caster.uid);s=choose(s,v=>v===0);s=choose(s,v=>v===2);assert.equal(damage(s,north),2);assert.equal(damage(s,south),2);assert.equal(damage(s,east),0);
});
test('Firebreathing westward rotation places the strong cell west and the weak cells around it',()=>{
 let s=state();const caster=add(s,'wild_boars',12,0),near=add(s,'wild_boars',11),upper=add(s,'wild_boars',6),lower=add(s,'wild_boars',16),far=add(s,'wild_boars',10);
 s=cast(s,'firebreathing',caster.uid);s=choose(s,v=>v===3);assert.equal(damage(s,near),4);assert.equal(damage(s,upper),1);assert.equal(damage(s,lower),1);assert.equal(damage(s,far),1);
});
test('Flame Strike eastward rotation preserves its asymmetric near and far rows',()=>{
 let s=state();s.units.find(u=>u.controller===0).at=6;const near=add(s,'wild_boars',7),upper=add(s,'wild_boars',3),far=add(s,'wild_boars',8),lower=add(s,'wild_boars',13);
 s=cast(s,'flame_strike');s=choose(s,v=>v===1);assert.equal(damage(s,near),3);assert.equal(damage(s,upper),1);assert.equal(damage(s,far),1);assert.equal(damage(s,lower),1);
});
test('Lava Flow eastward rotation affects its own origin and two forward sites only',()=>{
 let s=state();s.units.find(u=>u.controller===0).at=11;const origin=add(s,'wild_boars',11),near=add(s,'wild_boars',12),far=add(s,'wild_boars',13),behind=add(s,'wild_boars',10);
 s=cast(s,'lava_flow');s=choose(s,v=>v===1);assert.equal(damage(s,origin),5);assert.equal(damage(s,near),4);assert.equal(damage(s,far),2);assert.equal(damage(s,behind),0);
});
test('Holy Nova at a corner clips to four cells and preserves 3/2/1 damage',()=>{
 let s=state();s.units.find(u=>u.controller===0).at=0;const origin=add(s,'wild_boars',0),right=add(s,'wild_boars',1),down=add(s,'wild_boars',5),corner=add(s,'wild_boars',6),wrapped=add(s,'wild_boars',4);
 s=cast(s,'holy_nova');s=choose(s,v=>v.caster===true);assert.equal(damage(s,origin),3);assert.equal(damage(s,right),2);assert.equal(damage(s,down),2);assert.equal(damage(s,corner),1);assert.equal(damage(s,wrapped),0);
});
test('Wreathed target at an enemy warded site is removed and its dependent grid does not resolve',()=>{
 let s=state();s.board[6].ward=true;const center=add(s,'wild_boars',6),near=add(s,'wild_boars',7);
 s=cast(s,'wreathed_in_righteousness');s=choose(s,v=>v.at===6&&v.layer==='surface');assert.equal(s.board[6].ward,false);assert.equal(unit(s,center.uid).ward,false);assert.equal(damage(s,near),0);
});
test('Meteor Shower resolves the other two areas when Ward removes one chosen site',()=>{
 let s=state();s.board[6].ward=true;const first=add(s,'wild_boars',6),second=add(s,'wild_boars',12),third=add(s,'wild_boars',19);
 s=cast(s,'meteor_shower');s=choose(s,v=>v.at===6);s=choose(s,v=>v.at===12);s=choose(s,v=>v.at===19);s=choose(s,v=>v==='commit');
 assert.equal(s.board[6].ward,false);assert.equal(damage(s,first),0);assert.equal(damage(s,second),4);assert.equal(damage(s,third),3);
});
function activate(s,u){s=restoreGame(s);const action=legalActions(s).find(a=>a.type==='activate'&&a.unit===u.uid);assert.ok(action,'No activated ability for '+card(u.card).slug);return dispatch(s,action);}
test('Mester Stoor Worm taps and deals one Lethal damage in its four-cell cone to allies and enemies',()=>{
 let s=state();s.board[12].card=card('deep_sea').id;const worm=add(s,'mester_stoor_worm',12,0),near=add(s,'wild_boars',7),ally=add(s,'wild_boars',6,0),warded=add(s,'wild_boars',8,1,{ward:true}),far=add(s,'wild_boars',2),outside=add(s,'wild_boars',13);
 s=activate(s,worm);s=choose(s,v=>v===0);assert.equal(unit(s,worm.uid).tapped,true);assert.equal(damage(s,worm),0);assert.ok(!unit(s,near.uid));assert.ok(!unit(s,ally.uid));assert.ok(!unit(s,far.uid));assert.equal(damage(s,warded),0);assert.equal(unit(s,warded.uid).ward,false);assert.equal(damage(s,outside),0);
});
test('Mester Stoor Worm westward cone rotates, and Waterbound disables its ability on land',()=>{
 let s=state();const worm=add(s,'mester_stoor_worm',12,0);s=restoreGame(s);assert.ok(!legalActions(s).some(a=>a.type==='activate'&&a.unit===worm.uid));
 s.board[12].card=card('deep_sea').id;const near=add(s,'wild_boars',11),far=add(s,'wild_boars',10),upper=add(s,'wild_boars',6),lower=add(s,'wild_boars',16);
 s=activate(s,worm);s=choose(s,v=>v===3);for(const u of [near,far,upper,lower])assert.ok(!unit(s,u.uid));
});
test('Mester Stoor Worm underwater breath stays underwater and cannot damage surface or underground units',()=>{
 let s=state();for(const at of [12,7,6,8,2])s.board[at].card=card('deep_sea').id;
 const worm=add(s,'mester_stoor_worm',12,0,{layer:'below'}),underwater=add(s,'wild_boars',7,1,{layer:'below',mods:[{power:50},{keyword:'Submerge'}]}),surface=add(s,'wild_boars',7);
 s=activate(s,worm);s=choose(s,v=>v===0);assert.ok(!unit(s,underwater.uid));assert.equal(damage(s,surface),0);
});
test('Mester Stoor Worm cannot use its tap ability while summoning sick or silenced',()=>{
 let s=state();s.board[12].card=card('deep_sea').id;const worm=add(s,'mester_stoor_worm',12,0,{born:s.turn});s=restoreGame(s);assert.ok(!legalActions(s).some(a=>a.type==='activate'&&a.unit===worm.uid));
 unit(s,worm.uid).born=0;unit(s,worm.uid).mods.push({silenced:true});s=restoreGame(s);assert.ok(!legalActions(s).some(a=>a.type==='activate'&&a.unit===worm.uid));
});
test('Hellstar start trigger hits each other unit with verified 7/5/3 damage and spares itself',()=>{
 let s=state();s.active=1;const hell=add(s,'hellstar',12,0),center=add(s,'wild_boars',12),near=add(s,'wild_boars',7),corner=add(s,'wild_boars',6),below=add(s,'wild_boars',12,1,{layer:'below',mods:[{power:50},{keyword:'Burrowing'}]});
 s=restoreGame(s);s=dispatch(s,{type:'end',player:1});assert.equal(s.active,0);assert.equal(damage(s,hell),0);assert.equal(damage(s,center),7);assert.equal(damage(s,near),5);assert.equal(damage(s,corner),3);assert.equal(damage(s,below),0);
});
test('Hellstar cannot attack units or sites but can move; silence removes its attack prohibition',()=>{
 let s=state();const hell=add(s,'hellstar',12,0);add(s,'wild_boars',12);s.board[12].controller=1;s=restoreGame(s);
 assert.ok(!legalActions(s).some(a=>a.type==='attack'&&a.unit===hell.uid));assert.ok(legalActions(s).some(a=>a.type==='move'&&a.unit===hell.uid));
 unit(s,hell.uid).mods.push({silenced:true});s=restoreGame(s);assert.ok(legalActions(s).some(a=>a.type==='attack'&&a.unit===hell.uid));
});
test('Hellstar cannot join defense and a silenced Hellstar has no start damage trigger',()=>{
 let s=state();s.active=1;const hell=add(s,'hellstar',17,0),attacker=add(s,'brown_bears',12,1),victim=add(s,'wild_boars',12,0);s=restoreGame(s);
 const attack=legalActions(s,1).find(a=>a.type==='attack'&&a.unit===attacker.uid&&a.target===victim.uid&&a.at===12);assert.ok(attack);s=dispatch(s,attack);assert.ok(!legalActions(s,0).some(a=>a.type==='defend'&&a.unit===hell.uid));
 s=state();s.active=1;const silenced=add(s,'hellstar',12,0,{mods:[{power:50},{silenced:true}]}),other=add(s,'wild_boars',12);s=restoreGame(s);s=dispatch(s,{type:'end',player:1});assert.equal(damage(s,other),0);assert.equal(damage(s,silenced),0);
});
test('Day of Judgment only offers a complete six-square cross inside the realm, with all four rotations',()=>{
 const options=judgmentPlacements();assert.ok(options.length);assert.deepEqual([...new Set(options.map(o=>o.value.direction))].sort(),[0,1,2,3]);
 for(const {value} of options){const grid=placedGrid(value.at,gridPatterns.day_of_judgment,value.direction);assert.equal(grid.length,6);assert.ok(grid.every(c=>![0,4,15,19].includes(c.at)));}
});
test('Day of Judgment banishes Evil then damages the whole cross across surface, underground and void',()=>{
 let s=state();const evil=add(s,'bone_rabble',6),center=add(s,'wild_boars',6),below=add(s,'wild_boars',11,1,{layer:'below',mods:[{power:50},{keyword:'Burrowing'}]}),voidwalker=add(s,'wild_boars',16,1,{mods:[{power:50},{keyword:'Voidwalk'}]}),corner=add(s,'bone_rabble',0);s.board[16]=null;
 s=cast(s,'day_of_judgment');s=choose(s,v=>v.at===6&&v.direction===0);
 assert.ok(!unit(s,evil.uid));assert.ok(s.players[1].banished.includes(evil.card));assert.equal(damage(s,center),7);assert.equal(damage(s,below),3);assert.equal(damage(s,voidwalker),3);assert.ok(unit(s,corner.uid));
});
test('Day of Judgment rotated cross preserves asymmetric long arm and adds oversized square damage',()=>{
 let s=state();const giant=add(s,'mountain_giant',6,1,{size:2}),right=add(s,'wild_boars',8),farLeft=add(s,'wild_boars',5),outside=add(s,'wild_boars',9);
 s=cast(s,'day_of_judgment');s=choose(s,v=>v.at===7&&v.direction===1);assert.equal(damage(s,giant),13);assert.equal(damage(s,right),3);assert.equal(damage(s,farLeft),3);assert.equal(damage(s,outside),0);
});
test('Day of Judgment is untargeted: a site Ward stays, while a unit Ward prevents its damage',()=>{
 let s=state();s.board[6].ward=true;const victim=add(s,'wild_boars',6,1,{ward:true});s=cast(s,'day_of_judgment');s=choose(s,v=>v.at===6&&v.direction===0);
 assert.equal(s.board[6].ward,true);assert.equal(damage(s,victim),0);assert.equal(unit(s,victim.uid).ward,false);
});
test('Day of Judgment banishes an Evil damage-prevention provider before dealing its damage',()=>{
 let s=state();const protector=add(s,'shield_maidens',7,1,{mods:[{power:50},{types:['Demon']}]}),victim=add(s,'wild_boars',6);
 s=cast(s,'day_of_judgment');s=choose(s,v=>v.at===6&&v.direction===0);assert.ok(!unit(s,protector.uid));assert.equal(damage(s,victim),7);
});
test('Day of Judgment banishment does not fire an Evil minion Deathrite',()=>{
 let s=state();const doomed=add(s,'pookas',6,1,{mods:[{power:50},{types:['Demon']}]});const kept={uid:'h'+s.next++,card:card('wild_boars').id};s.players[0].hand.push(kept);
 s=cast(s,'day_of_judgment');s=choose(s,v=>v.at===6&&v.direction===0);assert.ok(!unit(s,doomed.uid));assert.ok(s.players[1].banished.includes(doomed.card));assert.ok(s.players[0].hand.some(h=>h.uid===kept.uid));
});
test('Mester Stoor Worm Lethal only kills when positive damage survives prevention',()=>{
 let s=state();s.board[12].card=card('deep_sea').id;const worm=add(s,'mester_stoor_worm',12,0),victim=add(s,'wild_boars',7),protector=add(s,'shield_maidens',13,1);
 s=activate(s,worm);s=choose(s,v=>v===0);assert.ok(unit(s,victim.uid));assert.equal(damage(s,victim),0);assert.equal(damage(s,protector),0);
});
test('Hellstar does not trigger at the start of its opponent turn',()=>{
 let s=state();const hell=add(s,'hellstar',12,0),victim=add(s,'wild_boars',12);s=restoreGame(s);s=dispatch(s,{type:'end',player:0});assert.equal(s.active,1);assert.equal(damage(s,victim),0);assert.equal(damage(s,hell),0);
});
function globe(s){s.artifacts.push({uid:'globe',card:card('magellan_globe').id,at:10,owner:0,controller:0,bearer:null});}
test('Magellan Globe lets Flame Strike span the upper edge with its printed damage cells',()=>{
 let s=state();s.units.find(u=>u.controller===0).at=0;globe(s);const near=add(s,'wild_boars',15),far=add(s,'wild_boars',10),left=add(s,'wild_boars',14);s=cast(s,'flame_strike');s=choose(s,v=>v===0);assert.equal(damage(s,near),3);assert.equal(damage(s,far),1);assert.equal(damage(s,left),1);
});
test('Magellan Globe lets Holy Nova damage all wrapped adjacent and diagonal locations',()=>{
 let s=state();s.units.find(u=>u.controller===0).at=0;globe(s);const corner=add(s,'wild_boars',19),left=add(s,'wild_boars',4),upper=add(s,'wild_boars',15);s=cast(s,'holy_nova');s=choose(s,v=>v.caster===true);assert.equal(damage(s,corner),1);assert.equal(damage(s,left),2);assert.equal(damage(s,upper),2);
});
test('Magellan Globe allows a whole Day of Judgment cross to span the edge and reach a corner',()=>{
 let s=state();globe(s);const corner=add(s,'wild_boars',0),longArm=add(s,'wild_boars',10);s=cast(s,'day_of_judgment');s=choose(s,v=>v.at===0&&v.direction===0);assert.equal(damage(s,corner),7);assert.equal(damage(s,longArm),3);
});

test('Burning Hands can be cast by a silenced Mortal through the spell permission and resolves its actual grid',()=>{
 let s=state();const mortal=add(s,'field_laborers',12,0,{mods:[{power:50},{silenced:true}]}),near=add(s,'wild_boars',7),far=add(s,'wild_boars',2);s=cast(s,'burning_hands',mortal.uid);s=choose(s,v=>v===0);s=choose(s,v=>v===1);assert.equal(damage(s,near),2);assert.equal(damage(s,far),1);assert.equal(damage(s,mortal),0);
});
test('Firebreathing can be cast by a silenced Beast through the spell permission and resolves its actual grid',()=>{
 let s=state();const beast=add(s,'wild_boars',12,0,{mods:[{power:50},{silenced:true}]}),near=add(s,'wild_boars',7),far=add(s,'wild_boars',2);s=cast(s,'firebreathing',beast.uid);s=choose(s,v=>v===0);assert.equal(damage(s,near),4);assert.equal(damage(s,far),1);assert.equal(damage(s,beast),0);
});
test('Burning Hands and Firebreathing retain positive caster qualifications after removing the redundant Silence gate',()=>{
 let s=state();const mage=add(s,'skeleton_mage',12,0,{mods:[{silenced:true}]}),mortal=add(s,'field_laborers',13,0,{mods:[{silenced:true}]}),beast=add(s,'wild_boars',14,0,{mods:[{silenced:true}]}),burn=hand(s,'burning_hands'),breath=hand(s,'firebreathing'),zap=hand(s,'zap');s=restoreGame(s);const acts=legalActions(s);
 assert.ok(!acts.some(a=>a.type==='cast'&&a.caster===mage.uid&&[burn.uid,breath.uid,zap.uid].includes(a.hand)));
 assert.ok(!acts.some(a=>a.type==='cast'&&a.caster===beast.uid&&a.hand===burn.uid));
 assert.ok(!acts.some(a=>a.type==='cast'&&a.caster===mortal.uid&&a.hand===breath.uid));
 assert.ok(!acts.some(a=>a.type==='cast'&&[mortal.uid,beast.uid].includes(a.caster)&&a.hand===zap.uid));
 assert.ok(acts.some(a=>a.type==='cast'&&a.caster===mortal.uid&&a.hand===burn.uid));assert.ok(acts.some(a=>a.type==='cast'&&a.caster===beast.uid&&a.hand===breath.uid));
});
