import {filterModificationRecord,restoreRejectedModifications,projectProtectedMods,restoreProjectedMods} from './modification-layers.js';
// Printed ability records remain separate: two instances of the same passive
// key cannot be represented by overwriting one object property.
const clone=value=>structuredClone(value);
// Creature types, not Artifact subtypes or name-derived Knight/Royalty classes.
export const allMinionCreatureTypes=Object.freeze(['Angel','Beast','Demon','Dragon','Dwarf','Faerie','Giant','Gnome','Goblin','Merfolk','Monster','Mortal','Ogre','Spirit','Sphinx','Troll','Undead']);
export const printedMinionTypes=c=>c.slug==='azuridge_caravan'?[]:[...c.subtypes||[]];
function annotate(value,origin,instance,nature){
 if(Array.isArray(value))return value.map(v=>annotate(v,origin,instance,nature));
 if(!value||typeof value!=='object')return value;
 const result=Object.fromEntries(Object.entries(value).map(([k,v])=>[k,annotate(v,origin,instance,nature)]));
 if(value.op){result.abilityOrigin=origin;result.abilityInstance=instance;result.abilityNature=nature;}
 return result;
}

function replaceSelfReferences(value,printed,carrier){
 if(Array.isArray(value))return value.map(v=>replaceSelfReferences(v,printed,carrier));
 if(!value||typeof value!=='object')return value;
 return Object.fromEntries(Object.entries(value).map(([key,v])=>[key,
  ['slug','chargeIfDead','countsAs'].includes(key)&&v===printed.slug?carrier.slug:
  key==='name'&&v===printed.name?carrier.name:replaceSelfReferences(v,printed,carrier)]));
}
export function buildAbilityRecord(base,sources,A){
 const ids=[base,...sources],records=ids.map((id,index)=>{
  const c=A.card(id),definition=replaceSelfReferences(clone(A.definitions?.[c.slug]||{}),c,A.card(base)),passive=replaceSelfReferences(clone(A.passives?.[c.slug]||{}),c,A.card(base));
  if(c.slug==='vivien_the_enchantress')passive.finalVivien=true;
  if(c.slug==='azuridge_caravan')passive.allElements=true;
  if(index>0&&c.slug==='sorcerer')definition.activated=[...definition.activated||[],{label:'橫置：抽取一張法術',tap:true,steps:[{op:'draw',deck:'spells',count:1}]}];
  if(c.handler==='drawSpell'&&!definition.genesis)definition.genesis=[{op:'draw',deck:'spells',count:1}];
  if(c.handler==='mana')passive.printedProvidesMana=1;
  if(c.handler==='fireThreshold')passive.printedProvidesFire=1;
  return {id,origin:id,index,nature:index===0?'printed':'gained',slug:c.slug,definition:clone(definition),passive:clone(passive),types:printedMinionTypes(c),keywords:[...new Set([...(A.printedKeywords?A.printedKeywords(c):c.keywords||[]),...(passive.siteSpellElements?.length?['Spellcaster']:[])])],rules:c.rules||''};
 });
 const defs={},passives={},conflicts=[];
 for(const record of records){
  for(const [key,value] of Object.entries(record.definition)){
   if(Array.isArray(value)){
    (defs[key]||=[]).push(...value.map((item,index)=>({...annotate(item,record.id,`${record.index}:${key}:${index}`,record.nature),abilityOrigin:record.id,abilityInstance:`${record.index}:${key}:${index}`,abilityNature:record.nature})));
   }else if(!(key in defs))defs[key]=clone(value);
   else conflicts.push({kind:'definition',key,origins:records.filter(r=>key in r.definition).map(r=>r.id)});
  }
  for(const [key,value] of Object.entries(record.passive)){
   (passives[key]||=[]).push({value:clone(value),origin:record.id,instance:`${record.index}:passive:${key}`});
  }
 }
 return {base,sources:[...sources],records,defs,passives,conflicts,
  types:[...new Set(records.flatMap(r=>r.types))],keywords:[...new Set(records.flatMap(r=>r.keywords))],
  rules:records.map(r=>r.rules).filter(Boolean).join('\n\n'),
  abilityOrigins:Object.fromEntries(Object.entries(passives).map(([key,values])=>[key,values.map(v=>v.origin)])),
  abilitySlugs:[...new Set(records.map(r=>r.slug))]};
}
// Callers must select semantics per ability. In particular numeric abilities
// can be additive or replacement; this module deliberately does not guess.
export function passiveInstances(record,key){return record.passives[key]||[];}
export function abilityLayersSerializable(record){return clone(record);}
export function intrinsicModificationLocked(u,A){const c=A.card(u.card),base=A.card(u.finalBorrowed?.base||c.borrowedAbilitySource?.base||c.vivienPhysical||u.card);return !!u.finalTabula||!!A.passives?.[base.slug]?.unmodifiable||['monks_of_kobalsa','the_doom_of_dilmun'].includes(base.slug);}
export function activePrintedSources(s,bearer,A){
 if(A.card(bearer.card).type!=='Minion'||intrinsicModificationLocked(bearer,A))return [];
 return (s.artifacts||[]).filter(a=>a.bearer===bearer.uid&&!a.silenced&&!a.disabled&&A.card(a.card).slug==='the_pallid_bust'&&a.pallidPrintedCard).map(a=>({artifact:a.uid,card:a.pallidPrintedCard}));
}
// This gate describes the rule boundary. It does not itself register Key or
// silently claim that every engine mutation has been wired through it.
const protectedChanges=new Set(['target','damage','destroy','banish','modify','move','impedeMove','impedeAttack','gainLife','loseLife','heal']);
export function siteAbilityCanAffect({originCard,protectedFromSites,change,card}){
 if(!protectedFromSites||!protectedChanges.has(change)||!originCard)return true;
 return card(originCard).type!=='Site';
}
export function keyBearerProtected(s,u,A){
 if(!u||intrinsicModificationLocked(u,A))return false;
 const guard=unitModificationPlan(s,u,A).guard;
 return (s.artifacts||[]).some(a=>a.bearer===u.uid&&!a.silenced&&!a.disabled&&A.card(a.card).slug==='key_to_the_city'&&(!guard||(a.stamp||0)<=guard.timestamp));
}
export function siteEffectAllowed(s,u,change,A,origin=s.eventContext?.abilityOrigin){
 const disabled=u&&(A.disabled?A.disabled(u):!u.fiftyOnslaught&&(u.completionDisabled||u.carryDisabled||u.boundDisabled||u.restraintDisabled||u.bellyDisabled||u.effectDisabled||u.conditionDisabled||(u.mods||[]).some(m=>m.disabled||m.asleep)));
 const natural=!!u&&!disabled&&(u.geometryIgnoreSites||A.card(u.card).slug==='yog_sothoth'&&!u.silenced);
 return siteAbilityCanAffect({originCard:origin,protectedFromSites:natural||keyBearerProtected(s,u,A),change,card:A.card});
}
// A view keeps the carrier's characteristics. The originating printed card is
// metadata, never substituted into `card`, so power/life/type lookups stay on
// the real carrier while rule consumers read this one complete passive object.
export function passiveLayerViews(carrier,record,key=null){
 return record.records.filter(r=>key===null||Object.hasOwn(r.passive,key)).map(r=>({
  source:{...carrier,abilityOrigin:r.id,abilityInstance:r.instanceKey||`${r.index}:printed`,abilityStamp:r.timestamp??carrier.stamp??0},
  origin:r.id,instance:r.instanceKey||`${r.index}:printed`,nature:r.nature||(r.index===0?'printed':'gained'),passive:r.passive,
  value:key===null?r.passive:r.passive[key],
 }));
}
export function evaluatePassiveLayers(carrier,record,key,evaluate){
 return passiveLayerViews(carrier,record,key).map(layer=>evaluate(layer.value,layer.passive,layer.source,layer.instance));
}
// Only operations whose entire effect acts on one identified unit belong here.
// Compound effects (Mortimer also returns its Site; Troll can discard a player
// card) instead gate their individual mutations, not the entire continuation.
export const centralAffectDescriptors={
 unitStep:{change:'move',refs:['step.uid','sourceSelf']},forcedWaterStep:{change:'move',refs:['step.uid']},rapidsPush:{change:'move',refs:['step.uid']},forcedFlyChoice:{change:'move',refs:['step.uid']},
 roadPowerMode:{change:'modify',refs:['step.uid']},collectionTransformUnit:{change:'modify',refs:['step.uid']},
 collectionHybrid:{change:'modify',refs:['selected.uid']},morphPond:{change:'modify',refs:['step.target','selected.uid']},
 undertowChoose:{change:'move',refs:['selected.uid']},dockLure:{change:'move',refs:['selected.uid']},rapidsUnit:{change:'move',refs:['selected.uid']},forcedFlyUnit:{change:'move',refs:['selected.uid']},
 stealthSelf:{change:'modify',refs:['source.uid']},powerSelf:{change:'modify',refs:['source.uid']},
};
export function siteFrameBlocked(s,frame,A){
 const d=centralAffectDescriptors[frame.step.op];if(!d)return false;
 const origin=frame.abilityOrigin||frame.step.abilityOrigin||frame.source.abilityOrigin||frame.source.card;
 for(const ref of d.refs){
  let uid;if(ref==='sourceSelf')uid=frame.step.self?frame.source.uid:null;
  else{const [a,b]=ref.split('.');uid=frame[a]?.[b];}
  if(typeof uid!=='string')continue;
  const u=A.unit(s,uid);if(u&&!siteEffectAllowed(s,u,d.change,A,origin))return true;
 }
 return false;
}
function rawUnitPrintedAbilityRecord(s,u,A){
 if(A.card(u.card).abilityLayerRecord)return A.card(u.card).abilityLayerRecord;
 if(A.card(u.card).printedAbilityRecord)return A.card(u.card).printedAbilityRecord;
 if(u.finalAbilityRecord)return u.finalAbilityRecord;
 const borrowed=u.finalBorrowed||A.card(u.card).borrowedAbilitySource,base=borrowed?.base||u.card;
 const sources=[...(borrowed?[borrowed.source]:[]),...(u.finalAbilitySources||[]).map(v=>typeof v==='string'?v:v.card),...activePrintedSources(s,u,A).map(v=>v.card)];
 const record=buildAbilityRecord(base,sources,A);
 const external=[...(borrowed?[{instance:'borrowed:'+(borrowed.kind||'runtime')+':'+borrowed.source,timestamp:borrowed.stamp??u.stamp}]:[]),...(u.finalAbilitySources||[]).map((v,i)=>typeof v==='string'?{instance:'manual:'+i,timestamp:u.stamp}:{instance:v.uid||'manual:'+i,timestamp:v.stamp??u.stamp}),...activePrintedSources(s,u,A).map(v=>({instance:'artifact:'+v.artifact,timestamp:(s.artifacts||[]).find(a=>a.uid===v.artifact)?.stamp??0}))];
 record.records.forEach((r,i)=>{r.timestamp=i===0?u.stamp:external[i-1]?.timestamp;r.instanceKey=i===0?'printed:'+u.uid:external[i-1]?.instance;});return record;
}
export function unitPrintedAbilityRecord(s,u,A){return filterModificationRecord(rawUnitPrintedAbilityRecord(s,u,A),{intrinsic:intrinsicModificationLocked(u,A),disabled:!!A.disabled?.(u)});}
export function unitModificationPlan(s,u,A){return unitPrintedAbilityRecord(s,u,A).modificationPlan;}
export function unitPassiveLayerViews(s,u,A,key=null){return passiveLayerViews(u,unitPrintedAbilityRecord(s,u,A),key).filter(layer=>!u.silenced||layer.nature==='gained');}
export function pallidPrintedTypes(s,u,A){if(intrinsicModificationLocked(u,A))return [];const allowed=new Set(unitPrintedAbilityRecord(s,u,A).records.map(r=>r.instanceKey));return [...new Set(activePrintedSources(s,u,A).filter(v=>allowed.has('artifact:'+v.artifact)).flatMap(v=>printedMinionTypes(A.card(v.card))))];}
export function keyProvidedMana(s,p,A){
 return (s.artifacts||[]).filter(a=>!a.silenced&&!a.disabled&&A.card(a.card).slug==='key_to_the_city'&&A.unit(s,a.bearer)&&(A.artifactController?A.artifactController(s,a):A.unit(s,a.bearer).controller)===p).length;
}
// Presence is explicitly existential. Numeric/conditional abilities should use
// the full views and their own rule semantics, never this boolean accessor.
export function unitHasPassive(s,u,key,A){return unitPassiveLayerViews(s,u,A,key).some(layer=>!!layer.value);}
// Definitions are read from live sources rather than by replacing a carrier's
// physical card. Gaining a Genesis does not call it: the engine asks for a hook
// only when the corresponding game event actually happens.
export function unitDefinitionLayers(s,u,A){
 const record=unitPrintedAbilityRecord(s,u,A),defs={};
 for(const entry of record.records){
  if(u.silenced&&entry.nature!=='gained')continue;
  for(const [key,value] of Object.entries(entry.definition)){
   if(!Array.isArray(value))continue;
   (defs[key]||=[]).push(...value.map((item,index)=>({...annotate(item,entry.id,`${entry.instanceKey||entry.index}:${key}:${index}`,entry.nature),abilityOrigin:entry.id,abilityInstance:`${entry.instanceKey||entry.index}:${key}:${index}`,abilityNature:entry.nature})));
  }
 }
 return defs;
}
export function unitGainedKeywords(s,u,A){return [...new Set(unitPrintedAbilityRecord(s,u,A).records.filter(r=>r.nature==='gained').flatMap(r=>r.keywords))];}
export function unitGainedMovement(s,u,A){return unitPrintedAbilityRecord(s,u,A).records.filter(r=>r.nature==='gained').reduce((sum,r)=>sum+Number((r.rules.match(/\bMovement \+(\d+)/)||[])[1]||0),0);}
export function unitGainedRange(s,u,A){
 return Math.max(0,...unitPrintedAbilityRecord(s,u,A).records.filter(r=>r.nature==='gained'&&r.keywords.includes('Ranged')).map(r=>Number((r.rules.match(/\bRanged (\d+)/)||[])[1]||1)));
}

