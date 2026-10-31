// Pure source admission. An admitted grant is an atomic package: its own
// cannot-modify ability cannot retroactively remove the package granting it.
// Source activity is resolved by the caller before this pass.
export function planModificationLayers(records,{intrinsic=false,disabled=false}={}){
 const indexed=records.map((record,index)=>({record,index}));
 const ordered=indexed.filter(v=>v.record.nature==='gained').sort((a,b)=>(a.record.timestamp??0)-(b.record.timestamp??0)||a.index-b.index);
 const accepted=indexed.filter(v=>v.record.nature!=='gained').map(v=>v.record),blocked=[];
 let guard=intrinsic?{intrinsic:true,instance:'intrinsic',timestamp:Number.MIN_SAFE_INTEGER}:null;
 for(const {record} of ordered){
  if(guard){blocked.push(record);continue;}
  accepted.push(record);
  if(!disabled&&record.passive?.unmodifiable)guard={instance:record.instanceKey||String(record.index),origin:record.id,timestamp:record.timestamp??0,wardException:!!record.passive.wardException};
 }
 // Consumers retain original record ordering and stable source identities.
 const admitted=new Set(accepted);
 return {records:records.filter(r=>admitted.has(r)),blocked,guard,protected:!!guard,wardException:!!guard?.wardException};
}
export function filterModificationRecord(record,options){
 const plan=planModificationLayers(record.records,options);
 return {...record,records:plan.records,modificationPlan:{protected:plan.protected,guard:plan.guard,wardException:plan.wardException,blocked:plan.blocked.map(r=>r.instanceKey||String(r.index))}};
}
// Changes to these game facts are not modifications of card characteristics or
// ability/status grants. In particular protection is not damage immunity.
export const modificationGameFacts=Object.freeze(['at','layer','geometryLocations','damage','lethal','dying','destination','tapped','notRest','interactedTurn']);
// Only a new effect application is rejected. Expiration/source removal remains
// possible; a lost source never survives as a frozen, self-protecting grant.
export function restoreRejectedModifications(before,after,{wardException=false}={}){
 const props=['card','owner','controller','originalCard','mods','ward','stealth','iceTurns','iceMagicProtection','boundSpellcaster','cocoon','effectDisabled','carryDisabled','bellyDisabled','conditionDisabled','boundDisabled','restraintDisabled','addedDeath','copyEvil','copyDuel','copyDuels'];
 for(const key of props){
  // Consuming an existing Ward is a game event, not a new status grant.
  if(key==='ward'&&(wardException||before.ward&&!after.ward))continue;
  if(Object.hasOwn(before,key))after[key]=structuredClone(before[key]);else delete after[key];
 }
 return after;
}

export function projectProtectedMods(mods,guard){
 const active=[],dormant=[];
 for(const mod of mods||[]){
  // Older one-shot ability grants share the ability-adding layer. Power,
  // subtype and ability-removing components are independently suppressed.
  const projection={...mod};
  for(const key of ['power','powerMultiplier','set','types','replaceTypes','silenced','disabled','asleep','loseStealth'])delete projection[key];
  if(mod.keyword&&(mod.abilityStamp??0)>guard.timestamp)delete projection.keyword;
  const semantic=Object.keys(projection).some(k=>!['end','until','abilityStamp','whileVoid'].includes(k));
  const unchanged=JSON.stringify(projection)===JSON.stringify(mod);
  if(unchanged){active.push(mod);continue;}
  if(semantic)active.push(projection);
  dormant.push({mod:structuredClone(mod),projection:semantic?structuredClone(projection):null});
 }
 return {active,dormant};
}
export function restoreProjectedMods(unit,turn,active){
 const mods=[...unit.mods||[]];
 for(const entry of unit.modificationDormantMods||[]){
  if(entry.projection){const key=JSON.stringify(entry.projection),i=mods.findIndex(m=>JSON.stringify(m)===key);if(i>=0)mods.splice(i,1);}
  const expired=entry.mod.end!==undefined&&entry.mod.end<turn||entry.mod.until===active&&turn>entry.turn;
  if(!expired)mods.push(entry.mod);
 }
 unit.mods=mods;delete unit.modificationDormantMods;
}
