import {geometryLocationRecords,geometryForcedSurfaceMove,applyGeometryForcedMove} from './final-geometry.js';
import {catalogAuraPhysicalShape} from './catalog-auras.js';
const growing=o=>!!o.geometryLocations&&o.geometryGrowing;
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
// Dredge names a Site: only a below location touching that Site is a
// Surface origin. An ordinary body moves as a whole; a growing body retains
// the source pseudopod and extends to the surface through its actual move.
export function resolveCatalogForcedSurface(s,frame,A){
 const {step,source,controller:p,selected}=frame;if(step.op!=='liftSite')return false;
 const at=step.surfaceAt??selected?.at;
 if(step.surfacePhase==='finish'){
  for(let i=0;i<(step.skeletons||0);i++)if(A.canSummonEntry(s,p,A.card('skeleton'),at,'surface')&&A.paySummoningTax(s,A.card('skeleton').id,p,p)){
   const token=A.makeUnit(s,A.card('skeleton').id,p,at);token.layer='surface';
  }
  return true;
 }
 if(!s.board[at])return true;
 const unitIds=new Set(s.units.map(o=>o.uid)),objects=[...s.units,...s.artifacts||[],...(s.auras||[]).filter(o=>!unitIds.has(o.uid))];
 const unique=[...new Map(objects.map(o=>[o.uid,o])).values()],find=uid=>unique.find(o=>o.uid===uid);
 const isUnit=o=>unitIds.has(o.uid),isAura=o=>!isUnit(o)&&(s.auras||[]).some(a=>a.uid===o.uid);
 const shape=o=>{const physical=isAura(o)?catalogAuraPhysicalShape(o,A.inside):o;return {...physical,mods:physical.mods||[]};};
 const contact=o=>geometryLocationRecords(shape(o)).some(loc=>loc.at===at&&loc.layer==='below');
 const permitted=o=>!o.dying&&(!isUnit(o)||A.fiftyForceAllowed(s,o,p,A));
 const moveFor=o=>permitted(o)&&contact(o)?geometryForcedSurfaceMove(s,shape(o),at,A):null;
 const uids=step.surfaceUids||unique.filter(o=>permitted(o)&&contact(o)).map(o=>o.uid),plans=step.surfacePlans||{};
 const pending=uids.map(find).filter(o=>o&&isUnit(o)&&growing(o)&&!Object.hasOwn(plans,o.uid)).map(o=>({o,move:moveFor(o)})).find(v=>v.move?.growth);
 if(pending){
  const {o,move}=pending;
  if(!selected?.move){
   s.choice={player:p,title:A.card(frame.effectCard).name+' · '+A.card(o.card).name+' · 選擇浮起的擬足',options:[{label:String.fromCharCode(65+at%5)+(4-Math.floor(at/5))+' below → surface',value:{uid:o.uid,move}}],frame:{...frame,selected:undefined,step:{...step,select:undefined,surfaceAt:at,surfaceUids:uids}}};return true;
  }
  if(selected.uid!==o.uid||!equal(selected.move,move))throw Error('Surface pseudopod choice is no longer legal');
  A.queueEffects(s,[{...step,select:undefined,surfaceAt:at,surfaceUids:uids,surfacePlans:{...plans,[o.uid]:move}}],source,p,frame.effectCard);return true;
 }
 // Validate the complete plan before changing any participant.
 for(const [uid,move]of Object.entries(plans)){const o=find(uid);if(!o||!equal(moveFor(o),move))throw Error('Surface pseudopod choice is no longer legal');}
 const moved=new Set();
 for(const [uid,move]of Object.entries(plans)){const o=find(uid);applyGeometryForcedMove(o,move);moved.add(uid);}
 for(const uid of uids){
  const o=find(uid);if(!o||moved.has(uid)||isUnit(o)&&growing(o)&&!A.disabled(o))continue;
  // An artifact follows its moving bearer at the normal checkpoint, retaining
  // its own physical location offset; do not independently translate it again.
  if(!isUnit(o)&&!isAura(o)&&o.bearer&&moved.has(o.bearer))continue;
  const move=moveFor(o);if(!move)continue;
  o.layer='surface';o.notRest=true;o.burrowedSafely=false;moved.add(uid);
  if(!isUnit(o)&&!isAura(o)&&o.bearer&&!geometryLocationRecords(A.unit(s,o.bearer)).some(loc=>loc.at===o.at&&loc.layer==='surface')){o.bearer=null;delete o.carriedPosition;}
 }
 // A separate continuation ensures all actual movements and their state
 // checks resolve before the two Skeletons are summoned.
 A.queueEffects(s,[{...step,select:undefined,surfaceAt:at,surfacePhase:'finish',surfaceUids:undefined,surfacePlans:undefined}],source,p,frame.effectCard);
 return true;
}
