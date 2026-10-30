export const betaSiegeDefinitions={
  siege_ballista:{activated:[{label:'橫置持有者與這裡另一名友軍：對兩步內目標單位造成 3 傷害',crew:true,steps:[{op:'damage',amount:3,select:{kind:'unit',regionSteps:2}}]}]},
  payload_trebuchet:{activated:[{label:'橫置持有者與這裡另一名友軍並棄一張牌：對三步內位置造成該牌法力費用的傷害',crew:true,discardPayload:true,steps:[{op:'locationDamage',select:{kind:'location',regionSteps:3,sameRegion:true}}]}]},
};
export const betaSiegeOperations=['siegeCrew','siegePayload','siegeCommit'];
