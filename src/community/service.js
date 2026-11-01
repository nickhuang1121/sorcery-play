import {ACCOUNT_ROOT,DIRECTORY,safeKey,mutateAccount,onlineRecord,hydrateAccount} from './model.js';
import {createFirebaseTransport} from '../net/firebase-transport.js?v=20261031-public-rooms';
import {firebaseConfig} from '../net/firebase-config.js';
export function createCommunityService({transport:t,uid}){
 safeKey(uid);const path=ACCOUNT_ROOT+'/'+uid;
 async function check(){const user=await t.ensureAuth();if(user?.uid!==uid)throw Error('Google sign-in required');}
 return {
  async read(){await check();return hydrateAccount(await t.get(path));},
  async readRoomMeta(id){await check();if(!/^[A-Z0-9]{6}$/.test(id))throw Error('Invalid identifier');const meta=await t.get('onlineRoomsV3/'+id+'/meta');return meta&&(meta.host===uid||meta.guest===uid)?meta:null;},
  async syncRoom(id){await check();if(!/^[A-Z0-9]{6}$/.test(id))throw Error('Invalid identifier');const room=await t.get('onlineRoomsV3/'+id);const op=onlineRecord(room,uid);return op?this.mutate(op):null;},
  async mutate(op){await check();const result=await t.transact(path,current=>mutateAccount(current,op,t.serverNow?.()??Date.now()));if(!result.committed)throw Error('Save failed');await t.set(DIRECTORY+'/'+uid,true);return hydrateAccount(result.value);},
  async removeAccount(){await check();await t.remove(DIRECTORY+'/'+uid);await t.remove(path);},
 };
}
let transport;
export const communityTransport=()=>transport??=createFirebaseTransport(firebaseConfig).catch(e=>{transport=null;throw e;});
export async function getCommunityService(uid){return createCommunityService({transport:await communityTransport(),uid});}
export async function readLeaderboard(t){t??=await communityTransport();const ids=Object.keys(await t.get(DIRECTORY)||{});const entries=await Promise.all(ids.map(async uid=>[uid,await t.get(ACCOUNT_ROOT+'/'+safeKey(uid)+'/public')]));return Object.fromEntries(entries.filter(([,v])=>v));}
