// Delay only the cemetery transition, preserving native removal/death processing.
export function beginSacrificeCost(s, victims, controller, sourceUid) {
  if(!victims.length)return null;
  const existing=s.sacrificeCostWindows||{};
  const unique=new Set();
  for(const v of victims){
    if(!v?.object?.uid||unique.has(v.object.uid))throw Error('Invalid/duplicate physical sacrifice cost');
    if(v.object.dying||v.object.sacrificeCostId||Object.values(existing).some(w=>w.victims.some(p=>p.uid===v.object.uid)))throw Error('A dying or already committed card cannot pay another sacrifice cost');
    unique.add(v.object.uid);
  }
  const costs=s.sacrificeCostWindows||(s.sacrificeCostWindows={});
  const id='sacrifice-cost:'+s.next++;
  costs[id]={id,controller,sourceUid,victims:victims.map(v=>({kind:v.kind,uid:v.object.uid,at:v.at??v.object.at})),entries:[]};
  for(const v of victims)v.object.sacrificeCostId=id;
  return id;
}
export function deferSacrificeCemetery(s, object, entry) {
  // entry's card must be the physical original/base card after native normalization.
  // Tokens/banishment/return-to-hand are not the cemetery exception.
  if(entry.zone!=='cemetery')return false;
  const record=s.sacrificeCostWindows?.[object?.sacrificeCostId]||Object.values(s.sacrificeCostWindows||{}).find(w=>w.victims.some(v=>v.uid===object?.uid));
  if(!record)return false;
  record.entries.push({...entry,physicalUid:object.uid});
  return true;
}
export function finishSacrificeCost(s, id, sendCard) {
  const record=s.sacrificeCostWindows?.[id];if(!record)return false;
  // Remove before sending so replacement/trigger callbacks cannot enqueue into
  // the closed bundle. Use existing sendCard NOW so cemetery replacement effects
  // are evaluated when entry really happens, after the ability resolves.
  delete s.sacrificeCostWindows[id];
  if(!Object.keys(s.sacrificeCostWindows).length)delete s.sacrificeCostWindows;
  for(const e of record.entries)sendCard(s,e.owner,e.card,e.zone,e.deathTurn??null);
  return true;
}
