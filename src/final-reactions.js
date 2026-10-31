// Timing exceptions are explicit storyline windows. Real casting costs are
// checked against the unchanged game state (zero mana on the opponent's turn).
export const finalReactionDefinitions={
 dodge_roll:{cast:[{op:'finalDodgeRoll'}]},
 valor:{cast:[{op:'finalValor'}]},
};
export const finalReactionOperations=['finalReactionWindow','finalReactionResume','finalDodgeRoll','finalValor'];
const slugFor={dodge:'dodge_roll',valor:'valor'};
const layer=u=>u.layer||'surface';
const live=(s,uid,A)=>{const u=A.unit(s,uid);return u&&!u.dying?u:null;};
function contextEligible(s,context,A){
 const subject=live(s,context.subject,A),attacker=live(s,context.attacker,A);
 if(!subject||!attacker||subject.controller!==context.player)return false;
 if(context.kind==='dodge')return A.regionsOverlap(s,subject,attacker)&&A.occupied(subject).some(at=>A.occupied(attacker).includes(at));
 return context.kind==='valor'&&s.pending?.kind==='attack'&&s.pending.defenders.includes(subject.uid)&&!(s.pending.targets||[s.pending.target]).includes(subject.uid);
}
export function finalReactionCastAllowed(s,p,c){
 if(!['dodge_roll','valor'].includes(c.slug))return true;
 const context=s.finalReactionContext;
 // Archimago's direct FAQ excludes these from an empty main-phase storyline.
 // Their stated attack/defense timing is a requirement, not an empty-cast option.
 if(!context)return false;
 return context.player===p&&slugFor[context.kind]===c.slug;
}
export function finalReactionActions(s,context,A){
 if(!contextEligible(s,context,A))return [];
 const p=context.player,preview=structuredClone(s);preview.choice=null;preview.pending=null;preview.phase='main';preview.active=p;preview.finalReactionContext=context;
 const hands=new Set(s.players[p].hand.filter(h=>A.card(h.card).slug===slugFor[context.kind]).map(h=>h.uid));
 return A.legalActions(preview,p).filter(action=>action.type==='cast'&&hands.has(action.hand)&&!action.payment).filter(action=>{
  const c=A.card(s.players[p].hand.find(h=>h.uid===action.hand).card),caster=A.unit(s,action.caster)||(s.artifacts||[]).find(a=>a.uid===action.caster)||action.caster;
  return A.castingCost(s,p,c,action.at,caster,action.payment,0,action.layer||'surface',action)<=A.resources(s,p).available;
 });
}
function queueWindow(s,context,source,A){
 if(finalReactionActions(s,context,A).length){if(context.kind==='valor'&&s.pending)s.pending.resolvingReaction=true;A.queueEffects(s,[{op:'finalReactionWindow',context}],source,context.player,A.card(slugFor[context.kind]).id);}
}
export function queueDodgeReaction(s,attacker,pending,A){
 if(pending.kind!=='attack')return;
 for(const uid of [...(pending.targets||[pending.target])].reverse()){const target=live(s,uid,A);if(target)queueWindow(s,{kind:'dodge',player:target.controller,subject:target.uid,attacker:attacker.uid},target,A);}
}
export function queueValorReaction(s,defender,pending,A){
 if(pending?.kind!=='attack'||!defender||(pending.targets||[pending.target]).includes(defender.uid))return;
 queueWindow(s,{kind:'valor',player:defender.controller,subject:defender.uid,attacker:pending.attacker},defender,A);
}
export function resolveFinalReactions(s,frame,A){
 const {step,source,controller:p,selected}=frame;if(!finalReactionOperations.includes(step.op))return false;
 const queue=steps=>A.queueEffects(s,steps,source,p,frame.effectCard);
 if(step.op==='finalReactionWindow'){
  const context=step.context,actions=finalReactionActions(s,context,A);
  if(selected===undefined){if(!actions.length&&s.pending?.attacker===context.attacker)delete s.pending.resolvingReaction;if(actions.length)s.choice={player:context.player,title:context.kind==='dodge'?'Dodge Roll · 被攻擊時':'Valor · 盟友完成防禦',options:[...actions.map(action=>({label:A.card(s.players[context.player].hand.find(h=>h.uid===action.hand).card).name+' · '+(A.unit(s,action.caster)?A.card(A.unit(s,action.caster).card).name:action.caster),value:action})),{label:'略過反應',value:null}],frame};return true;}
  if(selected===null){if(s.pending?.attacker===context.attacker)delete s.pending.resolvingReaction;return true;}
  const action=actions.find(action=>JSON.stringify(action)===JSON.stringify(selected));if(!action)return true;
  queue([{op:'finalReactionResume',context,previous:s.finalReactionContext||null}]);s.finalReactionContext=context;A.beginCast(s,action);return true;
 }
 if(step.op==='finalReactionResume'){
  if(step.previous)s.finalReactionContext=step.previous;else delete s.finalReactionContext;
  queue([{op:'finalReactionWindow',context:step.context}]);return true;
 }
 const context=s.finalReactionContext;
 if(!context||context.player!==p||!contextEligible(s,context,A))return true;
 const subject=live(s,context.subject,A);
 if(step.op==='finalValor'){
  if(context.kind==='valor'&&!A.unmodifiable(subject))subject.mods.push({power:4,end:s.turn});return true;
 }
 if(context.kind!=='dodge')return true;
 const options=A.locations(s,subject,A.card,A.keywords,true).filter(to=>to.path.length===1&&A.occupied(subject).some(at=>A.occupied({...subject,at:to.at}).some(next=>A.distance(at,next)<=1))).map(to=>({label:String.fromCharCode(65+to.at%5)+(4-Math.floor(to.at/5))+' · '+to.layer,value:{at:to.at,layer:to.layer}}));
 if(selected===undefined){s.choice={player:p,title:'Dodge Roll · 走到另一個相鄰位置',options:[...options,{label:'不移動',value:null}],frame};return true;}
 const to=options.find(o=>o.value.at===selected?.at&&o.value.layer===selected.layer)?.value;
 if(to){subject.at=to.at;subject.layer=to.layer;subject.notRest=true;subject.burrowedSafely=false;}
 return true;
}
