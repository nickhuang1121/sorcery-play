import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {install,card,starter} from '../src/cards.js';
import {newGame,dispatch,legalActions,unit,restoreGame,resources,power,unitTypes,keywords} from '../src/engine.js';

install(JSON.parse(fs.readFileSync(new URL('../data/official-cards.json',import.meta.url))));
function game(){const s=newGame([starter(),starter()],42,'local');s.turn=5;s.active=0;s.phase='main';s.artifacts=[];s.auras=[];s.storyline=[];s.choice=null;s.units.forEach(u=>{u.born=0;u.tapped=false;});s.board=Array.from({length:20},(_,at)=>({uid:'site'+at,card:card('valley').id,owner:at<10?1:0,controller:at<10?1:0}));for(const pl of s.players){pl.hand=[];pl.bonusMana=30;pl.bonusAffinity={air:10,earth:10,fire:10,water:10};}return s;}
function add(s,slug,at=12,p=0,extra={}){const u={uid:'u'+s.next++,card:card(slug).id,at,owner:p,controller:p,born:0,damage:0,mods:[],tapped:false,...extra};s.units.push(u);return u;}
function put(s,slug,at=12,p=0){s.board[at]={uid:'site'+s.next++,card:card(slug).id,owner:p,controller:p};return {...s.board[at],at,layer:'surface'};}
function effect(s,source,step,value){s.choice={player:source.controller,title:step.op,options:[{label:'Run',value}],frame:{source:structuredClone(source),controller:source.controller,effectCard:source.card,step}};return dispatch(s,{type:'choose',player:source.controller,option:0});}
function choose(s,fn){const index=s.choice.options.findIndex(o=>fn(o.value));assert.ok(index>=0,JSON.stringify(s.choice.options));return dispatch(s,{type:'choose',player:s.choice.player,option:index});}
function settle(s){let count=0;while(s.choice){assert.ok(count++<100,'Bounded serializable path');s=choose(s,()=>true);}return s;}
function playSite(s,slug,at=12){s.board[at]=null;const h={uid:'h'+s.next++,card:card(slug).id};s.players[0].hand.push(h);const a=legalActions(s).find(a=>a.type==='site'&&a.hand===h.uid&&a.at===at);assert.ok(a,'No legal site play '+slug);return dispatch(s,a);}
function nextMain(s){if(s.phase==='draw')s=dispatch(s,legalActions(s).find(a=>a.type==='draw'&&a.deck==='spells'));return s;}


function bust(s,u,slug,stamp=10){const a={uid:'b'+s.next++,card:card('the_pallid_bust').id,bearer:u.uid,at:u.at,owner:u.owner,controller:u.controller,stamp,...(slug?{pallidPrintedCard:card(slug).id}:{})};s.artifacts.push(a);return a;}
test('Pallid Pale Worm: a silenced borrower removes nearby unit and Site Ward marks; losing the source stops both predicates',()=>{let s=game();const u=add(s,'brown_bears',12,0,{mods:[{silenced:true}]}),ally=add(s,'brown_bears',13,0,{ward:true}),a=bust(s,u,'order_of_the_pale_worm');s.board[12].ward=true;s=restoreGame(s);assert.equal(s.board[12].ward,false);assert.equal(unit(s,ally.uid).ward,false);s.artifacts.find(v=>v.uid===a.uid).bearer=null;s.board[12].ward=true;unit(s,ally.uid).ward=true;s=restoreGame(s);assert.equal(s.board[12].ward,true);assert.equal(unit(s,ally.uid).ward,true);});
