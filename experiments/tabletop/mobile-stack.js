import {connectPopup} from '../../src/popup.js';
import {stackViewEnabled,setStackFront,getStackFront,arrangeMobileRealmPiles} from './mobile-stack-layout.js?v=20261031-glass-popups';
export function targetDisposition(plan){if(!plan)return 'browse';if(plan.positional)return 'position';return plan.keys.length===1?'single':plan.keys.length>1?'multiple':'invalid';}
export function createForestStack(bridge){
 const dialog=document.createElement('dialog');dialog.id='forest-stack';dialog.className='popup forest-stack-dialog';dialog.dataset.i18nPreserve='';dialog.innerHTML='<button type="button" class="close fs-close">×</button><header class="fs-head"><small></small><h2 id="forest-stack-title"></h2></header><nav class="fs-tabs"></nav><div class="fs-track" role="list"></div><div class="fs-navigation"><button class="fs-prev" type="button">‹</button><span class="fs-counter"></span><button class="fs-next" type="button">›</button></div><footer class="fs-footer"><p class="fs-status"></p><div class="fs-actions"></div></footer>';document.body.append(dialog);
 const q=s=>dialog.querySelector(s),popup=connectPopup(dialog,{closeButton:q('.fs-close')}),track=q('.fs-track');
 let at=0,layer='surface',entries=[],index=0,revision=null,selection=null,nativeDepth=0,raf=0,scrollFrame=0;
 const text=(zh,en)=>bridge.locale()==='en'?en:zh;
 const native=fn=>{nativeDepth++;try{return fn();}finally{nativeDepth--;}};
 function close(focus=true){popup.close({restoreFocus:focus});}
 function plan(){return bridge.targetPlan(at);}
 function current(){return entries[index];}
 function footer(){const e=current();q('.fs-counter').textContent=entries.length?`${index+1} / ${entries.length}`:'0 / 0';q('.fs-prev').disabled=index<=0;q('.fs-next').disabled=index>=entries.length-1;
  q('.fs-prev').ariaLabel=text('上一張牌','Previous card');q('.fs-next').ariaLabel=text('下一張牌','Next card');q('.fs-close').ariaLabel=text('關閉卡片選擇','Close card selection');
  q('.fs-status').textContent=e?.status||'';const actions=q('.fs-actions');actions.replaceChildren();if(!e)return;
  const p=plan(),targeting=!!p,eligible=p?.keys.includes(e.key);const buttons=targeting?[{label:text('選為目標','Select as target'),disabled:!eligible,run:()=>native(()=>{close(false);bridge.target(e,at);})}]:bridge.buttons(e,at).map(b=>({...b,run:()=>native(()=>{close(false);bridge.invoke(e,at,b.mode);})}));
  for(const b of buttons){const n=document.createElement('button');n.type='button';n.className='primary';n.textContent=b.label;n.disabled=!!b.disabled;n.onclick=()=>{if(bridge.revision()!==revision){close();bridge.stale();return;}b.run();};actions.append(n);}
  const details=document.createElement('button');details.type='button';details.className='fs-details';details.textContent=text('查看詳情','View details');details.onclick=()=>native(()=>bridge.inspect(e,at));actions.append(details);
  if(targeting&&!eligible)q('.fs-status').textContent=text('這張牌不能選為本次目標。','This card cannot be chosen for this effect.');
  track.querySelectorAll('.fs-slide').forEach((n,i)=>n.classList.toggle('fs-current',i===index));setStackFront(at,layer,e.kind==='site'?null:e.uid);arrangeMobileRealmPiles(document.querySelector('.board'));
 }
 function go(i,smooth=true){index=Math.max(0,Math.min(entries.length-1,i));const el=track.children[index];if(el)track.scrollTo({left:el.offsetLeft-(track.clientWidth-el.offsetWidth)/2,behavior:smooth&&!matchMedia('(prefers-reduced-motion:reduce)').matches?'smooth':'auto'});footer();}
 function populate(preferred){
  const old=current()?.key;entries=bridge.entries(at,layer);const p=plan();index=Math.max(0,entries.findIndex(e=>e.key===(preferred||old)));if(p&&!entries[index]?.key?.length)index=0;
  track.replaceChildren();for(const e of entries){const slide=document.createElement('article');slide.className='fs-slide'+(p?(p.keys.includes(e.key)?' fs-eligible':' fs-ineligible'):'');slide.setAttribute('role','listitem');slide.dataset.key=e.key;const face=document.createElement('div');face.className='fs-card-art';face.innerHTML=e.art;const name=document.createElement('h3');name.textContent=e.name;slide.append(face,name);track.append(slide);}
  q('.fs-head small').textContent=text('這個位置的卡牌 · 左右滑動選擇','Cards at this location · Swipe to browse');q('h2').textContent=String.fromCharCode(65+at%5)+(4-Math.floor(at/5))+' · '+(layer==='site'?text('地點','Site'):layer==='below'?bridge.belowName(at):text('地表','Surface'));
  const tabs=q('.fs-tabs');tabs.replaceChildren();for(const k of ['surface','site','below']){const list=bridge.entries(at,k);if(!list.length)continue;const b=document.createElement('button');b.type='button';b.textContent=(k==='surface'?text('地表','Surface'):k==='site'?text('地點','Site'):bridge.belowName(at))+' '+list.length;b.setAttribute('aria-pressed',String(k===layer));b.onclick=()=>{layer=k;index=0;setStackFront(at,layer);populate(list.find(e=>p?.keys.includes(e.key))?.key||list[0]?.key);};tabs.append(b);}
  cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>go(index,false));footer();
 }
 function open(where,requested='surface'){
  if(!stackViewEnabled()||!bridge.canBrowse())return false;
  at=+where;const p=plan(),available=['surface','site','below'].filter(k=>bridge.entries(at,k).length);if(!available.length)return false;
  layer=available.includes(requested)?requested:available[0];if(p){const withTarget=available.find(k=>bridge.entries(at,k).some(e=>p.keys.includes(e.key)));if(withTarget)layer=withTarget;}
  revision=bridge.revision();selection=bridge.selection();index=0;populate(bridge.entries(at,layer).find(e=>p?p.keys.includes(e.key):e.uid===getStackFront(at,layer))?.key);popup.open();requestAnimationFrame(()=>go(index,false));return true;
 }
 function routeTarget(where){if(nativeDepth||!stackViewEnabled()||!bridge.canBrowse())return false;at=+where;const p=plan(),mode=targetDisposition(p);if(mode==='multiple')return open(at);if(mode==='single'){const e=['surface','site','below'].flatMap(k=>bridge.entries(at,k)).find(e=>e.key===p.keys[0]);if(e){native(()=>bridge.target(e,at));return true;}}return false;}
 function click(e){if(nativeDepth||bridge.suppressed()||!stackViewEnabled()||!bridge.canBrowse()||e.target.closest('dialog'))return;const cell=e.target.closest('.board .cell');if(!cell)return;at=+cell.dataset.at;const p=plan(),mode=targetDisposition(p);
  if(mode==='position'){e.preventDefault();e.stopImmediatePropagation();native(()=>bridge.position(at));return;}
  if(p){if(routeTarget(at)){e.preventDefault();e.stopImmediatePropagation();}return;}
  if(open(at,cell.dataset.fsLayer||'surface')){e.preventDefault();e.stopImmediatePropagation();}
 }
 document.addEventListener('click',click,true);
 document.addEventListener('keydown',e=>{if(!['Enter',' '].includes(e.key)||!e.target.matches('.board .cell'))return;click(e);},true);
 track.addEventListener('scroll',()=>{cancelAnimationFrame(scrollFrame);scrollFrame=requestAnimationFrame(()=>{const center=track.scrollLeft+track.clientWidth/2;let best=Infinity,next=index;[...track.children].forEach((n,i)=>{const d=Math.abs(n.offsetLeft+n.offsetWidth/2-center);if(d<best){best=d;next=i;}});if(next!==index){index=next;footer();}});},{passive:true});q('.fs-prev').onclick=()=>go(index-1);q('.fs-next').onclick=()=>go(index+1);
 let refreshFrame=0;const app=document.querySelector('#app');if(app)new MutationObserver(()=>{cancelAnimationFrame(refreshFrame);refreshFrame=requestAnimationFrame(()=>{if(dialog.open&&(bridge.revision()!==revision||bridge.selection()!==selection)){const stale=bridge.revision()!==revision;close(false);if(stale)bridge.stale();}});}).observe(app,{childList:true,subtree:true});
 window.addEventListener('resize',()=>{if(dialog.open){if(!stackViewEnabled())close();else requestAnimationFrame(()=>go(index,false));}});window.addEventListener('sorcery:languagechange',()=>{if(dialog.open)populate(current()?.key);});
 return {enabled:stackViewEnabled,open,routeTarget,routeChoice:hit=>!!bridge.hasChoice()&&routeTarget(hit?.at),close};
}
