import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {install,card,starter} from '../src/cards.js';
import {newGame,restoreGame,dispatch,legalActions,unit} from '../src/engine.js';
import {queueEffects} from '../src/storyline.js';
import {definitions} from '../src/definitions.js';
install(JSON.parse(fs.readFileSync(new URL('../data/official-cards.json',import.meta.url))));
function game(){let s=newGame([starter(),starter()],42,'local');Object.assign(s,{phase:'main',active:0,turn:4,artifacts:[],auras:[],storyline:[]});s.units.forEach(u=>{u.at=u.controller===0?17:2;u.born=0;u.justEntered=false;});s.board=s.board.map((_,at)=>({uid:'s'+s.next++,card:card('valley').id,owner:at<10?1:0,controller:at<10?1:0}));for(const p of s.players){p.hand=[];p.bonusMana=30;p.bonusAffinity={air:10,earth:10,fire:10,water:10};}s.board[17].card=card('wasteland').id;s.board[18].card=card('windmill').id;return restoreGame(s);}
function add(s,slug,at,p=0){const u={uid:'u'+s.next++,card:card(slug).id,at,owner:p,controller:p,damage:0,born:0,tapped:false,mods:[],grantedKeywords:[]};s.units.push(u);return u;}
function cast(s,slug,match){const h={uid:'audit'+s.next++,card:card(slug).id};s.players[0].hand.push(h);s=restoreGame(s);const a=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid&&match(a));assert.ok(a,'legal '+slug);return dispatch(s,a);}
function archive(s){s=cast(s,'kairos_the_archivist',a=>a.at===12);return {s,k:s.units.find(u=>card(u.card).slug==='kairos_the_archivist').uid};}
function kill(s,k){unit(s,k).damage=1;return cast(s,'fatality',a=>a.target===k);}
function next(s){s=dispatch(s,{type:'end',player:s.active});return dispatch(s,{type:'draw',player:s.active,deck:'spells'});}
test('FAQ 18: queued Infernal Legion resolves from its restored position',()=>{let s=game(),legion=add(s,'infernal_legion',7),near=add(s,'brown_bears',8),far=add(s,'brown_bears',5);const archived=archive(s);s=archived.s;const move=legalActions(s).find(a=>a.type==='move'&&a.unit===legion.uid&&a.at===6);assert.ok(move);s=dispatch(s,move);queueEffects(s,definitions.infernal_legion.end,unit(s,legion.uid),0);s=kill(s,archived.k);assert.equal(unit(s,legion.uid).at,7);assert.equal(unit(s,near.uid)?.damage,3,'restored-position neighbour should take 3');assert.equal(unit(s,far.uid)?.damage,0,'old-position neighbour should not take damage');});
test('FAQ 1: archived temporary Betrayal expires at the restored turn end',()=>{let s=game(),target=add(s,'brown_bears',7,1);s=cast(s,'betrayal',a=>a.target===target.uid);assert.equal(unit(s,target.uid).controller,0);const archived=archive(s);s=next(next(archived.s));assert.equal(unit(s,target.uid).controller,1);s=kill(s,archived.k);assert.equal(unit(s,target.uid).controller,0);s=next(s);assert.equal(unit(s,target.uid).controller,1,'temporary control must expire again');});
test('FAQ 17: Avatar returned into void must place a hand Site before ordinary actions',()=>{const archived=archive(game());let s=archived.s;const av=s.units.find(u=>u.controller===0&&card(u.card).type==='Avatar');s.players[0].banished.push(s.board[17].card);s.board[17]=null;av.at=18;s.players[0].hand.push({uid:'mandatory-site',card:card('valley').id});s=restoreGame(s);s=kill(s,archived.k);assert.equal(unit(s,av.uid).at,17);assert.equal(s.board[17],null);assert.ok(legalActions(s).some(a=>a.type==='site'&&a.at===17),'fixture has a legal Site placement to resolve void');assert.equal(legalActions(s).some(a=>a.type==='end'),false,'cannot end instead of fulfilling mandatory placement');});


