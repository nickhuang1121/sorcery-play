// Registry initialization must precede spatial rule consumers in a cold entry.
import './cards.js';
import {catalogAuraActive} from './aura-source-state.js';
import {siteEffectAllowed} from './final-ability-layers.js';
import {saintOfRedemptionActive} from './final-passives.js';
export const xy=n=>({x:n%5,y:Math.floor(n/5)});
export const occupied=u=>geometryOccupied(u)||(u.size===2?[u.at,u.at+1,u.at+5,u.at+6]:[u.at]);
export function taxicab(a,b){a=xy(a);b=xy(b);return Math.abs(a.x-b.x)+Math.abs(a.y-b.y);}
export function near(a,b){a=xy(a);b=xy(b);return Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y))<=1;}
export function siteBaseResources(s,at,lookup){
  const taxicab=(a,b)=>geometryDistance(s,a,b,lookup),near=(a,b)=>geometryDistance(s,a,b,lookup,true)<=1;const site=s.board[at],d=site&&!site.silenced?batchSitePassives[lookup(site.card).slug]:null;if(d?.resourcesOnlyNearVoid&&!s.board.some((v,i)=>!v&&taxicab(at,i)===1))return false;if(d?.resourcesOnlyEmpty&&((s.inertCards||[]).some(c=>c.at===at)||s.units.some(u=>occupied(u).includes(at))||(s.artifacts||[]).some(a=>a.at===at)||(s.auras||[]).some(a=>inside(a,at))))return false;return true;}
