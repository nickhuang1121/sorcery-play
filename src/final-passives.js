import {cemeteryPhysicalPlayer,canAffectCemetery,zoneAccessCost} from './cemetery-access.js';
import {choiceSelectorMetadata} from './selector-semantics.js';
import {unitPrintedAbilityRecord} from './final-ability-layers.js';
import {geometryLocationRecords} from './final-geometry.js';
// Explicit rules for the last-card passive batch. These hooks deliberately do
// not register a card as playable: the caller must connect every relevant entry
// point before adding it to definitions/passives. See docs/final-passives.md.
const defaultDisabled=o=>!o.fiftyOnslaught&&(o.completionDisabled||o.restraintDisabled||o.carryDisabled||o.bellyDisabled||o.effectDisabled||o.boundDisabled||o.conditionDisabled||(o.mods||[]).some(m=>m.disabled||m.asleep));
const active=(o,A)=>!!o&&!o.dying&&!o.silenced&&!o.disabled&&!(A.disabled?A.disabled(o):defaultDisabled(o));
const slug=(o,A)=>A.card(o.card).slug;
const isMinion=(o,A)=>A.card(o.card).type==='Minion';
const cells=(o,A)=>A.occupied?A.occupied(o):[o.at];
const near=(a,b,A)=>cells(a,A).some(at=>cells(b,A).some(bt=>A.nearby(at,bt)));
const sameRegion=(s,a,b,A)=>A.regionsOverlap(s,a,b);
export function finalPrintedSourceActive(s,o,name,A){
 if(!o||o.dying||o.disabled||(A.disabled?A.disabled(o):defaultDisabled(o)))return false;
 const c=A.card(o.card),stored=c.abilityLayerRecord||c.printedAbilityRecord||o.finalAbilityRecord;
 if(stored)return stored.records.some(r=>r.slug===name&&(!o.silenced||r.nature==='gained'));
 const contains=id=>{const source=A.card(id);return source.slug===name||source.abilitySlugs?.includes(name);};
 const dynamic=o.finalBorrowed&&contains(o.finalBorrowed.source)||(o.finalAbilitySources||[]).some(v=>contains(typeof v==='string'?v:v.card))||(s.artifacts||[]).some(a=>a.bearer===o.uid&&a.pallidPrintedCard&&contains(a.pallidPrintedCard)&&!a.silenced&&!a.disabled);
 if(c.slug!==name&&!c.abilitySlugs?.includes(name)&&!dynamic)return false;
 if(c.slug===name&&!o.silenced&&!dynamic)return true;
 if((s.units||[]).some(u=>u.uid===o.uid)&&A.definitions&&A.passives&&A.printedKeywords)return unitPrintedAbilityRecord(s,o,A).records.some(r=>r.slug===name&&(!o.silenced||r.nature==='gained'));
 return !o.silenced&&(c.slug===name||c.abilitySlugs?.includes(name));
}
export function finalPrintedSources(s,name,A){return [...new Map([...(s.units||[]),...(s.artifacts||[]),...(s.auras||[])].map(o=>[o.uid,o])).values()].filter(o=>finalPrintedSourceActive(s,o,name,A));}
const sites=(s,name,A)=>(s.board||[]).filter(o=>active(o,A)&&slug(o,A)===name);
export const finalPassiveCardSlugs=['royal_bodyguard','sir_gawain','saint_of_redemption','order_of_the_white_wing','book_of_blessings','blasted_oak','bureau_of_occult_control','mismanaged_mortuary','wormelow_tump','mortal_soil','red_rock_of_ravannis','the_immortal_throne'];

export function saintOfRedemptionActive(s,A){return (s.units||[]).some(u=>finalPrintedSourceActive(s,u,'saint_of_redemption',A));}
/** Run after continuous silence/disabled state is established; filter Evil from
 * unitUmbrellas whenever finalNoEvil is set (printed card data stays untouched). */
export function refreshFinalSaint(s,A){
 const saint=saintOfRedemptionActive(s,A);
 for(const u of s.units||[])u.finalNoEvil=saint&&isMinion(u,A);
}
export function finalUnitUmbrellas(u,umbrellas){return u.finalNoEvil?umbrellas.filter(t=>t!=='Evil'):umbrellas;}
/** Saint applies to minion cards in every zone, not only realm entities. */
export function finalCardUmbrellas(s,c,A){return saintOfRedemptionActive(s,A)&&c.type==='Minion'?(c.umbrellas||[]).filter(t=>t!=='Evil'):[...(c.umbrellas||[])];}

