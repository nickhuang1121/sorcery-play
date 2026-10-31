import {finalArchivePrintedCard} from './card-lineage.js';
// Orb copies a Magic AFTER costs/choices made during casting have been paid.
// It does not cast the card again, pay its costs again or choose a new X.
import {compositeCopyTargets,beginGraspCopyDeclaration} from './magic-declarations.js';
import {secondTargetOptions} from './remaining-rules.js';
import {createZoneAccessScope} from './cemetery-access.js';
export const finalOrbPassives={orb_of_baal_berith:{finalOrb:true}};
export const finalOrbOperations=['finalOrbChoice','finalOrbRetarget','finalOrbSecond','finalOrbChain','finalOrbReplay','finalOrbFinish','finalOrbGraspCommitted'];
const clone=x=>x===undefined?undefined:structuredClone(x);
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const copyById=(s,id)=>(s.finalOrbCopies||[]).find(c=>c.uid===id);

export function registerOrbCopyCards(cards,runtimeCard){
 for(const c of cards)if(c.type==='Magic')runtimeCard(c.id,'orb_magic',{category:'Token',playable:false});
}
export function orbTargetSnapshot(s,value){
 if(value?.entity==='site'&&s.board[value.at])return {...clone(value),orbSiteUid:s.board[value.at].uid};
 return clone(value);
}
export function orbTargetStillPresent(s,value){return !value?.orbSiteUid||s.board[value.at]?.uid===value.orbSiteUid;}

// Call only after the original Magic's costs and declarations are finalized,
// after its normal resolution was queued. This trigger then interrupts it.
export function queueFinalOrbCopies(s,a,c,caster,declared,effects,A){
 if(c.type!=='Magic')return;
 const orbs=(s.artifacts||[]).filter(o=>!o.silenced&&!o.disabled&&A.passives[A.card(o.card).slug]?.finalOrb&&o.finalOrbUsedTurn!==s.turn&&(A.regionsOverlap?A.regionsOverlap(s,o,caster):A.region(s,o)===A.region(s,caster))&&A.occupied(caster).some(at=>A.nearby(o.at,at)));
 for(const orb of orbs)orb.finalOrbUsedTurn=s.turn;
 // Preserve artifact order as the initial ordering of simultaneous triggers.
 for(const orb of [...orbs].reverse()){
  const record={uid:'orbmagic'+s.next++,orb:orb.uid,player:a.player,card:c.id,token:A.runtimeCard(finalArchivePrintedCard(c.id,A),'orb_magic',{category:'Token',playable:false}),
    source:{...clone(orb),controller:a.player,layer:orb.layer||'surface',mods:[]},action:clone(a),declared:orbTargetSnapshot(s,declared),effects:clone(effects),x:a.x,status:'created',scope:createZoneAccessScope(s)};
  (s.finalOrbCopies||(s.finalOrbCopies=[])).push(record);
  A.queueEffects(s,[{op:'finalOrbChoice',copy:record.uid,effects:record.effects}],record.source,a.player,c.id,{scope:record.scope,magicChoiceContext:null});
 }
}

function firstOptions(s,record,A){
 const composite=compositeCopyTargets(s,record,A);if(composite)return composite;
 const c=A.card(record.card),definition=A.definitions[c.slug],first=definition?.cast?.[0],frame={source:record.source,controller:record.player,effectCard:record.card};
 if(record.action.chainTargets)return A.selectEffects(s,frame,{kind:'unit',nearby:true});
 if(first?.select){let options=A.selectEffects(s,frame,first.select);
  if(['swap','backstab'].includes(c.slug))options=options.filter(o=>secondTargetOptions(s,frame,o.value,A).length>0);
  if(c.slug==='shatter_strike')options=options.filter(o=>{const u=A.unit(s,o.value.uid);return u&&A.selectEffects(s,{...frame,source:u},{kind:'unit',enemy:true,adjacent:true}).length;});
  return options;
 }
 if(!definition?.cast)return A.spellTargets(s,record.player,c,record.source).map(value=>({label:typeof value==='string'&&A.unit(s,value)?A.card(A.unit(s,value).card).name:JSON.stringify(value),value}));
 return [];
}
function alteredEffects(record,declared,extra={}){
 return record.effects.map(effect=>{
  let step=clone(effect);
  if(step.magicDeclaration)step.magicDeclaration=declared?.magicDeclaration?clone(declared.magicDeclaration):{...step.magicDeclaration,caster:clone(record.source)};
  if(step.op==='resolveLegacySpell')step.action={...record.action,caster:record.source.uid,target:declared===undefined?record.action.target:declared,...extra};
  if(extra.second!==undefined)step.second=extra.second;
  if(extra.shatterTarget!==undefined)step.shatterTarget=extra.shatterTarget;
  if(extra.targets)step={...step,targets:extra.targets,select:undefined};
  return step;
 });
}
function replay(s,record,declared,extra,A){
 record.newDeclared=orbTargetSnapshot(s,declared);record.newEffects=alteredEffects(record,declared,extra);
 A.queueEffects(s,[{op:'finalOrbReplay',copy:record.uid}],record.source,record.player,record.card,{scope:record.scope,magicChoiceContext:null});
}

