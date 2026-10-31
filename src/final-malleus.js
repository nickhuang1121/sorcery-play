import {blastedOakTargets,blastedOakTargetRank} from './final-passives.js';
import {compositeMagicSlugs,compositeMagicPlans,graspMagicTargets,meteorDeclarationCandidates,magicDeclarationTargets} from './magic-declarations.js';
import {magicSelectorProfiles} from './selector-semantics.js';
import {geometryLocationRecords} from './final-geometry.js';
export const malleusDefinitions={the_malleus_maleficarum:{activated:[{label:'每回合一次：持有者從 collection 施放針對敵方 Spellcaster 的 Magic',bearerSource:true,bearerGranted:true,steps:[{op:'finalMalleus'}]}]}};
export const malleusOperations=['finalMalleus'];
const permission=(s,a)=>(s.collectionPermissions||[]).find(e=>e.uid===a?.permit&&e.malleus);
const active=(o,A)=>o&&!o.dying&&!o.silenced&&!o.disabled&&!A.disabled(o);
export function enemyMalleusSpellcasters(s,p,A){
 const out=[];
 for(const u of s.units)if(!u.dying&&u.controller!==p&&(A.card(u.card).type==='Avatar'||A.keywords(u).includes('Spellcaster')))out.push({...u,malleusLocations:geometryLocationRecords(u)});
 for(const o of s.artifacts||[])if(!o.disabled&&A.artifactController(s,o)!==p&&A.casterPermissionAllows(s,o,null))out.push({...o,malleusLocations:geometryLocationRecords(o)});
 for(const [at,o] of s.board.entries())if(o&&o.controller!==p&&active(o,A)&&(A.sitePassives[A.card(o.card).slug]?.siteSpellElements||o.towerMagicTurn===s.turn))out.push({...o,at,uid:'site:'+at,malleusLocations:[{at,layer:'surface'},{at,layer:'below'}]});
 return out;
}
export function malleusTargetQualifies(s,p,target,A){
 if(!target||typeof target!=='object')return false;
 return enemyMalleusSpellcasters(s,p,A).some(u=>target.entity==='site'?u.malleusLocations.some(loc=>loc.at===target.at):target.entity==='location'?u.malleusLocations.some(loc=>loc.at===target.at&&loc.layer===(target.layer||'surface')):target.uid===u.uid);
}
const legacyKinds={arc_lightning:'unit',betrayal:'unit',cast_into_exile:'unit',fatality:'unit',freeze:'unit',immolation:'unit',mesmerism:'unit',shrink:'unit',zap:'unit',lightning_bolt:'location',minor_explosion:'location',mortality:'location',exorcism:'location',teleport:'site'};
function legacyTarget(c,value,layer='surface'){const kind=legacyKinds[c.slug];return kind==='unit'?{entity:'unit',uid:value}:kind==='site'?{entity:'site',at:value?.at}:kind==='location'?{entity:'location',at:value,layer}:null;}
export function malleusDeclaredTargets(c,a,declared,caster=null){
 if(a.magicDeclaration)return magicDeclarationTargets(a.magicDeclaration);
 if(a.chainTargets)return a.chainTargets;
 if(a.remainingSecond)return [declared,a.remainingSecond];
 if(legacyKinds[c.slug])return [legacyTarget(c,a.target,caster?.layer||a.casterLocation?.layer||a.casterLayer||'surface')];
 return magicSelectorProfiles[c.slug]?.primary?.role==='target'?[declared]:[];
}
function chainOptions(s,p,c,caster,a,picks,A){
 const last=picks.length&&A.unit(s,picks[picks.length-1].uid),extra=2*Math.max(0,picks.length);
 if(!A.canPaySpell(s,p,c,undefined,caster,a.payment,extra,a.layer||'surface',a))return [];
 let options=A.selectEffects(s,{source:caster,controller:p,effectCard:c.id},{kind:'unit',...(picks.length?{}:{nearby:true})});
 if(picks.length)options=options.filter(o=>!picks.some(v=>v.uid===o.value.uid)&&last&&A.nearby(last.at,A.unit(s,o.value.uid).at));
 return blastedOakTargets(s,options,{spell:true},A);
}
export function malleusChainCanFinish(s,p,c,caster,a,picks,A){
 if(picks.some(v=>malleusTargetQualifies(s,p,v,A)))return true;
 const seen=new Set();
 function walk(chosen){
  const key=chosen.map(v=>v.uid).sort().join(',')+'|'+chosen.at(-1)?.uid;if(seen.has(key))return false;seen.add(key);
  const options=chainOptions(s,p,c,caster,a,chosen,A),equivalent=new Set();
  for(const option of options){if(malleusTargetQualifies(s,p,option.value,A))return true;const u=A.unit(s,option.value.uid),group=u.at+':'+(u.layer||'surface')+':'+blastedOakTargetRank(s,option.value,A);if(equivalent.has(group))continue;equivalent.add(group);if(walk([...chosen,option.value]))return true;}
  return false;
 }
 return walk(picks);
}
function secondOptions(s,p,c,caster,first,A){return blastedOakTargets(s,A.secondTargetOptions(s,{source:caster,controller:p,effectCard:c.id},first,A),{spell:true},A);}
function meteorCanQualify(s,frame,picks,p,A){
 if(picks.some(v=>malleusTargetQualifies(s,p,v,A)))return true;
 if(picks.length>=3)return false;
 return meteorDeclarationCandidates(s,frame,picks,A).some(o=>meteorCanQualify(s,frame,[...picks,o.value],p,A));
}
function graspActors(s,p,A){return s.units.filter(u=>!u.dying&&u.controller===p&&(u.layer||'surface')==='below'&&A.regionNames(s,u).has('underground'));}
export function malleusActionCanFinish(s,a,A){
 const p=a.player,c=A.castingCard(s,a),caster=A.spellcaster(s,a.caster,a.casterLayer,a.casterLocation);if(!c||c.type!=='Magic'||!caster)return false;
 const frame={source:caster,controller:p,effectCard:c.id};
 if(c.slug==='chain_lightning')return malleusChainCanFinish(s,p,c,caster,a,[],A);
 if(compositeMagicSlugs.includes(c.slug))return compositeMagicPlans(s,c.slug,caster,p,A).some(o=>malleusTargetQualifies(s,p,o.value,A));
 if(c.slug==='grasping_ground')return graspActors(s,p,A).some(u=>graspMagicTargets(s,caster,u,p,A).some(o=>malleusTargetQualifies(s,p,o.value,A)));
 if(c.slug==='meteor_shower')return meteorCanQualify(s,frame,[],p,A);
 if(['swap','backstab'].includes(c.slug)){
  const first=A.definitions[c.slug].cast[0],options=A.selectEffects(s,frame,first.select).filter(o=>secondOptions(s,p,c,caster,o.value,A).length);return blastedOakTargets(s,options,{spell:true},A).some(o=>{const second=secondOptions(s,p,c,caster,o.value,A);return malleusTargetQualifies(s,p,o.value,A)||second.some(v=>malleusTargetQualifies(s,p,v.value,A));});
 }
 if(legacyKinds[c.slug])return malleusTargetQualifies(s,p,legacyTarget(c,a.target,caster.layer||'surface'),A);
 const first=A.definitions[c.slug]?.cast?.[0];if(!first?.select||magicSelectorProfiles[c.slug]?.primary?.role!=='target')return false;
 const options=blastedOakTargets(s,A.selectEffects(s,frame,first.select),{spell:true},A);
 return options.some(o=>malleusTargetQualifies(s,p,o.value,A));
}
export function filterMalleusCastActions(s,actions,A){if(s.malleusPreview)return actions;return actions.filter(a=>{const e=permission(s,a);return !e||!e.consumed&&malleusActionCanFinish(s,a,A);});}
export function finalMalleusAvailable(s,object,p,A){
 if(s.malleusPreview||!active(object,A)||object.finalMalleusUsedTurn===s.turn)return false;
 const bearer=A.unit(s,object.bearer);if(!bearer||bearer.dying||bearer.controller!==p||A.disabled(bearer)||s.active!==p)return false;
 const preview=structuredClone(s);Object.assign(preview,{malleusPreview:true,choice:null,pending:null,active:p,phase:'main'});
 const e={uid:'malleus-preview',player:p,caster:bearer.uid,filter:{type:'Magic'},zone:'collection',allowSilencedCaster:true,malleus:true};(preview.collectionPermissions||(preview.collectionPermissions=[])).push(e);
 return A.legalActions(preview,p).some(a=>a.type==='cast'&&a.permit===e.uid&&malleusActionCanFinish(preview,a,A));
}
export function malleusArtifactAbilityAllowed(s,object,ability,p,A){return ability.steps[0]?.op!=='finalMalleus'||finalMalleusAvailable(s,object,p,A);}
export function resolveMalleus(s,frame,A){
 if(frame.step.op!=='finalMalleus')return false;
 const object=s.artifacts.find(o=>o.uid===frame.step.object)||s.artifacts.find(o=>o.bearer===frame.source.uid&&A.card(o.card).slug==='the_malleus_maleficarum');
 if(!object||!finalMalleusAvailable(s,object,frame.controller,A))return true;
 const bearer=A.unit(s,object.bearer);A.queueEffects(s,[{op:'collectionPermit',filter:{type:'Magic'},malleus:true,malleusObject:object.uid,title:'The Malleus Maleficarum'}],bearer,frame.controller,object.card,{scope:frame.zoneAccessScope||s.zoneAccessScope});return true;
}
export function validateMalleusSpell(s,a,declared,A){
 const e=permission(s,a);if(!e)return true;
 const c=A.castingCard(s,a);if(e.consumed||!c||c.type!=='Magic'||!malleusDeclaredTargets(c,a,declared,A.spellcaster(s,a.caster,a.casterLayer,a.casterLocation)).some(t=>malleusTargetQualifies(s,a.player,t,A)))throw Error('Malleus requires a Magic target that is an enemy Spellcaster or their location/site');
 return true;
}
export function commitMalleusSpell(s,a){const e=permission(s,a);if(e){e.consumed=true;const object=s.artifacts.find(o=>o.uid===e.malleusObject);if(object)object.finalMalleusUsedTurn=s.turn;}}
export function restrictMalleusChoice(s,choice,A){
 const step=choice?.frame?.step,a=step?.action,e=permission(s,a);if(!e||!choice)return choice;
 const p=a.player,c=A.castingCard(s,a),caster=A.spellcaster(s,a.caster,a.casterLayer,a.casterLocation);if(!c||!caster)return {...choice,options:choice.options.filter(o=>o.value===null)};
 const qualifies=t=>malleusTargetQualifies(s,p,t,A),op=step.op;
 const keep=value=>{
  if(value===null)return true;
  if(c.slug==='chain_lightning'){
   const picks=step.targets||[];if(value==='commit')return picks.some(qualifies);
   return value?.entity==='unit'&&malleusChainCanFinish(s,p,c,caster,a,[...picks,value],A);
  }
  if(c.slug==='meteor_shower'){
   const picks=step.sites||[];if(value==='commit')return picks.some(qualifies);
   return value?.entity==='site'&&meteorCanQualify(s,choice.frame,[...picks,value],p,A);
  }
  if(c.slug==='grasping_ground'){
   const plans=step.plans||[];if(plans.some(plan=>qualifies(plan.target)))return true;
   if(value==='commit')return false;
   if(typeof value==='object'&&qualifies(value))return true;
   return (step.actors||[]).slice((step.index||0)+1).some(id=>graspMagicTargets(s,choice.frame.source,A.unit(s,id),p,A).some(o=>qualifies(o.value)));
  }
  if(compositeMagicSlugs.includes(c.slug)){
   if(op==='magicDeclareComposite')return qualifies(value);
   return value?.uid&&compositeMagicPlans(s,c.slug,caster,p,A).some(plan=>plan.ally===value.uid&&qualifies(plan.value));
  }
  if(['swap','backstab'].includes(c.slug)){
   if(op==='remainingDeclare')return qualifies(step.first)||qualifies(value);
   const second=secondOptions(s,p,c,caster,value,A);return second.length&&(qualifies(value)||second.some(o=>qualifies(o.value)));
  }
  return qualifies(value);
 };
 return {...choice,options:choice.options.filter(o=>keep(o.value))};
}
