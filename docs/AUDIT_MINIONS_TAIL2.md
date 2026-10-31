# Minion 尾段第二批六張

2026-10-30 UTC。Wraetannis Titan、Wyvern、Xeraphine Konrul、Yellow Knight、Yog-Sothoth、Yokai Kappas。正式測試 `tests/catalog-minions-tail2.test.js`；root 確認16場模擬窗口結束後才由候選轉入。本批沒有改共用 runtime 或逐卡 JSON。

## 逐卡覆蓋

六張共同：真正手牌 `legalActions`→`dispatch`，精確印刷費用、離手、實體 owner/controller/power、JSON；資源不足與每個印刷元素 threshold 不足均無合法 cast。Yog 基本場面正好五個 Void；不是覆寫 playable 或直接注入效果。

| 卡牌 | 原生操作與具體效果 | 未涵蓋限制 |
| --- | --- | --- |
| Wraetannis Titan | 真 Genesis 對 here 多個敵人各 strike6，殺2-power minion、傷強化 Brown Bears6、敵 Avatar失6 life；自己的盟友、鄰格敵人、同Square水下Drowned都不傷；Titan不受反擊。JSON保留傷害。 | 複數 strike damage prevention 選序、Ward/Lance授予、oversized here、Genesis silence/disable；本批UI未驗。 |
| Wyvern | 真 Airborne 斜向 move/attack 合法，5-power strike殺4-power Brown Bears並正常收4反擊，目的地與存活正確；真下一敵方回合地面Brown不能選Wyvern、Airborne Cloud Spirit可以選。 | 地下失Airborne、拦截／ground defend、窮盡戰鬥；本批UI未驗。 |
| Xeraphine Konrul | 真 own end 依次選三個自己的 physical grave UID，兩張同名Ghoul仍能分辨；中間兩次JSON；指定一張回手，其餘兩張banish、其他Magic墓卡與對手墓地不動。可取消；不足3自己的dead minions時不能用Magic／對手墓補足。真Freeze後own end不觸發。 | 原能力3張選完前是否可取消的完整UI契約、墓地交換／保護／代價稅及多個Konrul時序；本批UI未驗。 |
| Yellow Knight | 真Lance keyword入場獲Lance token、owner與bearer正確，split power仍3/2；真攻擊4-power Brown Bears時先strike4並殺敵，不受反擊，Lance破；真攻Site只扣3 life且Lance留場；JSON。 | 多Lance、所有first-strike/critical/overpower組合、借Lance keyword；本批UI未驗。 |
| Yog-Sothoth | 真召於Gnome Hollows：普通4-power Brown不能入、Yog可入；驗證每個Site的surface/below及各Void都有其實際location。真Silence後banish。另一場真play Site將五Void減四而banish；只有四Void時仍可真付7施放、離手並立即banish。 | 所有Site abilities與Protected範圍、借能力／轉型／特殊區域、40虛擬記錄與實際位置規則的完整UI呈現；本批UI未驗。 |
| Yokai Kappas | 真tap狀態啟動，不tap成本，選擇只允手牌Water Site，排除陸Site與Water Magic；中途JSON取消不棄牌不消耗once，再啟動真棄Pond入墓並untap，同回合不可再啟動。 | 複合Site affinity、下一回合once重置／墓地交換與所有cost-effect異常；本批UI未驗。 |

候選初版14/14、加Konrul不足3與Yog四Void邊界後16/16通過（`/tmp/audit-minions-tail2-16.log`），再加Wyvern攻擊合法性與Konrul真Freeze邊界共18項，**18/18通過，exit0、0跳過，2026-10-30 20:44 UTC**，結果見 `/tmp/audit-minions-tail2-18.log`。本批沒有已確認引擎紅測；不代表全部卡牌交互或UI完成。新增Freeze測試草稿一度預期墓地只保留原3張，遺漏實際施放的Freeze本身也入墓；已改為原3張加Freeze的嚴格預期，未改引擎或放寬印刷效果斷言。

## 來源

- `data/official-cards.json` 六張現有官方卡文快照，實讀 rules/費用/threshold/數值，未改。
- 本輪官方 [Wraetannis Titan](https://sorcerytcg.com/cards/wraetannis_titan)、[Wyvern](https://sorcerytcg.com/cards/wyvern)、[Yokai Kappas](https://sorcerytcg.com/cards/yokai_kappas) 頁面可讀，與實作卡文一致；其餘三張頁工具回 inaccessible，不能稱已刷新最新卡頁。
- 官方 October 2026 Rulebook，來源／版本指紋見 `data/final-101-official-source-index.json`。
- 官方嵌入快取 `/tmp/sorcery-official-embedded-docs.json` 實讀：
  - Yog FAQ `1402bf22-0d5d-465c-9f09-8b33dd72e0e8`（2026-10-12）：忽略Site能力按Protected。
  - Yog FAQ `16494810-a0dc-4139-8e17-712fb362ac70`（2026-02-09）：同時佔全部區域位置並安全生存。
  - Yog FAQ `07764c06-99a2-42a2-b0bb-b7fd1c63e13f`（2026-02-09）：silence/disable不縮體型，但失去Void安全會banish。
  - Protected from X `2a4648bf-d6e6-4167-ac6b-2ee30f393d86`（2026-10-12）。
  - Airborne `c7c182e2-629c-4e65-a9a0-97feff983a3d`（2025-07-10）；Here `8e4684e4-479b-45d1-a75b-a41568ea6e6f`（2026-09-02）；Strike `8bb6e5a1-6989-4ec1-98d7-ef50283cccf6`（2026-02-09）。
  - Lance `091b556c-3abc-4e42-81ab-5216cf11d9ed`（2026-10-12）：進場Lance token，下次對units +1先攻並破、對Site不耗。
  - Activated Ability `c7f83847-8d96-4d13-a8df-a510ba603f1e`（2025-07-10）、Discard `adee8b2b-40ba-4231-874d-df4790483730`（2026-05-19）、Water Site `9f36ba9a-8139-46c7-b322-451ba5c08118`（2025-06-17）。

本批沒有操作瀏覽器 UI。root已獲5500服務許可並獨立驗證；子任務不觸碰該服務，不詢問或打擾睡覺使用者，不將此批Node測試算成UI驗收。無推送部署或憑證變更。
