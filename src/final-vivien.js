// Contextual printed-ability graph: Vivien works in every zone. Realm sources
// remain distinct physical instances; borrowed abilities are not printed again.
import {buildAbilityRecord,activePrintedSources,unitGainedKeywords} from './final-ability-layers.js';
import {passengers,dropPassenger} from './transport.js';
export const vivienPassives={vivien_the_enchantress:{finalVivien:true}};
export const experimentalVivienPassives={};
export const vivienOperations=['vivienSiteAbility'];
const clone=structuredClone;
function printedSourceCard(u,A){if(u.finalBorrowed)return A.card(u.finalBorrowed.base);const c=A.card(u.card);if(c.vivienPhysical)return A.card(c.vivienPhysical);return c.slug.startsWith('__abilities_')&&c.runtimeBase?A.card(c.runtimeBase):c;}
export function vivienPrintedSources(s,A){
 const physical=new Map();for(const u of s.units)if(!u.dying&&A.card(u.card).type==='Avatar')physical.set(u.uid,u);
 for(const p of [0,1])for(const u of A.casters(s,p,A.card('divine_healing')))if(!u.dying)physical.set(u.uid,u);
 return [...physical.values()].sort((a,b)=>String(a.uid).localeCompare(String(b.uid))).flatMap(u=>{const c=printedSourceCard(u,A);return c.slug==='vivien_the_enchantress'||c.vivienPhysical?[]:[{uid:u.uid,card:c.id,grant:'vivien'}];});
}
function annotate(value,origin,instance,nature){if(Array.isArray(value))return value.map(v=>annotate(v,origin,instance,nature));if(!value||typeof value!=='object')return value;const r=Object.fromEntries(Object.entries(value).map(([k,v])=>[k,annotate(v,origin,instance,nature)]));if(value.op)Object.assign(r,{abilityOrigin:origin,abilityInstance:instance,abilityNature:nature});return r;}
function compileRecord(base,sources,context,A){
 const record=buildAbilityRecord(base,sources.map(v=>v.card),A);record.physicalSources=clone(sources);
 for(const r of record.records){r.physicalSource=r.index?sources[r.index-1].uid:'vivien';r.instanceKey='vivien:'+r.physicalSource;
  const c=A.card(r.id);if(c.type==='Avatar'){
   // This is the same authored normal-Avatar ability exposed by the engine,
   // excluding Avatars whose card text has a different Tap ability.
   const normal=!['pathfinder','mephistopheles'].includes(c.slug),draw=c.slug!=='magician';
   if(normal)(r.definition.activated||=[]).push({label:draw?'橫置：打出或抽一張地點':'橫置：打出一張地點',tap:true,declare:true,steps:[{op:'vivienSiteAbility',draw,select:{kind:'vivienSiteAbility',draw}}]});
  }
 }
 const defs={};for(const r of record.records)for(const [key,value] of Object.entries(r.definition))if(Array.isArray(value))for(const [index,item] of value.entries()){
  const instance=r.instanceKey+':'+key+':'+index;(defs[key]||=[]).push({...annotate(item,r.id,instance,r.nature),abilityOrigin:r.id,abilityInstance:instance,abilityUseKey:instance,abilityNature:r.nature});
 }
 const passives={};for(const r of record.records)for(const [key,value] of Object.entries(r.passive))(passives[key]||=[]).push({value:clone(value),origin:r.id,instance:r.instanceKey+':passive:'+key});
 record.passives=passives;record.defs=defs;record.context=clone(context);return record;
}
function sourceSpec(s,c,p,A,{realm=true,extra=c.printedAbilityRecord?.context?.sources?.filter(v=>v.grant!=='vivien')||[],borrowed=c.borrowedAbilitySource||null,selfUid=null}={}){return {base:c.vivienPhysical||c.id,owner:p,sources:[...(realm?vivienPrintedSources(s,A).filter(v=>v.uid!==selfUid):[]),...extra],subtypes:[...c.subtypes],umbrellas:[...c.umbrellas],host:{type:c.type,category:c.category,attack:c.attack,defense:c.defense,life:c.life},borrowed};}
function registerSpec(spec,A){
 const kind='vivien_'+encodeURIComponent(JSON.stringify(spec)),slug='__'+kind,base=A.card(spec.base),record=compileRecord(spec.base,spec.sources,spec,A);
 const changes={...spec.host,slug,playable:base.playable,vivienPhysical:base.id,printedAbilityRecord:record,borrowedAbilitySource:spec.borrowed,abilitySlugs:record.abilitySlugs,rules:[record.keywords.join(', '),record.rules].join('\n\n'),subtypes:spec.subtypes,umbrellas:spec.umbrellas,finalBaseSubtypes:[...(spec.host.type!==base.type?spec.subtypes:base.subtypes)],finalBaseUmbrellas:[...(spec.host.type!==base.type?spec.umbrellas:base.umbrellas)]};
 A.definitions[slug]=record.defs;
 // Full records drive typed per-source consumers. Never overwrite two numeric
 // or conditional passives with one scalar value.
 A.passives[slug]=Object.fromEntries(Object.entries(record.passives).filter(([,v])=>v.length===1).map(([k,v])=>[k,v[0].value]));
 const id=A.runtimeCard(base.id,kind,changes);return {...A.card(id),...changes,id};
}
export function vivienPrintedRecord(s,c,p,A){const physical=c.vivienPhysical||c.id;if(A.card(physical).slug!=='vivien_the_enchantress')return null;const spec=sourceSpec(s,c,p,A);return compileRecord(spec.base,spec.sources,spec,A);}
export function vivienCardForPlayer(s,c,p,A){const physical=c.vivienPhysical||c.id;return A.card(physical).slug==='vivien_the_enchantress'?registerSpec(sourceSpec(s,c,p,A),A):c;}
export function refreshVivienUnits(s,A){
 let changed=false;
 for(const u of new Map([...s.units,...(s.artifacts||[]).filter(a=>a.finalGargoyleReturnCard)].map(u=>[u.uid,u])).values()){if(u.vivienFlipped)continue;const current=A.card(u.card);if(current.type==='Artifact')u.silenced=!!u.finalTabula||!A.unmodifiable?.(u)&&(!!u.silenced||(u.mods||[]).some(m=>m.silenced));const borrowed=u.finalBorrowed||current.borrowedAbilitySource;let base=A.card(current.vivienPhysical||borrowed?.base||(current.slug.startsWith('__abilities_')?current.runtimeBase:current.id));if(base.vivienPhysical)base=A.card(base.vivienPhysical);
  const extra=[...(borrowed?[{uid:'borrowed:'+borrowed.source,card:borrowed.source,grant:'borrowed'}]:[]),...(u.finalAbilitySources||[]).map((v,i)=>typeof v==='string'?{uid:'manual:'+i,card:v,grant:'gained'}:{uid:v.uid||'manual:'+i,card:v.card,grant:'gained'}),...activePrintedSources(s,u,A).map(v=>({uid:'artifact:'+v.artifact,card:v.card,grant:'artifact'}))];
  const fresh=buildAbilityRecord(base.id,extra.map(v=>v.card),A),activeGrant=fresh.records.some(r=>r.passive.finalVivien&&(!u.silenced||r.nature==='gained'));
  if(!current.vivienPhysical&&base.slug!=='vivien_the_enchantress'&&!activeGrant)continue;
  const printed=A.cardForPlayer?A.cardForPlayer(base.id,u.controller):base,contextual={...printed,id:base.id,vivienPhysical:base.id,...(u.finalGargoyleReturnCard?{subtypes:[...current.subtypes],umbrellas:[...current.umbrellas]}:{}),type:current.type,category:current.category,attack:current.attack,defense:current.defense,life:current.life};
  const next=registerSpec(sourceSpec(s,contextual,u.controller,A,{realm:activeGrant,extra,borrowed,selfUid:u.uid}),A).id;changed=changed||u.card!==next;u.card=next;if(current.type==='Artifact'){u.grantedKeywords=unitGainedKeywords(s,u,A);u.carryKeywords=[];}if(!u.originalCard)u.originalCard=base.id;
 }return changed;
}
export function restoreVivienCards(s,A){const seen=new Set();function visit(value){if(typeof value==='string'){const m=/^runtime:vivien_([^:]+):(.+)$/.exec(value);if(m&&m[1]!=='back')registerSpec(JSON.parse(decodeURIComponent(m[1])),A);const back=/^runtime:vivien_back:(.+)$/.exec(value);if(back)A.runtimeCard(back[1],'vivien_back',{type:'None',category:'None',rules:'',attack:null,defense:null,playable:false});return;}if(!value||typeof value!=='object'||seen.has(value))return;seen.add(value);for(const child of Object.values(value))visit(child);}visit(s);}
export function vivienPhysicalCard(c){return c.vivienPhysical||null;}
function siteOptions(s,p,step,A){const options=[];for(const h of s.players[p].hand)if(A.card(h.card).type==='Site')for(const at of A.siteTargets(s,p,A.card(h.card)))options.push({label:A.card(h.card).name+' · '+at,value:{hand:h.uid,card:h.card,at}});if(step.draw&&!s.players[p].finalNoAtlas)options.push({label:'抽 Atlas 地點',value:{draw:true}});return options;}
export function selectVivien(s,frame,filter,A){return filter.kind==='vivienSiteAbility'?siteOptions(s,frame.controller,filter,A):null;}
export function resolveVivien(s,frame,A){
 const {step,source,controller:p,selected}=frame,u=A.unit(s,source.uid);
 if(step.op==='completionTowerMagic'&&u&&A.card(u.card).vivienPhysical){if(A.resources(s,p).air>=3){u.mods.push({keyword:'Spellcaster',end:s.turn});(u.finalNextMagicGifts||=[]).push({turn:s.turn,amount:3,origin:step.abilityOrigin||frame.effectCard,instance:step.abilityInstance||null});}return true;}
 if(step.op==='completionDruidFlip'&&u&&A.card(u.card).vivienPhysical){
  if(!s.units.some(v=>!v.dying&&v.controller===p&&A.card(v.card).slug==='bruin')&&A.canSummonEntry(s,p,A.card('bruin'),u.at,u.layer||'surface')&&A.paySummoningTax(s,A.card('bruin').id,p,p)){const bruin=A.makeUnit(s,A.card('bruin').id,p,u.at);bruin.layer=u.layer||'surface';A.summonedGenesis(s,bruin);}
  for(const child of passengers(s,u))dropPassenger(child);dropPassenger(u);for(const a of s.artifacts||[])if(a.bearer===u.uid){a.bearer=null;a.at=u.at;a.layer=u.layer||'surface';}
  const original=u.originalCard||A.card(u.card).vivienPhysical;u.card=A.runtimeCard(A.card(u.card).vivienPhysical,'vivien_back',{type:'None',category:'None',rules:'',attack:null,defense:null,playable:false});u.originalCard=original;u.vivienFlipped=true;delete u.finalBorrowed;(s.inertCards||=[]).push(u);s.units=s.units.filter(v=>v.uid!==u.uid);return true;
 }
 if(step.op!=='vivienSiteAbility')return false;if(!u)return true;
 const option=siteOptions(s,p,step,A).find(o=>JSON.stringify(o.value)===JSON.stringify(selected));if(!option)return true;
 if(selected.draw)A.draw(s,p,'atlas');else A.beginSiteCard(s,{type:'site',player:p,...selected,siteActor:u.uid});return true;
}
export function destroyInertCards(s,ids,A){for(const u of [...s.inertCards||[]])if(ids.includes(u.uid)){A.sendCard(s,u.owner,u.originalCard||u.card,u.tokenCopy?'banished':'cemetery');s.inertCards=s.inertCards.filter(v=>v.uid!==u.uid);}}
export function registerVivienRuntimeCard(id,A){const m=/^runtime:vivien_([^:]+):(.+)$/.exec(id);if(!m)return false;if(m[1]==='back')A.runtimeCard(m[2],'vivien_back',{type:'None',category:'None',rules:'',attack:null,defense:null,playable:false});else registerSpec(JSON.parse(decodeURIComponent(m[1])),A);return true;}
export function vivienRuntimeDependencies(id){const m=/^runtime:vivien_([^:]+):(.+)$/.exec(id);if(!m||m[1]==='back')return [];const spec=JSON.parse(decodeURIComponent(m[1]));return [spec.base,...spec.sources.map(v=>v.card)];}
// These queries describe abilities explicitly permitted to operate from a zone.
// They do not make ordinary realm-only triggers active in hands or cemeteries.
export function offRealmPassiveEntries(c,key,A){const values=c.printedAbilityRecord?.passives?.[key];return values?values.map(v=>({...v})):A.passives[c.slug]?.[key]!==undefined?[{value:A.passives[c.slug][key],origin:c.id,instance:null}]:[];}
export function offRealmPrintedSources(c,slug,A){return c.printedAbilityRecord?c.printedAbilityRecord.records.filter(r=>A.card(r.id).slug===slug).map(r=>({origin:r.id,instance:r.instanceKey})):c.slug===slug?[{origin:c.id,instance:null}]:[];}
export function offRealmPassiveLayers(c,key,A){return c.printedAbilityRecord?c.printedAbilityRecord.records.filter(r=>r.passive?.[key]!==undefined).map(r=>({passive:r.passive,origin:r.id,instance:r.instanceKey})):A.passives[c.slug]?.[key]!==undefined?[{passive:A.passives[c.slug],origin:c.id,instance:null}]:[];}
export function offRealmCostAdjustments(s,p,c,at,A){
 const layers=key=>offRealmPassiveLayers(c,key,A),own=s.players[p].life,enemy=s.players[1-p].life;
 const water=at===undefined?0:layers('waterEnemyDiscount').reduce((n,l)=>n+s.units.filter(u=>u.controller!==p&&!u.dying&&A.occupied(u).some(cell=>A.bodyOfWater(s,at,A.card).has(cell))).length*l.passive.waterEnemyDiscount,0);
 const adjacent=at===undefined?0:layers('adjacentUnitDiscount').reduce((n,l)=>n+s.units.filter(u=>!u.dying&&A.occupied(u).some(cell=>A.distance(cell,at)<=1)).length*l.passive.adjacentUnitDiscount,0);
 const life=layers('lifeDiscount').reduce((n,l)=>n+((l.passive.lifeDiscount==='more'&&own>enemy||l.passive.lifeDiscount==='less'&&own<enemy)?l.passive.discount||0:0),0);
 return {water,adjacent,life,lifeDifference:layers('lifeDifferenceCost').some(l=>l.passive.lifeDifferenceCost),freeAfterMortalDeath:layers('freeAfterMortalDeath').some(l=>l.passive.freeAfterMortalDeath)&&(s.deathHistory||[]).some(v=>v.turn===s.turn&&v.controller===p&&A.unitTypes(v).includes('Mortal'))};
}
export function offRealmPlacementRules(c,A){return Object.fromEntries(['castCornerVoid','mustWaterSite','outerColumn','cornerOnly','needEnemySite','castAnySite','castEliteSite','castClearSite'].map(key=>[key,offRealmPassiveEntries(c,key,A).some(v=>v.value)]));}
export function registerVivienWithBorrowed(s,id,source,p,A){
 const current=A.card(id),base=A.card(current.vivienPhysical||id);if(base.slug!=='vivien_the_enchantress')return null;
 const contextual=A.cardForPlayer?A.cardForPlayer(base.id,p):base,borrowed={base:base.id,source};
 return registerSpec(sourceSpec(s,contextual,p,A,{extra:[{uid:'borrowed:'+source,card:source,grant:'borrowed'}],borrowed}),A).id;
}
