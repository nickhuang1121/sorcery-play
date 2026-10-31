import {tutorialChapters,tutorialText} from './tutorial.js';
import {boardTargetLocations} from './ui-targets.js';
export function tutorialSelectors({session:t,state:s,selected}){
 if(!t||t.done)return [];
 const common=['#tutorial-bar button','#tutorial-bar summary','#tutorial-dialog-tools button','#tutorial-dialog-tools summary','#tutorial-dialog-tools select','#modal [data-tutorial]','#language-popup button','#language-popup .close','#close-modal','#popup-close','#close-card-info','#card-info-close','#cancel','.edge:not([hidden])'];
 const dialogs=['#card-info-use','#modal [data-action]','#modal [data-cast-source]','#modal [data-unit-action]','#unit-move','#move-avatar','#resume-choice'];
 if(t.chapter!==0)common.push(...dialogs);
 const hand=s.players[0].hand[0]?.uid;
 if(t.chapter===0)common.push(t.step===0?'[data-hand="lesson-hand"]':'[data-unit="lesson-avatar"]');
 if(t.chapter===1)common.push(t.step===0?'#modal [data-draw-option]':`[data-hand="${hand}"]`,'#draw-options');
 if(t.chapter===2||t.chapter===4&&t.step!==1)common.push('[data-hand="lesson-hand"]');
 if(t.chapter===3)common.push(`[data-unit="${t.step===0?'lesson-mover':'lesson-bear'}"]`);
 if(t.chapter===5){if(t.step===0)common.push('[data-unit="lesson-bear"]','#replace');if(t.step===1)common.push('#pass');if(t.step===2||t.step===4)common.push('#modal [data-draw-option]','#draw-options');if(t.step===3)common.push('#end');}
 return common;
}
export function createTutorialGuide({getContext,getActions,locale,onHint,onRestart,onExit,onCancel,onChapters,onLanguage,onBoardFocus=()=>{}}){
 const root=document.createElement('div');root.id='tutorial-guide';root.dataset.i18nPreserve='';root.hidden=true;
 root.innerHTML='<svg class="tutorial-shade" aria-hidden="true"><defs><mask id="tutorial-holes"><rect width="100%" height="100%" fill="white"/><g></g></mask></defs><rect width="100%" height="100%" fill="#020505" fill-opacity=".76" mask="url(#tutorial-holes)"/></svg><div class="tutorial-rings" aria-hidden="true"></div><section id="tutorial-bar" aria-label="Tutorial"><div class="tutorial-progress"></div><strong></strong><p aria-live="polite"></p><div class="tutorial-controls"></div></section>';
 document.body.append(root);
 let raf=0,lastFocus='',lastHint=0,dragging=false,pressed=null,settlingUntil=0,selectorCache=null;
 const text=(zh,en)=>locale()==='en'?en:zh;
 const context=()=>getContext();
 const strict=()=>{const t=context()?.session;return t&&!t.done&&t.chapter!==6;};
 function selectors(){
  const c=context();if(!c?.session)return [];
  if(selectorCache?.session===c.session&&selectorCache.state===c.state&&selectorCache.selected===c.selected)return selectorCache.list;
  const list=tutorialSelectors(c);
  if(c.selected&&!(c.session.chapter===4&&c.session.step===1)){
   const chosen=getActions().filter(a=>c.selected.kind==='hand'?a.hand===c.selected.id:a.unit===c.selected.id);
   for(const at of boardTargetLocations(chosen,c.state.units))list.push(`.board [data-at="${at}"]`);
  }
  selectorCache={session:c.session,state:c.state,selected:c.selected,list};return list;
 }
 function allowed(target){
  if(!strict())return true;
  if(!(target instanceof Element))return false;
  // A dialog's backdrop remains dismissible through the standard popup handler.
  if(target.matches('dialog[open]'))return true;
  return selectors().some(s=>target.closest(s));
 }
 function block(e){e.preventDefault();e.stopImmediatePropagation();if(performance.now()-lastHint>1800){lastHint=performance.now();root.querySelector('#tutorial-bar').classList.remove('tutorial-nudge');requestAnimationFrame(()=>root.querySelector('#tutorial-bar').classList.add('tutorial-nudge'));}}
 function input(e){
  if(!context()?.session)return;
  if(e.type==='pointerup'){dragging=false;pressed=null;return;}
  if(e.type==='pointercancel'){dragging=false;pressed=null;return;}
  if(e.type==='pointermove'){if(pressed&&Math.hypot(e.clientX-pressed.x,e.clientY-pressed.y)>8)dragging=true;return;}
  if(!strict())return;
  if(e.type==='keydown'){
   if(e.key==='Escape'){if(context().session.chapter===4&&context().session.step===1){e.preventDefault();e.stopImmediatePropagation();onCancel();}return;}
   if(e.key==='Tab'){
    const dialog=[...document.querySelectorAll('dialog[open]')].at(-1);
    const scope=dialog||document;
    const nodes=[...scope.querySelectorAll('button:not([disabled]),summary,select,[tabindex="0"]')].filter(n=>n.getClientRects().length&&!n.hidden&&allowed(n));
    if(nodes.length){e.preventDefault();e.stopImmediatePropagation();const i=nodes.indexOf(document.activeElement);nodes[(i+(e.shiftKey?-1:1)+nodes.length)%nodes.length].focus();}else block(e);
    return;
   }
   if(['Enter',' ','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)&&!allowed(e.target))block(e);
   return;
  }
  if(e.type==='click'&&dragging)return;
  if(!allowed(e.target)){block(e);return;}
  if(e.type==='pointerdown'&&e.target.closest('[data-hand],[data-unit]'))pressed={x:e.clientX,y:e.clientY};
 }
 for(const type of ['pointerdown','click','contextmenu','keydown','pointermove','pointerup','pointercancel'])document.addEventListener(type,input,true);
 function controls(container){
  const options=[['hint',context()?.session.done?text('查看成果','View completion'):text('提示','Hint'),onHint],['restart',text('重來','Restart'),onRestart],['chapters',text('章節','Chapters'),onChapters],['language',text('語言','Language'),onLanguage],['exit',text('退出教學','Exit tutorial'),onExit]];
  const inCard=!!container.closest('#card-info');
  const signature=(inCard?'card:':'bar:')+options.map(([id,label])=>id+':'+label).join('|');
  if(container.dataset.controlsSignature===signature)return;
  container.dataset.controlsSignature=signature;container.replaceChildren();
  const more=document.createElement('details');more.className='tutorial-more';
  const summary=document.createElement('summary');summary.textContent='⋯';summary.setAttribute('aria-label',text('教學選單','Tutorial menu'));more.append(summary);
  const menu=document.createElement('div');menu.className='tutorial-menu-items';more.append(menu);
  for(const [id,label,fn] of options){const b=document.createElement('button');b.type='button';b.dataset.tutorialControl=id;b.textContent=label;b.onclick=()=>{more.open=false;fn();};if(id==='hint'&&!inCard){b.className='tutorial-hint';container.append(b);}else menu.append(b);}
  container.append(more);
 }
 function update(){
  raf=0;const c=context(),t=c?.session;
  root.hidden=!t;document.body.classList.toggle('in-tutorial',!!t);
  if(!t){document.querySelectorAll('#tutorial-dialog-tools').forEach(n=>n.remove());document.querySelectorAll('[data-tutorial-blocked]').forEach(n=>n.removeAttribute('data-tutorial-blocked'));document.body.style.removeProperty('--tutorial-top');return;}
  const chapter=tutorialChapters[t.chapter],bar=root.querySelector('#tutorial-bar');bar.setAttribute('aria-label',text('新手教學','Tutorial'));
  bar.querySelector('.tutorial-progress').textContent=text('新手教學','Tutorial')+` · ${t.chapter+1} / ${tutorialChapters.length}`;
  bar.querySelector('strong').textContent=tutorialText(chapter.title,locale());
  let message=t.done?text('目標已達成，可查看成果或選擇下一章。','Objectives complete. View your results or choose another chapter.'):tutorialText(chapter.steps[Math.min(t.step,chapter.steps.length-1)],locale());
  if(t.chapter===6&&!t.done)message+=` (${['summon','move','attack'].filter(k=>t.flags[k]).length}/3)`;
  bar.querySelector('p').textContent=message;bar.dataset.chapter=String(t.chapter);bar.dataset.step=String(t.step);controls(bar.querySelector('.tutorial-controls'));
  const top=bar.getBoundingClientRect().height+12;
  if(document.body.style.getPropertyValue('--tutorial-top')!==top+'px')document.body.style.setProperty('--tutorial-top',top+'px');
  const dialog=[...document.querySelectorAll('dialog[open]')].at(-1);
  root.classList.toggle('with-dialog',!!dialog);root.querySelector('.tutorial-shade').style.display=strict()&&!dialog?'':'none';
  document.querySelectorAll('#tutorial-dialog-tools').forEach(n=>{if(n.parentElement!==dialog)n.remove();});
  if(dialog){let tools=dialog.querySelector('#tutorial-dialog-tools');if(!tools){tools=document.createElement('div');tools.id='tutorial-dialog-tools';tools.dataset.i18nPreserve='';tools.append(document.createElement('p'),document.createElement('div'));dialog.append(tools);}const p=tools.querySelector('p');if(p.textContent!==message)p.textContent=message;controls(tools.querySelector('div'));}
  if(dialog)for(const button of dialog.querySelectorAll('button')){const blocked=strict()&&!allowed(button);if(blocked)button.setAttribute('data-tutorial-blocked','');else button.removeAttribute('data-tutorial-blocked');}
  const nodes=strict()&&!dialog?selectors().filter(s=>!s.includes('tutorial-')).flatMap(s=>[...document.querySelectorAll(s)]):[];
  const rects=[...new Set(nodes)].map(n=>{const r=n.getBoundingClientRect(),clip=n.closest('.stage')?.getBoundingClientRect();if(!clip)return r;const x=Math.max(r.left,clip.left),y=Math.max(r.top,clip.top),right=Math.min(r.right,clip.right),bottom=Math.min(r.bottom,clip.bottom);return {x,y,left:x,top:y,right,bottom,width:Math.max(0,right-x),height:Math.max(0,bottom-y)};}).filter(r=>r.width&&r.height&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth);
  const holes=root.querySelector('mask g'),rings=root.querySelector('.tutorial-rings');holes.replaceChildren();rings.replaceChildren();
  for(const r of rects){const x=Math.max(0,r.x-4),y=Math.max(0,r.y-4),w=Math.min(innerWidth-x,r.width+8),h=Math.min(innerHeight-y,r.height+8);const hole=document.createElementNS('http://www.w3.org/2000/svg','rect');for(const [k,v]of Object.entries({x,y,width:w,height:h,rx:8,fill:'black'}))hole.setAttribute(k,v);holes.append(hole);const ring=document.createElement('div');Object.assign(ring.style,{left:x+'px',top:y+'px',width:w+'px',height:h+'px'});rings.append(ring);}
  const primary=c.selected&&!c.dragging?nodes.find(n=>n.matches('.cell.legal'))||nodes.find(n=>n.matches('.fan [data-hand],.board [data-unit]')):nodes.find(n=>n.matches('.fan [data-hand],.board [data-unit],#end,#pass'));
  const key=`${t.chapter}:${t.step}:${c.selected?.id||''}`;
  if(primary&&key!==lastFocus&&!c.dragging){lastFocus=key;const r=primary.getBoundingClientRect();const clip=primary.closest('.stage')?.getBoundingClientRect();if(r.left<(clip?.left??0)||r.right>(clip?.right??innerWidth)||r.top<(clip?.top??70)||r.bottom>(clip?.bottom??innerHeight)){primary.scrollIntoView({block:'nearest',inline:'center',behavior:'instant'});onBoardFocus();}}
  if(performance.now()<settlingUntil)raf=requestAnimationFrame(update);
 }
 function refresh(){settlingUntil=performance.now()+320;if(!raf)raf=requestAnimationFrame(update);}
 const observer=new MutationObserver(records=>{if(records.some(r=>!root.contains(r.target)&&!r.target.closest?.('#tutorial-dialog-tools')))refresh();});
 observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['open','class','style','hidden']});
 const resize=()=>{lastFocus='';refresh();};window.addEventListener('resize',resize);document.addEventListener('scroll',refresh,true);
 return {refresh,hide(){root.hidden=true;},destroy(){observer.disconnect();cancelAnimationFrame(raf);root.remove();for(const type of ['pointerdown','click','contextmenu','keydown','pointermove','pointerup','pointercancel'])document.removeEventListener(type,input,true);window.removeEventListener('resize',resize);document.removeEventListener('scroll',refresh,true);}};
}
