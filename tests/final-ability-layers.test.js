import test from 'node:test';
import assert from 'node:assert/strict';
import {buildAbilityRecord,passiveInstances,activePrintedSources,siteAbilityCanAffect} from '../src/final-ability-layers.js';
const cards={base:{slug:'base',type:'Minion',subtypes:['Mortal'],rules:'Base'},a:{slug:'a',type:'Minion',subtypes:['Spirit'],rules:'A'},b:{slug:'b',type:'Minion',subtypes:['Undead'],rules:'B'},bust:{slug:'the_pallid_bust',type:'Artifact'},site:{type:'Site'},magic:{type:'Magic'},avatar:{type:'Avatar'}};
const A={card:id=>cards[id],definitions:{base:{activated:[{steps:[{op:'own'}]}]},a:{activated:[{steps:[{op:'one'}]}],death:[{op:'dieA'}]},b:{activated:[{steps:[{op:'two'}]}],death:[{op:'dieB'}]}},passives:{a:{auraPower:1},b:{auraPower:2}},printedKeywords:c=>c.slug==='a'?['Airborne']:[]};
test('printed layers preserve each conflicting passive instance and all trigger/activation origins',()=>{
 const r=buildAbilityRecord('base',['a','b'],A);
 assert.deepEqual(passiveInstances(r,'auraPower').map(x=>[x.value,x.origin]),[[1,'a'],[2,'b']]);
 assert.deepEqual(r.defs.death.map(x=>x.abilityOrigin),['a','b']);
 assert.deepEqual(r.defs.activated.map(x=>x.abilityOrigin),['base','a','b']);
 assert.equal(new Set(r.defs.activated.map(x=>x.abilityInstance)).size,3);
 assert.equal(r.defs.activated[1].steps[0].abilityOrigin,'a');
 assert.deepEqual(r.types,['Mortal','Spirit','Undead']);assert.deepEqual(r.keywords,['Airborne']);
 r.defs.activated[1].steps[0].op='mutated';assert.equal(A.definitions.a.activated[0].steps[0].op,'one');
 assert.deepEqual(JSON.parse(JSON.stringify(r)),r);
});
test('duplicate sources remain separate ability instances rather than deduplicated abilities',()=>{
 const r=buildAbilityRecord('base',['a','a'],A);assert.equal(r.defs.death.length,2);assert.equal(passiveInstances(r,'auraPower').length,2);
});
test('Pallid source descriptors track live equipped artifacts and minion bearers only',()=>{
 const s={artifacts:[{uid:'x',card:'bust',bearer:'u',pallidPrintedCard:'a'},{uid:'y',card:'bust',bearer:'u',pallidPrintedCard:'b',silenced:true}]};
 assert.deepEqual(activePrintedSources(s,{uid:'u',card:'base'},A),[{artifact:'x',card:'a'}]);
 assert.deepEqual(activePrintedSources(s,{uid:'u',card:'avatar'},A),[]);s.artifacts[0].bearer=null;assert.deepEqual(activePrintedSources(s,{uid:'u',card:'base'},A),[]);
});
test('site protection distinguishes ability changes from player resources and site characteristics',()=>{
 for(const change of ['target','damage','destroy','banish','modify','move','impedeMove','impedeAttack','gainLife','loseLife','heal'])assert.equal(siteAbilityCanAffect({originCard:'site',protectedFromSites:true,change,card:A.card}),false,change);
 for(const change of ['mana','threshold','draw','siteCharacteristic'])assert.equal(siteAbilityCanAffect({originCard:'site',protectedFromSites:true,change,card:A.card}),true,change);
 assert.equal(siteAbilityCanAffect({originCard:'magic',protectedFromSites:true,change:'damage',card:A.card}),true);
 assert.equal(siteAbilityCanAffect({originCard:'site',protectedFromSites:false,change:'damage',card:A.card}),true);
});
test('passive layer views retain carrier characteristics and evaluate each complete conditional passive independently',async()=>{
 const {passiveLayerViews,evaluatePassiveLayers}=await import('../src/final-ability-layers.js');
 const api={...A,passives:{a:{auraPower:1,types:['Spirit']},b:{auraPower:2,types:['Undead']}}};
 const r=buildAbilityRecord('base',['a','b'],api),u={uid:'real',card:'base',controller:0,at:12};
 const views=passiveLayerViews(u,r,'auraPower');assert.deepEqual(views.map(v=>v.source.card),['base','base']);assert.deepEqual(views.map(v=>v.source.abilityOrigin),['a','b']);
 const amount=evaluatePassiveLayers(u,r,'auraPower',(value,passive)=>passive.types.includes('Undead')?value:0).reduce((a,b)=>a+b,0);assert.equal(amount,2,'A scalar sum of both abilities would incorrectly give 3');
});
test('central Site descriptor blocks unit-only continuations but preserves independent compound effects',async()=>{
 const {siteFrameBlocked}=await import('../src/final-ability-layers.js');const s={artifacts:[{card:'key',bearer:'u'}]},u={uid:'u',card:'base'};
 const api={card:id=>id==='key'?{slug:'key_to_the_city',type:'Artifact'}:A.card(id),unit:(_,id)=>id==='u'?u:null};
 const frame={source:{uid:'site',card:'site'},abilityOrigin:'site',step:{op:'collectionTransformUnit',uid:'u'}};
 assert.equal(siteFrameBlocked(s,frame,api),true);assert.equal(siteFrameBlocked(s,{...frame,abilityOrigin:'magic'},api),false);
 assert.equal(siteFrameBlocked(s,{...frame,step:{op:'completionMortimer',uid:'u'}},api),false);
});
test('physical Pallid instances retain their own identity when another source is removed',async()=>{
 const {unitPassiveLayerViews}=await import('../src/final-ability-layers.js');const u={uid:'u',card:'base'},s={artifacts:[{uid:'one',card:'bust',bearer:'u',pallidPrintedCard:'a'},{uid:'two',card:'bust',bearer:'u',pallidPrintedCard:'a'}]};
 const before=unitPassiveLayerViews(s,u,A,'auraPower');assert.deepEqual(before.map(l=>l.instance),['artifact:one','artifact:two']);s.artifacts.shift();assert.equal(unitPassiveLayerViews(s,u,A,'auraPower')[0].instance,before[1].instance);
});
test('live definition layers preserve gained active/trigger abilities under silence and stable source IDs under detachment',async()=>{
 const {unitDefinitionLayers}=await import('../src/final-ability-layers.js');const u={uid:'u',card:'base',silenced:true},s={artifacts:[{uid:'one',card:'bust',bearer:'u',pallidPrintedCard:'a'},{uid:'two',card:'bust',bearer:'u',pallidPrintedCard:'b'}]};
 let d=unitDefinitionLayers(s,u,A);assert.deepEqual(d.activated.map(a=>a.abilityOrigin),['a','b']);assert.equal(d.death.length,2);const stable=d.activated[1].abilityInstance;s.artifacts.shift();d=unitDefinitionLayers(s,u,A);assert.equal(d.activated[0].abilityInstance,stable);assert.equal(d.activated[0].steps[0].abilityNature,'gained');
});
test('printed self references use the carrier name while references to a different named card remain unchanged',()=>{
 const api={...A,definitions:{...A.definitions,a:{activated:[{steps:[{op:'searchSummon',slug:'a'},{op:'summon',slug:'b'}]}]}},passives:{a:{chargeIfDead:'a',countsAs:'b'}}};const r=buildAbilityRecord('base',['a'],api);assert.equal(r.defs.activated[1].steps[0].slug,'base');assert.equal(r.defs.activated[1].steps[1].slug,'b');assert.equal(r.records[1].passive.chargeIfDead,'base');assert.equal(r.records[1].passive.countsAs,'b');
});
