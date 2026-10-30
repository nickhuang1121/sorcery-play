// Explicit bindings from the official card snapshot; grave casting still pays
// the ordinary costs and uses the ordinary caster and placement restrictions.
export const gravecastingPassives={
  recurring_specter:{castFromGrave:true,cannotDefend:true},
  the_hexham_haunts:{castFromGrave:true,mustBelow:true},
  ghostfire:{castFromGrave:true,banishAfterGraveCast:true},
  murder_of_crows:{castFromGrave:true,banishAfterGraveCast:true},
  myrrhs_trophy_room:{enemyUniqueGraveMana:true},
};
export const gravecastingDefinitions={
  ghostfire:{cast:[{op:'projectile',amount:1}]},
  murder_of_crows:{cast:[{op:'crowsDamage'}]},
};
export const gravecastingOperations=['crowsDamage'];
