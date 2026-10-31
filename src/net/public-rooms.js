import {ENGINE_BUILD} from './protocol.js';
import {firebasePresenceAlive,firebaseSeat} from './firebase-match-model.js?v=20261031-public-rooms';
import {requireThat} from './online-view.js';
export function publicRoom(id,meta,uid,now){
 if(!meta||meta.visibility!=='public'||meta.status!=='lobby'||meta.build!==ENGINE_BUILD||meta.guest||meta.host===uid||!firebasePresenceAlive(meta.presence?.[0],now))return null;
 return {id,status:'lobby',seats:1,online:[true,false],createdAt:meta.createdAt,updatedAt:meta.updatedAt};
}
export function departLobby(room,uid,now){
 requireThat(room?.meta,'房間不存在或已取消',404);const next=structuredClone(room),seat=firebaseSeat(next.meta,uid);
 requireThat(seat!==null,'你已不在這個房間',403);requireThat(next.meta.status==='lobby','對局已開始，請返回戰場',409);
 const core=JSON.parse(next.payload);requireThat(core.status==='lobby'&&!core.state,'對局已開始，請返回戰場',409);
 if(seat===0){next.meta.status='cancelled';core.status='cancelled';}
 else{delete next.meta.guest;next.meta.presence[1]={online:false,beat:0};core.decks[1]=null;core.ready=[false,false];}
 next.meta.updatedAt=now;core.updatedAt=now;next.payload=JSON.stringify(core);return next;
}
