import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {install,card,starter,hasElement} from '../src/cards.js';
import {newGame,restoreGame,dispatch,unit,observation,power,legalActions,resources} from '../src/engine.js';
install(JSON.parse(fs.readFileSync(new URL('../data/official-cards.json',import.meta.url))));
function state(){let s=newGame([starter(),starter()],42,'local');s.phase='main';s.active=0;s.turn=4;s.choice=null;s.storyline=[];s.pending=null;s.artifacts=[];s.auras=[];s.board=Array.from({length:20},(_,i)=>({uid:'s'+i,card:card('valley').id,owner:i<10?1:0,controller:i<10?1:0}));for(const u of s.units){u.born=0;u.justEntered=false;u.mods=[];}for(const p of s.players){p.spent=0;p.bonusMana=30;p.bonusAffinity={air:10,earth:10,fire:10,water:10};}return restoreGame(s);}
function add(s,slug,at,p=0,extra={}){const u={uid:'d'+s.next++,card:card(slug).id,owner:p,controller:p,at,layer:'surface',born:0,mods:[],tapped:false,damage:0,ward:false,justEntered:false,...extra};s.units.push(u);return u;}
function effect(s,step,target,effectSlug='zap'){const source=s.units[0];s.choice={player:0,title:'effect',options:[{label:'resolve',value:target}],frame:{source:structuredClone(source),controller:0,effectCard:card(effectSlug).id,step}};return dispatch(s,{type:'choose',player:0,option:0});}
function choose(s,predicate){assert.ok(s.choice);const option=s.choice.options.findIndex(o=>predicate(o.value,o));assert.ok(option>=0,'Expected replacement option');return dispatch(s,{type:'choose',player:s.choice.player,option});}



test('Official Skeleton Codex runtime normalization preserves uncastable Token and provides Ordinary Undead Air identity',()=>{const c=card('skeleton');assert.equal(c.category,'Token');assert.equal(c.playable,false);assert.equal(c.rarity,'Ordinary');assert.equal(c.attack,1);assert.ok(c.subtypes.includes('Undead'));assert.ok(c.umbrellas.includes('Evil'));assert.equal(hasElement(c,'air'),true);assert.equal(c.air,0,'Do not invent a casting threshold for an uncastable token');});
test('Official Skeleton Undead identity receives actual nearby Death Knight power while preserving its no-defend movement rule',()=>{let s=state();const skeleton=add(s,'skeleton',6),knight=add(s,'death_knight',7);s=restoreGame(s);assert.equal(power(unit(s,skeleton.uid)),2);assert.ok(card(skeleton.card).rules.includes('defend'));s.units.find(u=>u.uid===knight.uid).mods.push({silenced:true});s=restoreGame(s);assert.equal(power(unit(s,skeleton.uid)),1);});
