import {entryHasIndependentCasterPermission} from './caster-permissions.js';
import {combatTriggers,combatHas,combatViews,combatSteps} from './final-borrowed-combat.js';
import {finalArchivePrintedCard,archivePhysicalCard,registerArchiveRuntimeCard} from './card-lineage.js';
// Explicit continuations for the final card batch. No DOM, closures or random
// choices are stored in a saved game. Cards without implemented rules stay out
// of this registry; see docs/final-units.md for the remaining blockers.
import {finalGraveEntries,finalZoneAccessCost,finalCanAffectGrave} from './final-passives.js';
import {viewCemeteryEntries,canAffectCemetery,canPayZoneAccess,commitZoneAccess,zoneAccessAllowed,zoneAccessPreviewCost} from './cemetery-access.js';
import {finalReplacementChoice} from './final-damage.js';
import {geometryCasterLocations} from './final-geometry.js';
import {registerBorrowedCard,hasAbilitySource} from './ability-sources.js';
import {animateArtifact} from './artifact-animation.js';
import {sphereAt} from './borders.js';
export const finalUnitDefinitions = {
  kairos_the_archivist:{genesis:[{op:'finalKairosArchive'}],death:[{op:'finalKairosReturn'}]},
  grosse_poltergeist:{activated:[{label:'橫置：控制並動畫附近神器',tap:true,declare:true,steps:[{op:'finalGrosseAnimate',select:{kind:'artifact',nearby:true,untargeted:true},untargeted:true}]}]},
  monastery_gargoyle: {start:[{op:'finalGargoyleMode'}],end:[{op:'finalGargoyleMode'}]},
  __final_gargoyle_monument: {start:[{op:'finalGargoyleMode'}],end:[{op:'finalGargoyleMode'}]},
  tringh_constrictor: {activated:[{label:'橫置：可走一步，再纏住此處僕從',tap:true,declare:true,steps:[{op:'finalConstrictPlan',select:{kind:'finalConstrictPlan'},untargeted:true}]}]},
  crave_golem:{start:[{op:'finalCraveStart'}]},
  stitched_abomination:{genesis:[{op:'finalStitch',picks:[]}]},
  the_inquisition:{genesis:[{op:'finalInquisitionReveal'}]},
};
export const finalUnitPassives = {
  // Carrying is implemented by the existing transport graph. A single captive
  // is disabled while carried and can escape if moved away independently.
  tringh_constrictor:{carryUnits:{capacity:1,minion:true,disable:true}},
  mimic:{finalMimicEntry:true},
  grigori_rasputin:{cemeteryAllyCast:true},
  the_inquisition:{finalInquisitionExposure:true},
  jack_the_ripper:{finalCastToMortal:true},
  crave_golem:{everyStart:true},
  dame_britomart:{finalBritomart:true,entryLances:1},
  giant_shark:{finalShark:true},
  captain_baldassare:{finalCaptain:true},
  sea_raider:{finalSeaRaider:true},
  gnarled_wendigo:{finalUnitExtraCost:'wendigo'},
  i_am_colossus:{finalUnitExtraCost:'colossus'},
  karkemish_chimera:{finalChimera:true},
};
export const finalUnitOperations = ['finalKairosDeathOrder','finalKairosArchive','finalKairosReturn','finalRasputinConfirm','finalRasputinCost','finalGrosseAnimate','finalStitch','finalGargoyleMode','finalMimicEntry','finalConstrictPlan','finalConstrictStep','finalConstrictPick','finalCraveStart','finalCraveStep','finalBritomart','finalSharkHunt','finalSharkStep','finalSharkFight','finalPlunder','finalJackKill','finalUnitCostPick','finalInquisitionOffer','finalInquisitionReveal','finalInquisitionBanish'];
export const finalUnitCards = ['monastery_gargoyle','mimic','tringh_constrictor','jack_the_ripper','crave_golem','dame_britomart','giant_shark','captain_baldassare','sea_raider','gnarled_wendigo','i_am_colossus','karkemish_chimera','the_inquisition','stitched_abomination','grosse_poltergeist','grigori_rasputin','kairos_the_archivist'];
const layer = u => u.layer || 'surface';
const here = (a,b,A,s) => (A.regionsOverlap?A.regionsOverlap(s,a,b):layer(a)===layer(b)) && A.occupied(a).some(at=>A.occupied(b).includes(at));
const live = (s,uid,A) => A.unit(s,uid) || (s.artifacts||[]).find(a=>a.uid===uid);
const clone = x => structuredClone(x);

export function finalUnitOrderDeathEffects(effects){
 if(!effects.some(e=>e.op==='finalKairosReturn')||!effects.some(e=>e.op==='finalKairosArchive'))return effects;
 const first=effects.findIndex(e=>['finalKairosReturn','finalKairosArchive'].includes(e.op));return effects.flatMap((effect,i)=>i===first?[{op:'finalKairosDeathOrder'}]:['finalKairosReturn','finalKairosArchive'].includes(effect.op)?[]:[effect]);
}
export function finalStitchedPower(u){return u.finalStitchedParts?u.finalStitchedParts.reduce((n,part)=>n+part.power,0):null;}
export function clearFinalStitchedDamage(u){for(const part of u.finalStitchedParts||[])part.damage=0;}
export function healFinalStitchedDamage(s,u,n,p,A){
  if(!u.finalStitchedParts)return false;
  const parts=u.finalStitchedParts;let remaining=Math.min(n,parts.reduce((sum,part)=>sum+part.damage,0));
  for(let i=0;i<parts.length;i++){
    const rest=parts.slice(i+1).reduce((sum,part)=>sum+part.damage,0),min=Math.max(0,remaining-rest),max=Math.min(parts[i].damage,remaining);
    const amount=min===max?min:finalReplacementChoice(s,'stitched-heal:'+u.uid+':'+parts[i].uid+':'+remaining,p,Array.from({length:max-min+1},(_,j)=>({label:A.card(parts[i].card).name+'：移除 '+(min+j)+' 傷害',value:min+j})),'Stitched Abomination · 分配治療',u);
    parts[i].damage-=amount;remaining-=amount;
  }
  u.damage=parts.reduce((sum,part)=>sum+part.damage,0);return true;
}
export function absorbFinalStitchedDamage(s,u,n,lethal,source,A){
  if(!u.finalStitchedParts?.length)return false;
  if(lethal&&!u.lethalImmune){u.lethal=true;u.damage+=n;return true;}
  const parts=u.finalStitchedParts,p=source?.controller??s.eventContext?.controller??s.active;let remaining=n;
  const assigned=[];
  for(let i=0;i<parts.length;i++){
    const part=parts[i];let amount=remaining;
    if(i<parts.length-1&&remaining>0)amount=finalReplacementChoice(s,'stitched:'+u.uid+':'+part.uid+':'+remaining,p,Array.from({length:remaining+1},(_,value)=>({label:A.card(part.card).name+'：'+value+' 傷害',value})),'Stitched Abomination · 分配剩餘 '+remaining+' 傷害',u);
    assigned.push(amount);remaining-=amount;
  }
  for(let i=0;i<parts.length;i++)parts[i].damage+=assigned[i];
  u.finalStitchedParts=parts.filter(part=>part.damage<part.power);
  u.damage=u.finalStitchedParts.reduce((n,part)=>n+part.damage,0);
  if(!u.finalStitchedParts.length)u.lethal=true;
  return true;
}
function stitchCandidates(s,p,A){return [0,1].flatMap(owner=>viewCemeteryEntries(s,owner,A,{actor:p,affect:true})).filter(g=>A.card(g.card).type==='Minion');}
const isInquisition=(s,id,p,A)=>!!id&&cardPassiveSources(contextualCard(s,id,p,A),'finalInquisitionExposure',A).length>0;
function insertExposureAfterEffect(s,record,frame,A){
  if(record.queued)return;record.queued=true;
  const source={uid:record.id,card:record.card,owner:record.player,controller:record.player,at:A.avatar(s,record.player)?.at??0,mods:[]};
  const stack=s.storyline||(s.storyline=[]),index=frame?stack.findIndex(f=>f.source.uid===frame.source.uid&&f.effectCard===frame.effectCard):-1,before=stack.length;
  A.queueEffects(s,[{op:'finalInquisitionOffer',exposure:record.id}],source,record.player,record.card);
  // Revealing/searching completes first, including all of its continuations.
  // In particular Feast can remove this card before its trigger is offered,
  // and Dhol can return its uncast revealed pool to the bottom of the book.
  const added=stack.splice(before);stack.splice(index<0?before:index,0,...added);
}
function exposeInquisitionHand(s,p,h,frame,A){
  if(!h||!isInquisition(s,h.card,p,A))return null;
  const key=p+':'+h.uid,pending=s.finalInquisitionHandPending||(s.finalInquisitionHandPending={});
  if(pending[key]&&s.finalInquisitionExposures?.[pending[key]])return pending[key];
  const id='inquisition-exposure'+(s.nextInquisitionExposure=(s.nextInquisitionExposure||0)+1),record={id,zone:'hand',player:p,uid:h.uid,card:h.card,offered:0,accepted:0,count:1};
  (s.finalInquisitionExposures||(s.finalInquisitionExposures={}))[id]=record;pending[key]=id;insertExposureAfterEffect(s,record,frame,A);return id;
}
function exposeInquisitionBook(s,p,indices,frame,A){
  const exposed=indices.filter(i=>isInquisition(s,s.players[p].spells[i],p,A));if(!exposed.length)return null;
  const cardIds=[...new Set(exposed.map(i=>s.players[p].spells[i]))];if(cardIds.length>1){let first=null;for(const cardId of cardIds){const id=exposeInquisitionBook(s,p,exposed.filter(i=>s.players[p].spells[i]===cardId),frame,A);if(!first)first=id;}return first;}
  const prior=(frame?.step.finalInquisitionBatches||[]).map(id=>s.finalInquisitionExposures?.[id]).find(r=>r?.player===p&&r.zone==='spells'&&r.card===s.players[p].spells[exposed[0]]);
  if(prior)return prior.id;
  const id='inquisition-exposure'+(s.nextInquisitionExposure=(s.nextInquisitionExposure||0)+1),record={id,zone:'spells',player:p,card:s.players[p].spells[exposed[0]],indices:exposed,count:exposed.length,removed:0,offered:0,accepted:0,sourceUid:frame?.source.uid,effectCard:frame?.effectCard};
  (s.finalInquisitionExposures||(s.finalInquisitionExposures={}))[id]=record;
  if(frame)(frame.step.finalInquisitionBatches||(frame.step.finalInquisitionBatches=[])).push(id);
  insertExposureAfterEffect(s,record,frame,A);return id;
}
// Called only by effectAPI.select while an actual search resolves. The normal
// selectEffects() preview remains pure and cannot expose a hidden library.
export function noteFinalInquisitionSearch(s,frame,filter,A){
  if(!['deck','handDeck'].includes(filter.kind))return;
  const p=frame.controller;
  for(let owner=0;owner<2;owner++)if(owner!==p&&(filter.player===undefined||filter.player===owner)&&(!filter.own||owner===p)){
    const n=Math.min(s.players[owner].spells.length,A.searchLimit(s,p,A));exposeInquisitionBook(s,owner,Array.from({length:n},(_,i)=>i),frame,A);
    if(filter.kind==='handDeck')for(const h of s.players[owner].hand)exposeInquisitionHand(s,owner,h,frame,A);
  }
}
// Explicit reveal/search event manifest, not a prose/console-log parser.
export function beforeFinalInquisitionEffect(s,frame,A){
  const {step,controller:p,selected}=frame;
  if(['lookHand','accusation','finalInquisitionReveal'].includes(step.op))for(const h of s.players[1-p].hand)exposeInquisitionHand(s,1-p,h,frame,A);
  if(step.op==='feastForCrows')noteFinalInquisitionSearch(s,frame,{kind:'handDeck',player:1-p},A);
  const revealCount=step.op==='revealSummonTop'?1:step.op==='summonTopFive'?5:step.op==='goldenDawn'?s.board.filter((site,at)=>site&&Math.floor(at/5)===(p===0?3:0)).length:step.op==='howlBeyond'?s.board.filter((site,at)=>!site&&(at%5===0||at%5===4)).length:step.op==='finalDholTap'&&selected===null?(step.picks||[]).length:0;
  if(revealCount){const owner=step.opponent?1-p:p;exposeInquisitionBook(s,owner,Array.from({length:Math.min(revealCount,s.players[owner].spells.length)},(_,i)=>i),frame,A);}
}
export function afterFinalInquisitionEffect(s,frame,before,A){
  const {step,selected}=frame;
  for(const id of step.finalInquisitionBatches||[]){
    const r=s.finalInquisitionExposures?.[id];if(!r||r.zone!=='spells')continue;
    if(step.op==='feastForCrows'&&selected===A.card(r.card).name)r.removed=r.count;
    else if(selected?.entity==='deck'&&selected.player===r.player&&selected.card===r.card&&r.indices.includes(selected.index)){
      const oldCount=before.players[r.player].spells.filter(id=>id===r.card).length,newCount=s.players[r.player].spells.filter(id=>id===r.card).length;
      if(newCount<oldCount)r.removed=Math.min(r.count,r.removed+oldCount-newCount);
    }
    else if(['summonTopFive','goldenDawn','howlBeyond'].includes(step.op)){
      const removed=before.players[r.player].spells.filter(id=>id===r.card).length-s.players[r.player].spells.filter(id=>id===r.card).length;
      if(removed>0)r.removed=Math.min(r.count,r.removed+removed);
    }
  }
  if(step.op==='finalDholCast'&&isInquisition(s,step.pool?.[selected?.index],frame.controller,A)||step.op==='summonRevealedTop'&&isInquisition(s,step.card,step.owner,A)&&before.players[step.owner].spells.filter(id=>id===step.card).length>s.players[step.owner].spells.filter(id=>id===step.card).length){
    for(const r of Object.values(s.finalInquisitionExposures||{}))if(r.zone==='spells'&&r.sourceUid===frame.source.uid&&r.effectCard===frame.effectCard)r.removed=Math.min(r.count,r.removed+1);
  }
  if(['takeDeck','searingTruth','manuscriptDraw','finalContractSearch'].includes(step.op))for(let p=0;p<2;p++){
    const old=new Set(before.players[p].hand.map(h=>h.uid));for(const h of s.players[p].hand)if(!old.has(h.uid))exposeInquisitionHand(s,p,h,frame,A);
  }
}
export function clearFinalInquisitionTop(s,p){if(s.finalInquisitionTopSeen)delete s.finalInquisitionTopSeen[p];}
export function observeFinalInquisition(s,A){
  if(s.winner!==null)return;
  const seen=s.finalInquisitionHandSeen||(s.finalInquisitionHandSeen={}),current=new Set();
  for(let p=0;p<2;p++)if(A.handIsRevealed(s,p))for(const h of s.players[p].hand)if(isInquisition(s,h.card,p,A)){
    const key=p+':'+h.uid;current.add(key);if(!seen[key]){seen[key]=true;exposeInquisitionHand(s,p,h,null,A);}
  }
  for(const key of Object.keys(seen))if(!current.has(key))delete seen[key];
  const top=s.finalInquisitionTopSeen||(s.finalInquisitionTopSeen={});
  for(let p=0;p<2;p++){
    const access=A.topSpellAccess(s,p),id=access.publicTop&&access.cards[p];
    if(isInquisition(s,id,p,A)){if(top[p]!==id){top[p]=id;exposeInquisitionBook(s,p,[0],null,A);}}else delete top[p];
  }
}
function finishInquisitionExposure(s,r){
  if(r.zone==='hand'&&s.finalInquisitionHandPending)delete s.finalInquisitionHandPending[r.player+':'+r.uid];
  delete s.finalInquisitionExposures[r.id];
}

