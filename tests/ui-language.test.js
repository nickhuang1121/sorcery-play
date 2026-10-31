import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {resolveUILanguage,normalizeLanguagePreference} from '../src/ui-language.js';
import {translateUI,registerUICardTranslations,protectUIStrings} from '../src/ui-copy.js';
import {english} from '../language/ui-catalog.js';
registerUICardTranslations(JSON.parse(fs.readFileSync(new URL('../language/cards-trans-zh.json',import.meta.url))));
test('device language uses the first supported preference with English fallback',()=>{
 for(const language of ['zh-TW','zh-HK','zh-Hant','zh-CN','zh'])assert.equal(resolveUILanguage('auto',[language]),'zh-Hant');
 for(const language of ['en-US','en-GB','en'])assert.equal(resolveUILanguage('auto',[language]),'en');
 assert.equal(resolveUILanguage('auto',['ja-JP','zh-TW','en-US']),'zh-Hant');
 assert.equal(resolveUILanguage('auto',['en-US','zh-TW']),'en');
 assert.equal(resolveUILanguage('auto',['ja-JP']),'en');assert.equal(resolveUILanguage('auto',[]),'en');
});
test('manual preference overrides device and invalid stored preferences recover automatically',()=>{
 assert.equal(resolveUILanguage('zh-Hant',['en-US']),'zh-Hant');assert.equal(resolveUILanguage('en',['zh-TW']),'en');
 assert.equal(normalizeLanguagePreference('zh'),'zh-Hant');assert.equal(normalizeLanguagePreference(null),'auto');assert.equal(normalizeLanguagePreference('junk'),'auto');
});
test('catalog entries are complete and translate exactly in English',()=>{
 for(const [zh,en] of Object.entries(english)){assert.ok(en,zh);assert.equal(translateUI(zh),en,zh);}
});
test('dynamic game UI preserves quantities, coordinates and card references',()=>{
 assert.equal(translateUI('各抽 3 張 Atlas 地點與 3 張 Spellbook 法術。你是先手，第一回合不抽牌。'),'Draw 3 sites from your Atlas and 3 spells from your Spellbook. You go first and skip your first turn’s draw.');
 assert.equal(translateUI('重抽 1 張'),'Redraw 1 card');assert.equal(translateUI('重抽 3 張'),'Redraw 3 cards');
 assert.equal(translateUI('手牌 7 · 展開'),'Hand 7 · Expand');
 assert.equal(translateUI('步兵（C2）受到 3 點傷害。'),'Foot Soldier (C2) takes 3 damage.');
 assert.equal(translateUI('步兵（C2）死亡 · 來源：Fireball。'),'Foot Soldier (C2) dies · Source: Fireball.');
 assert.equal(translateUI('灰燼賢者 · AI 放置 Red Desert。'),'Ashen Sage · AI plays Red Desert.');
});
test('card text comes from the authoritative language table in both directions',()=>{
 assert.equal(translateUI('簡樸村莊'),'Simple Village');assert.equal(translateUI('Simple Village','zh-Hant'),'簡樸村莊');
 const data=JSON.parse(fs.readFileSync(new URL('../language/cards-trans-zh.json',import.meta.url)));const row=data['Simple Village'];
 assert.equal(translateUI(row.rulesTextZh),row.rulesTextEng);assert.equal(translateUI(row.rulesTextEng,'zh-Hant'),row.rulesTextZh);
});
test('display translation leaves action payloads and user-authored names alone',()=>{
 const choice={title:'選擇單位',options:[{label:'步兵（C2）',value:{entity:'unit',uid:'u17'}}]};const before=structuredClone(choice);
 translateUI(choice.title);translateUI(choice.options[0].label);assert.deepEqual(choice,before);
 protectUIStrings(['我的地點收藏']);assert.equal(translateUI('我的地點收藏 · 牌組'),'我的地點收藏 · Decks');protectUIStrings([]);
});

test('official deck names do not repeat the element when the interface is Traditional Chinese',()=>{
 assert.equal(translateUI('BETA 官方預組 · 風 Air · Sparkmage','zh-Hant'),'BETA 官方預組 · 風 · 電光法師');
 assert.equal(translateUI('BETA 官方預組 · 地 Earth · Geomancer','zh-Hant'),'BETA 官方預組 · 地 · 地術師');
});
