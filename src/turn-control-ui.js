// Names are player data. Only the surrounding interface copy is localized.
export function turnControlGuideHTML(state,perspective,status,{escape,portrait,english=false,context=''}){
 if(!status)return '';
 const t=(zh,en)=>english?en:zh;
 const name=p=>escape(state.players[p].name);
 const letter=p=>String.fromCharCode(65+p);
 const seat=p=>`<b class="control-seat" data-seat="${p}" aria-label="${t('玩家 ','Player ')}${letter(p)}">${letter(p)}</b>`;
 const person=(p,caption,role)=>`<div class="control-person ${role}" data-seat="${p}"><span class="control-avatar" aria-hidden="true">${portrait(p)}</span><span class="control-person-copy"><small>${caption}</small><strong>${seat(p)}<span>${name(p)}</span></strong></span></div>`;
 let body='';
 if(status.stage==='active'){
  const {controller,owner,operator,responding,next}=status;
  const identity=state.mode==='local'?t(`現在請 ${name(operator)} 操作`,`${name(operator)}, play now`):t(`你是 ${name(perspective.viewer)}`,`You are ${name(perspective.viewer)}`);
  const instruction=responding?t(`等待 ${name(operator)} 回應；${name(owner)} 的回合仍由 ${name(controller)} 操控。`,`Waiting for ${name(operator)} to respond. ${name(controller)} still controls ${name(owner)}’s turn.`):perspective.viewer!==controller&&state.mode!=='local'?t(`你的回合由 ${name(controller)} 操作，請等待。`,`${name(controller)} controls your turn. Please wait.`):t(`使用 ${name(owner)} 的手牌與單位；由 ${name(controller)} 決定行動。`,`Use ${name(owner)}’s hand and units. ${name(controller)} makes the decisions.`);
  const nextText=next?t(`下次 ${name(next.owner)} 的回合：${name(next.controller)} 操控 ${name(next.owner)}`,`On ${name(next.owner)}’s next turn: ${name(next.controller)} controls ${name(next.owner)}`):t('本回合結束後，恢復各自操作。','After this turn, normal control returns.');
  body=`<div class="control-guide-heading"><span>${t('控制權交換 · 回合 ','PLAYER CONTROL · TURN ')}${state.turn}</span><strong>${identity}</strong></div><div class="control-route">${person(controller,t(responding?'本回合操作者':'現在由誰操作',responding?'Turn controller':'Who is playing'),'operator')}<span class="control-arrow" aria-hidden="true">→<small>${t('操控','controls')}</small></span>${person(owner,t('回合與卡牌屬於','Turn & cards belong to'),'owner')}</div><p class="control-instruction">${instruction}</p><div class="control-guide-tail"><small>${nextText}</small>${perspective.controlled!==null?`<button type="button" id="controlled-cards" aria-label="${t('被控玩家所有卡牌',"Controlled player's cards")}">${t('查看全部卡牌','View all cards')}</button>`:''}</div>`;
 }else if(status.stage==='scheduled'){
  const next=status.next;
  body=`<div class="control-guide-heading"><span>Courtesan Thaïs</span><strong>${t('控制權即將交換','Control will switch')}</strong></div><p class="control-upcoming">${t('接下來：','Up next: ')}${seat(next.controller)} ${name(next.controller)} <span aria-hidden="true">→</span> ${seat(next.owner)} ${name(next.owner)}</p><p class="control-instruction">${t('箭頭左邊的人，將操作右邊玩家的手牌與單位。','The player on the left will play the right player’s hand and units.')}</p>`;
 }else{
  body=`<div class="control-guide-heading"><span>${t('控制已結束','CONTROL ENDED')}</span><strong>${t('恢復各自操作','Normal control restored')}</strong></div><p class="control-upcoming">${seat(status.controller)} ${name(status.controller)}</p><p class="control-instruction">${t(`現在操作自己的手牌與單位。`,`Now playing their own hand and units.`)}</p>`;
 }
 return `<section class="control-guide control-guide-${status.stage}" aria-label="${t('目前操作身分','Current player control')}"><div class="control-guide-status" role="status" aria-live="polite" aria-atomic="true" data-i18n-preserve>${body}</div>${context?`<div class="context">${context}</div>`:''}</section>`;
}