export function siteAffinity(s,at,lookup){
  const taxicab=(a,b)=>geometryDistance(s,a,b,lookup),near=(a,b)=>geometryDistance(s,a,b,lookup,true)<=1;
  const site=s.board[at];if(!site||site.disabled||site.completionNoThreshold)return {air:0,earth:0,fire:0,water:0};
  const c=lookup(site.card),value={air:c.air||0,earth:c.earth||0,fire:c.fire||0,water:c.water||0};
  if(!site.silenced&&c.slug==='mismanaged_mortuary')value.water=Math.max(1,value.water);
  if(!siteBaseResources(s,at,lookup))for(const e of ['air','earth','fire','water'])value[e]=0;
  if(batchSitePassives[c.slug]?.nearbyAngelWardAffinity&&!site.silenced&&(s.units.some(u=>!u.dying&&u.controller===site.controller&&occupied(u).some(i=>near(at,i))&&(lookup(u.card).subtypes.includes('Angel')||u.ward))||s.board.some((v,i)=>v?.controller===site.controller&&v.ward&&near(at,i))))for(const e of ['air','earth','fire','water'])value[e]=1;
  const gift=siteBaseResources(s,at,lookup)?siteResourceGift(s,at,lookup):0;for(const e of ['air','earth','fire','water'])value[e]+=gift;
  if(betaRulesPassives[c.slug]?.immutableSite||site.completionProtected)return value;
  if(site.chosenAffinity)value[site.chosenAffinity]++;
  if(site.flooded&&!site.silenced)value.water=Math.max(1,value.water);
  const effects=[...(s.ongoingEffects||[]).filter(e=>e.op==='realmFlood').map(e=>({flood:true,stamp:e.stamp})),...(site.effects||[]),...(s.auras||[]).filter(a=>catalogAuraActive(a)&&inside(a,at)).flatMap(a=>{const d=areaAuras[lookup(a.card).slug];return d?.flood||d?.drought?[{flood:d.flood,drought:d.drought,stamp:a.stamp||0}]:[];})].sort((a,b)=>(a.stamp||0)-(b.stamp||0));
  for(const u of s.units||[])if(u.at===at&&!u.dying){if(Array.isArray(u.spatialFloodSources))effects.push(...u.spatialFloodSources.map(source=>({flood:true,stamp:source.stamp})));else if(!u.silenced&&!u.boundDisabled&&!u.conditionDisabled&&!u.effectDisabled&&!u.mods.some(m=>m.disabled||m.asleep)&&aquaticPassives[lookup(u.card).slug]?.floodOccupiedSite)effects.push({flood:true,stamp:u.stamp||0});}
  effects.sort((a,b)=>(a.stamp||0)-(b.stamp||0));
  for(const effect of effects){if(effect.flood){value.water=Math.max(1,value.water);value.dry=false;}if(effect.drought){value.water=0;value.dry=true;}}
  return value;
}
export function waterSite(s,at,lookup){return !!s.board[at]&&siteAffinity(s,at,lookup).water>0;}
export function siteResourceGift(s,at,lookup){const site=s.board[at];if(!site||site.disabled||betaRulesPassives[lookup(site.card).slug]?.immutableSite)return 0;return (s.artifacts||[]).filter(a=>a.at===at&&!a.silenced&&!a.disabled&&batchPassives[lookup(a.card).slug]?.siteResourceGift).length;}
export function connectedSites(s,at,lookup,water=true){
  const taxicab=(a,b)=>geometryDistance(s,a,b,lookup),near=(a,b)=>geometryDistance(s,a,b,lookup,true)<=1;
  const fits=i=>!!s.board[i]&&waterSite(s,i,lookup)===water,result=new Set();if(!fits(at))return result;
  const queue=[at];result.add(at);for(let i=0;i<queue.length;i++)for(let j=0;j<20;j++)if(!result.has(j)&&taxicab(queue[i],j)===1&&fits(j)){result.add(j);queue.push(j);}return result;
}
export const bodyOfWater=(s,at,lookup)=>connectedSites(s,at,lookup,true);
export function region(s,u,lookup){return !s.board[u.at]?'void':u.layer==='below'?(waterSite(s,u.at,lookup)?'underwater':'underground'):'surface';}
export const regionNames=(s,u,lookup)=>geometryRegionNames(s,u,lookup,waterSite);
export const regionsOverlap=(s,a,b,lookup)=>geometryRegionsOverlap(s,a,b,lookup,waterSite);
// Measuring a spell/ability's range ignores movement keywords, but cannot cross
// a regional boundary even when the destination is in the starting region.
export function regionalDistance(s,from,at,lookup){
 let best=Infinity;
 for(const startRegion of regionNames(s,from,lookup)){
  const seen=new Map([[from.at,0]]),queue=[from.at];
  for(let i=0;i<queue.length;i++){const here=queue[i];if(here===at){best=Math.min(best,seen.get(here));break;}for(let next=0;next<20;next++)if(!seen.has(next)&&geometryDistance(s,here,next,lookup)===1&&regionNames(s,{at:next,layer:from.layer},lookup).has(startRegion)){seen.set(next,seen.get(here)+1);queue.push(next);}}
 }
  return best;
}
export function unitPower(u,lookup,defense=false){const c=lookup(u.card),mods=u.mods||[],set=mods.find(m=>m.set!==undefined);return u.powerSuppressed?0:Math.max(0,((set?set.set:u.zeroPower?0:(defense?c.defense:c.attack)??0)+(u.ongoingPower||0)+mods.reduce((n,m)=>n+(m.power||0),0))*mods.reduce((n,m)=>n*(m.powerMultiplier||1),1));}
export function canEnterOnGround(s,u,from,to,lookup,abilities,teleport=false,fly=false,queries=null){
  const taxicab=(a,b)=>geometryDistance(s,a,b,lookup),near=(a,b)=>geometryDistance(s,a,b,lookup,true)<=1;
  if(!Number.isInteger(to.at)||to.at<0||to.at>=20)return false;
  if(from.at===to.at&&(from.layer||'surface')===(to.layer||'surface'))return true;
  if(!borderMoveAllowed(s,u,from,to,lookup,abilities,teleport,fly,unitPower(u,lookup)))return false;
  if(lookup(u.card).type==='Minion'&&!s.board[from.at]&&s.board[to.at]&&!waterSite(s,to.at,lookup)){const span=connectedSites(s,to.at,lookup,false);if([...span].some(at=>siteEffectAllowed(s,u,'impedeMove',{card:lookup},s.board[at].card)&&!s.board[at].silenced&&!s.board[at].disabled&&batchPassives[lookup(s.board[at].card).slug]?.voidEntryFence))return false;}
  const destination=s.board[to.at],siteRule=destination&&!destination.silenced&&siteEffectAllowed(s,u,'impedeMove',{card:lookup},destination.card)?batchSitePassives[lookup(destination.card).slug]:null;
  if(siteRule?.entryPowerLimit!==undefined&&unitPower(u,lookup)>=siteRule.entryPowerLimit)return false;
  if(destination&&(queries?.spatialDenyEntry?queries.spatialDenyEntry(s,u,to,queries):s.units.some(v=>v.controller===u.controller&&!v.dying&&!v.silenced&&!v.boundDisabled&&!v.effectDisabled&&!v.conditionDisabled&&!(v.mods||[]).some(m=>m.disabled||m.asleep)&&batchPassives[lookup(v.card).slug]?.denyAlliedEntry&&occupied(v).includes(to.at))))return false;
  if(lookup(u.card).type==='Minion')for(const a of s.artifacts||[])if(a.at===to.at&&region(s,a,lookup)===region(s,to,lookup)){const d=batchPassives[lookup(a.card).slug];if(!a.silenced&&(d?.forbidEvilEntry&&!saintOfRedemptionActive(s,{card:lookup})&&(queries?.unitUmbrellas?queries.unitUmbrellas(u,queries.artifactController?queries.artifactController(s,a):a.controller??a.owner).includes('Evil'):(lookup(u.card).umbrellas.includes('Evil')||u.copyEvil||(u.mods||[]).some(m=>m.types?.includes('Demon'))))||d?.forbidAirborneEntry&&abilities(u).includes('Airborne')))return false;}
  if(teleport||fly||from.at===to.at||abilities(u).includes('Airborne')||region(s,from,lookup)!=='surface'||region(s,to,lookup)!=='surface')return true;
  if((s.artifacts||[]).some(a=>a.at===to.at&&(a.layer||'surface')==='surface'&&!a.silenced&&batchPassives[lookup(a.card).slug]?.enemyGroundEntry&&(s.units.find(v=>v.uid===a.bearer)?.controller??a.controller??a.owner)!==u.controller))return false;
  for(const [at,site] of s.board.entries())if(site&&!site.silenced&&siteEffectAllowed(s,u,'impedeMove',{card:lookup},site.card)){const rule=batchSitePassives[lookup(site.card).slug],other=from.at===at?to.at:to.at===at?from.at:null;if((rule?.blockTopGround||rule?.enemyTopGround&&site.controller!==u.controller)&&other!==null&&(other===at-5||u.verticalWrap&&at<5&&other===at+15))return false;}
  if(lookup(u.card).type!=='Minion')return true;
  return !siteEffectAllowed(s,u,'impedeMove',{card:lookup},s.board[to.at].card)||!betaTerrainPassives[lookup(s.board[to.at].card).slug]?.occupiedGroundEntry||!s.units.some(v=>v.uid!==u.uid&&!v.dying&&occupied(v).includes(to.at)&&(v.layer||'surface')==='surface'&&lookup(v.card).type==='Minion');
}
export function locations(s,u,lookup,abilities,stepOnly=false,queries=null){
  const taxicab=(a,b)=>geometryDistance(s,a,b,lookup),near=(a,b)=>geometryDistance(s,a,b,lookup,true)<=1;
  if(u.geometryLocations)return growthLocations(s,u,{card:lookup,keywords:abilities,canEnterOnGround:(...args)=>canEnterOnGround(...args.slice(0,6),args[6]||false,args[7]||false,queries),waterSite},stepOnly);
  const keys=abilities(u),startLayer=u.layer||'surface';
  const max=keys.includes('Immobile')?0:stepOnly?1:1+(u.silenced?0:Number((lookup(u.card).rules.match(/Movement \+(\d+)/)||[])[1]||0))+(u.grantedMovement||0)+u.mods.reduce((n,m)=>n+(m.movement||0),0);
  const gate=at=>lookup(u.card).type==='Minion'&&s.board[at]&&lookup(s.board[at].card).slug==='planar_gate'&&siteEffectAllowed(s,u,'move',{card:lookup},s.board[at].card);
  const start={at:u.at,layer:startLayer,path:[],cost:0,clearArrival:false,gateVoidwalk:!!u.gateVoidwalk&&siteEffectAllowed(s,u,'modify',{card:lookup},lookup('planar_gate').id)},seen=new Map([[u.at+':'+startLayer,start]]),frontier=[start];
  if(keys.includes('Immobile')||u.swallowedBy)return [start];
  const passive=u.silenced?null:aquaticPassives[lookup(u.card).slug];
  const links=(s.ongoingEffects||[]).filter(e=>e.op==='linkBody'&&e.controller===u.controller).map(e=>connectedSites(s,s.board.findIndex(site=>site?.uid===e.rootUid),lookup,e.water));
  for(const e of s.ongoingEffects||[])if(e.op==='pairedSites'&&e.end===s.turn){const pair=e.siteUids.map(uid=>s.board.findIndex(site=>site?.uid===uid));if(pair.every(at=>at>=0))links.push(new Set(pair));}
  for(const [at,site] of s.board.entries())if(site&&!site.silenced&&siteEffectAllowed(s,u,'move',{card:lookup},site.card)){const d=batchSitePassives[lookup(site.card).slug];if(d?.burrowedSiteLinks&&u.layer==='below'&&keys.includes('Burrowing')&&site.controller===u.controller)for(const [other,target] of s.board.entries())if(target?.controller===u.controller)links.push(new Set([at,other]));if(d?.voidSiteLinks&&u.layer!=='below')for(let other=0;other<20;other++)if(!s.board[other])links.push(new Set([at,other]));}
  const survives=(at,layer,node=start)=>{
    const linkedVoid=(from,to)=>links.some(set=>set.has(from)&&set.has(to));
    if(u.size===2||u.geometryFixedCells){if(u.size===2&&!u.geometryWrap&&(at%5>3||Math.floor(at/5)>2))return false;return geometryLocationRecords({...u,at,layer}).every(loc=>loc.at>=0&&loc.at<20&&(s.board[loc.at]?(loc.layer==='surface'||keys.includes(waterSite(s,loc.at,lookup)?'Submerge':'Burrowing')):loc.layer==='surface'&&(keys.includes('Voidwalk')||node.gateVoidwalk||gate(node.at)||linkedVoid(node.at,loc.at))));}
    if(!s.board[at])return layer==='surface'&&(keys.includes('Voidwalk')||node.gateVoidwalk||gate(node.at)||linkedVoid(node.at,at));
    if(layer==='below')return keys.includes(waterSite(s,at,lookup)?'Submerge':'Burrowing');
    return true;
  };
  while(frontier.length){
    frontier.sort((a,b)=>a.cost-b.cost);const node=frontier.shift();if(seen.get(node.at+':'+node.layer)!==node)continue;
    if((keys.includes('Waterbound')&&!waterSite(s,node.at,lookup))||(keys.includes('Landbound')&&(!s.board[node.at]||waterSite(s,node.at,lookup))))continue;
    for(let at=0;at<20;at++)for(const layer of ['surface','below']){
      const from=xy(node.at),to=xy(at);
      if(queries?.spatialMazeAllows?!queries.spatialMazeAllows(s,u,node,{at,layer},queries):(lookup(u.card).type==='Minion'&&s.units.some(v=>v.controller!==u.controller&&!v.dying&&!v.silenced&&!v.effectDisabled&&!v.restraintDisabled&&!v.boundDisabled&&!(v.mods||[]).some(m=>m.disabled||m.asleep)&&lookup(v.card).slug==='maze_minotaur'&&region(s,v,lookup)===region(s,u,lookup)&&occupied({...u,at:node.at}).some(cell=>near(cell,v.at))&&!occupied({...u,at}).every(cell=>near(cell,v.at)))))continue;
      if(u.moveAxis==='none')continue;
      if(u.moveAxis==='horizontal'&&(from.y!==to.y||layer!==node.layer))continue;
      if(u.moveAxis==='forward'&&(from.x!==to.x||to.y-from.y!==(u.controller===0?-1:1)||layer!==node.layer))continue;
      if((keys.includes('Waterbound')&&!waterSite(s,at,lookup))||(keys.includes('Landbound')&&(!s.board[at]||waterSite(s,at,lookup))))continue;
      const iceLocked=node.at===at&&layer!==node.layer&&lookup(u.card).type==='Minion'&&waterSite(s,at,lookup)&&s.board.some((site,i)=>site&&batchSitePassives[lookup(site.card).slug]?.nearbyNoSubmergeSurface&&siteEffectAllowed(s,u,'impedeMove',{card:lookup},site.card)&&occupied({...u,at}).some(cell=>near(i,cell)));
      const vertical=node.at===at&&layer!==node.layer&&s.board[at]&&!iceLocked&&survives(at,'below');
      const wrapped=u.verticalWrap&&(from.x===to.x||keys.includes('Airborne')&&layer==='surface'&&Math.abs(from.x-to.x)===1)&&(u.size===2?Math.abs(from.y-to.y)===2&&[from.y,to.y].every(y=>y===0||y===2):Math.abs(from.y-to.y)===3);
      const horizontal=(layer===node.layer||keys.includes('Voidwalk')&&(isVoidCell(s,node.at,lookup)||isVoidCell(s,at,lookup)))&&node.at!==at&&(taxicab(node.at,at)===1||wrapped||(layer==='surface'&&s.board[node.at]&&keys.includes('Airborne')&&near(node.at,at))||links.some(set=>set.has(node.at)&&set.has(at))||geometryLeap(s,u,node,{at,layer},lookup));
      const clearLand=passive?.freeClearLand&&s.board[node.at]&&s.board[at]&&!waterSite(s,node.at,lookup)&&!waterSite(s,at,lookup)&&!s.units.some(v=>v.uid!==u.uid&&(v.at===node.at||v.at===at));
      const free=u.freeRows?.includes(Math.floor(node.at/5))&&Math.floor(node.at/5)===Math.floor(at/5)&&layer===node.layer||passive?.freeWater&&waterSite(s,node.at,lookup)&&waterSite(s,at,lookup)||passive?.freeAxis==='horizontal'&&from.y===to.y&&layer===node.layer||clearLand||s.board[node.at]&&betaTerrainPassives[lookup(s.board[node.at].card).slug]?.freeAirborneDeparture&&siteEffectAllowed(s,u,'move',{card:lookup},s.board[node.at].card)&&lookup(u.card).type==='Minion'&&keys.includes('Airborne')&&node.layer==='surface';
      if(node.clearArrival&&!clearLand)continue;
      const sourceFree=queries?.spatialFreeMove?.(s,u,node,{at,layer},queries),cost=node.cost+(!stepOnly&&(free||sourceFree)?0:1),old=seen.get(at+':'+layer);
      if((vertical||horizontal)&&survives(at,layer,node)&&geometryLocationRecords({...u,at,layer}).every((loc,i)=>geometryLocationRecords({...u,at:node.at,layer:node.layer}).some(old=>old.at===loc.at&&old.layer===loc.layer)||canEnterOnGround(s,u,geometryLocationRecords({...u,at:node.at,layer:node.layer})[i],loc,lookup,abilities,false,false,queries))&&cost<=max&&(!old||cost<old.cost)){
        const value={at,layer,cost,clearArrival:!!(node.clearArrival||clearLand),gateVoidwalk:!s.board[at]&&!!(node.gateVoidwalk||gate(node.at)),path:[...node.path,{at,layer}]};seen.set(at+':'+layer,value);frontier.push(value);
      }
    }
  }return [...seen.values()].filter(v=>v.at===u.at&&v.layer===startLayer||geometryOwnMoveAllowed(s,u,v.at,v.layer,lookup));
}
import { areaAuras,inside } from './objects.js';
import {borderMoveAllowed} from './borders.js';
import { aquaticPassives } from './aquatic.js';
import { betaRulesPassives } from './beta-rules.js';
import { betaTerrainPassives } from './beta-terrain.js';
import {batchSitePassives,batchPassives} from './card-batches.js';
import {isVoidCell,geometryLocationRecords,geometryLeap,geometryOwnMoveAllowed,geometryOccupied,geometryRegionNames,geometryRegionsOverlap,geometryDistance,growthLocations} from './final-geometry.js';
