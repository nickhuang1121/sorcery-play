// Casual, client-reported statistics. Private records/decks never leave the owner subtree.
import {byId,validateDeck} from '../cards.js';
export const ACCOUNT_ROOT='communityAccountsV1',DIRECTORY='communityDirectoryV1';
const copy=v=>structuredClone(v),fail=message=>{throw Error(message);};
export function safeKey(value){if(typeof value!=='string'||! /^[A-Za-z0-9_-]{1,100}$/.test(value))fail('Invalid identifier');return value;}
export function cleanName(value,max=40){const name=String(value||'').trim();if(!name||[...name].length>max||/[\p{Cc}\p{Cf}]/u.test(name))fail('Invalid name');return name;}
export function cleanDeck(value){
 if(!value||!byId.has(value.avatar)||byId.get(value.avatar).type!=='Avatar')fail('Invalid avatar');
 const zone=(ids=[],site)=>{if(!Array.isArray(ids)||ids.length>200||ids.some(id=>!byId.has(id)||(site&&byId.get(id).type!=='Site')||byId.get(id).type==='Avatar'))fail('Invalid deck cards');return [...ids];};
 const d={name:cleanName(value.name),avatar:value.avatar,atlas:zone(value.atlas,true),spells:zone(value.spells,false)};if(value.dragon)d.dragon=safeKey(value.dragon);if(value.format==='beta-precon-2023'||value.format==='gothic-precon'){d.format=value.format;d.officialId=safeKey(value.officialId);}if(value.collection){if(!Array.isArray(value.collection)||value.collection.length>10||value.collection.some(id=>!byId.has(id)))fail('Invalid collection');d.collection=[...value.collection];}return d;
}
export function deckKey(value){const d=cleanDeck(value),text=JSON.stringify([d.avatar,[...d.atlas].sort(),[...d.spells].sort(),d.dragon||'',[...(d.collection||[])].sort()]);let hash=14695981039346656037n;for(const c of text)hash=BigInt.asUintN(64,(hash^BigInt(c.codePointAt(0)))*1099511628211n);return hash.toString(16).padStart(16,'0');}
function counter(){return {games:0,wins:0,losses:0,draws:0};}
function count(c,result){c.games++;c[result==='win'?'wins':result==='loss'?'losses':'draws']++;}
export function summarize(account,now){
 const out={displayName:account.profile.displayName,updatedAt:now,...counter(),avatars:{},decks:{},cards:{},publicGames:0};
 for(const entry of Object.values(account.decks||{}))if(entry.published===true){const key=deckKey(entry.deck);out.decks[key]??={key,deck:copy(entry.deck),...counter()};}
 for(const r of Object.values(account.records||{})){
  if(r.deleted)continue;count(out,r.result);const av=out.avatars[r.deck.avatar]??=counter();count(av,r.result);
  const d=out.decks[r.deckKey];if(!d)continue;count(d,r.result);out.publicGames++;
  const counts={};for(const id of [...r.deck.atlas,...r.deck.spells])counts[id]=(counts[id]||0)+1;
  for(const [id,n]of Object.entries(counts)){const c=out.cards[id]??={games:0,copies:0,wins:0};c.games++;c.copies+=n;if(r.result==='win')c.wins++;}
 }
 return out;
}
export function hydrateAccount(current){if(!current)return null;const a=copy(current);a.decks||={};a.records||={};for(const d of Object.values(a.decks))d.deck=cleanDeck(d.deck);for(const r of Object.values(a.records))if(!r.deleted)r.deck=cleanDeck(r.deck);return a;}
export function mutateAccount(current,op,now){
 const a=hydrateAccount(current)||{profile:{displayName:'Traveler'},decks:{},records:{}};
 if(op.type==='profile')a.profile={displayName:cleanName(op.displayName,24)};
 else if(op.type==='deck-save'){const id=safeKey(op.id);if(!a.decks[id]&&Object.keys(a.decks).length>=100)fail('Cloud deck limit: 100');a.decks[id]={deck:cleanDeck(op.deck),published:op.published===true,updatedAt:now};}
 else if(op.type==='deck-delete')delete a.decks[safeKey(op.id)];
 else if(op.type==='record-save'){
  const id=safeKey(op.id),old=a.records[id];if(op.automatic&&old)return a; // Tombstones prevent a deleted result returning on reconnect.
  if(!['win','loss','draw'].includes(op.result))fail('Invalid result');
  const deck=cleanDeck(op.deck);if(validateDeck(deck).length)fail('Match requires a legal deck');
  if(!old&&Object.keys(a.records).length>=2000)fail('Match history limit: 2000');
  a.records[id]={result:op.result,deck,deckKey:deckKey(deck),source:old?.source|| (op.automatic?'online':'manual'),corrected:!!old&&!op.automatic,createdAt:old?.createdAt||now,updatedAt:now,deleted:false};
 }
 else if(op.type==='record-delete'){const id=safeKey(op.id);if(a.records[id])a.records[id]={deleted:true,updatedAt:now};}
 else fail('Invalid operation');
 a.public=summarize(a,now);return a;
}
export function onlineRecord(room,uid){
 if(room?.meta?.status!=='ended')return null;const seat=room.meta.host===uid?0:room.meta.guest===uid?1:null;if(seat===null)return null;
 const r=JSON.parse(room.payload);if(r.status!=='ended'||![0,1].includes(r.state?.winner)||!r.decks?.[seat])return null;
 return {type:'record-save',id:`online_${r.id}_${r.createdAt}`,automatic:true,deck:r.decks[seat],result:r.state.winner===seat?'win':'loss'};
}
export function rankCommunity(entries,{kind='players',sort='popular',zone='all',minGames=5}={}){
 const rows=[],avatars=new Map(),decks=new Map(),cards=new Map();let publicGames=0,totalGames=0;
 for(const [uid,s]of Object.entries(entries||{})){
  if(!s?.displayName)continue;totalGames+=s.games||0;publicGames+=s.publicGames||0;
  rows.push({id:uid,name:s.displayName,games:s.games||0,wins:s.wins||0,losses:s.losses||0,draws:s.draws||0});
  for(const [id,c]of Object.entries(s.avatars||{})){if(byId.get(id)?.type!=='Avatar')continue;const row=avatars.get(id)||{id,...counter()};for(const k of ['games','wins','losses','draws'])row[k]+=c[k]||0;avatars.set(id,row);}
  for(const [id,c]of Object.entries(s.decks||{})){let deck;try{deck=cleanDeck(c.deck);if(id!==deckKey(deck))continue;}catch{continue;}const row=decks.get(id)||{id,deck,...counter(),users:0};for(const k of ['games','wins','losses','draws'])row[k]+=c[k]||0;row.users+=c.games>0?1:0;decks.set(id,row);}
  for(const [id,c]of Object.entries(s.cards||{})){if(!byId.has(id))continue;const row=cards.get(id)||{id,games:0,copies:0,wins:0};for(const k of ['games','copies','wins'])row[k]+=c[k]||0;cards.set(id,row);}
 }
 let list=kind==='players'?rows:kind==='avatars'?[...avatars.values()]:kind==='decks'?[...decks.values()]:[...cards.values()].filter(c=>zone==='all'||(byId.get(c.id)?.type==='Site')===(zone==='atlas'));
 list=list.filter(r=>r.games>0).map(r=>({...r,winRate:r.games?r.wins/r.games:0,usage:kind==='cards'?(publicGames?r.games/publicGames:0):kind==='avatars'?(totalGames?r.games/totalGames:0):0}));
 if(sort==='winrate')list=list.filter(r=>r.games>=minGames);
 list.sort((a,b)=>(sort==='winrate'?b.winRate-a.winRate:kind==='players'?b.wins-a.wins:b.games-a.games)||b.games-a.games||String(a.id).localeCompare(String(b.id)));
 return list;
}
