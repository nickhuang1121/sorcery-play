# 第十批 Minion 原生規則稽核（待root轉正式）

日期2026-10-30 UTC。六張為Grandmaster Wizard、Gravedigger、Great Old One、Greater Blood Demon、Grey Wolves、Grief Larvae，已先向root確認名稱避免重疊。僅寫 `/tmp/catalog-minions-wave10-candidate.mjs` 與本draft；wave9 doc依root指示補最新19綠。沒有改正式src/tests/JSON，正式wave9測試19項維持不動。

## 最新結果

`node --test /tmp/catalog-minions-wave10-candidate.mjs` **25/25通過、0失敗、0跳過**，session86224 exit0，2026-10-30T21:44:05Z讀結果。輸出 `/tmp/catalog-minions-wave10-candidate.log`。原22測21過1真紅（session30684 exit1）確認external Flood被Site silence錯吞，root獨立修geography後，原嚴格紅測及新增三個實際來源控制均通過。沒有刪除或放寬原效果斷言。

這是本子集，不代替root完整2450安全節點、全場模擬或UI。原simulation24216結果uncertain，子代理未查、不重啟，與本批獨立。

## 每張已測效果與仍未驗

六張各有獨立native hand cast、印刷mana不足拒絕、每個印刷元素threshold不足拒絕、實扣cost、離手、unit owner/controller/power與cold JSON。Grandmaster的基礎deck另留至少4張，讓Genesis能真抽3、避免空牌庫終局干擾；不是忽略其效果。

| 卡牌 | 原生效果／邊界證據 | 仍未覆蓋 |
| --- | --- | --- |
| Grandmaster Wizard | 真Genesis抽實體top3 Zap/Ghoul/WildBoars，留下第四張；JSON後剛召的Wizard本人作Spellcaster真cast抽到的Zap、造成1傷且不tap；有Garden of Eden時只抽第一張，後2次被禁止而牌仍留deck | 抽空牌庫／多draw替代排序、promotional列名獨立deck互動、UI |
| Gravedigger | 真Genesis指定正交Undead Ghoul、排除斜角/non-Undead/below；choice JSON；強制Burrow不賦予存活，Ghoul真死入敵墓；same-square己Entombed有印刷Burrowing則Burrow後活；water-surface Ghoul仍合法指定但Burrow失敗留surface，正常付2 | 多部位Undead／強制移動免疫／Ward／不合法目標時序、UI |
| Great Old One | 真Genesis令當前Site flooded，不把void11變成Site；真Zap傷1再Fatality殺掉OldOne，permanent effect仍在；之後真Atlas手牌Valley play至先前void11也成water；兩個獨立native Drought/OldOne先後順序例，最後played passive優先；真AcidRain silence已Flooded Site13後仍Water（原真紅、已修） | 新Rubble／多重Genesis／被modification protection保護Site、更多timestamp與area/source交互、UI |
| Greater Blood Demon | 真Genesis失4life，不是damage：Avatar Ward不破、真Goat不承傷且仍活、自己life20→16；另一例life4→0進Death’s Door而winner仍null，Demon正常進場，JSON | 已在Death’sDoor的loss、其他loseLife替代／禁healing、UI |
| Grey Wolves | 真cast後power算nearby兩方其他Grey Wolves，含同square/斜角，排除far及below；真Teleport後依新位置power4→3，JSON；真validateDeck接受60 Wolves且newGame實體deck+hand仍60；constructed collection5張仍違Ordinary限制，spellbook unlimited未錯套collection | countsAs來源（如Moonsong）、silence／多部位／不同region來源改變、UI |
| Grief Larvae | 分別真surface與underground cast，己end damage本Site令己controller失1life但Larvae不傷；另成熟後原生move至敵controlled Site13，己end改傷敵player、不傷己owner；中間JSON | Site Ward／redirect／多部位占據Site、end同時多trigger排序、UI |

## 根修的確認缺陷與三個實際來源控制

原strict red：真GreatOldOne cast完成→真AcidRain罩Site13→Site.silenced=true，但waterSite=false。官方Silenced Codex明文指出GOO外加Flood即使Site被silenced也保留。根因 `siteAffinity` 處理外部effects時 `if(effect.flood&&!site.silenced)`把external也當printed ability消除。root去掉external effects該gate，保留printed Mortuary原有guard。

本分工依root要求新增以下全原生控制，三者全過：