/** Call from makeUnit, before any effects can inspect the newly entering unit.
 * Tapping is an entry event and is never repeated during a continuous refresh. */
export function finalPassiveEntry(s,u,A){
 if(!isMinion(u,A))return;
 if(saintOfRedemptionActive(s,A)){
  u.tapped=true;u.finalNoEvil=true;
  if((A.printedKeywords?.(A.card(u.card))||[]).includes('Ward'))u.ward=true;
 }
}
/** Call before any Genesis/entry triggers, with fromHand=true ONLY for the cast
 * of that physical hand card (not grave casts, copies, tokens or reanimation). */
export function orderOfWhiteWingReplacesEntry(s,u,fromHand,A){
 if(fromHand||!isMinion(u,A))return false;
 const order=(s.units||[]).find(v=>v.uid!==u.uid&&!v.justEntered&&finalPrintedSourceActive(s,v,'order_of_the_white_wing',A)&&near(v,u,A)&&sameRegion(s,v,u,A));
 if(!order)return false;
 A.kill(s,u,true);return true;
}

/** Invoke once on the declared target set of a single magic cast. Multiple
 * choices of the same unit still choose one minion; site/location choices do
 * not qualify. The bearer, not the Book's controller, must cast that magic. */
export function bookOfBlessingsTarget(s,caster,effectCard,chosen,A){
 const c=typeof effectCard==='object'?effectCard:A.card(effectCard);
 if(c.type!=='Magic'||!caster)return false;
 const choices=(chosen||[]).filter(t=>t?.entity==='unit'&&A.unit(s,t.uid)?.controller===caster.controller&&isMinion(A.unit(s,t.uid),A)),unique=[...new Set(choices.map(t=>t.uid))];
 if(unique.length!==1)return false;
 const u=A.unit(s,unique[0]);
 if(!u||u.dying||u.controller!==caster.controller||!isMinion(u,A)||A.unitUmbrellas(u).includes('Evil'))return false;
 const books=finalPrintedSources(s,'book_of_blessings',A).filter(o=>o.bearer===caster.uid);
 if(!books.length)return false;
 u.ward=true;return true;
}

/** Restrict an already legal target set; this cannot make an illegal oak legal.
 * ctx must explicitly identify a spell or a non-basic ability. Each target
 * option is {label,value:{entity,uid,at,layer}} as in selectEffects. */
export function blastedOakTargetRank(s,value,A){
 const oaks=finalPrintedSources(s,'blasted_oak',A);
  if(!value||typeof value!=='object')return Infinity;
  if(oaks.some(o=>value.uid===o.uid))return 0;
  if(value.entity==='site'&&oaks.some(o=>geometryLocationRecords(o).some(loc=>loc.at===value.at)))return 1;
  if(value.entity==='location'&&oaks.some(o=>geometryLocationRecords(o).some(loc=>loc.at===value.at&&(!s.board?.[loc.at]||loc.layer===(value.layer||'surface')))))return 1;
  const entity=[...(s.units||[]),...(s.artifacts||[]),...(s.auras||[])].find(o=>o.uid===value.uid);
  if(entity&&oaks.some(o=>geometryLocationRecords(o).some(loc=>(cells(entity,A).includes(loc.at)||value.entity==='aura'&&A.inside?.(entity,loc.at))&&(s.board?.[loc.at]||sameRegion(s,o,entity,A)))))return 2;
  return Infinity;
}
export function blastedOakTargets(s,options,ctx,A){
 if(!ctx?.spell&&!ctx?.nonBasicAbility||ctx?.untargeted||options.length<2)return options;
 const rank=value=>blastedOakTargetRank(s,value,A),best=Math.min(...options.map(o=>rank(o.value)));
 return best===Infinity?options:options.filter(o=>rank(o.value)===best);
}

/** Apply only after the caller has finished EVERY legality filter. In
 * particular, Chain Lightning/Meteor/Harpy must not restrict an intermediate
 * selectEffects result whose candidates are still to be filtered. */
