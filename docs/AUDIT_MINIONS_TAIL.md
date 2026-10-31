# Minion 尾段六張原生稽核

2026-10-30 UTC。六張：Young Master Damion、Yourke Crossbowmen、Zephyranne Airship、Zeppelin of Zealots、Zombie Bruiser、Zombie Horde。正式檔 `tests/catalog-minions-tail.test.js`；root確認完整回歸窗口結束後納入。只寫專屬測試／文件，沒有改引擎、卡牌快照、統計 JSON 或服務。

## 每張共同驗證

原生 `legalActions`→`dispatch` 真手牌施放；正常印刷 mana；零可用 mana 無合法 cast；各印刷元素 threshold 不足時拒絕，並直接斷言資源為零；實體 hand 卡離手、owner/controller/power；JSON 恢復。Damion 的基本施放採明確 constructed 空 collection，不可自造 Ghoul。

## 逐卡效果與邊界

| 卡牌 | 已實際執行的操作與斷言 | 尚未驗收 |
| --- | --- | --- |
| Young Master Damion | 原生 Genesis 消耗 collection 的兩張 Ghoul，兩者 here、正確 controller 與 damionSource；collection 只剩非 Ghoul；真 Zap+Fatality 在 nearby 被保護；Ghoul 真走兩回合離開 nearby 後 Zap+Fatality 正常死亡；只有一張 collection Ghoul 時只召一張。 | 下列兩個確認紅測待 root 修；複數 Damion、借能力、source silence 與所有 oversized nearby；實際 UI。 |
| Yourke Crossbowmen | 真正敵方 Belmotte Longbowmen 南向 ranged strike，Yourke 傷害0；敵方真正 Zap 仍傷1；JSON。自身原生 Ranged 北射，Brown Bears 受3、自身不受反擊、不移動。 | 所有 ranged 多目標／增傷／防止順序及 silence 交互；實際 UI。 |
| Zephyranne Airship | 原生 Airborne 與距離3的 move 合法；真 pickup 同格三個 allied Minions；敵方與 Avatar 的偽造 pickup 被拒；JSON 後真 move，三個 passenger 跟隨且敵方不跟；再次 JSON 保留關係。 | nested carrier FAQ 未實測、乘客獨立動作／drop／死亡、混合 region/大型 passenger；實際 UI。 |
| Zeppelin of Zealots | 原生 Ward 入場且有 Airborne；敵方真 Zap 破 Ward，不傷、立即失去 Airborne；JSON 後第二張 Zap 正常傷1。 | 再獲 Ward、silence/Freeze、Airborne失去時路徑與所有 combat；實際 UI。 |
| Zombie Bruiser | 真 cemetery physical entry，己方 Skeleton token 才能支付；敵 Skeleton 不可；零 Earth threshold 仍可啟動（不是施放），有3 mana時無合法 resurrect；原生 resurrect 真付4、犧牲 token、耗用墓中卡，Bruiser在原 Skeleton位置且有召喚失調。 | 多張同名墓地身分、區域存取稅、被替代的 sacrifice、地下/void召喚限制；實際 UI。 |
| Zombie Horde | 真 summon後消除本回合召喚失調作已在場回合 fixture；敵方真攻擊另一 minion，鄰格 Horde 無 defend，普通 ally 可 defend；Horde已同攻擊位置時可不移動 defend；兩種 pending 都 JSON後仍一致。 | 真正執行 defend combat、intercept、borrowed不能defend與大型幾何；實際 UI。 |

## Damion 確認缺陷與防止過修邊界

1. 官方 FAQ 場景：caster7、Damion12 與其真 Genesis 兩個 Ghoul12，真正施放 Poison Nova 同時傷害三者。應 Damion 死、兩 Ghoul 各留1傷存活，JSON仍活；目前 Ghouls 一併死亡。FAQ `4e005d98-5499-4bd1-859f-f1eda254ee7a`，更新2026-07-15，明確說 source 在死亡標記階段仍在 realm，先保護 Ghouls；Lethal只在當次傷害適用。
2. 獨立邊界：Damion真召17、Ghoul真移12、caster7 的 Nova 只傷 Ghoul；Damion仍活時 Ghoul留1傷，接著同回合真 Teleport Damion→19，先前已被保護的 Lethal不能在失去保護後再次殺 Ghoul。現在 Ghoul會死，顯示 `u.lethal` 被當持續標記。
3. 防止過修：先用真 Arc Lightning 殺死 Damion、Ghouls仍在，再施放新的 Nova，Ghouls必須死亡；不能把保護永久留在 damionSource。

建議 root 依 FAQ 在**傷害當下**有 Damion保護時不留下 Lethal 死亡標記，不能等 stateBased先殺 source 後才查；既有 kill guard 仍負責一般 destroy。只提供建議，不在子任務改共用引擎。

原始17測記錄 `/tmp/audit-minions-tail.log`：15過2紅；新增防過修後18測結果：16過2紅，記錄 `/tmp/audit-minions-tail-18-before.log`。最初跨回合的 Zap fixture 因 bonusAffinity清空而缺印刷Air門檻，已在初始真 Site 配 Spire與Wasteland，沒有改印刷成本或放寬傷害斷言；這個草稿失敗不是引擎缺陷。

## 來源與限制

- 本機官方快照 `data/official-cards.json` 六張實際 engine card rules/cost/threshold；本輪未修改。
- 本輪六張官方相應卡頁均回 inaccessible，不宣稱最新網頁卡文已刷新。
- October 2026 Rulebook，版本／來源指紋見 `data/final-101-official-source-index.json`。
- 官方嵌入快取 `/tmp/sorcery-official-embedded-docs.json` 實際讀取文字：Damion FAQ如上；carrying nested minions FAQ `eXfZjLHocReFQIApZdI3wK`（2025-02-20）；Collection `78ce4090-a2e1-4893-97c0-6eaafd5c5937`（2026-03-25）；Carrying Units `5f6697d3-c0a4-42b3-b682-ce807b9e4cd4`（2026-02-09）；Pick Up `80001912-428c-45bc-bc04-296c848dc708`（2025-12-05）；Movement +X `22c9d0fe-727c-4700-9375-91cc7a2f7f2b`（2025-06-29）；Ranged `23eb6bf6-7bc3-4665-a9de-920e1c72a862`（2025-06-30）；Defend `7bc7a52c-25dc-4c80-8608-89667ef5eed7`（2026-05-19）；Ward `ae9b6774-aa8f-45c5-a424-d6d7e58014c3`（2026-10-12）；Lethal `47a59bae-9234-404e-8299-efeec4d1c78d`（2026-03-25）；Sacrifice `b6ffd09a-c8fb-4b80-ac24-4900e8fd5ca3`（2025-12-21）；Summon `679db7d7-3cb3-4655-b84b-53c4bd6ed637`（2026-10-12）。
- 未實際操作瀏覽器 UI；待新增 loopback 授權，不啟動或重試服務。不把共享helper、候選測試通過或流程載入當全部交互完成，不裁定家規。
