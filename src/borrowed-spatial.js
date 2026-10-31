import {geometryLocationRecords} from './final-geometry.js';
// Source-aware live spatial adapters. Zone-only casting restrictions are not
// imported here: Pallid abilities do not follow the physical bearer into hand.
import {unitPassiveLayerViews} from './final-ability-layers.js';
const geometryKeys=['geometryGrowth','geometryEverywhere','geometryFollowAvatar','geometryLeap','geometryAttackBelow'];
export function spatialLayers(s,u,A,key=null){
 if(!u||u.dying||A.disabled(u))return [];
 return unitPassiveLayerViews(s,u,{...A,definitions:A.definitions||{},passives:A.passives||{},printedKeywords:A.printedKeywords||(c=>c.keywords||[])},key);
}
export function refreshBorrowedSpatial(s,A){
 let changed=false;
 for(const u of s.units){
  const layers=spatialLayers(s,u,A);
  const before=JSON.stringify({geometry:u.geometryAbilitySources,flood:u.spatialFloodSources});
  u.geometryAbilitySources=layers.filter(l=>geometryKeys.some(key=>Object.hasOwn(l.passive,key))).map(l=>({origin:l.origin,instance:l.instance,nature:l.nature,passive:{...Object.fromEntries(geometryKeys.filter(key=>key!=='geometryEverywhere'&&Object.hasOwn(l.passive,key)).map(key=>[key,structuredClone(l.passive[key])])),...(l.passive.geometryEverywhere?{geometrySafetyEverywhere:true,geometryNeedsFiveVoids:true,geometryIgnoreSites:true}:{})}}));
  u.spatialFloodSources=layers.filter(l=>l.passive.floodOccupiedSite).map(l=>({origin:l.origin,instance:l.instance,stamp:l.source.abilityStamp||0}));
  u.geometryGrowing=u.geometryAbilitySources.some(l=>!!l.passive.geometryGrowth);
  u.geometryIgnoreSites=u.geometryAbilitySources.some(l=>!!l.passive.geometryIgnoreSites);
  u.geometrySafetyEverywhere=u.geometryAbilitySources.some(l=>!!l.passive.geometrySafetyEverywhere);
  changed=changed||before!==JSON.stringify({geometry:u.geometryAbilitySources,flood:u.spatialFloodSources});
 }
 return changed;
}
export function spatialHas(s,u,key,A){return spatialLayers(s,u,A,key).some(l=>!!l.value);}
export function spatialDenyEntry(s,u,to,A){
 return s.units.some(source=>source.controller===u.controller&&geometryLocationRecords(source).some(loc=>loc.at===to.at&&(!s.board[to.at]||loc.layer===(to.layer||'surface')))&&spatialHas(s,source,'denyAlliedEntry',A));
}
export function spatialMazeAllows(s,u,from,to,A){
 if(A.card(u.card).type!=='Minion')return true;
 return !s.units.some(source=>source.controller!==u.controller&&spatialHas(s,source,'fiftyMaze',A)&&A.regionsOverlap(s,source,u)&&A.occupied({...u,at:from.at}).some(at=>A.nearby(at,source.at))&&!A.occupied({...u,at:to.at}).every(at=>A.nearby(at,source.at)));
}
export function spatialFreeMove(s,u,from,to,A){
 return spatialLayers(s,u,A).some(({passive:p})=>p.freeAxis==='horizontal'&&Math.floor(from.at/5)===Math.floor(to.at/5)&&from.layer===to.layer||p.freeWater&&A.waterSite(s,from.at,A.card)&&A.waterSite(s,to.at,A.card)||p.freeClearLand&&s.board[from.at]&&s.board[to.at]&&!A.waterSite(s,from.at,A.card)&&!A.waterSite(s,to.at,A.card)&&!s.units.some(v=>v.uid!==u.uid&&(v.at===from.at||v.at===to.at)));
}
export function spatialCannotForce(s,u,actor,A){
 if(spatialHas(s,u,'cannotForce',A)||spatialHas(s,u,'fiftyForceImmune',A))return true;
 return actor!==u.controller&&s.units.some(source=>source.controller===u.controller&&spatialHas(s,source,'fiftyAnchor',A)&&A.nearby(source.at,u.at)&&A.regionsOverlap(s,source,u));
}
export function spatialCasterAllowed(s,u,c,A,options={}){if(!A.casterPermissionAllows)throw new Error('Caster permission adapter is unavailable');return A.casterPermissionAllows(s,u,c,options);}
export function spatialMinionCastingHere(s,p,c,at,A){
 return s.units.some(u=>u.controller===p&&A.occupied(u).includes(at)&&spatialHas(s,u,'castMinionsHere',A));
}
export function spatialVoidSummoning(s,p,at,A){
 return s.units.some(u=>u.controller===p&&A.occupied(u).includes(at)&&spatialHas(s,u,'voidSummoning',A));
}
export function spatialCarryRules(s,u,A){
 const rules=spatialLayers(s,u,A,'carryUnits').map(l=>({...l,rule:structuredClone(l.value)}));
 if(!rules.length&&A.unitTypes(u,s).includes('Beast')&&!A.disabled(u))rules.push({source:u,origin:u.card,instance:'special-carrier:'+u.uid,nature:'rule',rule:{capacity:Infinity,specialOnly:true}});
 return rules;
}
export function spatialCarriedTypes(s,u,A){return spatialLayers(s,u,A,'carriedByType').map(l=>({origin:l.origin,instance:l.instance,type:l.value}));}

