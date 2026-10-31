# 最後 101 張：特殊僕從批次

本批實作：`src/final-units.js`；驗證：`node --test tests/final-units.test.js`（180 項，含 154 項真實 `dispatch` 整合測試，其中 25 項為 Kairos 正式整合驗證）。本模組共開放 17 張有實際效果的卡，Kairos 已完成冷恢復驗收並正式開放。這是局部效果驗證，不代表全卡組合已通過完整官方裁定驗收。

| 卡牌 | 本批狀態 | 實作與驗證證據 |
| --- | --- | --- |
| Monastery Gargoyle | 效果已實作並測試 | 回合開始及結束選擇 Airborne 僕從或 Monument 神器；真正從 units/artifacts 間轉換，保留同一物件身分；Monument 掉落攜帶物、移除 Ward；再變回時不視為召喚；預先註冊 runtime ID，保存後可重新載入。測試包含下次自己的回合觸發及沉默。 |
| Mimic | 效果已實作並測試 | as-summoned 選擇先暫停進場，可選任一可攜帶神器或拒絕；被變形神器卡放逐，該物件由實體 Mimic 卡取代，同一 UID、保留持續修正與橫置狀態；只產生一隻 Mimic、不觸發 Genesis，不再遞迴變形；排除 Monument/Automaton。真實施放測試證明舊神器放逐及唯一僕從；Deathspeaker 複製品變形後，稍後的放逐 continuation 會追蹤新 UID，仍被放逐。舊存檔若神器缺 `born`，無法重建其真實進場回合。 |
| Tringh Constrictor | 效果已實作並測試 | 啟動前先一起宣告可選的一步與欲纏繞的僕從；可取消且不橫置，無合法目標則沒有啟動動作。支付橫置後才走該步並纏繞原先宣告的同位置僕從；Ward 保護纏繞指定，但不取消先前移動；以 transport graph 攜帶且失能。下一次重置改為摧毀仍被纏繞的僕從，自己仍橫置；獨立移走或逃脫會取消。測試涵蓋取消、Ward 與走步、啟動到下一次重置。保留舊 continuations 供舊存檔續接。 |
| Crave Golem | 效果已實作並測試 | 每位玩家回合開始觸發；在真實 range of motion 中均勻隨機選一個可攻擊的僕從，包含友軍、不含自己；使用 replay-aware RNG，Black Cat 可選結果。逐步移動後進入正常可防禦的攻擊窗口，不需橫置。若無範圍內目標，以合法單步圖的 BFS 找出可攻擊目標的最短距離，沿最短路走一步；同距由操控者選擇。測試涵蓋繞虛空、隔離地點、不可攻擊的 Airborne/Stealth、回合開始中防禦移動後恢復抽牌階段。 |
| Dame Britomart | 效果已實作並測試 | Lance 正常進場獲得；對敵方地點成功且未被防禦的攻擊，在傷害前提供可選替代；可以召喚自己墓地的 Mortal 到她目前的位置，支付墓地存取及額外召喚費用並結算 Genesis。拒絕時只執行一次原地點傷害；不重複 after-attack 觸發。整合 Mortuary/Wormelow/Bureau 墓地 helpers；測試包含實付 Bureau 2 + Mock Court 1、費用不足不提供替代、被防禦不觸發及 Agravaine 不重複。 |
| Giant Shark | 效果已實作並測試 | 偵測同水域其他單位進場或跨地點移動，包含友軍；同地點上浮／下潛不觸發。以實際合法單步圖列出最短路徑（包含垂直移動），由操控者選路，再逐步移動與 fight，不開 attack/defend 窗口，不需橫置；可與 Airborne/Stealth 單位戰鬥。已排入 Storyline 的路徑與 fight 不因途中 Silence 消失。測試涵蓋友軍召喚、飛行隱匿、不同水域、垂直移動與最短潛水路徑、穿越 Silence。 |
| Captain Baldassare | 效果已實作並測試 | 對單位或地點宣告攻擊且完成移動後，在 strikes 之前棄防禦玩家 Spellbook 頂三張；即使船長稍後死亡，這回合的三份施放權限仍有效。每份權限綁定實體墓地訪問 UID，忽略門檻、仍支付正常費用及適用的墓地存取費，不生成手牌／免費複本；原卡施放後回到原擁有者墓地。取消選目標不消耗權限，成功施放只用一次，牌離墓或回合結束即失效。 |
| Sea Raider | 效果已實作並測試 | 以原生 attack event 與 kill credit 判斷攻擊擊殺敵人，觸發棄對方 Spellbook 頂一張與上述同種一次施放權限。替換原攻擊對象的防禦者被殺也會觸發，同時與對方死亡仍有效；單純 spell fight 或失去能力時不觸發。測試覆蓋正常擊殺、同歸於盡、替換防禦者及非 attack 不觸發。 |
| Grosse Poltergeist | 效果已實作並測試 | 共用 artifact-animation.js 以同一物件維持 Minion／Artifact 雙索引、自身 bearer 能力、依來源持續的控制與費用力量；真正的實體攜帶與 self-bearer 分開。10 項真 dispatch 證明取消未橫置、Sword and Shield 自身加力、Merlin Staff 自己施法及加力、Manuscript 正常 bearer-tap 抽牌自傷、失能不可繞路、self 不算 Rock 的實體裝備、離場單卡入墓與存檔。已稽核引擎 29 處 bearer 判斷，實體攜帶入口排除 self、能力入口保留 self；新增正式施放與召喚失能期結束後啟動測試。 |
| Jack the Ripper | 效果已實作並測試 | 從原本合法的施放來源建立額外施放動作，可到任意 Mortal 所在位置，即使沒有己方地點；照常檢查法力、門檻、施法者及全域召喚限制。施放時先排好 cast ability，Jack 進場及處理環境死亡後，仍活著且未失能才沉默、摧毀該 Mortal。進場 Silence 不移除已排好的效果，但 Jack 失 Stealth；失能或在虛空／地下當場離場則不傷害獵物。此文字沒有 target，因此 Ward 保護摧毀、不保護沉默。測試包括 King of the Realm 暫取 Jack 控制權後仍被殺、Jack 回原操控者，以及普通施放、Stealth Mortal、費用限制。 |
| Gnarled Wendigo | 效果已實作並測試 | 支付前宣告並可取消同召喚位置的己方僕從祭品，每張減 2；以真實犧牲結算 Deathrite、忽略 Ward，成本最低 0。測試包含過大僕從佔格、不同層／敵軍排除、移除選項與過期宣告重驗。 |
| I Am Colossus | 效果已實作並測試 | 支付前選受控僕從、己方手牌或己方墓地僕從，每張放逐減 1；不得選施放來源，保留實體擁有者且不觸發 Deathrite。測試包含零成本、Bureau 獨立一次費用及不能支付時無動作、Mortuary 視角、Wormelow、Deathspeaker 原墓地 UID 跨移除重排。 |
| Karkemish Chimera | 效果已實作並測試 | 一次合法移動／橫置同時攻擊最多三個同位置單位，共分配六點力量，全部同時 strike；保留普通單目標攻擊。防禦者明確選保護其中一個原目標，原被攻擊者不可去保護另一目標。測試含 2/2/2、6/0/0、三方同死、allocation 存檔、防禦替換一人、Avatar 及 Wisp 逃走後其餘目標仍結算。 |
| The Inquisition | 效果已實作並測試 | 真正手牌／Spellbook 曝光事件：Genesis／lookHand、對手實際 search、公開頂牌與 Scout、Dhol 等必須 reveal；等待原曝光效果完成後可選直接召喚，免印刷 mana／threshold，可在敵方位置，仍套用額外召喚限制。Genesis 真正揭手且可放逐一張。12 項真 dispatch 測試涵蓋完整 Genesis、曝光後已被放逐不得召喚、拒絕、存檔續接、非搜尋類型仍會看見、己方私搜不觸發、Haystack 實際前綴、Feast 先放逐、相同頂牌依次抽走再次曝光、Scout、Dhol pool 先回牌庫、Court 的 spell tax 不適用免費 summon。 |
| Stitched Abomination | 效果已實作並測試 | Genesis 可選同一實體墓地最多三張僕從，依原卡力量建立獨立片段並放逐原牌；Bureau 只收一次，可拒付。減傷與 Ward 後由造成傷害玩家分配到片段，累積致死片段移除並同步降低力量；直接 kill、Lethal 會摧毀全部。11 項真 dispatch 測試涵蓋 0/4/3 與 3/3/1 分配、存檔重播、Ward、Lethal、全部死亡、Shield Maidens 減傷、回合末清片傷、實際 Font of Life 選片治療與 Fatality 直接全殺。 |
| Kairos the Archivist | 正式註冊及冷恢復驗收完成 | 唯一實體 lineage 跨 realm／手牌／書庫／墓地／collection／banished，基礎複製不攜帶舊身分；快照只存 realm cards 及其已套用狀態，不回復生命、回合、Storyline 或未套用的 Critical Strike。25 項真 dispatch 包含整段生死、Evil Twin／Replication／Locust／Orb、Dhol 暫存池與正在結算的 Magic、Bureau／Wormelow、Altar 終身用量、Geistwood 兩順序、雙控制者共用最新快照、跨回合費用與可用次數、Onslaught／Flight／Gigantism、官方 Gnome Hollows 例子、Babel 每半獨立身分／禁止復活已放逐部分／保留新增半。另驗證 Rubble、inert cards、雙索引動畫及 cold registry 重建。 |
| Grigori Rasputin | 效果已實作並測試 | 墓地實體 UID 權限、同位置多 Evil 盟友可分別選擇、付款前明示確認／取消、一般 mana／門檻／施法者與 Bureau 費用；繼承印刷力量與完整單一來源定義，進場前取得 Stealth／Genesis，全部入場效果完成才真正放逐盟友。14 項真 dispatch 驗證來源、費用、取消、過期選擇、Mortuary、Genesis 時序／存檔與 Deathrite 死後失去繼承。已修復繼承 Mimic 替代召喚、運輸能力動態查詢、Gawain／Bodyguard 來源識別並逐項真測；相同 Rasputin 來源不重複登記墓地被動，先前獲得的能力不當作印刷能力再繼承。UI 保留不同 donor／施法地點並在付款前明示確認或取消。 |

