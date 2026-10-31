import {finalArchivePrintedCard} from './card-lineage.js';
import {hasAbilitySource,gainedAbilityActive} from './ability-sources.js';
import {riftTargets,mirrorRiftTargets} from './final-built-sites.js';
// Final-101 Avatar effects. Every continuation is serializable. The engine owns
// event draining and supplies the same mutation API as the other card modules.
import {bodyOfWater} from './geography.js';
import {areaAuras,inside} from './objects.js';
import {finalCanAffectGrave,finalZoneAccessCost,finalCardUmbrellas} from './final-passives.js';
import {viewCemeteryEntries,canAffectCemetery,canPayZoneAccess,commitZoneAccess,takeAccessGrave} from './cemetery-access.js';

export const finalAvatarDefinitions={
 mephistopheles:{activated:[{label:'每回合一次：從手牌召喚 Evil 僕從至相鄰地點',once:true,declare:true,steps:[{op:'finalMephistoSummon',select:{kind:'finalMephistoSummon'}}]}]},
 archimago:{activated:[{label:'放逐墓地三張 Magic：支付正常費用施放其中一張複本',declare:true,steps:[{op:'finalArchimago',select:{kind:'finalArchimagoGrave'}}]}]},
 pathfinder:{activated:[{label:'橫置：揭示 Atlas 頂牌，若能則打出並移至該處',tap:true,steps:[{op:'finalPathfinder'}]}]},
 avatar_of_fire:{activated:[{label:'橫置：本回合火地點手牌亦可作 Fireball',tap:true,steps:[{op:'finalAvatarFire'}]}]},
 avatar_of_water:{activated:[{label:'橫置：淹沒水域相鄰地點，可傳送至該處',tap:true,declare:true,steps:[{op:'finalAvatarWaterFlood',select:{kind:'finalAvatarWaterSite'}}]}]},
};
export const finalAvatarPassives={realm_eater:{finalRealmEater:true},animist:{finalAnimist:true},deathspeaker:{finalDeathspeaker:true},__animist_x:{xCost:true},magician:{finalNoAtlas:true},pathfinder:{finalPathfinder:true}};
// Contextual Evil/type consumers are integrated and audited in final-types.
finalAvatarDefinitions.persecutor={activated:[{label:'每回合一次：追蹤最近邪惡，或烙印敵人',once:true,steps:[{op:'finalAvatarHunt'}]}]};
export const experimentalAvatarDefinitions={};
finalAvatarPassives.corruptor={finalCorruptor:true};
export const experimentalAvatarPassives={};
// Official Realm-Eater FAQ verified in the expanded card page on 2026-10-30:
// each successful site strike creates one ongoing immobilizing effect.
export const finalRealmEaterDefinition={activated:[{label:'橫置：消化一個地點',tap:true,steps:[{op:'finalAvatarDigest'}]}]};
finalAvatarDefinitions.realm_eater=finalRealmEaterDefinition;
export const finalAvatarOperations=['finalMephistoSummon','finalArchimago','finalArchimagoCostChoice','finalAvatarCopyWindow','finalPathfinder','finalPathfinderPlace','finalPathfinderMove','finalAvatarBanishCopy','finalAvatarFire','finalAvatarWaterFlood','finalAvatarWaterTeleport','finalAvatarHunt','finalAvatarHuntChoose','finalAvatarEatSite','finalAvatarDigest'];
const clone=structuredClone;
const key=v=>v.at+':'+(v.layer||'surface');
const active=(s,u,A)=>!!u&&!u.dying&&!u.silenced&&!A.disabled(u);
const coord=at=>String.fromCharCode(65+at%5)+(4-Math.floor(at/5));
const assert=(condition,message)=>{if(!condition)throw Error(message);};

