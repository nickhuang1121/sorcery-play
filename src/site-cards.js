// Explicit bindings to the local official card snapshot, without text guessing.
export const siteDefinitions={
  forgotten_tomb:{genesis:[{op:'searchDiscardTop',count:5}]},
  lookout:{genesis:[{op:'lookHand'}]},
  road_to_perdition:{genesis:[{op:'roadPower',select:{kind:'unit',evil:true,nearby:true}}]},
  mudflow:{start:[{op:'surfaceSite',select:{kind:'site',nearby:true}}]},
  thin_ice:{end:[{op:'thinIce'}]},
  annual_fair:{activated:[{label:'支付 1：本回合獲得一個元素',mana:1,steps:[{op:'temporaryAffinity'}]}]},
  floodplain:{activated:[{label:'每回合一次：淹沒相鄰地點至回合結束',once:true,steps:[{op:'floodSite',select:{kind:'site',adjacent:true}}]}]},
  autumn_river:{genesis:[{op:'peekSpell'}]},spring_river:{genesis:[{op:'peekSpell'}]},
  summer_river:{genesis:[{op:'peekSpell'}]},winter_river:{genesis:[{op:'peekSpell'}]},
  observatory:{genesis:[{op:'orderDeck',deck:'spells',count:3,destination:'top'}]},
  crossroads:{genesis:[{op:'orderDeck',deck:'atlas',count:4,destination:'bottom',move:3}]},
  kelp_cavern:{genesis:[{op:'bottomToTop',count:3}]},
  broceliande:{genesis:[{op:'broceliande'}]},
  valley_of_delight:{genesis:[{op:'permanentAffinity'}]},
  funeral_pyre:{genesis:[{op:'banishGraves',count:3,optionalCards:true,select:{kind:'player'}}]},
  postern_gate:{}, // Control is an entry replacement, not a Genesis trigger.
  quagmire:{genesis:[{op:'terrainEffect',nearby:true,keyword:'Immobile',allLayers:true}]},
  bog:{genesis:[{op:'terrainEffect',keyword:'Immobile',select:{kind:'site',nearby:true}}]},
  babbling_brook:{genesis:[{op:'terrainEffect',nearby:true,minion:true,disabled:true}]},
  silent_hills:{genesis:[{op:'terrainEffect',nearby:true,minion:true,silenced:true}]},
};
import {batchSitePassives} from './card-batches.js';
export const sitePassives={
  postern_gate:{entersOpponentControl:true},
  city_of_souls:{manaThreshold:'earth'},
  ...batchSitePassives,
  sea_of_ash:{killBelowNearby:true},
  blessed_village:{ward:true},blessed_well:{ward:true},
  avalon:{everyone:true},
  caerleon_upon_usk:{backRowOnly:true},glastonbury_tor:{backRowOnly:true},
  joyous_garde:{backRowOnly:true},tintagel:{backRowOnly:true},
  standing_stones:{minionKeywords:['Spellcaster']},vantage_hills:{rangedBonus:1},
  consecrated_ground:{evilZero:true},desecrated_ground:{evilPower:1},
  court_of_equity:{spellTax:{Elite:1,Unique:2}},mock_court:{minionTax:{Ordinary:1}},
  river_of_blood:{halveHealing:true},
};
export const siteOperations=['peekSpell','orderDeck','bottomToTop','broceliande','permanentAffinity','giveSite','terrainEffect','temporaryAffinity','floodSite','searchDiscardTop','lookHand','roadPower','roadPowerMode','surfaceSite','thinIce'];
export function inBackRow(at,controller){return Math.floor(at/5)===(controller===0?3:0);}
