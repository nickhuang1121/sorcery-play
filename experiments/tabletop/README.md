# 森境牌桌 · 獨立實驗入口

- `index.html`：原本的純美術互動展示；「正式規則對戰」可進入實際對局。
- `battle.html`：森境牌桌＋正式版規則引擎，提供官方預組、VS AI、單機雙人、教學、牌組與對局重播。
- `lobby.html`／`online-play.html`：使用同一套正式 Firebase Google 登入、房間服務、席位認證及對局同步；保留雙方離線十五分鐘清房。

只新增或調整本資料夾的檔案，沒有修改正式首頁、戰場、規則引擎或 Firebase 程式。新入口的對局使用 `sorcery.tabletop.match`，牌組、教學及 AI／特效偏好也另設命名空間；語言設定、Google 登入與線上房間沿用原服務。

## 如何維護

`battle-app.js` 與 `lobby-app.js` 是從正式 UI 原始檔產生的入口快照。調整 import 路徑、本機儲存鍵、返回路徑、公開牌庫數量屬性，以及本資料夾的手機卡堆呈現與選牌入口；所有規則、AI、卡牌、合法動作、效果選擇、傷害、勝負、特效與 Firebase 模組仍直接 import 自 `../../src/`。沒有複製或改寫規則引擎。

正式 UI 更新後執行：

```sh
node experiments/tabletop/sync-battle.mjs
node --test experiments/tabletop/runtime.test.mjs experiments/tabletop/mobile-stack.test.mjs
```

`runtime-manifest.json` 記錄來源雜湊；`sync-battle.mjs --check` 與整合測試會偵測過期或被手動改動的產生檔。牌桌造型位於 `battle-skin.css`；`battle-adapter.js` 只增添公開牌堆資訊與既有操作按鈕的入口，不提交對局動作、不存取對局存檔。互動棋盤維持原座標平面，避免透視變形影響落點、攻擊線與特效定位。

## 驗證

完整既有 Node 測試 2832 項通過；本入口另外 11 項呈現與整合測試通過。實際介面測試包含官方預組的 AI 開局、起手牌、抽牌、手機拖曳地點、地術師觸發選擇、支付法力召喚、換回合、地下／水下與擁擠卡堆、英文橫向攻擊／防禦／死亡退場與自然勝負結算。Google／Firebase 大廳載入與正式模組路徑已檢查；本次未另開兩個 Google 帳號完成線上對局。

`qa.html` 只載入獨立測試存檔，先備份原測試對局；可驗證原版對局、牌組與教學存檔未變並還原測試存檔。`qa-fixtures.json` 的終局取自既有自然對局重播最後四個原生動作；上下層為明確標示的呈現測試場景；特效場景沿用既有驗證資料。可用 `node experiments/tabletop/build-qa.mjs` 重建。QA 不是一般玩家入口。

純展示版另外驗證桌面 1440×900、手機橫向 844×390、直向 390×844；拖曳、滑動、示意攻擊／治療、回合動態、語言、彈窗與透視切換均正常。

## 場景素材

`assets/forest-table.jpg` 由內建 image_gen 工具產生，再轉為 JPEG；完整提示詞見 [forest-table.prompt.txt](assets/forest-table.prompt.txt)。原創奇幻森林石板廣場，外圍營火、樹木與青綠石拱門，中央保留低對比空間。卡圖沿用既有 `card-images/`。展示版與正式規則入口共用這張背景。

## 手機卡堆與選牌

`mobile-stack-layout.js` 在手機直向（寬 ≤700）與短橫向（寬 ≤980、高 ≤580）使用固定比例的大卡堆，多張不再按數量縮小。其他視窗沿用正式版攤開配置。`mobile-stack.css` 將座標、地點名與張數疊在格子上，騰出完整卡圖面積。

`mobile-stack.js` 提供原生 dialog 的左右滑動選牌列、箭頭、張數、地表／地點／地下或水下頁籤，以及外點、Escape 與關閉鈕。`battle-stack-bridge.inc.js` 由產生器注入，讀取目前公開棋盤與合法動作，透過既有卡片詳情、能力按鈕、chooseAt／tryBoardChoice 執行；沒有另寫移動、施法、戰鬥規則。位置目標直接執行，單一合法單位直接選，多個合法單位才開選牌列；不合法卡片變暗且禁止確認。對局更新後關閉過時選擇。教學保留既有遮罩與指定操作。請修改這三個來源檔，再重新產生 battle-app.js，不要手改產生檔。

這次實際瀏覽器驗證：390×670 繁中／英文直向、844×390 英文橫向、1440×900 桌面；四張地表卡＋地下卡、水下卡、左右滑動與箭頭、詳情返回、原生移動、拖曳 Overpower 到雙單位格子並選擇目標、單目標直接施放、不合法地點禁止選取、長弓兵原生能力與自然勝負，以及教學第一章完成。這是瀏覽器手機尺寸測試，未以實體 iPhone 或新開雙 Google 對戰重測。

### Full mobile UI match (2026-10-31)

Removed the decorative battlefield title and subtitle. Played a fresh official Beta Earth versus Fire Easy AI game through the 390x670 English mobile browser UI: seed 14630, 106 native actions, natural victory on turn 18, life 14 versus 0. No concession, checkpoint shortcut or state injection. Covered opening hand, draw, site drag and highlights, Genesis choices, a five-card mixed friendly/enemy stack, horizontal swipe and arrows, artifact target selection, Boulder direction, attacks, multiple defenders, interception, deaths, Death’s Door protection and lethal result. No browser execution errors or stack/rules fixes were needed. Physical iPhone gestures were not tested.

`mobile-playtest-replay.json` contains the full UI-exported action sequence. The integration test reproduces the natural result from untouched official opening decks and seed.

### Separated mobile stacks and shared glass dialogs

Crowded mobile cells use 90% card faces with up to three exposed offsets (up to 8px horizontally and 2px vertically); single-card cells keep their size. Browsing remembers the front card when reopened. All experimental dialog entrypoints load `frosted-popups.css` after the theme, giving card details, choices, menus, setup, language and tutorial dialogs a shared translucent black surface with standard and iOS-prefixed backdrop blur. Neutral controls replace colored dialog fills; board and hand card art retain their colors. Verified portrait/landscape, Chinese/English, card details over the carousel, menu, language, tutorial chapters, swipe/reopen and native unit movement.
