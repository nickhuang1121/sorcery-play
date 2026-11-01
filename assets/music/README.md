# Background music

Copied without re-encoding from the user's local `godot/card-game/music/配樂` collection:

- `bells-of-the-forgotten.mp3` — Bells of the Forgotten
- `the-dragons-first-breath.mp3` — The Dragon's First Breath
- `ruler-of-the-deep-sea.mp3` — Ruler of the Deep Sea

The playlist loops in this order at 20% volume by default. `src/music.js` mounts controls in the shared settings menu and the battlefield match menu. Each independent feature HTML loads the player once. Audio follows the browser's user-gesture autoplay policy, pauses when hidden, and resumes when visible if enabled. First visits start muted, with a one-time invitation on the homepage. A persistent speaker shortcut toggles music in one tap; menus include previous/next and a volume slider. The on/off and volume preferences are local to the device; track and position are stored per tab to restore after page navigation. This is background music only; the existing battle effects are independent.
