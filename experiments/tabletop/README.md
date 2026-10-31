# Forest table presentation and isolated experiments

The approved forest battlefield has been promoted to production `index.html` and `online-play.html`. Production keeps its original home screen, save/deck/tutorial keys, rules, AI and Firebase protocol. All dialogs use the shared black glass surface. The forest scene is enabled only while playing, including tutorials.

Canonical presentation sources:

- `src/realm-mobile-layout.js`: large mobile stacks with separated edges; desktop spreads retain the existing layout.
- `src/realm-mobile-picker.js`: native dialog carousel, layers, native action/target routing and stale-state checks.
- `src/app.js`: bridge to the existing legal actions and UI; no alternate game engine.
- `src/battle-scene.js`: public pile information and existing controls.
- `styles/battle-scene.css`, `styles/realm-mobile.css`, `styles/glass-popups.css` and `assets/forest-table.jpg`.

`experiments/tabletop/index.html` remains the visual study. `battle.html`, `online-play.html` and `lobby.html` are generated from production entrypoints and use the same canonical modules. Only local match, deck, effects, AI and tutorial saves are namespaced under `sorcery.tabletop.*`. The old mobile module/style filenames are compatibility exports/imports. They do not contain a second implementation. The shared forest image was generated with the prompt in `assets/forest-table.prompt.txt` in this experiment directory.

After changing production UI, run:

```sh
node experiments/tabletop/sync-battle.mjs
node --test experiments/tabletop/runtime.test.mjs experiments/tabletop/mobile-stack.test.mjs
```

`runtime-manifest.json` and `sync-battle.mjs --check` detect stale generated entrypoints. No rule, AI or Firebase modules are copied. Firebase singleton imports retain identical URLs and query strings. Online Google login, seat credentials, reconnect and the fifteen-minute room cleanup policy are unchanged.

Validation at promotion: 2832 existing tests plus 11 presentation/integration checks passed. Production `index.html` was exercised at 390x670 and 844x390 with crowded stacks, swipe selection, nested details, drag Overpower onto a double-unit cell, native attack/defender replacement/ranged lethal result, AI opening hand, English landscape and tutorial chapter completion. Online lobby and missing-seat recovery were checked; no new two-account online match was played. Local fixture testing backs up and restores production save keys. Browser viewport testing is not physical iPhone testing.

`mobile-playtest-replay.json` records the earlier full UI-operated official Beta Earth versus Fire Easy AI game: seed 14630, 106 native actions, natural victory on turn 18, life 14 versus 0, no concession or state injection. The integration check reproduces this result from the untouched official opening decks.

`qa.html` and `qa-fixtures.json` remain isolated experimental tools. The combat fixture is the last four native actions of an existing natural game; the stack fixture deliberately covers dry underground, water and crowded surface layers. Restore the experimental save after using them.
