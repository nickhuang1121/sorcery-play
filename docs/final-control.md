# Courtesan Thaïs

官方來源：[卡面與五項 FAQ](https://sorcerytcg.com/cards/courtesan_thais)（2026-10-30 以官方網頁展開 FAQ 核對）。控制玩家可看其所有卡牌並作所有合法決策；不能強迫其認輸。重疊不累加額外回合；Vaults of Zul 跳過回合後等待下一個實際回合。火門檻是 2。

實作在 `src/final-control.js`：Genesis 排定每個 logical player 的 `turnsTaken+1`，由前一位 physical player 操控。`finalDecisionController` 直接映射，不遞迴互控，不交換 players、hand、deck、unit controller 或 owner。正在防禦的非 active player 仍自己決策。每個 effect 有獨立來源和 uid，儲存後可恢復。

`finalControlActions` 以實際操控者驗權、回傳保留 logical player 的命令；顯式 actor 的 dispatch 驗證和 online replay 的 entry.seat 驗證必須一併接入。不能信任命令自行宣稱的 actor。`finalControlActionAllowed` 禁止代為認輸。

`observeFinalControl` 僅在受控實際回合，向控制者開放該玩家 hand、atlas、spells、collection、bound spells 和私密效果選項；不打開其他玩家卡牌。回合到期後重新觀察即撤銷。既有本機存檔與 lockstep 本來就持有完整狀態，這裡的權限是顯示/決策邊界，沒有宣稱改造成具防作弊能力的伺服器。

本機 UI：human/AI 跟 physical controller；AI 評估仍以 logical actor，付其 mana、用其卡牌。受控手牌可直接操作，完整卡牌清單為唯讀。Online 命令保留 logical player，sender seat 為操控者，接收端重新驗證。

整合補丁：`/tmp/final-control-core.patch`、`/tmp/final-control-ui.patch`（由 parent 唯一共用檔 writer 套用）。`tests/final-control.test.js` 為真 dispatch 測試，涵蓋實際回合、跳過、重疊、所有權不變、原子拒絕、視野、反應角色與存檔。核心與本機／online UI補丁已由 parent 整合；目前12項真dispatch測試全通過。新增真人本人認輸、AI依實際操控者利益評估而保留logical命令，以及online envelope seat覆蓋偽造actor、拒絕缺失／無效seat、存檔重播一致性。完整套件與瀏覽器實際對局由 parent 最終驗收。

瀏覽器驗證限制：本代理呼叫 CUA 建立 localhost tab 被工具回報「IAB visibility is not supported in a subagent thread」，沒有宣稱完成瀏覽器互動；已交由 parent，未繞過限制。
