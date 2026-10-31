# Magics Wave8 candidate — 2026-10-30

Only designated /tmp artifacts written. Formal tests/docs/source/audit data untouched. UI not checked. Source-only candidate is not a full six-card certification.

`node --test /tmp/catalog-magics-wave8-candidate.mjs` → **19 tests, 17 pass, 2 fail, 0 skip, exit 1**.

| Card | Actual native legalActions→dispatch coverage | Limitations / strict red |
|---|---|---|
| Gift of the Raven | Allied minion selection excludes enemy/Avatar; paid2, actual spell draw, saved selection and end-turn expiry; 1 or2 native casts followed by actual Grapple strike4; resource and threshold denial | **RED:** two Gifts heal only4 instead of8 (life1→5, should9). Independent stacking explicitly official FAQ. Other healing sources and Ward damage-prevention interactions pending. |
| Gift of the Serpent | Allied native cast gives Lethal; spell draw;2mana;JSON; end-turn expiration; actual Grapple strike destroys high-power enemy instead of merely wounding; resource/threshold denial | Broader inter-region/control interactions and UI pending. |
| Gift of the Wolf | Allied native cast +2 power; spell draw;2mana;JSON; end-turn expiration; resource/threshold denial | Actual lethal combat boundary and UI pending. |
| Gigantism | Allied minion +6, allied Avatar legal and +6;4mana;JSON; end-turn expiration; resource/threshold denial | Other unit kinds and UI pending. |
| Golden Dawn | Exact five-card backrow dealing; minions placed at15/17/19; non-minions bottomed, existing next card remains top; no hand draw;7mana; Death Door grants actual Charge; JSON/resources/threshold | **RED:** minion rejected by Gnome Hollows goes cemetery, expected banished without entering. Simultaneous Genesis ordering, taxes, oversized placement and UI pending. |
| Grapple Shot | Allied selection; real north projectile hits unit; actual two-step drag17→12→7; saved checkpoints; optional strike accepts or declines; source-power strike damage;3mana; resource/threshold denial | Disabled selection eligibility, barriers, intermediate triggers and UI pending; native control tests do not certify all routes. |

## Source reads and versions

Printed card cost, threshold and rules actually read in `data/official-cards.json`. Official embedded cache parsed with Python rather than giant-line grep: `/tmp/sorcery-official-embedded-docs.json`. Cache is local authoritative-primary snapshot; no fresh remote card-page refresh attempted this wave.

- Gift of the Raven FAQ `f045cf4c-6a2a-47c6-af4c-0072b7a05ac0`, updated2026-02-09: multiple castings and other healing abilities each independently heal. Native strict regression exposes `strikeMany` boolean `mods.some(nextStrikeHeal)` instead of instance count.
- Golden Dawn FAQ `3a292ff8-a9c0-4ffe-a662-14c1c1a35143`, updated2026-02-09: faceup dealing one per backrow Site, shuffle non-minions bottom, summon simultaneously, resolve Genesis, finally check Death Door for Charge. Representative tests verify placement/bottoming/Charge only, not simultaneity.
- Summon Codex `679db7d7-3cb3-4655-b84b-53c4bd6ed637`, updated2026-10-12 (read preceding Wave7 and carried forward): cannot pay mandatory costs or illegal summoning location means banished, never enters. Golden Dawn currently specifically sends rejected minion to cemetery, contradicting this rule.
- Grapple FAQ `FWsVZ4rxgHCtjTP73mU9x6`, updated2025-02-20: Beta wording governs; matches snapshot.
- Grapple FAQ `eXfZjLHocReFQIApZdIE6K`, updated2025-02-20: disabled cannot shoot.
- Grapple/Mariner Curse FAQ `ygoDG8fb7HS97qCW69iGGC`, updated2025-02-20: enqueue per-step drag, intermediate submerge prevents later Surface movement/arrival strike.
- Grapple/Gnome Hollows FAQ `ygoDG8fb7HS97qCW69iTct`, updated2025-02-20: cannot detour around entry restriction.

## Test development corrections

Initial draft incorrectly assumed legacy Gift Serpent/Wolf/Gigantism expose resolution `choice`; these native legalActions already encode `target`, so final tests dispatch specific legal action directly. Initial Grapple expected Brown Bears power3; corrected to actual printed source power4 via exported power, preserving actual strike-damage assertion. Neither issue was reported as runtime defect. Remaining two red tests are strict source-confirmed failures, not scaffolding errors.

Await root shared-runtime fixes and explicit formal promotion. Absolute workspace imports must be rewritten to formal relative imports when promoted. No simulation/server launched. Existing formal Wave7 unchanged.

## Root repair validation / independent healing boundary

Root fixed instance-count Raven healing and Golden Dawn illegal summon zone. Candidate rerun `node --test /tmp/catalog-magics-wave8-candidate.mjs`: **20/20 passed, 0 skip, exit0**, including new native River of Blood + Bosk Troll strike3 + two actual Raven casts: life1→3 =1+floor(3/2)+floor(3/2), explicitly not4. River of Blood actual printed text is "All healing is halved, rounded down." Requested name Scrimshaw Destrier does not occur in installed official snapshot; no invented card used. Earlier19/17/2 records are pre-fix history, strict assertions unchanged.

### Raven beneficiary if recipient changes controller — unresolved exact scope

Scenario: player0 casts Raven on allied minion; player1 gains control before that minion's next strike this turn. Does delayed Raven heal original spell controller0, or current striking minion controller1? This spell says "the damage heals you" rather than granting literal quoted self-healing ability. Current shared strikeMany heals source.controller; this is an implementation observation, not a verified ruling.

Primary Codex read: You `ab3da2d7-1bc7-414d-9737-68ce4cb79525`, updated2025-06-09, says you/your refers to player but does not specify delayed effect controller after recipient control change. Ownership and Control `40fc4dfb-0290-4f9e-9f98-4ad5b28ccc8f` says your minions/sites means what controlled, not owned; again does not settle independent spell delayed beneficiary. Healing `f980ed60-def7-4a2d-87ca-589573087481`, updated2025-06-30 defines player healing/life caps but not this scope. Raven stacking FAQ says instances heal independently, not which player after control transfer. Therefore no fabricated strict expected-beneficiary regression; primary adjudication remains needed for that representative interaction. Do not count it verified.

## Promoted stable native candidate

Root preserved all strict assertions and converted only imports/data path to portable relative URL in tests/catalog-magics-wave8.test.js. Full formal regression pending. Actual UI is verified only where separate evidence is recorded.

## Complete formal regression

2026-10-30T22:06:52.391Z: full2533/2533 passed, zero failures/skips, session67898 exit0. Stable data/all-cards-audit/logs/wave11-full-2533*. Actual13 UI scenarios include12 gameplay paths and one authoredThrone-level inspection, not full-card or all-interaction approval.
