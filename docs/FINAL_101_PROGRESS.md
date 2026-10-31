# 最終 101 張卡牌持續實作進度

更新：2026-10-31T00:16:12.588Z。**尚未完成全部101張。** 完成核心效果＋逐卡效果測試 101 張、部分實作 0 張、尚未開始 0 張，合計101。完整官方全卡交互驗收0張。

目前 1093 張可選、7 種衍生物、0 筆未開放（包括已有部分程式但不可選的卡，與上述「尚未開始」分類不同）。完整 Node 測試 2721/2721 通過；包含未開放helper，不能以測試數推算完成張數。

## 回復基準

- 初始完整目錄備份：`/tmp/sorcery-play-baselines/sorcery-play-20261030T120940Z.tar.gz`
- SHA-256：`03cecc5116d7c716fb9767d574c06649dee605a8980890a1fc9950d9b79b15db`
- 不可變原始清單：`data/final-101-baseline.json`（101張，每張原始卡文、狀態及可選旗標）
- 此目錄沒有Git；未推送或部署，也未更動Firebase設定。

## 下一步

1. 依下面未開放清單與每組詳情補齊核心效果；每張必須包含施放成本、選擇、結算與真實dispatch測試。
2. 優先完成已有草稿的卡，核實其官方FAQ；沒有可靠規則證據就維持不可選。
3. 全部完成後執行完整Node測試、16配對對局與瀏覽器互動驗證；目前不能宣稱全卡規則完成。

## 101 張逐張追蹤

完成＝卡面核心效果已接入真實流程且有效果測試，不代表所有官方全卡交互驗收。部分＝核心整合、必要裁定或自動執行仍缺；尚未開始＝未有可操作核心效果（可能已有研究）。Chaos Twister依使用者指定採20格隨機數位替代，非官方實體吹牌；Demonic Contract為人工確認分類的已實作流程，不宣稱自動分類。瀏覽器與預組對局不取代逐卡效果測試。

