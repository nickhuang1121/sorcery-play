// Numbers transcribed from the visible official card faces, 2026-10-30.
// Coordinates are [right, forward, damage] with north as the default forward.
import {globeActive,geometryLocationRecords} from './final-geometry.js';
export const finalGridDefinitions={
 burning_hands:{casterTypes:['Mortal'],cast:[{op:'finalGridDirection',slug:'burning_hands',directions:[]}]},
 firebreathing:{casterTypes:['Beast','Dragon'],cast:[{op:'finalGridDirection',slug:'firebreathing'}]},
 flame_strike:{cast:[{op:'finalGridDirection',slug:'flame_strike'}]},
 flame_wave:{cast:[{op:'finalGridWave'}]},
 lava_flow:{cast:[{op:'finalGridDirection',slug:'lava_flow'}]},
 holy_nova:{cast:[{op:'finalGridHoly'}]},
 wreathed_in_righteousness:{cast:[{op:'finalGridWreathed',select:{kind:'location',sameRegion:true}}]},
 meteor_shower:{cast:[{op:'finalGridMeteor',picks:[]}]},
 mester_stoor_worm:{activated:[{label:'橫置：選方向噴吐致命毒息',tap:true,steps:[{op:'finalGridDirection',slug:'mester_stoor_worm'}]}]},
 hellstar:{start:[{op:'finalGridHellstar'}]},
 day_of_judgment:{cast:[{op:'finalGridJudgment'}]},
};
export const finalGridPassives={hellstar:{cannotAttack:true,cannotDefend:true}};
export const finalGridOperations=['finalGridDirection','finalGridWave','finalGridHoly','finalGridWreathed','finalGridMeteor','finalGridApply','finalGridHellstar','finalGridJudgment','finalGridJudgmentBanish'];
export const gridPatterns={
 burning_hands:[[0,1,2],[0,2,1]],
 firebreathing:[[0,1,4],[-1,1,1],[1,1,1],[0,2,1]],
 flame_strike:[[0,1,3],[-1,2,1],[0,2,1],[1,2,1]],
 lava_flow:[[0,0,5],[0,1,4],[0,2,2]],
 holy_nova:[[-1,1,1],[0,1,2],[1,1,1],[-1,0,2],[0,0,3],[1,0,2],[-1,-1,1],[0,-1,2],[1,-1,1]],
 wreathed_in_righteousness:[[-1,1,2],[0,1,2],[1,1,2],[-1,0,2],[1,0,2],[-1,-1,2],[0,-1,2],[1,-1,2]],
 meteor_large:[[-1,1,3],[0,1,5],[1,1,3],[-1,0,5],[0,0,7],[1,0,5],[-1,-1,3],[0,-1,5],[1,-1,3]],
 meteor_medium:[[0,0,4],[-1,0,2],[1,0,2],[0,1,2],[0,-1,2]],
 meteor_small:[[0,0,3]],
 mester_stoor_worm:[[0,1,1],[-1,1,1],[1,1,1],[0,2,1]],
 hellstar:[[-1,1,3],[0,1,5],[1,1,3],[-1,0,5],[0,0,7],[1,0,5],[-1,-1,3],[0,-1,5],[1,-1,3]],
 day_of_judgment:[[0,1,3],[-1,0,3],[0,0,7],[1,0,3],[0,-1,3],[0,-2,3]],
};
const directions=['北','東','南','西'];
const layer=u=>u.layer||'surface';
const label=at=>String.fromCharCode(65+at%5)+(4-Math.floor(at/5));
export function placedGrid(origin,pattern,direction=0,wrapped=false){
 const result=[];for(const [right,forward,amount] of pattern){
  const [dx,dy]=direction===0?[right,-forward]:direction===1?[forward,right]:direction===2?[-right,forward]:[-forward,-right];
  let x=origin%5+dx,y=Math.floor(origin/5)+dy;if(wrapped){x=(x%5+5)%5;y=(y%4+4)%4;}
  if(x>=0&&x<5&&y>=0&&y<4)result.push({at:y*5+x,amount});
 }return result;
}
export function waveGrid(fromRight=false){
 return Array.from({length:4},(_,y)=>[7,5,3,1].map((amount,x)=>({at:y*5+(fromRight?4-x:x),amount}))).flat();
}
export function judgmentPlacements(s=null,lookup=null){
 const wrapped=!!s&&!!lookup&&globeActive(s,lookup);
 const options=[];for(let at=0;at<20;at++)for(let direction=0;direction<4;direction++){
  const grid=placedGrid(at,gridPatterns.day_of_judgment,direction,wrapped);
  if(grid.length===6)options.push({label:label(at)+' · '+directions[direction],value:{at,direction}});
 }return options;
}
function meteorCandidates(s,frame,picks,A){
 const sites=A.selectEffects(s,frame,{kind:'site'}).filter(o=>!picks.includes(o.value.at)&&picks.every(at=>A.distance(at,o.value.at)!==1));
 return sites.filter(o=>{
  const all=[...picks,o.value.at];
  function finish(chosen){if(chosen.length===3)return true;return sites.some(candidate=>!chosen.includes(candidate.value.at)&&chosen.every(at=>A.distance(at,candidate.value.at)!==1)&&finish([...chosen,candidate.value.at]));}
  return finish(all);
 });
}
export function finalGridCastAvailable(s,p,c,caster,A){
 if(c.slug==='lava_flow')return !!s.board[caster.at];
 if(c.slug!=='meteor_shower')return true;
 return meteorCandidates(s,{source:caster,controller:p,effectCard:c.id},[],A).length>0;
}
function holyWards(s,p,A){
 // Ally explicitly includes Holy Nova Wards on controlled cards. A Site
 // occupies both locations (Here/Location); choose one, not both. Animated
 // Auras are units, so their actual fixed/oversized locations work here too.
 // Ordinary non-unit Auras cannot have a Ward (Ward Codex).
 const units=s.units.filter(u=>!u.dying&&u.controller===p&&u.ward&&['Minion','Avatar'].includes(A.card(u.card).type)).flatMap(u=>geometryLocationRecords(u).map(loc=>({label:A.card(u.card).name+' · '+label(loc.at)+' · '+loc.layer,value:{entity:'unit',uid:u.uid,at:loc.at,layer:loc.layer}})));
 const sites=s.board.flatMap((site,at)=>site?.controller===p&&site.ward?['surface','below'].map(layer=>({label:A.card(site.card).name+' · '+label(at)+' · '+layer,value:{entity:'site',uid:site.uid,at,layer}})):[]);
 return [...units,...sites];
}
export function applyFinalGrid(s,source,p,step,A){
 const center=step.center||{at:source.at,layer:layer(source)},originRegion=A.region(s,center);
 const plan=s.units.filter(u=>!u.dying&&(!step.enemyOnly||u.controller!==p)&&(!step.minionsOnly||A.card(u.card).type==='Minion')&&(!step.other||u.uid!==source.uid)).map(u=>{
  if(step.holyLocations){
   const locations=geometryLocationRecords(u),amount=step.grid.reduce((sum,cell)=>sum+cell.amount*locations.filter(loc=>loc.at===cell.at&&A.regionsOverlap(s,loc,center)).length,0);return {u,amount};
  }
  const occupied=new Set(A.occupied(u));
  const amount=step.grid.reduce((n,cell)=>n+(occupied.has(cell.at)&&(!step.atopSites||layer(u)==='surface')&&(!step.onSites&&!step.atopSites||!!s.board[cell.at])&&(step.ignoreRegions||step.atopSites||A.region(s,{at:cell.at,layer:layer(u)})===originRegion)?cell.amount:0),0);
  return {u,amount};
 });
 // One damage event per unit: every occupied affected square contributes, then
 // Ward/reduction is applied once to the total, as required for oversized units.
 for(const {u,amount} of plan)if(amount>0)A.hurt(s,u,amount,!!step.lethal,step.damageKind||'magic',source);
}
export function resolveFinalGrid(s,frame,A){
 const {step,source,controller:p,selected}=frame;
 if(!finalGridOperations.includes(step.op))return false;
 const q=steps=>A.queueEffects(s,steps,source,p,frame.effectCard);
 const choose=(options,next=step,title=A.card(frame.effectCard).name)=>{if(options.length)s.choice={player:p,title,options,frame:{...frame,step:next}};};
 const apply=(grid,extra={})=>q([{op:'finalGridApply',grid,...extra}]);
 const gridAt=(at,pattern,direction=0)=>placedGrid(at,pattern,direction,globeActive(s,A.card));
 if(step.op==='finalGridDirection'){
  const picks=step.directions||[];
  if(selected===undefined){choose(directions.flatMap((name,direction)=>picks.includes(direction)?[]:[{label:name,value:direction}]));return true;}
  if(!Number.isInteger(selected)||selected<0||selected>3||picks.includes(selected))throw Error('Invalid cardinal direction');
  if(step.slug==='burning_hands'&&!picks.length){q([{...step,directions:[selected]}]);return true;}
  const pattern=gridPatterns[step.slug];
  apply([...picks,selected].flatMap(direction=>gridAt(source.at,pattern,direction)),step.slug==='lava_flow'?{other:true,onSites:true}:step.slug==='mester_stoor_worm'?{lethal:true,damageKind:'ability'}:{});
  return true;
 }
 if(step.op==='finalGridWave'){
  if(selected===undefined){choose([{label:'從左至右',value:false},{label:'從右至左',value:true}]);return true;}
  if(typeof selected!=='boolean')throw Error('Invalid horizontal wave direction');
  apply(waveGrid(selected),{atopSites:true});return true;
 }
 if(step.op==='finalGridHoly'){
  if(selected===undefined){choose([{label:'以施法者為中心，不打破Ward',value:{caster:true}},...holyWards(s,p,A)]);return true;}
  let center={at:source.at,layer:layer(source)};
  if(!selected.caster){
   const option=holyWards(s,p,A).find(o=>JSON.stringify(o.value)===JSON.stringify(selected));if(!option)throw Error('Allied Ward no longer exists');
   const object=selected.entity==='unit'?A.unit(s,selected.uid):s.board[selected.at];object.ward=false;center={at:selected.at,layer:selected.layer};
  }
  apply(gridAt(center.at,gridPatterns.holy_nova),{center,enemyOnly:true,holyLocations:true});return true;
 }
 if(step.op==='finalGridWreathed'){
  if(!selected||!Number.isInteger(selected.at))return true;
  // Ward also protects a location at an enemy warded Site. Removing the target
  // prevents the dependent Ward-grant and its damage grid, not merely the mark.
  if(s.board[selected.at]&&A.blocked(s,p,s.board[selected.at]))return true;
  for(const u of s.units)if(!u.dying&&A.card(u.card).type==='Minion'&&A.occupied(u).includes(selected.at)&&layer(u)===selected.layer&&!A.unitUmbrellas(u).includes('Evil'))u.ward=true;
  apply(gridAt(selected.at,gridPatterns.wreathed_in_righteousness),{center:selected,minionsOnly:true});return true;
 }
 if(step.op==='finalGridMeteor'){
  const picks=step.picks||[],options=meteorCandidates(s,frame,picks,A);
  if(selected===undefined){choose(options,step,'Meteor Shower · 第 '+(picks.length+1)+' 個落點');return true;}
  if(!options.some(o=>o.value.at===selected.at))throw Error('Meteor sites must be distinct and share no borders');
  const next=[...picks,selected.at];
  if(next.length<3){q([{...step,picks:next}]);return true;}
  const patterns=['meteor_large','meteor_medium','meteor_small'],grid=[];
  for(let i=0;i<3;i++){const site=s.board[next[i]];if(site&&!A.blocked(s,p,site))grid.push(...gridAt(next[i],gridPatterns[patterns[i]]));}
  apply(grid,{atopSites:true});return true;
 }
 if(step.op==='finalGridHellstar'){
  apply(gridAt(source.at,gridPatterns.hellstar),{other:true,damageKind:'ability'});return true;
 }
 if(step.op==='finalGridJudgment'){
  if(selected===undefined){choose(judgmentPlacements(s,A.card),step,'Day of Judgment · 放置完整十字');return true;}
  if(!judgmentPlacements(s,A.card).some(o=>o.value.at===selected.at&&o.value.direction===selected.direction))throw Error('The whole Judgment cross must be inside the realm');
  q([{op:'finalGridJudgmentBanish',grid:gridAt(selected.at,gridPatterns.day_of_judgment,selected.direction)}]);return true;
 }
 if(step.op==='finalGridJudgmentBanish'){
  // The FAQ explicitly requires banishment consequences to resolve before the
  // damage event. Separate Storyline frames provide that interruption point.
  apply(step.grid,{ignoreRegions:true});
  const cells=new Set(step.grid.map(cell=>cell.at));
  for(const u of [...s.units])if(!u.dying&&A.card(u.card).type==='Minion'&&A.unitUmbrellas(u,p).includes('Evil')&&A.occupied(u).some(at=>cells.has(at)))A.kill(s,u,true);
  return true;
 }
 if(step.op==='finalGridApply'){applyFinalGrid(s,source,p,step,A);return true;}
 return true;
}
