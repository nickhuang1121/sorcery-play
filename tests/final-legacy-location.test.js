import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {install,card,starter} from '../src/cards.js';
import {newGame,restoreGame,dispatch,unit,observation,power,legalActions,resources} from '../src/engine.js';
install(JSON.parse(fs.readFileSync(new URL('../data/official-cards.json',import.meta.url))));
function state(){let s=newGame([starter(),starter()],42,'local');s.phase='main';s.active=0;s.turn=4;s.choice=null;s.storyline=[];s.pending=null;s.artifacts=[];s.auras=[];s.board=Array.from({length:20},(_,i)=>({uid:'s'+i,card:card('valley').id,owner:i<10?1:0,controller:i<10?1:0}));for(const u of s.units){u.born=0;u.justEntered=false;u.mods=[];}for(const p of s.players){p.spent=0;p.bonusMana=30;p.bonusAffinity={air:10,earth:10,fire:10,water:10};}return restoreGame(s);}
function add(s,slug,at,p=0,extra={}){const u={uid:'d'+s.next++,card:card(slug).id,owner:p,controller:p,at,layer:'surface',born:0,mods:[],tapped:false,damage:0,ward:false,justEntered:false,...extra};s.units.push(u);return u;}
function effect(s,step,target,effectSlug='zap'){const source=s.units[0];s.choice={player:0,title:'effect',options:[{label:'resolve',value:target}],frame:{source:structuredClone(source),controller:0,effectCard:card(effectSlug).id,step}};return dispatch(s,{type:'choose',player:0,option:0});}
function choose(s,predicate){assert.ok(s.choice);const option=s.choice.options.findIndex(o=>predicate(o.value,o));assert.ok(option>=0,'Expected replacement option');return dispatch(s,{type:'choose',player:s.choice.player,option});}



function magic(s,slug,filter){const h={uid:'legacy'+s.next++,card:card(slug).id};s.players[0].hand.push(h);s=restoreGame(s);const a=legalActions(s,0).find(a=>a.type==='cast'&&a.hand===h.uid&&filter(a));assert.ok(a,'Expected legal real Magic cast');return dispatch(s,a);}
test('Minor Explosion hits a non-anchor occupied surface location but not a subsurface unit at the same square',()=>{let s=state();const mage=add(s,'merlin',6,1,{size:2}),below=add(s,'brown_bears',12,1,{layer:'below',mods:[{keyword:'Burrowing'}]});s=magic(s,'minor_explosion',a=>a.target===12);assert.equal(unit(s,mage.uid),undefined);assert.equal(unit(s,below.uid).damage,0);});
test('Lightning Bolt random pool uses physical location and casting layer, including oversized parts',()=>{let s=state();const mage=add(s,'merlin',6,1,{size:2}),below=add(s,'brown_bears',12,1,{layer:'below',mods:[{keyword:'Burrowing'}]});s=magic(s,'lightning_bolt',a=>a.target===12);assert.equal(unit(s,mage.uid),undefined);assert.equal(unit(s,below.uid).damage,0);});
test('Legacy Zap target legality uses the casting minions actual subsurface region',()=>{let s=state();const caster=add(s,'merlin',17,0,{layer:'below',mods:[{keyword:'Burrowing'}]}),surface=add(s,'brown_bears',12,1),below=add(s,'brown_bears',12,1,{layer:'below',mods:[{keyword:'Burrowing'}]});const h={uid:'plane-zap',card:card('zap').id};s.players[0].hand.push(h);s=restoreGame(s);const casts=legalActions(s,0).filter(a=>a.type==='cast'&&a.hand===h.uid&&a.caster===caster.uid);assert.ok(casts.some(a=>a.target===below.uid));assert.ok(!casts.some(a=>a.target===surface.uid));s=dispatch(s,casts.find(a=>a.target===below.uid));assert.equal(unit(s,below.uid).damage,1);assert.equal(unit(s,surface.uid).damage,0);});
