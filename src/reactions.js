// Explicit event and restriction bindings from the local official snapshot.
export const reactionPassives={
  enraged_familiar:{lostLifePower:2},grand_old_boar:{chargeIfDead:'squeakers'},
  keening_banshee:{freeAfterMortalDeath:true},rowdy_boys:{untapAfterStriking:'Undead'},
  rhitta_gawr_of_snowdonia:{preventOtherUntap:true},sky_baron:{denyOthersAirborne:true},
  drowned:{mustBelow:true},entombed:{mustBelow:true},
  flaming_skull:{spellElement:'fire'},tawny:{cannotDefend:true},
  sir_morien:{projectileBarrier:true},impenetrable_copse:{projectileBarrierAll:true},
};
export const reactionDefinitions={
  sir_tristan:{activated:[{label:'每回合一次：橫置附近敵方僕從，略過下一次重置',once:true,steps:[{op:'tapSkip',select:{kind:'unit',minion:true,enemy:true,nearby:true}}]}]},
  redcap_powries:{end:[{op:'dieIfNoAttack'}]},
  frozen_horror:{activated:[{label:'失去 Stealth：使其他附近僕從失能至下回合',requiresStealth:true,steps:[{op:'damageDisable',amount:0,all:{kind:'unit',minion:true,nearby:true,other:true}}]}]},
  asmodeus:{activated:[{label:'失去 Stealth：摧毀這裡其他所有事物與地點',requiresStealth:true,steps:[{op:'destroyOthersHere'}]}]},
  gneissgnath_gnomes:{end:[{op:'burrowSelf',optional:true}]},
  vatn_draconis:{end:[{op:'submergeHere',optional:true}]},
  sir_morien:{genesis:[{op:'summon',slug:'foot_soldier',count:2}]},
};
export const reactionOperations=['tapSkip','dieIfNoAttack','destroyOthersHere','burrowSelf','submergeHere'];
