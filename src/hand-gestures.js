// Horizontal browsing and upward play gestures must acquire different intent.
// Small or diagonal movements remain undecided instead of starting a card drag.
export function handMotion(dx,dy,{canScroll=true,threshold=12,bias=4}={}){
 const x=Math.abs(dx),y=Math.abs(dy);
 if(Math.max(x,y)<threshold)return 'pending';
 if(x>y+bias)return canScroll?'scroll':'cancel';
 if(y>x+bias)return dy<0?'drag':'cancel';
 return 'pending';
}
// Keep the viewport during ordinary game renders, but never reuse another seat's
// private-hand position when passing a local two-player game to the next player.
export function handScrollAfterRender(previous,player,maxScroll){
 if(previous?.player!==player||!Number.isFinite(previous.left))return 0;
 return Math.max(0,Math.min(previous.left,Math.max(0,maxScroll)));
}
