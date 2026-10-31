# Minion 全卡稽核

範圍為 `data/all-cards-audit/minions.json` 的 489 個原始印刷 Minion 條目；runtime copy 不另計。只更新本類別，不更新其他類別或 aggregate。

目前依清單順序完成前 100 個條目的基本流程測試，其中前 75 個另有有意義的原生印刷效果案例；第 76–100 的 25 張仍待特殊效果測試，其餘 389 張 unreviewed。`node --test tests/catalog-minions.test.js`：175／175，紀錄 `/tmp/catalog-minions-first100-basic.log`。

每張普通 Minion 都真正從手牌施放、支付印刷 mana，並驗證 mana 不足及缺少印刷 threshold 時拒絕施放，以及實體 ID／owner／controller／JSON 還原。Bruin 為 Token：明確測試不可手牌施放，改由真正 Druid 能力召喚，再以實際 Zap 測試它替 Avatar 承受傷害。基本流程測試本身不當成特殊效果已通過。

前 75 個的效果案例包含原生 Albatross 追溯實際施法擊殺者、Phoenix 的真 Fire Magic replacement、Army 移動／受傷留下 Skeleton、Aino 跨邊、Apostles 源真正死亡放逐 Angel、Gabriel 的非 Spellcaster 綁牌實施放、Michael 跨 region／友敵對照、Black Cat 九次致死與對手隨機選擇、墓地復活／祭品費用、全域 Site attack bonus、吞噬釋放、三步移動逐地點打擊、免費 Dragon 僅一次、Candlemas 結束回合、物理墓地 Plunder、墓地單區三張放逐與跨區限制、真正 Site 播放觸發回墓。逐張精確測試名稱及所驗證範圍都記在 JSON，不宣稱涵蓋任意交互。

已修正：Aaj-kegon Ghost Crabs 的 rowVoidPower 原只計空格，漏算同時為 Site 與 void 的 The Void。共用引擎採現有 `geometryIsVoidCell`；真實施放回歸涵蓋 The Void、其沉默、普通空白 void 與 JSON 還原的 power 計數。修前紀錄 `/tmp/catalog-aaj-before.log`，修後已在正式測試檔通過。

待裁定：Bane of Aventis 對 Monks 的控制改變是否屬「不可修改」禁止的 status modification。controller 不在官方 Minion characteristics 清單；既有 King／gained guard 行為只是實作先例，不能代替規則依據。兩候選為控制允許（不是 characteristic）或控制禁止（屬 status modifier）。紅測保留 `/tmp/catalog-minions-batch2-effects.mjs`，不擴充 guard、不放寬斷言、不宣稱確定 bug。Bane 其他主要效果另有獨立真測：nearby Warded 群體奪控、far／unwarded 排除、保留 owner、失去 Ward／Bane 死亡／JSON 後仍控制。

版本限制：卡文使用 `data/official-cards.json`，SHA256、精確 card ID、印刷文字／費用已寫入每列；FAQ/Codex 的 ID、revision、updatedAt 來自 `data/final-101-official-source-index.json`。這些快照不冒充逐張現行官方頁檢查。The Void 官方頁已實讀，Aaj 頁工具不可讀；Bane 頁可讀但工具標示兩週前 crawl。實際瀏覽器 UI 全部 unreviewed，沒有用 engine／helper 測試代替 UI 驗收。

下一批：先補第 76–100 的原生特殊效果，再繼續第 101–125。精確剩餘清單及各維度見類別 JSON；未測區域、反應、取消與 pending-choice 存檔仍須保留限制。
