import {createFinalAvatarCopyPermit,queueFinalAvatarCopyWindow,finalAvatarCopyActions} from './final-avatars.js';
// Preserve the complete official pool. An unfinished outcome is a fixed blocked
// outcome, never a reason to reroll or silently shrink the distribution.
export const finalChaosDefinitions={chaoswish:{cast:[{op:'finalChaosChooseCaster'}]}};
export const experimentalFinalChaosDefinitions={};
export const finalChaosOperations=['finalChaosChooseCaster','finalChaosRandom','finalChaosCast','finalChaosUnsupported','finalChaosNext','finalChaosRepeatCount'];
export function chaosSpellPool(A){return A.cardCatalog.filter(c=>c.category==='Spell'&&!c.runtimeBase);}
const planFor=(s,id)=>(s.finalChaosRepeats||[]).find(plan=>plan.uid===id);
const casterValue=c=>({uid:c.uid,layer:c.layer||'surface',at:c.at,...(c.geometryCasterLocation?{geometryCasterLocation:structuredClone(c.geometryCasterLocation)}:{})});
const sameCaster=(a,b)=>a.uid===b.uid&&(a.layer||'surface')===(b.layer||'surface')&&a.at===b.at&&JSON.stringify(a.geometryCasterLocation)===JSON.stringify(b.geometryCasterLocation);
/** Engine calls only when a real Magic copy has committed. Token usage and all
 * ordinary cast triggers remain in the shared copy/casting implementation. */
