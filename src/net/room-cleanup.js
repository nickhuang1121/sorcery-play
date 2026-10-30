import { roomPaths, isPresenceAlive, ROOM_BOTH_OFFLINE_MS } from './protocol.js';

/**
 * Opportunistic GC: any connected client may delete rooms where both seats
 * have been offline (or never present) longer than bothOfflineMs.
 * Spark-friendly — no Cloud Functions / Blaze required.
 * (Server-side scheduled GC would need Blaze + Cloud Functions; not used here.)
 */
export async function sweepExpiredRooms(transport, opts = {}) {
  if (!transport?.list || !transport?.remove) {
    throw Error('transport 需要 list / remove');
  }
  const bothOfflineMs = opts.bothOfflineMs ?? ROOM_BOTH_OFFLINE_MS;
  const now = opts.now ?? Date.now();
  const preserveRoomId = opts.preserveRoomId || null;

  const ids = await transport.list('rooms');
  const removed = [];

  for (const id of ids) {
    if (preserveRoomId && id === preserveRoomId) continue;
    const paths = roomPaths(id);
    const [meta, p0, p1] = await Promise.all([
      transport.get(paths.meta),
      transport.get(paths.presence(0)),
      transport.get(paths.presence(1)),
    ]);

    if (!meta) {
      await transport.remove(paths.root);
      removed.push(id);
      continue;
    }

    if (isPresenceAlive(p0, now) || isPresenceAlive(p1, now)) continue;

    const lastActivity = Math.max(
      p0?.beat || 0,
      p1?.beat || 0,
      meta.updatedAt || 0,
      meta.createdAt || 0,
    );
    if (now - lastActivity < bothOfflineMs) continue;

    await transport.remove(paths.root);
    removed.push(id);
  }

  return removed;
}
