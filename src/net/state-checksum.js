/** Fingerprint engine state for lockstep desync checks. No Firebase imports. */
function fnv(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export function checksumState(s) {
  if (!s) return 'null';
  const lives = (s.players || []).map((p) => `${p.life}:${p.spent}:${p.doorTurn ?? ''}`).join(',');
  const hands = (s.players || []).map((p) => p.hand?.length ?? 0).join(',');
  const units = (s.units || [])
    .map((u) => [u.uid, u.card, u.at, u.controller, u.owner, !!u.tapped, u.damage | 0, u.layer || 'surface', !!u.ward, !!u.stealth].join(':'))
    .sort()
    .join(';');
  const board = (s.board || [])
    .map((b, i) => (b ? `${i}:${b.card}:${b.controller}` : `${i}:`))
    .join('|');
  const pending = s.pending ? JSON.stringify(s.pending) : '';
  const choice = s.choice ? `${s.choice.player}:${s.choice.title}:${(s.choice.options || []).length}` : '';
  const raw = [
    s.seed, s.rng, s.turn, s.active, s.phase, s.mulligan, s.winner,
    s.firstPlayer, lives, hands, units, board, pending, choice,
    (s.artifacts || []).length, (s.auras || []).length,
  ].join('#');
  return fnv(raw);
}
