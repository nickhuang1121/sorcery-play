> 續作狀態：新增 Lucid Dreamers 虛空召喚與能力到期效果；67 項效果測試通過。現為 992 張可選用、101 筆未開始。以下第 84–88 批是上一輪歷史紀錄。

# 實作進度

2026-10-30：本輪第 84–88 批新增 25 張；可選用卡牌由 966 增為 991，另有 7 種衍生物，未開始由 127 減為 102。**尚未完成全部剩餘卡牌。**

本輪執行 64 項 Node 效果與回歸測試，另有瀏覽器模組 smoke test；16 種官方 Beta 預組交叉對局皆完成至勝負。整合對局不能取代逐卡測試，也不保證新增卡牌在那些預組對局中出現。

## 本輪新增

- 第 84 批：Iron Man Talus、Driftwood Marrows、Hemogolem、Purge Juggernaut、Clay Golem。
- 第 85 批：Arcade of Bones、Land Deed、King Arthur、Endless Fence、Duplicator。
- 第 86 批：Swap、Backstab、Blasphemy、Awakened Mummies、Haystack。
- 第 87 批：Black Cat、Kythera Mechanism、Rat King、Undertaker Engine、Grim Reaper。
- 第 88 批：Arcane Barrage、Assorted Animals、Blaze of Glory、Monks of Kobalsa、The Doom of Dilmun。

## 重現驗證

```sh
npm test
npm run test:games
```

以本機 HTTP server 開啟 [tests/index.html](../tests/index.html) 執行瀏覽器驗證。此頁不寫入 localStorage。原 README 所述 1708 項測試及 UI 測試未隨專案提供，未把那些歷史數字算入本輪結果。

## 尚未實作的 102 筆

完整逐卡狀態見 [remaining-completion-plan.json](../data/remaining-completion-plan.json)；規則與 FAQ 見 [RULE_SOURCES.md](RULE_SOURCES.md)。

- Aethermoeba (`aethermoeba`)
- Altar of Malachai (`altar_of_malachai`)
- Animist (`animist`)
- Archimago (`archimago`)
- Avatar of Fire (`avatar_of_fire`)
- Avatar of Water (`avatar_of_water`)
- Blasted Oak (`blasted_oak`)
- Book of Blessings (`book_of_blessings`)
- Bureau of Occult Control (`bureau_of_occult_control`)
- Burning Hands (`burning_hands`)
- Cage of Sidrak (`cage_of_sidrak`)
- Captain Baldassare (`captain_baldassare`)
- Cerberus in Chains (`cerberus_in_chains`)
- Chaos Twister (`chaos_twister`)
- Chaoswish (`chaoswish`)
- City of Souls (`city_of_souls`)
- Corpse Catapult (`corpse_catapult`)
- Corpse Explosion (`corpse_explosion`)
- Corruptor (`corruptor`)
- Courtesan Thaïs (`courtesan_thais`)
- Crave Golem (`crave_golem`)
- Dame Britomart (`dame_britomart`)
- Darkest Dungeon (`darkest_dungeon`)
- Day of Judgment (`day_of_judgment`)
- Deathspeaker (`deathspeaker`)
- Demonic Contract (`demonic_contract`)
- Dhol Chants (`dhol_chants`)
- Dodge Roll (`dodge_roll`)
- Doomsday Device (`doomsday_device`)
- Dragonlord (`dragonlord`)
- Earthquake (`earthquake`)
- Edge of the World (`edge_of_the_world`)
- Enchantress (`enchantress`)
- Felbog Frog Men (`felbog_frog_men`)
- Firebreathing (`firebreathing`)
- Flame Strike (`flame_strike`)
- Flame Wave (`flame_wave`)
- Free City (`free_city`)
- Giant Shark (`giant_shark`)
- Gnarled Wendigo (`gnarled_wendigo`)
- Grigori Rasputin (`grigori_rasputin`)
- Grösse Poltergeist (`grosse_poltergeist`)
- Hellstar (`hellstar`)
- Holy Nova (`holy_nova`)
- I Am Colossus! (`i_am_colossus`)
- Imposter (`imposter`)
- Infusion Factory (`infusion_factory`)
- Jack the Ripper (`jack_the_ripper`)
- Joust! (`joust`)
- Kairos the Archivist (`kairos_the_archivist`)
- Karkemish Chimera (`karkemish_chimera`)
- Key to the City (`key_to_the_city`)
- Koschei's Egg (`koscheis_egg`)
- Lava Flow (`lava_flow`)
- Led Astray (`led_astray`)
- Lucid Dreamers (`lucid_dreamers`)
- Magellan Globe (`magellan_globe`)
- Magician (`magician`)
- Megamoeba (`megamoeba`)
- Mephistopheles (`mephistopheles`)
- Mester Stoor Worm (`mester_stoor_worm`)
- Meteor Shower (`meteor_shower`)
- Mimic (`mimic`)
- Mismanaged Mortuary (`mismanaged_mortuary`)
- Monastery Gargoyle (`monastery_gargoyle`)
- Mortal Soil (`mortal_soil`)
- Mount Ussar Sanctuary (`mount_ussar_sanctuary`)
- Mudslide (`mudslide`)
- Orb of Ba'al Berith (`orb_of_baal_berith`)
- Order of the White Wing (`order_of_the_white_wing`)
- Orpheus' Crossing (`orpheus_crossing`)
- Pathfinder (`pathfinder`)
- Persecutor (`persecutor`)
- Putrid Presence (`putrid_presence`)
- Realm-Eater (`realm_eater`)
- Red Rock of Ravannis (`red_rock_of_ravannis`)
- Rift Valley (`rift_valley`)
- Royal Bodyguard (`royal_bodyguard`)
- Saint of Redemption (`saint_of_redemption`)
- Sea Raider (`sea_raider`)
- Sir Gawain (`sir_gawain`)
- Snowball (`snowball`)
- Stitched Abomination (`stitched_abomination`)
- Tabula Rasa (`tabula_rasa`)
- The Apex of Babel (`the_apex_of_babel`)
- The Base of Babel (`the_base_of_babel`)
- The Flood (`the_flood`)
- The Immortal Throne (`the_immortal_throne`)
- The Inquisition (`the_inquisition`)
- The Malleus Maleficarum (`the_malleus_maleficarum`)
- The Pallid Bust (`the_pallid_bust`)
- The Rack (`the_rack`)
- The Void (`the_void`)
- Tombstone Wardens (`tombstone_wardens`)
- Tringh Constrictor (`tringh_constrictor`)
- Valor (`valor`)
- Vindictive Nation (`vindictive_nation`)
- Vivien the Enchantress (`vivien_the_enchantress`)
- Wave of Eviction (`wave_of_eviction`)
- Wormelow Tump (`wormelow_tump`)
- Wreathed in Righteousness (`wreathed_in_righteousness`)
- Yog-Sothoth (`yog_sothoth`)

## 驗證限制

見 [KNOWN_ISSUES.md](KNOWN_ISSUES.md)。完整實作數維持 0，因為全卡交互與完整官方 Storyline 驗收仍待完成。