export function restrictFinalOakChoice(s,choice,A){
 if(!choice?.frame)return choice;
 const semantics=choiceSelectorMetadata(choice.frame,A);
 if(semantics?.role!=='target')return choice;
 const rank=value=>semantics.excludeSource&&value?.uid===choice.frame.source.uid?Infinity:blastedOakTargetRank(s,value,A);
 const entries=choice.options.filter(o=>o.value!==null&&typeof o.value==='object');
 const best=Math.min(...entries.map(o=>rank(o.value)));
 if(best===Infinity)return choice;
 const chain=choice.frame.step.op==='chainDeclare';
 const forcedGrasp=choice.frame.step.op==='magicDeclareGrasp';
 return {...choice,options:choice.options.filter(o=>o.value===null||typeof o.value!=='object'&&!(chain&&o.value==='commit')&&!(forcedGrasp&&o.value==='skip')||typeof o.value==='object'&&rank(o.value)===best)};
}

const legacyOakTargets={arc_lightning:'unit',betrayal:'unit',cast_into_exile:'unit',fatality:'unit',freeze:'unit',immolation:'unit',mesmerism:'unit',shrink:'unit',zap:'unit',lightning_bolt:'location',minor_explosion:'location',mortality:'location',exorcism:'location',teleport:'site'};
export function restrictFinalLegacyTargets(s,targets,c,A,caster=null){
 const kind=legacyOakTargets[c.slug];if(!kind)return targets;
 const options=targets.map(value=>({value:kind==='unit'?{entity:'unit',uid:value}:kind==='site'?{entity:'site',at:value.at}:{entity:'location',at:value,layer:caster?.layer||'surface'},original:value}));
 return blastedOakTargets(s,options,{spell:true},A).map(o=>o.original);
}
export function restrictFinalOakArtifactActions(s,actions,A){
 const groups=new Map();
 for(const a of actions)if(a.type==='cast'&&a.shacklesTarget&&A.castingCard(s,a)?.slug==='iron_shackles'){
  const key=JSON.stringify([a.caster,a.hand,a.graveOwner,a.graveUid,a.collection,a.bound,a.top,a.payment]);
  if(!groups.has(key))groups.set(key,[]);groups.get(key).push(a);
 }
 const disallowed=new Set();
 for(const group of groups.values()){
  const options=group.map(a=>({value:{entity:'unit',uid:a.bearer},action:a})),allowed=new Set(blastedOakTargets(s,options,{spell:true},A).map(o=>o.action));
  for(const a of group)if(!allowed.has(a))disallowed.add(a);
 }
 return actions.filter(a=>!disallowed.has(a));
}

export function finalDamageRedirectOptions(s,target,A,chain=[]){
 const royalty=A.card(target.card).type==='Avatar'||(A.unitUmbrellas?A.unitUmbrellas(target):A.card(target.card).umbrellas||[]).includes('Royalty');
 return (s.units||[]).filter(v=>v.uid!==target.uid&&active(v,A)&&!chain.includes(v.uid)&&sameRegion(s,v,target,A)).flatMap(v=>{
  const name=slug(v,A);
  if(name==='sir_gawain'&&v.controller===target.controller&&cells(v,A).some(at=>cells(target,A).some(bt=>A.distance(at,bt)===1)))return [{uid:v.uid,mandatory:true,kind:'gawain',label:A.card(v.card).name}];
  if(name==='royal_bodyguard'&&royalty&&near(v,target,A))return [{uid:v.uid,mandatory:false,kind:'bodyguard',player:v.controller,label:A.card(v.card).name}];
  return [];
 });
}
/** This synchronous helper is for a damage continuation AFTER the affected
 * player has chosen. It must not be used to silently auto-pick an optional
 * Royal Bodyguard, or to report dealt damage before the choice resolves. */
export function applyFinalDamageRedirect(s,target,receipt,chosenUid,A){
 const chain=receipt.chain||[],options=finalDamageRedirectOptions(s,target,A,chain),choice=options.find(o=>o.uid===chosenUid);
 if(!choice){if(chosenUid!==null||options.some(o=>o.mandatory))throw Error('A required damage replacement must be chosen');return A.hurt(s,target,receipt.amount,!!receipt.lethal,receipt.kind,receipt.source);}
 const guard=A.unit(s,choice.uid),n=A.hurt(s,guard,receipt.amount,!!receipt.lethal,receipt.kind,receipt.source,[...chain,target.uid]);
 if(choice.kind==='gawain'&&n>0&&(guard.lethal||guard.damage>=A.power(guard,true)))guard.finalGawainDeathDraw=true;
 return n;
}
export function finalGawainDeath(s,source,A){
 if(!source.finalGawainDeathDraw)return false;
 A.draw(s,source.controller,'spells');return true;
}

/** Physical zone owner, not card ownership; official FAQ says an even
 * number of active Mortuaries cancel one another. */
