// Presentation only: actions still resolve entirely in the engine.
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;

export function drawnHandCards(before,after,player,lookup){
 if(!before||!after||before.phase==='mulligan'||after.phase==='mulligan')return [];
 const old=before.players?.[player],next=after.players?.[player];if(!old||!next)return [];
 const known=new Set(old.hand.map(h=>h.uid)),remaining={atlas:Math.max(0,old.atlas.length-next.atlas.length),spells:Math.max(0,old.spells.length-next.spells.length)};
 return next.hand.flatMap(h=>{const deck=lookup(h.card).type==='Site'?'atlas':'spells';if(known.has(h.uid)||!remaining[deck])return [];remaining[deck]--;return [{uid:h.uid,deck}];});
}

// Capture library positions before render replaces the board; play only after
// the successful state update has placed physical new cards in the visible hand.
export function prepareDrawMotion(before,after,player,lookup){
 if(document.hidden||reduced())return null;
 try{if(localStorage.getItem('sorcery.effects')==='false')return null;}catch{}
 const fan=document.querySelector('.fan');
 if(!fan||Number(fan.dataset.handPlayer)!==player)return null;
 const draws=drawnHandCards(before,after,player,lookup).flatMap(draw=>{
  const nodes=[...document.querySelectorAll(`[data-forest-pile="${draw.deck}"],[data-library-draw="${draw.deck}"]`)];
  const source=nodes.find(n=>{const r=n.getBoundingClientRect();return r.width>0&&r.height>0;});
  return source?[{...draw,from:source.getBoundingClientRect()}]:[];
 });
 if(!draws.length)return null;
 return ()=>requestAnimationFrame(()=>{
  const hand=document.querySelector('.fan');if(!hand||hand.classList.contains('sealed')||Number(hand.dataset.handPlayer)!==player)return;
  draws.forEach(({uid,from},index)=>setTimeout(()=>{
   const card=hand.querySelector(`[data-hand="${CSS.escape(uid)}"]`);if(!card||!hand.isConnected||hand.classList.contains('sealed'))return;
   const ghost=card.cloneNode(true);ghost.className='card image-card draw-card-flight';ghost.removeAttribute('style');
   for(const node of [ghost,...ghost.querySelectorAll('*')])for(const name of node.getAttributeNames())if(name==='id'||name.startsWith('data-'))node.removeAttribute(name);
   ghost.setAttribute('aria-hidden','true');ghost.inert=true;
   const ready=[...ghost.querySelectorAll('img')].map(img=>{img.loading='eager';return img.decode?.().catch(()=>{});});
   Promise.race([Promise.allSettled(ready),new Promise(resolve=>setTimeout(resolve,150))]).then(()=>{
    if(!card.isConnected||hand.classList.contains('sealed'))return;
    const bounds=hand.getBoundingClientRect(),initial=card.getBoundingClientRect();
    hand.scrollLeft+=initial.left-bounds.left-(hand.clientWidth-initial.width)/2;
    const end=card.getBoundingClientRect();if(!end.width||!end.height)return;
    const width=Math.min(220,innerWidth*.44,innerHeight*.38*744/1039),height=width*1039/744;
    const at=(x,y,scale,rotate=0)=>`translate3d(${x-width/2}px,${y-height/2}px,0) scale(${scale}) rotate(${rotate}deg)`;
    const start=at(from.left+from.width/2,from.top+from.height/2,from.width/width,draws[index].deck==='atlas'?-8:8);
    const middle=at(innerWidth/2,Math.max(height/2+16,Math.min(innerHeight*.46,bounds.top-height*.1)),1);
    const finish=at(end.left+end.width/2,end.top+end.height/2,end.width/width);
    Object.assign(ghost.style,{left:'0',top:'0',width:width+'px',height:height+'px',transform:start});
    const visibility=card.style.visibility;document.body.append(ghost);card.style.visibility='hidden';
    let observer;const cleanup=()=>{observer?.disconnect();ghost.remove();card.style.visibility=visibility;};
    try{
     const animation=ghost.animate([{transform:start,opacity:.45,easing:'cubic-bezier(.16,.8,.25,1)'},{transform:middle,opacity:1,offset:.4},{transform:middle,opacity:1,offset:.62,easing:'cubic-bezier(.4,0,.2,1)'},{transform:finish,opacity:1}],{duration:900,easing:'linear',fill:'forwards'});
     // A seat change or a new render must not leave the previous private card
     // hovering over the next player's screen.
     observer=new MutationObserver(()=>{if(!hand.isConnected)animation.cancel();});
     observer.observe(document.querySelector('#app')||document.body,{childList:true,subtree:true});
     animation.finished.catch(()=>{}).finally(cleanup);
    }catch{cleanup();}
   });
  },index*160));
 });
}
export function bindOpeningHand(dialog){
 const track=dialog.querySelector('.mulligan-cards'),cards=[...track.children];let frame=0;
 // Read untransformed layout positions: scaling and entrance motion must never
 // change which card is nearest or make native scroll snap chase moving bounds.
 const focus=()=>{
  const center=track.scrollLeft+track.clientWidth/2;
  let nearest=cards[0],distance=Infinity;
  for(const card of cards){const d=Math.abs(card.offsetLeft+card.offsetWidth/2-center);if(d<distance){distance=d;nearest=card;}}
  for(const card of cards)card.classList.toggle('opening-focus',card===nearest);
 };
 track.addEventListener('scroll',()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(focus);},{passive:true});
 cards.forEach(card=>{
  const center=()=>track.scrollTo({left:card.offsetLeft-(track.clientWidth-card.offsetWidth)/2,behavior:reduced()?'auto':'smooth'});
  card.addEventListener('click',center);
  card.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();const next=cards[Math.max(0,Math.min(cards.length-1,cards.indexOf(card)+(event.key==='ArrowRight'?1:-1)))];next.focus({preventScroll:true});track.scrollTo({left:next.offsetLeft-(track.clientWidth-next.offsetWidth)/2,behavior:reduced()?'auto':'smooth'});}});
  for(const img of card.querySelectorAll('img'))img.loading='eager';
 });
 focus();
 if(reduced())return;
 cards.forEach(card=>card.classList.add('opening-dealing'));
 const live=new Set();let cancelled=false;
 const cleanup=()=>{cancelled=true;dialog.removeEventListener('close',onClose);for(const animation of live)animation.cancel();for(const card of cards)card.classList.remove('opening-dealing');};
 // close events are queued: a previous player's close may arrive after this
 // same dialog has reopened for the next player. Do not cancel their deal.
 const onClose=()=>{if(!dialog.open||dialog.querySelector('.mulligan-cards')!==track)cleanup();};
 dialog.addEventListener('close',onClose);
 track.addEventListener('pointerdown',cleanup,{once:true,passive:true});
 track.addEventListener('wheel',cleanup,{once:true,passive:true});
 // Let the first images decode before flying. The fixed clones are outside the
 // scroll container, so their transforms cannot expand its scrollable overflow.
 const ready=cards.flatMap(card=>[...card.querySelectorAll('img')]).map(img=>img.decode?.().catch(()=>{}));
 Promise.race([Promise.allSettled(ready),new Promise(resolve=>setTimeout(resolve,350))]).then(()=>{
  if(cancelled||!dialog.open||dialog.querySelector('.mulligan-cards')!==track){cleanup();return;}
  const bounds=track.getBoundingClientRect();
  const visible=cards.filter(card=>{const r=card.getBoundingClientRect();return r.right>bounds.left&&r.left<bounds.right;});
  for(const card of cards)if(!visible.includes(card))card.classList.remove('opening-dealing');
  const pieces=visible.map(card=>({card,rect:card.getBoundingClientRect(),ghost:card.cloneNode(true)}));
  for(const {card,rect,ghost} of pieces){
   card.classList.add('opening-dealing');
   ghost.className='card image-card opening-deal-ghost';ghost.removeAttribute('data-redraw');ghost.removeAttribute('data-card');ghost.removeAttribute('style');ghost.setAttribute('aria-hidden','true');ghost.inert=true;
   Object.assign(ghost.style,{left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px'});document.body.append(ghost);
  }
  pieces.forEach(({card,rect,ghost},index)=>{
   const animation=ghost.animate([{transform:`translate3d(${innerWidth-rect.left+40}px,0,0) rotate(7deg)`,opacity:0},{transform:'translate3d(0,0,0) rotate(0)',opacity:1}],{duration:560,delay:index*90,easing:'cubic-bezier(.16,.76,.24,1)',fill:'both'});
   live.add(animation);animation.finished.catch(()=>{}).finally(()=>{live.delete(animation);ghost.remove();card.classList.remove('opening-dealing');});
  });
 });
}

let audio;
export function unlockCombatAudio(){
 if(!audio){const Audio=window.AudioContext||window.webkitAudioContext;if(Audio)audio=new Audio();}
 if(audio?.state==='suspended')audio.resume().catch(()=>{});
}
function boom(){
 if(audio?.state!=='running')return;
 const t=audio.currentTime,osc=audio.createOscillator(),gain=audio.createGain();osc.frequency.setValueAtTime(150,t);osc.frequency.exponentialRampToValueAtTime(36,t+.24);gain.gain.setValueAtTime(.65,t);gain.gain.exponentialRampToValueAtTime(.001,t+.32);osc.connect(gain).connect(audio.destination);osc.start(t);osc.stop(t+.34);
 const buffer=audio.createBuffer(1,audio.sampleRate*.16,audio.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length);
 const noise=audio.createBufferSource(),ng=audio.createGain();noise.buffer=buffer;ng.gain.value=.18;noise.connect(ng).connect(audio.destination);noise.start(t);
}
export function prepareCombat(before,action){
 const fight=before.choice?.frame?.step?.op==='combatAllocate'?before.choice.frame.step.fight:null;
 const pending=action.type==='pass'&&before.pending?.kind==='attack'?before.pending:action.type==='attack'?{attacker:action.unit,target:action.target}:action.type==='choose'&&fight?{...fight,target:fight.defenders?.[0]}:null;
 if(!pending)return null;
 const attacker=before.units.find(u=>u.uid===pending.attacker);
 if(!attacker)return null;
 const from=document.querySelector(`.board [data-unit="${CSS.escape(attacker.uid)}"]`);
 const target=before.units.find(u=>u.uid===pending.target),at=String(pending.target).startsWith('site:')?Number(pending.target.slice(5)):target?.at??pending.combatAt??attacker.at;
 const to=document.querySelector(`.board [data-at="${at}"]`);
 if(!from||!to)return null;
 const start=from.getBoundingClientRect(),end=to.getBoundingClientRect(),ghost=from.cloneNode(true);
 return after=>{
  if(after.pending?.attacker===pending.attacker||after.choice?.frame?.step?.op==='combatAllocate'||reduced()||document.hidden)return;
  // Honor the existing effects preference.
  try{if(localStorage.getItem('sorcery.effects')==='false')return;}catch{}
  ghost.className='combat-flyer';ghost.removeAttribute('id');ghost.removeAttribute('data-unit');ghost.setAttribute('aria-hidden','true');ghost.inert=true;
  Object.assign(ghost.style,{left:start.left+'px',top:start.top+'px',width:start.width+'px',height:start.height+'px'});document.body.append(ghost);
  const dx=end.left+end.width/2-start.left-start.width/2,dy=end.top+end.height/2-start.top-start.height/2;
  const motion=ghost.animate([{transform:'translate(0,0) scale(1)'},{transform:'translate(0,-65px) scale(1.5) rotate(-9deg)',offset:.5},{transform:`translate(${dx}px,${dy}px) scale(1.08) rotate(5deg)`,offset:.72},{transform:`translate(${dx}px,${dy}px) scale(.95)`,opacity:0}],{duration:720,easing:'cubic-bezier(.2,.7,.3,1)'});
  const impact=setTimeout(()=>{if(!ghost.isConnected)return;boom();const table=document.querySelector('.table');table?.animate([{transform:'translate(0,0)'},{transform:'translate(-9px,6px)'},{transform:'translate(8px,-5px)'},{transform:'translate(-5px,3px)'},{transform:'translate(0,0)'}],{duration:300});const ring=document.createElement('div');ring.className='combat-impact';Object.assign(ring.style,{left:end.left+end.width/2+'px',top:end.top+end.height/2+'px'});document.body.append(ring);setTimeout(()=>ring.remove(),650);},518);
  motion.finished.catch(()=>{}).finally(()=>{clearTimeout(impact);ghost.remove();});
 };
}