1. **Floodplain external**：真play Floodplain11→真activate洪水到鄰Site12→真AcidRain silence12→JSON，12仍Water。沒有手改site.effects。
2. **The Flood external permanent**：真cast TheFlood→真confirm，Magic進墓、永久marker生效→真AcidRain silence13→JSON，13仍Water。
3. **Mismanaged Mortuary printed**：真play Mortuary11，沒有realmFlood時因印刷Flooded成Water；真AcidRain silence11→JSON，Water消失。證明修補沒有把printed Flood錯當external保留。

這些是GreatOldOne來源／silence交互回歸，不因多測Floodplain/TheFlood/Mortuary而自動增加額外卡的整體驗收數。

## 官方來源及版本

卡文／數值實讀原有 `data/official-cards.json` engine，未更動快照。2026-10-30 web新讀 [Greater Blood Demon](https://sorcerytcg.com/cards/greater_blood_demon) 成功；其餘五張同名官方URL工具inaccessible，未宣稱新頁已刷新。採官方October2026 Rulebook與 `data/final-101-official-source-index.json` metadata，實際用JSON解析 `/tmp/sorcery-official-embedded-docs.json`：

- **Silenced** `ad3816bb-9097-42bb-9231-4d9311f4a7e9`，更新2026-10-12T17:46:19Z：印刷abilities失去、外得保留；明列Mortuary失自身Flooded，Floodplain/TheFlood/GOO等外加Flooded仍在。這是確認缺陷直接依據，不是家規。
- GOO/Drought先後：FAQ `FWsVZ4rxgHCtjTP73mUwmu`，更新2025-02-20T23:04:25Z：兩被動以最後played者優先。兩個方向均原生驗。
- GOO永久Flood包括之後進場Site及Rubble：`ygoDG8fb7HS97qCW69kS5d`，同日期。本批驗future Valley，Rubble未獨立專測所以列限制。
- Grandmaster promotional Grandmeowster同一名稱：`5362ac18-63e9-4a74-a90a-58083a11abee`，更新2026-05-19T18:40:20Z；已查來源但本批未新增promotion-specific deck測例，未冒稱該FAQ已操作驗。
- **Death’s Door** `8dd871eb-65ec-4f9a-be06-4e81e417d1a2`，更新2025-12-05T17:31:08Z：到0不立即輸，之後damage才是death blow；生命下限0。GreaterDemon測的是loseLife而非damage。
- **Burrowing** `16ed5006-40f3-4df2-8b60-6d0b13bb35a8`，更新2026-02-09T18:42:32Z：forced Burrow不給生存能力，waterpart使Burrow失敗。
- **Adjacent** `1d3363e4-3b12-46fb-99d9-f4319967f484`、**Nearby** `7de60b0a-855c-4bab-95a7-7e6f172ba4a0`：含自己square，minion/location類範圍尊重region。
- **Damage** `d54c08da-2107-484a-9f68-123bb62581b5`，更新2026-03-05T23:37:16Z：Site damage令Site controller失life；與GriefLarvae owner不一定相同。
- **Collection** `78ce4090-a2e1-4893-97c0-6eaafd5c5937`，更新2026-03-25T19:19:53Z：constructed collection仍受rarity限制。GreyWolves文字只授spellbook任意數量，不把collection上限取消。

## 接續／遷移方式

Root通知後才轉正式；子代理尚未複製。candidate imports目前都是workspace絕對路徑，轉成正式test時須將src import改為`../src/`，data讀取改成`new URL('../data/official-cards.json',import.meta.url)`。沒有其他helper依賴/tmp檔。

本候選25項與draft現穩定，不再擴測，root可納正式並跑完整安全節點。無本子集session仍在執行（86224已exit0）。全部六張UI未驗；不將代表效果、helper、模擬或registry狀態冒稱完整玩法驗收。未向睡覺使用者發問或發進度，未碰UI/server/憑證/推送部署。

## Formal integration and legacy expectation correction

Root promoted all25 unchanged native cases to tests/catalog-minions-wave10.test.js using portable relative imports. First formal full2450 had2449pass/1 failure: old final-flood Smokestacks test incorrectly expected externally applied The Flood to disappear under silence. Official SilencedCodex explicitly states the opposite. Original file and failing TAP preserved; corrected that strict expectation and added real Site.silenced true/false checks around actual source destruction, retaining permanent marker/destruction assertions. See data/external-flood-test-correction-backup.json. No test deleted or skipped; cross/full reruns required.

## Complete formal regression

2026-10-30T21:48:22.719Z: full2450/2450 passed, zero failures/skips, session36138 exit0. Stable TAP/validation under data/all-cards-audit/logs/wave10-full-2450*. This confirms formal regressions only, not full per-card browser/rule coverage or every interaction.
