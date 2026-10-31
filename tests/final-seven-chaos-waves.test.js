import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {install,card,starter} from '../src/cards.js';
import {newGame,dispatch,legalActions,unit,restoreGame} from '../src/engine.js';
import {waterSite} from '../src/geography.js';
import {definitions} from '../src/definitions.js';
import {finalWaveDefinitions,experimentalFinalWaveDefinitions} from '../src/final-waves.js';
import {geometryLocationRecords} from '../src/final-geometry.js';
// Every card effect below uses the production registry; no definition injection.
install(JSON.parse(fs.readFileSync(new URL('../data/official-cards.json',import.meta.url))));
function state(){const s=newGame([starter(),starter()],42,'local');s.phase='main';s.active=0;s.turn=4;s.artifacts=[];s.auras=[];s.storyline=[];s.units.forEach(u=>{u.at=u.controller===0?10:2;u.born=0;u.tapped=false;});s.board=s.board.map((_,at)=>({uid:'s'+s.next++,card:card('valley').id,owner:at<10?1:0,controller:at<10?1:0}));for(const p of s.players){p.hand=[];p.bonusMana=30;p.bonusAffinity={air:10,earth:10,fire:10,water:10};}return s;}
function add(s,slug,at=12,p=0,extra={}){const u={uid:'u'+s.next++,card:card(slug).id,at,owner:p,controller:p,tapped:false,born:0,damage:0,mods:[],...extra};s.units.push(u);return u;}
function choose(s,predicate){assert.ok(s.choice,'Expected choice');const index=s.choice.options.findIndex(o=>predicate(o.value,o));assert.notEqual(index,-1,JSON.stringify(s.choice.options));return dispatch(s,{type:'choose',player:s.choice.player,option:index});}
function cast(s,slug){const h={uid:'h'+s.next++,card:card(slug).id};s.players[0].hand.push(h);const action=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid);assert.ok(action,'No legal cast '+slug);return dispatch(s,action);}
const snow=s=>choose(cast(s,'snowball'),v=>v===2);
test('Chaoswish actual copy target choices identify same-name units by location and controller instead of internal IDs',()=>{
 let s=state();add(s,'black_cat',0,1);const enemy=add(s,'brown_bears',13,1),ally=add(s,'brown_bears',11,0),wizard=add(s,'apprentice_wizard',12);
 s=cast(s,'chaoswish');s=choose(s,v=>v?.uid===wizard.uid);s=choose(s,(v,o)=>o.label.endsWith('：'+card('zap').name));
 const e=s.choice.options.find(o=>o.value.target===enemy.uid),a=s.choice.options.find(o=>o.value.target===ally.uid);assert.ok(e&&a);assert.match(e.label,/Brown Bears.*D2.*玩家 2/);assert.match(a.label,/Brown Bears.*B2.*玩家 1/);assert.ok(!e.label.includes('"'+enemy.uid+'"'));assert.notEqual(e.label,a.label);
 s=choose(restoreGame(JSON.parse(JSON.stringify(s))),v=>v.target===enemy.uid);assert.equal(unit(s,enemy.uid).damage,1);assert.equal(unit(s,ally.uid).damage,0);
});
function wave(s,at=10,direction=1){s=cast(s,'wave_of_eviction');s=choose(s,v=>v?.at===at);return choose(s,v=>v===direction);}

test('Snowball native entry prohibition drops cargo before Gnome Hollows and damage counts only remaining passengers',()=>{let s=state();s.board[12].card=card('gnome_hollows').id;const barred=add(s,'brown_bears',11,1),allowed=add(s,'cloud_spirit',11,1);s=snow(s);assert.equal(unit(s,barred.uid).at,11);assert.equal(unit(s,barred.uid).damage,0);assert.equal(unit(s,allowed.uid).at,14);assert.equal(unit(s,allowed.uid).damage,1);});
test('Snowball native direction cancel survives JSON without paying, discarding, moving or damaging',()=>{let s=state();const cargo=add(s,'brown_bears',11,1);s=cast(s,'snowball');s=restoreGame(JSON.parse(JSON.stringify(s)));const hand=[...s.players[0].hand],rng=s.rng;s=choose(s,v=>v===null);assert.equal(s.players[0].spent,0);assert.deepEqual(s.players[0].hand,hand);assert.equal(s.rng,rng);assert.equal(unit(s,cargo.uid).at,11);assert.equal(unit(s,cargo.uid).damage,0);assert.equal(s.choice,null);});
test('Chaoswish public caster/random/copy choices all survive JSON without altering actual free target result',()=>{let s=state();add(s,'black_cat',0,1);const victim=add(s,'brown_bears',13,1),wizard=add(s,'apprentice_wizard',12);s=cast(s,'chaoswish');const paid=s.players[0].spent;s=choose(restoreGame(JSON.parse(JSON.stringify(s))),v=>v?.uid===wizard.uid);s=choose(restoreGame(JSON.parse(JSON.stringify(s))),(v,o)=>o.label.endsWith('：'+card('zap').name));assert.ok(!s.choice.options.some(o=>o.value===null),'mandatory cast cannot cancel fixed usable spell');s=choose(restoreGame(JSON.parse(JSON.stringify(s))),v=>v.type==='cast'&&v.target===victim.uid);assert.equal(unit(s,victim.uid).damage,1);assert.equal(s.players[0].spent,paid);assert.equal(s.choice.player,1);s=choose(restoreGame(JSON.parse(JSON.stringify(s))),v=>v===false);assert.equal(s.choice,null);assert.equal(s.players[0].banished.filter(id=>id===card('zap').id).length,1);assert.equal(s.players[0].cemetery.filter(id=>id===card('chaoswish').id).length,1);});
