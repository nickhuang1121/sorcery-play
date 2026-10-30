// Explicit remaining Beta bindings; batches are verified before readiness changes.
export const betaCompletionDefinitions={
  chain_lightning:{cast:[{op:'chainResolve',select:{kind:'unit',nearby:true}}]},
  maelstrom:{start:[{op:'maelstromPlan',optional:true}]},
  blaze:{cast:[{op:'modify',select:{kind:'unit',ally:true,anyRegion:true},mod:{movement:2,blaze:true},duration:'turn'}]},
  pudge_butcher:{activated:[{label:'橫置：發射鉤索，拖回命中單位並可與其戰鬥',tap:true,declare:true,steps:[{op:'projectile',hook:true}]}]},
  brobdingnag_bullfrog:{genesis:[{op:'swallow',select:{kind:'unit',minion:true,here:true,other:true}}]},
  island_leviathan:{activated:[{label:'Water 8：喚醒為 Monster，留下淹水 Rubble',threshold:{water:8},steps:[{op:'awakenLeviathan'}]}]},
  cone_of_flame:{cast:[{op:'projectile',diagramCone:true}]},
  major_explosion:{cast:[{op:'gridBlast',pattern:'major',untargeted:true,select:{kind:'location',regionSteps:2,sameRegion:true}}]},
  craterize:{cast:[{op:'gridBlast',pattern:'crater',untargeted:true,select:{kind:'site'}}]},
};
export const betaCompletionPassives={spire_lich:{towerLich:true},planar_gate:{planarGate:true},sunken_treasure:{sunkenTreasure:true},wayfaring_pilgrim:{cornerPilgrim:true},hillock_basilisk:{restBasilisk:true},king_of_the_realm:{mortalKing:true},rolling_boulder:{rollingBoulder:true},island_leviathan_monster:{leviathanAffinity:true},lucky_charm:{luckyCharm:true},mountain_giant:{oversized:true},skirmishers_of_mu:{movementShot:true}};
export const betaCompletionOperations=['chainDeclare','chainResolve','maelstromPlan','treasureCast','treasureSurface','curseEnter','travelStep','travelStop','travelFinish','blazeTrail','hookHit','dragStep','hookFight','swallow','awakenLeviathan','boulderDeclare','boulderRoll','luckyResume','commitLegacy'];
export const towerSites=new Set(['accursed_tower','dark_tower','gothic_tower','lone_tower','merlins_tower','spire','watchtower']);
betaCompletionOperations.push('gridBlast','craterDiscard','movementShot','defendFinish','riptideGiant');