| 卡牌 | 原始 | 本輪狀態 | 實作／測試／詳情 |
| --- | --- | --- | --- |
| Aethermoeba (aethermoeba) | 未開始 | 完成核心＋效果測試（可選） | [src/final-geometry.js](../src/final-geometry.js) · [tests/final-geometry.test.js](../tests/final-geometry.test.js) · [docs/final-geometry.md](../docs/final-geometry.md) |
| Altar of Malachai (altar_of_malachai) | 未開始 | 完成核心＋效果測試（可選） | [src/final-altar.js](../src/final-altar.js) · [tests/final-altar.test.js](../tests/final-altar.test.js) · [docs/final-altar.md](../docs/final-altar.md) |
| Animist (animist) | 未開始 | 完成核心＋效果測試（可選） | [src/final-avatars.js](../src/final-avatars.js) · [tests/final-avatars.test.js](../tests/final-avatars.test.js) · [docs/final-avatars.md](../docs/final-avatars.md) |
| Archimago (archimago) | 未開始 | 完成核心＋效果測試（可選） | [src/final-avatars.js](../src/final-avatars.js) · [tests/final-avatars.test.js](../tests/final-avatars.test.js) · [docs/final-avatars.md](../docs/final-avatars.md) |
| Avatar of Fire (avatar_of_fire) | 未開始 | 完成核心＋效果測試（可選） | [src/final-avatars.js](../src/final-avatars.js) · [tests/final-avatars.test.js](../tests/final-avatars.test.js) · [docs/final-avatars.md](../docs/final-avatars.md) |
| Avatar of Water (avatar_of_water) | 未開始 | 完成核心＋效果測試（可選） | [src/final-avatars.js](../src/final-avatars.js) · [tests/final-avatars.test.js](../tests/final-avatars.test.js) · [docs/final-avatars.md](../docs/final-avatars.md) |
| Blasted Oak (blasted_oak) | 未開始 | 完成核心＋效果測試（可選） | [src/final-passives.js](../src/final-passives.js) · [tests/final-passives.test.js](../tests/final-passives.test.js) · [docs/final-oak.md](../docs/final-oak.md) |
| Book of Blessings (book_of_blessings) | 未開始 | 完成核心＋效果測試（可選） | [src/final-passives.js](../src/final-passives.js) · [tests/final-passives.test.js](../tests/final-passives.test.js) · [docs/final-passives.md](../docs/final-passives.md) |
| Bureau of Occult Control (bureau_of_occult_control) | 未開始 | 完成核心＋效果測試（可選） | [src/cemetery-access.js](../src/cemetery-access.js) · [tests/cemetery-access.test.js](../tests/cemetery-access.test.js) · [docs/final-passives.md](../docs/final-passives.md) |
| Burning Hands (burning_hands) | 未開始 | 完成核心＋效果測試（可選） | [src/final-grids.js](../src/final-grids.js) · [tests/final-grids.test.js](../tests/final-grids.test.js) · [docs/final-grids.md](../docs/final-grids.md) |
| Cage of Sidrak (cage_of_sidrak) | 未開始 | 完成核心＋效果測試（可選） | [src/final-artifacts.js](../src/final-artifacts.js) · [tests/final-artifacts.test.js](../tests/final-artifacts.test.js) · [docs/final-artifacts.md](../docs/final-artifacts.md) |
| Captain Baldassare (captain_baldassare) | 未開始 | 完成核心＋效果測試（可選） | [src/final-units.js](../src/final-units.js) · [tests/final-units.test.js](../tests/final-units.test.js) · [docs/final-units.md](../docs/final-units.md) |
| Cerberus in Chains (cerberus_in_chains) | 未開始 | 完成核心＋效果測試（可選） | [src/final-geometry.js](../src/final-geometry.js) · [tests/final-geometry.test.js](../tests/final-geometry.test.js) · [docs/final-geometry.md](../docs/final-geometry.md) |
| Chaos Twister (chaos_twister) | 未開始 | 完成核心＋效果測試（可選） | [src/final-effects.js](../src/final-effects.js) · [tests/final-effects.test.js](../tests/final-effects.test.js) · [docs/final-effects.md](../docs/final-effects.md) |
| Chaoswish (chaoswish) | 未開始 | 完成核心＋效果測試（可選） | [src/final-chaos.js](../src/final-chaos.js) · [tests/final-chaos.test.js](../tests/final-chaos.test.js) |
| City of Souls (city_of_souls) | 未開始 | 完成核心＋效果測試（可選） | [src/final-site-damage.js](../src/final-site-damage.js) · [tests/final-site-damage.test.js](../tests/final-site-damage.test.js) · [docs/final-site-damage.md](../docs/final-site-damage.md) |
| Corpse Catapult (corpse_catapult) | 未開始 | 完成核心＋效果測試（可選） | [src/final-artifacts.js](../src/final-artifacts.js) · [tests/final-artifacts.test.js](../tests/final-artifacts.test.js) · [docs/final-artifacts.md](../docs/final-artifacts.md) |
| Corpse Explosion (corpse_explosion) | 未開始 | 完成核心＋效果測試（可選） | [src/final-effects.js](../src/final-effects.js) · [tests/final-effects.test.js](../tests/final-effects.test.js) · [docs/final-effects.md](../docs/final-effects.md) |
| Corruptor (corruptor) | 未開始 | 完成核心＋效果測試（可選） | [src/final-types.js](../src/final-types.js) · [tests/final-types.test.js](../tests/final-types.test.js) · [docs/final-types.md](../docs/final-types.md) |
| Courtesan Thaïs (courtesan_thais) | 未開始 | 完成核心＋效果測試（可選） | [src/final-control.js](../src/final-control.js) · [tests/final-control.test.js](../tests/final-control.test.js) · [docs/final-control.md](../docs/final-control.md) |
| Crave Golem (crave_golem) | 未開始 | 完成核心＋效果測試（可選） | [src/final-units.js](../src/final-units.js) · [tests/final-units.test.js](../tests/final-units.test.js) · [docs/final-units.md](../docs/final-units.md) |
| Dame Britomart (dame_britomart) | 未開始 | 完成核心＋效果測試（可選） | [src/final-units.js](../src/final-units.js) · [tests/final-units.test.js](../tests/final-units.test.js) · [docs/final-units.md](../docs/final-units.md) |
| Darkest Dungeon (darkest_dungeon) | 未開始 | 完成核心＋效果測試（可選） | [src/final-sites.js](../src/final-sites.js) · [tests/final-sites.test.js](../tests/final-sites.test.js) · [docs/final-sites.md](../docs/final-sites.md) |
| Day of Judgment (day_of_judgment) | 未開始 | 完成核心＋效果測試（可選） | [src/final-grids.js](../src/final-grids.js) · [tests/final-grids.test.js](../tests/final-grids.test.js) · [docs/final-grids.md](../docs/final-grids.md) |
| Deathspeaker (deathspeaker) | 未開始 | 完成核心＋效果測試（可選） | [src/final-avatars.js](../src/final-avatars.js) · [tests/final-avatars.test.js](../tests/final-avatars.test.js) · [docs/final-avatars.md](../docs/final-avatars.md) |
| Demonic Contract (demonic_contract) | 未開始 | 完成核心＋效果測試（可選） | [src/final-effects.js](../src/final-effects.js) · [tests/final-effects.test.js](../tests/final-effects.test.js) · [docs/final-effects.md](../docs/final-effects.md) |
| Dhol Chants (dhol_chants) | 未開始 | 完成核心＋效果測試（可選） | [src/final-effects.js](../src/final-effects.js) · [tests/final-effects.test.js](../tests/final-effects.test.js) · [docs/final-effects.md](../docs/final-effects.md) |
| Dodge Roll (dodge_roll) | 未開始 | 完成核心＋效果測試（可選） | [src/final-reactions.js](../src/final-reactions.js) · [tests/final-reactions.test.js](../tests/final-reactions.test.js) · [docs/final-reactions.md](../docs/final-reactions.md) |
| Doomsday Device (doomsday_device) | 未開始 | 完成核心＋效果測試（可選） | [src/final-artifacts.js](../src/final-artifacts.js) · [tests/final-artifacts.test.js](../tests/final-artifacts.test.js) · [docs/final-artifacts.md](../docs/final-artifacts.md) |
| Dragonlord (dragonlord) | 未開始 | 完成核心＋效果測試（可選） | [src/ability-sources.js](../src/ability-sources.js) · [tests/ability-sources.test.js](../tests/ability-sources.test.js) · [docs/final-avatars.md](../docs/final-avatars.md) |
| Earthquake (earthquake) | 未開始 | 完成核心＋效果測試（可選） | [src/final-effects.js](../src/final-effects.js) · [tests/final-effects.test.js](../tests/final-effects.test.js) · [docs/final-effects.md](../docs/final-effects.md) |
| Edge of the World (edge_of_the_world) | 未開始 | 完成核心＋效果測試（可選） | [src/final-geometry.js](../src/final-geometry.js) · [tests/final-geometry.test.js](../tests/final-geometry.test.js) · [docs/final-geometry.md](../docs/final-geometry.md) |
| Enchantress (enchantress) | 未開始 | 完成核心＋效果測試（可選） | [src/final-animation.js](../src/final-animation.js) · [tests/final-animation.test.js](../tests/final-animation.test.js) · [docs/final-animation.md](../docs/final-animation.md) |
| Felbog Frog Men (felbog_frog_men) | 未開始 | 完成核心＋效果測試（可選） | [src/final-geometry.js](../src/final-geometry.js) · [tests/final-geometry.test.js](../tests/final-geometry.test.js) · [docs/final-geometry.md](../docs/final-geometry.md) |
| Firebreathing (firebreathing) | 未開始 | 完成核心＋效果測試（可選） | [src/final-grids.js](../src/final-grids.js) · [tests/final-grids.test.js](../tests/final-grids.test.js) · [docs/final-grids.md](../docs/final-grids.md) |
| Flame Strike (flame_strike) | 未開始 | 完成核心＋效果測試（可選） | [src/final-grids.js](../src/final-grids.js) · [tests/final-grids.test.js](../tests/final-grids.test.js) · [docs/final-grids.md](../docs/final-grids.md) |
| Flame Wave (flame_wave) | 未開始 | 完成核心＋效果測試（可選） | [src/final-grids.js](../src/final-grids.js) · [tests/final-grids.test.js](../tests/final-grids.test.js) · [docs/final-grids.md](../docs/final-grids.md) |
| Free City (free_city) | 未開始 | 完成核心＋效果測試（可選） | [src/final-built-sites.js](../src/final-built-sites.js) · [tests/final-built-sites.test.js](../tests/final-built-sites.test.js) · [docs/final-built-sites.md](../docs/final-built-sites.md) |
| Giant Shark (giant_shark) | 未開始 | 完成核心＋效果測試（可選） | [src/final-units.js](../src/final-units.js) · [tests/final-units.test.js](../tests/final-units.test.js) · [docs/final-units.md](../docs/final-units.md) |
| Gnarled Wendigo (gnarled_wendigo) | 未開始 | 完成核心＋效果測試（可選） | [src/final-units.js](../src/final-units.js) · [tests/final-units.test.js](../tests/final-units.test.js) · [docs/final-units.md](../docs/final-units.md) |
| Grigori Rasputin (grigori_rasputin) | 未開始 | 完成核心＋效果測試（可選） | [src/final-units.js](../src/final-units.js) · [tests/final-units.test.js](../tests/final-units.test.js) · [docs/final-units.md](../docs/final-units.md) |
| Grösse Poltergeist (grosse_poltergeist) | 未開始 | 完成核心＋效果測試（可選） | [src/final-units.js](../src/final-units.js) · [tests/final-units.test.js](../tests/final-units.test.js) · [docs/final-units.md](../docs/final-units.md) |
| Hellstar (hellstar) | 未開始 | 完成核心＋效果測試（可選） | [src/final-grids.js](../src/final-grids.js) · [tests/final-grids.test.js](../tests/final-grids.test.js) · [docs/final-grids.md](../docs/final-grids.md) |
| Holy Nova (holy_nova) | 未開始 | 完成核心＋效果測試（可選） | [src/final-grids.js](../src/final-grids.js) · [tests/final-holy-locations.test.js](../tests/final-holy-locations.test.js) · [docs/final-rules-open-questions.md](../docs/final-rules-open-questions.md) |
| I Am Colossus! (i_am_colossus) | 未開始 | 完成核心＋效果測試（可選） | [src/final-units.js](../src/final-units.js) · [tests/final-units.test.js](../tests/final-units.test.js) · [docs/final-units.md](../docs/final-units.md) |
| Imposter (imposter) | 未開始 | 完成核心＋效果測試（可選） | [src/ability-sources.js](../src/ability-sources.js) · [tests/ability-sources.test.js](../tests/ability-sources.test.js) · [docs/final-avatars.md](../docs/final-avatars.md) |
| Infusion Factory (infusion_factory) | 未開始 | 完成核心＋效果測試（可選） | [src/final-factory.js](../src/final-factory.js) · [tests/final-factory.test.js](../tests/final-factory.test.js) · [docs/final-animation.md](../docs/final-animation.md) |
| Jack the Ripper (jack_the_ripper) | 未開始 | 完成核心＋效果測試（可選） | [src/final-units.js](../src/final-units.js) · [tests/final-units.test.js](../tests/final-units.test.js) · [docs/final-units.md](../docs/final-units.md) |
| Joust! (joust) | 未開始 | 完成核心＋效果測試（可選） | [src/final-effects.js](../src/final-effects.js) · [tests/final-effects.test.js](../tests/final-effects.test.js) · [docs/final-effects.md](../docs/final-effects.md) |
| Kairos the Archivist (kairos_the_archivist) | 未開始 | 完成核心＋效果測試（可選） | [src/final-units.js](../src/final-units.js) · [tests/final-units.test.js](../tests/final-units.test.js) · [docs/final-units.md](../docs/final-units.md) |
| Karkemish Chimera (karkemish_chimera) | 未開始 | 完成核心＋效果測試（可選） | [src/final-units.js](../src/final-units.js) · [tests/final-units.test.js](../tests/final-units.test.js) · [docs/final-units.md](../docs/final-units.md) |
| Key to the City (key_to_the_city) | 未開始 | 完成核心＋效果測試（可選） | [src/final-ability-layers.js](../src/final-ability-layers.js) · [tests/final-key.test.js](../tests/final-key.test.js) · [docs/final-artifacts.md](../docs/final-artifacts.md) |
| Koschei's Egg (koscheis_egg) | 未開始 | 完成核心＋效果測試（可選） | [src/final-artifacts.js](../src/final-artifacts.js) · [tests/final-artifacts.test.js](../tests/final-artifacts.test.js) · [docs/final-artifacts.md](../docs/final-artifacts.md) |
| Lava Flow (lava_flow) | 未開始 | 完成核心＋效果測試（可選） | [src/final-grids.js](../src/final-grids.js) · [tests/final-grids.test.js](../tests/final-grids.test.js) · [docs/final-grids.md](../docs/final-grids.md) |
| Led Astray (led_astray) | 未開始 | 完成核心＋效果測試（可選） | [src/final-effects.js](../src/final-effects.js) · [tests/final-effects.test.js](../tests/final-effects.test.js) · [docs/final-effects.md](../docs/final-effects.md) |
| Magellan Globe (magellan_globe) | 未開始 | 完成核心＋效果測試（可選） | [src/final-geometry.js](../src/final-geometry.js) · [tests/final-geometry.test.js](../tests/final-geometry.test.js) · [docs/final-geometry.md](../docs/final-geometry.md) |
| Magician (magician) | 未開始 | 完成核心＋效果測試（可選） | [src/final-avatars.js](../src/final-avatars.js) · [tests/final-avatars.test.js](../tests/final-avatars.test.js) · [docs/final-avatars.md](../docs/final-avatars.md) |
| Megamoeba (megamoeba) | 未開始 | 完成核心＋效果測試（可選） | [src/final-geometry.js](../src/final-geometry.js) · [tests/final-geometry.test.js](../tests/final-geometry.test.js) · [docs/final-geometry.md](../docs/final-geometry.md) |
| Mephistopheles (mephistopheles) | 未開始 | 完成核心＋效果測試（可選） | [src/final-avatars.js](../src/final-avatars.js) · [tests/final-avatars.test.js](../tests/final-avatars.test.js) · [docs/final-avatars.md](../docs/final-avatars.md) |
| Mester Stoor Worm (mester_stoor_worm) | 未開始 | 完成核心＋效果測試（可選） | [src/final-grids.js](../src/final-grids.js) · [tests/final-grids.test.js](../tests/final-grids.test.js) · [docs/final-grids.md](../docs/final-grids.md) |
| Meteor Shower (meteor_shower) | 未開始 | 完成核心＋效果測試（可選） | [src/final-grids.js](../src/final-grids.js) · [tests/final-grids.test.js](../tests/final-grids.test.js) · [docs/final-grids.md](../docs/final-grids.md) |
| Mimic (mimic) | 未開始 | 完成核心＋效果測試（可選） | [src/final-units.js](../src/final-units.js) · [tests/final-units.test.js](../tests/final-units.test.js) · [docs/final-units.md](../docs/final-units.md) |
| Mismanaged Mortuary (mismanaged_mortuary) | 未開始 | 完成核心＋效果測試（可選） | [src/cemetery-access.js](../src/cemetery-access.js) · [tests/cemetery-access.test.js](../tests/cemetery-access.test.js) · [docs/final-passives.md](../docs/final-passives.md) |
| Monastery Gargoyle (monastery_gargoyle) | 未開始 | 完成核心＋效果測試（可選） | [src/final-units.js](../src/final-units.js) · [tests/final-units.test.js](../tests/final-units.test.js) · [docs/final-units.md](../docs/final-units.md) |
| Mortal Soil (mortal_soil) | 未開始 | 完成核心＋效果測試（可選） | [src/final-site-damage.js](../src/final-site-damage.js) · [tests/final-site-damage.test.js](../tests/final-site-damage.test.js) · [docs/final-site-damage.md](../docs/final-site-damage.md) |
| Mount Ussar Sanctuary (mount_ussar_sanctuary) | 未開始 | 完成核心＋效果測試（可選） | [src/final-sites.js](../src/final-sites.js) · [tests/final-sites.test.js](../tests/final-sites.test.js) · [docs/final-sites.md](../docs/final-sites.md) |
| Mudslide (mudslide) | 未開始 | 完成核心＋效果測試（可選） | [src/final-sites.js](../src/final-sites.js) · [tests/final-sites.test.js](../tests/final-sites.test.js) · [docs/final-sites.md](../docs/final-sites.md) |
| Orb of Ba'al Berith (orb_of_baal_berith) | 未開始 | 完成核心＋效果測試（可選） | [src/final-orb.js](../src/final-orb.js) · [tests/final-orb.test.js](../tests/final-orb.test.js) · [docs/final-orb.md](../docs/final-orb.md) |
| Order of the White Wing (order_of_the_white_wing) | 未開始 | 完成核心＋效果測試（可選） | [src/final-passives.js](../src/final-passives.js) · [tests/final-passives.test.js](../tests/final-passives.test.js) · [docs/final-passives.md](../docs/final-passives.md) |
| Orpheus' Crossing (orpheus_crossing) | 未開始 | 完成核心＋效果測試（可選） | [src/final-sites.js](../src/final-sites.js) · [tests/final-sites.test.js](../tests/final-sites.test.js) · [docs/final-sites.md](../docs/final-sites.md) |
| Pathfinder (pathfinder) | 未開始 | 完成核心＋效果測試（可選） | [src/final-avatars.js](../src/final-avatars.js) · [tests/final-avatars.test.js](../tests/final-avatars.test.js) · [docs/final-avatars.md](../docs/final-avatars.md) |
| Persecutor (persecutor) | 未開始 | 完成核心＋效果測試（可選） | [src/final-types.js](../src/final-types.js) · [tests/final-types.test.js](../tests/final-types.test.js) · [docs/final-types.md](../docs/final-types.md) |
| Putrid Presence (putrid_presence) | 未開始 | 完成核心＋效果測試（可選） | [src/final-geometry.js](../src/final-geometry.js) · [tests/final-geometry.test.js](../tests/final-geometry.test.js) · [docs/final-geometry.md](../docs/final-geometry.md) |
| Realm-Eater (realm_eater) | 未開始 | 完成核心＋效果測試（可選） | [src/final-avatars.js](../src/final-avatars.js) · [tests/final-avatars.test.js](../tests/final-avatars.test.js) · [docs/final-avatars.md](../docs/final-avatars.md) |
| Red Rock of Ravannis (red_rock_of_ravannis) | 未開始 | 完成核心＋效果測試（可選） | [src/final-passives.js](../src/final-passives.js) · [tests/final-passives.test.js](../tests/final-passives.test.js) · [docs/final-passives.md](../docs/final-passives.md) |
| Rift Valley (rift_valley) | 未開始 | 完成核心＋效果測試（可選） | [src/final-built-sites.js](../src/final-built-sites.js) · [tests/final-built-sites.test.js](../tests/final-built-sites.test.js) · [docs/final-built-sites.md](../docs/final-built-sites.md) |
| Royal Bodyguard (royal_bodyguard) | 未開始 | 完成核心＋效果測試（可選） | [src/final-damage.js](../src/final-damage.js) · [tests/final-damage.test.js](../tests/final-damage.test.js) · [docs/final-damage.md](../docs/final-damage.md) |
| Saint of Redemption (saint_of_redemption) | 未開始 | 完成核心＋效果測試（可選） | [src/final-passives.js](../src/final-passives.js) · [tests/final-passives.test.js](../tests/final-passives.test.js) · [docs/final-passives.md](../docs/final-passives.md) |
| Sea Raider (sea_raider) | 未開始 | 完成核心＋效果測試（可選） | [src/final-units.js](../src/final-units.js) · [tests/final-units.test.js](../tests/final-units.test.js) · [docs/final-units.md](../docs/final-units.md) |
| Sir Gawain (sir_gawain) | 未開始 | 完成核心＋效果測試（可選） | [src/final-damage.js](../src/final-damage.js) · [tests/final-damage.test.js](../tests/final-damage.test.js) · [docs/final-damage.md](../docs/final-damage.md) |
| Snowball (snowball) | 未開始 | 完成核心＋效果測試（可選） | [src/final-waves.js](../src/final-waves.js) · [tests/final-waves.test.js](../tests/final-waves.test.js) · [docs/final-waves.md](../docs/final-waves.md) |
| Stitched Abomination (stitched_abomination) | 未開始 | 完成核心＋效果測試（可選） | [src/final-units.js](../src/final-units.js) · [tests/final-units.test.js](../tests/final-units.test.js) · [docs/final-units.md](../docs/final-units.md) |
| Tabula Rasa (tabula_rasa) | 未開始 | 完成核心＋效果測試（可選） | [src/final-artifacts.js](../src/final-artifacts.js) · [tests/final-artifacts.test.js](../tests/final-artifacts.test.js) · [docs/final-artifacts.md](../docs/final-artifacts.md) |
| The Apex of Babel (the_apex_of_babel) | 未開始 | 完成核心＋效果測試（可選） | [src/final-built-sites.js](../src/final-built-sites.js) · [tests/final-built-sites.test.js](../tests/final-built-sites.test.js) · [docs/final-built-sites.md](../docs/final-built-sites.md) |
| The Base of Babel (the_base_of_babel) | 未開始 | 完成核心＋效果測試（可選） | [src/final-built-sites.js](../src/final-built-sites.js) · [tests/final-built-sites.test.js](../tests/final-built-sites.test.js) · [docs/final-built-sites.md](../docs/final-built-sites.md) |
| The Flood (the_flood) | 未開始 | 完成核心＋效果測試（可選） | [src/final-flood.js](../src/final-flood.js) · [tests/final-flood.test.js](../tests/final-flood.test.js) · [docs/final-flood.md](../docs/final-flood.md) |
| The Immortal Throne (the_immortal_throne) | 未開始 | 完成核心＋效果測試（可選） | [src/final-passives.js](../src/final-passives.js) · [tests/final-passives.test.js](../tests/final-passives.test.js) · [docs/final-passives.md](../docs/final-passives.md) |
| The Inquisition (the_inquisition) | 未開始 | 完成核心＋效果測試（可選） | [src/final-units.js](../src/final-units.js) · [tests/final-units.test.js](../tests/final-units.test.js) · [docs/final-units.md](../docs/final-units.md) |
| The Malleus Maleficarum (the_malleus_maleficarum) | 未開始 | 完成核心＋效果測試（可選） | [src/final-malleus.js](../src/final-malleus.js) · [tests/final-malleus.test.js](../tests/final-malleus.test.js) · [docs/final-malleus.md](../docs/final-malleus.md) |
| The Pallid Bust (the_pallid_bust) | 未開始 | 完成核心＋效果測試（可選） | [src/final-artifacts.js](../src/final-artifacts.js) · [tests/gained-unmodifiable.test.js](../tests/gained-unmodifiable.test.js) · [docs/final-pallid-progress.md](../docs/final-pallid-progress.md) |
| The Rack (the_rack) | 未開始 | 完成核心＋效果測試（可選） | [src/final-geometry.js](../src/final-geometry.js) · [tests/final-geometry.test.js](../tests/final-geometry.test.js) · [docs/final-geometry.md](../docs/final-geometry.md) |
| The Void (the_void) | 未開始 | 完成核心＋效果測試（可選） | [src/final-geometry.js](../src/final-geometry.js) · [tests/final-geometry.test.js](../tests/final-geometry.test.js) · [docs/final-geometry.md](../docs/final-geometry.md) |
| Tombstone Wardens (tombstone_wardens) | 未開始 | 完成核心＋效果測試（可選） | [src/final-artifacts.js](../src/final-artifacts.js) · [tests/final-artifacts.test.js](../tests/final-artifacts.test.js) · [docs/final-artifacts.md](../docs/final-artifacts.md) |
| Tringh Constrictor (tringh_constrictor) | 未開始 | 完成核心＋效果測試（可選） | [src/final-units.js](../src/final-units.js) · [tests/final-units.test.js](../tests/final-units.test.js) · [docs/final-units.md](../docs/final-units.md) |
| Valor (valor) | 未開始 | 完成核心＋效果測試（可選） | [src/final-reactions.js](../src/final-reactions.js) · [tests/final-reactions.test.js](../tests/final-reactions.test.js) · [docs/final-reactions.md](../docs/final-reactions.md) |
| Vindictive Nation (vindictive_nation) | 未開始 | 完成核心＋效果測試（可選） | [src/final-built-sites.js](../src/final-built-sites.js) · [tests/final-built-sites.test.js](../tests/final-built-sites.test.js) · [docs/final-built-sites.md](../docs/final-built-sites.md) |
| Vivien the Enchantress (vivien_the_enchantress) | 未開始 | 完成核心＋效果測試（可選） | [src/final-vivien.js](../src/final-vivien.js) · [tests/final-vivien.test.js](../tests/final-vivien.test.js) · [docs/final-vivien-readiness.md](../docs/final-vivien-readiness.md) |
| Wave of Eviction (wave_of_eviction) | 未開始 | 完成核心＋效果測試（可選） | [src/final-waves.js](../src/final-waves.js) · [tests/final-waves.test.js](../tests/final-waves.test.js) · [docs/final-waves.md](../docs/final-waves.md) |
| Wormelow Tump (wormelow_tump) | 未開始 | 完成核心＋效果測試（可選） | [src/cemetery-access.js](../src/cemetery-access.js) · [tests/cemetery-access.test.js](../tests/cemetery-access.test.js) · [docs/final-passives.md](../docs/final-passives.md) |
| Wreathed in Righteousness (wreathed_in_righteousness) | 未開始 | 完成核心＋效果測試（可選） | [src/final-grids.js](../src/final-grids.js) · [tests/final-grids.test.js](../tests/final-grids.test.js) · [docs/final-grids.md](../docs/final-grids.md) |
| Yog-Sothoth (yog_sothoth) | 未開始 | 完成核心＋效果測試（可選） | [src/final-geometry.js](../src/final-geometry.js) · [tests/final-geometry.test.js](../tests/final-geometry.test.js) · [docs/final-geometry.md](../docs/final-geometry.md) |

機器可讀完整證據：`data/final-101-progress.json`；真實測試輸出：`data/final-101-test-results.tap`。