export function corruptorActive(s,p,A){return s.units.some(u=>u.controller===p&&gainedAbilityActive(s,u,'corruptor',A));}
// Call for all zones, not only units in the realm. Preserve the old subtype:
// "are Monsters" adds a type; it doesn't turn a Beast into a non-Beast.
export function finalCorruptorTypes(s,p,types,A){
 const result=[...types];
 if(corruptorActive(s,p,A))for(const [from,to] of [['Beast','Monster'],['Mortal','Undead'],['Angel','Demon']])if(types.includes(from))result.push(to);
 return [...new Set(result)];
}
export function finalAvatarUnitTypes(u,types){
 const result=[...types];
 if(u.finalCorruptor)for(const [from,to] of [['Beast','Monster'],['Mortal','Undead'],['Angel','Demon']])if(types.includes(from))result.push(to);
 return [...new Set(result)];
}
export function refreshFinalAvatars(s,A){
 const players=s.players.map((_,p)=>corruptorActive(s,p,A));
 for(const u of s.units){
  u.finalCorruptor=!!players[u.controller]&&!A.unmodifiable?.(u)&&!u.fiftyOnslaught;
  // Eating creates an ongoing modifier; silencing the printed ability does not
  // erase it. Onslaught / unmodifiable can temporarily prevent its application.
  if((u.finalUndigestedSites||0)>0&&!u.fiftyOnslaught&&!A.unmodifiable?.(u))u.grantedKeywords.push('Immobile');
 }
 s.finalAvatarBrands=(s.finalAvatarBrands||[]).filter(e=>e.turn===s.turn);
}
export function finalAvatarTreatsAsEvil(s,u,p,natural=false){
 if(u.finalNoEvil)return false;
 return natural||(s.finalAvatarBrands||[]).some(e=>e.player===p&&e.uid===u.uid&&e.turn===s.turn);
}
export function finalWaterSites(s,source,A){
 const wet=bodyOfWater(s,source.at,A.card);
 return s.board.flatMap((site,at)=>site&&[...wet].some(i=>A.distance(i,at)===1)?[at]:[]);
}
export function selectFinalAvatar(s,frame,filter,A){
 if(filter.kind==='finalMephistoSummon')return mephistoSummons(s,frame.source,A).map(v=>({label:A.card(v.card).name+' · '+coord(v.at),value:v}));
 if(filter.kind==='finalArchimagoGrave')return finalArchimagoGraves(s,frame.controller,A).map(g=>({label:A.card(g.card).name,value:g}));
 if(filter.kind!=='finalAvatarWaterSite')return null;
 return finalWaterSites(s,frame.source,A).map(at=>({label:A.card(s.board[at].card).name+' · '+coord(at),value:{entity:'site',at,uid:s.board[at].uid}}));
}
// An actual shortest-path search through legal one-step movements. Manhattan
// distance is wrong for Airborne, Submerge, Voidwalk, and movement barriers.
export function persecutorSteps(s,source,A){
 const first=A.locations(s,source,A.card,A.keywords,true).filter(v=>key(v)!==key(source));
 if(!first.length)return [];
 const graph=new Map(),queue=[{at:source.at,layer:source.layer||'surface'}],seen=new Set([key(source)]);
 for(let i=0;i<queue.length;i++){
  const here=queue[i],virtual={...source,at:here.at,layer:here.layer};
  const next=A.locations(s,virtual,A.card,A.keywords,true).filter(v=>key(v)!==key(here));
  graph.set(key(here),next);
  for(const v of next)if(!seen.has(key(v))){seen.add(key(v));queue.push({at:v.at,layer:v.layer});}
 }
 const evil=s.units.filter(u=>u.uid!==source.uid&&!u.dying&&(A.regionsOverlap?A.regionsOverlap(s,u,source):!A.region||A.region(s,u)===A.region(s,source))&&finalAvatarTreatsAsEvil(s,u,source.controller,A.unitUmbrellas(u).includes('Evil')));
 const goals=new Set(evil.flatMap(u=>A.occupied(u).map(at=>key({at,layer:u.layer}))));
 if(goals.has(key(source)))return [];
 // Reverse BFS measures directed movement correctly, including one-way entry.
 const distances=new Map(),frontier=[...goals].filter(v=>seen.has(v));
 for(const g of frontier)distances.set(g,0);
 for(let i=0;i<frontier.length;i++)for(const [from,neighbors] of graph)if(!distances.has(from)&&neighbors.some(v=>key(v)===frontier[i])){distances.set(from,distances.get(frontier[i])+1);frontier.push(from);}
 const minimum=distances.get(key(source));
 if(minimum===undefined)return [];
 return first.filter(v=>distances.get(key(v))===minimum-1).map(v=>({at:v.at,layer:v.layer,path:v.path}));
}
function enemyCards(s,p,A){
 return s.units.filter(u=>!u.dying&&u.controller!==null&&u.controller!==undefined&&u.controller!==p);
}
function huntOptions(s,source,A){
 return [...persecutorSteps(s,source,A).map(v=>({label:'追蹤至 '+coord(v.at)+(v.layer==='below'?'（地下）':''),value:{mode:'step',...v}})),...enemyCards(s,source.controller,A).map(u=>({label:'烙印 '+A.card(u.card).name+' · '+coord(u.at),value:{mode:'brand',uid:u.uid,at:u.at,entity:u.entity||'unit'}}))];
}
export function finalAvatarAbilityAvailable(s,source,step,A){
 if(step.op==='finalMephistoSummon')return mephistoSummons(s,source,A).length>0;
 if(step.op==='finalArchimago')return finalArchimagoGraves(s,source.controller,A).length>=3&&canPayZoneAccess(s,source.controller,A);
 if(step.op==='finalAvatarWaterFlood')return finalWaterSites(s,source,A).length>0;
 if(step.op==='finalAvatarHunt')return huntOptions(s,source,A).length>0;
 if(step.op==='finalAvatarDigest')return (source.finalUndigestedSites||0)>0;
 return true;
}
export function finalAvatarSiteStrike(s,source,at,A){
 if(gainedAbilityActive(s,source,'realm_eater',A))A.queueEffects(s,[{op:'finalAvatarEatSite',at,site:s.board[at]?.uid}],source,source.controller,source.card);
}
export function resolveFinalAvatar(s,frame,A){
 const {source,step,controller:p,selected}=frame;
 if(!finalAvatarOperations.includes(step.op))return false;
 if(step.op==='finalMephistoSummon'){
  const live=A.unit(s,source.uid);if(!live)return true;
  const picked=mephistoSummons(s,live,A).find(v=>v.hand===selected?.hand&&v.card===selected.card&&v.at===selected.at);if(!picked)return true;
  s.players[p].hand=s.players[p].hand.filter(h=>h.uid!==picked.hand);
  if(A.paySummoningTax(s,picked.card,p,p)){const summoned=A.makeUnit(s,picked.card,p,picked.at);summoned.layer='surface';A.summonedGenesis(s,summoned);}return true;
 }
 if(step.op==='finalArchimagoCostChoice'){
  if(selected===null)return true;
  const choices=finalArchimagoGraves(s,p,A),picked=choices.find(g=>sameGrave(g,selected));
  if(!picked)return true;
  const chosen=[...step.chosen,picked];assert(new Set(chosen.map(g=>g.player+':'+g.uid)).size===chosen.length,'A cemetery instance cannot pay twice');
  if(chosen.length<3){archimagoCostChoice(s,frame,step.action,chosen,A);return true;}
  A.commitAbility(s,{...step.action,archGraves:chosen},chosen[0]);return true;
 }
 if(step.op==='finalArchimago'){
  const permit=(s.finalAvatarCopies||[]).find(copy=>copy.uid===source.finalArchPermit&&copy.player===p);
  if(permit)queueFinalAvatarCopyWindow(s,permit,source,A);return true;
 }
 if(step.op==='finalAvatarCopyWindow'){
  const permit=(s.finalAvatarCopies||[]).find(copy=>copy.uid===step.permit&&copy.player===p);
  if(!permit||permit.used){if(permit)permit.active=false;return true;}
  const actions=finalAvatarCopyActions(s,permit,A);
  if(!actions.length){
   const unsupported=permit.cards.filter(id=>!A.card(id).playable);
   if(unsupported.length){permit.blockedReason='尚未實作複本效果：'+unsupported.map(id=>A.card(id).name).join('、');s.choice={player:p,manual:true,title:permit.blockedReason,options:[],frame};return true;}
   permit.active=false;return true;
  }
  if(selected===undefined){s.choice={player:p,title:permit.kind+' · 必須選擇一張合法複本施放',options:actions.map(a=>({label:copyActionLabel(s,a,A),value:a})),frame};return true;}
  const action=actions.find(a=>JSON.stringify(a)===JSON.stringify(selected));assert(action,'Copy casting permission or target is no longer legal');
  // If the normal pre-cast declaration is cancelled, this continuation returns
  // to the mandatory copy window. A committed cast consumes its permit once.
  const priorScope=s.zoneAccessScope;if(permit.scope)s.zoneAccessScope=permit.scope;
  try{A.queueEffects(s,[{op:'finalAvatarCopyWindow',permit:permit.uid}],source,p,frame.effectCard,{scope:permit.scope});A.beginCast(s,action);if(s.choice&&permit.scope)s.choice.frame.zoneAccessScope=permit.scope;}finally{s.zoneAccessScope=priorScope;}
  return true;
 }
 if(step.op==='finalPathfinder'){
  const live=A.unit(s,source.uid),id=s.players[p].atlas[0];if(!live||!id)return true;
  A.log(s,'Pathfinder 揭示 '+A.card(id).name+'。');
  const options=finalPathfinderTargets(s,live,A.card(id),A).map(at=>({label:coord(at),value:{at}}));
  if(options.length)s.choice={player:p,title:'Pathfinder · 必須打出至合法位置',options,frame:{...frame,step:{op:'finalPathfinderPlace',card:id}}};
  return true;
 }
 if(step.op==='finalPathfinderPlace'){
  const live=A.unit(s,source.uid);if(!live||s.players[p].atlas[0]!==step.card)return true;
  assert(finalPathfinderTargets(s,live,A.card(step.card),A).includes(selected?.at),'Pathfinder Site placement is no longer legal');
  A.queueEffects(s,[{op:'finalPathfinderMove',at:selected.at}],live,p,frame.effectCard);
  A.beginSiteCard(s,{type:'site',player:p,pathfinderSite:true,card:step.card,at:selected.at,siteActor:live.uid});return true;
 }
 if(step.op==='finalPathfinderMove'){
  const live=A.unit(s,source.uid);if(!live||live.at===step.at)return true;
  const destination=A.locations(s,live,A.card,A.keywords,true).find(v=>v.at===step.at&&v.layer===(live.layer||'surface'));
  // A movement restriction never rolls back the already-played Site.
  if(destination)A.queueEffects(s,[...destination.path.map((to,i)=>({op:'travelStep',from:i?destination.path[i-1]:{at:live.at,layer:live.layer||'surface'},to})),{op:'travelStop'}],live,p,frame.effectCard);
  return true;
 }
 if(step.op==='finalAvatarBanishCopy'){
  const copy=A.unit(s,step.uid);if(copy&&!copy.dying)A.kill(s,copy,true);return true;
 }
 if(step.op==='finalAvatarFire'){
  (s.finalFireballTurns||(s.finalFireballTurns={}))[p]=s.turn;return true;
 }
 if(step.op==='finalAvatarWaterFlood'){
  const live=A.unit(s,source.uid),site=s.board[selected?.at];
  if(!live||!site||selected.uid&&selected.uid!==site.uid)return true;
  // Selection is declared before tapping. Recompute at resolution: a moved or
  // replaced site never inherits a flood intended for a different card.
  if(!finalWaterSites(s,source,A).includes(selected.at))return true;
  for(const old of s.board)if(old?.effects)old.effects=old.effects.filter(e=>e.finalWaterSource!==source.uid);
  if(!site.completionProtected&&!A.passives?.[A.card(site.card).slug]?.immutableSite){
   (site.effects||(site.effects=[])).push({flood:true,stamp:s.next++,finalWaterSource:source.uid});
  }
  A.refreshContinuous(s);
  A.queueEffects(s,[{op:'finalAvatarWaterTeleport',at:selected.at,site:site.uid,optional:true}],live,p,frame.effectCard);
  return true;
 }
 if(step.op==='finalAvatarWaterTeleport'){
  if(selected===null||selected===false)return true;
  const u=A.unit(s,source.uid),site=s.board[step.at];
  if(!u||!site||site.uid!==step.site)return true;
  const to={at:step.at,layer:source.layer||'surface'};
  // Optional teleport has its own movement legality and can be declined.
  if(A.canEnterOnGround(s,u,{at:u.at,layer:u.layer||'surface'},to,A.card,A.keywords,true)){
   u.at=to.at;u.layer=to.layer;u.notRest=true;u.carryTeleport=true;
  }
  return true;
 }
 if(step.op==='finalAvatarHunt'){
  const live=A.unit(s,source.uid);if(!live)return true;
  const options=huntOptions(s,live,A);if(options.length)s.choice={player:p,title:'Persecutor · 選擇追蹤或烙印',options,frame:{...frame,step:{op:'finalAvatarHuntChoose'}}};
  return true;
 }
 if(step.op==='finalAvatarHuntChoose'){
  const u=A.unit(s,source.uid);if(!u||!selected)return true;
  if(selected.mode==='brand'){
   const target=enemyCards(s,p,A).find(v=>v.uid===selected.uid);if(!target)return true;
   // Branding changes the observer's treatment, not the branded card. Even
   // an unmodifiable enemy can be branded; its Ward and abilities remain.
   (s.finalAvatarBrands||(s.finalAvatarBrands=[])).push({uid:target.uid,player:p,turn:s.turn});
  }else if(selected.mode==='step'){
   const destination=persecutorSteps(s,u,A).find(v=>v.at===selected.at&&v.layer===selected.layer);
   assert(destination,'Persecutor 的追蹤路徑已失效');
   A.queueEffects(s,[...destination.path.map((to,i)=>({op:'travelStep',from:i?destination.path[i-1]:{at:u.at,layer:u.layer||'surface'},to})),{op:'travelStop'}],u,p,frame.effectCard);
  }
  return true;
 }
 if(step.op==='finalAvatarEatSite'){
  const u=A.unit(s,source.uid);if(!u)return true;
  if(s.board[step.at]?.uid===step.site)A.destroySite(s,step.at);
  u.finalUndigestedSites=(u.finalUndigestedSites||0)+1;
  return true;
 }
 if(step.op==='finalAvatarDigest'){
  const u=A.unit(s,source.uid);if(u)u.finalUndigestedSites=Math.max(0,(u.finalUndigestedSites||0)-1);
  return true;
 }
 return true;
}

