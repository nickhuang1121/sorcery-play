# Pallid 核心與來源消費進度

2026-10-30。正式 `finalArtifactDefinitions.the_pallid_bust` 已註冊實際 Genesis，`finalArtifactPending` 不再含此卡。卡可真正從手牌施放、支付費用、選 bearer、選實際墓地 Minion、將該實體送至原 physical owner 的 banished，之後由裝備提供來源能力。**兩項已識別邊界補丁均由 root 套入，最新正式共享工作區 16 檔交叉測試 288/288 通過；Root 已於 17:04 確認完整回歸 1264/1264，原 101 卡 checkpoint 為 94 完整／7 部分／0 未開始；Pallid 接受為核心完成。registry 本身不是完成證明。**

## 最後兩項邊界：已套入並驗證

| 消費入口 | 現況 | 套入與正式證據 |
|---|---|---|
| Hollow One 的醒來生命週期 | 基本 source trigger 與 grant generation 均完成；真正掉落後重裝重開 lifetime condition，拒絕舊 queued wake | Root 已套 `/tmp/build-hollow-wake-lifetime.py`；正式 `pallid-hollow.test.js` 4/4，保留穩定 permission／once key，不重設 `usedAbilities` |
| Can't be Disabled 的兩個衍生邊界 | 核心與 Dream-Quest guard 均完成；已移除錯誤 native Immobile 豁免，沒有將它擴散到 gained | Root 已套 `/tmp/build-cannot-disable-boundaries.py`；正式 `cannot-disable-boundaries.test.js` 真施放 2/2：native／Pallid Talus 均可被 Entangle Terrain 變 Immobile、不能 step 但可原地 attack；Dream-Quest 不產 sleep/search |

## 已完成的具體補漏

- **Hollow death trigger**：原先 own condition 已讀完整來源，death listener 卻仍讀 native slug。已改逐 source instance 醒來，保持 native 舊存檔 `awakenedByDeath` 相容。正式 `tests/pallid-hollow.test.js` 4 項含 lifetime／queued continuation。
- **Pale Worm Site Ward**：單位 Ward 已由來源消費，Site Ward 遺留 native 分支。正式 `tests/pallid-site-ward.test.js` 1 項，驗證 bearer silence、真正 Unit／Site 標記移除及 detach 停止。
- **Tabula 與較早防改來源**：`prepareFinalArtifacts` 改以 fresh source plan 與 artifact timestamp 判定，避免較晚 Tabula 誤刪較早 Monks grant，亦避免使用舊 cached guard。正式 `tests/pallid-tabula.test.js` 2 項：真手牌 Tabula、逆序與真正只放下 Pallid 後 Tabula 立即生效。
- **Gained cannot-modify／Ward exception**：正式 `tests/gained-unmodifiable.test.js` 12 項，包括實際 Genesis／handcast、transform 不產 ghost banish、damage／move／banish／sacrifice 費用仍合法、Monks 可以獲得 Ward 而 Doom 無該例外、舊未到期 power 在防改期抑制後恢復、舊效果到期不復活。Pure planner `tests/modification-layers.test.js` 5 項。

## 來源模型與判讀界線

`final-ability-layers.js` 保留每個 printed／gained source 的完整 predicate、origin、instance 與 timestamp；數值、條件與反應各由其 consumer 明確消費，不用 scalar overwrite。`modification-layers.js` 分離 intrinsic eligibility 與 effective prevention；完整來源包依 timestamp admission，來源不會因自己新授予的防改能力被刪。effect transaction 只拒絕不能適用的修改，保留 damage、tap、move、death、合法放逐與支付費用；source 消失時重新計算，不保留幽靈能力。

已有 Ward／Stealth 標記不因新增防改而被 native cleanup 清空。仍在應用的 power／type／ability-removal mod 保留原物件與到期資訊，在防改期間抑制，未到期且 source 移除後才恢復。native cleanup 與 gained 路徑分開；借用 runtime 會先 unwrap 到真正 base，避免把合併 passive 當作 native。