function spatialEvent(layer,steps){return {source:{...layer.source,abilityNature:layer.nature},steps:steps.map(step=>({...step,abilityOrigin:layer.origin,abilityInstance:layer.instance,abilityNature:layer.nature}))};}
export function spatialMovementEvents(s,u,old,newEntry,newLocations,A){
 const events=[],newCells=[...new Set(newLocations.map(loc=>loc.at))];
 for(const layer of spatialLayers(s,u,A)){
  const p=layer.passive,emit=steps=>events.push(spatialEvent(layer,steps));
  if(p.giveOnSiteEntry)for(const loc of newLocations){const site=s.board[loc.at];if(site&&site.controller!==u.controller)emit([{op:'reactionPeace',recipient:site.controller,at:loc.at,optional:true}]);}
  const quest=layer.nature==='printed'?u.questSite:u.questSites?.[layer.instance];
  if(p.enterChosenSiteDraw&&quest&&newCells.some(at=>s.board[at]?.uid===quest)){if(layer.nature==='printed')delete u.questSite;else delete u.questSites[layer.instance];emit([{op:'drawCards',count:1},{op:'percevalSite'}]);}
  if(old&&p.fiftyGhost&&(old.regions||[old.region||A.region(s,{at:old.at,layer:old.layer})]).includes('void')&&s.board[u.at])emit([{op:'fiftyGhost'}]);
  if(old&&p.fiftyEel&&old.layer!=='below'&&u.layer==='below'&&A.waterSite(s,u.at,A.card))emit([{op:'fiftyEelPull'}]);
  if(old&&p.revealOnMove)u.stealth=false;
  if(old&&!newEntry){if(p.skeletonOnMoveHurt)emit([{op:'armySkeleton',at:old.at,layer:old.layer}]);if(p.unburrowDesertGenesis&&old.layer==='below'&&(u.layer||'surface')==='surface'&&(old.regions||[old.region||A.region(s,{at:old.at,layer:old.layer})]).includes('underground'))emit([{op:'triggerSiteGenesis',optional:true,untargeted:true,select:{kind:'site',nearby:true,siteType:'Desert',untargeted:true}}]);}
  const enteredVoid=newLocations.filter(loc=>A.regionNames(s,loc).has('void'));
  if(p.stealthOnVoidEntry&&enteredVoid.length)u.stealth=true;
  if(p.voidEntryKill)for(const loc of enteredVoid)emit([{op:'voidEntryKill',at:loc.at,layer:loc.layer}]);
  if(p.cornerPilgrim)for(const loc of newLocations.filter(loc=>[0,4,15,19].includes(loc.at))){const memories=u.spatialCornerVisits||(u.spatialCornerVisits={}),visited=memories[layer.instance]||(memories[layer.instance]=layer.nature==='printed'?[...u.corners||[]]:[]);if(!visited.includes(loc.at)){visited.push(loc.at);if(layer.nature==='printed')u.corners=[...visited];emit([{op:'drawCards',count:1,optional:true}]);}}
 }
 return events;
}
export function spatialSummonEvents(s,u,A){
 if(A.card(u.card).type!=='Minion')return [];
 const result=[];for(const source of s.units)if(A.regionsOverlap(s,source,u)&&A.occupied(u).some(at=>A.occupied(source).some(other=>A.nearby(at,other))))for(const layer of spatialLayers(s,source,A,'tapSummonedNearby'))if(layer.value)result.push(spatialEvent(layer,[{op:'tapSummoned',uid:u.uid}]));return result;
}
export function spatialCastEvents(s,caster,c,A){
 const result=[];
 for(const layer of spatialLayers(s,caster,A)){
  if(layer.passive.castRiverGenesis)result.push(spatialEvent(layer,[{op:'triggerSiteGenesis',optional:true,untargeted:true,select:{kind:'site',nearby:true,nameIncludes:'River',untargeted:true}}]));
 }return result;
}
export function spatialAmbushEvents(s,u,old,newEntry,newLocations,A){
 if(!old||newEntry)return [];
 const result=[];
 for(const source of s.units)if(source.controller!==u.controller){for(const layer of spatialLayers(s,source,A,'ambushAbove'))if(layer.value&&newLocations.some(loc=>loc.layer==='surface'&&s.board[loc.at]&&!A.waterSite(s,loc.at,A.card)&&geometryLocationRecords(source).some(part=>part.at===loc.at&&part.layer==='below')))result.push(spatialEvent(layer,[{op:'remainingMummy',fighter:source.uid,target:u.uid}]));}
 return result;
}

