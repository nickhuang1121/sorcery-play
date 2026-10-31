// Initialize aggregate definitions before this public entry's consumers.
import './cards.js';
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
const localAreaAuras={
  mortal_soil:{mortalSoil:true},
  mariners_curse:{entryCurse:true},
  thunderstorm:{turns:3,weather:'storm'},wildfire:{singleSite:true,nearbyCast:true,weather:'fire'},
  flood:{flood:true},drought:{drought:true},
  abundance:{mana:1},silence:{silence:true},summoning_sphere:{summon:true},
  crusade:{summon:true,element:'earth',power:1},jihad:{summon:true,element:'fire',power:1},
  eclipse:{summon:true,evil:true,power:1},
  entangle_terrain:{deny:['Airborne'],keywords:['Immobile'],turns:3},
};
// Batch definitions depend on spatial functions from this module. Delay reading
// that imported binding until after ESM initialization, preserving the complete
// object API and local overrides without an import-order dependency.
export const areaAuras=new Proxy(localAreaAuras,{
  get:(target,key)=>Object.hasOwn(target,key)?target[key]:batchAreaAuras[key],
  has:(target,key)=>Object.hasOwn(target,key)||Object.hasOwn(batchAreaAuras,key),
  ownKeys:target=>[...new Set([...Reflect.ownKeys(batchAreaAuras),...Reflect.ownKeys(target)])],
  getOwnPropertyDescriptor:(target,key)=>Reflect.getOwnPropertyDescriptor(target,key)||(Object.hasOwn(batchAreaAuras,key)?{value:batchAreaAuras[key],enumerable:true,writable:true,configurable:true}:undefined),
});
export function area(at,wrapped=false){const x=at%5,y=Math.floor(at/5);if(!Number.isInteger(at)||at<0||at>=20)return [];return wrapped?[at,y*5+(x+1)%5,((y+1)%4)*5+x,((y+1)%4)*5+(x+1)%5]:x<4&&y<3?[at,at+1,at+5,at+6]:[];}
export function auraCells(aura,wrapped=aura.geometryWrap||false){if(aura.wallTo!==undefined)return [aura.at,aura.wallTo];if(aura.singleSite)return [aura.at];if(aura.geometryRetainedCells)return [...new Set(aura.geometryRetainedCells.filter(at=>Number.isInteger(at)&&at>=0&&at<20))];return area(aura.at,wrapped);}
export const inside=(aura,at,wrapped=aura.geometryWrap||false)=>auraCells(aura,wrapped).includes(at);
export function matches(c,definition,umbrellas=c.umbrellas){return (!definition.element||c[definition.element]>0)&&(!definition.evil||umbrellas.includes('Evil'))&&(!definition.types||definition.types.some(t=>c.subtypes.includes(t)||umbrellas.includes(t)));}
