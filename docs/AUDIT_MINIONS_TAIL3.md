# Minion 尾段第三批六張

2026-10-30 UTC。專屬 `tests/catalog-minions-tail3.test.js`。本批只新增此測試及本文件，沒有改共用引擎／卡牌快照／統計 JSON，也沒有操作 UI 服務。

正式命令：`node --test tests/catalog-minions-tail3.test.js > /tmp/catalog-minions-tail3-21-before.log 2>&1`。

修正前結果：**21 測，17 過、4 紅、0 跳過，exit1**。三紅是 Witherwing Hero 的明確型別／split-power 判斷問題，另1紅是Willing Tribute作為cost犧牲提前入墓；由 root 統一修補，不能排除已知紅測後稱正式全綠。

## 逐卡原生覆蓋

六張共同：從真 hand 卡的 `legalActions` 經 `dispatch` 施放，精確印刷 mana、離手、建立正確 owner/controller/power、cold JSON；可用 mana不足及每個印刷元素 threshold不足都拒絕（直接斷言該元素資源為0）。Wolpertinger基本空墓 power0 不被誤算死亡。

| 卡牌 | 真實操作／結算及邊界 | 尚未驗收 |
| --- | --- | --- |
| Willing Tribute | 真啟動支付sacrifice並進入普通效果選擇，選完後確實入owner墓；同Square與正交的Evil盟友都可選，斜角、敵方、非Evil與另一region不在選單；中途JSON後真untap所選Ghoul、其他保持tap。此卡未印target，沒有虛構成本已付後可取消的規則。 | 下述cost犧牲提前入墓紅測待修；sacrifice/deathrites其他交互、借Evil視角、不能修改／Ward；未逐一驗證UI取消契約，沒有將選擇階段當未付成本。 |
| Wills-o'-the-Wisp | 真敵方attack觸發自己的反應選單，JSON後傳送到附近Void，原攻擊沒有strike／反擊，攻擊者仍tap；可decline並真正被擊殺。官方大型攻擊者案例：Mountain Giant不移動即攻擊佔據部位內Wisp，Wisp改傳送至另一仍被Giant佔據的location後，攻擊繼續並殺Wisp，Giant收1反擊。 | Captain Baldassare等attack trigger仍觸發的代表性交互未重測；地下／Submerge借能力、被鎖傳送及所有nested reaction；本批UI未驗。 |
| Wind Sylph | 原生Air限定Spellcaster能自己施放Zap、不能施放Fireball。真Zap完成並保留mana成本，觸發可選here單位push；sameSquare surface可選，遠處／below不可；兩次JSON後選實際方向，敵單位真移一格，Magic目標受1傷，Sylph不因施法tap。另可decline push，Magic效果及費用保留。 | Magic結算與多個casting trigger的全時序未窮盡；非Magic Spell是否完全不觸發、push替代及大型目標；本批UI未驗。 |
| Winter Nymph | 真召喚自身帶Stealth且自己被nearby summon trigger tap；盟友附近新summon會tap、兩格遠不tap、水下不同region不tap；真Freeze禁用Nymph後新召Ghoul不tap，JSON保持。真正下一敵方回合，敵人在自己附近Site施放的Ghoul也tap。 | 多Nymph、Stealth揭露、跨大型part的nearby來源以及summon替代；本批UI未驗。 |
| Witherwing Hero | 真敵attack較弱同location allied Wild Boars，選擇可回owner hand並終止無其他戰鬥目標之attack，敵方不strike；可decline且正常combat。equal4-power ally不應觸發；另下列三紅。 | root修補後完整回歸、enemy-owned但我控制的ally回owner、多個Hero、source離場及全部reaction時序；本批UI未驗。 |
| Wolpertinger | 本人墓地Brown Bears+Wyvern算2，Ghoul與對手墓Beast不算；真Zap+Fatality殺自己Wild Boars後power升3。再真施放Konrul，真end選三個實體Beast墓卡，JSON後兩banish一return，使Wolpertinger power降0但仍活；對手墓地不變。 | contextual off-realm types與墓地視角交換、借此能力、多個cemetery替代／保護；本批UI未驗。 |

## Witherwing Hero 三個確認紅測

1. **Avatar錯誤符合 minion 主語**：Hero及自己的Avatar在12，敵Brown Bears從7真攻Avatar。Avatar power小於Hero，engine錯開`reactionHero`，但卡文只救minion。`src/attack-reactions.js` 的生成條件缺少 `card(target.card).type === 'Minion'`。
2. **Sir Bors 4/2應平均3**：Hero4；被攻擊同location ally Sir Bors attack4/defense2，平均3，應可救，engine只用attack4而不提供反應。
3. **White Knight 3/5應平均4**：Hero4；被攻擊White Knight平均4不嚴格較弱，engine只用attack3而錯開反應。

