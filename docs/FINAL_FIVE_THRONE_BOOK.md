# Throne newly authorized project rule / Book focused rule investigation

2026-10-30 UTC. Only /tmp candidate/doc by this agent; parent integrates shared source. User-authorized new **project** ruling: if both players simultaneously satisfy separate Immortal Thrones, current turn player s.active wins. This is not cited as an official Sorcery rule.

## Strict native Throne candidate

`/tmp/final-five-throne-book-candidate.mjs`; before log `/tmp/final-five-throne-book-before4.log`: **4 tests,4 failures**, all old SIMULTANEOUS_THRONE_WIN behavior (two direct throws, two memory peers captured same error). Earlier2-red log `/tmp/final-five-throne-book-before.log` preserved.

Actual Sjaelstrom hand cast, not injected victory helper: both Avatars at12/13, cross-owned eighth-level Thrones there, each blocked by a real Spirit Wills-o'-the-Wisp. The one native Sjaelstrom banishes ALL nearby Spirits in same effect, making both Avatars alone simultaneously. Neither condition is initially met. Both active0 and active1 tested; both expected active winner, phaseover, both Spirits banished, saved winner survives JSON. Two additional memorytransport tests dispatch same actionlog to both seats from JSON baseline, assert no replay errors and identical winner/checksum.

Source: official Storyline Codex says ALL effects are simultaneous unless one-at-a-time. Sjaelstrom printed all Spirits banish. New outcome selection comes exclusively from user project ruling. Minimal source fix: in checkFinalThroneVictory, when winners.length>1 set winner=s.active (provided it is a valid player); keep no-winner and unique-winner paths unchanged. Do not use artifact owner/controller, declaration player or action-log seat as priority. Existing formal throw-expectation needs deliberate replacement with authorized outcome test, not silent removal. Update player-facing rule decision docs to say project ruling, not FAQ solved.

## Book: focused primary source recheck

Target-counts-as-choice is settled by FAQ aa28f077-ea12-4e65-8495-19dd0cb388b3, updated2025-12-06. No need to ask that question again.

Read full cached official documents, including Storyline nested subcodex sections (not only summary):
- Storyline 081fc13c-49fb-4893-90c1-1ba5324e6241, updated2026-05-26: targets declared when added; events split only as resolving upon realm enter/leave/move or explicit instruction; new trigger interrupts remaining storyline; all/each effects simultaneous; cast trigger Ring of Morrigan precedes original spell resolution.
- Triggered Ability 511a6488-28f7-420b-80c4-fcf94993d050, updated2026-07-15: condition then effect; when/whenever/at identify trigger.
- Target 98943611-2a6f-4756-ad9b-a7d6598e9729, updated2026-03-25: required legal targets declared before storyline, rechecked upon resolution.
- Ward ae9b6774-aa8f-45c5-a424-d6d7e58014c3, updated2026-10-12: protection checked at resolution; Ring can consume Ward before Bury later resolves.
- Book official text from data/official-cards.json; Rulebook October2026 p19/27/31/35. Existing docs/BOOK_SUFFERING_TIMING.md and magic-context implementation/tests read.

Cache `/tmp/sorcery-official-embedded-docs.json`; official [Codex](https://curiosa.io/codex) and [Book](https://curiosa.io/cards/book_of_blessings). Prior same-session online Book page fetch unavailable; this task uses official cache and does not claim new online FAQ content.

**What these settle:** single declared allied-target Zap path can Ward before Zap damage; target is a choice; later non-target choices need not be declared before previous actual Deathrites. A Book trigger is a triggered ability, not permission to predict future player decisions. **What they do not explicitly define:** scope of single (all chosen Minions vs allied-only vs choice instruction/event) and how cast-trigger predicate is evaluated when only future resolution choices can reveal the final set. No new official paragraph located resolving that.

## Smallest two observable outcomes, without assuming a policy

Example A — bearer casts Duel choosing allied Brown Bears and enemy Wild Boars:
1. Count distinct Minions chosen by entire Magic: two chosen => no Book Ward; normal fight damage reaches ally.
2. Count allied chosen Minions / individual ally-choice instruction: exactly one allied chosen => Ward ally before fight; first simultaneous fight damage to ally prevented and Ward consumed.
Both follow target-counts-as-choose; disagreement is the word single scope, not whether enemy is target. Existing experimental full-set path implements outcome1, but is not itself an official ruling.

Example B — bearer casts Symmetric Suffering, first sacrifices allied Bitten; its real Deathrite creates enemy Skeleton, then opponent chooses that Skeleton for matching sacrifice:
1. Full eventual distinct set: two Minions => no Ward; at first sacrifice that second UID does not yet exist, so future set cannot be predeclared from initial board.
2. Per-choice event: own allied Bitten choice can Ward immediately; later enemy choice does not undo it. Ward does not prevent sacrifice but Ward-dependent power/Deathrite reads can differ in other Ward-sensitive victims.
Official Storyline supports real death/trigger interleaving, not hypothetical preview/replay. Do not give speculative pre-Ward then roll back. If user wants scope1, an additional explicit timing rule is still needed for when Book condition becomes established relative to earlier effects; if scope2, define trigger per actual selection event. This doc is a decision comparison, not chosen behavior.

Throne has new explicit authorization; Book remains the sole subject here needing scope/timing interpretation. No edits to Book production playable status or shared source; no server/network/browser/simulation attempted.
