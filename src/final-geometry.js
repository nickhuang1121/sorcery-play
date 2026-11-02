// Spatial characteristics and rule hooks for the final card implementation pass.
// This module deliberately imports neither engine nor geography, so the latter
// may call it without introducing an initialization cycle.
export const geometryPassives = {
  aethermoeba: { geometryGrowth: 'void' },
  megamoeba: { geometryGrowth: 'all' },
  yog_sothoth: { geometryEverywhere: true, geometryIgnoreSites: true },
  magellan_globe: { geometryWrap: true },
  felbog_frog_men: { geometryLeap: true },
  cerberus_in_chains: { geometryFollowAvatar: true },
  edge_of_the_world: { geometryNeedsVoid: true },
  the_void: { geometryAlsoVoid: true },
  putrid_presence: { geometryAttackBelow: true },
};
const cells = Array.from({length:20},(_,i)=>i);
const valid = at => Number.isInteger(at)&&at>=0&&at<20;
const taxi = (a,b) => Math.abs(a%5-b%5)+Math.abs(Math.floor(a/5)-Math.floor(b/5));
const near = (a,b) => Math.max(Math.abs(a%5-b%5),Math.abs(Math.floor(a/5)-Math.floor(b/5)))<=1;
export function geometryRules(u,lookup){
 const native=geometryPassives[lookup(u.card).slug]||{};
 if(!Array.isArray(u.geometryAbilitySources))return {...native,...(native.geometryEverywhere?{geometrySafetyEverywhere:true,geometryNeedsFiveVoids:true,geometryIgnoreSites:true}:{})};
 // Printed occupancy sets native size; borrowed sources grant the safety and
 // banishment abilities without copying that characteristic.
 const result={geometryGrowths:[],geometryEverywhere:!!native.geometryEverywhere};
 for(const layer of u.geometryAbilitySources){for(const [key,value] of Object.entries(layer.passive)){if(key==='geometryGrowth')result.geometryGrowths.push(value);else if(value)result[key]=value;}}
 if(result.geometryGrowths.length)result.geometryGrowth=result.geometryGrowths[0];return result;
}
const rule=geometryRules;
const growing=u=>u.geometryGrowing===undefined?!u.silenced:!!u.geometryGrowing;
export const geometryActive = (u,disabled=()=>false) => !u.dying&&!disabled(u)&&(!u.silenced||u.geometryAbilitySources?.some(l=>l.nature==='gained'));


// The Void remains a Site. Callers must not delete its board entry to represent
// voidness; doing so loses its controller, resources and attackable site identity.
export function isVoidCell(s,at,lookup) {
  const site=s.board[at];
  return !site||!site.silenced&&!site.disabled&&rule(site,lookup).geometryAlsoVoid===true;
}
export function voidCount(s,lookup) { return cells.filter(at=>isVoidCell(s,at,lookup)).length; }
export function globeActive(s,lookup) {
  return (s.artifacts||[]).some(a=>geometryActive(a,u=>!!u.disabled)&&rule(a,lookup).geometryWrap);
}
// Used for movement, adjacency, range, water connectivity and spell areas alike.
export function geometryDistance(s,a,b,lookup,diagonal=false) {
  let dx=Math.abs(a%5-b%5),dy=Math.abs(Math.floor(a/5)-Math.floor(b/5));
  if(globeActive(s,lookup)){dx=Math.min(dx,5-dx);dy=Math.min(dy,4-dy);}
  return diagonal?Math.max(dx,dy):dx+dy;
}
export function geometryTranslate(s,anchor,from,to,lookup){
 let dx=to%5-from%5,dy=Math.floor(to/5)-Math.floor(from/5),x,y;
 const wrap=globeActive(s,lookup);
 if(wrap){if(dx>2)dx-=5;if(dx< -2)dx+=5;if(dy>2)dy-=4;if(dy< -2)dy+=4;}
 x=anchor%5+dx;y=Math.floor(anchor/5)+dy;
 if(wrap)return ((y%4+4)%4)*5+(x%5+5)%5;
 return x>=0&&x<5&&y>=0&&y<4?y*5+x:-1;
}
const geometryOutside=u=>u.size===2&&!u.geometryFixedCells?(u.at%5===4||u.at>=15):geometryLocationRecords({...u,geometryWrap:false}).some(loc=>!valid(loc.at));
export function geometryFallOptions(s,u,A){
 const plain=geometryLocationRecords({...u,geometryWrap:false});
 if(!geometryOutside(u))return [];
 const keys=A.keywords(u),isAvatar=A.card(u.card).type==='Avatar';
 const old=geometryLocationRecords({...u,geometryWrap:true}),options=[];
 for(const at of cells){
  const target=geometryLocationRecords({...u,at,geometryWrap:false});
  const safe=!geometryOutside({...u,at})&&target.every((loc,i)=>{
   if(!valid(loc.at))return false;
   if(!isAvatar&&(isVoidCell(s,loc.at,A.card)&&!keys.includes('Voidwalk')||loc.layer==='below'&&s.board[loc.at]&&!keys.includes(A.waterSite(s,loc.at,A.card)?'Submerge':'Burrowing')))return false;
   return A.canEnterOnGround(s,u,old[i],loc,A.card,A.keywords,true);
  });
  if(safe){let dx=Math.abs(at%5-u.at%5),dy=Math.abs(Math.floor(at/5)-Math.floor(u.at/5));const distance=Math.min(dx,5-dx)+Math.min(dy,4-dy);options.push({label:String.fromCharCode(65+at%5)+(4-Math.floor(at/5)),value:{at,layer:u.layer||'surface'},distance});}
 }
 const nearest=Math.min(...options.map(o=>o.distance));return options.filter(o=>o.distance===nearest).map(({label,value})=>({label,value}));
}
// Engine hook: run before position-dependent continuous effects. Decisions use
// the engine's deterministic action transaction; restore of a staged pending
// choice must keep its displayed footprint until that transaction resumes.
export function refreshGeometryWorld(s,A,choose){
 if(s.finalDecisionPending&&!s.finalDecisionReplay)return false;
 const wrap=globeActive(s,A.card);let moved=false;
 for(const u of [...s.units]){
  if(wrap){u.geometryWrap=true;continue;}
  if(u.geometryWrap&&(u.size===2||u.geometryFixedCells)&&geometryOutside(u)&&!u.dying){
   let options=geometryFallOptions(s,u,A),shrink=false;
   if(!options.length&&A.card(u.card).type==='Avatar'){
    shrink=true;options=geometryLocationRecords({...u,geometryWrap:true}).map(loc=>({label:String.fromCharCode(65+loc.at%5)+(4-Math.floor(loc.at/5))+' '+loc.layer,value:loc}));
   }
   if(options.length>1&&(!s.finalDecisionReplay||!choose))continue;
   if(!options.length){A.kill(s,u,false,true);u.geometryWrap=false;continue;}
   const selected=options.length===1?options[0].value:choose('globe-fall:'+u.uid,u.controller,options,'Magellan Globe · 選擇最近合法位置',u);
   if(shrink){u.size=1;delete u.geometryFixedCells;delete u.geometryFixedOffsets;delete u.geometryFixedAnchor;}
   u.at=selected.at;u.layer=selected.layer;u.notRest=true;u.burrowedSafely=false;moved=true;
  }
  u.geometryWrap=false;
 }
 for(const aura of s.auras||[])if(!s.units.includes(aura)){
  // Project ruling: a spanning ordinary Aura stays on its actual four cells
  // when the final Globe disappears; it is not relocated or silently dropped.
  if(!wrap&&aura.geometryWrap&&aura.wallTo===undefined&&!aura.singleSite&&!aura.geometryRetainedCells&&(aura.at%5===4||aura.at>=15)){
   const x=aura.at%5,y=Math.floor(aura.at/5);aura.geometryRetainedCells=[aura.at,y*5+(x+1)%5,((y+1)%4)*5+x,((y+1)%4)*5+(x+1)%5];
  }
  aura.geometryWrap=wrap;
 }
 return moved;
}

