import {spatialCarryRules,spatialCarriedTypes} from './borrowed-spatial.js';
import {batchPassives} from './card-batches.js';
import {occupied,canEnterOnGround,region} from './geography.js';
import {geometryDistance,geometryTranslate,globeActive} from './final-geometry.js';

const movement=['Airborne','Burrowing','Submerge','Voidwalk'];
const layer=u=>u.layer||'surface';
const here=(a,b)=>layer(a)===layer(b)&&occupied(a).some(at=>occupied(b).includes(at));
export const passengers=(s,u)=>s.units.filter(v=>v.carriedBy===u.uid);
export function carryRules(s,u,api){
 const A={...api,passives:api.passives||batchPassives};return spatialCarryRules(s,u,A);
}
export function carryRule(u,api,s=null,instance=null){
 if(s){const entry=carryRules(s,u,api).find(l=>!instance||l.instance===instance);return entry?{...entry.rule,abilityInstance:entry.instance,origin:entry.origin}:null;}
 return !u.dying&&!api.disabled(u)?(!u.silenced?(api.passives||batchPassives)[api.card(u.card).slug]?.carryUnits:null)||(api.unitTypes(u).includes('Beast')?{capacity:Infinity,specialOnly:true}:null):null;
}
function fits(s,carrier,target,api,picking=false,instance=null){
 const rule=carryRule(carrier,api,s,instance),types=spatialCarriedTypes(s,target,{...api,passives:api.passives||batchPassives});
 if(!rule||target.uid===carrier.uid||target.dying||target.swallowedBy||rule.specialOnly&&!types.some(v=>api.unitTypes(carrier).includes(v.type))||rule.ally&&carrier.controller!==target.controller||picking&&rule.pickupEnemy&&carrier.controller===target.controller||rule.minion&&api.card(target.card).type!=='Minion'||picking&&rule.weaker&&Math.floor((api.power(target)+api.power(target,true))/2)>=Math.floor((api.power(carrier)+api.power(carrier,true))/2))return false;
 let at=carrier;const seen=new Set();while(at?.carriedBy){if(seen.has(at.uid))return false;seen.add(at.uid);if(at.carriedBy===target.uid)return false;at=s.units.find(v=>v.uid===at.carriedBy);}return true;
}
export function carryChoices(s,carrier,api,instance=null){
 const rule=carryRule(carrier,api,s,instance),assigned=passengers(s,carrier).filter(u=>!u.carriedAbility||u.carriedAbility===rule?.abilityInstance);
 if(!rule||assigned.length>=rule.capacity)return [];
 return s.units.filter(v=>!v.carriedBy&&fits(s,carrier,v,api,true,rule.abilityInstance)&&(rule.adjacent?region(s,carrier,api.card)===region(s,v,api.card)&&occupied(carrier).some(a=>occupied(v).some(b=>geometryDistance(s,a,b,api.card)===1)):here(carrier,v))&&api.canTarget(s,carrier.controller,v,carrier));
}
export function bringPassenger(s,carrier,target,api){if(here(carrier,target))return true;for(const cell of occupied(target)){if(geometryDistance(s,cell,carrier.at,api.card)!==1)continue;const at=geometryTranslate(s,target.at,cell,carrier.at,api.card),to={...target,at},from=occupied(target),cells=occupied(to);if(at>=0&&at<20&&(target.size!==2||globeActive(s,api.card)||at%5<4&&at<15)&&cells.every((v,i)=>from.includes(v)||canEnterOnGround(s,target,{at:from[i],layer:layer(target)},{at:v,layer:layer(carrier)},api.card,api.keywords,false,false,api))){target.at=at;target.layer=layer(carrier);target.notRest=true;target.burrowedSafely=false;return true;}}return false;}
export function dropPassenger(u){delete u.carriedBy;delete u.carriedAbility;delete u.carriedPosition;delete u.carrierOffset;u.carryKeywords=[];u.carryDisabled=false;}
export function boardPassenger(carrier,target,ability=null){target.carriedBy=carrier.uid;if(ability)target.carriedAbility=ability;target.carriedPosition={at:target.at,layer:layer(target)};target.carrierOffset=target.at-carrier.at;carrier.carrierPosition={at:carrier.at,layer:layer(carrier)};}
// Follow each completed movement step. Passengers still occupy the realm and
// can be targeted, act independently, carry equipment, or leave their carrier.
export function movePassengers(s,api){
 const visited=new Set();
 function follow(carrier){if(visited.has(carrier.uid))return;visited.add(carrier.uid);const old=carrier.carrierPosition||{at:carrier.at,layer:layer(carrier)};
  for(const u of passengers(s,carrier)){
   const last=u.carriedPosition||{at:u.at,layer:layer(u)};
   if(u.at!==last.at||layer(u)!==last.layer){if(!here(carrier,u))dropPassenger(u);else {u.carriedPosition={at:u.at,layer:layer(u)};u.carrierOffset=u.at-carrier.at;}follow(u);continue;}
   if(old.at!==carrier.at||old.layer!==layer(carrier)){
    const at=geometryTranslate(s,u.at,old.at,carrier.at,api.card),to={...u,at,layer:layer(carrier)},cells=occupied(to),from=occupied(u);
    const legal=at>=0&&at<20&&(u.size!==2||globeActive(s,api.card)||at%5<4&&at<15)&&cells.every((cell,i)=>from.includes(cell)&&layer(u)===to.layer||canEnterOnGround(s,u,{at:from[i],layer:layer(u)},{at:cell,layer:to.layer},api.card,api.keywords,!!carrier.carryTeleport||geometryDistance(s,old.at,carrier.at,api.card)>1,!!carrier.carryFlying,api));
    if(legal){u.at=at;u.layer=to.layer;u.burrowedSafely=false;u.notRest=true;}else dropPassenger(u);
   }
   if(u.carriedBy&&!here(carrier,u))dropPassenger(u);
   if(u.carriedBy)u.carriedPosition={at:u.at,layer:layer(u)};follow(u);
  }
  carrier.carrierPosition={at:carrier.at,layer:layer(carrier)};delete carrier.carryTeleport;delete carrier.carryFlying;
 }
 for(const u of s.units)if(!u.carriedBy)follow(u);
 for(const u of s.units)if(!visited.has(u.uid)){dropPassenger(u);follow(u);}
}
export function refreshPassengers(s,api){
 const old=s.units.map(u=>!!u.carryDisabled);for(const u of s.units){u.carryKeywords=[];u.carryDisabled=false;u.transportImmobile=false;}
 const seen=new Set();function apply(carrier){
  if(seen.has(carrier.uid))return;seen.add(carrier.uid);const counts=new Map();let immobile=false;
  for(const u of passengers(s,carrier)){const rule=carryRule(carrier,api,s,u.carriedAbility),count=(counts.get(rule?.abilityInstance)||0)+1;
   if(!rule||!fits(s,carrier,u,api,false,rule.abilityInstance)||!here(carrier,u)||count>rule.capacity)dropPassenger(u);
   else {counts.set(rule.abilityInstance,count);u.carriedAbility=rule.abilityInstance;u.carryKeywords=api.keywords(carrier).filter(k=>movement.includes(k));u.carryDisabled=!!rule.disable;immobile=immobile||!!rule.immobileCarrying;}apply(u);
  }carrier.transportImmobile=immobile;
 }
 for(const u of s.units)if(!u.carriedBy)apply(u);
 for(const u of s.units)if(u.carriedBy&&!s.units.some(v=>v.uid===u.carriedBy))dropPassenger(u);
 return s.units.some((u,i)=>old[i]!==!!u.carryDisabled);
}
