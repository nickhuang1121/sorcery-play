// Presentation only: actions still resolve entirely in the engine.
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
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
