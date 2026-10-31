# Final seven: Book of Blessings / The Immortal Throne

2026-10-30 UTC. Agent only authored `/tmp/final-seven-passives-candidate.mjs` and this document; no shared source/formal test/JSON edited. Sites wave4 remains stable at27/23/4 in its separate draft. This is additional representative native evidence, not completion of either unresolved ruling or UI verification.

## Native test result

`node --test /tmp/final-seven-passives-candidate.mjs > /tmp/final-seven-passives-valid9.log 2>&1`: **9/9 pass, exit0**.

- Real hand Artifact cast of Throne pays printed4 and physically enters zero level; actual Site play presents mandatory spells/atlas deck selection. JSON before choice resumes exactly one draw/level, including hand and deck verification.
- Unmatched printed-cost spell does not draw or advance.
- Two matching zero-level Thrones, one owned by each player, each produce independent mandatory draw for actual Site player; JSON between triggers preserves first advance without replay, then both level1. This deliberately does not reach double victory.
- Silenced and disabled Throne sources do not trigger or advance.
- Actual hand cast Maddening Bells at caster location, then actual Zap pays printed1+tax2; level1 Throne still matches printed1 and becomes2. JSON before draw; genuine damage verified. Initial Bells fixture omitted explicit destination and did not tax; corrected to actual at17, not an engine failure.
- Book remains unplayable in actual legal hand actions, while Ruby Core genuinely casts; blocked Book hand card remains. Initial positive control used Lance, a token not castable from hand; corrected to Ruby Core, not an engine failure.
- Two fixture-Book/native-Zap paths: one allied Minion is Warded before damage (Ward consumed, zero damage); one enemy Minion is not Warded and takes1. Actual Magic dispatch, JSON fixture restore and closed Magic choice context verified. **Book is fixture-inserted because production cast is disabled; these tests do not prove normal Book cast/UI integration.** Single target is invariant across competing scope interpretations, so neither chooses a new policy.

## Existing implementation and evidence inspected

`src/final-passives.js`: bookOfBlessingsTarget helper uses distinct chosen entities; finalThronePlayed / resolveFinalThrone / finalThroneWinners / checkFinalThroneVictory. `src/magic-context.js`: active bearer snapshot, declaration/choice recording, singleChoice/knownMany lists, selectionComplete and Ward grant; unsupportedBookCast/assertBookCastSupported remain experimental helpers not connected to production. `src/engine.js` hooks Throne on Site enter and committed spell.

`tests/final-passives.test.js` already covers Site→1cost progression, enemy actual playing player, empty draw loss, Avatar move into level8, dying blockers with Deathrite-created units, and explicit dual-win error. `tests/magic-context.test.js` covers many fixture-Book native Magic paths including Suffering with Bitten Deathrite spawning later opponent Skeleton. `docs/BOOK_SUFFERING_TIMING.md`, `docs/PLAYER_RULE_DECISIONS.md` and existing `docs/final-passives.md` inspected; no unresolved assumption treated as official.

## Book: smallest safe scope and exact blocker

Official FAQ establishes that a target is a choice. A Magic with exactly one allied non-Evil Minion choice and no later choices, e.g. Zap, has an invariant result: grant Ward to that Minion when chosen, before damage. Existing native support plus the two tests above can be retained as an experimental supported case. Negative cases with no allied chosen Minion are also invariant. Rendering bearer UID, actual caster, declared/actual selected UID list, selection stage and current Ward is possible without resolving future choices.

**Opening the whole Book card is not justified by these cases.** Production needs a defined single-choice scope and Ward trigger point. Under whole-Magic-final-distinct-set semantics, Symmetric Suffering may first sacrifice an allied Bitten, then genuine Deathrite creates an opposing Skeleton that becomes a new legal opponent sacrifice. Whole-set eligibility cannot be decided before the first sacrifice without predicting a future player choice. Ward before sacrifice can affect Ward-dependent power/Deathrite; granting then rolling back or granting after death is observably different. Per-choice/per-instruction semantics instead changes which spells trigger. Existing local working interpretation is not approved official resolution. Guarding only Suffering does not settle other mixed/multiple-choice Magics.

Minimum request for ruling remains: define whether single counts all distinct Minions chosen by the whole Magic, only allied choices, or each choice event/instruction; define when its trigger becomes eligible and Ward resolves relative to effects and nested Deathrites. No new house rule selected. Cannot label Book complete or enable playable flag from this task.

## Throne: exact remaining blocker

Ordinary cast, card-play triggers, printed cost, actual playing player draws, independent multiple triggers, single-Avatar-alone win are implemented and have representative native tests. The unresolved case is **both players simultaneously satisfying separate level8 Thrones**. `checkFinalThroneVictory` intentionally throws `SIMULTANEOUS_THRONE_WIN` without selecting winner. Double death-blow draw rules do not explicitly settle this separate alternate victory condition. No test here converts it into draw/active-player priority or other policy. Root must preserve pending decision; these additional successes do not remove it.

## Primary sources and versions

Official snapshot `data/official-cards.json`: Book cost3 Document; Throne cost4 Monument. Current official cached Rulebook October2026 `/tmp/sorcery-official-rulebook-oct2026.txt`, source metadata `data/final-101-official-source-index.json`. Rulebook p19 Magic sequence; p27 triggers; p31 Storyline declaration/resolution/event splitting; p35 sacrifice/death; p11/36 winning/order do not explicitly resolve pending questions.

Official embedded documents `/tmp/sorcery-official-embedded-docs.json`:
- Book FAQ `aa28f077-ea12-4e65-8495-19dd0cb388b3`, updated2025-12-06: targeting an allied Minion qualifies as choosing.
- Throne FAQ `FWsVZ4rxgHCtjTP73mTtTc`, updated2025-02-20: alone means no other units at location.
- Throne FAQ `FWsVZ4rxgHCtjTP73mTtso`, updated2025-02-20: playing includes Site (cost0) or casting spell.
- Throne FAQ `ygoDG8fb7HS97qCW69htj8`, updated2025-02-20: uses printed cost despite modification.
- Throne FAQ `ygoDG8fb7HS97qCW69kaCv`, updated2025-12-21: use normal text, alpha foil misprint tournament illegal.

Attempted official [Book](https://curiosa.io/cards/book_of_blessings) and [Throne](https://curiosa.io/cards/the_immortal_throne) page refresh on2026-10-30: both inaccessible through browsing tool. Cached official source evidence is used; no fresh online confirmation claimed. No fullsuite, simulation, server or actual browser UI executed by this agent. Parent owns integration and broader verification.
