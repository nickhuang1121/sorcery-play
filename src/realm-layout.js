const ASPECT=744/1039;
// Keep useful card faces. Overlap only when a complete grid cannot fit at this size.
export function realmCardLayout(width,height,count,{gap=4,minWidth=28,maxWidth=120,minStackWidth=44}={}){
 const w=Math.max(0,Number(width)||0),h=Math.max(0,Number(height)||0),n=Math.max(0,Math.floor(Number(count)||0));
 if(!n||!w||!h)return {mode:'empty',cards:[]};
 let best=null;
 for(let columns=1;columns<=n;columns++){
  const rows=Math.ceil(n/columns),cardWidth=Math.min(maxWidth,(w-gap*(columns-1))/columns,(h-gap*(rows-1))/rows*ASPECT);
  if(cardWidth>0&&(!best||cardWidth>best.width+.001))best={columns,rows,width:cardWidth};
 }
 const readableWidth=Math.min(minWidth,w,h*ASPECT,maxWidth);
 if(best&&(best.width>=readableWidth-.001||n===1)){
  const cardHeight=best.width/ASPECT,totalHeight=best.rows*cardHeight+(best.rows-1)*gap;
  return {mode:'spread',cards:Array.from({length:n},(_,i)=>{
   const row=Math.floor(i/best.columns),column=i%best.columns,inRow=Math.min(best.columns,n-row*best.columns),rowWidth=inRow*best.width+(inRow-1)*gap;
   return {x:(w-rowWidth)/2+column*(best.width+gap),y:(h-totalHeight)/2+row*(cardHeight+gap),width:best.width,height:cardHeight};
  })};
 }
 const fullWidth=Math.min(w,h*ASPECT,maxWidth),cardWidth=Math.min(fullWidth,Math.max(minStackWidth,w-(n-1)*12)),cardHeight=cardWidth/ASPECT,step=n>1?(w-cardWidth)/(n-1):0;
 return {mode:'stack',cards:Array.from({length:n},(_,i)=>({x:i*step,y:(h-cardHeight)/2,width:cardWidth,height:cardHeight}))};
}

export function arrangeRealmPiles(root){
 if(!root)return;
 for(const pile of root.querySelectorAll('.realm-pile')){
  const area=pile.querySelector('.pile-cards');if(!area)continue;
  for(const edge of area.querySelectorAll('.wall-edge'))pile.append(edge);
  const items=[...area.children].filter(el=>el.matches('.pile-slot,.realm-object'));
  const size=area.getBoundingClientRect(),layout=realmCardLayout(size.width,size.height,items.length);
  pile.dataset.layout=layout.mode;
  const button=pile.querySelector('.pile-open');if(button){
   let label=button.querySelector('.pile-label'),count=button.querySelector('.pile-count');
   if(!label||!count){label=button.ownerDocument.createElement('span');label.className='pile-label';count=button.ownerDocument.createElement('b');count.className='pile-count';button.replaceChildren(label,count);}
   label.textContent=pile.dataset.label;count.textContent=String(items.length);
  }
  items.forEach((el,i)=>{const r=layout.cards[i];if(!r)return;el.style.left=r.x+'px';el.style.top=r.y+'px';el.style.width=r.width+'px';el.style.height=r.height+'px';el.style.zIndex=String(i+1);});
 }
}
