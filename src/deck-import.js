// Import decks from Curiosa / sorcerytcg.com text lists, deck URLs, or local JSON.
import { cards, byId, bySlug, officialBetaDecks, officialGothicDecks, matchesOfficialBeta, matchesOfficialGothic } from './cards.js';

const SECTION = /^(avatar|minion|magic|aura|artifact|site|spellbook|atlas|sideboard|maybeboard|tokens?)\b/i;
const QTY_NAME = /^\s*(\d+)\s*[x×]?\s+(.+?)\s*$/i;
const DECK_URL = /(?:curiosa\.io|sorcerytcg\.com)\/decks\/([a-z0-9]+)/i;

export function extractDeckId(text='') {
  const m = String(text).trim().match(DECK_URL);
  return m ? m[1] : (/^[a-z0-9]{20,}$/i.test(String(text).trim()) ? String(text).trim() : null);
}

function normName(s) {
  return String(s || '').normalize('NFKC').replace(/['’`]/g, "'").replace(/\s+/g, ' ').trim().toLowerCase();
}

function slugify(name) {
  return normName(name).replace(/'/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

export function findCardByName(name) {
  const n = normName(name);
  if (!n) return null;
  let hit = cards.find(c => normName(c.name) === n);
  if (hit) return hit;
  hit = bySlug.get(slugify(name));
  if (hit) return hit;
  // Soft match without punctuation.
  const soft = n.replace(/[^a-z0-9]+/g, '');
  return cards.find(c => normName(c.name).replace(/[^a-z0-9]+/g, '') === soft) || null;
}

function pushCopies(list, id, n) {
  for (let i = 0; i < n; i++) list.push(id);
}

function buildDeck({ name, avatar, atlas, spells, source, warnings = [], extras = {} }) {
  if (!avatar) throw Error('找不到 Avatar');
  return {
    version: 1,
    name: name || '匯入牌組',
    avatar,
    atlas: atlas || [],
    spells: spells || [],
    ...(source ? { importSource: source } : {}),
    ...(warnings.length ? { importWarnings: warnings } : {}),
    ...extras,
  };
}

function resolveRowCard(row) {
  const c = row?.card || {};
  return bySlug.get(c.slug) || byId.get(c.id) || byId.get(row.cardId) || findCardByName(c.name) || null;
}

function countsFromIds(ids) {
  const m = new Map();
  for (const id of ids) m.set(id, (m.get(id) || 0) + 1);
  return [...m.entries()];
}

/**
 * Official Curiosa / sorcerytcg.com deck JSON:
 * { name, id?, format?, decklist: [{ board, quantity, cardId?, printingId?, card: { id, name, slug, engine? } }] }
 * board: "Avatar" | "Main" (Sites & Spells both Main; type from card.engine)
 */
export function toOfficialDeckJson(deck) {
  const av = byId.get(deck.avatar);
  if (!av) throw Error('未知 Avatar');
  const decklist = [];
  const push = (board, id, quantity) => {
    const c = byId.get(id);
    if (!c) return;
    decklist.push({
      board,
      quantity,
      cardId: c.id,
      ...(c.printingId ? { printingId: c.printingId } : {}),
      card: {
        id: c.id,
        name: c.name,
        slug: c.slug,
        engine: {
          type: c.type,
          category: c.category,
        },
      },
    });
  };
  push('Avatar', av.id, 1);
  for (const [id, n] of countsFromIds(deck.spells)) push('Main', id, n);
  for (const [id, n] of countsFromIds(deck.atlas)) push('Main', id, n);
  for (const [id, n] of countsFromIds(deck.collection||[])) push('Collection', id, n);
  const out = {
    name: deck.name || 'Deck',
    decklist,
    ...(deck.dragon?{dragon:deck.dragon}:{}),
  };
  // Keep official-looking format label when we know it; beta precon stays annotated separately.
  if (deck.format === 'beta-precon-2023') out.format = 'Constructed';
  else if (typeof deck.format === 'string' && deck.format !== 'beta-precon-2023') out.format = deck.format;
  else out.format = 'Constructed';
  if (deck.officialId || deck.id) out.id = deck.officialId || deck.id;
  return out;
}

export function parseOfficialDeckJson(d, opts = {}) {
  if (!d || !Array.isArray(d.decklist)) throw Error('不是官方 decklist JSON');
  const atlas = [], spells = [], collection=[];
  let avatar = null;
  const warnings = [];
  const seen = new Set();
  for (const row of d.decklist) {
    if (!row) continue;
    if (/sideboard|maybe/i.test(row.board || '')) continue;
    // Some exports embed duplicates; keep first.
    const dedupe = `${row.board}|${row.card?.slug || row.cardId || row.card?.id}`;
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    const c = resolveRowCard(row);
    const qty = Math.max(0, Number(row.quantity) || 0);
    if (!c || !qty) {
      if (row.card?.name || row.card?.slug) warnings.push(`未知：${row.card?.name || row.card?.slug}`);
      continue;
    }
    if(row.board==='Collection'){pushCopies(collection,c.id,qty);continue;}
    if (row.board === 'Avatar' || c.type === 'Avatar') { avatar = c.id; continue; }
    if (c.type === 'Site' || c.category === 'Site') pushCopies(atlas, c.id, qty);
    else pushCopies(spells, c.id, qty);
  }
  const deck = buildDeck({
    name: String(d.name || opts.name || '官方牌組'),
    avatar,
    atlas,
    spells,
    source: 'official-json',
    warnings,
    extras: {...(d.dragon?{dragon:d.dragon}:{}),...(d.id ? { officialId: d.id, id: d.id } : {}),...(collection.length?{collection}:{})},
  });
  if (matchesOfficialBeta({ ...deck, format:'beta-precon-2023' })) {
    deck.format='beta-precon-2023';
    deck.preset='official-beta';
  } else if (matchesOfficialGothic({ ...deck, format:'gothic-precon' })) {
    deck.format='gothic-precon';
    deck.preset='official-gothic';
  }
  return deck;
}

function sameIds(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  const left = [...a].sort(), right = [...b].sort();
  return left.every((id, i) => id === right[i]);
}

/** Recognize a product precon by its cards. The public deck id is not our local id. */
function stampOfficial(deck) {
  for (const original of officialBetaDecks()) {
    if (deck.avatar === original.avatar && sameIds(deck.atlas, original.atlas) && sameIds(deck.spells, original.spells)) {
      deck.format = 'beta-precon-2023';
      deck.preset = 'official-beta';
      deck.officialId = original.officialId;
      return deck;
    }
  }
  for (const original of officialGothicDecks()) {
    const collection = deck.collection?.length ? deck.collection : (original.collection || []);
    if (deck.avatar === original.avatar && sameIds(deck.atlas, original.atlas) && sameIds(deck.spells, original.spells) && sameIds(collection, original.collection || [])) {
      deck.format = 'gothic-precon';
      deck.preset = 'official-gothic';
      deck.officialId = original.officialId;
      if (!deck.collection?.length && original.collection?.length) deck.collection = [...original.collection];
      return deck;
    }
  }
  return deck;
}

/**
 * Public deck API: GET https://api.sorcerytcg.com/api/decks/{id}
 * { name, id, avatar:[{identifier,name,quantity}], spellbook:[...], atlas:[...], sideboard:[...] }
 */
export function parseOfficialApiDeck(d) {
  if (!d || (!Array.isArray(d.avatar) && !Array.isArray(d.spellbook) && !Array.isArray(d.atlas))) throw Error('不是官方牌組資料');
  const avatarRow = (d.avatar || [])[0];
  const avatarCard = bySlug.get(avatarRow?.identifier) || findCardByName(avatarRow?.name);
  const atlas = [], spells = [], warnings = [];
  const place = row => {
    const qty = Math.max(0, Number(row?.quantity) || 0);
    const c = bySlug.get(row?.identifier) || findCardByName(row?.name);
    if (!c || !qty) {
      if (row?.name || row?.identifier) warnings.push(`未知：${row.name || row.identifier}`);
      return;
    }
    if (c.type === 'Avatar') return;
    if (c.type === 'Site' || c.category === 'Site') pushCopies(atlas, c.id, qty);
    else pushCopies(spells, c.id, qty);
  };
  for (const row of d.spellbook || []) place(row);
  for (const row of d.atlas || []) place(row);
  if ((d.sideboard || []).some(row => Number(row?.quantity) > 0)) warnings.push('已略過側牌');
  if (!avatarCard) throw Error(warnings.length ? '找不到 Avatar（另有未知卡名）' : '找不到 Avatar');
  if (!atlas.length && !spells.length) throw Error(warnings[0] || '沒有解析到 Spellbook／Atlas 卡牌');
  const id = d.id ? String(d.id) : '';
  return stampOfficial(buildDeck({
    name: String(d.name || '官方牌組'),
    avatar: avatarCard.id,
    atlas,
    spells,
    source: id ? `https://sorcerytcg.com/decks/${id}` : 'official-api',
    warnings,
    extras: id ? { id } : {},
  }));
}

/** Official decklist JSON, or the public deck API JSON. */
export function parseJsonDeck(text) {
  const d = typeof text === 'string' ? JSON.parse(text) : text;
  if (d && Array.isArray(d.decklist)) return parseOfficialDeckJson(d);
  if (Array.isArray(d) && d[0]?.board && d[0]?.card) return parseOfficialDeckJson({ name: '官方牌組', decklist: d });
  if (d && (Array.isArray(d.spellbook) || Array.isArray(d.atlas) || Array.isArray(d.avatar))) return parseOfficialApiDeck(d);
  throw Error('JSON 需為官方 decklist 格式（含 decklist[]）');
}

/**
 * Curiosa / official-style pasted text:
 *   Avatar (1)
 *   1 Necromancer
 *   Minion (4)
 *   4 Wild Boars
 *   Site (3)
 *   3 Valley
 */
export function parseTextDecklist(text, opts = {}) {
  const lines = String(text).replace(/\r/g, '').split('\n');
  let section = null;
  let title = opts.name || '';
  const atlas = [], spells = [];
  let avatar = null;
  const warnings = [];
  const unknown = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (/^https?:\/\//i.test(line) || extractDeckId(line)) continue;
    if (!title && !QTY_NAME.test(line) && !SECTION.test(line) && line.length < 80 && !/[{[]/.test(line)) {
      title = line.replace(/^#\s*/, '');
      continue;
    }
    const sec = line.match(SECTION);
    if (sec && !QTY_NAME.test(line)) {
      const key = sec[1].toLowerCase();
      section = key === 'atlas' || key === 'site' ? 'site'
        : key === 'avatar' ? 'avatar'
        : key === 'sideboard' || key === 'maybeboard' || key.startsWith('token') ? 'skip'
        : 'spell';
      continue;
    }
    const m = line.match(QTY_NAME);
    if (!m) continue;
    const qty = Math.max(0, Number(m[1]) || 0);
    let name = m[2].replace(/\s+\d+\s*$/, '').trim(); // drop trailing cost digits shown on some pages
    if (!qty || !name) continue;
    const c = findCardByName(name);
    if (!c) { unknown.push(`${qty} ${name}`); continue; }
    if (c.category === 'Token') { warnings.push(`略過衍生物：${c.name}`); continue; }
    if (c.type === 'Avatar' || section === 'avatar') {
      avatar = c.id;
      continue;
    }
    if (c.type === 'Site' || section === 'site') pushCopies(atlas, c.id, qty);
    else pushCopies(spells, c.id, qty);
  }

  if (unknown.length) warnings.push('未知卡牌：' + unknown.slice(0, 8).join('、') + (unknown.length > 8 ? '…' : ''));
  if (!avatar) throw Error(unknown.length ? '找不到 Avatar（另有未知卡名）' : '找不到 Avatar');
  if (!atlas.length && !spells.length) throw Error('沒有解析到 Spellbook／Atlas 卡牌');
  return buildDeck({ name: title || '文字牌表', avatar, atlas, spells, source: 'text', warnings });
}

/** Pull first embedded decklist rows from sorcerytcg.com / legacy Curiosa HTML. */
export function parseOfficialDeckHtml(html, opts = {}) {
  const re = /\\"board\\":\\"([^\\"]+)\\",\\"quantity\\":(\d+),\\"deckId\\":\\"([^\\"]+)\\",\\"cardId\\":\\"([^\\"]+)\\",\\"printingId\\":\\"([^\\"]+)\\",\\"card\\":\{\\"id\\":\\"([^\\"]+)\\",\\"name\\":\\"([^\\"]+)\\",\\"slug\\":\\"([^\\"]+)\\",\\"engine\\":\{\\"type\\":\\"([^\\"]+)\\",\\"category\\":\\"([^\\"]+)\\"/g;
  const rows = [];
  let m;
  while ((m = re.exec(html))) {
    rows.push({
      board: m[1],
      quantity: Number(m[2]),
      deckId: m[3],
      cardId: m[6],
      name: m[7],
      slug: m[8],
      type: m[9],
      category: m[10],
    });
  }
  if (!rows.length) throw Error('頁面中找不到牌表資料');

  // HTML often embeds the list twice; keep first unique board+slug.
  const seen = new Set();
  const unique = [];
  for (const row of rows) {
    if (row.board === 'Collection') continue;
    const key = `${row.board}|${row.slug}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(row);
  }

  const atlas = [], spells = [];
  let avatar = null;
  const warnings = [];
  for (const row of unique) {
    if (/sideboard|maybe/i.test(row.board)) continue;
    const c = bySlug.get(row.slug) || byId.get(row.cardId) || findCardByName(row.name);
    if (!c) { warnings.push(`未知：${row.name}`); continue; }
    if (row.board === 'Avatar' || c.type === 'Avatar') { avatar = c.id; continue; }
    if (c.type === 'Site' || c.category === 'Site') pushCopies(atlas, c.id, row.quantity);
    else pushCopies(spells, c.id, row.quantity);
  }

  const title = opts.name
    || (html.match(/<title>([^<]+)<\/title>/i)?.[1] || '').replace(/\s*\|\s*.*$/, '').trim()
    || '官方牌組';
  if (!avatar) throw Error('牌表中找不到 Avatar');
  return buildDeck({ name: title, avatar, atlas, spells, source: opts.source || 'official-html', warnings });
}

export async function fetchOfficialDeck(deckIdOrUrl) {
  const id = extractDeckId(deckIdOrUrl) || String(deckIdOrUrl || '').trim();
  if (!id) throw Error('無效的牌組連結');
  let response;
  try {
    response = await fetch(`https://api.sorcerytcg.com/api/decks/${encodeURIComponent(id)}`, { headers: { Accept: 'application/json' } });
  } catch {
    throw Error('無法連到官方牌組，請檢查網路後再試。');
  }
  if (response.status === 404) throw Error('找不到這副公開牌組。請確認連結，私人牌組無法匯入。');
  if (response.status === 429) throw Error('官方牌組查詢太頻繁，請稍後再試。');
  if (!response.ok) throw Error('無法下載牌組：HTTP ' + response.status);
  return parseOfficialApiDeck(await response.json());
}

/** Auto-detect JSON, URL, or text decklist. */
export async function importDeck(raw) {
  const text = String(raw || '').trim();
  if (!text) throw Error('請貼上牌組內容');

  if (text.startsWith('{') || text.startsWith('[')) {
    return parseJsonDeck(text);
  }

  const id = extractDeckId(text);
  if (id && text.split(/\s+/).length <= 3) {
    return fetchOfficialDeck(id);
  }

  // URL mixed with text: prefer text parse; if too thin, try URL.
  if (id && !QTY_NAME.test(text)) {
    try { return await fetchOfficialDeck(id); }
    catch (e) {
      // fall through to text if body also has lines
      if (!text.includes('\n')) throw e;
    }
  }

  return parseTextDecklist(text);
}

/** Human-readable export compatible with Curiosa-style paste. */
export function formatTextDecklist(deck) {
  const avatar = byId.get(deck.avatar);
  const count = (ids) => {
    const m = new Map();
    for (const id of ids) m.set(id, (m.get(id) || 0) + 1);
    return [...m.entries()];
  };
  const lines = [deck.name || 'Deck', '', `Avatar (1)`, `1 ${avatar?.name || deck.avatar}`, ''];
  const spells = count(deck.spells);
  const byType = new Map();
  for (const [id, n] of spells) {
    const c = byId.get(id);
    const t = c?.type || 'Spell';
    if (!byType.has(t)) byType.set(t, []);
    byType.get(t).push([c?.name || id, n]);
  }
  for (const [type, rows] of byType) {
    const total = rows.reduce((s, [, n]) => s + n, 0);
    lines.push(`${type} (${total})`);
    for (const [name, n] of rows.sort((a, b) => a[0].localeCompare(b[0]))) lines.push(`${n} ${name}`);
    lines.push('');
  }
  const sites = count(deck.atlas);
  const siteTotal = sites.reduce((s, [, n]) => s + n, 0);
  lines.push(`Site (${siteTotal})`);
  for (const [id, n] of sites) lines.push(`${n} ${byId.get(id)?.name || id}`);
  return lines.join('\n');
}
