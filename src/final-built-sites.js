import {siteEffectAllowed} from './final-ability-layers.js';
// Explicit construction/combat/mutation rules for the remaining sites.
import {geometryBoardAllowed} from './final-geometry.js';
export const builtSiteDefinitions={
 free_city:{activated:[{label:'每回合一次：Free City 攻擊同格敵軍',steps:[{op:'builtCityAttack'}]}]},
};
export const builtSitePassives={
 the_base_of_babel:{babelBase:true},the_apex_of_babel:{babelApex:true},
 free_city:{freeCity:true},vindictive_nation:{vindictiveNation:true},rift_valley:{riftValley:true},
};
export const babelPassives={the_base_of_babel:builtSitePassives.the_base_of_babel,the_apex_of_babel:builtSitePassives.the_apex_of_babel};
export const riftPassives={rift_valley:builtSitePassives.rift_valley};
export const cityDefinitions={free_city:builtSiteDefinitions.free_city};
export const cityPassives={free_city:builtSitePassives.free_city};
export const vindictivePassives={vindictive_nation:builtSitePassives.vindictive_nation};
export const builtSiteOperations=['builtBabelBonus','builtBabelCast','builtRiftChoose','builtCityAttack','builtVindictive'];
const layer=u=>u.layer||'surface';
const pos=at=>String.fromCharCode(65+at%5)+(4-Math.floor(at/5));
const siteByUid=(s,uid)=>{const at=s.board.findIndex(v=>v?.uid===uid);return at<0?null:{site:s.board[at],at};};

export function registerBuiltSiteCards(card,runtimeCard){
 const id=runtimeCard(card('the_base_of_babel').id,'tower_of_babel',{
   name:'The Tower of Babel',type:'Site',category:'Site',rarity:'Unique',slot:'Unique',
   rarities:['Exceptional','Unique'],providesMana:2,earth:1,air:1,fire:0,water:0,
   rules:'Provides 2 mana, 1 Earth and 1 Air threshold. This is both Exceptional and Unique.',
 });
 for(const kind of ['disabled_site','silenced_site','fate_site','sinterfee_site'])runtimeCard(id,kind,{runtimeMask:true,rules:'',...(kind==='disabled_site'||kind==='sinterfee_site'?{air:0,earth:0,fire:0,water:0}:kind==='fate_site'?{air:0,earth:0,fire:0,water:1}:{})});
 runtimeCard(id,'behemoth_demon',{type:'Minion',subtypes:['Demon'],umbrellas:['Evil'],rules:''});
 return id;
}
export const hasSiteRarity=(c,r)=>(c.rarities||[c.rarity||c.slot]).includes(r);
export function babelTargets(s,p,A){return s.board.flatMap((site,at)=>site?.controller===p&&!site.silenced&&!site.disabled&&A.passives[A.card(site.card).slug]?.babelBase?[at]:[]);}
// Called before normal enterSite would replace an existing Base. The physical
// cards stay separately recorded while the realm sees one merged Site.
export function commitBuiltBabel(s,a,id,A){
 const p=a.player,base=s.board[a.at];
 if(!A.passives[A.card(id).slug]?.babelApex||!babelTargets(s,p,A).includes(a.at))return false;
 const h=a.pathfinderSite?{card:s.players[p].atlas[0]}:s.players[p].hand.find(h=>h.uid===a.hand);if(!h?.card)return false;
 const tower=registerBuiltSiteCards(A.card,A.runtimeCard),physicalBase=base.originalCard||base.baseCard||base.card;
 (A.unit(s,a.siteActor)||A.avatar(s,p)).tapped=true;if(a.pathfinderSite)s.players[p].atlas.shift();else s.players[p].hand=s.players[p].hand.filter(v=>v.uid!==h.uid);s.players[p].finalHasPlayedSite=true;
 s.board[a.at]={...base,card:tower,babelParts:[{card:physicalBase,owner:base.owner},{card:h.card,owner:p}],babelBuilt:true};
 delete s.board[a.at].originalCard;delete s.board[a.at].baseCard;
 A.refreshContinuous(s);
 A.queueEffects(s,[{op:'builtBabelBonus'}],{...s.board[a.at],at:a.at,layer:'surface'},p,h.card);
 return true;
}
// Use on every Site zone-change path, not just destroySite. A copied Tower has
// no babelParts and therefore sends only its actual copy card to that zone.
export function sendBuiltSite(s,site,zone,A){
 const parts=site.babelParts||[{card:site.originalCard||site.baseCard||site.card,owner:site.owner}];
 for(const part of parts)if(part.owner===0||part.owner===1){if(zone==='hand')s.players[part.owner].hand.push({uid:'h'+s.next++,card:part.card});else A.sendCard(s,part.owner,part.card,zone);}
}

