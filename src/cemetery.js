// Keep the public array of card IDs compatible with saved games and the UI,
// while tracking each cemetery visit separately. A new visit gets a new ID.
function record(s,id,deathTurn=null){const next=s.nextGrave||1+Math.max(0,...s.players.flatMap(pl=>(pl.graves||[]).map(g=>Number(g.uid.slice(1))||0)));s.nextGrave=next+1;return {uid:'g'+next,card:id,deathTurn};}
export function syncGraves(s,p){
  const pl=s.players[p];if(!Array.isArray(pl.graves))pl.graves=[];const old=pl.graves,pools=new Map();
  if(old.length===pl.cemetery.length&&old.every((g,i)=>g.card===pl.cemetery[i]))return;
  for(const g of old){if(!pools.has(g.card))pools.set(g.card,[]);pools.get(g.card).push(g);}
  pl.graves=pl.cemetery.map(id=>pools.get(id)?.shift()||record(s,id));
}
export function graveEntries(s,p){return s.players[p].cemetery.map((id,index)=>{const g=s.players[p].graves?.[index];return {entity:'grave',player:p,index,card:id,uid:g?.card===id?g.uid:null,deathTurn:g?.card===id?g.deathTurn:null};});}
export function appendGrave(s,p,id,deathTurn=null){syncGraves(s,p);s.players[p].cemetery.push(id);const g=record(s,id,deathTurn);s.players[p].graves.push(g);return g;}
export function takeGrave(s,p,index,id,uid){
  syncGraves(s,p);const pl=s.players[p],g=pl.graves[index];
  if(pl.cemetery[index]!==id||!g||uid&&g.uid!==uid)throw Error('墓地選擇已失效');
  pl.cemetery.splice(index,1);pl.graves.splice(index,1);return g;
}
export function removeGraves(s,p,predicate){
  syncGraves(s,p);const removed=[];
  for(let i=s.players[p].cemetery.length-1;i>=0;i--)if(predicate(s.players[p].cemetery[i]))removed.unshift(takeGrave(s,p,i,s.players[p].cemetery[i]).card);
  return removed;
}
