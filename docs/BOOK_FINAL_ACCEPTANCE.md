# Accepted Book production scope — 2026-10-31

Latest full regression:2721/2721,0fail/skip,2026-10-31T00:16:12.588Z, stable TAP `data/all-cards-audit/logs/full-sorcery-full-regression-7eQoDV.tap`. Original101 now101 completed core-effect-tested /0partial /0unstarted; fullyVerified remains0. This supersedes historical guard or pending-choice notes below.

Book counts distinct allied Minions only, as user confirmed for Duel. Official target-qualifies-as-chooses FAQ retained. Ordinary artifacts/auras aren't additional Minions; actual dual-type Minions count. Symmetric Suffering selects complete own group, grants applicable Ward, sacrifices whole group simultaneously, resolves Deathrites, then opponent matches on resulting realm. No prepayment blocker remains. Tests include Automaton matching one chosen type, distinct Hemogolem, Angel death-power change, Bitten enemy Skeleton, JSON and legacy saves.

Actual5500 UI evidence in `data/all-cards-audit/logs/`: `book-real-duel-ui.json/png` (cancel, paid Book, reload enemy choice, spent6, Bears damage0/enemydead); `book-suffering-ui.json/png` (real paid carriedBook/Ruby/Aura, Bitten selection/reload, realDeathrite Skeleton matching, spent10, once Ward); `book-chaoswish-ui.json/png` (true BlackCat public outcome100 Book, locked Wizard/freecarriedtokenBook, opponentdeclines, real Wizard Duel acrossreload, spent9, Bears damage0/enemydead). Original browser match restored after every fixture. Served app visibly contains updated grouped-Suffering text and behavior; served JS byte equality not independently verified. LiveFirebase two-client UI not tested; deterministic two-peer memory replay tested in book-final-memory.test.js. No claim of exhaustive cross-card combinations.

--- Historical draft below ---

# Book final acceptance — authorized allied-only scope

2026-10-31 UTC. Parent relays user ruling: Duel allied A plus enemy B grants Ward to A; count allied Minions only. Target-counts-as-choice remains official FAQ. New counting scope is user-authorized project interpretation, not a newly discovered official FAQ. Only /tmp authored by this agent; root owns production registration/default/helper edits.

Candidate `/tmp/book-final-acceptance-candidate.mjs` currently7 native acceptance cases, **all start with actual hand Book cast**, no fixture-inserted Book:
- Book cost3 then Duel oneally+enemy: beforefight Ward prevents allydamage, consumed Ward not regranted at finish; JSON between targetchoices; Magic paid once.
- Two genuine Book casts on same bearer: no regrant after fight.
- Different actual caster cannot activate original bearer's Book.
- Recall two distinct allies automatically completes with no remaining choices after second pick; JSON grants neither.
- Duel prepaymentcancel preserves Magic, mana and noWard.
- Actual Saint cast redeems Barghest; realBook→AbyssalAssault Magic chooses one ally; that ally ability chooses3distinct enemies (not additional Magic choices), with JSON between choices and actualdamage eachenemy.
- Actual Orb cast andBook→Zapcopy changes copiedtarget without extra cast/context or copiedtargetWard.

First beforelog `/tmp/book-final-acceptance-before.log`: five initial cases all failed at No cast Book because root production registration still pending at that snapshot. That is integration-state evidence, not a new effect defect. Positive artifact target/bearer actions use existing native legalActions.

## Independent Suffering timing scope

Old blocker involving future enemy Skeleton no longer affects allied-only count: opponent's later selected Minion is excluded by new scope. Do not keep claiming that exact enemy-count ambiguity survives user ruling.

However, Book's *own* complete allied-Minions set can still require deferred own planning. Symmetric Suffering permits own Minion sacrifice and Artifact sacrifice; an Automaton selected for Artifact slot is also an allied Minion. If first ordinary allied Minion dies before later own Artifact slot is chosen, final ally count may be1 or2. Granting Ward immediately on firstchoice would assume future own choice. Unlike enemy-created Skeleton, own full sacrifice plan can potentially be collected before committing sideeffects, revalidated, then Book Ward applied to the unique ally before sacrifice begins. Existing pure Suffering planner provides a candidate interface but is not itself native integration evidence. Current engine sufferingChoose Artifact candidates only read s.artifacts, excluding artifactUnit entities: the two-allied Minion+Automaton example is an additional selector limitation, not a currently executable native path.

Do not silently switch to per-choice unconditional Ward: user only authorized allied-only count. Ward can change Angel Ascendant/Faith Incarnate power or death-related power reads even when sacrifice ignores Ward, so afterdeath grant or speculative grant+rollback cannot substitute. This is a concrete implementation timing limit to test/address, not a request to reopen settled target-count or countenemies.

Sources retained: official Book FAQ aa28f077-ea12-4e65-8495-19dd0cb388b3 (2025-12-06), Storyline 081fc13c-49fb-4893-90c1-1ba5324e6241 (2026-05-26) including event splitting/new triggers, Ward ae9b6774-aa8f-45c5-a424-d6d7e58014c3 (2026-10-12), official snapshot data/official-cards.json. Current user project counting ruling supplied by parent. No new source claiming per-choice timing.


## Production guard review after root integration

Root integrated allied-only count and Book production registration; root runs the main acceptance candidate, so this agent did not duplicate that run. Additional separate `/tmp/book-suffering-guard-acceptance.mjs` **2/2 pass**, `/tmp/book-suffering-guard-acceptance.log`:
1. Real hand Book bearer attempts Suffering after JSON restore: legal cast action is transactionally rejected with UNSUPPORTED_BOOK_CHOICE_TIMING before payment; full serialized state, hand, RNG, Bitten alive, no speculative Ward unchanged.
2. Same board different real caster has no Book context and may cast Suffering/pay normal cost/decline sacrifices normally.

Reason text is accurate: own Minion/Artifact composite sacrifice and Deathrite selection flow is not fully supported. It does not claim that later enemy count ambiguity survives the user ruling. It is a conservative blanket block for this bearer+Magic combination, including simple positions, until integration supports the entire combination. Other Magics opening does not establish full coverage of every multi-stage interaction. Book therefore has an explicitly rejected combination, not complete unrestricted rules support. Root should retain that limitation in final101 classification and UI description. No source changes by this agent.


## Final main acceptance run

After parent production integration, root initial combined run found two candidate expectation errors: Recall auto-completes after second and final eligible ally (there is no extra Stop choice), and Assault enemy choices belong to the ally ability rather than Magic. Corrected without weakening effect assertions: Recall explicitly asserts no pendingchoice and neither ally Warded; Assault explicitly asserts Magic context contains only ally while all3distinct enemy victims each take1 damage and ally Ward asserted. Candidate **7/7 pass**, `/tmp/book-final-acceptance-valid7.log`, exit0. Titles later clarified auto-completion and copied allied target; no behavior changes.

Combined with independent guard2/2 this provides nine representative tests, not exhaustive allMagic combinations. Production source untouched by this agent.