這些規則中的 source package 原子性、observed loss 後新 grant lifetime，以及 Tabula／Pallid 同層先後，是根據下列通用 Layer 規則的明示推導，不宣稱有每一組牌的直接 FAQ。一次原子事件中沒有觀察到失去 grant，不應因中途實作指派而自行產生新 lifetime；跨事件失去後重獲，則 lifetime condition 重新開始。permission／once-per-turn identity 不因這個 lifetime 記錄重設。

## 索引與測試證據

`final-pallid-passive-index.json` 有 **213 個 key**（原 212 scalar keys 加上 Azuridge 印刷 all-elements 的明示來源鍵）。其中需區分：完整 source consumer、隨母能力保留的 predicate、zone-only、enter-time、deck construction 與 size characteristic。分類完成不是把 realm grant 永久寫回手牌／墓地，也不代表裝上 Bust 時補發 Genesis。

原先缺少明確驗證欄位的 49 項，現在逐項加上 `source_consumer_refs`、`verification_level`。標成 **consumer-read audit plus grouped integration** 的項目，不宣稱每個 key 都有獨立逐卡測試。Combat 的 54 keys／49 true family cases，Spatial 的最新 39 case，以及 Units 的最新 180 suite，使用各 owner 的 coverage 文件交叉索引。`final-pallid-raw-read-audit.md` 另外列出 native raw reads 的用途與已找到的實際缺口，不能只靠 pending=0 判定完成。

已確認的工作區回歸：`/tmp/pallid-production-cross.log` **279/279**（註冊後 12 檔快照）；其後 Tabula 2 項與 artifacts 26 項聯測 **28/28**。最新逐入口補漏的正式共享工作區 16 檔聯測 `/tmp/pallid-final-consumer-cross.log` **288/288**；完整專案安全節點由 root 統一執行與發佈。隔離快照 204／131 等舊數字不再當作最新證據。

## 官方來源

- [Layer system](https://sorcerytcg.com/codex/aa624e74-7c3e-4622-8471-03e05b576c52)，revision `sCsVuWNRk1Hpwwlimdk9WX`：層、timestamp、條件 dependency、授予／移除要先於被影響能力、已套用效果不能移除自己。
- [Can't be Modified](https://sorcerytcg.com/codex/5b78b0b7-6d27-421b-898e-cc69bd33771b)，revision `BM1x6eCNlY51NBLMjggue9`：不能 gain／lose abilities、改 characteristics 或施加 status。
- [Immobile](https://sorcerytcg.com/codex/7db6da14-a5eb-4dcf-8b3b-4ba4e3ecfbeb)，revision `7dbbsPJQJngj2t3aDQ7M6n`：禁止 steps，仍可原地 attack／defend／strike；不是 Disabled。
- [Self-name](https://sorcerytcg.com/codex/d123e994-d95f-4fa9-9f2d-3a3e31fe95af)：取得他卡印刷自名能力時，以新 bearer 名稱理解。
- [Ward](https://sorcerytcg.com/codex/ae9b6774-aa8f-45c5-a424-d6d7e58014c3)：中途獲得 printed Ward 不會憑空重建入場標記。
- [Subtypes](https://sorcerytcg.com/codex/951f9481-d26e-4c81-9a4f-168863efc22e)、[Evil](https://sorcerytcg.com/codex/400bbb94-8877-4eea-ad2d-bd466aee2622)、[Royalty](https://sorcerytcg.com/codex/d270ecb2-9ddc-4de7-aa54-c57215be04d5)：Azuridge 的 17 creature types，不額外授予 Artifact subtypes 或 name-derived Knight／Royalty；native Automaton 保留。

官方 SSR 索引保存在 `/tmp/sorcery-official-embedded-docs.json`，文件只保留摘要、ID／revision 與連結，不複製整篇 Codex。

## 原 101 核心接受節點

Parent 於 2026-10-30 17:04 確認全專案 **1264/1264** 通過並接受 Pallid 核心完成；這與本 agent 的 288-case 交叉測試是不同證據。後續全卡庫 Artifact129 稽核另存 `data/all-cards-audit/artifacts.json`，不回溯把未測的瀏覽器 UI 或所有組合宣稱完成。
