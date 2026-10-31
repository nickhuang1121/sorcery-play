> 2026-10-30最新：使用者已批准Globe留原Aura格／等值投影去重、Snowball單圈、雙Throne當前回合玩家勝；這些是專案裁定，取代本文相應舊未決描述。Globe已正式開放；Chaoswish可真正免費conjure Globe，僅Book結果仍阻擋。最新原生、同步、實際UI證據見FINAL_FIVE_RULINGS_IMPLEMENTATION.md。Book的target算choose已確認，single／Ward時點仍未選家規。

# 最後 101 張：逐步洪水與 Snowball

實作：`src/final-waves.js`。測試：`tests/final-waves.test.js`。本批命令 `node --test tests/final-waves.test.js`：**32 項通過、0 失敗**。

## Wave of Eviction：正式註冊、效果測試通過

`finalWaveDefinitions.wave_of_eviction` 先選一個己方水site，再選東西南北，從該處逐格進行：

1. 記錄該site敵方unit（含Avatar、上下層）的原始region。
2. 同一continuation中，將下一site暫時flood並逐個將合法敵人強制移動一步；不設 `carryTeleport`。
3. 透過引擎state-based檢查觸發進入site、跨牆等效果。這些效果可暫停供玩家選擇，在下一步洪水前完整結算。
4. 繼續至realm邊緣。即使遇void，洪水仍往前；unit不被強制跨region。不能flood的Bedrock保持原狀。

10項真dispatch測試覆蓋：推敵不推盟友、完整ray逐格flood、跨void繼續但unit留在gap前、submerged與到站flood同時、Troll Bridge中途選擇先於後續flood、Talus免強制、Bedrock不變、回合結束退水、Wall of Fire跨牆傷害、submerged不能進入無法flood的地下區域，以及只能選己方水site。部分測試同時涵蓋多項。

本卡仍屬專案整體的「部分支援」級別：已完成以上明確核心機制；尚未全面驗收全卡交互與所有同時trigger排序。

## Snowball：一般流程正式可用，保留 Globe 閉環限制

`finalWaveDefinitions.snowball` 已正式註冊，測試沒有注入 definition；`experimentalFinalWaveDefinitions` 不再包含本卡。**整體仍列部分支援**，唯一目前保留的本卡規則問題是下面的同區域 Globe 閉環，不把一般流程正式可用宣稱為全部交互完整。

沿 piercing projectile 的起點、終點與沿途收集除 caster 外所有 unit，包含 Stealth。每格以強制移動搬運並維持實體攜帶物；中途 entry／跨牆事件先結算，再續行。傷害依球停止時仍在球內的 unit 數，對該實際 location 的 unit 各造成一次傷害。多格 unit 仍只算一名，沒有用 teleport 跳過步進。

### 大型重疊與 Talus：已依攜帶通則解除原問題

