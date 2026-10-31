# Cradle of Etherrum：兩個既有疑點的來源核查

核查日期：2026-10-30 UTC。16場67307於20:57:03Z完整通過後，依root穩定窗口指示新增本批專屬正式回歸與本文件；未改runtime、既有tests、JSON、官方snapshot，也沒有啟動服務或打擾睡覺使用者。root的16場67307不重啟、不干預。

## 1. De Vermis的5費仍受Cradle減1：可確定，不需玩家裁定

- [Cost Codex](https://sorcerytcg.com/codex/a6a73d30-6b05-4402-b148-9eeaf88b4d0b)，ID `a6a73d30-6b05-4402-b148-9eeaf88b4d0b`，metadata更新2025-12-19T20:48:04Z。本輪web重新讀取成功，與快取文字一致。流程明確把De Vermis的5費當作起算費用，接著加additional costs、加cost increases、最後扣cost reductions。關鍵短句："Subtract anything that reduces cost." 因此Cradle的1費減免沒有被5費覆蓋。
- De Vermis FAQ `47f25e59-0217-4f1e-867c-79d597c72aa6`，metadata更新2025-12-20T06:23:17Z，cards slug精確匹配de_vermis_mysteriis。問題是能否修改5費，回答Yes並以Philosopher's Stone和Harbinger可降到3為例。此為直接card FAQ，非推論家規。
- Cradle FAQ `8tvTxoeHx528yc6gES8Mpc`，metadata更新2025-08-01T20:19:05Z：仍須main phase、own site、正常threshold與summoning requirements，只是從spellbook頂施放且少1費。De Vermis另有明文忽略threshold，因此兩者並用時仍應從5減到4。
- Cradle另一FAQ `8tvTxoeHx528yc6gES8Mds`，metadata更新2025-08-01T20:19:04Z：看top spell的permission包含自己Start/End，本輪未以它替代實際cast效果驗證。

原生測試（`tests/catalog-cradle-boundaries.test.js`）：

1. 正控制：真conjure Cradle2費至Avatar17持有，top Ancient Dragon印刷7費，native top cast只能17，JSON後真付6、spellbook physical card移除、Dragon於17進場；通過。
2. 真conjure Cradle與De Vermis3費同Avatar，手牌外spellbook頂Ancient Dragon，取消所有bonus affinity以證明normal threshold仍不允許；Vermis選項合法忽略threshold；實際dispatch付5，應4：**確認紅測**。
3. 同場available mana4，應有合法top/Cradle/Vermis cast，但目前沒有：**確認紅測**。

缺陷位置：`src/engine.js` castingCost的adjacentDiscount中 `origin?.top?.kind==='cradle'&&payment!=='vermis'?1:0`。排除vermis與以上Cost Codex及直接De Vermis FAQ不符。root應統一修補，不需等待使用者裁定。

## 2. Azuridge在spellbook是否是Dragon：一般通則可支持排除，明確標為有據推論

本輪沒有找到直接回答Azuridge-off-realm的卡牌FAQ，不把下述推論寫成該牌官方專用裁定。

- [Special Ability Codex](https://sorcerytcg.com/codex/f2bd2f7d-0032-4929-b18d-5c9793f09e99)，ID `f2bd2f7d-0032-4929-b18d-5c9793f09e99`，更新2025-06-29T05:49:53Z；本輪web重讀成功。text box文字屬special ability。
- [Ability Codex](https://sorcerytcg.com/codex/b59ebea2-8981-49ef-bb6f-770cafa22876)，更新2025-07-10T03:24:14Z；快取實際文字區別abilities與characteristics。
- [Characteristics Codex](https://sorcerytcg.com/codex/30561063-e0e1-41f7-9ab2-903475629dde)，更新2026-07-20T21:40:54Z，本輪web重讀成功。Minion subtype是characteristic；移除能力不會抹掉本來印在card上的characteristic。
- [Passive Ability Codex](https://sorcerytcg.com/codex/ac7557f6-356c-475f-8b0f-2e14abbb0ec6)，更新2025-06-29T06:17:15Z；本輪web重讀成功。passive只在relevant zone生效，"Typically this zone will be the realm"，其他zone的例子是卡文特別說在hand/cemetery。October2026 Rulebook印刷p27「Passive Ability」（本機txt行915起）也有同樣通則。
- Azuridge卡文是"Has all elements and minion types."，現有snapshot印刷type line為"An Ordinary convoy of diverse kin and kind"，沒有印刷Dragon subtype；展開的17個subtypes來自該ability，不能把資料庫扁平化衍生標籤直接當印刷characteristics。
- 相關Azuridge FAQ `937cc4a1-9c28-480b-a030-77e12ea97f9c`（2026-02-09T18:38:51Z）只談realm中的Caravan與The Flood，不涵蓋spellbook。這不能冒充off-realm例外來源。

**有據推論**：Caravan的所有type是無額外zone例外的passive，採用一般realm相關zone，故尚在spellbook時不藉該ability取得Dragon；應不能單靠Cradle cast。這與印刷為Dragon的Ancient Dragon（characteristic）在spellbook可用Cradle是不同情況。此處不是新增玩家家規，是按既有規則分類與預設zone處理；但保留「沒有直接Azuridge-off-realm FAQ」的證據強度限制，若日後官方增補zone例外須改。

原生負／正控制：

4. Cradle真conjure後top Caravan，應沒有native Cradle cast，目前卻有：**與上述有據推論不符的紅測**。下一個true Dragon正控制另在第1項已通過，不靠helper。
5. 正常hand cast Caravan付5、JSON後真進realm，公開unitTypes包含Dragon：通過，證明沒有把其realm內ability一起刪掉。

注意一般修補範圍：`topCastEntries`透過cardForPlayer看raw展開subtypes；現在`printedMinionTypes`已對Caravan回[]以區分realm內gained types，但off-realm contextualCard仍用snapshot展開subtypes。root需選合適共同規則修補點，避免只在Cradle寫特判而讓其他off-realm Dragon/Evil判定不一致。本子代理不改引擎。

## 命令與實際結果

`node --test tests/catalog-cradle-boundaries.test.js > /tmp/audit-cradle-boundaries-before.log 2>&1`

5項2過3失敗、0skip、exit1。兩個成本紅測為直接Codex+FAQ確認缺陷；off-realm紅測基於明確標示的一般規則推論。未排除紅測稱全綠，未改斷言遷就現況。

來源刷新限制：本輪三個card頁Azuridge/Cradle/DeVermis皆web InternalError；以上原文取自已保留的官方embedded docs快取和既有官方snapshot，Cost/Passive/SpecialAbility/Characteristics Codex本輪可重新讀取。UI本輪沒有驗證。


正式整合時另補兩個Doomsday Cult原生邊界：真cast Cult後，spellbook Azuridge不得僅因raw展開Demon/Undead而被當Evil施放（同一passive zone推論，沒有直接該牌off-realm FAQ）；正控制真正印刷Undead Ghoul可從top cast here、真付3、移除physical top並進場。這部分維持公共type／Evil分類的一致性，root會在共同contextualCard處修補，不寫Cradle特判、不調未核all-elements。

正式before結果：2026-10-30 20:59 UTC，`node --test tests/catalog-cradle-boundaries.test.js > /tmp/catalog-cradle-boundaries-formal-before.log 2>&1`，7項3過4紅、exit1、0skip。通過三個正控制：printed Dragon正常Cradle施放、Azuridge正常hand進realm後Dragon類型、printed Undead Ghoul真Cult top施放。四紅為兩成本（直接Cost/FAQ確認）與兩off-realm分類（按明示一般zone規則推論）。正式檔已穩定，後續runtime及full由root統一整合；不排除紅測稱完整全綠。


補generic realm邊界並於root共用修補後驗證：新增第8項真正handcast Caravan進realm時有Dragon/Undead/Evil，真正施放Silence Aura後經JSON恢復，公開unitTypes不再含Dragon/Undead，unitUmbrellas不再Evil；印刷Fire threshold仍1。不對all-elements frame作新結論。`node --test tests/catalog-cradle-boundaries.test.js`最新8/8通過、exit0、0skip，log `/tmp/catalog-cradle-boundaries-after.log`（原執行檔名before2但內容已是root修補後8/8，特另保存after名稱防混淆）。之前7項3/7紅測證據仍保存不覆蓋。這是本批subset，不稱fullrun。

## Root integrated result

Root fixed shared contextualCardTypes to use existing printedMinionTypes and discard API-derived Caravan Evil outside realm; live realm ability adds types/Evil normally and true Silence removes them. All-elements identity/frame not changed. Cradle minus1 now applies to Vermis5. Native8/8, shared types214/214, Dragonlord+Cradle40/40. First full2210:2209passed1failed because an old Caelestis free-Dragon test used Caravan as an Ordinary Dragon while in hand. Exact prior file and failed TAP preserved; test now uses real printed Wyvern, plus a strict additional Caravan5+MockCourt1 (total9 with activation3) negative control, gift remains until a later true Dragon consumes it. No effect assertions weakened; source-derived classification corrected. Full2211 rerun running.

Actual5500 full app UI also verified only4 mana/noFire threshold permits top AncientDragon through Vermis5 minusCradle1; Dragon appears atC1, mana becomes0 and physical top disappears. See ui-5500-validation.json. Browser original save restored; user not contacted.