export function riftPlans(s,A){
 const result=[];
 for(const step of [1,5])for(let gap=0;gap<20;gap++)for(const direction of [-1,1]){
  const delta=step*direction,fixed=gap-delta;
  const line=(a,b)=>step===1?Math.floor(a/5)===Math.floor(b/5):a%5===b%5;
  if(fixed<0||fixed>=20||!line(gap,fixed)||!s.board[fixed]||!s.board[gap])continue;
  const moves=[];let at=gap,valid=true;
  while(at>=0&&at<20&&line(gap,at)&&s.board[at]){
    const site=s.board[at],to=at+delta;
    if(to<0||to>=20||!line(gap,to)||site.completionProtected||A.passives[A.card(site.card).slug]?.immutableSite){valid=false;break;}
    moves.push({from:at,to,uid:site.uid,card:site.card});at=to;
  }
  if(valid&&moves.length&&at>=0&&at<20&&line(gap,at)&&!s.board[at]){
   const projected=s.board.slice();for(const move of moves)projected[move.from]=null;for(const move of moves)projected[move.to]=s.board[move.from];projected[gap]={card:A.card('rift_valley').id};
   if(geometryBoardAllowed(s,projected,A.card))result.push({at:gap,step:delta,moves});
  }
 }
 return result;
}
export function riftTargets(s,A,p){
 const first=p!==undefined&&(s.players[p].turnsTaken||0)<=1&&!s.players[p].finalHasPlayedSite;
 return [...new Set(riftPlans(s,A).map(plan=>plan.at))].filter(at=>!first||A.avatar(s,p)?.at===at);
}
export function riftPlanHasCopySource(s,plan,A){
 const moved=new Map(plan.moves.map(v=>[v.from,v.to]));
 return s.board.some((site,at)=>site&&A.passives[A.card(site.baseCard||site.card).slug]?.riftValley&&A.nearby(moved.get(at)??at,plan.at));
}
export function mirrorRiftTargets(s,A,p){
 const allowed=new Set(riftTargets(s,A,p));
 return [...new Set(riftPlans(s,A).filter(plan=>allowed.has(plan.at)&&riftPlanHasCopySource(s,plan,A)).map(plan=>plan.at))];
}
export function applyRiftPlan(s,plan,A,actor=s.active){
 const valid=riftPlans(s,A).find(p=>JSON.stringify(p)===JSON.stringify(plan));if(!valid)return false;
 const old=s.board.slice(),mapping=new Map(valid.moves.map(v=>[v.from,v.to]));
 for(const {from} of valid.moves)s.board[from]=null;
 for(const {from,to} of valid.moves)s.board[to]=old[from];
 const moved=new Set();
 for(const u of s.units)if(A.occupied(u).length===1&&mapping.has(u.at)&&siteEffectAllowed(s,u,'move',A,A.card('rift_valley').id)&&A.fiftyForceAllowed(s,u,actor,A)){
  u.at=mapping.get(u.at);u.notRest=true;u.burrowedSafely=false;moved.add(u.uid);
 }
 for(const a of s.artifacts||[])if(mapping.has(a.at)&&(!a.bearer||moved.has(a.bearer)))a.at=mapping.get(a.at);
 for(const a of s.auras||[])if(a.singleSite&&a.wallTo===undefined&&mapping.has(a.at))a.at=mapping.get(a.at);
 return true;
}

