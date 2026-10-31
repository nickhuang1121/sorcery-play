import {ENGINE_BUILD} from './protocol.js';
import {checksumState} from './state-checksum.js';
// Live Server keeps the user's existing local decks/preferences on port 5500.
// Deployed games use their own origin and proxy /api to the authority service.
const base=()=>location.port==='5500'?location.protocol+'//'+location.hostname+':8787':'';
export const onlineRoomKey='sorcery.firebaseOnlineRoom';
export function savedOnlineRoom(){try{return JSON.parse(localStorage.getItem(onlineRoomKey));}catch{return null;}}
export function saveOnlineRoom(room){const v={id:room.id,seat:room.seat,token:room.token,provider:room.provider||'firebase'};localStorage.setItem(onlineRoomKey,JSON.stringify(v));return v;}
export async function onlineRequest(route,options={}){const {getFirebaseOnline}=await import('./firebase-online.js');return (await getFirebaseOnline()).request(route,options);}
// Optional local authority adapter, used by development tests only.
export async function httpOnlineRequest(route,{method='GET',token,body,signal}={}){
 const response=await fetch(base()+'/api'+route,{method,signal:signal??AbortSignal.timeout(8000),headers:{...(token?{Authorization:'Bearer '+token}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify({...body,build:ENGINE_BUILD}):undefined});
 let value;try{value=await response.json();}catch{throw Error('請使用線上伺服器開啟遊戲（npm run start:online），目前網址沒有連線服務。');}
 if(!response.ok){const error=Error(value.error||'連線失敗');error.status=response.status;throw error;}return value;
}
export function createOnlineClient({room,onSnapshot,onStatus,onError,interval=1000,request:send=onlineRequest}){
 let closed=false,timer=null,busy=false,connected=false,current=null,request=null;
 const route='/rooms/'+room.id;
 function accept(snapshot){if(snapshot.build!==ENGINE_BUILD||snapshot.state&&checksumState(snapshot.state)!==snapshot.fingerprint){const error=Error(snapshot.build!==ENGINE_BUILD?'遊戲版本不同，請重新整理':'對局校驗失敗，已鎖定操作');error.status=409;throw error;}if(current&&snapshot.revision<current.revision)return;const changed=!current||snapshot.revision!==current.revision;current=snapshot;connected=true;onStatus?.({connected:true,busy,room:snapshot});onSnapshot?.(snapshot,{changed});}
 async function refresh(){if(closed||busy)return;clearTimeout(timer);timer=null;request=new AbortController();const timeout=setTimeout(()=>request?.abort(),8000);try{const snapshot=await send(route,{token:room.token,signal:request.signal});if(!closed&&!busy)accept(snapshot);}catch(e){if(closed)return;connected=false;onStatus?.({connected:false,busy,error:e});if([401,403,404,409].includes(e.status)){closed=true;onError?.(e);}}finally{clearTimeout(timeout);request=null;if(!closed)timer=setTimeout(refresh,interval);}}
 async function submit(action){if(closed||!connected||busy||!current?.state)throw Error('正在同步，請稍候');busy=true;onStatus?.({connected,busy});const body={type:'action',action,revision:current.revision,choiceToken:current.choiceToken,commandId:crypto.randomUUID()};
  try{let result;try{result=await send(route,{method:'POST',token:room.token,body});}catch(e){if(e.status)throw e;result=await send(route,{method:'POST',token:room.token,body});}busy=false;accept(result);}catch(e){busy=false;connected=false;onStatus?.({connected:false,busy,error:e});throw e;}finally{clearTimeout(timer);if(!closed)timer=setTimeout(refresh,50);}
 }
 return {start:refresh,submit,exportReplay:()=>send(route+'/replay',{token:room.token}),get current(){return current;},get ready(){return connected&&!busy&&!closed;},close(){closed=true;clearTimeout(timer);request?.abort();},async offline(){try{await send(route,{method:'POST',token:room.token,body:{type:'offline'}});}catch{}}};
}