// Size is a characteristic. A silence does not shrink an already expanded unit.
// A synthetic {...u,at:destination} preview includes the newly occupied cell.
export function geometryOccupied(u) {
  if(u.geometryCasterLocation)return [u.geometryCasterLocation.at];
  if(u.geometryEverywhere)return [...cells];
  if(u.geometryLocations)return [...new Set(geometryLocationRecords(u).map(v=>v.at))];
  if(u.geometryFixedCells){
   return [...new Set(fixedGeometryRecords(u).map(loc=>loc.at))];
  }
  if(u.geometryCells)return [...new Set([...u.geometryCells,u.at])].filter(valid);
  if(u.size===2&&u.geometryWrap)return [0,1].flatMap(dy=>[0,1].map(dx=>((Math.floor(u.at/5)+dy)%4)*5+(u.at%5+dx)%5));
  return null;
}
export function setFixedGeometry(u,locations,wrapped=false){
 u.geometryFixedAnchor=u.at;u.geometryFixedCells=locations.map(loc=>typeof loc==='number'?loc:loc.at);
 u.geometryFixedOffsets=locations.map(loc=>{const at=typeof loc==='number'?loc:loc.at,layer=typeof loc==='number'?u.layer||'surface':loc.layer||'surface';let x=at%5-u.at%5,y=Math.floor(at/5)-Math.floor(u.at/5),z=(layer==='below'?1:0)-((u.layer||'surface')==='below'?1:0);if(wrapped){if(x>2)x-=5;if(x< -2)x+=5;if(y>2)y-=4;if(y< -2)y+=4;}return {x,y,z};});
 u.geometryWrap=wrapped;
}
function fixedGeometryRecords(u){
 const offsets=u.geometryFixedOffsets||u.geometryFixedCells.map(at=>({x:at%5-(u.geometryFixedAnchor??u.at)%5,y:Math.floor(at/5)-Math.floor((u.geometryFixedAnchor??u.at)/5),z:0}));
 return offsets.map(d=>{let x=u.at%5+d.x,y=Math.floor(u.at/5)+d.y,z=((u.layer||'surface')==='below'?1:0)+(d.z||0);if(u.geometryWrap){x=(x%5+5)%5;y=(y%4+4)%4;}return {at:x>=0&&x<5&&y>=0&&y<4&&z>=0&&z<2?y*5+x:-1,layer:z===1?'below':'surface'};});
}
export function geometryLocationRecords(u){
 if(u.geometryCasterLocation)return [{...u.geometryCasterLocation}];
 if(u.geometryEverywhere)return cells.flatMap(at=>[{at,layer:'surface'},{at,layer:'below'}]);
 if(u.geometryFixedCells)return fixedGeometryRecords(u);
 if(!u.geometryLocations)return (geometryOccupied(u)||(u.size===2?[u.at,u.at+1,u.at+5,u.at+6]:[u.at])).map(at=>({at,layer:u.layer||'surface'}));
 const origin=u.geometryAnchor||{at:u.at,layer:u.layer||'surface'};
 if(!growing(u)){
  const dx=u.at%5-origin.at%5,dy=Math.floor(u.at/5)-Math.floor(origin.at/5),dz=((u.layer||'surface')==='below'?1:0)-(origin.layer==='below'?1:0);
  return u.geometryLocations.map(v=>{let x=v.at%5+dx,y=Math.floor(v.at/5)+dy;const z=(v.layer==='below'?1:0)+dz;if(u.geometryWrap){x=(x%5+5)%5;y=(y%4+4)%4;}return {at:x<0||x>=5||y<0||y>=4||z<0||z>1?-1:y*5+x,layer:z===1?'below':'surface'};});
 }
 const result=u.geometryLocations.map(v=>({...v})),current={at:u.at,layer:u.layer||'surface'};
 if(!result.some(v=>v.at===current.at&&v.layer===current.layer))result.push(current);
 return result;
}
export function occupiesGeometryLocation(u,at,layer='surface',s=null){
 if(u.geometryEverywhere)return true;
 if(u.geometryLocations||u.geometryFixedCells)return geometryLocationRecords(u).some(v=>v.at===at&&(s&&!s.board[at]||v.layer===layer));
 const occupied=geometryOccupied(u)||(u.size===2?[u.at,u.at+1,u.at+5,u.at+6]:[u.at]);
 return occupied.includes(at)&&(s&&!s.board[at]||(u.layer||'surface')===layer);
}
export function geometryRegionNames(s,u,lookup,waterSite){
 const result=new Set();
 const locations=geometryLocationRecords(u);
 for(const loc of locations){
  const site=s.board[loc.at];
  if(!site){result.add('void');continue;}
  result.add(loc.layer==='below'?(waterSite(s,loc.at,lookup)?'underwater':'underground'):'surface');
  if(isVoidCell(s,loc.at,lookup))result.add('void');
 }
 return result;
}
export function geometryRegionsOverlap(s,a,b,lookup,waterSite){
 const first=geometryRegionNames(s,a,lookup,waterSite),second=geometryRegionNames(s,b,lookup,waterSite);
 return [...first].some(region=>second.has(region));
}
export function initGeometryUnit(u,lookup) {
  const d=rule(u,lookup);
  if(d.geometryEverywhere)u.geometryEverywhere=true;
  if(d.geometryGrowth&&!u.geometryCells)u.geometryCells=[u.at];
}
// Activate during engine integration only; preserves old geometryCells saves.
export function initGeometryLocations(u,lookup){
 initGeometryUnit(u,lookup);
 if(rule(u,lookup).geometryGrowth&&!u.geometryLocations){u.geometryLocations=(u.geometryCells||[u.at]).map(at=>({at,layer:u.layer||'surface'}));u.geometryAnchor={at:u.at,layer:u.layer||'surface'};}
}
export function commitGeometryLocations(u,lookup){
 initGeometryLocations(u,lookup);if(!u.geometryLocations)return;
 u.geometryLocations=geometryLocationRecords(u).filter(v=>valid(v.at));u.geometryAnchor={at:u.at,layer:u.layer||'surface'};
 u.geometryCells=[...new Set(u.geometryLocations.map(v=>v.at))];
}
export function geometrySafe(s,u,A){
 const keys=A.keywords(u);
 if(rule(u,A.card).geometrySafetyEverywhere&&geometryActive(u,A.disabled))return true;
 return geometryLocationRecords(u).every(v=>valid(v.at)&&(!isVoidCell(s,v.at,A.card)||keys.includes('Voidwalk')||A.card(u.card).type==='Avatar')&&(!s.board[v.at]||v.layer!=='below'||keys.includes(A.waterSite(s,v.at,A.card)?'Submerge':'Burrowing')||u.burrowedSafely));
}
export function refreshGeometry(s,A) {
  const {card,disabled=()=>false}=A;
  for(const u of s.units){
    initGeometryUnit(u,card);
    const d=rule(u,card);
    if(u.geometryCells&&!u.geometryCells.includes(u.at))u.geometryCells.push(u.at);
    if(geometryActive(u,disabled)&&d.geometryGrowth)
      for(const growth of d.geometryGrowths?.length?d.geometryGrowths:[d.geometryGrowth])u.ongoingPower=(u.ongoingPower||0)+(u.geometryLocations?geometryLocationRecords(u).filter(v=>growth==='all'||isVoidCell(s,v.at,card)).length:geometryOccupied(u).filter(at=>growth==='all'||isVoidCell(s,at,card)).length);
  }
}
export function geometrySummonAllowed(s,p,c,at,lookup,occupied=u=>geometryOccupied(u)||[u.at],layer='surface') {
  const record=c.printedAbilityRecord||c.abilityLayerRecord;
  const follows=record?record.records.some(r=>r.passive?.geometryFollowAvatar):geometryPassives[c.slug]?.geometryFollowAvatar;
  if(!follows)return true;
  const avatar=s.units.find(u=>u.controller===p&&!u.dying&&lookup(u.card).type==='Avatar');
  return !!avatar&&occupied(avatar).includes(at)&&(avatar.layer||'surface')===layer;
}
// Cerberus teleports only when its avatar enters a location. A later refresh
// does not pull it back if some other effect moved Cerberus and the avatar stayed.
export function followGeometryAvatars(s,A) {
  const {card,disabled=()=>false}=A;
  let changed=false;
  const entered=new Set();
  for(const avatar of s.units)if(!avatar.dying&&card(avatar.card).type==='Avatar'){
    const signature=avatar.at+':'+(avatar.layer||'surface');
    if(avatar.followSignature!==signature){avatar.followSignature=signature;entered.add(avatar.uid);}
  }
  for(const u of s.units)if(geometryActive(u,disabled)&&rule(u,card).geometryFollowAvatar){
    const avatar=s.units.find(v=>v.controller===u.controller&&!v.dying&&card(v.card).type==='Avatar');
    if(!avatar||!entered.has(avatar.uid))continue;
    if(u.at!==avatar.at||(u.layer||'surface')!==(avatar.layer||'surface')){
      u.at=avatar.at;u.layer=avatar.layer||'surface';u.notRest=true;
      changed=true;
    }
  }
  return changed;
}
export function geometryOwnMoveAllowed(s,u,at,layer,lookup) {
  if(!geometryActive(u)||!rule(u,lookup).geometryFollowAvatar)return true;
  const avatar=s.units.find(v=>v.controller===u.controller&&!v.dying&&lookup(v.card).type==='Avatar');
  if(!avatar||(avatar.layer||'surface')!==(layer||'surface')||(u.layer||'surface')!==(layer||'surface'))return false;
  const airborne=!u.silenced&&[...(lookup(u.card).keywords||[]),...(u.grantedKeywords||[]),...(u.mods||[]).flatMap(m=>m.keyword?[m.keyword]:[])].includes('Airborne');
  return geometryDistance(s,at,avatar.at,lookup,airborne)<=geometryDistance(s,u.at,avatar.at,lookup,airborne);
}
export function geometryLeap(s,u,from,to,lookup) {
  if(!geometryActive(u)||!rule(u,lookup).geometryLeap||(from.layer||'surface')!==(to.layer||'surface'))return false;
  if((from.layer||'surface')!=='surface'||taxi(from.at,to.at)!==2)return false;
  // A leap is straight over one adjacent Site, never diagonally over a corner.
  if(from.at%5!==to.at%5&&Math.floor(from.at/5)!==Math.floor(to.at/5))return false;
  return !!s.board[(from.at+to.at)/2];
}
export function edgePlacementAllowed(s,c,at,lookup) {
  if(c.slug!=='edge_of_the_world')return true;
  return cells.some(other=>other!==at&&geometryDistance(s,at,other,lookup)===1&&isVoidCell(s,other,lookup));
}
// Validate the resulting terrain atomically. In particular, moving a Site away
// can create the required void while filling another one in the same operation.
export function geometryBoardAllowed(s,board,lookup) {
  const projected={...s,board};
  return !board.some((site,at)=>site&&geometryActive(site,u=>!!u.disabled)&&rule(site,lookup).geometryNeedsVoid&&!edgePlacementAllowed(projected,lookup(site.card),at,lookup));
}
export function geometryPlaceSiteAllowed(s,c,at,lookup) {
  const board=[...s.board];board[at]={card:c.id,controller:null,owner:null};
  return geometryBoardAllowed(s,board,lookup);
}
export function geometryMoveSiteAllowed(s,from,to,lookup) {
  const board=[...s.board];[board[from],board[to]]=[board[to],board[from]];
  return geometryBoardAllowed(s,board,lookup);
}
export function geometryRemoveArtifactAllowed(s,artifact,lookup) {
  if(!rule(artifact,lookup).geometryWrap)return true;
  return geometryBoardAllowed({...s,artifacts:s.artifacts.filter(a=>a.uid!==artifact.uid)},s.board,lookup);
}
// Return violations rather than mutating board identities. Yog explicitly says
// banish; Edge does not name a remedy, so its violations require the applicable
// Codex/FAQ ruling and must not be guessed as destroy or banish.
export function geometryViolations(s,A) {
  const {card,disabled=()=>false}=A,result={banish:[],invalidSites:[]};
  for(const u of s.units)if(geometryActive(u,disabled)&&rule(u,card).geometryNeedsFiveVoids&&voidCount(s,card)<5)result.banish.push(u.uid);
  for(const [at,site] of s.board.entries())if(site&&geometryActive(site,u=>!!u.disabled)&&rule(site,card).geometryNeedsVoid&&!edgePlacementAllowed(s,card(site.card),at,card))result.invalidSites.push(at);
  return result;
}
export function canAttackSubsurface(s,at,lookup,disabled=()=>false,occupied=u=>geometryOccupied(u)||[u.at]) {
  return !!s.board[at]&&s.units.some(u=>geometryActive(u,disabled)&&rule(u,lookup).geometryAttackBelow&&occupied(u).some(cell=>geometryDistance(s,cell,at,lookup,true)<=1));
}

