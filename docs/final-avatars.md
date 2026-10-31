# Final 101：原 Avatar 子集與後續能力來源

2026-10-30。原分配 14 張均已有實際效果與正式註冊；不以空白被動旗標取代實作。Corruptor／Persecutor 已完成 contextual consumer 審核後從實驗 maps 移入正式 maps，詳細證據見 [final-types.md](final-types.md)。額外新分配 Vivien 與 Infusion Factory 不算進原 14 張。

## 原 14 張逐卡證據

| 卡牌 | 實際效果與可稽核驗證 |
| --- | --- |
| Avatar of Water | `final-avatars.js` 的 Flood／獨立可選傳送；先選再 tap，跨回合持續至自身下次啟動，site/source UID 重驗，攜帶神器與保存續接。8 個真 dispatch 測試。 |
| Realm-Eater | 成功 Site Strike 後 Storyline 摧毀，逐層持續 Immobile、每次 Digest 去一層；Silence／失面具不抹除層數，Onslaught 暫時忽略而非清空。5 個基礎真 dispatch，另 Imposter 失面具測試。 |
| Avatar of Fire | 本回合火 Site 可選真 Fireball mode；方向取消無付款、正常 mana／threshold／投射物傷害，離場送原 Site ID。3 個真 dispatch 測試。 |
| Animist | Magic 手牌另可作空白 Spirit，元素／稀有度保留、力量按印刷費用，X 選擇／保存、費用門檻召喚稅、正常 physical provenance；basic copy 還原 Magic 並立即離場而不結算 Magic。10 個測試，另 Imposter mask 真施放／失面具後 Spirit 留存。 |
| Deathspeaker | 任一墓地實體先放逐，token 由任意己 caster 施放；Genesis 與入場結算後放逐；Death Door 只免基礎費、門檻與額外稅仍付；Bureau／Worm／Order／Bottomless Pit／保存來源重驗。9 個測試，另 Imposter、Mephistopheles 交互。 |
| Magician | 無 Atlas、Spellbook 可含 Site、起手七張、Site mulligan 回正確牌庫、抽 Site 不改抽法術、Tap 只 Play Site。4 個 setup／validation／dispatch 測試。 |
| Pathfinder | Atlas 不同名、起手三張；首個人回合首 Site 在自身下，其後揭頂到相鄰處；失敗留頂、Mirage／Mirror Realm、Site 先打再移動、移動受阻不撤銷 Site、攜帶物。9 個測試。非 Avatar actor 泛化另有 foundation 回歸。 |
| Archimago | 宣告三個不同墓地實例作成本，可取消；原牌實體放逐，強制選其中一張正常付費複本，若不能施放則三牌仍放逐；任意己 caster、可重複、Bureau scope、Mortuary physical owner、真正保存窗口。10 個測試。 |
| Mephistopheles | Must Cast 在自己 Avatar 所在己 Site；原子創建 Avatar 再放逐舊 Avatar，保留 current/max life、Spellcaster、Demon／Air／Unique；非施放召喚仍 Minion；一次 Evil 手牌相鄰召喚及入場稅。10 個測試含 Order／Saint／Deathspeaker Avatar immunity／Bottomless Pit／取消／非施放召喚自己。 |
| Enchantress | 原法術已付款／指定 targets 後、resolve 前可選動畫；同一實體同 uid Aura／unit 雙索引，保留被動與控制、2x2／wall 尺寸、移動／攜帶／死亡／到期／registry 還原。16 個測試，見 [final-animation.md](final-animation.md)。 |
| Dragonlord | deckbuilding 設定公開 Unique Dragon，正常門檻與 3 mana、己回合一次、只借 printed text 不借特徵、回合到期；10 Unique Dragon reference 全覆蓋及各可觸發效果。14 個 Dragonlord 專項，見 [ability-sources.md](ability-sources.md)。 |
| Imposter | 私有 collection 選擇／取消、支付 3／Bureau、實體放逐，dynamic ability origin，真傷害卸面具／Ward 不卸；忽略 setup、保留 Realm-Eater Immobile、Druid-mask 翻面敗北、Animist／Water／Enchantress／Deathspeaker 實際 borrowed effects。10 個 Imposter 專項，見 [ability-sources.md](ability-sources.md)。 |
| Corruptor | 所有區域追加類型而非替換，手牌費用／threshold／Pond／搜尋／墓地／top 等共用 contextualCard；場上不可修改與 Onslaught 例外、Ward／Saint。見 [final-types.md](final-types.md)，不是只有 realm cache flag。 |
| Persecutor | 己回合一次 Brand 或實際 BFS Step；只追 same region closest、合法最短路徑；Brand 非 target，可跨區域／Stealth，保 Ward；只有己 cards 視角 Evil，Saint 可阻止 Brand 判 Evil。見 [final-types.md](final-types.md)。 |