export function abilityMinionTypes(s,u,A){
 if(A.unmodifiable?.(u)||A.disabled?.(u))return [];
 const active=unitPassiveLayerViews(s,u,A,'allTypes').some(v=>v.value);
 // Bower cannot undo the earlier all-types application on which it depends.
 const appliedNative=A.card(u.card).slug==='azuridge_caravan'&&u.completionBower;
 return active||appliedNative?allMinionCreatureTypes.filter(t=>!u.completionBower||t!=='Mortal'):[];
}

export function abilityProjectileBarrier(s,at,layer,player,A){
 return s.units.some(u=>!u.dying&&!A.disabled(u)&&u.controller!==player&&(u.layer||'surface')===layer&&A.occupied(u).includes(at)&&unitPassiveLayerViews(s,u,A,'projectileBarrier').some(v=>v.value));
}

export function abilityUnitHasElement(s,u,element,A){
 const c=A.card(u.card),base=(c[element]||0)>0||(c.slug!=='azuridge_caravan'&&c.elements?.includes(element[0].toUpperCase()+element.slice(1)));
 return !!base||!A.disabled(u)&&unitPassiveLayerViews(s,u,A,'allElements').some(v=>v.value);
}

// Rebuild from active source records at every refresh/restore; no discarded
// source can keep protecting the bearer through a cached boolean.
export function restoreModificationEffects(s){for(const u of s.units)restoreProjectedMods(u,s.turn,s.active);}
export function prepareModificationProtection(s,A){
 for(const u of s.units){const p=unitModificationPlan(s,u,A);if(!intrinsicModificationLocked(u,A)&&p.protected){u.gainedModificationGuard=p.guard;u.gainedWardException=p.wardException;}else{delete u.gainedModificationGuard;delete u.gainedWardException;}}
}
export function finishModificationProtection(s,A){
 for(const u of s.units){
  if(!u.gainedModificationGuard)continue;
  const projected=projectProtectedMods(u.mods,u.gainedModificationGuard);u.mods=projected.active;
  if(projected.dormant.length)u.modificationDormantMods=projected.dormant.map(v=>({...v,turn:s.turn}));
  // These are current applications of foreign ongoing modifications. Preserve
  // physical marks (Ward, Stealth), damage, tapping, movement and old restraints.
  u.ongoingPower=0;u.zeroPower=false;u.powerSuppressed=false;u.rangeBonus=0;
  u.effectDisabled=false;u.conditionDisabled=false;u.boundDisabled=false;u.silenced=false;u.completionBower=false;
  const records=unitPrintedAbilityRecord(s,u,A).records;
  u.grantedTypes=pallidPrintedTypes(s,u,A);
  u.grantedKeywords=unitGainedKeywords(s,u,A);
  if(records.some(r=>r.passive.artifactSpellcaster||r.passive.nonOrdinaryCaster||r.passive.spellElement||r.passive.spellElements))u.grantedKeywords.push('Spellcaster');
  u.deniedKeywords=[];
  if(A.abilityMovementAdjustment)u.grantedMovement=A.abilityMovementAdjustment(s,u,A);
  u.grantedRange=unitGainedRange(s,u,A);
 }
}
export function enforceModificationEffect(s,before,frame,A){
 // Expiry, source removal and turn game actions are not new effect grants.
 if(['finishTurn','finishStart','finalKairosReturn'].includes(frame.step.op))return;
 for(const old of before.units){
  if(!old.gainedModificationGuard)continue;
  const live=A.unit(s,old.uid);if(!live||live.dying)continue;
  // Recheck external source activity, but do not let a freshly attempted
  // disable on the protected bearer erase the guard being used to reject it.
  const sourceAPI={...A,disabled:v=>v.uid===live.uid?false:A.disabled(v)};
  const current=unitModificationPlan(s,live,sourceAPI);
  if(current.protected)restoreRejectedModifications(old,live,{wardException:current.wardException});
 }
}

