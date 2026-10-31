# 最後 101 張：神器批次實作紀錄

此批負責原始清單中的 8 張卡；**6 張核心實作及測試、2 張仍未完成**。程式集中於 `src/final-artifacts.js`，測試為 `tests/final-artifacts.test.js`。

驗證指令：`node --test tests/final-artifacts.test.js`，2026-10-30 實測 **26 通過、0 失敗**。其中 7 項走正式 `legalActions → dispatch → Storyline → stateBased` 流程，其餘為獨立 hook 與邊界驗證。這些測試不等於全卡交互完整驗收。

| 原始卡牌 | 本批狀態 | 實際效果位置與驗證 | 尚存限制／下一步 |
| --- | --- | --- | --- |
| Cage of Sidrak (`cage_of_sidrak`) | 核心效果已實作及整合測試 | `resolveFinalArtifacts: finalCage` 全域選取力量 ≤2 的僕從，傳送至籠、橫置、失能；`finishFinalArtifacts` 隨籠移動、離籠釋放；`finalCageForceAllowed` 禁止非傳送強移。測試名稱含 `Cage`。 | 籠是神器載具，採獨立可序列化 `finalCage` 關係；與通用 `carriedBy` 型載具、Swap 攜帶關係互換尚未完整交互驗證。首次 web／shell 失敗，後以 CUA 官方主站成功閱讀；完整載具交互仍待驗證。 |
| Corpse Catapult (`corpse_catapult`) | 核心效果已實作及整合測試 | `finalCatapultAvailable` 驗證持有者、另一位同處準備好盟友與亡故僕從；`finalCatapult` 依序選裝填者、屍體、三步內同區域落點，最後同時支付兩次橫置及放逐，對落點所有單位造成屍體印刷力量傷害。測試名稱含 `Catapult`。 | 屍體／墓地來源會透過現有 `graveEntries` 與 `takeGrave`；未完成所有新墓地保護／互換卡之交互驗證。 |
| Tabula Rasa (`tabula_rasa`) | 核心效果已實作及整合測試 | `prepareFinalArtifacts` 標記受影響持有者；`unmodifiable` 引擎保護與 `finishFinalArtifacts` 保留沉默、去除其他修改；`cannotDrop` 禁止放下；`castToAnyMinion` 允許指定敵我僕從。測試名稱含 `Tabula`，涵蓋敵人、Ward、原已不可修改的 Monks。 | 未逐一驗證全卡複製、控制與動畫來源的依存順序。 |
| Tombstone Wardens (`tombstone_wardens`) | 核心效果已實作及整合測試 | `registerFinalArtifactCards` 建立固定 runtime ID；`prepareFinalArtifacts` 在對手回合以相同 UID 變為 5 力量 Angel Automaton、Airborne，在己方回合還原 Monument，保留擁有者；使用控制者判斷回合。測試名稱含 `Tombstone`，涵蓋轉換、準備狀態與存檔復原。 | 與全部動畫／複製／控制來源同時作用尚未全面驗證。 |
| Koschei's Egg (`koscheis_egg`) | 核心效果已實作及計時測試 | `finalEgg` Genesis 僅連結 Avatar 持有者；可序列化 `finalEggBonds`；`finalEggPreventsDeathblow` 防 Death's Door 致命傷害；離場或時間到直接輸；Genesis 後放下與沉默不取消已建立關係。測試名稱含 `Egg`。 | 依官方 Codex「Lasts 3 of Your Turns」採每個己方 end phase 計數，包含施放中的回合，第三次結束時輸。官方 Egg 卡頁沒有 FAQ；這是一般回合計時定義的套用，未宣稱有 Egg 專屬 FAQ。 |
| Key to the City (`key_to_the_city`) | **核心完成，正式註冊** | `protectedFromSites` 註冊；Storyline abilityOrigin、central source gate、連續／移動／資源入口均實接，`keyProvidedMana` 給當前 bearer controller。 | `tests/final-key.test.js` **22／22**，含正式 hand cast／費用／裝備／mana、Site 能力忽略與 Magic／game banish／犧牲等反向例；188 Site defs/passives 索引見 `final-key-site-index.json`。 |
| The Pallid Bust (`the_pallid_bust`) | **核心完成，已正式註冊** | 正式 Genesis 從實際墓地選擇並放逐 Minion，裝備保留來源；types、abilities、source instance、timing 與 layer 防改由通用 consumer 執行。 | `final-pallid-passive-index.json` 的 213 個消費鍵均已分類／接線；正式手牌施放、費用、選擇、存檔及 physical owner 放逐流程已驗。這不是所有卡組合的窮舉認證。 |
| Doomsday Device (`doomsday_device`) | 核心效果已實作及整合測試 | `prepareFinalArtifacts` 進場 6 counters；`finalDoomsday` 雙方 end phase 扣 counter、到零按已核官方卡圖引爆一次；同 region、跨格傷害相加、邊界裁切。測試名稱含 `Doomsday`，含正式輪替 6 次回合結束。 | 卡面只指示傷害，沒有 sacrifice／destroy 本身，因此 spent 裝置保留在場、0 counter 不重複引爆。未宣稱存在指定自毀的官方裁定。 |

