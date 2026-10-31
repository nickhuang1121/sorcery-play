import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {install,card,starter} from '../src/cards.js';
import {newGame,dispatch,legalActions,unit,restoreGame} from '../src/engine.js';
install(JSON.parse(fs.readFileSync(new URL('../data/official-cards.json',import.meta.url))));
function game(){const s=newGame([starter(),starter()],42,'local');s.turn=5;s.active=0;s.phase='main';s.artifacts=[];s.auras=[];s.storyline=[];s.choice=null;s.units.forEach(u=>{u.born=0;u.tapped=false;});s.board=Array.from({length:20},(_,at)=>({uid:'fixture'+at,card:card('valley').id,owner:at<10?1:0,controller:at<10?1:0}));for(const pl of s.players){pl.hand=[];pl.bonusMana=30;pl.bonusAffinity={air:10,earth:10,fire:10,water:10};pl.turnsTaken=3;pl.finalHasPlayedSite=true;}return s;}
function add(s,slug,at=13,p=1,extra={}){const u={uid:'u'+s.next++,card:card(slug).id,at,owner:p,controller:p,born:0,damage:0,mods:[],tapped:false,...extra};s.units.push(u);return u;}
function orb(s,at=12,p=1,extra={}){const o={uid:'orb'+s.next++,card:card('orb_of_baal_berith').id,at,owner:p,controller:p,bearer:null,layer:'surface',...extra};s.artifacts.push(o);return o;}
function choose(s,fn){assert.ok(s.choice,'Expected choice');const index=s.choice.options.findIndex(o=>fn(o.value));assert.ok(index>=0,JSON.stringify(s.choice));return dispatch(s,{type:'choose',player:s.choice.player,option:index});}
function cast(s,slug,target){const h={uid:'hand'+s.next++,card:card(slug).id};s.players[0].hand.push(h);const a=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid&&(target===undefined||a.target===target));assert.ok(a,'No legal '+slug+' target '+target);return dispatch(s,a);}
function settle(s){let n=0;while(s.choice){assert.ok(n++<100);s=choose(s,v=>v==='keep'||s.choice.options[0].value===v);}return s;}
function nextMain(s){return s.phase==='draw'?dispatch(s,legalActions(s).find(a=>a.type==='draw'&&a.deck==='spells')):s;}

