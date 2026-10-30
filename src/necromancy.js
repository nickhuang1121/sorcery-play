// Explicit official card bindings. Summoning is distinct from casting.
export const necromancyPassives={
  barrow_wight:{skeletonReturnCost:2,returnToSite:true},
  bone_jumble:{skeletonReturnCost:1},
  fowl_bones:{skeletonReturnCost:1},
  zombie_bruiser:{skeletonReturnCost:4},
};
export const necromancyDefinitions={
  adept_illusionist:{activated:[{label:'橫置：從手牌、墓地或 Spellbook 檢索另一張 Adept Illusionist，召喚到附近',tap:true,steps:[{op:'searchSummon',zones:['hand','cemetery','spells'],slug:'adept_illusionist',nearby:true}]}]},
  highland_falconer:{genesis:[{op:'searchSummon',zones:['hand','spells'],types:['Beast'],keyword:'Airborne',maxCost:2,maySearch:true,searchAll:true}]},
  boneyard:{genesis:[{op:'boneyard'}]},
};
export const necromancyOperations=['searchSummon','searchSummonPick','searchSummonPlace','boneyard','boneyardPick','boneyardResolve'];
