import test from 'node:test';
import assert from 'node:assert/strict';
import {createSufferingPlan,chooseSufferingPlan,sufferingPlanOptions,validateSufferingPlan} from '../src/magic-suffering.js';
const catalog={automaton:{type:'Minion',artifactUnit:true},auraMinion:{type:'Minion'},minion:{type:'Minion'},artifact:{type:'Artifact'}};
const A={card:id=>catalog[id]};
const realm=()=>({units:[{uid:'auto',card:'automaton',controller:0},{uid:'animated',card:'auraMinion',controller:0,finalAuraAnimation:{card:'aura'}},{uid:'enemy',card:'minion',controller:1}],artifacts:[{uid:'item',card:'artifact',controller:0}],auras:[{uid:'animated',card:'auraMinion',controller:0,finalAuraAnimation:{card:'aura'}}]});
test('Suffering pure planner lets a multi-type card fill one matching slot and never sacrifices the same UID twice',()=>{
 const s=realm(),before=structuredClone(s);let plan=createSufferingPlan(0);plan=chooseSufferingPlan(s,plan,'auto',A);assert.ok(!sufferingPlanOptions(s,plan,A).some(o=>o.uid==='auto'));assert.throws(()=>chooseSufferingPlan(s,plan,'auto',A));plan=chooseSufferingPlan(s,plan,'item',A);plan=chooseSufferingPlan(s,plan,'animated',A);assert.deepEqual(validateSufferingPlan(s,plan,A),[{kind:'minion',uid:'auto'},{kind:'artifact',uid:'item'},{kind:'aura',uid:'animated'}]);assert.deepEqual(s,before);
});
test('Suffering pure planner allows an Automaton to match Artifact instead of Minion, not both',()=>{
 const s=realm();let plan=createSufferingPlan(0);plan=chooseSufferingPlan(s,plan,null,A);plan=chooseSufferingPlan(s,plan,'auto',A);plan=chooseSufferingPlan(s,plan,null,A);assert.deepEqual(validateSufferingPlan(s,JSON.parse(JSON.stringify(plan)),A),[{kind:'artifact',uid:'auto'}]);
});
test('Suffering opponent planning requires a currently available match; no initial-board snapshot invents future candidates',()=>{
 const s=realm();let plan=createSufferingPlan(1,['minion'],true);assert.throws(()=>chooseSufferingPlan(s,plan,null,A));s.units.find(u=>u.uid==='enemy').dying=true;plan=chooseSufferingPlan(s,plan,null,A);assert.deepEqual(validateSufferingPlan(s,plan,A),[]);s.units.push({uid:'newSkeleton',card:'minion',controller:1});assert.throws(()=>validateSufferingPlan(s,plan,A));const fresh=createSufferingPlan(1,['minion'],true);assert.deepEqual(sufferingPlanOptions(s,fresh,A).map(o=>o.uid),['newSkeleton']);
});
test('Suffering pure planner revalidates control and cannot commit an incomplete or stale selection',()=>{
 const s=realm();let plan=createSufferingPlan(0,['artifact']);assert.throws(()=>validateSufferingPlan(s,plan,A));plan=chooseSufferingPlan(s,plan,'item',A);s.artifacts[0].controller=1;assert.throws(()=>validateSufferingPlan(s,plan,A));
});
