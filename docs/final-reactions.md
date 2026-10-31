# 最後 101 張：Dodge Roll 與 Valor

實作 `src/final-reactions.js`，測試 `tests/final-reactions.test.js`。

`node --test tests/final-reactions.test.js`：**14 項通過、0 失敗**。兩張已正式註冊實際效果；仍沿用專案整體部分支援標準，沒有宣稱通過所有卡牌組合。

## 時機與實際結算

**Dodge Roll**：在合法攻擊宣告成立後的attack triggers階段提供施放窗口，先於defend window。攻擊原目標的操控者可選任意合法己方Spellcaster，照常檢查threshold與mana。施放後，原本被攻擊的盟友可自行走到另一個相鄰location；這不是teleport或強制移動，所以Talus可自行走動，也會觸發正常跨牆與進場規則。若離開攻擊位置，原攻擊不會追蹤它。

**Valor**：只有盟友使用Defend並成功到達攻擊位置、加入defenders後才提供效果窗口。從別處走來及已在攻擊位置的防禦者均可觸發；在途中死亡的單位不觸發完成防禦。效果只給本次完成Defend的盟友+4 power，持續到本回合結束，不會給原本被攻擊的盟友。防禦另一個unit及防禦site均支援。

官方Attack流程明確區分：新加入的防禦者並非再次被attack/target，所以其加入不開新的Dodge窗口。

## 對手回合的費用

沒有改變實際 `s.active`，沒有給玩家免費施放或額外mana。

窗口枚舉合法施法者時使用克隆preview，但每個候選動作的費用必須再以原始狀態 `castingCost` 與 `resources.available` 核對。對手回合可用mana為0；因此原費用0可施放，但Maddening Bells使費用增加後不能施放。若另有不受Bells影響的合法Spellcaster，仍可由該caster施放。

`Valor` 的窗口設 `s.pending.resolvingReaction`，允許storyline結算其施放與效果；放棄或沒有可再施放的反應時清除，接回原defend window，保留defenders與原攻擊。

## 不允許普通main-phase空放

沒有有效attack／defense reaction context時，Dodge Roll與Valor不能施放；即使有足夠mana或免費複本也不會創造缺少的時機。

直接依據是官方Archimago第五則FAQ：明確否定用該activated ability施放這兩張，理由是該能力只能在main phase且storyline為空時使用。這個直接特例優先於僅從卡面May、一般Magic與無target字樣推導的普通空放解釋。`finalReactionCastAllowed`因此對無context情況回傳false，所有一般、Dhol與虛擬複本施放都使用同一限制。

## 真實dispatch覆蓋

- attack階段Dodge先於defend、普通一步閃避、對手回合實際mana仍0。
- Maddening Bells加費不能用虛構mana；另一合法caster可避免該局部稅。
- 元素門檻仍必要；Talus的自行step不被當成force。
- 新defender不開Dodge；Chimera三個原目標之一Dodge後，其餘兩個仍戰鬥並分配完整攻擊力量。
- 移動後及同location的Valor、防禦另一unit不buff原目標、回合結束+4到期。
- Defend途中死亡不提供Valor。
- 反應窗口與施放中context可JSON存檔還原。
- main-phase不能空放兩種反應魔法；足夠mana、局部稅與free權限均不能繞過時機。

## 官方來源（2026-10-30）

- [Dodge Roll 卡面與FAQ](https://sorcerytcg.com/cards/dodge_roll)，瀏覽器展開核對：加費後不能在對手回合施放，因為該回合沒有可用mana。
- [Archimago 卡面與第五則FAQ](https://sorcerytcg.com/cards/archimago)，瀏覽器展開核對：main-phase且storyline為空的activated ability不能用來施放Valor或Dodge Roll。
- [Valor 卡面](https://sorcerytcg.com/cards/valor)，無獨立FAQ。
- [Attack Codex](https://sorcerytcg.com/codex/c0fbcbae-e6a5-4048-b925-f2219ad43662)：attack triggers → defend window → 檢查目標 → fight；新defender不是被attack/target，不能新增Dodge。
- [Defend Codex](https://sorcerytcg.com/codex/7bc7a52c-25dc-4c80-8608-89667ef5eed7)：移動完成並到達攻擊位置後才完成Defend。
- [Casting Spells / Casting Magics](https://sorcerytcg.com/codex/43a73161-4f77-46b1-a23a-f916223a748c)，瀏覽器展開Casting Magics子條：一般main-phase施放、必要threshold/mana；無target詞的Magic於結算時選盟友。
- [Adjacent Codex](https://sorcerytcg.com/codex/1d3363e4-3b12-46fb-99d9-f4319967f484)：目前格及四個正交格相鄰，無對角格。
- [Step Codex](https://sorcerytcg.com/codex/0f53b70d-d13a-4982-8c16-20bb4ab1aa9d)：自行step與forced movement有別。

## 仍待全域驗收

目前沿用既有attack trigger的固定排入順序，尚無完整官方同時觸發任意排序UI；反應時機核心、費用、恢復defend流程已有測試，但不宣稱所有Wisp／Hero／Sturm等組合均已全面驗收。
