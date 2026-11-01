# Background music

Copied without re-encoding from the user's local `godot/card-game/music/配樂` collection:

- `bells-of-the-forgotten.mp3` — Bells of the Forgotten
- `the-dragons-first-breath.mp3` — The Dragon's First Breath
- `ruler-of-the-deep-sea.mp3` — Ruler of the Deep Sea

The playlist loops in this order at 35% volume. `src/music.js` mounts controls in the shared settings menu and the battlefield match menu. Each independent feature HTML loads the player once. Audio follows the browser's user-gesture autoplay policy, pauses when hidden, and resumes when visible if enabled. The on/off preference is local to the device; track and position are stored per tab to restore after page navigation. This is background music only; the existing battle effects are independent.