// Alternate casting never replaces the physical card in the hand. Its stable
// hand uid plus avatarForm is a serializable, revalidated source descriptor.
function animistActive(s,p,A){return s.units.some(u=>u.controller===p&&gainedAbilityActive(s,u,'animist',A));}
function animistSpiritCard(id,x,A){
 const original=A.card(id),variable=original.cost===null&&A.passives[original.slug]?.xCost;
 const amount=variable?(x??0):original.cost||0;
 assert(Number.isInteger(amount)&&amount>=0,'Animist Spirit cost must be a nonnegative integer');
 const kind=variable?'animist_x_'+amount:'animist';
 const variant=A.runtimeCard(id,kind,{type:'Minion',category:'Spell',subtypes:['Spirit'],umbrellas:[],rules:'',keywords:[],attack:amount,defense:amount,handler:'base',playable:true,finalAnimistSpirit:true,...(variable?{slug:'__animist_x'}:{})});
 return A.card(variant);
}
export function finalAvatarCastEntries(s,p,A){
 const spirit=animistActive(s,p,A),fire=s.finalFireballTurns?.[p]===s.turn,result=[];
 for(const h of s.players[p].hand){const c=A.card(h.card);
  if(spirit&&c.type==='Magic')result.push({card:animistSpiritCard(c.id,undefined,A).id,from:{hand:h.uid,avatarForm:'spirit'}});
  if(fire&&c.type==='Site'&&(c.fire>0||c.elements?.includes('Fire')))result.push({card:A.card('fireball').id,from:{hand:h.uid,avatarForm:'fireball'}});
 }
 result.push(...deathspeakerEntries(s,p,A));
 for(const permit of s.finalAvatarCopies||[])if(permit.player===p&&permit.active&&!permit.used)for(const [copyIndex,id] of permit.cards.entries()){if(permit.kind==='Archimago'&&['valor','dodge_roll'].includes(A.card(id).slug))continue;result.push({card:id,from:{avatarCopy:permit.uid,copyIndex,card:id},ignoreThreshold:!!permit.ignoreThreshold,...(permit.caster?{onlyCaster:permit.caster}:{}),...(permit.casterLayer?{onlyCasterLayer:permit.casterLayer}:{}),...(permit.casterLocation?{onlyCasterLocations:[permit.casterLocation]}:{})});}
 return result;
}
// undefined means the normal engine should resolve this source; null means an
// alternate source descriptor is no longer authorized and must not be cast.
export function finalAvatarCastingCard(s,a,A){
 if(a.avatarCopy!==undefined){
  if(a.hand!==undefined||a.grave!==undefined||a.bound!==undefined||a.top!==undefined||a.collection!==undefined||a.avatarForm!==undefined)return null;
  const permit=(s.finalAvatarCopies||[]).find(copy=>copy.uid===a.avatarCopy&&copy.player===a.player&&copy.active&&!copy.used);
  if(!permit||permit.cards[a.copyIndex]!==a.card||permit.caster&&permit.caster!==a.caster||permit.casterLayer&&permit.casterLayer!==(a.casterLayer||'surface')||permit.casterLocation&&JSON.stringify(permit.casterLocation)!==JSON.stringify(a.casterLocation))return null;
  const copied=A.card(a.card);if(permit.kind==='Archimago'&&['valor','dodge_roll'].includes(copied.slug))return null;return copied;
 }
 if(a.deathspeaker){
  if(a.avatarForm!==undefined||a.grave===undefined||!deathspeakerActive(s,a.player,A)||s.players[a.player].finalDeathspeakerTurn===s.turn)return null;
  const q=a.graveOwner??a.player,grave=A.graveEntries(s,q).find(g=>g.index===a.grave&&g.card===a.card&&(!a.graveUid||g.uid===a.graveUid));
  if(!grave||!finalCanAffectGrave(s,a.player,q,A))return null;
  const c=A.card(grave.card);return c.type==='Minion'&&c.category==='Spell'?c:null;
 }
 if(a.avatarForm===undefined)return undefined;
 if(a.top!==undefined||a.grave!==undefined||a.bound!==undefined||a.collection!==undefined)return null;
 const h=s.players[a.player]?.hand.find(h=>h.uid===a.hand);if(!h)return null;
 const original=A.card(h.card);
 if(a.avatarForm==='spirit'&&original.type==='Magic'&&animistActive(s,a.player,A)){
  if(a.x!==undefined&&(!Number.isInteger(a.x)||a.x<0))return null;
  return animistSpiritCard(original.id,a.x,A);
 }
 if(a.avatarForm==='fireball'&&s.finalFireballTurns?.[a.player]===s.turn&&original.type==='Site'&&(original.fire>0||original.elements?.includes('Fire')))return A.card('fireball');
 return null;
}
export function finalAvatarPhysicalCard(s,a,A){
 if(a.avatarForm===undefined)return null;
 const selected=finalAvatarCastingCard(s,a,A);if(!selected)return null;
 return s.players[a.player].hand.find(h=>h.uid===a.hand)?.card||null;
}
export function ensureFinalAvatarRuntimeCards(s,A){
 // Recreate dynamic definitions before restoreGame inspects serialized units.
 // This also handles a real page reload, where byId no longer has runtime IDs.
 const ids=new Set(),seen=new WeakSet();
 const visit=value=>{if(typeof value==='string'){if(value.startsWith('runtime:animist')||value.startsWith('runtime:mephisto_avatar_'))ids.add(value);return;}if(!value||typeof value!=='object'||seen.has(value))return;seen.add(value);for(const child of Object.values(value))visit(child);};
 visit(s);
 // A source can already have left the realm while an artifact-granted ability
 // is suspended in the storyline, so inspecting only live units is insufficient.
 for(const id of ids){const match=/^runtime:animist(?:_x_(\d+))?:(.+)$/.exec(id);if(match)animistSpiritCard(match[2],match[1]===undefined?undefined:Number(match[1]),A);const mephisto=/^runtime:mephisto_avatar_(\d+):(.+)$/.exec(id);if(mephisto)mephistoAvatarCard(mephisto[2],Number(mephisto[1]),A);}
}
export function finalAvatarBasicCopyCard(id,A){
 const c=A.card(id);return c.finalAnimistSpirit?c.runtimeBase:id;
}
export function finalAvatarEntry(s,u,A){
 // A basic copy of an animated Magic has the printed Magic characteristics.
 // It cannot remain in the realm and never resolves the Magic's textbox.
 if(A.card(u.card).type==='Magic'){A.leaveUnit(s,u,'cemetery');return true;}
 return false;
}

