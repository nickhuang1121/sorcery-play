# 規則來源與本輪裁定核對

查閱日：2026-10-30。以下使用官方規則與 FAQ；未將未驗證卡牌標記為完成。

- [2026-10-12 官方規則更新](https://sorcerytcg.com/news/sorcery-contested-realm-october-2026-rules-update) 與 [Standard Rulebook](https://drive.google.com/file/d/1sgQo0xf0N2teIR0zlyl91g9j6LVncZnr/view)。
- [官方 Codex](https://sorcerytcg.com/codex)：施放、區域、傳送、自由移動、戰鬥、神器、不可修改、犧牲、Storyline、隨機及控制權。
- [官方卡牌資料 API](https://api.sorcerytcg.com/api/cards)：本輪 25 張的 engine 欄位與目前快照完全相同。
- 官方卡牌頁提供的 Codex／FAQ 資料共讀取到 969 筆；本輪適用的 FAQ ID、更新日期與核對摘要見 [rules-audit.json](../data/rules-audit.json)。這個數字表示取得的資料量，不表示所有條文已在引擎實作。

| 卡牌 | 實作採用的裁定 |
| --- | --- |
| [Iron Man Talus](https://sorcerytcg.com/cards/iron_man_talus) | 不可失能與強制移動；Swap 任一方無法傳送時雙方都不動。 |
| [Driftwood Marrows](https://sorcerytcg.com/cards/driftwood_marrows) | 附近友軍免於強制下潛；仍可自行使用 Submerge。 |
| [Hemogolem](https://sorcerytcg.com/cards/hemogolem) | 以實際 Strike 傷害治療；受到的傷害另對自己的 Avatar 造成傷害。 |
| [Purge Juggernaut](https://sorcerytcg.com/cards/purge_juggernaut) | 回合開始橫置、選相鄰合法位置移動，再殺死該處其他僕從。 |
| [Clay Golem](https://sorcerytcg.com/cards/clay_golem) | Deathrite 將 Atlas 頂牌放到相鄰虛空或 Rubble。 |
| [Arcade of Bones](https://sorcerytcg.com/cards/arcade_of_bones) | 同橫列 Undead 自由移動，且不受 Magic 指定與傷害。 |
| [Land Deed](https://sorcerytcg.com/cards/land_deed) | 僅取得神器所在那一格的地點；即時重算魔力；放下後還原。 |
| [King Arthur](https://sorcerytcg.com/cards/king_arthur) | 禁止控制別人擁有的牌；神器控制者與持有者分開處理。 |
| [Endless Fence](https://sorcerytcg.com/cards/endless_fence) | 阻止僕從從虛空進入圍欄所在的連續陸地。 |
| [Duplicator](https://sorcerytcg.com/cards/duplicator) | Atlas／Spellbook 僅成對 Unique；起手各兩張；收藏區另依 FAQ。 |
| [Swap](https://sorcerytcg.com/cards/swap) | 兩目標同區域、確認前可取消、同時傳送，攜帶物互換持有者。 |
| [Backstab](https://sorcerytcg.com/cards/backstab) | 可指定敵我僕從，第二目標須橫置；最多走一步，只由第一目標 Strike。 |
| [Blasphemy](https://sorcerytcg.com/cards/blasphemy) | 先同時傷害地點，依雙方順序選不同神器，最後摧毀並橫置／跳過重置。 |
| [Awakened Mummies](https://sorcerytcg.com/cards/awakened_mummies) | 必須 burrowed safely 進場；敵方移入上方後無須橫置即可出土戰鬥。 |
| [Haystack](https://sorcerytcg.com/cards/haystack) | 限制對手搜尋任何牌庫的範圍，不限制 Browse 等查看效果。 |
| [Black Cat](https://sorcerytcg.com/cards/black_cat) | 前八次死亡替代為完全治療，第九次死亡；犧牲略過預防；選對手隨機結果。 |
| [Kythera Mechanism](https://sorcerytcg.com/cards/kythera_mechanism) | 持有者的操控者選隨機結果，以進場時間排序；不揭露隱藏手牌卡名。 |
| [Rat King](https://sorcerytcg.com/cards/rat_king) | Genesis／Deathrite 搜尋頂六張，每個其他相鄰地點可召喚一隻 Ordinary rat。 |
| [Undertaker Engine](https://sorcerytcg.com/cards/undertaker_engine) | 回合結束分別選擇要上浮或下埋的神器／僕從，確認後一起處理。 |
| [Grim Reaper](https://sorcerytcg.com/cards/grim_reaper) | 擊殺替代為放逐，放逐場上複本及受害者擁有者私人區域中的複本。 |
| [Arcane Barrage](https://sorcerytcg.com/cards/arcane_barrage) | 施放前選 X 與方向，支付 X，依序結算 X 個獨立投射物；X=0 不發射。 |
| [Assorted Animals](https://sorcerytcg.com/cards/assorted_animals) | 支付 X，逐次挑選不同 Beast，費用合計不超過 X；Haystack 範圍固定。 |
| [Blaze of Glory](https://sorcerytcg.com/cards/blaze_of_glory) | 逐場選擇敵人，完整處理先攻及 Deathrite，再選下一場；全部結束後才死亡。 |
| [Monks of Kobalsa](https://sorcerytcg.com/cards/monks_of_kobalsa) | 阻擋能力、力量、沉默、失能、變形等修改；Ward 為例外。 |
| [The Doom of Dilmun](https://sorcerytcg.com/cards/the_doom_of_dilmun) | 不可修改、摧毀或放逐，犧牲仍有效。 |

測試檔：[remaining-rules.test.js](../tests/remaining-rules.test.js)。所有卡牌仍為部分支援；完整交互驗收尚未完成。

續作 Lucid Dreamers：核對官方 `/cards/lucid_dreamers` 卡面文字及 Codex 的 Casting Minions、Voidwalk；只授予在該虛空施放的僕從暫時 Voidwalk，離開虛空即移除。測試涵蓋敵方與沉默來源不授權。
