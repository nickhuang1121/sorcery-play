import {batchPassives} from './card-batches.js';
import {occupied,canEnterOnGround,taxicab,region} from './geography.js';

const movement=['Airborne','Burrowing','Submerge','Voidwalk'];
const layer=u=>u.layer||'surface';
const here=(a,b)=>layer(a)===layer(b)&&occupied(a).some(at=>occupied(b).includes(at));
export const passengers=(s,u)=>s.units.filter(v=>v.carriedBy===u.uid);
export function carryRule(u,api){return !u.dying&&!api.disabled(u)?(!u.silenced?batchPassives[api.card(u.card).slug]?.carryUnits:null)||(api.unitTypes(u).includes('Beast')?{capacity:Infinity,specialOnly:true}:null):null;}
function fits(s,carrier,target,api,picking=false){const rule=carryRule(carrier,api),type=!target.silenced&&!api.disabled(target)&&batchPassives[api.card(target.card).slug]?.carriedByType;if(!rule||target.uid===carrier.uid||target.dying||target.swallowedBy||rule.specialOnly&&(!type||!api.unitTypes(carrier).includes(type))||rule.ally&&carrier.controller!==target.controller||picking&&rule.pickupEnemy&&carrier.controller===target.controller||rule.minion&&api.card(target.card).type!=='Minion'||picking&&rule.weaker&&api.power(target)>=api.power(carrier))return false;let at=carrier;const seen=new Set();while(at?.carriedBy){if(seen.has(at.uid))return false;seen.add(at.uid);if(at.carriedBy===target.uid)return false;at=s.units.find(v=>v.uid===at.carriedBy);}return true;}
export function carryChoices(s,carrier,api){const rule=carryRule(carrier,api);if(!rule||passengers(s,carrier).length>=rule.capacity)return [];return s.units.filter(v=>!v.carriedBy&&fits(s,carrier,v,api,true)&&(rule.adjacent?region(s,carrier,api.card)===region(s,v,api.card)&&occupied(carrier).some(a=>occupied(v).some(b=>taxicab(a,b)===1)):here(carrier,v))&&api.canTarget(s,carrier.controller,v,carrier));}
export function bringPassenger(s,carrier,target,api){if(here(carrier,target))return true;for(const cell of occupied(target)){if(taxicab(cell,carrier.at)!==1)continue;const at=target.at+carrier.at-cell,to={...target,at},from=occupied(target),cells=occupied(to);if(at>=0&&at<20&&(target.size!==2||at%5<4&&at<15)&&cells.every((v,i)=>from.includes(v)||canEnterOnGround(s,target,{at:from[i],layer:layer(target)},{at:v,layer:layer(carrier)},api.card,api.keywords))){target.at=at;target.layer=layer(carrier);target.notRest=true;target.burrowedSafely=false;return true;}}return false;}
export function dropPassenger(u){delete u.carriedBy;delete u.carriedPosition;delete u.carrierOffset;u.carryKeywords=[];u.carryDisabled=false;}
export function boardPassenger(carrier,target){target.carriedBy=carrier.uid;target.carriedPosition={at:target.at,layer:layer(target)};target.carrierOffset=target.at-carrier.at;carrier.carrierPosition={at:carrier.at,layer:layer(carrier)};}
// Follow each completed movement step. Passengers still occupy the realm and
// can be targeted, act independently, carry equipment, or leave their carrier.
export function movePassengers(s,api){
 const visited=new Set();
 function follow(carrier){if(visited.has(carrier.uid))return;visited.add(carrier.uid);const old=carrier.carrierPosition||{at:carrier.at,layer:layer(carrier)};
  for(const u of passengers(s,carrier)){
   const last=u.carriedPosition||{at:u.at,layer:layer(u)};
   if(u.at!==last.at||layer(u)!==last.layer){if(!here(carrier,u))dropPassenger(u);else {u.carriedPosition={at:u.at,layer:layer(u)};u.carrierOffset=u.at-carrier.at;}follow(u);continue;}
   if(old.at!==carrier.at||old.layer!==layer(carrier)){
    const at=u.at+carrier.at-old.at,to={...u,at,layer:layer(carrier)},cells=occupied(to),from=occupied(u);
    const legal=at>=0&&at<20&&(u.size!==2||at%5<4&&at<15)&&cells.every((cell,i)=>from.includes(cell)&&layer(u)===to.layer||canEnterOnGround(s,u,{at:from[i],layer:layer(u)},{at:cell,layer:to.layer},api.card,api.keywords,!!carrier.carryTeleport||taxicab(old.at,carrier.at)>1,!!carrier.carryFlying));
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
 const seen=new Set();function apply(carrier){if(seen.has(carrier.uid))return;seen.add(carrier.uid);const rule=carryRule(carrier,api);let count=0;for(const u of passengers(s,carrier)){if(!rule||!fits(s,carrier,u,api)||!here(carrier,u)||++count>rule.capacity)dropPassenger(u);else {u.carryKeywords=api.keywords(carrier).filter(k=>movement.includes(k));u.carryDisabled=!!rule.disable;}apply(u);}carrier.transportImmobile=!!rule?.immobileCarrying&&passengers(s,carrier).length>0;}
 for(const u of s.units)if(!u.carriedBy)apply(u);
 for(const u of s.units)if(u.carriedBy&&!s.units.some(v=>v.uid===u.carriedBy))dropPassenger(u);
 return s.units.some((u,i)=>old[i]!==!!u.carryDisabled);
}
