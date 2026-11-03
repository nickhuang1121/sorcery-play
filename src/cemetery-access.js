// Zone identity and permissions are independent of card ownership. Low-level
// cemetery.js always receives PHYSICAL owners; only view reads are swapped.
import {graveEntries as physicalGraveEntries,takeGrave as physicalTakeGrave,removeGraves as physicalRemoveGraves} from './cemetery.js';
const activeSite=o=>o&&!o.silenced&&!o.disabled&&(o.controller===0||o.controller===1);
const matchingSites=(s,name,A)=>(s.board||[]).filter(o=>activeSite(o)&&A.card(o.card).slug===name);
export function cemeteryPhysicalPlayer(s,viewPlayer,A){return matchingSites(s,'mismanaged_mortuary',A).length%2?1-viewPlayer:viewPlayer;}
export function cemeteryCards(s,viewPlayer,A){return s.players[cemeteryPhysicalPlayer(s,viewPlayer,A)].cemetery;}
export function canAffectCemetery(s,actor,physicalPlayer,A){
 return !matchingSites(s,'wormelow_tump',A).some(site=>site.controller!==actor&&cemeteryPhysicalPlayer(s,site.controller,A)===physicalPlayer&&A.resources(s,site.controller).earth>=3);
}
export function zoneAccessCost(s,A){return 2*matchingSites(s,'bureau_of_occult_control',A).length;}
function scopeRecord(s,scope){const id=typeof scope==='string'?scope:scope?.id;return id?s.zoneAccessScopes?.[id]||scope:null;}
function permission(s,scope,p){const record=scopeRecord(s,scope);return record?.permissions?.[p]||(record?.player===p?record:null);}
export function zoneAccessPreviewCost(s,p,A,scope=s.zoneAccessScope){
 const entry=permission(s,scope,p);
 if(entry){if(['paid','free'].includes(entry.decision))return 0;if(entry.decision==='declined')return Infinity;}
 return zoneAccessCost(s,A);
}
export function zoneAccessAllowed(s,p,A,scope=s.zoneAccessScope){return zoneAccessPreviewCost(s,p,A,scope)===0;}
// Use spendable mana: source totals remain nonzero on the opponent's turn.
export function canPayZoneAccess(s,p,A,otherCost=0,scope=s.zoneAccessScope){const due=otherCost+zoneAccessPreviewCost(s,p,A,scope);if(!Number.isFinite(due))return false;const pool=A.resources(s,p);return pool.available>=due;}
/** One permission per player for an entire effect. The authoritative map is
 * saved under s.zoneAccessScopes[id], so already-queued continuations observe
 * later decisions even after a JSON round trip. Boneyard can involve both
 * players, each paying their separate access cost once in the shared scope. */
export function commitZoneAccess(s,p,A,{pay=true,scope=s.zoneAccessScope}={}){
 const prior=scopeRecord(s,scope),entry=permission(s,scope,p);
 if(entry&&['paid','free','declined'].includes(entry.decision))return prior;
 const amount=zoneAccessCost(s,A);
 const spendable=A.resources(s,p).available;
 if(amount&&pay&&spendable<amount)throw Error('Bureau of Occult Control：無法支付獨立區域存取費用');
 const id=prior?.id||'access'+(s.nextZoneAccess=(s.nextZoneAccess||0)+1),record={id,permissions:{...(prior?.permissions||{})}};
 record.permissions[p]={decision:!amount?'free':pay?'paid':'declined',paid:amount&&pay?amount:0};
 if(amount&&pay)s.players[p].spent+=amount;
 (s.zoneAccessScopes??={})[id]=record;return record;
}
/** Counts/look/copy use affect=false. Moving or banishing uses affect=true and
 * must have an accepted effect scope when a Bureau is active. */
export function physicalCemeteryEntries(s,physicalPlayer,A,{actor,affect=false,scope=s.zoneAccessScope}={}){
 if(affect&&(!canAffectCemetery(s,actor,physicalPlayer,A)||!zoneAccessAllowed(s,actor,A,scope)))return [];
 return physicalGraveEntries(s,physicalPlayer);
}
export function viewCemeteryEntries(s,viewPlayer,A,{actor=viewPlayer,affect=false,scope=s.zoneAccessScope}={}){
 return physicalCemeteryEntries(s,cemeteryPhysicalPlayer(s,viewPlayer,A),A,{actor,affect,scope});
}
export function canMoveGrave(s,entry,actor,A,scope=s.zoneAccessScope){
 if(!entry||!canAffectCemetery(s,actor,entry.player,A)||!zoneAccessAllowed(s,actor,A,scope))return false;
 return physicalGraveEntries(s,entry.player).some(g=>g.card===entry.card&&g.index===entry.index&&(!entry.uid||g.uid===entry.uid));
}
export function takeAccessGrave(s,entry,actor,A,scope=s.zoneAccessScope){
 if(!canMoveGrave(s,entry,actor,A,scope))return null;
 return physicalTakeGrave(s,entry.player,entry.index,entry.card,entry.uid);
}
/** Mass effects leave protected physical cemeteries untouched. Reading/counting
 * their cards remains legal and is never routed through this mutation helper. */
