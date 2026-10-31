// A complete 390×844 match played through the English UI, with language switches.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {install,officialBetaDecks,card} from '../src/cards.js';import {dispatch} from '../src/engine.js';import {createPlayableMatch} from '../src/match-setup.js';import {battleNoticeEvents} from '../src/battle-notices.js';
import {translateUI,registerUICardTranslations} from '../src/ui-copy.js';
install(JSON.parse(fs.readFileSync(new URL('../data/official-cards.json',import.meta.url))));
registerUICardTranslations(JSON.parse(fs.readFileSync(new URL('../language/cards-trans-zh.json',import.meta.url))));
const replay=JSON.parse(fs.readFileSync(new URL('../data/english-mobile-played-match.json',import.meta.url)));
function opening(){const d=officialBetaDecks(),s=createPlayableMatch([d[1],d[2]],replay.seed,'ai');s.aiDifficulty=replay.state.aiDifficulty;s.aiOmniscient=replay.state.aiOmniscient;return s;}
test('All 119 English mobile UI actions replay from official Beta decks to the identical natural victory',()=>{
 let s=opening();assert.equal(s.phase,'mulligan');assert.equal(replay.history.length,119);assert.ok(!replay.history.some(a=>a.type==='concede'));
 const types=new Set(replay.history.map(a=>a.type));for(const type of ['mulligan','draw','site','cast','choose','move','ranged','attack','defend','activate','activateSite','pushBoulder'])assert.ok(types.has(type),type);
 for(const [i,a] of replay.history.entries()){try{s=dispatch(s,a);}catch(e){assert.fail(`Played UI action ${i}: ${e.message}`);}}
 assert.equal(s.turn,19);assert.equal(s.winner,0);assert.deepEqual(s.players.map(p=>p.life),[14,0]);assert.deepEqual(JSON.parse(JSON.stringify(s)),replay.state);
});
test('Every notice, effect title and choice label encountered in the real match has complete English copy',()=>{
 let s=opening();const copy=new Set();for(const a of replay.history){const next=dispatch(s,a);for(const n of battleNoticeEvents(s,next,a,card))copy.add(n.text);if(next.choice){copy.add(next.choice.title);copy.add('請完成效果選擇 · '+next.choice.title);for(const o of next.choice.options)copy.add(o.label);}s=next;}
 assert.ok(copy.size>=158);for(const source of copy)assert.doesNotMatch(translateUI(source),/[\u3400-\u9fff]/,source);
});
test('Observed English notices and choice headings use complete sentences and distinguish card names from UI words',()=>{
 const cases={
 '請完成效果選擇 · 抽 1 張牌：先宣告 Atlas／Spellbook 張數':'Complete the effect choice · Draw 1 card: choose how many from Atlas and Spellbook',
 '對手行動 · 你 的回合開始。':'Opponent action · Your turn begins.',
 '你 抽取一張法術牌。':'You draw a spell.',
 '你 抽取一張地點牌。':'You draw a site.',
 '灰燼賢者 · AI 抽取一張法術牌。':'Ashen Sage · AI draws a spell.',
 '你 放置 Red Desert。':'You play Red Desert.',
 '灰燼賢者 · AI 放置 Red Desert。':'Ashen Sage · AI plays Red Desert.',
 '你 的回合開始。':'Your turn begins.',
 'Foot Soldier（C1）召喚進場。':'Foot Soldier (C1) enters the battlefield.',
 'Foot Soldier（C1 · 下層）召喚進場。':'Foot Soldier (C1 · Below) enters the battlefield.',
 'Bury · 施放前選擇（費用 3）':'Bury · Choose before casting (Cost 3)',
 'Geomancer · 啟動前選擇':'Geomancer · Choose before activation',
 'Wildfire · 移往未經過的位置':'Wildfire · Move to an unvisited location',
 '抽 1 張牌：先宣告 Atlas／Spellbook 張數':'Draw 1 card: choose how many from Atlas and Spellbook',
 '你：Belmotte Longbowmen 攻擊 地點 C4。':'You: Belmotte Longbowmen attacks site C4.',
 '灰燼賢者 · AI：Rimland Nomads 加入防禦。':'Ashen Sage · AI: Rimland Nomads joins the defense.',
 '你 取得領域':'You claim the realm',
 '你 獲勝':'You win',
 '灰燼賢者 · AI 遭受致命一擊。':'Ashen Sage · AI suffers a lethal blow.',
 '紀錄 · 灰燼賢者 · AI 遭受致命一擊。':'Log · Ashen Sage · AI suffers a lethal blow.',
 '致命一擊':'Fatality',
 };
 for(const [source,expected] of Object.entries(cases))assert.equal(translateUI(source),expected,source);
});
