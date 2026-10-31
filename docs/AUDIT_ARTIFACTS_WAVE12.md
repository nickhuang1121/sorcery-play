# Artifact Wave12候選：The Rack 至 Torch and Pitchfork

2026-10-30 UTC。只寫root指定的 `/tmp/catalog-artifacts-wave12-candidate.mjs` 與本文件，使用絕對workspace imports；正式tests/docs/src/JSON未動。不詢問睡覺使用者，不啟動或重啟任何模擬/server，既有五項裁定保持獨立。

命令 `node --test /tmp/catalog-artifacts-wave12-candidate.mjs`：最新**21項19過2紅、0skip、exit1**。兩紅同根為Toolbox漏非Spellcaster獨立施放權限；其他五張實際效果與Toolbox的Avatar正控制、mana/threshold負控制均過。exec直接回傳結果，遵守只准兩tmp檔，未另建log。

## 來源與版本

- 現有官方snapshot `data/official-cards.json`、October2026規則書、官方embedded Codex/FAQ快取；逐一以cards slug查相關FAQ。
- 本輪web[Toolbox官方頁](https://sorcerytcg.com/cards/toolbox)成功，明載Sacrifice後bearer may cast Ordinary collection spell。其餘5張card頁InternalError，現行官網刷新仍未完成，不反覆查同來源或冒稱成功。
- The Rack FAQ `80521d68-d6ab-44db-9755-c8607f74404a`（2026-02-09T18:44:28Z）確認stretch成oversized；`2ef8e8d7-f0f4-4f82-b2a8-14d0c67c5a83`（2026-05-19T18:40:28Z）新location算enter但不是move；`faac484f-03ca-4873-a17e-e0e9efacda69`（2026-05-19T18:41:09Z）Site移動不搬oversized Avatar；`FWsVZ4rxgHCtjTP73mWtOo`（2026-03-25T19:17:19Z）Globe離場落側。後兩及Globe的既有裁定範圍本批未重驗，不自行解決原五問。
- Toolbox FAQ `f1ba891f-8671-4852-874c-39accc7fbb56`（2025-12-06T06:17:51Z）cards列表包含Toolbox，問題為bearer非Spellcaster能否cast，直接答Yes。這足以判目前非caster無選單為缺陷，不需玩家裁定。
- Sacrifice Codex `b6ffd09a-c8fb-4b80-ac24-4900e8fd5ca3`（2025-12-21T07:10:37Z）：成本犧牲等自身effect完成才入墓；Toolbox待collection cast時不在墓，正常Zap完成後才入墓。此時序嚴格斷言保留，不沿用Wave10舊fixture錯誤。
- 其他四張無本輪cards-slug匹配特定FAQ，依實際卡文、regions、ally、gained ability等既有通則。Torch測外加能力在Silence下保留，不將它泛化為所有unmodifiable/Bane/control問題已解。

## 逐卡實際覆蓋

六張共同：真正hand cast legalActions→dispatch、實付印刷費、手牌移除、insufficient mana無cast、owner/location、cold JSON。cold為同process JSON保存後重新install官方catalog再restore；非新瀏覽器UI全驗。六張印刷threshold全0，拒絕threshold N/A；Toolbox施出的Zap另檢查正常Air1/mana1要求。

|卡|候選原生實際效果／邊界|剩餘限制|
|---|---|---|
|The Rack|真cast2費給Bears4；原生attack敵Avatar7，pass真防禦窗口後出geometryRackStretch，施效controller0選另一鄰格8而非原7，cold後Avatar實佔7/8，扣總佔位數2 life。普通strike先收4後Rack2，life20→14；Ward擋strike4仍stretch/lose2，life20→18。|沒有直接觸發helper；新enter觸發、無可伸展位置、多Rack、Globe移除及完整UI仍未驗。|
|The Round Table|真cast3費legalActions僅己backrow15..19，非backrow12不可。cold後真Arthur及BrotherKnight到Table17各抽1Atlas實體卡；BrotherKnight自己的可選Genesis先合法decline再處理Table draw。普通Bears17不抽、Knight BlueKnight18只是nearby不抽。|Opponent summons/其他Knight名稱、Table移動或失control、完整UI未驗。|
|Thumb Screws|真cast2費後自己的Avatar隨後兩Zap分別為本turn第2/3個spell，lose2/3（20→18→15），Device不追溯自己剛進場的cast事件；附近非Avatar Merlin再cast不觸發。另真進敵turn，敵Avatar近時兩cast lose1/2，遠時不loss，兩spell傷害仍發生。cold保存。|多Device、DeathDoor/life loss替代、其他cast來源及完整UI未驗。|
|Tombstone Wardens|真cast3費己turn為非unit Monument；真end/draw到敵turn，同UID變5power Airborne Angel Automaton，cold重新install後仍可辨型。敵真attack己Site12，Wardens原生defend擊殺4powerBears並收4；真end/draw回己turn，還原同UID/owner Monument，units不再有它。|控制改變、disable/silence於變形間保存、所有同時end/start排序或UI未驗。|
|Toolbox|真cast2費，Artifact能力無tap成本；Avatar bearer正控制可真activate、collection只列Ordinary Zap（排除Exceptional Fireball及Elite AncientDragon），cold選Zap實付1、敵收1、collection卡移除；能力完成後成本犧牲進墓，bearer仍未tap。非Spellcaster Bears應同樣可cast/可decline，但目前無collectionPermit：兩紅。Mana0或Air0時不能藉permission施Zap，卡仍在collection、不花spell mana。|root需只加Toolbox明文獨立permission而非泛開所有Book/collection；其他zone cost、multi-stage Magic或UI未驗。|
|Torch and Pitchfork|真cast4費，Ordinary Bears bearer自身與nearby Ordinary Boars各+1，Unique Merlin ally、敵Ordinary、遠Boars不加；Unique Merlin bearer則所有人不加。另真Silence Aura後bearer printed abilities被silence，但外加Ordinary ally aura仍在，Bears5與nearBoars3；cold保存。|被disabled、控制/多份Torch與大型bearer的完整source geometry、完整UI未驗。|

## 確認缺陷

Toolbox非Spellcaster兩紅由直接FAQ支持：原生Bears持有Toolbox可啟動，成本犧牲後卻因無獨立caster permission導致沒有任何collection cast選項，直接結束；同場Avatar正控制可cast，證明不是collection內容/閾值或費用fixture造成。`entryHasIndependentCasterPermission`與collectionPermit的明確旗標類似Wave10 Silver Bullet即可定位，runtime由root統一修；本子代理不改共享源碼。普通spell費用/閾值/rarity約束不可放寬。

初稿RoundTable測試錯以為BrotherKnight沒有自己的Genesis，所以看見brotherSummon而不是drawCards；已實讀其卡文，原生decline該可選召喚，再維持Table真draw斷言，結果通過。這是fixture時序修正，非引擎缺陷或刪除嚴格效果期望。

目前21項為候選subset，不稱最新full或完整逐卡UI。兩tmp檔現穩定，待root通知正式整合；原101/全庫計數不由本子代理自行更改。

## Promoted stable native candidate

Root preserved all strict assertions and converted only imports/data file access to portable relative URLs: tests/catalog-artifacts-wave12.test.js. Latest full formal regression pending. Actual UI is recorded separately, not inferred from these native cases.

## Complete formal regression

2026-10-30T22:28:35.810Z:2627/2627 passed, zero failures/skips, session3940 exit0. Stable data/all-cards-audit/logs/wave12-full-2627*. Initial2627/2626/1 retained an incorrect old Loner collection-retention expectation; original/TAP preserved, corrected from explicit SummonCodex with stronger physical-card conservation and JSON assertions. See data/loner-summon-tax-test-correction-backup.json. Native scope is not full per-card/UI approval.
