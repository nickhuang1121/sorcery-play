# Pallid Bust：戰鬥來源消費入口

`src/final-borrowed-combat.js` 以 `unitPassiveLayerViews` 逐一處理完整來源，保留實體 bearer 的 card、power、owner、controller、位置；abilityOrigin / abilityInstance 只決定能力來源與實例。沈默排除印刷能力，保留從實體 Bust 獲得的能力。擊殺信用保存來源快照，使同時戰鬥死亡、裝備掉落後仍可結算已取得的擊殺能力。

逐項入口見 `final-pallid-combat-coverage.json`（54 keys，全部均有具名 borrowed dispatch 家族測例）。此文件是來源消費入口的遷移稽核，不把有限測例宣稱為每張卡的完整認證。`tests/final-borrowed-combat.test.js` 現有 49 項真 dispatch 測試涵蓋：重複來源、沈默、傷害修改與轉移、Ward、死亡替代、互相擊殺、擊殺信用、受傷觸發、附近死亡與存活觸發、攻擊禁制、攻防反應及攻擊後追加打擊。

數值修改及觸發逐來源處理；禁止／狀態類條件採存在判斷。九命仍屬實體單位累積死亡次數，防止第一次傷害仍屬該單位該回合第一次受傷，沒有憑空增加每份能力各自的計數池。各來源的修正均在同一傷害事件中保留獨立識別，且轉移至實際單位，不能傷害來源 view 的複本。

共用引擎、傷害及反應整合由主代理套用 patch。`movementShot` 交由 geography owner 實作；本組負責 `stepAfterRanged`、`damageOnStop` 和 `pushAfterMagic`。額外 Avatar 消費入口 `bladeAfterAttack` / `completionInterrogate` 另提供 followup patch，沒有計入印刷 Minion 的原始索引。

2026-10-30 補驗：擴至 49 項 true-dispatch，54 keys 均有具名證據。包含禁制與義務（有／無借用對照、單人／雙人防禦）、first strike 與 first fight 不同時機、私有區域放逐、互殺保留雙份 Sea Raider 來源、兩份 Captain 各棄三張、受控單位返回實體 owner、Sturmgeist 在 Magic 前接近打擊，以及 Wind Sylph 的合法借用 Air Spellcaster＋施法後推動。仍不將 family 測例等同每張帶該 key 的卡牌所有交互都已獨立認證。
