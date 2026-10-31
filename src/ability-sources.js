// Borrow printed abilities without copying the source card's characteristics.
// Registration is intentionally separate from support flags until integration
// tests cover setup, source permissions, damage provenance and expiration.
import {buildAbilityRecord,unitPrintedAbilityRecord,unitGainedKeywords} from './final-ability-layers.js';
import {collectionEntries,takeCollection} from './collection.js';
import {canPayZoneAccess,zoneAccessAllowed} from './cemetery-access.js';
export const sourceDefinitions={
 dragonlord:{activated:[{label:'每己回合一次：支付3，取得設定 Dragon 的能力',mana:3,once:true,steps:[{op:'borrowDragon'}]}]},
 imposter:{activated:[{label:'支付3：放逐收藏區 Avatar，戴上其面具',mana:3,declare:true,steps:[{op:'finalImposter',select:{kind:'borrowMask'}}]}]},
};
export const sourceOperations=['borrowDragon','finalImposter'];
export function hasAbilitySource(c,slug){return c.slug===slug||c.abilitySlugs?.includes(slug);}
export function sourceDeckErrors(d,A){
 if(A.card(d.avatar).slug!=='dragonlord')return [];
 let c;try{c=A.card(d.dragon);}catch{return ['Dragonlord 必須在組牌時設定一張 Unique Dragon'];}
 return c.type==='Minion'&&c.rarity==='Unique'&&c.subtypes.includes('Dragon')?[]:['Dragonlord 設定牌必須是 Unique Dragon'];
}
export function setupAbilitySource(s,p,d,A){if(A.card(d.avatar).slug==='dragonlord')s.players[p].setAsideDragon=d.dragon;}
export function registerBorrowedCard(base,source,A){
 const b=A.card(base),c=A.card(source),slug='__abilities_'+base+'_'+source;
 const record=buildAbilityRecord(base,[source],A);
 const conflicts=Object.entries(record.passives).filter(([,values])=>values.length>1);
 if(record.conflicts.length||conflicts.length)throw Error('Ability-source scalar integration requires explicit semantics for duplicate abilities');
 A.definitions[slug]=record.defs;A.passives[slug]=Object.fromEntries(Object.entries(record.passives).map(([key,values])=>[key,values[0].value]));
 const keywords=[...new Set([...A.printedKeywords(b),...A.printedKeywords(c)])].filter(k=>b.type!=='Avatar'||k!=='Stealth');
 const rules=[keywords.join(', '),b.rules,c.rules].join('\n\n');
 return A.runtimeCard(base,'abilities_'+encodeURIComponent(source),{slug,rules,playable:true,borrowedAbilitySource:{base,source},abilitySlugs:[...new Set([b.slug,...b.abilitySlugs||[],c.slug,...c.abilitySlugs||[]])],abilityOrigins:Object.fromEntries(Object.entries(record.passives).map(([key,values])=>[key,values[0].origin]))});
}
export function borrowAbilities(s,u,source,kind,A){
 const current=A.card(u.card),base=u.finalBorrowed?.base||current.vivienPhysical||u.card;
 if(!u.originalCard)u.originalCard=base;u.card=registerBorrowedCard(base,source,A);u.finalBorrowed={base,source,kind,turn:s.turn,stamp:s.next++};
 // Replacing a mask creates new borrowed ability instances. The Imposter's own
 // ability state and all ongoing modifiers (including undigested sites) survive.
 const ownCount=A.definitions[A.card(base).slug]?.activated?.length||0;
 if(kind==='mask'&&u.usedAbilities)for(const key of Object.keys(u.usedAbilities))if(Number(key)>=ownCount)delete u.usedAbilities[key];
}
export function releaseAbilities(u){if(!u.finalBorrowed)return;u.card=u.finalBorrowed.base;delete u.finalBorrowed;}
export function expireAbilitySources(s,p){for(const u of s.units)if(u.finalBorrowed?.kind==='dragon'&&u.controller===p)releaseAbilities(u);}
export function damagedAbilitySource(s,u,amount){if(amount>0&&u.finalBorrowed?.kind==='mask')releaseAbilities(u);}
export function restoreAbilitySources(s,A){const seen=new Set(),visit=value=>{if(typeof value==='string'){const match=/^runtime:abilities_([^:]+):(.+)$/.exec(value);if(match)registerBorrowedCard(match[2],decodeURIComponent(match[1]),A);const back=/^runtime:imposter_back:(.+)$/.exec(value);if(back)A.runtimeCard(back[1],'imposter_back',{type:'None',category:'None',playable:false});return;}if(!value||typeof value!=='object'||seen.has(value))return;seen.add(value);for(const child of Object.values(value))visit(child);};visit(s);}
function meetsDragon(s,u,A){const id=s.players[u.controller].setAsideDragon;if(!id)return false;const c=A.card(id),r=A.resources(s,u.controller);return ['air','earth','fire','water'].every(e=>(c[e]||0)<=r[e]);}
function masks(s,p,A){return collectionEntries(s,p,{type:'Avatar'},A).filter(e=>A.card(e.card).playable);}
export function sourceAbilityAvailable(s,u,step,A){if(step.op==='borrowDragon')return meetsDragon(s,u,A);if(step.op==='finalImposter')return canPayZoneAccess(s,u.controller,A,3)&&masks(s,u.controller,A).length>0;return true;}
export function selectAbilitySource(s,frame,filter,A){return filter.kind==='borrowMask'?masks(s,frame.controller,A).map(e=>({label:A.card(e.card).name,value:e})):null;}
export function resolveAbilitySource(s,frame,A){
 const {step,source,controller:p,selected}=frame,u=A.unit(s,source.uid);
 if(step.op==='completionDruidFlip'&&u?.finalBorrowed?.kind==='mask'&&A.card(u.finalBorrowed.source).slug==='druid'){
  const c=A.card('bruin');if(!s.units.some(v=>!v.dying&&v.controller===p&&A.card(v.card).slug==='bruin')&&A.canSummonEntry(s,p,c,u.at,u.layer||'surface')&&A.paySummoningTax(s,c.id,p,p)){const token=A.makeUnit(s,c.id,p,u.at);token.layer=u.layer||'surface';A.summonedGenesis(s,token);}
  u.card=A.runtimeCard(u.finalBorrowed.base,'imposter_back',{type:'None',category:'None',playable:false});delete u.finalBorrowed;return true;
 }
 if(!sourceOperations.includes(step.op))return false;if(!u)return true;
 if(step.op==='borrowDragon'){if(meetsDragon(s,u,A))borrowAbilities(s,u,s.players[p].setAsideDragon,'dragon',A);return true;}
 const e=masks(s,p,A).find(e=>e.index===selected?.index&&e.card===selected?.card&&e.external===selected?.external);if(!e||!zoneAccessAllowed(s,p,A)||!takeCollection(s,p,e,A))return true;
 s.players[p].banished.push(e.card);borrowAbilities(s,u,e.card,'mask',A);return true;
}

export function gainedAbilityActive(s,u,slug,A){
 if(!u||u.dying||A.disabled(u))return false;
 if(!u.silenced)return hasAbilitySource(A.card(u.card),slug);
 if(A.definitions&&A.passives&&A.printedKeywords)return unitPrintedAbilityRecord(s,u,A).records.some(r=>r.nature==='gained'&&r.slug===slug);
 return !!u.finalBorrowed&&hasAbilitySource(A.card(u.finalBorrowed.source),slug);
}
export function gainedKeywordsForUnit(s,u,A){
 return unitGainedKeywords(s,u,A).filter(k=>A.card(u.card).type!=='Avatar'||k!=='Stealth');
}
export function abilityMovementAdjustment(s,u,A){
 const movement=rules=>Number((rules.match(/Movement \+(\d+)/)||[])[1]||0),record=unitPrintedAbilityRecord(s,u,A);
 const desired=record.records.filter(r=>!u.silenced||r.nature==='gained').reduce((n,r)=>n+movement(r.rules),0);
 return desired-(u.silenced?0:movement(A.card(u.card).rules));
}
