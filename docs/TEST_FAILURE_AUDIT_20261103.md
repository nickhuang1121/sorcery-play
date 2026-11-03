# 28 failing tests audited on 2026-11-03

The 28 failures reduce to three runtime defects (17 cases), obsolete Adept UI
steps (3 cases), and engine-derived replay/restore data (8 cases). No tests were
removed, skipped, or changed to ignore final-state differences.

## Runtime findings

- Forced Burrow/Submerge incorrectly set `burrowedSafely=true`. That flag grants
  Burrowing and Immobile and belongs only to explicit safe-burial effects such
  as Awakened Mummies. Forced movement grants neither survival nor Immobile.
  Clear the flag for both ordinary units and growing Moeba pseudopods; retain
  the existing movement legality, artifact and source-attribution checks.
- Bureau used total source mana minus spending rather than `resources.available`.
  Source mana exists even outside the player's turn, but spendable mana is zero.
  Use the canonical spendable budget for both offering and committing payment.
  The original helper tests provide that canonical `available` field; no mock
  budget changes are needed. Add direct commit rejection to the Boneyard case.
- Castle Haunt's permission to be cast to any Elite/Unique site was implemented
  as an exclusive restriction. Remove the early rejection; the ordinary allied
  site rule and additional Elite/Unique permission still apply. Retain tether
  death checks and verify ordinary enemy sites remain illegal.

Rules checked against the repository's official card snapshot and embedded
official Codex/FAQ cache, including Burrowing
`16ed5006-40f3-4df2-8b60-6d0b13bb35a8`, Submerge
`aaa76e05-0cbc-4114-ad1c-411eeec89eea`, Mana
`72e711f6-ced0-4ff0-8386-e380e628f06f`, and Adept's shuffle FAQ
`FWsVZ4rxgHCtjTP73mU1SK`. The official Burrowing URL was also opened during
this audit; individual card pages were unavailable through the web reader.

## Individual disposition

Numbers match the failure list reported in chat.

| # | Case | Classification and correction |
|---|---|---|
| 1 | Dragonlord / Draco Corvus | Runtime: forced burial granted survival; retain death assertion. |
| 2 | Fire permission plus unrestricted Spellcaster | Runtime: casting succeeds; forced-layer survival prevented the expected kill. |
| 3 | Mandrake Jars / Bury | Runtime: forced burial survival. |
| 4 | Mix Aqua | Runtime: forced submerge survival. |
| 5 | Mix Terra | Runtime: forced burial survival. |
| 6 | Buried Alive | Runtime: forced burial survival. |
| 7 | Drown | Runtime: forced submerge survival. |
| 8 | Those Who Linger | Runtime: missing burial deaths prevented subsequent summon triggers. |
| 9 | Linger / Mock Court | Runtime: missing burial deaths prevented expected collection handling. |
| 10 | Native Draco Corvus | Runtime: forced burial survival. |
| 11 | Gravedigger | Runtime: forced burial survival. |
| 12 | Adept Illusionist hand summon | Old UI steps: choose whether to search Spellbook, then select the actual hand card; keep cost/location assertions. |
| 13 | Castle Haunt native cast | Runtime: additional Elite/Unique permission incorrectly blocked ordinary allied sites. |
| 14 | Monks / Bury | Runtime: forced burial survival. |
| 15 | Monks / Drown | Runtime: forced submerge survival. |
| 16 | Bureau separate budget | Runtime budget contract: use canonical `available`; retain unaffordable-payment and rollback assertions. |
| 17 | Bureau saved pre-effect choice | Runtime budget contract: use canonical `available`; retain saved-choice/refusal assertions. |
| 18 | Bureau / Adept refusal | Old UI steps: decline Bureau, decline optional Spellbook search, then summon from hand; preserve cemetery and zero-spending assertions. |
| 19 | Bureau / Boneyard off-turn payer | Runtime: no spendable mana outside own turn; hide payment and reject direct commitment. |
| 20 | Pallid borrowed Adept | Old UI steps: decline Spellbook search and select the physical Brown Bears; retain self-name and tap assertions. |
| 21 | Saved defense keep/replace | Old restored snapshot: add current hydration fields; preserve pending combat and both response assertions. |
| 22 | Saved interception | Old restored snapshot: add current hydration fields; preserve damage, death and pass assertions. |
| 23 | Google mobile 70-command replay | Old tokens/state: refresh derived fields with restoration before each command, matching the test. |
| 24 | Mobile 70-command replay | Old final snapshot: refresh derived fields, including follow signatures. |
| 25 | Historical illegal void-Avatar opening | Old tokens before invalid action: refresh only the seven legal prefix commands; preserve the illegal action and rejection test. |
| 26 | Corrected historical opening | Same legal-prefix token refresh; retain mandatory-site and resume assertions. |
| 27 | Dual-browser 119-command replay | Old tokens/state: regenerate from recorded initial state; retain victory and checksum assertions. |
| 28 | Realm mobile 106-command replay | Old tokens: regenerate from official opening decks; retain turn/life/victory assertions. |

`node tools/refresh-mobile-replays.mjs` refreshes the derived fixtures, including
the English replay affected by the forced-layer fix. It asserts that all
recorded gameplay actions (excluding transient tokens) stay identical, that
victory turn/winner/life totals stay identical, and that hydrated combat
snapshots are stable without changing their pending combats. It does not
disable runtime stale-choice validation or change historical playtest metadata.

## Validation

- Card-rule subset: 574/575 passed before the Castle Haunt correction; the
  remaining Castle Haunt case passed in the following targeted run.
- Replay, restore, Castle Haunt and cemetery-access subset: 226/226 passed.
- Final `npm test`: **2,899/2,899 passed, 0 failures, 0 skipped, 0 todo**.
- `git diff --check`: passed.
