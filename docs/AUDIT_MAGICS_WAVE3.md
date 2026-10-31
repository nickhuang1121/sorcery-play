# Magic Wave 3 逐卡稽核

2026-10-30，原 unreviewed 順序前六張。只由本批新增 tests/catalog-magics-wave3.test.js；共用引擎由 root 統一修補。這是代表性原生流程驗證，不能稱全卡或實際 UI 完整驗收。

命令：`node --test tests/catalog-magics-wave3.test.js`。最初合法案例 9 項 7 過 2 紅（`/tmp/catalog-magics-wave3-valid.log`）；加成本／門檻後 15 項 13 過 2 紅（`/tmp/catalog-magics-wave3-cost.log`）。root 修補後最新 16/16、0 跳過（`/tmp/catalog-magics-wave3-final16.log`）。初次試寫 fixture 的 power() 預設誤以為平均、Chaoswish 結果誤以為 object，均已在正式紅測前修正；它們不是規則缺陷證據。

| 卡牌 | 真實操作與效果證據 | 邊界及限制 |
|---|---|---|
| Chain Lightning | 原生手牌施放、首目標、追加不同 nearby 目標、JSON、確認後一次付 2+2 並各傷 2 | 宣告期間不扣費；不能重選；遠處排除；取消保留手牌／mana／health；另有下述大型目標紅測待整合 |
| Chaos Twister | 原生手牌施放、選 Brother Knight、人工落點輸入、JSON，對落點 surface 單位打 floor((3+2)/2)=2 | root 修正 finalTwisterDamage 原先只讀攻擊力導致3傷；below不受傷，自己死亡；實體吹牌動作須玩家真實操作並回報，測試只注入合成報告，未驗實體或 UI |
| Chaoswish | 真正鎖 caster，Black Cat 控制隨機選結果，JSON 保存，免費 Zap 傷害 1，複本 banish 不入墓，對手可拒絕 | 不能冒充真實隨機頻率或每個1093結果皆驗；既有 final-chaos 套件另含 unsupported 暫停及 Kythera 有限循環 |
| Charge | 給當回合出生 ally Charge，ready 由false變true、真正 move action 可用，JSON，真正 end cleanup 移除 keyword | enemy不列可選；尚未窮盡來源抑制／所有借用情況 |
| Chorus of Condemnation | 兩人局各受影響玩家自主從自己手牌選實體卡棄置，第二選擇可JSON恢復 | 空手不發明 deck discard；此引擎兩人局，沒有多玩家目標決策驗收 |
| Common Sense | 普通牌真正入手，不算 draw，不受 Garden 已抽一次限制；剩餘 deck multiset 正確；公開 log 記牌名 | root 修正私人 search 無匹配不能cast、沒有fail-to-find問題；無匹配及有匹配均可失敗，正常付費且shuffle（rng變化），不獲牌 |

六張均另有原生 legalActions 成本／門檻正負控制：足夠時可 cast、spent 導致不足時拒絕、元素門檻不足時拒絕。不是單看 card registry flag。

## 來源與確定缺陷

