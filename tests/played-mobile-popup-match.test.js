// Exported from a new 390×844 official Earth vs Fire game played through the UI.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {install,officialBetaDecks,card} from '../src/cards.js';import {dispatch,legalActions} from '../src/engine.js';import {createPlayableMatch} from '../src/match-setup.js';
install(JSON.parse(fs.readFileSync(new URL('../data/official-cards.json',import.meta.url))));
const replay=JSON.parse(fs.readFileSync(new URL('../data/mobile-popup-played-match.json',import.meta.url)));
function opening(){const d=officialBetaDecks(),s=createPlayableMatch([d[1],d[2]],replay.seed,'ai');s.aiDifficulty=replay.state.aiDifficulty;s.aiOmniscient=replay.state.aiOmniscient;return s;}
// Preserve the original recording as evidence. Action 7 used a secondary
// Avatar ability while a playable Site was in hand and the Avatar was in void.
// The Mandatory Actions Codex now correctly rejects that historical action.
function beforeInvalidOpening(){let s=opening();for(const a of replay.history.slice(0,7))s=dispatch(s,a);return s;}
test('Historical mobile popup recording rejects its formerly permitted illegal void-Avatar opening',()=>{
 const s=beforeInvalidOpening(),before=JSON.stringify(s);assert.equal(replay.history.length,77);
 assert.equal(replay.history[7].type,'activate');assert.throws(()=>dispatch(s,replay.history[7]));assert.equal(JSON.stringify(s),before);
 assert.ok(legalActions(s,1).some(a=>a.type==='site'&&a.at===2));assert.ok(legalActions(s,1).every(a=>a.type==='site'&&a.at===2||a.type==='concede'));
});
test('Correcting that opening places a Site beneath the Avatar and then resumes ordinary turn actions',()=>{
 let s=beforeInvalidOpening();const placement=legalActions(s,1).find(a=>a.type==='site'&&a.at===2);assert.ok(placement);s=dispatch(s,placement);
 while(s.choice)s=dispatch(s,{type:'choose',player:s.choice.player,option:0});
 assert.equal(s.board[2].controller,1);assert.ok(legalActions(s,1).some(a=>a.type==='end'));
});
