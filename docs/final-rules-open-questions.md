# 最後 101 張：兩項規則問題的完整快照重查

查核日期：2026-10-30。唯讀重查主代理提供的官方公開 SSR 快照：216 個 Codex 項目（內含 69 個 subcodex）、753 個 FAQ。內部來源為 `/tmp/sorcery-official-embedded-docs.json`；以下記錄各項官方 ID、版本與可重查 URL，不把快照全量複製到專案。

本文區分直接條文、通則推導與仍缺裁定。初次重查為唯讀；主代理隨後接受 Holy Nova 的通則推導並另授權修改其專段。其他原始文件與正式註冊狀態未在此任務改寫。

## Holy Nova：Site 的 Ward 能否把中心放在地下／水下？

卡文允許打破 allied Ward，改以該 location 為中心。現有實作 `src/final-grids.js:holyWards` 只為 site Ward 提供 surface；問題是能否也選該 site 的 subsurface。這不是「同時傷上下層」：Damage Grid 仍只影響所選中心所在 region。

已查的直接來源：

| 官方來源 | ID／版本 | 確認內容與適用範圍 |
| --- | --- | --- |
| [Holy Nova](https://sorcerytcg.com/cards/holy_nova) | 現行卡文；753 FAQ 快照中無本卡專屬 FAQ | 改中心以 allied Ward 的位置為依據；沒有 surface 限定 |
| [Ally](https://sorcerytcg.com/codex/040cd91a-60f2-4a12-bebc-b9bf482b9877) | 2025-12-05T17:31:08Z | 特別以 Holy Nova 為例，解釋 allied Ward 是己方控制卡牌上的 Ward，明確不只限 units |
| [Ward](https://sorcerytcg.com/codex/ae9b6774-aa8f-45c5-a424-d6d7e58014c3) | 2026-10-12T21:55:51Z | mark 屬於 unit 或 site；site Ward 也保護該 site 的 location 被指定，沒有只保護 surface 的條件；效果可消耗該 mark |
| [Location](https://sorcerytcg.com/codex/1c06ae66-10a5-4c5a-96bc-21bdcfbd2999) | 2025-06-17T21:21:33Z | site square 有 surface、subsurface 兩個不同 locations |
| [Here](https://sorcerytcg.com/codex/8e4684e4-479b-45d1-a75b-a41568ea6e6f) | 2026-09-02T01:46:24Z | site 自身的 here 涵蓋上下兩個 locations；there 同義。這解釋 site 的位置範圍，但不是 Holy Nova 專屬裁定 |
| [Its Location](https://sorcerytcg.com/codex/45bd7032-958b-46e5-9d23-d7fc606633e7) | 2025-06-17T19:40:55Z | 列出 minion／artifact／aura／avatar 的目前位置，沒有為 site 指定唯一 surface 位置 |
| [Damage Grid](https://sorcerytcg.com/codex/015d636e-716c-450e-9e17-abef557f3e4c) | 2026-05-19T18:39:46Z | 依 origin 的 region 處理圖案；圖案本身不等同指定所有 locations |
| [Target](https://sorcerytcg.com/codex/98943611-2a6f-4756-ad9b-a7d6598e9729) | 2026-03-25T19:20:12Z | 指定須有 target 用語；不可把 target 的同 region 要求直接加到本卡未指定的 Ward 選擇 |

建議採用的**通則推導**：Ally 已明確允許己方 site 上的 Ward；該 site 有上下兩個 locations，且 Ward 沒有 surface 限定。因此可讓操控者從該 site 的兩個 locations 中選一個作中心，打破同一個 Ward mark 一次。這不是宣稱 Holy Nova FAQ 直接寫明地下中心，而是上述條文的合併解讀。目前只提供 surface 的額外限制，在已查來源中找不到依據。

推導中仍需明說的一步：卡文使用單數 location，但沒有專門敘述「site 有兩個位置時如何選」。將它實作為擇一，而不是把效果同時複製到兩層，符合單一中心和 Damage Grid 的同 region 規定。若主代理採用這項解讀，應記錄為 general-rule-derived，而非 card-specific-FAQ。

主代理已接受以上 general-rule-derived 解讀。已完成 patch：`holyWards` 對每個有 Ward 的 allied site 產生 surface、below 各一個選項；選定時重新驗證實體 site 的 UID、己方控制與 mark，消耗 mark 一次。單位則以實際 physical locations 產生選項，包含大型、跨層及動畫 Aura minion。

`tests/final-holy-locations.test.js` 的 8 項真 dispatch 測試已驗證：地下中心只傷 underground；水下中心只傷 underwater；保留地表選項；序列化續接、mark 移除及 site 被另一實體取代時的重驗；大型及跨層單位依實際位置選中心；動畫 Aura 的四格均可選、普通非 unit Aura 不可；跨層 enemy 只累計同 region 的實際位置。每次只有一個中心，沒有將效果複製到上下兩層。Holy、原 grids、animation、geometry 四組交叉回歸 **168/168 通過**。

## The Immortal Throne：同一事件令雙方同時滿足勝利條件

精確問題：存在兩個 level 8+ 的 Throne。某一個同時事件完成後，兩方 Avatar 分別在不同 Throne 的 location，而且各該 location 都沒有其他 unit。兩方都滿足印刷勝利條件。問：平局、某方優先獲勝，或其他處置？問題不涉及一般單方升級、單方走上王座、尚有 dying unit 或一般 draw split。

已查的直接來源：

| 官方來源 | ID／版本 | 能確認什麼；為何尚不能決定雙勝 |
| --- | --- | --- |
| [The Immortal Throne](https://sorcerytcg.com/cards/the_immortal_throne) | FAQ `FWsVZ4rxgHCtjTP73mTtTc`，2025-02-20T23:04:25Z | alone 指同 location 沒有其他 units；沒有雙勝規則 |
| 同卡 FAQ | `FWsVZ4rxgHCtjTP73mTtso`，2025-02-20T23:04:25Z | play 包含零費 site 與施法；與雙勝排序無關 |
| 同卡 FAQ | `ygoDG8fb7HS97qCW69htj8`，2025-02-20T23:04:25Z | 依印刷 cost；與雙勝排序無關 |
| 同卡 FAQ | `ygoDG8fb7HS97qCW69kaCv`，2025-12-21T06:38:56Z | Alpha foil 誤印與賽事合法性；沒有雙勝規則 |
| [Winning the Game](https://sorcerytcg.com/codex/48bee2d2-6d32-466f-b4fe-6c3178cb6ba4) | 2025-06-30T05:48:52Z | 承認 death blow、空牌庫抽牌及其他效果能導致勝利；未定多個勝利效果同時成立的結果 |
| [Death Blow](https://sorcerytcg.com/codex/2cffd099-b5f5-4af6-9ce9-966ac6d1306c) | 2025-12-05T17:31:08Z | **直接規定同時雙方 death blow 為 draw**，另提賽事可忽略該等 blows 繼續對局。條件明確限 death blow，不能直接當所有同時勝利的一般規則 |
| [Storyline：Simultaneous Triggers](https://sorcerytcg.com/codex/081fc13c-49fb-4893-90c1-1ba5324e6241?sub=b05a5698a7f3) | 2026-05-26T02:21:31Z | 主動方先加入、非主動方先結算的是競爭上 Storyline 的 triggered events。Throne 第二段不是 when／whenever 觸發事件，不能把這項排序直接套上 |
| [Storyline：Simultaneous Effects](https://sorcerytcg.com/codex/081fc13c-49fb-4893-90c1-1ba5324e6241?sub=48346f868e2a) | 同上 | 確認多個同時效果可構成單一事件；沒有說該事件造成雙勝時的結果 |
| [Ongoing Effect](https://sorcerytcg.com/codex/e598f1a7-a876-431c-a414-33e1893cd4d8) | 2026-05-19T18:39:40Z | ongoing 於 Storyline 事件間持續套用；沒有雙勝 tie-break |
| [Layer System](https://sorcerytcg.com/codex/aa624e74-7c3e-4622-8471-03e05b576c52) | 2026-08-04T21:39:56Z | 各層及 timestamp 的規則處理 copy／types／ability removal／control／ability adding／power。沒有把即時勝利條件分配至某一層，也未說一方先檢查到勝利即可省略另一方，因此不能直接以較舊 Throne 決勝 |
| [Replacement Effect](https://sorcerytcg.com/codex/68c087c1-84f7-41f3-b44b-fb1753fce12e) | 2025-12-05T17:31:08Z | 取代事件與不使用 Storyline 的說明；Throne 勝利句未提供可套用的替代事件、玩家排序或勝負衝突規則 |

另以全部 969 個快照文件的純文字欄位（含 FAQ、subcodex）搜尋 simultaneous 與 win／lose／draw、both players／Avatars、game is a draw 等組合，回查命中的 Death Blow、Winning the Game，以及可能混淆的 Blaze of Glory FAQ（id `9890d212-c0d8-4694-a48b-a11e70fe52bc`，2026-03-25T19:15:50Z）。後者只回答己方 Avatar 有 Blaze of Glory、雙方在 Death's Door 時可致勝，不是兩個被保護 Avatar 同時滿足 Throne 勝利。

尚未能排除的候選解讀：

1. 平局：把雙 death blow 的處置類比到雙勝；但現有條文只授權 death blow 情境，缺少一般化依據。
2. 以某種優先序選出單方：可能有人引用主動／非主動方、Storyline 或 timestamp，但已查規則分別處理其他機制，沒有授權這裡採哪一種。

結論限於**本次這份官方快照與列明來源未足以裁定**，不聲稱所有官方管道都沒有答案。保留既有 `SIMULTANEOUS_THRONE_WIN` 原動作回滾是可稽核的未支援邊界；沒有把任一候選當已確認規則。需官方一般雙勝條款或直接裁定，才能改成自動平局／指定勝方並寫精確真測。
