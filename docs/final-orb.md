# Orb of Ba'al Berith 實作與核對

模組：`src/final-orb.js`；正式流程測試：`tests/final-orb.test.js`。共用整合由 root 透過 `/tmp/build-orb-integration-patch.py` 讀取當下原稿產生 `/tmp/final-orb-integration.patch` 後套用。

## 官方證據

2026-10-30 使用 CUA 背景瀏覽器閱讀 [官方卡頁](https://sorcerytcg.com/cards/orb_of_baal_berith)，展開 **5 FAQs**，核對如下：

- **Orb 自己是複本的施法者**，不是原始施法者。
- Magic 的原操控者控制複本，即使 Orb 是另一位玩家控制。
- 複製發生於費用支付之後，**X 保留原本已決定的數值**。
- Craterize 等額外費用不需再次支付。
- 兩發 Craterize 可以選同一個地點，但第一發摧毀原地點後，第二發沒有有效目標，**不造成任何傷害**。

[官方 Copy Codex](https://sorcerytcg.com/codex/88663410-ac07-4dd6-b2fe-fbecbadf232a) 說明：創造的 Magic 複本是 token，從 Storyline 結算後即放逐；其特性與能力來自被複製的法術。

## 實際機制

`queueFinalOrbCopies` 在原 Magic 的費用、額外費用及施放前宣告已完成後，記錄附近同區域有效 Orb 的每回合使用狀態。它保存當下 Orb 施法來源、原 Magic 的操控者、已確定的 X、已完成的施放參數、效果序列及目標，並以可 JSON 序列化的 `finalOrbCopies` 記錄放上 Storyline。

複本直接重放已支付 Magic 的效果，**不是再呼叫普通施放流程**：不再次付法力／生命／棄地點／犧牲，不重新選 X，也不把產生複本當成新的原始施放事件。各 Orb 的複本可選保留或變更目標；Swap／Backstab／Shatter Strike 的第二目標與 Chain Lightning 已支付的固定目標數量有獨立續接。

普通選擇於法術結算時才進行的效果，仍在複本的結算中進行該選擇。於施放前已選定而不屬於目標的選擇（例如已宣告的投射物方向），沿用已確定的值。

`orbTargetSnapshot` 記錄指定 Site 的真實 UID，`reactionMagicResolve` 先檢查原 Site 還在同格；不能用同格新出現的 Rubble 冒充原目標。複本使用固定 runtime token card，在結算後放到原 Magic 操控者的 banished 區，不複製任何實體手牌。

## 驗證清單

`node --test tests/final-orb.test.js` 涵蓋：敵方 Orb 但自己控制複本、保留／變更目標、每回合首次觸發與重置、距離／沉默／失能／區域限制、X 與 Orb 投射物起點、Craterize 額外費用與同目標失效、多 Orb 不無窮遞迴，宣告期間 JSON 存檔復原、Swap 雙目標獨立重選、Chain Lightning 已支付目標數維持，以及原法術與複本各自支付 Bureau 墓地權限而存檔後不重稅。

2026-10-30 實際結果：11／11 通過；與 `tests/final-avatars.test.js`、`tests/final-animation.test.js` 聯測為 103／103 通過。複本初始 frame 保留其效果序列，讓墓地權限在選擇墓地目標前要求，且複本與原法術各自使用獨立權限 scope。

## 仍須完整交互驗收

所有新卡仍沿用本專案「部分支援」等級。任意未完成 Magic 的效果、複雜的同時觸發排序、各種來源的持續能力依存與特殊移動仍須逐一測試；不把一般 Zap／X／Craterize 案例當成所有 Magic 已完整驗收。