function deathspeakerActive(s,p,A){return s.units.some(u=>u.controller===p&&gainedAbilityActive(s,u,'deathspeaker',A));}
function deathspeakerEntries(s,p,A){
 if(!deathspeakerActive(s,p,A)||s.players[p].finalDeathspeakerTurn===s.turn)return [];
 return s.players.flatMap((_,q)=>finalCanAffectGrave(s,p,q,A)?A.graveEntries(s,q).flatMap(g=>{const c=A.card(g.card);return c.type==='Minion'&&c.category==='Spell'&&c.playable?[{card:g.card,from:{grave:g.index,graveOwner:q,graveUid:g.uid,card:g.card,deathspeaker:true}}]:[];}):[]);
}
// The (0) at Death's Door changes base cost, not thresholds or extra costs.
export function finalAvatarBaseCost(s,p,c,origin){return origin?.deathspeaker&&s.players[p].doorTurn!==null?0:c.cost;}
export function finalAvatarExtraCastingCost(s,origin,A){return origin?.deathspeaker?finalZoneAccessCost(s,A):0;}
export function finalAvatarCommitGraveCopy(s,a,c,A){
 if(a.avatarCopy!==undefined){const permit=(s.finalAvatarCopies||[]).find(copy=>copy.uid===a.avatarCopy&&copy.player===a.player&&copy.active&&!copy.used);assert(permit&&permit.cards[a.copyIndex]===c.id,'Copy was already used or changed');permit.used=true;permit.copiedCard=c.id;permit.castBy=a.caster;return;}
 if(!a.deathspeaker)return;
 // Called immediately after the physical grave card was removed. The banished
 // original and the new token are independent objects with different owners.
 const owner=a.graveOwner??a.player;
 s.players[owner].banished.push(c.id);s.players[a.player].finalDeathspeakerTurn=s.turn;
}
export function finalAvatarPrepareCopyEntry(s,a,u,A){
 if(a.avatarCopy!==undefined){if(u.originalCard)u.originalCard=finalArchivePrintedCard(u.originalCard,A);u.tokenCopy=true;u.finalAvatarCopyOrigin={permit:a.avatarCopy,card:a.card,player:a.player};return;}
 if(!a.deathspeaker)return;
 if(u.originalCard)u.originalCard=finalArchivePrintedCard(u.originalCard,A);u.tokenCopy=true;u.finalDeathspeakerOrigin={player:a.graveOwner??a.player,card:a.card,graveUid:a.graveUid};
 // Queue below Genesis and any entry-trigger continuations. A save during a
 // Genesis choice preserves both the token and its later banish continuation.
 A.queueEffects(s,[{op:'finalAvatarBanishCopy',uid:u.uid}],u,a.player,u.card);
}

