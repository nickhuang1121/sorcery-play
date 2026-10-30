# Sorcery: Contested Realm · 本機網頁遊戲

純 HTML、CSS、原生 JavaScript ES Modules，無框架、無依賴、無建置步驟，執行時不呼叫外部 API。

在 VS Code 對 **index.html → Open with Live Server**。選擇預設或已儲存牌組與模式，確認起手牌後開始對局。GitHub Pages 可直接發佈根目錄，所有資源使用相對路徑。

## 操作

新對局可直接選 **BETA · 大地燼火** 或 **BETA · 風暴軍勢**，也能選擇對手牌組。「我的牌組」頁提供同名按鈕載入、修改與匯出。兩副皆為 60 張 Spellbook、30 張 Atlas，全部使用具有 Beta 印製的卡牌與 Sorcerer；它們是適用目前引擎的自組預設，不是官方四副 BETA 預組原表。

- 拖曳手牌至高亮格子，或點選卡牌再點位置／目標。
- 拖曳單位至位置或敵人；點選單位後也可點位置或敵人。
- 右鍵卡牌、觸控長按查看詳細資料；ESC 取消。
- 防禦窗口點己方單位加入防禦，可決定是否保留原攻擊目標。
- 牌組可搜尋、篩選、編輯、存入 localStorage、以 JSON 匯入／匯出。
- 對局自動儲存到此瀏覽器；清除瀏覽器資料會移除儲存內容。
- 起手分組顯示 Atlas 地點 3 張、Spellbook 法術 3 張；手機也不需橫向捲動。依隨機先手順序重抽，先手首回合不抽牌。
- 多名防禦者參戰時，可在效果視窗分配傷害。戰鬥先結算先攻與死亡效果，再讓存活單位正常出手；Lance 是可拾取與放下、使用後折斷的實體衍生物。

## 真實完成狀態

**尚未完成完整遊戲要求。** 官方 API 快照共 1,100 筆資料；目前 966 張卡牌可選用、7 種衍生物可生成，合計 973 筆部分支援。其餘 127 筆未開始，不能放入對局。本輪原 202 筆要求已處理 75 筆，尚未全部完成。完整實作數維持 0：完整 Storyline、特殊區域、傷害修正／預防排序及全卡交互尚未完成。1,100 包含 Token 等資料，不是已驗證的合法構築卡池數。

新增效果流程可處理 Genesis、Deathrite、回合觸發、主動能力與序列化選擇；已有地下／水下移動、投射物、裝備及部分 2×2 光環。點擊單位可使用遠程射擊、拾取／放下與主動能力；效果視窗選擇後會繼續結算。

已能以目前支援卡牌進行 VS AI 和本機雙人測試，AI 只提交引擎允許的動作。瀏覽器測試涵蓋對局至勝負；這不代表完整官方規則均已通過驗收。

從「選單 → 墓地」可檢視雙方墓地；目前支援的墓地施放卡會顯示「從墓地施放」。選牌後可指定施法者與合法位置，投射物方向也能在支付前取消。

Barrow Wight、Bone Jumble、Fowl Bones、Zombie Bruiser 會在墓地顯示「犧牲 Skeleton 復活」；選牌後點選自己控制的 Skeleton 即可支付能力費用並復活。Barrow Wight 另可選擇該地點的下層。

點選戰場上的物品可檢視卡面；若你有合法的啟動能力，視窗會列出按鈕。Ferryman's Coin 需要被攜帶才能啟動，Pile of Skulls 可先選墓地卡或取消；Monument 無法被攜帶。

