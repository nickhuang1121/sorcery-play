// Official gameplay metadata is preserved verbatim in data/official-cards.json.
import { definitions, passives } from './definitions.js';
import { equipment, areaAuras } from './objects.js';
import { operations } from './storyline.js';
import { officialBetaLists,betaPreconSource } from './beta-precons.js';
export const elements = ['air', 'earth', 'fire', 'water'];
export const hasElement=(c,e)=>c[e]>0||c.elements?.includes(e[0].toUpperCase()+e.slice(1));
export const limits = { Ordinary: 4, Exceptional: 3, Elite: 2, Unique: 1 };
export let cards = [];
export let byId = new Map();
export let bySlug = new Map();
export const special = {
  dark_tower: 'towerMana', gothic_tower: 'towerMana', lone_tower: 'towerMana',
  sorcerer: 'sorcerer', apprentice_wizard: 'drawSpell', alvalinne_dryads: 'mana',
  blacksmith_family: 'fireThreshold', lightning_bolt: 'lightning', zap: 'zap',
  arc_lightning: 'arc', immolation: 'immolation', divine_healing: 'heal',
  overpower: 'power2', gigantism: 'power6', gift_of_the_wolf: 'wolf',
  gift_of_the_serpent: 'serpent', charge: 'charge', fatality: 'fatality',
  all_mortals_gone: 'mortals', tithe: 'tithe', rescue: 'rescue',
  common_sense: 'searchOrdinary', teleport: 'teleport', minor_explosion: 'explosion',
  rain_of_arrows: 'rain', freeze: 'freeze', shrink: 'shrink',
  divine_intervention: 'intervention', invigorate: 'invigorate',
  vanishment: 'vanishment', power_of_flight: 'flight', necropotence: 'necropotence',
  begone: 'begone', mesmerism: 'mesmerism', betrayal: 'betrayal',
  cast_into_exile: 'exile', mortality: 'mortality', exorcism: 'exorcism', lifewish: 'lifewish',
};
const keywordText = /^(Airborne|Charge|Voidwalk|Burrowing|Submerge|Landbound|Waterbound|Ranged(?: \d)?|Immobile|Lethal|Spellcaster|Stealth|Ward|Movement \+\d|[\s,])+$/;
export function support(c) {
  if (c.category === 'Token') return { playable:false,status:['foot_soldier','frog','skeleton','lance','tawny','rubble','bruin'].includes(c.slug)?'部分支援':'未開始',handler:['foot_soldier','frog','skeleton','lance','tawny','rubble','bruin'].includes(c.slug)?'token':null };
  if (special[c.slug]) return { playable: true, status: '部分支援', handler: special[c.slug] };
  if (equipment[c.slug]||areaAuras[c.slug]) return {playable:true,status:'部分支援',handler:'object'};
  if (definitions[c.slug] || passives[c.slug]) return { playable:true, status:'部分支援', handler:'script' };
  if (['Minion', 'Site'].includes(c.type) && (!c.rules.trim() || (c.type === 'Minion' && keywordText.test(c.rules))))
    return { playable: c.category !== 'Token', status: '部分支援', handler: 'base' };
  return { playable: false, status: '未開始', handler: null };
}
export function install(raw) {
  for(const [slug,d] of Object.entries(definitions))for(const steps of [...['cast','genesis','death','start','end'].map(k=>d[k]||[]),...(d.activated||[]).map(a=>a.steps)])for(const step of steps)if(!operations.has(step.op))throw Error(slug+' 包含未實作的效果：'+step.op);
  cards = raw.map(c => ({ id: c.id, slug: c.slug, name: c.name, ...c.engine,
    rules: c.engine.rules || '', sets: [...new Set(c.printings.map(p => p.set.name))],
    printingId: c.printings.find(p => p.meta?.finish === 'Standard')?.id || c.printings[0]?.id || null,
    released: c.printings.some(p => p.printedAt <= '2026-10-29T23:59:59.000Z') }));
  for (const c of cards){if(c.slug==='druid'){c.rulesBack=c.rules;c.rules='Tap \u2192 Play or draw a site. If this is your first turn, summon Tawny here.\nTap \u2192 Summon Bruin here. Flip this card.';}Object.assign(c, support(c));}
  byId = new Map(cards.map(c => [c.id, c])); bySlug = new Map(cards.map(c => [c.slug, c]));
  runtimeCard(bySlug.get('druid').id,'druid_back',{rules:bySlug.get('druid').rulesBack});
  runtimeCard(bySlug.get('horns_of_behemoth').id,'behemoth_demon',{type:'Minion',subtypes:['Demon'],umbrellas:['Evil'],rules:''});
  for(const c of cards){if(c.type==='Site')for(const kind of ['disabled_site','silenced_site','fate_site','sinterfee_site'])runtimeCard(c.id,kind,{runtimeMask:true,rules:'',...(kind==='disabled_site'||kind==='sinterfee_site'?{air:0,earth:0,fire:0,water:0}:kind==='fate_site'?{air:0,earth:0,fire:0,water:1}:{})});if(c.type==='Artifact')runtimeCard(c.id,'silenced_artifact',{runtimeMask:true,rules:''});}
  const island=bySlug.get('island_leviathan');byId.set('runtime:island_leviathan',{...island,id:'runtime:island_leviathan',slug:'island_leviathan_monster',type:'Minion',subtypes:['Monster'],rules:'',playable:false});
  return cards;
}
export function printedKeywords(c) {
  if(c.slug==='sewer_rats')return ['Burrowing','Submerge'];
  if(c.slug==='drowned')return ['Submerge'];
  const header=c.rules.split(/\r?\n|\bGenesis\b|\bDeathrite\b/)[0].trim();
  return ['Airborne','Charge','Voidwalk','Burrowing','Submerge','Landbound','Waterbound','Ranged','Immobile','Lethal','Spellcaster','Stealth','Ward','Lance'].filter(k=>!(c.slug==='zeppelin_of_zealots'&&k==='Airborne')&&new RegExp('(?:^|,\\s*)'+k+'(?:$|[, .]| \\+| \\d)').test(header));
}
export async function loadCards() {
  const r = await fetch(new URL('../data/official-cards.json', import.meta.url));
  if (!r.ok) throw Error('無法讀取本機卡牌資料：' + r.status);
  return install(await r.json());
}
export function card(id) { const c = byId.get(id) || bySlug.get(id); if (!c) throw Error('未知卡牌：' + id); return c; }
export function runtimeCard(base,kind,changes={}){
  const original=card(base),id='runtime:'+kind+':'+original.id;
  if(!byId.has(id))byId.set(id,{...original,id,slug:'__'+kind,playable:false,runtimeBase:original.id,...changes});
  return id;
}
export function validateDeck(d, requirePlayable = true) {
  const errors = []; const count = new Map();
  if(d?.collection!==undefined&&!Array.isArray(d.collection))errors.push('收藏區格式錯誤');
  const collection=Array.isArray(d?.collection)?d.collection:[];
  if(collection.length>10)errors.push('構築收藏區最多 10 張');
  const collectionCounts=new Map();
  for(const id of collection){const c=byId.get(id);if(!c||c.category==='Token'||c.runtimeMask){errors.push('收藏區包含無效卡牌');continue;}if(!c.released)errors.push(c.name+' 尚未發行');if(requirePlayable&&!c.playable)errors.push(c.name+' 尚未實作');collectionCounts.set(id,(collectionCounts.get(id)||0)+1);}
  for(const [id,n] of collectionCounts)if(n>(limits[card(id).slot]||0))errors.push(card(id).name+' 超出收藏區稀有度張數上限');
  if (!d || !Array.isArray(d.atlas) || !Array.isArray(d.spells)) return ['牌組格式錯誤'];
  const precon=d.format==='beta-precon-2023',sizes=deckSizes(d);
  if(precon&&!matchesOfficialBeta(d))errors.push('官方 BETA 預組必須與原表完全一致；修改後請轉為自組牌');
  if (d.atlas.length < sizes.atlas) errors.push('Atlas 至少需要 '+sizes.atlas+' 張地點');
  if (d.spells.length < sizes.spells) errors.push('Spellbook 至少需要 '+sizes.spells+' 張法術');
  const a = byId.get(d.avatar); if (!a || a.type !== 'Avatar') errors.push('必須選擇一位 Avatar');
  else if (requirePlayable && !a.playable) errors.push(a.name + ' 尚未支援');
  for (const [list, type] of [[d.atlas, 'Site'], [d.spells, 'Spell']]) for (const id of list) {
    const c = byId.get(id);
    if (!c) { errors.push('未知卡牌 ID：' + id); continue; }
    if ((type === 'Site' && c.type !== 'Site') || (type === 'Spell' && c.category !== 'Spell')) errors.push(c.name + ' 的牌庫類型錯誤');
    if (!c.released) errors.push(c.name + ' 尚未發售');
    if (requirePlayable && !c.playable) errors.push(c.name + ' 的效果尚未實作');
    count.set(id, (count.get(id) || 0) + 1);
  }
  for (const [id, n] of count) if (!passives[card(id).slug]?.unlimited&&n > (limits[card(id).slot] ?? 0)) errors.push(card(id).name + ' 超過稀有度張數上限');
  return [...new Set(errors)];
}
export function deckSizes(d){return d?.format==='beta-precon-2023'?{atlas:16,spells:36}:{atlas:30,spells:60};}
export function officialBetaDecks(){
  return officialBetaLists.map(d=>({version:1,name:d.name,preset:'official-beta',format:'beta-precon-2023',officialId:d.id,source:betaPreconSource,sourceImage:'https://cdn.sanity.io/images/vg9ve3gy/production/'+d.image,
    description:'官方 2023 BETA 預組原表：36 張 Spellbook、16 張 Atlas、1 位 Avatar。',
    avatar:card(d.avatar).id,spells:Object.entries(d.spells).flatMap(([slug,n])=>Array(n).fill(card(slug).id)),atlas:Object.entries(d.atlas).flatMap(([slug,n])=>Array(n).fill(card(slug).id)),
  }));
}
export function matchesOfficialBeta(d){
  if(d?.format!=='beta-precon-2023')return false;
  const original=officialBetaDecks().find(p=>p.officialId===d.officialId),same=(a,b)=>Array.isArray(a)&&a.length===b.length&&[...a].sort().every((id,i)=>id===[...b].sort()[i]);
  return !!original&&d.avatar===original.avatar&&same(d.atlas,original.atlas)&&same(d.spells,original.spells);
}
export function starter(kind = 'earth') {
  const earth = ['wild_boars','eltham_townsfolk','bosk_troll','brown_bears','amazon_warriors','penitent_knight','autumn_unicorn','plumed_pegasus','wyvern','alvalinne_dryads','overpower','gift_of_the_wolf','gigantism','common_sense','divine_healing','holy_warrior','rescue'];
  const fire = ['raal_dromedary','hellhounds','ogre_goons','wild_fanatic','highland_clansmen','petrosian_cavalry','ravenous_werewolf','sirocco_scorpions','immolation','charge','wild_boars','bosk_troll','amazon_warriors','overpower','gift_of_the_wolf','gigantism','penitent_knight','divine_healing'];
  const ids = (kind === 'earth' ? earth : fire).map(s => bySlug.get(s)).filter(c => c?.playable);
  const spells = ids.flatMap(c => Array(limits[c.slot]).fill(c.id));
  // Fill with other implemented spells if the curated list is not large enough.
  for (const c of cards.filter(c => c.playable && c.category === 'Spell')) {
    while (spells.length < 60 && spells.filter(id => id === c.id).length < limits[c.slot]) spells.push(c.id);
    if (spells.length >= 60) break;
  }
  const sites = ['valley','wasteland','fertile_earth','active_volcano','steppe','windmill','aqueduct','ruins','oasis','mountain_peaks','deep_sea','lighthouse','spire','stream'];
  const atlas = sites.flatMap(s => { const c = card(s); return Array(limits[c.slot]).fill(c.id); }).slice(0,30);
  return { version: 1, name: kind === 'earth' ? '翡翠軍勢 · Earth & Fire' : '燼火先鋒 · Fire & Earth', avatar: card('sorcerer').id, atlas, spells: spells.slice(0,60) };
}