// Setup/deck restrictions depend on the chosen original Avatar, not on later
// silencing or a temporary mask. Keep the no-Atlas fact in saved player state.
export function finalAvatarDeckProfile(avatar){
 if(avatar?.slug==='magician')return {atlasMinimum:0,spellMinimum:60,noAtlas:true,sitesInSpellbook:true};
 if(avatar?.slug==='pathfinder')return {uniqueAtlas:true};
 return {};
}
export function finalAvatarSetupHand(s,p,avatarId,A){
 const slug=A.card(avatarId).slug,player=s.players[p];
 player.finalHasPlayedSite=false;
 if(slug==='magician'){player.finalNoAtlas=true;for(let i=0;i<7;i++)A.draw(s,p,'spells');return true;}
 if(slug==='pathfinder'){for(let i=0;i<3;i++)A.draw(s,p,'spells');return true;}
 return false;
}
export function finalAvatarDrawDecks(s,p){return s.players[p].finalNoAtlas?['spells']:['spells','atlas'];}
export function finalAvatarMulliganDeck(s,p,c){return s.players[p].finalNoAtlas?'spells':c.type==='Site'?'atlas':'spells';}
export function finalAvatarDeckZone(avatar,c){return avatar?.slug==='magician'?'spells':c.type==='Site'?'atlas':'spells';}
export function finalAvatarNormalSiteAbilities(s,p,avatarCard){if(avatarCard.vivienPhysical)return {playHand:false,drawAtlas:false};return {playHand:!['pathfinder','mephistopheles'].includes(avatarCard.slug),drawAtlas:!s.players[p].finalNoAtlas&&!['magician','pathfinder','mephistopheles'].includes(avatarCard.slug)};}
export function finalPathfinderTargets(s,source,c,A){
 if(c.type!=='Site')return [];
 const player=s.players[source.controller],firstTurn=(player.turnsTaken||0)<=1&&!player.finalHasPlayedSite;
 return s.board.flatMap((site,at)=>{
  if(firstTurn?at!==source.at:A.distance(at,source.at)!==1)return [];
  if((s.auras||[]).some(a=>!a.silenced&&!a.disabled&&areaAuras[A.card(a.card).slug]?.forbidSitePlay&&inside(a,at)))return [];
  const d=A.passives[c.slug];
  const ordinary=!site||A.card(site.card).slug==='rubble',mirage=site&&d?.fiftyMirage&&site.owner===source.controller&&site.controller===source.controller,heirloom=site&&d?.fiftyHeirloom&&['Elite','Unique'].includes(A.card(site.card).rarity);
  const babel=site&&d?.babelApex&&site.controller===source.controller&&!site.silenced&&!site.disabled&&A.passives[A.card(site.card).slug]?.babelBase;
  const rift=d?.riftValley&&riftTargets(s,A,source.controller).includes(at),mirrorRift=d?.fiftyMirror&&mirrorRiftTargets(s,A,source.controller).includes(at);
  return ordinary||mirage||heirloom||babel||rift||mirrorRift?[at]:[];
 });
}

