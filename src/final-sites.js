import {siteEffectAllowed} from './final-ability-layers.js';
// Rules verified against the official card pages/FAQs on 2026-10-30.
// All selections and declared routes are plain data and survive save/restore.
export const finalSiteDefinitions={
  orpheus_crossing:{genesis:[{op:'finalOrpheus'}]},
  darkest_dungeon:{genesis:[{op:'finalDungeonArm'}]},
  mudslide:{genesis:[{op:'finalMudslide'}]},
};
export const finalSitePassives={mount_ussar_sanctuary:{finalSanctuary:true}};
export const finalSiteOperations=['finalOrpheus','finalOrpheusSummon','finalDungeonArm','finalDungeonDrag','finalSiteRoute','finalSiteMove','finalSiteArrive','finalMudslide'];
const layer=u=>u.layer||'surface';
const pos=u=>({at:u.at,layer:layer(u)});
const samePos=(a,b)=>a.at===b.at&&layer(a)===layer(b);
const label=v=>String.fromCharCode(65+v.at%5)+(4-Math.floor(v.at/5))+(layer(v)==='below'?'↓':'');

// Invoke on the actual transition into Death's Door, including Orpheus' effect.
// Threshold is checked at triggering time, not when the delayed move resolves.
export function finalSiteDoorArrived(s,p,A){
  const av=A.avatar(s,p);if(!av)return;
  for(const [at,site] of s.board.entries())if(site?.controller===p&&!site.silenced&&!site.disabled&&A.passives[A.card(site.card).slug]?.finalSanctuary&&A.resources(s,p).earth>=4&&siteEffectAllowed(s,av,'move',A,site.card)){
    A.queueEffects(s,[{op:'finalSiteRoute',uids:[av.uid],goal:{at,layer:'surface'},ward:true}],{...site,at,uid:site.uid||'site:'+at,layer:'surface'},p,site.card);
  }
}

// Invoke at the beginning of the new active player's turn, before start triggers.
export function startFinalSites(s,p){
  s.finalDungeonArms=(s.finalDungeonArms||[]).filter(e=>e.turn===s.turn);
  const record=s.finalOrpheusDoors?.[p];if(!record||record.after>=s.turn)return;
  const pl=s.players[p];
  if(pl.life>0&&record.priorDoor===null)pl.doorTurn=null;
  else if(record.priorDoor!==null)pl.doorTurn=record.priorDoor;
  delete s.finalOrpheusDoors[p];
}

// Invoke from strikeMany whenever an allied unit strikes an Avatar, even when
// Ward prevents its damage. Deferred resolution rechecks post-fight survival.
export function finalSiteAvatarStruck(s,striker,target,A){
  if(A.card(target.card).type!=='Avatar')return;
  for(const e of s.finalDungeonArms||[])if(!e.used&&e.turn===s.turn&&e.player===striker.controller){
    e.used=true;
    A.queueEffects(s,[{op:'finalDungeonDrag',striker:striker.uid,avatar:target.uid,goal:{at:e.at,layer:e.layer}}],e.source,e.player,e.source.card);
  }
}

function oneSteps(s,u,A,forced=false){
  if(forced){
    const from=A.occupied(u),result=[];
    for(let at=0;at<20;at++)if(Math.abs(at%5-u.at%5)+Math.abs(Math.floor(at/5)-Math.floor(u.at/5))===1){
      if(u.size===2&&(at%5>3||at>=15))continue;
      const to={...u,at},cells=A.occupied(to);
      if(cells.every((cell,i)=>cell>=0&&cell<20&&A.region(s,{at:cell,layer:layer(u)})===A.region(s,{at:from[i],layer:layer(u)})&&A.canEnterOnGround(s,u,{at:from[i],layer:layer(u)},{at:cell,layer:layer(u)},A.card,A.keywords)))result.push(pos(to));
    }
    return result;
  }
  return A.locations(s,u,A.card,A.keywords,true).filter(v=>v.path.length===1).map(pos);
}

