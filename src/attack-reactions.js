// Batch 82: declare reactions, after-attack continuations, and casting reactions.
const layer=u=>u.layer||'surface';
const pos=at=>String.fromCharCode(65+at%5)+(4-Math.floor(at/5));
const here=(s,a,b,A)=>A.region(s,a)===A.region(s,b)&&A.occupied(a).some(at=>A.occupied(b).includes(at));
const live=(s,uid,A)=>{const u=A.unit(s,uid);return u&&!u.dying?u:null;};
export const attackReactionOperations=['reactionWisp','reactionHero','reactionOpenAttack','reactionBladeStep','reactionBladeAttack','reactionSturm','reactionSturmStrike','reactionMagicResolve','reactionPeace'];
export function queueAttackReactions(s,u,pending,judas,A){
 A.queueEffects(s,[{op:'reactionOpenAttack',pending,judas}],u,u.controller);
 const target=live(s,pending.target,A);if(!target)return;
 const reactions=[];
 if(!target.silenced&&!A.disabled(target)&&A.passives[A.card(target.card).slug]?.evadeTeleport)reactions.push({u:target,step:{op:'reactionWisp'}});
 for(const hero of s.units)if(!hero.dying&&!hero.silenced&&!A.disabled(hero)&&hero.controller===target.controller&&A.passives[A.card(hero.card).slug]?.rescueWeakerAttacked&&A.power(target)<A.power(hero)&&here(s,hero,target,A))reactions.push({u:hero,step:{op:'reactionHero',target:target.uid,optional:true}});
 for(const r of reactions.reverse())A.queueEffects(s,[r.step],r.u,r.u.controller,r.u.card);
}
export function queueSturmReactions(s,caster,A){
 if(!['Avatar','Minion'].includes(A.card(caster.card).type))return;
 for(const u of [...s.units].reverse())if(!u.dying&&!u.silenced&&!A.disabled(u)&&u.controller!==caster.controller&&A.passives[A.card(u.card).slug]?.chaseMagicCaster)A.queueEffects(s,[{op:'reactionSturm',target:caster.uid}],u,u.controller,u.card);
}
export function peaceAllowsAttack(s,p,q){return !(s.ongoingEffects||[]).some(e=>e.op==='peaceTruce'&&e.player===p&&e.protected===q&&e.usedTurn===s.turn);}
export function advanceTruces(s){s.ongoingEffects=(s.ongoingEffects||[]).filter(e=>!(e.op==='peaceTruce'&&e.usedTurn!==undefined&&e.usedTurn<s.turn));for(const e of s.ongoingEffects)if(e.op==='peaceTruce'&&e.player===s.active&&e.after<s.turn&&e.usedTurn===undefined)e.usedTurn=s.turn;}
function bladeActions(s,u,A){
 const preview=structuredClone(s);preview.choice=null;preview.pending=null;preview.active=u.controller;preview.phase='main';A.unit(preview,u.uid).tapped=false;A.unit(preview,u.uid).born=0;
 // This preview is an attack explicitly granted by a resolving effect.
 preview.storyline=[...(preview.storyline||[]),{step:{op:'reactionBladeAttack'}}];
 return A.legalActions(preview,u.controller).filter(a=>a.type==='attack'&&a.unit===u.uid&&a.at===u.at&&(a.layer||'surface')===layer(u)&&!!A.unit(s,a.target));
}
function moveDistance(s,u,target,A){
 const queue=[{at:u.at,layer:layer(u),n:0}],seen=new Set();
 for(let i=0;i<queue.length;i++){const node=queue[i],key=node.at+':'+node.layer;if(seen.has(key))continue;seen.add(key);const v={...u,at:node.at,layer:node.layer};if(here(s,v,target,A))return node.n;for(const to of A.locations(s,v,A.card,A.keywords,true))if(to.path.length===1&&!seen.has(to.at+':'+to.layer))queue.push({at:to.at,layer:to.layer,n:node.n+1});}
 return Infinity;
}
export function resolveAttackReaction(s,frame,A){
 const {step,source,controller:p,selected}=frame;if(!attackReactionOperations.includes(step.op)||step.op==='reactionOpenAttack')return false;
 const queue=(steps,src=source,player=p,effect=frame.effectCard)=>A.queueEffects(s,steps,src,player,effect);
 const choice=(options,title)=>{s.choice={player:p,title,options:[...options,{label:'略過',value:null}],frame};};
 if(step.op==='reactionWisp'){
  const u=live(s,source.uid,A);if(!u)return true;
  const keys=A.keywords(u),options=A.selectEffects(s,{source:u,controller:p},{kind:'location',nearby:true,other:true}).filter(o=>o.value.layer==='surface'?s.board[o.value.at]||keys.includes('Voidwalk'):keys.includes(A.waterSite(s,o.value.at,A.card)?'Submerge':'Burrowing')).filter(o=>A.occupied({...u,at:o.value.at}).every((at,i)=>A.canEnterOnGround(s,u,{at:A.occupied(u)[i],layer:layer(u)},{at,layer:o.value.layer},A.card,A.keywords,true)));
  if(selected===undefined){choice(options,'Wills-o’-the-Wisp · 傳送閃避');return true;}
  if(options.some(o=>o.value.at===selected?.at&&o.value.layer===selected.layer)){u.carryTeleport=true;u.notRest=true;u.at=selected.at;u.layer=selected.layer;u.burrowedSafely=false;}return true;
 }
 if(step.op==='reactionHero'){const target=live(s,step.target,A);if(selected&&target)A.leaveUnit(s,target,'hand');return true;}
 if(step.op==='reactionBladeStep'){
  const u=live(s,source.uid,A);if(!u||A.disabled(u))return true;
  const options=A.locations(s,u,A.card,A.keywords,true).filter(v=>v.path.length===1);
  if(selected===undefined){choice(options.map(v=>({label:pos(v.at)+' · '+v.layer,value:{at:v.at,layer:v.layer}})),'Bladedancer · 可走一步再攻擊');return true;}
  const to=options.find(v=>v.at===selected?.at&&v.layer===selected.layer);if(to){u.at=to.at;u.layer=to.layer;u.gateVoidwalk=to.gateVoidwalk;u.notRest=true;queue([{op:'reactionBladeAttack'}],u,p,u.card);}return true;
 }
 if(step.op==='reactionBladeAttack'){
  const u=live(s,source.uid,A);if(!u||A.disabled(u))return true;const options=bladeActions(s,u,A);
  if(selected===undefined){choice(options.map(a=>({label:A.card(A.unit(s,a.target).card).name,value:a})),'Bladedancer · 可追加攻擊一個單位');return true;}
  const action=options.find(a=>JSON.stringify(a)===JSON.stringify(selected));if(action)queue([{op:'travelFinish',action}],u,u.controller,u.card);return true;
 }
 if(step.op==='reactionSturm'){
  const u=live(s,source.uid,A),target=live(s,step.target,A);if(!u||!target||A.disabled(u))return true;
  const current=moveDistance(s,u,target,A),moves=A.locations(s,u,A.card,A.keywords,true).filter(v=>v.path.length===1).map(to=>({to,n:moveDistance(s,{...u,at:to.at,layer:to.layer},target,A)})),best=Math.min(current,...moves.map(v=>v.n)),options=moves.filter(v=>v.n===best&&v.n<current);
  if(selected===undefined&&options.length){s.choice={player:p,title:'Sturmgeist · 沿最短路徑接近施法者',options:options.map(v=>({label:pos(v.to.at),value:{at:v.to.at,layer:v.to.layer}})),frame};return true;}
  const to=options.find(v=>v.to.at===selected?.at&&v.to.layer===selected.layer)?.to;if(to){u.at=to.at;u.layer=to.layer;u.gateVoidwalk=to.gateVoidwalk;u.notRest=true;}
  queue([{op:'reactionSturmStrike',target:step.target}],u,p,u.card);return true;
 }
 if(step.op==='reactionSturmStrike'){const u=live(s,source.uid,A),target=live(s,step.target,A);if(u&&target&&!A.disabled(u)&&A.region(s,u)===A.region(s,target)&&A.occupied(u).some(at=>A.occupied(target).some(cell=>A.distance(at,cell)<=1)))A.strike(s,u,target);return true;}
 if(step.op==='reactionMagicResolve'){
  const caster=A.unit(s,source.uid)||s.artifacts.find(o=>o.uid===source.uid),site=source.uid?.startsWith('site:')?(step.siteUid?s.board.find(o=>o?.uid===step.siteUid):s.board[source.at]):null;
  if(!caster&&!site||caster?.dying){A.log(s,A.card(frame.effectCard).name+'：施法者已離開領域，法術不結算。');return true;}
  queue(step.effects);if(step.effects.length&&step.declared!==undefined)s.storyline[s.storyline.length-1].selected=step.declared;return true;
 }
 if(step.op==='reactionPeace'){
  const u=live(s,source.uid,A);if(!u||selected===null)return true;const q=step.recipient;if(!s.board[step.at]||s.board[step.at].controller!==q||u.controller===q)return true;
  A.bindControl(s,u,q,{});A.refreshContinuous(s);if(u.controller===q)(s.ongoingEffects||(s.ongoingEffects=[])).push({op:'peaceTruce',player:q,protected:p,after:s.turn});return true;
 }
 return true;
}