// Expansion is not translation: each destination adds a cell while all previous
// cells remain occupied. Use before geography.locations' ordinary translation.
// Each path entry is serializable and the engine's travelStep revalidates it.
export function growthLocations(s,u,A,stepOnly=false) {
  const {card,keywords,canEnterOnGround}=A,d=rule(u,card);
  if(!d.geometryGrowth&&!u.geometryLocations)return null;
  if(u.geometryLocations)return growthLocationRecords(s,u,A,stepOnly);
  const keys=keywords(u),layer=u.layer||'surface',start={at:u.at,layer,path:[],cost:0};
  if(u.silenced||keys.includes('Immobile')||u.swallowedBy)return [start];
  const maximum=stepOnly?1:1+Number((card(u.card).rules.match(/Movement \+(\d+)/)||[])[1]||0)+(u.grantedMovement||0)+(u.mods||[]).reduce((n,m)=>n+(m.movement||0),0);
  const states=[{...start,cells:geometryOccupied(u)||[u.at]}],best=new Map([[u.at,start]]);
  for(let i=0;i<states.length;i++){
    const node=states[i];if(node.cost>=maximum)continue;
    for(const at of cells){
      if(node.cells.includes(at))continue;
      const survives=isVoidCell(s,at,card)?keys.includes('Voidwalk'):layer==='surface'||keys.includes(A.waterSite(s,at,card)?'Submerge':'Burrowing');
      if(!survives)continue;
      const from=node.cells.find(origin=>geometryDistance(s,origin,at,card)===1&&canEnterOnGround(s,u,{at:origin,layer},{at,layer},card,keywords));
      if(from===undefined)continue;
      const value={at,layer,path:[...node.path,{at,layer}],cost:node.cost+1};
      if(!best.has(at)||best.get(at).cost>value.cost){best.set(at,value);states.push({...value,cells:[...node.cells,at]});}
    }
  }
  return [...best.values()];
}
function growthLocationRecords(s,u,A,stepOnly){
 const {card,keywords,canEnterOnGround,waterSite}=A,keys=keywords(u),layer=u.layer||'surface';
 const start={at:u.at,layer,path:[],cost:0},initial=geometryLocationRecords(u);
 if(keys.includes('Immobile')||u.swallowedBy)return [start];
 const max=stepOnly?1:1+Number((card(u.card).rules.match(/Movement \+(\d+)/)||[])[1]||0)+(u.grantedMovement||0)+(u.mods||[]).reduce((n,m)=>n+(m.movement||0),0);
 const nodes=[{...start,locations:initial}],best=new Map([[u.at+':'+layer,start]]);
 const survives=loc=>valid(loc.at)&&(!isVoidCell(s,loc.at,card)||keys.includes('Voidwalk'))&&(!s.board[loc.at]||loc.layer!=='below'||keys.includes(waterSite(s,loc.at,card)?'Submerge':'Burrowing'))&&(!keys.includes('Waterbound')||waterSite(s,loc.at,card))&&(!keys.includes('Landbound')||s.board[loc.at]&&!waterSite(s,loc.at,card));
 for(let i=0;i<nodes.length;i++){
  const node=nodes[i];if(node.cost>=max)continue;
  const d=rule(u,card),growths=d.geometryGrowths?.length?d.geometryGrowths:[d.geometryGrowth],count=locations=>growths.reduce((sum,growth)=>sum+locations.filter(loc=>growth==='all'||isVoidCell(s,loc.at,card)).length,0);
  const preview={...u,ongoingPower:(u.ongoingPower||0)+(!growing(u)?0:count(node.locations)-count(initial)),at:node.at,layer:node.layer,geometryLocations:node.locations,geometryAnchor:{at:node.at,layer:node.layer}};
  for(const at of cells)for(const destLayer of ['surface','below']){
   const to={at,layer:destLayer};if(!s.board[at]&&destLayer==='below'||at===node.at&&destLayer===node.layer)continue;
   let locs;
   if(!growing(u)){
    const from={at:node.at,layer:node.layer},sameLayer=node.layer===destLayer,adjacent=geometryDistance(s,node.at,at,card)===1||keys.includes('Airborne')&&geometryDistance(s,node.at,at,card,true)===1;
    if(!(sameLayer&&adjacent||node.at===at&&!sameLayer))continue;
    locs=geometryLocationRecords({...preview,at,layer:destLayer});
    if(!locs.every((loc,index)=>survives(loc)&&canEnterOnGround(s,preview,node.locations[index],loc,card,keywords)))continue;
   }else{
    const existing=node.locations.some(loc=>loc.at===at&&loc.layer===destLayer);
    const from=node.locations.find(origin=>{
     if(existing&&origin.at===at&&origin.layer===destLayer)return true;
     const vertical=origin.at===at&&origin.layer!==destLayer&&!!s.board[at];
     const adjacent=geometryDistance(s,origin.at,at,card)===1||keys.includes('Airborne')&&origin.layer==='surface'&&destLayer==='surface'&&geometryDistance(s,origin.at,at,card,true)===1;
     const horizontal=adjacent&&(origin.layer===destLayer||keys.includes('Voidwalk')&&(isVoidCell(s,origin.at,card)||isVoidCell(s,at,card)));
     return (vertical||horizontal)&&canEnterOnGround(s,preview,origin,to,card,keywords);
    });
    if(from===undefined||!survives(to))continue;
    locs=existing?node.locations:[...node.locations,to];
   }
   const value={at,layer:destLayer,path:[...node.path,to],cost:node.cost+1},key=at+':'+destLayer;
   if(!best.has(key)||best.get(key).cost>value.cost){best.set(key,value);nodes.push({...value,locations:locs});}
  }
 }
 return growing(u)&&max>0?[...best.values(),{at:u.at,layer,path:[{at:u.at,layer}],cost:1}]:[...best.values()];
}