// Multi-attack is ONE move-and-attack action and ONE simultaneous combat. The
// native combat allocator divides the Chimera's power among these defenders.
export function finalUnitAttackActions(s,p,actions,A){
  const groups=new Map();
  for(const a of actions){
    const u=a.type==='attack'&&A.unit(s,a.unit);
    if(!u||!combatHas(s,u,'finalChimera',A)||!A.unit(s,a.target))continue;
    const key=u.uid+':'+a.at+':'+(a.layer||'surface')+':'+JSON.stringify(a.path||[]);
    if(!groups.has(key))groups.set(key,[]);const group=groups.get(key);if(!group.some(v=>v.target===a.target))group.push(a);
  }
  for(const group of groups.values())for(const count of [2,3]){
    function choose(from,picks){
      if(picks.length===count){actions.push({...picks[0],targets:picks.map(a=>a.target),chimera:true,chimeraSources:combatViews(s,A.unit(s,picks[0].unit),A,'finalChimera').map(l=>({origin:l.origin,instance:l.instance,nature:l.nature}))});return;}
      for(let i=from;i<=group.length-(count-picks.length);i++)choose(i+1,[...picks,group[i]]);
    }
    choose(0,[]);
  }
  return actions;
}
export function finalChimeraAttackTargets(s,u,a,A){
  if(!a.chimera||!combatHas(s,u,'finalChimera',A))return null;
  if(!Array.isArray(a.targets)||a.targets.length<2||a.targets.length>3||new Set(a.targets).size!==a.targets.length)throw Error('Chimera 必須同時宣告二或三個不同單位');
  return a.targets.filter(uid=>{
    const v=A.unit(s,uid);if(!v||v.dying||v.controller===u.controller||!here(u,v,A,s)||A.protectedAttackUnit(s,v)||v.stealth&&!u.canSeeStealth)return false;
    return !A.keywords(v).includes('Airborne')||A.keywords(u).includes('Airborne')||layer(u)==='below'||!s.board[u.at];
  });
}
export function finalChimeraPrepareCombat(s,pending,A){
  if(!pending.targets)return true;
  const attacker=A.unit(s,pending.attacker);
  const stillHere=uid=>{const u=A.unit(s,uid);return u&&!u.dying&&attacker&&here(attacker,u,A,s);};
  pending.defenders=pending.defenders.filter(stillHere);
  const remaining=pending.targets.filter(stillHere);
  if(remaining.length)pending.target=remaining[0];
  return remaining.length>0;
}
export function finalChimeraDefendActions(s,pending,action,A){
  if(!pending.targets)return [action];
  // A unit already being attacked cannot itself use Defend, even if another
  // declared target is the unit it would like to protect.
  if(pending.targets.includes(action.unit))return [];
  const attacker=A.unit(s,pending.attacker);
  return pending.targets.filter(uid=>{const u=A.unit(s,uid);return u&&!u.dying&&attacker&&here(attacker,u,A,s)&&!sphereAt(s,u,A.card);}).map(protect=>({...action,protect}));
}

function cardPassiveSources(c,key,A){
 const entries=c?.printedAbilityRecord?.passives?.[key];
 if(entries)return entries.filter(e=>e.value).map(e=>({...e,nature:c.printedAbilityRecord.records.find(r=>r.id===e.origin)?.nature||'printed'}));
 const value=c&&A.passives[c.slug]?.[key];return value?[{value,origin:c.id,instance:'0:passive:'+key,nature:'printed'}]:[];
}
const contextualCard=(s,id,p,A)=>A.cardForPlayer?.(id,p)||A.card(id);
const extraCostAbilities=(c,A)=>cardPassiveSources(c,'finalUnitExtraCost',A).filter(l=>['wendigo','colossus'].includes(l.value)).map(l=>({mode:l.value,origin:l.origin,instance:l.instance,nature:l.nature}));
const extraCostMode=(c,A)=>extraCostAbilities(c,A).length>0;
const sameCostAbility=(a,b)=>a?.origin===b?.origin&&a?.instance===b?.instance&&a?.mode===b?.mode;

