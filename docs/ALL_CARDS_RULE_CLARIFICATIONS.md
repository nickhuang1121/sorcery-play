# 全卡庫稽核：另需官方釐清的問題

查核日期2026-10-30。這些問題不屬於原101五項裁定；不應用既有程式行為替代官方依據。

## Bane Aventis 與 Monks of Kobalsa 的控制權

場景：Bane Aventis 的持續控制效果欲取得 Monks of Kobalsa。Monks不能被修改；普通控制、來源離場、Ward與儲存恢復已有代表性測試，這個例外尚未確認。

解釋A：控制者並非 Characteristics 所列特徵，故可改控制。
解釋B：控制權是 Can't Be Modified 所說的 status，故不能改控制。

已查官方Codex：Characteristics（30561063-e0e1-41f7-9ab2-903475629dde）未列controller；Can't Be Modified（5b78b0b7-6d27-421b-898e-cc69bd33771b，2026-10-12更新）含status／abilities／characteristics，但已查216Codex與753FAQ未找到status在此是否涵蓋control的明確定義，也未找到Monks專屬答覆。來源版本見data/final-101-official-source-index.json。

目前不推薦其中一項作為官方裁定。現有King及gained guard拒絕修改控制，而Bane一般路徑允許，兩者不一致只是稽核線索，不能證明哪個正確。尚未將/tmp中的「必須拒絕」草稿案例當作正式規則，也未為迎合它添加guard。逐卡帳本保留rule-clarification-required；其餘可驗證流程照常推進。

## 鬆置 Flame of the First Ones 的「你」

已驗證正常 bearer 攜帶、移動至新 Site、重訪不重複觸發。獨立未決場景：owner 為玩家0，玩家1曾透過真正 Mesmerism 控制 bearer，放下 Flame 後它已無控制者，再被真正 Displace 移到未造訪 Site。引擎目前沿用最後 bearer 玩家1，使生命10/10變成9/11。

已查 Uncontrolled／Ownership and Control 通則只能確認由 owner 排定無控制者來源的觸發順序，不能據此斷定「你」的受益者。可考慮 owner0、最後控制者1，或沒有受益者三種解讀；目前不選家規。精確操作、來源日期及非規範性診斷見 AUDIT_RECORDED_ARTIFACT_ISSUES.md。該診斷測試只驗證操作可執行，沒有把目前生命結果當成正確斷言。

使用者睡眠期間不提出問題；保留待官方釐清，繼續其他查核。
