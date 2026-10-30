// Explicit Beta card effects. Projectile travel shares the engine's region and
// collision rules; card-specific impact choices remain serializable.
export const betaSpellDefinitions={
  fireball:{cast:[{op:'projectile',amount:4,splash:2}]},
  ice_lance:{cast:[{op:'projectile',amount:3,piercing:true,decay:1,onePerLocation:true,optionalHit:true,range:2}]},
  incinerate:{cast:[{op:'locationDamage',amount:4,other:true,select:{kind:'location',nearCasterOrDragon:true}}]},
};
export const betaSpellPassives={scent_hounds:{permanentRevealNearby:true}};
export const betaSpellOperations=['projectileImpact'];