const costKey=e=>e.zone+':'+e.player+':'+e.uid;
export function finalUnitExtraCostCandidates(s,p,c,at,birthLayer,origin,A){
  return extraCostAbilities(c,A).flatMap(costAbility=>{
  const mode=costAbility.mode;
  const realm=s.units.filter(u=>!u.dying&&u.controller===p&&A.card(u.card).type==='Minion'&&(mode!=='wendigo'||layer(u)===birthLayer&&A.occupied(u).includes(at))&&(mode!=='colossus'||!combatHas(s,u,'unkillable',A))).map(u=>({zone:'realm',player:u.owner,uid:u.uid,card:u.card,costAbility}));
  if(mode==='wendigo')return realm;
  const hand=s.players[p].hand.filter(h=>h.uid!==origin?.hand&&A.card(h.card).type==='Minion').map(h=>({zone:'hand',player:p,uid:h.uid,card:h.card,costAbility}));
  const graves=viewCemeteryEntries(s,p,A,{actor:p,affect:false}).filter(g=>canAffectCemetery(s,p,g.player,A)&&g.uid&&A.card(g.card).type==='Minion'&&!(origin?.grave!==undefined&&(origin.graveOwner??p)===g.player&&origin.graveUid===g.uid)).map(g=>({zone:'grave',player:g.player,uid:g.uid,card:g.card,costAbility}));
  return [...realm,...hand,...graves];
  });
}
function selectedUnitCosts(s,p,c,at,birthLayer,origin,A){
  const candidates=finalUnitExtraCostCandidates(s,p,c,at,birthLayer,origin,A),picks=origin?.unitCosts||[],keys=picks.map(costKey);
  if(new Set(keys).size!==keys.length||!picks.every(e=>candidates.some(c=>costKey(c)===costKey(e)&&c.card===e.card&&sameCostAbility(c.costAbility,e.costAbility))))throw Error('額外施放費用中的僕從已失效');
  return picks;
}
// Preview uses the maximum possible reduction so a player short of printed
// mana can still open the declaration dialog. Commit always uses only the
// exact declared, revalidated physical objects. No cards move during preview.
export function finalUnitCastingDiscount(s,p,c,at,birthLayer,origin,A){
  if(!extraCostMode(c,A))return 0;
  const reduction=e=>e.costAbility.mode==='wendigo'?2:1;
  if(origin?.unitCostsDeclared)return selectedUnitCosts(s,p,c,at,birthLayer,origin,A).reduce((sum,e)=>sum+reduction(e),0);
  const best=new Map();for(const e of finalUnitExtraCostCandidates(s,p,c,at,birthLayer,origin,A))best.set(costKey(e),Math.max(best.get(costKey(e))||0,reduction(e)));
  return [...best.values()].reduce((a,b)=>a+b,0);
}
// Preview separate zone-access payments as well as the reduced spell cost.
// Taking all free-to-access donors is always at least as affordable as a
// subset; a cemetery's independent access fee means its zero/all alternatives
// must both be considered. This is at most four plans for the two cemeteries,
// rather than enumerating every subset of a large hand or graveyard.
export function finalUnitCanPayWithExtraCosts(s,p,c,at,caster,payment,extraMana,birthLayer,origin,A){
  if(!extraCostMode(c,A)||origin?.unitCostsDeclared)return undefined;
  const all=finalUnitExtraCostCandidates(s,p,c,at,birthLayer,origin,A),best=new Map();for(const e of all){const old=best.get(costKey(e));if(!old||e.costAbility.mode==='wendigo')best.set(costKey(e),e);}const candidates=[...best.values()],plain=candidates.filter(e=>e.zone!=='grave'),groups=[...new Set(candidates.filter(e=>e.zone==='grave').map(e=>e.player))].map(q=>candidates.filter(e=>e.zone==='grave'&&e.player===q));
  let plans=[plain];for(const group of groups)plans=[...plans,...plans.map(plan=>[...plan,...group])];plans.unshift([]);
  for(const picks of plans){
    const declared={...origin,unitCostsDeclared:true,unitCosts:picks};
    if(!A.canPaySpell(s,p,c,at,caster,payment,extraMana,birthLayer,declared))continue;
    const fee=A.castingCost(s,p,c,at,caster,payment,extraMana,birthLayer,declared),manaCost=s.players[p].bloodManaTurn===s.turn?A.summoningTax(s,c):fee;
    if(!picks.some(e=>e.zone==='grave')||canPayZoneAccess(s,p,A,manaCost,origin?.zoneAccessScope||s.zoneAccessScope))return true;
  }
  return false;
}
export function beforeFinalUnitExtraCostChoice(s,a,A){
  const c=A.castingCard(s,a);if(!extraCostMode(c,A)||a.unitCostsDeclared)return false;
  const source=A.spellcaster(s,a.caster,a.casterLayer,a.casterLocation);
  A.queueEffects(s,[{op:'finalUnitCostPick',action:clone(a),picks:[]}],source,a.player,c.id);return true;
}
// Bureau/zone-access payment is intentionally left to the unified engine access
// scope; this hook only moves the already-declared cost objects, once, after all
// payments have been validated. Return an updated grave index for the spell's
// own source if other corpses were removed earlier in the same physical zone.
export function commitFinalUnitExtraCosts(s,a,A){
  const c=A.castingCard(s,a);if(!extraCostMode(c,A))return a;
  if(!a.unitCostsDeclared)throw Error('必須先宣告額外施放費用');
  const picks=selectedUnitCosts(s,a.player,c,a.at,a.layer||'surface',a,A);
  for(const e of picks){
    if(e.zone==='realm'){
      const u=A.unit(s,e.uid);if(e.costAbility.mode==='wendigo')A.kill(s,u,false,true,true);else A.kill(s,u,true);
    }else if(e.zone==='hand'){
      s.players[e.player].hand=s.players[e.player].hand.filter(h=>h.uid!==e.uid);A.sendCard(s,e.player,e.card,'banished');
    }else{
      if(!zoneAccessAllowed(s,a.player,A,a.zoneAccessScope||s.zoneAccessScope))throw Error('放逐墓地費用需要先取得區域存取權限');
      const g=A.graveEntries(s,e.player).find(g=>g.uid===e.uid&&g.card===e.card);if(!g)throw Error('放逐費用的墓地訪問已失效');
      A.takeGrave(s,g.player,g.index,g.card,g.uid);A.sendCard(s,g.player,g.card,'banished');
    }
  }
  if(a.grave!==undefined&&a.graveUid){
    const source=A.graveEntries(s,a.graveOwner??a.player).find(g=>g.uid===a.graveUid&&g.card===a.card);
    if(!source)throw Error('施放來源被錯誤地用作額外費用');return {...a,grave:source.index};
  }
  return a;
}

export function finalUnitAttackTriggers(s,u,pending,A){
  return combatTriggers(s,u,'finalCaptain',A,()=>[{op:'finalPlunder',player:pending.player,count:3}]);
}
export function finalUnitAttackKillTriggers(s,killer,victim,event,A){
  if(event?.attack!==killer.uid||killer.controller===victim.controller)return [];
  // The killing unit can also be dying: this trigger is captured in the same
  // event window as Deathrites and does not require the Raider to survive.
  return combatTriggers(s,killer,'finalSeaRaider',A,()=>[{op:'finalPlunder',player:victim.controller,count:1}]);
}
function plunderPermission(s,a,A){
  const permission=(s.finalPlunder||[]).find(e=>e.uid===a.plunder&&e.player===a.player&&e.turn===s.turn&&!e.used);
  if(!permission||permission.physicalPlayer!==(a.graveOwner??a.player)||permission.card!==a.card||permission.graveUid!==a.graveUid||!finalCanAffectGrave(s,a.player,permission.physicalPlayer,A))return null;
  const g=A.graveEntries(s,permission.physicalPlayer).find(g=>g.uid===permission.graveUid&&g.card===permission.card&&g.index===a.grave);
  return g?permission:null;
}
function rasputinPrintedCard(u,A){let id=u.card;const seen=new Set();while(!seen.has(id)){seen.add(id);const c=A.card(id),base=c.vivienPhysical||(/^runtime:abilities_/.test(id)?c.runtimeBase:null);if(!base)break;id=base;}return id;}
function rasputinCombinedCard(s,base,donor,p,A){const vivien=A.registerVivienWithBorrowed?.(s,base,donor,p);if(vivien)return vivien;return A.card(base).slug===A.card(donor).slug&&A.card(donor).slug==='grigori_rasputin'?base:registerBorrowedCard(base,donor,A);}
function rasputinAlly(s,p,descriptor,A){
 const u=A.unit(s,descriptor?.uid);return u&&!u.dying&&A.card(u.card).type==='Minion'&&u.controller===p&&u.card===descriptor.card&&(!descriptor.printed||descriptor.printed===rasputinPrintedCard(u,A))&&A.unitUmbrellas(u,s,p).includes('Evil')&&!combatHas(s,u,'unkillable',A)&&A.occupied(u).includes(descriptor.at)&&layer(u)===descriptor.layer?u:null;
}
export function finalRasputinCastEntries(s,p,A){
 const allies=s.units.filter(u=>!u.dying&&A.card(u.card).type==='Minion'&&u.controller===p&&A.unitUmbrellas(u,s,p).includes('Evil')&&!combatHas(s,u,'unkillable',A)),result=[];
 for(const g of viewCemeteryEntries(s,p,A,{actor:p,affect:false}).filter(g=>cardPassiveSources(contextualCard(s,g.card,p,A),'cemeteryAllyCast',A).length&&contextualCard(s,g.card,p,A).playable&&canAffectCemetery(s,p,g.player,A)))for(const ally of allies)for(const at of A.occupied(ally)){
  const rasputin={uid:ally.uid,card:ally.card,printed:rasputinPrintedCard(ally,A),at,layer:layer(ally)},entryCard=rasputinCombinedCard(s,g.card,rasputinPrintedCard(ally,A),p,A);
  result.push({card:g.card,entryCard,forceAt:at,forceLayer:layer(ally),from:{grave:g.index,graveOwner:g.player,graveUid:g.uid,card:g.card,rasputin}});
 }
 return result;
}
export function finalRasputinCastingCard(s,a,A){
 if(!a.rasputin)return undefined;
 const g=viewCemeteryEntries(s,a.player,A,{actor:a.player,affect:false}).find(g=>g.player===(a.graveOwner??a.player)&&g.uid===a.graveUid&&g.card===a.card&&g.index===a.grave);
 return g&&cardPassiveSources(contextualCard(s,g.card,a.player,A),'cemeteryAllyCast',A).length&&contextualCard(s,g.card,a.player,A).playable&&canAffectCemetery(s,a.player,g.player,A)&&rasputinAlly(s,a.player,a.rasputin,A)?contextualCard(s,g.card,a.player,A):null;
}
export function beforeFinalRasputinConfirm(s,a,declared,A){
 if(!a.rasputin||a.rasputinConfirmed)return false;
 const c=finalRasputinCastingCard(s,a,A);if(!c)throw Error('Rasputin 的墓地權限或放逐盟友已失效');
 const donor=A.unit(s,a.rasputin.uid),caster=A.spellcaster(s,a.caster,a.casterLayer,a.casterLocation);
 s.choice={player:a.player,title:'Grigori Rasputin · 確認代價：放逐 '+A.card(donor.card).name+'，施放至 '+a.at+' / '+(a.layer||'surface'),options:[{label:'確認並支付施放費用',value:true},{label:'取消（不支付費用／不放逐）',value:null}],frame:{source:clone(caster),controller:a.player,effectCard:c.id,step:{op:'finalRasputinConfirm',action:a,declared}}};return true;
}
export function finalRasputinSummonCard(s,a,c,A){return a.rasputin?rasputinCombinedCard(s,c.vivienPhysical||c.id,a.rasputin.printed||a.rasputin.card,a.player,A):c.id;}
export function finalUnitCastEntries(s,p,A){
  const result=finalRasputinCastEntries(s,p,A);
  for(const e of s.finalPlunder||[]){
    if(e.player!==p||e.turn!==s.turn||e.used||!finalCanAffectGrave(s,p,e.physicalPlayer,A))continue;
    const g=A.graveEntries(s,e.physicalPlayer).find(g=>g.uid===e.graveUid&&g.card===e.card),c=g&&A.card(g.card);
    if(g&&c.playable&&c.category==='Spell')result.push({card:c.id,ignoreThreshold:true,from:{grave:g.index,graveOwner:g.player,graveUid:g.uid,card:g.card,plunder:e.uid}});
  }
  return result;
}
// Match the castingCard extension convention: undefined = not ours, null =
// stale/unauthorized source. Never validate by card ID alone: repeated copies
// and cemetery revisits have distinct stable grave UIDs.
export function finalUnitPlunderCastingCard(s,a,A){
  if(!a.plunder)return undefined;
  const e=plunderPermission(s,a,A);return e?contextualCard(s,e.card,a.player,A):null;
}
export function finalUnitPlunderExtraCost(s,origin,A){return origin?.plunder?finalZoneAccessCost(s,A):0;}
// Call at commit after choices/payment, immediately before removing the grave
// card. Opening/cancelling a target dialog never consumes this permission.
export function finalUnitCommitPlunder(s,a,A){
  if(!a.plunder)return;
  const e=plunderPermission(s,a,A);if(!e)throw Error('掠奪施法權限已失效');e.used=true;
}

