# Sorcery: Contested Realm · 本機網頁遊戲

原生 HTML、CSS、JavaScript ES Modules；無框架、無 npm 依賴與建置步驟。核心遊戲使用本機官方卡牌快照；可選 AI、本機雙人與四副官方 Beta 預組，自組牌可匯入、匯出及保存於 localStorage。線上雙人使用 Firebase 的 Google 登入與即時資料庫，兩端共用正式卡圖戰場。

在根目錄執行 `python3 -m http.server 8765`，開啟 `http://localhost:8765/`；也可用 VS Code Live Server。

線上對戰直接由 GitHub Pages 連接 Firebase，不需要另外啟動 Node。兩位玩家各自以 Google 登入，建立／加入同一房號，選牌組並準備後開始。保留雙方離線超過十五分鐘的自動清房。設定與朋友對戰的信任範圍見 [線上雙人對戰](docs/ONLINE_MULTIPLAYER.md)。

首頁提供「單機雙人」「單人 VS 電腦」「線上對戰（測試版）」與「編輯牌組」。已有未結束的存檔時可選「繼續上次對局」；停留首頁時對局暫停。

GitHub 上傳前請參閱 [上傳與排除規則](docs/GITHUB_UPLOAD.md)。

## 目前進度

**尚未完成全部卡牌。** 1100 筆官方快照中，1093 張可選、7 種衍生物、0 筆尚未開放。

本輪基準101張：**完成核心效果與逐卡效果測試 101 張／部分實作 0 張／尚未開始 0 張，合計101。** 完成核心不代表全卡交互或完整官方規則已驗收；所有可選牌仍標為部分支援。不能用瀏覽器載入或預組對戰代替逐卡效果驗證。

[101張逐卡證據、限制與下一步](docs/FINAL_101_PROGRESS.md) · [機器可讀進度](data/final-101-progress.json) · [已知缺口](docs/KNOWN_ISSUES.md) · [官方規則來源](docs/RULE_SOURCES.md)

## 驗證與操作

- `npm test`：最新完整 Node 測試 **2804/2804 通過**，包含既有回歸、新卡效果與未開放 helper。測試數不是完成張數。
- `npm run test:games`：16種官方 Beta 預組配對；會更新 [對局結果](data/smoke-game-results.json)。不保證每張新卡在預組中出現。
- 本機 HTTP server 開啟 [瀏覽器整合測試](tests/index.html)：11通過、0失敗（2026-10-30T14:03:50Z）。
- `npm run progress:update`：重新跑完整 Node 測試並同步逐卡進度與文件。失敗時保留測試輸出，不改寫完成統計。

拖曳手牌或點選卡牌後選合法位置；單位可移動、攻擊、啟動、拾取及放下。右鍵／觸控長按看卡；ESC取消。Animist與Avatar of Fire有卡牌用途選單。Chaos Twister依使用者指定採數位替代：全部20格隨機落點（含空格／虛空），結果只產生一次並保存；這不是官方實體吹牌程序。

原官方 Beta 預組為36張Spellbook／16張Atlas，自組牌通常至少60／30，收藏區獨立最多10張。Duplicator另有牌庫限制。舊交付的1708項歷史測試未隨目錄提供，不包含於本輪驗證。

## 資料與權利

原始官方快照保留在 `data/official-cards.json`；本輪不可變清單為 `data/final-101-baseline.json`。初始完整備份與SHA256見逐卡進度。沒有修改Firebase設定，也沒有推送或部署。

本專案為非官方實作；Sorcery及相關名稱為Erik’s Curiosa Limited所有。卡牌採CSS與文字呈現。前一輪文件已保存在docs的 `*_PRE_FINAL_101.md`，僅供歷史參照。
