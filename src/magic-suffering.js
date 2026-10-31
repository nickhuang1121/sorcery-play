// Pure per-phase sacrifice planner. This does not simulate deaths or future
// opponent choices. Each phase must be built from its actual current realm.
export const sufferingKinds=Object.freeze(['minion','artifact','aura']);
export function sufferingEntities(s,player,A){
 const byUid=new Map();
 function add(o,kind){
  if(!o||o.dying||o.deathReplacementPending)return;
  const controller=kind==='artifact'&&A.artifactController?A.artifactController(s,o):o.controller;
  if(controller!==player)return;
  let entry=byUid.get(o.uid);if(!entry){entry={uid:o.uid,card:o.card,kinds:[]};byUid.set(o.uid,entry);}
  if(!entry.kinds.includes(kind))entry.kinds.push(kind);
 }
 for(const u of s.units||[]){const c=A.card(u.card);if(c.type==='Minion')add(u,'minion');if(c.artifactUnit)add(u,'artifact');if(u.finalAuraAnimation)add(u,'aura');}
 for(const o of s.artifacts||[])add(o,'artifact');
 for(const o of s.auras||[])add(o,'aura');
 return [...byUid.values()];
}
export function createSufferingPlan(player,kinds=sufferingKinds,required=false){
 if(![0,1].includes(player)||new Set(kinds).size!==kinds.length||kinds.some(k=>!sufferingKinds.includes(k)))throw Error('Invalid Suffering plan');
 return {player,kinds:[...kinds],required,picks:[]};
}
export function sufferingPlanOptions(s,plan,A){
 const kind=plan.kinds[plan.picks.length];if(!kind)return [];
 const used=new Set(plan.picks.map(p=>p.uid).filter(Boolean));
 return sufferingEntities(s,plan.player,A).filter(e=>e.kinds.includes(kind)&&!used.has(e.uid));
}
export function chooseSufferingPlan(s,plan,uid,A){
 const kind=plan.kinds[plan.picks.length];if(!kind)throw Error('Suffering plan is already complete');
 const options=sufferingPlanOptions(s,plan,A);
 if(uid===null){if(plan.required&&options.length)throw Error('Opponent must sacrifice a matching card');}
 else if(!options.some(o=>o.uid===uid))throw Error('Suffering card is no longer a legal distinct match');
 return {...plan,kinds:[...plan.kinds],picks:[...plan.picks,{kind,uid}]};
}
export function validateSufferingPlan(s,plan,A){
 if(plan.picks.length!==plan.kinds.length)throw Error('Suffering plan is incomplete');
 let checked=createSufferingPlan(plan.player,plan.kinds,plan.required);
 for(const pick of plan.picks){if(pick.kind!==checked.kinds[checked.picks.length])throw Error('Suffering match kind changed');checked=chooseSufferingPlan(s,checked,pick.uid,A);}
 return checked.picks.filter(p=>p.uid!==null);
}