const nodeKey=n=>n.at+':'+layer(n)+':'+!!n.gateVoidwalk;
function stepDestinations(s,u,A){return A.locations(s,u,A.card,A.keywords,true).filter(v=>v.path.length===1);}

// Targets and the intended optional step are declared together before paying
// the tap cost. `untargeted` on the continuation is only engine plumbing: Ward
// is explicitly checked after the declared movement, not before it.
export function finalConstrictPlans(s,frame,A){
  const snake=A.unit(s,frame.source.uid);if(!snake||snake.dying||A.disabled(snake))return [];
  const destinations=[{at:snake.at,layer:layer(snake)},...stepDestinations(s,snake,A)];
  return destinations.flatMap(to=>s.units.filter(u=>u.uid!==snake.uid&&!u.dying&&A.card(u.card).type==='Minion'&&!u.carriedBy&&!A.unmodifiable(u)&&here({...snake,...to},u,A,s)&&A.canTarget(s,frame.controller,u,snake)).map(u=>({label:A.card(u.card).name+' · '+(to.at===snake.at&&to.layer===layer(snake)?'留在原處':'先移至 '+to.at+' / '+to.layer),value:{entity:'unit',uid:u.uid,to:{at:to.at,layer:to.layer}}})));
}

// Breadth-first traversal of actual legal single-step edges. This respects
// layers, forbidden entries, voids, wrapping, links, leap abilities and size.
// Every equally short predecessor is kept so the controller can choose a path.
export function finalUnitShortestRoutes(s,u,isGoal,A) {
  const start={at:u.at,layer:layer(u),gateVoidwalk:!!u.gateVoidwalk},key=nodeKey(start),nodes=new Map([[key,{...start,n:0,parents:[]}]]),queue=[key];
  let best=Infinity;const goals=[];
  for(let i=0;i<queue.length;i++){
    const k=queue[i],node=nodes.get(k);if(node.n>best)break;
    if(isGoal({...u,...node})){best=node.n;goals.push(k);continue;}
    if(node.n>=best)continue;
    for(const to of stepDestinations(s,{...u,...node},A)){
      const nk=nodeKey(to),prior=nodes.get(nk);
      if(!prior){nodes.set(nk,{at:to.at,layer:to.layer,gateVoidwalk:!!to.gateVoidwalk,n:node.n+1,parents:[k]});queue.push(nk);}
      else if(prior.n===node.n+1&&!prior.parents.includes(k))prior.parents.push(k);
    }
  }
  const memo=new Map([[key,[[]]]]);
  function routesTo(k){if(memo.has(k))return memo.get(k);const node=nodes.get(k),end={at:node.at,layer:node.layer,gateVoidwalk:node.gateVoidwalk},paths=node.parents.flatMap(parent=>routesTo(parent).map(path=>[...path,end]));memo.set(k,paths);return paths;}
  return {distance:best,routes:goals.flatMap(k=>routesTo(k))};
}

function craveCanAttack(s,u,v,A){
  if(v.uid===u.uid||v.dying||A.card(v.card).type!=='Minion'||!here(u,v,A,s)||A.protectedAttackUnit(s,v)||v.stealth&&!u.canSeeStealth)return false;
  if(v.controller!==u.controller&&!A.peaceAllowsAttack(s,u.controller,v.controller))return false;
  return !A.keywords(v).includes('Airborne')||A.keywords(u).includes('Airborne')||layer(u)==='below'||!s.board[u.at];
}
function craveAttacks(s,u,A){
  const motion=A.locations(s,u,A.card,A.keywords),targets=[];
  for(const v of s.units){const to=motion.find(node=>craveCanAttack(s,{...u,...node},v,A));if(to)targets.push({victim:v,to});}
  return targets;
}
function queueCraveAttack(s,u,target,A){
  const path=target.to.path,route=[{at:u.at,layer:layer(u)},...path],action={type:'attack',player:u.controller,unit:u.uid,target:target.victim.uid,at:target.to.at,layer:target.to.layer,defendingPlayer:target.victim.controller};
  u.notRest=true;u.inBasicTravel=true;u.shotDuringMove=false;u.spatialShotsUsed={};
  A.queueEffects(s,[...(path.length?[{op:'movementShot'}]:[]),...path.flatMap((to,i)=>[{op:'travelStep',from:route[i],to},{op:'movementShot'}]),{op:'travelStop'},{op:'travelFinish',action}],u,u.controller);
}

function britomartGraves(s,u,A){
  const access=zoneAccessPreviewCost(s,u.controller,A);
  return finalGraveEntries(s,u.controller,A).filter(g=>{const c=A.card(g.card);return c.type==='Minion'&&c.playable&&c.subtypes.includes('Mortal')&&A.canSummonEntry(s,u.controller,c,u.at,layer(u))&&A.resources(s,u.controller).available>=access+A.summoningTax(s,c);});
}
// Call only after an enemy-site attack has no remaining defenders, immediately
// before its site-damage event. Return true to suspend that damage for a choice.
export function finalUnitSiteAttackBeforeDamage(s,u,at,pending,A){
  const layers=combatViews(s,u,A,'finalBritomart');
  if(pending.britomartDecided||!layers.length||!britomartGraves(s,u,A).length)return false;
  const offers=layers.map(l=>combatSteps(l,[{op:'finalBritomart',at,siteUid:s.board[at]?.uid,pending:{...clone(pending),afterAttack:[],britomartDecided:true}}])[0]);
  A.queueEffects(s,[{...offers[0],remainingOffers:offers.slice(1)}],u,u.controller);
  return true;
}

// Return triggers to the engine's existing eventTrigger ordering, rather than
// executing movement inside its observation loop. A layer change at one site
// explicitly does not trigger Shark; entry and movement to another site do.
export function finalSharkTriggers(s,u,old,newEntry,A){
  if(u.dying||!newEntry&&(!old||old.at===u.at))return [];
  return s.units.filter(shark=>shark.uid!==u.uid&&!shark.dying&&A.occupied(u).some(at=>A.bodyOfWater(s,shark.at,A.card).has(at))).flatMap(shark=>combatTriggers(s,shark,'finalShark',A,()=>[{op:'finalSharkHunt',uid:shark.uid,target:u.uid}]));
}

// Preserve the original zone/caster permissions from castEntries. Do not infer
// these actions from an already-generated ordinary cast: Jack remains castable
// to a Mortal when the player controls no site at all.
export function finalUnitCastActions(s,p,result,castEntries,A) {
  const r=A.resources(s,p),elements=['air','earth','fire','water'];
  for(const entry of castEntries){
    const c=contextualCard(s,entry.card,p,A),jackSources=cardPassiveSources(c,'finalCastToMortal',A);if(!jackSources.length||!c.playable)continue;
    const independent=entryHasIndependentCasterPermission(s,entry),casters=entry.onlyCaster?[A.spellcaster(s,entry.onlyCaster,entry.onlyCasterLayer||'surface')].filter(Boolean).flatMap(u=>geometryCasterLocations(s,u)).filter(u=>u.controller===p&&!u.dying&&!A.disabled(u)&&(!u.silenced||entry.allowSilencedCaster||independent||A.card(u.card).type==='Avatar'||A.keywords(u).includes('Spellcaster'))):A.casters(s,p,c);
    for(const caster of casters){
      if(!A.casterPermissionAllows(s,caster,c,{independent}))continue;
      for(const victim of s.units){
        if(victim.dying||!A.unitTypes(victim).includes('Mortal'))continue;
        const at=victim.at,where=layer(victim),site=s.board[at],sp=site&&A.sitePassives[A.card(site.card).slug];
        if(entry.forceAt!==undefined&&entry.forceAt!==at||entry.forceLayer&&entry.forceLayer!==where||!A.casterPlacementAllowed(s,caster,c,at))continue;
        const freeThreshold=sp&&(c.subtypes.includes(sp.ignoreThresholdType)||sp.ignoreThresholdTypes?.some(t=>[...c.subtypes,...c.umbrellas].includes(t)));
        if(!entry.ignoreThreshold&&!freeThreshold&&!A.ignoresThreshold(s,caster,c)&&elements.some(e=>(c[e]||0)>r[e]))continue;
        if(!A.canSummonEntry(s,p,c,at,where)||!A.canPaySpell(s,p,c,at,caster,undefined,0,where,entry.from))continue;
        result.push({type:'cast',player:p,...entry.from,caster:caster.uid,...(caster.geometryCasterLocation?{casterLocation:{...caster.geometryCasterLocation},casterLayer:caster.layer||'surface'}:{}),at,...(where==='below'?{layer:where}:{}),...(A.card(caster.card).type==='Site'&&caster.layer==='below'?{casterLayer:'below'}:{}),jackVictim:victim.uid,jackSources:jackSources.map(l=>({origin:l.origin,instance:l.instance,nature:l.nature}))});
      }
    }
  }
  return result;
}

