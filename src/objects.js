// Rules for the implemented equipment and area auras; functions are stateless.
import {batchAreaAuras} from './card-batches.js';
export const equipment={
  lance:{lance:true},
  amulet_of_niniane:{magicProtected:true},
  sword_and_shield:{power:2},poisonous_dagger:{keywords:['Lethal']},
  seven_league_boots:{movement:7},
  wings_of_invention:{minion:true,keywords:['Airborne'],movement:1},
  all_terrain_vestments:{minion:true,keywords:['Burrowing','Submerge','Voidwalk']},
  amethyst_core:{mana:1,threshold:'air'},ruby_core:{mana:1,threshold:'fire'},
  onyx_core:{mana:1,threshold:'earth'},aquamarine_core:{mana:1,threshold:'water'},
  hand_of_glory:{power:1,spellElement:'fire'},mandrake_jars:{power:1,spellElement:'earth'},
  sensu_of_the_fang:{power:1,spellElement:'air'},eerie_coral:{power:1,spellElement:'water'},
  fail_not_bow:{keywords:['Ranged'],range:3},
};
export const areaAuras={
  ...batchAreaAuras,
  mariners_curse:{entryCurse:true},
  thunderstorm:{turns:3,weather:'storm'},wildfire:{singleSite:true,nearbyCast:true,weather:'fire'},
  flood:{flood:true},drought:{drought:true},
  abundance:{mana:1},silence:{silence:true},summoning_sphere:{summon:true},
  crusade:{summon:true,element:'earth',power:1},jihad:{summon:true,element:'fire',power:1},
  eclipse:{summon:true,evil:true,power:1},
  entangle_terrain:{deny:['Airborne'],keywords:['Immobile'],turns:3},
};
export function area(at){const x=at%5,y=Math.floor(at/5);return x<4&&y<3?[at,at+1,at+5,at+6]:[];}
export const inside=(aura,at)=>aura.wallTo!==undefined?(aura.at===at||aura.wallTo===at):aura.singleSite?aura.at===at:area(aura.at).includes(at);
export function matches(c,definition){return (!definition.element||c[definition.element]>0)&&(!definition.evil||c.umbrellas.includes('Evil'))&&(!definition.types||definition.types.some(t=>c.subtypes.includes(t)||c.umbrellas.includes(t)));}