## 來源與可重現限制

- 原始卡文：`data/official-cards.json` 的八張 `engine.rules`，原始狀態與卡文亦保存於 `data/final-101-baseline.json`。
- 官方卡頁：`https://sorcerytcg.com/cards/<slug>`。首次 web 工具回報 inaccessible、本機 HTTP 因 DNS 解析失敗；之後使用 CUA 背景瀏覽器成功閱讀官方 Egg、Doomsday、Key 卡頁，並展開 Key 的 2 條 FAQ。沒有更動遠端狀態，未遇批准待辦。
- Doomsday 原始卡面圖（官方 `https://sorcerytcg.com/cards/doomsday_device`，CUA screenshot 目視 2026-10-30）傷害矩陣，以裝置為中心：

  ```text
  0 2  4 2 0
  2 4  8 4 2
  4 8 20 8 4
  2 4  8 4 2
  0 2  4 2 0
  ```

- [Damage Grid](https://sorcerytcg.com/codex/015d636e-716c-450e-9e17-abef557f3e4c)：只影響 origin 同 region，圖可部分超出 realm，沒有「target」字不構成指定地點。
- [Oversized Units](https://sorcerytcg.com/codex/7f57fe26-eac3-45a4-b449-994fef47d872)：多格單位在每個受影響格都承受傷害，官方例為 Major Explosion 7+5+5+3=20；本批按 occupied 格總和計算。
- [Lasts 3 of Your Turns](https://sorcerytcg.com/codex/3315e2bf-73f5-4db2-833f-ed25d0bbd260)：每個己方 end phase 加計，到第三次結束。據此修正 Egg 不再額外延後一回合。
- [Key 官方 FAQ](https://sorcerytcg.com/cards/key_to_the_city)：持有者等同 Protected from Sites；Flooded 給 site water threshold，因此持有者仍將其視作 water site，不會因此免除缺 Submerge 在水下死亡。
- [Protected from X](https://sorcerytcg.com/codex/2a4648bf-d6e6-4167-ac6b-2ee30f393d86)：對應來源不能指定、傷害、摧毀、放逐、修改、移動或阻礙單位移動／攻擊；不能讓受保護 Avatar 得失生命或影響治療。玩家抽牌、法力、threshold 與站點本身保護等仍有效。只補法力與忽略進場限制不足以完成 Key。
- 未將搜尋結果中的市場價格／非官方 FAQ 當作官方裁定。

## 引擎整合契約

1. `cards.install` 在卡表 maps 建立後預註冊 Warden runtime card，確保新頁面可讀取已儲存的動畫形態。
2. `refreshContinuous` 開頭執行 `prepareFinalArtifacts`；一般不可修改清理後執行 `finishFinalArtifacts`。Tabula 自己授予的 silence 必須在最後保留。
3. `unmodifiable` 包括 `u.finalTabula`，但 `prepareFinalArtifacts` 不得覆蓋牌本身的 intrinsic unmodifiable。
4. 神器施放行動對 `castToAnyMinion` 建立敵我僕從目標，保留 `canTarget` 與 Ward 的既有檢查；不可放下使用既有 `cannotDrop`。
5. Corpse Catapult 行動顯示前呼叫 `finalCatapultAvailable`；其連續選擇最後才支付費用。
6. Death's Door 的傷害致命一擊入口先檢查 `finalEggPreventsDeathblow`；`finishTurn` 改變 active 前執行 `endFinalArtifacts`，勝負已產生即停止續回合。
7. 強制移動提交前執行 `finalCageForceAllowed(oldUnit,isTeleport)`；傳送可逃籠，普通推拉不可。

## 兩張剩餘卡的精確接續設計

### The Pallid Bust

已在 CUA 成功閱讀官方 [Pallid Bust vs. Acid Rain 範例](https://sorcerytcg.com/codex/aa624e74-7c3e-4622-8471-03e05b576c52?sub=d980ece61b2a)：Bust 放逐 Sisters of Silence，Foot Soldier 持有它且在 Acid Rain 中時，Acid Rain 必須先移除 Bust 的類型／授予能力，Foot Soldier 最終不取得 Sisters 的類型或能力。這是明確的依存關係，不可把墓地卡的 `passives` 直接永久拷入原卡全域定義。

正確接續應先實作下列能力來源模型，再開放卡牌：

1. 將活體的印刷能力、每件授予能力的神器、其他持續來源表示為獨立的可識別 source。存檔只記 Bust UID、被放逐卡 ID 與必要時間標記，不將函式或全域動態定義寫進存檔。
2. 用 `effectiveAbilitySources(s,u)` 推導有效來源。自己的印刷能力與 Bust 授予的能力並存；不能用物件 spread 合併，因為同名數值鍵、兩組 aura 類型條件與獨立觸發都可能碰撞。
3. `definitions` 的主動、開始、結束、死亡等能力依 source 分別串接；保留獨立 ability key，行動提交時重驗來源仍存在、仍由同一持有者控制。獲得 Genesis 本身不立即重觸發進場能力。
4. `passives` 的數值、條件與觸發依各 source 分別求值；不是把同名布林 OR 或數值任意相加。自稱卡名的能力在授予後指向新 bearer。
5. 先加入最小可測的持續效果依存層處理：類型、沉默與能力授予來源應依官方 layer／依存順序重算，不用固定單趟 merge 冒充。明確涵蓋官方 Sisters／Bust／Acid Rain 範例。
6. 最後加入 Bust Genesis 的墓地選擇、合法性重驗、放逐與鏈結；再以真 dispatch 驗證穿戴／放下、來源沉默／摧毀、持有者沉默、存檔復原及死亡觸發。

必要測試矩陣：簡單 Keyword、主動施法者、start/end trigger、Deathrite、兩組不同條件 aura、原有與獲得的同名觸發各一次、Monks 不可修改、Sisters 沉默依存、Acid Rain 官方範例，以及更換持有者後來源行動失效。尚未進行這個跨引擎 refactor，因此仍未註冊／開放。

### Key to the City

FAQ 已把廣義「忽略」收斂為正式 Protected from Sites。應先建立 `canAffect(source,target,changeKind)` 來源保護入口，再逐一接到現有引擎的指定、傷害、kill／banish、修改、強移、行走與攻擊限制、Avatar 得失生命／治療入口。站點持續能力與進出 trigger 也必須檢查，不能只保護逐步選擇框。

應保留的玩家層級效果包括抽牌、抽牌限制、支付法力、取得 threshold；站點的不可摧毀保護不會被持有者忽略；water threshold 與 The Void 的遊戲規則死亡／放逐仍適用。

必要測試矩陣：Gnome Hollows 允許進入、Remote Desert 不造成傷害、River Rapids 不強移、正面 site buff／治療亦被忽略、site不能指定或放逐、Wizard's Den 正常抽牌、Garden of Eden 限抽、Bureau 額外費、Empyrean threshold、Bedrock 不可摧毀、Flooded 水下缺 Submerge 死亡、The Void 缺 Voidwalk 放逐、放下／神器沉默即移除保護，以及多格 bearer。`Provides (1)` 應按正式提供資源規則另外處理，不能因 bearer 暫不存在就漏算未持有神器的資源（需核對 control／uncontrolled 語意）。目前沒有這些完整來源保護入口，因此仍未開放。

續作交互：Catapult 新增 Wormelow 候選過濾與 Bureau 一次費用／拒付／存檔測試；使用明確相同 zoneAccessScope 跨持有者與神器 effectCard 的續接。Doom 的版圖定位改走共用 placedGrid／regionsOverlap 與多層占格；Globe 使 5×5 圖在四列 realm 中重疊同格時，官方九條 FAQ 未提供特別裁定，仍列此交互未完整驗證，不自訂 max 或去重當作官方規則。

### 2026-10-30 可接續的來源層模型（尚非兩卡完成）

新增 `src/final-ability-layers.js`，`tests/final-ability-layers.test.js` 實際 4／4 通過。`buildAbilityRecord(base,sources,A)` 保存每一份主動／觸發能力的 `abilityOrigin` 與獨立 `abilityInstance`；持續能力輸出為 `key → [{value,origin,instance}]`，避免兩份 `auraPower` 等同鍵覆寫。重複同卡來源也不合併成單一能力。基礎特徵、印刷類型及關鍵字分開；模型可 JSON 保存，不修改原始 definitions。

此模組沒有接入正式 registry，兩張仍封鎖。Avatar 的 `ability-sources.js` 由 avatars agent 維護，雙方已協調所有權；其單來源 runtime registry 可取此 record，但現有 engine 的 `passives[slug].key` 消費者不能直接吃多實例陣列，必須逐能力選擇加總、布林存在或取代的語意。

Pallid 下一步：Genesis 透過既有墓地存取 scope 選取／放逐實體 dead minion，把印刷 card ID 存於 Artifact；持續來源讀取 `activePrintedSources`，只給 Minion bearer，依真實 artifact 的 silence/disabled/附著狀態重算。既有 Genesis 不會因持續獲得而重演；未來 Death/Strike/Start/End/Activated 必須分別按 instance 派發；所有帶來源的傷害與效果沿用能力來源 card，不能污染 bearer 原始特徵。Acid Rain→Bust→Sisters 依存順序仍需先處理 silence，再建立 Bust 授予來源，不能在最後以卡名合併繞過。

Key 模型提供 `siteAbilityCanAffect` 規則閘，已測指定、傷害、destroy、banish、modify、move、阻移／阻攻、得失生命、heal 與 mana／threshold／draw／site characteristic 差異。正式接入時需獨立保留 **ability origin**；現有 `castRarityLifeLoss` 由 Site 發動但 queueEffects 的 `effectCard` 是正在施放的卡，單看 `effectCard.type` 會漏掉 Site 保護。

共用引擎待接入口清單：`canTarget`／selectUnit；`hurt`／`kill`／`sendUnit`；`loseLife`／治療；位移前的來源檢查；`refreshContinuous` 每一個 site 能力授予／抑制區塊；`canEnterOnGround` 和 `protectedAttackUnit` 的 Site 限制；Site passage trigger、summon kill trigger、deathAlsoGenesis、castRarityLifeLoss。玩家資源、抽牌、threshold、Flooded 水地特徵與站點本身保護不得跳過。完成這些入口與真 dispatch 正反向測試之前，不開放 Key。

### Key 來源保護整合進度（同日續接）

來源追蹤已正式接 Storyline：frame 與 eventContext 分開保存 `abilityOrigin`，不受被施放 Magic 的 `effectCard` 覆蓋。相同施法效果的續接即使改成由被拉動單位作為 acting source，也保留原 Site 來源；獨立新來源開始自己的來源。`tests/final-source-tracing.test.js` 4／4，包含選擇中 JSON 存檔復原。

Key 基礎保護已逐步接入共用引擎：指定／一般選擇、傷害、得失生命／治療、即時 destroy/banish、return、進場力量限制／牆／Fence、地下連結與移動優待、Site 抑制潛水、站點持續類型／關鍵字／力量／揭露、Bower、Dome 攻擊限制、terrainEffect 暫時 silence/disable/Immobile、Sea of Ash、Thin Ice。owned `final-sites.js` 已處理 Orpheus、Sanctuary、Dungeon 及 Mudslide；`final-built-sites.js` 已處理 Rift 的被帶動單位。Camlann 玩家選擇保留者是唯讀選擇，使用 `protectionReadOnly` 例外，後續實際摧毀另檢來源，避免錯把不受影響者排出保留選項。

`tests/final-key.test.js` 真 dispatch 12／12 通過，包含同時保護有益／有害 Site 能力、Magic 仍可造成傷害、Key 沉默／卸裝／bearer 沉默的差異、River of Blood、Bower、Dome、Orpheus、Mudslide、terrainEffect 存檔與 Thin Ice 門檻。不因這些案例而宣稱全部 Site 交互完成：直接 uid 特殊操作續接、各新增模組的 Site source 批次效果仍持續審核，未將卡加入 playable。共同回歸（layers、source tracing、Key、artifacts、sites、built-sites）84／84 通過。

本輪共用 patch 均以 `/tmp/build-key-*.py` 及 `/tmp/build-site-source-tracing.py` 等 fresh 原稿產生後由 root 接入，未直接覆寫 root 的共用工作。

### Key 反向規則與 Pallid 實際結算續接

Key 測試已增至 **17／17**（不是開放旗標測試）：額外驗證每個 live Key 提供 1 mana、當前 bearer controller 改變／沉默／卸裝、Temple 犧牲成本，以及 Planar Gate 的有益站點能力也必須忽略。真正由 River of Flame 作 Spellcaster 施放的 Minor Explosion 仍對 Key bearer 造成精確 3 傷害；來源是 Magic，與 Mobbed Court 因施法觸發但 `effectCard` 也為 Magic 的 Site 能力區別處理。committed Magic 與 Orb 複本明確宣告 Magic 自身 `abilityOrigin`。

[官方 Sacrifice Codex](https://sorcerytcg.com/codex/b6ffd09a-c8fb-4b80-ac24-4900e8fd5ca3) 已以 CUA 核實：犧牲優先於所有摧毀預防及替代，仍是死亡，會觸發 Deathrite。Temple 的成本選擇使用唯讀保護例外，而犧牲結算仍由正式引擎進墓地／記死亡。相反地 The Void 的遊戲規則放逐繞過 Site 來源保護，正式測試確認進 banished、不進 cemetery、不增 deathHistory，沒有錯跑 Deathrite。

Pallid 已有真實、但尚未註冊到卡片的 `pallidPreparedDefinitions` 與 `finalPallidBust` Genesis：從任一實體墓地放逐合法亡故 Minion、保留原 owner 的 banished 區、Artifact 保存印刷 card ID。它走既有墓地權限、Worm 與 Bureau API，不用文字比對臆測。`tests/final-ability-integration.test.js` **4／4**：真 Genesis 放逐／passive 生效／save、Bureau 支付一次且 save 不重稅、兩個 live Bust 獨立堆疊及失效，與不同條件來源各自結算。

正式 `auraPower` continuous consumer 已按 `unitPassiveLayerViews` 逐來源結算，保留每個來源完整 `types`／`allies`／`other` 條件及真 bearer 特徵；不盲目加總 scalar。其他 passive 消費者、印刷類型／觸發／主動能力與依存順序仍未全部接完，故 Pallid 仍不加入 playable。`printedAbilityRecord` context card 與 `finalAbilityRecord` 已有優先入口，讓 Vivien 等後續來源模型不會重複拼接同一來源。

### Key 正式註冊結案（本輪）

最後補齊 Cloud City／Baba Yaga 的 Site 搬移帶動普通與分肢單位入口；正式啟動測試確認 protected bearer 留原格，普通 occupants 搬動；Magic 來源交換仍能帶動 Key bearer。繼續維持地點特徵與遊戲規則後果：若留原格成 void，沒有 Voidwalk 仍依遊戲規則放逐。

已從 `finalArtifactPending` 移除 Key、在實際 artifact passives 註冊來源保護，cards.install 後可從手牌正常施放，並以真 hand cast 測費用支付、手牌消失、指定 bearer 裝備、mana +1 與 Site damage 忽略。`tests/final-key.test.js` 最終本輪 **22／22**，無已知尚未接入的核心 Key 機制；前述「仍不 registry」段落是同日實作歷程，已由此節與表格狀態更新取代。全遊戲未完成卡牌的效果仍遵循整體專案限制，不將未來新增 Site 的自訂 mutation 自動視作已驗收。

Key 另已補「不能被修改」交互回歸：Monks of Kobalsa／Tabula bearer 不能獲得來源保護能力，但 Key 向玩家提供 1 mana 不修改 bearer，仍生效。依 [Can’t be Modified Codex](https://sorcerytcg.com/codex/5b78b0b7-6d27-421b-898e-cc69bd33771b) 的不能獲得能力規則，正式回歸為 22／22。Pallid live source helper 同樣排除原生不能被修改及 Tabula 的 bearer。

### Arthur 下的 mana 與 bearer 能力

Key 的 `Provides (1)` 給實際 artifact controller。正常情況是攜帶者的 controller；Arthur 使受控制 relic 回到 owner 控制時，mana 改給 owner，但敵方 bearer 仍得到 Key 的 bearer 能力。這兩種歸屬不能共用同一個 bearer-controller 判斷。官方 Arthur FAQ `be452d85-9a36-4c12-8ccf-43ee489bab87`（revision `6Ke5xshZdLsJpk9EDE54Vv`）支持這個分離；`tests/final-arthur-artifact-actor.test.js` 的實際 Key／Malleus／Mix Aer 正反向案例已通過。

Activated descriptor 新增明示 `bearerGranted`，只代表卡文授予 bearer 自身的操作。`bearerSource`／`bearerTap` 本身僅表示解析來源或費用，不能當作控制權分類。Bull Whip 等明示 bearer 操作已另備 metadata patch 與真實 adjacent-target 回歸；Mix Aer、Toolbox、Corpse Catapult 等 artifact 自有 activation 仍按 artifact controller 操作。
