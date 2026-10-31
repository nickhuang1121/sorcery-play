# GitHub 上傳與排除規則

專案根目錄的 `.gitignore` 排除本機產物；`card-images/.gitignore` 只放行卡圖索引正在使用的版本。目前已連接 `nickhuang1121/sorcery-play`，GitHub Pages 從 `main` 分支根目錄自動部署。

## 不提交的內容

- macOS／Windows 雜項、編輯器設定、快取、依賴、建置與測試輸出。
- `output/`：UI 截圖、檢查報告、匯出牌組與匯入測試下載檔。
- `.log`、`.tap`、`data/` 中的工作備份、舊回歸輸出與臨時瀏覽器存檔／截圖。
- `tools/pending-audit/` 中未套用的工作補丁與草稿；目前執行中的測試與工具均不依賴此目錄。
- `.env`、私鑰與伺服器服務帳號檔；`.env.example` 等範本仍可提交。
- 卡圖索引未使用的其他印刷版本。本次有 1,985 張、約 108.7 MiB；本機仍保留，之後可重新選用。

## 必須保留的內容

- HTML 入口、`src/`、`styles/`、`language/`、`package.json` 與開發文件。
- `data/official-cards.json`、`data/card-image-index.json`，以及測試所用的基準、場景、實戰重播與審查資料。不要整個忽略 `data/` 或 `tests/`。
- 索引使用的 1,097 張正反面卡圖、`assets/conduit/` 的特效圖／索引與 `LICENSE.txt`。
- `src/net/firebase-config.js` 是線上功能直接匯入的瀏覽器設定模組，目前保留；伺服器服務帳號 JSON 與此檔分開處理。
- 審查工具引用的少量 `ui5500-*.json` 與三份 Book UI 證據已特別保留。`data/all-cards-audit/logs/.gitkeep` 保留工具輸出目錄，避免乾淨副本執行時缺少資料夾。

## 卡圖更新時

執行以下命令會重建索引並同步卡圖排除清單：

```sh
node tools/build-card-images.mjs
```

若只改動了索引，則重新產生排除規則：

```sh
node tools/update-upload-excludes.mjs
```

先前索引使用的卡圖取消引用後會被忽略，新索引引用的圖則會放行；這些指令不會刪除本機其他卡圖。

## 驗證範圍

以暫存 Git 儲存庫實際套用兩份 `.gitignore`，確認必要引用未被排除，並建立僅含待提交檔案的隔離副本。該副本重新建卡圖索引的結果與原索引一致；再於隔離副本執行完整 Node 測試。

檢查細節保存在本機 `output/github-upload/`，該目錄本身不提交。排除規則預估減少約 134 MiB；這是初次掃描時的數字，之後產物增加時會改變。

專案根目錄已建立 `.git` 並保留遠端提交歷史；之後使用 Git 加入檔案時會套用規則。若改在已有歷史的儲存庫使用，`.gitignore` 不會自動取消既有檔案的追蹤。GitHub 網頁手動上傳也不會自動套用本機 Git 的排除規則。

本次隔離副本驗證結果：完整 Node 測試 **2775／2775 通過、0 失敗**；17 個忽略行為案例通過，卡圖索引重建一致。

線上服務的私密房間資料 `.online-data/` 已忽略，不能上傳；`server/` 原始碼與 `docs/ONLINE_MULTIPLAYER.md` 需要上傳。正式線上對戰由 GitHub Pages 直接連接 Firebase，玩家不必執行 Node。`firebase.database.rules.json`、`firebase.json`、`.firebaserc` 與 `.nojekyll` 應一併上傳；Firebase 規則由維護者另外部署。