export function resolveSpatialMovementShot(s,frame,A){
 const {step,source,controller:p,selected}=frame;if(step.op!=='movementShot')return false;
 const u=A.unit(s,source.uid);if(!u||u.dying||u.controller!==p||A.disabled(u))return true;
 const used=u.spatialShotsUsed||(u.spatialShotsUsed={}),visited=step.shotVisited||[],layers=spatialLayers(s,u,A,'movementShot').filter(l=>l.value&&!used[l.instance]&&!visited.includes(l.instance));
 const layer=step.shotInstance?layers.find(l=>l.instance===step.shotInstance):layers[0];if(!layer)return true;
 const eventSource={...layer.source,at:u.at,layer:u.layer||'surface',abilityNature:layer.nature};
 if(selected===undefined){s.choice={player:p,title:A.card(layer.origin).name+' · 此位置射擊或繼續移動',options:[...['北','東','南','西'].map((label,i)=>({label,value:i+1})),{label:'此處不射擊',value:0}],frame:{...frame,source:eventSource,step:{...step,shotInstance:layer.instance}}};return true;}
 if(!Number.isInteger(selected)||selected<0||selected>4)throw new Error('移動射擊方向已失效');
 const steps=[];
 if(selected){used[layer.instance]=true;u.shotDuringMove=true;u.stealth=false;steps.push({op:'shot',at:u.at,layer:u.layer||'surface',origin:true,direction:selected-1,amount:A.power(u),remaining:Math.max(1,u.grantedRange||0)+(u.rangeBonus||0),ranged:true,abilityOrigin:layer.origin,abilityInstance:layer.instance,abilityNature:layer.nature});}
 steps.push({op:'movementShot',shotVisited:[...visited,layer.instance]});A.queueEffects(s,steps,eventSource,p,layer.origin);return true;
}
export function spatialPickupCarriedLimit(s,u,A){
 const limits=spatialLayers(s,u,A,'pickupCarriedCost').map(l=>l.value).filter(v=>typeof v==='number');return limits.length?Math.max(...limits):undefined;
}
export function spatialForcedSubmergeAllowed(s,u,to,A){
 if((u.layer||'surface')==='below'||to.layer!=='below'||!A.waterSite(s,to.at,A.card))return true;
 return !s.units.some(source=>source.controller===u.controller&&spatialHas(s,source,'noForcedSubmergeNearby',A)&&A.occupied(u).some(at=>A.occupied(source).some(other=>A.nearby(other,at)))&&A.regionsOverlap(s,source,u));
}
export function spatialSetQuest(s,u,siteUid,source,step,A){
 const layers=spatialLayers(s,u,A,'enterChosenSiteDraw'),instance=step.abilityInstance||source.abilityInstance,origin=step.abilityOrigin||source.abilityOrigin;
 const layer=layers.find(l=>instance&&(instance===l.instance||instance.startsWith(l.instance+':')))||layers.find(l=>instance&&l.instance.startsWith(instance.replace(/:(genesis|death|start|end):\d+$/,'')+':'))||(layers.filter(l=>l.origin===origin).length===1?layers.find(l=>l.origin===origin):null);
 if(layer?.nature==='gained')(u.questSites||(u.questSites={}))[layer.instance]=siteUid;else if((step.abilityNature||source.abilityNature)==='gained'&&instance)(u.questSites||(u.questSites={}))[instance.replace(/:(genesis|death|start|end):\d+$/,'')]=siteUid;else u.questSite=siteUid;
}
