// Explicit effects needed by the official Beta preconstructed lists.
export const betaRulesDefinitions={
  sparkmage:{activated:[{label:'橫置：對附近位置另一隨機單位造成本回合施放的 Air 符號總數傷害',tap:true,declare:true,steps:[{op:'sparkDischarge',select:{kind:'location',nearby:true}}]}]},
  geomancer:{activated:[{label:'橫置：以 Atlas 頂牌替換相鄰 Rubble',tap:true,declare:true,needsAtlas:true,steps:[{op:'geomancerReplace',select:{kind:'site',rubble:true,adjacent:true}}]}]},
  flamecaller:{activated:[{label:'橫置並放逐墓地所有 Fire 僕從：發射 Fire 符號總數傷害的投射物',tap:true,declare:true,banishDeadFire:true,steps:[{op:'projectile',amount:'banishedFire'}]}]},
  waveshaper:{activated:[{label:'橫置：淹沒自身水域附近地點，橫置無 Submerge 的僕從並略過下次重置',tap:true,declare:true,steps:[{op:'waveshaperFlood',select:{kind:'site',nearBody:true}}]}]},
  quarrelsome_kobolds:{end:[{op:'strike',select:{kind:'unit',selfOrAdjacent:true}}]},
  nimbus_jinn:{activated:[{label:'棄一張法術：對這裡另一隨機單位造成 3 傷害',declare:true,discardSelectedSpell:true,steps:[{op:'nimbusDischarge',select:{kind:'hand',spells:true}}]}]},
};
export const betaRulesPassives={
  geomancer:{earthPlayRubble:true},bedrock:{immutableSite:true},cornerstone:{cornerSite:true},
  lava_salamander:{spellElement:'fire',preventFireSpellDamage:true},
  rimland_nomads:{preventDesertDamage:true},escyllion_cyclops:{noDefensiveStrike:true},
};
export const betaRulesOperations=['commitAbility','sparkDischarge','geomancerReplace','geomancerRubble','waveshaperFlood','nimbusDischarge'];