export function finalCemeteryPlayer(s,p,A){return cemeteryPhysicalPlayer(s,p,A);}
export function finalZoneAccessCost(s,A){return zoneAccessCost(s,A);}
/** Access is paid once per access action, not once per card examined. Call only
 * at commit, after all other costs have been checked; preview must use cost. */
export function payFinalZoneAccess(s,p,zone,A){
 if(!['cemetery','collection'].includes(zone))return true;
 const cost=finalZoneAccessCost(s,A);
 if(A.resources(s,p).available<cost)return false;
 s.players[p].spent+=cost;return true;
}
export function finalCanAffectGrave(s,actor,physicalPlayer,A){return canAffectCemetery(s,actor,physicalPlayer,A);}
export function finalGraveEntries(s,p,A,{actor=p,opponent=false}={}){
 const physical=finalCemeteryPlayer(s,opponent?1-p:p,A);
 return finalCanAffectGrave(s,actor,physical,A)?A.graveEntries(s,physical):[];
}

export function mortalSoilOptions(s,aura,A){
 if(!active(aura,A)||slug(aura,A)!=='mortal_soil'||A.resources(s,aura.controller).available<finalZoneAccessCost(s,A))return [];
 return finalGraveEntries(s,aura.controller,A).filter(g=>A.card(g.card).type==='Minion').map(g=>({label:A.card(g.card).name,value:g}));
}
/** Mandatory prevention replacement; choose a corpse if possible. If no corpse
 * can legally be banished, dispel this aura and let the original damage through.
 * Returns true only when the entire site-damage event has been prevented. */
export function resolveMortalSoilDamage(s,auraUid,at,selected,A){
 const aura=(s.auras||[]).find(a=>a.uid===auraUid);
 if(!aura||!active(aura,A)||!A.inside(aura,at))return false;
 const options=mortalSoilOptions(s,aura,A);
 if(!options.length){A.removeObject(s,aura,'cemetery');return false;}
 const entry=options.map(o=>o.value).find(g=>g.player===selected?.player&&g.card===selected.card&&g.index===selected.index&&g.uid===selected.uid);
 if(!entry)throw Error('Mortal Soil requires a legal dead minion');
 if(!payFinalZoneAccess(s,aura.controller,'cemetery',A))throw Error('Cemetery access cost changed');
 A.takeGrave(s,entry.player,entry.index,entry.card,entry.uid);s.players[entry.player].banished.push(entry.card);return true;
}

/** Central catch-all for tokens/reanimation paths that call makeUnit without
 * summonedGenesis. Run at the END of refreshContinuous, after layers and all
 * suppression have been established, before stateBased observes entry events.
 * If the return value is nonempty, repeat refreshContinuous once so removed
 * would-be entrants cannot leave stale continuous bonuses on other units. */
export function processFinalPassiveEntries(s,A){
 const removed=[];
 for(const u of [...s.units||[]]){
  if(!u.justEntered||u.finalPassiveEntryChecked||!isMinion(u,A))continue;
  u.finalPassiveEntryChecked=true;
  if(orderOfWhiteWingReplacesEntry(s,u,!!u.finalCastFromHand,A)){
   removed.push(u.uid);
   // Genesis is not an event when the entrance was replaced. Some old summon
   // helpers enqueue it directly instead of using summonedGenesis.
   s.storyline=(s.storyline||[]).filter(f=>f.source?.uid!==u.uid);
  }else finalPassiveEntry(s,u,A);
 }
 return removed;
}

// Red Rock: an entire pull resolves as one simultaneous movement event. Choices
// are serialized in the Storyline before any object moves.
export const finalPassiveDefinitions={red_rock_of_ravannis:{end:[{op:'finalRedRock'}]}};
export const finalPassivePassives={blasted_oak:{forcedTargetPrecedence:true},red_rock_of_ravannis:{everyEnd:true,redRock:true},the_immortal_throne:{immortalThrone:true},bureau_of_occult_control:{zoneAccessTax:2},mismanaged_mortuary:{cemeterySwap:true},wormelow_tump:{cemeteryProtection:true}};
export const finalPassiveOperations=['finalRedRock','finalRedRockApply','finalThrone'];
const rockLayer=o=>o.layer||'surface';
const atSameLocation=(a,b)=>a.at===b.at&&rockLayer(a)===rockLayer(b);
export function redRockCarryingForbidden(s,object,A){return (s.artifacts||[]).some(r=>active(r,A)&&slug(r,A)==='red_rock_of_ravannis'&&atSameLocation(r,object));}
/** Call after artifacts have followed their bearers, then repeat continuous
 * effects if changed. This is not a Drop and bypasses every cannot-drop rule. */
