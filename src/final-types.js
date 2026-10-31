import {abilityMinionTypes,printedMinionTypes} from './final-ability-layers.js';
import {finalCorruptorTypes,finalAvatarTreatsAsEvil} from './final-avatars.js';
import {saintOfRedemptionActive} from './final-passives.js';
const evilTypes=['Undead','Demon','Monster'];
const unique=values=>[...new Set(values)];
/** A card's current controller in realm, its owner in other zones. This never
 * changes official catalog data, ownership, or the meaning of a cemetery view. */
export function contextualCardTypes(s,c,player,A,base=c.finalBaseSubtypes||printedMinionTypes(c)){
 return player===0||player===1?finalCorruptorTypes(s,player,base,A):[...base];
}
export function contextualUnitTypes(s,u,base,A){return A.unmodifiable?.(u)||u.fiftyOnslaught?[...base]:contextualCardTypes(s,A.card(u.card),u.controller??u.owner,A,unique([...base,...abilityMinionTypes(s,u,A)]));}
export function contextualCard(s,id,player,A){
 const c=typeof id==='object'?id:A.card(id),baseTypes=c.finalBaseSubtypes||printedMinionTypes(c),baseUmbrellas=c.finalBaseUmbrellas||(c.slug==='azuridge_caravan'?(c.umbrellas||[]).filter(t=>t!=='Evil'):c.umbrellas||[]),subtypes=contextualCardTypes(s,c,player,A,baseTypes);
 const umbrellas=unique([...baseUmbrellas,...(c.type==='Minion'&&subtypes.some(t=>evilTypes.includes(t))?['Evil']:[])]);
 return {...c,finalTypePlayer:player,finalBaseSubtypes:[...baseTypes],finalBaseUmbrellas:[...baseUmbrellas],subtypes,umbrellas:c.type==='Minion'&&saintOfRedemptionActive(s,A)?umbrellas.filter(t=>t!=='Evil'):umbrellas};
}
/** No viewer means actual characteristics (e.g. Ward legality). A card effect
 * passes its source controller explicitly to apply Persecutor's private view. */
export function contextualUnitUmbrellas(s,u,base,A,viewer=null){
 const c=A.card(u.card),types=contextualUnitTypes(s,u,A.baseUnitTypes(u),A);
 let result=unique([...(c.slug==='azuridge_caravan'?base.filter(t=>t!=='Evil'):base),...(c.type==='Minion'&&types.some(t=>evilTypes.includes(t))?['Evil']:[])]);
 const redeemed=c.type==='Minion'&&saintOfRedemptionActive(s,A);
 if(redeemed)return result.filter(t=>t!=='Evil');
 if(viewer!==null&&finalAvatarTreatsAsEvil(s,{...u,finalNoEvil:false},typeof viewer==='object'?viewer.controller:viewer,result.includes('Evil')))result=unique([...result,'Evil']);
 return result;
}
export function refreshNaturalEvilWards(s,A){
 for(const u of s.units)if(u.ward&&A.card(u.card).type==='Minion'&&A.unitUmbrellas(u).includes('Evil'))u.ward=false;
}