// Validate the special cast before entry. The actual silence/kill is already
// on the Storyline when Jack enters, but resolves AFTER entry and state-based
// deaths: the official FAQ says a disabled, drowned or banished Jack cannot
// complete his task. Silence alone does not remove the queued cast ability.
export function beforeFinalUnitCast(s,c,a,A) {
  if(!a.jackVictim)return;
  if(!cardPassiveSources(c,'finalCastToMortal',A).length)throw Error('特殊 Mortal 施放能力已失效');
  const victim=A.unit(s,a.jackVictim);
  if(!victim||victim.dying||!A.unitTypes(victim).includes('Mortal')||victim.at!==a.at||layer(victim)!==(a.layer||'surface'))throw Error('Jack the Ripper 的 Mortal 目的地已失效');
}
export function finalUnitPrepareCastEntry(s,u,c,a,A){
  if(a.rasputin){u.originalCard=a.card||c.vivienPhysical||c.id;u.finalRasputinPower=A.card(a.rasputin.printed||a.rasputin.card).attack||0;u.mods.push({power:u.finalRasputinPower});A.queueEffects(s,[{op:'finalRasputinCost',uid:a.rasputin.uid,card:a.rasputin.card,printed:a.rasputin.printed||a.rasputin.card}],u,a.player,u.card);}

  if(a.jackVictim&&cardPassiveSources(c,'finalCastToMortal',A).length)A.queueEffects(s,[{op:'finalJackKill',uid:u.uid,target:a.jackVictim,...Object.fromEntries([['abilityOrigin',a.jackSources?.[0]?.origin||c.id],['abilityInstance',a.jackSources?.[0]?.instance||'0:passive:finalCastToMortal']])}],u,a.player,c.id);
}

// Call after cards.install() has populated byId. Registering the deterministic
// runtime ID at installation also makes a Monument save reload in a new tab.
export function prepareFinalUnitCards(A) {
  return A.runtimeCard(A.card('monastery_gargoyle').id,'final_gargoyle_monument',{
    type:'Artifact',subtypes:['Monument'],attack:0,defense:0,
  });
}

export function deferFinalUnitEntry(s,u,A) {
  if(!hasAbilitySource(A.card(u.card),'mimic')||u.finalMimicEntryDone)return false;
  u.finalMimicEntryDone=true;
  s.units=s.units.filter(v=>v.uid!==u.uid);
  A.queueEffects(s,[{op:'finalMimicEntry',uid:u.uid,object:clone(u)}],u,u.controller);
  return true;
}

export function refreshFinalUnits(s,A) {
  for(const a of s.artifacts||[])if(a.finalGargoyleDamageTurn<s.turn){a.damage=0;a.lethal=false;delete a.finalGargoyleDamageTurn;}
  for(const u of s.units){
    if(u.finalGargoyleAirborne&&(!u.silenced||u.finalGargoyleAbility?.nature==='gained')&&!A.disabled(u))u.grantedKeywords.push('Airborne');
    if(u.finalConstrictedBy){
      const snake=A.unit(s,u.finalConstrictedBy);
      if(!snake||snake.dying||snake.finalConstricting!==u.uid||u.carriedBy!==snake.uid||!here(snake,u,A,s)){
        if(snake?.finalConstricting===u.uid)delete snake.finalConstricting;
        delete u.finalConstrictedBy;
      }
    }
  }
}

// Returns true when untapping has been replaced. This must run before any
// assignment of tapped=false. A captive killed this way still has Deathrites.
export function beforeFinalUnitUntap(s,u,A) {
  if(!u?.tapped||!u.finalConstrictPending||A.disabled(u))return false;
  delete u.finalConstrictPending;
  const captive=A.unit(s,u.finalConstricting);
  if(!captive||captive.dying||captive.carriedBy!==u.uid||!here(u,captive,A,s))return false;
  A.kill(s,captive);
  return true;
}

