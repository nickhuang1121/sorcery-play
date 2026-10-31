// Presentation only: compare immutable dispatch results; never dispatch or alter rules.
export function battleEffects(before,after,action,lookup){
 const events=[],old=new Map(before.units.map(u=>[u.uid,u])),now=new Map(after.units.map(u=>[u.uid,u]));
 const push=(kind,u,amount)=>events.push({kind,uid:u?.uid,at:u?.at,amount});
 if(['cast','resurrect'].includes(action.type)){
  const entry=before.players[action.player]?.hand.find(h=>h.uid===action.hand),c=(entry?.card||action.card)&&lookup(entry?.card||action.card);
  const source=old.get(action.caster)||old.get(action.unit)||before.units.find(u=>u.controller===action.player&&lookup(u.card).type==='Avatar');
  push('cast',source);
  const target=typeof action.target==='string'?old.get(action.target):(action.target?.uid||action.target?.unit)?old.get(action.target.uid||action.target.unit):null;
  const at=action.at??(typeof action.target==='number'?action.target:typeof action.target==='object'?action.target?.at:undefined)??target?.at;
  if(c&&/zap|lightning|fireball|firebolt|water|flood/.test(c.slug)&&at!==undefined)events.push({kind:/zap|lightning/.test(c.slug)?'lightning':/fire/.test(c.slug)?'fire':'water',at});
 }
 for(const u of after.units){const prev=old.get(u.uid);if(!prev){push('summon',u);if(u.ward)push('shield',u);continue;}
  if(u.damage>prev.damage)push('hit',u,u.damage-prev.damage);
  if(u.damage<prev.damage&&before.turn===after.turn&&u.card===prev.card)push('heal',u,prev.damage-u.damage);
  if(!!u.ward!==!!prev.ward)push('shield',u);
 }
 for(const u of before.units)if(!now.has(u.uid)){const owner=u.owner??u.controller;if((after.players[owner]?.cemetery||[]).filter(id=>id===u.card).length>(before.players[owner]?.cemetery||[]).filter(id=>id===u.card).length)push('hit',u);push('depart',u);}
 for(let p=0;p<after.players.length;p++){
  const diff=after.players[p].life-before.players[p].life;
  const av=after.units.find(u=>u.controller===p&&lookup(u.card).type==='Avatar');
  if(diff>0)push('heal',av,diff);
  if(diff<0&&!events.some(e=>e.kind==='hit'&&e.uid===av?.uid))push('hit',av,-diff);
 }
 for(let at=0;at<20;at++)if(after.board[at]?.ward!==before.board[at]?.ward&&(after.board[at]?.ward||before.board[at]?.ward))events.push({kind:'shield',at});
 return events.filter(e=>Number.isInteger(e.at));
}
let manifest={},enabled=true,generation=0;const images=new Map(),live=new Set();
export function setEffectsEnabled(value){enabled=value;if(!value)clearBattleEffects();}
export async function loadBattleEffects(){const r=await fetch(new URL('../assets/conduit/index.json',import.meta.url));if(!r.ok)throw Error('CONDUIT index unavailable');manifest=await r.json();}
export function clearBattleEffects(){generation++;for(const cancel of [...live])cancel();}
export function playBattleEffect(event){
 if(!enabled||matchMedia('(prefers-reduced-motion: reduce)').matches||document.hidden)return;
 const fx=manifest[event.kind];if(!fx||live.size>=12)return;
 let image=images.get(event.kind);if(!image){image=new Image();image.src=new URL('../assets/conduit/'+fx.file,import.meta.url).href;images.set(event.kind,image);}
 const selector=event.uid?`.board [data-unit="${CSS.escape(event.uid)}"]`:null;
 const find=()=>selector&&document.querySelector(selector)||document.querySelector(`.board [data-at="${event.at}"]`);
 const anchor=find();if(!anchor)return;const origin=anchor.getBoundingClientRect();
 const canvas=document.createElement('canvas');canvas.className='conduit-fx';canvas.dataset.effect=event.kind;canvas.setAttribute('aria-hidden','true');
 canvas.width=fx.frames[0][2];canvas.height=fx.frames[0][3];canvas.style.mixBlendMode=fx.additive?'screen':'normal';document.body.append(canvas);
 const ctx=canvas.getContext('2d');let raf=0,start=null,dead=false;
 const cancel=()=>{dead=true;cancelAnimationFrame(raf);canvas.remove();live.delete(cancel);};live.add(cancel);
 const tick=time=>{if(dead)return;if(!document.querySelector('.board'))return cancel();if(!image.complete){raf=requestAnimationFrame(tick);return;}if(!image.naturalWidth)return cancel();if(start===null)start=time;
  const i=Math.floor((time-start)*fx.fps/1000);if(i>=fx.frames.length)return cancel();
  const r=find()?.getBoundingClientRect()||origin,stage=document.querySelector('.stage')?.getBoundingClientRect();
  const cx=r.left+r.width/2,cy=r.top+r.height/2,size=Math.min(210,Math.max(72,r.width*1.6));
  canvas.style.display=stage&&(cy<stage.top||cy>stage.bottom||cx<stage.left||cx>stage.right)?'none':'block';
  canvas.style.width=size+'px';canvas.style.height=size+'px';canvas.style.left=cx-size/2+'px';canvas.style.top=cy-size/2+'px';
  ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,...fx.frames[i],0,0,canvas.width,canvas.height);raf=requestAnimationFrame(tick);
 };raf=requestAnimationFrame(tick);
 // Network failures must never leave an immortal overlay.
 setTimeout(cancel,5000);
}
export function playBattleEffects(events){if(!enabled)return;const current=generation;for(const [i,event] of events.entries())setTimeout(()=>{if(current===generation)playBattleEffect(event);},Math.min(i*65,500));}
