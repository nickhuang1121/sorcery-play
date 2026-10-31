import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {install} from '../src/cards.js';
import {dispatch,restoreGame} from '../src/engine.js';

test('production Google mobile match replays all 70 UI commands through Death’s Door to a natural ranged victory',()=>{
 install(JSON.parse(fs.readFileSync(new URL('../data/official-cards.json',import.meta.url))));
 const record=JSON.parse(fs.readFileSync(new URL('../data/online-google-mobile-natural-match.json',import.meta.url)));
 assert.equal(record.history.length,70);
 assert.equal(record.initialState.history.length,0);
 assert.ok(record.history.every(a=>a.type!=='concede'));
 assert.ok(record.history.some(a=>a.type==='defend'&&a.keep===false));
 const types=new Set(record.history.map(a=>a.type));
 for(const type of ['site','cast','choose','move','attack','defend','pass','ranged'])assert.ok(types.has(type),type);
 let state=restoreGame(record.initialState),atOffline,atDeathDoor;
 for(const [i,action] of record.history.entries()){
  state=dispatch(restoreGame(state),action);
  assert.equal(state.history.length,i+1,'UI command '+(i+1));
  if(i+1===record.observations.offline.commands)atOffline=structuredClone(state);
  if(i+2===record.observations.deathDoor.revision)atDeathDoor=structuredClone(state);
 }
 assert.equal(atOffline.turn,7);
 assert.equal(atOffline.winner,null);
 assert.deepEqual(atOffline.history,record.history.slice(0,30));
 assert.equal(atDeathDoor.turn,13);
 assert.deepEqual(atDeathDoor.players.map(p=>p.life),[20,0]);
 assert.equal(atDeathDoor.winner,null,'zero life first enters Death’s Door');
 assert.equal(atDeathDoor.players[1].doorTurn,13);
 assert.equal(state.history.at(-1).type,'ranged');
 assert.equal(state.winner,0);
 assert.equal(state.turn,15);
 assert.deepEqual(state.players.map(p=>p.life),[20,0]);
 assert.deepEqual(JSON.parse(JSON.stringify(state)),record.state);
});