export function resolveFinalUnits(s,frame,A) {
  const {step,source,controller:p,selected}=frame;
  if(!finalUnitOperations.includes(step.op))return false;
  const choose=(title,options)=>{s.choice={player:p,title,options,frame};};
  const queue=steps=>A.queueEffects(s,steps.map(next=>({...((step.abilityOrigin||frame.abilityOrigin)?{abilityOrigin:step.abilityOrigin||frame.abilityOrigin}:{}),...(step.abilityInstance?{abilityInstance:step.abilityInstance}:{}),...(step.abilityNature?{abilityNature:step.abilityNature}:{}),...next})),source,p,frame.effectCard);
  if(step.op==='finalKairosDeathOrder'){
    if(selected===undefined){choose('Kairos · The Geistwood：選擇同時觸發順序',[{label:'先回復舊 archive 並放逐 Kairos',value:'return'},{label:'先建立最新 archive，再回復與放逐',value:'archive'}]);return true;}
    queue((selected==='archive'?['finalKairosArchive','finalKairosReturn']:['finalKairosReturn','finalKairosArchive']).map(op=>({op})));return true;
  }
  if(step.op==='finalKairosArchive'){const id=source.originalCard||source.card,physical=A.card(id).finalPhysicalUid;if(!A.unit(s,source.uid)&&s.players.some(pl=>pl.banished.some(cardId=>physical?A.card(cardId).finalPhysicalUid===physical:cardId===id)))return true;createFinalKairosArchive(s,A);return true;}
  if(step.op==='finalKairosReturn'){
    returnFinalKairosArchive(s,A,p);delete s.finalVindictiveObservation;
    const kairos=A.unit(s,source.uid);if(kairos){if(kairos.dying)A.leaveUnit(s,kairos,'banished');else A.kill(s,kairos,true);}
    else{
      const id=source.originalCard||source.card,physical=A.card(id).finalPhysicalUid;
      for(let owner=0;owner<2;owner++){
        const pl=s.players[owner];let found=false;
        pl.hand=pl.hand.filter(h=>{if(physical?A.card(h.card).finalPhysicalUid===physical:h.uid===source.uid){found=true;return false;}return true;});
        for(const zone of ['cemetery','spells','atlas','collection']){if((zone==='cemetery'||zone==='collection')&&(!zoneAccessAllowed(s,p,A)||zone==='cemetery'&&!canAffectCemetery(s,p,owner,A)))continue;const index=pl[zone]?.findIndex(cardId=>physical&&A.card(cardId).finalPhysicalUid===physical);if(index>=0){if(zone==='cemetery'){const g=A.graveEntries(s,owner)[index];A.takeGrave(s,owner,index,g.card,g.uid);}else pl[zone].splice(index,1);found=true;}}
        if(found)A.sendCard(s,owner,id,'banished');
      }
    }
    return true;
  }
  if(step.op==='finalRasputinConfirm'){
    if(selected===true){if(!finalRasputinCastingCard(s,step.action,A))throw Error('Rasputin 的墓地權限或放逐盟友已失效');A.commitSpell(s,{...step.action,rasputinConfirmed:true},step.declared);}return true;
  }
  if(step.op==='finalRasputinCost'){
    const ally=A.unit(s,step.uid);if(ally&&finalArchivePrintedCard(rasputinPrintedCard(ally,A),A)===finalArchivePrintedCard(step.printed||step.card,A))A.kill(s,ally,true);return true;
  }
  if(step.op==='finalGrosseAnimate'){
    const a=s.artifacts.find(a=>a.uid===selected?.uid);if(!a)return true;
    if(!A.selectEffects(s,frame,{kind:'artifact',nearby:true,untargeted:true}).some(o=>o.value.uid===a.uid))return true;
    animateArtifact(s,a,{source,controller:p,power:A.card(a.originalCard||a.card).cost||0},A);return true;
  }
  if(step.op==='finalStitch'){
    const u=A.unit(s,source.uid);if(!u||u.dying)return true;
    const picks=step.picks||[],candidates=stitchCandidates(s,p,A).filter(g=>(!picks.length||g.player===picks[0].player)&&!picks.some(v=>v.uid===g.uid&&v.player===g.player));
    if(selected===undefined){choose('Stitched Abomination · 從同一墓地縫合最多三張僕從',[...candidates.map(g=>({label:A.card(g.card).name+' · 墓地 '+g.player,value:g})),{label:'完成（'+picks.length+'）',value:null}]);return true;}
    if(selected!==null){const g=candidates.find(g=>g.uid===selected.uid&&g.player===selected.player&&g.card===selected.card);if(!g)throw Error('縫合墓地選擇已失效');const next=[...picks,g];if(next.length<3){queue([{...step,picks:next}]);return true;}step.picks=next;}
    const chosen=step.picks||picks,entries=stitchCandidates(s,p,A);
    if(chosen.some(g=>!entries.some(e=>e.uid===g.uid&&e.player===g.player&&e.card===g.card)))throw Error('縫合墓地訪問已失效');
    u.finalStitchedParts=[];
    for(const g of chosen){const current=A.graveEntries(s,g.player).find(e=>e.uid===g.uid&&e.card===g.card);if(!current)throw Error('縫合實體卡已離開墓地');A.takeGrave(s,g.player,current.index,g.card,g.uid);A.sendCard(s,g.player,g.card,'banished');u.finalStitchedParts.push({uid:g.uid,card:g.card,owner:g.player,power:A.card(g.card).attack||0,damage:0});}
    u.damage=0;return true;
  }
  if(step.op==='finalInquisitionReveal'){
    queue([{op:'finalInquisitionBanish',player:1-p}]);return true;
  }
  if(step.op==='finalInquisitionBanish'){
    const owner=step.player,hand=s.players[owner].hand;
    if(selected===undefined){if(hand.length)choose('The Inquisition · 對手揭示手牌，可放逐一張',[...hand.map(h=>({label:A.card(h.card).name,value:h.uid})),{label:'不放逐',value:null}]);return true;}
    const h=hand.find(h=>h.uid===selected);if(h){s.players[owner].hand=hand.filter(v=>v.uid!==h.uid);A.sendCard(s,owner,h.card,'banished');}return true;
  }
  if(step.op==='finalInquisitionOffer'){
    const r=s.finalInquisitionExposures?.[step.exposure];if(!r)return true;
    const owner=r.player,pl=s.players[owner],h=r.zone==='hand'?pl.hand.find(h=>h.uid===r.uid&&h.card===r.card):null,count=r.zone==='hand'?(h?1:0):pl.spells.filter(id=>id===r.card).length;
    const available=Math.min(r.count-(r.removed||0),count+r.accepted)-r.offered;
    if(available<=0){finishInquisitionExposure(s,r);return true;}
    const c=contextualCard(s,r.card,owner,A),spots=[];
    if(A.resources(s,owner).available>=A.summoningTax(s,c))for(let at=0;at<20;at++)for(const birthLayer of ['surface','below'])if(A.canSummonEntry(s,owner,c,at,birthLayer))spots.push({at,layer:birthLayer});
    if(selected===undefined){
      if(!spots.length){finishInquisitionExposure(s,r);return true;}
      s.choice={player:owner,title:'The Inquisition 已被看見 · 可直接召喚',options:[...spots.map(to=>({label:'召喚至 '+to.at+' / '+to.layer,value:to})),{label:'不召喚',value:null}],frame};return true;
    }
    r.offered++;
    if(selected!==null){
      const to=spots.find(to=>to.at===selected?.at&&to.layer===selected.layer);if(!to)throw Error('Inquisition 的召喚位置或額外費用已失效');
      if(r.zone==='hand')pl.hand=pl.hand.filter(v=>v.uid!==r.uid);else{const index=pl.spells.indexOf(r.card);if(index<0)throw Error('曝光牌已離開 Spellbook');pl.spells.splice(index,1);clearFinalInquisitionTop(s,owner);}
      r.accepted++;
      // The follow-up is BELOW entry/Genesis continuations and is therefore
      // safe when two copies were exposed or the new Genesis reveals another.
      queue([{op:'finalInquisitionOffer',exposure:r.id}]);
      if(A.paySummoningTax(s,r.card,owner,owner)){const summoned=A.makeUnit(s,r.card,owner,to.at);summoned.layer=to.layer;A.summonedGenesis(s,summoned);}
      return true;
    }
    queue([{op:'finalInquisitionOffer',exposure:r.id}]);return true;
  }
  if(step.op==='finalUnitCostPick'){
    const a=step.action,c=A.castingCard(s,a);if(!c||!extraCostMode(c,A))throw Error('施放來源已失效');
    const candidates=finalUnitExtraCostCandidates(s,p,c,a.at,a.layer||'surface',a,A);let picks=step.picks||[];
    if(selected===null)return true;
    if(selected?.add){const matching=candidates.filter(e=>costKey(e)===selected.add&&e.card===selected.card&&(!selected.costAbility||sameCostAbility(e.costAbility,selected.costAbility)));const e=matching.length===1?matching[0]:null;if(!e||picks.some(v=>costKey(v)===costKey(e)))throw Error('不能重複或使用失效費用，且必須宣告來源能力');picks=[...picks,e];}
    if(selected?.remove)picks=picks.filter(e=>costKey(e)!==selected.remove);
    const declared={...a,unitCostsDeclared:true,unitCosts:picks},caster=A.spellcaster(s,a.caster,a.casterLayer,a.casterLocation),valid=selectedUnitCosts(s,p,c,a.at,a.layer||'surface',declared,A);
    const fee=A.castingCost(s,p,c,a.at,caster,a.payment,0,a.layer||'surface',declared),needsAccess=valid.some(e=>e.zone==='grave'),scope=a.zoneAccessScope||s.zoneAccessScope;
    const manaCost=s.players[p].bloodManaTurn===s.turn?A.summoningTax(s,c):fee;
    const affordable=A.canPaySpell(s,p,c,a.at,caster,a.payment,0,a.layer||'surface',declared)&&(!needsAccess||canPayZoneAccess(s,p,A,manaCost,scope));
    if(selected?.confirm){
      if(!affordable)throw Error('無法支付實際施放費用');
      if(needsAccess)declared.zoneAccessScope=commitZoneAccess(s,p,A,{scope});
      A.commitSpell(s,declared);return true;
    }
    const options=[];
    if(affordable)options.push({label:'確認施放 · 費用 '+fee,value:{confirm:true}});
    for(const e of valid)options.push({label:'取消選取 '+A.card(e.card).name+' · '+e.zone,value:{remove:costKey(e)}});
    for(const e of candidates)if(!valid.some(v=>costKey(v)===costKey(e)))options.push({label:(e.costAbility.mode==='wendigo'?'犧牲 ':'放逐 ')+A.card(e.card).name+' · '+e.zone+' · '+A.card(e.costAbility.origin).name,value:{add:costKey(e),card:e.card,costAbility:e.costAbility}});
    options.push({label:'取消施放（不支付任何費用）',value:null});
    s.choice={player:p,title:A.card(c.id).name+' · 宣告額外費用（已選 '+valid.length+'）',options,frame:{...frame,step:{...step,picks:valid}}};return true;
  }
  if(step.op==='finalJackKill'){
    const jack=A.unit(s,step.uid),victim=A.unit(s,step.target);
    if(!jack||jack.dying||A.disabled(jack)||!victim||victim.dying)return true;
    // "Any Mortal" is not targeting. Ward prevents the destruction, rather
    // than preventing the earlier silence or his alternate placement.
    if(!A.unmodifiable(victim)){victim.mods.push({silenced:true});victim.silenced=true;}
    A.kill(s,victim);return true;
  }
  if(step.op==='finalPlunder'){
    const target=step.player;
    for(let i=0;i<step.count&&s.players[target].spells.length;i++){
      const id=s.players[target].spells.shift(),zone=A.sendCard(s,target,id,'cemetery');
      A.log(s,A.card(id).name+' 被掠奪棄入墓地。');
      if(zone==='cemetery'){
        const g=A.graveEntries(s,target).at(-1);
        if(g?.card===id)(s.finalPlunder||(s.finalPlunder=[])).push({uid:'plunder'+s.next++,player:p,physicalPlayer:target,graveUid:g.uid,card:id,turn:s.turn,source:source.uid,sourceCard:source.card,used:false});
      }
    }
    return true;
  }
  if(step.op==='finalSharkHunt'){
    const shark=A.unit(s,step.uid),target=A.unit(s,step.target);if(!shark||shark.dying||!target||target.dying)return true;
    // This ability is already on the Storyline. Silence after triggering does
    // not cancel the movement and fight that have been declared.
    const result=finalUnitShortestRoutes(s,shark,node=>here(node,target,A,s),A);
    if(!result.routes.length)return true;
    if(selected===undefined&&result.routes.length>1){choose('Giant Shark · 選擇前往該單位的最短路徑',result.routes.map(path=>({label:path.map(to=>to.at+(to.layer==='below'?'↓':'↑')).join(' → '),value:path})));return true;}
    const path=result.routes.length===1?result.routes[0]:result.routes.find(path=>JSON.stringify(path)===JSON.stringify(selected));if(!path)return true;
    const route=[{at:shark.at,layer:layer(shark)},...path];
    queue([...path.map((to,i)=>({op:'finalSharkStep',uid:shark.uid,from:route[i],to})),{op:'finalSharkFight',uid:shark.uid,target:target.uid}]);return true;
  }
  if(step.op==='finalSharkStep'){
    const u=A.unit(s,step.uid);if(!u||u.dying||A.disabled(u)||u.at!==step.from.at||layer(u)!==layer(step.from))return true;
    const to=stepDestinations(s,u,A).find(to=>nodeKey(to)===nodeKey(step.to));if(!to)return true;
    u.at=to.at;u.layer=to.layer;u.gateVoidwalk=to.gateVoidwalk;u.notRest=true;u.burrowedSafely=false;return true;
  }
  if(step.op==='finalSharkFight'){
    const shark=A.unit(s,step.uid),target=A.unit(s,step.target);
    if(shark&&!shark.dying&&target&&!target.dying&&here(shark,target,A,s))A.fight(s,{attacker:shark.uid,defenders:[target.uid],kind:'spell'});
    return true;
  }
  if(step.op==='finalCraveStart'){
    const u=A.unit(s,source.uid);if(!u||u.dying||A.disabled(u))return true;
    const attacks=craveAttacks(s,u,A);
    if(attacks.length){const index=A.rollIndex(s,attacks.map(a=>A.card(a.victim.card).name+' @ '+a.victim.at));queueCraveAttack(s,u,attacks[index],A);return true;}
    const shortest=finalUnitShortestRoutes(s,u,node=>s.units.some(v=>craveCanAttack(s,node,v,A)),A);
    const firsts=[...new Map(shortest.routes.filter(path=>path.length).map(path=>[nodeKey(path[0]),path[0]])).values()];
    if(firsts.length===1)queue([{op:'finalCraveStep',to:firsts[0]}]);
    else if(firsts.length>1)queue([{op:'finalCraveStep',destinations:firsts}]);
    return true;
  }
  if(step.op==='finalCraveStep'){
    const u=A.unit(s,source.uid);if(!u||u.dying||A.disabled(u))return true;
    const legal=stepDestinations(s,u,A),allowed=(step.destinations||[step.to]).filter(to=>legal.some(v=>nodeKey(v)===nodeKey(to)));
    if(selected===undefined&&!step.to){if(allowed.length)choose('Crave Golem · 選擇朝最近可攻僕從的最短一步',allowed.map(to=>({label:'移至 '+to.at+' / '+to.layer,value:to})));return true;}
    const to=allowed.find(v=>nodeKey(v)===nodeKey(selected||step.to||{}));if(!to)return true;
    u.at=to.at;u.layer=to.layer;u.gateVoidwalk=to.gateVoidwalk;u.notRest=true;u.burrowedSafely=false;
    return true;
  }
  if(step.op==='finalBritomart'){
    const u=A.unit(s,source.uid);if(!u||u.dying)return true;
    const options=britomartGraves(s,u,A);
    if(selected===undefined){choose('Dame Britomart · 可用召喚亡故 Mortal 取代地點攻擊',[...options.map(g=>({label:A.card(g.card).name,value:g})),{label:'正常攻擊地點',value:null}]);return true;}
    const g=options.find(g=>g.player===selected?.player&&g.card===selected.card&&g.uid===selected.uid&&g.index===selected.index);
    if(!g){if(step.remainingOffers?.length){const [next,...remainingOffers]=step.remainingOffers;queue([{...next,remainingOffers}]);}else A.fight(s,step.pending);return true;}
    if(!zoneAccessAllowed(s,p,A)){A.fight(s,step.pending);return true;}
    A.takeGrave(s,g.player,g.index,g.card,g.uid);
    if(A.paySummoningTax(s,g.card,g.player,p)){
      const summoned=A.makeUnit(s,g.card,g.player,u.at);summoned.controller=p;summoned.layer=layer(u);A.summonedGenesis(s,summoned);
    }
    u.stealth=false;A.log(s,'Dame Britomart 以召喚 Mortal 取代地點攻擊。');return true;
  }
  if(step.op==='finalGargoyleMode'){
    const u=live(s,source.uid,A);if(!u||u.dying||u.silenced&&step.abilityNature!=='gained'||A.disabled(u))return true;
    if(selected===undefined){choose('Monastery Gargoyle · 選擇形態',[{label:'Airborne 僕從',value:'airborne'},{label:'Monument 神器',value:'monument'}]);return true;}
    if(selected!=='airborne'&&selected!=='monument')throw Error('無效的 Gargoyle 形態');
    if(selected==='monument'){
      if(s.artifacts.includes(u))return true;
      const base=u.originalCard||u.card;
      // It stops being a unit. Equipment cannot be carried by a Monument.
      for(const a of s.artifacts)if(a.bearer===u.uid){a.bearer=null;a.at=u.at;a.layer=layer(u);}
      for(const rider of s.units)if(rider.carriedBy===u.uid){delete rider.carriedBy;delete rider.carriedPosition;delete rider.finalConstrictedBy;rider.carryDisabled=false;}
      s.units=s.units.filter(v=>v.uid!==u.uid);
      const generic=A.card(u.card).slug!=='monastery_gargoyle',returnCard=u.card;
      const form=generic?A.runtimeCard(returnCard,'gargoyle_form',{slug:A.card(returnCard).slug,playable:A.card(returnCard).playable,type:'Artifact',subtypes:['Monument'],attack:0,defense:0}):prepareFinalUnitCards(A);
      const a={...clone(u),card:form,originalCard:base,bearer:null,ward:false,finalGargoyleAirborne:false,finalGargoyleDamageTurn:s.turn,...(generic?{finalGargoyleReturnCard:returnCard}:{} )};
      delete a.carriedBy;delete a.carriedPosition;delete a.carrierOffset;
      a.carryDisabled=false;s.artifacts.push(a);
    }else{
      if(s.artifacts.includes(u)){
        s.artifacts=s.artifacts.filter(v=>v.uid!==u.uid);
        const returnCard=u.finalGargoyleReturnCard;u.card=returnCard||u.originalCard||A.card('monastery_gargoyle').id;
        if(!returnCard)delete u.originalCard;delete u.finalGargoyleReturnCard;delete u.bearer;s.units.push(u);
      }
      u.finalGargoyleAirborne=true;u.finalGargoyleAbility={origin:step.abilityOrigin||source.card,instance:step.abilityInstance||'printed',nature:step.abilityNature||'printed'};
    }
    return true;
  }
  if(step.op==='finalMimicEntry'){
    const mimic=A.unit(s,step.uid)||step.object;if(!mimic||mimic.dying)return true;
    const options=(s.artifacts||[]).filter(a=>A.card(a.card).type==='Artifact'&&!A.card(a.card).subtypes.some(t=>['Monument','Automaton'].includes(t))&&!A.unmodifiable(a));
    if(selected===undefined&&options.length){choose('Mimic · 可將一件可攜帶神器變形成 Mimic',[...options.map(a=>({label:A.card(a.card).name,value:a.uid})),{label:'不變形',value:null}]);return true;}
    const a=options.find(a=>a.uid===selected);
    if(a){
      // The physical Mimic replaces the artifact, rather than creating a
      // second Mimic. The artifact's card is banished; this is still the same
      // game object (same uid, ongoing modifiers, tapping and entry time).
      s.artifacts=s.artifacts.filter(o=>o.uid!==a.uid);
      s.units=s.units.filter(u=>u.uid!==mimic.uid);
      A.sendCard(s,a.owner,a.originalCard||a.baseCard||a.card,'banished');
      const transformed={...clone(a),card:mimic.card,owner:mimic.owner,controller:p,layer:layer(a),born:a.born??0,damage:a.damage||0,tapped:!!a.tapped,mods:clone(a.mods||[]),grantedKeywords:[],finalMimicEntryDone:true,notRest:true};
      delete transformed.bearer;delete transformed.originalCard;delete transformed.baseCard;
      if(mimic.originalCard)transformed.originalCard=mimic.originalCard;
      if(mimic.finalRasputinPower!==undefined){transformed.originalCard=mimic.originalCard;transformed.finalRasputinPower=mimic.finalRasputinPower;transformed.mods.push({power:mimic.finalRasputinPower});}
      transformed.tokenCopy=!!mimic.tokenCopy;s.units.push(transformed);
      if(mimic.finalDeathspeakerOrigin){
        transformed.finalDeathspeakerOrigin=clone(mimic.finalDeathspeakerOrigin);
        // Deathspeaker's release follows the copy through Mimic's alternate
        // placement. The artifact's old game-object UID is now the copy's UID.
        for(const f of s.storyline||[])if(f.step.op==='finalAvatarBanishCopy'&&f.step.uid===mimic.uid)f.step.uid=a.uid;
      }
      // Transforming is not entering the realm. No Genesis / entry triggers.
      return true;
    }
    if(!A.unit(s,mimic.uid))s.units.push(mimic);
    A.summonedGenesis(s,mimic);return true;
  }
  if(step.op==='finalConstrictStep'){
    const snake=A.unit(s,source.uid);if(!snake||snake.dying||A.disabled(snake))return true;
    const destinations=A.locations(s,snake,A.card,A.keywords).filter(v=>v.path.length===1);
    if(selected===undefined){choose('Tringh Constrictor · 可走一步',[{label:'留在原處',value:null},...destinations.map(v=>({label:'移至 '+v.at+' / '+v.layer,value:{at:v.at,layer:v.layer}}))]);return true;}
    if(selected!==null){
      const to=destinations.find(v=>v.at===selected?.at&&v.layer===selected.layer);
      if(!to)throw Error('纏繞者只能走合法的一步');
      snake.at=to.at;snake.layer=to.layer;snake.notRest=true;snake.burrowedSafely=false;
    }
    queue([{op:'finalConstrictPick',uid:snake.uid}]);return true;
  }
  if(step.op==='finalConstrictPlan'){
    const snake=A.unit(s,source.uid);if(!snake||snake.dying||A.disabled(snake))return true;
    const plan=finalConstrictPlans(s,frame,A).find(o=>JSON.stringify(o.value)===JSON.stringify(selected))?.value;if(!plan)return true;
    snake.at=plan.to.at;snake.layer=plan.to.layer;snake.notRest=true;snake.burrowedSafely=false;
    queue([{op:'finalConstrictPick',uid:snake.uid,declaredTarget:plan.uid}]);return true;
  }
  if(step.op==='finalConstrictPick'){
    const snake=A.unit(s,step.uid);if(!snake||snake.dying||A.disabled(snake))return true;
    const targets=s.units.filter(u=>u.uid!==snake.uid&&!u.dying&&A.card(u.card).type==='Minion'&&here(snake,u,A,s)&&!u.carriedBy&&A.canTarget(s,p,u,snake)&&!A.unmodifiable(u));
    if(selected===undefined&&!step.declaredTarget){if(targets.length)choose('Tringh Constrictor · 纏住此處僕從',targets.map(u=>({label:A.card(u.card).name,value:u.uid})));return true;}
    const target=targets.find(u=>u.uid===(step.declaredTarget||selected));if(!target)return true;
    if(A.blocked(s,p,target))return true;
    const prior=A.unit(s,snake.finalConstricting);
    if(prior){delete prior.carriedBy;delete prior.finalConstrictedBy;prior.carryDisabled=false;}
      snake.finalConstricting=target.uid;snake.finalConstrictPending=true;target.finalConstrictedBy=snake.uid;
    target.carriedBy=snake.uid;target.carriedPosition={at:target.at,layer:layer(target)};target.carrierOffset=target.at-snake.at;
    snake.carrierPosition={at:snake.at,layer:layer(snake)};target.carryDisabled=true;
    return true;
  }
  return true;
}

