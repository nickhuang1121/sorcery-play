// Copy printed characteristics without copying a physical card's identity.
// This leaf module deliberately imports no engine/registry modules.
export function finalArchivePrintedCard(id,A){const seen=new Set();while(A.card(id).finalPhysicalBase&&!seen.has(id)){seen.add(id);id=A.card(id).finalPhysicalBase;}return id;}

export const finalArchiveEffectApplies=(effect,unit)=>(!effect.archivedTargets||effect.archivedTargets.includes(unit.uid))&&!effect.excludedTargets?.includes(unit.uid);

export function archivePhysicalCard(id,uid,A){const c=A.card(id);return A.runtimeCard(id,'archive_'+encodeURIComponent(uid),{slug:c.slug,playable:c.playable,finalPhysicalUid:uid,finalPhysicalBase:id});}
export function registerArchiveRuntimeCard(id,A){
 const m=/^runtime:([^:]+):(.+)$/.exec(id);if(!m)return null;
 if(m[1].startsWith('archive_'))return archivePhysicalCard(m[2],decodeURIComponent(m[1].slice(8)),A);
 if(m[1]==='altar_spent'){const c=A.card(m[2]);return A.runtimeCard(m[2],'altar_spent',{slug:c.slug,playable:c.playable,finalAltarSpent:true});}
 if(m[1]==='gargoyle_form'){const c=A.card(m[2]);return A.runtimeCard(m[2],'gargoyle_form',{slug:c.slug,playable:c.playable,type:'Artifact',subtypes:['Monument'],attack:0,defense:0});}
 if(m[1]==='final_gargoyle_monument')return A.runtimeCard(m[2],'final_gargoyle_monument',{type:'Artifact',subtypes:['Monument'],attack:0,defense:0});
 return null;
}