// Breadth-first shortest legal distance. Enumerating only 40 positions avoids
// truncating the set of equal-length path choices to an arbitrary route count.
function distanceTo(s,u,from,goal,A,forced=false){
  if(samePos(from,goal))return 0;
  const seen=new Set([from.at+':'+layer(from)]),queue=[{...from,d:0}];
  for(let i=0;i<queue.length;i++)for(const to of oneSteps(s,{...u,...queue[i]},A,forced)){
    if(samePos(to,goal))return queue[i].d+1;
    const key=to.at+':'+layer(to);if(!seen.has(key)){seen.add(key);queue.push({...to,d:queue[i].d+1});}
  }
  return Infinity;
}
export function finalSiteShortestNext(s,u,from,goal,A,forced=false){
  const n=distanceTo(s,u,from,goal,A,forced);
  return Number.isFinite(n)&&n>0?oneSteps(s,{...u,...from},A,forced).filter(to=>distanceTo(s,u,to,goal,A,forced)===n-1):[];
}
const canBeMoved=(s,u,p,A)=>u&&!u.dying&&A.fiftyForceAllowed(s,u,p,A)&&!u.finalCage;

export function resolveFinalSites(s,frame,A){
  const {step,source,controller:p,selected}=frame;
  if(!finalSiteOperations.includes(step.op))return false;
  const queue=steps=>A.queueEffects(s,steps,source,p,frame.effectCard);
  const choose=(options,title,extra={})=>{s.choice={player:p,title,options,frame:{...frame,step:{...step,...extra}}};};
  if(step.op==='finalOrpheus'){
    const pl=s.players[p];
    if(pl.doorTurn===null&&siteEffectAllowed(s,A.avatar(s,p),'modify',A,frame.abilityOrigin||source.card)){
      const records=s.finalOrpheusDoors||(s.finalOrpheusDoors={});
      records[p]={priorDoor:null,after:s.turn};pl.doorTurn=s.turn;
      finalSiteDoorArrived(s,p,A);
    }
    queue([{op:'finalOrpheusSummon'}]);return true;
  }
  if(step.op==='finalOrpheusSummon'){
    const graves=[0,1].flatMap(q=>A.effectGraveEntries?A.effectGraveEntries(s,q,p):A.graveEntries(s,q)).filter(g=>{
      const c=A.card(g.card);return c.type==='Minion'&&c.playable&&A.canSummonEntry(s,p,c,source.at,layer(source));
    });
    if(selected===undefined){if(graves.length)choose(graves.map(g=>({label:A.card(g.card).name+' · 玩家'+(g.player+1),value:g})),"Orpheus' Crossing · 召喚亡故僕從");return true;}
    const g=graves.find(g=>g.uid===selected?.uid&&g.card===selected.card&&g.player===selected.player);if(!g)return true;
    A.takeGrave(s,g.player,g.index,g.card,g.uid);
    if(A.paySummoningTax(s,g.card,g.player,p)){
      const u=A.makeUnit(s,g.card,g.player,source.at);u.controller=p;u.layer=layer(source);A.summonedGenesis(s,u);
    }
    return true;
  }
  if(step.op==='finalDungeonArm'){
    (s.finalDungeonArms||(s.finalDungeonArms=[])).push({player:p,turn:s.turn,at:source.at,layer:layer(source),source:structuredClone(source),used:false});return true;
  }
  if(step.op==='finalDungeonDrag'){
    const a=A.unit(s,step.striker),b=A.unit(s,step.avatar);
    if(!canBeMoved(s,a,p,A)||!canBeMoved(s,b,p,A))return true;
    queue([{op:'finalSiteRoute',uids:[a.uid,b.uid],goal:step.goal,forced:true}]);return true;
  }
  if(step.op==='finalSiteRoute'){
    const units=step.uids.map(id=>A.unit(s,id));
    if(units.some(u=>!canBeMoved(s,u,p,A)||!siteEffectAllowed(s,u,'move',A,frame.abilityOrigin||source.card)))return true;
    const routes=step.routes||units.map(u=>[pos(u)]),index=step.index||0;
    // Check both routes BEFORE moving either. No unit moves when either has no
    // complete legal path to the Dungeon, as required by its explicit FAQ.
    if(units.some((u,i)=>!Number.isFinite(distanceTo(s,u,routes[i][routes[i].length-1],step.goal,A,step.forced))))return true;
    if(index>=units.length){
      const max=Math.max(...routes.map(r=>r.length)),moves=[];
      for(let i=1;i<max;i++)moves.push({op:'finalSiteMove',uids:step.uids,forced:step.forced,from:routes.map(r=>r[Math.min(i-1,r.length-1)]),to:routes.map(r=>r[Math.min(i,r.length-1)])});
      queue([...moves,{op:'finalSiteArrive',uids:step.uids,goal:step.goal,ward:step.ward}]);return true;
    }
    const u=units[index],route=routes[index],from=route[route.length-1];
    if(samePos(from,step.goal)){queue([{...step,routes,index:index+1}]);return true;}
    const options=finalSiteShortestNext(s,u,from,step.goal,A,step.forced);
    if(selected===undefined){if(options.length)choose(options.map(to=>({label:A.card(u.card).name+' · '+label(to),value:to})),A.card(frame.effectCard).name+' · 宣告最短路徑',{routes,index});return true;}
    const to=options.find(v=>samePos(v,selected));if(!to)return true;
    const next=routes.map((r,i)=>i===index?[...r,to]:r);queue([{...step,routes:next,index}]);return true;
  }
  if(step.op==='finalSiteMove'){
    const units=step.uids.map(id=>A.unit(s,id));if(units.some(u=>!canBeMoved(s,u,p,A)||!siteEffectAllowed(s,u,'move',A,frame.abilityOrigin||source.card)))return true;
    if(units.some((u,i)=>!samePos(u,step.from[i])))return true;
    // Recheck each declared step after intervening entry/exit triggers. If a
    // previous step failed, later steps cannot jump over it or grant Ward.
    if(units.some((u,i)=>!samePos(u,step.to[i])&&!oneSteps(s,u,A,step.forced).some(v=>samePos(v,step.to[i]))))return true;
    for(const [i,u] of units.entries())if(!samePos(u,step.to[i])){u.at=step.to[i].at;u.layer=step.to[i].layer;u.notRest=true;u.burrowedSafely=false;}
    return true;
  }
  if(step.op==='finalSiteArrive'){
    if(step.ward)for(const id of step.uids){const u=A.unit(s,id);if(u&&!u.dying&&samePos(u,step.goal)&&siteEffectAllowed(s,u,'modify',A,frame.abilityOrigin||source.card)&&!A.unmodifiable(u)&&!A.unitUmbrellas(u).includes('Evil'))u.ward=true;}
    return true;
  }
  if(step.op==='finalMudslide'){
    if(selected===undefined){choose([{label:'全部向左滑一步',value:-1},{label:'全部向右滑一步',value:1}],'Mudslide · 全列同一方向');return true;}
    if(selected!==-1&&selected!==1)return true;
    const plans=[];
    for(const u of s.units)if(!u.dying&&siteEffectAllowed(s,u,'move',A,frame.abilityOrigin||source.card)&&A.occupied(u).some(at=>at%5===source.at%5&&s.board[at]&&!A.waterSite(s,at,A.card))&&canBeMoved(s,u,p,A)){
      const at=u.at+selected;
      if(at<0||at>=20||Math.floor(at/5)!==Math.floor(u.at/5))continue;
      const to=oneSteps(s,u,A,true).find(v=>v.at===at&&layer(v)===layer(u));if(to)plans.push({u,to});
    }
    for(const {u,to} of plans){u.at=to.at;u.layer=to.layer;u.notRest=true;u.burrowedSafely=false;}
    return true;
  }
  return true;
}
