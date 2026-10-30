// Explicit damage, strike, and death-trigger bindings from the official snapshot.
export const eventPassives={
  phantasmal_shade:{destroyWhenStruck:true},sawbones:{healSurvivingAllies:true},
  sir_balin:{entryLances:1,avatarStrikeBurrow:true},sir_pellinore:{entryLances:1,drawStrongestKill:true},
  stygian_archers:{killSkeleton:true},accursed_albatross:{revengeOnDeath:true},
  squirming_mass:{gainNearbyDeadPower:true},blunderbore:{giantsBanishKills:true},
  doomsday_prophet:{doubleNonStrikeNearby:true},
};
export const eventOperations=['destroyStruck','healSurvivor','balinStrike','killSkeleton','gainDeathPower','giantKill','albatrossRevenge'];