官方 Stronger/Weaker Codex明確要求split power平均向下，不是自定家規。建議 root 對雙方都取 `floor((attackPower+defensePower)/2)` 再嚴格小於，並加minion型別條件。兩個分裂力量測試的預期均保留，沒有放寬或刪除。原18測為17過1紅，保存在 `/tmp/catalog-minions-tail3-before.log`；最終20測before保存在 `/tmp/catalog-minions-tail3-20-before.log`。獨立兩split候選的紅測也保留 `/tmp/tail3-hero-split-before.log`。


## Willing Tribute 的獨立犧牲成本時序紅測

Sacrifice Codex明定：作為effect成本的犧牲卡，直到effect結算完才送cemetery。原生啟動Tribute後，untap普通效果選單仍待選、Ghoul仍tap，但現在Tribute已在cemetery；獨立第21測嚴格要求此時尚未入墓，JSON並選擇完成untap後才入墓。不強加卡必須仍是live unit的額外假設，只驗證明文的cemetery時點。

最初正向草稿曾錯把觀察到的提前入墓當預期；讀完官方Codex文字後已將正向入墓斷言移至effect結算後，並增加獨立紅測保留真實差異，而非為綠測放寬正確規則。21項before完整紀錄為`/tmp/catalog-minions-tail3-21-before.log`，17過4紅。

## 實讀來源與版本

- `data/official-cards.json` 六張現有官方快照，實際讀rules/cost/threshold/power，未改檔。
- 本輪官方 [Willing Tribute](https://sorcerytcg.com/cards/willing_tribute)、[Witherwing Hero](https://sorcerytcg.com/cards/witherwing_hero)頁面可讀並與快照一致；其他四張官方頁工具回inaccessible，不能宣稱已刷新最新頁面。
- October 2026官方Rulebook，來源指紋見 `data/final-101-official-source-index.json`。
- 官方嵌入快取 `/tmp/sorcery-official-embedded-docs.json` 已實讀內容：
  - Wisp FAQ `FWsVZ4rxgHCtjTP73mUAww`（2025-07-06）：evade後attack triggers仍成立，但沒剩餘單位時不strike、不改回原目標。
  - Wisp大型FAQ `eXfZjLHocReFQIApZdIFEK`（2025-07-06）：若新位置仍在oversized攻擊者body內，攻擊繼續。
  - Hero FAQ `FWsVZ4rxgHCtjTP73mUB3o`（2025-07-06）：被救回後沒剩單位則attack結束、不strike，attack triggers仍成立。
  - Stronger/Strongest/Weaker/Weakest `dcf0d619-240b-4529-b98a-0494075ea666`（2026-07-15）：Weaker嚴格較少，split power用平均向下。
  - Split Power `7f64db2b-3903-4bbd-8d36-bfa53ce5faa8`（2025-07-10）：通常問power用攻防平均向下；attack/defense明確各自用途。
  - Adjacent `1d3363e4-3b12-46fb-99d9-f4319967f484`（2025-07-14）、Nearby `7de60b0a-855c-4bab-95a7-7e6f172ba4a0`（2025-07-14）、Here `8e4684e4-479b-45d1-a75b-a41568ea6e6f`（2026-09-02）。
  - Activated Ability `c7f83847-8d96-4d13-a8df-a510ba603f1e`（2025-07-10）、Sacrifice `b6ffd09a-c8fb-4b80-ac24-4900e8fd5ca3`（2025-12-21）、Target `98943611-2a6f-4756-ad9b-a7d6598e9729`（2026-03-25）、Stealth `8dc27cdf-47d5-4d69-8724-c30efbe94158`（2026-10-12）。

沒有改共享引擎或JSON、不啟動server、無推送部署。不向睡覺使用者發問或發送進度；root獨立操作已許可5500 UI。本批Node效果測試不能算瀏覽器驗收，亦未宣稱窮盡所有卡牌交互。

## Root integration after the strict reds

Hero Minion-only and split-power comparison fixed; shared sacrifice-cost UID cemetery hold now integrated. Native tail3:21/21, zero skipped, /tmp/tail3-sacrifice-after.log. Dedicated cost tests:4/4, see AUDIT_SACRIFICE_COST_TIMING.md. Actual5500 UI operated handcast2, sacrifice, pending reload, then Ghoul untap and only then cemetery; see UI_5500_AUDIT.md and data/ui5500-tribute-*.json. Last full2305 was2304pass/1cost red before cost fix; new full still required.
