# Book 登錄後 Chaoswish 真施放整合

2026-10-31。root轉達最新使用者裁定：整張Magic僅計選中的allied minions；Duel選己方A與敵方B時，A在fight前獲Ward。此替代原本未決的all-minions解釋，不能繼續把Book保留unsupported。

只新增 `/tmp/book-chaos-final-candidate.mjs`。候選5項，待root完成Book production registration及magic-context allied-minions policy後執行；不改共享source/tests/JSON。

1. 真Chaoswish先選Wizard、再由BlackCat定Book結果；固定caster的真免費Artifact cast placement12、tokenCopy、支付不增加；下一玩家拒複製後真pickup成Wizard bearer；真Zap選ally受Book Ward預防damage，token Book仍存在。
2. 同真生成並pickup Book的bearer真Duel，選allyA與enemyB；只計A，因此Ward在fight前授予，A存活無傷、B死亡、Ward消耗。
3. 官方完整Spell池長度精確一致；Book與Globe均註冊且抽到後進真cast window，非manual/retry，不從pool刪除它們。
4. 兩次真Chaoswish free Zap各從Book bearer施放，各獨立Ward/actualCast context，caster castCount增加2，Zap tokens banished2。
5. 真paid Zap由bearer施放，nearby real Orb建立Magic copy；原始cast只獲一次Ward，copy非cast不再授予，因此原Zap傷害被擋但copy造成1傷；caster只增加1 cast，Zap choice context只有1。

來源：既存官方快取及 `docs/final-passives.md` 所記Book FAQ明示target allied minion亦算choose；Casting Magics Codex `43a73161-4f77-46b1-a23a-f916223a748c` 原生target/choose時序；官方Copy Codex（2026-05-19）token banished與copy控制規則。allied-only整張Magic計數由本輪使用者明確決策，不冒稱既有官方FAQ已獨自解決此歧義。

本批只引擎整合，不替代rootUI、full、402後續全庫稽核。進度等待root runtime通知，未以未跑草稿報完成。

## 正式runtime後結果

唯讀確認 `src/definitions.js` 正式Book passive及 `src/magic-context.js` default policy已為 `allied-minions` 後，候選實跑：
`node --test /tmp/book-chaos-final-candidate.mjs > /tmp/book-chaos-final-candidate.log 2>&1`
結果 **5/5通過、0skip、exit0、2253ms**。與root聯跑啟動時間交錯，子代理單獨session74874已完整終止；未重啟root session24473，沒有active候選session。

實際pickup流程只讀核對並已由native測驗證：`legalActions(...).find(type==='pickup' && unit===wizard.uid)`，原生action加`items:[book.uid], units:[]`後dispatch，Artifact的bearer真變為wizard。全程沒有把bearer直接手改成通過狀態。

固定Book結果經castwindow冷JSON，仍由先選wizard施放/放到12；無manual/retry、不換caster、不重抽；Book的Artifact copy保持tokenCopy並可真拾取，實際Magic賦Ward正確。兩次Chaoswish free Magic各建立actualCast context並各賦Ward，而Orb非cast copy只結算效果、沒有多一個context/cast/Ward。

本五案例已覆蓋最重要JSON/no-reroll/casterbinding差異，不再擴無關範圍。Suffering多型別或Deathrite時序guard屬root獨立整合，不以本五測推論該combo已全部解決。尚待root正式promotion/full/UI；本候選及doc穩定、共享檔完全未修改。
