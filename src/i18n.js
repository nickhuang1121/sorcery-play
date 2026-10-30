/** Card face translations (ZH). JP not shipped yet. */
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
  if(c?.slug==='druid'&&lang==='zh')return '橫置 → 打出或抽取一張地點。若這是你的第一個回合，在此召喚 Tawny。\n橫置 → 在此召喚 Bruin，然後翻面。';
  if(c?.slug==='__druid_back'&&lang==='zh')return '橫置 → 打出或抽取一張地點。\n附近友方地點具有「每當敵人進入此處，對其造成 1 點傷害」。';
  if (!c) return '—';
  if (lang !== 'zh') return c.rules || '—';
  const row = byName.get(c.name);
  return (row?.rulesTextZh || c.rules || '—');
}

export function hasZh(c) {
  return !!byName.get(c?.name)?.nameZh;
}
