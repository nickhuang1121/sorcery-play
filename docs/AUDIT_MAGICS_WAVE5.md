# Magic Wave 5 逐卡稽核

2026-10-30；接續root最新完整2211/2211（21:06:44Z）後的六張未查Magic。本agent僅新增`tests/catalog-magics-wave5.test.js`及本doc，未改共用引擎／JSON／其他正式測試。

正式命令：`node --test tests/catalog-magics-wave5.test.js`。目前 **21項20過1紅、exit1、0跳過**，`/tmp/catalog-magics-wave5-before.log`。六張各有實際native cast成本／門檻正負控制（不是registry flag）。正式檔目前穩定供root統一修補。

| 卡牌 | 真實操作與效果證據 | 結果／限制 |
|---|---|---|
| Fade | 真手牌，僅ally可選，Stealth；在敵Site後抽牌種類可選Atlas，JSON選擇後真實topAtlas進手，付2 | 普通流程過；**紅**：Giant anchor11在己Site、身體12佔敵Site時Stealth正確但漏draw，因舊碼只看u.at而非全部occupied。後段實際draw斷言須修後跑才能認列 |
| Fatality | saved state真手牌只列wounded same-region minion；健康、Below及Avatar不列；真kill回owner墓，付3。另己方及敵方Ward兩case都破Ward防kill、不療傷 | 三效果案例過。這個legacy action已完整攜target，沒有提交後的引擎cancel；UI前置選擇／取消由root另驗，不能用不dispatch冒稱完整UI取消。未窮盡死亡替代、免疫與全部borrowed effects |
| Feast for Crows | 真付3，JSON後name Spell，對手hand2／book2／grave1同名全banish，其他名與自己zones不改，真正shuffle；另Haystack只限book top3、Wormelow保grave仍處理hand/book | 三case過。未驗Bureau存取費及所有mortuary交換；私人搜索fail-to-find的可選操作尚未查，不能把正向全banish當所有搜索選擇完成 |
| Feign Death | 真paid3、JSON普通選擇，Noisome Twosome真的Deathrite生Skeleton、自己不死、獲Stealth、draw真top spell；無Deathrite Brown Bears也Stealth+draw | 普通兩case過；另gained Deathrite紅測暫存見下，不能標整張完整。未驗所有Deathrite同時／換回合等時序 |
| Fireball | cast-time方向宣告尚未付費可cancel；確認北向後付4，JSON impact從多合法unit選一個打4，other同location各2（包含Stealth）、Below0、遠處0 | 正向與cancel過。Stealth不能被直接projectile hit但可以受untargeted splash；未窮盡Ward、projectile barriers、Globe、全部oversized interactions |
| Firebolts | direction可cancel；同北向逐顆：第一殺已wounded Noisome→Deathrite真Skeleton，第二殺該Skeleton，第三穿過空location打後排1；另多目標三個impact選擇在第二顆前JSON，分配2/1不重付、不重cast | 三case過、真付2。不是把3次hurt helper當射線測試；尚未窮盡所有kill-trigger／flight-barrier等相互作用 |

## 來源

