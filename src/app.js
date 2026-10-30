let deckAddZone='main';
import { loadCards, cards, card, byId, elements, limits, starter, betaDecks, officialBetaDecks, deckSizes, validateDeck } from './cards.js';
import { newGame, restoreGame, dispatch, legalActions, observation, resources, unit, spellcaster, avatar, ready, power, reason, disabled, summoningTax, canDropArtifact, pickupItems, handIsRevealed } from './engine.js';
import { chooseAction, AI_DIFFICULTIES } from './ai.js';
import { inside } from './objects.js';
import { occupied } from './geography.js';
import {carryChoices,carryRule,passengers} from './transport.js';
import {keywords,canTarget,unitTypes} from './engine.js';
import {topSpellAccess} from './engine.js';
import { definitions,passives } from './definitions.js';
import { importDeck, formatTextDecklist, toOfficialDeckJson } from './deck-import.js';
import { loadCardTranslations, cardTitle, cardRules, getLang, setLang } from './i18n.js';
const $=s=>document.querySelector(s),app=$('#app'),modal=$('#modal');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state,view='play',selected=null,aiTimer,toastTimer,deck,filter={q:'',type:'',element:'',cost:'',supported:false,page:0},saved=[],deckPane='cards';
let menuOpen=false,logOpen=false,handOpen=false,hudOpen=false,toolsOpen=false,panMode=false,boardZoom=1,suppressClick=false,pointer=null,longTimer;
let viewScroll={l:0,t:0,init:false},lastPtr={x:0,y:0},edgeTimer=0;
let seenDamage=new Map(),seenPhase='',seenUnits=new Set(),seenSites=new Map(),seenWinner=null,motionReady=false,seenStrike='',seenLog=-1,seenActive=null,handSealed=false,battleCue=null;
let aiOmniscient=false;
const store={get(k,f){try{return JSON.parse(localStorage.getItem(k))??f;}catch{return f;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch{toast('本機儲存失敗，請使用匯出備份。');}}};
function toast(text){clearTimeout(toastTimer);$('#toast').textContent=text;$('#toast').style.display='block';toastTimer=setTimeout(()=>$('#toast').style.display='none',4200);}
function show(html,mode){$('#modal-body').innerHTML=html;modal.classList.remove('top-peek','choice-banner','effect-confirm','realm-list','realm-sheet');if(mode)modal.classList.add(mode);if(modal.open&&!modal.matches(':modal'))modal.close();if(!modal.open)modal.showModal();const motion=mode==='effect-confirm'?'zoomIn':mode==='realm-list'||mode==='realm-sheet'?'fadeInUp':null;if(motion)playMotion($('#modal-body'),motion);}
function close(){if(modal.open)modal.close();}
function choiceOriginAt(){
  const src=state?.choice?.frame?.source;
  if(!src)return null;
  if(typeof src.at==='number')return src.at;
  if(src.uid){try{const u=unit(state,src.uid);if(u)return u.at;}catch{}}
  return null;
}
/** Spatial choices can be clicked on the board. Null means this option is not a board target. */
function choiceSpot(o){
  const v=o?.value;
  if(v==null)return {kind:'skip'};
  const label=String(o.label||'');
  if(['北','東','南','西'].includes(label)&&typeof v==='number'&&v>=1&&v<=4){
    const origin=choiceOriginAt(),dir=v-1,dx=[0,1,0,-1][dir],dy=[-1,0,1,0][dir];
    let at=null;
    if(origin!=null){const x=origin%5,y=(origin/5)|0,nx=x+dx,ny=y+dy;if(nx>=0&&nx<5&&ny>=0&&ny<4)at=ny*5+nx;}
    return {kind:'direction',at};
  }
  if(v&&typeof v==='object'){
    if(v.entity==='unit'&&v.uid)return {kind:'unit',uid:v.uid};
    if(v.entity==='location'||v.entity==='site')return {kind:'cell',at:v.at};
    if(typeof v.at==='number'&&(v.layer==='surface'||v.layer==='below')&&v.uid==null&&v.card==null&&v.player==null)return {kind:'cell',at:v.at};
  }
  if(typeof v==='number'&&v>=0&&v<20&&/[A-E][1-4]/.test(label))return {kind:'cell',at:v};
  return null;
}
function boardChoice(s=state){
  const options=s?.choice?.options;
  if(!options?.length)return null;
  const spots=options.map(choiceSpot);
  if(spots.some(x=>x==null))return null;
  if(!spots.some(x=>x.kind!=='skip'))return null;
  return spots;
}
function cancelDialog(){if(modal.classList.contains('top-peek')){close();modal.classList.remove('top-peek');render();return;}const choice=state?.choice;close();selected=null;if(choice&&choice.options.some(o=>o.value===null))perform({type:'choose',player:choice.player,option:choice.options.findIndex(o=>o.value===null)});}
$('#close-modal').onclick=cancelDialog;
modal.addEventListener('click',e=>{if(e.target===modal)cancelDialog();});
modal.addEventListener('cancel',e=>{e.preventDefault();cancelDialog();});
function navigateHand(dir){
  const cards=[...document.querySelectorAll('.fan [data-hand]')];
  if(!cards.length)return false;
  let i=cards.findIndex(c=>c.dataset.hand===selected?.id||c===document.activeElement);
  if(i<0)i=dir>0?-1:0;
  i=Math.max(0,Math.min(cards.length-1,i+dir));
  const next=cards[i];
  if(!next)return false;
  handClick(next.dataset.hand);next.focus({preventScroll:true});
  return true;
}
function navigateBoard(key){
  const legal=[...document.querySelectorAll('.cell.legal')];
  const pool=legal.length?legal:[...document.querySelectorAll('[data-at]')];
  if(!pool.length)return false;
  const focused=document.activeElement?.closest?.('[data-at]');
  let at=focused?+focused.dataset.at:NaN;
  if(!Number.isFinite(at)&&selected?.kind==='unit')at=unit(state,selected.id)?.at;
  if(!Number.isFinite(at)&&selected?.kind==='hand'){
    const first=legal[0]||pool[Math.min(17,pool.length-1)];
    first?.focus({preventScroll:true});
    first?.scrollIntoView({block:'nearest',inline:'nearest'});
    return !!first;
  }
  if(!Number.isFinite(at))at=12;
  const col=at%5,row=(at/5)|0;
  let best=null,score=1e9;
  for(const cell of pool){
    const i=+cell.dataset.at,c=i%5,r=(i/5)|0;
    if(key==='ArrowLeft'&&(c>=col||r!==row))continue;
    if(key==='ArrowRight'&&(c<=col||r!==row))continue;
    if(key==='ArrowUp'&&(r>=row||c!==col))continue;
    if(key==='ArrowDown'&&(r<=row||c!==col))continue;
    const d=Math.abs(c-col)+Math.abs(r-row);
    if(d&&d<score){score=d;best=cell;}
  }
  if(!best&&(key==='ArrowLeft'||key==='ArrowRight')){
    for(const cell of pool){
      const i=+cell.dataset.at,c=i%5,r=(i/5)|0,d=Math.abs(c-col)+Math.abs(r-row)*3;
      if(key==='ArrowLeft'&&c<col&&d<score){score=d;best=cell;}
      if(key==='ArrowRight'&&c>col&&d<score){score=d;best=cell;}
    }
  }
  if(!best&&(key==='ArrowUp'||key==='ArrowDown')){
    for(const cell of pool){
      const i=+cell.dataset.at,c=i%5,r=(i/5)|0,d=Math.abs(r-row)+Math.abs(c-col)*3;
      if(key==='ArrowUp'&&r<row&&d<score){score=d;best=cell;}
      if(key==='ArrowDown'&&r>row&&d<score){score=d;best=cell;}
    }
  }
  if(!best)return false;
  best.focus({preventScroll:true});
  best.scrollIntoView({block:'nearest',inline:'nearest'});
  return true;
}
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){menuOpen=false;logOpen=false;handOpen=false;toolsOpen=false;selected=null;render();return;}
  if(view!=='play'||!state||e.target.closest('input,textarea,select,dialog'))return;
  if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter',' '].includes(e.key))return;
  const onCell=e.target.closest?.('[data-at]');
  const onHand=e.target.closest?.('.fan [data-hand]');
  if((e.key==='Enter'||e.key===' ')&&onCell&&selected){e.preventDefault();chooseAt(+onCell.dataset.at);return;}
  if((e.key==='ArrowUp'||e.key==='ArrowDown')&&onHand){e.preventDefault();navigateBoard(e.key==='ArrowUp'?'ArrowUp':'ArrowDown');return;}
  if(e.key==='ArrowUp'&&onCell&&((+onCell.dataset.at/5)|0)===0&&document.querySelector('.fan [data-hand]')){e.preventDefault();const cards=[...document.querySelectorAll('.fan [data-hand]')];const pick=cards.find(c=>c.dataset.hand===selected?.id)||cards[0];if(pick){pick.focus({preventScroll:true});if(selected?.id!==pick.dataset.hand)handClick(pick.dataset.hand);}return;}
  if(onCell||selected?.kind==='unit'||(selected?.kind==='hand'&&(e.key==='ArrowUp'||e.key==='ArrowDown')&&!onHand)){
    if(e.key==='ArrowDown'&&onCell&&((+onCell.dataset.at/5)|0)===3&&document.querySelector('.fan [data-hand]')){e.preventDefault();const cards=[...document.querySelectorAll('.fan [data-hand]')];const pick=cards.find(c=>c.dataset.hand===selected?.id)||cards[Math.floor(cards.length/2)]||cards[0];if(pick){pick.focus({preventScroll:true});if(selected?.id!==pick.dataset.hand)handClick(pick.dataset.hand);}return;}
    e.preventDefault();navigateBoard(e.key);return;
  }
  if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();navigateHand(e.key==='ArrowRight'?1:-1);}
});
document.addEventListener('click',e=>{if(!toolsOpen)return;if(e.target.closest&&e.target.closest('.tools-fab'))return;toolsOpen=false;const fab=document.querySelector('.tools-fab'),panel=document.querySelector('#tools-panel'),btn=document.querySelector('#tools-toggle');if(fab)fab.classList.remove('open');if(panel)panel.hidden=true;if(btn)btn.setAttribute('aria-expanded','false');}); /* pointerdown-tools */
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{view=b.dataset.view;selected=null;render();});
const helpHTML=()=>`<div class="eyebrow">HOW TO PLAY</div><h2>直接操作卡牌與戰場</h2><p>拖曳手牌到金色格子即可出牌。點選手牌或單位後再點位置，效果相同。移動與攻擊不會多一次確認；同一個位置有多種行動時才出現選擇。</p><p>手機直向時戰場可以比螢幕更寬。在空地上單指滑動來平移，雙指可縮放與平移。拖曳卡牌靠近畫面邊緣會自動捲動戰場。右下縮圖與邊緣箭頭可跳到畫面外的合法格。◎ 恢復預設，♜ 回到自己的 Avatar，雙擊空地也會回到 Avatar。詳 可展開牌庫與元素門檻。</p><p>需要回應時，只會出現讓過或防禦。單位的射擊、裝備與能力出現在右下操作區，戰場保持可點。右鍵或長按可檢視卡牌。ESC 取消選擇。</p><p>生命歸零會進入 Death’s Door。之後直接傷害 Avatar 才能造成致命一擊；攻擊地點只會造成生命流失。</p><p class="notice">開發中的規則實作：官方資料可查閱；只有可操作卡牌能加入測試對局。完整規則仍待補齊。</p>`;
$('#help').onclick=()=>show(helpHTML());
const tone=c=>(c.elements.find(e=>e!=='None')||'None').toLowerCase();
function supportLabel(c){return c.playable?'可操作 · 部分支援':c.handler==='token'?'衍生物 · 部分支援':'尚未實作';}
function handMarkup(p,redraw=false){return [['atlas','Atlas · 地點',true],['spellbook','Spellbook · 法術',false]].map(([key,label,site])=>{const hand=state.players[p].hand.filter(h=>(card(h.card).type==='Site')===site);const n=hand.length;return `<section class="hand-group" data-hand-deck="${key}"><h3>${label} · ${n} 張</h3><div class="hand-cards">${hand.map((h,i)=>cardHTML(card(h.card),`${redraw?`data-redraw="${h.uid}"`:`data-hand="${h.uid}" ${selected?.id===h.uid?'aria-pressed="true"':''}`} data-deck="${key}" style="--i:${i};--n:${Math.max(n,1)}"`)).join('')}</div></section>`;}).join('');}
function siteDialog(at){inspect(state.board[at].card);if(!human())return;const list=actions().filter(a=>a.type==='activateSite'&&a.at===at);if(!list.length)return;const box=document.createElement('div');box.className='modal-actions';for(const a of list){const b=document.createElement('button');b.dataset.siteAbility=a.index;b.textContent=definitions[card(state.board[at].card).slug].activated[a.index].label;b.onclick=()=>{close();perform(a);};box.append(b);}$('#modal-body').append(box);}
function objectDialog(uid){const object=[...state.artifacts||[],...state.auras||[]].find(o=>o.uid===uid);if(!object)return;inspect(object.card);const list=actions().filter(a=>a.type==='activateArtifact'&&a.object===uid);if(!list.length)return;const box=document.createElement('div');box.className='modal-actions';for(const a of list){const b=document.createElement('button');b.dataset.artifactAbility=a.index;b.textContent=definitions[card(object.card).slug].activated[a.index].label;b.onclick=()=>{close();perform(a);};box.append(b);}$('#modal-body').append(box);}
const typeMark=t=>({Minion:'♞',Site:'◇',Avatar:'♜',Magic:'✦',Artifact:'⚒',Aura:'◎'})[t]||'◆';
function cardHTML(c,attrs='',large=false,inDeck=0){const title=cardTitle(c),rules=cardRules(c);return `<button class="card ${tone(c)} ${c.playable?'':'unavailable'} ${large?'large':''}" data-card="${c.id}" ${attrs} title="${esc(c.name)}">${inDeck?`<span class="card-qty" aria-label="牌組內 ${inDeck} 張">${inDeck}</span>`:''}<span class="card-head"><span>${esc(title)}</span><span class="cost">${c.type==='Site'?'◇':c.cost??'✧'}</span></span><span class="card-art" aria-hidden="true"><span class="card-art-mark">${typeMark(c.type)}</span></span><span class="card-type">${esc(c.type)} · ${esc(c.slot||'Token')}</span><span class="card-rule">${esc(rules)}</span><span class="card-foot"><span>${elements.filter(e=>c[e]).map(e=>e[0].toUpperCase()+c[e]).join(' ')} ${c.attack!==null?`${c.attack} / ${c.defense}`:''}</span><span class="card-status">${supportLabel(c)}</span></span></button>`;}
function inspect(id,u){const c=card(id);const status=u?`${u.tapped?'已橫置':'未橫置'} · 傷害 ${u.damage}${u.ward?' · Ward':''}${u.stealth?' · Stealth':''}`:'';show(`<div class="inspect-sheet">${cardHTML(c,'',true)}<h2>${esc(cardTitle(c))}</h2>${getLang()==='zh'&&cardTitle(c)!==c.name?`<p class="muted">${esc(c.name)}</p>`:''}<p class="effect-rules">${esc(cardRules(c))}</p>${c.keywords.filter(Boolean).length?`<p class="inspect-keys">${esc(c.keywords.filter(Boolean).join(' · '))}</p>`:''}${status?`<p class="inspect-status">${esc(status)}</p>`:''}</div>`,'realm-sheet');}
function acting(){if(state.choice)return state.choice.player;if(state.phase==='mulligan')return state.mulligan;return state.pending?.player??state.active;}
function human(){return state.mode==='local'||acting()===0;}
function actions(){return human()?legalActions(state,acting()):[];}
function cueFrom(a){if(a?.type==='pass'&&state.pending){const p=state.pending,u=unit(state,p.attacker);return {kind:'strike',attacker:p.attacker,target:p.target,at:p.combatAt??u?.at};}if(a?.type==='ranged'){const u=unit(state,a.unit);return u?{kind:'shot',at:u.at,direction:a.direction,uid:u.uid}:null;}return null;}
function perform(a){try{const cue=cueFrom(a);state=dispatch(state,a);battleCue=cue;selected=null;store.set('sorcery.match',state);render();scheduleAI();}catch(e){toast(e.message);}}
function scheduleAI(){clearTimeout(aiTimer);if(state.mode==='ai'&&acting()===1&&state.winner===null){const difficulty=AI_DIFFICULTIES.includes(state.aiDifficulty)?state.aiDifficulty:'medium';const delay=difficulty==='strong'?280:difficulty==='easy'?420:350;aiTimer=setTimeout(()=>{const a=chooseAction(observation(state,1),legalActions(state,1),1,{difficulty,root:state,omniscient:!!(state.aiOmniscient??aiOmniscient)});if(a)perform(a);},delay);}}
function chooseEffect(option){close();perform({type:'choose',player:acting(),option});}
function tryBoardChoice(hit){
  const spots=boardChoice();
  if(!spots||!human())return false;
  const idxs=[];
  spots.forEach((s,i)=>{
    if(!s||s.kind==='skip')return;
    if(hit.uid&&s.kind==='unit'&&s.uid===hit.uid)idxs.push(i);
    else if(hit.at!=null&&(s.kind==='cell'||s.kind==='direction')&&s.at===hit.at&&!(hit.uid&&spots.some(x=>x?.kind==='unit'&&x.uid===hit.uid)))idxs.push(i);
  });
  if(idxs.length===1){chooseEffect(idxs[0]);return true;}
  if(idxs.length>1){toast('這一格有表面和下層，請用上方清單指定要選哪一層。');return true;}
  return false;
}
function effectConfirmCopy(){
  const choice=state.choice,opts=choice?.options||[];
  if(!opts.length||!opts.every(o=>(o.label==='執行效果'&&o.value===true)||(o.label==='略過'&&o.value==null)))return null;
  let c=null;
  try{const id=choice.frame?.effectCard;if(id!=null)c=card(id);}catch{}
  const rules=c?String(cardRules(c)||'').trim():'';
  const text=rules&&rules!=='—'?rules:'可以執行或略過這項效果。';
  const payable=choice.frame?.step&&['paySummon','payLance'].includes(choice.frame.step.op);
  const unpaid=payable&&!opts.some(o=>o.value===true)?'目前法力不足，只能略過。':'';
  return {title:c?cardTitle(c):choice.title,text:unpaid?text+'\n'+unpaid:text};
}
function effectDialog(){
  if(!state.choice||!human())return;
  const choiceStep=state.choice.frame?.step,naming=choiceStep?.select?.kind==='spellName'||choiceStep?.op==='commitSpell'&&definitions[card(state.choice.frame.effectCard).slug]?.cast?.[0]?.select?.kind==='spellName';
  const board=!naming&&!!boardChoice();
  const confirm=effectConfirmCopy();
  const html=`<div class="eyebrow">${confirm?'是否執行效果':board?'點選戰場':'效果選擇'}</div><h2>${esc(confirm?confirm.title:state.choice.title)}</h2><p class="muted${confirm?' effect-rules':''}">${confirm?esc(confirm.text):board?'點選高亮的格子或單位。上方清單仍可使用。':state.choice?.frame?.step?.op==='combatAllocate'?'下面的數字是要打在框起來的那隻單位身上的傷害。':'選擇後繼續結算效果。'}</p>${naming?'<label>搜尋要命名的法術 <input id="spell-name-search" type="search" placeholder="輸入卡牌名稱" autocomplete="off"></label><p id="spell-name-empty" class="muted" hidden>沒有符合的法術名稱。</p>':''}<div class="modal-actions">${state.choice.options.map((o,i)=>`<button data-effect-choice="${i}"${confirm&&o.value===true?' class="confirm-yes"':confirm&&o.value==null?' class="confirm-skip"':''}>${esc(o.label)}</button>`).join('')}</div>`;
  if(!board)show(html,confirm?'effect-confirm':'realm-list');
  else{
    $('#modal-body').innerHTML=html;
    modal.classList.remove('effect-confirm','realm-list','realm-sheet');
    modal.classList.add('choice-banner');
    if(modal.matches(':modal'))modal.close();
    if(!modal.open)modal.show();
    modal.classList.toggle('choice-compact',(state.choice?.options.length||0)>8);
    playMotion($('#modal-body'),'fadeInDown');
  }
  modal.classList.toggle('effect-confirm',!!confirm);
  document.querySelectorAll('[data-effect-choice]').forEach(b=>b.onclick=()=>chooseEffect(+b.dataset.effectChoice));
  if(naming)$('#spell-name-search').oninput=e=>{const query=e.target.value.trim().toLocaleLowerCase();let count=0;document.querySelectorAll('[data-effect-choice]').forEach(b=>{const o=state.choice.options[+b.dataset.effectChoice],name=o.value,c=typeof name==='string'?cards.find(c=>c.name===name):null;b.hidden=!`${o.label} ${c?cardTitle(c):''}`.toLocaleLowerCase().includes(query);if(!b.hidden)count++;});$('#spell-name-empty').hidden=count>0;};
}
function objectsHTML(at){const objects=[...(state.artifacts||[]).filter(o=>o.at===at),...(state.auras||[]).filter(o=>inside(o,at))];return objects.map(o=>`<button class="realm-object" data-object="${o.uid}" data-card="${o.card}" title="${esc(card(o.card).name)}">${card(o.card).type==='Aura'?'◎':'⚒'} ${esc(cardTitle(card(o.card)))}${o.bearer?' · 攜帶中':''}${o.wallTo!==undefined?' · '+String.fromCharCode(65+o.at%5)+(4-Math.floor(o.at/5))+' ↔ '+String.fromCharCode(65+o.wallTo%5)+(4-Math.floor(o.wallTo/5)):''}</button>`).join('')+objects.filter(o=>o.wallTo!==undefined&&!o.silenced&&!o.disabled).map(o=>{const other=at===o.at?o.wallTo:o.at,side=other===at-5?'north':other===at+5?'south':other===at-1?'west':'east';return `<span class="wall-edge wall-${card(o.card).slug} wall-${side}" aria-hidden="true"></span>`;}).join('');}
function face(id){try{return cardTitle(card(id));}catch{return '';}}
function actionLabel(a){
  if(a.type==='transformHand')return a.sacrificeSummon?'犧牲 '+card(unit(state,a.target).card).name+' · 從手牌召喚 Moon Clan Werewolf':(a.amount?'支付 '+a.amount+' 魔力':'揭示手牌')+' · 將 '+card(unit(state,a.target).card).name+' 變為 '+card(state.players[a.player].hand.find(h=>h.uid===a.hand).card).name;
  if(a.type==='cast')return (a.payment==='harbinger'?'Harbinger (-1) : ':a.payment==='vermis'?'De Vermis (5) · ':a.payment==='randomDiscard'?'隨機棄牌 : ':state.players[a.player].bloodManaTurn===state.turn?'生命支付 : ':'')+(a.top?'牌庫頂'+(a.top.kind==='cradle'?'（少付 1）':'')+' · ':a.bound?'專屬法術 · ':a.grave!==undefined?'從墓地施放 · ':'施放 · ')+(a.layer==='below'?'地下／水下':'表面')+' · '+face(spellcaster(state,a.caster).card)+(a.casterLayer==='below'?'（地下／水下施法）':'')+(a.bearer?' · 裝備給 '+face(unit(state,a.bearer).card):'');
  if(a.type==='fiftyRam')return '攻城槌：撞向相鄰的 Wall 或 Monument';
  if(a.type==='pushBoulder')return '橫置：推動 Rolling Boulder';
  if(a.type==='resurrect')return '支付 '+passives[card(a.card).slug].skeletonReturnCost+' 法力，犧牲 Skeleton 復活 · '+(a.layer==='below'?'地下／水下':'表面')+(summoningTax(state,card(a.card))?'（另需 '+summoningTax(state,card(a.card))+' 法力召喚費用）':'');
  if(a.type==='cast'&&a.grave!==undefined)return '從墓地施放 · '+(a.layer==='below'?'地下／水下':'表面')+' · '+face(spellcaster(state,a.caster,a.casterLayer).card);
  if(a.type==='activate')return definitions[card(unit(state,a.unit).card).slug].activated[a.index].label;
  if(a.type==='ability')return a.mode==='atlas'?'橫置 · 抽地點':'橫置 · 抽法術';
  if(a.type==='ranged')return '遠程射擊 · '+['北','東','南','西'][a.direction];
  if(a.type==='homecomingMana')return 'Homecoming · 橫置：獲得 1 法力';if(a.type==='freeUnit')return '橫置：解救 '+face(unit(state,a.target).card);if(a.type==='hireSellsword')return '棄牌招募 : '+face(unit(state,a.target).card);if(a.type==='salmonRoll')return '橫置 : Salmon of Knowledge (d20)';if(a.type==='pickup')return '拾取物品';if(a.type==='drop')return '放下物品';
  if(a.bearer)return '裝備給 '+face(unit(state,a.bearer).card);
  if(a.type==='attack')return '攻擊 '+(a.target.startsWith('site:')?'地點':face(unit(state,a.target).card));
  return (a.type==='move'?'移動':'施放')+' · '+(a.layer==='below'?'地下／水下':'表面');
}
function itemAction(a){
  const u=unit(state,a.unit),items=a.type==='pickup'?pickupItems(state,u):(state.artifacts||[]).filter(o=>o.bearer===u.uid&&canDropArtifact(state,o));
  const api={card,power,disabled,keywords,canTarget,unitTypes},riders=a.type==='pickup'?carryChoices(state,u,api):passengers(state,u),space=a.type==='pickup'?(carryRule(u,api)?.capacity||0)-passengers(state,u).length:riders.length;
  show(`<div class="eyebrow">攜帶</div><h2>${actionLabel(a)}</h2>${riders.length?`<p class="effect-rules">選擇單位${a.type==='pickup'&&space<10000?'（最多 '+space+' 位）':''}</p>`:''}<div class="setup-options carry-picks">${items.map(o=>`<label><span><input type="checkbox" data-item="${o.uid}" checked> ${esc(face(o.card))}</span></label>`).join('')}${riders.map((v,i)=>`<label><span><input type="checkbox" data-carried-unit="${v.uid}" ${i<space?'checked':''}> ${esc(face(v.card))}</span></label>`).join('')}</div><div class="modal-actions"><button id="apply-items" class="primary">${actionLabel(a)}</button></div>`,'realm-sheet');
  $('#apply-items').onclick=()=>{const ids=[...document.querySelectorAll('[data-item]:checked')].map(b=>b.dataset.item),units=[...document.querySelectorAll('[data-carried-unit]:checked')].map(b=>b.dataset.carriedUnit);if(a.type==='pickup'&&units.length>space){toast('超過可攜帶的單位數量');return;}close();perform({...a,items:ids,units});};
}
function selectedActions(){return actions().filter(a=>selected?.kind==='hand'?a.hand===selected.id:selected?.kind==='bound'?a.bound===selected.id:selected?.kind==='top'?a.top?.card===selected.id:selected?.kind==='grave'?a.grave===selected.id:selected?.kind==='unit'?a.unit===selected.id:false);}
function boundSpellsDialog(){
  const own=(state.boundSpells||[]).filter(h=>[...state.units,...state.artifacts].find(u=>u.uid===h.unit)?.controller===acting());
  show(`<div class="eyebrow">保管</div><h2>專屬法術</h2><p class="effect-rules">由指定施法者保管，與手牌分開。</p><div class="modal-actions">${own.map(h=>`<button data-bound-card="${h.uid}">${esc(face(h.card))} · ${esc(face([...state.units,...state.artifacts].find(u=>u.uid===h.unit).card))}</button>`).join('')||'目前沒有專屬法術'}</div>`,'realm-list');
  document.querySelectorAll('[data-bound-card]').forEach(b=>b.onclick=()=>{const id=b.dataset.boundCard,h=own.find(h=>h.uid===id),list=actions().filter(a=>a.bound===id);if(!list.length)return inspect(h.card);close();selected={kind:'bound',id};render();if(card(h.card).type==='Magic'&&list[0].target===null)perform(list[0]);});
}
function topSpellDialog(){
  const p=state.mode==='local'?acting():0,access=topSpellAccess(state,p),id=access.cards[p],list=actions().filter(a=>a.type==='cast'&&a.top?.player===p);
  if(!access.canLook)return;
  show(`<div class="eyebrow">牌庫頂</div><h2>Spellbook</h2>${access.cards.map((id,q)=>q===p||access.publicTop?`<h3>${esc(state.players[q].name)}</h3>${id?cardHTML(card(id),'',true):'<p>牌庫已空</p>'}`:'').join('')}${id?`<div class="modal-actions"><button id="use-top-spell" ${!human()||!list.length?'disabled':''}>從牌庫頂施放</button></div>`:''}`,'realm-list');
  modal.classList.add('top-peek');
  if($('#use-top-spell'))$('#use-top-spell').onclick=()=>{close();selected={kind:'top',id};render();if(card(id).type==='Magic'&&list.every(a=>a.target===null))chooseCaster(list);};
}
function graveActionLabel(p,index){const a=actions().find(a=>a.grave===index&&a.player===p);return !a?'':a.type==='resurrect'?' · 犧牲 Skeleton 復活':' · 從墓地施放';}
function graveyardDialog(){
  show(`<div class="eyebrow">墓地</div><h2>雙方墓地</h2>${state.players.map((pl,p)=>`<h3>${esc(pl.name)}</h3><div class="modal-actions">${pl.cemetery.map((id,index)=>`<button data-grave-card="${p}:${index}">${esc(face(id))}${graveActionLabel(p,index)}</button>`).join('')||'<p class="muted">空</p>'}</div>`).join('')}`,'realm-list');
  document.querySelectorAll('[data-grave-card]').forEach(b=>b.onclick=()=>{const [p,index]=b.dataset.graveCard.split(':').map(Number),list=actions().filter(a=>a.player===p&&a.grave===index);if(!list.length)return inspect(state.players[p].cemetery[index]);close();menuOpen=false;selected={kind:'grave',id:index};render();if(card(state.players[p].cemetery[index]).type==='Magic'&&list[0].target===null){const casters=list.filter((a,i)=>list.findIndex(b=>b.caster===a.caster&&b.casterLayer===a.casterLayer)===i);if(casters.length===1)return perform(casters[0]);show(`<div class="eyebrow">施法</div><h2>選擇施法者</h2><div class="modal-actions">${casters.map((a,i)=>`<button data-grave-caster="${i}">${esc(face(spellcaster(state,a.caster,a.casterLayer).card))}</button>`).join('')}</div>`,'realm-list');document.querySelectorAll('[data-grave-caster]').forEach(b=>b.onclick=()=>{close();perform(casters[+b.dataset.graveCaster]);});}});
}
function playerBar(p){const pl=state.players[p],r=resources(state,p),on=acting()===p&&state.winner===null;return `<div class="player-bar ${state.active===p?'current':''} ${on?'has-priority':''}" data-player="${p}"><div class="portrait" aria-hidden="true">${p===0?'♜':'♝'}</div><div class="player-meta"><strong>${esc(pl.name)}</strong><small class="hud-extra">Atlas ${pl.atlas.length} · Spellbook ${pl.spells.length} · 墓地 ${pl.cemetery.length}</small></div><div class="resources"><span class="mana" title="目前來源 ${r.mana}，已花費 ${pl.spent}">✧ ${r.available}</span><span class="thresholds hud-extra">${elements.map(e=>`<span class="element ${e}" title="${e} 門檻">${r[e]}</span>`).join('')}</span></div><div class="life">${pl.doorTurn!==null?'☠':pl.life}<small>${pl.doorTurn!==null?'死亡之門':'生命'}</small></div></div>`;}
function unitHTML(u){const c=card(u.card),title=cardTitle(c),pick=boardChoice()?.some(s=>s?.kind==='unit'&&s.uid===u.uid);return `<button class="unit ${c.type==='Avatar'?'avatar':''} ${u.controller===0?'':'enemy'} ${u.tapped?'tapped':''} ${u.layer==='below'?'below':''} ${selected?.id===u.uid?'selected':''} ${pick?'choice-pick':''}" data-unit="${u.uid}" data-card="${u.card}" title="${esc(c.name)}"><span class="unit-name">${c.type==='Avatar'?'♜ ':''}${esc(title)}</span><span class="unit-stat">${power(u)}</span><small>${u.tapped?'↷ 已橫置':disabled(u)?'⛓ 失能':ready(state,u)?'● 可行動':'◷ 召喚失調'} ${u.tapped&&disabled(u)?'⛓ 失能 ':String()} ${u.layer==='below'?'▾ 下層 ':String()} ${u.damage?'−'+u.damage:''} ${u.ward?'◇ Ward':''} ${u.stealth?'◌ Stealth':''} ${u.carriedBy?'乘坐 '+esc(cardTitle(card(unit(state,u.carriedBy)?.card||u.card))):''} ${u.iceTurns>0?'冰封 '+u.iceTurns:''}</small></button>`;}
function priorityLabel(){if(state.winner!==null)return '已結束';if(state.choice)return '等待選擇';if(state.pending)return '回應中';if(state.phase==='mulligan')return '重抽';return state.players[acting()].name+' 優先';}
function passLabel(){const p=state.pending;if(!p)return '讓過';if(p.kind==='intercept')return '不攔截，讓它進入';return p.defenders?.length?'防禦完成，開始結算':'不防禦，開始結算';}
function strikeCaption(){const pending=state.pending;if(!pending)return '';const a=unit(state,pending.attacker),from=a?cardTitle(card(a.card)):'單位';if(pending.kind==='intercept')return `${from} 正在進入，可以攔截`;if(typeof pending.target==='string'&&pending.target.startsWith('site:')){const site=state.board[Number(pending.target.slice(5))];return `${from} 正在攻擊 ${site?cardTitle(card(site.card)):'地點'}`;}const t=pending.target&&unit(state,pending.target);return t?`${from} 正在攻擊 ${cardTitle(card(t.card))}`:`${from} 正在攻擊`;}
function strikeTargetEl(pending){if(typeof pending.target==='string'&&pending.target.startsWith('site:')){const at=pending.target.slice(5);return document.querySelector(`[data-site="${at}"]`)||document.querySelector(`[data-at="${at}"]`);}if(pending.target){const el=document.querySelector(`.board [data-unit="${CSS.escape(String(pending.target))}"]`);if(el)return el;}for(const id of pending.defenders||[]){const el=document.querySelector(`.board [data-unit="${CSS.escape(id)}"]`);if(el)return el;}const at=pending.combatAt??unit(state,pending.attacker)?.at;return at==null?null:document.querySelector(`[data-at="${at}"]`);}
function showStrike(){const board=document.querySelector('.board');board?.querySelectorAll('.strike-arrow,.strike-label,.cue-arrow').forEach(n=>n.remove());document.querySelectorAll('.lunging,.strike-from,.strike-to').forEach(el=>{el.classList.remove('lunging','strike-from','strike-to');el.style.removeProperty('--lunge-x');el.style.removeProperty('--lunge-y');});document.querySelectorAll('.cell.strike-cell').forEach(el=>el.classList.remove('strike-cell'));const pending=view==='play'?state?.pending:null;if(!board||!pending){seenStrike='';return;}const attacker=unit(state,pending.attacker);if(!attacker)return;const fromEl=board.querySelector(`[data-unit="${CSS.escape(attacker.uid)}"]`),toEl=strikeTargetEl(pending),cell=board.querySelector(`[data-at="${pending.combatAt??attacker.at}"]`);if(fromEl)fromEl.classList.add('strike-from','lunging');if(toEl?.classList.contains('unit'))toEl.classList.add('strike-to');else toEl?.closest('.cell')?.classList.add('strike-cell');if(cell)cell.classList.add('strike-cell');for(const id of pending.defenders||[]){const el=board.querySelector(`[data-unit="${CSS.escape(id)}"]`);if(el)el.classList.add('strike-to');}const key=`${pending.kind}|${pending.attacker}|${pending.target}`;if(fromEl&&fromEl.getBoundingClientRect().height>2&&key!==seenStrike){const stage=document.querySelector('.stage');if(stage){const cr=fromEl.getBoundingClientRect(),sr=stage.getBoundingClientRect();stage.scrollLeft+=cr.left-sr.left-(sr.width-cr.width)/2;stage.scrollTop+=cr.top-sr.top-(sr.height-cr.height)/2;viewScroll.l=stage.scrollLeft;viewScroll.t=stage.scrollTop;updateMinimap();}}if(fromEl&&fromEl.getBoundingClientRect().height>2)seenStrike=key;if(!fromEl)return;const br=board.getBoundingClientRect(),ar=fromEl.getBoundingClientRect();const label=document.createElement('div');label.className='strike-label';label.textContent=strikeCaption();const lx=Math.min(Math.max(ar.left+ar.width/2-br.left,72),Math.max(72,board.clientWidth-72));label.style.left=lx+'px';label.style.top=Math.max(16,ar.top-br.top)+'px';board.append(label);if(!toEl||toEl===fromEl||ar.width<2)return;const tr=toEl.getBoundingClientRect(),x1=ar.left+ar.width/2-br.left,y1=ar.top+ar.height/2-br.top,x2=tr.left+tr.width/2-br.left,y2=tr.top+tr.height/2-br.top,dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len;const lunge=Math.max(10,Math.min(22,len*0.45));fromEl.style.setProperty('--lunge-x',(ux*lunge).toFixed(1)+'px');fromEl.style.setProperty('--lunge-y',(uy*lunge).toFixed(1)+'px');if(len<10)return;const room=Math.max(8,len-14),inset=(w,h)=>Math.min(room/2,Math.min(w,h)/2+2),aPad=inset(ar.width,ar.height),bPad=inset(tr.width,tr.height);const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('class','strike-arrow');svg.setAttribute('viewBox',`0 0 ${board.clientWidth} ${board.clientHeight}`);const ns='http://www.w3.org/2000/svg',defs=document.createElementNS(ns,'defs'),marker=document.createElementNS(ns,'marker');marker.setAttribute('id','strike-head');marker.setAttribute('markerWidth','8');marker.setAttribute('markerHeight','8');marker.setAttribute('refX','6');marker.setAttribute('refY','3');marker.setAttribute('orient','auto');const head=document.createElementNS(ns,'path');head.setAttribute('d','M0,0 L7,3 L0,6 Z');marker.append(head);defs.append(marker);const line=document.createElementNS(ns,'line');line.setAttribute('x1',(x1+ux*aPad).toFixed(1));line.setAttribute('y1',(y1+uy*aPad).toFixed(1));line.setAttribute('x2',(x2-ux*bPad).toFixed(1));line.setAttribute('y2',(y2-uy*bPad).toFixed(1));svg.append(defs,line);board.append(svg);}
function drawCue(board,pts,cls){if(pts.length<2)return;const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('class','cue-arrow');svg.setAttribute('viewBox',`0 0 ${board.clientWidth} ${board.clientHeight}`);const line=document.createElementNS(ns,'polyline');line.setAttribute('class',cls);line.setAttribute('points',pts.map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '));svg.append(line);board.append(svg);}
function showCue(){if(state?.pending||!battleCue)return;const board=document.querySelector('.board');if(!board||board.clientWidth<8)return;board.querySelectorAll('.cue-arrow').forEach(n=>n.remove());const cue=battleCue,br=board.getBoundingClientRect(),center=el=>{const r=el.getBoundingClientRect();return {x:r.left+r.width/2-br.left,y:r.top+r.height/2-br.top};};if(cue.kind==='shot'){const dx=[0,1,0,-1][cue.direction],dy=[-1,0,1,0][cue.direction];let x=cue.at%5,y=(cue.at/5)|0;const pts=[];const start=board.querySelector(`[data-at="${cue.at}"]`);if(start)pts.push(center(start));for(let i=0;i<4;i++){x+=dx;y+=dy;if(x<0||x>4||y<0||y>3)break;const cell=board.querySelector(`[data-at="${y*5+x}"]`);if(cell)pts.push(center(cell));}drawCue(board,pts,'cue-shot');const shooter=board.querySelector(`[data-unit="${CSS.escape(cue.uid)}"]`);if(shooter&&pts.length>1){const a=pts[0],b=pts[pts.length-1],len=Math.hypot(b.x-a.x,b.y-a.y)||1;shooter.classList.add('lunging-once');shooter.style.setProperty('--lunge-x',((b.x-a.x)/len*16).toFixed(1)+'px');shooter.style.setProperty('--lunge-y',((b.y-a.y)/len*16).toFixed(1)+'px');}}if(cue.kind==='strike'){const from=board.querySelector(`[data-unit="${CSS.escape(cue.attacker)}"]`);const to=typeof cue.target==='string'&&cue.target.startsWith('site:')?board.querySelector(`[data-at="${cue.target.slice(5)}"]`):board.querySelector(`[data-unit="${CSS.escape(String(cue.target||''))}"]`)||(cue.at==null?null:board.querySelector(`[data-at="${cue.at}"]`));if(!from||!to)return;from.classList.add('lunging-once','strike-from');if(to.classList.contains('unit'))to.classList.add('strike-to');else to.classList.add('strike-cell');const A=center(from),B=center(to),dx=B.x-A.x,dy=B.y-A.y,len=Math.hypot(dx,dy)||1;from.style.setProperty('--lunge-x',(dx/len*16).toFixed(1)+'px');from.style.setProperty('--lunge-y',(dy/len*16).toFixed(1)+'px');drawCue(board,[A,B],'cue-strike');}}
function markListedUnits(){const step=state?.choice?.frame?.step;if(step?.op==='combatAllocate'){const uid=step.plans?.[step.planIndex]?.targets?.[step.targetIndex];if(uid)document.querySelector(`.board [data-unit="${CSS.escape(uid)}"]`)?.classList.add('strike-to','split-target');}for(const o of state?.choice?.options||[]){const uid=o?.value?.entity==='unit'&&o.value.uid;if(uid)document.querySelector(`.board [data-unit="${CSS.escape(uid)}"]`)?.classList.add('strike-to');}}
function noteSeat(){const fan=document.querySelector('.fan');if(!fan||state?.mode!=='local'||state.winner!==null||state.phase==='mulligan'){seenActive=state?.active??null;handSealed=false;fan?.classList.remove('sealed');return;}if(seenActive!==null&&seenActive!==state.active)handSealed=true;seenActive=state.active;fan.classList.toggle('sealed',handSealed);let seal=fan.querySelector('.hand-seal');if(!handSealed){seal?.remove();return;}if(!seal){seal=document.createElement('button');seal.type='button';seal.className='hand-seal';seal.onclick=e=>{e.stopPropagation();handSealed=false;fan.classList.remove('sealed');seal.remove();};fan.append(seal);}seal.textContent=`交給${state.players[state.active].name} · 點此看手牌`;}
function contextHTML(p){if(state.winner!==null)return `<strong>${esc(state.players[state.winner].name)} 獲勝</strong>`;if(!human()){const last=state.log?.at?.(-1)?.text;return last?`對手行動 · ${esc(last)}`:'對手思考中';}if(state.choice)return boardChoice()?`點選高亮處 · ${esc(state.choice.title)}`:'請完成效果選擇';if(!selected)return state.pending?strikeCaption():(state.ongoingEffects||[]).some(e=>e.op==='peaceTruce'&&e.player===p&&e.usedTurn===state.turn)?'休戰 · 本回合不能攻擊對方的單位或地點':'';const entry=selected.kind==='hand'?state.players[p].hand.find(h=>h.uid===selected.id):selected.kind==='grave'?{card:state.players[p].cemetery[selected.id]}:selected.kind==='top'?{card:selected.id}:selected.kind==='bound'?(state.boundSpells||[]).find(h=>h.uid===selected.id):unit(state,selected.id);if(!entry)return '';return `<strong>${esc(face(entry.card))}</strong> ${selected.kind==='grave'?(passives[card(entry.card).slug]?.skeletonReturnCost!==undefined?'犧牲 Skeleton 復活 · ':'從墓地施放 · '):''}${selectedActions().length?'點金色格子或目標':'目前無合法操作'} <button type="button" id="cancel">取消</button>`;}
function mountChoice(html){const host=document.querySelector('.choice-host');if(!host){show(html);return;}host.innerHTML=`<div class="choice-pop">${html}<button type="button" id="dismiss-choice">關閉</button></div>`;playMotion(host.querySelector('.choice-pop'),'fadeInUp');$('#dismiss-choice').onclick=()=>{host.innerHTML='';};}
function dismissChoice(){const host=document.querySelector('.choice-host');if(host)host.innerHTML='';}
function clearPreview(){document.querySelectorAll('.cell.preview,.cell.path,.unit.preview-target').forEach(el=>el.classList.remove('preview','path','preview-target'));}
function showPreview(x,y){clearPreview();const under=document.elementFromPoint(x,y);const cell=under?.closest?.('[data-at]');if(!cell||!selected)return;const at=+cell.dataset.at,target=under.closest('[data-unit]')?.dataset.unit;cell.classList.add('preview');if(target)under.closest('[data-unit]').classList.add('preview-target');const matches=selectedActions().filter(a=>target?a.target===target||a.bearer===target:a.at===at||a.target===at);for(const i of matches.find(a=>a.path)?.path||[]){const node=document.querySelector(`[data-at="${i}"]`);if(node&&node!==cell)node.classList.add('path');}}
function boardMode(){const w=innerWidth,h=innerHeight;if(w<=720&&h>w)return 'portrait';if(h<=520)return 'short';return 'fill';}
function handProfile(){const w=innerWidth,h=innerHeight,coarse=matchMedia('(pointer: coarse)').matches;if(h<=520||(w>h&&w<1400))return 'landscape';if(w<=700&&h>w)return 'portrait';if(coarse||w<1180)return 'tablet';return 'desktop';}
function hidePeek(){const el=$('#card-peek');if(!el)return;el.hidden=true;el.innerHTML='';}
function showPeek(cardId){const el=$('#card-peek');if(!el||!cardId)return;el.hidden=false;el.innerHTML=cardHTML(card(cardId),'',true);const dock=document.querySelector('.hud-bottom');const gap=dock?Math.max(8,innerHeight-dock.getBoundingClientRect().top+10):160;el.style.bottom=gap+'px';}
function syncPeek(){if(view!=='play'||pointer||!selected||selected.kind!=='hand'){hidePeek();return;}const entry=state.players[acting()]?.hand.find(h=>h.uid===selected.id);if(!entry){hidePeek();return;}showPeek(entry.card);}
function centerHandCard(el){const fan=el?.closest('.fan');if(!fan||fan.dataset.layout==='fan')return;const left=el.getBoundingClientRect().left-fan.getBoundingClientRect().left+fan.scrollLeft-(fan.clientWidth-el.offsetWidth)/2;fan.scrollTo({left:Math.max(0,left),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}
let handObserver=null;
let handBusy=false,handTimer=0,handFlip=null;
function reduceMotion(){return matchMedia('(prefers-reduced-motion: reduce)').matches;}
function captureHandFlip(){
  if(reduceMotion()||view!=='play'){handFlip=null;return;}
  const map=new Map();
  document.querySelectorAll('.fan [data-hand]').forEach(el=>{
    const r=el.getBoundingClientRect();
    if(r.width)map.set(el.dataset.hand,{x:r.left+r.width/2,y:r.top+r.height/2});
  });
  handFlip=map.size?map:null;
}
function playHandFlip(){
  const prev=handFlip;handFlip=null;
  if(!prev||reduceMotion())return;
  const run=()=>{
    document.querySelectorAll('.fan [data-hand]').forEach(el=>{
      const id=el.dataset.hand,first=prev.get(id),last=el.getBoundingClientRect();
      if(!last.width)return;
      const rot=getComputedStyle(el).getPropertyValue('--fan-rot').trim()||'0deg';
      const lift=getComputedStyle(el).getPropertyValue('--fan-lift').trim()||'0px';
      const spread=getComputedStyle(el).getPropertyValue('--fan-spread').trim()||'0px';
      const base=`translateX(${spread}) translateY(${lift}) rotate(${rot})`;
      if(first){
        const dx=first.x-(last.left+last.width/2),dy=first.y-(last.top+last.height/2);
        if(Math.hypot(dx,dy)<1.5)return;
        el.animate([{transform:`translate(${dx}px,${dy}px) ${base}`},{transform:base}],{duration:220,easing:'cubic-bezier(.2,.7,.2,1)'});
      }else{
        el.animate([{transform:`translateY(36px) scale(.9) ${base}`,opacity:.15},{transform:base,opacity:1}],{duration:260,easing:'cubic-bezier(.2,.8,.2,1)'});
      }
    });
  };
  requestAnimationFrame(()=>requestAnimationFrame(run));
}
function scheduleHand(){clearTimeout(handTimer);handTimer=setTimeout(()=>{handTimer=0;layoutHand();},32);}
function layoutHand(){
  const fan=document.querySelector('.fan');
  if(!fan||handBusy)return;
  const table=fan.closest('.table'),profile=handProfile();
  if(table&&table.dataset.handProfile!==profile)table.dataset.handProfile=profile;
  const groups=[...fan.querySelectorAll('.hand-group')].filter(g=>g.querySelector('.card'));
  const n=groups.reduce((sum,g)=>sum+g.querySelectorAll('.card').length,0);
  const avail=Math.max(96,Math.round((fan.clientWidth||0)/8)*8),fanH=Math.max(56,Math.round((fan.clientHeight||0)/4)*4),open=!!table?.classList.contains('hand-open');
  let cardH,cardW,layout;
  if(profile==='portrait'){layout='strip';cardH=Math.min(open?240:140,Math.max(100,fanH-22));cardW=Math.round(Math.min(136,Math.max(92,cardH*.72)));}
  else if(profile==='landscape'){cardH=Math.min(open?110:86,Math.max(56,fanH-8));cardW=Math.round(Math.max(70,Math.min(108,cardH*0.78)));layout=n*(cardW+6)>avail-8?'strip':'compact';}
  else if(profile==='tablet'){cardH=Math.min(open?220:172,Math.max(120,fanH-20));cardW=Math.round(Math.min(130,Math.max(90,cardH*.7)));layout=n<=8?'fan':'strip';}
  else{cardH=Math.min(open?200:176,Math.max(132,fanH-36));cardW=Math.round(Math.max(100,cardH/1.36));layout='fan';}
  cardH=Math.min(cardH,Math.max(52,fanH-(profile==='landscape'?8:profile==='desktop'?36:20)));
  cardW=Math.round(Math.max(64,Math.min(cardW,cardH*0.85)));
  const minSlice=profile==='desktop'?52:profile==='tablet'?44:48;let becomeStrip=false;const shown=Math.max(groups.length,1);let totalNatural=0;
  const groupStyles=[];
  groups.forEach(g=>{
    const cards=[...g.querySelectorAll('.card')];
    const count=cards.length;let overlap=0,rotStep=0,liftStep=0;
    if(layout==='fan'&&count>0){
      const share=Math.max(cardW,(avail-16*(shown-1)-8)*(count/Math.max(n,1)));
      const natural=count*cardW;totalNatural+=natural;
      if(count>1&&natural>share)overlap=(natural-share)/(count-1);
      if(overlap>cardW-minSlice){becomeStrip=true;overlap=0;}
      else{
        rotStep=count<=1?0:Math.min(3.4,Math.max(0.55,16/Math.max(count,2)));
        liftStep=count<=1?0:Math.min(11,Math.max(3,36/Math.max(count,2)));
        if(count<=3){rotStep*=0.72;liftStep*=0.65;}
      }
    }else totalNatural+=count*cardW;
    if(profile==='landscape'&&layout==='compact'&&count>1){
      const need=n*(cardW+4);
      if(need>avail)overlap=Math.min(cardW-40,Math.max(0,(need-avail)/Math.max(n-1,1)));
    }
    groupStyles.push({g,cards,count,overlap,rotStep,liftStep});
  });
  if(layout==='fan'&&(n>=12||totalNatural+16*(shown-1)>avail))becomeStrip=true;
  if(becomeStrip)layout='strip';
  if(layout==='compact'){
    const need=n*cardW+8*Math.max(n-1,0)+24*Math.max(shown-1,0);
    if(need>avail)layout='strip';
  }
  if(layout==='strip'||layout==='compact')groupStyles.forEach(s=>{s.overlap=layout==='strip'?0:s.overlap;s.rotStep=0;s.liftStep=0;});
  const snap=layout==='fan'?0:Math.max(16,Math.min(48,(avail-cardW)/2));
  const sig=[profile,layout,Math.round(cardW),Math.round(cardH),n,avail,fanH,open,Math.round(snap),groupStyles.map(s=>`${s.count}:${Math.round(s.overlap)}:${s.rotStep.toFixed(2)}`).join(',')].join('|');
  if(fan.dataset.sig===sig)return;
  handBusy=true;
  groupStyles.forEach(({g,cards,count,overlap,rotStep,liftStep})=>{
    g.dataset.cards=String(count);
    g.style.setProperty('--overlap',(overlap||0)+'px');
    g.style.setProperty('--fan','0deg');
    const mid=(count-1)/2;
    cards.forEach((el,i)=>{
      const t=i-mid;
      const rot=layout==='fan'?t*rotStep:0;
      const lift=layout==='fan'?Math.abs(t)*liftStep:0;
      el.style.setProperty('--i',String(i));
      el.style.setProperty('--n',String(Math.max(count,1)));
      el.style.setProperty('--fan-rot',rot+'deg');
      el.style.setProperty('--fan-lift',lift+'px');
      el.style.setProperty('--fan-z',String(10+i));
      el.style.zIndex=String(10+i);
    });
  });
  fan.dataset.sig=sig;
  fan.dataset.layout=layout;
  fan.dataset.count=String(n);
  fan.style.setProperty('--card-w',Math.round(cardW)+'px');
  fan.style.setProperty('--card-h',Math.round(cardH)+'px');
  fan.style.setProperty('--snap-pad',snap+'px');
  handBusy=false;
}
function watchHand(){const fan=document.querySelector('.fan');if(!fan||typeof ResizeObserver==='undefined')return;if(!handObserver)handObserver=new ResizeObserver(()=>scheduleHand());handObserver.disconnect();handObserver.observe(fan);}

function focusBoard(mode){const stage=document.querySelector('.stage'),frame=document.querySelector('.board-frame');if(!stage||!frame)return;if(mode==='center'){stage.scrollLeft=Math.max(0,(frame.offsetWidth-stage.clientWidth)/2);stage.scrollTop=Math.max(0,(frame.offsetHeight-stage.clientHeight)/2);}else{const who=state?.mode==='local'?acting():0,av=state&&avatar(state,who),cell=av&&document.querySelector(`[data-at="${av.at}"]`);if(!cell)return focusBoard('center');const cr=cell.getBoundingClientRect(),sr=stage.getBoundingClientRect();stage.scrollLeft+=cr.left-sr.left-(sr.width-cr.width)/2;stage.scrollTop+=cr.top-sr.top-(sr.height-cr.height)/2;}viewScroll.l=stage.scrollLeft;viewScroll.t=stage.scrollTop;updateMinimap();}
function jumpEdge(dir){const stage=document.querySelector('.stage');if(!stage)return;const sr=stage.getBoundingClientRect();let best=null,score=1e9;document.querySelectorAll('.cell.legal').forEach(c=>{const r=c.getBoundingClientRect();const off=dir==='w'?sr.left-r.right:dir==='e'?r.left-sr.right:dir==='n'?sr.top-r.bottom:r.top-sr.bottom;if(off>6&&off<score){score=off;best=c;}});if(!best)return;const r=best.getBoundingClientRect();stage.scrollLeft+=r.left-sr.left-(sr.width-r.width)/2;stage.scrollTop+=r.top-sr.top-(sr.height-r.height)/2;viewScroll.l=stage.scrollLeft;viewScroll.t=stage.scrollTop;updateMinimap();}
function updateMinimap(){const map=document.querySelector('#minimap'),stage=document.querySelector('.stage'),frame=document.querySelector('.board-frame');if(!map||!stage||!frame)return;if(!map.childElementCount){map.innerHTML=Array.from({length:20},(_,i)=>`<i data-mini="${i}"></i>`).join('')+'<b id="minimap-view"></b>';map.onclick=ev=>{const hit=ev.target.closest('[data-mini]');if(hit){const node=document.querySelector(`[data-at="${hit.dataset.mini}"]`);if(!node)return;const cr=node.getBoundingClientRect(),sr=stage.getBoundingClientRect();stage.scrollLeft+=cr.left-sr.left-(sr.width-cr.width)/2;stage.scrollTop+=cr.top-sr.top-(sr.height-cr.height)/2;}else{const r=map.getBoundingClientRect();stage.scrollLeft=((ev.clientX-r.left)/r.width)*frame.offsetWidth-stage.clientWidth/2;stage.scrollTop=((ev.clientY-r.top)/r.height)*frame.offsetHeight-stage.clientHeight/2;}viewScroll.l=stage.scrollLeft;viewScroll.t=stage.scrollTop;updateMinimap();};}map.querySelectorAll('[data-mini]').forEach(n=>{const src=document.querySelector(`[data-at="${n.dataset.mini}"]`);n.className='';if(!src)return;if(src.classList.contains('has-site'))n.classList.add('mini-site');if(src.classList.contains('legal'))n.classList.add('mini-legal');if(src.classList.contains('own-site'))n.classList.add('mini-own');if(src.classList.contains('enemy-site'))n.classList.add('mini-enemy');if(src.querySelector('.unit.avatar'))n.classList.add('mini-avatar');});const view=document.querySelector('#minimap-view'),fw=frame.offsetWidth||1,fh=frame.offsetHeight||1;if(view){view.style.left=(stage.scrollLeft/fw*100)+'%';view.style.top=(stage.scrollTop/fh*100)+'%';view.style.width=Math.min(100,stage.clientWidth/fw*100)+'%';view.style.height=Math.min(100,stage.clientHeight/fh*100)+'%';}const sr=stage.getBoundingClientRect(),flags={n:false,e:false,s:false,w:false};document.querySelectorAll('.cell.legal').forEach(c=>{const r=c.getBoundingClientRect();if(r.bottom<sr.top+4)flags.n=true;if(r.top>sr.bottom-4)flags.s=true;if(r.right<sr.left+4)flags.w=true;if(r.left>sr.right-4)flags.e=true;});for(const k of ['n','e','s','w']){const b=document.querySelector('.edge-'+k);if(b)b.hidden=!flags[k];}}
function layoutBoard(){const stage=document.querySelector('.stage'),frame=document.querySelector('.board-frame');layoutHand();if(!stage||!frame)return;const sw=stage.clientWidth,sh=stage.clientHeight;if(sw<8||sh<8)return;const mode=boardMode(),z=boardZoom;let w,h;if(mode==='portrait'){const cellH=Math.max(80*z,(sh-16)/4);const cellW=Math.max(92*z,cellH*1.12);w=cellW*5+16;h=cellH*4+16;if(z<=1.02)h=Math.min(h,sh);}else if(mode==='short'){const cellH=Math.max(64*z,(sh-8)/4);w=Math.floor(Math.max(1,sw)*z);h=Math.floor(Math.max(sh,cellH*4+8));}else{w=Math.floor(Math.max(1,sw)*z);h=Math.floor(Math.max(1,sh)*z);}const fw=Math.floor(w)+'px',fh=Math.floor(h)+'px';if(frame.style.width!==fw)frame.style.width=fw;if(frame.style.height!==fh)frame.style.height=fh;const slackX=Math.max(0,sw-frame.offsetWidth),slackY=Math.max(0,sh-frame.offsetHeight);frame.style.marginLeft=slackX>2?Math.floor(slackX/2)+'px':'0';frame.style.marginTop=slackY>2?Math.floor(slackY/2)+'px':'0';stage.classList.toggle('can-pan',frame.offsetWidth>stage.clientWidth+4||frame.offsetHeight>stage.clientHeight+4);stage.classList.toggle('panning',panMode);if(!viewScroll.init){viewScroll.init=true;focusBoard('avatar');}else{stage.scrollLeft=viewScroll.l;stage.scrollTop=viewScroll.t;}updateMinimap();showStrike();markListedUnits();showCue();noteSeat();}
function setZoom(z){const stage=document.querySelector('.stage'),frame=document.querySelector('.board-frame');let rx=.5,ry=.5;if(stage&&frame?.offsetWidth){rx=(stage.scrollLeft+stage.clientWidth/2)/frame.offsetWidth;ry=(stage.scrollTop+stage.clientHeight/2)/frame.offsetHeight;}boardZoom=Math.min(2.6,Math.max(.65,z));layoutBoard();const frame2=document.querySelector('.board-frame'),stage2=document.querySelector('.stage');if(stage2&&frame2){stage2.scrollLeft=rx*frame2.offsetWidth-stage2.clientWidth/2;stage2.scrollTop=ry*frame2.offsetHeight-stage2.clientHeight/2;viewScroll.l=stage2.scrollLeft;viewScroll.t=stage2.scrollTop;updateMinimap();}}
function playMotion(el,name){if(!el||reduceMotion())return;for(const n of ['zoomIn','zoomOut','fadeIn','fadeInUp','fadeInDown','fadeOut','shakeX'])el.classList.remove('animate__'+n);el.classList.remove('animate__animated','motion-once');void el.offsetWidth;el.classList.add('animate__animated','animate__'+name,'motion-once');el.addEventListener('animationend',()=>el.classList.remove('animate__animated','animate__'+name,'motion-once'),{once:true});}
function spawnGhost(el,name){const r=el.getBoundingClientRect();if(r.width<2||r.height<2)return;const g=el.cloneNode(true);g.classList.add('motion-ghost');g.classList.remove('choice-pick','selected','just-hit','animate__animated','motion-once');for(const a of ['data-unit','data-hand','data-card','data-site','id'])g.removeAttribute(a);g.querySelectorAll('[data-unit],[data-hand],[id]').forEach(n=>{n.removeAttribute('data-unit');n.removeAttribute('data-hand');n.removeAttribute('id');});g.style.left=r.left+'px';g.style.top=r.top+'px';g.style.width=r.width+'px';g.style.height=r.height+'px';document.body.append(g);playMotion(g,name);const drop=()=>g.remove();g.addEventListener('animationend',drop,{once:true});setTimeout(drop,800);}
function departGhosts(){if(!motionReady||reduceMotion()||!state)return;const alive=new Set(state.units.map(u=>u.uid)),ghosted=new Set();document.querySelectorAll('.board [data-unit]').forEach(el=>{const id=el.dataset.unit;if(alive.has(id)||ghosted.has(id))return;ghosted.add(id);spawnGhost(el,'zoomOut');});const hands=new Set(state.players.flatMap(pl=>pl.hand.map(h=>h.uid)));document.querySelectorAll('.fan [data-hand]').forEach(el=>{if(!hands.has(el.dataset.hand))spawnGhost(el,'fadeOut');});}
function resetMotion(){seenUnits=new Set();seenSites=new Map();seenDamage=new Map();seenPhase='';seenWinner=null;seenStrike='';seenLog=-1;seenActive=null;handSealed=false;battleCue=null;motionReady=false;document.querySelectorAll('.motion-ghost').forEach(n=>n.remove());}
function noteArrivals(){const root=document.querySelector('.board');if(motionReady&&!reduceMotion()){for(const u of state.units){if(!seenUnits.has(u.uid))playMotion(root?.querySelector(`[data-unit="${CSS.escape(u.uid)}"]`),'zoomIn');}for(let i=0;i<20;i++){const id=state.board[i]?.card??null;if(id!=null&&seenSites.get(i)!==id)playMotion(root?.querySelector(`[data-site="${i}"]`),'fadeIn');}}if(state.winner!==null&&seenWinner!==state.winner)playMotion(document.querySelector('.victory h2'),'zoomIn');seenUnits=new Set(state.units.map(u=>u.uid));seenSites=new Map();for(let i=0;i<20;i++)if(state.board[i])seenSites.set(i,state.board[i].card);seenWinner=state.winner;motionReady=true;}
function noteBattle(phase){const root=document.querySelector('.board');if(root)for(const u of state.units){const prev=seenDamage.get(u.uid);if(prev!==undefined&&u.damage>prev){const el=root.querySelector(`[data-unit="${CSS.escape(u.uid)}"]`);if(el){el.classList.add('just-hit');playMotion(el.querySelector('.unit-name'),'shakeX');const f=document.createElement('span');f.className='dmg-float';f.textContent='−'+(u.damage-prev);el.append(f);}}seenDamage.set(u.uid,u.damage);}for(const id of [...seenDamage.keys()])if(!state.units.some(u=>u.uid===id))seenDamage.delete(id);const key=`${state.turn}|${state.phase}|${state.active}|${state.winner}|${state.pending?.kind||''}`;const fresh=motionReady&&seenLog>=0&&state.log.length>seenLog?state.log[state.log.length-1].text:'';if(fresh){const b=document.querySelector('.turn-banner');if(b){b.textContent=fresh;b.classList.remove('show');void b.offsetWidth;b.classList.add('show');}}else if(seenPhase&&seenPhase!==key){const b=document.querySelector('.turn-banner');if(b){b.textContent=state.winner!==null?`${state.players[state.winner].name} 取得領域`:`回合 ${state.turn} · ${phase}`;b.classList.remove('show');void b.offsetWidth;b.classList.add('show');}}seenPhase=key;seenLog=state.log.length;noteArrivals();}
function renderBattle(){
  // Access is recalculated after every effect; hidden library cards are never
  // included in the top-card dialog merely because the save contains them.
  departGhosts();
  captureHandFlip();
  const p=state.mode==='local'?acting():0,opponent=1-p,legal=selectedActions();
  const spots=new Set(legal.map(a=>a.at??(typeof a.target==='number'?a.target:unit(state,a.target)?.at)).filter(n=>n!==undefined));
  const threats=new Set(legal.filter(a=>a.type==='attack'&&a.at!==undefined).map(a=>a.at));
  const picks=boardChoice();
  if(picks)for(const s of picks)if(s&&(s.kind==='cell'||s.kind==='direction')&&s.at!=null)spots.add(s.at);
  const phase=state.winner!==null?'對局結束':state.choice?'效果結算':state.phase==='mulligan'?'開局重抽':state.phase==='draw'?'抽牌':state.pending?'回應 · '+(state.pending.kind==='attack'?'防禦':'攔截'):human()&&!actions().some(a=>a.type==='end')&&actions().some(a=>a.type==='attack')?'強制動作 · 先移動並攻擊':'主要階段';
  const me=state.players[p];
  const revealed=handIsRevealed(state,opponent),backs=revealed?'<button type="button" id="revealed-hand">'+state.players[opponent].hand.length+'張手牌公開</button>':Array(Math.min(12,state.players[opponent].hand.length)).fill('<span class="card-back"></span>').join('');
  const dev=`${cards.length} 筆官方資料，${cards.filter(c=>c.playable).length} 張可操作，完整規則仍待驗證。`;
  const topAccess=topSpellAccess(state,p);
  const actionsHTML=`${topAccess.canLook?'<button class="action-button" id="top-spell">牌庫頂</button>':''}<button class="action-button" id="bound-spells">專屬法術</button>${state.phase==='draw'&&human()?'<button class="action-button primary" data-draw="spells">抽 Spellbook</button><button class="action-button" data-draw="atlas">抽 Atlas</button>':''}${state.phase==='mulligan'&&human()?'<button class="action-button primary" id="mulligan">檢視起始手牌</button>':''}${state.pending&&human()?`<button class="action-button primary" id="pass">${esc(passLabel())}</button>`:''}${state.phase==='main'&&!state.pending&&!state.choice&&state.winner===null?`<button class="action-button primary" id="end" ${!human()||!actions().some(a=>a.type==='end')?'disabled':''}>結束回合</button>`:''}`;
  app.innerHTML=`<div class="table ${handOpen?'hand-open':''} ${hudOpen?'hud-open':''}" data-hand-profile="${handProfile()}"><header class="hud-top"><div class="tools-fab ${toolsOpen?'open':''}"><button type="button" id="tools-toggle" aria-expanded="${toolsOpen}" aria-controls="tools-panel" aria-label="遊戲工具">⚙</button><div class="tools-panel" id="tools-panel" ${toolsOpen?'':'hidden'}><div class="menu-controls"><button type="button" id="log-toggle" aria-expanded="${logOpen}" aria-controls="log-drawer">紀錄</button><button type="button" id="menu-toggle" aria-expanded="${menuOpen}" aria-controls="game-menu">選單</button></div><div class="zoom-controls"><button type="button" id="hud-more" aria-pressed="${hudOpen}" aria-label="展開詳細資訊">詳</button><button type="button" id="zoom-out" aria-label="縮小戰場">−</button><button type="button" id="zoom-in" aria-label="放大戰場">+</button><button type="button" id="zoom-reset" aria-label="恢復預設視角">◎</button><button type="button" id="focus-avatar" aria-label="回到自己的 Avatar">♜</button><button type="button" id="focus-center" aria-label="戰場中央">＋</button></div></div></div><div class="status-row"><div class="opponent-cluster"><div class="opponent-hand" aria-label="對手隱藏手牌 ${state.players[opponent].hand.length} 張">${backs}<b>${state.players[opponent].hand.length}</b></div>${playerBar(opponent)}</div><div class="phase-chip" aria-live="polite"><span class="turn-number">${String(state.turn).padStart(2,'0')}</span><strong>${esc(phase)}</strong><small>${esc(priorityLabel())}</small><div class="phase-track"><span class="${state.phase==='draw'?'on':''}">開始</span><span class="${state.phase==='main'?'on':''}">主要</span><span class="${state.phase==='mulligan'?'on':''}">開局</span></div></div></div></header><div class="stage-wrap"><div class="stage" id="stage"><div class="board-frame"><div class="board" aria-label="5 × 4 領域戰場">${Array.from({length:20},(_,i)=>{const site=state.board[i],c=site?card(site.card):null,pickHere=picks?.some(s=>(s?.kind==='cell'||s?.kind==='direction')&&s.at===i),mark=threats.has(i)?'legal threat':pickHere?'legal choice-pick':spots.has(i)?'legal':'';return `<div class="cell ${c?'has-site '+tone(c)+(site.controller===p?' own-site':site.controller===opponent?' enemy-site':' neutral-site'):''} ${mark}" data-at="${i}" ${mark?'tabindex="0" role="button"':''}><span class="coordinate">${String.fromCharCode(65+i%5)}${4-Math.floor(i/5)}</span>${c?`<button class="site-name" data-site="${i}">${esc(cardTitle(c))}</button>`:''}${state.units.filter(u=>occupied(u).includes(i)).map(unitHTML).join('')}${objectsHTML(i)}${!c&&!state.units.some(u=>u.at===i)?'<span class="void-label">VOID</span>':''}</div>`;}).join('')}</div></div></div><button type="button" class="edge edge-n" data-edge="n" hidden aria-label="上方有可操作的格子">▲</button><button type="button" class="edge edge-e" data-edge="e" hidden aria-label="右方有可操作的格子">▶</button><button type="button" class="edge edge-s" data-edge="s" hidden aria-label="下方有可操作的格子">▼</button><button type="button" class="edge edge-w" data-edge="w" hidden aria-label="左方有可操作的格子">◀</button><div class="minimap" id="minimap" aria-label="戰場縮圖"></div></div><footer class="hud-bottom"><div class="you-row">${playerBar(p)}</div><div class="hand-dock"><div class="hand-label"><span>${esc(me.name)} · 手牌 ${me.hand.length}</span><span class="hand-hint">滑動瀏覽 · 點擊選取並放大 · 向上拖曳出牌</span><button type="button" id="toggle-hand" aria-pressed="${handOpen}">${handOpen?'收起手牌':'展開手牌'}</button></div><div class="hand fan" data-count="${me.hand.length}">${handMarkup(p)}</div><div class="action-dock"><div class="context">${contextHTML(p)}</div><div class="choice-host"></div><div class="dock-actions">${actionsHTML}</div></div></div></footer><aside id="log-drawer" class="log-drawer" ${logOpen?'':'hidden'}><div class="panel-title"><span>對戰紀錄</span><span>${state.log.length}</span></div><div class="log" aria-live="polite">${state.log.slice(-40).reverse().map(e=>`<div class="log-entry"><small>${String(e.turn).padStart(2,'0')}</small>${esc(e.text)}</div>`).join('')||'<p class="muted">尚無紀錄</p>'}</div></aside><div id="game-menu" class="game-menu" ${menuOpen?'':'hidden'}><div class="panel-title"><span>對局選單</span><button type="button" id="close-menu">關閉</button></div><div class="secondary-actions"><button id="new-match" type="button">新對局</button><button id="goto-decks" type="button">我的牌組</button><button id="goto-library" type="button">卡牌圖書館</button><button id="lang-toggle" type="button">${getLang()==='zh'?'卡面：中文 → 英文':'卡面：英文 → 中文'}</button><button id="export-match" type="button">匯出重播</button><button id="graveyard" type="button">墓地</button><button id="concede" type="button">投降</button><button type="button" id="open-help">操作說明</button><button type="button" id="open-dev">開發狀態</button></div><p class="dev-note">${esc(dev)}<br>Seed ${state.seed} · ${state.mode==='ai'?'對 AI':'本機雙人'}</p></div><div class="turn-banner" aria-hidden="true"></div>${state.winner!==null?`<div class="victory" role="dialog" aria-label="對局結果"><p class="eyebrow">領域已定</p><h2>${esc(state.players[state.winner].name)} 取得領域</h2><p>${esc(state.log.at(-1)?.text||'')}</p><button class="action-button primary" id="again" type="button">再戰一局</button></div>`:''}</div>`;
  $('#cancel')?.addEventListener('click',()=>{selected=null;render();});
  if(state.choice&&human()&&!boardChoice()){const b=document.createElement('button');b.className='action-button';b.type='button';b.textContent='繼續效果選擇';b.onclick=effectDialog;document.querySelector('.context').after(b);}
  $('#end')?.addEventListener('click',()=>perform({type:'end',player:acting()}));
  $('#pass')?.addEventListener('click',()=>perform({type:'pass',player:acting()}));
  $('#mulligan')?.addEventListener('click',mulliganDialog);
  document.querySelectorAll('[data-draw]').forEach(b=>b.onclick=()=>perform({type:'draw',player:acting(),deck:b.dataset.draw}));
  $('#new-match').onclick=setup;$('#again')?.addEventListener('click',setup);$('#close-menu').onclick=()=>{menuOpen=false;render();};
  $('#lang-toggle')?.addEventListener('click',()=>{setLang(getLang()==='zh'?'en':'zh');store.set('sorcery.cardLang',getLang());menuOpen=false;render();});
  $('#goto-decks').onclick=()=>{menuOpen=false;toolsOpen=false;view='decks';selected=null;render();};
  $('#goto-library').onclick=()=>{menuOpen=false;toolsOpen=false;view='library';selected=null;render();};
  $('#export-match').onclick=()=>download('sorcery-replay.json',{seed:state.seed,history:state.history,state});
  $('#graveyard').onclick=graveyardDialog;
  $('#bound-spells').onclick=boundSpellsDialog;if($('#top-spell'))$('#top-spell').onclick=topSpellDialog;if($('#revealed-hand'))$('#revealed-hand').onclick=()=>show('<div class="eyebrow">公開</div><h2>對手手牌</h2><div class="library-grid">'+state.players[opponent].hand.map(h=>cardHTML(card(h.card),'',true)).join('')+'</div>','realm-sheet');
  $('#concede').onclick=()=>{if(actions().some(a=>a.type==='concede'))show('<div class="eyebrow">投降</div><h2>結束這場對局？</h2><p class="muted effect-rules">投降後會記錄對手獲勝。</p><div class="modal-actions"><button id="confirm-concede" class="confirm-yes">確認投降</button></div>','effect-confirm');$('#confirm-concede')?.addEventListener('click',()=>{close();perform({type:'concede',player:acting()});});};
  $('#tools-toggle').onclick=e=>{e.stopPropagation();toolsOpen=!toolsOpen;render();};$('#log-toggle').onclick=()=>{logOpen=!logOpen;if(logOpen)menuOpen=false;render();};
  $('#menu-toggle').onclick=()=>{menuOpen=!menuOpen;if(menuOpen)logOpen=false;render();};
  $('#toggle-hand').onclick=()=>{handOpen=!handOpen;render();};
  $('#open-help').onclick=()=>{menuOpen=false;show(helpHTML());};
  $('#open-dev').onclick=()=>{menuOpen=false;show(`<div class="eyebrow">ENGINE STATUS</div><h2>開發狀態</h2><p class="notice">${esc(dev)} 這項資訊只在選單中，不佔用戰場。</p>`);};
  $('#hud-more').onclick=()=>{hudOpen=!hudOpen;render();};
  $('#zoom-in').onclick=()=>setZoom(Math.round((boardZoom+.12)*100)/100);
  $('#zoom-out').onclick=()=>setZoom(Math.round((boardZoom-.12)*100)/100);
  $('#zoom-reset').onclick=()=>{boardZoom=1;viewScroll.init=false;layoutBoard();};
  $('#focus-avatar').onclick=()=>focusBoard('avatar');
  $('#focus-center').onclick=()=>focusBoard('center');
  document.querySelectorAll('.edge').forEach(b=>b.onclick=()=>jumpEdge(b.dataset.edge));
  bindCards();bindBattle();bindStage();document.querySelectorAll('[data-object]').forEach(b=>b.onclick=e=>{e.stopPropagation();objectDialog(b.dataset.object);});
  noteBattle(phase);layoutBoard();watchHand();syncPeek();playHandFlip();requestAnimationFrame(layoutBoard);
}
function select(kind,id){if(!human()){toast('等待對手完成操作。');return;}selected={kind,id};const a=selectedActions();if(!a.length){toast(reason(state,{player:acting(),[kind==='hand'?'hand':'unit']:id}));}render();}
function chooseAt(at,target){
  const candidates=selectedActions(),targeted=target&&candidates.some(a=>a.target===target||a.bearer===target||a.skeleton===target);
  const matches=candidates.filter(a=>targeted?a.target===target||a.bearer===target||a.skeleton===target:(a.at===at||a.target===at));
  if(!matches.length){toast('此處沒有合法動作。');return;}
  const unique=matches.filter((a,i,arr)=>arr.findIndex(b=>JSON.stringify({...b,path:null})===JSON.stringify({...a,path:null}))===i);
  if(unique.length===1)return perform(unique[0]);
  show(`<div class="eyebrow">行動</div><h2>選擇行動</h2><div class="modal-actions">${unique.map((a,i)=>`<button data-action="${i}">${esc(actionLabel(a))}</button>`).join('')}</div>`,'realm-list');
  document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>{close();perform(unique[+b.dataset.action]);});
}
function chooseCaster(list){const casters=list.filter((a,i)=>list.findIndex(b=>b.caster===a.caster&&b.casterLayer===a.casterLayer)===i);if(casters.length===1)return perform(casters[0]);show(`<div class="eyebrow">施法</div><h2>選擇施法者</h2><div class="modal-actions">${casters.map((a,i)=>`<button data-cast-source="${i}">${esc(actionLabel(a))}</button>`).join('')}</div>`,'realm-list');document.querySelectorAll('[data-cast-source]').forEach(b=>b.onclick=()=>{close();perform(casters[+b.dataset.castSource]);});}
function handClick(id){if(selected?.kind==='hand'&&selected.id===id){selected=null;hidePeek();render();return;}select('hand',id);const el=document.querySelector(`[data-hand="${CSS.escape(id)}"]`);if(el)centerHandCard(el);const found=state.players[acting()]?.hand.find(h=>h.uid===id);if(!found)return;const c=card(found.card),a=selectedActions();
  if(c.type==='Magic'&&a.length){const targets=a.filter((v,i,ar)=>ar.findIndex(b=>JSON.stringify(b.target)===JSON.stringify(v.target))===i);
    if(targets.length===1&&targets[0].target===null)return chooseCaster(a.filter(a=>a.target===null));
    if(['rescue','searchOrdinary','teleport'].includes(c.handler)){
      show(`<div class="eyebrow">目標</div><h2>${esc(cardTitle(c))}</h2><p class="effect-rules">選擇目標</p><div class="modal-actions">${targets.map((v,i)=>`<button data-choice="${i}">${typeof v.target==='string'?esc(card(v.target).name):esc(card(unit(state,v.target.unit).card).name)+' → '+String.fromCharCode(65+v.target.at%5)+(4-Math.floor(v.target.at/5))}</button>`).join('')}</div>`,'realm-list');
      document.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{close();perform(targets[+b.dataset.choice]);});
    }
  }
}
function bindBattle(){
  document.querySelectorAll('[data-unit]').forEach(b=>b.onclick=e=>{
    e.stopPropagation();if(suppressClick||panMode){suppressClick=false;return;}
    if(tryBoardChoice({uid:b.dataset.unit,at:unit(state,b.dataset.unit)?.at}))return;
    if(boardChoice())return;
    const u=unit(state,b.dataset.unit);
    if(selected&&selectedActions().some(a=>a.target===u.uid||a.bearer===u.uid||a.skeleton===u.uid))return chooseAt(u.at,u.uid);
    if(u.controller!==acting())return inspect(u.card,u);
    if(state.pending){const a=actions().filter(a=>a.type==='defend'&&a.unit===u.uid);if(a.length===1)return perform(a[0]);if(a.length){show(`<div class="eyebrow">防禦</div><h2>加入防禦</h2><p class="muted effect-rules">${esc(strikeCaption())}。這隻單位可以加入。留下原本被打的單位，或改由這隻單獨擋住。</p><div class="modal-actions"><button id="keep" class="confirm-yes">留下原本的單位</button><button id="replace" class="confirm-skip">換成這隻</button></div>`,'effect-confirm');$('#keep').onclick=()=>{close();perform(a.find(a=>a.keep));};$('#replace').onclick=()=>{close();perform(a.find(a=>!a.keep));};return;}toast('這個單位目前無法防禦。');return;}
    select('unit',u.uid);
    const extra=selectedActions().filter(a=>['ranged','pickup','drop','fiftyRam','salmonRoll','hireSellsword','freeUnit','homecomingMana','ability','activate','pushBoulder'].includes(a.type));
    if(extra.length){mountChoice(`<h2>${esc(card(u.card).name)}</h2><div class="modal-actions">${extra.map((a,i)=>`<button data-unit-action="${i}">${esc(actionLabel(a))}</button>`).join('')}<button id="unit-move">移動 / 攻擊</button></div>`);document.querySelectorAll('[data-unit-action]').forEach(btn=>btn.onclick=()=>{const a=extra[+btn.dataset.unitAction];dismissChoice();if(a.type==='pickup'||a.type==='drop')itemAction(a);else perform(a);});$('#unit-move').onclick=dismissChoice;return;}
    if(card(u.card).type==='Avatar'&&ready(state,u)){mountChoice(`<h2>${esc(card(u.card).name)}</h2><p>點選高亮位置可移動或攻擊，也可橫置抽牌。</p><div class="modal-actions"><button id="draw-site">抽取地點</button><button id="draw-spell">抽取法術</button><button id="move-avatar">移動 / 攻擊</button></div>`);$('#draw-site').onclick=()=>{dismissChoice();perform({type:'ability',player:acting(),unit:u.uid,mode:'atlas'});};$('#draw-spell').onclick=()=>{dismissChoice();perform({type:'ability',player:acting(),unit:u.uid,mode:'spells'});};$('#move-avatar').onclick=dismissChoice;}
  });
  document.querySelectorAll('.fan [data-hand]').forEach(b=>{
    b.onclick=e=>{e.stopPropagation();if(suppressClick){suppressClick=false;return;}handClick(b.dataset.hand);};
    if(matchMedia('(hover: hover) and (pointer: fine)').matches){
      b.addEventListener('pointerenter',()=>{
        if(pointer)return;
        showPeek(b.dataset.card);
        const siblings=[...b.parentElement.querySelectorAll('.card')];
        const idx=siblings.indexOf(b);
        siblings.forEach((c,j)=>{
          const d=j-idx;
          c.style.setProperty('--fan-spread',!d?'0px':(d>0?Math.min(14,6+d*2): -Math.min(14,6-d*2))+'px');
          if(d)c.style.zIndex=String(8+Math.abs(d));
        });
        b.style.zIndex='40';
      });
      b.addEventListener('pointerleave',()=>{
        const siblings=[...b.parentElement.querySelectorAll('.card')];
        siblings.forEach((c,j)=>{c.style.setProperty('--fan-spread','0px');c.style.zIndex=c.style.getPropertyValue('--fan-z')||String(10+j);});
        if(selected?.kind==='hand'&&selected.id===b.dataset.hand)return;
        if(!pointer)syncPeek();
      });
    }
  });
  document.querySelectorAll('[data-at]').forEach(b=>{
    b.onclick=()=>{if(suppressClick){suppressClick=false;return;}if(panMode)return;if(tryBoardChoice({at:+b.dataset.at}))return;if(boardChoice())return;if(selected)chooseAt(+b.dataset.at);};
    if(matchMedia('(hover:hover)').matches)b.addEventListener('pointerenter',()=>{if(!selected||pointer)return;clearPreview();const at=+b.dataset.at;const path=selectedActions().find(a=>(a.at===at||a.target===at)&&a.path)?.path||[];for(const i of path)document.querySelector(`[data-at="${i}"]`)?.classList.add('path');});
  });
  document.querySelectorAll('[data-site]').forEach(b=>b.onclick=e=>{e.stopPropagation();if(suppressClick||panMode){suppressClick=false;return;}if(tryBoardChoice({at:+b.dataset.site}))return;if(boardChoice())return;if(selected)chooseAt(+b.dataset.site);else siteDialog(+b.dataset.site);});
}
function bindStage(){
  const stage=document.querySelector('.stage');if(!stage)return;
  const fingers=new Map();let pinch=null,lastTap=0;
  stage.addEventListener('pointerdown',e=>{if(e.target.closest('button,[data-hand]')&&fingers.size===0)return;fingers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(fingers.size===1)pinch={x:e.clientX,y:e.clientY,moved:false,dist:0,zoom:boardZoom};if(fingers.size===2){const [a,b]=[...fingers.values()];pinch={dist:Math.hypot(a.x-b.x,a.y-b.y)||1,zoom:boardZoom,moved:false,mx:(a.x+b.x)/2,my:(a.y+b.y)/2};}});
  stage.addEventListener('pointermove',e=>{if(!fingers.has(e.pointerId)||!pinch)return;const prev=fingers.get(e.pointerId);fingers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(fingers.size>=2&&pinch.dist){const [a,b]=[...fingers.values()];const dist=Math.hypot(a.x-b.x,a.y-b.y)||1,mx=(a.x+b.x)/2,my=(a.y+b.y)/2;const next=pinch.zoom*(dist/pinch.dist);if(Math.abs(next-boardZoom)>.02)setZoom(next);if(pinch.mx!=null){stage.scrollLeft-=mx-pinch.mx;stage.scrollTop-=my-pinch.my;viewScroll.l=stage.scrollLeft;viewScroll.t=stage.scrollTop;}pinch.mx=mx;pinch.my=my;pinch.moved=true;return;}if(stage.classList.contains('can-pan')||panMode){if(Math.hypot(e.clientX-pinch.x,e.clientY-pinch.y)>8)pinch.moved=true;stage.scrollLeft-=e.clientX-prev.x;stage.scrollTop-=e.clientY-prev.y;viewScroll.l=stage.scrollLeft;viewScroll.t=stage.scrollTop;}});
  const end=e=>{fingers.delete(e.pointerId);if(fingers.size<2&&pinch)pinch.dist=0;if(!fingers.size){if(pinch?.moved){suppressClick=true;setTimeout(()=>{suppressClick=false;},350);}else if(pinch&&!e.target.closest('button,[data-at],[data-unit],[data-hand]')){if(selected){selected=null;hidePeek();render();}else{const now=performance.now();if(now-lastTap<320)focusBoard('avatar');lastTap=now;}}pinch=null;updateMinimap();}};
  stage.addEventListener('pointerup',end);stage.addEventListener('pointercancel',end);
  stage.addEventListener('scroll',()=>{viewScroll.l=stage.scrollLeft;viewScroll.t=stage.scrollTop;updateMinimap();},{passive:true});
  stage.addEventListener('wheel',e=>{if(!e.ctrlKey&&!e.metaKey)return;e.preventDefault();setZoom(boardZoom+(e.deltaY<0?.08:-.08));},{passive:false});
}
function bindCards(){
  document.querySelectorAll('[data-card]').forEach(b=>{b.oncontextmenu=e=>{e.preventDefault();inspect(b.dataset.card,b.dataset.unit?unit(state,b.dataset.unit):null);};});
}
app.addEventListener('pointerdown',e=>{
  const b=e.target.closest('[data-hand],[data-unit]');if(!b||e.button!==0||view!=='play'||panMode)return;
  pointer={x:e.clientX,y:e.clientY,b,id:e.pointerId,moved:false,long:false};
  longTimer=setTimeout(()=>{if(pointer&&!pointer.moved&&!pointer.scrolling){pointer.long=true;suppressClick=true;inspect(b.dataset.card,b.dataset.unit?unit(state,b.dataset.unit):null);}},550);
});
document.addEventListener('pointermove',e=>{
  if(!pointer||e.pointerId!==pointer.id)return;
  const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;
  const fan=pointer.b.closest('.fan');
  const scrolling=!!fan&&fan.dataset.layout!=='fan';
  if(pointer.scrolling){const fan=pointer.b.closest('.fan');if(fan)fan.scrollLeft-=e.clientX-(pointer.lastX??pointer.x);pointer.lastX=e.clientX;return;}
  if(!pointer.moved&&!pointer.long&&scrolling&&Math.abs(dx)>10&&Math.abs(dx)>Math.abs(dy)+6){pointer.scrolling=true;pointer.lastX=e.clientX;clearTimeout(longTimer);return;}
  if(Math.hypot(dx,dy)>8&&!pointer.long){clearTimeout(longTimer);if(!pointer.moved){pointer.moved=true;hidePeek();selected={kind:pointer.b.dataset.hand?'hand':'unit',id:pointer.b.dataset.hand||pointer.b.dataset.unit};if(!human()){pointer=null;document.body.classList.remove('is-dragging');return;}document.body.classList.add('is-dragging');render();$('#drag-ghost').innerHTML=cardHTML(card(pointer.b.dataset.card));$('#drag-ghost').style.display='block';kickEdge();}lastPtr={x:e.clientX,y:e.clientY};$('#drag-ghost').style.left=e.clientX+'px';$('#drag-ghost').style.top=e.clientY+'px';showPreview(e.clientX,e.clientY);e.preventDefault();}
},{passive:false});
document.addEventListener('pointerup',e=>{if(!pointer)return;clearTimeout(longTimer);cancelAnimationFrame(edgeTimer);edgeTimer=0;const drag=pointer;pointer=null;document.body.classList.remove('is-dragging');clearPreview();$('#drag-ghost').style.display='none';if(drag.scrolling){suppressClick=true;setTimeout(()=>{suppressClick=false;},280);return;}if(drag.moved){const b=document.elementFromPoint(e.clientX,e.clientY),u=b?.closest('[data-unit]'),cell=b?.closest('[data-at]');if(cell){if(!tryBoardChoice({uid:u?.dataset.unit,at:+cell.dataset.at})&&!boardChoice())chooseAt(+cell.dataset.at,u?.dataset.unit);}else if(!boardChoice()){selected=null;render();}e.preventDefault();}else if(drag.long)e.preventDefault();});
document.addEventListener('pointercancel',()=>{clearTimeout(longTimer);cancelAnimationFrame(edgeTimer);edgeTimer=0;pointer=null;document.body.classList.remove('is-dragging');clearPreview();$('#drag-ghost').style.display='none';selected=null;});
function kickEdge(){if(edgeTimer)return;const step=()=>{if(!pointer?.moved){edgeTimer=0;return;}const stage=document.querySelector('.stage');if(!stage){edgeTimer=0;return;}const r=stage.getBoundingClientRect(),m=64,speed=18;if(lastPtr.x<r.left+m)stage.scrollLeft-=speed;else if(lastPtr.x>r.right-m)stage.scrollLeft+=speed;if(lastPtr.y<r.top+m&&lastPtr.y>r.top)stage.scrollTop-=speed;else if(lastPtr.y>r.bottom-m&&lastPtr.y<r.bottom+28)stage.scrollTop+=speed;viewScroll.l=stage.scrollLeft;viewScroll.t=stage.scrollTop;updateMinimap();edgeTimer=requestAnimationFrame(step);};edgeTimer=requestAnimationFrame(step);}
function mulliganDialog(){const p=acting(),chosen=new Set();show(`<div class="eyebrow">開局</div><h2>起始手牌 · ${state.players[p].name}</h2><p>各抽 3 張 Atlas 地點與 3 張 Spellbook 法術。${p===(state.firstPlayer??0)?'你是先手，第一回合不抽牌。':'你是後手，第一回合開始時選一個牌庫抽 1 張。'}</p><p class="muted">最多重抽 3 張。點選順序決定放到各自牌庫底的先後；取消再點可重新排序。</p><div class="mulligan-cards">${handMarkup(p,true)}</div><p id="redraw-order" aria-live="polite">未選取重抽卡牌</p><div class="modal-actions"><button class="primary" id="finish-mulligan">保留手牌，開始對局</button></div>`,'realm-sheet');document.querySelectorAll('[data-redraw]').forEach(b=>b.onclick=()=>{const id=b.dataset.redraw;if(chosen.has(id))chosen.delete(id);else if(chosen.size<3)chosen.add(id);else return;b.classList.toggle('selected',chosen.has(id));$('#redraw-order').textContent=[...chosen].map((uid,i)=>(i+1)+'. '+face(state.players[p].hand.find(h=>h.uid===uid).card)).join(' → ')||'未選取重抽卡牌';$('#finish-mulligan').textContent=chosen.size?`重抽 ${chosen.size} 張`:'保留手牌，開始對局';});$('#finish-mulligan').onclick=()=>{close();perform({type:'mulligan',player:p,cards:[...chosen]});};}
function preconPreview(d){
  const rows=(ids)=>{const counts=new Map();for(const id of ids)counts.set(id,(counts.get(id)||0)+1);return [...counts].map(([id,n])=>`<div class="deck-row"><span>${esc(card(id).name)}${card(id).playable?'':' · 尚未實作'}</span><b>${n}</b></div>`).join('');};
  const missing=[...new Set([d.avatar,...d.atlas,...d.spells])].filter(id=>!card(id).playable);
  show(`<h2>${esc(d.name)}</h2><p>官方原表：Avatar 1 · Spellbook 36 · Atlas 16</p><p>${missing.length?'尚缺 '+missing.length+' 種卡牌效果，補齊後開放對局。':'牌表內卡牌已可操作；完整規則驗證仍待完成。'}</p><p><a href="${esc(d.source)}" target="_blank" rel="noopener noreferrer">官方文章與原始牌表</a> · <a href="${esc(d.sourceImage)}" target="_blank" rel="noopener noreferrer">官方牌表圖片</a></p><h3>Avatar</h3>${rows([d.avatar])}<h3>Spellbook · 36</h3>${rows(d.spells)}<h3>Atlas · 16</h3>${rows(d.atlas)}<div class="modal-actions"><button id="precon-edit">載入牌組編輯器</button><button id="precon-back">返回新對局</button></div>`);
  $('#precon-edit').onclick=()=>{deck=structuredClone(d);view='decks';close();render();};$('#precon-back').onclick=setup;
}
function officialPreconMenu(){const decks=officialBetaDecks();show(`<h2>BETA 官方四元素預組</h2><p>依官方 2023 年原表逐張保留；缺少效果的原表尚未開放對局。</p><div class="modal-actions">${decks.map((d,i)=>`<button data-precon-preview="${i}">${esc(d.name)}</button>`).join('')}</div>`);document.querySelectorAll('[data-precon-preview]').forEach(b=>b.onclick=()=>preconPreview(decks[+b.dataset.preconPreview]));}
function presetSelectedValue(){
  const official=officialBetaDecks();
  const oi=official.findIndex(d=>d.name===deck.name&&d.officialId===deck.officialId);
  if(oi>=0)return `official:${oi}`;
  const beta=betaDecks();
  const bi=beta.findIndex(d=>d.name===deck.name);
  if(bi>=0)return `beta:${bi}`;
  if(deck.name===starter().name)return 'starter:earth';
  if(deck.name===starter('fire').name)return 'starter:fire';
  const si=saved.findIndex(d=>d.name===deck.name);
  if(si>=0)return `saved:${si}`;
  return '';
}
function presetButtons(){
  const sel=presetSelectedValue();
  const official=officialBetaDecks();
  return `<div class="deck-preset-bar"><label class="deck-preset-label">載入牌組<select id="preset-deck" aria-label="載入牌組"><option value="" ${!sel?'selected':''}>選擇牌組…</option><optgroup label="官方 BETA 預組">${official.map((d,i)=>`<option value="official:${i}" ${sel===`official:${i}`?'selected':''}>${esc(d.name)}</option>`).join('')}</optgroup><optgroup label="BETA 自組"><option value="beta:0" ${sel==='beta:0'?'selected':''}>BETA · 大地燼火（自組）</option><option value="beta:1" ${sel==='beta:1'?'selected':''}>BETA · 風暴軍勢（自組）</option></optgroup><optgroup label="預設"><option value="starter:earth" ${sel==='starter:earth'?'selected':''}>翡翠預設牌組</option><option value="starter:fire" ${sel==='starter:fire'?'selected':''}>燼火預設牌組</option></optgroup>${saved.length?`<optgroup label="已儲存">${saved.map((d,i)=>`<option value="saved:${i}" ${sel===`saved:${i}`?'selected':''}>${esc(d.name)}</option>`).join('')}</optgroup>`:''}</select></label><button type="button" id="import-deck">匯入牌組</button></div>`;
}
function importedDeck(d){const original=officialBetaDecks().find(p=>p.officialId===d.officialId);return {version:1,name:String(d.name||'匯入牌組'),avatar:d.avatar,atlas:[...d.atlas],spells:[...d.spells],...(d.collection?{collection:[...d.collection]}:{}),...(d.format==='beta-precon-2023'?{format:d.format,officialId:d.officialId,preset:d.preset||'official-beta',source:original?.source,sourceImage:original?.sourceImage}:{}),...(d.importSource?{importSource:d.importSource}:{})};}
function profileControls(){return deck.format==='beta-precon-2023'?'<p>官方原表採 36／16 張數。變更卡牌後須轉為 60／30 自組牌，才能通過一般構築檢查。</p><button id="convert-precon">轉為自組牌</button>':'';}
function setup(){
  const choices=[...betaDecks(),...officialBetaDecks(),starter(),starter('fire'),...saved];show(`<div class="eyebrow">A NEW CHAPTER</div><h2>開啟一場領域之爭</h2><div class="setup-options"><label>你的牌組<select id="setup-deck">${choices.map((d,i)=>`<option value="${i}" ${validateDeck(d).length?'disabled':''}>${esc(d.name)} · ${d.spells.length} / ${d.atlas.length}${validateDeck(d).length?' · 尚未開放':''}</option>`).join('')}</select></label><label>對手牌組<select id="setup-opponent">${choices.map((d,i)=>`<option value="${i}" ${i===1?'selected':String()} ${validateDeck(d).length?'disabled':''}>${esc(d.name)}${validateDeck(d).length?' · 尚未開放':''}</option>`).join('')}</select></label><label>遊戲模式<select id="setup-mode"><option value="ai">單人 vs AI</option><option value="local">本機雙人測試</option></select></label><label id="setup-ai-wrap">AI 難度<select id="setup-ai"><option value="easy">易</option><option value="medium" selected>中</option><option value="strong">強</option></select></label><label id="setup-omni-wrap" class="muted" style="font:12px/1.4 sans-serif"><input id="setup-omniscient" type="checkbox"> 全知搜尋（可偷看隱藏資訊；預設為公平）</label><label>隨機種子<input id="setup-seed" type="number" value="${Date.now()%1000000}" min="0" max="4294967295"></label></div><p class="notice" style="margin-top:20px">官方四元素預組已可選擇，保留 36 張法術／16 張地點原表。其餘 BETA 自組預設為 60／30；所有可操作卡牌仍屬部分支援。</p><div class="modal-actions"><button id="setup-goto-decks">編輯我的牌組</button><button id="official-beta-lists">查看官方四副完整牌表</button><button id="start" class="primary">進入領域 →</button></div>`);
  $('#setup-goto-decks').onclick=()=>{close();menuOpen=false;toolsOpen=false;view='decks';selected=null;render();};
  $('#official-beta-lists').onclick=officialPreconMenu;
  const syncAi=()=>{const on=$('#setup-mode').value==='ai';const wrap=$('#setup-ai-wrap'),omni=$('#setup-omni-wrap');if(wrap)wrap.style.display=on?'':'none';if(omni)omni.style.display=on?'':'none';};
  $('#setup-mode').onchange=syncAi;syncAi();
  const savedDiff=store.get('sorcery.aiDifficulty','medium');
  const aiSel=$('#setup-ai');
  if(aiSel&&AI_DIFFICULTIES.includes(savedDiff))aiSel.value=savedDiff;
  const omniBox=$('#setup-omniscient');
  if(omniBox)omniBox.checked=!!store.get('sorcery.aiOmniscient',false);
  $('#start').onclick=()=>{try{const chosen=choices[+$('#setup-deck').value];const mode=$('#setup-mode').value;const difficulty=AI_DIFFICULTIES.includes($('#setup-ai')?.value)?$('#setup-ai').value:'medium';state=newGame([chosen,choices[+$('#setup-opponent').value]],Number($('#setup-seed').value)>>>0,mode);if(mode==='ai'){state.aiDifficulty=difficulty;state.aiOmniscient=!!$('#setup-omniscient')?.checked;aiOmniscient=state.aiOmniscient;store.set('sorcery.aiDifficulty',difficulty);store.set('sorcery.aiOmniscient',state.aiOmniscient);}store.set('sorcery.match',state);selected=null;view='play';menuOpen=false;toolsOpen=false;boardZoom=1;viewScroll={l:0,t:0,init:false};close();resetMotion();render();if(human())mulliganDialog();scheduleAI();}catch(e){toast(e.message);}};
}
function filtered(){const q=(filter.q||'').toLowerCase();return cards.filter(c=>{const hay=(c.name+' '+c.rules+' '+cardTitle(c)+' '+cardRules(c)).toLowerCase();return(!q||hay.includes(q))&&(!filter.type||c.type===filter.type)&&(!filter.element||c.elements.includes(filter.element))&&(filter.cost===''||c.cost===Number(filter.cost))&&(!filter.supported||c.playable);});}
function filtersHTML(){return `<div class="filters"><input id="search" type="search" aria-label="搜尋卡牌" placeholder="搜尋卡名或規則文字…" value="${esc(filter.q)}"><select id="type" aria-label="卡牌類型"><option value="">全部類型</option>${['Avatar','Minion','Site','Magic','Aura','Artifact'].map(t=>`<option ${filter.type===t?'selected':''}>${t}</option>`).join('')}</select><select id="element" aria-label="元素"><option value="">全部元素</option>${['Earth','Fire','Water','Air','None'].map(t=>`<option ${filter.element===t?'selected':''}>${t}</option>`).join('')}</select><select id="cost" aria-label="費用"><option value="">全部費用</option>${Array.from({length:11},(_,i)=>`<option ${filter.cost===String(i)?'selected':''}>${i}</option>`).join('')}</select><label style="align-self:center;font:12px sans-serif"><input id="supported" type="checkbox" ${filter.supported?'checked':''}> 僅可操作</label></div>`;}
function deckCounts(){const counts=new Map();for(const id of [...deck.atlas,...deck.spells])counts.set(id,(counts.get(id)||0)+1);return counts;}
function deckSection(title,ids,counts){
  const order=[...new Set(ids)];
  if(!order.length)return `<section class="deck-section"><h3>${esc(title)}</h3><p class="deck-empty">尚未加入卡牌</p></section>`;
  return `<section class="deck-section"><h3>${esc(title)} · ${ids.length}</h3><div class="deck-list">${order.map(id=>{const c=card(id),n=counts.get(id)||0,label=cardTitle(c);return `<div class="deck-row ${tone(c)}"><span class="deck-art" aria-hidden="true"><span>${typeMark(c.type)}</span></span><span class="deck-row-meta"><strong title="${esc(c.name)}">${esc(label)}</strong><small>${esc(c.type)} · ${c.type==='Site'?'◇':(c.cost??'✧')} · ${esc(c.slot||'')}</small></span><div class="deck-qty"><button type="button" data-remove="${id}" aria-label="減少 ${esc(label)}">−</button><b>${n}</b><button type="button" data-add="${id}" aria-label="增加 ${esc(label)}">+</button></div></div>`;}).join('')}</div></section>`;
}
function collectionEditor(){return `<section class="deck-section"><h3>收藏區 · ${(deck.collection||[]).length}/10</h3><label>點選卡牌時加入 <select id="deck-add-zone"><option value="main" ${deckAddZone==='main'?'selected':''}>Atlas／Spellbook</option><option value="collection" ${deckAddZone==='collection'?'selected':''}>收藏區</option></select></label><p class="muted">收藏區獨立於牌庫，供指定效果取用。</p><div class="deck-list">${(deck.collection||[]).map((id,index)=>`<div class="deck-row"><span>${esc(cardTitle(card(id)))}</span><button data-remove-collection="${index}" aria-label="從收藏區移除 ${esc(cardTitle(card(id)))}">−</button></div>`).join('')}</div></section>`;}
function deckSwipeTabs(sizes){
  return `<div class="deck-swipe-tabs" role="tablist" aria-label="牌組編輯分頁"><button type="button" role="tab" data-deck-pane="cards" aria-selected="${deckPane==='cards'}" class="${deckPane==='cards'?'active':''}">所有牌</button><button type="button" role="tab" data-deck-pane="deck" aria-selected="${deckPane==='deck'}" class="${deckPane==='deck'?'active':''}">我的牌組 <small>Atlas ${deck.atlas.length}/${sizes.atlas} · Spell ${deck.spells.length}/${sizes.spells}</small></button></div><p class="deck-swipe-hint">左右滑動切換「所有牌」與「我的牌組」</p>`;
}
function bindDeckSwipe(){
  const layout=$('.deck-layout');
  if(!layout)return;
  const tabs=[...document.querySelectorAll('[data-deck-pane]')];
  const syncTabs=()=>tabs.forEach(b=>{const on=b.dataset.deckPane===deckPane;b.classList.toggle('active',on);b.setAttribute('aria-selected',on?'true':'false');});
  const jump=(pane,smooth=true)=>{
    deckPane=pane==='deck'?'deck':'cards';
    const el=layout.querySelector(`.deck-pane-${deckPane}`);
    if(!el)return;
    const left=el.offsetLeft;
    if(smooth&&typeof layout.scrollTo==='function')layout.scrollTo({left,behavior:'smooth'});
    else layout.scrollLeft=left;
    syncTabs();
  };
  tabs.forEach(b=>b.onclick=()=>jump(b.dataset.deckPane,true));
  // Restore pane after re-render (instant; avoid jump flash).
  requestAnimationFrame(()=>jump(deckPane,false));
  let timer=0;
  layout.addEventListener('scroll',()=>{
    clearTimeout(timer);
    timer=setTimeout(()=>{
      const mid=layout.scrollLeft+layout.clientWidth/2;
      const panes=[...layout.querySelectorAll('.deck-pane')];
      const hit=panes.find(p=>p.offsetLeft<=mid&&p.offsetLeft+p.offsetWidth>mid)||panes[0];
      const next=hit?.classList.contains('deck-pane-deck')?'deck':'cards';
      if(next!==deckPane){deckPane=next;syncTabs();}
    },60);
  },{passive:true});
}
function renderLibrary(edit=false){
  const list=filtered(),pages=Math.max(1,Math.ceil(list.length/30));filter.page=Math.min(filter.page,pages-1);const page=list.slice(filter.page*30,filter.page*30+30);
  const counts=edit?deckCounts():null;
  const sizes=edit?deckSizes(deck):null;
  const cardsBlock=`${filtersHTML()}<div class="catalogue">${page.map(c=>cardHTML(c,`data-library="${c.id}"`,false,counts?.get(c.id)||0)).join('')||'<p class="empty-state">找不到符合條件的卡牌。</p>'}</div><div class="pager"><button id="prev" ${filter.page===0?'disabled':''}>←</button><span>${filter.page+1} / ${pages}</span><button id="next" ${filter.page===pages-1?'disabled':''}>→</button></div>`;
  const body=edit
    ?`${presetButtons()}${deckSwipeTabs(sizes)}<div class="deck-layout" data-pane="${deckPane}"><div class="deck-pane deck-pane-cards">${cardsBlock}</div>${deckEditor(counts)}</div>`
    :`<div>${cardsBlock}</div>`;
  app.innerHTML=`<div class="intro"><div><div class="eyebrow">${edit?'YOUR SPELLBOOK':'THE CARD ARCHIVE'}</div><h1>${edit?'編織你的法術':'卡牌圖書館'}</h1><p>${edit?'點選卡牌加入牌組；手機可左右滑切換「所有牌」與「我的牌組」。卡圖暫以色塊代替。':'本機官方資料庫 · '+cards.length+' 筆卡牌 · 搜尋、探索與檢視完整規則。'}</p><p class="muted"><button type="button" id="lang-toggle-lib">${getLang()==='zh'?'卡面顯示：中文（切換英文）':'卡面顯示：英文（切換中文）'}</button></p></div><span class="badge">${list.length} CARDS</span></div>${body}`;
  $('#lang-toggle-lib')?.addEventListener('click',()=>{setLang(getLang()==='zh'?'en':'zh');store.set('sorcery.cardLang',getLang());render();});
  for(const id of ['type','element','cost','supported'])$('#'+id).onchange=e=>{filter[id]=id==='supported'?e.target.checked:e.target.value;filter.page=0;render();};
  $('#search').oninput=e=>{const pos=e.target.selectionStart;filter.q=e.target.value;filter.page=0;render();$('#search').focus();$('#search').setSelectionRange(pos,pos);};
  $('#prev').onclick=()=>{filter.page--;render();};$('#next').onclick=()=>{filter.page++;render();};
  document.querySelectorAll('[data-library]').forEach(b=>b.onclick=()=>edit?addCard(b.dataset.library):inspect(b.dataset.library));bindCards();
  if(edit){bindDeck();bindDeckSwipe();}
}
function deckEditor(counts=deckCounts()){const sizes=deckSizes(deck),av=card(deck.avatar),errors=validateDeck(deck);return `<aside class="panel deck-editor deck-pane deck-pane-deck"><div class="panel-title">DECK WORKSHOP</div><input id="deck-name" aria-label="牌組名稱" value="${esc(deck.name)}"><div class="deck-avatar ${tone(av)}"><span class="deck-art" aria-hidden="true"><span>${typeMark(av.type)}</span></span><div><small>Avatar</small><strong title="${esc(av.name)}">${esc(cardTitle(av))}</strong><p>點選「所有牌」中的 Avatar 可更換</p></div></div><div class="deck-summary"><span>Atlas ${deck.atlas.length}/${sizes.atlas}</span><span>Spellbook ${deck.spells.length}/${sizes.spells}</span></div><div class="${errors.length?'errors':'success'}">${errors.length?errors.map(esc).join('<br>'):'✓ 通過目前牌組檢查（完整規則驗證待完成）'}</div>${collectionEditor()}${profileControls()}${deckSection('Atlas · 地點',deck.atlas,counts)}${deckSection('Spellbook · 法術',deck.spells,counts)}<div class="modal-actions"><button id="save-deck" class="primary">儲存</button><button id="export-deck">匯出</button><button id="clear-deck">清空</button></div><p class="muted deck-saved-label">儲存的牌組</p><div class="saved-decks">${saved.map((d,i)=>`<button type="button" data-load="${i}">${esc(d.name)}</button>`).join('')||'<span class="muted">尚無儲存</span>'}</div></aside>`;}
function addCard(id){const c=card(id);if(deckAddZone==='collection'){if(c.category==='Token'||!c.playable){toast('Cannot add this card to the collection');return;}const list=deck.collection||(deck.collection=[]);if(list.length>=10||list.filter(x=>x===id).length>=(limits[c.slot]||0)){toast('Collection limit reached');return;}list.push(id);render();return;}if(c.type==='Avatar'){deck.avatar=id;render();return;}if(c.category==='Token'){toast('衍生物不能加入牌組。');return;}const list=c.type==='Site'?deck.atlas:deck.spells;if(list.filter(x=>x===id).length>=(limits[c.slot]||0)){toast('已達稀有度張數上限。');return;}list.push(id);render();}
function bindDeck(){
  $('#convert-precon')?.addEventListener('click',()=>{delete deck.format;delete deck.officialId;deck.preset='custom';deck.name=deck.name.replace('官方預組','衍生自組');render();});
  $('#preset-deck')?.addEventListener('change',e=>{
    const v=e.target.value;if(!v)return;
    const [kind,key]=v.split(':');
    if(kind==='official')deck=structuredClone(officialBetaDecks()[+key]);
    else if(kind==='beta')deck=structuredClone(betaDecks()[+key]);
    else if(kind==='starter')deck=starter(key);
    else if(kind==='saved')deck=structuredClone(saved[+key]);
    else return;
    render();
  });
  $('#deck-name').oninput=e=>deck.name=e.target.value;
  $('#deck-add-zone').onchange=e=>{deckAddZone=e.target.value;};
  document.querySelectorAll('[data-remove-collection]').forEach(b=>b.onclick=()=>{deck.collection.splice(+b.dataset.removeCollection,1);render();});
  document.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{const id=b.dataset.remove,list=card(id).type==='Site'?deck.atlas:deck.spells;list.splice(list.indexOf(id),1);render();});
  document.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>addCard(b.dataset.add));
  $('#save-deck').onclick=()=>{const i=saved.findIndex(d=>d.name===deck.name);if(i<0)saved.push(structuredClone(deck));else saved[i]=structuredClone(deck);store.set('sorcery.decks',saved);toast('牌組已儲存在此瀏覽器。');render();};
  $('#export-deck').onclick=()=>{show(`<h2>匯出牌組</h2><p>JSON 採官方 <code>decklist</code> 格式（Avatar／Main + slug），可與 sorcerytcg.com／Curiosa 互通。文字牌表亦可再匯入。</p><div class="modal-actions"><button id="export-json" class="primary">匯出官方 JSON</button><button id="export-text">複製文字牌表</button></div>`);
    $('#export-json').onclick=()=>{try{download((deck.name||'sorcery-deck').replace(/[\\/:*?"<>|]+/g,'_')+'.json',toOfficialDeckJson(deck));close();}catch(e){toast(e.message);}};
    $('#export-text').onclick=async()=>{const text=formatTextDecklist(deck);try{await navigator.clipboard.writeText(text);toast('已複製文字牌表');close();}catch{show(`<h2>文字牌表</h2><textarea rows="16" style="width:100%" readonly aria-label="文字牌表">${esc(text)}</textarea>`);}};
  };
  $('#clear-deck').onclick=()=>{deck={version:1,name:'新牌組',avatar:card('sorcerer').id,atlas:[],spells:[]};render();};
  document.querySelectorAll('[data-load]').forEach(b=>b.onclick=()=>{deck=structuredClone(saved[+b.dataset.load]);render();});
  $('#import-deck').onclick=()=>{show(`<h2>匯入牌組</h2><p>支援：</p><ul class="muted" style="font:12px/1.6 sans-serif;padding-left:1.2em"><li>官方 JSON（含 <code>decklist</code>）</li><li>官方／Curiosa 文字牌表</li><li>牌組網址（CORS 失敗時請改貼 JSON／文字）</li></ul><textarea id="import-text" rows="14" style="width:100%" aria-label="牌組內容" placeholder="貼上官方 JSON、文字牌表或網址…"></textarea><div class="modal-actions"><button id="do-import" class="primary">匯入</button></div>`);
    $('#do-import').onclick=async()=>{
      const btn=$('#do-import');btn.disabled=true;btn.textContent='匯入中…';
      try{
        const d=await importDeck($('#import-text').value);
        deck=importedDeck(d);
        close();render();
        toast(d.importWarnings?.length?`已匯入（警告：${d.importWarnings[0]}）`:`已匯入「${d.name}」· Spell ${d.spells.length} / Atlas ${d.atlas.length}`);
      }catch(e){toast('無法匯入：'+e.message);btn.disabled=false;btn.textContent='匯入';}
    };
  };
}
function download(name,data){const url=URL.createObjectURL(new Blob([typeof data==='string'?data:JSON.stringify(data,null,2)],{type:typeof data==='string'?'text/plain':'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function render(){document.body.classList.toggle('in-battle',view==='play');document.body.classList.toggle('in-archive',view!=='play');document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));if(view!=='play')hidePeek();if(view==='play')renderBattle();else renderLibrary(view==='decks');if(view==='play'&&state.choice&&human()&&!modal.open)effectDialog();}
window.addEventListener('resize',()=>requestAnimationFrame(layoutBoard));
try{
  await loadCards();
  try{await loadCardTranslations();}catch(e){console.warn(e);}
  setLang(store.get('sorcery.cardLang','zh')==='en'?'en':'zh');
  aiOmniscient=!!store.get('sorcery.aiOmniscient',false);
  saved=store.get('sorcery.decks',[]).filter(d=>Array.isArray(d.spells)&&Array.isArray(d.atlas)&&byId.has(d.avatar)&&[...d.spells,...d.atlas].every(id=>byId.has(id)));
  deck=starter();
  const old=store.get('sorcery.match',null);
  state=restoreGame(old?.version===1&&old.players?.length===2?old:newGame([starter(),starter('fire')]));
  if(state.aiOmniscient==null)state.aiOmniscient=aiOmniscient;
  render();scheduleAI();if(!old)setup();
}catch(e){app.innerHTML=`<div class="notice"><h2>無法啟動遊戲</h2><p>${esc(e.message)}</p><p>請在 VS Code 對 index.html 使用 Open with Live Server。遊戲需要以 HTTP 載入本機 ES Modules 與 JSON。</p></div>`;console.error(e);}










