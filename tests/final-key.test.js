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

function key(s,u,extra={}){const a={uid:'key'+s.next++,card:card('key_to_the_city').id,bearer:u.uid,at:u.at,owner:u.owner,controller:u.controller,...extra};s.artifacts.push(a);return a;}
test('Key foundation: Site passage damage and immediate destruction are ignored, Magic damage remains',()=>{
 let s=game();const u=add(s,'brown_bears');key(s,u);const src=put(s,'briar_patch',12,1);
 s=effect(s,src,{op:'sitePassage',uid:u.uid,damage:2,destroy:true},true);assert.ok(unit(s,u.uid));assert.equal(unit(s,u.uid).damage,0);
 const caster=s.units.find(v=>card(v.card).type==='Avatar'&&v.controller===1);s=effect(s,caster,{op:'damage',amount:1,select:{kind:'unit'}},{entity:'unit',uid:u.uid});assert.equal(unit(s,u.uid).damage,1);
});
test('Key foundation: site life loss uses actual Site origin despite overridden effectCard and survives restore',()=>{
 let s=game();const av=s.units.find(v=>v.controller===0&&card(v.card).type==='Avatar');key(s,av);const src=put(s,'mobbed_court',12,1);
 s.choice={player:1,title:'Site cast loss',options:[{label:'Run',value:true}],frame:{source:src,controller:1,effectCard:card('zap').id,abilityOrigin:src.card,step:{op:'castLifeLoss',player:0,amount:2}}};
 s=restoreGame(JSON.parse(JSON.stringify(s)));s=dispatch(s,{type:'choose',player:1,option:0});assert.equal(s.players[0].life,20);
});
test('Key foundation: silencing or losing the artifact removes protection, silencing bearer does not silence independent equipment',()=>{
 for(const mode of ['silentKey','detached','silentBearer']){let s=game();const u=add(s,'brown_bears'),a=key(s,u);if(mode==='silentKey')a.silenced=true;if(mode==='detached')a.bearer=null;if(mode==='silentBearer')u.mods.push({silenced:true});const src=put(s,'briar_patch',12,1);s=effect(s,src,{op:'sitePassage',uid:u.uid,damage:1},true);assert.equal(unit(s,u.uid).damage,mode==='silentBearer'?0:1,mode);}
});
test('Key foundation: movement ignores a Site power limit while ordinary minions remain blocked',()=>{
 let s=game();const u=add(s,'brown_bears',12);put(s,'gnome_hollows',13,0);
 assert.equal(legalActions(s).some(a=>a.type==='move'&&a.unit===u.uid&&a.at===13),false);
 key(s,u);const move=legalActions(s).find(a=>a.type==='move'&&a.unit===u.uid&&a.at===13);assert.ok(move);s=dispatch(s,move);assert.equal(unit(s,u.uid).at,13);
});
test('Key foundation: River of Blood does not halve protected Avatar healing but still halves other healing',()=>{
 for(const protectedBearer of [false,true]){let s=game();const av=s.units.find(v=>v.controller===0&&card(v.card).type==='Avatar');s.players[0].life=10;if(protectedBearer)key(s,av);put(s,'river_of_blood',12,1);const src=add(s,'brown_bears',13);s=effect(s,src,{op:'heal',amount:4},true);assert.equal(s.players[0].life,protectedBearer?14:12);}
});
test('Key foundation: continuous Site grants are ignored alongside harmful grants, while other minions retain them',()=>{
 let s=game();const u=add(s,'brown_bears',12),v=add(s,'brown_bears',13);key(s,u);put(s,'standing_stones',12);put(s,'standing_stones',13);s=effect(s,s.units[0],{op:'drawOne',deck:'spells'},true);
 assert.equal(unit(s,u.uid).grantedKeywords.includes('Spellcaster'),false);assert.equal(unit(s,v.uid).grantedKeywords.includes('Spellcaster'),true);
});
test('Key foundation: Bower transformation ignores protected Mortal and still transforms other Mortals',()=>{
 let s=game();const u=add(s,'foot_soldier',12),v=add(s,'foot_soldier',13);key(s,u);put(s,'bower_of_bliss',4,1);s=effect(s,s.units[0],{op:'drawOne',deck:'spells'},true);
 assert.equal(unit(s,u.uid).completionBower,false);assert.equal(unit(s,v.uid).completionBower,true);assert.equal(unit(s,u.uid).silenced,false);
});
test('Key foundation: Dome attack restriction is ignored only for protected attacking bearer',()=>{
 let s=game();const u=add(s,'brown_bears',12),enemy=add(s,'brown_bears',13,1);put(s,'dome_of_osiros',13,1);
 assert.equal(legalActions(s).some(a=>a.type==='attack'&&a.unit===u.uid&&a.target===enemy.uid),false);key(s,u);
 assert.ok(legalActions(s).some(a=>a.type==='attack'&&a.unit===u.uid&&a.target===enemy.uid));
});
test('Key foundation: Mudslide moves other occupants but cannot move the protected bearer',()=>{
 let s=game();const u=add(s,'brown_bears',12),v=add(s,'brown_bears',7);key(s,u);const src=put(s,'mudslide',17);s=effect(s,src,{op:'finalMudslide'},1);
 assert.equal(unit(s,u.uid).at,12);assert.equal(unit(s,v.uid).at,8);
});
test('Key foundation: Orpheus still summons but does not modify the protected Avatar Death Door status',()=>{
 let s=game();const av=s.units.find(u=>u.controller===0&&card(u.card).type==='Avatar');key(s,av);const src=put(s,'orpheus_crossing',12);s.players[0].cemetery.push(card('brown_bears').id);s=effect(s,src,{op:'finalOrpheus'},true);assert.equal(s.players[0].doorTurn,null);assert.equal(s.finalOrpheusDoors?.[0],undefined);assert.ok(s.choice,'The independent resurrection remains available');
});
test('Key foundation: persistent Site terrain records retain origin after save and ignore protected bearer',()=>{
 let s=game();const u=add(s,'brown_bears',12),v=add(s,'brown_bears',13);key(s,u);const src=put(s,'quagmire',12);s=effect(s,src,{op:'terrainEffect',nearby:true,keyword:'Immobile',allLayers:true},true);
 assert.equal(s.ongoingEffects.at(-1).abilityOrigin,src.card);assert.equal(unit(s,u.uid).grantedKeywords.includes('Immobile'),false);assert.equal(unit(s,v.uid).grantedKeywords.includes('Immobile'),true);
 s=restoreGame(JSON.parse(JSON.stringify(s)));s=effect(s,s.units[0],{op:'drawOne',deck:'spells'},true);assert.equal(unit(s,u.uid).grantedKeywords.includes('Immobile'),false);
});
test('Key foundation: Thin Ice counts all power but moves only unprotected minions',()=>{
 let s=game();const u=add(s,'brown_bears',12),v=add(s,'brown_bears',12);key(s,u);v.mods.push({keyword:'Submerge'});const src=put(s,'thin_ice',12);s=effect(s,src,{op:'thinIce'},true);assert.equal(unit(s,u.uid).layer||'surface','surface');assert.equal(unit(s,v.uid).layer,'below');
});
test('Key foundation: a Site event at The Void still permits game-rule banishing, without creating a death or deathrite',()=>{
 let s=game();const u=add(s,'brown_bears',12);key(s,u);const src=put(s,'the_void',12,1);const before=(s.deathHistory||[]).length;
 s=effect(s,src,{op:'drawOne',deck:'spells'},true);assert.equal(unit(s,u.uid),undefined);assert.ok(s.players[0].banished.includes(card('brown_bears').id));assert.equal((s.deathHistory||[]).length,before);assert.equal(s.players[0].cemetery.includes(card('brown_bears').id),false);
});
test('Key foundation: Temple sacrifice cost remains payable with the protected minion and still produces a death',()=>{
 let s=game();const u=add(s,'brown_bears',12);key(s,u);put(s,'temple_of_moloch',12);const action=legalActions(s).find(a=>a.type==='activateSite'&&a.at===12);assert.ok(action);const mana=s.players[0].bonusMana;s=dispatch(s,action);s=choose(s,v=>v?.uid===u.uid);s=settle(s);assert.equal(unit(s,u.uid),undefined);assert.equal(s.players[0].bonusMana,mana+2);assert.ok(s.players[0].cemetery.includes(card('brown_bears').id));assert.ok((s.deathHistory||[]).some(d=>d.uid===u.uid));
});
test('Key foundation: Planar Gate benefits are ignored while the same unprotected minion may step into void',()=>{
 for(const protectedBearer of [false,true]){const s=game(),u=add(s,'brown_bears',12);put(s,'planar_gate',12);s.board[13]=null;if(protectedBearer)key(s,u);assert.equal(legalActions(s).some(a=>a.type==='move'&&a.unit===u.uid&&a.at===13),!protectedBearer);}
});
test('Key foundation: each live carried Key provides one mana to its current bearer controller, and silence/drop removes it',()=>{
 let s=game();const u=add(s,'brown_bears',12),before=resources(s,0).mana,keyA=key(s,u),keyB=key(s,u);s=effect(s,s.units[0],{op:'drawOne',deck:'spells'},true);assert.equal(resources(s,0).mana,before+2);
 s.artifacts.find(a=>a.uid===keyA.uid).silenced=true;s=effect(s,s.units[0],{op:'drawOne',deck:'spells'},true);assert.equal(resources(s,0).mana,before+1);
 const enemyBefore=resources(s,1).mana;unit(s,u.uid).controller=1;s=effect(s,s.units[0],{op:'drawOne',deck:'spells'},true);assert.equal(resources(s,0).mana,before);assert.equal(resources(s,1).mana,enemyBefore+1);
 s.artifacts.find(a=>a.uid===keyB.uid).bearer=null;s=effect(s,s.units[0],{op:'drawOne',deck:'spells'},true);assert.equal(resources(s,1).mana,enemyBefore);
});
test('Key foundation: Magic actually cast by a Site Spellcaster remains Magic and can damage the protected bearer',()=>{
 let s=game();const u=add(s,'brown_bears',13);key(s,u);put(s,'river_of_flame',12);const h={uid:'siteMagic',card:card('minor_explosion').id};s.players[0].hand.push(h);
 const actions=legalActions(s).filter(a=>a.type==='cast'&&a.hand===h.uid&&a.caster==='site:12');assert.ok(actions.length,'River of Flame is a legal Fire spellcaster');
 const action=actions.find(a=>a.target===13||a.target?.at===13)||actions[0];s=dispatch(s,action);
 if(s.choice)s=choose(s,v=>v?.at===13||v===13);s=settle(s);assert.equal(unit(s,u.uid).damage,3,'A Site caster does not change its Magic spell into a Site ability');
});
test('Key Site carry: activating Cloud City moves the Site and ordinary occupant but leaves the protected Voidwalk bearer at its old location',()=>{
 let s=game();const bearer=add(s,'brown_bears',12,0,{mods:[{keyword:'Voidwalk'}]}),other=add(s,'brown_bears',12);key(s,bearer);put(s,'cloud_city',12);s.board[13]=null;const action=legalActions(s).find(a=>a.type==='activateSite'&&a.at===12);assert.ok(action);s=dispatch(s,action);s=choose(s,v=>v?.at===13);s=settle(s);assert.equal(card(s.board[13].card).slug,'cloud_city');assert.equal(s.board[12],null);assert.equal(unit(s,bearer.uid).at,12);assert.equal(unit(s,other.uid).at,13);
});
test('Key Site carry: activating Baba Yaga swaps Sites and carries ordinary occupants while the protected bearer stays',()=>{
 let s=game();const bearer=add(s,'brown_bears',12),other=add(s,'brown_bears',12);key(s,bearer);put(s,'baba_yagas_hut',12);const action=legalActions(s).find(a=>a.type==='activateSite'&&a.at===12);assert.ok(action);s=dispatch(s,action);s=choose(s,v=>v?.at===18);s=settle(s);assert.equal(card(s.board[18].card).slug,'baba_yagas_hut');assert.equal(unit(s,bearer.uid).at,12);assert.equal(unit(s,other.uid).at,18);
});
test('Key Site carry: a Magic-origin Site exchange still carries the protected bearer because the source is Magic',()=>{
 let s=game();const bearer=add(s,'brown_bears',12);key(s,bearer);const av=s.units.find(u=>u.controller===0&&card(u.card).type==='Avatar');s=effect(s,{...av,at:12,card:card('earthquake').id},{op:'swapSites'},{at:18});assert.equal(unit(s,bearer.uid).at,18);
});
test('Key registered card: actual hand cast pays its printed cost, equips the chosen bearer, provides mana and ignores Site damage',()=>{
 let s=game();const bearer=add(s,'brown_bears',12);assert.equal(card('key_to_the_city').playable,true);const h={uid:'actualKeyHand',card:card('key_to_the_city').id};s.players[0].hand.push(h);const before=resources(s,0).mana,spent=s.players[0].spent||0;
 const action=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid&&a.bearer===bearer.uid);assert.ok(action,'The registered Key is genuinely castable from hand onto a bearer');s=dispatch(s,action);s=settle(s);assert.equal(s.players[0].spent,spent+card('key_to_the_city').cost);assert.equal(s.players[0].hand.some(c=>c.uid===h.uid),false);assert.ok(s.artifacts.some(a=>card(a.card).slug==='key_to_the_city'&&a.bearer===bearer.uid));assert.equal(resources(s,0).mana,before+1);
 s=effect(s,put(s,'briar_patch',12,1),{op:'sitePassage',uid:bearer.uid,damage:1},true);assert.equal(unit(s,bearer.uid).damage,0);
});
test('Key and unmodifiable bearers: the player still receives provided mana but Monks and Tabula bearers cannot gain Site protection',()=>{
 for(const mode of ['monks','tabula']){let s=game();const bearer=add(s,mode==='monks'?'monks_of_kobalsa':'brown_bears',12);const src=put(s,'briar_patch',12,1),before=resources(s,0).mana;key(s,bearer);if(mode==='tabula')s.artifacts.push({uid:'actualTabula',card:card('tabula_rasa').id,bearer:bearer.uid,at:12,owner:0,controller:0});s=effect(s,src,{op:'sitePassage',uid:bearer.uid,damage:1},true);assert.equal(unit(s,bearer.uid).damage,1,mode);assert.equal(resources(s,0).mana,before+1,mode);}
});
