# Artifact 第五批：Mandrake Jars、Mask、Hook、Staff、Mix Aer/Aqua

2026-10-30。經root確認1998/1998 fullrun結束後才轉正式；`node --test tests/catalog-artifacts-wave5.test.js > /tmp/audit-artifacts-wave5.log 2>&1`，15/15通過exit0、0skip。未改引擎、既有tests或JSON；僅新增本批專屬正式tests及文件。

來源：官方快照data/official-cards.json、既有October2026規則書及官方嵌入Codex/FAQ快取。本輪web[Merlin's Staff](https://sorcerytcg.com/cards/merlins_staff)成功且與snapshot效果一致，其餘五頁InternalError，不能宣稱最新官網卡文刷新完成。FAQ以cards slug精確比對。

六張共同原生：真正手牌施放付印刷費，低於費用沒有cast，owner/location及JSON。印刷threshold全0，門檻不足測試N/A。

|卡|實際原生測試|來源與限制|
|---|---|---|
|Mandrake Jars|真cast1費給Bears，+1至5與Earth-onlySpellcaster；無Fireball施放permission，真正以bearer施Bury把敵Bears13burrow致死；JSON，真正turn後drop失加成與casting。|沒有匹配本卡特定FAQ。所有其他gained/spatial/layer交互與UI未驗。|
|Mask of Mayhem|真cast4費後有nearby可attack minion時legalActions沒有end；原生combat雙向unit strike加倍。另原生Belmotte Longbowmen在14（Mask12影響外）向13victim射Ranged，按victim位置倍增；兩真Mask同場時damage3×4=12。|官方FAQ c1c53f1f-5dac-480c-9bfe-3d01b990a0c6(2026-02-09)按受strike者location；FWsVZ4rxgHCtjTP73mTtIA(2026-02-06)兩次double=4倍。79b989f4…(2026-02-09)Move超範圍不必attack，本批未另補該案；site attack不加倍、多mandatory來源與UI未驗。|
|Meat Hook|真cast4費給Bears，原生activateArtifact宣告north方向；確認前不tap，確認後tap；projectile真命中敵Boars2，選hit後沿2→7→12拖至bearer；JSON後可選fight或不fight兩案例，fight才殺Boars並收2傷，不fight雙方0傷。Hook保留。|本卡無匹配FAQ，Projectile/Movement on Storyline沿用既有primary。Stealth/多hit/force免疫與大型拖曳/取消及UI未驗。|
|Merlin's Staff|真cast2費給原本非caster Bears，真正以bearer連施兩Zap，power4→5→6，敵實收1→2傷；每次JSON恢復；真正下個己方turn清至4，drop失Spellcaster。|本輪官方頁卡文可讀。非Magic不加power、先施後拿Staff、交替bearer等未驗；UI待驗。|
|Mix Aer|真cast1費給Avatar，無Air門檻時原本不能cast；真activate犧牲Mix入墓，JSON；僅bearer得到permission，別的Merlin仍無法cast；真LightningBolt2費減至0，忽略Air門檻，敵受3傷；同turn下一Air仍缺threshold被拒。|無匹配特定FAQ。折扣與其他成本/能力owner依Arthur、多個Gift及expiry/UI未驗。|
|Mix Aqua|同上真cast1費與sacrifice，沒有任何己方Water門檻；真Drown3費減至0，只原bearer能cast；敵water-surface Bears被Submerge後死亡；下一Water因已消耗仍threshold不足拒絕。|無匹配特定FAQ。費用疊層/多個Gift/expiry/UI未驗。|

測試草稿修正：Blink使用cast-time target selector而非舊版target scalar，改用同Air1/cost2的真LightningBolt以直接驗證隨機傷害，沒有修改Blink；水上敵目標的Pond原fixture屬己方導致額外Water1，已在初始fixture把該Pond設敵owner/controller，精確驗證零門檻。未改引擎／放寬正確規則期望。

這些是代表性交互，非窮盡所有卡組合；UI全部待許可，未開server、重試bind、改憑證、推送部署或選家規。


正式結果：2026-10-30 20:20 UTC，`node --test tests/catalog-artifacts-wave4.test.js tests/catalog-artifacts-wave5.test.js > /tmp/catalog-artifacts-waves45-formal.log 2>&1`，28/28通過、exit0、0skip（第四13＋第五15）。root統一完整回歸前不得將此subset稱最新fullrun。