[Carrying Units](https://sorcerytcg.com/codex/5f6697d3-c0a4-42b3-b682-ce807b9e4cd4)，`_rev=9CUWpgoW5Q44hTUbbHICNy`，更新 2026-02-09T18:42:26Z，規定以 pick up／carry 或類似措辭建立的攜帶關係採相同機制：無法進入時不移動，只有在不再共享 location 時才掉落。Snowball 卡文明確使用 pick up 與 carry，因此主代理接受以此**通則推導**處理攜帶關係；不是宣稱 Snowball 專屬 FAQ 直接回答以下組合。

- 球沿 `11 → 12 → 13 → 14` 向東，Mountain Giant 最後停在 anchor13，佔13／14／18／19，不能再東移；因仍與球的14共享 location，仍被攜帶。14另有一名普通 unit 時，球內精確為2名，兩者各受2傷；不強行把 Giant 推出邊界。
- Talus 的 force immunity 禁止被運送，但不等同禁止原地被拾取。Talus 在終點可被拾取並計數；在起點或途中被拾取後，若下一球位置不再與它共享 location，就留在原地掉落，不計最終球內數量。
- 被中途事件移出球位置的 unit 會掉落；若其後確實再次處於球的剩餘 path 上，可以再被拾取，不能因曾掉落就永久禁止再拾取。

適用範圍不是任選部分通則：上述位置共享與掉落準則描述攜帶關係本身。Carrying Units 中另以「可攜帶其他 unit 的 units」為主詞的基本 Pick Up／Drop 能力、movement keyword 授與段，只授權 unit carrier；projectile 不是 unit，沒有因此獲得額外基本能力或 keywords。

### Stops：零移動不造成傷害

[Stops](https://sorcerytcg.com/codex/a8c1b7eb-e60a-4087-8715-ea6799593ea2)，`_rev=sUoj7uhqXTsr7OTcIoe8d1`，更新 2026-02-09T18:39:34Z，**直接以 Snowball 為例**說明沒有進入任何新 location 就沒有移動、不能 stop，因此不造成傷害。實作以可序列化 `travelled` 計數；起點在邊界、下一格是區域邊界或被 projectile barrier 阻擋時，都不造成原地傷害，也不消耗單位 Ward。仍照常支付已確認施法的費用。

### 第三項問題：同區域 Globe 閉環仍未裁定

[Magellan Globe FAQ](https://sorcerytcg.com/cards/magellan_globe) `eXfZjLHocReFQIApZdKXfc` 允許 projectile 跨邊而不換 region。[Projectile](https://sorcerytcg.com/codex/c81c8875-ef70-4202-8c98-7ac00ece0cc6?sub=5579128906a2)（2025-07-05）說 piercing projectile 在 region boundary 停止。因此滿是同一 region、沒有 barrier 的封閉環上，沒有已核實的停止點。

[Path](https://sorcerytcg.com/codex/2ba56532-3ac0-41e8-a73f-1005cbefe8db)，`_rev=8aI8S9xlkRICgxHcEvKk9U`，更新 2026-10-12T17:46:02Z，雖規定宣告 unit movement 不重複特定 step，尚不足以授權令 Snowball projectile 在重複邊時自行停止。故本實作**不採用自動停止推論**，也沒有任意20格／20圈上限或憑空計算傷害。

若下一步仍合法、仍在原 region、但將重複已走過的有向邊，明確拋出 `UNSUPPORTED_SNOWBALL_CLOSED_REGION_LOOP`。這是尚未支援的反覆路徑護欄，不宣告官方平局或自行給出最終傷害。該次 dispatch 保持原輸入狀態；若前面已有中途選擇提交，先前已提交的移動／費用仍保留，不宣稱整張施法可跨多次 dispatch 倒退。JSON 恢復後仍保留 visited 與 travelled，無法透過重載繞過護欄。Globe 原型本身仍不是全面正式支援；此限制也明確保留於本卡的部分支援紀錄。

### 驗證

32 項 waves 測試包含原有 Wave of Eviction 效果及 Snowball 的正式 registry、起終點／Stealth、caster 排除、攜帶神器、單位免 force／免 Magic 傷害、Giant 重疊精確2計數、Talus 起點／途中／終點、掉落與再拾取、中途 JSON、Troll Bridge、Wall of Fire、三項零移動負例、Globe 跨邊後遇真 region boundary 才停止、The Void 不得偷偷切換原 region，以及 active Moeba 依接觸擬足新增位置。閉環測試嚴格驗證錯誤碼、沒有虛構傷害、單次回滾及中途存檔後的局部回滾。

## 整合入口

- `finalWaveDefinitions` → `definitions`。
- `finalWaveOperations` → `storyline.operations`。
- `resolveFinalWaves(s,frame,A)` → 在generic projectile resolver前呼叫；flag `finalSnowball`沿用既有付款前方向宣告。
- `finalWaveMovementPending(s,u)` → `pendingMovement`入口，保留連續移動途中「尚未停下」狀態。

## 官方核對來源（2026-10-30）

以下卡牌FAQ與子條以瀏覽器展開讀取，不依賴摘要猜測：

- [Snowball 卡文與兩FAQ](https://sorcerytcg.com/cards/snowball)：Stealth也受path影響；path包含起點與終點。
- [Wave of Eviction 卡文與FAQ](https://sorcerytcg.com/cards/wave_of_eviction)：flood與到站同步、逐步entry/flood triggers先結算、跨void仍繼續、unit不可強制跨region。
- [Enemy Codex](https://sorcerytcg.com/codex/251c23c3-c934-4399-8edf-84fa24dcad8d)：未另指明時enemy只指對手unit（含Avatar），所以不擅自搬運地面神器或site。
- [Projectile、Piercing Projectile、Projectiles That Cause Forced Movement](https://sorcerytcg.com/codex/c81c8875-ef70-4202-8c98-7ac00ece0cc6)：同region；piercing不能hit同一unit兩次；強制搬運路徑必須跟隨原projectile path。
- [Forced Movement Codex](https://sorcerytcg.com/codex/8ffdae56-1aef-44f7-b9af-cdcbc334a377)：非自行step為強制移動；一般不可跨region。
- [Carrying Units Codex](https://sorcerytcg.com/codex/5f6697d3-c0a4-42b3-b682-ce807b9e4cd4)：共享位置維持攜帶、無法進入不等同立刻掉落。
- [Stops Codex](https://sorcerytcg.com/codex/a8c1b7eb-e60a-4087-8715-ea6799593ea2)：Snowball 未移動不能造成停止傷害。
- [Oversized Units Codex](https://sorcerytcg.com/codex/7f57fe26-eac3-45a4-b449-994fef47d872)：整體沿同方向平移，任一部分不能移動便整個unit不移動。

補驗：Failed Mutation的卡文僅禁止Magic指定與傷害，不免於未指定的強制移動；新增兩項測試確認Wave可推動、Snowball可搬運但結尾Magic傷害被其能力預防。

## 現行官方規則書交叉查核（2026-10-30）

另查 [官方 How to Play 所連結的規則書](https://drive.google.com/file/d/1sgQo0xf0N2teIR0zlyl91g9j6LVncZnr/view)，實際檔案為 October 2026 版，官方 Drive 修改時間 2026-10-12T20:32:30Z；本次使用已擷取的 38 頁全文，不重下載。舊新聞連結的日期不能代替實際檔案版本。

印刷第21頁的不得重複特定步驟，明確出現在 Moving your Units／Move and Attack 段落；第30頁 Projectiles 仍描述同 region cardinal 飛行至 region edge／第一個 unit，沒有授權在封閉 Globe 路徑重複邊時自行停止。全文搜尋 loop、infinite、repeat、draw／tie game、simultaneous win／lose，沒有找到足以處理這個 projectile 閉環的停止或一般循環平局條款；infinite／endless 命中僅為敘事用語。故這份新增 primary source **仍未解除**上述閉環 guard；這是對該版本已查內容的結論，不宣稱其他官方管道不可能有裁定。