當日成功刷新 [Fatality](https://sorcerytcg.com/cards/fatality)、[Feign Death](https://sorcerytcg.com/cards/feign_death)、[Firebolts](https://sorcerytcg.com/cards/firebolts)；Fade／Feast／Fireball頁工具不可存取，不聲稱已刷新，使用repo官方卡文快照與同日官方Codex/FAQ快取。

- Fade：`data/official-cards.json`真卡文「occupies an enemy site」，Oversized Units `7f57fe26-eac3-45a4-b449-994fef47d872`實際佔據每個location；Draw `c50821a8-cb00-4270-a252-25e5f9c077c1` draw-card可選Atlas或Spellbook；Stealth `8dc27cdf-47d5-4d69-8724-c30efbe94158`。
- Fatality：Wounded `65b32de9-b4a3-48e4-90ee-98cf67d4f2a6`、Kill `f6e68ade-9736-4354-936b-e461ab73d352`明定kill=destroy、Target `98943611-2a6f-4756-ad9b-a7d6598e9729`同region；Ward `ae9b6774-aa8f-45c5-a424-d6d7e58014c3`。
- Feast：Search `fc2e5653-d210-4ba9-9280-57f2baeaedfd`、repo Haystack/Wormelow Tump卡文；後者Earth3門檻在fixture中真達成，不是直接override保護flag。
- Feign：FAQ `e342129f-2beb-48fe-a620-372d6e909981`（2026-03-25）明定無Deathrite仍Stealth；Deathrite `7bd846a2-c55b-42cc-915a-9861f2080202`，所有實際gained Deathrite也屬卡牌能力。
- Fireball／Firebolts：Projectile `c81c8875-ef70-4202-8c98-7ac00ece0cc6`，同region直線遇首unit、多候選由controller選、Stealth不能hit；Firebolts FAQ `FWsVZ4rxgHCtjTP73mWChC`明確每顆完整處理死亡／Deathrite後才下一顆。

## 額外 Feign Death 暫存紅測（尚未正式納入）

`/tmp/catalog-magics-wave5-gained-deathrite.test.js`，1項0過1紅，`/tmp/catalog-magics-wave5-gained-deathrite.log`。真Zap→Fatality殺Those Who Linger，其真Deathrite產生帶「Deathrite生Skeleton」的Ghoul；JSON後Feign Death Ghoul，Ghoul仍在且有Stealth，但Skeleton0，應1。`triggerDeath`僅取`unitDefinitionLayers(...).death`，未包括`u.addedDeath`；真死亡則包括，屬確定差異。

此fixture提供Ghoul collection作合法來源；Those Who Linger舊definition另外未consume collection，是該Minion獨立待修項，不能將此來源路徑當其整卡驗收。因正式21項已告root穩定，這個新增紅測先放/tmp避免fullrun讀到變動，待root窗口通知再納入。

全部實際UI由root另驗；本agent未操作5500、未開服務，也未向睡眠使用者發問／發進度。保留source刷新限制、逐卡部分覆蓋與待修紅測，不將一批代表性測試當全庫完成。

## 正式追加 gained Deathrite 與獨立 collection 嚴格回歸

root確認無full進行後，已把/tmp gained案例及兩個獨立collection案例正式加入。現在檔案固定 **24項20過4紅、exit1、0跳過**，`/tmp/catalog-magics-wave5-24-before.log`。四紅是Fade非anchor、Feign gainedDeathrite、Those Who Linger有collection未消耗、Those Who Linger無collection卻生成Ghoul；不可排除它們稱全綠。

那些collection案例明確設`collectionMode='constructed'`，分別放一張實體Ghoul或空collection，用原生Zap→Fatality真正殺Linger、跑Deathrite；若有真collection選擇會選其Ghoul，沒有生成先驗flag或fake frame。期望有牌則消耗一次而生1，空則不生，原Linger入正確墓地。gained-Deathrite案例也容許合法collection選擇接續，所以root改用collectionSummon後仍可跑到Feign的真正能力驗證。

來源補讀：Collection Codex `78ce4090-a2e1-4893-97c0-6eaafd5c5937` 明定constructed collection為額外實體區域；只有Limited named-card有從外部自動取得例外。Those Who Linger repo真卡文為從collection召Ghoul，並使它獲得生Skeleton的Deathrite。官方source-index沒有此卡單獨FAQ（不是沒查）；當日官方頁工具不可存取，故不宣稱刷新成功。root可在collectionSummon加傳遞addedDeath支援並統一改定義，但仍需真測24及完整回歸才能驗收。

這三個案例是六張Magic任務中發現的具體交互回歸，並非另擴下一批卡。沒有改任何共用source。root整合後請更新本doc最後結果及逐卡ledger，保留歷史before紅測可稽核。

## 根修補後最新穩定：26／26

root統一修補Fade occupied、Feign gained addedDeath、Linger mandatory collectionSummon及兩段明確Surface後，正式新增兩個原生邊界，本檔目前 **26項26過、0失敗、0跳過、exit0**，`/tmp/catalog-magics-wave5-26-mandatory-surface.log`。這只是本檔結果，完整最新需由root再跑，不可直接把先前2211當這版full。

- mandatory collection：真正Deathrite有合法實體Ghoul時，若開選擇則無null／false／skip，JSON恢復後必選其Ghoul並consume；引擎如自動解唯一合法選項亦可，但仍驗最終Ghoul1、collection0。
- 兩段Site summon：真Bury使Linger在Land地下死亡，Ghoul出現在同Site Surface；JSON後再真Bury使Ghoul地下死亡，gained Skeleton也出現在同Site Surface。兩原卡入墓、Skeleton仍在，不是把召到地下即窒息當作成功。

來源再核：Search Codex `fc2e5653-d210-4ba9-9280-57f2baeaedfd` 明定只有用search一詞才屬搜尋，不能將這段mandatory「from collection」套私人search的fail-to-find。Summon `679db7d7-3cb3-4655-b84b-53c4bd6ed637`、CastingSpells中的CastingMinions子條（預設Surface；有Burrowing才可合法地下召喚）及Ghoul／Skeleton真特徵，支持這兩個無Burrowing minion在指定Site Surface出現；此case不推論所有具有特殊區域能力的卡之未查選擇。

尚未新增的相關風險已報root：generic summon/festival primitive未使用paySummoningTax，因此FeignDeath觸發的Noisome／gained Skeleton在MockCourt下的召喚費未於本26項檢查；這不是已通過證據。保持正式檔穩定，若root併修再加獨立回歸，勿無聲漏掉。

### 未納正式的已知兩紅（不可稱整體全綠）

已以`/tmp/catalog-magics-wave5-feign-mock-tax.test.js`真正證實，`/tmp/catalog-magics-wave5-feign-mock-tax.log` **2項0過2紅**。在MockCourt下，真FeignDeath觸發Noisome Deathrite：付3後餘1應再付1生Skeleton，現漏費；付3後餘0應不生，現仍生。不是只是猜測。正式26檔保持穩定供root窗口，已通知root必須把此列已知失敗；即使正式full暫全綠，也不可忽略這兩項而說所有已知回歸都綠。它們屬同FeignDeath/Deathrite交互，未擴新卡批次。

## 最後正式結果：28／28（2026-10-30T21:20:54Z）

依root要求把MockCourt兩項原樣納正式，修補前本檔28項26過2紅（`/tmp/catalog-magics-wave5-28-tax-before.log`）。root在generic summon/festival的`canSummonEntry`之後加入既有`paySummoningTax` guard，然後本agent實跑：

`node --test tests/catalog-magics-wave5.test.js > /tmp/catalog-magics-wave5-28-tax-after.log 2>&1`

**exit0，28項28過、0失敗、0跳過，2367.622333ms**。包含真FeignDeath Noisome：餘1支付Skeleton稅，餘0不召，source活著、Stealth及原嚴格付款斷言全部保留。21:20:54Z讀回結果。本檔此後保持28項穩定。前文/tmp已知2紅由這次正式回歸關閉，並非排除測試。整體full與UI仍由root另跑，不把本檔全過等同全庫完全驗收。
