import {deckKey,rankCommunity} from './model.js';

export function playerSummary(account,uid,entries={}){
  const records=Object.values(account?.records||{}).filter(r=>!r.deleted).sort((a,b)=>b.createdAt-a.createdAt);
  const totals={games:records.length,wins:0,losses:0,draws:0};
  for(const r of records)totals[r.result==='win'?'wins':r.result==='loss'?'losses':'draws']++;
  const decks=Object.values(account?.decks||{});
  const rank=rankCommunity(entries,{kind:'players'}).findIndex(r=>r.id===uid);
  const deckRanks=rankCommunity(entries,{kind:'decks'});
  const rankedDecks=decks.filter(d=>d.published===true).map(d=>{
    const index=deckRanks.findIndex(r=>r.id===deckKey(d.deck));
    return {name:d.deck.name,rank:index<0?null:index+1};
  });
  return {...totals,decks,records,rank:rank<0?null:rank+1,rankedDecks,winRate:totals.games?Math.round(totals.wins/totals.games*100):null};
}

export function localMatchResume(value){
  return value?.version===1&&value.players?.length===2&&value.winner===null?'./battle.html':null;
}
export function ownedRoomResume(saved,uid,meta){
  if(!uid||saved?.token!==uid||!/^[A-Z0-9]{6}$/.test(saved?.id||'')||![meta?.host,meta?.guest].includes(uid))return null;
  return ['lobby','playing'].includes(meta.status)?{url:'./online-play.html?room='+saved.id,status:meta.status,id:saved.id}:null;
}

