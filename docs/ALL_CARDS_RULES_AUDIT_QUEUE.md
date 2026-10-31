# 後續全卡庫逐卡規則稽核（尚未開始完整驗收）

使用者已擴充授權：先完成 `data/final-101-baseline.json` 的101張，再對整個卡庫逐卡核實可玩流程與官方規則書、Sorcery規則Codex、FAQ。保持原備份，不推送或部署，不改無關憑證。parent在原對話無法恢復時會建立新對話接續。

每張後續須保存：官方來源與版本/查閱時間、印刷/動態特徵、合法操作與目標、費用/門檻、選擇/取消、時序/觸發、傷害/死亡、區域/持續效果、代表性交互、保存/恢復，以及真UI能否走完該牌流程。逐卡測試、helper測試、模組載入與16組預組對局分開，不聲稱窮盡所有組合。

## 本輪已發現且修復的共用問題

- `Lethal to ...`不再被`printedKeywords`當無條件Lethal；有Persecutor＋原生Intrepid Hero正反向真戰鬥回歸。
- Site施放Magic與Site自身能力具有獨立abilityOrigin，Key不會免疫前者；有真River of Flame施放與Mobbed Court來源對照。
- 主動/非主動玩家自己的傷害修改與預防順序、實際傷害收據，以及Altar對Blaze of Glory延遲死亡的替代均有新增效果測試。
- 替代選擇的私人重播世界不給觀測者；命令physical actor在公開dispatch入口驗證，包含online envelope與受控玩家認輸權。

## 後續需依官方來源核實（不是已證明的缺陷）

- 已核修復：原始Skeleton缺分類。2026-10-30直接讀[Skeleton官方Codex](https://sorcerytcg.com/codex/4d00cfac-df9c-417c-80c8-40bce04a46a8)，明文Ordinary／Undead／Air／1power。在cards.install正規化補分類，保原快照與不可施放Token，不捏造施放門檻；新增正式DeathKnight加力真交互測。
- 已核解決：2026-10-30直接讀[Fully Heal官方Codex](https://sorcerytcg.com/codex/1fd795ca-305f-49df-9fbf-557c44452e68)，明文fully heal覆蓋River of Blood等減少治療效果。原本直接滿血/清傷正確，不能改為減半；新增Lifewish與Aegis真流程回歸保護此規則。
- 替代選擇後同一frame再有Lucky/BlackCat隨機選擇時，先前替代決定是否應封存並原樣重播。現交易及隨機重播各有測試；需補同frame交錯的實際卡例，而非宣稱所有排列已測。
- 未完成Kairos archive與其他runtime狀態（含Altar每局一次、Mirror原實體、animation雙索引、Grigori/Vivien來源）必須一起驗；不能以printedID替代不同實體。

全庫階段未開始前，本清單僅保存接續線索；101逐卡完成/部分/未開始的正式數據以 `data/final-101-progress.json` 及其成功的完整測試時間為準。

2026-10-30 後續稽核實際修正：Sacrifice Codex `b6ffd09a-c8fb-4b80-ac24-4900e8fd5ca3` 明訂犧牲優先於所有摧毀預防／替代；engine Damion 的既有死亡保護原本缺少 `!sacrifice`，本輪已修（等待對應真效果回歸與新完整測試）。一般摧毀仍應受保護，不能以放寬犧牲測試掩蓋。

Book 尚存精確問題：若 single 採「完整 Magic 只選一個不同 minion」，Suffering 的己方犧牲及 Deathrite 會先改變敵方後續可選集合；但 Ward 又可能透過 wardedPower／realmWardPower／zeroUnlessWard 改變被犧牲者 power 與後續死亡效果。不能用偷看未來選擇、假造 RNG 或將已發生效果重播作為已核實通用解法。官方 Book FAQ `aa28f077-ea12-4e65-8495-19dd0cb388b3` 只確認 target 也算 choose，尚不足以解決這個 single／時間點問題。保留 partial，具體真測由 Book owner 持續補充。
