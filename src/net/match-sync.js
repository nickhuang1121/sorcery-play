import { roomPaths, PROTOCOL_VERSION, ENGINE_BUILD } from './protocol.js';
import { checksumState } from './state-checksum.js';

/**
 * Lockstep action log over a room. Both clients apply the same ordered actions.
 * Free Spark-friendly: only RTDB writes, no Cloud Functions.
 */
export function createMatchSync({ transport, roomId, seat, playerId, engineBuild = ENGINE_BUILD }) {
  if (!transport?.transaction) throw Error('transport 需要 transaction');
  const paths = roomPaths(roomId);
  const listeners = new Map();
  let cursor = 0;
  let unsubCursor = null;
  let closed = false;
  let chain = Promise.resolve();

  function emit(event, payload) {
    const set = listeners.get(event);
    if (set) for (const fn of [...set]) fn(payload);
  }

  function on(event, fn) {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event).add(fn);
    return () => listeners.get(event)?.delete(fn);
  }

  async function pullThroughInner(target) {
    while (cursor < target && !closed) {
      const next = cursor + 1;
      const entry = await transport.get(paths.action(next));
      if (!entry) {
        emit('gap', { expected: next, cursor });
        break;
      }
      if (entry.engineBuild && entry.engineBuild !== engineBuild) {
        emit('desync', { reason: 'engineBuild', entry, local: engineBuild });
        break;
      }
      cursor = next;
      emit('action', entry);
    }
  }

  function pullThrough(target) {
    chain = chain.then(() => pullThroughInner(target));
    return chain;
  }

  function start() {
    unsubCursor = transport.subscribe(paths.cursor, (value) => {
      const target = Number(value) || 0;
      pullThrough(target);
    });
  }

  /**
   * Append action with monotonic seq. Returns the log entry.
   * Prefer waiting for 'action' event to apply locally (includes echo of own moves).
   */
  async function publish(action, { checksumAfter = null } = {}) {
    if (closed) throw Error('match sync 已關閉');
    // Allocate seq, write action doc, THEN advance cursor so peers never pull a missing seq.
    const seq = await transport.transaction(paths.alloc, (cur) => (Number(cur) || 0) + 1);
    const entry = {
      protocol: PROTOCOL_VERSION,
      engineBuild,
      seq,
      seat,
      playerId,
      action,
      checksumAfter,
      at: Date.now(),
    };
    await transport.set(paths.action(seq), entry);
    await transport.set(paths.cursor, seq);
    return entry;
  }

  async function flush() {
    await chain;
  }

  function getCursor() {
    return cursor;
  }

  function close() {
    closed = true;
    if (unsubCursor) unsubCursor();
    unsubCursor = null;
    listeners.clear();
  }

  return { on, start, publish, flush, getCursor, close, checksumState };
}

export { checksumState, ENGINE_BUILD, PROTOCOL_VERSION };
