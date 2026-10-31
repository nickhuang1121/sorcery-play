# Corruptor / Persecutor：完整規則核心與來源視角

實作：`src/final-types.js`（contextual helpers），`src/final-avatars.js`（能力、追蹤最短合法步驟、烙印與次數），以及 engine 的 `cardForPlayer(s,id,p)`、`unitTypes(u,s)`、`unitUmbrellas(u,s,viewer)`。API 保留 logical player，沒有交換 cards catalog、所有權或玩家資料。

## 已核官方來源

2026-10-30 已用官方網頁展開 FAQ 核對：

- [Corruptor 兩項 FAQ](https://sorcerytcg.com/cards/corruptor)：影響 everywhere；追加 Monster／Undead／Demon，保留 Beast／Mortal／Angel。Beast 仍享 Pond；Mortal 仍受 Bower 影響。
- [Persecutor 五項 FAQ](https://sorcerytcg.com/cards/persecutor)：每己回合只選 Step 或 Brand 一項；Brand 非 target，可跨 region、選 Stealth、不可修改者；不破 Ward，亦不因「被視為」Evil 而失去 Ward；Closest 只考慮相同 region。
- [Saint of Redemption 五項 FAQ](https://sorcerytcg.com/cards/saint_of_redemption)：直接確認 Saint 在場時，Persecutor 的 Brand 也不能讓僕從被己方卡牌視為 Evil。此交互已有明確裁定，不再列未知。
- [Evil Codex](https://sorcerytcg.com/codex/400bbb94-8877-4eea-ad2d-bd466aee2622)：Undead、Demon、Monster 僕從為 Evil。
- [Ward Codex](https://sorcerytcg.com/codex/ae9b6774-aa8f-45c5-a424-d6d7e58014c3)：自然變成 Evil 的僕從失去既有 Ward；Persecutor 僅改變己方卡牌的看法，所以不移除 Ward。
- [Can't be Modified Codex](https://sorcerytcg.com/codex/5b78b0b7-6d27-421b-898e-cc69bd33771b)：不能改變 characteristics；Monks 在 realm 才有此能力，手牌時仍可被減費。因此 realm Monks 不被追加 Undead，手牌的類型查詢照常受 Corruptor 影響。
- [Enemy Codex](https://sorcerytcg.com/codex/251c23c3-c934-4399-8edf-84fa24dcad8d)：enemy 指單位，含 Avatar。Brand 不擴張到敵方 Site／神器／Aura。

## Corruptor

`contextualCard` 接收卡與其目前 logical owner/controller，回傳派生 descriptor，保留印刷 metadata。`finalBaseSubtypes`、`finalBaseUmbrellas` 讓先前派生結果可重新計算，避免 Corruptor 被沉默／離場或控制權變更後殘留額外類型。從手牌、牌庫、墓地、收藏區、牌庫頂到施放中的查詢，均走相同 descriptor，沒有以僅供場上單位的旗標取代全部區域。

場上 `contextualUnitTypes` 用目前 controller，場外查詢用實體區域 owner；搜尋者不會把敵方墓牌變成自己的 Undead。墓地重新定義「你的墓地」也不會暗中轉移牌的所有權。不能修改的場上單位跳過類型追加。

整合包含通用 deck/grave selectors、typed minion entries、castingCard／cost／threshold、Doomsday Cult 牌庫頂權限、Pond、Monstermorphosis、Pond Wonder、Mephistopheles 手牌 summon、Hyena 墓地 Demon 判斷、複製入場 Ward、連續場上 tribe 效果、AI 類型評估。仍直接讀印刷 Beast／Mortal／Angel 的資料用途，不因追加語義而改變原類型；規則上需要完整類型集合的查詢使用 helpers。

## Persecutor

烙印紀錄包含 uid/player/turn。自然 `unitUmbrellas(u,s)` 用於 Ward 等共通規則；只有卡牌來源傳入第三參數 viewer/controller，才看見該玩家的 Brand。兩者不共用變更過的 catalog 或全域 Evil flag。Saint 的明文覆蓋優先。

來源視角已接入 Begone／Smite／Holy Water／Accusation、Day of Judgment、原生 Intrepid Hero strikes、神器 trait strike bonus、Evil-sensitive Site power／Hellmouth Burrowing／Defiler Spire／Purgatory death trigger、Aura tribe matching與Crucifix入場限制。Crucifix 以真正的 artifact controller 判定，不以欲移動單位的控制者猜測；相同卡在對手控制下不能看見己方的 Brand。

Step 由既有合法一步路徑建圖，反向 BFS 找到最近 Evil 的真正最短路徑，不用任意 teleport。它可朝最近的盟友 Evil 前進。Step 與 Brand 共用每己回合一次，並使用原生 movement frames，保留途中觸發。序列化／restore 後仍能正確到期。

## 驗證

`node --test tests/final-types.test.js`：22 項（其中 16 項經真實 dispatch，其餘驗證 contextual query／restore／正式註冊），涵蓋三種追加類型、所有權與控制權差異、沉默撤銷、不可修改者、牌庫／墓地／Cult、Pond 門檻與費用、Angel Ward／Saint、Brand Ward／Stealth／跨區域／次數、雙方 Judgment、雙方 Site／death trigger／Crucifix、合法 Step、原生 Evil Lethal 與到期。

原生戰鬥測試發現舊 `printedKeywords` 把「Lethal to Evil」解析成無條件 Lethal；已修正排除此條件片語，繼續由來源視角的 `lethalTo` 判斷；保留嚴格的未烙印敵人存活、已烙印敵人死亡斷言。22 項全部通過後，已由 Avatar 模組將兩張正式註冊，並測試實際 definition 與 playable metadata，未以「尚未測每張組合」永久列為部分核心。