export function refreshRedRockCarrying(s,A){
 let changed=false;
 for(const o of s.artifacts||[])if(o.bearer&&redRockCarryingForbidden(s,o,A)){o.bearer=null;changed=true;}
 return changed;
}
const isArtifactUnit=(u,A)=>!!A.card(u.card).artifactUnit;
const rockObject=(s,entry,A)=>entry.entity==='unit'?A.unit(s,entry.uid):(s.artifacts||[]).find(o=>o.uid===entry.uid);
function rockForceAllowed(s,o,controller,A){
 if(!o||o.dying)return false;
 if(A.fiftyForceAllowed)return A.fiftyForceAllowed(s,{...o,mods:o.mods||[]},controller,A);
 return !(!o.silenced&&(A.passives?.[slug(o,A)]?.cannotForce||slug(o,A)==='talamh_dreig'));
}
function rockFits(s,o,to,A){
 const from=cells(o,A),shift=to-o.at,dest=from.map(at=>at+shift);
 if(dest.some(at=>at<0||at>=20)||o.size===2&&(to%5>3||to>=15))return false;
 return from.every((at,i)=>A.distance(at,dest[i])===1&&A.regionsOverlap(s,{at,layer:rockLayer(o)},{at:dest[i],layer:rockLayer(o)})&&(!A.canEnterOnGround||A.canEnterOnGround(s,{...o,mods:o.mods||[]},{at,layer:rockLayer(o)},{at:dest[i],layer:rockLayer(o)},A.card,A.keywords)));
}
export function redRockPullDestinations(s,o,root,controller,A){
 if(!o||!s.board[root]||!rockForceAllowed(s,o,controller,A))return [];
 const distance=A.distance(o.at,root);
 return Array.from({length:20},(_,at)=>at).filter(at=>A.distance(o.at,at)===1&&A.distance(at,root)<distance&&rockFits(s,o,at,A));
}
function redRockGroups(s,A){
 const groups=new Map(),add=(o,entity)=>{
  const bearer=entity==='artifact'&&A.unit(s,o.bearer),key=bearer?'unit:'+bearer.uid:entity+':'+o.uid;
  if(!groups.has(key))groups.set(key,{key,bearer:bearer?.uid||null,at:bearer?.at??o.at,layer:rockLayer(bearer||o),objects:[]});
  groups.get(key).objects.push({entity,uid:o.uid,at:o.at,layer:rockLayer(o),bearer:o.bearer||null});
 };
 for(const o of s.artifacts||[])add(o,'artifact');
 for(const u of s.units||[])if(!u.dying&&isArtifactUnit(u,A))add(u,'unit');
 return [...groups.values()];
}
function rockGroupChoices(s,group,root,p,A){
 const options=new Set();
 for(const e of group.objects){const o=rockObject(s,e,A);if(o&&o.at===e.at&&rockLayer(o)===e.layer)for(const to of redRockPullDestinations(s,o,root,p,A))options.add(to);}
 return [...options].sort((a,b)=>a-b);
}
export function resolveFinalPassives(s,frame,A){
 if(!finalPassiveOperations.includes(frame.step.op))return false;
 const {step,source,selected}=frame;
 if(step.op==='finalThrone')return resolveFinalThrone(s,frame,A);
 const controller=A.artifactController?.(s,(s.artifacts||[]).find(o=>o.uid===source.uid)||source)??source.controller??source.owner??frame.controller;
 const queue=steps=>A.queueEffects(s,steps,source,controller,frame.effectCard);
 if(step.op==='finalRedRock'){
  const root=step.root??source.at;if(!s.board[root])return true;
  const remaining=step.remaining??redRockGroups(s,A),plans=step.plans||[];
  if(!remaining.length){queue([{op:'finalRedRockApply',root,plans}]);return true;}
  const [group,...rest]=remaining,options=rockGroupChoices(s,group,root,controller,A);
  if(!options.length){queue([{op:'finalRedRock',root,remaining:rest,plans}]);return true;}
  if(selected===undefined){s.choice={player:controller,title:'Red Rock of Ravannis · 選擇拉近一步的方向',options:options.map(at=>({label:A.card(rockObject(s,group.objects[0],A).card).name+' → '+String.fromCharCode(65+at%5)+(4-Math.floor(at/5)),value:at})),frame:{...frame,controller,step:{...step,root,remaining,plans}}};return true;}
  if(!options.includes(selected))throw Error('Red Rock pull destination is no longer legal');
  queue([{op:'finalRedRock',root,remaining:rest,plans:[...plans,{group,to:selected}]}]);return true;
 }
 const moves=new Map(),artifactMoves=new Map();
 for(const {group,to} of step.plans){
  const entries=group.objects.map(e=>({entry:e,o:rockObject(s,e,A)})).filter(({entry:e,o})=>o&&o.at===e.at&&rockLayer(o)===e.layer&&(e.entity!=='artifact'||(o.bearer||null)===e.bearer));
  if(!entries.length)continue;
  const movable=entries.filter(({o})=>redRockPullDestinations(s,o,step.root,controller,A).includes(to));
  if(!movable.length)continue;
  const bearer=group.bearer&&A.unit(s,group.bearer),moveBearer=bearer&&bearer.at===group.at&&rockLayer(bearer)===group.layer&&movable.length===entries.length&&rockForceAllowed(s,bearer,controller,A)&&rockFits(s,bearer,to,A);
  if(moveBearer)moves.set(bearer.uid,{o:bearer,to});
  for(const {entry:e,o} of movable){
   if(e.entity==='unit')moves.set(o.uid,{o,to});
   else artifactMoves.set(o.uid,{o,to,detach:!!o.bearer&&!moveBearer});
  }
 }
 // No state-based checks/entry triggers occur between these assignments.
 for(const {o,to} of moves.values()){o.at=to;o.notRest=true;}
 for(const {o,to,detach} of artifactMoves.values()){o.at=to;if(detach)o.bearer=null;}
 return true;
}

