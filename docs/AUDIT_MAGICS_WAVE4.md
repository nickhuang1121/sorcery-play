# Magic Wave 4：首六張暫存稽核

2026-10-30，root完整2136/2136後接續的下一六張。原始測試暫存 `/tmp/catalog-magics-wave4-first-six.test.js`，**15項11過4紅、exit1、0跳過**，`/tmp/catalog-magics-wave4-first-six.log`。root 16場模擬56095期間沒有改source或正式test，以免來源指紋／fullrun漂移。六張均有原生mana／threshold正負控制（6過），另有9個真實效果／步驟案例。

| 卡牌 | 原生效果／操作證據 | 發現與實際限制 |
|---|---|---|
| Duel | 實際手牌、ally選擇、固定enemy宣告、cancel不付款／不傷、JSON、fight一次付3 | **紅於ally選項**：ally12敵12同location依法adjacent，composite planning預檢卻沒列；只有Avatar17因鄰18敵而列入。故紅測後面fight等斷言尚未走到，不可先當已驗通過。期望保留同格enemy允許、斜18不列 |
| Earthquake | 真付5、選2x2、JSON排列；正常CaveTroll10跟Site到11並Burrow、ground artifact11到10並Burrow，oversized Aura anchor10不跟單Site移動 | 通過。另Void固定不能置入Site、選identity仍mandatory Burrow過；未在本批窮盡Moeba強制Burrow分肢、所有特殊Site／相對攜帶物 |
| Enduring Faith | 真cast ally Ward、JSON，對nearby allied minion真正施放Zap，預期Ward承受redirect，之後傷害由faithful承受且next-own-turn停止 | **紅**：protected ally仍受1；final-damage.js的Faith branch硬限target Avatar。後續第二次／expiry斷言須修後重跑才可認列，不宣稱已過 |
| Exhume | 真cast Land Site12，below CaveTroll、ground artifact、Aura全Unburrow後2Surface Skeleton，正常付2 | **紅**：新catalog-forced-surface統一liftSite卻硬限Water，Land即return。這是Dredge共用處理造成的Exhume回歸，需在同一helper中保留cast-time selector區分及實際向上移動 |
| Exorcism | 真native legacy target location12，Demon＋Undead banish、below同square與非類別minion留、Noisome不觸Deathrite；另enemy targetSite Ward擋整體且破 | 兩個案例過，付2；未窮盡身體跨region／所有borrowed types／保護層 |
| Extinguish | 真Site12 target，Fire minion surface及below、交疊FireAura全banish，非Fire minion／Aura留，付3 | 普通案例過；**紅**：Giant anchor11佔12且真PallidBust借Azuridge all-elements，target12漏整個Fire minion，舊迴圈僅u.at===at。需以occupied parts，不是改target範圍 |

來源：repo `data/official-cards.json` 對六張真實卡文及成本／門檻。當日web僅 [Extinguish](https://sorcerytcg.com/cards/extinguish) 成功，另五頁不可存取，不能稱全部刷新。官方cache Earthquake FAQ `FWsVZ4rxgHCtjTP73mVsYy`（正常大小=恰一location）、`eXfZjLHocReFQIApZdJlqm`（oversized units／多格aura不隨Site走）、`ygoDG8fb7HS97qCW69kPI5`（Void不能重新排列）；Adjacent `1d3363e4-3b12-46fb-99d9-f4319967f484`（包含自己square且同region）；Ward `ae9b6774-aa8f-45c5-a424-d6d7e58014c3`；Damage `d54c08da-2107-484a-9f68-123bb62581b5`；Oversized `7f57fe26-eac3-45a4-b449-994fef47d872`（真正佔據每一location）；Surface `044f9fc4-dea9-4fe0-9c17-6db00bd5e361`及Unburrow待再次抽取其條文ID。

全部UI本agent未操作；root已有5500授權自行安排。未向睡眠使用者發訊／提問／進度，不開server、不改設定、無推送部署。待root窗口後再將新wave4 test/doc納正式，保持root為共用引擎唯一修改者。

已補讀官方Unburrow `40c4adc8-67f9-4b21-8c3f-4f1532f3f1dc`：動詞為從地下向上移動。Ally `040cd91a-60f2-4a12-bebc-b9bf482b9877`：你控制的unit（含Avatar），所以EnduringFaith的nearby allies並非僅Avatar。Burrowing `16ed5006-40f3-4df2-8b60-6d0b13bb35a8`提供地下／強制Burrow定義及混水失敗邊界。本批依實際cases保留partial，不聲稱窮盡全部card interactions。


## 正式納入窗口

root確認16場session56095於20:43:55Z完整16/16、exit0/sourceUnchanged=true結束後，才移入`tests/catalog-magics-wave4.test.js`及本doc；沒有在模擬期間改來源。測試已換成可攜相對import與URL，不保留/tmp的本機absolute路徑。現在暫停下一批，由root統一修共用runtime。根修後再補真正全綠結果；不把先前2136當覆蓋本批四紅。

Duel後續唯讀定位更正：selectEffects.effectAdjacent已是<=1；真正漏同location的是`src/magic-declarations.js`第18行Duel legalPairs使用`A.distance(at,to)===1`。前述失敗操作及期望不變，不能誤改已正確的effectAdjacent。

## Root integration

Duel same-square adjacency fixed in composite declaration planner; Faith redirects for nearby allied Minions as well as Avatars; shared forced Surface no longer hardcodes water (Exhume target remains Land via its selector); Extinguish uses actual physical location records. Formal full2202 initially2201/2202: only Faith late-turn fixture failed to cast Zap after bonus thresholds expired. Added a real Spire for persistent printed Air1 (Zap is Air, not Fire), preserving all strict Ward/damage/next-turn expiry assertions. Isolated corrected scenario1/1 passed; rerunning full. No expected damage assertion removed or relaxed; original failure TAP preserved.
