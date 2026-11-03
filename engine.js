import {beginSacrificeCost,deferSacrificeCemetery,finishSacrificeCost} from './sacrifice-cost.js';
import {assertChoiceContext} from './choice-context.js';
import {PROJECT_RULE_PROFILE} from './project-rules.js';
import {resolveCatalogForcedSurface} from './catalog-forced-surface.js';
import {rememberCarriedPosition,followCarriedPosition} from './carried-artifact-position.js';
import {resolveCatalogForcedLayer} from './catalog-forced-layer.js';
import {resolveCatalogAuraSubmerge} from './catalog-aura-submerge.js';
import {resolveCatalogMagic} from './catalog-magics.js';
// Build card definitions before importing runtime rule consumers.
import './cards.js';
import {resolveFinalFlood} from './final-flood.js';
import {spatialSetQuest} from './borrowed-spatial.js';
import {hydrateRuntimeCards,builtinRuntimeProvider} from './runtime-hydration.js';
import {registerArchiveRuntimeCard} from './card-lineage.js';
import {registerAvatarRuntimeCard} from './final-avatars.js';
import {registerAuraAnimationCard} from './final-animation.js';
import {registerBorrowedCard} from './ability-sources.js';
import {registerVivienWithBorrowed,offRealmPlacementRules,offRealmCostAdjustments,offRealmPassiveEntries,offRealmPrintedSources,registerVivienRuntimeCard,vivienRuntimeDependencies} from './final-vivien.js';
import {animatedArtifactCard} from './artifact-animation.js';
import {registerBuiltSiteCards} from './final-built-sites.js';
import {spatialPickupCarriedLimit} from './borrowed-spatial.js';
import {builtSitePhysicalParts,tagBuiltSiteParts,restoreBuiltSiteState,detachBuiltSiteParts} from './final-built-sites.js';
import {resolveSpatialMovementShot} from './borrowed-spatial.js';
import {claimCriticalStrike,prepareCriticalStrikeWindow,resolveCriticalStrike} from './final-critical-strike.js';
import {casterPermissionViews,casterPermissionAllows,casterPlacementAllowed,entryHasIndependentCasterPermission} from './caster-permissions.js';
import {spatialMovementEvents,spatialSummonEvents,spatialCastEvents,spatialAmbushEvents,spatialLayers} from './borrowed-spatial.js';
import {refreshBorrowedSpatial,spatialCasterAllowed,spatialHas,spatialMinionCastingHere,spatialVoidSummoning,spatialDenyEntry,spatialFreeMove,spatialMazeAllows} from './borrowed-spatial.js';
import {finalArchiveEffectApplies} from './card-lineage.js';
import {vivienCardForPlayer,refreshVivienUnits,restoreVivienCards,selectVivien,resolveVivien,vivienPhysicalCard,destroyInertCards} from './final-vivien.js';
import {combatViews,combatHas,combatSteps,combatTriggers,combatSnapshot,combatHurtTriggers,combatSurvivorSources,combatDeathReplacements,combatKillTriggers} from './final-borrowed-combat.js';
import {moveGeometrySiteParts} from './final-geometry.js';
import {gainedKeywordsForUnit,abilityMovementAdjustment} from './ability-sources.js';
import {resolveGeometryForced,geometryForcedMoves,applyGeometryForcedMove} from './final-geometry.js';
import {geometryEntryRecords} from './final-geometry.js';
import {geometryCasterLocations} from './final-geometry.js';
import {commitGeometryLocations,refreshGeometry} from './final-geometry.js';
import {geometryRackStrike,resolveGeometry} from './final-geometry.js';
import {factoryAnimationClaims} from './final-factory.js';
import {contextualCard,contextualUnitTypes,contextualUnitUmbrellas,refreshNaturalEvilWards} from './final-types.js';
import {finalAvatarUnitTypes} from './final-avatars.js';
import {finalAltarPreventsDeath,restoreFinalAltars,prepareFinalAltarSite,altarPhysicalBase} from './final-altar.js';
import {setupAbilitySource,sourceAbilityAvailable,selectAbilitySource,resolveAbilitySource,restoreAbilitySources,expireAbilitySources,damagedAbilitySource} from './ability-sources.js';
import {refreshGeometryWorld as refreshGlobeWorld} from './final-geometry.js';
import {finalReplacementChoice as chooseGeometryReplacement} from './final-damage.js';
import {movedWallEnd as translatedWallEnd} from './borders.js';
import {siteEffectAllowed,siteFrameBlocked,unitPassiveLayerViews,keyProvidedMana,pallidPrintedTypes,unitDefinitionLayers,unitGainedRange,printedMinionTypes,abilityProjectileBarrier,abilityUnitHasElement,intrinsicModificationLocked,restoreModificationEffects,prepareModificationProtection,finishModificationProtection,enforceModificationEffect,syncHollowWakeLifetimes} from './final-ability-layers.js';
import {preventFinalSiteDamage,finalCityDamageRecipient} from './final-site-damage.js';
import {placedGrid as projectCardGrid} from './final-grids.js';
import {isVoidCell as geometryIsVoidCell,geometrySafe as unitOccupancySafe} from './final-geometry.js';
import {resolveFinalControl,finalControlActionAllowed,observeFinalControl} from './final-control.js';
import {selectAnimation,resolveAnimation,queueAnimationCast,restoreAnimations,animationLeaves,expireAnimations} from './final-animation.js';
import {queueFinalOrbCopies,resolveFinalOrb,orbTargetSnapshot} from './final-orb.js';
import {geometryDistance as globeDistance,globeActive as isGlobeActive} from './final-geometry.js';
import {cemeteryPhysicalPlayer,cemeteryCards,viewCemeteryEntries,physicalCemeteryEntries,canAffectCemetery,zoneAccessAllowed,zoneAccessCost,zoneAccessPreviewCost,canPayZoneAccess,commitZoneAccess,createZoneAccessScope,zoneAccessDecision,effectsAccessZones,resolveZoneAccess} from './cemetery-access.js';
import {mirrorRiftTargets} from './final-built-sites.js';
import {runFinalDecisionAction,modifyFinalDamage,markFinalGawainDamage,finalGawainDiesFromDamage} from './final-damage.js';
import {resolveFinalChaos,finalChaosSpellSource} from './final-chaos.js';
import {captureVindictiveSites,triggerVindictiveSiteEvent,detectVindictiveChanges,noteBuiltWardConsumed} from './final-built-sites.js';
import {freeCityProxy,cityAttackActions,cityDefendActions,commitCityAction} from './final-built-sites.js';
import {riftTargets,riftPlans,applyRiftPlan} from './final-built-sites.js';
import {resolveBuiltSites,babelTargets,commitBuiltBabel,sendBuiltSite,hasSiteRarity} from './final-built-sites.js';
import {resolveFinalReactions,queueValorReaction,finalReactionCastAllowed} from './final-reactions.js';
import {resolveFinalWaves,finalWaveMovementPending} from './final-waves.js';
import {resolveFinalSites,finalSiteDoorArrived,startFinalSites,finalSiteAvatarStruck} from './final-sites.js';
import {resolveFinalGrid,finalGridCastAvailable} from './final-grids.js';
import {selectFinalAvatar,resolveFinalAvatar,finalAvatarAbilityAvailable,refreshFinalAvatars,finalAvatarSiteStrike,finalAvatarCastingCard,finalAvatarCastEntries,finalAvatarPhysicalCard,ensureFinalAvatarRuntimeCards,finalAvatarEntry,finalAvatarBaseCost,finalAvatarExtraCastingCost,finalAvatarCommitGraveCopy,finalAvatarPrepareCopyEntry,finalAvatarSetupHand,finalAvatarDrawDecks,finalAvatarMulliganDeck,finalAvatarNormalSiteAbilities,finalArchimagoDeclare,finalArchimagoPayCost,finalAvatarCopyAllowsMana,finalAvatarCopyIsFree,finalAvatarCopyActionValid,finalAvatarMinionCastAllowed,finalAvatarCastReplacement} from './final-avatars.js';
import {selectorMetadata,magicNeedsCastDeclaration} from './selector-semantics.js';
import {malleusArtifactAbilityAllowed,resolveMalleus,validateMalleusSpell,commitMalleusSpell,filterMalleusCastActions,restrictMalleusChoice} from './final-malleus.js';
import {createMagicChoiceContext,recordMagicChoiceFrame,finishMagicChoiceContext,completeMagicAlliedChoiceSet} from './magic-context.js';
import {catalogAuraActive,catalogAuraHere,catalogAuraAffectedSite} from './catalog-auras.js';
import {beforeMagicDeclaration,resolveMagicDeclaration,magicPlanningOptions,magicDeclarationTargets} from './magic-declarations.js';
import {refreshFinalSaint,finalCardUmbrellas,finalUnitUmbrellas,finalPassiveEntry,processFinalPassiveEntries,resolveFinalPassives,redRockCarryingForbidden,refreshRedRockCarrying,finalThronePlayed,checkFinalThroneVictory,restrictFinalOakChoice,restrictFinalLegacyTargets,restrictFinalOakArtifactActions} from './final-passives.js';
import {resolveFinalUnits,deferFinalUnitEntry,refreshFinalUnits,beforeFinalUnitUntap,finalUnitCastActions,beforeFinalUnitCast,finalUnitSiteAttackBeforeDamage,finalSharkTriggers,finalUnitAttackTriggers,finalUnitAttackKillTriggers,finalUnitCastEntries,finalUnitPlunderCastingCard,finalUnitCommitPlunder,finalUnitPlunderExtraCost,finalConstrictPlans,finalUnitPrepareCastEntry,finalUnitCastingDiscount,beforeFinalUnitExtraCostChoice,commitFinalUnitExtraCosts,finalUnitCanPayWithExtraCosts,finalUnitAttackActions,finalChimeraAttackTargets,finalChimeraPrepareCombat,finalChimeraDefendActions,noteFinalInquisitionSearch,beforeFinalInquisitionEffect,afterFinalInquisitionEffect,observeFinalInquisition,clearFinalInquisitionTop,finalStitchedPower,clearFinalStitchedDamage,absorbFinalStitchedDamage,healFinalStitchedDamage,finalRasputinCastingCard,finalRasputinSummonCard,beforeFinalRasputinConfirm,restoreFinalArchiveCards,finalArchivePrintedCard,finalUnitOrderDeathEffects} from './final-units.js';
import {geometryStepOrigins,geometryForcedSurfaceMove,geometryLocationRecords,occupiesGeometryLocation,geometrySummonAllowed,followGeometryAvatars,geometryOwnMoveAllowed,canAttackSubsurface,geometryBoardAllowed,geometryPlaceSiteAllowed,geometryMoveSiteAllowed,geometryRemoveArtifactAllowed,geometryViolations} from './final-geometry.js';
import {resolveFinalEffects,resolveFinalContract,beforeFinalSpellCommit,migrateLegacyTwisterChoice} from './final-effects.js';
import {prepareFinalArtifacts,finishFinalArtifacts,resolveFinalArtifacts,finalCageForceAllowed,finalEggPreventsDeathblow,endFinalArtifacts,finalCatapultAvailable} from './final-artifacts.js';
import {resolveRemainingFinal,resolveRemainingExtra,resolveRemaining,restoreRemainingControl,refreshRemaining,arthurActive,forcedSubmergeAllowed,searchLimit,secondTargetOptions} from './remaining-rules.js';
import {deferCopyEntry,resolveCopying,returnCopies} from './copying.js';
import {resolveMetamorphosis,handTransformActions,commitHandTransform,morphAbilityAvailable} from './metamorphosis.js';
import {dreamCasterChoices,resolveDream} from './dreams.js';
import {mandatoryBattleActions,maskStrikeMultiplier,captureAfterAttack,resolveBattle} from './battle-obligations.js';
import {queueAttackReactions,queueSturmReactions,resolveAttackReaction,peaceAllowsAttack,advanceTruces} from './attack-reactions.js';
import {borderNeighbors,borderMoveAllowed,borderCrossings,sphereAt,resolveBorder,wallCanMove} from './borders.js';
import {collectionEntries,takeCollection,collectionCastEntries,collectionAbilityAvailable,resolveCollection} from './collection.js';
import {topSpellAccess as readTopSpellAccess,topCastEntries} from './top-casting.js';
import {siteMultiplier,refreshCompletionTerrain,resolveCompletion} from './completion-cards.js';
import {runtimeCard} from './cards.js';
import {restoreArtifactAnimations,refreshArtifactAnimations,artifactAnimationLeaves,isAnimatedArtifact,artifactIsCarriedBy} from './artifact-animation.js';
import {hasElement} from './cards.js';
import {resolveFifty,fiftyForceAllowed} from './fifty-cards.js';
import {carryRules,carryRule,carryChoices,passengers,bringPassenger,boardPassenger,dropPassenger,movePassengers,refreshPassengers} from './transport.js';
import {cards as cardCatalog} from './cards.js';
﻿import { card, elements, validateDeck, printedKeywords } from './cards.js';
import { definitions, passives } from './definitions.js';
import { queueEffects, drainEffects, chooseEffect } from './storyline.js';
import { locations as baseLocations, region as getRegion,regionNames as getRegionNames,regionsOverlap as getRegionsOverlap, waterSite, siteAffinity,bodyOfWater,canEnterOnGround as baseCanEnterOnGround,regionalDistance,occupied,siteBaseResources,siteResourceGift,unitPower } from './geography.js';
import { equipment, areaAuras, area as baseArea, auraCells, inside, matches } from './objects.js';
import {sitePassives,inBackRow} from './site-cards.js';
import {syncGraves,graveEntries,appendGrave,takeGrave as rawTakeGrave,removeGraves as rawRemoveGraves} from './cemetery.js';
function effectGraves(s,physical,p=s.eventContext?.controller??s.active){if(!canAffectCemetery(s,p,physical,ruleAPI(s))||s.zoneAccessScope&&!zoneAccessAllowed(s,p,ruleAPI(s)))return [];return graveEntries(s,physical);}
function yourGraves(s,p){return effectGraves(s,cemeteryPhysicalPlayer(s,p,ruleAPI(s)),p);}
function takeGrave(s,p,index,id,uid,actor=s.eventContext?.controller??s.active){assert(canAffectCemetery(s,actor,p,ruleAPI(s)),'Wormelow Tump：墓地中的卡牌受到保護');assert(!s.zoneAccessScope||zoneAccessAllowed(s,actor,ruleAPI(s)),'Bureau：尚未取得本效果的墓地存取權');return rawTakeGrave(s,p,index,id,uid);}
function removeGraves(s,p,predicate,actor=s.eventContext?.controller??s.active){return effectGraves(s,p,actor).length?rawRemoveGraves(s,p,predicate):[];}
import {towerSites} from './beta-completion.js';
export const WIDTH = 5, HEIGHT = 4;
export const position = n => ({ x: n % WIDTH, y: Math.floor(n / WIDTH) });
export const distance = (s,a,b) => { if(b!==undefined)return globeDistance(s,a,b,card);const from=position(s),to=position(a);return Math.abs(from.x-to.x)+Math.abs(from.y-to.y); };
export const nearby = (s,a,b) => { if(b!==undefined)return globeDistance(s,a,b,card,true)<=1;const from=position(s),to=position(a);return Math.max(Math.abs(from.x-to.x),Math.abs(from.y-to.y))<=1; };
const clone = x => structuredClone(x);
const assert = (v, m) => { if (!v) throw Error(m); };
export function random(s) { s.rng = (Math.imul(s.rng,1664525)+1013904223)>>>0; return s.rng/4294967296; }
function shuffle(s, a) { for(let i=a.length-1;i>0;i--) { const j=Math.floor(random(s)*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
export function randomDecisionController(s,player){const determinants=[...s.units.filter(u=>!u.dying&&!disabled(u)&&u.controller!==player).flatMap(u=>unitPassiveLayerViews(s,u,ruleAPI(s),'opponentRandomControl').filter(l=>l.value).map(l=>({stamp:l.source.abilityStamp||0,player:u.controller,source:u.uid,instance:l.instance,kind:'black-cat'}))),...(s.artifacts||[]).filter(a=>!a.silenced&&!a.disabled&&passives[card(a.card).slug]?.bearerRandomControl&&unit(s,a.bearer)&&!disabled(unit(s,a.bearer))).map(a=>({stamp:a.stamp||0,player:unit(s,a.bearer).controller,source:a.uid,kind:'kythera'}))].sort((a,b)=>a.stamp-b.stamp);return determinants.at(-1)||null;}
function rollIndex(s,labels,authorization=null){
  const r=s.randomReplay;if(!r)return Math.floor(random(s)*labels.length);
  const cursor=r.cursor++;if(cursor<r.rolls.length){const value=r.rolls[cursor];r.consumed.push(value);return value;}
  const determinant=randomDecisionController(s,r.player);
  if(determinant){
    if(determinant.kind==='kythera'&&authorization?.source===determinant.source&&authorization.player===determinant.player&&Number.isInteger(authorization.index)&&authorization.index>=0&&authorization.index<labels.length){r.consumed.push(authorization.index);return authorization.index;}
    throw {lucky:true,results:labels.map((_,i)=>i),labels,rng:s.rng,rolls:r.consumed,chooser:determinant.player,title:'選擇隨機結果'};
  }
  const charms=(s.artifacts||[]).filter(a=>passives[card(a.card).slug]?.luckyCharm&&artifactController(s,a)===r.player&&!disabled(unit(s,a.bearer))).length;
  if(!charms){const value=Math.floor(random(s)*labels.length);r.consumed.push(value);return value;}
  const results=Array.from({length:1+charms},()=>Math.floor(random(s)*labels.length));throw {lucky:true,results,labels,rng:s.rng,rolls:r.consumed};
}
function resolveRandomAware(s,frame){
  if(!['finishTurn','finishStart','finishMagic','builtVindictive'].includes(frame.step.op))s.finalVindictiveObservation={before:captureVindictiveSites(s,ruleAPI(s)),actor:frame.controller};
  if(frame.step.op==='luckyResume')return resolveRandomAware(s,{...frame.step.original,rolls:[...(frame.step.original.rolls||[]),frame.selected]});
  const before=clone(s);s.randomReplay={player:frame.controller,rolls:frame.rolls||[],cursor:0,consumed:[]};
  try{beforeFinalInquisitionEffect(s,frame,ruleAPI(s));resolveStep(s,frame);enforceModificationEffect(s,before,frame,ruleAPI(s));afterFinalInquisitionEffect(s,frame,before,ruleAPI(s));for(const old of before.units)if(unmodifiable(old)){const u=unit(s,old.uid);if(u&&u.card!==old.card){u.card=old.card;u.owner=old.owner;u.originalCard=old.originalCard;}}if(frame.step.op!=='finalKairosReturn')enforceBorders(s,before);if(!['finalKairosReturn','finalDodgeRoll','finalConstrictPlan','finalSharkStep','finalSiteMove','finalCraveStep','finalLedMove','finalJoustMove','finalConstrictStep','finalAvatarHuntChoose','unitStep','fiftyPathStep','travelStep','forcedWaterStep','reactionBladeStep','reactionSturm'].includes(frame.step.op))for(const old of before.units){const u=unit(s,old.uid);if(u&&(u.at!==old.at||(u.layer||'surface')!==(old.layer||'surface'))&&(!fiftyForceAllowed(before,old,frame.controller,ruleAPI(s))||!forcedSubmergeAllowed(before,old,u,ruleAPI(s)))){const siteMoved=before.board[old.at]?.uid&&s.board[u.at]?.uid===before.board[old.at].uid&&s.board[old.at]?.uid!==before.board[old.at].uid;if(!siteMoved){u.at=old.at;u.layer=old.layer||'surface';}}}delete s.randomReplay;}catch(e){if(!e.lucky)throw e;for(const key of Object.keys(s))delete s[key];Object.assign(s,before);s.rng=e.rng;s.choice={player:e.chooser??frame.controller,title:e.title||'Lucky Charm · 選擇一個隨機結果',options:e.results.map((value,i)=>({label:'結果 '+(i+1)+'：'+e.labels[value],value})),frame:{source:frame.source,controller:frame.controller,effectCard:frame.effectCard,zoneAccessScope:frame.zoneAccessScope,magicChoiceContextId:frame.magicChoiceContextId,step:{op:'luckyResume',original:{...frame,rolls:e.rolls}}}};}
}
function enforceBorders(s,before){
 for(const old of before.units){const u=unit(s,old.uid);if(!u||u.at===old.at&&(u.layer||'surface')===(old.layer||'surface'))continue;
  const siteMoved=before.board[old.at]?.uid&&s.board[u.at]?.uid===before.board[old.at].uid&&s.board[old.at]?.uid!==before.board[old.at].uid;if(siteMoved)continue;
  const growthFrom=u.geometryMovementFrom,from=growthFrom?[growthFrom.at]:occupied(old),to=growthFrom?[u.at]:occupied(u),teleport=!!u.carryTeleport;
  if(!finalCageForceAllowed(old,teleport)||!to.every((at,i)=>borderMoveAllowed(before,old,{at:from[i],layer:growthFrom?.layer||old.layer},{at,layer:u.layer},card,keywords,teleport,!!u.carryFlying,power(old)))){u.at=old.at;u.layer=old.layer||'surface';}
 }
}
function log(s,text) { s.log.push({turn:s.turn,text}); }
function startEvent(s,source,effectCard,bookkeeping=false){
  const isUnit=source&&['Avatar','Minion'].includes(card(source.card).type),magic=effectCard&&card(effectCard).type==='Magic';
  s.eventContext={effectCard,abilityOrigin:source?.abilityOrigin||source?.card||effectCard,fallback:!bookkeeping&&isUnit?[combatSnapshot(s,unit(s,source.uid)||source,ruleAPI(s))]:[],priority:magic?2:3,credits:{},triggers:[],survivors:[],strongest:[0,1].map(p=>Math.max(0,...s.units.filter(u=>u.controller!==p&&!u.dying&&card(u.card).type==='Minion').map(u=>power(u))))};
}
function creditUnit(s,target,source){
  if(!source||!['Avatar','Minion'].includes(card(source.card).type)||!s.eventContext)return;
  const e=s.eventContext,list=e.credits[target.uid]||(e.credits[target.uid]=[]);if(!list.some(u=>u.uid===source.uid))list.push(combatSnapshot(s,unit(s,source.uid)||source,ruleAPI(s)));
}
function eventTrigger(s,source,steps){const live=unit(s,source.uid);if(live)live.notRest=true;if(s.eventContext)s.eventContext.triggers.push({source:clone(source),steps,controller:source.controller});else queueEffects(s,steps,source,source.controller,source.card,{fresh:true});}
function makeUnit(s,id,owner,at) {
  const c=cardForPlayer(s,id,owner); const u={uid:'u'+s.next++,card:id,owner,controller:owner,at,tapped:false,born:s.turn,damage:0,
    ward:printedKeywords(c).includes('Ward')&&!cardForPlayer(s,c,owner).umbrellas.includes('Evil'),stealth:printedKeywords(c).includes('Stealth'),mods:[]};
  u.stamp=s.next-1;u.summonedAt=at;u.justEntered=true;u.geometryWrap=isGlobeActive(s,card);if(c.slug==='mountain_giant')u.size=2;s.units.push(u);finalPassiveEntry(s,u,ruleAPI(s)); return u;
}
export function newGame(decks, seed=20261029, mode='ai') {
  decks.forEach(d=>assert(!validateDeck(d).length,validateDeck(d).join('；')));
  const s={version:1,projectRuleProfile:PROJECT_RULE_PROFILE,rng:seed>>>0,seed,mode,turn:1,active:0,phase:'mulligan',mulligan:0,next:1,winner:null,
    board:Array(20).fill(null),units:[],players:[],pending:null,log:[],history:[]};
  s.firstPlayer=Math.floor(random(s)*2);s.active=s.firstPlayer;s.mulligan=s.firstPlayer;
  for(let p=0;p<2;p++) {
    const d=decks[p]; s.players.push({name:p===0?'你':mode==='ai'?'灰燼賢者 · AI':'玩家二',life:20,maxLife:20,doorTurn:null,
      collection:[...(d.collection||[])],collectionMode:d.collectionMode||'constructed',turnsTaken:p===s.firstPlayer?1:0,hand:[],atlas:shuffle(s,[...d.atlas]),spells:shuffle(s,[...d.spells]),cemetery:[],banished:[],spent:0});
    setupAbilitySource(s,p,d,ruleAPI(s));const createdAvatar=makeUnit(s,d.avatar,p,p===0?17:2);if(passives[card(d.avatar).slug]?.completionHarbinger){createdAvatar.harbingerSquares=[];while(createdAvatar.harbingerSquares.length<3){const at=Math.floor(random(s)*20);if(!createdAvatar.harbingerSquares.includes(at))createdAvatar.harbingerSquares.push(at);}}
    if(!finalAvatarSetupHand(s,p,d.avatar,ruleAPI(s))){
    for(let i=0;i<(passives[card(d.avatar).slug]?.uniquePairs?2:3);i++) { draw(s,p,'atlas'); draw(s,p,'spells'); }
    if(passives[card(d.avatar).slug]?.extraOpeningSpell)draw(s,p,'spells');
    }
  }
  s.avatarSetupComplete=true;
  log(s,'對局建立。'+s.players.map(pl=>pl.name+' 起手 '+pl.hand.length+' 張').join('；')+'；'+s.players[s.firstPlayer].name+' 隨機取得先手，首回合不抽牌。'); return s;
}
export function unit(s,id) { return s.units.find(u=>u.uid===id)||freeCityProxy(s,id,ruleAPI(s))||undefined; }
export function spellcaster(s,id,layer='surface',location=null){const found=unit(s,id)||(s.artifacts||[]).find(o=>o.uid===id);if(found){if(!location)return found;const candidate=geometryCasterLocations(s,found).find(v=>v.at===location.at&&(v.layer||'surface')===(location.layer||'surface'));return candidate;}if(typeof id==='string'&&id.startsWith('site:')){const at=Number(id.slice(5)),site=s.board[at];if(site)return {...site,uid:id,at,layer};}return undefined;}
export function avatar(s,p) { return s.units.find(u=>u.controller===p&&card(u.card).type==='Avatar'); }
export function carriable(c){return c.type==='Artifact'&&!c.subtypes.some(t=>['Monument','Automaton'].includes(t));}
export function pickupItems(s,u){const limit=spatialPickupCarriedLimit(s,u,ruleAPI(s));return (s.artifacts||[]).filter(a=>carriable(card(a.card))&&!redRockCarryingForbidden(s,a,ruleAPI(s))&&sameLocation(s,a,u)&&(!a.bearer||a.bearer!==u.uid&&limit!==undefined&&(card(a.card).cost||0)<=limit));}
export function canDropArtifact(s,a){if(isAnimatedArtifact(a))return false;const bearer=unit(s,a.bearer);return !(bearer&&!disabled(bearer)&&unitPassiveLayerViews(s,bearer,ruleAPI(s),'cannotDropAll').some(l=>l.value))&&!(!a.silenced&&!a.disabled&&passives[card(a.card).slug]?.cannotDrop)&&!(s.auras||[]).some(v=>catalogAuraActive(v,disabled)&&areaAuras[card(v.card).slug]?.cursedEquipment&&catalogAuraHere(v,a,inside));}
export function liveUnitAbilities(s,u){return u?(unitDefinitionLayers(s,u,ruleAPI(s)).activated||[]):[];}
export function liveUnitAbility(s,a){const list=liveUnitAbilities(s,unit(s,a.unit));return a.abilityInstance?list.find(v=>v.abilityInstance===a.abilityInstance):list[a.index];}
export function artifactController(s,a){if(carriable(card(a.card)))return unit(s,a.bearer)?.controller??null;return arthurActive(s,ruleAPI(s))?a.owner:a.controller??a.owner;}
export function castingCard(s,a) {
  const rasputin=finalRasputinCastingCard(s,a,ruleAPI(s));if(rasputin!==undefined)return rasputin;
  const plunder=finalUnitPlunderCastingCard(s,a,ruleAPI(s));if(plunder!==undefined)return plunder;
  const alternate=finalAvatarCastingCard(s,a,ruleAPI(s));if(alternate!==undefined)return alternate?cardForPlayer(s,alternate,a.player):alternate;
  const pl=s.players[a.player];
  if(a.top!==undefined)return a.top.player===a.player&&pl.spells[0]===a.top.card?cardForPlayer(s,a.top.card,a.player):null;
  if(a.collection!==undefined)return pl.collection?.[a.collection]===a.card&&(s.collectionPermissions||[]).some(e=>e.uid===a.permit&&e.player===a.player&&e.caster===a.caster)?cardForPlayer(s,a.card,a.player):null;
  const id=a.bound!==undefined?(s.boundSpells||[]).find(h=>h.uid===a.bound&&spellcaster(s,h.unit)?.controller===a.player)?.card:a.grave!==undefined?s.players[a.graveOwner??a.player].cemetery[a.grave]:pl.hand.find(h=>h.uid===a.hand)?.card;
  return id===undefined?null:cardForPlayer(s,id,a.player);
}
export function locations(s,u,lookup=card,abilities=keywords,stepOnly=false){return baseLocations(s,u,lookup,abilities,stepOnly,ruleAPI(s));}
export function canEnterOnGround(s,u,from,to,lookup=card,abilities=keywords,teleport=false,fly=false){return baseCanEnterOnGround(s,u,from,to,lookup,abilities,teleport,fly,ruleAPI(s));}
export function cardForPlayer(s,id,p){return vivienCardForPlayer(s,contextualCard(s,id,p,ruleAPI(s)),p,ruleAPI(s));}
export function keywords(u) { const all=[...(u.fiftyFlying?['Airborne']:[]),...(u.silenced?[]:printedKeywords(card(u.card))),...(u.burrowedSafely?['Burrowing','Immobile']:[]),...(u.grantedKeywords||[]),...(u.carryKeywords||[]),...(u.transportImmobile?['Immobile']:[]),...(u.whaleArmor&&power(u)<3?['Immobile']:[]),...(u.mods||[]).flatMap(m=>m.keyword?[m.keyword]:[])].filter(k=>!(u.deniedKeywords||[]).includes(k)&&!(k==='Immobile'&&(u.gainedCannotImmobilize||!u.silenced&&passives[card(u.card).slug]?.cannotImmobilize)));return disabled(u)?all.filter(k=>['Landbound','Waterbound'].includes(k)):all; }
function stealthHides(u){return !!u?.stealth&&(!u.silenced||keywords(u).includes('Stealth'));}
export function power(u,defense=false) {
  const stitched=finalStitchedPower(u);return unitPower(u,id=>{const c=card(id);return stitched===null?c:{...c,attack:stitched,defense:stitched};},defense);
}
export function unitUmbrellas(u,s=null,viewer=null){const base=[...new Set([...(card(u.card).slug==='azuridge_caravan'?[]:card(u.card).umbrellas),...(u.copyEvil?['Evil']:[]),...(unitTypes(u,s).some(t=>['Demon','Undead','Monster'].includes(t))?['Evil']:[])])];return s?contextualUnitUmbrellas(s,u,base,ruleAPI(s),viewer):finalUnitUmbrellas(u,base);}
export function baseUnitTypes(u){return [...new Set([...((u.mods||[]).slice().reverse().find(m=>m.replaceTypes)?.replaceTypes||printedMinionTypes(card(u.card))).filter(t=>!u.completionBower||t!=='Mortal'),...(u.completionBower?['Beast']:[]),...u.grantedTypes||[],...(u.mods||[]).flatMap(m=>m.types||[])])];}
export function unitTypes(u,s=null){const types=baseUnitTypes(u);return s?contextualUnitTypes(s,u,types,ruleAPI(s)):finalAvatarUnitTypes(u,types);}
export function disabled(u) { if(u.fiftyOnslaught||u.gainedCannotDisable||!u.silenced&&passives[card(u.card).slug]?.cannotDisable)return false;return !!u.completionDisabled||!!u.restraintDisabled||!!u.carryDisabled||!!u.bellyDisabled||!!u.effectDisabled||!!u.boundDisabled||!!u.conditionDisabled||(u.mods||[]).some(m=>m.disabled||m.asleep); }
export function ready(s,u) { return !u.dying&&!u.tapped&&!disabled(u)&&(card(u.card).type==='Avatar'||u.born<s.turn||keywords(u).includes('Charge')); }
function untap(s,u){
  if(beforeFinalUnitUntap(s,u,ruleAPI(s)))return false;
  if(!u||!u.tapped)return false;
  if(card(u.card).type==='Minion'&&s.units.some(v=>v.uid!==u.uid&&!v.dying&&!disabled(v)&&unitPassiveLayerViews(s,v,ruleAPI(s),'preventOtherUntap').some(l=>l.value)))return false;
  if(u.skipUntap){u.skipUntap=false;return false;}u.tapped=false;return true;
}
function bindControl(s,u,p,expiry){(s.boundControls||(s.boundControls=[])).push({target:u.uid,controller:p,stamp:s.next++,...expiry});}
function targetDeclared(s,source,selected){const actor=unit(s,source?.uid),target=selected?.entity==='unit'?unit(s,selected.uid):null;if(actor&&target&&card(target.card).type==='Minion'&&power(target)<power(actor))for(const layer of combatViews(s,actor,ruleAPI(s),'untapOnWeakerTarget'))untap(s,actor);}
export const region=(s,u)=>getRegion(s,u,card);
export const regionNames=(s,u)=>getRegionNames(s,u,card);
export const regionsOverlap=(s,a,b)=>getRegionsOverlap(s,a,b,card);
const sameLocation=(s,a,b)=>geometryLocationRecords(a).some(loc=>occupiesGeometryLocation(b,loc.at,loc.layer));
export function resources(s,p,skipCities=false) {
  const r={mana:0,air:0,earth:0,fire:0,water:0};
  r.mana+=keyProvidedMana(s,p,{card,unit,artifactController});
  for(const u of s.units)if(u.controller===p&&card(u.card).slug==='island_leviathan_monster')r.water+=card(u.card).water;else if(u.controller===p&&card(u.card).slug==='__behemoth_demon')r.fire+=card(u.card).fire;
  for(const site of s.board)if(site?.controller===p&&passives[card(site.card).slug]?.enemyUniqueGraveMana)r.mana+=cemeteryCards(s,1-p,ruleAPI(s)).filter(id=>card(id).type==='Minion'&&card(id).rarity==='Unique').length;
  for(const [at,site] of s.board.entries())if(site){const c=card(site.card),d=sitePassives[c.slug];if(site.controller!==p&&!(d?.everyone&&!site.silenced)||d?.backRowOnly&&!inBackRow(at,site.controller))continue;if(!site.disabled&&c.slug!=='rubble'&&!d?.noMana&&siteBaseResources(s,at,card))r.mana+=((c.providesMana??1)+siteResourceGift(s,at,card))*siteMultiplier(s,at);const affinity=siteAffinity(s,at,card);if(!s.units.some(u=>occupied(u).includes(at)&&!u.dying&&!disabled(u)&&unitPassiveLayerViews(s,u,ruleAPI(s),'noSiteThreshold').some(l=>l.value)))for(const e of elements)r[e]+=(affinity[e]+(site.bonusTurn===s.turn&&!site.silenced&&!site.disabled&&!(e==='water'&&affinity.dry)?(site.bonusThreshold?.[e]||0):0))*siteMultiplier(s,at);}
  for(const aura of s.auras||[]){const d=areaAuras[card(aura.card).slug];if(d?.mana&&catalogAuraActive(aura,disabled))r.mana+=auraCells(aura).filter(at=>s.board[at]&&!s.board[at].disabled&&s.board[at].controller===p).reduce((n,at)=>n+d.mana*siteMultiplier(s,at),0);}
  for(const a of s.artifacts||[]){const bearer=unit(s,a.bearer),d=equipment[card(a.card).slug],relic=passives[card(a.card).slug];if(bearer&&artifactController(s,a)===p&&!a.silenced&&!a.disabled){if(d){r.mana+=d.mana||0;if(d.threshold)r[d.threshold]++;}if(relic?.voidMana&&regionNames(s,bearer).has('void'))r.mana+=relic.voidMana;}}
  for(const u of s.units) if(u.controller===p&&!disabled(u)) {
    for(const layer of unitPassiveLayerViews(s,u,ruleAPI(s),'printedProvidesMana'))r.mana+=layer.value;
    for(const layer of unitPassiveLayerViews(s,u,ruleAPI(s),'printedProvidesFire'))r.fire+=layer.value;
    for(const layer of unitPassiveLayerViews(s,u,ruleAPI(s),'threshold'))r[layer.value]++;
    for(const layer of unitPassiveLayerViews(s,u,ruleAPI(s),'allThreshold'))for(const e of elements)r[e]+=layer.value;
    if(avatar(s,1-p)&&nearby(s,u.at,avatar(s,1-p).at))for(const layer of unitPassiveLayerViews(s,u,ruleAPI(s),'enemyAvatarMana'))r.mana+=layer.value;
  }
  r.mana+=(s.players[p].bonusMana||0);
  for(const e of elements)r[e]+=s.players[p].bonusAffinity?.[e]||0;
  if(!skipCities){let opponentThreshold=null;for(const site of s.board)if(site&&!site.silenced){const d=sitePassives[card(site.card).slug];if(site.controller===p&&d?.manaThreshold&&r[d.manaThreshold]>=1)r.mana++;if(site.controller===1-p&&d?.enemyManaThreshold){if(!opponentThreshold)opponentThreshold=resources(s,1-p,true);if(opponentThreshold[d.enemyManaThreshold]>=1)r.mana++;}}}
  r.available=p===(s.finalCopyPreviewActive??s.active)?Math.max(0,r.mana-s.players[p].spent):0; return r;
}
function drawAllowed(s,p,deck) {
  if(s.winner!==null)return null;
  const player=s.players[p];
  if(deck==='atlas'&&player.finalNoAtlas)return null;
  const duringTurn=s.phase!=='mulligan';if(duringTurn&&player.drawTurn!==s.turn){player.drawTurn=s.turn;player.spellsDrawn=0;player.cardsDrawn=0;}
  if(duringTurn&&deck==='spells'&&player.spellsDrawn>=1&&s.board.some(site=>site&&!site.silenced&&!site.disabled&&passives[card(site.card).slug]?.oneSpellDrawPerTurn)){log(s,'Garden of Eden 阻止本回合額外抽取法術。');return null;}
  return true;
}
function receiveDraw(s,p,deck,id,boundTo=null) {
 const player=s.players[p],duringTurn=s.phase!=='mulligan';
 if(boundTo)(s.boundSpells||(s.boundSpells=[])).push({uid:'b'+s.next++,card:id,unit:boundTo,owner:p});else player.hand.push({uid:'h'+s.next++,card:id});if(duringTurn&&deck==='spells')player.spellsDrawn++;
    if(duringTurn)player.cardsDrawn=(player.cardsDrawn||0)+1;
    for(const a of s.artifacts||[]){if(passives[card(a.card).slug]?.tapStrongestOnDraw)queueEffects(s,[{op:'chainsTap'}],a,p);const av=avatar(s,p);if(duringTurn&&av&&!a.silenced&&!a.disabled&&passives[card(a.card).slug]?.drawLifeLoss&&occupied(av).some(at=>nearby(s,at,a.at))&&regionsOverlap(s,av,a))queueEffects(s,[{op:'castLifeLoss',player:p,amount:player.cardsDrawn}],a,artifactController(s,a));}
    for(const u of s.units)if(!u.dying&&!disabled(u)&&u.controller!==p&&player.hand.length>s.players[u.controller].hand.length)for(const layer of unitPassiveLayerViews(s,u,ruleAPI(s),'opponentDrawCatchup'))if(layer.value)eventTrigger(s,{...u,abilityOrigin:layer.origin},[{op:'queenCatchup',opponent:p,abilityOrigin:layer.origin}]);
 return id;
}
function drawFromSearch(s,p,id) {
 if(!drawAllowed(s,p,'spells'))return null;
 return receiveDraw(s,p,'spells',id);
}
function draw(s,p,deck,boundTo=null,bottom=false) {
 const player=s.players[p];if(!drawAllowed(s,p,deck))return null;
 if(player[deck].length){if(deck==='spells'&&!bottom)clearFinalInquisitionTop(s,p);return receiveDraw(s,p,deck,bottom?player[deck].pop():player[deck].shift(),boundTo);}
 s.winner=1-p;s.phase='over';log(s,player.name+' attempted to draw from an empty '+deck+' and loses.');return null;
}
function loseLife(s,p,n,damage=false,cause=null) {
  if(!siteEffectAllowed(s,avatar(s,p),'loseLife',{card}))return;
  if(!damage&&cause&&['Minion','Avatar'].includes(card(cause.card).type)&&(s.artifacts||[]).some(a=>passives[card(a.card).slug]?.nearbyStrikeLifeCap&&nearby(s,a.at,cause.at)&&regionsOverlap(s,a,cause)))n=Math.min(n,2);
  if(n<=0)return;
  const pl=s.players[p];
  if(pl.doorTurn!==null) { const before=pl.life;pl.life=Math.max(0,pl.life-n);if(pl.life<before)pl.lostLifeTurn=s.turn; if(damage&&pl.doorTurn!==s.turn) { if(finalEggPreventsDeathblow(s,p))return; if(avatar(s,p)?.glory)avatar(s,p).gloryDeathPending=true;else playerDies(s,p) } return; }
  pl.life=Math.max(0,pl.life-n);
  pl.lostLifeTurn=s.turn;
  if(pl.life===0) { pl.doorTurn=s.turn;finalSiteDoorArrived(s,p,ruleAPI(s)); log(s,pl.name+' 進入 Death’s Door，本回合免於死亡。'); }
}
function playerDies(s,p){if(finalAltarPreventsDeath(s,p,ruleAPI(s)))return;s.winner=1-p;s.phase='over';log(s,s.players[p].name+' 遭受致命一擊。');}
function damionProtects(s,u){
 const damion=u.damionSource&&unit(s,u.damionSource);
 return !!damion&&!damion.dying&&geometryLocationRecords(u).some(loc=>geometryLocationRecords(damion).some(from=>nearby(s,loc.at,from.at)&&regionsOverlap(s,loc,from)));
}
function hurt(s,u,n,lethal=false,kind=null,damageSource=null,strikeModifiers=[],receipt=null) {
  if(!u)return 0;
  if(!siteEffectAllowed(s,u,'damage',{card}))return 0;
  const abilityDamageElements=damageSource?.abilityDamageElements||[];
  if(damageSource)damageSource=unit(s,damageSource.uid)||damageSource;
  const fromUnit=damageSource&&kind!=='magic'&&['Minion','Avatar'].includes(card(damageSource.card).type);
  if(fromUnit&&keywords(damageSource).includes('Lethal'))lethal=true;
  if(n<0)return 0;
  const effect=s.eventContext?.effectCard?card(s.eventContext.effectCard):null;
  const damageCard=kind==='strike'&&damageSource?card(damageSource.card):effect||(damageSource?card(damageSource.card):null);
  const isFireDamage=damageCard?.fire>0||abilityDamageElements.includes('fire');
  const modified=modifyFinalDamage(s,u,n,kind,damageSource,ruleAPI(s),strikeModifiers);u=modified.target;n=modified.amount;if(receipt){receipt.recipient=u.uid;receipt.redirected=!!modified.redirected;}if(n<=0)return 0;
  if(u.siteProxy)return damageSite(s,u.at,n,damageSource);
  const carried=(s.artifacts||[]).filter(a=>a.bearer===u.uid),protections=!disabled(u)?unitPassiveLayerViews(s,u,ruleAPI(s)):[];
  if(protections.some(l=>l.passive.immuneOrdinary)&&damageCard?.rarity==='Ordinary')return 0;
  if(fromUnit&&carried.some(a=>(!passives[card(a.card).slug]?.bearerMinion||card(u.card).type==='Minion')&&passives[card(a.card).slug]?.bearerImmunePower<=power(damageSource)))return 0;
  if(carried.some(a=>passives[card(a.card).slug]?.elementalSword)&&elements.every(e=>abilityUnitHasElement(s,u,e,ruleAPI(s))))return 0;
  if(kind==='strike'){
    const helmet=carried.find(a=>passives[card(a.card).slug]?.returnPreventStrike);if(helmet){removeObject(s,helmet,'hand');return 0;}
  }
  if(card(u.card).type==='Minion'&&(s.artifacts||[]).some(a=>!a.silenced&&!a.disabled&&passives[card(a.card).slug]?.nearbyDamageLethal&&occupied(u).some(at=>nearby(s,a.at,at))&&regionsOverlap(s,a,u)))lethal=true;
  const fromMinion=fromUnit&&card(damageSource.card).type==='Minion';
  if(fromUnit){const types=unitTypes(damageSource,s),sourcePower=power(damageSource);
    if(protections.some(({passive:p})=>p.immunePowerAtLeast&&sourcePower>=p.immunePowerAtLeast||fromMinion&&p.immuneTypes?.some(t=>types.includes(t))))return 0;
    for(const ally of s.units)if(ally.controller===u.controller&&!ally.dying&&!disabled(ally)&&nearby(s,ally.at,u.at)&&regionsOverlap(s,ally,u))for(const {passive:p} of unitPassiveLayerViews(s,ally,ruleAPI(s))){
      const shield=p?.protectAllyTypesFromPower;
      if(fromMinion&&p?.protectFromTypes?.some(t=>types.includes(t))||shield&&sourcePower>=shield.power&&shield.types.some(t=>unitTypes(u,s).includes(t)))return 0;
    }
  }
  for(const e of s.ongoingEffects||[])if(finalArchiveEffectApplies(e,u)&&e.op==='shieldWall'&&e.controller===u.controller)n-=s.units.filter(v=>v.uid!==u.uid&&v.controller===u.controller&&!v.dying&&nearby(s,v.at,u.at)&&regionsOverlap(s,v,u)).length;
  if(n<=0)return 0;
  if(kind==='magic'&&(u.iceMagicProtection||!disabled(u)&&(u.magicProtected||u.magicDamageProtected)))return 0;
  if(protections.some(l=>l.passive.preventFireDamage)&&isFireDamage)return 0;
  if(protections.some(l=>l.passive.preventFireSpellDamage)&&damageCard?.category==='Spell'&&isFireDamage||protections.some(l=>l.passive.preventDesertDamage)&&effect?.type==='Site'&&effect.subtypes.includes('Desert'))return 0;
  for(const source of s.units)if(source.controller===u.controller&&!source.dying&&!disabled(source)&&nearby(s,source.at,u.at)&&regionsOverlap(s,source,u))for(const layer of unitPassiveLayerViews(s,source,ruleAPI(s),'nearbyPrevent'))n-=layer.value;
  n=Math.max(0,n-protections.reduce((sum,l)=>sum+(l.passive.preventDamage||0),0));
  if(n===0)return 0;
  if(combatHas(s,u,'preventFirstDamage',ruleAPI(s))&&u.preventedTurn!==s.turn){u.preventedTurn=s.turn;return 0;}
  if(!disabled(u)&&power(u)>3&&carried.some(a=>passives[card(a.card).slug]?.whaleArmor)&&u.whalePreventedTurn!==s.turn&&u.damageTakenTurn!==s.turn){u.whalePreventedTurn=s.turn;return 0;}
  const barricade=(s.artifacts||[]).find(o=>!o.silenced&&!o.disabled&&passives[card(o.card).slug]?.fiftyBarricade&&artifactController(s,o)===u.controller&&sameLocation(s,u,o));if(barricade){const event=s.eventContext;if(event){if(!event.fiftyBarricades)event.fiftyBarricades={};event.fiftyBarricades[barricade.uid]=(event.fiftyBarricades[barricade.uid]||0)+n;}else if(n>=3)removeObject(s,barricade,'cemetery');return 0;}
  if(s.eventContext)s.eventContext.fiftyReceipt={uid:u.uid,at:u.at,amount:n};
  if(u.ward||s.damageWindow?.wards.includes(u.uid)) { if(u.ward)log(s,card(u.card).name+' 的 Ward 阻擋傷害。');u.ward=false;return 0; }
  if(card(u.card).type==='Avatar')loseLife(s,u.controller,n,true);
  else { u.mods=u.mods.filter(m=>!m.asleep);if(!absorbFinalStitchedDamage(s,u,n,lethal,damageSource,ruleAPI(s)))u.damage+=n; if(lethal&&!u.lethalImmune&&!damionProtects(s,u))u.lethal=true;if(!lethal&&combatHas(s,u,'healNonlethal',ruleAPI(s))){if(s.damageWindow){if(!s.damageWindow.hydras)s.damageWindow.hydras=[];if(!s.damageWindow.hydras.includes(u.uid))s.damageWindow.hydras.push(u.uid);}else if(u.damage<power(u,true))u.damage=0;} }
  damagedAbilitySource(s,u,n);u.damageTakenTurn=s.turn;if(fromUnit)creditUnit(s,u,damageSource);
  for(const trigger of combatHurtTriggers(s,u,n,ruleAPI(s)))eventTrigger(s,trigger.source,trigger.steps);
  if(s.eventContext)for(const layer of combatSurvivorSources(s,u,ruleAPI(s)))if(!s.eventContext.survivors.some(e=>e.target===u.uid&&e.source.uid===layer.source.uid&&e.instance===layer.instance))s.eventContext.survivors.push({source:clone(layer.source),instance:layer.instance,target:u.uid});
  markFinalGawainDamage(s,u,n,modified.gawain,modified.gawainSource);
  return n;
}
function healingAmount(s,n,target=null){for(const site of s.board)if(site&&siteEffectAllowed(s,target,'heal',{card},site.card)&&sitePassives[card(site.card).slug]?.halveHealing)n=Math.floor(n/2);return n;}
function pullDestinations(s,u,root,requireBody=true){const body=bodyOfWater(s,root,card),result=new Set();for(const cell of occupied(u))if(!requireBody||body.has(cell)){if(u.size===2&&cell===root)result.add(u.at);for(let next=0;next<20;next++)if(distance(s,cell,next)===1&&distance(s,next,root)<distance(s,cell,root)){const at=u.at+next-cell;if(at<0||at>=20||u.size===2&&(at%5>3||at>=15))continue;const from=occupied(u),to=occupied({...u,at});if(to.every((v,i)=>regionsOverlap(s,{at:v,layer:u.layer},{at:from[i],layer:u.layer})&&(from.includes(v)||canEnterOnGround(s,u,{at:from[i],layer:u.layer},{at:v,layer:u.layer},card,keywords))))result.add(at);}}return [...result];}
function heal(s,p,n) { if(!siteEffectAllowed(s,avatar(s,p),'heal',{card}))return;const pl=s.players[p];if(pl.doorTurn===null&&!sphereAt(s,avatar(s,p),card))pl.life=Math.min(pl.maxLife,pl.life+healingAmount(s,n,avatar(s,p))); }
function fullyHeal(s,u){if(card(u.card).type==='Avatar'){const p=s.players[u.controller];if(p.doorTurn===null&&!sphereAt(s,u,card))p.life=p.maxLife;}else {u.damage=0;clearFinalStitchedDamage(u);}}
function deathReplacements(s,u){if(card(u.card).type!=='Minion')return [];if(s.simultaneousDestruction&&Object.hasOwn(s.simultaneousDestruction.replacements,u.uid))return s.simultaneousDestruction.replacements[u.uid];return [...s.artifacts.filter(a=>a.bearer===u.uid&&!a.silenced&&passives[card(a.card).slug]?.saveBearerDeath).map(a=>({kind:'aegis',uid:a.uid,label:card(a.card).name})),...combatDeathReplacements(s,u,ruleAPI(s))];}
// Resolve destruction replacements against the original realm, while holding
// consequences until every captured object and Site has been destroyed.
function beginRealmDestruction(s){
 assert(!s.simultaneousDestruction,'Overlapping destruction batch');
 const replacements=Object.fromEntries(s.units.filter(u=>!u.dying&&card(u.card).type==='Minion').map(u=>[u.uid,deathReplacements(s,u)]));
 const protectedSites=s.board.flatMap((site,at)=>site&&siteProtectedFromDestruction(s,at)?[at]:[]);
 s.simultaneousDestruction={replacements,protectedSites,held:[]};
}
function finishRealmDestruction(s){const held=s.simultaneousDestruction?.held||[];delete s.simultaneousDestruction;s.storyline.push(...held);}
function replaceDeath(s,u,option){if(option.kind==='aegis'){const a=s.artifacts.find(a=>a.uid===option.uid);if(!a)return;removeObject(s,a,'banished');fullyHeal(s,u);u.lethal=false;}else leaveUnit(s,u,'hand');}
function kill(s,u,banish=false,death=false,sacrifice=false) {
  if(!death&&!sacrifice&&!siteEffectAllowed(s,u,banish?'banish':'destroy',{card}))return;
  if(!u||u.dying||u.deathReplacementPending||!unit(s,u.uid)||card(u.card).type==='Avatar')return;
  if(!banish&&!death&&u.ward){u.ward=false;return;}
  if(!sacrifice&&!banish&&(u.glory||combatHas(s,u,'unkillable',ruleAPI(s))))return;
  if(banish){if(combatHas(s,u,'unkillable',ruleAPI(s)))return;leaveUnit(s,u,'banished',death||sacrifice);return;}
  if(!sacrifice&&combatHas(s,u,'nineLives',ruleAPI(s))&&(u.livesLost||0)<8){u.livesLost=(u.livesLost||0)+1;fullyHeal(s,u);u.lethal=false;return;}

  if(!sacrifice&&damionProtects(s,u))return;
  const replacements=sacrifice?[]:deathReplacements(s,u);if(replacements.length===1){replaceDeath(s,u,replacements[0]);return;}if(replacements.length>1){u.deathReplacementPending=true;queueEffects(s,[{op:'chooseDeathReplacement',uid:u.uid,death}],u,u.controller);return;}
  if(!sacrifice&&u.nosferatuTurn===s.turn){leaveUnit(s,u,'banished');return;}
  const e=s.eventContext,killers=e?.credits[u.uid]||e?.fallback||[],deadPower=power(u);
  if(!sacrifice&&killers.some(k=>combatHas(s,k,'reapKills',ruleAPI(s)))){const reaper=combatViews(s,killers.find(k=>combatHas(s,k,'reapKills',ruleAPI(s))),ruleAPI(s),'reapKills')[0].source;const id=u.originalCard||u.card;leaveUnit(s,u,'banished');queueEffects(s,[{op:'remainingReap',card:id,owner:u.owner,abilityOrigin:reaper.abilityOrigin,abilityInstance:reaper.abilityInstance}],reaper,reaper.controller);return;}
  if(!s.deathHistory)s.deathHistory=[];s.deathHistory.push({card:u.card,uid:u.uid,at:u.at,layer:u.layer||'surface',controller:u.controller,turn:s.turn,creditPriority:killers.length?(e?.credits[u.uid]?1:e?.priority||null):null,killers:killers.map(v=>({uid:v.uid,card:v.card,controller:v.controller}))});
  for(const [at,site] of s.board.entries())if(site&&!site.silenced&&!site.disabled&&passives[card(site.card).slug]?.evilDeathLoss&&unitUmbrellas(u,s,site.controller).includes('Evil')&&occupied(u).some(i=>nearby(s,at,i)))eventTrigger(s,{...site,at,uid:'site:'+at},[{op:'castLifeLoss',player:u.controller,amount:1}]);
  if(unitTypes(u,s).some(t=>['Mortal','Beast'].includes(t)))for(const v of s.units)if(v.uid!==u.uid&&!v.dying&&occupied(u).some(at=>nearby(s,at,v.at))&&regionsOverlap(s,u,v))for(const layer of unitPassiveLayerViews(s,v,ruleAPI(s),'wakeFromNearbyDeath'))if(layer.value)eventTrigger(s,{...v,abilityOrigin:layer.origin},[{op:'wakeHollow',uid:v.uid,instance:layer.instance,nature:layer.nature,origin:layer.origin,generation:v.hollowWakeGenerations?.[layer.instance]??0}]);
  if(unitTypes(u,s).includes('Mortal')&&(u.layer||'surface')==='surface'&&s.board[u.at]&&!waterSite(s,u.at,card))queueGraveReturns(s,u.controller,'scourge_zombies',u.at,{layer:'surface',tapped:true,event:true});
  for(const a of s.artifacts||[]){const d=passives[card(a.card).slug],controller=artifactController(s,a);if((controller===0||controller===1)&&!a.silenced&&!a.disabled&&(d?.nearbyDeathHeal||d?.nearbyDeathLoss)&&occupied(u).some(at=>nearby(s,a.at,at))&&regionsOverlap(s,a,u))eventTrigger(s,{...a,controller},[{op:'relicDeath',heal:d.nearbyDeathHeal||0,loss:d.nearbyDeathLoss||0}]);}
  for(const v of s.units)if(v.uid!==u.uid&&!v.dying&&nearby(s,v.at,u.at)&&regionsOverlap(s,v,u))for(const trigger of combatTriggers(s,v,'gainNearbyDeadPower',ruleAPI(s),()=>[{op:'gainDeathPower',uid:v.uid,amount:deadPower}]))eventTrigger(s,trigger.source,trigger.steps);
  for(const trigger of combatTriggers(s,u,'revengeOnDeath',ruleAPI(s),()=>killers.map(killer=>({op:'albatrossRevenge',killer:clone(killer)}))))eventTrigger(s,trigger.source,trigger.steps);
  for(const killer of killers){for(const t of finalUnitAttackKillTriggers(s,killer,u,e,ruleAPI(s)))eventTrigger(s,t.source,t.steps);
    for(const trigger of combatKillTriggers(s,killer,u,e,deadPower,ruleAPI(s)))eventTrigger(s,trigger.source,trigger.steps);
    if(e?.attack===killer.uid&&killer.controller!==u.controller&&(s.artifacts||[]).some(a=>a.bearer===killer.uid&&!a.silenced&&passives[card(a.card).slug]?.untapAttackKill))eventTrigger(s,killer,[{op:'untapSelf',uid:killer.uid}]);
    if(e?.attack===killer.uid&&!disabled(killer)&&(killer.mods||[]).some(m=>m.warpSpasm&&m.end===s.turn))eventTrigger(s,killer,[{op:'untapSelf',uid:killer.uid}]);
    if(unitTypes(killer,s).includes('Giant'))for(const v of s.units)if(v.controller===killer.controller&&!v.dying)for(const trigger of combatTriggers(s,v,'giantsBanishKills',ruleAPI(s),()=>[{op:'giantKill',uid:killer.uid,victim:u.uid}]))eventTrigger(s,trigger.source,trigger.steps);
  }
  finalGawainDiesFromDamage(s,u,death,sacrifice,ruleAPI(s));
  u.dying=true;
  if(!s.deaths)s.deaths=[];
  if(u.fireTrail?.length){eventTrigger(s,u,[{op:'blazeTrail',trail:u.fireTrail}]);u.fireTrail=[];}
  const geistwood=occupied(u).some(at=>s.board[at]&&sitePassives[card(s.board[at].card).slug]?.genesisAlsoDeath&&siteEffectAllowed(s,u,'modify',{card},s.board[at].card)),c=card(u.card);
  s.deaths.push({source:clone(u),effects:!disabled(u)?[...unitDefinitionLayers(s,u,ruleAPI(s)).death||[],...u.addedDeath||[],...(geistwood?[...unitDefinitionLayers(s,u,ruleAPI(s)).genesis||[],...(!u.silenced?[{op:'deathGenesisKeywords'}]:[])]:[])]:[]});
}
function pendingMovement(s,u){if(finalWaveMovementPending(s,u))return true;const ids=new Set([u.uid]);let carrier=u;while(carrier&&(carrier.carriedBy||carrier.swallowedBy)&&!ids.has(carrier.carriedBy||carrier.swallowedBy)){ids.add(carrier.carriedBy||carrier.swallowedBy);carrier=unit(s,carrier.carriedBy||carrier.swallowedBy);}return (s.storyline||[]).some(f=>['finalSiteMove','travelStep','fiftyPathStep','unitStep','dragStep','harpoonMove','thunderTeleport','randomTeleport','forcedFlyChoice','rapidsPush','marchStep','riptideGiant','frontierMove'].includes(f.step.op)&&(ids.has(f.step.uid)||ids.has(f.source.uid)&&!f.step.uid));}
function stateBased(s,settleRest=true) {
  // Setup and atomic Avatar replacements complete before this checkpoint.
  if(s.avatarSetupComplete&&s.winner===null){
    const absent=[0,1].filter(p=>!avatar(s,p));
    if(absent.length===1){s.winner=1-absent[0];s.phase='over';log(s,s.players[absent[0]].name+' 沒有 Avatar，敗北。');return;}
    if(absent.length===2){s.phase='blocked';s.unsupportedRule='simultaneous-avatar-loss';return;}
  }

  const teleported=new Set(s.units.filter(u=>u.carryTeleport).map(u=>u.uid)),flown=new Set(s.units.filter(u=>u.carryFlying).map(u=>u.uid));
  for(let i=0;i<s.units.length;i++)for(const u of s.units)if(u.carriedBy){if(teleported.has(u.carriedBy))teleported.add(u.uid);if(flown.has(u.carriedBy))flown.add(u.uid);}
  refreshContinuous(s);
  const geometryInvalid=geometryViolations(s,ruleAPI(s));
  for(const uid of geometryInvalid.banish){const u=unit(s,uid);if(u)kill(s,u,true,true);}
  for(const at of geometryInvalid.invalidSites)destroySite(s,at);
  let dreamDispelled=false;for(const aura of [...s.auras])if(!aura.disabled&&!aura.silenced&&areaAuras[card(aura.card).slug]?.completionMidsummer&&!s.units.some(u=>!u.dying&&unitTypes(u,s).includes('Faerie')&&catalogAuraHere(aura,u,inside))){removeObject(s,aura,'cemetery');dreamDispelled=true;}if(dreamDispelled)refreshContinuous(s);
  const entryCounts=s.board.map((site,at)=>site?s.units.filter(v=>!v.dying&&v.controller!==site.controller&&occupied(v).includes(at)&&geometryEntryRecords(s,v,v.observedPosition,v.justEntered,v.geometryEnteredLocations).some(loc=>loc.at===at)).length:0);
  for(const u of s.units){if(!u.justEntered&&u.observedTapped===false&&u.tapped&&card(u.card).type==='Minion')for(const a of s.artifacts||[])if(passives[card(a.card).slug]?.nearbyTapDraw&&occupied(u).some(at=>nearby(s,at,a.at))&&regionsOverlap(s,u,a))queueEffects(s,[{op:'drawOne',deck:'spells'}],a,1-u.controller);u.observedTapped=!!u.tapped;}
  for(const u of s.units){const entryOnly=!!u.geometryEnteredLocations?.length,priorSites=u.observedPosition?.cells||[u.observedPosition?.at],old=entryOnly?null:u.observedPosition,newEntry=u.justEntered,cells=occupied(u),newLocations=geometryEntryRecords(s,u,u.observedPosition,newEntry,u.geometryEnteredLocations),newCells=[...new Set(newLocations.map(loc=>loc.at))];delete u.geometryEnteredLocations;u.justEntered=false;u.observedPosition={at:u.at,layer:u.layer||'surface',cells,locations:geometryLocationRecords(u).map(loc=>({...loc})),region:region(s,u),regions:[...regionNames(s,u)]};if(entryOnly||newEntry||newLocations.length||old&&(old.at!==u.at||old.layer!==(u.layer||'surface'))||u.geometryMovementFrom&&(u.geometryMovementFrom.at!==u.at||u.geometryMovementFrom.layer!==(u.layer||'surface'))&&(!u.geometryMovementTo||u.geometryMovementTo.at===u.at&&u.geometryMovementTo.layer===(u.layer||'surface'))){
    for(const t of finalSharkTriggers(s,u,old,newEntry,ruleAPI(s)))eventTrigger(s,t.source,t.steps);
    const left=old?(old.cells||[old.at]).filter(at=>!cells.includes(at)):[];
    for(const entered of newLocations){const at=entered.at;const site=s.board[at],rule=site&&!site.silenced&&!site.disabled?passives[card(site.card).slug]:null;if(!rule)continue;if(rule.completionMortimer||rule.completionTroll||rule.completionSoldOut){if(!site.uid)site.uid='s'+s.next++;const src={...site,at,uid:site.uid,layer:entered.layer};if(rule.completionMortimer&&card(u.card).type==='Minion')eventTrigger(s,src,[{op:'completionMortimer',uid:u.uid}]);if(rule.completionTroll&&u.controller!==site.controller&&entryCounts[at]===1&&site.trollBridgeTurn!==s.turn){site.trollBridgeTurn=s.turn;eventTrigger(s,src,[{op:'completionTroll',uid:u.uid}]);}if(rule.completionSoldOut&&unitTypes(u,s).includes('Undead'))eventTrigger(s,src,[{op:'completionSoldOut',select:{kind:'unit',types:['Undead'],here:true,excludeUid:u.uid,anyRegion:true}}]);}}
    if(card(u.card).type==='Minion'&&!u.ward&&!disabled(u)&&!unitUmbrellas(u,s).includes('Evil'))for(const at of left){const site=s.board[at];if(site?.ward&&!site.silenced&&!site.disabled&&sitePassives[card(site.card).slug]?.departureWard&&siteEffectAllowed(s,u,'modify',{card},site.card)){site.ward=false;u.ward=true;break;}}
    for(const trigger of [...spatialMovementEvents(s,u,old,newEntry,newLocations,ruleAPI(s)),...spatialAmbushEvents(s,u,old,newEntry,newLocations,ruleAPI(s)),...(newEntry?spatialSummonEvents(s,u,ruleAPI(s)):[])])eventTrigger(s,trigger.source,trigger.steps);
    if(old&&!newEntry)for(const crossing of borderCrossings(s,u,old,teleported.has(u.uid),flown.has(u.uid),ruleAPI(s)))eventTrigger(s,crossing.a,[{op:'borderHit',uid:u.uid,amount:crossing.amount}]);
    for(const entered of newLocations){const at=entered.at;const site=s.board[at];if(!site||site.silenced||site.disabled||site.completionProtected||passives[card(site.card).slug]?.immutableSite||u.controller===site.controller)continue;for(const av of s.units)if(av.controller===site.controller&&!av.dying&&!av.silenced&&!disabled(av)&&passives[card(av.card).slug]?.completionDruidBack&&nearby(s,av.at,at))eventTrigger(s,{...site,at,uid:site.uid||'site:'+at,layer:entered.layer},[{op:'sitePassage',uid:u.uid,damage:1}]);}
    if(card(u.card).type==='Minion')for(const entered of newLocations){const at=entered.at;const site=s.board[at];if(site&&!site.silenced&&!site.darkAlleyUsed&&sitePassives[card(site.card).slug]?.firstEntryStealth){site.darkAlleyUsed=true;eventTrigger(s,u,[{op:'stealthSelf',abilityOrigin:site.card}]);}}
    if(old&&!newEntry)u.movedSinceStop=true;
    if(old&&!newEntry&&spatialHas(s,u,'tetherSite',ruleAPI(s))&&s.board[u.summonedAt]&&(old.cells||[old.at]).includes(u.summonedAt)&&!cells.includes(u.summonedAt))kill(s,u);
    for(const passage of [...left.map(at=>({at,layer:old?.layer||'surface',entered:false})),...newLocations.map(loc=>({...loc,entered:true}))]){const at=passage.at,site=s.board[at],d=site&&!site.silenced&&!site.disabled?passives[card(site.card).slug]:null;if(!d)continue;const entered=passage.entered;if(d.entryExitEnemyDamage&&u.controller!==site.controller||entered&&d.entryKillGroundMinion&&card(u.card).type==='Minion'&&!keywords(u).includes('Airborne'))eventTrigger(s,{...site,at,uid:'site:'+at,layer:passage.layer},[{op:'sitePassage',uid:u.uid,damage:d.entryExitEnemyDamage&&u.controller!==site.controller?d.entryExitEnemyDamage:0,destroy:!!(entered&&d.entryKillGroundMinion&&card(u.card).type==='Minion'&&!keywords(u).includes('Airborne'))}]);}
    if(old&&!u.inBasicTravel&&u.mods.some(m=>m.blaze)){const departed=(old.cells||[old.at]).filter(at=>old.layer!==(u.layer||'surface')||!cells.includes(at));if(departed.length)queueEffects(s,[{op:'blazeTrail',trail:departed.map(at=>({at,layer:old.layer}))}],u,u.controller,card('blaze').id);}
    if(card(u.card).type==='Minion')for(const a of s.auras||[])if(catalogAuraActive(a,disabled)&&areaAuras[card(a.card).slug]?.entryCurse&&newCells.some(at=>(newEntry||!priorSites.includes(at))&&waterSite(s,at,card)&&inside(a,at)))queueEffects(s,[{op:'curseEnter',uid:u.uid,at:u.at,aura:a.uid}],a,a.controller);
  }}
  for(const u of s.units)delete u.geometryMovementFrom;
  for(const a of s.artifacts||[])if(passives[card(a.card).slug]?.sunkenTreasure&&a.bearer&&a.layer==='surface'&&!a.surfacePending){a.surfacePending=true;const bearer=unit(s,a.bearer);queueEffects(s,[{op:'treasureSurface',uid:a.uid}],bearer,bearer.controller,a.card);}
  for(const u of [...s.units])if(card(u.card).type!=='Avatar'&&!u.dying){
    if(u.apostlesSource&&!unit(s,u.apostlesSource)||u.apostlesSource&&unit(s,u.apostlesSource)?.dying){kill(s,u,true,true);continue;}
    if(card(u.card).type==='Minion'&&(u.layer||'surface')==='surface'&&['Spirit','Undead'].some(t=>unitTypes(u,s).includes(t))&&!waterSite(s,u.at,card))for(const a of s.auras)if(catalogAuraActive(a,disabled)&&areaAuras[card(a.card).slug]?.fiftyBurrowDead&&inside(a,u.at)&&fiftyForceAllowed(s,u,a.controller,ruleAPI(s))){u.layer='below';u.notRest=true;u.burrowedSafely=true;}
    if(!u.entryProcessed){u.entryProcessed=true;if(!disabled(u))for(const ability of unitPassiveLayerViews(s,u,ruleAPI(s),'entryLances'))for(let i=0;i<(ability.value||0);i++)acquireLance(s,u,u.controller);}
    const r=region(s,u),k=keywords(u),unsafe=!u.swallowedBy&&!unitOccupancySafe(s,u,ruleAPI(s));
    const ash=geometryLocationRecords(u).some(loc=>loc.layer==='below'&&s.board[loc.at]&&s.board.some((v,at)=>v&&!v.silenced&&!v.disabled&&sitePassives[card(v.card).slug]?.killBelowNearby&&siteEffectAllowed(s,u,'destroy',{card},v.card)&&nearby(s,at,loc.at)));
    if(!u.swallowedBy&&!u.geometrySafetyEverywhere&&geometryLocationRecords(u).some(loc=>geometryIsVoidCell(s,loc.at,card))&&!k.includes('Voidwalk'))kill(s,u,true,true);
    else if(unsafe||ash||(u.damage>0&&u.damage>=power(u,true))||u.lethal){kill(s,u,false,true);if(u.dying&&unsafe&&r==='underwater'&&!k.includes('Submerge'))for(const [at,site] of s.board.entries())if(site&&site.controller!==u.controller&&!site.silenced&&!site.disabled&&passives[card(site.card).slug]?.completionWatery&&nearby(s,at,u.at))eventTrigger(s,{...site,at,uid:site.uid||'site:'+at,layer:'surface'},[{op:'armySkeleton',at:u.at,layer:'surface'}]);}
  }
  for(const u of s.units)if(!u.dying&&combatHas(s,u,'nineLives',ruleAPI(s))&&(regionNames(s,u).has('underground')&&!keywords(u).includes('Burrowing')||regionNames(s,u).has('underwater')&&!keywords(u).includes('Submerge'))&&!(s.storyline||[]).some(f=>f.step.op==='remainingCatCheck'&&f.source.uid===u.uid))queueEffects(s,[{op:'remainingCatCheck'}],u,u.controller);
  for(const [at,site] of s.board.entries())if(site&&!site.silenced&&!site.disabled&&passives[card(site.card).slug]?.completionVaults&&!site.vaultsLooted){const visitors=s.units.filter(u=>!u.dying&&u.movedSinceStop&&!pendingMovement(s,u)&&occupied(u).includes(at)&&card(u.card).type==='Avatar');if(visitors.length){site.vaultsLooted=true;for(const u of visitors)eventTrigger(s,{...site,at,uid:site.uid||'site:'+at},[{op:'completionVaults',uid:u.uid}]);}}
  for(const u of s.units)if(u.movedSinceStop&&!pendingMovement(s,u)){u.movedSinceStop=false;if(!u.dying)for(const trigger of combatTriggers(s,u,'damageOnStop',ruleAPI(s),layer=>[{op:'stopDamage',amount:layer.value,optional:true}]))eventTrigger(s,trigger.source,trigger.steps);}
  for(const item of s.artifacts||[]){const old=item.observedPosition;if(old&&(old.at!==item.at||old.layer!==(item.layer||'surface')))item.movedSinceStop=true;const controller=artifactController(s,item);if(old&&(old.at!==item.at||old.layer!==(item.layer||'surface'))&&item.carryTeleport&&passives[card(item.card).slug]?.fiftySentinel){delete item.carryTeleport;queueEffects(s,[{op:'fiftyFacing'}],item,s.eventContext?.controller??controller??item.owner,item.card);}item.observedPosition={at:item.at,layer:item.layer||'surface',controller:controller??old?.controller};if(item.movedSinceStop&&!pendingMovement(s,item.bearer?unit(s,item.bearer)||item:item)){item.movedSinceStop=false;if(!item.silenced&&passives[card(item.card).slug]?.newSiteStopLife&&s.board[item.at]){const site=s.board[item.at];if(!site.uid)site.uid='s'+s.next++;if(!(item.visitedSites||[]).includes(site.uid)){(item.visitedSites||(item.visitedSites=[])).push(site.uid);const player=controller??old?.controller;if(player===0||player===1)queueEffects(s,[{op:'flameStopLife'}],item,player);}}}}
  if(s.deaths?.length){
    const deaths=s.deaths.splice(0);
    queueEffects(s,[{op:'buryMany',uids:deaths.map(d=>d.source.uid)}],deaths[0].source,deaths[0].source.controller);
    for(const d of deaths.reverse())queueEffects(s,finalUnitOrderDeathEffects(d.effects),d.source,d.source.controller,d.source.card,{fresh:true});
  }
  if(s.eventContext){const e=s.eventContext;for(const [uid,n] of Object.entries(e.fiftyBarricades||{})){if(n>=3){const o=s.artifacts.find(o=>o.uid===uid);if(o)removeObject(s,o,'cemetery');}}e.fiftyBarricades={};for(const entry of e.survivors.splice(0)){const u=unit(s,entry.target);if(u&&!u.dying)e.triggers.push({source:entry.source,controller:entry.source.controller,steps:[{op:'healSurvivor',uid:u.uid,...(entry.source.abilityOrigin?{abilityOrigin:entry.source.abilityOrigin}:{}),...(entry.instance?{abilityInstance:entry.instance}:{})}]});}for(const event of e.triggers.splice(0).reverse())queueEffects(s,event.steps,event.source,event.controller,event.source.card,{fresh:true});}
  checkFinalThroneVictory(s,ruleAPI(s));
  observeFinalInquisition(s,ruleAPI(s));
  // Apply passives and unsafe-location consequences before units return to rest.
  if(settleRest&&!s.storyline?.length&&!s.choice&&!s.pending&&s.units.some(u=>u.notRest)){for(const u of s.units)u.notRest=false;stateBased(s,false);}
}
export function reachable(s,u) {
  return new Map(locations(s,u,card,keywords).filter(n=>n.layer===(u.layer||'surface')).map(n=>[n.at,n.path.map(v=>v.at)]));
}
function leaveUnit(s,u,destination,ruleChange=false) {
  artifactAnimationLeaves(s,u);
  if(!ruleChange&&!u.dying&&!siteEffectAllowed(s,u,destination==='banished'?'banish':'modify',{card}))return;
  animationLeaves(s,u);
  if(u.dying&&u.banishOnDeath)destination='banished';
  for(const passenger of passengers(s,u))dropPassenger(passenger);dropPassenger(u);
  for(const h of s.boundSpells||[])if(h.unit===u.uid){if(h.returnToHand)s.players[h.owner].hand.push({uid:'h'+s.next++,card:h.card});else sendCard(s,h.owner,h.card,'cemetery');}
  s.boundSpells=(s.boundSpells||[]).filter(h=>h.unit!==u.uid);
  for(const v of s.units)if(v.swallowedBy===u.uid){v.swallowedBy=null;v.bellyDisabled=false;}
  if(u.originalCard)u.card=u.originalCard;
  const c=card(u.card);let zone=c.category==='Token'||u.tokenCopy?'banished':destination;
  if(u.babelParts&&zone!=='resummon')sendBuiltSite(s,u,zone,sacrificeSiteAPI(s,u));
  else if(zone==='hand')s.players[u.owner].hand.push({uid:'h'+s.next++,card:u.card});
  else if(zone!=='resummon'){const deathTurn=u.dying?(s.deathHistory||[]).find(d=>d.uid===u.uid)?.turn??null:null;if(!deferSacrificeCemetery(s,u,{owner:u.owner,card:u.card,zone,deathTurn}))zone=sendCard(s,u.owner,u.card,zone,deathTurn);}
  s.units=s.units.filter(v=>v.uid!==u.uid);
  for(const a of s.artifacts||[])if(a.bearer===u.uid){a.bearer=null;delete a.carriedPosition;}
  log(s,c.name+' → '+zone);
}
function sendCard(s,p,id,zone,deathTurn=null){
  if(zone==='cemetery')for(const site of s.board)if(site?.controller===0||site?.controller===1){const d=passives[card(site.card).slug]?.cemeteryBanishThreshold;if(d&&resources(s,site.controller)[d.element]>=d.amount){zone='banished';break;}}
  if(zone==='cemetery')appendGrave(s,p,id,deathTurn);else s.players[p][zone].push(id);
  return zone;
}
function queueGraveReturns(s,p,slug,at,extra={}){
  for(const entry of yourGraves(s,p))for(const ability of offRealmPrintedSources(cardForPlayer(s,entry.card,p),slug,ruleAPI(s))){
    const source={uid:entry.uid,card:entry.card,controller:p,owner:entry.player,at,layer:extra.layer||'surface',abilityOrigin:ability.origin,...(ability.instance?{abilityInstance:ability.instance}:{})},steps=[{op:'graveRecur',gravePlayer:entry.player,graveUid:entry.uid,at,layer:extra.layer,tapped:!!extra.tapped}];
    if(extra.event)eventTrigger(s,source,steps);else queueEffects(s,steps,source,p);
  }
}
const transportAPI={definitions,printedKeywords,passives,card,power,keywords,disabled,canTarget,unitTypes};
function unmodifiable(u){return !!u.gainedModificationGuard||intrinsicModificationLocked(u,{card,passives});}
function terrainEffectHits(s,e,u){return siteEffectAllowed(s,u,'modify',{card},e.abilityOrigin)&&(!e.minion||card(u.card).type==='Minion')&&geometryLocationRecords(u).some(loc=>s.board[loc.at]&&(e.allLayers||loc.layer==='surface')&&(e.nearby?nearby(s,e.at,loc.at):e.at===loc.at));}
function archiveApplyingEffects(s,units){return (s.ongoingEffects||[]).filter(e=>['fiftyOnslaught','shieldWall','nightAttack','terrainEffect'].includes(e.op)).map(effect=>({effect:clone(effect),targets:units.filter(u=>{const e=effect;if(!finalArchiveEffectApplies(e,u))return false;if(e.op==='terrainEffect')return e.op==='terrainEffect'&&terrainEffectHits(s,e,u);return e.controller===u.controller&&(e.op!=='fiftyOnslaught'||e.end===s.turn);}).map(u=>u.uid)})).filter(record=>record.targets.length);}
function refreshContinuous(s) {
  restoreModificationEffects(s);
  for(const u of s.units)commitGeometryLocations(u,card);
  const geometryWorldChanged=refreshGlobeWorld(s,ruleAPI(s),(key,p,options,title,source)=>chooseGeometryReplacement(s,key,p,options,title,source));
  restoreAnimations(s,ruleAPI(s));
  restoreArtifactAnimations(s,ruleAPI(s));
  refreshArtifactAnimations(s,ruleAPI(s),factoryAnimationClaims(s,ruleAPI(s)));
  prepareFinalArtifacts(s,ruleAPI(s));
  restoreRemainingControl(s);
  prepareModificationProtection(s,ruleAPI(s));
  refreshCompletionTerrain(s,ruleAPI(s));
  for(const u of s.units)u.gainedCannotDisable=unitPassiveLayerViews(s,u,ruleAPI(s),'cannotDisable').some(l=>l.nature==='gained'&&l.value);
  for(const u of s.units)u.gainedCannotImmobilize=unitPassiveLayerViews(s,u,ruleAPI(s),'cannotImmobilize').some(l=>l.nature==='gained'&&l.value);
  prepareModificationProtection(s,ruleAPI(s));
  syncHollowWakeLifetimes(s,ruleAPI(s));
  movePassengers(s,ruleTransportAPI(s));
  for(const u of s.units)if(u.swallowedBy){const frog=unit(s,u.swallowedBy);if(!frog||u.observedPosition&&(u.at!==u.observedPosition.at||(u.layer||'surface')!==u.observedPosition.layer)){u.swallowedBy=null;u.bellyDisabled=false;}else{u.at=frog.at;u.layer=frog.layer||'surface';u.bellyDisabled=true;}}
  // Apply an Aura's ongoing silence from its state before that effect is
  // applied. Animated Silence removes its own ability, but cannot retract an
  // effect already applying (official Layer Codex / Enchantress FAQ).
  const baseSilence=new Map(s.units.map(u=>[u.uid,!!u.finalTabula||!unmodifiable(u)&&(u.completionBower||u.mods.some(m=>m.silenced))||(s.ongoingEffects||[]).some(e=>finalArchiveEffectApplies(e,u)&&e.op==='terrainEffect'&&terrainEffectHits(s,e,u)&&e.silenced)]));
  const silenceSources=(s.auras||[]).filter(a=>areaAuras[card(a.card).slug]?.silence&&catalogAuraActive(baseSilence.has(a.uid)?{...a,silenced:baseSilence.get(a.uid)}:a,disabled));
  for(const u of s.units){
    // Migrate the old, incorrect permanent Stealth prohibition. The official
    // card FAQ removes the mark; it does not forbid a future Stealth grant.
    u.mods=u.mods.filter(m=>!m.loseStealth&&(!m.whileVoid||occupied(u).every(at=>geometryIsVoidCell(s,at,card))));u.fiftyOnslaught=(s.ongoingEffects||[]).some(e=>finalArchiveEffectApplies(e,u)&&e.op==='fiftyOnslaught'&&e.controller===u.controller&&e.end===s.turn);u.restraintDisabled=!!u.boundSpellcaster||!!u.cocoon||u.iceTurns>0;u.iceMagicProtection=false;
    const terrain=(s.ongoingEffects||[]).filter(e=>finalArchiveEffectApplies(e,u)&&e.op==='terrainEffect'&&terrainEffectHits(s,e,u));u.effectDisabled=terrain.some(e=>e.disabled)||unitTypes(u,s).includes('Mortal')&&s.auras.some(a=>catalogAuraActive(a,disabled)&&areaAuras[card(a.card).slug]?.completionMidsummer&&catalogAuraHere(a,u,inside));
    u.silenced=baseSilence.get(u.uid)||!unmodifiable(u)&&card(u.card).type==='Minion'&&silenceSources.some(a=>catalogAuraAffectedSite(s,a,u,inside));u.ongoingPower=0;u.grantedTypes=[...(s.artifacts||[]).filter(a=>a.bearer===u.uid&&!a.silenced).flatMap(a=>!passives[card(a.card).slug]?.bearerMinion||card(u.card).type==='Minion'?passives[card(a.card).slug]?.bearerTypes||[]:[]),...pallidPrintedTypes(s,u,ruleAPI(s))].filter(t=>!u.completionBower||t!=='Mortal');u.grantedKeywords=gainedKeywordsForUnit(s,u,ruleAPI(s));u.grantedMovement=abilityMovementAdjustment(s,u,ruleAPI(s));u.grantedRange=unitGainedRange(s,u,ruleAPI(s));u.spellElements=[];u.deniedKeywords=[];u.zeroPower=false;u.magicProtected=false;u.whaleArmor=false;u.canSeeStealth=false;u.magicDamageProtected=false;u.projectileOver=false;u.verticalWrap=false;u.moveAxis=null;
    u.silenced=u.silenced||terrain.some(e=>e.silenced);u.grantedKeywords.push(...terrain.flatMap(e=>e.keyword?[e.keyword]:[]));
    if(u.fiftyOnslaught)u.silenced=false;u.powerSuppressed=false;u.rangeBonus=0;u.lethalImmune=false;u.unrestrictedCaster=false;
    if(s.board[u.at])u.gateVoidwalk=false;if(u.gateVoidwalk&&siteEffectAllowed(s,u,'modify',{card},card('planar_gate').id))u.grantedKeywords.push('Voidwalk');
    if(!disabled(u)&&unitPassiveLayerViews(s,u,ruleAPI(s),'towerLich').some(l=>l.value)&&(u.layer||'surface')==='surface'&&s.board[u.at]&&towerSites.has(card(s.board[u.at].card).slug)){u.ongoingPower+=2*unitPassiveLayerViews(s,u,ruleAPI(s),'towerLich').filter(l=>l.value).length;u.grantedKeywords.push('Ranged','Spellcaster');u.unrestrictedCaster=true;}
    if(!disabled(u))for(const {passive:p} of unitPassiveLayerViews(s,u,ruleAPI(s))){
      if(p?.artifactSpellcaster){u.grantedKeywords.push('Spellcaster');if(!p.excludeCastElements)u.unrestrictedCaster=true;}
      if(p?.nonOrdinaryCaster){u.grantedKeywords.push('Spellcaster');u.unrestrictedCaster=true;}if(p?.cemeteryPower)u.ongoingPower+=cemeteryCards(s,u.controller,ruleAPI(s)).filter(id=>card(id).subtypes.includes(p.cemeteryPower)).length;
      if(p?.cemeterySame)u.ongoingPower+=cemeteryCards(s,u.controller,ruleAPI(s)).filter(id=>id===u.card).length;
      if(p?.nearEarthPower)u.ongoingPower+=s.board.filter((v,at)=>v&&card(v.card).earth>0&&nearby(s,at,u.at)).length;
    }
  }
  for(const u of s.units){if(u.fiftyOnslaught){u.silenced=false;u.ongoingPower++;u.grantedKeywords.push('Charge');u.deniedKeywords.push('Immobile');}if(!disabled(u))for(const layer of unitPassiveLayerViews(s,u,ruleAPI(s),'adjacentSitesPower'))if(layer.value)u.ongoingPower+=s.board.filter((site,at)=>site&&distance(s,at,u.at)===1).length;}
  for(const a of s.auras)if(!a.disabled&&!a.silenced&&areaAuras[card(a.card).slug]?.completionMidsummer){const mortals=s.units.filter(u=>!u.dying&&unitTypes(u,s).includes('Mortal')&&catalogAuraHere(a,u,inside)).length;for(const u of s.units)if(!u.dying&&unitTypes(u,s).includes('Faerie')&&catalogAuraHere(a,u,inside))u.ongoingPower+=mortals;}
  const agartha=s.board.some(site=>site&&!site.silenced&&!site.disabled&&sitePassives[card(site.card).slug]?.allBurrowingThreshold&&resources(s,site.controller).earth>=3);if(agartha)for(const u of s.units)if(card(u.card).type==='Minion'&&s.board.some(site=>site&&!site.silenced&&!site.disabled&&sitePassives[card(site.card).slug]?.allBurrowingThreshold&&siteEffectAllowed(s,u,'modify',{card},site.card)))u.grantedKeywords.push('Burrowing');
  const removers=s.units.filter(u=>!u.dying).flatMap(u=>unitPassiveLayerViews(s,u,ruleAPI(s)).filter(l=>l.passive.restBasilisk||l.passive.restAdjacent||l.passive.silenceOtherNearby||l.passive.disableAbove)).sort((a,b)=>(a.source.abilityStamp||0)-(b.source.abilityStamp||0));
  for(const entry of removers){const source=unit(s,entry.source.uid);if(!source||source.dying||disabled(source))continue;const active=unitPassiveLayerViews(s,source,ruleAPI(s)).find(l=>l.instance===entry.instance&&l.origin===entry.origin);if(!active)continue;const d=active.passive;for(const u of s.units)if(u.uid!==source.uid&&card(u.card).type==='Minion'){
    if(d.disableAbove&&source.layer==='below'&&(u.layer||'surface')==='surface'&&occupied(u).some(at=>occupied(source).includes(at)))u.effectDisabled=true;
    if(!regionsOverlap(s,u,source))continue;
    if(d.restBasilisk&&!u.notRest&&occupied(u).some(at=>at===source.at||at===source.at+(source.controller===0?-5:5)))u.effectDisabled=true;
    if(d.restAdjacent&&!u.notRest&&occupied(u).some(at=>occupied(source).some(root=>distance(s,at,root)===1)))u.effectDisabled=true;
    if(!u.fiftyOnslaught&&d.silenceOtherNearby&&occupied(u).some(at=>occupied(source).some(root=>nearby(s,root,at))))u.silenced=true;
  }}
  for(const u of s.units){u.restraintDisabled=!!u.boundSpellcaster||!!u.cocoon||u.iceTurns>0||unitPassiveLayerViews(s,u,ruleAPI(s),'shackled').some(l=>l.value)&&!u.shacklesReleased;u.iceMagicProtection=u.iceTurns>0;}
  for(const u of s.units)if(u.fiftyOnslaught)u.silenced=false;
  for(const u of s.units){if(u.kingApplied){if(u.controller!==u.kingController)u.nativeController=u.controller;u.controller=u.nativeController;u.kingApplied=false;}}
  const kings=s.units.filter(u=>!u.dying&&!disabled(u)).flatMap(source=>unitPassiveLayerViews(s,source,ruleAPI(s)).filter(l=>l.passive.mortalKing||l.passive.undeadKing).map(l=>({source,passive:l.passive,instance:l.instance,stamp:l.source.abilityStamp||0}))).sort((a,b)=>a.stamp-b.stamp);
  s.boundControls=(s.boundControls||[]).filter(e=>unit(s,e.target)&&(!e.source||unit(s,e.source))&&(!e.untilStealth||unit(s,e.target).stealth));
  const controls=[...kings.map(k=>({kind:'king',...k})),...s.boundControls.map(e=>({...e,kind:'bound'}))].sort((a,b)=>a.stamp-b.stamp);
  for(const e of controls){const targets=e.kind==='king'?s.units.filter(u=>!unmodifiable(u)&&unitTypes(u,s).includes(e.passive.undeadKing?'Undead':'Mortal')):[unit(s,e.target)];for(const u of targets){if(!u.kingApplied)u.nativeController=u.controller;u.controller=e.kind==='king'?e.source.controller:e.controller;u.kingApplied=true;u.kingController=u.controller;}}
  for(const k of kings)for(const u of s.units)if(u.uid!==k.source.uid&&!unmodifiable(u)&&unitTypes(u,s).includes(k.passive.undeadKing?'Undead':'Mortal'))u.ongoingPower++;
  for(const a of s.artifacts||[]){
    let u=unit(s,a.bearer);const d=equipment[card(a.card).slug];if(u)followCarriedPosition(s,a,u,{card});else delete a.carriedPosition;u=unit(s,a.bearer);a.controller=artifactController(s,a);
    const passive=passives[card(a.card).slug];if(passive?.disableTypesHere&&!a.silenced&&!a.disabled)for(const target of s.units)if(card(target.card).type==='Minion'&&unitTypes(target,s).some(t=>passive.disableTypesHere.includes(t))&&sameLocation(s,target,a))target.effectDisabled=true;
    if(u&&!u.fiftyOnslaught&&passive?.bearerSilenced&&!a.silenced&&!a.disabled)u.silenced=true;
    if(u&&passive?.bearerDisabled&&!a.silenced&&!a.disabled)u.effectDisabled=true;
    if(u&&!a.silenced&&!a.disabled){
      u.ongoingPower+=passive?.bearerPower||0;
      if(passive?.whaleArmor)u.whaleArmor=true;
      if(passive?.bearerRanged)u.grantedKeywords.push('Ranged');
      if(passive?.bearerTruesight)u.canSeeStealth=true;
      if(passive?.bearerSpellcaster)u.grantedKeywords.push('Spellcaster');
      if(passive?.heldMagicPower&&a.magicCasts?.[u.uid]?.turn===s.turn)u.ongoingPower+=a.magicCasts[u.uid].count;
      if(passive?.elementalSword)u.ongoingPower+=elements.filter(e=>abilityUnitHasElement(s,u,e,ruleAPI(s))).length;
      if(passive?.killerPower&&(s.deathHistory||[]).some(d=>d.killers.some(k=>k.uid===u.uid)))u.ongoingPower+=passive.killerPower;
    }
    if(!u||!d||a.silenced||a.disabled)continue;
    if(d.minion&&card(u.card).type!=='Minion')continue;
    u.ongoingPower+=d.power||0;u.grantedKeywords.push(...d.keywords||[]);u.grantedMovement+=d.movement||0;u.grantedRange=Math.max(u.grantedRange,d.range||0);
    if(d.spellElement){u.grantedKeywords.push('Spellcaster');u.spellElements.push(d.spellElement);}
    if(d.magicProtected)u.magicProtected=true;
  }
  refreshFinalSaint(s,ruleAPI(s));
  for(const u of s.units)for(const at of new Set(geometryLocationRecords(u).map(loc=>loc.at))){const site=s.board[at],d=site&&!site.silenced&&!site.disabled?sitePassives[card(site.card).slug]:null;if(!d||!siteEffectAllowed(s,u,'modify',{card},site.card))continue;const above=geometryLocationRecords(u).some(loc=>loc.at===at&&loc.layer==='surface'),evil=unitUmbrellas(u,s,site?.controller??null).includes('Evil');if(d.minionKeywords&&card(u.card).type==='Minion'){u.grantedKeywords.push(...d.minionKeywords);if(d.minionKeywords.includes('Spellcaster'))u.unrestrictedCaster=true;}if(above&&d.rangedBonus)u.rangeBonus+=d.rangedBonus;if(evil){if(d.evilZero)u.powerSuppressed=true;u.ongoingPower+=d.evilPower||0;}}
  for(const e of s.ongoingEffects||[])if(e.op==='witchingHour')for(const u of s.units)if(u.controller===e.controller&&(unitUmbrellas(u,s,e.controller).includes('Evil')||unitTypes(u,s).includes('Spirit')||keywords(u).includes('Spellcaster'))){u.ongoingPower++;u.grantedKeywords.push('Airborne');}
  for(const a of s.auras||[]){const d=areaAuras[card(a.card).slug];if(!d||!catalogAuraActive(a,disabled))continue;for(const u of s.units)if(catalogAuraAffectedSite(s,a,u,inside)&&card(u.card).type==='Minion'){
    u.grantedKeywords.push(...d.keywords||[]);u.deniedKeywords.push(...d.deny||[]);
    if(d.power&&u.controller===a.controller&&matches({...card(u.card),subtypes:unitTypes(u,s)},d,unitUmbrellas(u,s,a.controller)))u.ongoingPower+=d.power;
  }}
  for(const a of s.artifacts||[])if(passives[card(a.card).slug]?.nearbyMinionCharge)for(const u of s.units)if(card(u.card).type==='Minion'&&nearby(s,a.at,u.at)&&regionsOverlap(s,a,u))u.grantedKeywords.push('Charge');
  for(const a of s.artifacts||[]){const d=passives[card(a.card).slug],controller=artifactController(s,a),bearer=unit(s,a.bearer);if(controller!==0&&controller!==1)continue;
    const banner=d?.uncontestedAlliesPower&&!s.units.some(u=>!u.dying&&u.controller!==controller&&sameLocation(s,u,a));
    const torch=d?.ordinaryBearerAura&&bearer&&!bearer.dying&&!disabled(bearer)&&(card(bearer.card).rarity||card(bearer.card).slot)==='Ordinary';
    if(banner||torch)for(const u of s.units)if(u.controller===controller&&occupied(u).some(at=>nearby(s,at,a.at))&&regionsOverlap(s,u,a)&&(!torch||(card(u.card).rarity||card(u.card).slot)==='Ordinary'))u.ongoingPower+=banner?d.uncontestedAlliesPower:d.ordinaryBearerAura;
  }
  for(const [at,site] of s.board.entries())if(site&&sitePassives[card(site.card).slug]?.siteRevealNearby){const previous=new Set(site.permanentRevealContacts||[]),current=[];if(!site.silenced&&!site.disabled)for(const u of s.units)if(u.controller!==site.controller&&siteEffectAllowed(s,u,'modify',{card},site.card)&&(u.layer||'surface')==='surface'&&occupied(u).some(i=>s.board[i]&&nearby(s,i,at))){if(!previous.has(u.uid))u.stealth=false;current.push(u.uid);}site.permanentRevealContacts=current;}
  for(const u of s.units)if(card(u.card).type==='Minion'&&s.board.some((site,at)=>site&&unitUmbrellas(u,s,site.controller).includes('Evil')&&sitePassives[card(site.card).slug]?.nearbyEvilBurrowing&&siteEffectAllowed(s,u,'modify',{card},site.card)&&occupied(u).some(i=>nearby(s,at,i))))u.grantedKeywords.push('Burrowing');
  for(const u of s.units)if(card(u.card).type==='Minion'&&(u.layer||'surface')==='surface'&&occupied(u).some(at=>s.board[at]&&s.board.some((site,i)=>site&&sitePassives[card(site.card).slug]?.nearbySurfaceDenyCharge&&siteEffectAllowed(s,u,'modify',{card},site.card)&&nearby(s,at,i))))u.deniedKeywords.push('Charge');
  for(const u of s.units){const k=[...(u.silenced?[]:printedKeywords(card(u.card))),...u.grantedKeywords,...u.mods.flatMap(m=>m.keyword?[m.keyword]:[])];u.boundDisabled=k.includes('Waterbound')&&!waterSite(s,u.at,card)||k.includes('Landbound')&&(!s.board[u.at]||waterSite(s,u.at,card));if(disabled(u)){u.ward=false;u.stealth=false;}}
  // Layer Codex: apply Spellcaster grants before testing a conditional
  // disable. Probe only that condition; Freeze, restraint, sleep and other
  // independent disabling effects must still suppress a potential provider.
  const conditionAPI=ruleAPI(s),conditionRows=new Map(s.units.map(u=>{const layers=unitPassiveLayerViews(s,{...u,conditionDisabled:false},conditionAPI);return [u.uid,{layers,asleep:layers.some(({passive:p,instance,nature})=>!!p.wakeFromNearbyDeath&&!(u.awakenedByDeathSources?.[instance]||nature==='printed'&&u.awakenedByDeath))}];}));
  const conditionalSpellcaster=v=>{const probe={...v,conditionDisabled:conditionRows.get(v.uid)?.asleep||false};return !disabled(probe)&&casterPermissionViews(s,probe,conditionAPI).length>0;};
  for(const u of s.units){
    const {layers:ownLayers,asleep}=conditionRows.get(u.uid);
    u.conditionDisabled=asleep||ownLayers.some(({passive:p})=>!!p.needsSpellcaster&&!s.units.some(v=>v.controller===u.controller&&!v.dying&&occupied(v).some(at=>occupied(u).some(here=>distance(s,at,here)<=1))&&regionsOverlap(s,v,u)&&conditionalSpellcaster(v)));
    if(u.conditionDisabled){u.ward=false;u.stealth=false;}
    if(disabled(u))continue;
    for(const {passive:p} of ownLayers){
    if(u.ward){u.ongoingPower+=p.wardedPower||0;u.grantedKeywords.push(...p.wardedKeywords||[]);}
    if(p.realmWardPower)u.ongoingPower+=p.realmWardPower*(s.units.filter(v=>v.ward).length+s.board.filter(v=>v?.ward).length);
    if(p.zeroUnless){const matches=s.units.some(v=>v.uid!==u.uid&&v.controller===u.controller&&distance(s,v.at,u.at)===1&&regionsOverlap(s,v,u)&&(p.zeroUnless==='evil'?unitUmbrellas(v,s,u.controller).includes('Evil'):v.ward))||(p.zeroUnless==='ward'&&s.board.some((v,at)=>v?.controller===u.controller&&v.ward&&distance(s,at,u.at)===1));u.zeroPower=u.zeroPower||!matches;}
    if(p.nearbySamePower){const name=p.countsAs||card(u.card).slug;u.ongoingPower+=s.units.filter(v=>v.uid!==u.uid&&(card(v.card).slug===name||!disabled(v)&&unitPassiveLayerViews(s,v,ruleAPI(s),'countsAs').some(l=>l.value===name))&&nearby(s,v.at,u.at)&&regionsOverlap(s,v,u)).length;}if(p.companionPower&&u.companion){const other=unit(s,u.companion);if(other&&!other.dying&&distance(s,u.at,other.at)===1&&regionsOverlap(s,u,other)){u.ongoingPower+=p.companionPower;other.ongoingPower+=p.companionPower;}}
    if(p.lostLifePower&&s.players[u.controller].lostLifeTurn===s.turn)u.ongoingPower+=p.lostLifePower;
    if(p.chargeIfDead){if(s.players.some(pl=>pl.cemetery.some(id=>card(id).slug===p.chargeIfDead)))u.grantedKeywords.push('Charge');else u.deniedKeywords.push('Charge');}
    if(p.spellElement){u.grantedKeywords.push('Spellcaster');u.spellElements.push(p.spellElement);}
    if(p.spellElements){u.grantedKeywords.push('Spellcaster');u.spellElements.push(...p.spellElements);}
    if(p.rowVoidPower)u.ongoingPower+=s.board.filter((v,at)=>geometryIsVoidCell(s,at,card)&&Math.floor(at/5)===Math.floor(u.at/5)).length;
    if(p.waterBodyPower)u.ongoingPower+=bodyOfWater(s,u.at,card).size*p.waterBodyPower;
    if(p.enemyTurnPower&&s.active!==u.controller)u.ongoingPower+=p.enemyTurnPower;
    if(p.avengePreviousTurn&&(s.deathHistory||[]).some(d=>d.controller===u.controller&&d.turn===s.turn-(s.active===u.controller?1:2)))u.grantedKeywords.push('Charge','Lethal');
    if(p.backRowNoRoyalty&&inBackRow(u.at,u.controller)&&!s.units.some(v=>!v.dying&&unitUmbrellas(v,s).includes('Royalty')&&regionsOverlap(s,v,u)&&occupied(v).some(at=>nearby(s,at,u.at))))u.ongoingPower+=p.backRowNoRoyalty;
    if(p.uniqueVanguard){const forward=at=>u.controller===0?3-Math.floor(at/5):Math.floor(at/5),mine=Math.max(...occupied(u).map(forward));if(!s.units.some(v=>v.uid!==u.uid&&!v.dying&&v.controller===u.controller&&Math.max(...occupied(v).map(forward))>=mine))u.ongoingPower+=p.uniqueVanguard;}
    if(p.moveAxis)u.moveAxis=!u.moveAxis||u.moveAxis===p.moveAxis?p.moveAxis:'none';
    if(p.verticalWrap)u.verticalWrap=true;
    if(p.magicProtected)u.magicProtected=true;
    if(p.projectileOver)u.projectileOver=true;
    }
  }
  for(const source of s.units){
    const layers=disabled(source)?[]:unitPassiveLayerViews(s,source,ruleAPI(s)),memories=source.permanentRevealByAbility||{},allContacts=new Set();
    for(const layer of layers){const p=layer.passive,previousReveal=new Set(memories[layer.instance]||(layer.nature==='printed'?source.permanentRevealContacts||[]:[])),currentReveal=[];for(const u of s.units){
    if(p.realmVerticalWrap&&u.controller===source.controller)u.verticalWrap=true;
    if(p.edgeAlliesPower&&u.uid!==source.uid&&u.controller===source.controller&&occupied(u).some(at=>s.board[at]&&(Math.floor(at/5)===0||Math.floor(at/5)===3)))u.ongoingPower+=p.edgeAlliesPower;
    if(!source.dying&&u.controller!==source.controller&&(p.permanentRevealAllEnemies||p.permanentRevealNearby&&regionsOverlap(s,source,u)&&occupied(u).some(at=>nearby(s,source.at,at)))){if(!previousReveal.has(u.uid))u.stealth=false;currentReveal.push(u.uid);}
    if(p.waterBodyAlliesPower&&source.uid!==u.uid&&source.controller===u.controller&&bodyOfWater(s,source.at,card).has(u.at))u.ongoingPower+=p.waterBodyAlliesPower;
    if(p.denyOthersAirborne&&u.uid!==source.uid&&card(u.card).type==='Minion')u.deniedKeywords.push('Airborne');
    if(p.revealAllEnemies&&u.controller!==source.controller){u.stealth=false;u.deniedKeywords.push('Stealth');}
    if(p.grantNearbyKeyword&&p.grantOnSite&&source.controller===u.controller&&(!p.other||source.uid!==u.uid)&&(!p.minion||card(u.card).type==='Minion')&&(!p.types||p.types.some(t=>unitTypes(u,s).includes(t)))&&occupied(u).some(at=>s.board[at]&&occupied(source).some(root=>nearby(s,root,at))))u.grantedKeywords.push(p.grantNearbyKeyword);
    if(!regionsOverlap(s,source,u))continue;
    if(p.denyNearbyWard&&occupied(u).some(at=>nearby(s,source.at,at))){u.ward=false;u.deniedKeywords.push('Ward');}
    if(p.revealNearby&&u.controller!==source.controller&&occupied(u).some(at=>nearby(s,source.at,at))){u.stealth=false;u.deniedKeywords.push('Stealth');}
    if(p.shareVerticalWrap&&sameLocation(s,source,u)&&source.controller===u.controller)u.verticalWrap=true;
    if(p.shareProjectileOver&&source.controller===u.controller&&(source.uid===u.uid||distance(s,source.at,u.at)===1))u.projectileOver=true;
    if(p.auraMagicDamageProtected&&nearby(s,source.at,u.at))u.magicDamageProtected=true;
    if(p.nearbyLethalImmune&&source.controller===u.controller&&nearby(s,source.at,u.at))u.lethalImmune=true;
    if(p.grantNearbyKeyword&&!p.grantOnSite&&source.controller===u.controller&&nearby(s,source.at,u.at)&&(!p.other||source.uid!==u.uid)&&(!p.grantOnSite||s.board[u.at])&&(!p.minion||card(u.card).type==='Minion')&&(!p.types||p.types.some(t=>unitTypes(u,s).includes(t))))u.grantedKeywords.push(p.grantNearbyKeyword);
    }memories[layer.instance]=currentReveal;for(const id of currentReveal)allContacts.add(id);}
    source.permanentRevealByAbility=Object.fromEntries(layers.map(l=>[l.instance,memories[l.instance]||[]]));source.permanentRevealContacts=[...allContacts];
  }
  for(const source of s.units){
    if(disabled(source))continue;
    if(unitPassiveLayerViews(s,source,ruleAPI(s),'denyNearbyWard').some(l=>l.value))for(const [at,site] of s.board.entries())if(site&&nearby(s,at,source.at))site.ward=false;
    for(const layer of unitPassiveLayerViews(s,source,ruleAPI(s),'auraPower')){
      const p=layer.passive;
      for(const u of s.units)if(nearby(s,source.at,u.at)&&regionsOverlap(s,source,u)&&(!p.minion||card(u.card).type==='Minion')&&(!p.other||u.uid!==source.uid)&&(!p.allies||u.controller===source.controller)&&(!p.types||p.types.some(t=>unitTypes(u,s).includes(t))))u.ongoingPower+=p.auraPower;
    }
  }
  const transportChanged=refreshPassengers(s,ruleTransportAPI(s));
  refreshFinalUnits(s,ruleAPI(s));
  const borrowedSpatialChanged=refreshBorrowedSpatial(s,ruleAPI(s));
  for(const u of s.units)commitGeometryLocations(u,card);
  refreshGeometry(s,ruleAPI(s));
  const pipers=s.units.filter(u=>!u.dying&&!disabled(u)).flatMap(source=>unitPassiveLayerViews(s,source,ruleAPI(s),'weakMinionControl').map(l=>({source,passive:l.passive,instance:l.instance,stamp:l.source.abilityStamp||0})));if(pipers.length){for(const u of s.units)if(u.kingApplied){u.controller=u.nativeController;u.kingApplied=false;}const all=[...controls,...pipers.map(v=>({kind:'piper',...v}))].sort((a,b)=>a.stamp-b.stamp);for(const e of all){const targets=e.kind==='piper'?s.units.filter(u=>!unmodifiable(u)&&card(u.card).type==='Minion'&&power(u)<=e.passive.weakMinionControl):e.kind==='king'?s.units.filter(u=>!unmodifiable(u)&&unitTypes(u,s).includes(e.passive.undeadKing?'Undead':'Mortal')):[unit(s,e.target)];for(const u of targets){if(!u.kingApplied)u.nativeController=u.controller;u.controller=e.kind==='bound'?e.controller:e.source.controller;u.kingApplied=true;u.kingController=u.controller;}}}
  refreshFinalAvatars(s,ruleAPI(s));
  refreshRemaining(s,ruleAPI(s));
  const geometryChanged=followGeometryAvatars(s,ruleAPI(s));
  for(const u of s.units)if(intrinsicModificationLocked(u,ruleAPI(s))){u.mods=[];u.iceTurns=0;u.iceMagicProtection=false;u.boundSpellcaster=false;u.cocoon=false;u.effectDisabled=false;u.carryDisabled=false;u.bellyDisabled=false;u.silenced=false;u.ongoingPower=0;u.grantedKeywords=[];u.grantedMovement=0;u.grantedRange=0;u.grantedTypes=[];u.deniedKeywords=[];u.effectDisabled=false;u.conditionDisabled=false;u.boundDisabled=false;u.restraintDisabled=false;u.zeroPower=false;if(!passives[card(u.card).slug]?.wardException)u.ward=false;u.stealth=false;}

  finishModificationProtection(s,{...ruleAPI(s),abilityMovementAdjustment});
  refreshFinalSaint(s,ruleAPI(s));
  if(processFinalPassiveEntries(s,ruleAPI(s)).length){refreshContinuous(s);return;}
  finishFinalArtifacts(s,ruleAPI(s));
  refreshFinalSaint(s,ruleAPI(s));
  refreshNaturalEvilWards(s,ruleAPI(s));
  const redRockChanged=refreshRedRockCarrying(s,ruleAPI(s));
  const vivienChanged=refreshVivienUnits(s,ruleAPI(s));
  if(borrowedSpatialChanged||transportChanged||geometryChanged||geometryWorldChanged||redRockChanged||vivienChanged){refreshContinuous(s);return;}
  if(s.boundControls.some(e=>e.untilStealth&&!unit(s,e.target)?.stealth)){s.boundControls=s.boundControls.filter(e=>!e.untilStealth||unit(s,e.target)?.stealth);refreshContinuous(s);}
}
function carriedLances(s,u){return (s.artifacts||[]).filter(a=>a.bearer===u.uid&&equipment[card(a.card).slug]?.lance);}
function acquireLance(s,u,p,at=u?.at){if(!s.artifacts)s.artifacts=[];s.artifacts.push({uid:'o'+s.next++,card:card('lance').id,owner:p,controller:u?.controller,at,bearer:u?.uid||null,layer:u?.layer||'surface'});}
function strikeTotal(s,u,amount=power(u)){const live=unit(s,u.uid)||u;return (amount+carriedLances(s,live).length)*(live.mods.some(m=>m.nextStrikeDouble)?2:1);}
function strikeMany(s,source,allocations,ranged=false,preserveStealth=false,preparedModifiers=null){
  if(disabled(source))return;
  const strikeModifiers=preparedModifiers??claimCriticalStrike(s,source,allocations,ruleAPI(s));
  const live=unit(s,source.uid)||source,recover=live.mods.filter(m=>m.nextStrikeHeal).length;
  if(allocations.length){if(!preserveStealth)live.stealth=false;live.interactedTurn=s.turn;}
  live.mods=live.mods.filter(m=>!m.nextStrikeDouble&&!m.nextStrikeHeal);
  for(const a of carriedLances(s,live))removeObject(s,a,'banished');
  for(const allocation of allocations){const target=unit(s,allocation.uid);if(!target)continue;
    creditUnit(s,target,source);
    if(card(target.card).type==='Avatar')finalSiteAvatarStruck(s,source,target,ruleAPI(s));for(const t of geometryRackStrike(s,source,target,ruleAPI(s)))eventTrigger(s,t.source,t.steps,t.controller);
    if(card(target.card).type==='Avatar')for(const trigger of combatTriggers(s,source,'avatarStrikeDiscard',ruleAPI(s),()=>[{op:'randomDiscard',player:target.controller}]))eventTrigger(s,trigger.source,trigger.steps);
    for(const trigger of combatTriggers(s,target,'destroyWhenStruck',ruleAPI(s),()=>[{op:'destroyStruck',uid:target.uid}]))eventTrigger(s,trigger.source,trigger.steps);
    if(card(target.card).type==='Avatar')for(const trigger of combatTriggers(s,source,'avatarStrikeBurrow',ruleAPI(s),()=>[{op:'balinStrike',avatar:target.uid}]))eventTrigger(s,trigger.source,trigger.steps);
    for(const trigger of combatTriggers(s,source,'untapAfterStriking',ruleAPI(s),layer=>unitTypes(target,s).includes(layer.value)?[{op:'untapSelf',uid:source.uid}]:[]))queueEffects(s,trigger.steps,trigger.source,source.controller);
    if(ranged&&combatHas(s,target,'rangedImmune',ruleAPI(s)))continue;
    const lethal=keywords(source).includes('Lethal')||(combatViews(s,source,ruleAPI(s),'lethalTo').some(l=>l.value==='Evil')&&unitUmbrellas(target,s,source.controller).includes('Evil'));
    const traits=[unitUmbrellas(target,s,source.controller).includes('Evil'),s.artifacts.some(a=>artifactIsCarriedBy(a,target.uid)),card(target.card).type==='Avatar'||keywords(target).includes('Spellcaster'),keywords(target).includes('Voidwalk'),keywords(target).includes('Submerge'),keywords(target).includes('Burrowing'),card(target.card).slug==='frog'||unitTypes(target,s).includes('Frog')||unitUmbrellas(target,s).includes('Frog')].filter(Boolean).length;
    const bonus=s.artifacts.filter(a=>a.bearer===source.uid&&passives[card(a.card).slug]?.traitStrikeBonus).length*traits;
    const lifeBefore=card(target.card).type==='Avatar'?s.players[target.controller].life:0;
    const dealt=hurt(s,target,allocation.amount+bonus,lethal,'strike',source,strikeModifiers);
    if(card(target.card).type==='Avatar'&&target.controller!==source.controller){const lost=lifeBefore-s.players[target.controller].life;if(lost>0)for(const v of s.units)if(v.controller===target.controller&&!v.dying&&occupied(v).some(cell=>nearby(s,cell,target.at))&&regionNames(s,v).has('surface'))for(const trigger of combatTriggers(s,v,'reflectUndefendedLoss',ruleAPI(s),()=>[{op:'lifeLoss',opponent:true,amount:lost}]))eventTrigger(s,trigger.source,trigger.steps);}
    if(card(target.card).type==='Avatar'&&target.controller!==source.controller)for(const av of s.units)if(av.controller===source.controller&&!av.dying)for(const trigger of combatTriggers(s,av,'completionInterrogate',ruleAPI(s),()=>[{op:'completionInterrogate',player:target.controller}]))eventTrigger(s,trigger.source,trigger.steps);
    if(target.controller!==source.controller)for(const sword of (s.artifacts||[]).filter(o=>o.bearer===source.uid&&!o.silenced&&passives[card(o.card).slug]?.fiftySplash)){const n=dealt||s.eventContext?.fiftyReceipt?.amount||allocation.amount+bonus,oldEffect=s.eventContext?.effectCard;if(s.eventContext)s.eventContext.effectCard=sword.card;for(const v of s.units)if(v.uid!==target.uid&&v.controller!==source.controller&&!v.dying&&sameLocation(s,v,target)){creditUnit(s,v,source);hurt(s,v,n,false,'ability',sword);}if(s.eventContext)s.eventContext.effectCard=oldEffect;}
    for(let i=0;i<recover;i++)heal(s,source.controller,dealt);for(const layer of combatViews(s,source,ruleAPI(s),'strikeHeal'))heal(s,source.controller,dealt);
  }
  if(ranged&&!live.dying)for(const trigger of combatTriggers(s,live,'stepAfterRanged',ruleAPI(s),()=>[{op:'unitStep',uid:live.uid,may:true}]))eventTrigger(s,trigger.source,trigger.steps);
}
function strike(s,source,target,amount=power(source),ranged=false,preserveStealth=false){if(target)strikeMany(s,source,[{uid:target.uid,amount:strikeTotal(s,source,amount)}],ranged,preserveStealth);}
function strikesFirst(s,u,fight){return !u.silenced&&(u.copyDuels||[u.copyDuel].filter(Boolean)).some(id=>fight.attacker===u.uid?fight.defenders.includes(id):fight.attacker===id)||(s.artifacts||[]).some(o=>o.bearer===u.uid&&!o.silenced&&passives[card(o.card).slug]?.fiftyFirst)||carriedLances(s,u).length>0||combatHas(s,u,'firstWhileAttacking',ruleAPI(s))&&fight.kind==='attack'&&fight.attacker===u.uid||(s.ongoingEffects||[]).some(e=>finalArchiveEffectApplies(e,u)&&e.op==='nightAttack'&&e.controller===u.controller);}
// A returned archived card is still the source of its queued ability. Keep
// the committed ability and controller, but resolve location-relative parts
// from the card's current placement (Kairos FAQ 18).
function archivedEffectLocation(s,frame){
 const source=frame.source,live=source?.finalArchivePhysicalUid&&[...s.units,...s.artifacts||[],...s.auras||[]].find(o=>o.uid===source.uid&&o.finalArchivePhysicalUid===source.finalArchivePhysicalUid);
 if(!live)return frame;
 const current={...source};
 for(const key of ['at','layer','size','geometryLocations','geometryFixedCells','geometryGrowing','geometryWrap']){if(live[key]!==undefined)current[key]=clone(live[key]);else delete current[key];}
 return {...frame,source:current};
}
function selectEffects(s,frame,filter) {
  frame=archivedEffectLocation(s,frame);
  if(selectorMetadata(frame,filter,ruleAPI(s))?.role==='choose'&&!filter.untargeted)filter={...filter,untargeted:true};
  if(filter.kind==='finalConstrictPlan')return finalConstrictPlans(s,frame,ruleAPI(s));
  const vivienSelection=selectVivien(s,frame,filter,ruleAPI(s));if(vivienSelection!==null)return vivienSelection;
  const sourceSelection=selectAbilitySource(s,frame,filter,ruleAPI(s));if(sourceSelection!==null)return sourceSelection;
  const animationSelection=selectAnimation(s,frame,filter,ruleAPI(s));if(animationSelection!==null)return animationSelection;
  const finalAvatarSelection=selectFinalAvatar(s,frame,filter,ruleAPI(s));if(finalAvatarSelection!==null)return finalAvatarSelection;
  if(filter.kind==='dreamCaster')return dreamCasterChoices(s,frame.controller,ruleAPI(s),frame.source);
  const source=filter.anchor?{...frame.source,...filter.anchor}:frame.source,p=frame.controller;
  const body=filter.inBody?bodyOfWater(s,source.at,card):null;
  // Adjacent effects include the current square (Codex 1d3363e4).
  const effectAdjacent=(a,b)=>distance(s,a,b)<=1;
  const fits=(at)=> (!body||body.has(at))&&(!filter.here||at===source.at)&&(!filter.nearby||nearby(s,at,source.at))&&(!filter.adjacent||effectAdjacent(at,source.at))&&(filter.steps===undefined||distance(s,at,source.at)<=filter.steps)&&(filter.regionSteps===undefined||regionalDistance(s,source,at,card)<=filter.regionSteps);
  const result=[];
  if(filter.kind==='gridArea')return Array.from({length:20},(_,at)=>at).filter(at=>area(s,at).length).map(at=>({label:'2?2 '+String.fromCharCode(65+at%5)+(4-Math.floor(at/5)),value:{at}}));
  if(filter.kind==='ramTarget')return [...selectEffects(s,frame,{kind:'artifact',adjacent:true}).filter(o=>card(s.artifacts.find(a=>a.uid===o.value.uid).card).subtypes.includes('Monument')),...s.auras.filter(a=>card(a.card).subtypes.includes('Wall')&&effectAdjacent(a.at,source.at)).map(a=>({label:card(a.card).name,value:{entity:'aura',uid:a.uid}}))];
  if(filter.kind==='displaceObject')return [...selectEffects(s,frame,{kind:'unit',minion:true}),...selectEffects(s,frame,{kind:'artifact'}),...(s.auras||[]).map(a=>({label:card(a.card).name,value:{entity:'aura',uid:a.uid}}))];
  if(filter.kind==='spellName')return [...new Set(cardCatalog.filter(c=>c.category==='Spell').map(c=>c.name))].sort().map(name=>({label:name,value:name}));
  if(filter.kind==='lastTurnKiller'){
    const ids=new Set((s.deathHistory||[]).filter(d=>d.controller===p&&d.turn===s.turn-1).flatMap(d=>d.killers.map(k=>k.uid)));
    for(const u of s.units)if(ids.has(u.uid)&&!u.dying)for(const at of occupied(u))if((!filter.adjacentSite||s.board[at]&&occupied(source).some(cell=>effectAdjacent(cell,at))))result.push({label:card(u.card).name+' · '+String.fromCharCode(65+at%5)+(4-Math.floor(at/5)),value:{uid:u.uid,at,layer:u.layer||'surface'}});
    return result;
  }
  if(filter.kind==='goblet'){const o=s.artifacts.find(o=>o.uid===source.uid);return o?.gobletPower!==undefined?[{label:'獲得 '+o.gobletPower+' 魔力',value:'mana'},{label:'治療 '+o.gobletPower+' 生命',value:'life'}]:selectEffects(s,frame,{kind:'unit',minion:true,ally:true,here:true,untargeted:true});}
  if(filter.kind==='exorcist')return [...selectEffects(s,frame,{...filter,kind:'unit',types:['Demon','Spirit']}),...(s.auras||[]).filter(a=>Array.from({length:20},(_,i)=>i).some(at=>inside(a,at)&&fits(at))).map(a=>({label:card(a.card).name,value:{entity:'aura',uid:a.uid}}))];
  if(filter.kind==='wardMark')return [...selectEffects(s,frame,{...filter,kind:'unit',warded:true}),...selectEffects(s,frame,{...filter,kind:'site'}).filter(o=>s.board[o.value.at].ward)];
  if(filter.kind==='graveOrDocument')return [...selectEffects(s,frame,{kind:'grave',type:'Magic'}),...selectEffects(s,frame,{kind:'artifact',anyRegion:true}).filter(o=>card((s.artifacts||[]).find(a=>a.uid===o.value.uid).card).subtypes.includes('Document'))];
  if(['unit','wardable','unitOrArtifact','artifact'].includes(filter.kind))for(const u of s.units){
    const c=card(u.card);
    if(filter.kind==='artifact'&&!c.artifactUnit)continue;
    if(filter.kind==='wardable'&&c.type!=='Minion')continue;
    if(filter.avatar&&c.type!=='Avatar')continue;
    if(filter.tapped&&!u.tapped)continue;if(filter.notHere&&sameLocation(s,u,source))continue;
    if(u.dying||!filter.protectionReadOnly&&!siteEffectAllowed(s,u,'modify',{card},frame.abilityOrigin||source.abilityOrigin||source.card)||(!filter.untargeted&&!canTarget(s,p,u,{...source,abilityOrigin:frame.abilityOrigin||source.abilityOrigin},frame.effectCard))||!filter.untargeted&&frame.effectCard&&card(frame.effectCard).type==='Magic'&&(u.iceMagicProtection||u.magicProtected&&!disabled(u))||!occupied(u).some(fits)||(!filter.anyRegion&&!regionsOverlap(s,u,source)&&!(filter.siteBothLayers&&regionsOverlap(s,u,{at:source.at,layer:'below'}))))continue;
    if(filter.uids&&!filter.uids.includes(u.uid)||filter.excludeUid===u.uid)continue;
    if(filter.ally&&u.controller!==p||filter.enemy&&u.controller===p||filter.other&&u.uid===source.uid||filter.ownOrControl&&u.owner!==p&&u.controller!==p)continue;
    if(filter.minion&&c.type!=='Minion'||filter.evil&&!unitUmbrellas(u,s,p).includes('Evil')||filter.warded&&!u.ward)continue;
    if(filter.selfOrAdjacent&&u.uid!==source.uid&&!effectAdjacent(u.at,source.at))continue;
    if(filter.adjacent&&!occupied(u).some(at=>effectAdjacent(at,source.at))||filter.surface&&(u.layer||'surface')!=='surface')continue;
    if(filter.bornThisTurn&&u.born!==s.turn)continue;
    if(filter.canAct&&disabled(u))continue;
    if(filter.weakerThanSource&&Math.floor((power(u)+power(u,true))/2)>=Math.floor((power(source)+power(source,true))/2))continue;
    if(filter.siteOnly&&!occupied(u).some(at=>s.board[at]))continue;
    if(filter.hereOrAdjacent&&!occupied(u).some(at=>occupied(source).some(root=>distance(s,at,root)<=1)))continue;
    if(filter.wounded&&!(u.damage>0))continue;
    if(filter.ready&&!ready(s,u))continue;
    if(filter.connectedRivers&&!occupied(u).some(at=>riverNetwork(s,source.at).has(at)))continue;
    if(filter.nonEvil&&unitUmbrellas(u,s,p).includes('Evil'))continue;
    if(filter.carryingArtifact&&!(s.artifacts||[]).some(a=>artifactIsCarriedBy(a,u.uid)&&carriable(card(a.card))))continue;
    if(filter.maxPower!==undefined&&power(u)>filter.maxPower)continue;
    if(filter.land&&(!s.board[u.at]||waterSite(s,u.at,card))||filter.water&&!waterSite(s,u.at,card))continue;
    if(filter.onSite&&!occupied(u).some(at=>!!s.board[at]))continue;
    if(filter.types&&!filter.types.some(t=>unitTypes(u,s).includes(t)))continue;
    if(filter.notTypes&&filter.notTypes.some(t=>unitTypes(u,s).includes(t)))continue;
    if(filter.hasEnemyAdjacent&&!s.units.some(v=>v.controller!==u.controller&&!v.dying&&canTarget(s,u.controller,v)&&effectAdjacent(v.at,u.at)&&regionsOverlap(s,v,u)))continue;
    if(filter.rarities&&!filter.rarities.some(r=>hasSiteRarity(c,r)))continue;
    if(filter.spellcaster&&c.type!=='Avatar'&&!keywords(u).includes('Spellcaster'))continue;
    const entry={label:c.name+' · '+String.fromCharCode(65+u.at%5)+(4-Math.floor(u.at/5)),value:{entity:'unit',uid:u.uid}};
    if(filter.adjacentWater){for(const at of occupied(u))if(effectAdjacent(at,source.at)&&waterSite(s,at,card))result.push({...entry,label:entry.label+' · '+String.fromCharCode(65+at%5)+(4-Math.floor(at/5)),value:{...entry.value,pullFrom:at}});}else result.push(entry);
  }
  if(['site','wardable'].includes(filter.kind))for(let at=0;at<20;at++){
    const site=s.board[at];if(filter.kind==='wardable'&&site&&(passives[card(site.card).slug]?.immutableSite||site.completionProtected))continue;if(filter.rarities&&site&&!filter.rarities.some(r=>hasSiteRarity(card(site.card),r)))continue;if(filter.nameIncludes&&(!site||!card(site.card).name.includes(filter.nameIncludes)))continue;if(filter.siteType&&(!site||!card(site.card).subtypes.includes(filter.siteType)))continue;if(filter.other&&at===source.at||filter.backRow&&!inBackRow(at,p)||filter.empty&&!emptySite(s,at)||filter.movable&&site&&passives[card(site.card).slug]?.immutableSite)continue;if(filter.noAvatar&&s.units.some(u=>card(u.card).type==='Avatar'&&occupied(u).includes(at)))continue;if(!site||at===filter.excludeAt||!fits(at)||filter.ally&&site.controller!==p||filter.water&&!waterSite(s,at,card)||filter.land&&waterSite(s,at,card)||filter.rubble&&card(site.card).slug!=='rubble'||filter.nearBody&&![...bodyOfWater(s,source.at,card)].some(root=>nearby(s,root,at)))continue;
    result.push({label:card(site.card).name+' · '+String.fromCharCode(65+at%5)+(4-Math.floor(at/5)),value:{entity:'site',at,...(filter.snapshot?{card:site.card}:{})}});
  }
  if(filter.kind==='hand')for(const h of s.players[p].hand)if((!filter.element||hasElement(card(h.card),filter.element))&&(!filter.type||card(h.card).type===filter.type||filter.type==='Artifact'&&card(h.card).artifactUnit)&&(!filter.playable||card(h.card).playable)&&(!filter.spells||card(h.card).category==='Spell')&&(!filter.siteElement||card(h.card).type==='Site'&&card(h.card)[filter.siteElement]>0))result.push({label:card(h.card).name,value:{entity:'hand',uid:h.uid,player:p}});
  if(filter.kind==='player')for(let player=0;player<2;player++)result.push({label:s.players[player].name,value:{entity:'player',player}});
  if(['deck','handDeck'].includes(filter.kind))for(let player=0;player<2;player++)if((filter.player===undefined||filter.player===player)&&(!filter.own||player===p)){
    for(const [index,id] of s.players[player].spells.entries()){
      if(index>=searchLimit(s,p,ruleAPI(s)))break;
      const c=cardForPlayer(s,id,player);if(filter.type&&c.type!==filter.type||filter.maxCost!==undefined&&c.cost>filter.maxCost||filter.slug&&c.slug!==filter.slug||filter.types&&!filter.types.some(t=>c.subtypes.includes(t))||filter.rarities&&!filter.rarities.includes(c.slot))continue;
      result.push({label:c.name+' · Spellbook',value:{entity:'deck',player,index,card:id}});
    }
    if(filter.kind==='handDeck')for(const h of s.players[player].hand)if(!filter.slug||card(h.card).slug===filter.slug)result.push({label:card(h.card).name+' · 手牌',value:{entity:'hand',player,uid:h.uid,card:h.card}});
  }
  if(filter.kind==='grave')for(let player=0;player<2;player++)if((filter.player===undefined||filter.player===player)&&(!filter.own||player===cemeteryPhysicalPlayer(s,p,ruleAPI(s))))for(const entry of (filter.readOnly?graveEntries(s,player):effectGraves(s,player,p))){
    const c=cardForPlayer(s,entry.card,entry.player);if(filter.copyFits&&c.slug==='mountain_giant'&&!isGlobeActive(s,card)&&(source.at%5>3||source.at>=15))continue;if(filter.minion&&(c.type!=='Minion'||!c.playable&&!filter.includeUnsupported)||filter.type&&c.type!==filter.type||filter.playable&&!c.playable||filter.diedThisTurn&&entry.deathTurn!==s.turn||filter.types&&!filter.types.some(t=>c.subtypes.includes(t))||filter.unique&&c.slot!=='Unique')continue;
    result.push({label:c.name+' · 玩家 '+(player+1)+' 墓地',value:entry});
  }
  if(['unitOrArtifact','artifact'].includes(filter.kind))for(const a of s.artifacts||[]){
    if(filter.carriedBySource&&a.bearer!==source.uid)continue;if(filter.carriable&&(card(a.card).subtypes.includes('Monument')||card(a.card).subtypes.includes('Automaton')||card(a.card).type==='Minion'))continue;
    const bearer=unit(s,a.bearer);if(!fits(a.at)||!filter.anyRegion&&!regionsOverlap(s,a,source)||bearer?.controller!==p&&stealthHides(bearer)||filter.land&&(!s.board[a.at]||waterSite(s,a.at,card))||filter.water&&!waterSite(s,a.at,card))continue;
    if(filter.ownOrControl&&a.owner!==p&&bearer?.controller!==p)continue;
    result.push({label:card(a.card).name,value:{entity:'artifact',uid:a.uid}});
  }
  if(filter.kind==='location')for(let at=0;at<20;at++)if(fits(at))for(const layer of s.board[at]?['surface','below']:['surface']){
    if(filter.enemyPair&&s.units.filter(u=>!u.dying&&u.controller!==p&&occupied(u).includes(at)&&(u.layer||'surface')===layer).length<2)continue;if(filter.other&&at===source.at&&layer===(source.layer||'surface'))continue;
    if(filter.nearCasterOrDragon&&![source,...s.units.filter(u=>!u.dying&&u.controller===p&&unitTypes(u,s).includes('Dragon'))].some(anchor=>nearby(s,anchor.at,at)&&regionsOverlap(s,anchor,{at,layer})))continue;
    if(filter.voidOnly&&s.board[at])continue;if(filter.voidOrRubble&&s.board[at]&&card(s.board[at].card).slug!=='rubble'||filter.surface&&layer!=='surface')continue;
    if(filter.sameRegion&&!regionsOverlap(s,{at,layer},source))continue;
    if(filter.canSummon){const k=printedKeywords(card(filter.canSummon));if(layer==='below'&&!k.includes(waterSite(s,at,card)?'Submerge':'Burrowing')||geometryIsVoidCell(s,at,card)&&!k.includes('Voidwalk'))continue;}
    result.push({label:String.fromCharCode(65+at%5)+(4-Math.floor(at/5))+' · '+(layer==='below'?'地下／水下':'表面／虛空'),value:{entity:'location',at,layer}});
  }
  return result;
}
function resolveStep(s,frame) {
  frame=archivedEffectLocation(s,frame);
  if(frame.step.abilityOrigin)frame={...frame,effectCard:frame.step.abilityOrigin};
  const {step,source,controller:p,selected}=frame;
  if(step.op==='finishSacrificeCost'){finishSacrificeCost(s,step.id,sendCard);return;}
  recordMagicChoiceFrame(s,frame,ruleAPI(s));
  if(resolveZoneAccess(s,frame,ruleAPI(s)))return;
  if(step.sacrificeAfter){
    const {sacrificeAfter,...effectStep}=step;
    try{resolveStep(s,{...frame,step:effectStep});}finally{if(s.board[sacrificeAfter.at]?.card===sacrificeAfter.card)destroySite(s,sacrificeAfter.at,true);}
    return;
  }
  startEvent(s,source,frame.effectCard,['commitSpell','combatAllocate','fightStage','fightFinish','finishTurn','finishStart','finishMagic','bury','buryMany','graveRecur'].includes(step.op));
  s.eventContext.controller=p;
  s.eventContext.abilityOrigin=frame.abilityOrigin||step.abilityOrigin||source.abilityOrigin||source.card;
  if(step.fight?.kind==='attack')s.eventContext.attack=step.fight.attacker;
  if(siteFrameBlocked(s,frame,ruleAPI(s)))return;
  if(resolveSpatialMovementShot(s,frame,ruleAPI(s)))return;
  if(resolveGeometryForced(s,frame,ruleAPI(s)))return;
  const damageKind=card(frame.effectCard).type==='Magic'?'magic':'ability';
  const lifeCause=['Minion','Avatar'].includes(card(frame.effectCard).type)?source:null;
  if(step.op==='imperialRoad'){
    const player=step.opponent?1-p:p,pl=s.players[player],sites=pl.hand.filter(h=>card(h.card).type==='Site'),spots=Array.from({length:20},(_,at)=>at).filter(at=>distance(s,source.at,at)===1&&(!s.board[at]||card(s.board[at].card).slug==='rubble'));
    if(selected===undefined){const options=sites.flatMap(h=>spots.map(at=>({label:card(h.card).name+' · '+String.fromCharCode(65+at%5)+(4-Math.floor(at/5)),value:{hand:h.uid,at}})));if(options.length)s.choice={player,title:'Imperial Road · 可打出相鄰地點',options:[...options,{label:'略過',value:null}],frame};return;}
    if(selected===null)return;const h=sites.find(h=>h.uid===selected.hand);if(h&&spots.includes(selected.at)&&geometryPlaceSiteAllowed(s,card(h.card),selected.at,card)){pl.hand=pl.hand.filter(v=>v.uid!==h.uid);enterSite(s,player,h.card,selected.at);}return;
  }
  if(step.op==='goldenDawn'){
    const pl=s.players[p],sites=Array.from({length:5},(_,i)=>i+(p===0?15:0)).filter(at=>s.board[at]),dealt=sites.map(at=>({at,id:pl.spells.shift()})).filter(v=>v.id),rest=[],summoned=[];log(s,'Golden Dawn：'+dealt.map(v=>card(v.id).name).join('、'));
    for(const {at,id} of dealt){const c=card(id);if(c.type==='Minion'&&c.playable){if(!canSummonEntry(s,p,c,at,'surface'))sendCard(s,p,id,'banished');else if(paySummoningTax(s,id,p,p))summoned.push(makeUnit(s,id,p,at));}else rest.push(id);}
    shuffle(s,rest);pl.spells.push(...rest);queueEffects(s,[{op:'dawnCharge',uids:summoned.map(u=>u.uid)}],source,p,frame.effectCard);refreshContinuous(s);for(const u of summoned.reverse())summonedGenesis(s,u);return;
  }
  if(step.op==='dawnCharge'){if(s.players[p].doorTurn!==null)for(const uid of step.uids){const u=unit(s,uid);if(u&&!u.dying)u.mods.push({keyword:'Charge'});}return;}
  if(step.op==='howlBeyond'){
    const pl=s.players[p],count=s.board.filter((site,at)=>!site&&(at%5===0||at%5===4)).length,dealt=pl.spells.splice(0,count),drawn=[];log(s,'Howl from Beyond：'+dealt.map(id=>card(id).name).join('、'));
    for(const id of dealt){const c=card(id);if(c.type==='Minion'&&(printedKeywords(c).includes('Voidwalk')||c.subtypes.includes('Monster')))drawn.push(id);else pl.banished.push(id);}
    for(const id of drawn){pl.spells.unshift(id);draw(s,p,'spells');}return;
  }
  if(step.op==='flankOrigin'){
    const options=selectEffects(s,frame,{kind:'location'}).filter(o=>s.units.some(u=>u.controller===p&&!u.dying&&occupied(u).includes(o.value.at)&&(u.layer||'surface')===o.value.layer));
    if(selected===undefined){if(options.length)s.choice={player:p,title:'Flanking Maneuver · 選擇出發位置',options:[...options,{label:'不傳送',value:null}],frame};return;}if(selected===null)return;
    queueEffects(s,[{op:'flankDestination',origin:selected}],source,p,frame.effectCard);return;
  }
  if(step.op==='flankDestination'){
    const a=position(step.origin.at),options=selectEffects(s,frame,{kind:'location'}).filter(o=>{const b=position(o.value.at);return Math.abs(a.x-b.x)*Math.abs(a.y-b.y)===2;});
    if(selected===undefined){if(options.length)s.choice={player:p,title:'Flanking Maneuver · 選擇馬步落點',options,frame};return;}
    queueEffects(s,[{op:'flankAllies',origin:step.origin,to:selected,picks:[]}],source,p,frame.effectCard);return;
  }
  if(step.op==='flankAllies'){
    const candidates=s.units.filter(u=>u.controller===p&&!u.dying&&occupied(u).includes(step.origin.at)&&(u.layer||'surface')===step.origin.layer&&!step.picks.includes(u.uid));
    if(selected===undefined){s.choice={player:p,title:'Flanking Maneuver · 選擇傳送的友軍',options:[...candidates.map(u=>({label:card(u.card).name,value:u.uid})),{label:'完成選擇',value:null}],frame};return;}
    if(selected!==null){queueEffects(s,[{...step,picks:[...step.picks,selected]}],source,p,frame.effectCard);return;}
    for(const uid of step.picks){const u=unit(s,uid),at=u&&step.to.at+u.at-step.origin.at;if(!u||u.dying||at<0||at>=20||u.size===2&&(at%5>3||at>=15)||card(u.card).type==='Avatar'&&(!s.board[at]||step.to.layer==='below'))continue;if(!occupied({...u,at}).every((cell,i)=>canEnterOnGround(s,u,{at:occupied(u)[i],layer:u.layer||'surface'},{at:cell,layer:step.to.layer},card,keywords,true)))continue;u.carryTeleport=true;u.at=at;u.layer=step.to.layer;u.notRest=true;u.burrowedSafely=false;}return;
  }
  if(step.op==='displaceDestination'){
    const obj=step.target.entity==='unit'?unit(s,step.target.uid):[...s.artifacts,...s.auras].find(o=>o.uid===step.target.uid);if(!obj||obj.dying)return;const a=position(obj.at),isAura=step.target.entity==='aura';
    const options=Array.from({length:20},(_,at)=>at).filter(at=>{const b=position(at);return Math.abs(a.x-b.x)===1&&Math.abs(a.y-b.y)===1&&(isAura?(obj.wallTo!==undefined?wallCanMove(obj,at):obj.singleSite||area(s,at).length):regionsOverlap(s,{at,layer:obj.layer||'surface'},obj))&&(obj.size!==2||at%5<4&&at<15)&&(step.target.entity!=='unit'||occupied({...obj,at}).every((cell,i)=>canEnterOnGround(s,obj,{at:occupied(obj)[i],layer:obj.layer||'surface'},{at:cell,layer:obj.layer||'surface'},card,keywords,true)));});
    if(selected===undefined){if(options.length)s.choice={player:p,title:'Displace · 選擇對角落點',options:options.map(at=>({label:String.fromCharCode(65+at%5)+(4-Math.floor(at/5)),value:at})),frame};return;}
    if(options.includes(selected)){if(step.target.entity==='artifact')obj.bearer=null;obj.carryTeleport=true;if(obj.wallTo!==undefined)obj.wallTo=translatedWallEnd(s,obj,selected,card);obj.at=selected;obj.notRest=true;obj.burrowedSafely=false;}return;
  }
  if(step.op==='scorchChoose'){
    const picks=step.picks||[];if(selected===undefined){s.choice={player:p,title:'Scorched Earth · 選擇己方地點',options:[...s.board.flatMap((site,at)=>site?.controller===p&&!picks.includes(at)?[{label:card(site.card).name+' · '+String.fromCharCode(65+at%5)+(4-Math.floor(at/5)),value:at}]:[]),{label:'確認選擇',value:null}],frame:{...frame,step:{...step,picks}}};return;}
    if(selected!==null){queueEffects(s,[{...step,picks:[...picks,selected]}],source,p,frame.effectCard);return;}
    const victims=s.units.filter(u=>card(u.card).type==='Minion'&&occupied(u).some(at=>picks.includes(at))),objects=[...s.artifacts.filter(o=>picks.includes(o.at)),...s.auras.filter(o=>picks.some(at=>inside(o,at)))];queueEffects(s,[{op:'scorchFinish',picks,objects:objects.map(o=>o.uid)}],source,p,frame.effectCard);for(const u of victims)kill(s,u);return;
  }
  if(step.op==='scorchFinish'){for(const o of [...s.artifacts,...s.auras])if(step.objects.includes(o.uid))removeObject(s,o,'cemetery');for(const at of step.picks)destroySite(s,at);return;}
  if(step.op==='sufferingChoose'){
    const kinds=step.kinds||['minion','artifact','aura'],picks=step.picks||[],opponent=!!step.opponent,player=opponent?1-p:p,kind=kinds[0];
    if(!kind){if(!opponent)completeMagicAlliedChoiceSet(s,frame,picks.map(o=>o.uid),ruleAPI(s));queueEffects(s,[{op:'sufferingSacrifice',picks,opponent,matchingKinds:[...(step.done||[]),...picks.map(o=>o.kind)]}],source,p,frame.effectCard);return;}
    const pool=kind==='minion'?s.units.filter(u=>card(u.card).type==='Minion'):kind==='artifact'?[...s.artifacts,...s.units.filter(u=>card(u.card).artifactUnit||isAnimatedArtifact(u))]:s.auras;
    const candidates=[...new Map(pool.map(o=>[o.uid,o])).values()].filter(o=>!o.dying&&(kind==='artifact'?artifactController(s,o):o.controller)===player&&!picks.some(v=>v.uid===o.uid));
    if(selected===undefined){if(candidates.length)s.choice={player,title:'Symmetric Suffering · 選擇犧牲 '+kind+'（本組選完才一同犧牲）',options:[...candidates.map(o=>({label:card(o.card).name,value:o.uid})),...(!opponent?[{label:'略過此類型',value:null}]:[])],frame:{...frame,step:{...step,kinds,picks}}};else queueEffects(s,[{...step,kinds:kinds.slice(1),picks}],source,p,frame.effectCard);return;}
    const obj=candidates.find(o=>o.uid===selected);assert(obj||!opponent&&selected===null,'犧牲選擇已失效');
    queueEffects(s,[{...step,kinds:kinds.slice(1),picks:obj?[...picks,{uid:obj.uid,kind}]:picks}],source,p,frame.effectCard);return;
  }
  if(step.op==='sufferingSacrifice'){
    const picks=step.picks||[],matchingKinds=step.matchingKinds||picks.map(o=>o.kind);if(!step.opponent&&matchingKinds.length)queueEffects(s,[{op:'sufferingChoose',opponent:true,kinds:matchingKinds,picks:[]}],source,p,frame.effectCard);
    const ownBatch=!s.simultaneousDestruction;if(ownBatch)beginRealmDestruction(s);
    for(const pick of picks){const u=unit(s,pick.uid);if(u&&!u.dying)kill(s,u,false,true,true);else{const o=[...s.artifacts,...s.auras].find(o=>o.uid===pick.uid);if(o)removeObject(s,o,'cemetery');}}
    if(ownBatch)finishRealmDestruction(s);return;
  }
  if(step.op==='nightmarePush'){
    const actor=unit(s,source.uid);if(!actor||actor.dying)return;const remaining=step.remaining||s.units.filter(u=>u.controller!==p&&!u.dying&&card(u.card).type==='Minion'&&sameLocation(s,u,actor)).map(u=>u.uid),uid=remaining[0],target=unit(s,uid);if(!uid)return;
    queueEffects(s,[{...step,remaining:remaining.slice(1)}],source,p,frame.effectCard);if(!target||target.dying||!sameLocation(s,target,actor))return;
    queueEffects(s,[{op:'nightmareDestination',uid}],source,p,frame.effectCard);return;
  }
  if(step.op==='nightmareDestination'){
    const u=unit(s,step.uid);if(!u||u.dying)return;const options=Array.from({length:20},(_,at)=>at).filter(at=>distance(s,at,u.at)===1&&(u.size!==2||at%5<4&&at<15)&&occupied({...u,at}).every((cell,i)=>canEnterOnGround(s,u,{at:occupied(u)[i],layer:u.layer||'surface'},{at:cell,layer:u.layer||'surface'},card,keywords)));
    if(selected===undefined){s.choice={player:p,title:'Nightmare · 可推動 '+card(u.card).name,options:[...options.map(at=>({label:String.fromCharCode(65+at%5)+(4-Math.floor(at/5)),value:at})),{label:'略過',value:null}],frame};return;}if(selected!==null&&options.includes(selected)){u.at=selected;u.notRest=true;u.burrowedSafely=false;}return;
  }
  if(step.op==='forbidSpellName'){(s.ongoingEffects||(s.ongoingEffects=[])).push({op:'forbidSpellName',name:selected,until:p,controller:p});log(s,'Hyter Sprites：'+selected+' 在下個己方回合前不能施放。');return;}
  if(step.op==='feastForCrows'){
    const pl=s.players[1-p],named=id=>card(id).name===selected,limit=Math.min(pl.spells.length,searchLimit(s,p,ruleAPI(s))),hand=pl.hand.filter(h=>named(h.card)).map(h=>h.card),spells=pl.spells.slice(0,limit).filter(named),grave=removeGraves(s,cemeteryPhysicalPlayer(s,1-p,ruleAPI(s)),named,p);
    pl.hand=pl.hand.filter(h=>!named(h.card));pl.spells=[...pl.spells.slice(0,limit).filter(id=>!named(id)),...pl.spells.slice(limit)];pl.banished.push(...hand,...spells,...grave);shuffle(s,pl.spells);log(s,'Feast for Crows：放逐 '+selected+'，共 '+(hand.length+spells.length+grave.length)+' 張。');return;
  }
  if(step.op==='departedRevenge'||step.op==='lurkerRevenge'){
    const actor=unit(s,source.uid),target=unit(s,selected?.uid);if(!actor||actor.dying||!target||target.dying||!occupied(target).includes(selected.at))return;
    if(step.op==='departedRevenge'){
      const to={at:selected.at,layer:target.layer||'surface'};if(!occupied({...actor,at:to.at}).every((at,i)=>canEnterOnGround(s,actor,{at:occupied(actor)[i],layer:actor.layer||'surface'},{at,layer:to.layer},card,keywords,true)))return;
      actor.carryTeleport=true;actor.at=to.at;actor.layer=to.layer;actor.notRest=true;actor.burrowedSafely=false;queueEffects(s,[{op:'revengeStrike',uid:target.uid}],actor,p,frame.effectCard);
    }else{
      const from={at:target.at,layer:target.layer||'surface'},to={at:actor.at,layer:from.layer},steps=[{op:'dragStep',uid:target.uid,from,to,ignoreRegions:true}];
      if(from.layer!==(actor.layer||'surface')&&card(target.card).type!=='Avatar')steps.push({op:'dragStep',uid:target.uid,from:to,to:{at:actor.at,layer:actor.layer||'surface'},ignoreRegions:true});
      queueEffects(s,steps,actor,p,frame.effectCard);
    }return;
  }
  if(step.op==='revengeStrike'){const actor=unit(s,source.uid),target=unit(s,step.uid);if(actor&&!actor.dying&&target&&!target.dying&&sameLocation(s,actor,target))strike(s,actor,target);return;}
  if(step.op==='chapelWard'){
    if(resources(s,p).available<1)return;
    if(selected===undefined){const options=selectEffects(s,frame,{kind:'unit',minion:true,ally:true,nearby:true,siteBothLayers:true,untargeted:true});if(options.length)s.choice={player:p,title:'Hillside Chapel · 支付 1 魔力？',options:[...options,{label:'略過',value:null}],frame};return;}
    if(selected===null)return;const u=unit(s,selected.uid);if(u&&!u.dying&&u.controller===p&&siteEffectAllowed(s,u,'modify',{card})){s.players[p].spent++;u.tapped=true;if(!unitUmbrellas(u,s).includes('Evil'))u.ward=true;}return;
  }
  if(step.op==='gobletResolve'){
    const o=s.artifacts.find(o=>o.uid===source.uid);if(!o)return;
    if(o.gobletPower!==undefined){const n=o.gobletPower;delete o.gobletPower;if(selected==='mana')s.players[p].bonusMana=(s.players[p].bonusMana||0)+n;else if(selected==='life')heal(s,p,n);return;}
    const u=unit(s,selected?.uid);if(u&&!u.dying&&u.controller===p&&sameLocation(s,u,o)){o.gobletPower=power(u);kill(s,u,false,true,true);}return;
  }
  if(step.op==='fireBlastCommit'){if(selected===null)return;const a=step.action;assert(legalActions(s,p).some(v=>v.type==='activate'&&v.unit===a.unit&&(a.abilityInstance?v.abilityInstance===a.abilityInstance:v.index===a.index)),'能力已失效');commitAbility(s,{...a,blastLocation:selected},step.hand);return;}
  if(step.op==='dockLure'){const u=unit(s,selected?.uid);if(u&&!u.dying)queueEffects(s,[{op:'unitStep',uid:u.uid,toward:{at:source.at,layer:u.layer||'surface'}}],source,p,frame.effectCard);return;}
  if(step.op==='holyWaterHit'){const u=unit(s,step.uid||selected?.uid);if(u&&card(u.card).type==='Minion'){if(unitUmbrellas(u,s,p).includes('Evil'))kill(s,u,true);else u.ward=true;}return;}
  if(step.select&&!step.untargeted&&!step.select.untargeted&&selectorMetadata(frame,step.select,ruleAPI(s))?.role!=='choose')targetDeclared(s,source,selected);
  if(step.op==='siteNextCast'){const site=s.board[source.at];if(site?.card===source.card)site.nextCastTurn=s.turn;return;}
  if(step.op==='accusation'){const q=1-p;log(s,'Accusation · '+s.players[q].name+'：'+s.players[q].hand.map(h=>card(h.card).name).join('、'));const evil=s.players[q].hand.some(h=>cardForPlayer(s,h.card,q).umbrellas.includes('Evil'))||s.units.some(u=>u.controller===q&&!u.dying&&unitUmbrellas(u,s,p).includes('Evil'));queueEffects(s,[{op:'accuseBanish',player:q,chooser:evil?p:q}],source,p,frame.effectCard);return;}
  if(step.op==='accuseBanish'){const q=step.player,options=s.players[q].hand.map(h=>({label:card(h.card).name,value:h.uid}));if(selected===undefined){if(options.length)s.choice={player:step.chooser,title:s.players[step.chooser].name+' · Accusation · 選一張放逐',options:[...options,...(step.chooser===p?[{label:'由對手選擇',value:'opponent'}]:[])],frame};return;}if(selected==='opponent'){queueEffects(s,[{...step,chooser:q}],source,p,frame.effectCard);return;}const h=s.players[q].hand.find(h=>h.uid===selected);if(h){s.players[q].hand=s.players[q].hand.filter(v=>v.uid!==h.uid);sendCard(s,q,h.card,'banished');}return;}
  if(step.op==='swapSites'){exchangeSites(s,source.at,selected.at);return;}
  if(step.op==='resolveLegacySpell'){resolveMagic(s,p,card(frame.effectCard),step.action);return;}
  if(step.op==='pendulumSwing'){const options=selectEffects(s,frame,{kind:'location',adjacent:true,sameRegion:true,untargeted:true}).filter(o=>o.value.at!==source.at||(o.value.layer||'surface')!==(source.layer||'surface'));if(selected===undefined&&options.length){s.choice={player:p,title:s.players[p].name+' · Pendulum of Peril · 選相鄰位置',options,frame};return;}const places=[{at:source.at,layer:source.layer||'surface'},...(selected?[selected]:[])];for(const u of [...s.units])if(!u.dying&&card(u.card).type==='Minion'&&places.some(v=>occupied(u).includes(v.at)&&(u.layer||'surface')===v.layer))kill(s,u);return;}
  if(step.op==='shrineDragons'){const targets=s.units.filter(u=>!u.dying&&unitTypes(u,s).includes('Dragon'));for(const u of targets)if((u.size!==2||source.at%5<4&&source.at<15)&&occupied({...u,at:source.at}).every((at,i)=>canEnterOnGround(s,u,{at:occupied(u)[i],layer:u.layer||'surface'},{at,layer:source.layer||'surface'},card,keywords,true))){u.carryTeleport=true;u.at=source.at;u.layer=source.layer||'surface';u.notRest=true;u.burrowedSafely=false;}return;}
  if(step.op==='spearCommit'){if(selected===null)return;const a=step.action,o=s.artifacts.find(o=>o.uid===a.object),target=unit(s,step.target.uid);assert(o&&target&&geometryLocationRecords(target).some(loc=>loc.at===selected.at&&loc.layer===selected.layer),'神槍落點已失效');assert(legalActions(s,p).some(v=>v.type==='activateArtifact'&&v.object===a.object&&v.index===a.index),'持有者無法啟動神槍');commitArtifact(s,{...a,spearLocation:selected},step.target);return;}
  if(step.op==='dragonGift'){(s.ongoingEffects||(s.ongoingEffects=[])).push({op:'freeDragon',at:source.at,layer:source.layer||'surface',controller:p,end:s.turn});return;}
  if(step.op==='assassinCommit'){if(selected===null)return;const actor=unit(s,step.action.unit),o=s.artifacts.find(o=>o.uid===selected&&artifactIsCarriedBy(o,actor?.uid));assert(actor&&o&&ready(s,actor),'投擲者或神器已失效');assert(selectEffects(s,{source:actor,controller:p},liveUnitAbility(s,step.action).steps[0].select).some(v=>v.value.uid===step.target.uid),'投擲目標已失效');commitAbility(s,{...step.action,throwObject:o.uid},step.target);return;}
  if(step.op==='dracoArrive'){const actor=unit(s,source.uid),target=unit(s,step.uid);if(actor&&!actor.dying&&target&&!target.dying&&sameLocation(s,actor,target))queueEffects(s,[{op:'shiftLayer',forceAction:'burrow',forceUids:[target.uid]}],actor,p);return;}
  if(step.op==='bonekiteRaise'){const n=(s.deathHistory||[]).slice(step.from).filter(d=>step.victims.includes(d.uid)).length;for(let i=0;i<n;i++)if(canSummonEntry(s,p,card('skeleton'),step.at,step.layer)&&paySummoningTax(s,card('skeleton').id,p,p)){const u=makeUnit(s,card('skeleton').id,p,step.at);u.layer=step.layer;}return;}
  if(step.op==='balorRay'){const ray=[],d=selected-1;let x=source.at%5+[0,1,0,-1][d],y=Math.floor(source.at/5)+[-1,0,1,0][d];while(x>=0&&x<5&&y>=0&&y<4){const at=y*5+x;for(const layer of s.board[at]?['surface','below']:['surface'])ray.push({at,layer});x+=[0,1,0,-1][d];y+=[-1,0,1,0][d];}queueEffects(s,[{op:'balorChoose',locations:ray,hits:[]}],source,p);return;}
  if(step.op==='balorChoose'){if(!step.locations.length){queueEffects(s,[{op:'balorDamage',hits:step.hits}],source,p);return;}const here=step.locations[0],options=selectEffects(s,frame,{kind:'unit',uids:s.units.filter(u=>!u.dying&&occupied(u).includes(here.at)&&(u.layer||'surface')===here.layer).map(u=>u.uid),anyRegion:true,untargeted:true});if(!options.length){queueEffects(s,[{...step,locations:step.locations.slice(1)}],source,p);return;}if(selected===undefined){s.choice={player:p,title:'Balor · '+String.fromCharCode(65+here.at%5)+(4-Math.floor(here.at/5))+' · '+(here.layer==='below'?'下層':'表面／虛空'),options,frame};return;}queueEffects(s,[{...step,locations:step.locations.slice(1),hits:[...step.hits,{uid:selected.uid,...here}]}],source,p);return;}
  if(step.op==='balorDamage'){for(const hit of step.hits){const u=unit(s,hit.uid);if(u&&!u.dying&&occupied(u).includes(hit.at)&&(u.layer||'surface')===hit.layer)hurt(s,u,2,false,'ability',source);}return;}
  if(step.op==='exchangeLife'){const totals=s.players.map(pl=>pl.life);for(let q=0;q<2;q++){const pl=s.players[q];if(pl.doorTurn!==null)continue;pl.life=totals[1-q];if(pl.life<totals[q])pl.lostLifeTurn=s.turn;if(pl.life===0){pl.doorTurn=s.turn;finalSiteDoorArrived(s,q,ruleAPI(s));}}return;}
  if(step.op==='faerieDiscards'){const n=s.units.filter(u=>!u.dying&&unitTypes(u,s).includes('Faerie')).length;queueEffects(s,[{op:'courtDiscard',player:p,remaining:n},{op:'courtDiscard',player:1-p,remaining:n}],source,p);return;}
  if(step.op==='courtDiscard'){const q=step.player,pl=s.players[q],options=pl.hand.filter(h=>card(h.card).category==='Spell');if(step.remaining<=0||!options.length)return;if(selected===undefined){s.choice={player:q,title:s.players[q].name+' · Unseelie Court · 棄一張法術',options:options.map(h=>({label:card(h.card).name,value:h.uid})),frame};return;}const h=options.find(h=>h.uid===selected);if(h){pl.hand=pl.hand.filter(v=>v.uid!==h.uid);sendCard(s,q,h.card,'cemetery');queueEffects(s,[{...step,remaining:step.remaining-1}],source,p);}return;}
  if(step.op==='warpDeath'){const u=unit(s,step.uid);if(u&&!u.dying)kill(s,u,false,true);return;}
  if(step.op==='iceBind'){const u=unit(s,source.uid);if(u){u.iceTurns=3;u.iceBoundAt=s.turn;}return;}
  if(step.op==='gargCocoon'){const spider=unit(s,source.uid),target=unit(s,step.uid);if(spider&&!spider.dying&&target&&!target.dying&&sameLocation(s,spider,target))target.cocoon=true;return;}
  if(step.op==='percevalSite'){const u=unit(s,source.uid);if(!u||u.dying)return;if(selected===undefined){const options=s.board.flatMap((site,at)=>site?[{label:card(site.card).name+' · '+String.fromCharCode(65+at%5)+(4-Math.floor(at/5)),value:at}]:[]);if(options.length)s.choice={player:1-p,title:s.players[1-p].name+' · Sir Perceval · 選擇一個地點',options,frame};return;}const site=s.board[selected];if(site){if(!site.uid)site.uid='s'+s.next++;spatialSetQuest(s,u,site.uid,source,step,ruleAPI(s));}return;}
  if(step.op==='elementGift'){const u=unit(s,source.uid);if(u){if(step.element)(u.elementGifts||(u.elementGifts=[])).push({element:step.element,amount:step.amount,turn:s.turn});else{u.elementGiftCount=u.elementGiftTurn===s.turn?(u.elementGiftCount||0)+1:1;u.elementGiftTurn=s.turn;}}return;}
  if(step.op==='wiccanGift'){const u=unit(s,source.uid);if(u){u.mods.push({keyword:'Spellcaster',end:s.turn});u.ignoreThresholdTurn=s.turn;}return;}
  if(step.op==='bloodPayment'){s.players[p].bloodManaTurn=s.turn;return;}
  if(step.op==='templeMana'){s.players[p].bonusMana=(s.players[p].bonusMana||0)+2*siteMultiplier(s,source.at);return;}
  if(step.op==='sacrificeUnitCost'){const u=unit(s,step.uid);if(u)kill(s,u,false,true,true);return;}
  if(step.op==='flameStopLife'){heal(s,p,1);loseLife(s,1-p,1);return;}
  if(step.op==='hirePay'){if(selected===null)return;const target=unit(s,step.target),h=s.players[p].hand.find(h=>h.uid===selected.uid);if(target&&!target.dying&&h){s.players[p].hand=s.players[p].hand.filter(v=>v.uid!==h.uid);sendCard(s,p,h.card,'cemetery');bindControl(s,target,p,{});}return;}
  if(step.op==='armySkeleton'){if(canSummonEntry(s,p,card('skeleton'),step.at,step.layer||'surface')&&paySummoningTax(s,card('skeleton').id,p,p)){const u=makeUnit(s,card('skeleton').id,p,step.at);u.layer=step.layer||'surface';summonedGenesis(s,u);}return;}
  if(step.op==='stopDamage'){const u=unit(s,source.uid);if(!u||u.dying)return;const targets=s.units.filter(v=>v.uid!==u.uid&&!v.dying&&sameLocation(s,u,v));if(targets.length)hurt(s,targets[rollIndex(s,targets.map(v=>card(v.card).name))],step.amount,false,'ability',u);return;}
  if(step.op==='marchStart'){queueEffects(s,[{op:'marchStep',direction:step.forward?(p===0?0:2):selected-1,remaining:step.remaining,mode:step.mode}],source,p,frame.effectCard);return;}
  if(step.op==='marchStep'){const u=unit(s,source.uid);if(!u||u.dying||disabled(u))return;const x=u.at%5+[0,1,0,-1][step.direction],y=Math.floor(u.at/5)+[-1,0,1,0][step.direction],at=y*5+x;if(x<0||x>4||y<0||y>3||!locations(s,u,card,keywords,true).some(v=>v.at===at&&v.layer===(u.layer||'surface')&&v.path.length===1))return;u.at=at;u.notRest=true;u.burrowedSafely=false;queueEffects(s,[{op:'marchImpact',mode:step.mode},...(step.remaining>1?[{...step,remaining:step.remaining-1}]:[])],u,p,frame.effectCard);return;}
  if(step.op==='marchImpact'){const u=unit(s,source.uid);if(!u||u.dying)return;const targets=s.units.filter(v=>v.uid!==u.uid&&!v.dying&&sameLocation(s,u,v)&&(step.mode!=='bull'||!v.tapped));if(step.mode==='bull')for(const v of targets.reverse())queueEffects(s,[{op:'strike',untargeted:true,select:{kind:'unit',uids:[v.uid],anyRegion:true,untargeted:true}}],u,p,frame.effectCard);else if(targets.length)queueEffects(s,[{op:'strike',untargeted:true,select:{kind:'unit',uids:targets.map(v=>v.uid),anyRegion:true,untargeted:true}}],u,p,frame.effectCard);return;}
  if(step.op==='triggerSiteGenesis'){const site=s.board[selected.at];if(site&&!site.silenced&&!site.disabled)queueEffects(s,definitions[card(site.card).slug]?.genesis||[],{...site,at:selected.at,uid:site.uid||'site:'+selected.at,layer:'surface'},site.controller);return;}
  if(step.op==='forcedFlyUnit'){const u=unit(s,selected.uid);if(u&&!u.dying)queueEffects(s,[{op:'forcedFlyChoice',uid:u.uid}],source,p,frame.effectCard);return;}
  if(step.op==='forcedFlyChoice'){const u=unit(s,step.uid);if(!u||u.dying||!siteEffectAllowed(s,u,'move',{card}))return;const options=s.board.flatMap((site,at)=>site&&at!==u.at&&nearby(s,u.at,at)&&(u.size!==2||at%5<4&&at<15)&&occupied({...u,at}).every((cell,i)=>canEnterOnGround(s,u,{at:occupied(u)[i],layer:u.layer||'surface'},{at:cell,layer:'surface'},card,keywords,false,true))?[{label:String.fromCharCode(65+at%5)+(4-Math.floor(at/5)),value:at}]:[]);if(selected===undefined){if(options.length)s.choice={player:p,title:'選擇附近地點飛送至上方',options,frame};return;}if(options.some(o=>o.value===selected)){u.carryFlying=true;u.at=selected;u.layer='surface';u.notRest=true;u.burrowedSafely=false;}return;}
  if(step.op==='rapidsUnit'){const u=unit(s,selected.uid);if(u&&!u.dying)queueEffects(s,[{op:'rapidsPush',uid:u.uid}],source,p,frame.effectCard);return;}
  if(step.op==='rapidsPush'){const u=unit(s,step.uid);if(!u||u.dying||!siteEffectAllowed(s,u,'move',{card}))return;const options=Array.from({length:20},(_,at)=>at).filter(at=>distance(s,u.at,at)===1&&(u.size!==2||at%5<4&&at<15)&&occupied({...u,at}).every((cell,i)=>regionsOverlap(s,{at:cell,layer:u.layer},{at:occupied(u)[i],layer:u.layer})&&canEnterOnGround(s,u,{at:occupied(u)[i],layer:u.layer||'surface'},{at:cell,layer:u.layer||'surface'},card,keywords)));if(selected===undefined){if(options.length)s.choice={player:p,title:'River Rapids · 推動一步',options:options.map(at=>({label:String.fromCharCode(65+at%5)+(4-Math.floor(at/5)),value:at})),frame};return;}if(options.includes(selected)){u.at=selected;u.notRest=true;u.burrowedSafely=false;}return;}
  if(step.op==='faeDirection'){if(selected!==null)commitSite(s,{...step.action,direction:selected},step.ally);return;}
  if(step.op==='faeShoot'){queueEffects(s,[{op:'projectile',amount:1}],source,p,frame.effectCard);s.storyline[s.storyline.length-1].selected=step.direction;return;}
  if(step.op==='salmonD20'){const fish=unit(s,step.salmon),roll=rollIndex(s,Array.from({length:20},(_,i)=>String(i+1)))+1;log(s,'Salmon of Knowledge · d20 = '+roll);if(roll>=14&&fish&&!fish.dying){kill(s,fish,true);queueEffects(s,Array.from({length:3},()=>({op:'drawOne',deck:'spells'})),source,p,frame.effectCard);}return;}
  if(step.op==='sporeCasting'){s.players[p].sporeCastTurn=s.turn;return;}
  if(step.op==='sarcophagusPair'){const all=[0,1].flatMap(player=>effectGraves(s,player,p)).filter(g=>card(g.card).category==='Spell'),pairs=all.filter(g=>all.some(v=>v.uid!==g.uid&&v.card===g.card));if(selected===undefined){if(pairs.length)s.choice={player:p,title:'Sphinx Sarcophagus · 選擇兩張同名法術',options:pairs.map(g=>({label:card(g.card).name+' · 玩家 '+(g.player+1),value:g})),frame};return;}if(!step.first){const options=all.filter(g=>g.card===selected.card&&g.uid!==selected.uid);if(options.length)s.choice={player:p,title:'選擇另一張同名法術',options:options.map(g=>({label:card(g.card).name+' · 玩家 '+(g.player+1),value:g})),frame:{...frame,step:{...step,first:selected}}};return;}const picks=[step.first,selected];if(picks.every(g=>graveEntries(s,g.player).some(v=>v.uid===g.uid&&v.card===g.card))){for(const pick of picks){const g=graveEntries(s,pick.player).find(v=>v.uid===pick.uid);takeGrave(s,g.player,g.index,g.card,g.uid);s.players[g.player].banished.push(g.card);}queueEffects(s,[{op:'drawCards',count:1}],source,p,frame.effectCard);}return;}
  if(step.op==='camlannChoose'){if(resources(s,p).fire<3&&!step.started)return;const remaining=step.remaining||[1-s.active,s.active],kept=[...step.kept||[],...(selected?[selected.uid]:[])];if(!remaining.length){const victims=s.units.filter(u=>!u.dying&&card(u.card).type==='Minion'&&!kept.includes(u.uid)).sort((a,b)=>(a.controller===s.active)-(b.controller===s.active));for(const u of victims)kill(s,u);return;}const next=remaining[0],options=selectEffects(s,{...frame,controller:next},{kind:'unit',minion:true,ally:true,anyRegion:true,untargeted:true,protectionReadOnly:true});if(options.length)s.choice={player:next,title:'Fields of Camlann · 選擇保留一個僕從',options,frame:{...frame,step:{...step,started:true,remaining:remaining.slice(1),kept}}};else queueEffects(s,[{...step,started:true,remaining:remaining.slice(1),kept}],source,p,frame.effectCard);return;}
  if(step.op==='frontierPlay'){const u=unit(s,source.uid),id=s.players[p].atlas[0];if(!u||!id||!siteTargetsForFrontier(s,u).includes(selected.at)||!geometryPlaceSiteAllowed(s,card(id),selected.at,card))return;s.players[p].atlas.shift();log(s,'Frontier Settlers 揭示 '+card(id).name+'。');queueEffects(s,[{op:'frontierMove',uid:u.uid,at:selected.at,layer:u.layer||'surface'}],source,p,frame.effectCard);enterSite(s,p,id,selected.at);return;}
  if(step.op==='frontierMove'){const u=unit(s,step.uid);if(u&&!u.dying&&canEnterOnGround(s,u,u,{at:step.at,layer:step.layer},card,keywords)){u.at=step.at;u.layer=step.layer;u.notRest=true;u.burrowedSafely=false;}return;}
  if(step.op==='hutSwap'){if(emptySite(s,selected.at))exchangeSites(s,source.at,selected.at);return;}
  if(step.op==='proceedEnd'){if(!['end','endRequested','over'].includes(s.phase)){s.phase='endRequested';s.storyline.unshift({source:clone(avatar(s,s.active)),controller:s.active,effectCard:source.card,step:{op:'beginEnd'}});}return;}
  if(step.op==='beginEnd'){beginEndPhase(s,s.active);return;}
  if(step.op==='weddingVictory'){const site=s.board[source.at];if(site?.card===source.card&&!site.silenced&&!site.disabled&&['king_arthur','queen_guinevere'].every(slug=>s.units.some(u=>!u.dying&&card(u.card).slug===slug&&occupied(u).includes(source.at)))){s.winner=p;s.phase='over';log(s,'Wedding Hall：Arthur 與 Guinevere 同在，'+s.players[p].name+' 獲勝。');}return;}
  if(step.op==='chooseCompanion'){const u=unit(s,source.uid);if(u)u.companion=selected.uid;return;}
  if(step.op==='wardTransferFrom'){const from=selected.entity==='site'?s.board[selected.at]:unit(s,selected.uid);if(from?.ward)queueEffects(s,[{op:'wardTransferTo',from:selected,untargeted:true,select:{kind:'wardable',nearby:true,nonEvil:true,untargeted:true}}],source,p,frame.effectCard);return;}
  if(step.op==='wardTransferTo'){const from=step.from.entity==='site'?s.board[step.from.at]:unit(s,step.from.uid),to=selected.entity==='site'?s.board[selected.at]:unit(s,selected.uid);if(from?.ward&&to){from.ward=false;to.ward=true;}return;}
  if(step.op==='commitPairSites'){if(selected!==null){const actor=unit(s,step.action.unit),filter=liveUnitAbility(s,step.action).steps[0].select,options=selectEffects(s,{source:actor,controller:p},filter);if(options.some(o=>o.value.at===step.first.at)&&options.some(o=>o.value.at===selected.at)&&step.first.at!==selected.at)commitAbility(s,{...step.action,pairSitesDeclared:true,pairSecond:selected},step.first);}return;}
  if(step.op==='swapEmptySites'){if(step.second&&emptySite(s,selected.at)&&emptySite(s,step.second.at))exchangeSites(s,selected.at,step.second.at);return;}
  if(step.op==='abyssDestination'){const u=unit(s,step.uid);if(!u||u.dying)return;const options=[];if((u.layer||'surface')==='surface'&&occupied(u).every(at=>waterSite(s,at,card)))options.push({label:'潛入目前水地點',value:{at:u.at,layer:'below'}});for(let at=0;at<20;at++)if(distance(s,u.at,at)===1&&(u.size!==2||at%5<4&&at<15)&&occupied({...u,at}).some(cell=>!occupied(u).includes(cell)&&!s.board[cell])&&occupied({...u,at}).every((cell,i)=>canEnterOnGround(s,u,{at:occupied(u)[i],layer:u.layer||'surface'},{at:cell,layer:'surface'},card,keywords)))options.push({label:'拉入虛空 · '+String.fromCharCode(65+at%5)+(4-Math.floor(at/5)),value:{at,layer:'surface'}});if(selected===undefined){if(options.length)s.choice={player:p,title:'Into the Abyss · 選擇下潛或虛空',options,frame};return;}if(options.some(o=>eq(o.value,selected)))queueEffects(s,[{op:'dragStep',uid:u.uid,from:{at:u.at,layer:u.layer||'surface'},to:selected,ignoreRegions:true}],source,p,frame.effectCard);return;}
  if(step.op==='commitPairAbility'){if(selected!==null)commitAbility(s,{...step.action,pairDeclared:true,pairSecond:selected},step.first);return;}
  if(step.op==='shatterDeclare'){if(selected!==null)commitSpell(s,{...step.action,shatterTarget:selected},step.ally);return;}
  if(step.op==='kissersChoice'){if(selected===undefined){const options=selectEffects(s,frame,{kind:'unit',minion:true,wounded:true,nearby:true});s.choice={player:p,title:'Kissers of Wounds',options:[...options,{label:'治療你 2 點生命',value:'heal'}],frame};return;}if(selected==='heal')heal(s,p,2);else{const u=unit(s,selected.uid);targetDeclared(s,source,selected);if(u&&!blocked(s,p,u)&&!unitUmbrellas(u,s).includes('Evil'))u.ward=true;}return;}
  if(step.op==='instigatorPlace'){const uids=s.units.filter(u=>!u.dying&&u.controller!==p&&occupied(u).includes(selected.at)&&(u.layer||'surface')===selected.layer).map(u=>u.uid);if(uids.length>=2)queueEffects(s,[{op:'pairFirst',untargeted:true,select:{kind:'unit',uids,anyRegion:true,untargeted:true}}],source,p,frame.effectCard);return;}
  if(step.op==='pairFirst'){const first=unit(s,selected.uid);if(!first||first.dying)return;const uids=s.units.filter(u=>u.uid!==first?.uid&&!u.dying&&u.controller!==p&&sameLocation(s,u,first)).map(u=>u.uid);if(first&&uids.length)queueEffects(s,[{op:'pairFight',first:first.uid,untargeted:true,select:{kind:'unit',uids,anyRegion:true,untargeted:true}}],source,p,frame.effectCard);return;}
  if(step.op==='pairFight'||step.op==='liesFight'){const first=unit(s,step.first),second=unit(s,selected.uid);if(first&&!first.dying&&second&&!second.dying&&sameLocation(s,first,second)){if(step.op==='liesFight'&&blocked(s,p,second))return;fight(s,{attacker:first.uid,defenders:[second.uid],kind:'spell'});}return;}
  if(step.op==='replicaPlace'){if(selected===undefined){const options=[...selectEffects(s,frame,{kind:'location'}),...selectEffects(s,frame,{kind:'unit',ally:true,anyRegion:true,untargeted:true})];s.choice={player:p,title:'Replication · 選擇複製品出現位置',options,frame};return;}const bearer=selected.entity==='unit'?unit(s,selected.uid):null;if(selected.entity==='unit'&&!bearer)return;const a={uid:'o'+s.next++,card:finalArchivePrintedCard(step.card,ruleAPI(s)),owner:p,controller:p,tokenCopy:true,at:bearer?.at??selected.at,layer:bearer?.layer||selected.layer||'surface',bearer:bearer?.uid||null};s.artifacts.push(a);refreshContinuous(s);if(!a.silenced)queueEffects(s,definitions[card(a.card).slug]?.genesis||[],a,p);return;}
  if(step.op==='seerPeek'){if(selected===undefined){s.choice={player:p,title:'Seer · 查看哪一副牌庫的頂牌？',options:[{label:'Atlas 地點',value:'atlas'},{label:'Spellbook 法術',value:'spells'}],frame};return;}queueEffects(s,[{op:'peekSpell',deck:selected}],source,p,frame.effectCard);return;}
  if(step.op==='divineBreak'){if(selected===null){queueEffects(s,[{op:'divineHit',at:step.at,amount:step.amount}],source,p,frame.effectCard);return;}let amount=step.amount;if(selected){const ward=selected.entity==='unit'?unit(s,selected.uid):s.board[selected.at];if(ward?.ward){ward.ward=false;amount++;}}const options=selectEffects(s,frame,{kind:'wardMark',ally:true,anyRegion:true,untargeted:true});if(options.length)s.choice={player:p,title:'Divine Lance · 可打破盟友 Ward 增加傷害（目前 '+amount+'）',options:[...options,{label:'開始造成傷害',value:null}],frame:{...frame,step:{...step,amount}}};else queueEffects(s,[{op:'divineHit',at:step.at,amount}],source,p,frame.effectCard);return;}
  if(step.op==='divineHit'){for(const u of s.units)if(!u.dying&&card(u.card).type==='Minion'&&occupied(u).includes(step.at))hurt(s,u,step.amount,false,'magic',source);return;}
  if(step.op==='stoneRainHit'){if(step.remaining<=0)return;damageSite(s,step.at,1);for(const u of s.units)if(!u.dying&&(u.layer||'surface')==='surface'&&occupied(u).includes(step.at))hurt(s,u,1,false,'magic',source);if(step.remaining>1)queueEffects(s,[{...step,remaining:step.remaining-1}],source,p,frame.effectCard);return;}
  if(step.op==='pithSteal'){const hand=s.players[1-p].hand.filter(h=>card(h.card).category==='Spell');if(hand.length){const h=hand[rollIndex(s,hand.map(h=>card(h.card).name))];s.players[1-p].hand=s.players[1-p].hand.filter(v=>v.uid!==h.uid);(s.boundSpells||(s.boundSpells=[])).push({uid:'b'+s.next++,card:h.card,owner:1-p,unit:source.uid,requiresSpellcaster:true,returnToHand:true});log(s,'Pith Imp 揭示並偷走 '+card(h.card).name+'。');}return;}
  if(step.op==='hyenaFeast'){if(selected===null)return;const options=selectEffects(s,frame,{kind:'grave',includeUnsupported:true});if(selected===undefined){if(step.remaining>0&&options.length)s.choice={player:p,title:'Redmane Hyena · 最多再放逐 '+step.remaining+' 張',options:[...options,{label:'完成',value:null}],frame};return;}const g=graveEntries(s,selected.player).find(g=>g.uid===selected.uid);if(g){takeGrave(s,g.player,g.index,g.card,g.uid);s.players[g.player].banished.push(g.card);const u=unit(s,source.uid);if(u&&!u.hyenaDemon&&cardForPlayer(s,g.card,g.player).subtypes.includes('Demon')){u.hyenaDemon=true;u.mods.push({power:2,types:['Demon']});}if(step.remaining>1)queueEffects(s,[{...step,remaining:step.remaining-1}],source,p,frame.effectCard);}return;}
  if(step.op==='konrulChoose'){if(selected===null)return;const picks=[...step.picks,...(selected?[selected.uid]:[])],options=selectEffects(s,frame,{kind:'grave',own:true,minion:true,includeUnsupported:true}).filter(o=>!picks.includes(o.value.uid));if(picks.length===3){queueEffects(s,[{op:'konrulReturn',picks}],source,p,frame.effectCard);return;}if(options.length>=3-picks.length)s.choice={player:p,title:'Xeraphine Konrul · 選擇三張死去僕從（'+picks.length+'/3）',options:[...options,...(!picks.length?[{label:'略過',value:null}]:[])],frame:{...frame,step:{...step,picks}}};return;}
  if(step.op==='konrulReturn'){const graves=yourGraves(s,p).filter(g=>step.picks.includes(g.uid));if(graves.length!==3)return;if(selected===undefined){s.choice={player:p,title:'放逐另外兩張，將此張返回手牌',options:graves.map(g=>({label:card(g.card).name,value:g.uid})),frame};return;}for(const uid of step.picks){const g=yourGraves(s,p).find(g=>g.uid===uid);if(g){takeGrave(s,g.player,g.index,g.card,g.uid,p);if(g.uid===selected)s.players[g.player].hand.push({uid:'h'+s.next++,card:g.card});else s.players[g.player].banished.push(g.card);}}return;}
  if(step.op==='thiefSteal'){const thief=unit(s,source.uid),target=unit(s,step.target);if(!thief||thief.dying||!target||!sameLocation(s,thief,target))return;const artifacts=s.artifacts.filter(a=>artifactIsCarriedBy(a,target.uid)&&carriable(card(a.card)));if(selected===undefined){if(artifacts.length)s.choice={player:p,title:'Sneak Thief · 偷取一件 Artifact',options:artifacts.map(a=>({label:card(a.card).name,value:a.uid})),frame};return;}const a=artifacts.find(a=>a.uid===selected);if(a){a.bearer=thief.uid;a.at=thief.at;a.layer=thief.layer||'surface';}return;}
  if(step.op==='oneShotChoice'){if(selected===undefined){s.choice={player:p,title:'One-Shot Wizard',options:[{label:'發射傷害 1 的投射物',value:'shot'},{label:'本回合獲得 Spellcaster',value:'caster'}],frame};return;}if(selected==='caster'){const u=unit(s,source.uid);if(u)u.mods.push({keyword:'Spellcaster',end:s.turn});}else queueEffects(s,[{op:'projectile',amount:1}],source,p,frame.effectCard);return;}
  if(step.op==='seedVoid'){if(selected===null)return;if(selected===undefined){const options=s.board.flatMap((site,at)=>!site?[{label:String.fromCharCode(65+at%5)+(4-Math.floor(at/5)),value:at}]:[]);if(options.length&&step.remaining>0)s.choice={player:p,title:'Star Seeds of Uhr · 還可填入 '+step.remaining+' 格',options:[...options,{label:'完成',value:null}],frame};return;}if(!s.board[selected]&&geometryPlaceSiteAllowed(s,card('rubble'),selected,card)){s.board[selected]={uid:'s'+s.next++,card:card('rubble').id,owner:null,controller:null,ward:false};if(step.remaining>1)queueEffects(s,[{...step,remaining:step.remaining-1}],source,p,frame.effectCard);}return;}
  if(step.op==='assaultAlly'&&card(frame.effectCard).slug==='abyssal_assault'&&resolveCatalogMagic(s,frame,ruleAPI(s)))return;
  if(step.op==='shatterAlly'||step.op==='assaultAlly'){const u=unit(s,selected.uid);if(!u||u.dying)return;if(step.op==='shatterAlly'){queueEffects(s,[{op:'shatterEnemy',select:{kind:'unit',enemy:true,adjacent:true}}],u,p,frame.effectCard);if(step.shatterTarget)s.storyline[s.storyline.length-1].selected=step.shatterTarget;}else if(power(u)>0)queueEffects(s,[{op:'assaultPoint',remaining:power(u),optional:true,untargeted:true,select:{kind:'unit',nearby:true,untargeted:true}}],u,p,frame.effectCard);return;}
  if(step.op==='assaultPoint'){const u=unit(s,source.uid),target=unit(s,selected?.uid);if(!u||u.dying||!target)return;startEvent(s,u,u.card);hurt(s,target,1,false,'ability',u);if(step.remaining>1)queueEffects(s,[{...step,remaining:step.remaining-1}],u,p,frame.effectCard);return;}
  if(step.op==='shatterArtifact'){const u=unit(s,source.uid),target=unit(s,step.target);if(!u||u.dying||!target||target.dying)return;const artifacts=s.artifacts.filter(a=>artifactIsCarriedBy(a,target.uid));if(selected===undefined&&artifacts.length){s.choice={player:p,title:'Shatter Strike · 摧毀一件攜帶中的 Artifact',options:artifacts.map(a=>({label:card(a.card).name,value:a.uid})),frame};return;}const a=artifacts.find(a=>a.uid===selected);if(a)removeObject(s,a,'cemetery');queueEffects(s,[{op:'shatterHit',uid:target.uid}],u,p,frame.effectCard);return;}
  if(step.op==='shatterHit'){const u=unit(s,source.uid),target=unit(s,step.uid);if(u&&!u.dying&&target&&!target.dying&&distance(s,u.at,target.at)===1&&regionsOverlap(s,u,target))strike(s,u,target);return;}
  if(step.op==='puppetControl'){for(const u of s.units)if(card(u.card).type==='Minion'&&u.tapped&&!u.dying&&sameLocation(s,u,source))bindControl(s,u,p,{source:source.uid});return;}
  if(step.op==='infiltrateControl'){const u=unit(s,step.uid);if(u?.stealth)bindControl(s,u,p,{untilStealth:true});return;}
  if(step.op==='sacrificeRelic'){const a=s.artifacts.find(a=>a.uid===step.uid);if(a)removeObject(s,a,'cemetery');return;}
  if(step.op==='greedSnatch'){const u=unit(s,source.uid);if(!u||u.dying)return;const items=s.artifacts.filter(a=>carriable(card(a.card))&&a.bearer!==u.uid);if(!items.length)return;if(selected===undefined){s.choice={player:p,title:'Lord of Greed · 必須取得一件可攜帶物品',options:items.map(a=>({label:card(a.card).name,value:a.uid})),frame};return;}const a=items.find(a=>a.uid===selected);if(a){a.bearer=u.uid;a.at=u.at;a.layer=u.layer||'surface';}return;}
  if(step.op==='artifactRepel'){const a=s.artifacts.find(a=>a.uid===source.uid);if(a)for(const u of [...s.units])if(card(u.card).type==='Minion'&&sameLocation(s,u,a)&&(step.evil&&unitUmbrellas(u,s,p).includes('Evil')||step.airborne&&keywords(u).includes('Airborne')))leaveUnit(s,u,'hand');return;}
  if(step.op==='deathGenesisKeywords'){const u=unit(s,source.uid);if(u&&printedKeywords(card(u.card)).includes('Lance'))acquireLance(s,u,p);return;}
  if(step.op==='dispelSelfAura'){const a=s.auras.find(a=>a.uid===source.uid);if(a)removeObject(s,a,'cemetery');return;}
  if(step.op==='auraCull'){const a=s.auras.find(a=>a.uid===source.uid);if(!a)return;const pool=s.units.filter(u=>!u.dying&&card(u.card).type==='Minion'&&occupied(u).some(at=>s.board[at]&&inside(a,at))),value=step.strongest?Math.max(...pool.map(u=>power(u))):Math.min(...pool.map(u=>power(u))),options=pool.filter(u=>power(u)===value);if(!options.length){removeObject(s,a,'cemetery');return;}if(selected===undefined&&options.length>1){s.choice={player:p,title:step.strongest?'Great Famine · 選擇並列最強僕從':'Black Plague · 選擇並列最弱僕從',options:options.map(u=>({label:card(u.card).name,value:u.uid})),frame};return;}const u=selected?options.find(u=>u.uid===selected):options[0];if(u){queueEffects(s,[{op:'auraCullCheck',uid:u.uid}],source,p);kill(s,u);}return;}
  if(step.op==='auraCullCheck'){if(!(s.deathHistory||[]).some(d=>d.uid===step.uid)){const a=s.auras.find(a=>a.uid===source.uid);if(a)removeObject(s,a,'cemetery');}return;}
  if(step.op==='cursedIronEnd'){const a=s.auras.find(a=>a.uid===source.uid);if(!a)return;for(const item of s.artifacts.filter(o=>o.bearer&&catalogAuraHere(a,o,inside))){const u=unit(s,item.bearer);if(u&&!u.dying){startEvent(s,item,item.card);hurt(s,u,1,false,'ability',item);}}return;}
  if(step.op==='ainoStep'){const u=unit(s,source.uid);if(!u||u.dying||disabled(u))return;const options=locations(s,{...u,verticalWrap:true},card,keywords,true).filter(v=>v.path.length===1&&Math.abs(Math.floor(v.at/5)-Math.floor(u.at/5))===3);if(!options.length)return;if(selected===undefined){s.choice={player:p,title:'Aino · 可跨越上下邊界一步並獲得 Stealth',options:[...options.map(v=>({label:String.fromCharCode(65+v.at%5)+(4-Math.floor(v.at/5)),value:{at:v.at,layer:v.layer}})),{label:'不移動',value:null}],frame:{...frame,step:{...step,may:true}}};return;}if(selected&&options.some(v=>v.at===selected.at&&v.layer===selected.layer)){u.at=selected.at;u.layer=selected.layer;u.stealth=true;}return;}
  if(step.op==='playTypedSite'){const options=s.players[p].hand.filter(h=>card(h.card).type==='Site'&&(card(h.card).water>0)===step.water&&siteTargets(s,p,card(h.card)).length);if(selected===undefined){if(!options.length)return;s.choice={player:p,title:'可打出一張'+(step.water?'水':'陸地')+'地點',options:[...options.map(h=>({label:card(h.card).name,value:h.uid})),{label:'不打出地點',value:null}],frame:{...frame,step:{...step,may:true}}};return;}if(selected===null)return;const h=options.find(h=>h.uid===selected);if(h)queueEffects(s,[{op:'playTypedSiteAt',hand:h.uid,card:h.card}],source,p);return;}
  if(step.op==='playTypedSiteAt'){const h=s.players[p].hand.find(h=>h.uid===step.hand&&h.card===step.card);if(!h)return;const options=siteTargets(s,p,card(h.card));if(!options.length)return;if(selected===undefined){s.choice={player:p,title:'選擇打出地點的位置',options:options.map(at=>({label:String.fromCharCode(65+at%5)+(4-Math.floor(at/5)),value:at})),frame};return;}if(options.includes(selected)){s.players[p].hand=s.players[p].hand.filter(v=>v.uid!==h.uid);enterSite(s,p,h.card,selected);}return;}
  if(step.op==='portalFirst'){const site=s.board[selected.at];if(site){if(!site.uid)site.uid='s'+s.next++;queueEffects(s,[{op:'portalSecond',first:site.uid,untargeted:true,select:{kind:'site',excludeAt:selected.at,untargeted:true}}],source,p);}return;}
  if(step.op==='portalSecond'){const site=s.board[selected.at];if(site&&s.board.some(v=>v?.uid===step.first)){if(!site.uid)site.uid='s'+s.next++;(s.ongoingEffects||(s.ongoingEffects=[])).push({op:'pairedSites',siteUids:[step.first,site.uid],end:s.turn});}return;}
  if(step.op==='knighthoodAlly'){const u=unit(s,selected.uid);if(u)queueEffects(s,[{op:'searchSummon',zones:['hand'],types:['Knight','Sir','Dame'],includeUmbrellas:true}],u,p,frame.effectCard);return;}
  if(step.op==='conjureBroken'){const g=graveEntries(s,selected.player).find(g=>g.uid===selected.uid&&g.card===selected.card);if(g){takeGrave(s,g.player,g.index,g.card,g.uid);const a={uid:'o'+s.next++,card:g.card,owner:g.player,controller:p,bearer:null,at:source.at,layer:source.layer||'surface'};s.artifacts.push(a);queueEffects(s,definitions[card(g.card).slug]?.genesis||[],a,p);}return;}
  if(step.op==='chooseDeathReplacement'){const u=unit(s,step.uid);if(!u)return;const options=deathReplacements(s,u);if(selected===undefined&&options.length>1){s.choice={player:u.controller,title:'選擇死亡替代效果',options:options.map(o=>({label:o.label,value:o})),frame};return;}delete u.deathReplacementPending;const option=selected?options.find(o=>o.uid===selected.uid):options[0];if(option)replaceDeath(s,u,option);else kill(s,u,false,step.death);return;}
  if(step.op==='wakeHollow'){const u=unit(s,step.uid);if(u){if(step.instance){if(step.nature==='gained'&&step.generation!==undefined&&(!u.hollowWakeActiveSources?.[step.instance]||u.hollowWakeGenerations?.[step.instance]!==step.generation))return;(u.awakenedByDeathSources||(u.awakenedByDeathSources={}))[step.instance]=true;(u.awakenedByDeathSourceOrigins||(u.awakenedByDeathSourceOrigins={}))[step.instance]=step.origin||frame.abilityOrigin||source.abilityOrigin||source.card;}if(!step.instance||step.nature==='printed')u.awakenedByDeath=true;}return;}
  if(step.op==='nosferatuReturn'){const old=unit(s,source.uid),at=p===0?17:2;if(!old||!s.board[at]||!canSummonEntry(s,p,card(old.card),at,'below'))return;const id=old.originalCard||old.card,owner=old.owner;leaveUnit(s,old,'resummon');if(paySummoningTax(s,id,owner,p)){const u=makeUnit(s,id,owner,at);u.controller=p;u.layer='below';u.nosferatuTurn=s.turn;summonedGenesis(s,u);}return;}
  if(step.op==='sphinxSwap'){const deck=s.players[p].spells;if(deck.length<2)return;if(selected===undefined){s.choice={player:1-p,title:'Riddle Sphinx · 可交換對手 Spellbook 頂牌與底牌',options:[{label:'交換頂牌與底牌',value:true},{label:'不交換',value:null}],frame:{...frame,step:{...step,may:true}}};return;}if(selected===true)[deck[0],deck[deck.length-1]]=[deck[deck.length-1],deck[0]];return;}
  if(step.op==='revealSummonTop'){const owner=step.opponent?1-p:p,deck=s.players[owner].spells,id=deck[0];if(!id)return;log(s,'揭示 '+card(id).name);if(card(id).type==='Minion'&&card(id).playable){if(step.maySummon)queueEffects(s,[{op:'summonRevealedTop',owner,card:id,optional:true}],source,p);else queueEffects(s,[{op:'summonRevealedTop',owner,card:id}],source,p);}else if(step.bottomOther)deck.push(deck.shift());return;}
  if(step.op==='summonRevealedTop'){const deck=s.players[step.owner].spells;if(deck[0]!==step.card||!canSummonEntry(s,p,card(step.card),source.at,source.layer||'surface'))return;deck.shift();if(paySummoningTax(s,step.card,step.owner,p)){const u=makeUnit(s,step.card,step.owner,source.at);u.controller=p;u.layer=source.layer||'surface';summonedGenesis(s,u);}return;}
  if(step.op==='summonTopFive'){const deck=s.players[p].spells,revealed=deck.splice(0,5),remaining=[],summoned=[];log(s,'揭示 '+revealed.map(id=>card(id).name).join('、'));for(const id of revealed){if(s.board[source.at]&&card(id).slug===step.slug&&card(id).playable&&canSummonEntry(s,p,card(id),source.at,'surface')){if(paySummoningTax(s,id,p,p))summoned.push(makeUnit(s,id,p,source.at));}else remaining.push(id);}for(let i=remaining.length-1;i>0;i--){const j=rollIndex(s,remaining.slice(0,i+1).map(id=>card(id).name));[remaining[i],remaining[j]]=[remaining[j],remaining[i]];}deck.push(...remaining);refreshContinuous(s);for(const u of summoned.reverse())summonedGenesis(s,u);return;}
  if(step.op==='drawOne'){draw(s,p,step.deck);return;}
  if(step.op==='chainsTap'){const pool=s.units.filter(u=>!u.dying&&u.controller===p&&card(u.card).type==='Minion'&&!u.tapped),best=Math.max(...pool.map(u=>power(u))),targets=pool.filter(u=>power(u)===best);if(!targets.length)return;if(selected===undefined){if(targets.length===1){targets[0].tapped=true;return;}s.choice={player:p,title:'Chains of Prometheus · 橫置最強的未橫置僕從',options:targets.map(u=>({label:card(u.card).name,value:u.uid})),frame};return;}const u=targets.find(u=>u.uid===selected);if(u)u.tapped=true;return;}
  if(step.op==='queenCatchup'){if(s.players[step.opponent].hand.length>s.players[p].hand.length)queueEffects(s,[{op:'drawCards',count:1,optional:true}],source,p);return;}
  if(step.op==='treasuresScatter'){const a=s.artifacts.find(a=>a.uid===step.uid);if(a){a.bearer=null;a.at=rollIndex(s,Array.from({length:20},(_,i)=>String.fromCharCode(65+i%5)+(4-Math.floor(i/5))));a.layer='surface';}return;}
  if(step.op==='succubusLure'||step.op==='nixieLure'){const u=unit(s,selected.uid);if(u&&!blocked(s,p,u)){const steps=[];if(!sameLocation(s,u,source))steps.push({op:'unitStep',uid:u.uid,toward:{at:source.at,layer:source.layer||'surface'}});steps.push({op:step.op==='succubusLure'?'succubusArrive':'tapSummoned',uid:u.uid});queueEffects(s,steps,source,p);}return;}
  if(step.op==='succubusArrive'){const u=unit(s,step.uid),caster=unit(s,source.uid);if(u&&caster&&!u.dying&&sameLocation(s,u,caster)){hurt(s,u,2,false,'ability',caster);heal(s,p,2);}return;}
  if(step.op==='toadDrag'){const u=unit(s,selected.uid);if(u&&!blocked(s,p,u))queueEffects(s,[{op:'dragStep',uid:u.uid,from:{at:u.at,layer:u.layer||'surface'},to:{at:source.at,layer:source.layer||'surface'}},{op:'dragStrike',target:u.uid,optional:true}],source,p);return;}
  if(step.op==='dragStrike'){const u=unit(s,source.uid),target=unit(s,step.target);if(u&&target&&!u.dying&&!target.dying&&sameLocation(s,u,target))strike(s,u,target);return;}
  if(step.op==='anglerLure'){const caster=unit(s,source.uid);if(caster?.layer==='below'&&waterSite(s,caster.at,card))for(const u of [...s.units].reverse())if(!u.dying&&u.controller!==p&&card(u.card).type==='Minion'&&(u.layer||'surface')==='surface'&&occupied(u).some(at=>s.board[at]&&distance(s,at,caster.at)===1))queueEffects(s,[{op:'unitStep',uid:u.uid,toward:{at:caster.at,layer:'below'}}],caster,p);return;}
  if(step.op==='halveMaxLife'){for(let player=0;player<s.players.length;player++){const pl=s.players[player];pl.maxLife=Math.floor(pl.maxLife/2);if(pl.life>pl.maxLife)loseLife(s,player,pl.life-pl.maxLife);}return;}
  if(step.op==='devilPact'){
    const caster=unit(s,source.uid),object=(s.artifacts||[]).find(a=>a.uid===source.uid),site=String(source.uid).startsWith('site:')&&s.board[source.at];
    const canSacrifice=caster&&!caster.dying&&card(caster.card).type==='Minion'||object||site;
    if(selected===undefined){s.choice={player:p,title:'Pact with the Devil',options:[{label:'失去一半生命（向上取整），抽三張法術',value:'life'},...(canSacrifice?[{label:'犧牲施法者，抽三張法術',value:'sacrifice'}]:[])],frame};return;}
    if(selected==='life')loseLife(s,p,Math.ceil(s.players[p].life/2));else if(!canSacrifice)return;
    queueEffects(s,[{op:'drawCards',count:3},...(selected==='sacrifice'?[{op:'pactSacrifice'}]:[])],source,p,frame.effectCard);return;
  }
  if(step.op==='pactSacrifice'){const caster=unit(s,source.uid),object=(s.artifacts||[]).find(a=>a.uid===source.uid);if(caster)kill(s,caster,false,true,true);else if(object)removeObject(s,object,'cemetery');else if(String(source.uid).startsWith('site:')&&s.board[source.at]?.card===source.card)destroySite(s,source.at,true);return;}
  if(step.op==='powerwishSacrifice'){const victims=s.units.filter(u=>!u.dying&&card(u.card).type==='Minion');for(let player=0;player<s.players.length;player++){const av=avatar(s,player),count=victims.filter(u=>u.controller===player).length;if(av&&count)av.mods.push({power:count});}for(const u of victims)kill(s,u,false,true,true);return;}
  if(step.op==='chorusDiscard'){const player=step.player;if(selected===undefined){const options=selectEffects(s,{...frame,controller:player},{kind:'hand'});if(options.length)s.choice={player,title:'Chorus of Condemnation · 棄一張牌',options,frame};return;}const pl=s.players[player],h=pl.hand.find(h=>h.uid===selected.uid);if(h){pl.hand=pl.hand.filter(h=>h.uid!==selected.uid);sendCard(s,player,h.card,'cemetery');}return;}
  if(step.op==='harpoonPull'){const u=unit(s,selected.uid);if(u&&!blocked(s,p,u)){hurt(s,u,1,false,damageKind,source);queueEffects(s,[{op:'harpoonMove',uid:u.uid,pullFrom:selected.pullFrom}],source,p,frame.effectCard);}return;}
  if(step.op==='harpoonMove'){const u=unit(s,step.uid);if(!u||u.dying)return;const dx=source.at%5-step.pullFrom%5,dy=Math.floor(source.at/5)-Math.floor(step.pullFrom/5),x=u.at%5+dx,y=Math.floor(u.at/5)+dy;if(x<0||y<0||x>4-(u.size===2?1:0)||y>3-(u.size===2?1:0))return;const at=y*5+x;if(occupied(u).every((cell,i)=>canEnterOnGround(s,u,{at:cell,layer:u.layer||'surface'},{at:occupied({...u,at})[i],layer:source.layer||'surface'},card,keywords))){u.at=at;u.layer=source.layer||'surface';u.burrowedSafely=false;}return;}
  if(step.op==='castLifeLoss'){loseLife(s,step.player,step.amount);return;}
  if(step.op==='leapAlly'){const u=unit(s,selected.uid);if(u&&!u.dying)queueEffects(s,[{op:'unitStep',self:true,may:true},{op:'strikeEnemiesHere'}],u,p,frame.effectCard);return;}
  if(step.op==='lureAlly'){const u=unit(s,selected.uid);if(u&&!u.dying)queueEffects(s,[{op:'lureStep',untargeted:true,select:{kind:'unit',minion:true,enemy:true,nearby:true,onSite:true,anyRegion:true,untargeted:true}}],u,p,frame.effectCard);return;}
  if(step.op==='thunderTeleport'){const u=unit(s,source.uid);if(u&&!u.dying){u.carryTeleport=true;u.at=selected.at;u.layer=selected.layer;u.burrowedSafely=false;queueEffects(s,[{op:'tapOtherHere'}],u,p);}return;}
  if(step.op==='tapOtherHere'){const u=unit(s,source.uid);if(u&&!u.dying)for(const v of s.units)if(v.uid!==u.uid&&!v.dying&&sameLocation(s,v,u))v.tapped=true;return;}
  if(step.op==='poolFrogs'){if(resources(s,p).water>=3)for(let i=0;i<3;i++)if(canSummonEntry(s,p,card('frog'),source.at,'below')&&paySummoningTax(s,card('frog').id,p,p)){const u=makeUnit(s,card('frog').id,p,source.at);u.layer='below';summonedGenesis(s,u);}return;}
  if(step.op==='banishNearbySpiritsAuras'){let count=0;for(const u of [...s.units])if(card(u.card).type==='Minion'&&unitTypes(u,s).includes('Spirit')&&occupied(u).some(at=>nearby(s,at,source.at))&&regionsOverlap(s,u,source)){kill(s,u,true);count++;}for(const a of [...s.auras||[]])if(Array.from({length:20},(_,i)=>i).some(at=>inside(a,at)&&nearby(s,at,source.at))){removeObject(s,a,'banished');count++;}for(let i=0;i<count;i++)draw(s,p,'spells');return;}
  if(step.op==='voidEntryKill'){for(const u of [...s.units])if(!u.dying&&u.controller!==p&&occupiesGeometryLocation(u,step.at,step.layer,s))kill(s,u);return;}
  if(step.op==='tapSummoned'){const u=unit(s,step.uid);if(u&&!u.dying)u.tapped=true;return;}
  if(step.op==='chosenStep'){const u=unit(s,selected.uid);if(u&&!u.dying)queueEffects(s,[{op:'unitStep',uid:u.uid}],source,p,frame.effectCard);return;}
  if(step.op==='manuscriptDraw'){const u=unit(s,source.uid);if(u&&!u.dying){const top=s.players[p].spells[0];if(top){log(s,'揭示 '+card(top).name);draw(s,p,'spells');hurt(s,u,card(top).cost||0,false,'ability',u);}}return;}
  if(step.op==='adjacentFootSoldiers'){for(let at=0;at<20;at++)if(distance(s,at,source.at)===1&&regionsOverlap(s,{at,layer:source.layer||'surface'},source)&&canSummonEntry(s,p,card('foot_soldier'),at,source.layer||'surface')&&paySummoningTax(s,card('foot_soldier').id,p,p)){const u=makeUnit(s,card('foot_soldier').id,p,at);u.layer=source.layer||'surface';summonedGenesis(s,u);}return;}
  if(step.op==='defilerEnd'){for(const [at,site] of s.board.entries())if(site?.controller===step.player&&s.units.some(u=>!u.dying&&occupied(u).includes(at)&&unitUmbrellas(u,s,site.controller).includes('Evil')))loseLife(s,step.player,1);return;}
  if(step.op==='exorcistBanish'){if(selected.entity==='unit'){const u=unit(s,selected.uid);if(u&&!blocked(s,p,u))kill(s,u,true);}else {const a=s.auras.find(a=>a.uid===selected.uid);if(a)removeObject(s,a,'banished');}return;}
  if(step.op==='strikeEnemiesHere'){const u=unit(s,source.uid);if(u&&!u.dying&&!disabled(u))strikeMany(s,u,s.units.filter(v=>!v.dying&&v.controller!==u.controller&&sameLocation(s,v,u)).map(v=>({uid:v.uid,amount:strikeTotal(s,u)})));return;}
  if(step.op==='stealWard'){const from=selected.entity==='site'?s.board[selected.at]:unit(s,selected.uid),u=unit(s,source.uid);if(from?.ward&&u&&!u.dying){from.ward=false;if(!unitUmbrellas(u,s).includes('Evil'))u.ward=true;}return;}
  if(step.op==='squirrelBury'){const a=s.artifacts.find(a=>a.uid===selected.uid),u=unit(s,source.uid);if(a&&u&&s.board[u.at]){if(a.controller!==p&&a.ward){a.ward=false;return;}a.bearer=null;a.at=u.at;a.layer='below';}return;}
  if(step.op==='poolArtifact'){const h=s.players[p].hand.find(h=>h.uid===selected.uid);if(h){s.players[p].hand=s.players[p].hand.filter(v=>v.uid!==h.uid);if(card(h.card).artifactUnit){if(!canSummonEntry(s,p,card(h.card),source.at,'below'))sendCard(s,p,h.card,'banished');else if(paySummoningTax(s,h.card,p,p)){const u=makeUnit(s,h.card,p,source.at);u.layer='below';summonedGenesis(s,u);}}else{const o={uid:'o'+s.next++,card:h.card,owner:p,controller:p,at:source.at,bearer:null,layer:'below'};s.artifacts.push(o);queueEffects(s,definitions[card(h.card).slug]?.genesis||[],o,p);}}return;}
  if(step.op==='sitePassage'){const u=unit(s,step.uid);if(u&&!u.dying){if(step.damage)hurt(s,u,step.damage,false,'ability',source);if(step.destroy)kill(s,u);}return;}
  if(step.op==='playedSiteReaction'){if(step.loss)loseLife(s,step.player,step.loss);if(step.skeleton&&canSummonEntry(s,p,card('skeleton'),step.at,'surface')&&paySummoningTax(s,card('skeleton').id,p,p))makeUnit(s,card('skeleton').id,p,step.at);return;}
  if(step.op==='thornEnd'){const bearer=unit(s,(s.artifacts||[]).find(a=>a.uid===source.uid)?.bearer);if(bearer)loseLife(s,bearer.controller,2);return;}
  if(step.op==='boundDraw'){const caster=spellcaster(s,step.self?source.uid:selected?.uid);if(caster&&!caster.dying)draw(s,caster.controller,'spells',caster.uid);return;}
  if(step.op==='commitSpell'){
    const a=step.action;
    assert(a.avatarCopy?finalAvatarCopyActionValid(s,a,ruleAPI(s)):legalActions(s,p).some(v=>v.hand===a.hand&&v.grave===a.grave&&v.bound===a.bound&&v.payment===a.payment&&v.casterLayer===a.casterLayer&&Object.entries(v).every(([k,val])=>k==='path'||eq(a[k],val))),'施法宣告已失效');
    commitSpell(s,a,selected);return;
  }
  if(step.op==='commitLegacy'){commitSpell(s,step.action,step.declared);return;}
  if(step.op==='chainDeclare'){
    if(selected===null)return;
    const targets=step.targets,last=unit(s,targets[targets.length-1].uid),caster=spellcaster(s,source.uid,source.layer),costFor=n=>castingCost(s,p,card(frame.effectCard),undefined,source,step.action.payment,2*Math.max(0,n-1));
    if(selected==='commit'){commitSpell(s,{...step.action,chainTargets:targets});return;}
    if(selected==='cancel')return;
    if(selected&&selected.uid){queueEffects(s,[{...step,targets:[...targets,selected]}],source,p,frame.effectCard);return;}
    const options=castBudget(s,p)>=costFor(targets.length+1)&&last?selectEffects(s,{...frame,source:caster},{kind:'unit'}).filter(o=>!targets.some(t=>t.uid===o.value.uid)&&geometryLocationRecords(unit(s,o.value.uid)).some(loc=>geometryLocationRecords(last).some(from=>nearby(s,loc.at,from.at)&&regionsOverlap(s,loc,from)))):[];
    s.choice={player:p,title:'Chain Lightning · 宣告連鎖目標（總費用 '+costFor(targets.length)+'）',options:[...options,{label:'確認全部目標並支付費用',value:'commit'},{label:'取消施放（不支付費用）',value:null}],frame:{...frame,step:{...step,may:true}}};return;
  }
  if(step.op==='chainResolve'){
    for(const t of step.targets||[]){const u=unit(s,t.uid);if(u&&!u.dying&&!blocked(s,p,u))hurt(s,u,2,false,'magic',source);}return;
  }
  if(step.op==='maelstromPlan'){
    const entries=step.entries||s.units.filter(u=>!u.dying&&!u.swallowedBy&&card(u.card).type==='Minion'&&occupied(u).some(at=>bodyOfWater(s,source.at,card).has(at))).map(u=>({uid:u.uid,at:u.at,layer:u.layer||'surface'})),moves=step.moves||[];
    if(selected&&selected.uid)moves.push(selected);
    const todo=entries.filter(e=>!moves.some(m=>m.uid===e.uid)),entry=todo[0];
    if(entry){const u=unit(s,entry.uid),options=u.geometryLocations&&!u.silenced?geometryForcedMoves(s,u,{toward:source.at,bodyRoot:source.at},ruleAPI(s)):pullDestinations(s,u,source.at);
      if(!options.length){queueEffects(s,[{...step,optional:false,entries,moves:[...moves,{uid:u.uid,at:u.at,layer:u.layer||'surface'}]}],source,p);return;}
      s.choice={player:p,title:'Maelström · 選擇 '+card(u.card).name+' 的拉入位置',options:options.map(at=>typeof at==='object'?{label:at.label,value:{uid:u.uid,at:at.value.to.at,layer:at.value.to.layer,geometryFrom:at.value.from}}:{label:String.fromCharCode(65+at%5)+(4-Math.floor(at/5)),value:{uid:u.uid,at,layer:u.layer||'surface'}}),frame:{...frame,step:{...step,optional:false,entries,moves}}};return;}
    for(const m of moves){const u=unit(s,m.uid);if(u){if(m.geometryFrom)applyGeometryForcedMove(u,{from:m.geometryFrom,to:{at:m.at,layer:m.layer}});else{u.notRest=true;u.at=m.at;u.layer=m.layer;u.burrowedSafely=false;}}}return;
  }
  if(step.op==='treasureCast'){
    const object=(s.artifacts||[]).find(a=>a.uid===step.uid);if(!object)return;
    if(selected===undefined){const land=passives[card(object.card).slug]?.treasureLand;const options=s.board.flatMap((site,at)=>site?.controller===p&&(land?!waterSite(s,at,card):waterSite(s,at,card))?[{label:card(site.card).name+' · '+String.fromCharCode(65+at%5)+(4-Math.floor(at/5)),value:at}]:[]);if(!options.length)return;s.choice={player:1-p,title:card(object.card).name+' · 對手選擇'+(land?'地下':'水下')+'位置',options,frame};return;}
    object.at=selected;object.layer='below';object.bearer=null;return;
  }
  if(step.op==='treasureSurface'){
    const object=(s.artifacts||[]).find(a=>a.uid===step.uid),bearer=object&&unit(s,object.bearer);if(!object||!bearer||(bearer.layer||'surface')!=='surface')return;
    removeObject(s,object,'cemetery');queueEffects(s,[{op:'drawCards',count:2}],bearer,bearer.controller,object.card);return;
  }
  if(step.op==='commitArtifact'){
    const a=step.action;assert(legalActions(s,p).some(v=>v.type==='activateArtifact'&&v.object===a.object&&v.index===a.index),'物品能力宣告已失效');commitArtifact(s,a,selected);return;
  }
  if(step.op==='craterDiscard'){
    if(selected===null)return;
    if(selected===undefined){s.choice={player:p,title:'Craterize · 宣告額外棄一張地點的費用',options:[...s.players[p].hand.filter(h=>card(h.card).type==='Site').map(h=>({label:card(h.card).name,value:{uid:h.uid,card:h.card}})),{label:'取消（不支付費用）',value:null}],frame:{...frame,step:{...step,may:true}}};return;}
    const h=s.players[p].hand.find(h=>h.uid===selected.uid&&h.card===selected.card);assert(h&&card(h.card).type==='Site','額外地點費用已失效');s.players[p].hand=s.players[p].hand.filter(v=>v.uid!==h.uid);sendCard(s,p,h.card,'cemetery');commitSpell(s,{...step.action,discardedSite:true},step.target);return;
  }
  if(step.op==='gridBlast'){
    const origin=selected?.at??source.at,originPoint=step.pattern==='cone'?source:{at:origin,layer:selected?.layer||'surface'},pattern=[];
    if(step.pattern==='crater'&&blocked(s,p,s.board[origin]))return;
    if(step.pattern==='crater'){const matrix=[[1,2,4,2,1],[2,4,7,4,2],[4,7,10,7,4],[2,4,7,4,2],[1,2,4,2,1]];for(let y=0;y<5;y++)for(let x=0;x<5;x++)pattern.push([x-2,2-y,matrix[y][x]]);}
    else if(step.pattern==='major')for(let y=-1;y<=1;y++)for(let x=-1;x<=1;x++)pattern.push([x,-y,x===0&&y===0?7:x===0||y===0?5:3]);
    else if(step.pattern==='cone')for(let forward=1;forward<=3;forward++)for(let side=1-forward;side<forward;side++)pattern.push([side,forward,[0,5,3,1][forward]]);
    const grid=projectCardGrid(origin,pattern,step.pattern==='cone'?step.direction:0,isGlobeActive(s,card)),hits=[];
    for(const u of s.units)if(!u.dying){let total=0;for(const loc of geometryLocationRecords(u))if(s.board[loc.at]||loc.layer==='surface')for(const cell of grid)if(cell.at===loc.at&&(step.pattern==='crater'?!!s.board[loc.at]:regionsOverlap(s,loc,originPoint)))total+=cell.amount;if(total)hits.push({uid:u.uid,amount:total});}
    if(step.pattern==='crater')destroySite(s,origin);
    for(const hit of hits)hurt(s,unit(s,hit.uid),hit.amount,false,'magic',source);return;
  }
  if(step.op==='movementShot'){
    const u=unit(s,source.uid);if(!u||u.dying||u.shotDuringMove||u.silenced||disabled(u)||!passives[card(u.card).slug]?.movementShot)return;
    if(selected===undefined){s.choice={player:p,title:'Skirmishers of Mu · 此位置射擊或繼續移動',options:[...['北','東','南','西'].map((label,i)=>({label,value:i+1})),{label:'此處不射擊',value:0}],frame};return;}
    if(selected){u.shotDuringMove=true;u.stealth=false;queueEffects(s,[{op:'shot',at:u.at,layer:u.layer||'surface',origin:true,direction:selected-1,amount:power(u),remaining:Math.max(1,u.grantedRange||0)+(u.rangeBonus||0),ranged:true}],u,p);}return;
  }
  if(step.op==='awakenLeviathan'){
    const site=s.board[source.at];if(!site||site.card!==card('island_leviathan').id)return;
    const u=makeUnit(s,'runtime:island_leviathan',site.owner,source.at);u.controller=p;u.originalCard=site.card;if(site.babelParts)u.babelParts=structuredClone(site.babelParts);u.born=site.born??0;
    if(geometryPlaceSiteAllowed(s,card('rubble'),source.at,card))s.board[source.at]={uid:'s'+s.next++,card:card('rubble').id,owner:null,controller:null,flooded:true};return;
  }
  if(step.op==='hookHit'){
    const target=unit(s,selected?.uid);if(!target||target.swallowedBy)return;
    const route=[...(step.trail||[])].reverse(),moves=[];let from={at:target.at,layer:target.layer||'surface'},hitAt=step.hitAt??target.at;
    for(const cell of route){const at=from.at+cell-hitAt;moves.push({op:'dragStep',uid:target.uid,from,to:{at,layer:from.layer}});from={at,layer:from.layer};hitAt=cell;}
    queueEffects(s,[...moves,{op:'hookFight',target:target.uid,optional:true}],source,p);return;
  }
  if(step.op==='dragStep'){
    const u=unit(s,step.uid);if(!u||u.dying||u.swallowedBy||u.at!==step.from.at||(u.layer||'surface')!==step.from.layer||step.to.at<0||step.to.at>=20||u.size===2&&(step.to.at%5>3||step.to.at>=15)||!occupied({...u,at:step.to.at}).every((at,i)=>(step.ignoreRegions||regionsOverlap(s,{at,layer:step.to.layer},{at:occupied(u)[i],layer:u.layer}))&&(occupied(u).includes(at)&&step.to.layer===(u.layer||'surface')||canEnterOnGround(s,u,{at:occupied(u)[i],layer:u.layer},{at,layer:step.to.layer},card,keywords))))return;
    u.notRest=true;u.at=step.to.at;u.layer=step.to.layer;return;
  }
  if(step.op==='hookFight'){const u=unit(s,source.uid),target=unit(s,step.target);if(u&&target&&!u.dying&&!target.dying&&sameLocation(s,u,target))fight(s,{attacker:u.uid,defenders:[target.uid],kind:'spell'});return;}
  if(step.op==='boulderDeclare'){
    if(selected===null)return;const u=unit(s,step.actor),object=(s.artifacts||[]).find(a=>a.uid===step.object);if(!u||!object)return;
    u.tapped=true;u.notRest=true;u.stealth=false;object.bearer=null;queueEffects(s,[{op:'boulderRoll',uid:object.uid,at:object.at,layer:object.layer||'surface',direction:selected-1,exclude:u.uid,visited:[]}],object,p);return;
  }
  if(step.op==='boulderRoll'){
    const object=(s.artifacts||[]).find(a=>a.uid===step.uid);if(!object||object.at!==step.at)return;
    const visited=[...step.visited,step.at],pos=position(step.at),x=pos.x+[0,1,0,-1][step.direction],y=pos.y+[-1,0,1,0][step.direction],next=y*5+x;
    const hitIds=step.hitIds||[];for(const u of s.units)if(!u.dying&&u.uid!==step.exclude&&!hitIds.includes(u.uid)&&occupiesGeometryLocation(u,step.at,step.layer,s)){hitIds.push(u.uid);hurt(s,u,4,false,'ability',source);}
    if(x>=0&&x<5&&y>=0&&y<4&&!visited.includes(next)&&regionsOverlap(s,object,{at:next,layer:step.layer})){object.at=next;queueEffects(s,[{...step,at:next,visited,hitIds}],source,p);}return;
  }
  if(step.op==='curseEnter'){
    if(!step.returnQueued)queueEffects(s,[{op:'curseReturn',aura:step.aura}],source,p,frame.effectCard);
    return resolveCatalogAuraSubmerge(s,{...frame,step:{...step,onlyUid:step.uid,returnQueued:true}},ruleAPI(s));
  }
  if(step.op==='curseReturn'){const a=(s.auras||[]).find(a=>a.uid===step.aura);if(a&&!a.dying)removeObject(s,a,'hand');return;}
  if(step.op==='travelStep'){
    const u=unit(s,source.uid);if(!u||u.dying||u.controller!==p||u.at!==step.from.at||(u.layer||'surface')!==step.from.layer)return;
    const dest=locations(s,u,card,keywords,true).find(v=>v.at===step.to.at&&v.layer===step.to.layer);if(!dest||disabled(u))return;
    if(u.mods.some(m=>m.blaze)){u.fireTrail=u.fireTrail||[];for(const at of occupied(u))if((dest.layer!==(u.layer||'surface')||!occupied({...u,at:dest.at}).includes(at))&&!u.fireTrail.some(v=>v.at===at&&v.layer===(u.layer||'surface')))u.fireTrail.push({at,layer:u.layer||'surface'});}
    if(u.geometryLocations&&u.geometryGrowing){
      const origins=geometryStepOrigins(s,u,dest,ruleAPI(s));
      if(selected===undefined&&origins.length>1){s.choice={player:p,title:card(u.card).name+' · 選擇移動的分肢',options:origins.map(from=>({label:String.fromCharCode(65+from.at%5)+(4-Math.floor(from.at/5))+' '+from.layer+' → '+String.fromCharCode(65+dest.at%5)+(4-Math.floor(dest.at/5))+' '+dest.layer,value:{from}})),frame};return;}
      const from=selected?.from||origins[0];assert(from&&origins.some(v=>v.at===from.at&&v.layer===from.layer),'移動分肢已失效');applyGeometryForcedMove(u,{from,to:{at:dest.at,layer:dest.layer}});
    }else{u.notRest=true;u.at=dest.at;u.layer=dest.layer;}
    u.gateVoidwalk=dest.gateVoidwalk;return;
  }
  if(step.op==='travelStop'){
    const u=unit(s,source.uid);if(u)u.inBasicTravel=false;if(u?.fireTrail?.length){queueEffects(s,[{op:'blazeTrail',trail:u.fireTrail}],u,p,card('blaze').id);u.fireTrail=[];}return;
  }
  if(step.op==='blazeTrail'){startEvent(s,source,card('blaze').id);for(const u of s.units)if(!u.dying&&step.trail.some(v=>occupied(u).includes(v.at)&&(u.layer||'surface')===v.layer))hurt(s,u,2,false,'magic',source);return;}
  if(step.op==='travelFinish'){
    let a=step.action;const u=unit(s,source.uid);if(!u||u.dying||u.controller!==p||u.at!==a.at||(u.layer||'surface')!==(a.layer||'surface'))return;
    if(a.chimera){const targets=finalChimeraAttackTargets(s,u,a,ruleAPI(s));if(!targets?.length)return;a={...a,targets,target:targets[0]};}
    const victim=unit(s,a.target);if(a.type==='attack'&&(victim?protectedAttackUnit(s,victim,unit(s,a.unit)):a.target?.startsWith('site:')&&protectedAttackSite(s,Number(a.target.slice(5)),a.combatLayer||a.layer||'surface',unit(s,a.unit))))return;
    if(a.type==='attack'&&victim&&victim.controller!==p&&combatHas(s,victim,'attackManaGift',ruleAPI(s))){const amount=Math.max(0,resources(s,p).available);s.players[p].spent+=amount;(s.pendingMana||(s.pendingMana=[])).push({player:victim.controller,amount});}
    const pending={kind:a.type==='attack'?'attack':'intercept',player:a.defendingPlayer??1-p,attacker:u.uid,target:a.target||null,combatAt:a.combatAt,combatLayer:a.combatLayer||a.layer||'surface',stealth:stealthHides(u),noDefend:a.type==='attack'&&!!victim&&combatHas(s,u,'noDefend',ruleAPI(s)),defenders:[],order:a.order};
    const thicket=s.board[a.thicketAt];if(a.type==='attack'&&thicket&&!thicket.silenced&&!thicket.disabled&&sitePassives[card(thicket.card).slug]?.firstDepartureUndefended&&thicket.departureAttackTurn!==s.turn){pending.noDefend=true;thicket.departureAttackTurn=s.turn;}
    if(a.type==='attack'&&unit(s,a.target))pending.defenders=a.targets?[...a.targets]:[a.target];if(a.chimera)pending.targets=[...a.targets];
    if(a.type==='attack'){for(const t of finalUnitAttackTriggers(s,u,pending,ruleAPI(s)))eventTrigger(s,t.source,t.steps);const first=u.attackedTurn!==s.turn;u.interactedTurn=s.turn;u.attackedTurn=s.turn;pending.attackSource=clone(u);pending.afterAttack=captureAfterAttack(s,u,victim||(a.target?.startsWith('site:')?{...s.board[Number(a.target.slice(5))],entity:'site',at:Number(a.target.slice(5))}:null),ruleAPI(s));if(first)for(const layer of combatViews(s,u,ruleAPI(s),'bladeAfterAttack'))pending.afterAttack.push(...combatSteps(layer,[{op:'reactionBladeStep',uid:u.uid}]));}
    const judas=(s.ongoingEffects||[]).filter(e=>e.op==='judas'&&e.uid===a.target&&e.end===s.turn&&a.type==='attack');if(judas.length)pending.noDefend=true;
    if(a.type==='attack'){queueAttackReactions(s,u,pending,judas,ruleAPI(s));return;}
    openCombatWindow(s,pending,judas,source);return;
  }
  if(step.op==='reactionOpenAttack'){openCombatWindow(s,step.pending,step.judas||[],source);return;}
  if(step.op==='defendFinish'){
    const u=unit(s,source.uid),pending=s.pending,attacker=pending&&unit(s,pending.attacker);if(pending)delete pending.resolvingDefense;if(!u||u.dying||!attacker||!sameLocation(s,u,attacker))return;
    if(!step.action.keep)pending.defenders=pending.defenders.filter(id=>id!==(step.action.protect||pending.target));pending.defenders.push(u.uid);queueValorReaction(s,u,pending,ruleAPI(s));return;
  }
  if(['siegeCrew','siegePayload','siegeCommit'].includes(step.op)){
    const object=(s.artifacts||[]).find(a=>a.uid===step.action.object),ability=object&&definitions[card(object.card).slug]?.activated[step.action.index],bearer=object&&unit(s,object.bearer);
    assert(object&&ability?.crew&&bearer&&artifactController(s,object)===p&&ready(s,bearer),'攻城器具或持有者已失效');
    if(selected===null)return;
    if(step.op==='siegeCrew'){
      const helpers=siegeCrew(s,object,p);
      if(selected===undefined){s.choice={player:p,title:card(object.card).name+' · 選擇另一名協助友軍',options:[...helpers.map(u=>({label:card(u.card).name,value:u.uid})),{label:'取消啟動（不支付費用）',value:null}],frame:{...frame,step:{...step,may:true}}};return;}
      assert(helpers.some(u=>u.uid===selected),'協助友軍已失效');
      queueEffects(s,[{...step,op:ability.discardPayload?'siegePayload':'siegeCommit',crew:selected}],object,p);return;
    }
    if(step.op==='siegePayload'){
      if(selected===undefined){s.choice={player:p,title:card(object.card).name+' · 選擇棄牌作為彈藥',options:[...s.players[p].hand.map(h=>({label:card(h.card).name+' · 法力費用 '+(card(h.card).cost||0),value:{uid:h.uid,card:h.card}})),{label:'取消啟動（不支付費用）',value:null}],frame:{...frame,step:{...step,may:true}}};return;}
      queueEffects(s,[{...step,op:'siegeCommit',payload:selected}],object,p);return;
    }
    const helper=siegeCrew(s,object,p).find(u=>u.uid===step.crew);assert(helper,'協助友軍無法支付橫置費用');
    assert(selectEffects(s,{source:object,controller:p},ability.steps[0].select).some(o=>eq(o.value,step.target)),'攻城目標已失效');
    let amount=ability.steps[0].amount;
    if(ability.discardPayload){const h=s.players[p].hand.find(h=>h.uid===step.payload?.uid&&h.card===step.payload.card);assert(h,'彈藥手牌已失效');amount=card(h.card).cost||0;s.players[p].hand=s.players[p].hand.filter(v=>v.uid!==h.uid);sendCard(s,p,h.card,'cemetery');}
    // These units pay for an artifact's ability; they do not activate their own
    // ability, strike, or deal the artifact's damage, so tapping preserves Stealth.
    bearer.tapped=true;helper.tapped=true;
    queueEffects(s,[{...ability.steps[0],amount}],object,p);s.storyline[s.storyline.length-1].selected=step.target;return;
  }
  if(step.op==='commitAbility'){
    const a=step.action;assert(legalActions(s,p).some(v=>v.type==='activate'&&v.unit===a.unit&&(a.abilityInstance?v.abilityInstance===a.abilityInstance:v.index===a.index)),'能力宣告已失效');commitAbility(s,a,selected);return;
  }
  if(step.op==='commitSite'){
    const a=step.action;assert(legalActions(s,p).some(v=>v.type==='activateSite'&&v.at===a.at&&v.index===a.index),'地點能力宣告已失效');commitSite(s,a,selected);return;
  }
  if(step.op==='flySite'){
    const site=s.board[source.at];if(!site||s.board[selected.at]||passives[card(site.card).slug]?.immutableSite)return;
    if(!geometryMoveSiteAllowed(s,source.at,selected.at,card))return;
    s.board[source.at]=null;s.board[selected.at]=site;
    moveGeometrySiteParts(s,{[source.at]:selected.at},Array.from({length:20},(_,at)=>at===source.at?site:null),u=>siteEffectAllowed(s,u,'move',{card}));
    for(const u of s.units)if(!u.geometryLocations&&u.at===source.at&&u.size!==2&&!u.geometryFixedCells&&siteEffectAllowed(s,u,'move',{card})){u.at=selected.at;u.observedPosition={at:u.at,layer:u.layer||'surface'};}
    for(const a of s.artifacts||[])if(a.at===source.at)a.at=selected.at;
    for(const aura of s.auras||[])if(aura.singleSite&&aura.at===source.at&&aura.wallTo===undefined){aura.at=selected.at;if(aura.visited)aura.visited=[selected.at];}
    return;
  }
  if(step.op==='repeatDesertGenesis'){
    const remaining=step.remaining||s.board.flatMap((site,at)=>site?.controller===p&&nearby(s,source.at,at)&&card(site.card).subtypes.includes('Desert')?[{at,card:site.card}]:[]);
    if(selected===undefined){const available=remaining.filter(v=>s.board[v.at]?.card===v.card);if(!available.length)return;s.choice={player:p,title:'選擇下一個重新觸發 Genesis 的 Desert',options:available.map(v=>({label:card(v.card).name+' · '+String.fromCharCode(65+v.at%5)+(4-Math.floor(v.at/5)),value:v})),frame:{...frame,step:{...step,remaining}}};return;}
    queueEffects(s,[{...step,remaining:remaining.filter(v=>v.at!==selected.at)}],source,p,frame.effectCard);
    const site=s.board[selected.at];if(site?.card===selected.card)queueEffects(s,definitions[card(site.card).slug]?.genesis||[],{...site,at:selected.at,uid:site.uid||'site:'+selected.at,layer:'surface'},p,site.card);return;
  }
  if(step.op==='forcedWaterStep'){
    const u=unit(s,step.uid);if(!u||u.dying||disabled(u)||!siteEffectAllowed(s,u,'move',{card}))return;const body=bodyOfWater(s,step.root,card);if(!occupied(u).some(at=>body.has(at)))return;const options=locations(s,u,card,keywords,true).filter(v=>v.path.length===1&&occupied({...u,at:v.at}).every(at=>body.has(at)));
    if(selected===undefined){if(!options.length)return;s.choice={player:p,title:'在同一片水域自行走一步',options:options.map(v=>({label:String.fromCharCode(65+v.at%5)+(4-Math.floor(v.at/5))+(v.layer!==(u.layer||'surface')?' · 上浮／潛水':''),value:v.layer===(u.layer||'surface')?v.at:{at:v.at,layer:v.layer}})),frame};return;}
    const destination=options.find(v=>typeof selected==='number'?v.at===selected&&v.layer===(u.layer||'surface'):v.at===selected.at&&v.layer===selected.layer);assert(destination,'步行位置已失效');u.notRest=true;u.at=destination.at;u.layer=destination.layer;u.burrowedSafely=false;return;
  }
  if(step.op==='unitStep'){
    const u=unit(s,step.self?source.uid:step.uid);if(!u||u.dying||disabled(u)||!siteEffectAllowed(s,u,'move',{card}))return;
    if(p!==u.controller&&!fiftyForceAllowed(s,u,p,ruleAPI(s)))return;
    const stepDistance=(a,b)=>distance(s,a.at,b.at)+((a.layer||'surface')!==(b.layer||'surface')?1:0);
    const towardAllowed=v=>{if(!step.toward)return true;if(!step.podToward)return stepDistance(v,step.toward)<stepDistance(u,step.toward);const from=geometryLocationRecords(u),to=geometryLocationRecords({...u,at:v.at,layer:v.layer});return from.some((loc,i)=>to[i]&&stepDistance(to[i],step.toward)<stepDistance(loc,step.toward));};
    const candidates=locations(s,u,card,keywords,true).filter(v=>v.path.length===0&&step.remainWhenHere&&sameLocation(s,u,source)||v.path.length===1&&towardAllowed(v)&&(!step.away||stepDistance(v,step.away)>stepDistance(u,step.away)));
    if(selected===undefined){if(!candidates.length)return;s.choice={player:p,title:card(frame.effectCard).name+' · 選擇走一步的位置',options:[...candidates.map(v=>({label:String.fromCharCode(65+v.at%5)+(4-Math.floor(v.at/5))+' · '+(v.layer==='below'?'地下／水下':'表面'),value:{at:v.at,layer:v.layer}})),...(step.may?[{label:'留在原處',value:null}]:[])],frame};return;}
    if(selected===null){assert(step.may,'必須走一步');return;}
    const destination=candidates.find(v=>v.at===selected.at&&v.layer===selected.layer);assert(destination,'步行位置已失效');if(destination.path.length===0)return;u.gateVoidwalk=destination.gateVoidwalk;u.at=selected.at;u.layer=selected.layer;u.burrowedSafely=false;return;
  }
  if(step.op==='krakenSurface'){
    const u=unit(s,source.uid);if(!u||u.dying)return;
    u.layer='surface';u.burrowedSafely=false;queueEffects(s,[{op:'krakenStrike'}],u,p,frame.effectCard);return;
  }
  if(step.op==='krakenStrike'){
    const u=unit(s,source.uid);if(!u||u.dying||disabled(u))return;
    const victims=s.units.filter(v=>!v.dying&&v.uid!==u.uid&&nearby(s,v.at,u.at)&&regionsOverlap(s,v,u));
    strikeMany(s,u,victims.map(v=>({uid:v.uid,amount:strikeTotal(s,u)})));return;
  }
  if(step.op==='adeptSearch'){
    if(selected===undefined){s.choice={player:p,title:card(frame.effectCard).name+' · 是否檢索 Spellbook',options:[{label:'檢索 Spellbook（之後洗牌）',value:true},{label:'不檢索 Spellbook',value:false}],frame};return;}
    const searched=selected===true,options=['hand','cemetery',...(searched?['spells']:[])].flatMap(zone=>searchSummonEntries(s,p,zone,step).map(o=>({label:o.label,value:{...o.value,zone}})));
    const {selected:previous,...base}=frame;void previous;
    // Cemetery is public, so a copy there must be found. Hand and spellbook may fail.
    const mustFind=options.some(o=>o.value.zone==='cemetery');
    s.choice={player:p,title:card(frame.effectCard).name+' · 選擇另一張 Adept Illusionist',options:[...options,...(mustFind?[]:[{label:'不取牌',value:null}])],frame:{...base,step:{...step,op:'adeptSearchPick',searched}}};return;
  }
  if(step.op==='adeptSearchPick'){
    if(selected===null){if(step.searched)shuffle(s,s.players[p].spells);return;}
    const zone=selected.zone;if(step.searched&&zone!=='spells')shuffle(s,s.players[p].spells);
    queueEffects(s,[{op:'searchSummonPlace',picked:selected,zone,...(step.nearby?{select:{kind:'location',nearby:true,sameRegion:true}}:{at:source.at,layer:source.layer||'surface'})}],source,p,frame.effectCard);return;
  }
  if(step.op==='searchSummon'){
    if(selected===undefined){s.choice={player:p,title:card(frame.effectCard).name+' · 選擇檢索區域',options:[...step.zones.map(zone=>({label:{hand:'檢索手牌',cemetery:'檢索墓地',spells:'檢索 Spellbook（之後洗牌）'}[zone],value:zone})),...(step.maySearch?[{label:'不檢索',value:null}]:[])],frame};return;}
    if(selected===null)return;
    const zone=selected,options=searchSummonEntries(s,p,zone,step);
    s.choice={player:p,title:card(frame.effectCard).name+' · '+(zone==='cemetery'?'墓地檢索':'私人區域檢索'),options:[...options,...(zone!=='cemetery'||!options.length?[{label:zone==='cemetery'?'沒有符合的牌':'不取牌',value:null}]:[])],frame:{...frame,step:{...step,op:'searchSummonPick',zone}}};return;
  }
  if(step.op==='searchSummonPick'){
    if(selected===null){if(step.zone==='spells')shuffle(s,s.players[p].spells);const zones=step.zones.filter(zone=>zone!==step.zone);if(step.searchAll&&zones.length)queueEffects(s,[{...step,op:'searchSummon',zones}],source,p,frame.effectCard);return;}
    queueEffects(s,[{op:'searchSummonPlace',picked:selected,zone:step.zone,...(step.nearby?{select:{kind:'location',nearby:true,sameRegion:true}}:{at:source.at,layer:source.layer||'surface'})}],source,p,frame.effectCard);return;
  }
  if(step.op==='searchSummonPlace'){
    const picked=step.picked,pl=s.players[p];if(!canSummonEntry(s,p,card(picked.card),selected?.at??step.at,selected?.layer||step.layer||'surface'))return;
    if(step.zone==='hand'){assert(pl.hand.some(h=>h.uid===picked.uid&&h.card===picked.card),'手牌檢索已失效');pl.hand=pl.hand.filter(h=>h.uid!==picked.uid);}
    else {const zoneOwner=step.zone==='cemetery'?picked.player:p,zone=s.players[zoneOwner][step.zone];assert(zone[picked.index]===picked.card,'檢索已失效');if(step.zone==='cemetery')takeGrave(s,zoneOwner,picked.index,picked.card,picked.uid,p);else zone.splice(picked.index,1);if(step.zone==='spells')shuffle(s,pl.spells);}
    if(!paySummoningTax(s,picked.card,p,p))return;
    const u=makeUnit(s,picked.card,step.zone==='cemetery'?picked.player:p,selected?.at??step.at);u.controller=p;u.layer=selected?.layer||step.layer||'surface';summonedGenesis(s,u);return;
  }
  if(step.op==='boneyard'||step.op==='boneyardPick'){
    const picks=step.op==='boneyard'?[]:[...step.picks,...(selected?[{...selected,controller:p}]:[])],remaining=step.op==='boneyard'?[1-s.active,s.active]:step.remaining;
    if(!remaining.length){queueEffects(s,[{op:'boneyardResolve',picks}],source,p,frame.effectCard);return;}
    const next=remaining[0];if(!zoneAccessDecision(s,next,s.zoneAccessScope)){queueEffects(s,[{op:'zoneAccessOffer',scope:s.zoneAccessScope,player:next},{op:'boneyardPick',picks,remaining}],source,p,frame.effectCard);return;}const options=selectEffects(s,{...frame,controller:next},{kind:'grave',own:true,minion:true}).flatMap(option=>['surface','below'].map(layer=>({label:option.label+' · '+(layer==='below'?'地下／水下':'表面'),value:{...option.value,layer}})));
    s.choice={player:next,title:'Boneyard · '+s.players[next].name+' 選擇自己的墓地僕從',options:[...options,{label:'不召喚',value:null}],frame:{...frame,controller:next,step:{op:'boneyardPick',picks,remaining:remaining.slice(1)}}};return;
  }
  if(step.op==='boneyardResolve'){
    const summoned=[],paid=[];
    for(const grave of step.picks){if(!canSummonEntry(s,grave.controller,card(grave.card),source.at,grave.layer))continue;const pl=s.players[grave.player];assert(pl.cemetery[grave.index]===grave.card,'墓地選擇已失效');takeGrave(s,grave.player,grave.index,grave.card,grave.uid,grave.controller);if(paySummoningTax(s,grave.card,grave.player,grave.controller))paid.push(grave);}
    for(const grave of paid){const u=makeUnit(s,grave.card,grave.player,source.at);u.controller=grave.controller;u.layer=grave.layer;summoned.push(u);}
    // FAQ eXfZjLHocReFQIApZdI7ng: non-active chooses first. Both enter
    // before Genesis; reverse queue insertion resolves non-active Genesis first.
    for(const u of summoned.reverse())summonedGenesis(s,u);return;
  }
  const targets=(step.all?selectEffects(s,frame,{...step.all,untargeted:true}).map(v=>v.value):selected?.entity?[selected]:[]).filter(v=>v.entity!=='unit'||siteEffectAllowed(s,unit(s,v.uid),'modify',{card}));
  const entities=targets.map(v=>v.entity==='unit'?unit(s,v.uid):v.entity==='site'?s.board[v.at]:v.entity==='artifact'?(s.artifacts||[]).find(a=>a.uid===v.uid):null).filter(Boolean);
  if(step.select&&!step.untargeted&&!step.select.untargeted&&selectorMetadata(frame,step.select,ruleAPI(s))?.role!=='choose'&&!['discard','summon','festival'].includes(step.op)&&entities.some(v=>blocked(s,p,v)))return;
  if(step.op==='displaceTarget'){queueEffects(s,[{op:'displaceDestination',target:selected}],source,p,frame.effectCard);return;}
  if(resolveBorder(s,frame,ruleAPI(s))||resolveAttackReaction(s,frame,ruleAPI(s))||resolveBattle(s,frame,ruleAPI(s))||resolveCopying(s,frame,ruleAPI(s))||resolveMetamorphosis(s,frame,ruleAPI(s))||resolveDream(s,frame,ruleAPI(s))||resolveCollection(s,frame,ruleAPI(s))||resolveVivien(s,frame,ruleAPI(s))||resolveAbilitySource(s,frame,ruleAPI(s))||resolveCompletion(s,frame,ruleAPI(s)))return;
  if(resolveCatalogMagic(s,frame,ruleAPI(s))||resolveFinalFlood(s,frame,ruleAPI(s))||resolveCriticalStrike(s,frame)||resolveMalleus(s,frame,ruleAPI(s))||resolveMagicDeclaration(s,frame,ruleAPI(s))||resolveGeometry(s,frame,ruleAPI(s))||resolveFinalControl(s,frame,ruleAPI(s))||resolveAnimation(s,frame,ruleAPI(s))||resolveFinalChaos(s,frame,ruleAPI(s))||resolveFinalReactions(s,frame,ruleAPI(s))||resolveFinalWaves(s,frame,ruleAPI(s))||resolveFinalOrb(s,frame,ruleAPI(s))||resolveBuiltSites(s,frame,ruleAPI(s))||resolveFinalSites(s,frame,ruleAPI(s))||resolveFinalPassives(s,frame,ruleAPI(s))||resolveFinalGrid(s,frame,ruleAPI(s))||resolveFinalContract(s,frame,ruleAPI(s))||resolveFinalAvatar(s,frame,ruleAPI(s))||resolveFinalUnits(s,frame,ruleAPI(s))||resolveFinalEffects(s,frame,ruleAPI(s))||resolveFinalArtifacts(s,frame,ruleAPI(s))||resolveRemainingFinal(s,frame,ruleAPI(s))||resolveRemainingExtra(s,frame,ruleAPI(s))||resolveRemaining(s,frame,ruleAPI(s))||resolveFifty(s,frame,ruleAPI(s)))return;
  if(step.op==='infiltrate')for(const u of entities){u.stealth=true;u.tapped=true;queueEffects(s,[{op:'infiltrateControl',uid:u.uid}],source,p);}
  if(step.op==='boundControl')for(const u of entities)bindControl(s,u,p,{source:source.uid});
  if(step.op==='morriganDamage')for(const target of entities){const receipt={};if(hurt(s,target,1,false,'ability',source,[],receipt)>0&&!receipt.redirected)heal(s,p,1);}
  if(step.op==='spearThrow')for(const target of entities){const o=s.artifacts.find(o=>o.uid===step.object),at=step.location?.at,layer=step.location?.layer;if(o&&geometryLocationRecords(target).some(loc=>loc.at===at&&loc.layer===layer)){o.bearer=null;o.at=at;o.layer=layer;kill(s,target);}}
  if(step.op==='dracoTeleport')for(const target of entities){const actor=unit(s,source.uid);if(actor&&!actor.dying&&occupied({...actor,at:target.at}).every((at,i)=>canEnterOnGround(s,actor,{at:occupied(actor)[i],layer:actor.layer||'surface'},{at,layer:target.layer||'surface'},card,keywords,true))){actor.carryTeleport=true;actor.at=target.at;actor.layer=target.layer||'surface';actor.notRest=true;actor.burrowedSafely=false;queueEffects(s,[{op:'dracoArrive',uid:target.uid}],actor,p);}}
  if(step.op==='assassinThrow')for(const target of entities){const actor=unit(s,source.uid),o=s.artifacts.find(o=>o.uid===step.throwObject&&artifactIsCarriedBy(o,actor?.uid));if(actor&&o){o.bearer=null;o.at=target.at;o.layer=target.layer||'surface';hurt(s,target,card(o.card).cost||0,false,'ability',actor);}}
  if(step.op==='bonekiteBlast'){const victims=s.units.filter(u=>!u.dying&&u.uid!==source.uid&&occupied(u).includes(selected.at)&&(u.layer||'surface')===selected.layer);queueEffects(s,[{op:'bonekiteRaise',victims:victims.map(u=>u.uid),from:(s.deathHistory||[]).length,at:selected.at,layer:selected.layer}],source,p);for(const target of victims)hurt(s,target,3,false,'ability',source);}
  if(step.op==='warpSpasm')for(const u of entities)u.mods.push({powerMultiplier:2,warpSpasm:true,end:s.turn});
  if(step.op==='judasMark')for(const u of entities)(s.ongoingEffects||(s.ongoingEffects=[])).push({op:'judas',uid:u.uid,controller:p,end:s.turn});
  if(step.op==='bindSpellcaster')for(const u of entities)u.boundSpellcaster=true;
  if(step.op==='crossRegionPull')for(const u of entities)queueEffects(s,[{op:'dragStep',uid:u.uid,from:{at:u.at,layer:u.layer||'surface'},to:{at:source.at,layer:source.layer||'surface'},ignoreRegions:true}],source,p,frame.effectCard);
  if(step.op==='abyssTarget')for(const u of entities)queueEffects(s,[{op:'abyssDestination',uid:u.uid}],source,p,frame.effectCard);
  if(step.op==='gargGrab')for(const u of entities)queueEffects(s,[{op:'dragStep',uid:u.uid,from:{at:u.at,layer:u.layer||'surface'},to:{at:source.at,layer:source.layer||'surface'}},{op:'gargCocoon',uid:u.uid}],source,p,frame.effectCard);
  if(step.op==='shatterEnemy')for(const u of entities)queueEffects(s,[{op:'shatterArtifact',target:u.uid}],source,p,frame.effectCard);
  if(step.op==='thiefTarget')for(const u of entities)queueEffects(s,[{op:'thiefSteal',target:u.uid}],source,p,frame.effectCard);
  if(step.op==='divinePrepare')queueEffects(s,[{op:'divineBreak',at:selected.at,amount:1}],source,p,frame.effectCard);
  if(step.op==='stoneRainPrepare')queueEffects(s,[{op:'stoneRainHit',at:selected.at,remaining:s.players[p].hand.filter(h=>card(h.card).type==='Site').length}],source,p,frame.effectCard);
  if(step.op==='liesFirst'){const first=unit(s,selected.uid);if(!first||first.dying)return;const uids=s.units.filter(u=>!u.dying&&u.uid!==source.uid&&u.uid!==first?.uid&&sameLocation(s,u,first)&&occupied(u).some(at=>nearby(s,at,source.at))).map(u=>u.uid);if(first&&uids.length){queueEffects(s,[{op:'liesFight',first:first.uid,select:{kind:'unit',uids,anyRegion:true}}],source,p,frame.effectCard);if(step.second&&uids.includes(step.second.uid))s.storyline[s.storyline.length-1].selected=step.second;}}
  if(step.op==='replicaChoose'){const a=s.artifacts.find(a=>a.uid===selected.uid&&artifactIsCarriedBy(a,source.uid));if(a)queueEffects(s,[{op:'replicaPlace',card:a.card}],source,p,frame.effectCard);}
  if(step.op==='banishSite'){const at=selected.at,site=s.board[at];if(site&&!s.units.some(u=>card(u.card).type==='Avatar'&&occupied(u).includes(at))){sendBuiltSite(s,site,'banished',ruleAPI(s));s.board[at]=null;for(const u of s.units)if(occupied(u).includes(at))u.layer='surface';for(const a of s.artifacts)if(a.at===at)a.layer='surface';}}
  if(step.op==='mesmerPull')for(const u of entities){u.tapped=true;queueEffects(s,[{op:'unitStep',uid:u.uid,[step.away?'away':'toward']:{at:source.at,layer:source.layer||'surface'}}],source,p,frame.effectCard);}
  if(step.op==='bearerDamage'){const bearer=unit(s,source.bearer||source.uid);if(bearer&&!bearer.dying&&!disabled(bearer)){startEvent(s,bearer,bearer.card);for(const target of entities)hurt(s,target,step.amount,false,'ability',bearer);}}
  if(step.op==='relicDeath'){if(step.heal)heal(s,p,step.heal);if(step.loss)loseLife(s,1-p,step.loss,false);}
  if(step.op==='untapIfNonFire'&&s.players[p].castTurn===s.turn&&s.players[p].castNonFire)untap(s,unit(s,source.uid));
  if(step.op==='opponentSkeleton'){const controller=1-p;if(canSummonEntry(s,controller,card('skeleton'),source.at,source.layer||'surface')&&paySummoningTax(s,card('skeleton').id,controller,controller)){const u=makeUnit(s,card('skeleton').id,controller,source.at);u.layer=source.layer||'surface';summonedGenesis(s,u);}}
  if(step.op==='bonfireDestroy')for(const a of [...s.artifacts||[]])if((card(a.card).slug==='lance'||card(a.card).subtypes.some(t=>['Weapon','Armor'].includes(t)))&&nearby(s,a.at,source.at)&&regionsOverlap(s,a,source)){if(a.ward)a.ward=false;else removeObject(s,a,'cemetery');}
  if(step.op==='graveToPeek')queueEffects(s,[{op:'peekSpell'}],source,p,frame.effectCard);
  if(step.op==='golgorSweep')for(const u of [...s.units])if(card(u.card).type==='Minion'&&occupied(u).includes(selected.at)&&(u.layer||'surface')===selected.layer&&power(u)<=2)kill(s,u,true);
  if(step.op==='swallow')for(const u of entities){u.swallowedBy=source.uid;u.bellyDisabled=true;u.notRest=true;u.tapped=false;}
  if(step.op==='lureStep')for(const u of entities)queueEffects(s,[{op:'unitStep',uid:u.uid,toward:{at:source.at,layer:source.layer||'surface'},podToward:true,remainWhenHere:true}],source,p,frame.effectCard);
  if(step.op==='undertowChoose')queueEffects(s,[{op:'forcedWaterStep',uid:selected.uid,root:source.at}],source,p,frame.effectCard);
  if(step.op==='riptideChoose')queueEffects(s,[{op:'riptideMove',at:selected.at,select:{kind:'unit',adjacent:true,surface:true,anchor:{at:selected.at,layer:'surface'}}}],source,p,frame.effectCard);
  if(step.op==='collapseSite'){if(s.board[selected.at]?.card===selected.card)destroySite(s,selected.at);}
  if(step.op==='eruptSite')for(const u of s.units)if(!u.dying&&s.board[u.at]&&nearby(s,source.at,u.at))hurt(s,u,3,false,'ability',source);
  if(step.op==='riptideMove')for(const u of entities)if(!u.swallowedBy){if(u.size===2||u.geometryLocations&&!u.silenced){queueEffects(s,[{op:'riptideGiant',uid:u.uid,root:step.at}],source,p,frame.effectCard);continue;}if(canEnterOnGround(s,u,u,{at:step.at,layer:'surface'},card,keywords)){u.notRest=true;u.at=step.at;u.layer='surface';u.burrowedSafely=false;}}
  if(step.op==='riptideGiant'){const u=unit(s,step.uid);if(!u||u.dying)return;const options=pullDestinations(s,u,step.root,false);if(selected===undefined){if(!options.length)return;s.choice={player:p,title:'Riptide · 選擇巨大單位的拉入位置',options:options.map(at=>({label:String.fromCharCode(65+at%5)+(4-Math.floor(at/5)),value:at})),frame};return;}assert(options.includes(selected),'巨大單位位置已失效');u.notRest=true;u.at=selected;return;}
  if(step.op==='graveRecur'){
    const entry=effectGraves(s,step.gravePlayer??cemeteryPhysicalPlayer(s,p,ruleAPI(s)),p).find(g=>g.uid===step.graveUid);if(!entry||selected===null)return;
    if(selected===undefined){s.choice={player:p,title:card(entry.card).name+' · 從墓地召喚',options:[...(step.layer?[step.layer]:['surface','below']).map(layer=>({label:layer==='below'?'召喚到地下／水下':'召喚到表面',value:{at:step.at,layer}})),{label:'不召喚',value:null}],frame};return;}
    const u=summonGraveAt(s,entry,p,step.at,selected.layer);if(u&&step.tapped)u.tapped=true;
  }
  if(step.op==='returnDeadHand'){
    takeGrave(s,selected.player,selected.index,selected.card,selected.uid);s.players[selected.player].hand.push({uid:'h'+s.next++,card:selected.card});
  }
  if(step.op==='burnBook'){
    if(selected.entity==='grave'){takeGrave(s,selected.player,selected.index,selected.card,selected.uid);s.players[selected.player].banished.push(selected.card);}
    else {const object=(s.artifacts||[]).find(a=>a.uid===selected.uid);if(object)removeObject(s,object,'banished');}
  }
  if(step.op==='geomancerRubble'){if(!s.board[selected.at]&&geometryPlaceSiteAllowed(s,card('rubble'),selected.at,card))s.board[selected.at]={uid:'s'+s.next++,card:card('rubble').id,owner:null,controller:null,ward:false};}
  if(step.op==='geomancerReplace'){if(!s.players[p].atlas[0]||!geometryPlaceSiteAllowed(s,card(s.players[p].atlas[0]),selected.at,card))return;const id=s.players[p].atlas.shift();assert(id,'Atlas 已空');enterSite(s,p,id,selected.at,false);}
  if(step.op==='sparkDischarge'||step.op==='nimbusDischarge'){
    const pool=s.units.filter(u=>!u.dying&&u.uid!==source.uid&&(step.op==='sparkDischarge'?occupied(u).includes(selected.at)&&(u.layer||'surface')===selected.layer:sameLocation(s,u,source))),amount=step.op==='sparkDischarge'?(s.players[p].castTurn===s.turn?s.players[p].castAir||0:0):3;
    if(pool.length)hurt(s,pool[rollIndex(s,pool.map(u=>card(u.card).name+' @ '+u.at))],amount,false,'ability',source);
  }
  if(step.op==='waveshaperFlood'){
    for(const site of s.board)if(site?.effects)site.effects=site.effects.filter(e=>e.waveSource!==source.uid);
    const site=s.board[selected.at];if(!site.effects)site.effects=[];site.effects.push({flood:true,waveSource:source.uid,stamp:s.next++});refreshContinuous(s);
    for(const u of s.units)if(u.at===selected.at&&card(u.card).type==='Minion'&&!keywords(u).includes('Submerge')){u.tapped=true;u.skipUntap=true;}
  }
  if(step.op==='coinBanish')queueEffects(s,[{op:'banishGraveOne',remaining:3,optional:true,select:{kind:'grave'}}],source,p,frame.effectCard);
  if(step.op==='skullSummon'){
    takeGrave(s,selected.player,selected.index,selected.card,selected.uid);s.players[selected.player].banished.push(selected.card);
    if(canSummonEntry(s,p,card('skeleton'),source.at,source.layer||'surface')&&paySummoningTax(s,card('skeleton').id,p,p)){const u=makeUnit(s,card('skeleton').id,p,source.at);u.layer=source.layer||'surface';summonedGenesis(s,u);}
  }
  if(step.op==='relicSiteEnd'){
    const a=(s.artifacts||[]).find(a=>a.uid===source.uid)||source,controller=s.board[a.at]?.controller,d=passives[card(a.card).slug];
    if(controller===0||controller===1){if(d.eachEndSiteHeal)heal(s,controller,d.eachEndSiteHeal);if(d.eachEndSiteLoss)loseLife(s,controller,d.eachEndSiteLoss,false);if(d.eachEndUnspentLoss&&controller===p)loseLife(s,controller,resources(s,controller).available,false);}
  }
  if(step.op==='obeliskStart'){const d=passives[card(source.card).slug]||{};loseLife(s,p,step.loss??d.siteStartLoss??0,false);s.players[p].bonusMana=(s.players[p].bonusMana||0)+(step.amount??d.siteStartMana??0);}
  if(['damage','strike','rangedHit','destroy','untap','ward','stealth','returnHand','control','sleep','damageDisable'].includes(step.op))for(const target of entities){
    if(step.op==='damage')hurt(s,target,step.amount,step.lethal,damageKind,source);
    if(step.op==='strike')strike(s,source,target);
    if(step.op==='rangedHit')strike(s,source,target,step.amount,true);
    if(step.op==='destroy')kill(s,target);
    if(step.op==='untap')untap(s,target);
    if(step.op==='ward'&&!unitUmbrellas(target,s).includes('Evil')&&!(s.board.includes(target)&&(passives[card(target.card).slug]?.immutableSite||target.completionProtected)))target.ward=true;
    if(step.op==='stealth')target.stealth=true;
    if(step.op==='returnHand')leaveUnit(s,target,'hand');
    if(step.op==='control')target.controller=p;
    if(step.op==='sleep'){target.mods.push({asleep:true});target.ward=false;target.stealth=false;}
    if(step.op==='damageDisable'){hurt(s,target,step.amount,false,damageKind,source);target.mods.push({disabled:true,until:p});if(disabled(target)){target.ward=false;target.stealth=false;}}
  }
  if(step.op==='bury'){const u=unit(s,step.uid);if(u)leaveUnit(s,u,u.destination||'cemetery');}
  if(step.op==='buryMany')for(const uid of step.uids){const u=unit(s,uid);if(u)leaveUnit(s,u,u.destination||'cemetery');}
  if(step.op==='finishMagic'){finishMagicChoiceContext(s,frame,ruleAPI(s));if(!step.finalKairosConsumed)sendCard(s,step.owner,step.card,step.destination||'cemetery');}
  if(step.op==='crowsDamage')for(const u of s.units)if(!u.dying&&u.controller!==p&&card(u.card).type==='Minion'&&(u.layer||'surface')==='surface'&&s.board[u.at])hurt(s,u,1,false,'magic',source);
  if(step.op==='returnSelf'){const u=unit(s,source.uid);if(u)u.destination='hand';}
  if(step.op==='destroyStruck')kill(s,unit(s,step.uid));
  if(step.op==='healSurvivor'){const u=unit(s,step.uid);if(u&&!u.dying)fullyHeal(s,u);}
  if(step.op==='gainDeathPower'){const u=unit(s,step.uid);if(u)u.mods.push({power:step.amount});}
  if(step.op==='killSkeleton'){if(!canSummonEntry(s,p,card('skeleton'),step.at,step.layer||'surface'))return;const u=makeUnit(s,card('skeleton').id,p,step.at);u.layer=step.layer;}
  if(step.op==='giantKill'){const u=unit(s,step.uid),victim=unit(s,step.victim);if(u&&victim?.dying&&victim.destination!=='banished'){victim.destination='banished';u.mods.push({power:1});}}
  if(step.op==='albatrossRevenge'){const killer=unit(s,step.killer.uid)||step.killer;for(const u of [...s.units])if(u.uid!==killer.uid&&u.controller===killer.controller&&card(u.card).type==='Minion'&&nearby(s,u.at,killer.at)&&regionsOverlap(s,u,killer))kill(s,u);}
  if(step.op==='balinStrike'){
    const target=unit(s,step.avatar);if(target){const at=target.at;destroySite(s,at);if(s.board[at]&&!waterSite(s,at,card)){
      for(const u of s.units)if(u.uid!==source.uid&&u.at===at&&card(u.card).type==='Minion')u.layer='below';
      for(const a of s.artifacts||[])if(a.at===at){const bearer=unit(s,a.bearer);if(bearer&&(bearer.layer||'surface')!=='below')a.bearer=null;a.layer='below';}
    }}
  }
  // One physical body is counted once across oversized parts. Separate bodies
  // retain the prior anchor fallback pending a specific official interpretation.
  if(step.op==='healWaterAllies')for(const u of s.units)if(u.controller===p&&!u.dying){const bodies=occupied(u).map(at=>bodyOfWater(s,at,card)).filter(body=>body.size),first=bodies[0],single=first&&bodies.every(body=>body.size===first.size&&[...body].every(at=>first.has(at)));const amount=single?first.size:bodyOfWater(s,u.at,card).size;if(card(u.card).type==='Avatar')heal(s,p,amount);else if(!healFinalStitchedDamage(s,u,healingAmount(s,amount,u),p,ruleAPI(s)))u.damage=Math.max(0,u.damage-healingAmount(s,amount,u));}
  if(step.op==='bodySiteDamage')for(const u of s.units)if(u.at===selected.at&&card(u.card).type==='Minion')hurt(s,u,step.amount,false,damageKind,source);
  if(step.op==='linkBody'){
    const site=s.board[selected.at];if(site){if(!site.uid)site.uid='s'+s.next++;if(!s.ongoingEffects)s.ongoingEffects=[];s.ongoingEffects.push({op:'linkBody',rootUid:site.uid,water:step.water,controller:p,end:s.turn});}
  }
  if(step.op==='wrathSea'){
    const body=bodyOfWater(s,selected.at,card),targets=s.board.flatMap((site,at)=>site&&[...body].some(i=>distance(s,i,at)===1)?[at]:[]);
    for(const at of targets){const site=s.board[at];if(!site.effects)site.effects=[];site.effects.push({flood:true,end:s.turn,stamp:s.next++});}
    for(const u of s.units)if(card(u.card).type==='Minion'&&waterSite(s,u.at,card))u.layer='below';
    for(const a of s.artifacts||[])if(waterSite(s,a.at,card)){const bearer=unit(s,a.bearer);if(bearer&&(bearer.layer||'surface')!=='below')a.bearer=null;a.layer='below';}
  }
  if(step.op==='untapSelf')untap(s,unit(s,step.uid||source.uid));
  if(step.op==='tapSkip')for(const u of entities){u.tapped=true;u.skipUntap=true;}
  if(step.op==='dieIfNoAttack'){const u=unit(s,source.uid);if(u&&u.attackedTurn!==s.turn)kill(s,u,false,true);}
  if(step.op==='destroyOthersHere'){
    for(const u of [...s.units])if(u.uid!==source.uid&&sameLocation(s,u,source))kill(s,u);
    for(const a of [...s.artifacts||[]])if(sameLocation(s,a,source))removeObject(s,a,'cemetery');
    if((source.layer||'surface')==='surface')for(const a of [...s.auras||[]])if(inside(a,source.at))removeObject(s,a,'cemetery');
    destroySite(s,source.at);
  }
  if(step.op==='burrowSelf'){const u=unit(s,source.uid);if(u&&s.board[u.at]&&!waterSite(s,u.at,card))u.layer='below';}
  if(step.op==='submergeHere'&&waterSite(s,source.at,card))for(const u of [...s.units,...s.artifacts||[]])if(u.at===source.at&&(u.layer||'surface')===(source.layer||'surface')&&card(u.card).type!=='Avatar')u.layer='below';
  if(step.op==='acquireLance'){const u=unit(s,source.uid);if(u)acquireLance(s,u,p);}
  if(step.op==='payLance'&&resources(s,p).available>=step.amount){s.players[p].spent+=step.amount;acquireLance(s,null,p,source.at);}
  if(step.op==='tapDrop')for(const u of entities){u.tapped=true;for(const a of s.artifacts||[])if(artifactIsCarriedBy(a,u.uid)){a.bearer=null;a.at=u.at;a.layer=u.layer||'surface';}}
  if(step.op==='nightAttack'){
    for(const a of s.artifacts||[]){const u=unit(s,a.bearer);if(u&&u.controller!==p){a.bearer=null;a.at=u.at;a.layer=u.layer||'surface';}}
    if(!s.ongoingEffects)s.ongoingEffects=[];s.ongoingEffects.push({op:'nightAttack',controller:p,end:s.turn});
  }
  if(step.op==='fightStage'){
    const f=step.fight,a=unit(s,f.attacker),defenders=f.defenders.map(uid=>unit(s,uid)).filter(u=>u&&!u.dying&&(f.remote||a&&sameLocation(s,u,a)));
    if(!a||a.dying||!defenders.length){queueEffects(s,[{op:'fightFinish',fight:f}],source,p);return;}
    const all=[a,...defenders],firstIds=step.firstIds||all.filter(u=>!disabled(u)&&strikesFirst(s,u,f)).map(u=>u.uid);
    const plans=all.filter(u=>!disabled(u)&&(!(combatHas(s,u,'noDefensiveStrike',ruleAPI(s)))||u.uid===a.uid||step.fight.kind==='spell')&&(step.phase==='first'?firstIds.includes(u.uid):!firstIds.includes(u.uid))).map(u=>({uid:u.uid,amount:strikeTotal(s,u),targets:u.uid===a.uid?defenders.map(v=>v.uid):[a.uid]}));
    queueEffects(s,[{op:'combatAllocate',fight:f,phase:step.phase,firstIds,plans,planIndex:0,targetIndex:0,allocations:plans.map(()=>[])}],source,p);
  }
  if(step.op==='combatAllocate'){
    const {plans,planIndex:i,targetIndex:j,allocations}=step,plan=plans[i];
    if(!plan){queueEffects(s,[{...step,op:'combatResolve'}],source,p);return;}
    const remaining=plan.amount-allocations[i].reduce((n,v)=>n+v.amount,0),target=unit(s,plan.targets[j]);
    if(j===plan.targets.length-1){allocations[i].push({uid:plan.targets[j],amount:remaining});queueEffects(s,[{...step,planIndex:i+1,targetIndex:0}],source,p);return;}
    if(selected===undefined){s.choice={player:unit(s,plan.uid).controller,title:card(unit(s,plan.uid).card).name+'：分配給 '+card(target.card).name+'（剩餘 '+remaining+' 傷害）',options:Array.from({length:remaining+1},(_,amount)=>({label:String(amount)+' 傷害',value:amount})),frame};return;}
    assert(Number.isInteger(selected)&&selected>=0&&selected<=remaining,'傷害分配超出範圍');allocations[i].push({uid:target.uid,amount:selected});queueEffects(s,[{...step,targetIndex:j+1}],source,p);
  }
  if(step.op==='combatResolve'){
    queueEffects(s,[step.phase==='first'?{op:'fightStage',fight:step.fight,phase:'normal',firstIds:step.firstIds}:{op:'fightFinish',fight:step.fight}],source,p);
    s.damageWindow={wards:s.units.filter(u=>u.ward).map(u=>u.uid)};
    const criticalPlans=prepareCriticalStrikeWindow(s,step.plans.map((plan,i)=>({...plan,allocations:step.allocations[i]})),ruleAPI(s));
    try{for(const [i,plan] of step.plans.entries()){const u=unit(s,plan.uid);if(u&&!u.dying)strikeMany(s,u,step.allocations[i],false,false,criticalPlans[plan.uid]||[]);}for(const uid of s.damageWindow.hydras||[]){const u=unit(s,uid);if(u&&!u.lethal&&u.damage<power(u,true))u.damage=0;}}finally{delete s.damageWindow;}
  }
  if(step.op==='fightFinish'){const u=unit(s,step.fight.attacker);if(u&&step.fight.kind!=='spell')u.stealth=false;}
  if(step.op==='searchDiscardTop'){
    const deck=s.players[p].spells,pool=step.pool||deck.splice(0,step.count);
    if(selected===undefined&&pool.length){s.choice={player:p,title:'搜尋頂牌：選擇要棄掉的僕從，或找不到',options:[...pool.flatMap((id,index)=>card(id).type==='Minion'?[{label:card(id).name,value:index}]:[]),{label:'找不到',value:'none'}],frame:{...frame,step:{...step,pool}}};return;}
    if(selected!==undefined&&selected!=='none'){assert(Number.isInteger(selected)&&card(pool[selected]).type==='Minion','必須選擇僕從');const id=pool.splice(selected,1)[0];sendCard(s,p,id,'cemetery');}
    queueEffects(s,[{op:'orderDeck',deck:'spells',count:pool.length,pool,destination:'bottom'}],source,p,frame.effectCard);
  }
  if(step.op==='lookHand'&&selected===undefined)s.choice={player:p,title:'查看對手手牌',options:[{label:s.players[1-p].hand.map(h=>card(h.card).name).join(' ／ ')||'對手沒有手牌',value:'continue'}],frame};
  if(step.op==='roadPower')for(const u of entities)queueEffects(s,[{op:'roadPowerMode',uid:u.uid}],source,p,frame.effectCard);
  if(step.op==='roadPowerMode'){
    if(selected===undefined){s.choice={player:p,title:'本回合力量增減',options:[{label:'+1 力量',value:1},{label:'−1 力量',value:-1}],frame};return;}
    const u=unit(s,step.uid);if(u&&siteEffectAllowed(s,u,'modify',{card}))u.mods.push({power:selected,end:s.turn});
  }
  if(step.op==='surfaceSite')for(const u of s.units)if(!u.dying&&card(u.card).type==='Minion'&&siteEffectAllowed(s,u,'move',{card},frame.abilityOrigin||source.abilityOrigin||source.card)&&fiftyForceAllowed(s,u,p,ruleAPI(s))){const move=geometryForcedSurfaceMove(s,u,selected.at,ruleAPI(s));if(move)applyGeometryForcedMove(u,move);}
  if(step.op==='thinIce'){
    const minions=s.units.filter(u=>u.at===source.at&&(u.layer||'surface')==='surface'&&card(u.card).type==='Minion'&&!u.dying);
    if(minions.reduce((n,u)=>n+power(u),0)>=5)for(const u of minions)if(siteEffectAllowed(s,u,'move',{card}))u.layer='below';
  }
  if(step.op==='peekSpell'){
    const deck=s.players[p][step.deck||'spells'];if(!deck.length)return;
    if(selected===undefined){s.choice={player:p,title:'檢視頂牌：'+card(deck[0]).name,options:[{label:'留在頂部',value:'keep'},{label:'放到牌庫底部',value:'bottom'}],frame};return;}
    if(selected==='bottom')deck.push(deck.shift());
  }
  if(step.op==='orderDeck'){
    const deck=s.players[p][step.deck],pool=step.pool||deck.splice(0,step.count),ordered=step.ordered||[],move=Math.min(step.move??step.count,pool.length+ordered.length);
    if(selected!==undefined){assert(Number.isInteger(selected)&&pool[selected],'排序選擇已失效');ordered.push(pool.splice(selected,1)[0]);}
    if(ordered.length>=move||!pool.length){if(step.destination==='top')deck.unshift(...ordered,...pool);else {deck.unshift(...pool);deck.push(...ordered);}return;}
    s.choice={player:p,title:step.destination==='top'?'依序放回牌庫頂部':'選擇下一張放到牌庫底部的牌',options:pool.map((id,index)=>({label:card(id).name,value:index})),frame:{...frame,step:{...step,pool,ordered}}};
  }
  if(step.op==='bottomToTop'){
    const deck=s.players[p].spells,pool=step.pool||deck.splice(Math.max(0,deck.length-step.count));if(!pool.length)return;
    if(selected===undefined){s.choice={player:p,title:'檢視底部牌：選一張放到頂部',options:pool.map((id,index)=>({label:card(id).name,value:index})),frame:{...frame,step:{...step,pool}}};return;}
    assert(Number.isInteger(selected)&&pool[selected],'底牌選擇已失效');deck.unshift(pool.splice(selected,1)[0]);deck.push(...pool);
  }
  if(step.op==='broceliande')for(const u of s.units)if(nearby(s,u.at,source.at)&&regionNames(s,u).has('surface')&&siteEffectAllowed(s,u,'modify',{card})){const types=unitTypes(u,s);if(types.includes('Faerie'))untap(s,u);if(types.includes('Mortal'))u.tapped=true;if(types.includes('Beast'))u.stealth=true;}
  if(step.op==='permanentAffinity'){
    if(selected===undefined){s.choice={player:p,title:'選擇永久提供的元素',options:elements.map(e=>({label:e,value:e})),frame};return;}
    if(s.board[source.at])s.board[source.at].chosenAffinity=selected;
  }
  if(step.op==='temporaryAffinity'){
    if(selected===undefined){s.choice={player:p,title:'本回合獲得哪個元素？',options:elements.map(e=>({label:e,value:e})),frame};return;}
    const pl=s.players[p];if(!pl.bonusAffinity)pl.bonusAffinity={};pl.bonusAffinity[selected]=(pl.bonusAffinity[selected]||0)+1;
  }
  if(step.op==='floodSite'){const site=s.board[selected.at];if(site){if(!site.effects)site.effects=[];site.effects.push({flood:true,end:s.turn,stamp:s.next++});}}
  if(step.op==='giveSite'&&s.board[source.at])s.board[source.at].controller=1-p;
  if(step.op==='terrainEffect'){
    if(!s.ongoingEffects)s.ongoingEffects=[];s.ongoingEffects.push({...step,abilityOrigin:frame.abilityOrigin||source.abilityOrigin||source.card,select:undefined,at:selected?.at??source.at,controller:p,until:p});
  }
  if(step.op==='browseTop'){
    const pool=s.players[p].spells.splice(0,step.count);
    queueEffects(s,[{op:'browsePick',pool,limit:step.limit||1,evilMinions:!!step.evilMinions,chosen:[]}],source,p,frame.effectCard);
  }
  if(step.op==='browsePick'){
    const choices=step.pool.flatMap((id,index)=>!step.evilMinions||card(id).type==='Minion'&&cardForPlayer(s,id,p).umbrellas.includes('Evil')&&!step.chosen.includes(id)?[{label:card(id).name,value:index}]:[]);
    if(selected===undefined&&step.limit>0&&choices.length){s.choice={player:p,title:step.evilMinions?'選擇不同的 Evil 僕從，或停止':'選擇一張加入手牌',options:[...choices,...(step.evilMinions?[{label:'停止選取',value:'stop'}]:[])],frame};return;}
    if(selected!==undefined&&selected!=='stop'){
      assert(Number.isInteger(selected)&&step.pool[selected],'頂牌選擇已失效');const pool=[...step.pool],id=pool[selected];
      if(step.evilMinions){
        log(s,'揭示 '+card(id).name+'。');
        if(!drawFromSearch(s,p,id)){queueEffects(s,[{op:'browseBottom',pool}],source,p,frame.effectCard);return;}
      }else s.players[p].hand.push({uid:'h'+s.next++,card:id});
      pool.splice(selected,1);
      queueEffects(s,[{...step,pool,limit:step.limit-1,chosen:[...step.chosen,id]}],source,p,frame.effectCard);
    }else queueEffects(s,[{op:'browseBottom',pool:step.pool}],source,p,frame.effectCard);
  }
  if(step.op==='browseBottom'&&step.pool.length){
    if(selected===undefined){s.choice={player:p,title:'選擇下一張放到牌庫底部的牌',options:step.pool.map((id,index)=>({label:card(id).name,value:index})),frame};return;}
    assert(Number.isInteger(selected)&&step.pool[selected],'牌庫底部排序已失效');const pool=[...step.pool];s.players[p].spells.push(pool.splice(selected,1)[0]);queueEffects(s,[{...step,pool}],source,p,frame.effectCard);
  }
  if(step.op==='searingTruth'){
    const q=selected.player,ids=[draw(s,q,'spells'),draw(s,q,'spells')].filter(Boolean);log(s,'揭示 '+ids.map(id=>card(id).name).join('、'));hurt(s,avatar(s,q),Math.max(0,...ids.map(id=>card(id).cost)),false,damageKind,source);
  }
  if(step.op==='destroyRanks'){
    const matches=id=>step.ranks.some(r=>hasSiteRarity(card(id),r));
    for(const u of [...s.units])if(matches(u.card))kill(s,u);
    for(const o of [...s.artifacts||[],...s.auras||[]])if(matches(o.card))removeObject(s,o,'cemetery');
    for(let at=0;at<20;at++)if(s.board[at]&&matches(s.board[at].card))destroySite(s,at);
  }
  if(step.op==='hellfire'){
    for(const u of [...s.units])if(s.board[u.at]&&(u.layer||'surface')==='below')kill(s,u);
    for(const o of [...s.artifacts||[]])if(s.board[o.at]&&o.layer==='below')removeObject(s,o,'cemetery');
    for(const u of s.units)if(s.board[u.at]&&(u.layer||'surface')==='surface'&&card(u.card).type==='Minion')hurt(s,u,2,false,damageKind,source);
  }
  if(step.op==='recallAllies')queueEffects(s,[{op:'recallOne',picks:[],remaining:s.units.filter(u=>u.controller===p&&card(u.card).type==='Minion'&&!u.dying).map(u=>u.uid)}],source,p,frame.effectCard);
  if(step.op==='recallOne'){
    const remaining=step.remaining.filter(uid=>{const u=unit(s,uid);return u&&!u.dying&&u.controller===p&&card(u.card).type==='Minion';}),picks=step.picks||[];
    // Finish choosing the entire subset before any teleport or entry trigger.
    // The Magic choice-context hook grants Book Ward before this batch moves.
    if(selected==='stop'||selected===undefined&&!remaining.length){
      for(const uid of picks){const u=unit(s,uid);if(u&&!u.dying&&u.controller===p){u.at=source.at;u.layer=source.layer||'surface';}}
      return;
    }
    if(selected===undefined){const options=remaining.map(uid=>({label:card(unit(s,uid).card).name,value:uid}));s.choice={player:p,title:'召回僕從，或結束召回',options:[...options,{label:'結束召回',value:'stop'}],frame};return;}
    if(!remaining.includes(selected))throw Error('Recall choice is no longer an allied minion');
    queueEffects(s,[{...step,picks:[...picks,selected],remaining:remaining.filter(uid=>uid!==selected)}],source,p,frame.effectCard);
  }
  if(step.op==='snatchArtifact')for(const o of entities){const u=unit(s,source.uid);if(u){o.bearer=u.uid;o.at=u.at;o.layer=u.layer||'surface';o.controller=u.controller;}}
  if(step.op==='shieldWall'||step.op==='witchingHour'){
    if(!s.ongoingEffects)s.ongoingEffects=[];s.ongoingEffects.push({op:step.op,controller:p,...(step.op==='shieldWall'?{until:p}:{end:s.turn})});
  }
  if(step.op==='trialWaterChoose')for(const u of entities)queueEffects(s,[{op:'trialWaterSink',select:{kind:'unit',minion:true,nearby:true,water:true}}],u,p,frame.effectCard);
  if(step.op==='trialWaterSink')for(const u of entities)if(waterSite(s,u.at,card))u.layer='below';
  if(step.op==='ambushSkeletons')for(const u of entities)queueEffects(s,[{op:'summon',slug:'skeleton',where:'adjacentSites'}],u,p,frame.effectCard);
  if(step.op==='razeSite')for(const u of entities){destroySite(s,u.at);for(const o of [...s.artifacts||[]])if(o.at===u.at)removeObject(s,o,'cemetery');}
  if(step.op==='detonate')for(const o of entities){queueEffects(s,[{op:'detonateDamage',at:o.at,layer:o.layer||'surface'}],source,p,frame.effectCard);if(targets.some(v=>v.entity==='artifact'&&v.uid===o.uid))removeObject(s,o,'cemetery');else kill(s,o);}
  if(step.op==='detonateDamage')for(const u of s.units)if(occupiesGeometryLocation(u,step.at,step.layer,s))hurt(s,u,3,false,damageKind,source);
  if(step.op==='conquerSite'&&s.board[source.at]&&!s.units.some(u=>u.controller!==p&&occupied(u).includes(source.at)&&!u.dying))s.board[source.at].controller=p;
  if(step.op==='nearbyRandomDiscard')for(let q=0;q<2;q++)if(nearby(s,source.at,avatar(s,q).at)&&regionsOverlap(s,source,avatar(s,q))){const pl=s.players[q];if(pl.hand.length){const h=pl.hand.splice(rollIndex(s,pl.hand.map(h=>card(h.card).type==='Site'?'Atlas card':'Spellbook card')),1)[0];sendCard(s,q,h.card,'cemetery');}}
  if(step.op==='carryingDraw'&&(s.artifacts||[]).some(o=>artifactIsCarriedBy(o,source.uid)))queueEffects(s,[{op:'drawCards',count:1}],source,p,frame.effectCard);
  if(step.op==='faerieDraw'){const n=s.units.filter(u=>!u.dying&&unitTypes(u,s).includes('Faerie')).length;for(let q=0;q<2;q++)for(let i=0;i<n;i++)draw(s,q,'spells');}
  if(step.op==='drawCards'){
    if(selected===true){queueEffects(s,[{...step,optional:false}],source,p,frame.effectCard);return;}
    let n=step.count;
    if(n==='uniqueAllies')n=s.units.filter(u=>u.controller===p&&card(u.card).slot==='Unique').length;
    if(n==='alliedRarities')n=new Set(s.units.filter(u=>u.controller===p&&card(u.card).type==='Minion').map(u=>card(u.card).slot).filter(Boolean)).size;
    if(n==='band')n=new Set([...s.units.filter(u=>unitTypes(u,s).includes('Undead')),...(s.artifacts||[]).filter(a=>card(a.card).subtypes.some(t=>t.includes('Instrument')))].filter(u=>nearby(s,u.at,source.at)&&regionsOverlap(s,u,source)).map(u=>u.card)).size;
    if(n<=0)return;
    if(selected===undefined){s.choice={player:p,title:'抽 '+n+' 張牌：先宣告 Atlas／Spellbook 張數',options:Array.from({length:n+1},(_,sites)=>({label:'地點 '+sites+' ／ 法術 '+(n-sites),value:{sites,spells:n-sites}})),frame:{...frame,step:{...step,count:n}}};return;}
    queueEffects(s,[...Array.from({length:selected.sites},()=>({op:'drawOne',deck:'atlas'})),...Array.from({length:selected.spells},()=>({op:'drawOne',deck:'spells'}))],source,p,frame.effectCard);return;
  }
  if(step.op==='drawBottomSpell')draw(s,p,'spells',null,true);
  if(step.op==='banishGraves')queueEffects(s,[{op:'banishGraveOne',remaining:step.count,optional:!!step.optionalCards,select:{kind:'grave',player:selected.player}}],source,p,frame.effectCard);
  if(step.op==='banishGraveOne'){
    const pl=s.players[selected.player];assert(pl.cemetery[selected.index]===selected.card,'墓地選擇已失效');takeGrave(s,selected.player,selected.index,selected.card,selected.uid);pl.banished.push(selected.card);
    if(step.remaining>1)queueEffects(s,[{...step,remaining:step.remaining-1}],source,p,frame.effectCard);
  }
  if(step.op==='poachDeck')queueEffects(s,[{op:'poachOne',remaining:step.count,optional:true,select:{kind:'deck',player:selected.player,types:['Beast']}},{op:'shuffleDeck',player:selected.player}],source,p,frame.effectCard);
  if(step.op==='poachOne'){
    const pl=s.players[selected.player];assert(pl.spells[selected.index]===selected.card,'牌庫選擇已失效');pl.spells.splice(selected.index,1);pl.banished.push(selected.card);
    if(step.remaining>1)queueEffects(s,[{...step,remaining:step.remaining-1}],source,p,frame.effectCard);
  }
  if(step.op==='takeDeck'){
    const pl=s.players[selected.player];assert(pl.spells[selected.index]===selected.card,'牌庫選擇已失效');pl.spells.splice(selected.index,1);pl.hand.push({uid:'h'+s.next++,card:selected.card});log(s,'揭示 '+card(selected.card).name+' 並加入手牌。');
  }
  if(step.op==='shuffleDeck')shuffle(s,s.players[step.own?p:step.player].spells);
  if(step.op==='brotherSummon'){if(!canSummonEntry(s,p,card(selected.card),source.at,source.layer||'surface'))return;
    const pl=s.players[selected.player];
    if(selected.entity==='deck'){assert(pl.spells[selected.index]===selected.card,'牌庫選擇已失效');pl.spells.splice(selected.index,1);shuffle(s,pl.spells);}else pl.hand=pl.hand.filter(h=>h.uid!==selected.uid);
    const u=makeUnit(s,selected.card,p,source.at);u.layer=source.layer||'surface';refreshContinuous(s);if(!u.silenced)queueEffects(s,definitions[card(u.card).slug]?.genesis||[],u,p);
  }
  if(step.op==='sacrificeDraw')for(const u of entities){queueEffects(s,[{op:'draw',deck:'spells',count:1}],source,p,frame.effectCard);kill(s,u,false,true,true);}
  if(step.op==='sacrificeOrDamage'){
    if(selected===undefined){s.choice={player:p,title:'犧牲僕從，或承受 '+step.amount+' 傷害',options:[...selectEffects(s,frame,{kind:'unit',minion:true,ally:true,anyRegion:true,untargeted:true}),{label:'不犧牲，承受傷害',value:'damage'}],frame};return;}
    if(selected==='damage')hurt(s,avatar(s,p),step.amount,false,damageKind,source);else {const u=unit(s,selected.uid);if(u)kill(s,u,false,true,true);}
  }
  if(step.op==='discardOrStrike'){
    if(selected===undefined){s.choice={player:p,title:'棄一張牌，或 Avatar 被攻擊',options:[...selectEffects(s,frame,{kind:'hand'}),{label:'不棄牌，Avatar 受到 Strike',value:'strike'}],frame};return;}
    if(selected==='strike')strike(s,source,avatar(s,p));else {const pl=s.players[p],h=pl.hand.find(h=>h.uid===selected.uid);if(h){pl.hand=pl.hand.filter(v=>v.uid!==h.uid);sendCard(s,selected.player,h.card,'cemetery');}}
  }
  if(step.op==='returnIfMortal'&&s.units.some(u=>u.uid!==source.uid&&u.controller===p&&unitTypes(u,s).includes('Mortal'))){const u=unit(s,source.uid);if(u)u.destination='hand';}
  if(step.op==='harpyPull')for(const u of entities){u.at=source.at;u.layer=source.layer||'surface';queueEffects(s,[{op:'strikeFixed',uid:u.uid,optional:true}],source,p,frame.effectCard);}
  if(step.op==='strikeFixed'){const u=unit(s,step.uid);if(u)strike(s,source,u);}
  if(step.op==='raphael')for(const u of entities)queueEffects(s,[{op:'raphaelMode',uid:u.uid}],source,p,frame.effectCard);
  if(step.op==='raphaelMode'){
    if(selected===undefined){s.choice={player:p,title:'Raphael：Strike 或 Ward',options:[{label:'Strike',value:'strike'},{label:'Ward',value:'ward'}],frame};return;}
    const u=unit(s,step.uid);if(u){if(selected==='strike')strike(s,source,u);else u.ward=true;}
  }
  if(step.op==='modify')for(const u of entities)u.mods.push({...step.mod,...(step.duration==='next'?{until:p}:{end:s.turn})});
  if(step.op==='transformToken')for(const u of entities){if(unmodifiable(u))continue;s.players[u.owner].banished.push(u.card);u.card=card(step.slug).id;log(s,'變形為 '+card(u.card).name+'，保留同一實體。');}
  if(step.op==='fade')for(const u of entities){u.stealth=true;if(occupied(u).some(at=>s.board[at]?.controller===1-p))queueEffects(s,[{op:'drawCards',count:1}],source,p,frame.effectCard);}
  if(step.op==='blinkAlly')for(const u of entities)queueEffects(s,[{op:'teleportChosen',uid:u.uid,select:{kind:'location',nearby:true,sameRegion:true}}],u,p,frame.effectCard);
  if(step.op==='teleportChosen'){const u=unit(s,step.uid);if(u){u.carryTeleport=true;u.at=selected.at;u.layer=selected.layer;u.burrowedSafely=false;}}
  if(step.op==='damageUntap')for(const u of entities){hurt(s,u,step.amount,false,damageKind,source);untap(s,u);}
  if(step.op==='silenceTap')for(const u of entities){u.mods.push({silenced:true,end:s.turn});u.tapped=true;}
  if(step.op==='smite')for(const u of entities){if(unitUmbrellas(u,s,p).includes('Evil'))kill(s,u,true);else strike(s,source,u);}
  if(step.op==='sourceStrikes')for(const u of entities)queueEffects(s,[{op:'strike',all:{kind:'unit',enemy:true,here:true}}],u,p,frame.effectCard);
  if(step.op==='duelChoose')for(const u of entities)queueEffects(s,[{op:'fightPair',select:{kind:'unit',enemy:true,adjacent:true}}],u,p,frame.effectCard);
  if(step.op==='fightPair')for(const u of entities){const ally=unit(s,source.uid);if(ally&&!ally.dying)fight(s,{attacker:ally.uid,defenders:[u.uid],kind:'spell',remote:true});}
  if(step.op==='triggerDeath')for(const u of entities)queueEffects(s,[...(!disabled(u)?[...unitDefinitionLayers(s,u,ruleAPI(s)).death||[],...u.addedDeath||[]]:[]),{op:'markStealth',uid:u.uid},{op:'draw',deck:'spells',count:1}],u,p,frame.effectCard);
  if(step.op==='markStealth'){const u=unit(s,step.uid);if(u)u.stealth=true;}
  if(step.op==='banish')for(const u of entities)kill(s,u,true);
  if(step.op==='satanicPanic'){for(const u of [...s.units])if(card(u.card).type==='Minion'&&unitTypes(u,s).includes('Demon'))kill(s,u);for(const u of entities)kill(s,u);}
  if(step.forceAction&&['shiftLayer','sinkSite'].includes(step.op)&&resolveCatalogForcedLayer(s,frame,ruleAPI(s)))return;
  if(step.op==='shiftLayer')for(const u of entities){u.layer=step.layer;u.burrowedSafely=false;}
  if(step.op==='sinkSite'){
    for(const u of [...s.units,...s.artifacts||[]])if(u.at===selected.at&&card(u.card).type!=='Avatar'){u.layer='below';u.burrowedSafely=false;}
  }
  if(step.op==='destroySiteMinions')for(const u of s.units)if(occupied(u).includes(selected.at)&&card(u.card).type==='Minion')kill(s,u);
  if(step.op==='liftSite'&&resolveCatalogForcedSurface(s,frame,ruleAPI(s)))return;
  if(step.op==='geyser'){
    const site=s.board[selected.at];if(site){if(!site.effects)site.effects=[];site.effects.push({flood:true,end:s.turn,stamp:s.next++});}
    for(const u of s.units)if(occupied(u).includes(selected.at)&&card(u.card).type==='Minion')u.mods.push({keyword:'Airborne',end:s.turn});
  }
  if(step.op==='resurrectRandom'){
    const dead=s.players.flatMap((pl,player)=>effectGraves(s,player,p).filter(g=>card(g.card).type==='Minion'&&card(g.card).playable));
    if(dead.length)summonGraveAt(s,dead[rollIndex(s,dead.map(g=>card(g.card).name))],p,selected.at,'surface');
  }
  if(step.op==='summonGrave')queueEffects(s,[{op:'summonGraveAt',grave:selected,select:{kind:'location',nearby:true,canSummon:selected.card}}],source,p,frame.effectCard);
  if(step.op==='summonGraveAt')summonGraveAt(s,step.grave,p,selected.at,selected.layer);
  if(step.op==='returnGraves'){
    queueEffects(s,[step.draw==='card'?{op:'drawCards',count:1}:{op:'draw',deck:step.draw,count:1}],source,p,frame.effectCard);
    queueEffects(s,[{op:'returnGraveOne',remaining:step.limit||cemeteryCards(s,p,ruleAPI(s)).length,oneCemetery:step.oneCemetery,optional:true,select:{kind:'grave',own:!!step.own,unique:!!step.unique}}],source,p,frame.effectCard);
  }
  if(step.op==='returnGraveOne'&&step.remaining>0&&selected){
    const pl=s.players[selected.player];assert(pl.cemetery[selected.index]===selected.card,'墓地選擇已失效');takeGrave(s,selected.player,selected.index,selected.card,selected.uid);pl[card(selected.card).type==='Site'?'atlas':'spells'].push(selected.card);
    if(step.remaining>1)queueEffects(s,[{...step,remaining:step.remaining-1,select:{...step.select,...(step.oneCemetery?{player:selected.player}:{})}}],source,p,frame.effectCard);
  }
  if(step.op==='draw')for(let i=0;i<(step.count==='voidMinions'?s.units.filter(u=>card(u.card).type==='Minion'&&regionNames(s,u).has('void')).length:step.count);i++)draw(s,p,step.deck);
  if(step.op==='heal')heal(s,p,step.amount);
  if(step.op==='gainMana')s.players[p].bonusMana=(s.players[p].bonusMana||0)+step.amount*(card(source.card).type==='Site'?siteMultiplier(s,source.at):1);
  if(step.op==='paySummon'&&resources(s,p).available>=step.amount){s.players[p].spent+=step.amount;queueEffects(s,[{op:'summon',slug:step.slug,count:1}],source,p,frame.effectCard);}
  if(step.op==='siteThreshold'){const site=s.board[source.at];if(site){site.bonusThreshold=Object.fromEntries(step.elements.map(e=>[e,1]));site.bonusTurn=s.turn;}}
  if(step.op==='siteDamage')for(const u of s.units)if(card(u.card).type==='Minion'&&occupiesGeometryLocation(u,selected.at,'surface',s))hurt(s,u,step.amount,false,damageKind,source);
  if(step.op==='healNearbyAvatars')for(let q=0;q<2;q++)if(nearby(s,source.at,avatar(s,q).at))heal(s,q,step.amount);
  if(step.op==='breakNearbyWards'){for(const u of s.units)if(nearby(s,source.at,u.at)&&regionNames(s,u).has('surface')&&siteEffectAllowed(s,u,'modify',{card}))u.ward=false;for(let at=0;at<20;at++)if(s.board[at]&&nearby(s,source.at,at))s.board[at].ward=false;}
  if(step.op==='beaconMana')s.players[p].bonusMana=(s.players[p].bonusMana||0)+s.board.filter((site,at)=>site&&nearby(s,at,source.at)&&s.units.some(u=>u.controller!==p&&occupiesGeometryLocation(u,at,'surface',s))).length;
  if(step.op==='mill')for(let i=0;i<step.count;i++){const id=s.players[p].spells.shift();if(id)sendCard(s,p,id,'cemetery');}
  if(step.op==='revealEnemies')for(const u of s.units)if(u.controller!==p&&siteEffectAllowed(s,u,'modify',{card}))u.stealth=false;
  if(step.op==='leylineDraw')for(const site of s.board.filter((v,at)=>v&&card(v.card).name===card(source.card).name&&distance(s,at,source.at)===1))draw(s,p,'spells');
  if(step.op==='poisonWell')loseLife(s,1-p,s.board.filter((v,at)=>v?.controller===1-p&&nearby(s,at,source.at)).length);
  if(step.op==='springDraw'&&s.board.filter(v=>v?.controller===p).length<s.board.filter(v=>v?.controller===1-p).length)for(let i=0;i<3;i++)draw(s,p,'atlas');
  if(step.op==='banishDeadHeal'){let n=0;for(let q=0;q<2;q++){const ids=removeGraves(s,q,id=>card(id).type==='Minion');n+=ids.length;s.players[q].banished.push(...ids);}heal(s,p,n);}
  if(step.op==='purgeCemeteries'&&s.players.reduce((n,pl)=>n+pl.cemetery.filter(id=>card(id).type==='Minion').length,0)>=3)for(let q=0;q<2;q++)s.players[q].banished.push(...removeGraves(s,q,()=>true));
  if(step.op==='lifeLoss')loseLife(s,step.opponent?1-p:p,step.amount,false,lifeCause);
  if(step.op==='powerSelf'){const u=unit(s,source.uid);if(u)u.mods.push({power:step.amount,end:s.turn});}
  if(step.op==='locationDamage')for(const u of s.units)if(occupied(u).includes(selected.at)&&(u.layer||'surface')===selected.layer&&(!step.other||u.uid!==source.uid))hurt(s,u,step.amount,false,damageKind,source);
  if(step.op==='sleepSelf'){const u=unit(s,source.uid);if(u)u.mods.push({asleep:true});}
  if(step.op==='randomMutation'){const u=unit(s,source.uid);if(u){const mutation=rollIndex(s,['Airborne','Ranged','Lethal','本回合 +3 力量']);u.mods.push(mutation===3?{power:3,end:s.turn}:{keyword:['Airborne','Ranged','Lethal'][mutation],end:s.turn});}}
  if(step.op==='tap')for(const u of entities)u.tapped=true;
  if(step.op==='safeStealth'&&!s.units.some(u=>u.controller!==p&&!u.dying&&nearby(s,source.at,u.at)&&regionsOverlap(s,source,u))){const u=unit(s,source.uid);if(u)u.stealth=true;}
  if(step.op==='destroyRandomArtifact'&&(s.artifacts||[]).length){const o=s.artifacts[rollIndex(s,s.artifacts.map(a=>card(a.card).name))];removeObject(s,o,'cemetery');}
  if(step.op==='taxNextTurn'){if(!s.ongoingEffects)s.ongoingEffects=[];s.ongoingEffects.push({op:'tax',controller:1-p,turn:s.turn+1,end:s.turn+1});}
  if(step.op==='setMaxLife')for(const pl of s.players)pl.maxLife=pl.life;
  if(step.op==='evilLifeLoss')for(let q=0;q<2;q++){const graveEvil=id=>{const c=cardForPlayer(s,id,cemeteryPhysicalPlayer(s,q,ruleAPI(s)));return c.type==='Minion'&&(c.umbrellas.includes('Evil')||c.subtypes.some(t=>['Demon','Undead','Monster'].includes(t)));};loseLife(s,q,s.units.filter(u=>u.controller===q&&card(u.card).type==='Minion'&&unitUmbrellas(u,s,p).includes('Evil')).length+cemeteryCards(s,q,ruleAPI(s)).filter(graveEvil).length,false,lifeCause);}
  if(step.op==='siteLifeLoss')for(let q=0;q<2;q++)loseLife(s,q,s.board.filter((v,i)=>v?.controller===q&&nearby(s,i,source.at)).length,false,lifeCause);
  if(step.op==='damageSite')damageSite(s,source.at,step.amount);
  if(step.op==='wardSite'&&s.board[source.at])s.board[source.at].ward=true;
  if(step.op==='destroySelf')kill(s,unit(s,source.uid));
  if(step.op==='stealthSelf'){const u=unit(s,source.uid);if(u)u.stealth=true;}
  if(step.op==='randomTeleport'){const u=unit(s,source.uid);if(u&&!u.dying){const at=rollIndex(s,Array.from({length:20},(_,i)=>String.fromCharCode(65+i%5)+(4-Math.floor(i/5)))),before=geometryLocationRecords(u),after=geometryLocationRecords({...u,at,layer:'surface'});if(fiftyForceAllowed(s,u,p,ruleAPI(s))&&after.length===before.length&&after.every((to,i)=>canEnterOnGround(s,u,before[i],to,card,keywords,true))){u.carryTeleport=true;u.at=at;u.layer='surface';u.burrowedSafely=false;}}}
  if(step.op==='discard'&&selected){const pl=s.players[selected.player],h=pl.hand.find(h=>h.uid===selected.uid);if(h){pl.hand=pl.hand.filter(v=>v.uid!==h.uid);sendCard(s,selected.player,h.card,'cemetery');}}
  if(step.op==='randomDiscard'){const q=step.player??(step.opponent?1-p:p),pl=s.players[q];if(pl.hand.length){const h=pl.hand.splice(rollIndex(s,pl.hand.map(h=>card(h.card).type==='Site'?'Atlas card':'Spellbook card')),1)[0];sendCard(s,q,h.card,'cemetery');}}
  if(step.op==='ritualMana')s.players[p].bonusMana=(s.players[p].bonusMana||0)+2*s.units.filter(u=>u.controller===p&&sameLocation(s,u,source)&&(card(u.card).type==='Avatar'||keywords(u).includes('Spellcaster'))).length;
  if(step.op==='wardAllies'){const at=selected.at;for(const u of s.units)if(occupied(u).includes(at)&&u.controller===p&&card(u.card).type==='Minion'&&!unitUmbrellas(u,s).includes('Evil')&&siteEffectAllowed(s,u,'modify',{card}))u.ward=true;}
  if(['dispelLocation','destroyLocation','returnLocation','unravelLocation','extinguish'].includes(step.op)){
    const at=selected.at,layer=selected.layer||'surface';
    if(selected.entity==='location'&&blocked(s,p,s.board[at]))return;
    for(const u of [...s.units])if(card(u.card).type==='Minion'&&geometryLocationRecords(u).some(loc=>loc.at===at&&(selected.entity==='site'||loc.layer===layer))){
      if(step.op==='destroyLocation'||step.op==='unravelLocation'&&unitTypes(u,s).includes('Undead'))kill(s,u);
      if(step.op==='returnLocation')leaveUnit(s,u,'hand');
      if(step.op==='extinguish'&&abilityUnitHasElement(s,u,'fire',ruleAPI(s)))kill(s,u,true);
    }
    for(const item of [...s.artifacts||[]])if(item.at===at&&(selected.entity==='site'||(item.layer||'surface')===layer)&&step.op!=='extinguish')removeObject(s,item,step.op==='returnLocation'?'hand':'cemetery');
    for(const aura of [...s.auras||[]])if(inside(aura,at)&&(selected.entity==='site'||(aura.layer||'surface')===layer)&&step.op!=='unravelLocation'&&(step.op!=='extinguish'||card(aura.card).fire>0))removeObject(s,aura,step.op==='returnLocation'?'hand':step.op==='extinguish'?'banished':'cemetery');
  }
  if(step.op==='banishWithItems')for(const u of entities){for(const a of [...s.artifacts||[]])if(artifactIsCarriedBy(a,u.uid))removeObject(s,a,'banished');kill(s,u,true);}
  if(step.op==='festival'){
    if(!zoneAccessAllowed(s,p,ruleAPI(s)))return;
    const summoned=[];
    const at=step.where==='avatar'?avatar(s,p).at:selected?.at??source.at;
    for(const slug of step.slugs||['eltham_townsfolk','serava_townsfolk']){
      const entry=collectionEntries(s,p,{slug},ruleAPI(s))[0];if(!entry||!takeCollection(s,p,entry,ruleAPI(s)))continue;
      if(!canSummonEntry(s,p,card(entry.card),at,'surface'))sendCard(s,p,entry.card,'banished');
      else if(paySummoningTax(s,entry.card,p,p)){const u=makeUnit(s,entry.card,p,at);if(step.charge)u.mods.push({keyword:'Charge',end:s.turn});summoned.push(u);}
    }
    for(const u of summoned.reverse())summonedGenesis(s,u);return;
  }
  if(step.op==='summon'){
    let sites=[selected?.entity==='unit'?unit(s,selected.uid)?.at:selected?.at??source.at];
    if(step.where==='avatar')sites=[avatar(s,p).at];
    if(step.where==='adjacentSites')sites=s.board.flatMap((v,i)=>v&&distance(s,i,source.at)===1?[i]:[]);
    if(step.where==='nearAvatarSites')sites=s.board.flatMap((v,i)=>v&&nearby(s,i,avatar(s,p).at)?[i]:[]);
    if(step.where==='borderSites')sites=s.board.flatMap((v,i)=>v?.controller===p&&s.board.some((other,j)=>other?.controller===1-p&&distance(s,i,j)===1)?[i]:[]);
    const slugs=[step.slug];
    for(const at of sites)if(at!==undefined)for(const slug of slugs)for(let i=0;i<(step.count||1);i++){
      const summonLayer=step.layer||(step.where==='borderSites'?'surface':selected?.entity==='unit'?unit(s,selected.uid)?.layer||'surface':source.layer||'surface');if(!canSummonEntry(s,p,card(slug),at,summonLayer)||!paySummoningTax(s,card(slug).id,p,p))continue;const u=makeUnit(s,card(slug).id,p,at);u.layer=summonLayer;
      if(step.addedDeath)u.addedDeath=structuredClone(step.addedDeath);if(step.charge)u.mods.push({keyword:'Charge',end:s.turn});summonedGenesis(s,u);
    }
  }
  if(step.op==='finishTurn'){
    endFinalArtifacts(s,p,ruleAPI(s));if(s.winner!==null)return;
    for(const u of s.units)if(u.controller===p&&u.iceTurns>0)u.iceTurns--;
    for(const player of s.players)player.bonusMana=0;
    s.players[p].bonusAffinity={};
    s.boundControls=(s.boundControls||[]).filter(e=>e.end!==s.turn);
    for(const u of s.units){u.damage=0;clearFinalStitchedDamage(u);u.lethal=false;for(const m of [...u.mods].reverse())if(m.end===s.turn&&m.returnControl!==undefined)u.controller=m.returnControl;u.mods=u.mods.filter(m=>m.end!==s.turn);}
    for(const a of [...s.artifacts||[]])if(passives[card(a.card).slug]?.afterTurnReturn)removeObject(s,a,'hand');
    expireAbilitySources(s,p);s.active=1-p;s.turn++;while(s.players[s.active].skipTurns>0){s.players[s.active].skipTurns--;s.turn++;s.active=1-s.active;}s.players[s.active].turnsTaken=(s.players[s.active].turnsTaken||0)+1;s.players[s.active].spent=0;s.phase='start';expireAnimations(s,s.active);startFinalSites(s,s.active);advanceTruces(s);
    s.ongoingEffects=(s.ongoingEffects||[]).filter(e=>!(e.op==='witchTax'&&e.usedTurn!==undefined));for(const e of s.ongoingEffects)if(e.op==='witchTax'&&e.player===s.active&&e.startAfter<s.turn)e.usedTurn=s.turn;
    for(const gift of s.pendingMana||[])if(gift.player===s.active)s.players[s.active].bonusMana=(s.players[s.active].bonusMana||0)+gift.amount;s.pendingMana=(s.pendingMana||[]).filter(g=>g.player!==s.active);
    s.ongoingEffects=(s.ongoingEffects||[]).filter(e=>!(e.end<s.turn)&&e.until!==s.active);
    for(const site of s.board)if(site?.effects)site.effects=site.effects.filter(e=>!(e.end<s.turn)&&e.until!==s.active);
    for(const a of [...s.auras||[]])if(a.controller===p&&a.remainingTurns!==undefined&&--a.remainingTurns===0)removeObject(s,a,'cemetery');
    for(const u of s.units)u.mods=u.mods.filter(m=>m.until!==s.active);
    returnCopies(s,s.active);refreshContinuous(s);for(const u of s.units)if(u.controller===s.active)untap(s,u);
    queueEffects(s,[{op:'finishStart'}],avatar(s,s.active),s.active);
    for(const morph of s.pendingMorphs||[])if(morph.player===s.active&&morph.after<s.turn)queueEffects(s,[{op:'morphMonsterWake',morph:morph.uid}],avatar(s,s.active),s.active,card('monstermorphosis').id);
    for(const dream of s.dreams||[])if(dream.player===s.active&&dream.after<s.turn)queueEffects(s,[{op:'dreamWake',dream:dream.uid}],avatar(s,s.active),s.active,card('dream_quest').id);
    for(const a of [...s.auras||[]].reverse())if(catalogAuraActive(a,disabled)&&a.controller===s.active)queueEffects(s,definitions[card(a.card).slug]?.start||[],a,s.active);
    for(const [at,site] of [...s.board.entries()].reverse())if(site?.controller===s.active)queueEffects(s,definitions[card(site.card).slug]?.start||[],{...site,at,uid:'site:'+at,layer:'surface'},s.active);
    for(const a of [...s.artifacts||[]].reverse())if(artifactController(s,a)===s.active&&!a.silenced&&!a.disabled)queueEffects(s,definitions[card(a.card).slug]?.start||[],a,s.active);
    for(const a of [...s.artifacts||[]].reverse()){const d=passives[card(a.card).slug],site=s.board[a.at];if(d?.siteStartMana&&!a.silenced&&!a.disabled&&!disabled(a)&&site?.controller===s.active&&!site.silenced&&!site.disabled&&!site.completionProtected&&!passives[card(site.card).slug]?.immutableSite)queueEffects(s,[{op:'obeliskStart',amount:d.siteStartMana,loss:d.siteStartLoss}],{...site,at:a.at,uid:site.uid||'site:'+a.at,layer:'surface'},s.active,a.card,{abilityOrigin:site.card,fresh:true});}
    for(const u of [...s.units].reverse())if(!u.finalAuraAnimation&&!disabled(u))queueEffects(s,(unitDefinitionLayers(s,u,ruleAPI(s)).start||[]).filter(step=>u.controller===s.active||passives[card(step.abilityOrigin).slug]?.everyStart),u,u.controller);
    log(s,s.players[s.active].name+' 的回合開始。');
  }
  if(step.op==='weatherEnd'){
    const aura=(s.auras||[]).find(a=>a.uid===source.uid);if(!aura)return;
    const d=areaAuras[card(aura.card).slug];
    const pool=s.units.filter(u=>!u.dying&&(u.layer||'surface')==='surface'&&occupied(u).some(at=>inside(aura,at)&&(d.weather!=='storm'||s.board[at])));
    if(d.weather==='storm'){if(pool.length)hurt(s,pool[rollIndex(s,pool.map(u=>card(u.card).name+' @ '+u.at))],3,false,'ability',aura);}
    else for(const u of pool)hurt(s,u,3,false,'ability',aura);
    queueEffects(s,[{op:'weatherMove'}],aura,aura.controller,aura.card);return;
  }
  if(step.op==='weatherMove'){
    const aura=(s.auras||[]).find(a=>a.uid===source.uid);if(!aura)return;
    const fire=areaAuras[card(aura.card).slug].weather==='fire',visited=aura.visited||[aura.at];
    const destinations=Array.from({length:20},(_,at)=>at).filter(at=>distance(s,at,aura.at)===1&&(fire?!visited.includes(at):area(s,at).length));
    if(!destinations.length){if(fire)removeObject(s,aura,'cemetery');return;}
    if(selected===undefined){s.choice={player:aura.controller,title:card(aura.card).name+' · '+(fire?'移往未經過的位置':'可移動一步'),options:[...destinations.map(at=>({label:String.fromCharCode(65+at%5)+(4-Math.floor(at/5)),value:at})),...(!fire?[{label:'留在原處',value:null}]:[])],frame:{...frame,step:{...step,may:!fire}}};return;}
    if(selected===null){assert(!fire,'Wildfire 必須移動');return;}
    assert(destinations.includes(selected),'光環移動位置已失效');aura.at=selected;if(fire)aura.visited=[...visited,selected];return;
  }
  if(step.op==='finishStart')s.phase='draw';
  if(step.op==='projectile'){
    if(!selected){s.choice={player:p,title:'選擇投射物方向',options:['北','東','南','西'].map((label,i)=>({label,value:i+1})),frame};return;}
    if(step.fiftySpear){queueEffects(s,[{op:'fiftyBoltTravel',kind:'spear',at:source.at,layer:source.layer||'surface',origin:true,direction:selected-1,amount:3,remaining:20,trail:[],hits:[],object:source.throwObject}],source,p,frame.effectCard);return;}
    if(step.diagramCone){queueEffects(s,[{op:'gridBlast',pattern:'cone',direction:selected-1}],source,p,frame.effectCard);return;}
    queueEffects(s,Array.from({length:step.count||1},()=>({op:'shot',at:source.at,layer:source.layer||'surface',origin:true,direction:selected-1,amount:step.amount,remaining:step.range??20,piercing:!!step.piercing,decay:step.decay||0,splash:step.splash||0,onePerLocation:!!step.onePerLocation,optionalHit:!!step.optionalHit,hook:!!step.hook,holyWater:!!step.holyWater,trail:[]})),source,p,frame.effectCard);
  }
  if(step.op==='shot'){
    const hit=s.units.filter(u=>!u.dying&&(!stealthHides(u)||unit(s,source.uid)?.canSeeStealth)&&(!u.projectileOver||disabled(u))&&occupiesGeometryLocation(u,step.at,step.layer,s)&&(!step.origin||u.controller!==p));
    const {x,y}=position(step.at),dx=[0,1,0,-1][step.direction],dy=[-1,0,1,0][step.direction],wrap=isGlobeActive(s,card),nextX=wrap?(x+dx+5)%5:x+dx,nextY=wrap?(y+dy+4)%4:y+dy,next=nextY*5+nextX;
    const blockedEntry=s.board[next]&&passives[card(s.board[next].card).slug]?.projectileBarrierAll||abilityProjectileBarrier(s,next,step.layer,p,ruleAPI(s));
    const originRegions=step.regions||[...regionNames(s,{at:step.at,layer:step.layer})],nextRegions=originRegions.filter(name=>regionNames(s,{at:next,layer:step.layer}).has(name));
    const nextValid=nextX>=0&&nextX<5&&nextY>=0&&nextY<4&&step.remaining>0&&!blockedEntry&&nextRegions.length>0;
    if((!hit.length||step.piercing)&&nextValid)queueEffects(s,[{...step,at:next,regions:nextRegions,origin:false,trail:[...(step.trail||[]),step.at],remaining:step.remaining-1,amount:step.amount-(step.decay||0)}],source,p,frame.effectCard);
    if(step.holyWater&&hit.length){queueEffects(s,[{op:'holyWaterHit',untargeted:true,...(hit.length===1?{uid:hit[0].uid}:{select:{kind:'unit',uids:hit.map(u=>u.uid),untargeted:true,anyRegion:true}})}],source,p,frame.effectCard);return;}
    if(step.hook&&hit.length){queueEffects(s,[{op:'hookHit',hitAt:step.at,trail:step.trail,untargeted:true,select:{kind:'unit',uids:hit.map(u=>u.uid),untargeted:true,anyRegion:true}}],source,p);return;}
    if(hit.length&&(step.onePerLocation||step.splash)){
      queueEffects(s,[{op:'projectileImpact',amount:step.amount,splash:step.splash||0,at:step.at,layer:step.layer,optional:!!step.optionalHit,untargeted:true,select:{kind:'unit',uids:hit.map(u=>u.uid),untargeted:true,anyRegion:true}}],source,p,frame.effectCard);
    }
    else if(step.piercing)for(const target of hit)hurt(s,target,step.amount,false,damageKind,source);
    else if(hit.length===1){if(step.ranged)strike(s,source,hit[0],step.amount,true);else hurt(s,hit[0],step.amount,false,damageKind,source);}
    else if(hit.length>1)queueEffects(s,[{op:step.ranged?'rangedHit':'damage',amount:step.amount,untargeted:true,select:{kind:'unit',uids:hit.map(u=>u.uid),untargeted:true,anyRegion:true}}],source,p,frame.effectCard);
  }
  if(step.op==='projectileImpact'){
    const target=unit(s,selected?.uid);if(!target||target.dying)return;
    // Snapshot the entire impact before state-based deaths are checked.
    const victims=s.units.filter(u=>!u.dying&&occupiesGeometryLocation(u,step.at,step.layer,s));
    for(const u of victims)if(u.uid===target.uid||step.splash)hurt(s,u,u.uid===target.uid?step.amount:step.splash,false,damageKind,source);
  }
}
function effectAvailable(s,f){
  if(f.step.requiresThreshold&&Object.entries(f.step.requiresThreshold).some(([element,amount])=>resources(s,f.controller)[element]<amount))return false;
  if(f.step.op==='hookFight'){const source=unit(s,f.source.uid),target=unit(s,f.step.target);return !!source&&!!target&&!source.dying&&!target.dying&&sameLocation(s,source,target);}
  if(['paySummon','payLance'].includes(f.step.op))return resources(s,f.controller).available>=f.step.amount;
  if(['burrowSelf','submergeHere'].includes(f.step.op)){const u=unit(s,f.source.uid);return !!u&&(u.layer||'surface')==='surface'&&!!s.board[u.at]&&(f.step.op==='submergeHere'?waterSite(s,u.at,card):!waterSite(s,u.at,card));}
  return true;
}
const effectTitles={transformToken:'選擇要變形的單位',morriganDamage:'Ring of Morrigan : '+String.fromCharCode(21487,36896,25104,49,40670,20663,23475,20006,22238,24489,49,29983,21629),projectileImpact:'選擇命中單位',lureStep:'選擇受引誘的敵方僕從',hookHit:'選擇鉤索命中單位',hookFight:'是否與被拖回的單位戰鬥',swallow:'選擇吞入腹中的僕從',chainResolve:'選擇第一個連鎖目標',gridBlast:'選擇範圍中心',maelstromPlan:'是否拉入水域內所有僕從'};
Object.assign(effectTitles,{reactionHero:'可將受攻擊的較弱友軍返回擁有者手牌',reactionPeace:'可贈與對方，換取其下回合休戰'});
const effectAPI={select:(s,frame,filter)=>{noteFinalInquisitionSearch(s,frame,filter,ruleAPI(s));return selectEffects(s,frame,filter);},resolve:resolveRandomAware,check:s=>{stateBased(s);const observation=s.finalVindictiveObservation;delete s.finalVindictiveObservation;if(observation)detectVindictiveChanges(s,observation.before,observation.actor,ruleAPI(s));delete s.eventContext;},title:frame=>card(frame.effectCard).name+' · '+(effectTitles[frame.step.op]||(frame.step.select?.kind==='site'?'選擇地點':'選擇效果')),available:effectAvailable};
function summonGraveAt(s,grave,controller,at,layer){
  if(!canSummonEntry(s,controller,card(grave.card),at,layer||'surface'))return null;
  const pl=s.players[grave.player];assert(pl.cemetery[grave.index]===grave.card,'墓地選擇已失效');takeGrave(s,grave.player,grave.index,grave.card,grave.uid);
  if(!paySummoningTax(s,grave.card,grave.player,controller))return null;
  const u=makeUnit(s,grave.card,grave.player,at);u.controller=controller;u.layer=layer||'surface';summonedGenesis(s,u);return u;
}
function summonedGenesis(s,u){
  const history=s.summonHistory||(s.summonHistory=[]);if(!history.some(e=>e.uid===u.uid&&e.turn===s.turn))history.push({uid:u.uid,turn:s.turn,name:card(u.card).name,card:u.card,controller:u.controller});
  if(finalAvatarEntry(s,u,ruleAPI(s)))return;
  if(deferFinalUnitEntry(s,u,ruleAPI(s)))return;
  if(!unit(s,u.uid))return;
  if(offRealmPassiveEntries(card(u.card).printedAbilityRecord?card(u.card):cardForPlayer(s,u.card,u.controller),'ambushAbove',ruleAPI(s)).some(v=>v.value)){u.layer='below';u.burrowedSafely=true;}
  refreshContinuous(s);if(!unit(s,u.uid))return;
  if(offRealmPassiveEntries(card(u.card).printedAbilityRecord?card(u.card):cardForPlayer(s,u.card,u.controller),'ambushAbove',ruleAPI(s)).some(v=>v.value)){u.layer='below';u.burrowedSafely=true;}
  if(deferCopyEntry(s,u,ruleAPI(s)))return;
  const summoner=u.controller;
  refreshContinuous(s);
  for(const at of occupied(u)){const site=s.board[at];if(site?.controller===summoner&&!site.silenced&&sitePassives[card(site.card).slug]?.summonKillWeakBeast)queueEffects(s,[{op:'destroy',select:{kind:'unit',minion:true,enemy:true,types:['Beast'],maxPower:2,nearby:true,siteBothLayers:true}}],{...site,at,uid:'site:'+at,layer:'surface'},summoner);}
  for(const a of [...s.auras||[]]){const d=areaAuras[card(a.card).slug];if(d?.returnOnSummon&&a.controller===summoner&&occupied(u).some(at=>inside(a,at))&&matches({...card(u.card),subtypes:unitTypes(u,s)},d,unitUmbrellas(u,s,a.controller))){u.mods.push({keyword:'Charge'});removeObject(s,a,'hand');}}
  if(card(u.card).slug==='king_arthur'||[...unitTypes(u,s),...unitUmbrellas(u,s)].some(t=>['Knight','Sir','Dame'].includes(t)))for(const a of s.artifacts)if(artifactController(s,a)===summoner&&passives[card(a.card).slug]?.knightSummonDraw&&sameLocation(s,u,a))queueEffects(s,[{op:'drawCards',count:1}],a,summoner);
  refreshContinuous(s);if(u.silenced){if(!keywords(u).includes('Ward'))u.ward=false;if(!keywords(u).includes('Stealth'))u.stealth=false;}
  if(!unit(s,u.uid))return;
  const c=card(u.card);const saintweald=occupied(u).some(at=>s.board[at]&&sitePassives[card(s.board[at].card).slug]?.deathAlsoGenesis&&siteEffectAllowed(s,u,'modify',{card},s.board[at].card));const live=unitDefinitionLayers(s,u,ruleAPI(s));queueEffects(s,[...live.genesis||[],...(saintweald?live.death||[]:[])],u,u.controller);
}
export function summoningTax(s,c){return s.board.reduce((n,site)=>n+(site&&!site.silenced&&!site.disabled?sitePassives[card(site.card).slug]?.minionTax?.[c.rarity||c.slot]||0:0),0);}
function paySummoningTax(s,id,owner,controller){
  const amount=summoningTax(s,card(id));
  if(resources(s,controller).available<amount){s.players[owner].banished.push(id);log(s,card(id).name+' 無法支付額外召喚費用，被放逐。');return false;}
  s.players[controller].spent+=amount;return true;
}
function searchSummonEntries(s,p,zone,filter){
  const entries=zone==='cemetery'?yourGraves(s,p):s.players[p][zone].map((entry,index)=>({entity:zone==='hand'?'hand':'deck',player:p,index,card:zone==='hand'?entry.card:entry,...(zone==='hand'?{uid:entry.uid}:{})}));
  return entries.filter(entry=>{if(zone==='spells'&&entry.index>=searchLimit(s,p,ruleAPI(s)))return false;const c=cardForPlayer(s,entry.card,entry.player??p);return c.playable&&c.type==='Minion'&&(!filter.slug||c.slug===filter.slug)&&(!filter.types||filter.types.some(t=>c.subtypes.includes(t)||filter.includeUmbrellas&&cardForPlayer(s,c,c.finalTypePlayer??s.active).umbrellas.includes(t)))&&(!filter.keyword||printedKeywords(c).includes(filter.keyword))&&(filter.maxCost===undefined||c.cost<=filter.maxCost);}).map(entry=>({label:card(entry.card).name,value:entry}));
}
function removeObject(s,object,zone){
  if(!geometryRemoveArtifactAllowed(s,object,card))return false;
  if(object.finalAuraAnimation){if(zone==='hand')leaveUnit(s,object,zone);else kill(s,object,zone==='banished');return;}
  if(s.units.includes(object)&&card(object.card).artifactUnit){kill(s,object,zone==='banished');return;}
  if(object.tokenCopy)zone='banished';
  if(![...s.artifacts||[],...s.auras||[]].some(o=>o.uid===object.uid))return;
  for(const h of s.boundSpells||[])if(h.unit===object.uid)sendCard(s,h.owner,h.card,'cemetery');
  s.boundSpells=(s.boundSpells||[]).filter(h=>h.unit!==object.uid);
  if(card(object.card).category==='Token')zone='banished';
  if(zone==='hand')s.players[object.owner].hand.push({uid:'h'+s.next++,card:object.originalCard||object.baseCard||object.card});else if(!deferSacrificeCemetery(s,object,{owner:object.owner,card:object.originalCard||object.baseCard||object.card,zone}))sendCard(s,object.owner,object.originalCard||object.baseCard||object.card,zone);
  s.artifacts=(s.artifacts||[]).filter(a=>a.uid!==object.uid);s.auras=(s.auras||[]).filter(a=>a.uid!==object.uid);
}
function siteProtectedFromDestruction(s,at){return s.units.some(u=>!u.dying&&!disabled(u)&&unitPassiveLayerViews(s,u,ruleAPI(s),'fiftySiteProtection').some(l=>l.value)&&u.controller!==(s.eventContext?.controller??s.active)&&nearby(s,u.at,at));}
function destroySite(s,at,sacrifice=false){
  const site=s.board[at];if(!site)return;
  if(card(site.card).slug==='rubble')return;
  if(!sacrifice&&(passives[card(site.card).slug]?.immutableSite||site.completionProtected))return;
  if(!sacrifice&&(s.simultaneousDestruction?.protectedSites.includes(at)||siteProtectedFromDestruction(s,at)))return;
  if(!geometryPlaceSiteAllowed(s,card('rubble'),at,card))return;
  if(!sacrifice&&site.ward){noteBuiltWardConsumed(s,site);site.ward=false;return;}
  triggerVindictiveSiteEvent(s,captureVindictiveSites(s,ruleAPI(s)),at,'destroy',s.eventContext?.controller??s.active,ruleAPI(s));
  if(passives[card(site.card).slug]?.fiftyRoots)eventTrigger(s,{...site,at,uid:site.uid||'site:'+at},[{op:'fiftyArmageddon'}]);
  sendBuiltSite(s,site,card(site.card).category==='Token'?'banished':'cemetery',sacrificeSiteAPI(s,site));
  s.board[at]={uid:'s'+s.next++,card:card('rubble').id,controller:null,owner:null,ward:false};
}
function damageSite(s,at,amount,cause=null){if(cause)for(const trigger of combatTriggers(s,cause,'fiftyDestroyStruck',ruleAPI(s),()=>[{op:'fiftyLordStrike',at}]))eventTrigger(s,trigger.source,trigger.steps);const site=s.board[at];if(!site||amount<=0||site.controller!==0&&site.controller!==1)return 0;const recipient=finalCityDamageRecipient(s,at,amount,ruleAPI(s));if(recipient)return hurt(s,recipient,amount,false,s.eventContext?.effectCard&&card(s.eventContext.effectCard).type==='Magic'?'magic':'strike',cause);if(preventFinalSiteDamage(s,at,amount,{...ruleAPI(s),noteBuiltWardConsumed}))return 0;const threshold=sitePassives[card(site.card).slug]?.destroyWhenDamagedThreshold,breaks=threshold&&resources(s,site.controller)[threshold]>=1;loseLife(s,site.controller,amount,false,cause);if(breaks)destroySite(s,at);return amount;}
function beginSiteCard(s,a){const p=a.player;{const h=a.pathfinderSite?{card:s.players[p].atlas[0]}:s.players[p].hand.find(h=>h.uid===a.hand);assert(h?.card&&(!a.pathfinderSite||h.card===a.card),'Site source changed');if(passives[card(h.card).slug]?.fiftyMirror){let options=s.board.flatMap((site,at)=>site&&at!==a.at&&nearby(s,at,a.at)&&card(site.card).slug!=='mirror_realm'?[{label:card(site.card).name,value:site.baseCard||site.card}]:[]);if(!siteTargets(s,p).includes(a.at))options=options.filter(o=>passives[card(o.value).slug]?.riftValley);if(mirrorRiftTargets(s,ruleAPI(s),p).includes(a.at)&&!options.some(o=>passives[card(o.value).slug]?.riftValley))options.push({label:'Rift Valley · 拉開後鄰近複製來源',value:card('rift_valley').id});if(options.length)s.choice={player:p,title:'Mirror Realm',options:[...options,{label:'Cancel',value:null}],frame:{source:unit(s,a.siteActor)||avatar(s,p),controller:p,effectCard:h.card,step:{op:'fiftyMirrorChoose',action:a}}};else commitSiteCard(s,a);}else commitSiteCard(s,a);}}
function commitSiteCard(s,a,copyId=null){
  if(copyId)copyId=altarPhysicalBase(finalArchivePrintedCard(copyId,ruleAPI(s)),ruleAPI(s));
  const p=a.player,pl=s.players[p],actor=unit(s,a.siteActor)||avatar(s,p),h=a.pathfinderSite?{card:pl.atlas[0]}:pl.hand.find(h=>h.uid===a.hand);assert(h?.card&&(!a.pathfinderSite||h.card===a.card),'Site card is no longer at its source');const original=s.board[a.at],c=cardForPlayer(s,h.card,p);if(!geometryPlaceSiteAllowed(s,card(copyId||h.card),a.at,card))return false;const effectiveSite=card(copyId||h.card);if(passives[effectiveSite.slug]?.riftValley){if(!a.riftDecided&&riftPlans(s,ruleAPI(s)).some(v=>v.at===a.at)){queueEffects(s,[{op:'builtRiftChoose',action:a,copyId,normalAllowed:siteTargets(s,p).includes(a.at)}],avatar(s,p),p,effectiveSite.id);return;}if(a.riftPlan)assert(applyRiftPlan(s,a.riftPlan,ruleAPI(s)),'Rift Valley opening is no longer valid');}if(commitBuiltBabel(s,a,copyId||h.card,ruleAPI(s))){finalThronePlayed(s,p,card(copyId||h.card),ruleAPI(s));return;}let controller=p;
  if(original&&passives[c.slug]?.fiftyMirage&&original.owner===p&&original.controller===p)sendBuiltSite(s,original,'hand',ruleAPI(s));
  if(original&&passives[c.slug]?.fiftyHeirloom&&['Elite','Unique'].includes(card(original.card).rarity)){controller=original.controller;sendBuiltSite(s,original,'banished',ruleAPI(s));}
  actor.tapped=true;if(a.pathfinderSite)pl.atlas.shift();else pl.hand=pl.hand.filter(v=>v.uid!==a.hand);enterSite(s,controller,copyId||h.card,a.at,true,p);s.board[a.at].owner=p;prepareFinalAltarSite(s,a.at,h.card,ruleAPI(s));if(!actor.silenced&&passives[card(actor.card).slug]?.completionDruid&&s.players[p].turnsTaken===1)queueEffects(s,[{op:'completionDruidTawny'}],actor,p);if(copyId)s.board[a.at].originalCard=h.card;
}
function enterSite(s,p,id,at,geomancerPrimary=true,playingPlayer=p){
  if(!geometryPlaceSiteAllowed(s,card(id),at,card))return false;
  const controller=sitePassives[card(id).slug]?.entersOpponentControl?1-playingPlayer:p;
  s.board[at]={uid:'s'+s.next++,stamp:s.next-1,card:id,controller,owner:playingPlayer,born:s.turn,ward:!!sitePassives[card(id).slug]?.ward};log(s,s.players[p].name+' 放置 '+card(id).name+'。');
  if(card(id).category!=='Token'){if(s.players[playingPlayer])s.players[playingPlayer].finalHasPlayedSite=true;finalThronePlayed(s,playingPlayer,card(id),ruleAPI(s));}
  if(siteAffinity(s,at,card).earth>0){queueGraveReturns(s,playingPlayer,'bone_rabble',at);if(geomancerPrimary&&passives[card(avatar(s,playingPlayer).card).slug]?.earthPlayRubble)queueEffects(s,[{op:'geomancerRubble',select:{kind:'location',adjacent:true,voidOnly:true}}],avatar(s,playingPlayer),playingPlayer);}
  refreshContinuous(s);if(!s.board[at].silenced&&!s.board[at].disabled)queueEffects(s,definitions[card(s.board[at].card).slug]?.genesis||[],{...s.board[at],at,uid:s.board[at].uid||'site:'+at,layer:'surface'},controller);
  refreshContinuous(s);
  for(const [i,site] of s.board.entries())if(site&&i!==at&&!site.silenced&&!site.disabled){const d=passives[card(site.card).slug];if(d?.nearbyPlayedLifeLoss&&nearby(s,i,at)||d?.adjacentPlayedSkeleton&&distance(s,i,at)===1)queueEffects(s,[{op:'playedSiteReaction',player:controller,at,loss:d.nearbyPlayedLifeLoss&&nearby(s,i,at)?d.nearbyPlayedLifeLoss:0,skeleton:!!(d.adjacentPlayedSkeleton&&distance(s,i,at)===1)}],{...site,at:i,uid:'site:'+i,layer:'surface'},site.controller);}
  if(!s.board[at].silenced&&!s.board[at].disabled&&card(id).handler==='towerMana'&&s.board.filter(v=>v?.controller===controller&&card(v.card).name===card(id).name).length===1)s.players[controller].bonusMana=(s.players[controller].bonusMana||0)+siteMultiplier(s,at);
}
export function siteTargets(s,p,c=null) {
  return unrestrictedSiteTargets(s,p,c).filter(at=>geometryPlaceSiteAllowed(s,c||card('valley'),at,card));
}
function unrestrictedSiteTargets(s,p,c=null) {
  if(c&&passives[c.slug]?.fiftyMirror)return [...new Set([...siteTargets(s,p),...mirrorRiftTargets(s,ruleAPI(s),p).filter(at=>!(s.auras||[]).some(a=>!a.silenced&&!a.disabled&&areaAuras[card(a.card).slug]?.forbidSitePlay&&inside(a,at)))])];
  if(c&&passives[c.slug]?.riftValley)return [...new Set([...siteTargets(s,p),...riftTargets(s,ruleAPI(s),p).filter(at=>!(s.auras||[]).some(a=>!a.silenced&&!a.disabled&&areaAuras[card(a.card).slug]?.forbidSitePlay&&inside(a,at)))])];
  if(c&&passives[c.slug]?.babelApex)return [...new Set([...siteTargets(s,p),...babelTargets(s,p,ruleAPI(s))])];
  if(c&&passives[c.slug]?.fiftyMirage)return [...new Set([...siteTargets(s,p),...s.board.flatMap((site,at)=>site?.owner===p&&site.controller===p?[at]:[])])];
  if(c&&passives[c.slug]?.fiftyHeirloom)return [...new Set([...siteTargets(s,p),...s.board.flatMap((site,at)=>site&&['Elite','Unique'].includes(card(site.card).rarity)?[at]:[])])];
  const own=s.board.map((v,i)=>v?.controller===p?i:-1).filter(i=>i>=0);
  const empty=s.board.map((v,i)=>(!v||card(v.card).slug==='rubble')&&!(s.auras||[]).some(a=>!a.silenced&&!a.disabled&&areaAuras[card(a.card).slug]?.forbidSitePlay&&inside(a,i))?i:-1).filter(i=>i>=0);
  const underVoidAvatar=new Set(geometryLocationRecords(avatar(s,p)).filter(loc=>!s.board[loc.at]).map(loc=>loc.at));
  if(own.length)return empty.filter(n=>underVoidAvatar.has(n)||own.some(i=>distance(s,n,i)===1)||c&&passives[c.slug]?.cornerSite&&[0,4,15,19].includes(n));
  const at=avatar(s,p).at,min=Math.min(...empty.map(n=>distance(s,n,at)));return empty.filter(n=>distance(s,n,at)===min||c&&passives[c.slug]?.cornerSite&&[0,4,15,19].includes(n));
}
function warrensProtected(s,u,p){return u&&u.controller!==p&&unitTypes(u,s).includes('Beast')&&occupied(u).some(at=>{const site=s.board[at];return site&&!site.silenced&&!site.disabled&&sitePassives[card(site.card).slug]?.protectBeasts;});}
export function canTarget(s,p,u,source=null,effectCard=null) {if(!siteEffectAllowed(s,u,'target',{card},source?.abilityOrigin||source?.card||effectCard))return false;const origin=effectCard?card(effectCard):source?card(source.card):null;if(warrensProtected(s,u,p))return false;return u&&(!origin||origin.rarity!=='Ordinary'||u.silenced||disabled(u)||!unitPassiveLayerViews(s,u,ruleAPI(s),'immuneOrdinary').some(l=>l.value))&&(u.controller===p||!stealthHides(u)||source?.canSeeStealth&&!disabled(source)); }
function casters(s,p,spell) { const d=spell?definitions[spell.slug]:null;return [...s.units.filter(u=>!u.dying&&u.controller===p&&!disabled(u)&&(card(u.card).type==='Avatar'||keywords(u).includes('Spellcaster')||d?.casters==='any'||d?.casterTypes?.some(t=>unitTypes(u,s).includes(t)))),...(s.artifacts||[]).filter(o=>artifactController(s,o)===p&&!o.disabled&&casterPermissionAllows(s,o,null,ruleAPI(s))),...s.board.flatMap((site,at)=>site?.controller===p&&!site.silenced&&!site.disabled&&(sitePassives[card(site.card).slug]?.siteSpellElements||site.towerMagicTurn===s.turn&&spell?.type==='Magic')?['surface','below'].map(layer=>spellcaster(s,'site:'+at,layer)):[])].flatMap(u=>geometryCasterLocations(s,u)); }
function spellTargets(s,p,c,caster){return restrictFinalLegacyTargets(s,rawSpellTargets(s,p,c,caster),c,ruleAPI(s),caster);}
function rawSpellTargets(s,p,c,caster) {
  const h=c.handler; const units=s.units.filter(u=>regionsOverlap(s,u,caster)&&canTarget(s,p,u,caster,c.id)&&!u.iceMagicProtection&&(!u.magicProtected||disabled(u)));
  const minions=units.filter(u=>card(u.card).type==='Minion');
  const friends=units.filter(u=>u.controller===p);
  if(['heal','mortals','tithe','rain','intervention','vanishment','lifewish'].includes(h))return [null];
  if(h==='searchOrdinary')return [null,...s.players[p].spells.slice(0,searchLimit(s,p,ruleAPI(s))).filter(id=>card(id).slot==='Ordinary').filter((id,i,a)=>a.indexOf(id)===i)];
  if(h==='rescue')return yourGraves(s,p).filter(g=>card(g.card).type==='Minion');
  if(h==='teleport')return s.units.filter(u=>!u.dying&&u.controller===p).flatMap(u=>s.board.flatMap((v,i)=>v&&canEnterOnGround(s,u,u,{at:i,layer:'surface'},card,keywords,true)?[{unit:u.uid,at:i}]:[]));
  if(h==='lightning')return s.board.flatMap((v,i)=>regionsOverlap(s,caster,{at:i,layer:caster.layer||'surface'})&&s.units.some(u=>occupiesGeometryLocation(u,i,caster.layer||'surface',s))?[i]:[]);
  if(['explosion','mortality','exorcism'].includes(h))return Array.from({length:20},(_,i)=>i).filter(i=>distance(s,caster.at,i)<=2&&regionsOverlap(s,caster,{at:i,layer:caster.layer||'surface'}));
  if(h==='begone')return minions.filter(u=>unitUmbrellas(u,s,p).includes('Evil')).map(u=>u.uid);
  if(h==='mesmerism')return minions.filter(u=>nearby(s,caster.at,u.at)).map(u=>u.uid);
  if(h==='betrayal')return minions.filter(u=>u.controller!==p).map(u=>u.uid);
  if(h==='exile')return minions.filter(u=>occupied(u).some(at=>s.board[at]?.controller===p)).map(u=>u.uid);
  if(h==='necropotence')return friends.filter(u=>unitTypes(u,s).includes('Undead')&&nearby(s,caster.at,u.at)).map(u=>u.uid);
  if(h==='flight')return friends.filter(u=>card(u.card).type==='Minion').map(u=>u.uid);
  if(h==='zap')return units.map(u=>u.uid);
  if(h==='arc')return units.filter(u=>nearby(s,caster.at,u.at)).map(u=>u.uid);
  if(h==='immolation')return minions.filter(u=>nearby(s,caster.at,u.at)&&regionsOverlap(s,u,caster)).map(u=>u.uid);
  if(h==='fatality')return minions.filter(u=>u.damage>0).map(u=>u.uid);
  if(['freeze','shrink'].includes(h))return (h==='freeze'?minions:units).filter(u=>nearby(s,caster.at,u.at)).map(u=>u.uid);
  if(['wolf','serpent'].includes(h))return friends.filter(u=>card(u.card).type==='Minion').map(u=>u.uid);
  if(['power2','power6','charge','invigorate'].includes(h))return friends.map(u=>u.uid);
  return [];
}
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function castingCost(s,p,c,at,caster=null,payment=null,extraMana=0,layer='surface',origin=null){
  if(s.finalFreeCast?.player===p&&s.finalFreeCast.hand===origin?.hand&&(!s.finalFreeCast.caster||s.finalFreeCast.caster===(typeof caster==='string'?caster:caster?.uid)))return origin?.x?Infinity:0;
  if(finalAvatarCopyIsFree(s,origin,p)&&origin?.x)return Infinity;
  c={...cardForPlayer(s,c,p),cost:finalAvatarBaseCost(s,p,c,origin)};
  const finalZoneExtra=0; // Bureau is a separate, non-discountable access cost.
  if(passives[c.slug]?.xCost)extraMana+=origin?.x||0;
  const d=passives[c.slug],a=s.players[p].life,b=s.players[1-p].life,zoneCosts=offRealmCostAdjustments(s,p,c,at,ruleAPI(s));
  const tax=(s.ongoingEffects||[]).filter(e=>e.op==='tax'&&e.controller===p&&e.turn===s.turn||e.op==='witchTax'&&e.player===p&&e.usedTurn===s.turn).length;
  const rarity=c.rarity||c.slot,courtTax=s.board.reduce((n,site)=>{const d=site&&!site.silenced&&!site.disabled?sitePassives[card(site.card).slug]:null;return n+(d?.spellTax?.[rarity]||0);},0),summonTax=c.type==='Minion'?summoningTax(s,c):0;
  const free=finalAvatarCopyIsFree(s,origin,p)||!!(s.finalFreeCast&&s.finalFreeCast.player===p&&s.finalFreeCast.hand===origin?.hand&&s.finalFreeCast.caster===(typeof caster==='string'?caster:caster?.uid))||!!dragonGift(s,p,c,at,layer)||zoneCosts.freeAfterMortalDeath;
  const waterDiscount=zoneCosts.water;
  const cells=at===undefined?[]:occupied({at,size:c.slug==='mountain_giant'?2:1,geometryWrap:isGlobeActive(s,card)});let siteDiscount=nextSiteCast(s,c,at)?1:0;
  const av=avatar(s,p);if(isKnightSpell(c)&&s.players[p].knightCastTurn!==s.turn&&av&&!av.silenced&&!disabled(av))siteDiscount+=passives[card(av.card).slug]?.firstKnightDiscount||0;
  if(c.type==='Minion')for(const [position,site] of s.board.entries())if(site&&!site.silenced&&!site.disabled){const rule=sitePassives[card(site.card).slug],discount=rule?.nearbyMinionDiscount||(cells.includes(position)?rule?.minionDiscount:null);if(discount&&(!discount.rarity||rarity===discount.rarity)&&(!discount.type||c.subtypes.includes(discount.type))&&(!rule.nearbyMinionDiscount||cells.some(at=>nearby(s,at,position))))siteDiscount+=discount.amount;}
  if(c.type==='Artifact'&&s.board[at]&&!s.board[at].silenced&&!s.board[at].disabled){const d=sitePassives[card(s.board[at].card).slug];if(d?.openArtifactTypes?.some(t=>c.subtypes.includes(t)))siteDiscount+=d.artifactDiscount||0;}
  if(typeof caster==='string')caster=spellcaster(s,caster);const firstElement=caster&&elements.some(e=>hasElement(c,e)&&(caster.spellCastTurn!==s.turn||!caster.castElements?.includes(e))),stoneDiscount=firstElement?(s.artifacts||[]).filter(o=>o.bearer===caster.uid).reduce((n,o)=>n+(passives[card(o.card).slug]?.firstElementDiscount||0),0):0;
  const bellTax=caster&&!free&&payment!=='randomDiscard'?(s.artifacts||[]).filter(o=>!o.silenced&&!o.disabled&&regionsOverlap(s,o,caster)&&occupied(caster).some(at=>nearby(s,o.at,at))).reduce((n,o)=>n+(passives[card(o.card).slug]?.nearbyCasterTax||0),0):0;
  const adjacentDiscount=(c.type==='Magic'&&caster?(caster.finalNextMagicGifts||[]).filter(g=>g.turn===s.turn).reduce((sum,g)=>sum+g.amount,0):0)+zoneCosts.adjacent+(origin?.top?.kind==='cradle'?1:0)+(c.type==='Magic'&&caster&&card(caster.card).type==='Site'&&s.board[caster.at]?.towerMagicTurn===s.turn&&!s.board[caster.at].towerMagicUsed?3:0);
  return finalZoneExtra+summonTax+(free||payment==='randomDiscard'?0:Math.max(0,(payment==='vermis'?5:zoneCosts.lifeDifference?Math.abs(a-b):c.cost||0)+extraMana+tax+courtTax+bellTax-finalUnitCastingDiscount(s,p,c,at,layer,origin,ruleAPI(s))-waterDiscount-siteDiscount-stoneDiscount-adjacentDiscount-(payment==='harbinger'?1:0)-casterGiftDiscount(s,caster,c)-zoneCosts.life));
}
function casterGiftDiscount(s,u,c){return u?((u.elementGiftTurn===s.turn&&elements.some(e=>hasElement(c,e))?4*(u.elementGiftCount||0):0)+(u.elementGifts||[]).filter(g=>g.turn===s.turn&&hasElement(c,g.element)).reduce((n,g)=>n+g.amount,0)):0;}
function ignoresThreshold(s,u,c){return u&&(u.ignoreThresholdTurn===s.turn||casterGiftDiscount(s,u,c)>0);}
function castBudget(s,p){const pl=s.players[p];return pl.bloodManaTurn===s.turn?(pl.doorTurn===null?pl.life:-1):Math.max(0,resources(s,p).available);}
function canPaySpell(s,p,c,at,caster,payment,extraMana=0,layer='surface',origin=null){const access=(origin?.grave!==undefined||origin?.collection!==undefined)?zoneAccessPreviewCost(s,p,ruleAPI(s),origin?.zoneAccessScope||s.zoneAccessScope):0;if(!Number.isFinite(access))return false;const planned=finalUnitCanPayWithExtraCosts(s,p,c,at,caster,payment,extraMana,layer,origin,ruleAPI(s));if(planned!==undefined)return planned&&resources(s,p).available>=access;if((s.ongoingEffects||[]).some(e=>e.op==='forbidSpellName'&&e.name===c.name))return false;const total=castingCost(s,p,c,at,caster,payment,extraMana,layer,origin),summon=c.type==='Minion'?summoningTax(s,c):0;return s.players[p].bloodManaTurn===s.turn?total-summon<=castBudget(s,p)&&summon+access<=resources(s,p).available:total+access<=castBudget(s,p);}
function dragonGift(s,p,c,at,layer='surface'){return c.type==='Minion'&&c.subtypes.includes('Dragon')&&(s.ongoingEffects||[]).find(e=>e.op==='freeDragon'&&e.controller===p&&e.end===s.turn&&e.at===at&&e.layer===layer);}
function vermisCaster(s,u){return u&&['Minion','Avatar'].includes(card(u.card).type)&&(card(u.card).type==='Avatar'||keywords(u).includes('Spellcaster'))&&s.artifacts.some(a=>a.bearer===u.uid&&!a.silenced&&!a.disabled&&passives[card(a.card).slug]?.fixedMinionCost===5);}
function exchangeSites(s,a,b){const site=s.board[a],target=s.board[b];if(!site||!target||passives[card(site.card).slug]?.immutableSite||site.completionProtected||target.completionProtected||passives[card(target.card).slug]?.immutableSite)return;if(!geometryMoveSiteAllowed(s,a,b,card))return;[s.board[a],s.board[b]]=[target,site];moveGeometrySiteParts(s,{[a]:b,[b]:a},Array.from({length:20},(_,at)=>at===a?site:at===b?target:null),u=>siteEffectAllowed(s,u,'move',{card}));for(const u of s.units)if(!u.geometryLocations&&u.size!==2&&!u.geometryFixedCells&&(u.at===a||u.at===b)&&siteEffectAllowed(s,u,'move',{card})){u.at=u.at===a?b:a;u.observedPosition={at:u.at,layer:u.layer||'surface',cells:occupied(u)};}for(const o of s.artifacts)if(o.at===a||o.at===b)o.at=o.at===a?b:a;for(const o of s.auras)if(o.singleSite&&(o.at===a||o.at===b))o.at=o.at===a?b:a;}
function isKnightSpell(c){return [...c.subtypes,...c.umbrellas].some(t=>['Knight','Sir','Dame'].includes(t))||/^(Sir|Dame) /.test(c.name);}
function nextSiteCast(s,c,at){const site=s.board[at],rule=site&&!site.silenced?sitePassives[card(site.card).slug]:null;return site?.nextCastTurn===s.turn&&(rule?.nextCastType&&c.subtypes.includes(rule.nextCastType)||rule?.nextCastUmbrella&&cardForPlayer(s,c,c.finalTypePlayer??s.active).umbrellas.includes(rule.nextCastUmbrella));}
function riverNetwork(s,root){const found=new Set([root]),queue=[root];for(let i=0;i<queue.length;i++)for(let at=0;at<20;at++)if(!found.has(at)&&distance(s,queue[i],at)===1&&s.board[at]&&/river/i.test(card(s.board[at].card).name)){found.add(at);queue.push(at);}return found;}
function emptySite(s,at){return !!s.board[at]&&!(s.inertCards||[]).some(c=>c.at===at)&&!s.units.some(u=>occupied(u).includes(at))&&!(s.artifacts||[]).some(a=>a.at===at)&&!(s.auras||[]).some(a=>inside(a,at));}
function siteTargetsForFrontier(s,u){return s.board.flatMap((site,at)=>distance(s,at,u.at)===1&&(!site||card(site.card).slug==='rubble')?[at]:[]);}
function canSummonAt(s,p,c,at,permission=false,explicitSitePermission=false){c=cardForPlayer(s,c,p);
  if(permission)return true;
  const site=s.board[at],d=offRealmPlacementRules(c,ruleAPI(s));if(d.castCornerVoid&&!(geometryIsVoidCell(s,at,card)&&[0,4,15,19].includes(at)))return false;if(d.mustWaterSite&&!(site&&waterSite(s,at,card)))return false;if(d.outerColumn&&at%5!==0&&at%5!==4)return false;if(d.cornerOnly&&![0,4,15,19].includes(at))return false;if(d.needEnemySite&&(!site||site.controller!==p||!s.units.some(u=>u.controller!==p&&!u.dying&&u.at===at)))return false;if(d.castCornerVoid||d.mustWaterSite)return true;if(geometryIsVoidCell(s,at,card)&&printedKeywords(c).includes('Voidwalk'))return true;if(!site)return printedKeywords(c).includes('Voidwalk')||spatialVoidSummoning(s,p,at,ruleAPI(s));if(s.players[p].sporeCastTurn===s.turn&&(c.attack||0)<=2)return true;
  const enemies=s.units.some(u=>u.controller!==p&&!u.dying&&u.at===at);
  if(d.outerColumn&&at%5!==0&&at%5!==4)return false;
  if(d.cornerOnly&&![0,4,15,19].includes(at))return false;
  if(d.needEnemySite&&(site.controller!==p||!enemies))return false;
  if(explicitSitePermission)return true;
  if(d.castEliteSite)return ['Elite','Unique'].includes(card(site.card).slot);
  if(spatialMinionCastingHere(s,p,c,at,ruleAPI(s)))return true;
  const betray=sitePassives[card(site.card).slug]?.enemyStealthCastThreshold;if(site.controller===1-p&&betray&&resources(s,site.controller)[betray]>=1)return true;
  return site.controller===p||!site.silenced&&!site.disabled&&sitePassives[card(site.card).slug]?.openMinionCasting||sitePassives[card(site.card).slug]?.openMinionTypes?.some(t=>[...c.subtypes,...cardForPlayer(s,c,c.finalTypePlayer??s.active).umbrellas].includes(t))||d.castAnySite||d.castEliteSite&&['Elite','Unique'].includes(card(site.card).slot)||d.castClearSite&&!enemies||(s.auras||[]).some(a=>{const aura=areaAuras[card(a.card).slug];return catalogAuraActive(a,disabled)&&a.controller===p&&aura?.summon&&inside(a,at)&&matches(c,aura,cardForPlayer(s,c,c.finalTypePlayer??s.active).umbrellas);});
}
function summonKeywords(s,c,at){return [...printedKeywords(c),...(s.board.some(site=>site&&!site.silenced&&!site.disabled&&sitePassives[card(site.card).slug]?.allBurrowingThreshold&&resources(s,site.controller).earth>=3)?['Burrowing']:[]),...(cardForPlayer(s,c,c.finalTypePlayer??s.active).umbrellas.includes('Evil')&&s.board.some((site,i)=>site&&sitePassives[card(site.card).slug]?.nearbyEvilBurrowing&&nearby(s,i,at))?['Burrowing']:[])];}
function protectedAttackSite(s,at,layer='surface',attacker=null){return !!s.board[at]&&(protectedByHart(s,{at,layer})||!s.board[at].silenced&&!s.board[at].disabled&&sitePassives[card(s.board[at].card).slug]?.noAttackingHere&&siteEffectAllowed(s,attacker,'impedeAttack',{card},s.board[at].card)||(s.auras||[]).some(a=>catalogAuraActive(a,disabled)&&areaAuras[card(a.card).slug]?.noAttacks&&inside(a,at)));}
function protectedByHart(s,target){return s.units.some(h=>h.uid!==target.uid&&!h.dying&&combatHas(s,h,'protectNearbyAttacks',ruleAPI(s))&&occupied(h).some(a=>occupied(target).some(b=>nearby(s,a,b)))&&regionsOverlap(s,h,target));}
function auraProtectedUnit(s,u){return (u.layer||'surface')==='surface'&&occupied(u).some(at=>s.board[at]&&(s.auras||[]).some(a=>catalogAuraActive(a,disabled)&&areaAuras[card(a.card).slug]?.noAttacks&&inside(a,at)));}
function protectedAttackUnit(s,u,attacker=null){return card(u.card).type==='Minion'&&protectedByHart(s,u)||auraProtectedUnit(s,u)||card(u.card).type==='Minion'&&occupied(u).some(at=>s.board[at]&&!s.board[at].silenced&&!s.board[at].disabled&&sitePassives[card(s.board[at].card).slug]?.noAttackingHere&&siteEffectAllowed(s,attacker,'impedeAttack',{card},s.board[at].card)&&siteEffectAllowed(s,u,'impedeAttack',{card},s.board[at].card));}
function canSummonEntry(s,p,c,at,layer){c=cardForPlayer(s,c,p);if(!geometrySummonAllowed(s,p,c,at,card,occupied,layer||'surface'))return false;const u={uid:'summon-preview',card:c.id,controller:p,at:-1,mods:[]};return occupied({at,size:c.slug==='mountain_giant'?2:1,geometryWrap:isGlobeActive(s,card)}).every(cell=>!s.board.some((site,i)=>site&&!site.silenced&&sitePassives[card(site.card).slug]?.noSummonHereOrFront&&(i===cell||i+(site.controller===0?-5:5)===cell))&&canEnterOnGround(s,u,{at:-1,layer:'surface'},{at:cell,layer},card,keywords,true));}
export function legalActions(s,p=s.active) {
  if(s.winner!==null)return [];
  if(s.choice)return p===s.choice.player?s.choice.options.map((_,option)=>({type:'choose',player:p,option})):[];
  if(s.phase==='mulligan')return p===s.mulligan?[{type:'mulligan',player:p,cards:[]}]:[];
  if(s.phase==='draw')return p===s.active?finalAvatarDrawDecks(s,p).map(deck=>({type:'draw',player:p,deck})):[];
  if(s.pending) {
    if(p!==s.pending.player)return [];
    const actions=[{type:'pass',player:p}]; const actual=unit(s,s.pending.attacker);const a=actual?{...actual,at:s.pending.combatAt??actual.at,layer:s.pending.combatLayer||actual.layer||'surface',size:1}:null;
    if(!a||s.pending.kind==='attack'&&(s.pending.noDefend||!s.pending.targets&&sphereAt(s,unit(s,s.pending.target),card))||s.pending.kind==='intercept'&&auraProtectedUnit(s,actual))return actions;
    for(const u of s.units)if(u.uid!==s.pending.attacker&&u.controller===p&&ready(s,u)&&(!s.pending.stealth||u.canSeeStealth)&&!combatHas(s,u,'cannotDefend',ruleAPI(s))&&u.uid!==s.pending.target&&locations(s,u,card,keywords).some(v=>occupiesGeometryLocation({...u,at:v.at,layer:v.layer},a.at,a.layer||'surface',s))) {
      if((card(u.card).slug==='skeleton'||combatHas(s,u,'noMoveDefend',ruleAPI(s)))&&!sameLocation(s,u,a))continue;
      if(s.pending.kind==='intercept'&&(u.at!==a.at||(keywords(a).includes('Airborne')&&!keywords(u).includes('Airborne'))))continue;
      const multiDefender=geometryLocationRecords(u).length>1,defendDestination=multiDefender?locations(s,u,card,keywords).find(v=>occupiesGeometryLocation({...u,at:v.at,layer:v.layer},a.at,a.layer||'surface',s)):null,defendAt=defendDestination?.at;actions.push({type:'defend',player:p,unit:u.uid,keep:false,...(multiDefender?{defendAt,defendLayer:defendDestination.layer}:{})});
      if(s.pending.kind==='attack'&&unit(s,s.pending.target))actions.push({type:'defend',player:p,unit:u.uid,keep:true,...(multiDefender?{defendAt,defendLayer:defendDestination.layer}:{})});
    }
    actions.push(...cityDefendActions(s,p,ruleAPI(s)));
    return actions.flatMap(action=>action.type==='defend'?finalChimeraDefendActions(s,s.pending,action,ruleAPI(s)):[action]);
  }
  if(p!==s.active||s.phase!=='main')return [];
  const result=[{type:'end',player:p},{type:'concede',player:p},...handTransformActions(s,p,ruleAPI(s))];
  const av=avatar(s,p),r=resources(s,p);
  for(const a of s.artifacts||[])for(const [index,ability] of (definitions[card(a.card).slug]?.activated||[]).entries()){
    if((ability.bearerGranted?unit(s,a.bearer)?.controller:artifactController(s,a))!==p)continue;
    if(a.silenced||a.disabled||isAnimatedArtifact(a)&&disabled(a))continue;
    if(ability.steps[0].op==='finalCatapult'&&!finalCatapultAvailable(s,a,p,ruleAPI(s)))continue;
    if(ability.bearerSource&&(!unit(s,a.bearer)||disabled(unit(s,a.bearer))))continue;
    if(ability.bearerTap&&(!unit(s,a.bearer)||!ready(s,unit(s,a.bearer))))continue;
    if(ability.requiresSpellcaster&&(!unit(s,a.bearer)||card(unit(s,a.bearer).card).type!=='Avatar'&&!keywords(unit(s,a.bearer)).includes('Spellcaster')))continue;
    if(ability.steps[0].op==='bearerDamage'&&(!unit(s,a.bearer)||disabled(unit(s,a.bearer))))continue;
    if(ability.crew&&(!unit(s,a.bearer)||!ready(s,unit(s,a.bearer))||!siegeCrew(s,a,p).length||ability.discardPayload&&!s.players[p].hand.length))continue;
    const first=ability.steps[0],abilitySource=ability.bearerSource||ability.bearerTap?unit(s,a.bearer):a,useKey=ability.bearerOnce?a.bearer+':'+index:index;if(malleusArtifactAbilityAllowed(s,a,ability,p,ruleAPI(s))&&collectionAbilityAvailable(s,p,abilitySource,first,ruleAPI(s))&&(!ability.once||a.usedAbilities?.[useKey]!==s.turn)&&(!first.select||selectEffects(s,{source:abilitySource,controller:p},first.select).length))result.push({type:'activateArtifact',player:p,object:a.uid,index});
  }
  for(const [at,site] of s.board.entries())if(site&&!site.silenced&&!site.disabled)for(const [index,ability] of (definitions[card(site.card).slug]?.activated||[]).entries()){if(site.controller!==p&&!ability.anyPlayer)continue;
    const source={...site,at,uid:'site:'+at,layer:'surface'},first=ability.steps[0];if(first.op==='builtCityAttack'&&!cityAttackActions(s,p,at,ruleAPI(s)).length)continue;
    if(morphAbilityAvailable(s,p,source,first,ruleAPI(s))&&collectionAbilityAvailable(s,p,source,first,ruleAPI(s))&&(!ability.once||site.usedAbilities?.[index]!==s.turn)&&(ability.mana||0)<=r.available&&elements.every(e=>(ability.threshold?.[e]||0)<=r[e])&&(!first.select||selectEffects(s,{source,controller:p},first.select).length))result.push({type:'activateSite',player:p,at,index});
  }
  if(ready(s,av)) {
    const siteAbility=finalAvatarNormalSiteAbilities(s,p,card(av.card));
    if(siteAbility.drawAtlas)result.push({type:'ability',player:p,unit:av.uid,mode:'atlas'});if(card(av.card).slug==='sorcerer')result.push({type:'ability',player:p,unit:av.uid,mode:'spells'});
    if(siteAbility.playHand)for(const h of s.players[p].hand)if(card(h.card).type==='Site')for(const at of siteTargets(s,p,card(h.card)))result.push({type:'site',player:p,hand:h.uid,at});
  }
  for(const g of yourGraves(s,p)){const {index,card:id}=g;
    const c=cardForPlayer(s,id,p);for(const ability of offRealmPassiveEntries(c,'skeletonReturnCost',ruleAPI(s))){const d={skeletonReturnCost:ability.value,returnToSite:passives[card(ability.origin).slug]?.returnToSite};if(!canPayZoneAccess(s,p,ruleAPI(s),d.skeletonReturnCost))continue;
    for(const skeleton of s.units)if(!skeleton.dying&&skeleton.controller===p&&card(skeleton.card).slug==='skeleton'&&card(skeleton.card).category==='Token'&&(!d.returnToSite||s.board[skeleton.at])){
      for(const layer of d.returnToSite?['surface','below']:[skeleton.layer||'surface'])result.push({type:'resurrect',player:p,grave:index,graveOwner:g.player,graveUid:g.uid,card:id,skeleton:skeleton.uid,at:skeleton.at,layer,...(ability.instance?{returnAbilityInstance:ability.instance,returnCost:ability.value}:{})});
    }
  }}
  const castEntries=[...finalUnitCastEntries(s,p,ruleAPI(s)),...finalAvatarCastEntries(s,p,ruleAPI(s)),...topCastEntries(s,p,ruleAPI(s)),...collectionCastEntries(s,p,ruleAPI(s)),...s.players[p].hand.map(h=>({card:h.card,from:{hand:h.uid}})),...(s.boundSpells||[]).filter(h=>spellcaster(s,h.unit)?.controller===p&&(!h.requiresSpellcaster||keywords(spellcaster(s,h.unit)).includes('Spellcaster'))).map(h=>({card:h.card,onlyCaster:h.unit,from:{bound:h.uid}})),...yourGraves(s,p).map(g=>({card:g.card,from:{grave:g.index,graveOwner:g.player,graveUid:g.uid,card:g.card}})).filter(h=>offRealmPassiveEntries(cardForPlayer(s,h.card,p),'castFromGrave',ruleAPI(s)).some(v=>v.value))];
  for(const h of castEntries) {
    if(card(h.card).slug==='craterize'&&!finalAvatarCopyIsFree(s,h.from,p)&&!(s.finalFreeCast?.player===p&&s.finalFreeCast.hand===h.from?.hand)&&!s.players[p].hand.some(h=>card(h.card).type==='Site'))continue;
    const c=cardForPlayer(s,h.entryCard||h.card,p);if(!finalReactionCastAllowed(s,p,c))continue;if(!c.playable||c.category!=='Spell'||(s.ongoingEffects||[]).some(e=>e.op==='forbidSpellName'&&e.name===c.name))continue;
    for(const caster of h.onlyCaster?[spellcaster(s,h.onlyCaster,h.onlyCasterLayer||'surface')].filter(Boolean).flatMap(u=>geometryCasterLocations(s,u)).filter(u=>u&&u.uid===h.onlyCaster&&u.controller===p&&!u.dying&&!disabled(u)&&(!u.silenced||h.allowSilencedCaster||entryHasIndependentCasterPermission(s,h)||card(u.card).type==='Avatar'||keywords(u).includes('Spellcaster'))):casters(s,p,c)) for(const payment of [undefined,...(c.type==='Minion'&&avatar(s,p)?.harbingerSquares&&!avatar(s,p).silenced&&!disabled(avatar(s,p))&&avatar(s,p).harbingerTurn!==s.turn?['harbinger']:[]),...(offRealmPassiveEntries(c,'randomDiscardCost',ruleAPI(s)).some(v=>v.value)&&s.players[p].hand.some(v=>v.uid!==h.from.hand)?['randomDiscard']:[]),...(c.type==='Minion'&&vermisCaster(s,caster)?['vermis']:[])]) {
      if(h.onlyCasterLayer&&(caster.layer||'surface')!==h.onlyCasterLayer)continue;if(h.onlyCasterLocations&&!h.onlyCasterLocations.some(loc=>loc.at===caster.at&&(loc.layer||'surface')===(caster.layer||'surface')))continue;
      if(!finalGridCastAvailable(s,p,c,caster,ruleAPI(s)))continue;
      if(c.type!=='Minion'&&!h.ignoreThreshold&&!ignoresThreshold(s,caster,c)&&elements.some(e=>(c[e]||0)>r[e]))continue;
      if(c.type!=='Minion'&&c.type!=='Artifact'&&!canPaySpell(s,p,c,undefined,caster,payment,0,'surface',h.from))continue;
      const from={...h.from,...(caster.geometryCasterLocation?{casterLocation:{...caster.geometryCasterLocation},casterLayer:caster.layer||'surface'}:{}),...(payment?{payment}:{}),...(card(caster.card).type==='Site'&&caster.layer==='below'?{casterLayer:'below'}:{})};
      if(!casterPermissionAllows(s,caster,c,ruleAPI(s),{independent:entryHasIndependentCasterPermission(s,h)}))continue;
      if(c.type==='Minion')for(let at=0;at<20;at++)if(finalAvatarMinionCastAllowed(s,p,c,at,'surface',ruleAPI(s))&&(h.forceAt===undefined||h.forceAt===at)&&(payment!=='harbinger'||avatar(s,p).harbingerSquares.includes(at))&&casterPlacementAllowed(s,caster,c,at,ruleAPI(s))&&(c.slug==='mountain_giant'?(isGlobeActive(s,card)||at%5<4&&at<15)&&occupied({at,size:2,geometryWrap:isGlobeActive(s,card)}).every(i=>!!s.board[i])&&occupied({at,size:2,geometryWrap:isGlobeActive(s,card)}).some(i=>canSummonAt(s,p,c,i,payment==='harbinger',h.from?.top?.kind==='cult')):canSummonAt(s,p,c,at,!!h.from.rasputin||payment==='harbinger',h.from?.top?.kind==='cult'))&&(s.board[at]&&!s.board[at].silenced&&!s.board[at].disabled&&(c.subtypes.includes(sitePassives[card(s.board[at].card).slug]?.ignoreThresholdType)||sitePassives[card(s.board[at].card).slug]?.ignoreThresholdTypes?.some(t=>[...c.subtypes,...cardForPlayer(s,c,c.finalTypePlayer??s.active).umbrellas].includes(t)))||nextSiteCast(s,c,at)||payment==='vermis'||h.ignoreThreshold||ignoresThreshold(s,caster,c)||elements.every(e=>(c[e]||0)<=r[e]))){
        if((!h.forceLayer||h.forceLayer==='surface')&&!offRealmPassiveEntries(c,'mustBelow',ruleAPI(s)).some(v=>v.value)&&canPaySpell(s,p,c,at,caster,payment,0,'surface',h.from)&&canSummonEntry(s,p,c,at,'surface'))result.push({type:'cast',player:p,...from,caster:caster.uid,at});
        if(finalAvatarMinionCastAllowed(s,p,c,at,'below',ruleAPI(s))&&(!h.forceLayer||h.forceLayer==='below')&&(summonKeywords(s,c,at).includes(waterSite(s,at,card)?'Submerge':'Burrowing')||offRealmPassiveEntries(c,'ambushAbove',ruleAPI(s)).some(v=>v.value)&&!waterSite(s,at,card))&&canPaySpell(s,p,c,at,caster,payment,0,'below',h.from)&&canSummonEntry(s,p,c,at,'below'))result.push({type:'cast',player:p,...from,caster:caster.uid,at,layer:'below'});
      }
      if(c.type==='Artifact'){
        const validAt=at=>(!passives[c.slug]?.backRowCast||inBackRow(at,p))&&canPaySpell(s,p,c,at,caster,payment,0,'surface',h.from);
        if(passives[c.slug]?.sunkenTreasure){const land=passives[c.slug].treasureLand,at=s.board.findIndex((site,at)=>site?.controller===p&&(land?!waterSite(s,at,card):waterSite(s,at,card)));if(at>=0&&validAt(at))result.push({type:'cast',player:p,...from,caster:caster.uid,at});continue;}
        for(let at=0;at<20;at++)if((s.board[at]?.controller===p||s.board[at]&&!s.board[at].silenced&&!s.board[at].disabled&&sitePassives[card(s.board[at].card).slug]?.openArtifactTypes?.some(t=>c.subtypes.includes(t)))&&validAt(at))result.push({type:'cast',player:p,...from,caster:caster.uid,at});
        if(passives[c.slug]?.castToAnyMinion)for(const u of s.units)if(!u.dying&&card(u.card).type==='Minion'&&canTarget(s,p,u,caster,c.id)&&validAt(u.at))result.push({type:'cast',player:p,...from,caster:caster.uid,at:u.at,bearer:u.uid,shacklesTarget:true});
        if(c.slug==='just_a_rock')for(const u of s.units)if(!u.dying&&s.artifacts.some(o=>artifactIsCarriedBy(o,u.uid))&&validAt(u.at))result.push({type:'cast',player:p,...from,caster:caster.uid,at:u.at,bearer:u.uid});
        if(passives[c.slug]?.conjureEnemyMinion)for(const u of s.units)if(u.controller!==p&&!u.dying&&card(u.card).type==='Minion'&&regionsOverlap(s,u,caster)&&canTarget(s,p,u,caster,c.id)&&validAt(u.at))result.push({type:'cast',player:p,...from,caster:caster.uid,at:u.at,bearer:u.uid,shacklesTarget:true});
        if(carriable(c))for(const u of s.units)if(u.controller===p&&!u.dying)for(const loc of geometryLocationRecords(u))if(validAt(loc.at))result.push({type:'cast',player:p,...from,caster:caster.uid,at:loc.at,layer:loc.layer,bearer:u.uid});
      }
      if(c.type==='Aura')for(let at=0;at<20;at++){const d=areaAuras[c.slug];if(d?.fiftyRarities&&(!s.board[at]||!d.fiftyRarities.some(r=>hasSiteRarity(card(s.board[at].card),r))))continue;if(d?.border?!!s.board[at]&&s.board[at].controller===p&&borderNeighbors(at,isGlobeActive(s,card)).length>0:d?.castToVoid?!s.board[at]:d?.singleSite?!!s.board[at]&&(!d.nearbyCast||nearby(s,at,caster.at)):area(s,at).length)result.push({type:'cast',player:p,...from,caster:caster.uid,at});}
      if(c.type==='Magic'&&definitions[c.slug]?.cast){const first=definitions[c.slug].cast[0];if(!first.select||first.optional||selectEffects(s,{source:caster,controller:p,effectCard:c.id,step:first},first.select).length)result.push({type:'cast',player:p,...from,caster:caster.uid,target:null});continue;}
      if(c.type==='Magic')for(const target of spellTargets(s,p,c,caster))result.push({type:'cast',player:p,...from,caster:caster.uid,target});
    }
  }
  if(av&&!av.dying&&!disabled(av)&&s.players[p].hand.length)for(const hireling of s.units)if(!hireling.dying&&!disabled(hireling)&&unitPassiveLayerViews(s,hireling,ruleAPI(s),'grantHire').some(l=>l.value)&&nearby(s,av.at,hireling.at)&&regionsOverlap(s,av,hireling))result.push({type:'hireSellsword',player:p,unit:av.uid,target:hireling.uid});
  for(const u of s.units)if(u.controller===p&&!u.dying&&!disabled(u)){
    if(ready(s,u))for(const o of s.artifacts||[])if(passives[card(o.card).slug]?.rollingBoulder&&sameLocation(s,u,o))result.push({type:'pushBoulder',player:p,unit:u.uid,object:o.uid});
    if(!isAnimatedArtifact(u))for(const [index,ability] of liveUnitAbilities(s,u).entries()){
      if(u.silenced&&ability.abilityNature!=='gained')continue;
      const first=ability.steps[0];
      if(sourceAbilityAvailable(s,u,first,ruleAPI(s))&&finalAvatarAbilityAvailable(s,u,first,ruleAPI(s))&&(!ability.tap||ready(s,u))&&(!ability.needsCarriedArtifact||s.artifacts.some(o=>artifactIsCarriedBy(o,u.uid)))&&(!ability.needsAtlas||s.players[p].atlas.length)&&(!ability.needsAirSite||siteAffinity(s,u.at,card).air>0)&&(!ability.onceEver||!u[ability.onceEver])&&(!ability.requiresStealth||u.stealth)&&(!ability.once||(u.usedAbilities?.[ability.abilityUseKey??ability.abilityInstance??index]??(ability.abilityNature==='printed'?u.usedAbilities?.[index]:undefined))!==s.turn)&&(ability.mana||0)<=r.available&&(!first.select||selectEffects(s,{source:u,controller:p},first.select).length))result.push({type:'activate',player:p,unit:u.uid,index,abilityInstance:ability.abilityInstance});
    }
    if(ready(s,u)&&card(u.card).type==='Minion'&&(s.auras||[]).some(a=>catalogAuraActive(a,disabled)&&areaAuras[card(a.card).slug]?.grantMinionMana&&catalogAuraHere(a,u,inside)))result.push({type:'homecomingMana',player:p,unit:u.uid});
    if(ready(s,u))for(const target of s.units)if(!target.dying){if((target.boundSpellcaster||unitPassiveLayerViews(s,target,ruleAPI(s),'shackled').some(l=>l.value)&&!target.shacklesReleased)&&(card(u.card).type==='Avatar'||keywords(u).includes('Spellcaster'))&&occupied(u).some(at=>occupied(target).some(other=>distance(s,at,other)===1))&&regionsOverlap(s,u,target))result.push({type:'freeUnit',player:p,unit:u.uid,target:target.uid,restraint:'spellcaster'});if(target.cocoon&&sameLocation(s,u,target))result.push({type:'freeUnit',player:p,unit:u.uid,target:target.uid,restraint:'cocoon'});}
    if(ready(s,u))for(const fish of s.units)if(fish.uid!==u.uid&&!fish.dying&&!disabled(fish)&&unitPassiveLayerViews(s,fish,ruleAPI(s),'grantKnowledgeRoll').some(l=>l.value)&&occupied(u).some(at=>occupied(fish).includes(at)))result.push({type:'salmonRoll',player:p,unit:u.uid,salmon:fish.uid});
    const loose=pickupItems(s,u);
    const carried=(s.artifacts||[]).filter(a=>a.bearer===u.uid&&canDropArtifact(s,a));
    if(u.pickedTurn!==s.turn){const entries=carryRules(s,u,ruleTransportAPI(s));if(!entries.length&&loose.length)result.push({type:'pickup',player:p,unit:u.uid});for(const entry of entries)if(loose.length||carryChoices(s,u,ruleTransportAPI(s),entry.instance).length)result.push({type:'pickup',player:p,unit:u.uid,carryAbility:entry.instance,carryOrigin:entry.origin});}
    if((carried.length||passengers(s,u).length)&&u.droppedTurn!==s.turn&&u.interactedTurn!==s.turn)result.push({type:'drop',player:p,unit:u.uid});
  }
  for(const u of s.units)if(u.controller===p&&ready(s,u)){
    if(s.artifacts.some(o=>passives[card(o.card).slug]?.fiftyRam&&sameLocation(s,u,o))&&selectEffects(s,{source:u,controller:p},{kind:'ramTarget'}).length)result.push({type:'fiftyRam',player:p,unit:u.uid});
    if(keywords(u).includes('Ranged'))for(let direction=0;direction<4;direction++)result.push({type:'ranged',player:p,unit:u.uid,direction});
    for(const location of locations(s,u,card,keywords)) {
    const {at,layer}=location;if(!geometryOwnMoveAllowed(s,u,at,layer,card))continue;const path=location.path.map(v=>v.at),extra=layer==='below'||u.layer==='below'?{layer}:{};
    if(at!==u.at||layer!==(u.layer||'surface')||u.geometryGrowing&&location.path.length)result.push({type:'move',player:p,unit:u.uid,at,path,...extra});
    if(combatHas(s,u,'cannotAttack',ruleAPI(s)))continue;
    const attackLocations=geometryLocationRecords({...u,at,layer}).filter(loc=>s.board[loc.at]||loc.layer==='surface'),multi=attackLocations.length>1;
    for(const combat of attackLocations){
      for(const enemy of s.units)if(!enemy.dying&&(occupiesGeometryLocation(enemy,combat.at,combat.layer,s)||enemy.layer==='below'&&combat.layer==='surface'&&occupied(enemy).includes(combat.at)&&canAttackSubsurface(s,combat.at,card,disabled,occupied))&&enemy.controller!==p&&peaceAllowsAttack(s,p,enemy.controller)&&!warrensProtected(s,enemy,p)&&!protectedAttackUnit(s,enemy,u)&&(!stealthHides(enemy)||u.canSeeStealth)&&(!keywords(enemy).includes('Airborne')||keywords(u).includes('Airborne')||combat.layer==='below'||!s.board[combat.at]))result.push({type:'attack',player:p,unit:u.uid,at,path,target:enemy.uid,...(multi?{combatAt:combat.at,combatLayer:combat.layer}:{}),...extra});
      if(!combatHas(s,u,'cannotAttackSites',ruleAPI(s))&&(combat.layer==='surface'||combat.layer==='below'&&canAttackSubsurface(s,combat.at,card,disabled,occupied))&&s.board[combat.at]?.controller===1-p&&peaceAllowsAttack(s,p,s.board[combat.at].controller)&&!protectedAttackSite(s,combat.at,combat.layer,u))result.push({type:'attack',player:p,unit:u.uid,at,path,target:'site:'+combat.at,...(multi?{combatAt:combat.at,combatLayer:combat.layer}:{}),...extra});
    }
    }
  }
  finalUnitAttackActions(s,p,result,ruleAPI(s));
  finalUnitCastActions(s,p,result,castEntries,ruleAPI(s));
  return mandatoryBattleActions(s,filterMalleusCastActions(s,restrictFinalOakArtifactActions(s,result,ruleAPI(s)),ruleAPI(s)),ruleAPI(s));
}
export function reason(s,a) {
  if(s.winner!==null)return '對局已結束';
  if(s.choice)return '請先完成目前效果的選擇';
  if(s.pending)return '請先完成防禦／攔截窗口';
  if(s.phase==='draw')return '請先選擇抽 Atlas 或 Spellbook';
  if(a.player!==s.active)return '現在不是你的回合';
  if(a.unit) { const u=unit(s,a.unit);if(u?.tapped)return '此單位已橫置';if(u&&!ready(s,u))return '召喚失調或 Disabled'; }
  const h=a.grave!==undefined?{card:s.players[a.graveOwner??a.player]?.cemetery[a.grave]}:s.players[a.player]?.hand.find(h=>h.uid===a.hand);
  if(h?.card) { const c=card(h.card),r=resources(s,a.player);if(!c.playable)return '這張卡牌的效果尚未實作';if(castingCost(s,a.player,c,a.at)>r.available)return '可用法力不足';if(elements.some(e=>(c[e]||0)>r[e]))return '元素門檻不足'; }
  return '位置、目標、施法者或目前階段不合法';
}
function blocked(s,p,target) {
  if(target&&target.controller!==p&&target.ward) { target.ward=false;log(s,'Ward 阻擋了法術指定。');return true; }return false;
}
function resolveMagic(s,p,c,a) {
  const h=c.handler,castingOrigin=spellcaster(s,a.caster,a.casterLayer,a.casterLocation),castingLayer=castingOrigin?.layer||a.casterLocation?.layer||a.casterLayer||'surface';let target=typeof a.target==='string'?unit(s,a.target):null;if(target?.dying)target=null;
  assert(['lightning','explosion','zap','arc','immolation','heal','lifewish','intervention','invigorate','necropotence','flight','vanishment','begone','mesmerism','betrayal','exile','mortality','exorcism','power2','power6','wolf','serpent','charge','shrink','freeze','fatality','mortals','rain','tithe','rescue','searchOrdinary','teleport'].includes(h),'尚未實作的魔法效果：'+c.name);
  if(blocked(s,p,target))return;
  const next={end:s.turn};
  const mod=m=>{if(target)target.mods.push({...next,...m});};
  if(h==='lightning'||h==='explosion') {
    if(blocked(s,p,s.board[a.target]))return;
    const occupants=s.units.filter(u=>!u.dying&&occupiesGeometryLocation(u,a.target,castingLayer,s));
    if(h==='lightning'&&occupants.length)hurt(s,occupants[rollIndex(s,occupants.map(u=>card(u.card).name+' @ '+u.at))],3,false,'magic');
    if(h==='explosion')for(const u of occupants)hurt(s,u,3,false,'magic');
  }
  if(['zap','arc','immolation'].includes(h))hurt(s,target,{zap:1,arc:4,immolation:7}[h],false,'magic');
  if(h==='heal')heal(s,p,7);
  if(h==='lifewish')for(let q=0;q<2;q++)fullyHeal(s,avatar(s,q));
  if(h==='intervention'){s.players[p].doorTurn=null;s.players[p].life=1;}
  if(h==='invigorate'){mod({power:3});heal(s,p,3);}
  if(h==='necropotence')mod({power:3});
  if(h==='flight'){if(target)target.mods.push({keyword:'Airborne',until:p});draw(s,p,'spells');}
  if(h==='vanishment'){for(const u of s.units)if(u.controller===p&&card(u.card).type==='Minion')u.stealth=true;draw(s,p,'spells');}
  if(h==='begone')kill(s,target,true);
  if(h==='mesmerism'&&target)target.controller=p;
  if(h==='betrayal'&&target){bindControl(s,target,p,{end:s.turn});untap(s,target);}
  if(h==='exile'&&target){leaveUnit(s,target,'spells');shuffle(s,s.players[target.owner].spells);}
  if(h==='mortality'||h==='exorcism'){
    if(!blocked(s,p,s.board[a.target]))for(const u of [...s.units])if(occupiesGeometryLocation(u,a.target,castingLayer,s)&&card(u.card).type==='Minion'&&unitTypes(u,s).some(t=>(h==='mortality'?['Mortal']:['Demon','Undead']).includes(t)))kill(s,u,h==='exorcism');
  }
  if(h==='power2')mod({power:2}); if(h==='power6')mod({power:6});
  if(h==='wolf'){mod({power:2});draw(s,p,'spells');}
  if(h==='serpent'){mod({keyword:'Lethal'});draw(s,p,'spells');}
  if(h==='charge')mod({keyword:'Charge'});
  if(h==='shrink'&&target)target.mods.push({set:0,until:p});
  if(h==='freeze'&&target){target.mods.push({disabled:true,until:p});if(disabled(target)){target.ward=false;target.stealth=false;}}
  if(h==='fatality')kill(s,target);
  if(h==='mortals')for(const u of [...s.units])if(card(u.card).type==='Minion'&&unitTypes(u,s).includes('Mortal'))kill(s,u);
  if(h==='rain')for(const u of s.units)if(card(u.card).type==='Minion'&&s.board[u.at]&&(u.layer||'surface')==='surface')hurt(s,u,1,false,'magic');
  if(h==='tithe')for(let i=0;i<3;i++)draw(s,p,'atlas');
  if(h==='rescue'){const g=yourGraves(s,p).find(g=>g.uid===a.target?.uid&&g.card===a.target.card&&g.player===a.target.player);if(g){takeGrave(s,g.player,g.index,g.card,g.uid,p);s.players[g.player].hand.push({uid:'h'+s.next++,card:g.card});}}
  if(h==='searchOrdinary'){const deck=s.players[p].spells;if(a.target!==null&&deck.includes(a.target)){deck.splice(deck.indexOf(a.target),1);s.players[p].hand.push({uid:'h'+s.next++,card:a.target});log(s,'揭示 '+card(a.target).name);}else log(s,'搜尋未找到卡牌。');shuffle(s,deck);}
  if(h==='teleport') {if(blocked(s,p,s.board[a.target.at]))return;target=unit(s,a.target.unit);if(!target||target.dying)return;target.carryTeleport=true;target.at=a.target.at;target.layer='surface';target.stealth=false;}
}
function openCombatWindow(s,pending,judas,source){
 const u=unit(s,pending.attacker),p=source.controller;
 for(const mark of judas)queueEffects(s,[{op:'drawCards',count:1}],{...source,controller:mark.controller},mark.controller,card('kiss_of_judas').id);
 if(!finalChimeraPrepareCombat(s,pending,ruleAPI(s))){if(pending.kind==='attack')fight(s,pending);return;}
 const target=unit(s,pending.target);
 if(!u||u.dying||pending.kind==='attack'&&pending.target&&!pending.target.startsWith('site:')&&(!target||target.dying||!sameLocation(s,u,target))){if(pending.kind==='attack')fight(s,pending);return;}
 s.pending=pending;
 if(u.mods.some(m=>m.blaze)&&pending.kind!=='attack'||legalActions(s,pending.player).length===1){if(pending.kind==='attack')fight(s,pending);s.pending=null;}
}
function fight(s,pending) {
  const attacker=unit(s,pending.attacker);
  if(pending.kind==='attack'&&pending.afterAttack?.length){const src=attacker||pending.attackSource;if(src)queueEffects(s,pending.afterAttack,src,src.controller);}
  if(!attacker||attacker.dying)return;
  if(pending.kind==='attack'&&pending.defendUsed&&pending.defenders.filter(uid=>{const u=unit(s,uid);return u&&!u.dying&&sameLocation(s,u,attacker);}).length<2&&s.units.some(u=>u.controller!==pending.player&&!u.dying&&combatHas(s,u,'denyLoneDefense',ruleAPI(s))))pending.defenders=unit(s,pending.target)?[pending.target]:[];
  const defenders=pending.defenders.map(id=>unit(s,id)).filter(u=>u&&(pending.remote||sameLocation(s,u,attacker)));
  if(defenders.length) {
    const pre=[];for(const u of [attacker,...defenders]){if(u.foughtTurn!==s.turn)for(const layer of combatViews(s,u,ruleAPI(s),'firstFightUntap'))pre.push(...combatSteps(layer,[{op:'untapSelf',uid:u.uid}]));u.foughtTurn=s.turn;}
    queueEffects(s,[...pre,{op:'fightStage',phase:'first',fight:{attacker:attacker.uid,defenders:defenders.map(u=>u.uid),kind:pending.kind,remote:!!pending.remote}}],attacker,attacker.controller);
  } else if(pending.target?.startsWith('site:')) {
    const site=s.board[Number(pending.target.slice(5))];if(site&&site.controller!==attacker.controller) {
      const at=Number(pending.target.slice(5));if(finalUnitSiteAttackBeforeDamage(s,attacker,at,pending,ruleAPI(s)))return;const before=s.players[site.controller].life,bonus=s.units.filter(v=>v.uid!==attacker.uid&&v.controller===attacker.controller&&!v.dying).reduce((n,v)=>n+combatViews(s,v,ruleAPI(s),'otherSiteAttackPower').reduce((sum,l)=>sum+l.value,0),0);damageSite(s,at,power(attacker)+bonus,attacker);finalAvatarSiteStrike(s,attacker,at,ruleAPI(s));const lost=before-s.players[site.controller].life;if(lost>0)for(const v of s.units)if(v.controller===site.controller&&!v.dying&&occupied(v).some(cell=>nearby(s,cell,at))&&regionNames(s,v).has('surface'))for(const trigger of combatTriggers(s,v,'reflectUndefendedLoss',ruleAPI(s),()=>[{op:'lifeLoss',opponent:true,amount:lost}]))eventTrigger(s,trigger.source,trigger.steps);
      for(const a of [...s.auras])if(areaAuras[card(a.card).slug]?.dispelAfterSiteAttack&&inside(a,at))queueEffects(s,[{op:'dispelSelfAura'}],a,a.controller);
      if(!site.silenced&&!site.attackedSuccessfully&&sitePassives[card(site.card).slug]?.firstSuccessfulAttackDiscard){site.attackedSuccessfully=true;queueEffects(s,[{op:'chorusDiscard',player:site.controller}],{...site,at:Number(pending.target.slice(5)),uid:pending.target,layer:attacker.layer||'surface'},site.controller);}
    }
  }
  if(!defenders.length)attacker.stealth=false;
  log(s,card(attacker.card).name+' 進入'+(pending.kind==='spell'?'法術戰鬥。':pending.kind==='intercept'?'攔截戰鬥。':'攻擊結算。'));
}
export function dispatch(original,action){assertChoiceContext(original,action);assert(finalControlActionAllowed(original,action,action.actor),'不是這名玩家目前的操控者，或不得代為認輸');return runFinalDecisionAction(original,action,dispatchCore,ruleAPI(original));}
function dispatchCore(original, action) {
  const s=clone(original),a=clone(action); const p=a.player;for(const item of s.artifacts||[])if(!item.observedPosition)item.observedPosition={at:item.at,layer:item.layer||'surface',controller:artifactController(s,item)};
  for(const u of s.units){if(u.observedTapped===undefined)u.observedTapped=!!u.tapped;if(!u.observedPosition&&!u.justEntered)u.observedPosition={at:u.at,layer:u.layer||'surface',cells:occupied(u),region:region(s,u)};}
  for(let q=0;q<2;q++)syncGraves(s,q);
  if(!s.artifacts)s.artifacts=[];if(!s.auras)s.auras=[];
  const finalActionSiteBefore=captureVindictiveSites(s,ruleAPI(s));
  assert(p===0||p===1,'玩家編號錯誤');
  assert(finalControlActionAllowed(s,a,a.actor),'不是這名玩家目前的操控者，或不得代為認輸');
  // A player may concede personally even while waiting for a draw, effect or
  // their opponent. It never grants a temporary controller that permission.
  if(a.type==='concede'){assert(s.winner===null,'對局已結束');s.winner=1-p;s.phase='over';s.choice=null;s.pending=null;s.storyline=[];log(s,s.players[p].name+' 投降。');s.history.push(a);return s;}
  if(a.type==='mulligan') {
    assert(s.phase==='mulligan'&&s.mulligan===p,'目前不能重抽');
    const chosen=a.cards||[];assert(new Set(chosen).size===chosen.length&&chosen.length<=3,'最多重抽 3 張不同手牌');
    const pl=s.players[p],counts={atlas:0,spells:0};
    for(const id of chosen){const h=pl.hand.find(h=>h.uid===id);assert(h,'重抽手牌不存在');const deck=finalAvatarMulliganDeck(s,p,card(h.card));pl[deck].push(h.card);pl.hand=pl.hand.filter(v=>v.uid!==id);counts[deck]++;}
    for(const deck of ['atlas','spells'])for(let i=0;i<counts[deck];i++)draw(s,p,deck);
    if(p===(s.firstPlayer??0))s.mulligan=1-p;else s.phase='main';log(s,s.players[p].name+' 完成重抽。');
  } else {
    const actions=legalActions(s,p);const legal=actions.find(v=>v.hand===a.hand&&v.grave===a.grave&&v.bound===a.bound&&v.payment===a.payment&&v.casterLayer===a.casterLayer&&Object.entries(v).every(([k,val])=>k==='path'||eq(a[k],val)));
    assert(legal,reason(s,a));
    if(a.type==='choose')chooseEffect(s,a.option);
    if(a.type==='transformHand')commitHandTransform(s,a,ruleAPI(s));
    if(a.type==='draw'){draw(s,p,a.deck);if(s.winner===null)s.phase='main';}
    if(a.type==='site')beginSiteCard(s,a);
    if(a.type==='fiftyRam'){const u=unit(s,a.unit);s.choice={player:p,title:'Battering Ram',options:[...selectEffects(s,{source:u,controller:p},{kind:'ramTarget'}),{label:'Cancel',value:null}],frame:{source:u,controller:p,effectCard:u.card,step:{op:'fiftyRamCommit',action:a}}};}
    if(a.type==='ability'){const u=unit(s,a.unit);u.tapped=true;draw(s,p,a.mode);if(!u.silenced&&passives[card(u.card).slug]?.completionDruid&&s.players[p].turnsTaken===1)queueEffects(s,[{op:'completionDruidTawny'}],u,p);log(s,card(u.card).name+' 橫置並抽取 '+a.mode+'。');}
    if(a.type==='activate'){
      const u=unit(s,a.unit),ability=liveUnitAbility(s,a),first=ability.steps[0];
      if(ability.declare){const options=first.select?selectEffects(s,{source:u,controller:p},first.select):['北','東','南','西'].map((label,i)=>({label,value:i+1}));s.choice={player:p,title:card(u.card).name+' · 啟動前選擇',options:[...options,{label:'取消啟動（不支付費用）',value:null}],frame:{source:clone(u),controller:p,effectCard:u.card,step:{op:'commitAbility',action:a,effectOp:first.op,abilityOrigin:first.abilityOrigin,optional:true}}};}
      else commitAbility(s,a);
    }
    if(a.type==='activateSite'){
      const site=s.board[a.at],ability=definitions[card(site.card).slug].activated[a.index],source={...site,at:a.at,uid:site.uid||'site:'+a.at,layer:'surface'},first=ability.steps[0];
      if(ability.declare&&first.select)s.choice={player:p,title:card(site.card).name+' · 啟動前選擇',options:[...selectEffects(s,{source,controller:p},first.select),{label:'取消啟動（不支付費用）',value:null}],frame:{source,controller:p,effectCard:site.card,step:{op:'commitSite',action:a,effectOp:first.op,abilityOrigin:first.abilityOrigin,optional:true}}};
      else commitSite(s,a);
    }
    if(a.type==='activateArtifact'){
      const object=s.artifacts.find(o=>o.uid===a.object),ability=definitions[card(object.card).slug].activated[a.index],first=ability.steps[0],abilitySource=ability.bearerSource||ability.bearerTap?unit(s,object.bearer):object;
      if(ability.bearerTap&&first.op==='projectile'){s.choice={player:p,title:card(object.card).name+' · 啟動前選擇方向',options:[...['北','東','南','西'].map((label,i)=>({label,value:i+1})),{label:'取消啟動（不支付費用）',value:null}],frame:{source:clone(object),controller:p,effectCard:object.card,step:{op:'commitArtifact',action:a,optional:true}}};}
      else if(first.select)s.choice={player:p,title:card(object.card).name+' · 啟動前選擇',options:[...selectEffects(s,{source:abilitySource,controller:p},first.select),{label:'取消啟動（不支付費用）',value:null}],frame:{source:clone(object),controller:p,effectCard:object.card,step:{op:'commitArtifact',action:a,effectOp:first.op,abilityOrigin:first.abilityOrigin,optional:true}}};
      else commitArtifact(s,a);
    }
    if(a.type==='resurrect'){
      const c=cardForPlayer(s,a.card,p),skeleton=unit(s,a.skeleton),priorAccess=s.zoneAccessScope;s.zoneAccessScope=commitZoneAccess(s,p,ruleAPI(s),{scope:a.zoneAccessScope||s.zoneAccessScope});s.players[p].spent+=offRealmPassiveEntries(c,'skeletonReturnCost',ruleAPI(s)).find(v=>a.returnAbilityInstance?v.instance===a.returnAbilityInstance:!v.instance).value;
      kill(s,skeleton,false,true,true);summonGraveAt(s,{player:a.graveOwner??p,index:a.grave,card:a.card,uid:a.graveUid},p,a.at,a.layer);
      log(s,'犧牲 Skeleton，從墓地召喚 '+c.name+'。');if(priorAccess)s.zoneAccessScope=priorAccess;else delete s.zoneAccessScope;
    }
    if(a.type==='cast') {
      beginCast(s,a);
    }
    if(a.type==='move'||a.type==='attack') {
      const u=unit(s,a.unit),destination=locations(s,u,card,keywords).find(v=>v.at===a.at&&v.layer===(a.layer||'surface')&&(!Array.isArray(a.path)||eq(v.path.map(loc=>loc.at),a.path)));assert(destination,'移動路徑已失效');u.tapped=true;u.notRest=true;u.inBasicTravel=true;u.shotDuringMove=false;u.spatialShotsUsed={};const route=[{at:u.at,layer:u.layer||'surface'},...destination.path];
      const previous=route[route.length-2],thicketAt=previous&&previous.at!==a.at?previous.at:undefined;
      queueEffects(s,[...(destination.path.length?[{op:'movementShot'}]:[]),...destination.path.flatMap((to,i)=>[{op:'travelStep',from:route[i],to},{op:'movementShot'}]),{op:'travelStop'},{op:'travelFinish',action:{...a,thicketAt}}],u,p);
    }
    if(a.type==='cityDefend')assert(commitCityAction(s,a,ruleAPI(s)),'Free City cannot defend now');
    if(a.type==='defend') {
      s.pending.defendUsed=true;const u=unit(s,a.unit),actual=unit(s,s.pending.attacker),at=a.defendAt??s.pending.combatAt??actual.at,destination=locations(s,u,card,keywords).find(v=>v.at===at&&v.layer===(a.defendLayer||s.pending.combatLayer||actual.layer||'surface'));u.tapped=true;u.notRest=true;u.inBasicTravel=true;u.shotDuringMove=false;u.spatialShotsUsed={};
      if(destination&&destination.path.length){s.pending.resolvingDefense=true;const route=[{at:u.at,layer:u.layer||'surface'},...destination.path];queueEffects(s,[{op:'movementShot'},...destination.path.flatMap((to,i)=>[{op:'travelStep',from:route[i],to},{op:'movementShot'}]),{op:'travelStop'},{op:'defendFinish',action:a}],u,p);}
      else {u.inBasicTravel=false;if(!a.keep)s.pending.defenders=s.pending.defenders.filter(id=>id!==(a.protect||s.pending.target));s.pending.defenders.push(u.uid);queueValorReaction(s,u,s.pending,ruleAPI(s));}
    }
    if(a.type==='pass'){fight(s,s.pending);s.pending=null;}
    if(a.type==='pushBoulder'){const u=unit(s,a.unit);s.choice={player:p,title:'Rolling Boulder · 選擇推動方向',options:[...['北','東','南','西'].map((label,i)=>({label,value:i+1})),{label:'取消',value:null}],frame:{source:clone(u),controller:p,effectCard:card('rolling_boulder').id,step:{op:'boulderDeclare',actor:u.uid,object:a.object,may:true}}};}
    if(a.type==='ranged'){
      const u=unit(s,a.unit);u.tapped=true;u.stealth=false;u.interactedTurn=s.turn;
      const range=Math.max(u.grantedRange||0,Number((card(u.card).rules.match(/Ranged (\d+)/)||[])[1]||1))+(u.rangeBonus||0);
      queueEffects(s,[{op:'shot',at:u.at,layer:u.layer||'surface',origin:true,direction:a.direction,amount:power(u),remaining:range,ranged:true}],u,p);
    }
    if(a.type==='pickup'||a.type==='drop'){
      const u=unit(s,a.unit),available=a.type==='pickup'?pickupItems(s,u):s.artifacts.filter(item=>item.bearer===u.uid&&canDropArtifact(s,item));
      const possible=a.type==='pickup'?carryChoices(s,u,ruleTransportAPI(s),a.carryAbility):passengers(s,u),rule=carryRule(u,ruleTransportAPI(s),s,a.carryAbility),assigned=passengers(s,u).filter(v=>!v.carriedAbility||v.carriedAbility===rule?.abilityInstance),riders=a.units??(a.type==='pickup'?possible.slice(0,Math.max(0,(rule?.capacity||0)-assigned.length)):possible).map(v=>v.uid);assert(Array.isArray(riders)&&new Set(riders).size===riders.length&&riders.every(id=>possible.some(v=>v.uid===id))&&(a.type!=='pickup'||assigned.length+riders.length<=(rule?.capacity||0)),'Carried unit selection is invalid');for(const id of riders){const target=unit(s,id);if(a.type==='pickup'){targetDeclared(s,u,{entity:'unit',uid:id});if(!blocked(s,p,target)&&bringPassenger(s,u,target,ruleTransportAPI(s)))boardPassenger(u,target,rule?.abilityInstance);}else dropPassenger(target);}
      const ids=a.items||available.map(item=>item.uid);assert(Array.isArray(ids)&&new Set(ids).size===ids.length&&ids.every(id=>available.some(item=>item.uid===id)),'物品選擇不合法');
      for(const item of available)if(ids.includes(item.uid)){item.bearer=a.type==='pickup'?u.uid:null;if(a.type==='pickup')rememberCarriedPosition(s,item,u,{card});else delete item.carriedPosition;if(a.type==='pickup'&&passives[card(item.card).slug]?.pickupDrawScatter&&!item.silenced&&!item.disabled&&!disabled(item))queueEffects(s,[{op:'drawCards',count:1},{op:'treasuresScatter',uid:item.uid}],{...item,controller:p},p);}
      if(a.type==='pickup')u.pickedTurn=s.turn;else u.droppedTurn=s.turn;
    }
    if(a.type==='homecomingMana'){const u=unit(s,a.unit);u.tapped=true;u.notRest=true;u.interactedTurn=s.turn;u.stealth=false;s.players[p].bonusMana=(s.players[p].bonusMana||0)+1;}
    if(a.type==='freeUnit'){const actor=unit(s,a.unit),target=unit(s,a.target);actor.tapped=true;actor.notRest=true;actor.interactedTurn=s.turn;actor.stealth=false;if(a.restraint==='spellcaster'){target.boundSpellcaster=false;target.shacklesReleased=true;}else target.cocoon=false;}
    if(a.type==='hireSellsword'){const source=unit(s,a.unit);s.choice={player:p,title:card(unit(s,a.target).card).name,options:[...selectEffects(s,{source,controller:p},{kind:'hand'}),{label:'取消',value:null}],frame:{source:clone(source),controller:p,effectCard:source.card,step:{op:'hirePay',target:a.target}}};}
    if(a.type==='salmonRoll'){const actor=unit(s,a.unit);actor.tapped=true;actor.notRest=true;actor.stealth=false;actor.interactedTurn=s.turn;queueEffects(s,[{op:'salmonD20',salmon:a.salmon}],actor,p);}
    if(a.type==='concede'){s.winner=1-p;s.phase='over';log(s,s.players[p].name+' 投降。');}
    if(a.type==='end')beginEndPhase(s,p);
  }
  stateBased(s);detectVindictiveChanges(s,finalActionSiteBefore,p,ruleAPI(s));delete s.eventContext;drainEffects(s,effectAPI);
  if(s.choice)s.choice=restrictMalleusChoice(s,restrictFinalOakChoice(s,s.choice,ruleAPI(s)),ruleAPI(s));s.history.push(a);return s;
}
function beginEndPhase(s,p){
      s.phase='end';queueEffects(s,[{op:'finishTurn'}],avatar(s,p),p);for(const u of s.units)if(!u.dying&&u.mods.some(m=>m.warpSpasm&&m.end===s.turn))queueEffects(s,[{op:'warpDeath',uid:u.uid}],u,u.controller,card('warp_spasm').id);
      for(const aura of [...s.auras||[]].reverse()){const d=areaAuras[card(aura.card).slug];if(catalogAuraActive(aura,disabled)&&d?.weather&&(d.weather==='fire'||aura.controller===p))queueEffects(s,[{op:'weatherEnd'}],aura,aura.controller,aura.card);}
      for(const aura of [...s.auras||[]].reverse())if(catalogAuraActive(aura,disabled)&&(aura.controller===p||areaAuras[card(aura.card).slug]?.everyEnd))queueEffects(s,definitions[card(aura.card).slug]?.end||[],aura,aura.controller);
      for(const [at,site] of [...s.board.entries()].reverse())if(site?.controller===p)queueEffects(s,definitions[card(site.card).slug]?.end||[],{...site,at,uid:'site:'+at,layer:'surface'},p);
      for(const u of [...s.units].reverse())if(!u.finalAuraAnimation&&!disabled(u))queueEffects(s,(unitDefinitionLayers(s,u,ruleAPI(s)).end||[]).filter(step=>u.controller===p||passives[card(step.abilityOrigin).slug]?.everyEnd),u,u.controller);
      for(const object of [...s.artifacts||[]].reverse()){
        const d=passives[card(object.card).slug];if(!object.silenced&&!object.disabled&&d?.pendulumEachEnd)queueEffects(s,[{op:'pendulumSwing'}],object,p);if(!object.silenced&&!object.disabled&&(d?.eachEndSiteHeal||d?.eachEndSiteLoss||d?.eachEndUnspentLoss))queueEffects(s,[{op:'relicSiteEnd'}],object,p);
        if(d?.fiftySentinel)queueEffects(s,[{op:'fiftySentinel'}],object,artifactController(s,object)??object.owner,object.card);if(d?.everyEnd)queueEffects(s,definitions[card(object.card).slug]?.end||[],object,p,object.card);
        if(artifactController(s,object)===p&&!d?.everyEnd&&!object.silenced&&!object.disabled)queueEffects(s,definitions[card(object.card).slug]?.end||[],object,p);
      }
      for(const [at,site] of s.board.entries())if(site&&!site.silenced&&!site.disabled&&sitePassives[card(site.card).slug]?.evilSitesEndLoss)queueEffects(s,[{op:'defilerEnd',player:p}],{...site,at,uid:'site:'+at,layer:'surface'},site.controller);
}
// Hold only the sacrificed physical card's cemetery entry, never unrelated
// deaths or its attached cards. Descendant choices remain above the boundary.
function sacrificeSiteAPI(s,object){return {...ruleAPI(s),sendCard:(state,owner,id,zone,deathTurn=null)=>deferSacrificeCemetery(state,object,{owner,card:id,zone,deathTurn})?zone:sendCard(state,owner,id,zone,deathTurn)};}
function queuePaidAbility(s,effects,source,p,effectCard,declared,victims=[]){
  for(const v of victims){if(v.kind==='site')assert(geometryPlaceSiteAllowed(s,card('rubble'),v.at,card),'Sacrificed Site cannot become Rubble');if(v.kind==='artifact')assert(geometryRemoveArtifactAllowed(s,v.object,card),'Sacrificed artifact cannot leave its location');}
  const id=beginSacrificeCost(s,victims,p,source.uid);
  queueEffects(s,[...effects,...(id?[{op:'finishSacrificeCost',id}]:[])],source,p,effectCard);
  if(effects.length&&declared!==undefined)s.storyline[s.storyline.length-1].selected=declared;
  for(const v of victims){if(v.kind==='site')destroySite(s,v.at,true);else if(v.kind==='unit'||s.units.some(u=>u.uid===v.object.uid))kill(s,v.object,false,true,true);else removeObject(s,v.object,'cemetery');}
}
function commitSite(s,a,declared){
  const p=a.player,site=s.board[a.at],ability=definitions[card(site.card).slug].activated[a.index],source={...clone(site),at:a.at,uid:site.uid||(site.uid='s'+s.next++),layer:'surface'};if(ability.tapSelected&&!a.direction){s.choice={player:p,title:card(site.card).name+' 選擇方向',options:[...['北','東','南','西'].map((label,i)=>({label,value:i+1})),{label:'取消',value:null}],frame:{source,controller:p,effectCard:site.card,step:{op:'faeDirection',action:a,ally:declared}}};return;}if(ability.tapSelected){const actor=unit(s,declared?.uid);assert(actor&&ready(s,actor)&&selectEffects(s,{source,controller:p},ability.steps[0].select).some(o=>o.value.uid===actor.uid),'Faerie tap cost is no longer valid');actor.tapped=true;actor.notRest=true;source.layer=actor.layer||'surface';}
  s.players[p].spent+=ability.mana||0;if(!site.usedAbilities)site.usedAbilities={};if(ability.once)site.usedAbilities[a.index]=s.turn;
  const victims=[];if(ability.sacrificeSelected){assert(declared&&selectEffects(s,{source,controller:p},ability.steps[0].select).some(o=>o.value.uid===declared.uid),'Sacrifice cost is no longer valid');victims.push({kind:'unit',object:unit(s,declared.uid)});}if(ability.sacrificeSite)victims.push({kind:'site',object:site,at:a.at});
  const steps=ability.steps.map(step=>({...step,...(a.direction?{direction:a.direction}:{})}));
  queuePaidAbility(s,steps,source,p,source.card,declared,victims);
}
function commitAbility(s,a,declared){
  const p=a.player,u=unit(s,a.unit),ability=liveUnitAbility(s,a);assert(ability,'能力來源已失效');if(finalArchimagoDeclare(s,a,declared,ruleAPI(s)))return;if(ability.needsCarriedArtifact&&!a.throwObject){const options=s.artifacts.filter(o=>artifactIsCarriedBy(o,u.uid)).map(o=>({label:card(o.card).name,value:o.uid}));if(options.length)s.choice={player:p,title:card(u.card).name+' : '+String.fromCharCode(36984,25799,31070,22120),options:[...options,{label:String.fromCharCode(21462,28040),value:null}],frame:{source:clone(u),controller:p,effectCard:u.card,step:{op:'assassinCommit',action:a,target:declared}}};return;}if(ability.needsCarriedArtifact)assert(s.artifacts.some(o=>o.uid===a.throwObject&&artifactIsCarriedBy(o,u.uid)),'Invalid throwing artifact');if(ability.declarePairSites&&!a.pairSitesDeclared){const options=selectEffects(s,{source:u,controller:p},ability.steps[0].select).filter(o=>o.value.at!==declared.at);if(options.length)s.choice={player:p,title:card(u.card).name+' : '+String.fromCharCode(31532,20108,20491,22320,40670),options:[...options,{label:String.fromCharCode(21462,28040),value:null}],frame:{source:clone(u),controller:p,effectCard:u.card,step:{op:'commitPairSites',action:a,first:declared}}};return;}if(ability.declarePairSites){const sites=selectEffects(s,{source:u,controller:p},ability.steps[0].select).map(o=>o.value.at);assert(sites.includes(declared?.at)&&sites.includes(a.pairSecond?.at)&&declared.at!==a.pairSecond.at,'Invalid site pair');}if(ability.declarePair&&!a.pairDeclared){const first=unit(s,declared.uid),options=selectEffects(s,{source:u,controller:p,effectCard:u.card},{kind:'unit',other:true,nearby:true}).filter(o=>o.value.uid!==first?.uid&&sameLocation(s,unit(s,o.value.uid),first));if(!options.length)return;s.choice={player:p,title:card(u.card).name+' ? 第二個目標',options:[...options,{label:'取消（不支付費用）',value:null}],frame:{source:clone(u),controller:p,effectCard:u.card,step:{op:'commitPairAbility',action:a,first:declared}}};return;}let fire=0;const previousAbilityAccess=s.zoneAccessScope;
  if(ability.fireBlast&&!a.blastLocation){s.choice={player:p,title:'Ignis Rex',options:[...selectEffects(s,{source:u,controller:p},{kind:'location',adjacent:true,sameRegion:true}),{label:'Cancel',value:null}],frame:{source:clone(u),controller:p,effectCard:u.card,step:{op:'fireBlastCommit',action:a,hand:declared}}};return;}
  if(ability.banishSelectedGrave||ability.banishDeadFire){assert(canPayZoneAccess(s,p,ruleAPI(s),ability.mana||0),'Bureau access fee is not affordable');s.zoneAccessScope=commitZoneAccess(s,p,ruleAPI(s),{scope:a.zoneAccessScope||s.zoneAccessScope});a={...a,zoneAccessScope:s.zoneAccessScope};}
  if(ability.banishSelectedGrave){const g=graveEntries(s,declared.player).find(g=>g.uid===declared.uid&&g.card===declared.card);assert(g&&card(g.card).type==='Minion','死去僕從的費用已失效');takeGrave(s,g.player,g.index,g.card,g.uid);s.players[g.player].banished.push(g.card);}
  if(ability.discardSelectedCard){const h=s.players[p].hand.find(h=>h.uid===declared.uid);assert(h&&selectEffects(s,{source:u,controller:p},ability.steps[0].select).some(o=>o.value.uid===h.uid),'棄牌費用已失效');s.players[p].hand=s.players[p].hand.filter(v=>v.uid!==h.uid);sendCard(s,p,h.card,'cemetery');}
  if(ability.discardSelectedSpell){const h=s.players[p].hand.find(h=>h.uid===declared.uid);assert(h&&card(h.card).category==='Spell','必須棄一張法術');s.players[p].hand=s.players[p].hand.filter(v=>v.uid!==h.uid);sendCard(s,p,h.card,'cemetery');}
  if(ability.banishDeadFire)for(const g of yourGraves(s,p).filter(g=>card(g.card).type==='Minion'&&card(g.card).fire>0).reverse()){fire+=card(g.card).fire;takeGrave(s,g.player,g.index,g.card,g.uid,p);s.players[g.player].banished.push(g.card);}
  const sacrificeVictims=ability.sacrifice?[{kind:'unit',object:u}]:[];if(ability.sacrificeSelected){assert(declared&&selectEffects(s,{source:u,controller:p},ability.steps[0].select).some(o=>o.value.uid===declared.uid),'Sacrifice cost is no longer valid');sacrificeVictims.push({kind:'unit',object:unit(s,declared.uid)});}
  finalArchimagoPayCost(s,a,u,ruleAPI(s));
  s.players[p].spent+=ability.mana||0;if(ability.onceEver)u[ability.onceEver]=true;if(ability.tap)u.tapped=true;if(!u.usedAbilities)u.usedAbilities={};if(ability.once){u.usedAbilities[ability.abilityUseKey??ability.abilityInstance??a.index]=s.turn;if(ability.abilityNature==='printed'&&!ability.abilityUseKey)u.usedAbilities[a.index]=s.turn;}
  u.notRest=true;u.interactedTurn=s.turn;if(!ability.preserveStealth)u.stealth=false;queuePaidAbility(s,(ability.fireBlast?[{op:'locationDamage',amount:3}]:ability.steps).map(step=>({...step,...(a.throwObject?{throwObject:a.throwObject}:{}),...(a.pairSecond?{second:a.pairSecond}:{}),...(step.amount==='banishedFire'?{amount:fire}:{}),...(ability.abilityOrigin?{abilityOrigin:ability.abilityOrigin}:{})})),ability.damageElements?{...u,abilityDamageElements:[...ability.damageElements]}:u,p,ability.abilityOrigin||u.card,a.blastLocation||declared,sacrificeVictims);
  if(previousAbilityAccess)s.zoneAccessScope=previousAbilityAccess;else delete s.zoneAccessScope;
}
function commitArtifact(s,a,declared){
  const object=s.artifacts.find(o=>o.uid===a.object),p=a.player,ability=definitions[card(object.card).slug].activated[a.index],source=clone(ability.bearerTap||ability.bearerSource?unit(s,object.bearer):object);
  assert((ability.bearerGranted?unit(s,object.bearer)?.controller:artifactController(s,object))===p,'Artifact ability controller changed');
  if(ability.spearThrow){const target=unit(s,declared?.uid);assert(target&&!target.dying,'Spear victim is no longer valid');const options=geometryLocationRecords(target).map(({at,layer})=>({label:String.fromCharCode(65+at%5)+(4-Math.floor(at/5))+' '+layer,value:{at,layer}}));if(!a.spearLocation&&options.length>1){s.choice={player:p,title:card(object.card).name+' : '+String.fromCharCode(36984,25799,33853,40670),options:[...options,{label:String.fromCharCode(21462,28040),value:null}],frame:{source,controller:p,effectCard:object.card,step:{op:'spearCommit',action:a,target:declared}}};return;}a={...a,spearLocation:a.spearLocation||options[0].value};assert(options.some(v=>eq(v.value,a.spearLocation)),'Invalid Spear location');}
  if(ability.bearerTap){const bearer=unit(s,object.bearer);assert(bearer&&ready(s,bearer),'持有者無法支付橫置費用');bearer.tapped=true;bearer.notRest=true;bearer.interactedTurn=s.turn;bearer.stealth=false;source.tapped=true;source.stealth=false;}
  if(ability.fiftyThrow){source.throwObject=object.uid;object.bearer=null;}
  if(ability.crew){queueEffects(s,[{op:'siegeCrew',action:a,target:declared}],source,p);return;}
  if(!object.usedAbilities)object.usedAbilities={};if(ability.once)object.usedAbilities[ability.bearerOnce?object.bearer+':'+a.index:a.index]=s.turn;
  if(ability.steps[0].op==='bearerDamage'){const bearer=unit(s,object.bearer);bearer.notRest=true;bearer.interactedTurn=s.turn;bearer.stealth=false;}
  if(ability.banishSelf)removeObject(s,object,'banished');queuePaidAbility(s,ability.steps.map(step=>({...step,...(step.op==='finalMalleus'?{object:object.uid}:{}),...(ability.spearThrow?{object:object.uid,location:a.spearLocation}:{})})),source,p,source.card,declared,ability.sacrificeAtActivation||ability.sacrificeSelf?[{kind:'artifact',object}]:[]);
}
function siegeCrew(s,object,p){const bearer=unit(s,object.bearer);return bearer?s.units.filter(u=>u.uid!==bearer.uid&&u.controller===p&&ready(s,u)&&sameLocation(s,u,bearer)):[];}
function beginCast(s,a){
  if(a.x!==undefined)assert(Number.isInteger(a.x)&&a.x>=0,'X 必須是非負整數');
  if(passives[castingCard(s,a)?.slug]?.xCost&&a.x===undefined){const c=castingCard(s,a),caster=spellcaster(s,a.caster,a.casterLayer,a.casterLocation),options=[];for(let x=0;x<=10000&&canPaySpell(s,a.player,c,a.at,caster,a.payment,0,a.layer||'surface',{...a,x});x++)options.push({label:'X = '+x,value:x});s.choice={player:a.player,title:c.name+' · 選擇 X（確認前可取消）',options:[...options,{label:'取消施放',value:null}],frame:{source:caster,controller:a.player,effectCard:c.id,step:{op:'remainingX',action:a}}};return;}

  const p=a.player,c=castingCard(s,a),first=definitions[c.slug]?.cast?.[0],caster=spellcaster(s,a.caster,a.casterLayer,a.casterLocation);
  if(areaAuras[c.slug]?.border){queueEffects(s,[{op:'borderDeclare',action:a}],caster,p,c.id);return;}
  if(c.type==='Magic'&&magicNeedsCastDeclaration(c,first)){
    const options=first.select?magicPlanningOptions(s,c,caster,p,first.select,ruleAPI(s)):['北','東','南','西'].map((label,i)=>({label,value:i+1}));
    s.choice={player:p,title:c.name+' · 施放前選擇（費用 '+castingCost(s,p,c,a.at,caster,a.payment,0,a.layer||'surface',a)+'）',options:[...options,{label:'取消施放（不支付費用）',value:null}],frame:{source:clone(caster),controller:p,effectCard:c.id,step:{op:'commitSpell',action:a,effectOp:first.op,abilityOrigin:first.abilityOrigin,optional:true}}};
  }else commitSpell(s,a);
}
function commitSpell(s,a,declared){
  if(beforeFinalRasputinConfirm(s,a,declared,ruleAPI(s)))return;
  if(beforeMagicDeclaration(s,a,declared,ruleAPI(s)))return;
  if(beforeFinalUnitExtraCostChoice(s,a,ruleAPI(s)))return;
  if(beforeFinalSpellCommit(s,a,declared,ruleAPI(s)))return;
  if(['swap','backstab'].includes(castingCard(s,a)?.slug)&&!a.remainingSecond){const caster=spellcaster(s,a.caster,a.casterLayer,a.casterLocation),c=castingCard(s,a),frame={source:caster,controller:a.player,effectCard:c.id};s.choice={player:a.player,title:c.name+' · 選擇第二目標（確認前不支付費用）',options:[...secondTargetOptions(s,frame,declared,ruleAPI(s)),{label:'取消施放（不支付費用）',value:null}],frame:{...frame,step:{op:'remainingDeclare',action:a,first:declared}}};return;}

  if(offRealmPassiveEntries(castingCard(s,a),'heirCopy',ruleAPI(s)).some(v=>v.value)&&!a.heirDecided){queueEffects(s,[{op:'copyHeirCost',action:a}],spellcaster(s,a.caster,a.casterLayer,a.casterLocation),a.player,castingCard(s,a).id);return;}
  if(castingCard(s,a).slug==='just_a_rock'&&a.bearer&&!a.rockVictim){const items=s.artifacts.filter(o=>artifactIsCarriedBy(o,a.bearer));if(items.length>1){s.choice={player:a.player,title:'Just a Rock',options:[...items.map(o=>({label:card(o.card).name,value:o.uid})),{label:'Cancel',value:null}],frame:{source:spellcaster(s,a.caster,a.casterLayer,a.casterLocation),controller:a.player,effectCard:castingCard(s,a).id,step:{op:'fiftyRockCommit',action:a,declared}}};return;}if(items.length)a={...a,rockVictim:items[0].uid};}
  if(a.payment==='randomDiscard'&&!s.randomReplay){queueEffects(s,[{op:'commitLegacy',action:a,declared}],spellcaster(s,a.caster,a.casterLayer,a.casterLocation),a.player,castingCard(s,a).id);return;}
  if(castingCard(s,a).slug==='craterize'&&!finalAvatarCopyIsFree(s,a,a.player)&&!(s.finalFreeCast?.player===a.player&&s.finalFreeCast.hand===a.hand)&&!a.discardedSite){queueEffects(s,[{op:'craterDiscard',action:a,target:declared}],spellcaster(s,a.caster,a.casterLayer,a.casterLocation),a.player,castingCard(s,a).id);return;}
  if(castingCard(s,a).handler==='lightning'&&!s.randomReplay){queueEffects(s,[{op:'commitLegacy',action:a,declared}],spellcaster(s,a.caster,a.casterLayer,a.casterLocation),a.player,castingCard(s,a).id);return;}
  if(castingCard(s,a).slug==='chain_lightning'&&!a.chainTargets){queueEffects(s,[{op:'chainDeclare',action:a,targets:[declared]}],spellcaster(s,a.caster,a.casterLayer,a.casterLocation),a.player,castingCard(s,a).id);return;}
  validateMalleusSpell(s,a,declared,ruleAPI(s));
  const previousAccessScope=s.zoneAccessScope,previousMagicChoiceContext=s.magicChoiceContext;const pAccess=a.player;if(a.zoneAccessScope)s.zoneAccessScope=a.zoneAccessScope;if(a.grave!==undefined||a.collection!==undefined){const scope=commitZoneAccess(s,pAccess,ruleAPI(s),{scope:a.zoneAccessScope||s.zoneAccessScope});a={...a,zoneAccessScope:scope};s.zoneAccessScope=scope;}
  const p=a.player,pl=s.players[p],c=castingCard(s,a),owner=a.bound?(s.boundSpells||[]).find(h=>h.uid===a.bound).owner:a.grave!==undefined?a.graveOwner??p:p,castingUnit=spellcaster(s,a.caster,a.casterLayer,a.casterLocation),cost=castingCost(s,p,c,a.at,castingUnit,a.payment,2*Math.max(0,(a.chainTargets?.length||1)-1),a.layer||'surface',a);assert(canPaySpell(s,p,c,a.at,castingUnit,a.payment,2*Math.max(0,(a.chainTargets?.length||1)-1),a.layer||'surface',a),'Spell payment is no longer affordable');if(a.payment==='randomDiscard'){const hand=pl.hand.filter(h=>h.uid!==a.hand);assert(offRealmPassiveEntries(c,'randomDiscardCost',ruleAPI(s)).some(v=>v.value)&&hand.length,'No card for random discard');const h=hand[rollIndex(s,hand.map(v=>card(v.card).type==='Site'?'Atlas card':'Spellbook card'))];pl.hand=pl.hand.filter(v=>v.uid!==h.uid);sendCard(s,p,h.card,'cemetery');}if(pl.bloodManaTurn===s.turn){delete pl.bloodManaTurn;const summon=(c.type==='Minion'?summoningTax(s,c):0);pl.spent+=summon;loseLife(s,p,cost-summon);}else pl.spent+=cost;const physicalCastingUnit=unit(s,castingUnit.uid)||s.artifacts.find(o=>o.uid===castingUnit.uid)||castingUnit;if(elements.some(e=>hasElement(c,e))&&physicalCastingUnit.elementGiftTurn===s.turn)physicalCastingUnit.elementGiftCount=0;physicalCastingUnit.elementGifts=(physicalCastingUnit.elementGifts||[]).filter(g=>g.turn===s.turn&&!(hasElement(c,g.element)));if(c.type==='Magic')physicalCastingUnit.finalNextMagicGifts=(physicalCastingUnit.finalNextMagicGifts||[]).filter(g=>g.turn!==s.turn);
  if(dragonGift(s,p,c,a.at,a.layer||'surface'))s.ongoingEffects=s.ongoingEffects.filter(e=>!(e.op==='freeDragon'&&e.controller===p&&e.end===s.turn&&e.at===a.at&&e.layer===(a.layer||'surface')));
  if(nextSiteCast(s,c,a.at))delete s.board[a.at].nextCastTurn;
  if(isKnightSpell(c))pl.knightCastTurn=s.turn;if(c.type==='Magic'&&card(castingUnit.card).type==='Site'&&s.board[castingUnit.at]?.towerMagicTurn===s.turn)s.board[castingUnit.at].towerMagicUsed=true;
  if(a.magicDeclaration)for(const declaredTarget of magicDeclarationTargets(a.magicDeclaration))targetDeclared(s,castingUnit,declaredTarget);
  if(!definitions[c.slug]?.cast&&typeof a.target==='string')targetDeclared(s,castingUnit,{entity:'unit',uid:a.target});
  if(a.shacklesTarget)targetDeclared(s,castingUnit,{entity:'unit',uid:a.bearer});
  const castObservers=[...s.artifacts];if(castingUnit.spellCastTurn!==s.turn){castingUnit.spellCastTurn=s.turn;castingUnit.castElements=[];castingUnit.castCount=0;}castingUnit.castCount++;castingUnit.castElements=[...new Set([...castingUnit.castElements,...elements.filter(e=>hasElement(c,e))])];
  if(c.type==='Magic')for(const o of s.artifacts)if(o.bearer===castingUnit.uid&&passives[card(o.card).slug]?.heldMagicPower){if(!o.magicCasts)o.magicCasts={};const entry=o.magicCasts[castingUnit.uid];o.magicCasts[castingUnit.uid]={turn:s.turn,count:entry?.turn===s.turn?entry.count+1:1};}
  // Chain additions are included in the same mana or life payment above.
  if(pl.castTurn!==s.turn){pl.castTurn=s.turn;pl.castAir=0;pl.castNonFire=false;}pl.castAir+=(c.air||0);if(!c.fire&&!c.elements?.includes('Fire'))pl.castNonFire=true;
  if(a.payment==='harbinger')avatar(s,p).harbingerTurn=s.turn;
  a=commitFinalUnitExtraCosts(s,a,ruleAPI(s));
  finalUnitCommitPlunder(s,a,ruleAPI(s));
  const physicalCard=finalAvatarPhysicalCard(s,a,ruleAPI(s))||vivienPhysicalCard(c)||c.id;
  if(a.top!==undefined){assert(pl.spells[0]===physicalCard,'Top card changed');pl.spells.shift();}else if(a.collection!==undefined){assert(pl.collection[a.collection]===physicalCard,'Collection card changed');pl.collection.splice(a.collection,1);}else if(a.bound)s.boundSpells=s.boundSpells.filter(h=>h.uid!==a.bound);else if(a.grave!==undefined)takeGrave(s,owner,a.grave,physicalCard,a.graveUid);else pl.hand=pl.hand.filter(v=>v.uid!==a.hand);
  finalAvatarCommitGraveCopy(s,a,c,ruleAPI(s));
  commitMalleusSpell(s,a);
  if(c.type==='Magic')s.magicChoiceContext=createMagicChoiceContext(s,p,c,castingUnit,a,declared,ruleAPI(s)).id;
  finalThronePlayed(s,p,c,ruleAPI(s));
  const resolution={action:a,card:c.id,owner,physicalCard,castingUnit:clone(castingUnit),declared};
  if(!queueAnimationCast(s,p,resolution,ruleAPI(s)))resolveCommittedSpell(s,resolution);
  if(c.type==='Magic')queueSturmReactions(s,castingUnit,ruleAPI(s));
  if(c.type==='Magic')for(const trigger of combatTriggers(s,castingUnit,'pushAfterMagic',ruleAPI(s),()=>[{op:'battleSylph',optional:true,select:{kind:'unit',here:true,untargeted:true}}]))queueEffects(s,trigger.steps,trigger.source,p,trigger.source.card);
  if(c.type==='Minion'&&s.board[a.at])for(const aura of s.auras)if(aura.controller===p&&!aura.silenced&&!aura.disabled&&areaAuras[card(aura.card).slug]?.castTribeDraw&&inside(aura,a.at)&&['Beast','Faerie'].some(t=>c.subtypes.includes(t)))queueEffects(s,[{op:'drawOne',deck:'spells'}],aura,p);
  const caster=spellcaster(s,a.caster,a.casterLayer,a.casterLocation);for(const o of castObservers)if(o.bearer===castingUnit.uid&&!o.silenced&&!o.disabled&&passives[card(o.card).slug]?.bearerCastDamageHeal)queueEffects(s,[{op:'morriganDamage',optional:true,select:{kind:'unit',nearby:true}}],castingUnit,p,castingUnit.card);if(caster)for(const trigger of spatialCastEvents(s,caster,c,ruleAPI(s)))queueEffects(s,trigger.steps,trigger.source,p,trigger.source.card);if(caster){const physical=unit(s,caster.uid)||s.artifacts.find(o=>o.uid===caster.uid)||caster;physical.stealth=false;physical.interactedTurn=s.turn;}
  for(const [at,site] of s.board.entries())if(site&&sitePassives[card(site.card).slug]?.castRarityLifeLoss){const amount=(c.rarity||c.slot)==='Elite'?1:(c.rarity||c.slot)==='Unique'?2:0;if(amount)queueEffects(s,[{op:'castLifeLoss',player:p,amount}],{...site,at,uid:'site:'+at},site.controller,c.id);}
  if(card(castingUnit.card).type==='Avatar')for(const o of castObservers)if(passives[card(o.card).slug]?.nearbyAvatarCastLoss&&nearby(s,o.at,castingUnit.at)&&regionsOverlap(s,o,castingUnit))queueEffects(s,[{op:'castLifeLoss',player:p,amount:castingUnit.castCount}],o,artifactController(s,o)??o.owner,c.id);
  if(s.finalFreeCast?.player===p&&s.finalFreeCast.hand===a.hand)delete s.finalFreeCast;
  stateBased(s);if(previousAccessScope)s.zoneAccessScope=previousAccessScope;else delete s.zoneAccessScope;if(previousMagicChoiceContext)s.magicChoiceContext=previousMagicChoiceContext;else delete s.magicChoiceContext;
}
function resolveCommittedSpell(s,payload){
  const {action:a,owner,physicalCard,castingUnit,declared}=payload,p=a.player,c=card(payload.card);
  if(c.type==='Minion') {beforeFinalUnitCast(s,c,a,ruleAPI(s));const u=finalAvatarCastReplacement(s,a,c,a.deathspeaker?p:owner,ruleAPI(s))||makeUnit(s,a.heirCard?finalArchivePrintedCard(a.heirCard,ruleAPI(s)):(a.deathspeaker||a.avatarCopy!==undefined?finalArchivePrintedCard(c.id,ruleAPI(s)):finalRasputinSummonCard(s,a,c,ruleAPI(s))),a.deathspeaker?p:owner,a.at);u.finalCastFromHand=a.hand!==undefined&&!a.fromCollection;if(a.avatarForm==='spirit')u.originalCard=physicalCard;if(a.heirCard){u.originalCard=physicalCard;u.copyEntryDone=true;}u.controller=p;u.notRest=true;u.layer=a.layer||'surface';if(!s.board[a.at]&&!printedKeywords(c).includes('Voidwalk')&&spatialVoidSummoning(s,p,a.at,ruleAPI(s)))u.mods.push({keyword:'Voidwalk',whileVoid:true});if(offRealmPassiveEntries(c,'ambushAbove',ruleAPI(s)).some(v=>v.value)){u.layer='below';u.burrowedSafely=true;}if(a.bookDead){u.mods.push({replaceTypes:['Undead']});u.banishOnDeath=true;}finalAvatarPrepareCopyEntry(s,a,u,ruleAPI(s));finalUnitPrepareCastEntry(s,u,c,a,ruleAPI(s));summonedGenesis(s,u);const traitor=s.board[a.at],threshold=traitor&&sitePassives[card(traitor.card).slug]?.enemyStealthCastThreshold;if(traitor?.controller===1-p&&threshold&&resources(s,traitor.controller)[threshold]>=1)u.stealth=true;log(s,'召喚 '+c.name+'。');}
  else if(c.type==='Artifact'){const object={uid:'o'+s.next++,stamp:s.next-1,born:s.turn,card:c.id,owner,controller:p,at:a.at,bearer:a.bearer||null,...(a.rockVictim?{rockVictim:a.rockVictim}:{}),layer:a.bearer?a.layer||unit(s,a.bearer).layer||'surface':'surface'};finalAvatarPrepareCopyEntry(s,a,object,ruleAPI(s));if(a.shacklesTarget){const target=unit(s,a.bearer);object.at=target.at;object.layer=target.layer||'surface';if(blocked(s,p,target))object.bearer=null;}s.artifacts.push(object);refreshContinuous(s);if(!object.silenced)queueEffects(s,definitions[c.slug]?.genesis||[],object,p);if(passives[c.slug]?.sunkenTreasure)queueEffects(s,[{op:'treasureCast',uid:object.uid}],spellcaster(s,a.caster,a.casterLayer,a.casterLocation),p,c.id);}
  else if(c.type==='Aura'){const aura={uid:'o'+s.next++,stamp:s.next-1,born:s.turn,card:c.id,owner,controller:p,at:a.at,...(a.wallTo!==undefined?{wallTo:a.wallTo}:{}),...(areaAuras[c.slug]?.singleSite?{singleSite:true,visited:[a.at]}:{}),...(areaAuras[c.slug]?.turns?{remainingTurns:areaAuras[c.slug].turns}:{})};finalAvatarPrepareCopyEntry(s,a,aura,ruleAPI(s));s.auras.push(aura);refreshContinuous(s);if(!aura.silenced&&!aura.disabled)queueEffects(s,definitions[c.slug]?.genesis||[],aura,p);}
  else {
    queueEffects(s,[{op:'finishMagic',card:physicalCard,owner,destination:a.avatarCopy?'banished':a.grave!==undefined&&(a.graveBanish||passives[c.slug]?.banishAfterGraveCast)?'banished':'cemetery'}],spellcaster(s,a.caster,a.casterLayer,a.casterLocation),p,c.id,a.zoneAccessScope?{scope:a.zoneAccessScope}:{});
    const effects=definitions[c.slug]?.cast?definitions[c.slug].cast.filter(()=>c.slug!=='arcane_barrage'||a.x>0).map(step=>c.slug==='arcane_barrage'?{...step,count:a.x}:c.slug==='assorted_animals'?{...step,budget:a.x}:a.remainingSecond?{...step,second:a.remainingSecond}:a.shatterTarget?{...step,shatterTarget:a.shatterTarget}:a.chainTargets?{...step,targets:a.chainTargets,select:undefined}:step).map(step=>a.magicDeclaration?{...step,magicDeclaration:a.magicDeclaration}:step):[{op:'resolveLegacySpell',action:a}];
    const magicDeclared=orbTargetSnapshot(s,declared);queueEffects(s,[{op:'reactionMagicResolve',effects,...(magicDeclared!==undefined?{declared:magicDeclared}:{}),...(card(castingUnit.card).type==='Site'?{siteUid:s.board[castingUnit.at]?.uid}:{})}],finalChaosSpellSource(s,a,c,spellcaster(s,a.caster,a.casterLayer,a.casterLocation)),p,c.id,{abilityOrigin:c.id,...(a.zoneAccessScope?{scope:a.zoneAccessScope}:{})});queueFinalOrbCopies(s,a,c,castingUnit,magicDeclared,effects,ruleAPI(s));log(s,'施放 '+c.name+'。');
  }
}
function hydrateGameRuntimeCards(saved){
 const A=ruleAPI(saved);
 hydrateRuntimeCards(saved,A,[
  builtinRuntimeProvider,
  {handles:({kind})=>kind.startsWith('archive_')||['altar_spent','final_gargoyle_monument','gargoyle_form'].includes(kind),register:({id},api)=>registerArchiveRuntimeCard(id,api)},
  {handles:({kind})=>/^animist(?:_x_\d+)?$/.test(kind)||/^mephisto_avatar_\d+$/.test(kind),register:({id},api)=>registerAvatarRuntimeCard(id,api)},
  {handles:({kind})=>kind.startsWith('abilities_'),dependencies:({kind})=>[decodeURIComponent(kind.slice('abilities_'.length))],register:({kind,base},api)=>registerBorrowedCard(base,decodeURIComponent(kind.slice('abilities_'.length)),api)},
  {handles:({kind})=>kind==='imposter_back',register:({base},api)=>api.runtimeCard(base,'imposter_back',{type:'None',category:'None',playable:false})},
  {handles:({kind})=>kind==='aura_minion',register:({base},api)=>registerAuraAnimationCard(base,api)},
  {handles:({kind})=>/^artifact_animation_[0-9]+(?:\.[0-9]+)?$/.test(kind),register:({kind,base},api)=>animatedArtifactCard(base,Number(kind.slice('artifact_animation_'.length)),api)},
  {handles:({kind})=>kind.startsWith('vivien_'),dependencies:({id})=>vivienRuntimeDependencies(id),register:({id},api)=>registerVivienRuntimeCard(id,api)},
  {handles:({kind})=>kind==='tower_of_babel',register:()=>registerBuiltSiteCards(card,runtimeCard)}
 ]);
}
// Restore derived capabilities without advancing the saved storyline or RNG.
export function restoreGame(saved){const s=clone(saved);s.projectRuleProfile=PROJECT_RULE_PROFILE;hydrateGameRuntimeCards(s);restoreArtifactAnimations(s,ruleAPI(s));restoreAnimations(s,ruleAPI(s));if(!s.artifacts)s.artifacts=[];for(const a of [...s.artifacts])if(card(a.card).artifactUnit&&!s.units.some(u=>u.uid===a.uid)){const u=makeUnit(s,a.card,a.owner,a.at);Object.assign(u,a,{tapped:!!a.tapped,mods:a.mods||[],born:a.born??s.turn,damage:a.damage||0});delete u.bearer;s.artifacts=s.artifacts.filter(o=>o.uid!==a.uid);}if(!s.auras)s.auras=[];for(let p=0;p<2;p++)syncGraves(s,p);for(const u of s.units){if(u.observedTapped===undefined)u.observedTapped=!!u.tapped;if(!u.observedPosition)u.observedPosition={at:u.at,layer:u.layer||'surface',cells:occupied(u)};}if(s.avatarSetupComplete===undefined&&s.players?.length===2&&[0,1].every(p=>avatar(s,p)))s.avatarSetupComplete=true;refreshContinuous(s);if(s.choice)s.choice=restrictMalleusChoice(s,restrictFinalOakChoice(s,s.choice,ruleAPI(s)),ruleAPI(s));migrateLegacyTwisterChoice(s);return s;}
// Only public board information and the acting player's own hand/decks are exposed.
export function handIsRevealed(s,p){if(s.choice?.frame?.step?.op==='finalInquisitionBanish'&&s.choice.frame.step.player===p||s.choice?.frame?.step?.op==='lookHand'&&s.choice.frame.controller===1-p)return true;if(s.choice?.frame?.step?.op==='accuseBanish'&&s.choice.frame.step.player===p)return true;const target=avatar(s,p);return !!target&&s.units.some(u=>u.controller!==p&&!u.dying&&spatialHas(s,u,'revealHandsInMotion',ruleAPI(s))&&locations(s,u,card,keywords).some(v=>occupied({...u,at:v.at}).some(at=>occupied(target).includes(at))&&v.layer===(target.layer||'surface')));}
export function observation(s,p) {
  const v=clone(s);delete v.finalDecisionPending;delete v.finalDecisionReplay;v.players[1-p].collection=Array((v.players[1-p].collection||[]).length).fill(null);v.players[1-p].handRevealed=handIsRevealed(s,1-p);if(!v.players[1-p].handRevealed)v.players[1-p].hand=v.players[1-p].hand.map(()=>({hidden:true}));
  v.boundSpells=(v.boundSpells||[]).map(h=>spellcaster(v,h.unit)?.controller===p?h:{uid:h.uid,unit:h.unit,owner:h.owner,hidden:true});
  v.players[1-p].atlas=Array(v.players[1-p].atlas.length).fill(null);v.players[1-p].spells=Array(v.players[1-p].spells.length).fill(null);
  v.players[p].atlas=Array(v.players[p].atlas.length).fill(null);v.players[p].spells=Array(v.players[p].spells.length).fill(null);
  const top=topSpellAccess(s,p);for(let q=0;q<2;q++)if(top.cards[q])v.players[q].spells[0]=top.cards[q];
  if(v.choice&&v.choice.player!==p){v.choice.options=v.choice.options.map(()=>({hidden:true}));v.choice.frame=null;}
  v.rng=null;v.history=[];return observeFinalControl(s,v,p);
}
export {selectEffects as effectOptions};
export const topSpellAccess=(s,p)=>readTopSpellAccess(s,p,ruleAPI(s));










export function freeCastActions(s,p,hand,caster){
  const descriptor=typeof caster==='object'?caster:null,id=descriptor?.uid||caster;s.finalFreeCast={player:p,hand,caster:id};
  return legalActions(s,p).filter(a=>a.type==='cast'&&a.hand===hand&&(!id||a.caster===id)&&(!descriptor?.geometryCasterLocation||a.casterLocation?.at===descriptor.at&&a.casterLocation?.layer===(descriptor.layer||'surface')));
}
const fiftyAPI={ruleAPI,registerVivienWithBorrowed:(s,id,source,p)=>registerVivienWithBorrowed(s,id,source,p,ruleAPI(s)),sendBuiltSite,builtSitePhysicalParts,tagBuiltSiteParts,restoreBuiltSiteState,detachBuiltSiteParts,casterPlacementAllowed:(s,u,c,at)=>casterPlacementAllowed(s,u,c,at,ruleAPI(s)),spatialLayers,spatialHas,spatialCasterAllowed,spatialDenyEntry,spatialFreeMove,spatialMazeAllows,archiveApplyingEffects,destroyInertCards:(s,ids)=>destroyInertCards(s,ids,ruleAPI(s)),siteTargets,handIsRevealed,casterPermissionAllows:(s,u,c,options)=>casterPermissionAllows(s,u,c,ruleAPI(s),options),secondTargetOptions,topSpellAccess,searchLimit,resolveCommittedSpell,spellTargets,cemeteryPhysicalPlayer:(s,p)=>cemeteryPhysicalPlayer(s,p,fiftyAPI),cemeteryCards:(s,p)=>cemeteryCards(s,p,fiftyAPI),viewGraveEntries:(s,p)=>yourGraves(s,p),effectGraveEntries:(s,p,actor)=>effectGraves(s,p,actor),castingCost,spellcaster,bodyOfWater,rollIndex,randomDecisionController,protectedAttackUnit,peaceAllowsAttack,casters,canPaySpell,ignoresThreshold,castingCard,fight,freeCastActions,bindControl,beginRealmDestruction,finishRealmDestruction,refreshContinuous,summoningTax,unitTypes,beginCast,sendCard,damageSite,unitUmbrellas,loseLife,playerDies,legalActions,unmodifiable,canTarget,liveUnitAbilities,liveUnitAbility,unitAbility:(s,u,a)=>liveUnitAbility(s,{...a,unit:u.uid}),get cardCatalog(){return cardCatalog;},runtimeCard,equipment,sitePassives,fiftyForceAllowed,card,printedKeywords,unit,avatar,power,keywords,disabled,region,regionNames,regionsOverlap,nearby,distance,occupied,locations,canEnterOnGround,queueEffects,kill,hurt,strike,strikeMany,strikeTotal,heal,removeObject,enterSite,destroySite,draw,shuffle,log,makeUnit,summonedGenesis,graveEntries,takeGrave,canSummonEntry,paySummoningTax,selectEffects,blocked,resources,siteAffinity,area,inside,artifactController,beginSiteCard,commitAbility,commitSiteCard,definitions,passives,waterSite,leaveUnit,commitSpell};

function area(s,at){return at===undefined?baseArea(s):baseArea(at,isGlobeActive(s,card));}

const boundRuleAPIs=new WeakMap(),boundTransportAPIs=new WeakMap();
function ruleAPI(s){if(!boundRuleAPIs.has(s))boundRuleAPIs.set(s,{...fiftyAPI,baseUnitTypes,cardForPlayer:(id,p)=>cardForPlayer(s,id,p),unitTypes:u=>unitTypes(u,s),unitUmbrellas:(u,viewer=null)=>unitUmbrellas(u,s,viewer),get cardCatalog(){return fiftyAPI.cardCatalog;},distance:(a,b)=>distance(s,a,b),nearby:(a,b)=>nearby(s,a,b),area:at=>area(s,at),inside:(a,at)=>inside(a,at,isGlobeActive(s,card))});return boundRuleAPIs.get(s);}
function ruleTransportAPI(s){if(!boundTransportAPIs.has(s))boundTransportAPIs.set(s,{...transportAPI,unitTypes:u=>unitTypes(u,s),unitUmbrellas:(u,viewer=null)=>unitUmbrellas(u,s,viewer),artifactController,distance:(a,b)=>distance(s,a,b),nearby:(a,b)=>nearby(s,a,b),area:at=>area(s,at),inside:(a,at)=>inside(a,at,isGlobeActive(s,card))});return boundTransportAPIs.get(s);}
