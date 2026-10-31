import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {install,card,runtimeCard} from '../src/cards.js';import '../src/engine.js';
import {tagPhysicalCard} from '../src/final-units.js';
import {builtSitePhysicalParts,tagBuiltSiteParts,restoreBuiltSiteState,detachBuiltSiteParts,sendBuiltSite,registerBuiltSiteCards} from '../src/final-built-sites.js';
install(JSON.parse(fs.readFileSync(new URL('../data/official-cards.json',import.meta.url))));
const A={card,runtimeCard,sendCard:(s,p,id,zone)=>s.players[p][zone].push(id)};
function tower(){return {uid:'stack',card:registerBuiltSiteCards(card,runtimeCard),owner:0,controller:0,ward:true,babelBuilt:true,babelParts:[{card:card('the_base_of_babel').id,owner:0},{card:card('the_apex_of_babel').id,owner:1}]};}
function state(){return {next:1,players:[{hand:[],cemetery:[],banished:[]},{hand:[],cemetery:[],banished:[]}]};}
const tag=tagPhysicalCard;
test('Babel physical lineage: tagging and splitting into zones preserve both distinct physical cards and owners',()=>{
 const s=state(),t=tower(),parts=tagBuiltSiteParts(s,t,A,tag);assert.equal(new Set(parts.map(p=>p.physicalUid)).size,2);sendBuiltSite(s,t,'cemetery',A);assert.equal(card(s.players[0].cemetery[0]).finalPhysicalUid,parts[0].physicalUid);assert.equal(card(s.players[1].cemetery[0]).finalPhysicalUid,parts[1].physicalUid);const again=tagBuiltSiteParts(s,t,A,tag);assert.deepEqual(again.map(p=>p.physicalUid),parts.map(p=>p.physicalUid));
});
test('Babel physical lineage: complete return keeps the Tower and partial eligibility never recreates a blocked part',()=>{
 const s=state(),t=tower(),parts=tagBuiltSiteParts(s,t,A,tag),copy=JSON.parse(JSON.stringify(t));const all=restoreBuiltSiteState(copy,new Set(parts.map(p=>p.physicalUid)),A);assert.equal(all.babelParts.length,2);assert.equal(card(all.card).providesMana,2);
 const one=restoreBuiltSiteState(copy,new Set([parts[1].physicalUid]),A);assert.equal(card(one.card).slug,'the_apex_of_babel');assert.equal(one.owner,1);assert.equal(one.controller,0);assert.equal(one.ward,true);assert.equal(one.babelParts,undefined);assert.equal(one.babelBuilt,undefined);assert.equal(restoreBuiltSiteState(copy,new Set(),A),null);assert.equal(copy.babelParts.length,2,'Plans do not mutate the archived snapshot');
});
test('Babel physical lineage: taking one archived part from a newly built Tower leaves the other physical part standalone',()=>{
 const s=state(),t=tower(),parts=tagBuiltSiteParts(s,t,A,tag),remaining=detachBuiltSiteParts(t,new Set([parts[0].physicalUid]),A);assert.equal(card(remaining.card).slug,'the_apex_of_babel');assert.equal(card(remaining.card).finalPhysicalUid,parts[1].physicalUid);assert.equal(remaining.babelParts,undefined);assert.equal(detachBuiltSiteParts(t,new Set(parts.map(p=>p.physicalUid)),A),null);
 const copied={uid:'mirror',card:t.card,owner:0,controller:0};assert.equal(builtSitePhysicalParts(copied,A),null);assert.equal(detachBuiltSiteParts(copied,new Set([parts[0].physicalUid]),A),copied,'A copied Tower has one actual copy card, not the original two physical halves');
});

test('Babel physical lineage: partial Horns restoration keeps the Demon form but rebuilds its physical half characteristics',()=>{
 const s=state(),t=tower(),parts=tagBuiltSiteParts(s,t,A,tag),demon={...t,card:runtimeCard(t.card,'behemoth_demon',{type:'Minion',subtypes:['Demon'],umbrellas:['Evil'],rules:''}),originalCard:parts[0].card,damage:2};const restored=restoreBuiltSiteState(demon,new Set([parts[1].physicalUid]),A);assert.equal(card(restored.card).type,'Minion');assert.equal(card(restored.card).slug,'__behemoth_demon');assert.equal(card(restored.card).rarity,'Unique');assert.equal(card(restored.card).rarities,undefined);assert.equal(card(restored.card).providesMana,undefined);assert.equal(card(restored.originalCard).slug,'the_apex_of_babel');assert.equal(restored.babelParts,undefined);assert.equal(restored.damage,2);const remainder=detachBuiltSiteParts(demon,new Set([parts[0].physicalUid]),A);assert.notEqual(remainder.uid,demon.uid);assert.equal(card(remainder.originalCard).slug,'the_apex_of_babel');
});