test('Avatar void obligation needs an untapped enabled Avatar and an available Site; an isolated void ignores adjacency',()=>{
 let s=game();const av=s.units.find(u=>u.controller===0&&card(u.card).type==='Avatar');
 // Friendly territory is distant, so ordinary adjacency cannot supply this square.
 s.board=s.board.map((site,at)=>at===0?{...site,owner:0,controller:0}:at===17?null:{...site,owner:1,controller:1});
 s.players[0].hand=[{uid:'void-site',card:card('valley').id}];s=restoreGame(s);
 const place=legalActions(s).find(a=>a.type==='site'&&a.at===17);assert.ok(place);
 assert.ok(legalActions(s).every(a=>a.type==='concede'||a.type==='site'&&a.at===17));
 for(const change of ['tapped','disabled','no-card']){let copy=structuredClone(s);if(change==='tapped')unit(copy,av.uid).tapped=true;else if(change==='disabled')unit(copy,av.uid).mods.push({disabled:true});else copy.players[0].hand=[];copy=restoreGame(copy);assert.ok(legalActions(copy).some(a=>a.type==='end'),change);}
 s=dispatch(s,place);assert.equal(card(s.board[17].card).slug,'valley');assert.equal(unit(s,av.uid).tapped,true);assert.ok(legalActions(s).some(a=>a.type==='end'));
});

test('Kairos public results drive restoration cues, never summon/hit/heal for restored state',async()=>{
 const {battleNoticeEvents}=await import('../src/battle-notices.js'),{battleEffects}=await import('../src/battle-fx.js'),{playerView}=await import('../src/net/online-view.js');
 let s=game(),dead=add(s,'wild_boars',13),survivor=add(s,'brown_bears',14);survivor.damage=2;
 const archived=archive(s);s=kill(archived.s,dead.uid);unit(s,survivor.uid).damage=0;const before=structuredClone(s);s=kill(s,archived.k);
 const notices=battleNoticeEvents(before,s,{type:'choose',player:0},card),fx=battleEffects(before,s,{type:'choose',player:0},card);
 assert.ok(notices.some(n=>n.kind==='restore'));assert.ok(!notices.some(n=>n.kind==='summon'));
 assert.ok(!fx.some(e=>e.kind==='summon'||['hit','heal'].includes(e.kind)&&e.uid===survivor.uid));assert.ok(fx.some(e=>e.kind==='restore'&&e.uid===dead.uid));
 const view=playerView(s,1).state;assert.deepEqual(view.finalKairosArchivePublic,s.finalKairosArchivePublic);assert.deepEqual(view.finalKairosReturnPublic,s.finalKairosReturnPublic);assert.equal(view.finalKairosArchive,undefined);
 assert.ok(s.finalKairosReturnPublic.restored.some(r=>r.uid===dead.uid));assert.ok(s.finalKairosArchivePublic.cards.every(r=>!Object.hasOwn(r,'state')));
 assert.ok(!battleNoticeEvents(s,s,{type:'choose',player:0},card).some(n=>n.kind==='restore'));
});

test('Archived face-down cards expose a placeholder in the public archive, never the front identity',async()=>{
 const {runtimeCard}=await import('../src/cards.js');let s=game();const front=card('vivien_the_enchantress').id;
 s.inertCards=[{uid:'hidden-front',card:runtimeCard(front,'vivien_back',{type:'None',category:'None',rules:'',attack:null,defense:null,playable:false}),originalCard:front,owner:0,controller:0,at:13,mods:[],born:0,damage:0,tapped:false}];
 s=archive(s).s;const record=s.finalKairosArchivePublic.cards.find(r=>r.uid==='hidden-front');assert.equal(record.card,null);assert.equal(JSON.stringify(s.finalKairosArchivePublic).includes(front),false);
});