## 本批規則來源

- 本機不可改寫的 `data/official-cards.json` 與本輪開始保存的 `data/final-101-baseline.json` 卡文。
- [官方 Monastery Gargoyle](https://sorcerytcg.com/cards/monastery_gargoyle)：2026-10-30 讀取確認開始／結束回合形態選擇。
- [官方 Transform Codex](https://sorcerytcg.com/codex/c27cbd3f-39d3-46b0-8133-37063e86df7e)：變形保留遊戲物件、橫置、持續效果；變成另一張牌時舊卡放逐；變形不視為進場。條目明列 Mimic 的「under your control」例子。
- [官方 Kill Codex](https://sorcerytcg.com/codex/f6e68ade-9736-4354-936b-e461ab73d352)：Kill 與 Destroy 同義。
- [官方 Ward Codex](https://sorcerytcg.com/codex/ae9b6774-aa8f-45c5-a424-d6d7e58014c3)：保護對手特殊能力指定、傷害及摧毀；非單位／非地點移除 Ward。因此 Constrictor 的摧毀不能被實作成強制略過所有 Ward 的 state-based death。
- [官方 Target Codex](https://sorcerytcg.com/codex/98943611-2a6f-4756-ad9b-a7d6598e9729)：只有含 target 的效果才指定；Jack 的「any Mortal」沒有 target，因此可以選有 Stealth 的 Mortal，也沒有針對指定效果的同區域限制。
- [官方 Crave Golem](https://sorcerytcg.com/cards/crave_golem)：2026-10-30 透過 CUA 展開並讀取 6 則 FAQ，確認可攻友軍、正常攻擊限制與防禦、無需橫置、無限移動假設下以實際最少步數接近且平手由操控者選擇。
- [官方 Dame Britomart](https://sorcerytcg.com/cards/dame_britomart)：透過 CUA 讀取當前卡文；當前卡牌頁未列個別 FAQ。
- [官方 Giant Shark](https://sorcerytcg.com/cards/giant_shark)：透過 CUA 展開並讀取 8 則 FAQ，確認 friendly/Airborne/Stealth fight、召喚觸發、同地點換層不觸發、最短路可包含換層，以及 Silence 不移除已上 Storyline 的移動及戰鬥。
- [官方 Mimic](https://sorcerytcg.com/cards/mimic)：透過 CUA 展開並讀取 2 則 FAQ，確認替代召喚、神器放逐、保留進場時間，以及 Deathspeaker 複製品變形後仍放逐。
- [官方 Tringh Constrictor](https://sorcerytcg.com/cards/tringh_constrictor)：透過 CUA 讀取 Beta 卡文與 1 則 FAQ，後者指定以 Beta 文字為準。
- [官方 Jack the Ripper](https://sorcerytcg.com/cards/jack_the_ripper)：透過 CUA 展開並讀取 4 則 FAQ，依此更正 cast ability 必須在 Jack 進場且活過環境檢查後才執行；Silence、Disabled、立即離場與 King of the Realm 的具體互動均有真實 dispatch 回歸測試。
- [官方 Captain Baldassare](https://sorcerytcg.com/cards/captain_baldassare)：透過 CUA 讀取卡文與 1 則 FAQ，確認其觸發先於 strikes，不需要本人活過攻擊戰鬥。
- [官方 Sea Raider](https://sorcerytcg.com/cards/sea_raider)：透過 CUA 展開並讀取 2 則 FAQ，確認與 Deathrite 同一窗口的同歸於盡觸發，以及對替換防禦者獲得 kill credit 也成立。
- [官方 Kairos](https://sorcerytcg.com/cards/kairos_the_archivist)、[官方 Inquisition](https://sorcerytcg.com/cards/the_inquisition)：已讀取卡文，沒有因此宣稱尚未實作的能力已完成。

## 仍需驗收的交互

- 所有開放卡的整體等級仍為「部分支援」。尚未完成所有控制權依存、同時觸發排序、持續效果層次與卡牌組合的官方驗收。
- BFS 使用引擎目前的合法單步模型；尚未完整測試載具、任意形狀超大型單位，以及沿路變更整片地形與關鍵字時的所有路徑交互。每一步執行時仍重新檢查合法性。
- Constrictor 的特殊載運關係沿用現有 transport graph，來源被沉默／失能、變形及多重載具互動仍需更多組合測試。
- 掠奪權限已測正常 mana、生命支付、Bureau、Wormelow、不同 grave UID、取消、一次性與有效期間；尚未逐一驗收所有可從墓地施放的特殊替代費用、代施法者與複製效果。
- 舊存檔未記錄神器進場回合時，Mimic 無法憑空還原當初是否為本回合進場；新建神器已由引擎記錄 `born`。

測試設定說明：回歸測試的 `game()` fixture 是直接建立已到第 4 回合的既有盤面，因此兩位起始 Avatar 的 `justEntered` 必須設為 false；否則第一次測試動作會錯誤讓它們產生新的進場事件，污染 Shark 的事件序列。實際以 `makeUnit` 新進場的單位仍保留正常 entry 事件。

## 本輪新增規則來源與驗收界線

- [官方 Gnarled Wendigo](https://sorcerytcg.com/cards/gnarled_wendigo)、[官方 I Am Colossus](https://sorcerytcg.com/cards/i_am_colossus)：透過 CUA 核對當前卡文，未列個別 FAQ。
- [官方 Karkemish Chimera](https://sorcerytcg.com/cards/karkemish_chimera)：透過 CUA 展開 3 則 FAQ，確認總力量分配、防禦只替換一個目標、已被攻擊單位不能防禦另一目標。
- [官方 The Inquisition](https://sorcerytcg.com/cards/the_inquisition)：透過 CUA 展開 3 則 FAQ，確認對手搜尋即使未注意仍觸發、Haystack 只看實際搜尋範圍、Feast 先放逐故不能召喚。
- [官方 Summon Codex](https://sorcerytcg.com/codex/679db7d7-3cb3-4655-b84b-53c4bd6ed637)：未指定位置的召喚可選任何 location／region，不需施法 mana／threshold，強制額外費用仍適用。

Inquisition 的曝光記錄只保存曝光卡 UID／被看見的 Inquisition 索引與數量，不把未揭露整副牌複製到新記錄。現有主要 reveal/search 操作以明確 opcode manifest 接入；未來新增揭露來源必須接同一 hook。Spellbook 尚無逐張永久 UID，因此相同卡在複雜多步限制搜尋中的身分，以曝光預算與已移除數追蹤；已驗證 Feast/Haystack 邊界，未宣稱任意未測全卡組合皆正確。上述核心效果與列示案例及 Kairos lineage 整合均已通過。

本輪整合後另跑 `npm test`：576/576 通過（2026-10-30）；完整輸出 `/tmp/final-units-full-suite.log`，專用輸出 `/tmp/sorcery-units-tests.log`。此為當時工作區快照，不替代後續批次的完整重測。

## Stitched 與剩餘三張接續

- [官方 Stitched Abomination](https://sorcerytcg.com/cards/stitched_abomination)：本輪 CUA 展開詳細 FAQ，依例子實作減傷後由造成傷害者分配、片段移除、回合末清傷、直接 kill／Lethal 全滅。
- [官方 Grösse Poltergeist](https://sorcerytcg.com/cards/grosse_poltergeist) 的兩則 FAQ 與 [Animate Codex](https://sorcerytcg.com/codex/1235b762-af7e-4007-b51c-557b5d4e4957)：動畫增加 Minion 類型，不移除 Artifact；可帶僕從的 bearer 仍不能奪走 Grosse 控制權。本輪已以共用雙索引／self-bearer 模型正式實作並測試。
- [官方 Grigori Rasputin](https://sorcerytcg.com/cards/grigori_rasputin) 的兩則 FAQ：墓地啟動，realm 任意 Evil ally，獲得印刷力量及能力；完整結算復生與繼承 Genesis／entry 後才真正放逐代價盟友，不能先移除盟友。本輪已正式實作並測試。
- [官方 Kairos](https://sorcerytcg.com/cards/kairos_the_archivist) 的 18 則 FAQ 已讀取：唯一最新 realm archive；不回復生命／Storyline，恢復非移動／進場；banished 不回（token 例外），未記錄新牌保持原狀但衝突地點放逐，新增攜帶物留原地。需跨區域實體 lineage，不以同 printed ID 當原物件，已正式註冊。

Kairos、Grosse 及 Grigori 均使用 production 定義；測試不注入定義或修改 playable。Grigori 的 cemeteryAllyCast 被動由實際墓地施放入口使用。

## Grosse 的 bearer 入口稽核

原引擎 29 處 `bearer===` 判斷已逐一分類。傷害防護、Aegis 死亡替代、擊殺重置、類型、Lance、trait strike／splash／first strike、mana／門檻、折扣、Vermis、施放加力與觸發保留 self-bearer。實際攜帶條件、Shatter／Assassin／Replication、tap-drop、carrying draw、banish-with-items、Just a Rock 與 needs-carried-artifact 改用 `artifactIsCarriedBy` 排除 self。動畫物件只經 artifact activation 路徑支付 bearer-tap／費用；unit activation 不再提供同一能力的免費旁路，失能亦禁止 artifact 路徑。外部模組的 bearer 讀取為實際的 bearer abilities，無需改成實體攜帶。動畫支援共用 Factory 及原生 Automaton，保留原生 unit 的傷害、橫置和索引。

本輪完整測試曾跑 819 項，其中 814 通過；5 項為同時開發中的 Meteor 宣告／Oak 與 healing 測試修正，已回報其負責者。專用 128 項全通過。最終全域驗收應以父任務在各批次完成後的重跑結果為準。

Grosse 另以官方兩個 carrying FAQ 作真 dispatch：普通 bearer 掉落、Stagecoach 可仍載著動畫僕從但 Grosse 保控制；敵方 Stagecoach 實際走一步後動畫物件作 passenger 跟隨，仍由 Grosse 玩家控制。

## Kairos 本輪實作位置及整合證據

- `src/card-lineage.js` 是無循環相依的純 helper：去除複製品的物理身分、註冊 archive／Altar／Gargoyle runtime、已套用效果的目標 scope。
- `createFinalKairosArchive`／`returnFinalKairosArchive` 只記錄 realm 物件，包含 site、unit、artifact、aura、inert card；動畫雙索引還原同一物件。每張 Babel Base／Apex 分別標記，普通複製品不冒充舊卡。原卡實際變成別張牌時，以真實 card／originalCard 標記判定，不信任過期 object metadata。
- 已接入口包括 basic copy、Heir、Mirror Realm、Deathspeaker／Avatar copy、Replication、Locust、Orb token；名字比對的 Reap／Leyline／同塔計數仍按印刷名稱，不把不同實體當不同卡名。
- 暫存實體牌的 Dhol、Rats、search／browse／orderDeck pool 會移除已回 realm 的實體；正在結算的原 Magic 回復後不再由 finishMagic 複製到墓地，原 effect／Storyline 繼續結算。
- snapshot 保存本回合狀態；跨回合回復時重定 born／pick／once-per-turn／end-turn 時戳。已套用 Onslaught、Shield Wall、terrain effect／night attack 只回復到照片中的卡。未套用 Critical Strike 的現存 global marker 原樣保留，已消耗者不重生。
- [官方 Deathrite Codex](https://sorcerytcg.com/codex/7bd846a2-c55b-42cc-915a-9861f2080202) 明列 Deathrite 先於入墓；因此拒絕 Bureau 只阻擋已入墓／collection 的牌，仍在 realm 的 dying Kairos 仍可回復後放逐。
- [Avatar Characteristics](https://sorcerytcg.com/codex/a43c193c-02d6-4389-b791-08d3b77bde11)：Avatar 基本施法是 characteristic，Silence 不移除；失效 caster 測試使用真正 Disabled，另新增 silenced Avatar 仍能 Jack 特殊施放與 plunder 的正測。
- Babel 官方 FAQ `5bfcd86f-80b1-472e-8104-c39b51504246`，更新 2026-10-12T17:44:03Z，確認兩張合為單一 Site、離場分別去墓及複製不觸發 build。只剩可回復的一半時還成該印刷 Site，是依「禁止復活已放逐部分」與「兩部分才構成 Tower」的明示推論，已由父任務採用；不是官方 Kairos FAQ 的特例裁定。Horns 形態則以剩餘部分重建相同 form，不保留不存在 Tower 的雙稀有度與資源；詳見 `docs/final-built-sites.md`。

共用 runtime-hydration 多來源相依冷載入已驗收，Kairos 正式註冊。25 項真 dispatch 包含雙控制者正常施放及重裝 catalog 冷恢復；並非窮盡全卡組合。

### 最後正式註冊驗證

- `node --test tests/final-units.test.js`：180／180，含 154 項真 dispatch；Kairos 測試使用正式 catalog，不注入定義或修改 playable。
- `node --test tests/final-vivien.test.js tests/final-built-site-lineage.test.js`：15／15。Grigori 延遲放逐以同一 UID 與 canonical printed card 重驗，避免 Vivien 動態牌面更新漏付代價；印刷能力不誤取 Vivien 當時額外獲得的能力。
- 未宣稱已窮盡全卡交互；Babel 僅剩一部分時的處理是上文明示推導。

### 能力來源消費入口

Chimera 以有效 source views 決定同時多攻模式，宣告保留來源列表並在 commit 重驗；重複來源不把三目標上限相加。Britomart 每個來源分別提供可拒絕的 replacement，同一次地點傷害只成功替代一次；全部拒絕只造成一次正常傷害。Shark 每個來源各排一次帶 origin／instance／nature 的事件。三者均使用共用 source-layer 模型，原生 Silence 會移除，Pallid 外部授予在 bearer Silence 下保留、卸裝則移除；13 項新增真 dispatch 包含四種來源狀態及雙 Britomart replacement。

### Vivien 區域外施放的來源與代價

墓地 Grigori 權限與手牌 Jack 特殊施放以玩家當前 contextual card 的 passive source records 判定，不再限印刷 slug；來源描述保留原實體墓地／手牌卡，入場 originalCard 仍為實體來源。這也支援 Vivien 借用能力，未因此提前開放 Vivien。Wendigo／Colossus 額外費用候選保留 costAbility 的 mode、origin、instance、nature；玩家逐張選擇以哪個來源的能力支付，犧牲折扣 2 或放逐折扣 1，同一實體不能重複支付。預覽以每張實體最高合法折扣估算，提交只按明確宣告與重驗的來源付款，所有選擇在付款前可取消。

Gargoyle 借用形態使用 `gargoyle_form:<原執行期牌>` 保存宿主其他能力與實體 originalCard，還原時回到原宿主；純 hydration 先載入其原能力 runtime 再建立形態。新增真測正常墓地施放 Grigori 借 Gargoyle、原 donor 放逐、Monument、清空 registry 冷恢復、下一 start 回到 Airborne／正確力量，再真正死亡進 Grigori 墓地。另有 Pallid 在 bearer Silence 下的 Gargoyle、Constrictor（含下一 untap 殺死 captive）、Crave（含對手 start 到 draw）案例。已宣告的 Constrictor／Crave 結算不再以 raw Silence 取消。

Inquisition 曝光權限也使用 contextual passive marker，混合原生 Inquisition／Vivien 的 Spellbook 揭露依實體卡 ID 分別記錄；Plunder 的 permission 仍依實體墓地 UID 重驗，但施放效果使用當前 contextual card。Mimic 替換神器後保留被召喚牌的 originalCard，避免將 Vivien 執行期牌當成實體牌入墓。

### Grigori 放逐代價與不可修改

依 [Can’t be Modified](https://sorcerytcg.com/codex/5b78b0b7-6d27-421b-898e-cc69bd33771b)（2026-10-12）、[Banished](https://sorcerytcg.com/codex/703eaeda-d0ac-46ca-9103-a2f9fadf327a) 與 Rasputin FAQ `46af8772-38e1-4316-8e8a-da1aa0aaa44e`，不可修改並非不可放逐；刪除 donor eligibility／提交重驗中額外的 unmodifiable 排除，仍保留真正不可放逐的 Doom 來源限制。四項真 dispatch 驗證：自然 Evil Ghoul 外授 Monks 保護仍可付放逐代價且不把外授能力當印刷能力繼承；Persecutor 烙印的敵 Monks 仍因不是 ally 而不能支付（[Ally](https://sorcerytcg.com/codex/040cd91a-60f2-4a12-bebc-b9bf482b9877)）；原生 Doom 拒絕；宣告後才獲得 Doom 禁放逐會在付款前失效，卡區與 mana 均不變。Persecutor FAQ `7e931307-6b14-4c37-8e65-91ac4d033756` 明定烙印不修改 Monks，保留其 Ward；不以人工轉控制者冒充合法 ally。
