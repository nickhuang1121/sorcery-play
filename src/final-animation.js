import {gainedAbilityActive} from './ability-sources.js';
// Enchantress animates one physical Aura. The same object is indexed as an Aura
// and a unit; restore re-establishes object identity after JSON serialization.
import {setFixedGeometry} from './final-geometry.js';
export const animationPassives={enchantress:{finalAnimation:true}};
export const animationOperations=['finalAnimateAura','finalResolveCommittedSpell'];
const baseId=u=>u.finalAuraAnimation?.card||u.originalCard||u.card;
function animationCard(id,A){const c=A.card(id);return A.runtimeCard(id,'aura_minion',{slug:c.slug,type:'Minion',category:'Spell',attack:c.cost,defense:c.cost,auraUnit:true});}
export function animationTargets(s,source,A){return (s.auras||[]).filter(a=>!a.dying&&A.regionsOverlap(s,source,{...a,size:a.singleSite?1:2})&&A.canTarget(s,source.controller,a,source)).map(a=>({label:A.card(baseId(a)).name,value:{entity:'aura',uid:a.uid}}));}
export function queueAnimationCast(s,p,payload,A){
 const source=s.units.find(u=>u.controller===p&&gainedAbilityActive(s,u,'enchantress',A));if(!source)return false;
 A.queueEffects(s,[{op:'finalResolveCommittedSpell',payload}],payload.castingUnit,p,payload.card);
 A.queueEffects(s,[{op:'finalAnimateAura',optional:true,select:{kind:'finalAnimateAura'}}],source,p,source.card);return true;
}
export function selectAnimation(s,frame,filter,A){return filter.kind==='finalAnimateAura'?animationTargets(s,frame.source,A):null;}
export function resolveAnimation(s,frame,A){
 if(frame.step.op==='finalResolveCommittedSpell'){A.resolveCommittedSpell(s,frame.step.payload);return true;}
 if(frame.step.op!=='finalAnimateAura')return false;
 const aura=(s.auras||[]).find(a=>a.uid===frame.selected?.uid);if(!aura||!animationTargets(s,frame.source,A).some(o=>o.value.uid===aura.uid))return true;
 if(!aura.finalAuraAnimation){const original=aura.card;aura.finalAuraAnimation={card:original,until:frame.controller};aura.card=animationCard(original,A);aura.originalCard=original;aura.mods=aura.mods||[];aura.damage=0;aura.tapped=false;aura.born=aura.born??0;aura.size=aura.singleSite?1:2;if(aura.wallTo!==undefined){setFixedGeometry(aura,[aura.at,aura.wallTo],!!aura.geometryWrap);delete aura.size;}aura.ward=!!aura.ward;aura.layer=aura.layer||'surface';aura.observedPosition={at:aura.at,layer:aura.layer,cells:A.occupied(aura)};aura.observedTapped=false;s.units.push(aura);}
 else aura.finalAuraAnimation.until=frame.controller;
 return true;
}
export function restoreAnimations(s,A){
 const seen=new Set();const visit=value=>{if(typeof value==='string'){const m=/^runtime:aura_minion:(.+)$/.exec(value);if(m)animationCard(m[1],A);return;}if(!value||typeof value!=='object'||seen.has(value))return;seen.add(value);for(const child of Object.values(value))visit(child);};visit(s);

 for(const aura of s.auras||[]){if(!aura.finalAuraAnimation)continue;animationCard(aura.finalAuraAnimation.card,A);const live=s.units.find(u=>u.uid===aura.uid);if(live){Object.assign(aura,live);s.units=s.units.map(u=>u.uid===aura.uid?aura:u);}else s.units.push(aura);if(aura.wallTo!==undefined&&aura.geometryFixedCells){const cells=A.occupied(aura);aura.wallTo=cells.find(at=>at!==aura.at)??aura.wallTo;}}
}
export function animationLeaves(s,u){if(!u.finalAuraAnimation)return;s.auras=(s.auras||[]).filter(a=>a.uid!==u.uid);}
export function expireAnimations(s,p){
 for(const aura of s.auras||[]){if(aura.finalAuraAnimation?.until!==p)continue;
  for(const a of s.artifacts||[])if(a.bearer===aura.uid){a.bearer=null;a.at=aura.at;a.layer=aura.layer||'surface';}
  s.units=s.units.filter(u=>u.uid!==aura.uid);aura.card=aura.finalAuraAnimation.card;delete aura.originalCard;delete aura.finalAuraAnimation;delete aura.geometryFixedCells;delete aura.geometryFixedAnchor;delete aura.geometryFixedOffsets;delete aura.size;delete aura.damage;delete aura.mods;delete aura.tapped;delete aura.ward;
 }
}
export function registerAuraAnimationCard(base,A){return animationCard(base,A);}
