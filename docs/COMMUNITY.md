# Community CRUD and casual rankings

Entry: `community.html`, linked from the home menu, deck editor and online lobby. This release deliberately uses the existing Realtime Database and Google Auth; no Firestore, Functions, Node hosting or billing upgrade is required.

## Behavior

- Google users create/read/update their display name (24 Unicode characters), cloud deck drafts and match records. Names need not be unique and do not copy Google email/name to public data.
- Cloud decks support create, import from official/local presets or existing JSON/text import formats, edit/rename, publish/unpublish, local download and delete. Legal cloud decks load into the online lobby on login. Saving a draft does not require a legal deck; adding match results does.
- A completed Firebase online game saves the signed-in player's result. The other participant saves their own result independently. Existing games created before this release are recorded only when an ended room is revisited or the latest saved room is synchronized. Local games, AI games and tutorials are not automatically recorded. Closing immediately or going offline before synchronization can delay saving; **Sync latest online game** retries from the saved room while it still exists.
- Results can be added manually, corrected or deleted. Source is shown as manual/online, with owner corrections marked. A deleted result leaves a private tombstone; automatic retries cannot restore it or overwrite a correction. Match IDs combine room code with the immutable creation timestamp, so reused codes do not collide.
- Profile/cloud decks/history and derived public summary are updated in one owner-subtree transaction. Concurrent changes retry instead of losing edits. A directory entry is registered after this transaction; a failed directory write is repaired by retrying the operation.
- Account deletion removes the directory entry and community account data, not Google Auth or local browser decks. Reopening an ended game after deleting all community data can create a new record again, since account deletion also removes its tombstones.

## Rankings

All-time, **casual / self-reported**, with no Elo or verified competitive claims. Players rank by wins. Decks, cards and avatars default to appearances. Win-rate sorting requires at least five player-game appearances. A draw contributes one game and zero wins to the displayed win rate.

Deck identity hashes the avatar, sorted Atlas/Spellbook card IDs including quantities, collection and set-aside Dragon. Name and card order do not change identity. Equal decks across accounts aggregate, and each account is counted once in the deck's users metric.

Only explicitly published cloud decklists contribute to deck/card rankings. Match snapshots must have the same identity as a currently published cloud deck. Renaming retains statistics; changing contents creates another identity; unpublishing/deleting removes its public deck and card statistics without deleting private results or player/avatar totals. If another copy of the same deck remains published, that identity remains published.

Card adoption = appearances containing a card / appearances with a published deck. Duplicate copies in one player-game count once toward adoption; average copies uses total copies / appearances containing the card. This is **deck adoption**, not actual spell-casting frequency. Atlas and Spellbook filters are available. Avatar usage counts each participant's appearance, including private decks. These denominators describe player-games, not unique matches.

No old results or player numbers are fabricated. Leaderboards are public-readable. Private decklists/full history are owner-only. Published card counts can describe a player's published decks; private deck composition is omitted from the public summary.

## Data and authorization

- `communityAccountsV1/{uid}/profile`: private display-name settings.
- `communityAccountsV1/{uid}/decks/{id}`: private draft/cardlist and publication preference.
- `communityAccountsV1/{uid}/records/{id}`: private deck snapshot, result, provenance, correction/deletion fields.
- `communityAccountsV1/{uid}/public`: public display name, aggregate totals, avatar counts and opt-in deck/card summaries. Contains no email, opponent UID, room history or private decklists.
- `communityDirectoryV1/{uid}`: public `true` membership marker so visitors can locate public summaries; UIDs are opaque public identifiers, not credentials.

Rules allow Google-authenticated owners to modify only their own subtree and directory marker. They deny parent enumeration of private accounts, reads of others' decks/history, non-Google writes and unexpected schema fields. Existing online-room rules and fifteen-minute cleanup are unchanged. Owners remain trusted to report their results honestly; security rules do not prove match validity or prevent forged owner summaries. Upgrade to authoritative server validation before using these figures for competitive rewards.

Application limits: 100 cloud decks, 2,000 record entries including tombstones, 200 cards per main zone and 10 collection cards. Per-zone indexes and basic field validation are enforced in RTDB rules; account item-count caps are client-side bounds, not billing protection. This small-community version reads directory entries and public summaries on refresh; it does not claim scalable server-side leaderboard pagination. Private history is displayed in batches of 50.

## Verification

`node --test tests/community.test.js` checks deck identity/format, privacy, duplicate retries, corrections, tombstones, four aggregations and auth changes. `node tools/test-community-live.mjs --live` tests deployed RTDB rules using CLI credentials constrained by Google/non-Google auth overrides and only generated test UIDs; credentials are never emitted. It checks empty-array hydration, profile/deck/result/account CRUD, public/private access, concurrent edits, opt-in publication and cleanup.

`node tools/test-firebase-online-live.mjs --live` also replays the 119-command natural game against RTDB, then synchronizes inverse host/guest results exactly once. Its fixture rooms/accounts are isolated and cleaned; it does not replace browser OAuth verification.

Browser verification uses explicitly identified local test identities with deployed rules, never inserts fake player counts into the production UI, and keeps all fixture servers/screenshots in ignored `output/`. Chinese/English, 390px portrait and 844px landscape are covered. Production uses the existing Google OAuth module unchanged.

The original deck workshop also offers an explicit publication checkbox directly below the deck name, off by default. Private unlinked saves stay local and require no Google login. Publishing signs in and synchronizes the deck; later private/public changes update the same owned cloud entry. Local IDs survive failed sync retries and renames. Downloading another player's public deck creates a private copy; downloading one's own cloud deck retains its owner linkage so unpublishing from the workshop reaches the original entry. Official JSON exports never carry publication consent. Local saved-deck buttons show Public/Private status.