`tests/final-avatars.test.js` 77 項保留；其中 4 項是共用永久／免費／非己回合複本窗口，5 項為 Corruptor／Persecutor helpers／註冊，其他為上述逐卡效果。`tests/final-animation.test.js` 16 項。`tests/ability-sources.test.js` 31 項，其中 3 個新增 gained／Silence 回歸需 root 套最新 `/tmp/final-gained-abilities.patch`（隔離快照已 28/28 通過）；完整工作區由 root 統一驗收。

## 官方一手來源

以上卡頁 FAQ 已經 CUA 展開實讀：[Water](https://sorcerytcg.com/cards/avatar_of_water)、[Realm-Eater](https://sorcerytcg.com/cards/realm_eater)、[Animist](https://sorcerytcg.com/cards/animist)、[Deathspeaker](https://sorcerytcg.com/cards/deathspeaker)、[Magician](https://sorcerytcg.com/cards/magician)、[Pathfinder](https://sorcerytcg.com/cards/pathfinder)、[Archimago](https://sorcerytcg.com/cards/archimago)、[Mephistopheles](https://sorcerytcg.com/cards/mephistopheles)、[Enchantress](https://sorcerytcg.com/cards/enchantress)、[Dragonlord](https://sorcerytcg.com/cards/dragonlord)、[Imposter](https://sorcerytcg.com/cards/imposter)、[Corruptor](https://sorcerytcg.com/cards/corruptor)、[Persecutor](https://sorcerytcg.com/cards/persecutor)。Fire 另依 [Fireball Codex](https://sorcerytcg.com/codex/d91daeec-302e-47ce-8716-26aec656318b)。

特別裁定：Archimago 的 Main Phase 能力不能施放 Valor／Dodge Roll；Imposter Druid flip 會因無 Avatar 敗北；Realm-Eater 失面具仍 Immobile；Avatar immunity 使 Deathspeaker 延後普通放逐不能移除已變 Avatar 的 Mephistopheles。Saint 官方 FAQ 已確認 Persecutor 也不能把被救贖者判 Evil。

## 額外分配與尚未完成

Infusion Factory 已接持續 claims、6 項真測試，見 [final-factory.md](final-factory.md)。與 Grosse 共用所有 bearer 入口的廣泛審核仍由 units／root 接續，不將基本 6 項當作所有神器互動均已驗完。

Vivien 已由 root 核准啟用正式註冊；41 項測試不再修改 playable 旗標。正式工作區已通過 41 項逐效果測試，涵蓋 realm／hand／Spellbook／cemetery 派生圖、實體牌與墓地 UID、Grigori 永久來源與冷重建、各來源費用／位置／替代結算、Mimic／Heir、Artifact Monument／沉默／來源消失、River／Merlin Tower、Mummies 與 Cerberus。逐類來源清單、已清除門檻與限制見 [final-vivien-readiness.md](final-vivien-readiness.md)。100 項核心交叉測試全過，目前明確稽核清單沒有剩餘已知 Vivien 核心缺口，不以 Pallid 的無關問題作為無限期阻擋理由；也不將這些測試聲稱為窮舉所有卡牌組合。
