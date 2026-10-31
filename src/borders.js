// Walls occupy two squares and act only across their shared border.
import {globeActive,geometryTranslate} from './final-geometry.js';
import {auraCells as actualAuraCells} from './objects.js';
import {catalogAuraActive} from './aura-source-state.js';
const taxicab=(a,b)=>Math.abs(a%5-b%5)+Math.abs(Math.floor(a/5)-Math.floor(b/5));
const layer=u=>u.layer||'surface';
const active=catalogAuraActive;
const wallSlugs=new Set(['wall_of_air','wall_of_ice','wall_of_fire','wall_of_brambles']);
export const borderOperations=['borderDeclare','borderHit'];
export function borderNeighbors(at,wrapped=false){return Array.from({length:20},(_,i)=>i).filter(i=>{let dx=Math.abs(at%5-i%5),dy=Math.abs(Math.floor(at/5)-Math.floor(i/5));if(wrapped){dx=Math.min(dx,5-dx);dy=Math.min(dy,4-dy);}return dx+dy===1;});}
export function auraCells(a){return actualAuraCells(a);}
export function sphereAt(s,u,lookup){return !!u&&lookup(u.card).type==='Avatar'&&layer(u)==='surface'&&(s.auras||[]).some(a=>active(a)&&lookup(a.card).slug==='sphere_of_animosity'&&auraCells(a).includes(u.at));}
export function sphereMoveAllowed(s,u,from,to,lookup){return lookup(u.card).type!=='Avatar'||!(s.auras||[]).some(a=>active(a)&&lookup(a.card).slug==='sphere_of_animosity'&&layer(from)==='surface'&&auraCells(a).includes(from.at)&&(layer(to)!=='surface'||!auraCells(a).includes(to.at)));}
function crossed(a,from,to){return a.wallTo!==undefined&&layer(from)===layer(a)&&layer(to)===layer(a)&&(from.at===a.at&&to.at===a.wallTo||from.at===a.wallTo&&to.at===a.at);}
export function borderMoveAllowed(s,u,from,to,lookup,abilities,teleport=false,fly=false,currentPower=0){
 if(!sphereMoveAllowed(s,u,from,to,lookup))return false;if(teleport)return true;
 const keys=abilities(u),ground=layer(from)==='surface'&&layer(to)==='surface'&&!fly&&!keys.includes('Airborne')&&!!s.board[from.at]&&!!s.board[to.at];
 return !(s.auras||[]).some(a=>active(a)&&crossed(a,from,to)&&(lookup(a.card).slug==='wall_of_ice'&&ground||lookup(a.card).slug==='wall_of_air'&&lookup(u.card).type==='Minion'&&(keys.includes('Airborne')||currentPower<=2)));
}
export function borderCrossings(s,u,old,teleport,fly,A){
 if(teleport||u.swallowedBy||!old)return [];
 const growthFrom=u.geometryMovementFrom,fromCells=growthFrom?[growthFrom.at]:old.cells||A.occupied({...u,at:old.at}),toCells=growthFrom?[u.at]:A.occupied(u),keys=A.keywords(u);old=growthFrom||old;
 return (s.auras||[]).filter(a=>active(a)&&wallSlugs.has(A.card(a.card).slug)&&fromCells.some((at,i)=>crossed(a,{at,layer:old.layer},{at:toCells[i],layer:layer(u)}))).flatMap(a=>{
  const slug=A.card(a.card).slug;if(slug==='wall_of_fire')return [{a,amount:3}];
  if(slug==='wall_of_brambles'&&u.controller!==a.controller&&layer(old)==='surface'&&layer(u)==='surface'&&!fly&&!keys.includes('Airborne')&&fromCells.every(at=>s.board[at])&&toCells.every(at=>s.board[at]))return [{a,amount:2}];return [];
 });
}
export function wallCanMove(a,at,wrapped=a.geometryWrap||false){if(wrapped)return borderNeighbors(a.at,true).includes(a.wallTo)&&at>=0&&at<20;const to=at+a.wallTo-a.at;return at>=0&&at<20&&to>=0&&to<20&&taxicab(at,to)===1;}
export function movedWallEnd(s,a,at,lookup){return geometryTranslate(s,a.wallTo,a.at,at,lookup);}
export function resolveBorder(s,frame,A){
 const {step,selected,controller:p}=frame;if(!borderOperations.includes(step.op))return false;
 if(step.op==='borderHit'){const u=A.unit(s,step.uid);if(u&&!u.dying)A.hurt(s,u,step.amount,false,'ability',frame.source);return true;}
 const a=step.action,options=borderNeighbors(a.at,globeActive(s,A.card));
 if(selected===undefined){s.choice={player:p,title:A.card(frame.effectCard).name+' · 選擇邊界（確認後支付費用）',options:[...options.map(at=>({label:String.fromCharCode(65+a.at%5)+(4-Math.floor(a.at/5))+' ↔ '+String.fromCharCode(65+at%5)+(4-Math.floor(at/5)),value:at})),{label:'取消施放（不支付費用）',value:null}],frame};return true;}
 if(selected!==null&&options.includes(selected)&&s.board[a.at]?.controller===p)A.commitSpell(s,{...a,wallTo:selected});return true;
}