// The Rack expands a fixed physical shape. This is entering a location, not a
// movement: the engine consumes geometryEnteredLocations as entry-only history.
export const geometryDefinitions={the_rack:{}};
export const geometryOperations=['geometryRackStretch','geometryForcePlan','geometryPseudopodMove','geometryWhirlDeclare'];
export function geometryRackStrike(s,bearer,target,A){
 if(A.card(target.card).type!=='Avatar')return [];
 return (s.artifacts||[]).filter(a=>a.bearer===bearer.uid&&!a.silenced&&!a.disabled&&A.card(a.card).slug==='the_rack').map(a=>({source:{...a,controller:A.artifactController(s,a)},controller:A.artifactController(s,a),steps:[{op:'geometryRackStretch',uid:target.uid}]}));
}
export function geometryRackOptions(s,u,A){
 const current=geometryLocationRecords(u),keys=A.keywords(u),options=[];
 for(const at of cells)for(const layer of ['surface','below']){
  const to={at,layer};if(current.some(v=>s.board[v.at]&&v.layer!==layer)||current.some(v=>v.at===at&&v.layer===layer)||!s.board[at]&&layer==='below')continue;
  if(layer==='below'&&(!s.board[at]||!keys.includes(A.waterSite(s,at,A.card)?'Submerge':'Burrowing')))continue;
  const from=current.find(v=>geometryDistance(s,v.at,at,A.card)<=1&&A.regionsOverlap(s,v,to)&&A.canEnterOnGround(s,u,v,to,A.card,A.keywords));
  if(from)options.push({label:String.fromCharCode(65+at%5)+(4-Math.floor(at/5))+' '+layer,value:to});
 }
 return options;
}
export function resolveGeometry(s,frame,A){
 const {step,source,controller:p,selected}=frame;if(step.op==='geometryWhirlDeclare')return resolveGeometryWhirl(s,frame,A);if(step.op!=='geometryRackStretch')return false;
 const u=A.unit(s,step.uid);if(!u||u.dying||A.card(u.card).type!=='Avatar')return true;
 const options=geometryRackOptions(s,u,A);
 if(selected===undefined&&options.length){s.choice={player:p,title:'The Rack · 選擇伸展位置',options,frame};return true;}
 if(selected!==undefined){
  const option=options.find(o=>o.value.at===selected.at&&o.value.layer===selected.layer);if(!option)return true;
  const records=geometryLocationRecords(u);setFixedGeometry(u,[...records,option.value],globeActive(s,A.card));
  u.geometryEnteredLocations=[...(u.geometryEnteredLocations||[]),option.value];
 }
 A.loseLife(s,u.controller,geometryLocationRecords(u).length);return true;
}