- 專案 `data/official-cards.json` engine 卡文及 printed mana/threshold。當日網頁成功取得 [Charge](https://sorcerytcg.com/cards/charge)、[Chorus of Condemnation](https://sorcerytcg.com/cards/chorus_of_condemnation)。Chain、Twister、Chaoswish、Common Sense 官方頁工具不可存取，不能宣稱已刷新其頁面。
- 官方快取 `/tmp/sorcery-official-embedded-docs.json`：Search Codex `fc2e5653-d210-4ba9-9280-57f2baeaedfd`（私人區域可 fail to find，即使有匹配）；Draw `c50821a8-cb00-4270-a252-25e5f9c077c1`（put hand 不算 draw）；Discard `adee8b2b-40ba-4231-874d-df4790483730`；Charge `4cff66bd-45c0-452b-aaa8-18119accf443`，October 2026 Rulebook Charge 條。
- Twister 平均 power：Split Power Codex `7f64db2b-3903-4bbd-8d36-bfa53ce5faa8` 明確舉 Brother Knight 為2傷。實體替身 FAQ `FWsVZ4rxgHCtjTP73mU2te`，2026-10-23；Old Salt強制移動FAQ `FWsVZ4rxgHCtjTP73mVt7K`。
- Chaoswish：Copy Codex `88663410-ac07-4dd6-b2fe-fbecbadf232a`；先鎖caster FAQ `bc004dd1-4290-4f4b-8d79-c0f6d91e4ce0`；免費免附加成本 `a998b5d3-0d5d-435f-aef6-5f6f3dcedcef`；非法結果不施放但傳下一人 `7c534e30-b55d-4228-9b57-b32b3dbd1123`；Kythera有限次 `39f66a6b-8f7a-469d-be06-6a20cac2a474`。

大型 Chain 後繼目標已在 `/tmp/magics-wave3-chain-large.test.js` 重現紅測：Giant anchor11佔11/12/16/17，caster17可以首選它；普通unit8與12 nearby，卻因 chainDeclare 僅看兩個 anchor 而漏選。log `/tmp/magics-wave3-chain-large.log`。正式檔因 root 完整回歸要求先保持穩定，待通知再整合，不能把目前16全過當此問題已修。

## 後續第二批鎖定

Cone of Flame、Consecrate、Corpse Explosion、Craterize、Critical Strike、Day of Judgment。正式測試尚未新增，先於 `/tmp` 準備，避免完整回歸讀到半成品。

2026-10-30 網頁成功刷新 [Craterize](https://sorcerytcg.com/cards/craterize)、[Critical Strike](https://sorcerytcg.com/cards/critical_strike)、[Day of Judgment](https://sorcerytcg.com/cards/day_of_judgment)；另外三頁不可存取。已讀官方 Damage Grid `015d636e-716c-450e-9e17-abef557f3e4c`、Cost `a6a73d30-6b05-4402-b148-9eeaf88b4d0b`、Consecrate 控制權 FAQ `082ba4a7-20e7-431b-82f5-0ae0f7999430`、Cone 同region FAQ `FWsVZ4rxgHCtjTP73mTxM6`、Craterize above/below FAQ `FWsVZ4rxgHCtjTP73mU8xG` 及 Orb同目標第二次失效 `bf741c7b-2fc9-4d6a-8419-69e2c7aa8c19`。

全批 actualBrowserUI 一律待新增 loopback 授權；沒有重試被拒 server 或替代 port。未修改卡牌統計 JSON，由 root 依正式測試與來源範圍整合。

## 第二批已正式加入（31 項穩定版本）

root 通知前一版完整1899/1899後，已將/tmp候選的Chain大型案例及第二批六張移入正式test，加第二批各自成本／門檻正負控制。最新修補前命令同上：31項28過3紅，log `/tmp/catalog-magics-wave3-31-before.log`，exit1、0跳過。正式檔現固定，供root整合回歸；不能將這3紅排除後稱全綠。

| 卡牌 | 本批原生效果及步驟 | 尚存限制／結果 |
|---|---|---|
| Cone of Flame | 真正手牌付6、選北向，JSON；近處5、第二排寬邊3、遠處1、側邊0、below0 | 代表格與region流程通過；本批未重新人工讀取官方卡面damage-grid圖片，完整圖案視覺來源仍需刷新 |
| Consecrate | ally於敵控Site，先Ward再可選collection實體Consecrated Ground，JSON；保持原controller且消耗collection | 可Skip且Ward保留；未窮盡oversized ally多Site選擇及collection權限交互 |
| Corpse Explosion | 真手牌付7，2x2選區，JSON後從真cemetery選BrotherKnight實體UID到Site，打傷後banish屍體 | **紅**：應floor((3+2)/2)=2但實得3；finalCorpseBlast硬讀attack。Split Power Codex適用任何問power的效果。修後須保留屍體banish斷言 |
| Craterize | 真手牌、cast-time Site target、額外實體Site棄置選擇，未確認前spent0，JSON後支付8、地點變rubble、above/below各10，Site只棄一次 | 正常流程過；**紅**：敵控targetSite Ward破而Site不毀，但仍打其單位10、鄰單位7，官方Ward明說整個依賴grid都不傷 |
| Critical Strike | 真付費cast、JSON、真原生attack/pass戰鬥，22-power ally首次strike打44；效果消耗 | 攻防流程過；此案例不代替其他所有strike類型、overpower與順序組合 |
| Day of Judgment | 真付7、JSON十字選擇，Evil先banish，surface中心7、below長臂3、遠角Evil保留 | 代表性跨layer結算過；本批未重新人工讀取完整官方damage-grid卡面，不宣稱圖形窮盡核對 |

新增確定缺陷來源：Ward Codex `ae9b6774-aa8f-45c5-a424-d6d7e58014c3`，更新2026-10-12T21:55:51Z，明確以Craterize舉例：targetSite受Ward保護時整體不造成傷害。Corpse平均沿用Split Power Codex；不是自行制定家規。

官方Craterize／Day頁的Image連結可解析到 `d27a44hjr9gen3.cloudfront.net/cards/002-craterize-b-s.png`／`006-day_of_judgment-b-s.png`，本工具文字回傳未顯示可讀卡面，因此不把成功解析網址當已視覺核對圖案。

UI：十二張皆未做本批實際瀏覽器互動。Twister physical report尤其只測合成輸入，不宣稱自動完成吹牌動作。來源頁無法存取屬讀取限制，未試替代server、未觸碰設定或憑證。

## 第三批六張（正式 45 項）

前一版31項三紅由root修正後，本批正式追加。最新 `node --test tests/catalog-magics-wave3.test.js` 為45項43過2紅、exit1、0跳過，`/tmp/catalog-magics-wave3-45-before.log`。兩紅均Degradation不同保護條件，非測試暫存／刪斷言。正式檔暫穩供root整合。

| 卡牌 | 原生操作與可核證結果 | 限制／發現 |
|---|---|---|
| Deathwish | 真付6，最大21→10／19→9；當前21→10，原6不被補至9，JSON保留maxLife | FAQ `2c36c990-4285-4c87-8f86-a9855441bc63` 立即壓到最大、`ef774108-960a-4715-8c0a-2516db883ded` 奇數向下；未窮盡Death's Door連續減半 |
| Degradation | Ward無Stealth敵Mortal、Stealth無Ward敵Mortal兩獨立流程 | **紅**：前者能施放及選擇但Ward錯擋transform；後者native cast缺席。卡文只有選擇沒有target，變形應保留marks、mods、傷害、同一UID、born、owner/controller並banish原卡。待root修正選擇保護語義 |
| Deliverance | 真付3，nearby Evil敵我全banish；below、遠處不影響；Noisome Twosome不觸發Deathrite生Skeleton | 明確驗非死亡不是只查helper；尚未窮盡borrowed Evil與oversized範圍 |
| Demonic Contract | 真cost選擇確認前不扣費／life；選4life後付4life+2mana；Exceptional Demon限制search rarity，Unique不列；JSON後選普通實體入手及deck multiset | 不把這個生命付款代表案例升格為實體accord全部完成；原101 partial人工Gem／Mortal等限制照舊，physical分類未自動核實 |
| Desecrate | Evil ally在敵控Site真strike，先損原控制者生命再collection可選變形；JSON；原controller保留且collection消耗 | 不是用helper注入傷害；未窮盡oversized多Site、特殊strike provider或skip額外邊界 |
| Detonate | Own Warded minion先破Ward防毀，再自身及同層每unit真3傷；below／遠處0；Lethal爆炸者不傳Lethal。另可選enemy控制但自己擁有的minion，排除純敵minion並回原owner墓地 | FAQ `fb28bb96-4bcc-409c-8c56-fb5cfbd418c1` Ward擋destroy但仍explosion；`034adaed-3273-441e-a4bc-b892ffbe5010` 來源是spell非爆炸minion。尚未驗所有神器及大型爆炸位置 |

第三批六張也逐卡增原生 printed-mana／threshold正負控制；共18張，正式45案例。

來源2026-10-30：成功刷新 [Deliverance](https://sorcerytcg.com/cards/deliverance) 與 [Desecrate](https://sorcerytcg.com/cards/desecrate)；Deathwish／Degradation／Demonic Contract／Detonate頁工具不可存取，使用repo卡文及同日官方快取，不宣稱全頁刷新。Transform Codex `c27cbd3f-39d3-46b0-8133-37063e86df7e`（2026-07-15）、Token `c0a4c32b-5894-4821-ae03-172b1358d5d9`、Stealth `8dc27cdf-47d5-4d69-8724-c30efbe94158`；Desecrate controller FAQ `b50b6e54-e3f8-443d-ba34-af50e63e769a`。

Degradation具體待修位置：`selectEffects`本身已能由selectorMetadata choose設untargeted，但magicPlanning/preflight與後段通用`step.select && !step.untargeted ... blocked`是否保留語義不一致，root應按卡文僅修確定choose，不能把真target卡變成不受保護。

## 第四批六張（暫存，等待正式檔穩定窗口）

`/tmp/magics-wave3-fourth-six.test.js`，8項6過2紅，`/tmp/magics-wave3-fourth-six.log`。尚未移入正式檔，不能把完整回歸當覆蓋它們。

- Dhol Chants：兩個當回合出生nearby ally真tap；reveal top2、JSON後選free Zap實際傷1，另張真放bottom，僅付Dhol本身5。官方FAQ `ccecb1e8-6196-4ca9-b571-818f477203eb` 明言這是effect不是cost，因此可tap summoning-sick minion。未窮盡所有free-result、空牌庫及複雜額外成本（既有final-effects另有部分案例）。
- Disenchant／Dispel：Airborne caster不縮短cardinal兩steps距離；目標surface location，摧毀surface artifact／交疊aura，保留below artifact／minion。**兩紅**：同area的below aura也被誤毀。可達的underwaterAura已有原生TheFlood測試證據；Location Codex定義square+region，Surface與underwater是不同location。engine dispelLocation的Aura迴圈只inside不檢layer。
- Disintegrate：真nearby target，其攜帶兩件不同owner神器全banish回各owner，地上神器留；Ward目標破而minion與其dependent carried items都受保護。未窮盡carried-unit等每種carrier結構。
- Displace：minion12→Void8不列，正常對角6可；non-minion Aura12→Void8可且JSON。未窮盡Globe／大型body、force-immunity與border-effects。
- Divine Healing：真付1，life9/max12回至12；Death's Door不回血。未測River多重減半（官方FAQ另明確）及所有life替代。

2026-10-30 網頁成功 [Dhol Chants](https://sorcerytcg.com/cards/dhol_chants)、[Disenchant](https://sorcerytcg.com/cards/disenchant)；另四頁不可存取。來源：Location `1c06ae66-10a5-4c5a-96bc-21bdcfbd2999`；Airborne `c7c182e2-629c-4e65-a9a0-97feff983a3d` 明定Disenchant steps不受Airborne影響；Aura `1c5c02a4-586e-4bfd-99ce-11e9230ed140`、CastingSpells中的CastingAuras子條；Teleport `148ecc13-72e8-46eb-812f-2c6f3b37cd6d`；Displace minion不可進Void `f60ab42e-b513-4045-aa58-263613f3ff59`、Aura可跨Void `dc0be8a9-8546-4c8c-be4b-ae97a65b5788`；Healing `f980ed60-def7-4a2d-87ca-589573087481`。UI仍未驗。

## 第五批正式完成測試編寫：30張、73案例，待修四紅

已依root通知將第四批14項及第五批14項移入正式檔。**目前正式穩定版本為73項69過4紅、exit1、0跳過**，`/tmp/catalog-magics-wave3-73-before.log`。第四批Disenchant／Dispel的layer修補已由root整合，因此這兩項在73版本轉綠。此處是待修階段，不可稱73全過或完整專案全綠。所有共用runtime修補均由root負責，本agent只新增專屬test／本doc，沒有改JSON或其他測試。

| 第五批卡牌 | 實際操作證據 | 目前結果／限制 |
|---|---|---|
| Divine Intervention | 真手牌cast，DeathDoor0→1且清Door、JSON；另live8的場景 | 門口返回過；**紅**：官方FAQ明說live高於1仍set1，現仍8。初稿曾按字面誤假設live不變，已在正式納入前依官方FAQ更正，不把該錯假設作完成證據 |
| Divine Lance | 真cast targetSite12，拆盟友unit Ward及Site Ward，JSON，單次3傷及surface／below，非目標Site單位0 | 通過。對應FAQ一次3非三次1；未窮盡所有Ward／targetWard／大型minion各位置 |
| Dodge Roll | 真正敵回合attack觸發window、鎖實體手牌、JSON、0mana回應，普通相鄰move13避開，原active0不改／受攻者0傷 | 正向過；負向另以實際attack檢查threshold不足及Bells額外cost時無回應、手牌與mana不變。沒有把無效main-phase cast拿來當支付驗收 |
| Dream Quest | 真cast allied Wizard，disabled／sleep，兩次真end與中間draw到自己next start，JSON→wake→真正search／入手／shuffle | 正常流程過；**紅**：wake後private search沒有fail-to-find選項。有牌仍可失敗依Search Codex，應空入手但shuffle，wake已選不應反悔 |
| Dredge | 真cast targetWaterSite，普通underwater minion與ground artifact Surface；兩Skeleton預期Surface；另Giant anchor11實際佔target12 | **紅**：Aura完全沒Surface，非anchor Giant也沒Surface。原生測試在Aura失敗後Skeleton斷言尚未走到，所以不先宣稱本項所有斷言已過。Source Surface是一種強制moveUp，非隨便改keyword |
| Drown | 真cast普通無Submerge minion於水面，強制下水後溺死入墓；另ground artifact真的移到below | 通過。Monks／大型或Moeba細節由root既有批次另核，這個代表案例不取代它們 |

第五批五張一般magic逐卡加入合法mana／threshold正負控制；Dodge Roll有上述專屬reaction正負控制，避免硬用main-phase不存在的動作。

2026-10-30 成功刷新 [Divine Lance](https://sorcerytcg.com/cards/divine_lance)，其他五頁工具不可存取。引用官方同日cache：Intervention `15a0ebae-7ccb-4245-a279-b7e8b04e3439`（非healing，removeDoor再set1）與 `33cdd97a-77f8-4252-93f9-76a00ecfd7b5`（life高於1仍set1）；DivineLance `db333ecc-4302-4b38-af1f-b69598dbb1b4`（三傷一次）；Dodge額外費不可用敵回合mana `ygoDG8fb7HS97qCW69iTPs`，Adjacent `1d3363e4-3b12-46fb-99d9-f4319967f484`；DreamQuest `FWsVZ4rxgHCtjTP73mUtpg`（Avatar不能disabled）及 `dadbf02c-ff9f-4d39-9b16-9a32a4da010c`（非minionSpellcaster可sleep）；Surface `044f9fc4-dea9-4fe0-9c17-6db00bd5e361`，Submerge `aaa76e05-0cbc-4114-ad1c-411eeec89eea`，Search `fc2e5653-d210-4ba9-9280-57f2baeaedfd`。

全部30張 actualBrowserUI 仍未驗。停止擴第六批正式test，保留73項穩定窗口供root完整回歸；下一步只需root處理四紅，再跑本檔及交叉／完整套件，然後按實際證據更新逐卡JSON，不把30張都標full。

## Dredge 設計接續與新增 77 項穩定版本

root 指示繼續 Dredge，並通知使用者允許使用既有5500 UI。沒有向使用者發訊／提問／進度，也沒有啟動或重試任何server。本agent仍只補原生測試與設計，實際UI由root驗，不沿用前文舊的「5500未授權」描述。

正式test已補四項：

1. Moeba below12/13、anchor13，Dredge target12真正開選擇；唯一合法擬足來源為接觸target的below12，不能任選不接觸的13。JSON後Surface新增12surface並保留原12below、13below；Skeleton在選完前為0，選完後為2，原spell只進墓一次。
2. 兩個Moeba共佔target12，先保存第一個選擇，兩者都未移動、未召喚Skeleton；JSON保存第二個選擇後才全部Surface，最後Skeleton2。
3. ordinary Giant anchor11 below，非anchor裝備at12 below；target12整個Giant Surface，gear仍at12、同bearer、layerSurface，沒有瞬移到anchor。
4. Dream Quest next-own-start醒後，在敵Haystack作用下只可搜索真top3；可私人fail-to-find，無卡入手，仍shuffle整個deck。斷言未搜索底部段也有位置改變，不能只洗top3。Haystack repo卡文明確為對手搜尋deck改top3。

最新命令同上，**77項72過5紅**（`/tmp/catalog-magics-wave3-dredge-haystack-77-before.log`）。五紅只剩Dredge：Aura、非anchor Giant、單Moeba、雙Moeba、gear案例。Intervention及Dream/Haystack已因root修補轉綠。正式檔現在保持77穩定；沒有新增第六批卡。

候選修補（供root唯一整合者審閱，**本agent未執行／未改source**）：

- `/tmp/propose-dredge-surface.py`：檢查legacy liftSite完整區塊唯一存在、新module尚未存在才可apply，避免覆蓋其他進行中修改。
- `/tmp/catalog-forced-surface-candidate.mjs`：抽出的純module供閱讀，`node --check`通過；Python script用AST解析成功，未執行source寫入。
- `python3 -m py_compile`曾因預設寫使用者Library/Caches（workspace外）被sandbox拒，source及patch未執行；不重試該cache寫入，改只在記憶體AST解析。不是server拒絕重試。

設計依據：Surface Codex `044f9fc4-dea9-4fe0-9c17-6db00bd5e361`（動詞向上移動）；Oversized Units `7f57fe26-eac3-45a4-b449-994fef47d872`（所有普通body parts同向移動，若一部不能則全部不能；實際佔據多locations）；Megamoeba卡文明定保留原location並佔據新location，FAQ `ygoDG8fb7HS97qCW69tRC6` 明定surface及subsurface同Site兩location各加power；Carrying Artifacts `0071b464-5f55-4aaa-b959-f51ae80f902c`（單一實體location、相對位置保持）。

候選重用既有`geometryForcedSurfaceMove(s,u,at,A)`（Mudflow已使用的指定Site接觸部位語義），不擴成任意遠處擬足；active growing Moeba選擇存在真frame，普通／disabled body整體移動。Aura使用`catalogAuraPhysicalShape`（walls二格而非硬猜2x2），避免只用anchor。先收集並重新驗證所有Moeba plan，再實際移動；gear由既有checkpoint保持相對位置，獨立神器才按自身location Surface／必要時detach。另排一個finish continuation，讓移動及state checks完成後才summon Skeletons。

尚須root執行候選後原生77、相關geometry／aura／carrier／dream套件及完整回歸，驗證所有API整合與state check時序。候選目前只有語法驗證，不能冒稱已通過執行。擬足choice是一般合法引擎選擇，並非physical分類的manual-report；不能設`manual:true`來偽裝規則完成。

## Dredge 最終交付窗口：81 項與候選修正

2026-10-30T20:36:32Z 收到真實命令結果：`node --test tests/catalog-magics-wave3.test.js` **81項73過8紅、exit1、0跳過**，`/tmp/catalog-magics-wave3-dredge-avatar-tax-81-before.log`。正式test現在停止修改供root整合，沒有重跑原77項之外的重複草稿或擴張新卡批次。

依root review修正候選兩點（只/tmp，未執行source mutation）：

- `permitted`納所有unit（含Avatar），仍經`fiftyForceAllowed`；不能將卡文everything自行限Minion。
- `finish`每Skeleton先`canSummonEntry`再`paySummoningTax`，使用既有primitive；不是憑空替MockCourt造新費用。

新增四個正式案例：

1. 水下Avatar與其真carried Amethyst Core被Dredge Surface，gear保留同bearer及location，且召2Skeleton。此案例在舊引擎本就通過，防止候選錯限Minion退步。
2. MockCourt生效，Dredge付費後剩2mana：每Skeleton必付1，共生2／多付2。
3. 剩1mana：只能生1、另一個依既有failed-summoning primitive banish。
4. 剩0mana：生0、兩個不成功；Surfacing仍獨立完成。

MockCourt三個都是舊引擎真紅，不是fixture錯誤；raw官方卡快照Skeleton rarity是null，但`cards.js`依官方Skeleton Codex已在runtime設為Ordinary。本測試明確斷言此runtime特徵再檢稅，沒有改snapshot或繞過合法操作。官方FAQ `672445a5-91b8-45ae-96f0-976e33c86232`（2026-07-15）明列普通token Skeleton/Frog/FootSoldier亦適用，每次summon時支付，不能付則不召；`42d3dc38-0ce3-4dfa-bd31-879dce109eb5`另說多MockCourt疊加。此批未驗多Court疊加，不冒稱涵蓋。

八紅全部Dredge：Aura、非anchor Giant、單Moeba、雙Moeba、非anchor gear、MockCourt三個。其餘73通過。root需執行候選或自行整合，再跑81與完整回歸；本agent沒有把候選語法通過冒稱runtime完成。

root另已告知既有5500實際UI檢查進度，此doc不替root下結論。此agent本輪未操作UI，未向睡眠使用者發訊或提問；沒有server操作、未改共用source／JSON／既有別人測試。

## 2026-10-30 後續來源更正：Avatar Below 非合法可達場景

Characteristics Codex `30561063-e0e1-41f7-9ab2-903475629dde` 明定 Avatars may only enter surface locations。前述水下Avatar fixture是外部／無效save的健壯性測試，**不能當作正常遊戲可達Dredge規則驗證**；已改正式測試名稱並保留嚴格Surface／gear／token斷言，沒有刪除或放寬。其他Minion、Aura、Moeba、實際UI案例範圍不變。歷史接續文件若提到AvatarBelow，均以此更正為準。
