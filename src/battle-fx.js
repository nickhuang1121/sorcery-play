import {newKairosReturn} from './kairos-presentation.js';
// Presentation only: compare immutable dispatch results; never dispatch or alter rules.
export function battleEffects(before,after,action,lookup){
 const restoration=newKairosReturn(before,after),restored=new Set(restoration?.restored.map(r=>r.uid)||[]);
 const events=[],old=new Map(before.units.map(u=>[u.uid,u])),now=new Map(after.units.map(u=>[u.uid,u]));
 const deaths=new Map((after.deathHistory||[]).slice((before.deathHistory||[]).length).map(d=>[d.uid,d]));
 const twisters=(after.finalTwisterDigitalResults||[]).slice((before.finalTwisterDigitalResults||[]).length),twisterLandings=new Map(twisters.map(r=>[r.uid,r.landing]));
 const push=(kind,u,amount)=>events.push({kind,uid:u?.uid,at:u?.at,amount});
 if(['cast','resurrect'].includes(action.type)){
  const entry=before.players[action.player]?.hand.find(h=>h.uid===action.hand),c=(entry?.card||action.card)&&lookup(entry?.card||action.card);
  const source=old.get(action.caster)||old.get(action.unit)||before.units.find(u=>u.controller===action.player&&lookup(u.card).type==='Avatar');
  push('cast',source);
  const target=typeof action.target==='string'?old.get(action.target):(action.target?.uid||action.target?.unit)?old.get(action.target.uid||action.target.unit):null;
  const at=action.at??(typeof action.target==='number'?action.target:typeof action.target==='object'?action.target?.at:undefined)??target?.at;
  if(c&&/zap|lightning|fireball|firebolt|water|flood/.test(c.slug)&&at!==undefined)events.push({kind:/zap|lightning/.test(c.slug)?'lightning':/fire/.test(c.slug)?'fire':'water',at});
 }
 // Use the committed RNG result, even if the thrown minion already died.
 // A marker belongs to the chosen square, never the minion's old position.
 for(const result of twisters)events.push({kind:'twister',at:result.landing});
 for(const u of after.units){const prev=old.get(u.uid);if(restored.has(u.uid)){if(!prev||prev.at!==u.at||prev.layer!==u.layer||prev.tapped!==u.tapped||prev.damage!==u.damage)push('restore',u);continue;}if(!prev){push('summon',u);if(u.ward)push('shield',u);continue;}
  if(u.damage>prev.damage)push('hit',u,u.damage-prev.damage);
  if(u.damage<prev.damage&&before.turn===after.turn&&u.card===prev.card)push('heal',u,prev.damage-u.damage);
  if(!!u.ward!==!!prev.ward)push('shield',u);
 }
 for(const r of restoration?.restored||[])if(r.zone==='board'&&after.board[r.at]?.uid===r.uid&&before.board[r.at]?.uid!==r.uid)events.push({kind:'restore',at:r.at});
 for(const u of before.units)if(!now.has(u.uid)){const owner=u.owner??u.controller,at=deaths.get(u.uid)?.at??twisterLandings.get(u.uid),location=Number.isInteger(at)?{...u,at}:u;if(deaths.has(u.uid)||(after.players[owner]?.cemetery||[]).filter(id=>id===u.card).length>(before.players[owner]?.cemetery||[]).filter(id=>id===u.card).length)push('hit',location);push('depart',location);}
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
 if(live.size>=12)return;
 if(event.kind==='twister'){
  const anchor=document.querySelector(`.board [data-at="${event.at}"]`);if(!anchor)return;
  const node=document.createElement('div');node.className='twister-impact-fx';node.dataset.effect='twister';node.dataset.at=event.at;node.setAttribute('aria-hidden','true');
  const label=document.createElement('span');label.className='twister-impact-label';label.textContent=`Chaos Twister · ${String.fromCharCode(65+event.at%5)}${4-Math.floor(event.at/5)}`;
  const rings=document.createElement('div');rings.className='twister-impact-rings';node.append(rings,label);document.body.append(node);
  let raf=0;const cancel=()=>{cancelAnimationFrame(raf);node.remove();live.delete(cancel);};live.add(cancel);
  const tick=()=>{const cell=document.querySelector(`.board [data-at="${event.at}"]`);if(!cell||document.hidden)return cancel();const r=cell.getBoundingClientRect(),stage=document.querySelector('.stage')?.getBoundingClientRect();Object.assign(node.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px',display:stage&&(r.bottom<stage.top||r.top>stage.bottom||r.right<stage.left||r.left>stage.right)?'none':'block'});raf=requestAnimationFrame(tick);};tick();
  node.addEventListener('animationend',e=>{if(e.target===node)cancel();});setTimeout(cancel,3400);return;
 }
 if(event.kind==='restore'){const anchor=event.uid&&document.querySelector(`.board [data-unit="${CSS.escape(event.uid)}"]`)||document.querySelector(`.board [data-at="${event.at}"]`);if(!anchor)return;const r=anchor.getBoundingClientRect(),node=document.createElement('div');node.className='kairos-restore-fx';node.setAttribute('aria-hidden','true');Object.assign(node.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'});document.body.append(node);const cancel=()=>{node.remove();live.delete(cancel);};live.add(cancel);node.addEventListener('animationend',cancel,{once:true});setTimeout(cancel,1400);return;}
 const fx=manifest[event.kind];if(!fx)return;
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