export function playerCenterHTML({T,E,user,account,loaded,entries={},rankFailed=false,localDeckCount=0,localResume,onlineResume,section='overview'}){
  const name=account?.profile?.displayName||T('設定你的暱稱','Set your nickname');
  const tabs=[['overview','總覽','Overview'],['decks','我的牌組','My decks'],['results','我的戰績','My results']];
  const menu=`<nav class="player-sections" aria-label="${T('玩家中心導覽','Player center navigation')}">${tabs.map(([id,zh,en])=>`<a href="./player.html${id==='overview'?'':'?tab='+id}" ${section===id?'aria-current="page"':''}>${T(zh,en)}</a>`).join('')}<a href="./account.html">${T('帳號設定','Account settings')} ↗</a></nav>`;
  const local=`<section class="player-panel"><h2>${T('此裝置的牌組','Decks on this device')}</h2><p>${localDeckCount} ${T('副自訂牌組，僅儲存在目前瀏覽器。','custom decks stored in this browser only.')}</p><a class="player-action" href="./decks.html">${T('編輯本機牌組','Edit local decks')} ↗</a><a class="player-action" href="./cloud-decks.html">${T('上傳至我的雲端','Upload to my cloud')} ↗</a></section>`;
  const resume=`${onlineResume?`<section class="player-panel player-resume"><h2>${T('你的線上房間','Your online room')}</h2><p>${E(onlineResume.id)} · ${onlineResume.status==='playing'?T('對局進行中','Match in progress'):T('等待開始','Waiting to start')}</p><a class="player-action primary" href="${E(onlineResume.url)}">${T('重新加入房間','Rejoin room')} →</a></section>`:''}${localResume?`<section class="player-panel player-resume"><h2>${T('此裝置上的對局','Match on this device')}</h2><a class="player-action" href="${localResume}">${T('返回對局','Return to match')} →</a></section>`:''}`;
  let content;
  if(!user)content=`<section class="player-panel player-welcome"><span class="player-eyebrow">YOUR REALM</span><h2>${T('你的旅程，留在你的帳號裡。','Your journey, in your account.')}</h2><p>${T('使用 Google 登入，管理暱稱、雲端牌組、戰績與排名。','Sign in with Google to manage your nickname, cloud decks, results and rankings.')}</p><p>${T('本機牌組不會自動上傳，牌表預設私人。','Local decks are not uploaded automatically. Decklists are private by default.')}</p><button id="player-signin" class="player-action primary">${T('使用 Google 登入','Sign in with Google')}</button></section>${resume}${local}`;
  else if(!loaded)content=`<section class="player-panel"><p role="status">${T('正在載入你的資料…','Loading your data…')}</p><button id="reload-player" class="player-action">${T('重新載入','Retry')}</button></section>${resume}`;
  else{
    const s=playerSummary(account,user.uid,entries);
    const stats=`<div class="player-stats">${[[T('總場次','Games'),s.games],[T('勝利','Wins'),s.wins],[T('敗北','Losses'),s.losses],[T('勝率','Win rate'),s.winRate===null?'—':s.winRate+'%']].map(([label,value])=>`<div><strong>${value}</strong><span>${label}</span></div>`).join('')}</div>`;
    const cloud=`<section class="player-panel"><div class="player-panel-title"><h2>${T('我的雲端牌組','My cloud decks')} · ${s.decks.length}</h2><a href="./cloud-decks.html">${T('管理／匯入','Manage / import')} ↗</a></div><p class="player-note">${T('只有主動公開的牌表才會出現在社群排行榜。','Only explicitly published decklists appear in community rankings.')}</p>${s.decks.slice(0,section==='decks'?100:3).map(d=>`<article class="player-list-row"><strong>${E(d.deck.name)}</strong><span class="player-badge">${d.published?T('公開','Public'):T('私人','Private')}</span><small>Atlas ${d.deck.atlas.length} · Spellbook ${d.deck.spells.length}</small></article>`).join('')||`<p>${T('尚無雲端牌組，從本機或官方牌組匯入第一副。','No cloud decks yet. Import your first local or official deck.')}</p>`}</section>`;
    const results=`<section class="player-panel"><div class="player-panel-title"><h2>${T('近期對局','Recent matches')}</h2><a href="./history.html">${T('完整戰績／管理','History / manage')} ↗</a></div>${s.records.slice(0,section==='results'?20:3).map(r=>`<article class="player-list-row"><strong>${E(r.deck.name)}</strong><span class="player-badge">${r.result==='win'?T('勝利','Win'):r.result==='loss'?T('敗北','Loss'):T('和局','Draw')}</span><small>${E(new Date(r.createdAt).toLocaleDateString(T('zh-TW','en')))} · ${r.source==='online'?(r.corrected?T('線上／本人更正','Online / corrected'):T('線上自動記錄','Online auto-recorded')):T('手動紀錄','Manual entry')}</small></article>`).join('')||`<p>${T('尚無戰績，完成線上對局後會自動記錄。','No results yet. Completed online matches are recorded automatically.')}</p>`}<p class="player-note">${T('休閒／自報戰績；和局也計入總場次。','Casual / self-reported results. Draws count toward total games.')}</p></section>`;
    const rankings=`<section class="player-panel"><div class="player-panel-title"><h2>${T('我的排名','My rankings')}</h2><a href="./rankings.html">${T('查看排行榜','View rankings')} ↗</a></div><p>${T('玩家排名','Player rank')} <strong>${rankFailed?T('暫時無法讀取','Unavailable'):s.rank?'#'+s.rank:T('尚未上榜','Unranked')}</strong></p>${rankFailed?`<p>${T('私人資料已載入，稍後可重新整理排名。','Your private data is loaded. Retry rankings later.')}</p>`:s.rankedDecks.map(d=>`<article class="player-list-row"><strong>${E(d.name)}</strong><span>${d.rank?'#'+d.rank:T('尚無出場紀錄','No appearances yet')}</span></article>`).join('')||`<p>${T('目前沒有公開牌組。私人牌組不會展示。','No published decks. Private decks stay hidden.')}</p>`}<a class="player-action" href="./deck-rankings.html">${T('牌組排行榜','Deck rankings')} ↗</a><p class="player-note">${T('依目前榜單排序；相同牌表合併統計。','Uses the current leaderboard order. Identical decklists are grouped.')}</p></section>`;
    content=section==='decks'?cloud+local:section==='results'?stats+results:stats+resume+`<div class="player-columns">${cloud}${rankings}</div>`+results;
  }
  return `<div class="player-layout"><aside class="player-identity"><span class="player-eyebrow">PLAYER CENTER</span><h1>${T('玩家中心','Player center')}</h1><div class="player-portrait" aria-hidden="true">◇</div><h2>${E(user?name:T('訪客','Guest'))}</h2><p>${user?T('Google 已登入','Signed in with Google'):T('登入後開啟你的領域','Sign in to your realm')}</p>${user&&loaded?`<button id="edit-profile" class="player-action">${T('修改暱稱','Edit nickname')}</button>`:''}${menu}${user?`<button id="signout" class="player-signout">${T('登出','Sign out')}</button>`:''}</aside><div class="player-content">${content}</div></div>`;
}
