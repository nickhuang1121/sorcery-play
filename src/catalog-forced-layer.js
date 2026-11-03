import {geometryLocationRecords,geometryForcedDiveOptions,geometryForcedBurrowOptions,applyGeometryForcedDive} from './final-geometry.js';
import {spatialForcedSubmergeAllowed} from './borrowed-spatial.js';
import {canSubmerge} from './final-flood.js';
const growing=u=>u.geometryLocations&&u.geometryGrowing;
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function mayBurrow(s,o,p,A,isUnit){
 const parts=geometryLocationRecords(o);
 if(!parts.length||parts.some(loc=>loc.layer!=='surface'||!s.board[loc.at]||A.waterSite(s,loc.at,A.card)))return false;
 if(isUnit&&!A.fiftyForceAllowed(s,o,p,A))return false;
 return parts.every(loc=>A.canEnterOnGround(s,{...o,mods:o.mods||[]},loc,{at:loc.at,layer:'below'},A.card,A.keywords));
}
export function resolveCatalogForcedLayer(s,frame,A){
 const {step,source,controller:p,selected}=frame;
 if(!['burrow','submerge'].includes(step.forceAction))return false;
 const objects=[...s.units,...s.artifacts||[]],find=uid=>objects.find(o=>o.uid===uid),isUnit=o=>s.units.some(u=>u.uid===o.uid);
 const uids=step.forceUids||(step.op==='sinkSite'?[...new Set(objects.filter(o=>!o.dying&&(isUnit(o)?A.card(o.card).type==='Minion'&&A.occupied(o).includes(selected.at):o.at===selected.at)).map(o=>o.uid))]:[selected?.uid]);
 const planned=step.forcePlanned||{};
 const options=u=>{
  if(!u||u.dying||!A.fiftyForceAllowed(s,u,p,A))return [];
  const moves=step.forceAction==='burrow'?geometryForcedBurrowOptions(s,u,A):geometryForcedDiveOptions(s,u,A);
  return step.forceAction==='burrow'?moves:moves.filter(o=>spatialForcedSubmergeAllowed(s,{...u,at:o.value.from.at,layer:o.value.from.layer},o.value.to,A));
 };
 const pending=uids.map(find).filter(o=>o&&!o.dying&&isUnit(o)&&growing(o)&&!Object.hasOwn(planned,o.uid)).map(u=>({u,moves:options(u)})).find(v=>v.moves.length);
 if(pending){
  const {u,moves}=pending;
  if(!selected?.move){s.choice={player:p,title:A.card(frame.effectCard).name+' · '+A.card(u.card).name+' · 選擇受強制移動的擬足',options:moves.map(o=>({label:o.label,value:{uid:u.uid,move:o.value}})),frame:{...frame,selected:undefined,step:{...step,select:undefined,forceUids:uids}}};return true;}
  if(selected.uid!==u.uid||!moves.some(o=>same(o.value,selected.move)))throw Error('Forced layer pseudopod choice is no longer legal');
  A.queueEffects(s,[{...step,select:undefined,forceUids:uids,forcePlanned:{...planned,[u.uid]:selected.move}}],source,p,frame.effectCard);return true;
 }
 // Forced movement grants no survival ability. Only explicit “burrowed safely”
 // effects may set that flag (which also grants Burrowing and Immobile).
 const moved=new Set();
 for(const [uid,move]of Object.entries(planned)){const u=find(uid);if(!options(u).some(o=>same(o.value,move)))throw Error('Forced layer pseudopod choice is no longer legal');applyGeometryForcedDive(u,move);u.notRest=true;u.burrowedSafely=false;moved.add(uid);}
 for(const uid of uids){
  const o=find(uid);if(!o||o.dying||growing(o)||moved.has(uid))continue;
  if(!isUnit(o)&&o.bearer&&moved.has(o.bearer))continue;
  const allowed=step.forceAction==='burrow'?mayBurrow(s,o,p,A,isUnit(o)):canSubmerge(s,o,p,A,isUnit(o));
  if(!allowed)continue;
  o.layer='below';o.notRest=true;o.burrowedSafely=false;moved.add(uid);
  if(!isUnit(o)&&o.bearer&&!geometryLocationRecords(A.unit(s,o.bearer)).some(loc=>loc.at===o.at&&loc.layer==='below'))o.bearer=null;
 }
 return true;
}
