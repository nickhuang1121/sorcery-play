import {globeActive,geometryForcedMoves,applyGeometryForcedMove,occupiesGeometryLocation} from './final-geometry.js';
import {abilityProjectileBarrier} from './final-ability-layers.js';
// Movement is resolved one square per serializable continuation. Entry triggers
// interrupt between steps; neither spell teleports a unit to its final square.
export const finalWaveDefinitions={
 wave_of_eviction:{cast:[{op:'finalEvictionAim',select:{kind:'site',ally:true,water:true}}]},
 snowball:{cast:[{op:'projectile',piercing:true,finalSnowball:true,amount:0}]},
};
export const experimentalFinalWaveDefinitions={};
export const finalWaveOperations=['finalSnowTravel','finalSnowAdvance','finalSnowFinish','finalEvictionAim','finalEvictionDirection','finalEvictionStep'];
const layer=u=>u.layer||'surface';
const pos=at=>String.fromCharCode(65+at%5)+(4-Math.floor(at/5));
const alive=(s,uid,A)=>{const u=A.unit(s,uid);return u&&!u.dying?u:null;};
export function waveNeighbor(at,d){const x=at%5+[0,1,0,-1][d],y=Math.floor(at/5)+[-1,0,1,0][d];return x>=0&&x<5&&y>=0&&y<4?y*5+x:null;}
function magicCanMove(s,u,p,A){return A.fiftyForceAllowed(s,u,p,A);}
function snowNeighbor(s,at,d,A){if(!globeActive(s,A.card))return waveNeighbor(at,d);return ((Math.floor(at/5)+[-1,0,1,0][d]+4)%4)*5+(at%5+[0,1,0,-1][d]+5)%5;}
function translation(s,u,d,p,A,fromRegions=null,wrap=false){
 if(!magicCanMove(s,u,p,A))return null;
 const at=wrap?snowNeighbor(s,u.at,d,A):waveNeighbor(u.at,d);if(at===null||!wrap&&u.size===2&&(at%5>3||at>=15))return null;
 const from=A.occupied(u),to=A.occupied({...u,at});if(from.length!==to.length)return null;
 for(let i=0;i<from.length;i++){
  if((wrap?snowNeighbor(s,from[i],d,A):waveNeighbor(from[i],d))!==to[i])return null;
  const a={at:from[i],layer:layer(u)},b={at:to[i],layer:layer(u)};
  const connected=fromRegions?.[i]?[...fromRegions[i]].some(name=>A.regionNames(s,b).has(name)):A.regionsOverlap(s,a,b);
  if(!connected||!A.canEnterOnGround(s,u,a,b,A.card,A.keywords))return null;
 }
 return at;
}
export function finalWaveMovementPending(s,u){
 return (s.storyline||[]).some(f=>['finalSnowTravel','finalSnowAdvance','finalEvictionStep'].includes(f.step.op)&&((f.step.cargo||[]).some(v=>v.uid===u.uid)||(f.step.pendingUids||[]).includes(u.uid)));
}
export function resolveFinalWaves(s,frame,A){
 const {step,source,controller:p,selected}=frame,op=step.op;
 const snowProjectile=op==='projectile'&&step.finalSnowball;
 if(!snowProjectile&&!finalWaveOperations.includes(op))return false;
 const queue=(steps)=>A.queueEffects(s,steps,source,p,frame.effectCard);
 const choose=(options,next)=>{if(options.length)s.choice={player:p,title:A.card(frame.effectCard).name,options,frame:{...frame,step:next}};};
 if(snowProjectile){
  if(selected===undefined){choose(['北','東','南','西'].map((label,i)=>({label,value:i+1})),step);return true;}
  queue([{op:'finalSnowTravel',at:source.at,layer:layer(source),origin:{at:source.at,layer:layer(source)},direction:selected-1,cargo:[],dropped:[],travelled:0,regions:[...A.regionNames(s,{at:source.at,layer:layer(source)})],visited:[]}]);return true;
 }
 if(op==='finalSnowTravel'){
  // The projectile's path, not its hit list, gathers Stealthed units too.
  let cargo=(step.cargo||[]).filter(v=>{const u=alive(s,v.uid,A);return u&&occupiesGeometryLocation(u,step.at,step.layer,s);});
  for(const u of s.units)if(!u.dying&&u.uid!==source.uid&&occupiesGeometryLocation(u,step.at,step.layer,s)&&!cargo.some(v=>v.uid===u.uid))cargo.push({uid:u.uid,at:u.at});
  const origin=step.origin||(step.visited?.length?{at:Number(step.visited[0].split(':')[0]),layer:step.layer}:null);
  if(origin&&(step.travelled||0)>0&&step.at===origin.at&&step.layer===origin.layer){queue([{op:'finalSnowFinish',at:step.at,layer:step.layer,cargo,travelled:step.travelled}]);return true;}
  const next=snowNeighbor(s,step.at,step.direction,A),edge=step.at+':'+step.layer+'>'+next+':'+step.layer;
  const nextRegions=next===null?[]:(step.regions||[...A.regionNames(s,{at:step.at,layer:step.layer})]).filter(name=>A.regionNames(s,{at:next,layer:step.layer}).has(name));
  const blocked=next!==null&&(s.board[next]&&!s.board[next].silenced&&!s.board[next].disabled&&A.passives[A.card(s.board[next].card).slug]?.projectileBarrierAll||abilityProjectileBarrier(s,next,step.layer,p,A));
  const canContinue=next!==null&&!blocked&&nextRegions.length>0;
  if(canContinue&&step.visited?.includes(edge)){queue([{op:'finalSnowFinish',at:step.at,layer:step.layer,cargo,travelled:step.travelled||0}]);return true;}
  if(!canContinue){queue([{op:'finalSnowFinish',at:step.at,layer:step.layer,cargo,travelled:step.travelled||0}]);return true;}
  queue([{op:'finalSnowAdvance',...Object.fromEntries(Object.entries(step).filter(([k])=>k!=='op')),cargo,next,regions:nextRegions,visited:[...(step.visited||[]),edge]}]);return true;
 }
 if(op==='finalSnowAdvance'){
  const cargo=[],dropped=[...(step.dropped||[])];
  for(const v of step.cargo){
   const u=alive(s,v.uid,A);if(!u||!occupiesGeometryLocation(u,step.at,step.layer,s))continue;
   let moved=false;
   if(u.geometryLocations&&u.geometryGrowing){
    const options=magicCanMove(s,u,p,A)?geometryForcedMoves(s,u,{map:{[step.at]:step.next},fromLayer:step.layer,layer:step.layer},A):[];
    if(options.length){applyGeometryForcedMove(u,options[0].value);moved=true;}
   }else{const at=translation(s,u,step.direction,p,A,null,globeActive(s,A.card));if(at!==null){u.at=at;u.notRest=true;u.burrowedSafely=false;moved=true;}}
   // Carrying Units: failure to move is not itself a drop. The shared
   // location invariant decides whether a stationary oversized/immune unit
   // remains carried. Gathering later may pick up a dropped unit again.
   if(moved||occupiesGeometryLocation(u,step.next,step.layer,s))cargo.push({uid:u.uid,at:u.at});else dropped.push(u.uid);
  }
  queue([{op:'finalSnowTravel',at:step.next,layer:step.layer,origin:step.origin,direction:step.direction,cargo,dropped,travelled:(step.travelled||0)+1,regions:step.regions,visited:step.visited}]);return true;
 }
 if(op==='finalSnowFinish'){
  // Stops Codex explicitly names Snowball: zero new locations means no stop
  // and therefore no damage, even though its path includes the origin.
  if(!(step.travelled>0))return true;
  const cargo=step.cargo.filter(v=>{const u=alive(s,v.uid,A);return u&&occupiesGeometryLocation(u,step.at,step.layer,s);});
  const amount=cargo.length;if(!amount)return true;
  A.log(s,'Snowball · '+pos(step.at)+' · '+amount+' 個單位');
  const before=s.damageWindow;s.damageWindow={wards:s.units.filter(u=>u.ward).map(u=>u.uid)};
  try{for(const u of s.units)if(!u.dying&&occupiesGeometryLocation(u,step.at,step.layer,s))A.hurt(s,u,amount,false,'magic',source);
   for(const uid of s.damageWindow.hydras||[]){const u=alive(s,uid,A);if(u&&!u.lethal&&u.damage<A.power(u,true))u.damage=0;}
  }finally{if(before)s.damageWindow=before;else delete s.damageWindow;}return true;
 }
 if(op==='finalEvictionAim'){
  const site=s.board[selected?.at];if(site?.controller===p&&A.waterSite(s,selected.at,A.card))queue([{op:'finalEvictionDirection',at:selected.at}]);return true;
 }
 if(op==='finalEvictionDirection'){
  if(selected===undefined){choose(['北','東','南','西'].map((label,i)=>({label,value:i})),step);return true;}
  if(Number.isInteger(selected)&&selected>=0&&selected<4)queue([{op:'finalEvictionStep',at:step.at,direction:selected,pendingUids:[]}]);return true;
 }
 if(op==='finalEvictionStep'){
  const next=waveNeighbor(step.at,step.direction);if(next===null)return true;
  const enemies=s.units.filter(u=>!u.dying&&u.controller!==p&&A.occupied(u).includes(step.at));
  // Freeze source regions before simultaneously flooding and displacing.
  const regions=new Map(enemies.map(u=>[u.uid,A.occupied(u).map(at=>A.regionNames(s,{at,layer:layer(u)}))]));
  const site=s.board[next];if(site&&!site.completionProtected&&!A.passives[A.card(site.card).slug]?.immutableSite){(site.effects||(site.effects=[])).push({flood:true,end:s.turn,stamp:s.next++});}
  const pendingUids=[];
  for(const u of enemies){const at=translation(s,u,step.direction,p,A,regions.get(u.uid));if(at===null)continue;u.at=at;u.notRest=true;u.burrowedSafely=false;pendingUids.push(u.uid);}
  A.log(s,'Wave of Eviction · '+pos(next));
  queue([{op:'finalEvictionStep',at:next,direction:step.direction,pendingUids}]);return true;
 }
 return true;
}
