// Explicit card bindings. Combat windows are implemented by the engine.
const lance={entryLances:1};
export const martialPassives={
  sir_galahad:{strikeHeal:true,protectFromTypes:['Demon','Spirit','Undead']},
  sirian_templar:{immuneTypes:['Demon','Spirit','Undead']},
  sling_pixies:{immunePowerAtLeast:4},
  the_faerie_queene:{protectAllyTypesFromPower:{types:['Faerie'],power:4}},
  blue_knight:lance,purple_knight:lance,verdant_knight:lance,yellow_knight:lance,
  reckless_squire:lance,weightless_squire:lance,thankless_squire:{entryLances:3},
  albespine_pikemen:{firstWhileAttacking:true},sir_gaheris:lance,
  sir_lancelot:{...lance,firstFightUntap:true},shameless_squire:lance,
  sir_priamus:{...lance,nearbyLethalImmune:true},
};
export const martialDefinitions={
  sir_gaheris:{end:[{op:'untapSelf'}]},
  shameless_squire:{genesis:[{op:'tapDrop',select:{kind:'unit',enemy:true,nearby:true}}]},
  spearmarshal:{activated:[{label:'每回合一次：獲得一支 Lance',once:true,steps:[{op:'acquireLance'}]}]},
  forge:{genesis:[{op:'payLance',amount:1,optional:true}]},
  attack_by_night:{cast:[{op:'nightAttack'}]},
};
export const martialOperations=['fightStage','combatAllocate','combatResolve','fightFinish','untapSelf','tapDrop','acquireLance','payLance','nightAttack'];
