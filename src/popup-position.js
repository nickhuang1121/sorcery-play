const STORAGE_KEY='sorcery.popup-position.v1';
const floating=dialog=>dialog.matches('.battle-panel,.forest-stack-dialog');
export function fitPopupPosition(point,size,viewport,gap=8){
 const maxX=Math.max(gap,viewport.width-size.width-gap),maxY=Math.max(gap,viewport.height-size.height-gap);
 return {x:Math.min(maxX,Math.max(gap,point.x)),y:Math.min(maxY,Math.max(gap,point.y))};
}
export function restorePopupPosition(saved,size,viewport){
 if(!saved||!Number.isFinite(saved.x)||!Number.isFinite(saved.y)||saved.x<0||saved.x>1||saved.y<0||saved.y>1)return null;
 return fitPopupPosition({x:saved.x*viewport.width,y:saved.y*viewport.height},size,viewport);
}
export function connectPopupPosition(dialog){
 let drag=null,watching=false;
 const viewport=()=>({width:window.innerWidth,height:window.innerHeight});
 const read=()=>{try{return JSON.parse(localStorage.getItem(STORAGE_KEY));}catch{return null;}};
 function clear(){for(const name of ['left','top','right','bottom','margin'])dialog.style.removeProperty(name);}
 function place(point){const r=dialog.getBoundingClientRect(),p=fitPopupPosition(point,r,viewport());Object.assign(dialog.style,{left:p.x+'px',top:p.y+'px',right:'auto',bottom:'auto',margin:'0'});return p;}
 function save(){const r=dialog.getBoundingClientRect(),v=viewport();try{localStorage.setItem(STORAGE_KEY,JSON.stringify({x:r.left/v.width,y:r.top/v.height}));}catch{}}
 function refresh(){
  const enabled=floating(dialog);dialog.toggleAttribute('data-draggable',enabled);
  if(!enabled){clear();return;}
  if(!watching){watching=true;window.addEventListener('resize',refresh);if(typeof ResizeObserver!=='undefined')new ResizeObserver(()=>{if(dialog.open)refresh();}).observe(dialog);}
  dialog.querySelectorAll('h2,.eyebrow,.fs-head').forEach(handle=>{
   handle.setAttribute('data-popup-drag-handle','');
   if(handle.matches('h2')){handle.tabIndex=0;handle.title='按住標題拖曳移動；方向鍵微調，Home 恢復預設位置';}
  });
  if(!dialog.open||drag)return;
  const r=dialog.getBoundingClientRect(),point=restorePopupPosition(read(),r,viewport());
  if(point)place(point);else clear();
 }
 dialog.addEventListener('pointerdown',event=>{
  if(!floating(dialog)||event.button!==0||event.isPrimary===false||!event.target.closest('[data-popup-drag-handle]')||event.target.closest('button,input,select,textarea,a'))return;
  const r=dialog.getBoundingClientRect();drag={id:event.pointerId,x:event.clientX,y:event.clientY,left:r.left,top:r.top,moved:false};
  event.preventDefault();event.stopPropagation();try{dialog.setPointerCapture(event.pointerId);}catch{}
 });
 dialog.addEventListener('pointermove',event=>{
  if(!drag||event.pointerId!==drag.id)return;
  const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
  if(!drag.moved&&Math.hypot(dx,dy)<3)return;
  drag.moved=true;dialog.classList.add('popup-dragging');place({x:drag.left+dx,y:drag.top+dy});event.preventDefault();event.stopPropagation();
 });
 function finish(event){if(!drag||event.pointerId!==drag.id)return;const moved=drag.moved;drag=null;dialog.classList.remove('popup-dragging');if(moved)save();try{if(dialog.hasPointerCapture(event.pointerId))dialog.releasePointerCapture(event.pointerId);}catch{}}
 for(const name of ['pointerup','pointercancel','lostpointercapture'])dialog.addEventListener(name,finish);
 dialog.addEventListener('keydown',event=>{
  if(!floating(dialog)||!event.target.matches('h2[data-popup-drag-handle]'))return;
  if(event.key==='Home'){try{localStorage.removeItem(STORAGE_KEY);}catch{}clear();refresh();event.preventDefault();event.stopPropagation();return;}
  const direction={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];if(!direction)return;
  const r=dialog.getBoundingClientRect(),step=event.shiftKey?24:8;place({x:r.left+direction[0]*step,y:r.top+direction[1]*step});save();event.preventDefault();event.stopPropagation();
 });
 dialog.addEventListener('close',()=>{drag=null;dialog.classList.remove('popup-dragging');});
 return {refresh};
}
