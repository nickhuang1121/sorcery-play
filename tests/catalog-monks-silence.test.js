import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {graveEntries} from '../src/cemetery.js';
import {install,card,starter} from '../src/cards.js';
import {newGame,restoreGame,dispatch,legalActions,unit,power,disabled} from '../src/engine.js';
install(JSON.parse(fs.readFileSync(new URL('../data/official-cards.json',import.meta.url))));
function game(){let s=newGame([starter(),starter()],42,'local');Object.assign(s,{turn:5,active:0,phase:'main',choice:null,pending:null,storyline:[],artifacts:[],auras:[]});s.board=Array.from({length:20},(_,at)=>({uid:'site'+at,card:card('valley').id,owner:at<10?1:0,controller:at<10?1:0}));for(const u of s.units){u.at=u.controller===0?17:0;u.born=0;u.tapped=false;}for(const p of s.players){p.hand=[];p.bonusMana=40;p.bonusAffinity={air:10,earth:10,fire:10,water:10};}return restoreGame(s);}
function add(s,slug,at=12,p=0,extra={}){const u={uid:'unit'+s.next++,card:card(slug).id,owner:p,controller:p,at,born:0,tapped:false,damage:0,mods:[],...extra};s.units.push(u);return u;}
function choose(s,predicate){assert.ok(s.choice);const option=s.choice.options.findIndex(o=>predicate(o.value));assert.ok(option>=0,JSON.stringify(s.choice.options));return dispatch(s,{type:'choose',player:s.choice.player,option});}
function cast(s,slug,match={}){const h={uid:'hand'+s.next++,card:card(slug).id};s.players[0].hand.push(h);s=restoreGame(s);const a=legalActions(s,0).find(a=>a.type==='cast'&&a.hand===h.uid&&Object.entries(match).every(([k,v])=>a[k]===v));assert.ok(a,'native cast '+slug);return dispatch(s,a);}
function target(s,slug,predicate,match={}){s=cast(s,slug,match);assert.equal(s.choice?.frame.step.op,'commitSpell','real cast-time target declaration');return choose(s,predicate);}

for(const spell of ['bury','drown'])test('Monks: native '+spell+' forcefully moves rather than modifying an ability',()=>{
 let s=game();if(spell==='drown')s.board[12].card=card('pond').id;const u=add(s,'monks_of_kobalsa',12,1);s=target(s,spell,v=>v?.uid===u.uid);assert.equal(unit(s,u.uid),undefined);assert.ok(s.players[1].cemetery.includes(card('monks_of_kobalsa').id));s=restoreGame(JSON.parse(JSON.stringify(s)));assert.equal(unit(s,u.uid),undefined);
});
test('Monks: native Flood submerges the unsaved Mortal despite modification immunity',()=>{
 let s=game();const u=add(s,'monks_of_kobalsa',12,1),saved=add(s,'field_laborers',13);s=cast(s,'the_flood');s=choose(s,v=>v===saved.uid);assert.equal(s.choice.frame.step.op,'finalFloodConfirm');s=restoreGame(JSON.parse(JSON.stringify(s)));s=choose(s,v=>v===true);assert.equal(unit(s,u.uid),undefined);assert.ok(unit(s,saved.uid));assert.ok(s.players[1].cemetery.includes(card('monks_of_kobalsa').id));
});
for(const off of ['silenced','disabled'])test('Silence: '+off+' Aura does not remove native Minion abilities',()=>{
 let s=game();const u=add(s,'cave_trolls',12);s=cast(s,'silence',{at:12});assert.equal(unit(s,u.uid).silenced,true);const a=s.auras.find(a=>card(a.card).slug==='silence');a[off]=true;s=restoreGame(JSON.parse(JSON.stringify(s)));assert.equal(unit(s,u.uid).silenced,false);
});
test('Silence: affected Sites excludes Void while native casting still resolves',()=>{
 let s=game();s.board[12]=null;const u=add(s,'aaj_kegon_ghost_crabs',12);s=cast(s,'silence',{at:12});assert.ok(unit(s,u.uid));assert.equal(unit(s,u.uid).silenced,false);s=restoreGame(JSON.parse(JSON.stringify(s)));assert.equal(unit(s,u.uid).silenced,false);
});
test('Silence: occupying an affected Site includes the underground location',()=>{
 let s=game();const u=add(s,'cave_trolls',12,1,{layer:'below'});s=cast(s,'silence',{at:12});assert.equal(unit(s,u.uid),undefined,'loses underground survival and dies');assert.ok(s.players[1].cemetery.includes(card('cave_trolls').id));
});

function animateSilence(s){s.units.find(u=>u.controller===0&&card(u.card).type==='Avatar').card=card('enchantress').id;s=cast(s,'silence',{at:12});while(s.choice)s=choose(s,v=>v===null);const uid=s.auras.find(a=>card(a.card).slug==='silence').uid;s=cast(s,'divine_healing');s=choose(s,v=>v?.uid===uid);return {s,uid};}
test('Silence: actual Enchantress animation silences itself and others without oscillation after repeated JSON restores',()=>{
 let s=game();const other=add(s,'cave_trolls',13);let built=animateSilence(s);s=built.s;for(let i=0;i<4;i++){assert.equal(unit(s,built.uid).silenced,true);assert.equal(unit(s,other.uid).silenced,true);s=restoreGame(JSON.parse(JSON.stringify(s)));}
 s=cast(s,'freeze',{target:built.uid});while(s.choice)s=choose(s,v=>v===null);assert.equal(disabled(unit(s,built.uid)),true);assert.equal(unit(s,other.uid).silenced,false);s=restoreGame(JSON.parse(JSON.stringify(s)));assert.equal(unit(s,other.uid).silenced,false);
});
