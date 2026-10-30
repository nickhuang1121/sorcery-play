// Each entry corresponds to explicit official card text. This is a bounded
// registry, not a prose parser or a default effect for unknown cards.
import {siteDefinitions,sitePassives,siteOperations} from './site-cards.js';
import {martialDefinitions,martialPassives,martialOperations} from './martial.js';
import {reactionDefinitions,reactionPassives,reactionOperations} from './reactions.js';
import {aquaticDefinitions,aquaticPassives,aquaticOperations} from './aquatic.js';
import {eventPassives,eventOperations} from './events.js';
import {gravecastingDefinitions,gravecastingPassives,gravecastingOperations} from './gravecasting.js';
import {necromancyDefinitions,necromancyPassives,necromancyOperations} from './necromancy.js';
import {graveEventDefinitions,graveEventPassives,graveEventOperations} from './grave-events.js';
import {relicDefinitions,relicPassives,relicOperations} from './relics.js';
import {betaRulesDefinitions,betaRulesPassives,betaRulesOperations} from './beta-rules.js';
import {betaTerrainDefinitions,betaTerrainPassives,betaTerrainOperations} from './beta-terrain.js';
import {betaSpellDefinitions,betaSpellPassives,betaSpellOperations} from './beta-spells.js';
import {betaMovementDefinitions,betaMovementPassives,betaMovementOperations} from './beta-movement.js';
import {betaWeatherPassives,betaWeatherOperations} from './beta-weather.js';
import {betaSiegeDefinitions,betaSiegeOperations} from './beta-siege.js';
import {betaCompletionDefinitions,betaCompletionPassives,betaCompletionOperations} from './beta-completion.js';
import {batchDefinitions,batchPassives,batchOperations} from './card-batches.js';
const unit=(extra={})=>({kind:'unit',...extra});
const choose=(op,select,extra={})=>({op,select,...extra});
const ally=()=>unit({ally:true,anyRegion:true,canAct:true});
export const expansionDefinitions={
  ...gravecastingDefinitions,
  ...necromancyDefinitions,
  ...graveEventDefinitions,
  ...relicDefinitions,
  ...betaRulesDefinitions,
  ...betaTerrainDefinitions,
  ...betaSpellDefinitions,
  ...betaMovementDefinitions,
  ...betaSiegeDefinitions,
  ...betaCompletionDefinitions,
  ...batchDefinitions,
  ...siteDefinitions,
  ...martialDefinitions,
  ...reactionDefinitions,
  ...aquaticDefinitions,
  call_to_war:{cast:[choose('takeDeck',{kind:'deck',own:true,type:'Minion',types:['Mortal'],rarities:['Exceptional']},{optional:true}),{op:'shuffleDeck',own:true}]},
  browse:{cast:[{op:'browseTop',count:7}]},
  black_mass:{cast:[{op:'browseTop',count:7,evilMinions:true,limit:3,shuffleRest:false}]},
  searing_truth:{cast:[choose('searingTruth',{kind:'player'})]},
  peasant_revolt:{cast:[{op:'destroyRanks',ranks:['Elite','Unique']}]},
  hellfire:{cast:[{op:'hellfire'}]},
  recall:{cast:[{op:'recallAllies'}]},
  telekinesis:{cast:[choose('snatchArtifact',{kind:'artifact',nearby:true,carriable:true})]},
  shield_wall:{cast:[{op:'shieldWall'}]},
  witching_hour:{cast:[{op:'witchingHour'}]},
  trial_by_water:{cast:[choose('trialWaterChoose',unit({ally:true,anyRegion:true}))]},
  undead_ambush:{cast:[choose('ambushSkeletons',unit({enemy:true,anyRegion:true}))]},
  raze:{cast:[choose('razeSite',unit({ally:true,anyRegion:true}))]},
  detonate:{cast:[choose('detonate',{kind:'unitOrArtifact',minion:true,ownOrControl:true,anyRegion:true})]},
  fey_changeling:{genesis:[choose('returnHand',unit({minion:true,here:true}),{optional:true})]},
  gravedigger:{genesis:[choose('shiftLayer',unit({minion:true,types:['Undead'],adjacent:true}),{layer:'below'})]},
  cranky_overseer:{activated:[{label:'每回合一次：對相鄰 Ordinary 僕從造成 1 傷害並重置',once:true,steps:[choose('damageUntap',unit({minion:true,adjacent:true,rarities:['Ordinary']}),{amount:1})]}]},
  conqueror_worm:{end:[{op:'conquerSite'}]},
  court_jester:{end:[{op:'nearbyRandomDiscard'}]},
  colicky_dragonettes:{end:[{op:'projectile',amount:1}]},
  grief_larvae:{end:[{op:'damageSite',amount:1}]},
  orm_infestor:{end:[{op:'damageSite',amount:1},{op:'heal',amount:1}]},
  sir_bedivere:{start:[{op:'carryingDraw'}]},
  seelie_court:{start:[{op:'faerieDraw'}]},
  ribble_boggart:{start:[{op:'randomMutation'}]},
  sugarplum_pixies:{end:[choose('untap',unit({ally:true,other:true,nearby:true}))]},
  survivors_of_serava:{end:[{op:'safeStealth'}]},
  tooth_faeries:{start:[choose('tap',unit({enemy:true,nearby:true}))]},
  vandal_imp:{genesis:[{op:'destroyRandomArtifact'}]},
  the_ninth_legion:{death:[{op:'returnSelf'}]},
  tax_collector:{genesis:[{op:'taxNextTurn'}]},
  deep_sea_mermaids:{genesis:[{op:'drawBottomSpell'}]},
  cemetery_rats:{genesis:[{op:'mill',count:2}]},
  carrion_beetles:{genesis:[choose('banishGraves',{kind:'player'},{count:3})]},
  kingswood_poachers:{genesis:[choose('poachDeck',{kind:'player'},{count:3})]},
  highland_princess:{genesis:[choose('takeDeck',{kind:'deck',own:true,type:'Artifact',maxCost:1},{optional:true}),{op:'shuffleDeck',own:true}]},
  brother_knight:{genesis:[choose('brotherSummon',{kind:'handDeck',own:true,slug:'brother_knight'},{optional:true})]},
  cauldron_crones:{genesis:[choose('sacrificeDraw',unit({minion:true,ally:true,here:true,other:true}),{optional:true})]},
  slobbermaw:{genesis:[{op:'sacrificeOrDamage',amount:4}]},
  dreadwing:{genesis:[{op:'discardOrStrike'}]},
  crown_prince:{death:[{op:'returnIfMortal'}]},
  clamor_of_harpies:{genesis:[choose('harpyPull',unit({minion:true,weakerThanSource:true,anyRegion:true}))]},
  archangel_raphael:{genesis:[choose('raphael',{kind:'unit',avatar:true,nearby:true})]},
  slumbering_giantess:{genesis:[{op:'sleepSelf'}]},
  pollimorph:{cast:[choose('transformToken',unit({minion:true,nearby:true}),{slug:'frog'})]},
  degradation:{cast:[choose('transformToken',unit({minion:true,types:['Mortal'],anyRegion:true}),{slug:'foot_soldier'})]},
  raise_dead:{cast:[choose('resurrectRandom',{kind:'site',ally:true})]},
  carrionette:{cast:[choose('summonGrave',{kind:'grave',types:['Undead'],minion:true})]},
  return_to_nature:{cast:[{op:'returnGraves',limit:3,oneCemetery:true,draw:'spells'}]},
  pendragon_legacy:{cast:[{op:'returnGraves',own:true,unique:true,draw:'card'}]},
  mad_dash:{cast:[{op:'drawCards',count:1},choose('modify',ally(),{mod:{movement:1},duration:'turn'})]},
  kings_council:{cast:[{op:'drawCards',count:'uniqueAllies'}]},
  unlikely_alliance:{cast:[{op:'drawCards',count:'alliedRarities'}]},
  necronomiconcert:{cast:[{op:'drawCards',count:'band'}]},
  fade:{cast:[choose('fade',unit({ally:true,minion:true,anyRegion:true}))]},
  blink:{cast:[choose('blinkAlly',unit({ally:true,anyRegion:true})),{op:'drawCards',count:1}]},
  frost_nova:{cast:[{op:'damageDisable',amount:0,all:unit({enemy:true,minion:true,nearby:true})}]},
  lash:{cast:[choose('damageUntap',unit({minion:true,nearby:true}),{amount:1})]},
  trial_by_fire:{casters:'any',cast:[choose('damage',unit({minion:true,nearby:true}),{amount:3})]},
  grievous_insult:{casters:'any',cast:[choose('silenceTap',unit({minion:true,nearby:true})),{op:'draw',deck:'spells',count:1}]},
  kiss_of_death:{casterTypes:['Spirit','Undead'],cast:[choose('destroy',unit({minion:true,here:true}))]},
  smite:{casters:'any',cast:[choose('smite',unit({enemy:true,adjacent:true}))]},
  spin_attack:{cast:[choose('sourceStrikes',ally())]},
  duel:{cast:[choose('duelChoose',unit({ally:true,anyRegion:true,canAct:true,hasEnemyAdjacent:true}))]},
  feign_death:{cast:[choose('triggerDeath',unit({ally:true,minion:true,anyRegion:true}))]},
  gift_of_the_raven:{cast:[choose('modify',unit({ally:true,minion:true,anyRegion:true}),{mod:{nextStrikeHeal:true},duration:'turn'}),{op:'draw',deck:'spells',count:1}]},
  critical_strike:{cast:[choose('modify',unit({ally:true,anyRegion:true}),{mod:{nextStrikeDouble:true},duration:'turn'})]},
  deliverance:{cast:[{op:'banish',all:unit({evil:true,nearby:true})}]},
  satanic_panic:{cast:[choose('satanicPanic',unit({minion:true,notTypes:['Demon'],anyRegion:true}))]},
  bury:{cast:[choose('shiftLayer',{kind:'unitOrArtifact',minion:true,land:true},{layer:'below'})]},
  drown:{cast:[choose('shiftLayer',{kind:'unitOrArtifact',minion:true,water:true},{layer:'below'})]},
  buried_alive:{casters:'any',cast:[choose('shiftLayer',unit({minion:true,adjacent:true,land:true}),{layer:'below'})]},
  cave_in:{cast:[choose('sinkSite',{kind:'site',land:true})]},
  stormy_seas:{cast:[choose('sinkSite',{kind:'site',water:true})]},
  boil:{cast:[choose('destroySiteMinions',{kind:'site',water:true,steps:2})]},
  dredge:{cast:[choose('liftSite',{kind:'site',water:true},{skeletons:2})]},
  exhume:{cast:[choose('liftSite',{kind:'site',land:true},{skeletons:2})]},
  geyser:{cast:[choose('geyser',{kind:'site'}),{op:'drawCards',count:1}]},
};
export const expansionOperations=('drawCards modify transformToken resurrectRandom summonGrave summonGraveAt returnGraves returnGraveOne fade blinkAlly teleportChosen damageUntap silenceTap smite sourceStrikes duelChoose fightPair triggerDeath markStealth banish satanicPanic shiftLayer sinkSite destroySiteMinions liftSite geyser').split(' ');
expansionOperations.push('sleepSelf','randomMutation','safeStealth','tap','destroyRandomArtifact','taxNextTurn');
expansionOperations.push(...siteOperations);
expansionOperations.push(...martialOperations);
expansionOperations.push(...reactionOperations);
expansionOperations.push(...aquaticOperations);
expansionOperations.push(...eventOperations);
expansionOperations.push(...gravecastingOperations);
expansionOperations.push(...necromancyOperations);
expansionOperations.push(...graveEventOperations);
expansionOperations.push(...relicOperations);
expansionOperations.push(...betaRulesOperations);
expansionOperations.push(...betaTerrainOperations);
expansionOperations.push(...betaSpellOperations);
expansionOperations.push(...betaMovementOperations);
expansionOperations.push(...betaWeatherOperations);
expansionOperations.push(...betaSiegeOperations);
expansionOperations.push(...betaCompletionOperations);
expansionOperations.push(...batchOperations);
expansionOperations.push(...('browseTop browsePick browseBottom searingTruth destroyRanks hellfire recallAllies recallOne snatchArtifact shieldWall witchingHour trialWaterChoose trialWaterSink ambushSkeletons razeSite detonate detonateDamage conquerSite nearbyRandomDiscard carryingDraw faerieDraw').split(' '));
expansionOperations.push(...('drawBottomSpell banishGraves banishGraveOne poachDeck poachOne takeDeck shuffleDeck brotherSummon sacrificeDraw sacrificeOrDamage discardOrStrike returnIfMortal harpyPull strikeFixed raphael raphaelMode').split(' '));
export const expansionPassives={
  ...gravecastingPassives,
  ...necromancyPassives,
  ...graveEventPassives,
  ...relicPassives,
  ...betaRulesPassives,
  ...betaTerrainPassives,
  ...betaSpellPassives,
  ...betaMovementPassives,
  ...betaWeatherPassives,
  ...betaCompletionPassives,
  ...batchPassives,
  ...sitePassives,
  ...martialPassives,
  ...reactionPassives,
  ...aquaticPassives,
  ...eventPassives,
  fey_changeling:{castAnySite:true},
  aaj_kegon_ghost_crabs:{rowVoidPower:true},shield_maidens:{nearbyPrevent:1},
  flagellant:{healWhenHurt:1},finwife:{enemyAvatarMana:2},granary_rats:{noSiteThreshold:true},
  dwarven_digging_team:{grantNearbyKeyword:'Burrowing',grantOnSite:true,minion:true},
  rebecks:{grantNearbyKeyword:'Charge',types:['Giant']},
  the_wild_hunt:{grantNearbyKeyword:'Charge',types:['Spirit','Faerie'],other:true},
  zeppelin_of_zealots:{wardedKeywords:['Airborne']},
  the_ninth_legion:{cornerOnly:true},sewer_rats:{castAnySite:true,mustBelow:true},
  angel_ascendant:{wardedPower:1,wardedKeywords:['Airborne']},faith_incarnate:{realmWardPower:2},
  profane_revenant:{zeroUnless:'evil'},revered_revenant:{zeroUnless:'ward'},
  black_knight:{lifeDiscount:'more',discount:2},white_knight:{lifeDiscount:'less',discount:2},
  bound_spirit:{needsSpellcaster:true},castle_haunt:{castEliteSite:true,tetherSite:true},
  roaming_monster:{castAnySite:true},saracen_scout:{castClearSite:true},saracen_raiders:{castClearSite:true},
  forsaken:{outerColumn:true},weathered_trunks:{needEnemySite:true},
  sedge_crabs:{moveAxis:'horizontal'},dalcean_phalanx:{moveAxis:'forward'},
  polar_bears:{verticalWrap:true},polar_explorers:{shareVerticalWrap:true},
  failed_mutation:{magicProtected:true},tragedy_worrywart:{auraMagicDamageProtected:true},
  tufted_turtles:{preventFirstDamage:true},shellycoat:{preventDamage:1},seirawan_hydra:{healNonlethal:true},
  yourke_crossbowmen:{rangedImmune:true},crawler:{projectileOver:true},crawling_congregation:{shareProjectileOver:true},
  harassing_ruffians:{noDefend:true},sir_ironside:{enemyTurnPower:3},
  grey_wolves:{unlimited:true,nearbySamePower:true},relentless_crowd:{unlimited:true,nearbySamePower:true},
};
