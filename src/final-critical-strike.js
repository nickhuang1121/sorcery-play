// Waiting effects are global: they do not yet apply to a particular card and
// therefore are deliberately absent from a Kairos card archive.
export const criticalStrikeOperations=['criticalStrike'];
export function criticalStrikeWaiting(s,player){return (s.ongoingEffects||[]).filter(e=>e.op==='criticalStrikeWaiting'&&e.controller===player&&e.end===s.turn);}
export function resolveCriticalStrike(s,frame){
 if(frame.step.op!=='criticalStrike')return false;
 (s.ongoingEffects||(s.ongoingEffects=[])).push({op:'criticalStrikeWaiting',uid:'critical'+s.next++,controller:frame.controller,end:s.turn,card:frame.effectCard||frame.source.card});
 return true;
}
export function claimCriticalStrike(s,source,allocations,A){
 const waiting=criticalStrikeWaiting(s,source.controller);
 if(!waiting.length)return [];
 const units=allocations.filter(a=>{const target=A.unit(s,a.uid);return target&&!target.siteProxy&&['Minion','Avatar'].includes(A.card(target.card).type);});
 if(!units.length)return [];
 const ids=new Set(waiting.map(e=>e.uid));s.ongoingEffects=s.ongoingEffects.filter(e=>!ids.has(e.uid));
 return waiting;
}
// A fight's simultaneous strike plans share one temporal event. Snapshot
// before consuming any controller's marker, so iteration order cannot select
// just one of multiple allied defenders. Each strike still has its own damage
// modifications and its own allocation.
export function prepareCriticalStrikeWindow(s,plans,A){
 const captured={},spent=new Set();
 for(const plan of plans){
  const source=A.unit(s,plan.uid);if(!source||source.dying||A.disabled(source))continue;
  const hitsUnit=(plan.allocations||[]).some(a=>{const target=A.unit(s,a.uid);return target&&!target.siteProxy&&['Minion','Avatar'].includes(A.card(target.card).type);});
  if(!hitsUnit)continue;
  const waiting=criticalStrikeWaiting(s,source.controller);captured[plan.uid]=waiting;
  for(const effect of waiting)spent.add(effect.uid);
 }
 s.ongoingEffects=(s.ongoingEffects||[]).filter(e=>!spent.has(e.uid));
 return captured;
}