export function finalChaosSpellSource(s,a,c,source){
 if(c.slug!=='chaoswish'||!a.avatarCopy)return source;
 const permit=(s.finalAvatarCopies||[]).find(copy=>copy.uid===a.avatarCopy&&copy.player===a.player&&copy.used),plan=permit&&planFor(s,permit.chaosPlan);
 if(!plan||plan.player!==a.player||plan.remaining<=0)return source;
 if(!permit.chaosRecorded){permit.chaosRecorded=true;plan.remaining--;plan.performed++;(plan.casts||(plan.casts=[])).push({permit:permit.uid,caster:a.caster,layer:a.casterLayer||source.layer||'surface',location:a.casterLocation||null,turn:s.turn});}
 return {...source,finalChaosPlan:plan.uid};
}
function launchRandomCopy(s,frame,id,A){
 const p=frame.controller,source=frame.step.caster;
 if(!A.card(id).playable){A.queueEffects(s,[{op:'finalChaosUnsupported',card:id,caster:source}],frame.source,p,frame.effectCard);return;}
 if(A.card(id).slug==='chaoswish'&&frame.step.repeatOffer){
  A.queueEffects(s,[{op:'finalChaosRepeatCount',card:id,caster:source,authority:frame.step.repeatOffer}],frame.source,p,frame.effectCard);return;
 }
 const permit=createFinalAvatarCopyPermit(s,p,[id],source,{kind:'Chaoswish',free:true,ignoreThreshold:true,caster:source.uid,casterLayer:source.layer||'surface',casterLocation:source.geometryCasterLocation});
 const plan=planFor(s,frame.step.repeatPlan);
 A.queueEffects(s,[{op:'finalChaosNext',player:1-p,...(plan?{repeatPlan:plan.uid}:{})}],source,p,frame.effectCard);
 if(A.card(id).slug==='chaoswish'&&plan?.remaining>0)permit.chaosPlan=plan.uid;
 queueFinalAvatarCopyWindow(s,permit,source,A);
 // Only a declared Chaoswish repetition can be automatic. Other random spells
 // keep every ordinary target/mode/placement choice in the shared copy window.
 if(permit.chaosPlan){const actions=finalAvatarCopyActions(s,permit,A);if(actions.length===1)A.beginCast(s,actions[0]);}
}
function countChoice(s,frame,digits){
 const {authority,caster}=frame.step,player=authority.player;
 const options=digits===undefined?[1,2,3,5,10,20,50,100].map(count=>({label:'額外施放 '+count+' 次 Chaoswish（逐次結算；對手仍各有複製機會）',value:{count}})):[...Array(10)].flatMap((_,digit)=>Number.isSafeInteger(Number(digits+digit))?[{label:'輸入 '+digit,value:{digit}}]:[]);
 if(digits===undefined)options.push({label:'輸入其他有限次數（逐位十進位）',value:{custom:true}});
 else {if(Number(digits)>0)options.unshift({label:'確認額外 '+Number(digits)+' 次',value:{count:Number(digits)}});if(digits.length)options.push({label:'刪除末位',value:{erase:true}});options.push({label:'返回快捷次數',value:{back:true}});}
 s.choice={player,title:'Kythera · 宣告有限額外 Chaoswish 次數'+(digits===undefined?'':'：'+(digits||'尚未輸入'))+'；沿用已選施法者 '+caster.uid,options,frame:{...frame,step:{...frame.step,...(digits===undefined?{}:{digits})}}};
}
export function resolveFinalChaos(s,frame,A){
 const {step,source,controller:p,selected}=frame;if(!finalChaosOperations.includes(step.op))return false;
 const queue=(steps,player=p,src=source)=>A.queueEffects(s,steps,src,player,frame.effectCard);
 if(step.op==='finalChaosRepeatCount'){
  if(selected===undefined){countChoice(s,frame,step.digits);return true;}
  if(selected.custom){countChoice(s,frame,'');return true;}
  if(selected.back){const {digits,...rest}=step;countChoice(s,{...frame,step:rest});return true;}
  if(selected.erase){countChoice(s,frame,(step.digits||'').slice(0,-1));return true;}
  if(Number.isInteger(selected.digit)&&selected.digit>=0&&selected.digit<=9){const digits=(step.digits||'')+selected.digit;if(Number.isSafeInteger(Number(digits)))countChoice(s,frame,digits);return true;}
  if(Number.isSafeInteger(selected.count)&&selected.count>0){
   const plan={uid:'chaosRepeat'+s.next++,player:p,authority:step.authority,caster:structuredClone(step.caster),requested:selected.count,remaining:selected.count,performed:0,created:s.turn,status:'running'};
   (s.finalChaosRepeats||(s.finalChaosRepeats=[])).push(plan);A.log(s,'Kythera · 宣告額外 '+plan.requested+' 次 Chaoswish；逐次真施放，保留對手每次複製機會');
   queue([{op:'finalChaosCast',card:step.card,caster:step.caster,repeatPlan:plan.uid}]);
  }return true;
 }
 if(step.op==='finalChaosChooseCaster'){
  const casters=A.casters(s,p),plan=planFor(s,source.finalChaosPlan);
  if(plan&&plan.player===p&&plan.status==='running'&&plan.authority.player===p){
   if(plan.performed%32===0&&plan.remaining>0&&selected!=='continue'){s.choice={player:p,title:'Kythera · 繼續已宣告批次（尚餘 '+plan.remaining+' 次）',options:[{label:'繼續逐次結算',value:'continue'}],frame};return true;}
   const caster=casters.find(c=>sameCaster(c,plan.caster));
   if(caster){queue([{op:'finalChaosRandom',caster:structuredClone(caster),repeatPlan:plan.uid}]);return true;}
   plan.status='interrupted';plan.reason='已宣告施法者或其完整location已不合法';plan.remaining=0;
  }
  const options=casters.map(caster=>({label:A.card(caster.card).name+' · '+(caster.layer||'surface')+' · '+String.fromCharCode(65+caster.at%5)+(4-Math.floor(caster.at/5)),value:casterValue(caster)}));
  if(selected===undefined||selected==='continue'){if(options.length)s.choice={player:p,title:'Chaoswish · 先選施法者，再產生隨機法術',options,frame};else queue([{op:'finalChaosNext',player:1-p}]);return true;}
  const caster=casters.find(c=>sameCaster(c,selected));if(caster)queue([{op:'finalChaosRandom',caster:structuredClone(caster),...(plan?.status==='running'?{repeatPlan:plan.uid}:{})}]);return true;
 }
 if(step.op==='finalChaosRandom'){
  const pool=chaosSpellPool(A);if(!pool.length)return true;
  const plan=planFor(s,step.repeatPlan),authority=A.randomDecisionController?.(s,p),chaosIndex=pool.findIndex(c=>c.slug==='chaoswish');
  const authorization=plan?.status==='running'&&plan.remaining>0?{...plan.authority,index:chaosIndex}:null;
  const picked=pool[A.rollIndex(s,pool.map(c=>c.name),authorization)];A.log(s,'Chaoswish · 隨機法術：'+picked.name);
  if(plan&&picked.slug!=='chaoswish'){plan.status=plan.remaining?'interrupted':'complete';plan.finalCard=picked.id;if(plan.remaining)plan.reason='隨機控制來源已改變；保留實際結果，取消未執行意向';plan.remaining=0;}
  const repeatPlan=picked.slug==='chaoswish'&&plan?.remaining>0?plan.uid:undefined;
  const repeatOffer=picked.slug==='chaoswish'&&!repeatPlan&&authority?.kind==='kythera'?authority:undefined;
  queue([{op:'finalChaosCast',card:picked.id,caster:step.caster,...(repeatPlan?{repeatPlan}:{}),...(repeatOffer?{repeatOffer}:{})}]);return true;
 }
 if(step.op==='finalChaosCast'){launchRandomCopy(s,frame,step.card,A);return true;}
 if(step.op==='finalChaosUnsupported'){
  if(A.card(step.card).playable){launchRandomCopy(s,frame,step.card,A);return true;}
  s.choice={player:p,title:'Chaoswish 暫停：'+A.card(step.card).name+' 的實際效果尚未完成；保留同一抽取結果',manual:true,options:[{label:'重試同一張（須先完成該卡實作，不能重抽）',value:'retry'}],frame};return true;
 }
 if(step.op==='finalChaosNext'){
  const plan=planFor(s,step.repeatPlan);if(plan?.status==='running'&&plan.remaining>0){plan.status='interrupted';plan.reason='已施放的複本未繼續結算；不偽造剩餘施放或複製機會';plan.remaining=0;}
  const player=step.player;
  if(selected===undefined){s.choice={player,title:'Chaoswish · 下一位玩家可複製本法術',options:[{label:'複製 Chaoswish',value:true},{label:'這次不複製',value:false}],frame};return true;}
  if(selected===true){A.log(s,'Chaoswish · 玩家 '+(player+1)+' 建立法術複本');queue([{op:'finalChaosChooseCaster'}],player,{...source,controller:player});}return true;
 }
 return true;
}
