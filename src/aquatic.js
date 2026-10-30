// Explicit bindings; dynamic connectivity and movement live in geography.js.
export const aquaticPassives={
  anui_undine:{waterBodyPower:1},lord_of_unland:{waterBodyAlliesPower:1},
  hearkening_kraken:{mustBelow:true,waterEnemyDiscount:1},tide_naiads:{floodOccupiedSite:true},
  sir_pelleas:{freeWater:true},east_west_dragon:{freeAxis:'horizontal'},
  outback_strider:{freeClearLand:true},
};
export const aquaticDefinitions={
  font_of_life:{cast:[{op:'healWaterAllies'}]},
  stinging_kelp:{genesis:[{op:'bodySiteDamage',amount:1,select:{kind:'site',inBody:true}}]},
  marine_voyage:{cast:[{op:'linkBody',water:true,untargeted:true,select:{kind:'site',water:true}}]},
  minecart_madness:{cast:[{op:'linkBody',water:false,untargeted:true,select:{kind:'site',land:true}}]},
  wrath_of_the_sea:{cast:[{op:'wrathSea',untargeted:true,select:{kind:'site',water:true}}]},
};
export const aquaticOperations=['healWaterAllies','bodySiteDamage','linkBody','wrathSea'];
