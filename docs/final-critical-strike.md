# Critical Strike：全域等待效果修正

官方卡文不是施放時選擇一個盟友。施放照常支付法力並觸發施法事件，只建立本回合的全域等待效果；下一次盟友打擊單位時才套用。打擊地點、敵方打擊及盟友非打擊傷害不消耗此效果。零力量的打擊仍消耗等待效果。Ward 在傷害修改之後阻擋傷害，仍已消耗該次打擊。

`src/final-critical-strike.js` 保存 `ongoingEffects` 中的 `criticalStrikeWaiting`，提供 `criticalStrikeWaiting(s,p)` 供 Kairos 整合測試。等待效果尚未作用在卡牌，不列入 Kairos 對卡牌的效果封存。傷害倍增作為 damage modification 傳入既有傷害修改流程，與轉移／傷害設值依主動玩家、非主動玩家順序處理，每個來源在每次傷害中最多套用一次。

來源：

- [Critical Strike](https://sorcerytcg.com/cards/critical_strike)：官方唯一 FAQ（id FWsVZ4rxgHCtjTP73mTtIA，2026-02-06 更新）確認與 Mask 同時倍增為四倍；沒有多目標特例。
- [Strike](https://sorcerytcg.com/codex/8bb6e5a1-6989-4ec1-98d7-ef50283cccf6)：2026-02-09 版，`Strikes vs. Multiple Units`（sub 2d5b47b95dcd）規定多防禦者是一次打擊並分配傷害，分配零仍被打擊；`Strikes for Zero Damage` 明定零傷害仍是打擊；`Multiple Simultaneous Strikes`（sub 789d3177aadd）明定同一單位的多次同時打擊全算下次打擊。
- [Damage](https://sorcerytcg.com/codex/d54c08da-2107-484a-9f68-123bb62581b5?sub=c42d2ec4a913)：2026-03-05 版，倍增及轉移同屬傷害修改，在預防之前逐來源處理。
- [Storyline](https://sorcerytcg.com/codex/081fc13c-49fb-4893-90c1-1ba5324e6241?sub=48346f868e2a)：2026-05-26 版，同時效果屬單一事件。不同盟友於同一戰鬥事件同時打擊，是否都屬 controller-global 的下次事件，是依 Strike 同時性與此條的一般規則推論，並非卡牌 FAQ 的直接特例裁定；主代理已審核並採用此推論。

官方完整子條款與 FAQ 已由主代理從官方公開 SSR HTML 唯讀解析確認，內部快照不全量複製到專案。`tests/final-critical-strike.test.js` 15 項均通過，含支付、無預選盟友、正確盟友、非打擊不消耗、site 不消耗、Ward、重複效果、轉移、儲存／過期、零打擊及同時分配等真 dispatch 測試。
