# Final seven sync — current digital Twister and manual Contract

2026-10-30 UTC. Parent relayed latest user authorization replacing Twister physical operation with a digital uniformly selected board cell, including all20 cells. This authorization does not settle the five other pending rules. This agent authored only dedicated `/tmp` files, no shared source/formal tests/JSON, no real Firebase, credentials, server, ps, simulation or browser.

## Current result

Candidate `/tmp/final-seven-manual-sync-candidate.mjs` (historical name; Twister sections now digital).
`node --test /tmp/final-seven-manual-sync-candidate.mjs > /tmp/final-seven-sync-digital-valid6c.log 2>&1`: **6/6 pass, exit0**.

1. Genuine native Demonic Contract with real Demon and Gem follows manual category+confirmation. Token stable across JSON; captured confirmation moves to real search. Replaying same index with old token rejected before mutation, no second payment, no consumption of search; fresh search succeeds.
2. Two memory peers receive tokenized confirmation and duplicate rawlog entry; both reject stale entry identically, retain search, exactly one accord audit and equal checksum.
3. Actual online submit handler body extracted from src/online-play.js runs against memorysync and live state getter. Concurrent doubleclick publishes exactly seq1; once search appears the old captured action ignored before publish. Both peers agree checksum and no errors. This is production submission code, not a rewrite, but not actual DOM/browser.
4. Actual hand Twister declaration via choose token drives digital selection on two memory peers: one finalTwisterDigitalResults record, uid and landing0..19 and rule=digital-uniform-board-v1; shared RNG advances, no physical audit/manualpause. Stale declaration resubmit rejected without additional RNG or state mutation. Oversized Minion ensures downstream position choice can remain real without reroll.
5. Reloaded peer replays from JSON pre-declaration baseline and same accepted actionlog, obtains exactly same digital outcome, RNG and checksum, one seq consumed. This covers deterministic replay mechanics, not full page reconnect bootstrap.
6. Wrong envelope seat cannot forge action.actor and consume manual Contract confirmation; game state unchanged after JSON, both peers error consistently. Cursor nevertheless advances to1: rejection recovery is a separate limitation.

Fixture adjustments before authoritative6/6: current Twister moved Minion declaration into commitSpell prepayment (candidate accepts that actual native phase); initially Ward=true hostile target correctly prevented any roll, so positive digital test uses Ward=false. These were invalid positive fixtures, not engine defects. Earlier logs retained, no assertions weakened to ignore a genuine failure.

## Preserved historical evidence

`/tmp/final-seven-manual-sync-physical-historical.mjs` and `/tmp/FINAL_SEVEN_SYNC_PHYSICAL_HISTORICAL.md` preserve the prior9/9 physical-mode evidence, **not current Twister behavior**. `/tmp/final-seven-manual-sync-before.log` preserves baseline4/5, strict red: duplicate raw publish appended two sequences. No claim raw transport idempotency was fixed. New token/UI regression targets actual current submission path; physical tests are not counted as current mode verification.

## Read findings and parent repair

createMatchSync.publish always allocates newseq, writes action, advances cursor. No checksumBefore/requestId/idempotency key; checksumAfter stored not enforced. pullThrough cursor serializes replay and avoids reapplying same seq, not equivalent actions on different seq. Protocol/build compatibility exists. It does not itself authenticate playerId room ownership.

Old index-only buttons plus submit replacing player with current acting state permitted same-index stale clicks to apply to a later choice. Parent introduced src/choice-context.js deterministic opaque token over choice+turn/rng/next; engine verifies provided token before mutation. Online render captures choiceAction player+token; submit preserves player, checks stale identity, inFlight guard and flush. Tokens are accidental stale-click preconditions, not secrets/authentication.

## Limits

Legacy tokenless actions/logs intentionally accepted; rawsync.publish still appends duplicate commands. Invalid entry already advances cursor; production online catches error and marks desync, does not auto-remove log entry. Tests prove immutable rejection and matching peer state, not transparent recovery or distributed consensus.

Uniformity rule comes from user's authorized digital replacement; these6 tests verify deterministic single result application and no duplicate RNG consumption. They do not independently prove distribution frequencies or all20 landing effects (root owns broader native coverage). Physical truth is no longer requested by current Twister flow. Manual Contract still requires human classification, which deterministic sync cannot validate.

No dual-browser/Firebase/DOM rendering/labels/session authorization/network timing claims. Five pending rules remain unchosen. Relevant files read: src/online-play.js, src/net/match-sync.js, memory-transport.js, protocol.js, final-control.js, final-effects.js, choice-context.js, existing final-effects tests. Parent owns source changes and promotion/full regression.
