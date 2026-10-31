// Included in the generated presentation module. Uses native UI actions only.
const forestStack=createForestStack({
 locale:getUILanguage,revision:()=>state,selection:()=>selected,hasChoice:()=>!!boardChoice(),
 canBrowse:()=>view==='play'&&!panMode&&!tutorial&&!pointer?.moved,
 suppressed:()=>suppressClick,
 stale:()=>toast(tt('對局已更新，請重新選擇卡牌。','The match changed. Choose the card again.')),
 belowName:at=>state.board[at]&&waterSite(state,at,card)?tt('水下','Underwater'):tt('地下','Underground'),
 entries(at,layer){
  const cell=app.querySelector(`.board [data-at="${at}"]`);if(!cell)return [];
  const nodes=layer==='site'?[...cell.querySelectorAll(':scope > [data-site]')]:[...cell.querySelectorAll(`.realm-pile[data-layer="${layer}"] [data-unit],.realm-pile[data-layer="${layer}"] [data-object]`)];
  const seen=new Set();return nodes.filter(n=>{const key=n.dataset.unit||n.dataset.object||'site:'+at;if(seen.has(key))return false;seen.add(key);return true;}).map(n=>{
   const kind=n.dataset.unit?'unit':n.dataset.object?'object':'site',uid=n.dataset.unit||n.dataset.object||'site:'+at,u=kind==='unit'?unit(state,uid):null,c=card(n.dataset.card);
   const status=u?`${tt('力量','Power')} ${power(u)} · ${tt('傷害','Damage')} ${u.damage||0} · ${u.tapped?tt('已橫置','Tapped'):ready(state,u)?tt('可行動','Ready'):tt('尚無法行動','Not ready')}${u.ward?' · Ward':''}`:kind==='site'?tt('地點 · 可查看資訊與可用能力','Site · View its details and available abilities'):tt('場上物件','Realm object');
   return {key:kind+':'+uid,kind,uid,card:c.id,name:cardTitle(c),art:cardImageHTML(c,{eager:true}),status,layer};
  });
 },
 targetPlan(at){
  if(!human()||!selected&&!boardChoice())return null;
  const entries=['surface','below','site'].flatMap(layer=>this.entries(at,layer)),picks=boardChoice();
  if(picks){const keys=entries.filter(e=>e.kind!=='site'&&picks.some(p=>p?.kind==='unit'&&p.uid===e.uid)).map(e=>e.key);return {keys,positional:!keys.length&&picks.some(p=>['cell','direction'].includes(p?.kind)&&p.at===at)};}
  const all=selectedActions(),exact=entries.filter(e=>e.kind!=='site'&&all.some(a=>actionTargetsUnit(a,e.uid))).map(e=>e.key);
  return {keys:exact,positional:!exact.length&&matchingBoardActions(all,at,undefined,boardEntities()).length>0};
 },
 target(e,at){if(boardChoice())tryBoardChoice({at,uid:e.kind==='site'?undefined:e.uid});else chooseAt(at,e.kind==='site'?undefined:e.uid);},
 position(at){if(boardChoice())tryBoardChoice({at});else chooseAt(at);},
 node(e,at){const cell=app.querySelector(`.board [data-at="${at}"]`);return e.kind==='site'?cell?.querySelector('[data-site]'):cell?.querySelector(`[data-${e.kind==='unit'?'unit':'object'}="${CSS.escape(e.uid)}"]`);},
 buttons(e,at){
  if(!human())return [];
  if(e.kind==='unit'){const u=unit(state,e.uid);if(!u||u.controller!==acting()||state.choice)return [];const all=actions().filter(a=>a.unit===e.uid);if(state.pending)return all.some(a=>a.type==='defend')?[{label:tt('防禦／攔截','Defend / intercept'),mode:'ability'}]:[];
   const result=[];if(all.some(a=>['move','attack'].includes(a.type)))result.push({label:tt('移動／攻擊','Move / attack'),mode:'move'});
   if(all.some(a=>!['move','attack','defend'].includes(a.type)))result.push({label:tt('使用能力','Use ability'),mode:'ability'});return result;
  }
  const yes=actions().some(a=>e.kind==='site'?['activateSite','cityDefend'].includes(a.type)&&a.at===at:a.type==='activateArtifact'&&a.object===e.uid);return yes?[{label:tt('使用能力','Use ability'),mode:'ability'}]:[];
 },
 inspect(e,at){this.node(e,at)?.click();},
 invoke(e,at,mode){
  const node=this.node(e,at);if(!node)return;node.click();const use=document.querySelector('#card-info-use');if(use&&!use.hidden&&!use.disabled)use.click();
  if(mode==='move')document.querySelector('#unit-move,#move-avatar')?.click();
 }
});
