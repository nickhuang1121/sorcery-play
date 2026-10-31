// Native Magic corrections found during the full-catalog source audit.
// Ordinary choices resolve after casting. The Monster's delegated damage is
// an ability, with separate one-damage instances in one simultaneous window.
export const catalogMagicDefinitions={
 begone:{cast:[{op:'banish',untargeted:true,select:{kind:'unit',minion:true,evil:true,anyRegion:true,untargeted:true}}]},
};
export const catalogMagicOperations=['catalogAssaultPoint','catalogAssaultApply'];
const actorFor=(s,source,A)=>{const u=A.unit(s,source.uid);return u&&!u.dying&&!A.disabled(u)?u:null;};
const candidates=(s,actor,A)=>s.units.filter(u=>!u.dying&&A.occupied(actor).some(at=>A.occupied(u).some(to=>A.nearby(at,to))));
function abilityQueue(s,steps,actor,p,A){A.queueEffects(s,steps,{...actor,abilityOrigin:actor.card},p,actor.card,{fresh:true,magicChoiceContext:null,abilityOrigin:actor.card});}
export function resolveCatalogMagic(s,frame,A){
 const {step,source,controller:p,selected}=frame;
 if(step.op==='assaultAlly'&&A.card(frame.effectCard).slug==='abyssal_assault'){
  const actor=A.unit(s,selected?.uid);if(actor&&!actor.dying&&!A.disabled(actor)&&A.power(actor)>0)abilityQueue(s,[{op:'catalogAssaultPoint',remaining:A.power(actor),picks:[]}],actor,p,A);
  return true;
 }
 if(!catalogMagicOperations.includes(step.op))return false;
 const actor=actorFor(s,source,A);if(!actor)return true;
 if(step.op==='catalogAssaultPoint'){
  if(step.remaining<=0||selected===null){abilityQueue(s,[{op:'catalogAssaultApply',picks:step.picks}],actor,p,A);return true;}
  const options=candidates(s,actor,A);
  if(selected===undefined){s.choice={player:p,title:'Abyssal Assault · 分配 '+step.remaining+' 個獨立傷害點',options:[...options.map(u=>({label:A.card(u.card).name,value:{entity:'unit',uid:u.uid}})),{label:'結束分配',value:null}],frame};return true;}
  if(!options.some(u=>u.uid===selected?.uid))throw Error('Abyssal Assault chosen unit is no longer in a nearby square');
  abilityQueue(s,[{...step,remaining:step.remaining-1,picks:[...step.picks,selected.uid]}],actor,p,A);return true;
 }
 const targets=step.picks.map(uid=>A.unit(s,uid));
 if(targets.some(u=>!u||u.dying||!candidates(s,actor,A).some(v=>v.uid===u.uid)))throw Error('Abyssal Assault simultaneous damage allocation is stale');
 const prior=s.damageWindow;s.damageWindow={wards:s.units.filter(u=>u.ward).map(u=>u.uid)};
 try{for(const u of targets)A.hurt(s,u,1,false,'ability',actor);
  for(const uid of s.damageWindow.hydras||[]){const u=A.unit(s,uid);if(u&&!u.lethal&&u.damage<A.power(u,true))u.damage=0;}
 }finally{if(prior)s.damageWindow=prior;else delete s.damageWindow;}
 return true;
}
