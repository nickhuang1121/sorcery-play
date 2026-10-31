import {combatViews,combatHas,combatSteps} from './final-borrowed-combat.js';
// Explicit mandatory actions and attack continuations for batch 81.
export function mandatoryBattleActions(s,actions,A){
 if(s.storyline?.length)return actions;
 const live=u=>u&&!u.dying&&!A.disabled(u);
 const masks=s.artifacts.filter(o=>!o.silenced&&!o.disabled&&A.passives[A.card(o.card).slug]?.mandatoryNearbyAttack);
 const masked=u=>masks.some(o=>A.regionsOverlap(s,o,u)&&A.occupied(u).some(at=>A.nearby(o.at,at)));
 const greens=s.units.filter(u=>live(u)&&combatHas(s,u,'mandatoryAttackMe',A));
 const required=new Set(),forcedUnits=new Set(),lockedUnits=new Set();
 for(const a of actions)if(a.type==='attack'){
  const u=A.unit(s,a.unit),target=A.unit(s,a.target);if(A.card(u.card).type!=='Minion')continue;
  const locked=live(u)&&combatHas(s,u,'mandatoryUnitAttack',A)&&target||greens.some(g=>g.controller!==u.controller&&g.uid===a.target);
  if(locked)lockedUnits.add(u.uid);
  if(masked(u)||locked){required.add(a);forcedUnits.add(u.uid);}
 }
 if(!required.size)return actions;
 // The Mask's obligation disappears when the move leaves its influence.
 return actions.filter(a=>a.type==='concede'||required.has(a)||a.type==='move'&&forcedUnits.has(a.unit)&&!lockedUnits.has(a.unit)&&masked(A.unit(s,a.unit))&&!masked({...A.unit(s,a.unit),at:a.at,layer:a.layer||'surface'}));
}
export function maskStrikeMultiplier(s,target,A){return 2**s.artifacts.filter(o=>!o.silenced&&!o.disabled&&A.passives[A.card(o.card).slug]?.mandatoryNearbyAttack&&A.regionsOverlap(s,o,target)&&A.occupied(target).some(at=>A.nearby(o.at,at))).length;}
export function captureAfterAttack(s,attacker,target,A){
 if(!target)return [];
 return s.units.filter(u=>u.uid!==attacker.uid&&u.controller===attacker.controller&&!u.dying&&A.regionsOverlap(s,u,target)&&A.occupied(u).some(at=>A.occupied(target).some(cell=>A.distance(at,cell)<=1))).flatMap(u=>combatViews(s,u,A,'strikeAfterAllyAttack').flatMap(layer=>combatSteps(layer,[{op:'battleAgravaine',uid:u.uid,target:target.uid,...(target.entity==='site'?{siteAt:target.at,siteUid:target.uid,siteCard:target.card}:{})}])));
}
export const battleOperations=['battleAgravaine','battleSylph'];
export function resolveBattle(s,frame,A){
 const {step,source,controller:p,selected}=frame;if(!battleOperations.includes(step.op))return false;
 if(step.op==='battleAgravaine'){
  const u=A.unit(s,step.uid),target=A.unit(s,step.target);if(u&&!u.dying&&!A.disabled(u)){if(target&&!target.dying)A.strike(s,u,target,A.power(u),false,true);else if(step.siteAt!==undefined){const at=step.siteUid?s.board.findIndex(site=>site?.uid===step.siteUid):step.siteAt;if(at>=0&&s.board[at]?.card===step.siteCard)A.damageSite(s,at,A.power(u),u);}}return true;
 }
 if(step.op==='battleSylph'&&selected){const u=A.unit(s,source.uid),target=A.unit(s,selected.uid);if(u&&!u.dying&&target&&!target.dying&&A.regionsOverlap(s,u,target)&&A.occupied(u).some(at=>A.occupied(target).includes(at)))A.queueEffects(s,[{op:'fiftyPushChoose',target:selected,remaining:[]}],u,p,source.card);return true;}
 return true;
}
