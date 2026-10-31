# Mariner’s Curse／Bound Spirit 規則稽核

2026-10-30。正式回歸：tests/catalog-auras.test.js、tests/catalog-bound-spirit.test.js；跨Flood共214/214通過，log data/all-cards-audit/logs/mariner-bound-214.log。完整套件另查data/final-101-validation.json，不把子集當全套。

## Mariner’s Curse

官方FAQ eXfZjLHocReFQIApZdOnpM：動畫化的詛咒下沉後若死亡便不能再回手；ygoDG8fb7HS97qCW69iGGC：Grapple Shot中途下沉會使後續surface路徑失效；ygoDG8fb7HS97qCW69tL2I：大型單位持續佔據同一Site不算再次進入。官方卡文與版本索引見data/final-101-official-source-index.json（已快取FAQ／Codex，非宣稱重新抓最新頁）。

修正：進入Site依前後佔據的square判定，不把同Site換層當新進場；地下／水下進入新water Site也觸發。僅強制該minion下潛，普通大型身體要求完整合法水域，growing Moeba有可保存的擬足選擇。下潛與回手分開為序列，先讓死亡及替代結算，仍存在的Aura才回手。已觸發效果不因來源其後失效而任意取消。

覆蓋：正常具Submerge者、來源silenced、Talus拒強制仍回手、below進水、混合land/water大型不可部分下沉、動畫化死亡不回手與存活回手、Moeba中途JSON／僅一目標／回手一次。未宣稱全部進場觸發組合、所有借用來源或實際UI已驗。

## Bound Spirit

官方Codex Ordering Ongoing Effects - The Layer System，aa624e74-7c3e-4622-8471-03e05b576c52，更新2026-08-04T21:39:56Z：條件先等相關效果套用；具體例子是Bosk Troll持Eerie Coral，以及Bound Spirit自身持Coral可自行解除該條件失效。October2026 Rulebook Adjacent包含自身square。

修正：分兩步計算條件與Spellcaster授予。候選檢查只排除needsSpellcaster這個循環本身，保留獨立Freeze／restraint／其他睡眠；各單位同時依同一組條件資訊計算，避免array順序。鄰接檢查包含自身square與實際身體佔格、同region及盟友控制權。

覆蓋：真實Coral conjure至自身持有、Water Frost Nova施放、JSON、跨兩回合後合法drop使條件失效；Bosk Troll持Coral、原生Freeze來源、自身Freeze、同square Avatar、敵方Coral不算盟友、Coral來源原生移動到遠處／對角、Pallid借用Hollow睡眠不得被抹除。施放是interaction，測試沒有誤要求立刻drop或誤稱必然tap。

未宣稱實作整套一般化Layer相依圖；其他種類條件、借用能力組合與全UI仍須逐項查核。原五項未決規則未採家規。
