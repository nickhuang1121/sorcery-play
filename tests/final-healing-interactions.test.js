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



test('Fully Heal official Codex: real Lifewish supersedes River of Blood healing reduction for both Avatars',()=>{let s=state();s.board[0].card=card('river_of_blood').id;s.players[0].life=3;s.players[1].life=1;const h={uid:'lifehand',card:card('lifewish').id};s.players[0].hand.push(h);s=restoreGame(s);const a=legalActions(s,0).find(a=>a.type==='cast'&&a.hand===h.uid);assert.ok(a);s=dispatch(s,a);assert.equal(s.players[0].life,s.players[0].maxLife);assert.equal(s.players[1].life,s.players[1].maxLife);});
test('Fully Heal official Codex: Gilded Aegis replacement removes all minion damage even under River of Blood',()=>{let s=state();s.board[0].card=card('river_of_blood').id;const u=add(s,'brown_bears',6,0,{damage:1});s.artifacts.push({uid:'aegis',card:card('gilded_aegis').id,owner:0,controller:0,bearer:u.uid,at:6,layer:'surface'});s=restoreGame(s);s=effect(s,{op:'destroy'},{entity:'unit',uid:u.uid},'fatality');assert.ok(unit(s,u.uid));assert.equal(unit(s,u.uid).damage,0);assert.equal(s.artifacts.some(a=>a.uid==='aegis'),false);assert.ok(s.players[0].banished.includes(card('gilded_aegis').id));});