export function removeAccessGraves(s,physicalPlayer,predicate,actor,A,scope=s.zoneAccessScope){
 if(!canAffectCemetery(s,actor,physicalPlayer,A)||!zoneAccessAllowed(s,actor,A,scope))return [];
 return physicalRemoveGraves(s,physicalPlayer,predicate);
}

// An explicit operation manifest, not prose parsing. New operations that can
// remove cemetery/collection cards must be added here alongside effect tests.
export const graveAccessOperations=new Set(('finalKairosReturn finalStitch banishDeadHeal purgeCemeteries rescue returnHandGrave returnGraves returnGraveOne resurrectRandom summonGrave summonGraveAt boneyard boneyardPick boneyardResolve graveRecur returnDeadHand burnBook banishGraves banishGrave banishGraveOne returnDeadHand feastForCrows sarcophagusPair hyenaFeast konrulChoose konrulReturn conjureBroken gravecasting returnDeadHand copySnail fiftyGhost fiftyLady fiftyHorror fiftyHorrorPlace fiftyRegurgitate finalCatapult finalCorpseStart finalCorpseDeal finalCorpseBlast finalArchimago finalArchimagoChoose finalBritomart finalMortuary finalPallidBust finalOrpheus finalOrpheusSummon remainingReap skullSummon coinBanish').split(' '));
export const collectionAccessOperations=new Set(('festival collectionSummon finalKairosReturn collectionPermit collectionCast collectionTrade collectionDraw collectionLegion collectionDamion collectionSite collectionBless collectionDesecrate collectionTransformSite collectionElder collectionHybrid collectionTransformUnit finalImposter finalMalleus').split(' '));
export function effectsAccessZones(effects){
 const zones=new Set();
 for(const step of effects||[]){
  if(graveAccessOperations.has(step.op)||step.action?.target?.entity==='grave'||step.action?.grave!==undefined||step.zone==='cemetery'||step.zones?.includes('cemetery')||!step.readOnly&&!step.select?.readOnly&&['grave','graveOrDocument'].includes(step.select?.kind))zones.add('cemetery');
  if((collectionAccessOperations.has(step.op)||step.action?.collection!==undefined||step.op==='morphMonsterWake')&&step.zone!=='cemetery')zones.add('collection');
  for(const key of ['effects','steps'])for(const zone of effectsAccessZones(step[key]))zones.add(zone);
 }
 return [...zones];
}
/** Allocate a root effect ticket without choosing/paying yet. Continuation
 * frames carry this id; independent triggered abilities allocate another id. */
export function createZoneAccessScope(s){
 const id='access'+(s.nextZoneAccess=(s.nextZoneAccess||0)+1),record={id,permissions:{}};
 (s.zoneAccessScopes??={})[id]=record;return record;
}
export function zoneAccessDecision(s,p,scope=s.zoneAccessScope){return permission(s,scope,p)?.decision||null;}
/** Serializable pre-effect tax continuation. Root queueing can put this before
 * the complete ability's steps; refusing still allows those steps to resolve,
 * but all cemetery/collection movement is filtered by the shared ticket. */
export const zoneAccessOperations=['zoneAccessOffer'];
export function resolveZoneAccess(s,frame,A){
 if(frame.step.op!=='zoneAccessOffer')return false;
 const p=frame.step.player??frame.controller,scope=frame.step.scope??frame.zoneAccessScope;
 if(zoneAccessDecision(s,p,scope))return true;
 const amount=zoneAccessCost(s,A);
 if(!amount){commitZoneAccess(s,p,A,{scope});return true;}
 if(frame.selected===undefined){
  s.choice={player:p,title:'Bureau of Occult Control · '+amount+' 法力開放本效果的墓地／收藏區存取',options:[...(canPayZoneAccess(s,p,A,0,scope)?[{label:'支付 '+amount+' 法力',value:true}]:[]),{label:'不支付，仍結算其他效果',value:false}],frame:{...frame,step:{...frame.step,player:p,scope}}};return true;
 }
 if(typeof frame.selected!=='boolean')throw Error('Invalid Bureau access decision');
 commitZoneAccess(s,p,A,{pay:frame.selected,scope});return true;
}
