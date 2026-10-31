# Monks 強制移動與 Silence 逐卡修正

2026-10-30 UTC。實際原生測試：`tests/catalog-monks-silence.test.js`，8/8；與 Aura/Flood 合計214/214；跨 Geometry/Effects/Vivien/Chaos 212/212。最新完整回歸尚在執行，不冒稱舊1842覆蓋本批。

Monks of Kobalsa 的 Bury 原本正確，但 Drown 與 The Flood 被 canSubmerge 的 unmodifiable guard 擋下。Submerge/Burrowing Codex 定義為強制移動，不是賦予 keyword、改特徵或 status。只移除普通 whole-body canSubmerge 的 guard；growing size 改變的額外 guard 未擅改。三個真手牌施放測試驗證無生存能力的 Monks 移至地下／水下後死亡入 owner 墓、Flood 已選例外 Mortal 留下及 JSON。沒有用賦予 Monks Submerge 來規避其不能修改能力。Bane/control status 問題仍獨立待裁定。

Silence 真手牌施放後：inactive silenced/disabled source 不再沉默；Void 的 Ghost Crabs 不被沉默、保留 Voidwalk；Site 地下的 Cave Trolls 被沉默並失去生存能力而死亡。Enchantress 真施放 Silence→Divine Healing→動畫化，證明自身與其他 minion 都沉默，四次 JSON restore 不振盪；真 Freeze 使 animated source disabled 後其他 minion 恢復。引擎先按 base silence/source state 收集本層正在套用的效果，避免用上次刷新自身產生的 silence 撤回已套用效果。

來源：October 2026 Rulebook（來源指紋見 final-101-official-source-index）；官方 Codex 快取實際文字已讀：Can't be Modified 5b78b0b7-6d27-421b-898e-cc69bd33771b（2026-10-12）、Burrowing 16ed5006-40f3-4df2-8b60-6d0b13bb35a8 與 Submerge aaa76e05-0cbc-4114-ad1c-411eeec89eea（2026-02-09）、Layer aa624e74-7c3e-4622-8471-03e05b576c52（2026-08-04，效果不能移除已套用的自身）；Silence/Enchantress FAQ ygoDG8fb7HS97qCW69iVRh（2025-02-20）。本輪 https://sorcerytcg.com/cards/silence 可讀、卡文為占據受影響 Sites 的 minions；Monks 官方頁工具不可存取，以原快照與具版本快取為準。

before 與 after logs 保留於 data/all-cards-audit/logs/monks-silence-before.log、monks-silence-214.log。最初 Void fixture 用不具 Voidwalk 的 Cloud Spirit，已改正為印有 Voidwalk 的 Aaj-kegon Ghost Crabs；有效 before red 保存的是正確 fixture。沒有刪除或放寬規則斷言。

限制：不宣稱所有能力移除／交錯來源 timestamp／growing cannot-modify 互動已窮盡；實際 UI 等待 loopback 授權，未重試遭拒服務。