// Archived realm cards retain physical lineage across zones and basic copies.
// A distinct runtime wrapper is a PHYSICAL lineage token, not a printed ID.
export {finalArchivePrintedCard} from './card-lineage.js';
export {registerArchiveRuntimeCard} from './card-lineage.js';
export function restoreFinalArchiveCards(s,A){
 const seen=new Set(),registered=new Set(),register=id=>{
  if(registered.has(id))return;registered.add(id);const m=/^runtime:([^:]+):(.+)$/.exec(id);if(!m)return;register(m[2]);
  registerArchiveRuntimeCard(id,A);
 };
 const visit=value=>{if(typeof value==='string'){register(value);return;}if(!value||typeof value!=='object'||seen.has(value))return;seen.add(value);for(const child of Object.values(value))visit(child);};visit(s);
}
function archiveUnderlyingPhysical(id,A){const seen=new Set();while(A.card(id).runtimeBase&&!seen.has(id)){seen.add(id);id=A.card(id).runtimeBase;}return id;}
export function tagPhysicalCard(s,id,A){
 const c=A.card(id),printed=archiveUnderlyingPhysical(id,A),physicalUid=c.finalPhysicalUid||'kairos-physical'+(s.nextFinalPhysical=(s.nextFinalPhysical||0)+1);
 let tagged=archivePhysicalCard(printed,physicalUid,A);if(c.finalAltarSpent){const base=A.card(tagged);tagged=A.runtimeCard(tagged,'altar_spent',{slug:base.slug,playable:base.playable,finalAltarSpent:true});}
 return {card:tagged,physicalUid,printed};
}
function archivedPhysicalUid(object,A){return A.card(object?.originalCard||object?.baseCard||object?.card).finalPhysicalUid;}
export function createFinalKairosArchive(s,A){
 const records=[],seen=new Map();
 for(const [zone,objects] of [['board',s.board],['units',s.units],['artifacts',s.artifacts],['auras',s.auras],['inertCards',s.inertCards]])for(const [at,o] of (objects||[]).entries())if(o){
  if(seen.has(o.uid)){seen.get(o.uid).zones.push(zone);continue;}
  const physicalParts=A.tagBuiltSiteParts?.(s,o,A,tagPhysicalCard)||null,physical=o.originalCard||o.baseCard||o.card,tag=physicalParts?.length?tagPhysicalCard(s,physicalParts[0].card,A):tagPhysicalCard(s,physical,A),uid=tag.physicalUid,printed=tag.printed;
  let tagged=tag.card;if(o.finalAltarSpent&&!A.card(tagged).finalAltarSpent){const c=A.card(tagged);tagged=A.runtimeCard(tagged,'altar_spent',{slug:c.slug,playable:c.playable,finalAltarSpent:true});}
  if(!o.originalCard&&(o.card===printed||A.card(o.card).finalPhysicalUid||A.card(o.card).finalAltarSpent))o.card=tagged;else o.originalCard=tagged;
  for(const field of ['artifactAnimation','finalAuraAnimation'])if(o[field])o[field].card=tagged;
  if(o.finalBorrowed)o.finalBorrowed.base=tagged;if(o.copyReturn)o.copyReturn.originalCard=tagged;
  o.finalArchivePhysicalUid=uid;const state=clone(o);delete state.finalKairosArchive;
  const record={physicalUid:uid,physicalUids:physicalParts?.map(part=>part.physicalUid)||[uid],physicalParts,printed,card:tagged,zone,zones:[zone],at:zone==='board'?at:o.at,state,token:A.card(printed).category==='Token'||!!o.tokenCopy};records.push(record);seen.set(o.uid,record);
 }
 s.finalKairosArchive={turn:s.turn,records,applyingEffects:A.archiveApplyingEffects?.(s,s.units)||[],boundControls:clone((s.boundControls||[]).filter(e=>records.some(r=>r.state.uid===e.target)))};return s.finalKairosArchive;
}
export function returnFinalKairosArchive(s,A,actor=null){
 const archive=s.finalKairosArchive;if(!archive)return;
 const uidOf=id=>{try{return A.card(id).finalPhysicalUid;}catch{return null;}};
 const banished=new Set(s.players.flatMap(pl=>pl.banished||[]).map(uidOf)),spent=new Set();
 for(const pl of s.players)for(const zone of ['hand','spells','atlas','cemetery','collection','banished'])for(const entry of pl[zone]||[]){const id=typeof entry==='string'?entry:entry.card;if(A.card(id).finalAltarSpent)spent.add(uidOf(id));}
 for(const o of [...s.board,...s.units,...s.artifacts||[],...s.auras||[],...s.inertCards||[]])if(o&&(o.finalAltarSpent||A.card(o.originalCard||o.card).finalAltarSpent))spent.add(archivedPhysicalUid(o,A));
 const restoredState=r=>{const state=r.physicalParts&&A.restoreBuiltSiteState?A.restoreBuiltSiteState(r.state,new Set(eligibleFor.get(r)),A):clone(r.state);const rebase=value=>{if(!value||typeof value!=='object')return;for(const [key,child] of Object.entries(value)){if(key==='usedAbilities'&&child&&typeof child==='object'){for(const index of Object.keys(child))if(child[index]===archive.turn)child[index]=s.turn;}else if(typeof child==='number'&&(key==='end'&&child>=archive.turn||key==='born'&&child===archive.turn||key.endsWith('Turn')&&child===archive.turn))value[key]=s.turn+(child-archive.turn);else if(child&&typeof child==='object')rebase(child);}};if(archive.turn!==undefined)rebase(state);if(spent.has(archivedPhysicalUid(state,A))){state.finalAltarSpent=true;const field=state.originalCard?'originalCard':'card',c=A.card(state[field]);if(!c.finalAltarSpent)state[field]=A.runtimeCard(state[field],'altar_spent',{slug:c.slug,playable:c.playable,finalAltarSpent:true});}for(const part of state.babelParts||[]){if(spent.has(A.card(part.card).finalPhysicalUid)&&!A.card(part.card).finalAltarSpent){const c=A.card(part.card);part.card=A.runtimeCard(part.card,'altar_spent',{slug:c.slug,playable:c.playable,finalAltarSpent:true});}}return state;};
 const eligibleFor=new Map(archive.records.map(r=>[r,(r.physicalUids||[r.physicalUid]).filter(uid=>{if(!r.token&&banished.has(uid))return false;if(actor!==null)for(let owner=0;owner<2;owner++)for(const zone of ['cemetery','collection'])if((s.players[owner][zone]||[]).some(id=>uidOf(id)===uid)&&(!zoneAccessAllowed(s,actor,A)||zone==='cemetery'&&!canAffectCemetery(s,actor,owner,A)))return false;return true;})]));
 const recover=archive.records.filter(r=>eligibleFor.get(r).length),recoverIds=new Set(recover.flatMap(r=>eligibleFor.get(r))),realmIds=new Set(recover.map(r=>r.state.uid));
 // Explicit physical containers temporarily held by resolving effects. Source
 // snapshots, targets and historical chosen lists are not physical containers.
 const poolOps=new Set(['finalDholCast','finalDholBottom','remainingRatPick','searchDiscardTop','orderDeck','bottomToTop','browsePick','browseBottom']);
 const cleanFrame=frame=>{const step=frame?.step;if(!step)return;if(poolOps.has(step.op))for(const key of ['pool','ordered'])if(Array.isArray(step[key]))step[key]=step[key].filter(id=>!recoverIds.has(uidOf(id)));if(step.op==='finishMagic'&&recoverIds.has(uidOf(step.card)))step.finalKairosConsumed=true;if(step.original?.step)cleanFrame(step.original);};
 for(const frame of s.storyline||[])cleanFrame(frame);
 s.boundSpells=(s.boundSpells||[]).filter(h=>!recoverIds.has(uidOf(h.card)));
 // New carried objects remain where they are; placement is not movement.
 for(const a of s.artifacts||[])if(!recoverIds.has(archivedPhysicalUid(a,A))&&realmIds.has(a.bearer))a.bearer=null;
 for(const u of s.units||[])if(!recoverIds.has(archivedPhysicalUid(u,A))&&realmIds.has(u.carriedBy)){delete u.carriedBy;u.carryDisabled=false;}
 for(const pl of s.players){
  pl.hand=pl.hand.filter(h=>!recoverIds.has(uidOf(h.card)));
  for(const zone of ['spells','atlas','cemetery','collection','banished'])if(Array.isArray(pl[zone]))pl[zone]=pl[zone].filter(id=>!recoverIds.has(uidOf(id)));
  if(pl.graves)pl.graves=pl.graves.filter(g=>!recoverIds.has(uidOf(g.card)));
 }
 if(A.detachBuiltSiteParts){
  s.board=s.board.map(o=>o?.babelParts?A.detachBuiltSiteParts(o,recoverIds,A):o);
  for(const zone of ['units','artifacts','auras','inertCards'])s[zone]=(s[zone]||[]).flatMap(o=>{const remainder=o.babelParts?A.detachBuiltSiteParts(o,recoverIds,A):o;return remainder?[remainder]:[];});
 }
 for(const zone of ['units','artifacts','auras','inertCards'])s[zone]=(s[zone]||[]).filter(o=>!recoverIds.has(archivedPhysicalUid(o,A)));
 s.board=s.board.map(o=>o&&recoverIds.has(archivedPhysicalUid(o,A))?null:o);
 for(const r of recover){const restored=restoredState(r);if(!restored)continue;const board=r.zone==='board'||A.card(restored.card).type==='Site';
  if(board){const collision=s.board[r.at];if(collision){const owner=collision.owner??collision.controller;if(collision.babelParts&&A.sendBuiltSite)A.sendBuiltSite(s,collision,'banished',A);else if(owner===0||owner===1)A.sendCard(s,owner,collision.originalCard||collision.card,'banished');}s.board[r.at]=restored;}
  else{restored.justEntered=false;restored.observedTapped=!!restored.tapped;restored.observedPosition={at:restored.at,layer:restored.layer||'surface',cells:A.occupied(restored)};for(const zone of r.zones||[r.zone])if(zone!=='board')s[zone].push(restored);}
 }
 s.boundControls=[...(s.boundControls||[]).filter(e=>!realmIds.has(e.target)),...clone(archive.boundControls||[])];
 const effectOps=new Set(['fiftyOnslaught','shieldWall','nightAttack','terrainEffect']);
 s.ongoingEffects=(s.ongoingEffects||[]).map(effect=>effectOps.has(effect.op)?{...effect,excludedTargets:[...new Set([...(effect.excludedTargets||[]),...realmIds])]}:effect);
 for(const record of archive.applyingEffects||[]){const targets=record.targets.filter(uid=>realmIds.has(uid));if(targets.length){const effect=clone(record.effect);effect.archivedTargets=targets;delete effect.excludedTargets;if(typeof effect.end==='number'&&effect.end>=archive.turn)effect.end=s.turn+(effect.end-archive.turn);s.ongoingEffects.push(effect);}}
 return {restored:recover.map(r=>r.physicalUid),blocked:archive.records.filter(r=>!recoverIds.has(r.physicalUid)).map(r=>r.physicalUid)};
}

