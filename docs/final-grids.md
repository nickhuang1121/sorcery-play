# 最後101張：圖案傷害卡牌11張

查核日期：2026-10-30。以下數字均由背景瀏覽器實際查看官方卡頁左側原始卡面，不由缺少圖案的JSON卡文猜測。只在程式保存傷害數字，沒有複製官方美術。

實作在 `src/final-grids.js`；主整合已接入 definitions、Storyline operations、resolver、cast availability，以及Hellstar攻擊／防守限制。`tests/final-grids.test.js` 共41項通過，其中39項走實際引擎dispatch／legalActions，2項直接檢查圖案旋轉、裁切與完整十字可放位置。

| 卡牌 | 實際行為與核對數字 | 效果／邊界驗證 |
| --- | --- | --- |
| [Burning Hands](https://sorcerytcg.com/cards/burning_hands) | 額外允許Mortal施放；選兩個不同方位，每條射線近2、遠1 | Mortal可施放、Beast不可冒充Mortal、不得重複方向、可相反方向、越界裁切、施法者不受傷 |
| [Firebreathing](https://sorcerytcg.com/cards/firebreathing) | 額外允許Beast／Dragon施放；正前方4、其左右各1、更遠正前方1 | Beast與Dragon施放入口、北向數字及西向旋轉、施法者不受傷 |
| [Flame Strike](https://sorcerytcg.com/cards/flame_strike) | 正前方3、前二格的橫列1／1／1 | 北／東旋轉、區域限制、多格單位傷害相加、Ward只承受一次總傷害 |
| [Flame Wave](https://sorcerytcg.com/cards/flame_wave) | 每橫列由所選邊開始7／5／3／1，剩餘一欄不受傷；只傷地點上方單位 | 左右反射、不能90度旋轉、排除虛空及地下單位 |
| [Lava Flow](https://sorcerytcg.com/cards/lava_flow) | 原點5、正前方4、前二格2；施法者不受傷、只傷佔有地點的其他單位 | 北／東旋轉、排除自身、原點必須有地點 |
| [Holy Nova](https://sorcerytcg.com/cards/holy_nova) | 中心3、四鄰2、四角1，只傷敵人；可打破友軍Ward重新選中心 | 不重設中心、友軍僕從／地點Ward替代中心、排除敵人Ward作替代中心、角落裁切 |
| [Wreathed in Righteousness](https://sorcerytcg.com/cards/wreathed_in_righteousness) | 指定位置的非Evil僕從先獲Ward，再對周圍八格僕從各2；中心0，Avatar不受傷 | 敵我中心僕從皆獲Ward、Evil不能Ward、多格單位先Ward再承受周圍總傷害、敵方地點Ward移除目標後整個依賴圖案不結算 |
| [Meteor Shower](https://sorcerytcg.com/cards/meteor_shower) | 依次指定三個不同且互不共邊的地點，分配大／中／小圖案；大為中心7四鄰5四角3，中為中心4四鄰2，小為單格3 | 允許僅共角、禁止共邊、前面選擇必須仍能完成三目標、無合法三目標不能施放、重疊傷害相加、某目標Ward只阻止其依賴圖案、存檔續接 |
| [Mester Stoor Worm](https://sorcerytcg.com/cards/mester_stoor_worm) | Submerge／Waterbound；橫置選方位，正前、其左右及前二格皆1點Lethal能力傷害 | 敵我都受致命傷、西向旋轉、Ward預防、Waterbound在陸地失能、召喚失調／沉默不能啟用、地下施放不傷表面、傷害完全預防時Lethal不生效 |
| [Hellstar](https://sorcerytcg.com/cards/hellstar) | Airborne；不能Attack／Defend；己方回合開始對其他單位中心7四鄰5四角3的能力傷害 | 正式end→start觸發、自身免傷、不同region不受傷、不能攻單位或地點但仍可移動、不能加入防守、沉默移除禁止攻擊及start效果、不在對手start觸發 |
| [Day of Judgment](https://sorcerytcg.com/cards/day_of_judgment) | 六格十字中心7其餘3；中心上1下2左右各1，可四向旋轉但必須完整在realm；先放逐Evil僕從並處理後果，再傷害所有受影響square的單位 | 四角始終安全、完整十字選項、跨地表／地下／虛空、轉向長臂、多格相加、非指定故地點Ward不破而單位Ward可防傷、先放逐傷害預防來源後傷害、不觸發被放逐者Deathrite |

## 已核實的官方規則

- [Damage Grid](https://sorcerytcg.com/codex/015d636e-716c-450e-9e17-abef557f3e4c)：可旋轉與反射，除非卡牌另有限制；只影響原點所在區域；可讓部分圖案超出realm；圖案本身並不指定所有範圍內地點。
- [Oversized Units](https://sorcerytcg.com/codex/7f57fe26-eac3-45a4-b449-994fef47d872)：同時佔據多個受影響格時，把各格傷害相加。本次經另一實作子任務於官方頁查核，並有本組真實Mountain Giant測試。
- [Ward](https://sorcerytcg.com/codex/ae9b6774-aa8f-45c5-a424-d6d7e58014c3)：敵方地點Ward也保護該地點的位置免於被指定；移除目標後，依賴該目標的後續效果不結算；其他獨立效果盡量結算；多來源同時傷害亦只打破一次Ward。
- Flame Wave展開FAQ明確允許從左或右開始，但不能旋轉90度。
- Meteor Shower展開FAQ明確允許三目標只共角；「共邊」指相鄰格而不含對角線。
- Day of Judgment展開四項FAQ：允許旋轉；十字必須全部在realm因此四角安全；square涵蓋surface／subsurface／void；先放逐Evil僕從、完整處理放逐後果，再傷害六格單位。本實作以不同Storyline frame分隔放逐與傷害，並有傷害預防來源先被放逐的整合測試。
- Mester Stoor Worm與Hellstar官方頁沒有FAQ展開項，數字及形狀直接讀取卡面，套用上列Damage Grid／Lethal通則。能力傷害明確使用`ability`來源類型，不會誤算成Magic。

## 仍屬部分支援的界線

這11張均有實際施放／啟用／回合觸發、選擇及結算路徑，並非空白passive或僅改可選旗標。與全引擎既有的同時觸發排序、特殊多區域／全realm單位、強制指定Blasted Oak、Orb複製等全卡交互尚未全部驗收。

方向、Holy Nova替代中心與Meteor Shower多目標選擇由可序列化Storyline續接，支付後不可取消；沒有提供會吞掉費用的假取消按鈕。Wreathed使用原有location選擇入口。正式「先宣告所有目標再支付」流程仍應在全引擎施放流程統一改善。

Holy Nova目前提供友軍單位Ward的每個佔位、以及友軍地點Ward的地表位置作替代中心；地點Ward是否另可選其subsurface位置，沒有取得該卡特定FAQ，未擅自擴充。

Caster Silence follow-up: the normal engine caster enumeration formerly excluded all silenced non-Spellcasters before reading a spell's explicit Mortal/Beast/Dragon permission. Root removed that redundant early gate while retaining disabled/dying/controller and positive caster qualification. Three real dispatch tests cover Burning Hands by a silenced Mortal (directions and 2/1 damage), Firebreathing by a silenced Beast (4/1 grid damage), and rejected nonqualifying bodies/silenced native Skeleton Mage, including rejection of ordinary Zap casts. Latest grid suite: 47/47 passed.
