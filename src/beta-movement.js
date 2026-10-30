// A unit's own step uses its movement abilities, unlike a push/pull/drag.
export const betaMovementPassives={kite_archer:{stepAfterRanged:true}};
export const betaMovementDefinitions={
  guile_sirens:{start:[{op:'lureStep',select:{kind:'unit',minion:true,enemy:true,nearby:true}}]},
  diluvian_kraken:{activated:[{label:'橫置：上浮並對附近每個其他單位出手',tap:true,steps:[{op:'krakenSurface'}]}]},
};
export const betaMovementOperations=['lureStep','unitStep','krakenSurface','krakenStrike'];
