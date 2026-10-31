import {RoomError,requireThat,playerView,publicChoiceToken,canonicalAction} from '../src/net/online-view.js';
export {RoomError,playerView} from '../src/net/online-view.js';
import {randomBytes,createHash,timingSafeEqual} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {card,byId,validateDeck} from '../src/cards.js';
import {dispatch,restoreGame,legalActions,observation,topSpellAccess,castingCard} from '../src/engine.js';
import {createPlayableMatch} from '../src/match-setup.js';
import {finalLogicalActor,finalDecisionController,finalControlledPlayer} from '../src/final-control.js';
import {choiceToken} from '../src/choice-context.js';
import {checksumState} from '../src/net/state-checksum.js';
import {ENGINE_BUILD,ROOM_BOTH_OFFLINE_MS,PRESENCE_STALE_MS} from '../src/net/protocol.js';

const clone=v=>structuredClone(v),secret=()=>randomBytes(32).toString('hex');
const hash=v=>createHash('sha256').update(v).digest('hex');
const equal=(a,b)=>typeof a==='string'&&typeof b==='string'&&a.length===b.length&&timingSafeEqual(Buffer.from(a),Buffer.from(b));

// All room mutations execute synchronously in this process: claiming a seat,
// committing a command and checking expiry are indivisible operations. Persist
// before replying so a process restart can resume the exact same revision.
export function createRoomStore({directory=null,now=Date.now,seed=()=>randomBytes(4).readUInt32LE()}={}){
 const rooms=new Map();
 if(directory){fs.mkdirSync(directory,{recursive:true,mode:0o700});for(const file of fs.readdirSync(directory).filter(f=>/^[A-Z0-9]{6}\.json$/.test(f))){const r=JSON.parse(fs.readFileSync(path.join(directory,file)));if(r.state)r.state=restoreGame(r.state);rooms.set(r.id,r);}}
 function save(r){if(!directory)return;const dest=path.join(directory,r.id+'.json'),tmp=dest+'.tmp';fs.writeFileSync(tmp,JSON.stringify(r),{mode:0o600});fs.renameSync(tmp,dest);}
 function commit(r){save(r);rooms.set(r.id,r);}
 const online=p=>!!p&&p.online&&now()-p.beat<=PRESENCE_STALE_MS;
 function sweep(){const removed=[];for(const [id,r]of rooms){if(r.members.some(online))continue;const last=Math.max(r.createdAt,r.updatedAt,...r.members.map(p=>p?.beat||0));if(now()-last<=ROOM_BOTH_OFFLINE_MS)continue;if(directory)fs.rmSync(path.join(directory,id+'.json'),{force:true});rooms.delete(id);removed.push(id);}return removed;}
 const room=id=>{requireThat(/^[A-Z0-9]{6}$/.test(id),'房號格式錯誤');const r=rooms.get(id);requireThat(r,'房間不存在或已過期',404);return r;};
 function auth(r,token){const digest=hash(String(token||'')),seat=r.members.findIndex(p=>p&&equal(p.tokenHash,digest));requireThat(seat>=0,'此裝置沒有這個房間的席位權限',403);return seat;}
 function member(token){return {tokenHash:hash(token),beat:now(),online:true};}
 function touch(r,seat){r.members[seat].beat=now();r.members[seat].online=true;}
 function envelope(r,seat){
  const result={id:r.id,seat,status:r.status,revision:r.revision,build:ENGINE_BUILD,players:r.members.map((p,i)=>({seat:i,present:!!p,online:online(p),ready:!!r.ready[i],deck:r.decks[i]?{name:r.decks[i].name,avatar:r.decks[i].avatar,atlas:r.decks[i].atlas.length,spells:r.decks[i].spells.length}:null})),ownDeck:clone(r.decks[seat]),updatedAt:r.updatedAt};
  if(r.state){Object.assign(result,playerView(r.state,seat));result.choiceToken=publicChoiceToken(r,seat);const event=r.events.at(-1),last=event?.action;result.lastAction=last?Object.fromEntries(['type','player','unit','caster','at','target','targets','direction','deck'].filter(k=>last[k]!==undefined).map(k=>[k,clone(last[k])])):null;if(event?.publicCard)result.lastAction.card=event.publicCard;result.fingerprint=checksumState(result.state);const serialized=JSON.stringify(result);result.runtimeCards=[...byId.values()].filter(c=>c.id.startsWith('runtime:')&&serialized.includes(c.id));}
  return result;
 }
 return {
  sweep,
  list(){sweep();return [...rooms.values()].map(r=>({id:r.id,status:r.status,seats:r.members.filter(Boolean).length,online:r.members.map(online),updatedAt:r.updatedAt}));},
  create(){sweep();let id;do{id=randomBytes(4).toString('hex').slice(0,6).toUpperCase();}while(rooms.has(id));const token=secret(),r={id,createdAt:now(),updatedAt:now(),members:[member(token),null],decks:[null,null],ready:[false,false],status:'lobby',revision:0,state:null,receipts:{},events:[]};commit(r);return {...envelope(r,0),token};},
  join(id){sweep();const r=clone(room(id));requireThat(r.status==='lobby'&&!r.members[1],'房間已滿或對局已開始',409);const token=secret();r.members[1]=member(token);r.updatedAt=now();commit(r);return {...envelope(r,1),token};},
  read(id,token){const r=clone(room(id)),seat=auth(r,token);touch(r,seat);commit(r);return envelope(r,seat);},
  replay(id,token){const r=room(id);auth(r,token);requireThat(r.status==='ended','對局結束後才能匯出完整重播',409);return {build:ENGINE_BUILD,decks:clone(r.decks),seed:r.state.seed,history:clone(r.state.history),state:clone(r.state)};},
  update(id,token,body){const r=clone(room(id)),seat=auth(r,token);touch(r,seat);
   if(body.type==='offline'){r.members[seat].online=false;r.members[seat].beat=now();commit(r);return {ok:true};}
   requireThat(body.build===ENGINE_BUILD,'遊戲版本不同，請重新整理',409);
   if(body.type==='deck'){requireThat(r.status==='lobby','開始後不能更換牌組',409);const d=body.deck;requireThat(d&&Array.isArray(d.atlas)&&Array.isArray(d.spells),'牌組格式錯誤');const errors=validateDeck(d);requireThat(!errors.length,errors.join('；'));r.decks[seat]=clone(d);r.ready[seat]=false;}
   else if(body.type==='ready'){requireThat(r.status==='lobby'&&r.decks[seat],'請先選擇合法牌組');r.ready[seat]=!!body.ready;}
   else if(body.type==='start'){requireThat(seat===0,'只有房主可以開始',403);requireThat(r.status==='lobby'&&r.members[1]&&r.ready.every(Boolean)&&r.members.every(online),'雙方在線並準備後才能開始',409);r.state=createPlayableMatch(r.decks,seed(),'online');r.state.players.forEach((p,i)=>p.name='玩家 '+(i+1));r.state.log[0].text='對局建立。'+r.state.players.map(p=>p.name+' 起手 '+p.hand.length+' 張').join('；')+'；'+r.state.players[r.state.firstPlayer].name+' 隨機取得先手，首回合不抽牌。';r.status='playing';r.revision=1;}
   else if(body.type==='action'){
    requireThat(r.state,'對局尚未開始',409);
    requireThat(typeof body.commandId==='string'&&/^[\w-]{8,100}$/.test(body.commandId),'命令識別碼錯誤');
    const key=seat+':'+body.commandId,existing=r.receipts[key];
    if(existing){requireThat(existing.digest===hash(JSON.stringify(body.action)),'命令識別碼已使用',409);return envelope(r,seat);}
    requireThat(r.status==='playing','對局已結束',409);
    requireThat(body.revision===r.revision,'對局已更新，請重新選擇',409);
    const a=body.action;requireThat(a&&typeof a.type==='string','動作格式錯誤');
    if(a.type==='concede')requireThat(a.player===seat,'只能由自己投降',403);
    else requireThat(finalDecisionController(r.state,finalLogicalActor(r.state))===seat&&a.player===finalLogicalActor(r.state),'等待對手完成操作',403);
    if(a.type==='choose')requireThat(body.choiceToken===publicChoiceToken(r,seat),'選擇已更新，請重新選擇',409);
    // dispatch performs the detailed engine validation; client actor never wins.
    const canonical=canonicalAction(r.state,a),publicCard=a.type==='cast'?castingCard(r.state,canonical)?.id:null;
    const next=dispatch(r.state,{...canonical,actor:seat,choiceToken:a.type==='choose'?choiceToken(r.state):undefined});
    r.state=next;r.revision++;r.receipts[key]={digest:hash(JSON.stringify(a)),revision:r.revision};
    r.events.push({revision:r.revision,seat,action:clone(a),...(publicCard?{publicCard}:{})});
    if(r.state.winner!==null)r.status='ended';
   }else throw new RoomError('未知房間操作');
   r.updatedAt=now();commit(r);return envelope(r,seat);
  },
  // Operator-only replay export; never exposed as an unauthenticated endpoint.
  inspect(id){return clone(room(id));}
 };
}
