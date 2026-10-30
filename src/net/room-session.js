import {
  PROTOCOL_VERSION,
  RoomStatus,
  roomPaths,
  toDeckPayload,
  assertDeckPayload,
  makeRoomMeta,
  randomRoomId,
  randomPlayerId,
  deckChecksum,
  presencePayload,
  PRESENCE_BEAT_MS,
  isPresenceAlive,
  ENGINE_BUILD,
} from './protocol.js';

/**
 * Lobby session: create/join room + publish/subscribe decks + presence.
 * Does not touch engine, app UI, or Auth.
 *
 * Events: meta, deck, decksReady, canStart, matchStart, peerOnline, peerOffline
 */
export function createRoomSession(opts) {
  const transport = opts.transport;
  if (!transport) throw Error('需要 transport');
  const playerId = opts.playerId || randomPlayerId();
  const listeners = new Map();

  let roomId = null;
  let seat = null;
  let unsubs = [];
  let meta = null;
  const decks = { 0: null, 1: null };
  let beatTimer = null;
  let staleTimer = null;
  let cancelDisconnect = null;
  let lastPeerPresence = null;
  let peerOnline = null;
  let matchStartEmittedForSeed = null;

  function emit(event, payload) {
    const set = listeners.get(event);
    if (set) for (const fn of [...set]) fn(payload);
  }

  function on(event, fn) {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event).add(fn);
    return () => listeners.get(event)?.delete(fn);
  }

  function clearSubs() {
    for (const u of unsubs) try { u(); } catch { /* ignore */ }
    unsubs = [];
  }

  function stopPresence() {
    if (beatTimer) clearInterval(beatTimer);
    if (staleTimer) clearInterval(staleTimer);
    beatTimer = staleTimer = null;
    if (cancelDisconnect) {
      try { cancelDisconnect(); } catch { /* ignore */ }
      cancelDisconnect = null;
    }
  }

  async function writePresence(online) {
    if (seat == null || !roomId) return;
    const path = roomPaths(roomId).presence(seat);
    const payload = presencePayload({ playerId, seat, online });
    await transport.set(path, payload);
    return payload;
  }

  function evaluatePeer(value) {
    lastPeerPresence = value;
    const online = isPresenceAlive(value);
    if (peerOnline === online) return;
    peerOnline = online;
    emit(online ? 'peerOnline' : 'peerOffline', {
      roomId,
      seat: seat == null ? null : 1 - seat,
      presence: value ? { ...value } : null,
    });
  }

  function startPresence() {
    stopPresence();
    peerOnline = null;
    lastPeerPresence = null;
    const paths = roomPaths(roomId);
    const offline = presencePayload({ playerId, seat, online: false });
    if (typeof transport.onDisconnect === 'function') {
      cancelDisconnect = transport.onDisconnect(paths.presence(seat), offline);
    }
    writePresence(true).catch(() => {});
    beatTimer = setInterval(() => { writePresence(true).catch(() => {}); }, PRESENCE_BEAT_MS);

    const opp = 1 - seat;
    unsubs.push(transport.subscribe(paths.presence(opp), (value) => evaluatePeer(value)));
    staleTimer = setInterval(() => evaluatePeer(lastPeerPresence), 2000);
  }

  function checkMatchReady() {
    if (!meta || meta.status === RoomStatus.playing) return;
    const d0 = decks[0], d1 = decks[1];
    if (!d0?.ready || !d1?.ready) return;
    emit('decksReady', {
      roomId,
      decks: [assertDeckPayload({ ...d0 }), assertDeckPayload({ ...d1 })],
      meta: { ...meta },
    });
    if (seat === 0 && meta.status === RoomStatus.lobby) {
      emit('canStart', { roomId, host: true });
    }
  }

  function watchRoom(id) {
    clearSubs();
    stopPresence();
    roomId = id;
    const paths = roomPaths(id);
    unsubs.push(transport.subscribe(paths.meta, (value) => {
      meta = value;
      emit('meta', value);
      if (value?.status === RoomStatus.playing && value.seed != null && matchStartEmittedForSeed !== value.seed) {
        matchStartEmittedForSeed = value.seed;
        emit('matchStart', {
          roomId,
          seed: value.seed,
          decks: [decks[0], decks[1]],
          meta: value,
        });
      }
      checkMatchReady();
    }));
    unsubs.push(transport.subscribe(paths.deck(0), (value) => {
      decks[0] = value;
      emit('deck', { seat: 0, deck: value });
      checkMatchReady();
    }));
    unsubs.push(transport.subscribe(paths.deck(1), (value) => {
      decks[1] = value;
      emit('deck', { seat: 1, deck: value });
      checkMatchReady();
    }));
    startPresence();
  }

  async function createRoom() {
    const id = randomRoomId();
    seat = 0;
    matchStartEmittedForSeed = null;
    const m = makeRoomMeta({ roomId: id, hostId: playerId });
    await transport.set(roomPaths(id).meta, m);
    watchRoom(id);
    return { roomId: id, seat, playerId, protocol: PROTOCOL_VERSION };
  }

  async function joinRoom(id) {
    const paths = roomPaths(id);
    const existing = await transport.get(paths.meta);
    if (!existing) throw Error('房間不存在：' + id);
    if (existing.protocol !== PROTOCOL_VERSION) throw Error('房間協定版本不符');
    if (existing.guestId && existing.guestId !== playerId) {
      const guestPres = await transport.get(paths.presence(1));
      if (isPresenceAlive(guestPres)) throw Error('房間已滿');
    }
    seat = 1;
    matchStartEmittedForSeed = null;
    await transport.update(paths.meta, {
      guestId: playerId,
      updatedAt: Date.now(),
    });
    watchRoom(id);
    return { roomId: id, seat, playerId, protocol: PROTOCOL_VERSION };
  }

  /** Reclaim host seat after refresh if previous host presence is stale. */
  async function reclaimHost(id) {
    const paths = roomPaths(id);
    const existing = await transport.get(paths.meta);
    if (!existing) throw Error('房間不存在：' + id);
    if (existing.protocol !== PROTOCOL_VERSION) throw Error('房間協定版本不符');
    const hostPres = await transport.get(paths.presence(0));
    if (isPresenceAlive(hostPres) && existing.hostId !== playerId) {
      throw Error('房主仍在線，無法重連');
    }
    seat = 0;
    matchStartEmittedForSeed = null;
    await transport.update(paths.meta, {
      hostId: playerId,
      updatedAt: Date.now(),
    });
    watchRoom(id);
    return { roomId: id, seat, playerId, protocol: PROTOCOL_VERSION };
  }

  async function publishDeck(deck, { ready = false } = {}) {
    if (seat == null || !roomId) throw Error('尚未加入房間');
    const payload = toDeckPayload(deck, { seat, playerId, ready });
    await transport.set(roomPaths(roomId).deck(seat), payload);
    return payload;
  }

  async function setReady(ready) {
    if (seat == null || !roomId) throw Error('尚未加入房間');
    const current = await transport.get(roomPaths(roomId).deck(seat));
    if (!current) throw Error('請先 publishDeck');
    const next = { ...current, ready: !!ready, updatedAt: Date.now() };
    next.checksum = deckChecksum(next);
    await transport.set(roomPaths(roomId).deck(seat), next);
    return next;
  }

  async function startMatch(seed = (Date.now() % 1e9) >>> 0) {
    if (seat !== 0) throw Error('僅房主可開始對局');
    if (!decks[0]?.ready || !decks[1]?.ready) throw Error('雙方牌組尚未 ready');
    assertDeckPayload(decks[0]);
    assertDeckPayload(decks[1]);
    const next = {
      ...meta,
      status: RoomStatus.playing,
      seed: seed >>> 0,
      protocol: PROTOCOL_VERSION,
      engineBuild: ENGINE_BUILD,
      deckChecksums: [decks[0].checksum, decks[1].checksum],
      updatedAt: Date.now(),
    };
    const paths = roomPaths(roomId);
    await transport.set(paths.meta, next);
    await transport.set(paths.alloc, 0);
    await transport.set(paths.cursor, 0);
    return next;
  }

  function getSnapshot() {
    return {
      roomId,
      seat,
      playerId,
      peerOnline,
      meta: meta ? { ...meta } : null,
      decks: { 0: decks[0] ? { ...decks[0] } : null, 1: decks[1] ? { ...decks[1] } : null },
    };
  }

  async function close() {
    stopPresence();
    try { await writePresence(false); } catch { /* ignore */ }
    try { if (typeof transport.flushDisconnect === 'function') await transport.flushDisconnect(); } catch { /* ignore */ }
    clearSubs();
    listeners.clear();
    roomId = null;
    seat = null;
  }

  return {
    playerId,
    on,
    createRoom,
    joinRoom,
    reclaimHost,
    publishDeck,
    setReady,
    startMatch,
    getSnapshot,
    close,
  };
}
