// Serializable effect continuations. The engine supplies mutations; this module
// owns suspension/resumption and nested effect ordering, without DOM or closures
// in the saved state. Full official simultaneous-trigger ordering is still pending.
import { expansionOperations } from './expansion.js';
export const operations=new Set(('commitSpell banishDeadHeal banishWithItems beaconMana breakNearbyWards bury buryMany control damage damageDisable damageSite destroy destroyLocation destroySelf discard dispelLocation draw evilLifeLoss extinguish festival finishMagic finishStart finishTurn gainMana heal healNearbyAvatars leylineDraw lifeLoss locationDamage mill paySummon poisonWell powerSelf projectile purgeCemeteries randomDiscard randomTeleport rangedHit returnHand returnLocation returnSelf revealEnemies ritualMana setMaxLife shot siteDamage siteLifeLoss siteThreshold sleep springDraw stealth stealthSelf strike summon unravelLocation untap ward wardAllies wardSite').split(' '));
for(const op of expansionOperations)operations.add(op);
export function queueEffects(s,effects,source,controller,effectCard=source.card) {
  if(!s.storyline)s.storyline=[];
  s.storyline.push(...[...effects].reverse().map(step=>({step,source:structuredClone(source),controller,effectCard})));
}
export function drainEffects(s,api) {
  let iterations=0;
  while(s.storyline?.length&&!s.choice&&s.winner===null){
    if(++iterations>10000)throw Error('效果循環超出限制，動作未提交');
    const frame=s.storyline.pop(),{step,controller}=frame;
    if(!operations.has(step.op))throw Error('尚未實作的效果操作：'+step.op);
    if(step.optional&&!step.select&&!Object.hasOwnProperty.call(frame,'selected')){
      s.choice={player:controller,title:api.title(frame),options:[...(api.available(s,frame)?[{label:'執行效果',value:true}]:[]),{label:'略過',value:null}],frame};break;
    }
    if(step.select&&!Object.hasOwnProperty.call(frame,'selected')){
      const options=api.select(s,frame,step.select);
      if(step.optional)options.unshift({label:'略過',value:null});
      if(!options.length)continue;
      s.choice={player:controller,title:api.title(frame),options,frame};
      break;
    }
    api.resolve(s,frame);
    api.check(s);
  }
}
export function chooseEffect(s,index) {
  const choice=s.choice;
  if(!choice||!Number.isInteger(index)||index<0||index>=choice.options.length)throw Error('無效的效果選擇');
  const value=choice.options[index].value;
  s.choice=null;
  if(!s.storyline)s.storyline=[];
  if(value!==null||!choice.frame.step.optional)s.storyline.push({...choice.frame,selected:value});
}