/** Record the actual playing player, which need not be the resulting site's
 * controller (e.g. Heirloom Lost). Must run exactly once per PLAY, not whenever
 * a site is transformed/moved or a token enters without being cast. */
export function finalThronePlayed(s,player,c,A){
 const cost=c.type==='Site'?0:c.cost;
 for(const throne of s.artifacts||[])if(active(throne,A)&&slug(throne,A)==='the_immortal_throne'&&(throne.finalThroneLevel||0)===cost){
  A.queueEffects(s,[{op:'finalThrone',throne:throne.uid,player}],throne,player,throne.card);
 }
}
function resolveFinalThrone(s,frame,A){
 const {step,selected}=frame,p=step.player;
 if(selected===undefined){s.choice={player:p,title:'The Immortal Throne · 選擇抽取的牌庫',options:[{label:'抽一張法術',value:'spells'},{label:'抽一張地點',value:'atlas'}],frame};return true;}
 if(!['spells','atlas'].includes(selected))throw Error('Throne requires choosing a deck');
 // Empty-deck loss is explicitly part of Winning the Game. Keep it correct
 // here even when restoring a game produced by the older draw implementation.
 if(!s.players[p][selected].length){s.winner=1-p;s.phase='over';A.log?.(s,'The Immortal Throne：嘗試從空牌庫抽牌，對手獲勝。');return true;}
 A.draw(s,p,selected);
 const throne=[...s.artifacts||[],...s.units||[]].find(o=>o.uid===step.throne);
 if(throne){throne.finalThroneLevel=(throne.finalThroneLevel||0)+1;A.log?.(s,'The Immortal Throne 升至 '+throne.finalThroneLevel+' 級。');}
 return true;
}
export function finalThroneWinners(s,A){
 const winners=new Set();
 for(const throne of s.artifacts||[])if(active(throne,A)&&slug(throne,A)==='the_immortal_throne'&&(throne.finalThroneLevel||0)>=8){
  // A dying unit remains in the realm until its burial resolves and therefore
  // still prevents 'alone'; its Deathrite may create a replacement blocker.
  const here=(s.units||[]).filter(u=>cells(u,A).includes(throne.at)&&rockLayer(u)===rockLayer(throne));
  if(here.length===1&&!here[0].dying&&A.card(here[0].card).type==='Avatar')winners.add(here[0].controller);
 }
 return [...winners];
}
export function checkFinalThroneVictory(s,A){
 if(s.winner!==null)return false;
 const winners=finalThroneWinners(s,A);
 if(winners.length>1){s.winner=s.active;s.phase='over';A.log?.(s,'The Immortal Throne · 專案裁定：雙方同時符合，當前回合玩家獲勝。');return true;}
 if(!winners.length)return false;
 s.winner=winners[0];s.phase='over';A.log?.(s,'The Immortal Throne：單獨佔據八級王座的 Avatar 獲勝。');return true;
}