// Stable virtual combat participants: the City stays a Site in board[] and is
// never added as a Minion/Avatar to units[]. Only combat resolves this proxy.
export function freeCityProxy(s,id,A){
 if(typeof id!=='string'||!id.startsWith('freecity:'))return undefined;
 const rest=id.slice(9),last=rest.lastIndexOf(':'),uid=rest.slice(0,last),combatLayer=rest.slice(last+1),found=siteByUid(s,uid);
 if(!found||!A.passives[A.card(found.site.card).slug]?.freeCity)return undefined;
 const {site,at}=found;
 return {...site,uid:id,at,layer:combatLayer,siteProxy:true,siteUid:site.uid,mods:[],born:0,tapped:false,damage:0,
   effectDisabled:!!site.silenced||!!site.disabled,ward:!!site.ward,stealth:false};
}
function cityId(site,combatLayer){return 'freecity:'+site.uid+':'+combatLayer;}
const cityReady=(s,site,A)=>site&&!site.silenced&&!site.disabled&&site.finalCityUsedTurn!==s.turn&&A.passives[A.card(site.card).slug]?.freeCity;
export function cityAttackActions(s,p,at,A){
 const site=s.board[at];if(!cityReady(s,site,A)||site.controller!==p||s.active!==p||s.phase!=='main'||s.pending)return [];
 return s.units.filter(u=>u.controller!==p&&!u.dying&&A.occupied(u).includes(at)&&!u.stealth&&(!A.keywords(u).includes('Airborne')||A.disabled(u))&&!A.protectedAttackUnit(s,u))
  .map(u=>({type:'cityAttack',player:p,at,target:u.uid,layer:layer(u),unit:cityId(site,layer(u))}));
}
export function cityDefendActions(s,p,A){
 const pending=s.pending,attacker=pending&&A.unit(s,pending.attacker);
 if(!pending||pending.player!==p||!attacker||pending.stealth||pending.noDefend)return [];
 const at=pending.combatAt??attacker.at,site=s.board[at];
 if(!cityReady(s,site,A)||site.controller!==p||attacker.controller===p||!A.occupied(attacker).includes(at))return [];
 const id=cityId(site,layer(attacker));if(pending.defenders.includes(id))return [];
 return [{type:'cityDefend',player:p,at,unit:id,keep:false},...(A.unit(s,pending.target)?[{type:'cityDefend',player:p,at,unit:id,keep:true}]:[])];
}
export function commitCityAction(s,a,A){
 const options=a.type==='cityAttack'?cityAttackActions(s,a.player,a.at,A):cityDefendActions(s,a.player,A);
 if(!options.some(v=>JSON.stringify(v)===JSON.stringify(a)))return false;
 const site=s.board[a.at];site.finalCityUsedTurn=s.turn;
 if(a.type==='cityDefend'){
  s.pending.defendUsed=true;if(!a.keep)s.pending.defenders=s.pending.defenders.filter(id=>id!==s.pending.target);s.pending.defenders.push(a.unit);
 }else{
  const source=freeCityProxy(s,a.unit,A);
  A.queueEffects(s,[{op:'travelFinish',action:{...a,type:'attack'}}],source,a.player,site.card);
 }
 return true;
}