const sameGrave=(a,b)=>a.player===b.player&&a.card===b.card&&a.index===b.index&&(!a.uid||a.uid===b.uid);
function finalArchimagoGraves(s,p,A){return viewCemeteryEntries(s,p,A).filter(g=>A.card(g.card).type==='Magic'&&canAffectCemetery(s,p,g.player,A));}
function archimagoCostChoice(s,frame,action,chosen,A){
 const p=action.player,options=finalArchimagoGraves(s,p,A).filter(g=>!chosen.some(old=>sameGrave(old,g))).map(g=>({label:A.card(g.card).name,value:g}));
 s.choice={player:p,title:'Archimago · 選擇第 '+(chosen.length+1)+' 張 Magic 費用（確認三張前可取消）',options:[...options,{label:'取消，不放逐也不支付費用',value:null}],frame:{...frame,step:{op:'finalArchimagoCostChoice',action,chosen}}};
}
export function finalArchimagoDeclare(s,a,declared,A){
 const source=A.unit(s,a.unit),ability=source&&(A.unitAbility?A.unitAbility(s,source,a):A.definitions[A.card(source.card).slug]?.activated?.[a.index]);
 if(ability?.steps[0]?.op!=='finalArchimago')return false;
 const graves=finalArchimagoGraves(s,a.player,A);
 if(a.archGraves){assert(a.archGraves.length===3&&new Set(a.archGraves.map(g=>g.player+':'+g.uid)).size===3&&a.archGraves.every(g=>graves.some(v=>sameGrave(v,g))),'Archimago requires three distinct current Magic cemetery instances');return false;}
 const first=graves.find(g=>sameGrave(g,declared));if(!first)return true;
 archimagoCostChoice(s,{source:clone(source),controller:a.player,effectCard:source.card},a,[first],A);return true;
}
export function finalArchimagoPayCost(s,a,source,A){
 const ability=A.unitAbility?A.unitAbility(s,source,a):A.definitions[A.card(source.card).slug]?.activated?.[a.index];if(ability?.steps[0]?.op!=='finalArchimago')return;
 assert(a.archGraves?.length===3,'Archimago grave costs were not declared');
 const scope=commitZoneAccess(s,a.player,A,{scope:a.zoneAccessScope||s.zoneAccessScope});a.zoneAccessScope=scope.id;s.zoneAccessScope=scope;
 const paid=[];
 for(const grave of [...a.archGraves].sort((a,b)=>b.index-a.index)){
  const removed=takeAccessGrave(s,grave,a.player,A,scope);assert(removed!==null,'Archimago grave cost changed');s.players[grave.player].banished.push(grave.card);paid.push(grave);
 }
 const permit=createFinalAvatarCopyPermit(s,a.player,a.archGraves.map(g=>g.card),source,{kind:'Archimago',scope:scope.id,originals:paid});source.finalArchPermit=permit.uid;
}
export function createFinalAvatarCopyPermit(s,p,cards,source,options={}){
 const permit={uid:'copy'+s.next++,player:p,cards:[...cards],source:source.uid,created:s.turn,active:false,used:false,kind:options.kind||'Copied spell',free:!!options.free,ignoreThreshold:!!options.ignoreThreshold,...(options.caster?{caster:options.caster}:{}),...(options.caster&&String(options.caster).startsWith('site:')?{casterLayer:options.casterLayer||source.layer||'surface'}:{}),...((options.casterLocation||source.geometryCasterLocation)?{casterLocation:clone(options.casterLocation||source.geometryCasterLocation)}:{}),...(options.scope?{scope:typeof options.scope==='string'?options.scope:options.scope.id}:{}),...(options.originals?{originals:clone(options.originals)}:{})};
 (s.finalAvatarCopies||(s.finalAvatarCopies=[])).push(permit);return permit;
}
export function queueFinalAvatarCopyWindow(s,permit,source,A){permit.active=true;const prior=s.zoneAccessScope;if(permit.scope)s.zoneAccessScope=permit.scope;try{A.queueEffects(s,[{op:'finalAvatarCopyWindow',permit:permit.uid}],source,permit.player,source.card,{scope:permit.scope});}finally{s.zoneAccessScope=prior;}}
export function finalAvatarCopyAllowsMana(s,p){return (s.finalAvatarCopies||[]).some(copy=>copy.player===p&&copy.active);}
export function finalAvatarCopyIsFree(s,origin,p=origin?.player){return !!origin?.avatarCopy&&(s.finalAvatarCopies||[]).some(copy=>copy.uid===origin.avatarCopy&&(p===undefined||copy.player===p)&&copy.active&&!copy.used&&copy.free);}
export function finalAvatarCopyActions(s,permit,A){
 const view=clone(s);view.choice=null;view.active=permit.player;view.finalCopyPreviewActive=s.finalCopyPreviewActive??s.active;view.phase='main';if(permit.scope)view.zoneAccessScope=permit.scope;
 return A.legalActions(view,permit.player).filter(a=>a.type==='cast'&&a.avatarCopy===permit.uid);
}
function copyActionLabel(s,a,A){
 const caster=A.unit(s,a.caster)||(s.artifacts||[]).find(o=>o.uid===a.caster)||(String(a.caster).startsWith('site:')?s.board[Number(a.caster.slice(5))]:null);
 const uid=typeof a.target==='string'?a.target:a.target?.uid;
 const target=uid&&(A.unit(s,uid)||(s.artifacts||[]).find(o=>o.uid===uid)||(s.auras||[]).find(o=>o.uid===uid));
 const targetLabel=target?A.card(target.card).name+' · '+coord(target.at)+' · '+((target.layer||'surface')==='below'?'地下／水下':'地表')+' · 玩家 '+((target.controller??target.owner)+1):JSON.stringify(a.target);
 const bearer=a.bearer&&A.unit(s,a.bearer),placement=A.card(a.card).type==='Artifact'?(bearer?' · 攜帶：'+A.card(bearer.card).name:' · 地點放置'):'';
 return A.card(a.card).name+' · '+(caster?A.card(caster.card).name:a.caster)+(a.target===undefined||a.target===null?'':' · '+targetLabel)+(a.at===undefined?'':' · '+coord(a.at))+placement;
}

