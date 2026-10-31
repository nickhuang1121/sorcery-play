# Magic Wave 6 逐卡稽核

2026-10-30。依`data/all-cards-audit/magics.json`未review條目按slug排序選六張，排除前批六張。只新增`tests/catalog-magics-wave6.test.js`及本doc，未改共用引擎／JSON／前批正式測試。

最新命令：`node --test tests/catalog-magics-wave6.test.js > /tmp/catalog-magics-wave6-valid-before.log 2>&1`，**20項17過3紅、exit1、0跳過**。正式test已穩定供root整合，三紅全列下；不能排除後說全綠。

| 卡牌 | 本批原生效果／操作證據 | 結果與尚未覆蓋 |
|---|---|---|
| Fire Harpoons! | 真手牌／cast-time target，JSON後對與水下Spellcaster不同region的水面Kelpie打1、pull至caster水下位置、真Atlas可選draw；Talus受1但不被force移動，仍draw；Ward擋damage+pull但不擋獨立draw；無合法adjacent-Water minion不能只cast取draw | 四效果case過，付2。使用能在水下存活的Spellcaster與Kelpie，不構造禁止進入水下的Avatar。未窮盡oversized多part、拉動路徑與所有terrain／強制移動交互 |
| Firebreathing | 真非Spellcaster Beast可作caster，普通非Spellcaster Mortal不列；選北，JSON，中心4、兩翼及遠格1、Below0、caster0；另已commit Magic的mandatory direction JSON後只付一次 | 兩效果case過。圖案沿既有官方卡面轉錄做代表回歸，本輪未讀到可辨識官方圖像，不能稱整個damage grid已重新視覺核對；未窮盡Dragon額外施法／多location caster |
| Flame Strike | 真cast北向，near3，第二排三格各1，Below0、超出範圍0；mandatory direction的JSON／付款一次 | 兩case過；同上圖像限制。普通resolution選方向已付費，並非可免費cancel的cast-time target；初稿誤假設已更正，見下 |
| Flame Wave | 真左右反射兩case，七／五／三／一對應各column、另一edge0；只bool反射選擇，不能90度旋轉；Below與Void0，JSON | 兩case過、付6。FAQ明允許flip、禁止rotate；本輪網頁只看到卡文，圖像刷新未完成，精確數字沿原轉錄代表回歸，未聲稱全圖全交互驗收 |
| Flanking Maneuver | 真cast選同Surface location多個ally、JSON→chess-knight馬步的Below目的地、選兩CaveTroll、敵人與原Below ally不列；另選zero allies | teleport各步及位置過，但兩case**紅**：印draw a card，definition卻drawOne/spells，沒有Atlas選項。兩case都期望真正Atlas top進手，不能只把已有Spellbook draw當正確 |
| Font of Life | 真cast，各ally按自身四Site連通水域（混敵控Site）heal4；Below ally也治療、Land0、孤立body1、敵人不療；Avatar水面Life10→14，JSON | 普通case過、付3；非anchor Giant**紅**：anchor11Land但佔12/17同一四Site水域，應heal4令damage5→1，現heal0仍5；同body重複接觸不能算兩次。多個不連通body選擇等尚未驗，不擅定其解釋 |

六張都各有原生mana／threshold正負控制（6過），不是只看playable flag或通用helper。這份清單是代表性已測維度，實際UI仍由root另驗；本agent無UI操作。

## 來源與限制