// Snapshot only visible Site characteristics relevant to modification. Do not
// include timestamps, action-use markers or ordinary resource accounting.
function siteSignature(site){return JSON.stringify({card:site.card,controller:site.controller,silenced:!!site.silenced,disabled:!!site.disabled,ward:!!site.ward,effects:site.effects||[],bonusThreshold:site.bonusThreshold||null});}
export function captureVindictiveSites(s,A){return s.board.flatMap((site,at)=>site?[{uid:site.uid,at,site:structuredClone(site),signature:siteSignature(site),vindictive:!!A.passives[A.card(site.card).slug]?.vindictiveNation}]:[]);}
// Consuming its own Ward is the Site's prevention effect, not an opponent's
// modification. Explicitly removing a Ward with an opponent's effect still is.
export function noteBuiltWardConsumed(s,site){(s.finalBuiltWardConsumed||(s.finalBuiltWardConsumed=[])).push(site.uid);}
export function triggerVindictiveSiteEvent(s,before,at,kind,actor,A){
 if(actor!==0&&actor!==1)return;
 const target=before.find(v=>v.at===at);if(!target||target.site.controller===actor)return;
 const amount={modify:1,move:3,destroy:7}[kind];if(!amount)return;
 for(const nation of before)if(nation.vindictive&&!nation.site.silenced&&!nation.site.disabled&&nation.site.controller===target.site.controller&&A.nearby(nation.at,at)){
  A.queueEffects(s,[{op:'builtVindictive',player:actor,amount}],{...nation.site,at:nation.at,layer:'surface'},nation.site.controller,nation.site.card);
 }
}
export function detectVindictiveChanges(s,before,actor,A){
 if(!before)return;
 const after=new Map(s.board.flatMap((site,at)=>site?[[site.uid,{site,at}]]:[]));
 for(const old of before){const now=after.get(old.uid);if(!now)continue;
  if(now.at!==old.at)triggerVindictiveSiteEvent(s,before,old.at,'move',actor,A);
  const ownWardOnly=(s.finalBuiltWardConsumed||[]).includes(old.uid)&&siteSignature({...now.site,ward:old.site.ward})===old.signature;
  if(siteSignature(now.site)!==old.signature&&!ownWardOnly)triggerVindictiveSiteEvent(s,before,old.at,'modify',actor,A);
 }
 delete s.finalBuiltWardConsumed;
}

export function resolveBuiltSites(s,frame,A){
 const {step,source,controller:p,selected}=frame;if(!builtSiteOperations.includes(step.op))return false;
 const queue=steps=>A.queueEffects(s,steps,source,p,frame.effectCard);
 const choose=(options,title)=>{s.choice={player:p,title,options,frame};};
 if(step.op==='builtVindictive'){A.loseLife(s,step.player,step.amount,false,source);return true;}
 if(step.op==='builtBabelBonus'){A.draw(s,p,'spells');queue([{op:'builtBabelCast'}]);return true;}
 if(step.op==='builtBabelCast'){
  const options=[];
  for(const h of s.players[p].hand)if(A.card(h.card).category==='Spell'){
   try{options.push(...A.freeCastActions(s,p,h.uid).filter(a=>!a.payment).map(action=>({label:A.card(h.card).name+(action.at!==undefined?' · '+pos(action.at):''),value:action})));}
   finally{delete s.finalFreeCast;}
  }
  if(selected===undefined){choose([...options,{label:'不免費施放',value:null}],'The Tower of Babel · 可免費施放一個法術');return true;}
  const a=options.find(o=>JSON.stringify(o.value)===JSON.stringify(selected))?.value;
  if(a){s.finalFreeCast={player:p,hand:a.hand,caster:a.caster};A.beginCast(s,a);}return true;
 }
 if(step.op==='builtRiftChoose'){
  const physical=step.action.pathfinderSite?s.players[p].atlas[0]:s.players[p].hand.find(h=>h.uid===step.action.hand)?.card;
  const copy=physical&&A.passives[A.card(physical).slug]?.fiftyMirror;
  const options=riftPlans(s,A).filter(plan=>plan.at===step.action.at&&(!copy||riftPlanHasCopySource(s,plan,A))).map(plan=>({label:'拉開 '+pos(plan.at)+' · '+(Math.abs(plan.step)===1?(plan.step>0?'向右':'向左'):(plan.step>0?'向下':'向上'))+' · 移動'+plan.moves.length+'地點',value:plan}));
  if(step.normalAllowed)options.unshift({label:'正常打出，不拉開地點',value:false});
  if(selected===undefined){choose([...options,{label:'取消（不打出）',value:null}],'Rift Valley · 宣告開縫');return true;}
  if(selected===null)return true;
  const option=options.find(o=>JSON.stringify(o.value)===JSON.stringify(selected));if(option)A.commitSiteCard(s,{...step.action,riftDecided:true,riftPlan:option.value||null},step.copyId||null);return true;
 }
 if(step.op==='builtCityAttack'){
  const options=cityAttackActions(s,p,source.at,A);
  if(selected===undefined){choose([...options.map(a=>({label:'攻擊 '+A.card(A.unit(s,a.target).card).name,value:a})),{label:'取消',value:null}],'Free City · 攻擊');return true;}
  if(selected)commitCityAction(s,selected,A);return true;
 }
 return true;
}

