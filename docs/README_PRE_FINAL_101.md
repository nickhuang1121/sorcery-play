> 續作狀態：新增 Lucid Dreamers 虛空召喚與能力到期效果；67 項效果測試通過。現為 992 張可選用、101 筆未開始。以下第 84–88 批是上一輪歷史紀錄。

# Sorcery: Contested Realm · 本機網頁遊戲

純 HTML、CSS、原生 JavaScript ES Modules，無框架、無依賴、無建置步驟。遊戲使用本機卡牌快照，不呼叫外部 API。

用 VS Code Live Server 開啟 `index.html`，或在專案根目錄執行 `python3 -m http.server 8765` 後開啟 `http://localhost:8765/`。可選 VS AI、本機雙人、官方 Beta 四副預組或自組牌。

## 實際完成狀態

**尚未完成全部卡牌。** 官方快照共 1,100 筆：991 張卡牌可選用，7 種衍生物可生成，102 筆未開始。所有已開放卡牌仍屬部分支援，完整官方規則與全卡交互尚未驗收。

2026-10-30 本輪第 84–88 批新增 25 張，涵蓋 Automaton 戰鬥、Swap、Backstab、Blasphemy、Land Deed、King Arthur、Black Cat、Grim Reaper、X 費用與 Blaze of Glory 等機制。新增卡牌可在卡牌圖書館搜尋並加入牌組；Automaton 同時列於神器與僕從篩選。

[逐批與剩餘卡牌](docs/PROJECT_PROGRESS.md) · [已知缺口](docs/KNOWN_ISSUES.md) · [官方規則、Codex 與 FAQ 核對](docs/RULE_SOURCES.md)

## 操作

- 拖曳手牌或點選卡牌，再選合法位置／目標。
- 拖曳單位移動或攻擊；點選單位可使用主動能力、拾取與放下。
- 右鍵或觸控長按查看卡牌；ESC 取消。
- 效果視窗逐步選目標。Swap、Backstab 與 X 費用可在支付前取消。
- 牌組可搜尋、編輯、匯入／匯出並儲存至 localStorage；收藏區獨立，最多 10 張。
- 官方 Beta 原表為 36 張 Spellbook／16 張 Atlas；自組牌通常為至少 60／30。Duplicator 牌庫僅允許成對 Unique，起手各兩張。

## 驗證

`npm test`：64 項效果與回歸測試，64 通過、0 失敗。

`npm run test:games`：四副官方 Beta 預組共 16 種配對，使用固定種子，全部完成至勝負。輸出見 [smoke-game-results.json](data/smoke-game-results.json)。

本機 server 開啟 [tests/index.html](tests/index.html)：11 項瀏覽器載入與整合檢查，不讀寫測試存檔。

Node.js 僅用於開發驗證，無需安裝 npm 套件。原交付 README 的 1708 項歷史測試沒有隨目錄提供，本輪未宣稱已重新跑過。

## 資料與權利

原始官方卡牌資料保留在 `data/official-cards.json`。本輪新增卡牌的資料與即時官方 API 相同；FAQ 追蹤見 [rules-audit.json](data/rules-audit.json)。沒有使用官方美術，卡牌以 CSS 與文字呈現。

本專案為非官方實作；Sorcery 及相關名稱為 Erik’s Curiosa Limited 所有。