export function geometryCasterLocations(s,u){
 if(!u.geometryEverywhere&&!u.geometryLocations&&!u.geometryFixedCells)return [u];
 return geometryLocationRecords(u).filter(loc=>s.board[loc.at]||loc.layer==='surface').map(loc=>({...u,at:loc.at,layer:loc.layer,geometryCasterLocation:{...loc}}));
}

// Preserve physical layer identity through history. Empty void has one location,
// while a Site (including The Void) has two independently enterable locations.
export function geometryEntryRecords(s,u,old,newEntry=false,explicit=null){
 const current=geometryLocationRecords(u).filter(v=>s.board[v.at]||v.layer==='surface');
 if(explicit?.length)return explicit.map(v=>({...v}));
 if(newEntry)return current;
 if(!old)return [];
 const before=old.locations||(old.cells||[old.at]).map(at=>({at,layer:old.layer||'surface'}));
 return current.filter(v=>!before.some(w=>w.at===v.at&&(s.board[v.at]?(w.layer||'surface')===v.layer:true)));
}

export function geometryForcedMoves(s,u,spec,A){
 if(!u.geometryLocations||!growing(u)||A.disabled(u))return [];
 const moves=[],body=spec.bodyRoot===undefined?null:A.bodyOfWater(s,spec.bodyRoot,A.card);
 for(const from of geometryLocationRecords(u)){
  if(body&&!body.has(from.at)||spec.fromLayer&&from.layer!==spec.fromLayer||spec.onSites&&!s.board[from.at]||spec.map&&spec.map[from.at]===undefined)continue;
  for(const at of cells){const to={at,layer:spec.layer||from.layer};
   if(spec.map){if(spec.map[from.at]!==at)continue;}
   else if(spec.delta){const [dx,dy]=spec.delta;let x=from.at%5+dx,y=Math.floor(from.at/5)+dy;if(globeActive(s,A.card)){x=(x%5+5)%5;y=(y%4+4)%4;}if(x<0||x>=5||y<0||y>=4||y*5+x!==at)continue;}
   else if(geometryDistance(s,from.at,at,A.card)!==1)continue;
   if(spec.toward!==undefined&&geometryDistance(s,at,spec.toward,A.card)>=geometryDistance(s,from.at,spec.toward,A.card))continue;
   if(spec.away!==undefined&&geometryDistance(s,at,spec.away,A.card)<=geometryDistance(s,from.at,spec.away,A.card))continue;
   if(spec.onSites&&!s.board[at]||body&&!body.has(at)||!A.regionsOverlap(s,from,to)||!A.canEnterOnGround(s,u,from,to,A.card,A.keywords))continue;
   moves.push({label:String.fromCharCode(65+from.at%5)+(4-Math.floor(from.at/5))+' '+from.layer+' → '+String.fromCharCode(65+at%5)+(4-Math.floor(at/5))+' '+to.layer,value:{from:{...from},to}});
  }
 }
 return moves;
}
export function applyGeometryForcedMove(u,move){
 u.geometryMovementFrom={...move.from};u.geometryMovementTo={...move.to};u.geometryMotion=(u.geometryMotion||0)+1;u.at=move.to.at;u.layer=move.to.layer;u.notRest=true;u.burrowedSafely=false;
}
export function resolveGeometryForced(s,frame,A){
 const {step,source,controller:p,selected}=frame;
 if(step.op==='geometryForcePlan'){
  const pending=step.pending||[],moves=step.moves||[];
  if(!pending.length){for(const move of moves){const o=A.unit(s,move.uid)||(s.artifacts||[]).find(a=>a.uid===move.uid);if(o&&(!A.unit(s,move.uid)||!A.fiftyForceAllowed||A.fiftyForceAllowed(s,o,p,A))){if(o.geometryLocations&&growing(o))applyGeometryForcedMove(o,move);else{o.at=move.to.at;o.layer=move.to.layer;o.notRest=true;o.burrowedSafely=false;}}}return true;}
  const entry=pending[0],u=A.unit(s,entry.uid),options=u?geometryForcedMoves(s,u,entry.spec,A):[];
  const q=next=>A.queueEffects(s,[next],source,p,frame.effectCard);
  if(selected===undefined){if(options.length)s.choice={player:p,title:A.card(frame.effectCard).name+' · 選擇受推拉分肢與目的位置',options,frame};else q({...step,pending:pending.slice(1),moves});return true;}
  const option=options.find(o=>JSON.stringify(o.value)===JSON.stringify(selected));if(!option)throw new Error('受推拉分肢選擇已失效');q({...step,pending:pending.slice(1),moves:[...moves,{uid:u.uid,...option.value}]});return true;
 }
 if(!['rapidsPush','nightmareDestination','fiftyPushChoose','riptideGiant','harpoonMove','dragStep','geometryPseudopodMove'].includes(step.op))return false;
 const id=step.op==='fiftyPushChoose'?step.target?.entity==='unit'&&step.target.uid:step.uid;
 const u=id&&A.unit(s,id);if(!u?.geometryLocations||!growing(u)||A.disabled(u))return false;
 if(A.fiftyForceAllowed&&!A.fiftyForceAllowed(s,u,p,A))return true;
 const delta=step.op==='harpoonMove'?[source.at%5-step.pullFrom%5,Math.floor(source.at/5)-Math.floor(step.pullFrom/5)]:step.op==='dragStep'?[step.to.at%5-step.from.at%5,Math.floor(step.to.at/5)-Math.floor(step.from.at/5)]:null;
 const spec=step.geometrySpec||(step.op==='riptideGiant'?{toward:step.root}:delta?{delta,layer:step.op==='harpoonMove'?source.layer||'surface':step.to.layer}:{}),options=geometryForcedMoves(s,u,spec,A);
 const finish=()=>{if(step.op==='fiftyPushChoose')A.queueEffects(s,[{op:'fiftyPushChoose',remaining:step.remaining||[]}],source,p,frame.effectCard);};
 if(selected===undefined){if(options.length)s.choice={player:p,title:A.card(frame.effectCard).name+' · 選擇受推拉分肢與目的位置',options,frame};else finish();return true;}
 const move=options.find(o=>JSON.stringify(o.value)===JSON.stringify(selected));if(!move)throw new Error('受推拉分肢選擇已失效');applyGeometryForcedMove(u,move.value);finish();return true;
}

