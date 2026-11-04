import {catalogAuraPhysicalShape} from './catalog-auras.js';
import {allMinionCreatureTypes} from './final-ability-layers.js';
import {geometryLocationRecords,geometryForcedDiveOptions,applyGeometryForcedDive} from './final-geometry.js';
import {spatialForcedSubmergeAllowed} from './borrowed-spatial.js';
export const finalFloodDefinitions={the_flood:{cast:[{op:'finalFloodChoose',picks:[]}]}};
export const finalFloodOperations=['finalFloodChoose','finalFloodConfirm','finalFloodDive','finalFloodApply'];
export function registerPermanentRealmFlood(s,source,controller){
 const effect={op:'realmFlood',stamp:s.next++,abilityOrigin:source.abilityOrigin||source.card,controller};
 (s.ongoingEffects||(s.ongoingEffects=[])).push(effect);return effect;
}
const minions=(s,A)=>s.units.filter(u=>!u.dying&&A.card(u.card).type==='Minion');
const types=(u,A)=>[...new Set(A.unitTypes(u))].filter(type=>allMinionCreatureTypes.includes(type));
export function floodChoices(s,picks,A){
 const chosen=picks.map(uid=>minions(s,A).find(u=>u.uid===uid));
 if(chosen.some(u=>!u))throw Error('The Flood saved minion has left the realm');
 const used=new Set();for(const u of chosen){const names=types(u,A);if(!names.length||names.some(t=>used.has(t)))throw Error('The Flood saved minions must have nonempty disjoint types');names.forEach(t=>used.add(t));}
 return minions(s,A).filter(u=>!picks.includes(u.uid)&&types(u,A).length&&!types(u,A).some(t=>used.has(t)));
}
const activeGrowth=u=>u.geometryLocations&&u.geometryGrowing;
function projectedFlood(s,source,p,A){
 const preview=structuredClone(s),priorChoice=JSON.stringify(preview.choice||null);
 registerPermanentRealmFlood(preview,source,p);A.refreshContinuous(preview);
 if(preview.choice&&JSON.stringify(preview.choice)!==priorChoice){const error=Error('The Flood projection needs a derived world choice: '+preview.choice.title);error.code='UNSUPPORTED_FLOOD_PROJECTED_CHOICE';throw error;}
 return {state:preview,api:A.ruleAPI(preview)};
}
function diveOptions(s,u,p,A){if(!u||u.dying||A.unmodifiable(u)||!A.fiftyForceAllowed(s,u,p,A))return [];return geometryForcedDiveOptions(s,u,A).filter(o=>spatialForcedSubmergeAllowed(s,{...u,at:o.value.from.at,layer:o.value.from.layer},o.value.to,A));}
export function canSubmerge(s,u,p,A,isUnit){
 const parts=geometryLocationRecords(u);
 if(!parts.length||parts.some(loc=>loc.layer!=='surface'||!s.board[loc.at]||!A.waterSite(s,loc.at,A.card)))return false;
 if(isUnit&&(!A.fiftyForceAllowed(s,u,p,A)||!spatialForcedSubmergeAllowed(s,u,{...u,layer:'below'},A)))return false;
 return parts.every(loc=>A.canEnterOnGround(s,{...u,mods:u.mods||[]},loc,{at:loc.at,layer:'below'},A.card,A.keywords));
}
export function resolveFinalFlood(s,frame,A){
 const {step,source,controller:p,selected}=frame;if(!finalFloodOperations.includes(step.op))return false;
 const q=steps=>A.queueEffects(s,steps,source,p,frame.effectCard);
 const picks=step.picks||[];
 let projected;const preview=()=>projected||(projected=projectedFlood(s,source,p,A));
 if(step.op==='finalFloodChoose'){
  if(selected==='reset'){q([{op:'finalFloodChoose',picks:[]}]);return true;}
  const plan=preview(),options=floodChoices(plan.state,picks,plan.api);
  if(selected===undefined){
   if(!options.length){q([{op:'finalFloodConfirm',picks}]);return true;}
   s.choice={player:p,title:'The Flood · 每種型別保留一名僕從（不可共用型別）',options:[...options.map(u=>({label:A.card(u.card).name+' · '+types(u,plan.api).join(' / '),value:u.uid})),...(picks.length?[{label:'重新選擇全部例外',value:'reset'}]:[])],frame};return true;
  }
  const u=options.find(u=>u.uid===selected);if(!u)throw Error('The Flood exception is no longer legal');q([{op:'finalFloodChoose',picks:[...picks,u.uid]}]);return true;
 }
 if(step.op==='finalFloodConfirm'){
  const plan=preview();if(floodChoices(plan.state,picks,plan.api).length)throw Error('The Flood must save another compatible minion type');
  if(selected===undefined){s.choice={player:p,title:'The Flood · 確認保留 '+picks.length+' 名僕從',options:[{label:'確認例外並結算洪水',value:true},{label:'重新選擇',value:false}],frame};return true;}
  if(selected===false){q([{op:'finalFloodChoose',picks:[]}]);return true;}
  if(selected!==true)throw Error('Invalid Flood confirmation');q([{op:'finalFloodDive',picks,dives:{}}]);return true;
 }
 if(step.op==='finalFloodDive'){
  const dives=step.dives||{},saved=new Set(picks),plan=preview();
  const candidates=plan.state.units.filter(u=>!saved.has(u.uid)&&activeGrowth(u)&&!Object.hasOwn(dives,u.uid)).map(u=>({u,options:diveOptions(plan.state,u,p,plan.api)})).filter(v=>v.options.length);
  if(!candidates.length){q([{op:'finalFloodApply',picks,dives}]);return true;}
  const {u,options}=candidates[0];
  if(selected===undefined){s.choice={player:p,title:'The Flood · '+A.card(u.card).name+' · 選擇下潛的擬足',options:options.map(o=>({label:o.label,value:{uid:u.uid,move:o.value}})),frame};return true;}
  if(selected?.uid!==u.uid||!options.some(o=>JSON.stringify(o.value)===JSON.stringify(selected.move)))throw Error('The Flood pseudopod choice is no longer legal');
  q([{...step,dives:{...dives,[u.uid]:selected.move}}]);return true;
 }
 // Affinity changes alone do not split a Storyline event. Commit permanent
 // flooding and simultaneous forced movement in this one frame, then permit
 // ordinary state-based checks and entry/death triggers to run.
 if(!step.floodApplied){
  const plan=preview();if(floodChoices(plan.state,picks,plan.api).length)throw Error('The Flood exception set is incomplete');
  registerPermanentRealmFlood(s,source,p);A.refreshContinuous(s);
  if(s.choice){q([{...step,floodApplied:true}]);return true;}
 }
 const saved=new Set(picks),moved=new Set();
 for(const [uid,move] of Object.entries(step.dives||{})){const u=A.unit(s,uid);if(!diveOptions(s,u,p,A).some(o=>JSON.stringify(o.value)===JSON.stringify(move)))throw Error('The Flood pseudopod choice is no longer legal');applyGeometryForcedDive(u,move);u.notRest=true;u.burrowedSafely=false;moved.add(uid);}
 for(const u of s.units)if(!u.dying&&A.card(u.card).type==='Minion'&&!saved.has(u.uid)&&!activeGrowth(u)&&canSubmerge(s,u,p,A,true)){u.layer='below';u.notRest=true;u.burrowedSafely=false;moved.add(u.uid);}
 for(const o of s.artifacts||[]){
  if(moved.has(o.uid))continue;
  const bearer=o.bearer&&A.unit(s,o.bearer);
  if(bearer&&moved.has(bearer.uid))continue; // normal equipment following
  if(canSubmerge(s,o,p,A,false)){o.bearer=null;o.layer='below';o.notRest=true;}
 }
 for(const aura of s.auras||[])if(!s.units.some(u=>u.uid===aura.uid)&&canSubmerge(s,catalogAuraPhysicalShape(aura,A.inside),p,A,false)){aura.layer='below';aura.notRest=true;}
 return true;
}