export function resolveFinalOrb(s,frame,A){
 const {step,selected}=frame;if(!finalOrbOperations.includes(step.op))return false;
 const record=copyById(s,step.copy);if(!record||['resolved','fizzled'].includes(record.status))return true;
 const p=record.player,source=record.source,c=A.card(record.card);
 const choose=(options,title,extra={})=>{s.choice={player:p,title,options,frame:{...frame,source,controller:p,effectCard:record.card,step:{...step,...extra}}};};
 const queue=steps=>A.queueEffects(s,steps,source,p,record.card,{scope:record.scope,magicChoiceContext:null});
 if(step.op==='finalOrbChoice'){
  if(selected===undefined){const options=firstOptions(s,record,A);choose([{label:'保留原目標／原施放選擇',value:'keep'},...(options.length?[{label:'選擇新目標（不重新支付費用）',value:'new'}]:[])],"Orb of Ba'al Berith · 複製 "+c.name+(record.x===undefined?'':' · X='+record.x));return true;}
  if(selected==='keep'){replay(s,record,record.declared,{},A);return true;}
  if(selected==='new'&&['grasping_ground','meteor_shower'].includes(c.slug)){beginGraspCopyDeclaration(s,record,A);return true;}
  if(selected==='new')queue([{op:record.action.chainTargets?'finalOrbChain':'finalOrbRetarget',copy:record.uid,picks:[]}]);return true;
 }
 if(step.op==='finalOrbRetarget'){
  const options=firstOptions(s,record,A);
  if(selected===undefined){if(options.length)choose([...options,{label:'返回，保留原目標',value:'keep'}],c.name+' · 複本新目標');else replay(s,record,record.declared,{},A);return true;}
  if(selected==='keep'){replay(s,record,record.declared,{},A);return true;}
  const picked=options.find(o=>eq(o.value,selected));if(!picked)return true;
  const declared=orbTargetSnapshot(s,picked.value);
  if(['swap','backstab','shatter_strike'].includes(c.slug)){queue([{op:'finalOrbSecond',copy:record.uid,first:declared}]);return true;}
  replay(s,record,declared,{},A);return true;
 }
 if(step.op==='finalOrbSecond'){
  const context={source,controller:p,effectCard:record.card};
  const ally=c.slug==='shatter_strike'?A.unit(s,step.first.uid):null;
  const options=c.slug==='shatter_strike'?(ally?A.selectEffects(s,{...context,source:ally},{kind:'unit',enemy:true,adjacent:true}):[]):secondTargetOptions(s,context,step.first,A);
  if(selected===undefined){if(options.length)choose([...options,{label:'保留整組原目標',value:'keep'}],c.name+' · 複本第二目標');else replay(s,record,record.declared,{},A);return true;}
  if(selected==='keep'){replay(s,record,record.declared,{},A);return true;}
  if(options.some(o=>eq(o.value,selected)))replay(s,record,step.first,c.slug==='shatter_strike'?{shatterTarget:selected}:{second:selected},A);return true;
 }
 if(step.op==='finalOrbChain'){
  const picks=step.picks||[],count=record.action.chainTargets.length;
  if(picks.length===count){replay(s,record,picks[0],{targets:picks},A);return true;}
  const last=picks.length&&A.unit(s,picks[picks.length-1].uid),options=picks.length?
    A.selectEffects(s,{source,controller:p,effectCard:record.card},{kind:'unit'}).filter(o=>!picks.some(v=>v.uid===o.value.uid)&&last&&A.nearby(last.at,A.unit(s,o.value.uid).at)):
    firstOptions(s,record,A);
  if(selected===undefined){choose([...options,{label:'保留原連鎖目標',value:'keep'}],c.name+' · 第 '+(picks.length+1)+'／'+count+' 個複本目標');return true;}
  if(selected==='keep'){replay(s,record,record.declared,{},A);return true;}
  if(options.some(o=>eq(o.value,selected)))queue([{...step,picks:[...picks,selected]}]);return true;
 }
 if(step.op==='finalOrbGraspCommitted'){
  record.newDeclared=undefined;record.newEffects=record.effects.map(effect=>({...clone(effect),magicDeclaration:clone(step.declaration)}));queue([{op:'finalOrbReplay',copy:record.uid}]);return true;
 }
 if(step.op==='finalOrbReplay'){
  const orb=s.artifacts.find(o=>o.uid===record.orb),declared=record.newDeclared,effects=record.newEffects||record.effects;
  queue([{op:'finalOrbFinish',copy:record.uid}]);
  if(!orb||!orbTargetStillPresent(s,declared)){record.failed=true;return true;}
  record.status='resolving';
  // Direct effect replay is deliberate: no new cast event, X selection, mana,
  // sacrifice/discard, threshold or additional casting costs are charged.
  A.queueEffects(s,effects,source,p,record.card,{scope:record.scope,abilityOrigin:record.card,magicChoiceContext:null});
  if(effects.length&&declared!==undefined)s.storyline[s.storyline.length-1].selected=declared;
  return true;
 }
 if(step.op==='finalOrbFinish'){
  record.status=record.failed?'fizzled':'resolved';A.sendCard(s,p,record.token,'banished');return true;
 }
 return true;
}