export function moveGeometrySiteParts(s,mapping,oldBoard=s.board,canMove=()=>true){
 const handled=new Set();
 for(const u of s.units){
  if(!u.geometryLocations||!canMove(u))continue;handled.add(u.uid);
  const before=geometryLocationRecords(u);
  // An already oversized silenced Moeba keeps its size and follows ordinary
  // oversized Site-movement rules; its body is not carried by a single Site.
  if(!growing(u)&&before.length>1)continue;
  const moved=before.map(loc=>oldBoard[loc.at]&&mapping[loc.at]!==undefined?{...loc,at:mapping[loc.at]}:{...loc});
  const seen=new Set();u.geometryLocations=moved.filter(loc=>{const key=loc.at+':'+loc.layer;if(seen.has(key))return false;seen.add(key);return true;});
  if(oldBoard[u.at]&&mapping[u.at]!==undefined)u.at=mapping[u.at];
  u.geometryAnchor={at:u.at,layer:u.layer||'surface'};u.geometryCells=[...new Set(u.geometryLocations.map(loc=>loc.at))];
  u.observedPosition={at:u.at,layer:u.layer||'surface',cells:[...u.geometryCells],locations:u.geometryLocations.map(loc=>({...loc}))};
 }
 return handled;
}

// A movement effect that cares about the travelled path must retain which
// pseudopod took each step. Its origin is not necessarily the unit's anchor.
export function geometryStepOrigins(s,u,to,A){
 if(!u.geometryLocations||!growing(u)||A.disabled(u))return [];
 const keys=A.keywords(u);
 return geometryLocationRecords(u).filter(from=>{
  const same=from.at===to.at&&from.layer===to.layer;
  const vertical=from.at===to.at&&from.layer!==to.layer&&!!s.board[to.at];
  const adjacent=geometryDistance(s,from.at,to.at,A.card)===1||keys.includes('Airborne')&&from.layer==='surface'&&to.layer==='surface'&&geometryDistance(s,from.at,to.at,A.card,true)===1;
  const horizontal=adjacent&&(from.layer===to.layer||keys.includes('Voidwalk')&&(isVoidCell(s,from.at,A.card)||isVoidCell(s,to.at,A.card)));
  return (same||vertical||horizontal)&&A.canEnterOnGround(s,u,from,to,A.card,A.keywords);
 }).map(from=>({...from}));
}

