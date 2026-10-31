> 2026-10-30最新：使用者已批准Globe留原Aura格／等值投影去重、Snowball單圈、雙Throne當前回合玩家勝；這些是專案裁定，取代本文相應舊未決描述。Globe已正式開放；Chaoswish可真正免費conjure Globe，僅Book結果仍阻擋。最新原生、同步、實際UI證據見FINAL_FIVE_RULINGS_IMPLEMENTATION.md。Book的target算choose已確認，single／Ward時點仍未選家規。

# 最後 101 張：被動與傷害替代批次

查核日期：2026-10-30。原始卡文保留於 `data/final-101-baseline.json`；未修改官方快照。

本文件逐張保留實作與驗證證據；全專案的最終支援分級以主進度審計為準。Book 仍為部分支援，不能把 helper 或契約覆蓋當成全卡完成。Throne 的雙方同時勝利仍有下述規則限制。

## 已接入：Saint of Redemption

- 實作：`src/final-passives.js` 的 `saintOfRedemptionActive`、`finalPassiveEntry`、`refreshFinalSaint`、`finalUnitUmbrellas`、`finalCardUmbrellas`。
- 入口：`engine.js` 的單位建立、連續效果重算、Evil 選擇、法術牌庫／手牌／墓地檢查；`geography.js` 的 Crucifix 移動限制；`copying.js` 的入場 Ward；`metamorphosis.js` 的 Sinister Pond；`top-casting.js` 的 Doomsday Cult；`fifty-cards.js` 的 Ward 判斷；`objects.js` 的 aura 匹配接受上下文傘類型。
- 效果：Saint 自己及所有後續入場僕從橫置；場內外所有僕從不再是 Evil；Demon／Monster／Undead 本來的類型仍保留。沉默／失能／離場後移除持續的非 Evil 效果，但不反覆橫置既有單位。
- 官方證據：[Saint 卡頁](https://sorcerytcg.com/cards/saint_of_redemption)，已透過背景瀏覽器實際展開 5 FAQs；[2026-10-12 Codex 更新](https://sorcerytcg.com/codex/changelog) 亦明示 Saint 自身橫置。FAQ 包含全區域適用、Black Mass 不可揭示 Evil 僕從、保留本來類型、Persecutor 無法將其定罪。
- 真實引擎驗證：`tests/final-passives.test.js` 的 `dispatch: Saint himself...`、`dispatch official FAQ: Saint prevents Black Mass...`、`dispatch: Saint removes Evil...`、`dispatch: Saint lets redeemed Demons enter Crucifix...`。覆蓋自己入場、手牌施放、沉默還原、牌庫／墓地、合法行動與地形進入限制。

## 已接入：Order of the White Wing

- 實作：`orderOfWhiteWingReplacesEntry`、`processFinalPassiveEntries`。
- 入口：`engine.js` 連續效果末端的中央入場檢查；`commitSpell` 記錄是否直接從玩家手牌施放；`summonedGenesis` 在重算之後確認單位仍在領域再處理入場效果。
- 效果：已在領域、未沉默／失能的 Order 會將附近同區域、不是直接從玩家實際手牌施放的僕從改為放逐。替代的入場不執行 Genesis；未經 `summonedGenesis` 的衍生物入口亦由中央檢查涵蓋。
- 官方證據：[Order 卡頁](https://sorcerytcg.com/cards/order_of_the_white_wing)，已透過背景瀏覽器展開全部 3 FAQs。重點為：與 Order 同時召喚的所有僕從仍成功入場；Order 的能力在自身已進場後才適用；替代的僕從完全未進場，不執行 Genesis／Lance／Mariner's Curse；Morgana 與 Omphalos 的其他手牌區域不屬例外。
- 真實引擎驗證：`dispatch: White Wing allows hand cast...`、`dispatch: White Wing replacement prevents Genesis...`、`dispatch official FAQ: Golden Dawn simultaneously...`；涵蓋手牌施放、其 Genesis 產生的 Skeleton 被放逐、效果召喚的 Novice Necromancer 沒有 Genesis，以及 Golden Dawn 同批召喚 Order 與相鄰僕從後 Order 才阻擋後續召喚。helper 測試另驗證不同區域、距離、沉默與重複檢查。

## 已接入：Red Rock of Ravannis

- 實作：`finalPassiveDefinitions`／`finalPassivePassives`、`redRockCarryingForbidden`、`refreshRedRockCarrying`、`redRockPullDestinations`、`resolveFinalPassives`。
- 入口：`pickupItems` 過濾不合法的拾取目標；連續效果重算在物件跟隨 bearer 後強制解除攜帶並重算設備效果；既有 `everyEnd` 流程在雙方回合結束都排入拉動。
- 效果：同 location 的所有神器立即停止被攜帶，這不是 Drop，故 Tabula 等不能放下的神器也會脫手。選完本批全部方向後，神器與可拉動的 bearer 同時向來源 site 接近一格；同 bearer 多神器共同移動一次。bearer 無法被拉動而神器可以時，神器獨自脫手移動；神器不能被拉動時不帶動 bearer。包括 Automaton 與 Monument；強制拉動不使用自身移動能力，不能跨區域。
- 官方證據：[卡頁 2 FAQs](https://sorcerytcg.com/cards/red_rock_of_ravannis)；[Step](https://sorcerytcg.com/codex/0f53b70d-d13a-4982-8c16-20bb4ab1aa9d)、[Forced Movement](https://sorcerytcg.com/codex/8ffdae56-1aef-44f7-b9af-cdcbc334a377)、[Monument](https://sorcerytcg.com/codex/169db6b5-aae8-407e-ae7f-07206707a5eb?sub=adbd3184857c)、[Its Site](https://sorcerytcg.com/codex/a4bfc6cd-7f83-437e-8ae7-b2409fa9ec89)、[Simultaneous Effects](https://sorcerytcg.com/codex/081fc13c-49fb-4893-90c1-1ba5324e6241?sub=48346f868e2a)，皆已由背景瀏覽器讀取正文。來源沒有 site 時沒有可引用的拉動目標；Monument 的規則只是不可以被攜帶，並不禁止強制移動。
- 驗證：5 個獨立規則案例及 2 個真實引擎案例，涵蓋不能放下的 Tabula、區域界線、Talus 不可強制移動、同 bearer 多神器、同時套用、雙方回合結束，以及選擇中 JSON 存檔恢復。

## 已接入但仍有明確規則限制：The Immortal Throne

- 實作：`finalThronePlayed`、`resolveFinalThrone`、`finalThroneWinners`、`checkFinalThroneVictory`。
- 入口：每次承諾施法／實際 play site 排入一次觸發；傳遞實際出牌玩家而不是結果 site 的控制者；`stateBased` 結算後檢查勝利。
- 效果：比較印刷費用，site 是 0；雙方出牌都可升級。實際出牌者選 Atlas 或 Spellbook 抽一張，並在同次結算增加一個 level counter，紀錄在對戰 log。若選擇的牌庫是空的則對手獲勝。達到 8 級後，同 location 只有一個 Avatar 單位時該 Avatar 控制者獲勝，不要求王座屬於自己；一般神器不影響 alone，但其他單位、尚未離場的 dying 單位、Deathrite 產生的新單位都會阻擋。
- 官方證據：[卡頁全部 4 FAQs](https://sorcerytcg.com/cards/the_immortal_throne) 明示 site 為 0、施法也算 play、使用印刷費用、alone 是同 location 沒有其他 units；[Winning the Game](https://sorcerytcg.com/codex/48bee2d2-6d32-466f-b4fe-6c3178cb6ba4) 明示空牌庫抽牌失敗會輸。皆已由背景瀏覽器讀取正文。
- 驗證：5 個獨立規則案例與 4 個真實引擎案例，涵蓋 0→1→2 升級、印刷費用、多王座、雙方出牌、空牌庫、同區域、走入他人的八級王座，以及 dying／Deathrite 阻擋與最後清場後勝利。
- **尚未解決**：雙方在同一事件中，同時各自滿足不同八級王座的勝利條件，查閱的官方條文未提供此組合裁定。此情況明確拋出 `SIMULTANEOUS_THRONE_WIN`，保留原始動作前局面，沒有任意挑一方獲勝。需取得官方裁定及補齊此測試後才能宣稱完整支援。這個阻礙不是權限拒絕。

### 2026-10-30 重新核對：October 2026 官方規則書

來源為 [官方 How to Play 目前連結的 Rulebook](https://drive.google.com/file/d/1sgQo0xf0N2teIR0zlyl91g9j6LVncZnr/view)，封面／內文明示 October 2026，38 頁；本次取得的檔案修改時間 `2026-10-12T20:32:30Z`。舊 December 2025 新聞連結使用同一 Drive 檔案 ID，不能因此把目前內容標為 December 2025。核對本機全文 `/tmp/sorcery-official-rulebook-oct2026.txt`，頁碼使用書內印刷頁碼。

- p.11 的一般勝負規則說明擊敗敵方 Avatar，並明定空牌庫抽牌立即輸；沒有同時兩個替代勝利條件的優先序或平局規定。
- p.27 區分持續被動能力與事件觸發能力，並允許少量非標準觸發措辭；它沒有指名 Throne 的第二段應排入 Storyline，或提供同時兩王座勝利的裁定。
- p.31 說明 competing triggered events 的插入與玩家內部排序；p.36 Quick Reference 明示競爭加入同一時點的事件由非主動玩家先加入並先結算。此條文的前提是可排入的競爭事件，**不是**所有同時成立的勝利條件都自動由非主動玩家勝出。

**精確結論：新版規則書沒有解除 `SIMULTANEOUS_THRONE_WIN` 的既有阻礙。** 不能未證明兩個勝利條件是競爭 Storyline 事件，就將事件排序直接套成勝利優先序；沒有新增任意選勝者或平局的行為。

## 已接入：三張墓地牌

- **Bureau of Occult Control**：`src/cemetery-access.js` 的可序列化 access scope；付費為獨立且不可折扣的 2 mana／每個啟用 Bureau。一次效果涵蓋後續多段搬牌與墓地施放的自我放逐；新的 Genesis／Deathrite 有獨立 scope。拒付仍執行手牌、牌庫、普通攻擊等非存取部分。讀取、計數與埋葬不收費。
- **Mismanaged Mortuary**：`cemeteryPhysicalPlayer`／`viewCemeteryEntries` 依未沉默來源的奇偶數交換區域視角，實體墓地與卡牌所有權不變。召喚保留原所有者與新操控者；返回手牌回原所有者。`geography.siteAffinity` 提供印刷 Flooded，沉默與 Drought 會移除。
- **Wormelow Tump**：`canAffectCemetery` 與實際移牌 wrapper 保護符合三地門檻操控者的當前墓地視角；同時涵蓋指定、隨機、搜尋與大量移牌，不隱藏公開資訊，也不阻止自己的效果。
- 引擎入口：`commitSpell`、墓地／collection 合法動作、額外費用、`queue`／`drain` 的 effect scope、墓地回收、Boneyard、Rescue、墓地來源施放與保存恢復。外部模組包含 collection、copying、metamorphosis、fifty-cards、remaining-rules，以及各批 Catapult／Orpheus／Corpse Explosion／Dame／Colossus。入口對照與 API 見 [CEMETERY_INTEGRATION.md](CEMETERY_INTEGRATION.md)。
- 官方證據：[Bureau 全部 3 FAQs](https://sorcerytcg.com/cards/bureau_of_occult_control)、[Mortuary 全部 3 FAQs](https://sorcerytcg.com/cards/mismanaged_mortuary)、[Wormelow 卡文](https://sorcerytcg.com/cards/wormelow_tump)，皆實際在瀏覽器核對。
- 驗證：`tests/cemetery-access.test.js` **32/32 通過**，其中 **21 項真實 dispatcher 案例**。包括三張實際出牌、雙 Mortuary、交換後所有權、Worm 門檻、Bureau 付費／拒絕／取消／預算不足／多段一次、Boneyard 雙玩家權限、獨立 Genesis、collection 非手牌召喚、Kythera 隨機選擇與 JSON 保存恢復。跨批次另已確認 Artifacts／Sites 44、Effects／Reactions／Waves／Chaos 83、Units 73 項通過；完整專案測試以主代理的最終驗收為準。

## 原傷害工具與移交範圍

此表保留最初移交工作，不代表主引擎代理目前仍未完成；其後的傷害交易、Royal Bodyguard／Gawain／Mortal Soil 真實測試由主代理的進度文件記錄。

| 卡牌 | 已有工具與測試 | 已交主引擎代理的整合工作 |
| --- | --- | --- |
| Royal Bodyguard | `finalDamageRedirectOptions`、`applyFinalDamageRedirect`；可明確選擇或拒絕替代，保留 Ward | 重構同步 `hurt` 為保留傷害來源、實際傷害回條及戰鬥同時性的可暫停 continuation。選擇必須由 Bodyguard 的操控者決定，並可保護敵方 royalty；不能默認代傷。 |
| Sir Gawain | 同上及 `finalGawainDeath`；相鄰友軍、強制替代、遞迴鏈防循環與單次致死後抽牌工具 | 同步傷害入口整合；多個替代效果的順序選擇。2026-10-12 FAQ 指普通與代傷同時致死仍抽牌，現在 helper 尚未涵蓋全部同時傷害情況，不能發布。 |
| Mortal Soil | `mortalSoilOptions`、`resolveMortalSoilDamage`；選擇死僕從、放逐、防整筆傷害、無法支付時驅散與 Bureau 工具測試 | 以真正的 site 傷害替代 continuation 接 `damageSite`；涵蓋多個 aura 的替代排序、同時傷害與實際生命損失回條。 |

## 驗證與限制

### 新交付：完整 Magic selector 清單與宣告交易

`src/selector-semantics.js` 靜態列出目前全部 **202** 張可玩 Magic（包含本輪新加入 Demonic Contract、The Flood、Snowball 與 Chaoswish），區分 target、普通 choose、委派給盟友的 target、來源與時機；未知動態 selector 不默認成 target。另有非 Magic 能力的 `op:kind` 契約。這個清單是覆蓋審計，不是「全部交互已驗證」的宣稱。

`src/magic-declarations.js` 已將 Duel、Harpyon Urge、Trial by Water、Grasping Ground、Meteor Shower 的全部直接 targets 移至付款前宣告。保存固定目標、可行性 planning、取消、JSON 恢復與 Orb 全組 keep/new；結算重驗原目標，不暗中改選。三張單盟友複合句的來源依 Casting Magics 通則與卡文「target」名詞推論為 Magic 本身；Joust／Shatter Strike 的「ally targets」動詞則由盟友指定。這是明示的文字推論，並非聲稱有逐張額外 FAQ 裁定。測試 `tests/magic-declarations.test.js` **17 個真實 dispatcher 案例**；原 `tests/final-grids.test.js` Meteor 傷害／Ward 斷言保留，只增加新的付款前 commit 操作。

### Blasted Oak：已註冊，核心效果驗證完成

- `restrictFinalOakChoice` 在最終合法選項集合上依優先序過濾，保留取消；避免 Meteor 排除相鄰、Chain 去除已選、Harpy 排除力量過高者之前提早限制而錯刪合法目標。
- `restrictFinalLegacyTargets` 接舊式 Magic actions；`restrictFinalOakArtifactActions` 只限制 Iron Shackles 的 target conjure 模式，保留正常神器施放。Chain 要求先涵蓋可負擔的 Oak 目標，不能提早 commit；普通 choose、基本能力與隨機結果不被當成 target。
- `finalPrintedSourceActive`／`finalPrintedSources` 使用實際 printed/gained ability record，支援被複製到不同實體上的來源，並區分沉默只移除 printed、失能移除可用能力。Aura 佔區與 source 多位置需依實際幾何處理。
- `tests/final-passives.test.js` 新增 **17 項 Oak 真實案例**，含直接 Magic、普通 choose、Chain、Meteor、Dragon、legacy Zap／Teleport、Iron Shackles、Joust、Harpy 非法候選、Catapult 成本／impact、跨層 site、Aura 非 anchor 佔區、silenced gained source。已增加 production hand-cast、基本攻擊、召喚位置及 Kythera 真測並正式註冊，完整來源／版本證據見 `docs/final-oak.md`。

### Book of Blessings：部分支援，未註冊

- `src/magic-context.js` 保存每次真正施放的 caster、Book 來源快照、唯一 chosen Minion 集合、完整初始宣告與後續選擇。Storyline、延後 Mad Dash、LuckyResume 與 JSON 恢復保留 cast id；Orb 複本明確沒有 cast context。
- 完整直接宣告與明確單一選擇在效果前 Ward，已用自己 Zap 指定盟友驗證先 Ward 再承受傷害，因此實際防止該傷害；另測非 bearer 施放、Book 所有權、Saint／Evil、Mad Dash 後選、Orb 不重觸發。`tests/magic-context.test.js` **18 項真實案例（含 Damion 犧牲回歸）**。
- 目前採「整張 Magic 恰有一個被選的 Minion，且該 Minion 是 ally」的保守判斷。另一讀法是「只計 allied Minions」，在 Duel 由 Magic 同選 ally 與敵方 Minion 時會不同；Joust／Shatter 的 enemy 由 ally 自己指定，依 provenance 排除，不屬此疑義。純 predicate 可傳 `allied-minions` 比較，但沒有在 UI 假裝給出官方裁定。
- 唯一公開 FAQ 只確認 target allied Minion 也算 chooses，沒有裁定 single 的範圍：FAQ id `aa28f077-ea12-4e65-8495-19dd0cb388b3`，官方 `_updatedAt` 為 `2025-12-06T06:20:59Z`。
- Joust／Shatter 先為 Magic 實際選中的 ally 施加 Ward，再進行該 ally 的指定／戰鬥；Abyssal Assault 的後續敵方傷害受害者不加入 Magic 選擇。Dhol 暫選不先 tap，完整確認後先 Ward 再 tap／免費施法；多段選擇的暫存集合不能冒充已完成。
- **技術限制仍在**：Symmetric Suffering 會先犧牲己方再讓對方選擇；在後續選擇與 Deathrite 尚未確定前，如何保證整張 Magic 選擇集合的 Ward 時機仍未解。Recall 已先選完整子集、JSON 恢復後先 Ward 再批次傳送；兩項真實案例驗證單一與多名 ally。The Flood 只在完整例外集合確認後記錄，暫選與 reset 不污染集合；另兩項真測涵蓋確認、JSON 恢復與改選敵方。不能把 `finishMagic` 才補 Ward 當成完整正確支援，故持續列 partial。具體的兩階段 typed planner、真 Deathrite 後生候選反例與不可提前執行 RNG 的界線，見 [Book / Suffering 時機研究](BOOK_SUFFERING_TIMING.md)。

### The Malleus Maleficarum：正式定義整合

- `src/final-malleus.js`、collection permission 與核心 actions／choices／commit 串接。非 Spellcaster bearer 可使用；來自神器的能力不因 bearer 的 printed Silence 被移除。實際施放才耗用每回合次數，取消不消耗；支付原法術費用與門檻，Bureau 是獨立費用，scope 不重扣。
- 檢查整組 direct targets 至少命中一個敵方 Spellcaster 或其實際 location／site。Chain 可先選非合格目標再連到 Spellcaster，但需預算足夠且不可提早 commit；Swap／Backstab、三張 composite、Grasp 未來 actor、Meteor 未來落點皆做完整可行性檢查；不把 Joust 的 ally target 或 Fireball 的 projectile 當成 Magic 直接 target。
- Permission 固定原 caster；來源掉落後已開始的效果不自動消失，bearer 在 Grasp 中死亡後剩餘部分仍結算。資格按實際控制者、幾何佔格與 layer，不按原卡所有者或僅 anchor 格。
- 官方唯一 FAQ 明示非 Spellcaster bearer 可以施放；id `f1ba891f-8671-4852-874c-39accc7fbb56`，`_updatedAt` 為 `2025-12-06T06:17:51Z`。已實際展開卡頁，並核對官方公開 SSR FAQ cache。
- `tests/final-malleus.test.js` 已去除測試定義注入，使用 production registry；新增真正從手牌施放裝備後啟動的案例。caster-permissions 的 independent grant gate 與循環相依已修復後重跑：**16/16 全部通過**。涵蓋實際手牌裝備、非 Spellcaster、取消／once、來源掉落與死亡、Bureau、全組 Chain／Swap／Meteor／Grasp、Oak、沉默來源、預算、大型及地下佔格。已正式整合 production definition。

Book／Oak 的官方時機核對：2026-10-30 於背景瀏覽器實際展開 [Casting Magics](https://sorcerytcg.com/codex/43a73161-4f77-46b1-a23a-f916223a748c?sub=15e240391b4d) 正文。Magic 的直接 targets 必須於施放時全部宣告；一般 ally／choose 在效果結算時才選（官方例 Overpower）；Magic 使 ally 進行 target 時，該 target 由 ally 在結算時指定（官方例 Joust）。[Book FAQ](https://sorcerytcg.com/cards/book_of_blessings) 明示 target allied minion 也算 chooses。

Selector 架構已實際接入，不再只包裝中間的 `selectEffects`。所有目標限制在最終合法選項後套用，且另接 legacy actions 與神器 conjure；詳見下列新交付。

執行 `node --test tests/cemetery-access.test.js tests/final-passives.test.js`：94 項通過、0 失敗。其中 final-passives 62 項含 32 項真實引擎案例，cemetery-access 32 項含 21 項真實引擎案例。獨立 helper 測試不等於未接入卡牌完成。

以下未完成狀態以本批交付為準；其他批次若接入傷害替代，須以其真實引擎證據更新，不能僅引用本檔 helper。該批 helper 對於尚未核實的多來源／完整交互只有技術測試，不能替代官方 FAQ 核對或實際引擎整合驗收。未修改 Firebase 設定，未推送或部署。
