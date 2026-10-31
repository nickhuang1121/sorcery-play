// Casual matches are synchronized directly through RTDB transactions. Both
// members are trusted clients and may inspect the underlying room payload.
import {byId,validateDeck} from '../cards.js';
import {dispatch,restoreGame,castingCard} from '../engine.js';
import {createPlayableMatch} from '../match-setup.js';
import {finalLogicalActor,finalDecisionController} from '../final-control.js';
import {choiceToken} from '../choice-context.js';
import {ENGINE_BUILD,PRESENCE_STALE_MS,ROOM_BOTH_OFFLINE_MS} from './protocol.js';
import {checksumState} from './state-checksum.js';
import {requireThat,playerView,publicChoiceToken,canonicalAction} from './online-view.js';
export const FIREBASE_ROOMS='onlineRoomsV3',FIREBASE_DIRECTORY='onlineRoomDirectoryV3';
const clone=v=>structuredClone(v);
export const firebaseSeat=(meta,uid)=>meta?.host===uid?0:meta?.guest===uid?1:null;
export const firebasePresenceAlive=(presence,now)=>!!presence?.online&&Number.isFinite(presence.beat)&&now-presence.beat<=PRESENCE_STALE_MS;
export function firebaseRoomExpired(meta,now){return !!meta&&[meta.createdAt,meta.updatedAt,meta.presence?.[0]?.beat,meta.presence?.[1]?.beat].every(v=>Number.isFinite(v)&&now-v>ROOM_BOTH_OFFLINE_MS);}
export function makeFirebaseRoom(id,uid,now,visibility='public'){const core={id,createdAt:now,updatedAt:now,decks:[null,null],ready:[false,false],status:'lobby',revision:0,state:null,receipts:{},events:[]};return {meta:{schema:3,build:ENGINE_BUILD,host:uid,visibility:visibility==='private'?'private':'public',status:'lobby',createdAt:now,updatedAt:now,engineRevision:0,presence:{0:{online:true,beat:now},1:{online:false,beat:0}}},payload:JSON.stringify(core)};}
export function claimFirebaseGuest(meta,uid,now){requireThat(meta&&!['deleting','cancelled'].includes(meta.status),'房間不存在或已取消',404);requireThat(meta.build===ENGINE_BUILD,'遊戲版本不同，請重新整理',409);if(firebaseSeat(meta,uid)!==null)return clone(meta);requireThat(meta.status==='lobby'&&!meta.guest,'房間已滿或對局已開始',409);requireThat(firebasePresenceAlive(meta.presence?.[0],now),'房主暫時離線，請選擇其他房間',409);return {...meta,guest:uid,updatedAt:now};}
export function reduceFirebaseRoom(room,uid,body,now,seed){
 const meta=clone(room.meta),seat=firebaseSeat(meta,uid);requireThat(seat!==null,'此裝置沒有這個房間的席位權限',403);requireThat(meta.status!=='deleting','房間不存在或已過期',404);requireThat(body.build===ENGINE_BUILD&&meta.build===ENGINE_BUILD,'遊戲版本不同，請重新整理',409);
 const r=JSON.parse(room.payload);if(r.state)r.state=restoreGame(r.state);
 if(body.type==='deck'){requireThat(r.status==='lobby','開始後不能更換牌組',409);const errors=validateDeck(body.deck);requireThat(!errors.length,errors.join('；'));r.decks[seat]=clone(body.deck);r.ready[seat]=false;}
 else if(body.type==='ready'){requireThat(r.status==='lobby'&&r.decks[seat],'請先選擇合法牌組');r.ready[seat]=!!body.ready;}
 else if(body.type==='start'){requireThat(seat===0,'只有房主可以開始',403);requireThat(r.status==='lobby'&&meta.guest&&r.ready.every(Boolean)&&[0,1].every(p=>firebasePresenceAlive(meta.presence[p],now)),'雙方在線並準備後才能開始',409);r.state=createPlayableMatch(r.decks,seed,'online');r.state.players.forEach((p,i)=>p.name='玩家 '+(i+1));r.state.log[0].text='對局建立。'+r.state.players.map(p=>p.name+' 起手 '+p.hand.length+' 張').join('；')+'；'+r.state.players[r.state.firstPlayer].name+' 隨機取得先手，首回合不抽牌。';r.status='playing';r.revision=1;}
 else if(body.type==='action'){
  requireThat(r.state,'對局尚未開始',409);requireThat(typeof body.commandId==='string'&&/^[\w-]{8,100}$/.test(body.commandId),'命令識別碼錯誤');const a=body.action,key=seat+':'+body.commandId,digest=JSON.stringify(a),receipt=r.receipts[key];
  if(receipt){requireThat(receipt.digest===digest,'命令識別碼已使用',409);return clone(room);}
  requireThat(r.status==='playing','對局已結束',409);requireThat(body.revision===r.revision,'對局已更新，請重新選擇',409);requireThat(a&&typeof a.type==='string','動作格式錯誤');
  if(a.type==='concede')requireThat(a.player===seat,'只能由自己投降',403);else requireThat(finalDecisionController(r.state,finalLogicalActor(r.state))===seat&&a.player===finalLogicalActor(r.state),'等待對手完成操作',403);
  if(a.type==='choose')requireThat(body.choiceToken===publicChoiceToken(r,seat),'選擇已更新，請重新選擇',409);
  const canonical=canonicalAction(r.state,a),publicCard=a.type==='cast'?castingCard(r.state,canonical)?.id:null;r.state=dispatch(r.state,{...canonical,actor:seat,choiceToken:a.type==='choose'?choiceToken(r.state):undefined});r.revision++;r.receipts[key]={digest,revision:r.revision};r.events.push({revision:r.revision,seat,action:canonical,...(publicCard?{publicCard}:{})});if(r.state.winner!==null)r.status='ended';
 }else throw Error('未知房間操作');
 r.updatedAt=now;Object.assign(meta,{status:r.status,updatedAt:now,engineRevision:r.revision});return {meta,payload:JSON.stringify(r)};
}
export function firebaseRoomSnapshot(room,uid,now){const meta=room?.meta;requireThat(meta&&meta.status!=='deleting','房間不存在或已過期',404);const seat=firebaseSeat(meta,uid);requireThat(seat!==null,'此裝置沒有這個房間的席位權限',403);const r=JSON.parse(room.payload);if(r.state)r.state=restoreGame(r.state);const result={id:r.id,visibility:meta.visibility||'private',seat,provider:'firebase',token:uid,status:r.status,revision:r.revision,build:meta.build,players:[0,1].map(p=>({seat:p,present:!!(p===0?meta.host:meta.guest),online:firebasePresenceAlive(meta.presence[p],now),ready:r.ready[p],deck:r.decks[p]?{name:r.decks[p].name,avatar:r.decks[p].avatar,atlas:r.decks[p].atlas.length,spells:r.decks[p].spells.length}:null})),ownDeck:clone(r.decks[seat]),updatedAt:meta.updatedAt};
 if(r.state){Object.assign(result,playerView(r.state,seat));result.choiceToken=publicChoiceToken(r,seat);const event=r.events.at(-1),a=event?.action;result.lastAction=a?Object.fromEntries(['type','player','unit','caster','at','target','targets','direction','deck'].filter(k=>a[k]!==undefined).map(k=>[k,clone(a[k])])):null;if(event?.publicCard)result.lastAction.card=event.publicCard;result.fingerprint=checksumState(result.state);const serialized=JSON.stringify(result);result.runtimeCards=[...byId.values()].filter(c=>c.id.startsWith('runtime:')&&serialized.includes(c.id));}return result;
}