// Two small declaration choices retain all legal pseudopod origins without
// constructing the quadratic cross-product of every possible two-step path.
function resolveGeometryWhirl(s,frame,A){
 const {step,source,controller:p,selected}=frame,u=A.unit(s,step.uid);if(!u||u.dying)return true;
 let plan=step.plan||[];
 const original=geometryLocationRecords(u),locations=original.map(loc=>({...loc}));
 for(const move of plan)if(!locations.some(v=>v.at===move.to.at&&v.layer===move.to.layer))locations.push({...move.to});
 const tip=plan.at(-1)?.to||{at:u.at,layer:u.layer||'surface'},d=rule(u,A.card),growths=d.geometryGrowths?.length?d.geometryGrowths:[d.geometryGrowth],count=locs=>growths.reduce((sum,g)=>sum+locs.filter(loc=>g==='all'||isVoidCell(s,loc.at,A.card)).length,0);
 const preview={...u,at:tip.at,layer:tip.layer,geometryLocations:locations,geometryAnchor:tip,ongoingPower:(u.ongoingPower||0)+count(locations)-count(original)};
 const options=A.locations(s,preview,A.card,A.keywords,true).filter(v=>v.path.length===1).flatMap(to=>geometryStepOrigins(s,preview,to,A).map(from=>({label:String.fromCharCode(65+from.at%5)+(4-Math.floor(from.at/5))+' '+from.layer+' → '+String.fromCharCode(65+to.at%5)+(4-Math.floor(to.at/5))+' '+to.layer,value:{from,to:{at:to.at,layer:to.layer}}})));
 if(selected===undefined){s.choice={player:p,title:'Whirling Blades · 宣告第 '+(plan.length+1)+' 步的分肢',options:[...options,{label:'完成路徑宣告',value:'finish'}],frame};return true;}
 if(selected!=='finish'){
  const option=options.find(o=>JSON.stringify(o.value)===JSON.stringify(selected));if(!option)throw new Error('Whirling Blades 分肢路徑已失效');plan=[...plan,option.value];
  if(plan.length<2){A.queueEffects(s,[{...step,plan}],source,p,frame.effectCard);return true;}
 }
 const origin={at:u.at,layer:u.layer||'surface'},destinations=plan.map(move=>({...move.to,growthFrom:move.from})),route=[origin,...destinations];u.fiftyRoute=[];
 A.queueEffects(s,[...destinations.map((to,index)=>({op:'fiftyPathStep',uid:u.uid,from:route[index],to})),{op:'fiftyPathFinish',uid:u.uid,finish:'whirl',path:route,moved:plan.length>0}],u,p,frame.effectCard);return true;
}