官方 BETA 四元素原表已依[官方文章](https://sorcerytcg.com/news/introducing-the-beta-elemental-preconstructed-decks)核對：Sparkmage、Geomancer、Flamecaller、Waveshaper，各為 36 法術／16 地點／1 Avatar。最後 20 張已分四批補入，未支援清單為 0，四副均已開放。按「新對局」即可選擇官方原表；也可查看完整牌表或載入編輯器。16 種原表交叉對局皆完成至勝負；現有兩副 60／30 BETA 自組牌仍可使用。全部卡牌仍維持部分支援，不代表完整官方規則驗證已完成。

全卡續作累計 83 批、415 筆；原 202 筆中已加入第 69–83 批共 75 筆（74 張可構築卡與 Bruin）。[完整名單與機制](docs/PROJECT_PROGRESS.md)、[逐卡驗證](data/implementation-batches.json)及[原 202 筆追蹤](data/remaining-completion-plan.json)記錄實際結果。本次續作第 83 批五張：四張牆壁光環與 Sphere of Animosity。83 批共 88 場整合對局完成至勝負；整合對局不保證每張牌都被抽到，逐卡效果另有獨立斷言。

牆壁先選己方地點，再選邊界；確認前可取消，不扣魔力或消耗卡牌。牆壁實際占兩格，戰場以彩色邊線與兩端座標顯示。風牆、冰牆限制對應穿越，火牆與荊棘牆造成傷害；傳送、對角飛行及地下移動各自處理。Sphere 中的 Avatar 可在範圍內移動，但不能離開、接受治療或被替代防禦；搬移地點載出範圍屬例外。

Wisp 與 Witherwing 的反應會先於防禦窗口；Bladedancer 先完成戰鬥與死亡效果，再選擇走一步與追加攻擊單位。Sturmgeist 在敵方單位施放 Magic 後，先接近並出手；若施法者因此離場，該法術不結算，已付費用不退回。Peace Offering 贈與後，對方下一回合會顯示休戰提示，並禁止攻擊你的單位與地點。

有能執行的強制攻擊時，介面顯示「強制動作 · 先移動並攻擊」，並停用結束回合；先選一個合法強制動作處理。Mask 允許移動離開其影響範圍後不攻擊；Wind Sylph 的推動可在效果視窗略過。

Sir Gareth、Slimy Mutants 與 Moon Clan Werewolf 可選手牌再點合法僕從使用能力；前兩者改變同一實體，狼人則犧牲 Mortal 後召喚新實體。複製卡會在效果視窗選擇形態，Vengeful Heir 可取消或不付額外費用；Assimilator Snail 可選雙方墓地並在下個自己的回合還原。

有 Merlin／Cradle 或公開頂牌能力時，戰場提供「牌庫頂」按鈕，依目前合法來源選擇施法；查看不會抽牌或扣費。從收藏區與墓地施法仍使用原有目標宣告、費用與取消流程。

「我的牌組」可切換將卡牌加入收藏區，上限 10 張，獨立於 Atlas／Spellbook；支援儲存與官方 JSON 的 Collection 區段。只有指定效果可以取用收藏區卡牌，施放費用及元素門檻仍需支付。

官方原表的 36／16 只在完整副本與 Avatar 匹配時有效。修改後可按「轉為自組牌」，回到普通 60／30 檢查。逐副缺口與來源見 data/beta-precon-progress.json。

進度見 [docs/PROJECT_PROGRESS.md](docs/PROJECT_PROGRESS.md)，缺口見 [docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md)。

## 測試

使用同一個 Live Server 開啟 [tests/index.html](tests/index.html)：純瀏覽器測試，不需要 Node.js。介面整合測試為 [tests/ui.html](tests/ui.html)，會在同來源的 iframe 中建立種子 42 的測試對局並寫入測試牌組，請使用獨立瀏覽器測試資料。

目前狀態測試 1708／0；桌面與窄螢幕各 11／0。新增效果介面測試為 [tests/ui-extended.html](tests/ui-extended.html)，283／0，會重設同來源測試存檔，並固定測試卡面為英文以驗證既有卡名斷言。每種測試皆檢查結算後狀態或實際介面結果；測試通過不等同完整官方規則驗證。

`tools/` 僅為本次開發使用的選用驗證工具，不是遊戲啟動需求；不需要執行它們。無 package.json、npm 套件或伺服器端遊戲邏輯。

## 資料與權利

規則與卡牌資料出自 Sorcery 官方公開 API 與 Codex；詳見 [docs/RULE_SOURCES.md](docs/RULE_SOURCES.md)。原始快照保留於 data/official-cards.json。沒有使用官方美術，卡牌以 CSS 顏色與文字呈現。本專案為非官方實作；Sorcery 及相關名稱為 Erik’s Curiosa Limited 所有。















