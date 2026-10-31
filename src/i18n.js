/** Card face translations (ZH). JP not shipped yet. */
import {projectRuleNote} from './project-rules.js';
let byName = new Map();
let lang = 'zh';

export function getLang() {
  return lang;
}

export function setLang(next) {
  lang = next === 'en' ? 'en' : 'zh';
  return lang;
}

export async function loadCardTranslations() {
  const r = await fetch(new URL('../language/cards-trans-zh.json', import.meta.url));
  if (!r.ok) throw Error('無法讀取中文翻譯：' + r.status);
  const data = await r.json();
  byName = new Map(Object.entries(data));
  return byName.size;
}

export function cardTitle(c) {
  if (!c) return '';
  if (lang !== 'zh') return c.name;
  const row = byName.get(c.name);
  return row?.nameZh || c.name;
}

export function cardRules(c) {
  if(c?.slug==='book_of_blessings')return lang==='zh'?'每當持有者施放選擇單一友方僕從的魔法時，給予該友軍Ward。目標也算選擇；敵方僕從不計入友軍數量。因此Duel選一友軍與一敵軍，友軍在戰鬥傷害前得到Ward。\nSymmetric Suffering先選完自己這一組，再同時犧牲、處理Deathrite，最後由對手匹配。':(c.rules+' Targets count as choices; only allied minions count. Duel wards its one allied minion before fight damage. Symmetric Suffering selects the complete own group before simultaneous sacrifice, Deathrites and the opponents matching choices.');
  if(c?.slug==='chaos_twister')return lang==='zh'
   ?'數位版替代規則（使用者指定）：從全部20個棋盤格隨機選一格，包含空格與虛空；不再吹牌或人工回報落點。結果只產生一次並保存。將目標隨從傳送到該格；若落在地點，對該地點地表上的每個單位（包括它自己）造成等同於其力量的傷害。原牌以實體吹落決定落點。'
   :'Digital replacement rule (user-selected): randomly choose one of all 20 board squares, including empty squares and void. Generate and save the result once; no physical blow or landing report. Teleport the target minion there; if it lands on a site, deal damage equal to its power to each unit atop that site, including itself. The printed card uses a physical blow to determine its landing.';
  if(c?.slug==='druid'&&lang==='zh')return '橫置 → 打出或抽取一張地點。若這是你的第一個回合，在此召喚 Tawny。\n橫置 → 在此召喚 Bruin，然後翻面。';
  if(c?.slug==='__druid_back'&&lang==='zh')return '橫置 → 打出或抽取一張地點。\n附近友方地點具有「每當敵人進入此處，對其造成 1 點傷害」。';
  if (!c) return '—';
  const row = byName.get(c.name);
  const text=lang==='zh'?(row?.rulesTextZh||c.rules||'—'):(c.rules||'—'),note=projectRuleNote(c.slug,lang);
  return text+(note?'\n'+note:'');
}

export function hasZh(c) {
  return !!byName.get(c?.name)?.nameZh;
}
