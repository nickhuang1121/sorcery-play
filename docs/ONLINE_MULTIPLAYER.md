# GitHub Pages、Firebase 與 Google 登入

目前正式接法是 **GitHub Pages 提供靜態遊戲，瀏覽器直接連 Firebase Authentication 與 Realtime Database**。玩家不必安裝 Node、不必執行 `npm run start:online`，也不需要另外部署 Cloud Functions。

正式網址：<https://nickhuang1121.github.io/sorcery-play/>。

## 登入與使用方式

1. 開啟首頁，選擇「線上對戰」。
2. 按「使用 Google 登入」，選擇自己的 Google 帳號。
3. 建立房間或輸入朋友的房號。兩位玩家必須使用不同 Google 帳號；同一帳號在另一裝置開啟同一房號，會恢復原席位。
4. 選擇牌組、上傳並準備，再由房主開始。
5. 對局使用原本完整的卡圖戰場、拖曳高亮、卡牌堆疊、統一彈窗、即時動態與特效。結束後可下載完整重播。

登入狀態由 Firebase SDK 保存在使用者裝置，重新整理時先等待身分恢復，才讀取房間。登出時先結束自己的在線狀態，再登出 Firebase；不會登出瀏覽器本身的 Google 帳號，也不會刪除離線存檔或本機牌組。

## Firebase 設定

公開前端設定在 `src/net/firebase-config.js`，專案為 `sorcery-codex`。網頁用的 Firebase API key 是公開設定，Google OAuth client secret、管理員憑證及 Firebase CLI 登入資訊不可放進 GitHub。

Firebase Console 的 Authentication 已啟用 **Google**，其他供應商暫不啟用。公開名稱設為 Sorcery Play，支援信箱已經專案擁有者確認並設定。允許的網域已加入：

- `nickhuang1121.github.io`
- `localhost`
- `127.0.0.1`
- Firebase 專案本身的預設網域

正式專案路徑 `/sorcery-play/` 不填入「允許的網域」欄位；登入白名單填的是主機名稱。

資料庫規則在 `firebase.database.rules.json`。原本會於 2026-11-29 到期的全開測試規則，已換成 Google 登入與房間成員規則。未登入、匿名與密碼登入都不能操作線上房間。

若將來需要重新部署規則：

```sh
firebase deploy --only database --project sorcery-codex
```

這是維護者的一次性設定工作，不是玩家啟動遊戲的步驟。

## 房間與同步

- 使用 Google 的 Firebase UID 決定房主／客席；修改瀏覽器儲存的席位不會取得別人的權限。
- 原子交易處理席位認領與對局提交。每次出牌使用預期版本、命令識別碼與選擇標記，避免競爭寫入、重複執行或舊選項誤送。
- Firebase 儲存目前對局與重送收據；重新整理或跨裝置恢復時，不會重新播放全部歷史特效。
- 透過伺服器時間戳記、心跳與 `onDisconnect` 記錄在線狀態。
- 新玩家進入大廳時會檢查過期房間：**雙方最後活動都超過 15 分鐘，才以交易標記刪除，再清除房間**。新心跳會使舊交易失敗並重試，不能刪掉剛有人回來的房間。資料庫規則也會重新檢查時間與刪除條件。
- 房間目錄只有索引，非成員只能讀取房間公開狀態，不能讀取對局 payload。測試與遊戲使用新的 `onlineRoomsV3`／`onlineRoomDirectoryV3` 範圍。

## 朋友對戰的信任範圍

這個版本依使用者選擇採用朋友對戰模式。兩位房間成員都會取得底層對局資料來執行規則；畫面會隱藏對手手牌與牌庫，但不能保證參與者透過開發者工具也看不到底層資料，也不能把客戶端檢查視為競技防作弊。

若日後要讓任何一位玩家都無法取得對手隱藏資料，需再增加 Firebase Functions 等雲端裁判。這不是目前版本的部署前提。

## 本機開發與驗證

一般開發使用 VS Code Live Server 或 `python3 -m http.server 8765` 提供靜態檔案即可；Google 登入需使用已允許的主機名稱。`server/` 與 `npm run start:online` 保留為選用的本機裁判回歸工具，正式前端不呼叫它。

- `tests/firebase-google-auth.test.js`：Google 專屬身分、持續登入、彈窗、登出與錯誤訊息。
- `tests/firebase-friends-model.test.js`：119 次動作的完整 Firebase 對局資料流程、席位、版本與清房時間。
- `tools/test-firebase-online-live.mjs --live`：使用 Firebase CLI 管理員憑證限制為測試身分，驗證實際已部署規則與交易；只建立並清除自己的隔離測試房間。它不是 OAuth 登入畫面的替代測試。
- 完整 Node 回歸：**2804/2804 通過**；Google 登入、Firebase 對局、同步與語言針對性測試另為 20/20。
- 實際 Firebase 規則／交易：8 項檢查通過，兩個受規則限制的 Google token 測試身分執行 119 次操作，19 回合自然結束，生命 14／0。這不是兩個 Google 帳號的瀏覽器 OAuth 實戰。
- Chrome 已實際完成 Google OAuth 登入、建房、上傳牌組、準備、重新整理後恢復席位與登出；測試時沒有 Node 對戰服務。
- 390×844 手機頁面已檢查中英文、選單、關閉及登入前操作限制，並修正頁首擠壓與英文席位標籤。
- 本機證據在忽略上傳的 `output/firebase-online/`。Firebase 設定與規則已套用；前端已由 GitHub `main` 分支部署至上述 GitHub Pages 正式網址。
