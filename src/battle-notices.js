const coordinate=at=>Number.isInteger(at)?`${String.fromCharCode(65+at%5)}${4-Math.floor(at/5)}`:'';
// Compare only committed public results. Never reveal drawn cards or infer a death
// from a return to hand, banishment, transformation, or an ordinary departure.
export function battleNoticeEvents(before,after,action,lookup){
 const events=[],turn=after.turn,actor=before.players[action.player]?.name||'',old=new Map(before.units.map(u=>[u.uid,u]));
 const name=id=>{try{return lookup(id).name;}catch{return '卡牌';}},unitName=uid=>{const u=old.get(uid)||after.units.find(u=>u.uid===uid);return u?name(u.card):'單位';};
 const add=(text,kind='action')=>events.push({turn,text,kind});
 const deaths=(after.deathHistory||[]).slice((before.deathHistory||[]).length),deathCounts=new Map();
 for(const d of deaths)deathCounts.set(name(d.card),(deathCounts.get(name(d.card))||0)+1);
 for(const entry of after.log.slice(before.log.length)){
  const removal=entry.text.match(/^(.*) → (cemetery|banished|hand|resummon)$/);
  if(removal){const [,card,zone]=removal;if(['cemetery','banished'].includes(zone)&&deathCounts.get(card)>0){deathCounts.set(card,deathCounts.get(card)-1);continue;}
   add(`${card}${{cemetery:' 送入墓地',banished:' 被放逐',hand:' 返回手牌',resummon:' 暫時離場'}[zone]}。`,'depart');
  }else add(entry.text,/Ward/.test(entry.text)?'shield':'action');
 }
 if(action.type==='attack')add(`${actor}：${unitName(action.unit)} 攻擊 ${action.target?.startsWith?.('site:')?'地點 '+coordinate(Number(action.target.slice(5))):action.targets?.map(unitName).join('、')||unitName(action.target)}。`);
 if(action.type==='move')add(`${actor}：${unitName(action.unit)} 移動至 ${coordinate(action.at)}。`);
 if(action.type==='ranged')add(`${actor}：${unitName(action.unit)} 向${['北','東','南','西'][action.direction]}遠程射擊。`);
 if(action.type==='draw')add(`${actor} 抽取一張${action.deck==='atlas'?'地點':'法術'}牌。`);
 if(action.type==='defend')add(`${actor}：${unitName(action.unit)} 加入${before.pending?.kind==='intercept'?'攔截':'防禦'}。`);
 if(!events.length&&['activate','activateSite','activateArtifact'].includes(action.type)){
  const id=action.unit?old.get(action.unit)?.card:action.type==='activateSite'?before.board[action.at]?.card:before.artifacts?.find(o=>o.uid===action.object)?.card;
  add(`${actor}：${name(id)} 啟動能力。`);
 }
 for(const u of after.units)if(!old.has(u.uid)&&lookup(u.card).type!=='Avatar'){
  const text=`${name(u.card)}（${coordinate(u.at)}${u.layer==='below'?' · 下層':''}）召喚進場。`,logged=events.find(e=>e.kind==='action'&&e.text===`召喚 ${name(u.card)}。`);
  if(logged){logged.text=text;logged.kind='summon';}else add(text,'summon');
 }
 for(const u of after.units){const previous=old.get(u.uid);if(previous&&u.damage>previous.damage)add(`${name(u.card)}（${coordinate(u.at)}）受到 ${u.damage-previous.damage} 點傷害。`,'hit');}
 for(const d of deaths){const sources=[...new Set((d.killers||[]).map(k=>name(k.card)))];add(`${name(d.card)}（${coordinate(d.at)}）死亡${sources.length?' · 來源：'+sources.join('、'):''}。`,'death');}
 for(let p=0;p<after.players.length;p++){const prior=before.players[p],now=after.players[p],delta=now.life-prior.life;if(delta)add(`${now.name} 生命 ${delta>0?'+':''}${delta}（${prior.life} → ${now.life}）。`,delta<0?'hit':'heal');}
 const source=before.choice?.frame?.effectCard;
 if(action.type==='choose'&&source&&events.some(e=>['death','hit','summon'].includes(e.kind))&&!events.some(e=>e.kind==='action'))events.unshift({turn,kind:'action',text:`${name(source)} 效果結算。`});
 const context=source?name(source):before.pending?.attacker?unitName(before.pending.attacker):'';
 if(context)for(const event of events)event.context=context;
 return events;
}

// The queue survives app re-renders. Pausing preserves both pending messages and
// the remaining reading time, rather than expiring messages behind a dialog.
export function createNoticeQueue({capacity=2,holdMs=3400,exitMs=350}={}){
 let pending=[],visible=[],next=1;
 return {push(groups){for(const group of groups)pending.push({...group,id:next++,age:0});},
  advance(elapsed,paused=false){if(paused)return;visible=visible.map(item=>({...item,age:item.age+Math.max(0,elapsed)})).filter(item=>item.age<holdMs+exitMs);while(visible.length<capacity&&pending.length)visible.push(pending.shift());},
  snapshot(){return visible.map(item=>({...item,leaving:item.age>=holdMs}));},
  hasWork(){return !!(pending.length||visible.length);},
  clear(){pending=[];visible=[];}
 };
}

export function createBattleNoticeFeed({isPaused,getTop}={}){
 const root=document.createElement('div');root.id='battle-notices';root.setAttribute('role','log');root.setAttribute('aria-label','即時對局動態');root.setAttribute('aria-live','polite');root.setAttribute('aria-relevant','additions');root.hidden=true;document.body.append(root);
 const queue=createNoticeQueue(),nodes=new Map();let active=true,timer=null,last=performance.now();
 const paused=()=>!active||document.hidden||!!isPaused?.();
 function paint(){
  const items=queue.snapshot(),ids=new Set(items.map(item=>item.id));
  for(const [id,node] of nodes)if(!ids.has(id)){node.remove();nodes.delete(id);}
  root.hidden=paused()||!items.length;root.style.top=(getTop?.()??70)+'px';
  for(const item of items){let node=nodes.get(item.id);if(!node){node=document.createElement('section');node.className='battle-notice';node.dataset.noticeId=item.id;
    const title=document.createElement('small');title.textContent=`回合 ${String(item.turn).padStart(2,'0')} · ${item.context||'對局動態'}${item.pages>1?' · '+item.page+'/'+item.pages:''}`;node.append(title);
    for(const line of item.lines){const row=document.createElement('p');row.dataset.kind=line.kind;row.textContent=line.text;node.append(row);}root.append(node);nodes.set(item.id,node);}
   node.classList.toggle('leaving',item.leaving);
  }
 }
 function tick(){timer=null;const now=performance.now();queue.advance(now-last,paused());last=now;paint();if(queue.hasWork())timer=setTimeout(tick,100);}
 function clear(){if(timer!==null)clearTimeout(timer);timer=null;queue.clear();paint();}
 document.addEventListener('visibilitychange',()=>{last=performance.now();paint();});
 return {enqueue(events){if(!events.length||!active)return;const groups=[],pages=Math.ceil(events.length/3);for(let i=0;i<events.length;i+=3)groups.push({turn:events[i].turn,lines:events.slice(i,i+3),page:i/3+1,pages,context:events.find(e=>e.context)?.context});queue.push(groups);queue.advance(0,paused());paint();if(timer===null){last=performance.now();timer=setTimeout(tick,100);}},
  setActive(value){active=value;if(!active)clear();else paint();},clear};
}
