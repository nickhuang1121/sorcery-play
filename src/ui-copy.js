import {english,chineseStatic} from '../language/ui-catalog.js';
const escape=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const names={en:new Map(),zh:new Map()},rules={en:new Map(),zh:new Map()};
let protectedTerms=[],cardPatterns={},englishPattern,version=0;
const normalized=text=>text.replace(/\s+/g,' ').trim();
const enPairs=Object.entries(english).filter(([key])=>key.length>1).sort((a,b)=>b[0].length-a[0].length);
const zhPairs=Object.entries(chineseStatic).sort((a,b)=>b[0].length-a[0].length);
const zhPattern=new RegExp(`(^|[^A-Za-z])(${zhPairs.map(([key])=>escape(key)).join('|')})(?=$|[^A-Za-z])`,'g');
const reversed=new Map(Object.entries(english).map(([zh,en])=>[en,zh]));
export function registerUICardTranslations(data){
 for(const [en,row] of Object.entries(data)){
  if(row.nameZh){names.en.set(row.nameZh,en);names.zh.set(en,row.nameZh);}
  if(row.rulesTextEng&&row.rulesTextZh){rules.en.set(normalized(row.rulesTextZh),row.rulesTextEng);rules.zh.set(normalized(row.rulesTextEng),row.rulesTextZh);}
 }
 version++;cardPatterns={};englishPattern=null;
}
export function protectUIStrings(terms){protectedTerms=[...new Set(terms.filter(Boolean).map(String))].sort((a,b)=>b.length-a.length);}
function cardReferences(text,lang){
 if(!cardPatterns[lang]){const keys=[...names[lang].keys()].sort((a,b)=>b.length-a.length);cardPatterns[lang]=keys.length?new RegExp(`(^|[^A-Za-z0-9])(${keys.map(escape).join('|')})(?=$|[^A-Za-z0-9])`,'g'):null;}
 return cardPatterns[lang]?text.replace(cardPatterns[lang],(_,prefix,name)=>prefix+names[lang].get(name)):text;
}
// Match card references and UI phrases together, longest first. A word inside a
// longer UI phrase (e.g. Fatality in “suffers a lethal blow”) is not a card name.
function englishReferences(text){
 if(!englishPattern){const keys=[...new Set([...enPairs.map(([key])=>key),...names.en.keys()])].sort((a,b)=>b.length-a.length);englishPattern=new RegExp(keys.map(escape).join('|'),'g');}
 return text.replace(englishPattern,key=>english[key]??names.en.get(key));
}
export function translateUI(value,locale='en'){
 const original=String(value??''),lang=locale==='en'?'en':'zh';
 if(!original.trim())return original;
 // Card names and complete printed rules have authoritative translations.
 const core=original.trim(),spaceLeft=original.match(/^\s*/)[0],spaceRight=original.match(/\s*$/)[0];
 if(lang==='en'&&english[core])return spaceLeft+english[core]+spaceRight;
 if(names[lang].has(core))return spaceLeft+names[lang].get(core)+spaceRight;
 if(rules[lang].has(normalized(core)))return spaceLeft+rules[lang].get(normalized(core))+spaceRight;
 if(lang==='zh'){
  if(reversed.has(core))return spaceLeft+reversed.get(core)+spaceRight;
  return cardReferences(original.replace(/(BETA 官方預組 · [風地火水]) (?:Air|Earth|Fire|Water)(?= ·)/g,'$1'),lang).replace(zhPattern,(_,prefix,key)=>prefix+chineseStatic[key]);
 }
 if(english[core])return spaceLeft+english[core]+spaceRight;
 const tr=text=>translateUI(text,'en'),subject=name=>tr(name),verb=(actor,base,third)=>actor==='You'?base:third;let match;
 if((match=core.match(/^(點選高亮處|請完成效果選擇|對手行動|等待對手回應) · (.+)$/)))return `${tr(match[1])} · ${tr(match[2])}`;
 if((match=core.match(/^(.+) 抽取一張(地點|法術)牌。$/))){const actor=subject(match[1]);return `${actor} ${verb(actor,'draw','draws')} a ${match[2]==='地點'?'site':'spell'}.`;}
 if((match=core.match(/^(.+) 放置 (.+)。$/))){const actor=subject(match[1]);return `${actor} ${verb(actor,'play','plays')} ${tr(match[2])}.`;}
 if((match=core.match(/^(.+)（([A-E][1-4])( · 下層)?）召喚進場。$/)))return `${tr(match[1])} (${match[2]}${match[3]?' · Below':''}) enters the battlefield.`;
 if((match=core.match(/^(.+) 獲勝$/))){const actor=subject(match[1]);return `${actor} ${verb(actor,'win','wins')}`;}
 if((match=core.match(/^(.+) 取得領域$/))){const actor=subject(match[1]);return `${actor} ${verb(actor,'claim','claims')} the realm`;}
 if((match=core.match(/^(.+)：(.+) 攻擊 (.+)。$/))){const target=match[3].replace(/^地點 ([A-E][1-4])$/,'site $1');return `${tr(match[1])}: ${tr(match[2])} attacks ${tr(target)}.`;}
 if((match=core.match(/^(.+)：(.+) 加入(防禦|攔截)。$/)))return `${tr(match[1])}: ${tr(match[2])} joins the ${match[3]==='防禦'?'defense':'interception'}.`;
 if((match=core.match(/^(.+) 效果結算。$/)))return `${tr(match[1])} resolves.`;
 if((match=core.match(/^(.+) 遭受致命一擊。$/))){const actor=subject(match[1]);return `${actor} ${verb(actor,'suffer','suffers')} a lethal blow.`;}
 if((match=core.match(/^抽 (\d+) 張牌：先宣告 Atlas／Spellbook 張數$/)))return `Draw ${match[1]} card${match[1]==='1'?'':'s'}: choose how many from Atlas and Spellbook`;
 if((match=core.match(/^各抽 (\d+) 張 Atlas 地點與 (\d+) 張 Spellbook 法術。/)))return `Draw ${match[1]} sites from your Atlas and ${match[2]} spells from your Spellbook. `+tr(core.slice(match[0].length));
 if((match=core.match(/^(.+)：(.+) 向([北東南西])遠程射擊。$/)))return `${tr(match[1])}: ${tr(match[2])} fires ${({北:'north',東:'east',南:'south',西:'west'})[match[3]]}.`;
 if((match=core.match(/^重抽 (\d+) 張$/)))return `Redraw ${match[1]} card${match[1]==='1'?'':'s'}`;
 if((match=core.match(/^(.+) · 手牌 (\d+)$/)))return `${tr(match[1])} · Hand ${match[2]}`;
 if((match=core.match(/^手牌 (\d+) · (展開|收起)$/)))return `Hand ${match[1]} · ${match[2]==='展開'?'Expand':'Collapse'}`;
 if((match=core.match(/^對手隱藏手牌 (\d+) 張$/)))return `Opponent’s hidden hand: ${match[1]} cards`;
 if((match=core.match(/^牌組內 (\d+) 張$/)))return `${match[1]} copies in deck`;
 if((match=core.match(/^(.+)（([A-E][1-4])）受到 (\d+) 點傷害。$/)))return `${tr(match[1])} (${match[2]}) takes ${match[3]} damage.`;
 if((match=core.match(/^(.+)（([A-E][1-4])）死亡(.*)。$/)))return `${tr(match[1])} (${match[2]}) dies${tr(match[3])}.`;
 if((match=core.match(/^(.+) 生命 ([+\-]?\d+)（(\d+) → (\d+)）。$/)))return `${tr(match[1])} life ${match[2]} (${match[3]} → ${match[4]}).`;
 if((match=core.match(/^遠程射擊 · ([北東南西])$/)))return `Ranged attack · ${({北:'North',東:'East',南:'South',西:'West'})[match[1]]}`;
 if((match=core.match(/^特效：(開|關)$/)))return `Effects: ${match[1]==='開'?'On':'Off'}`;
 if((match=core.match(/^BETA 官方預組 · [風地火水] (Air|Earth|Fire|Water) · (.+)$/)))return `Official Beta · ${match[1]} · ${match[2]}`;
 if((match=core.match(/^選擇單位（最多 (\d+) 位）$/)))return `Choose units (up to ${match[1]})`;
 if((match=core.match(/^(.+)：分配給 (.+)（剩餘 (\d+) 傷害）$/)))return `${tr(match[1])}: assign damage to ${tr(match[2])} (${match[3]} remaining)`;
 if((match=core.match(/^(.+) 的回合開始。$/))){const actor=subject(match[1]);return actor==='You'?'Your turn begins.':`${actor}’s turn begins.`;}
 const held=[];let text=original;
 for(const term of protectedTerms)text=text.split(term).join(`\uE000${held.push(term)-1}\uE001`);
 text=englishReferences(text);
 text=text.replace(/(^|[^\p{L}\p{N}])你(?=$|[^\p{L}\p{N}])/gu,'$1You');
 text=text.replace(/(\d+) 張\b/g,'$1 cards').replace(/(\d+) 張/g,'$1 cards').replace(/(\d+) 位/g,'$1 units').replace(/(\d+) 點/g,'$1 points');
 text=text.replace(/「/g,'“').replace(/」/g,'”').replace(/（/g,' (').replace(/）/g,')').replace(/。/g,'.').replace(/，/g,', ').replace(/：/g,': ').replace(/；/g,'; ');
 // Keep untouched user names, deck names and pasted data literal.
 return text.replace(/\uE000(\d+)\uE001/g,(_,i)=>held[Number(i)]);
}
export function uiTranslationVersion(){return version;}