export function geometryForcedDiveOptions(s,u,A){return geometryForcedLayerOptions(s,u,A,true);}
export function geometryForcedBurrowOptions(s,u,A){return geometryForcedLayerOptions(s,u,A,false);}
function geometryForcedLayerOptions(s,u,A,water){
 if(!u.geometryLocations||!growing(u)||A.disabled(u))return [];
 const locations=geometryLocationRecords(u),sites=locations.filter(loc=>!!s.board[loc.at]);
 // A void has no subsurface and is never a dive destination. The Moeba's
 // single moving pseudopod leaves its other (possibly void) parts in place.
 if(!sites.every(loc=>!!A.waterSite(s,loc.at,A.card)===water))return [];
 return locations.filter(loc=>loc.layer==='surface'&&!!s.board[loc.at]).flatMap(from=>{
  const to={at:from.at,layer:'below'};
  if(!A.canEnterOnGround(s,u,from,to,A.card,A.keywords))return [];
  return [{label:String.fromCharCode(65+from.at%5)+(4-Math.floor(from.at/5))+' surface → below',value:{from:{...from},to}}];
 });
}
export function applyGeometryForcedDive(u,move){
 if(move?.from?.at!==move?.to?.at||move?.from?.layer!=='surface'||move?.to?.layer!=='below'||!geometryLocationRecords(u).some(loc=>loc.at===move.from.at&&loc.layer==='surface'))throw new Error('Forced Submerge pseudopod choice is invalid');
 // Leave canonical history untouched until the normal checkpoint: existing
 // forced-movement prevention may still reject the movement transaction.
 applyGeometryForcedMove(u,move);
}

// Mudflow names one Site: an active Moeba extends the below part touching that
// Site, while an ordinary/disabled body must move every part together. A body
// already occupying the destination acquires no new part or entry event.
export function geometryForcedSurfaceMove(s,u,at,A){
 const locations=geometryLocationRecords(u),contact=locations.find(loc=>loc.at===at&&loc.layer==='below');
 if(!s.board[at]||!contact)return null;
 if(u.geometryLocations&&growing(u)&&!A.disabled(u)){
  const to={at,layer:'surface'};
  if(locations.some(loc=>loc.at===at&&loc.layer==='surface')||!A.canEnterOnGround(s,u,contact,to,A.card,A.keywords))return null;
  return {from:{...contact},to,growth:true};
 }
 // A mixed-layer fixed body cannot move its surface part above the surface.
 if(!locations.every(loc=>loc.layer==='below'&&s.board[loc.at]&&A.canEnterOnGround(s,u,loc,{at:loc.at,layer:'surface'},A.card,A.keywords)))return null;
 return {from:{at:u.at,layer:u.layer||'surface'},to:{at:u.at,layer:'surface'},growth:false};
}