// Explicit, reproducible lists: every card has a Beta printing. These are custom
// ready-to-play decks, not the official four Beta preconstructed deck lists.
export function betaDecks() {
  const atlas = ['aqueduct','lighthouse','oasis','ruins','steppe','windmill']
    .flatMap(slug => Array(3).fill(card(slug).id))
    .concat(['dark_tower','gothic_tower','lone_tower'].flatMap(slug => Array(4).fill(card(slug).id)));
  const lists = [
    { name: 'BETA · 大地燼火', list: {
      wild_boars:4, bosk_troll:4, alvalinne_dryads:4, amazon_warriors:4,
      autumn_unicorn:3, overpower:4, common_sense:4, gigantism:1, divine_healing:3,
      raal_dromedary:4, ogre_goons:4, petrosian_cavalry:4, sirocco_scorpions:4,
      minor_explosion:4, immolation:1, plumed_pegasus:4, snow_leopard:4,
    } },
    { name: 'BETA · 風暴軍勢', list: {
      snow_leopard:4, cloud_spirit:4, apprentice_wizard:4, dead_of_night_demon:4,
      spectral_stalker:4, plumed_pegasus:4, gyre_hippogriffs:3, peregrine_apparition:3,
      highland_clansmen:4, lightning_bolt:4, rain_of_arrows:4, teleport:4,
      mortality:4, shrink:3, swamp_buffalo:4, divine_healing:3,
    } },
  ];
  return lists.map(({name,list}) => ({ version:1, name, preset:'beta',
    description:'BETA 系列自組預設，非官方預組原表；使用目前引擎支援的卡牌。',
    avatar:card('sorcerer').id, atlas:[...atlas],
    spells:Object.entries(list).flatMap(([slug,count]) => Array(count).fill(card(slug).id)),
  }));
}
