import {canSubmerge} from './final-flood.js';
import {geometryLocationRecords,geometryForcedDiveOptions,applyGeometryForcedDive} from './final-geometry.js';
import {spatialForcedSubmergeAllowed} from './borrowed-spatial.js';
import {catalogAuraPhysicalShape} from './catalog-auras.js';
const growth=u=>u.geometryLocations&&u.geometryGrowing;
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function affected(s,source,u,A){return geometryLocationRecords(u).some(loc=>loc.layer==='surface'&&s.board[loc.at]&&A.inside(source,loc.at));}
function dives(s,u,p,A){if(!u||u.dying||A.unmodifiable(u)||!A.fiftyForceAllowed(s,u,p,A))return [];return geometryForcedDiveOptions(s,u,A).filter(o=>spatialForcedSubmergeAllowed(s,{...u,at:o.value.from.at,layer:o.value.from.layer},o.value.to,A));}
// Continue the real, already-resolved terrain event. No forecast, hidden draw,
// or RNG replay is used to obtain the actual water/land state for this choice.
export function resolveCatalogAuraSubmerge(s,frame,A){
 const {step,source,controller:p,selected}=frame,planned=step.catalogDives||{};
 const applies=u=>step.onlyUid?u.uid===step.onlyUid:affected(s,source,u,A);
 const candidates=s.units.filter(u=>!u.dying&&A.card(u.card).type==='Minion'&&growth(u)&&applies(u)&&!Object.hasOwn(planned,u.uid)).map(u=>({u,options:dives(s,u,p,A)})).filter(v=>v.options.length);
 if(candidates.length){
  const {u,options}=candidates[0];
  if(selected===undefined){s.choice={player:p,title:A.card(frame.effectCard).name+' · '+A.card(u.card).name+' · 選擇下潛的擬足',options:options.map(o=>({label:o.label,value:{uid:u.uid,move:o.value}})),frame};return true;}
  if(selected?.uid!==u.uid||!options.some(o=>equal(o.value,selected.move)))throw Error('Aura forced Submerge pseudopod choice is no longer legal');
  A.queueEffects(s,[{...step,catalogDives:{...planned,[u.uid]:selected.move}}],source,p,frame.effectCard);return true;
 }
 const moved=new Set();
 for(const [uid,move]of Object.entries(planned)){const u=A.unit(s,uid);if(!u||!applies(u)||!dives(s,u,p,A).some(o=>equal(o.value,move)))throw Error('Aura forced Submerge pseudopod choice is no longer legal');applyGeometryForcedDive(u,move);u.notRest=true;u.burrowedSafely=false;moved.add(uid);}
 for(const u of s.units)if(!u.dying&&A.card(u.card).type==='Minion'&&!growth(u)&&applies(u)&&canSubmerge(s,u,p,A,true)){u.layer='below';u.notRest=true;u.burrowedSafely=false;moved.add(u.uid);}
 for(const o of (step.onlyUid?[]:s.artifacts||[])){
  if(moved.has(o.uid)||!affected(s,source,o,A))continue;
  const bearer=o.bearer&&A.unit(s,o.bearer);if(bearer&&moved.has(bearer.uid))continue;
  if(canSubmerge(s,o,p,A,false)){o.bearer=null;o.layer='below';o.notRest=true;}
 }
 if(step.includeAuras)for(const a of s.auras||[])if(!s.units.some(u=>u.uid===a.uid)){
  const shape=catalogAuraPhysicalShape(a,A.inside);if(affected(s,source,shape,A)&&canSubmerge(s,shape,p,A,false)){a.layer='below';a.notRest=true;}
 }
 return true;
}
