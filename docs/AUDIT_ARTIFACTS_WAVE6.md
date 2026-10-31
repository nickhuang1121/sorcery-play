# Artifact 第六批：Mix Ignis/Terra、Nadir、Onyx、Orb、Panpipes

2026-10-30；經root明確穩定窗口授權正式納入專屬tests/docs。`node --test tests/catalog-artifacts-wave6.test.js > /tmp/audit-artifacts-wave6.log 2>&1`：**14/15，1確認規則紅測**，不能稱全綠。未改引擎、既有tests或JSON；只新增本批專屬tests/docs。

來源：官方快照、既有October2026規則書及嵌入Codex/FAQ快取（cards slug精確比對）。本輪web[Orb](https://sorcerytcg.com/cards/orb_of_baal_berith)與[Panpipes](https://sorcerytcg.com/cards/panpipes_of_pnom)成功，文字與snapshot一致；其餘4頁InternalError，最新source刷新待辦。

六張共同：native hand cast扣印刷費、insufficient mana無合法cast、owner/location與JSON。印刷threshold均0，threshold不足N/A。

|卡|原生效果證據|來源與剩餘|
|---|---|---|
|Mix Ignis|真cast1費Avatar17持有、真啟動犧牲入墓；無Fire門檻時本來不能施放，Gift後真Fireball4費減到1、無需Fire2，北向projectile使敵12收到4；第二Fireball同turn因門檻仍缺不能施放；JSON。|無該卡匹配特定FAQ。其他費用疊層、gift有效期限與多bearer／UI未驗。|
|Mix Terra|真cast1費Avatar持有、真犧牲；零Earth門檻下真Bury3減到0，合法指定並Burrow敵使其死亡；下一Bury因Gift已消耗仍門檻不足；JSON。|如上。零Earth用Wasteland初始Site，零Fire用Valley，避免誤算resources。|
|Nadir Seed|真cast3費給己bearer；初始Sitecontroller0/1兩例：只有該Sitecontroller的own end掉精確available mana，別人end不扣其life；即使Artifact的bearer/owner是0，若Site1仍懲罰1；實際end/draw、JSON。|無匹配FAQ；Site移動、Rubble、多副本、Mana生成時序／UI未驗。|
|Onyx Core|真cast1費持有，resources mana和Earth各+1；JSON與實際drop後兩者回原值。|其他controller／Arthur及UI未驗。|
|Orb of Ba'al Berith|真cast5費；首個真Zap複製，選權原caster0，JSON後new target把copy移到Orb附近另一unit，原與copy各1；只付原Zap1，第二同turnZap再正常付1不再複製。|FAQ e7066806…(2026-05-19)原spell controller控copy；FWs…UG5I(2026-03-04)Orb為copycaster；3c66de63…/bd80b1f2…/bf741c7b…(2026-03-25)X鎖定與additional cost不重付／失效目標；本批未覆蓋所有後三FAQ，既有final-orb不冒領新增。|
|Panpipes of Pnom|真cast3費；真Ranged Source近13/victim遠14把1加至2；Source遠14/victim近13仍1；近Source正常3不降成2。JSON。**0power native Ranged應2實0，確認失敗。**|FAQ54fc96cc-081e-4dc6-8c83-ca65eedb2188(2026-02-09)明確zero power unit strike2。尚待root修補與正式回歸；不是裁定疑義。|

Panpipes紅測最後一項：在場Belmotte Longbowmen13有合法初始modifier power-3，因此公開power()=0；真conjure Panpipes12，真Ranged東向命中Bears14，預期damage2但實0。`src/engine.js` hurt()在modifyFinalDamage之前n<=0早退；`src/final-damage.js` modifyFinalDamage亦while(amount>0)跳過floor。只移除第一guard不足。必須保留傷害modification先於prevention，不能把已被prevent歸0的damage重新加到2。runtime由root統一整合，本子代理未改。

草稿曾零Fire時把Site全設Wasteland，實際仍提供Fire10，已改Fire用Valley，Earth用Wasteland，保留公開resources()=0的嚴格斷言；不是引擎缺陷或放寬條件。

所有UI未驗、沒有server bind重試，沒有修改憑證／推送部署或選家規。


UI授權更新：主代理通知使用者已允許既有5500服務的UI驗證，由root處理。本子代理仍未操作瀏覽器，因此本批actualUI維度仍未驗，不能因已授權而標通過。沒有向使用者詢問或發送進度。
