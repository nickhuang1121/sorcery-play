import {combatViews} from './final-borrowed-combat.js';
import {hasAbilitySource} from './ability-sources.js';
// Replacement decisions suspend an entire deterministic action, not a damage
// receipt. Replaying from its immutable base preserves synchronous strike/heal
// accounting and atomic damage windows. Private replay bases are redacted.
const clone=x=>structuredClone(x);
export function finalReplacementChoice(s,key,player,options,title,source){
 const replay=s.finalDecisionReplay;
 if(!replay)throw Error('Replacement decision needs an action transaction');
 const saved=replay.decisions[replay.cursor++];
 if(saved){
  if(saved.key!==key)throw Error('Replacement replay no longer matches the declared event');
  const match=options.find(o=>JSON.stringify(o.value)===JSON.stringify(saved.value));
  if(!match)throw Error('Replacement choice is no longer legal');
  return clone(match.value);
 }
 throw {finalReplacement:true,key,player,options:clone(options),title,source:clone(source),state:clone(s),decisions:clone(replay.decisions.slice(0,replay.cursor-1))};
}
export function runFinalDecisionAction(original,action,core,A){
 let base=original,executed=action,decisions=[];
 const pending=original.finalDecisionPending;
 if(pending&&original.choice?.frame?.step?.op==='finalReplacementResume'&&action.type==='choose'){
  if(action.player!==original.choice.player||!Number.isInteger(action.option)||!original.choice.options[action.option])throw Error('Invalid replacement response');
  base=pending.base;executed=pending.action;
  decisions=[...pending.decisions,{key:pending.key,value:clone(original.choice.options[action.option].value)}];
 }
 const prepared=clone(base);delete prepared.finalDecisionPending;
 prepared.finalDecisionReplay={decisions,cursor:0};
 try{const result=core(prepared,executed);delete result.finalDecisionReplay;delete result.finalDecisionPending;return result;}
 catch(e){
  if(!e?.finalReplacement)throw e;
  const replayBase=clone(base);delete replayBase.finalDecisionReplay;delete replayBase.finalDecisionPending;
  const staged=clone(e.state||base);delete staged.finalDecisionReplay;delete staged.finalDecisionPending;delete staged.randomReplay;delete staged.eventContext;
  staged.finalDecisionPending={base:replayBase,action:clone(executed),decisions:clone(e.decisions||decisions),key:e.key};
  const source=e.source||A.avatar(staged,e.player);
  staged.choice={player:e.player,title:e.title,options:e.options,frame:{source,controller:e.player,effectCard:source.card,step:{op:'finalReplacementResume'}}};
  return staged;
 }
}
const live=(u,A)=>u&&!u.dying&&!u.silenced&&!A.disabled(u);
const near=(s,a,b,A)=>A.regionsOverlap(s,a,b)&&A.occupied(a).some(at=>A.occupied(b).some(bt=>A.nearby(at,bt)));
const adjacent=(s,a,b,A)=>A.regionsOverlap(s,a,b)&&A.occupied(a).some(at=>A.occupied(b).some(bt=>A.distance(at,bt)===1));
const owner=(s,o,A)=>A.artifactController(s,o)??o.owner;
const passive=(u,A)=>A.passives[A.card(u.card).slug]||{};
function modifications(s,target,amount,kind,source,player,used,A,strikeModifiers){
 const result=[],fromUnit=source&&kind!=='magic'&&['Minion','Avatar'].includes(A.card(source.card).type);
 const add=(id,actor,mandatory,change)=>{if(!used.has(id))result.push({id,actor,mandatory,change});};
 for(const effect of strikeModifiers)if(effect.controller===player)add(effect.uid+':critical',{uid:effect.uid,card:effect.card},true,'double');
 for(const a of s.artifacts||[])if(!a.silenced&&!a.disabled&&owner(s,a,A)===player){
  const d=passive(a,A),srcNearby=source&&near(s,a,source,A);
  if(fromUnit&&srcNearby&&d.nearbyUnitDamageFloor)add(a.uid+':floor',a,true,'floor');
  if(kind==='strike'&&srcNearby&&d.nearbyStrikeLifeCap)add(a.uid+':cap',a,true,'cap');
  if(kind==='strike'&&d.doubleStrikeAgainstUnits&&(a.bearer===target.uid||a.bearer===source?.uid))add(a.uid+':double',a,true,'double');
  if(kind==='strike'&&d.mandatoryNearbyAttack&&near(s,a,target,A))add(a.uid+':mask',a,true,'double');
 }
 for(const u of s.units)if(u&&!u.dying&&!A.disabled(u)&&u.controller===player){
  for(const layer of combatViews(s,u,A)){
   const d=layer.passive,actor=layer.source,id=u.uid+':'+layer.instance,origin=A.card(layer.origin);
   if(kind!=='strike'&&d.doubleNonStrikeNearby&&near(s,u,target,A))add(id+':double',actor,true,'double');
   if(u.uid===target.uid&&d.replaceFireDamagePower&&A.card(s.eventContext?.effectCard||source?.card||u.card).fire>0)add(id+':firePower',actor,true,'firePower');
   if(u.uid===target.uid)continue;
   if(u.controller===target.controller&&(d.fiftyRedirectAll||d.fiftyRedirectAvatar&&A.card(target.card).type==='Avatar'&&near(s,u,target,A)))add(id+':redirect',actor,true,'redirect');
   if(d.damageGuard&&hasAbilitySource(origin,'sir_gawain')&&u.controller===target.controller&&adjacent(s,u,target,A))add(id+':gawain',actor,true,'gawain');
   const royalty=A.card(target.card).type==='Avatar'||A.unitUmbrellas(target).includes('Royalty');
   if(d.damageGuard&&hasAbilitySource(origin,'royal_bodyguard')&&royalty&&near(s,u,target,A))add(id+':bodyguard',actor,false,'redirect');
  }
  // Faith is a gained modifier, not an ability copied once per printed layer.
  if(u.uid!==target.uid&&u.controller===target.controller&&u.mods?.some(m=>m.fiftyFaith)&&near(s,u,target,A))add(u.uid+':faith',u,true,'redirect');
 }
 return result;
}
// Official Damage: active player orders all their modifications, then the
// nonactive player. Each source/effect can modify this instance at most once.
export function modifyFinalDamage(s,target,amount,kind,source,A,strikeModifiers=[]){
 const used=new Set(),gawains=new Map();let redirected=false;
 // Zero-power strikes can become damage through Panpipes (official FAQ).
 // Without a floor there is no zero-damage event requiring replacement UI.
 if(amount===0&&![s.active,1-s.active].some(p=>modifications(s,target,amount,kind,source,p,used,A,strikeModifiers).some(m=>m.change==='floor')))return {target,amount};
 for(const p of [s.active,1-s.active]){
  let guard=0;
  while(amount>=0){
   if(++guard>1000)throw Error('Damage replacement loop');
   const available=modifications(s,target,amount,kind,source,p,used,A,strikeModifiers);
   if(!available.length)break;
   let chosen;
   if(available.length===1&&available[0].mandatory)chosen=available[0];
   else{
    const options=available.map(m=>({label:A.card(m.actor.card).name+' · '+m.change,value:m.id}));
    if(!available.some(m=>m.mandatory))options.push({label:'不轉移傷害',value:null});
    const value=finalReplacementChoice(s,'modify:'+target.uid+':'+amount+':'+p+':'+[...used].join(','),p,options,'選擇傷害修改／轉移順序',target);
    if(value===null)break;chosen=available.find(m=>m.id===value);
   }
   used.add(chosen.id);
   if(chosen.change==='double')amount*=2;
   else if(chosen.change==='floor')amount=Math.max(2,amount);
   else if(chosen.change==='cap')amount=Math.min(2,amount);
   else if(chosen.change==='firePower'){target.mods.push({power:1,end:s.turn});amount=0;}
   else{redirected=true;target=A.unit(s,chosen.actor.uid)||chosen.actor;if(chosen.change==='gawain')gawains.set(target.uid,chosen.actor);}
  }
 }
 return {target,amount,redirected,gawain:gawains.has(target.uid),gawainSource:gawains.get(target.uid)||null};
}
export function markFinalGawainDamage(s,u,amount,redirected,source=null){
 if(!redirected||amount<=0||!s.eventContext)return;
 (s.eventContext.finalGawainDamage||(s.eventContext.finalGawainDamage=[])).push({uid:u.uid,origin:source?.abilityOrigin||u.card,instance:source?.abilityInstance||'printed:'+u.uid});
}
export function finalGawainDiesFromDamage(s,u,death,sacrifice,A){
 if(!death||sacrifice||!s.eventContext||!u.lethal&&u.damage<A.power(u,true))return;
 const entries=(s.eventContext.finalGawainDamage||[]).filter(e=>typeof e==='string'?e===u.uid:e.uid===u.uid),seen=new Set();
 for(const entry of entries){const origin=typeof entry==='string'?u.card:entry.origin,instance=typeof entry==='string'?'printed:'+u.uid:entry.instance;if(seen.has(instance))continue;seen.add(instance);
  A.queueEffects(s,[{op:'drawCards',count:1,abilityOrigin:origin,abilityInstance:instance}],{...u,abilityOrigin:origin,abilityInstance:instance},u.controller,u.card);
 }
}
