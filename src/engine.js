import {deferCopyEntry,resolveCopying,returnCopies} from './copying.js';
import {resolveMetamorphosis,handTransformActions,commitHandTransform,morphAbilityAvailable} from './metamorphosis.js';
import {dreamCasterChoices,resolveDream} from './dreams.js';
import {mandatoryBattleActions,maskStrikeMultiplier,captureAfterAttack,resolveBattle} from './battle-obligations.js';
import {queueAttackReactions,queueSturmReactions,resolveAttackReaction,peaceAllowsAttack,advanceTruces} from './attack-reactions.js';
import {borderNeighbors,borderMoveAllowed,borderCrossings,sphereAt,resolveBorder,wallCanMove} from './borders.js';
import {collectionCastEntries,collectionAbilityAvailable,resolveCollection} from './collection.js';
import {topSpellAccess as readTopSpellAccess,topCastEntries} from './top-casting.js';
import {siteMultiplier,refreshCompletionTerrain,resolveCompletion} from './completion-cards.js';
import {runtimeCard} from './cards.js';
import {hasElement} from './cards.js';
import {resolveFifty,fiftyForceAllowed} from './fifty-cards.js';
import {carryRule,carryChoices,passengers,bringPassenger,boardPassenger,dropPassenger,movePassengers,refreshPassengers} from './transport.js';
import {cards as cardCatalog} from './cards.js';
﻿import { card, elements, validateDeck, printedKeywords } from './cards.js';
import { definitions, passives } from './definitions.js';
import { queueEffects, drainEffects, chooseEffect } from './storyline.js';
import { locations, region as getRegion, waterSite, siteAffinity,bodyOfWater,canEnterOnGround,regionalDistance,occupied,siteBaseResources,siteResourceGift,unitPower } from './geography.js';
import { equipment, areaAuras, area, inside, matches } from './objects.js';
import {sitePassives,inBackRow} from './site-cards.js';
import {syncGraves,graveEntries,appendGrave,takeGrave,removeGraves} from './cemetery.js';
import {towerSites} from './beta-completion.js';
export const WIDTH = 5, HEIGHT = 4;
export const position = n => ({ x: n % WIDTH, y: Math.floor(n / WIDTH) });
export const distance = (a,b) => { a=position(a); b=position(b); return Math.abs(a.x-b.x)+Math.abs(a.y-b.y); };
export const nearby = (a,b) => { a=position(a); b=position(b); return Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y))<=1; };
const clone = x => structuredClone(x);
const assert = (v, m) => { if (!v) throw Error(m); };
export function random(s) { s.rng = (Math.imul(s.rng,1664525)+1013904223)>>>0; return s.rng/4294967296; }
function shuffle(s, a) { for(let i=a.length-1;i>0;i--) { const j=Math.floor(random(s)*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function rollIndex(s,labels){
  const r=s.randomReplay;if(!r)return Math.floor(random(s)*labels.length);
  const cursor=r.cursor++;if(cursor<r.rolls.length){const value=r.rolls[cursor];r.consumed.push(value);return value;}
  const charms=(s.artifacts||[]).filter(a=>passives[card(a.card).slug]?.luckyCharm&&artifactController(s,a)===r.player&&!disabled(unit(s,a.bearer))).length;
  if(!charms){const value=Math.floor(random(s)*labels.length);r.consumed.push(value);return value;}
  const results=Array.from({length:1+charms},()=>Math.floor(random(s)*labels.length));throw {lucky:true,results,labels,rng:s.rng,rolls:r.consumed};
}
function resolveRandomAware(s,frame){
  if(frame.step.op==='luckyResume')return resolveRandomAware(s,{...frame.step.original,rolls:[...(frame.step.original.rolls||[]),frame.selected]});
  const before=clone(s);s.randomReplay={player:frame.controller,rolls:frame.rolls||[],cursor:0,consumed:[]};
  try{resolveStep(s,frame);enforceBorders(s,before);if(!['unitStep','fiftyPathStep','travelStep','forcedWaterStep','reactionBladeStep','reactionSturm'].includes(frame.step.op))for(const old of before.units){const u=unit(s,old.uid);if(u&&(u.at!==old.at||(u.layer||'surface')!==(old.layer||'surface'))&&!fiftyForceAllowed(before,old,frame.controller,fiftyAPI)){const siteMoved=before.board[old.at]?.uid&&s.board[u.at]?.uid===before.board[old.at].uid&&s.board[old.at]?.uid!==before.board[old.at].uid;if(!siteMoved){u.at=old.at;u.layer=old.layer||'surface';}}}delete s.randomReplay;}catch(e){if(!e.lucky)throw e;for(const key of Object.keys(s))delete s[key];Object.assign(s,before);s.rng=e.rng;s.choice={player:frame.controller,title:'Lucky Charm · 選擇一個隨機結果',options:e.results.map((value,i)=>({label:'結果 '+(i+1)+'：'+e.labels[value],value})),frame:{source:frame.source,controller:frame.controller,effectCard:frame.effectCard,step:{op:'luckyResume',original:{...frame,rolls:e.rolls}}}};}
}
function enforceBorders(s,before){
 for(const old of before.units){const u=unit(s,old.uid);if(!u||u.at===old.at&&(u.layer||'surface')===(old.layer||'surface'))continue;
  const siteMoved=before.board[old.at]?.uid&&s.board[u.at]?.uid===before.board[old.at].uid&&s.board[old.at]?.uid!==before.board[old.at].uid;if(siteMoved)continue;
  const from=occupied(old),to=occupied(u),teleport=!!u.carryTeleport;
  if(!to.every((at,i)=>borderMoveAllowed(before,old,{at:from[i],layer:old.layer},{at,layer:u.layer},card,keywords,teleport,!!u.carryFlying,power(old)))){u.at=old.at;u.layer=old.layer||'surface';}
 }
}
function log(s,text) { s.log.push({turn:s.turn,text}); }
function startEvent(s,source,effectCard,bookkeeping=false){
  const isUnit=source&&['Avatar','Minion'].includes(card(source.card).type),magic=effectCard&&card(effectCard).type==='Magic';
  s.eventContext={effectCard,fallback:!bookkeeping&&isUnit?[clone(unit(s,source.uid)||source)]:[],priority:magic?2:3,credits:{},triggers:[],survivors:[],strongest:[0,1].map(p=>Math.max(0,...s.units.filter(u=>u.controller!==p&&!u.dying&&card(u.card).type==='Minion').map(u=>power(u))))};
}
function creditUnit(s,target,source){
  if(!source||!['Avatar','Minion'].includes(card(source.card).type)||!s.eventContext)return;
  const e=s.eventContext,list=e.credits[target.uid]||(e.credits[target.uid]=[]);if(!list.some(u=>u.uid===source.uid))list.push(clone(unit(s,source.uid)||source));
}
function eventTrigger(s,source,steps){const live=unit(s,source.uid);if(live)live.notRest=true;if(s.eventContext)s.eventContext.triggers.push({source:clone(source),steps,controller:source.controller});else queueEffects(s,steps,source,source.controller);}
function makeUnit(s,id,owner,at) {
  const c=card(id); const u={uid:'u'+s.next++,card:id,owner,controller:owner,at,tapped:false,born:s.turn,damage:0,
    ward:printedKeywords(c).includes('Ward')&&!c.umbrellas.includes('Evil'),stealth:printedKeywords(c).includes('Stealth'),mods:[]};
  u.stamp=s.next-1;u.summonedAt=at;u.justEntered=true;if(c.slug==='mountain_giant')u.size=2;s.units.push(u); return u;
}
export function newGame(decks, seed=20261029, mode='ai') {
  decks.forEach(d=>assert(!validateDeck(d).length,validateDeck(d).join('；')));
  const s={version:1,rng:seed>>>0,seed,mode,turn:1,active:0,phase:'mulligan',mulligan:0,next:1,winner:null,
    board:Array(20).fill(null),units:[],players:[],pending:null,log:[],history:[]};
  s.firstPlayer=Math.floor(random(s)*2);s.active=s.firstPlayer;s.mulligan=s.firstPlayer;
  for(let p=0;p<2;p++) {
    const d=decks[p]; s.players.push({name:p===0?'你':mode==='ai'?'灰燼賢者 · AI':'玩家二',life:20,maxLife:20,doorTurn:null,
      collection:[...(d.collection||[])],collectionMode:d.collectionMode||'constructed',turnsTaken:p===s.firstPlayer?1:0,hand:[],atlas:shuffle(s,[...d.atlas]),spells:shuffle(s,[...d.spells]),cemetery:[],banished:[],spent:0});
    const createdAvatar=makeUnit(s,d.avatar,p,p===0?17:2);if(passives[card(d.avatar).slug]?.completionHarbinger){createdAvatar.harbingerSquares=[];while(createdAvatar.harbingerSquares.length<3){const at=Math.floor(random(s)*20);if(!createdAvatar.harbingerSquares.includes(at))createdAvatar.harbingerSquares.push(at);}}
    for(let i=0;i<3;i++) { draw(s,p,'atlas'); draw(s,p,'spells'); }
    if(passives[card(d.avatar).slug]?.extraOpeningSpell)draw(s,p,'spells');
  }
  log(s,'對局建立。雙方各抽 3 張 Atlas 地點與 3 張 Spellbook 法術；'+s.players[s.firstPlayer].name+' 隨機取得先手，首回合不抽牌。'); return s;
}
export function unit(s,id) { return s.units.find(u=>u.uid===id); }
export function spellcaster(s,id,layer='surface'){const found=unit(s,id)||(s.artifacts||[]).find(o=>o.uid===id);if(found)return found;if(typeof id==='string'&&id.startsWith('site:')){const at=Number(id.slice(5)),site=s.board[at];if(site)return {...site,uid:id,at,layer};}return undefined;}
export function avatar(s,p) { return s.units.find(u=>u.controller===p&&card(u.card).type==='Avatar'); }
export function carriable(c){return c.type==='Artifact'&&!c.subtypes.some(t=>['Monument','Automaton'].includes(t));}
export function pickupItems(s,u){const limit=!u.silenced?passives[card(u.card).slug]?.pickupCarriedCost:undefined;return (s.artifacts||[]).filter(a=>carriable(card(a.card))&&sameLocation(s,a,u)&&(!a.bearer||a.bearer!==u.uid&&limit!==undefined&&(card(a.card).cost||0)<=limit));}
export function canDropArtifact(s,a){const bearer=unit(s,a.bearer);return !(bearer&&!bearer.silenced&&!disabled(bearer)&&passives[card(bearer.card).slug]?.cannotDropAll)&&!passives[card(a.card).slug]?.cannotDrop&&!(s.auras||[]).some(v=>areaAuras[card(v.card).slug]?.cursedEquipment&&inside(v,a.at));}
export function artifactController(s,a){return carriable(card(a.card))?unit(s,a.bearer)?.controller??null:a.controller??a.owner;}
export function castingCard(s,a) {
  const pl=s.players[a.player];
  if(a.top!==undefined)return a.top.player===a.player&&pl.spells[0]===a.top.card?card(a.top.card):null;
  if(a.collection!==undefined)return pl.collection?.[a.collection]===a.card&&(s.collectionPermissions||[]).some(e=>e.uid===a.permit&&e.player===a.player&&e.caster===a.caster)?card(a.card):null;
  const id=a.bound!==undefined?(s.boundSpells||[]).find(h=>h.uid===a.bound&&spellcaster(s,h.unit)?.controller===a.player)?.card:a.grave!==undefined?s.players[a.graveOwner??a.player].cemetery[a.grave]:pl.hand.find(h=>h.uid===a.hand)?.card;
  return id===undefined?null:card(id);
}
export function keywords(u) { const all=[...(u.fiftyFlying?['Airborne']:[]),...(u.silenced?[]:printedKeywords(card(u.card))),...(u.grantedKeywords||[]),...(u.carryKeywords||[]),...(u.transportImmobile?['Immobile']:[]),...(u.whaleArmor&&power(u)<3?['Immobile']:[]),...u.mods.flatMap(m=>m.keyword?[m.keyword]:[])].filter(k=>!(u.deniedKeywords||[]).includes(k)&&!(k==='Immobile'&&!u.silenced&&passives[card(u.card).slug]?.cannotDisable));return disabled(u)?all.filter(k=>['Landbound','Waterbound'].includes(k)):all; }
export function power(u,defense=false) {
  return unitPower(u,card,defense);
}
export function unitUmbrellas(u){return [...new Set([...card(u.card).umbrellas,...(u.copyEvil?['Evil']:[]),...(unitTypes(u).some(t=>['Demon','Undead'].includes(t))?['Evil']:[])])];}
export function unitTypes(u){return [...new Set([...((u.mods||[]).slice().reverse().find(m=>m.replaceTypes)?.replaceTypes||card(u.card).subtypes).filter(t=>!u.completionBower||t!=='Mortal'),...(u.completionBower?['Beast']:[]),...u.grantedTypes||[],...(u.mods||[]).flatMap(m=>m.types||[])])];}
export function disabled(u) { if(u.fiftyOnslaught||!u.silenced&&passives[card(u.card).slug]?.cannotDisable)return false;return !!u.completionDisabled||!!u.restraintDisabled||!!u.carryDisabled||!!u.bellyDisabled||!!u.effectDisabled||!!u.boundDisabled||!!u.conditionDisabled||(u.mods||[]).some(m=>m.disabled||m.asleep); }
export function ready(s,u) { return !u.dying&&!u.tapped&&!disabled(u)&&(card(u.card).type==='Avatar'||u.born<s.turn||keywords(u).includes('Charge')); }
function untap(s,u){
  if(!u||!u.tapped)return false;
  if(card(u.card).type==='Minion'&&s.units.some(v=>v.uid!==u.uid&&!v.dying&&!v.silenced&&!disabled(v)&&passives[card(v.card).slug]?.preventOtherUntap))return false;
  if(u.skipUntap){u.skipUntap=false;return false;}u.tapped=false;return true;
}
function bindControl(s,u,p,expiry){(s.boundControls||(s.boundControls=[])).push({target:u.uid,controller:p,stamp:s.next++,...expiry});}
function targetDeclared(s,source,selected){const actor=unit(s,source?.uid),target=selected?.entity==='unit'?unit(s,selected.uid):null;if(actor&&target&&!actor.silenced&&!disabled(actor)&&passives[card(actor.card).slug]?.untapOnWeakerTarget&&card(target.card).type==='Minion'&&power(target)<power(actor))untap(s,actor);}
export const region=(s,u)=>getRegion(s,u,card);
const sameLocation=(s,a,b)=>occupied(a).some(at=>occupied(b).includes(at))&&region(s,a)===region(s,b);
export function resources(s,p,skipCities=false) {
  const r={mana:0,air:0,earth:0,fire:0,water:0};
  for(const u of s.units)if(u.controller===p&&card(u.card).slug==='island_leviathan_monster')r.water+=card(u.card).water;else if(u.controller===p&&card(u.card).slug==='__behemoth_demon')r.fire+=card(u.card).fire;
  for(const site of s.board)if(site?.controller===p&&passives[card(site.card).slug]?.enemyUniqueGraveMana)r.mana+=s.players[1-p].cemetery.filter(id=>card(id).type==='Minion'&&card(id).rarity==='Unique').length;
  for(const [at,site] of s.board.entries())if(site){const c=card(site.card),d=sitePassives[c.slug];if(site.controller!==p&&!d?.everyone||d?.backRowOnly&&!inBackRow(at,site.controller))continue;if(c.slug!=='rubble'&&!d?.noMana&&siteBaseResources(s,at,card))r.mana+=(1+siteResourceGift(s,at,card))*siteMultiplier(s,at);const affinity=siteAffinity(s,at,card);if(!s.units.some(u=>u.at===at&&!u.dying&&!u.silenced&&!disabled(u)&&passives[card(u.card).slug]?.noSiteThreshold))for(const e of elements)r[e]+=(affinity[e]+(site.bonusTurn===s.turn&&!(e==='water'&&affinity.dry)?(site.bonusThreshold?.[e]||0):0))*siteMultiplier(s,at);}
  for(const aura of s.auras||[]){const d=areaAuras[card(aura.card).slug];if(d?.mana)r.mana+=area(aura.at).filter(at=>s.board[at]?.controller===p).reduce((n,at)=>n+d.mana*siteMultiplier(s,at),0);}
  for(const a of s.artifacts||[]){const bearer=unit(s,a.bearer),d=equipment[card(a.card).slug],relic=passives[card(a.card).slug];if(bearer?.controller===p){if(d){r.mana+=d.mana||0;if(d.threshold)r[d.threshold]++;}if(relic?.voidMana&&region(s,bearer)==='void')r.mana+=relic.voidMana;}}
  for(const u of s.units) if(u.controller===p&&!disabled(u)) {
    if(card(u.card).handler==='mana') r.mana++;
    if(card(u.card).handler==='fireThreshold') r.fire++;
    if(!u.silenced&&passives[card(u.card).slug]?.threshold)r[passives[card(u.card).slug].threshold]++;
    if(!u.silenced&&passives[card(u.card).slug]?.allThreshold)for(const e of elements)r[e]+=passives[card(u.card).slug].allThreshold;
    if(!u.silenced&&passives[card(u.card).slug]?.enemyAvatarMana&&nearby(u.at,avatar(s,1-p).at)&&region(s,u)===region(s,avatar(s,1-p)))r.mana+=passives[card(u.card).slug].enemyAvatarMana;
  }
  r.mana+=(s.players[p].bonusMana||0);
  for(const e of elements)r[e]+=s.players[p].bonusAffinity?.[e]||0;
  if(!skipCities){let opponentThreshold=null;for(const site of s.board)if(site&&!site.silenced){const d=sitePassives[card(site.card).slug];if(site.controller===p&&d?.manaThreshold&&r[d.manaThreshold]>=1)r.mana++;if(site.controller===1-p&&d?.enemyManaThreshold){if(!opponentThreshold)opponentThreshold=resources(s,1-p,true);if(opponentThreshold[d.enemyManaThreshold]>=1)r.mana++;}}}
  r.available=p===s.active?Math.max(0,r.mana-s.players[p].spent):0; return r;
}
function draw(s,p,deck,boundTo=null,bottom=false) {
  const player=s.players[p];
  const duringTurn=s.phase!=='mulligan';if(duringTurn&&player.drawTurn!==s.turn){player.drawTurn=s.turn;player.spellsDrawn=0;player.cardsDrawn=0;}
  if(duringTurn&&deck==='spells'&&player.spellsDrawn>=1&&s.board.some(site=>site&&!site.silenced&&!site.disabled&&passives[card(site.card).slug]?.oneSpellDrawPerTurn)){log(s,'Garden of Eden 阻止本回合額外抽取法術。');return null;}
  if(player[deck].length) { const id=bottom?player[deck].pop():player[deck].shift();if(boundTo)(s.boundSpells||(s.boundSpells=[])).push({uid:'b'+s.next++,card:id,unit:boundTo,owner:p});else player.hand.push({uid:'h'+s.next++,card:id});if(duringTurn&&deck==='spells')player.spellsDrawn++;
    if(duringTurn)player.cardsDrawn=(player.cardsDrawn||0)+1;
    for(const a of s.artifacts||[]){if(passives[card(a.card).slug]?.tapStrongestOnDraw)queueEffects(s,[{op:'chainsTap'}],a,p);const av=avatar(s,p);if(duringTurn&&av&&!a.silenced&&!a.disabled&&passives[card(a.card).slug]?.drawLifeLoss&&occupied(av).some(at=>nearby(at,a.at))&&region(s,av)===region(s,a))queueEffects(s,[{op:'castLifeLoss',player:p,amount:player.cardsDrawn}],a,artifactController(s,a));}
    for(const u of s.units)if(!u.dying&&!u.silenced&&!disabled(u)&&u.controller!==p&&passives[card(u.card).slug]?.opponentDrawCatchup&&player.hand.length>s.players[u.controller].hand.length)eventTrigger(s,u,[{op:'queenCatchup',opponent:p}]);
    return id; }
  log(s,player.name+' 的 '+deck+' 已空，未抽牌。'); return null;
}
function loseLife(s,p,n,damage=false,cause=null) {
  if(!damage&&cause&&['Minion','Avatar'].includes(card(cause.card).type)&&(s.artifacts||[]).some(a=>passives[card(a.card).slug]?.nearbyStrikeLifeCap&&nearby(a.at,cause.at)&&region(s,a)===region(s,cause)))n=Math.min(n,2);
  if(n<=0)return;
  const pl=s.players[p];
  if(pl.doorTurn!==null) { if(damage&&pl.doorTurn!==s.turn) { s.winner=1-p; s.phase='over'; log(s,pl.name+' 遭受致命一擊。'); } return; }
  pl.life=Math.max(0,pl.life-n);
  pl.lostLifeTurn=s.turn;
  if(pl.life===0) { pl.doorTurn=s.turn; log(s,pl.name+' 進入 Death’s Door，本回合免於死亡。'); }
}
function hurt(s,u,n,lethal=false,kind=null,damageSource=null) {
  if(!u)return 0;
  if(damageSource)damageSource=unit(s,damageSource.uid)||damageSource;
  const fromUnit=damageSource&&kind!=='magic'&&['Minion','Avatar'].includes(card(damageSource.card).type);
  if(fromUnit&&(s.artifacts||[]).some(a=>passives[card(a.card).slug]?.nearbyUnitDamageFloor&&nearby(a.at,damageSource.at)&&region(s,a)===region(s,damageSource)))n=Math.max(n,2);
  if(n<=0)return 0;
  const effect=s.eventContext?.effectCard?card(s.eventContext.effectCard):null;
  const damageCard=kind==='strike'&&damageSource?card(damageSource.card):effect||(damageSource?card(damageSource.card):null);
  const carried=(s.artifacts||[]).filter(a=>a.bearer===u.uid);
  if(!u.silenced&&!disabled(u)&&passives[card(u.card).slug]?.immuneOrdinary&&damageCard?.rarity==='Ordinary')return 0;
  if(fromUnit&&carried.some(a=>passives[card(a.card).slug]?.bearerImmunePower<=power(damageSource)))return 0;
  if(carried.some(a=>passives[card(a.card).slug]?.elementalSword)&&elements.every(e=>hasElement(card(u.card),e)))return 0;
  const chain=s.fiftyDamageChain||[];const redirect=s.units.find(v=>v.uid!==u.uid&&!v.dying&&v.controller===u.controller&&!disabled(v)&&!chain.includes(v.uid)&&((!v.silenced&&passives[card(v.card).slug]?.fiftyRedirectAll)||(!v.silenced&&passives[card(v.card).slug]?.fiftyRedirectAvatar&&card(u.card).type==='Avatar'||v.mods.some(m=>m.fiftyFaith))&&nearby(v.at,u.at)&&region(s,v)===region(s,u)));if(redirect){s.fiftyDamageChain=[...chain,u.uid];try{return hurt(s,redirect,n,lethal,kind,damageSource);}finally{if(chain.length)s.fiftyDamageChain=chain;else delete s.fiftyDamageChain;}}
  if(kind==='strike'){
    const helmet=carried.find(a=>passives[card(a.card).slug]?.returnPreventStrike);if(helmet){removeObject(s,helmet,'hand');return 0;}
    for(const a of s.artifacts||[])if(passives[card(a.card).slug]?.doubleStrikeAgainstUnits){if(a.bearer===u.uid)n*=2;if(a.bearer===damageSource?.uid)n*=2;}
    if(damageSource&&(s.artifacts||[]).some(a=>passives[card(a.card).slug]?.nearbyStrikeLifeCap&&nearby(a.at,damageSource.at)&&region(s,a)===region(s,damageSource)))n=Math.min(n,2);
  }
  if(card(u.card).type==='Minion'&&(s.artifacts||[]).some(a=>passives[card(a.card).slug]?.nearbyDamageLethal&&occupied(u).some(at=>nearby(a.at,at))&&region(s,a)===region(s,u)))lethal=true;
  const protection=!u.silenced&&!disabled(u)?passives[card(u.card).slug]:null;
  if(protection?.replaceFireDamagePower&&damageCard?.fire>0){u.mods.push({power:1,end:s.turn});log(s,card(u.card).name+' 將火焰傷害替代為本回合 +1 力量。');return 0;}
  if(kind!=='strike')for(const v of s.units)if(!v.dying&&!v.silenced&&!disabled(v)&&passives[card(v.card).slug]?.doubleNonStrikeNearby&&nearby(v.at,u.at)&&region(s,v)===region(s,u))n*=2;
  const fromMinion=fromUnit&&card(damageSource.card).type==='Minion';
  if(fromUnit){const passive=!u.silenced&&!disabled(u)?passives[card(u.card).slug]:null,types=unitTypes(damageSource),sourcePower=power(damageSource);
    if(passive?.immunePowerAtLeast&&sourcePower>=passive.immunePowerAtLeast||fromMinion&&passive?.immuneTypes?.some(t=>types.includes(t)))return 0;
    for(const ally of s.units)if(ally.controller===u.controller&&!ally.dying&&!ally.silenced&&!disabled(ally)&&nearby(ally.at,u.at)&&region(s,ally)===region(s,u)){
      const p=passives[card(ally.card).slug],shield=p?.protectAllyTypesFromPower;
      if(fromMinion&&p?.protectFromTypes?.some(t=>types.includes(t))||shield&&sourcePower>=shield.power&&shield.types.some(t=>unitTypes(u).includes(t)))return 0;
    }
  }
  for(const e of s.ongoingEffects||[])if(e.op==='shieldWall'&&e.controller===u.controller)n-=s.units.filter(v=>v.uid!==u.uid&&v.controller===u.controller&&!v.dying&&nearby(v.at,u.at)&&region(s,v)===region(s,u)).length;
  if(n<=0)return 0;
  if(kind==='magic'&&(u.iceMagicProtection||!disabled(u)&&(u.magicProtected||u.magicDamageProtected)))return 0;
  if(protection?.preventFireDamage&&damageCard?.fire>0)return 0;
  if(protection?.preventFireSpellDamage&&damageCard?.category==='Spell'&&damageCard.fire>0||protection?.preventDesertDamage&&effect?.type==='Site'&&effect.subtypes.includes('Desert'))return 0;
  for(const source of s.units)if(source.controller===u.controller&&!source.dying&&!source.silenced&&!disabled(source)&&nearby(source.at,u.at)&&region(s,source)===region(s,u))n-=passives[card(source.card).slug]?.nearbyPrevent||0;
  if(!u.silenced&&!disabled(u))n=Math.max(0,n-(passives[card(u.card).slug]?.preventDamage||0));
  if(n===0)return 0;
  if(!u.silenced&&!disabled(u)&&passives[card(u.card).slug]?.preventFirstDamage&&u.preventedTurn!==s.turn){u.preventedTurn=s.turn;return 0;}
  if(!disabled(u)&&power(u)>3&&carried.some(a=>passives[card(a.card).slug]?.whaleArmor)&&u.whalePreventedTurn!==s.turn&&u.damageTakenTurn!==s.turn){u.whalePreventedTurn=s.turn;return 0;}
  const barricade=(s.artifacts||[]).find(o=>!o.silenced&&!o.disabled&&passives[card(o.card).slug]?.fiftyBarricade&&artifactController(s,o)===u.controller&&sameLocation(s,u,o));if(barricade){const event=s.eventContext;if(event){if(!event.fiftyBarricades)event.fiftyBarricades={};event.fiftyBarricades[barricade.uid]=(event.fiftyBarricades[barricade.uid]||0)+n;}else if(n>=3)removeObject(s,barricade,'cemetery');return 0;}
  if(s.eventContext)s.eventContext.fiftyReceipt={uid:u.uid,at:u.at,amount:n};
  if(u.ward||s.damageWindow?.wards.includes(u.uid)) { if(u.ward)log(s,card(u.card).name+' 的 Ward 阻擋傷害。');u.ward=false;return 0; }
  if(card(u.card).type==='Avatar')loseLife(s,u.controller,n,true);
  else { u.mods=u.mods.filter(m=>!m.asleep);u.damage+=n; if(lethal&&!u.lethalImmune)u.lethal=true;if(!lethal&&!u.silenced&&!disabled(u)&&passives[card(u.card).slug]?.healNonlethal){if(s.damageWindow){if(!s.damageWindow.hydras)s.damageWindow.hydras=[];if(!s.damageWindow.hydras.includes(u.uid))s.damageWindow.hydras.push(u.uid);}else if(u.damage<power(u,true))u.damage=0;} }
  u.damageTakenTurn=s.turn;if(fromUnit)creditUnit(s,u,damageSource);
  if(!u.silenced&&!disabled(u)&&passives[card(u.card).slug]?.skeletonOnMoveHurt)eventTrigger(s,u,[{op:'armySkeleton',at:u.at,layer:u.layer||'surface'}]);
  if(!u.silenced&&!disabled(u)&&passives[card(u.card).slug]?.healWhenHurt)eventTrigger(s,u,[{op:'heal',amount:passives[card(u.card).slug].healWhenHurt}]);
  if(s.eventContext&&card(u.card).type==='Minion')for(const v of s.units)if(!v.silenced&&!disabled(v)&&v.controller===u.controller&&passives[card(v.card).slug]?.healSurvivingAllies&&nearby(v.at,u.at)&&region(s,v)===region(s,u)&&!s.eventContext.survivors.some(e=>e.target===u.uid&&e.source.uid===v.uid))s.eventContext.survivors.push({source:clone(v),target:u.uid});
  return n;
}
function healingAmount(s,n){for(const site of s.board)if(site&&sitePassives[card(site.card).slug]?.halveHealing)n=Math.floor(n/2);return n;}
function pullDestinations(s,u,root,requireBody=true){const body=bodyOfWater(s,root,card),result=new Set();for(const cell of occupied(u))if(!requireBody||body.has(cell)){if(u.size===2&&cell===root)result.add(u.at);for(let next=0;next<20;next++)if(distance(cell,next)===1&&distance(next,root)<distance(cell,root)){const at=u.at+next-cell;if(at<0||at>=20||u.size===2&&(at%5>3||at>=15))continue;const from=occupied(u),to=occupied({...u,at});if(to.every((v,i)=>region(s,{at:v,layer:u.layer})===region(s,{at:from[i],layer:u.layer})&&(from.includes(v)||canEnterOnGround(s,u,{at:from[i],layer:u.layer},{at:v,layer:u.layer},card,keywords))))result.add(at);}}return [...result];}
function heal(s,p,n) { const pl=s.players[p];if(pl.doorTurn===null&&!sphereAt(s,avatar(s,p),card))pl.life=Math.min(pl.maxLife,pl.life+healingAmount(s,n)); }
function fullyHeal(s,u){if(card(u.card).type==='Avatar'){const p=s.players[u.controller];if(p.doorTurn===null&&!sphereAt(s,u,card))p.life=p.maxLife;}else u.damage=0;}
function deathReplacements(s,u){if(card(u.card).type!=='Minion')return [];return [...s.artifacts.filter(a=>a.bearer===u.uid&&!a.silenced&&passives[card(a.card).slug]?.saveBearerDeath).map(a=>({kind:'aegis',uid:a.uid,label:card(a.card).name})),...s.units.filter(v=>v.uid!==u.uid&&!v.dying&&!v.silenced&&!disabled(v)&&v.controller===u.controller&&passives[card(v.card).slug]?.returnDyingAllies&&occupied(u).some(at=>nearby(at,v.at))&&region(s,u)===region(s,v)).map(v=>({kind:'lady',uid:v.uid,label:card(v.card).name+' · 返回手牌'}))];}
function replaceDeath(s,u,option){if(option.kind==='aegis'){const a=s.artifacts.find(a=>a.uid===option.uid);if(!a)return;removeObject(s,a,'banished');fullyHeal(s,u);u.lethal=false;}else leaveUnit(s,u,'hand');}
function kill(s,u,banish=false,death=false,sacrifice=false) {
  if(!u||u.dying||u.deathReplacementPending||!unit(s,u.uid)||card(u.card).type==='Avatar')return;
  if(!banish&&!death&&u.ward){u.ward=false;return;}
  if(banish){leaveUnit(s,u,'banished');return;}
  if(u.damionSource){const damion=unit(s,u.damionSource);if(damion&&!damion.dying&&nearby(u.at,damion.at)&&region(s,u)===region(s,damion))return;}
  const replacements=sacrifice?[]:deathReplacements(s,u);if(replacements.length===1){replaceDeath(s,u,replacements[0]);return;}if(replacements.length>1){u.deathReplacementPending=true;queueEffects(s,[{op:'chooseDeathReplacement',uid:u.uid,death}],u,u.controller);return;}
  if(!sacrifice&&u.nosferatuTurn===s.turn){leaveUnit(s,u,'banished');return;}
  const e=s.eventContext,killers=e?.credits[u.uid]||e?.fallback||[],deadPower=power(u);
  if(!s.deathHistory)s.deathHistory=[];s.deathHistory.push({card:u.card,uid:u.uid,at:u.at,layer:u.layer||'surface',controller:u.controller,turn:s.turn,creditPriority:killers.length?(e?.credits[u.uid]?1:e?.priority||null):null,killers:killers.map(v=>({uid:v.uid,card:v.card,controller:v.controller}))});
  for(const [at,site] of s.board.entries())if(site&&!site.silenced&&!site.disabled&&passives[card(site.card).slug]?.evilDeathLoss&&unitUmbrellas(u).includes('Evil')&&occupied(u).some(i=>nearby(at,i)))eventTrigger(s,{...site,at,uid:'site:'+at},[{op:'castLifeLoss',player:u.controller,amount:1}]);
  if(unitTypes(u).some(t=>['Mortal','Beast'].includes(t)))for(const v of s.units)if(v.uid!==u.uid&&!v.dying&&!v.silenced&&passives[card(v.card).slug]?.wakeFromNearbyDeath&&occupied(u).some(at=>nearby(at,v.at))&&region(s,u)===region(s,v))eventTrigger(s,v,[{op:'wakeHollow',uid:v.uid}]);
  if(unitTypes(u).includes('Mortal')&&(u.layer||'surface')==='surface'&&s.board[u.at]&&!waterSite(s,u.at,card))queueGraveReturns(s,u.controller,'scourge_zombies',u.at,{layer:'surface',tapped:true,event:true});
  for(const a of s.artifacts||[]){const d=passives[card(a.card).slug],controller=artifactController(s,a);if((controller===0||controller===1)&&(d?.nearbyDeathHeal||d?.nearbyDeathLoss)&&occupied(u).some(at=>nearby(a.at,at))&&region(s,a)===region(s,u))eventTrigger(s,{...a,controller},[{op:'relicDeath',heal:d.nearbyDeathHeal||0,loss:d.nearbyDeathLoss||0}]);}
  for(const v of s.units)if(v.uid!==u.uid&&!v.silenced&&!disabled(v)&&passives[card(v.card).slug]?.gainNearbyDeadPower&&nearby(v.at,u.at)&&region(s,v)===region(s,u))eventTrigger(s,v,[{op:'gainDeathPower',uid:v.uid,amount:deadPower}]);
  if(!u.silenced&&!disabled(u)&&passives[card(u.card).slug]?.revengeOnDeath)for(const killer of killers)eventTrigger(s,u,[{op:'albatrossRevenge',killer:clone(killer)}]);
  for(const killer of killers){const p=!killer.silenced&&!disabled(killer)?passives[card(killer.card).slug]:null;
    if(e?.attack===killer.uid&&killer.controller!==u.controller&&(p?.untapAttackKill||(s.artifacts||[]).some(a=>a.bearer===killer.uid&&!a.silenced&&passives[card(a.card).slug]?.untapAttackKill)))eventTrigger(s,killer,[{op:'untapSelf',uid:killer.uid}]);
    if(e?.attack===killer.uid&&!disabled(killer)&&(killer.mods||[]).some(m=>m.warpSpasm&&m.end===s.turn))eventTrigger(s,killer,[{op:'untapSelf',uid:killer.uid}]);
    if(p?.killSkeleton&&killer.controller!==u.controller)eventTrigger(s,killer,[{op:'killSkeleton',at:u.at,layer:u.layer||'surface'}]);
    if(p?.drawAttackKill&&e?.attack===killer.uid&&killer.controller!==u.controller)eventTrigger(s,killer,[{op:'drawCards',count:1,optional:true}]);
    if(p?.drawStrongestKill&&killer.controller!==u.controller&&deadPower>=((e?.strongest||[])[killer.controller]??deadPower))eventTrigger(s,killer,[{op:'drawCards',count:1}]);
    if(unitTypes(killer).includes('Giant')&&s.units.some(v=>v.controller===killer.controller&&!v.silenced&&!disabled(v)&&passives[card(v.card).slug]?.giantsBanishKills))eventTrigger(s,killer,[{op:'giantKill',uid:killer.uid,victim:u.uid}]);
  }
  u.dying=true;
  if(!s.deaths)s.deaths=[];
  if(u.fireTrail?.length){eventTrigger(s,u,[{op:'blazeTrail',trail:u.fireTrail}]);u.fireTrail=[];}
  const geistwood=occupied(u).some(at=>s.board[at]&&sitePassives[card(s.board[at].card).slug]?.genesisAlsoDeath),c=card(u.card);
  s.deaths.push({source:clone(u),effects:!u.silenced&&!disabled(u)?[...definitions[c.slug]?.death||[],...u.addedDeath||[],...(geistwood?[...definitions[c.slug]?.genesis||[],...(c.handler==='drawSpell'?[{op:'drawOne',deck:'spells'}]:[]),{op:'deathGenesisKeywords'}]:[])]:[]});
}
function pendingMovement(s,u){const ids=new Set([u.uid]);let carrier=u;while(carrier&&(carrier.carriedBy||carrier.swallowedBy)&&!ids.has(carrier.carriedBy||carrier.swallowedBy)){ids.add(carrier.carriedBy||carrier.swallowedBy);carrier=unit(s,carrier.carriedBy||carrier.swallowedBy);}return (s.storyline||[]).some(f=>['travelStep','fiftyPathStep','unitStep','dragStep','harpoonMove','thunderTeleport','randomTeleport','forcedFlyChoice','rapidsPush','marchStep','riptideGiant','frontierMove'].includes(f.step.op)&&(ids.has(f.step.uid)||ids.has(f.source.uid)&&!f.step.uid));}
function stateBased(s,settleRest=true) {
  const teleported=new Set(s.units.filter(u=>u.carryTeleport).map(u=>u.uid)),flown=new Set(s.units.filter(u=>u.carryFlying).map(u=>u.uid));
  for(let i=0;i<s.units.length;i++)for(const u of s.units)if(u.carriedBy){if(teleported.has(u.carriedBy))teleported.add(u.uid);if(flown.has(u.carriedBy))flown.add(u.uid);}
  refreshContinuous(s);
  let dreamDispelled=false;for(const aura of [...s.auras])if(!aura.disabled&&!aura.silenced&&areaAuras[card(aura.card).slug]?.completionMidsummer&&!s.units.some(u=>!u.dying&&unitTypes(u).includes('Faerie')&&occupied(u).some(at=>inside(aura,at)))){removeObject(s,aura,'cemetery');dreamDispelled=true;}if(dreamDispelled)refreshContinuous(s);
  const entryCounts=s.board.map((site,at)=>site?s.units.filter(v=>!v.dying&&v.controller!==site.controller&&occupied(v).includes(at)&&(v.justEntered||v.observedPosition&&!(v.observedPosition.cells||[v.observedPosition.at]).includes(at))).length:0);
  for(const u of s.units){if(!u.justEntered&&u.observedTapped===false&&u.tapped&&card(u.card).type==='Minion')for(const a of s.artifacts||[])if(passives[card(a.card).slug]?.nearbyTapDraw&&occupied(u).some(at=>nearby(at,a.at))&&region(s,u)===region(s,a))queueEffects(s,[{op:'drawOne',deck:'spells'}],a,1-u.controller);u.observedTapped=!!u.tapped;}
  for(const u of s.units){const old=u.observedPosition,newEntry=u.justEntered,cells=occupied(u),newCells=newEntry?cells:old?cells.filter(at=>!(old.cells||[old.at]).includes(at)):[];u.justEntered=false;u.observedPosition={at:u.at,layer:u.layer||'surface',cells,region:region(s,u)};if(newEntry||old&&(old.at!==u.at||old.layer!==(u.layer||'surface'))){
    const left=old?(old.cells||[old.at]).filter(at=>!cells.includes(at)):[];
    for(const at of newCells){const site=s.board[at],rule=site&&!site.silenced&&!site.disabled?passives[card(site.card).slug]:null;if(!rule)continue;if(rule.completionMortimer||rule.completionTroll||rule.completionSoldOut){if(!site.uid)site.uid='s'+s.next++;const src={...site,at,uid:site.uid,layer:u.layer||'surface'};if(rule.completionMortimer&&card(u.card).type==='Minion')eventTrigger(s,src,[{op:'completionMortimer',uid:u.uid}]);if(rule.completionTroll&&u.controller!==site.controller&&entryCounts[at]===1&&site.trollBridgeTurn!==s.turn){site.trollBridgeTurn=s.turn;eventTrigger(s,src,[{op:'completionTroll',uid:u.uid}]);}if(rule.completionSoldOut&&unitTypes(u).includes('Undead'))eventTrigger(s,src,[{op:'completionSoldOut',select:{kind:'unit',types:['Undead'],here:true,excludeUid:u.uid,anyRegion:true}}]);}}
    if(card(u.card).type==='Minion'&&!u.ward&&!disabled(u)&&!unitUmbrellas(u).includes('Evil'))for(const at of left){const site=s.board[at];if(site?.ward&&!site.silenced&&!site.disabled&&sitePassives[card(site.card).slug]?.departureWard){site.ward=false;u.ward=true;break;}}
    const ownPassive=!u.silenced&&!disabled(u)?passives[card(u.card).slug]:null;
    if(old&&!newEntry)for(const crossing of borderCrossings(s,u,old,teleported.has(u.uid),flown.has(u.uid),fiftyAPI))eventTrigger(s,crossing.a,[{op:'borderHit',uid:u.uid,amount:crossing.amount}]);
    if(ownPassive?.giveOnSiteEntry)for(const at of newCells){const site=s.board[at];if(site&&site.controller!==u.controller)eventTrigger(s,u,[{op:'reactionPeace',recipient:site.controller,at,optional:true}]);}
    for(const at of newCells){const site=s.board[at];if(!site||site.silenced||site.disabled||site.completionProtected||passives[card(site.card).slug]?.immutableSite||u.controller===site.controller)continue;for(const av of s.units)if(av.controller===site.controller&&!av.dying&&!av.silenced&&!disabled(av)&&passives[card(av.card).slug]?.completionDruidBack&&nearby(av.at,at))eventTrigger(s,{...site,at,uid:site.uid||'site:'+at,layer:u.layer||'surface'},[{op:'sitePassage',uid:u.uid,damage:1}]);}
    if(card(u.card).type==='Minion')for(const at of newCells){const site=s.board[at];if(site&&!site.silenced&&!site.darkAlleyUsed&&sitePassives[card(site.card).slug]?.firstEntryStealth){site.darkAlleyUsed=true;eventTrigger(s,u,[{op:'stealthSelf'}]);}}
    if(ownPassive?.enterChosenSiteDraw&&u.questSite&&newCells.some(at=>s.board[at]?.uid===u.questSite)){delete u.questSite;eventTrigger(s,u,[{op:'drawCards',count:1},{op:'percevalSite'}]);}
    if(old&&ownPassive?.fiftyGhost&&(old.region||region(s,{at:old.at,layer:old.layer}))==='void'&&s.board[u.at])eventTrigger(s,u,[{op:'fiftyGhost'}]);
    if(old&&ownPassive?.fiftyEel&&old.layer!=='below'&&u.layer==='below'&&waterSite(s,u.at,card))eventTrigger(s,u,[{op:'fiftyEelPull'}]);
    if(old&&ownPassive?.revealOnMove)u.stealth=false;
    if(old&&!newEntry){u.movedSinceStop=true;if(ownPassive?.skeletonOnMoveHurt)eventTrigger(s,u,[{op:'armySkeleton',at:old.at,layer:old.layer}]);if(ownPassive?.unburrowDesertGenesis&&old.layer==='below'&&(u.layer||'surface')==='surface'&&(old.region||region(s,{at:old.at,layer:old.layer}))==='underground')eventTrigger(s,u,[{op:'triggerSiteGenesis',optional:true,untargeted:true,select:{kind:'site',nearby:true,siteType:'Desert',untargeted:true}}]);}
    if(ownPassive?.stealthOnVoidEntry&&newCells.some(at=>!s.board[at]))u.stealth=true;
    if(ownPassive?.voidEntryKill&&newCells.some(at=>!s.board[at]))eventTrigger(s,u,[{op:'voidEntryKill',at:u.at,layer:u.layer||'surface'}]);
    if(newEntry&&card(u.card).type==='Minion')for(const v of s.units)if(!v.dying&&!v.silenced&&!disabled(v)&&passives[card(v.card).slug]?.tapSummonedNearby&&occupied(u).some(at=>nearby(at,v.at))&&region(s,u)===region(s,v))eventTrigger(s,v,[{op:'tapSummoned',uid:u.uid}]);
    for(const at of [...left,...newCells]){const site=s.board[at],d=site&&!site.silenced&&!site.disabled?passives[card(site.card).slug]:null;if(!d)continue;const entered=newCells.includes(at);if(d.entryExitEnemyDamage&&u.controller!==site.controller||entered&&d.entryKillGroundMinion&&card(u.card).type==='Minion'&&!keywords(u).includes('Airborne'))eventTrigger(s,{...site,at,uid:'site:'+at,layer:u.layer||'surface'},[{op:'sitePassage',uid:u.uid,damage:d.entryExitEnemyDamage&&u.controller!==site.controller?d.entryExitEnemyDamage:0,destroy:!!(entered&&d.entryKillGroundMinion&&card(u.card).type==='Minion'&&!keywords(u).includes('Airborne'))}]);}
    if(old&&!u.inBasicTravel&&u.mods.some(m=>m.blaze)){const departed=(old.cells||[old.at]).filter(at=>old.layer!==(u.layer||'surface')||!cells.includes(at));if(departed.length)queueEffects(s,[{op:'blazeTrail',trail:departed.map(at=>({at,layer:old.layer}))}],u,u.controller,card('blaze').id);}
    if(passives[card(u.card).slug]?.cornerPilgrim&&[0,4,15,19].includes(u.at)){u.corners=u.corners||[];if(!u.corners.includes(u.at)){u.corners.push(u.at);if(!u.silenced&&!disabled(u))eventTrigger(s,u,[{op:'drawCards',count:1,optional:true}]);}}
    if(card(u.card).type==='Minion'&&(u.layer||'surface')==='surface')for(const a of s.auras||[])if(areaAuras[card(a.card).slug]?.entryCurse&&newCells.some(at=>waterSite(s,at,card)&&inside(a,at)))queueEffects(s,[{op:'curseEnter',uid:u.uid,at:u.at,aura:a.uid}],a,a.controller);
  }}
  for(const a of s.artifacts||[])if(passives[card(a.card).slug]?.sunkenTreasure&&a.bearer&&a.layer==='surface'&&!a.surfacePending){a.surfacePending=true;const bearer=unit(s,a.bearer);queueEffects(s,[{op:'treasureSurface',uid:a.uid}],bearer,bearer.controller,a.card);}
  for(const u of [...s.units])if(card(u.card).type!=='Avatar'&&!u.dying){
    if(u.apostlesSource&&!unit(s,u.apostlesSource)||u.apostlesSource&&unit(s,u.apostlesSource)?.dying){kill(s,u,true);continue;}
    if(card(u.card).type==='Minion'&&(u.layer||'surface')==='surface'&&['Spirit','Undead'].some(t=>unitTypes(u).includes(t))&&!waterSite(s,u.at,card))for(const a of s.auras)if(areaAuras[card(a.card).slug]?.fiftyBurrowDead&&inside(a,u.at)&&fiftyForceAllowed(s,u,a.controller,fiftyAPI)){u.layer='below';u.notRest=true;u.burrowedSafely=false;}
    if(!u.entryProcessed){u.entryProcessed=true;if(!u.silenced&&!disabled(u))for(let i=0;i<(passives[card(u.card).slug]?.entryLances||0);i++)acquireLance(s,u,u.controller);}
    const r=region(s,u),k=keywords(u),unsafe=!u.swallowedBy&&occupied(u).some(at=>{const regionName=region(s,{at,layer:u.layer});return regionName==='void'&&!k.includes('Voidwalk')||regionName==='underwater'&&!k.includes('Submerge')||regionName==='underground'&&!k.includes('Burrowing')&&!u.burrowedSafely;});
    const ash=u.layer==='below'&&s.board[u.at]&&s.board.some((v,at)=>v&&sitePassives[card(v.card).slug]?.killBelowNearby&&nearby(at,u.at));
    if(!u.swallowedBy&&occupied(u).some(at=>!s.board[at])&&!k.includes('Voidwalk'))kill(s,u,true);
    else if(unsafe||ash||!u.silenced&&!disabled(u)&&passives[card(u.card).slug]?.tetherSite&&u.summonedAt!==u.at||(u.damage>0&&u.damage>=power(u,true))||u.lethal){kill(s,u,false,true);if(u.dying&&unsafe&&r==='underwater'&&!k.includes('Submerge'))for(const [at,site] of s.board.entries())if(site&&site.controller!==u.controller&&!site.silenced&&!site.disabled&&passives[card(site.card).slug]?.completionWatery&&nearby(at,u.at))eventTrigger(s,{...site,at,uid:site.uid||'site:'+at,layer:'surface'},[{op:'armySkeleton',at:u.at,layer:'surface'}]);}
  }
  for(const [at,site] of s.board.entries())if(site&&!site.silenced&&!site.disabled&&passives[card(site.card).slug]?.completionVaults&&!site.vaultsLooted){const visitors=s.units.filter(u=>!u.dying&&u.movedSinceStop&&!pendingMovement(s,u)&&occupied(u).includes(at)&&card(u.card).type==='Avatar');if(visitors.length){site.vaultsLooted=true;for(const u of visitors)eventTrigger(s,{...site,at,uid:site.uid||'site:'+at},[{op:'completionVaults',uid:u.uid}]);}}
  for(const u of s.units)if(u.movedSinceStop&&!pendingMovement(s,u)){u.movedSinceStop=false;if(!u.dying&&!u.silenced&&!disabled(u)&&passives[card(u.card).slug]?.damageOnStop)eventTrigger(s,u,[{op:'stopDamage',amount:passives[card(u.card).slug].damageOnStop,optional:true}]);}
  for(const item of s.artifacts||[]){const old=item.observedPosition;if(old&&(old.at!==item.at||old.layer!==(item.layer||'surface')))item.movedSinceStop=true;const controller=artifactController(s,item);if(old&&(old.at!==item.at||old.layer!==(item.layer||'surface'))&&item.carryTeleport&&passives[card(item.card).slug]?.fiftySentinel){delete item.carryTeleport;queueEffects(s,[{op:'fiftyFacing'}],item,s.eventContext?.controller??controller??item.owner,item.card);}item.observedPosition={at:item.at,layer:item.layer||'surface',controller:controller??old?.controller};if(item.movedSinceStop&&!pendingMovement(s,item.bearer?unit(s,item.bearer)||item:item)){item.movedSinceStop=false;if(!item.silenced&&passives[card(item.card).slug]?.newSiteStopLife&&s.board[item.at]){const site=s.board[item.at];if(!site.uid)site.uid='s'+s.next++;if(!(item.visitedSites||[]).includes(site.uid)){(item.visitedSites||(item.visitedSites=[])).push(site.uid);const player=controller??old?.controller;if(player===0||player===1)queueEffects(s,[{op:'flameStopLife'}],item,player);}}}}
  if(s.deaths?.length){
    const deaths=s.deaths.splice(0);
    queueEffects(s,[{op:'buryMany',uids:deaths.map(d=>d.source.uid)}],deaths[0].source,deaths[0].source.controller);
    for(const d of deaths.reverse())queueEffects(s,d.effects,d.source,d.source.controller);
  }
  if(s.eventContext){const e=s.eventContext;for(const [uid,n] of Object.entries(e.fiftyBarricades||{})){if(n>=3){const o=s.artifacts.find(o=>o.uid===uid);if(o)removeObject(s,o,'cemetery');}}e.fiftyBarricades={};for(const entry of e.survivors.splice(0)){const u=unit(s,entry.target);if(u&&!u.dying)e.triggers.push({source:entry.source,controller:entry.source.controller,steps:[{op:'healSurvivor',uid:u.uid}]});}for(const event of e.triggers.splice(0).reverse())queueEffects(s,event.steps,event.source,event.controller);}
  // Apply passives and unsafe-location consequences before units return to rest.
  if(settleRest&&!s.storyline?.length&&!s.choice&&!s.pending&&s.units.some(u=>u.notRest)){for(const u of s.units)u.notRest=false;stateBased(s,false);}
}
export function reachable(s,u) {
  return new Map(locations(s,u,card,keywords).filter(n=>n.layer===(u.layer||'surface')).map(n=>[n.at,n.path.map(v=>v.at)]));
}
function leaveUnit(s,u,destination) {
  if(u.dying&&u.banishOnDeath)destination='banished';
  for(const passenger of passengers(s,u))dropPassenger(passenger);dropPassenger(u);
  for(const h of s.boundSpells||[])if(h.unit===u.uid){if(h.returnToHand)s.players[h.owner].hand.push({uid:'h'+s.next++,card:h.card});else sendCard(s,h.owner,h.card,'cemetery');}
  s.boundSpells=(s.boundSpells||[]).filter(h=>h.unit!==u.uid);
  for(const v of s.units)if(v.swallowedBy===u.uid){v.swallowedBy=null;v.bellyDisabled=false;}
  if(u.originalCard)u.card=u.originalCard;
  const c=card(u.card);let zone=c.category==='Token'||u.tokenCopy?'banished':destination;
  if(zone==='hand')s.players[u.owner].hand.push({uid:'h'+s.next++,card:u.card});
  else if(zone!=='resummon')zone=sendCard(s,u.owner,u.card,zone,u.dying?(s.deathHistory||[]).find(d=>d.uid===u.uid)?.turn??null:null);
  s.units=s.units.filter(v=>v.uid!==u.uid);
  for(const a of s.artifacts||[])if(a.bearer===u.uid){a.bearer=null;a.at=u.at;a.layer=u.layer||'surface';}
  log(s,c.name+' → '+zone);
}
function sendCard(s,p,id,zone,deathTurn=null){
  if(zone==='cemetery')for(const site of s.board)if(site?.controller===0||site?.controller===1){const d=passives[card(site.card).slug]?.cemeteryBanishThreshold;if(d&&resources(s,site.controller)[d.element]>=d.amount){zone='banished';break;}}
  if(zone==='cemetery')appendGrave(s,p,id,deathTurn);else s.players[p][zone].push(id);
  return zone;
}
function queueGraveReturns(s,p,slug,at,extra={}){
  for(const entry of graveEntries(s,p).filter(g=>card(g.card).slug===slug)){
    const source={uid:entry.uid,card:entry.card,controller:p,owner:p,at,layer:extra.layer||'surface'},steps=[{op:'graveRecur',graveUid:entry.uid,at,layer:extra.layer,tapped:!!extra.tapped}];
    if(extra.event)eventTrigger(s,source,steps);else queueEffects(s,steps,source,p);
  }
}
const transportAPI={card,power,keywords,disabled,canTarget,unitTypes};
function refreshContinuous(s) {
  refreshCompletionTerrain(s,fiftyAPI);
  movePassengers(s,transportAPI);
  for(const u of s.units)if(u.swallowedBy){const frog=unit(s,u.swallowedBy);if(!frog||u.observedPosition&&(u.at!==u.observedPosition.at||(u.layer||'surface')!==u.observedPosition.layer)){u.swallowedBy=null;u.bellyDisabled=false;}else{u.at=frog.at;u.layer=frog.layer||'surface';u.bellyDisabled=true;}}
  for(const u of s.units){
    // Migrate the old, incorrect permanent Stealth prohibition. The official
    // card FAQ removes the mark; it does not forbid a future Stealth grant.
    u.mods=u.mods.filter(m=>!m.loseStealth);u.fiftyOnslaught=(s.ongoingEffects||[]).some(e=>e.op==='fiftyOnslaught'&&e.controller===u.controller&&e.end===s.turn);u.restraintDisabled=!!u.boundSpellcaster||!!u.cocoon||u.iceTurns>0;u.iceMagicProtection=false;
    const terrain=(s.ongoingEffects||[]).filter(e=>e.op==='terrainEffect'&&s.board[u.at]&&(e.allLayers||(u.layer||'surface')==='surface')&&(!e.minion||card(u.card).type==='Minion')&&(e.nearby?nearby(e.at,u.at):e.at===u.at));u.effectDisabled=terrain.some(e=>e.disabled)||unitTypes(u).includes('Mortal')&&s.auras.some(a=>!a.silenced&&!a.disabled&&areaAuras[card(a.card).slug]?.completionMidsummer&&occupied(u).some(at=>inside(a,at)));
    u.silenced=u.completionBower||u.mods.some(m=>m.silenced)||(card(u.card).type==='Minion'&&(s.auras||[]).some(a=>areaAuras[card(a.card).slug]?.silence&&occupied(u).some(at=>inside(a,at))));u.ongoingPower=0;u.grantedTypes=(s.artifacts||[]).filter(a=>a.bearer===u.uid&&!a.silenced).flatMap(a=>passives[card(a.card).slug]?.bearerTypes||[]);u.grantedKeywords=[];u.grantedMovement=0;u.grantedRange=0;u.spellElements=[];u.deniedKeywords=[];u.zeroPower=false;u.magicProtected=false;u.whaleArmor=false;u.canSeeStealth=false;u.magicDamageProtected=false;u.projectileOver=false;u.verticalWrap=false;u.moveAxis=null;
    u.silenced=u.silenced||terrain.some(e=>e.silenced);u.grantedKeywords.push(...terrain.flatMap(e=>e.keyword?[e.keyword]:[]));
    if(u.fiftyOnslaught)u.silenced=false;u.powerSuppressed=false;u.rangeBonus=0;u.lethalImmune=false;u.unrestrictedCaster=false;
    if(s.board[u.at])u.gateVoidwalk=false;if(u.gateVoidwalk)u.grantedKeywords.push('Voidwalk');
    if(!u.silenced&&!disabled(u)&&passives[card(u.card).slug]?.towerLich&&(u.layer||'surface')==='surface'&&s.board[u.at]&&towerSites.has(card(s.board[u.at].card).slug)){u.ongoingPower+=2;u.grantedKeywords.push('Ranged','Spellcaster');u.unrestrictedCaster=true;}
    if(!u.silenced&&!disabled(u)){
      const p=passives[card(u.card).slug];
      if(p?.nonOrdinaryCaster){u.grantedKeywords.push('Spellcaster');u.unrestrictedCaster=true;}if(p?.cemeteryPower)u.ongoingPower+=s.players[u.controller].cemetery.filter(id=>card(id).subtypes.includes(p.cemeteryPower)).length;
      if(p?.cemeterySame)u.ongoingPower+=s.players[u.controller].cemetery.filter(id=>id===u.card).length;
      if(p?.nearEarthPower)u.ongoingPower+=s.board.filter((v,at)=>v&&card(v.card).earth>0&&nearby(at,u.at)).length;
    }
  }
  for(const u of s.units){if(u.fiftyOnslaught){u.silenced=false;u.ongoingPower++;u.grantedKeywords.push('Charge');u.deniedKeywords.push('Immobile');}if(!u.silenced&&!disabled(u)&&passives[card(u.card).slug]?.adjacentSitesPower)u.ongoingPower+=s.board.filter((site,at)=>site&&distance(at,u.at)===1).length;}
  for(const a of s.auras)if(!a.disabled&&!a.silenced&&areaAuras[card(a.card).slug]?.completionMidsummer){const mortals=s.units.filter(u=>!u.dying&&unitTypes(u).includes('Mortal')&&occupied(u).some(at=>inside(a,at))).length;for(const u of s.units)if(!u.dying&&unitTypes(u).includes('Faerie')&&occupied(u).some(at=>inside(a,at)))u.ongoingPower+=mortals;}
  const agartha=s.board.some(site=>site&&!site.silenced&&!site.disabled&&sitePassives[card(site.card).slug]?.allBurrowingThreshold&&resources(s,site.controller).earth>=3);if(agartha)for(const u of s.units)if(card(u.card).type==='Minion')u.grantedKeywords.push('Burrowing');
  const removers=s.units.filter(u=>!u.dying&&(passives[card(u.card).slug]?.restBasilisk||passives[card(u.card).slug]?.restAdjacent||passives[card(u.card).slug]?.silenceOtherNearby||passives[card(u.card).slug]?.disableAbove)).sort((a,b)=>(a.stamp||0)-(b.stamp||0));
  for(const source of removers)if(!source.silenced&&!disabled(source)){const d=passives[card(source.card).slug];for(const u of s.units)if(u.uid!==source.uid&&card(u.card).type==='Minion'){
    if(d.disableAbove&&source.layer==='below'&&(u.layer||'surface')==='surface'&&occupied(u).some(at=>occupied(source).includes(at)))u.effectDisabled=true;
    if(region(s,u)!==region(s,source))continue;
    if(d.restBasilisk&&!u.notRest&&occupied(u).some(at=>at===source.at||at===source.at+(source.controller===0?-5:5)))u.effectDisabled=true;
    if(d.restAdjacent&&!u.notRest&&occupied(u).some(at=>occupied(source).some(root=>distance(at,root)===1)))u.effectDisabled=true;
    if(!u.fiftyOnslaught&&d.silenceOtherNearby&&occupied(u).some(at=>occupied(source).some(root=>nearby(root,at))))u.silenced=true;
  }}
  for(const u of s.units){u.restraintDisabled=!!u.boundSpellcaster||!!u.cocoon||u.iceTurns>0||!u.silenced&&passives[card(u.card).slug]?.shackled&&!u.shacklesReleased;u.iceMagicProtection=u.iceTurns>0;}
  for(const u of s.units)if(u.fiftyOnslaught)u.silenced=false;
  for(const u of s.units){if(u.kingApplied){if(u.controller!==u.kingController)u.nativeController=u.controller;u.controller=u.nativeController;u.kingApplied=false;}}
  const kings=s.units.filter(u=>!u.dying&&!u.silenced&&!disabled(u)&&(passives[card(u.card).slug]?.mortalKing||passives[card(u.card).slug]?.undeadKing)).sort((a,b)=>(a.stamp||0)-(b.stamp||0));
  s.boundControls=(s.boundControls||[]).filter(e=>unit(s,e.target)&&(!e.source||unit(s,e.source))&&(!e.untilStealth||unit(s,e.target).stealth));
  const controls=[...kings.map(source=>({kind:'king',source,stamp:source.stamp||0})),...s.boundControls.map(e=>({...e,kind:'bound'}))].sort((a,b)=>a.stamp-b.stamp);
  for(const e of controls){const targets=e.kind==='king'?s.units.filter(u=>unitTypes(u).includes(passives[card(e.source.card).slug].undeadKing?'Undead':'Mortal')):[unit(s,e.target)];for(const u of targets){if(!u.kingApplied)u.nativeController=u.controller;u.controller=e.kind==='king'?e.source.controller:e.controller;u.kingApplied=true;u.kingController=u.controller;}}
  for(const k of kings)for(const u of s.units)if(u.uid!==k.uid&&unitTypes(u).includes(passives[card(k.card).slug].undeadKing?'Undead':'Mortal'))u.ongoingPower++;
  for(const a of s.artifacts||[]){
    const u=unit(s,a.bearer),d=equipment[card(a.card).slug];a.controller=artifactController(s,a);if(u){a.at=u.at;a.layer=u.layer||'surface';}
    const passive=passives[card(a.card).slug];if(passive?.disableTypesHere)for(const target of s.units)if(card(target.card).type==='Minion'&&unitTypes(target).some(t=>passive.disableTypesHere.includes(t))&&sameLocation(s,target,a))target.effectDisabled=true;
    if(u&&!u.fiftyOnslaught&&passive?.bearerSilenced&&!a.silenced&&!a.disabled)u.silenced=true;
    if(u&&passive?.bearerDisabled&&!a.silenced&&!a.disabled)u.effectDisabled=true;
    if(u)u.ongoingPower+=passive?.bearerPower||0;
    if(u&&passive?.whaleArmor)u.whaleArmor=true;
    if(u&&passive?.bearerRanged)u.grantedKeywords.push('Ranged');
    if(u&&passive?.bearerTruesight)u.canSeeStealth=true;
    if(u&&passive?.bearerSpellcaster)u.grantedKeywords.push('Spellcaster');
    if(u&&passive?.heldMagicPower&&a.magicCasts?.[u.uid]?.turn===s.turn)u.ongoingPower+=a.magicCasts[u.uid].count;
    if(u&&passive?.elementalSword)u.ongoingPower+=elements.filter(e=>hasElement(card(u.card),e)).length;
    if(u&&passive?.killerPower&&(s.deathHistory||[]).some(d=>d.killers.some(k=>k.uid===u.uid)))u.ongoingPower+=passive.killerPower;
    if(!u||!d)continue;
    if(d.minion&&card(u.card).type!=='Minion')continue;
    u.ongoingPower+=d.power||0;u.grantedKeywords.push(...d.keywords||[]);u.grantedMovement+=d.movement||0;u.grantedRange=Math.max(u.grantedRange,d.range||0);
    if(d.spellElement){u.grantedKeywords.push('Spellcaster');u.spellElements.push(d.spellElement);}
    if(d.magicProtected)u.magicProtected=true;
  }
  for(const u of s.units){const site=s.board[u.at],d=site?sitePassives[card(site.card).slug]:null;if(!d)continue;const above=(u.layer||'surface')==='surface',evil=unitUmbrellas(u).includes('Evil');if(d.minionKeywords&&card(u.card).type==='Minion'){u.grantedKeywords.push(...d.minionKeywords);if(d.minionKeywords.includes('Spellcaster'))u.unrestrictedCaster=true;}if(above&&d.rangedBonus)u.rangeBonus+=d.rangedBonus;if(evil){if(d.evilZero)u.powerSuppressed=true;u.ongoingPower+=d.evilPower||0;}}
  for(const e of s.ongoingEffects||[])if(e.op==='witchingHour')for(const u of s.units)if(u.controller===e.controller&&(unitUmbrellas(u).includes('Evil')||unitTypes(u).includes('Spirit')||keywords(u).includes('Spellcaster'))){u.ongoingPower++;u.grantedKeywords.push('Airborne');}
  for(const a of s.auras||[]){const d=areaAuras[card(a.card).slug];if(!d)continue;for(const u of s.units)if(occupied(u).some(at=>inside(a,at))&&card(u.card).type==='Minion'){
    u.grantedKeywords.push(...d.keywords||[]);u.deniedKeywords.push(...d.deny||[]);
    if(d.power&&u.controller===a.controller&&matches(card(u.card),d))u.ongoingPower+=d.power;
  }}
  for(const a of s.artifacts||[])if(passives[card(a.card).slug]?.nearbyMinionCharge)for(const u of s.units)if(card(u.card).type==='Minion'&&nearby(a.at,u.at)&&region(s,a)===region(s,u))u.grantedKeywords.push('Charge');
  for(const a of s.artifacts||[]){const d=passives[card(a.card).slug],controller=artifactController(s,a),bearer=unit(s,a.bearer);if(controller!==0&&controller!==1)continue;
    const banner=d?.uncontestedAlliesPower&&!s.units.some(u=>!u.dying&&u.controller!==controller&&sameLocation(s,u,a));
    const torch=d?.ordinaryBearerAura&&bearer&&!bearer.dying&&!disabled(bearer)&&(card(bearer.card).rarity||card(bearer.card).slot)==='Ordinary';
    if(banner||torch)for(const u of s.units)if(u.controller===controller&&occupied(u).some(at=>nearby(at,a.at))&&region(s,u)===region(s,a)&&(!torch||(card(u.card).rarity||card(u.card).slot)==='Ordinary'))u.ongoingPower+=banner?d.uncontestedAlliesPower:d.ordinaryBearerAura;
  }
  for(const [at,site] of s.board.entries())if(site&&sitePassives[card(site.card).slug]?.siteRevealNearby){const previous=new Set(site.permanentRevealContacts||[]),current=[];if(!site.silenced&&!site.disabled)for(const u of s.units)if(u.controller!==site.controller&&(u.layer||'surface')==='surface'&&occupied(u).some(i=>s.board[i]&&nearby(i,at))){if(!previous.has(u.uid))u.stealth=false;current.push(u.uid);}site.permanentRevealContacts=current;}
  for(const u of s.units)if(card(u.card).type==='Minion'&&unitUmbrellas(u).includes('Evil')&&s.board.some((site,at)=>site&&sitePassives[card(site.card).slug]?.nearbyEvilBurrowing&&occupied(u).some(i=>nearby(at,i))))u.grantedKeywords.push('Burrowing');
  for(const u of s.units)if(card(u.card).type==='Minion'&&(u.layer||'surface')==='surface'&&occupied(u).some(at=>s.board[at]&&s.board.some((site,i)=>site&&sitePassives[card(site.card).slug]?.nearbySurfaceDenyCharge&&nearby(at,i))))u.deniedKeywords.push('Charge');
  for(const u of s.units){const k=[...(u.silenced?[]:printedKeywords(card(u.card))),...u.grantedKeywords,...u.mods.flatMap(m=>m.keyword?[m.keyword]:[])];u.boundDisabled=k.includes('Waterbound')&&!waterSite(s,u.at,card)||k.includes('Landbound')&&(!s.board[u.at]||waterSite(s,u.at,card));if(disabled(u)){u.ward=false;u.stealth=false;}}
  for(const u of s.units){
    const p=!u.silenced?passives[card(u.card).slug]:null;
    u.conditionDisabled=!!p?.wakeFromNearbyDeath&&!u.awakenedByDeath||!!p?.needsSpellcaster&&!s.units.some(v=>v.controller===u.controller&&!v.dying&&!disabled(v)&&distance(v.at,u.at)===1&&region(s,v)===region(s,u)&&(card(v.card).type==='Avatar'||keywords(v).includes('Spellcaster')));
    if(u.conditionDisabled){u.ward=false;u.stealth=false;}
    if(!p||disabled(u))continue;
    if(u.ward){u.ongoingPower+=p.wardedPower||0;u.grantedKeywords.push(...p.wardedKeywords||[]);}
    if(p.realmWardPower)u.ongoingPower+=p.realmWardPower*(s.units.filter(v=>v.ward).length+s.board.filter(v=>v?.ward).length);
    if(p.zeroUnless){const matches=s.units.some(v=>v.uid!==u.uid&&v.controller===u.controller&&distance(v.at,u.at)===1&&region(s,v)===region(s,u)&&(p.zeroUnless==='evil'?unitUmbrellas(v).includes('Evil'):v.ward))||(p.zeroUnless==='ward'&&s.board.some((v,at)=>v?.controller===u.controller&&v.ward&&distance(at,u.at)===1));u.zeroPower=!matches;}
    if(p.nearbySamePower){const name=p.countsAs||card(u.card).slug;u.ongoingPower+=s.units.filter(v=>v.uid!==u.uid&&(card(v.card).slug===name||!v.silenced&&!disabled(v)&&passives[card(v.card).slug]?.countsAs===name)&&nearby(v.at,u.at)&&region(s,v)===region(s,u)).length;}if(p.companionPower&&u.companion){const other=unit(s,u.companion);if(other&&!other.dying&&distance(u.at,other.at)===1&&region(s,u)===region(s,other)){u.ongoingPower+=p.companionPower;other.ongoingPower+=p.companionPower;}}
    if(p.lostLifePower&&s.players[u.controller].lostLifeTurn===s.turn)u.ongoingPower+=p.lostLifePower;
    if(p.chargeIfDead&&s.players.some(pl=>pl.cemetery.some(id=>card(id).slug===p.chargeIfDead)))u.grantedKeywords.push('Charge');
    if(p.spellElement){u.grantedKeywords.push('Spellcaster');u.spellElements.push(p.spellElement);}
    if(p.spellElements){u.grantedKeywords.push('Spellcaster');u.spellElements.push(...p.spellElements);}
    if(p.rowVoidPower)u.ongoingPower+=s.board.filter((v,at)=>!v&&Math.floor(at/5)===Math.floor(u.at/5)).length;
    if(p.waterBodyPower)u.ongoingPower+=bodyOfWater(s,u.at,card).size*p.waterBodyPower;
    if(p.enemyTurnPower&&s.active!==u.controller)u.ongoingPower+=p.enemyTurnPower;
    if(p.avengePreviousTurn&&(s.deathHistory||[]).some(d=>d.controller===u.controller&&d.turn===s.turn-(s.active===u.controller?1:2)))u.grantedKeywords.push('Charge','Lethal');
    if(p.backRowNoRoyalty&&inBackRow(u.at,u.controller)&&!s.units.some(v=>!v.dying&&unitUmbrellas(v).includes('Royalty')&&region(s,v)===region(s,u)&&occupied(v).some(at=>nearby(at,u.at))))u.ongoingPower+=p.backRowNoRoyalty;
    if(p.uniqueVanguard){const forward=at=>u.controller===0?3-Math.floor(at/5):Math.floor(at/5),mine=Math.max(...occupied(u).map(forward));if(!s.units.some(v=>v.uid!==u.uid&&!v.dying&&v.controller===u.controller&&Math.max(...occupied(v).map(forward))>=mine))u.ongoingPower+=p.uniqueVanguard;}
    if(p.moveAxis)u.moveAxis=p.moveAxis;
    if(p.verticalWrap)u.verticalWrap=true;
    if(p.magicProtected)u.magicProtected=true;
    if(p.projectileOver)u.projectileOver=true;
  }
  for(const source of s.units){if(source.silenced||disabled(source)){source.permanentRevealContacts=[];continue;}const p=passives[card(source.card).slug];if(!p)continue;const previousReveal=new Set(source.permanentRevealContacts||[]),currentReveal=[];for(const u of s.units){
    if(p.realmVerticalWrap&&u.controller===source.controller)u.verticalWrap=true;
    if(p.edgeAlliesPower&&u.uid!==source.uid&&u.controller===source.controller&&occupied(u).some(at=>s.board[at]&&(Math.floor(at/5)===0||Math.floor(at/5)===3)))u.ongoingPower+=p.edgeAlliesPower;
    if(!source.dying&&u.controller!==source.controller&&(p.permanentRevealAllEnemies||p.permanentRevealNearby&&region(s,source)===region(s,u)&&occupied(u).some(at=>nearby(source.at,at)))){if(!previousReveal.has(u.uid))u.stealth=false;currentReveal.push(u.uid);}
    if(p.waterBodyAlliesPower&&source.uid!==u.uid&&source.controller===u.controller&&bodyOfWater(s,source.at,card).has(u.at))u.ongoingPower+=p.waterBodyAlliesPower;
    if(p.denyOthersAirborne&&u.uid!==source.uid&&card(u.card).type==='Minion')u.deniedKeywords.push('Airborne');
    if(p.revealAllEnemies&&u.controller!==source.controller){u.stealth=false;u.deniedKeywords.push('Stealth');}
    if(region(s,source)!==region(s,u))continue;
    if(p.denyNearbyWard&&occupied(u).some(at=>nearby(source.at,at))){u.ward=false;u.deniedKeywords.push('Ward');}
    if(p.revealNearby&&u.controller!==source.controller&&occupied(u).some(at=>nearby(source.at,at))){u.stealth=false;u.deniedKeywords.push('Stealth');}
    if(p.shareVerticalWrap&&sameLocation(s,source,u)&&source.controller===u.controller)u.verticalWrap=true;
    if(p.shareProjectileOver&&source.controller===u.controller&&(source.uid===u.uid||distance(source.at,u.at)===1))u.projectileOver=true;
    if(p.auraMagicDamageProtected&&nearby(source.at,u.at))u.magicDamageProtected=true;
    if(p.nearbyLethalImmune&&source.controller===u.controller&&nearby(source.at,u.at))u.lethalImmune=true;
    if(p.grantNearbyKeyword&&source.controller===u.controller&&nearby(source.at,u.at)&&(!p.other||source.uid!==u.uid)&&(!p.grantOnSite||s.board[u.at])&&(!p.minion||card(u.card).type==='Minion')&&(!p.types||p.types.some(t=>unitTypes(u).includes(t))))u.grantedKeywords.push(p.grantNearbyKeyword);
  }source.permanentRevealContacts=currentReveal;}
  for(const source of s.units){
    if(source.silenced||disabled(source))continue;
    if(passives[card(source.card).slug]?.denyNearbyWard)for(const [at,site] of s.board.entries())if(site&&nearby(at,source.at))site.ward=false;
    const p=passives[card(source.card).slug];if(!p?.auraPower)continue;
    for(const u of s.units)if(nearby(source.at,u.at)&&region(s,source)===region(s,u)&&(!p.minion||card(u.card).type==='Minion')&&(!p.other||u.uid!==source.uid)&&(!p.allies||u.controller===source.controller)&&(!p.types||p.types.some(t=>unitTypes(u).includes(t))))u.ongoingPower+=p.auraPower;
  }
  const transportChanged=refreshPassengers(s,transportAPI);
  const pipers=s.units.filter(u=>!u.dying&&!u.silenced&&!disabled(u)&&passives[card(u.card).slug]?.weakMinionControl!==undefined);if(pipers.length){for(const u of s.units)if(u.kingApplied){u.controller=u.nativeController;u.kingApplied=false;}const all=[...controls,...pipers.map(source=>({kind:'piper',source,stamp:source.stamp||0}))].sort((a,b)=>a.stamp-b.stamp);for(const e of all){const targets=e.kind==='piper'?s.units.filter(u=>card(u.card).type==='Minion'&&power(u)<=passives[card(e.source.card).slug].weakMinionControl):e.kind==='king'?s.units.filter(u=>unitTypes(u).includes(passives[card(e.source.card).slug].undeadKing?'Undead':'Mortal')):[unit(s,e.target)];for(const u of targets){if(!u.kingApplied)u.nativeController=u.controller;u.controller=e.kind==='bound'?e.controller:e.source.controller;u.kingApplied=true;u.kingController=u.controller;}}}
  if(transportChanged){refreshContinuous(s);return;}
  if(s.boundControls.some(e=>e.untilStealth&&!unit(s,e.target)?.stealth)){s.boundControls=s.boundControls.filter(e=>!e.untilStealth||unit(s,e.target)?.stealth);refreshContinuous(s);}
}
function carriedLances(s,u){return (s.artifacts||[]).filter(a=>a.bearer===u.uid&&equipment[card(a.card).slug]?.lance);}
function acquireLance(s,u,p,at=u?.at){if(!s.artifacts)s.artifacts=[];s.artifacts.push({uid:'o'+s.next++,card:card('lance').id,owner:p,controller:u?.controller,at,bearer:u?.uid||null,layer:u?.layer||'surface'});}
function strikeTotal(s,u,amount=power(u)){const live=unit(s,u.uid)||u;return (amount+carriedLances(s,live).length)*(live.mods.some(m=>m.nextStrikeDouble)?2:1);}
function strikeMany(s,source,allocations,ranged=false,preserveStealth=false){
  if(disabled(source))return;
  const live=unit(s,source.uid)||source,recover=live.mods.some(m=>m.nextStrikeHeal);
  if(allocations.length){if(!preserveStealth)live.stealth=false;live.interactedTurn=s.turn;}
  live.mods=live.mods.filter(m=>!m.nextStrikeDouble&&!m.nextStrikeHeal);
  for(const a of carriedLances(s,live))removeObject(s,a,'banished');
  for(const allocation of allocations){const target=unit(s,allocation.uid);if(!target)continue;
    creditUnit(s,target,source);
    if(!source.silenced&&passives[card(source.card).slug]?.avatarStrikeDiscard&&card(target.card).type==='Avatar')eventTrigger(s,source,[{op:'randomDiscard',player:target.controller}]);
    if(!target.silenced&&!disabled(target)&&passives[card(target.card).slug]?.destroyWhenStruck)eventTrigger(s,target,[{op:'destroyStruck',uid:target.uid}]);
    if(!source.silenced&&!disabled(source)&&passives[card(source.card).slug]?.avatarStrikeBurrow&&card(target.card).type==='Avatar')eventTrigger(s,source,[{op:'balinStrike',avatar:target.uid}]);
    if(!source.silenced&&!disabled(source)&&passives[card(source.card).slug]?.untapAfterStriking&&unitTypes(target).includes(passives[card(source.card).slug].untapAfterStriking))queueEffects(s,[{op:'untapSelf',uid:source.uid}],source,source.controller);
    if(ranged&&!target.silenced&&!disabled(target)&&passives[card(target.card).slug]?.rangedImmune)continue;
    const lethal=keywords(source).includes('Lethal')||(!source.silenced&&passives[card(source.card).slug]?.lethalTo==='Evil'&&unitUmbrellas(target).includes('Evil'));
    const traits=[unitUmbrellas(target).includes('Evil'),s.artifacts.some(a=>a.bearer===target.uid),card(target.card).type==='Avatar'||keywords(target).includes('Spellcaster'),keywords(target).includes('Voidwalk'),keywords(target).includes('Submerge'),keywords(target).includes('Burrowing'),card(target.card).slug==='frog'||unitTypes(target).includes('Frog')||unitUmbrellas(target).includes('Frog')].filter(Boolean).length;
    const bonus=s.artifacts.filter(a=>a.bearer===source.uid&&passives[card(a.card).slug]?.traitStrikeBonus).length*traits;
    const dealt=hurt(s,target,(allocation.amount+bonus)*maskStrikeMultiplier(s,target,fiftyAPI),lethal,'strike',source);
    if(card(target.card).type==='Avatar'&&target.controller!==source.controller)for(const av of s.units)if(av.controller===source.controller&&!av.dying&&!av.silenced&&!disabled(av)&&passives[card(av.card).slug]?.completionInterrogate)eventTrigger(s,av,[{op:'completionInterrogate',player:target.controller}]);
    if(target.controller!==source.controller)for(const sword of (s.artifacts||[]).filter(o=>o.bearer===source.uid&&!o.silenced&&passives[card(o.card).slug]?.fiftySplash)){const n=dealt||s.eventContext?.fiftyReceipt?.amount||allocation.amount+bonus,oldEffect=s.eventContext?.effectCard;if(s.eventContext)s.eventContext.effectCard=sword.card;for(const v of s.units)if(v.uid!==target.uid&&v.controller!==source.controller&&!v.dying&&sameLocation(s,v,target)){creditUnit(s,v,source);hurt(s,v,n,false,'ability',sword);}if(s.eventContext)s.eventContext.effectCard=oldEffect;}
    if(recover||!source.silenced&&!disabled(source)&&passives[card(source.card).slug]?.strikeHeal)heal(s,source.controller,dealt);
  }
  if(ranged&&!live.dying&&!live.silenced&&!disabled(live)&&passives[card(live.card).slug]?.stepAfterRanged)eventTrigger(s,live,[{op:'unitStep',uid:live.uid,may:true}]);
}
function strike(s,source,target,amount=power(source),ranged=false,preserveStealth=false){if(target)strikeMany(s,source,[{uid:target.uid,amount:strikeTotal(s,source,amount)}],ranged,preserveStealth);}
function strikesFirst(s,u,fight){return !u.silenced&&(u.copyDuels||[u.copyDuel].filter(Boolean)).some(id=>fight.attacker===u.uid?fight.defenders.includes(id):fight.attacker===id)||(s.artifacts||[]).some(o=>o.bearer===u.uid&&!o.silenced&&passives[card(o.card).slug]?.fiftyFirst)||carriedLances(s,u).length>0||!u.silenced&&passives[card(u.card).slug]?.firstWhileAttacking&&fight.kind==='attack'&&fight.attacker===u.uid||(s.ongoingEffects||[]).some(e=>e.op==='nightAttack'&&e.controller===u.controller);}
function selectEffects(s,frame,filter) {
  if(filter.kind==='dreamCaster')return dreamCasterChoices(s,frame.controller,fiftyAPI,frame.source);
  const source=filter.anchor?{...frame.source,...filter.anchor}:frame.source,p=frame.controller;
  const body=filter.inBody?bodyOfWater(s,source.at,card):null;
  const fits=(at)=> (!body||body.has(at))&&(!filter.here||at===source.at)&&(!filter.nearby||nearby(at,source.at))&&(!filter.adjacent||distance(at,source.at)===1)&&(filter.steps===undefined||distance(at,source.at)<=filter.steps)&&(filter.regionSteps===undefined||regionalDistance(s,source,at,card)<=filter.regionSteps);
  const result=[];
  if(filter.kind==='gridArea')return Array.from({length:20},(_,at)=>at).filter(at=>area(at).length).map(at=>({label:'2?2 '+String.fromCharCode(65+at%5)+(4-Math.floor(at/5)),value:{at}}));
  if(filter.kind==='ramTarget')return [...selectEffects(s,frame,{kind:'artifact',adjacent:true}).filter(o=>card(s.artifacts.find(a=>a.uid===o.value.uid).card).subtypes.includes('Monument')),...s.auras.filter(a=>card(a.card).subtypes.includes('Wall')&&distance(a.at,source.at)===1).map(a=>({label:card(a.card).name,value:{entity:'aura',uid:a.uid}}))];
  if(filter.kind==='displaceObject')return [...selectEffects(s,frame,{kind:'unit',minion:true}),...selectEffects(s,frame,{kind:'artifact'}),...(s.auras||[]).map(a=>({label:card(a.card).name,value:{entity:'aura',uid:a.uid}}))];
  if(filter.kind==='spellName')return [...new Set(cardCatalog.filter(c=>c.category==='Spell').map(c=>c.name))].sort().map(name=>({label:name,value:name}));
  if(filter.kind==='lastTurnKiller'){
    const ids=new Set((s.deathHistory||[]).filter(d=>d.controller===p&&d.turn===s.turn-1).flatMap(d=>d.killers.map(k=>k.uid)));
    for(const u of s.units)if(ids.has(u.uid)&&!u.dying)for(const at of occupied(u))if((!filter.adjacentSite||s.board[at]&&occupied(source).some(cell=>distance(cell,at)===1)))result.push({label:card(u.card).name+' · '+String.fromCharCode(65+at%5)+(4-Math.floor(at/5)),value:{uid:u.uid,at,layer:u.layer||'surface'}});
    return result;
  }
  if(filter.kind==='goblet'){const o=s.artifacts.find(o=>o.uid===source.uid);return o?.gobletPower!==undefined?[{label:'獲得 '+o.gobletPower+' 魔力',value:'mana'},{label:'治療 '+o.gobletPower+' 生命',value:'life'}]:selectEffects(s,frame,{kind:'unit',minion:true,ally:true,here:true,untargeted:true});}
  if(filter.kind==='exorcist')return [...selectEffects(s,frame,{...filter,kind:'unit',types:['Demon','Spirit']}),...(s.auras||[]).filter(a=>Array.from({length:20},(_,i)=>i).some(at=>inside(a,at)&&fits(at))).map(a=>({label:card(a.card).name,value:{entity:'aura',uid:a.uid}}))];
  if(filter.kind==='wardMark')return [...selectEffects(s,frame,{...filter,kind:'unit',warded:true}),...selectEffects(s,frame,{...filter,kind:'site'}).filter(o=>s.board[o.value.at].ward)];
  if(filter.kind==='graveOrDocument')return [...selectEffects(s,frame,{kind:'grave',type:'Magic'}),...selectEffects(s,frame,{kind:'artifact',anyRegion:true}).filter(o=>card((s.artifacts||[]).find(a=>a.uid===o.value.uid).card).subtypes.includes('Document'))];
  if(['unit','wardable','unitOrArtifact'].includes(filter.kind))for(const u of s.units){
    const c=card(u.card);
    if(filter.kind==='wardable'&&c.type!=='Minion')continue;
    if(filter.avatar&&c.type!=='Avatar')continue;
    if(filter.tapped&&!u.tapped)continue;if(filter.notHere&&sameLocation(s,u,source))continue;
    if(u.dying||(!filter.untargeted&&!canTarget(s,p,u,source,frame.effectCard))||!filter.untargeted&&frame.effectCard&&card(frame.effectCard).type==='Magic'&&(u.iceMagicProtection||u.magicProtected&&!disabled(u))||!occupied(u).some(fits)||(!filter.anyRegion&&region(s,u)!==region(s,source)&&!(filter.siteBothLayers&&region(s,u)===region(s,{at:source.at,layer:'below'}))))continue;
    if(filter.uids&&!filter.uids.includes(u.uid)||filter.excludeUid===u.uid)continue;
    if(filter.ally&&u.controller!==p||filter.enemy&&u.controller===p||filter.other&&u.uid===source.uid||filter.ownOrControl&&u.owner!==p&&u.controller!==p)continue;
    if(filter.minion&&c.type!=='Minion'||filter.evil&&!c.umbrellas.includes('Evil')||filter.warded&&!u.ward)continue;
    if(filter.selfOrAdjacent&&u.uid!==source.uid&&distance(u.at,source.at)!==1)continue;
    if(filter.adjacent&&!occupied(u).some(at=>distance(at,source.at)===1)||filter.surface&&(u.layer||'surface')!=='surface')continue;
    if(filter.bornThisTurn&&u.born!==s.turn)continue;
    if(filter.canAct&&disabled(u))continue;
    if(filter.weakerThanSource&&power(u)>=power(source))continue;
    if(filter.siteOnly&&!occupied(u).some(at=>s.board[at]))continue;
    if(filter.hereOrAdjacent&&!occupied(u).some(at=>occupied(source).some(root=>distance(at,root)<=1)))continue;
    if(filter.wounded&&!(u.damage>0))continue;
    if(filter.ready&&!ready(s,u))continue;
    if(filter.connectedRivers&&!occupied(u).some(at=>riverNetwork(s,source.at).has(at)))continue;
    if(filter.nonEvil&&unitUmbrellas(u).includes('Evil'))continue;
    if(filter.carryingArtifact&&!(s.artifacts||[]).some(a=>a.bearer===u.uid&&carriable(card(a.card))))continue;
    if(filter.maxPower!==undefined&&power(u)>filter.maxPower)continue;
    if(filter.land&&(!s.board[u.at]||waterSite(s,u.at,card))||filter.water&&!waterSite(s,u.at,card))continue;
    if(filter.onSite&&!occupied(u).some(at=>!!s.board[at]))continue;
    if(filter.types&&!filter.types.some(t=>unitTypes(u).includes(t)))continue;
    if(filter.notTypes&&filter.notTypes.some(t=>unitTypes(u).includes(t)))continue;
    if(filter.hasEnemyAdjacent&&!s.units.some(v=>v.controller!==u.controller&&!v.dying&&canTarget(s,u.controller,v)&&distance(v.at,u.at)===1&&region(s,v)===region(s,u)))continue;
    if(filter.rarities&&!filter.rarities.includes(c.slot))continue;
    if(filter.spellcaster&&c.type!=='Avatar'&&!keywords(u).includes('Spellcaster'))continue;
    const entry={label:c.name+' · '+String.fromCharCode(65+u.at%5)+(4-Math.floor(u.at/5)),value:{entity:'unit',uid:u.uid}};
    if(filter.adjacentWater){for(const at of occupied(u))if(distance(at,source.at)===1&&waterSite(s,at,card))result.push({...entry,label:entry.label+' · '+String.fromCharCode(65+at%5)+(4-Math.floor(at/5)),value:{...entry.value,pullFrom:at}});}else result.push(entry);
  }
  if(['site','wardable'].includes(filter.kind))for(let at=0;at<20;at++){
    const site=s.board[at];if(filter.nameIncludes&&(!site||!card(site.card).name.includes(filter.nameIncludes)))continue;if(filter.siteType&&(!site||!card(site.card).subtypes.includes(filter.siteType)))continue;if(filter.other&&at===source.at||filter.backRow&&!inBackRow(at,p)||filter.empty&&!emptySite(s,at)||filter.movable&&site&&passives[card(site.card).slug]?.immutableSite)continue;if(filter.noAvatar&&s.units.some(u=>card(u.card).type==='Avatar'&&occupied(u).includes(at)))continue;if(!site||at===filter.excludeAt||!fits(at)||filter.ally&&site.controller!==p||filter.water&&!waterSite(s,at,card)||filter.land&&waterSite(s,at,card)||filter.rubble&&card(site.card).slug!=='rubble'||filter.nearBody&&![...bodyOfWater(s,source.at,card)].some(root=>nearby(root,at)))continue;
    result.push({label:card(site.card).name+' · '+String.fromCharCode(65+at%5)+(4-Math.floor(at/5)),value:{entity:'site',at,...(filter.snapshot?{card:site.card}:{})}});
  }
  if(filter.kind==='hand')for(const h of s.players[p].hand)if((!filter.element||hasElement(card(h.card),filter.element))&&(!filter.type||card(h.card).type===filter.type)&&(!filter.playable||card(h.card).playable)&&(!filter.spells||card(h.card).category==='Spell')&&(!filter.siteElement||card(h.card).type==='Site'&&card(h.card)[filter.siteElement]>0))result.push({label:card(h.card).name,value:{entity:'hand',uid:h.uid,player:p}});
  if(filter.kind==='player')for(let player=0;player<2;player++)result.push({label:s.players[player].name,value:{entity:'player',player}});
  if(['deck','handDeck'].includes(filter.kind))for(let player=0;player<2;player++)if((filter.player===undefined||filter.player===player)&&(!filter.own||player===p)){
    for(const [index,id] of s.players[player].spells.entries()){
      const c=card(id);if(filter.type&&c.type!==filter.type||filter.maxCost!==undefined&&c.cost>filter.maxCost||filter.slug&&c.slug!==filter.slug||filter.types&&!filter.types.some(t=>c.subtypes.includes(t))||filter.rarities&&!filter.rarities.includes(c.slot))continue;
      result.push({label:c.name+' · Spellbook',value:{entity:'deck',player,index,card:id}});
    }
    if(filter.kind==='handDeck')for(const h of s.players[player].hand)if(!filter.slug||card(h.card).slug===filter.slug)result.push({label:card(h.card).name+' · 手牌',value:{entity:'hand',player,uid:h.uid,card:h.card}});
  }
  if(filter.kind==='grave')for(let player=0;player<2;player++)if((filter.player===undefined||filter.player===player)&&(!filter.own||player===p))for(const entry of graveEntries(s,player)){
    const c=card(entry.card);if(filter.copyFits&&c.slug==='mountain_giant'&&(source.at%5>3||source.at>=15))continue;if(filter.minion&&(c.type!=='Minion'||!c.playable&&!filter.includeUnsupported)||filter.type&&c.type!==filter.type||filter.playable&&!c.playable||filter.diedThisTurn&&entry.deathTurn!==s.turn||filter.types&&!filter.types.some(t=>c.subtypes.includes(t))||filter.unique&&c.slot!=='Unique')continue;
    result.push({label:c.name+' · 玩家 '+(player+1)+' 墓地',value:entry});
  }
  if(['unitOrArtifact','artifact'].includes(filter.kind))for(const a of s.artifacts||[]){
    if(filter.carriedBySource&&a.bearer!==source.uid)continue;if(filter.carriable&&(card(a.card).subtypes.includes('Monument')||card(a.card).subtypes.includes('Automaton')||card(a.card).type==='Minion'))continue;
    const bearer=unit(s,a.bearer);if(!fits(a.at)||!filter.anyRegion&&region(s,a)!==region(s,source)||bearer?.controller!==p&&bearer?.stealth||filter.land&&(!s.board[a.at]||waterSite(s,a.at,card))||filter.water&&!waterSite(s,a.at,card))continue;
    if(filter.ownOrControl&&a.owner!==p&&bearer?.controller!==p)continue;
    result.push({label:card(a.card).name,value:{entity:'artifact',uid:a.uid}});
  }
  if(filter.kind==='location')for(let at=0;at<20;at++)if(fits(at))for(const layer of s.board[at]?['surface','below']:['surface']){
    if(filter.enemyPair&&s.units.filter(u=>!u.dying&&u.controller!==p&&occupied(u).includes(at)&&(u.layer||'surface')===layer).length<2)continue;if(filter.other&&at===source.at&&layer===(source.layer||'surface'))continue;
    if(filter.nearCasterOrDragon&&![source,...s.units.filter(u=>!u.dying&&u.controller===p&&unitTypes(u).includes('Dragon'))].some(anchor=>nearby(anchor.at,at)&&region(s,anchor)===region(s,{at,layer})))continue;
    if(filter.voidOnly&&s.board[at])continue;if(filter.voidOrRubble&&s.board[at]&&card(s.board[at].card).slug!=='rubble'||filter.surface&&layer!=='surface')continue;
    if(filter.sameRegion&&region(s,{at,layer})!==region(s,source))continue;
    if(filter.canSummon){const k=printedKeywords(card(filter.canSummon));if(layer==='below'&&!k.includes(waterSite(s,at,card)?'Submerge':'Burrowing')||!s.board[at]&&!k.includes('Voidwalk'))continue;}
    result.push({label:String.fromCharCode(65+at%5)+(4-Math.floor(at/5))+' · '+(layer==='below'?'地下／水下':'表面／虛空'),value:{entity:'location',at,layer}});
  }
  return result;
}
function resolveStep(s,frame) {
  const {step,source,controller:p,selected}=frame;
  if(step.sacrificeAfter){
    const {sacrificeAfter,...effectStep}=step;
    try{resolveStep(s,{...frame,step:effectStep});}finally{if(s.board[sacrificeAfter.at]?.card===sacrificeAfter.card)destroySite(s,sacrificeAfter.at,true);}
    return;
  }
  startEvent(s,source,frame.effectCard,['commitSpell','combatAllocate','fightStage','fightFinish','finishTurn','finishStart','finishMagic','bury','buryMany','graveRecur'].includes(step.op));
  s.eventContext.controller=p;
  if(step.fight?.kind==='attack')s.eventContext.attack=step.fight.attacker;
  const damageKind=card(frame.effectCard).type==='Magic'?'magic':'ability';
  const lifeCause=['Minion','Avatar'].includes(card(frame.effectCard).type)?source:null;
  if(step.op==='imperialRoad'){
    const player=step.opponent?1-p:p,pl=s.players[player],sites=pl.hand.filter(h=>card(h.card).type==='Site'),spots=Array.from({length:20},(_,at)=>at).filter(at=>distance(source.at,at)===1&&(!s.board[at]||card(s.board[at].card).slug==='rubble'));
    if(selected===undefined){const options=sites.flatMap(h=>spots.map(at=>({label:card(h.card).name+' · '+String.fromCharCode(65+at%5)+(4-Math.floor(at/5)),value:{hand:h.uid,at}})));if(options.length)s.choice={player,title:'Imperial Road · 可打出相鄰地點',options:[...options,{label:'略過',value:null}],frame};return;}
    if(selected===null)return;const h=sites.find(h=>h.uid===selected.hand);if(h&&spots.includes(selected.at)){pl.hand=pl.hand.filter(v=>v.uid!==h.uid);enterSite(s,player,h.card,selected.at);}return;
  }
  if(step.op==='goldenDawn'){
    const pl=s.players[p],sites=Array.from({length:5},(_,i)=>i+(p===0?15:0)).filter(at=>s.board[at]),dealt=sites.map(at=>({at,id:pl.spells.shift()})).filter(v=>v.id),rest=[],summoned=[];log(s,'Golden Dawn：'+dealt.map(v=>card(v.id).name).join('、'));
    for(const {at,id} of dealt){const c=card(id);if(c.type==='Minion'&&c.playable){if(!canSummonEntry(s,p,c,at,'surface'))sendCard(s,p,id,'cemetery');else if(paySummoningTax(s,id,p,p))summoned.push(makeUnit(s,id,p,at));}else rest.push(id);}
    shuffle(s,rest);pl.spells.push(...rest);queueEffects(s,[{op:'dawnCharge',uids:summoned.map(u=>u.uid)}],source,p,frame.effectCard);refreshContinuous(s);for(const u of summoned.reverse())summonedGenesis(s,u);return;
  }
  if(step.op==='dawnCharge'){if(s.players[p].doorTurn!==null)for(const uid of step.uids){const u=unit(s,uid);if(u&&!u.dying)u.mods.push({keyword:'Charge'});}return;}
  if(step.op==='howlBeyond'){
    const pl=s.players[p],count=s.board.filter((site,at)=>!site&&(at%5===0||at%5===4)).length,dealt=pl.spells.splice(0,count),drawn=[];log(s,'Howl from Beyond：'+dealt.map(id=>card(id).name).join('、'));
    for(const id of dealt){const c=card(id);if(c.type==='Minion'&&(printedKeywords(c).includes('Voidwalk')||c.subtypes.includes('Monster')))drawn.push(id);else pl.banished.push(id);}
    for(const id of drawn){pl.spells.unshift(id);draw(s,p,'spells');}return;
  }
  if(step.op==='flankOrigin'){
    const options=selectEffects(s,frame,{kind:'location'}).filter(o=>s.units.some(u=>u.controller===p&&!u.dying&&occupied(u).includes(o.value.at)&&(u.layer||'surface')===o.value.layer));
    if(selected===undefined){if(options.length)s.choice={player:p,title:'Flanking Maneuver · 選擇出發位置',options:[...options,{label:'不傳送',value:null}],frame};return;}if(selected===null)return;
    queueEffects(s,[{op:'flankDestination',origin:selected}],source,p,frame.effectCard);return;
  }
  if(step.op==='flankDestination'){
    const a=position(step.origin.at),options=selectEffects(s,frame,{kind:'location'}).filter(o=>{const b=position(o.value.at);return Math.abs(a.x-b.x)*Math.abs(a.y-b.y)===2;});
    if(selected===undefined){if(options.length)s.choice={player:p,title:'Flanking Maneuver · 選擇馬步落點',options,frame};return;}
    queueEffects(s,[{op:'flankAllies',origin:step.origin,to:selected,picks:[]}],source,p,frame.effectCard);return;
  }
  if(step.op==='flankAllies'){
    const candidates=s.units.filter(u=>u.controller===p&&!u.dying&&occupied(u).includes(step.origin.at)&&(u.layer||'surface')===step.origin.layer&&!step.picks.includes(u.uid));
    if(selected===undefined){s.choice={player:p,title:'Flanking Maneuver · 選擇傳送的友軍',options:[...candidates.map(u=>({label:card(u.card).name,value:u.uid})),{label:'完成選擇',value:null}],frame};return;}
    if(selected!==null){queueEffects(s,[{...step,picks:[...step.picks,selected]}],source,p,frame.effectCard);return;}
    for(const uid of step.picks){const u=unit(s,uid),at=u&&step.to.at+u.at-step.origin.at;if(!u||u.dying||at<0||at>=20||u.size===2&&(at%5>3||at>=15)||card(u.card).type==='Avatar'&&(!s.board[at]||step.to.layer==='below'))continue;if(!occupied({...u,at}).every((cell,i)=>canEnterOnGround(s,u,{at:occupied(u)[i],layer:u.layer||'surface'},{at:cell,layer:step.to.layer},card,keywords,true)))continue;u.carryTeleport=true;u.at=at;u.layer=step.to.layer;u.notRest=true;u.burrowedSafely=false;}return;
  }
  if(step.op==='displaceDestination'){
    const obj=step.target.entity==='unit'?unit(s,step.target.uid):[...s.artifacts,...s.auras].find(o=>o.uid===step.target.uid);if(!obj||obj.dying)return;const a=position(obj.at),isAura=step.target.entity==='aura';
    const options=Array.from({length:20},(_,at)=>at).filter(at=>{const b=position(at);return Math.abs(a.x-b.x)===1&&Math.abs(a.y-b.y)===1&&(isAura?(obj.wallTo!==undefined?wallCanMove(obj,at):obj.singleSite||area(at).length):region(s,{at,layer:obj.layer||'surface'})===region(s,obj))&&(obj.size!==2||at%5<4&&at<15)&&(step.target.entity!=='unit'||occupied({...obj,at}).every((cell,i)=>canEnterOnGround(s,obj,{at:occupied(obj)[i],layer:obj.layer||'surface'},{at:cell,layer:obj.layer||'surface'},card,keywords,true)));});
    if(selected===undefined){if(options.length)s.choice={player:p,title:'Displace · 選擇對角落點',options:options.map(at=>({label:String.fromCharCode(65+at%5)+(4-Math.floor(at/5)),value:at})),frame};return;}
    if(options.includes(selected)){if(step.target.entity==='artifact')obj.bearer=null;obj.carryTeleport=true;if(obj.wallTo!==undefined)obj.wallTo+=selected-obj.at;obj.at=selected;obj.notRest=true;obj.burrowedSafely=false;}return;
  }
  if(step.op==='scorchChoose'){
    const picks=step.picks||[];if(selected===undefined){s.choice={player:p,title:'Scorched Earth · 選擇己方地點',options:[...s.board.flatMap((site,at)=>site?.controller===p&&!picks.includes(at)?[{label:card(site.card).name+' · '+String.fromCharCode(65+at%5)+(4-Math.floor(at/5)),value:at}]:[]),{label:'確認選擇',value:null}],frame:{...frame,step:{...step,picks}}};return;}
    if(selected!==null){queueEffects(s,[{...step,picks:[...picks,selected]}],source,p,frame.effectCard);return;}
    const victims=s.units.filter(u=>card(u.card).type==='Minion'&&occupied(u).some(at=>picks.includes(at))),objects=[...s.artifacts.filter(o=>picks.includes(o.at)),...s.auras.filter(o=>picks.some(at=>inside(o,at)))];queueEffects(s,[{op:'scorchFinish',picks,objects:objects.map(o=>o.uid)}],source,p,frame.effectCard);for(const u of victims)kill(s,u);return;
  }
  if(step.op==='scorchFinish'){for(const o of [...s.artifacts,...s.auras])if(step.objects.includes(o.uid))removeObject(s,o,'cemetery');for(const at of step.picks)destroySite(s,at);return;}
  if(step.op==='sufferingChoose'){
    const kinds=step.kinds||['minion','artifact','aura'],done=step.done||[],opponent=!!step.opponent,player=opponent?1-p:p,kind=kinds[0];if(!kind){if(!opponent&&done.length)queueEffects(s,[{op:'sufferingChoose',opponent:true,kinds:done,done:[]}],source,p,frame.effectCard);return;}
    const candidates=kind==='minion'?s.units.filter(u=>u.controller===player&&!u.dying&&card(u.card).type==='Minion'):kind==='artifact'?s.artifacts.filter(o=>artifactController(s,o)===player):s.auras.filter(o=>o.controller===player);
    if(selected===undefined){if(candidates.length)s.choice={player,title:'Symmetric Suffering · 犧牲 '+kind,options:[...candidates.map(o=>({label:card(o.card).name,value:o.uid})),...(!opponent?[{label:'略過此類型',value:null}]:[])],frame:{...frame,step:{...step,kinds,done}}};else queueEffects(s,[{...step,kinds:kinds.slice(1),done}],source,p,frame.effectCard);return;}
    const obj=candidates.find(o=>o.uid===selected);if(obj){if(kind==='minion')kill(s,obj,false,true,true);else removeObject(s,obj,'cemetery');}
    const nextDone=obj?[...done,kind]:done;if(kinds.length>1)queueEffects(s,[{...step,kinds:kinds.slice(1),done:nextDone}],source,p,frame.effectCard);else if(!opponent&&nextDone.length)queueEffects(s,[{op:'sufferingChoose',opponent:true,kinds:nextDone,done:[]}],source,p,frame.effectCard);return;
  }
  if(step.op==='nightmarePush'){
    const actor=unit(s,source.uid);if(!actor||actor.dying)return;const remaining=step.remaining||s.units.filter(u=>u.controller!==p&&!u.dying&&card(u.card).type==='Minion'&&sameLocation(s,u,actor)).map(u=>u.uid),uid=remaining[0],target=unit(s,uid);if(!uid)return;
    queueEffects(s,[{...step,remaining:remaining.slice(1)}],source,p,frame.effectCard);if(!target||target.dying||!sameLocation(s,target,actor))return;
    queueEffects(s,[{op:'nightmareDestination',uid}],source,p,frame.effectCard);return;
  }
  if(step.op==='nightmareDestination'){
    const u=unit(s,step.uid);if(!u||u.dying)return;const options=Array.from({length:20},(_,at)=>at).filter(at=>distance(at,u.at)===1&&(u.size!==2||at%5<4&&at<15)&&occupied({...u,at}).every((cell,i)=>canEnterOnGround(s,u,{at:occupied(u)[i],layer:u.layer||'surface'},{at:cell,layer:u.layer||'surface'},card,keywords)));
    if(selected===undefined){s.choice={player:p,title:'Nightmare · 可推動 '+card(u.card).name,options:[...options.map(at=>({label:String.fromCharCode(65+at%5)+(4-Math.floor(at/5)),value:at})),{label:'略過',value:null}],frame};return;}if(selected!==null&&options.includes(selected)){u.at=selected;u.notRest=true;u.burrowedSafely=false;}return;
  }
  if(step.op==='forbidSpellName'){(s.ongoingEffects||(s.ongoingEffects=[])).push({op:'forbidSpellName',name:selected,until:p,controller:p});log(s,'Hyter Sprites：'+selected+' 在下個己方回合前不能施放。');return;}
  if(step.op==='feastForCrows'){
    const pl=s.players[1-p],named=id=>card(id).name===selected,hand=pl.hand.filter(h=>named(h.card)).map(h=>h.card),spells=pl.spells.filter(named),grave=removeGraves(s,1-p,named);
    pl.hand=pl.hand.filter(h=>!named(h.card));pl.spells=pl.spells.filter(id=>!named(id));pl.banished.push(...hand,...spells,...grave);shuffle(s,pl.spells);log(s,'Feast for Crows：放逐 '+selected+'，共 '+(hand.length+spells.length+grave.length)+' 張。');return;
  }
  if(step.op==='departedRevenge'||step.op==='lurkerRevenge'){
    const actor=unit(s,source.uid),target=unit(s,selected?.uid);if(!actor||actor.dying||!target||target.dying||!occupied(target).includes(selected.at))return;
    if(step.op==='departedRevenge'){
      const to={at:selected.at,layer:target.layer||'surface'};if(!occupied({...actor,at:to.at}).every((at,i)=>canEnterOnGround(s,actor,{at:occupied(actor)[i],layer:actor.layer||'surface'},{at,layer:to.layer},card,keywords,true)))return;
      actor.carryTeleport=true;actor.at=to.at;actor.layer=to.layer;actor.notRest=true;actor.burrowedSafely=false;queueEffects(s,[{op:'revengeStrike',uid:target.uid}],actor,p,frame.effectCard);
    }else{
      const from={at:target.at,layer:target.layer||'surface'},to={at:actor.at,layer:from.layer},steps=[{op:'dragStep',uid:target.uid,from,to,ignoreRegions:true}];
      if(from.layer!==(actor.layer||'surface')&&card(target.card).type!=='Avatar')steps.push({op:'dragStep',uid:target.uid,from:to,to:{at:actor.at,layer:actor.layer||'surface'},ignoreRegions:true});
      queueEffects(s,steps,actor,p,frame.effectCard);
    }return;
  }
  if(step.op==='revengeStrike'){const actor=unit(s,source.uid),target=unit(s,step.uid);if(actor&&!actor.dying&&target&&!target.dying&&sameLocation(s,actor,target))strike(s,actor,target);return;}
  if(step.op==='chapelWard'){
    if(resources(s,p).available<1)return;
    if(selected===undefined){const options=selectEffects(s,frame,{kind:'unit',minion:true,ally:true,nearby:true,siteBothLayers:true,untargeted:true});if(options.length)s.choice={player:p,title:'Hillside Chapel · 支付 1 魔力？',options:[...options,{label:'略過',value:null}],frame};return;}
    if(selected===null)return;const u=unit(s,selected.uid);if(u&&!u.dying&&u.controller===p){s.players[p].spent++;u.tapped=true;if(!unitUmbrellas(u).includes('Evil'))u.ward=true;}return;
  }
  if(step.op==='gobletResolve'){
    const o=s.artifacts.find(o=>o.uid===source.uid);if(!o)return;
    if(o.gobletPower!==undefined){const n=o.gobletPower;delete o.gobletPower;if(selected==='mana')s.players[p].bonusMana=(s.players[p].bonusMana||0)+n;else if(selected==='life')heal(s,p,n);return;}
    const u=unit(s,selected?.uid);if(u&&!u.dying&&u.controller===p&&sameLocation(s,u,o)){o.gobletPower=power(u);kill(s,u,false,true,true);}return;
  }
  if(step.op==='fireBlastCommit'){if(selected===null)return;const a=step.action;assert(legalActions(s,p).some(v=>v.type==='activate'&&v.unit===a.unit&&v.index===a.index),'能力已失效');commitAbility(s,{...a,blastLocation:selected},step.hand);return;}
  if(step.op==='dockLure'){const u=unit(s,selected?.uid);if(u&&!u.dying)queueEffects(s,[{op:'unitStep',uid:u.uid,toward:{at:source.at,layer:u.layer||'surface'}}],source,p,frame.effectCard);return;}
  if(step.op==='holyWaterHit'){const u=unit(s,step.uid||selected?.uid);if(u&&card(u.card).type==='Minion'){if(unitUmbrellas(u).includes('Evil'))kill(s,u,true);else u.ward=true;}return;}
  if(step.select&&!step.untargeted&&!step.select.untargeted)targetDeclared(s,source,selected);
  if(step.op==='siteNextCast'){const site=s.board[source.at];if(site?.card===source.card)site.nextCastTurn=s.turn;return;}
  if(step.op==='accusation'){const q=1-p;log(s,'Accusation · '+s.players[q].name+'：'+s.players[q].hand.map(h=>card(h.card).name).join('、'));const evil=s.players[q].hand.some(h=>[...card(h.card).subtypes,...card(h.card).umbrellas].some(t=>['Evil','Demon'].includes(t)))||s.units.some(u=>u.controller===q&&!u.dying&&unitUmbrellas(u).includes('Evil'));queueEffects(s,[{op:'accuseBanish',player:q,chooser:evil?p:q}],source,p,frame.effectCard);return;}
  if(step.op==='accuseBanish'){const q=step.player,options=s.players[q].hand.map(h=>({label:card(h.card).name,value:h.uid}));if(selected===undefined){if(options.length)s.choice={player:step.chooser,title:s.players[step.chooser].name+' · Accusation · 選一張放逐',options:[...options,...(step.chooser===p?[{label:'由對手選擇',value:'opponent'}]:[])],frame};return;}if(selected==='opponent'){queueEffects(s,[{...step,chooser:q}],source,p,frame.effectCard);return;}const h=s.players[q].hand.find(h=>h.uid===selected);if(h){s.players[q].hand=s.players[q].hand.filter(v=>v.uid!==h.uid);sendCard(s,q,h.card,'banished');}return;}
  if(step.op==='swapSites'){exchangeSites(s,source.at,selected.at);return;}
  if(step.op==='resolveLegacySpell'){resolveMagic(s,p,card(frame.effectCard),step.action);return;}
  if(step.op==='pendulumSwing'){const options=selectEffects(s,frame,{kind:'location',adjacent:true,sameRegion:true,untargeted:true});if(selected===undefined&&options.length){s.choice={player:p,title:s.players[p].name+' · Pendulum of Peril · 選相鄰位置',options,frame};return;}const places=[{at:source.at,layer:source.layer||'surface'},...(selected?[selected]:[])];for(const u of [...s.units])if(!u.dying&&card(u.card).type==='Minion'&&places.some(v=>occupied(u).includes(v.at)&&(u.layer||'surface')===v.layer))kill(s,u);return;}
  if(step.op==='shrineDragons'){const targets=s.units.filter(u=>!u.dying&&unitTypes(u).includes('Dragon'));for(const u of targets)if((u.size!==2||source.at%5<4&&source.at<15)&&occupied({...u,at:source.at}).every((at,i)=>canEnterOnGround(s,u,{at:occupied(u)[i],layer:u.layer||'surface'},{at,layer:source.layer||'surface'},card,keywords,true))){u.carryTeleport=true;u.at=source.at;u.layer=source.layer||'surface';u.notRest=true;u.burrowedSafely=false;}return;}
  if(step.op==='spearCommit'){if(selected===null)return;const a=step.action,o=s.artifacts.find(o=>o.uid===a.object),target=unit(s,step.target.uid);assert(o&&target&&occupied(target).includes(selected.at)&&selected.layer===(target.layer||'surface'),'神槍落點已失效');assert(legalActions(s,p).some(v=>v.type==='activateArtifact'&&v.object===a.object&&v.index===a.index),'持有者無法啟動神槍');commitArtifact(s,{...a,spearLocation:selected},step.target);return;}
  if(step.op==='dragonGift'){(s.ongoingEffects||(s.ongoingEffects=[])).push({op:'freeDragon',at:source.at,layer:source.layer||'surface',controller:p,end:s.turn});return;}
  if(step.op==='assassinCommit'){if(selected===null)return;const actor=unit(s,step.action.unit),o=s.artifacts.find(o=>o.uid===selected&&o.bearer===actor?.uid);assert(actor&&o&&ready(s,actor),'投擲者或神器已失效');assert(selectEffects(s,{source:actor,controller:p},definitions[card(actor.card).slug].activated[step.action.index].steps[0].select).some(v=>v.value.uid===step.target.uid),'投擲目標已失效');commitAbility(s,{...step.action,throwObject:o.uid},step.target);return;}
  if(step.op==='dracoArrive'){const actor=unit(s,source.uid),target=unit(s,step.uid);if(actor&&!actor.dying&&target&&!target.dying&&sameLocation(s,actor,target)&&s.board[target.at]&&!waterSite(s,target.at,card)&&(target.layer||'surface')==='surface'&&canEnterOnGround(s,target,target,{at:target.at,layer:'below'},card,keywords)){target.layer='below';target.notRest=true;target.burrowedSafely=false;}return;}
  if(step.op==='bonekiteRaise'){const n=(s.deathHistory||[]).slice(step.from).filter(d=>step.victims.includes(d.uid)).length;for(let i=0;i<n;i++)if(canSummonEntry(s,p,card('skeleton'),step.at,step.layer)&&paySummoningTax(s,card('skeleton').id,p,p)){const u=makeUnit(s,card('skeleton').id,p,step.at);u.layer=step.layer;}return;}
  if(step.op==='balorRay'){const ray=[],d=selected-1;let x=source.at%5+[0,1,0,-1][d],y=Math.floor(source.at/5)+[-1,0,1,0][d];while(x>=0&&x<5&&y>=0&&y<4){const at=y*5+x;for(const layer of s.board[at]?['surface','below']:['surface'])ray.push({at,layer});x+=[0,1,0,-1][d];y+=[-1,0,1,0][d];}queueEffects(s,[{op:'balorChoose',locations:ray,hits:[]}],source,p);return;}
  if(step.op==='balorChoose'){if(!step.locations.length){queueEffects(s,[{op:'balorDamage',hits:step.hits}],source,p);return;}const here=step.locations[0],options=selectEffects(s,frame,{kind:'unit',uids:s.units.filter(u=>!u.dying&&occupied(u).includes(here.at)&&(u.layer||'surface')===here.layer).map(u=>u.uid),anyRegion:true,untargeted:true});if(!options.length){queueEffects(s,[{...step,locations:step.locations.slice(1)}],source,p);return;}if(selected===undefined){s.choice={player:p,title:'Balor · '+String.fromCharCode(65+here.at%5)+(4-Math.floor(here.at/5))+' · '+(here.layer==='below'?'下層':'表面／虛空'),options,frame};return;}queueEffects(s,[{...step,locations:step.locations.slice(1),hits:[...step.hits,{uid:selected.uid,...here}]}],source,p);return;}
  if(step.op==='balorDamage'){for(const hit of step.hits){const u=unit(s,hit.uid);if(u&&!u.dying&&occupied(u).includes(hit.at)&&(u.layer||'surface')===hit.layer)hurt(s,u,2,false,'ability',source);}return;}
  if(step.op==='exchangeLife'){const totals=s.players.map(pl=>pl.life);for(let q=0;q<2;q++){const pl=s.players[q];if(pl.doorTurn!==null)continue;pl.life=totals[1-q];if(pl.life<totals[q])pl.lostLifeTurn=s.turn;if(pl.life===0)pl.doorTurn=s.turn;}return;}
  if(step.op==='faerieDiscards'){const n=s.units.filter(u=>!u.dying&&unitTypes(u).includes('Faerie')).length;queueEffects(s,[{op:'courtDiscard',player:p,remaining:n},{op:'courtDiscard',player:1-p,remaining:n}],source,p);return;}
  if(step.op==='courtDiscard'){const q=step.player,pl=s.players[q],options=pl.hand.filter(h=>card(h.card).category==='Spell');if(step.remaining<=0||!options.length)return;if(selected===undefined){s.choice={player:q,title:s.players[q].name+' · Unseelie Court · 棄一張法術',options:options.map(h=>({label:card(h.card).name,value:h.uid})),frame};return;}const h=options.find(h=>h.uid===selected);if(h){pl.hand=pl.hand.filter(v=>v.uid!==h.uid);sendCard(s,q,h.card,'cemetery');queueEffects(s,[{...step,remaining:step.remaining-1}],source,p);}return;}
  if(step.op==='warpDeath'){const u=unit(s,step.uid);if(u&&!u.dying)kill(s,u,false,true);return;}
  if(step.op==='iceBind'){const u=unit(s,source.uid);if(u){u.iceTurns=3;u.iceBoundAt=s.turn;}return;}
  if(step.op==='gargCocoon'){const spider=unit(s,source.uid),target=unit(s,step.uid);if(spider&&!spider.dying&&target&&!target.dying&&sameLocation(s,spider,target))target.cocoon=true;return;}
  if(step.op==='percevalSite'){const u=unit(s,source.uid);if(!u||u.dying)return;if(selected===undefined){const options=s.board.flatMap((site,at)=>site?[{label:card(site.card).name+' · '+String.fromCharCode(65+at%5)+(4-Math.floor(at/5)),value:at}]:[]);if(options.length)s.choice={player:1-p,title:s.players[1-p].name+' · Sir Perceval · 選擇一個地點',options,frame};return;}const site=s.board[selected];if(site){if(!site.uid)site.uid='s'+s.next++;u.questSite=site.uid;}return;}
  if(step.op==='elementGift'){const u=unit(s,source.uid);if(u){if(step.element)(u.elementGifts||(u.elementGifts=[])).push({element:step.element,amount:step.amount,turn:s.turn});else{u.elementGiftCount=u.elementGiftTurn===s.turn?(u.elementGiftCount||0)+1:1;u.elementGiftTurn=s.turn;}}return;}
  if(step.op==='wiccanGift'){const u=unit(s,source.uid);if(u){u.mods.push({keyword:'Spellcaster',end:s.turn});u.ignoreThresholdTurn=s.turn;}return;}
  if(step.op==='bloodPayment'){s.players[p].bloodManaTurn=s.turn;return;}
  if(step.op==='templeMana'){s.players[p].bonusMana=(s.players[p].bonusMana||0)+2*siteMultiplier(s,source.at);return;}
  if(step.op==='sacrificeUnitCost'){const u=unit(s,step.uid);if(u)kill(s,u,false,true,true);return;}
  if(step.op==='flameStopLife'){heal(s,p,1);loseLife(s,1-p,1);return;}
  if(step.op==='hirePay'){if(selected===null)return;const target=unit(s,step.target),h=s.players[p].hand.find(h=>h.uid===selected.uid);if(target&&!target.dying&&h){s.players[p].hand=s.players[p].hand.filter(v=>v.uid!==h.uid);sendCard(s,p,h.card,'cemetery');bindControl(s,target,p,{});}return;}
  if(step.op==='armySkeleton'){if(canSummonEntry(s,p,card('skeleton'),step.at,step.layer||'surface')&&paySummoningTax(s,card('skeleton').id,p,p)){const u=makeUnit(s,card('skeleton').id,p,step.at);u.layer=step.layer||'surface';summonedGenesis(s,u);}return;}
  if(step.op==='stopDamage'){const u=unit(s,source.uid);if(!u||u.dying)return;const targets=s.units.filter(v=>v.uid!==u.uid&&!v.dying&&sameLocation(s,u,v));if(targets.length)hurt(s,targets[rollIndex(s,targets.map(v=>card(v.card).name))],step.amount,false,'ability',u);return;}
  if(step.op==='marchStart'){queueEffects(s,[{op:'marchStep',direction:step.forward?(p===0?0:2):selected-1,remaining:step.remaining,mode:step.mode}],source,p,frame.effectCard);return;}
  if(step.op==='marchStep'){const u=unit(s,source.uid);if(!u||u.dying||disabled(u))return;const x=u.at%5+[0,1,0,-1][step.direction],y=Math.floor(u.at/5)+[-1,0,1,0][step.direction],at=y*5+x;if(x<0||x>4||y<0||y>3||!locations(s,u,card,keywords,true).some(v=>v.at===at&&v.layer===(u.layer||'surface')&&v.path.length===1))return;u.at=at;u.notRest=true;u.burrowedSafely=false;queueEffects(s,[{op:'marchImpact',mode:step.mode},...(step.remaining>1?[{...step,remaining:step.remaining-1}]:[])],u,p,frame.effectCard);return;}
  if(step.op==='marchImpact'){const u=unit(s,source.uid);if(!u||u.dying)return;const targets=s.units.filter(v=>v.uid!==u.uid&&!v.dying&&sameLocation(s,u,v)&&(step.mode!=='bull'||!v.tapped));if(step.mode==='bull')for(const v of targets.reverse())queueEffects(s,[{op:'strike',untargeted:true,select:{kind:'unit',uids:[v.uid],anyRegion:true,untargeted:true}}],u,p,frame.effectCard);else if(targets.length)queueEffects(s,[{op:'strike',untargeted:true,select:{kind:'unit',uids:targets.map(v=>v.uid),anyRegion:true,untargeted:true}}],u,p,frame.effectCard);return;}
  if(step.op==='triggerSiteGenesis'){const site=s.board[selected.at];if(site&&!site.silenced&&!site.disabled)queueEffects(s,definitions[card(site.card).slug]?.genesis||[],{...site,at:selected.at,uid:site.uid||'site:'+selected.at,layer:'surface'},site.controller);return;}
  if(step.op==='forcedFlyUnit'){const u=unit(s,selected.uid);if(u&&!u.dying)queueEffects(s,[{op:'forcedFlyChoice',uid:u.uid}],source,p,frame.effectCard);return;}
  if(step.op==='forcedFlyChoice'){const u=unit(s,step.uid);if(!u||u.dying)return;const options=s.board.flatMap((site,at)=>site&&at!==u.at&&nearby(u.at,at)&&(u.size!==2||at%5<4&&at<15)&&occupied({...u,at}).every((cell,i)=>canEnterOnGround(s,u,{at:occupied(u)[i],layer:u.layer||'surface'},{at:cell,layer:'surface'},card,keywords,false,true))?[{label:String.fromCharCode(65+at%5)+(4-Math.floor(at/5)),value:at}]:[]);if(selected===undefined){if(options.length)s.choice={player:p,title:'選擇附近地點飛送至上方',options,frame};return;}if(options.some(o=>o.value===selected)){u.carryFlying=true;u.at=selected;u.layer='surface';u.notRest=true;u.burrowedSafely=false;}return;}
  if(step.op==='rapidsUnit'){const u=unit(s,selected.uid);if(u&&!u.dying)queueEffects(s,[{op:'rapidsPush',uid:u.uid}],source,p,frame.effectCard);return;}
  if(step.op==='rapidsPush'){const u=unit(s,step.uid);if(!u||u.dying)return;const options=Array.from({length:20},(_,at)=>at).filter(at=>distance(u.at,at)===1&&(u.size!==2||at%5<4&&at<15)&&occupied({...u,at}).every((cell,i)=>region(s,{at:cell,layer:u.layer})===region(s,{at:occupied(u)[i],layer:u.layer})&&canEnterOnGround(s,u,{at:occupied(u)[i],layer:u.layer||'surface'},{at:cell,layer:u.layer||'surface'},card,keywords)));if(selected===undefined){if(options.length)s.choice={player:p,title:'River Rapids · 推動一步',options:options.map(at=>({label:String.fromCharCode(65+at%5)+(4-Math.floor(at/5)),value:at})),frame};return;}if(options.includes(selected)){u.at=selected;u.notRest=true;u.burrowedSafely=false;}return;}
  if(step.op==='faeDirection'){if(selected!==null)commitSite(s,{...step.action,direction:selected},step.ally);return;}
  if(step.op==='faeShoot'){queueEffects(s,[{op:'projectile',amount:1}],source,p,frame.effectCard);s.storyline[s.storyline.length-1].selected=step.direction;return;}
  if(step.op==='salmonD20'){const fish=unit(s,step.salmon),roll=rollIndex(s,Array.from({length:20},(_,i)=>String(i+1)))+1;log(s,'Salmon of Knowledge · d20 = '+roll);if(roll>=14&&fish&&!fish.dying){kill(s,fish,true);queueEffects(s,Array.from({length:3},()=>({op:'drawOne',deck:'spells'})),source,p,frame.effectCard);}return;}
  if(step.op==='sporeCasting'){s.players[p].sporeCastTurn=s.turn;return;}
  if(step.op==='sarcophagusPair'){const all=[0,1].flatMap(player=>graveEntries(s,player)).filter(g=>card(g.card).category==='Spell'),pairs=all.filter(g=>all.some(v=>v.uid!==g.uid&&v.card===g.card));if(selected===undefined){if(pairs.length)s.choice={player:p,title:'Sphinx Sarcophagus · 選擇兩張同名法術',options:pairs.map(g=>({label:card(g.card).name+' · 玩家 '+(g.player+1),value:g})),frame};return;}if(!step.first){const options=all.filter(g=>g.card===selected.card&&g.uid!==selected.uid);if(options.length)s.choice={player:p,title:'選擇另一張同名法術',options:options.map(g=>({label:card(g.card).name+' · 玩家 '+(g.player+1),value:g})),frame:{...frame,step:{...step,first:selected}}};return;}const picks=[step.first,selected];if(picks.every(g=>graveEntries(s,g.player).some(v=>v.uid===g.uid&&v.card===g.card))){for(const pick of picks){const g=graveEntries(s,pick.player).find(v=>v.uid===pick.uid);takeGrave(s,g.player,g.index,g.card,g.uid);s.players[g.player].banished.push(g.card);}queueEffects(s,[{op:'drawCards',count:1}],source,p,frame.effectCard);}return;}
  if(step.op==='camlannChoose'){if(resources(s,p).fire<3&&!step.started)return;const remaining=step.remaining||[1-s.active,s.active],kept=[...step.kept||[],...(selected?[selected.uid]:[])];if(!remaining.length){const victims=s.units.filter(u=>!u.dying&&card(u.card).type==='Minion'&&!kept.includes(u.uid)).sort((a,b)=>(a.controller===s.active)-(b.controller===s.active));for(const u of victims)kill(s,u);return;}const next=remaining[0],options=selectEffects(s,{...frame,controller:next},{kind:'unit',minion:true,ally:true,anyRegion:true,untargeted:true});if(options.length)s.choice={player:next,title:'Fields of Camlann · 選擇保留一個僕從',options,frame:{...frame,step:{...step,started:true,remaining:remaining.slice(1),kept}}};else queueEffects(s,[{...step,started:true,remaining:remaining.slice(1),kept}],source,p,frame.effectCard);return;}
  if(step.op==='frontierPlay'){const u=unit(s,source.uid),id=s.players[p].atlas[0];if(!u||!id||!siteTargetsForFrontier(s,u).includes(selected.at))return;s.players[p].atlas.shift();log(s,'Frontier Settlers 揭示 '+card(id).name+'。');queueEffects(s,[{op:'frontierMove',uid:u.uid,at:selected.at,layer:u.layer||'surface'}],source,p,frame.effectCard);enterSite(s,p,id,selected.at);return;}
  if(step.op==='frontierMove'){const u=unit(s,step.uid);if(u&&!u.dying&&canEnterOnGround(s,u,u,{at:step.at,layer:step.layer},card,keywords)){u.at=step.at;u.layer=step.layer;u.notRest=true;u.burrowedSafely=false;}return;}
  if(step.op==='hutSwap'){if(emptySite(s,selected.at))exchangeSites(s,source.at,selected.at);return;}
  if(step.op==='proceedEnd'){if(!['end','endRequested','over'].includes(s.phase)){s.phase='endRequested';s.storyline.unshift({source:clone(avatar(s,s.active)),controller:s.active,effectCard:source.card,step:{op:'beginEnd'}});}return;}
  if(step.op==='beginEnd'){beginEndPhase(s,s.active);return;}
  if(step.op==='weddingVictory'){const site=s.board[source.at];if(site?.card===source.card&&!site.silenced&&!site.disabled&&['king_arthur','queen_guinevere'].every(slug=>s.units.some(u=>!u.dying&&card(u.card).slug===slug&&occupied(u).includes(source.at)))){s.winner=p;s.phase='over';log(s,'Wedding Hall：Arthur 與 Guinevere 同在，'+s.players[p].name+' 獲勝。');}return;}
  if(step.op==='chooseCompanion'){const u=unit(s,source.uid);if(u)u.companion=selected.uid;return;}
  if(step.op==='wardTransferFrom'){const from=selected.entity==='site'?s.board[selected.at]:unit(s,selected.uid);if(from?.ward)queueEffects(s,[{op:'wardTransferTo',from:selected,untargeted:true,select:{kind:'wardable',nearby:true,nonEvil:true,untargeted:true}}],source,p,frame.effectCard);return;}
  if(step.op==='wardTransferTo'){const from=step.from.entity==='site'?s.board[step.from.at]:unit(s,step.from.uid),to=selected.entity==='site'?s.board[selected.at]:unit(s,selected.uid);if(from?.ward&&to){from.ward=false;to.ward=true;}return;}
  if(step.op==='commitPairSites'){if(selected!==null){const actor=unit(s,step.action.unit),filter=definitions[card(actor.card).slug].activated[step.action.index].steps[0].select,options=selectEffects(s,{source:actor,controller:p},filter);if(options.some(o=>o.value.at===step.first.at)&&options.some(o=>o.value.at===selected.at)&&step.first.at!==selected.at)commitAbility(s,{...step.action,pairSitesDeclared:true,pairSecond:selected},step.first);}return;}
  if(step.op==='swapEmptySites'){if(step.second&&emptySite(s,selected.at)&&emptySite(s,step.second.at))exchangeSites(s,selected.at,step.second.at);return;}
  if(step.op==='abyssDestination'){const u=unit(s,step.uid);if(!u||u.dying)return;const options=[];if((u.layer||'surface')==='surface'&&occupied(u).every(at=>waterSite(s,at,card)))options.push({label:'潛入目前水地點',value:{at:u.at,layer:'below'}});for(let at=0;at<20;at++)if(distance(u.at,at)===1&&(u.size!==2||at%5<4&&at<15)&&occupied({...u,at}).some(cell=>!occupied(u).includes(cell)&&!s.board[cell])&&occupied({...u,at}).every((cell,i)=>canEnterOnGround(s,u,{at:occupied(u)[i],layer:u.layer||'surface'},{at:cell,layer:'surface'},card,keywords)))options.push({label:'拉入虛空 · '+String.fromCharCode(65+at%5)+(4-Math.floor(at/5)),value:{at,layer:'surface'}});if(selected===undefined){if(options.length)s.choice={player:p,title:'Into the Abyss · 選擇下潛或虛空',options,frame};return;}if(options.some(o=>eq(o.value,selected)))queueEffects(s,[{op:'dragStep',uid:u.uid,from:{at:u.at,layer:u.layer||'surface'},to:selected,ignoreRegions:true}],source,p,frame.effectCard);return;}
  if(step.op==='commitPairAbility'){if(selected!==null)commitAbility(s,{...step.action,pairDeclared:true,pairSecond:selected},step.first);return;}
  if(step.op==='shatterDeclare'){if(selected!==null)commitSpell(s,{...step.action,shatterTarget:selected},step.ally);return;}
  if(step.op==='kissersChoice'){if(selected===undefined){const options=selectEffects(s,frame,{kind:'unit',minion:true,wounded:true,nearby:true});s.choice={player:p,title:'Kissers of Wounds',options:[...options,{label:'治療你 2 點生命',value:'heal'}],frame};return;}if(selected==='heal')heal(s,p,2);else{const u=unit(s,selected.uid);targetDeclared(s,source,selected);if(u&&!blocked(s,p,u)&&!unitUmbrellas(u).includes('Evil'))u.ward=true;}return;}
  if(step.op==='instigatorPlace'){const uids=s.units.filter(u=>!u.dying&&u.controller!==p&&occupied(u).includes(selected.at)&&(u.layer||'surface')===selected.layer).map(u=>u.uid);if(uids.length>=2)queueEffects(s,[{op:'pairFirst',untargeted:true,select:{kind:'unit',uids,anyRegion:true,untargeted:true}}],source,p,frame.effectCard);return;}
  if(step.op==='pairFirst'){const first=unit(s,selected.uid);if(!first||first.dying)return;const uids=s.units.filter(u=>u.uid!==first?.uid&&!u.dying&&u.controller!==p&&sameLocation(s,u,first)).map(u=>u.uid);if(first&&uids.length)queueEffects(s,[{op:'pairFight',first:first.uid,untargeted:true,select:{kind:'unit',uids,anyRegion:true,untargeted:true}}],source,p,frame.effectCard);return;}
  if(step.op==='pairFight'||step.op==='liesFight'){const first=unit(s,step.first),second=unit(s,selected.uid);if(first&&!first.dying&&second&&!second.dying&&sameLocation(s,first,second)){if(step.op==='liesFight'&&blocked(s,p,second))return;fight(s,{attacker:first.uid,defenders:[second.uid],kind:'spell'});}return;}
  if(step.op==='replicaPlace'){if(selected===undefined){const options=[...selectEffects(s,frame,{kind:'location'}),...selectEffects(s,frame,{kind:'unit',ally:true,anyRegion:true,untargeted:true})];s.choice={player:p,title:'Replication · 選擇複製品出現位置',options,frame};return;}const bearer=selected.entity==='unit'?unit(s,selected.uid):null;if(selected.entity==='unit'&&!bearer)return;const a={uid:'o'+s.next++,card:step.card,owner:p,controller:p,tokenCopy:true,at:bearer?.at??selected.at,layer:bearer?.layer||selected.layer||'surface',bearer:bearer?.uid||null};s.artifacts.push(a);refreshContinuous(s);if(!a.silenced)queueEffects(s,definitions[card(a.card).slug]?.genesis||[],a,p);return;}
  if(step.op==='seerPeek'){if(selected===undefined){s.choice={player:p,title:'Seer · 查看哪一副牌庫的頂牌？',options:[{label:'Atlas 地點',value:'atlas'},{label:'Spellbook 法術',value:'spells'}],frame};return;}queueEffects(s,[{op:'peekSpell',deck:selected}],source,p,frame.effectCard);return;}
  if(step.op==='divineBreak'){if(selected===null){queueEffects(s,[{op:'divineHit',at:step.at,amount:step.amount}],source,p,frame.effectCard);return;}let amount=step.amount;if(selected){const ward=selected.entity==='unit'?unit(s,selected.uid):s.board[selected.at];if(ward?.ward){ward.ward=false;amount++;}}const options=selectEffects(s,frame,{kind:'wardMark',ally:true,anyRegion:true,untargeted:true});if(options.length)s.choice={player:p,title:'Divine Lance · 可打破盟友 Ward 增加傷害（目前 '+amount+'）',options:[...options,{label:'開始造成傷害',value:null}],frame:{...frame,step:{...step,amount}}};else queueEffects(s,[{op:'divineHit',at:step.at,amount}],source,p,frame.effectCard);return;}
  if(step.op==='divineHit'){for(const u of s.units)if(!u.dying&&card(u.card).type==='Minion'&&occupied(u).includes(step.at))hurt(s,u,step.amount,false,'magic',source);return;}
  if(step.op==='stoneRainHit'){if(step.remaining<=0)return;damageSite(s,step.at,1);for(const u of s.units)if(!u.dying&&(u.layer||'surface')==='surface'&&occupied(u).includes(step.at))hurt(s,u,1,false,'magic',source);if(step.remaining>1)queueEffects(s,[{...step,remaining:step.remaining-1}],source,p,frame.effectCard);return;}
  if(step.op==='pithSteal'){const hand=s.players[1-p].hand.filter(h=>card(h.card).category==='Spell');if(hand.length){const h=hand[rollIndex(s,hand.map(h=>card(h.card).name))];s.players[1-p].hand=s.players[1-p].hand.filter(v=>v.uid!==h.uid);(s.boundSpells||(s.boundSpells=[])).push({uid:'b'+s.next++,card:h.card,owner:1-p,unit:source.uid,requiresSpellcaster:true,returnToHand:true});log(s,'Pith Imp 揭示並偷走 '+card(h.card).name+'。');}return;}
  if(step.op==='hyenaFeast'){if(selected===null)return;const options=selectEffects(s,frame,{kind:'grave',includeUnsupported:true});if(selected===undefined){if(step.remaining>0&&options.length)s.choice={player:p,title:'Redmane Hyena · 最多再放逐 '+step.remaining+' 張',options:[...options,{label:'完成',value:null}],frame};return;}const g=graveEntries(s,selected.player).find(g=>g.uid===selected.uid);if(g){takeGrave(s,g.player,g.index,g.card,g.uid);s.players[g.player].banished.push(g.card);const u=unit(s,source.uid);if(u&&!u.hyenaDemon&&card(g.card).subtypes.includes('Demon')){u.hyenaDemon=true;u.mods.push({power:2,types:['Demon']});}if(step.remaining>1)queueEffects(s,[{...step,remaining:step.remaining-1}],source,p,frame.effectCard);}return;}
  if(step.op==='konrulChoose'){if(selected===null)return;const picks=[...step.picks,...(selected?[selected.uid]:[])],options=selectEffects(s,frame,{kind:'grave',own:true,minion:true,includeUnsupported:true}).filter(o=>!picks.includes(o.value.uid));if(picks.length===3){queueEffects(s,[{op:'konrulReturn',picks}],source,p,frame.effectCard);return;}if(options.length>=3-picks.length)s.choice={player:p,title:'Xeraphine Konrul · 選擇三張死去僕從（'+picks.length+'/3）',options:[...options,...(!picks.length?[{label:'略過',value:null}]:[])],frame:{...frame,step:{...step,picks}}};return;}
  if(step.op==='konrulReturn'){const graves=graveEntries(s,p).filter(g=>step.picks.includes(g.uid));if(graves.length!==3)return;if(selected===undefined){s.choice={player:p,title:'放逐另外兩張，將此張返回手牌',options:graves.map(g=>({label:card(g.card).name,value:g.uid})),frame};return;}for(const uid of step.picks){const g=graveEntries(s,p).find(g=>g.uid===uid);if(g){takeGrave(s,p,g.index,g.card,g.uid);if(g.uid===selected)s.players[p].hand.push({uid:'h'+s.next++,card:g.card});else s.players[p].banished.push(g.card);}}return;}
  if(step.op==='thiefSteal'){const thief=unit(s,source.uid),target=unit(s,step.target);if(!thief||thief.dying||!target||!sameLocation(s,thief,target))return;const artifacts=s.artifacts.filter(a=>a.bearer===target.uid&&carriable(card(a.card)));if(selected===undefined){if(artifacts.length)s.choice={player:p,title:'Sneak Thief · 偷取一件 Artifact',options:artifacts.map(a=>({label:card(a.card).name,value:a.uid})),frame};return;}const a=artifacts.find(a=>a.uid===selected);if(a){a.bearer=thief.uid;a.at=thief.at;a.layer=thief.layer||'surface';}return;}
  if(step.op==='oneShotChoice'){if(selected===undefined){s.choice={player:p,title:'One-Shot Wizard',options:[{label:'發射傷害 1 的投射物',value:'shot'},{label:'本回合獲得 Spellcaster',value:'caster'}],frame};return;}if(selected==='caster'){const u=unit(s,source.uid);if(u)u.mods.push({keyword:'Spellcaster',end:s.turn});}else queueEffects(s,[{op:'projectile',amount:1}],source,p,frame.effectCard);return;}
  if(step.op==='seedVoid'){if(selected===null)return;if(selected===undefined){const options=s.board.flatMap((site,at)=>!site?[{label:String.fromCharCode(65+at%5)+(4-Math.floor(at/5)),value:at}]:[]);if(options.length&&step.remaining>0)s.choice={player:p,title:'Star Seeds of Uhr · 還可填入 '+step.remaining+' 格',options:[...options,{label:'完成',value:null}],frame};return;}if(!s.board[selected]){s.board[selected]={uid:'s'+s.next++,card:card('rubble').id,owner:null,controller:null,ward:false};if(step.remaining>1)queueEffects(s,[{...step,remaining:step.remaining-1}],source,p,frame.effectCard);}return;}
  if(step.op==='shatterAlly'||step.op==='assaultAlly'){const u=unit(s,selected.uid);if(!u||u.dying)return;if(step.op==='shatterAlly'){queueEffects(s,[{op:'shatterEnemy',select:{kind:'unit',enemy:true,adjacent:true}}],u,p,frame.effectCard);if(step.shatterTarget)s.storyline[s.storyline.length-1].selected=step.shatterTarget;}else if(power(u)>0)queueEffects(s,[{op:'assaultPoint',remaining:power(u),optional:true,untargeted:true,select:{kind:'unit',nearby:true,untargeted:true}}],u,p,frame.effectCard);return;}
  if(step.op==='assaultPoint'){const u=unit(s,source.uid),target=unit(s,selected?.uid);if(!u||u.dying||!target)return;startEvent(s,u,u.card);hurt(s,target,1,false,'ability',u);if(step.remaining>1)queueEffects(s,[{...step,remaining:step.remaining-1}],u,p,frame.effectCard);return;}
  if(step.op==='shatterArtifact'){const u=unit(s,source.uid),target=unit(s,step.target);if(!u||u.dying||!target||target.dying)return;const artifacts=s.artifacts.filter(a=>a.bearer===target.uid);if(selected===undefined&&artifacts.length){s.choice={player:p,title:'Shatter Strike · 摧毀一件攜帶中的 Artifact',options:artifacts.map(a=>({label:card(a.card).name,value:a.uid})),frame};return;}const a=artifacts.find(a=>a.uid===selected);if(a)removeObject(s,a,'cemetery');queueEffects(s,[{op:'shatterHit',uid:target.uid}],u,p,frame.effectCard);return;}
  if(step.op==='shatterHit'){const u=unit(s,source.uid),target=unit(s,step.uid);if(u&&!u.dying&&target&&!target.dying&&distance(u.at,target.at)===1&&region(s,u)===region(s,target))strike(s,u,target);return;}
  if(step.op==='puppetControl'){for(const u of s.units)if(card(u.card).type==='Minion'&&u.tapped&&!u.dying&&sameLocation(s,u,source))bindControl(s,u,p,{source:source.uid});return;}
  if(step.op==='infiltrateControl'){const u=unit(s,step.uid);if(u?.stealth)bindControl(s,u,p,{untilStealth:true});return;}
  if(step.op==='sacrificeRelic'){const a=s.artifacts.find(a=>a.uid===step.uid);if(a)removeObject(s,a,'cemetery');return;}
  if(step.op==='greedSnatch'){const u=unit(s,source.uid);if(!u||u.dying)return;const items=s.artifacts.filter(a=>carriable(card(a.card))&&a.bearer!==u.uid);if(!items.length)return;if(selected===undefined){s.choice={player:p,title:'Lord of Greed · 必須取得一件可攜帶物品',options:items.map(a=>({label:card(a.card).name,value:a.uid})),frame};return;}const a=items.find(a=>a.uid===selected);if(a){a.bearer=u.uid;a.at=u.at;a.layer=u.layer||'surface';}return;}
  if(step.op==='artifactRepel'){const a=s.artifacts.find(a=>a.uid===source.uid);if(a)for(const u of [...s.units])if(card(u.card).type==='Minion'&&sameLocation(s,u,a)&&(step.evil&&unitUmbrellas(u).includes('Evil')||step.airborne&&keywords(u).includes('Airborne')))leaveUnit(s,u,'hand');return;}
  if(step.op==='deathGenesisKeywords'){const u=unit(s,source.uid);if(u&&printedKeywords(card(u.card)).includes('Lance'))acquireLance(s,u,p);return;}
  if(step.op==='dispelSelfAura'){const a=s.auras.find(a=>a.uid===source.uid);if(a)removeObject(s,a,'cemetery');return;}
  if(step.op==='auraCull'){const a=s.auras.find(a=>a.uid===source.uid);if(!a)return;const pool=s.units.filter(u=>!u.dying&&card(u.card).type==='Minion'&&occupied(u).some(at=>s.board[at]&&inside(a,at))),value=step.strongest?Math.max(...pool.map(u=>power(u))):Math.min(...pool.map(u=>power(u))),options=pool.filter(u=>power(u)===value);if(!options.length){removeObject(s,a,'cemetery');return;}if(selected===undefined&&options.length>1){s.choice={player:p,title:step.strongest?'Great Famine · 選擇並列最強僕從':'Black Plague · 選擇並列最弱僕從',options:options.map(u=>({label:card(u.card).name,value:u.uid})),frame};return;}const u=selected?options.find(u=>u.uid===selected):options[0];if(u){queueEffects(s,[{op:'auraCullCheck',uid:u.uid}],source,p);kill(s,u);}return;}
  if(step.op==='auraCullCheck'){if(!(s.deathHistory||[]).some(d=>d.uid===step.uid)){const a=s.auras.find(a=>a.uid===source.uid);if(a)removeObject(s,a,'cemetery');}return;}
  if(step.op==='cursedIronEnd'){const a=s.auras.find(a=>a.uid===source.uid);if(!a)return;for(const item of s.artifacts.filter(o=>o.bearer&&inside(a,o.at))){const u=unit(s,item.bearer);if(u&&!u.dying){startEvent(s,item,item.card);hurt(s,u,1,false,'ability',item);}}return;}
  if(step.op==='ainoStep'){const u=unit(s,source.uid);if(!u||u.dying||disabled(u))return;const options=locations(s,{...u,verticalWrap:true},card,keywords,true).filter(v=>v.path.length===1&&Math.abs(Math.floor(v.at/5)-Math.floor(u.at/5))===3);if(!options.length)return;if(selected===undefined){s.choice={player:p,title:'Aino · 可跨越上下邊界一步並獲得 Stealth',options:[...options.map(v=>({label:String.fromCharCode(65+v.at%5)+(4-Math.floor(v.at/5)),value:{at:v.at,layer:v.layer}})),{label:'不移動',value:null}],frame:{...frame,step:{...step,may:true}}};return;}if(selected&&options.some(v=>v.at===selected.at&&v.layer===selected.layer)){u.at=selected.at;u.layer=selected.layer;u.stealth=true;}return;}
  if(step.op==='playTypedSite'){const options=s.players[p].hand.filter(h=>card(h.card).type==='Site'&&(card(h.card).water>0)===step.water&&siteTargets(s,p,card(h.card)).length);if(selected===undefined){if(!options.length)return;s.choice={player:p,title:'可打出一張'+(step.water?'水':'陸地')+'地點',options:[...options.map(h=>({label:card(h.card).name,value:h.uid})),{label:'不打出地點',value:null}],frame:{...frame,step:{...step,may:true}}};return;}if(selected===null)return;const h=options.find(h=>h.uid===selected);if(h)queueEffects(s,[{op:'playTypedSiteAt',hand:h.uid,card:h.card}],source,p);return;}
  if(step.op==='playTypedSiteAt'){const h=s.players[p].hand.find(h=>h.uid===step.hand&&h.card===step.card);if(!h)return;const options=siteTargets(s,p,card(h.card));if(!options.length)return;if(selected===undefined){s.choice={player:p,title:'選擇打出地點的位置',options:options.map(at=>({label:String.fromCharCode(65+at%5)+(4-Math.floor(at/5)),value:at})),frame};return;}if(options.includes(selected)){s.players[p].hand=s.players[p].hand.filter(v=>v.uid!==h.uid);enterSite(s,p,h.card,selected);}return;}
  if(step.op==='portalFirst'){const site=s.board[selected.at];if(site){if(!site.uid)site.uid='s'+s.next++;queueEffects(s,[{op:'portalSecond',first:site.uid,untargeted:true,select:{kind:'site',excludeAt:selected.at,untargeted:true}}],source,p);}return;}
  if(step.op==='portalSecond'){const site=s.board[selected.at];if(site&&s.board.some(v=>v?.uid===step.first)){if(!site.uid)site.uid='s'+s.next++;(s.ongoingEffects||(s.ongoingEffects=[])).push({op:'pairedSites',siteUids:[step.first,site.uid],end:s.turn});}return;}
  if(step.op==='knighthoodAlly'){const u=unit(s,selected.uid);if(u)queueEffects(s,[{op:'searchSummon',zones:['hand'],types:['Knight','Sir','Dame'],includeUmbrellas:true}],u,p,frame.effectCard);return;}
  if(step.op==='conjureBroken'){const g=graveEntries(s,selected.player).find(g=>g.uid===selected.uid&&g.card===selected.card);if(g){takeGrave(s,g.player,g.index,g.card,g.uid);const a={uid:'o'+s.next++,card:g.card,owner:g.player,controller:p,bearer:null,at:source.at,layer:source.layer||'surface'};s.artifacts.push(a);queueEffects(s,definitions[card(g.card).slug]?.genesis||[],a,p);}return;}
  if(step.op==='chooseDeathReplacement'){const u=unit(s,step.uid);if(!u)return;const options=deathReplacements(s,u);if(selected===undefined&&options.length>1){s.choice={player:u.controller,title:'選擇死亡替代效果',options:options.map(o=>({label:o.label,value:o})),frame};return;}delete u.deathReplacementPending;const option=selected?options.find(o=>o.uid===selected.uid):options[0];if(option)replaceDeath(s,u,option);else kill(s,u,false,step.death);return;}
  if(step.op==='wakeHollow'){const u=unit(s,step.uid);if(u)u.awakenedByDeath=true;return;}
  if(step.op==='nosferatuReturn'){const old=unit(s,source.uid),at=p===0?17:2;if(!old||!s.board[at]||!canSummonEntry(s,p,card(old.card),at,'below'))return;const id=old.originalCard||old.card,owner=old.owner;leaveUnit(s,old,'resummon');if(paySummoningTax(s,id,owner,p)){const u=makeUnit(s,id,owner,at);u.controller=p;u.layer='below';u.nosferatuTurn=s.turn;summonedGenesis(s,u);}return;}
  if(step.op==='sphinxSwap'){const deck=s.players[p].spells;if(deck.length<2)return;if(selected===undefined){s.choice={player:1-p,title:'Riddle Sphinx · 可交換對手 Spellbook 頂牌與底牌',options:[{label:'交換頂牌與底牌',value:true},{label:'不交換',value:null}],frame:{...frame,step:{...step,may:true}}};return;}if(selected===true)[deck[0],deck[deck.length-1]]=[deck[deck.length-1],deck[0]];return;}
  if(step.op==='revealSummonTop'){const owner=step.opponent?1-p:p,deck=s.players[owner].spells,id=deck[0];if(!id)return;log(s,'揭示 '+card(id).name);if(card(id).type==='Minion'&&card(id).playable){if(step.maySummon)queueEffects(s,[{op:'summonRevealedTop',owner,card:id,optional:true}],source,p);else queueEffects(s,[{op:'summonRevealedTop',owner,card:id}],source,p);}else if(step.bottomOther)deck.push(deck.shift());return;}
  if(step.op==='summonRevealedTop'){const deck=s.players[step.owner].spells;if(deck[0]!==step.card||!canSummonEntry(s,p,card(step.card),source.at,source.layer||'surface'))return;deck.shift();if(paySummoningTax(s,step.card,step.owner,p)){const u=makeUnit(s,step.card,step.owner,source.at);u.controller=p;u.layer=source.layer||'surface';summonedGenesis(s,u);}return;}
  if(step.op==='summonTopFive'){const deck=s.players[p].spells,revealed=deck.splice(0,5),remaining=[],summoned=[];log(s,'揭示 '+revealed.map(id=>card(id).name).join('、'));for(const id of revealed){if(s.board[source.at]&&card(id).slug===step.slug&&card(id).playable&&canSummonEntry(s,p,card(id),source.at,'surface')){if(paySummoningTax(s,id,p,p))summoned.push(makeUnit(s,id,p,source.at));}else remaining.push(id);}for(let i=remaining.length-1;i>0;i--){const j=rollIndex(s,remaining.slice(0,i+1).map(id=>card(id).name));[remaining[i],remaining[j]]=[remaining[j],remaining[i]];}deck.push(...remaining);refreshContinuous(s);for(const u of summoned.reverse())summonedGenesis(s,u);return;}
  if(step.op==='drawOne'){draw(s,p,step.deck);return;}
  if(step.op==='chainsTap'){const pool=s.units.filter(u=>!u.dying&&u.controller===p&&card(u.card).type==='Minion'&&!u.tapped),best=Math.max(...pool.map(u=>power(u))),targets=pool.filter(u=>power(u)===best);if(!targets.length)return;if(selected===undefined){if(targets.length===1){targets[0].tapped=true;return;}s.choice={player:p,title:'Chains of Prometheus · 橫置最強的未橫置僕從',options:targets.map(u=>({label:card(u.card).name,value:u.uid})),frame};return;}const u=targets.find(u=>u.uid===selected);if(u)u.tapped=true;return;}
  if(step.op==='queenCatchup'){if(s.players[step.opponent].hand.length>s.players[p].hand.length)queueEffects(s,[{op:'drawCards',count:1,optional:true}],source,p);return;}
  if(step.op==='treasuresScatter'){const a=s.artifacts.find(a=>a.uid===step.uid);if(a){a.bearer=null;a.at=rollIndex(s,Array.from({length:20},(_,i)=>String.fromCharCode(65+i%5)+(4-Math.floor(i/5))));a.layer='surface';}return;}
  if(step.op==='succubusLure'||step.op==='nixieLure'){const u=unit(s,selected.uid);if(u&&!blocked(s,p,u)){const steps=[];if(!sameLocation(s,u,source))steps.push({op:'unitStep',uid:u.uid,toward:{at:source.at,layer:source.layer||'surface'}});steps.push({op:step.op==='succubusLure'?'succubusArrive':'tapSummoned',uid:u.uid});queueEffects(s,steps,source,p);}return;}
  if(step.op==='succubusArrive'){const u=unit(s,step.uid),caster=unit(s,source.uid);if(u&&caster&&!u.dying&&sameLocation(s,u,caster)){hurt(s,u,2,false,'ability',caster);heal(s,p,2);}return;}
  if(step.op==='toadDrag'){const u=unit(s,selected.uid);if(u&&!blocked(s,p,u))queueEffects(s,[{op:'dragStep',uid:u.uid,from:{at:u.at,layer:u.layer||'surface'},to:{at:source.at,layer:source.layer||'surface'}},{op:'dragStrike',target:u.uid,optional:true}],source,p);return;}
  if(step.op==='dragStrike'){const u=unit(s,source.uid),target=unit(s,step.target);if(u&&target&&!u.dying&&!target.dying&&sameLocation(s,u,target))strike(s,u,target);return;}
  if(step.op==='anglerLure'){const caster=unit(s,source.uid);if(caster?.layer==='below'&&waterSite(s,caster.at,card))for(const u of [...s.units].reverse())if(!u.dying&&u.controller!==p&&card(u.card).type==='Minion'&&(u.layer||'surface')==='surface'&&occupied(u).some(at=>s.board[at]&&distance(at,caster.at)===1))queueEffects(s,[{op:'unitStep',uid:u.uid,toward:{at:caster.at,layer:'below'}}],caster,p);return;}
  if(step.op==='halveMaxLife'){for(let player=0;player<s.players.length;player++){const pl=s.players[player];pl.maxLife=Math.floor(pl.maxLife/2);if(pl.life>pl.maxLife)loseLife(s,player,pl.life-pl.maxLife);}return;}
  if(step.op==='devilPact'){
    const caster=unit(s,source.uid),object=(s.artifacts||[]).find(a=>a.uid===source.uid),site=String(source.uid).startsWith('site:')&&s.board[source.at];
    const canSacrifice=caster&&!caster.dying&&card(caster.card).type==='Minion'||object||site;
    if(selected===undefined){s.choice={player:p,title:'Pact with the Devil',options:[{label:'失去一半生命（向上取整），抽三張法術',value:'life'},...(canSacrifice?[{label:'犧牲施法者，抽三張法術',value:'sacrifice'}]:[])],frame};return;}
    if(selected==='life')loseLife(s,p,Math.ceil(s.players[p].life/2));else if(!canSacrifice)return;
    queueEffects(s,[{op:'drawCards',count:3},...(selected==='sacrifice'?[{op:'pactSacrifice'}]:[])],source,p,frame.effectCard);return;
  }
  if(step.op==='pactSacrifice'){const caster=unit(s,source.uid),object=(s.artifacts||[]).find(a=>a.uid===source.uid);if(caster)kill(s,caster,false,true,true);else if(object)removeObject(s,object,'cemetery');else if(String(source.uid).startsWith('site:')&&s.board[source.at]?.card===source.card)destroySite(s,source.at,true);return;}
  if(step.op==='powerwishSacrifice'){const victims=s.units.filter(u=>!u.dying&&card(u.card).type==='Minion');for(let player=0;player<s.players.length;player++){const av=avatar(s,player),count=victims.filter(u=>u.controller===player).length;if(av&&count)av.mods.push({power:count});}for(const u of victims)kill(s,u,false,true,true);return;}
  if(step.op==='chorusDiscard'){const player=step.player;if(selected===undefined){const options=selectEffects(s,{...frame,controller:player},{kind:'hand'});if(options.length)s.choice={player,title:'Chorus of Condemnation · 棄一張牌',options,frame};return;}const pl=s.players[player],h=pl.hand.find(h=>h.uid===selected.uid);if(h){pl.hand=pl.hand.filter(h=>h.uid!==selected.uid);sendCard(s,player,h.card,'cemetery');}return;}
  if(step.op==='harpoonPull'){const u=unit(s,selected.uid);if(u&&!blocked(s,p,u)){hurt(s,u,1,false,damageKind,source);queueEffects(s,[{op:'harpoonMove',uid:u.uid,pullFrom:selected.pullFrom}],source,p,frame.effectCard);}return;}
  if(step.op==='harpoonMove'){const u=unit(s,step.uid);if(!u||u.dying)return;const dx=source.at%5-step.pullFrom%5,dy=Math.floor(source.at/5)-Math.floor(step.pullFrom/5),x=u.at%5+dx,y=Math.floor(u.at/5)+dy;if(x<0||y<0||x>4-(u.size===2?1:0)||y>3-(u.size===2?1:0))return;const at=y*5+x;if(occupied(u).every((cell,i)=>canEnterOnGround(s,u,{at:cell,layer:u.layer||'surface'},{at:occupied({...u,at})[i],layer:source.layer||'surface'},card,keywords))){u.at=at;u.layer=source.layer||'surface';u.burrowedSafely=false;}return;}
  if(step.op==='castLifeLoss'){loseLife(s,step.player,step.amount);return;}
  if(step.op==='leapAlly'){const u=unit(s,selected.uid);if(u&&!u.dying)queueEffects(s,[{op:'unitStep',self:true,may:true},{op:'strikeEnemiesHere'}],u,p,frame.effectCard);return;}
  if(step.op==='lureAlly'){const u=unit(s,selected.uid);if(u&&!u.dying)queueEffects(s,[{op:'lureStep',untargeted:true,select:{kind:'unit',minion:true,enemy:true,nearby:true,onSite:true,anyRegion:true,untargeted:true}}],u,p,frame.effectCard);return;}
  if(step.op==='thunderTeleport'){const u=unit(s,source.uid);if(u&&!u.dying){u.carryTeleport=true;u.at=selected.at;u.layer=selected.layer;u.burrowedSafely=false;queueEffects(s,[{op:'tapOtherHere'}],u,p);}return;}
  if(step.op==='tapOtherHere'){const u=unit(s,source.uid);if(u&&!u.dying)for(const v of s.units)if(v.uid!==u.uid&&!v.dying&&sameLocation(s,v,u))v.tapped=true;return;}
  if(step.op==='poolFrogs'){if(resources(s,p).water>=3)for(let i=0;i<3;i++)if(canSummonEntry(s,p,card('frog'),source.at,'below')&&paySummoningTax(s,card('frog').id,p,p)){const u=makeUnit(s,card('frog').id,p,source.at);u.layer='below';summonedGenesis(s,u);}return;}
  if(step.op==='banishNearbySpiritsAuras'){let count=0;for(const u of [...s.units])if(card(u.card).type==='Minion'&&unitTypes(u).includes('Spirit')&&occupied(u).some(at=>nearby(at,source.at))&&region(s,u)===region(s,source)){kill(s,u,true);count++;}for(const a of [...s.auras||[]])if(Array.from({length:20},(_,i)=>i).some(at=>inside(a,at)&&nearby(at,source.at))){removeObject(s,a,'banished');count++;}for(let i=0;i<count;i++)draw(s,p,'spells');return;}
  if(step.op==='voidEntryKill'){for(const u of [...s.units])if(!u.dying&&u.controller!==p&&occupied(u).includes(step.at)&&(u.layer||'surface')===step.layer)kill(s,u);return;}
  if(step.op==='tapSummoned'){const u=unit(s,step.uid);if(u&&!u.dying)u.tapped=true;return;}
  if(step.op==='chosenStep'){const u=unit(s,selected.uid);if(u&&!u.dying)queueEffects(s,[{op:'unitStep',uid:u.uid}],source,p,frame.effectCard);return;}
  if(step.op==='manuscriptDraw'){const u=unit(s,source.uid);if(u&&!u.dying){const top=s.players[p].spells[0];if(top){log(s,'揭示 '+card(top).name);const drawn=draw(s,p,'spells');if(drawn)hurt(s,u,card(drawn).cost||0,false,'ability',u);}}return;}
  if(step.op==='adjacentFootSoldiers'){for(let at=0;at<20;at++)if(distance(at,source.at)===1&&region(s,{at,layer:source.layer||'surface'})===region(s,source)&&canSummonEntry(s,p,card('foot_soldier'),at,source.layer||'surface')&&paySummoningTax(s,card('foot_soldier').id,p,p)){const u=makeUnit(s,card('foot_soldier').id,p,at);u.layer=source.layer||'surface';summonedGenesis(s,u);}return;}
  if(step.op==='defilerEnd'){for(const [at,site] of s.board.entries())if(site?.controller===step.player&&s.units.some(u=>!u.dying&&occupied(u).includes(at)&&unitUmbrellas(u).includes('Evil')))loseLife(s,step.player,1);return;}
  if(step.op==='exorcistBanish'){if(selected.entity==='unit'){const u=unit(s,selected.uid);if(u&&!blocked(s,p,u))kill(s,u,true);}else {const a=s.auras.find(a=>a.uid===selected.uid);if(a)removeObject(s,a,'banished');}return;}
  if(step.op==='strikeEnemiesHere'){const u=unit(s,source.uid);if(u&&!u.dying&&!disabled(u))strikeMany(s,u,s.units.filter(v=>!v.dying&&v.controller!==u.controller&&sameLocation(s,v,u)).map(v=>({uid:v.uid,amount:strikeTotal(s,u)})));return;}
  if(step.op==='stealWard'){const from=selected.entity==='site'?s.board[selected.at]:unit(s,selected.uid),u=unit(s,source.uid);if(from?.ward&&u&&!u.dying){from.ward=false;if(!unitUmbrellas(u).includes('Evil'))u.ward=true;}return;}
  if(step.op==='squirrelBury'){const a=s.artifacts.find(a=>a.uid===selected.uid),u=unit(s,source.uid);if(a&&u&&s.board[u.at]){if(a.controller!==p&&a.ward){a.ward=false;return;}a.bearer=null;a.at=u.at;a.layer='below';}return;}
  if(step.op==='poolArtifact'){const h=s.players[p].hand.find(h=>h.uid===selected.uid);if(h){s.players[p].hand=s.players[p].hand.filter(v=>v.uid!==h.uid);const o={uid:'o'+s.next++,card:h.card,owner:p,controller:p,at:source.at,bearer:null,layer:'below'};s.artifacts.push(o);queueEffects(s,definitions[card(h.card).slug]?.genesis||[],o,p);}return;}
  if(step.op==='sitePassage'){const u=unit(s,step.uid);if(u&&!u.dying){if(step.damage)hurt(s,u,step.damage,false,'ability',source);if(step.destroy)kill(s,u);}return;}
  if(step.op==='playedSiteReaction'){if(step.loss)loseLife(s,step.player,step.loss);if(step.skeleton&&canSummonEntry(s,p,card('skeleton'),step.at,'surface')&&paySummoningTax(s,card('skeleton').id,p,p))makeUnit(s,card('skeleton').id,p,step.at);return;}
  if(step.op==='thornEnd'){const bearer=unit(s,(s.artifacts||[]).find(a=>a.uid===source.uid)?.bearer);if(bearer)loseLife(s,bearer.controller,2);return;}
  if(step.op==='boundDraw'){const caster=spellcaster(s,step.self?source.uid:selected?.uid);if(caster&&!caster.dying)draw(s,caster.controller,'spells',caster.uid);return;}
  if(step.op==='commitSpell'){
    const a=step.action;
    assert(legalActions(s,p).some(v=>v.hand===a.hand&&v.grave===a.grave&&v.bound===a.bound&&v.payment===a.payment&&v.casterLayer===a.casterLayer&&Object.entries(v).every(([k,val])=>k==='path'||eq(a[k],val))),'施法宣告已失效');
    commitSpell(s,a,selected);return;
  }
  if(step.op==='commitLegacy'){commitSpell(s,step.action,step.declared);return;}
  if(step.op==='chainDeclare'){
    if(selected===null)return;
    const targets=step.targets,last=unit(s,targets[targets.length-1].uid),caster=spellcaster(s,source.uid,source.layer),costFor=n=>castingCost(s,p,card(frame.effectCard),undefined,source,step.action.payment,2*Math.max(0,n-1));
    if(selected==='commit'){commitSpell(s,{...step.action,chainTargets:targets});return;}
    if(selected==='cancel')return;
    if(selected&&selected.uid){queueEffects(s,[{...step,targets:[...targets,selected]}],source,p,frame.effectCard);return;}
    const options=castBudget(s,p)>=costFor(targets.length+1)&&last?selectEffects(s,{...frame,source:caster},{kind:'unit'}).filter(o=>!targets.some(t=>t.uid===o.value.uid)&&nearby(unit(s,o.value.uid).at,last.at)):[];
    s.choice={player:p,title:'Chain Lightning · 宣告連鎖目標（總費用 '+costFor(targets.length)+'）',options:[...options,{label:'確認全部目標並支付費用',value:'commit'},{label:'取消施放（不支付費用）',value:null}],frame:{...frame,step:{...step,may:true}}};return;
  }
  if(step.op==='chainResolve'){
    for(const t of step.targets||[]){const u=unit(s,t.uid);if(u&&!u.dying&&!blocked(s,p,u))hurt(s,u,2,false,'magic',source);}return;
  }
  if(step.op==='maelstromPlan'){
    const entries=step.entries||s.units.filter(u=>!u.dying&&!u.swallowedBy&&card(u.card).type==='Minion'&&occupied(u).some(at=>bodyOfWater(s,source.at,card).has(at))).map(u=>({uid:u.uid,at:u.at,layer:u.layer||'surface'})),moves=step.moves||[];
    if(selected&&selected.uid)moves.push(selected);
    const todo=entries.filter(e=>!moves.some(m=>m.uid===e.uid)),entry=todo[0];
    if(entry){const u=unit(s,entry.uid),options=pullDestinations(s,u,source.at);
      if(!options.length){queueEffects(s,[{...step,optional:false,entries,moves:[...moves,{uid:u.uid,at:u.at,layer:u.layer||'surface'}]}],source,p);return;}
      s.choice={player:p,title:'Maelström · 選擇 '+card(u.card).name+' 的拉入位置',options:options.map(at=>({label:String.fromCharCode(65+at%5)+(4-Math.floor(at/5)),value:{uid:u.uid,at,layer:u.layer||'surface'}})),frame:{...frame,step:{...step,optional:false,entries,moves}}};return;}
    for(const m of moves){const u=unit(s,m.uid);if(u){u.notRest=true;u.at=m.at;u.layer=m.layer;u.burrowedSafely=false;}}return;
  }
  if(step.op==='treasureCast'){
    const object=(s.artifacts||[]).find(a=>a.uid===step.uid);if(!object)return;
    if(selected===undefined){const land=passives[card(object.card).slug]?.treasureLand;const options=s.board.flatMap((site,at)=>site?.controller===p&&(land?!waterSite(s,at,card):waterSite(s,at,card))?[{label:card(site.card).name+' · '+String.fromCharCode(65+at%5)+(4-Math.floor(at/5)),value:at}]:[]);if(!options.length)return;s.choice={player:1-p,title:card(object.card).name+' · 對手選擇'+(land?'地下':'水下')+'位置',options,frame};return;}
    object.at=selected;object.layer='below';object.bearer=null;return;
  }
  if(step.op==='treasureSurface'){
    const object=(s.artifacts||[]).find(a=>a.uid===step.uid),bearer=object&&unit(s,object.bearer);if(!object||!bearer||(bearer.layer||'surface')!=='surface')return;
    removeObject(s,object,'cemetery');queueEffects(s,[{op:'drawCards',count:2}],bearer,bearer.controller,object.card);return;
  }
  if(step.op==='commitArtifact'){
    const a=step.action;assert(legalActions(s,p).some(v=>v.type==='activateArtifact'&&v.object===a.object&&v.index===a.index),'物品能力宣告已失效');commitArtifact(s,a,selected);return;
  }
  if(step.op==='craterDiscard'){
    if(selected===null)return;
    if(selected===undefined){s.choice={player:p,title:'Craterize · 宣告額外棄一張地點的費用',options:[...s.players[p].hand.filter(h=>card(h.card).type==='Site').map(h=>({label:card(h.card).name,value:{uid:h.uid,card:h.card}})),{label:'取消（不支付費用）',value:null}],frame:{...frame,step:{...step,may:true}}};return;}
    const h=s.players[p].hand.find(h=>h.uid===selected.uid&&h.card===selected.card);assert(h&&card(h.card).type==='Site','額外地點費用已失效');s.players[p].hand=s.players[p].hand.filter(v=>v.uid!==h.uid);sendCard(s,p,h.card,'cemetery');commitSpell(s,{...step.action,discardedSite:true},step.target);return;
  }
  if(step.op==='gridBlast'){
    const origin=selected?.at??source.at,center=position(origin),sourceRegion=region(s,source),hits=[];
    for(const u of s.units)if(!u.dying){let total=0;for(const at of occupied(u)){const pos=position(at),dx=pos.x-center.x,dy=pos.y-center.y;
      if(step.pattern==='crater'){if(s.board[at]&&Math.abs(dx)<=2&&Math.abs(dy)<=2)total+=[[1,2,4,2,1],[2,4,7,4,2],[4,7,10,7,4],[2,4,7,4,2],[1,2,4,2,1]][dy+2][dx+2];}
      else if(region(s,{at,layer:u.layer})===(step.pattern==='cone'?sourceRegion:region(s,selected))){if(step.pattern==='major'&&Math.abs(dx)<=1&&Math.abs(dy)<=1)total+=dx===0&&dy===0?7:dx===0||dy===0?5:3;
        if(step.pattern==='cone'){const forward=[-dy,dx,dy,-dx][step.direction],side=Math.abs(step.direction%2?dy:dx);if(forward>=1&&forward<=3&&side<forward)total+=[0,5,3,1][forward];}}
    }if(total)hits.push({uid:u.uid,amount:total});}
    if(step.pattern==='crater'&&!blocked(s,p,s.board[origin]))destroySite(s,origin);
    for(const hit of hits)hurt(s,unit(s,hit.uid),hit.amount,false,'magic',source);return;
  }
  if(step.op==='movementShot'){
    const u=unit(s,source.uid);if(!u||u.dying||u.shotDuringMove||u.silenced||disabled(u)||!passives[card(u.card).slug]?.movementShot)return;
    if(selected===undefined){s.choice={player:p,title:'Skirmishers of Mu · 此位置射擊或繼續移動',options:[...['北','東','南','西'].map((label,i)=>({label,value:i+1})),{label:'此處不射擊',value:0}],frame};return;}
    if(selected){u.shotDuringMove=true;u.stealth=false;queueEffects(s,[{op:'shot',at:u.at,layer:u.layer||'surface',origin:true,direction:selected-1,amount:power(u),remaining:Math.max(1,u.grantedRange||0)+(u.rangeBonus||0),ranged:true}],u,p);}return;
  }
  if(step.op==='awakenLeviathan'){
    const site=s.board[source.at];if(!site||site.card!==card('island_leviathan').id)return;
    const u=makeUnit(s,'runtime:island_leviathan',site.owner,source.at);u.controller=p;u.originalCard=site.card;u.born=site.born??0;
    s.board[source.at]={uid:'s'+s.next++,card:card('rubble').id,owner:null,controller:null,flooded:true};return;
  }
  if(step.op==='hookHit'){
    const target=unit(s,selected?.uid);if(!target||target.swallowedBy)return;
    const route=[...(step.trail||[])].reverse(),moves=[];let from={at:target.at,layer:target.layer||'surface'},hitAt=step.hitAt??target.at;
    for(const cell of route){const at=from.at+cell-hitAt;moves.push({op:'dragStep',uid:target.uid,from,to:{at,layer:from.layer}});from={at,layer:from.layer};hitAt=cell;}
    queueEffects(s,[...moves,{op:'hookFight',target:target.uid,optional:true}],source,p);return;
  }
  if(step.op==='dragStep'){
    const u=unit(s,step.uid);if(!u||u.dying||u.swallowedBy||u.at!==step.from.at||(u.layer||'surface')!==step.from.layer||step.to.at<0||step.to.at>=20||u.size===2&&(step.to.at%5>3||step.to.at>=15)||!occupied({...u,at:step.to.at}).every((at,i)=>(step.ignoreRegions||region(s,{at,layer:step.to.layer})===region(s,{at:occupied(u)[i],layer:u.layer}))&&(occupied(u).includes(at)&&step.to.layer===(u.layer||'surface')||canEnterOnGround(s,u,{at:occupied(u)[i],layer:u.layer},{at,layer:step.to.layer},card,keywords))))return;
    u.notRest=true;u.at=step.to.at;u.layer=step.to.layer;return;
  }
  if(step.op==='hookFight'){const u=unit(s,source.uid),target=unit(s,step.target);if(u&&target&&!u.dying&&!target.dying&&sameLocation(s,u,target))fight(s,{attacker:u.uid,defenders:[target.uid],kind:'spell'});return;}
  if(step.op==='boulderDeclare'){
    if(selected===null)return;const u=unit(s,step.actor),object=(s.artifacts||[]).find(a=>a.uid===step.object);if(!u||!object)return;
    u.tapped=true;u.notRest=true;u.stealth=false;object.bearer=null;queueEffects(s,[{op:'boulderRoll',uid:object.uid,at:object.at,layer:object.layer||'surface',direction:selected-1,exclude:u.uid,visited:[]}],object,p);return;
  }
  if(step.op==='boulderRoll'){
    const object=(s.artifacts||[]).find(a=>a.uid===step.uid);if(!object||object.at!==step.at)return;
    const visited=[...step.visited,step.at],pos=position(step.at),x=pos.x+[0,1,0,-1][step.direction],y=pos.y+[-1,0,1,0][step.direction],next=y*5+x;
    const hitIds=step.hitIds||[];for(const u of s.units)if(!u.dying&&u.uid!==step.exclude&&!hitIds.includes(u.uid)&&occupied(u).includes(step.at)&&(u.layer||'surface')===step.layer){hitIds.push(u.uid);hurt(s,u,4,false,'ability',source);}
    if(x>=0&&x<5&&y>=0&&y<4&&!visited.includes(next)&&region(s,object)===region(s,{at:next,layer:step.layer})){object.at=next;queueEffects(s,[{...step,at:next,visited,hitIds}],source,p);}return;
  }
  if(step.op==='curseEnter'){
    const u=unit(s,step.uid),a=(s.auras||[]).find(a=>a.uid===step.aura);if(!u||u.dying||!a||u.at!==step.at)return;u.notRest=true;u.layer='below';u.burrowedSafely=false;removeObject(s,a,'hand');return;
  }
  if(step.op==='travelStep'){
    const u=unit(s,source.uid);if(!u||u.dying||u.controller!==p||u.at!==step.from.at||(u.layer||'surface')!==step.from.layer)return;
    const dest=locations(s,u,card,keywords,true).find(v=>v.at===step.to.at&&v.layer===step.to.layer);if(!dest||disabled(u))return;
    if(u.mods.some(m=>m.blaze)){u.fireTrail=u.fireTrail||[];for(const at of occupied(u))if((dest.layer!==(u.layer||'surface')||!occupied({...u,at:dest.at}).includes(at))&&!u.fireTrail.some(v=>v.at===at&&v.layer===(u.layer||'surface')))u.fireTrail.push({at,layer:u.layer||'surface'});}
    u.notRest=true;u.at=dest.at;u.layer=dest.layer;u.gateVoidwalk=dest.gateVoidwalk;return;
  }
  if(step.op==='travelStop'){
    const u=unit(s,source.uid);if(u)u.inBasicTravel=false;if(u?.fireTrail?.length){queueEffects(s,[{op:'blazeTrail',trail:u.fireTrail}],u,p,card('blaze').id);u.fireTrail=[];}return;
  }
  if(step.op==='blazeTrail'){startEvent(s,source,card('blaze').id);for(const u of s.units)if(!u.dying&&step.trail.some(v=>occupied(u).includes(v.at)&&(u.layer||'surface')===v.layer))hurt(s,u,2,false,'magic',source);return;}
  if(step.op==='travelFinish'){
    const a=step.action,u=unit(s,source.uid);if(!u||u.dying||u.controller!==p||u.at!==a.at||(u.layer||'surface')!==(a.layer||'surface'))return;
    const victim=unit(s,a.target);if(a.type==='attack'&&(victim?protectedAttackUnit(s,victim):a.target?.startsWith('site:')&&protectedAttackSite(s,Number(a.target.slice(5)))))return;
    if(a.type==='attack'&&victim&&victim.controller!==p&&!victim.silenced&&!disabled(victim)&&passives[card(victim.card).slug]?.attackManaGift){const amount=Math.max(0,resources(s,p).available);s.players[p].spent+=amount;(s.pendingMana||(s.pendingMana=[])).push({player:victim.controller,amount});}
    const pending={kind:a.type==='attack'?'attack':'intercept',player:1-p,attacker:u.uid,target:a.target||null,combatAt:a.combatAt,stealth:u.stealth,noDefend:!u.silenced&&!disabled(u)&&!!passives[card(u.card).slug]?.noDefend,defenders:[],order:a.order};
    const thicket=s.board[a.thicketAt];if(a.type==='attack'&&thicket&&sitePassives[card(thicket.card).slug]?.firstDepartureUndefended&&thicket.departureAttackTurn!==s.turn){pending.noDefend=true;thicket.departureAttackTurn=s.turn;}
    if(a.type==='attack'&&unit(s,a.target))pending.defenders=[a.target];
    if(a.type==='attack'){const first=u.attackedTurn!==s.turn;u.interactedTurn=s.turn;u.attackedTurn=s.turn;pending.attackSource=clone(u);pending.afterAttack=captureAfterAttack(s,u,victim||(a.target?.startsWith('site:')?{...s.board[Number(a.target.slice(5))],entity:'site',at:Number(a.target.slice(5))}:null),fiftyAPI);if(first&&!u.silenced&&!disabled(u)&&passives[card(u.card).slug]?.bladeAfterAttack)pending.afterAttack.push({op:'reactionBladeStep',uid:u.uid});}
    const judas=(s.ongoingEffects||[]).filter(e=>e.op==='judas'&&e.uid===a.target&&e.end===s.turn&&a.type==='attack');if(judas.length)pending.noDefend=true;
    if(a.type==='attack'){queueAttackReactions(s,u,pending,judas,fiftyAPI);return;}
    openCombatWindow(s,pending,judas,source);return;
  }
  if(step.op==='reactionOpenAttack'){openCombatWindow(s,step.pending,step.judas||[],source);return;}
  if(step.op==='defendFinish'){
    const u=unit(s,source.uid),pending=s.pending,attacker=pending&&unit(s,pending.attacker);if(!u||u.dying||!attacker||!sameLocation(s,u,attacker))return;
    if(!step.action.keep)pending.defenders=pending.defenders.filter(id=>id!==pending.target);pending.defenders.push(u.uid);return;
  }
  if(['siegeCrew','siegePayload','siegeCommit'].includes(step.op)){
    const object=(s.artifacts||[]).find(a=>a.uid===step.action.object),ability=object&&definitions[card(object.card).slug]?.activated[step.action.index],bearer=object&&unit(s,object.bearer);
    assert(object&&ability?.crew&&bearer&&artifactController(s,object)===p&&ready(s,bearer),'攻城器具或持有者已失效');
    if(selected===null)return;
    if(step.op==='siegeCrew'){
      const helpers=siegeCrew(s,object,p);
      if(selected===undefined){s.choice={player:p,title:card(object.card).name+' · 選擇另一名協助友軍',options:[...helpers.map(u=>({label:card(u.card).name,value:u.uid})),{label:'取消啟動（不支付費用）',value:null}],frame:{...frame,step:{...step,may:true}}};return;}
      assert(helpers.some(u=>u.uid===selected),'協助友軍已失效');
      queueEffects(s,[{...step,op:ability.discardPayload?'siegePayload':'siegeCommit',crew:selected}],object,p);return;
    }
    if(step.op==='siegePayload'){
      if(selected===undefined){s.choice={player:p,title:card(object.card).name+' · 選擇棄牌作為彈藥',options:[...s.players[p].hand.map(h=>({label:card(h.card).name+' · 法力費用 '+(card(h.card).cost||0),value:{uid:h.uid,card:h.card}})),{label:'取消啟動（不支付費用）',value:null}],frame:{...frame,step:{...step,may:true}}};return;}
      queueEffects(s,[{...step,op:'siegeCommit',payload:selected}],object,p);return;
    }
    const helper=siegeCrew(s,object,p).find(u=>u.uid===step.crew);assert(helper,'協助友軍無法支付橫置費用');
    assert(selectEffects(s,{source:object,controller:p},ability.steps[0].select).some(o=>eq(o.value,step.target)),'攻城目標已失效');
    let amount=ability.steps[0].amount;
    if(ability.discardPayload){const h=s.players[p].hand.find(h=>h.uid===step.payload?.uid&&h.card===step.payload.card);assert(h,'彈藥手牌已失效');amount=card(h.card).cost||0;s.players[p].hand=s.players[p].hand.filter(v=>v.uid!==h.uid);sendCard(s,p,h.card,'cemetery');}
    // These units pay for an artifact's ability; they do not activate their own
    // ability, strike, or deal the artifact's damage, so tapping preserves Stealth.
    bearer.tapped=true;helper.tapped=true;
    queueEffects(s,[{...ability.steps[0],amount}],object,p);s.storyline[s.storyline.length-1].selected=step.target;return;
  }
  if(step.op==='commitAbility'){
    const a=step.action;assert(legalActions(s,p).some(v=>v.type==='activate'&&v.unit===a.unit&&v.index===a.index),'能力宣告已失效');commitAbility(s,a,selected);return;
  }
  if(step.op==='commitSite'){
    const a=step.action;assert(legalActions(s,p).some(v=>v.type==='activateSite'&&v.at===a.at&&v.index===a.index),'地點能力宣告已失效');commitSite(s,a,selected);return;
  }
  if(step.op==='flySite'){
    const site=s.board[source.at];if(!site||s.board[selected.at]||passives[card(site.card).slug]?.immutableSite)return;
    s.board[source.at]=null;s.board[selected.at]=site;
    for(const u of s.units)if(u.at===source.at&&u.size!==2){u.at=selected.at;u.observedPosition={at:u.at,layer:u.layer||'surface'};}
    for(const a of s.artifacts||[])if(a.at===source.at)a.at=selected.at;
    return;
  }
  if(step.op==='repeatDesertGenesis'){
    const remaining=step.remaining||s.board.flatMap((site,at)=>site?.controller===p&&nearby(source.at,at)&&card(site.card).subtypes.includes('Desert')?[{at,card:site.card}]:[]);
    if(selected===undefined){const available=remaining.filter(v=>s.board[v.at]?.card===v.card);if(!available.length)return;s.choice={player:p,title:'選擇下一個重新觸發 Genesis 的 Desert',options:available.map(v=>({label:card(v.card).name+' · '+String.fromCharCode(65+v.at%5)+(4-Math.floor(v.at/5)),value:v})),frame:{...frame,step:{...step,remaining}}};return;}
    queueEffects(s,[{...step,remaining:remaining.filter(v=>v.at!==selected.at)}],source,p,frame.effectCard);
    const site=s.board[selected.at];if(site?.card===selected.card)queueEffects(s,definitions[card(site.card).slug]?.genesis||[],{...site,at:selected.at,uid:site.uid||'site:'+selected.at,layer:'surface'},p,site.card);return;
  }
  if(step.op==='forcedWaterStep'){
    const u=unit(s,step.uid);if(!u||u.dying||disabled(u))return;const body=bodyOfWater(s,step.root,card);if(!occupied(u).some(at=>body.has(at)))return;const options=locations(s,u,card,keywords,true).filter(v=>v.path.length===1&&occupied({...u,at:v.at}).every(at=>body.has(at)));
    if(selected===undefined){if(!options.length)return;s.choice={player:p,title:'在同一片水域自行走一步',options:options.map(v=>({label:String.fromCharCode(65+v.at%5)+(4-Math.floor(v.at/5))+(v.layer!==(u.layer||'surface')?' · 上浮／潛水':''),value:v.layer===(u.layer||'surface')?v.at:{at:v.at,layer:v.layer}})),frame};return;}
    const destination=options.find(v=>typeof selected==='number'?v.at===selected&&v.layer===(u.layer||'surface'):v.at===selected.at&&v.layer===selected.layer);assert(destination,'步行位置已失效');u.notRest=true;u.at=destination.at;u.layer=destination.layer;u.burrowedSafely=false;return;
  }
  if(step.op==='unitStep'){
    const u=unit(s,step.self?source.uid:step.uid);if(!u||u.dying||disabled(u))return;
    const stepDistance=(a,b)=>distance(a.at,b.at)+((a.layer||'surface')!==(b.layer||'surface')?1:0);
    const candidates=locations(s,u,card,keywords,true).filter(v=>v.path.length===1&&(!step.toward||stepDistance(v,step.toward)<stepDistance(u,step.toward))&&(!step.away||stepDistance(v,step.away)>stepDistance(u,step.away)));
    if(selected===undefined){if(!candidates.length)return;s.choice={player:p,title:card(frame.effectCard).name+' · 選擇走一步的位置',options:[...candidates.map(v=>({label:String.fromCharCode(65+v.at%5)+(4-Math.floor(v.at/5))+' · '+(v.layer==='below'?'地下／水下':'表面'),value:{at:v.at,layer:v.layer}})),...(step.may?[{label:'留在原處',value:null}]:[])],frame};return;}
    if(selected===null){assert(step.may,'必須走一步');return;}
    const destination=candidates.find(v=>v.at===selected.at&&v.layer===selected.layer);assert(destination,'步行位置已失效');u.gateVoidwalk=destination.gateVoidwalk;u.at=selected.at;u.layer=selected.layer;u.burrowedSafely=false;return;
  }
  if(step.op==='krakenSurface'){
    const u=unit(s,source.uid);if(!u||u.dying)return;
    u.layer='surface';u.burrowedSafely=false;queueEffects(s,[{op:'krakenStrike'}],u,p,frame.effectCard);return;
  }
  if(step.op==='krakenStrike'){
    const u=unit(s,source.uid);if(!u||u.dying||disabled(u))return;
    const victims=s.units.filter(v=>!v.dying&&v.uid!==u.uid&&nearby(v.at,u.at)&&region(s,v)===region(s,u));
    strikeMany(s,u,victims.map(v=>({uid:v.uid,amount:strikeTotal(s,u)})));return;
  }
  if(step.op==='searchSummon'){
    if(selected===undefined){s.choice={player:p,title:card(frame.effectCard).name+' · 選擇檢索區域',options:[...step.zones.map(zone=>({label:{hand:'檢索手牌',cemetery:'檢索墓地',spells:'檢索 Spellbook（之後洗牌）'}[zone],value:zone})),...(step.maySearch?[{label:'不檢索',value:null}]:[])],frame};return;}
    if(selected===null)return;
    const zone=selected,options=searchSummonEntries(s,p,zone,step);
    s.choice={player:p,title:card(frame.effectCard).name+' · '+(zone==='cemetery'?'墓地檢索':'私人區域檢索'),options:[...options,...(zone!=='cemetery'||!options.length?[{label:zone==='cemetery'?'沒有符合的牌':'不取牌',value:null}]:[])],frame:{...frame,step:{...step,op:'searchSummonPick',zone}}};return;
  }
  if(step.op==='searchSummonPick'){
    if(selected===null){if(step.zone==='spells')shuffle(s,s.players[p].spells);const zones=step.zones.filter(zone=>zone!==step.zone);if(step.searchAll&&zones.length)queueEffects(s,[{...step,op:'searchSummon',zones}],source,p,frame.effectCard);return;}
    queueEffects(s,[{op:'searchSummonPlace',picked:selected,zone:step.zone,...(step.nearby?{select:{kind:'location',nearby:true,sameRegion:true}}:{at:source.at,layer:source.layer||'surface'})}],source,p,frame.effectCard);return;
  }
  if(step.op==='searchSummonPlace'){
    const picked=step.picked,pl=s.players[p];if(!canSummonEntry(s,p,card(picked.card),selected?.at??step.at,selected?.layer||step.layer||'surface'))return;
    if(step.zone==='hand'){assert(pl.hand.some(h=>h.uid===picked.uid&&h.card===picked.card),'手牌檢索已失效');pl.hand=pl.hand.filter(h=>h.uid!==picked.uid);}
    else {assert(pl[step.zone][picked.index]===picked.card,'檢索已失效');if(step.zone==='cemetery')takeGrave(s,p,picked.index,picked.card,picked.uid);else pl[step.zone].splice(picked.index,1);if(step.zone==='spells')shuffle(s,pl.spells);}
    if(!paySummoningTax(s,picked.card,p,p))return;
    const u=makeUnit(s,picked.card,p,selected?.at??step.at);u.layer=selected?.layer||step.layer||'surface';summonedGenesis(s,u);return;
  }
  if(step.op==='boneyard'||step.op==='boneyardPick'){
    const picks=step.op==='boneyard'?[]:[...step.picks,...(selected?[{...selected,controller:p}]:[])],remaining=step.op==='boneyard'?[s.active,1-s.active]:step.remaining;
    if(!remaining.length){queueEffects(s,[{op:'boneyardResolve',picks}],source,p,frame.effectCard);return;}
    const next=remaining[0],options=selectEffects(s,{...frame,controller:next},{kind:'grave',own:true,minion:true}).flatMap(option=>['surface','below'].map(layer=>({label:option.label+' · '+(layer==='below'?'地下／水下':'表面'),value:{...option.value,layer}})));
    s.choice={player:next,title:'Boneyard · '+s.players[next].name+' 選擇自己的墓地僕從',options:[...options,{label:'不召喚',value:null}],frame:{...frame,controller:next,step:{op:'boneyardPick',picks,remaining:remaining.slice(1)}}};return;
  }
  if(step.op==='boneyardResolve'){
    const summoned=[],paid=[];
    for(const grave of step.picks){if(!canSummonEntry(s,grave.controller,card(grave.card),source.at,grave.layer))continue;const pl=s.players[grave.player];assert(pl.cemetery[grave.index]===grave.card,'墓地選擇已失效');takeGrave(s,grave.player,grave.index,grave.card,grave.uid);if(paySummoningTax(s,grave.card,grave.player,grave.controller))paid.push(grave);}
    for(const grave of paid){const u=makeUnit(s,grave.card,grave.player,source.at);u.layer=grave.layer;summoned.push(u);}
    // Both enter before either Genesis resolves. Trigger ordering remains the
    // engine's fixed order until general simultaneous-trigger ordering lands.
    for(const u of summoned.reverse())summonedGenesis(s,u);return;
  }
  const targets=step.all?selectEffects(s,frame,{...step.all,untargeted:true}).map(v=>v.value):selected?.entity?[selected]:[];
  const entities=targets.map(v=>v.entity==='unit'?unit(s,v.uid):v.entity==='site'?s.board[v.at]:v.entity==='artifact'?(s.artifacts||[]).find(a=>a.uid===v.uid):null).filter(Boolean);
  if(step.select&&!step.untargeted&&!['discard','summon','festival'].includes(step.op)&&entities.some(v=>blocked(s,p,v)))return;
  if(step.op==='displaceTarget'){queueEffects(s,[{op:'displaceDestination',target:selected}],source,p,frame.effectCard);return;}
  if(resolveBorder(s,frame,fiftyAPI)||resolveAttackReaction(s,frame,fiftyAPI)||resolveBattle(s,frame,fiftyAPI)||resolveCopying(s,frame,fiftyAPI)||resolveMetamorphosis(s,frame,fiftyAPI)||resolveDream(s,frame,fiftyAPI)||resolveCollection(s,frame,fiftyAPI)||resolveCompletion(s,frame,fiftyAPI))return;
  if(resolveFifty(s,frame,fiftyAPI))return;
  if(step.op==='infiltrate')for(const u of entities){u.stealth=true;u.tapped=true;queueEffects(s,[{op:'infiltrateControl',uid:u.uid}],source,p);}
  if(step.op==='boundControl')for(const u of entities)bindControl(s,u,p,{source:source.uid});
  if(step.op==='morriganDamage')for(const target of entities){if(hurt(s,target,1,false,'ability',source)>0)heal(s,p,1);}
  if(step.op==='spearThrow')for(const target of entities){const o=s.artifacts.find(o=>o.uid===step.object),at=step.location?.at,layer=step.location?.layer;if(o&&occupied(target).includes(at)&&(target.layer||'surface')===layer){o.bearer=null;o.at=at;o.layer=layer;kill(s,target);}}
  if(step.op==='dracoTeleport')for(const target of entities){const actor=unit(s,source.uid);if(actor&&!actor.dying&&occupied({...actor,at:target.at}).every((at,i)=>canEnterOnGround(s,actor,{at:occupied(actor)[i],layer:actor.layer||'surface'},{at,layer:target.layer||'surface'},card,keywords,true))){actor.carryTeleport=true;actor.at=target.at;actor.layer=target.layer||'surface';actor.notRest=true;actor.burrowedSafely=false;queueEffects(s,[{op:'dracoArrive',uid:target.uid}],actor,p);}}
  if(step.op==='assassinThrow')for(const target of entities){const actor=unit(s,source.uid),o=s.artifacts.find(o=>o.uid===step.throwObject&&o.bearer===actor?.uid);if(actor&&o){o.bearer=null;o.at=target.at;o.layer=target.layer||'surface';hurt(s,target,card(o.card).cost||0,false,'ability',actor);}}
  if(step.op==='bonekiteBlast'){const victims=s.units.filter(u=>!u.dying&&u.uid!==source.uid&&occupied(u).includes(selected.at)&&(u.layer||'surface')===selected.layer);queueEffects(s,[{op:'bonekiteRaise',victims:victims.map(u=>u.uid),from:(s.deathHistory||[]).length,at:selected.at,layer:selected.layer}],source,p);for(const target of victims)hurt(s,target,3,false,'ability',source);}
  if(step.op==='warpSpasm')for(const u of entities)u.mods.push({powerMultiplier:2,warpSpasm:true,end:s.turn});
  if(step.op==='judasMark')for(const u of entities)(s.ongoingEffects||(s.ongoingEffects=[])).push({op:'judas',uid:u.uid,controller:p,end:s.turn});
  if(step.op==='bindSpellcaster')for(const u of entities)u.boundSpellcaster=true;
  if(step.op==='crossRegionPull')for(const u of entities)queueEffects(s,[{op:'dragStep',uid:u.uid,from:{at:u.at,layer:u.layer||'surface'},to:{at:source.at,layer:source.layer||'surface'},ignoreRegions:true}],source,p,frame.effectCard);
  if(step.op==='abyssTarget')for(const u of entities)queueEffects(s,[{op:'abyssDestination',uid:u.uid}],source,p,frame.effectCard);
  if(step.op==='gargGrab')for(const u of entities)queueEffects(s,[{op:'dragStep',uid:u.uid,from:{at:u.at,layer:u.layer||'surface'},to:{at:source.at,layer:source.layer||'surface'}},{op:'gargCocoon',uid:u.uid}],source,p,frame.effectCard);
  if(step.op==='shatterEnemy')for(const u of entities)queueEffects(s,[{op:'shatterArtifact',target:u.uid}],source,p,frame.effectCard);
  if(step.op==='thiefTarget')for(const u of entities)queueEffects(s,[{op:'thiefSteal',target:u.uid}],source,p,frame.effectCard);
  if(step.op==='divinePrepare')queueEffects(s,[{op:'divineBreak',at:selected.at,amount:1}],source,p,frame.effectCard);
  if(step.op==='stoneRainPrepare')queueEffects(s,[{op:'stoneRainHit',at:selected.at,remaining:s.players[p].hand.filter(h=>card(h.card).type==='Site').length}],source,p,frame.effectCard);
  if(step.op==='liesFirst'){const first=unit(s,selected.uid);if(!first||first.dying)return;const uids=s.units.filter(u=>!u.dying&&u.uid!==source.uid&&u.uid!==first?.uid&&sameLocation(s,u,first)&&occupied(u).some(at=>nearby(at,source.at))).map(u=>u.uid);if(first&&uids.length){queueEffects(s,[{op:'liesFight',first:first.uid,select:{kind:'unit',uids,anyRegion:true}}],source,p,frame.effectCard);if(step.second&&uids.includes(step.second.uid))s.storyline[s.storyline.length-1].selected=step.second;}}
  if(step.op==='replicaChoose'){const a=s.artifacts.find(a=>a.uid===selected.uid&&a.bearer===source.uid);if(a)queueEffects(s,[{op:'replicaPlace',card:a.card}],source,p,frame.effectCard);}
  if(step.op==='banishSite'){const at=selected.at,site=s.board[at];if(site&&!s.units.some(u=>card(u.card).type==='Avatar'&&occupied(u).includes(at))){if(site.owner===0||site.owner===1)sendCard(s,site.owner,site.card,'banished');s.board[at]=null;for(const u of s.units)if(occupied(u).includes(at))u.layer='surface';for(const a of s.artifacts)if(a.at===at)a.layer='surface';}}
  if(step.op==='mesmerPull')for(const u of entities){u.tapped=true;queueEffects(s,[{op:'unitStep',uid:u.uid,[step.away?'away':'toward']:{at:source.at,layer:source.layer||'surface'}}],source,p,frame.effectCard);}
  if(step.op==='bearerDamage'){const bearer=unit(s,source.bearer||source.uid);if(bearer&&!bearer.dying&&!disabled(bearer)){startEvent(s,bearer,bearer.card);for(const target of entities)hurt(s,target,step.amount,false,'ability',bearer);}}
  if(step.op==='relicDeath'){if(step.heal)heal(s,p,step.heal);if(step.loss)loseLife(s,1-p,step.loss,false);}
  if(step.op==='untapIfNonFire'&&s.players[p].castTurn===s.turn&&s.players[p].castNonFire)untap(s,unit(s,source.uid));
  if(step.op==='opponentSkeleton'){const controller=1-p;if(canSummonEntry(s,controller,card('skeleton'),source.at,source.layer||'surface')&&paySummoningTax(s,card('skeleton').id,controller,controller)){const u=makeUnit(s,card('skeleton').id,controller,source.at);u.layer=source.layer||'surface';summonedGenesis(s,u);}}
  if(step.op==='bonfireDestroy')for(const a of [...s.artifacts||[]])if((card(a.card).slug==='lance'||card(a.card).subtypes.some(t=>['Weapon','Armor'].includes(t)))&&nearby(a.at,source.at)&&region(s,a)===region(s,source)){if(a.ward)a.ward=false;else removeObject(s,a,'cemetery');}
  if(step.op==='graveToPeek')queueEffects(s,[{op:'peekSpell'}],source,p,frame.effectCard);
  if(step.op==='golgorSweep')for(const u of [...s.units])if(card(u.card).type==='Minion'&&occupied(u).includes(selected.at)&&(u.layer||'surface')===selected.layer&&power(u)<=2)kill(s,u,true);
  if(step.op==='swallow')for(const u of entities){u.swallowedBy=source.uid;u.bellyDisabled=true;u.notRest=true;}
  if(step.op==='lureStep')for(const u of entities)queueEffects(s,[{op:'unitStep',uid:u.uid,toward:{at:source.at,layer:source.layer||'surface'}}],source,p,frame.effectCard);
  if(step.op==='undertowChoose')queueEffects(s,[{op:'forcedWaterStep',uid:selected.uid,root:source.at}],source,p,frame.effectCard);
  if(step.op==='riptideChoose')queueEffects(s,[{op:'riptideMove',at:selected.at,select:{kind:'unit',adjacent:true,surface:true,anchor:{at:selected.at,layer:'surface'}}}],source,p,frame.effectCard);
  if(step.op==='collapseSite'){if(s.board[selected.at]?.card===selected.card)destroySite(s,selected.at);}
  if(step.op==='eruptSite')for(const u of s.units)if(!u.dying&&s.board[u.at]&&nearby(source.at,u.at))hurt(s,u,3,false,'ability',source);
  if(step.op==='riptideMove')for(const u of entities)if(!u.swallowedBy){if(u.size===2){queueEffects(s,[{op:'riptideGiant',uid:u.uid,root:step.at}],source,p,frame.effectCard);continue;}if(canEnterOnGround(s,u,u,{at:step.at,layer:'surface'},card,keywords)){u.notRest=true;u.at=step.at;u.layer='surface';u.burrowedSafely=false;}}
  if(step.op==='riptideGiant'){const u=unit(s,step.uid);if(!u||u.dying)return;const options=pullDestinations(s,u,step.root,false);if(selected===undefined){if(!options.length)return;s.choice={player:p,title:'Riptide · 選擇巨大單位的拉入位置',options:options.map(at=>({label:String.fromCharCode(65+at%5)+(4-Math.floor(at/5)),value:at})),frame};return;}assert(options.includes(selected),'巨大單位位置已失效');u.notRest=true;u.at=selected;return;}
  if(step.op==='graveRecur'){
    const entry=graveEntries(s,p).find(g=>g.uid===step.graveUid);if(!entry||selected===null)return;
    if(selected===undefined){s.choice={player:p,title:card(entry.card).name+' · 從墓地召喚',options:[...(step.layer?[step.layer]:['surface','below']).map(layer=>({label:layer==='below'?'召喚到地下／水下':'召喚到表面',value:{at:step.at,layer}})),{label:'不召喚',value:null}],frame};return;}
    const u=summonGraveAt(s,entry,p,step.at,selected.layer);if(u&&step.tapped)u.tapped=true;
  }
  if(step.op==='returnDeadHand'){
    takeGrave(s,selected.player,selected.index,selected.card,selected.uid);s.players[p].hand.push({uid:'h'+s.next++,card:selected.card});
  }
  if(step.op==='burnBook'){
    if(selected.entity==='grave'){takeGrave(s,selected.player,selected.index,selected.card,selected.uid);s.players[selected.player].banished.push(selected.card);}
    else {const object=(s.artifacts||[]).find(a=>a.uid===selected.uid);if(object)removeObject(s,object,'banished');}
  }
  if(step.op==='geomancerRubble'){if(!s.board[selected.at])s.board[selected.at]={uid:'s'+s.next++,card:card('rubble').id,owner:null,controller:null,ward:false};}
  if(step.op==='geomancerReplace'){const id=s.players[p].atlas.shift();assert(id,'Atlas 已空');enterSite(s,p,id,selected.at,false);}
  if(step.op==='sparkDischarge'||step.op==='nimbusDischarge'){
    const pool=s.units.filter(u=>!u.dying&&u.uid!==source.uid&&(step.op==='sparkDischarge'?occupied(u).includes(selected.at)&&(u.layer||'surface')===selected.layer:sameLocation(s,u,source))),amount=step.op==='sparkDischarge'?(s.players[p].castTurn===s.turn?s.players[p].castAir||0:0):3;
    if(pool.length)hurt(s,pool[rollIndex(s,pool.map(u=>card(u.card).name+' @ '+u.at))],amount,false,'ability',source);
  }
  if(step.op==='waveshaperFlood'){
    for(const site of s.board)if(site?.effects)site.effects=site.effects.filter(e=>e.waveSource!==source.uid);
    const site=s.board[selected.at];if(!site.effects)site.effects=[];site.effects.push({flood:true,waveSource:source.uid,stamp:s.next++});refreshContinuous(s);
    for(const u of s.units)if(u.at===selected.at&&card(u.card).type==='Minion'&&!keywords(u).includes('Submerge')){u.tapped=true;u.skipUntap=true;}
  }
  if(step.op==='coinBanish')queueEffects(s,[{op:'banishGraveOne',remaining:3,optional:true,select:{kind:'grave'}}],source,p,frame.effectCard);
  if(step.op==='skullSummon'){
    takeGrave(s,selected.player,selected.index,selected.card,selected.uid);s.players[selected.player].banished.push(selected.card);
    if(canSummonEntry(s,p,card('skeleton'),source.at,source.layer||'surface')&&paySummoningTax(s,card('skeleton').id,p,p)){const u=makeUnit(s,card('skeleton').id,p,source.at);u.layer=source.layer||'surface';summonedGenesis(s,u);}
  }
  if(step.op==='relicSiteEnd'){
    const a=(s.artifacts||[]).find(a=>a.uid===source.uid)||source,controller=s.board[a.at]?.controller,d=passives[card(a.card).slug];
    if(controller===0||controller===1){if(d.eachEndSiteHeal)heal(s,controller,d.eachEndSiteHeal);if(d.eachEndSiteLoss)loseLife(s,controller,d.eachEndSiteLoss,false);if(d.eachEndUnspentLoss&&controller===p)loseLife(s,controller,resources(s,controller).available,false);}
  }
  if(step.op==='obeliskStart'){const d=passives[card(source.card).slug];loseLife(s,p,d.siteStartLoss,false);s.players[p].bonusMana=(s.players[p].bonusMana||0)+d.siteStartMana;}
  if(['damage','strike','rangedHit','destroy','untap','ward','stealth','returnHand','control','sleep','damageDisable'].includes(step.op))for(const target of entities){
    if(step.op==='damage')hurt(s,target,step.amount,step.lethal,damageKind,source);
    if(step.op==='strike')strike(s,source,target);
    if(step.op==='rangedHit')strike(s,source,target,step.amount,true);
    if(step.op==='destroy')kill(s,target);
    if(step.op==='untap')untap(s,target);
    if(step.op==='ward'&&!unitUmbrellas(target).includes('Evil'))target.ward=true;
    if(step.op==='stealth')target.stealth=true;
    if(step.op==='returnHand')leaveUnit(s,target,'hand');
    if(step.op==='control')target.controller=p;
    if(step.op==='sleep'){target.mods.push({asleep:true});target.ward=false;target.stealth=false;}
    if(step.op==='damageDisable'){hurt(s,target,step.amount,false,damageKind,source);target.mods.push({disabled:true,until:p});target.ward=false;target.stealth=false;}
  }
  if(step.op==='bury'){const u=unit(s,step.uid);if(u)leaveUnit(s,u,u.destination||'cemetery');}
  if(step.op==='buryMany')for(const uid of step.uids){const u=unit(s,uid);if(u)leaveUnit(s,u,u.destination||'cemetery');}
  if(step.op==='finishMagic')sendCard(s,step.owner,step.card,step.destination||'cemetery');
  if(step.op==='crowsDamage')for(const u of s.units)if(!u.dying&&u.controller!==p&&card(u.card).type==='Minion'&&(u.layer||'surface')==='surface'&&s.board[u.at])hurt(s,u,1,false,'magic',source);
  if(step.op==='returnSelf'){const u=unit(s,source.uid);if(u)u.destination='hand';}
  if(step.op==='destroyStruck')kill(s,unit(s,step.uid));
  if(step.op==='healSurvivor'){const u=unit(s,step.uid);if(u&&!u.dying)fullyHeal(s,u);}
  if(step.op==='gainDeathPower'){const u=unit(s,step.uid);if(u)u.mods.push({power:step.amount});}
  if(step.op==='killSkeleton'){if(!canSummonEntry(s,p,card('skeleton'),step.at,step.layer||'surface'))return;const u=makeUnit(s,card('skeleton').id,p,step.at);u.layer=step.layer;}
  if(step.op==='giantKill'){const u=unit(s,step.uid),victim=unit(s,step.victim);if(u&&victim?.dying&&victim.destination!=='banished'){victim.destination='banished';u.mods.push({power:1});}}
  if(step.op==='albatrossRevenge'){const killer=unit(s,step.killer.uid)||step.killer;for(const u of [...s.units])if(u.uid!==killer.uid&&u.controller===killer.controller&&card(u.card).type==='Minion'&&nearby(u.at,killer.at)&&region(s,u)===region(s,killer))kill(s,u);}
  if(step.op==='balinStrike'){
    const target=unit(s,step.avatar);if(target){const at=target.at;destroySite(s,at);if(s.board[at]&&!waterSite(s,at,card)){
      for(const u of s.units)if(u.uid!==source.uid&&u.at===at&&card(u.card).type==='Minion')u.layer='below';
      for(const a of s.artifacts||[])if(a.at===at){const bearer=unit(s,a.bearer);if(bearer&&(bearer.layer||'surface')!=='below')a.bearer=null;a.layer='below';}
    }}
  }
  if(step.op==='healWaterAllies')for(const u of s.units)if(u.controller===p&&!u.dying){const amount=bodyOfWater(s,u.at,card).size;if(card(u.card).type==='Avatar')heal(s,p,amount);else u.damage=Math.max(0,u.damage-healingAmount(s,amount));}
  if(step.op==='bodySiteDamage')for(const u of s.units)if(u.at===selected.at&&card(u.card).type==='Minion')hurt(s,u,step.amount,false,damageKind,source);
  if(step.op==='linkBody'){
    const site=s.board[selected.at];if(site){if(!site.uid)site.uid='s'+s.next++;if(!s.ongoingEffects)s.ongoingEffects=[];s.ongoingEffects.push({op:'linkBody',rootUid:site.uid,water:step.water,controller:p,end:s.turn});}
  }
  if(step.op==='wrathSea'){
    const body=bodyOfWater(s,selected.at,card),targets=s.board.flatMap((site,at)=>site&&[...body].some(i=>distance(i,at)===1)?[at]:[]);
    for(const at of targets){const site=s.board[at];if(!site.effects)site.effects=[];site.effects.push({flood:true,end:s.turn,stamp:s.next++});}
    for(const u of s.units)if(card(u.card).type==='Minion'&&waterSite(s,u.at,card))u.layer='below';
    for(const a of s.artifacts||[])if(waterSite(s,a.at,card)){const bearer=unit(s,a.bearer);if(bearer&&(bearer.layer||'surface')!=='below')a.bearer=null;a.layer='below';}
  }
  if(step.op==='untapSelf')untap(s,unit(s,step.uid||source.uid));
  if(step.op==='tapSkip')for(const u of entities){u.tapped=true;u.skipUntap=true;}
  if(step.op==='dieIfNoAttack'){const u=unit(s,source.uid);if(u&&u.attackedTurn!==s.turn)kill(s,u,false,true);}
  if(step.op==='destroyOthersHere'){
    for(const u of [...s.units])if(u.uid!==source.uid&&sameLocation(s,u,source))kill(s,u);
    for(const a of [...s.artifacts||[]])if(sameLocation(s,a,source))removeObject(s,a,'cemetery');
    if((source.layer||'surface')==='surface')for(const a of [...s.auras||[]])if(inside(a,source.at))removeObject(s,a,'cemetery');
    destroySite(s,source.at);
  }
  if(step.op==='burrowSelf'){const u=unit(s,source.uid);if(u&&s.board[u.at]&&!waterSite(s,u.at,card))u.layer='below';}
  if(step.op==='submergeHere'&&waterSite(s,source.at,card))for(const u of [...s.units,...s.artifacts||[]])if(u.at===source.at&&(u.layer||'surface')===(source.layer||'surface')&&card(u.card).type!=='Avatar')u.layer='below';
  if(step.op==='acquireLance'){const u=unit(s,source.uid);if(u)acquireLance(s,u,p);}
  if(step.op==='payLance'&&resources(s,p).available>=step.amount){s.players[p].spent+=step.amount;acquireLance(s,null,p,source.at);}
  if(step.op==='tapDrop')for(const u of entities){u.tapped=true;for(const a of s.artifacts||[])if(a.bearer===u.uid){a.bearer=null;a.at=u.at;a.layer=u.layer||'surface';}}
  if(step.op==='nightAttack'){
    for(const a of s.artifacts||[]){const u=unit(s,a.bearer);if(u&&u.controller!==p){a.bearer=null;a.at=u.at;a.layer=u.layer||'surface';}}
    if(!s.ongoingEffects)s.ongoingEffects=[];s.ongoingEffects.push({op:'nightAttack',controller:p,end:s.turn});
  }
  if(step.op==='fightStage'){
    const f=step.fight,a=unit(s,f.attacker),defenders=f.defenders.map(uid=>unit(s,uid)).filter(u=>u&&!u.dying&&(f.remote||a&&sameLocation(s,u,a)));
    if(!a||a.dying||!defenders.length){queueEffects(s,[{op:'fightFinish',fight:f}],source,p);return;}
    const all=[a,...defenders],firstIds=step.firstIds||all.filter(u=>!disabled(u)&&strikesFirst(s,u,f)).map(u=>u.uid);
    const plans=all.filter(u=>!disabled(u)&&(!(!u.silenced&&passives[card(u.card).slug]?.noDefensiveStrike)||u.uid===a.uid||step.fight.kind==='spell')&&(step.phase==='first'?firstIds.includes(u.uid):!firstIds.includes(u.uid))).map(u=>({uid:u.uid,amount:strikeTotal(s,u),targets:u.uid===a.uid?defenders.map(v=>v.uid):[a.uid]}));
    queueEffects(s,[{op:'combatAllocate',fight:f,phase:step.phase,firstIds,plans,planIndex:0,targetIndex:0,allocations:plans.map(()=>[])}],source,p);
  }
  if(step.op==='combatAllocate'){
    const {plans,planIndex:i,targetIndex:j,allocations}=step,plan=plans[i];
    if(!plan){queueEffects(s,[{...step,op:'combatResolve'}],source,p);return;}
    const remaining=plan.amount-allocations[i].reduce((n,v)=>n+v.amount,0),target=unit(s,plan.targets[j]);
    if(j===plan.targets.length-1){allocations[i].push({uid:plan.targets[j],amount:remaining});queueEffects(s,[{...step,planIndex:i+1,targetIndex:0}],source,p);return;}
    if(selected===undefined){s.choice={player:unit(s,plan.uid).controller,title:card(unit(s,plan.uid).card).name+'：分配給 '+card(target.card).name+'（剩餘 '+remaining+' 傷害）',options:Array.from({length:remaining+1},(_,amount)=>({label:String(amount)+' 傷害',value:amount})),frame};return;}
    assert(Number.isInteger(selected)&&selected>=0&&selected<=remaining,'傷害分配超出範圍');allocations[i].push({uid:target.uid,amount:selected});queueEffects(s,[{...step,targetIndex:j+1}],source,p);
  }
  if(step.op==='combatResolve'){
    queueEffects(s,[step.phase==='first'?{op:'fightStage',fight:step.fight,phase:'normal',firstIds:step.firstIds}:{op:'fightFinish',fight:step.fight}],source,p);
    s.damageWindow={wards:s.units.filter(u=>u.ward).map(u=>u.uid)};
    try{for(const [i,plan] of step.plans.entries()){const u=unit(s,plan.uid);if(u&&!u.dying)strikeMany(s,u,step.allocations[i]);}for(const uid of s.damageWindow.hydras||[]){const u=unit(s,uid);if(u&&!u.lethal&&u.damage<power(u,true))u.damage=0;}}finally{delete s.damageWindow;}
  }
  if(step.op==='fightFinish'){const u=unit(s,step.fight.attacker);if(u&&step.fight.kind!=='spell')u.stealth=false;}
  if(step.op==='searchDiscardTop'){
    const deck=s.players[p].spells,pool=step.pool||deck.splice(0,step.count);
    if(selected===undefined&&pool.length){s.choice={player:p,title:'搜尋頂牌：選擇要棄掉的僕從，或找不到',options:[...pool.flatMap((id,index)=>card(id).type==='Minion'?[{label:card(id).name,value:index}]:[]),{label:'找不到',value:'none'}],frame:{...frame,step:{...step,pool}}};return;}
    if(selected!==undefined&&selected!=='none'){assert(Number.isInteger(selected)&&card(pool[selected]).type==='Minion','必須選擇僕從');const id=pool.splice(selected,1)[0];sendCard(s,p,id,'cemetery');}
    queueEffects(s,[{op:'orderDeck',deck:'spells',count:pool.length,pool,destination:'bottom'}],source,p,frame.effectCard);
  }
  if(step.op==='lookHand'&&selected===undefined)s.choice={player:p,title:'查看對手手牌',options:[{label:s.players[1-p].hand.map(h=>card(h.card).name).join(' ／ ')||'對手沒有手牌',value:'continue'}],frame};
  if(step.op==='roadPower')for(const u of entities)queueEffects(s,[{op:'roadPowerMode',uid:u.uid}],source,p,frame.effectCard);
  if(step.op==='roadPowerMode'){
    if(selected===undefined){s.choice={player:p,title:'本回合力量增減',options:[{label:'+1 力量',value:1},{label:'−1 力量',value:-1}],frame};return;}
    const u=unit(s,step.uid);if(u)u.mods.push({power:selected,end:s.turn});
  }
  if(step.op==='surfaceSite')for(const u of s.units)if(u.at===selected.at&&card(u.card).type==='Minion')u.layer='surface';
  if(step.op==='thinIce'){
    const minions=s.units.filter(u=>u.at===source.at&&(u.layer||'surface')==='surface'&&card(u.card).type==='Minion'&&!u.dying);
    if(minions.reduce((n,u)=>n+power(u),0)>=5)for(const u of minions)u.layer='below';
  }
  if(step.op==='peekSpell'){
    const deck=s.players[p][step.deck||'spells'];if(!deck.length)return;
    if(selected===undefined){s.choice={player:p,title:'檢視頂牌：'+card(deck[0]).name,options:[{label:'留在頂部',value:'keep'},{label:'放到牌庫底部',value:'bottom'}],frame};return;}
    if(selected==='bottom')deck.push(deck.shift());
  }
  if(step.op==='orderDeck'){
    const deck=s.players[p][step.deck],pool=step.pool||deck.splice(0,step.count),ordered=step.ordered||[],move=Math.min(step.move??step.count,pool.length+ordered.length);
    if(selected!==undefined){assert(Number.isInteger(selected)&&pool[selected],'排序選擇已失效');ordered.push(pool.splice(selected,1)[0]);}
    if(ordered.length>=move||!pool.length){if(step.destination==='top')deck.unshift(...ordered,...pool);else {deck.unshift(...pool);deck.push(...ordered);}return;}
    s.choice={player:p,title:step.destination==='top'?'依序放回牌庫頂部':'選擇下一張放到牌庫底部的牌',options:pool.map((id,index)=>({label:card(id).name,value:index})),frame:{...frame,step:{...step,pool,ordered}}};
  }
  if(step.op==='bottomToTop'){
    const deck=s.players[p].spells,pool=step.pool||deck.splice(Math.max(0,deck.length-step.count));if(!pool.length)return;
    if(selected===undefined){s.choice={player:p,title:'檢視底部牌：選一張放到頂部',options:pool.map((id,index)=>({label:card(id).name,value:index})),frame:{...frame,step:{...step,pool}}};return;}
    assert(Number.isInteger(selected)&&pool[selected],'底牌選擇已失效');deck.unshift(pool.splice(selected,1)[0]);deck.push(...pool);
  }
  if(step.op==='broceliande')for(const u of s.units)if(nearby(u.at,source.at)&&region(s,u)==='surface'){const types=unitTypes(u);if(types.includes('Faerie'))untap(s,u);if(types.includes('Mortal'))u.tapped=true;if(types.includes('Beast'))u.stealth=true;}
  if(step.op==='permanentAffinity'){
    if(selected===undefined){s.choice={player:p,title:'選擇永久提供的元素',options:elements.map(e=>({label:e,value:e})),frame};return;}
    if(s.board[source.at])s.board[source.at].chosenAffinity=selected;
  }
  if(step.op==='temporaryAffinity'){
    if(selected===undefined){s.choice={player:p,title:'本回合獲得哪個元素？',options:elements.map(e=>({label:e,value:e})),frame};return;}
    const pl=s.players[p];if(!pl.bonusAffinity)pl.bonusAffinity={};pl.bonusAffinity[selected]=(pl.bonusAffinity[selected]||0)+1;
  }
  if(step.op==='floodSite'){const site=s.board[selected.at];if(site){if(!site.effects)site.effects=[];site.effects.push({flood:true,end:s.turn,stamp:s.next++});}}
  if(step.op==='giveSite'&&s.board[source.at])s.board[source.at].controller=1-p;
  if(step.op==='terrainEffect'){
    if(!s.ongoingEffects)s.ongoingEffects=[];s.ongoingEffects.push({...step,select:undefined,at:selected?.at??source.at,controller:p,until:p});
  }
  if(step.op==='browseTop'){
    const pool=s.players[p].spells.splice(0,step.count);
    queueEffects(s,[{op:'browsePick',pool,limit:step.limit||1,evilMinions:!!step.evilMinions,chosen:[]}],source,p,frame.effectCard);
  }
  if(step.op==='browsePick'){
    const choices=step.pool.flatMap((id,index)=>!step.evilMinions||card(id).type==='Minion'&&card(id).umbrellas.includes('Evil')&&!step.chosen.includes(id)?[{label:card(id).name,value:index}]:[]);
    if(selected===undefined&&step.limit>0&&choices.length){s.choice={player:p,title:step.evilMinions?'選擇不同的 Evil 僕從，或停止':'選擇一張加入手牌',options:[...choices,...(step.evilMinions?[{label:'停止選取',value:'stop'}]:[])],frame};return;}
    if(selected!==undefined&&selected!=='stop'){
      assert(Number.isInteger(selected)&&step.pool[selected],'頂牌選擇已失效');const pool=[...step.pool],id=pool.splice(selected,1)[0];s.players[p].hand.push({uid:'h'+s.next++,card:id});
      if(step.evilMinions)log(s,'揭示 '+card(id).name+' 並抽取。');
      queueEffects(s,[{...step,pool,limit:step.limit-1,chosen:[...step.chosen,id]}],source,p,frame.effectCard);
    }else queueEffects(s,[{op:'browseBottom',pool:step.pool}],source,p,frame.effectCard);
  }
  if(step.op==='browseBottom'&&step.pool.length){
    if(selected===undefined){s.choice={player:p,title:'選擇下一張放到牌庫底部的牌',options:step.pool.map((id,index)=>({label:card(id).name,value:index})),frame};return;}
    assert(Number.isInteger(selected)&&step.pool[selected],'牌庫底部排序已失效');const pool=[...step.pool];s.players[p].spells.push(pool.splice(selected,1)[0]);queueEffects(s,[{...step,pool}],source,p,frame.effectCard);
  }
  if(step.op==='searingTruth'){
    const q=selected.player,ids=[draw(s,q,'spells'),draw(s,q,'spells')].filter(Boolean);log(s,'揭示 '+ids.map(id=>card(id).name).join('、'));hurt(s,avatar(s,q),Math.max(0,...ids.map(id=>card(id).cost)),false,damageKind,source);
  }
  if(step.op==='destroyRanks'){
    const matches=id=>step.ranks.includes(card(id).slot);
    for(const u of [...s.units])if(matches(u.card))kill(s,u);
    for(const o of [...s.artifacts||[],...s.auras||[]])if(matches(o.card))removeObject(s,o,'cemetery');
    for(let at=0;at<20;at++)if(s.board[at]&&matches(s.board[at].card))destroySite(s,at);
  }
  if(step.op==='hellfire'){
    for(const u of [...s.units])if(s.board[u.at]&&(u.layer||'surface')==='below')kill(s,u);
    for(const o of [...s.artifacts||[]])if(s.board[o.at]&&o.layer==='below')removeObject(s,o,'cemetery');
    for(const u of s.units)if(s.board[u.at]&&(u.layer||'surface')==='surface'&&card(u.card).type==='Minion')hurt(s,u,2,false,damageKind,source);
  }
  if(step.op==='recallAllies')queueEffects(s,[{op:'recallOne',remaining:s.units.filter(u=>u.controller===p&&card(u.card).type==='Minion'&&!u.dying).map(u=>u.uid)}],source,p,frame.effectCard);
  if(step.op==='recallOne'){
    if(selected===undefined){const options=step.remaining.map(uid=>unit(s,uid)).filter(Boolean).map(u=>({label:card(u.card).name,value:u.uid}));if(!options.length)return;s.choice={player:p,title:'召回僕從，或結束召回',options:[...options,{label:'結束召回',value:'stop'}],frame};return;}
    if(selected!=='stop'){const u=unit(s,selected);if(u){u.at=source.at;u.layer=source.layer||'surface';}queueEffects(s,[{...step,remaining:step.remaining.filter(uid=>uid!==selected)}],source,p,frame.effectCard);}
  }
  if(step.op==='snatchArtifact')for(const o of entities){const u=unit(s,source.uid);if(u){o.bearer=u.uid;o.at=u.at;o.layer=u.layer||'surface';o.controller=u.controller;}}
  if(step.op==='shieldWall'||step.op==='witchingHour'){
    if(!s.ongoingEffects)s.ongoingEffects=[];s.ongoingEffects.push({op:step.op,controller:p,...(step.op==='shieldWall'?{until:p}:{end:s.turn})});
  }
  if(step.op==='trialWaterChoose')for(const u of entities)queueEffects(s,[{op:'trialWaterSink',select:{kind:'unit',minion:true,nearby:true,water:true}}],u,p,frame.effectCard);
  if(step.op==='trialWaterSink')for(const u of entities)if(waterSite(s,u.at,card))u.layer='below';
  if(step.op==='ambushSkeletons')for(const u of entities)queueEffects(s,[{op:'summon',slug:'skeleton',where:'adjacentSites'}],u,p,frame.effectCard);
  if(step.op==='razeSite')for(const u of entities){destroySite(s,u.at);for(const o of [...s.artifacts||[]])if(o.at===u.at)removeObject(s,o,'cemetery');}
  if(step.op==='detonate')for(const o of entities){queueEffects(s,[{op:'detonateDamage',at:o.at,layer:o.layer||'surface'}],source,p,frame.effectCard);if(targets.some(v=>v.entity==='artifact'&&v.uid===o.uid))removeObject(s,o,'cemetery');else kill(s,o);}
  if(step.op==='detonateDamage')for(const u of s.units)if(occupied(u).includes(step.at)&&(u.layer||'surface')===step.layer)hurt(s,u,3,false,damageKind,source);
  if(step.op==='conquerSite'&&s.board[source.at]&&!s.units.some(u=>u.controller!==p&&u.at===source.at&&!u.dying))s.board[source.at].controller=p;
  if(step.op==='nearbyRandomDiscard')for(let q=0;q<2;q++)if(nearby(source.at,avatar(s,q).at)&&region(s,source)===region(s,avatar(s,q))){const pl=s.players[q];if(pl.hand.length){const h=pl.hand.splice(rollIndex(s,pl.hand.map(h=>card(h.card).name)),1)[0];sendCard(s,q,h.card,'cemetery');}}
  if(step.op==='carryingDraw'&&(s.artifacts||[]).some(o=>o.bearer===source.uid))queueEffects(s,[{op:'drawCards',count:1}],source,p,frame.effectCard);
  if(step.op==='faerieDraw'){const n=s.units.filter(u=>!u.dying&&unitTypes(u).includes('Faerie')).length;for(let q=0;q<2;q++)for(let i=0;i<n;i++)draw(s,q,'spells');}
  if(step.op==='drawCards'){
    if(selected===true){queueEffects(s,[{...step,optional:false}],source,p,frame.effectCard);return;}
    let n=step.count;
    if(n==='uniqueAllies')n=s.units.filter(u=>u.controller===p&&card(u.card).slot==='Unique').length;
    if(n==='alliedRarities')n=new Set(s.units.filter(u=>u.controller===p&&card(u.card).type==='Minion').map(u=>card(u.card).slot).filter(Boolean)).size;
    if(n==='band')n=new Set([...s.units.filter(u=>unitTypes(u).includes('Undead')),...(s.artifacts||[]).filter(a=>card(a.card).subtypes.some(t=>t.includes('Instrument')))].filter(u=>nearby(u.at,source.at)&&region(s,u)===region(s,source)).map(u=>u.card)).size;
    if(n<=0)return;
    if(selected===undefined){s.choice={player:p,title:'抽 '+n+' 張牌：先宣告 Atlas／Spellbook 張數',options:Array.from({length:n+1},(_,sites)=>({label:'地點 '+sites+' ／ 法術 '+(n-sites),value:{sites,spells:n-sites}})),frame:{...frame,step:{...step,count:n}}};return;}
    queueEffects(s,[...Array.from({length:selected.sites},()=>({op:'drawOne',deck:'atlas'})),...Array.from({length:selected.spells},()=>({op:'drawOne',deck:'spells'}))],source,p,frame.effectCard);return;
  }
  if(step.op==='drawBottomSpell')draw(s,p,'spells',null,true);
  if(step.op==='banishGraves')queueEffects(s,[{op:'banishGraveOne',remaining:step.count,optional:!!step.optionalCards,select:{kind:'grave',player:selected.player}}],source,p,frame.effectCard);
  if(step.op==='banishGraveOne'){
    const pl=s.players[selected.player];assert(pl.cemetery[selected.index]===selected.card,'墓地選擇已失效');takeGrave(s,selected.player,selected.index,selected.card,selected.uid);pl.banished.push(selected.card);
    if(step.remaining>1)queueEffects(s,[{...step,remaining:step.remaining-1}],source,p,frame.effectCard);
  }
  if(step.op==='poachDeck')queueEffects(s,[{op:'poachOne',remaining:step.count,optional:true,select:{kind:'deck',player:selected.player,types:['Beast']}},{op:'shuffleDeck',player:selected.player}],source,p,frame.effectCard);
  if(step.op==='poachOne'){
    const pl=s.players[selected.player];assert(pl.spells[selected.index]===selected.card,'牌庫選擇已失效');pl.spells.splice(selected.index,1);pl.banished.push(selected.card);
    if(step.remaining>1)queueEffects(s,[{...step,remaining:step.remaining-1}],source,p,frame.effectCard);
  }
  if(step.op==='takeDeck'){
    const pl=s.players[selected.player];assert(pl.spells[selected.index]===selected.card,'牌庫選擇已失效');pl.spells.splice(selected.index,1);pl.hand.push({uid:'h'+s.next++,card:selected.card});log(s,'揭示 '+card(selected.card).name+' 並加入手牌。');
  }
  if(step.op==='shuffleDeck')shuffle(s,s.players[step.own?p:step.player].spells);
  if(step.op==='brotherSummon'){if(!canSummonEntry(s,p,card(selected.card),source.at,source.layer||'surface'))return;
    const pl=s.players[selected.player];
    if(selected.entity==='deck'){assert(pl.spells[selected.index]===selected.card,'牌庫選擇已失效');pl.spells.splice(selected.index,1);shuffle(s,pl.spells);}else pl.hand=pl.hand.filter(h=>h.uid!==selected.uid);
    const u=makeUnit(s,selected.card,p,source.at);u.layer=source.layer||'surface';refreshContinuous(s);if(!u.silenced)queueEffects(s,definitions[card(u.card).slug]?.genesis||[],u,p);
  }
  if(step.op==='sacrificeDraw')for(const u of entities){queueEffects(s,[{op:'draw',deck:'spells',count:1}],source,p,frame.effectCard);kill(s,u,false,true,true);}
  if(step.op==='sacrificeOrDamage'){
    if(selected===undefined){s.choice={player:p,title:'犧牲僕從，或承受 '+step.amount+' 傷害',options:[...selectEffects(s,frame,{kind:'unit',minion:true,ally:true,anyRegion:true,untargeted:true}),{label:'不犧牲，承受傷害',value:'damage'}],frame};return;}
    if(selected==='damage')hurt(s,avatar(s,p),step.amount,false,damageKind,source);else {const u=unit(s,selected.uid);if(u)kill(s,u,false,true,true);}
  }
  if(step.op==='discardOrStrike'){
    if(selected===undefined){s.choice={player:p,title:'棄一張牌，或 Avatar 被攻擊',options:[...selectEffects(s,frame,{kind:'hand'}),{label:'不棄牌，Avatar 受到 Strike',value:'strike'}],frame};return;}
    if(selected==='strike')strike(s,source,avatar(s,p));else {const pl=s.players[p],h=pl.hand.find(h=>h.uid===selected.uid);if(h){pl.hand=pl.hand.filter(v=>v.uid!==h.uid);sendCard(s,selected.player,h.card,'cemetery');}}
  }
  if(step.op==='returnIfMortal'&&s.units.some(u=>u.uid!==source.uid&&u.controller===p&&unitTypes(u).includes('Mortal'))){const u=unit(s,source.uid);if(u)u.destination='hand';}
  if(step.op==='harpyPull')for(const u of entities){u.at=source.at;u.layer=source.layer||'surface';queueEffects(s,[{op:'strikeFixed',uid:u.uid,optional:true}],source,p,frame.effectCard);}
  if(step.op==='strikeFixed'){const u=unit(s,step.uid);if(u)strike(s,source,u);}
  if(step.op==='raphael')for(const u of entities)queueEffects(s,[{op:'raphaelMode',uid:u.uid}],source,p,frame.effectCard);
  if(step.op==='raphaelMode'){
    if(selected===undefined){s.choice={player:p,title:'Raphael：Strike 或 Ward',options:[{label:'Strike',value:'strike'},{label:'Ward',value:'ward'}],frame};return;}
    const u=unit(s,step.uid);if(u){if(selected==='strike')strike(s,source,u);else u.ward=true;}
  }
  if(step.op==='modify')for(const u of entities)u.mods.push({...step.mod,...(step.duration==='next'?{until:p}:{end:s.turn})});
  if(step.op==='transformToken')for(const u of entities){s.players[u.owner].banished.push(u.card);u.card=card(step.slug).id;log(s,'變形為 '+card(u.card).name+'，保留同一實體。');}
  if(step.op==='fade')for(const u of entities){u.stealth=true;if(s.board[u.at]?.controller===1-p)queueEffects(s,[{op:'drawCards',count:1}],source,p,frame.effectCard);}
  if(step.op==='blinkAlly')for(const u of entities)queueEffects(s,[{op:'teleportChosen',uid:u.uid,select:{kind:'location',nearby:true,sameRegion:true}}],u,p,frame.effectCard);
  if(step.op==='teleportChosen'){const u=unit(s,step.uid);if(u){u.carryTeleport=true;u.at=selected.at;u.layer=selected.layer;u.burrowedSafely=false;}}
  if(step.op==='damageUntap')for(const u of entities){hurt(s,u,step.amount,false,damageKind,source);untap(s,u);}
  if(step.op==='silenceTap')for(const u of entities){u.mods.push({silenced:true,end:s.turn});u.tapped=true;}
  if(step.op==='smite')for(const u of entities){if(unitUmbrellas(u).includes('Evil'))kill(s,u,true);else strike(s,source,u);}
  if(step.op==='sourceStrikes')for(const u of entities)queueEffects(s,[{op:'strike',all:{kind:'unit',enemy:true,here:true}}],u,p,frame.effectCard);
  if(step.op==='duelChoose')for(const u of entities)queueEffects(s,[{op:'fightPair',select:{kind:'unit',enemy:true,adjacent:true}}],u,p,frame.effectCard);
  if(step.op==='fightPair')for(const u of entities){const ally=unit(s,source.uid);if(ally&&!ally.dying)fight(s,{attacker:ally.uid,defenders:[u.uid],kind:'spell',remote:true});}
  if(step.op==='triggerDeath')for(const u of entities)queueEffects(s,[...(!u.silenced&&!disabled(u)?definitions[card(u.card).slug]?.death||[]:[]),{op:'markStealth',uid:u.uid},{op:'draw',deck:'spells',count:1}],u,p,frame.effectCard);
  if(step.op==='markStealth'){const u=unit(s,step.uid);if(u)u.stealth=true;}
  if(step.op==='banish')for(const u of entities)kill(s,u,true);
  if(step.op==='satanicPanic'){for(const u of [...s.units])if(card(u.card).type==='Minion'&&unitTypes(u).includes('Demon'))kill(s,u);for(const u of entities)kill(s,u);}
  if(step.op==='shiftLayer')for(const u of entities){u.layer=step.layer;u.burrowedSafely=false;}
  if(step.op==='sinkSite'){
    for(const u of [...s.units,...s.artifacts||[]])if(u.at===selected.at&&card(u.card).type!=='Avatar'){u.layer='below';u.burrowedSafely=false;}
  }
  if(step.op==='destroySiteMinions')for(const u of s.units)if(u.at===selected.at&&card(u.card).type==='Minion')kill(s,u);
  if(step.op==='liftSite'){
    for(const u of [...s.units,...s.artifacts||[]])if(u.at===selected.at){u.layer='surface';u.burrowedSafely=false;}
    for(let i=0;i<step.skeletons;i++)if(canSummonEntry(s,p,card('skeleton'),selected.at,'surface'))makeUnit(s,card('skeleton').id,p,selected.at);
  }
  if(step.op==='geyser'){
    const site=s.board[selected.at];if(site){if(!site.effects)site.effects=[];site.effects.push({flood:true,end:s.turn,stamp:s.next++});}
    for(const u of s.units)if(u.at===selected.at&&card(u.card).type==='Minion')u.mods.push({keyword:'Airborne',end:s.turn});
  }
  if(step.op==='resurrectRandom'){
    const dead=s.players.flatMap((pl,player)=>graveEntries(s,player).filter(g=>card(g.card).type==='Minion'&&card(g.card).playable));
    if(dead.length)summonGraveAt(s,dead[rollIndex(s,dead.map(g=>card(g.card).name))],p,selected.at,'surface');
  }
  if(step.op==='summonGrave')queueEffects(s,[{op:'summonGraveAt',grave:selected,select:{kind:'location',nearby:true,canSummon:selected.card}}],source,p,frame.effectCard);
  if(step.op==='summonGraveAt')summonGraveAt(s,step.grave,p,selected.at,selected.layer);
  if(step.op==='returnGraves'){
    queueEffects(s,[step.draw==='card'?{op:'drawCards',count:1}:{op:'draw',deck:step.draw,count:1}],source,p,frame.effectCard);
    queueEffects(s,[{op:'returnGraveOne',remaining:step.limit||s.players[p].cemetery.length,oneCemetery:step.oneCemetery,optional:true,select:{kind:'grave',own:!!step.own,unique:!!step.unique}}],source,p,frame.effectCard);
  }
  if(step.op==='returnGraveOne'&&step.remaining>0&&selected){
    const pl=s.players[selected.player];assert(pl.cemetery[selected.index]===selected.card,'墓地選擇已失效');takeGrave(s,selected.player,selected.index,selected.card,selected.uid);pl[card(selected.card).type==='Site'?'atlas':'spells'].push(selected.card);
    if(step.remaining>1)queueEffects(s,[{...step,remaining:step.remaining-1,select:{...step.select,...(step.oneCemetery?{player:selected.player}:{})}}],source,p,frame.effectCard);
  }
  if(step.op==='draw')for(let i=0;i<(step.count==='voidMinions'?s.units.filter(u=>card(u.card).type==='Minion'&&region(s,u)==='void').length:step.count);i++)draw(s,p,step.deck);
  if(step.op==='heal')heal(s,p,step.amount);
  if(step.op==='gainMana')s.players[p].bonusMana=(s.players[p].bonusMana||0)+step.amount*(card(source.card).type==='Site'?siteMultiplier(s,source.at):1);
  if(step.op==='paySummon'&&resources(s,p).available>=step.amount){s.players[p].spent+=step.amount;queueEffects(s,[{op:'summon',slug:step.slug,count:1}],source,p,frame.effectCard);}
  if(step.op==='siteThreshold'){const site=s.board[source.at];if(site){site.bonusThreshold=Object.fromEntries(step.elements.map(e=>[e,1]));site.bonusTurn=s.turn;}}
  if(step.op==='siteDamage')for(const u of s.units)if(u.at===selected.at&&card(u.card).type==='Minion'&&(u.layer||'surface')==='surface')hurt(s,u,step.amount,false,damageKind,source);
  if(step.op==='healNearbyAvatars')for(let q=0;q<2;q++)if(nearby(source.at,avatar(s,q).at))heal(s,q,step.amount);
  if(step.op==='breakNearbyWards'){for(const u of s.units)if(nearby(source.at,u.at)&&region(s,u)==='surface')u.ward=false;for(let at=0;at<20;at++)if(s.board[at]&&nearby(source.at,at))s.board[at].ward=false;}
  if(step.op==='beaconMana')s.players[p].bonusMana=(s.players[p].bonusMana||0)+s.board.filter((site,at)=>site&&nearby(at,source.at)&&s.units.some(u=>u.controller!==p&&u.at===at&&(u.layer||'surface')==='surface')).length;
  if(step.op==='mill')for(let i=0;i<step.count;i++){const id=s.players[p].spells.shift();if(id)sendCard(s,p,id,'cemetery');}
  if(step.op==='revealEnemies')for(const u of s.units)if(u.controller!==p)u.stealth=false;
  if(step.op==='leylineDraw')for(const site of s.board.filter((v,at)=>v&&v.card===source.card&&distance(at,source.at)===1))draw(s,p,'spells');
  if(step.op==='poisonWell')loseLife(s,1-p,s.board.filter((v,at)=>v?.controller===1-p&&nearby(at,source.at)).length);
  if(step.op==='springDraw'&&s.board.filter(v=>v?.controller===p).length<s.board.filter(v=>v?.controller===1-p).length)for(let i=0;i<3;i++)draw(s,p,'atlas');
  if(step.op==='banishDeadHeal'){let n=0;for(let q=0;q<2;q++){const ids=removeGraves(s,q,id=>card(id).type==='Minion');n+=ids.length;s.players[q].banished.push(...ids);}heal(s,p,n);}
  if(step.op==='purgeCemeteries'&&s.players.reduce((n,pl)=>n+pl.cemetery.filter(id=>card(id).type==='Minion').length,0)>=3)for(let q=0;q<2;q++)s.players[q].banished.push(...removeGraves(s,q,()=>true));
  if(step.op==='lifeLoss')loseLife(s,step.opponent?1-p:p,step.amount,false,lifeCause);
  if(step.op==='powerSelf'){const u=unit(s,source.uid);if(u)u.mods.push({power:step.amount,end:s.turn});}
  if(step.op==='locationDamage')for(const u of s.units)if(occupied(u).includes(selected.at)&&(u.layer||'surface')===selected.layer&&(!step.other||u.uid!==source.uid))hurt(s,u,step.amount,false,damageKind,source);
  if(step.op==='sleepSelf'){const u=unit(s,source.uid);if(u)u.mods.push({asleep:true});}
  if(step.op==='randomMutation'){const u=unit(s,source.uid);if(u){const mutation=rollIndex(s,['Airborne','Ranged','Lethal','本回合 +3 力量']);u.mods.push(mutation===3?{power:3,end:s.turn}:{keyword:['Airborne','Ranged','Lethal'][mutation],end:s.turn});}}
  if(step.op==='tap')for(const u of entities)u.tapped=true;
  if(step.op==='safeStealth'&&!s.units.some(u=>u.controller!==p&&!u.dying&&nearby(source.at,u.at)&&region(s,source)===region(s,u))){const u=unit(s,source.uid);if(u)u.stealth=true;}
  if(step.op==='destroyRandomArtifact'&&(s.artifacts||[]).length){const o=s.artifacts[rollIndex(s,s.artifacts.map(a=>card(a.card).name))];removeObject(s,o,'cemetery');}
  if(step.op==='taxNextTurn'){if(!s.ongoingEffects)s.ongoingEffects=[];s.ongoingEffects.push({op:'tax',controller:1-p,turn:s.turn+1,end:s.turn+1});}
  if(step.op==='setMaxLife')for(const pl of s.players)pl.maxLife=pl.life;
  if(step.op==='evilLifeLoss')for(let q=0;q<2;q++)loseLife(s,q,s.units.filter(u=>u.controller===q&&card(u.card).type==='Minion'&&unitUmbrellas(u).includes('Evil')).length+s.players[q].cemetery.filter(id=>card(id).umbrellas.includes('Evil')).length,false,lifeCause);
  if(step.op==='siteLifeLoss')for(let q=0;q<2;q++)loseLife(s,q,s.board.filter((v,i)=>v?.controller===q&&nearby(i,source.at)).length,false,lifeCause);
  if(step.op==='damageSite')damageSite(s,source.at,step.amount);
  if(step.op==='wardSite'&&s.board[source.at])s.board[source.at].ward=true;
  if(step.op==='destroySelf')kill(s,unit(s,source.uid));
  if(step.op==='stealthSelf'){const u=unit(s,source.uid);if(u)u.stealth=true;}
  if(step.op==='randomTeleport'){const u=unit(s,source.uid);if(u){u.carryTeleport=true;u.at=rollIndex(s,Array.from({length:20},(_,i)=>String.fromCharCode(65+i%5)+(4-Math.floor(i/5))));u.layer='surface';}}
  if(step.op==='discard'&&selected){const pl=s.players[selected.player],h=pl.hand.find(h=>h.uid===selected.uid);if(h){pl.hand=pl.hand.filter(v=>v.uid!==h.uid);sendCard(s,selected.player,h.card,'cemetery');}}
  if(step.op==='randomDiscard'){const q=step.player??(step.opponent?1-p:p),pl=s.players[q];if(pl.hand.length){const h=pl.hand.splice(rollIndex(s,pl.hand.map(h=>card(h.card).name)),1)[0];sendCard(s,q,h.card,'cemetery');}}
  if(step.op==='ritualMana')s.players[p].bonusMana=(s.players[p].bonusMana||0)+2*s.units.filter(u=>u.controller===p&&sameLocation(s,u,source)&&(card(u.card).type==='Avatar'||keywords(u).includes('Spellcaster'))).length;
  if(step.op==='wardAllies'){const at=selected.at;for(const u of s.units)if(u.at===at&&u.controller===p&&card(u.card).type==='Minion'&&!unitUmbrellas(u).includes('Evil'))u.ward=true;}
  if(['dispelLocation','destroyLocation','returnLocation','unravelLocation','extinguish'].includes(step.op)){
    const at=selected.at,layer=selected.layer||'surface';
    if(selected.entity==='location'&&blocked(s,p,s.board[at]))return;
    for(const u of [...s.units])if(u.at===at&&card(u.card).type==='Minion'&&(selected.entity==='site'||(u.layer||'surface')===layer)){
      if(step.op==='destroyLocation'||step.op==='unravelLocation'&&unitTypes(u).includes('Undead'))kill(s,u);
      if(step.op==='returnLocation')leaveUnit(s,u,'hand');
      if(step.op==='extinguish'&&card(u.card).fire>0)kill(s,u,true);
    }
    for(const item of [...s.artifacts||[]])if(item.at===at&&(selected.entity==='site'||(item.layer||'surface')===layer)&&step.op!=='extinguish')removeObject(s,item,step.op==='returnLocation'?'hand':'cemetery');
    for(const aura of [...s.auras||[]])if(inside(aura,at)&&step.op!=='unravelLocation'&&(step.op!=='extinguish'||card(aura.card).fire>0))removeObject(s,aura,step.op==='returnLocation'?'hand':step.op==='extinguish'?'banished':'cemetery');
  }
  if(step.op==='banishWithItems')for(const u of entities){for(const a of [...s.artifacts||[]])if(a.bearer===u.uid)removeObject(s,a,'banished');kill(s,u,true);}
  if(step.op==='summon'||step.op==='festival'){
    let sites=[selected?.entity==='unit'?unit(s,selected.uid)?.at:selected?.at??source.at];
    if(step.where==='avatar')sites=[avatar(s,p).at];
    if(step.where==='adjacentSites')sites=s.board.flatMap((v,i)=>v&&distance(i,source.at)===1?[i]:[]);
    if(step.where==='nearAvatarSites')sites=s.board.flatMap((v,i)=>v&&nearby(i,avatar(s,p).at)?[i]:[]);
    if(step.where==='borderSites')sites=s.board.flatMap((v,i)=>v?.controller===p&&s.board.some((other,j)=>other?.controller===1-p&&distance(i,j)===1)?[i]:[]);
    const slugs=step.op==='festival'?['eltham_townsfolk','serava_townsfolk']:[step.slug];
    for(const at of sites)if(at!==undefined)for(const slug of slugs)for(let i=0;i<(step.count||1);i++){
      if(!canSummonEntry(s,p,card(slug),at,selected?.entity==='unit'?unit(s,selected.uid)?.layer||'surface':source.layer||'surface'))continue;const u=makeUnit(s,card(slug).id,p,at);u.layer=selected?.entity==='unit'?unit(s,selected.uid)?.layer||'surface':source.layer||'surface';
      if(step.addedDeath)u.addedDeath=structuredClone(step.addedDeath);if(step.charge)u.mods.push({keyword:'Charge',end:s.turn});summonedGenesis(s,u);
    }
  }
  if(step.op==='finishTurn'){
    for(const u of s.units)if(u.controller===p&&u.iceTurns>0)u.iceTurns--;
    for(const player of s.players)player.bonusMana=0;
    s.players[p].bonusAffinity={};
    for(const u of s.units){u.damage=0;u.lethal=false;for(const m of [...u.mods].reverse())if(m.end===s.turn&&m.returnControl!==undefined)u.controller=m.returnControl;u.mods=u.mods.filter(m=>m.end!==s.turn);}
    for(const a of [...s.artifacts||[]])if(passives[card(a.card).slug]?.afterTurnReturn)removeObject(s,a,'hand');
    s.active=1-p;s.turn++;while(s.players[s.active].skipTurns>0){s.players[s.active].skipTurns--;s.turn++;s.active=1-s.active;}s.players[s.active].turnsTaken=(s.players[s.active].turnsTaken||0)+1;s.players[s.active].spent=0;s.phase='start';advanceTruces(s);
    s.ongoingEffects=(s.ongoingEffects||[]).filter(e=>!(e.op==='witchTax'&&e.usedTurn!==undefined));for(const e of s.ongoingEffects)if(e.op==='witchTax'&&e.player===s.active&&e.startAfter<s.turn)e.usedTurn=s.turn;
    for(const gift of s.pendingMana||[])if(gift.player===s.active)s.players[s.active].bonusMana=(s.players[s.active].bonusMana||0)+gift.amount;s.pendingMana=(s.pendingMana||[]).filter(g=>g.player!==s.active);
    s.ongoingEffects=(s.ongoingEffects||[]).filter(e=>!(e.end<s.turn)&&e.until!==s.active);
    for(const site of s.board)if(site?.effects)site.effects=site.effects.filter(e=>!(e.end<s.turn)&&e.until!==s.active);
    for(const a of [...s.auras||[]])if(a.controller===p&&a.remainingTurns!==undefined&&--a.remainingTurns===0)removeObject(s,a,'cemetery');
    for(const u of s.units)u.mods=u.mods.filter(m=>m.until!==s.active);
    returnCopies(s,s.active);refreshContinuous(s);for(const u of s.units)if(u.controller===s.active)untap(s,u);
    queueEffects(s,[{op:'finishStart'}],avatar(s,s.active),s.active);
    for(const morph of s.pendingMorphs||[])if(morph.player===s.active&&morph.after<s.turn)queueEffects(s,[{op:'morphMonsterWake',morph:morph.uid}],avatar(s,s.active),s.active,card('monstermorphosis').id);
    for(const dream of s.dreams||[])if(dream.player===s.active&&dream.after<s.turn)queueEffects(s,[{op:'dreamWake',dream:dream.uid}],avatar(s,s.active),s.active,card('dream_quest').id);
    for(const a of [...s.auras||[]].reverse())if(a.controller===s.active)queueEffects(s,definitions[card(a.card).slug]?.start||[],a,s.active);
    for(const [at,site] of [...s.board.entries()].reverse())if(site?.controller===s.active)queueEffects(s,definitions[card(site.card).slug]?.start||[],{...site,at,uid:'site:'+at,layer:'surface'},s.active);
    for(const a of [...s.artifacts||[]].reverse())if(passives[card(a.card).slug]?.siteStartMana&&s.board[a.at]?.controller===s.active)queueEffects(s,[{op:'obeliskStart'}],a,s.active);
    for(const u of [...s.units].reverse())if(u.controller===s.active&&!u.silenced&&!disabled(u))queueEffects(s,definitions[card(u.card).slug]?.start||[],u,s.active);
    log(s,s.players[s.active].name+' 的回合開始。');
  }
  if(step.op==='weatherEnd'){
    const aura=(s.auras||[]).find(a=>a.uid===source.uid);if(!aura)return;
    const d=areaAuras[card(aura.card).slug];
    const pool=s.units.filter(u=>!u.dying&&(u.layer||'surface')==='surface'&&occupied(u).some(at=>inside(aura,at)&&(d.weather!=='storm'||s.board[at])));
    if(d.weather==='storm'){if(pool.length)hurt(s,pool[rollIndex(s,pool.map(u=>card(u.card).name+' @ '+u.at))],3,false,'ability',aura);}
    else for(const u of pool)hurt(s,u,3,false,'ability',aura);
    queueEffects(s,[{op:'weatherMove'}],aura,aura.controller,aura.card);return;
  }
  if(step.op==='weatherMove'){
    const aura=(s.auras||[]).find(a=>a.uid===source.uid);if(!aura)return;
    const fire=areaAuras[card(aura.card).slug].weather==='fire',visited=aura.visited||[aura.at];
    const destinations=Array.from({length:20},(_,at)=>at).filter(at=>distance(at,aura.at)===1&&(fire?!visited.includes(at):area(at).length));
    if(!destinations.length){if(fire)removeObject(s,aura,'cemetery');return;}
    if(selected===undefined){s.choice={player:aura.controller,title:card(aura.card).name+' · '+(fire?'移往未經過的位置':'可移動一步'),options:[...destinations.map(at=>({label:String.fromCharCode(65+at%5)+(4-Math.floor(at/5)),value:at})),...(!fire?[{label:'留在原處',value:null}]:[])],frame:{...frame,step:{...step,may:!fire}}};return;}
    if(selected===null){assert(!fire,'Wildfire 必須移動');return;}
    assert(destinations.includes(selected),'光環移動位置已失效');aura.at=selected;if(fire)aura.visited=[...visited,selected];return;
  }
  if(step.op==='finishStart')s.phase='draw';
  if(step.op==='projectile'){
    if(!selected){s.choice={player:p,title:'選擇投射物方向',options:['北','東','南','西'].map((label,i)=>({label,value:i+1})),frame};return;}
    if(step.fiftySpear){queueEffects(s,[{op:'fiftyBoltTravel',kind:'spear',at:source.at,layer:source.layer||'surface',origin:true,direction:selected-1,amount:3,remaining:20,trail:[],hits:[],object:source.throwObject}],source,p,frame.effectCard);return;}
    if(step.diagramCone){queueEffects(s,[{op:'gridBlast',pattern:'cone',direction:selected-1}],source,p,frame.effectCard);return;}
    queueEffects(s,Array.from({length:step.count||1},()=>({op:'shot',at:source.at,layer:source.layer||'surface',origin:true,direction:selected-1,amount:step.amount,remaining:step.range??20,piercing:!!step.piercing,decay:step.decay||0,splash:step.splash||0,onePerLocation:!!step.onePerLocation,optionalHit:!!step.optionalHit,hook:!!step.hook,holyWater:!!step.holyWater,trail:[]})),source,p,frame.effectCard);
  }
  if(step.op==='shot'){
    const hit=s.units.filter(u=>!u.dying&&(!u.stealth||unit(s,source.uid)?.canSeeStealth)&&(!u.projectileOver||disabled(u))&&occupied(u).includes(step.at)&&(u.layer||'surface')===step.layer&&(!step.origin||u.controller!==p));
    const {x,y}=position(step.at),dx=[0,1,0,-1][step.direction],dy=[-1,0,1,0][step.direction],next=(y+dy)*5+x+dx;
    const blockedEntry=s.board[next]&&passives[card(s.board[next].card).slug]?.projectileBarrierAll||s.units.some(u=>u.at===next&&(u.layer||'surface')===step.layer&&u.controller!==p&&!u.dying&&!u.silenced&&!disabled(u)&&passives[card(u.card).slug]?.projectileBarrier);
    const nextValid=x+dx>=0&&x+dx<5&&y+dy>=0&&y+dy<4&&step.remaining>0&&!blockedEntry&&region(s,{at:next,layer:step.layer})===region(s,{at:step.at,layer:step.layer});
    if((!hit.length||step.piercing)&&nextValid)queueEffects(s,[{...step,at:next,origin:false,trail:[...(step.trail||[]),step.at],remaining:step.remaining-1,amount:step.amount-(step.decay||0)}],source,p,frame.effectCard);
    if(step.holyWater&&hit.length){queueEffects(s,[{op:'holyWaterHit',untargeted:true,...(hit.length===1?{uid:hit[0].uid}:{select:{kind:'unit',uids:hit.map(u=>u.uid),untargeted:true,anyRegion:true}})}],source,p,frame.effectCard);return;}
    if(step.hook&&hit.length){queueEffects(s,[{op:'hookHit',hitAt:step.at,trail:step.trail,untargeted:true,select:{kind:'unit',uids:hit.map(u=>u.uid),untargeted:true,anyRegion:true}}],source,p);return;}
    if(hit.length&&(step.onePerLocation||step.splash)){
      queueEffects(s,[{op:'projectileImpact',amount:step.amount,splash:step.splash||0,at:step.at,layer:step.layer,optional:!!step.optionalHit,untargeted:true,select:{kind:'unit',uids:hit.map(u=>u.uid),untargeted:true,anyRegion:true}}],source,p,frame.effectCard);
    }
    else if(step.piercing)for(const target of hit)hurt(s,target,step.amount,false,damageKind,source);
    else if(hit.length===1){if(step.ranged)strike(s,source,hit[0],step.amount,true);else hurt(s,hit[0],step.amount,false,damageKind,source);}
    else if(hit.length>1)queueEffects(s,[{op:step.ranged?'rangedHit':'damage',amount:step.amount,untargeted:true,select:{kind:'unit',uids:hit.map(u=>u.uid),untargeted:true,anyRegion:true}}],source,p,frame.effectCard);
  }
  if(step.op==='projectileImpact'){
    const target=unit(s,selected?.uid);if(!target||target.dying)return;
    // Snapshot the entire impact before state-based deaths are checked.
    const victims=s.units.filter(u=>!u.dying&&occupied(u).includes(step.at)&&(u.layer||'surface')===step.layer);
    for(const u of victims)if(u.uid===target.uid||step.splash)hurt(s,u,u.uid===target.uid?step.amount:step.splash,false,damageKind,source);
  }
}
function effectAvailable(s,f){
  if(f.step.op==='hookFight'){const source=unit(s,f.source.uid),target=unit(s,f.step.target);return !!source&&!!target&&!source.dying&&!target.dying&&sameLocation(s,source,target);}
  if(['paySummon','payLance'].includes(f.step.op))return resources(s,f.controller).available>=f.step.amount;
  if(['burrowSelf','submergeHere'].includes(f.step.op)){const u=unit(s,f.source.uid);return !!u&&(u.layer||'surface')==='surface'&&!!s.board[u.at]&&(f.step.op==='submergeHere'?waterSite(s,u.at,card):!waterSite(s,u.at,card));}
  return true;
}
const effectTitles={morriganDamage:'Ring of Morrigan : '+String.fromCharCode(21487,36896,25104,49,40670,20663,23475,20006,22238,24489,49,29983,21629),projectileImpact:'選擇命中單位',lureStep:'選擇受引誘的敵方僕從',hookHit:'選擇鉤索命中單位',hookFight:'是否與被拖回的單位戰鬥',swallow:'選擇吞入腹中的僕從',chainResolve:'選擇第一個連鎖目標',gridBlast:'選擇範圍中心',maelstromPlan:'是否拉入水域內所有僕從'};
Object.assign(effectTitles,{reactionHero:'可將受攻擊的較弱友軍返回擁有者手牌',reactionPeace:'可贈與對方，換取其下回合休戰'});
const effectAPI={select:selectEffects,resolve:resolveRandomAware,check:s=>{stateBased(s);delete s.eventContext;},title:frame=>card(frame.effectCard).name+' · '+(effectTitles[frame.step.op]||frame.step.op),available:effectAvailable};
function summonGraveAt(s,grave,controller,at,layer){
  if(!canSummonEntry(s,controller,card(grave.card),at,layer||'surface'))return null;
  const pl=s.players[grave.player];assert(pl.cemetery[grave.index]===grave.card,'墓地選擇已失效');takeGrave(s,grave.player,grave.index,grave.card,grave.uid);
  if(!paySummoningTax(s,grave.card,grave.player,controller))return null;
  const u=makeUnit(s,grave.card,grave.player,at);u.controller=controller;u.layer=layer||'surface';summonedGenesis(s,u);return u;
}
function summonedGenesis(s,u){
  if(deferCopyEntry(s,u,fiftyAPI))return;
  const summoner=u.controller;
  refreshContinuous(s);
  for(const at of occupied(u)){const site=s.board[at];if(site?.controller===summoner&&!site.silenced&&sitePassives[card(site.card).slug]?.summonKillWeakBeast)queueEffects(s,[{op:'destroy',select:{kind:'unit',minion:true,enemy:true,types:['Beast'],maxPower:2,nearby:true,siteBothLayers:true}}],{...site,at,uid:'site:'+at,layer:'surface'},summoner);}
  for(const a of [...s.auras||[]]){const d=areaAuras[card(a.card).slug];if(d?.returnOnSummon&&a.controller===summoner&&occupied(u).some(at=>inside(a,at))&&matches(card(u.card),d)){u.mods.push({keyword:'Charge'});removeObject(s,a,'hand');}}
  if(card(u.card).slug==='king_arthur'||[...unitTypes(u),...unitUmbrellas(u)].some(t=>['Knight','Sir','Dame'].includes(t)))for(const a of s.artifacts)if(artifactController(s,a)===summoner&&passives[card(a.card).slug]?.knightSummonDraw&&sameLocation(s,u,a))queueEffects(s,[{op:'drawCards',count:1}],a,summoner);
  refreshContinuous(s);if(u.silenced){u.ward=false;u.stealth=false;return;}
  const c=card(u.card);if(c.handler==='drawSpell')draw(s,u.controller,'spells');const saintweald=occupied(u).some(at=>s.board[at]&&sitePassives[card(s.board[at].card).slug]?.deathAlsoGenesis);queueEffects(s,[...definitions[c.slug]?.genesis||[],...(saintweald?definitions[c.slug]?.death||[]:[])],u,u.controller);
}
export function summoningTax(s,c){return s.board.reduce((n,site)=>n+(site&&!site.silenced&&!site.disabled?sitePassives[card(site.card).slug]?.minionTax?.[c.rarity||c.slot]||0:0),0);}
function paySummoningTax(s,id,owner,controller){
  const amount=summoningTax(s,card(id));
  if(resources(s,controller).available<amount){s.players[owner].banished.push(id);log(s,card(id).name+' 無法支付額外召喚費用，被放逐。');return false;}
  s.players[controller].spent+=amount;return true;
}
function searchSummonEntries(s,p,zone,filter){
  const entries=zone==='cemetery'?graveEntries(s,p):s.players[p][zone].map((entry,index)=>({entity:zone==='hand'?'hand':'deck',player:p,index,card:zone==='hand'?entry.card:entry,...(zone==='hand'?{uid:entry.uid}:{})}));
  return entries.filter(entry=>{const c=card(entry.card);return c.playable&&c.type==='Minion'&&(!filter.slug||c.slug===filter.slug)&&(!filter.types||filter.types.some(t=>c.subtypes.includes(t)||filter.includeUmbrellas&&c.umbrellas.includes(t)))&&(!filter.keyword||printedKeywords(c).includes(filter.keyword))&&(filter.maxCost===undefined||c.cost<=filter.maxCost);}).map(entry=>({label:card(entry.card).name,value:entry}));
}
function removeObject(s,object,zone){
  if(object.tokenCopy)zone='banished';
  if(![...s.artifacts||[],...s.auras||[]].some(o=>o.uid===object.uid))return;
  for(const h of s.boundSpells||[])if(h.unit===object.uid)sendCard(s,h.owner,h.card,'cemetery');
  s.boundSpells=(s.boundSpells||[]).filter(h=>h.unit!==object.uid);
  if(card(object.card).category==='Token')zone='banished';
  if(zone==='hand')s.players[object.owner].hand.push({uid:'h'+s.next++,card:object.originalCard||object.baseCard||object.card});else sendCard(s,object.owner,object.originalCard||object.baseCard||object.card,zone);
  s.artifacts=(s.artifacts||[]).filter(a=>a.uid!==object.uid);s.auras=(s.auras||[]).filter(a=>a.uid!==object.uid);
}
function destroySite(s,at,sacrifice=false){
  const site=s.board[at];if(!site)return;
  if(card(site.card).slug==='rubble')return;
  if(!sacrifice&&(passives[card(site.card).slug]?.immutableSite||site.completionProtected))return;
  if(!sacrifice&&s.units.some(u=>!u.dying&&!u.silenced&&!disabled(u)&&passives[card(u.card).slug]?.fiftySiteProtection&&u.controller!==(s.eventContext?.controller??s.active)&&nearby(u.at,at)))return;
  if(!sacrifice&&site.ward){site.ward=false;return;}
  if(passives[card(site.card).slug]?.fiftyRoots)eventTrigger(s,{...site,at,uid:site.uid||'site:'+at},[{op:'fiftyArmageddon'}]);
  if(site.owner===0||site.owner===1)sendCard(s,site.owner,site.originalCard||site.baseCard||site.card,card(site.card).category==='Token'?'banished':'cemetery');
  s.board[at]={uid:'s'+s.next++,card:card('rubble').id,controller:null,owner:null,ward:false};
}
function damageSite(s,at,amount,cause=null){if(cause&&!cause.silenced&&!disabled(cause)&&passives[card(cause.card).slug]?.fiftyDestroyStruck)eventTrigger(s,cause,[{op:'fiftyLordStrike',at}]);const site=s.board[at];if(!site||amount<=0||site.controller!==0&&site.controller!==1)return;if(site.ward){site.ward=false;return;}const threshold=sitePassives[card(site.card).slug]?.destroyWhenDamagedThreshold,breaks=threshold&&resources(s,site.controller)[threshold]>=1;loseLife(s,site.controller,amount,false,cause);if(breaks)destroySite(s,at);}
function commitSiteCard(s,a,copyId=null){
  const p=a.player,pl=s.players[p],h=pl.hand.find(h=>h.uid===a.hand);assert(h,'Site card is no longer in hand');const original=s.board[a.at],c=card(h.card);let controller=p;
  if(original&&passives[c.slug]?.fiftyMirage&&original.owner===p&&original.controller===p)pl.hand.push({uid:'h'+s.next++,card:original.originalCard||original.baseCard||original.card});
  if(original&&passives[c.slug]?.fiftyHeirloom&&['Elite','Unique'].includes(card(original.card).rarity)){controller=original.controller;if(original.owner===0||original.owner===1)s.players[original.owner].banished.push(original.originalCard||original.card);}
  avatar(s,p).tapped=true;pl.hand=pl.hand.filter(v=>v.uid!==a.hand);enterSite(s,controller,copyId||h.card,a.at);s.board[a.at].owner=p;if(!avatar(s,p).silenced&&passives[card(avatar(s,p).card).slug]?.completionDruid&&s.players[p].turnsTaken===1)queueEffects(s,[{op:'completionDruidTawny'}],avatar(s,p),p);if(copyId)s.board[a.at].originalCard=h.card;
}
function enterSite(s,p,id,at,geomancerPrimary=true){
  s.board[at]={uid:'s'+s.next++,stamp:s.next-1,card:id,controller:p,owner:p,born:s.turn,ward:!!sitePassives[card(id).slug]?.ward};log(s,s.players[p].name+' 放置 '+card(id).name+'。');
  if(siteAffinity(s,at,card).earth>0){queueGraveReturns(s,p,'bone_rabble',at);if(geomancerPrimary&&passives[card(avatar(s,p).card).slug]?.earthPlayRubble)queueEffects(s,[{op:'geomancerRubble',select:{kind:'location',adjacent:true,voidOnly:true}}],avatar(s,p),p);}
  refreshContinuous(s);if(!s.board[at].silenced&&!s.board[at].disabled)queueEffects(s,definitions[card(s.board[at].card).slug]?.genesis||[],{...s.board[at],at,uid:s.board[at].uid||'site:'+at,layer:'surface'},p);
  refreshContinuous(s);
  for(const [i,site] of s.board.entries())if(site&&i!==at&&!site.silenced&&!site.disabled){const d=passives[card(site.card).slug];if(d?.nearbyPlayedLifeLoss&&nearby(i,at)||d?.adjacentPlayedSkeleton&&distance(i,at)===1)queueEffects(s,[{op:'playedSiteReaction',player:p,at,loss:d.nearbyPlayedLifeLoss&&nearby(i,at)?d.nearbyPlayedLifeLoss:0,skeleton:!!(d.adjacentPlayedSkeleton&&distance(i,at)===1)}],{...site,at:i,uid:'site:'+i,layer:'surface'},site.controller);}
  if(card(id).handler==='towerMana'&&s.board.filter(v=>v?.controller===p&&v.card===id).length===1)s.players[p].bonusMana=(s.players[p].bonusMana||0)+siteMultiplier(s,at);
}
export function siteTargets(s,p,c=null) {
  if(c&&passives[c.slug]?.fiftyMirage)return [...new Set([...siteTargets(s,p),...s.board.flatMap((site,at)=>site?.owner===p&&site.controller===p?[at]:[])])];
  if(c&&passives[c.slug]?.fiftyHeirloom)return [...new Set([...siteTargets(s,p),...s.board.flatMap((site,at)=>site&&['Elite','Unique'].includes(card(site.card).rarity)?[at]:[])])];
  const own=s.board.map((v,i)=>v?.controller===p?i:-1).filter(i=>i>=0);
  const empty=s.board.map((v,i)=>(!v||card(v.card).slug==='rubble')&&!(s.auras||[]).some(a=>!a.silenced&&!a.disabled&&areaAuras[card(a.card).slug]?.forbidSitePlay&&inside(a,i))?i:-1).filter(i=>i>=0);
  if(own.length)return empty.filter(n=>own.some(i=>distance(n,i)===1)||c&&passives[c.slug]?.cornerSite&&[0,4,15,19].includes(n));
  const at=avatar(s,p).at,min=Math.min(...empty.map(n=>distance(n,at)));return empty.filter(n=>distance(n,at)===min||c&&passives[c.slug]?.cornerSite&&[0,4,15,19].includes(n));
}
function warrensProtected(s,u,p){return u&&u.controller!==p&&unitTypes(u).includes('Beast')&&occupied(u).some(at=>{const site=s.board[at];return site&&!site.silenced&&!site.disabled&&sitePassives[card(site.card).slug]?.protectBeasts;});}
export function canTarget(s,p,u,source=null,effectCard=null) {const origin=effectCard?card(effectCard):source?card(source.card):null;if(warrensProtected(s,u,p))return false;return u&&(!origin||origin.rarity!=='Ordinary'||u.silenced||disabled(u)||!passives[card(u.card).slug]?.immuneOrdinary)&&(u.controller===p||!u.stealth||source?.canSeeStealth&&!disabled(source)); }
function casters(s,p,spell) { const d=spell?definitions[spell.slug]:null;return [...s.units.filter(u=>!u.dying&&u.controller===p&&!disabled(u)&&!u.silenced&&(card(u.card).type==='Avatar'||keywords(u).includes('Spellcaster')||d?.casters==='any'||d?.casterTypes?.some(t=>unitTypes(u).includes(t)))),...(s.artifacts||[]).filter(o=>artifactController(s,o)===p&&!o.silenced&&!o.disabled&&(passives[card(o.card).slug]?.spellElements||passives[card(o.card).slug]?.artifactSpellcaster)),...s.board.flatMap((site,at)=>site?.controller===p&&!site.silenced&&!site.disabled&&(sitePassives[card(site.card).slug]?.siteSpellElements||site.towerMagicTurn===s.turn&&spell?.type==='Magic')?['surface','below'].map(layer=>spellcaster(s,'site:'+at,layer)):[])]; }
function spellTargets(s,p,c,caster) {
  const h=c.handler; const units=s.units.filter(u=>canTarget(s,p,u,caster,c.id)&&!u.iceMagicProtection&&(!u.magicProtected||disabled(u)));
  const minions=units.filter(u=>card(u.card).type==='Minion');
  const friends=units.filter(u=>u.controller===p);
  if(['heal','mortals','tithe','rain','intervention','vanishment','lifewish'].includes(h))return [null];
  if(h==='searchOrdinary')return s.players[p].spells.filter(id=>card(id).slot==='Ordinary').filter((id,i,a)=>a.indexOf(id)===i);
  if(h==='rescue')return [...new Set(s.players[p].cemetery.filter(id=>card(id).type==='Minion'))];
  if(h==='teleport')return friends.flatMap(u=>s.board.flatMap((v,i)=>v&&canEnterOnGround(s,u,u,{at:i,layer:'surface'},card,keywords,true)?[{unit:u.uid,at:i}]:[]));
  if(h==='lightning')return s.board.flatMap((v,i)=>s.units.some(u=>u.at===i)?[i]:[]);
  if(['explosion','mortality','exorcism'].includes(h))return Array.from({length:20},(_,i)=>i).filter(i=>distance(caster.at,i)<=2);
  if(h==='begone')return minions.filter(u=>unitUmbrellas(u).includes('Evil')).map(u=>u.uid);
  if(h==='mesmerism')return minions.filter(u=>nearby(caster.at,u.at)).map(u=>u.uid);
  if(h==='betrayal')return minions.filter(u=>u.controller!==p).map(u=>u.uid);
  if(h==='exile')return minions.filter(u=>s.board[u.at]?.controller===p).map(u=>u.uid);
  if(h==='necropotence')return friends.filter(u=>unitTypes(u).includes('Undead')&&nearby(caster.at,u.at)).map(u=>u.uid);
  if(h==='flight')return friends.filter(u=>card(u.card).type==='Minion').map(u=>u.uid);
  if(h==='zap')return units.map(u=>u.uid);
  if(h==='arc')return units.filter(u=>nearby(caster.at,u.at)).map(u=>u.uid);
  if(h==='immolation')return minions.filter(u=>nearby(caster.at,u.at)&&region(s,u)===region(s,caster)).map(u=>u.uid);
  if(h==='fatality')return minions.filter(u=>u.damage>0).map(u=>u.uid);
  if(['freeze','shrink'].includes(h))return (h==='freeze'?minions:units).filter(u=>nearby(caster.at,u.at)).map(u=>u.uid);
  if(['wolf','serpent'].includes(h))return friends.filter(u=>card(u.card).type==='Minion').map(u=>u.uid);
  if(['power2','power6','charge','invigorate'].includes(h))return friends.map(u=>u.uid);
  return [];
}
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function castingCost(s,p,c,at,caster=null,payment=null,extraMana=0,layer='surface',origin=null){
  const d=passives[c.slug],a=s.players[p].life,b=s.players[1-p].life;
  const tax=(s.ongoingEffects||[]).filter(e=>e.op==='tax'&&e.controller===p&&e.turn===s.turn||e.op==='witchTax'&&e.player===p&&e.usedTurn===s.turn).length;
  const rarity=c.rarity||c.slot,courtTax=s.board.reduce((n,site)=>{const d=site&&!site.silenced&&!site.disabled?sitePassives[card(site.card).slug]:null;return n+(d?.spellTax?.[rarity]||0);},0),summonTax=c.type==='Minion'?summoningTax(s,c):0;
  const free=!!dragonGift(s,p,c,at,layer)||d?.freeAfterMortalDeath&&(s.deathHistory||[]).some(v=>v.turn===s.turn&&v.controller===p&&unitTypes(v).includes('Mortal'));
  const waterDiscount=d?.waterEnemyDiscount&&at!==undefined?s.units.filter(u=>u.controller!==p&&!u.dying&&bodyOfWater(s,at,card).has(u.at)).length*d.waterEnemyDiscount:0;
  const cells=at===undefined?[]:occupied({at,size:c.slug==='mountain_giant'?2:1});let siteDiscount=nextSiteCast(s,c,at)?1:0;
  const av=avatar(s,p);if(isKnightSpell(c)&&s.players[p].knightCastTurn!==s.turn&&av&&!av.silenced&&!disabled(av))siteDiscount+=passives[card(av.card).slug]?.firstKnightDiscount||0;
  if(c.type==='Minion')for(const [position,site] of s.board.entries())if(site){const rule=sitePassives[card(site.card).slug],discount=rule?.nearbyMinionDiscount||(cells.includes(position)?rule?.minionDiscount:null);if(discount&&(!discount.rarity||rarity===discount.rarity)&&(!discount.type||c.subtypes.includes(discount.type))&&(!rule.nearbyMinionDiscount||cells.some(at=>nearby(at,position))))siteDiscount+=discount.amount;}
  if(c.type==='Artifact'&&s.board[at]){const d=sitePassives[card(s.board[at].card).slug];if(d?.openArtifactTypes?.some(t=>c.subtypes.includes(t)))siteDiscount+=d.artifactDiscount||0;}
  if(typeof caster==='string')caster=spellcaster(s,caster);const firstElement=caster&&elements.some(e=>hasElement(c,e)&&(caster.spellCastTurn!==s.turn||!caster.castElements?.includes(e))),stoneDiscount=firstElement?(s.artifacts||[]).filter(o=>o.bearer===caster.uid).reduce((n,o)=>n+(passives[card(o.card).slug]?.firstElementDiscount||0),0):0;
  const bellTax=caster&&!free&&payment!=='randomDiscard'?(s.artifacts||[]).filter(o=>!o.silenced&&!o.disabled&&region(s,o)===region(s,caster)&&occupied(caster).some(at=>nearby(o.at,at))).reduce((n,o)=>n+(passives[card(o.card).slug]?.nearbyCasterTax||0),0):0;
  const adjacentDiscount=(d?.adjacentUnitDiscount&&at!==undefined?s.units.filter(u=>!u.dying&&occupied(u).some(cell=>nearby(cell,at))).length*d.adjacentUnitDiscount:0)+(origin?.top?.kind==='cradle'&&payment!=='vermis'?1:0)+(c.type==='Magic'&&caster&&card(caster.card).type==='Site'&&s.board[caster.at]?.towerMagicTurn===s.turn&&!s.board[caster.at].towerMagicUsed?3:0);
  return summonTax+(free||payment==='randomDiscard'?0:Math.max(0,(payment==='vermis'?5:d?.lifeDifferenceCost?Math.abs(a-b):c.cost||0)+extraMana+tax+courtTax+bellTax-waterDiscount-siteDiscount-stoneDiscount-adjacentDiscount-(payment==='harbinger'?1:0)-casterGiftDiscount(s,caster,c)-((d?.lifeDiscount==='more'&&a>b||d?.lifeDiscount==='less'&&a<b)?d.discount:0)));
}
function casterGiftDiscount(s,u,c){return u?((u.elementGiftTurn===s.turn&&elements.some(e=>hasElement(c,e))?4*(u.elementGiftCount||0):0)+(u.elementGifts||[]).filter(g=>g.turn===s.turn&&hasElement(c,g.element)).reduce((n,g)=>n+g.amount,0)):0;}
function ignoresThreshold(s,u,c){return u&&(u.ignoreThresholdTurn===s.turn||casterGiftDiscount(s,u,c)>0);}
function castBudget(s,p){const pl=s.players[p];return pl.bloodManaTurn===s.turn?(pl.doorTurn===null?pl.life:-1):Math.max(0,resources(s,p).available);}
function canPaySpell(s,p,c,at,caster,payment,extraMana=0,layer='surface',origin=null){if((s.ongoingEffects||[]).some(e=>e.op==='forbidSpellName'&&e.name===c.name))return false;const total=castingCost(s,p,c,at,caster,payment,extraMana,layer,origin),summon=c.type==='Minion'?summoningTax(s,c):0;return s.players[p].bloodManaTurn===s.turn?total-summon<=castBudget(s,p)&&summon<=resources(s,p).available:total<=castBudget(s,p);}
function dragonGift(s,p,c,at,layer='surface'){return c.type==='Minion'&&c.subtypes.includes('Dragon')&&(s.ongoingEffects||[]).find(e=>e.op==='freeDragon'&&e.controller===p&&e.end===s.turn&&e.at===at&&e.layer===layer);}
function vermisCaster(s,u){return u&&['Minion','Avatar'].includes(card(u.card).type)&&(card(u.card).type==='Avatar'||keywords(u).includes('Spellcaster'))&&s.artifacts.some(a=>a.bearer===u.uid&&!a.silenced&&!a.disabled&&passives[card(a.card).slug]?.fixedMinionCost===5);}
function exchangeSites(s,a,b){const site=s.board[a],target=s.board[b];if(!site||!target||passives[card(site.card).slug]?.immutableSite||site.completionProtected||target.completionProtected||passives[card(target.card).slug]?.immutableSite)return;[s.board[a],s.board[b]]=[target,site];for(const u of s.units)if(u.size!==2&&(u.at===a||u.at===b)){u.at=u.at===a?b:a;u.observedPosition={at:u.at,layer:u.layer||'surface',cells:occupied(u)};}for(const o of s.artifacts)if(o.at===a||o.at===b)o.at=o.at===a?b:a;for(const o of s.auras)if(o.singleSite&&(o.at===a||o.at===b))o.at=o.at===a?b:a;}
function isKnightSpell(c){return [...c.subtypes,...c.umbrellas].some(t=>['Knight','Sir','Dame'].includes(t))||/^(Sir|Dame) /.test(c.name);}
function nextSiteCast(s,c,at){const site=s.board[at],rule=site&&!site.silenced?sitePassives[card(site.card).slug]:null;return site?.nextCastTurn===s.turn&&(rule?.nextCastType&&c.subtypes.includes(rule.nextCastType)||rule?.nextCastUmbrella&&c.umbrellas.includes(rule.nextCastUmbrella));}
function riverNetwork(s,root){const found=new Set([root]),queue=[root];for(let i=0;i<queue.length;i++)for(let at=0;at<20;at++)if(!found.has(at)&&distance(queue[i],at)===1&&s.board[at]&&/river/i.test(card(s.board[at].card).name)){found.add(at);queue.push(at);}return found;}
function emptySite(s,at){return !!s.board[at]&&!s.units.some(u=>occupied(u).includes(at))&&!(s.artifacts||[]).some(a=>a.at===at)&&!(s.auras||[]).some(a=>inside(a,at));}
function siteTargetsForFrontier(s,u){return s.board.flatMap((site,at)=>distance(at,u.at)===1&&(!site||card(site.card).slug==='rubble')?[at]:[]);}
function canSummonAt(s,p,c,at,permission=false){
  if(permission)return true;
  const site=s.board[at],d=passives[c.slug]||{};if(d.castCornerVoid)return !site&&[0,4,15,19].includes(at);if(d.mustWaterSite)return !!site&&waterSite(s,at,card);if(!site)return printedKeywords(c).includes('Voidwalk');if(s.players[p].sporeCastTurn===s.turn&&(c.attack||0)<=2)return true;
  const enemies=s.units.some(u=>u.controller!==p&&!u.dying&&u.at===at);
  if(d.outerColumn&&at%5!==0&&at%5!==4)return false;
  if(d.cornerOnly&&![0,4,15,19].includes(at))return false;
  if(d.needEnemySite&&(site.controller!==p||!enemies))return false;
  if(s.units.some(u=>!u.dying&&!u.silenced&&!disabled(u)&&u.controller===p&&occupied(u).includes(at)&&passives[card(u.card).slug]?.castMinionsHere))return true;
  const betray=sitePassives[card(site.card).slug]?.enemyStealthCastThreshold;if(site.controller===1-p&&betray&&resources(s,site.controller)[betray]>=1)return true;
  return site.controller===p||sitePassives[card(site.card).slug]?.openMinionCasting||sitePassives[card(site.card).slug]?.openMinionTypes?.some(t=>[...c.subtypes,...c.umbrellas].includes(t))||d.castAnySite||d.castEliteSite&&['Elite','Unique'].includes(card(site.card).slot)||d.castClearSite&&!enemies||(s.auras||[]).some(a=>{const aura=areaAuras[card(a.card).slug];return a.controller===p&&aura?.summon&&inside(a,at)&&matches(c,aura);});
}
function summonKeywords(s,c,at){return [...printedKeywords(c),...(s.board.some(site=>site&&!site.silenced&&!site.disabled&&sitePassives[card(site.card).slug]?.allBurrowingThreshold&&resources(s,site.controller).earth>=3)?['Burrowing']:[]),...(c.umbrellas.includes('Evil')&&s.board.some((site,i)=>site&&sitePassives[card(site.card).slug]?.nearbyEvilBurrowing&&nearby(i,at))?['Burrowing']:[])];}
function protectedAttackSite(s,at){return !!s.board[at]&&(protectedByHart(s,{at,layer:'surface'})||sitePassives[card(s.board[at].card).slug]?.noAttackingHere||(s.auras||[]).some(a=>areaAuras[card(a.card).slug]?.noAttacks&&inside(a,at)));}
function protectedByHart(s,target){return s.units.some(h=>h.uid!==target.uid&&!h.dying&&!h.silenced&&!disabled(h)&&passives[card(h.card).slug]?.protectNearbyAttacks&&occupied(h).some(a=>occupied(target).some(b=>nearby(a,b)))&&region(s,h)===region(s,target));}
function auraProtectedUnit(s,u){return (u.layer||'surface')==='surface'&&occupied(u).some(at=>s.board[at]&&(s.auras||[]).some(a=>areaAuras[card(a.card).slug]?.noAttacks&&inside(a,at)));}
function protectedAttackUnit(s,u){return card(u.card).type==='Minion'&&protectedByHart(s,u)||auraProtectedUnit(s,u)||card(u.card).type==='Minion'&&occupied(u).some(at=>s.board[at]&&sitePassives[card(s.board[at].card).slug]?.noAttackingHere);}
function canSummonEntry(s,p,c,at,layer){const u={uid:'summon-preview',card:c.id,controller:p,at:-1,mods:[]};return occupied({at,size:c.slug==='mountain_giant'?2:1}).every(cell=>!s.board.some((site,i)=>site&&!site.silenced&&sitePassives[card(site.card).slug]?.noSummonHereOrFront&&(i===cell||i+(site.controller===0?-5:5)===cell))&&canEnterOnGround(s,u,{at:-1,layer:'surface'},{at:cell,layer},card,keywords,true));}
export function legalActions(s,p=s.active) {
  if(s.winner!==null)return [];
  if(s.choice)return p===s.choice.player?s.choice.options.map((_,option)=>({type:'choose',player:p,option})):[];
  if(s.phase==='mulligan')return p===s.mulligan?[{type:'mulligan',player:p,cards:[]}]:[];
  if(s.phase==='draw')return p===s.active?['spells','atlas'].map(deck=>({type:'draw',player:p,deck})):[];
  if(s.pending) {
    if(p!==s.pending.player)return [];
    const actions=[{type:'pass',player:p}]; const actual=unit(s,s.pending.attacker);const a=actual?{...actual,at:s.pending.combatAt??actual.at,size:1}:null;
    if(!a||s.pending.kind==='attack'&&(s.pending.noDefend||sphereAt(s,unit(s,s.pending.target),card))||s.pending.kind==='intercept'&&auraProtectedUnit(s,actual))return actions;
    for(const u of s.units)if(u.controller===p&&ready(s,u)&&(!s.pending.stealth||u.canSeeStealth)&&(!passives[card(u.card).slug]?.cannotDefend||u.silenced)&&u.uid!==s.pending.target&&locations(s,u,card,keywords).some(v=>occupied({...u,at:v.at}).includes(a.at)&&v.layer===(a.layer||'surface'))) {
      if((card(u.card).slug==='skeleton'||passives[card(u.card).slug]?.noMoveDefend)&&!sameLocation(s,u,a))continue;
      if(s.pending.kind==='intercept'&&(u.at!==a.at||(keywords(a).includes('Airborne')&&!keywords(u).includes('Airborne'))))continue;
      const defendAt=u.size===2?locations(s,u,card,keywords).find(v=>occupied({...u,at:v.at}).includes(a.at)&&v.layer===(a.layer||'surface')).at:undefined;actions.push({type:'defend',player:p,unit:u.uid,keep:false,...(u.size===2?{defendAt}:{})});
      if(s.pending.kind==='attack'&&unit(s,s.pending.target))actions.push({type:'defend',player:p,unit:u.uid,keep:true,...(u.size===2?{defendAt}:{})});
    }
    return actions;
  }
  if(p!==s.active||s.phase!=='main')return [];
  const result=[{type:'end',player:p},{type:'concede',player:p},...handTransformActions(s,p,fiftyAPI)];
  const av=avatar(s,p),r=resources(s,p);
  for(const a of s.artifacts||[])if(artifactController(s,a)===p)for(const [index,ability] of (definitions[card(a.card).slug]?.activated||[]).entries()){
    if(ability.bearerSource&&(!unit(s,a.bearer)||disabled(unit(s,a.bearer))))continue;
    if(ability.bearerTap&&(!unit(s,a.bearer)||!ready(s,unit(s,a.bearer))))continue;
    if(ability.requiresSpellcaster&&(!unit(s,a.bearer)||card(unit(s,a.bearer).card).type!=='Avatar'&&!keywords(unit(s,a.bearer)).includes('Spellcaster')))continue;
    if(ability.steps[0].op==='bearerDamage'&&(!unit(s,a.bearer)||disabled(unit(s,a.bearer))))continue;
    if(ability.crew&&(!unit(s,a.bearer)||!ready(s,unit(s,a.bearer))||!siegeCrew(s,a,p).length||ability.discardPayload&&!s.players[p].hand.length))continue;
    const first=ability.steps[0],abilitySource=ability.bearerSource||ability.bearerTap?unit(s,a.bearer):a,useKey=ability.bearerOnce?a.bearer+':'+index:index;if(collectionAbilityAvailable(s,p,abilitySource,first,fiftyAPI)&&(!ability.once||a.usedAbilities?.[useKey]!==s.turn)&&(!first.select||selectEffects(s,{source:abilitySource,controller:p},first.select).length))result.push({type:'activateArtifact',player:p,object:a.uid,index});
  }
  for(const [at,site] of s.board.entries())if(site)for(const [index,ability] of (definitions[card(site.card).slug]?.activated||[]).entries()){if(site.controller!==p&&!ability.anyPlayer)continue;
    const source={...site,at,uid:'site:'+at,layer:'surface'},first=ability.steps[0];
    if(morphAbilityAvailable(s,p,source,first,fiftyAPI)&&collectionAbilityAvailable(s,p,source,first,fiftyAPI)&&(!ability.once||site.usedAbilities?.[index]!==s.turn)&&(ability.mana||0)<=r.available&&elements.every(e=>(ability.threshold?.[e]||0)<=r[e])&&(!first.select||selectEffects(s,{source,controller:p},first.select).length))result.push({type:'activateSite',player:p,at,index});
  }
  if(ready(s,av)) {
    result.push({type:'ability',player:p,unit:av.uid,mode:'atlas'});if(card(av.card).slug==='sorcerer')result.push({type:'ability',player:p,unit:av.uid,mode:'spells'});
    for(const h of s.players[p].hand)if(card(h.card).type==='Site')for(const at of siteTargets(s,p,card(h.card)))result.push({type:'site',player:p,hand:h.uid,at});
  }
  for(const [index,id] of s.players[p].cemetery.entries()){
    const c=card(id),d=passives[c.slug];if(d?.skeletonReturnCost===undefined||r.available<d.skeletonReturnCost)continue;
    for(const skeleton of s.units)if(!skeleton.dying&&skeleton.controller===p&&card(skeleton.card).slug==='skeleton'&&card(skeleton.card).category==='Token'&&(!d.returnToSite||s.board[skeleton.at])){
      for(const layer of d.returnToSite?['surface','below']:[skeleton.layer||'surface'])result.push({type:'resurrect',player:p,grave:index,card:id,skeleton:skeleton.uid,at:skeleton.at,layer});
    }
  }
  const castEntries=[...topCastEntries(s,p,fiftyAPI),...collectionCastEntries(s,p,fiftyAPI),...s.players[p].hand.map(h=>({card:h.card,from:{hand:h.uid}})),...(s.boundSpells||[]).filter(h=>spellcaster(s,h.unit)?.controller===p&&(!h.requiresSpellcaster||keywords(spellcaster(s,h.unit)).includes('Spellcaster'))).map(h=>({card:h.card,onlyCaster:h.unit,from:{bound:h.uid}})),...s.players[p].cemetery.map((id,index)=>({card:id,from:{grave:index,card:id}})).filter(h=>passives[card(h.card).slug]?.castFromGrave)];
  for(const h of castEntries) {
    if(card(h.card).slug==='craterize'&&!s.players[p].hand.some(h=>card(h.card).type==='Site'))continue;
    const c=card(h.card);if(!c.playable||c.category!=='Spell'||(s.ongoingEffects||[]).some(e=>e.op==='forbidSpellName'&&e.name===c.name))continue;
    for(const caster of h.onlyCaster?[...s.units,...s.artifacts].filter(u=>u.uid===h.onlyCaster&&u.controller===p&&!u.dying&&!disabled(u)&&!u.silenced):casters(s,p,c)) for(const payment of [undefined,...(c.type==='Minion'&&avatar(s,p)?.harbingerSquares&&!avatar(s,p).silenced&&!disabled(avatar(s,p))&&avatar(s,p).harbingerTurn!==s.turn?['harbinger']:[]),...(passives[c.slug]?.randomDiscardCost&&s.players[p].hand.some(v=>v.uid!==h.from.hand)?['randomDiscard']:[]),...(c.type==='Minion'&&vermisCaster(s,caster)?['vermis']:[])]) {
      if(c.type!=='Minion'&&!ignoresThreshold(s,caster,c)&&elements.some(e=>(c[e]||0)>r[e]))continue;
      if(c.type!=='Minion'&&c.type!=='Artifact'&&!canPaySpell(s,p,c,undefined,caster,payment,0,'surface',h.from))continue;
      const from={...h.from,...(payment?{payment}:{}),...(card(caster.card).type==='Site'&&caster.layer==='below'?{casterLayer:'below'}:{})};
      if(!definitions[c.slug]?.casters&&!definitions[c.slug]?.casterTypes&&card(caster.card).type!=='Avatar'&&!caster.unrestrictedCaster&&!printedKeywords(card(caster.card)).includes('Spellcaster')&&caster.spellElements?.length&&!caster.spellElements.some(e=>hasElement(c,e)))continue;
      const casterPassive=passives[card(caster.card).slug];if(casterPassive?.nonOrdinaryCaster&&!caster.silenced&&c.rarity==='Ordinary'||casterPassive?.excludeCastElements?.some(e=>hasElement(c,e)))continue;const casterElements=passives[card(caster.card).slug]?.spellElements||passives[card(caster.card).slug]?.siteSpellElements;if(casterElements&&!casterElements.some(e=>hasElement(c,e)))continue;
      if(c.type==='Minion')for(let at=0;at<20;at++)if((h.forceAt===undefined||h.forceAt===at)&&(payment!=='harbinger'||avatar(s,p).harbingerSquares.includes(at))&&(caster.silenced||!passives[card(caster.card).slug]?.onlySummonHere||occupied(caster).includes(at))&&(c.slug==='mountain_giant'?at%5<4&&at<15&&occupied({at,size:2}).every(i=>!!s.board[i])&&occupied({at,size:2}).some(i=>canSummonAt(s,p,c,i,payment==='harbinger')):canSummonAt(s,p,c,at,payment==='harbinger'))&&(s.board[at]&&(c.subtypes.includes(sitePassives[card(s.board[at].card).slug]?.ignoreThresholdType)||sitePassives[card(s.board[at].card).slug]?.ignoreThresholdTypes?.some(t=>[...c.subtypes,...c.umbrellas].includes(t)))||nextSiteCast(s,c,at)||payment==='vermis'||ignoresThreshold(s,caster,c)||elements.every(e=>(c[e]||0)<=r[e]))){
        if((!h.forceLayer||h.forceLayer==='surface')&&!passives[c.slug]?.mustBelow&&canPaySpell(s,p,c,at,caster,payment,0,'surface',h.from)&&canSummonEntry(s,p,c,at,'surface'))result.push({type:'cast',player:p,...from,caster:caster.uid,at});
        if((!h.forceLayer||h.forceLayer==='below')&&summonKeywords(s,c,at).includes(waterSite(s,at,card)?'Submerge':'Burrowing')&&canPaySpell(s,p,c,at,caster,payment,0,'below',h.from)&&canSummonEntry(s,p,c,at,'below'))result.push({type:'cast',player:p,...from,caster:caster.uid,at,layer:'below'});
      }
      if(c.type==='Artifact'){
        const validAt=at=>(!passives[c.slug]?.backRowCast||inBackRow(at,p))&&canPaySpell(s,p,c,at,caster,payment,0,'surface',h.from);
        if(passives[c.slug]?.sunkenTreasure){const land=passives[c.slug].treasureLand,at=s.board.findIndex((site,at)=>site?.controller===p&&(land?!waterSite(s,at,card):waterSite(s,at,card)));if(at>=0&&validAt(at))result.push({type:'cast',player:p,...from,caster:caster.uid,at});continue;}
        for(let at=0;at<20;at++)if((s.board[at]?.controller===p||s.board[at]&&sitePassives[card(s.board[at].card).slug]?.openArtifactTypes?.some(t=>c.subtypes.includes(t)))&&validAt(at))result.push({type:'cast',player:p,...from,caster:caster.uid,at});
        if(c.slug==='just_a_rock')for(const u of s.units)if(!u.dying&&s.artifacts.some(o=>o.bearer===u.uid)&&validAt(u.at))result.push({type:'cast',player:p,...from,caster:caster.uid,at:u.at,bearer:u.uid});
        if(passives[c.slug]?.conjureEnemyMinion)for(const u of s.units)if(u.controller!==p&&!u.dying&&card(u.card).type==='Minion'&&region(s,u)===region(s,caster)&&canTarget(s,p,u,caster,c.id)&&validAt(u.at))result.push({type:'cast',player:p,...from,caster:caster.uid,at:u.at,bearer:u.uid,shacklesTarget:true});
        if(carriable(c))for(const u of s.units)if(u.controller===p&&!u.dying&&validAt(u.at))result.push({type:'cast',player:p,...from,caster:caster.uid,at:u.at,bearer:u.uid});
      }
      if(c.type==='Aura')for(let at=0;at<20;at++){const d=areaAuras[c.slug];if(d?.fiftyRarities&&(!s.board[at]||!d.fiftyRarities.includes(card(s.board[at].card).rarity)))continue;if(d?.border?!!s.board[at]&&s.board[at].controller===p&&borderNeighbors(at).length>0:d?.castToVoid?!s.board[at]:d?.singleSite?!!s.board[at]&&(!d.nearbyCast||nearby(at,caster.at)):area(at).length)result.push({type:'cast',player:p,...from,caster:caster.uid,at});}
      if(c.type==='Magic'&&definitions[c.slug]?.cast){const first=definitions[c.slug].cast[0];if(!first.select||first.optional||selectEffects(s,{source:caster,controller:p,effectCard:c.id},first.select).length)result.push({type:'cast',player:p,...from,caster:caster.uid,target:null});continue;}
      if(c.type==='Magic')for(const target of spellTargets(s,p,c,caster))result.push({type:'cast',player:p,...from,caster:caster.uid,target});
    }
  }
  if(av&&!av.dying&&!disabled(av)&&s.players[p].hand.length)for(const hireling of s.units)if(!hireling.dying&&!hireling.silenced&&!disabled(hireling)&&passives[card(hireling.card).slug]?.grantHire&&nearby(av.at,hireling.at)&&region(s,av)===region(s,hireling))result.push({type:'hireSellsword',player:p,unit:av.uid,target:hireling.uid});
  for(const u of s.units)if(u.controller===p&&!u.dying&&!disabled(u)){
    if(ready(s,u))for(const o of s.artifacts||[])if(passives[card(o.card).slug]?.rollingBoulder&&sameLocation(s,u,o))result.push({type:'pushBoulder',player:p,unit:u.uid,object:o.uid});
    if(!u.silenced)for(const [index,ability] of (definitions[card(u.card).slug]?.activated||[]).entries()){
      const first=ability.steps[0];
      if((!ability.tap||ready(s,u))&&(!ability.needsCarriedArtifact||s.artifacts.some(o=>o.bearer===u.uid))&&(!ability.needsAtlas||s.players[p].atlas.length)&&(!ability.needsAirSite||siteAffinity(s,u.at,card).air>0)&&(!ability.onceEver||!u[ability.onceEver])&&(!ability.requiresStealth||u.stealth)&&(!ability.once||u.usedAbilities?.[index]!==s.turn)&&(ability.mana||0)<=r.available&&(!first.select||selectEffects(s,{source:u,controller:p},first.select).length))result.push({type:'activate',player:p,unit:u.uid,index});
    }
    if(ready(s,u)&&card(u.card).type==='Minion'&&(s.auras||[]).some(a=>!a.silenced&&!a.disabled&&areaAuras[card(a.card).slug]?.grantMinionMana&&occupied(u).some(at=>inside(a,at))))result.push({type:'homecomingMana',player:p,unit:u.uid});
    if(ready(s,u))for(const target of s.units)if(!target.dying){if((target.boundSpellcaster||!target.silenced&&passives[card(target.card).slug]?.shackled&&!target.shacklesReleased)&&(card(u.card).type==='Avatar'||keywords(u).includes('Spellcaster'))&&occupied(u).some(at=>occupied(target).some(other=>distance(at,other)===1))&&region(s,u)===region(s,target))result.push({type:'freeUnit',player:p,unit:u.uid,target:target.uid,restraint:'spellcaster'});if(target.cocoon&&sameLocation(s,u,target))result.push({type:'freeUnit',player:p,unit:u.uid,target:target.uid,restraint:'cocoon'});}
    if(ready(s,u))for(const fish of s.units)if(fish.uid!==u.uid&&!fish.dying&&!fish.silenced&&!disabled(fish)&&passives[card(fish.card).slug]?.grantKnowledgeRoll&&occupied(u).some(at=>occupied(fish).includes(at)))result.push({type:'salmonRoll',player:p,unit:u.uid,salmon:fish.uid});
    const loose=pickupItems(s,u);
    const carried=(s.artifacts||[]).filter(a=>a.bearer===u.uid&&canDropArtifact(s,a));
    if((loose.length||carryChoices(s,u,transportAPI).length)&&u.pickedTurn!==s.turn)result.push({type:'pickup',player:p,unit:u.uid});
    if((carried.length||passengers(s,u).length)&&u.droppedTurn!==s.turn&&u.interactedTurn!==s.turn)result.push({type:'drop',player:p,unit:u.uid});
  }
  for(const u of s.units)if(u.controller===p&&ready(s,u)){
    if(s.artifacts.some(o=>passives[card(o.card).slug]?.fiftyRam&&sameLocation(s,u,o))&&selectEffects(s,{source:u,controller:p},{kind:'ramTarget'}).length)result.push({type:'fiftyRam',player:p,unit:u.uid});
    if(keywords(u).includes('Ranged'))for(let direction=0;direction<4;direction++)result.push({type:'ranged',player:p,unit:u.uid,direction});
    for(const location of locations(s,u,card,keywords)) {
    const {at,layer}=location,path=location.path.map(v=>v.at),extra=layer==='below'||u.layer==='below'?{layer}:{};
    if(at!==u.at||layer!==(u.layer||'surface'))result.push({type:'move',player:p,unit:u.uid,at,path,...extra});
    for(const enemy of s.units)if(!enemy.dying&&occupied(enemy).some(cell=>occupied({...u,at}).includes(cell))&&(enemy.layer||'surface')===layer&&enemy.controller!==p&&peaceAllowsAttack(s,p,enemy.controller)&&!warrensProtected(s,enemy,p)&&!protectedAttackUnit(s,enemy)&&(!enemy.stealth||u.canSeeStealth)&&(!keywords(enemy).includes('Airborne')||keywords(u).includes('Airborne')||layer==='below'||!s.board[at]))result.push({type:'attack',player:p,unit:u.uid,at,path,target:enemy.uid,...(u.size===2?{combatAt:occupied(enemy).find(cell=>occupied({...u,at}).includes(cell))}:{}),...extra});
    if(layer==='surface'&&(u.silenced||!passives[card(u.card).slug]?.cannotAttackSites))for(const cell of occupied({...u,at}))if(s.board[cell]?.controller===1-p&&peaceAllowsAttack(s,p,s.board[cell].controller)&&!protectedAttackSite(s,cell))result.push({type:'attack',player:p,unit:u.uid,at,path,target:'site:'+cell,...(u.size===2?{combatAt:cell}:{}),...extra});
    }
  }
  return mandatoryBattleActions(s,result,fiftyAPI);
}
export function reason(s,a) {
  if(s.winner!==null)return '對局已結束';
  if(s.choice)return '請先完成目前效果的選擇';
  if(s.pending)return '請先完成防禦／攔截窗口';
  if(s.phase==='draw')return '請先選擇抽 Atlas 或 Spellbook';
  if(a.player!==s.active)return '現在不是你的回合';
  if(a.unit) { const u=unit(s,a.unit);if(u?.tapped)return '此單位已橫置';if(u&&!ready(s,u))return '召喚失調或 Disabled'; }
  const h=a.grave!==undefined?{card:s.players[a.player]?.cemetery[a.grave]}:s.players[a.player]?.hand.find(h=>h.uid===a.hand);
  if(h?.card) { const c=card(h.card),r=resources(s,a.player);if(!c.playable)return '這張卡牌的效果尚未實作';if(castingCost(s,a.player,c,a.at)>r.available)return '可用法力不足';if(elements.some(e=>(c[e]||0)>r[e]))return '元素門檻不足'; }
  return '位置、目標、施法者或目前階段不合法';
}
function blocked(s,p,target) {
  if(target&&target.controller!==p&&target.ward) { target.ward=false;log(s,'Ward 阻擋了法術指定。');return true; }return false;
}
function resolveMagic(s,p,c,a) {
  const h=c.handler;let target=typeof a.target==='string'?unit(s,a.target):null;if(target?.dying)target=null;
  assert(['lightning','explosion','zap','arc','immolation','heal','lifewish','intervention','invigorate','necropotence','flight','vanishment','begone','mesmerism','betrayal','exile','mortality','exorcism','power2','power6','wolf','serpent','charge','shrink','freeze','fatality','mortals','rain','tithe','rescue','searchOrdinary','teleport'].includes(h),'尚未實作的魔法效果：'+c.name);
  if(blocked(s,p,target))return;
  const next={end:s.turn};
  const mod=m=>{if(target)target.mods.push({...next,...m});};
  if(h==='lightning'||h==='explosion') {
    if(blocked(s,p,s.board[a.target]))return;
    const occupants=s.units.filter(u=>u.at===a.target);
    if(h==='lightning'&&occupants.length)hurt(s,occupants[rollIndex(s,occupants.map(u=>card(u.card).name+' @ '+u.at))],3,false,'magic');
    if(h==='explosion')for(const u of occupants)hurt(s,u,3,false,'magic');
  }
  if(['zap','arc','immolation'].includes(h))hurt(s,target,{zap:1,arc:4,immolation:7}[h],false,'magic');
  if(h==='heal')heal(s,p,7);
  if(h==='lifewish')for(let q=0;q<2;q++)fullyHeal(s,avatar(s,q));
  if(h==='intervention'&&s.players[p].doorTurn!==null){s.players[p].doorTurn=null;s.players[p].life=1;}
  if(h==='invigorate'){mod({power:3});heal(s,p,3);}
  if(h==='necropotence')mod({power:3});
  if(h==='flight'){if(target)target.mods.push({keyword:'Airborne',until:p});draw(s,p,'spells');}
  if(h==='vanishment'){for(const u of s.units)if(u.controller===p&&card(u.card).type==='Minion')u.stealth=true;draw(s,p,'spells');}
  if(h==='begone')kill(s,target,true);
  if(h==='mesmerism'&&target)target.controller=p;
  if(h==='betrayal'&&target){target.mods.push({end:s.turn,returnControl:target.controller});target.controller=p;untap(s,target);}
  if(h==='exile'&&target){leaveUnit(s,target,'spells');shuffle(s,s.players[target.owner].spells);}
  if(h==='mortality'||h==='exorcism'){
    if(!blocked(s,p,s.board[a.target]))for(const u of [...s.units])if(u.at===a.target&&card(u.card).type==='Minion'&&unitTypes(u).some(t=>(h==='mortality'?['Mortal']:['Demon','Undead']).includes(t)))kill(s,u,h==='exorcism');
  }
  if(h==='power2')mod({power:2}); if(h==='power6')mod({power:6});
  if(h==='wolf'){mod({power:2});draw(s,p,'spells');}
  if(h==='serpent'){mod({keyword:'Lethal'});draw(s,p,'spells');}
  if(h==='charge')mod({keyword:'Charge'});
  if(h==='shrink'&&target)target.mods.push({set:0,until:p});
  if(h==='freeze'&&target){target.mods.push({disabled:true,until:p});target.ward=false;target.stealth=false;}
  if(h==='fatality')kill(s,target);
  if(h==='mortals')for(const u of [...s.units])if(card(u.card).type==='Minion'&&unitTypes(u).includes('Mortal'))kill(s,u);
  if(h==='rain')for(const u of s.units)if(card(u.card).type==='Minion'&&s.board[u.at])hurt(s,u,1,false,'magic');
  if(h==='tithe')for(let i=0;i<3;i++)draw(s,p,'atlas');
  if(h==='rescue'&&s.players[p].cemetery.includes(a.target)){takeGrave(s,p,s.players[p].cemetery.indexOf(a.target),a.target);s.players[p].hand.push({uid:'h'+s.next++,card:a.target});}
  if(h==='searchOrdinary'&&s.players[p].spells.includes(a.target)){const deck=s.players[p].spells;deck.splice(deck.indexOf(a.target),1);s.players[p].hand.push({uid:'h'+s.next++,card:a.target});shuffle(s,deck);log(s,'揭示 '+card(a.target).name);}
  if(h==='teleport') {target=unit(s,a.target.unit);if(!target||target.dying)return;target.carryTeleport=true;target.at=a.target.at;target.layer='surface';target.stealth=false;}
}
function openCombatWindow(s,pending,judas,source){
 const u=unit(s,pending.attacker),p=source.controller,target=unit(s,pending.target);
 for(const mark of judas)queueEffects(s,[{op:'drawCards',count:1}],{...source,controller:mark.controller},mark.controller,card('kiss_of_judas').id);
 if(!u||u.dying||pending.kind==='attack'&&pending.target&&!pending.target.startsWith('site:')&&(!target||target.dying||!sameLocation(s,u,target))){if(pending.kind==='attack')fight(s,pending);return;}
 s.pending=pending;
 if(u.mods.some(m=>m.blaze)&&pending.kind!=='attack'||legalActions(s,1-p).length===1){if(pending.kind==='attack')fight(s,pending);s.pending=null;}
}
function fight(s,pending) {
  const attacker=unit(s,pending.attacker);
  if(pending.kind==='attack'&&pending.afterAttack?.length){const src=attacker||pending.attackSource;if(src)queueEffects(s,pending.afterAttack,src,src.controller);}
  if(!attacker||attacker.dying)return;
  if(pending.kind==='attack'&&pending.defendUsed&&pending.defenders.filter(uid=>{const u=unit(s,uid);return u&&!u.dying&&sameLocation(s,u,attacker);}).length<2&&s.units.some(u=>u.controller!==pending.player&&!u.dying&&!u.silenced&&!disabled(u)&&passives[card(u.card).slug]?.denyLoneDefense))pending.defenders=unit(s,pending.target)?[pending.target]:[];
  const defenders=pending.defenders.map(id=>unit(s,id)).filter(u=>u&&(pending.remote||sameLocation(s,u,attacker)));
  if(defenders.length) {
    const pre=[];for(const u of [attacker,...defenders]){if(!u.silenced&&!disabled(u)&&passives[card(u.card).slug]?.firstFightUntap&&u.foughtTurn!==s.turn)pre.push({op:'untapSelf',uid:u.uid});u.foughtTurn=s.turn;}
    queueEffects(s,[...pre,{op:'fightStage',phase:'first',fight:{attacker:attacker.uid,defenders:defenders.map(u=>u.uid),kind:pending.kind,remote:!!pending.remote}}],attacker,attacker.controller);
  } else if(pending.target?.startsWith('site:')) {
    const site=s.board[Number(pending.target.slice(5))];if(site&&site.controller!==attacker.controller) {
      const at=Number(pending.target.slice(5)),before=s.players[site.controller].life,bonus=s.units.filter(v=>v.uid!==attacker.uid&&v.controller===attacker.controller&&!v.dying&&!v.silenced&&!disabled(v)).reduce((n,v)=>n+(passives[card(v.card).slug]?.otherSiteAttackPower||0),0);damageSite(s,at,power(attacker)+bonus,attacker);const lost=before-s.players[site.controller].life;if(lost>0)for(const v of s.units)if(v.controller===site.controller&&!v.dying&&!v.silenced&&!disabled(v)&&passives[card(v.card).slug]?.reflectUndefendedLoss&&occupied(v).some(cell=>nearby(cell,at))&&region(s,v)==='surface')eventTrigger(s,v,[{op:'lifeLoss',opponent:true,amount:lost}]);
      for(const a of [...s.auras])if(areaAuras[card(a.card).slug]?.dispelAfterSiteAttack&&inside(a,at))queueEffects(s,[{op:'dispelSelfAura'}],a,a.controller);
      if(!site.silenced&&!site.attackedSuccessfully&&sitePassives[card(site.card).slug]?.firstSuccessfulAttackDiscard){site.attackedSuccessfully=true;queueEffects(s,[{op:'chorusDiscard',player:site.controller}],{...site,at:Number(pending.target.slice(5)),uid:pending.target,layer:'surface'},site.controller);}
    }
  }
  if(!defenders.length)attacker.stealth=false;
  log(s,card(attacker.card).name+' 進入'+(pending.kind==='spell'?'法術戰鬥。':pending.kind==='intercept'?'攔截戰鬥。':'攻擊結算。'));
}
export function dispatch(original, action) {
  const s=clone(original),a=clone(action); const p=a.player;for(const item of s.artifacts||[])if(!item.observedPosition)item.observedPosition={at:item.at,layer:item.layer||'surface',controller:artifactController(s,item)};
  for(const u of s.units){if(u.observedTapped===undefined)u.observedTapped=!!u.tapped;if(!u.observedPosition&&!u.justEntered)u.observedPosition={at:u.at,layer:u.layer||'surface',cells:occupied(u),region:region(s,u)};}
  for(let q=0;q<2;q++)syncGraves(s,q);
  if(!s.artifacts)s.artifacts=[];if(!s.auras)s.auras=[];
  assert(p===0||p===1,'玩家編號錯誤');
  if(a.type==='mulligan') {
    assert(s.phase==='mulligan'&&s.mulligan===p,'目前不能重抽');
    const chosen=a.cards||[];assert(new Set(chosen).size===chosen.length&&chosen.length<=3,'最多重抽 3 張不同手牌');
    const pl=s.players[p],counts={atlas:0,spells:0};
    for(const id of chosen){const h=pl.hand.find(h=>h.uid===id);assert(h,'重抽手牌不存在');const deck=card(h.card).type==='Site'?'atlas':'spells';pl[deck].push(h.card);pl.hand=pl.hand.filter(v=>v.uid!==id);counts[deck]++;}
    for(const deck of ['atlas','spells'])for(let i=0;i<counts[deck];i++)draw(s,p,deck);
    if(p===(s.firstPlayer??0))s.mulligan=1-p;else s.phase='main';log(s,s.players[p].name+' 完成重抽。');
  } else {
    const actions=legalActions(s,p);const legal=actions.find(v=>v.hand===a.hand&&v.grave===a.grave&&v.bound===a.bound&&v.payment===a.payment&&v.casterLayer===a.casterLayer&&Object.entries(v).every(([k,val])=>k==='path'||eq(a[k],val)));
    assert(legal,reason(s,a));
    if(a.type==='choose')chooseEffect(s,a.option);
    if(a.type==='transformHand')commitHandTransform(s,a,fiftyAPI);
    if(a.type==='draw'){draw(s,p,a.deck);s.phase='main';}
    if(a.type==='site') {const h=s.players[p].hand.find(h=>h.uid===a.hand);if(passives[card(h.card).slug]?.fiftyMirror){const options=s.board.flatMap((site,at)=>site&&at!==a.at&&nearby(at,a.at)&&card(site.card).slug!=='mirror_realm'?[{label:card(site.card).name,value:site.baseCard||site.card}]:[]);if(options.length)s.choice={player:p,title:'Mirror Realm',options:[...options,{label:'Cancel',value:null}],frame:{source:avatar(s,p),controller:p,effectCard:h.card,step:{op:'fiftyMirrorChoose',action:a}}};else commitSiteCard(s,a);}else commitSiteCard(s,a);}
    if(a.type==='fiftyRam'){const u=unit(s,a.unit);s.choice={player:p,title:'Battering Ram',options:[...selectEffects(s,{source:u,controller:p},{kind:'ramTarget'}),{label:'Cancel',value:null}],frame:{source:u,controller:p,effectCard:u.card,step:{op:'fiftyRamCommit',action:a}}};}
    if(a.type==='ability'){const u=unit(s,a.unit);u.tapped=true;draw(s,p,a.mode);if(!u.silenced&&passives[card(u.card).slug]?.completionDruid&&s.players[p].turnsTaken===1)queueEffects(s,[{op:'completionDruidTawny'}],u,p);log(s,card(u.card).name+' 橫置並抽取 '+a.mode+'。');}
    if(a.type==='activate'){
      const u=unit(s,a.unit),ability=definitions[card(u.card).slug].activated[a.index],first=ability.steps[0];
      if(ability.declare){const options=first.select?selectEffects(s,{source:u,controller:p},first.select):['北','東','南','西'].map((label,i)=>({label,value:i+1}));s.choice={player:p,title:card(u.card).name+' · 啟動前選擇',options:[...options,{label:'取消啟動（不支付費用）',value:null}],frame:{source:clone(u),controller:p,effectCard:u.card,step:{op:'commitAbility',action:a,effectOp:first.op,optional:true}}};}
      else commitAbility(s,a);
    }
    if(a.type==='activateSite'){
      const site=s.board[a.at],ability=definitions[card(site.card).slug].activated[a.index],source={...site,at:a.at,uid:site.uid||'site:'+a.at,layer:'surface'},first=ability.steps[0];
      if(ability.declare&&first.select)s.choice={player:p,title:card(site.card).name+' · 啟動前選擇',options:[...selectEffects(s,{source,controller:p},first.select),{label:'取消啟動（不支付費用）',value:null}],frame:{source,controller:p,effectCard:site.card,step:{op:'commitSite',action:a,effectOp:first.op,optional:true}}};
      else commitSite(s,a);
    }
    if(a.type==='activateArtifact'){
      const object=s.artifacts.find(o=>o.uid===a.object),ability=definitions[card(object.card).slug].activated[a.index],first=ability.steps[0],abilitySource=ability.bearerSource||ability.bearerTap?unit(s,object.bearer):object;
      if(ability.bearerTap&&first.op==='projectile'){s.choice={player:p,title:card(object.card).name+' · 啟動前選擇方向',options:[...['北','東','南','西'].map((label,i)=>({label,value:i+1})),{label:'取消啟動（不支付費用）',value:null}],frame:{source:clone(object),controller:p,effectCard:object.card,step:{op:'commitArtifact',action:a,optional:true}}};}
      else if(first.select)s.choice={player:p,title:card(object.card).name+' · 啟動前選擇',options:[...selectEffects(s,{source:abilitySource,controller:p},first.select),{label:'取消啟動（不支付費用）',value:null}],frame:{source:clone(object),controller:p,effectCard:object.card,step:{op:'commitArtifact',action:a,effectOp:first.op,optional:true}}};
      else commitArtifact(s,a);
    }
    if(a.type==='resurrect'){
      const c=card(a.card),skeleton=unit(s,a.skeleton);s.players[p].spent+=passives[c.slug].skeletonReturnCost;
      kill(s,skeleton,false,true,true);summonGraveAt(s,{player:p,index:a.grave,card:a.card},p,a.at,a.layer);
      log(s,'犧牲 Skeleton，從墓地召喚 '+c.name+'。');
    }
    if(a.type==='cast') {
      beginCast(s,a);
    }
    if(a.type==='move'||a.type==='attack') {
      const u=unit(s,a.unit),destination=locations(s,u,card,keywords).find(v=>v.at===a.at&&v.layer===(a.layer||'surface'));u.tapped=true;u.notRest=true;u.inBasicTravel=true;u.shotDuringMove=false;const route=[{at:u.at,layer:u.layer||'surface'},...destination.path];
      const previous=route[route.length-2],thicketAt=previous&&previous.at!==a.at?previous.at:undefined;
      queueEffects(s,[...(destination.path.length?[{op:'movementShot'}]:[]),...destination.path.flatMap((to,i)=>[{op:'travelStep',from:route[i],to},{op:'movementShot'}]),{op:'travelStop'},{op:'travelFinish',action:{...a,thicketAt}}],u,p);
    }
    if(a.type==='defend') {
      s.pending.defendUsed=true;const u=unit(s,a.unit),actual=unit(s,s.pending.attacker),at=a.defendAt??s.pending.combatAt??actual.at,destination=locations(s,u,card,keywords).find(v=>v.at===at&&v.layer===(actual.layer||'surface'));u.tapped=true;u.notRest=true;u.inBasicTravel=true;u.shotDuringMove=false;
      if(destination&&destination.path.length){const route=[{at:u.at,layer:u.layer||'surface'},...destination.path];queueEffects(s,[{op:'movementShot'},...destination.path.flatMap((to,i)=>[{op:'travelStep',from:route[i],to},{op:'movementShot'}]),{op:'travelStop'},{op:'defendFinish',action:a}],u,p);}
      else {u.inBasicTravel=false;if(!a.keep)s.pending.defenders=s.pending.defenders.filter(id=>id!==s.pending.target);s.pending.defenders.push(u.uid);}
    }
    if(a.type==='pass'){fight(s,s.pending);s.pending=null;}
    if(a.type==='pushBoulder'){const u=unit(s,a.unit);s.choice={player:p,title:'Rolling Boulder · 選擇推動方向',options:[...['北','東','南','西'].map((label,i)=>({label,value:i+1})),{label:'取消',value:null}],frame:{source:clone(u),controller:p,effectCard:card('rolling_boulder').id,step:{op:'boulderDeclare',actor:u.uid,object:a.object,may:true}}};}
    if(a.type==='ranged'){
      const u=unit(s,a.unit);u.tapped=true;u.stealth=false;u.interactedTurn=s.turn;
      const range=Math.max(u.grantedRange||0,Number((card(u.card).rules.match(/Ranged (\d+)/)||[])[1]||1))+(u.rangeBonus||0);
      queueEffects(s,[{op:'shot',at:u.at,layer:u.layer||'surface',origin:true,direction:a.direction,amount:power(u),remaining:range,ranged:true}],u,p);
    }
    if(a.type==='pickup'||a.type==='drop'){
      const u=unit(s,a.unit),available=a.type==='pickup'?pickupItems(s,u):s.artifacts.filter(item=>item.bearer===u.uid&&canDropArtifact(s,item));
      const possible=a.type==='pickup'?carryChoices(s,u,transportAPI):passengers(s,u),rule=carryRule(u,transportAPI),riders=a.units??(a.type==='pickup'?possible.slice(0,Math.max(0,(rule?.capacity||0)-passengers(s,u).length)):possible).map(v=>v.uid);assert(Array.isArray(riders)&&new Set(riders).size===riders.length&&riders.every(id=>possible.some(v=>v.uid===id))&&(a.type!=='pickup'||passengers(s,u).length+riders.length<=(rule?.capacity||0)),'Carried unit selection is invalid');for(const id of riders){const target=unit(s,id);if(a.type==='pickup'){targetDeclared(s,u,{entity:'unit',uid:id});if(!blocked(s,p,target)&&bringPassenger(s,u,target,transportAPI))boardPassenger(u,target);}else dropPassenger(target);}
      const ids=a.items||available.map(item=>item.uid);assert(Array.isArray(ids)&&new Set(ids).size===ids.length&&ids.every(id=>available.some(item=>item.uid===id)),'物品選擇不合法');
      for(const item of available)if(ids.includes(item.uid)){item.bearer=a.type==='pickup'?u.uid:null;item.at=u.at;item.layer=u.layer||'surface';if(a.type==='pickup'&&passives[card(item.card).slug]?.pickupDrawScatter)queueEffects(s,[{op:'drawCards',count:1},{op:'treasuresScatter',uid:item.uid}],{...item,controller:p},p);}
      if(a.type==='pickup')u.pickedTurn=s.turn;else u.droppedTurn=s.turn;
    }
    if(a.type==='homecomingMana'){const u=unit(s,a.unit);u.tapped=true;u.notRest=true;u.interactedTurn=s.turn;u.stealth=false;s.players[p].bonusMana=(s.players[p].bonusMana||0)+1;}
    if(a.type==='freeUnit'){const actor=unit(s,a.unit),target=unit(s,a.target);actor.tapped=true;actor.notRest=true;actor.interactedTurn=s.turn;actor.stealth=false;if(a.restraint==='spellcaster'){target.boundSpellcaster=false;target.shacklesReleased=true;}else target.cocoon=false;}
    if(a.type==='hireSellsword'){const source=unit(s,a.unit);s.choice={player:p,title:card(unit(s,a.target).card).name,options:[...selectEffects(s,{source,controller:p},{kind:'hand'}),{label:'取消',value:null}],frame:{source:clone(source),controller:p,effectCard:source.card,step:{op:'hirePay',target:a.target}}};}
    if(a.type==='salmonRoll'){const actor=unit(s,a.unit);actor.tapped=true;actor.notRest=true;actor.stealth=false;actor.interactedTurn=s.turn;queueEffects(s,[{op:'salmonD20',salmon:a.salmon}],actor,p);}
    if(a.type==='concede'){s.winner=1-p;s.phase='over';log(s,s.players[p].name+' 投降。');}
    if(a.type==='end')beginEndPhase(s,p);
  }
  stateBased(s);delete s.eventContext;drainEffects(s,effectAPI);
  s.history.push(a);return s;
}
function beginEndPhase(s,p){
      s.phase='end';queueEffects(s,[{op:'finishTurn'}],avatar(s,p),p);for(const u of s.units)if(!u.dying&&u.mods.some(m=>m.warpSpasm&&m.end===s.turn))queueEffects(s,[{op:'warpDeath',uid:u.uid}],u,u.controller,card('warp_spasm').id);
      for(const aura of [...s.auras||[]].reverse()){const d=areaAuras[card(aura.card).slug];if(d?.weather&&(d.weather==='fire'||aura.controller===p))queueEffects(s,[{op:'weatherEnd'}],aura,aura.controller,aura.card);}
      for(const aura of [...s.auras||[]].reverse())if(aura.controller===p||areaAuras[card(aura.card).slug]?.everyEnd)queueEffects(s,definitions[card(aura.card).slug]?.end||[],aura,aura.controller);
      for(const [at,site] of [...s.board.entries()].reverse())if(site?.controller===p)queueEffects(s,definitions[card(site.card).slug]?.end||[],{...site,at,uid:'site:'+at,layer:'surface'},p);
      for(const u of [...s.units].reverse())if(u.controller===p&&!u.silenced&&!disabled(u))queueEffects(s,definitions[card(u.card).slug]?.end||[],u,p);
      for(const object of [...s.artifacts||[]].reverse()){
        const d=passives[card(object.card).slug];if(!object.silenced&&!object.disabled&&d?.pendulumEachEnd)queueEffects(s,[{op:'pendulumSwing'}],object,p);if(d?.eachEndSiteHeal||d?.eachEndSiteLoss||d?.eachEndUnspentLoss)queueEffects(s,[{op:'relicSiteEnd'}],object,p);
        if(d?.fiftySentinel)queueEffects(s,[{op:'fiftySentinel'}],object,artifactController(s,object)??object.owner,object.card);if(d?.everyEnd)queueEffects(s,definitions[card(object.card).slug]?.end||[],object,p,object.card);
        if(artifactController(s,object)===p&&!d?.everyEnd)queueEffects(s,definitions[card(object.card).slug]?.end||[],object,p);
      }
      for(const [at,site] of s.board.entries())if(site&&sitePassives[card(site.card).slug]?.evilSitesEndLoss)queueEffects(s,[{op:'defilerEnd',player:p}],{...site,at,uid:'site:'+at,layer:'surface'},site.controller);
}
function commitSite(s,a,declared){
  const p=a.player,site=s.board[a.at],ability=definitions[card(site.card).slug].activated[a.index],source={...clone(site),at:a.at,uid:site.uid||'site:'+a.at,layer:'surface'};if(ability.tapSelected&&!a.direction){s.choice={player:p,title:card(site.card).name+' 選擇方向',options:[...['北','東','南','西'].map((label,i)=>({label,value:i+1})),{label:'取消',value:null}],frame:{source,controller:p,effectCard:site.card,step:{op:'faeDirection',action:a,ally:declared}}};return;}if(ability.tapSelected){const actor=unit(s,declared?.uid);assert(actor&&ready(s,actor)&&selectEffects(s,{source,controller:p},ability.steps[0].select).some(o=>o.value.uid===actor.uid),'Faerie tap cost is no longer valid');actor.tapped=true;actor.notRest=true;source.layer=actor.layer||'surface';}
  s.players[p].spent+=ability.mana||0;if(!site.usedAbilities)site.usedAbilities={};if(ability.once)site.usedAbilities[a.index]=s.turn;
  if(ability.sacrificeSelected){assert(declared&&selectEffects(s,{source,controller:p},ability.steps[0].select).some(o=>o.value.uid===declared.uid),'Sacrifice cost is no longer valid');queueEffects(s,[{op:'sacrificeUnitCost',uid:declared.uid}],source,p);}
  const steps=ability.steps.map((step,i)=>({...step,...(a.direction?{direction:a.direction}:{}),...(ability.sacrificeSite&&i===ability.steps.length-1?{sacrificeAfter:{at:a.at,card:site.card}}:{})}));
  queueEffects(s,steps,source,p);if(declared!==undefined)s.storyline[s.storyline.length-1].selected=declared;
}
function commitAbility(s,a,declared){
  const p=a.player,u=unit(s,a.unit),ability=definitions[card(u.card).slug].activated[a.index];if(ability.needsCarriedArtifact&&!a.throwObject){const options=s.artifacts.filter(o=>o.bearer===u.uid).map(o=>({label:card(o.card).name,value:o.uid}));if(options.length)s.choice={player:p,title:card(u.card).name+' : '+String.fromCharCode(36984,25799,31070,22120),options:[...options,{label:String.fromCharCode(21462,28040),value:null}],frame:{source:clone(u),controller:p,effectCard:u.card,step:{op:'assassinCommit',action:a,target:declared}}};return;}if(ability.needsCarriedArtifact)assert(s.artifacts.some(o=>o.uid===a.throwObject&&o.bearer===u.uid),'Invalid throwing artifact');if(ability.declarePairSites&&!a.pairSitesDeclared){const options=selectEffects(s,{source:u,controller:p},ability.steps[0].select).filter(o=>o.value.at!==declared.at);if(options.length)s.choice={player:p,title:card(u.card).name+' : '+String.fromCharCode(31532,20108,20491,22320,40670),options:[...options,{label:String.fromCharCode(21462,28040),value:null}],frame:{source:clone(u),controller:p,effectCard:u.card,step:{op:'commitPairSites',action:a,first:declared}}};return;}if(ability.declarePairSites){const sites=selectEffects(s,{source:u,controller:p},ability.steps[0].select).map(o=>o.value.at);assert(sites.includes(declared?.at)&&sites.includes(a.pairSecond?.at)&&declared.at!==a.pairSecond.at,'Invalid site pair');}if(ability.declarePair&&!a.pairDeclared){const first=unit(s,declared.uid),options=selectEffects(s,{source:u,controller:p,effectCard:u.card},{kind:'unit',other:true,nearby:true}).filter(o=>o.value.uid!==first?.uid&&sameLocation(s,unit(s,o.value.uid),first));if(!options.length)return;s.choice={player:p,title:card(u.card).name+' ? 第二個目標',options:[...options,{label:'取消（不支付費用）',value:null}],frame:{source:clone(u),controller:p,effectCard:u.card,step:{op:'commitPairAbility',action:a,first:declared}}};return;}let fire=0;
  if(ability.fireBlast&&!a.blastLocation){s.choice={player:p,title:'Ignis Rex',options:[...selectEffects(s,{source:u,controller:p},{kind:'location',adjacent:true,sameRegion:true}),{label:'Cancel',value:null}],frame:{source:clone(u),controller:p,effectCard:u.card,step:{op:'fireBlastCommit',action:a,hand:declared}}};return;}
  if(ability.banishSelectedGrave){const g=graveEntries(s,declared.player).find(g=>g.uid===declared.uid&&g.card===declared.card);assert(g&&card(g.card).type==='Minion','死去僕從的費用已失效');takeGrave(s,g.player,g.index,g.card,g.uid);s.players[g.player].banished.push(g.card);}
  if(ability.discardSelectedCard){const h=s.players[p].hand.find(h=>h.uid===declared.uid);assert(h&&selectEffects(s,{source:u,controller:p},ability.steps[0].select).some(o=>o.value.uid===h.uid),'棄牌費用已失效');s.players[p].hand=s.players[p].hand.filter(v=>v.uid!==h.uid);sendCard(s,p,h.card,'cemetery');}
  if(ability.discardSelectedSpell){const h=s.players[p].hand.find(h=>h.uid===declared.uid);assert(h&&card(h.card).category==='Spell','必須棄一張法術');s.players[p].hand=s.players[p].hand.filter(v=>v.uid!==h.uid);sendCard(s,p,h.card,'cemetery');}
  if(ability.banishDeadFire)for(const g of graveEntries(s,p).filter(g=>card(g.card).type==='Minion'&&card(g.card).fire>0).reverse()){fire+=card(g.card).fire;takeGrave(s,p,g.index,g.card,g.uid);s.players[p].banished.push(g.card);}
  s.players[p].spent+=ability.mana||0;if(ability.onceEver)u[ability.onceEver]=true;if(ability.tap)u.tapped=true;if(!u.usedAbilities)u.usedAbilities={};if(ability.once)u.usedAbilities[a.index]=s.turn;
  u.notRest=true;u.interactedTurn=s.turn;if(!ability.preserveStealth)u.stealth=false;queueEffects(s,(ability.fireBlast?[{op:'locationDamage',amount:3}]:ability.steps).map(step=>({...step,...(a.throwObject?{throwObject:a.throwObject}:{}),...(a.pairSecond?{second:a.pairSecond}:{}),...(step.amount==='banishedFire'?{amount:fire}:{})})),u,p);
  if(declared!==undefined)s.storyline[s.storyline.length-1].selected=a.blastLocation||declared;if(ability.sacrifice)kill(s,u,false,true,true);
}
function commitArtifact(s,a,declared){
  const object=s.artifacts.find(o=>o.uid===a.object),p=a.player,ability=definitions[card(object.card).slug].activated[a.index],source=clone(ability.bearerTap||ability.bearerSource?unit(s,object.bearer):object);
  if(ability.spearThrow){const target=unit(s,declared?.uid);assert(target&&!target.dying,'Spear victim is no longer valid');const options=occupied(target).map(at=>({label:String.fromCharCode(65+at%5)+(4-Math.floor(at/5)),value:{at,layer:target.layer||'surface'}}));if(!a.spearLocation&&options.length>1){s.choice={player:p,title:card(object.card).name+' : '+String.fromCharCode(36984,25799,33853,40670),options:[...options,{label:String.fromCharCode(21462,28040),value:null}],frame:{source,controller:p,effectCard:object.card,step:{op:'spearCommit',action:a,target:declared}}};return;}a={...a,spearLocation:a.spearLocation||options[0].value};assert(options.some(v=>eq(v.value,a.spearLocation)),'Invalid Spear location');}
  if(ability.bearerTap){const bearer=unit(s,object.bearer);assert(bearer&&ready(s,bearer),'持有者無法支付橫置費用');bearer.tapped=true;bearer.notRest=true;bearer.interactedTurn=s.turn;bearer.stealth=false;source.tapped=true;source.stealth=false;}
  if(ability.fiftyThrow){source.throwObject=object.uid;object.bearer=null;}
  if(ability.crew){queueEffects(s,[{op:'siegeCrew',action:a,target:declared}],source,p);return;}
  if(!object.usedAbilities)object.usedAbilities={};if(ability.once)object.usedAbilities[ability.bearerOnce?object.bearer+':'+a.index:a.index]=s.turn;
  if(ability.steps[0].op==='bearerDamage'){const bearer=unit(s,object.bearer);bearer.notRest=true;bearer.interactedTurn=s.turn;bearer.stealth=false;}
  if(ability.sacrificeAtActivation)removeObject(s,object,'cemetery');
  if(ability.banishSelf)removeObject(s,object,'banished');if(ability.sacrificeSelf)queueEffects(s,[{op:'sacrificeRelic',uid:object.uid}],source,p,object.card);queueEffects(s,ability.steps.map(step=>({...step,...(ability.spearThrow?{object:object.uid,location:a.spearLocation}:{})})),source,p,source.card);
  if(declared!==undefined)s.storyline[s.storyline.length-1].selected=declared;
}
function siegeCrew(s,object,p){const bearer=unit(s,object.bearer);return bearer?s.units.filter(u=>u.uid!==bearer.uid&&u.controller===p&&ready(s,u)&&sameLocation(s,u,bearer)):[];}
function beginCast(s,a){
  const p=a.player,c=castingCard(s,a),first=definitions[c.slug]?.cast?.[0],caster=spellcaster(s,a.caster,a.casterLayer);
  if(areaAuras[c.slug]?.border){queueEffects(s,[{op:'borderDeclare',action:a}],caster,p,c.id);return;}
  if(c.type==='Magic'&&(first?.select||first?.op==='projectile')){
    const options=first.select?selectEffects(s,{source:caster,controller:p,effectCard:c.id},first.select):['北','東','南','西'].map((label,i)=>({label,value:i+1}));
    s.choice={player:p,title:c.name+' · 施放前選擇（費用 '+castingCost(s,p,c,a.at,caster,a.payment,0,a.layer||'surface',a)+'）',options:[...options,{label:'取消施放（不支付費用）',value:null}],frame:{source:clone(caster),controller:p,effectCard:c.id,step:{op:'commitSpell',action:a,effectOp:first.op,optional:true}}};
  }else commitSpell(s,a);
}
function commitSpell(s,a,declared){
  if(passives[castingCard(s,a).slug]?.heirCopy&&!a.heirDecided){queueEffects(s,[{op:'copyHeirCost',action:a}],spellcaster(s,a.caster,a.casterLayer),a.player,castingCard(s,a).id);return;}
  if(castingCard(s,a).slug==='just_a_rock'&&a.bearer&&!a.rockVictim){const items=s.artifacts.filter(o=>o.bearer===a.bearer);if(items.length>1){s.choice={player:a.player,title:'Just a Rock',options:[...items.map(o=>({label:card(o.card).name,value:o.uid})),{label:'Cancel',value:null}],frame:{source:spellcaster(s,a.caster,a.casterLayer),controller:a.player,effectCard:castingCard(s,a).id,step:{op:'fiftyRockCommit',action:a,declared}}};return;}if(items.length)a={...a,rockVictim:items[0].uid};}
  if(a.payment==='randomDiscard'&&!s.randomReplay){queueEffects(s,[{op:'commitLegacy',action:a,declared}],spellcaster(s,a.caster,a.casterLayer),a.player,castingCard(s,a).id);return;}
  if(castingCard(s,a).slug==='shatter_strike'&&!a.shatterTarget){const ally=unit(s,declared.uid);if(!ally)return;const options=selectEffects(s,{source:ally,controller:a.player,effectCard:castingCard(s,a).id},{kind:'unit',enemy:true,adjacent:true});if(!options.length)return;s.choice={player:a.player,title:'Shatter Strike ? 選擇敵方目標',options:[...options,{label:'取消（不支付費用）',value:null}],frame:{source:clone(spellcaster(s,a.caster,a.casterLayer)),controller:a.player,effectCard:castingCard(s,a).id,step:{op:'shatterDeclare',action:a,ally:declared}}};return;}
  if(castingCard(s,a).slug==='craterize'&&!a.discardedSite){queueEffects(s,[{op:'craterDiscard',action:a,target:declared}],spellcaster(s,a.caster,a.casterLayer),a.player,castingCard(s,a).id);return;}
  if(castingCard(s,a).handler==='lightning'&&!s.randomReplay){queueEffects(s,[{op:'commitLegacy',action:a,declared}],spellcaster(s,a.caster,a.casterLayer),a.player,castingCard(s,a).id);return;}
  if(castingCard(s,a).slug==='chain_lightning'&&!a.chainTargets){queueEffects(s,[{op:'chainDeclare',action:a,targets:[declared]}],spellcaster(s,a.caster,a.casterLayer),a.player,castingCard(s,a).id);return;}
  const p=a.player,pl=s.players[p],c=castingCard(s,a),owner=a.bound?(s.boundSpells||[]).find(h=>h.uid===a.bound).owner:a.grave!==undefined?a.graveOwner??p:p,castingUnit=spellcaster(s,a.caster,a.casterLayer),cost=castingCost(s,p,c,a.at,castingUnit,a.payment,2*Math.max(0,(a.chainTargets?.length||1)-1),a.layer||'surface',a);assert(canPaySpell(s,p,c,a.at,castingUnit,a.payment,2*Math.max(0,(a.chainTargets?.length||1)-1),a.layer||'surface',a),'Spell payment is no longer affordable');if(a.payment==='randomDiscard'){const hand=pl.hand.filter(h=>h.uid!==a.hand);assert(passives[c.slug]?.randomDiscardCost&&hand.length,'No card for random discard');const h=hand[rollIndex(s,hand.map(v=>card(v.card).name))];pl.hand=pl.hand.filter(v=>v.uid!==h.uid);sendCard(s,p,h.card,'cemetery');}if(pl.bloodManaTurn===s.turn){delete pl.bloodManaTurn;const summon=c.type==='Minion'?summoningTax(s,c):0;pl.spent+=summon;loseLife(s,p,cost-summon);}else pl.spent+=cost;if(elements.some(e=>hasElement(c,e))&&castingUnit.elementGiftTurn===s.turn)castingUnit.elementGiftCount=0;castingUnit.elementGifts=(castingUnit.elementGifts||[]).filter(g=>g.turn===s.turn&&!(hasElement(c,g.element)));
  if(dragonGift(s,p,c,a.at,a.layer||'surface'))s.ongoingEffects=s.ongoingEffects.filter(e=>!(e.op==='freeDragon'&&e.controller===p&&e.end===s.turn&&e.at===a.at&&e.layer===(a.layer||'surface')));
  if(nextSiteCast(s,c,a.at))delete s.board[a.at].nextCastTurn;
  if(isKnightSpell(c))pl.knightCastTurn=s.turn;if(c.type==='Magic'&&card(castingUnit.card).type==='Site'&&s.board[castingUnit.at]?.towerMagicTurn===s.turn)s.board[castingUnit.at].towerMagicUsed=true;
  if(!definitions[c.slug]?.cast&&typeof a.target==='string')targetDeclared(s,castingUnit,{entity:'unit',uid:a.target});
  if(a.shacklesTarget)targetDeclared(s,castingUnit,{entity:'unit',uid:a.bearer});
  const castObservers=[...s.artifacts];if(castingUnit.spellCastTurn!==s.turn){castingUnit.spellCastTurn=s.turn;castingUnit.castElements=[];castingUnit.castCount=0;}castingUnit.castCount++;castingUnit.castElements=[...new Set([...castingUnit.castElements,...elements.filter(e=>hasElement(c,e))])];
  if(c.type==='Magic')for(const o of s.artifacts)if(o.bearer===castingUnit.uid&&passives[card(o.card).slug]?.heldMagicPower){if(!o.magicCasts)o.magicCasts={};const entry=o.magicCasts[castingUnit.uid];o.magicCasts[castingUnit.uid]={turn:s.turn,count:entry?.turn===s.turn?entry.count+1:1};}
  // Chain additions are included in the same mana or life payment above.
  if(pl.castTurn!==s.turn){pl.castTurn=s.turn;pl.castAir=0;pl.castNonFire=false;}pl.castAir+=(c.air||0);if(!c.fire&&!c.elements?.includes('Fire'))pl.castNonFire=true;
  if(a.payment==='harbinger')avatar(s,p).harbingerTurn=s.turn;
  if(a.top!==undefined){assert(pl.spells[0]===c.id,'Top card changed');pl.spells.shift();}else if(a.collection!==undefined){assert(pl.collection[a.collection]===c.id,'Collection card changed');pl.collection.splice(a.collection,1);}else if(a.bound)s.boundSpells=s.boundSpells.filter(h=>h.uid!==a.bound);else if(a.grave!==undefined)takeGrave(s,owner,a.grave,c.id,a.graveUid);else pl.hand=pl.hand.filter(v=>v.uid!==a.hand);
  if(c.type==='Minion') {const u=makeUnit(s,a.heirCard||c.id,owner,a.at);if(a.heirCard){u.originalCard=c.id;u.copyEntryDone=true;}u.controller=p;u.notRest=true;u.layer=a.layer||'surface';if(a.bookDead){u.mods.push({replaceTypes:['Undead']});u.banishOnDeath=true;}summonedGenesis(s,u);const traitor=s.board[a.at],threshold=traitor&&sitePassives[card(traitor.card).slug]?.enemyStealthCastThreshold;if(traitor?.controller===1-p&&threshold&&resources(s,traitor.controller)[threshold]>=1)u.stealth=true;log(s,'召喚 '+c.name+'。');}
  else if(c.type==='Artifact'){const object={uid:'o'+s.next++,card:c.id,owner,controller:p,at:a.at,bearer:a.bearer||null,...(a.rockVictim?{rockVictim:a.rockVictim}:{}),layer:a.bearer?unit(s,a.bearer).layer||'surface':'surface'};if(a.shacklesTarget){const target=unit(s,a.bearer);object.at=target.at;object.layer=target.layer||'surface';if(blocked(s,p,target))object.bearer=null;}s.artifacts.push(object);refreshContinuous(s);if(!object.silenced)queueEffects(s,definitions[c.slug]?.genesis||[],object,p);if(passives[c.slug]?.sunkenTreasure)queueEffects(s,[{op:'treasureCast',uid:object.uid}],spellcaster(s,a.caster,a.casterLayer),p,c.id);}
  else if(c.type==='Aura'){const aura={uid:'o'+s.next++,stamp:s.next-1,card:c.id,owner,controller:p,at:a.at,...(a.wallTo!==undefined?{wallTo:a.wallTo}:{}),...(areaAuras[c.slug]?.singleSite?{singleSite:true,visited:[a.at]}:{}),...(areaAuras[c.slug]?.turns?{remainingTurns:areaAuras[c.slug].turns}:{})};s.auras.push(aura);refreshContinuous(s);if(!aura.silenced&&!aura.disabled)queueEffects(s,definitions[c.slug]?.genesis||[],aura,p);}
  else {
    queueEffects(s,[{op:'finishMagic',card:c.id,owner,destination:a.grave!==undefined&&(a.graveBanish||passives[c.slug]?.banishAfterGraveCast)?'banished':'cemetery'}],spellcaster(s,a.caster,a.casterLayer),p,c.id);
    const effects=definitions[c.slug]?.cast?definitions[c.slug].cast.map(step=>a.shatterTarget?{...step,shatterTarget:a.shatterTarget}:a.chainTargets?{...step,targets:a.chainTargets,select:undefined}:step):[{op:'resolveLegacySpell',action:a}];
    queueEffects(s,[{op:'reactionMagicResolve',effects,...(declared!==undefined?{declared}:{}),...(card(castingUnit.card).type==='Site'?{siteUid:s.board[castingUnit.at]?.uid}:{})}],spellcaster(s,a.caster,a.casterLayer),p,c.id);log(s,'施放 '+c.name+'。');
  }
  if(c.type==='Magic')queueSturmReactions(s,castingUnit,fiftyAPI);
  if(c.type==='Magic'&&!castingUnit.silenced&&!disabled(castingUnit)&&passives[card(castingUnit.card).slug]?.pushAfterMagic)queueEffects(s,[{op:'battleSylph',optional:true,select:{kind:'unit',here:true,untargeted:true}}],castingUnit,p,castingUnit.card);
  if(c.type==='Minion'&&s.board[a.at])for(const aura of s.auras)if(aura.controller===p&&!aura.silenced&&!aura.disabled&&areaAuras[card(aura.card).slug]?.castTribeDraw&&inside(aura,a.at)&&['Beast','Faerie'].some(t=>c.subtypes.includes(t)))queueEffects(s,[{op:'drawOne',deck:'spells'}],aura,p);
  const caster=spellcaster(s,a.caster,a.casterLayer);for(const o of castObservers)if(o.bearer===castingUnit.uid&&!o.silenced&&!o.disabled&&passives[card(o.card).slug]?.bearerCastDamageHeal)queueEffects(s,[{op:'morriganDamage',optional:true,select:{kind:'unit',nearby:true}}],castingUnit,p,castingUnit.card);if(caster&&!caster.silenced&&!disabled(caster)&&passives[card(caster.card).slug]?.castRiverGenesis)queueEffects(s,[{op:'triggerSiteGenesis',optional:true,untargeted:true,select:{kind:'site',nearby:true,nameIncludes:'River',untargeted:true}}],caster,p,caster.card);if(caster){caster.stealth=false;caster.interactedTurn=s.turn;}
  for(const [at,site] of s.board.entries())if(site&&sitePassives[card(site.card).slug]?.castRarityLifeLoss){const amount=(c.rarity||c.slot)==='Elite'?1:(c.rarity||c.slot)==='Unique'?2:0;if(amount)queueEffects(s,[{op:'castLifeLoss',player:p,amount}],{...site,at,uid:'site:'+at},site.controller,c.id);}
  if(card(castingUnit.card).type==='Avatar')for(const o of castObservers)if(passives[card(o.card).slug]?.nearbyAvatarCastLoss&&nearby(o.at,castingUnit.at)&&region(s,o)===region(s,castingUnit))queueEffects(s,[{op:'castLifeLoss',player:p,amount:castingUnit.castCount}],o,artifactController(s,o)??o.owner,c.id);
  stateBased(s);
}
// Restore derived capabilities without advancing the saved storyline or RNG.
export function restoreGame(saved){const s=clone(saved);if(!s.artifacts)s.artifacts=[];if(!s.auras)s.auras=[];for(let p=0;p<2;p++)syncGraves(s,p);for(const u of s.units){if(u.observedTapped===undefined)u.observedTapped=!!u.tapped;if(!u.observedPosition)u.observedPosition={at:u.at,layer:u.layer||'surface',cells:occupied(u)};}refreshContinuous(s);return s;}
// Only public board information and the acting player's own hand/decks are exposed.
export function handIsRevealed(s,p){if(s.choice?.frame?.step?.op==='accuseBanish'&&s.choice.frame.step.player===p)return true;const target=avatar(s,p);return !!target&&s.units.some(u=>u.controller!==p&&!u.dying&&!u.silenced&&!disabled(u)&&passives[card(u.card).slug]?.revealHandsInMotion&&locations(s,u,card,keywords).some(v=>occupied({...u,at:v.at}).some(at=>occupied(target).includes(at))&&v.layer===(target.layer||'surface')));}
export function observation(s,p) {
  const v=clone(s);v.players[1-p].collection=Array((v.players[1-p].collection||[]).length).fill(null);v.players[1-p].handRevealed=handIsRevealed(s,1-p);if(!v.players[1-p].handRevealed)v.players[1-p].hand=v.players[1-p].hand.map(()=>({hidden:true}));
  v.boundSpells=(v.boundSpells||[]).map(h=>spellcaster(v,h.unit)?.controller===p?h:{uid:h.uid,unit:h.unit,owner:h.owner,hidden:true});
  v.players[1-p].atlas=Array(v.players[1-p].atlas.length).fill(null);v.players[1-p].spells=Array(v.players[1-p].spells.length).fill(null);
  v.players[p].atlas=Array(v.players[p].atlas.length).fill(null);v.players[p].spells=Array(v.players[p].spells.length).fill(null);
  const top=topSpellAccess(s,p);for(let q=0;q<2;q++)if(top.cards[q])v.players[q].spells[0]=top.cards[q];
  if(v.choice&&v.choice.player!==p){v.choice.options=v.choice.options.map(()=>({hidden:true}));v.choice.frame=null;}
  v.rng=null;v.history=[];return v;
}
export {selectEffects as effectOptions};
export const topSpellAccess=(s,p)=>readTopSpellAccess(s,p,fiftyAPI);










const fiftyAPI={bindControl,refreshContinuous,summoningTax,unitTypes,beginCast,sendCard,damageSite,unitUmbrellas,loseLife,legalActions,get cardCatalog(){return cardCatalog;},runtimeCard,sitePassives,fiftyForceAllowed,card,printedKeywords,unit,avatar,power,keywords,disabled,region,nearby,distance,occupied,locations,canEnterOnGround,queueEffects,kill,hurt,strike,strikeMany,strikeTotal,heal,removeObject,enterSite,destroySite,draw,shuffle,log,makeUnit,summonedGenesis,graveEntries,takeGrave,canSummonEntry,paySummoningTax,selectEffects,blocked,resources,siteAffinity,area,inside,artifactController,commitSiteCard,definitions,passives,waterSite,leaveUnit,commitSpell};
