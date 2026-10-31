import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {install,card,starter} from '../src/cards.js';
import * as E from '../src/engine.js';
import {bookBlessingCandidate} from '../src/magic-context.js';
install(JSON.parse(fs.readFileSync(new URL('../data/official-cards.json',import.meta.url))));
function game(){const s=E.newGame([starter(),starter()],42,'local');Object.assign(s,{phase:'main',active:0,turn:4,pending:null,choice:null,storyline:[],artifacts:[],auras:[]});s.units.forEach(u=>{u.at=u.controller===0?12:2;u.born=0;u.tapped=false;u.justEntered=false;});s.board=s.board.map((_,at)=>({uid:'s'+s.next++,card:card('valley').id,owner:at<10?1:0,controller:at<10?1:0}));for(const p of s.players){p.hand=[];p.bonusMana=60;p.bonusAffinity={air:10,earth:10,fire:10,water:10};}return s;}
function unit(s,slug,at=12,p=0){const u={uid:'u'+s.next++,card:card(slug).id,at,owner:p,controller:p,tapped:false,born:0,damage:0,ward:false,mods:[]};s.units.push(u);return u;}
function book(s,bearer,owner=0){s.artifacts.push({uid:'book'+s.next++,card:card('book_of_blessings').id,at:bearer.at,layer:bearer.layer||'surface',owner,controller:owner,bearer:bearer.uid});}
function choose(s,predicate){assert.ok(s.choice);const option=s.choice.options.findIndex(o=>predicate(o.value));assert.notEqual(option,-1,'Missing choice '+s.choice.title);return E.dispatch(s,{type:'choose',player:s.choice.player,option});}
function cast(s,slug,predicate=()=>true){const h={uid:'h'+s.next++,card:card(slug).id};s.players[0].hand.push(h);const action=E.legalActions(s,0).find(a=>a.type==='cast'&&a.hand===h.uid&&predicate(a));assert.ok(action,'No cast '+slug);return E.dispatch(s,action);}
function settle(s){let n=0;while(s.choice){assert.ok(n++<100);s=E.dispatch(s,{type:'choose',player:s.choice.player,option:0});}return s;}
function chooseAfterDraw(s,id){while(s.choice&&s.choice.frame.step.op!=='modify')s=E.dispatch(s,{type:'choose',player:s.choice.player,option:0});return choose(s,v=>v?.uid===id);}


function realBook(s,bearer=s.units.find(u=>u.controller===0)){const before=s.players[0].spent;s=cast(s,'book_of_blessings',a=>a.at===bearer.at&&a.bearer===bearer.uid);s=settle(s);assert.equal(s.players[0].spent-before,3);assert.ok(s.artifacts.some(a=>a.card===card('book_of_blessings').id&&a.bearer===bearer.uid));return s;}

test('Production Book/Suffering now resolves its grouped sacrifice and post-Deathrite opponent choice instead of rejecting',()=>{let s=game();const ally=unit(s,'bitten');s=realBook(s);const before=s.players[0].spent;s=cast(s,'symmetric_suffering',a=>a.caster===s.units.find(u=>u.controller===0&&card(u.card).type==='Avatar').uid);s=choose(s,v=>v===ally.uid);assert.ok(E.unit(s,ally.uid)&&!E.unit(s,ally.uid).dying);s=E.restoreGame(JSON.parse(JSON.stringify(s)));s=choose(s,v=>v===null);const skeleton=s.units.find(u=>u.controller===1&&card(u.card).slug==='skeleton');assert.ok(skeleton);assert.equal(s.choice.player,1);assert.equal(s.magicChoiceContexts.at(-1).warded,ally.uid);s=choose(s,v=>v===skeleton.uid);s=settle(s);assert.ok(!E.unit(s,ally.uid));assert.ok(!E.unit(s,skeleton.uid));assert.equal(s.players[0].spent-before,3);assert.equal(s.magicChoiceContexts.at(-1).closed,true);});
test('Production Suffering: different native caster can decline its whole group without triggering another bearers Book',()=>{let s=game();const other=unit(s,'sorcerer');s=realBook(s,s.units.find(u=>u.controller===0&&card(u.card).type==='Avatar'));const before=s.players[0].spent;s=cast(s,'symmetric_suffering',a=>a.caster===other.uid);s=choose(s,v=>v===null);while(s.choice)s=choose(s,v=>v===null);assert.equal(s.players[0].spent-before,card('symmetric_suffering').cost);assert.equal(s.magicChoiceContexts.at(-1).books.length,0);assert.equal(s.magicChoiceContexts.at(-1).warded,null);});
