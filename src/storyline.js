import {catalogMagicOperations} from './catalog-magics.js';
import {finalFloodOperations} from './final-flood.js';
import {criticalStrikeOperations} from './final-critical-strike.js';
import {vivienOperations} from './final-vivien.js';
import {geometryOperations} from './final-geometry.js';
import {sourceOperations} from './ability-sources.js';
import {finalControlOperations} from './final-control.js';
import {malleusOperations} from './final-malleus.js';
import {magicDeclarationOperations} from './magic-declarations.js';
import {animationOperations} from './final-animation.js';
import {finalOrbOperations} from './final-orb.js';
import {createZoneAccessScope,effectsAccessZones,zoneAccessOperations,zoneAccessDecision} from './cemetery-access.js';
import {finalChaosOperations} from './final-chaos.js';
import {builtSiteOperations} from './final-built-sites.js';
import {finalReactionOperations} from './final-reactions.js';
import {finalWaveOperations} from './final-waves.js';
import {finalSiteOperations} from './final-sites.js';
import {finalPassiveOperations} from './final-passives.js';
import {finalGridOperations} from './final-grids.js';
import {finalAvatarOperations} from './final-avatars.js';
import {finalEffectOperations} from './final-effects.js';
import {finalArtifactOperations} from './final-artifacts.js';
// Serializable effect continuations. The engine supplies mutations; this module
// owns suspension/resumption and nested effect ordering, without DOM or closures
// in the saved state. Full official simultaneous-trigger ordering is still pending.
import { expansionOperations } from './expansion.js';
export const operations=new Set(('finishSacrificeCost commitSpell curseReturn banishDeadHeal banishWithItems beaconMana breakNearbyWards bury buryMany control damage damageDisable damageSite destroy destroyLocation destroySelf discard dispelLocation draw evilLifeLoss extinguish festival finishMagic finishStart finishTurn gainMana heal healNearbyAvatars leylineDraw lifeLoss locationDamage mill paySummon poisonWell powerSelf projectile purgeCemeteries randomDiscard randomTeleport rangedHit returnHand returnLocation returnSelf revealEnemies ritualMana setMaxLife shot siteDamage siteLifeLoss siteThreshold sleep springDraw stealth stealthSelf strike summon unravelLocation untap ward wardAllies wardSite').split(' '));
operations.add('sufferingSacrifice');
for(const op of malleusOperations)operations.add(op);
for(const op of magicDeclarationOperations)operations.add(op);
for(const op of finalChaosOperations)operations.add(op);
for(const op of [...catalogMagicOperations,...finalFloodOperations,...criticalStrikeOperations,...geometryOperations,...finalControlOperations,...finalOrbOperations,...zoneAccessOperations,...builtSiteOperations,...finalReactionOperations,...finalWaveOperations,...finalSiteOperations,...finalPassiveOperations,...finalGridOperations,...finalAvatarOperations,...animationOperations,...sourceOperations,...vivienOperations,...expansionOperations,...finalEffectOperations,...finalArtifactOperations])operations.add(op);
export function queueEffects(s,effects,source,controller,effectCard=source.card,options={}) {
  if(!effects.length)return;if(!s.storyline)s.storyline=[];
  const parent=s.resolvingZoneAccessFrame,inherit=!options.fresh&&parent&&parent.uid===source.uid&&parent.effectCard===effectCard;
  const scope=options.scope||(inherit||!parent?s.zoneAccessScope:null)||createZoneAccessScope(s);
  const zoneAccessNeeded=effectsAccessZones(effects).length>0;
  const abilityOrigin=options.abilityOrigin||(!options.fresh&&parent&&(parent.uid===source.uid||parent.effectCard===effectCard)?parent.abilityOrigin:null)||source.abilityOrigin||source.card;
  const magicChoiceContextId=Object.hasOwn(options,'magicChoiceContext')?options.magicChoiceContext:options.fresh?null:s.magicChoiceContext||null;
  const frames=[...effects].reverse().map(step=>({step,magicChoiceContextId,source:structuredClone(source),controller,effectCard,abilityOrigin:step.abilityOrigin||abilityOrigin,zoneAccessScope:scope,zoneAccessNeeded,queued:true}));
  for(const frame of frames){const batch=s.simultaneousDestruction;if(batch&&!['chooseDeathReplacement','fiftyArmageddonFinish'].includes(frame.step.op))batch.held.push(frame);else s.storyline.push(frame);}
}
export function drainEffects(s,api) {
  let iterations=0;
  while(s.storyline?.length&&!s.choice&&(!s.pending||s.pending.resolvingDefense||s.pending.resolvingReaction)&&s.winner===null){
    if(++iterations>10000)throw Error('效果循環超出限制，動作未提交');
    const frame=s.storyline.pop(),{step,controller}=frame;
    if(!operations.has(step.op))throw Error('尚未實作的效果操作：'+step.op);
    const priorScope=s.zoneAccessScope,priorFrame=s.resolvingZoneAccessFrame,priorMagicChoiceContext=s.magicChoiceContext;s.magicChoiceContext=frame.magicChoiceContextId||null;s.zoneAccessScope=frame.zoneAccessScope||null;s.resolvingZoneAccessFrame={uid:frame.source.uid,effectCard:frame.effectCard,abilityOrigin:frame.abilityOrigin||frame.source.abilityOrigin||frame.source.card};
    try{
    if(step.op!=='zoneAccessOffer'&&frame.zoneAccessNeeded&&!zoneAccessDecision(s,controller,frame.zoneAccessScope)){const {selected:ignored,...base}=frame;s.storyline.push(frame,{...base,zoneAccessNeeded:false,step:{op:'zoneAccessOffer',scope:frame.zoneAccessScope,player:controller}});continue;}
    if(step.requiresThreshold&&!api.available(s,frame))continue;
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
    }finally{if(priorMagicChoiceContext)s.magicChoiceContext=priorMagicChoiceContext;else delete s.magicChoiceContext;if(priorScope)s.zoneAccessScope=priorScope;else delete s.zoneAccessScope;if(priorFrame)s.resolvingZoneAccessFrame=priorFrame;else delete s.resolvingZoneAccessFrame;}
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
