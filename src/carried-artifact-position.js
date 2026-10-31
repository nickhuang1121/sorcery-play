import {globeActive,geometryLocationRecords} from './final-geometry.js';
const layer=o=>o.layer||'surface';
const same=(a,b)=>a.at===b.at&&layer(a)===layer(b);
const wraps=(d,n)=>{while(d>n/2)d-=n;while(d<-n/2)d+=n;return d;};
export function rememberCarriedPosition(s,item,bearer,A){
 item.carriedPosition={bearer:bearer.uid,at:bearer.at,layer:layer(bearer),itemAt:item.at,itemLayer:layer(item),motion:bearer.geometryMotion||0,wrapped:globeActive(s,A.card)};
}
export function followCarriedPosition(s,item,bearer,A){
 const prior=item.carriedPosition,locations=geometryLocationRecords(bearer),shares=()=>locations.some(loc=>same(loc,item));
 if(!prior||prior.bearer!==bearer.uid){
  // Old saves assumed the anchor. Preserve a valid explicit location; migrate
  // an old anchor-only record before tracking subsequent physical movement.
  if(!shares()){item.at=bearer.at;item.layer=layer(bearer);}
  rememberCarriedPosition(s,item,bearer,A);return;
 }
 const moved=prior.at!==bearer.at||prior.layer!==layer(bearer),growing=!!bearer.geometryLocations&&bearer.geometryGrowing;
 if(growing&&(moved||(bearer.geometryMotion||0)!==prior.motion)){
  const rejected=(bearer.geometryMotion||0)!==prior.motion&&bearer.geometryMovementTo&&!same(bearer,bearer.geometryMovementTo);
  if(!rejected){item.at=bearer.at;item.layer=layer(bearer);}
 }else if(moved){
   const origin=prior.itemAt??item.at;let dx=origin%5-prior.at%5,dy=Math.floor(origin/5)-Math.floor(prior.at/5);if(prior.wrapped){dx=wraps(dx,5);dy=wraps(dy,4);}
   let x=bearer.at%5+dx,y=Math.floor(bearer.at/5)+dy;if(globeActive(s,A.card)){x=(x+5)%5;y=(y+4)%4;}
   if(x>=0&&x<5&&y>=0&&y<4)item.at=y*5+x;item.layer=layer(bearer);
 }
 if(!shares()){item.bearer=null;delete item.carriedPosition;return;}
 rememberCarriedPosition(s,item,bearer,A);
}
