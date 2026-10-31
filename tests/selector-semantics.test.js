import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {install,cards} from '../src/cards.js';
import {magicSelectorMetadata as metadata,magicSelectorCoverage,magicSelectorProfiles,abilitySelectorProfiles,choiceSelectorMetadata,selectorMetadata} from '../src/selector-semantics.js';
import {card} from '../src/cards.js';
install(JSON.parse(fs.readFileSync(new URL('../data/official-cards.json',import.meta.url))));

test('selector contract inventory includes all 202 currently playable Magics without runtime prose inference',()=>{
 const catalog=cards.filter(c=>c.playable&&c.type==='Magic');
 assert.equal(catalog.length,202);
 assert.deepEqual(magicSelectorCoverage(cards).missing,[]);
 assert.equal(Object.keys(magicSelectorProfiles).length,202);
});
test('official Casting Magics distinguishes direct target declaration from resolving an ordinary ally choice',()=>{
 assert.deepEqual(metadata('apply_alkahest'),{role:'target',timing:'cast',source:'magic'});
 assert.deepEqual(metadata('overpower'),{role:'choose',timing:'resolve',source:'magic'});
 assert.deepEqual(metadata('joust','ally'),{role:'choose',timing:'resolve',source:'magic'});
 assert.deepEqual(metadata('joust','enemy'),{role:'target',timing:'resolve',source:'chosen-ally'});
});
test('selector contracts preserve repeated and secondary cast targets rather than counting only the first choice',()=>{
 assert.equal(metadata('swap','second').timing,'cast');
 assert.equal(metadata('backstab','second').source,'magic');
 assert.deepEqual(metadata('meteor_shower','sites'),{role:'target',timing:'cast',source:'magic',count:3,distinct:true,noSharedBorders:true});
 assert.deepEqual(metadata('chain_lightning','additional'),{role:'target',timing:'cast',source:'magic',repeat:true,extraMana:2,distinct:true});
});
test('unknown dynamic selectors fail closed instead of treating arbitrary choices or random results as targets',()=>{
 assert.equal(metadata('lightning_bolt','random-unit'),null);
 assert.equal(metadata('bless','future-selector'),null);
 assert.equal(metadata('unknown_magic'),null);
 assert.ok(magicSelectorCoverage(cards).composite.includes('duel'));
});
test('ability contracts distinguish cost choices, granted source abilities and explicit copied ability origins',()=>{
 const A={card},source={card:card('sorcerer').id};
 assert.equal(choiceSelectorMetadata({source,effectCard:source.card,step:{op:'fiftyRamCommit'}},A).role,'target');
 assert.equal(choiceSelectorMetadata({source,effectCard:source.card,step:{op:'copyHeirCost'}},A),null);
 assert.equal(choiceSelectorMetadata({source,effectCard:card('ignis_rex').id,step:{op:'fireDiscardBlast'}},A),null);
 assert.equal(choiceSelectorMetadata({source,effectCard:source.card,step:{op:'commitAbility',effectOp:'locationDamage',abilityOrigin:card('ancient_dragon').id}},A).role,'target');
});
test('Magic identity is not overwritten by the queue default caster ability origin',()=>{
 const A={card},frame={effectCard:card('chain_lightning').id,abilityOrigin:card('sorcerer').id,source:{card:card('sorcerer').id},step:{op:'chainDeclare'}};
 assert.equal(choiceSelectorMetadata(frame,A).source,'magic');
 assert.equal(selectorMetadata(frame,{kind:'unit'},A).role,'target');
});
test('ability inventory explicitly covers all 76 playable non-Magics mentioning targets, including passive references',()=>{
 const catalog=cards.filter(c=>c.playable&&c.type!=='Magic'&&/target/i.test(c.rules));assert.equal(catalog.length,76);assert.deepEqual(catalog.filter(c=>!Object.hasOwn(abilitySelectorProfiles,c.slug)).map(c=>c.slug),[]);assert.deepEqual(abilitySelectorProfiles.blasted_oak,{});assert.deepEqual(abilitySelectorProfiles.the_malleus_maleficarum,{});
});

test('The Flood is an ordinary Magic choice with an explicitly provisional exception subset committed at confirmation',()=>{
 assert.deepEqual(metadata('the_flood'),{role:'choose',timing:'resolve',source:'magic'});
 const A={card};
 assert.deepEqual(choiceSelectorMetadata({effectCard:card('the_flood').id,step:{op:'finalFloodChoose'}},A),{role:'choose',timing:'resolve',source:'magic',provisional:true,commitOp:'finalFloodConfirm'});
 assert.equal(choiceSelectorMetadata({effectCard:card('the_flood').id,step:{op:'finalFloodConfirm'}},A),null);
});

test('Begone non-target choice remains a Magic choice at resolution and uses its actual banish operation',()=>{
 assert.deepEqual(metadata('begone'),{role:'choose',timing:'resolve',source:'magic'});
 assert.deepEqual(choiceSelectorMetadata({effectCard:card('begone').id,step:{op:'banish'}},{card}),{role:'choose',timing:'resolve',source:'magic'});
});