當日web成功 [Firebreathing](https://sorcerytcg.com/cards/firebreathing)、[Flame Wave](https://sorcerytcg.com/cards/flame_wave)。Fire Harpoons／FlameStrike／Flanking／Font頁工具不可存取，卡文／mana／threshold以repo官方snapshot核對，配合同日官方cache。

- Fire Harpoons：FAQ `eXfZjLHocReFQIApZdMuBo`（adjacent Water site不需與caster同region）；`ygoDG8fb7HS97qCW69oddu`（above/below文字使target可跨caster region）；`ygoDG8fb7HS97qCW69oRof`（無target不能只draw）。Forced Movement `8ffdae56-1aef-44f7-b9af-cdcbc334a377`明定pull是forced movement；Talus真卡文不能被force移動。
- Grid：Damage Grid `015d636e-716c-450e-9e17-abef557f3e4c`，同region，除非卡文另指定（FlameWave特指atop sites）；FlameWave flip FAQ `FWsVZ4rxgHCtjTP73mYcC8`、no-rotation FAQ `eXfZjLHocReFQIApZdNPsK`。
- Flanking：FAQ `eXfZjLHocReFQIApZdNPz6`明定馬步可以跨region；Teleport `148ecc13-72e8-46eb-812f-2c6f3b37cd6d`；Draw `c50821a8-cb00-4270-a252-25e5f9c077c1`明定card可選spell或site。
- Font：Body of Water `1122beef-02de-47bd-9aa6-8c471d03fdda`：控制者不影響連通body，its body就是該card所佔據body，不是錨點。Oversized `7f57fe26-eac3-45a4-b449-994fef47d872`實際佔據各location；Healing `f980ed60-def7-4a2d-87ca-589573087481`。

Grid圖片：官方Image連結可解析，但web工具回傳URL字串而非可讀圖。唯一嘗試公開CDN檔案GET到`/tmp/wave6-firebreathing.png`的curl在DNS解析失敗，exit6、Could not resolve host，未取得可視來源；沒有繞路、沒有重試、沒有要求額外權限。依root指示停止網路路徑嘗試並保留圖像驗證限制。

## 初稿誤假設的處理

初跑`/tmp/catalog-magics-wave6-before.log`為20項15過5紅，其中兩個是我誤將已commit並付款的ordinary grid resolution方向選擇當作可免費cancel。印卡要求選方向，該resolution沒有取消是合理；已將這兩case改為強驗付款一次、不可免費取消、JSON後強制選方向及4／3真傷害，沒有刪case或放寬傷害斷言。兩者不是引擎缺陷；目前三紅只剩Flanking×2、Font Giant。

## 相關 Avatar fixture 訂正

查本批Teleport時補讀Characteristics Codex `30561063-e0e1-41f7-9ab2-903475629dde`的Avatar Characteristics，明定Avatar只能進入Surface location。因此Flanking拒Avatar地下是正確，沒有要求修改。這也顯示前批Dredge的Below-Avatar fixture只能作invalid/external-save robustness，不可當合法可達規則證據。已立即告root，root回覆已更名並在Wave3 doc訂正，保留原斷言、不刪測；本批跨region caster使用minion Spellcaster，沒有重犯此問題。

本agent沒有聯絡睡眠使用者、未啟server，未改共享source。root統一修三紅後須跑本檔與交叉／完整套件，並按實際已覆蓋維度更新ledger，不自動標full。

## 根修後正式結果：本批20／20，交叉37／37

root統一修補Flanking Maneuver為`drawCards count:1`（保留Atlas／Spellbook選擇），以及Font of Life在**只佔一個連通body**時按全occupied找到該body、去重只計一次。修補後正式交叉log為`/tmp/wave9-minions-magics-after.log`：**37項37過、0失敗、0跳過**；本agent讀回逐列確認其中`✔ Wave6`恰20列，也就是本批20項全部通過。先前3個真紅在正式套件中關閉，沒有移除或放寬其draw／heal斷言。

Font限制必須保留：若大型單位同時佔兩個互不連通的水域，Codex本輪未明說如何選擇或計算；root僅修已確認的single-body非anchor問題，multiple-body維持先前anchor行為。**保留舊行為不代表它已獲官方證明正確**，也不採自行加總家規。兩body場景尚未核實，不能把本單bodycase通過當整張Font所有大型交互完成。

Grid圖限制未解除：root確認5500目前顯示的是程式重建文字卡，並非原官方damage-grid卡面，故不能用此UI宣稱數字已視覺核對。本批20綠代表原生施放、已列效果／邊界、成本與JSON流程過；三張grid的官方原圖仍未刷新，來源限制與未測交互仍照前文保留。

本批正式test檔持續20項穩定，沒有擴新牌或改共享source；完整最新全庫回歸由root另跑。睡眠使用者未被本agent聯絡。

## Original printed grid source now visually refreshed

2026-10-30T22:30Z: root actually rendered official Firebreathing/FlameStrike/FlameWave pages in background IAB6 and visually inspected printed images, superseding earlier web-tool image availability limits. Source URLs, image versions, exact transcription and screenshots in data/official-grid-visual-validation-20261030.json / data/official-grid-evidence/. Existing representative numeric tests are consistent with these independently seen originals. This resolves image-source limitation only; other card boundaries/UI remain pending.