test('Orb: enemy-owned Orb copies nearby Magic for original controller, pays once and banishes a token after resolution',()=>{
 let s=game();const o=orb(s),target=add(s,'brown_bears');s=cast(s,'zap',target.uid);assert.equal(s.choice.frame.step.op,'finalOrbChoice');assert.equal(s.choice.player,0);assert.equal(s.players[0].spent,1);s=choose(s,v=>v==='keep');assert.equal(unit(s,target.uid).damage,2);assert.equal(s.players[0].spent,1);assert.equal(s.finalOrbCopies[0].player,0);assert.equal(s.finalOrbCopies[0].orb,o.uid);assert.equal(s.finalOrbCopies[0].status,'resolved');assert.equal(s.players[0].cemetery.filter(id=>id===card('zap').id).length,1);assert.equal(s.players[0].banished.filter(id=>card(id).category==='Token'&&card(id).type==='Magic').length,1);assert.equal(s.units[0].castCount,1,'Creating the paid spell copy is not another original casting');
});
test('Orb: controller may choose a different legal target from Orb origin and preserve the original target independently',()=>{
 let s=game();orb(s);const a=add(s,'brown_bears',13),b=add(s,'brown_bears',11);s=cast(s,'zap',a.uid);s=choose(s,v=>v==='new');s=choose(s,v=>v===b.uid||v?.uid===b.uid);assert.equal(unit(s,a.uid).damage,1);assert.equal(unit(s,b.uid).damage,1);assert.equal(s.players[0].spent,1);
});
test('Orb: first Magic is shared across both controllers each turn and resets on a later turn',()=>{
 let s=game();s.board[17].card=card('dark_tower').id;orb(s);const target=add(s,'brown_bears');s=cast(s,'zap',target.uid);s=choose(s,v=>v==='keep');s=cast(s,'zap',target.uid);assert.equal(s.choice,null);assert.equal(unit(s,target.uid).damage,3);assert.equal(s.finalOrbCopies.length,1);
 s=dispatch(s,{type:'end',player:0});s=nextMain(s);s=dispatch(s,{type:'end',player:1});s=nextMain(s);s=cast(s,'zap',target.uid);s=choose(s,v=>v==='keep');assert.equal(s.finalOrbCopies.length,2);assert.equal(unit(s,target.uid).damage,2);
});
test('Orb: distant, silenced, disabled and other-region Orbs do not copy Magic',()=>{
 for(const extra of [{at:0},{silenced:true},{disabled:true},{layer:'below'}]){let s=game();orb(s,extra.at??12,1,extra);const target=add(s,'brown_bears');s=cast(s,'zap',target.uid);assert.equal(s.choice,null);assert.equal(unit(s,target.uid).damage,1);assert.equal((s.finalOrbCopies||[]).length,0);}
});
test('Orb: X is fixed after original payment, projectiles originate at Orb, and no X or extra payment is requested for copy',()=>{
 let s=game();orb(s,16);const target=add(s,'brown_bears',18);s=cast(s,'arcane_barrage');s=choose(s,v=>v===2);s=choose(s,v=>v===2);assert.equal(s.choice.frame.step.op,'finalOrbChoice');assert.equal(s.finalOrbCopies[0].x,2);assert.equal(s.players[0].spent,2);assert.deepEqual(s.choice.options.map(o=>o.value),['keep']);s=choose(s,v=>v==='keep');assert.equal(s.players[0].spent,2);assert.equal(s.players[0].life,18,'Orb at 16 shoots east into Avatar at 17');assert.equal(unit(s,target.uid).damage,2,'Original Avatar at 17 shoots east into target at 18');
});
test('Orb: Craterize additional discarded Site is paid only once and second spell fizzles after first destroys same Site',()=>{
 let s=game();orb(s);const discard={uid:'discard-site',card:card('the_base_of_babel').id};s.players[0].hand.push(discard);s=cast(s,'craterize');s=choose(s,v=>v?.at===13);assert.equal(s.choice.frame.step.op,'craterDiscard');s=choose(s,v=>v?.uid===discard.uid);assert.equal(s.choice.frame.step.op,'finalOrbChoice');const spent=s.players[0].spent;s=choose(s,v=>v==='keep');assert.equal(card(s.board[13].card).slug,'rubble');assert.equal(s.players[0].cemetery.filter(id=>id===discard.card).length,1);assert.equal(s.players[0].spent,spent);assert.equal(s.players[0].life,16,'One Craterize grid contributes 4 at Avatar 17, not two grids');
});
test('Orb: two nearby Orbs each copy original once but copied Magic does not recursively trigger a second cast',()=>{
 let s=game();orb(s,12,0);orb(s,18,1);const target=add(s,'brown_bears',13);s=cast(s,'zap',target.uid);s=settle(s);assert.equal(s.finalOrbCopies.length,2);assert.equal(s.finalOrbCopies.filter(c=>c.status==='resolved').length,2);assert.equal(unit(s,target.uid).damage,3);assert.equal(s.players[0].spent,1);
});
test('Orb: a suspended copy choice survives JSON restore with paid costs, original spell and token identity intact',()=>{
 let s=game();orb(s);const target=add(s,'brown_bears');s=cast(s,'zap',target.uid);s=restoreGame(JSON.parse(JSON.stringify(s)));s=choose(s,v=>v==='keep');assert.equal(unit(s,target.uid).damage,2);assert.equal(s.players[0].spent,1);assert.equal(s.players[0].banished.some(id=>card(id).category==='Token'),true);
});
test('Orb: retargeting Swap declares both new targets without losing the original paid pair',()=>{
 let s=game();orb(s);const a=add(s,'wild_boars',11),b=add(s,'brown_bears',12),c=add(s,'wild_boars',13),d=add(s,'brown_bears',14);s=cast(s,'swap');s=choose(s,v=>v?.uid===a.uid);s=choose(s,v=>v?.uid===b.uid);const paid=s.players[0].spent;s=choose(s,v=>v==='new');s=choose(s,v=>v?.uid===c.uid);s=choose(s,v=>v?.uid===d.uid);assert.equal(unit(s,a.uid).at,12);assert.equal(unit(s,b.uid).at,11);assert.equal(unit(s,c.uid).at,14);assert.equal(unit(s,d.uid).at,13);assert.equal(s.players[0].spent,paid);
});
test('Orb: Chain Lightning keeps its paid target count but permits a new complete chain at no added cost',()=>{
 let s=game();orb(s);const a=add(s,'brown_bears',12),b=add(s,'brown_bears',13),c=add(s,'brown_bears',11),d=add(s,'brown_bears',10);s=cast(s,'chain_lightning');s=choose(s,v=>v?.uid===a.uid);s=choose(s,v=>v?.uid===b.uid);s=choose(s,v=>v==='commit');const paid=s.players[0].spent;s=choose(s,v=>v==='new');s=choose(s,v=>v?.uid===c.uid);s=choose(s,v=>v?.uid===d.uid);for(const u of [a,b,c,d])assert.equal(unit(s,u.uid).damage,2);assert.equal(s.players[0].spent,paid);assert.equal(s.finalOrbCopies[0].action.chainTargets.length,2);
});
test('Orb: copied and original cemetery effects get independent Bureau permissions and preserve paid copy scope through save',()=>{
 let s=game();orb(s);s.board[5]={uid:'bureau',card:card('bureau_of_occult_control').id,owner:1,controller:1};s.players[0].cemetery.push(card('wild_boars').id,card('brown_bears').id);s=cast(s,'raise_dead');const paid=s.players[0].spent;assert.equal(s.choice.frame.step.op,'zoneAccessOffer');s=choose(s,v=>v===true);s=restoreGame(JSON.parse(JSON.stringify(s)));assert.equal(s.players[0].spent,paid+2);s=choose(s,v=>v==='keep');s=choose(s,v=>v?.at===13);assert.equal(s.choice.frame.step.op,'zoneAccessOffer');assert.equal(s.players[0].spent,paid+2);s=choose(s,v=>v===true);s=choose(s,v=>v?.at===13);s=settle(s);assert.equal(s.players[0].spent,paid+4);assert.equal(s.players[0].cemetery.filter(id=>[card('wild_boars').id,card('brown_bears').id].includes(id)).length,0);assert.equal(s.units.filter(u=>[card('wild_boars').id,card('brown_bears').id].includes(u.card)).length,2);
});
