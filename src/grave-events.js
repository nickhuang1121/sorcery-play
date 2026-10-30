export const graveEventPassives={
  bone_rabble:{earthSiteReturn:true},scourge_zombies:{mortalLandReturn:true},
  kor_crematory:{cemeteryBanishThreshold:{element:'fire',amount:4}},
};
export const graveEventDefinitions={
  miracle_workers:{genesis:[{op:'returnDeadHand',optional:true,select:{kind:'grave',own:true,minion:true,diedThisTurn:true}}]},
  book_burners:{activated:[{label:'每回合一次：放逐領域中的 Document 或任一墓地的 Magic',once:true,steps:[{op:'burnBook',select:{kind:'graveOrDocument'}}]}]},
};
export const graveEventOperations=['graveRecur','returnDeadHand','burnBook'];
