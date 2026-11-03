import {handMotion} from './hand-gestures.js';

// Handle touch browsing directly: iOS need not acquire a native pan through
// the transparent, click-through fan. Vertical movement remains a play gesture.
export function installHandTouchScroll(root,{onScrollStart=()=>{},requestFrame=requestAnimationFrame,cancelFrame=cancelAnimationFrame,now=()=>performance.now()}={}){
 root.documentElement?.classList.add('hand-touch-scroll');
 let gesture=null,momentum=0,blocked=null;
 const stop=()=>{cancelFrame(momentum);momentum=0;};
 const reset=()=>{gesture=null;};
 const start=event=>{
  stop();reset();blocked=null;if(event.touches.length!==1)return;
  const track=event.target.closest?.('.fan:not(.sealed),.mulligan-cards');
  if(!track||track.scrollWidth<=track.clientWidth+1)return;
  const touch=event.touches[0];gesture={track,id:touch.identifier,x:touch.clientX,y:touch.clientY,left:track.scrollLeft,lastX:touch.clientX,time:now(),velocity:0,scrolling:false,cancelled:false};
 };
 const move=event=>{
  const g=gesture;if(!g)return;
  if(event.touches.length!==1||!g.track.isConnected){reset();return;}
  const touch=[...event.touches].find(t=>t.identifier===g.id);if(!touch)return;
  const dx=touch.clientX-g.x,dy=touch.clientY-g.y;
  if(g.cancelled)return;
  if(!g.scrolling){
   const intent=handMotion(dx,dy,{threshold:8});
   if(intent==='pending')return;
   if(intent!=='scroll'){g.cancelled=true;return;}
   g.scrolling=true;onScrollStart(g.track);
  }
  if(event.cancelable)event.preventDefault();
  const time=now(),elapsed=time-g.time;
  if(elapsed>0)g.velocity=Math.max(-2.5,Math.min(2.5,(g.lastX-touch.clientX)/elapsed));
  g.track.scrollLeft=Math.max(0,Math.min(g.track.scrollWidth-g.track.clientWidth,g.left-dx));
  g.lastX=touch.clientX;g.time=time;
 };
 const finish=()=>{
  const g=gesture;reset();if(!g?.scrolling)return;
  blocked={track:g.track,until:now()+400};
  let velocity=now()-g.time>100?0:g.velocity,last=now();
  const coast=()=>{
   if(!g.track.isConnected||Math.abs(velocity)<.03){momentum=0;return;}
   const time=now(),elapsed=Math.min(32,time-last);last=time;
   const before=g.track.scrollLeft;g.track.scrollLeft=Math.max(0,Math.min(g.track.scrollWidth-g.track.clientWidth,before+velocity*elapsed));
   velocity*=Math.pow(.9,elapsed/16);
   if(g.track.scrollLeft===before){momentum=0;return;}
   momentum=requestFrame(coast);
  };
  momentum=requestFrame(coast);
 };
 const cancel=()=>{if(gesture?.scrolling)blocked={track:gesture.track,until:now()+400};stop();reset();};
 const click=event=>{if(blocked&&now()<blocked.until&&blocked.track.contains(event.target)){event.preventDefault();event.stopImmediatePropagation();}};
 const listeners=[['touchstart',start,{capture:true,passive:true}],['touchmove',move,{capture:true,passive:false}],['touchend',finish,{capture:true,passive:true}],['touchcancel',cancel,{capture:true,passive:true}],['click',click,{capture:true}]];
 for(const [name,fn,options]of listeners)root.addEventListener(name,fn,options);
 return ()=>{stop();reset();root.documentElement?.classList.remove('hand-touch-scroll');for(const [name,fn,options]of listeners)root.removeEventListener(name,fn,options);};
}
