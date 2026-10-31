import test from 'node:test';
import assert from 'node:assert/strict';
import '../src/cards.js';
import '../src/engine.js';
import {queueEffects,drainEffects,chooseEffect} from '../src/storyline.js';
function game(){return {storyline:[],winner:null};}
const site={uid:'site:4',card:'site-card',controller:0};
test('site ability origin is independent from an overridden spell effectCard',()=>{
 const s=game();queueEffects(s,[{op:'lifeLoss'}],site,0,'cast-magic');
 assert.equal(s.storyline[0].abilityOrigin,'site-card');assert.equal(s.storyline[0].effectCard,'cast-magic');
});
test('same-source continuation keeps original ability origin while a new source starts a new origin',()=>{
 const s=game();s.resolvingZoneAccessFrame={uid:site.uid,effectCard:'different',abilityOrigin:'borrowed-site'};
 queueEffects(s,[{op:'lifeLoss'}],site,0,'new-magic');
 assert.equal(s.storyline[0].abilityOrigin,'borrowed-site');
 queueEffects(s,[{op:'damage'}],{uid:'other',card:'minion-card'},0,'new-magic');assert.equal(s.storyline[1].abilityOrigin,'minion-card');
 queueEffects(s,[{op:'damage',abilityOrigin:'printed-dragon'}],site,0,'new-magic');assert.equal(s.storyline[2].abilityOrigin,'printed-dragon');
});
test('origin survives pending choices and JSON save into nested continuation metadata',()=>{
 let s=game();queueEffects(s,[{op:'lifeLoss',select:{kind:'target'}}],site,0,'cast-magic');
 const seen=[],api={title:()=>'',select:()=>[{label:'yes',value:7}],check:()=>{},resolve:(state,frame)=>{seen.push([frame.abilityOrigin,state.resolvingZoneAccessFrame.abilityOrigin]);queueEffects(state,[{op:'damage'}],frame.source,0,'changed-magic');api.resolve=(state,frame)=>seen.push([frame.abilityOrigin,state.resolvingZoneAccessFrame.abilityOrigin]);}};
 drainEffects(s,api);assert.ok(s.choice);s=JSON.parse(JSON.stringify(s));chooseEffect(s,0);drainEffects(s,api);
 assert.deepEqual(seen,[['site-card','site-card'],['site-card','site-card']]);assert.equal(s.resolvingZoneAccessFrame,undefined);
});
test('a continuation changing its acting unit retains the same effect origin rather than laundering a Site ability',()=>{
 const s=game();s.resolvingZoneAccessFrame={uid:site.uid,effectCard:'cast-magic',abilityOrigin:'site-card'};
 queueEffects(s,[{op:'damage'}],{uid:'lured-minion',card:'minion-card'},0,'cast-magic');assert.equal(s.storyline[0].abilityOrigin,'site-card');
});
test('an explicitly fresh trigger does not inherit a previous borrowed ability origin from the same physical source',()=>{
 const s=game();s.resolvingZoneAccessFrame={uid:site.uid,effectCard:'site-card',abilityOrigin:'borrowed-minion'};
 queueEffects(s,[{op:'damage'}],site,0,'site-card',{fresh:true});assert.equal(s.storyline[0].abilityOrigin,'site-card');
});
