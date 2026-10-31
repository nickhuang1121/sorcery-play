# 最後 101 張：建造、城市戰鬥與地點變動

範圍：The Base of Babel、The Apex of Babel、Free City、Vindictive Nation、Rift Valley。模組：`src/final-built-sites.js`；正式流程測試：`tests/final-built-sites.test.js`。

此檔是實作／驗證紀錄，不宣稱全卡交互已完成。尚未通過的整合不得只因加入 playable 綁定就列完成。

## 官方核對（2026-10-30，CUA 背景瀏覽器）

- [Base](https://sorcerytcg.com/cards/the_base_of_babel) 與 [Apex](https://sorcerytcg.com/cards/the_apex_of_babel) 各 1 FAQ：Apex 可打在 Base 同格，兩者合成**單一** The Tower of Babel。提供 **2 法力、1 earth、1 air**，同時為 Exceptional 與 Unique。摧毀時兩張實體卡均去墓地。Mirror Realm 複製後同樣提供 2 法力等特性，但不再次觸發建塔抽牌／免費施放。
- [Free City](https://sorcerytcg.com/cards/free_city)，8 FAQs：作為 **3 力量**單位攻守，但始終是 Site。受到 Strike 傷害使操控者失去等量生命，城市不因傷害死亡。只可己方回合攻擊，每回合攻擊或防禦合計一次，不需橫置，進場當回合即可攻。可以打同格地下單位；沒有 Airborne、Ranged 或 Truesight，因此不能攻擊 Airborne／Stealth。攻擊仍有普通宣告防禦流程。多格敵軍若在另一格發動攻擊，城市不能只因敵軍占有城市格就為別格攻擊防禦。
- [Vindictive Nation](https://sorcerytcg.com/cards/vindictive_nation)，5 FAQs：移動依**移動前**的 nearby；自己被沉默或摧毀時仍觸發；Flood 屬修改；同一個 Atlantean Fate 在單一 Storyline 效果裡造成多種修改，只算一次修改。修改、移動、摧毀的生命損失分別是 **1／3／7**，不是傷害。
- [Rift Valley](https://sorcerytcg.com/cards/rift_valley)，9 FAQs：選有兩個相鄰地點且至少一格虛空的 row／column，一個地點不動，另一個連同該方向所有相連地點移一格，Rift 同時進入新裂縫。單一孤立地點不能拆。特殊方式可不鄰接自己的其他地點。多格單位／多格 aura 不跟地點移動。Rift 的進場方式先適用，再受到 Atlantean Fate／Smokestacks 影響。Pathfinder 與 Mirror Realm 也可使用這種進場方式，但仍需各自的合法目標條件。

## 實作位置

| 卡牌 | 模組實際邏輯 | 主要驗證 |
| --- | --- | --- |
| The Base of Babel | `babelTargets` 授權在有效友方 Base 上打 Apex；`commitBuiltBabel` 保留兩張實體卡的身分與擁有者 | 合併、敵方／沉默 Base 拒絕、存檔復原 |
| The Apex of Babel | `registerBuiltSiteCards` 建立固定 Tower runtime card；`builtBabelBonus` 抽牌後 `builtBabelCast` 使用正式免費施放流程，保留門檻與目標合法性 | 2 法力／雙門檻／雙稀有度、免費施放、單獨 Apex 無 build bonus、Mirror 複製、不重複 bonus |
| Free City | `freeCityProxy` 是僅供戰鬥查詢的虛擬參戰者；城市一直留在 board、不進入 units；`cityAttackActions`／`cityDefendActions`／`commitCityAction` 以普通戰鬥窗口結算，消耗同一每回合使用標記 | 防禦窗口、地下、Airborne／Stealth 拒絕、傷害轉失去生命、不因傷害死、多格敵軍他格攻擊拒絕、存檔 |
| Vindictive Nation | `captureVindictiveSites` 觀察效果前地點、`detectVindictiveChanges` 檢查實際修改／位移、`triggerVindictiveSiteEvent` 在真正摧毀通過保護檢查後記錄事件；`builtVindictive` 結算失去生命 | 對手／己方、1／3／7、自毀及自沉默、被 Ward 預防、原始 nearby、單一 Fate 效果只一次 |
| Rift Valley | `riftPlans` 生成完整相連位移方案並檢驗投影版圖；`applyRiftPlan` 同時搬地點與正常大小承載物；`builtRiftChoose` 在支付／出牌前宣告或取消 | 同時開縫／進場、普通承載物、多格不跟、非鄰接、孤立地點／沒有虛空／不可移動地點拒絕、存檔中的宣告、取消無支出 |

## 共用整合與後續審核

四份精確 unified diff 由 `/tmp/build-site-integration-patches.py` 讀取當下原稿產生，只輸出 `/tmp/final-built-sites-{babel,rift,city,vindictive}.patch`，不直接改共用檔案。root 依序套用並測試。

- Babel 的 runtime card 與其 silence／disabled／fate／sinterfee／Horns mask 需在 `cards.install` 預註冊，才能在新頁面讀取存檔。普通 site mana 讀 `providesMana`，不能把整格 multiplier 改成 2，否則門檻也會錯誤翻倍。
- 所有 Site 離場／變形入口應保留 `babelParts`；`sendBuiltSite` 才能在真 Tower 離場時送兩張，在 Mirror Tower 離場時只送實際 Mirror 一張。單純 `sendCard(site.card)` 會把 runtime card 錯誤放進私人區域。
- 多稀有度以 `hasSiteRarity` 判斷，不能僅設 rarity=Unique 就遺漏 Exceptional 效果。
- Free City 不能做成普通 Minion。虛擬參戰者的受傷入口要走 `damageSite`，並保留同一次同時傷害窗口的 site Ward。
- Rift 的目標擴充應放在 unrestricted placement 層，再通過外層 Edge of the World／幾何檢驗；不能在外層提前 return 而繞過其他地點限制。Pathfinder Atlas 源與 Mirror 複製選擇必須沿用正式 site source codec。
- Vindictive 的觀察應在效果與連續效果已重算後比對；不能每次刷新都重複觸發持續修改。摧毀事件需區別 banish、return 與 Ward／不可摧毀造成的失敗。

## 明確驗收限制

Rift 的手牌進場／位移，以及 Pathfinder Atlas 真實來源與 Mirror Realm 特殊進場已加入正式 dispatch 測試；Mirror 的有效複製來源在位移後仍需鄰近。Edge 的投影版圖限制也有拒絕案例，沒有繞過幾何 guard。

Vindictive 的單次效果觀察可涵蓋已支援的修改、位移與自我沉默。若其他來源改變的是沒有穩定事件資料的衍生站點特性，仍需補來源歸屬；特別是被動來源的移除與非對手造成的回合到期清理，不能只靠任意狀態差異宣稱全數正確。Ward 自行預防消耗已由明確 `noteBuiltWardConsumed` 事件排除；敵方直接移除 Ward 仍屬修改。直接 action 進場的持續沉默也在首次 stateBased 後、Storyline drain 前觀察，因此不會漏掉 Atlantean Fate 的單次修改。

可重現指令：`node --test tests/final-built-sites.test.js`，2026-10-30 實測 **20 通過、0 失敗**。`npm test` 已執行，但同時整合的新 Bureau／Archimago／Dame 測試有 scope 選擇失敗，由該共用整合負責人處理；本檔不宣稱該次全套通過。最終數字以 root 最後重跑為準。

### Babel 實體半張與 Kairos

每張 Base/Apex 保留獨立 physicalUid、printed descriptor 與 owner；合體不把兩張實體變成單張。`builtSitePhysicalParts`、`tagBuiltSiteParts`、`restoreBuiltSiteState`、`detachBuiltSiteParts` 供 Kairos archive/return 使用。兩半皆 eligible 時回復原 Tower；只一半 eligible 時回復該 printed Site，不能復活已 banished 的另一半。這個單半回復是根據合體需要兩張、Apex 本身可作為單獨 Site 的明示推導，並非 Babel FAQ 的直接 partial-return 特例。新形成且未被 archive 的另一半保留為不同 UID，避免複製實體。

純 helper 與實際 physical tag 測試在 `tests/final-built-site-lineage.test.js`；Kairos owner 另以真 Apex build、Sinkhole、Ferryman Coin、Rift Valley dispatch 驗證完整／部分回復與新半分離。Horns 轉成 Minion 的單半回復會從剩下的 printed Site 重建 Demon form，避免保留 Tower 的幽靈雙 rarity、雙 mana 與雙元素。
