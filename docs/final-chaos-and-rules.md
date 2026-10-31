# 最後 101 張：Chaoswish 與未核特殊裁定

查核日：2026-10-30。這份文件區分已實作核心、尚未開放與來源不足，不把候選解讀當官方答案。

## Chaoswish：一般流程正式開放，保留全 pool 未支援結果限制

模組 `src/final-chaos.js`，測試 `tests/final-chaos.test.js`。`node --test tests/final-chaos.test.js`：**25 項全部通過**（包含 Bureau、對手回合宣告與正式 Kythera 重複）。`finalChaosDefinitions.chaoswish` 已正式註冊，`experimentalFinalChaosDefinitions` 為空；測試沒有注入 definition。整體仍列部分支援，不能把正常流程正式開放宣稱為全 pool 所有效果皆完整。

目前流程：

1. 玩家先選己方合法Spellcaster及所在layer，再進行隨機結果，不能看完牌再換caster。
2. pool保留本地官方快照所有Spell，不按 `playable` 過濾，也不把runtime變體加入pool；結果使用引擎 `rollIndex`，接受Black Cat／Kythera等既有隨機決策。
3. 支援的結果交給 `final-avatars.js` 共用virtual-copy permit，綁定已選caster，免費且忽略threshold。原手牌、牌庫與墓地不被挪用。permanent copy為tokenCopy，Magic copy結算放逐，不能進墓地。
4. 沒有合法施放方式時，不施放該牌，仍繼續給下一玩家選是否複製Chaoswish。下一玩家先選caster，再抽自己的隨機結果。建立Chaoswish法術複本與重新cast實體Chaoswish分開，不捏造額外施放事件。
5. 抽到尚未實作的效果時，保留同一個結果與已選caster，建立manual暫停；只有「完成該卡後重試同張」操作，不提供重抽或把未實作冒充無合法target。

**未完成限制**：完整 pool 保留 852 個官方 Spell；目前未開放的實際結果為 Book of Blessings、Magellan Globe。若抽到這些牌就固定暫停，不藉縮小 pool 或重抽改變機率。Kythera指定有限重複次數流程已實作並逐次驗證；其餘pool中未實作結果仍會明確暫停，不能宣稱所有隨機效果皆完整。官方隨機產生器的跨版本pool尚未逐項比對，本機pool明確以保留的官方快照為準。

測試另驗證免費Craterize不要求棄地點、實際摧毀與grid damage；免費 Demonic Contract不支付life／祭品且實際搜尋；free X只可0；共同token grant不收取虛構Bureau存取費。

## 已解除的舊問題

- The Flood 的「含 void」子句已由 Great Old One 同措辭 FAQ 直接解釋：所有現有及未來地點整場 Flooded，不創造虛擬地點。已正式實作並完成 22 項真測，見 [final-flood.md](final-flood.md)。
- Holy Nova 的 site Ward 中心已由 Ally（直接點名本卡）、Location／Here／Ward 通則合併推導並接受上下層擇一；大型與動畫 Aura 亦以實際位置選中心。不是 Holy Nova 專屬 FAQ 的直接下層裁定。已完成 8 項真測，來源及版本見 [final-rules-open-questions.md](final-rules-open-questions.md)。

## The Immortal Throne：同時雙方達成勝利

精確問題：單一同時事件使雙方各自的Avatar，在不同8+level Throne所在location獨處（例如同時Swap相關物件），誰勝？候選為和局、主動玩家先判、依另種事件優先序判，但沒有直接來源可確認。