// A lifetime condition belongs to the currently granted ability application,
// independently of its once-per-turn activation key. Observed loss clears only
// that grant's wake state; detach+reattach within one atomic event is unchanged.
export function syncHollowWakeLifetimes(s,A){
 for(const u of s.units){
  const active=new Map(unitPassiveLayerViews(s,u,A,'wakeFromNearbyDeath').filter(l=>l.value).map(l=>[l.instance,l.origin]));
  const prior=u.hollowWakeActiveSources||{},generations=u.hollowWakeGenerations||{};
  for(const [key,origin] of active){
   if(prior[key]!==origin){generations[key]=(generations[key]||0)+1;if(u.awakenedByDeathSources)delete u.awakenedByDeathSources[key];}
  }
  for(const key of Object.keys(u.awakenedByDeathSources||{})){
   if(!active.has(key)||u.awakenedByDeathSourceOrigins?.[key]&&u.awakenedByDeathSourceOrigins[key]!==active.get(key)){
    delete u.awakenedByDeathSources[key];if(u.awakenedByDeathSourceOrigins)delete u.awakenedByDeathSourceOrigins[key];
   }
  }
  if(active.size||Object.keys(prior).length||Object.keys(generations).length){u.hollowWakeActiveSources=Object.fromEntries(active);u.hollowWakeGenerations=generations;}
 }
}
