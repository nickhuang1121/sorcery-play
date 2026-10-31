import {blastedOakTargets,blastedOakTargetRank} from './final-passives.js';
import {gridPatterns,placedGrid} from './final-grids.js';
import {globeActive} from './final-geometry.js';
// Cast-time targets, with a separate ally selected solely to plan legal effects.
// Casting Magics requires direct targets before payment. These three cards use
// target as a noun; Joust explicitly makes the ally target and stays distinct.
export const compositeMagicSlugs=['duel','harpyon_urge','trial_by_water'];
export const magicDeclarationOperations=['magicDeclareComposite','magicDeclareGrasp','magicGraspApply','magicDeclareMeteor'];
export function magicDeclarationTargets(declaration){return declaration?.sites|| (declaration?.plans?declaration.plans.map(v=>v.target):declaration?.target?[declaration.target]:[]);}
const live=(s,id,A)=>{const u=A.unit(s,id);return u&&!u.dying?u:null;};
const layer=u=>u.layer||'surface';
const same=(s,a,b,A)=>A.regionsOverlap(s,a,b)&&A.occupied(a).some(at=>A.occupied(b).includes(at));
export function compositeMagicTargets(s,slug,caster,ally,p,A,{oak=true}={}){
 if(!ally||ally.controller!==p||ally.dying||slug==='duel'&&A.disabled(ally))return [];
 const c=A.card(slug),filter={kind:'unit',...(slug==='duel'?{enemy:true}:{minion:true})};
 let options=A.selectEffects(s,{source:caster,controller:p,effectCard:c.id},filter).filter(o=>{
  const victim=live(s,o.value.uid,A);if(!victim||!A.regionsOverlap(s,ally,victim))return false;
  if(slug==='duel')return A.occupied(ally).some(at=>A.occupied(victim).some(to=>A.distance(at,to)<=1));
  if(slug==='harpyon_urge')return A.power(victim)<A.power(ally)&&!same(s,ally,victim,A);
  return A.occupied(ally).some(at=>A.occupied(victim).some(to=>A.nearby(at,to)));
 });
 if(!oak)return options;
 const permitted=new Set(compositeMagicPlans(s,slug,caster,p,A).filter(v=>v.ally===ally.uid).map(v=>v.value.uid));
 return options.filter(o=>permitted.has(o.value.uid));
}
export function compositeMagicPlans(s,slug,caster,p,A){
 const first=A.definitions[A.card(slug).slug]?.cast?.[0];if(!first?.select)return [];
 const allies=A.selectEffects(s,{source:caster,controller:p,effectCard:A.card(slug).id},{...first.select,untargeted:true});
 const plans=allies.flatMap(o=>compositeMagicTargets(s,slug,caster,live(s,o.value.uid,A),p,A,{oak:false}).map(target=>({...target,ally:o.value.uid})));
 return blastedOakTargets(s,plans,{spell:true},A);
}
export function filterMagicPlanningChoices(s,c,caster,p,options,A){
 if(!compositeMagicSlugs.includes(c.slug))return options;
 const allowed=new Set(compositeMagicPlans(s,c.slug,caster,p,A).map(v=>v.ally));
 return options.filter(o=>allowed.has(o.value.uid));
}
export function magicPlanningOptions(s,c,caster,p,filter,A){
 const options=A.selectEffects(s,{source:caster,controller:p,effectCard:c.id},{...filter,...(compositeMagicSlugs.includes(c.slug)?{untargeted:true}:{})});
 return filterMagicPlanningChoices(s,c,caster,p,options,A);
}
export function compositeCopyTargets(s,record,A){
 const slug=A.card(record.card).slug;if(['grasping_ground','meteor_shower'].includes(slug))return [{label:'宣告整組新目標',value:'multi-new'}];if(!compositeMagicSlugs.includes(slug))return null;
 return compositeMagicPlans(s,slug,record.source,record.player,A).map(o=>({label:A.card(A.unit(s,o.ally).card).name+' → '+o.label,value:{entity:'unit',uid:o.ally,magicDeclaration:{slug,ally:o.ally,target:structuredClone(o.value),caster:structuredClone(record.source)}}}));
}
export function beginGraspCopyDeclaration(s,record,A){
 if(A.card(record.card).slug==='meteor_shower'){meteorChoice(s,{source:structuredClone(record.source),controller:record.player,effectCard:record.card,zoneAccessScope:record.scope,step:{op:'magicDeclareMeteor',copy:record.uid,sites:[]}},A);return;}
 const actors=graspActors(s,record.player,A).map(u=>u.uid);
 graspChoice(s,{source:structuredClone(record.source),controller:record.player,effectCard:record.card,zoneAccessScope:record.scope,step:{op:'magicDeclareGrasp',copy:record.uid,actors,index:0,plans:[]}},A);
}
export function beforeMagicDeclaration(s,a,declared,A){
 const c=A.castingCard(s,a);if(!c)return false;
 if(c.slug==='meteor_shower'){
  if(a.magicDeclaration){if(!validMeteorDeclaration(s,a.magicDeclaration,A))throw Error('Meteor Shower declarations are no longer legal');return false;}
  const caster=A.spellcaster(s,a.caster,a.casterLayer,a.casterLocation);meteorChoice(s,{source:structuredClone(caster),controller:a.player,effectCard:c.id,step:{op:'magicDeclareMeteor',action:a,sites:[]}},A);return true;
 }
 if(c.slug==='grasping_ground'){
  if(a.magicDeclaration){if(a.magicDeclaration.slug!==c.slug||!validateGraspDeclaration(s,a.magicDeclaration,a.player,A))throw Error('Grasping Ground declarations are no longer legal');return false;}
  const caster=A.spellcaster(s,a.caster,a.casterLayer,a.casterLocation),actors=graspActors(s,a.player,A).map(u=>u.uid);
  graspChoice(s,{source:structuredClone(caster),controller:a.player,effectCard:c.id,step:{op:'magicDeclareGrasp',action:a,actors,index:0,plans:[]}},A);return true;
 }
 if(!compositeMagicSlugs.includes(c.slug))return false;
 if(a.magicDeclaration){
  const d=a.magicDeclaration,ally=live(s,d.ally,A),caster=A.spellcaster(s,a.caster,a.casterLayer,a.casterLocation);
  if(!caster||d.slug!==c.slug||!compositeMagicTargets(s,c.slug,caster,ally,a.player,A).some(o=>o.value.uid===d.target.uid))throw Error('Declared Magic target is no longer legal');
  return false;
 }
 const ally=live(s,declared?.uid,A),caster=A.spellcaster(s,a.caster,a.casterLayer,a.casterLocation);if(!ally||!caster)return true;
 const frame={source:structuredClone(caster),controller:a.player,effectCard:c.id,selectorSemantics:{role:'target',source:'magic',timing:'cast'},step:{op:'magicDeclareComposite',action:a,ally:ally.uid}};
 const options=compositeMagicTargets(s,c.slug,caster,ally,a.player,A);
 s.choice={player:a.player,title:c.name+' · 宣告固定目標（確認前可取消）',options:[...options,{label:'取消施放（不支付費用）',value:null}],frame};
 return true;
}
function graspActors(s,p,A){return s.units.filter(u=>!u.dying&&u.controller===p&&layer(u)==='below'&&A.regionNames(s,u).has('underground'));}
export function graspMagicTargets(s,caster,actor,p,A,{oak=true}={}){
 if(!actor||!graspActors(s,p,A).some(u=>u.uid===actor.uid))return [];
 const options=A.selectEffects(s,{source:caster,controller:p,effectCard:A.card('grasping_ground').id},{kind:'unitOrArtifact',minion:true}).filter(o=>{
  const victim=o.value.entity==='unit'?live(s,o.value.uid,A):(s.artifacts||[]).find(v=>v.uid===o.value.uid);
  return victim&&layer(victim)==='surface'&&A.occupied(victim).some(at=>A.occupied(actor).includes(at));
 });
 return oak?blastedOakTargets(s,options,{spell:true},A):options;
}
function graspChoice(s,frame,A){
 const {step,controller:p}=frame,actor=live(s,step.actors[step.index],A),options=actor?graspMagicTargets(s,frame.source,actor,p,A):[];
 s.choice={player:p,title:'Grasping Ground · '+(actor?A.card(actor.card).name:'確認全部目標')+'（付款前）',options:actor?[...options,{label:'這位盟友不拉下目標',value:'skip'},{label:'取消施放',value:null}]:[{label:'確認全部目標並施放',value:'commit'},{label:'取消施放',value:null}],frame:{...frame,selectorSemantics:actor?{role:'target',source:'magic',timing:'cast'}:{role:'choose',source:'magic',timing:'cast'}}};
}
function validateGraspDeclaration(s,d,p,A){
 if(!Array.isArray(d.plans)||!Array.isArray(d.actors)||new Set(d.actors).size!==d.actors.length||new Set(d.plans.map(v=>v.actor)).size!==d.plans.length)return false;
 for(const id of d.actors)if(!d.plans.some(v=>v.actor===id)&&graspMagicTargets(s,d.caster,live(s,id,A),p,A).some(o=>blastedOakTargetRank(s,o.value,A)<Infinity))return false;
 return d.plans.every(plan=>d.actors.includes(plan.actor)&&graspMagicTargets(s,d.caster,live(s,plan.actor,A),p,A).some(o=>o.value.uid===plan.target.uid&&o.value.entity===plan.target.entity));
}
export function meteorDeclarationCandidates(s,frame,picks,A){
 const sites=A.selectEffects(s,frame,{kind:'site'}).filter(o=>!picks.some(p=>p.at===o.value.at)&&picks.every(p=>A.distance(p.at,o.value.at)!==1));
 const options=sites.filter(o=>{
  function finish(chosen){if(chosen.length===3)return true;return sites.some(next=>!chosen.includes(next.value.at)&&chosen.every(at=>A.distance(at,next.value.at)!==1)&&finish([...chosen,next.value.at]));}
  return finish([...picks.map(p=>p.at),o.value.at]);
 }).map(o=>({...o,value:{...o.value,siteUid:s.board[o.value.at]?.uid}}));
 return blastedOakTargets(s,options,{spell:true},A);
}
function meteorChoice(s,frame,A){
 const done=frame.step.sites.length===3,options=done?[{label:'確認三個目標並施放',value:'commit'}]:meteorDeclarationCandidates(s,frame,frame.step.sites,A);
 s.choice={player:frame.controller,title:'Meteor Shower · '+(done?'確認三個固定目標':'宣告第 '+(frame.step.sites.length+1)+' 個地點')+'（付款前）',options:[...options,{label:'取消施放',value:null}],frame:{...frame,selectorSemantics:{role:done?'choose':'target',source:'magic',timing:'cast'}}};
}
function validMeteorDeclaration(s,d,A){return d?.slug==='meteor_shower'&&d.sites?.length===3&&new Set(d.sites.map(v=>v.at)).size===3&&d.sites.every(v=>s.board[v.at]&&s.board[v.at].uid===v.siteUid&&d.sites.every(w=>w.at===v.at||A.distance(w.at,v.at)!==1));}
export function resolveMagicDeclaration(s,frame,A){
 const {step,controller:p,selected}=frame;
 if(step.op==='magicDeclareMeteor'){
  if(selected===null)return true;
  if(selected==='commit'){
   const declaration={slug:'meteor_shower',sites:step.sites,caster:structuredClone(frame.source)};if(!validMeteorDeclaration(s,declaration,A))return true;
   if(step.copy)A.queueEffects(s,[{op:'finalOrbGraspCommitted',copy:step.copy,declaration}],frame.source,p,frame.effectCard,{scope:frame.zoneAccessScope||s.zoneAccessScope});
   else A.commitSpell(s,{...step.action,magicDeclaration:declaration});return true;
  }
  const picked=meteorDeclarationCandidates(s,frame,step.sites,A).find(o=>o.value.at===selected?.at&&o.value.siteUid===selected.siteUid)?.value;
  if(picked)meteorChoice(s,{...frame,step:{...step,sites:[...step.sites,picked]}},A);return true;
 }
 if(step.op==='magicDeclareGrasp'){
  if(selected===null)return true;
  if(selected==='commit'){
   if(step.index<step.actors.length)return true;
   const declaration={slug:'grasping_ground',actors:step.actors,plans:step.plans,caster:structuredClone(frame.source)};
   if(validateGraspDeclaration(s,declaration,p,A)){
    if(step.copy)A.queueEffects(s,[{op:'finalOrbGraspCommitted',copy:step.copy,declaration}],frame.source,p,frame.effectCard,{scope:frame.zoneAccessScope||s.zoneAccessScope});
    else A.commitSpell(s,{...step.action,magicDeclaration:declaration});
   }return true;
  }
  const actor=live(s,step.actors[step.index],A);
  if(selected!=='skip'&&!graspMagicTargets(s,frame.source,actor,p,A).some(o=>o.value.uid===selected?.uid&&o.value.entity===selected.entity))return true;
  const plans=selected==='skip'?step.plans:[...step.plans,{actor:actor.uid,target:structuredClone(selected)}];
  graspChoice(s,{...frame,step:{...step,index:step.index+1,plans}},A);return true;
 }
 if(step.op==='magicGraspApply'){
  const actor=live(s,step.plan.actor,A),pick=graspMagicTargets(s,step.caster,actor,p,A,{oak:false}).find(o=>o.value.uid===step.plan.target.uid&&o.value.entity===step.plan.target.entity)?.value;
  const victim=pick&&(pick.entity==='unit'?live(s,pick.uid,A):(s.artifacts||[]).find(o=>o.uid===pick.uid));
  if(!victim||A.blocked(s,p,victim))return true;
  if(pick.entity==='unit'&&(!A.fiftyForceAllowed(s,victim,p,A)||!A.occupied(victim).every(at=>A.canEnterOnGround(s,victim,{at,layer:layer(victim)},{at,layer:'below'},A.card,A.keywords,false))))return true;
  if(pick.entity==='artifact')victim.bearer=null;victim.layer='below';victim.notRest=true;victim.burrowedSafely=false;return true;
 }
 if(step.op==='magicDeclareComposite'){
  if(selected===null)return true;
  const a=step.action,c=A.castingCard(s,a),caster=A.spellcaster(s,a.caster,a.casterLayer,a.casterLocation),ally=live(s,step.ally,A);
  if(!c||!caster||!compositeMagicTargets(s,c.slug,caster,ally,p,A).some(o=>o.value.uid===selected?.uid))return true;
  A.commitSpell(s,{...a,magicDeclaration:{slug:c.slug,ally:ally.uid,target:structuredClone(selected),caster:structuredClone(caster)}},{entity:'unit',uid:ally.uid});return true;
 }
 const d=step.magicDeclaration;
 if(d?.slug==='meteor_shower'&&step.op==='finalGridMeteor'){
  const patterns=['meteor_large','meteor_medium','meteor_small'],grid=[];
  for(let i=0;i<d.sites.length;i++){const pick=d.sites[i],site=s.board[pick.at];if(site&&site.uid===pick.siteUid&&!A.blocked(s,p,site))grid.push(...placedGrid(pick.at,gridPatterns[patterns[i]],0,globeActive(s,A.card)));}
  A.queueEffects(s,[{op:'finalGridApply',grid,atopSites:true}],frame.source,p,frame.effectCard);return true;
 }
 if(d?.slug==='grasping_ground'&&step.op==='fiftyGrasp'){A.queueEffects(s,d.plans.map(plan=>({op:'magicGraspApply',plan,caster:d.caster})),frame.source,p,frame.effectCard);return true;}
 if(!d||!['duelChoose','fiftyFlyAlly','trialWaterChoose'].includes(step.op))return false;
 const ally=live(s,d.ally,A),victim=live(s,d.target?.uid,A);
 if(!victim||!compositeMagicTargets(s,d.slug,d.caster,ally,p,A,{oak:false}).some(o=>o.value.uid===victim.uid))return true;
 if(A.blocked(s,p,victim))return true;
 if(d.slug==='duel')A.fight(s,{attacker:ally.uid,defenders:[victim.uid],kind:'spell',remote:true});
 else if(d.slug==='harpyon_urge')A.queueEffects(s,[{op:'fiftyPathDeclare',uid:ally.uid,target:victim.uid,flying:true,finish:'strike'}],ally,p,frame.effectCard);
 else if(layer(victim)==='surface'&&A.occupied(victim).every(at=>A.waterSite(s,at,A.card))&&A.fiftyForceAllowed(s,victim,p,A)&&A.occupied(victim).every(at=>A.canEnterOnGround(s,victim,{at,layer:'surface'},{at,layer:'below'},A.card,A.keywords,false))){victim.layer='below';victim.burrowedSafely=false;victim.notRest=true;}
 return true;
}
