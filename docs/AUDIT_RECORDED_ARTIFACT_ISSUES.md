# 已記錄神器問題的原生回歸

日期：2026-10-30 UTC。專屬測試 `tests/catalog-artifacts-recorded-issues.test.js`。本批只新增測試與本文件，沒有修改引擎、統計 JSON、既有測試或服務設定。

命令：`node --test tests/catalog-artifacts-recorded-issues.test.js > /tmp/catalog-artifacts-recorded-issues-before.log 2>&1`。

結果：**11 測，8 過、3 紅、0 跳過**。其中一項是明確標為 NON-NORMATIVE 的診斷：僅驗證實際操作與無控制者狀態，不斷言生命結算符合規則，不能計入 Flame 疑義已解。

## Blade of Thorns

- 正常原生 conjure 給 Brown Bears，power 4→7；真正 drop 不能移除 Weapon；己方 end phase 扣 2 life、另一方 end 不重扣。正常費用 3、資源不足拒絕與 JSON 均通過。
- **確認紅測**：敵方擁有的 Brown Bears 先被我方真正 Mesmerism 控制，再 conjure 我方擁有的 Blade 給它，再真正施放 King Arthur。Bearer 回到 owner 1，但 `artifactController` 回傳 Blade owner 0；目前應為 bearer controller 1。測試保留 end-0 不扣、end-1 扣 2 的後續斷言，待控制問題修正後執行到該處。
- 官方 Ownership and Control Codex 明定 Arthur 的 owner 優先規則排除 carriable artifacts。因此不是任意選擇 Artifact controller 與 bearer controller 分離的家規；既有 engine 175 行對 carried artifact 也套 Arthur owner，是更根本原因。
- 建議：`artifactController` 對 carriable card 一律先回 bearer controller 或 null；只有非 carriable card 才套 Arthur owner。由 root 整合並檢查原有 Arthur 測試是否引用舊假設。

## Fourberie Knot

- 真正 conjure 給 minion 後取得 Faerie；實際敵方 4-power Brown Bears 攻擊不造成 damage；2-power Wild Boars 仍造成 2 damage。費用 1、資源不足拒絕與 JSON 通過。
- **兩個獨立紅測**：真正 conjure 給 Avatar 後，Avatar 錯誤取得 Faerie；另外不依賴 type 斷言的原生 combat，Avatar 被 4-power unit 攻擊後 life 仍 20，應降到 16。
- 卡文主語明確是 **Bearer minion**。兩個效果都不適用 Avatar。`bearerTypes` 目前在 reset 中無 minion guard；`hurt` 的 `bearerImmunePower` 也無 minion guard。此 passive 現在僅 Fourberie 使用，可加入明確 bearer-Minon-only 註記供兩處共同判定，或局部保留正確型別條件；由 root 寫入共用引擎。
- 尚未覆蓋高低 split power 對傷害來源門檻的平均規則、silenced/disabled Knot 的所有交互；不能將上述兩處修正當完整能力層驗收。

## Flame of the First Ones

- 通過：真正 conjure 不算 stop、不改生命；Bearer 真 move 12→13 使 life `[10,20]→[11,19]`；下一己方回合移回最初未 stop 的 Site 12 再獎勵；再回同一實體 Site 13 不重複獎勵。中間 JSON 恢復、真 end/draw 推進。費用 2、資源不足拒絕、JSON 通過。
- 非規範性診斷：Flame owner 0，敵方真正 Mesmerism bearer 後由 player 1 drop，鬆置 Artifact 的 controller 為 null；player 1 真 Displace 12→8，選擇中 JSON。控制者仍 null，但引擎依歷史最後 bearer controller 1 結算，life `[10,10]→[9,11]`。
- **保留未決**：Uncontrolled Codex 只明定 owner 負責排列 uncontrolled trigger，沒有明定無控制者的 `you` 誰受益。You Codex 說 refers to player，沒有補無控制者處理。因此不以「owner 排 trigger」推導 owner 必須受益，也不自行宣告沒有任何玩家受益。測試只輸出生命結果供稽核，不把現有 fallback 當已證實正確。
- 應保留具體問題：鬆置且被位移至新 Site 的 Flame，heal/loss 是 owner、最後控制者、或不適用？現查來源未解，需進一步正式裁定；其他 carried 流程可繼續驗。

## 已實讀來源

- 既有官方卡文快照 `data/official-cards.json` 三張的 engine rules/cost；本輪不改快照。
- 本輪官方 [Flame 頁面](https://sorcerytcg.com/cards/flame_of_the_first_ones) 可讀並與快照一致；Blade 與 Knot 官方頁工具回 inaccessible，不宣稱刷新成功。
- 官方嵌入快取 `/tmp/sorcery-official-embedded-docs.json` 以 JSON 解析讀取：
  - Ownership and Control `40fc4dfb-0290-4f9e-9f98-4ad5b28ccc8f`，更新 2026-05-19；carriable artifacts 隨 bearer controller，Arthur owner 規則明確排除它們。
  - Artifact `169db6b5-aae8-407e-ae7f-07206707a5eb`，更新 2025-07-11；未持有的 carriable artifact 無控制者。
  - Carrying Artifacts `0071b464-5f55-4aaa-b959-f51ae80f902c`，更新 2025-12-05。
  - Uncontrolled `bae0959e-002a-4b58-9d3f-858c8e94093e`；owner 排 trigger，未據此擴張利益歸屬。
  - You `ab3da2d7-1bc7-414d-9737-68ce4cb79525`。
  - Flame FAQ `0c009212-a23c-4b39-a11a-d0cc7988023d`，更新 2026-03-25：新 Site 指該卡自入 realm 以來未曾停止之 Site。
  - Flame FAQ `27accf6c-3c45-4f73-90b3-0a17b5c37bb2`，更新 2026-02-09：conjure 不算 movement/stop。

所有實際瀏覽器 UI 仍待 loopback 授權；未啟動或重試 server。未碰 Book/Cradle 或任何既有待答家規。

## Root integration and legacy assertion correction

Root fixed carriable artifact control to follow bearer even under Arthur; Fourberie now gates both Faerie and immunity by printed bearer Minion predicate. Combined native subset156/156 passed. Full1998 initially1990pass/8fail:7 pre-existing tests assumed Arthur overrides carriable control, contrary to inspected official Ownership Codex40fc4dfb-0290-4f9e-9f98-4ad5b28ccc8f updated2026-05-19;1 Blaze fixture assumed unregistered Hybrids spawned. Exact prior files archived with SHA in data/official-arthur-test-correction-backup.json. Tests retained with correct strict owner/control/mana/activation expectations, gained-Arthur test additionally verifies non-carriable Site ownership and restoration. Blaze now registers real collection Hybrids and retains all survival/order assertions. Corrected107/107 related tests passed; rerunning full. Failure TAP preserved in logs/formal-1998-before-fixture-corrections.tap. These are rule/scenario corrections, not exclusion or weaker assertions.
