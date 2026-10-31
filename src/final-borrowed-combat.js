import {unitPassiveLayerViews,unitPrintedAbilityRecord} from './final-ability-layers.js';
// Presence is existential only for prohibitions/idempotent status rules.
// Triggers, numbers, and replacement instances keep complete source views.
export function combatViews(s,u,A,key=null){return u&&!A.disabled(u)?unitPassiveLayerViews(s,u,A,key):[];}
export const combatHas=(s,u,key,A)=>combatViews(s,u,A,key).some(l=>!!l.value);
export function combatSteps(layer,steps){return steps.map(step=>({...step,abilityOrigin:layer.origin,abilityInstance:layer.instance,abilityNature:layer.nature}));}
export function combatTriggers(s,u,key,A,build){return combatViews(s,u,A,key).flatMap(layer=>{const steps=build(layer);return steps?.length?[{source:layer.source,steps:combatSteps(layer,steps)}]:[];});}
export function combatSnapshot(s,u,A){return {...structuredClone(u),finalAbilityRecord:unitPrintedAbilityRecord(s,u,A)};}
export function combatHurtTriggers(s,u,amount,A){
 return [
  ...combatTriggers(s,u,'skeletonOnMoveHurt',A,()=>[{op:'armySkeleton',at:u.at,layer:u.layer||'surface'}]),
  ...combatTriggers(s,u,'damageToController',A,()=>[{op:'remainingHemogolem',uid:u.uid,amount}]),
  ...combatTriggers(s,u,'healWhenHurt',A,layer=>[{op:'heal',amount:layer.value}]),
 ];
}
export function combatSurvivorSources(s,u,A){
 if(A.card(u.card).type!=='Minion')return [];
 return s.units.filter(v=>!v.dying&&v.controller===u.controller&&A.regionsOverlap(s,v,u)&&A.occupied(v).some(at=>A.occupied(u).some(cell=>A.nearby(at,cell)))).flatMap(v=>combatViews(s,v,A,'healSurvivingAllies'));
}
export function combatDeathReplacements(s,u,A){
 if(A.card(u.card).type!=='Minion')return [];
 return s.units.filter(v=>v.uid!==u.uid&&!v.dying&&v.controller===u.controller&&A.regionsOverlap(s,u,v)&&A.occupied(u).some(at=>A.occupied(v).some(cell=>A.nearby(at,cell)))).flatMap(v=>combatViews(s,v,A,'returnDyingAllies').map(layer=>({kind:'lady',uid:v.uid,abilityOrigin:layer.origin,abilityInstance:layer.instance,label:A.card(v.card).name+' · '+A.card(layer.origin).name+' · 返回手牌'})));
}
export function combatKillTriggers(s,killer,victim,event,deadPower,A){
 const enemy=killer.controller!==victim.controller,attack=event?.attack===killer.uid;
 return [
  ...combatTriggers(s,killer,'untapAttackKill',A,()=>attack&&enemy?[{op:'untapSelf',uid:killer.uid}]:[]),
  ...combatTriggers(s,killer,'killSkeleton',A,()=>enemy?[{op:'killSkeleton',at:victim.at,layer:victim.layer||'surface'}]:[]),
  ...combatTriggers(s,killer,'drawAttackKill',A,()=>attack&&enemy?[{op:'draw',deck:'spells',count:1,optional:true}]:[]),
  ...combatTriggers(s,killer,'drawStrongestKill',A,()=>enemy&&deadPower>=((event?.strongest||[])[killer.controller]??deadPower)?[{op:'drawCards',count:1}]:[]),
 ];
}
