// One physical Artifact has simultaneous unit/artifact indexes while animated.
// A self bearer is an ability subject, not an actual carried-object relation.
import {carryChoices,boardPassenger,dropPassenger} from './transport.js';
const clone=x=>structuredClone(x);
export function animatedArtifactCard(id,power,A){const c=A.card(id);return A.runtimeCard(id,'artifact_animation_'+power,{slug:c.slug,type:'Minion',artifactUnit:true,simultaneousTypes:['Artifact','Minion'],subtypes:[...new Set([...c.subtypes,'Automaton'])],attack:power,defense:power,playable:c.playable});}
export const externalArtifactBearer=a=>a.artifactAnimation?a.artifactAnimation.externalBearer:a.bearer;
export const isAnimatedArtifact=a=>!!a?.artifactAnimation;
export function animateArtifact(s,a,{source,controller=null,power,selfBearer=true,kind='grosse',key},A){
 const wasUnit=s.units.includes(a),wasArtifact=s.artifacts.includes(a);
 if(!wasArtifact&&!(wasUnit&&A.card(a.card).artifactUnit))throw Error('Animated artifact is no longer in the realm');
 if(!Number.isFinite(power)||power<0)throw Error('Invalid animated power');
 const instance=key||kind+':'+source.uid;
 if(!a.artifactAnimation){
  const original=a.originalCard||a.card,carrier=A.unit(s,a.bearer);
  a.artifactAnimation={card:original,controller:a.controller??a.owner,externalBearer:a.bearer||null,wasUnit,wasArtifact,originalCard:a.originalCard,effects:[]};
  a.originalCard=original;a.mods=a.mods||[];a.damage=a.damage||0;a.tapped=!!a.tapped;a.born=a.born??0;a.layer=a.layer||'surface';if(!wasUnit)a.justEntered=false;a.card=animatedArtifactCard(original,power,A);
  a.observedPosition={at:a.at,layer:a.layer,cells:A.occupied(a)};a.observedTapped=!!a.tapped;
  if(!wasUnit)s.units.push(a);if(!wasArtifact)s.artifacts.push(a);a.bearer=null;
  if(carrier&&carryChoices(s,carrier,A).some(u=>u.uid===a.uid))boardPassenger(carrier,a);
 }
 const animation=a.artifactAnimation,prior=animation.effects.find(e=>e.key===instance),effect={key:instance,kind,source:source.uid,controller,power,selfBearer,stamp:prior?.stamp??s.next++};
 animation.effects=animation.effects.filter(e=>e.key!==instance);animation.effects.push(effect);applyArtifactAnimation(a,A);return a;
}
function applyArtifactAnimation(a,A){
 const effects=[...a.artifactAnimation.effects].sort((a,b)=>a.stamp-b.stamp),latest=effects.at(-1),control=[...effects].reverse().find(e=>e.controller!==null);
 if(!latest)return;
 a.card=animatedArtifactCard(a.artifactAnimation.card,latest.power,A);a.bearer=effects.some(e=>e.selfBearer)?a.uid:null;
 a.controller=control?.controller??a.artifactAnimation.controller;
}
export function endArtifactAnimation(s,a,A){
 const animation=a.artifactAnimation;if(!animation)return;
 for(const carried of s.artifacts||[])if(carried.uid!==a.uid&&externalArtifactBearer(carried)===a.uid){carried.bearer=null;carried.at=a.at;carried.layer=a.layer||'surface';}
 if(!animation.wasUnit){dropPassenger(a);s.units=s.units.filter(u=>u.uid!==a.uid);}if(!animation.wasArtifact)s.artifacts=s.artifacts.filter(o=>o.uid!==a.uid);a.card=animation.card;a.controller=animation.controller;a.bearer=null;
 for(const key of (animation.wasUnit?['artifactAnimation']:['originalCard','artifactAnimation','damage','tapped','mods','observedPosition','observedTapped','justEntered','ward','lethal']))delete a[key];if(animation.originalCard)a.originalCard=animation.originalCard;else delete a.originalCard;
}
export function refreshArtifactAnimations(s,A,continuous=[]){
 const desired=new Set(continuous.map(e=>e.key||e.kind+':'+e.source.uid+':'+e.artifact.uid));
 for(const a of [...s.artifacts||[]])if(a.artifactAnimation){
  a.artifactAnimation.effects=a.artifactAnimation.effects.filter(e=>e.kind==='grosse'?!!A.unit(s,e.source):desired.has(e.key));
 }
 for(const claim of continuous)animateArtifact(s,claim.artifact,{...claim,key:claim.key||claim.kind+':'+claim.source.uid+':'+claim.artifact.uid},A);
 for(const a of [...s.artifacts||[]])if(a.artifactAnimation){if(a.artifactAnimation.effects.length)applyArtifactAnimation(a,A);else endArtifactAnimation(s,a,A);}
}
export function artifactAnimationLeaves(s,u){if(!u.artifactAnimation)return;s.artifacts=(s.artifacts||[]).filter(a=>a.uid!==u.uid);}
export function restoreArtifactAnimations(s,A){
 const seen=new Set();function register(id){const m=/^runtime:artifact_animation_([0-9]+(?:\.[0-9]+)?):(.+)$/.exec(id);if(m)animatedArtifactCard(m[2],Number(m[1]),A);}
 const visit=value=>{if(typeof value==='string'){register(value);return;}if(!value||typeof value!=='object'||seen.has(value))return;seen.add(value);for(const child of Object.values(value))visit(child);};visit(s);
 for(const a of s.artifacts||[])if(a.artifactAnimation){const existing=s.units.find(u=>u.uid===a.uid);if(existing)Object.assign(a,clone(existing));applyArtifactAnimation(a,A);s.units=s.units.filter(u=>u.uid!==a.uid);s.units.push(a);}
}
export const artifactIsCarriedBy=(a,uid)=>a.bearer===uid&&(!a.artifactAnimation||a.uid!==uid);
