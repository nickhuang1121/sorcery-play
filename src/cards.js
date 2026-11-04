import {sourceDeckErrors} from './ability-sources.js';
import {registerOrbCopyCards} from './final-orb.js';
import {registerBuiltSiteCards} from './final-built-sites.js';
import {finalAvatarDeckProfile} from './final-avatars.js';
import {prepareFinalUnitCards} from './final-units.js';
import {registerFinalArtifactCards} from './final-artifacts.js';
// Official gameplay metadata is preserved verbatim in data/official-cards.json.
import { definitions, passives } from './definitions.js';
import { equipment, areaAuras } from './objects.js';
import { operations } from './storyline.js';
import { officialBetaLists,betaPreconSource } from './beta-precons.js';
import { officialGothicLists,gothicPreconSource } from './gothic-precons.js';
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
  for (const c of cards){if(c.type==='Artifact'&&c.subtypes.includes('Automaton')){c.artifactUnit=true;c.type='Minion';}if(c.slug==='druid'){c.rulesBack=c.rules;c.rules='Tap \u2192 Play or draw a site. If this is your first turn, summon Tawny here.\nTap \u2192 Summon Bruin here. Flip this card.';}Object.assign(c, support(c));}
  // Official family FAQ ygoDG8fb7HS97qCW69pP1D: colored frames
  // establish element identity even though these spells need zero threshold.
  const familyElements={castle_servants:'Air',common_cottagers:'Earth',blacksmith_family:'Fire',fishermans_family:'Water'};
  for(const c of cards)if(familyElements[c.slug])c.elements=[...new Set([...(c.elements||[]).filter(e=>e!=='None'),familyElements[c.slug]])];
  // Official Skeleton Codex: Ordinary Undead Air minion, 1 power.
  // Element identity is not a casting threshold; tokens remain uncastable.
  for(const c of cards)if(c.slug==='skeleton'){c.subtypes=['Undead'];c.umbrellas=[...new Set([...c.umbrellas,'Evil'])];c.elements=['Air'];c.rarity='Ordinary';}
  byId = new Map(cards.map(c => [c.id, c])); bySlug = new Map(cards.map(c => [c.slug, c]));
  registerFinalArtifactCards(card,runtimeCard);
  registerBuiltSiteCards(card,runtimeCard);
  registerOrbCopyCards(cards,runtimeCard);
  prepareFinalUnitCards({card,runtimeCard});
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
  return ['Airborne','Charge','Voidwalk','Burrowing','Submerge','Landbound','Waterbound','Ranged','Immobile','Lethal','Spellcaster','Stealth','Ward','Lance'].filter(k=>!(c.slug==='zeppelin_of_zealots'&&k==='Airborne'||k==='Lethal'&&/(?:^|,\s*)Lethal\s+to\b/.test(header))&&new RegExp('(?:^|,\\s*)'+k+'(?:$|[, .]| \\+| \\d)').test(header));
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
  const preconBeta=d.format==='beta-precon-2023',preconGothic=d.format==='gothic-precon',sizes=deckSizes(d),avatarProfile=finalAvatarDeckProfile(byId.get(d.avatar));
  if(avatarProfile.noAtlas&&d.atlas.length)errors.push('Magician 沒有 Atlas，地點須放進 Spellbook');
  if(avatarProfile.uniqueAtlas&&new Set(d.atlas).size!==d.atlas.length)errors.push('Pathfinder 的 Atlas 不能含重複地點');
  if(preconBeta&&!matchesOfficialBeta(d))errors.push('官方 BETA 預組必須與原表完全一致；修改後請轉為自組牌');
  if(preconGothic&&!matchesOfficialGothic(d))errors.push('官方 GOTHIC 預組必須與原表完全一致；修改後請轉為自組牌');
  if (d.atlas.length < sizes.atlas) errors.push('Atlas 至少需要 '+sizes.atlas+' 張地點');
  if (d.spells.length < sizes.spells) errors.push('Spellbook 至少需要 '+sizes.spells+' 張法術');
  const a = byId.get(d.avatar); if (!a || a.type !== 'Avatar') errors.push('必須選擇一位 Avatar');
  else if (requirePlayable && !a.playable) errors.push(a.name + ' 尚未支援');
  for (const [list, type] of [[d.atlas, 'Site'], [d.spells, 'Spell']]) for (const id of list) {
    const c = byId.get(id);
    if (!c) { errors.push('未知卡牌 ID：' + id); continue; }
    if ((type === 'Site' && c.type !== 'Site') || (type === 'Spell' && c.category !== 'Spell' && !(avatarProfile.sitesInSpellbook&&c.type==='Site'))) errors.push(c.name + ' 的牌庫類型錯誤');
    if (!c.released) errors.push(c.name + ' 尚未發售');
    if (requirePlayable && !c.playable) errors.push(c.name + ' 的效果尚未實作');
    count.set(id, (count.get(id) || 0) + 1);
  }
  const paired=byId.get(d.avatar)?.slug==='duplicator';
  if(paired)for(const [id,n] of count)if(card(id).slot!=='Unique'||n!==2)errors.push(card(id).name+'：Duplicator 牌庫只允許成對 Unique');
  if(paired)for(const id of collection)if(count.has(id))errors.push(card(id).name+' 已在 Duplicator 牌庫中，不能再加入收藏區');
  for (const [id, n] of count) if (!(paired&&card(id).slot==='Unique'&&n===2)&&!passives[card(id).slug]?.unlimited&&n > (limits[card(id).slot] ?? 0)) errors.push(card(id).name + ' 超過稀有度張數上限');
  if(a&&a.type==='Avatar')errors.push(...sourceDeckErrors(d,{card}));
  return [...new Set(errors)];
}
export function deckSizes(d){if(finalAvatarDeckProfile(byId.get(d?.avatar)).noAtlas)return {atlas:0,spells:60};return d?.format==='beta-precon-2023'||d?.format==='gothic-precon'?{atlas:16,spells:36}:{atlas:30,spells:60};}
function officialListDeck(d,{preset,format,source,description}){
  const copies=obj=>Object.entries(obj).flatMap(([slug,n])=>Array(n).fill(card(slug).id));
  return {version:1,name:d.name,preset,format,officialId:d.id,source:d.source||source,...(d.image?{sourceImage:'https://cdn.sanity.io/images/vg9ve3gy/production/'+d.image}:{}),
    description,avatar:card(d.avatar).id,spells:copies(d.spells),atlas:copies(d.atlas),...(d.collection?{collection:copies(d.collection)}:{}),
  };
}
export function officialBetaDecks(){
  return officialBetaLists.map(d=>officialListDeck(d,{preset:'official-beta',format:'beta-precon-2023',source:betaPreconSource,description:'官方 2023 BETA 預組原表：36 張 Spellbook、16 張 Atlas、1 位 Avatar。'}));
}
export function officialGothicDecks(){
  return officialGothicLists.map(d=>officialListDeck(d,{preset:'official-gothic',format:'gothic-precon',source:gothicPreconSource,description:'官方 Gothic Prophets of Doom 預組原表：36 張 Spellbook、16 張 Atlas、1 位 Avatar。'}));
}
export function officialPreconDecks(){return [...officialBetaDecks(),...officialGothicDecks()];}
function sameIds(a,b){return Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&[...a].sort().every((id,i)=>id===[...b].sort()[i]);}
export function matchesOfficialBeta(d){
  if(d?.format!=='beta-precon-2023')return false;
  const original=officialBetaDecks().find(p=>p.officialId===d.officialId);
  return !!original&&d.avatar===original.avatar&&sameIds(d.atlas,original.atlas)&&sameIds(d.spells,original.spells);
}
export function matchesOfficialGothic(d){
  if(d?.format!=='gothic-precon')return false;
  const original=officialGothicDecks().find(p=>p.officialId===d.officialId);
  return !!original&&d.avatar===original.avatar&&sameIds(d.atlas,original.atlas)&&sameIds(d.spells,original.spells)&&sameIds(d.collection||[],original.collection||[]);
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
