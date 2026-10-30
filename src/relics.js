export const relicDefinitions={
  ferrymans_coin:{activated:[
    {label:'放逐此硬幣：獲得 1 法力',banishSelf:true,steps:[{op:'gainMana',amount:1}]},
    {label:'放逐此硬幣：放逐任意墓地中最多 3 張牌',banishSelf:true,steps:[{op:'coinBanish'}]},
  ]},
  pile_of_skulls:{activated:[{label:'每回合一次：放逐墓地一張牌，在這裡召喚 Skeleton',once:true,steps:[{op:'skullSummon',select:{kind:'grave'}}]}]},
  belfry:{end:[{op:'untap',all:{kind:'unit',ally:true,nearby:true}}]},
};
export const relicPassives={
  angels_egg:{eachEndSiteHeal:1},devils_egg:{eachEndSiteLoss:1},
  black_obelisk:{siteStartMana:2,siteStartLoss:2},
  ether_core:{voidMana:3},horn_of_caerleon:{nearbyMinionCharge:true},
};
export const relicOperations=['commitArtifact','coinBanish','skullSummon','relicSiteEnd','obeliskStart'];