export function finalAvatarCopyActionValid(s,action,A){
 const permit=(s.finalAvatarCopies||[]).find(copy=>copy.uid===action.avatarCopy&&copy.player===action.player&&copy.active&&!copy.used);
 if(!permit||!finalAvatarCastingCard(s,action,A))return false;
 return finalAvatarCopyActions(s,permit,A).some(candidate=>Object.entries(candidate).every(([key,value])=>key==='path'||JSON.stringify(action[key])===JSON.stringify(value)));
}

function mephistoAvatarCard(base,maxLife,A){
 assert(Number.isInteger(maxLife)&&maxLife>=0,'Mephistopheles maximum life must be a nonnegative integer');
 return A.runtimeCard(base,'mephisto_avatar_'+maxLife,{slug:A.card(base).slug,type:'Avatar',category:'Avatar',life:maxLife,playable:true,finalMephistoAvatar:true});
}
export function finalAvatarMinionCastAllowed(s,p,c,at,layer,A){
 if(!hasAbilitySource(c,'mephistopheles')||c.type!=='Minion')return true;
 const own=A.avatar(s,p);return !!own&&layer==='surface'&&(own.layer||'surface')==='surface'&&A.occupied(own).includes(at);
}
export function finalAvatarCastReplacement(s,a,c,owner,A){
 if(!hasAbilitySource(c,'mephistopheles')||c.type!=='Minion')return null;
 assert(finalAvatarMinionCastAllowed(s,a.player,c,a.at,a.layer||'surface',A),'Mephistopheles must be cast to your Avatar location');
 const old=A.avatar(s,a.player),pl=s.players[a.player],id=mephistoAvatarCard(c.id,pl.maxLife,A);
 // Create the new Avatar before removing the old one. Both changes belong to
 // one event and no state-based check can see an Avatar-less intermediate state.
 const replacement=A.makeUnit(s,id,owner,a.at);replacement.originalCard=c.vivienPhysical||c.id;replacement.finalReplacedAvatar=old.originalCard||old.card;
 A.leaveUnit(s,old,'banished');return replacement;
}
function mephistoSummons(s,source,A){
 const p=source.controller,available=A.resources(s,p).available,result=[];
 for(const h of s.players[p].hand){const c=A.cardForPlayer?A.cardForPlayer(h.card,p):A.card(h.card);if(c.type!=='Minion'||!c.playable||!finalCardUmbrellas(s,c,A).includes('Evil')||A.summoningTax(s,c)>available)continue;
  for(let at=0;at<20;at++)if(s.board[at]&&A.occupied(source).some(i=>A.distance(i,at)===1)&&A.canSummonEntry(s,p,c,at,'surface'))result.push({hand:h.uid,card:h.card,at});
 }
 return result;
}

// Pure catalog registration: runtime-hydration resolves bases first and never
// calls unit/index restoration while a dependent card is still unknown.
export function registerAvatarRuntimeCard(id,A){
 const spirit=/^runtime:animist(?:_x_(\d+))?:(.+)$/.exec(id);if(spirit){animistSpiritCard(spirit[2],spirit[1]===undefined?undefined:Number(spirit[1]),A);return true;}
 const avatar=/^runtime:mephisto_avatar_(\d+):(.+)$/.exec(id);if(avatar){mephistoAvatarCard(avatar[2],Number(avatar[1]),A);return true;}return false;
}
