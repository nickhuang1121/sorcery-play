/** Wire format for online lobby / deck exchange / lockstep actions. No engine imports. */
export const PROTOCOL_VERSION = 1;
/** Bump when local rules/engine behavior changes; mismatched clients refuse to play. */
export const ENGINE_BUILD = 'lockstep-1';

export const RoomStatus = Object.freeze({
  lobby: 'lobby',
  ready: 'ready',
  playing: 'playing',
  ended: 'ended',
});

/** Presence heartbeat interval / stale threshold (ms). */
export const PRESENCE_BEAT_MS = 4000;
export const PRESENCE_STALE_MS = 12000;

export function roomPaths(roomId) {
  const root = `rooms/${roomId}`;
  return {
    root,
    meta: `${root}/meta`,
    deck: (seat) => `${root}/decks/${seat}`,
    presence: (seat) => `${root}/presence/${seat}`,
    actions: `${root}/actions`,
    action: (seq) => `${root}/actions/${seq}`,
    tip: (seq) => `${root}/tips/${seq}`,
    /** Highest seq safe to apply (action doc already written). */
    cursor: `${root}/cursor`,
    /** Monotonic allocator; may briefly lead cursor while writing the action doc. */
    alloc: `${root}/alloc`,
  };
}

export function presencePayload({ playerId, seat, online = true }) {
  return {
    protocol: PROTOCOL_VERSION,
    playerId,
    seat,
    online: !!online,
    beat: Date.now(),
  };
}

export function isPresenceAlive(p, now = Date.now()) {
  return !!(p && p.online && p.beat && (now - p.beat) <= PRESENCE_STALE_MS);
}

/** Both seats offline this long → opportunistic clients may delete the room. */
export const ROOM_BOTH_OFFLINE_MS = 15 * 60 * 1000;

/** Stable checksum over official card ids only (order matters for duplicates). */
export function deckChecksum(deck) {
  const parts = [
    String(deck.avatar ?? ''),
    ...(deck.atlas || []).map(String),
    '|',
    ...(deck.spells || []).map(String),
    deck.format ? `|${deck.format}` : '',
  ];
  let h = 2166136261;
  const s = parts.join(',');
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/**
 * Normalize a local deck into the wire payload.
 * @param {object} deck { name?, avatar, atlas[], spells[], format? }
 * @param {{ seat: 0|1, playerId: string, ready?: boolean }} who
 */
export function toDeckPayload(deck, who) {
  if (!deck || typeof deck.avatar !== 'string' && typeof deck.avatar !== 'number') {
    throw Error('牌組缺少 avatar');
  }
  if (!Array.isArray(deck.atlas) || !Array.isArray(deck.spells)) {
    throw Error('牌組 atlas／spells 必須為陣列');
  }
  const payload = {
    protocol: PROTOCOL_VERSION,
    seat: who.seat,
    playerId: who.playerId,
    name: String(deck.name || '未命名牌組'),
    avatar: String(deck.avatar),
    atlas: deck.atlas.map(String),
    spells: deck.spells.map(String),
    ready: !!who.ready,
    updatedAt: Date.now(),
  };
  if (deck.format) payload.format = String(deck.format);
  payload.checksum = deckChecksum(payload);
  payload.counts = { atlas: payload.atlas.length, spells: payload.spells.length };
  return payload;
}

export function assertDeckPayload(p) {
  if (!p || p.protocol !== PROTOCOL_VERSION) throw Error('牌組協定版本不符');
  if (p.seat !== 0 && p.seat !== 1) throw Error('seat 必須為 0 或 1');
  if (!p.playerId) throw Error('缺少 playerId');
  if (!p.avatar || !Array.isArray(p.atlas) || !Array.isArray(p.spells)) throw Error('牌組欄位不完整');
  if (deckChecksum(p) !== p.checksum) throw Error('牌組 checksum 不符');
  return p;
}

export function makeRoomMeta({ roomId, hostId, seed = null, status = RoomStatus.lobby }) {
  return {
    protocol: PROTOCOL_VERSION,
    roomId,
    hostId,
    guestId: null,
    status,
    seed,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function randomRoomId() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 6; i++) id += alphabet[(Math.random() * alphabet.length) | 0];
  return id;
}

export function randomPlayerId() {
  return 'p_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
