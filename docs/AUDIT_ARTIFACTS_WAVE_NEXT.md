# Artifact 逐卡稽核：Goswhit Helmet 至 Holy Water

日期：2026-10-30 UTC。僅新增 `tests/catalog-artifacts-wave-next.test.js` 與本文件，未改引擎、原測試、JSON 統計、憑證或啟動服務。這是六張代表性原生效果驗證，不是完整規則／UI 驗收。

## 來源與限制

- 卡文及費用：`data/official-cards.json` 的 `engine` 欄位，本機現有版本；五張官網頁在本輪 web open 回 Internal Error，不能宣稱已核目前官網卡文。所嘗試網址為 `https://sorcerytcg.com/cards/` 接六張 slug。
- [Holy Water 官方頁](https://sorcerytcg.com/cards/holy_water)：本輪可讀，與快照所列啟動成本及 Evil banish／非 Evil Ward 一致。
- 官方嵌入 Codex／FAQ 快取 `/tmp/sorcery-official-embedded-docs.json`：969 筆。Damage Codex `d54c08da-2107-484a-9f68-123bb62581b5` 更新 2026-03-05：damage modification 先於 prevention；Helmet 為 prevention 例。未據此宣稱完整同時多個 prevention 的玩家選序已驗。
- Updated Cards Codex `bff36deb-d447-49d9-b909-d64417f6e045` 更新 2026-10-19：Grim Guisarme 僅對 units 生效，不對 sites。Kairos FAQ `7pueunOd2UocdnJawmr5Rc` 更新 2025-08-04 的 Guisarme 搬運案例仍由既有其他測試負責，本批未冒領。
- Hemogoblet FAQ `34d35317-449a-400b-887a-c64c0a3c3c21` 更新 2026-02-09：滿杯必須先清空，不能再次填滿。`cb3ed1da-3f68-4f21-a73d-ec988c3f1ca5` 同日更新：獎勵按犧牲當下 power 記錄。
- October 2026 Rulebook 與上述快取沿用既有取證版本，本輪沒有重新下載全部來源。

## 實際逐卡證據

六張共同測試：從真正手牌找到 `legalActions` 的 cast，`dispatch` 正常扣印刷費用、移除手牌、建立原 owner 及正確位置；JSON 恢復後仍存在；資源不足時沒有合法 cast。六張皆無元素 threshold，因此沒有杜撰 threshold 測項。

| 卡牌 | 真實效果與邊界 | 本輪尚未涵蓋 |
| --- | --- | --- |
| Goswhit Helmet | 真正 conjure 給 Brown Bears 後原生攻擊 Wild Boars；bearer strike damage 為0，Helmet 回 owner 手牌。另以敵方真正 Zap 造成1傷，Helmet 保留。 | 多個 damage prevention 玩家選序、敵方偷取持有時回 owner、完整 UI。 |
| Grim Guisarme | Wild Boars 真正裝備後攻擊強化 Brown Bears；造成4傷並因收到倍增反擊死亡；另直接打敵 Site 僅扣2 life，符合更新卡文。 | 多重倍增、複數分傷、其他減傷與完整 UI。 |
| Hand of Glory | 真正 conjure 使4 power bearer變5並取得 Fire限定Spellcaster；有 Fireball cast action、無 Drown cast action；實際以 bearer 施放 Fireball、付4費、北向 projectile造成4傷；drop 後回4 power並失去 caster。 | 其他元素／借能力／silence疊層及完整 UI。 |
| Hemogoblet | 由真正 carried goblet 啟動，僅能選 here己方 minion，排除敵方／鄰格；犧牲2+3 power Wild Boars 記錄5，同回合不能再次啟動；JSON保留滿杯，經兩次真正 turn結束／draw回己方後只有mana或life（另可取消），兩種各獲5並清杯。地上 loose Relic沒有controller與啟動權；真正pickup後可啟動，取消不犧牲、不消耗once。 | 與有death-trigger victim、所有替代死亡及偷取杯子互動、完整 UI。 |
| Hemogolem | 真正手牌conjure，後令已存在unit離開召喚失調，用原生combat對 Brown Bears；造成4 strike治療4，收到4傷同步掉4 life，兩者死亡；敵人有Ward時實收0故不治療，但自身收到4仍掉4 life。 | 非strike damage分支、spell變成其他type、複數傷害與完整 UI。 |
| Holy Water | 真正 conjure bearer 後使用 `activateArtifact` 原生方向宣告；確認前不tap／不犧牲，可JSON與取消；確認北向後tap、犧牲Holy Water，hit Ghoul則banish，hit非Evil Brown Bears則Ward且無傷。取消保留物品與下次合法啟動。 | projectile打Avatar／多unit命中選擇／Stealth／Ward已有等完整邊界、完整 UI。 |

測試不注入 helper effect，不直接呼叫傷害／strike函式；測試初始場面可配置已在場 minion／modifier作為交互條件。所有卡的主要效果均經真正 cast／activate／attack／drop／pickup／end／draw 操作。

## 執行紀錄

`node --test tests/catalog-artifacts-wave-next.test.js > /tmp/catalog-artifacts-wave-next.log 2>&1`

最終結果：2026-10-30 20:06 UTC，17/17 通過，exit0、0 skipped，log `/tmp/catalog-artifacts-wave-next.log`。最初測試草稿曾錯用 unit `activate` 而非 artifact `activateArtifact`、要求無controller loose Relic能啟動、誤以為Holy Water方向確認前已付成本、誤把Fireball印刷傷害寫3；已按實際操作契約與卡文修正測試，沒有改引擎、放寬正確卡文斷言或把草稿失敗當真實引擎缺陷。未更動正式既有測試。

本批 UI 全部仍為待授權／待驗證。沒有重試先前遭拒的 loopback bind，也沒有自行裁定五項未決規則。