已核 [Winning the Game Codex](https://sorcerytcg.com/codex/48bee2d2-6d32-466f-b4fe-6c3178cb6ba4)，沒有一般雙方同勝條。另查到 [Death Blow Codex](https://sorcerytcg.com/codex/2cffd099-b5f5-4af6-9ce9-966ac6d1306c)：雙Avatar同時受death blow時為和局，並另提部分賽事改為忽略同時death blow。這是**death blow專條**，不能直接冒稱雙Throne同時win也適用。現有 `SIMULTANEOUS_THRONE_WIN` 明確拒絕／回滾保留，未任選勝者。

## 其他仍存的具體缺口

- Snowball 大型重疊計數已依 Carrying Units 通則解除，一般流程正式開放。仍缺同區域 Globe 閉環的結算裁定，明確 guard／回滾，不能自行停止或傷害；見 [final-waves.md](final-waves.md)。
- Demonic Contract的Gem／Rune與圖像型accord分類：見 `docs/final-effects.md`。已正式提供human-confirmed-classification工作流程，life4、名牌與Mortal自動驗證；未知分類由人類確認，非自動分類完整。

## Chaoswish官方來源

- [Chaoswish 卡面與九FAQ](https://sorcerytcg.com/cards/chaoswish)：先選caster、copy不取自任何實體區、token離場放逐、無合法cast仍下一玩家、免費免額外代價、Kythera重複次數。
- [Copy Codex](https://sorcerytcg.com/codex/88663410-ac07-4dd6-b2fe-fbecbadf232a)：建立Magic copy為token、結算後放逐，建立者控制Chaoswish copy。
- [For Free Codex](https://sorcerytcg.com/codex/6c4c8d4d-e954-4018-bc7b-e32b85a6829b)：免費不支付mana或其他額外代價，自選X為0。
- [Archimago 第五FAQ](https://sorcerytcg.com/cards/archimago)：Dodge Roll／Valor不能在普通main-phase空放，不能靠free或copy繞過合法反應時機。反應模組已依此直接來源限制。

## Kythera 有限重複流程（核心已完成）

當實際隨機控制者為 Kythera 並選到 Chaoswish，先宣告**額外**施放 N 次（不含已施放原卡）；可選快捷數字或逐位輸入任一可安全表示的正整數。這是有限宣告，不接受無限值。每一次都透過 `final-avatars` 的同一個 copy permit 真正 `beginCast`／commit，記錄實際 caster 的 uid、layer 與完整 geometry location；沒有用增加計數器假冒 N 次效果。

每次實際施放仍觸發 Ring of Morrigan、正常 cast count、token banish 與其他既有流程。正常完成 N 次額外複本後，對手取得 N+1 次機會（包括原卡本來的一次）；一次不複製不會吞掉剩餘父層機會。若施法者死亡使 Magic 正常不結算，只保留實際已結算法術產生的機會，不偽造未結算的次數。

`finalChaosSpellSource` 只對已被共同 casting helper 消耗的 Chaoswish permit 計一次；`finalChaosRepeats` 保存 requested／remaining／performed／每次實際 cast／中斷原因。32 次後建立可存檔的繼續檢查點，避免一個 dispatch 超過既有循環上限；下一步只執行剩餘次數。完整狀態重播測試比較兩份 restore 的結果相同。

`randomDecisionController` 保留既有最近進場 passive 優先規則，回傳實際決定者與來源。每一擲重新驗證該 Kythera 仍是控制來源；宣告授權只對同一 source/player 有效。Kythera 失效或被較新的 Black Cat 覆蓋時，回到當時真正控制者的選擇，不沿用舊結果。既有 `rolls` 的重播結果優先，不能因重載重抽。對手持 Kythera 可決定隨機重複數，但每次施法者仍由正在施放的玩家選擇，不奪取其合法決策。

25 項 production 測試包含：N=3 的完整真 cast/token/對手機會、十進位 12 與存檔、Black Cat 每個 nested roll、對手 Kythera 權限、Ring 殺獨立 bearer 改變控制、每一次 Ring 效果、33 次批次的第32次檢查點與精確續接、caster 本人死亡的正常不結算，以及最終未支援結果的固定 retry。一般 UI 已能呈現這些 serializable choices，不需要用外部隨機或人工猜結果。

官方來源另核：[Kythera 三 FAQ](https://sorcerytcg.com/cards/kythera_mechanism)，最近進場者優先，drop/pickup 不刷新時間；[Chaoswish 九 FAQ](https://sorcerytcg.com/cards/chaoswish)，有限重複宣告與對手每次機會。

## 正式部分支援的額外驗證

正式 registry 測試明確驗證沒有 experimental 注入；Book／Globe 兩個實際未支援結果各自保留原 card、已選 caster、RNG 與已付費用，JSON 後重試也不能換卡、重抽或重付。越界 option、錯誤 player、已失效的 copy target 都不能消耗 permit 或產生額外隨機結果。Self recursion 透過真正免費 Chaoswish token copy 施放，再逐層保留獨立的對手機會。Kythera 的 N 次額外真施放、每次 Ring 觸發、N+1 次機會、32 次檢查點與資源費用斷言均在正式註冊下通過。

目前限制是 full pool 的具體未支援結果，**不是 Kythera 重複機制尚未實作**。未來若其他抽中卡牌遇到其精確未支援邊界，同樣必須明確停止，不能重新抽取別張代替。
