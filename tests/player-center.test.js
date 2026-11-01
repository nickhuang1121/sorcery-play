import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {install,officialBetaDecks} from '../src/cards.js';
import {mutateAccount} from '../src/community/model.js';
import {createCommunityService} from '../src/community/service.js';
import {playerSummary,localMatchResume,ownedRoomResume,playerCenterHTML} from '../src/community/player-center.js';
install(JSON.parse(fs.readFileSync(new URL('../data/official-cards.json',import.meta.url),'utf8')));
const deck=officialBetaDecks()[0];
const T=(_,en)=>en,E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
test('owner overview counts active records and only ranks explicitly published decks',()=>{
  let a=mutateAccount(null,{type:'profile',displayName:'Nickname'},1);
  a=mutateAccount(a,{type:'deck-save',id:'private',deck:{...deck,name:'Private strategy'},published:false},2);
  a=mutateAccount(a,{type:'deck-save',id:'public',deck,published:true},3);
  a=mutateAccount(a,{type:'record-save',id:'win',deck,result:'win'},4);
  a=mutateAccount(a,{type:'record-save',id:'loss',deck,result:'loss'},5);
  a=mutateAccount(a,{type:'record-delete',id:'loss'},6);
  const s=playerSummary(a,'owner',{owner:a.public});
  assert.deepEqual([s.games,s.wins,s.losses,s.winRate,s.rank],[1,1,0,100,1]);
  assert.equal(s.decks.length,2);assert.equal(s.rankedDecks.length,1);assert.equal(s.rankedDecks[0].rank,1);
  assert.equal(playerSummary(null,'owner',{}).rank,null);
});
test('resume requires live room membership, matching saved UID and a safe identifier',()=>{
  const saved={id:'ABC123',token:'owner'},meta={host:'owner',status:'playing'};
  assert.equal(ownedRoomResume(saved,'owner',meta).url,'./online-play.html?room=ABC123');
  assert.equal(ownedRoomResume(saved,'other',meta),null);
  assert.equal(ownedRoomResume(saved,'owner',{...meta,status:'ended'}),null);
  assert.equal(ownedRoomResume(saved,'owner',{...meta,host:'other'}),null);
  assert.equal(ownedRoomResume({...saved,id:'../bad'},'owner',meta),null);
  assert.equal(localMatchResume({version:1,players:[{},{}],winner:null}),'./battle.html');
  assert.equal(localMatchResume({version:1,players:[{},{}],winner:0}),null);
});
test('signed-out and loading views never display another account data; player names are escaped',()=>{
  const account={profile:{displayName:'<img onerror=alert(1)>'},decks:{private:{deck,published:false}},records:{}};
  const guest=playerCenterHTML({T,E,user:null,account,loaded:false});
  assert.ok(guest.includes('Sign in with Google'));assert.ok(!guest.includes(deck.name));assert.ok(!guest.includes('onerror'));
  const loading=playerCenterHTML({T,E,user:{uid:'owner'},account:null,loaded:false});
  assert.ok(loading.includes('Loading your data'));assert.ok(!loading.includes('No cloud decks'));
  const own=playerCenterHTML({T,E,user:{uid:'owner'},account,loaded:true});
  assert.ok(own.includes('&lt;img'));assert.ok(!own.includes('<img onerror'));assert.ok(own.includes('Private'));
});
test('room lookup requires the current authenticated owner and hides non-member rooms',async()=>{
  let uid='owner',reads=0,meta={host:'other',guest:'stranger',status:'playing'};
  const service=createCommunityService({uid:'owner',transport:{ensureAuth:async()=>({uid}),get:async path=>{reads++;assert.equal(path,'onlineRoomsV3/ABC123/meta');return meta;}}});
  assert.equal(await service.readRoomMeta('ABC123'),null);
  meta={host:'owner',status:'playing'};assert.equal((await service.readRoomMeta('ABC123')).host,'owner');
  uid='other';await assert.rejects(()=>service.readRoomMeta('ABC123'),/sign-in required/);assert.equal(reads,2);
});