// Physical cards composing a built Tower must retain separate lineage. A copied
// Tower without babelParts is one physical copy card and stays on the ordinary
// single-card archive path.
export function builtSitePhysicalParts(site,A){
 return site?.babelParts?.map(part=>({...part,physicalUid:part.physicalUid||A.card(part.card).finalPhysicalUid||null}))||null;
}
export function tagBuiltSiteParts(s,site,A,tag){
 if(!site?.babelParts)return null;
 site.babelParts=site.babelParts.map(part=>{const tagged=tag(s,part.card,A);return {...part,card:tagged.card,physicalUid:tagged.physicalUid};});
 return builtSitePhysicalParts(site,A);
}
function oneBuiltPartState(state,part,A){
 const result=structuredClone(state),unitForm=A.card(state.card).type==='Minion';result.card=unitForm?state.card:part.card;result.owner=part.owner;result.finalArchivePhysicalUid=part.physicalUid||A.card(part.card).finalPhysicalUid;
 delete result.babelParts;delete result.babelBuilt;delete result.originalCard;delete result.baseCard;if(unitForm){result.originalCard=part.card;if(A.card(state.card).slug==='__behemoth_demon'&&A.runtimeCard)result.card=A.runtimeCard(part.card,'behemoth_demon',{type:'Minion',subtypes:['Demon'],umbrellas:['Evil'],rules:''});}
 return result;
}
// All physical parts return as the archived merged Site. When only one part is
// eligible, preserve the surviving physical card as its printed standalone Site;
// this never recreates a banished second card. See the explicit inference note
// in docs/final-built-sites.md; the caller decides which physical IDs qualify.
export function restoreBuiltSiteState(snapshot,eligibleIds,A){
 const parts=builtSitePhysicalParts(snapshot,A);if(!parts)return structuredClone(snapshot);
 const ids=eligibleIds instanceof Set?eligibleIds:new Set(eligibleIds),eligible=parts.filter(part=>ids.has(part.physicalUid));
 if(!eligible.length)return null;
 return eligible.length===parts.length?structuredClone(snapshot):oneBuiltPartState(snapshot,eligible[0],A);
}
// Remove only recovered physical parts from a currently merged Tower. This
// keeps a newly added, unarchived half as a standalone physical Site instead of
// silently deleting it along with a recovered archived half.
export function detachBuiltSiteParts(site,recoverIds,A){
 const parts=builtSitePhysicalParts(site,A);if(!parts)return site;
 const ids=recoverIds instanceof Set?recoverIds:new Set(recoverIds),remaining=parts.filter(part=>!ids.has(part.physicalUid));
 if(remaining.length===parts.length)return site;
 if(!remaining.length)return null;
 const result=oneBuiltPartState(site,remaining[0],A);result.uid=site.uid+':remaining:'+remaining[0].physicalUid;return result;
}
