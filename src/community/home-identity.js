import {getGoogleAuth} from '../net/firebase-auth.js';
export function homePlayerName(user,profile,locale){return user?(profile?.displayName||(locale==='en'?'Set your nickname':'設定你的暱稱')):(locale==='en'?'Guest':'訪客');}
export function createHomeIdentity({getAuth=getGoogleAuth,read=async uid=>{const {communityTransport}=await import('./service.js');return (await communityTransport()).get('communityAccountsV1/'+uid+'/public');},locale}={}){
 let root=null,user=null,profile=null,initialized=false,unsubscribe=null,epoch=0,loading=true;
 function paint(){if(!root?.isConnected)return;const en=locale()==='en';root.querySelector('[data-home-name]').textContent=loading?(en?'My account':'我的帳號'):homePlayerName(user,profile,locale());root.querySelector('[data-home-auth-label]').textContent=user?(en?'My profile':'我的資料'):(en?'Google sign-in':'Google 登入');}
 async function init(){if(initialized)return;initialized=true;const start=epoch;try{const auth=await getAuth();await auth.ready;if(start!==epoch)return;unsubscribe=auth.subscribe(async next=>{const token=++epoch;user=next;profile=null;loading=false;paint();if(!next)return;try{const value=await read(next.uid);if(token!==epoch)return;profile=value;paint();}catch{if(token===epoch)paint();}});}catch{if(start!==epoch)return;initialized=false;loading=false;paint();}}
 return {mount(node){root=node;paint();void init();},unmount(){root=null;},close(){this.unmount();epoch++;unsubscribe?.();unsubscribe=null;initialized=false;}};
}
