# Independent feature pages

Each feature has its own HTML document and bootstrap under `src/pages/`. The homepage uses `src/home.js`, not the battle/editor runtime. The page routes retain the GitHub Pages repository prefix and are centralized in `src/page-routes.js`.

| Page | Feature |
| --- | --- |
| `index.html` | Home lobby, public ranking preview and player center shortcut |
| `player.html` | Authenticated player overview, nickname editing, local/cloud deck distinction, own results/ranks and verified room resume; optional `?tab=decks` / `?tab=results` |
| `play.html` | Select Online / Solo vs AI / Local two-player |
| `match-setup.html?mode=ai` | Local deck and difficulty setup; also supports `mode=local` |
| `battle.html` | Existing local/AI match and result dialog |
| `lobby.html` | Google sign-in, public/private Firebase rooms and ready/start |
| `online-play.html` | Firebase online battlefield |
| `decks.html` | Local deck editing, import/export, publication and cloud sync |
| `cards.html` | Card catalogue, search and card details; optional `?card=<id>` |
| `tutorial.html` | Tutorial chapter selection |
| `tutorial-battle.html?chapter=0` | Guided practice; URL switches to `resume=1` after initialization |
| `account.html` | Nickname, sign-in/out and profile management |
| `cloud-decks.html` | Private/public cloud deck CRUD |
| `history.html` | Own online/manual result CRUD and sync |
| `rankings.html` | Player rankings |
| `deck-rankings.html` | Published deck rankings |
| `card-rankings.html` | Card adoption rankings |
| `avatar-rankings.html` | Avatar rankings |

`community.html?tab=...` is a compatibility redirect to the corresponding independent account/ranking page. Unknown tab values go to player rankings; redirects never accept arbitrary URLs. Existing online room links continue to use `online-play.html?room=...`.

## State and lifecycle

- Local matches retain the existing `sorcery.match` format. Setup writes the match before opening `battle.html`; the battlefield restores it on reload. Opening a battlefield with no saved match displays a link to select a mode instead of creating a game silently.
- Tutorials keep their existing `TUTORIAL_KEY` checkpoint and never replace the normal match. The chapter menu and tutorial battlefield are different documents. Refreshing a practice scene resumes its recorded step. Leaving returns to the home page; the normal match remains resumable.
- Unsaved editor content is kept under tab-scoped `sorcery.deckDraft`. Editor/catalogue filters and editor pane state are also tab-scoped, stored independently per feature. Explicitly saved local decks still use `sorcery.decks`.
- Google Auth persists through Firebase; cloud data remains under the same UID-owned paths. The account, deck and history pages render only their own controls. Private page content is removed on pagehide, and back/forward-cache restoration reloads the authenticated owner view.
- Online presence/reconnect and fifteen-minute cleanup retain their existing protocol and UID seat ownership. Shared game rules/rendering remain in modules rather than being duplicated in HTML.

## Layout isolation

Homepage/mode selection load the home skin and ranking preview styles, without battlefield scene, mobile realm or battle-effect initialization. Local, online and teaching battlefields load the battle styles but no home skin. Deck editor, catalogue, setup and chapter pages load the archive/page styles. Profile/statistics pages use only community styles.

Page titles use explicit Chinese/English labels instead of partial automatic translations. Navigation changes the actual URL/document; it does not hide a battle inside the home page. Card-detail and game-choice popups remain reusable UI within the relevant feature.

## Verification

`tests/page-routes.test.js` checks distinct real destinations, Github Pages base paths, encoded parameters, page/style boundaries, private scopes and legacy redirects. The browser workflow covers home → mode selection → setup → battle, opening hands, legal target highlighting, site play, reload with the same site and hand, deck draft/catalogue filter restoration, tutorial checkpoint restore without changing the normal match, all four ranking URLs, and profile/cloud/history CRUD with isolated test identities using the deployed Firebase rules.

## Player center

The homepage profile links to `player.html`; every shared settings menu and battlefield match menu also includes this link. `account.html`, `cloud-decks.html` and `history.html` remain independent management documents and link back to the center. Nickname changes reuse the existing owner-scoped profile mutation. No Google name/email is shown publicly.

The center reads only the current authenticated UID's private account, clears private state on account changes/pagehide, and reloads on back/forward-cache restoration. Summary totals exclude deleted records; private decks appear only in the owner's deck list and never the deck-rank summary. Player/deck positions use the existing public leaderboard ordering; identical published decklists share aggregate rank. Rankings failing to load do not block private account access.

A saved local match is labeled as belonging to this device. An online rejoin link is shown only after checking the saved UID and live room membership/status. Visiting the center does not create, join, clean, or mutate a room. The existing fifteen-minute offline cleanup remains unchanged.

Browser checks use a generated isolated UID against deployed RTDB rules for nickname editing, private deck creation, manual result creation, summary/ranking display, locale changes, phone portrait/landscape and logout clearing. No test results are left in the public database.
